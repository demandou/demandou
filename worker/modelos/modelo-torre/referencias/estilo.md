# O estilo Torre

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o **filme de lançamento imobiliário à noite em 3D**: uma cidade de janelas acesas, um prédio de alto padrão que se constrói andar por andar, um mapa com a rota dourada, a planta humanizada mobiliada e a etiqueta de preço. Ele é premium porque é contido: noite azul, marfim, **um** dourado champanhe, serifa só nos números e no nome, muito ar. Quase toda "melhoria" que adiciona outro tipo de peça (neon, partículas, brilho atrás da pessoa, moedas, confete, fogos, "OFERTA!", preto com dourado de cassino) piora.

O estilo vale para qualquer assunto: imóveis, finanças, saúde, aulas, histórias. O que muda de um vídeo para outro é o número que sobe, o destino da rota, os cômodos e o valor da etiqueta, nunca a linguagem visual abaixo.

## A ideia

A pessoa apresenta; o mundo 3D **constrói** o que ela diz, na palavra. Primeiro a pergunta por cima da cabeça, depois a virada (a linha de luz), o nome do empreendimento que nasce grande e vira cabeçalho, o prédio que sobe, o mapa, o mergulho para dentro e o preço. A pessoa fica sempre numa moldura com o fundo natural: grande no começo (a ponte), larga embaixo depois (o palco). Nunca numa coluna estreita ao lado, nunca recortada.

## 1. Dinâmica do motion

- **Andares**: cada andar desce 0,6 u e assenta em 0,3 s (escala 105% → 100%); a luz das janelas acende entre 0,12 e 0,55 s depois. Um contorno-fantasma da torre (traço branco a 36%) aparece no nome e some no último andar; um anel dourado de obra sobe junto. O coroamento com fita de LED fecha 0,12 s depois do último andar.
- **Câmera 3D**: nunca parada. Órbita lenta em volta do prédio (ângulo 0,36 → 0,96 rad, subindo do térreo ao topo); para o mapa, mistura em 0,9 s enquanto a cidade baixa para 28% da altura e ganha arestas; no mapa, aproxima devagar; o mergulho desce até o topo do prédio e corta no escuro (0,4 s) para a planta, que começa vista de cima, inclina enquanto as paredes sobem e aproxima até os cômodos.
- **Rota**: um tubo dourado com brilho se desenha da portaria ao destino com uma cabeça luminosa; o pino de metal dourado cai de 5 u com um anel que se abre; no destino, um disco dourado e outro anel.
- **Planta**: traço de arquiteto em linha dupla se desenha parede por parede (0,016 s entre elas) → as paredes sobem do chão enquanto a área conta → os pisos "materializam" (madeira, porcelanato, deck) → os móveis pousam um a um (0,045 s entre eles, com sombra de contato) → as portas abrem → os abajures acendem → os cômodos ditos ganham piso dourado e borda.
- **Etiqueta**: desce 90 px girando de −11° a 0° no fio dourado que se desenha (0,7 s); o número conta até cada pedaço dito, arredondado a 1% do valor enquanto conta.
- **Texto**: sobe por máscara com desfoque de 8 px (0,3 s); letras do nome e do destaque entram uma a uma (0,022–0,035 s); sai com desfoque de 10 px e subindo 24–30 px. Assentado, o texto fica desenhado simples (sem a máscara).
- **Pessoa**: a moldura desce da ponte para o palco em 0,58 s (curva suave); a cada corte, o enquadramento alterna 100% ↔ 108% e empurra 1,6% dentro do trecho. A virada: linha de luz de 6 px (branco no meio, champanhe nas pontas, brilho) desce a moldura em 0,6 s.
- **Sempre vivo**: a câmera 3D e as janelas mudam o tempo todo; nos blocos universais, a cidade desfocada continua em órbita lenta. Nada fica parado mais de ~2,5 s.

## 2. Organização e hierarquia

- **Ponte**: título no alto (y ~150–460), moldura x 44–1036, y 476–1856 (raio 48), rosto em y ~868; legenda abaixo do queixo (~1168).
- **Palco**: mundo 3D na metade de cima; moldura x 76–1004, y 984–1856 (raio 46), rosto em y ~1316.
  - cabeçalho (nome do empreendimento): x 64, y 128–260 (rótulo 28 px + nome em serifa 98 px);
  - selo: canto de cima à direita (x até 1016, y 136), Manrope 600 28 px marfim 72% com um ponto dourado;
  - coluna da esquerda: x 64, y 318, até ~540 px: número em serifa 230 px + unidade 97 px champanhe, filete dourado de 2 px (220 px), rótulo em caixa alta 32 px, linha do bairro com pino;
  - o mundo 3D fica à direita (a câmera desloca a imagem 130–150 px para a direita e 300–430 px para cima);
  - área dos blocos universais: x 64–1016, y 300–930.
- **Uma ideia por vez.** Nunca dois números grandes na tela.

## 3. Tipografia

- **Cormorant Garamond 600** (serifa elegante): números grandes (andares, minutos, m², preço) e o nome do empreendimento. Texto grande e bem espaçado; nunca em parágrafo.
- **Manrope 700** em caixa alta espaçada (0,3em; 0,46em no "Residencial") nos rótulos dourados; Manrope 700 normal no texto das etiquetas e listas; 600 nas notas.
- **Sora** nos títulos (800, tracking −0,02em), nas frases (700) e na legenda (800, 66 px).
- Nada condensado; tracking nunca mais apertado que −0,025em. Mínimos: 28 px em rótulos, 34 px em texto de leitura, 34 px no nome da tarja.

## 4. A moldura da pessoa

- Sempre o **vídeo natural**, nada de recorte, brilho, halo ou luz atrás; a cor do vídeo nunca muda.
- Cantos arredondados, filete champanhe de 1,5 px (55%), sombra suave (0 34px 90px preto 60%).
- O rosto no eixo central, seguido quadro a quadro (`VideoNaCaixa` com o rastro). Gravação de muito perto: o modelo não aproxima e desce o rosto para a cabeça caber.
- A legenda fica abaixo do queixo ou na costura (logo acima da moldura de baixo), nunca em cima da borda.

## 5. Cores, textura e som

| Papel | Cor |
|---|---|
| fundo / noite | #070C17, #0E1729, céu #040810 → #18284A com o brilho do horizonte |
| texto | marfim #F5F0E6 (72% nas notas) |
| acento único | champanhe #D9BE8A, claro #F1DFB6, fundo #A7884F |
| alerta | coral queimado #E58A6E |
| janelas | âmbar quente (#FFD3A0) nos prédios residenciais; branco frio nos escritórios |
| vidro das etiquetas | rgba(9,15,28,0.82) com borda champanhe |

- Luz: céu de entardecer como ambiente, lua fria (#C9D7FF) com sombras, contraluz âmbar; na planta, estúdio claro e quente.
- **Não** é preto com dourado de cassino (o fundo é azul-noite, o dourado é claro e fino). Nada de gradiente arco-íris, neon ou glow forte.
- Sons tonais, raros e ~12 dB abaixo da voz: `swap_crystal` (virada), `build_clearance` (obra), `pin_ring` (pino), `dive_highpass` (mergulho), `walls_tiles` (paredes), `rooms_select` (cômodos, itens), `tag_set` (etiqueta), `price_hall` (preço). Nada de sino, caixa registradora ou ruído.

## 6. O que nunca fazer

- Mostrar número que não foi dito (andar, minuto, m², preço).
- Marca real (construtora, banco, aplicativo), logo ou print de mapa de verdade.
- A pessoa numa coluna estreita, recortada ou com efeito de cor.
- Dois blocos grandes ao mesmo tempo; texto encostado na margem (64 px) ou abaixo de y 1700.
- A palavra "Remotion" na tela.
