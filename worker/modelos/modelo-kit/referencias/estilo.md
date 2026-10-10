# O estilo Kit

Leia antes de alterar qualquer componente, cor ou fonte. O valor deste modelo é **a mesa que se completa**: o espectador vê lugares vazios e acompanha cada coisa caindo no seu lugar, com a linha que a liga ao nome, até a vista de cima do kit pronto (a imagem que ele quer salvar). Poucas peças repetidas com rigor: papel que cai com sombra, fita crepe, linha pontilhada de cobalto, contador. Quase toda "melhoria" que acrescenta brilho, contorno, emoji solto ou transição de efeito piora.

Vale para qualquer enumeração: ferramentas, bolsa, setup, enxoval, ingredientes, pilares de um método. O que muda de um vídeo para outro é o conteúdo das etiquetas e as imagens.

## 1. Dinâmica do motion
- Queda: 0,3 s, o objeto começa 24% maior e levemente girado, a sombra longa e difusa; pousa com a sombra curta e um assentar de 0,14 s.
- Câmera: 0,4 s entre os itens (mergulho de zoom 1,4), 0,8 s no afastar (zoom ~0,94); deriva de poucos pixels para nunca congelar.
- Linha pontilhada: se desenha em 0,36 s do cartão até a etiqueta; ponto cobalto no cartão, anel na etiqueta.
- Saída: a folha é varrida para cima em 0,3 s. Sem fade.

## 2. Organização e hierarquia
- Mesa em cima (y 0 a 900), pessoa embaixo, borda de madeira escura e sombra entre as duas.
- Grade 2×N com o cartão do objeto de um lado e a etiqueta do outro (espelhado nas colunas pares); contador "N de M" pendurado na borda, à esquerda, que vira cobalto com ✓ no fim.
- Folhas dos outros blocos ocupam ~90% da largura da mesa; a maior informação é sempre a maior.

## 3. Tipografia
Rubik: 800 nos nomes, títulos e números, 700 no apoio, 500 nos detalhes. Etiqueta: nome 28–46 px, detalhe 24–29 px. Folhas: títulos até 118 px. Legenda 40–64 px. Nada condensado, nada com contorno.

## 4. Moldura da pessoa
Sempre embaixo, largura total, cabeça inteira, rosto em x = 540; a legenda (fita crepe) logo abaixo do queixo. Nunca coluna estreita.

## 5. Cores, textura e som
Carvalho #DDBB92 (textura `public/mesa.jpg`) com clarão suave no alto; papel #FFFDF7; tinta #1F2430; cobalto #2F56E0 (claro #DCE4FF); alerta #E4462D; certo #1E9E62; kraft #C9A57A; fita crepe translúcida. Fotos de fundo branco entram em `multiply` no cartão de papel. Sons tonais e raros, abaixo da voz.
