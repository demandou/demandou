# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `fachada`, `momentos`, `semLegenda`, `correcoes` e corrige `palavras` quando a transcrição errou um preço, um número ou um nome (SKILL.md, passo 4b).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: a fachada
3. A assinatura: `vitrine`
4. Os efeitos próprios: `combo` e `mapa`
5. Os blocos universais
6. Regras de tempo
7. Legenda, correções e sons
8. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Bruno Siqueira", "area": "Confeiteiro" },
  "fachada": { "nome": "Confeitaria", "em": 0.66 },
  "sfx": true,
  "correcoes": {},
  "semLegenda": []
}
```

- `marca`: `nome` (40 px, nunca menos de 34) e `area` (28 px, nunca menos de 24) vão no cartão de apresentação, no canto de cima à esquerda da moldura da pessoa (na folga acima da cabeça, até 460 px de largura), de 0,2 s até antes do primeiro bloco que não seja a abertura (no máximo 3,6 s). `nome` vazio = sem cartão.
- `fachada`: o letreiro do toldo. `nome` = o nome do negócio (ou do tema), até ~22 caracteres (Fraunces itálica, 62 px, reduz até 36); `em` = a palavra em que ele é dito (a placa desce do toldo e o nome se pinta). Sem `em`, desce no começo. Sem `nome`, o toldo fica só com as listras.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão. (A `zona` não é usada: a pessoa fica sempre na moldura de baixo.)
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Para uma foto própria já recortada (PNG transparente em `public/img/`), acrescente à mão: `"chocolate": { "arquivo": "img/chocolate.png", "largura": 555, "altura": 720, "transparente": true, "palavra": "chocolate" }`.

## 2. A gramática: a fachada

A tela é sempre a fachada de uma loja: o **toldo** listrado no alto (y 0 a ~230, decorativo, com o letreiro no meio), a **vitrine** (moldura de madeira x 64 a 1016, y 262 a 952; área útil do vidro x 108 a 972, y 304 a 912), o **balcão** de madeira (y 952 a 1008) e a **pessoa** embaixo, numa moldura larga de madeira. A pessoa nunca muda de lugar; o que muda é o que está no vidro.

O template já faz sozinho:

- **Abertura → vitrine**: uma `vitrine` **sem `titulo`** que começa colada no fim de uma `abertura` (±0,35 s) herda o título dela: as letras grandes somem e o título reaparece pequeno no alto do vidro, como o letreiro da vitrine (nunca os dois ao mesmo tempo).
- **Vitrine → combo**: um `combo` colado no fim de uma `vitrine` (±0,35 s) continua a mesma cena: os produtos se juntam, as etiquetas do nome saem, a fita kraft amarra os produtos e a etiqueta do combo desce por um barbante e fica deitada na frente da prateleira, abaixo deles (os produtos continuam à vista).
- **Troca de bloco**: o bloco que sai sobe 24 px e some em 0,16 s; o mapa sobe por cima como um cartão. Nada de faixa, cortina ou flash.
- **Placas**: as plaquinhas (da `abertura` e do `horario` do mapa) descem de trás do toldo, balançam no gancho e voltam para trás dele 0,12 s depois do fim do momento.
- **Câmera da pessoa**: troca de escala (100% ↔ 106%) em corte seco só quando o trecho anterior durou mais de 1 s; soco de 4% quando o carimbo do combo bate e quando o pino cai. O rosto é seguido.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da Plus Jakarta Sans e diminui o corpo até caber, sem cortar.
- **Último momento**: o `cta` final (ou o que termina colado no fim) fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases (para encadear abertura → vitrine → combo, deixe-os colados).
- **Antes de um bloco que cresce no meio do vidro** (o `cta`, um `destaque`), termine o momento anterior logo depois da última palavra dele: a placa e o bloco que sai somem antes.

## 3. A assinatura: `vitrine`

```json
{
  "tipo": "vitrine", "de": 3.86, "ate": 8.42,
  "itens": [
    { "texto": "Chocolate", "em": 4.05, "imagem": { "id": "chocolate" } },
    { "texto": "Ninho com morango", "em": 5.00, "imagem": { "id": "ninho-morango" } },
    { "texto": "Maracujá", "em": 6.04, "imagem": { "id": "maracuja" } }
  ],
  "preco": { "texto": "R$ 12", "em": 7.03, "detalhe": "cada", "detalheEm": 7.74 }
}
```

- `titulo` (opcional): letras pintadas no alto do vidro (até ~50 caracteres; 60 px em 2 linhas, reduz até 36). Sem `titulo` logo depois de uma `abertura`, o título dela vira o letreiro.
- `itens`: 1 a 4 produtos ou serviços, cada um **posto na prateleira** no `em` da palavra que o nomeia.
  - `texto`: o nome (até ~22 caracteres), na etiqueta da beira da prateleira (34 px, 2 linhas, reduz até 22).
  - `imagem` (opcional): `{ "id": "…" }` de `plano.imagens`. PNG transparente fica em pé na prateleira (até 350 px de altura com 3 itens); foto comum vira um quadrinho de moldura creme.
  - `ilustracao` (opcional, sem foto): `pote`, `bolo`, `pao`, `cafe`, `hamburguer`, `pizza`, `sacola`, `camiseta`, `tesoura`, `haltere`, `pata`, `flor`, `presente`, `moeda`, `grafico`, `escudo`, `relogio`, `estrela`.
  - Sem `imagem` nem `ilustracao`: um cartão creme em pé com o nome grande (o serviço sem produto).
  - `preco` / `precoEm` (opcionais): o adesivo deste item, **só se o preço foi dito** ("R$ 12", "12 reais", "R$ 9,90"; até ~8 caracteres). Sem `precoEm`, bate 0,4 s depois do item.
- `preco` (opcional, no momento): um preço para todos ("a doze reais cada"). O adesivo é colado em cada item, um a cada 0,06 s a partir de `em` (o número dito); `detalhe` ("cada", "o kg", "a partir de"; até ~10 caracteres) aparece dentro do adesivo em `detalheEm`.
- Layout: 1 a 4 colunas iguais; o item mais recente tem a etiqueta com borda tomate até o próximo entrar.

## 4. Os efeitos próprios

### `combo`: a condição carimbada

```json
{ "tipo": "combo", "de": 8.45, "ate": 10.04, "texto": "Leva 3", "em": 8.49, "valor": "paga 30", "valorEm": 9.23 }
```

- `texto`: a condição (até ~24 caracteres; 72 px, 2 linhas), que se monta palavra por palavra na etiqueta kraft a partir de `em` ("Leva" … "3" entra em "três").
- `valor` (opcional): o carimbo (até ~14 caracteres, em caixa alta, 92 px, reduz até caber em 500 px) que bate em `valorEm`. **Só números ditos.**
- Colado depois de uma `vitrine`: os produtos se juntam e a fita os amarra; a etiqueta fica deitada na frente da prateleira (condição à esquerda, carimbo à direita, até 820 px). Sozinho: a fita atravessa o vidro e a etiqueta fica de pé no meio (condição em cima, carimbo embaixo).
- Em outros assuntos, é a regra ou o aviso que se carimba: "Sem promessa de lucro", "Grátis", "Só hoje", "2ª unidade" + "pela metade".

### `mapa`: onde e quando

```json
{ "tipo": "mapa", "de": 10.06, "ate": 13.72, "rua": "Rua das Flores", "em": 10.78, "numero": "120", "numeroEm": 11.83,
  "horario": { "rotulo": "Aberto", "rotuloEm": 12.76, "texto": "até 20h", "em": 13.35 } }
```

- O cartão de mapa **ilustrado** (quadras com casinhas, praça, árvores; nunca print de aplicativo) sobe na vitrine em `de` e as ruas se desenham.
- `rua` (até ~30 caracteres) + `em`: a rua principal ganha o tracejado tomate e a etiqueta de baixo escreve o endereço palavra por palavra.
- `numero` + `numeroEm` (opcionais): o pino (com um toldinho listrado dentro) cai na rua, dois anéis se abrem, a lojinha ganha o toldo e o número completa o endereço ("Rua das Flores, 120"). A câmera do mapa aproxima até o pino.
- `referencia` / `referenciaEm` (opcionais): uma linha pequena embaixo do endereço ("perto da praça"), se foi dita.
- `horario` (opcional): a placa pendurada no toldo, no canto de cima à direita do vidro. `rotulo` (até ~12 caracteres, caixa alta, mostarda) em `rotuloEm`; `texto` (até ~14 caracteres, 58 px) em `em` (a hora dita: "até as oito" → "até 20h").

### A placa (dentro da `abertura` e do `mapa`)

`{ "texto": "Toda quinta", "em": 1.60, "rotulo": "Hoje", "rotuloEm": 1.2 }` → a plaquinha café com borda creme, presa por dois fios: desce de trás do toldo em `min(em, rotuloEm)`, balança e assenta. Na `abertura`, fica no canto de cima à esquerda do vidro; no `mapa`, à direita.

## 5. Os blocos universais

Os campos são os mesmos em todos os modelos do pack. Aqui eles acontecem dentro do vidro.

- `abertura` `{ texto, destaque?, em?, placa?, cena? }`: até ~40 caracteres (100 px, até 3 linhas, reduz até 56). Se `em` ≤ 0,2 s, a primeira palavra já está no primeiro quadro. `cena: { "expositor": "bolo", "itens": ["pote", "cafe", "pote"], "placa": "Aberto" }` desenha o interior ilustrado da loja atrás das letras (azulejos, prateleira com até 4 ilustrações, o expositor com cúpula de vidro, a plaquinha da parede balançando) e as letras sobem para o alto do vidro (92 px, 2 linhas). Use no gancho: o primeiro quadro já tem conteúdo. A `placa` da cena é decoração da loja ("Aberto", "Bem-vindo"); nunca ponha nela número ou preço não dito.
- `topicos` / `passos` `{ titulo?, itens: [{ texto, em, detalhe? }] }`: 2 a 5 itens, até ~40 caracteres cada (60 px, 2 linhas). `titulo` até ~50 caracteres.
- `numero` `{ valor, em, rotulo, rotuloEm?, prefixo?, sufixo?, casas?, ilustrativo? }`: conta em 0,9 s dentro de um adesivo de 420 px; formato pt-BR (`"prefixo": "R$"`, `"sufixo": " mil"`). `rotulo` até ~50 caracteres numa etiqueta de prateleira.
- `comparacao` `{ titulo?, modo?, lados: [{ rotulo, texto, em, imagem? }, …], vencedor?, vencedorEm? }`: duas folhas da vitrine; `rotulo` até ~14 caracteres, `texto` até ~40 (80 px, 4 linhas).
- `grafico` `{ titulo?, forma, dados?, tendencia?, tendenciaEm?, unidade?, ilustrativo? }`: 2 a 6 dados ditos (`barras` = potes que enchem; `linha`; `pizza` = torta); sem dados, a curva da tendência com "ILUSTRATIVO". `unidade`: "R$", "US$", "%", " kg"…
- `destaque` `{ texto, em, nivel?, detalhe?, detalheEm? }`: o carimbo, até ~40 caracteres (até 3 linhas em caixa alta).
- `definicao` `{ termo, em, significado, significadoEm }`: termo até ~24 caracteres; significado até ~120.
- `frase` `{ texto, destaque?, risco?, riscoEm?, em? }`: até ~110 caracteres (84 px, 4 linhas).
- `pergunta` `{ texto, opcoes?, em? }`: até ~70 caracteres; com 2 a 4 `opcoes` `{ texto, em }`, etiquetas na prateleira.
- `cta` `{ texto, icone?, destaque?, em?, pedido? }`: até ~40 caracteres (96 px, 3 linhas). `icone`: `comentar` (padrão, botão de enviar), `salvar`, `seguir`, `link`. `pedido: true` mostra os produtos da última vitrine pequenos dentro do balão.

## 6. Regras de tempo

- Cada `em` é o início de uma palavra dita (±0,15 s). O `node ferramentas/timing.mjs` confere: letreiro, produtos, preço e detalhe, combo e carimbo, rua, número, horário e o primeiro item de cada bloco.
- Nada fica parado mais de ~2,5 s sem algo novo: numa fala longa sobre um item, use o `preco`/`detalhe` ou divida em dois momentos.
- O fechamento fica legível por pelo menos 1,2 s.
- O primeiro momento começa em 0.

## 7. Legenda, correções e sons

- **Legenda**: some em todos os blocos (a vitrine mostra a fala). Use `legenda: true` num momento para mantê-la. Ela fica numa pílula creme abaixo do queixo, até 4 palavras, a palavra dita em tomate, nunca juntando duas frases.
- **`correcoes`**: troca de palavras na legenda (`{ "zap": "mensagem" }`). Para preços e números, corrija `palavras` direto (passo 4b), porque o timing gate lê de lá.
- **Sons** (tonais, baixos): nota de madeira por produto posto (subindo de nota), "tic" no adesivo de preço, duas notas na fita do combo, batida grave no carimbo e no `destaque`, duas notas descendo no pino, dois toques de madeira na placa, o balão que abre no `cta`, um acorde suave no letreiro.

## 8. O exemplo completo (confeitaria, 15,95 s)

Fala: "Aqui na confeitaria, toda quinta é dia de bolo de pote. Tem chocolate, ninho com morango e maracujá, a doze reais cada. Leva três e paga trinta. A gente fica na Rua das Flores, 120, aberto até as oito. Encomenda pelo WhatsApp do perfil."

```json
"marca": { "nome": "Bruno Siqueira", "area": "Confeiteiro" },
"fachada": { "nome": "Confeitaria", "em": 0.66 },
"momentos": [
  { "tipo": "abertura", "de": 0, "ate": 1.52, "texto": "Aqui na confeitaria", "destaque": "confeitaria", "em": 0.30,
    "cena": { "expositor": "bolo", "itens": ["pote", "cafe", "pote"], "placa": "Aberto" } },
  { "tipo": "abertura", "de": 1.52, "ate": 3.86, "texto": "Toda quinta é dia de bolo de pote", "destaque": "bolo de pote", "em": 1.60 },
  { "tipo": "vitrine", "de": 3.86, "ate": 8.42, "itens": [
      { "texto": "Chocolate", "em": 4.05, "imagem": { "id": "chocolate" } },
      { "texto": "Ninho com morango", "em": 5.00, "imagem": { "id": "ninho-morango" } },
      { "texto": "Maracujá", "em": 6.04, "imagem": { "id": "maracuja" } } ],
    "preco": { "texto": "R$ 12", "em": 7.03, "detalhe": "cada", "detalheEm": 7.74 } },
  { "tipo": "combo", "de": 8.45, "ate": 10.04, "texto": "Leva 3", "em": 8.49, "valor": "paga 30", "valorEm": 9.23 },
  { "tipo": "mapa", "de": 10.06, "ate": 13.72, "rua": "Rua das Flores", "em": 10.78, "numero": "120", "numeroEm": 11.83,
    "horario": { "rotulo": "Aberto", "rotuloEm": 12.76, "texto": "até 20h", "em": 13.35 } },
  { "tipo": "cta", "de": 13.84, "ate": 15.95, "texto": "Encomenda pelo perfil", "destaque": "Encomenda", "em": 13.90, "icone": "comentar", "pedido": true }
]
```

"Pelo WhatsApp do perfil" virou "Encomenda pelo perfil" no balão genérico: nenhuma marca real na tela.
