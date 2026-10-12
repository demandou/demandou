# O estilo Criativo (versão deitada, 16:9)

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o **anúncio que vende em silêncio**: o primeiro quadro já diz o que é, cada promessa vem com a prova na hora em que é dita, a oferta carimba e o botão chama. Ele é feito de poucas peças de vidro repetidas com rigor: a placa fumê, o cartão claro com espessura, a faixa ✓, o selo redondo, o botão. Quase toda "melhoria" que adiciona outro tipo de peça (neon, confete, contador de estoque, "ÚLTIMAS UNIDADES" piscando, setas vermelhas, estrelas de avaliação) piora: cara de anúncio barato e, se o dado não foi dito, promessa falsa.

O estilo vale para qualquer produto ou assunto. O que muda de um anúncio para outro é a fala, o produto, as fotos e a cor da marca, nunca a linguagem abaixo.

## A ideia

Uma pessoa real fala com a câmera (o formato que mais converte no Meta e no TikTok). O vídeo põe **um palco de vidro no peito dela** e, a cada coisa dita, o palco mostra a coisa: o gancho, o produto, a prova, a oferta, o botão. A legenda nunca some (a maioria assiste sem som). E o mesmo anúncio sai com 2 ou 3 ganchos diferentes, para o Ads escolher.

**No quadro deitado (16:9, 1920×1080, o vídeo completo do YouTube)** o estilo é o mesmo e a composição segue a aula 9 do curso: a pessoa em quadro cheio é a base, com a legenda na área segura de baixo e as placas curtas no peito; quando um cartão pede apoio visual, a pessoa vai para uma **moldura de vidro à direita**, com o rosto centralizado, e o cartão ocupa o **quadro à esquerda**, que é o palco do vertical. Quando a ideia termina, ela volta ao quadro cheio.

## 1. Dinâmica do motion

- **Primeiro quadro montado**: o quadro 0 de cada variante já tem a legenda (primeira palavra acesa) e o cartão do gancho inteiro. Nada entra "do nada" no começo.
- **Cartões de vidro**: entram com escala 90% → 100% e a perspectiva endireitando (rotateX 10–14° → 0) em 0,42 s com um leve passar do ponto (`salto`); um brilho diagonal atravessa o vidro uma vez. Saem em 0,14 s (encolhem 3% e somem).
- **Título do cartão** (herói e cartão final): entra **junto com o cartão**, já escrito, e as palavras acendem quando são ditas; nunca um cartão vazio esperando o texto.
- **Produto herói**: o cartão fica inclinado (rotateY −7°, oscilando ±2,5°) e aproxima 1,2%/s (até 4,5%); o recorte do produto sobe 70 px ao entrar, aproxima 2,6%/s (até 10%, mais rápido que o cartão: parallax) e balança ±1,2°.
- **Prova**: a foto aproxima devagar (Ken Burns de 7%); a faixa ✓ entra subindo a perspectiva e o texto palavra por palavra; o ✓ se desenha. Provas seguidas: o cartão fica, a foto nova passa por cima numa cortina da direita para a esquerda (0,42 s) com um fio de luz na borda.
- **Tela cheia que encolhe** (`telaCheia`): a foto cobre o quadro deitado inteiro e, no instante marcado, encolhe em 0,55 s até o cartão do quadro da esquerda; a moldura de vidro aparece ao pousar.
- **Ida para a moldura**: a pessoa desliza do quadro cheio para a moldura da direita (0,45 s, começando ~0,3 s antes do cartão) e volta do mesmo jeito; a borda de vidro da moldura aparece junto. O vídeo quase não muda de escala na ida: ele só se recorta e desliza, sem saltos. As placas do peito somem enquanto ela vai e voltam quando ela volta.
- **Número da prova**: o selo redondo carimba (escala 50% → 100%, giro −12° → 0) **já com o valor dito** (pt-BR, algarismos tabulares), na palavra: nunca um número intermediário na tela. O movimento fica no anel, que enche em 0,6 s, e num soco de 6% quando ele fecha. O bloco `numero` conta rápido (0,45 s).
- **Selo de oferta**: carimba (150% → 100%, giro −34° → −9°) e o anel tracejado gira 22°/s para sempre.
- **Botão**: sobe 40 px e assenta; a seta balança; um anel pulsa a cada 1,2 s; o dedo chega de baixo à direita, aperta a seta (o botão afunda 6%) e uma onda clara se abre.
- **Câmera da pessoa**: corte seco de escala em cada tomada e na emenda gancho → corpo (100% ↔ 107%); aproxima 1,5% a cada 3 s; soco de 4% no número, no selo, no destaque e no toque. Vale em quadro cheio e na moldura. Nada de giro, tremida, flash ou glitch.
- **Ritmo**: dentro de um cartão, algo novo a cada 1,5–2,5 s (palavra acendendo, foto trocando, número, selo, toque). No vídeo completo, entre os cartões cabem respiros de quadro cheio só com a legenda (até ~8 s).

## 2. Organização e hierarquia

- **A pessoa**: em quadro cheio, como foi gravada (o zoom cresce em volta do rosto), ou na **moldura** de vidro claro da direita (x 1184 a 1824, y 72 a 832; borda de 14 px, espessura de 12 px, raio de 34 px), com o rosto centralizado (~40% da largura da moldura, a 40% da altura). Nunca coberta.
- **A legenda**: centralizada no quadro, centro em y 912 (área segura de baixo), pílula de vidro fumê de até 1100 px, 58 px (reduz até 38), até 4 palavras. No mesmo lugar com a pessoa em quadro cheio ou na moldura.
- **O peito** (pessoa em quadro cheio): do queixo (com a maior aproximação) + 28 px até y 832, centrado no rosto, até 1000 px de largura. Recebe as placas curtas: a manchete do gancho sem foto, a frase, o destaque (com 84 px ou mais), o número sem foto (com 100 px ou mais) e o botão sem cartão. O que não cabe vai para o quadro.
- **O botão**: pílula de 126 px de altura (texto 56 px + círculo de 84 px com a seta); embaixo do cartão final, no quadro (ou no peito, logo acima da legenda, quando não há cartão).
- **O palco (o quadro da esquerda)**: x 96 a 1136, y 72 a 832 (~1040 × 760). Um cartão por vez, sempre ocupando o palco: nada de cartão pequeno com vazio em volta.
  - gancho sem foto: a placa fumê centrada (52 px de respiro lateral), o adesivo no canto de cima à direita;
  - gancho com foto: o cartão da foto em cima e a placa por cima da base dele (28 px para dentro);
  - herói: o cartão claro na parte de baixo do palco, com ~130 px livres em cima para o produto passar da borda; produto à esquerda, título à direita, etiquetas embaixo à direita. Como o palco começa no topo seguro (y 72), o template mede o produto para ele, já na maior aproximação, parar no y 72 (nunca sai do quadro);
  - prova: o cartão da foto no palco inteiro (borda de vidro de 14 px), a faixa fumê 30 px acima da base (28 px para dentro), o selo do número no canto de cima à direita;
  - no `cta` com cartão, o palco termina 160 px antes (o botão fica embaixo dele) e o selo de oferta cola no canto de cima à direita do cartão; com a pessoa em quadro cheio, o selo fica no canto de cima do lado oposto ao rosto.
- **Zona segura do YouTube**: nada importante acima de y 72 (título do player) nem abaixo de y 984 (barra de tempo e botões do player); margem lateral de 96 px.
- **Tarja de nome**: um cartão de perfil de vidro fumê num canto de cima (x 96, y 96, do lado da cabeça com mais espaço), na largura livre entre a margem e a cabeça (nunca encosta no cabelo): círculo de 56 px com a inicial, o nome em Sora 800 de até 46 px (mínimo 34) em até 2 linhas, a área em 600 de até 30 px; só com a pessoa em quadro cheio, por até ~2,75 s, na primeira janela de quadro cheio dos primeiros 8 s.
- **Manchete do gancho**: a ideia-chave curta ("Não segura o gelo?"), não a frase inteira que a legenda já mostra.

## 3. Tipografia

- Uma família só: **Sora** (Google Fonts), pesos 600, 700 e 800; tracking −0,022em no 800 e −0,01em no resto (nunca mais apertado que −0,025em).
- Legenda 58 px (800); manchete do gancho 50–88 px; título do herói 40–70 px; faixa do benefício 40–60 px; botão 56 px; selo de oferta 26–50 px em caixa alta; número da prova até 96 px; número do bloco `numero` até 210 px; destaque até 120 px em caixa alta; etiquetas 38 px (700).
- O texto é medido com as larguras reais da Sora (`src/larguras.ts`) e reduz até caber; nunca vaza nem é cortado.

## 4. Moldura da pessoa

- Dois lugares, como na aula 9 do curso: **quadro cheio** (`VideoNaCaixa` com `rosto={plano.rosto}`), com o rosto onde foi gravado e seguido quadro a quadro; ou a **moldura de vidro da direita**, com o rosto centralizado e acompanhado com suavidade (o rastro do rosto: a câmera reenquadra quando a pessoa muda de lugar, sem tremer nem saltar), enquanto o cartão ocupa o quadro da esquerda.
- Nas variantes, o vídeo toca só os trechos do gancho e do corpo (`plano.trechos`), emendados em corte seco.
- **Nunca** mexa na cor do vídeo: sem filtro, brilho, halo ou luz atrás da pessoa. As sombras são só dos cartões (e da moldura, que é um cartão).

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
| fundo do quadro (16:9) | quando a pessoa vai para a moldura: a tinta #0B1020 num degradê suave, com uma luz clara (#4B5168 a 55%) e uma luz bem fraca na cor do destaque, do lado do quadro (nunca atrás da pessoa), para o vidro ter o que desfocar |

Sem preto + dourado, sem neon, sem degradê arco-íris.

## 6. Som

- Sons em `public/sfx/` (tonais, curtos, 14–26% do volume, nunca dois a menos de 0,35 s): `entra` (pop grave), `opcao-1…4` (marimba), `tique` (toc), `acerto` (duas notas), `vira` (virada).
- Nada de sino, caixa registradora, "ka-ching", ruído branco ou whoosh alto.

## 7. O que não fazer

- Cartão em cima do rosto, placa do peito em cima do queixo, cartão do quadro passando para a moldura, legenda em cima da borda de um cartão.
- Foto genérica que "mais ou menos" combina (melhor o modo ilustrativo com ícone).
- Produto diferente entre as provas (sempre o mesmo produto).
- Número, preço, prazo, desconto ou estoque que não foi dito.
- Marca ou logo real de outra empresa (bancos, apps, redes sociais, a marca do concorrente).
- A palavra "Remotion" em qualquer lugar da tela.
