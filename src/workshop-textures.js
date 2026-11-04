import * as THREE from 'three';
import { loadTexture, polyHavenMaterial } from './assets.js';

// Texturas compartilhadas; nenhum mapa é clonado por prédio ou móvel.
const TYPES = Object.freeze({
  concrete: { meters: 2.5, roughness: 0.95, metalness: 0 },
  plaster: { meters: 3.3, roughness: 0.96, metalness: 0 },
  wood: { meters: 1.7, roughness: 0.73, metalness: 0 },
  steel: { meters: 1.6, roughness: 0.48, metalness: 0.67 },
  red: { meters: 1.8, roughness: 0.42, metalness: 0.37 },
  blue: { meters: 1.8, roughness: 0.43, metalness: 0.40 },
  rubber: { meters: 0.8, roughness: 0.96, metalness: 0 },
});
const materials = new Map();
export function workshopMaterial(kind) {
  if (!(kind in TYPES)) throw new Error("Material desconhecido: " + kind);
  if (!materials.has(kind)) {
    let material;
    if (kind === 'concrete') {
      material = polyHavenMaterial('concrete_pavement_02');
      material.roughness = 0.95;
      material.metalness = 0;
    } else {
      material = new THREE.MeshStandardMaterial({
        map: loadTexture('assets/workshop/' + kind + '.svg', { srgb: true, priority: 1, maxSize: 512 }),
        roughness: TYPES[kind].roughness,
        metalness: TYPES[kind].metalness,
      });
    }
    materials.set(kind, material);
  }
  return materials.get(kind);
}

// UVs na escala em metros: nenhuma textura é esticada sobre uma parede inteira.
export function workshopBox(parent, x, y, z, w, h, d, kind, shadows = true) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const uv = geometry.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  const tile = TYPES[kind].meters;
  for (let face = 0; face < 6; face++) {
    const [uScale, vScale] = faces[face];
    for (let vertex = 0; vertex < 4; vertex++) {
      const i = face * 4 + vertex;
      uv.setXY(i, uv.getX(i) * uScale / tile, uv.getY(i) * vScale / tile);
    }
  }
  const mesh = new THREE.Mesh(geometry, workshopMaterial(kind));
  mesh.position.set(x, y, z);
  mesh.castShadow = shadows && h > 0.65;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function workshopFloor(parent, x, y, z, w, d) {
  const geometry = new THREE.PlaneGeometry(w, d);
  const uv = geometry.attributes.uv;
  const tile = TYPES.concrete.meters;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
  const mesh = new THREE.Mesh(geometry, workshopMaterial('concrete'));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
