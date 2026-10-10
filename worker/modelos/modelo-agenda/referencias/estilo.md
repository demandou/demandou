# O estilo Agenda

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um app de agenda bem desenhado — limpo, preciso, calmo — em que as ideias viram coisas que se encaixam: blocos que caem nos seus lugares, um cronômetro que conta, uma linha do tempo que se enche, um dia que se conclui. Ele funciona com qualquer assunto porque a agenda é uma forma de organizar, não um tema. Quase toda "melhoria" que adiciona coisa (brilho, gradiente, emoji, confete, relógio 3D) piora o resultado.

## A ideia

Toda fala tem uma ordem, um plano, coisas que vêm antes e depois, coisas que ficam de fora. Aqui isso vira agenda: a pessoa é o compromisso de vídeo do app e, enquanto fala, monta a página na frente do espectador. Cada ideia dita cai como um bloco no seu lugar a lápis; o número conta no anel do cronômetro; os passos acendem numa linha do tempo; dois lados viram dois dias; e, entre um momento e outro, a linha do "agora" varre a página. O espectador entende olhando para a agenda, não lendo sobre ela.

## Os 5 pontos do estilo

### 1. Dinâmica do motion

- **Espera a lápis → cai e assenta.** O que vai aparecer existe antes tracejado e apagado (contorno, número, palavra em cinza-claro). Na palavra dita, o bloco vem um pouco de cima e 6% maior, com sombra alta, e pousa no lugar com sombra baixa em 0,42 s (curva que freia, sem quique, sem elástico, sem giro).
- **Palavras sobem de trás de uma régua** no instante em que são ditas; a palavra a lápis rola para cima e a cheia entra por baixo, como um contador. Terminada a animação, só o texto final fica desenhado.
- **Movimento com significado:** o número conta e o anel se enche junto; a linha do tempo se enche até o passo dito; o realce anda até o item da vez; o bloco da definição se abre para baixo; a curva se desenha até a palavra; o traço tomate risca o que fica de fora; o botão do lembrete afunda.
- **Trocas:** a pessoa muda de lugar em 0,6 s, começando 0,15 s antes da fronteira (o corte some no movimento). Saindo da tela cheia, a folha já está pronta embaixo e a caixa encolhe rápido sobre ela, levando o cartão do peito preso ao vídeo. Entre dois momentos na folha, **a cortina**: a linha do "agora" (tomate, 6 px, com uma bolinha na ponta esquerda) desce pela folha em 0,5 s; acima dela já está o momento novo, abaixo ainda o anterior. Nunca há quadro vazio nem dois textos sobrepostos.
- **Nada parado:** algo muda a cada 1,5 a 2,5 s (itens que caem, a contagem, a marcação "agora" que gira em volta do anel depois de contar, a ponta da curva que pulsa).

### 2. Organização e hierarquia

- Uma ideia por momento; o conteúdo nunca passa por baixo da pessoa.
- Na folha: título do momento no alto (56 a 76 px, palavra por palavra), itens grandes embaixo, rótulos pequenos em caixa alta espaçada (letreiros de 30 a 36 px com um quadradinho de cor).
- O item da vez é **tomate cheio com texto branco**; os anteriores voltam a ardósia claro. Os passos feitos ganham ✓.
- Todos os itens de uma lista no mesmo corpo (o maior que serve para todos); o texto é medido e diminui até caber em 2 ou 3 linhas.
- A régua de horas à esquerda: horários só quando foram ditos; sem horário, a ordem (1, 2, 3) ou o `quando` escrito no plano.
- Cartões no peito (tela cheia) sempre abaixo do queixo e acima da interface do app (até 1540 px).

### 3. Tipografia

- Uma família só: **Golos Text** (Google Fonts), pesos 600, 700 e 800, com números tabulares (horários e contadores não "dançam"). O l minúsculo tem cauda: "Il1", "IPTU" e "Inglês" nunca se confundem. Nada de fonte condensada.
- Espaçamento entre letras de 0 a −0,025em nos títulos; letreiros em caixa alta com +0,10 a +0,12em.
- Tamanhos (quadro de 1080 de largura): títulos de cartão 60 a 104 px; título do momento 44 a 76 px; itens 40 a 72 px; número do anel até 150 px; rótulos e etiquetas 34 a 44 px; horas da régua 30 a 37 px. Nada abaixo de 30 px. Julgue nos quadros reduzidos a 540 px.
- As larguras da fonte estão em `src/larguras.ts` e a medida em `src/medida.ts` (o template mede tudo sem o navegador). Trocar a fonte exige refazer essa tabela.

### 4. Moldura da pessoa

- **A pessoa é o compromisso de vídeo:** em tela cheia (rosto na linha do centro; etiqueta "câmera · nome · área" no alto, à esquerda) ou como uma caixa da folha, de cantos redondos (26 a 28 px), fio cinza e sombra baixa, com a etiqueta no pé.
- Lugares (`src/agenda.ts` → `lugares`): **em cima** 952×620; **na raia** 432×820 à direita; **no canto** 340×420; **no alto** 952×680. Momentos seguidos na folha alternam o lugar.
- O rosto é seguido quadro a quadro (o motor). Em gravação muito perto da câmera, o zoom das caixas estreitas desce até a cabeça caber inteira.
- Nunca recortada do fundo, nunca distorcida, nunca numa coluna estreita de borda a borda: funciona com qualquer gravação.

### 5. Cores, textura e som

- **Fundo** cinza-frio `#E9ECF1`; **folha** `#FFFFFF` com cantos de 40 px e sombra baixa; **tinta** `#14161C`; apoio `#5B6272`; **lápis** `#BCC3CF` (contornos) e `#A3AAB8` (palavras).
- **Tomate `#EF5A33`** (com `#C8421E` para letreiros e riscos, `#FDE5DC` de fundo claro): o principal, o item da vez, a ênfase, o alerta, o botão, a linha do "agora".
- **Verde-folha `#49A85E`** com fundo `#DCF0D4`: o certo, a pausa, o que passa. **Manjericão `#2B7746`** com fundo `#BFE2B1`: pausa longa, resultado. **Ardósia `#465064`** com fundo `#E2E6ED`: neutro, o que já passou.
- Sombras macias e baixas; nada de brilho, gradiente, neon ou textura.
- Sons tonais e raros (`public/sfx`): "toc" grave quando um bloco assenta (a nota muda com a categoria), notas que sobem nos itens e ciclos, um traço grave no risco, duas notas quando algo acende, se conclui ou é salvo. Nada de clique agudo, tique-taque, ruído ou sino.

## O que pode mudar por vídeo

- Textos, tempos, a escolha dos blocos e das categorias (é o trabalho do plano).
- `marca`, o nome e o dia da agenda, o nome por momento (`agenda` num `blocos`), o letreiro e as etiquetas do lembrete, o ícone do botão.
- O lugar da pessoa nos tipos que aceitam `pessoa`.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A gramática (`src/agenda.ts`): lugares da pessoa, trocas, cortina, a regra de o conteúdo nunca ficar por baixo da pessoa, a régua.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o tomate (`foco`, `focoEscuro`, `focoFundo` em `src/tema.ts`) por uma cor viva o bastante para texto branco em cima; os verdes e a ardósia seguram a leitura das categorias.
- A fonte e os tamanhos; as margens da folha.
- Não adicione emojis, logotipos de app de calendário, brilho atrás da pessoa, contorno nas letras, gradientes, ponteiros de relógio analógico, tique-taque, transições além das trocas e da cortina. Não troque os ícones a traço por ícones coloridos ou de banco.

## Se precisar de algo que o modelo não tem

- **Um ícone novo:** acrescente em `DESENHOS` (`src/componentes/Icones.tsx`) — viewBox 48×48, traços com pontas redondas, o objeto ocupando de ~6 a ~42; áreas cheias só em `cheios`. Genérico: nada que lembre o logotipo de um produto.
- **Uma categoria nova** (ex.: "estudo" em azul): acrescente em `CATEGORIAS` (`src/tema.ts`) com `forte`, `fundo`, `texto`, `nome` e `solido` (só uma categoria cheia por vídeo fica bem — o foco), o tipo em `Categoria` e o som em `sons` (`src/Edicao.tsx`).
- **Um componente novo:** o tipo em `src/plano.ts`; o lugar da pessoa em `lugarPadrao` (`src/agenda.ts`); o desenho em `src/componentes/`, dentro de `NaFolha` (que cuida da entrada, da saída e da cortina) e na área de `areaDoConteudo`, com as medidas de `src/medida.ts`, o lugar a lápis e a queda de `BlocoQueCai`; o caso em `src/Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
