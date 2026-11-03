import * as THREE from 'three';
import { Character } from './people.js';
import { resolveCircle, groundHeight } from './collision.js';
import { approach, wrapAngle } from './util.js';

export class Player {
  constructor(scene, x, z) {
    this.char = new Character('casual_man');
    this.mesh = this.char.group;
    scene.add(this.mesh);
    this.pos = new THREE.Vector3(x, groundHeight(x, z), z);
    this.radius = 0.4;
    this.heading = 0;
    this.speed = 0;
    this.vy = 0;
  }

  place(x, z, heading) {
    this.pos.set(x, groundHeight(x, z), z);
    this.heading = heading;
    this.speed = 0;
    this.vy = 0;
    this.sync();
  }

  update(dt, input, camYaw, colliders) {
    const f = input.axis('KeyS', 'KeyW');
    const s = input.axis('KeyA', 'KeyD');
    const run = input.down('ShiftLeft') || input.down('ShiftRight');
    if (f || s) {
      // Anda em relação à câmera; a direita da câmera é (-cos, sin)
      const fx = Math.sin(camYaw);
      const fz = Math.cos(camYaw);
      const mx = fx * f - fz * s;
      const mz = fz * f + fx * s;
      this.heading += wrapAngle(Math.atan2(mx, mz) - this.heading) * Math.min(1, dt * 12);
    }
    this.speed = approach(this.speed, f || s ? (run ? 8 : 4.5) : 0, 30 * dt);
    this.pos.x += Math.sin(this.heading) * this.speed * dt;
    this.pos.z += Math.cos(this.heading) * this.speed * dt;

    const ground = groundHeight(this.pos.x, this.pos.z);
    const onGround = this.pos.y <= ground + 0.01;
    if (onGround && input.pressed('Space')) this.vy = 6;
    this.vy -= 20 * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y < ground) {
      this.pos.y = ground;
      this.vy = 0;
    }
    resolveCircle(this.pos, this.radius, colliders);

    this.char.move(this.speed);
    this.char.update(dt);
    this.sync();
  }

  sync() {
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.heading;
  }
}
