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
  follow(dt, target, { dist, height, heading = null, speed = 0, colliders = [] }) {
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
    this.apply(dt, heading === null ? 20 : 10, colliders);
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

  // Limita o braço da câmera antes de atingir paredes, sem raycast nas malhas visuais.
  // A origem é a altura dos olhos, para não confundir calçadas com obstáculos.
  avoidWalls(colliders) {
    const ox = _look.x, oy = _look.y, oz = _look.z;
    const dx = _desired.x - ox, dy = _desired.y - oy, dz = _desired.z - oz;
    let limit = 1;
    for (const c of colliders) {
      if (c.disabled || c.h < Math.min(oy, _desired.y) - 0.25) continue;
      // Teste barato da região antes de calcular a interseção do segmento.
      if (c.minX > Math.max(ox, _desired.x) + 0.25 || c.maxX < Math.min(ox, _desired.x) - 0.25 ||
          c.minZ > Math.max(oz, _desired.z) + 0.25 || c.maxZ < Math.min(oz, _desired.z) - 0.25) continue;
      let enter = 0, leave = limit;
      for (const [p, delta, min, max] of [
        [ox, dx, c.minX - 0.22, c.maxX + 0.22],
        [oy, dy, (c.minY ?? 0) - 0.2, c.h + 0.2],
        [oz, dz, c.minZ - 0.22, c.maxZ + 0.22],
      ]) {
        if (Math.abs(delta) < 1e-6) {
          if (p < min || p > max) { enter = 2; break; }
          continue;
        }
        const a = (min - p) / delta, b = (max - p) / delta;
        enter = Math.max(enter, Math.min(a, b));
        leave = Math.min(leave, Math.max(a, b));
        if (enter > leave) break;
      }
      if (enter <= leave && enter >= 0 && enter < limit) limit = Math.max(0.08, enter - 0.04);
    }
    if (limit < 1) _desired.set(ox + dx * limit, oy + dy * limit, oz + dz * limit);
  }

  apply(dt, k, colliders = []) {
    if (colliders.length) this.avoidWalls(colliders);
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
