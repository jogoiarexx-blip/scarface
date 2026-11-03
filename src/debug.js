import { CELL, HALF } from './config.js';
export class DebugOverlay {
  constructor(graphics, vesper) {
    this.graphics = graphics;
    this.vesper = vesper;
    this.visible = false;
    this.elapsed = 0;
    this.el = document.createElement('pre');
    this.el.id = 'world-debug';
    this.el.style.cssText = 'position:fixed;z-index:3;left:12px;top:125px;padding:12px;background:#071319e8;color:#c4ecc9;font:12px/1.5 monospace;border:1px solid #81997b;pointer-events:none;white-space:pre-wrap;max-width:330px;display:none';
    document.body.append(this.el);
  }
  toggle() {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'block' : 'none';
    return this.visible;
  }
  update(dt, pos) {
    if (!this.visible) return;
    this.elapsed += dt;
    if (this.elapsed < 0.35) return;
    this.elapsed = 0;
    const i = Math.floor((pos.x + HALF) / CELL), j = Math.floor((pos.z + HALF) / CELL);
    const nearby = this.vesper.buildings.find((b) =>
      pos.x >= b.x - b.w / 2 - 1.5 && pos.x <= b.x + b.w / 2 + 1.5 &&
      pos.z >= b.z - b.d / 2 - 1.5 && pos.z <= b.z + b.d / 2 + 1.5,
    );
    const r = this.graphics.renderer.info;
    this.el.textContent = [
      'PORTO VESPER · DEBUG F3',
      `FPS: ${this.graphics.fps.toFixed(0)} | qualidade ${this.graphics.level}`,
      `Draw calls: ${r.render.calls} | triângulos: ${r.render.triangles}`,
      `Geometrias: ${r.memory.geometries} | texturas: ${r.memory.textures}`,
      `Posição: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`,
      `Quadra: ${i >= 3 && i <= 4 && j >= 3 && j <= 4 ? `sa-b${i}-${j}` : `legacy-b${i}-${j}`}`,
      `Lote: ${nearby?.id ?? 'sem lote interativo'}`,
      `Interior: ${nearby?.interiorTier ?? '-'} / acessível: ${nearby?.isEnterable ?? false}`,
      `Sala atual: ${this.vesper.activeInterior || 'exterior'}`,
    ].join('\n');
  }
}

