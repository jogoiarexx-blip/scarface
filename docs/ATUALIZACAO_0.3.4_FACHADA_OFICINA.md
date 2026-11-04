# Véspera: Cidade de Sangue — v0.3.4

## Nova fachada otimizada da Oficina Valença
A antiga placa aparecia espelhada e a oficina tinha pouca identidade. A arte aprovada foi recortada e reunida em um único atlas WebP (640 × 320, **6.814 bytes**), que mantém:
- letreiro "OFICINA VALENÇA" legível para quem está na rua (correção da orientação do plano);
- vitrine de mecânica;
- placa de serviços;
- porta de serviço decorativa;
- abertura física de garagem de 6,5 metros e persiana elevada, sem bloqueio invisível.

## Performance
- Somente 1 novo arquivo WebP, solicitado com cache/placeholder do carregador existente;
- quatro planos com diferentes UVs de uma textura compartilhada (não quatro texturas duplicadas);
- duas luminárias suaves sem novas sombras ou modelos GLB;
- geometria mínima na moldura e persiana.

## Compatibilidade
A porta original (E), interior, personagem Helena, chaves, missão e salvamento continuam ativos.
Os testes de colisão e progressão de missão existentes foram preservados.

## Notas sobre limites de validação
Build e testes pelo GitHub Actions. A geometria final deve ser conferida jogando no navegador; não foi realizado playtest WebGL nesta etapa.
