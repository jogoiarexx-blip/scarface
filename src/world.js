import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { part, mergedMesh } from './geom.js';
import { manager, polyHavenMaterial, addMacroVariation } from './assets.js';
import { setNight } from './nightlight.js';

// Direção do sol. Começa num valor padrão e depois é lida do próprio céu HDR.
export const SUN_DIR = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(52), THREE.MathUtils.degToRad(135));

// Céus fotográficos 360° (Poly Haven, CC0). Toda a luz e os reflexos do jogo vêm deles.
const SKIES = {
  day: { file: 'assets/hdri/day_4k.hdr', name: 'Dia', sun: 3.2, exposure: 0.9, brightness: 0.47 },
  sunset: { file: 'assets/hdri/sunset_2k.hdr', name: 'Pôr do sol', sun: 2.6, exposure: 1, brightness: 0.47 },
  night: { file: 'assets/hdri/night_4k.hdr', name: 'Noite', sun: 0.5, exposure: 1.1, brightness: 0.04, night: true },
};
const ORDER = ['day', 'sunset', 'night'];

const ZENITH = new THREE.Color('#2f6fc4');
const HORIZON = new THREE.Color('#d9e6ef');
const GROUND = new THREE.Color('#5d5f55');

// Céu de reserva em degradê, usado só enquanto o HDR carrega
function skyDome(radius) {
  const g = new THREE.SphereGeometry(radius, 48, 24);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const dir = new THREE.Vector3();
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    dir.fromBufferAttribute(pos, i).normalize();
    if (dir.y >= 0) c.copy(HORIZON).lerp(ZENITH, Math.pow(dir.y, 0.55));
    else c.copy(HORIZON).lerp(GROUND, Math.min(1, -dir.y * 6));
    c.toArray(colors, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
  return new THREE.Mesh(g, m);
}

// Acha o sol (o pixel mais forte da metade de cima), o brilho médio do céu e a cor do horizonte,
// para a luz e a neblina combinarem com a foto
function analyzeSky(tex) {
  const { data, width: w, height: h } = tex.image;
  const val = data instanceof Uint16Array ? (i) => THREE.DataUtils.fromHalfFloat(data[i]) : (i) => data[i];
  let best = -1;
  let bi = 0;
  let sum = 0;
  let count = 0;
  for (let y = 0; y < h / 2; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      const l = val(i) + val(i + 1) + val(i + 2);
      sum += Math.min(0.2126 * val(i) + 0.7152 * val(i + 1) + 0.0722 * val(i + 2), 10);
      count++;
      if (l > best) {
        best = l;
        bi = i;
      }
    }
  }
  const avg = sum / count;
  const p = bi / 4;
  const u = ((p % w) + 0.5) / w;
  const v = 1 - (Math.floor(p / w) + 0.5) / h;
  const az = (u - 0.5) * Math.PI * 2;
  const el = (v - 0.5) * Math.PI;
  const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  const sunColor = new THREE.Color(val(bi), val(bi + 1), val(bi + 2));
  sunColor.multiplyScalar(1 / Math.max(sunColor.r, sunColor.g, sunColor.b));
  const horizon = new THREE.Color();
  const row = Math.floor(h * (0.5 - 3 / 180));
  let n = 0;
  for (let x = 0; x < w; x += 8, n++) {
    const i = (row * w + x) * 4;
    horizon.r += val(i);
    horizon.g += val(i + 1);
    horizon.b += val(i + 2);
  }
  horizon.multiplyScalar(1 / n);
  return { dir, sunColor, horizon, avg };
}

export function createWorld(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 4000);

  const sky = skyDome(3000);
  sky.renderOrder = -1;
  scene.add(sky);
  scene.fog = new THREE.Fog(HORIZON.clone(), 300, 2000);

  scene.add(new THREE.HemisphereLight('#cfe3ff', '#5a5040', 0.2));

  // O sol acompanha o jogador para a sombra ter boa resolução onde importa
  const sun = new THREE.DirectionalLight('#fff1d6', 3);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 10, far: 900 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  // Chão de grama fotográfica (15 m por repetição) com manchas para não parecer azulejo
  const grassMat = addMacroVariation(polyHavenMaterial('aerial_grass_rock'), 0.08);
  for (const t of [grassMat.map, grassMat.normalMap, grassMat.aoMap]) t.repeat.set(400, 400);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const clouds = createClouds();
  scene.add(clouds);

  const hdrLoader = new HDRLoader(manager);
  const loaded = {};
  let current = null;

  function applySky(key, tex) {
    const s = SKIES[key];
    tex.userData.analysis ??= analyzeSky(tex);
    const a = tex.userData.analysis;
    // Cada céu é ajustado para um brilho médio; assim o pôr do sol não estoura e a noite fica escura
    const k = s.brightness / a.avg;
    scene.background = tex;
    scene.environment = tex;
    scene.backgroundIntensity = k;
    scene.environmentIntensity = k;
    renderer.toneMappingExposure = s.exposure;
    // Com o sol rente ao horizonte o chão ficaria sem luz: a luz direta fica a pelo menos 8°
    SUN_DIR.copy(a.dir);
    if (SUN_DIR.y < 0.14) SUN_DIR.setY(0.14).normalize();
    sun.color.copy(a.sunColor);
    sun.intensity = s.sun;
    const fog = a.horizon.clone().multiplyScalar(k);
    fog.multiplyScalar(1 / Math.max(1, fog.r, fog.g, fog.b));
    scene.fog.color.copy(fog);
    clouds.material.emissive.copy(fog).multiplyScalar(0.5);
    sky.visible = false;
    setNight(!!s.night);
    current = key;
  }

  function setSky(key) {
    if (loaded[key]) return applySky(key, loaded[key]);
    hdrLoader.load(SKIES[key].file, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      loaded[key] = tex;
      applySky(key, tex);
    });
  }
  setSky('day');

  // Tecla H: dia, pôr do sol e noite
  function toggleSky() {
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setSky(next);
    return SKIES[next].name;
  }

  // O céu de reserva anda com a câmera; o sol anda com o jogador em passos de um pixel da sombra, para ela não "tremer"
  const snapped = new THREE.Vector3();
  function followSun(target) {
    sky.position.copy(camera.position);
    const step = 240 / sun.shadow.mapSize.x;
    snapped.set(Math.round(target.x / step) * step, 0, Math.round(target.z / step) * step);
    sun.position.copy(snapped).addScaledVector(SUN_DIR, 450);
    sun.target.position.copy(snapped);
  }

  return { scene, camera, sun, followSun, toggleSky };
}

function createClouds() {
  const parts = [];
  for (let i = 0; i < 70; i++) {
    const x = (Math.random() - 0.5) * 3600;
    const z = (Math.random() - 0.5) * 3600;
    const y = 220 + Math.random() * 140;
    const n = 4 + Math.floor(Math.random() * 5);
    for (let k = 0; k < n; k++) {
      const r = 14 + Math.random() * 18;
      const g = new THREE.IcosahedronGeometry(r, 2);
      g.scale(1, 0.55, 1);
      parts.push(part(g, '#ffffff', [x + (k - n / 2) * 16, y + Math.random() * 6, z + (Math.random() - 0.5) * 20]));
    }
  }
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#c9d4de', emissiveIntensity: 0.4, roughness: 1, transparent: true, opacity: 0.92 });
  return mergedMesh(parts, mat, false);
}
