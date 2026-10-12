# O plano do Guia, versão deitada (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo 1920×1080, medidas, `rosto` com rastro e `quadro`, `cortesEm`, `palavras`); o `capturar.mjs` registra os prints em `imagens`. Você escreve `mapa`, `momentos`, `correcoes`, `marca` (vazia: `{ "nome": "", "area": "" }`) e `semLegenda` (um item cobrindo o vídeo todo: `[{ "de": 0, "ate": <duração> }]`).

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json`.

Campos gerais: `recorte` (`false` = a pessoa no retângulo da moldura mesmo com `public/pessoa.webm`; sem esse arquivo vale o mesmo), `sfx` (`false` desliga o "vum" do zoom).

## O quadro deitado (regra da aula 9)

- **Os trechos sem momento são a tela cheia**: a pessoa como foi gravada. É a base do vídeo longo.
- **Cada momento abre a tela de aula**: fundo branco, a tela do bloco no quadro da esquerda e a pessoa na moldura da direita (rosto no meio, acompanhado). Corte seco na entrada e na saída.
- Um vão menor que 0,5 s entre dois momentos emenda os dois (a tela anterior fica até a seguinte entrar). Para voltar à tela cheia, deixe um vão de verdade (2 s ou mais), no fim de uma ideia.
- Pelo menos 50% do vídeo com momento; nenhum vão de mais de ~8 s; um momento a cada ~10 s; nada parado mais de ~6 s dentro de um momento (o `conferir.mjs` cobra).
- As telas são desenhadas em **px lógicos** (1080 de largura, conteúdo entre y 96 e ~930) e ampliadas ~1,04x até o quadro da esquerda. As medidas abaixo são nesses px.

## O mapa (um por vídeo)

```json
"mapa": { "titulo": "Roteiro em 5 passos para dominar X", "subtitulo": "para iniciantes",
  "placas": [ { "titulo": "Primeiros passos", "detalhe": "Como configurar a ferramenta" }, … ] }
```

- 2 a 6 placas. `titulo`: 2 a 4 palavras. `detalhe`: até ~40 caracteres. `titulo` do mapa: até ~50 caracteres (até 2 linhas). `subtitulo` opcional (curto, uma linha).
- No quadro deitado a estrada atravessa a tela da esquerda para a direita e as placas ficam em fileira, alternando acima e abaixo dela, na ordem. Com 5 ou 6 placas os blocos ficam mais estreitos: títulos curtos.
- Use as palavras da fala; não invente etapas que a pessoa não cita.

## A assinatura 1: `mapa` (momento)

```json
{ "tipo": "mapa", "de": 0, "ate": 6.07 }              // infográfico inteiro
{ "tipo": "mapa", "de": 6.07, "ate": 7.23, "foco": 0 }  // zoom na placa 1
```

`foco` = índice da placa (0 = primeira); o zoom mostra o bloco da placa (número, título, detalhe) grande, no meio do quadro da esquerda, sem a estrada. O `de` do zoom é o instante da palavra do número ("dia | um"). O mapa inteiro entra quando a pessoa apresenta o roteiro (no começo do vídeo ou do trecho). Zoom: 1,2 a 3 s.

## A assinatura 2: `print`

```json
{ "tipo": "print", "de": 8.23, "ate": 9.9, "imagem": { "id": "etapa2" },
  "setas": [ { "em": 8.23, "x": 0.22, "y": 0.62, "vem": "baixo", "texto": "escolhe o modelo", "textoEm": 8.94 } ] }
{ "tipo": "print", "de": 4.9, "ate": 6.29, "imagem": { "id": "etapa1" }, "endereco": "chatgpt.com" }
```

- `imagem.id`: o `id` registrado por `capturar-tela.mjs`/`capturar.mjs` em `imagens`. Recorte o print no trecho citado na captura (`--recorte`): o cartão mostra a imagem inteira na largura dele (936 px lógicos, ~977 px no vídeo), com a altura da própria imagem (sem faixa).
- `setas[]`: `x`,`y` = o ponto na **imagem inteira** (frações; é a ponta da seta); `em` = a palavra do botão; `vem` = de onde chega (`cima`, `baixo`, `esq`, `dir`; padrão `cima`; vira `baixo` sozinho se a cauda passaria do topo seguro, e `cima` se passaria da base útil); `texto` opcional (até ~20 caracteres, pílula vermelha ao lado da haste); `textoEm` = a palavra da pílula (padrão: junto com a seta).
- `endereco`: barra de navegador no alto do cartão com o site falado ("chatgpt.com").
- `rotulo`: pílula preta acima do cartão. `foco`: o ponto do zoom (padrão: a primeira seta). `zoom`: aproximação (padrão 1: o print já vem recortado).
- O cartão começa em y 140 (216 com `rotulo`) e vai no máximo até y ~930; o print alto rola até o ponto, o print baixo desce para perto do meio da tela de aula.
- Etapa que só existe logado: mostre o elemento real visível sem login com a seta; nunca desenhe interface.

## O campo `pessoa`

As poses do vertical (`"dir"`, `"esq"`, `"centro"`, `"topo"`, `"borda"`, `"canto"` ou a lista de trocas) são aceitas e **ignoradas** no quadro deitado: durante a tela de aula a pessoa fica sempre na moldura da direita. Não precisa escrever.

## Os 11 blocos universais

Campos exatos em `references/adaptar.md` e no contrato do motor; no Guia:

| `tipo` | Campos | Observações |
|---|---|---|
| `abertura` | `texto`, `destaque?`, `em?` | até ~60 caracteres, 4 linhas |
| `topicos` | `titulo?`, `itens[{texto, em, detalhe?}]` (2 a 5) | texto até ~40 caracteres: vira pílula preta |
| `passos` | `titulo?`, `itens[...]` (2 a 5) | em ordem, numerados |
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | |
| `comparacao` | `titulo?`, `modo?`, `lados[2]{rotulo, texto, em}`, `vencedor?`, `vencedorEm?` | texto até ~60 caracteres |
| `grafico` | `forma`, `dados?[{rotulo, valor, em}]` (2 a 6), `tendencia?`, `unidade?`, `ilustrativo?` | |
| `destaque` | `texto`, `em`, `nivel?`, `detalhe?`, `detalheEm?` | texto até ~24 caracteres |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | |
| `frase` | `texto`, `destaque?`, `risco?`, `riscoEm?`, `em?` | até ~100 caracteres |
| `pergunta` | `texto`, `opcoes?[{texto, em}]` (2 a 4), `em?` | opção até ~22 caracteres (fileiras de duas) |
| `cta` | `texto`, `destaque?`, `icone?`, `em?`, `fundo?` | `texto` = a pílula, ex. "Comenta GUIA"; começa na palavra "comenta" e dura até o fim; atrás dela fica o último print, parado no cartão (ou `fundo`) |

## Regras de tempo

- **Gate de timing:** `node ferramentas/conferir-tempos.mjs` reprova qualquer zoom, print, seta, item ou CTA cujo `de`/`em` fique a mais de 0,15 s do início da palavra que o nomeia.

- Dentro de um passo explicado, uma tela nova a cada 3 a 8 s; entre um passo e outro, a pessoa pode voltar à tela cheia (vão de 2 a 8 s).
- O `em` de cada seta/item cai na palavra que o nomeia (o `conferir` avisa quando não cai).
- O vídeo termina na última palavra, sem tela final; o `cta` ocupa os últimos 3 a 5 s.
