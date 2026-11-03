import * as THREE from 'three';
import { GRID, ROAD, LANE, roadCoord } from './config.js';
import { CarModel } from './car/carModel.js';
import { PAINTS, SPORTS_PAINTS, TAXI_PAINT } from './car/profiles.js';
import { resolveCircle } from './collision.js';
import { approach, clamp, wrapAngle, pick } from './util.js';

// Modelo sorteado com pesos: muitos sedãs e hatches, poucos esportivos
const STYLE_WEIGHTS = [['sedan', 30], ['hatch', 25], ['suv', 18], ['taxi', 9], ['pickup', 7], ['van', 5], ['sports', 6]];
function pickStyle() {
  let r = Math.random() * STYLE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  for (const [name, w] of STYLE_WEIGHTS) if ((r -= w) < 0) return name;
  return 'sedan';
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const _probe = new THREE.Vector3();
const valid = (i, j) => i >= 0 && i <= GRID && j >= 0 && j <= GRID;
const randInt = (n) => Math.floor(Math.random() * n);

// Ponto na faixa da direita de quem segue no sentido d, a `off` metros do cruzamento (i, j).
// A direita de d = (dx, dz) é (-dz, dx).
function lanePoint(i, j, d, off, lane = LANE) {
  return new THREE.Vector3(roadCoord(i) + d[0] * off - d[1] * lane, 0, roadCoord(j) + d[1] * off + d[0] * lane);
}

function randomSegment() {
  for (;;) {
    const i = randInt(GRID + 1);
    const j = randInt(GRID + 1);
    const d = pick(DIRS);
    if (valid(i + d[0], j + d[1])) return { i, j, d };
  }
}

export class Car {
  constructor(scene) {
    const style = pickStyle();
    const paint = style === 'taxi' ? TAXI_PAINT : style === 'sports' ? pick(SPORTS_PAINTS) : pick(PAINTS);
    this.model = new CarModel(style, paint);
    scene.add(this.model.root);
    this.pos = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.prevHeading = 0;
    this.prevSpeed = 0;
    this.mode = 'parked'; // 'ai' | 'player' | 'parked'
    this.radius = this.model.style.L / 2 - 0.2;
    this.cruise = 9 + Math.random() * 4;
    this.waypoints = [];
    this.stuck = 0;
    this.ghost = 0;
  }

  startOnRoad() {
    const { i, j, d } = randomSegment();
    const end = lanePoint(i + d[0], j + d[1], d, -ROAD / 2);
    this.pos.copy(lanePoint(i, j, d, ROAD / 2)).lerp(end, Math.random());
    this.heading = this.prevHeading = Math.atan2(d[0], d[1]);
    this.dir = d;
    this.node = [i + d[0], j + d[1]];
    this.waypoints = [end];
    this.planNext();
    this.mode = 'ai';
    this.speed = this.cruise;
    this.sync();
  }

  parkOnCurb() {
    const { i, j, d } = randomSegment();
    const a = lanePoint(i, j, d, ROAD / 2 + 8, 5);
    const b = lanePoint(i + d[0], j + d[1], d, -ROAD / 2 - 8, 5);
    this.pos.copy(a).lerp(b, Math.random());
    this.heading = this.prevHeading = Math.atan2(d[0], d[1]);
    this.mode = 'parked';
    this.sync();
  }

  // Escolhe a próxima rua no cruzamento à frente (nunca volta, a não ser sem saída)
  planNext() {
    const [i, j] = this.node;
    const d = this.dir;
    let opts = DIRS.filter((n) => !(n[0] === -d[0] && n[1] === -d[1]) && valid(i + n[0], j + n[1]));
    if (!opts.length) opts = [[-d[0], -d[1]]];
    const straight = opts.find((n) => n[0] === d[0] && n[1] === d[1]);
    const n = straight && Math.random() < 0.5 ? straight : pick(opts);
    this.waypoints.push(lanePoint(i, j, n, ROAD / 2), lanePoint(i + n[0], j + n[1], n, -ROAD / 2));
    this.dir = n;
    this.node = [i + n[0], j + n[1]];
  }

  updateAI(dt, obstacles) {
    let t = this.waypoints[0];
    if (this.pos.distanceToSquared(t) < 6) {
      this.waypoints.shift();
      if (this.waypoints.length < 2) this.planNext();
      t = this.waypoints[0];
    }
    const dx = t.x - this.pos.x;
    const dz = t.z - this.pos.z;
    const diff = wrapAngle(Math.atan2(dx, dz) - this.heading);
    this.heading += clamp(diff, -1.8 * dt, 1.8 * dt);

    let want = this.cruise * clamp(1 - Math.abs(diff) / 1.2, 0.25, 1);
    // Freia antes de uma curva no próximo cruzamento
    const next = this.waypoints[1];
    if (next && Math.hypot(dx, dz) < 16) {
      const turn = wrapAngle(Math.atan2(next.x - t.x, next.z - t.z) - Math.atan2(dx, dz));
      if (Math.abs(turn) > 0.3) want = Math.min(want, 5);
    }
    this.ghost = Math.max(0, this.ghost - dt);
    if (this.blocked(obstacles)) {
      want = 0;
      this.stuck += dt;
      if (this.stuck > 3) this.ghost = 2; // dois carros travados no cruzamento: um passa
    } else this.stuck = 0;
    const braking = want < this.speed - 0.3;
    this.speed = approach(this.speed, want, (braking ? 14 : 4) * dt);
    this.move(dt);
    this.animate(dt, braking);
  }

  blocked(obstacles) {
    const fx = Math.sin(this.heading);
    const fz = Math.cos(this.heading);
    for (const o of obstacles) {
      if (o === this || o.hidden || (this.ghost > 0 && o.mode === 'ai')) continue;
      const rx = o.pos.x - this.pos.x;
      const rz = o.pos.z - this.pos.z;
      const ahead = rx * fx + rz * fz;
      if (ahead > 0 && ahead < 9 && Math.abs(rx * fz - rz * fx) < 1.7) return true;
    }
    return false;
  }

  updatePlayer(dt, input, colliders) {
    const t = input.axis('KeyS', 'KeyW');
    const steer = input.axis('KeyD', 'KeyA');
    if (t > 0) this.speed += (this.speed < 0 ? 22 : 11) * dt;
    else if (t < 0) this.speed -= (this.speed > 0 ? 22 : 7) * dt;
    else this.speed = approach(this.speed, 0, 3 * dt);
    if (input.down('Space')) this.speed = approach(this.speed, 0, 28 * dt);
    this.speed = clamp(this.speed, -10, 45);
    // Volante perde força em alta velocidade e não gira o carro parado
    const grip = clamp(Math.abs(this.speed) / 5, 0, 1) / (1 + Math.abs(this.speed) / 30);
    this.heading += steer * 1.9 * grip * Math.sign(this.speed) * dt;
    this.move(dt);
    if (this.collide(colliders)) this.speed *= Math.abs(this.speed) > 6 ? -0.3 : 0.6;
    const braking = input.down('Space') || (t < 0 && this.speed > 0.5) || (t > 0 && this.speed < -0.5);
    this.animate(dt, braking, steer * 0.5);
  }

  // Dois círculos (frente e traseira) da largura do carro: passa rente aos postes sem enroscar
  collide(colliders) {
    const off = this.model.style.L / 2 - 1;
    let hit = false;
    for (const s of [1, -1]) {
      _probe.set(this.pos.x + Math.sin(this.heading) * off * s, 0, this.pos.z + Math.cos(this.heading) * off * s);
      const x = _probe.x;
      const z = _probe.z;
      if (resolveCircle(_probe, 1, colliders)) {
        this.pos.x += _probe.x - x;
        this.pos.z += _probe.z - z;
        hit = true;
      }
    }
    if (hit) this.sync();
    return hit;
  }

  move(dt) {
    this.pos.x += Math.sin(this.heading) * this.speed * dt;
    this.pos.z += Math.cos(this.heading) * this.speed * dt;
    this.sync();
  }

  // Rodas giram e esterçam, carroceria balança, lanterna acende na freada
  animate(dt, braking, steer = null) {
    if (steer === null) {
      // Ângulo de esterço que explica a curva feita (modelo de bicicleta)
      const yawRate = wrapAngle(this.heading - this.prevHeading) / dt;
      const v = Math.abs(this.speed) < 1.5 ? 1.5 * Math.sign(this.speed || 1) : this.speed;
      steer = clamp(Math.atan((yawRate * 2.8) / v), -0.6, 0.6);
    }
    this.model.animate(dt, this.speed, steer, (this.speed - this.prevSpeed) / dt, braking);
    this.prevHeading = this.heading;
    this.prevSpeed = this.speed;
  }

  sync() {
    this.model.root.position.copy(this.pos);
    this.model.root.rotation.y = this.heading;
  }
}

export class Traffic {
  constructor(scene, moving = 28, parked = 22) {
    this.cars = [];
    for (let k = 0; k < moving; k++) {
      const c = new Car(scene);
      c.startOnRoad();
      this.cars.push(c);
    }
    for (let k = 0; k < parked; k++) {
      const c = new Car(scene);
      c.parkOnCurb();
      this.cars.push(c);
    }
  }

  // others: pedestres e o jogador, para os carros frearem
  update(dt, input, colliders, others) {
    const obstacles = this.cars.concat(others);
    for (const c of this.cars) {
      if (c.mode === 'ai') c.updateAI(dt, obstacles);
      else if (c.mode === 'player') c.updatePlayer(dt, input, colliders);
      else {
        c.model.setLights(false); // estacionado: luzes apagadas
        if (c.speed) {
          c.speed = approach(c.speed, 0, 8 * dt);
          c.move(dt);
          c.collide(colliders);
          c.animate(dt, false);
        }
      }
    }
    // Batidas do carro do jogador com os outros
    const pc = this.cars.find((c) => c.mode === 'player');
    if (!pc) return;
    for (const c of this.cars) {
      if (c === pc) continue;
      const dx = c.pos.x - pc.pos.x;
      const dz = c.pos.z - pc.pos.z;
      const d = Math.hypot(dx, dz);
      const min = pc.radius + c.radius;
      if (d >= min || d < 1e-4) continue;
      const push = (min - d) / 2;
      pc.pos.x -= (dx / d) * push;
      pc.pos.z -= (dz / d) * push;
      c.pos.x += (dx / d) * push;
      c.pos.z += (dz / d) * push;
      pc.speed *= 0.5;
      if (c.mode === 'ai') c.speed = 0;
      pc.sync();
      c.sync();
    }
  }

  nearest(pos, maxDist) {
    let best = null;
    let bestD = maxDist;
    for (const c of this.cars) {
      const d = c.pos.distanceTo(pos);
      if (d < bestD && c.mode !== 'player') {
        best = c;
        bestD = d;
      }
    }
    return best;
  }
}
