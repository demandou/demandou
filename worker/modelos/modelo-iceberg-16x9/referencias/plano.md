# O plano de edição (`src/plano.json`)

O `cortar.mjs` preenche `video`, `fps`, `largura` (1920), `altura` (1080), `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`; o `imagens.mjs` preenche `imagens`. Você escreve `marca`, `momentos`, `semLegenda`, `correcoes`. Tempos em segundos na linha do tempo **já cortada** (`work/palavras.json`). Todo `em`/`...Em` é o início de uma palavra dita.

Os campos são os mesmos do Iceberg vertical; nenhum momento tem posição no plano. O lugar de cada coisa no quadro deitado (1920x1080) sai sozinho do template: o conteúdo no quadro da esquerda, a pessoa na janela da direita.

## 1. Campos gerais
`marca`: `{ "nome": "Rafael", "area": "Café" }` (etiqueta no canto da janela da pessoa; vazio = sem etiqueta). `sfx: false` desliga os sons.

## 2. A gramática
Um mundo só: o iceberg desce na tela e as placas dos blocos flutuam sobre ele. No quadro deitado, a regra é a da aula 9 do curso:
- **Respiro** (nenhum momento): a pessoa em tela cheia, com a legenda na área segura de baixo.
- **Momento** (qualquer bloco ou o `iceberg`): a pessoa vai para a janela larga da direita (730x660, rosto no centro) ~0,6 s antes do `de`, e o conteúdo aparece no quadro da esquerda (x 152 a 1032, y 136 a 936). Ela volta à tela cheia no `ate`.
- Entre dois momentos com menos de ~1,6 s de vão, a pessoa fica na janela. Para uma ideia que continua, encoste os momentos (`ate` de um = `de` do próximo); para um respiro de verdade (a pessoa fala sem apoio visual), deixe o vão.

Momentos não se sobrepõem; abra com `abertura` e feche com `cta`. Sem `iceberg` no plano a câmera faz um mergulho lento, mas toda edição precisa de um.

## 3. A assinatura: `iceberg`
```json
{ "tipo": "iceberg", "de": 1.76, "ate": 15.2, "unidade": "m", "niveis": [
  { "nome": "Expresso", "em": 2.87, "rotulo": "Na superfície", "imagem": { "id": "expresso" } },
  { "nome": "Café do Jacu", "em": 6.92, "rotulo": "Descendo mais", "imagem": { "id": "jacu" },
    "inset": { "imagem": { "id": "graos" }, "em": 8.59 },
    "detalhes": [ { "texto": "Grãos que um pássaro come", "em": 9.3 }, { "texto": "e devolve inteiros", "em": 10.3, "destaque": true } ] },
  { "nome": "Kopi Luwak", "em": 13.08, "rotulo": "Lá no fundo", "desceEm": 11.6, "imagem": { "id": "civeta" } }
] }
```
- `niveis`: 2 a 6, do mais conhecido ao mais obscuro. `nome` (até ~28 caracteres), `em` (a câmera chega e o cartão aparece), `rotulo` opcional (etiqueta coral, até ~22 caracteres).
- `imagem: { id, foco?, efeito? }`; sem `imagem`, vira cartão tipográfico.
- `detalhes`: até 3 linhas curtas (≤ 34 caracteres), cada uma no seu `em`; `destaque: true` em coral. O cartão (etiqueta, foto, nome e detalhes) fica centrado no quadro da esquerda; com nome em 2 linhas e 3 detalhes ele encolhe inteiro para caber.
- `inset`: foto pequena e redonda no canto da foto, no `em` dela.
- `desceEm`: quando a câmera começa a descer (padrão: 1,1 s antes do `em`, nunca antes do nível anterior). Dê pelo menos 0,8 s entre o fim de um nível e o `em` do próximo.
- `profundidade`: o número do medidor naquele nível (decorativo; padrão 0, 100, 300, 1.000, 3.000, 8.000). `unidade`: texto do medidor (padrão "m").
- `resumoEm`: a câmera se afasta e mostra o iceberg inteiro com os cartões (use no fecho, com ~1 s livre antes).
- A legenda fica ligada durante o `iceberg` (na base da janela da pessoa).

## 4. Blocos universais (placas de gelo no quadro da esquerda, 880 x 800 px)
- `abertura`: `{ texto, destaque?, em? }` (até ~40 caracteres, 2 linhas).
- `topicos` / `passos`: `{ titulo?, itens: [{ texto, em, detalhe? }] }`, 2 a 5 itens (texto ≤ 40 caracteres, detalhe ≤ 60). Com 5 itens e `titulo`, cada placa tem ~110 px de altura: use `detalhe` curto (até ~40 caracteres) ou deixe sem.
- `numero`: `{ valor, em, rotulo, rotuloEm?, prefixo?, sufixo?, casas?, ilustrativo? }`.
- `comparacao`: `{ titulo?, modo?: "contra" | "antes-depois" | "errado-certo", lados: [{ rotulo, texto, em } x2], vencedor?, vencedorEm? }` (texto ≤ 60 caracteres).
- `grafico`: `{ titulo?, forma: "barras" | "linha" | "pizza", dados?: [{ rotulo, valor, em }] (2 a 6), tendencia?: "sobe" | "cai" | "oscila", tendenciaEm?, unidade?, ilustrativo? }`; sem `dados`, `ilustrativo: true` é obrigatório.
- `destaque`: `{ texto, em, nivel?: "alerta" | "chave", detalhe?, detalheEm? }`.
- `definicao`: `{ termo, em, significado, significadoEm }`.
- `frase`: `{ texto, destaque?, risco?, riscoEm?, em? }`.
- `pergunta`: `{ texto, opcoes?: [{ texto, em }] (2 a 4), em? }`.
- `cta`: `{ texto, icone?: "salvar" | "seguir" | "comentar" | "link", destaque?, em? }`; no último momento fica até o fim.

Todo texto é medido pelo quadro: encolhe até caber na largura e na altura da placa, e nenhuma placa passa do quadro nem entra na janela da pessoa. Texto curto continua se lendo melhor.

## 5. Regras de tempo
- `ate` de um momento = `de` do próximo (na pausa entre frases ou num `cortesEm`) quando a explicação continua; um vão de mais de ~1,6 s devolve a pessoa à tela cheia.
- É uma aula: dê tempo de leitura (um momento com menos de ~2 s não se lê) e não encha cada pausa de bloco. A conferência deste modelo pede pelo menos 50% do vídeo com momento, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s e nada parado mais de ~6 s dentro de um momento.
- Nunca três placas iguais seguidas; alterne com o `iceberg`.
- Cada item/nível entra no `em` da palavra que o nomeia.

## 6. Legenda, correções e sons
`correcoes`: `{ "Kopiluvak": "Kopi Luwak" }`. `semLegenda`: `[{ "de": 1, "ate": 2 }]`. Durante os blocos (fora o `iceberg`) a legenda some, porque a placa já mostra o que é dito; `"legenda": true` no momento a mantém. Quando aparece, ela fica na base da janela da pessoa (abaixo do queixo) e, em tela cheia, na área segura de baixo (até y 956). Sons tonais e baixos já vêm no template.
