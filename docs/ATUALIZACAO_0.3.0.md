# Véspera: Cidade de Sangue — atualização 0.3.0

- Identidade original e menu inicial com Novo Jogo, Continuar, Opções e Créditos.
- Novo Jogo reinicia campanha com confirmação para evitar perda acidental de progresso.
- Continua usando a chave de save existente `porto-vesper-save-v1`.
- Fila de texturas: até 5 downloads simultâneos, cache por URL/opções, fallback de 4px em erro, redução de largura e altura proporcional.
- Opções gráficas: teto 512/1024/2048 px nas texturas da GPU; não reduz bytes transferidos do JPEG original.
- Carregamento inicial prioriza só personagens essenciais. Aviões, animais, outras pessoas e céu HDR são carregados após iniciar a partida.
- Céu gradiente continua visível antes do HDR; atualização de sol evita corrida entre solicitações de céus.
- Erros isolados de modelos extras não abortam a campanha.

## Evidências
Node `--check` dos módulos alterados e `npm test` da lógica passaram no ambiente de trabalho. Build Vite e teste WebGL requerem execução do GitHub Actions e playtest no navegador. Não declarar aprovação desses testes antes da execução.
