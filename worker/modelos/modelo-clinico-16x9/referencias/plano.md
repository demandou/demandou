# O plano de edição (`src/plano.json`)

Esta é a versão **deitada** do modelo (16:9, 1920×1080, o vídeo completo do YouTube). Os campos do plano são os mesmos do Clínico vertical; muda só onde as coisas ficam no quadro: pela aula 9 do curso, a tela cheia é a base, a lupa (a pessoa) fica na moldura da direita e o exame no quadro da esquerda.

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `lupa`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A lupa: onde a pessoa fica
3. Os 11 blocos universais (servem para qualquer assunto)
4. Os blocos próprios do Clínico (a assinatura e os outros)
5. Biblioteca de desenhos (para o `anatomia`)
6. Regras de tempo
7. Limites de texto
8. Legenda e correções
9. Exemplos: o demo (saúde bucal) e um vídeo de cripto

## 1. Campos gerais

```json
{
  "marca": { "nome": "Dr. Tiago Moura", "area": "Cirurgião-dentista" },
  "sfx": true,
  "correcoes": { "jengiva": "gengiva" }
}
```

- `marca`: aparece só no fechamento (`cta`), ao lado do botão, como a identificação de um prontuário (nome em cima, área em azul embaixo). `nome` vazio = sem assinatura.
- `sfx`: `false` desliga os sons (uma nota grave quando a lupa chega a um lugar novo, duas notas descendo no ✗, duas subindo no ✓, um acorde no fechamento).
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs` (no 16:9, `largura` 1920, `altura` 1080, `videoAltura` 1080, `rosto.quadro` com o tamanho do quadro e a `zona` começando 60 px abaixo do queixo). Não mexa à mão.
- `lupa` (opcional, raro): `{ "zoom": 1.9, "ancoraY": 0.5 }`. Sem `zoom`, o template calcula pelo tamanho do rosto que o `cortar.mjs` mediu (o rosto ocupa uns 43% do círculo; no 16:9 o rosto gravado é estreito, ~13% da largura, e o zoom fica perto de 1,9; numa gravação muito perto da câmera, o mínimo possível). Use só se a cabeça sair cortada ou pequena demais: `zoom` maior = rosto maior (mínimo 1); `ancoraY` = altura do rosto no círculo (0 = topo, 1 = base).

## 2. A lupa: onde a pessoa fica

A pessoa é uma **lupa**: um círculo com aro azul que muda de tamanho e de lugar conforme o momento, com o conteúdo ao lado. No quadro deitado (aula 9), a lupa fica **sempre na moldura da direita** (centro perto de 74% da largura), com o rosto centralizado nela, e o exame ocupa o **quadro da esquerda**; o que muda de um lugar para o outro é o tamanho e a altura da lupa e como o quadro se organiza. Cada bloco tem um lugar padrão; os que aceitam outro lugar recebem `"layout"`.

| `layout` | A pessoa | O resto da tela | Blocos que usam por padrão |
|---|---|---|---|
| `cheio` | tela cheia, como foi gravada; abaixo do queixo a base do quadro vira uma faixa de névoa branca (y ~640 a ~980) | o texto entra na faixa, sem cartão, em fileiras e colunas | `abertura`, `titulo`, `destaque`, `frase`, `pergunta`, `cta`, `checklist` |
| `topo` | lupa grande (620 px) à direita, no meio da altura | título centralizado no alto do quadro da esquerda (~930 × 200 px); corpo embaixo dele (~930 × 560 px) | `comparacao`, `definicao`, `contagem`, `grafico` sem título |
| `centro` | lupa (420 px) à direita, cercada pelo mostrador | título ou número no quadro da esquerda (~950 × 380 px), na altura do mostrador; veredito embaixo | `numero`, `cronometro` (sempre) |
| `canto` | lupa pequena (364 px) no alto, à direita | título embaixo da lupa, na coluna da direita (~500 × 340 px); corpo grande no quadro inteiro da esquerda (~1200 × 780 px) | `topicos`, `grafico`, `anatomia` |
| `lado` | lupa média (500 px) à direita, mais alta | título alinhado à esquerda no alto do quadro (~1020 × 180 px, com o anel do número ao lado); corpo embaixo (~1040 × 590 px) | `passos` |

- Os blocos de tela cheia (`abertura`, `titulo`, `destaque`, `frase`, `pergunta`, `cta`) ficam sempre em `cheio`. `numero` e `cronometro` ficam sempre no `centro`. Os outros aceitam `topo`, `canto` ou `lado` (`checklist` aceita também `cheio`).
- Entre dois momentos com respiro de mais de 0,3 s, a pessoa volta para a tela cheia (com a legenda). Momentos colados passam direto: a lupa viaja de um lugar para o outro em ~0,6 s, começando no corte mais próximo. No vídeo completo a tela cheia é a base: abra a lupa só onde o bloco ajuda a entender e deixe a pessoa falar com a legenda entre um bloco e outro.
- **A troca cruza, nunca deixa a tela vazia** (o template faz sozinho):
  - da tela cheia para a lupa, o quadro primeiro fecha num círculo grande em volta do rosto (a página nova já aparece em volta, com os lugares dos itens "a lápis") e então encolhe até a moldura da direita;
  - de uma lupa para outra, o conteúdo antigo termina de sair quando ela começa a viajar e o novo já começa a entrar por baixo dela;
  - de volta para a tela cheia, o círculo cresce por cima do conteúdo antigo, abre para o retângulo e o texto novo entra na névoa.
- Use a lupa em **pelo menos três lugares diferentes** (tamanhos e alturas) ao longo do vídeo e nunca o mesmo lugar três vezes seguidas. Tela cheia no começo e no fim dá o contraste (rosto grande → exame na lupa → rosto grande).
- Não deixe um trecho de tela cheia com menos de ~1,8 s entre dois momentos de lupa (a pessoa cresceria e encolheria seguido): junte com o vizinho ou troque o bloco.

## 3. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate` e `legenda?` (`true` = a legenda continua durante o momento). Todo campo `em`/`…Em` é o instante de uma palavra dita. Os campos são os mesmos em todos os modelos do pack; aqui eles ganham a linguagem do Clínico.

Em todo texto que se monta, cada palavra entra **no instante em que é dita** (o template acha a palavra em `palavras`; palavra reescrita entra logo depois da anterior). Escreva com as palavras da fala, na ordem em que são faladas. Antes de ser dita, a palavra aparece como um traço cinza "a lápis" (dá para ver o lugar, não dá para ler).

### `abertura` (tela cheia)

```json
{ "tipo": "abertura", "de": 0, "ate": 2.69, "texto": "3 dicas para fazer mais gol na pelada", "destaque": "mais gol", "em": 0.29 }
```

O título sobe palavra por palavra na faixa de névoa, abaixo do queixo, grande, alinhado à esquerda, em até 3 linhas largas. `destaque` = trecho exato em azul. `em` (opcional) = quando o texto começa a ser dito (padrão: `de`). `rotulo` (opcional, do Clínico) = tema em 1–3 palavras, com um anel azul na frente. Até ~60 caracteres.

### `topicos`: lista sem ordem (padrão: `canto`)

```json
{ "tipo": "topicos", "de": 3.0, "ate": 7.5, "titulo": "Por que tem gente que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 3.5, "marca": "errado" },
             { "texto": "Escolhe sem critério", "em": 4.4, "detalhe": "só pelo nome" },
             { "texto": "Risco que não entende", "em": 5.3 } ] }
```

Linhas de atlas: uma haste azul desce pela margem; cada item ganha um ponto na haste e uma linha-guia com cotovelo até o nome, no seu `em`. 2 a 5 itens, de 2 a 6 palavras cada (até 2 linhas). `detalhe` (opcional) entra menor, em cinza. `marca` (opcional, do Clínico): `"errado"` (✗ vermelho, ponto e linha vermelhos) ou `"certo"` (✓ azul). `titulo` (opcional) vai embaixo da lupa pequena, na coluna da direita; **sem título**, o cabeçalho vira um contador do exame ("2/3", com o anel enchendo). `numero` (opcional): "01", "02"… num anel acima do título (ao lado dele, quando o cabeçalho é largo e baixo).

### `passos`: lista em ordem (padrão: `lado`)

```json
{ "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita: como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

A conduta: anéis numerados ligados por um traço que avança de um passo ao outro; o passo atual fica cheio de azul. Mesmos campos e limites de `topicos` (2 a 5 itens, `detalhe`, `marca`, `numero`, `titulo` opcional com o contador no lugar). Um ":" no meio do título quebra a linha ali.

### `numero` (sempre `centro`)

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
```

O instrumento lê o valor: a lupa vai para o centro, o mostrador se monta em volta e o anel enche enquanto o número conta (de 0 até `valor`, a partir de `em`, com freio no fim). Porcentagem (`"sufixo": "%"`) enche o anel até o valor; o resto dá a volta inteira. O mostrador fica na moldura da direita; o número grande fica no quadro da esquerda, na altura do mostrador, e o `rotulo` (até ~40 caracteres, até 2 linhas) entra logo embaixo dele, na palavra dele (`rotuloEm`). Formato pt-BR (83.000; 72,5). `casas` = casas decimais; `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "kg") ficam menores, ao lado. `ilustrativo: true` mostra a etiqueta "ilustrativo" (use só se o número não foi dito exatamente assim).

### `comparacao` (padrão: `topo`)

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 12.91, "titulo": "Mercado × seu bolso", "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo na alta", "em": 8.77 },
             { "rotulo": "Seu bolso", "texto": "Sem dinheiro para a maioria", "em": 10.91 } ],
  "vencedor": 0, "vencedorEm": 11.99 }
```

Duas colunas no quadro da esquerda, ao lado da lupa grande, cada uma com seu selo (anel vazado), rótulo em caixa alta e texto (até ~45 caracteres, até 4 linhas). Cada lado entra na palavra dele (antes disso, o texto aparece a lápis). No `vencedorEm`, quem ganha leva ✓ azul e um sublinhado; o outro leva ✗ vermelho e o texto apaga um pouco. `modo`: `"contra"` (um "×" no meio), `"antes-depois"` (uma seta) ou `"errado-certo"` (sem `vencedor`: o primeiro lado já entra com ✗ e o segundo com ✓). Sem `titulo`, as colunas ocupam também o lugar do título (letra maior).

### `grafico` (padrão: `canto`; sem título, `topo`)

```json
{ "tipo": "grafico", "de": 2.89, "ate": 5.25, "titulo": "Reacendeu a conversa", "forma": "linha",
  "tendencia": "sobe", "tendenciaEm": 2.99, "ilustrativo": true }
```

```json
{ "tipo": "grafico", "de": 11.5, "ate": 15.5, "titulo": "Preço do Bitcoin", "forma": "barras", "unidade": "mil",
  "dados": [ { "rotulo": "2021", "valor": 69, "em": 12.0 }, { "rotulo": "Hoje", "valor": 83, "em": 14.4 } ] }
```

Um traçado de exame: uma folha de papel milimetrado azul-claro, eixo cinza e o traço azul que se desenha na fala.
- `dados` (2 a 6 números **ditos**): `linha` = cada ponto entra no seu `em` com o valor como rótulo de atlas; `barras` = cada barra cresce na sua palavra, com o valor em cima e o rótulo embaixo; `pizza` = um anel que se divide parte a parte, com a legenda ao lado (valores que somam 100 viram %). `unidade` (opcional) vai depois do valor. Rótulos curtos (até ~10 caracteres por item).
- Sem números ditos: `tendencia` (`"sobe"`, `"cai"`, `"oscila"`) com `ilustrativo: true`: a curva se desenha a partir de `tendenciaEm` e uma lupa de detalhe fecha no ponto final. A etiqueta "ilustrativo" aparece sozinha.
- `titulo` (opcional) e `numero` (opcional) vão embaixo da lupa pequena (no `canto`) ou no alto do quadro (`topo`, `lado`). Sem título, o traçado ocupa o quadro inteiro da esquerda.

### `destaque` (tela cheia)

```json
{ "tipo": "destaque", "de": 12.91, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta",
  "detalhe": "mesmo na alta", "detalheEm": 15.32 }
```

O selo do exame entra primeiro (`"alerta"` = ✗ vermelho; `"chave"`, o padrão, = anel azul), a frase sobe palavra por palavra ao lado dele (grande, até ~40 caracteres) e um traço sublinha o fim (vermelho no alerta, azul na chave). `detalhe` (opcional, até ~40 caracteres) entra menor, em cinza, no `detalheEm`.

### `definicao` (padrão: `topo`)

```json
{ "tipo": "definicao", "de": 6.04, "ate": 9.87, "numero": "02", "termo": "Chuta cruzado", "em": 6.9,
  "significado": "No canto oposto de onde a bola veio", "significadoEm": 8.0 }
```

Um verbete de atlas: o termo entra grande, sublinhado por um traço azul; quando o significado é dito, um ponto acende no traço e uma linha-guia desce até o significado, em azul. Termo até ~20 caracteres; significado até ~60 (até 3 linhas). `numero` (opcional, do Clínico): o anel "01", "02"… ao lado do termo. No quadro deitado, o verbete inteiro fica centralizado no quadro da esquerda, em qualquer lugar da lupa.

### `frase` (tela cheia)

```json
{ "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68 }
```

A frase de efeito sobe palavra por palavra na faixa de névoa, com uma marca de anotação (anel com ponto e um traço) acima, em até 3 linhas largas. `destaque` = trecho em azul; `risco` = trecho riscado em vermelho, palavra por palavra, a partir de `riscoEm` (a palavra que nega ou corrige). `em` (opcional) = quando o texto começa. Até ~70 caracteres.

### `pergunta` (tela cheia)

```json
{ "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…",
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

Uma ficha de consulta: um anel azul com "?" se traça, a pergunta sobe palavra por palavra e as `opcoes` (2 a 4, até ~30 caracteres cada) são linhas da ficha, cada uma com o círculo de marcar que ganha o traço azul quando é dita. No quadro deitado, a pergunta fica na metade esquerda da faixa de névoa e as opções, uma embaixo da outra, na metade direita. Sem opções, a pergunta usa a faixa inteira e o anel do "?" gira devagar. `em` (opcional) = quando a pergunta começa a ser dita.

### `cta`: fechamento (tela cheia)

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

A chamada se monta na fala, à esquerda da faixa de névoa; o botão (150 px, com o ícone que se desenha) e a assinatura (`marca`) ficam numa fileira à direita (com dois botões e um nome longo, a assinatura desce para baixo dos botões). `icone`: `salvar`, `seguir`, `comentar` ou `link` (um botão em `em`). Para dois botões, use `botoes` (do Clínico): `[{ "em": 21.4, "icone": "salvar" }, { "em": 22.24, "icone": "enviar" }]` (o primeiro cheio, o segundo vazado; `enviar` também vale aqui). `assinaturaEm` (opcional): padrão, meio segundo depois do último botão. Até ~60 caracteres. Se for o último momento, fica até o fim do vídeo.

## 4. Os blocos próprios do Clínico

### `cronometro`: o mostrador (assinatura, sempre `centro`)

O anel em volta da pessoa (na moldura da direita) vira um instrumento que **mede qualquer coisa que tem uma meta**: tempo ("2:00", "30 min"), nível ("100%"), um evento ("Bola chega"), um objetivo em palavras ("No bolso", "Lucro"). Um mostrador com 60 marcas se monta em volta da lupa; o ponteiro corre a partir de `inicio`. Com `para`, ele desacelera e trava antes da meta (vermelho; ✗ na ponta) e, quando a meta é dita, o que faltou aparece tracejado. Sem `para`, dá a volta completa em azul e ganha ✓.

```json
{ "tipo": "cronometro", "de": 5.27, "ate": 8.29, "numero": "01", "titulo": "Escova por menos de 2 minutos",
  "enfase": "menos de 2 minutos", "meta": "2:00", "metaEm": 7.39, "inicio": 6.04, "para": { "em": 6.79, "fracao": 0.42 } }
```

```json
{ "tipo": "cronometro", "de": 8.67, "ate": 12.91, "titulo": "Mercado subindo", "enfase": "subindo", "meta": "No bolso", "metaEm": 11.99,
  "inicio": 8.77, "para": { "em": 9.87, "fracao": 0.45 }, "ilustrativo": true,
  "veredito": { "em": 10.19, "tipo": "errado", "texto": "Não significa dinheiro" } }
```

- `titulo`: até ~40 caracteres (duas linhas centralizadas no quadro da esquerda, na altura do mostrador). `enfase` = trecho em azul. `numero` (opcional): "01", "02"… num anel.
- `meta`: o que o mostrador mede, até ~10 caracteres. Acende em azul em `metaEm`.
- `inicio`: quando o ponteiro começa (a palavra da ação). `para.em`: quando trava (a palavra do problema: "menos", "não", "só"); `para.fracao`: onde trava (0,3 a 0,6). Nenhum número aparece no ponto onde parou.
- Sem `para`: `volta` = duração da volta completa em segundos (padrão 1,4; até ~2,5 para acompanhar uma frase).
- `ilustrativo: true` quando a meta é uma ideia e não uma medida dita: aparece a etiqueta "ilustrativo".
- `veredito` (opcional): `{ "em", "tipo": "errado" | "certo", "texto" }`: ✗ vermelho ou ✓ azul e uma frase curta (até ~24 caracteres) no quadro da esquerda, embaixo do título. Com veredito, o ✗ da ponta não aparece (fica só o do veredito). A etiqueta "ilustrativo" também fica no quadro da esquerda.

### `anatomia`: a prancha de atlas (assinatura, padrão `canto`)

Um desenho da biblioteca (seção 5) se traça a partir do instante em que a pessoa vai para a lupa; cada **ação** acontece no seu `em`, os **rótulos** de atlas aparecem apontando partes do desenho (ponto, linha-guia com cotovelo, nome) e o **veredito** fecha com ✓ ou ✗.

```json
{ "tipo": "anatomia", "de": 14.93, "ate": 24.21, "titulo": "Mesmo na alta, tem gente que perde", "enfase": "tem gente que perde",
  "desenho": "cerebro",
  "acoes": [ { "em": 18.45, "acao": "destaca", "alvo": "amigdala" }, { "em": 20.18, "acao": "destaca", "alvo": "frontal" },
             { "em": 21.75, "acao": "destaca", "alvo": "temporal" } ],
  "rotulos": [ { "em": 18.45, "alvo": "amigdala", "texto": "Impulso", "erro": true },
               { "em": 20.18, "alvo": "frontal", "texto": "Sem critério", "erro": true },
               { "em": 21.75, "alvo": "temporal", "texto": "Risco que não entende", "erro": true } ] }
```

```json
{ "tipo": "anatomia", "de": 9.87, "ate": 13.64, "numero": "03", "titulo": "Rasteiro", "desenho": "corpo",
  "acoes": [ { "em": 12.01, "acao": "acende", "alvo": "pe" } ],
  "rotulos": [ { "em": 11.79, "alvo": "pe", "texto": "Bola baixa" } ],
  "veredito": { "em": 12.62, "tipo": "certo", "texto": "Mais difícil de defender" } }
```

- `titulo`: no `canto`, até ~40 caracteres (até 3 linhas embaixo da lupa pequena, na coluna da direita); no `lado`, até ~30 (no alto do quadro, com o anel do número ao lado).
- `desenho`: `cerebro`, `corpo`, `coluna`, `dente` ou `dentes`. `desenhoEm` (opcional): quando o traço começa.
- `acoes`: cada uma com `em` = a palavra que diz a ação. As de `corpo` e `cerebro` levam `alvo`.
- `rotulos`: até 3 por momento, em alvos de lados diferentes. `texto` = palavras da fala, até ~22 caracteres (o template reduz até 36 px e quebra em duas linhas se precisar; o nome nunca entra na lupa da direita nem desce até o veredito); `erro: true` pinta de vermelho.
- `aproximar` (opcional): `{ "em", "alvo", "zoom": 2.2 }`: uma lupa de detalhe abre em cima do alvo e aumenta aquele ponto. Uma vez por vídeo, num ponto com detalhe para ver (a gengiva, o espaço entre os dentes). Um rótulo com o mesmo alvo sai da borda dela.
- `veredito` (opcional): como no `cronometro`, embaixo do desenho.

### `contagem`: círculos numerados (padrão: `topo`)

Para "erra em três coisas", "são quatro sinais", quando a fala conta antes de nomear. Os lugares dos círculos aparecem tracejados e cada círculo se fecha com seu número quando a contagem é dita.

```json
{ "tipo": "contagem", "de": 2.63, "ate": 5.27, "titulo": "Quase todo mundo erra em 3 coisas", "enfase": "3 coisas",
  "itens": [ { "em": 4.29 }, { "em": 4.43 }, { "em": 4.57 } ], "marca": { "em": 4.73, "tipo": "errado" } }
```

- `titulo`: até ~40 caracteres. `itens`: 2 a 5, `em` na palavra da contagem ("três") com 0,12–0,15 s entre eles, ou um por um se a fala nomeia cada um. `texto` (opcional, até ~12 caracteres) embaixo do círculo.
- `marca` (opcional): um selo pequeno (✗ ou ✓) em todos os círculos, em cascata.
- Quando a fala **nomeia** os itens, prefira `topicos`.

### `checklist`: a conduta (padrão: `cheio`)

O "o certo é…": cada linha entra quando é dita, com um ícone que se mexe e o selo no fim. Em `cheio`, fica na faixa de névoa com o título e um ✓ grande (o título numa coluna ao lado das linhas, ou numa fileira em cima delas, com as linhas em 1 a 3 colunas: vale a disposição com a letra maior); em `topo`, `canto` ou `lado`, o título vai para o cabeçalho da lupa.

```json
{ "tipo": "checklist", "de": 16.54, "ate": 21.36, "titulo": "O certo", "marcaEm": 16.93,
  "itens": [ { "em": 17.19, "texto": "2 minutos", "icone": "cronometro" },
             { "em": 18.46, "texto": "Movimento leve", "icone": "escova" },
             { "em": 19.66, "texto": "Fio dental todo dia", "icone": "fio", "semanaEm": 20.62 } ] }
```

- `titulo`: até ~16 caracteres em `cheio`. `marcaEm` (opcional): o ✓ grande ao lado do título.
- `itens`: 2 a 4, `texto` até ~22 caracteres (mais que isso quebra em duas linhas menores). `icone`: `cronometro`, `escova`, `fio`, `agua`, `sono` ou `check` (padrão, serve para qualquer assunto). `tipo`: `"certo"` (padrão, ✓ azul) ou `"errado"` (✗ vermelho). `semanaEm` (opcional): sete pontinhos da semana se preenchem ("todo dia").

### `titulo`: abertura em linhas escolhidas

Igual à `abertura`, mas com as linhas escritas à mão (`"linhas": ["Você escova", "os dentes do", "jeito certo?"]`, até 3, até ~14 caracteres cada), `enfase` e `duvidaEm` (o par ✓ / ✗ ao lado do texto: a pergunta de certo × errado que o vídeo vai responder). No quadro deitado a faixa é larga e baixa: quando as linhas à mão não ficam maiores, o texto se reorganiza sozinho em até 2 linhas largas. Use `abertura` quando não quiser escolher a quebra.

## 5. Biblioteca de desenhos (para o `anatomia`)

Todos a traço azul, com preenchimentos claros; o vermelho aparece só quando uma ação mostra o problema. Os alvos aceitam também os nomes do dia a dia entre parênteses.

| `desenho` | O que é | Ações | Alvos | Serve de metáfora para |
|---|---|---|---|---|
| `cerebro` | cérebro de lado: lobos, cerebelo, tronco e a amígdala por dentro | `destaca` + alvo (vermelho, pulsa), `alivia` + alvo (fica azul), `acende` + alvo (azul: ativo, o certo) | `frontal` (`decisao`, `razao`), `parietal` (`sentidos`), `occipital` (`visao`), `temporal` (`memoria`), `amigdala` (`emocao`, `impulso`, `medo`), `cerebelo` (`movimento`, `equilibrio`), `tronco` | decisão, critério, impulso, emoção, hábito, foco, aprendizado: finanças, vendas, relacionamento, estudo, esporte |
| `corpo` | corpo inteiro de frente (manequim de consultório) | `destaca` + alvo, `alivia` + alvo, `acende` + alvo | `cabeca`, `pescoco`, `ombro`, `peito` (`coracao`), `cotovelo` (`braco`), `estomago` (`barriga`), `punho` (`mao`), `lombar` (`costas`, `coluna`), `quadril`, `joelho` (`perna`), `tornozelo` (`pe`) | esforço, cansaço, onde algo pesa, a ação (mão = fazer, pé = chutar, caminhar), o que se sente no corpo |
| `coluna` | coluna vertebral de lado, com o prumo | `curva` (postura ruim, vermelho), `alinha` (volta; o prumo acende) | `cervical`, `toracica`, `lombar`, `disco` | postura, base, estrutura que entorta e se alinha |
| `dente` | molar em corte: esmalte, polpa, raízes, gengiva, osso | `escova`, `pressao`, `leve`, `inflama` | `gengiva`, `esmalte`, `coroa`, `polpa`, `raiz`, `osso` | o que aparece × a raiz do problema |
| `dentes` | quatro dentes da frente com a gengiva | `esquecido`, `varre`, `lacunas`, `fio` | `entre`, `gengiva`, `coroa` | o que fica nos espaços, o que a rotina não alcança |

Ações do `dente`: `escova` (a escova chega na linha da gengiva), `pressao` (empurra e esfrega forte, com setas de força), `leve` (desliza de leve), `inflama` (a gengiva fica vermelha e recua). Ações dos `dentes`: `esquecido` (o fio aparece tracejado e some), `varre` (a escova passa pela frente), `lacunas` (os espaços acendem em vermelho), `fio` (o fio desce entre os dentes).

Quando nenhum desenho faz sentido como metáfora, a assinatura entra pelo `cronometro` (o mostrador mede qualquer meta). Para um desenho novo, veja `estilo.md`.

## 6. Regras de tempo

- `de`: o `em` da primeira palavra que o momento cobre, menos 0,05 (nunca antes do `ate` do momento anterior).
- `ate`: o `em` da **primeira palavra que o momento não cobre**, ou o fim do vídeo. Momentos vizinhos encostam.
- Duração mínima: ~2 s (a lupa leva ~0,6 s para chegar). Trechos menores entram no momento vizinho.
- **Nada parado:** dentro de um momento, algo novo a cada 1,5–2,5 s (uma palavra do título, um item, uma ação, um rótulo, um selo, o ponteiro). Momento com mais de ~4 s precisa de itens entrando por dentro dele.
- Itens, ações, rótulos e selos: `em` = o `em` da palavra que fala deles. Nada aparece antes de ser dito (antes disso, só o lugar a lápis).
- Termine os rótulos e vereditos ~0,8 s antes do `ate` (eles levam ~0,45 s para se escrever e o conteúdo começa a sair ~0,3 s antes da lupa viajar).
- O `conferir.mjs` deste modelo (limites da aula 9 no `modelo.json`) reprova: menos de ~50% do vídeo com momento, trecho de mais de ~8 s só com legenda, menos de um momento a cada ~10 s, poucos tipos, momento parado mais de ~6 s, e a falta da assinatura (`anatomia` ou `cronometro`).

## 7. Limites de texto

Todo texto é medido com a fonte de verdade (Figtree) e diminui até um mínimo legível para caber, em até 2 a 4 linhas; nunca vaza nem é cortado. Passou muito dos limites acima, a letra fica pequena: encurte com as palavras da fala ("compra por impulso" → "Impulso"). Mínimos na tela: títulos de tela cheia 56 px, títulos da lupa 60 px, itens e opções 40 a 44 px, rótulos de atlas 34 px. Na faixa de névoa da tela cheia (baixa no quadro deitado), texto longo vira letra pequena mais depressa que no vertical: prefira frases curtas.

## 8. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez (até ~42 caracteres), numa pílula branca no terço de baixo do quadro (y ~890, acima dos controles do player), cada palavra acendendo quando é falada. Ela **some durante um momento**, porque o bloco já mostra o que é dito. Dois ajustes:

- `"legenda": true` no momento: a legenda continua durante ele (num `anatomia` ou `cronometro` com bem mais fala do que o título mostra). Num bloco de tela cheia, a faixa do texto encolhe para terminar acima da legenda.
- `semLegenda`: faixas extras sem legenda: `"semLegenda": [ { "de": 3.2, "ate": 6.0 } ]`.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "jengiva": "gengiva", "Rafa El": "Rafael" }`. A chave pode ter várias palavras seguidas e `""` apaga. Não edite `palavras` à mão. Para ver as linhas de legenda: `node scripts/legendas.mjs`.

## 9. Exemplos

### O demo (saúde bucal, 24,4 s)

Roteiro: "Você escova os dentes do jeito certo? Quase todo mundo erra em três coisas. Primeiro: escova por menos de dois minutos. Segundo: aperta demais, e isso machuca a gengiva. Terceiro: esquece o fio dental, e a escova não chega entre os dentes. O certo é dois minutos, movimento leve e fio dental todo dia. Salva esse vídeo e manda pra quem precisa ouvir isso."

Lugares da lupa: `cheio` → `topo` → `centro` → `canto` → `lado` → `cheio` → `cheio` (no quadro deitado: a lupa grande, a do mostrador, a pequena no alto e a média, sempre na moldura da direita).

```json
{
  "marca": { "nome": "Dr. Tiago Moura", "area": "Cirurgião-dentista" },
  "momentos": [
    { "tipo": "titulo", "de": 0, "ate": 2.63, "linhas": ["Você escova", "os dentes do", "jeito certo?"], "enfase": "jeito certo?", "duvidaEm": 1.76 },
    { "tipo": "contagem", "de": 2.63, "ate": 5.27, "titulo": "Quase todo mundo erra em 3 coisas", "enfase": "3 coisas",
      "itens": [{ "em": 4.29 }, { "em": 4.43 }, { "em": 4.57 }], "marca": { "em": 4.73, "tipo": "errado" } },
    { "tipo": "cronometro", "de": 5.27, "ate": 8.29, "numero": "01", "titulo": "Escova por menos de 2 minutos", "enfase": "menos de 2 minutos",
      "meta": "2:00", "metaEm": 7.39, "inicio": 6.04, "para": { "em": 6.79, "fracao": 0.42 } },
    { "tipo": "anatomia", "de": 8.29, "ate": 12.12, "numero": "02", "titulo": "Aperta demais", "enfase": "demais", "desenho": "dente",
      "acoes": [{ "em": 8.61, "acao": "escova" }, { "em": 9.31, "acao": "pressao" }, { "em": 10.76, "acao": "inflama" }],
      "rotulos": [{ "em": 10.98, "alvo": "gengiva", "texto": "gengiva", "erro": true }],
      "veredito": { "em": 10.79, "tipo": "errado", "texto": "Machuca a gengiva" } },
    { "tipo": "anatomia", "de": 12.12, "ate": 16.54, "layout": "lado", "numero": "03", "titulo": "Esquece o fio dental", "enfase": "fio dental",
      "desenho": "dentes", "acoes": [{ "em": 13.02, "acao": "esquecido" }, { "em": 14.44, "acao": "varre" }, { "em": 15.19, "acao": "lacunas" }],
      "rotulos": [{ "em": 15.61, "alvo": "entre", "texto": "entre os dentes", "erro": true }],
      "aproximar": { "em": 15.54, "alvo": "entre", "zoom": 2.2 },
      "veredito": { "em": 14.98, "tipo": "errado", "texto": "A escova não chega" } },
    { "tipo": "checklist", "de": 16.54, "ate": 21.36, "titulo": "O certo", "marcaEm": 16.93,
      "itens": [{ "em": 17.19, "texto": "2 minutos", "icone": "cronometro" }, { "em": 18.46, "texto": "Movimento leve", "icone": "escova" },
                { "em": 19.66, "texto": "Fio dental todo dia", "icone": "fio", "semanaEm": 20.62 }] },
    { "tipo": "cta", "de": 21.36, "ate": 24.44, "texto": "Salva esse vídeo e manda para quem precisa ouvir isso", "enfase": "precisa ouvir isso",
      "botoes": [{ "em": 21.4, "icone": "salvar" }, { "em": 22.24, "icone": "enviar" }], "assinaturaEm": 22.93 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

### Um vídeo de cripto (43 s): os blocos universais e a assinatura como metáfora

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

`numero` US$ 83.000 (centro) → `grafico` tendência sobe, ilustrativo (canto) → `definicao` "Bull market" (topo) → `cronometro` "No bolso" que trava em "não", ilustrativo (centro) → `destaque` alerta "Para a maioria das pessoas" (cheio) → `anatomia` cérebro: Impulso (amígdala), Sem critério (frontal), Risco que não entende (temporal) (canto) → `pergunta` (cheio) → `passos` O mercado → Os riscos → A escolha dos ativos (lado) → `frase` "Sem promessa de lucro" com risco (cheio) → `pergunta` com duas opções (cheio) → `cta` link (cheio). Cada bloco está escrito nas seções 3 e 4 com os tempos deste vídeo.
