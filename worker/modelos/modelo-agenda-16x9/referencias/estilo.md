# O estilo Agenda (versão deitada, 16:9)

O sistema abaixo é o do vertical e vale inteiro no quadro deitado. As medidas do 16:9 e a composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação no quadro à esquerda) estão em "Medidas (quadro deitado 1920 × 1080)".

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um app de agenda bem desenhado (limpo, preciso, calmo) em que as ideias viram coisas que se encaixam: blocos que caem nos seus lugares, um cronômetro que conta, uma linha do tempo que se enche, um dia que se conclui. Ele funciona com qualquer assunto porque a agenda é uma forma de organizar, não um tema. Quase toda "melhoria" que adiciona coisa (brilho, gradiente, emoji, confete, relógio 3D) piora o resultado.

## A ideia

Toda fala tem uma ordem, um plano, coisas que vêm antes e depois, coisas que ficam de fora. Aqui isso vira agenda: a pessoa é o compromisso de vídeo do app e, enquanto fala, monta a página na frente do espectador. Cada ideia dita cai como um bloco no seu lugar a lápis; o número conta no anel do cronômetro; os passos acendem numa linha do tempo; dois lados viram dois dias; e, entre um momento e outro, a linha do "agora" varre a página. O espectador entende olhando para a agenda, não lendo sobre ela.

## Os 5 pontos do estilo

### 1. Dinâmica do motion

- **Espera a lápis → cai e assenta.** O que vai aparecer existe antes tracejado e apagado (contorno, número, palavra em cinza-claro). Na palavra dita, o bloco vem um pouco de cima e 6% maior, com sombra alta, e pousa no lugar com sombra baixa em 0,42 s (curva que freia, sem quique, sem elástico, sem giro).
- **Palavras sobem de trás de uma régua** no instante em que são ditas; a palavra a lápis rola para cima e a cheia entra por baixo, como um contador. Terminada a animação, só o texto final fica desenhado.
- **Movimento com significado:** o número conta e o anel se enche junto; a linha do tempo se enche até o passo dito; o realce anda até o item da vez; o bloco da definição se abre para baixo; a curva se desenha até a palavra; o traço tomate risca o que fica de fora; o botão do lembrete afunda.
- **Trocas:** a pessoa muda de lugar em 0,6 s, começando 0,15 s antes da fronteira (o corte some no movimento). Saindo da tela cheia, a folha já está pronta embaixo e a caixa encolhe rápido sobre ela até a moldura da direita, levando junto, preso ao vídeo, o cartão que estava ao lado do peito. Entre dois momentos na folha, **a cortina**: a linha do "agora" (tomate, 6 px, com uma bolinha na ponta esquerda) desce pela folha em 0,5 s; acima dela já está o momento novo, abaixo ainda o anterior. Nunca há quadro vazio nem dois textos sobrepostos.
- **Nada parado:** algo muda a cada 1,5 a 2,5 s (itens que caem, a contagem, a marcação "agora" que gira em volta do anel depois de contar, a ponta da curva que pulsa).

### 2. Organização e hierarquia

- Uma ideia por momento; o conteúdo nunca passa por baixo da pessoa. No quadro deitado, ele fica sempre no quadro à esquerda da moldura.
- Na folha: título do momento no alto (56 a 76 unidades, palavra por palavra), itens grandes embaixo, rótulos pequenos em caixa alta espaçada (letreiros de 30 a 36 unidades com um quadradinho de cor).
- O item da vez é **tomate cheio com texto branco**; os anteriores voltam a ardósia claro. Os passos feitos ganham ✓.
- Todos os itens de uma lista no mesmo corpo (o maior que serve para todos); o texto é medido e diminui até caber em 2 ou 3 linhas.
- A régua de horas à esquerda: horários só quando foram ditos; sem horário, a ordem (1, 2, 3) ou o `quando` escrito no plano.
- Cartões da tela cheia numa coluna livre ao lado do corpo, na altura do peito (à esquerda da pessoa quando cabe), nunca sobre o rosto e sempre acima dos controles do player (y 984 px).

### 3. Tipografia

- Uma família só: **Golos Text** (Google Fonts), pesos 600, 700 e 800, com números tabulares (horários e contadores não "dançam"). O l minúsculo tem cauda: "Il1", "IPTU" e "Inglês" nunca se confundem. Nada de fonte condensada.
- Espaçamento entre letras de 0 a −0,025em nos títulos; letreiros em caixa alta com +0,10 a +0,12em.
- Tamanhos (em unidades da tela virtual de 2400 × 1350, que sai a 80% no quadro de 1920 px): títulos de cartão 60 a 104; título do momento 44 a 76; itens 40 a 72; número do anel até 150; rótulos e etiquetas 34 a 44; horas da régua 30 a 37. Nada abaixo de 30 unidades (24 px). Julgue nos quadros reduzidos a 960 px de largura.
- As larguras da fonte estão em `src/larguras.ts` e a medida em `src/medida.ts` (o template mede tudo sem o navegador). Trocar a fonte exige refazer essa tabela.

### 4. Moldura da pessoa

- **A pessoa é o compromisso de vídeo:** em tela cheia (a pessoa como foi gravada; etiqueta "câmera · nome · área" no alto, à esquerda, dentro da margem segura) ou como uma moldura da folha, sempre encostada na direita, de cantos redondos (26 a 28 unidades), fio cinza e sombra baixa, com a etiqueta no pé.
- Molduras (`src/agenda.ts`, `lugares`; em unidades): **larga** (`topo`) 800 × 1072; **em pé** (`lado`) 660 × 1072, ou 660 × 720 com o anel do cronômetro embaixo; **pequena no canto** (`canto`) 420 × 480, com o contador embaixo; **a maior** (`alto`) 940 × 1072, na frase. Momentos seguidos na folha alternam a moldura.
- O rosto fica centralizado na moldura e é seguido quadro a quadro (o motor, pelo rastro do rosto), com ajuste suave. O zoom de cada moldura sai do tamanho do rosto (ele ocupa de 34% a 46% da largura dela), sem ampliar o vídeo além de ~1,3×; em gravação muito perto da câmera, o zoom desce até a cabeça caber inteira.
- Nunca recortada do fundo, nunca distorcida, nunca numa coluna estreita de borda a borda: funciona com qualquer gravação.

### 5. Cores, textura e som

- **Fundo** cinza-frio `#E9ECF1`; **folha** `#FFFFFF` com cantos de 44 unidades e sombra baixa; **tinta** `#14161C`; apoio `#5B6272`; **lápis** `#BCC3CF` (contornos) e `#A3AAB8` (palavras).
- **Tomate `#EF5A33`** (com `#C8421E` para letreiros e riscos, `#FDE5DC` de fundo claro): o principal, o item da vez, a ênfase, o alerta, o botão, a linha do "agora".
- **Verde-folha `#49A85E`** com fundo `#DCF0D4`: o certo, a pausa, o que passa. **Manjericão `#2B7746`** com fundo `#BFE2B1`: pausa longa, resultado. **Ardósia `#465064`** com fundo `#E2E6ED`: neutro, o que já passou.
- Sombras macias e baixas; nada de brilho, gradiente, neon ou textura.
- Sons tonais e raros (`public/sfx`): "toc" grave quando um bloco assenta (a nota muda com a categoria), notas que sobem nos itens e ciclos, um traço grave no risco, duas notas quando algo acende, se conclui ou é salvo. Nada de clique agudo, tique-taque, ruído ou sino.

## Medidas (quadro deitado 1920 × 1080)

O desenho é feito numa tela virtual de 2400 × 1350 unidades, reduzida a 0,8 por cima do vídeo (`src/tema.ts`): os tamanhos do vertical valem como estão, em unidades, e saem a 80% em px. Só o vídeo da pessoa é posto em px de verdade (uma reamostragem só).

| O quê | Onde (unidades; px entre parênteses) |
|---|---|
| margens seguras (YouTube) | 96 px nas laterais; nada importante abaixo de y 984 px (controles do player) |
| folha da agenda | x 60 a 2340, y 52 a 1252 (48 a 1872, 42 a 1002 px), cantos de 44; cabeçalho de 88 |
| conteúdo da folha | y 156 a 1228 (125 a 982 px); a agenda de blocos termina em 1208 (966 px), para o último horário da régua caber acima do player |
| régua de horas | começa na margem segura, x 120 (96 px), com 116 de largura; os blocos começam em x 250 (200 px) |
| moldura da pessoa (na folha) | sempre encostada na direita, em x 2316 (1853 px), a partir do topo do conteúdo; larga 800, em pé 660, canto 420 × 480, a maior 940 |
| quadro à esquerda (o conteúdo) | da margem segura até 34 antes da moldura: ~1362 com a larga, ~1502 com a em pé, ~1742 com a do canto, ~1222 com a maior |
| cartões da tela cheia | coluna livre de 620 a 1040 de largura ao lado do corpo (à esquerda quando cabe), fora do rosto em todo o trecho (medida com o rastro); centrados na linha do peito (600 a 800), entre y 176 e 1222; com legenda, acabam acima dela |
| legenda | em tela cheia: centrada, até 1600 de largura, corpo 50, pousada em y 1220 (976 px); na moldura: no pé dela, corpo 40; na moldura do canto não aparece |
| etiqueta da câmera | em tela cheia, no alto, à esquerda, dentro da margem segura; na moldura, no pé |

### A composição da aula 9 do curso (editar uma aula horizontal)

- Tela cheia como base; a folha abre quando acrescenta clareza e a pessoa volta para a tela cheia ao fim da ideia.
- Na folha, a pessoa numa moldura à direita, com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto); a explicação no quadro à esquerda, entrando na ordem do raciocínio, com tempo de leitura.
- Sem excesso de cor nem informação simultânea: uma ideia por momento, o tomate em uma coisa de cada vez.
- Blocos que no vertical são de tela cheia (abertura, gancho, destaque, pergunta, número do primeiro momento, lembrete) continuam de tela cheia, com o cartão ao lado do peito em vez de embaixo do queixo.

## O que pode mudar por vídeo

- Textos, tempos, a escolha dos blocos e das categorias (é o trabalho do plano).
- `marca`, o nome e o dia da agenda, o nome por momento (`agenda` num `blocos`), o letreiro e as etiquetas do lembrete, o ícone do botão.
- O lugar da pessoa nos tipos que aceitam `pessoa`.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A gramática (`src/agenda.ts`): lugares da pessoa (a moldura à direita, o quadro à esquerda, a coluna dos cartões ao lado do peito), trocas, cortina, a regra de o conteúdo nunca ficar por baixo da pessoa, a régua.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o tomate (`foco`, `focoEscuro`, `focoFundo` em `src/tema.ts`) por uma cor viva o bastante para texto branco em cima; os verdes e a ardósia seguram a leitura das categorias.
- A fonte e os tamanhos; as margens da folha e as margens seguras do YouTube.
- Não adicione emojis, logotipos de app de calendário, brilho atrás da pessoa, contorno nas letras, gradientes, ponteiros de relógio analógico, tique-taque, transições além das trocas e da cortina. Não troque os ícones a traço por ícones coloridos ou de banco.

## Se precisar de algo que o modelo não tem

- **Um ícone novo:** acrescente em `DESENHOS` (`src/componentes/Icones.tsx`): viewBox 48×48, traços com pontas redondas, o objeto ocupando de ~6 a ~42; áreas cheias só em `cheios`. Genérico: nada que lembre o logotipo de um produto.
- **Uma categoria nova** (ex.: "estudo" em azul): acrescente em `CATEGORIAS` (`src/tema.ts`) com `forte`, `fundo`, `texto`, `nome` e `solido` (só uma categoria cheia por vídeo fica bem: o foco), o tipo em `Categoria` e o som em `sons` (`src/Edicao.tsx`).
- **Um componente novo:** o tipo em `src/plano.ts`; o lugar da pessoa em `lugarPadrao` (`src/agenda.ts`); o desenho em `src/componentes/`, dentro de `NaFolha` (que cuida da entrada, da saída e da cortina) e na área de `areaDoConteudo`, com as medidas de `src/medida.ts`, o lugar a lápis e a queda de `BlocoQueCai`; o caso em `src/Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
