# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e corrige `palavras` quando a transcrição errou uma letra ou um número (SKILL.md, passo 4b).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: painel em cima, pessoa embaixo
3. A assinatura: `quiz`
4. Os efeitos próprios: `fato` e `revelacao`
5. Os blocos universais
6. Regras de tempo
7. Legenda, correções e sons
8. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Prof. Rafael Nunes", "area": "Ciências" },
  "sfx": true,
  "correcoes": {},
  "semLegenda": []
}
```

- `marca`: `nome` (44 px, nunca menos de 34) e `area` (30 px, nunca menos de 24) vão na tarja de apresentador, logo acima da moldura (20 px de folga), à esquerda, de 0,2 s a ~3,4 s; ela sai antes, sozinha, se as alternativas de um quiz ou um bloco que enche o painel entrarem antes disso. `nome` vazio = sem tarja. A inicial do nome (sem "Prof.", "Dr.") vai no círculo cobalto.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão. (A `zona` não é usada: a pessoa fica sempre na moldura de baixo.)
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Para uma imagem própria já recortada (PNG transparente em `public/img/`), acrescente à mão: `"figado": { "arquivo": "img/figado.png", "largura": 640, "altura": 447, "transparente": true, "palavra": "fígado" }`.

## 2. A gramática

A tela é **sempre dividida**: o **painel** em cima (x 64 a 1016, y 132 a 966) e a **pessoa** embaixo, numa moldura larga de cantos arredondados (a partir de y 1000). A pessoa nunca muda de lugar; o que muda é o painel.

O template já faz sozinho:

- **O quiz e o fato se emendam**: um `fato` com `de` igual ao `ate` do `quiz` (±0,25 s) continua o painel: ~0,26 s antes do `fato.de` (e nunca antes de 0,25 s de revelação) as erradas somem, a pergunta sai e a certa voa em 0,34 s até o alto, virando a faixa verde da resposta; só depois que ela assenta o cartão do fato aparece embaixo, já no lugar (a frase começa no meio do cartão e sobe quando o dado bate). O timing gate confere esse instante contra a primeira palavra do fato.
- **Troca de bloco**: o bloco que sai encolhe 3% e some em 0,2 s enquanto o próximo entra. Nada de faixa, flash ou cortina.
- **Câmera da pessoa**: troca de escala (100% ↔ 106%) em corte seco só quando o trecho anterior durou mais de 1 s; soco de 5% na revelação do `quiz` e na virada da `revelacao`. O rosto é seguido.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da Sora e diminui o corpo até caber, sem cortar.
- **Último momento**: o `cta` final (ou o que termina colado no fim) fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases.
- **O `fato` logo depois do `quiz`**: `fato.de` = `quiz.ate`, entre a palavra da resposta e a frase do fato.

## 3. A assinatura: `quiz`

```json
{
  "tipo": "quiz", "de": 1.55, "ate": 12.72,
  "texto": "Qual é o maior órgão do corpo humano?", "em": 1.58,
  "opcoes": [
    { "texto": "Fígado", "em": 3.82, "textoEm": 4.13, "imagem": { "id": "figado" } },
    { "texto": "Cérebro", "em": 4.95, "textoEm": 5.40, "imagem": { "id": "cerebro" } },
    { "texto": "Pele", "em": 6.23, "textoEm": 6.73, "imagem": { "id": "pele" } },
    { "texto": "Intestino", "em": 7.33, "textoEm": 7.80, "imagem": { "id": "intestino" } }
  ],
  "contagem": [ { "numero": 3, "em": 8.76 }, { "numero": 2, "em": 9.85 }, { "numero": 1, "em": 11.09 } ],
  "certa": 2, "revelaEm": 12.22
}
```

- `texto`: a pergunta (até ~70 caracteres; 64 px em até 3 linhas, reduz até 40). Monta palavra por palavra a partir de `em` (a primeira palavra dita da pergunta). Pode resumir com as palavras da fala.
- `rotulo` (opcional): etiqueta acima da pergunta ("PERGUNTA 2"), **só se for dita**.
- `opcoes`: 2 a 4 alternativas.
  - `em`: o cartão entra com o selo de letra (e a letra grande e clara no meio). Use o `em` da **letra falada** ("A,"). Sem letra falada, use o `em` do nome e não ponha `textoEm`.
  - `textoEm`: o nome e a imagem entram (a palavra da alternativa: "fígado").
  - `texto`: o nome (até ~22 caracteres com imagem, ~34 sem; quebra em 2–3 linhas).
  - `imagem` (opcional): `{ "id": "…" }` de `plano.imagens`. PNG transparente fica inteiro; foto preenche o espaço dela com cantos arredondados. Sem imagem, o nome fica grande no meio do cartão.
  - `letra` (opcional): troca a letra do selo (padrão A, B, C, D).
- `modo: "vf"`: verdadeiro ou falso (2 alternativas; selos ✓ e ✗ no lugar das letras).
- `contagem` (opcional): os números ditos, cada um no `em` dele (de 1 a 5 números, normalmente 3, 2, 1). O anel aparece no primeiro, o arco esvazia até `revelaEm`.
- `relogioEm` (opcional, sem números falados): o anel aparece com uma ampulheta nesse instante e esvazia até `revelaEm`. Use no silêncio de suspense ou em "valendo".
- `certa`: índice da alternativa certa (0 = A). **É a que a pessoa disse.**
- `revelaEm`: a palavra que revela ("pele!"). A certa acende em verde, as outras apagam.

Layout pelo número de alternativas: **4** = grade 2×2 com o anel no meio (o conteúdo de cada cartão se afasta do centro); **3** = grade 2×2 com o anel na quarta casa; **2** (ou `vf`) = dois cartões altos lado a lado, anel entre eles.

## 4. Os efeitos próprios

### `fato`: o porquê da resposta

```json
{ "tipo": "fato", "de": 12.72, "ate": 15.15, "texto": "Ela cobre quase 2 m²", "em": 12.74, "destaque": "2 m²", "destaqueEm": 13.62 }
```

- `texto`: a frase do fato (até ~80 caracteres; 64 px em até 3 linhas). Monta palavra por palavra a partir de `em`. Se o `destaque` estiver dentro do texto, ele sai da frase e aparece grande embaixo.
- `destaque` (opcional): o dado curto (até ~10 caracteres: "2 m²", "80%", "1969", "8 copos"), em cobalto, 200 px, dentro de uma moldura de medida que se abre em `destaqueEm` (a primeira palavra do dado dito). **Só números ditos.**
- `detalhe` / `detalheEm` (opcional): uma linha pequena embaixo.
- `imagem` (opcional): uma imagem acima do texto.
- `titulo` (opcional, só sem quiz antes): etiqueta do alto ("VOCÊ SABIA?").
- Logo depois de um `quiz` (`de` = `ate` do quiz), a faixa verde da resposta fica no alto do painel (y 140 a 316) e o cartão do fato embaixo dela.

### `revelacao`: o cartão-mistério

```json
{ "tipo": "revelacao", "de": 0, "ate": 2.85, "texto": "O Bitcoin rompeu…", "em": 0.03, "resposta": "US$ 83 mil", "revelaEm": 1.34 }
```

- `texto` (opcional): a provocação no alto (até ~60 caracteres).
- `resposta`: o que aparece quando o cartão vira (até ~24 caracteres; 150 px, reduz até 56).
- `revelaEm`: a palavra da resposta. O cartão cobalto com "?" encolhe na horizontal e abre branco com a resposta.
- `contagem` / `relogioEm` (opcionais): o anel no canto do cartão, como no quiz.
- `detalhe` / `detalheEm`, `imagem` (opcionais).

## 5. Os blocos universais

Os campos são os mesmos em todos os modelos do pack. Aqui eles acontecem no painel.

- `abertura` `{ texto, destaque?, em? }`: até ~40 caracteres (108 px, até 3 linhas). Se `em` ≤ 0,2 s, a primeira palavra já está no primeiro quadro.
- `topicos` / `passos` `{ titulo?, itens: [{ texto, em, detalhe? }] }`: 2 a 5 itens, até ~40 caracteres cada (52 px, 2 linhas). `titulo` até ~50 caracteres.
- `numero` `{ valor, em, rotulo, rotuloEm?, prefixo?, sufixo?, casas?, ilustrativo? }`: conta em 0,9 s a partir de `em`; formato pt-BR. `rotulo` até ~50 caracteres numa pílula cobalto.
- `comparacao` `{ titulo?, modo?, lados: [{ rotulo, texto, em, imagem? }, …], vencedor?, vencedorEm? }`: dois cartões como alternativas; `rotulo` numa etiqueta (até ~14 caracteres), `texto` até ~30. O `vencedor` acende em verde em `vencedorEm`. `errado-certo`: o lado 0 ganha o selo ✗ e o lado 1 o ✓.
- `grafico` `{ titulo?, forma, dados?, tendencia?, tendenciaEm?, unidade?, ilustrativo? }`: 2 a 6 dados ditos; sem dados, a curva da tendência com "ilustrativo".
- `destaque` `{ texto, em, nivel?, detalhe?, detalheEm? }`: até ~50 caracteres (120 px, 3 linhas).
- `definicao` `{ termo, em, significado, significadoEm }`: termo até ~24 caracteres; significado até ~120.
- `frase` `{ texto, destaque?, risco?, riscoEm?, em? }`: até ~110 caracteres (84 px, 4 linhas).
- `pergunta` `{ texto, opcoes?, em? }`: com 2 a 4 `opcoes` `{ texto, em, imagem? }`, o painel do quiz sem anel nem revelação; sem opções, a pergunta grande com o "?" no anel tracejado.
- `cta` `{ texto, icone?, destaque?, em? }`: até ~50 caracteres (96 px, 3 linhas). `icone`: `comentar` (padrão), `salvar`, `seguir`, `link`. Depois de um `quiz`, a fileira das alternativas aparece embaixo, com a certa em verde (convite para comentar se acertou).

## 6. Regras de tempo

- Cada `em` é o início de uma palavra dita (±0,15 s). O `node ferramentas/timing.mjs` confere: letra, nome, contagem, revelação, dado do fato e o primeiro item de cada bloco.
- Nada fica parado mais de ~2,5 s: numa pergunta longa sem alternativas, use `relogioEm`; num fato longo, `detalhe`.
- A revelação precisa de ~0,4 s antes do `fato` começar (a certa acesa na grade). Se a fala emenda a resposta e o fato, ponha `quiz.ate` (= `fato.de`) na primeira palavra do fato.
- O fechamento fica legível por pelo menos 1,2 s.
- O primeiro momento começa em 0.

## 7. Legenda, correções e sons

- **Legenda**: some em todos os blocos (o painel mostra a fala). Use `legenda: true` num momento para mantê-la (ex.: um `numero` com uma fala longa embaixo). Ela fica numa pílula branca abaixo do queixo, até 4 palavras, a palavra dita em cobalto, nunca juntando duas frases.
- **`correcoes`**: troca de palavras na legenda (`{ "é fryer": "Airfryer" }`). Para letras e números das alternativas, corrija `palavras` direto (passo 4b), porque o timing gate lê de lá.
- **Sons** (tonais, baixos): marimba nas alternativas, itens e dados (subindo de nota), "toc" na contagem, duas notas na revelação e no vencedor da comparação, um "pop" grave no fato, abertura, número, destaque, definição e fechamento, um sopro tonal na virada da `revelacao`.

## 8. O exemplo completo (o maior órgão do corpo, 16,6 s)

Fala: "Pouca gente acerta essa. Qual é o maior órgão do corpo humano? A, fígado. B, cérebro. C, pele. D, intestino. Três… dois… um… É a pele! Ela cobre quase dois metros quadrados. Comenta se você acertou."

```json
"marca": { "nome": "Prof. Rafael Nunes", "area": "Ciências" },
"momentos": [
  { "tipo": "abertura", "de": 0, "ate": 1.55, "em": 0.08, "texto": "Pouca gente acerta essa", "destaque": "acerta" },
  { "tipo": "quiz", "de": 1.55, "ate": 12.72, "em": 1.58, "texto": "Qual é o maior órgão do corpo humano?",
    "opcoes": [
      { "texto": "Fígado", "em": 3.82, "textoEm": 4.13, "imagem": { "id": "figado" } },
      { "texto": "Cérebro", "em": 4.95, "textoEm": 5.40, "imagem": { "id": "cerebro" } },
      { "texto": "Pele", "em": 6.23, "textoEm": 6.73, "imagem": { "id": "pele" } },
      { "texto": "Intestino", "em": 7.33, "textoEm": 7.80, "imagem": { "id": "intestino" } }
    ],
    "contagem": [ { "numero": 3, "em": 8.76 }, { "numero": 2, "em": 9.85 }, { "numero": 1, "em": 11.09 } ],
    "certa": 2, "revelaEm": 12.22 },
  { "tipo": "fato", "de": 12.72, "ate": 15.15, "em": 12.74, "texto": "Ela cobre quase 2 m²", "destaque": "2 m²", "destaqueEm": 13.62 },
  { "tipo": "cta", "de": 15.15, "ate": 16.64, "em": 15.21, "texto": "Comenta se você acertou", "icone": "comentar" }
]
```

`duracao` = 16,64 s: a última palavra ("acertou") termina em 16,34 s, e o vídeo acaba 0,3 s depois.

O mesmo estilo num vídeo de cripto (só o plano, sem render): `revelacao` no "rompeu os 83 mil", `definicao` de bull market, `quiz` verdadeiro ou falso ("Mercado subindo = dinheiro no bolso?") com `relogioEm` e `fato` ("Não para a maioria das pessoas", destaque "maioria"), `pergunta` com 3 opções (os erros de quem perde na alta), `passos`, `frase` com risco, `comparacao` errado-certo e `cta` com `link`.
