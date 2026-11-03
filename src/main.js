import * as THREE from 'three';
import { createWorld } from './world.js';
import { buildCity } from './city.js';
import { input } from './input.js';
import { Player } from './player.js';
import { CameraRig } from './camera.js';
import { Traffic } from './traffic.js';
import { Pedestrians } from './pedestrians.js';
import { loadPlanes } from './plane.js';
import { loadAnimals } from './animals.js';
import { Effects } from './effects.js';
import { Hud } from './hud.js';
import { Graphics } from './graphics.js';
import { manager, textureStats, onTextureProgress, getTextureLimit } from './assets.js';
import { loadPeople } from './people.js';
import { isNight } from './nightlight.js';
import { VesperDistrict } from './vesper.js';
import { Campaign } from './campaign.js';
import { resolveCircle } from './collision.js';
import { DebugOverlay } from './debug.js';


const start = document.getElementById('start');
const startText = document.getElementById('start-text');
const loadStatus = document.getElementById('load-status');
const loadBar = document.getElementById('load-bar');
const loadTrack = document.getElementById('load-track');
const continueButton = document.getElementById('continue-game');
const newButton = document.getElementById('new-game');
const optionsPanel = document.getElementById('start-options');
const creditsPanel = document.getElementById('start-credits');
const qualitySelect = document.getElementById('graphics-quality');
const textureSelect = document.getElementById('texture-quality');
let ready = false, playing = false, paused = false, extrasStarted = false;
let menuStage = 'Preparando terreno e ruas…';
const pauseMenu = document.getElementById('pause-menu');
const empirePanel = document.getElementById('empire-panel');
function refreshProgress() {
  if (ready) {
    loadStatus.textContent = 'Pronto para jogar';
    startText.textContent = textureStats.complete + '/' + textureStats.total + ' texturas processadas; as restantes continuam durante o jogo.';
  } else {
    loadStatus.textContent = menuStage;
    startText.textContent = textureStats.complete + '/' + textureStats.total + ' texturas processadas. A preparação inicial continua.';
  }
}
function progress(value, message) {
  menuStage = message;
  loadBar.style.width = value + '%';
  loadTrack.setAttribute('aria-valuenow', String(value));
  refreshProgress();
}
onTextureProgress(refreshProgress);
manager.onError = url => console.warn('Recurso indisponível:', url);
const showPanel = panel => { optionsPanel.hidden = panel !== optionsPanel; creditsPanel.hidden = panel !== creditsPanel; };
document.getElementById('open-options').addEventListener('click', () => showPanel(optionsPanel));
document.getElementById('options-close').addEventListener('click', () => showPanel(null));
document.getElementById('open-credits').addEventListener('click', () => showPanel(creditsPanel));
document.getElementById('credits-close').addEventListener('click', () => showPanel(null));
textureSelect.value = String(getTextureLimit());
let savedGraphics = 1;
try {
  const value = Number(localStorage.getItem('vespera-graphics-level'));
  if (Number.isInteger(value) && value >= 0 && value <= 3) savedGraphics = value;
} catch { /* modo privado */ }
qualitySelect.value = String(savedGraphics);
document.getElementById('options-save').addEventListener('click', () => {
  const detail = Number(textureSelect.value), oldDetail = getTextureLimit();
  if (![512,1024,2048].includes(detail)) return;
  graphics.auto = false;
  graphics.apply(Number(qualitySelect.value));
  try {
    localStorage.setItem('vespera-graphics-level', qualitySelect.value);
    localStorage.setItem('vespera-texture-limit', String(detail));
  } catch { /* preferências indisponíveis */ }
  if (detail !== oldDetail) {
    loadStatus.textContent = 'Reabrindo com novo detalhe de texturas…';
    location.reload();
    return;
  }
  showPanel(null);
});

const graphics = new Graphics();
graphics.level = savedGraphics;
graphics.auto = savedGraphics === 1;
const world = createWorld(graphics.renderer);
graphics.setup(world.scene, world.camera, world.sun);
const city = buildCity(world.scene);
const effects = new Effects(world.scene);
progress(35, 'Carregando personagens essenciais…');
await loadPeople(true);
progress(65, 'Inicializando tráfego e campanha…');
let planes = [];
let animals = { update() {} };
const player = new Player(world.scene, 7.5, 12);
const traffic = new Traffic(world.scene);
const peds = new Pedestrians(world.scene);
const rig = new CameraRig(world.camera);
const hud = new Hud();
const vesper = new VesperDistrict(world.scene, city.colliders, city.blocks);
const campaign = new Campaign(vesper, player, (message, secs) => hud.toast(message, secs));
const debug = new DebugOverlay(graphics, vesper);
function setPaused(next) {
  paused = next;
  pauseMenu.hidden = !next;
  if (next) document.exitPointerLock?.();
  else canvasEl.requestPointerLock?.().catch(() => {});
}
document.getElementById('resume-game').addEventListener('click', () => setPaused(false));
document.getElementById('save-game').addEventListener('click', () => {
  hud.toast(campaign.save(savePosition()) ? 'Jogo salvo neste navegador.' : 'Não foi possível salvar.');
});
document.getElementById('close-empire').addEventListener('click', () => campaign.toggleEmpire(false));
document.getElementById('back-to-menu').addEventListener('click', () => {
  campaign.save(savePosition());
  playing = false; paused = false; pauseMenu.hidden = true;
  document.exitPointerLock?.();
  start.hidden = false; showPanel(null);
  continueButton.disabled = !campaign.hasSavedGame;
});
ready = true;
continueButton.disabled = !campaign.hasSavedGame;
newButton.disabled = false;
progress(100, 'Pronto para jogar');

// Farol de verdade no carro do jogador à noite (os outros carros só têm o facho pintado no chão).
// Fica sempre na cena com intensidade 0 de dia, para não recompilar os materiais ao ligar.
const headlight = new THREE.SpotLight('#fff2d9', 0, 80, 0.5, 0.55, 1.2);
world.scene.add(headlight, headlight.target);

// Um carro estacionado do lado de onde o jogador começa
const firstCar = traffic.cars.find((c) => c.mode === 'parked');
if (firstCar) {
  firstCar.pos.set(5, 0, 16);
  firstCar.heading = Math.PI;
  firstCar.sync();
}

let mode = 'foot'; // 'foot' | 'car' | 'plane'
let car = null;
let plane = null; // avião que o jogador está pilotando (ou pilotou por último)
let crashShown = false;

function nearestVehicle() {
  const c = traffic.nearest(player.pos, 5.5);
  if (c) return { type: 'car', car: c };
  const p = planes.find((q) => !q.crashed && q.pos.distanceTo(player.pos) < q.cfg.enterDist);
  return p ? { type: 'plane', plane: p } : null;
}

// Sai pelo lado esquerdo (do motorista)
function safeExitPosition(pos, heading, sideDist) {
  const side = heading + Math.PI / 2;
  // Escolhe o lado com a rota mais livre, em vez de nascer dentro de uma parede.
  const options = [1, -1].map((direction) => {
    const test = new THREE.Vector3(pos.x + Math.sin(side) * sideDist * direction, 0.2, pos.z + Math.cos(side) * sideDist * direction);
    const original = test.clone();
    resolveCircle(test, player.radius, city.colliders);
    return { test, displacement: test.distanceToSquared(original) };
  });
  options.sort((a, b) => a.displacement - b.displacement);
  const where = options[0].test;
  return where;
}
function exitAt(pos, heading, sideDist) {
  const where = safeExitPosition(pos, heading, sideDist);
  player.place(where.x, where.z, heading);
  player.mesh.visible = true;
  mode = 'foot';
}
function savePosition() {
  if (mode === 'car') return safeExitPosition(car.pos, car.heading, 3.1);
  if (mode === 'plane') return safeExitPosition(plane.pos, Math.atan2(plane.fwd.x, plane.fwd.z), plane.cfg.exitDist + 2);
  return player.pos;
}

function toggleVehicle() {
  if (mode === 'foot') {
    const v = nearestVehicle();
    if (!v) return;
    player.mesh.visible = false;
    if (v.type === 'plane') {
      plane = v.plane;
      mode = 'plane';
      hud.toast('Segure W para acelerar', 2);
      return;
    }
    car = v.car;
    if (car.mode === 'ai') {
      peds.ejectDriver(car);
      hud.toast('Carro roubado!', 1.5);
    }
    car.mode = 'player';
    mode = 'car';
    if (car === firstCar) campaign.onCarEntered();
    else if (campaign.state.mission.step === 'enter_car') hud.toast('Procure o carro da Oficina Valença para concluir a missão.');
  } else if (mode === 'car') {
    if (Math.abs(car.speed) > 8) return hud.toast('Diminua a velocidade para sair', 1.5);
    car.mode = 'parked';
    exitAt(car.pos, car.heading, 2.2);
    car = null;
  } else if (mode === 'plane') {
    if (!plane.onGround || plane.speed > 3) return hud.toast('Pare o avião no chão para sair', 1.5);
    exitAt(plane.pos, Math.atan2(plane.fwd.x, plane.fwd.z), plane.cfg.exitDist);
  }
}

function handleCrash() {
  for (const p of planes) {
    if (!p.crashed) continue;
    const mine = mode === 'plane' && p === plane;
    if (mine && !crashShown) {
      hud.toast('💥 O avião caiu!', 3);
      crashShown = true;
    }
    if (p.crashTimer > 0) continue;
    p.reset();
    if (mine) {
      exitAt(p.pos, p.cfg.spawn.heading, p.cfg.exitDist + 2);
      crashShown = false;
    }
  }
}


const canvasEl = graphics.renderer.domElement;
const lockMouse = () => Promise.resolve(canvasEl.requestPointerLock?.()).catch(() => {});
function loadExtras() {
  if (extrasStarted) return;
  extrasStarted = true;
  setTimeout(async () => {
    try { planes = await loadPlanes(world.scene, effects); }
    catch (error) { console.warn('Aviões indisponíveis', error); }
    try { await loadPeople(false); }
    catch (error) { console.warn('Personagens extras indisponíveis', error); }
    try { animals = await loadAnimals(world.scene, city.colliders, city.blocks.filter(b => b.type === 'park')); }
    catch (error) { console.warn('Animais indisponíveis', error); }
    world.warmSky();
  }, 700);
}
function beginGame(newGame) {
  if (!ready) return;
  if (newGame) {
    if (campaign.hasSavedGame && !window.confirm('Iniciar novo jogo e substituir o progresso salvo neste navegador?')) return;
    if (mode === 'car' && car) { car.mode = 'parked'; car = null; }
    mode = 'foot';
    player.mesh.visible = true;
    campaign.reset();
  }
  playing = true; paused = false; pauseMenu.hidden = true;
  showPanel(null); start.hidden = true;
  continueButton.disabled = false;
  loadExtras();
  lockMouse();
}
continueButton.addEventListener('click', () => beginGame(false));
newButton.addEventListener('click', () => beginGame(true));
canvasEl.addEventListener('click', () => { if (playing && !paused && empirePanel.hidden) lockMouse(); });

// Acesso pelo console do navegador, útil para depurar
window.game = { world, graphics, city, vesper, campaign, debug, player, traffic, peds, get planes() { return planes; }, get animals() { return animals; }, rig, tick, get plane() { return plane; }, get mode() { return mode; }, get car() { return car; } };

const timer = new THREE.Timer();
function frame(time) {
  requestAnimationFrame(frame);
  timer.update(time);
  const realDt = timer.getDelta();
  if (input.pressed('Escape') || input.pressed('KeyP')) {
    if (!empirePanel.hidden) campaign.toggleEmpire(false);
    else if (playing) setPaused(!paused);
  }
  if (input.pressed('KeyI') && playing) {
    campaign.toggleEmpire();
    if (!empirePanel.hidden) document.exitPointerLock?.();
  }
  if (!playing || paused || !empirePanel.hidden || window.game.frozen) {
    input.consumeMouse();
    input.endFrame();
    if (playing) graphics.render();
    return;
  }
  const warning = graphics.monitor(realDt);
  if (warning) hud.toast(warning, 2.5);
  tick(Math.min(realDt, 0.05));
}

function tick(dt, render = true) {
  const mouse = input.consumeMouse();
  if (mode !== 'plane') rig.rotate(mouse.x, mouse.y);
  if (input.pressed('KeyF')) toggleVehicle();
  if (input.pressed('KeyG')) hud.toast(`Gráficos: ${graphics.cycle()}`, 1.5);
  if (input.pressed('KeyH')) hud.toast(world.toggleSky(), 1.5);
  if (input.pressed('F3')) debug.toggle();
  if (input.pressed('KeyK')) hud.toast(campaign.save(savePosition()) ? 'Jogo salvo.' : 'Falha ao salvar.');

  if (mode === 'foot') {
    if (input.pressed('KeyE')) campaign.onInteraction(vesper.interact(player.pos));
    player.update(dt, input, rig.yaw, city.colliders);
    // Não atravessa carros
    for (const c of traffic.cars) {
      const dx = player.pos.x - c.pos.x;
      const dz = player.pos.z - c.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 2.4 && d > 1e-4) {
        player.pos.x += (dx / d) * (2.4 - d);
        player.pos.z += (dz / d) * (2.4 - d);
      }
    }
    resolveCircle(player.pos, player.radius, city.colliders);
    player.sync();
  }
  traffic.update(dt, input, city.colliders, mode === 'foot' ? [...peds.peds, player] : peds.peds);
  peds.update(dt, mode === 'car' ? car : null, mode === 'car' ? car.pos : mode === 'plane' ? plane.pos : player.pos);
  for (const p of planes) p.update(dt, input, city.colliders, mode === 'plane' && p === plane);
  effects.update(dt);
  vesper.update(dt, mode === 'foot' ? player.pos : mode === 'car' ? car.pos : plane.pos);
  campaign.tick(dt, mode === 'foot' ? vesper.activeInterior : null);
  handleCrash();
  if (mode === 'car' && isNight()) {
    const fx = Math.sin(car.heading);
    const fz = Math.cos(car.heading);
    headlight.position.set(car.pos.x + fx * 2.4, 0.9, car.pos.z + fz * 2.4);
    headlight.target.position.set(car.pos.x + fx * 22, 0, car.pos.z + fz * 22);
    headlight.intensity = 300;
  } else headlight.intensity = 0;

  let focus;
  let heading;
  if (mode === 'foot') {
    rig.follow(dt, player.pos, { dist: vesper.activeInterior ? 3.2 : 6, height: 1.6, colliders: city.colliders });
    focus = player.pos;
    heading = player.heading;
  } else if (mode === 'car') {
    rig.follow(dt, car.pos, { dist: 10, height: 2.2, heading: car.heading, speed: car.speed, colliders: city.colliders });
    focus = car.pos;
    heading = car.heading;
  } else {
    rig.chase(dt, plane.pos, plane.quat, plane.cfg.camDist, plane.cfg.camUp);
    focus = plane.pos;
    heading = Math.atan2(plane.fwd.x, plane.fwd.z);
  }
  world.followSun(focus);
  animals.update(dt, focus, mode === 'foot' ? player : null, mode === 'car' ? car : null);

  let prompt = null;
  if (mode === 'foot') {
    const v = nearestVehicle();
    if (v) prompt = v.type === 'plane' ? `F — pilotar o ${v.plane.cfg.name}` : v.car.mode === 'ai' ? 'F — roubar o carro' : 'F — entrar no carro';
    const interaction = vesper.nearest(player.pos);
    if (interaction) prompt = interaction.label;
  }
  hud.showPrompt(prompt);
  hud.update(dt, { mode, car, plane, planes, focus, heading, cars: traffic.cars, target: campaign.target() });

  if (render) graphics.render();
  debug.update(dt, focus);
  input.endFrame();
}
requestAnimationFrame(frame);
