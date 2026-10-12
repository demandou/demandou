# O plano do Multicâmera (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `marca`, `momentos`, `correcoes`, `semLegenda` e, se quiser, `camera` e `sfx`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa quando não é).

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "Rafael Moura", "area": "Carreira e entrevistas" }`. Tarja discreta no alto à esquerda, só no começo. `nome: ""` = sem tarja |
| `sfx` | `true` (padrão): um "toc" tonal baixo quando cada `cena` entra. `false` desliga |
| `camera` | opcional; veja "A mesa de corte" |
| `correcoes` | `{ "pesquisar a empresa": "pesquisar a empresa." }`: troca uma ou mais palavras seguidas na legenda e nos textos falados. Sempre com 2 palavras quando a primeira é comum |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda |
| `imagens` | escrito pelo `imagens.mjs`; não edite à mão |

## A legenda

- Mínima: 1 linha pequena (~44 px), logo abaixo da tarja de capítulo, sem tarja de palavra falada. Quebra em pontuação, pausa ou ~34 caracteres. Frase que o Whisper não pontuou emenda com a seguinte: corrija com `correcoes`.
- **Continua** durante `cena`, `capitulo`, `numero`, `destaque`; **some** nos blocos que mostram texto próprio (`abertura`, `frase`, `pergunta`, `cta`, `comparacao`, `topicos`, `passos`, `grafico`, `definicao`).
- `legenda: true` ou `false` no momento manda por cima do padrão.

## A zona das tarjas e painéis

Do queixo no plano fechado (com folga) até a legenda; com a legenda desligada, até a linha da interface (y 1490). Da margem esquerda (64 px) até x 960 (botões do app à direita). `--guias` mostra a zona.

## A assinatura: `capitulo`

`{ "tipo": "capitulo", "de": 3.38, "ate": 5.45, "texto": "Pesquise a empresa" }`
- `texto` até ~40 caracteres (1 linha; diminui para caber), com as palavras da fala. O número no quadrado vermelho é a ordem dos capítulos (`numero` troca: `3` ou `"B"`).
- `de` = o corte em que o assunto muda; `ate` = 1,5 a 2,5 s depois. A câmera **abre no plano aberto** em `de`.
- Termine o capítulo antes de uma `cena` que cobre a tela.

## A assinatura: `cena` (câmera C)

```json
{ "tipo": "cena", "de": 5.59, "ate": 7.4, "em": 5.65, "imagem": { "id": "entrevista" }, "rotulo": "O recrutador" }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `imagem` | sim | `{ "id": "entrevista" }` (o `id` de `work/imagens.json`); `foco` e `efeito` (`aproximar` padrão, `afastar`, `panoramica`, `parado`) opcionais |
| `de`, `ate` | sim | `de` = 0,05 a 0,12 s antes do `em`. Duração 1 a 2,2 s |
| `em` | não | quando a coisa é dita |
| `forma` | não | `"cheia"` (a foto cobre a tela) ou `"faixa"` (a foto inteira na largura, sobre fundo dela mesma desfocado e escurecido). Sem `forma`, o template escolhe pela proporção e pelo tamanho |
| `rotulo`, `rotuloEm` | não | nome curto numa tarja no alto (até ~24 caracteres); `rotuloEm` = quando é dito |

Regras: uma cena por vez, nunca duas na mesma frase; a cena não esconde o fim da frase (a pessoa precisa dizer a palavra importante na tela); sem imagem (`--escolher <id> 0`), cartão grafite com a palavra.

### `abertura`
`{ "tipo": "abertura", "de": 0, "ate": 3.02, "texto": "Três coisas que parei de comprar", "destaque": "parei de comprar", "em": 0.07 }`
- `texto` até ~60 caracteres (3 linhas de 54 a 88 px). Pode resumir a fala ("que eu parei" → "que parei"): cada palavra entra quando é dita; a que não foi dita igual entra logo depois da anterior.
- `destaque`: trecho exato do `texto`; a tarja cresce junto com as palavras.
- `em`: quando o texto começa a ser dito (padrão: `de`).

### `numero`
`{ "tipo": "numero", "de": 3.02, "ate": 4.63, "valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei mais de" }`
- Conta de 0 até `valor` em 1 s a partir de `em`, em pt-BR (500; 1.500; 2,5 com `casas: 1`). `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", "h").
- `rotulo` até ~30 caracteres; `titulo` até ~34, a linha pequena acima do número. `ilustrativo: true` põe a etiqueta.
- Ponha `de` a no máximo ~0,3 s antes do `em` (antes disso o cartão mostra o zero).

### `destaque` (o chip)
`{ "tipo": "destaque", "de": 8.62, "ate": 9.93, "texto": "Em casa", "em": 8.73, "detalhe": "em 2 minutos", "detalheEm": 9.18, "lado": "dir" }`
- `texto` curto (1 a 4 palavras; até 2 linhas). Entra no `em`.
- `nivel: "alerta"` = tarja vermelha (o problema, o erro, o risco); `"chave"` ou nada = tarja grafite.
- `detalhe` (até ~30 caracteres) numa etiqueta menor embaixo, no `detalheEm`.

### `comparacao`
`{ "tipo": "comparacao", "de": 12.6, "ate": 14.48, "modo": "antes-depois", "lados": [{ "rotulo": "Tinha", "texto": "4", "em": 13.09 }, { "rotulo": "Usava", "texto": "1", "em": 14.23 }] }`
- Dois cartões lado a lado; cada um entra no seu `em`. `rotulo` até ~18 caracteres; `texto` curto (um número, 1 a 3 palavras; até 2 linhas).
- `modo`: `contra` (×), `antes-depois` (→), `errado-certo` (≠; o perdedor é riscado). `vencedor` (0 ou 1) + `vencedorEm`: traço vermelho no vencedor, o outro apaga.
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
- `risco`: trecho exato, riscado no `riscoEm` (padrão: logo depois de dito). `destaque`: trecho exato, na traço vermelho.

### `pergunta`
`{ "tipo": "pergunta", "de": 24.62, "ate": 26.76, "texto": "Qual dessas você ainda paga?", "em": 24.67, "opcoes": [{ "texto": "Café na rua", "em": 24.71, "imagem": "cafe" }, { "texto": "Streaming", "em": 25.06, "imagem": "streaming" }] }`
- `texto` até ~70 caracteres. `opcoes` 2 a 4, `texto` até ~26; `imagem` (opcional) = o `id` de uma imagem do plano, que vira miniatura redonda (sem ela, uma letra).
- Opções que não são ditas uma a uma podem entrar nas palavras da própria pergunta, em sequência (como no exemplo).

### `cta`
`{ "tipo": "cta", "de": 50.2, "ate": 53.0, "texto": "Salva pra lembrar no fim do mês", "icone": "salvar", "destaque": "fim do mês", "em": 50.3 }`
- `texto` até ~60 caracteres; `icone`: `seguir`, `salvar`, `comentar` ou `link`.

## A mesa de corte (câmera)

Sem nada no plano, a câmera troca em cada corte (`cortesEm`), em cada `capitulo` (abre no aberto) e na volta de cada `cena` (nunca a mesma câmera duas vezes seguidas); o gancho começa no fechado. `destaque` e `frase` aproximam devagar até o próximo corte.

`"camera": [{ "em": 7.42, "aproximar": true }, { "em": 20.8, "plano": "fechado" }]`
- Um item num corte escolhe o plano daquele trecho (`"aberto"` 1,0, `"fechado"` 1,3, `"medio"` 1,15, ou `zoom`).
- Fora de um corte, é uma troca de câmera no meio da frase (use 1 ou 2 vezes por 15 s, numa ênfase).
- `aproximar: true`: aproximação lenta a partir de `em` até o próximo corte (até ~5%, no máximo ~6% em 2 s).
- O rosto fica na mesma altura nas duas câmeras.

## Regras de tempo

- Um momento por vez na tela (sem sobreposição visual, exceto capítulo e cena nunca juntos); 0 a 0,3 s de respiro entre eles.
- Trecho só com legenda: até 4,5 s (`modelo.json` → `conferir.vao`). Mesmo assim, algo novo (cena, painel, capítulo ou troca de câmera) a cada ~4 a 6 s.
- Cobertura de momentos: 70% ou mais do vídeo; em vídeos de ~15 s, 2 tipos ou mais. A `cena` e o `capitulo` aparecem pelo menos uma vez.
- Painéis (`comparacao`, `topicos`…) começam na primeira palavra que eles mostram: nada de painel vazio esperando.
