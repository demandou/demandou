# O estilo Herbário

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma prancha botânica de livro antigo de verdade, daquelas de museu, desenhadas a pena e coloridas à mão, e não um vídeo com enfeites de jardim. Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

O vídeo inteiro é um livro de botânica aberto, seja qual for o assunto. A abertura é o frontispício: o retrato do autor num oval de herbário e o título do livro embaixo. Depois, cada ideia vira uma prancha: um ramo prensado com as folhas numeradas (uma lista), uma série de estágios de crescimento (um passo a passo), um espécime medido com uma cota (um número), dois espécimes lado a lado (uma comparação), um gráfico de prancha científica a pena e aquarela, a etiqueta de determinação de um espécime (uma definição) e, como assinatura, a planta num vaso desenhado em corte, como os atlas mostram o que não se vê (a terra, as raízes, o fundo), que age na fala. A câmera corre pelo papel de uma prancha para a outra, como os olhos correm por um livro; quando a pessoa ensina a olhar de perto, a câmera mergulha no detalhe. Nas frases fortes o oval se abre e a pessoa entrega um cartão de herbário ou uma etiqueta de campo. Sério, delicado e útil, sem ser fofo nem rústico.

## Os 5 itens do estilo

### 1. Dinâmica do motion

- **Lápis → tinta → aguada.** Tudo nasce a lápis (grafite `#A3A89D`, traço fino): títulos, rótulos, desenhos, etiquetas, até as caixas que vão receber algo. Cada palavra ganha tinta da esquerda para a direita no instante em que é dita (0,34 s); cada desenho é passado a pena (`Traco`, o traço que se desenha) e a aquarela entra logo atrás. Nada fica vazio esperando a fala e nada pula na tela. Pronta, a palavra é desenhada como texto simples (sem a camada de lápis e sem máscara).
- **A câmera corre pelo papel.** Cada prancha fica ao lado da anterior; a troca é um deslocamento horizontal de 0,72 s com curva simétrica firme (Bezier 0,65 · 0 · 0,35 · 1), começando 0,14 s antes do corte. A prancha que chega já traz tudo a lápis; a que sai leva tudo o que tem. O papel (textura, filete duplo nas bordas, cabeçalho corrido "Herbário de Fulano · Prancha II") fica parado: é a moldura do livro.
- **O oval viaja junto**: troca de canto entre pranchas, cresce até a tela cheia (a elipse primeiro, os cantos no fim) antes de um cartão, encolhe de volta revelando a prancha nova. O cabeçalho só aparece quando o oval assentou; o cartão só sobe quando o oval já cobre o desenho. Nunca dois textos um sobre o outro.
- **Progressão interna**: a pena desce pelo caule até o item da vez, a folha se abre, o estágio seguinte cresce, a seta tracejada se desenha, o número conta enquanto o raminho cresce, a coluna sobe, a fatia se abre, o caule da tendência atravessa a prancha soltando folhas, a etiqueta se desdobra, o risco atravessa as palavras, a fita de linho prende o espécime. Algo muda a cada 1,5–2,5 s.
- **Editorial, com significado**: entra decidido e assenta (Bezier 0,16 · 1 · 0,3 · 1). Sem quique, sem elástico, sem giro decorativo, sem flash. Em tela cheia, a imagem continua se aproximando devagar.

### 2. Organização e hierarquia

- **Uma prancha por ideia.** No alto, o cabeçalho ao lado do oval: rótulo em versalete (FIG. III, ERRO Nº 1, DEFINIÇÃO), um fio de pena e o título grande (o que a pessoa está dizendo, em poucas palavras). No corpo, de 700 px até 1530 px, o desenho, que é o protagonista.
- **Numeração de prancha**: números em círculos nas etiquetas (1, 2, 3), algarismos romanos nos medalhões (I, II, III), Fig. A e Fig. B na comparação. O item da vez fica com o número cheio de verde-musgo; os anteriores ficam a tinta; os próximos, a lápis.
- **Etiquetas de espécime**: um anel com ponto no desenho, a linha-guia de pena e uma etiqueta de papel claro com borda de tinta, o número num círculo e o texto em itálico. Nunca em cima do rosto nem do título; no vaso, ao lado do desenho ou na linha de baixo (duas vagas; com 3 etiquetas, duas linhas e o vaso menor).
- **Tela cheia**: um cartão de herbário (papel claro, filete duplo, rótulo em versalete, fio de pena, o texto grande, o raminho no canto) ou a etiqueta de campo presa por um barbante, sempre logo abaixo do queixo e acima da interface do app.

### 3. Tipografia

- Uma família só, gratuita no Google Fonts: **Alegreya** 700 nos títulos e textos (itálica 600 nas etiquetas, nos termos, nos detalhes e no destaque), **Alegreya SC** 700 nos rótulos em versalete espaçados (maiúsculas cheias, espaçamento 0,1–0,12em) e medalhões, **Alegreya Sans** 700 só na legenda. Algarismos lineais em todo o vídeo (`lnum`). O I maiúsculo, o l minúsculo e o 1 não se confundem. Nada de fonte condensada nem espaçamento negativo.
- O texto é medido com a largura real das letras (`src/larguras.ts`, `src/medida.ts`) e encolhe até um mínimo legível; passou disso, quebra em mais linhas; nunca vaza. Uma linha não termina com palavra solta de 1–2 letras.
- **Tamanhos** (quadro de 1080 de largura): título do frontispício 124 → 76 px; título de prancha 112 → 64 px; itens de lista 62 → 40; passos 78 → 44; lados da comparação 76 → 46; número até 270 px; significado 84 → 50; destaque 124 → 72; cartões 92 → 60; etiquetas 46 → 38; rótulos 34 (mínimo 30); medalhões 32–36; legenda 48; cabeçalho corrido 32. Nada abaixo de 30 px.

### 4. Moldura da pessoa

- Uma **moldura oval de herbário**: filete de pena de 4,5 px, passe-partout de papel mais escuro, filete fino por fora e dois "pregos" no eixo, como a folha presa na prancha. A pessoa nunca é recortada do fundo e nada é desenhado em cima dela.
- **Lugares**: grande no alto e centrado no frontispício (620×800 px); no canto de cima à direita (392×500) ou à esquerda (428×542) nas pranchas, trocando de lado a cada prancha de bloco (a figura de vaso usa a direita; o detalhe da terra, a esquerda); aberta em tela cheia nos cartões e nos trechos só com legenda.
- **Rosto**: seguido quadro a quadro (`VideoNaCaixa` com o rastro do motor). Em gravação muito perto da câmera (rosto largo no quadro), o oval afasta sozinho para a cabeça caber; `oval.zoom` e `oval.ancoraY` no plano ajustam por cima.

### 5. Cores, textura e som

- **papel de herbário** `#E9EBE2`: branco cinza-sálvia, frio, com textura de fibras leve (`public/papel.jpg`).
- **tinta ferrogálica** `#1F2620`: todo texto e todo traço.
- **grafite** `#A3A89D`: o esboço, o que ainda vai ser dito.
- **verde-musgo** `#2F5B45`: o único acento da interface: rótulos, medalhões, o item da vez, o destaque, os termos, os ícones, o ✓.
- **garança** `#A8432F`: só o problema: alerta, erro, risco, o lado errado, o ✗. Nunca em título, nunca em fundo.
- **aquarelas** (só dentro dos desenhos, sempre lavadas, fora do registro 3–4 px, com a borda irregular do filtro `aquarela`): folha `#86A66F` (pálida `#CDC98C`), terra `#9C7A5B`, barro `#C98B6B`, água `#7FA3B8`, raiz `#CDB88C`, sol `#E6C26A`. Hachura diagonal na parede do vaso e nas colunas; hachura horizontal na água.
- Nada de gradiente decorativo, brilho atrás da pessoa, contorno em letra, emoji, sombra forte ou cor saturada. As únicas sombras são as dos cartões e da etiqueta de campo, macias.
- **Som raro e tonal** (senos com envelope curto e passa-baixa em `public/sfx/`; `gerar.sh` refaz todos com ffmpeg): duas notas graves quando a câmera corre (a altura muda a cada prancha); descida grave no mergulho; nota curta de pena (`folha.wav`) quando um item ganha tinta; três notas subindo no número, na tendência que sobe e na folha nova; dois tons graves descendo na raiz podre e na tendência que cai; duas notas descendo no alerta, no risco e no ✗; toque grave na definição, na pergunta e no dedo; gota grave na água; acorde macio no fechamento. Nunca dois sons a menos de 0,45 s. Nada de ruído, chiado, clique agudo ou sino.

## Geometria (px no quadro 1080×1920)

- Filete duplo a 26 e 36 px das bordas; cabeçalho corrido em y = 56.
- Oval do canto direito: x 628–1020, y 118–618; do canto esquerdo: x 56–484, y 118–660. Cabeçalho ao lado: 72–594 ou 518–1022, de 146 a ~566.
- Corpo dos blocos: 700 a 1530 px (listas e passos espaçados até 270–290 px por item). Figura: o vaso apoiado em ~1466 px, a linha de etiquetas em ~1518; no detalhe, a superfície da terra em 820 px.
- Frontispício: título a partir de 1000 px; raminho ou vaso no pé (1500–1875, decorativo, pode ficar sob a interface do app).
- Cartões de tela cheia: 900 px de largura, a partir do `zona.topo` (abaixo do queixo), sem passar de 1550 px.

## O que pode mudar por vídeo

- Textos, tempos, blocos, ações, alvos e etiquetas (é o trabalho do plano).
- `marca` (nome e área), os rótulos (`rotulo`), o enquadramento no oval (`oval.zoom`, `oval.ancoraY`), os ícones do fechamento, `sfx: false`.

## O que não mudar sem o usuário pedir

- A mecânica do oval e da câmera (`src/layout.ts`): tamanhos e lugares dos ovais, a corrida entre pranchas, o mergulho, a abertura em tela cheia, as curvas e as durações.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `musgo` (e o `musgoClaro`) em `src/tema.ts`, por uma cor escura o bastante para ser texto sobre o papel; o papel, a tinta e as aquarelas seguram a cara de prancha antiga.
- A fonte e os tamanhos mínimos; nada de texto abaixo de 1560 px.
- Não adicione emojis, stickers, fotos de banco, brilho atrás da pessoa, contorno nas letras, gradientes, tremidas, flashes ou transições além da corrida da câmera, do mergulho e da abertura do oval. Não troque o desenho a pena por ícones coloridos ou ilustração "flat".

## Se precisar de algo que o modelo não tem

- **Uma ação nova da figura** (ex.: "podar", "adubar", "mudar de vaso"): acrescente o nome no tipo `Acao` (`src/plano.ts`), o estado em `FiguraNaPrancha` (`src/componentes/Figura.tsx`, a partir de `p("nome", duração)`) e o desenho em `src/desenhos/Vaso.tsx` ou como peça nova em `src/desenhos/Acessorios.tsx`. Desenhe com `Traco`, as espessuras de `traco` e aquarela com `filter="url(#aquarela)"` deslocada 3–4 px; faça a ação acontecer na palavra. Som em `sons` (`src/Edicao.tsx`) só se for uma batida importante.
- **Um ponto novo para etiqueta**: acrescente em `ALVOS_VASO` (coordenadas locais do vaso: centro em x = 0, borda de cima em y = 0, fundo em y = 420) e o nome no tipo `Alvo`.
- **Um bloco novo de prancha**: um componente em `src/componentes/blocos/` que recebe `PropsDoBloco` (`src/componentes/Bloco.tsx`), desenha no corpo (700–1530 px) com `Ramo`/`Folha` (`src/desenhos/Ramo.tsx`), `Traco`, `EtiquetaDeItem`, `Medalhao` e `TextoNaFala` (`src/componentes/Pecas.tsx`), mede o texto com `encaixar` (`src/medida.ts`) e usa `CabecalhoDoBloco`; acrescente o tipo em `src/plano.ts` e o caso em `BlocoNaPrancha`. Consulte a skill do Remotion para as regras de animação.
