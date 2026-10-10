# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `cabecalho`, `momentos`, `semLegenda` e `correcoes` (e `moeda`, se precisar).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: o rolo × a tira
3. Blocos de tira (`abertura`, `numero`, `destaque`, `definicao`, `frase`, `pergunta`, `cta`)
4. Blocos do rolo (`topicos`, `passos`, `comparacao`, `grafico`)
5. A assinatura: `conta` e `fechamento`, e as linhas do cupom
6. Limites de texto
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "cabecalho": "Cripto em alta",
  "moeda": "US$",
  "sfx": true,
  "correcoes": { "478": "4-7-8" }
}
```

- `cabecalho`: o título do cupom ("CONTA DO CAFÉ", "RESPIRAÇÃO 4-7-8", "CRIPTO EM ALTA"), impresso no alto do rolo e na primeira tira, se ela abre o vídeo. Até ~16 caracteres. Tudo no cupom sai em caixa-alta: escreva normal, o template converte.
- `marca`: `nome` e `area` saem no cabeçalho do rolo e no rodapé (`cta`, `fechamento`). Nome até ~16 caracteres, área até ~22. Vazios = o cupom sai sem eles.
- `moeda`: a moeda dos valores em número das linhas `item`, `total` e `campos` da `conta` (padrão `"R$"`; `"US$"`, `"€"`; `""` = sem moeda). O bloco `numero` usa o próprio `prefixo`.
- `layout`: deixe de fora (padrão `"cima"`). O exemplo do modelo usa `"lado"`: o rolo de um lado e a pessoa num cartão estreito do outro, trocando de lado a cada etapa. Só serve para gravação com a pessoa parada no centro; quem se mexe sai do cartão.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. A tira nunca sobe acima de `zona.topo` (logo abaixo do queixo).

## 2. A gramática: o rolo × a tira

| Lugar | Blocos (padrão) | A pessoa | O papel |
|---|---|---|---|
| **Tira** (quadro cheio) | `abertura`, `numero`, `destaque`, `definicao`, `frase`, `pergunta`, `cta` e trechos sem momento | rosto na linha do centro | um pedaço curto de cupom na altura do peito, abaixo do queixo, alternando esquerda e direita; sobe do pé do quadro e cai quando o momento acaba |
| **Rolo** (tela dividida) | `conta`, `fechamento`, `topicos`, `passos`, `comparacao`, `grafico` | numa moldura larga embaixo (1048 × 944 px, cantos de 24 px), com folga para se mexer | um cupom só, comprido (1,25×), centrado em cima, saindo de trás da moldura; a última linha fica logo acima dela e o papel rola para cima |

`"quadro": "cheio"` ou `"quadro": "dividido"` em qualquer momento troca o lugar padrão (ex.: uma `pergunta` com opções ou uma `definicao` no rolo; uma `conta` curta numa tira).

O template já faz sozinho:

- **O rolo é um só.** Tudo o que vai para o rolo imprime no mesmo papel, em ordem. Ele começa com o cabeçalho (título, nome e área) já impresso e **cada momento do rolo depois do primeiro abre com a linha de corte** (tracejado com a tesoura correndo). A cada etapa o rolo dá um passo de 30 px para um lado ou para o outro.
- **Troca de lugar**: a pessoa encolhe para a moldura (ou cresce para o quadro cheio) começando 0,2 s antes do `de` (0,62 s, macio nas duas pontas); o corte da fala na fronteira cai no meio do movimento. Quando ela cresce, cobre o rolo, que espera atrás dela; quando encolhe, o rolo aparece já impresso.
- **Nada sobre o rosto**: a tira cai 0,1 s antes de a pessoa encolher e só sobe quando ela já cresceu, e nunca passa de `zona.topo`. O rolo fica sempre atrás da moldura.
- **A tira não espera em branco**: ela sobe no máximo 0,5 s antes da primeira linha. Duas tiras seguidas se cruzam: a velha cai enquanto a nova sobe do outro lado. A tira sai a 115% e, se o conteúdo for alto demais para o espaço abaixo do queixo, diminui (até 72%).
- **Esboço a lápis**: valores, casas, colunas do gráfico e a caixa do carimbo esperam tracejados e ganham tinta na palavra.
- **Texto que cabe**: cada linha mede o texto (a fonte é mono: medir é contar letras) e diminui o corpo até caber, em até 2 ou 3 linhas; palavra maior que a linha é partida com hífen. Os limites da seção 6 existem para o texto não ficar pequeno.
- **Pausa de mais de 1,1 s sem momento**: a pessoa volta ao quadro cheio, com legenda.
- **Último momento**: fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, na pausa entre as frases (de preferência num valor de `cortesEm`).
- **Alterne os lugares**: depois de um ou dois momentos no rolo, uma tira, e vice-versa; nunca três momentos do mesmo tipo seguidos. Abra com uma tira e feche com o `cta` (ou um `fechamento`).

## 3. Blocos de tira

Palavras de frases entram **no instante em que são ditas** (o template procura cada palavra na fala a partir do `em`): use as palavras que a pessoa diz, na ordem em que diz (pode pular palavras). Números em algarismo ("4") casam com a palavra falada ("quatro").

### `abertura`: a promessa, a pergunta, o tema

```json
{ "tipo": "abertura", "de": 0, "ate": 2.8, "texto": "Quando bater a ansiedade", "destaque": "ansiedade" }
```

- `texto`: até ~45 caracteres (até 3 linhas, 60 a 52 px).
- `em` (opcional, também em `frase`, `pergunta` e `cta`): o instante em que o **texto** começa a ser dito, quando o momento começa antes dele. Padrão: `de`.
- `destaque` (opcional): trecho exato que ganha marca-texto magenta quando é dito; o template evita partir esse trecho entre duas linhas.
- Abrindo o vídeo, a tira já vem com o `cabecalho` impresso no alto (a capa do post).

### `numero`: um número que conta

```json
{ "tipo": "numero", "de": 0, "ate": 3.85, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
```

- `valor` (número inteiro: 83000, não 83), `em` (a palavra do número: a contagem começa ali e dura ~1 s), `rotulo` (o que é, até ~30 caracteres, em até 2 linhas, sai como "= BITCOIN ROMPEU"). `rotuloEm` (opcional) = quando o rótulo imprime (padrão: o `de`).
- `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "dias", "kg") saem menores ao lado. `casas`: casas decimais (1,5 → `"valor": 1.5, "casas": 1`). Formato pt-BR automático (83.000; 1,5).
- `ilustrativo: true` põe a etiqueta ILUSTRATIVO embaixo do número.

### `destaque`: uma palavra ou frase curta que bate forte

```json
{ "tipo": "destaque", "de": 13.4, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.82, "nivel": "alerta" }
```

- `texto`: até ~30 caracteres. `em`: a palavra que carrega o golpe.
- `nivel`: `"alerta"` (risco, erro, perda, aviso) = um **carimbo magenta** com o texto (1 a 3 linhas, o maior corpo que cabe), que bate em `em`; até lá a caixa dele espera tracejada. `"chave"` (padrão) = o texto grande (64 a 52 px) palavra por palavra, e o marca-texto magenta varre a frase inteira depois da última palavra.
- `detalhe` (opcional, até ~30 caracteres) e `detalheEm`: uma nota cinza embaixo.
- Um carimbo por vídeo é o ideal (no máximo dois): é o acento mais forte do modelo.

### `definicao`: um termo explicado

```json
{ "tipo": "definicao", "de": 3.85, "ate": 8.67, "termo": "Novo bull market", "em": 5.05, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` (até ~30 caracteres, 2 linhas) palavra por palavra a partir de `em`; em `significadoEm` imprime "= SIGNIFICADO" (até ~50 caracteres, 3 linhas) e o termo ganha marca-texto.

### `frase`: frase de efeito, opinião, conclusão

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.23, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro" }
```

- `texto`: até ~50 caracteres (até 3 linhas), fiel ao que foi dito.
- `destaque`: trecho exato com marca-texto. `risco`: trecho exato riscado em magenta logo depois de ser dito (o que **não** é); `riscoEm` força o instante.

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 24.21, "ate": 28.03, "texto": "Como avaliar projetos e seu posicionamento?", "em": 24.58 }
{ "tipo": "pergunta", "quadro": "dividido", "de": 35.23, "ate": 40.05, "texto": "Você quer…",
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~45 caracteres (até 3 linhas).
- Sem `opcoes`: depois da última palavra, uma linha a lápis para responder corre pelo papel.
- `opcoes` (opcional): 2 a 4 linhas com uma caixinha de marcar, cada uma no `em` da palavra que a nomeia, até ~28 caracteres. Com 3 ou 4 opções, prefira o rolo (`"quadro": "dividido"`): a tira fica alta.

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais", "icone": "link", "destaque": "Saiba Mais" }
```

- `texto`: a chamada falada, até ~30 caracteres (64 a 50 px).
- `icone`: `salvar`, `seguir`, `comentar` ou `link` (outro valor reprova no `conferir`), desenhado em magenta no fim da última linha. `destaque`: trecho com marca-texto.
- Depois da última palavra dita, o rodapé do cupom imprime: nome · área e o código de barras.

## 4. Blocos do rolo

Tudo em linhas de cupom, uma embaixo da outra. Itens de 42 a 54 px (no papel; na tela, 1,25×), títulos de 36 a 44.

### `topicos`: lista sem ordem (motivos, erros, dicas, sinais)

```json
{ "tipo": "topicos", "de": 3.0, "ate": 9.0, "titulo": "Três sinais",
  "itens": [ { "texto": "Dorme mal", "em": 3.4 },
             { "texto": "Irrita à toa", "em": 5.1, "detalhe": "por coisa pequena" },
             { "texto": "Não desliga", "em": 7.2 } ] }
```

- `titulo` (opcional): até ~32 caracteres, centrado, com um fio tracejado embaixo; imprime quando começa a ser dito (ou no `de`).
- `itens`: 2 a 5, cada um com `texto` (2 a 6 palavras, até ~34 caracteres, 2 linhas), `em` e `detalhe` opcional (até ~36, em cinza). Cada item tem um quadrado de tinta que bate no seu `em` e o pontilhado corre até a borda.

### `passos`: sequência em ordem (processo, caminho, como fazer)

```json
{ "tipo": "passos", "de": 30.0, "ate": 33.75, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- Os mesmos campos do `topicos`. Cada passo tem o número numa caixa, ligada à do próximo por um tracejado; a caixa do passo da vez fica cheia de tinta até o próximo ser dito.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 13.4, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "Seu bolso", "texto": "Sem dinheiro", "em": 11.78 } ] }
```

- `lados`: exatamente 2, cada um com `rotulo` (o nome do lado, até ~20 caracteres, cinza), `texto` (até ~28 caracteres, 2 linhas, grande) e `em`. O lado B imprime com a separação logo antes dele.
- `modo`: `"contra"` (padrão, "VS" magenta), `"antes-depois"` (seta para baixo) ou `"errado-certo"` (seta; o primeiro lado é o errado e ganha risco magenta e um ✕, o segundo ganha o selo ✓; troque com `vencedor: 0`).
- `vencedor` (0 ou 1) e `vencedorEm` (opcional): o lado que ganha leva o selo ✓ e o outro fica cinza. Sem `vencedorEm`, a marca entra ~0,35 s depois do lado B.

### `grafico`: números que sobem, caem ou se dividem

```json
{ "tipo": "grafico", "de": 5.0, "ate": 9.5, "titulo": "Vendas por mês", "forma": "barras", "unidade": "mil",
  "dados": [ { "rotulo": "Jan", "valor": 12, "em": 5.4 }, { "rotulo": "Fev", "valor": 18, "em": 6.6 }, { "rotulo": "Mar", "valor": 31, "em": 7.9 } ] }
{ "tipo": "grafico", "de": 8.7, "ate": 11.0, "titulo": "O mercado", "forma": "linha", "tendencia": "sobe", "tendenciaEm": 9.31, "ilustrativo": true }
```

- `forma`: `"barras"`, `"linha"` ou `"pizza"`.
- `dados` (números **ditos**): 2 a 6, cada um com `rotulo` (até ~8 caracteres; com 5 ou 6 dados, ~5), `valor` e `em`. Cada barra sobe, cada ponto da linha se liga ao anterior, cada fatia da pizza se varre no seu `em`; o dado da vez fica magenta. `unidade` (opcional, até ~12 caracteres) sai no alto e junto dos valores ("%", "mil", "kg").
- Sem números ditos: `tendencia` (`"sobe"`, `"cai"`, `"oscila"`), `tendenciaEm` (quando a forma começa a ser traçada, ~1,5 s) e `ilustrativo: true` (obrigatório; a etiqueta ILUSTRATIVO aparece). Em `barras`, as colunas sobem em sequência na forma da tendência; em `linha`, a linha é traçada e termina com uma seta magenta.
- Um só número dito não é gráfico: use `numero`.

## 5. A assinatura: `conta` e `fechamento`

A `conta` é o coração do modelo: uma etapa de conta impressa (itens, operações, casas que se preenchem e o resultado). Funciona com números ditos e sem eles (veja "A assinatura em qualquer assunto" no SKILL.md). O `fechamento` é uma `conta` que termina com o rodapé do cupom e fica até o último quadro.

```json
{ "tipo": "conta", "de": 14.93, "ate": 24.21, "linhas": [
  { "tipo": "texto", "em": 14.93, "texto": "Mesmo na alta" },
  { "tipo": "nota", "em": 15.96, "texto": "Tem gente que perde:" },
  { "tipo": "item", "em": 17.73, "texto": "Compra por impulso", "valor": "−", "valorEm": 18.45 },
  { "tipo": "item", "em": 19.21, "texto": "Moeda sem critério", "valor": "−", "valorEm": 20.43 },
  { "tipo": "item", "em": 21.25, "texto": "Risco sem entender", "valor": "−", "valorEm": 22.86 },
  { "tipo": "total", "em": 22.86, "texto": "Saldo", "resultado": "Perde", "contaDe": 23.0, "contaAte": 23.45 } ] }
```

- `linhas`: as linhas do cupom, na ordem em que imprimem (uma linha nunca imprime antes da anterior).
- `corte`: `false` tira a linha de corte do começo; `{ "riscaEm": 11.16 }` faz a tesoura parar no meio e levar um "não" magenta (para "não é pra cortar…").
- `quadro: "cheio"`: a conta sai numa tira (só para contas curtas, até ~4 linhas).
- `fechamento` aceita também `rodapeEm` (padrão: logo depois da última palavra dita).

### As linhas

**`item`** — "CAFÉ ........ R$ 8,00"

```json
{ "tipo": "item", "em": 0.45, "texto": "Café", "icone": "xicara", "valor": 8, "valorEm": 0.94 }
{ "tipo": "item", "em": 5.92, "texto": "Inspira pelo nariz", "valor": "4", "valorEm": 7.7 }
```

- `em`: a palavra do item. `valorEm`: a palavra do valor (até lá o valor espera a lápis).
- `valor` em número: sai com a `moeda` do plano e 2 casas ("R$ 8,00"); `prefixo`, `sufixo` e `casas` trocam isso só nesta linha (`"prefixo": "", "casas": 0, "sufixo": "min"` → "15 MIN"). Negativo sai em magenta ("− R$ 30,00").
- `valor` em texto: sai como está ("4", "ALTO", "3×"); `"−"` (o que tira) sai em magenta, `"+"` (o que soma) em tinta. Sem `valor`, só o nome e o pontilhado.
- `icone` (opcional, só se for óbvio): `xicara`, `carrinho`, `casa`, `celular`, `cartao`, `moeda`, `calendario`, `relogio`, `coracao`, `alerta`, `grafico`, `lapis`, `balao`.
- Nome longo quebra em 2 linhas com o valor no fim da última.

**`nota`** — linha cinza de detalhe, recuada ("1× POR DIA", "TEM GENTE QUE PERDE:"). Até ~24 caracteres.

**`vezes`** — a operação: "DIAS ÚTEIS ........ × 22", o sinal em magenta. `fator` é texto, como foi dito ("22", "1,15", "4"); `sinal` opcional: `"+"`, `"−"`, `"÷"`. Com `fatorEm`, a linha pode imprimir antes (no começo da conta) com o fator a lápis ("× __") até a palavra do número.

```json
{ "tipo": "vezes", "em": 13.9, "texto": "Repete", "fator": "4", "fatorEm": 14.45 }
```

**`grade`** — casas que se preenchem (o desenho da conta).

```json
{ "tipo": "grade", "em": 3.26, "forma": "xicaras", "quantidade": 22, "colunas": 5, "rotulos": ["S","T","Q","Q","S"], "encheDe": 5.35, "encheAte": 6.25 }
{ "tipo": "grade", "em": 7.84, "forma": "degraus", "quantidade": 12, "rotulos": ["J","F","M","A","M","J","J","A","S","O","N","D"], "encheDe": 8.51, "encheAte": 9.6 }
```

- `forma`: `"pontos"` (uma bolinha por casa), `"casas"` (quadrados que enchem de tinta), `"xicaras"`, `"moedas"` ou `"degraus"` (uma barra por unidade, cada uma mais alta: o acumulado).
- Casas: impressas a lápis numa rajada curta a partir de `em`, em linhas de `colunas` (até 7; até ~35 casas); `rotulos` vira um cabeçalho das colunas. Degraus: até ~16, `rotulos` embaixo.
- `encheDe`/`encheAte`: quando as casas ganham tinta, uma a uma (use os mesmos tempos e `passos` = `quantidade` do `total` que conta junto).
- `ilustrativo: true` quando a quantidade não foi dita (a etiqueta aparece em cima).

**`total`** — o resultado.

```json
{ "tipo": "total", "em": 5.02, "texto": "Por mês", "valor": 176, "passos": 22, "contaDe": 5.35, "contaAte": 6.25 }
{ "tipo": "total", "em": 8.3, "texto": "Por ano", "valor": 2112, "passos": 12, "contaDe": 8.51, "contaAte": 9.6, "carimbo": { "texto": "Parece nada?", "em": 9.72 } }
{ "tipo": "total", "em": 22.86, "texto": "Saldo", "resultado": "Perde", "contaDe": 23.0, "contaAte": 23.45 }
```

- Fio duplo, "= RÓTULO" (`texto`, até ~22 caracteres) e o valor grande à direita (formato pt-BR, moeda do plano; `prefixo`/`sufixo`/`casas` como no `item`).
- `em`: a palavra que anuncia o resultado ("são", "dá", "vira"). O número nasce a lápis em branco. `contaDe`/`contaAte`: a fala do número; ele conta em `passos` degraus iguais (sem `passos`, aparece de uma vez em `contaDe`).
- `resultado` (no lugar de `valor`): o resultado em palavras (até ~12 caracteres), impresso grande letra a letra de `contaDe` a `contaAte`. `ilustrativo: true` põe a etiqueta embaixo.
- `carimbo` (opcional, um por vídeo): bate em `carimbo.em` em papel livre, nunca sobre texto (no canto vazio dos `degraus` logo antes, em 2 linhas de ~10 caracteres; sem degraus, numa linha de ~12 à direita do rótulo). Um eco curto da fala ("PARECE NADA?"), nunca um número novo.

**`texto`** — frase impressa grande (60 a 52 px, até 3 linhas de ~16 caracteres), palavra por palavra. `grifo`/`grifoEm`: marca-texto magenta; `risco`/`riscoEm`: risco magenta; `icone`/`iconeEm`: ícone magenta no fim.

**`campos`** — campos em branco para quem assiste preencher ("SEG ...... R$ ____"), em rajada de `em` a `ate`, com `titulo` opcional ("POR 1 SEMANA"). Itens de até 4 caracteres, até 8. `moeda: false` tira o "R$".

**`corte`** — linha de corte extra no meio da conta (`riscaEm` opcional).

## 6. Limites de texto

| Onde | Limite |
|---|---|
| `cabecalho` | ~16 caracteres |
| `marca` | nome ~16, área ~22 |
| `abertura`, `frase` | ~45–50 caracteres (3 linhas) |
| `destaque` | ~30 caracteres (carimbo em até 3 linhas) |
| `numero.rotulo` | ~30 caracteres (2 linhas) |
| `definicao` | termo ~30, significado ~50 |
| `pergunta` | texto ~45; opções ~28 cada, 2 a 4 |
| `cta` | ~30 caracteres |
| `topicos`/`passos` | título ~32; itens ~34 (2 a 5); detalhe ~36 |
| `comparacao` | rótulo ~20; texto ~28 |
| `grafico` | título ~32; rótulos ~8 (5 ou 6 dados: ~5); 2 a 6 dados |
| `item` | ~36 caracteres com o valor (2 linhas) |
| `nota` | ~24 caracteres |
| `vezes` | texto ~13, fator ~4 |
| `total` | rótulo ~22; valor até 999.999,99; `resultado` ~12 |
| `carimbo` (do total) | 2 linhas de ~10 (com degraus) ou 1 de ~12 |

Passou do limite, o texto diminui até o mínimo legível e quebra mais; encurte com as palavras da fala.

## 7. Regras de tempo

- **Cada coisa no `em` da palavra que ela ilustra**: o item na palavra do item, o valor na palavra do valor, o lado na palavra do lado, o dado na palavra do número. Linhas a menos de 0,03 s uma da outra são empurradas.
- **Momentos de 1,5 a 6 s**: a troca de lugar leva 0,62 s; um momento de rolo muito curto mal aparece. Momento de mais de ~4 s precisa de linhas entrando por dentro dele.
- **Nada parado por mais de ~2,5 s**: se um trecho fala muito sem nada novo, acrescente uma `nota`, um item ou divida o momento.
- **O carimbo** bate pelo menos 0,3 s antes do `de` do próximo momento.
- **A primeira linha de um momento do rolo** imprime junto da troca: deixe-a para depois de `de` + 0,3 s quando der (o olho ainda está no movimento).
- **A tira** precisa de pelo menos ~1,2 s: ela sobe, imprime e cai.

## 8. Legenda, correções e sons

- **Legenda**: uma tira de papel com a frase (48 px), a palavra da vez sublinhada em magenta. Só aparece nas pausas sem momento e em momentos com `legenda: true` (na tela dividida ela vai no pé da moldura e pode cobrir o queixo; evite). `semLegenda` tira trechos extras.
- **Correções**: `{ "478": "4-7-8", "para": "pra" }` valem para a legenda e para a procura das palavras dos textos.
- **Sons** (o template põe sozinho): duas notas quando um total ou número termina de contar e quando o lado certo da comparação ganha o selo; um baque grave em cada carimbo; duas notas descendo quando a tesoura leva o "não" ou uma frase é riscada; um acorde curto quando o rodapé imprime. Nunca dois a menos de 0,45 s.

## 9. Exemplos completos

### Cripto (43 s), com os blocos universais e a conta

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "cabecalho": "Cripto em alta",
  "moeda": "US$",
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 3.85, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" },
    { "tipo": "definicao", "quadro": "dividido", "de": 3.85, "ate": 8.67, "termo": "Novo bull market", "em": 5.05, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.67, "ate": 13.4, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "Seu bolso", "texto": "Sem dinheiro", "em": 11.78 } ] },
    { "tipo": "destaque", "de": 13.4, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.82, "nivel": "alerta" },
    { "tipo": "conta", "de": 14.93, "ate": 24.21, "linhas": [
      { "tipo": "texto", "em": 14.93, "texto": "Mesmo na alta" },
      { "tipo": "nota", "em": 15.96, "texto": "Tem gente que perde:" },
      { "tipo": "item", "em": 17.73, "texto": "Compra por impulso", "valor": "−", "valorEm": 18.45 },
      { "tipo": "item", "em": 19.21, "texto": "Moeda sem critério", "valor": "−", "valorEm": 20.43 },
      { "tipo": "item", "em": 21.25, "texto": "Risco sem entender", "valor": "−", "valorEm": 22.86 },
      { "tipo": "total", "em": 22.86, "texto": "Saldo", "resultado": "Perde", "contaDe": 23.0, "contaAte": 23.45 } ] },
    { "tipo": "pergunta", "de": 24.21, "ate": 28.03, "texto": "Como avaliar projetos e seu posicionamento?", "em": 24.58 },
    { "tipo": "destaque", "de": 28.03, "ate": 30.0, "texto": "Aula gratuita", "em": 28.62, "nivel": "chave" },
    { "tipo": "passos", "de": 30.0, "ate": 33.75, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.23, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro" },
    { "tipo": "pergunta", "quadro": "dividido", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais", "em": 40.05, "destaque": "Saiba Mais", "icone": "link" }
  ]
}
```

### Finanças do dia a dia (o exemplo do modelo, 17,9 s, layout "lado")

```json
{
  "marca": { "nome": "Tiago", "area": "Dinheiro no dia a dia" },
  "cabecalho": "Conta do café",
  "layout": "lado",
  "correcoes": { "para": "pra" },
  "momentos": [
    { "tipo": "conta", "quadro": "cheio", "de": 0, "ate": 3.13, "legenda": true, "linhas": [
      { "tipo": "item", "em": 0.45, "texto": "Café", "icone": "xicara", "valor": 8, "valorEm": 0.94 },
      { "tipo": "nota", "em": 1.66, "texto": "1× por dia" } ] },
    { "tipo": "conta", "de": 3.13, "ate": 7.52, "linhas": [
      { "tipo": "vezes", "em": 3.16, "fator": "22", "fatorEm": 3.48, "texto": "Dias úteis" },
      { "tipo": "grade", "em": 3.26, "forma": "xicaras", "quantidade": 22, "colunas": 5, "rotulos": ["S","T","Q","Q","S"], "encheDe": 5.35, "encheAte": 6.25 },
      { "tipo": "total", "em": 5.02, "texto": "Por mês", "valor": 176, "passos": 22, "contaDe": 5.35, "contaAte": 6.25 } ] },
    { "tipo": "conta", "de": 7.52, "ate": 10.13, "linhas": [
      { "tipo": "vezes", "em": 7.62, "fator": "12", "texto": "Meses" },
      { "tipo": "grade", "em": 7.84, "forma": "degraus", "quantidade": 12, "rotulos": ["J","F","M","A","M","J","J","A","S","O","N","D"], "encheDe": 8.51, "encheAte": 9.6 },
      { "tipo": "total", "em": 8.3, "texto": "Por ano", "valor": 2112, "passos": 12, "contaDe": 8.51, "contaAte": 9.6, "carimbo": { "texto": "Parece nada?", "em": 9.72 } } ] },
    { "tipo": "conta", "de": 10.13, "ate": 13.64, "corte": { "riscaEm": 11.16 }, "linhas": [
      { "tipo": "texto", "em": 10.23, "texto": "Não é pra cortar o café." },
      { "tipo": "texto", "em": 11.46, "texto": "É pra saber pra onde vai o seu dinheiro.", "grifo": "saber" } ] },
    { "tipo": "fechamento", "de": 13.64, "ate": 17.88, "linhas": [
      { "tipo": "texto", "em": 13.74, "texto": "Anota seus gastos pequenos" },
      { "tipo": "campos", "em": 15.3, "ate": 15.85, "titulo": "Por 1 semana", "itens": ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"] },
      { "tipo": "texto", "em": 15.9, "texto": "E me conta o resultado.", "icone": "balao" } ] }
  ]
}
```

Contas conferidas: 8 × 22 = 176; 176 × 12 = 2.112. Num vídeo de aluno, deixe o `layout` de fora e misture a conta com os blocos de tira (`numero` para o "café de oito reais", `frase` para "não é pra cortar o café").
