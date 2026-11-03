import { HALF, CELL, ROAD } from './config.js';
import { clamp } from './util.js';

// Empurra um círculo no plano xz para fora das caixas. Retorna true se encostou em alguma.
export function resolveCircle(pos, radius, colliders) {
  let hit = false;
  for (const c of colliders) {
    if (pos.x + radius < c.minX || pos.x - radius > c.maxX || pos.z + radius < c.minZ || pos.z - radius > c.maxZ) continue;
    if (pos.y > c.h) continue;
    const dx = pos.x - clamp(pos.x, c.minX, c.maxX);
    const dz = pos.z - clamp(pos.z, c.minZ, c.maxZ);
    const d2 = dx * dx + dz * dz;
    if (d2 >= radius * radius) continue;
    if (d2 > 1e-6) {
      const d = Math.sqrt(d2);
      pos.x += (dx / d) * (radius - d);
      pos.z += (dz / d) * (radius - d);
    } else {
      // Centro dentro da caixa: sai pelo lado mais próximo
      const out = [pos.x - c.minX, c.maxX - pos.x, pos.z - c.minZ, c.maxZ - pos.z];
      const m = Math.min(...out);
      if (m === out[0]) pos.x = c.minX - radius;
      else if (m === out[1]) pos.x = c.maxX + radius;
      else if (m === out[2]) pos.z = c.minZ - radius;
      else pos.z = c.maxZ + radius;
    }
    hit = true;
  }
  return hit;
}

// Caixa que contém o ponto (com margem), usada para o avião bater em prédios
export function boxAt(pos, pad, colliders) {
  for (const c of colliders) {
    if (pos.y < c.h + pad && pos.x > c.minX - pad && pos.x < c.maxX + pad && pos.z > c.minZ - pad && pos.z < c.maxZ + pad) return c;
  }
  return null;
}

// Altura do chão: calçadas ficam 18 cm acima do asfalto
export function groundHeight(x, z) {
  if (Math.abs(x) > HALF || Math.abs(z) > HALF) return 0;
  const lx = x + HALF - Math.floor((x + HALF) / CELL) * CELL;
  const lz = z + HALF - Math.floor((z + HALF) / CELL) * CELL;
  const h = ROAD / 2;
  return lx > h && lx < CELL - h && lz > h && lz < CELL - h ? 0.18 : 0;
}
