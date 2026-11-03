import * as THREE from 'three';
import { GRID, CELL, ROAD, SIDEWALK, BLOCK, roadCoord } from './config.js';
import { part, box, cyl, quad, mergedMesh } from './geom.js';
import { makeRng, pick } from './util.js';
import { buildAirport, scatterCountryTrees } from './airport.js';
import { polyHavenMaterial, ambientCgMaterial, addMacroVariation } from './assets.js';
import { facadeTextures, shopTextures, facadeMaterial, withNightWindows, photoGlow, TILE, PHOTO_FACADES } from './facades.js';
import { glowsAtNight, visibleAtNight } from './nightlight.js';
import { poolTexture } from './textures.js';
import { addStreetProps, lampMaterial, metalMaterial } from './props.js';

const TINTS = {
  glass: ['#ffffff', '#d4ece4', '#e9dcc9', '#cddcf2', '#e3e3e3'],
  office: ['#ffffff', '#efe6d8', '#dfe3e6', '#e8e0d0'],
  brick: ['#ffffff', '#f0dcd0', '#dcd4cc'],
  modern: ['#ffffff', '#f2efe8', '#e6ebee'],
  shop: ['#ffffff'],
  f001: ['#ffffff', '#e6eef2', '#f2ede4'],
  f005: ['#ffffff', '#e6eef2', '#eef2e8'],
  f006: ['#ffffff', '#f2ede4', '#e8ecef'],
};
const HOUSE_COLORS = ['#f2e2c4', '#e8c8a8', '#cfe0e8', '#f0d0d0', '#dfe8c8', '#f5f0e6', '#e6d3f0', '#f3e7b5'];
const ROOF_COLORS = ['#9c3f2a', '#7a3b2e', '#5a4a42', '#8a5a3a', '#4a5560', '#6e3524'];
const LEAF_COLORS = ['#3f7a35', '#4c8a3a', '#356b2e', '#5a9142', '#477d2f'];
const LOT = 0.2; // altura do terreno dos quarteirões

const _c = new THREE.Color();
const shade = (hex, rand) => '#' + _c.set(hex).offsetHSL((rand() - 0.5) * 0.04, 0, (rand() - 0.5) * 0.08).getHexString();

// Folhagem: esfera deformada com normais suaves, para parecer uma copa cheia
function leafBlob(r, detail) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const pos = g.attributes.position;
  const nrm = g.attributes.normal;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const h = Math.sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) * 43758.5453;
    v.multiplyScalar(1 + (h - Math.floor(h) - 0.5) * 0.3);
    pos.setXYZ(i, v.x, v.y, v.z);
    v.normalize();
    nrm.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

export function buildCity(scene) {
  const rand = makeRng(7);
  const L = {
    asphalt: [], marks: [], sidewalk: [], grass: [], plain: [], foliage: [], windows: [], metal: [], lamps: [], pools: [],
    facades: { glass: [], office: [], brick: [], modern: [], shop: [], f001: [], f005: [], f006: [] },
  };
  const colliders = [];
  const blocks = [];
  const addCollider = (x, z, w, d, h) => colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h });

  // Caixa com fachada; a textura repete por andar e por janela, sem cortar janela na quina
  function facadeBox(style, x, z, w, d, y0, h, tileH = TILE.h) {
    const photo = PHOTO_FACADES[style];
    const unitW = photo ? photo.colW : TILE.w;
    const unitH = photo ? photo.floorH : tileH;
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    for (let f = 0; f < 6; f++) {
      for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        if (f === 2 || f === 3) uv.setXY(i, 0.01, 0.99);
        else {
          const cols = Math.max(1, Math.round((f < 2 ? d : w) / unitW)) / (photo ? photo.cols : 1);
          const rows = Math.max(1, Math.round(h / unitH)) / (photo ? photo.rows : 1);
          uv.setXY(i, Math.round(uv.getX(i)) * cols, Math.round(uv.getY(i)) * rows);
        }
      }
    }
    L.facades[style].push(part(g, pick(TINTS[style], rand), [x, y0 + h / 2, z]));
  }

  function roof(x, z, w, d, y, details) {
    const P = L.plain;
    P.push(box(w - 0.2, 0.25, d - 0.2, '#6f6e6a', [x, y + 0.12, z]));
    const t = 0.35;
    P.push(box(w, 1, t, '#a9a59c', [x, y + 0.5, z - d / 2 + t / 2]), box(w, 1, t, '#a9a59c', [x, y + 0.5, z + d / 2 - t / 2]));
    P.push(box(t, 1, d, '#a9a59c', [x - w / 2 + t / 2, y + 0.5, z]), box(t, 1, d, '#a9a59c', [x + w / 2 - t / 2, y + 0.5, z]));
    if (!details) return;
    for (let k = 0, n = 1 + Math.floor(rand() * 3); k < n; k++) {
      P.push(box(2.2, 1.4, 1.6, '#9ea3a6', [x + (rand() - 0.5) * (w - 6), y + 0.95, z + (rand() - 0.5) * (d - 6)]));
    }
    if (rand() < 0.4) P.push(cyl(1.6, 1.6, 2.6, 14, '#8d8f91', [x + (rand() - 0.5) * (w - 6), y + 1.55, z + (rand() - 0.5) * (d - 6)]));
    if (y > 80) {
      L.metal.push(cyl(0.12, 0.25, 16, 6, '#c9c9c9', [x, y + 8, z]));
      L.lamps.push(box(0.4, 0.4, 0.4, '#ffffff', [x, y + 16.2, z]));
    }
  }

  function tower(x, z, w, d, h, style) {
    const base = h > 14 ? TILE.shopH : 0;
    if (base) facadeBox('shop', x, z, w + 0.3, d + 0.3, 0, base, TILE.shopH);
    const split = h > 55 && rand() < 0.55;
    const h1 = split ? Math.round(h * (0.55 + rand() * 0.2)) : h;
    facadeBox(style, x, z, w, d, base, h1 - base);
    roof(x, z, w, d, h1, !split);
    if (split) {
      const w2 = w * (0.6 + rand() * 0.15);
      const d2 = d * (0.6 + rand() * 0.15);
      facadeBox(style, x, z, w2, d2, h1, h - h1);
      roof(x, z, w2, d2, h, true);
    }
    addCollider(x, z, w + 0.4, d + 0.4, h);
  }

  function houseWindow(cx, cy, cz, facesX, wdt, hgt) {
    L.plain.push(box(...(facesX ? [0.12, hgt + 0.18, wdt + 0.18] : [wdt + 0.18, hgt + 0.18, 0.12]), '#f4f2ec', [cx, cy, cz]));
    L.windows.push(box(...(facesX ? [0.14, hgt, wdt] : [wdt, hgt, 0.14]), '#ffffff', [cx, cy, cz]));
  }

  // (nx, nz) aponta para a rua: é onde ficam a porta e a garagem
  function house(x, z, nx, nz) {
    const w = 9 + rand() * 2;
    const d = 8 + rand() * 2;
    const floors = rand() < 0.3 ? 2 : 1;
    const h = floors * 2.9 + 0.4;
    const roofH = 2.4;
    const P = L.plain;
    P.push(box(w, h, d, pick(HOUSE_COLORS, rand), [x, LOT + h / 2, z]));
    P.push(box(w + 0.12, 0.4, d + 0.12, '#8a857c', [x, LOT + 0.2, z]));
    const roofGeo = new THREE.ConeGeometry(1, 1, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.scale((w / 2 + 0.6) / Math.SQRT1_2, roofH, (d / 2 + 0.6) / Math.SQRT1_2);
    P.push(part(roofGeo, pick(ROOF_COLORS, rand), [x, LOT + h + roofH / 2, z]));
    if (rand() < 0.5) P.push(box(0.8, 2, 0.8, '#9c6b52', [x + w * 0.2, LOT + h + roofH * 0.55, z - d * 0.18]));

    // Janelas nas quatro faces, porta e garagem na frente
    for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const facesX = fx !== 0;
      const half = (facesX ? w : d) / 2 + 0.02;
      const len = facesX ? d : w;
      const front = fx === nx && fz === nz;
      for (let f = 0; f < floors; f++) {
        for (const s of [-1, 1]) {
          if (front && f === 0 && s === 1) continue; // lugar da garagem
          const o = s * len * 0.28;
          houseWindow(x + fx * half + (facesX ? 0 : o), LOT + 1.6 + f * 2.9, z + fz * half + (facesX ? o : 0), facesX, 1.5, 1.2);
        }
      }
      if (!front) continue;
      const dx = x + fx * half;
      const dz = z + fz * half;
      P.push(box(...(facesX ? [0.16, 2.2, 1.1] : [1.1, 2.2, 0.16]), '#5d3a22', [dx, LOT + 1.1, dz]));
      P.push(box(...(facesX ? [0.9, 0.15, 1.6] : [1.6, 0.15, 0.9]), '#9a958c', [dx + fx * 0.4, LOT + 0.07, dz + fz * 0.4]));
      const go = len * 0.28;
      P.push(box(...(facesX ? [0.14, 2.3, 2.8] : [2.8, 2.3, 0.14]), '#d9d6cf', [dx + (facesX ? 0 : go), LOT + 1.15, dz + (facesX ? go : 0)]));
      // Entrada de carro até a calçada
      const gx = dx + (facesX ? 0 : go) + fx * 2;
      const gz = dz + (facesX ? go : 0) + fz * 2;
      L.sidewalk.push(box(facesX ? 3.8 : 3, 0.04, facesX ? 3 : 3.8, '#ffffff', [gx, LOT + 0.01, gz]));
    }
    for (let k = 0; k < 3; k++) {
      const a = rand() * Math.PI * 2;
      L.foliage.push(part(leafBlob(0.7 + rand() * 0.4, 1), shade('#3d6e2c', rand), [x + Math.cos(a) * (w / 2 + 1), LOT + 0.5, z + Math.sin(a) * (d / 2 + 1)]));
    }
    addCollider(x, z, w + 0.4, d + 0.4, h + roofH);
  }

  function tree(x, z, s = 1, detail = 1) {
    const y0 = Math.abs(x) < 300 && Math.abs(z) < 300 ? LOT : 0;
    L.plain.push(cyl(0.18 * s, 0.3 * s, 3 * s, 7, '#5b4030', [x, y0 + 1.5 * s, z]));
    const leaf = pick(LEAF_COLORS, rand);
    for (let k = 0, n = 3 + Math.floor(rand() * 3); k < n; k++) {
      const r = (1.3 + rand() * 0.9) * s;
      L.foliage.push(part(leafBlob(r, detail), shade(leaf, rand), [x + (rand() - 0.5) * 1.8 * s, y0 + (3.4 + rand() * 1.6) * s, z + (rand() - 0.5) * 1.8 * s]));
    }
    addCollider(x, z, 0.7 * s, 0.7 * s, 6 * s);
  }

  const builders = {
    downtown(cx, cz) {
      const style = () => pick(['f001', 'f005', 'f006', 'glass', 'f001', 'office'], rand);
      if (rand() < 0.3) return tower(cx, cz, 36 + rand() * 10, 36 + rand() * 10, 75 + rand() * 60, style());
      for (const ox of [-13, 13]) for (const oz of [-13, 13]) tower(cx + ox, cz + oz, 16 + rand() * 6, 16 + rand() * 6, 25 + rand() * 65, style());
    },
    mid(cx, cz) {
      for (const ox of [-13, 13]) {
        for (const oz of [-13, 13]) {
          if (rand() < 0.2) tree(cx + ox, cz + oz, 1.3);
          else tower(cx + ox, cz + oz, 16 + rand() * 6, 16 + rand() * 6, 9 + rand() * 18, pick(['brick', 'brick', 'f006', 'modern'], rand));
        }
      }
    },
    houses(cx, cz) {
      for (const ox of [-17, 0, 17]) {
        for (const oz of [-17, 0, 17]) {
          if (!ox && !oz) tree(cx, cz, 1.4);
          else house(cx + ox, cz + oz, Math.sign(ox), ox ? 0 : Math.sign(oz));
        }
      }
    },
    park(cx, cz) {
      L.sidewalk.push(box(3, 0.04, 52, '#ffffff', [cx, LOT + 0.01, cz]), box(52, 0.04, 3, '#ffffff', [cx, LOT + 0.01, cz]));
      L.plain.push(cyl(4.2, 4.4, 0.8, 24, '#a7a49c', [cx, LOT + 0.4, cz]), cyl(0.5, 0.7, 2.6, 12, '#b0aca4', [cx, LOT + 1.3, cz]));
      L.windows.push(cyl(3.7, 3.7, 0.1, 24, '#ffffff', [cx, LOT + 0.75, cz]));
      addCollider(cx, cz, 8.6, 8.6, 2.6);
      for (let k = 0; k < 18; k++) {
        const x = (rand() - 0.5) * 46;
        const z = (rand() - 0.5) * 46;
        if (Math.abs(x) > 4 && Math.abs(z) > 4) tree(cx + x, cz + z, 0.8 + rand() * 0.6);
      }
    },
  };

  // Asfalto, faixas amarelas e faixas de pedestre
  const size = GRID * CELL + ROAD;
  const h = ROAD / 2;
  L.asphalt.push(box(size, 0.04, size, '#ffffff', [0, 0, 0]));
  for (let i = 0; i <= GRID; i++) {
    const c = roadCoord(i);
    for (let j = 0; j < GRID; j++) {
      const b = roadCoord(j + 1) - h - 4;
      for (let t = roadCoord(j) + h + 4; t + 3 <= b; t += 6) {
        L.marks.push(quad(0.3, 3, '#e8c547', [c, 0.03, t + 1.5]), quad(3, 0.3, '#e8c547', [t + 1.5, 0.03, c]));
      }
    }
    for (let j = 0; j <= GRID; j++) {
      const z = roadCoord(j);
      for (let k = -2; k <= 2; k++) {
        const o = k * 2.2;
        if (j < GRID) L.marks.push(quad(1, 3, '#ececec', [c + o, 0.03, z + h + 1.5]));
        if (j > 0) L.marks.push(quad(1, 3, '#ececec', [c + o, 0.03, z - h - 1.5]));
        if (i < GRID) L.marks.push(quad(3, 1, '#ececec', [c + h + 1.5, 0.03, z + o]));
        if (i > 0) L.marks.push(quad(3, 1, '#ececec', [c - h - 1.5, 0.03, z + o]));
      }
    }
  }

  // Quarteirões: prédios altos no centro, casas na periferia, alguns parques
  const inner = BLOCK - SIDEWALK * 2;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const cx = roadCoord(i) + CELL / 2;
      const cz = roadCoord(j) + CELL / 2;
      const ring = Math.max(Math.abs(i - (GRID - 1) / 2), Math.abs(j - (GRID - 1) / 2));
      const type = (i === 3 || i === 4) && (j === 3 || j === 4) ? 'vesper' : rand() < 0.12 ? 'park' : ring < 1.6 ? 'downtown' : ring < 2.6 ? 'mid' : 'houses';
      L.sidewalk.push(box(BLOCK, 0.18, BLOCK, '#ffffff', [cx, 0.09, cz]));
      const lot = box(inner, 0.04, inner, '#ffffff', [cx, LOT - 0.02, cz]);
      (type === 'park' || type === 'houses' ? L.grass : L.sidewalk).push(lot);
      if (builders[type]) builders[type](cx, cz);
      blocks.push({ i, j, cx, cz, type, id: `legacy-b${i}-${j}`, districtId: 'cidade-livre', lotIds: [] });
    }
  }

  buildAirport({ ...L, tower, addCollider });
  scatterCountryTrees({ rand, tree });
  addStreetProps(L, blocks, addCollider, rand);

  // Texturas fotográficas do Poly Haven; o uvScale de cada malha é o tamanho real da foto em metros
  const mats = {
    asphalt: addMacroVariation(polyHavenMaterial('asphalt_02'), 0.06),
    sidewalk: addMacroVariation(polyHavenMaterial('concrete_pavement_02'), 0.05),
    grass: addMacroVariation(polyHavenMaterial('aerial_grass_rock'), 0.25),
    marks: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }),
    foliage: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
    windows: glowsAtNight(new THREE.MeshStandardMaterial({ color: '#1c2730', metalness: 0.8, roughness: 0.06, emissive: '#ffcf8a' }), 0, 0.9),
    // Poças de luz dos postes: somam luz ao chão e só aparecem à noite
    pools: new THREE.MeshBasicMaterial({ map: poolTexture(), color: '#8a5424', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  };
  scene.add(
    mergedMesh(L.asphalt, mats.asphalt, false, 3),
    mergedMesh(L.marks, mats.marks, false),
    mergedMesh(L.sidewalk, mats.sidewalk, false, 1.8),
    mergedMesh(L.grass, mats.grass, false, 15),
    mergedMesh(L.plain),
    mergedMesh(L.foliage, mats.foliage),
    mergedMesh(L.windows, mats.windows, false),
    mergedMesh(L.metal, metalMaterial),
    mergedMesh(L.lamps, lampMaterial, false),
    visibleAtNight(mergedMesh(L.pools, mats.pools, false)),
  );
  for (const [style, parts] of Object.entries(L.facades)) {
    if (!parts.length) continue;
    const photo = PHOTO_FACADES[style];
    const material = photo
      ? withNightWindows(ambientCgMaterial(photo.dir), photoGlow(photo))
      : facadeMaterial(style === 'shop' ? shopTextures() : facadeTextures(style));
    scene.add(mergedMesh(parts, material));
  }
  return { colliders, blocks };
}
