import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Do mais leve ao mais bonito. "post" liga o pós-processamento (brilho, sombra de contato).
export const PRESETS = [
  { name: 'Baixo', ratio: () => 0.75, shadow: 1024, post: false },
  { name: 'Médio', ratio: (dpr) => Math.min(dpr, 1), shadow: 2048, post: false },
  { name: 'Alto', ratio: (dpr) => Math.min(dpr, 1.25), shadow: 2048, post: true, bloom: true, msaa: 4 },
  { name: 'Ultra', ratio: (dpr) => Math.min(dpr, 2), shadow: 4096, post: true, bloom: true, msaa: 4, ao: true },
];

export class Graphics {
  constructor() {
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.prepend(r.domElement);
    this.renderer = r;
    this.composer = null;
    this.level = 2;
    this.auto = true; // desce a qualidade sozinho se o FPS ficar baixo
    this.fps = 60;
    this.frames = 0;
    this.elapsed = 0;
    this.slowSeconds = 0;
    this.grace = 6; // ignora os primeiros segundos (shaders compilando)
  }

  setup(scene, camera, sun) {
    this.scene = scene;
    this.camera = camera;
    this.sun = sun;
    this.apply(this.level);
    addEventListener('resize', () => this.resize());
  }

  apply(level) {
    this.level = level;
    const p = PRESETS[level];
    const r = this.renderer;
    r.setPixelRatio(p.ratio(devicePixelRatio));
    r.setSize(innerWidth, innerHeight);

    this.sun.shadow.mapSize.set(p.shadow, p.shadow);
    if (this.sun.shadow.map) {
      this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
    }

    this.composer?.dispose();
    this.composer = null;
    if (p.post) {
      const target = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: p.msaa });
      const c = new EffectComposer(r, target);
      c.addPass(new RenderPass(this.scene, this.camera));
      if (p.ao) {
        const ao = new GTAOPass(this.scene, this.camera, innerWidth, innerHeight);
        ao.updateGtaoMaterial({ radius: 2.5, thickness: 2, distanceFallOff: 1, scale: 1.2 });
        c.addPass(ao);
      }
      if (p.bloom) c.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.35, 0.55, 0.92));
      c.addPass(new OutputPass());
      c.setSize(innerWidth, innerHeight);
      this.composer = c;
    }
    return p.name;
  }

  // Tecla G: próxima qualidade (e o jogador passa a mandar, sem ajuste automático)
  cycle() {
    this.auto = false;
    return this.apply((this.level + 1) % PRESETS.length);
  }

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer?.setSize(innerWidth, innerHeight);
  }

  render() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  // Mede o FPS real; devolve um aviso quando baixa a qualidade sozinho
  monitor(realDt) {
    this.frames++;
    this.elapsed += realDt;
    if (this.elapsed < 1) return null;
    this.fps = this.frames / this.elapsed;
    this.frames = 0;
    this.elapsed = 0;
    if (this.grace > 0) {
      this.grace--;
      return null;
    }
    if (!this.auto || this.level === 0) return null;
    this.slowSeconds = this.fps < 35 ? this.slowSeconds + 1 : 0;
    if (this.slowSeconds < 4) return null;
    this.slowSeconds = 0;
    this.grace = 3;
    return `Gráficos: ${this.apply(this.level - 1)} (FPS baixo)`;
  }
}
