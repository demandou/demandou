# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona` (não usada aqui), `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Os exemplos dos componentes da assinatura (seção 3) vêm do mesmo vídeo (o exemplo completo da seção 8), com os mesmos tempos. Os blocos universais (seção 3B) usam um vídeo sobre cripto. Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json` (cada palavra tem `em` e `ate`).

## Sumário

1. Campos gerais
2. A gramática do modelo
3. Os componentes da assinatura (`momentos`)
3B. Os 11 blocos universais
4. Os lugares da pessoa
5. Como dividir a fala em momentos
6. Regras de tempo
7. Legenda, correções e sons
8. Exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago", "area": "IA na prática" },
  "sfx": true,
  "correcoes": { "haja": "aja", "Com o texto": "Contexto" },
  "ajusteJanela": 0
}
```

- `marca.nome`: vai na etiqueta da janela da pessoa (nas janelas largas) e na assinatura do fechamento. Curto (até ~12 caracteres). Vazio = sem etiqueta e sem assinatura.
- `marca.area`: vai ao lado do nome ("Tiago · IA na prática") na janela grande e no fechamento. Até ~24 caracteres.
- `sfx`: `false` desliga os sons.
- `ajusteJanela` (opcional, px): desloca o rosto dentro das janelas. Positivo desce o rosto (mais respiro em cima, para cabeça cortada no topo); negativo sobe (pessoa sentada muito baixa). Comece com ±30 e confira nas guias.
- `rosto`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática do modelo

É a assinatura do modelo (os blocos universais da seção 3B seguem a mesma gramática: cartão no peito em tela cheia, ou bancada com a pessoa numa janela). O vídeo de exemplo conta uma história de três atos — **o pedido vago, as peças, a resposta** — e a pessoa muda de lugar em cada um:

- **Abertura (`vago`)**: a pessoa em tela cheia, rosto no centro; no peito, um chat fictício ("Assistente", avatar "IA"). O pedido vago é digitado na caixa e enviado; o cartão cresce, o balão sobe e a resposta chega cinza e borrada, palavra por palavra. Duas etiquetas escuras com palavras da fala marcam o problema ("resultado ruim", "pedido vago") e o balão do pedido perde a cor.
- **Bancada (`montagem`)**: a pessoa sobe para uma janela larga no alto; embaixo, o título é montado palavra por palavra e as vagas das peças aparecem **a lápis** (contorno tracejado, nome apagado). No número dito ("quatro"), o nome de cada vaga ganha a cor da peça. Na primeira peça, a pessoa vai para uma janela no canto de cima, as vagas crescem e ao lado da janela aparece o cabeçalho: "PEÇA 1 DE 4", o nome grande na cor da peça e uma fila de peças pequenas que se pintam conforme encaixam. Cada peça entra pela esquerda, sobe um pouco e desce encaixando o dente na de cima ("toc"); o texto dela é **digitado no instante em que é dito**, com cursor.
- **Resposta (`resposta`)**: a pessoa vai para uma janelinha à esquerda; à direita, a caixa do prompt; as peças encolhem e entram nela, viram uma pilha com os nomes e o botão de enviar é tocado ("Prompt enviado ✓"). Embaixo, o cartão da resposta chega borrado e entra em foco linha por linha: o papel que a IA assumiu (na cor da peça 1), o título sublinhado (cor da peça 2), as etiquetas do contexto (cor de onde vieram), a tabela com a linha de destaque e a coluna de número pintada (cor da peça escolhida), com os números contando.
- **Fechamento (`cta`)**: a pessoa volta para a tela cheia; no peito sobe um cartão com o prompt salvo (as peças em fila, encaixadas pelo lado), a chamada montada na fala e dois botões tocados nas palavras ("Salvar" → "Salvo", "Testar agora" → "Testando"), com a assinatura embaixo.
- **Trecho sem momento** = a pessoa em tela cheia com a legenda (seção 7).

Regras que o template já cumpre sozinho:

- Toda troca de lugar dura 0,6 s e começa no `de` do momento (a ida para o canto começa 0,3 s antes da primeira peça): ponha o `de` num corte (`cortesEm`) e o movimento esconde o pulo.
- Nada passa por cima do rosto: a bancada e a resposta ficam atrás da pessoa; os cartões da abertura e do fechamento ficam no peito, abaixo do queixo.
- O que sai cruza com o que entra: as vagas aparecem enquanto a pessoa ainda está subindo; as peças só deixam a pilha quando a caixa do prompt já está chegando; quando o momento seguinte põe a pessoa em tela cheia, a bancada e a resposta ficam até a pessoa cobri-las, e o cartão do fechamento sobe inteiro já com as peças e os botões.
- A resposta só usa as peças de uma `montagem` **encostada antes dela** (o `ate` da montagem = o `de` da resposta). O fechamento mostra as peças da última montagem.
- O último momento fica até o último quadro.

## 3. Os componentes da assinatura

Os limites de texto existem porque o espaço é fixo: passou do limite, o texto quebra feio ou é cortado com "…". Se a ideia não cabe, enxugue como um editor faria. Títulos e textos de peça entram **no instante em que são ditos** (o template procura cada palavra na fala) — use as palavras que a pessoa diz, na ordem em que diz. Algarismos ("4") casam com a palavra falada ("quatro").

### `vago` — o pedido vago e a resposta borrada

```json
{ "tipo": "vago", "de": 0, "ate": 3.5, "pedido": "me faz um cardápio", "enviaEm": 0.95,
  "rotuloResposta": { "texto": "resultado ruim", "em": 1.56 },
  "rotuloPedido": { "texto": "pedido vago", "em": 3.23 } }
```

- `pedido`: o pedido vago digitado na caixa, **ilustrativo** (o jeito ruim de pedir aquilo que as peças vão pedir direito), até ~22 caracteres, em minúsculas como alguém digita.
- `enviaEm`: o envio (padrão `de` + 0,95). O pedido é digitado de `de` + 0,15 até o envio — deixe pelo menos 0,7 s.
- `rotuloResposta` / `rotuloPedido`: etiquetas com **palavras da fala** (até ~18 caracteres), cada uma no instante da palavra principal ("ruim", "vago"). A do pedido também deixa o balão cinza e tracejado. Deixe pelo menos 0,4 s entre o envio e a primeira etiqueta.
- `resposta` (opcional): o texto genérico que aparece borrado. O padrão serve para qualquer assunto.

### `montagem` — a bancada e as peças

```json
{ "tipo": "montagem", "de": 3.5, "ate": 16.11, "titulo": "Monta o prompt em 4 peças", "destaque": "4 peças",
  "itens": [ { "em": 5.58, "nome": "Papel", "texto": "Aja como um nutricionista." },
             { "em": 8.09, "nome": "Tarefa", "texto": "Monte um cardápio da semana." },
             { "em": 10.69, "nome": "Contexto", "texto": "Sou vegetariano e treino de manhã." },
             { "em": 13.82, "nome": "Formato", "texto": "Em tabela, com as calorias." } ] }
```

- `titulo`: a frase que anuncia as peças, fiel à fala, até ~32 caracteres (2 linhas). Escreva o número em algarismo ("4 peças"): as vagas ganham cor quando ele é dito. `destaque`: trecho exato do título na cor da primeira peça.
- `itens`: 2 a 5 peças, na ordem da fala. A cor vem da posição (1 anil, 2 jade, 3 mostarda, 4 framboesa; a quinta repete o anil, então prefira 2 a 4).
  - `em`: quando o **nome** da peça é dito ("Papel:"). A peça entra e encaixa ~0,3 s depois (a primeira, ~0,45 s depois, porque a pessoa está indo para o canto).
  - `nome`: até ~9 caracteres, uma palavra ("Papel", "Tarefa", "Contexto", "Formato", "Tom", "Público", "Exemplo", "Limite"). O ícone sai do nome; para outro, use `icone` (seção 3.5).
  - `texto`: o que a pessoa diz depois do nome, fiel à fala, até ~40 caracteres (cabe em 1–2 linhas). Todas as peças usam o mesmo tamanho de letra — o do texto mais comprido —, então um texto muito maior que os outros encolhe todos.
- O primeiro item deve vir pelo menos 1,1 s depois do `de` (tempo de o título aparecer). Entre duas peças, deixe pelo menos ~1,8 s.
- `ate`: a fronteira com a `resposta` (um corte, de preferência), depois da última palavra da última peça.

### `resposta` — a caixa do prompt e a tabela que entra em foco

```json
{ "tipo": "resposta", "de": 16.11, "ate": 19.57, "enviaEm": 17.06, "viraEm": 17.74,
  "papel": "nutricionista", "titulo": "Cardápio da semana",
  "etiquetas": [ { "texto": "vegetariano", "peca": 2 }, { "texto": "treino de manhã", "peca": 2 } ],
  "colunas": [ "Dia", "Almoço", "kcal" ], "destaqueColuna": 2, "corDestaque": 3,
  "nota": { "texto": "Pré-treino: banana e aveia", "valor": "280", "peca": 2 },
  "linhas": [ [ "Seg", "Grão-de-bico ao curry", "620" ], [ "Ter", "Lentilha com arroz", "580" ],
              [ "Qua", "Tofu com legumes", "540" ], [ "Qui", "Omelete de espinafre", "490" ],
              [ "Sex", "Quinoa com feijão", "610" ] ] }
```

- Deve vir **encostada** numa `montagem` (é de lá que vêm as peças que entram na caixa).
- `enviaEm`: o botão de enviar é tocado (padrão `de` + 0,8). Deixe pelo menos 0,9 s depois do `de` (as peças precisam entrar na caixa) — de preferência numa palavra forte ("peças").
- `viraEm`: a resposta começa a entrar em foco — a palavra "resposta" ou equivalente (padrão: 0,5 s depois do envio). A tabela inteira fica pronta ~1,4 s depois; deixe `viraEm` pelo menos 1,6 s antes do `ate`.
- `papel`: o papel que a IA assumiu, sem o "como" (até ~16 caracteres): vira "como nutricionista" na cor da peça 1. Tire se a montagem não tem uma peça de papel.
- `titulo`: título da resposta, até ~22 caracteres, sublinhado na cor da peça 2.
- `etiquetas`: até 3, cada uma até ~16 caracteres, com `peca` = índice (a partir de 0) da peça de onde veio a informação.
- `colunas`: 2 ou 3. Com 3: a primeira é estreita (até ~4 caracteres por célula: "Seg", "8h"), a do meio até ~21 caracteres e a última até ~6. Com 2: a primeira até ~10 e a segunda até ~22. A última coluna é tratada como número (alinhada à direita, fonte de números, contando até o valor) quando todas as células dela são números (`620`, `1.250`, `12%`, `R$ 49`, `30 min`).
- `destaqueColuna` + `corDestaque`: a coluna pintada com a cor de uma peça (índice a partir de 0) — use para o que uma peça pediu (as calorias do Formato).
- `nota` (opcional): uma linha de destaque antes das outras, pintada com a cor de `peca`, até ~28 caracteres + `valor` opcional. Use para o que o contexto mudou ("Pré-treino: banana e aveia" porque a pessoa treina de manhã).
- `linhas`: até 5. **O conteúdo é ilustrativo** — plausível, sem dado pessoal real, sem número inventado apresentado como fato — e sai com a etiqueta "exemplo" (`"exemplo": false` tira, só se o conteúdo for real e dito pela pessoa).

### `cta` — salvar e testar

```json
{ "tipo": "cta", "de": 19.57, "ate": 21.6, "titulo": "Salva e testa agora", "salvarEm": 19.88, "testarEm": 20.3 }
```

- `titulo`: a chamada dita, até ~22 caracteres (1 linha grande).
- `salvarEm` / `testarEm`: o toque em cada botão, logo depois das palavras ("Salva", "testa"/"agora"), com 0,3 s ou mais entre os dois. O cartão leva ~0,4 s para subir: o primeiro toque fica bom a partir de `de` + 0,3.
- `acao`: o segundo botão — `"testar"` (padrão: "Testar agora" → "Testando"), `"seguir"` ("Seguir" → "Seguindo", para "me segue") ou `"enviar"` ("Enviar" → "Enviado", para "manda pra alguém").
- Último momento: fica até o fim do vídeo. Sem montagem antes, o cartão sai sem a fila de peças.

### 3.5 Ícones disponíveis

`cracha` (Papel), `lista` (Tarefa), `alfinete` (Contexto), `tabela` (Formato), `balao` (tom, estilo), `pessoas` (público), `alvo` (objetivo), `documento` (exemplo, referência), `regua` (limite, tamanho), `relogio` (prazo), `lampada` (ideia), `sol`. O template escolhe pelo nome da peça; `"icone": "alvo"` força outro. Ícone novo: veja `references/estilo.md`.

## 3B. Os 11 blocos universais

Existem em todos os modelos do pack, com os mesmos campos (veja `references/adaptar.md` para escolher o bloco). Campos comuns: `tipo`, `de`, `ate`, `legenda?`. Todo `em` é o instante da palavra dita, tirado de `work/palavras.json`. Os exemplos vêm de um vídeo sobre cripto.

| `tipo` | Lugar da pessoa | Campos e limites |
|---|---|---|
| `abertura` | tela cheia (peito) | `texto` (até ~60 caracteres, até 3 linhas), `destaque?` (trecho exato), `em?` |
| `topicos` | bancada, janelinha | `titulo?` (até ~28), `itens` 2 a 5: `{texto` (2 a 6 palavras, até ~34 caracteres), `em`, `detalhe?}` |
| `passos` | bancada, janelinha | `titulo?` (até ~28), `itens` 2 a 5 em ordem, como em `topicos` |
| `numero` | tela cheia | `valor`, `em`, `rotulo` (até ~28), `rotuloEm?`, `prefixo?`, `sufixo?` ("mil", "mi", "%"), `casas?`, `ilustrativo?`. Formato pt-BR |
| `comparacao` | bancada, janela larga | `titulo?`, `modo?` (`contra`, `antes-depois`, `errado-certo`), `lados` (dois: `{rotulo` até ~14, `texto` até ~34, `em}`), `vencedor?` (0 ou 1), `vencedorEm?` |
| `grafico` | bancada | `titulo?`, `forma` (`barras`, `linha`, `pizza`), `dados?` 2 a 6 `{rotulo, valor, em}` (só números ditos), `tendencia?` (`sobe`, `cai`, `oscila`) + `tendenciaEm?`, `unidade?`, `ilustrativo?` |
| `destaque` | tela cheia | `texto` (até ~30), `em`, `nivel?` (`alerta` framboesa, `chave` anil), `detalhe?` (até ~24), `detalheEm?` |
| `definicao` | tela cheia | `termo` (até ~22), `em`, `significado` (até ~50), `significadoEm` |
| `frase` | tela cheia | `texto` (até ~50), `destaque?`, `risco?` (trecho riscado), `riscoEm?`, `em?` |
| `pergunta` | tela cheia | `texto` (até ~60), `opcoes?` 2 a 4 `{texto` até ~28, `em}`, `em?` |
| `cta` | tela cheia | `texto` (até ~60), `icone?` (`salvar`, `seguir`, `comentar`, `link`), `destaque?`, `em?` |

- **Sem número dito:** `grafico` com `tendencia` e `ilustrativo: true` (a curva e a etiqueta "ilustrativo" aparecem sozinhas), ou `comparacao`.
- **`em?`** em `abertura`, `frase`, `pergunta` e `cta`: o instante em que o TEXTO começa a ser dito (padrão `de`). Use quando o momento começa antes da primeira palavra do texto.
- **Cartões em tela cheia** ficam abaixo do queixo, centrados no rosto; o `texto` é digitado na fala. Dois cartões encostados continuam um do outro.
- **Bancada:** cada item entra em foco no seu `em`, com uma peça pequena numerada que encaixa; entre duas bancadas encostadas, a que sai é empurrada para o lado enquanto a nova entra.
- **O `cta` no formato antigo** (`titulo`, `salvarEm`, `testarEm`, `acao`) continua valendo.

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
{ "tipo": "grafico", "de": 2.89, "ate": 8.67, "titulo": "Bull market: ciclo de alta", "forma": "linha", "tendencia": "sobe", "tendenciaEm": 6.64, "ilustrativo": true }
{ "tipo": "comparacao", "de": 8.67, "ate": 12.85, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "Bolso", "texto": "Não significa dinheiro no bolso", "em": 9.87 } ] }
{ "tipo": "destaque", "de": 12.85, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
{ "tipo": "passos", "de": 30.0, "ate": 33.8, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
{ "tipo": "frase", "de": 33.8, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.9 }
{ "tipo": "pergunta", "de": 35.2, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
```

## 4. Os lugares da pessoa

O lugar vem do tipo do momento — os componentes contam com ele, então não há campo para mudar.

| Lugar | Onde | Quando |
|---|---|---|
| tela cheia | quadro inteiro, rosto no centro | `vago` e os blocos de cartão no peito (`abertura`, `numero`, `destaque`, `definicao`, `frase`, `pergunta`, `cta`) e trechos sem momento |
| alto | janela larga no alto (900×690) | começo da `montagem`, enquanto o título é dito |
| canto | janela no canto de cima à direita (370×430), ao lado do cabeçalho | da primeira peça ao fim da `montagem` |
| lado | janelinha no alto à esquerda (300×392), ao lado da caixa do prompt | `resposta`, e a bancada dos blocos `topicos`, `passos`, `comparacao` e `grafico` (a janela muda de lugar entre blocos vizinhos) |

A cabeça precisa caber inteira nas janelas do canto e do lado. Se não couber, use `ajusteJanela` (seção 1).

## 5. Como dividir a fala em momentos

Leia a transcrição inteira e pergunte, frase a frase: *numa aula de prompt, o que eu mostraria agora?*

| A fala traz… | Componente |
|---|---|
| o problema de quem pede mal ("seu resultado é ruim porque o pedido é vago") | `vago` |
| número, enumeração, sequência, dois lados, tendência, alerta, termo, frase, pergunta (qualquer assunto) | o bloco universal da seção 3B (`references/adaptar.md`) |
| o anúncio das partes ("monta em quatro peças") e cada parte dita pelo nome ("Papel: …") | `montagem` |
| o resultado de pedir direito ("a resposta muda completamente") | `resposta` |
| a chamada final (salva, testa, me segue, manda pra alguém) | `cta` |
| um aviso, um exemplo solto, uma frase de transição | trecho sem momento (tela cheia com legenda) |

- Um momento a cada 2 a 5 s, sem trecho longo só com legenda (o `conferir.mjs` recusa). Momentos **encostados** (o `ate` de um = o `de` do próximo), com as fronteiras nos cortes (`cortesEm`) ou nas pausas entre frases. Um trecho sem momento entre dois momentos é bem-vindo quando a fala tem uma frase solta: a pessoa volta para a tela cheia com a legenda.
- A `montagem` funciona com qualquer coisa que **se soma numa só**: as partes de um prompt, os ingredientes de um pedido, as etapas de uma automação, os campos de um formulário. As peças precisam ser ditas pelo nome ("Papel:", "Passo dois:", "Gatilho:"); se a fala não dá um nome curto para cada parte, use um rótulo enxuto que a pessoa diga ("Gatilho", "Ação", "Resultado").
- Sem pedido vago no começo, comece com `abertura`, `numero`, `pergunta` ou direto na `montagem`.
- Sem um resultado mostrável (tabela), siga da montagem para outro bloco ou para o `cta`.

## 6. Regras de tempo

- O primeiro momento começa em 0 (ou deixe a abertura sem momento, com legenda). O `ate` do último é o fim do vídeo (`duracao`).
- Fronteiras: no corte (`cortesEm`) ou na pausa entre frases. A pessoa se move nos 0,6 s seguintes ao `de` (e nos 0,6 s que começam 0,3 s antes da primeira peça).
- Nada fica parado mais de ~2,5 s: numa montagem, peças com mais de ~3 s entre si deixam a bancada parada — enxugue o trecho no corte ou divida a fala de outro jeito. Na resposta, o tempo entre o `de` e o `viraEm` fica com a resposta borrada; mais de ~2 s pede um `viraEm` mais cedo.
- O texto de uma peça precisa ser dito antes da peça seguinte entrar; o cursor pisca até lá.

## 7. Legenda, correções e sons

A legenda aparece **só nos trechos sem momento** (a pessoa em tela cheia): uma faixa escura no peito, centrada no rosto, em que cada palavra é um "token" e a palavra da vez ganha uma pastilha clara. Os momentos já mostram o que é dito. `"legenda": true` num `vago` ou `cta` mantém a legenda durante ele, logo abaixo do queixo, acima do cartão (raramente vale a pena); nos momentos de bancada e resposta ela não aparece. `semLegenda` tira legenda de trechos extras — use para tirar da tela o nome de uma ferramenta de edição de vídeo, se a pessoa falar.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "haja": "aja", "Com o texto": "Contexto", "chat GPT": "ChatGPT", "né": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. As correções valem para a legenda **e** para achar o tempo das palavras das peças. Não edite `palavras` à mão (o `cortar.mjs` reescreve esse campo). Para ver as linhas de legenda: `node scripts/legendas.mjs`.

Sons (automáticos, tonais, discretos): um envio suave no pedido vago, um tom abafado na etiqueta do pedido, um "toc" grave por peça que encaixa (a nota sobe a cada peça, como um acorde que se monta), duas notas no envio do prompt, um acorde curto quando a tabela fica pronta, uma nota ao salvar e duas ao testar. `"sfx": false` desliga.

## 8. Exemplo completo

Roteiro: "Seu resultado com IA é ruim porque o seu pedido é vago. Monta o prompt em quatro peças. Papel: aja como um nutricionista. Tarefa: monte um cardápio da semana. Contexto: sou vegetariano e treino de manhã. Formato: em tabela, com as calorias. Com essas quatro peças, a resposta muda completamente. Salva e testa agora."

Cortes em 3,50 · 5,49 · 8,00 · 10,59 · 13,73 · 14,24 · 16,11 · 19,57. A transcrição trouxe "haja como" e "Com o texto" — corrigidos em `correcoes`. Quatro momentos encostados:

```json
{
  "marca": { "nome": "Tiago", "area": "IA na prática" },
  "correcoes": { "haja": "aja", "Com o texto": "Contexto" },
  "momentos": [
    { "tipo": "vago", "de": 0, "ate": 3.5, "pedido": "me faz um cardápio", "enviaEm": 0.95,
      "rotuloResposta": { "texto": "resultado ruim", "em": 1.56 },
      "rotuloPedido": { "texto": "pedido vago", "em": 3.23 } },
    { "tipo": "montagem", "de": 3.5, "ate": 16.11, "titulo": "Monta o prompt em 4 peças", "destaque": "4 peças",
      "itens": [ { "em": 5.58, "nome": "Papel", "texto": "Aja como um nutricionista." },
                 { "em": 8.09, "nome": "Tarefa", "texto": "Monte um cardápio da semana." },
                 { "em": 10.69, "nome": "Contexto", "texto": "Sou vegetariano e treino de manhã." },
                 { "em": 13.82, "nome": "Formato", "texto": "Em tabela, com as calorias." } ] },
    { "tipo": "resposta", "de": 16.11, "ate": 19.57, "enviaEm": 17.06, "viraEm": 17.74,
      "papel": "nutricionista", "titulo": "Cardápio da semana",
      "etiquetas": [ { "texto": "vegetariano", "peca": 2 }, { "texto": "treino de manhã", "peca": 2 } ],
      "colunas": [ "Dia", "Almoço", "kcal" ], "destaqueColuna": 2, "corDestaque": 3,
      "nota": { "texto": "Pré-treino: banana e aveia", "valor": "280", "peca": 2 },
      "linhas": [ [ "Seg", "Grão-de-bico ao curry", "620" ], [ "Ter", "Lentilha com arroz", "580" ],
                  [ "Qua", "Tofu com legumes", "540" ], [ "Qui", "Omelete de espinafre", "490" ],
                  [ "Sex", "Quinoa com feijão", "610" ] ] },
    { "tipo": "cta", "de": 19.57, "ate": 21.6, "titulo": "Salva e testa agora", "salvarEm": 19.88, "testarEm": 20.3 }
  ]
}
```

Com esse plano: no peito da pessoa, "me faz um cardápio" é digitado e enviado, a resposta chega borrada e as etiquetas "resultado ruim" e "pedido vago" pousam nas palavras; no corte, a pessoa sobe para a janela larga, "Monta o prompt em 4 peças" se monta e as quatro vagas acendem no "quatro"; a pessoa vai para o canto e Papel, Tarefa, Contexto e Formato encaixam um a um, cada texto digitado na fala; no corte seguinte, as peças entram na caixa, o prompt é enviado no "quatro" e, no "resposta", o cardápio entra em foco com o papel de nutricionista, as etiquetas do contexto, o pré-treino e as calorias contando; a pessoa volta para a tela cheia e o cartão final salva e testa. Nenhum trecho fica sem momento, então esse vídeo não tem legenda.
