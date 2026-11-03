import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PLANE_SPAWN, AIRPORT } from './config.js';
import { manager } from './assets.js';
import { boxAt } from './collision.js';
import { approach, clamp } from './util.js';

// Aviões pilotáveis, baixados do Poly Pizza (CC-BY 3.0): "Airplane" e "Jet" de Poly by Google,
// "Boeing 747" de Miha Lunar e "Jet" (caça) de jeremy.
// size = maior medida horizontal em metros; yaw = giro para o nariz apontar para +z;
// level = deita o modelo antes (para arquivos que vêm inclinados).
// Cada um tem sua pista: os de trás decolam por cima dos da frente.
const [R1, R2] = AIRPORT.runways;
export const PLANE_TYPES = {
  airliner: {
    file: 'airliner.glb', name: 'avião comercial', size: 37, yaw: 0,
    liftSpeed: 60, thrust: 17, drag: 0.0022, pitchRate: 0.45, rollRate: 0.9, turnRate: 0.8, groundTurn: 0.3,
    crashPad: 9, enterDist: 20, exitDist: 8, camDist: 55, camUp: 12,
    spawn: { x: R1, z: PLANE_SPAWN.z + 10, heading: 0 },
  },
  b747: {
    file: 'b747.glb', name: 'Boeing 747', size: 70, yaw: -2.872, level: true, // o arquivo vem torto em todos os eixos
    liftSpeed: 70, thrust: 19, drag: 0.0019, pitchRate: 0.35, rollRate: 0.7, turnRate: 0.6, groundTurn: 0.25,
    crashPad: 14, enterDist: 34, exitDist: 12, camDist: 95, camUp: 20,
    spawn: { x: R2, z: PLANE_SPAWN.z + 20, heading: 0 },
  },
  privatejet: {
    file: 'privatejet.glb', name: 'jato executivo', size: 20, yaw: 0,
    liftSpeed: 50, thrust: 21, drag: 0.0024, pitchRate: 0.7, rollRate: 1.5, turnRate: 1.1, groundTurn: 0.5,
    crashPad: 5, enterDist: 12, exitDist: 5, camDist: 30, camUp: 7,
    spawn: { x: R2, z: 110, heading: 0 },
  },
  fighter: {
    file: 'fighter.glb', name: 'caça a jato', size: 15, yaw: 0,
    liftSpeed: 55, thrust: 36, drag: 0.0015, pitchRate: 1.4, rollRate: 3.2, turnRate: 1.8, groundTurn: 0.6,
    crashPad: 4, enterDist: 10, exitDist: 4, camDist: 22, camUp: 5,
    spawn: { x: R1, z: 130, heading: 0 },
  },
};

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
const _q = new THREE.Quaternion();
const _euler = new THREE.Euler();

// Avião é quase plano (asas + fuselagem): a direção de menor espalhamento dos vértices é o "para cima".
// O sentido certo é o lado para onde a cauda (deriva) se projeta.
function levelRotation(model) {
  model.updateMatrixWorld(true);
  const pts = [];
  const v = new THREE.Vector3();
  model.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).toArray());
  });
  const mean = [0, 1, 2].map((k) => pts.reduce((sum, q) => sum + q[k], 0) / pts.length);
  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const q of pts) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) cov[a][b] += (q[a] - mean[a]) * (q[b] - mean[b]);
  const { values, vectors } = eigenSymmetric3(cov);
  const k = values.indexOf(Math.min(...values));
  const n = new THREE.Vector3(vectors[0][k], vectors[1][k], vectors[2][k]).normalize();
  let skew = 0;
  for (const q of pts) skew += ((q[0] - mean[0]) * n.x + (q[1] - mean[1]) * n.y + (q[2] - mean[2]) * n.z) ** 3;
  if (skew < 0) n.negate();
  return new THREE.Quaternion().setFromUnitVectors(n, AXIS_Y);
}

// Autovalores e autovetores (colunas) de uma matriz 3x3 simétrica, pelo método de Jacobi
function eigenSymmetric3(m) {
  const a = m.map((r) => [...r]);
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 50; sweep++) {
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
      if (Math.abs(a[p][q]) < 1e-12) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      for (let k = 0; k < 3; k++) {
        const akp = a[k][p];
        const akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p][k];
        const aqk = a[q][k];
        a[p][k] = c * apk - s * aqk;
        a[q][k] = s * apk + c * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = v[k][p];
        const vkq = v[k][q];
        v[k][p] = c * vkp - s * vkq;
        v[k][q] = s * vkp + c * vkq;
      }
    }
  }
  return { values: [a[0][0], a[1][1], a[2][2]], vectors: v };
}

// Carrega os modelos e devolve um avião de cada tipo, parado no aeroporto
export async function loadPlanes(scene, effects) {
  const loader = new GLTFLoader(manager);
  return Promise.all(
    Object.values(PLANE_TYPES).map(async (cfg) => {
      const gltf = await loader.loadAsync(`assets/planes/${cfg.file}`);
      const model = gltf.scene;
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          // Os modelos vêm foscos: pintura com um pouco de brilho para refletir o céu
          for (const m of [].concat(o.material)) {
            m.roughness = 0.45;
            m.metalness = 0.15;
            m.color.multiplyScalar(0.78);
          }
        }
      });
      const yaw = new THREE.Quaternion().setFromAxisAngle(AXIS_Y, cfg.yaw);
      model.quaternion.copy(cfg.level ? yaw.multiply(levelRotation(model)) : yaw);
      // Caixa exata (vértice a vértice): a aproximada erra em modelos girados
      const size = new THREE.Box3().setFromObject(model, true).getSize(new THREE.Vector3());
      model.scale.setScalar(cfg.size / Math.max(size.x, size.z));
      // Centraliza e apoia as rodas em y = 0
      const box = new THREE.Box3().setFromObject(model, true);
      const c = box.getCenter(new THREE.Vector3());
      model.position.set(-c.x, -box.min.y, -c.z);
      const mesh = new THREE.Group();
      mesh.add(model);
      scene.add(mesh);
      return new Plane(cfg, mesh, effects);
    }),
  );
}

// Modelo de voo "arcade": o nariz aponta para onde o avião vai e inclinar faz curva sozinho.
// Eixos locais: +z frente, +y cima; girar +x abaixa o nariz e girar +z inclina para a direita.
export class Plane {
  constructor(cfg, mesh, effects) {
    this.cfg = cfg;
    this.mesh = mesh;
    this.effects = effects;
    this.pos = new THREE.Vector3();
    this.prev = new THREE.Vector3();
    this.quat = new THREE.Quaternion();
    this.vel = new THREE.Vector3();
    this.fwd = new THREE.Vector3(0, 0, 1);
    this.right = new THREE.Vector3();
    this.reset();
  }

  reset() {
    const s = this.cfg.spawn;
    this.pos.set(s.x, 0, s.z);
    this.quat.setFromAxisAngle(AXIS_Y, s.heading);
    this.fwd.set(0, 0, 1).applyQuaternion(this.quat);
    this.speed = 0;
    this.throttle = 0;
    this.onGround = true;
    this.crashed = false;
    this.mesh.visible = true;
    this.sync();
  }

  rotateLocal(axis, angle) {
    this.quat.multiply(_q.setFromAxisAngle(axis, angle));
  }

  update(dt, input, colliders, piloted) {
    if (this.crashed) {
      this.crashTimer -= dt;
      return;
    }
    const cfg = this.cfg;
    let pitch = 0;
    let roll = 0;
    let yaw = 0;
    let brake = false;
    if (piloted) {
      this.throttle = clamp(this.throttle + input.axis('KeyS', 'KeyW') * 0.6 * dt, 0, 1);
      pitch = input.axis('ArrowDown', 'ArrowUp');
      roll = input.axis('ArrowLeft', 'ArrowRight');
      yaw = input.axis('KeyD', 'KeyA');
      brake = input.down('Space');
    } else this.throttle = approach(this.throttle, 0, dt);
    if (!piloted && this.onGround && this.speed === 0) return;

    const ctrl = clamp(this.speed / cfg.liftSpeed, 0, 1);
    this.rotateLocal(AXIS_X, -pitch * cfg.pitchRate * ctrl * dt);
    this.rotateLocal(AXIS_Y, yaw * (this.onGround ? cfg.groundTurn * clamp(this.speed / 3, 0, 1) : 0.4) * dt);
    this.right.set(-1, 0, 0).applyQuaternion(this.quat);
    const bank = -this.right.y; // > 0 com a asa direita para baixo
    if (!this.onGround) {
      this.rotateLocal(AXIS_Z, (roll * cfg.rollRate * ctrl - (roll ? 0 : bank * 0.6)) * dt);
      this.quat.premultiply(_q.setFromAxisAngle(AXIS_Y, -bank * cfg.turnRate * ctrl * dt));
    }
    this.quat.normalize();

    this.fwd.set(0, 0, 1).applyQuaternion(this.quat);
    // Motor menos arrasto; subir gasta velocidade e descer ganha
    this.speed += (this.throttle * cfg.thrust - cfg.drag * this.speed * this.speed - 9.8 * this.fwd.y) * dt;
    if (this.onGround) this.speed = approach(this.speed, 0, (brake ? 14 : 0.8) * dt);
    this.speed = Math.max(0, this.speed);
    this.vel.copy(this.fwd).multiplyScalar(this.speed);
    if (this.speed < cfg.liftSpeed) this.vel.y -= (1 - this.speed / cfg.liftSpeed) * 14;
    this.prev.copy(this.pos);
    this.pos.addScaledVector(this.vel, dt);

    if (this.pos.y <= 0) {
      if (!this.onGround && (this.vel.y < -9 || Math.abs(bank) > 0.5 || this.fwd.y < -0.3)) return this.crash();
      this.pos.y = 0;
      this.onGround = true;
      // Rodas no chão: sem inclinação lateral e sem nariz para baixo
      const heading = Math.atan2(this.fwd.x, this.fwd.z);
      const noseUp = this.speed > cfg.liftSpeed * 0.85 ? Math.max(0, Math.asin(clamp(this.fwd.y, -1, 1))) : 0;
      this.quat.setFromEuler(_euler.set(-noseUp, heading, 0, 'YXZ'));
    } else if (this.pos.y > 0.3) this.onGround = false;

    if (boxAt(this.pos, cfg.crashPad, colliders)) {
      if (this.onGround && this.speed < 15) {
        this.pos.copy(this.prev);
        this.speed = 0;
      } else return this.crash();
    }
    this.sync();
  }

  crash() {
    this.crashed = true;
    this.crashTimer = 3;
    this.speed = 0;
    this.throttle = 0;
    this.mesh.visible = false;
    this.effects.explosion(this.pos);
  }

  sync() {
    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.copy(this.quat);
  }
}
