import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { manager } from './assets.js';
import { FARM } from './config.js';
import { groundHeight } from './collision.js';
import { box, cyl, mergedMesh } from './geom.js';
import { pick, wrapAngle, clamp } from './util.js';

// Animais animados da Quaternius (CC0), baixados do Poly Pizza.
// height = altura real em metros; walk/run = velocidades em m/s
const SPECIES = {
  horse: { height: 2.1, walk: 1.4, run: 9, zone: 'farm', count: 4 },
  cow: { height: 1.6, walk: 1.0, run: 5, zone: 'farm', count: 6 },
  bull: { height: 1.7, walk: 1.0, run: 6, zone: 'farm', count: 1 },
  donkey: { height: 1.5, walk: 1.1, run: 6, zone: 'farm', count: 2 },
  alpaca: { height: 1.9, walk: 1.1, run: 6, zone: 'farm', count: 4 },
  deer: { height: 1.6, walk: 1.3, run: 10, zone: 'wild', count: 6 },
  stag: { height: 2.1, walk: 1.3, run: 10, zone: 'wild', count: 3 },
  fox: { height: 0.6, walk: 1.4, run: 7, zone: 'wild', count: 4 },
  wolf: { height: 0.95, walk: 1.5, run: 8, zone: 'wild', count: 4 },
  shiba: { height: 0.6, walk: 1.5, run: 6, zone: 'park', count: 4 },
  husky: { height: 0.75, walk: 1.6, run: 7, zone: 'park', count: 4 },
};

// Campos ao norte e ao sul da cidade para os bichos selvagens (a fazenda fica ao lado do aeroporto)
const WILD = [
  { minX: -600, maxX: 200, minZ: 340, maxZ: 650 },
  { minX: -600, maxX: 200, minZ: -650, maxZ: -340 },
];
const CLIPS = { idle: /[|_]Idle$/, eat: /Eating$/, walk: /[|_]Walk$/, run: /Gallop$/, death: /Death$/ };
const SHOW_DISTANCE = 180;

function randomIn(area) {
  return [area.minX + Math.random() * (area.maxX - area.minX), area.minZ + Math.random() * (area.maxZ - area.minZ)];
}

class Animal {
  constructor(template, spec, area) {
    this.spec = spec;
    this.area = area;
    this.mesh = new THREE.Group();
    const model = SkeletonUtils.clone(template.scene);
    model.scale.setScalar(template.scale * (0.9 + Math.random() * 0.2));
    this.mesh.add(model);
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = {};
    for (const [key, clip] of Object.entries(template.clips)) if (clip) this.actions[key] = this.mixer.clipAction(clip);
    this.actions.death.setLoop(THREE.LoopOnce, 1);
    this.actions.death.clampWhenFinished = true;
    this.pos = new THREE.Vector3();
    this.heading = Math.random() * Math.PI * 2;
    this.anim = null;
    this.spawn();
    this.mixer.update(Math.random() * 3); // cada um começa num ponto diferente da animação
  }

  spawn() {
    const [x, z] = randomIn(this.area);
    this.pos.set(x, groundHeight(x, z), z);
    this.rest();
  }

  play(name) {
    if (this.anim === name) return;
    const next = this.actions[name] || this.actions.idle;
    next.reset().fadeIn(0.3).play();
    if (this.anim) this.actions[this.anim]?.fadeOut(0.3);
    this.anim = name;
  }

  rest() {
    this.state = 'rest';
    this.timer = 3 + Math.random() * 7;
    this.play(Math.random() < 0.5 && this.actions.eat ? 'eat' : 'idle');
  }

  wander() {
    this.state = 'walk';
    this.target = randomIn(this.area);
    this.timer = 30;
    this.play('walk');
  }

  flee(fromX, fromZ) {
    if (this.state === 'dead') return;
    this.state = 'flee';
    this.timer = 4;
    this.heading = Math.atan2(this.pos.x - fromX, this.pos.z - fromZ);
    this.play('run');
  }

  die() {
    this.state = 'dead';
    this.timer = 15;
    this.play('death');
  }

  // threat: posição e velocidade do jogador ou do carro dele; dog: cachorro segue o jogador a pé
  update(dt, player, playerCar) {
    const s = this.spec;
    if (this.state === 'dead') {
      this.timer -= dt;
      if (this.timer < 0) this.spawn();
      return;
    }
    if (playerCar && Math.abs(playerCar.speed) > 4) {
      const d = Math.hypot(this.pos.x - playerCar.pos.x, this.pos.z - playerCar.pos.z);
      if (d < 2.2) return this.die();
      if (d < 18 && this.state !== 'flee') this.flee(playerCar.pos.x, playerCar.pos.z);
    }

    let speed = 0;
    let tx = null;
    let tz = null;
    const dPlayer = player ? Math.hypot(this.pos.x - player.pos.x, this.pos.z - player.pos.z) : Infinity;
    if (s.zone === 'park' && dPlayer < 15 && this.state !== 'flee') {
      // Cachorro vem atrás de quem está a pé, sem encostar
      this.state = 'follow';
      if (dPlayer > 2.5) {
        tx = player.pos.x;
        tz = player.pos.z;
        speed = dPlayer > 7 ? s.run * 0.8 : s.walk * 1.6;
      }
    } else if (s.zone !== 'park' && dPlayer < 7 && this.state !== 'flee') {
      this.flee(player.pos.x, player.pos.z);
    }

    if (this.state === 'follow' && dPlayer >= 15) this.rest();
    if (this.state === 'rest') {
      this.timer -= dt;
      if (this.timer < 0) this.wander();
    } else if (this.state === 'walk') {
      tx = this.target[0];
      tz = this.target[1];
      speed = s.walk;
      this.timer -= dt;
      if (Math.hypot(tx - this.pos.x, tz - this.pos.z) < 1 || this.timer < 0) this.rest();
    } else if (this.state === 'flee') {
      speed = s.run;
      this.timer -= dt;
      if (this.timer < 0) this.rest();
    }

    if (tx !== null && speed) {
      const want = Math.atan2(tx - this.pos.x, tz - this.pos.z);
      this.heading += clamp(wrapAngle(want - this.heading), -3 * dt, 3 * dt);
    }
    if (this.state === 'follow') this.play(speed > s.walk * 2 ? 'run' : speed ? 'walk' : 'idle');
    if (speed) {
      this.pos.x = clamp(this.pos.x + Math.sin(this.heading) * speed * dt, this.area.minX, this.area.maxX);
      this.pos.z = clamp(this.pos.z + Math.cos(this.heading) * speed * dt, this.area.minZ, this.area.maxZ);
      this.pos.y = groundHeight(this.pos.x, this.pos.z);
    }
  }

  sync() {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.heading;
  }
}

// Cerca, celeiro, fardos de feno e cocho da fazenda
function buildFarm(scene, colliders) {
  const { minX, maxX, minZ, maxZ } = FARM;
  const wood = '#7a5535';
  const parts = [];
  const rail = (x1, z1, x2, z2) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const along = x1 === x2;
    for (let t = 0; t <= len; t += 3) {
      const x = x1 + ((x2 - x1) * t) / len;
      const z = z1 + ((z2 - z1) * t) / len;
      parts.push(box(0.2, 1.4, 0.2, wood, [x, 0.7, z]));
    }
    for (const y of [0.6, 1.15]) parts.push(box(along ? 0.1 : len, 0.12, along ? len : 0.1, wood, [(x1 + x2) / 2, y, (z1 + z2) / 2]));
  };
  rail(minX, minZ, maxX, minZ);
  rail(minX, maxZ, maxX, maxZ);
  rail(maxX, minZ, maxX, maxZ);
  // Lado da cidade com porteira aberta no meio
  const midZ = (minZ + maxZ) / 2;
  rail(minX, minZ, minX, midZ - 6);
  rail(minX, midZ + 6, minX, maxZ);

  // Celeiro vermelho com telhado de duas águas, de frente para a cidade
  const bx = minX + 22;
  const bz = maxZ - 22;
  parts.push(box(16, 7, 12, '#9e2b25', [bx, 3.5, bz]), box(16.4, 0.6, 12.4, '#e8e2d6', [bx, 0.3, bz]));
  parts.push(box(0.2, 4.5, 5, '#e8e2d6', [bx - 8.05, 2.3, bz]), box(0.25, 4, 4.4, '#7a2420', [bx - 8.1, 2.1, bz]));
  const slope = Math.atan2(3.5, 6.5);
  for (const s of [-1, 1]) parts.push(box(17, 0.3, 7.6, '#4a4f55', [bx, 8.7, bz + s * 3.1], [s * slope, 0, 0]));
  parts.push(box(15.8, 3.4, 0.3, '#9e2b25', [bx, 8.2, bz], [0, 0, 0]));
  colliders.push({ minX: bx - 8.2, maxX: bx + 8.2, minZ: bz - 6.2, maxZ: bz + 6.2, h: 10.5 });

  // Fardos de feno e cocho de água
  for (let k = 0; k < 6; k++) {
    const hx = bx + 11 + (k % 3) * 1.6;
    const hz = bz - 8 + Math.floor(k / 3) * 1.6;
    parts.push(cyl(0.75, 0.75, 1.3, 16, '#d8b45a', [hx, 0.75, hz], [0, 0, Math.PI / 2]));
  }
  parts.push(box(4, 0.7, 1, '#6f6a62', [minX + 60, 0.35, minZ + 40]), box(3.8, 0.05, 0.8, '#4f8fb5', [minX + 60, 0.68, minZ + 40]));
  scene.add(mergedMesh(parts));
}

export async function loadAnimals(scene, colliders, parks) {
  const loader = new GLTFLoader(manager);
  const names = Object.keys(SPECIES);
  const templates = await Promise.all(
    names.map((name) =>
      loader.loadAsync(`assets/animals/${name}.glb`).then((gltf) => {
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        const clips = {};
        for (const [key, re] of Object.entries(CLIPS)) clips[key] = gltf.animations.find((c) => re.test(c.name));
        const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
        return { scene: gltf.scene, clips, scale: SPECIES[name].height / size.y };
      }),
    ),
  );
  buildFarm(scene, colliders);

  const parkAreas = parks.map((b) => ({ minX: b.cx - 24, maxX: b.cx + 24, minZ: b.cz - 24, maxZ: b.cz + 24 }));
  const list = [];
  names.forEach((name, i) => {
    const spec = SPECIES[name];
    for (let k = 0; k < spec.count; k++) {
      const area = spec.zone === 'farm' ? FARM : spec.zone === 'wild' ? pick(WILD) : pick(parkAreas);
      const a = new Animal(templates[i], spec, area);
      scene.add(a.mesh);
      list.push(a);
    }
  });

  return {
    list,
    // focus: onde está o jogador; bichos longe não são desenhados nem animados
    update(dt, focus, player, playerCar) {
      for (const a of list) {
        a.update(dt, player, playerCar);
        a.mesh.visible = Math.abs(a.pos.x - focus.x) < SHOW_DISTANCE && Math.abs(a.pos.z - focus.z) < SHOW_DISTANCE;
        if (!a.mesh.visible) continue;
        a.mixer.update(dt);
        a.sync();
      }
    },
  };
}
