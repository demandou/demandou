# O plano do Etapas (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`) e o `capturar.mjs` preenche `imagens`. Você escreve `momentos`, `correcoes`, `semLegenda` e, se quiser, `camera`. `marca` pode ficar `{ "nome": "", "area": "" }` (o Etapas não escreve o nome na tela). `sfx` fica `false` (sem som de efeito).

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. O `em` de itens e opções é o início de uma palavra em `work/palavras.json`; o `em` das telas de uma `etapa` é só o instante do corte de tela (não precisa cair numa palavra).

## Os três modos (vêm do momento ativo)

| Momento | Modo | O que a tela mostra |
|---|---|---|
| `abertura` | A | rosto grande em tela cheia + cabeçalho fixo no topo |
| `etapa`, `grade`, `prova`, `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `frase`, `pergunta` | B | tela no topo (952 × 610 px), pílula na junção, a pessoa com cabeça, ombros e peito e a legenda abaixo do queixo |
| `cta`, ou **nenhum momento** | C | rosto grande em tela cheia, legenda abaixo do queixo |

A troca de modo é sempre corte seco. Campos de todo momento: `de`, `ate`, `legenda?` (padrão `true`: a legenda fica em todo o vídeo), `pilula?` (nome da seção na pílula, só nos blocos de texto do modo B) e `chapeu?` (linha pequena no alto da tela escura).

## Legenda

Minúscula, branca, sem caixa, 2 a 3 palavras por vez, uma linha. Em todos os modos, logo abaixo do queixo. `correcoes` troca palavras na legenda (`{ "com o texto": "contexto", "comenta claude": "comenta \"claude\"" }`).

## A assinatura (1): `etapa`

```json
{ "tipo": "etapa", "de": 2.0, "ate": 4.5, "rotulo": "Papel",
  "telas": [
    { "imagem": { "id": "nutri" }, "em": 2.0, "rolar": [0, 0.12] },
    { "imagem": { "id": "nutri" }, "em": 2.55, "rolar": [0.3, 0.4] },
    { "imagem": { "id": "ia" }, "em": 3.65, "rolar": [0.05, 0.2], "zoom": 1.2 }
  ] }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `rotulo` | sim | o nome da etapa na pílula, caixa-alta automática, 1 a 3 palavras (até ~24 letras); troca em seco no `de` |
| `icone` | não | ícone da pílula (padrão `robo`); mesmos nomes de `destaque` + `robo` |
| `telas[]` | sim, 2 a 8 | cada tela: `imagem.id`, `em` (instante do corte), `rolar` `[de, até]` (0 = topo da página, 1 = fim; padrão `[0, 0.14]`), `zoom` (padrão 1,12), `cursor` `[x0, y0, x1, y1]` (frações da tela; padrão: um passeio curto), `dissolve` (dissolve de ~0,9 s sobre a tela anterior) |

Regras:
- A primeira tela entra no `de` da etapa; as demais, **a cada 0,3 a 1,0 s** na parte rápida (a etapa de 2 a 3 s tem 3 a 5 telas). Prints de assuntos ou pontos diferentes da mesma página: nunca a mesma tela duas vezes seguidas.
- `dissolve: true` **uma vez no vídeo**, só no antes/depois (site antigo → novo). O resto é corte seco.
- Uma etapa sem tela boa vira `destaque` ou `topicos`; nunca um quadrado vazio.
- Etapas seguidas são o formato (o `conferir` só avisa).

## A assinatura (2): `grade`

```json
{ "tipo": "grade", "de": 12.62, "ate": 16.07,
  "telas": [ { "imagem": { "id": "nutri" }, "rolar": [0.05, 0.05] }, { "imagem": { "id": "cardapio" } }, { "imagem": { "id": "veg" } }, { "imagem": { "id": "tabela" } } ] }
```

2 a 5 telas, na ordem das etapas, com círculos laranja numerados (1, 2, 3…). Cada tela pode ter `em` (quando aparece; padrão: o `de` da grade, todas juntas, como no Reel) e `rolar` (um ponto só, página parada). Dura 3 a 4 s, na frase que recapitula ("todo esse fluxo…", "com essas quatro peças…"). Sem pílula.

## A assinatura (3): `prova`

```json
{ "tipo": "prova", "de": 40.3, "ate": 46.2, "imagem": { "id": "agenda" }, "rotulo": "Resultado", "zoom": 1.4, "foco": { "x": 0.5, "y": 0.2 } }
```

Um print real, **parado**, ~6 s ("quatro reuniões marcadas": a agenda). `rotulo` põe a pílula (opcional), `zoom` e `foco` (ponto 0–1 da imagem) enquadram o pedaço que importa; `rolar` `[a, b]` escolhe a altura quando não há foco.

## O cabeçalho: `abertura`

```json
{ "tipo": "abertura", "de": 0, "ate": 7.8, "texto": "Fluxo de agentes", "sub": "Claude Code", "etapas": 4, "icone": "robo" }
```

`texto` = 1ª linha da pílula, `sub` = 2ª linha (opcional), `etapas` = quantos ícones (2 a 5; use o número de etapas da fala), `icone` = o ícone repetido. O cabeçalho vem completo desde o 1º quadro e fica estático. Termina no primeiro corte para a tela: coloque o `ate` no começo da primeira `etapa`. 3 a 8 s.

## Blocos universais na tela do topo

`topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `frase` e `pergunta` têm os campos de `references/adaptar.md` e aparecem na tela do topo, em grafite escuro com texto osso e um laranja. Troca seca. Use `pilula` para pôr o nome da seção na junção. Limites de texto como nos outros modelos (o template mede e reduz a fonte, nunca vaza).

## O fechamento: `cta`

```json
{ "tipo": "cta", "de": 16.07, "ate": 18.04, "texto": "Salva e testa agora", "icone": "salvar" }
```

Modo C: rosto grande em tela cheia; nada por cima além da legenda (a chamada vem dela). Cubra os últimos ~3 a 8 s. A palavra-chave entre aspas vai em `correcoes`. O vídeo termina na última palavra.

## Câmera

Sem `camera`, o rosto dá um salto de escala (8 a 15%) em cada corte, em cada início ou fim de momento e a cada ~3 s de rosto parado. `camera: [{ "em": 3.18, "zoom": 1.12 }]` força um salto (multiplicador sobre o tamanho base) num instante; use no máximo duas vezes.

## Tempo

- Momentos contíguos: o `de` de um é o `ate` do anterior. Os trechos sem momento viram modo C (rosto limpo), que é onde ficam a virada e a oferta.
- A `abertura` cobre o gancho (3 a 8 s); cada `etapa` dura o tempo da frase dela (2 a 6 s); a `grade` 3 a 4 s; a `prova` ~6 s; o `cta` 3 a 8 s.
- `node scripts/conferir.mjs --mapa` até **APROVADO** e `node ferramentas/timing.mjs` até **Tempo OK** (rótulos e itens na palavra, ±0,15 s).
