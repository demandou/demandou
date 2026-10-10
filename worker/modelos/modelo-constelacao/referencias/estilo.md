# O estilo Constelação

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a carta do céu que se desenha com a fala, com qualquer assunto: cada ideia é uma estrela. Quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

Uma aula feita por quem está olhando pelo telescópio. A pessoa abre e fecha o vídeo em tela cheia; no meio, ela entra numa ocular redonda e a tela vira uma **carta celeste impressa**, como uma prancha de atlas: grade de coordenadas, Via Láctea pontilhada, estrelas de brilhos diferentes, moldura graduada. Enquanto a pessoa fala, o que ela diz acende como estrela, ganha nome, se liga a outras, e retas tracejadas levam o olho até onde a fala aponta. O assunto pode ser qualquer um: motivos, passos, números e comparações viram estrelas, linhas, réguas e cruzes da mesma carta.

## Motion

- **Lápis → tinta.** Tudo o que vai acontecer já está na carta a lápis: estrela com círculo tracejado, linha pontilhada, texto apagado, selo tracejado. Na palavra dita, ganha tinta: a estrela acende com uma onda curta e fica com um anel fino; a linha corre de uma estrela à outra; o texto se acende palavra por palavra; o número conta. Nunca há área vazia esperando.
- **O localizador.** Um círculo vermelho fino com quatro marcas vai sempre ao que está sendo dito (estrela, item, dado, lado) e segue a ponta da reta até o alvo. Se a primeira coisa do bloco demora, ele chega antes, procurando.
- **Íris.** De tela cheia para a carta, o quadro se fecha como uma íris em volta do rosto e o círculo leva a pessoa até a ocular; na volta, o caminho inverso. O texto de tela cheia mora dentro da íris (o círculo o apaga e o revela); a carta só sai quando o círculo cobriu a tela.
- **Luneta.** Entre dois blocos da carta, o céu inteiro desliza (alternando para baixo e para cima) e a ocular muda de canto: o bloco que sai vai com o céu, o que entra chega com ele. A carta tem uma deriva lenta (a câmera nunca para) e as estrelinhas de fundo cintilam de leve.
- **Curvas.** Entra decidido e assenta; as viagens (íris, luneta, localizador, retas) saem devagar e chegam devagar, como um telescópio sendo apontado. Sem quique, sem elástico, sem giro gratuito, sem flash.

## Organização e hierarquia

- **Uma ideia por tela.** O bloco de carta tem um título (itálico, sublinhado, como o nome de uma constelação) ao lado da ocular quando ela está no alto, ou no topo quando ela está embaixo.
- **Listas, passos, comparação, definição:** estrelas numa coluna à esquerda, nomes grandes à direita; o que está sendo dito acende, o resto fica a lápis.
- **Constelação:** a figura no meio da carta, os nomes dos dois lados (nunca cruzam uma linha); embaixo, o alvo com cruz, rosa dos ventos e nome.
- **Número:** grande, centralizado, com o desenho embaixo (estrelas de quatro pontas, anel graduado ou régua com a reta vermelha).
- **Gráficos:** feitos de estrelas (hastes com estrela no topo, estrelas ligadas, anel graduado), com valores em serifa e rótulos em letreiro.
- **Tela cheia:** o texto no peito, centralizado, abaixo do queixo, sobre um degradê escuro; o trecho de ênfase em linha própria, itálico maior.

## Tipografia

- **Spectral** (serifada de atlas, Google Fonts): títulos, itens, números, nomes. Itálico 500 para nomes de estrelas, de figuras, títulos de bloco e ênfase; 600 para valores, lados da comparação e destaque.
- **Reddit Sans** (Google Fonts): letreiros em caixa-alta espaçada (0,16 em), legenda, rótulos de gráfico, selos. Nas duas fontes o I maiúsculo não se confunde com o l minúsculo.
- Os textos são medidos com as larguras reais das fontes (`src/larguras.ts`, `src/medida.ts`) e diminuem até caber: títulos 60–136 px, itens 44–92 px, nomes de estrela 44–62 px, letreiros 30–44 px, legenda 46 px. Nada abaixo de 30 px.

## A moldura da pessoa

- **Tela cheia:** o vídeo inteiro, rosto na linha do centro; o texto no peito, nunca no rosto.
- **Ocular:** janela redonda (raio ~205–226 px) escura nas bordas, anel graduado que gira um pouco a cada troca, uma marca vermelha embaixo e a assinatura (nome · área) no arco de cima. Posições dos blocos universais: `topo-direita`, `topo-esquerda` (título ao lado) e `baixo-centro` (o céu inteiro em cima). A `carta` de céu real usa também as posições de meio e de baixo nos cantos.
- O rosto é seguido quadro a quadro; o zoom na ocular sai da largura do rosto (gravação de perto afasta). Nada passa por cima da ocular nem do anel; nenhum texto entra no círculo.

## Cores, textura e som

- **Quatro cores:** céu anil quase preto `#0A0B1F`; branco quente `#F6F1E6` (estrelas e textos); azul-gelo `#BFCBF2` (linhas da constelação, hastes, grade); **um** vermelho de lanterna `#FF5A47` (a luz vermelha do astrônomo) só para o que guia o olho: localizador, reta tracejada até o alvo, cruz, rosa, destaque de alerta, risco, errado. Cinza azulado `#A4ABCB` para letreiros secundários e o "a lápis".
- **Textura:** grade de coordenadas fina, Via Láctea em faixas sobrepostas e pontilhada, estrelinhas de tamanhos variados, vinheta escura nas bordas, moldura de prancha com graduação. Nada de foto de céu, nebulosa colorida, brilho ou glow atrás de nada.
- **Som raro e tonal:** sopro grave na íris (mais leve quando a luneta muda de lugar), uma nota curta por estrela que acende (subindo de altura), tom grave quando a reta chega ao alvo ou o número termina de contar, duas notas no visto, duas notas descendo no alerta, uma no fechamento. Nada de ruído, clique agudo ou sino.

## Medidas (quadro de 1080 × 1920)

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

Siga a gramática: nasce a lápis, ganha tinta no `em`, cor só do tema (o vermelho só para guiar o olho), texto medido com `src/medida.ts` e ≥ 30 px, fora da ocular e da faixa do app. Os blocos de carta ficam em `src/componentes/Blocos.tsx` (peças em `Desenho.tsx`), os de tela cheia em `Fala.tsx`, e os tipos em `src/plano.ts`. Consulte a skill do Remotion para as regras de animação.
