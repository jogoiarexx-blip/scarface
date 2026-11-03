import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Material único com cor por vértice: quase tudo no jogo usa ele,
// assim dá para fundir muitas peças numa malha só (poucas chamadas de desenho)
export const colorMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _c = new THREE.Color();

// Posiciona, gira e pinta uma geometria para depois ser fundida
export function part(geometry, color, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  _m.compose(_p.fromArray(pos), _q.setFromEuler(_e.set(rot[0], rot[1], rot[2])), _s);
  g.applyMatrix4(_m);
  _c.set(color);
  const n = g.attributes.position.count;
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    colors[i * 3] = _c.r;
    colors[i * 3 + 1] = _c.g;
    colors[i * 3 + 2] = _c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return g;
}

export const box = (w, h, d, color, pos, rot) => part(new THREE.BoxGeometry(w, h, d), color, pos, rot);

export const cyl = (rTop, rBottom, h, seg, color, pos, rot) =>
  part(new THREE.CylinderGeometry(rTop, rBottom, h, seg), color, pos, rot);

// Retângulo deitado no chão (marcas de rua, faixas)
export const quad = (w, d, color, pos) => part(new THREE.PlaneGeometry(w, d), color, pos, [-Math.PI / 2, 0, 0]);

// uvScale > 0 projeta a textura de cima, em metros (chão, ruas, calçadas)
export function mergedMesh(parts, material = colorMat, castShadow = true, uvScale = 0) {
  const geometry = mergeGeometries(parts);
  if (uvScale) {
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / uvScale, pos.getZ(i) / uvScale);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}
