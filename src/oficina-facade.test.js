import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const filename = new URL('../public/assets/oficina-valenca/fachada-atlas.webp', import.meta.url);

test('atlas WebP da nova Oficina Valença é válido e leve', () => {
  const data = readFileSync(filename);
  assert.equal(data.toString('ascii', 0, 4), 'RIFF');
  assert.equal(data.toString('ascii', 8, 12), 'WEBP');
  assert.equal(data.length, 6814);
  assert.equal(createHash('sha256').update(data).digest('hex'), '8d0b27521ea89f5692b54ca9156a9c92385bbf1b89219beee2340b94fa71b4cd');
  assert.ok(data.length < 16000);
});
