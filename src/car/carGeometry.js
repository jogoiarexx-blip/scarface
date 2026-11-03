import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { STYLES } from './profiles.js';

// Chanfro da extrusão: arredonda todas as quinas da lataria
const BEVEL_T = 0.07;
const BEVEL_S = 0.05;
const ARCH_GAP = 0.06; // folga entre o pneu e o para-lama

// Segue o contorno arredondando os cantos que têm raio
function trace(path, pts) {
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy, r = 0] = pts[i];
    const [nx, ny] = pts[i + 1];
    if (!r) {
      path.lineTo(cx, cy);
      continue;
    }
    const d1 = Math.hypot(cx - px, cy - py);
    const d2 = Math.hypot(nx - cx, ny - cy);
    const r1 = Math.min(r, d1 / 2);
    const r2 = Math.min(r, d2 / 2);
    path.lineTo(cx - ((cx - px) / d1) * r1, cy - ((cy - py) / d1) * r1);
    path.quadraticCurveTo(cx, cy, cx + ((nx - cx) / d2) * r2, cy + ((ny - cy) / d2) * r2);
  }
  const last = pts[pts.length - 1];
  path.lineTo(last[0], last[1]);
}

function bodyShape(p) {
  const s = new THREE.Shape();
  trace(s, p.top);
  // Parte de baixo, da frente para trás, recortando as caixas de roda
  const arch = p.wheelR + ARCH_GAP + BEVEL_S;
  for (const ax of [p.axleF, p.axleR]) {
    s.lineTo(ax + arch, p.bottom);
    s.lineTo(ax + arch, p.wheelR);
    s.absarc(ax, p.wheelR, arch, 0, Math.PI, false);
    s.lineTo(ax - arch, p.bottom);
  }
  s.lineTo(p.top[0][0], p.top[0][1]);
  return s;
}

// Extruda o perfil na largura do carro, com o comprimento no eixo z
function extrudeSide(shape, width) {
  const depth = width - 2 * BEVEL_T;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: BEVEL_T, bevelSize: BEVEL_S, bevelSegments: 4, curveSegments: 10,
  });
  g.translate(0, 0, -depth / 2);
  g.rotateY(-Math.PI / 2);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const smooth = mergeVertices(g, 1e-4);
  smooth.computeVertexNormals();
  return smooth;
}

// Peças simples (caixas, cilindros) sem uv, para fundir com a lataria
function piece(geometry, pos, rot = [0, 0, 0]) {
  geometry.deleteAttribute('uv');
  geometry.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
  geometry.translate(pos[0], pos[1], pos[2]);
  return geometry;
}
const boxAt = (w, h, d, pos, rot) => piece(new THREE.BoxGeometry(w, h, d), pos, rot);

// Afina a cabine no alto e arredonda frente e traseira vistas de cima.
// Vale para todas as peças presas à lataria, para elas acompanharem a superfície.
function deform(g, p) {
  const pos = g.attributes.position;
  const half = p.L / 2;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(Math.max((pos.getY(i) - p.belt) / (p.roof - p.belt), 0), 1);
    const end = Math.min(Math.abs(pos.getZ(i)) / half, 1.05);
    pos.setX(i, pos.getX(i) * (1 - p.tumble * t * t) * (1 - p.plan * end ** 4));
  }
  g.computeVertexNormals();
  return g;
}

function sideWindows(p) {
  const [rb, rt, ft, fb] = p.side;
  const pw = 0.09; // largura das colunas entre as janelas
  const at = (a, b, x) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])];
  const polys = [];
  let start = null;
  for (const x of [...[...p.pillars].sort((a, b) => a - b), null]) {
    const poly = start === null ? [rb, rt] : [at(rb, fb, start + pw / 2), at(rt, ft, start + pw / 2)];
    if (x === null) poly.push(ft, fb);
    else poly.push(at(rt, ft, x - pw / 2), at(rb, fb, x - pw / 2));
    polys.push(poly);
    start = x;
  }
  const halfW = (p.cabin ? p.cabinW : p.W) / 2 + 0.004;
  const out = [];
  for (const poly of polys) {
    const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const side of [-1, 1]) {
      const g = new THREE.ShapeGeometry(shape);
      g.rotateY(-Math.PI / 2);
      g.translate(side * halfW, 0, 0);
      g.deleteAttribute('uv');
      out.push(g);
    }
  }
  return out;
}

// Para-brisa ou vidro traseiro: um quadrilátero deitado sobre a face inclinada
function slantGlass(p, [src, i0, i1]) {
  const pts = src === 'cabin' ? p.cabin : p.top;
  const A = pts[i0];
  const B = pts[i1];
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const a = [A[0] + dx * 0.12, A[1] + dy * 0.12];
  const b = [B[0] - dx * 0.12, B[1] - dy * 0.12];
  const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length;
  const cy = pts.reduce((s, q) => s + q[1], 0) / pts.length;
  const len = Math.hypot(dx, dy);
  let nx = dy / len;
  let ny = -dx / len;
  if (((a[0] + b[0]) / 2 - cx) * nx + ((a[1] + b[1]) / 2 - cy) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const off = BEVEL_S + 0.012;
  const w = (src === 'cabin' ? p.cabinW : p.W) / 2 - 0.1;
  const P = (q, s) => [s * w, q[1] + ny * off, q[0] + nx * off];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...P(a, -1), ...P(a, 1), ...P(b, 1), ...P(b, -1)], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

const cache = {};

// Geometrias de um modelo, criadas uma vez e divididas entre todos os carros iguais
export function styleGeometry(name) {
  if (cache[name]) return cache[name];
  const p = STYLES[name];
  const S = BEVEL_S;
  const fz = p.front.z + S;
  const rz = p.rear.z - S;
  const half = p.W / 2;
  const cabinFront = p.cabin ? p.cabin[p.ws[1]][0] : p.side[3][0];

  const paint = [extrudeSide(bodyShape(p), p.W)];
  if (p.cabin) {
    const cabin = new THREE.Shape();
    trace(cabin, p.cabin);
    cabin.closePath();
    paint.push(extrudeSide(cabin, p.cabinW));
  }
  const mirrorX = (p.cabin ? p.cabinW : p.W) / 2 + 0.14;
  for (const s of [-1, 1]) paint.push(boxAt(0.07, 0.1, 0.17, [s * mirrorX, p.belt + 0.13, cabinFront - 0.2]));

  const glass = [...sideWindows(p), slantGlass(p, p.ws)];
  if (p.rw) glass.push(slantGlass(p, p.rw));

  const trim = [
    boxAt(p.W * 0.9, 0.14, 0.12, [0, p.bottom + 0.1, fz - 0.03]),
    boxAt(p.W * 0.9, 0.14, 0.12, [0, p.bottom + 0.1, rz + 0.03]),
    boxAt(p.W * 0.42, 0.17, 0.08, [0, p.front.y - 0.13, fz - 0.02]),
  ];
  const skirt = p.axleF - p.axleR - 2 * (p.wheelR + ARCH_GAP + S);
  for (const s of [-1, 1]) {
    trim.push(boxAt(0.04, 0.09, skirt, [s * (half + 0.005), p.bottom + 0.02, (p.axleF + p.axleR) / 2]));
    trim.push(boxAt(0.12, 0.03, 0.06, [s * (mirrorX - 0.08), p.belt + 0.1, cabinFront - 0.2]));
  }
  // Fundo escuro dentro das caixas de roda
  for (const ax of [p.axleF, p.axleR]) {
    const liner = new THREE.CylinderGeometry(p.wheelR + ARCH_GAP - 0.005, p.wheelR + ARCH_GAP - 0.005, p.W - 0.2, 16, 1, true, 0, Math.PI);
    trim.push(piece(liner, [0, p.wheelR, ax], [0, 0, Math.PI / 2]));
  }
  // Bancos e painel, que aparecem através dos vidros
  const seatZ = cabinFront - 1.0;
  trim.push(boxAt(p.cabinW * 0.8, 0.22, 0.45, [0, p.belt + 0.02, cabinFront - 0.35]));
  for (const s of [-1, 1]) trim.push(boxAt(0.5, 0.75, 0.5, [s * 0.38, p.belt - 0.05, seatZ]));
  if (p.cabin && seatZ - 0.9 > p.cabin[p.rw[1]][0]) trim.push(boxAt(p.cabinW * 0.8, 0.7, 0.5, [0, p.belt - 0.08, seatZ - 0.9]));
  if (p.spoiler) trim.push(boxAt(p.W * 0.8, 0.05, 0.28, [0, p.belt + 0.2, rz + 0.25]), boxAt(0.06, 0.16, 0.12, [0.5, p.belt + 0.1, rz + 0.25]), boxAt(0.06, 0.16, 0.12, [-0.5, p.belt + 0.1, rz + 0.25]));
  if (p.rails) for (const s of [-1, 1]) trim.push(boxAt(0.05, 0.06, 1.9, [s * p.cabinW * 0.36, p.roof + S + 0.04, -0.7]));
  if (p.bed) trim.push(boxAt(p.W - 0.32, 0.03, p.bed[1] - p.bed[0], [0, p.belt + S + 0.01, (p.bed[0] + p.bed[1]) / 2]));
  trim.push(boxAt(0.48, 0.17, 0.04, [0, p.plateF, fz]), boxAt(0.48, 0.17, 0.04, [0, p.plateR, rz]));

  const [rb, , , fb] = p.side;
  const chrome = [boxAt(p.W * 0.42, 0.025, 0.09, [0, p.front.y - 0.13, fz - 0.01])];
  const winHalf = (p.cabin ? p.cabinW : p.W) / 2;
  for (const s of [-1, 1]) {
    chrome.push(boxAt(0.02, 0.025, fb[0] - rb[0], [s * (winHalf + 0.008), rb[1] - 0.02, (fb[0] + rb[0]) / 2]));
    chrome.push(boxAt(0.03, 0.04, 0.16, [s * (half + 0.012), p.belt - 0.14, fb[0] - 0.75]));
    if (p.pillars.length) chrome.push(boxAt(0.03, 0.04, 0.16, [s * (half + 0.012), p.belt - 0.14, p.pillars[0] - 0.55]));
  }
  chrome.push(piece(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 10), [half * 0.55, p.bottom + 0.06, rz + 0.04], [Math.PI / 2, 0, 0]));

  const head = [];
  const tail = [];
  for (const s of [-1, 1]) {
    head.push(boxAt(0.44, 0.13, 0.12, [s * (half - 0.33), p.front.y, fz - 0.05]));
    tail.push(boxAt(0.48, 0.12, 0.1, [s * (half - 0.3), p.rear.y, rz + 0.04]));
  }

  const plateF = new THREE.PlaneGeometry(0.42, 0.14).translate(0, p.plateF, fz + 0.025);
  const plateR = new THREE.PlaneGeometry(0.42, 0.14).rotateY(Math.PI).translate(0, p.plateR, rz - 0.025);

  const merge = (list) => deform(mergeGeometries(list), p);
  const geo = {
    paint: merge(paint),
    glass: merge(glass),
    trim: merge(trim),
    chrome: merge(chrome),
    head: merge(head),
    tail: merge(tail),
    plates: deform(mergeGeometries([plateF, plateR]), p),
  };
  if (p.sign) geo.sign = new THREE.BoxGeometry(0.75, 0.22, 0.32).translate(0, p.roof + S + 0.11, (p.cabin[2][0] + p.cabin[3][0]) / 2);
  cache[name] = geo;
  return geo;
}

const wheelCache = {};

// Roda virada para o eixo x: pneu (borracha + miolo escuro) e aro de liga
export function wheelGeometry(r, w) {
  const key = `${r}-${w}`;
  if (wheelCache[key]) return wheelCache[key];
  const inner = r * 0.64;
  const profile = [
    [inner, -w / 2], [r - 0.045, -w / 2], [r, -w / 2 + 0.045], [r, w / 2 - 0.045], [r - 0.045, w / 2], [inner, w / 2],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const rubber = mergeGeometries([
    new THREE.LatheGeometry(profile, 28),
    new THREE.CylinderGeometry(inner * 0.98, inner * 0.98, w * 0.7, 20),
  ]);
  const alloy = [];
  for (const face of [-1, 1]) {
    const y = face * w * 0.36;
    alloy.push(new THREE.TorusGeometry(inner * 0.97, 0.022, 6, 28).rotateX(Math.PI / 2).translate(0, y, 0));
    for (let k = 0; k < 5; k++) {
      alloy.push(new THREE.BoxGeometry(0.055, 0.03, inner * 0.82).translate(0, y, inner * 0.45).rotateY((k / 5) * Math.PI * 2));
    }
  }
  alloy.push(new THREE.CylinderGeometry(r * 0.15, r * 0.15, w * 0.78, 14));
  const geo = { rubber: rubber.rotateZ(Math.PI / 2), alloy: mergeGeometries(alloy).rotateZ(Math.PI / 2) };
  wheelCache[key] = geo;
  return geo;
}
