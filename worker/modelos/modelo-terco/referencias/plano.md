# O plano do Terço (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `marca`, `momentos`, `correcoes`, `semLegenda` e, se quiser, `camera` e `sfx`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa quando não é).

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "Rafael Moura", "area": "Finanças do dia a dia" }`. No chapéu da `abertura` quando ela abre o vídeo; senão, uma tarja discreta sobre a pessoa, de ~0,2 a 3,6 s. `nome: ""` = sem nome |
| `sfx` | `true` (padrão): um "vum" tonal baixo quando cada `insercao` entra (menos as de entrada lateral). `false` desliga |
| `camera` | opcional; veja "Câmera" |
| `correcoes` | `{ "500 reais": "R$ 500", "nem abria": "nem abria." }`: troca uma ou mais palavras seguidas na legenda e nos textos falados. Sempre com 2 palavras quando a primeira é comum |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (raro no Terço) |
| `imagens` | escrito pelo `imagens.mjs`; não edite à mão |

## A legenda

- Até 2 linhas, logo abaixo do queixo (a faixa é calculada pelo rosto, para o zoom mais fechado). A palavra dita ganha um sublinhado azul que desliza de palavra em palavra.
- Quebra em pontuação, pausa ou ~34 caracteres. Frase que o Whisper não pontuou emenda com a seguinte: corrija com `correcoes` (`"usava uma": "usava uma."`).
- **Continua** durante quase tudo, porque o palco fica em cima e a legenda embaixo.
- **Some** durante `abertura`, `frase`, `pergunta` e `cta` (eles mostram a própria fala).
- `legenda: true` ou `false` no momento manda por cima do padrão.

## O palco

Os 640 px de cima. Cada momento ocupa o palco inteiro e fica nele **até o próximo entrar** (a troca dura 0,5 s); por isso o palco nunca fica vazio, mesmo se houver um respiro entre `ate` e o `de` seguinte. Campos de todo momento: `de`, `ate`, `legenda?`, `chapeu?` (linha pequena em caixa-alta no alto: "DICA 2", "O ERRO") e `entrada?`:

- `"cortina"` (padrão da `insercao`): entra da esquerda com um fio azul na borda;
- `"deslize"` (padrão dos demais): entra de baixo e o anterior recua um pouco;
- `"lateral"`: entra da direita empurrando o anterior; sem som.

Varie: duas inserções seguidas com a mesma entrada é aceitável, quatro blocos de texto seguidos não.

## A assinatura (1): `insercao`

```json
{ "tipo": "insercao", "de": 7.0, "ate": 8.45, "em": 7.28, "imagem": { "id": "carrinho" }, "rotulo": "Carrinho de besteira", "rotuloEm": 7.4 }
{ "tipo": "insercao", "de": 10.2, "ate": 11.75, "em": 10.34, "imagem": { "id": "prateleira" }, "rotulo": "Prateleira de baixo", "etiqueta": "2" }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `imagem` | sim | `{ "id": "carrinho" }` (o `id` de `work/imagens.json`); `foco` e `efeito` opcionais |
| `em` | sim | quando a coisa é dita |
| `de`, `ate` | sim | `de` = 0 a 0,3 s antes do `em`. Duração de 1,5 a 3 s |
| `rotulo` | não | nome curto da coisa, com as palavras da fala (até ~24 caracteres), numa etiqueta no canto de baixo |
| `rotuloEm` | não | quando o nome é dito, se for depois do `em` |
| `etiqueta` | não | marcador curto ("1", "2", "3") para itens de uma lista falada |

Regras:
- Uma inserção por vez; nunca duas na mesma frase.
- A imagem cobre o palco (1080×640) e aproxima devagar. Foto deitada é o ideal; em pé, ponha o `foco` no assunto.
- Sem imagem (`--escolher <id> 0`): cartão tipográfico com a palavra (`rotulo` ou a `palavra` do pedido). Objeto transparente (3D): adesivo sobre o grafite, sem cartão.

## A assinatura (2): `capitulo`

```json
{ "tipo": "capitulo", "de": 3.45, "ate": 7.0, "numero": "1", "total": 3, "texto": "Nunca vá com fome", "destaque": "fome", "em": 3.48, "icone": "alerta", "iconeEm": 5.4 }
```

- `numero`: "1", "2"… (vira "01"); vazio = sem número. `total`: quantos capítulos a fala tem (desenha os pontos de progresso).
- `texto` até ~34 caracteres; monta-se palavra por palavra a partir do `em`. `destaque`: trecho exato, em azul.
- `icone` (opcional, desenha-se em `iconeEm`): `carrinho`, `etiqueta`, `relogio`, `alerta`, `certo`, `errado`, `dinheiro`, `casa`, `coracao`, `ideia`, `calendario`, `seta`, `estrela`, `lupa`, `sobe`, `cai`, `pessoa`, `raio`.
- Use um capítulo sempre que a fala abrir uma parte ("primeiro", "segundo", "o erro número…", "dica").

## Os blocos universais

Campos comuns: `tipo`, `de`, `ate`, `legenda?`, `chapeu?`, `entrada?`. Não há `lado`: tudo ocupa o palco inteiro.

### `abertura`
`{ "tipo": "abertura", "de": 0, "ate": 3.02, "texto": "Três coisas que parei de comprar", "destaque": "parei de comprar", "em": 0.07 }`
- `texto` até ~60 caracteres (3 linhas de 54 a 88 px). Pode resumir a fala ("que eu parei" → "que parei"): cada palavra entra quando é dita; a que não foi dita igual entra logo depois da anterior.
- `destaque`: trecho exato do `texto`; a tarja cresce junto com as palavras.
- `em`: quando o texto começa a ser dito (padrão: `de`).

### `numero`
`{ "tipo": "numero", "de": 3.02, "ate": 4.63, "valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei mais de" }`
- Conta de 0 até `valor` em 1 s a partir de `em`, em pt-BR (500; 1.500; 2,5 com `casas: 1`). `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", "h").
- `rotulo` até ~30 caracteres; `titulo` (do Terço) até ~34, a linha pequena acima do número. `ilustrativo: true` põe a etiqueta.
- Ponha `de` a no máximo ~0,3 s antes do `em` (antes disso o palco mostra o zero).

### `destaque` (o chip)
`{ "tipo": "destaque", "de": 8.62, "ate": 9.93, "texto": "Em casa", "em": 8.73, "detalhe": "em 2 minutos", "detalheEm": 9.18 }`
- `texto` curto (1 a 4 palavras; até 2 linhas). Entra no `em`.
- `nivel: "alerta"` = palco invertido (osso) (o problema, o erro, o risco); `"chave"` ou nada = palco normal.
- `detalhe` (até ~30 caracteres) numa etiqueta menor embaixo, no `detalheEm`.

### `comparacao`
`{ "tipo": "comparacao", "de": 12.6, "ate": 14.48, "modo": "antes-depois", "lados": [{ "rotulo": "Tinha", "texto": "4", "em": 13.09 }, { "rotulo": "Usava", "texto": "1", "em": 14.23 }] }`
- Dois metades do palco; cada um entra no seu `em`. `rotulo` até ~18 caracteres; `texto` curto (um número, 1 a 3 palavras; até 2 linhas).
- `modo`: `contra` (×), `antes-depois` (→), `errado-certo` (≠; o perdedor é riscado). `vencedor` (0 ou 1) + `vencedorEm`: faixa azul no vencedor, o outro apaga.
- `titulo` vira um chapéu pequeno em cima.

### `topicos` e `passos`
`{ "tipo": "topicos", "de": 30.1, "ate": 35.4, "titulo": "O que cortei", "itens": [{ "texto": "Café na rua", "em": 30.4 }, { "texto": "Streaming", "em": 32.0 }, { "texto": "Delivery", "em": 33.9, "detalhe": "no meio da semana" }] }`
- 2 a 5 itens, cada um com `texto` (até ~28 caracteres, 1 linha) e `em`. `detalhe` (até ~36) só aparece quando cabe (até 3 itens). `imagem` (opcional) = o `id` de uma imagem do plano, que vira miniatura no lugar do marcador.
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
- `risco`: trecho exato, riscado no `riscoEm` (padrão: logo depois de dito). `destaque`: trecho exato, na sublinhado azul.

### `pergunta`
`{ "tipo": "pergunta", "de": 24.62, "ate": 26.76, "texto": "Qual dessas você ainda paga?", "em": 24.67, "opcoes": [{ "texto": "Café na rua", "em": 24.71, "imagem": "cafe" }, { "texto": "Streaming", "em": 25.06, "imagem": "streaming" }] }`
- `texto` até ~70 caracteres. `opcoes` 2 a 4, `texto` até ~26; `imagem` (do Terço, opcional) = o `id` de uma imagem do plano, que vira miniatura (sem ela, uma letra).
- Opções que não são ditas uma a uma podem entrar nas palavras da própria pergunta, em sequência (como no exemplo).

### `cta`
`{ "tipo": "cta", "de": 50.2, "ate": 53.0, "texto": "Salva pra lembrar no fim do mês", "icone": "salvar", "destaque": "fim do mês", "em": 50.3 }`
- `texto` até ~60 caracteres; `icone`: `seguir`, `salvar`, `comentar` ou `link`.

## Câmera

Sem nada no plano, a câmera troca o zoom em cada corte (`cortesEm`), alternando 1,0 → ~1,1 → ~1,2 sem repetir; o primeiro trecho é 1,0. Trechos de 2,4 s ou mais aproximam ~3% devagar.

`"camera": [{ "em": 20.83, "zoom": 1.0, "aproximar": true }, { "em": 3.18, "zoom": 1.12 }]`
- Um item num corte (até 0,25 s de distância) escolhe o zoom daquele trecho.
- Fora de um corte, começa um enquadramento novo ali: um "soco" de câmera na palavra. Use 1 ou 2 vezes por minuto, nas ênfases.
- `aproximar: true`: aproximação lenta de 5% no trecho (nunca mais de 6% em 2 s).
- Zooms permitidos: 1 a 1,22. O rosto fica na mesma altura em qualquer zoom.

## Regras de tempo

- Um momento por vez (sem sobreposição); o palco segura o último até o próximo entrar, então não passe `ate` do `de` seguinte.
- Um bloco novo no palco a cada ~2 a 4 s; nenhum momento parado mais de 4,5 s (o ideal: 1,5 a 3,5 s).
- Cobertura de momentos: 70% ou mais do vídeo. Variedade: 4 tipos ou mais em vídeos de mais de 40 s. `insercao` e `capitulo` aparecem pelo menos uma vez cada quando a fala tem partes e coisas concretas.
