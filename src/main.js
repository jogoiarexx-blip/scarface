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
import { manager } from './assets.js';
import { loadPeople } from './people.js';
import { isNight } from './nightlight.js';

// Tela inicial mostra o progresso; o jogo só começa com tudo carregado
const startText = document.getElementById('start-text');
let ready = false;
manager.onProgress = (url, loaded, total) => {
  if (!ready) startText.textContent = `Carregando gráficos… ${Math.round((loaded / total) * 100)}%`;
};
manager.onLoad = () => {
  ready = true;
  startText.textContent = 'Clique para jogar';
};

const graphics = new Graphics();
const world = createWorld(graphics.renderer);
graphics.setup(world.scene, world.camera, world.sun);
const city = buildCity(world.scene);
const effects = new Effects(world.scene);
const [, planes, animals] = await Promise.all([
  loadPeople(),
  loadPlanes(world.scene, effects),
  loadAnimals(world.scene, city.colliders, city.blocks.filter((b) => b.type === 'park')),
]);
const player = new Player(world.scene, 7.5, 12);
const traffic = new Traffic(world.scene);
const peds = new Pedestrians(world.scene);
const rig = new CameraRig(world.camera);
const hud = new Hud();

// Farol de verdade no carro do jogador à noite (os outros carros só têm o facho pintado no chão).
// Fica sempre na cena com intensidade 0 de dia, para não recompilar os materiais ao ligar.
const headlight = new THREE.SpotLight('#fff2d9', 0, 80, 0.5, 0.55, 1.2);
world.scene.add(headlight, headlight.target);

// Um carro estacionado do lado de onde o jogador começa
const firstCar = traffic.cars.find((c) => c.mode === 'parked');
firstCar.pos.set(5, 0, 16);
firstCar.heading = Math.PI;
firstCar.sync();

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
function exitAt(pos, heading, sideDist) {
  const side = heading + Math.PI / 2;
  player.place(pos.x + Math.sin(side) * sideDist, pos.z + Math.cos(side) * sideDist, heading);
  player.mesh.visible = true;
  mode = 'foot';
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

// Sem trava do mouse (alguns navegadores bloqueiam) dá para girar a câmera arrastando
const canvasEl = graphics.renderer.domElement;
const lockMouse = () => Promise.resolve(canvasEl.requestPointerLock?.()).catch(() => {});
const start = document.getElementById('start');
start.addEventListener('click', () => {
  if (!ready) return;
  start.style.display = 'none';
  lockMouse();
});
canvasEl.addEventListener('click', lockMouse);

// Acesso pelo console do navegador, útil para depurar
window.game = { world, graphics, player, traffic, peds, planes, animals, rig, tick, get plane() { return plane; }, get mode() { return mode; }, get car() { return car; } };

const timer = new THREE.Timer();
function frame(time) {
  requestAnimationFrame(frame);
  if (window.game.frozen) return; // pausa para inspecionar pelo console
  timer.update(time);
  const realDt = timer.getDelta();
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

  if (mode === 'foot') {
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
    player.sync();
  }
  traffic.update(dt, input, city.colliders, mode === 'foot' ? [...peds.peds, player] : peds.peds);
  peds.update(dt, mode === 'car' ? car : null, mode === 'car' ? car.pos : mode === 'plane' ? plane.pos : player.pos);
  for (const p of planes) p.update(dt, input, city.colliders, mode === 'plane' && p === plane);
  effects.update(dt);
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
    rig.follow(dt, player.pos, { dist: 6, height: 1.6 });
    focus = player.pos;
    heading = player.heading;
  } else if (mode === 'car') {
    rig.follow(dt, car.pos, { dist: 10, height: 2.2, heading: car.heading, speed: car.speed });
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
  }
  hud.showPrompt(prompt);
  hud.update(dt, { mode, car, plane, planes, focus, heading, cars: traffic.cars });

  if (render) graphics.render();
  input.endFrame();
}
requestAnimationFrame(frame);
