# QA — Porto Vesper 0.2.0 (03/11/2026)

NÃO marcar PASS para código que não foi executado em gameplay.

| ID | Funcionalidade | Status | Método/evidência | Regressão? |
|---|---|---|---|---|
| CITY-001 | Planta estável para mesma seed | PASS | `node --test src/save.test.js` — determina 24 lotes constantes | Não observada no teste |
| CITY-002 | Quatro quadras sem sobreposição de lotes | PASS | validador real dos AABBs (sete testes) | Não observada no teste |
| CITY-003 | Duas entradas FULL e categorias SHELL/NONE | PASS (dados) | teste de classificação e IDs | Não testada visualmente |
| INT-001 | Caminhar, abrir, entrar e sair da Oficina | NOT RUN | necessita navegador e playtest | Desconhecida |
| INT-002 | Entrar/sair do Bar Atlântico | NOT RUN | necessita navegador e playtest | Desconhecida |
| COL-001 | Colisor desativado quando porta aberta | PASS (unidade) | teste `resolveCircle` | Não observada no teste |
| GAME-001 | Missão 1 até entrada no carro | NOT RUN | requer teste controlado no navegador | Desconhecida |
| GAME-002 | Missão 2 e interação Rafael | NOT RUN | requer teste controlado no navegador | Desconhecida |
| SAVE-001 | Estado, dinheiro e reforma sobrevivem a reload | PASS (unidade) | teste com localStorage simulado, sem WebGL | Não testado no navegador |
| SAVE-002 | Recarregar dentro de interior na página publicada | NOT RUN | requer localStorage no navegador | Desconhecida |
| BUILD-001 | `npm run build` | NOT RUN | `npm ci` bloqueado (registry não alcançável), Vite indisponível no ambiente local | Desconhecida |
| PERF-001 | Rota de benchmark a pé/dirigindo | NOT RUN | requer medição em hardware/navegador | Desconhecida |

Comandos verificados nesta sessão: `node --check src/*.js` nos módulos alterados (PASS), `npm test` (7 PASS, incluindo save/reload e reforma). Build não comprovado.

