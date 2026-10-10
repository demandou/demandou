# O plano de edição (`src/plano.json`), versão deitada (16:9)

Os campos são os mesmos do Medida vertical. O quadro é 1920 × 1080 (o vídeo completo do YouTube) e a composição segue a aula 9 do curso: tela cheia como base, a pessoa numa moldura à direita quando entra a explicação, o papel com os blocos à esquerda. Onde cada coisa aparece o template decide sozinho; o plano só diz o quê e quando.

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastro do rosto), `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` (e, se houver, `videoVirada`, `trilha`, `enquadramentos`) e corrige `palavras` quando a transcrição errou um número ou um nome (SKILL.md, passo 4b).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: tela cheia ↔ papel + moldura
3. A assinatura: `medida`
4. Os efeitos próprios: `objeto` e `virada`
5. Os blocos universais
6. Regras de tempo
7. Legenda, sons e trilha
8. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Rafael Moura", "area": "Nutricionista" },
  "videoVirada": "virada/base.mp4",
  "trilha": "trilha.mp3",
  "trilhaVolume": 0.12,
  "sfx": true,
  "correcoes": {},
  "semLegenda": []
}
```

- `marca`: `nome` (40 px, nunca menos de 36) e `area` (Fraunces itálica, 32 px) vão na tarja creme do canto de baixo à esquerda (acima da faixa da legenda), de 0,25 s a 3,9 s. `nome` vazio = sem tarja.
- `videoVirada` (opcional): a mesma gravação de `base.mp4` com a roupa trocada (SKILL.md, passo 4c), caminho dentro de `public/`. Só é usado pela `virada`.
- `trilha` (opcional): um arquivo de música do usuário em `public/` (sem batida; o estilo pede só efeitos sonoros). `trilhaVolume` padrão 0,12.
- `enquadramentos` (opcional): punch de corte à mão, `[{ "de": 0, "zoom": 1.12 }, { "de": 4.2, "zoom": 1 }]`. Sem ele, o template alterna 1,00 ↔ 1,12 nos `cortesEm` (e na virada sem vídeo). Na moldura o punch vira 1,07.
- `maos` (opcional): o rastreio das mãos, gravado por `node ferramentas/maos.mjs` (SKILL.md, passo 4d). Não escreva à mão.
- `sfx`: `false` desliga os sons.
- `rosto` (com `rastro` e `quadro`), `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs` no quadro 1920 × 1080. Não mexa à mão. (A `zona` não é usada: o template reposiciona a pessoa.)

## 2. A gramática: tela cheia ↔ papel + moldura

- **Tela cheia** (a base do vídeo completo): a pessoa ocupa o quadro como foi gravada, com o punch de corte. Ficam em tela cheia: a `virada`, a `abertura` (quando cabe na coluna ao lado da pessoa), o começo de `medida`/`objeto` com objeto (enquanto ele está no peito) e os vãos de mais de 1 s entre momentos. Os títulos de tela cheia ficam na **coluna livre ao lado da pessoa**, na altura do rosto (no quadro deitado não há altura acima da cabeça).
- **Papel + moldura**: todos os outros blocos. O vídeo se recolhe numa **moldura à direita** (x 1184 a 1824, y 132 a 948, cantos de 44 px, borda fina e sombra suave), com o rosto **centralizado** nela e acompanhado de leve pelo rastro; o papel creme aparece e os blocos desenham no **quadro da esquerda: x 96 a 1120, y 132 a 948**. A troca leva 0,52 s e começa 0,1 s antes do `de` do bloco (na `medida`/`objeto` com objeto, no `palcoEm`).
- Dois blocos de papel seguidos (vão ≤ 1 s) mantêm a moldura: só o conteúdo do papel troca (o que sai sobe e some em 0,3 s).
- A legenda fica na **área segura de baixo** em tela cheia (centro em y 918, acima dos controles do player em y 984) e, na moldura, dentro dela, logo abaixo do queixo. O objeto no peito para acima da faixa da legenda.
- É uma aula: abra o papel quando ele acrescenta clareza à fala e volte à tela cheia quando a ideia termina.

## 3. A assinatura: `medida`

```json
{
  "tipo": "medida", "de": 1.26, "ate": 11.73, "legenda": true,
  "objeto": { "forma": "lata", "rotulo": "Refrigerante", "cor": "#24503C", "icone": "limao", "em": 1.36, "rotuloEm": 1.72 },
  "palcoEm": 2.6,
  "quantidade": { "valor": 35, "em": 2.84, "sufixo": "g", "sufixoEm": 3.56, "rotulo": "de açúcar", "rotuloEm": 3.94 },
  "unidades": { "forma": "sache", "numero": 7, "em": 4.78, "rotulo": "sachês", "rotuloEm": 5.12, "detalhe": "de 5 g cada",
                "etiqueta": { "topo": "sachê", "meio": "açúcar", "base": "5 g" }, "contador": true },
  "referencia": { "valor": 25, "em": 5.82, "rotulo": "ideal do dia", "fonte": "OMS", "fonteEm": 6.72,
                  "prefixo": "<", "prefixoEm": 7.43, "valorEm": 7.87 },
  "passou": { "em": 10.47, "despejarEm": 9.45 },
  "selo": "conteúdo ilustrativo"
}
```

Em ordem de tela:

1. **`objeto`** (opcional): nasce pequeno no **ponto de entrega** (peito, eixo do rosto; ou entre as mãos, com `maos`) em `em` (a palavra que o nomeia) e gira até mostrar o rótulo em `rotuloEm` (padrão: `em` + 0,36).
   - `forma`: `lata`, `garrafa`, `caixa` (pacote, maço, caixa de remédio), `pote` (frasco, vidro, pote de creme).
   - `rotulo`: o que está impresso, curto (até ~14 caracteres; sai em maiúsculas espaçadas). **Nunca uma marca.**
   - `cor`: cor do rótulo (hex). Use uma cor coerente com o objeto (verde-escuro, laranja de suco, branco de remédio com cor forte na tampa…). `icone`: `limao`, `folha`, `gota`, `chama`, `estrela`, `cruz`, `moeda` ou `nenhum`. `liquido` (lata e garrafa): cor do que ela despeja (padrão verde-claro translúcido).
   - A lata abre o lacre 0,62 s depois do `palcoEm` (com o som de abrir).
2. **`palcoEm`**: a pessoa vai para a moldura da direita e o objeto voa para o papel da esquerda com um giro. Sem objeto, o papel entra aqui (padrão: `de`).
3. **`quantidade`** (opcional; sem ela, só as unidades): o número grande conta até `valor` a partir de `em` (a primeira palavra do número dito), em pt-BR. `sufixo` ("g", "ml", "mg", "h", "kcal", "mil") entra em `sufixoEm` (a palavra da unidade); `prefixo` ("R$", "US$"); `rotulo` em itálico ("de açúcar") em `rotuloEm`; `casas` decimais. Quando as unidades começam, o número encolhe e vira a etiqueta em cima do objeto.
4. **`unidades`**: caem uma a uma no copo a partir de `em` (a palavra do número de unidades, ou da unidade).
   - `forma`: `sache` (sachê de papel), `cubo` (cubo de açúcar, bloco), `moeda`, `comprimido`. `numero`: de 1 a 12 (cubo e comprimido empilham 2 por camada).
   - `rotulo` ("sachês", "cubos", "moedas de R$ 1") em `rotuloEm`; `detalhe` ("de 5 g cada") em `detalheEm`; `contador: true` soma a cada unidade que pousa (quantidade ÷ número). **O detalhe e o contador são contas**: use só quando saem exatas dos números ditos.
   - `numeroGrande`: o número de unidades grande à direita (padrão: sim, menos no modo ilustrativo). Ponha `false` quando o número de unidades não foi dito.
   - `etiqueta`: o que vai impresso em cada unidade: sachê = `topo` (itálico), `meio` (na faixa) e `base`; moeda = `meio` ("$", "1", "R$"). Cubo e comprimido não levam texto.
5. **`recipiente`**: `copo` (padrão, copo de vidro baixo) ou `pote` (pote de vidro com gargalo, bom para moedas e comprimidos).
6. **`referencia`** (opcional): o anel tracejado em volta do copo, com a guia até o rótulo, em `em` ("ideal", "máximo", "meta", "recomendado").
   - Altura da linha: `valor` na mesma unidade da `quantidade` (35 g em 7 sachês, 25 g → a linha no 5º sachê); sem `quantidade`, `valor` conta em unidades (4 comprimidos); `unidades` força a altura em unidades (pode passar da pilha: meta não atingida); sem nada, 70% da pilha.
   - `rotulo` (itálico, até 2 linhas) em `rotuloEm` (padrão `em` + 0,14); `fonte` (pílula: "OMS", "Anvisa", "Banco Central") em `fonteEm`; `prefixo` ("<", "até", "≤") em `prefixoEm`; o valor em `valorEm`; `sufixo` (padrão o da quantidade). No modo ilustrativo o valor não aparece.
7. **`passou`** (opcional, só quando a quantidade passa da linha): em `em` (a palavra "ultrapassou", "passou", "estourou") o anel fica vermelho, a faixa acima da linha fica vermelha e o marcador ▲ sobe da linha ao topo contando até a quantidade (sem números, mostra `rotulo`, padrão "passou"). `despejarEm` (lata ou garrafa): ela sai do lugar e **despeja** no copo; o líquido cruza a linha exatamente em `em`.
8. `selo` (opcional): o selo no canto de cima à direita do papel ("conteúdo ilustrativo", "valores médios", "fonte: OMS"), depois da referência. `ilustrativo: true` = modo sem números (selo "ilustrativo" por padrão).

Um empurrão lento de câmera (4,5%) acontece no palco da referência até o fim. Para o vídeo não ficar parado, cada fase deve vir a menos de ~2,5 s da outra; se a fala tem um vão maior, parta em dois momentos.

## 4. Os efeitos próprios: `objeto` e `virada`

### `objeto`

```json
{ "tipo": "objeto", "de": 14.0, "ate": 19.5,
  "objeto": { "forma": "caixa", "rotulo": "Biscoito", "cor": "#8C4A2F", "icone": "estrela", "em": 14.2 },
  "palcoEm": 15.4,
  "fatos": [ { "texto": "Recheado", "em": 16.0 }, { "texto": "Ultraprocessado", "em": 16.7, "detalhe": "lista longa de ingredientes" } ] }
```

O objeto nasce no peito (mesmos campos da `medida`), vai para o papel em `palcoEm` (padrão: `em` + 1,2 s) e fica girando devagar; os `fatos` (1 a 3, até ~30 caracteres cada, `detalhe` opcional em itálico) sobem à direita, cada um na palavra. O último fato fica em sálvia. `selo` opcional.

### `virada`

```json
{ "tipo": "virada", "de": 0, "ate": 1.26, "legenda": true, "texto": "E se eu fosse", "nome": "NUTRICIONISTA", "em": 0.03, "nomeEm": 0.107, "trocaEm": 1.067, "cor": "#A9D8B6" }
```

`texto` (opcional, pequeno) e `nome` (grande, letra por letra em `nomeEm`) na coluna livre ao lado da cabeça, em tela cheia (o nome encolhe para caber na coluna). Em `trocaEm` a linha de luz desce pela tela em 0,6 s: com `videoVirada`, acima da linha já é a roupa nova (troca ao vivo, com a fala sincronizada); sem ele, o enquadramento fecha. O título sai em `trocaEm`. `cor`: cor do nome e da luz (padrão menta). Use uma vez, no começo (ou na volta de um "e se…").

## 5. Os blocos universais

Campos exatos de `motor/BLOCOS.md` (iguais em todos os modelos). Limites de texto deste estilo:

| `tipo` | Campos | Limites e comportamento |
|---|---|---|
| `abertura` | `texto`, `destaque?`, `em?`, `rotulo?` | até ~50 caracteres (até 4 linhas, 104→52 px), na coluna ao lado da pessoa; se a coluna tiver menos de 560 px (pessoa no meio de um quadro apertado), vai para o papel |
| `topicos` | `titulo?`, `itens[2..5]` = `{texto, em, detalhe?}` | item até ~40 caracteres (2 linhas); `detalhe` até ~50 |
| `passos` | `titulo?`, `itens[2..5]` | o 1º passo fica embaixo da proveta, o último no alto; item até ~36 caracteres |
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | rótulo até ~60 caracteres (2 linhas) |
| `comparacao` | `titulo?`, `modo?`, `lados[2]` = `{rotulo, texto, em}`, `vencedor?`, `vencedorEm?` | `rotulo` até ~16 (pílula), `texto` até ~50 (4 linhas) |
| `grafico` | `forma`, `dados[2..6]` = `{rotulo, valor, em}` ou `tendencia` + `tendenciaEm` + `ilustrativo: true`, `unidade?`, `titulo?` | rótulos até ~16; `pizza` precisa de `dados` |
| `destaque` | `texto`, `em`, `nivel?`, `detalhe?`, `detalheEm?` | até ~40 caracteres (3 linhas, 132→58 px) |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | termo até ~24; significado até ~120 |
| `frase` | `texto`, `destaque?`, `risco?`, `riscoEm?`, `em?` | até ~90 caracteres (5 linhas) |
| `pergunta` | `texto`, `opcoes?[2..4]`, `em?` | pergunta até ~70; opção até ~28 |
| `cta` | `texto`, `icone?` (`salvar`, `seguir`, `comentar`, `link`), `destaque?`, `em?` | até ~40 caracteres |

Os textos encolhem até o mínimo legível e quebram em linhas; nunca cortam. Encurte com as palavras da fala quando passar do limite.

## 6. Regras de tempo

- Cada `em` cai no **começo** da palavra que nomeia a coisa (±0,15 s). O `conferir.mjs` avisa quando um `em` não cai em nenhuma palavra.
- Os momentos não se sobrepõem: o template corta o `ate` de um momento no `de` do próximo. Para o bloco seguinte entrar na palavra, ponha o `de` dele ~0,1 s antes do primeiro `em`.
- Nada parado: dentro de um momento, algo novo a cada ~1,5–2,5 s (um item, um número, uma fase da medida). O `conferir.mjs` deste modelo reprova acima de 6 s.
- `medida`: `objeto.em` < `palcoEm` < `quantidade.em` < `unidades.em` < `referencia.em` < `passou.despejarEm` < `passou.em`, na ordem em que são ditos. A linha pode vir antes das unidades (meta dita antes) e o copo aparece com ela.

## 7. Legenda, sons e trilha

- A legenda é toda branca com contorno preto, em blocos de até 3 palavras. Ela some durante os momentos sem `legenda: true` (regra do motor). Neste estilo, deixe `legenda: true` na `medida`, no `objeto` e na `virada` (os números e o 3D não repetem a fala inteira); nos blocos universais, ela some (o bloco já mostra o que é dito).
- `correcoes`: `{ "Oms": "OMS" }` troca palavras erradas na legenda; `semLegenda`: trechos extras sem legenda.
- Sons automáticos (tonais e baixos): cristal na virada, ar subindo quando o objeto nasce, lata que abre, sachês que caem (moeda mais aguda, cubo mais grave), líquido que despeja, nota grave do limite, marimba nos tópicos, tons nos passos, no gráfico e nas opções, um toque na definição e no número, um acorde curto no fechamento.

## 8. O exemplo completo

O plano do exemplo (o nutricionista, 11,7 s) está em `assets/template/src/plano.json`: uma `virada` (0–1,26 s, "E se eu fosse / NUTRICIONISTA", troca de roupa em 1,067 s) e uma `medida` (1,26–11,73 s) com lata, 35 g, 7 sachês, a linha da OMS em 25 g e a lata despejando até passar da linha em "ultrapassou". O `plano.json` de `references/exemplo/` é o mesmo, já nas posições do quadro deitado; a folha `quadros.jpg` é a do vertical (o estilo é o mesmo; a composição deitada está descrita aqui e em `estilo.md`).
