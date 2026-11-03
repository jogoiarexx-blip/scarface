// Dimensões do mundo, em metros
export const GRID = 8; // quarteirões por lado
export const CELL = 70; // distância entre os eixos de duas ruas
export const ROAD = 12; // largura da rua
export const LANE = 3; // distância da faixa até o eixo da rua
export const SIDEWALK = 3; // largura da calçada
export const BLOCK = CELL - ROAD; // quarteirão com calçada
export const HALF = (GRID * CELL) / 2;

// Eixo da rua de índice i (0..GRID), igual para x e z
export const roadCoord = (i) => -HALF + i * CELL;

// Duas pistas paralelas a leste da cidade, alinhadas com o eixo z
export const AIRPORT = { x: HALF + 160, z: 0, length: 520, width: 30 };
AIRPORT.runways = [AIRPORT.x, AIRPORT.x + 60];
export const APRON = { x: HALF + 100, z: roadCoord(2), w: 60, d: 70 };
export const PLANE_SPAWN = { x: AIRPORT.x, z: AIRPORT.z - AIRPORT.length / 2 + 30 };

// Fazenda cercada ao lado do aeroporto, entre a cidade e a pista
export const FARM = { minX: HALF + 22, maxX: AIRPORT.x - 30, minZ: 10, maxZ: 210 };
