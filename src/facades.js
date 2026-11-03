import * as THREE from 'three';
import { canvas, toTexture } from './textures.js';
import { glowsAtNight } from './nightlight.js';

// Cada fachada tem três imagens: a cor, um "mapa de brilho" (canal verde = aspereza, azul = metal,
// assim o vidro reflete o céu e a parede não) e as janelas que acendem à noite.
// Os painters guardam onde ficam as janelas em `wins`, em pixels da repetição de 256 x 256.
// Uma repetição = 2 janelas x 2 andares = 8 m x 7 m. A loja do térreo é 8 m x 4.5 m.

export const TILE = { w: 8, h: 7, shopH: 4.5 };

// Fachadas baixadas do ambientCG (CC0): grades de janelas de vidro.
// cols x rows = janelas na imagem; floorH = altura de um andar em metros.
export const PHOTO_FACADES = {
  f001: { dir: 'Facade001', cols: 16, rows: 10, floorH: 3.5 },
  f005: { dir: 'Facade005', cols: 32, rows: 24, floorH: 3.2 },
  f006: { dir: 'Facade006', cols: 14, rows: 8, floorH: 3.6 },
};
// Largura de uma coluna de janelas, mantendo a proporção da imagem
for (const f of Object.values(PHOTO_FACADES)) f.colW = (f.floorH * f.rows) / f.cols;

const rnd = (a, b) => a + Math.random() * (b - a);
const spec = (g, rough, metal) => (g.fillStyle = `rgb(0,${Math.round(rough * 255)},${Math.round(metal * 255)})`);

function glassPane(g, x, y, w, h, top, bottom) {
  const grd = g.createLinearGradient(0, y, 0, y + h);
  grd.addColorStop(0, top);
  grd.addColorStop(1, bottom);
  g.fillStyle = grd;
  g.fillRect(x, y, w, h);
}

// Persiana meio fechada em algumas janelas
function blinds(g, x, y, w, h) {
  if (Math.random() > 0.35) return;
  const drop = h * rnd(0.2, 0.7);
  g.fillStyle = `rgba(${rnd(170, 220) | 0},${rnd(165, 210) | 0},${rnd(150, 190) | 0},0.9)`;
  g.fillRect(x, y, w, drop);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let k = y + 3; k < y + drop; k += 4) g.fillRect(x, k, w, 1);
}

const painters = {
  glass(g, s, x, y, wins) {
    g.fillStyle = '#8c959e';
    g.fillRect(x, y, 128, 128);
    spec(s, 0.45, 0.8);
    s.fillRect(x, y, 128, 128);
    const v = rnd(-12, 12);
    glassPane(g, x + 3, y + 3, 122, 100, `rgb(${110 + v},${145 + v},${170 + v})`, `rgb(${50 + v},${82 + v},${104 + v})`);
    g.fillStyle = '#3a4652';
    g.fillRect(x, y + 106, 128, 22);
    g.fillStyle = '#8c959e';
    g.fillRect(x + 63, y, 3, 106);
    spec(s, 0.06, 0.95);
    s.fillRect(x + 3, y + 3, 60, 100);
    s.fillRect(x + 66, y + 3, 59, 100);
    wins.push([x + 3, y + 3, 60, 100], [x + 66, y + 3, 59, 100]);
  },
  office(g, s, x, y, wins) {
    g.fillStyle = '#cfcac0';
    g.fillRect(x, y, 128, 128);
    spec(s, 0.9, 0);
    s.fillRect(x, y, 128, 128);
    glassPane(g, x, y + 30, 128, 70, '#5a7488', '#2a3a48');
    blinds(g, x + 2, y + 30, 124, 70);
    g.fillStyle = '#555c63';
    for (let k = 0; k < 128; k += 32) {
      g.fillRect(x + k, y + 30, 3, 70);
      wins.push([x + k + 3, y + 30, 29, 70]);
    }
    spec(s, 0.08, 0.7);
    s.fillRect(x, y + 30, 128, 70);
  },
  brick(g, s, x, y, wins) {
    g.fillStyle = '#b8ab9a';
    g.fillRect(x, y, 128, 128);
    for (let row = 0; row < 16; row++) {
      for (let col = -1; col < 8; col++) {
        const c = 120 + rnd(-18, 18);
        g.fillStyle = `rgb(${c + 22},${(c * 0.55) | 0},${(c * 0.42) | 0})`;
        g.fillRect(x + col * 16 + (row % 2) * 8 + 1, y + row * 8 + 1, 14, 6);
      }
    }
    spec(s, 0.95, 0);
    s.fillRect(x, y, 128, 128);
    g.fillStyle = '#e8e6e0';
    g.fillRect(x + 30, y + 24, 68, 84);
    glassPane(g, x + 35, y + 29, 58, 74, '#40566a', '#1e2b36');
    blinds(g, x + 35, y + 29, 58, 74);
    g.fillStyle = '#e8e6e0';
    g.fillRect(x + 62, y + 29, 4, 74);
    g.fillStyle = '#d9d4ca';
    g.fillRect(x + 26, y + 108, 76, 6);
    spec(s, 0.5, 0);
    s.fillRect(x + 30, y + 24, 68, 84);
    spec(s, 0.06, 0.6);
    s.fillRect(x + 35, y + 29, 27, 74);
    s.fillRect(x + 66, y + 29, 27, 74);
    wins.push([x + 35, y + 29, 58, 74]);
  },
  modern(g, s, x, y, wins) {
    g.fillStyle = '#ecebe6';
    g.fillRect(x, y, 128, 128);
    g.fillStyle = '#cfcdc6';
    g.fillRect(x, y, 128, 2);
    g.fillRect(x, y, 2, 128);
    spec(s, 0.4, 0.1);
    s.fillRect(x, y, 128, 128);
    for (const wx of [18, 70]) {
      g.fillStyle = '#2b2f33';
      g.fillRect(x + wx - 3, y + 14, 46, 100);
      glassPane(g, x + wx, y + 17, 40, 94, '#4b6577', '#1f2c36');
      blinds(g, x + wx, y + 17, 40, 94);
      spec(s, 0.06, 0.85);
      s.fillRect(x + wx, y + 17, 40, 94);
      wins.push([x + wx, y + 17, 40, 94]);
    }
  },
};

const GLOW_COLORS = ['#ffd49a', '#ffe6bf', '#fff1d6', '#d6e4ff', '#ffc98a'];

// Janelas acesas à noite. rects vão de 0 a 1 dentro de uma repetição da fachada;
// a imagem cobre tilesX x tilesY repetições para o padrão de luzes não se repetir a cada 2 janelas.
// Retângulos com cor própria (5º item) ficam sempre acesos, como letreiros.
function glowTexture(w, h, tilesX, tilesY, rects, chance, strength = 1) {
  const [c, g] = canvas(w, h);
  g.fillStyle = '#000000';
  g.fillRect(0, 0, w, h);
  const tw = w / tilesX;
  const th = h / tilesY;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      for (const [x, y, rw, rh, color] of rects) {
        if (!color && Math.random() > chance) continue;
        g.globalAlpha = (color ? 0.8 : 0.5 + Math.random() * 0.5) * strength;
        g.fillStyle = color || GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)];
        g.fillRect((tx + x) * tw, (ty + y) * th, rw * tw, rh * th);
      }
    }
  }
  const t = toTexture(c);
  t.repeat.set(1 / tilesX, 1 / tilesY);
  return t;
}

export function facadeTextures(style) {
  const [c, g] = canvas(256);
  const [sc, s] = canvas(256);
  const wins = [];
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) painters[style](g, s, x * 128, y * 128, wins);
  const glow = glowTexture(512, 512, 8, 8, wins.map((r) => r.map((v) => v / 256)), 0.33);
  return { map: toTexture(c), spec: toTexture(sc, false), glow };
}

// Janelas das fachadas baixadas: uma grade de cols x rows, cobrindo 2 x 2 repetições da foto
export function photoGlow({ cols, rows }) {
  const rects = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) rects.push([(k + 0.12) / cols, (r + 0.1) / rows, 0.76 / cols, 0.7 / rows]);
  return glowTexture(1024, 1024, 2, 2, rects, 0.3);
}

const SIGN_COLORS = ['#b03a2e', '#1f6f8b', '#2e7d32', '#f9a825', '#6a1b9a', '#d84315'];

// Térreo com vitrines e letreiros coloridos
export function shopTextures() {
  const [c, g] = canvas(256, 144);
  const [sc, s] = canvas(256, 144);
  g.fillStyle = '#2a2a2a';
  g.fillRect(0, 0, 256, 144);
  spec(s, 0.4, 0.6);
  s.fillRect(0, 0, 256, 144);
  const lit = [];
  for (let bay = 0; bay < 2; bay++) {
    const x = bay * 128;
    const color = SIGN_COLORS[Math.floor(Math.random() * SIGN_COLORS.length)];
    lit.push([(x + 4) / 256, 6 / 144, 120 / 256, 26 / 144, color], [(x + 8) / 256, 40 / 144, 112 / 256, 100 / 144]);
    g.fillStyle = color;
    g.fillRect(x + 4, 6, 120, 26);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    for (let k = 0; k < 5; k++) g.fillRect(x + 22 + k * 17, 14, 12, 10);
    spec(s, 0.5, 0);
    s.fillRect(x + 4, 6, 120, 26);
    const grd = g.createLinearGradient(0, 40, 0, 140);
    grd.addColorStop(0, '#3b4b57');
    grd.addColorStop(1, '#7a6650');
    g.fillStyle = grd;
    g.fillRect(x + 8, 40, 112, 100);
    g.fillStyle = '#2a2a2a';
    g.fillRect(x + 62, 40, 4, 100);
    spec(s, 0.05, 0.5);
    s.fillRect(x + 8, 40, 54, 100);
    s.fillRect(x + 66, 40, 54, 100);
  }
  return { map: toTexture(c), spec: toTexture(sc, false), glow: glowTexture(512, 288, 2, 2, lit, 0.85, 0.55) };
}

export function facadeMaterial({ map, spec, glow }) {
  const m = new THREE.MeshStandardMaterial({ map, roughnessMap: spec, metalnessMap: spec, roughness: 1, metalness: 1, vertexColors: true });
  return withNightWindows(m, glow);
}

export function withNightWindows(material, glow) {
  material.emissive.set('#ffffff');
  material.emissiveMap = glow;
  return glowsAtNight(material, 0, 1);
}
