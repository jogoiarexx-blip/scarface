const keys = new Set();
const pressed = new Set(); // teclas apertadas neste quadro
let mouseX = 0;
let mouseY = 0;
let dragging = false;

addEventListener('keydown', (e) => {
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// Mouse travado (pointer lock) ou, sem trava, arrastando com o botão apertado
addEventListener('mousedown', () => (dragging = true));
addEventListener('mouseup', () => (dragging = false));
addEventListener('mousemove', (e) => {
  if (!document.pointerLockElement && !dragging) return;
  mouseX += e.movementX;
  mouseY += e.movementY;
});

export const input = {
  down: (code) => keys.has(code),
  pressed: (code) => pressed.has(code),
  // -1, 0 ou 1 conforme as duas teclas
  axis: (neg, pos) => (keys.has(pos) ? 1 : 0) - (keys.has(neg) ? 1 : 0),
  consumeMouse() {
    const d = { x: mouseX, y: mouseY };
    mouseX = mouseY = 0;
    return d;
  },
  endFrame: () => pressed.clear(),
};
