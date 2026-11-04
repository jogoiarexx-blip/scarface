import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../public/assets/workshop/', import.meta.url);
test('texturas da Oficina Valença presentes e íntegras', () => {
  for (const kind of ['plaster','wood','steel','red','blue','rubber']) {
    const svg = readFileSync(fileURLToPath(new URL(kind + '.svg', root)), 'utf-8');
    assert.ok(svg.startsWith('<svg '), 'SVG sem abertura: ' + kind);
    assert.ok(svg.trimEnd().endsWith('</svg>'), 'SVG incompleto: ' + kind);
    assert.ok(svg.length > 500);
  }
});