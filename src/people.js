import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { manager } from './assets.js';

// Pessoas animadas da Quaternius (CC0), baixadas do Poly Pizza
export const PEOPLE = [
  'casual_man', 'business_man', 'suit_man', 'hoodie', 'worker', 'longsleeves_man',
  'casual_woman', 'tanktop_woman', 'dress_woman', 'woman_a', 'woman_b',
];

// Os arquivos usam dois esqueletos com nomes diferentes ("CharacterArmature|Walk", "HumanArmature|Man_Walk"):
// a animação é achada pelo fim do nome
const CLIPS = { idle: /[|_]Idle$/, walk: /[|_]Walk$/, run: /[|_]Run$/, death: /[|_]Death$/ };
const HEIGHT = 1.75;

const templates = {};
const inflight = new Map();
const CORE_PEOPLE = ['casual_man', 'business_man', 'casual_woman', 'worker'];
function emergencyTemplate() {
  const scene = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.85, 4, 8), new THREE.MeshStandardMaterial({ color: 0x8b918f }));
  body.position.y = 0.88; scene.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0xb28f73 }));
  head.position.y = 1.62; scene.add(head);
  const clips = Object.fromEntries(['idle','walk','run','death'].map(name => [name, new THREE.AnimationClip(name, 1, [])]));
  return { scene, clips, scale: 1 };
}

export function loadPeople(coreOnly = false) {
  const loader = new GLTFLoader(manager);
  return Promise.all(
    (coreOnly ? CORE_PEOPLE : PEOPLE).map((name) => {
      if (templates[name]) return Promise.resolve();
      if (inflight.has(name)) return inflight.get(name);
      const task = loader.loadAsync(`assets/people/${name}.glb`).then((gltf) => {
        const clips = {};
        for (const [key, re] of Object.entries(CLIPS)) clips[key] = gltf.animations.find((c) => re.test(c.name));
        const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        templates[name] = { scene: gltf.scene, clips, scale: HEIGHT / Math.max(size.y, 0.01) };
      }).catch(err => console.warn('Pessoa indisponível:', name, err));
      inflight.set(name, task);
      return task;
    }),
  );
}

export class Character {
  constructor(name, height = 1) {
    const t = templates[name] || templates[CORE_PEOPLE.find(key => templates[key])] || templates[Object.keys(templates)[0]];
    const source = t || emergencyTemplate();
    if (!t) console.warn('Modelos de personagens indisponíveis; exibindo reserva.');
    this.group = new THREE.Group();
    const model = SkeletonUtils.clone(source.scene);
    model.scale.setScalar(source.scale * height);
    this.group.add(model);
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = {};
    for (const [key, clip] of Object.entries(source.clips)) this.actions[key] = this.mixer.clipAction(clip);
    this.actions.death.setLoop(THREE.LoopOnce, 1);
    this.actions.death.clampWhenFinished = true;
    this.current = null;
    this.play('idle');
  }

  play(name, fade = 0.25) {
    if (this.current === name) return;
    const next = this.actions[name];
    const prev = this.actions[this.current];
    next.reset().setEffectiveWeight(1).fadeIn(fade).play();
    if (prev) prev.fadeOut(fade);
    this.current = name;
  }

  // Escolhe parado, andando ou correndo pela velocidade, e acerta o ritmo dos passos
  move(speed) {
    if (this.current === 'death') return;
    if (speed < 0.3) return this.play('idle');
    const running = speed > 3.2;
    this.play(running ? 'run' : 'walk');
    this.actions[this.current].setEffectiveTimeScale(running ? speed / 5.5 : speed / 1.5);
  }

  fall() {
    this.play('death', 0.1);
  }

  update(dt) {
    this.mixer.update(dt);
  }
}
