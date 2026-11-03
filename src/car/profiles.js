// Perfis laterais dos modelos de carro, em metros.
// Coordenadas [x, y, raio]: x é o comprimento (+ é a frente), y a altura, raio arredonda o canto.
//   top: contorno de cima da carroceria, da traseira (embaixo) até a frente (embaixo)
//   cabin: contorno fechado da cabine (teto e colunas), ou null
//   side: janela lateral [traseira-baixo, traseira-cima, frente-cima, frente-baixo]; pillars: colunas entre janelas
//   ws / rw: para-brisa e vidro traseiro, como [peça, índice de baixo, índice de cima] do contorno
//   belt: linha da cintura (abaixo dela a lateral é reta); tumble: quanto a cabine afina no alto
//   plan: quanto a frente e a traseira arredondam vistas de cima

export const STYLES = {
  sedan: {
    L: 4.7, W: 1.84, cabinW: 1.56, wheelR: 0.34, tireW: 0.24, axleF: 1.42, axleR: -1.40, bottom: 0.32,
    belt: 1.0, roof: 1.47, tumble: 0.17, plan: 0.12,
    top: [[-2.30, 0.32], [-2.36, 0.56, 0.08], [-2.30, 0.93, 0.14], [-1.35, 1.0, 0.3], [1.15, 0.98, 0.35], [2.20, 0.80, 0.3], [2.35, 0.58, 0.12], [2.31, 0.32]],
    cabin: [[-1.55, 0.9], [-1.40, 1.0, 0.08], [-0.82, 1.43, 0.2], [0.28, 1.47, 0.3], [1.32, 0.98, 0.06], [1.42, 0.9]],
    side: [[-1.28, 1.04], [-0.84, 1.38], [0.27, 1.415], [1.12, 1.04]], pillars: [-0.2],
    ws: ['cabin', 4, 3], rw: ['cabin', 1, 2],
    front: { z: 2.36, y: 0.68 }, rear: { z: -2.33, y: 0.80 }, plateF: 0.45, plateR: 0.62,
  },
  hatch: {
    L: 4.1, W: 1.78, cabinW: 1.52, wheelR: 0.32, tireW: 0.22, axleF: 1.27, axleR: -1.25, bottom: 0.30,
    belt: 0.98, roof: 1.48, tumble: 0.16, plan: 0.12,
    top: [[-2.0, 0.32], [-2.06, 0.58, 0.08], [-2.02, 0.98, 0.1], [1.05, 0.96, 0.35], [1.92, 0.80, 0.28], [2.05, 0.58, 0.12], [2.02, 0.30]],
    cabin: [[-2.03, 0.88], [-2.03, 1.0, 0.05], [-1.85, 1.42, 0.15], [0.25, 1.48, 0.3], [1.20, 0.96, 0.06], [1.30, 0.88]],
    side: [[-1.80, 1.03], [-1.70, 1.38], [0.22, 1.42], [1.02, 1.03]], pillars: [-0.45],
    ws: ['cabin', 4, 3], rw: ['cabin', 1, 2],
    front: { z: 2.04, y: 0.66 }, rear: { z: -2.04, y: 0.86 }, plateF: 0.45, plateR: 0.62,
  },
  suv: {
    L: 4.7, W: 1.94, cabinW: 1.70, wheelR: 0.40, tireW: 0.27, axleF: 1.45, axleR: -1.45, bottom: 0.45,
    belt: 1.20, roof: 1.84, tumble: 0.12, plan: 0.10,
    top: [[-2.30, 0.45], [-2.36, 0.75, 0.08], [-2.32, 1.20, 0.12], [1.30, 1.18, 0.35], [2.20, 1.02, 0.3], [2.36, 0.75, 0.15], [2.32, 0.45]],
    cabin: [[-2.32, 1.1], [-2.32, 1.25, 0.05], [-2.12, 1.80, 0.15], [0.40, 1.84, 0.3], [1.40, 1.18, 0.06], [1.50, 1.10]],
    side: [[-2.05, 1.25], [-1.98, 1.74], [0.36, 1.78], [1.22, 1.24]], pillars: [-0.35, -1.35],
    ws: ['cabin', 4, 3], rw: ['cabin', 1, 2],
    front: { z: 2.37, y: 0.88 }, rear: { z: -2.35, y: 1.0 }, plateF: 0.62, plateR: 0.78, rails: true,
  },
  sports: {
    L: 4.5, W: 1.95, cabinW: 1.55, wheelR: 0.33, tireW: 0.28, axleF: 1.38, axleR: -1.32, bottom: 0.26,
    belt: 0.84, roof: 1.20, tumble: 0.22, plan: 0.16,
    top: [[-2.22, 0.28], [-2.27, 0.55, 0.08], [-2.20, 0.86, 0.12], [-1.2, 0.9, 0.4], [1.0, 0.86, 0.4], [1.75, 0.80, 0.3], [2.20, 0.62, 0.2], [2.27, 0.42, 0.1], [2.22, 0.28]],
    cabin: [[-1.75, 0.78], [-1.55, 0.86, 0.1], [-0.55, 1.17, 0.25], [0.15, 1.20, 0.3], [1.15, 0.82, 0.06], [1.25, 0.76]],
    side: [[-1.35, 0.9], [-0.6, 1.13], [0.12, 1.16], [0.94, 0.88]], pillars: [],
    ws: ['cabin', 4, 3], rw: ['cabin', 1, 2],
    front: { z: 2.27, y: 0.55 }, rear: { z: -2.26, y: 0.70 }, plateF: 0.38, plateR: 0.5, spoiler: true,
  },
  pickup: {
    L: 5.3, W: 1.95, cabinW: 1.72, wheelR: 0.40, tireW: 0.28, axleF: 1.70, axleR: -1.55, bottom: 0.48,
    belt: 1.18, roof: 1.88, tumble: 0.10, plan: 0.08,
    top: [[-2.62, 0.48], [-2.66, 0.75, 0.05], [-2.64, 1.20, 0.06], [1.55, 1.18, 0.3], [2.45, 1.05, 0.25], [2.66, 0.80, 0.12], [2.62, 0.48]],
    cabin: [[-0.95, 1.1], [-0.95, 1.86, 0.12], [0.6, 1.88, 0.3], [1.55, 1.18, 0.06], [1.65, 1.1]],
    side: [[-0.82, 1.24], [-0.82, 1.78], [0.55, 1.80], [1.42, 1.24]], pillars: [0.05],
    ws: ['cabin', 3, 2], rw: ['cabin', 0, 1],
    front: { z: 2.67, y: 0.92 }, rear: { z: -2.66, y: 1.0 }, plateF: 0.62, plateR: 0.72, bed: [-2.55, -1.02],
  },
  van: {
    L: 4.9, W: 1.98, cabinW: 1.98, wheelR: 0.36, tireW: 0.25, axleF: 1.60, axleR: -1.55, bottom: 0.38,
    belt: 1.15, roof: 2.05, tumble: 0.06, plan: 0.06,
    top: [[-2.42, 0.38], [-2.46, 0.8, 0.05], [-2.44, 2.0, 0.12], [1.05, 2.05, 0.3], [1.85, 1.35, 0.25], [2.42, 1.0, 0.2], [2.46, 0.7, 0.1], [2.42, 0.38]],
    cabin: null,
    side: [[0.35, 1.3], [0.35, 1.85], [1.15, 1.85], [1.62, 1.3]], pillars: [],
    ws: ['top', 4, 3], rw: null,
    front: { z: 2.47, y: 0.95 }, rear: { z: -2.47, y: 1.0 }, plateF: 0.55, plateR: 0.55,
  },
};

STYLES.taxi = { ...STYLES.sedan, sign: true };

// Cores de rua: muito branco, prata e preto, como na vida real
export const PAINTS = [
  { color: '#f1f1ee', metal: 0.1 },
  { color: '#f1f1ee', metal: 0.1 },
  { color: '#b9bec4', metal: 0.7 },
  { color: '#b9bec4', metal: 0.7 },
  { color: '#0d0e11', metal: 0.4 },
  { color: '#0d0e11', metal: 0.4 },
  { color: '#3b3f45', metal: 0.7 },
  { color: '#7d0f15', metal: 0.6 },
  { color: '#1c3d75', metal: 0.6 },
  { color: '#1f3a2c', metal: 0.6 },
  { color: '#b8a585', metal: 0.5 },
  { color: '#c1121f', metal: 0.3 },
];
export const SPORTS_PAINTS = [{ color: '#e65100', metal: 0.4 }, { color: '#f2c200', metal: 0.3 }, { color: '#c1121f', metal: 0.4 }, { color: '#1b5fd1', metal: 0.6 }];
export const TAXI_PAINT = { color: '#f4c20d', metal: 0.2 };
