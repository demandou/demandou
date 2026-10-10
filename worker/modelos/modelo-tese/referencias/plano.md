# O plano da Tese (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `momentos`, `correcoes` e `semLegenda`. `marca` fica `{ "nome": "", "area": "" }` e `sfx` fica `false` (a Tese não tem tarja de nome nem som de efeito).

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa quando não é).

## Campos gerais

| Campo | O que é |
|---|---|
| `correcoes` | `{ "chat gpt": "ChatGPT" }`: troca uma ou mais palavras seguidas na legenda e nos textos falados. A legenda é toda minúscula por estilo |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (use raramente: o Reel tem legenda o tempo todo) |
| `imagens` | escrito pelo `imagens.mjs`; não edite à mão |

## O layout de cada momento

O vídeo é uma tela dividida do primeiro ao último quadro: a faixa de cima (1080×864, 45% da altura: y 0 a 864) tem a informação inserida; a pessoa fica embaixo (1080×1056, y 864 a 1920), bem centralizada, com a cabeça inteira e folga, rosto em ~38% da largura, com o rosto à vista, inclusive no gancho.

| Momento | Layout |
|---|---|
| `cena` e **todo bloco de texto** | split: imagem ou texto na faixa de cima, pessoa embaixo |
| `fechado` | pessoa em tela cheia, rosto grande (só virada e pergunta direta) |
| nenhum momento | split com a faixa de cima vazia (evite: o `conferir` exige cobertura) |

Não existe B-roll em tela cheia. O primeiro momento começa em `de: 0` e é split.

## Margem segura e encaixe

- Laterais ≥ 64 px; texto de topo a partir de y 120; nada importante abaixo de y 1700. O palco de texto fica entre y 130 e 834 e os blocos medem o texto e reduzem a fonte até caber (nunca extrapolam).
- Imagem preenche a moldura (cover com o `foco`); sem faixa preta, sem fundo desfocado.

## A legenda

- Palavra a palavra em blocos de 2 a 4 palavras, minúscula, branca com contorno preto fino, sem caixa, ~56 px, centro em y 1610, igual em todos os layouts. Pontuação e aspas ficam.
- **Continua em todos os momentos** (inclusive nos blocos de texto), abaixo do queixo, em y 1610. `legenda: false` no momento a desliga.
- Frase que o Whisper não pontuou emenda com a seguinte: corrija com `correcoes` (últimas palavras com ponto).

## A assinatura: `cena` (a imagem de cima)

```json
{ "tipo": "cena", "de": 1.99, "ate": 4.73, "em": 1.99, "imagem": { "id": "prisma" } }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `imagem` | sim | `{ "id": "prisma" }` (o `id` de `work/imagens.json`); `foco` e `efeito` (`aproximar` padrão, `afastar`, `panoramica`, `parado`) opcionais |
| `de`, `ate` | sim | **`de` = o início da palavra que nomeia a coisa (±0,15 s)**, não o corte. O momento anterior pode se estender até lá. Dura a frase inteira (de 1 a 8 s) |
| `em` | não | o mesmo instante da palavra (o `conferir-tempo` confere) |

Regras: uma cena por frase, sem sobrepor outra; a imagem mostra literalmente o que é dito; muda a cada frase; lista de 4 itens fica sob UMA cena longa (7 a 8 s). A faixa é larga (1080×864, proporção 5:4): prefira foto deitada e marque o foco no assunto. Sem imagem (`--escolher <id> 0`), cartão com a palavra.

## A assinatura: `fechado`

`{ "tipo": "fechado", "de": 12.12, "ate": 14.4 }`
- Rosto em tela cheia (~70% da largura), sem zoom animado. Use só na virada ("mas o mais louco é…") e na pergunta direta ("você entendeu?"), ~2 s cada (até 3 s).
- Sem campos extras. O `conferir` o conta como momento (cobertura).

## Os blocos universais (palco de cima)

Todos ficam na faixa de cima (até 864 px de altura, centro do texto em y 482), com a pessoa em split embaixo; entram em corte seco e os itens entram na palavra dita.

### `abertura`
`{ "tipo": "abertura", "de": 0, "ate": 3.02, "texto": "Três coisas que parei de comprar", "destaque": "parei de comprar", "em": 0.07 }`
- `texto` até ~60 caracteres (até 4 linhas de 50 a 84 px). Pode resumir a fala ("que eu parei" → "que parei"): cada palavra entra quando é dita; a que não foi dita igual entra logo depois da anterior.
- `destaque`: trecho exato do `texto`; o sublinhado cresce junto com as palavras.
- `em`: quando o texto começa a ser dito (padrão: `de`).

### `numero`
`{ "tipo": "numero", "de": 3.02, "ate": 4.63, "valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei mais de" }`
- Conta de 0 até `valor` em 1 s a partir de `em`, em pt-BR (500; 1.500; 2,5 com `casas: 1`). `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", "h").
- `rotulo` até ~30 caracteres; `titulo` até ~34, a linha pequena acima do número. `ilustrativo: true` põe a etiqueta.
- Ponha `de` a no máximo ~0,3 s antes do `em` (antes disso o cartão mostra o zero).

### `destaque`
`{ "tipo": "destaque", "de": 8.62, "ate": 9.93, "texto": "Em casa", "em": 8.73, "detalhe": "em 2 minutos", "detalheEm": 9.18, }`
- `texto` curto (1 a 4 palavras; até 2 linhas). Entra no `em`.
- `nivel: "alerta"` = caixa branca sólida com texto escuro (o problema, o erro, o risco); `"chave"` ou nada = texto branco com um traço embaixo.
- `detalhe` (até ~30 caracteres) numa linha cinza menor embaixo, no `detalheEm`.

### `comparacao`
`{ "tipo": "comparacao", "de": 12.6, "ate": 14.48, "modo": "antes-depois", "lados": [{ "rotulo": "Tinha", "texto": "4", "em": 13.09 }, { "rotulo": "Usava", "texto": "1", "em": 14.23 }] }`
- Dois cartões lado a lado; cada um entra no seu `em`. `rotulo` até ~18 caracteres; `texto` curto (um número, 1 a 3 palavras; até 2 linhas).
- `modo`: `contra` (×), `antes-depois` (→), `errado-certo` (≠; o perdedor é riscado). `vencedor` (0 ou 1) + `vencedorEm`: o vencedor fica aceso, o outro apaga.
- `titulo` vira uma etiqueta presa embaixo.

### `topicos` e `passos`
`{ "tipo": "topicos", "de": 30.1, "ate": 35.4, "titulo": "O que cortei", "itens": [{ "texto": "Café na rua", "em": 30.4 }, { "texto": "Streaming", "em": 32.0 }, { "texto": "Delivery", "em": 33.9, "detalhe": "no meio da semana" }] }`
- 2 a 5 itens, cada um com `texto` (até ~28 caracteres, 1 linha) e `em`. `detalhe` (até ~36) só aparece quando cabe (até 3 itens).
- `passos` = em ordem: números e um fio que desce até o passo da vez.

### `grafico`
- Com números ditos: `"forma": "barras" | "linha" | "pizza"`, `dados` com 2 a 6 itens `{ "rotulo", "valor", "em" }`, `unidade` opcional ("mil", "%").
- Sem números: `tendencia` (`sobe`, `cai`, `oscila`) + `tendenciaEm` + `"ilustrativo": true` (obrigatório); a curva se desenha a partir do `tendenciaEm`.
- `titulo` até ~36 caracteres.

### `definicao`
`{ "tipo": "definicao", "de": 40.0, "ate": 43.8, "termo": "Gasto invisível", "em": 40.2, "significado": "o que sai da conta sem você perceber", "significadoEm": 41.5 }`
- `termo` até ~26 caracteres; `significado` até ~110 (3 linhas).

### `frase`
`{ "tipo": "frase", "de": 20.83, "ate": 24.59, "texto": "Não é sobre se privar. É sobre parar de pagar pelo que você nem percebe.", "risco": "se privar", "riscoEm": 21.64, "destaque": "nem percebe", "em": 20.83 }`
- `texto` até ~120 caracteres (4 linhas de 40 a 70 px). Palavra por palavra na fala.
- `risco`: trecho exato, riscado no `riscoEm` (padrão: logo depois de dito). `destaque`: trecho exato, sublinhado em branco.

### `pergunta`
`{ "tipo": "pergunta", "de": 24.62, "ate": 26.76, "texto": "Qual dessas você ainda paga?", "em": 24.67, "opcoes": [{ "texto": "Café na rua", "em": 24.71, "imagem": "cafe" }, { "texto": "Streaming", "em": 25.06, "imagem": "streaming" }] }`
- `texto` até ~70 caracteres. `opcoes` 2 a 4, `texto` até ~26; `imagem` (opcional) = o `id` de uma imagem do plano, que vira miniatura redonda (sem ela, uma letra).
- Opções que não são ditas uma a uma podem entrar nas palavras da própria pergunta, em sequência (como no exemplo).

### `cta`
`{ "tipo": "cta", "de": 50.2, "ate": 53.0, "texto": "Salva pra lembrar no fim do mês", "icone": "salvar", "destaque": "fim do mês", "em": 50.3 }`
- `texto` até ~60 caracteres; `icone`: `seguir`, `salvar`, `comentar` ou `link`.

## Regras de tempo

- Um momento por vez; sem sobreposição; sem respiro entre eles (o corte é seco: `ate` de um = `de` do próximo).
- Cobertura: todo o vídeo deve ter momento (o `conferir` exige 70%; aqui ele é ~100% porque o rosto fechado também é momento). Segmentos de 1 a 8 s; o `conferir` aceita B-roll ou bloco de até 9 s sem item novo (`modelo.json` → `conferir.parado`).
- Em vídeos de ~15 s, 3 tipos ou mais. `cena` e `fechado` aparecem pelo menos uma vez.
- **Timing:** rode `node ferramentas/conferir-tempo.mjs`: cada `cena` e cada item entram na palavra que os nomeia (±0,15 s). Desvio = corrija antes de renderizar.
- Blocos de texto começam na primeira palavra que eles mostram: nada de palco vazio esperando.
