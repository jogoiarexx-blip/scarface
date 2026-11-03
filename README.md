# IMPÉRIO: REIS DE PORTO VESPER — Vertical slice 0.2.0

Jogo original Three.js/Vite no navegador. Evolução da base Cidade Livre. Preserva os veículos, trânsito, pedestres, fazenda, aeroporto e ciclo de luz, e adiciona o começo do universo Porto Vesper. **O GDD completo é um plano de produção, não um conjunto de funcionalidades concluídas.**

## Onde jogar

Endereço do repositório de destino: [GitHub Pages do scarface](https://jogoiarexx-blip.github.io/scarface/). **O site publicado só receberá esta versão depois que o projeto atualizado for enviado à branch `main` e o workflow terminar com sucesso.**

## Novidades do primeiro recorte

- **Santa Ângela:** 4 quadras com 24 imóveis definidos por lotes/IDs. Dois interiores reais (Oficina Valença, Bar Atlântico) com portas físicas (E).
- **Missões:** Volta ao cais (Helena, chaves, carro) e Portas abertas (Rafael). A terceira ainda não existe.
- **Império:** oficina passa ao jogador após a missão 1; renda por ciclo e até duas reformas com efeito no lucro, persistindo localmente.
- **Save:** grava no navegador (localStorage), com schema e backup. Não sincroniza entre aparelhos.
- **Debug:** F3 exibe FPS, draw calls, geometria, posição, quadra e lote.

## Controles

| Controle | Ação |
|---|---|
| WASD / Shift | Movimento / corrida |
| Mouse | Câmera |
| Espaço | Pular / freio de mão |
| E | Abrir/fechar porta e conversar |
| F | Entrar/sair de carro ou avião |
| I | Menu de império |
| K | Salvar manualmente |
| P ou Esc | Pausar/continuar |
| F3 | Painel de depuração |
| G | Qualidade gráfica |
| H | Alternar céu |

## Desenvolvimento local

Requer Node 22+; na raiz:

```bash
npm ci
npm test
npm run dev
npm run build
```

O projeto inclui workflow GitHub Pages na branch `main`. Os testes estáticos não substituem playtest no navegador. Ver [auditoria](docs/AUDITORIA.md), [QA](docs/QA_EVIDENCIAS.md) e [roadmap](docs/ROADMAP.md).

Créditos e licenças dos assets externos: [CREDITS.md](CREDITS.md). Visuais e história de Porto Vesper são originais; nenhum material do filme/jogo Scarface foi incluído.
