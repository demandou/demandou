# O plano do Yap (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `marca`, `momentos`, `correcoes`, `semLegenda` e, se quiser, `camera` e `sfx`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa quando não é).

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "Rafael Moura", "area": "Finanças do dia a dia" }`. Tarja discreta no alto à esquerda, do começo até o primeiro corte depois de ~2 s (no máximo 3,6 s). `nome: ""` = sem tarja |
| `sfx` | `true` (padrão): um "vum" tonal baixo quando cada `insercao` entra. `false` desliga |
| `camera` | opcional; veja "Câmera" |
| `correcoes` | `{ "500 reais": "R$ 500", "nem abria": "nem abria." }`: troca uma ou mais palavras seguidas na legenda e nos textos falados. Sempre com 2 palavras quando a primeira é comum |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (raro no Yap) |
| `imagens` | escrito pelo `imagens.mjs`; não edite à mão |

## A legenda

- Até 2 linhas, logo abaixo do queixo (a faixa é calculada pelo rosto, para o zoom mais fechado), 44 a 62 px. A palavra dita ganha a tarja lima, que desliza de palavra em palavra.
- Quebra em pontuação, pausa ou ~34 caracteres. Frase que o Whisper não pontuou emenda com a seguinte: corrija com `correcoes` (`"usava uma": "usava uma."`).
- **Continua** durante `insercao` (cartão e tela), `numero`, `destaque`, `comparacao`, `topicos`, `passos`, `grafico` e `definicao`.
- **Some** durante `abertura`, `frase`, `pergunta` e `cta` (eles mostram a própria fala).
- `legenda: true` ou `false` no momento manda por cima do padrão.

## A zona das inserções

Abaixo da legenda (~190 px abaixo do topo dela) até a linha da interface do app (y 1490), da margem esquerda (64 px) até x 960 (os botões do app ficam à direita). No exemplo: de y 1106 a 1490, ~384 px de altura. Tudo que é cartão cabe aí, medido com a fonte.

## A assinatura: `insercao`

```json
{ "tipo": "insercao", "de": 7.12, "ate": 8.62, "em": 7.24, "imagem": { "id": "prensa" }, "rotulo": "Prensa francesa", "lado": "esq" }
{ "tipo": "insercao", "de": 5.1, "ate": 6.25, "em": 5.12, "forma": "tela", "imagem": { "id": "cafe" }, "rotulo": "Café na rua", "etiqueta": "1" }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `imagem` | sim | `{ "id": "prensa" }` (o `id` de `work/imagens.json`); `foco` e `efeito` (`aproximar` padrão, `afastar`, `panoramica`, `parado`) opcionais |
| `em` | sim | quando a coisa é dita |
| `de`, `ate` | sim | `de` = 0,05 a 0,12 s antes do `em`. Cartão: 1,5 a 3 s. Tela: 0,8 a 1,2 s |
| `forma` | não | `"cartao"` (padrão) ou `"tela"` |
| `lado` | não | `"esq"`, `"dir"` ou `"centro"`. Sem ele, os cartões alternam dir → esq → dir |
| `rotulo` | não | nome curto da coisa, com as palavras da fala (até ~24 caracteres). Entra numa etiqueta presa ao cartão (na tela cheia, no alto à esquerda) |
| `rotuloEm` | não | quando o nome é dito, se for depois do `em` (ex.: a imagem entra em "cozinho", a etiqueta "Congelo em potes" em "congelo") |
| `etiqueta` | não | marcador curto ("1", "2", "3") para itens de uma lista falada ("primeiro…, segundo…") |

Regras:
- Uma inserção por vez; nunca duas na mesma frase.
- Tela cheia só com foto **em pé** e nítida (a folha mostra o tamanho). Foto deitada vai no cartão.
- O cartão ocupa a altura da zona (no exemplo, 362 px) e se ajusta à imagem: deitada → 1,5× a altura (até 640 px de largura; ~540 no exemplo); quadrada → ~1×; em pé → ~0,84×.
- Sem imagem (`--escolher <id> 0`): o cartão mostra a palavra (`rotulo` ou a `palavra` do pedido). Objeto transparente (3D): adesivo de até 380 px, sem cartão.

## Os blocos universais

Campos comuns: `tipo`, `de`, `ate`, `legenda?`. Os blocos de cartão aceitam também `lado` (`"esq"`, `"dir"`, `"centro"`; padrão `"centro"`).

### `abertura`
`{ "tipo": "abertura", "de": 0, "ate": 3.02, "texto": "Três coisas que parei de comprar", "destaque": "parei de comprar", "em": 0.07 }`
- `texto` até ~60 caracteres (3 linhas de 54 a 88 px). Pode resumir a fala ("que eu parei" → "que parei"): cada palavra entra quando é dita; a que não foi dita igual entra logo depois da anterior.
- `destaque`: trecho exato do `texto`; a tarja cresce junto com as palavras.
- `em`: quando o texto começa a ser dito (padrão: `de`).

### `numero`
`{ "tipo": "numero", "de": 3.02, "ate": 4.63, "valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei mais de" }`
- Conta de 0 até `valor` em 1 s a partir de `em`, em pt-BR (500; 1.500; 2,5 com `casas: 1`). `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", "h").
- `rotulo` até ~30 caracteres; `titulo` (do Yap) até ~34, a linha pequena acima do número. `ilustrativo: true` põe a etiqueta.
- Ponha `de` a no máximo ~0,3 s antes do `em` (antes disso o cartão mostra o zero).

### `destaque` (o chip)
`{ "tipo": "destaque", "de": 8.62, "ate": 9.93, "texto": "Em casa", "em": 8.73, "detalhe": "em 2 minutos", "detalheEm": 9.18, "lado": "dir" }`
- `texto` curto (1 a 4 palavras; até 2 linhas). Entra no `em`.
- `nivel: "alerta"` = pílula grafite (o problema, o erro, o risco); `"chave"` ou nada = pílula clara.
- `detalhe` (até ~30 caracteres) numa etiqueta menor embaixo, no `detalheEm`.

### `comparacao`
`{ "tipo": "comparacao", "de": 12.6, "ate": 14.48, "modo": "antes-depois", "lados": [{ "rotulo": "Tinha", "texto": "4", "em": 13.09 }, { "rotulo": "Usava", "texto": "1", "em": 14.23 }] }`
- Dois cartões lado a lado; cada um entra no seu `em`. `rotulo` até ~18 caracteres; `texto` curto (um número, 1 a 3 palavras; até 2 linhas).
- `modo`: `contra` (×), `antes-depois` (→), `errado-certo` (≠; o perdedor é riscado). `vencedor` (0 ou 1) + `vencedorEm`: faixa lima no vencedor, o outro apaga.
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
- `risco`: trecho exato, riscado no `riscoEm` (padrão: logo depois de dito). `destaque`: trecho exato, na tarja lima.

### `pergunta`
`{ "tipo": "pergunta", "de": 24.62, "ate": 26.76, "texto": "Qual dessas você ainda paga?", "em": 24.67, "opcoes": [{ "texto": "Café na rua", "em": 24.71, "imagem": "cafe" }, { "texto": "Streaming", "em": 25.06, "imagem": "streaming" }] }`
- `texto` até ~70 caracteres. `opcoes` 2 a 4, `texto` até ~26; `imagem` (do Yap, opcional) = o `id` de uma imagem do plano, que vira miniatura redonda (sem ela, uma letra).
- Opções que não são ditas uma a uma podem entrar nas palavras da própria pergunta, em sequência (como no exemplo).

### `cta`
`{ "tipo": "cta", "de": 50.2, "ate": 53.0, "texto": "Salva pra lembrar no fim do mês", "icone": "salvar", "destaque": "fim do mês", "em": 50.3 }`
- `texto` até ~60 caracteres; `icone`: `seguir`, `salvar`, `comentar` ou `link`.

## Câmera

Sem nada no plano, a câmera troca o zoom em cada corte (`cortesEm`) e na volta de cada tela cheia, alternando 1,0 → 1,12 → 1,22… sem repetir; o primeiro trecho é 1,0. Trechos de 2,4 s ou mais aproximam ~3% devagar.

`"camera": [{ "em": 20.83, "zoom": 1.0, "aproximar": true }, { "em": 3.18, "zoom": 1.12 }]`
- Um item num corte (até 0,25 s de distância) escolhe o zoom daquele trecho.
- Fora de um corte, começa um enquadramento novo ali: um "soco" de câmera na palavra. Use 1 ou 2 vezes por minuto, nas ênfases.
- `aproximar: true`: aproximação lenta de 5% no trecho (nunca mais de 6% em 2 s).
- Zooms permitidos: 1 a 1,22. O rosto fica na mesma altura em qualquer zoom.

## Regras de tempo

- Um momento por vez (sem sobreposição); 0 a 0,3 s de respiro entre eles.
- Trecho só com legenda: até 4,5 s (`modelo.json` → `conferir.vao`), justificado pelos respiros do Yap. Mesmo assim, algo novo (inserção, chip ou corte com reenquadramento) a cada ~4 a 6 s.
- Cobertura de momentos: 70% ou mais do vídeo. Variedade: 4 tipos ou mais em vídeos de mais de 40 s. A `insercao` aparece pelo menos uma vez.
- Nada parado mais de 4,5 s dentro de um momento (o ideal no Yap é 1,5 a 3 s por cartão).
