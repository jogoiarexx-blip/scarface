import { CELL, roadCoord } from './config.js';

export const VESPER_BLOCKS = Object.freeze([[3, 3], [4, 3], [3, 4], [4, 4]]);

/** Planta reproduzível de Santa Ângela: fachadas justapostas e dois lados de rua. */
export function defineVesperLots(i, j) {
  if (!VESPER_BLOCKS.some(([bi, bj]) => bi === i && bj === j)) return [];
  const cx = roadCoord(i) + CELL / 2;
  const cz = roadCoord(j) + CELL / 2;
  const blockId = `sa-b${i}-${j}`;
  const interiorBlock = j === 4;
  const anchor = interiorBlock
    ? (i === 4 ? 'sa-oficina-valenca' : 'sa-bar-atlantico')
    : `sa-${i}-${j}-loja-ancora`;
  const firstTier = interiorBlock ? 'full' : 'shell';
  const defs = [
    // Face sul: alinhada a z = cz - 17.
    { id: anchor, x: cx - 12, z: cz - (interiorBlock ? 5 : 12), w: 22, d: interiorBlock ? 24 : 10, tier: firstTier, name: i === 4 && j === 4 ? 'OFICINA VALENÇA' : i === 3 && j === 4 ? 'BAR ATLÂNTICO' : 'COMÉRCIO LOCAL', use: firstTier === 'full' ? 'entertainment' : 'retail', normalZ: -1 },
    { id: `sa-${i}-${j}-loja`, x: cx + 7, z: cz - 12, w: 16, d: 10, tier: 'shell', name: i === 4 ? 'MERCADO PALMEIRAS' : 'FARMÁCIA CENTRAL', use: 'retail', normalZ: -1 },
    { id: `sa-${i}-${j}-fachada`, x: cx + 19, z: cz - 12, w: 8, d: 10, tier: 'none', name: 'CASA 42', use: 'residential', normalZ: -1 },
    // Face norte: fachada voltada à rua de trás, miolo da quadra livre.
    { id: `sa-${i}-${j}-norte-1`, x: cx - 12, z: cz + 20, w: 22, d: 10, tier: 'none', name: 'RESIDENCIAL VESPER', use: 'residential', normalZ: 1 },
    { id: `sa-${i}-${j}-norte-2`, x: cx + 7, z: cz + 20, w: 16, d: 10, tier: 'shell', name: 'BAZAR DO BAIRRO', use: 'retail', normalZ: 1 },
    { id: `sa-${i}-${j}-norte-3`, x: cx + 19, z: cz + 20, w: 8, d: 10, tier: 'none', name: 'CASA 44', use: 'residential', normalZ: 1 },
  ];
  return defs.map((b) => ({
    ...b,
    blockId,
    streetId: `${b.normalZ === -1 ? 'sul' : 'norte'}-${blockId}`,
    lotId: b.id,
    frontageMeters: b.w,
    depthMeters: b.d,
    frontageNormal: [0, b.normalZ],
    entranceWorld: [b.x, 0.2, b.z + b.normalZ * b.d / 2],
    interiorTier: b.tier,
    isEnterable: b.tier === 'full',
  }));
}

/** Valida a planta antes de criar geometria. Paredes compartilhadas são permitidas. */
export function validateVesperLots(lots) {
  const issues = [];
  const ids = new Set();
  for (const a of lots) {
    if (ids.has(a.id)) issues.push(`ID duplicado: ${a.id}`);
    ids.add(a.id);
    if (!(a.w > 2 && a.d > 2)) issues.push(`Dimensão inválida: ${a.id}`);
    if (a.isEnterable && a.interiorTier !== 'full') issues.push(`Entrada sem interior completo: ${a.id}`);
    if (a.entranceWorld[2] !== a.z + a.normalZ * a.d / 2) issues.push(`Entrada invertida: ${a.id}`);
  }
  for (let i = 0; i < lots.length; i++) for (let j = i + 1; j < lots.length; j++) {
    const a = lots[i], b = lots[j];
    if (a.blockId !== b.blockId) continue;
    const ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2);
    const oz = Math.min(a.z + a.d / 2, b.z + b.d / 2) - Math.max(a.z - a.d / 2, b.z - b.d / 2);
    if (ox > 0.005 && oz > 0.005) issues.push(`Sobreposição: ${a.id} / ${b.id}`);
  }
  return issues;
}

