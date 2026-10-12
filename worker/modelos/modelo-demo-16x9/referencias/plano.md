# O plano do Demo (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`). Você escreve `marca`, `momentos`, `correcoes`, `semLegenda` e `imagens` (o `imagens.mjs` preenche). Deixe `"sfx": false`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa quando não é).

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "", "area": "" }`. O Demo não mostra o nome de quem fala; os campos existem por contrato e podem ficar vazios |
| `sfx` | `false` (o formato não tem som de efeito) |
| `correcoes` | `{ "Shift + S": "Shift+S", "chat GPT": "ChatGPT" }`: troca palavras na legenda e nos textos falados |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (raro: a legenda é 100% do tempo) |

## A legenda

- Bebas Neue (caixa-alta), ~86 a 96 px, laranja-ouro com contorno marrom-escuro, centro a 80% da altura (y 1536), a mesma altura em split, cheio e eu.
- O modelo divide as linhas do motor em pedaços de **2 a 3 palavras** (até ~15 a 18 letras), sem terminar em artigo ou preposição. Cada pedaço fica até o começo do seguinte, com fade-in de 0,12 s. Sem caixa, sem cor por palavra.
- **Continua** em todos os layouts, inclusive com a faixa verde. **Some** só durante `frase` e `pergunta` (o bloco mostra a própria fala). `legenda: true` ou `false` no momento manda por cima.

## Os layouts

`layout` em qualquer momento: `"split"` (padrão de `tela`, `imagem` e dos blocos), `"cheio"` (só `tela` e `imagem`; os blocos desenhados são do insert de cima e ignoram `cheio`) ou `"eu"` (padrão do `cta`; sem insert, a pessoa em tela cheia, zoom 1,3).

- **split**: insert de y 0 a 845 (44%), sem borda nem cantos; pessoa de 845 à base.
- **cheio**: o insert ocupa 1080×1920; a pessoa continua montada (a voz) mas some.
- **eu**: nada em cima. Use nos trechos em que ele fala direto com quem assiste (o argumento, a chamada final).
- A troca é corte seco e acontece no `de` do momento: ponha cada `de` na palavra que nomeia o novo material (de preferência num corte da fala, `cortesEm`).
- Cada layout dura de 3 a 17 s (média ~8 s); o resultado impressionante pode ficar até ~10 s.

## O insert

Cada momento (menos a `abertura`) ocupa o insert inteiro e fica nele **até o próximo começar**. Campos de todo momento: `de`, `ate`, `layout?`, `legenda?`, `chapeu?`.

## A assinatura (1): `tela`

```json
{ "tipo": "tela", "de": 3.31, "ate": 5.18, "layout": "split", "legenda": true, "captura": "chrome", "proporcao": 1.597,
  "ini": { "x": 0.36, "y": 0.225, "zoom": 1.3 }, "fim": { "x": 0.36, "y": 0.285, "zoom": 2.3 },
  "cursor": [ { "x": 0.40, "y": 0.265, "em": 3.95 }, { "x": 0.47, "y": 0.281, "em": 5.17, "clique": true }, { "x": 0.50, "y": 0.285, "em": 6.4 } ] }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `captura` | sim | nome do arquivo em `public/tela/` sem a extensão (`chrome` = `public/tela/chrome.jpg`) |
| `proporcao` | sim | altura ÷ largura da captura (o `capturar.mjs` imprime) |
| `ini`, `fim` | sim | a câmera no primeiro e no último quadro: `x`,`y` = centro do que se vê, em frações da captura inteira; `zoom` 1 = a captura na largura do insert (a página inteira de ponta a ponta), 2 = metade da largura. Devem ser **diferentes** (a tela nunca para): rolar (`y` muda) e/ou aproximar (`zoom` sobe) |
| `cursor` | recomendado | pontos `{ x, y, em, clique? }` em frações da captura. O cursor chega ao ponto no `em` (a palavra que nomeia o item), vindo do anterior em até 0,7 s; `clique: true` desenha o toque. Depois do último ponto, deriva de leve |

Regras:
- **Cada cena dura de 3 a 10 s** e começa onde uma frase começa. O momento `tela` precisa de um ponto de `cursor` com `em` a cada ~3 s (o `conferir` reprova momento parado).
- Capture a página com `--largura 1280`; o texto fica legível no celular a partir de zoom ~1,3 (split) e ~1,9 (cheio, que mostra a página larga em pé). A câmera é limitada pelas bordas da captura: o centro de `x` e `y` é corrigido para nunca passar da borda.
- Altura visível = `alt ÷ (1080 × proporcao × zoom)` da captura, com `alt` = 845 (split) ou 1920 (cheio); largura visível = `1 ÷ zoom`. Em `cheio` a captura precisa cobrir o quadro: `zoom` ≥ 1920 ÷ (1080 × `proporcao`), senão sobra fundo branco embaixo.
- O cursor só aponta para texto que existe na captura. Meça as frações num recorte (não chute).
- Capturas de uma página com o aviso "entrar" no canto são aceitas; só não aponte para ele.

## A assinatura (2): `imagem`

```json
{ "tipo": "imagem", "de": 0, "ate": 3.31, "imagem": { "id": "saida" }, "efeito": "aproximar", "legenda": true }
```

- `imagem.id`: o id de uma imagem do plano (`plano.imagens`, preenchido pelo `scripts/imagens.mjs`, fontes grátis; veja `references/imagens.md`). `imagem.foco` (opcional) muda o ponto de foco.
- `efeito`: `aproximar` (padrão, ~14% ao longo do trecho), `afastar` ou `panoramica`. Nunca fica parada.
- Entra e sai em corte seco. Sem moldura, sem sombra. `layout` split (padrão) ou cheio.
- Uso típico: a imagem-metáfora do gancho e a arte ou o print de resultado (pode ficar até ~10 s).

## A assinatura (3): `abertura` (a faixa verde)

```json
{ "tipo": "abertura", "de": 0, "ate": 3.31, "texto": "Venda mais com o seu site", "legenda": true }
```

- `texto`: o **benefício** em até ~30 caracteres, em caixa-alta e **duas linhas** (o modelo quebra pelo meio das palavras). Faixa verde sólida `#4CD137`, texto branco em Manrope 800, ~44% a 70% da largura, centrada na emenda do split (y 845), cantos de 14 px.
- Está pronta desde `de` (use 0) e some em corte seco no `ate`: o primeiro corte de layout, de 3 a 7 s. Nunca reaparece. Só existe no layout split: se o primeiro momento for `cheio` ou `eu`, ela não aparece.
- Coexiste com o primeiro momento do insert (os dois cobrem o mesmo tempo).

## Os blocos universais (dentro do insert, só em split)

Campos comuns: `tipo`, `de`, `ate`, `legenda?`, `chapeu?`. Ocupam o insert de cima (845 px) no lugar da gravação, em corte seco. Use pouco; o Reel original só tem gravação, imagem e a pessoa.


## Regras de tempo

- Os momentos do insert (`tela`, `imagem`, blocos) cobrem o vídeo inteiro, um depois do outro, sem sobreposição (`ate` de um = `de` do seguinte). A `abertura` fica por cima do começo.
- Cada layout de 3 a 17 s; um ponto de cursor a cada ~3 s dentro de cada `tela`; nenhum momento parado mais de 4,5 s.
- Cobertura 70% ou mais. Variedade: a `abertura`, a `imagem`, a `tela` e o `cta` bastam em vídeos de até 20 s; de 20 a 40 s use 3 a 4 tipos; acima de 40 s, 4 ou mais.
- A `tela` e a `abertura` aparecem pelo menos uma vez (a assinatura). O aviso "três `tela` seguidos" é esperado: ignore-o.
