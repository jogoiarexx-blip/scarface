
import * as THREE from 'three';
import { loadTexture } from './assets.js';

// Um atlas WebP de 640×320 (~6,8 KB) reúne placa, vitrine, serviços e porta.
// As quatro peças usam a mesma textura, sem downloads ou materiais duplicados.
const ATLAS_W = 1024;
const ATLAS_H = 512;
const RECTS = Object.freeze({
  sign: [0, 0, 1024, 150],
  window: [0, 151, 345, 392],
  services: [346, 151, 492, 394],
  door: [493, 151, 650, 511],
  interior: [651, 151, 1024, 405],
});
let sharedTexture;
let sharedMaterial;
function getTexture() {
  sharedTexture ??= loadTexture('assets/oficina-valenca/fachada-atlas.webp', {
    srgb: true, priority: 0, maxSize: 1024,
  });
  return sharedTexture;
}
function atlasPlane(group, name, x, y, z, w, h, separateMaterial = false) {
  const texture = getTexture();
  const geometry = new THREE.PlaneGeometry(w, h);
  const uv = geometry.attributes.uv;
  const [left, top, right, bottom] = RECTS[name];
  const u0 = (left + 0.5) / ATLAS_W;
  const u1 = (right - 0.5) / ATLAS_W;
  const v0 = 1 - (bottom - 0.5) / ATLAS_H;
  const v1 = 1 - (top + 0.5) / ATLAS_H;
  // A fachada olha para a rua no eixo -Z. Girar o plano requer inverter U:
  // sem isso, o nome 'OFICINA VALENÇA' aparece espelhado.
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    uv.setXY(i, u1 - u * (u1 - u0), v0 + v * (v1 - v0));
  }
  const material = separateMaterial
    ? new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, color: 0xffffff })
    : (sharedMaterial ??= new THREE.MeshBasicMaterial({
        map: texture, side: THREE.DoubleSide, color: 0xffffff,
      }));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = Math.PI;
  group.add(mesh);
  return mesh;
}
function trim(group, x, y, z, w, h, d, color) {
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.5 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
export function addOptimizedWorkshopFacade(group, lot, floor, front, entryX, gap, scene) {
  const x = lot.x;
  const faceZ = front - 0.08;
  // Placa em escala coerente com o teto existente.
  const sign = atlasPlane(group, 'sign', x + 0.7, floor + 3.22, faceZ - 0.035, 16.3, 1.84, true);
  // Janela e cartaz ocupam a parede à esquerda, sem tapar a porta jogável.
  atlasPlane(group, 'window', x - 7.65, floor + 1.50, faceZ, 4.6, 2.35);
  atlasPlane(group, 'services', x - 4.89, floor + 1.53, faceZ - 0.015, 1.17, 2.30);
  // A porta fotográfica da direita é uma entrada de serviço fechada, decorativa.
  atlasPlane(group, 'door', x + 8.35, floor + 1.43, faceZ, 1.65, 2.71);
  // Garagem principal com vão físico real: não há um cartaz sólido bloqueando o player.
  const garageX = x + 3.35;
  const garageW = 6.5;
  trim(group, garageX, floor + 3.47, faceZ, garageW + 0.35, 0.25, 0.24, 0x313c44);
  for (let i = 0; i < 7; i++) {
    trim(group, garageX, floor + 3.33 - i * 0.075, faceZ - 0.05,
      garageW + 0.15, 0.017, 0.025, i % 2 ? 0x838e95 : 0x667077);
  }
  for (const dx of [-garageW / 2, garageW / 2]) {
    trim(group, garageX + dx, floor + 1.48, faceZ, 0.15, 2.95, 0.15, 0x37414a);
  }
  trim(group, x - 7.65, floor + 2.76, faceZ + 0.02, 4.8, 0.11, 0.11, 0x394851);
  trim(group, x + 8.35, floor + 2.81, faceZ + 0.02, 1.85, 0.11, 0.11, 0x394851);
  // Apenas dois pontos suaves sem sombras — não introduz shadow maps extras.
  const lights = [-5.7, 5.1].map((dx) => {
    const light = new THREE.PointLight(0xffd3a0, 4, 9, 2);
    light.position.set(x + dx, floor + 4.15, front - 0.38);
    light.castShadow = false;
    scene.add(light);
    return light;
  });
  lot.facadeLights = lights;
  return { mesh: sign, texture: getTexture() };
}
