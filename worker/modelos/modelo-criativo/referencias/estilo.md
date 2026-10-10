# O estilo Criativo

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o **anúncio que vende em silêncio**: o primeiro quadro já diz o que é, cada promessa vem com a prova na hora em que é dita, a oferta carimba e o botão chama. Ele é feito de poucas peças de vidro repetidas com rigor: a placa fumê, o cartão claro com espessura, a faixa ✓, o selo redondo, o botão. Quase toda "melhoria" que adiciona outro tipo de peça (neon, confete, contador de estoque, "ÚLTIMAS UNIDADES" piscando, setas vermelhas, estrelas de avaliação) piora: cara de anúncio barato e, se o dado não foi dito, promessa falsa.

O estilo vale para qualquer produto ou assunto. O que muda de um anúncio para outro é a fala, o produto, as fotos e a cor da marca, nunca a linguagem abaixo.

## A ideia

Uma pessoa real fala com a câmera (o formato que mais converte no Meta e no TikTok). O vídeo põe **um palco de vidro no peito dela** e, a cada coisa dita, o palco mostra a coisa: o gancho, o produto, a prova, a oferta, o botão. A legenda nunca some (a maioria assiste sem som). E o mesmo anúncio sai com 2 ou 3 ganchos diferentes, para o Ads escolher.

## 1. Dinâmica do motion

- **Primeiro quadro montado**: o quadro 0 de cada variante já tem a legenda (primeira palavra acesa) e o cartão do gancho inteiro. Nada entra "do nada" no começo.
- **Cartões de vidro**: entram com escala 90% → 100% e a perspectiva endireitando (rotateX 10–14° → 0) em 0,42 s com um leve passar do ponto (`salto`); um brilho diagonal atravessa o vidro uma vez. Saem em 0,14 s (encolhem 3% e somem).
- **Título do cartão** (herói e cartão final): entra **junto com o cartão**, já escrito, e as palavras acendem quando são ditas; nunca um cartão vazio esperando o texto.
- **Produto herói**: o cartão fica inclinado (rotateY −7°, oscilando ±2,5°) e aproxima 1,2%/s (até 4,5%); o recorte do produto sobe 70 px ao entrar, aproxima 2,6%/s (até 10%, mais rápido que o cartão: parallax) e balança ±1,2°.
- **Prova**: a foto aproxima devagar (Ken Burns de 7%); a faixa ✓ entra subindo a perspectiva e o texto palavra por palavra; o ✓ se desenha. Provas seguidas: o cartão fica, a foto nova passa por cima numa cortina da direita para a esquerda (0,42 s) com um fio de luz na borda.
- **Tela cheia que encolhe** (`telaCheia`): a foto cobre a tela inteira e, no instante marcado, encolhe em 0,55 s até o cartão; a moldura de vidro aparece ao pousar.
- **Número da prova**: o selo redondo carimba (escala 50% → 100%, giro −12° → 0) **já com o valor dito** (pt-BR, algarismos tabulares), na palavra: nunca um número intermediário na tela. O movimento fica no anel, que enche em 0,6 s, e num soco de 6% quando ele fecha. O bloco `numero` conta rápido (0,45 s).
- **Selo de oferta**: carimba (150% → 100%, giro −34° → −9°) e o anel tracejado gira 22°/s para sempre.
- **Botão**: sobe 40 px e assenta; a seta balança; um anel pulsa a cada 1,2 s; o dedo chega de baixo à direita, aperta a seta (o botão afunda 6%) e uma onda clara se abre.
- **Câmera da pessoa**: corte seco de escala em cada tomada e na emenda gancho → corpo (100% ↔ 107%); aproxima 1,5% a cada 3 s; soco de 4% no número, no selo, no destaque e no toque. Nada de giro, tremida, flash ou glitch.
- **Ritmo**: algo novo a cada 1,5–2,5 s (palavra acendendo, foto trocando, número, selo, toque).

## 2. Organização e hierarquia

- **A pessoa**: quadro cheio, rosto no eixo vertical do meio, nunca coberto.
- **A legenda**: centro em queixo + 74 px (com a maior aproximação), pílula de vidro fumê de até 940 px, 58 px (reduz até 38), até 4 palavras.
- **O botão**: centro 112 px abaixo da legenda, pílula de 126 px de altura (texto 56 px + círculo de 84 px com a seta).
- **O palco**: de (legenda + 66) até y 1632, x 64 a 1016. Um cartão por vez, sempre ocupando o palco (~952 px de largura): nada de cartão pequeno com vazio em volta.
  - gancho sem foto: a placa fumê centrada (52 px de respiro lateral), o adesivo no canto de cima à direita;
  - gancho com foto: o cartão da foto em cima e a placa por cima da base dele (28 px para dentro);
  - herói: o cartão claro na parte de baixo do palco, com ~130 px livres em cima para o produto passar da borda; produto à esquerda, título à direita, etiquetas embaixo à direita;
  - prova: o cartão da foto no palco inteiro (borda de vidro de 14 px), a faixa fumê 30 px acima da base (28 px para dentro), o selo do número no canto de cima à direita;
  - no `cta`, o palco começa abaixo do botão e o selo de oferta cola no canto de cima à direita do cartão.
- **Zona segura do Ads**: nada importante acima de y 192 (10%: nome da conta, "Patrocinado") nem abaixo de y 1651 (14%: texto do anúncio e botão da plataforma); margem lateral de 64 px.
- **Tarja de nome**: um cartão de perfil de vidro fumê em x 64, y 214, na largura livre entre a margem e a cabeça (nunca encosta no cabelo): círculo de 56 px com a inicial, o nome em Sora 800 de até 46 px (mínimo 34) em até 2 linhas, a área em 600 de até 30 px; de 0,25 s a ~3 s.
- **Manchete do gancho**: a ideia-chave curta ("Não segura o gelo?"), não a frase inteira que a legenda já mostra.

## 3. Tipografia

- Uma família só: **Sora** (Google Fonts), pesos 600, 700 e 800; tracking −0,022em no 800 e −0,01em no resto (nunca mais apertado que −0,025em).
- Legenda 58 px (800); manchete do gancho 50–88 px; título do herói 40–70 px; faixa do benefício 40–60 px; botão 56 px; selo de oferta 26–50 px em caixa alta; número da prova até 96 px; número do bloco `numero` até 210 px; destaque até 120 px em caixa alta; etiquetas 38 px (700).
- O texto é medido com as larguras reais da Sora (`src/larguras.ts`) e reduz até caber; nunca vaza nem é cortado.

## 4. Moldura da pessoa

- Sempre quadro cheio (`VideoNaCaixa` com `rosto={plano.rosto}`): o rosto fica onde foi gravado e é seguido quadro a quadro.
- Nas variantes, o vídeo toca só os trechos do gancho e do corpo (`plano.trechos`), emendados em corte seco.
- **Nunca** mexa na cor do vídeo: sem filtro, brilho, halo ou luz atrás da pessoa. As sombras são só dos cartões.

## 5. Cores

| Papel | Cor |
|---|---|
| destaque (o único) | `plano.cor` (a cor da marca) ou laranja-sinal #FF6A13: botão, selos, ✓, números, palavra-chave, traço do destaque, palavra dita na legenda |
| texto sobre o destaque | tinta #0B1020 ou branco, o de maior contraste (automático) |
| vidro fumê | degradê rgba(34,40,62,0,68) → rgba(9,12,24,0,76), desfoque 22 px, borda branca a 24% |
| vidro claro | degradê branco 80% → 56%, desfoque 26 px, borda branca a 85%, brilho no canto de cima à esquerda |
| espessura do vidro | uma borda 12 px mais funda embaixo (azul-acinzentado no claro, quase preto no fumê) |
| tinta | #0B1020 (texto em vidro claro), #4B5168 (detalhes) |
| alerta | coral #FF4057, só no ✗ e no destaque de alerta |

Sem preto + dourado, sem neon, sem degradê arco-íris.

## 6. Som

- Sons em `public/sfx/` (tonais, curtos, 14–26% do volume, nunca dois a menos de 0,35 s): `entra` (pop grave), `opcao-1…4` (marimba), `tique` (toc), `acerto` (duas notas), `vira` (virada).
- Nada de sino, caixa registradora, "ka-ching", ruído branco ou whoosh alto.

## 7. O que não fazer

- Cartão em cima do rosto, legenda em cima da borda de um cartão, botão colado no queixo.
- Foto genérica que "mais ou menos" combina (melhor o modo ilustrativo com ícone).
- Produto diferente entre as provas (sempre o mesmo produto).
- Número, preço, prazo, desconto ou estoque que não foi dito.
- Marca ou logo real de outra empresa (bancos, apps, redes sociais, a marca do concorrente).
- A palavra "Remotion" em qualquer lugar da tela.
