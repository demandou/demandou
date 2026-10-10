# O estilo Ranking

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **contagem regressiva**: uma lista que se completa diante do espectador e um primeiro lugar escondido que o faz ficar até o fim. Ele é feito de poucas peças repetidas com rigor: casa de placar, selo limão, foto em tela cheia que voa, tarja azul. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, contorno, emoji solto, transição de efeito) piora.

O estilo vale para qualquer lista: filmes, ferramentas, hábitos, erros, cidades, investimentos, dicas, o melhor e o pior de qualquer coisa. O que muda de um vídeo para outro é o conteúdo das casas e as imagens, nunca a linguagem visual abaixo. Diferença para o Carrossel: o Carrossel são páginas que deslizam; o Ranking é um placar que se completa.

## A ideia

A pessoa fala a lista de trás para a frente, e o vídeo **completa um placar**. A cada posição, três tempos: o número **bate**, a foto **toma a tela** e **voa** para a casa dela. O primeiro lugar fica escondido atrás de um "?" até ser dito, e é revelado com um foco de luz. A pessoa fica embaixo do placar o tempo todo (nunca numa coluna estreita).

## 1. Dinâmica do motion

- **O número bate** (0,5 s): um selo limão de 330 px salta no meio do placar (220% → 100% em 0,16 s, com um tremor curto e uma leve inclinação) e voa em 0,22 s até a aba da casa, onde a aba vira limão e assenta.
- **A foto toma a tela** (`tela`, padrão 1 s): entra seca, 7% maior, assenta em 0,2 s e aproxima devagar (12%). A aba do número (190 px) e a plaquinha do nome (giz, ou limão no 1º lugar) entram com um leve passar do ponto. Nada de fade, nada de flash.
- **A foto voa** (0,35 s, curva suave): o retângulo da tela inteira encolhe até a miniatura da casa, com uma inclinação máxima de 5° no meio do voo; a plaquinha some; o nome da casa desliza para dentro (0,3 s). Sem foto, o cartão azul voa até o corpo todo da casa.
- **A casa da vez** tem borda limão e três pontos que pulsam enquanto espera a foto pousar; depois assenta (a aba passa de limão a azul em 0,4 s).
- **O 1º lugar**: desde o começo, uma casa escura tracejada em limão, com um "?" que balança e uma luz que corre na casa. Na revelação (`em` da posição 1): o placar escurece (62%), um feixe de luz limão cai sobre a casa, o selo bate e a foto chega com uma moldura limão de 22 px e 30% mais tempo. A casa do vencedor fica com borda limão grossa.
- **Placar**: as casas entram em sequência (0,04 s entre elas) e as vazias ficam esperando, tracejadas. Troca de lugar: a pessoa desce em 0,4 s e o placar desce junto com a emenda; na volta, ela sobe cobrindo tudo.
- **Nada parado**: o "?" balança, a luz corre na casa secreta, a barra do topo anda o vídeo inteiro.

## 2. Organização e hierarquia

- **Duas telas**: quadro cheio (abertura e fechamento: texto no peito, na `zona` abaixo do queixo) e **placar em cima com a pessoa embaixo** (placar entre y 132 e 872; emenda em y 900). A foto em tela cheia cobre as duas por ~1 s.
- **O placar**: 1º lugar no alto, último embaixo; a contagem sobe. Altura da casa = (espaço − intervalos) / N, entre 76 e 140 px; intervalo de 12 px; título (64 px) acima das casas quando existir.
- **A casa**: aba quadrada (a largura da aba é ~96% da altura da casa) com o número em 900; corpo com o nome em caixa alta e, com foto, a miniatura quadrada à direita; `detalhe` numa linha pequena abaixo do nome.
- **Legenda**: telas de até 3 palavras numa linha, centradas; abaixo do queixo no quadro cheio, na emenda com a pessoa embaixo (por cima da foto em tela cheia).
- Cantos reservados: nada acima de y 110 além da barra de progresso (abas do app), nada importante abaixo de y 1540 nem na coluna da direita abaixo de y 1080 (botões do app). A plaquinha do nome da foto fica em y ~1050, acima de y 1540.

## 3. Tipografia

- **Uma família só: Rubik** (Google Fonts), larga, de cantos levemente arredondados, com algarismos fortes: lê de longe no celular.
- 900 em caixa alta: números, nomes, títulos, tarjas e legenda. 700–800: detalhes, itens e significados.
- Tamanhos (quadro de 1080 de largura): número da aba = 66% da altura da casa; selo do número 330 px (algarismo 72%); nome na casa 26–62 px; nome na tela cheia 56–150 px (até 2 linhas); título 30–52 px; "TOP N" 40 px; legenda 66 px. O texto é medido com as larguras reais da fonte (`src/larguras.ts`) e diminui para caber; nunca é cortado.
- Nada de fonte condensada, nada de contorno nas letras, nada de sombra borrada no texto.

## 4. Moldura da pessoa

- **Quadro cheio**: o vídeo inteiro, rosto na linha do centro.
- **Pessoa embaixo**: caixa de y 900 até a base, na largura toda; a cabeça inteira logo abaixo da legenda da emenda (calculado pela largura do rosto), seguindo o rosto quadro a quadro. Um traço azul de 8 px marca a emenda. Nunca coluna estreita, nunca janela pequena.
- O vídeo da pessoa fica montado o tempo todo (a voz vem dele), inclusive debaixo das fotos em tela cheia.

## 5. Cores, textura e som

| Papel | Cor |
|---|---|
| o placar (fundo da metade de cima) | azul de quadra `#101A8C` (e `#0B1266` nas placas) |
| tarja: título, palavra falada, barra, cartão sem foto | azul vivo `#3347FF`, com borda dura `#1B2AC4` embaixo |
| a vez, o número que bate, o 1º lugar, o foco | limão `#D2F43C` (borda `#92B20F`), com texto escuro |
| casas e cartões | giz `#F6F3E8`, texto tinta `#0B1040`; casa vazia: branco 10% com traço tracejado |
| o lado certo | verde `#18C27C` |

- **Nada de preto e dourado** (é a cor do Cofre) e nada de brilho atrás da pessoa. Sombras duras e curtas embaixo das peças (cara de peça de placar).
- Sons tonais e raros, gerados no próprio projeto (`public/sfx`): `bate` (um "tum" que desce), `voa` (um deslize curto), `casa` (um toque ao assentar), `suspense` (uma nota baixa que sobe, antes do 1º), `revela` (notas subindo), `impacto`, `alerta`, `tique`, `fim`. Nada de ruído, chiado ou sino.

## 6. Imagens

- Cada posição pede uma foto **grande, com a coisa inteira, reconhecível em 1 s**, sem texto, logo ou marca d'água, de preferência em pé (cobre 1080×1920). Foto pequena fica borrada em tela cheia: troque ou use o cartão.
- Imagem errada ou feia é pior que um cartão tipográfico (`--escolher <id> 0`, ou item sem `imagem`). Um ranking inteiro de cartões é um estilo válido.
- Créditos CC BY vão para a legenda do post (`creditos.txt`), nunca na tela.

## O que não fazer

- Revelar o 1º lugar antes da hora, ou reordenar a lista: a ordem é a que a pessoa disse.
- Foto em tela cheia por mais de 1,5 s, ou duas fotos ao mesmo tempo.
- Mais de 8 casas num placar.
- Ícones e emojis decorativos fora do `cta`.
- Trocar a cor do selo (limão) ou da tarja (azul) por momento.
- Escrever "Remotion" ou qualquer nome de ferramenta na tela.
