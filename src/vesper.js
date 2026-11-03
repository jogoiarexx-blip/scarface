import * as THREE from 'three';
import { Character } from './people.js';
import { defineVesperLots, validateVesperLots } from './vesper-layout.js';

// Vertical slice de Santa Ângela. Cada lote tem identidade e dimensões fixas,
// e os interiores FULL ocupam volumes reais do quarteirão, não teleportes.
const COLORS = {
  wall: 0xd3c4a7, trim: 0xf4e9d2, floor: 0x7c7364,
  workshop: 0xb58d5d, bar: 0x426a65, shell: 0xb9b7a9,
  glass: 0x264455, wood: 0x654431, steel: 0x52606a,
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const materialCache = new Map();
function mat(color, opts = {}) {
  const key = `${color}:${opts.opacity ?? 1}:${opts.emissive ?? 0}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({
    color, roughness: 0.74, metalness: 0.08, ...opts,
  }));
  return materialCache.get(key);
}
function blockCenter(i, j) {
  return { x: roadCoord(i) + CELL / 2, z: roadCoord(j) + CELL / 2 };
}
function cube(parent, x, y, z, w, h, d, color, opts) {
  const m = new THREE.Mesh(boxGeo, mat(color, opts));
  m.position.set(x, y, z);
  m.scale.set(w, h, d);
  m.castShadow = h > 0.45;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function collider(list, x, z, w, d, h, id, minY = 0) {
  const c = { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h, minY, id };
  list.push(c);
  return c;
}
function sign(scene, title, x, z, width, color, side = -1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = '#f9efdb';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 35px system-ui';
  ctx.fillText(title, 256, 49, 490);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.6), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  mesh.position.set(x, 3.35, z + side * 0.14);
  if (side > 0) mesh.rotation.y = Math.PI;
  scene.add(mesh);
  return { mesh, tex };
}

export class VesperDistrict {
  constructor(scene, colliders, blocks) {
    this.scene = scene;
    this.colliders = colliders;
    this.buildings = [];
    this.doors = [];
    this.interactions = [];
    this.actors = [];
    this.blockIds = [];
    this.businessSigns = [];
    this.activeInterior = null;
    for (const b of blocks.filter((b) => b.type === 'vesper')) {
      b.districtId = 'santa-angela';
      b.id = `sa-b${b.i}-${b.j}`;
      b.lotIds = [];
      this.blockIds.push(b.id);
      this.makeStreet(b);
    }
  }

  makeStreet(block) {
    const lots = defineVesperLots(block.i, block.j);
    const issues = validateVesperLots(lots);
    if (issues.length) throw new Error(`Quadra inválida ${block.id}: ${issues.join('; ')}`);
    for (const lot of lots) {
      block.lotIds.push(lot.id);
      this.buildings.push(lot);
      if (lot.tier === 'full') this.makeFull(lot, lot.name, lot.id === 'sa-oficina-valenca');
      else this.makeFacade(lot, lot.name, lot.tier === 'shell');
    }
  }

  makeFull(b, title, isWorkshop) {
    const g = new THREE.Group();
    this.scene.add(g);
    const floor = 0.2;
    const left = b.x - b.w / 2;
    const right = b.x + b.w / 2;
    const front = b.z - b.d / 2;
    const back = b.z + b.d / 2;
    const height = 4.1;
    const color = isWorkshop ? COLORS.workshop : COLORS.bar;
    const wall = (x, z, w, d, colorOverride = color) => {
      cube(g, x, floor + height / 2, z, w, height, d, colorOverride);
      collider(this.colliders, x, z, w, d, floor + height, `${b.id}:wall`);
    };
    cube(g, b.x, floor - 0.08, b.z, b.w, 0.16, b.d, COLORS.floor);
    wall(left + 0.15, b.z, 0.3, b.d);
    wall(right - 0.15, b.z, 0.3, b.d);
    wall(b.x, back - 0.15, b.w, 0.3);
    const entryX = b.x - 3;
    const gap = 2.6;
    const gapLeft = entryX - gap / 2;
    const gapRight = entryX + gap / 2;
    wall((left + gapLeft) / 2, front + 0.15, gapLeft - left, 0.3);
    wall((gapRight + right) / 2, front + 0.15, right - gapRight, 0.3);
    // Vão da porta: a parte superior é fixa e a folha abre em pivô próprio.
    cube(g, entryX, floor + 3.35, front + 0.15, gap, 1.5, 0.3, COLORS.trim);
    const doorRoot = new THREE.Group();
    doorRoot.position.set(gapLeft, floor + 1.22, front + 0.14);
    g.add(doorRoot);
    cube(doorRoot, (gap - 0.12) / 2, 0, 0, gap - 0.12, 2.42, 0.12, COLORS.wood);
    cube(doorRoot, gap - 0.4, -0.12, -0.09, 0.11, 0.11, 0.15, 0xd7b37f);
    const doorCollider = collider(this.colliders, entryX, front + 0.14, gap, 0.22, floor + 2.5, `${b.id}:door`);
    this.doors.push({ id: `${b.id}:door`, buildingId: b.id, x: entryX, z: front, root: doorRoot, collider: doorCollider, target: 0, open: 0 });
    // Interior montado com paredes físicas, circulação central e móveis fora do vão.
    cube(g, b.x + 5, floor + 0.8, b.z - 4, 4, 1.25, 1.6, COLORS.wood);
    collider(this.colliders, b.x + 5, b.z - 4, 4, 1.6, floor + 1.5, `${b.id}:counter`);
    cube(g, b.x + 6, floor + 1.5, b.z + 5, 3.6, 0.16, 2.8, COLORS.steel);
    collider(this.colliders, b.x + 6, b.z + 5, 3.6, 2.8, floor + 1.55, `${b.id}:table`);
    cube(g, b.x - 7, floor + 1.0, b.z + 4, 1.5, 1.9, 6, isWorkshop ? COLORS.steel : COLORS.wood);
    collider(this.colliders, b.x - 7, b.z + 4, 1.5, 6, floor + 2, `${b.id}:shelf`);
    for (let i = 0; i < 3; i++) cube(g, b.x + 8, floor + 2.8, b.z - 7 + i * 4, 1.0, 0.15, 0.2, 0xe7cc9c, { emissive: 0x7e5b2f, emissiveIntensity: 0.35 });
    // Teto desativado apenas enquanto o jogador ocupa a sala; evita teto cortando câmera.
    const roof = cube(g, b.x, floor + height + 0.13, b.z, b.w + 0.45, 0.25, b.d + 0.45, 0x8b8c83);
    b.roof = roof;
    b.roomBounds = { minX: left + 0.3, maxX: right - 0.3, minZ: front + 0.3, maxZ: back - 0.3 };
    const s = sign(this.scene, title, b.x + 2, front, Math.min(12, b.w - 4), isWorkshop ? '#5b4034' : '#214a4c');
    if (isWorkshop) this.businessSigns.push(s);
    // NPCs reais com animação idle e prompt de conversa.
    const actor = new Character(isWorkshop ? 'casual_woman' : 'business_man');
    actor.group.position.set(b.x + 4.3, floor, b.z + 1);
    actor.group.rotation.y = Math.PI;
    this.scene.add(actor.group);
    this.actors.push(actor);
    this.interactions.push({
      type: isWorkshop ? 'helena' : 'rafael',
      id: `${b.id}:contact`,
      x: b.x + 4.3, z: b.z + 1,
      label: isWorkshop ? 'E — conversar com Helena' : 'E — conversar com Rafael',
      buildingId: b.id,
    });
    // Um objeto relevante da primeira missão fica acessível dentro da oficina.
    if (isWorkshop) {
      cube(g, b.x - 2.5, floor + 1.2, b.z + 7, 1.5, 1.1, 0.8, 0x8a704e);
      this.interactions.push({ type: 'keys', id: 'sa-car-keys', x: b.x - 2.5, z: b.z + 7, label: 'E — pegar as chaves do carro', buildingId: b.id });
    }
  }

  makeFacade(b, name, shell) {
    const front = b.z + b.normalZ * b.d / 2;
    const back = b.z - b.normalZ * b.d / 2;
    const color = shell ? COLORS.shell : 0xcbbfa8;
    const group = new THREE.Group();
    this.scene.add(group);
    if (shell) {
      // Vitrine de profundidade verdadeira, porém sem rota acessível: apenas shell.
      cube(group, b.x, 1.95, back + b.normalZ * 0.18, b.w, 3.9, 0.36, color);
      cube(group, b.x - b.w / 2 + 0.16, 1.95, b.z, 0.32, 3.9, b.d, color);
      cube(group, b.x + b.w / 2 - 0.16, 1.95, b.z, 0.32, 3.9, b.d, color);
      cube(group, b.x, 0.15, b.z, b.w, 0.3, b.d, 0x9c958b);
      cube(group, b.x, 2.1, front - b.normalZ * 0.10, b.w - 0.6, 2.8, 0.08, COLORS.glass, { transparent: true, opacity: 0.48, depthWrite: false });
      cube(group, b.x, 0.8, b.z + 2, b.w - 3, 1.0, 1.3, COLORS.wood);
      cube(group, b.x, 4, b.z, b.w, 0.3, b.d, color);
    } else {
      cube(group, b.x, 3.05, b.z, b.w, 6.1, b.d, color);
      for (let f = 0; f < 2; f++) cube(group, b.x, 1.7 + f * 2.7, front + b.normalZ * 0.05, 2.8, 1.4, 0.08, COLORS.glass);
    }
    collider(this.colliders, b.x, b.z, b.w, b.d, shell ? 4.1 : 6.1, `${b.id}:solid`);
    sign(this.scene, name, b.x, front, b.w - 1.2, shell ? '#405b5f' : '#6b5944', b.normalZ);
  }

  nearest(position) {
    let nearest = null;
    let distance = Infinity;
    const options = [
      ...this.doors.map((d) => ({ ...d, type: 'door', label: `E — ${d.target ? 'fechar' : 'abrir'} ${d.buildingId === 'sa-oficina-valenca' ? 'Oficina Valença' : 'Bar Atlântico'}`, maxDistance: 3.1 })),
      ...this.interactions.map((x) => ({ ...x, maxDistance: 2.6 })),
    ];
    for (const item of options) {
      const d = Math.hypot(item.x - position.x, item.z - position.z);
      if (d < item.maxDistance && d < distance) { nearest = item; distance = d; }
    }
    return nearest;
  }

  interact(position) {
    const nearby = this.nearest(position);
    if (!nearby) return null;
    if (nearby.type === 'door') {
      const door = this.doors.find((d) => d.id === nearby.id);
      door.target = door.target ? 0 : 1;
      return { type: 'door', buildingId: door.buildingId, open: !!door.target };
    }
    return nearby;
  }

  update(dt, pos) {
    for (const door of this.doors) {
      // Evita fechar a porta sobre o jogador enquanto ele está perto do batente.
      if (!door.target && Math.hypot(pos.x - door.x, pos.z - door.z) < 2.2 && door.open > 0.2) door.target = 1;
      door.open += (door.target - door.open) * Math.min(1, dt * 7);
      door.root.rotation.y = door.open * -Math.PI * 0.51;
      door.collider.disabled = door.open > 0.88;
    }
    this.activeInterior = null;
    for (const b of this.buildings) {
      if (b.tier !== 'full') continue;
      const r = b.roomBounds;
      const inside = pos.x > r.minX && pos.x < r.maxX && pos.z > r.minZ && pos.z < r.maxZ;
      b.roof.visible = !inside;
      if (inside) this.activeInterior = b.id;
    }
    for (const actor of this.actors) actor.update(dt);
  }

  setRenovated(renovated) {
    for (const { mesh } of this.businessSigns) mesh.material.color.set(renovated ? '#ffe2a6' : '#ffffff');
  }

  getManifest() {
    return this.buildings.map(({ roof, roomBounds, ...b }) => ({ ...b }));
  }
}

