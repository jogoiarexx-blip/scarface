// Primeiro recorte jogável do GDD: duas missões do Ato I e um negócio persistente.
// Nenhum objetivo futuro é marcado como concluído sem implementação.
const KEY = 'porto-vesper-save-v1';
const BACKUP = `${KEY}-backup`;
const VERSION = 1;
const DEFAULT = () => ({
  schemaVersion: VERSION,
  gameVersion: '0.2.0',
  world: { seed: 7, generatorVersion: 'legacy-1+vesper-1' },
  player: { x: 7.5, z: 12, heading: 0 },
  mission: { id: 'm01', step: 'reach_workshop', completed: [] },
  business: { workshop: { owned: false, upgrade: 0, cycles: 0 } },
  money: 500,
  influence: 0,
  elapsed: 0,
  clock: { day: 1, minutes: 480 },
});
const OBJECTIVES = {
  reach_workshop: 'Volta ao cais: encontre a Oficina Valença, na Rua das Palmeiras, e entre pela porta.',
  talk_helena: 'Converse com Helena dentro da oficina (E).',
  collect_keys: 'Pegue as chaves sobre a bancada nos fundos da oficina (E).',
  enter_car: 'Saia da oficina e entre no carro estacionado perto do ponto inicial (F).',
  visit_bar: 'Portas abertas: encontre o Bar Atlântico e entre pela porta (E).',
  talk_rafael: 'Converse com Rafael no salão do Bar Atlântico (E).',
  coming_soon: 'Ato I, missão 3 — A conta vence: desenvolvimento futuro.',
};
const TARGETS = {
  reach_workshop: { x: 20, z: 18 },
  talk_helena: { x: 27.3, z: 31 },
  collect_keys: { x: 20.5, z: 37 },
  enter_car: { x: 5, z: 16 },
  visit_bar: { x: -50, z: 18 },
  talk_rafael: { x: -42.7, z: 31 },
};
function validSave(state) {
  return state && state.schemaVersion === VERSION &&
    state.world?.seed === 7 &&
    Number.isFinite(state.player?.x) && Number.isFinite(state.player?.z) &&
    Math.abs(state.player.x) < 1800 && Math.abs(state.player.z) < 1800 &&
    Array.isArray(state.mission?.completed) &&
    typeof state.mission?.step === 'string' &&
    Object.hasOwn(OBJECTIVES, state.mission.step) &&
    Number.isFinite(state.money) && state.money >= 0 &&
    state.business?.workshop && Number.isInteger(state.business.workshop.upgrade);
}

export class Campaign {
  constructor(vesper, player, toast) {
    this.vesper = vesper;
    this.player = player;
    this.toast = toast;
    this.state = DEFAULT();
    this.objectiveEl = document.getElementById('mission-objective');
    this.accountEl = document.getElementById('account');
    this.panel = document.getElementById('empire-panel');
    this.summaryEl = document.getElementById('empire-summary');
    document.getElementById('upgrade-workshop').addEventListener('click', () => this.upgradeWorkshop());
    this.hasSavedGame = this.load();
    this.render();
  }

  load() {
    for (const k of [KEY, BACKUP]) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const save = JSON.parse(raw);
        if (!validSave(save)) continue;
        this.state = save;
        this.player.place(save.player.x, save.player.z, save.player.heading || 0);
        this.vesper.setRenovated(save.business.workshop.upgrade > 0);
        this.render();
        return true;
      } catch (error) { console.warn(`Save inválido (${k}):`, error); }
    }
    return false;
  }

  reset() {
    this.state = DEFAULT();
    this.player.place(this.state.player.x, this.state.player.z, this.state.player.heading);
    this.vesper.setRenovated(false);
    this.render();
    this.hasSavedGame = this.save();
  }

  save(position = this.player.pos) {
    const s = this.state;
    s.player = { x: position.x, z: position.z, heading: this.player.heading };
    if (!validSave(s)) return false;
    try {
      const previous = localStorage.getItem(KEY);
      if (previous) {
        try { if (validSave(JSON.parse(previous))) localStorage.setItem(BACKUP, previous); }
        catch { /* não salvar cópia corrompida */ }
      }
      localStorage.setItem(KEY, JSON.stringify(s));
      this.hasSavedGame = true;
      return JSON.stringify(JSON.parse(localStorage.getItem(KEY))) === JSON.stringify(s);
    } catch (error) {
      console.warn('Não foi possível salvar progresso:', error);
      this.toast('Armazenamento indisponível: progresso não salvo');
      return false;
    }
  }

  next(step) {
    this.state.mission.step = step;
    this.render();
    this.save();
  }

  onInteraction(action) {
    if (!action) return;
    const step = this.state.mission.step;
    if (action.type === 'door') {
      if (action.open && step === 'reach_workshop' && action.buildingId === 'sa-oficina-valenca') this.toast('Oficina aberta. Entre e procure Helena.');
      if (action.open && step === 'visit_bar' && action.buildingId === 'sa-bar-atlantico') this.toast('Bar Atlântico aberto. Entre e procure Rafael.');
      return;
    }
    if (action.type === 'helena') {
      if (step === 'talk_helena') {
        this.toast('Helena: "Precisamos do carro e de um trabalho honesto para salvar a oficina."', 4);
        this.next('collect_keys');
      } else this.toast('Helena: "A oficina é tudo o que nos resta."', 3);
    } else if (action.type === 'keys') {
      if (step === 'collect_keys') {
        this.toast('Chaves recuperadas! Procure o carro do lado de fora.');
        this.next('enter_car');
      } else this.toast('Chaves da Oficina Valença.');
    } else if (action.type === 'rafael') {
      if (step === 'talk_rafael') {
        this.toast('Rafael: "Porto Vesper está mudando. Temos de cuidar dos nossos."', 4);
        this.complete('m02', 180);
        this.next('coming_soon');
      } else this.toast('Rafael: "Sempre bom ver um rosto conhecido."', 3);
    }
  }

  onCarEntered() {
    if (this.state.mission.step !== 'enter_car') return;
    this.toast('Missão concluída: Volta ao cais! +$350, oficina recuperada.', 4);
    this.state.business.workshop.owned = true;
    this.state.influence += 5;
    this.complete('m01', 350);
    this.next('visit_bar');
  }

  complete(id, reward) {
    if (this.state.mission.completed.includes(id)) return;
    this.state.mission.completed.push(id);
    this.state.money += reward;
    this.render();
    this.save();
  }

  tick(dt, currentInterior) {
    const s = this.state;
    s.elapsed += dt;
    s.clock.minutes += dt * 0.25; // 1 minuto de jogo = 4 segundos reais, sem renda por frame.
    if (s.clock.minutes >= 1440) { s.clock.minutes -= 1440; s.clock.day++; }
    if (s.mission.step === 'reach_workshop' && currentInterior === 'sa-oficina-valenca') this.next('talk_helena');
    if (s.mission.step === 'visit_bar' && currentInterior === 'sa-bar-atlantico') this.next('talk_rafael');
    if (s.business.workshop.owned) {
      const cycle = 60; // 60s de jogo por ciclo; não paga ciclos offline.
      const previousCycle = Math.floor((s.elapsed - dt) / cycle);
      const currentCycle = Math.floor(s.elapsed / cycle);
      if (currentCycle > previousCycle) {
        const count = Math.min(currentCycle - previousCycle, 1);
        const net = this.workshopProfit();
        s.money += net * count;
        s.business.workshop.cycles += count;
        this.toast(`Oficina Valença: lucro líquido +$${net}`);
        this.render();
        this.save();
      }
    }
  }

  workshopProfit() {
    // Receita por ciclo menos despesas e folha; upgrade altera uma receita real.
    const upgrade = this.state.business.workshop.upgrade;
    return Math.round(44 * (1 + upgrade * 0.45) - 15 - 9);
  }

  upgradeWorkshop() {
    const b = this.state.business.workshop;
    if (!b.owned) return this.toast('Conclua Volta ao cais para recuperar a oficina.');
    if (b.upgrade >= 2) return this.toast('A oficina já alcançou o nível máximo deste protótipo.');
    const cost = b.upgrade === 0 ? 250 : 400;
    if (this.state.money < cost) return this.toast(`Dinheiro insuficiente: são necessários $${cost}.`);
    this.state.money -= cost;
    b.upgrade++;
    this.vesper.setRenovated(true);
    this.toast(`Oficina reformada! Lucro líquido: $${this.workshopProfit()}/ciclo.`);
    this.render();
    this.save();
  }

  toggleEmpire(force) {
    const show = force ?? this.panel.hidden;
    this.panel.hidden = !show;
    this.render();
    return show;
  }

  target() { return TARGETS[this.state.mission.step] || null; }

  render() {
    const s = this.state;
    this.objectiveEl.textContent = OBJECTIVES[s.mission.step];
    this.accountEl.textContent = `VÉSPERA · 1988 | ${Math.floor(s.money)} · Influência ${s.influence}`;
    const b = s.business.workshop;
    const cost = b.upgrade === 0 ? '$250' : b.upgrade === 1 ? '$400' : 'Máximo';
    this.summaryEl.textContent = `Ato I · ${s.mission.completed.length}/6 missões | Oficina: ${b.owned ? `sua · nível ${b.upgrade + 1} · receita líquida $${this.workshopProfit()}/ciclo` : 'a recuperar'} | Próxima reforma: ${cost}`;
    document.getElementById('upgrade-workshop').disabled = !b.owned || b.upgrade >= 2 || s.money < (b.upgrade === 0 ? 250 : 400);
  }
}

