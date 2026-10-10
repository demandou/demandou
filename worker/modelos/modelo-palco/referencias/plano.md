# O plano do Palco (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `marca`, `momentos`, `correcoes`, `semLegenda` e, se quiser, `camera` e `sfx`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa quando não é).

## Os dois modos

- **Modo (a)**: a pessoa em quadro cheio. Vale para `abertura`, `frase`, `pergunta`, `cta`, `destaque` e para os trechos sem momento.
- **Modo (b), o palco**: a pessoa vira uma janela num canto de baixo e o painel mostra o assunto. Abre com `palco`, `topicos`, `passos`, `numero`, `comparacao`, `grafico` e `definicao`.
- Momentos de palco com **menos de 0,6 s** entre eles formam uma cena: a pessoa fica na janela e a página nova cobre a anterior. Para a pessoa voltar ao quadro cheio entre dois palcos, deixe **0,6 s ou mais** (o ideal: uma frase curta em modo (a) no meio).
- Entrar no palco leva 0,2 s antes do `de` e voltar leva 0,5 s depois do `ate`: não ponha `abertura`, `frase`, `cta`, `pergunta` ou `destaque` dentro desses intervalos.

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "Lucas Ferraz", "area": "Fotos de comida" }`. Tarja discreta no alto à esquerda, do começo até o primeiro corte depois de ~2 s (no máximo 3,6 s). `nome: ""` = sem tarja. Sempre um nome coerente com a pessoa do vídeo |
| `sfx` | `true` (padrão): um "vum" tonal baixo quando o palco abre. `false` desliga |
| `camera` | opcional; veja "Câmera" |
| `correcoes` | `{ "Minos é mais": "Menos é mais." }`: troca palavras seguidas na legenda e nos textos falados. Com 2 palavras quando a primeira é comum |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (raro) |
| `imagens` | escrito pelo `imagens.mjs`; não edite à mão |

## A legenda

- Modo (a): até 2 linhas logo abaixo do queixo, 44 a 62 px. Modo (b): numa faixa ao lado da janela, abaixo do painel, 36 a 46 px, alinhada à esquerda. A palavra dita ganha uma tarja azul.
- **Continua** durante `palco`, `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao` e `destaque`. **Some** durante `abertura`, `frase`, `pergunta` e `cta`. `legenda: true/false` no momento manda por cima.

## A assinatura: `palco`

```json
{ "tipo": "palco", "de": 3.3, "ate": 5.46, "em": 3.3, "imagem": { "id": "janela", "foco": { "x": 0.5, "y": 0.5 } },
  "titulo": "Luz de janela, de lado", "etiqueta": "1", "tituloEm": 3.45,
  "anotacoes": [
    { "tipo": "circulo", "em": 4.24, "x": 0.5, "y": 0.33, "tamanho": 0.34, "texto": "luz natural" },
    { "tipo": "seta", "em": 5.08, "x": 0.37, "y": 0.36, "vem": "esq", "texto": "de lado", "tamanho": 0.42 } ] }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `imagem` | sim | `{ "id": "janela" }` (o `id` de `work/imagens.json`); `foco` (o assunto, em frações da imagem inteira) |
| `de`, `ate` | sim | `de` = 0 a 0,15 s antes do `em`. Palco: 1,8 a 4,5 s |
| `em` | não | quando a coisa é dita (padrão `de`) |
| `ajuste` | não | `"cobrir"` (padrão para foto) ou `"inteira"` (print, tela, gráfico pronto, sem corte; padrão quando o `id` tem "print", "tela" ou "captura") |
| `titulo` | não | etiqueta no alto do painel (até ~30 caracteres, com as palavras da fala); `tituloEm`; `etiqueta` ("1", "2", "3") para itens de uma sequência falada |
| `rotulo` | não | nome curto da imagem, numa pílula embaixo (até ~20 caracteres); `rotuloEm` |
| `anotacoes` | não | veja abaixo |
| `segunda` | não | `{ "imagem": { "id", "foco" }, "em", "rotulo", "anotacoes" }`: quando a segunda coisa é dita, o painel se divide (a primeira sobe, a segunda entra embaixo). Cada metade fica com ~490 px de altura |
| `canto` | não | `"esq"` ou `"dir"`: o canto da janela. Sem ele, o template escolhe o oposto das anotações que caem embaixo; sem anotação embaixo, o canto da página anterior |

### Anotações

`x` e `y` = o ponto na **imagem inteira** (frações, como o foco: 0,0 é o canto de cima à esquerda). Leia o ponto na folha de candidatas (as linhas marcam 0,25 / 0,5 / 0,75) e **confira no quadro**: a anotação precisa cair no que a pessoa cita. Cada uma é desenhada em `em` (a palavra dita) e fica até o fim do palco (ou até `ate`).

| `tipo` | Quando | Campos |
|---|---|---|
| `circulo` | "este", "aqui", um item entre vários | `tamanho` (diâmetro em fração da largura do painel, 0,12 a 0,6; padrão 0,3), `texto` (etiqueta ao lado) |
| `seta` | direção, lado, um detalhe pequeno | `vem` (`cima`, `baixo`, `esq`, `dir`), `tamanho` (comprimento), `texto` na cauda |
| `marca` | uma linha de print, uma palavra, uma nota | `texto` (nota grifada) ou, sem texto, a faixa de marca-texto: `tamanho` (largura) e `altura` |
| `foco` | "olha aqui", um detalhe | `tamanho` |
| `xis` | o que não deve estar ali | `tamanho` |

Regras:
- **Uma anotação por palavra dita**, no tempo dela; no máximo 3 por palco. Anotar tudo é o mesmo que não anotar nada.
- Etiquetas curtas (até ~22 caracteres), com as palavras da fala.
- A janela fica **longe** do ponto anotado: o template troca o canto sozinho; se precisar, force com `canto`.
- Sem imagem (`--escolher <id> 0`): o painel mostra um cartão com a palavra (nunca uma imagem errada) e as anotações somem junto com a foto; prefira então `topicos` ou `definicao`.

## Os blocos universais

Campos comuns: `tipo`, `de`, `ate`, `legenda?`. Os de palco aceitam também `canto`.

### `abertura` (modo a)
`{ "tipo": "abertura", "de": 0.06, "ate": 1.86, "texto": "Quer fotos de comida que dão fome?", "destaque": "dão fome?", "em": 0.06 }`
- `texto` até ~60 caracteres, palavra por palavra; `destaque`: trecho exato, ganha o sublinhado azul.

### `topicos` e `passos` (palco)
`{ "tipo": "topicos", "de": 30.1, "ate": 35.4, "titulo": "O que cortei", "itens": [{ "texto": "Café na rua", "em": 30.4 }, { "texto": "Streaming", "em": 32.0, "detalhe": "todo mês" }] }`
- 2 a 5 itens, `texto` até ~28 caracteres; `detalhe` só aparece quando cabe (até 3 itens). A linha da vez ganha o marca-texto azul. `passos` = números e ordem.

### `numero` (palco)
`{ "tipo": "numero", "de": 3.02, "ate": 5.2, "valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei" }`
- Conta de 0 a `valor` em 1 s; pt-BR; `prefixo`, `sufixo`, `casas`. `rotulo` até ~30 caracteres. `ilustrativo: true` põe a etiqueta. `de` no máximo ~0,3 s antes do `em`.

### `comparacao` (palco)
`{ "tipo": "comparacao", "de": 12.6, "ate": 15, "modo": "errado-certo", "lados": [{ "rotulo": "Com flash", "texto": "Achata", "em": 13.0, "imagem": { "id": "flash" } }, { "rotulo": "Luz de janela", "texto": "Dá volume", "em": 14.0, "imagem": { "id": "janela" } }], "vencedor": 1, "vencedorEm": 14.4 }`
- Duas metades; cada lado entra no seu `em`, com foto (opcional) em cima. `modo`: `contra`, `antes-depois`, `errado-certo`. `vencedor` ganha o contorno azul.

### `grafico` (palco)
- Com números ditos: `forma` `barras` | `linha` | `pizza`, `dados` (2 a 6 `{ rotulo, valor, em }`), `unidade`. Sem números: `tendencia` + `tendenciaEm` + `"ilustrativo": true`. `titulo` até ~36 caracteres.

### `definicao` (palco)
`{ "tipo": "definicao", "de": 40, "ate": 43.8, "termo": "Regra dos terços", "em": 40.2, "significado": "dividir o quadro em nove partes e pôr o assunto numa linha", "significadoEm": 41.5 }`
- `termo` até ~26 caracteres; `significado` até ~110.

### `destaque` (modo a, o chip)
`{ "tipo": "destaque", "de": 2.0, "ate": 3.1, "texto": "3 truques", "em": 2.03, "nivel": "chave", "detalhe": "com o celular", "detalheEm": 2.5 }`
- 1 a 4 palavras, abaixo da legenda. `alerta` = pílula clara (o erro, o risco). Não repita o que a legenda acabou de mostrar com as mesmas palavras sem necessidade.

### `frase`, `pergunta`, `cta` (modo a)
- `frase`: `texto` até ~120 caracteres, cartão escuro com barra azul à esquerda, palavra por palavra; `destaque` (sublinhado), `risco` + `riscoEm`.
- `pergunta`: `texto` até ~70 caracteres; `opcoes` 2 a 4 (`texto` até ~26, `em`, `imagem` opcional = miniatura redonda).
- `cta`: `texto` até ~60 caracteres; `icone`: `seguir`, `salvar`, `comentar` ou `link`; `destaque`.

## Câmera (modo a)

Sem nada no plano, o zoom troca em cada corte (`cortesEm`) e na volta de cada palco: 1,0 / 1,12 / 1,24, sem repetir. Trechos de 2,4 s ou mais aproximam ~3% devagar.
`"camera": [{ "em": 20.83, "zoom": 1.0, "aproximar": true }, { "em": 3.18, "zoom": 1.12 }]`: um item num corte escolhe o zoom do trecho; fora de um corte é um "soco" de câmera (1 ou 2 por minuto); `aproximar: true` = aproximação lenta de 5% (nunca mais de 6% em 2 s). Zooms de 1 a 1,24.

## Regras de tempo

- Um momento por vez (sem sobreposição). Cobertura de momentos: 70% ou mais. Variedade: 4 tipos ou mais em vídeos de mais de 40 s. O `palco` aparece pelo menos uma vez.
- Algo novo na tela (palco, anotação, chip, corte com reenquadramento) a cada ~4 a 6 s. Nada parado mais de 4,5 s dentro de um momento.
- Um palco por assunto concreto; no máximo ~60% do vídeo no modo (b): a pessoa em quadro cheio é metade da graça.
