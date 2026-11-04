import * as THREE from 'three';
import { canvas, toTexture } from './textures.js';
import { resolveGameAsset } from './asset-paths.js';


export const manager = new THREE.LoadingManager();
// Vite copia public/assets para dist/assets; Pages em modo branch mantém public/assets.
// Este mapeamento só é usado quando os módulos são carregados sem Vite.
const usingRawGitHubPages = typeof import.meta.env === 'undefined';
if (usingRawGitHubPages && typeof document !== 'undefined') {
  manager.setURLModifier((url) =>
    resolveGameAsset(url, { raw: true, base: document.baseURI })
  );
}
const imageLoader = new THREE.ImageLoader(manager);
const cache = new Map();
const queue = [];
const listeners = new Set();
export const textureStats = { total: 0, complete: 0, failed: 0, active: 0 };
let running = 0, scheduled = false;
const MAX_PARALLEL = 5;
const VALID_QUALITY = [512, 1024, 2048];
export function getTextureLimit(storage = typeof localStorage === 'undefined' ? null : localStorage) {
  try { const value = Number(storage?.getItem('vespera-texture-limit')); return VALID_QUALITY.includes(value) ? value : 1024; }
  catch { return 1024; }
}
export function onTextureProgress(listener) {
  listeners.add(listener);
  listener({ ...textureStats });
  return () => listeners.delete(listener);
}
function notify() { for (const listener of listeners) listener({ ...textureStats }); }
function pump() {
  scheduled = false;
  queue.sort((a, b) => a.priority - b.priority);
  while (running < MAX_PARALLEL && queue.length) {
    const job = queue.shift();
    running++; textureStats.active = running; notify();
    imageLoader.load(job.url, (img) => {
      try {
        const scale = Math.min(1, job.maxSize / Math.max(1, img.width), job.maxSize / Math.max(1, img.height));
        if (scale < 1) {
          const [c, g] = canvas(Math.max(1, Math.floor(img.width * scale)), Math.max(1, Math.floor(img.height * scale)));
          g.drawImage(img, 0, 0, c.width, c.height);
          job.texture.image = c;
        } else job.texture.image = img;
        job.texture.needsUpdate = true;
      } catch (error) { console.warn('Falha ao preparar textura:', job.url, error); textureStats.failed++; }
      settle();
    }, undefined, () => { textureStats.failed++; console.warn('Textura ausente; usando reserva:', job.url); settle(); });
    function settle() { running--; textureStats.active = running; textureStats.complete++; notify(); pump(); }
  }
}
function enqueue(job) {
  queue.push(job); textureStats.total++; notify();
  if (!scheduled) { scheduled = true; queueMicrotask(pump); }
}
export function loadTexture(url, { srgb = false, maxSize = 2048, priority = 1 } = {}) {
  const size = Math.min(maxSize, getTextureLimit());
  const key = url + '|' + srgb + '|' + size;
  if (cache.has(key)) return cache.get(key);
  const [c, g] = canvas(4);
  g.fillStyle = srgb ? '#938b78' : '#8080ff'; g.fillRect(0, 0, 4, 4);
  g.fillStyle = srgb ? '#857d70' : '#7a7af0'; g.fillRect(0, 0, 2, 2); g.fillRect(2, 2, 2, 2);
  const tex = new THREE.Texture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  cache.set(key, tex);
  enqueue({ url, texture: tex, maxSize: size, priority });
  return tex;
}

// Material PBR do Poly Haven: cor + relevo + "arm" (oclusão, aspereza e metal num arquivo só)
export function polyHavenMaterial(id, options = {}) {
  const dir = `assets/textures/${id}`;
  const arm = loadTexture(`${dir}/arm.jpg`, { maxSize: 1024 });
  return new THREE.MeshStandardMaterial({
    map: loadTexture(`${dir}/diff.jpg`, { srgb: true, priority: 0 }),
    normalMap: loadTexture(`${dir}/nor_gl.jpg`, { maxSize: 1024 }),
    aoMap: arm,
    roughnessMap: arm,
    metalnessMap: arm,
    roughness: 1,
    metalness: 1,
    ...options,
  });
}

// Fachada do ambientCG: cor, relevo, aspereza e metal em arquivos separados
export function ambientCgMaterial(dir) {
  const base = `assets/facades/${dir}`;
  return new THREE.MeshStandardMaterial({
    map: loadTexture(`${base}/color.jpg`, { srgb: true, priority: 0 }),
    normalMap: loadTexture(`${base}/normal.jpg`, { maxSize: 1024 }),
    roughnessMap: loadTexture(`${base}/rough.jpg`, { maxSize: 1024 }),
    metalnessMap: loadTexture(`${base}/metal.jpg`, { maxSize: 1024 }),
    roughness: 1,
    metalness: 1,
    vertexColors: true,
  });
}

// Manchas grandes e suaves, para a repetição da textura não ficar visível de longe
let macroTex = null;
function macroTexture() {
  if (macroTex) return macroTex;
  const S = 512;
  const [c, g] = canvas(S);
  g.fillStyle = '#b4b4b4';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 20 + Math.random() * 90;
    const v = Math.random() < 0.5 ? 255 : 60;
    for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) {
      const grd = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      grd.addColorStop(0, `rgba(${v},${v},${v},0.25)`);
      grd.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = grd;
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  macroTex = toTexture(c, false);
  return macroTex;
}

// Multiplica a cor por manchas numa escala bem maior que a textura (scale < 1 = maior)
export function addMacroVariation(material, scale) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.macroMap = { value: macroTexture() };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_pars_fragment>', '#include <map_pars_fragment>\nuniform sampler2D macroMap;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>\ndiffuseColor.rgb *= mix(0.72, 1.18, texture2D(macroMap, vMapUv * ${scale.toFixed(4)}).r);`,
      );
  };
  material.customProgramCacheKey = () => `macro-${scale}`;
  return material;
}
