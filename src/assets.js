import * as THREE from 'three';
import { canvas, toTexture } from './textures.js';

// Tudo que vem de public/assets passa por aqui. O DefaultLoadingManager avisa quando terminou,
// para a tela inicial só liberar o jogo com as texturas prontas.
export const manager = THREE.DefaultLoadingManager;
const imageLoader = new THREE.ImageLoader(manager);

// Carrega uma imagem; se ela for maior que maxSize, reduz num canvas para gastar menos memória de vídeo
export function loadTexture(url, { srgb = false, maxSize = 2048 } = {}) {
  const tex = new THREE.Texture();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  imageLoader.load(url, (img) => {
    if (img.width > maxSize) {
      const [c, g] = canvas(maxSize, Math.round((img.height * maxSize) / img.width));
      g.drawImage(img, 0, 0, c.width, c.height);
      tex.image = c;
    } else tex.image = img;
    tex.needsUpdate = true;
  });
  return tex;
}

// Material PBR do Poly Haven: cor + relevo + "arm" (oclusão, aspereza e metal num arquivo só)
export function polyHavenMaterial(id, options = {}) {
  const dir = `assets/textures/${id}`;
  const arm = loadTexture(`${dir}/arm.jpg`, { maxSize: 1024 });
  return new THREE.MeshStandardMaterial({
    map: loadTexture(`${dir}/diff.jpg`, { srgb: true }),
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
    map: loadTexture(`${base}/color.jpg`, { srgb: true }),
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
