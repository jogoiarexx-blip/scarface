// Coisas que mudam à noite: materiais que brilham mais e objetos que só aparecem no escuro
// (poças de luz dos postes, fachos dos faróis). O céu chama setNight ao trocar de horário.

const glowing = [];
const nightOnly = [];
let night = false;

export const isNight = () => night;

export function glowsAtNight(material, day, nightIntensity) {
  glowing.push({ material, day, night: nightIntensity });
  material.emissiveIntensity = night ? nightIntensity : day;
  return material;
}

export function visibleAtNight(object) {
  nightOnly.push(object);
  object.visible = night;
  return object;
}

export function setNight(on) {
  night = on;
  for (const g of glowing) g.material.emissiveIntensity = on ? g.night : g.day;
  for (const o of nightOnly) o.visible = on;
}
