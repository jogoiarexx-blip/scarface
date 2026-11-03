import test from 'node:test';
import assert from 'node:assert/strict';
import { VESPER_BLOCKS, defineVesperLots, validateVesperLots } from './vesper-layout.js';
import { resolveCircle } from './collision.js';

const all = VESPER_BLOCKS.flatMap(([i, j]) => defineVesperLots(i, j));
test('Santa Ângela: quatro quadras, 24 lotes com IDs determinísticos', () => {
  assert.equal(VESPER_BLOCKS.length, 4);
  assert.equal(all.length, 24);
  assert.equal(new Set(all.map((x) => x.id)).size, all.length);
  assert.deepEqual(all, VESPER_BLOCKS.flatMap(([i, j]) => defineVesperLots(i, j)));
});
test('lotes preservam fachadas alinhadas, lotação sem interpenetração e acesso orientado', () => {
  assert.deepEqual(validateVesperLots(all), []);
  for (const b of all) {
    assert.equal(b.entranceWorld[2], b.z + b.normalZ * b.d / 2);
    assert.match(b.streetId, /^(sul|norte)-sa-b[34]-[34]$/);
  }
});
test('dois interiores FULL, fachadas SHELL e NONE sem entrada falsa', () => {
  assert.deepEqual(all.filter((x) => x.isEnterable).map((x) => x.id).sort(), ['sa-bar-atlantico', 'sa-oficina-valenca']);
  assert.ok(all.filter((x) => x.tier === 'shell').length >= 2);
  assert.ok(all.filter((x) => x.tier === 'none').length >= 2);
  assert.ok(all.filter((x) => x.tier === 'none').every((x) => !x.isEnterable));
});
test('porta aberta desliga volume de colisão; porta fechada impede passagem', () => {
  const wall = { minX: -1, maxX: 1, minZ: -0.1, maxZ: 0.1, h: 3, disabled: false };
  const p = { x: 0, z: 0, y: 0.18 };
  assert.equal(resolveCircle(p, 0.4, [wall]), true);
  wall.disabled = true;
  const q = { x: 0, z: 0, y: 0.18 };
  assert.equal(resolveCircle(q, 0.4, [wall]), false);
});
test('validador rejeita sobreposição e entrada inexistente', () => {
  const bad = [{ ...all[0], id: 'dup' }, { ...all[0], id: 'dup', tier: 'none', interiorTier: 'none', isEnterable: true }];
  assert.ok(validateVesperLots(bad).some((x) => x.includes('ID duplicado')));
  assert.ok(validateVesperLots(bad).some((x) => x.includes('Sobreposição')));
  assert.ok(validateVesperLots(bad).some((x) => x.includes('Entrada sem interior')));
});

