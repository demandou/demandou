# O estilo Versus

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **luta**: duas opções que se encaram, um critério por vez que enche uma barra de cada lado, um ponto que cai no placar e um veredito que divide por perfil. Ele é feito de poucas peças repetidas com rigor: painel inclinado, VS, barra, carimbo +1, cartão de perfil. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, contorno, emoji solto, transição de efeito) piora.

O estilo vale para qualquer A contra B: produtos, serviços, métodos, decisões de dinheiro, carreira, treino, ferramentas. O que muda de um vídeo para outro é o conteúdo dos lados e as imagens, nunca a linguagem visual abaixo. Diferença para a Comparação (um bloco de duas colunas): o Versus é uma luta inteira, com rodadas, placar e veredito.

## A ideia

A pessoa compara A e B em critérios, e o vídeo **monta uma luta**. As duas imagens entram dos cantos e o VS bate; a cada rodada, uma barra de cada lado sobe enquanto ela fala daquele lado, e o ponto cai em quem ela disser; no fim, o placar bate e os perfis deslizam para o lado que serve a cada um. A pessoa fica embaixo o tempo todo (nunca numa coluna estreita).

## 1. Dinâmica do motion

- **Os lados se encaram** (0,38 s): A entra pela esquerda e B pela direita (`rapido`, entrada seca e firme), cada um no instante em que é nomeado. O VS âmbar de 210 px carimba (145% → 100% em 0,24 s), a arena treme 0,3 s (9 px, decai) e a pessoa leva um soco de zoom. Depois do VS os painéis se empurram de leve.
- **A rodada**: "RODADA N" (placa âmbar), o ícone num círculo de papel e o critério numa placa escura saltam juntos no centro. A barra de cada lado **sobe** em 0,5 s no instante em que o lado é falado; o texto do lado entra numa placa embaixo dela. No ponto: carimbo **+1** âmbar (150% → 100%), a arena treme 6 px, o placar do alto bate (135% → 100%), o aro da barra fica âmbar e a barra do outro lado vira cinza. A linha diagonal que divide os cantos anda para o lado de quem está mais forte.
- **A imagem da rodada** bate grande (300 px, inclinada) e, depois de 1 s, encolhe para uma medalha de 130 px no alto da barra do lado dela.
- **O veredito**: o placar bate (grande, cada lado na sua cor, aro âmbar em quem lidera); "Pra quem é cada um?" sobe; cada perfil nasce no centro como cartão de papel e **desliza** em 0,4 s para a coluna do lado dele, com uma faixa na cor do lado e uma inclinação de 2°.
- **Troca de bloco**: uma faixa vermelha, azul e âmbar cruza a arena na diagonal em 0,46 s (só nos blocos que não são da luta). Nada de fade nem de flash.
- **Nada parado**: as linhas de velocidade do fundo andam o tempo todo, a barra do topo anda o vídeo inteiro, o vídeo da pessoa alterna 100% e 106% a cada corte e leva um soco de 7% a cada golpe.

## 2. Organização e hierarquia

- **Duas metades**: a arena em cima (y 128 a 908; a interface do app ocupa os primeiros ~110 px) e a pessoa embaixo (a partir de y 960), separadas por uma costura vermelha e azul cortada na diagonal.
- **O `versus`**: dois painéis inclinados de 510 × 590 px (A à esquerda, B à direita, com uma fresta diagonal entre eles), o nome de cada lado numa placa na cor do canto sobre a base do painel, o VS no meio e a pergunta numa placa no alto.
- **A `rodada`**: o placar no alto (miniatura de 88 px, nome e pontos de cada lado); no meio, a coluna do ícone (214 px) com o critério; de cada lado, uma barra de 306 × 470 px com régua e o nome do lado acima; o texto do lado numa placa abaixo da barra. Uma ideia por vez.
- **O `veredito`**: placar de 170 px no topo, nomes embaixo dele, a pergunta em âmbar e dois cartões de 468 px de largura (um por coluna); com 3 ou 4 perfis, duas linhas menores por coluna.
- **Legenda**: telas de até 3 palavras numa linha, centradas, **abaixo do queixo** (y ~1540), a palavra falada numa tarja âmbar com texto escuro. Some no `versus` e no `veredito` (a arena já mostra o texto).
- Cantos reservados: nada acima de y 110 além da barra de progresso (abas do app), nada importante abaixo de y 1540 nem na coluna da direita abaixo de y 1080 (botões do app).

## 3. Tipografia

- **Uma família só: Kanit** (Google Fonts), larga e firme, com cara de cartaz de luta: legível de longe no celular.
- **Itálico 800/900 em caixa alta** para nomes, placar, rodadas, títulos e tarjas; **itálico 700** para o texto corrido (texto dos lados, perfis, detalhes). Toda a arena é itálica; o texto dos blocos universais herda isso.
- Tamanhos (quadro de 1080 de largura): nome do lado 34–66 px com imagem e até 150 px sem; placar do `versus`/`veredito` 140–190 px; critério 34–62 px; texto do lado 28–46 px; perfil 30–74 px; legenda 62 px. O texto é medido com as larguras reais da fonte (`src/larguras.ts`) e diminui para caber; nunca é cortado.
- Nada de fonte condensada, nada de contorno nas letras, nada de sombra borrada no texto.

## 4. Moldura da pessoa

- **Sempre embaixo**: caixa de y 960 até a base, na largura toda, com a cabeça inteira logo abaixo da costura e a legenda abaixo do queixo (calculado pela largura do rosto), seguindo o rosto quadro a quadro. Nunca coluna estreita, nunca janela pequena, nunca quadro cheio.
- O vídeo da pessoa fica montado o tempo todo (a voz vem dele).

## 5. Cores, textura e som

| Papel | Cor |
|---|---|
| a arena (fundo da metade de cima) | grafite arroxeado `#16141C` / `#1E1B26` |
| lado A (esquerda) | vermelho `#FF4438`, borda dura `#B8231A` |
| lado B (direita) | azul-ciano `#22B8F0`, borda dura `#0E78A8` |
| o VS, o ponto (+1), o número da rodada, a palavra falada, o alerta | âmbar `#FFC233` (borda `#B5811A`), com texto escuro |
| cor neutra dos blocos universais (títulos, tarjas, passos) | índigo `#5B4BFF`, borda `#3427BF` |
| cartões, ícones, perfis | papel `#FFF7EC`, texto `#16121E` |
| quem perde a rodada | cinza `#5E5A68` |
| o lado certo (✓ da comparação) | verde `#1FC98A` |

- **Nada de preto e dourado** (é a cor do Cofre) e nada de brilho atrás da pessoa. Sombras duras e curtas embaixo das peças (cara de cartaz impresso).
- Sons tonais e raros, gerados no próprio projeto (`public/sfx`), bem abaixo da voz: `vs`, `rodada`, `ponto`, `golpe`, `tique`, `impacto`, `alerta`, `pop`, `fim`. Nada de ruído, chiado ou sino.

## 6. Imagens

- Cada lado pede uma foto **com a coisa inteira, reconhecível em 1 s**, sem texto, logo ou marca d'água, de preferência com fundo limpo e enquadramento parecido com a do outro lado. Imagem errada ou feia é pior que um cartão: um lado sem `imagem` vira um painel colorido com o nome gigante, e uma luta inteira sem foto é um estilo válido.
- Imagem de apoio da rodada: opcional, uma por rodada, no máximo.
- Créditos CC BY vão para a legenda do post (`creditos.txt`), nunca na tela.

## O que não fazer

- Dar o ponto a quem a pessoa não disse, ou somar um placar que não bate com os pontos ditos.
- Escrever na barra um número que a pessoa não falou (a altura da barra é só visual).
- Mais de 2 lados, ou mais de 4 perfis.
- Trocar as cores dos cantos entre rodadas: A é sempre vermelho e B é sempre azul-ciano.
- Ícones e emojis decorativos fora do `cta` e dos ícones das rodadas.
- Escrever "Remotion" ou qualquer nome de ferramenta na tela.
