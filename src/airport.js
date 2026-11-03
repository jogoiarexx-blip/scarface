import * as THREE from 'three';
import { AIRPORT, APRON, HALF, ROAD } from './config.js';
import { part, box, cyl, quad } from './geom.js';

export function buildAirport({ asphalt, marks, plain, windows, tower, addCollider }) {
  const { x, z, length: L, width: W, runways } = AIRPORT;

  // Pistas com faixa central, cabeceiras e luzes laterais
  for (const rx of runways) {
    asphalt.push(box(W, 0.04, L, '#ffffff', [rx, 0, z]));
    marks.push(quad(0.5, L, '#f2f2f2', [rx - W / 2 + 1, 0.03, z]), quad(0.5, L, '#f2f2f2', [rx + W / 2 - 1, 0.03, z]));
    for (let t = -L / 2 + 40; t < L / 2 - 40; t += 24) marks.push(quad(1, 12, '#f2f2f2', [rx, 0.03, z + t]));
    for (const end of [-1, 1]) {
      for (let k = -5; k <= 5; k++) {
        if (k) marks.push(quad(1.2, 14, '#f2f2f2', [rx + k * 2.4, 0.03, z + end * (L / 2 - 12)]));
      }
    }
    for (let t = -L / 2; t <= L / 2; t += 30) {
      for (const side of [-1, 1]) plain.push(box(0.5, 0.4, 0.5, '#ffd54a', [rx + side * (W / 2 + 1.5), 0.2, z + t]));
    }
  }
  // Pista de taxiamento entre as duas pistas
  const gap = runways[1] - runways[0] - W;
  asphalt.push(box(gap, 0.04, 16, '#d8d8d8', [(runways[0] + runways[1]) / 2, 0, APRON.z]));

  // Pátio, pista de taxiamento e estrada até a cidade
  asphalt.push(box(APRON.w, 0.04, APRON.d, '#d8d8d8', [APRON.x, 0, APRON.z]));
  const twStart = APRON.x + APRON.w / 2;
  const twEnd = x - W / 2;
  asphalt.push(box(twEnd - twStart, 0.04, 16, '#d8d8d8', [(twStart + twEnd) / 2, 0, APRON.z]));
  marks.push(quad(twEnd - twStart, 0.4, '#e8c547', [(twStart + twEnd) / 2, 0.03, APRON.z]));
  const roadStart = HALF + ROAD / 2;
  const roadEnd = APRON.x - APRON.w / 2;
  asphalt.push(box(roadEnd - roadStart, 0.04, ROAD, '#ffffff', [(roadStart + roadEnd) / 2, 0, APRON.z]));
  for (let t = roadStart + 4; t + 3 < roadEnd; t += 6) marks.push(quad(3, 0.3, '#e8c547', [t + 1.5, 0.03, APRON.z]));

  // Terminal envidraçado ao norte do pátio
  tower(APRON.x, APRON.z + APRON.d / 2 + 14, 50, 24, 10, 'f001');

  // Torre de controle
  const tx = APRON.x - APRON.w / 2 - 12;
  const tz = APRON.z - 30;
  plain.push(cyl(2.2, 2.8, 26, 16, '#d9d9d9', [tx, 13, tz]), cyl(5.4, 5.4, 0.8, 16, '#bdbdbd', [tx, 30.4, tz]), cyl(4.4, 4.4, 0.6, 16, '#bdbdbd', [tx, 25.7, tz]));
  windows.push(cyl(5, 4.2, 4, 16, '#ffffff', [tx, 28, tz]));
  addCollider(tx, tz, 6, 6, 31);

  // Hangar com teto arredondado, ao sul do pátio
  const hx = APRON.x;
  const hz = APRON.z - APRON.d / 2 - 18;
  plain.push(box(36, 8, 28, '#9aa3ab', [hx, 4, hz]), box(30, 7, 0.2, '#6f777e', [hx, 3.5, hz + 14.05]));
  const roof = new THREE.CylinderGeometry(14, 14, 36, 24, 1, false, 0, Math.PI);
  plain.push(part(roof, '#7d868e', [hx, 8, hz], [0, 0, Math.PI / 2]));
  addCollider(hx, hz, 36, 28, 22);
}

export function scatterCountryTrees({ rand, tree }) {
  let placed = 0;
  while (placed < 240) {
    const x = (rand() - 0.5) * 1800;
    const z = (rand() - 0.5) * 1800;
    if (Math.abs(x) < HALF + 25 && Math.abs(z) < HALF + 25) continue; // cidade
    if (x > HALF && x < AIRPORT.runways[1] + 60 && Math.abs(z - AIRPORT.z) < 520) continue; // aeroporto, fazenda e corredor de decolagem
    tree(x, z, 0.9 + rand() * 0.8, 0);
    placed++;
  }
}
