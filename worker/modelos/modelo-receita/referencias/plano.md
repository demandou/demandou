# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `cozinha` (só com panela), `momentos`, `semLegenda` e `correcoes` (e, se precisar, `pessoa`). Os blocos universais (seção 3) servem a qualquer assunto; a assinatura (ingredientes e passo, seções 5 e 6) é a cara do modelo e entra pelo menos uma vez.

Os exemplos de cada componente abaixo vêm do mesmo vídeo (o do exemplo completo, na seção 10), com os mesmos tempos.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática da ficha
3. Os 11 blocos universais (qualquer assunto)
4. `abertura` (campos próprios) e `ingredientes`
5. `passo` e as ações da panela
6. `dica`
7. `cta` (campos próprios)
8. Regras de tempo
9. Legenda, correções e sons
10. Exemplo completo (confeitaria; um exemplo sem culinária está na seção 3)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago", "area": "Confeitaria" },
  "cozinha": { "recipiente": "panela", "massa": "massa" },
  "sfx": true,
  "correcoes": { "der para": "der pra" }
}
```

- `marca`: `nome` e `area` aparecem como assinatura ("— Tiago · Confeitaria") abaixo do nome da receita e no fechamento. Juntos, até ~26 caracteres (passou disso, a assinatura encolhe até 30 px). `nome` vazio = sem assinatura.
- `cozinha.recipiente`: `"panela"` (com cabo; o padrão) ou `"tigela"` (sem cabo — massa crua, salada, mistura fria).
- `cozinha.massa`: a cor do que está sendo feito quando tudo se mistura: `massa` (chocolate/brigadeiro, o padrão), `caramelo` (doce de leite, beijinho queimado, molho), `creme` (beijinho, creme branco), `branco`, `pistache`, `framboesa`, `morango`, `limao`, `manteiga`, `cacau`.
- `pessoa` (opcional): ajuste do enquadramento na janela do canto. `{ "zoom": 1.15 }` aproxima (gravação aberta, rosto pequeno), `0.85` afasta (gravação fechada); `"ancoraY"` (padrão 0,42) é a altura do rosto dentro da janela (menor sobe o rosto).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. A ficha no peito para logo abaixo do `zona.topo`.

## 2. A gramática da ficha

É a assinatura do modelo. Há dois estados, e o tipo do momento decide qual:

| Estado | Momentos | A pessoa | A ficha |
|---|---|---|---|
| **Ficha no peito** | `abertura`, `destaque`, `definicao`, `frase`, `pergunta`, `dica`, `cta` | quadro cheio, rosto no centro | sobe só até a altura do peito, logo abaixo do queixo; o texto fica nela |
| **Ficha em cima** | `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `ingredientes`, `passo` | janela arredondada num canto de cima (372×476 px) | ocupa a tela; cabeçalho ao lado da janela, corpo embaixo, índice da receita no pé |
| **Sem momento** | trecho de 1,2 s ou mais sem momento | quadro cheio, com legenda | fora da tela |

Regras que o template já cumpre sozinho (não precisa escrever nada):

- **A ficha sobe e desce**: da `abertura` para os `ingredientes`, a mesma ficha sobe (0,72 s), a pessoa encolhe para a janela, que pousa sobre o papel, e o título da abertura sobe junto e vira o cabeçalho, ao lado da janela. Nas outras trocas entre os dois estados há **duas fichas**: para voltar ao peito (`dica`, `cta`), a ficha cheia desce e sai da tela levando tudo o que tem (título, panela, anotações), e a ficha do peito já está embaixo dela, com o texto a lápis; para sair de uma `dica` para um passo, uma ficha cheia nova sobe por cima da do peito. Nunca aparece uma ficha vazia no meio da troca.
- **A janela muda de canto**: a cada momento da ficha em cima, a janela troca de lado (direita → esquerda → direita…) e o cabeçalho troca de lugar com ela. Para fixar um lado, use `"pessoa": "sup-esq"` ou `"sup-dir"` no momento.
- **A troca cai no corte**: se há um corte (`cortesEm`) a menos de 0,3 s da fronteira entre dois momentos, a troca começa 0,16 s antes dele e o pulo do corte some no meio do movimento.
- **Nada some de repente nem chega vazio**: o texto de cada momento já está na ficha "a lápis" (cor clara) e ganha tinta palavra por palavra quando é dito; as linhas de ingrediente nascem tracejadas com o ícone a lápis; o que sai some antes do que entra aparecer no mesmo lugar, e a panela (que atravessa o vídeo inteiro) segura a tela durante as trocas.
- **A panela tem memória**: o que caiu nela nos ingredientes continua lá nos passos; o fogo aceso continua aceso até `desligar`; a colher mexe até a massa ir para o pote.
- **Índice da receita no pé**: "Ingredientes ① ② ③" ligados por um fio pistache que avança a cada momento (fica sob a interface do app no celular, mas aparece no vídeo).
- **Tamanhos de celular**: o texto é grande de propósito (rótulos 56 px, ingredientes 68 px, anotações 76 px, títulos 96–100 px num quadro de 1080). Por isso os limites de caracteres abaixo são curtos — respeite-os em vez de esperar que o texto encolha.
- **Último momento**: fica até o último quadro.

## 3. Os 11 blocos universais (qualquer assunto)

Mesmos `tipo` e campos de todos os modelos do pack. Todo momento tem `de`, `ate` e `legenda?`. Todo `em` é o instante da palavra dita (de `work/palavras.json`). Textos são medidos: encolhem até um mínimo legível e quebram em até 2 ou 3 linhas, mas escreva curto, com as palavras da fala (item de 2 a 6 palavras, título até ~40 caracteres). Campos opcionais podem faltar.

| `tipo` | Campos | Na ficha | Limites |
|---|---|---|---|
| `abertura` | `texto`, `destaque?`, `em?`, `rotulo?`, `passos?` | peito: título a lápis que ganha tinta na fala | até 3 linhas; `destaque` = trecho exato |
| `topicos` | `titulo?`, `itens[{texto, em, detalhe?}]`, `rotulo?`, `pessoa?` | em cima: linhas pautadas com visto | 2 a 5 itens; com `detalhe`, o item fica em 1 linha |
| `passos` | `titulo?`, `itens[{texto, em, detalhe?}]` | em cima: círculos numerados ligados por um fio | 2 a 5 itens, em ordem |
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | em cima: número gigante que conta, copo medidor enchendo | pt-BR (83.000; 1,5); `sufixo` "mil", "%" |
| `comparacao` | `titulo?`, `modo?` (`contra`, `antes-depois`, `errado-certo`), `lados[2]{rotulo, texto, em}`, `vencedor?`, `vencedorEm?` | em cima: dois cartões, × ou seta; errado riscado | `texto` até 2 linhas por lado |
| `grafico` | `titulo?`, `forma` (`barras`, `linha`, `pizza`), `dados?[{rotulo, valor, em}]`, `tendencia?`, `tendenciaEm?`, `unidade?`, `ilustrativo?` | em cima: potes, traço a lápis ou torta | `dados` 2 a 6 itens, só números ditos; sem `dados`, use `tendencia` (`sobe`, `cai`, `oscila`), que ganha a etiqueta "ilustrativo" |
| `destaque` | `texto`, `em`, `nivel?` (`alerta`, `chave`), `detalhe?`, `detalheEm?` | peito: frase grande; `alerta` com chama caramelo | texto curto (até 3 linhas) |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | peito: termo grande e seta a lápis até o significado | termo 1 a 3 palavras |
| `frase` | `texto`, `destaque?`, `risco?`, `riscoEm?`, `em?` | peito: aspas e texto palavra por palavra; `risco` riscado quando dito | até 3 linhas |
| `pergunta` | `texto`, `opcoes?[{texto, em}]`, `em?` | peito: "?" num círculo, opções como etiquetas | `opcoes` 2 a 4 |
| `cta` | `texto`, `icone?` (`salvar`, `seguir`, `comentar`, `link`), `destaque?`, `em?`, `apoio?` | peito: a ficha desce; fita, "+", balão ou clipe | até 3 linhas; `apoio` em itálico |

Regras:
- **Tempo por dentro:** cada item entra no seu `em`; momento com mais de ~4 s precisa de itens entrando dentro dele. Nada parado mais de ~2,5 s.
- **`pessoa`** (`sup-esq` ou `sup-dir`) fixa o canto da janela nos blocos de ficha em cima; sem ele, a janela alterna.
- **Não repita o mesmo bloco três vezes seguidas.** O `conferir` avisa.
- **Sem número dito, sem número na tela.** Gráfico qualitativo usa `tendencia` e `ilustrativo: true`.

Exemplo (cripto, sem culinária):

```json
{ "tipo": "numero", "de": 0, "ate": 3, "valor": 83000, "em": 1.34, "prefixo": "US$ ", "rotulo": "Bitcoin" },
{ "tipo": "definicao", "de": 3, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "um ciclo de alta", "significadoEm": 5.96 },
{ "tipo": "comparacao", "de": 8.6, "ate": 14.9, "modo": "contra", "titulo": "Mercado subindo",
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 9.31 }, { "rotulo": "Seu bolso", "texto": "sem dinheiro", "em": 10.91 } ], "vencedor": 0 },
{ "tipo": "passos", "de": 28, "ate": 33.7, "titulo": "Aula gratuita",
  "itens": [ { "texto": "Mercado", "em": 30.91 }, { "texto": "Riscos", "em": 31.86 }, { "texto": "Ativos", "em": 32.87 } ] },
{ "tipo": "frase", "de": 33.7, "ate": 35.1, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.03 }
```

## 4. `abertura` — campos próprios e ingredientes

Para a primeira frase. A ficha já está no primeiro quadro (vira a miniatura) com o nome escrito a lápis; cada palavra ganha tinta quando é dita. À direita, o pote pronto com a colher (aparece quando o plano tem a ação `pote`). Embaixo, a assinatura (`marca`).

```json
{ "tipo": "abertura", "de": 0, "ate": 2.99, "rotulo": "Receita",
  "titulo": ["Brigadeiro", "de colher", "cremoso"], "destaque": "cremoso",
  "passos": { "em": 2.16, "total": 3 } }
```

- `texto` (formato universal) ou `titulo` (linhas já quebradas): palavras da fala, na ordem; até 3 linhas de **~10 caracteres** (é a largura do cabeçalho para onde o título sobe). Linha mais longa é quebrada sozinha; se passar de 3 linhas, o corpo diminui. Prefira escrever as quebras você mesmo.
- `destaque` (opcional): trecho exato do título em itálico com o grifo pistache.
- `passos` (opcional): "3 passos" — `em` = quando o número é dito; os círculos ①②③ acendem em sequência. Só use se a pessoa disser quantos passos são.
- `rotulo` (opcional): o rótulo em caixa alta acima do título (padrão "Receita").

### `ingredientes` — ficha em cima, uma linha por ingrediente, tudo cai na panela

Cada ingrediente é uma linha: ícone, quantidade grande e, ao lado, a unidade (em itálico) em cima do nome. Nasce tracejada; quando é dita, o ícone se desenha, a quantidade, a unidade e o nome ganham tinta; um instante depois, o conteúdo sai de baixo da pilha de linhas e cai na panela vista de cima (líquido escorre numa fita, pedaço cai, pó cai em chuvisco) e o ícone ganha um visto pistache.

```json
{ "tipo": "ingredientes", "de": 2.99, "ate": 8.08, "pessoa": "sup-dir",
  "itens": [
    { "em": 3.08, "quantidade": "1", "unidade": "lata", "nome": "leite condensado", "icone": "lata" },
    { "em": 4.9, "quantidade": "1", "unidade": "colher", "nome": "manteiga", "icone": "colher" },
    { "em": 6.26, "quantidade": "3", "unidade": "colheres", "nome": "chocolate em pó", "icone": "pote" }
  ] }
```

- `quantidade` e `unidade` são opcionais: sem elas a linha mostra o ícone e o nome (use `tigela` para o que não é material).
- `itens`: 1 a 6, mas **o ideal é até 3** (linhas altas, nome em 68 px). Com 4, as linhas ficam um pouco menores; com 5 ou 6, quantidade, unidade e nome vão numa linha só e o texto fica pequeno para o celular. Mais de 4 ingredientes: divida em dois momentos `ingredientes` seguidos (ex.: rótulo "Massa" e rótulo "Cobertura") — a janela troca de canto, o título da receita fica no cabeçalho e a panela continua recebendo.
- `em`: a primeira palavra do ingrediente ("uma", "1", "duas"). A quantidade ganha tinta nela; a unidade e o nome, nas palavras deles.
- `quantidade`: algarismos, até 4 caracteres ("1", "3", "200", "1/2"). Escreva em algarismo mesmo que a pessoa diga por extenso ("uma" → "1"): o template casa "1" com "uma/um", "3" com "três" etc.
- `unidade` (opcional): "lata", "colher", "colheres", "xícara", "g", "ml", "pitada"… até ~10 caracteres.
- `nome`: como foi dito, enxuto, até **~16 caracteres** (pode tirar o "de": "chocolate em pó"). Com quantidade de 3–4 algarismos ("200"), até ~13. Passou disso, o nome encolhe abaixo do tamanho de celular.
- `icone`: um nome da tabela abaixo. Sem ícone que combine, use `tigela` (neutro).
- `cai` (opcional): `{ "em": 4.08, "jeito": "despeja", "tinta": "creme" }`. `em` = quando cai (padrão: 1 s depois do `em` do item, antes do próximo item); `jeito` = `despeja` (líquido, fita cremosa), `pedaco` (cubo que cai e derrete no fogo), `po` (chuvisco de pontinhos) ou `nenhum` (não cai — utensílio, decoração); `tinta` = a cor que vira lá dentro (lista em `cozinha.massa`). O padrão de cada ícone está na tabela.
- `rotulo` (opcional): o rótulo acima das linhas (padrão "Ingredientes"); também nomeia o primeiro item do índice no pé (até ~14 caracteres).
- `titulo` (opcional): o nome da receita no cabeçalho **quando não há `abertura` antes** (até 3 linhas de ~10 caracteres, palavras da fala). Sem ele, o cabeçalho mostra o `rotulo` grande.
- `pessoa` (opcional): `"sup-dir"` (padrão) ou `"sup-esq"`.

| Ícone | Desenho | Cai como | Vira |
|---|---|---|---|
| `lata` | lata com faixa (leite condensado, creme de leite, milho) | despeja | creme |
| `caixinha` | caixinha (creme de leite, leite de coco) | despeja | branco |
| `leite` | caixa de leite | despeja | branco |
| `garrafa` | garrafa (óleo, essência, bebida) | despeja | branco |
| `xicara` | xícara de medida | despeja | branco |
| `ovo` | ovo | despeja | manteiga |
| `limao` | limão | despeja | limao |
| `tigela` | tigela (neutro, para o que não tem ícone) | despeja | creme |
| `colher` | colher de sopa | pedaço | manteiga |
| `manteiga` | tablete de manteiga | pedaço | manteiga |
| `morango` | morango | pedaço | morango |
| `gelo` | cubo de gelo | pedaço | branco |
| `pote` | pote com tampa (chocolate em pó, cacau, café, granulado) | pó | cacau |
| `acucar` | cubos de açúcar | pó | branco |
| `farinha` | pacote de farinha | pó | branco |
| `sal` | saleiro (pitada) | pó | branco |

Ajuste `cai.tinta` quando o padrão não combinar (ex.: `colher` de doce de leite → `"tinta": "caramelo"`).

## 5. `passo` — ficha em cima, número grande, a panela reage

O cabeçalho ao lado da janela mostra "PASSO", o número enorme (que rola para o próximo quando ele é dito) e "de 3" com as bolinhas; embaixo, o título do passo se escreve na fala; logo abaixo do título, uma faixa com as anotações (uma à esquerda, outra à direita, em itálico grande), cada uma com uma linha que desce até o que acontece na panela; a panela é a protagonista: no centro, com ~65% da largura da ficha.

```json
{ "tipo": "passo", "de": 8.08, "ate": 12.09, "pessoa": "sup-esq", "numero": 1, "numeroEm": 8.18,
  "titulo": ["Tudo na panela"],
  "itens": [ { "em": 10.12, "texto": "fogo baixo", "acao": "fogo-baixo" },
             { "em": 11.01, "texto": "mexendo sem parar", "acao": "mexer" } ] }
```

- `numero`: 1, 2, 3… `numeroEm`: quando o número é dito ("Primeiro", "Dois"). Se a janela estiver trocando de canto nessa hora, o número rola logo depois da troca (nunca escondido atrás da janela).
- `total` (opcional): total de passos no "de 3" (padrão: o maior `numero` do plano).
- `titulo`: palavras da fala, na ordem; 1 ou 2 linhas de até **~17 caracteres** (96 px). Linha mais longa encolhe até 76 px (~21 caracteres); passou disso, encurte. Título de 2 linhas deixa a panela um pouco menor.
- `destaque` (opcional): trecho exato do título com o grifo pistache.
- `itens`: até 3. `em` = a primeira palavra do item. `texto` (opcional) = a anotação, com palavras da fala, até **~22 caracteres** (1 ou 2 linhas de até ~11, 76 px; palavra sozinha com mais de 11 letras não cabe); sem `texto`, o item só dispara a ação. **No máximo 2 itens com texto por passo** ficam na faixa — o que aponta mais para a esquerda vai à esquerda; um terceiro vira uma etiqueta logo abaixo da faixa, por cima da borda da panela (use só se precisar). `acao` (opcional) = o que a panela faz:

| Ação | O que aparece | Use quando a pessoa diz |
|---|---|---|
| `fogo-baixo`, `fogo-medio`, `fogo-alto` | a trempe do fogão e a chama em volta da panela, no tamanho do fogo; a chama tremula até desligar | "fogo baixo", "em fogo médio", "fogo alto" |
| `mexer` | a espátula pistache entra e gira sem parar; os ingredientes viram uma massa só, com a espiral do creme | "mexendo", "mexe sem parar", "mistura" |
| `fundo` | a massa engrossa e o rastro da espátula abre o fundo da panela (precisa de `mexer` antes) | "até ver o fundo da panela", "até desgrudar" |
| `desligar` | a chama se apaga | "desliga", "tira do fogo" |
| `pote` | a panela se afasta, o pote aparece, a massa escorre numa fita e o pote enche | "passa pro pote", "coloca no pote/refratário" |
| `quente` | fios de vapor sobem do pote e um termômetro aparece alto (precisa de `pote` antes) | "ainda quente", "quentinho" |
| `esfriar` | o vapor some e o termômetro desce | "deixa esfriar", "espera esfriar" |

A panela tem memória entre os passos: o fogo continua aceso até `desligar` (ou até `pote`), a colher mexe até `pote`. Não use uma ação que a pessoa não descreveu; um item sem `acao` vira só anotação.

- `pessoa` (opcional): `"sup-esq"` ou `"sup-dir"`; sem ele, a janela vai para o canto oposto ao do momento anterior.
- Um passo precisa de pelo menos ~2,5 s.

## 6. `dica` — ficha no peito com uma frase

Para um aviso, um segredo, um "não deixa grudar". A ficha desce para o peito, a pessoa volta ao quadro cheio, e a frase se escreve na fala.

```json
{ "tipo": "dica", "de": 15.4, "ate": 17.8, "rotulo": "Dica",
  "linhas": ["Não deixa", "grudar no fundo"], "destaque": "grudar" }
```

- `linhas`: palavras da fala, até 3 linhas de até ~17 caracteres (96 px; encolhe até 80 px, ~21 caracteres). O bloco fica no meio da parte visível da ficha. `destaque` (opcional). `rotulo` (opcional, padrão "Dica").
- Cada `dica` no meio dos passos custa duas trocas de ficha (a cheia sai descendo, depois uma nova sobe; 0,72 s cada): use só para uma frase que merece, e com 2 s ou mais.

## 7. `cta` — campos próprios do fechamento (o bloco universal está na seção 3)

A ficha desce para o peito e a pessoa volta ao quadro cheio; as linhas principais ficam grandes, a última vira o apoio em itálico, a assinatura vem embaixo e o pote pronto (ou a panela, se não houve `pote`) fica à direita.

```json
{ "tipo": "cta", "de": 18.68, "ate": 21.36,
  "linhas": ["Salva essa", "receita", "e me marca quando fizer"], "icone": "salvar", "em": 18.76 }
```

- `texto` + `apoio` (universal) ou `linhas` (antigo): 2 ou 3 linhas, palavras da fala. As principais até **~12 caracteres** por linha (104 px; encolhem até 80 px, ~13 caracteres); a última vira o apoio em itálico de 80 px, quebrado em até 2 linhas de ~14 (até ~28 caracteres). Com uma linha só, ela fica grande e não há apoio. A assinatura (`marca`) vai embaixo, abaixo do pote.
- `icone`: `salvar` (padrão — uma fita de marcador pistache desce da borda da ficha), `seguir` (um "+" que vira visto), `comentar` (um balão) ou `link` (um clipe).
- `em` (opcional): quando o ícone age (padrão: a primeira palavra).
- `destaque` (opcional): trecho das linhas principais com o grifo.

## 8. Regras de tempo

- **Momentos encostados**: o `ate` de um = o `de` do próximo, na pausa entre as duas frases — de preferência exatamente num valor de `cortesEm` (a troca esconde o pulo do corte).
- **Buraco de 1,2 s ou mais** entre momentos vira trecho sem momento: a ficha sai, a pessoa fica em quadro cheio com legenda. Buraco menor é absorvido pelo momento anterior.
- **Estrutura típica**: `abertura` (a promessa) → blocos conforme a fala (número, definição, comparação, lista…) → `ingredientes` e/ou `passo` (a assinatura) → `cta`. Com assunto de culinária: `abertura` → `ingredientes` → um `passo` por etapa → `cta`. Uma `dica` entre os passos, se houver. Vídeo de 20–40 s: 1 bloco de ingredientes e 2 a 4 passos.
- **Tempos dos itens**: o `em` de cada ingrediente e de cada item de passo é a primeira palavra dele em `work/palavras.json`. Um item só pode acontecer depois do início do momento dele.
- **Ritmo**: algo muda na tela a cada 1,5–2,5 s. Se um passo tem 4 s de fala e um item só, divida a fala em dois itens (ex.: "fogo baixo" e "mexendo") ou junte com o passo seguinte.

## 9. Legenda, correções e sons

- **Legenda**: aparece só nos trechos sem momento (pessoa em quadro cheio), numa etiqueta creme abaixo do queixo, com a palavra da vez grifada em pistache. Nos momentos ela some, porque a ficha já mostra o que é dito. `legenda: true` num momento de ficha no peito mantém a legenda acima da ficha; nos momentos de ficha em cima ela nunca aparece. `semLegenda` tira a legenda de um trecho: `[{ "de": 1.2, "ate": 2.0 }]`.
- **Correções**: `{ "leite condenado": "leite condensado" }` — uma ou mais palavras seguidas viram outra coisa na legenda; `""` apaga. Só corrija o que você tem certeza.
- **"pra" e "pro"**: a transcrição costuma escrever "para" e "para o". Pode escrever "pra"/"pro" nos textos da ficha: o template casa as duas formas com a fala.
- **Sons** (automáticos, raros e tonais): um "vum" grave quando a ficha sobe; uma nota curta (subindo de altura) quando cada ingrediente pousa na panela; dois tons graves quando o número do passo rola; um sopro grave quando o fogo acende; um tom que desce quando desliga; um acorde curto e macio quando a fita marca a receita. Nunca dois sons a menos de 0,42 s um do outro. `"sfx": false` desliga.

## 10. Exemplo completo

Brigadeiro de colher, 21,4 s depois dos cortes ("Brigadeiro de colher cremoso em três passos. Uma lata de leite condensado, uma colher de manteiga e três colheres de chocolate em pó. Primeiro: tudo na panela, fogo baixo, mexendo sem parar. Segundo: quando der pra ver o fundo da panela, desliga. Terceiro: passa pro pote ainda quente e deixa esfriar. Salva essa receita e me marca quando fizer."). Cortes em 2,99 · 8,08 · 12,09 · 15,41 · 18,68 — exatamente as fronteiras dos momentos.

```json
{
  "marca": { "nome": "Tiago", "area": "Confeitaria" },
  "cozinha": { "recipiente": "panela", "massa": "massa" },
  "sfx": true,
  "correcoes": { "der para": "der pra", "para o pote": "pro pote" },
  "semLegenda": [],
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 2.99, "rotulo": "Receita",
      "titulo": ["Brigadeiro", "de colher", "cremoso"], "destaque": "cremoso",
      "passos": { "em": 2.16, "total": 3 } },
    { "tipo": "ingredientes", "de": 2.99, "ate": 8.08, "pessoa": "sup-dir",
      "itens": [
        { "em": 3.08, "quantidade": "1", "unidade": "lata", "nome": "leite condensado", "icone": "lata" },
        { "em": 4.9, "quantidade": "1", "unidade": "colher", "nome": "manteiga", "icone": "colher" },
        { "em": 6.26, "quantidade": "3", "unidade": "colheres", "nome": "chocolate em pó", "icone": "pote" } ] },
    { "tipo": "passo", "de": 8.08, "ate": 12.09, "pessoa": "sup-esq", "numero": 1, "numeroEm": 8.18,
      "titulo": ["Tudo na panela"],
      "itens": [ { "em": 10.12, "texto": "fogo baixo", "acao": "fogo-baixo" },
                 { "em": 11.01, "texto": "mexendo sem parar", "acao": "mexer" } ] },
    { "tipo": "passo", "de": 12.09, "ate": 15.41, "pessoa": "sup-dir", "numero": 2, "numeroEm": 12.2,
      "titulo": ["Quando der pra ver", "o fundo da panela"], "destaque": "o fundo",
      "itens": [ { "em": 13.88, "acao": "fundo" },
                 { "em": 14.8, "texto": "desliga", "acao": "desligar" } ] },
    { "tipo": "passo", "de": 15.41, "ate": 18.68, "pessoa": "sup-esq", "numero": 3, "numeroEm": 15.51,
      "titulo": ["Passa pro pote"],
      "itens": [ { "em": 16.38, "acao": "pote" },
                 { "em": 16.99, "texto": "ainda quente", "acao": "quente" },
                 { "em": 17.89, "texto": "deixa esfriar", "acao": "esfriar" } ] },
    { "tipo": "cta", "de": 18.68, "ate": 21.36,
      "linhas": ["Salva essa", "receita", "e me marca quando fizer"], "icone": "salvar", "em": 18.76 }
  ]
}
```

Repare: no passo 2, "o fundo da panela" está no título (com grifo) e o item `fundo` não tem texto — a panela mostra o fundo aparecendo, sem repetir a frase; no passo 3, o item `pote` também é só ação, porque o título já diz "Passa pro pote".
