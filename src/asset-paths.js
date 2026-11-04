/**
 * Resolve recursos em dois formatos de hospedagem:
 * 1. Build Vite: /scarface/assets/... (public copiado para dist)
 * 2. GitHub Pages em modo branch: /scarface/public/assets/...
 * URLs externas, data:, blob: e caminhos já resolvidos não são alterados.
 */
export function resolveGameAsset(url, { raw = false, base = 'https://example.org/scarface/' } = {}) {
  if (!raw || typeof url !== 'string' || !/^(?:\.\/)?assets\//.test(url)) return url;
  return new URL('public/' + url.replace(/^\.\//, ''), base).href;
}
