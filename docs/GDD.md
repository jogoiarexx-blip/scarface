# IMPÉRIO: REIS DE PORTO VESPER
## GDD + TDD + Plano de implementação para Gemini — Three.js

**Versão:** 1.0 — 03/11/2026  
**Formato:** Jogo 3D em terceira pessoa, mundo aberto por distritos contínuos, campanha cinematográfica e administração de império criminoso.  
**Plataforma principal:** PC / navegador desktop, hospedagem estática em GitHub Pages.  
**Motor:** Three.js + JavaScript/TypeScript modular + Vite, sem obrigatoriedade de servidor.  
**Classificação temática pretendida:** adulto (violência, linguagem e crime ficcional).  
**Situação:** documento de pré-produção; não representa funcionalidades já implementadas.  
**Objetivo deste arquivo:** entregar a uma IA de programação (Gemini) um contrato claro de produto, arquitetura, ordem de execução, testes e critérios de aceitação.

> **Direção autoral:** atmosfera de ambição, luxo, crime, família, lealdade, traição, ascensão e queda, inspirada nos *gêneros* de dramas de máfia e crime urbano. **Não** reproduzir personagens, nomes, diálogos, cenas, trilhas, logotipos, mapas, marcas registradas, figurinos exatos ou missões de obras existentes. A cidade, a história e a identidade visual serão originais.

---

# 1. Visão geral

## 1.1 Premissa

**Porto Vesper, 1988.** Uma metrópole costeira fictícia vive entre o glamour das avenidas à beira-mar, os clubes noturnos, o dinheiro dos cassinos e a velha ordem de famílias que controlam os portos e as instituições locais. Após o assassinato de um mediador respeitado, pequenas gangues, empresários corruptos e famílias tradicionais disputam o vazio de poder.

O jogador controla **Dante Valença**, ex-motorista e negociador ligado ao cais, que retorna à cidade e encontra a oficina da família endividada. Começa com um carro usado, alguns contatos e um pequeno negócio; pode construir uma rede de influência por **negócios, alianças, proteção territorial, combate e decisões**. A história é sobre a dificuldade de manter o poder quando dinheiro, confiança e violência cobram preços diferentes.

A experiência une quatro pilares:
1. **Cidade viva:** bairros construídos como quarteirões urbanos plausíveis, trânsito e pedestres, com lugares reconhecíveis.
2. **Drama criminal:** personagens recorrentes, conversas com escolhas, alianças, missões e consequências persistentes.
3. **Império administrável:** adquirir e reformar estabelecimentos, operar negócios fictícios, proteger influência e distribuir aliados.
4. **Ação e direção:** exploração a pé, combates de terceira pessoa, fugas de veículos, perseguições e infiltração.

## 1.2 Referências de sensações, não de conteúdo

- Filmes de ascensão criminal dos anos 1970–1990: exuberância, tensão e consequências.
- Dramas de família mafiosa: hierarquias, favores, reuniões, lealdade e traição.
- Jogos de mundo aberto: exploração, deslocamento e atividades secundárias.
- Jogos de estratégia leve: mapa territorial, negócios, renda, despesas e decisões.
- Suspense cinematográfico: ambientes internos, missões em locais fechados e diálogos relevantes.

## 1.3 Fantasia do jogador

Sair de uma oficina modesta para administrar um império que **muda visualmente a cidade**. O jogador vê placas trocarem de dono, reformas aparecerem, funcionários ocuparem prédios, guardas protegerem propriedades, carros melhorarem e NPCs reagirem à reputação.

## 1.4 Não objetivos da primeira entrega

- Não criar um mapa de dezenas de quilômetros antes de existir jogabilidade funcional.
- Não simular cada apartamento, loja ou cidadão fora do alcance de interação.
- Não criar multiplayer, servidores ou economia real.
- Não depender de APIs pagas, assets comerciais ou modelos licenciados para inicializar.
- Não usar cópias de filmes, jogos ou pessoas reais.
- Não declarar sistemas prontos apenas por existirem botões, telas vazias ou mocks.

---

# 2. Princípios de projeto

1. **Vertical slice jogável antes de expansão:** um bairro completo e divertido vale mais que dez bairros vazios.
2. **Quarteirões primeiro, edifícios depois:** a topologia urbana governa as construções, não o acaso.
3. **Três níveis de interior:** fachada, interior de vitrine e interior completo, com decisão explícita no dado.
4. **Persistência do mundo:** negócios adquiridos, missões, carros e alterações continuam após recarregar a página.
5. **Conteúdo autoral e parametrizado:** menos duplicação e mais diversidade arquitetônica controlada.
6. **Boa performance por construção:** objetos distantes não devem consumir custo de detalhe próximo.
7. **Entrega honesta:** separar funcionamento real, protótipo e conteúdo planejado.
8. **Interação física coerente:** portas, escadas, calçadas, pisos, carro e jogador devem obedecer à geometria.

---

# 3. Identidade do mundo

## 3.1 Cidade: Porto Vesper

Metrópole costeira inventada, situada em clima subtropical, com centro histórico e expansão moderna. Período: 1988, sem smartphones, com orelhões, rádios, jornais, letreiros físicos, fitas cassete e carros da época com design original. O mapa tem terra e água, orla, canais, morros baixos e zonas industriais.

### Distritos previstos

| Distrito | Personalidade visual | Uso principal | Locais marcantes |
|---|---|---|---|
| **Santa Ângela** | Casas geminadas, mercados, igrejas, vielas | Bairro inicial e comércio local | Oficina Valença, bar da esquina, conjunto residencial |
| **Baía Dourada** | Orla, hotéis, neon, palmeiras | Clubes e vida noturna | Hotel Miramar, marina, teatro |
| **Centro Vesper** | Prédios altos, bancos, galerias | Poder financeiro e contratos | Torre Cívica, banco, jornal |
| **Velho Porto** | Armazéns, guindastes, trilhos | Logística e conflito territorial | Docas, depósito frigorífico, terminal |
| **Colina Bellavista** | Mansões, jardins, muros, ruas curvas | Famílias tradicionais | Vila dos Bellori, clube privado |
| **Distrito Mercado** | Comércio denso, restaurantes, residenciais | Negócios e rede de informantes | Mercado coberto, cinema, praça |
| **Zona Calder** | Indústrias, pátios, oficinas | Veículos, fabricação e manutenção | Fundição, ferrovia, garagem |
| **Ilha Farol** | Propriedades exclusivas e ponte | Capítulo final | Palácio do Farol, heliporto |

**Meta inicial:** somente Santa Ângela e uma pequena ligação com o Velho Porto, com perímetro jogável deliberado e sem falsas promessas de bairros concluídos.

## 3.2 Mapa e escala

- Unidade padrão: **1 unidade Three.js = 1 metro**.
- Jogador: altura aproximada **1,75–1,85 m**; portas ~2,1–2,4 m; altura de pavimento geralmente 2,8–3,4 m, dependendo do imóvel.
- Ruas locais: pistas de 3–3,5 m por faixa; calçadas comuns ~1,8–3,0 m, com exceções coerentes.
- Quarteirões residenciais: tipicamente ~70 × 100 m, variando por bairro; quarteirões de centro e indústria podem ser maiores.
- Prédios baixos: 2–5 pavimentos. Médios: 6–12. Altos: 13–30, com silhueta distante simplificada.
- **Proibir** escala arbitrária entre casas, pedestres e carros. Medidas variam apenas por arquitetura e função.
- Primeira área validável sugerida: aproximadamente **500 × 500 m** contendo 12–20 quarteirões, ajustável por teste de performance; não confundir área gerada com área final certificada.
- Mundo expansível por chunks, com origens fixas e IDs estáveis. Usar origem deslocável (floating origin) **somente se necessário** após medir precisão espacial.

---

# 4. Sistema central: construir quarteirões de verdade

> **REQUISITO P0:** A cidade NÃO pode ser um conjunto aleatório de prédios isolados. A geração deve montar **sequências de construções ocupando lotes contíguos**, com orientação, recuos, esquinas, fundos e acesso coerentes. Deve haver edifícios exploráveis e outros só de fachada.

## 4.1 Pipeline urbano obrigatório

```
Seed de mundo + parâmetros do distrito
          ↓
Rede viária (ruas, avenidas, rotatórias, pontes)
          ↓
Quadras urbanas fechadas por ruas
          ↓
Calçadas, meio-fios e cruzamentos
          ↓
Parcelamento das quadras em lotes (frontage)
          ↓
Zoneamento (residencial / comercial / misto / industrial / cívico)
          ↓
Sequência de tipologias arquitetônicas por rua
          ↓
Escolha de interior por prédio (none / shell / full)
          ↓
Geometria, fachadas, portas, telhados, props e colisão
          ↓
Pontos semânticos (entradas, cobertura, garagens, NPCs)
          ↓
Navmesh, trânsito, LOD e chunks com persistência
```

### Regras essenciais

- **Primeiro rua, depois quadra, depois lote, depois casa/prédio.** Não posicionar imóveis com `Math.random()` em coordenadas soltas.
- Cada lote tem `blockId`, `lotId`, `streetId`, largura de frente, profundidade, ponto de acesso, orientação e zona.
- O lado de acesso da construção deve apontar **para a rua correta**; nenhuma entrada principal voltada para o muro de outro lote.
- Casas geminadas ficam **lado a lado** com parede compartilhada opcional e telhados contínuos, sem interpenetração.
- Lojas de rua podem ocupar toda a largura do lote com fachadas justapostas e térreo alinhado.
- Em uma esquina, o lote pode ser **de esquina**, com fachada secundária, vitrines em duas faces ou chanfro, conforme tipologia.
- O miolo da quadra comporta quintais, becos de serviço, garagens, estacionamento e pátios, respeitando acesso.
- Prédios altos têm base, acesso, afastamentos e espaço de serviços; não surgem no meio de casas baixas sem transição urbanística.
- Ruas não devem atravessar o interior de edifícios; calçadas e faixas de pedestres precisam ligar-se aos caminhos de pedestres.
- Fiação, postes, árvores e hidrantes respeitam envelopes livres de passagem, portas e veículos.
- A faixa de calçada nunca deve ficar obstruída de ponta a ponta; objetos repetidos usam espaçamento e checagem de colisão.
- Nada de terrenos vazios inexplicáveis: quando existir lote sem construção, justificar como estacionamento, obra, jardim, terreno baldio ou praça.

## 4.2 Biblioteca de sequências de fachada

Os edifícios de um trecho devem compartilhar **ritmo visual** e ao mesmo tempo variar elementos. Usar `streetSegmentStyle` + estilos por lote.

| Sequência | Exemplo de trecho | Variação obrigatória |
|---|---|---|
| Casas geminadas | casa + casa + casa + garagem + casa | Portas, venezianas, tons, jardineiras e telhados |
| Comercial de bairro | padaria + farmácia + mercado + bar + banca | Placas, marquises, vitrines, toldos |
| Centro antigo | loja térrea + escritório 3–5 andares + loja | Coroas de prédio, texturas, cornijas |
| Zona mista | loja + prédio residencial + lanchonete + prédio | Sacadas, aparelhos de ar, cortinas |
| Rua rica | mansão + jardim + casarão + guarita | Muros, cercas, portões, recuos |
| Industrial | oficina + armazém + doca + galpão | Caminhões, portões, chaminés |

**Controle de repetição:** nunca repetir a mesma combinação de modelo + cor + letreiro mais de duas vezes no mesmo trecho visível. Exceção: conjunto planejado de casas idênticas, mas variar uso e desgaste.

## 4.3 Gramática de lote e construção

Cada prédio é definido por atributos independentes, e não por um GLB gigante obrigatório:

- **Forma:** largura, profundidade, altura, recuo frontal, laterais, pátio, esquina.
- **Estrutura:** embasamento, corpo, coroamento, telhado, sacadas, escadas externas.
- **Fachada:** linguagem arquitetônica, módulo de janelas, porta, vitrine, revestimento, desgaste.
- **Decoração:** toldo, ar-condicionado, luminária, placa, grade, fios, caixas, vegetação.
- **Uso:** habitação, comércio, escritórios, garagem, hotel, bar, armazém, mansão.
- **Interação:** nenhum acesso, vitrine, portal de visita, edifício completo, missão.
- **Estado:** neutro, de facção, comprado, reformado, danificado, fechado.

**Restrições geométricas:** gerador deve validar área ocupada, orientação da face frontal, sobreposição com outro prédio e envelope livre de calçada. Caso falhe, tentar uma tipologia alternativa válida; nunca aceitar geometria atravessando outra silenciosamente.

## 4.4 Três categorias de interiores

| Categoria | Valor de dado | Onde usar | O que o jogador vê | Custo esperado |
|---|---|---|---|---|
| **Fachada apenas** | `none` | Maioria dos residenciais e escritórios | Portas, vidros, cortinas, persianas, iluminação de janela | Muito baixo |
| **Interior parcial** | `shell` | Pequenas lojas, recepções, alguns bares | Profundidade visível de 3–8 m; balcão/parede; pode ter área curta acessível **se declarado** | Baixo a médio |
| **Interior completo** | `full` | Oficina, mansão, clube, hotel de missão, delegacia, estabelecimentos-chave | Divisões, mobiliário, pisos, entradas, interações, NPCs e eventualmente vários pavimentos | Alto, carregar sob demanda |

**Regra:** `shell` visual não implica que a porta seja acessível. `isEnterable` é definido independentemente e só será verdadeiro se existir conteúdo jogável, colisão válida e rota de entrada/saída. Jamais prometer “todos os prédios entram”.

### Distribuição sugerida para um primeiro bairro

- 75–85% `none`.
- 10–20% `shell`.
- 3–7% `full`.

Essas faixas são **proporções de projeto, não números já implementados**. O mix varia por distrito; não transformar todos os imóveis importantes em completos antes de otimizar.

## 4.5 Interiores completos sem destruir performance

- Representar cada imóvel completo por **prefab independente** com estrutura, colliders, portas, pontos de luz, áudio, navmesh e pontos de spawn.
- **Exterior persistente:** casarão/loja permanece em seu lote. O interior deve encaixar no volume externo sempre que possível.
- **Entrada:** detectar intenção real de entrar, fazer pré-carregamento, abrir porta, habilitar interior; transição curta e contextual se o streaming precisar.
- **Saída:** restaurar o estado do mundo e a posição externa no mesmo imóvel, sem teletransporte incoerente.
- **Occlusion/culling:** esconder ou congelar conteúdo interno enquanto o jogador está longe; evitar luzes dinâmicas e física de móveis desnecessárias fora do recinto.
- **Multinível:** construir escadas com colisão e navegação; elevadores só se houver mecânica funcional.
- **Windows:** permitir visibilidade controlada, usando room/portal culling ou fachada falsa nos prédios fechados; evitar renderizar apartamento completo através de todo vidro da cidade.
- **Portas:** têm orientação, largura, pivô correto, estado `locked/open/closed`, ocupação e trigger.
- **Missões:** interiores de missão aceitam reinicialização dos NPCs e objetos específicos sem apagar o estado global do negócio.

## 4.6 Exemplos de edifícios totalmente exploráveis

1. **Oficina Valença:** escritório, área de manutenção, estoque, pátio e apartamento simples.
2. **Bar Atlântico:** salão, cozinha, banheiro, estoque e sala reservada.
3. **Casa Bellori:** sala, escritório, cozinha, quartos, biblioteca, garagem e jardim.
4. **Clube Aurora:** recepção, pista, camarotes, gerência, palco, depósito e saída de serviço.
5. **Armazém 17:** doca, escritório superior, corredores, elevador de cargas cenográfico e mezanino.
6. **Hotel Miramar:** saguão, cozinha, escritório, corredor principal e suíte de missão; andares restantes podem ser fachada e portas fechadas.
7. **Banco Vesper:** hall, atendimento, escritório, área controlada e sala de arquivos.
8. **Casa do jogador:** ampliável com vagas, guarda-roupa, sala de troféus e escritório administrativo.

Nem todas devem estar no primeiro marco. **Prioridade de implementação:** oficina, bar e armazém, nessa ordem.

## 4.7 Exemplo detalhado: um quarteirão válido

```
                 RUA DAS PALMEIRAS
 ┌──────────────────────────────────────────┐
 │ [H01][H02][H03][GAR][H04][LOJ][LOJ]     │
 │                                          │
 │     quintais / viela / áreas de serviço  │
 │                                          │
 │ [APT 3A] [APT 3B] [BAR FULL] [MERC]     │
 └──────────────────────────────────────────┘
                 AVENIDA DO MERCADO
```

- H01 a H04: residências contíguas, `none`, variação de telhado, tinta e grades.
- GAR: garagem funcional apenas se tiver evento de uso; caso contrário, fachada e collider.
- LOJ: uma loja `shell` com vitrine; outra `none`.
- APT: prédio de 3 pavimentos, `none`, com embasamento comercial opcional.
- BAR FULL: porta funcional, salão e estoque navegável, com missão.
- MERC: comércio `shell`.
- O quarteirão contém esquina tratada e entradas voltadas a seus respectivos passeios.
- **É inaceitável** uma porta do bar abrir para trás da quadra, a casa ocupar a pista ou um NPC nascer dentro do muro.

## 4.8 Modo de edição do mundo (ferramenta interna)

Painel de debug de desenvolvimento (não precisa aparecer para o jogador) para:
- exibir IDs de ruas, quadras, lotes e chunks;
- inspecionar tipo de interior e entrada por prédio;
- alterar seed, salvar preset e reproduzir exatamente o mapa;
- marcar lotes reservados a missões e landmarks;
- checar lacunas e sobreposição de lotes;
- pintar zonas e re-gerar **somente** a quadra selecionada;
- medir FPS, draw calls, triângulos, memória e tempo de carga;
- exportar `world-manifest.json` com seed, transform e IDs.

---

# 5. Projeto técnico do gerador urbano

## 5.1 Modelo de dados de referência (TypeScript)

```ts
type InteriorTier = 'none' | 'shell' | 'full';
type BuildingUse = 'residential' | 'retail' | 'office' | 'industrial'
                 | 'entertainment' | 'civic' | 'mansion' | 'garage';

type DistrictId = string;
type StreetId = string;
type BlockId = string;
type LotId = string;

type Vec2 = { x: number; z: number };
type Vec3 = { x: number; y: number; z: number };

interface StreetSegment {
  id: StreetId;
  from: Vec2;
  to: Vec2;
  roadWidth: number;
  sidewalkWidthLeft: number;
  sidewalkWidthRight: number;
  lanes: number;
  districtId: DistrictId;
  styleId: string;
}

interface CityBlock {
  id: BlockId;
  districtId: DistrictId;
  polygon: Vec2[];
  zoning: BuildingUse[];
  lotIds: LotId[];
  serviceAlleyIds: string[];
  chunkId: string;
}

interface Lot {
  id: LotId;
  blockId: BlockId;
  streetId: StreetId;
  frontageMeters: number;
  depthMeters: number;
  polygon: Vec2[];
  entranceWorld: Vec3;
  frontageNormal: Vec2;
  corner: boolean;
  setbackFrontMeters: number;
  archetypeId: string;
  buildingId: string;
}

interface BuildingDefinition {
  id: string;
  lotId: LotId;
  use: BuildingUse;
  facadeStyleId: string;
  floorCount: number;
  heightMeters: number;
  exteriorPrefabId: string;
  interiorTier: InteriorTier;
  interiorPrefabId?: string;
  isEnterable: boolean;
  doorIds: string[];
  businessId?: string;
  factionId?: string;
  missionIds: string[];
  visualState: 'normal' | 'renovated' | 'damaged' | 'abandoned';
}

interface WorldSeedDefinition {
  schemaVersion: number;
  seed: number;
  generatorVersion: string;
  districtPresets: Record<DistrictId, unknown>;
  reservedLandmarkLots: Record<string, LotId>;
}
```

**Invariantes a validar automaticamente:** `isEnterable => interiorTier !== 'none' && interiorPrefabId válido`; toda porta acessível deve conectar calçada/interior navegáveis; `lotId` único; `streetId` existente; prédio contido no lote com tolerância definida; nenhum `buildingId` duplicado; seed idêntica => topologia idêntica.

## 5.2 Determinismo

- Usar PRNG com seed e namespace, por exemplo `hash(worldSeed, districtId, blockId, lotId, 'facade')`.
- **Não** depender da ordem assíncrona de carregamento para consumir números aleatórios; cada lote gera suas próprias variações estáveis.
- Versão do gerador deve entrar no save. Alterações de algoritmo exigem migração ou preservação de world manifest.
- Landmarks, interiores de campanha e caminhos críticos devem ser **reservados manualmente** e não podem desaparecer com outra seed.
- IDs persistentes devem ser baseados em distrito/quadra/lote, não em índices temporários de arrays no runtime.

## 5.3 Criação da malha viária

1. Para vertical slice, preferir **grafo viário autoral configurável** (ruas definidas em dados), com ajustes procedurais controlados.
2. Construir as quadras a partir dos limites de ruas; garantir polígonos fechados sem autointerseção.
3. Gerar calçadas e cruzamentos alinhados às faixas; permitir curvas apenas onde geometria e navegação foram validadas.
4. Subdividir bordas de quadra em frentes de lote de largura coerente com a tipologia (casas estreitas, armazéns largos etc.).
5. Evitar lotes triangulares minúsculos: transformar áreas residuais em jardins, estacionamento, praça ou anexos.
6. Reserve lotes fixos por identificador para locais importantes, e só então distribua o restante.
7. Gerar grafos de pedestres e carros **do mesmo desenho de rua** para evitar caminhos desencontrados.

## 5.4 Parcelamento por frontage

Pseudoalgoritmo (conceitual):

```text
para cada quadra:
  extrair faces voltadas a ruas
  reservar lotes de marco (bar, oficina, missão, praça)
  para cada face restante:
    obter perfil de zoneamento e padrão de fachadas
    calcular larguras desejáveis dentro dos limites
    ajustar larguras para ocupar a extensão inteira
    criar lotes lado a lado, preservando acesso e profundidade
    verificar polígonos e envelope contra vizinhos
    em caso de sobra, inserir acesso de serviço ou lote coerente
  conectar fundos, vielas e acessos
  validar topologia, colisão e iluminação básica
  gerar exterior e interior conforme dados
```

**Proibição:** criar 200 prédios aleatórios por loop e chamá-los de cidade. Sem lotes, sequências urbanas e conectividade, o requisito não foi atendido.

## 5.5 Colisões

- Colisão simplificada por **volumes dedicados**, independentes de malha visual sempre que possível.
- Asfalto/calçada, paredes e fachadas sólidas com colliders corretos; portas entram em estado de passagem somente quando abertas.
- Pedestres não podem atravessar fachadas; carro não pode cortar calçada alta como se fosse plana.
- Teste de spawn: não colocar NPC ou carro dentro de outro objeto ou embaixo do solo.
- Na primeira entrega, usar física leve de cápsula para personagem e colisão simplificada de carros; só integrar motor físico completo se a necessidade for comprovada.

## 5.6 Streaming e LOD

Sugestão inicial a calibrar por hardware real:

| Faixa | Distância aproximada | Carregamento |
|---|---:|---|
| Próxima | 0–80 m | Mesh detalhada, colisão, NPCs e interações |
| Média | 80–220 m | LOD moderado, colisão essencial, IA simplificada |
| Longe | 220–500 m | LOD simples, edifícios agregados/instanciados, sem decoração cara |
| Horizonte | 500 m+ | Silhuetas, impostors ou céu urbano; sem física individual |

**Números configuráveis, não compromissos universais.** Frustum culling, distância e visibilidade por quarteirão devem cooperar. Não transformar todos os edifícios automaticamente em imagens WebP gigantes: usar impostors/sprites apenas onde a perspectiva permite sem distorção evidente. Mudança de LOD deve evitar pop visual (histerese, dither/fade onde possível) e preservar a silhueta e escala do objeto.

- `THREE.InstancedMesh` para postes, janelas repetitivas, árvores iguais e props homogêneos.
- `THREE.BatchedMesh` ou geometria mesclada por chunk para edifícios com geometrias compatíveis e custo de chamada elevado.
- `THREE.LOD` ou sistema próprio por chunk para trocar níveis de detalhe.
- Materiais e texturas compartilhados; atlases e modelos GLB comprimidos quando adequado.
- Occlusion/portal culling para interiores; desligar atualizações de NPCs distantes.
- Não fazer merges que impossibilitem clicar em prédio, atualizar sua fachada, abrir a porta ou apagar um chunk individual: manter tabela de IDs e representação interativa separada.
- Processar carregamento em lotes e evitar compilação explosiva de shaders num único frame.

Documentação de referência:
- https://threejs.org/manual/en/optimize-lots-of-objects.html
- https://threejs.org/docs/#api/en/objects/InstancedMesh
- https://threejs.org/docs/pages/BatchedMesh.html
- https://threejs.org/docs/pages/LOD.html
- https://threejs.org/docs/pages/WebGLRenderer.html

---

# 6. Jogador, câmera e movimento

## 6.1 Personagem jogável

**Dante Valença:** protagonista original, visual casual no começo, trajes mais sofisticados ao evoluir. Personalização permitida em roupas e acessórios, mas a história mantém um personagem consistente.

**Animações necessárias:** idle, walk, jog, sprint, strafe, turn-in-place, subir/baixar escadas, entrar/sair do carro, abrir porta, interagir, cobertura, mira, disparo, recarga, golpe desarmado, reação a dano, queda, levantar e conversação.

**Regras:** pés no chão, raízes de animação consistentes, cápsula e mesh no mesmo referencial, sem deslize excessivo, sem inversão lateral e sem cortar portas.

## 6.2 Câmera

- Terceira pessoa com braço dinâmico e deslocamento lateral durante a mira.
- Movimento suave, com colisão para não atravessar paredes; campo de visão adaptativo em carro.
- Interiores estreitos usam distância menor e transparência controlada se a câmera encostar na parede.
- Modos: a pé, mira, veículo, diálogo, cutscene, editor debug.
- Alternância de ombro opcional em combate.

## 6.3 Controles para PC

| Ação | Teclas padrão |
|---|---|
| Andar | WASD |
| Câmera / mira | Mouse |
| Correr | Shift |
| Pular / superar obstáculo baixo | Espaço |
| Interagir / entrar em carro | E |
| Mira | Botão direito |
| Atacar / disparar | Botão esquerdo |
| Recarregar | R |
| Cobertura | Q |
| Agachar | Ctrl |
| Inventário / equipamento | Tab |
| Mapa | M |
| Menu de império | I |
| Pausar | Esc |

Oferecer remapeamento e suporte a controles Xbox/PlayStation via Gamepad API como melhoria prevista, sem anunciar compatibilidade se não for testada.

---

# 7. Combate, inteligência artificial e consequências

## 7.1 Combate

**Estilo:** ação de terceira pessoa com cobertura leve. Armas e ações ficcionais, tratadas como mecânicas de jogo, sem guias de práticas ilícitas reais. Combate corpo a corpo, cobertura, movimentação, mira e recuperação limitada.

- Tipos de equipamento: revólver, pistola, espingarda, submetralhadora fictícia; nomes originais e balanceamento próprio.
- Sensação: recuo, flash de disparo, áudio, impacto em superfície, estados de dano e feedback visual legível.
- Cobertura em muros, carros e balcões selecionados; não em toda colisão do mapa automaticamente.
- Civis evitam confronto, fogem ou procuram abrigo.
- Munição, saúde e consumíveis com interface clara.
- **Sem glorificar violência gráfica extrema:** foco nas consequências políticas/narrativas.

## 7.2 Estados da IA

```
Idle/Patrol → Investigate → Suspicious → Alert → Combat
      ↘       Talk         ↙          ↘ Flee
      → ReturnToRoutine              → Surrender/Retreat
```

Cada NPC tem facção, papel, rotina, nível de alerta, área permitida, ponto de interesse e memória local curta. Guardas protegem propriedades; policiais seguem sistema próprio; civis têm reações coerentes. Rotinas distantes simuladas por estados e horários, não por centenas de pathfinders ativos.

## 7.3 Facções e reputação

- **Família Bellori:** tradição e influência política.
- **Consórcio Maré Negra:** força financeira e contratos agressivos.
- **Irmãos Calder:** controlam oficinas, transporte e carga.
- **Círculo Aurora:** noite, entretenimento e informações.
- **Guarda Municipal de Vesper:** força pública com resposta dinâmica a crimes.

Variáveis por facção: `trust`, `fear`, `respect`, `hostility`, `territoryControl`. Alterações ocorrem por missões, favores, negócios, quebras de acordo e eventos narrativos. Não usar um único medidor genérico para todas as relações.

## 7.4 Pressão policial (Heat)

Níveis 0–5, escalonados ficcionalmente:
- 0: nenhum alerta.
- 1: atenção local; patrulhas observam.
- 2: tentativa de abordagem e perseguição próxima.
- 3: reforço localizado e fechamento de rotas pontuais.
- 4: operações coordenadas na região.
- 5: cidade em estado de alerta excepcional, com risco sério para operações e aliados.

Heat diminui por mecanismos de gameplay seguros e abstratos, tempo, eventos roteirizados e consequências. Sistema não descreve métodos reais para burlar a polícia. O nível deve persistir com regras claras e não sumir imediatamente ao entrar em veículo ou interior.

---

# 8. Veículos e trânsito

## 8.1 Veículos originais

Carros populares, sedãs antigos, cupês esportivos, táxis, vans e caminhões leves com silhuetas próprias da época; não utilizar logos de fabricantes reais.

- Direção arcade com peso: aceleração, frenagem, aderência, câmera de perseguição, colisão simples e danos visuais limitados.
- Entrar/sair de carro a partir da porta correta, com animação e fallback seguro para espaços estreitos.
- Garagens e estacionamento ligados a lotes.
- Veículos possuídos salvos com `vehicleId`, estado, cor, upgrade, posição válida ou garagem de referência.
- Direção de NPCs sobre grafo viário: faixa, interseção, semáforo/placa de parada, velocidade por distrito e desvio básico.
- Pedestres com zonas de travessia e calçadas conectadas; sem spawns instantâneos na frente do carro.
- Não carregar IA ativa de tráfego para toda a cidade: usar densidade de região, pool e distância.

## 8.2 Upgrades

Motor, freios, suspensão, lataria e pintura por gameplay; desempenho e custos balanceados. Garage menu mostra diferença antes/depois, custo e mudança persistente. Nenhuma melhoria inexistente na física pode ser vendida como funcionando.

---

# 9. Economia, negócios e império

## 9.1 Loop econômico

```
Explorar / conversar / cumprir contrato
               ↓
Ganhar recursos e influência
               ↓
Investir em propriedade e equipe
               ↓
Abrir, reformar ou expandir negócio
               ↓
Gerar renda periódica + eventos + despesas
               ↓
Defender reputação e tomar decisões de campanha
               ↓
Abrir acesso a novos bairros e linhas narrativas
```

## 9.2 Negócios fictícios administráveis

Bar, oficina, restaurante, boate, hotel, lavanderia, empresa de transporte, imobiliária, estacionamento, mercado e armazém. Parte dos negócios pode ter **atividade ilícita abstrata** na narrativa, mas os sistemas devem ser ficcionais e gamificados, sem instruções operacionais reais.

Cada propriedade registra:
- aquisição por missão, compra ou negociação;
- estado de reforma, aparência e melhorias físicas;
- funcionários contratados, lealdade e custos;
- receita/intervalo, manutenção, eventos e riscos;
- função estratégica (renda, informações, garagem, loja, ponto de encontro);
- relação com facções e reputação;
- nível de acesso ao interior (fixo ou aprimorado apenas com prefab disponível).

## 9.3 Gestão no menu

**Mapa de influência** com distritos coloridos de forma discreta, não excessivamente saturada. Filtros: propriedades, missões, contatos, facções, garagens, interiores acessíveis. Tela de negócio exibe **receita, despesa, lucro líquido, funcionários, reputação, melhorias e evento em andamento**. Nada de renda gerada a cada frame; usar um relógio de jogo consistente.

### Fórmula de referência (balancear)

```
liquidoPorCiclo = receitaBase * multiplicadorUpgrade * fatorReputacao
                  - despesasFixas - folhaPagamento - custoEvento
```

Limitar crescimento, incluir teto de capacidade e impedir exploit de carregar o save repetidamente para duplicar receita.

## 9.4 Consequências visuais da evolução

- Fachada recebe pintura nova, letreiro e iluminação.
- Interior recebe móveis e melhorias **somente quando existe interior**.
- Funcionários passam a aparecer em horários adequados.
- Segurança e veículos surgem em slots reservados.
- NPCs comentam mudança de proprietário/aliança por diálogos autorais.
- Proprietário e facção no mapa e no manifest persistem após reload.

---

# 10. Narrativa completa — cinco atos

**Tema:** que tipo de império é possível construir sem virar prisioneiro dele?  
**Tom:** ambição, humor ácido pontual, luxo decadente, relações familiares, escolhas difíceis e finais com peso emocional.

## Personagens principais

| Personagem | Função dramática | Conflito |
|---|---|---|
| **Dante Valença** | Protagonista | Poder versus lealdade |
| **Helena Valença** | Irmã, administra contas da oficina | Quer estabilidade e rejeita riscos do império |
| **Rafael Montoro** | Amigo de infância, conhece as ruas | Lealdade ameaçada pela ambição |
| **Vittorio Bellori** | Patriarca tradicional | A ordem antiga está enfraquecendo |
| **Bianca Bellori** | Estrategista da família | Pode ser aliada ou rival política |
| **César Calder** | Líder dos transportadores | Valorização de contratos e força |
| **Lia Navarro** | Dona do clube Aurora | Informações valem mais que tiros |
| **Elias Ferraz** | Empresário público/privado ambíguo | Procura controlar a cidade por dentro |
| **Mauro Seixas** | Jornalista investigativo | Confronta o custo humano da disputa |

Todos são personagens originais. Não copiar aparência, voz ou falas de atores/personagens de filmes.

## Ato I — Terra de ninguém (missões 1–6)

1. **Volta ao cais:** tutorial de movimentação, diálogo e direção; recuperar o carro na oficina.
2. **Portas abertas:** conhecer o Bar Atlântico; percorrer rua comercial e entrar no primeiro interior completo.
3. **A conta vence:** cumprir serviço legítimo de transporte, aprender economia básica.
4. **Vizinhos atentos:** defender uma loja de intimidação em confronto limitado; introduzir IA e consequências.
5. **A proposta:** reunião com um intermediário da família Bellori; escolha de abordagem diplomática ou agressiva.
6. **Noite no armazém:** infiltração e fuga no Armazém 17; revelar que há um conflito maior.

**Resultado do ato:** oficina estabilizada, bar acessível, um aliado confiável e Velho Porto desbloqueado parcialmente.

## Ato II — Primeiro milhão (missões 7–12)

7. **A vitrine:** adquirir ou administrar primeiro estabelecimento comercial.
8. **Luzes da Baía:** conhecer Lia e participar de uma missão noturna no clube.
9. **Dívida de sangue:** proteger parceiro em conflito narrativo com decisão de diálogo.
10. **Dois lados da ponte:** perseguição de carro e disputa de acesso ao distrito.
11. **Livro-caixa:** detectar desvio de recursos por alguém próximo.
12. **Mesa reservada:** reunião de facções; decisão afeta confiança e renda.

## Ato III — A cidade cobra (missões 13–18)

13. **Chuva sobre Vesper:** missão noturna em chuva estilizada, com investigação e tensão.
14. **Reforma ou ruína:** reabrir um negócio e escolher uma prioridade de investimento.
15. **Um nome no jornal:** descoberta pública modifica heat e reputação.
16. **A casa na colina:** missão com exploração de mansão e conversa com Bianca.
17. **Linha de produção:** defender rota comercial abstrata e sobreviver ao ataque.
18. **O homem que sabia:** traição importante decidida por relacionamento acumulado.

## Ato IV — Reis por uma noite (missões 19–24)

19. **Conselho de cinco:** negociar pacto, com pré-requisitos de influência.
20. **Ferro e vidro:** operação na torre do centro financeiro.
21. **A última festa:** clube Aurora vira espaço narrativo de confronto.
22. **O preço do sobrenome:** consequências sobre Helena e Rafael.
23. **A cidade dividida:** evento de facções na malha territorial.
24. **A ponte fechada:** missão de direção com ramificações por aliados disponíveis.

## Ato V — O trono vazio (missões 25–30)

25. **Nada é de graça:** retorno aos primeiros negócios; fechamento de arcos secundários.
26. **Três assinaturas:** decisão irreversível sobre alianças.
27. **No alto de Bellavista:** reunião final com Bellori e Bianca.
28. **A verdade no porto:** confrontar quem iniciou a crise.
29. **Porto em silêncio:** preparar o desenlace com recursos acumulados.
30. **Reis de Porto Vesper:** final com variantes e epílogos que reflitam relações, propriedades e escolhas.

**Importante:** missões 7–30 são **conteúdo de produção futura**, não parte do primeiro protótipo. Cada missão só é marcada como implementada após começo, meio, fim, falha, checkpoint e teste real.

## Finais

- **O Patriarca:** vence por alianças e respeitabilidade, aceitando compromissos pessoais.
- **O Magnata:** controla bens e contratos, com isolamento crescente.
- **O Exilado:** abandona parte do império para preservar relações.
- **A Cidade em Chamas:** perde apoio; império fragmenta-se.

Finais dependem de decisões, `trust`, `hostility`, propriedades e indicadores econômicos; não apenas da última escolha.

---

# 11. Conteúdo secundário e fator replay

- Contratos de direção (entregas de gameplay fictício), com rota e tempo.
- Proteção de estabelecimentos em eventos roteirizados.
- Investigações curtas com coleta de pistas e diálogos.
- Corridas clandestinas inteiramente ficcionais, com percurso e regras de jogo.
- Renovação de fachadas, garagens e carros.
- Busca de fitas de rádio, cartazes, colecionáveis e jornais sobre a história da cidade.
- Eventos de negócios e rumores de facções que dependem de horário.
- Investimento em imóveis para desbloquear melhorias, serviços e modificadores.
- Casas seguras e guarda-roupas desbloqueáveis.
- Desafios de condução com pontuação e ranking **local**.
- Nova campanha+ futura: manter alguns elementos cosméticos sem destruir o balanceamento.

### Segredos ambientais

Entrada de serviço de hotel, passarela entre edifícios, arquivo fechado por missão, escritório escondido atrás de livraria, porão de casarão e depósito antigo. Segredos devem ser construídos como lugares reais do mapa e acessíveis por interação legítima, não portas falsas ou triggers sem contexto.

---

# 12. Direção de arte

## 12.1 Estilo

**Realismo estilizado de final dos anos 1980**, com texturas expressivas, silhuetas boas, modelos low/mid poly otimizados e interiores selecionados com maior detalhe. Não visual excessivamente cartoon; não perseguir fotorrealismo que inviabilize o navegador.

- Paleta urbana: concreto, bege, terracota, madeira escura, creme, aço e tons de madrugada.
- Baía: neon magenta/ciano pontual, fachadas pastéis, mar, palmeiras, luz quente.
- Máfia antiga: marrom escuro, bronze, mármore, luz âmbar, verde profundo.
- Industrial: ferrugem, aço, asfalto úmido, iluminação prática.
- Noite com luzes de lojas, veículos e letreiros, sem exagero de bloom.

## 12.2 Asset modular por prioridade

**Kit A — P0, bairro inicial:** módulos de parede/porta/janela, telhados, 6 fachadas residenciais, 6 de lojas, 2 de apartamentos, calçadas, cruzamentos, postes, árvores, carro, jogador, 4 NPCs, móveis essenciais do bar e da oficina.

**Kit B — P1:** armazém, posto, prédios comerciais, ônibus/táxi, clube Aurora, mobiliário adicional, grades, interiores e cercas.

**Kit C — P2/P3:** mansões, arranha-céus, marinas, hotéis, jardins complexos, ponte, ilha, interiores narrativos e variação da frota.

Criar catálogo de assets com `id`, arquivo, dimensões em metros, origem, material, uso, LODs, colisão, licença e preview; corrigir escala e pivô na importação.

## 12.3 Cenas cinematográficas

Câmera com composição dirigida, animações faciais simples, pausas e diálogos com legendas. Preferir cenas in-engine. Escolhas só afetam o jogo quando ligadas a variáveis reais. Cutscenes precisam de opção **pular** e de retorno consistente ao controle.

---

# 13. Áudio e rádio

- Trilha original ou devidamente licenciada: grooves instrumentais de época, jazz tenso, synth e rock retrô.
- Rádios fictícias: **Vesper FM**, **Onda Maré**, **Noite 88**, com vinhetas autorais.
- Áudio 3D moderado: motores, passos por superfície, bares, chuva, mar, ruas.
- Músicas em streaming/carregamento sob demanda, volume separado de efeitos e voz.
- Respeitar bloqueios de autoplay de navegadores: áudio inicia apenas após gesto do usuário.
- Nunca extrair trilha de filmes ou jogos existentes sem licença.

---

# 14. Interface, menus e acessibilidade

## Menu principal

Continuar, Novo Jogo, Carregar Jogo, Opções, Créditos, Sair/voltar. Fundo in-engine curto com a cidade, sem carregar o mapa inteiro antes de mostrar menu.

## HUD

- Saúde e item equipado discretos.
- Minimapa com setas, objetivo, fronteiras claras de distrito.
- Dinheiro + influência quando relevante, não na tela toda hora.
- Heat com indicação de intensidade e último evento.
- Prompt de interação com nome do local e tecla.
- Objetivo da missão com distância e etapa, sem poluição visual.

## Pausa e opções

Pausa **real**: interrompe simulação/IA/relógio do jogo offline e mantém UI. Opções de resolução/render scale, qualidade de sombra, distância de objetos, pós-processamento, áudio, sensibilidade, inversão de eixos, legenda e controles.

## Acessibilidade

Legendagem, escala do texto, remapeamento de teclas, tolerância de mira, opção de reduzir tremor de câmera, indicadores que não dependem apenas de cor, volume separado e modo de contraste maior. Evitar flashes rápidos obrigatórios.

---

# 15. Arquitetura Three.js

## 15.1 Stack recomendada

- Vite + TypeScript (preferencial) ou JavaScript ES modules.
- Three.js pela dependência do projeto, com versão travada em lockfile.
- GLTFLoader para assets GLB, DRACOLoader/MeshoptDecoder **apenas se os assets realmente usarem compressão correspondente**.
- UI em HTML/CSS para menus e HUD, Three.js para renderização 3D.
- Armazenamento de saves: IndexedDB preferencial, com fallback ou exportação JSON; localStorage reservado a configurações leves.
- Testes: Vitest ou Node para gerador/dados; Playwright para fluxos de navegador; smoke test WebGL manual ou automatizado conforme ambiente.
- Evitar CDN transitória no GitHub Pages para código crítico; build reprodutível e asset paths relativos.

## 15.2 Organização sugerida

```text
imperio-porto-vesper/
├── README.md
├── LICENSE
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   ├── assets/
│   │   ├── characters/
│   │   ├── vehicles/
│   │   ├── architecture/
│   │   ├── props/
│   │   ├── textures/
│   │   └── audio/
│   └── data/
│       ├── missions/
│       ├── dialogue/
│       ├── districts/
│       └── balance/
├── src/
│   ├── main.ts
│   ├── app/Game.ts
│   ├── core/ (clock, event-bus, state, config)
│   ├── renderer/ (scene, camera, lighting, lod, profiler)
│   ├── world/
│   │   ├── road/RoadGraph.ts
│   │   ├── blocks/BlockBuilder.ts
│   │   ├── lots/LotSubdivider.ts
│   │   ├── buildings/BuildingFactory.ts
│   │   ├── buildings/FacadeGrammar.ts
│   │   ├── interiors/InteriorManager.ts
│   │   ├── interiors/RoomPortal.ts
│   │   ├── streaming/ChunkManager.ts
│   │   ├── navigation/NavigationGraph.ts
│   │   └── validation/WorldValidator.ts
│   ├── player/ (controller, animations, interactions)
│   ├── vehicles/ (controller, traffic, garage)
│   ├── npcs/ (ai, schedules, factions, spawning)
│   ├── combat/ (weapons, damage, cover)
│   ├── missions/ (definitions, objectives, checkpoints)
│   ├── economy/ (businesses, income, upgrades)
│   ├── save/ (SaveService, migrations)
│   ├── audio/ (mixer, stations)
│   ├── ui/ (hud, map, menus, dialogue)
│   └── debug/ (overlay, city-inspector)
├── tests/
│   ├── city-generation.test.ts
│   ├── world-collision.test.ts
│   ├── save-roundtrip.test.ts
│   ├── mission-progression.test.ts
│   └── game-smoke.spec.ts
└── docs/
    ├── GDD.md
    ├── AUDITORIA.md
    ├── ROADMAP.md
    ├── ASSET_MANIFEST.md
    └── QA_EVIDENCIAS.md
```

**Separar sistemas por responsabilidade;** evitar `main.js` com milhares de linhas ou arquivos de missão que constroem geometria por conta própria. Gerador, renderização e persistência não devem compartilhar estado global mutável indiscriminadamente.

## 15.3 Contratos de sistemas

- `WorldManager`: consulta edifício por ID, mundo por chunk, topologia, pontos de interesse.
- `InteractionSystem`: consulta raio/direção/alcance e resolve prioridade de objeto mais próximo **visível**, sem selecionar através de paredes.
- `InteriorManager`: `preload`, `enter`, `leave`, `dispose`, `restore` e eventos.
- `MissionManager`: `start`, `advance`, `fail`, `retry`, `complete` com estados serializáveis.
- `BusinessManager`: `acquire`, `upgrade`, `tickEconomy`, `getLedger` e eventos visuais.
- `SaveService`: versão, escrita atômica/validada, carregamento, migração, backup/exportação.
- `PerfProfiler`: FPS, frame time, draw calls, triângulos, memória reportada e contagem de ativos.

## 15.4 Fluxo de atualização

```
requestAnimationFrame
  ├─ obter delta real e limitar delta anômalo
  ├─ input / UI
  ├─ fixed-step lógica, física simples e missões
  ├─ timers de economia e eventos
  ├─ streaming / LOD por orçamento
  ├─ animações e câmera
  └─ renderização + coleta amostral de métricas
```

Separar passo de simulação do frame visual. Ao pausar, não acumular backlog enorme de delta. Ao trocar de aba, suspender efeitos caros e restaurar com tempo consistente.

---

# 16. Saves, progresso e compatibilidade

Estrutura de save versionada:

```json
{
  "schemaVersion": 1,
  "saveId": "slot-1",
  "gameVersion": "0.1.0",
  "world": { "seed": 8821, "generatorVersion": "1.0.0" },
  "player": { "position": [10, 0, 20], "health": 100, "money": 500 },
  "mission": { "id": "m01", "step": "reach_workshop", "status": "active" },
  "properties": {},
  "vehicles": {},
  "factions": {},
  "worldOverrides": {},
  "clock": { "day": 1, "minutes": 480 }
}
```

Valores meramente ilustrativos, não um save real. Persistir apenas o estado necessário, sem serializar a cena Three.js ou meshes. Use write-then-validate e mantenha ao menos um backup recuperável. Tratar save ausente/corrompido sem apagar todos os slots. Checkpoint antes de missões críticas, gravação manual segura e autosave em marcos claros.

**Regra crucial:** seed e gerador determinísticos não bastam quando o mundo é alterado. Toda compra, reforma, troca de facção, porta destravada ou evento global deve usar `worldOverrides` estáveis por ID.

---

# 17. Performance e orçamento técnico

## 17.1 Alvos iniciais (metas, não resultados)

| Perfil | Resolução interna | FPS-alvo | Condição |
|---|---|---|---|
| Desktop médio | 1080p ajustável | 60 | Primeira área e qualidade média |
| Desktop modesto | 720p ajustável | 30 | Modo baixo e LOD reduzido |
| Notebook integrado | 720p adaptativo | 30 desejável | Reduzir sombras, densidade e efeitos |

**Não reivindicar** suporte amplo de hardware sem benchmarks com máquina, navegador, versão, seed, cena, tempo de medição e configurações registrados.

## 17.2 Orçamento configurável

- Limites separados de NPCs ativos, carros ativos, áudio espacial, luzes dinâmicas e draw calls por faixa de hardware.
- Canvas com DPR limitado por perfil e render scale ajustável.
- Luz principal + ambient/hemisphere; poucas sombras dinâmicas perto do personagem.
- Texturas com dimensões coerentes; compartilhar materiais, mipmaps e repetir atlases.
- Pool de veículos, NPCs e efeitos transitórios.
- Dispose de geometrias/texturas **somente** quando sem referência por outros chunks.
- Evitar colisão por malha triangular para todos os prédios se AABB/OBB e hull simples resolvem.
- Evitar `raycast` contra todos os objetos do mundo a cada frame; indexação espacial e layers.
- Interiores distantes desligados e descarregados de forma reprodutível.
- Não colocar 10 mil objetos individuais com atualização JS por frame só para gerar movimento de janela.

## 17.3 Ferramentas e medições

Tela de benchmark in-game com **rota reproduzível**: caminhada na Rua das Palmeiras, corrida pela Avenida do Mercado, entrada/saída do Bar Atlântico e direção ao Armazém 17. Medir média, P1/1% low aproximado por tempos de frame, picos de carregamento, draw calls e contagem de entidades. Salvar resultado local exportável JSON, com hardware reportado apenas por dados que o navegador permita, sem fingir informações não expostas.

---

# 18. Plano de desenvolvimento executável

## Fase 0 — Fundação técnica

**Entrega:** projeto abre com Vite, Three.js, cena, input, movimento, câmera, UI inicial, debug e build para GitHub Pages.

**Checklist:**
- [ ] `npm install`, `npm run dev`, `npm run build` sem erros.
- [ ] Paths relativos compatíveis com repositório GitHub Pages.
- [ ] Cena carrega sem console errors.
- [ ] Jogador move e câmera segue corretamente.
- [ ] Tela de debug exibe FPS e coordenadas.
- [ ] Testes básicos em pipeline local.

## Fase 1 — Vertical slice de cidade (P0 principal)

**Entrega jogável:** trecho de Santa Ângela com ruas conectadas, **4 quarteirões coerentes no mínimo**, 20–40 imóveis visualmente variados, calçadas e esquinas, oficina e bar completo, alguns `shell`, demais `none`. Esses números são critérios de escopo para o slice, não promessa de mapa final.

**Critérios de aceitação:**
- [ ] Caminhar por cada face dos quatro quarteirões sem buracos e interpenetrações visíveis.
- [ ] Inspecionar debug para ver `blockId`, `lotId`, `interiorTier` por edifício.
- [ ] Casas e comércios formam sequências; esquinas têm solução arquitetônica.
- [ ] Pelo menos 2 interiores `full` realmente navegáveis e com saída correta.
- [ ] Pelo menos 2 vitrines `shell` visivelmente diferentes e 1 edifício `none` reconhecível.
- [ ] Porta aberta não atravessa parede; câmera não entra na parede.
- [ ] Recarregar a seed reproduz mesmo quarteirão e mesma lotação.
- [ ] Teste automático falha em interpenetrações proibidas e entrada sem destino.
- [ ] Pelo menos uma rota de pedestre e uma de carro conectam dois cruzamentos.

## Fase 2 — Loop de campanha inicial

**Entrega:** jogador, NPCs básicos, bar e oficina, carros, combate de protótipo, diálogos e missões **1–3** completas; menu e saves.

- [ ] Cada missão tem start, objetivo, checkpoint, falha, retry e conclusão.
- [ ] NPCs essenciais e portas persistem após entrada/saída.
- [ ] Dirigir, sair do carro e retomar navegação a pé sem preso na geometria.
- [ ] Interagir seleciona alvo correto e não atravessa paredes.
- [ ] Save/load preserva missão, posição válida e estado de mundo.

## Fase 3 — Império e primeiro arco

**Entrega:** missões **4–6**, primeira propriedade comprável ou conquistável, renda por ciclo, upgrade visual, facções básicas, heat e Velho Porto parcial.

- [ ] Renda líquida calculada por ciclos, com despesas e sem duplicação por reload.
- [ ] A fachada responde a pelo menos 1 melhoria persistente.
- [ ] Evento de facção muda reação de NPC identificado.
- [ ] Heat aumenta e diminui sob regras visíveis e testadas.
- [ ] Concluir ato desbloqueia área/propriedade conforme design.

## Fase 4 — Expansão e polimento

Ampliar distritos gradualmente, missões 7–30, veículos e interiores, áudio autoral, cutscenes e finais. Só iniciar expansão depois de certificar o ciclo do bairro inicial.

**Prioridade de desenvolvimento:** `P0 gerador → P0 controles/colisão/interiores → P0 salvar → P1 missões/IA → P1 economia → P2 expansão e arte`. Corrigir regressões antes de acrescentar bairro novo.

---

# 19. QA verificável e cenários de teste

## 19.1 Testes determinísticos de cidade

1. **Seed fixa:** duas gerações com a mesma seed produzem os mesmos lotes, orientações e edifícios (comparação de manifest e hashes).
2. **Invariantes:** todos os IDs únicos, prédios em lotes, entradas em rua e zona válida.
3. **Sem sobreposição:** pares de edifícios/lotes vizinhos não se interpenetram além de paredes geminadas explicitamente compartilhadas.
4. **Orla e esquina:** lotes de esquina têm calçada e fachada corretas; rua termina em ligação válida.
5. **Acessibilidade:** ao menos um caminho caminhável da calçada à porta de cada interior completo.
6. **Fachada não entra:** imóveis `none` não exibem prompt para entrar.
7. **Carregamento:** sair e voltar ao chunk não troca edifícios nem reseta propriedade.
8. **Navgação:** pedestres não cruzam paredes ou pistas arbitrariamente.

## 19.2 Testes de gameplay

1. Caminhar, correr, mirar e girar não inverte os comandos.
2. Câmera não atravessa parede ou o piso ao entrar em salas pequenas.
3. Interação sempre seleciona o objeto correto mais próximo e visível.
4. Portas nunca prendem o player entre malha e colisão.
5. Entrar/sair de veículo funciona perto de calçadas e vagas.
6. Pausa congela IA, economia e movimento.
7. Missões 1–3 têm happy path e retry reproduzível.
8. Autosave após missão não duplica dinheiro ou item.
9. Reload dentro de interior preserva saída válida ou restaura checkpoint seguro.
10. Falta de GLB/textura gera aviso recuperável ou fallback, não tela preta silenciosa.
11. Teste de performance compara cenário fixo antes/depois das alterações.

## 19.3 Relatório obrigatório por revisão

Criar `docs/QA_EVIDENCIAS.md` com tabela:

| ID | Funcionalidade | Status (pass/fail/not run) | Método | Evidência | Regressão? |
|---|---|---|---|---|---|
| CITY-001 | Seed determinística | not run | unit test | link/log | N/A |
| CITY-002 | Quatro quadras sem sobreposição | not run | manifest + visual | link/log | N/A |
| INT-001 | Entrada e saída do bar | not run | browser playtest | link/log | N/A |
| GAME-001 | Missão 1 completa | not run | replay controlado | link/log | N/A |
| PERF-001 | Rota de benchmark | not run | medição | JSON | N/A |

**Proibido** marcar `pass` sem execução real. Se não houver ambiente gráfico, marcar `not run` e relatar bloqueio, sem alegar que “jogou”.

---

# 20. Critérios globais de qualidade

### Visual

- Nada de cidade em grade com cubos idênticos sem composição urbana.
- Quarteirões com continuidade; fachadas adjacentes com base alinhada.
- Telhados e portas na escala correta; vidros e interiores com aparência crível.
- Noite iluminada, mas sem efeito forte escondendo falta de detalhes.

### Jogabilidade

- Mundo inicial apresenta motivo para exploração.
- Jogador controla corretamente a pé e em veículo.
- Dois interiores reais com interação e narrativa.
- Primeira missão tem conclusão inequívoca.

### Engenharia

- Dados separados de renderização e missões.
- Build reprodutível e deploy estático.
- Salvamento versionado e resistente a reload.
- Streaming, chunk unload e recursos descartados de forma segura.
- Testes determinísticos de lotes e colisão.

### Integridade de entrega

- Nada de dizer “jogo completo” depois de construir só o mapa.
- Nada de substituir teste humano por checagem puramente sintática.
- Nada de quebrar funcionalidades existentes para mostrar melhorias cosméticas.
- Nada de prometer jogabilidade ou interiores que são apenas cenografia.

---

# 21. Instrução mestre — copiar e colar no Gemini

> **Cole o bloco abaixo em uma conversa de programação do Gemini, junto com este arquivo MD, e dê acesso à pasta/repositório do jogo.** Caso não exista projeto, ele deve criar a base. Caso exista, ele deve inspecionar e preservar as funcionalidades boas antes de modificar.

```text
ATUE COMO ENGENHEIRO PRINCIPAL DE JOGOS 3D, TECH ARTIST E GAME DESIGNER.

Projeto: IMPÉRIO: REIS DE PORTO VESPER, jogo original de mundo aberto
para navegador PC usando Three.js, descrito integralmente no arquivo
IMPERIO_REIS_DE_PORTO_VESPER_GDD_GEMINI.md.

OBJETIVO CENTRAL:
Criar uma cidade realista na ORGANIZAÇÃO ESPACIAL, com ruas que formam
quadras, lotes contíguos, sequências de casas, comércios e edifícios.
Alguns imóveis terão interior FULL explorável, outros interior SHELL
limitado e muitos apenas FACHADA NONE. Não gerar prédios aleatórios
espalhados no mapa. Não deixar entradas, calçadas, escala, esquinas e
colisões incoerentes. Interiores FULL devem ter portas e saídas reais.

PRIMEIRO TRABALHO:
1. Inspecione todo o repositório e documente estado atual, problemas e
   riscos reais. Se não existir projeto, inicialize Vite + Three.js.
2. Leia o GDD completamente. Converta requisitos em checklist P0/P1/P2.
3. Implemente diretamente a FASE 0 e depois a FASE 1, priorizando
   arquitetura modular, gerador determinístico e quarteirões coerentes.
4. Crie 4 quadras no mínimo, 20–40 imóveis, oficina FULL, bar FULL,
   alguns SHELL e o restante NONE. Geração com seed e IDs estáveis.
5. Crie inspeção debug para rua/quadra/lote/interior; inclua testes de
   invariantes, sobreposição e entradas. Não trate fachada como interior.
6. Faça os testes realmente executáveis: npm install, build, testes e,
   se possível, navegador com caminhada/entrada/saída.
7. Corrija falhas confirmadas e execute novamente os testes.
8. Entregue código completo, docs, changelog e lista explícita de
   PASS/FAIL/NOT RUN. Publique no GitHub Pages apenas se tiver acesso e
   autorização; se não tiver, prepare os comandos e o workflow.

REGRAS INEGOCIÁVEIS:
- NÃO responda apenas com planejamento: implemente o que for possível.
- NÃO reúna tudo em um arquivo monolítico.
- NÃO use assets pirateados de filmes/jogos nem marcas ou personagens
  copiados; crie IP original.
- NÃO gere dezenas de bairros antes de completar um bairro jogável.
- NÃO crie NPCs ou IA de trânsito que atravessem paredes.
- NÃO simule interiores apenas com retângulos por trás de janelas e diga
  que são exploráveis.
- NÃO invente testes, FPS, resultados de browser ou status de deploy.
- Use placeholders técnicos somente identificados e com TODO rastreável.
- Preserve o que funciona; entregue comparação ANTES/DEPOIS.
- Para cada nova revisão, foque no defeito de maior impacto, implemente,
  teste e avance sem pedir confirmação desnecessária.

CRITÉRIOS DE PRONTO:
Um jogador consegue iniciar, andar pelas quadras, entrar na oficina,
sair, entrar no bar, interagir, observar a variedade de fachadas,
ver edifícios sem acesso devidamente fechados, dirigir um carro básico,
abrir o menu, salvar e recarregar sem alterar lotes nem posição válida.
Se alguma parte não existir, marque-a como pendente — sem falsear entrega.

RESPOSTA POR ITERAÇÃO:
A) Estado inicial auditado.
B) Arquivos modificados/criados.
C) Mudanças reais por subsistema.
D) Testes executados, comandos e resultados.
E) O que ainda falta (em ordem de prioridade).
F) Como executar localmente e publicar.
G) Próximo passo de maior impacto — e execute-o se viável.
```

---

# 22. Prompts de continuação especializados

## 22.1 Cidade e sequências de casas

```text
Continue IMPÉRIO com foco EXCLUSIVO na cidade. Inspecione o gerador
existente. Corrija quarteirões, parcelamento, alinhamento de casas,
esquinas, orientação de portas e gaps entre lojas. Construa ruas com
sequências arquitetônicas plausíveis. Adicione teste automático para
sobreposição, validação de lotes e determinismo por seed. Não
adicione mais bairros antes de validar 4 quadras completas. Entregue
antes/depois e provas por teste.
```

## 22.2 Interiores reais e fachadas leves

```text
Continue IMPÉRIO implementando as categorias none/shell/full.
FULL: oficina e bar com estrutura, porta, colisão, móveis,
interação, NPC e transição consistente. SHELL: vitrines com
profundidade visual curta, sem prometer entrada quando não houver.
NONE: fachadas leves com vidros, telhados e iluminação simulada.
Implemente streaming, carga/descarga e testes de entrada/saída;
verifique que o interior encaixa no prédio externo.
```

## 22.3 Missões cinematográficas

```text
Continue IMPÉRIO implementando missões 1, 2 e 3 do GDD.
Use sistema de etapas serializáveis, checkpoints, diálogos com
legendas, triggers verificados, câmera de cutscene e opção de pular.
Integre mapa e marcador de missão. Faça playtests dos fluxos
completo, falha e retry. Não invente resultados.
```

## 22.4 Otimização e benchmark

```text
Audite IMPÉRIO em desempenho real. Meça draw calls, memória
quando disponível, render scale, frame time, quantidade de NPCs,
assets e chunks. Implemente LOD por distância, batching/instancing
adequado, descarte seguro e culling de interiores. Compare a
mesma rota/seed/cenário antes e depois. Não esconda perda visual
com configurações diferentes na comparação.
```

---

# 23. Definição de primeiro protótipo aprovado

O primeiro protótipo de **IMPÉRIO** é considerado aprovado apenas quando:

1. A cena abre e tem menu funcional.
2. O personagem pode circular por **quatro quarteirões bem construídos**.
3. Há **20–40 imóveis** em lotes contíguos com escala coerente.
4. Casas, lojas e prédios aparecem em **sequências urbanas**, não soltos.
5. Existem **dois interiores FULL**, oficina e bar, realmente percorríveis.
6. Existem imóveis **SHELL** e **NONE**, com comportamento distinto.
7. As entradas e saídas funcionam; piso e portas têm colisão correta.
8. Há ao menos uma interação, um objetivo simples e um carro dirigível.
9. O save preserva estado e a mesma seed reproduz os quarteirões.
10. O código compila, possui testes reproduzíveis e relatório honesto do que foi validado.

**A cidade completa, 30 missões, múltiplos finais, facções avançadas, interiores de outros bairros e sistemas econômicos amplos são marcos posteriores.** O documento orienta a construção do jogo inteiro, mas não confunde concepção com implementação.

---

# 24. Prioridades imediatas para a primeira execução no Gemini

| Ordem | Tarefa | Criticidade | Resultado visível |
|---:|---|---|---|
| 1 | Projeto modular, câmera, input, render | P0 | Personagem movimenta |
| 2 | Grafo de ruas e quadras com seed | P0 | 4 quadras com calçadas |
| 3 | Lotes e fachadas sequenciais | P0 | Bairro com casas, lojas e esquinas |
| 4 | Categorias NONE/SHELL/FULL | P0 | Fachadas e vitrines distintas |
| 5 | Oficina + bar completos | P0 | Entrar e sair sem bugs |
| 6 | Colisão, navegação e debug | P0 | Andar e inspecionar sem atravessar |
| 7 | Save e carregamento do mundo | P0 | Mesmo bairro após reload |
| 8 | Carro e missão tutorial | P1 | Primeira jogabilidade real |
| 9 | Facções, combate, economia | P1 | Primeira evolução do império |
| 10 | Expansão, arte, rádio, capítulos | P2/P3 | Mundo e campanha crescendo |

**Regra de continuação:** a cada comando “próxima”, revisar pendências e executar o item mais importante ainda não concluído, com testes e sem recomeçar o projeto.

---

## Nota final de produção

O projeto só alcançará a proposta desejada se o gerador urbano e o sistema de interiores forem tratados como fundamentos da arquitetura. A cidade deve parecer um lugar construído para ser habitado, e não um cenário de cubos aleatórios. A expansão só deve acontecer depois de existir uma experiência pequena, funcional, persistente, navegável e testada.
