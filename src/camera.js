import * as THREE from 'three';
import { clamp, damp, wrapAngle } from './util.js';

const _desired = new THREE.Vector3();
const _look = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _up = new THREE.Vector3();

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.yaw = 0;
    this.pitch = 0.3;
    this.lastLook = -10;
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.snap = true;
  }

  rotate(dx, dy) {
    if (!dx && !dy) return;
    this.yaw -= dx * 0.0025;
    this.pitch = clamp(this.pitch + dy * 0.002, -0.2, 1.3);
    this.lastLook = performance.now() / 1000;
  }

  // Câmera em terceira pessoa para quem está a pé ou de carro.
  // Com heading, ela volta sozinha para trás do carro quando o mouse fica parado.
  follow(dt, target, { dist, height, heading = null, speed = 0 }) {
    if (heading !== null && performance.now() / 1000 - this.lastLook > 1.5 && Math.abs(speed) > 2) {
      this.yaw += wrapAngle(heading - this.yaw) * damp(2.5, dt);
      this.pitch += (0.22 - this.pitch) * damp(1.5, dt);
    }
    const c = Math.cos(this.pitch);
    _desired.set(
      target.x - Math.sin(this.yaw) * dist * c,
      target.y + height + dist * Math.sin(this.pitch),
      target.z - Math.cos(this.yaw) * dist * c,
    );
    _look.set(target.x, target.y + height, target.z);
    this.apply(dt, heading === null ? 20 : 10);
  }

  // Câmera de perseguição do avião, presa à orientação dele
  chase(dt, pos, quat, dist = 22, up = 5) {
    _fwd.set(0, 0, 1).applyQuaternion(quat);
    _up.set(0, 1, 0).applyQuaternion(quat);
    _desired.copy(pos).addScaledVector(_fwd, -dist).addScaledVector(_up, up * 0.6).add({ x: 0, y: up, z: 0 });
    _look.copy(pos).addScaledVector(_fwd, dist * 0.55).add({ x: 0, y: up * 0.5, z: 0 });
    this.yaw = Math.atan2(_fwd.x, _fwd.z);
    this.pitch = 0.3;
    this.apply(dt, 6);
  }

  apply(dt, k) {
    if (this.snap) {
      this.pos.copy(_desired);
      this.look.copy(_look);
      this.snap = false;
    } else {
      this.pos.lerp(_desired, damp(k, dt));
      this.look.lerp(_look, damp(k * 1.5, dt));
    }
    if (this.pos.y < 0.5) this.pos.y = 0.5;
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.look);
  }
}
