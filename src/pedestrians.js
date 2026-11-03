import * as THREE from 'three';
import { GRID, CELL, BLOCK, roadCoord } from './config.js';
import { Character, PEOPLE } from './people.js';
import { groundHeight } from './collision.js';
import { pick } from './util.js';

// Cada pedestre dá voltas na calçada de um quarteirão e às vezes atravessa a rua
const S = BLOCK / 2 - 1.5; // meio-lado do caminho
const SIDE = S * 2;
const PERIM = SIDE * 4;
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const cornerIndex = (sx, sz) => CORNERS.findIndex((c) => c[0] === sx && c[1] === sz);
const blockCenter = (i, j) => [roadCoord(i) + CELL / 2, roadCoord(j) + CELL / 2];
const randInt = (n) => Math.floor(Math.random() * n);

class Ped {
  constructor(scene) {
    this.char = new Character(pick(PEOPLE), 0.94 + Math.random() * 0.12);
    this.mesh = this.char.group;
    scene.add(this.mesh);
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.spawn();
  }

  spawn() {
    this.bi = randInt(GRID);
    this.bj = randInt(GRID);
    this.p = Math.random() * PERIM;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.state = 'walk';
    this.hidden = false;
    this.panic = 0;
    this.baseSpeed = 1.2 + Math.random() * 0.6;
    this.char.play('walk', 0);
    this.moveTo(...this.loopPoint(this.p), 0);
  }

  loopPoint(p) {
    const k = Math.floor(p / SIDE) % 4;
    const t = (p % SIDE) / SIDE;
    const a = CORNERS[k];
    const b = CORNERS[(k + 1) % 4];
    const [cx, cz] = blockCenter(this.bi, this.bj);
    return [cx + (a[0] + (b[0] - a[0]) * t) * S, cz + (a[1] + (b[1] - a[1]) * t) * S];
  }

  get speed() {
    return this.panic > 0 ? 5 : this.baseSpeed;
  }

  update(dt) {
    this.panic = Math.max(0, this.panic - dt);
    if (this.state === 'down') return this.updateDown(dt);
    if (this.state === 'flee') {
      this.timer -= dt;
      if (this.timer < 0) return this.spawn();
      return this.moveTo(this.pos.x + Math.sin(this.heading) * 5 * dt, this.pos.z + Math.cos(this.heading) * 5 * dt, dt);
    }
    if (this.state === 'cross') {
      const dx = this.target[0] - this.pos.x;
      const dz = this.target[1] - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.3) {
        [this.bi, this.bj, this.p] = this.next;
        this.state = 'walk';
      } else {
        const step = Math.min(d, this.speed * dt);
        return this.moveTo(this.pos.x + (dx / d) * step, this.pos.z + (dz / d) * step, dt);
      }
    }
    const before = Math.floor(this.p / SIDE);
    this.p = (((this.p + this.dir * this.speed * dt) % PERIM) + PERIM) % PERIM;
    const after = Math.floor(this.p / SIDE);
    if (before !== after && Math.random() < 0.35) this.tryCross(this.dir > 0 ? after : before);
    this.moveTo(...this.loopPoint(this.p), dt);
  }

  // Na esquina k, atravessa para o quarteirão vizinho se houver
  tryCross(k) {
    const [sx, sz] = CORNERS[k];
    const opts = [];
    if (this.bi + sx >= 0 && this.bi + sx < GRID) opts.push([this.bi + sx, this.bj, -sx, sz]);
    if (this.bj + sz >= 0 && this.bj + sz < GRID) opts.push([this.bi, this.bj + sz, sx, -sz]);
    if (!opts.length) return;
    const [ni, nj, nsx, nsz] = pick(opts);
    const [cx, cz] = blockCenter(ni, nj);
    this.target = [cx + nsx * S, cz + nsz * S];
    this.next = [ni, nj, (cornerIndex(nsx, nsz) * SIDE + this.dir * 0.01 + PERIM) % PERIM];
    this.state = 'cross';
  }

  moveTo(x, z, dt) {
    const dx = x - this.pos.x;
    const dz = z - this.pos.z;
    if (dx * dx + dz * dz > 1e-8) this.heading = Math.atan2(dx, dz);
    this.pos.set(x, groundHeight(x, z), z);
    if (dt) this.char.move(Math.hypot(dx, dz) / dt);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.heading;
  }

  knock(fx, fz, speed) {
    this.vel.set(fx * speed * 0.7 + (Math.random() - 0.5) * 3, 4 + speed * 0.25, fz * speed * 0.7 + (Math.random() - 0.5) * 3);
    this.state = 'down';
    this.hidden = true;
    this.timer = 7;
    this.char.fall();
  }

  updateDown(dt) {
    this.vel.y -= 20 * dt;
    this.pos.addScaledVector(this.vel, dt);
    const ground = groundHeight(this.pos.x, this.pos.z);
    if (this.pos.y <= ground) {
      this.pos.y = ground;
      this.vel.set(this.vel.x * 0.85, 0, this.vel.z * 0.85);
    }
    this.mesh.position.copy(this.pos);
    this.timer -= dt;
    if (this.timer < 0) this.spawn();
  }

  flee(x, z, heading) {
    this.state = 'flee';
    this.timer = 5;
    this.panic = 5;
    this.moveTo(x, z, 0);
    this.heading = heading;
    this.mesh.rotation.y = heading;
  }
}

export class Pedestrians {
  constructor(scene, count = 70) {
    this.peds = Array.from({ length: count }, () => new Ped(scene));
  }

  // focus: onde o jogador está; pedestres longe nem são desenhados
  update(dt, playerCar, focus) {
    for (const p of this.peds) {
      p.mesh.visible = Math.abs(p.pos.x - focus.x) < 130 && Math.abs(p.pos.z - focus.z) < 130;
      if (playerCar && p.state !== 'down' && Math.abs(playerCar.speed) > 3) {
        const d = Math.hypot(p.pos.x - playerCar.pos.x, p.pos.z - playerCar.pos.z);
        const fx = Math.sin(playerCar.heading);
        const fz = Math.cos(playerCar.heading);
        if (d < 2.3) p.knock(fx * Math.sign(playerCar.speed), fz * Math.sign(playerCar.speed), Math.abs(playerCar.speed));
        else if (d < 14 && Math.abs(playerCar.speed) > 8) p.panic = 3;
      }
      p.update(dt);
      if (p.mesh.visible) p.char.update(dt);
    }
  }

  // Motorista expulso do carro sai correndo
  ejectDriver(car) {
    const p = this.peds.find((q) => q.state === 'walk');
    if (!p) return;
    const side = car.heading + Math.PI / 2;
    p.flee(car.pos.x + Math.sin(side) * 2.5, car.pos.z + Math.cos(side) * 2.5, side + (Math.random() - 0.5));
  }
}
