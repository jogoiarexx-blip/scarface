# Auditoria antes/depois — 03/11/2026

## Estado inicial confirmado no ZIP recebido e no repositório scarface
- Projeto Cidade Livre, Vite + Three.js, 64 quadras em malha 8 × 8, casas, torres, parques, céu HDR, pedestres, carros, aviões e animais.
- Ausentes: campanha Porto Vesper, lotes com IDs estáveis, portas utilizáveis, dois interiores exploráveis, economia, tela de pausa, save de campanha, ferramentas de debug de lotes.
- `buildCity` usava uma seleção única por quadra; outros prédios continuavam simples volumetrias com colisão AABB. Não havia função de entrada.
- Saída do veículo ignorava colisão lateral no ponto de spawn. Câmera passava através de paredes.
- O mapa original e aeronaves NÃO foram removidos; eles permanecem como infraestrutura herdada e não representam os distritos completos do GDD.

## Entrega desta iteração
- Quatro quadras reservadas para Santa Ângela, 24 lotes contíguos com IDs/ruas/entradas estáveis e três categorias de interior.
- Oficina Valença e Bar Atlântico com piso, quatro paredes, porta articulada, móveis, colisões, entrada e saída física, NPCs interativos.
- Casas `none` e vitrines `shell` fechadas, sem prompt de acesso indevido.
- Sequência inicial jogável: missão 1 (oficina, Helena, chaves, carro) e missão 2 (bar, Rafael). Missão 3 apenas indicada como futura.
- Economia mínima de oficina (lucro líquido por ciclo, duas reformas com custo e efeito), progresso via localStorage validado, cópia de segurança e progresso serializado.
- Menu de império, pausa que interrompe o relógio offline, UI de objetivo e marcador no minimapa, debug F3 e ajuste de câmera próximo das colisões.

## Riscos/limitações
- As outras 60 quadras são legado com geometrias anteriores; o gerador urbano completo, com ruas/parcelamento dinâmicos, ainda não existe.
- Não há teste visual de caminhar/entrar num navegador neste ambiente, nem benchmark comparável de FPS. Os testes automatizados não certificam gameplay.
- `npm ci` não completou neste runtime por indisponibilidade de acesso ao registry. O build local não foi validado; GitHub Actions executará seu próprio build quando publicado.
- Save cobre missões, dinheiro, propriedade e posição do personagem; não guarda aeronaves/carros roubados nem todas as mudanças do mundo. É uma persistência inicial, não o contrato final do GDD.
- O acesso aos interiores é por porta física, mas não há streaming/occlusion por chunk para ativos interiores; dois interiores leves ficam residentes.
- Os novos meshes são blockout arquitetônico com materiais simples. Ainda faltam assets finais e tratamento cinematográfico.

