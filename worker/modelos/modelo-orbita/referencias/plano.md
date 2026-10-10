# O plano da Órbita (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo 1080×1920, `rosto` com o rastro, `cortesEm`, `palavras`). Você escreve `momentos`, `correcoes`, `semLegenda` e, se houver, `trilha`, `recorte` e `maos`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o começo de uma palavra em `work/palavras.json` (o `conferir` avisa o que cair longe). A única exceção é o `gestoEm`, que o `ferramentas/gesto.mjs` escreve.

## Campos gerais

| Campo | O que é |
|---|---|
| `sfx` | `true` (padrão): o cristal da virada, o recuo, o Sol que apaga (ou acende, ou explode), o céu, a grua entre blocos e um tom baixo por item. `false` desliga. Nunca sino |
| `trilha` | opcional: arquivo de música do usuário em `public/` (sem batida), em loop, baixinho. `trilhaVolume` (padrão 0,12) |
| `recorte` | opcional: `{ "video": "recorte.webm", "de": 0 }`, a pessoa com fundo transparente (VP9 com alfa), na mesma linha do tempo do vídeo de trabalho (`de` = onde cai o quadro 0 dele). No espaço ela aparece recortada, sem moldura, na frente das estrelas; o fundo natural some de cima para baixo. Sem ele, a moldura (o padrão) |
| `maos` | opcional: rastreio das mãos (veja "O gesto") |
| `correcoes` | `{ "chat gpt": "ChatGPT" }`: troca uma ou mais palavras seguidas na legenda |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos extras sem legenda |
| `marca` | `{ "nome", "area" }` do motor; este modelo não tem tarja de nome |

**Legenda:** some durante os blocos universais (o texto já está na tela) e **fica** durante `virada`, `raio`, `orbita` e `ceu` (a fala não está escrita na cena). `legenda: true` ou `false` em qualquer momento muda isso.

**Layout:** fora do espaço, a pessoa fica em quadro cheio. Os momentos do espaço (a órbita, o céu e todos os blocos universais) põem a pessoa na moldura embaixo e a informação em cima. Momentos do espaço com menos de 2,5 s entre eles ficam no **mesmo espaço** (a câmera sobe de um para o outro); mais que isso, a pessoa volta ao quadro cheio no meio. Prefira encadear: ir e voltar muitas vezes cansa.

## Os corpos

Todo lugar que pede um corpo aceita `corpo` (e, onde houver, `cor`, `nome`, `simbolo`, `anel`):

| `corpo` | Como é | Use para |
|---|---|---|
| `sol` | estrela laranja, granulada, com calor em volta; apaga em brasa, acende, explode | o Sol, uma fonte, uma origem que "acende" |
| `estrela` | branco-azulada (longe no céu: só o ponto de luz com raios) | estrelas, uma ideia distante |
| `terra` | a Terra (dia e noite, cidades acesas no lado escuro) | a Terra, "aqui", "você", "hoje" |
| `lua` | a Lua com crateras | a Lua, algo próximo |
| `planeta` | gigante gasoso com faixas; `cor` livre; `anel: true` = anéis | planetas, um tema, um item de lista |
| `rochoso` | planeta rochoso; `cor` livre (`#FF8A6A` = Marte) | planetas pequenos, um item de lista |
| `galaxia` | espiral de estrelas | galáxias, "muitos", escala enorme |
| `buraco-negro` | esfera preta com o disco de luz | buraco negro, perda, algo que engole |
| `atomo` | núcleo com elétrons em órbita | versão micro: átomos, química, física |
| `celula` | célula translúcida com núcleo; `cor` livre | versão micro: corpo, saúde, biologia |
| `moeda` | moeda no laranja do Sol, `simbolo` de 1 a 3 letras (padrão `$`) | modo ilustrativo: dinheiro, cripto, preço |

Nunca ponha logo ou marca real no `simbolo` (nada de ₿ ou de nome de banco).

## A assinatura 1: `orbita` (a cena de escala)

```json
{ "tipo": "orbita", "de": 4.49, "ate": 11.54, "camera": "recuo",
  "origem": { "corpo": "sol" }, "destino": { "corpo": "terra" },
  "distancia": { "texto": "150 milhões de km", "em": 5.24 },
  "viagem": { "em": 4.74, "chegaEm": 6.08, "rotulo": "Tempo da luz", "valor": 500, "unidade": "s" },
  "evento": { "efeito": "apaga", "em": 7.52, "gesto": "maos-descem", "gestoEm": 7.833, "rotulo": "Sol apagado há", "chegaEm": 11.08 },
  "aviso": { "texto": "Terra", "detalhe": "ainda iluminada", "em": 9.02 } }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `de` | sim | quando o fundo vira espaço e a pessoa vai para a moldura: ~0,25 s antes da primeira palavra do assunto |
| `ate` | sim | o fim da cena (ou o `de` do próximo momento do espaço). De 4 a 10 s |
| `camera` | não | `"recuo"` (padrão): começa colada no destino e se afasta em 1,15 s até ver os dois. `"mergulho"`: vem de muito longe (os dois pequenos, as estrelas passando) e mergulha até o plano geral |
| `origem` | sim | o corpo no alto à esquerda (grande). `nome` + `nomeEm` mostram o nome embaixo dele |
| `destino` | sim | o corpo à direita, acima da moldura (pequeno). `nome` + `nomeEm` mostram o nome embaixo dele |
| `distancia` | não | a cota sobre o caminho: `texto` (até ~22 caracteres; o número do começo sai em mono) e `em` (quando é dita). **Só com distância dita** |
| `viagem` | não | o fóton sai da origem em `em` e chega no destino em `chegaEm` (a palavra de chegada), com o relógio no alto à direita contando de 0 até `valor`. `rotulo` em cima do relógio (até ~18 caracteres). `unidade`: `"s"` vira relógio mm:ss (até 99 min); `"min"`, `"h"`, `"dias"`, `"anos"`, `"anos-luz"` ou outro texto curto viram número com a unidade (`casas` decimais). **Sem `valor`**, só a barra anda (ilustrativo) |
| `evento` | não | na palavra `em`, a origem: `"apaga"` (respira e apaga em brasa; a última frente de luz viaja e o destino escurece quando ela chega), `"acende"` (começa escura e acende; a primeira luz viaja e o destino acende quando ela chega) ou `"explode"` (clarão, onda de choque e fragmentos; a luz da explosão chega no destino). `chegaEm` = a palavra em que a frente chega no destino (o relógio conta de novo até `valor`, com o `rotulo` do evento). `gesto` e `gestoEm`: veja "O gesto" |
| `aviso` | não | etiqueta embaixo do destino, à direita: `texto` (o nome) e `detalhe` (no laranja), em `em`. Com `apaga`, some quando a frente chega |

- Na moldura, a cena sobe um pouco para caber acima dela; o relógio fica no alto à direita (y 150).
- Sem nada que viaje, use só `origem`, `destino`, `distancia` e `aviso`: a câmera recua e mostra a escala.
- Entre `de` e o fim, algo novo precisa acontecer a cada ~2,5 s (a cota, o fóton, o evento, o aviso). O `conferir` reprova uma cena parada.

## A assinatura 2: `ceu` (o céu)

```json
{ "tipo": "ceu", "de": 11.54, "ate": 14.43,
  "itens": [ { "corpo": "lua", "nome": "Lua", "valor": "1,3 s", "em": 12.347 },
             { "corpo": "sol", "nome": "Sol", "valor": "8 min 20 s", "em": 12.947 },
             { "corpo": "estrela", "nome": "Sirius", "valor": "8,6 anos", "em": 13.467 } ],
  "grifoEm": 13.847 }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `de` | sim | a palavra que leva ao céu ("Ou seja", "olha pro céu"): a câmera sobe 0,06 s antes, em 0,85 s |
| `itens` | sim | 1 a 4 corpos, na ordem em que são ditos (de baixo para cima na tela): `corpo`, `nome` (até ~12 caracteres), `valor` (opcional, texto curto, **só se dito**), `em`, `cor` |
| `grifoEm` | não | a palavra da conclusão ("passado"): os valores ganham o traço laranja, um depois do outro |
| `titulo` | não | uma linha embaixo do céu (até ~30 caracteres), quando a conclusão tem nome ("Aula gratuita") |

- Uma estrela no lugar mais alto vira só o ponto de luz; nos outros lugares, esfera.
- Termine no fim do assunto ou do vídeo; 2,5 a 6 s.

## As peças próprias

### `virada` (a pergunta "E se eu fosse…" e a linha de luz)

```json
{ "tipo": "virada", "de": 0, "ate": 2.3, "texto": "E se eu fosse", "em": 0.007,
  "nome": "professor", "nomeEm": 0.587, "complemento": "de ciências", "complementoEm": 1.027,
  "icone": "orbita", "trocaEm": 1.8333, "video": "virada.mp4" }
```

- `texto` (até ~22 caracteres) sobe da máscara em `em`; o `nome` (uma palavra, até ~12 letras, vai em caixa alta) entra letra por letra em `nomeEm`, ao lado do `icone` (`orbita` padrão, `atomo`, `celula`, `moeda`, `planeta`); o `complemento` (até ~24 caracteres) em `complementoEm`.
- `trocaEm`: a linha de luz desce em 0,6 s e o título sai. Ponha no começo da persona (um corte ou a pausa depois da pergunta).
- `video`, `videoDe`, `videoAte`: o vídeo com a roupa trocada (SKILL.md, passo 5b). Sem ele, acima da linha já é o enquadramento novo (punch).

### `raio` (o feixe que bate na pessoa)

`{ "tipo": "raio", "de": 1.96, "ate": 4.49, "em": 2.1, "fonteEm": 2.6, "bateEm": 3.26 }`
- O feixe cresce do canto de cima em `em` (a palavra "luz", "sinal"…), a fonte acende em `fonteEm` ("sol") e o feixe bate no lado do rosto em `bateEm` ("batendo", "chega"). `lado`: `"esquerda"` (padrão) ou `"direita"`.
- Só em quadro cheio, antes do espaço: termine no `de` da `orbita` (ele sai quando o espaço entra).

## Os blocos universais

Todos acontecem no espaço, em cima da moldura (y 150 a 760), e entram com a câmera subindo de um para o outro. Cada item entra na palavra dele.

### `abertura`
`{ "tipo": "abertura", "de": 0, "ate": 2.8, "texto": "A luz que você vê é antiga", "destaque": "antiga", "em": 0.1 }`
- `texto` até ~60 caracteres (até 3 linhas, de 92 a 54 px), palavra por palavra; `destaque` = trecho exato no laranja. Um Sol com um planeta em órbita em cima; o traço de luz embaixo quando a frase termina.

### `topicos`
`{ "tipo": "topicos", "de": 14.9, "ate": 23.9, "titulo": "Por que perde na alta", "itens": [ { "texto": "Compra por impulso", "em": 17.73, "corpo": "moeda" } ] }`
- 2 a 5 itens; `texto` até ~32 caracteres (2 linhas); `detalhe` (opcional, 1 linha). Cada item é um corpo (padrão: planetas na paleta; ou o `corpo` do item) no arco de órbita à esquerda, com o nome ao lado. `titulo` (opcional, até ~30 caracteres) no alto.

### `passos`
`{ "tipo": "passos", "de": 35.2, "ate": 40.0, "titulo": "Antes de correr o risco", "itens": [ { "texto": "Entender", "em": 35.93 }, { "texto": "Decidir", "em": 37.09 } ] }`
- 2 a 5 passos em ordem; `texto` até ~40 caracteres (2 linhas, grande); `detalhe` opcional. A luz salta de parada em parada; o último passo é o planeta de chegada (o `corpo` do último item, se houver). O passo da vez fica grande embaixo do caminho e dá lugar ao seguinte.

### `numero`
`{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83, "em": 1.34, "prefixo": "US$", "sufixo": "mil", "rotulo": "Bitcoin rompeu", "corpo": "moeda" }`
- Conta de 0 até `valor` em 1,3 s a partir de `em` (pt-BR; `casas` decimais). `relogio: true` mostra mm:ss (valor em segundos). `rotulo` (até ~40 caracteres) em caixa alta espaçada em cima, em `rotuloEm` (padrão `em`). `corpo` (padrão: planeta com anéis) à esquerda. `ilustrativo: true` mostra a etiqueta.

### `comparacao`
`{ "tipo": "comparacao", "de": 5.4, "ate": 9.0, "modo": "errado-certo", "lados": [ { "rotulo": "Impulso", "texto": "Comprar na alta", "em": 5.6 }, { "rotulo": "Critério", "texto": "Avaliar o projeto", "em": 6.0 } ], "vencedor": 1, "vencedorEm": 6.4 }`
- `rotulo` até ~16 caracteres; `texto` até ~40 (3 linhas). `modo`: `contra` ("vs", padrão), `antes-depois` ("→"), `errado-certo` (o perdedor é riscado). `vencedor` + `vencedorEm`: o vencedor acende, o outro apaga. `corpo`/`cor` por lado (padrão: um planeta azul e um rochoso laranja). `titulo` opcional.

### `grafico`
`{ "tipo": "grafico", "de": 7.2, "ate": 11.0, "forma": "barras", "titulo": "Preço do ativo", "unidade": "mil", "dados": [ { "rotulo": "2022", "valor": 16, "em": 7.4 }, { "rotulo": "2025", "valor": 83, "em": 8.0 } ] }`
- `dados`: 2 a 6 números **ditos** (`rotulo` até ~14 caracteres). `barras` = colunas de luz; `linha` = constelação; `pizza` = anel dividido (rótulos com %; com `unidade`, o valor). Sem `dados`: `tendencia` (`sobe`, `cai`, `oscila`) + `tendenciaEm` + `ilustrativo: true`.

### `destaque`
`{ "tipo": "destaque", "de": 12.85, "ate": 14.88, "texto": "A maioria das pessoas", "em": 13.73, "nivel": "alerta", "detalhe": "perde dinheiro na alta", "detalheEm": 14.2 }`
- `texto` até ~30 caracteres (2 linhas, de 124 a 64 px). `chave` (padrão): um Sol acende em cima, texto branco com o traço laranja. `alerta`: estrela vermelha pulsando, texto em brasa. `detalhe` até ~50 caracteres.

### `definicao`
`{ "tipo": "definicao", "de": 3.0, "ate": 7.5, "termo": "Ano-luz", "em": 3.2, "significado": "a distância que a luz anda em um ano", "significadoEm": 4.1 }`
- `termo` até ~24 caracteres; `significado` até ~120 (até 4 linhas, palavra por palavra a partir de `significadoEm`). A cota de medida se desenha embaixo do termo.

### `frase`
`{ "tipo": "frase", "de": 8.6, "ate": 12.85, "texto": "O mercado subindo não significa dinheiro no bolso", "em": 8.7, "risco": "dinheiro no bolso", "riscoEm": 11.99 }`
- `texto` até ~90 caracteres (até 4 linhas), palavra por palavra; `destaque` no laranja; `risco` = trecho riscado por uma linha de luz em `riscoEm`.

### `pergunta`
`{ "tipo": "pergunta", "de": 23.9, "ate": 28.0, "texto": "Como avaliar os projetos?", "em": 24.58, "opcoes": [ { "texto": "Pelo preço", "em": 25.4 }, { "texto": "Pelo time", "em": 26.1 } ] }`
- `texto` até ~70 caracteres (3 linhas); `opcoes` (2 a 4, até ~20 caracteres): um corpo para cada uma, em fila, com o nome embaixo.

### `cta`
`{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula agora", "em": 40.05, "icone": "link", "destaque": "Saiba Mais" }`
- `texto` até ~60 caracteres (3 linhas), palavra por palavra; `icone`: `salvar` (padrão), `seguir`, `comentar`, `link`; `destaque` no laranja.

## O gesto (rastreio das mãos, opcional)

No exemplo, o Sol apaga **quando as mãos dele caem**, logo depois de "apagasse". Sem rastreio, o evento cai na palavra (`em`) e funciona igual. Com rastreio:

```json
"maos": { "passo": 0.0333, "a": { "x": [0.16, 0.17], "y": [0.87, 0.87] }, "b": { "x": [0.71, -1], "y": [0.82, -1] } }
```

- O centro da palma de cada mão a cada `passo` segundos (um quadro), em frações do quadro 1080×1920, na linha do tempo do vídeo de trabalho; `-1` quando a mão não aparece. `a` = a mão à esquerda da tela, `b` = à direita. Qualquer rastreador serve (MediaPipe Hands, Apple Vision).
- No evento, `"gesto": "maos-descem"` (ou `"maos-sobem"`) e rode `node ferramentas/gesto.mjs`: ele procura, a partir de `em` (até 0,8 s depois), a primeira mão que desce (ou sobe) rápido e grava `gestoEm`. O evento usa `gestoEm` no lugar de `em`.

## Regras de tempo

- O `de` de cada momento do espaço é o fim do anterior (eles se encadeiam). O primeiro do espaço começa ~0,25 s antes da primeira palavra do assunto: a pessoa leva 0,9 s para ir para a moldura.
- Nada parado: dentro de cada momento, algo novo a cada ~2,5 s (um item, uma palavra do título, o evento).
- `ate` de uma lista ≥ 1,2 s depois do último item.
- Nunca dois momentos ao mesmo tempo (exceto `raio` encostando na `virada`).
