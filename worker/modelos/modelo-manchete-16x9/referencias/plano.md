# O plano da Manchete (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `momentos`, `correcoes` e, se quiser, `semLegenda`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa quando não é).

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | não é usado (o formato não tem tarja de nome). Deixe `{ "nome": "", "area": "" }` |
| `sfx` | `false` (padrão do modelo): sem efeito sonoro. O Reel original não tem |
| `correcoes` | `{ "500 reais": "R$ 500" }`: troca uma ou mais palavras seguidas na legenda. Sempre com 2 palavras quando a primeira é comum |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (quase nunca) |
| `imagens` | escrito pelo `imagens.mjs`; não edite à mão |

## A legenda

- **Palavra a palavra**: 2 a 4 palavras por vez (até ~24 caracteres), em **minúsculas**, branca, bold, **sem caixa e sem destaque de cor**, só uma sombra leve. Centrada, logo abaixo do queixo (sobre o peito). Troca em corte seco com a fala.
- Nunca termina em artigo ou preposição ("e", "de", "o"). A pontuação do fim fica.
- Aparece o vídeo inteiro, inclusive durante o B-roll. Só some em `abertura`, `frase`, `pergunta` e `cta` (blocos de texto que mostram a própria fala); `legenda: true` ou `false` no momento manda por cima.

## A faixa de cima (o B-roll)

Fica em x 0–1080, y 0–600, **toda preenchida** pela imagem (cover com `foco`, sem borda preta nem letterbox). **Sempre ocupada**: cada momento entra em **corte seco** e fica até o próximo começar. Troque na virada de ideia, a cada 6 a 14 s, e varie o tipo de imagem (foto de imprensa → rua → detalhe → objeto). A imagem ilustra **literalmente** o que a fala diz.

## A assinatura (1): `manchete`

O primeiro B-roll do vídeo, com a **tarja**.

```json
{ "tipo": "manchete", "de": 0, "ate": 3.40, "em": 0.06, "imagem": { "id": "oculos" }, "tarja": "Fim do intérprete?", "tarjaAte": 5.79,
  "angulos": [ { "em": 1.83, "zoom": 1.3, "foco": { "x": 0.33, "y": 0.5 } } ], "credito": "Foto: Xuthoria · CC BY-SA 4.0" }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `imagem` | sim | `{ "id": "oculos" }` (o `id` de `work/imagens.json`); `foco` e `efeito` opcionais |
| `em` | sim | quando a coisa é dita |
| `de`, `ate` | sim | `de` = 0 no primeiro vídeo; `ate` = a virada de ideia (6 a 14 s) |
| `tarja` | sim | pergunta provocativa, **2 a 4 palavras** em caixa-alta (até ~26 caracteres). Monta na borda de baixo da faixa (metade na foto), centrada, rosa-vermelha, cantos arredondados |
| `tarjaAte` | não | quando a tarja sai (padrão: o fim do momento). Ponha no `de` do B-roll que cai perto dos 6 s: a tarja pode atravessar o primeiro corte (o exemplo: B-roll troca em 3,4 s, tarja sai em 5,79 s) |
| `angulos` | não | trocas de enquadramento dentro do mesmo B-roll (veja abaixo) |
| `credito` | não | fonte miúda no alto à direita da faixa ("Foto: Autor · CC BY 2.0"). Obrigatório em foto CC BY/BY-SA; em imagem gerada por IA, `"imagem ilustrativa"` |

## A assinatura (2): `insercao`

O B-roll seguinte (sem tarja). Mesmos campos, menos `tarja`/`tarjaAte`. O modelo não tem selo.

```json
{ "tipo": "insercao", "de": 3.40, "ate": 5.79, "em": 3.54, "imagem": { "id": "conversa" }, "angulos": [ { "em": 4.76, "zoom": 1.3, "foco": { "x": 0.68, "y": 0.42 } } ], "credito": "imagem ilustrativa" }
```

- `angulos[]`: `{ "em", "foco"?, "zoom"?, "efeito"?, "direcao"? }`. Em cada `em` o enquadramento muda em **corte seco** (outro foco, `zoom` de 1 a 1,5, outro movimento). Use um a cada 2 a 5 s; o `em` cai numa palavra.
- `efeito`: `aproximar`, `afastar` ou `panoramica` (com `direcao`: `esquerda` ou `direita`). A foto sempre se mexe devagar: o B-roll nunca fica parado.
- Foto deitada é o ideal; em pé, ponha o `foco` no assunto. Sem imagem (`--escolher <id> 0`): cartão tipográfico com a palavra.
- Imagem transparente (objeto 3D) vira cartão: o formato é de foto de imprensa; prefira foto.

## Os blocos universais

Campos comuns: `tipo`, `de`, `ate`, `legenda?`, `chapeu?`. Cada bloco ocupa a faixa de cima inteira (1080×600 px; texto com margem segura de 64 px nas laterais e 120 px do topo). **Use os blocos universais só quando a fala pede um número, uma lista ou uma comparação; o formato original quase não tem texto na faixa.** Eles entram em corte seco, sem animação de troca, e as marcas usam o rosa-vermelho da tarja.

### `abertura`
`{ "tipo": "abertura", "de": 0, "ate": 3.02, "texto": "Três coisas que parei de comprar", "destaque": "parei de comprar", "em": 0.07 }`
- `texto` até ~60 caracteres (3 linhas de 54 a 88 px). Pode resumir a fala ("que eu parei" → "que parei"): cada palavra entra quando é dita; a que não foi dita igual entra logo depois da anterior.
- `destaque`: trecho exato do `texto`; a tarja cresce junto com as palavras.
- `em`: quando o texto começa a ser dito (padrão: `de`).

### `numero`
`{ "tipo": "numero", "de": 3.02, "ate": 4.63, "valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei mais de" }`
- Conta de 0 até `valor` em 1 s a partir de `em`, em pt-BR (500; 1.500; 2,5 com `casas: 1`). `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", "h").
- `rotulo` até ~30 caracteres; `titulo`  até ~34, a linha pequena acima do número. `ilustrativo: true` põe a etiqueta.
- Ponha `de` a no máximo ~0,3 s antes do `em` (antes disso a faixa mostra o zero).

### `destaque` (o chip)
`{ "tipo": "destaque", "de": 8.62, "ate": 9.93, "texto": "Em casa", "em": 8.73, "detalhe": "em 2 minutos", "detalheEm": 9.18 }`
- `texto` curto (1 a 4 palavras; até 2 linhas). Entra no `em`.
- `nivel: "alerta"` = faixa invertida (osso) (o problema, o erro, o risco); `"chave"` ou nada = faixa normal.
- `detalhe` (até ~30 caracteres) numa etiqueta menor embaixo, no `detalheEm`.

### `comparacao`
`{ "tipo": "comparacao", "de": 12.6, "ate": 14.48, "modo": "antes-depois", "lados": [{ "rotulo": "Tinha", "texto": "4", "em": 13.09 }, { "rotulo": "Usava", "texto": "1", "em": 14.23 }] }`
- Dois metades da faixa; cada um entra no seu `em`. `rotulo` até ~18 caracteres; `texto` curto (um número, 1 a 3 palavras; até 2 linhas).
- `modo`: `contra` (×), `antes-depois` (→), `errado-certo` (≠; o perdedor é riscado). `vencedor` (0 ou 1) + `vencedorEm`: faixa rosa no vencedor, o outro apaga.
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
- `risco`: trecho exato, riscado no `riscoEm` (padrão: logo depois de dito). `destaque`: trecho exato, na sublinhado rosa.

### `pergunta`
`{ "tipo": "pergunta", "de": 24.62, "ate": 26.76, "texto": "Qual dessas você ainda paga?", "em": 24.67, "opcoes": [{ "texto": "Café na rua", "em": 24.71, "imagem": "cafe" }, { "texto": "Streaming", "em": 25.06, "imagem": "streaming" }] }`
- `texto` até ~70 caracteres. `opcoes` 2 a 4, `texto` até ~26; `imagem` (opcional) = o `id` de uma imagem do plano, que vira miniatura (sem ela, uma letra).
- Opções que não são ditas uma a uma podem entrar nas palavras da própria pergunta, em sequência (como no exemplo).

### `cta`
`{ "tipo": "cta", "de": 50.2, "ate": 53.0, "texto": "Salva pra lembrar no fim do mês", "icone": "salvar", "destaque": "fim do mês", "em": 50.3 }`
- `texto` até ~60 caracteres; `icone`: `seguir`, `salvar`, `comentar` ou `link`.

## Câmera

Não há. A pessoa fica em **plano fixo**: um zoom só (o rosto com ~36% da largura do quadro), rosto na linha central, o vídeo inteiro, sem punch-in e sem reenquadrar nos cortes. O motor segue o rosto só para corrigir quando a pessoa se mexe. O dinamismo vem do B-roll.

## Regras de tempo

- Um momento por vez; a faixa segura o último até o próximo entrar, então não passe `ate` do `de` seguinte.
- Um B-roll novo a cada 6 a 14 s, na virada de ideia; dentro dele, uma troca de ângulo a cada 2 a 5 s. O `conferir` aceita momentos de até 15 s sem novidade.
- Todo `em` (momento e `angulos`) é o início da palavra que nomeia a coisa, com no máximo 0,15 s de desvio: rode `node ferramentas/timing.mjs`.
- Cobertura de momentos: 70% ou mais (o ideal: 100%). Variedade: pelo menos 2 tipos (`manchete` + `insercao`).
- `manchete` só no começo; as demais, `insercao`.
