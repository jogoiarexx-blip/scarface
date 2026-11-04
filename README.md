# VÉSPERA: CIDADE DE SANGUE — Versão 0.3.0

Jogo original Three.js/Vite no navegador. Evolução da base Cidade Livre. Preserva os veículos, trânsito, pedestres, fazenda, aeroporto e ciclo de luz, e adiciona o começo do universo Porto Vesper. **O GDD completo é um plano de produção, não um conjunto de funcionalidades concluídas.**

## Onde jogar

Endereço do repositório de destino: [GitHub Pages do scarface](https://jogoiarexx-blip.github.io/scarface/). O código atualizado será publicado via GitHub Actions após o workflow de Pages concluir.

## Novidades do primeiro recorte

- **Novo título:** Véspera: Cidade de Sangue. Porto Vesper continua sendo o nome da cidade, não do jogo.
- **Menu principal:** novo jogo, continuar, opções, créditos, pausa com retorno ao menu.
- **Carregamento progressivo:** cache, limite de 5 imagens em paralelo, texturas de reserva, redução proporcional e fallback para erro.
- **Inicialização:** núcleo de personagens primeiro; aviões, modelos extras, animais e céu HDR carregam depois de entrar na partida.
- **Opções:** qualidade gráfica e limite de resolução das texturas (512/1024/2048). Isto economiza memória da GPU, não os bytes baixados originalmente.


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

## Correção de rotas (0.3.1)

- O menu possui favicon local em `favicon.svg`, sem pedir `/favicon.ico` na raiz do domínio.
- O HTML usa entrada relativa `./src/main.js` para não apontar indevidamente para `https://jogoiarexx-blip.github.io/src/main.js`.
- Quando o Pages serve diretamente a branch, a import map usa Three.js 0.186.1 em CDN e o gerenciador de recursos reescreve `assets/` para `public/assets/`.
- Quando o GitHub Pages usa **Settings → Pages → Source: GitHub Actions** (recomendado), o Vite empacota os imports e utiliza os assets locais em `dist/assets/`, sem usar a CDN.
- Teste de rotas: `node --test src/asset-paths.test.js`, incluído em `npm test`.

Os erros 404 devem ser avaliados pelo **URL completo** na aba Network; o ícone ausente não impede sozinho o jogo de iniciar.
