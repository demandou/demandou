# O estilo Constelação (versão deitada, 16:9)

O sistema abaixo é o do vertical e vale inteiro no quadro deitado. As medidas do 16:9 e a composição da aula 9 (a pessoa numa moldura redonda à direita, a carta à esquerda, a tela cheia como base) estão em "Medidas (quadro deitado 1920 × 1080)".

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a carta do céu que se desenha com a fala, com qualquer assunto: cada ideia é uma estrela. Quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

Uma aula feita por quem está olhando pelo telescópio. A pessoa abre e fecha o vídeo em tela cheia, que é a base do vídeo deitado; quando uma ideia pede desenho, ela entra numa ocular redonda, na moldura da direita, e a tela vira uma **carta celeste impressa**, como uma prancha de atlas: grade de coordenadas, Via Láctea pontilhada, estrelas de brilhos diferentes, moldura graduada. Enquanto a pessoa fala, o que ela diz acende como estrela, ganha nome, se liga a outras, e retas tracejadas levam o olho até onde a fala aponta. O assunto pode ser qualquer um: motivos, passos, números e comparações viram estrelas, linhas, réguas e cruzes da mesma carta.

## Motion

- **Lápis → tinta.** Tudo o que vai acontecer já está na carta a lápis: estrela com círculo tracejado, linha pontilhada, texto apagado, selo tracejado. Na palavra dita, ganha tinta: a estrela acende com uma onda curta e fica com um anel fino; a linha corre de uma estrela à outra; o texto se acende palavra por palavra; o número conta. Nunca há área vazia esperando.
- **O localizador.** Um círculo vermelho fino com quatro marcas vai sempre ao que está sendo dito (estrela, item, dado, lado) e segue a ponta da reta até o alvo. Se a primeira coisa do bloco demora, ele chega antes, procurando.
- **Íris.** De tela cheia para a carta, o quadro se fecha como uma íris em volta do rosto e o círculo leva a pessoa até a ocular; na volta, o caminho inverso. O texto de tela cheia mora dentro da íris (o círculo o apaga e o revela); a carta só sai quando o círculo cobriu a tela.
- **Luneta.** Entre dois blocos da carta, o céu inteiro desliza (alternando para baixo e para cima) e a ocular sobe ou desce na moldura da direita: o bloco que sai vai com o céu, o que entra chega com ele. A carta tem uma deriva lenta (a câmera nunca para) e as estrelinhas de fundo cintilam de leve.
- **Curvas.** Entra decidido e assenta; as viagens (íris, luneta, localizador, retas) saem devagar e chegam devagar, como um telescópio sendo apontado. Sem quique, sem elástico, sem giro gratuito, sem flash.

## Organização e hierarquia

- **Uma ideia por tela.** Na carta, o conteúdo fica no quadro da esquerda e a pessoa na ocular da direita. O bloco tem um título (itálico, sublinhado, como o nome de uma constelação) ao lado da ocular, na coluna dela (embaixo quando ela está no alto, em cima quando ela está embaixo), ou no alto do quadro quando ela está no meio.
- **Listas, passos, comparação, definição:** estrelas numa coluna à esquerda, nomes grandes à direita; o que está sendo dito acende, o resto fica a lápis.
- **Constelação:** a figura no meio da carta, os nomes dos dois lados (nunca cruzam uma linha); embaixo, o alvo com cruz, rosa dos ventos e nome.
- **Número:** grande, centralizado, com o desenho embaixo (estrelas de quatro pontas, anel graduado ou régua com a reta vermelha); no peito, numa fileira, com o desenho ao lado.
- **Gráficos:** feitos de estrelas (hastes com estrela no topo, estrelas ligadas, anel graduado), com valores em serifa e rótulos em letreiro.
- **Tela cheia:** o texto no peito, centralizado, abaixo do queixo, sobre um degradê escuro, numa faixa larga e baixa; o trecho de ênfase em linha própria, itálico maior; ícones ("?", estrela do destaque, ícone do fechamento) ao lado do texto, não em cima.

## Tipografia

- **Spectral** (serifada de atlas, Google Fonts): títulos, itens, números, nomes. Itálico 500 para nomes de estrelas, de figuras, títulos de bloco e ênfase; 600 para valores, lados da comparação e destaque.
- **Reddit Sans** (Google Fonts): letreiros em caixa-alta espaçada (0,16 em), legenda, rótulos de gráfico, selos. Nas duas fontes o I maiúsculo não se confunde com o l minúsculo.
- Os textos são medidos com as larguras reais das fontes (`src/larguras.ts`, `src/medida.ts`) e diminuem até caber: títulos 60–136 px, itens 44–92 px, nomes de estrela 44–62 px, letreiros 30–44 px, legenda 46 px. Nada abaixo de 30 px.

## A moldura da pessoa

- **Tela cheia:** o vídeo inteiro, como foi gravado; o texto no peito, nunca no rosto.
- **Ocular:** janela redonda escura nas bordas, anel graduado que gira um pouco a cada troca, uma marca vermelha embaixo e a assinatura (nome · área) no arco de cima. No quadro deitado ela é a moldura da direita (aula 9), com o rosto centralizado: `meio-direita` (raio 282 px), `topo-direita` e `baixo-direita` (raio 240 px, com o título ao lado, na coluna dela). As posições `-esquerda` e `baixo-centro` do vertical viram as da direita.
- O rosto é seguido quadro a quadro, com ajuste suave; na ocular ele ocupa ~45% da largura do círculo, medido pela largura do rosto (gravação de perto afasta, de longe aproxima). Nada passa por cima da ocular nem do anel; nenhum texto entra no círculo.

## Cores, textura e som

- **Quatro cores:** céu anil quase preto `#0A0B1F`; branco quente `#F6F1E6` (estrelas e textos); azul-gelo `#BFCBF2` (linhas da constelação, hastes, grade); **um** vermelho de lanterna `#FF5A47` (a luz vermelha do astrônomo) só para o que guia o olho: localizador, reta tracejada até o alvo, cruz, rosa, destaque de alerta, risco, errado. Cinza azulado `#A4ABCB` para letreiros secundários e o "a lápis".
- **Textura:** grade de coordenadas fina, Via Láctea em faixas sobrepostas e pontilhada, estrelinhas de tamanhos variados, vinheta escura nas bordas, moldura de prancha com graduação. Nada de foto de céu, nebulosa colorida, brilho ou glow atrás de nada.
- **Som raro e tonal:** sopro grave na íris (mais leve quando a luneta muda de lugar), uma nota curta por estrela que acende (subindo de altura), tom grave quando a reta chega ao alvo ou o número termina de contar, duas notas no visto, duas notas descendo no alerta, uma no fechamento. Nada de ruído, clique agudo ou sino.

## Medidas (quadro deitado 1920 × 1080)

| O quê | Onde |
|---|---|
| margens seguras (YouTube) | 96 px nas laterais; nada abaixo de y 984 (controles do player) |
| moldura (a ocular com a pessoa) | coluna da direita, de x 1130 a 1824, centro da ocular em x 1472; `meio-direita` y 488 (raio 282), `topo-direita` y 380 e `baixo-direita` y 606 (raio 240) |
| quadro (o conteúdo da carta) | x 106 a 1100, y 116 a 880 (~994 × 764 px), o mesmo nas três posições |
| título do bloco | na coluna da ocular, embaixo dela (y 684 a 876) ou em cima (y 88 a 274), centralizado, em até 2 linhas de 80 a 52 px; com a ocular no meio, no alto do quadro |
| tela cheia | o texto no peito, de `zona.topo` (logo abaixo do queixo, entre 600 e 700) até y 968, ou até a legenda; ~1500 px de largura, em fileiras |
| legenda | terço de baixo, y 894, Reddit Sans 46 px, até ~42 caracteres por linha, nos dois lugares |

### A composição da aula 9 do curso (editar uma aula horizontal)

- Tela cheia como base; a carta abre quando acrescenta clareza e fecha ao fim da ideia.
- A pessoa numa moldura à direita (a ocular), com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto); a explicação no quadro à esquerda, entrando na ordem do raciocínio, com tempo de leitura.
- Sem excesso de cor nem informação simultânea: uma ideia por tela, o vermelho só para guiar o olho.
- Cortes nas pausas excessivas e nos erros, mantendo a respiração natural (o `cortar.mjs` deste modelo só corta pausa acima de ~0,45 s).

## Medidas do vertical (referência; o 16:9 usa as de cima)

- Margem lateral 70 px; nada à direita de 960 px (interface do app e respiro); nada abaixo de ~1540 px (botões do app).
- Carta com a ocular no alto: título ao lado da ocular (até ~384 px de largura), conteúdo de 668 a 1500 px de altura. Com a ocular embaixo no centro: conteúdo de 168 a 938 px.
- Tela cheia: o texto começa em `zona.topo` (logo abaixo do queixo).

## O que pode mudar por vídeo

- Textos, tempos e blocos (é o trabalho do plano); a posição da ocular em cada bloco de carta (`ocular` do momento); o enquadramento da pessoa na ocular (`ocular.zoom`, `ocular.alturaRosto`); `marca`; `sfx: false`.
- Para vídeos sobre o céu: o `ceu` com estrelas reais e a `carta` com passos.

## O que não mudar sem o usuário pedir

- Cores, fontes e tamanhos. Se o usuário pedir a cor da marca dele, troque **só** o vermelho de lanterna (`lanterna` e `lanternaClara` em `src/tema.ts`) por um tom que leia bem sobre o anil.
- A ocular redonda, a íris e a luneta (são a gramática do modelo); a pessoa nunca fica atrás de desenho nem é recortada do fundo.
- Em céu real: a orientação (leste à esquerda) e a projeção.
- Não adicione emojis, stickers, fotos, brilho/glow, gradientes coloridos, contorno em texto, tremidas ou flashes.

## Se precisar de algo que o modelo não tem

Siga a gramática: nasce a lápis, ganha tinta no `em`, cor só do tema (o vermelho só para guiar o olho), texto medido com `src/medida.ts` e ≥ 30 px, no quadro da esquerda (fora da ocular e da coluna dela) e acima dos controles do player. As medidas do quadro deitado ficam em `src/tema.ts` (`QUADRO`, `MOLDURA`, `LEGENDA_Y`) e `src/layout.ts`. Os blocos de carta ficam em `src/componentes/Blocos.tsx` (peças em `Desenho.tsx`), os de tela cheia em `Fala.tsx`, e os tipos em `src/plano.ts`. Consulte a skill do Remotion para as regras de animação.
