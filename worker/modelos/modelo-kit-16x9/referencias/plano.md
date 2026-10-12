# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser, `progresso`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`. Todo campo `em` ou `…Em` é o `em` de uma palavra dita. Nada aparece antes de ser dito.

## 1. Campos gerais

```json
{ "marca": { "nome": "", "area": "" }, "sfx": true, "progresso": true, "correcoes": {}, "semLegenda": [] }
```

- `marca`: não aparece neste modelo (pode ficar vazia). `sfx: false` desliga os sons. `progresso: false` tira a fita de cobalto do topo.
- `semLegenda`: faixas `{ "de", "ate" }` sem legenda. A legenda também some nos momentos com `legenda: false`.
- `rosto`, `zona`, `videoAltura`, `cortesEm`, `imagens`: não mexa à mão. Neste modelo o quadro é deitado: `largura` 1920, `altura` 1080, `videoAltura` 1080, e `rosto.quadro` diz que o rosto foi medido no quadro 1920×1080 (o `cortar.mjs` grava tudo isso).

## 2. A gramática (quadro deitado, 1920×1080)

A regra é a da aula 9 do curso (editar uma aula horizontal). A tela tem **dois estados**:

- **tela cheia** (a base): a pessoa como foi gravada, a legenda no terço de baixo (centro em y 916), no meio do quadro;
- **mesa aberta** (em todo momento do plano): a pessoa desliza em 0,4 s para a **moldura da direita** (x 1180 a 1920, a altura toda; rosto centralizado na largura, a ~40% da altura, acompanhado com suavidade), e a **mesa** ocupa o **quadro da esquerda** (x 0 a 1180; área útil das folhas: x 96 a 1116, y 84 a 884). A legenda fica dentro da moldura, no terço de baixo. O contador do kit fica no pé da mesa, à esquerda (y 904 a 972).

A mesa abre 0,3 s antes do `de` do momento (para estar aberta quando a primeira peça cai) e fecha logo depois do fim dele. Momentos separados por menos de ~1,2 s formam um trecho só (a mesa fica aberta entre eles); um respiro maior volta para a tela cheia. Tudo o que o plano manda cai na mesa. O `kit` vive num mundo maior que a tela, e a câmera desliza por ele; os outros blocos são folhas postas na mesa (o tampo escorrega por baixo delas a cada novo bloco). Nada passa da borda da mesa para a moldura nem desce abaixo de y 984 (controles do player).

## 3. A assinatura: `kit`

```json
{ "tipo": "kit", "de": 2.0, "ate": 14.4, "titulo": "opcional (não aparece)", "lugaresEm": 2.45, "afastarEm": 12.45,
  "total": "Tudo junto custa menos que uma câmera", "totalEm": 13.0,
  "itens": [
    { "nome": "Tripé", "em": 4.29, "detalhe": "para a imagem não tremer", "detalheEm": 5.06, "preco": "R$ 49", "imagem": { "id": "tripe" } }
  ] }
```

- `itens`: **2 a 6**. `nome` (até ~28 caracteres) e `em` (instante em que o nome é dito: o objeto **pousa** nesse instante; a câmera começa a chegar 0,4 s antes). `detalhe` (para que serve, até ~40 caracteres) aparece em `detalheEm` (padrão: `em` + 0,72). `preco` só se a pessoa disse o valor. `imagem: { id, foco?, efeito? }`: sem imagem, vira um cartão de papel pardo com o nome.
- `lugaresEm` (padrão `de` + 0,2): quando os contornos pontilhados numerados aparecem e o contador mostra "0 de N". Ponha na fala que anuncia o kit ("quatro coisas").
- `afastarEm`: a câmera se afasta para mostrar tudo (leva 0,8 s e já sai um pouco antes). Padrão: último item + 1,4 s. Depois disso o contador vira cobalto com ✓.
- `total` + `totalEm`: a frase que fecha o kit, numa etiqueta kraft embaixo (até ~44 caracteres; sai quando um `cta` começa). Opcional.
- Um **`cta` logo depois do `kit`** cai sobre a mesa completa e o kit continua visível atrás (o `ate` do kit = o `de` do `cta`).
- Layout: 2 colunas; 1 item fica no centro; item ímpar fica no centro da última linha; 5 ou 6 itens diminuem os cartões. Cada coluna ímpar (2ª, 4ª…) espelha a etiqueta.
- `legenda`: ligada por padrão no `kit`.

## 4. Os 11 blocos universais (folhas na mesa)

Campos comuns: `tipo`, `de`, `ate`, `legenda?`. Limites de texto: o template mede e reduz o corpo, mas respeite os tamanhos.

- **`abertura`**: `texto` (até ~40 caracteres, 3 linhas), `destaque?` (trecho exato), `em?`. Uma folha com fita; o texto se monta palavra por palavra na fala.
- **`topicos`**: `titulo?` (até ~30), `itens` de 2 a 5 `{ texto (até ~30), em, detalhe? (até ~40) }`. Cada item cai como etiqueta.
- **`passos`**: igual, em ordem; numerados e ligados por barbante.
- **`numero`**: `valor`, `em`, `rotulo` (até ~30), `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?`. Etiqueta de preço; conta em 0,9 s. Formato pt-BR. Para "83 mil dólares": `valor 83, prefixo "US$", sufixo " mil"`.
- **`comparacao`**: `titulo?`, `modo?` (`contra`, `antes-depois`, `errado-certo`), `lados` (2 × `{ rotulo (até ~14), texto (até ~40), em, imagem? }`), `vencedor?` (0 ou 1), `vencedorEm?`.
- **`grafico`**: `titulo?`, `forma` (`barras`, `linha`, `pizza`), `dados?` (2 a 6 números DITOS: `{ rotulo, valor, em }`), `unidade?`, ou sem dados `tendencia` (`sobe`, `cai`, `oscila`) + `tendenciaEm` + `ilustrativo: true`.
- **`destaque`**: `texto` (até ~28), `em`, `nivel?` (`chave` ou `alerta`), `detalhe?`, `detalheEm?`.
- **`definicao`**: `termo` (até ~24), `em`, `significado` (até ~100), `significadoEm`.
- **`frase`**: `texto` (até ~90), `destaque?`, `risco?` + `riscoEm?`, `em?`.
- **`pergunta`**: `texto` (até ~80), `em?`, `opcoes?` (2 a 4 × `{ texto (até ~30), em }`).
- **`cta`**: `texto` (até ~40), `icone?` (`salvar`, `seguir`, `comentar`, `link`), `destaque?`, `em?`. Fica até o último quadro.

## 5. Regras de tempo

- Um momento nunca fica mais de ~2,5 s sem nada novo: use o `detalhe` dos itens, os lados de uma comparação, os dados de um gráfico.
- A tela cheia é a base do vídeo completo: entre as ideias, deixe respiros só com a pessoa e a legenda (de 1 a ~8 s); o `conferir.mjs` deste modelo pede ≥ 50% do vídeo com momento e nenhum trecho de mais de ~8 s sem momento.
- Momentos vizinhos podem encostar (`ate` de um = `de` do próximo); o que sai é varrido em 0,3 s e o seguinte cai.
- O `kit` precisa de ~1,5 s entre um item e o próximo; a vista final fica parada por ≥ 1,2 s.
- Todo `em` cai no começo da palavra que nomeia o item (o `conferir.mjs` avisa os que não caem).

## 6. Legenda, correções e sons

Fita crepe no terço de baixo (no meio do quadro com a pessoa em tela cheia, centrada na moldura da direita com a mesa aberta), 1 a 3 palavras por vez (`node scripts/legendas.mjs` lista as linhas). Nomes que a transcrição errou: `correcoes`. Sons (`public/sfx`): batida surda ao cair, toque na etiqueta, deslize no afastar, carimbo nos destaques e no total, fecho no `cta`; todos baixos.

## 7. O exemplo completo (kit para gravar com o celular, 15,8 s)

Está em `src/plano.json` do template: `abertura` (0 s) → `kit` com 4 itens, `afastarEm` 12,45 e `total` → `cta` "Salva essa lista". É um corte curto: os três momentos encostam, então a mesa fica aberta do começo ao fim. Num vídeo completo, os blocos ficam mais espaçados e a pessoa volta para a tela cheia entre eles.
