# O plano da Tela Viva (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`). Você escreve `marca`, `momentos`, `correcoes`, `semLegenda` e, se quiser, `camera`. Deixe `"sfx": false`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa quando não é).

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "", "area": "" }`. A Tela Viva não mostra o nome de quem fala; os campos existem por contrato e podem ficar vazios |
| `sfx` | `false` (o formato não tem som de efeito) |
| `camera` | opcional; veja "Câmera" |
| `correcoes` | `{ "Shift + S": "Shift+S", "chat GPT": "ChatGPT" }`: troca uma ou mais palavras seguidas na legenda e nos textos falados |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (raro) |

## A legenda

- Branca, minúscula, sem caixa, ~48 px semibold, sombra leve, centro a 82% da altura (y 1565, no peito).
- O modelo divide as linhas do motor em pedaços de **2 a 4 palavras** (até ~22 letras), sem terminar em artigo ou preposição. Cada pedaço fica até o começo do seguinte. Sem sublinhado, sem cor.
- **Continua** durante tudo (a tela fica em cima e a legenda no peito), inclusive no rótulo. **Some** durante `frase`, `pergunta` e `cta` (a moldura mostra a própria fala).
- `legenda: true` ou `false` no momento manda por cima do padrão.

## A moldura da tela

O retângulo de cima (x 64 a 1016, y 120 a 772). Cada momento (menos a `abertura`) ocupa a moldura inteira e fica nela **até o próximo começar**, com troca em corte seco (nenhuma animação de entrada ou saída). Campos de todo momento: `de`, `ate`, `legenda?`, `chapeu?` (linha pequena em caixa-alta nos blocos universais).

## A assinatura (1): `tela`

```json
{ "tipo": "tela", "de": 3.1, "ate": 7.28, "legenda": true, "captura": "chrome", "proporcao": 1.597,
  "ini": { "x": 0.36, "y": 0.225, "zoom": 1.3 }, "fim": { "x": 0.36, "y": 0.285, "zoom": 2.3 },
  "cursor": [ { "x": 0.40, "y": 0.265, "em": 3.95 }, { "x": 0.47, "y": 0.281, "em": 5.17, "clique": true }, { "x": 0.50, "y": 0.285, "em": 6.4 } ] }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `captura` | sim | nome do arquivo em `public/tela/` sem a extensão (`chrome` = `public/tela/chrome.jpg`) |
| `proporcao` | sim | altura ÷ largura da captura (o `capturar.mjs` imprime) |
| `ini`, `fim` | sim | a câmera no primeiro e no último quadro: `x`,`y` = centro do que se vê, em frações da captura inteira; `zoom` 1 = cover (a captura cobre a moldura inteira, sem faixa preta), 2 = metade da largura. Devem ser **diferentes** (a tela nunca para): rolar (`y` muda) e/ou aproximar (`zoom` sobe) |
| `cursor` | recomendado | pontos `{ x, y, em, clique? }` em frações da captura. O cursor chega ao ponto no `em` (a palavra que nomeia o item), vindo do anterior em até 0,7 s; `clique: true` desenha o toque. Depois do último ponto, deriva de leve |

Regras:
- **Cada cena dura de 4 a 10 s** e começa onde uma frase começa. O momento `tela` precisa de um ponto de `cursor` com `em` a cada ~3 s (o `conferir` reprova momento parado).
- Zoom entre 1,0 e ~2,4. O texto de uma página fica legível no celular a partir de zoom ~2. A câmera é limitada pelas bordas da captura: o centro `y` não precisa estar além de `altura da moldura ÷ 2`.
- Altura visível = `0,682 ÷ (proporcao × zoom)` da captura (a moldura é 1080×740 no palco); largura visível = `1 ÷ zoom`. Use para saber se o item citado cabe.
- O cursor só aponta para texto que existe na captura. Meça as frações num recorte (não chute).
- Capturas de uma página com o aviso "entrar" no canto são aceitas; só não aponte para ele.

## A assinatura (2): `abertura` (o rótulo)

```json
{ "tipo": "abertura", "de": 0, "ate": 3.1, "texto": "Atalhos do Windows", "legenda": true }
```

- `texto`: o assunto em até ~30 caracteres (60 px em uma linha; menor se longo; até 2 linhas em último caso). Caixa branca, texto preto, ~58% da largura (cresce até 80% se o texto é longo).
- Fica sobre a base da tela (y 650 a 754). Está pronto desde `de` (use 0) e some em corte seco no `ate`: ~15% da duração do vídeo, no primeiro corte da tela. Nunca reaparece. `destaque` e `em` existem por contrato e são ignorados.
- Não passa por dentro da moldura: coexiste com a `tela` (os dois cobrem o mesmo tempo).

## Os blocos universais (dentro da moldura)

Campos comuns: `tipo`, `de`, `ate`, `legenda?`, `chapeu?`. Ocupam a moldura inteira no lugar da gravação, em corte seco. Use pouco; o Reel original só tem gravação.

### `numero`
`{ "tipo": "numero", "de": 3.02, "ate": 4.63, "valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei mais de" }`
- Conta de 0 até `valor` em 1 s a partir de `em`, em pt-BR (500; 1.500; 2,5 com `casas: 1`). `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", "h").
- `rotulo` até ~30 caracteres; `titulo`  até ~34, a linha pequena acima do número. `ilustrativo: true` põe a etiqueta.
- Ponha `de` a no máximo ~0,3 s antes do `em` (antes disso a moldura mostra o zero).

### `destaque` (o chip)
`{ "tipo": "destaque", "de": 8.62, "ate": 9.93, "texto": "Em casa", "em": 8.73, "detalhe": "em 2 minutos", "detalheEm": 9.18 }`
- `texto` curto (1 a 4 palavras; até 2 linhas). Entra no `em`.
- `nivel: "alerta"` = moldura invertida (branca) (o problema, o erro, o risco); `"chave"` ou nada = moldura normal.
- `detalhe` (até ~30 caracteres) numa etiqueta menor embaixo, no `detalheEm`.

### `comparacao`
`{ "tipo": "comparacao", "de": 12.6, "ate": 14.48, "modo": "antes-depois", "lados": [{ "rotulo": "Tinha", "texto": "4", "em": 13.09 }, { "rotulo": "Usava", "texto": "1", "em": 14.23 }] }`
- Dois metades da moldura; cada um entra no seu `em`. `rotulo` até ~18 caracteres; `texto` curto (um número, 1 a 3 palavras; até 2 linhas).
- `modo`: `contra` (×), `antes-depois` (→), `errado-certo` (≠; o perdedor é riscado). `vencedor` (0 ou 1) + `vencedorEm`: faixa neon no vencedor, o outro apaga.
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
- `risco`: trecho exato, riscado no `riscoEm` (padrão: logo depois de dito). `destaque`: trecho exato, na sublinhado neon.

### `pergunta`
`{ "tipo": "pergunta", "de": 24.62, "ate": 26.76, "texto": "Qual dessas você ainda paga?", "em": 24.67, "opcoes": [{ "texto": "Café na rua", "em": 24.71, "imagem": "cafe" }, { "texto": "Streaming", "em": 25.06, "imagem": "streaming" }] }`
- `texto` até ~70 caracteres. `opcoes` 2 a 4, `texto` até ~26; `imagem` (opcional) = o `id` de uma imagem do plano, que vira miniatura (sem ela, uma letra).
- Opções que não são ditas uma a uma podem entrar nas palavras da própria pergunta, em sequência (como no exemplo).

### `cta`
`{ "tipo": "cta", "de": 50.2, "ate": 53.0, "texto": "Salva pra lembrar no fim do mês", "icone": "salvar", "destaque": "fim do mês", "em": 50.3 }`
- `texto` até ~60 caracteres; `icone`: `seguir`, `salvar`, `comentar` ou `link`.

## Câmera (do rosto)

Sem nada no plano, a câmera alterna o zoom do rosto em cada corte (`cortesEm`) entre 1,00 e 1,06, sem nunca repetir; o primeiro trecho é 1,00. Nunca anima: troca no corte.

`"camera": [{ "em": 8.9, "zoom": 1.06 }]`
- Um item num corte (até 0,25 s de distância) escolhe o zoom daquele trecho. Fora de um corte, cria um reenquadramento ali: evite, o formato só reenquadra nos cortes da fala.
- Zooms permitidos: 1 a 1,06. O topo da cabeça fica na mesma altura nos dois.

## Regras de tempo

- A `tela` cobre o vídeo inteiro, uma cena depois da outra, sem sobreposição (`ate` de uma = `de` da seguinte). A `abertura` fica por cima do começo. Quando um bloco universal entra na moldura, termine a `tela` ali (`ate` = `de` do bloco) e comece outra `tela` quando o bloco acabar: vale o momento que começou por último, e em empate de `de` vale o que vem depois na lista.
- Cada cena de 4 a 10 s; um ponto de cursor a cada ~3 s; nenhum momento parado mais de 4,5 s.
- Cobertura 70% ou mais (a `tela` cobre 100%). Variedade: a `abertura` e a `tela` bastam em vídeos de até 20 s; de 20 a 40 s use 3 tipos (acrescente um bloco universal onde a fala pede); acima de 40 s, 4.
- A `tela` e a `abertura` aparecem pelo menos uma vez (a assinatura).
