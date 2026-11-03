import * as THREE from 'three';
import { STYLES } from './profiles.js';
import { styleGeometry, wheelGeometry } from './carGeometry.js';
import { box, cyl, mergedMesh } from '../geom.js';
import { plateTexture, blobTexture, signTexture, beamTexture } from '../textures.js';
import { isNight } from '../nightlight.js';
import { clamp } from '../util.js';

const GLASS = new THREE.MeshPhysicalMaterial({
  color: '#0b1117', metalness: 0.2, roughness: 0.03, transparent: true, opacity: 0.85, side: THREE.DoubleSide, envMapIntensity: 1.6,
});
const TRIM = new THREE.MeshStandardMaterial({ color: '#141517', roughness: 0.55, side: THREE.DoubleSide });
const CHROME = new THREE.MeshStandardMaterial({ color: '#e8ebee', metalness: 1, roughness: 0.08 });
const RUBBER = new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.92, side: THREE.DoubleSide });
const ALLOY = new THREE.MeshStandardMaterial({ color: '#cfd3d8', metalness: 1, roughness: 0.22 });
const HEAD = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff3d6', emissiveIntensity: 0.8, roughness: 0.1 });
const TAIL = new THREE.MeshStandardMaterial({ color: '#5a0000', emissive: '#ff2020', emissiveIntensity: 0.6, roughness: 0.25 });
const signTex = signTexture('TÁXI', '#f4f4f0', '#111111');
const SIGN = new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: '#ffffff', emissiveIntensity: 0.6 });
const BEAM = new THREE.MeshBasicMaterial({
  map: beamTexture(), color: '#fff2d9', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
});
const BLOB = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

// Pintura com verniz (clearcoat): o reflexo do céu corre pela lataria
const paints = new Map();
function paintMaterial({ color, metal }) {
  const key = `${color}-${metal}`;
  if (!paints.has(key)) {
    paints.set(key, new THREE.MeshPhysicalMaterial({ color, metalness: metal, roughness: 0.38 - metal * 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }));
  }
  return paints.get(key);
}

// Versão simples para carros longe da câmera (uma única chamada de desenho)
function lowDetail(p, color) {
  const cabinLen = p.cabin ? p.cabin[p.ws[1]][0] - p.cabin[p.rw[1]][0] + 0.6 : 0;
  const cabinZ = p.cabin ? (p.cabin[p.ws[1]][0] + p.cabin[p.rw[1]][0]) / 2 : 0;
  const parts = [box(p.W, p.belt - p.bottom + 0.05, p.L, color, [0, (p.belt + p.bottom) / 2, 0])];
  if (p.cabin) parts.push(box(p.cabinW * 0.92, p.roof - p.belt, cabinLen, '#1a2128', [0, (p.roof + p.belt) / 2, cabinZ]));
  for (const z of [p.axleF, p.axleR]) for (const s of [-1, 1]) parts.push(cyl(p.wheelR, p.wheelR, p.tireW, 10, '#151515', [s * (p.W / 2 - p.tireW / 2), p.wheelR, z], [0, 0, Math.PI / 2]));
  return mergedMesh(parts);
}

const blobGeo = new Map();
// Girado para a parte forte do facho ficar junto ao carro
const beamGeo = new THREE.PlaneGeometry(5, 16).rotateX(-Math.PI / 2).rotateY(Math.PI);

export class CarModel {
  constructor(styleName, paint) {
    const p = STYLES[styleName];
    const G = styleGeometry(styleName);
    this.style = p;
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    const high = new THREE.Group();
    high.add(this.body);
    const add = (geometry, material, cast = false) => {
      const m = new THREE.Mesh(geometry, material);
      m.castShadow = cast;
      m.receiveShadow = true;
      this.body.add(m);
    };
    add(G.paint, paintMaterial(paint), true);
    add(G.glass, GLASS);
    add(G.trim, TRIM, true);
    add(G.chrome, CHROME);
    this.head = HEAD.clone();
    add(G.head, this.head);
    this.brake = TAIL.clone();
    add(G.tail, this.brake);
    add(G.plates, new THREE.MeshStandardMaterial({ map: plateTexture(), roughness: 0.45, metalness: 0.2 }));
    if (G.sign) add(G.sign, SIGN);

    this.wheels = [];
    const W = wheelGeometry(p.wheelR, p.tireW);
    for (const [z, front] of [[p.axleF, true], [p.axleR, false]]) {
      for (const s of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(s * (p.W / 2 - p.tireW / 2 - 0.04), p.wheelR, z);
        const spin = new THREE.Group();
        for (const [geo, mat] of [[W.rubber, RUBBER], [W.alloy, ALLOY]]) {
          const m = new THREE.Mesh(geo, mat);
          m.castShadow = true;
          spin.add(m);
        }
        pivot.add(spin);
        high.add(pivot);
        this.wheels.push({ pivot, spin, front });
      }
    }

    this.lod = new THREE.LOD();
    this.lod.addLevel(high, 0);
    this.lod.addLevel(lowDetail(p, paint.color), 75);

    if (!blobGeo.has(styleName)) blobGeo.set(styleName, new THREE.PlaneGeometry(p.W * 1.35, p.L * 1.12).rotateX(-Math.PI / 2));
    const blob = new THREE.Mesh(blobGeo.get(styleName), BLOB);
    blob.position.y = 0.04;
    blob.renderOrder = 1;
    // Facho dos faróis no chão, só à noite
    this.beam = new THREE.Mesh(beamGeo, BEAM);
    this.beam.position.set(0, 0.05, p.L / 2 + 8);
    this.beam.renderOrder = 2;
    this.beam.visible = false;
    this.root.add(this.lod, blob, this.beam);
    this.roll = 0;
    this.pitch = 0;
  }

  // Faróis e lanternas: apagados no carro estacionado, mais fortes à noite, lanterna forte na freada
  setLights(on, braking = false) {
    const night = isNight();
    this.head.emissiveIntensity = on ? (night ? 4 : 0.8) : 0;
    this.brake.emissiveIntensity = braking ? 5 : on ? (night ? 1.6 : 0.6) : 0;
    this.beam.visible = on && night;
  }

  // steer: ângulo das rodas da frente; accel: variação da velocidade (m/s²)
  animate(dt, speed, steer, accel, braking) {
    const p = this.style;
    const turn = (speed / p.wheelR) * dt;
    for (const w of this.wheels) {
      w.spin.rotation.x += turn;
      if (w.front) w.pivot.rotation.y = steer;
    }
    this.setLights(true, braking);
    // A carroceria inclina para fora na curva e mergulha na freada
    const k = Math.min(1, dt * 6);
    this.roll += (clamp(steer * Math.abs(speed) * 0.012, -0.05, 0.05) - this.roll) * k;
    this.pitch += (clamp(-accel * 0.004, -0.035, 0.035) - this.pitch) * k;
    this.body.rotation.set(this.pitch, 0, this.roll);
  }
}
