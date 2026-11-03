export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Move v em direção a target sem passar dele
export const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Fator de suavização independente do FPS
export const damp = (k, dt) => 1 - Math.exp(-k * dt);

// Gerador aleatório com semente, para a cidade sair sempre igual
export function makeRng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (arr, rand = Math.random) => arr[Math.floor(rand() * arr.length)];
