import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveGameAsset } from './asset-paths.js';
const base = 'https://jogoiarexx-blip.github.io/scarface/';
test('GitHub Pages em modo branch carrega a pasta public/assets', () => {
  assert.equal(resolveGameAsset('assets/people/casual_man.glb', { raw: true, base }),
    base + 'public/assets/people/casual_man.glb');
  assert.equal(resolveGameAsset('./assets/textures/asphalt_02/diff.jpg', { raw: true, base }),
    base + 'public/assets/textures/asphalt_02/diff.jpg');
});
test('Build Vite conserva URLs originais em dist/assets', () => {
  assert.equal(resolveGameAsset('assets/hdri/day_4k.hdr', { raw: false, base }), 'assets/hdri/day_4k.hdr');
});
test('Recursos externos ou relativos a outras pastas não são reescritos', () => {
  const urls = [
    'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js',
    'data:image/png;base64,AAAA', 'blob:https://example.com/obj',
    './models/prop.glb', '/assets/name.jpg', 'public/assets/name.jpg',
  ];
  for (const url of urls) assert.equal(resolveGameAsset(url, { raw: true, base }), url);
});
