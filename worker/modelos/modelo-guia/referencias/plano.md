# O plano do Guia (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com rastro, `cortesEm`, `palavras`); o `capturar.mjs` registra os prints em `imagens`. Você escreve `mapa`, `momentos`, `correcoes`, `marca` (vazia: `{ "nome": "", "area": "" }`) e `semLegenda` (um item cobrindo o vídeo todo: `[{ "de": 0, "ate": <duração> }]`).

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json`.

Campos gerais: `recorte` (`false` = sem recorte, para quem não tem macOS), `sfx` (`false` desliga o "vum" do zoom).

## O mapa (um por vídeo)

```json
"mapa": { "titulo": "Roteiro em 5 passos para dominar X", "subtitulo": "para iniciantes",
  "placas": [ { "titulo": "Primeiros passos", "detalhe": "Como configurar a ferramenta" }, … ] }
```

- 2 a 6 placas. `titulo`: 2 a 4 palavras. `detalhe`: até ~40 caracteres. `titulo` do mapa: até ~50 caracteres. `subtitulo` opcional (curto).
- Use as palavras da fala; não invente etapas que a pessoa não cita.

## A assinatura 1: `mapa` (momento)

```json
{ "tipo": "mapa", "de": 0, "ate": 6.07, "pessoa": "dir" }            // infográfico inteiro
{ "tipo": "mapa", "de": 6.07, "ate": 7.23, "foco": 0, "pessoa": "centro" }   // zoom na placa 1
```

`foco` = índice da placa (0 = primeira); o zoom mostra o bloco da placa (número, título, detalhe) grande, junto à margem do lado dele, sem a estrada. O `de` do zoom é o instante da palavra do número ("dia | um"). O primeiro momento do vídeo começa em 0 com o mapa inteiro. Zoom: 1,2 a 3 s.

## A assinatura 2: `print`

```json
{ "tipo": "print", "de": 8.23, "ate": 9.9, "pessoa": "centro", "imagem": { "id": "etapa2" },
  "setas": [ { "em": 8.23, "x": 0.22, "y": 0.62, "vem": "baixo", "texto": "escolhe o modelo", "textoEm": 8.94 } ] }
{ "tipo": "print", "de": 4.9, "ate": 6.29, "imagem": { "id": "etapa1" }, "endereco": "chatgpt.com" }
```

- `imagem.id`: o `id` registrado por `capturar-tela.mjs`/`capturar.mjs` em `imagens`. Recorte o print no trecho citado na captura (`--recorte`): o cartão mostra a imagem inteira na largura dele (936 px; 952 com `topo`), com a altura da própria imagem (sem faixa).
- `setas[]`: `x`,`y` = o ponto na **imagem inteira** (frações; é a ponta da seta); `em` = a palavra do botão; `vem` = de onde chega (`cima`, `baixo`, `esq`, `dir`; padrão `cima`, e vira `baixo` sozinho se a cauda passaria do topo seguro); `texto` opcional (até ~20 caracteres, pílula vermelha ao lado da haste); `textoEm` = a palavra da pílula (padrão: junto com a seta).
- `endereco`: barra de navegador no alto do cartão com o site falado ("chatgpt.com").
- `rotulo`: pílula preta acima do cartão. `foco`: o ponto do zoom (padrão: a primeira seta). `zoom`: aproximação (padrão 1: o print já vem recortado).
- O cartão começa em y 140 (216 com `rotulo`) e termina antes de y 900 (a cabeça pode sobrepor a base). Pessoa `topo`: cartão de 952 px a partir de y 500.
- Etapa que só existe logado: mostre o elemento real visível sem login com a seta; nunca desenhe interface.

## O campo `pessoa`

Em qualquer momento: `"dir"`, `"esq"`, `"centro"`, `"topo"`, `"borda"` ou `[{ "em": 41.0, "pose": "dir" }, …]`. Use `topo` com prints grandes, `borda` com conteúdo à esquerda, e varie: nunca a mesma pose em três telas seguidas.

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
| `pergunta` | `texto`, `opcoes?[{texto, em}]` (2 a 4), `em?` | |
| `cta` | `texto`, `destaque?`, `icone?`, `em?`, `fundo?` | `texto` = a pílula, ex. "Comenta GUIA"; começa na palavra "comenta" e dura até o fim; atrás dela fica o último print, parado no cartão (ou `fundo`) |

## Regras de tempo

- **Gate de timing:** `node ferramentas/conferir-tempos.mjs` reprova qualquer zoom, print, seta, item ou CTA cujo `de`/`em` fique a mais de 0,15 s do início da palavra que o nomeia.

- Uma tela nova a cada 3 a 6 s (média ~4,5 s, nenhuma acima de 8 s sem a pessoa mudar de lugar), sem buracos entre momentos.
- O `em` de cada seta/item cai na palavra que o nomeia (o `conferir` avisa quando não cai).
- O vídeo termina na última palavra, sem tela final; o `cta` ocupa os últimos 3 a 5 s.
