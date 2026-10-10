# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O rastreador (que o `cortar.mjs` já roda, e o `ferramentas/rastrear-rosto.mjs` refaz com a largura medida) preenche `rosto.rastro` e `rostoLargura`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, quando precisa, `zonas`, `zoomPerto` e `zoomLado`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. Layouts: onde a pessoa fica
3. O rosto: zonas e medidas
4. As marcas no rosto
5. Os 11 blocos universais
6. A assinatura: `truque`, `amostras`, `resultado`
7. Como escolher os blocos
8. Regras de tempo
9. Legenda e correções
10. Exemplos completos (o demo de maquiagem e um vídeo de cripto)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "sfx": true,
  "correcoes": { "para": "pra", "2": "Dois" }
}
```

- `marca`: aparece só no fechamento (`cta`), embaixo da frase. `nome` vazio = sem assinatura. Nome e área encolhem até caber numa linha.
- `sfx`: `false` desliga os sons (tom grave na abertura e no fechamento, uma nota por bloco subindo, a nota mais grave no alerta, um acorde no resultado).
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.
- `rostoLargura` e `rosto.rastro`: a largura medida (passo 5 da skill) e o caminho do rosto quadro a quadro. Não edite à mão; rode a ferramenta de novo. A largura também diz onde fica o queixo: os cartões que sobem de baixo param antes dele.
- `zonas` (opcional): corrige uma zona do rosto que caiu fora do lugar, em frações da largura do rosto (seção 3).
- `zoomPerto` (opcional): aproximação do layout `perto` (padrão 1,22). Selfie com rosto enorme (≥ 0,5 da largura) → 1,1; rosto pequeno (pessoa sentada, ~0,30) → 1,4.
- `zoomLado` (opcional): aproximação da pessoa no layout `lado` (padrão 1). Rosto pequeno → 1,25; acima de ~1,3 as orelhas encostam nas bordas da faixa.

## 2. Layouts: onde a pessoa fica

| Layout | A pessoa | Os blocos que usam |
|---|---|---|
| `cheio` | quadro cheio, rosto no centro (o zoom troca seco entre 1 e 1,06 nos cortes) | texto no peito: `abertura`, `numero`, `destaque`, `frase`, `resultado`; cartão de baixo: `grafico`, `pergunta`, `cta`, `amostras` em godês |
| `perto` | quadro cheio com a câmera aproximando o rosto (`zoomPerto`) | cartão de baixo: `truque` (padrão), `comparacao` (padrão); os do peito e do cartão também aceitam |
| `lado` | desliza para um lado e ocupa ~56% da largura; um painel creme abre do outro | `topicos`, `passos`, `definicao` (sempre), `amostras` (padrão), `truque` com `"layout": "lado"` |

- Cada bloco tem um padrão; escreva `"layout"` só para trocar entre os que ele aceita (`truque` e `amostras` aceitam os três; `topicos`, `passos` e `definicao` só existem no `lado`; os outros aceitam `cheio` e `perto`). Um layout que o bloco não tem vira o padrão dele.
- No `lado`, a pessoa alterna de lado a cada vez (esquerda, direita…). Para escolher, escreva `"lado": "esquerda"` ou `"direita"` (é o lado onde fica a PESSOA). Dois painéis colados nunca ficam do mesmo lado: a pessoa cruza a tela.
- A troca de layout começa no corte mais próximo e leva 0,6 s. Depois de um painel, o texto do peito e o cartão esperam ~0,45 s: a pessoa cobre a página antes de o texto novo aparecer.
- Varie: nunca três blocos do mesmo layout seguidos se a fala permitir; um vídeo de 30–60 s fica bom com 2 a 3 painéis, alguns cartões e alguns textos no peito.

## 3. O rosto: zonas e medidas

As marcas são posicionadas a partir do **centro do rosto** (entre os olhos e a ponta do nariz), em frações da **largura do rosto** (`rostoLargura`): `u` vai para a direita da imagem, `v` para baixo. As zonas laterais existem dos dois lados (espelhadas).

| Zona | Onde fica | u | v | Na metáfora |
|---|---|---|---|---|
| `testa` | meio da testa | 0 | −0,52 | pensar, decidir, critério, ideia |
| `raizCabelo` | raiz do cabelo | 0 | −0,70 | |
| `sobrancelha` | meio da sobrancelha | ±0,26 | −0,32 | dúvida, surpresa |
| `tempora` | lateral, na altura dos olhos | ±0,47 | −0,19 | ouvir, lembrar |
| `olhos` | logo abaixo dos cílios de baixo | ±0,225 | −0,08 | ver, entender, atenção |
| `olheira` | embaixo do olho | ±0,22 | −0,02 | cansaço |
| `macaAlta` | osso da bochecha | ±0,33 | −0,02 | |
| `maca` | centro da maçã do rosto | ±0,25 | 0,10 | emoção, sorriso |
| `nariz` | dorso do nariz | 0 | 0,04 | |
| `cupido` | logo acima do lábio de cima | 0 | 0,22 | |
| `labios` | meio da boca | 0 | 0,33 | falar, prometer, pedir, conversar |
| `mandibula` | canto da mandíbula | ±0,36 | 0,42 | |
| `queixo` | queixo | 0 | 0,66 | |

Um ponto livre vale em qualquer lugar onde se pede uma zona: `{ "u": 0.3, "v": 0.5 }` (lado direito da imagem; para o outro lado, `u` negativo ou `lados`). Os pontos rosa das guias (`stills.mjs --guias`) mostram onde cada zona caiu; corrija só a que estiver fora em `zonas`.

**Pessoa de óculos**: com as zonas padrão, olhos, olheira e maçã caem em cima da lente. Veja onde a armação termina embaixo (no ponto mais baixo, quando a pessoa inclina a cabeça) e desça as zonas. O demo (óculos, sentado, rosto com 0,30 da largura):

```json
"zonas": { "olhos": { "u": 0.225, "v": 0.09 }, "olheira": { "u": 0.24, "v": 0.17 }, "maca": { "u": 0.28, "v": 0.24 },
           "macaAlta": { "u": 0.31, "v": 0.16 }, "tempora": { "u": 0.53, "v": 0.08 } }
```

Em selfie muito perto, a `testa` padrão pode cair na raiz do cabelo: use `{ "u": 0, "v": -0.42 }`.

## 4. As marcas no rosto

As marcas ficam em `marcas` dentro de um `truque` (opcional: sem marcas o truque continua completo) e voltam todas juntas no `resultado`. Cada uma se desenha no seu `em` (a palavra que fala dela), acompanha o rosto e some no fim do momento. Campos comuns:

- `em`: quando começa a se desenhar.
- `lados`: `"ambos"` (padrão), `"esquerda"` ou `"direita"` (lados da imagem). Zonas do meio aparecem uma vez só.
- `cor` (opcional): cor só desta marca; sem ela, a do truque. Cores claras (`iluminador`, `corretivo`) clareiam a pele; médias e escuras tingem.
- `rotulo` (opcional): etiqueta creme presa por uma linha-guia, `{ "texto": "triângulo", "em": 6.43 }`, **até ~16 caracteres**. Use pouco: no layout `lado`, as dicas do painel fazem esse papel (campo `liga` da dica).

| Forma | Campos | Para |
|---|---|---|
| `circulo` | `onde`, `raio` (padrão 0,09) | marcar uma área: "olheira", "a testa", "os olhos" — **a forma mais útil fora da maquiagem** |
| `brilho` | `onde` | um ponto perolado com estrela de quatro pontas que cintila: "iluminador", e fora da maquiagem "a ideia", "o acerto" |
| `seta` | `de`, `ate` | seta pontilhada curva: "puxa pra fora", "de dentro pra fora" |
| `triangulo` | `setaEm`, `altura` (padrão 0,23) | o triângulo do corretivo embaixo dos olhos; `setaEm` = setas subindo ("puxando pra cima") |
| `esfumado` | `de` (padrão `maca`), `ate` (padrão `tempora`), `sobeEm`, `setaEm`, `levantaEm` | mancha alongada (blush, contorno, bronzer); `sobeEm` = começa baixa e sobe; `setaEm` = seta até `ate`; `levantaEm` = linhas de elevação |

```json
{ "forma": "circulo", "onde": "testa", "em": 20.43, "raio": 0.12, "cor": "iluminador" }
{ "forma": "brilho", "onde": { "u": 0, "v": -0.42 }, "em": 26.47 }
{ "forma": "triangulo", "em": 6.04, "setaEm": 8.03, "altura": 0.175, "rotulo": { "texto": "triângulo", "em": 6.43 } }
{ "forma": "esfumado", "em": 10.13, "sobeEm": 10.93, "setaEm": 11.83, "levantaEm": 13.18 }
```

## 5. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate`, `legenda?` (true = a legenda continua durante o bloco) e `layout?`/`lado?` (seção 2). Todo campo `em`/`…Em` é o instante de uma palavra dita. Os textos encolhem sozinhos para caber (medidos com a fonte de verdade, até um mínimo legível de ~40 px) e quebram em linhas; os limites abaixo são o que fica bonito. Passou do limite, o texto fica pequeno: reescreva mais curto com as palavras da fala.

### `abertura` — título no peito (padrão `cheio`)

```json
{ "tipo": "abertura", "de": 0, "ate": 3.6, "texto": "3 luzes do painel que você nunca pode ignorar", "destaque": "nunca pode ignorar" }
```

- `texto`: a primeira frase com as palavras da fala, **até ~60 caracteres**. As primeiras palavras (até ~12 caracteres) viram a linha grande e fina; o resto quebra sozinho em até 3 linhas. Um número dito por extenso pode virar algarismo ("Três" → "3").
- `destaque` (opcional): o trecho exato que ganha a faixa blush.
- `em` (opcional): quando o texto começa a ser dito (padrão `de`).
- Do Brilho, opcionais: `linhas` (quebra manual, ex.: `["3 truques", "de maquiagem", "pra parecer mais", "descansada"]`), `rotulo` (o tema em caixa alta pequena), `tempo` (relógio que fecha a volta: `{ "valor": "5", "unidade": "min", "em": 3.5 }`, só se um tempo for dito) e `pontos` (pontos numerados no rosto, `[{ "onde": "olheira", "em": 0.28, "lado": "esquerda" }, …]`, um por item anunciado). **Use `pontos` só quando os itens vão virar marcas no rosto depois** (maquiagem, skincare, expressão); fora disso, ficam soltos no rosto sem sentido.
- No começo do vídeo o título já aparece no primeiro quadro (a capa do Reels não fica vazia).

### `topicos` — lista sem ordem (sempre `lado`)

```json
{ "tipo": "topicos", "de": 3.6, "ate": 9.38, "titulo": "Luzes do painel",
  "itens": [ { "texto": "Óleo", "em": 3.80, "detalhe": "parece uma lamparina", "cor": "bronzer" },
             { "texto": "Temperatura", "em": 6.24, "detalhe": "um termômetro" },
             { "texto": "Bateria", "em": 8.59 } ] }
```

- Painel creme: cada item é uma amostra passada (a lápis desde que o painel abre, colorida no `em`) com o texto embaixo e o `detalhe` em tinta suave. Os itens se espalham até a base; com pouco texto, amostras e letras crescem.
- `itens`: 2 a 5; `texto` **até ~30 caracteres** (2 a 6 palavras), `detalhe` **até ~30**, também dito (as palavras dele entram na fala). `cor` opcional (nome da seção 6 ou `#RRGGBB`); sem ela, os tons alternam.
- `titulo` (opcional): **até ~30 caracteres**.

### `passos` — sequência em ordem (sempre `lado`)

```json
{ "tipo": "passos", "de": 28.0, "ate": 33.7, "titulo": "Aula gratuita",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- Painel: o número enorme e fino rola para o passo atual (01 → 02 → 03, com "/03" ao lado), os círculos numerados acendem um por um, o progresso ● ● ○ embaixo.
- `itens`: 2 a 5; `texto` **até ~30 caracteres**; `icone` opcional troca o número do círculo (lista na seção 6).
- `titulo` (opcional): **até ~30 caracteres**.

### `numero` — número que conta (padrão `cheio`)

```json
{ "tipo": "numero", "de": 0, "ate": 3.9, "valor": 83000, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.10, "em": 1.34 }
```

- No peito: o `rotulo` sobe palavra por palavra (a partir de `rotuloEm`), o número conta em blush de `em` até `emFim` (padrão `em` + 0,9), formato pt-BR (83.000; 1,5).
- `valor` (número), `em` e `rotulo` (**até ~30 caracteres**) obrigatórios. `prefixo` ("US$", "R$"), `sufixo` ("%", "mil", "mi", "horas"), `casas` (casas decimais), `ilustrativo` (etiqueta "ilustrativo" embaixo), `icone` (ícone a traço ao lado do sufixo). Tudo encolhe junto para caber na largura.
- Só números ditos.

### `comparacao` — dois lados (padrão `perto`)

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- Cartão de baixo com dois godês: cada lado acende no seu `em` (o godê "prensa" a cor, o rótulo vinho em caixa alta, o texto palavra por palavra).
- `modo`: `contra` (× no meio, padrão), `antes-depois` (→ no meio) ou `errado-certo` (o primeiro lado ganha um ✕ vinho, o segundo um ✓).
- `vencedor` (0 ou 1) e `vencedorEm`: o lado que perde fica cinza "a lápis" e o que ganha leva o check.
- `rotulo` **até ~16 caracteres**; `texto` **até ~30**; `titulo` opcional **até ~30**.

### `grafico` — barras, linha, pizza ou tendência (padrão `cheio`)

```json
{ "tipo": "grafico", "de": 2, "ate": 4, "forma": "barras", "unidade": "%",
  "dados": [ { "rotulo": "Moradia", "valor": 35, "em": 2.2 }, { "rotulo": "Lazer", "valor": 8, "em": 2.9 } ] }
{ "tipo": "grafico", "de": 9, "ate": 12, "forma": "linha", "titulo": "O mercado sobe", "tendencia": "sobe", "tendenciaEm": 9.3, "ilustrativo": true }
```

- Cartão de baixo. `barras` = cada dado é uma amostra passada no comprimento do valor, com o valor em vinho na ponta; `linha` = traço de pincel (blush largo + linha vinho) ponto a ponto; `pizza` = um godê dividido em fatias, com a legenda ao lado.
- `dados`: **2 a 6 números ditos**, cada um com `rotulo` (**até ~16 caracteres**), `valor` e `em`. `unidade`: "%", "mil", "R$"…
- Sem números ditos: `tendencia` (`sobe`, `cai`, `oscila`) + `tendenciaEm` + `"ilustrativo": true` → uma pincelada que se desenha durante o bloco, com a etiqueta "ilustrativo" no canto.
- `titulo` opcional **até ~40 caracteres**.

### `destaque` — frase curta que bate forte (padrão `cheio`)

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.88, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- No peito: um ícone num círculo (alerta vinho ou brilho blush), a frase grande palavra por palavra e a faixa passando por trás dela inteira: vinho com texto creme no `alerta`, blush com texto ameixa na `chave` (padrão).
- `texto` **até ~30 caracteres**; `detalhe` (opcional, **até ~40**) entra embaixo em `detalheEm`.

### `definicao` — termo e significado (sempre `lado`)

```json
{ "tipo": "definicao", "de": 3.9, "ate": 8.6, "termo": "Bull market", "em": 5.30, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- Painel: um traço a lápis e a amostra tracejada esperam; o termo sobe em tinta no `em`, a amostra é passada, uma linha-guia vinho desce até o ponto do significado, que entra palavra por palavra em `significadoEm`.
- `termo` **até ~24 caracteres**; `significado` **até ~60**.

### `frase` — frase de efeito (padrão `cheio`)

```json
{ "tipo": "frase", "de": 33.7, "ate": 35.45, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.25, "em": 33.83 }
```

- No peito: uma pincelada curta de blush abre a frase; o texto entra palavra por palavra; `destaque` (opcional) ganha a faixa blush; `risco` (opcional) é riscado em blush em `riscoEm` (padrão: logo depois de o trecho ser dito).
- `texto` **até ~60 caracteres**. `em` (opcional): quando o texto começa a ser dito.

### `pergunta` — pergunta para quem assiste (padrão `cheio`)

```json
{ "tipo": "pergunta", "de": 35.45, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- Cartão de baixo: "?" grande e fino em vinho, a pergunta palavra por palavra, as opções em pílulas tracejadas que acendem (borda vinho, fundo blush claro, godê colorido) quando são ditas.
- `texto` **até ~80 caracteres**; `opcoes` (opcional) **2 a 4**, cada uma **até ~30 caracteres**. `em` (opcional).

### `cta` — fechamento (padrão `cheio`)

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.067, "texto": "Toca em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "detalhe": "e assiste essa aula agora", "em": 40.05 }
```

- Cartão de baixo: o ícone se desenha e se preenche, a chamada entra palavra por palavra (primeira linha em negrito), `destaque` com a faixa blush, `detalhe` embaixo, a assinatura (`marca`) por último.
- `texto` **até ~40 caracteres**; `icone`: `salvar` (padrão), `seguir`, `comentar` ou `link`; `detalhe` **até ~40**; `em` (opcional).
- O último momento, se termina a menos de 0,3 s do fim, fica até o último quadro.

## 6. A assinatura: `truque`, `amostras`, `resultado`

### `truque` — o ponto numerado (padrão `perto`; aceita `lado` e `cheio`)

```json
{ "tipo": "truque", "de": 14.88, "ate": 23.9, "layout": "lado", "rotulo": "Mesmo na alta", "produto": "Tem gente que perde", "cor": "berry", "produtoEm": 15.96,
  "dicas": [ { "em": 17.73, "texto": "compra por impulso", "icone": "coracao" },
             { "em": 19.21, "texto": "escolhe moeda sem critério", "icone": "x", "liga": 0 },
             { "em": 21.25, "texto": "assume risco que não entende", "icone": "olho", "liga": 1 } ],
  "marcas": [ { "forma": "circulo", "onde": "testa", "em": 20.43, "raio": 0.12, "cor": "iluminador" },
              { "forma": "circulo", "onde": "olheira", "em": 22.41, "cor": "iluminador", "lados": "direita" } ] }
```

- No `perto`/`cheio`: cartão que sobe de baixo, cresce a cada dica e para antes do queixo. No `lado`: a página com rótulo, número enorme, nome, amostra passada, dicas espalhadas até a base, progresso e linhas-guia do rosto até as dicas.
- `produto`: o nome do ponto (qualquer assunto: "Corretivo", "Impulso", "Bateria", "Como avaliar"), **até ~20 caracteres** (quebra em 2 ou 3 linhas antes de ficar pequeno). Entra "a lápis" junto com o cartão/painel e ganha tinta em `produtoEm`.
- `numero` (opcional): 1, 2, 3… quando a fala numera ou quando há uma série. Vira "01" grande e o rótulo "<rotulo> 2 de 3".
- `rotulo` (opcional): a palavra em caixa alta (padrão "Passo" quando há número; sem número, nada). Use a palavra que combina: "Truque", "Erro", "Hábito", "Caso", "Fase", ou um trecho curto da fala ("Mesmo na alta", "Agora"). **Até ~18 caracteres** (o espaçamento aperta para caber numa linha); `""` esconde.
- `cor`: a cor da amostra. Nomes: `corretivo`, `base`, `po`, `blush`, `rosado`, `pessego`, `iluminador`, `bronzer`, `contorno`, `sombra`, `batom`, `nude`, `vinho`, `gloss`, `delineador`, `mascara`, `berry` (o vinho da interface, bom para "o problema") — ou `"#RRGGBB"`. Fora da maquiagem, a cor é ilustrativa: escolha pelo clima (problema = `berry`/`vinho`/`batom`; solução = `blush`/`pessego`; neutro = `nude`/`sombra`).
- `dicas`: 1 a 3, com as palavras da fala, **até ~30 caracteres** cada (no painel quebram em 2 ou 3 linhas; dicas longas encolhem de 54 para 44 px). `icone` (opcional): `cima`, `baixo`, `seta`, `diagonal`, `check`, `x`, `alerta`, `olho`, `ideia`, `dinheiro`, `brilho`, `gota`, `pincel`, `relogio`, `lua`, `coracao`, `estrela`. Sem ícone: pincel, e check na última. `liga` (só no `lado`): índice da marca em `marcas` que ganha uma linha-guia até esta dica.
- `marcas` (opcional): 0 a 3 (seção 4). Fora da maquiagem, use o rosto como mapa só quando a fala combina (testa = pensar/critério, olhos = ver/entender, boca = falar).
- Deixe ~0,8 s entre o `de` e a primeira marca de um truque numerado: é quando o número aparece no rosto.

### `amostras` — paleta de 2 a 4 opções (padrão `lado`; aceita `cheio`)

```json
{ "tipo": "amostras", "de": 8.8, "ate": 11, "titulo": "Três tipos de fome",
  "itens": [ { "em": 9.0, "nome": "Física" }, { "em": 9.6, "nome": "Emocional", "cor": "pessego" }, { "em": 10.2, "nome": "Hábito" } ] }
```

- No `lado`: cada cor é passada no painel (tracejada desde que ele abre) com o nome embaixo. No `cheio`: cartão com godês redondos lado a lado.
- Serve para tons de batom e também para qualquer conjunto de opções: perfis de investidor, tipos de fome, planos, sinais.
- `itens`: 2 a 4; `nome` **até ~12 caracteres**; `cor` opcional (sem ela, os tons alternam). `titulo` **até ~24**; `rotulo` (caixa alta) opcional.

### `resultado` — o fecho (padrão `cheio`)

```json
{ "tipo": "resultado", "de": 18.73, "ate": 21.56, "marcasEm": 18.83, "texto": ["Pronto,", "cara de quem dormiu"],
  "numero": { "valor": 8, "unidade": "horas", "em": 20.63, "emFim": 21.15, "icone": "lua" } }
```

- Todas as marcas dos truques anteriores voltam juntas no rosto (a forma final), com a frase no peito (com mais de uma linha, a primeira fica em blush) e um número opcional (`valor`, `unidade`, `prefixo`, `casas`, `em`, `emFim`, `icone`).
- Use no fim da parte prática ("pronto", "resultado", "olha como fica"), antes do fechamento.

## 7. Como escolher os blocos

Siga `references/adaptar.md` (o mapa editorial). Neste modelo:

| A fala traz… | Bloco do Brilho |
|---|---|
| a promessa de abertura | `abertura` (com `destaque`) |
| um ponto com nome e o que fazer com ele (produto, erro, hábito, caso, fase) | `truque` (a assinatura), com marcas quando o rosto entra na metáfora |
| 2 a 4 opções com nome | `amostras` |
| uma lista de motivos, sinais, itens | `topicos` |
| uma sequência, um processo | `passos` (ou vários `truque` numerados, se cada passo tem dicas) |
| um número dito | `numero` |
| dois lados | `comparacao` |
| algo que sobe/cai, proporções | `grafico` |
| um alerta ou palavra-chave forte | `destaque` |
| um termo explicado | `definicao` |
| uma opinião forte, uma conclusão | `frase` |
| uma pergunta para quem assiste | `pergunta` |
| "pronto", o efeito final | `resultado` |
| a chamada final | `cta` |

- Um momento a cada 3–6 s; o `conferir.mjs` exige ≥70% do vídeo com momento, nenhum trecho de mais de ~3,5 s só com legenda e a assinatura pelo menos uma vez.
- Varie os layouts (peito, cartão, painel); não repita o mesmo bloco três vezes seguidas.

## 8. Regras de tempo

- `de`: o `em` da primeira palavra que o momento cobre, menos 0,05 (ou o corte logo antes dela). Nunca antes do `ate` do anterior.
- `ate`: o `em` da **primeira palavra que o momento não cobre**, ou o fim do vídeo.
- Duração mínima: 1,5 s. Momento com mais de ~4 s precisa de itens entrando por dentro.
- **Nada parado**: dentro de um momento, alguma coisa nova a cada 1,5–2,5 s (uma palavra, um item, uma dica, uma marca, uma contagem). Se a fala não tem mais o que mostrar, encurte o momento.
- Itens, dicas, marcas, `produtoEm`, `significadoEm`, `riscoEm`, `vencedorEm`, `marcasEm`: o `em` da palavra que fala daquilo. Nada aparece antes de ser dito (o nome do truque e as amostras aparecem antes só "a lápis").
- Uma faixa ou risco na última palavra de um momento precisa de ~0,4 s antes do `ate` para terminar.

## 9. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez, embaixo, acima da interface do aplicativo; a palavra falada ganha a faixa blush. Ela **some durante um momento**, porque o bloco já mostra o que é dito.

- `"legenda": true` no momento: a legenda continua durante ele (o cartão sobe um pouco; no `lado`, a legenda fica só em cima da pessoa). Use num `truque` quando a fala tem mais do que as dicas mostram. Não use nos blocos do peito.
- `semLegenda`: faixas extras sem legenda, `[ { "de": 3.27, "ate": 6.0 } ]`.
- `correcoes`: palavras que a transcrição errou, sem pontuação: `{ "bloche": "blush", "para": "pra" }`. A chave pode ter várias palavras e `""` apaga. Só corrija o que você tem certeza; não edite `palavras` à mão. As correções valem também para achar o tempo das palavras nos blocos.

Para ver as linhas de legenda antes de renderizar: `node scripts/legendas.mjs`.

## 10. Exemplos completos

### O demo (maquiagem, 23 s)

Roteiro: "Três truques de maquiagem pra parecer mais descansada em cinco minutos. Um: corretivo em triângulo embaixo dos olhos, puxando pra cima. Dois: blush um pouco mais alto, na direção da têmpora, levanta o rosto. Três: iluminador só no ponto alto da maçã e no arco do cupido. Pronto, cara de quem dormiu oito horas. Salva pra testar amanhã."

```json
{
  "marca": { "nome": "Tiago", "area": "Maquiador" },
  "correcoes": { "para": "pra", "2": "Dois", "E aí": "", "Obrigado": "" },
  "zonas": { "olhos": { "u": 0.225, "v": 0.09 }, "olheira": { "u": 0.24, "v": 0.17 }, "maca": { "u": 0.28, "v": 0.24 },
             "macaAlta": { "u": 0.31, "v": 0.16 }, "tempora": { "u": 0.53, "v": 0.08 } },
  "zoomPerto": 1.4,
  "zoomLado": 1.25,
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 4.59, "texto": "3 truques de maquiagem pra parecer mais descansada", "destaque": "descansada",
      "linhas": ["3 truques", "de maquiagem", "pra parecer mais", "descansada"],
      "pontos": [ { "onde": "olheira", "em": 0.28, "lado": "esquerda" }, { "onde": "macaAlta", "em": 0.48 }, { "onde": "cupido", "em": 0.68 } ],
      "tempo": { "valor": "5", "unidade": "min", "em": 3.5 } },
    { "tipo": "truque", "de": 4.59, "ate": 9.0, "numero": 1, "rotulo": "Truque", "produto": "Corretivo", "cor": "corretivo", "produtoEm": 5.48,
      "dicas": [ { "em": 5.9, "texto": "em triângulo embaixo dos olhos", "icone": "pincel" }, { "em": 7.97, "texto": "puxando pra cima", "icone": "cima" } ],
      "marcas": [ { "forma": "triangulo", "em": 6.04, "setaEm": 8.03, "altura": 0.175, "rotulo": { "texto": "triângulo", "em": 6.43 } } ] },
    { "tipo": "truque", "de": 9.0, "ate": 14.3, "layout": "lado", "numero": 2, "rotulo": "Truque", "produto": "Blush", "cor": "blush", "produtoEm": 9.92,
      "dicas": [ { "em": 10.19, "texto": "um pouco mais alto", "icone": "cima", "liga": 0 },
                 { "em": 11.71, "texto": "na direção da têmpora", "icone": "diagonal", "liga": 0 },
                 { "em": 13.16, "texto": "levanta o rosto", "icone": "check" } ],
      "marcas": [ { "forma": "esfumado", "em": 10.13, "sobeEm": 10.93, "setaEm": 11.83, "levantaEm": 13.18 } ] },
    { "tipo": "truque", "de": 14.3, "ate": 18.73, "layout": "lado", "numero": 3, "rotulo": "Truque", "produto": "Iluminador", "cor": "iluminador", "produtoEm": 15.27,
      "dicas": [ { "em": 15.82, "texto": "só no ponto alto da maçã", "icone": "brilho", "liga": 0 },
                 { "em": 17.61, "texto": "e no arco do cupido", "icone": "brilho", "liga": 1 } ],
      "marcas": [ { "forma": "brilho", "onde": "macaAlta", "em": 16.58 }, { "forma": "brilho", "onde": "cupido", "em": 17.88 } ] },
    { "tipo": "resultado", "de": 18.73, "ate": 21.56, "marcasEm": 18.83, "texto": ["Pronto,", "cara de quem dormiu"],
      "numero": { "valor": 8, "unidade": "horas", "em": 20.63, "emFim": 21.15, "icone": "lua" } },
    { "tipo": "cta", "de": 21.56, "ate": 23.04, "texto": "Salva pra testar amanhã", "icone": "salvar" }
  ]
}
```

### Fora do nicho (cripto, 43 s, selfie com rosto enorme)

Roteiro: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

Layouts: peito (número) → painel (definição, pessoa à esquerda) → cartão (comparação) → peito (alerta) → painel (truque, pessoa à direita, rosto anotado) → cartão (truque) → painel (passos) → peito (frase) → cartão (pergunta) → cartão (cta).

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "zoomPerto": 1.1,
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 3.9, "valor": 83000, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.10, "em": 1.34 },
    { "tipo": "definicao", "de": 3.9, "ate": 8.6, "termo": "Bull market", "em": 5.30, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 14.88, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "truque", "de": 14.88, "ate": 23.9, "layout": "lado", "rotulo": "Mesmo na alta", "produto": "Tem gente que perde", "cor": "berry", "produtoEm": 15.96,
      "dicas": [ { "em": 17.73, "texto": "compra por impulso", "icone": "coracao" },
                 { "em": 19.21, "texto": "escolhe moeda sem critério", "icone": "x", "liga": 0 },
                 { "em": 21.25, "texto": "assume risco que não entende", "icone": "olho", "liga": 1 } ],
      "marcas": [ { "forma": "circulo", "onde": "testa", "em": 20.43, "raio": 0.12, "cor": "iluminador" },
                  { "forma": "circulo", "onde": "olheira", "em": 22.41, "cor": "iluminador", "lados": "direita" } ] },
    { "tipo": "truque", "de": 23.9, "ate": 28.0, "rotulo": "Agora", "produto": "Como avaliar", "cor": "blush", "produtoEm": 24.58,
      "dicas": [ { "em": 25.53, "texto": "os projetos", "icone": "olho" }, { "em": 26.47, "texto": "pensar no seu posicionamento", "icone": "ideia" } ],
      "marcas": [ { "forma": "brilho", "onde": { "u": 0, "v": -0.42 }, "em": 26.47 } ] },
    { "tipo": "passos", "de": 28.0, "ate": 33.7, "titulo": "Aula gratuita",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.7, "ate": 35.45, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.25, "em": 33.83 },
    { "tipo": "pergunta", "de": 35.45, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.067, "texto": "Toca em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "detalhe": "e assiste essa aula agora", "em": 40.05 }
  ]
}
```

Repare: nenhum número inventado (só os US$ 83.000 ditos); a assinatura entra duas vezes, como metáfora (o "problema" em vinho com o rosto anotado onde a fala fala de pensar e de entender; o "conserto" em blush com um brilho na testa em "pensar"); cada item entra na palavra que o nomeia.
