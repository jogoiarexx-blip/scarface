import * as THREE from 'three';

const ball = new THREE.IcosahedronGeometry(1, 1);

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  // Bola de fogo que cresce e some, seguida de fumaça subindo
  explosion(pos) {
    for (let k = 0; k < 16; k++) {
      const fire = k < 7;
      const color = fire ? (k % 2 ? '#ffb020' : '#ff5a1f') : '#4a4a4a';
      const m = new THREE.Mesh(ball, new THREE.MeshBasicMaterial({ color, transparent: true }));
      m.position.set(pos.x + (Math.random() - 0.5) * 5, pos.y + 1 + Math.random() * 3, pos.z + (Math.random() - 0.5) * 5);
      this.scene.add(m);
      this.items.push({ m, life: 0, max: fire ? 1.2 : 3.5, grow: fire ? 8 : 5, rise: fire ? 2 : 5 });
    }
  }

  update(dt) {
    for (const it of this.items) {
      it.life += dt;
      const t = Math.min(it.life / it.max, 1);
      it.m.scale.setScalar(1 + it.grow * Math.sqrt(t));
      it.m.position.y += it.rise * dt;
      it.m.material.opacity = 1 - t;
      if (t >= 1) {
        this.scene.remove(it.m);
        it.m.material.dispose();
      }
    }
    this.items = this.items.filter((it) => it.life < it.max);
  }
}
