import test from 'node:test';
import assert from 'node:assert/strict';
import { Campaign } from './campaign.js';

function fakeUI() {
  const elements = new Map();
  globalThis.document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { textContent: '', hidden: true, disabled: false, addEventListener() {} });
    return elements.get(id);
  } };
  const storage = new Map();
  globalThis.localStorage = {
    getItem(k) { return storage.get(k) ?? null; },
    setItem(k, value) { storage.set(k, value); },
  };
  return { storage, elements };
}
function createCampaign() {
  const player = { pos: { x: 7.5, z: 12 }, heading: 0, place(x,z,heading) { this.pos = {x,z}; this.heading=heading; } };
  const vesper = { setRenovated(){} };
  const toast = () => {};
  return new Campaign(vesper, player, toast);
}
test('missão 1 dá recompensa única e é preservada após recarregar', () => {
  fakeUI();
  const c = createCampaign();
  assert.equal(c.state.money, 500);
  c.state.mission.step = 'enter_car';
  c.onCarEntered();
  assert.equal(c.state.money, 850);
  assert.equal(c.state.mission.completed.length, 1);
  assert.equal(c.state.business.workshop.owned, true);
  assert.equal(c.state.mission.step, 'visit_bar');
  assert.equal(c.save(), true);
  const reloaded = createCampaign();
  assert.equal(reloaded.state.money, 850);
  assert.equal(reloaded.state.mission.step, 'visit_bar');
  reloaded.onCarEntered();
  assert.equal(reloaded.state.money, 850);
  assert.equal(reloaded.state.mission.completed.length, 1);
});
test('upgrade desconta custo, aumenta lucro e permanece no save', () => {
  fakeUI();
  const c = createCampaign();
  c.state.business.workshop.owned = true;
  c.upgradeWorkshop();
  assert.equal(c.state.money, 250);
  assert.equal(c.state.business.workshop.upgrade, 1);
  assert.ok(c.workshopProfit() > 20);
  const r = createCampaign();
  assert.equal(r.state.business.workshop.upgrade, 1);
  assert.equal(r.state.money, 250);
});

