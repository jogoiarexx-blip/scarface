import * as THREE from 'three';
import { BLOCK, SIDEWALK } from './config.js';
import { box, cyl, quad } from './geom.js';
import { glowsAtNight } from './nightlight.js';

const CURB = BLOCK / 2; // distância do centro do quarteirão até o meio-fio
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Postes, bancos, lixeiras e hidrantes nas calçadas
export function addStreetProps({ metal, lamps, plain, pools }, blocks, addCollider, rand) {
  for (const b of blocks) {
    for (const [nx, nz] of SIDES) {
      // Eixo ao longo da calçada
      const tx = nz;
      const tz = nx;
      for (const along of [-18, 0, 18]) {
        const x = b.cx + nx * (CURB - 0.5) + tx * along;
        const z = b.cz + nz * (CURB - 0.5) + tz * along;
        streetLamp(metal, lamps, pools, x, z, nx, nz);
        addCollider(x, z, 0.4, 0.4, 8);
      }
      if (b.type === 'park' || b.type === 'houses') continue;
      // Banco e lixeira encostados no lado de dentro da calçada
      const inner = CURB - SIDEWALK + 0.5;
      const along = (rand() - 0.5) * 30;
      const bx = b.cx + nx * inner + tx * along;
      const bz = b.cz + nz * inner + tz * along;
      bench(plain, metal, bx, bz, nx, nz);
      addCollider(bx, bz, 1.2, 1.2, 1);
      const cx = b.cx + nx * inner + tx * (along + 3);
      const cz = b.cz + nz * inner + tz * (along + 3);
      plain.push(cyl(0.3, 0.26, 0.9, 10, '#2e4a3a', [cx, 0.63, cz]), cyl(0.32, 0.32, 0.06, 10, '#22382c', [cx, 1.1, cz]));
      if (rand() < 0.5) {
        const hx = b.cx + nx * (CURB - 0.6) + tx * (along - 9);
        const hz = b.cz + nz * (CURB - 0.6) + tz * (along - 9);
        plain.push(cyl(0.14, 0.17, 0.65, 10, '#c62828', [hx, 0.5, hz]), cyl(0.18, 0.18, 0.1, 10, '#b71c1c', [hx, 0.85, hz]));
      }
    }
  }
}

function streetLamp(metal, lamps, pools, x, z, nx, nz) {
  const base = 0.18;
  metal.push(cyl(0.2, 0.24, 0.5, 10, '#3b3f44', [x, base + 0.25, z]));
  metal.push(cyl(0.08, 0.12, 7.6, 10, '#3b3f44', [x, base + 3.8, z]));
  const armLen = 1.8;
  const ax = x + nx * armLen * 0.5;
  const az = z + nz * armLen * 0.5;
  metal.push(box(nx ? armLen : 0.1, 0.1, nz ? armLen : 0.1, '#3b3f44', [ax, base + 7.5, az]));
  const hx = x + nx * armLen;
  const hz = z + nz * armLen;
  metal.push(box(nx ? 0.8 : 0.36, 0.16, nz ? 0.8 : 0.36, '#2f3236', [hx, base + 7.45, hz]));
  lamps.push(box(nx ? 0.6 : 0.26, 0.04, nz ? 0.6 : 0.26, '#ffffff', [hx, base + 7.36, hz]));
  // Luz no asfalto embaixo da lâmpada e uma menor na calçada, ao pé do poste
  pools.push(quad(12, 12, '#ffffff', [hx, 0.05, hz]), quad(6, 6, '#ffffff', [x, base + 0.02, z]));
}

function bench(plain, metal, x, z, nx, nz) {
  // Assento de frente para a rua
  const along = (w, d) => (nx ? [d, w] : [w, d]);
  const [sw, sd] = along(1.8, 0.5);
  plain.push(box(sw, 0.07, sd, '#8a5a3a', [x, 0.66, z]));
  const [bw, bd] = along(1.8, 0.07);
  plain.push(box(bw, 0.45, bd, '#8a5a3a', [x - nx * 0.24, 0.95, z - nz * 0.24]));
  for (const s of [-0.75, 0.75]) {
    const lx = x + (nx ? 0 : s);
    const lz = z + (nx ? s : 0);
    metal.push(box(0.06, 0.48, 0.06, '#2f3236', [lx, 0.42, lz]));
  }
}

export const lampMaterial = glowsAtNight(new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff1cf' }), 1.6, 10);
export const metalMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.7, roughness: 0.4 });
