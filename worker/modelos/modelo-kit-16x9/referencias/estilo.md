# O estilo Kit

Leia antes de alterar qualquer componente, cor ou fonte. O valor deste modelo é **a mesa que se completa**: o espectador vê lugares vazios e acompanha cada coisa caindo no seu lugar, com a linha que a liga ao nome, até a vista de cima do kit pronto (a imagem que ele quer salvar). Poucas peças repetidas com rigor: papel que cai com sombra, fita crepe, linha pontilhada de cobalto, contador. Quase toda "melhoria" que acrescenta brilho, contorno, emoji solto ou transição de efeito piora.

Vale para qualquer enumeração: ferramentas, bolsa, setup, enxoval, ingredientes, pilares de um método. O que muda de um vídeo para outro é o conteúdo das etiquetas e as imagens.

Esta é a versão deitada (16:9, 1920×1080), para o vídeo completo do YouTube. O estilo é o mesmo do vertical; muda só onde a mesa e a pessoa ficam, pela regra da aula 9 do curso: a pessoa em tela cheia é a base e, em cada momento, ela vai para a moldura da direita e a mesa abre no quadro da esquerda.

## 1. Dinâmica do motion
- Queda: 0,3 s, o objeto começa 24% maior e levemente girado, a sombra longa e difusa; pousa com a sombra curta e um assentar de 0,14 s.
- Câmera: 0,4 s entre os itens (mergulho de zoom 1,8 em duas colunas, 1,5 numa), 0,8 s no afastar (zoom ~0,94); deriva de poucos pixels para nunca congelar.
- Troca de lugar da pessoa: 0,4 s com começo e fim macios, da tela cheia para a moldura da direita (a borda da mesa vem junto) e de volta.
- Linha pontilhada: se desenha em 0,36 s do cartão até a etiqueta; ponto cobalto no cartão, anel na etiqueta.
- Saída: a folha é varrida para cima em 0,3 s. Sem fade.

## 2. Organização e hierarquia
- Mesa no quadro da esquerda (x 0 a 1180; área útil x 96 a 1116, y 84 a 884), pessoa na moldura da direita (x 1180 a 1920, a altura toda), borda de madeira escura vertical e sombra entre as duas. Nos respiros, a pessoa em tela cheia.
- Grade 2×N com o cartão do objeto de um lado e a etiqueta do outro (espelhado nas colunas pares); contador "N de M" no pé da mesa, à esquerda (acima dos controles do player), que vira cobalto com ✓ no fim.
- Folhas dos outros blocos ocupam ~90% da largura da mesa; a maior informação é sempre a maior. Tudo é medido e encolhe até caber na mesa.

## 3. Tipografia
Rubik: 800 nos nomes, títulos e números, 700 no apoio, 500 nos detalhes. Etiqueta: nome 28–46 px, detalhe 24–29 px. Folhas: títulos até 118 px. Legenda 40–64 px. Nada condensado, nada com contorno.

## 4. Moldura da pessoa
Tela cheia como base (como foi gravada). Com a mesa aberta: a faixa da direita (x 1180 a 1920, a altura toda), cabeça inteira, rosto centralizado na largura da moldura (x = 1550) a ~40% da altura, ocupando ~40% da largura dela, acompanhado com suavidade. A legenda (fita crepe) fica no terço de baixo: centrada na moldura com a mesa aberta, no meio do quadro com a pessoa em tela cheia. Nunca janelinha no canto.

## 5. Cores, textura e som
Carvalho #DDBB92 (textura `public/mesa.jpg`) com clarão suave no alto; papel #FFFDF7; tinta #1F2430; cobalto #2F56E0 (claro #DCE4FF); alerta #E4462D; certo #1E9E62; kraft #C9A57A; fita crepe translúcida. Fotos de fundo branco entram em `multiply` no cartão de papel. Sons tonais e raros, abaixo da voz.
