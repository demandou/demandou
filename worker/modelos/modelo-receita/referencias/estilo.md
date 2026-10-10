# O estilo Receita

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma ficha de receita bonita de verdade — daquelas que a gente guarda — e não um vídeo com enfeites de cozinha; quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

O vídeo inteiro é uma ficha de receita. Ela começa no peito da pessoa com o nome da receita, sobe e ocupa a tela quando a receita começa, e desce de volta no fim. A pessoa não some: fica numa janela arredondada pousada sobre o papel, que troca de canto a cada momento. Quem assiste reconhece na hora a ficha (pauta, margem, "Receita", ingredientes, modo de preparo numerado) e vê a receita acontecer: o que é dito cai na panela, a panela vai ao fogo, mexe, engrossa, vai para o pote. Doce e acolhedor, sem ser infantil.

## Regras que definem o estilo

- **Dois estados da ficha**: no peito (abertura, dica, fechamento — pessoa em quadro cheio, rosto no centro, a ficha logo abaixo do queixo) e em cima (ingredientes e passos — a ficha ocupa a tela com uma borda de mesa cacau, a pessoa numa janela de 372×476 px com cantos de 48 px e sombra macia, no canto de cima). Da abertura para os ingredientes, a mesma ficha sobe em 0,72 s levando o título; nas outras trocas entre os dois estados há duas fichas: a cheia desce e sai da tela inteira, com tudo o que tem, por cima da ficha do peito que já espera embaixo (ou uma cheia nova sobe por cima da do peito) — nunca aparece uma ficha vazia. A janela troca de canto em 0,62 s, e o cabeçalho troca de lugar com ela. Toda troca começa 0,16 s antes do corte, para o pulo da imagem sumir no movimento.
- **A pessoa nunca é recortada do fundo e nunca é coberta**: a janela é só um reenquadramento do vídeo (rosto no centro, zoom 2,15), e nada é desenhado sobre ela. Funciona com qualquer gravação. Na passagem do peito para a ficha, o papel sobe "por cima" da pessoa e ela fica visível pela janela, como um recorte na ficha.
- **Tudo já está escrito a lápis**: o nome da receita, o título de cada passo, a quantidade e o nome de cada ingrediente aparecem desde o começo em cor de lápis (`#C9B9A6`), e cada palavra ganha tinta cacau no instante em que é dita, abrindo da esquerda para a direita como a mão escrevendo. Linhas de ingrediente e anotações que esperam a fala nascem tracejadas. Nada fica vazio e nada pula na tela.
- **A cozinha é desenhada e tem memória**: uma panela vista de cima (traço cacau de 5 px, metal claro, cabo cacau) atravessa o vídeo inteiro; nos passos ela é a protagonista, no centro da ficha, com ~65% da largura, e as anotações ficam numa faixa logo acima dela, com linhas que descem até a ação. Os ingredientes caem nela (líquido escorre numa fita cremosa, pedaço cai e derrete, pó cai em chuvisco); a trempe e a chama aparecem no "fogo baixo"; a espátula pistache gira sem parar e a massa vira uma só, com a espiral do creme; o rastro da espátula abre o fundo da panela; a chama se apaga no "desliga"; a massa escorre para o pote, que enche; o vapor sobe e some, e o termômetro desce. Cada ação acontece na palavra que a descreve.
- **Poucas cores, cada uma com função** (cozinha refinada — cores de doce, pouco saturadas):
  - **cacau** `#3A2621` — a tinta de todo texto e de todo traço; a mesa `#2E1E1A` em volta da ficha. É a cor do próprio brigadeiro e conversa com o avental da gravação.
  - **creme de leite** `#F6EFE4` — o papel da ficha; `#EDE3D3` nas linhas de ingrediente.
  - **pistache** `#A9BD6C` — o único acento: o grifo sob o destaque, o visto do ingrediente usado, a espátula, as bolinhas dos passos, o fio do índice, a fita de "salvar". Pistache com chocolate é a dupla clássica da confeitaria e não repete nenhuma paleta do pack (nada de terracota, coral, menta, dourado ou vermelho). Sobre o creme ele é preenchimento ou traço, nunca cor de texto.
  - **caramelo** `#D4883F` — só o calor: a chama do fogão.
  - As cores de dentro da panela e do pote (creme, manteiga, cacau, massa…) são tons de doce e ficam só no desenho.
  - Nada de gradiente, brilho atrás da pessoa, contorno em letra, emoji ou textura forte.
- **Uma família de fonte em dois cortes**: DM Serif Display (títulos e números — contraste alto, números de gota, de cardápio de confeitaria francesa) e DM Serif Text (rótulos, ingredientes, anotações, assinatura, índice), as duas gratuitas no Google Fonts, num peso só (400), normal e itálico de verdade. A hierarquia vem do tamanho e do itálico, não do peso. São estreitas o bastante para o texto grande caber. O I maiúsculo tem serifa dos dois lados e o l só à esquerda, mais alto: "Iogurte", "Il1", "IPTU" não se confundem. Nada de fonte condensada. (Não é a Fraunces de outro modelo do pack: o desenho de contraste alto dá à Receita uma cara própria.)
- **Legível no celular** (julgue nos quadros reduzidos a 540 px, onde cada medida fica com a metade): nome da receita 100 px no peito e 84 px no cabeçalho; "3 passos" 60 px; número do passo 380 px; "de 3" 60 px; título do passo 96 px (mínimo 76); quantidade do ingrediente até 150 px, unidade e nome 68 px; anotações 76 px em itálico; dica 96 px (mínimo 80); fechamento 104 px (mínimo 80), apoio 80 px em itálico; assinatura 60 px; rótulos em caixa alta ("RECEITA", "INGREDIENTES", "PASSO") 56 px; índice no pé 56 px; legenda 54 px. Os tamanhos estão juntos em `TAM` (`src/tema.ts`).
- **Geometria**: margens de 96 px do quadro; a janela em `y = 168` (abaixo das abas do app); o cabeçalho (476 px de largura) ao lado dela; o corpo da ficha começa em 672 px; todo texto termina acima de 1556 px (interface do app); os desenhos podem descer até 1712 px; o índice da receita fica no pé (~1816 px), sob a interface no celular; a ficha no peito para ~10 px acima do topo da zona do motor (logo abaixo do queixo).
- **Movimento editorial, com significado**: entra decidido e assenta devagar (Bezier 0,16 · 1 · 0,3 · 1), trocas de layout com curva firme e simétrica. A palavra se escreve, o número rola como num contador, o ingrediente cai na panela, a chama tremula, a espátula gira, o pote enche. Sem quique, sem elástico, sem giro decorativo, sem flash. O que sai some antes do que entra no mesmo lugar; a panela segura a tela durante as trocas.
- **Som raro e tonal**: um "vum" grave quando a ficha sobe; uma nota curta, subindo de altura, para cada ingrediente que pousa; dois tons graves (uma quinta) quando o número do passo rola; um sopro grave quando o fogo acende; um tom que desce no "desliga"; um acorde curto e macio na fita de "salvar". Senos com envelope curto e passa-baixa, em `public/sfx/`. Nada de ruído, chiado de fritura, clique agudo ou sino.
- **Legenda**: só onde não há momento (pessoa em quadro cheio), numa etiqueta creme abaixo do queixo, com a palavra da vez grifada em pistache.

## Os blocos universais neste estilo

Os 11 blocos universais seguem a mesma ficha: lista = linhas pautadas que nascem a lápis e ganham tinta e visto pistache; passos = círculos numerados ligados por um fio; número = grande, com o copo medidor enchendo; comparação = dois cartões com × ou seta; gráfico = potes, traço a lápis ou torta; destaque, definição, frase e pergunta = a ficha do peito com a pessoa em quadro cheio; cta = a ficha desce com fita, "+", balão ou clipe. Mesmas cores, fontes e tamanhos de celular; textos são medidos e encolhem até um mínimo (44 a 60 px conforme o bloco), nunca vazam. A pessoa nunca é coberta: a janela fica no canto de cima e o texto quebra antes dela.

## O que pode mudar por vídeo

- Textos, tempos, ingredientes, ícones, ações da panela e a escolha dos componentes (é o trabalho do plano).
- `marca` (nome e área), `cozinha.recipiente` (panela ou tigela) e `cozinha.massa` (a cor do que está sendo feito: doce de leite pede `caramelo`, beijinho pede `creme`).
- O canto da janela em cada momento (`pessoa: "sup-esq"` ou `"sup-dir"`) e o enquadramento dela (`pessoa.zoom`, `pessoa.ancoraY` no nível do plano).
- O ícone do fechamento (`salvar`, `seguir`, `comentar`).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica da ficha e da janela (`src/layout.ts`): tamanhos, cantos, curvas e durações das trocas, o início da troca antes do corte. É a identidade do modelo.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `pistache` (e o `pistacheClaro`, uma versão bem clara dele) em `src/tema.ts`, por uma cor média que funcione como preenchimento sobre o creme; cacau e creme seguram a elegância.
- A fonte e os tamanhos; nada de texto abaixo de 1556 px nem acima de 168 px.
- Não adicione emojis, stickers, fotos de banco, brilho atrás da pessoa, contorno nas letras, gradientes, tremidas, flashes ou transições entre cortes além das trocas da ficha. Não troque os desenhos a traço por ícones coloridos.

## Se precisar de algo que o modelo não tem

- **Um ícone novo de ingrediente**: acrescente em `ICONES` (`src/componentes/Icones.tsx`) — viewBox 120×120, o objeto entre ~14 e ~106, `tracos` (as linhas, na ordem em que se desenham), `forma` (áreas chapadas: `corpo` e no máximo um acento `pistache`, `caramelo`, `cacau` ou `creme`), `cai` e `tinta` padrão. Mesmo traço, pontas redondas, sem detalhe miúdo. Acrescente o nome no tipo `Icone` (`src/plano.ts`).
- **Uma ação nova da panela** (ex.: "tampa", "polvilha"): acrescente o nome no tipo `Acao` (`src/plano.ts`), o estado em `estadoDaCozinha` (`src/cena.ts`), o desenho em `Bancada` (`src/componentes/Bancada.tsx`) e o ponto para onde a anotação aponta em `ancoraDaAcao`. Desenhe com o mesmo traço cacau de 5 px e cores chapadas, e faça a ação acontecer na palavra.
- **Um tipo de momento novo**: um componente que desenha em coordenadas do quadro (1080×1920) a partir de `fichaY` (ficha no peito) ou do `corpo` (ficha em cima), usando `prog`, `Escrita` e `temposDoTexto` de `src/anim.tsx` e as cores de `src/tema.ts`. Acrescente o tipo em `src/plano.ts`, diga em `modoDo` (`src/layout.ts`) se ele é "peito" ou "ficha", e o caso em `src/Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
