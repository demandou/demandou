# O estilo Balcão

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **fachada da loja de bairro**: o toldo, a vitrine, os produtos postos na prateleira com o adesivo de preço, o carimbo, o mapa e a placa. Ele é feito de poucas peças repetidas com rigor: letras pintadas no vidro, prateleira de madeira, etiqueta de papel, adesivo mostarda, fita kraft, carimbo tomate, plaquinha café, balão creme. Quase toda "melhoria" que adiciona outro tipo de peça (neon, brilho, confete, giz, moedas caindo, "OFERTA!" piscando, logo de aplicativo) piora: tira o ar acolhedor de loja de bairro.

O estilo vale para qualquer assunto: comércio, serviços, saúde, finanças, aulas, histórias. O que muda de um vídeo para outro é o letreiro, o que vai na prateleira e as condições, nunca a linguagem visual abaixo.

## A ideia

A pessoa é o dono do balcão. O vídeo **monta a vitrine** enquanto ela fala: o letreiro desce do toldo, cada produto é posto na prateleira na palavra que o nomeia, o preço é colado, a condição é carimbada, o mapa mostra onde fica e a placa diz até que horas abre. No fim, um balão de pedido. A pessoa fica embaixo do balcão o tempo todo (nunca numa coluna estreita).

## 1. Dinâmica do motion

- **Pôr na prateleira**: o produto desce 90 px e assenta com um leve passar do ponto (0,42 s, `salto`); a sombra no tampo cresce junto. A etiqueta do nome sobe na beira da prateleira 0,08 s depois.
- **Colar o adesivo**: bate de 150% para 100% girando 16° até a inclinação final (−5° a −11°) em 0,2 s, com a sombra encolhendo (como um adesivo apertado contra o vidro). Preço único: um adesivo por item, a cada 0,06 s.
- **Amarrar o combo**: os produtos se aproximam 16% do centro, a fita kraft se estica do meio para as pontas (0,35 s), o barbante desce do laço e a etiqueta deitada cai na frente da prateleira e balança de leve; o texto se monta na fala.
- **O interior (gancho)**: a plaquinha da parede balança sem parar, um brilho atravessa a cúpula do expositor a cada 3,2 s e o vapor sobe da xícara.
- **Carimbar**: 170% → 100% em 0,16 s (acelerando), a tinta assenta (+1,5% em 0,5 s). A tinta tem falhas (textura de carimbo de verdade). A pessoa leva um soco de 4%.
- **O mapa**: o cartão sobe por cima (0,45 s), as ruas e as quadras se desenham, a rua dita ganha o tracejado tomate correndo da esquerda para a direita, o pino cai com mola e dois anéis se abrem; a câmera do mapa aproxima o tempo todo e mais depressa até o pino.
- **A placa**: desce de trás do toldo, balança no gancho (amortecida, ~1 s) e respira ±1°; sai voltando para trás do toldo em 0,15 s.
- **O letreiro**: desce do toldo (escala vertical com mola), balança e o nome se pinta da esquerda para a direita em 0,5 s.
- **Texto**: palavra por palavra, cada uma subindo 28% do corpo e acendendo em 0,22 s, no instante em que é dita. Terminada a entrada, a palavra fica desenhada simples.
- **O balão de pedido**: cresce da pontinha (40% → 100% com mola), o texto se escreve, os pontinhos "digitando" ficam onde o botão vai aparecer; o botão entra e pulsa (um anel que abre a cada 1,1 s).
- **Sempre vivo**: um reflexo diagonal atravessa o vidro a cada 7,5 s e a saia do toldo ondula de leve. Nada fica parado mais de ~2,5 s.
- **Troca de bloco**: o bloco que sai sobe 24 px e some em 0,16 s; nunca dois blocos inteiros ao mesmo tempo. Nada de cortina, flash, giro ou zoom brusco.

## 2. Organização e hierarquia

- **A fachada** (do alto para baixo):
  - toldo listrado com 14 listras (y 0 a 128 inclinado, saia até y 190 e meias-luas até ~230), decorativo: pode ficar sob a interface do app;
  - letreiro: placa creme de borda café no meio do toldo (y ~100 a 192, até 760 px de largura);
  - vitrine: moldura de madeira x 64 a 1016, y 262 a 952 (borda de 16 px, cantos de 30 px); **área útil do vidro x 108 a 972, y 304 a 912**;
  - balcão: madeira-mel de y 952 a 1008;
  - pessoa: moldura de madeira de 10 px, x 30 a 1050, a partir de y 1008.
- **Dentro do vidro**:
  - letreiro do vidro (título) no alto, centrado, com o traço tomate de 100 px embaixo;
  - prateleira com o tampo em y 776; produtos em pé sobre ela (1 a 4 colunas iguais; até 350 px de altura com 3); etiquetas do nome na beira (y ~808 a 908); adesivo de preço no canto de cima à direita de cada produto (158 px com 3 itens);
  - o combo: fita na altura de ~1/3 dos produtos com um laço no meio; a etiqueta deitada (até 820 px, inclinada −3°) na frente da prateleira, abaixo dos produtos, presa ao laço por um barbante; nunca cobre um produto;
  - o gancho (`abertura` com `cena`): letras no alto; prateleira com até 4 ilustrações à esquerda (y ~612), a plaquinha da parede embaixo dela e o expositor com cúpula à direita;
  - o mapa: cartão com 20 px de folga do vidro, etiqueta do endereço embaixo, placa de horário pendurada no canto de cima à direita (330 px);
  - o balão de pedido: 824 px, centrado um pouco acima do meio, pontinha embaixo à esquerda.
- **Cartão de apresentação**: no canto de cima à esquerda da moldura da pessoa (x 64, y ~1028), na folga acima da cabeça, de 0,2 s a ~3,6 s: pílula creme com círculo tomate de 70 px com a inicial, nome em 40 px (mínimo 34), área em 28 px, até 460 px de largura.
- **Margens**: nada de texto ou cartão a menos de 64 px das laterais, nada importante acima de y 120 (o toldo é decorativo), nada importante abaixo de y 1700.
- **Legenda**: só quando um momento pede (`legenda: true`): pílula creme abaixo do queixo, até 4 palavras, a palavra dita em tomate.

## 3. Tipografia

- **Plus Jakarta Sans** (Google Fonts), pesos 600, 700 e 800, tracking −0,02em no 800 e −0,01em no resto (nunca mais apertado que −0,025em). Abertura 56–100 px; letreiro do vidro 36–60 px; preço no adesivo ~47 px; etiquetas 22–36 px; carimbo 44–104 px em caixa alta com +0,04em; placa 32–58 px (rótulo 22–28 px em caixa alta com +0,14em, mostarda).
- **Fraunces itálica 600** só no letreiro do toldo (o nome do negócio, até ~22 caracteres). Nunca em texto corrido.
- O texto é medido com as larguras reais das fontes (`src/larguras.ts`) e reduz até caber; nunca vaza nem é cortado.

## 4. Moldura da pessoa

- Sempre embaixo do balcão; o rosto ocupa ~29% da largura da moldura, com o centro no eixo do quadro e ~56 px de folga acima do cabelo.
- `VideoNaCaixa` com `rosto={plano.rosto}`: a moldura segue o rosto quadro a quadro.
- Escala por trecho: 100% ↔ 106% em corte seco, só quando o trecho anterior durou mais de 1 s. Soco de 4% no carimbo e no pino.
- **Nunca** mexa na cor do vídeo: sem filtro, brilho, halo ou luz atrás da pessoa; nenhuma sombra por cima do vídeo.

## 5. Cores

| Papel | Cor |
|---|---|
| parede | creme-manteiga #F3E1C1 (topo #E6CDA3), tábuas café a 7% |
| toldo | tomate #D8432A (escuro #A92F1C) e creme #FFF2DE |
| madeira (moldura, prateleira, balcão) | #C17E43 (clara #E2AE72, escura #8A5228) |
| vidro | #FFF8EC → #F7E8CF embaixo; reflexo branco a 16–22% |
| tinta | café #3B2416 (texto), #7A5A45 (detalhes) — nunca preto |
| papel (etiquetas, cartões, balão) | #FFFBF3, borda #EAD8BC |
| adesivo de preço | mostarda #F4B731 (borda #C98C10) |
| ênfase, carimbo, pino, alerta | tomate #D8432A |
| mapa, "certo" | sálvia #8FA66E (clara #DCE3C6) |
| fita do combo | kraft #C9A06A (escuro #9C7744) |

Não use giz nem quadro-negro (é a Lousa), preto com dourado (é o Cofre), verde de aplicativo de mensagem, neon ou gradiente.

## 6. Sons

Tonais, raros e bem abaixo da voz (volume 0,14 a 0,36 antes da normalização a −14 LUFS): nota de marimba de madeira por produto posto (ré, fá#, lá, ré), um "tic" curto no adesivo, duas notas rápidas na fita, batida grave tonal no carimbo, duas notas descendo no pino, dois toques graves de madeira na placa, uma subida suave no balão, um acorde de três notas no letreiro. Nada de sino de porta, caixa registradora, moedas, buzina ou ruído branco.

## 7. Imagens

- Produtos como **foto recortada** (PNG transparente), todos com a mesma luz e o mesmo enquadramento (gere ou fotografe juntos, lado a lado, e recorte). Em pé na prateleira, ficam como numa vitrine de verdade.
- Sem foto boa: `ilustracao` (vetor na paleta da fachada) ou o cartão com o nome grande.
- Nunca imagem com texto, rótulo de marca, logo ou pessoa reconhecível. O mapa é sempre o ilustrado do template, nunca print.
