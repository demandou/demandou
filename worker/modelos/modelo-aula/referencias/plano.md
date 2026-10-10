# O plano da Aula (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo 1920×1080, `rosto` com o rastro e o quadro, `cortesEm`, `palavras`). Você escreve `marca`, `aula`, `momentos`, `legendas`, `correcoes`, `semLegenda` e, se quiser, `sfx`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa e o `ferramentas/timing.mjs` reprova o que passar de ±0,15 s). Se a própria palavra está com o tempo errado, confira com `ferramentas/ataques.mjs` e corrija em `palavras`.

## Os dois modos (o template escolhe sozinho)

- **Modo professor** (quadro cheio, cartão de papel no lado livre): `capitulo`, `abertura`, `destaque`, `frase`, `cta`. Sem momento nenhum, também é modo professor (só a pessoa).
- **Modo slide** (o slide ocupa ~62% e o professor vai para a janela ao lado): `slide`, `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao`, `pergunta`.
- **Toda troca de modo é seca, como um corte:** o professor vai direto para a janela (ou volta direto para o quadro cheio); o conteúdo do slide entra no lugar (aparece e sobe 12 px em 0,22 s). A janela nunca passa por cima do texto do slide.
- Um bloco de professor que cai **dentro** de um slide é a **virada**: o professor volta para o quadro cheio e, quando ela acaba, o slide continua de onde estava. Comece a virada num corte quando der.
- Dois slides seguidos: o conteúdo de um sai (0,16 s) e o do outro entra no lugar; nunca os dois ao mesmo tempo, nada cortado ao meio.
- Os cartões do modo professor aparecem e somem secos junto com o corte (no começo do vídeo, num corte do motor ou numa troca de modo); fora disso, entram deslizando. **O cartão do professor termina no `de` do slide.**
- Os cartões ficam embaixo no lado livre, todos com 840 px de largura: cobrem o que estiver na mesa ao lado da pessoa.

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "Prof. Daniel Arruda", "area": "Matemática financeira" }`. Vai no pé do cartão de capítulo (quando ele fica ≥ 1,2 s legível depois do título) e numa etiqueta dentro da janela, no primeiro slide. `nome: ""` = sem nome. Nome masculino ou feminino conforme a pessoa do vídeo; nunca invente |
| `aula` | `{ "numero": "Aula 3", "titulo": "Juros compostos", "de": 0, "secoes": [{ "texto": "Juro simples", "de": 3.13 }, …] }`. O cabeçalho no alto (texto de 28 a 30 px): o número (do usuário; sem ele, omita), o título e a barra de progresso com um trecho por seção (o da vez enche com o tempo) e o nome da seção da vez. `secoes`: 2 a 6, nomes de até ~16 caracteres na voz da fala, `de` no corte ou na primeira palavra do assunto. `de: 0` = o cabeçalho já está no quadro 0 (padrão: quando o primeiro `capitulo` acaba) |
| `cauda` | `{ "de": 19.4 }`: o fim. Logo depois da última palavra (`de`), o professor sai da janela (0,28 s) e o último slide (o resumo, a fórmula) vai para o centro da tela (0,45 s), com o cabeçalho junto; o vídeo segue até `duracao` (~1,2 s depois da última palavra). `de` + 0,35 s precisa caber no vídeo de trabalho (a duração que o `cortar` escreveu). Sem `cauda`, o vídeo termina ~0,3 s depois da última palavra |
| `legendas` | `false` (padrão) ou `true`: legenda discreta, até 2 linhas, embaixo do slide (o slide encolhe para ela caber) ou embaixo no centro, no modo professor |
| `sfx` | `true` (padrão): um "virar de página" tonal nas trocas de modo e de slide e um toque quando a fórmula fecha. `false` desliga. Nunca sino |
| `correcoes` | `{ "sob": "sobre", "1.000,00": "1.000" }`: troca uma ou mais palavras seguidas na legenda e nas conferências |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (só vale com `legendas: true`) |
| `legenda` (em qualquer momento) | só com `legendas: true`: `false` tira a legenda durante o momento. Padrão: continua nos slides, no capítulo e no destaque; some na abertura, na frase e no cta |

## A assinatura: `slide`

```json
{ "tipo": "slide", "de": 13.85, "ate": 19.64, "titulo": "Anote a fórmula", "em": 13.98, "destaque": "fórmula",
  "resumo": { "em": 14.32, "itens": ["Simples: sobre o valor inicial", "Composto: sobre o valor que já cresceu", "R$ 1.000 → R$ 1.127 em 1 ano"] },
  "formula": [ { "texto": "M", "em": 15.0 }, { "texto": "=", "em": 15.5 }, { "texto": "C", "em": 15.98 }, { "texto": "·", "em": 16.64 },
               { "texto": "(1", "em": 17.5 }, { "texto": "+", "em": 17.92 }, { "texto": "i)", "em": 18.56 }, { "texto": "t", "em": 19.16, "sup": true } ] }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `titulo` | sim | até ~60 caracteres (2 linhas de 40 a 64 px), com as palavras da fala; cada palavra entra quando é dita (a que não foi dita igual entra logo depois da anterior). `em`: a primeira palavra (padrão `de`) |
| `destaque` | não | trecho exato do `titulo` que ganha o marca-texto violeta (passa por trás das palavras na hora em que são ditas) |
| `rotulo` | não | sobretítulo em caixa alta, até ~30 caracteres ("Conceito", "Exemplo", o nome do capítulo). Com `resumo` e sem `rotulo`, vira "Resumo da aula" |
| `itens` | não | 2 a 5 linhas `{ "texto", "em", "detalhe"? }` que entram uma a uma (texto até ~70 caracteres, até 2 linhas; `detalhe` até ~50, uma linha cinza). A da vez em tinta com o quadradinho violeta; as anteriores em cinza. `numerar: true` troca o quadradinho por selos 1, 2, 3 |
| `formula` | não | 1 a ~12 termos `{ "texto", "em", "sup"? }`, **exatamente os ditos**, cada um na palavra dele. Letras em itálico (STIX Two), números e operadores retos; operadores (`= + − × · / < >`) ganham espaço dos lados; `sup: true` é expoente. O termo da vez acende (violeta + marca-texto) e assenta em tinta quando o próximo é dito; completa, a fórmula ganha a moldura violeta e o lápis. Junte o parêntese ao termo ("(1", "i)"). A caixa aparece vazia no `em` do slide e o corpo diminui sozinho até caber (mínimo ~56 px) |
| `termos` | não | `[{ "texto": "alta", "em": 15.48 }]`: palavras do título que acendem de novo (marca-texto) quando são ditas depois |
| `resumo` | não | o cartão de resumo da aula, no pé do slide: `itens` = 2 a 4 frases curtas (até ~50 caracteres) **do que já foi dito antes**; o trecho antes dos dois-pontos fica em tinta. Entram a partir de `resumo.em` (uma palavra do fim: "anota", "resumindo", "então"), uma a cada 0,22 s. `titulo` opcional em cima |
| `de`, `ate` | sim | `de` num corte ou na primeira palavra da ideia; `ate` no `de` do próximo bloco (ou no fim do vídeo). Com itens e fórmula juntos, a metade de cima é dos itens |

## Os outros efeitos próprios

### `capitulo` (a capa da aula)
`{ "tipo": "capitulo", "de": 0, "ate": 3.13, "numero": "Aula 3", "numeroEm": 0.58, "texto": "Juros compostos", "em": 1.94 }`
- Modo professor. A capa já abre completa (no quadro 0, quando `de` é 0): o `numero` (padrão: `aula.numero`), a `chamada` opcional (até ~30 caracteres, cinza, fixa), o `texto` (até ~30 caracteres, até 2 linhas de 64 a 112 px) e o nome do professor (`marca`, 34 a 38 px) no pé quando ela fica ≥ 1,5 s na tela. A fala acende o número (`numeroEm`, a palavra "aula") e cada palavra do título (a partir de `em`) com o marca-texto; o traço violeta se desenha depois da última.
- Use na abertura da aula ("nesta aula…", "hoje…") e em cada mudança grande de assunto num vídeo longo. 2 a 5 s.

## Os blocos universais

### Modo professor

**`abertura`** — `{ "tipo": "abertura", "de": 0, "ate": 4.6, "texto": "O Bitcoin rompeu os 83 mil dólares", "destaque": "83 mil dólares", "em": 0.03 }`
- Cartão no lado livre com o texto (até ~70 caracteres, até 4 linhas de 52 a 96 px) palavra por palavra; `destaque` no marca-texto. Para gancho sem "aula" no começo.

**`destaque`** — `{ "tipo": "destaque", "de": 6.25, "ate": 7.42, "texto": "Juro composto", "em": 6.34 }`
- A virada: cartão embaixo no lado livre com a palavra-chave grande (até ~30 caracteres, até 2 linhas de 56 a 124 px) e o marca-texto que passa por trás; `detalhe` (até ~60) embaixo, em cinza, no `detalheEm`; `nivel: "alerta"` em vermelho. 1 a 3 s, de preferência começando num corte.

**`frase`** — `{ "tipo": "frase", "de": 35.2, "ate": 40.0, "texto": "Quem não tem método vira refém do próprio medo", "destaque": "método", "risco": "refém do próprio medo", "riscoEm": 39.3, "em": 35.9 }`
- Cartão com as aspas violeta e a frase (até ~110 caracteres, até 4 linhas) palavra por palavra; `risco` riscado em vermelho no `riscoEm`.

**`cta`** — `{ "tipo": "cta", "de": 40.05, "ate": 43.0, "texto": "Comenta AULA que eu te mando o material", "icone": "comentar", "destaque": "AULA", "em": 40.05 }`
- Cartão embaixo no lado livre: ícone num selo violeta (`salvar`, `comentar`, `link`, `seguir`) + a chamada palavra por palavra (até ~60 caracteres).

### Modo slide

**`topicos`** e **`passos`** — `{ "tipo": "passos", "de": 5.6, "ate": 8.4, "titulo": "Como montar a carteira", "itens": [{ "texto": "Defina o objetivo", "em": 5.8 }, …] }`
- 2 a 5 itens (até ~70 caracteres, `detalhe` até ~50). `topicos`: quadradinho violeta na linha da vez. `passos`: selos 1, 2, 3 e o fio violeta que desce até o passo da vez. Com sobra de altura, as linhas respiram mais.

**`numero`** — `{ "tipo": "numero", "de": 9.21, "ate": 13.85, "titulo": "Exemplo", "valor": 1127, "em": 12.0, "prefixo": "R$ ", "rotulo": "em 1 ano", "rotuloEm": 13.28, "desde": 1000, "desdeEm": 9.3, "via": "1% ao mês", "viaEm": 10.12 }`
- `valor` e `desde` **ditos**. Conta de `desde` (ou de 0) até `valor` **em 0,36 s** a partir de `em`, em pt-BR: ponha o `em` na primeira palavra do número ("mil" de "mil cento e vinte e sete"), e ele chega no valor enquanto o número é dito. `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", " kg"), `casas`. `titulo` vira o sobretítulo. `rotulo` até ~40 caracteres, no `rotuloEm`.
- Ocupa a folha inteira, centrado, sem caixa. Com `desde`: o valor de partida em cima (`desdeEm`), a etiqueta `via` (o que leva de um ao outro, até ~24 caracteres, no `viaEm`), a seta violeta que desce junto com a contagem e o valor final grande em violeta. Sem `desde`: o número grande e a barra que enche. `ilustrativo: true` põe a etiqueta.

**`comparacao`** — `{ "tipo": "comparacao", "de": 11.2, "ate": 14.0, "titulo": "Antes e depois", "modo": "errado-certo", "lados": [{ "rotulo": "Errado", "texto": "Comprar porque todo mundo compra", "em": 11.4 }, { "rotulo": "Certo", "texto": "Comprar com critério", "em": 12.2 }], "vencedor": 1, "vencedorEm": 13.0 }`
- Duas colunas (texto até ~80 caracteres cada) com "vs" (`contra`) ou "→" (`antes-depois`, `errado-certo`) no meio. O `vencedor` acende em violeta com o visto; o outro apaga (riscado em vermelho no `errado-certo`).

**`grafico`** — três jeitos:
- **`series` (qualitativo, a cara da Aula):** `{ "tipo": "grafico", "de": 3.13, "ate": 9.21, "titulo": "Juro simples × juro composto", "forma": "linha", "tendencia": "sobe", "ilustrativo": true, "eixos": { "x": "tempo", "y": "valor" }, "series": [{ "rotulo": "Juro simples", "em": 3.46, "forma": "reta", "nota": "sempre sobre o valor inicial", "notaEm": 4.64 }, { "rotulo": "Juro composto", "em": 7.66, "forma": "curva", "nota": "sobre o valor que já cresceu", "notaEm": 7.66, "destaque": true }], "base": { "rotulo": "valor inicial", "em": 5.4 }, "diferencaEm": 8.62 }`
  - 1 a 3 séries; `forma`: `reta`, `curva` (cresce cada vez mais e fica sempre acima da reta), `queda`, `plana`. Cada uma se desenha a partir do `em` (até a próxima, 0,8 a 1,4 s); a segunda (ou a com `destaque`) é violeta. A legenda fica no alto à esquerda, com a `nota` palavra por palavra (até ~40 caracteres). `base`: linha tracejada com o rótulo. `diferencaEm`: o sombreado violeta entre as duas primeiras. Sem números: `tendencia` e `ilustrativo: true` são obrigatórios (o `conferir` pede) e a etiqueta "ilustrativo" aparece.
- **`dados` (números ditos):** 2 a 6 `{ "rotulo", "valor", "em" }`; `forma`: `barras` (a última em violeta), `linha` ou `pizza` (rosca com a legenda). `unidade` opcional.
- **Só `tendencia`** (`sobe`, `cai`, `oscila`): uma linha qualitativa com "ilustrativo".

**`definicao`** — `{ "tipo": "definicao", "de": 4.6, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }`
- "DEFINIÇÃO" em cima, o termo enorme em violeta (até ~30 caracteres) com o marca-texto, o fio e o significado (até ~120) palavra por palavra.

**`pergunta`** — `{ "tipo": "pergunta", "de": 2.8, "ate": 5.6, "texto": "Qual destes cresce mais rápido?", "em": 2.9, "opcoes": [{ "texto": "Poupança", "em": 3.5 }, …], "certa": 2, "certaEm": 5.0 }`
- "PERGUNTA" em cima, a pergunta (até ~90 caracteres) palavra por palavra e 2 a 4 alternativas com letra (até ~50 caracteres), cada uma no `em`. `certa` (índice) acende com o visto no `certaEm`; as outras apagam. Sem `opcoes`: um "?" grande.

## Regras de tempo

- **Cada coisa entra na palavra que a nomeia** (±0,15 s). Termos da fórmula: o "=" no "igual", o "·" no "vezes", o "+" no "mais", a letra na letra; o expoente pode entrar no "elevado".
- **Números:** só os ditos. O `timing.mjs` reprova número que não foi falado perto do `em`.
- **Resumo:** só o que já foi dito; o `timing.mjs` confere.
- Slides seguidos: o `ate` de um é o `de` do outro (o conteúdo de um sai e o do outro entra no lugar). Cartão de professor antes de um slide: `ate` do cartão = `de` do slide.
- O último bloco vai até o fim do vídeo (`duracao`): ~0,3 s depois da última palavra, ou ~1,2 s com `cauda` (quando a fala termina na fórmula ou no resumo).
- Nada parado mais de ~2,5 s: se um slide fica muito tempo sem novidade, acrescente um item, um termo que acende ou divida em dois slides.
