import * as THREE from 'three';

// Texturas desenhadas por código num <canvas>: nada para baixar

export function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

export function toTexture(c, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Placa Mercosul
export function plateTexture() {
  const [c, g] = canvas(256, 84);
  g.fillStyle = '#f4f4f2';
  g.fillRect(0, 0, 256, 84);
  g.fillStyle = '#1b3f94';
  g.fillRect(0, 0, 256, 20);
  g.fillStyle = '#ffffff';
  g.font = 'bold 13px system-ui';
  g.textAlign = 'center';
  g.fillText('BRASIL', 128, 15);
  const L = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const N = () => Math.floor(Math.random() * 10);
  g.fillStyle = '#111111';
  g.font = 'bold 50px monospace';
  g.fillText(`${L()}${L()}${L()}${N()}${L()}${N()}${N()}`, 128, 70);
  g.strokeStyle = '#222';
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, 253, 81);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Sombra suave embaixo dos veículos
export function blobTexture() {
  const [c, g] = canvas(128);
  const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.85)');
  grd.addColorStop(0.6, 'rgba(0,0,0,0.45)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Poça de luz redonda no chão (postes à noite)
export function poolTexture() {
  const [c, g] = canvas(128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Facho dos faróis no asfalto: mais forte perto do carro e abrindo para a frente
export function beamTexture() {
  const [c, g] = canvas(128, 256);
  for (let y = 0; y < 256; y++) {
    const t = y / 255; // 0 = longe, 1 = perto do carro
    const half = 64 * (0.35 + 0.65 * (1 - t));
    const a = Math.pow(t, 0.7) * (1 - Math.pow(t, 8)) * 0.9;
    const grd = g.createLinearGradient(64 - half, 0, 64 + half, 0);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(0.5, `rgba(255,255,255,${a})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(64 - half, y, half * 2, 1);
  }
  return new THREE.CanvasTexture(c);
}

export function signTexture(text, bg, fg) {
  const [c, g] = canvas(256, 64);
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = fg;
  g.font = 'bold 44px system-ui';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
