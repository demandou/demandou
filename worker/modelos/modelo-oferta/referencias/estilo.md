# O estilo Oferta

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **página da oferta** que se monta na fala: entregas que caem e encaixam na pilha, o valor que bate, o risco vermelho, o preço que cai e bate, o selo que carimba, o prazo que corre e o botão que leva um toque. Ele é feito de poucas peças repetidas com rigor: cartão de papel marfim, quadrado do objeto, cartão do preço com picote de recibo, selo recortado, régua da semana, botão verde. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, néon, confete, moedas caindo, explosão, faixa "BLACK FRIDAY", contador de horas piscando, dourado) piora e puxa para cara de cassino ou de loja de promoção, que é o oposto do estilo: **premium e sóbrio**.

O estilo vale para qualquer assunto: cursos, serviços, lojas, eventos, aulas gratuitas, e também falas que não vendem nada (o que uma escolha te dá × o que ela custa). O que muda de um vídeo para outro é o que entra na pilha e no preço, nunca a linguagem visual abaixo.

## A ideia

A pessoa apresenta uma oferta. O vídeo **imprime a página dela**: o que você leva cai, peça por peça, e encaixa na pilha, na ordem da fala; o valor de referência bate; um risco vermelho o atravessa, ele encolhe para o canto e o preço real cai e bate grande em verde; a garantia é carimbada; o prazo corre; o botão é tocado. No fim, a página vira um resumo da oferta (preço com o selo, prazo, botão). A pessoa fica embaixo o tempo todo (nunca numa coluna estreita).

## 1. Dinâmica do motion

- **Entrega (cartão de papel grosso)**: aparece na palavra ~150 px acima, inclinada 5° a mais e 6% maior, cai acelerando (0,28 s) e pousa 0,2 s depois da palavra com um quique de 10 px; a sombra encurta na queda. Os cartões de cima assentam 4 px no impacto. Pousados, ficam tortos (−1,3°, 1,1°, −0,7°…) e deslocados como papel de verdade, e se **alinham** (0,45 s) quando o valor é dito.
- **A pilha**: desce do alto na ordem da fala (a primeira entrega em cima); cada cartão novo cai e encaixa embaixo do anterior; a etiqueta do título fica no alto. Antes do valor, os cartões têm até 224 px de altura e usam a página inteira; no rótulo do valor, a pilha se compacta para cima (0,5 s) e o cartão do preço sobe 40 px por baixo. - **O preço**: a âncora **bate** inteira na palavra (entra de 70% e dá um soco de 8%). O risco vermelho atravessa a âncora grande em 0,3 s (levemente inclinado, −4°). 0,4 s depois ela encolhe (0,45 s) para o lado do rótulo do preço, pequena e riscada. O preço real **cai** 70 px e **bate** grande em verde de uma vez (soco de 12%, 0,36 s); a pilha pula 7 px, a câmera da pessoa aproxima 4%, um traço sálvia se desenha sob o preço. Depois o preço respira (±0,8%). **Nunca** há números intermediários (nada de contagem de 997 até 297: parece taxímetro).
- **A doca**: a pilha sai para cima (50 px, encolhendo 5%, um cartão de cada vez) e o cartão do preço desliza para o alto da página (0,5 s).
- **O selo**: desce 170% maior e inclinado −20°, bate em 0,18 s (ficando a −8°), assenta com 5% de recuo e deixa um anel de tinta que se espalha e some (0,55 s). O número do centro entra com salto na palavra dele. Depois balança ±0,8°. Na doca, voa (0,38 s) para o canto do cartão do preço: o texto em volta some e o centro cresce ("7 DIAS" grande), porque no tamanho pequeno só ele se lê.
- **O prazo**: o cartão sobe 36 px; a frase monta palavra por palavra; os dias da semana entram em cascata (0,03 s cada); o preenchimento sálvia corre de dia em dia até o dia dito, com um ponto verde andando em cima; o dia acende em verde com um soco de 15% e um anel que pulsa a cada 1,1 s.
- **O botão**: entra com salto (82% → 100%); um brilho fino atravessa uma vez; o dedo chega de baixo à direita (0,38 s) e toca a seta: o botão afunda 5%, a sombra encolhe, uma onda marfim se espalha (0,6 s); depois um anel pulsa a cada 1,2 s e o botão respira.
- **Abertura (etiqueta pendurada)**: cai 380 px presa no fio, balança amortecida (7° → 0) em volta do furo e fica oscilando ±0,7°.
- **Texto**: palavra por palavra, cada uma subindo 28% do corpo e acendendo em 0,22 s, no instante em que é dita; terminada a entrada, a palavra fica desenhada simples.
- **Troca de bloco**: o bloco que sai encolhe 3% e some em 0,2 s. Nada de faixa, cortina, flash, giro ou tremida longa.
- **Fundo**: a gravura de certificado (duas famílias de linhas onduladas finas que se cruzam) desliza devagar o vídeo todo, em sentidos opostos. Sem centro nem forma: nunca vira um "buraco" ou um círculo vazio atrás de um cartão.

## 2. Organização e hierarquia

- **Duas partes**: a página em cima (x 64 a 1016, y 132 a 966; a interface do app ocupa os primeiros ~120 px) e a moldura da pessoa embaixo (x 30 a 1050, a partir de y 1000, cantos de 44 px; os de baixo ficam fora do quadro).
- **Cartão de entrega**: largura da página (952 px, 34–44 px menos nos cartões tortos), altura até 224 px (178 px com o preço na tela); quadrado do objeto à esquerda (altura − 24 px, cantos de 16 px); nome à direita (800, 54–60 px, até 2 linhas); preço do item numa pílula à direita (só se dito). Vão de 14 px.
- **Cartão do preço**: 952 × 300 px, com picote de recibo no alto; rótulo (700, 44 px) a 30 px do topo e a 46 px da esquerda; número (800, 140–160 px) alinhado à esquerda; na doca, a direita do cartão é o lugar do selo (226 px).
- **Doca**: cartão do preço em y 146; área livre de y 472 a 966: selo grande (até 420 px) no meio; prazo (952 × 236 px) em cima; botão (até 820 × 156 px) embaixo dele.
- **Margens**: nada de texto ou cartão a menos de 64 px das laterais, nada acima de y 120, nada importante abaixo de y 1700. A tarja de nome fica na costura (y 954 a 1046), à esquerda, longe do rosto: círculo verde de 62 px com a inicial, nome em 800 de 40 px (mínimo 34), área em 600 de 28 px.
- **Legenda**: só quando um momento pede (`legenda: true`): pílula marfim abaixo do queixo, até 4 palavras, a palavra dita em verde.
- **Hierarquia**: o preço é sempre a maior coisa da tela; a âncora riscada fica pequena ao lado do rótulo; o selo é grande só quando carimba.

## 3. Tipografia

- Uma família só: **Plus Jakarta Sans** (Google Fonts), pesos 600, 700 e 800; tracking −0,022em no 800 e −0,01em no resto; −0,035em só nos números grandes do preço.
- Preço 70–160 px (800, algarismos tabulares), com o prefixo ("R$") a 40% do corpo, alto, e o sufixo a 36%; número do bloco `numero` 80–190 px; abertura 46–96 px; nome da entrega 28–60 px; rótulos 30–44 px (700, tinta suave); frase do prazo 34–58 px; botão 34–62 px (800, marfim).
- Etiquetas ("VOCÊ LEVA", "ILUSTRATIVO", rótulos da comparação): 800 em caixa alta, 20–30 px, tracking +0,1em, numa pílula verde ou verde-claro.
- O selo: texto em volta em 800, caixa alta, +0,14em; o número do centro em 800 grande; a unidade em caixa alta +0,12em.
- O texto é medido com as larguras reais da Plus Jakarta Sans (`src/larguras.ts`) e reduz até caber; nunca vaza nem é cortado.

## 4. Moldura da pessoa

- Sempre a moldura larga embaixo; o rosto ocupa ~29% da largura da moldura, com o centro no eixo do quadro e ~56 px de folga acima do cabelo.
- `VideoNaCaixa` com `rosto={plano.rosto}`: a moldura segue o rosto quadro a quadro.
- Escala por trecho: 100% ↔ 106% em corte seco, só quando o trecho anterior durou mais de 1 s. Soco de 4% no preço e no carimbo.
- **Nunca** mexa na cor do vídeo: sem filtro, brilho, halo ou luz atrás da pessoa. A única sombra é a da moldura, para fora dela.

## 5. Cores

| Papel | Cor |
|---|---|
| página | marfim #F3EDE1 (mais claro no centro, #E7DECD nas bordas) |
| gravura de certificado (linhas onduladas) | verde a 7,5% |
| cartões | #FFFCF6, borda #E6DCC9, sombra macia verde-escura |
| tinta | #0F3328 (texto), #5D7569 (rótulos e detalhes) |
| destaque | verde profundo #13573F (preço, selo, botão, etiquetas, palavra-chave); claro #DCE9DF; sálvia #9DB9A8 (traço sob o preço, barras secundárias) |
| risco | vermelho #C8372D, **só** no risco da âncora, no `risco` de uma frase e no destaque de alerta |
| apagado | #B9B2A3 |

Não use preto com dourado (é a marca do Cofre), amarelo e vermelho de liquidação, néon, gradiente arco-íris, fundo escuro de palco ou letreiro piscando.

## 6. Sons

Tonais, raros e bem abaixo da voz (volume 0,16 a 0,36 antes da normalização a −14 LUFS): um "toc" grave de papel grosso quando a entrega pousa e quando a âncora bate, uma subida suave quando o bloco `numero` conta, um deslize curto descendo no risco, um acorde macio de marimba (dó maior com um grave) quando o preço bate, um "tum" grave e seco no carimbo, um "tique" no dia do prazo, um clique macio de dois tons no toque do botão. Nada de sino, caixa registradora, moedas, buzina, aplauso ou ruído branco.

## 7. Imagens

- Nas entregas, prefira **fotos de produto do mesmo estilo** (fundo claro e liso, luz suave, tons de creme e verde) ou objetos 3D em PNG: elas preenchem o quadrado da esquerda.
- Sem imagem boa: um `icone` de traço verde num quadrado verde-claro, ou o selo com o número.
- Nunca imagem com texto, logo, marca (de plataforma, banco, cartão) ou pessoa reconhecível.
