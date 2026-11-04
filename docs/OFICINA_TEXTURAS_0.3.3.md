# Oficina Valença — texturas 0.3.3

A melhoria estrutural 0.3.2 foi incorporada à versão do repositório.

## Materiais aplicados
- Piso e base: material PBR de concreto com mapa de cor, normal e ARM (arquivo CC0 já presente no projeto).
- Reboco envelhecido: textura SVG de parede.
- Madeira: porta de entrada e bancadas com veios.
- Chapa de aço escovado: porta de enrolar e plataformas.
- Metal pintado vermelho e azul: armários e elevador automotivo.
- Borracha: pilhas de pneus.
- Iluminação interna reforçada, sem sombras adicionais.
- UVs repetidas por metro em cada face: não esticar uma imagem por uma parede inteira.

## Performance e carregamento
Os mapas são compartilhados por material. Os SVGs têm 512 px de dimensão nominal e são rasterizados pelo navegador, com fallback no loader de texturas. As imagens e mapas existentes seguem o cache já implementado. Novos mapas ficam em public/assets/workshop/.

## QA
Os testes automatizados verificam a presença dos seis SVGs. Node --check, npm test e npm run build devem ser executados em CI e a missão deve ser verificada no navegador antes de declarar teste visual completo.
