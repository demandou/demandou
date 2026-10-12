# O estilo Janelas

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um computador bem desenhado (calmo, preciso, crível), e não um vídeo com enfeites de "tecnologia". Quase toda "melhoria" que adiciona coisa (brilho, neon, gradiente, glitch, código verde caindo) piora o resultado. E o estilo vale para qualquer assunto: cripto, casamento, saúde, vendas viram janelas deste mesmo desktop.

## A ideia

Quem explica alguma coisa no computador mostra a tela. Aqui a tela inteira vira uma área de trabalho e a pessoa entra nela como a janela de uma videochamada: o mouse a arrasta para o alto quando uma janela precisa de espaço, minimiza numa miniatura quando a janela precisa da tela, traz de volta pelo dock, maximiza quando a frase é forte. Cada ideia abre a janela que a mostra, como num tutorial gravado, e as teclas grandes afundam no instante em que são ditas. O espectador vê a ideia acontecer, não lê sobre ela.

## 1. Dinâmica do motion

- **Movimento de sistema operacional.** Janelas crescem a partir do ícone no dock (escala de 0,16 a 1, opacas logo no começo, 0,42 s, arranque rápido e assentamento macio, sem quique) e voltam para ele. Cartões do sistema (busca, notificação, caixa de diálogo, cartão de compartilhar) sobem ou descem 30 px e assentam.
- **Texto na fala.** A busca e as notas são **digitadas** letra a letra com cursor violeta; títulos, itens e frases **sobem de trás de uma régua**, cada palavra no seu instante. Terminada a animação, a palavra é desenhada simples (sem máscara).
- **O mouse faz os gestos**: arrasta a janela da pessoa pela barra de título, clica em "–", no ícone do dock, no "+" das abas, no × da aba, no item da vez, no botão do fechamento, na janela que ganha a comparação; passa por cima do termo do dicionário; seleciona as palavras que vão ser riscadas; vira mira no recorte. Anel violeta a cada clique. Os caminhos contornam a cabeça; em tela cheia ele some.
- **As teclas** esperam a lápis (contorno tracejado, nome apagado), ganham corpo, afundam (a base some) e acendem em violeta enquanto a combinação é "segurada"; sobem juntas no fim.
- **Dentro de cada bloco algo muda a cada ~1,5–2,5 s**: item que entra, número que conta, fio que enche, curva que se desenha, balão que abre, foco que passa de um botão para outro.
- **Trocas sem quadro vazio e sem dupla exposição.** A janela do bloco novo abre já no `de`, opaca, por cima da que sai, enquanto a pessoa muda de lugar (0,5–0,62 s); a que sai fecha por trás. Quando o que entra fica direto no desktop (teclas) ou é um cartão, a janela velha fecha antes. Cartões no peito só entram quando a pessoa já cobre a tela e saem antes de ela encolher.
- **Movimento com significado**: sem quique, sem elástico, sem giro, sem brilho, sem tremida, sem flash.

## 2. Organização e hierarquia

- **Uma janela por ideia**, grande (92% da largura, 1000 px), sempre numa área livre: embaixo da pessoa (quando ela está no alto ou no centro), em cima (quando ela está minimizada) ou no peito (tela cheia). Nada passa por cima do rosto.
- **Dentro da janela**: barra de título pequena (o "app": Notas, Passo a passo, Painel, Gráfico, Dicionário), a frase dita grande no alto do corpo, os itens em linhas com um ícone num ladrilho, **o item da vez selecionado em violeta**. Uma ideia grande por vez; rótulos e detalhes menores.
- **Espera a lápis em tudo**: vagas tracejadas para os itens e etapas, teclas tracejadas, balão tracejado, botões tracejados, barra de progresso vazia. Nada surge do vazio e nenhuma caixa fica vazia.
- **Zonas reservadas**: acima de 176 px só o menu (decoração); o dock fica entre 1452 e 1552 px; abaixo de 1560 px, a interface do app; nenhum conteúdo ali.

## 3. Tipografia

- **Atkinson Hyperlegible Next** (interface; desenhada para leitura difícil: o "I" maiúsculo tem serifa e o "l" tem cauda, então "IPTU", "Inglês" e "Il1" nunca se confundem), de 500 a 800.
- **JetBrains Mono** para teclas, números que contam, valores, endereços e coordenadas.
- Tamanhos (quadro de 1080 de largura; julgue nos quadros reduzidos a 540 px): busca 66–74 px; termo do dicionário até 124 px; número do painel até 180 px; frase da nota 44–72 px; itens 44–60 px; destaque 56–92 px; título do fechamento até 80 px; detalhes 36–46 px; barras de título 30–38 px; rótulos em caixa alta espaçada 30–36 px; nomes das teclas ≥ 30 px. Nada abaixo de 30 px.
- Todo texto é medido pela largura real da fonte (`src/medida.ts` + `src/larguras.ts`) e reduzido até um mínimo legível, em até 2 ou 3 linhas; nunca vaza nem corta. Espaçamento entre letras nunca negativo além de −0,02em.

## 4. Moldura da pessoa

- **A janela da chamada**, sempre por cima das outras: barra de título com câmera violeta, nome e área; etiqueta com o nome e barrinhas de voz violeta que mexem quando ela fala; sombra macia. Em tela cheia não tem moldura (rosto na linha do centro) e a legenda é a legenda "ao vivo" da chamada. Minimizada, vira uma miniatura com o botão de restaurar.
- **Cinco lugares** (`src/geometria.ts`): `cheia`, `topo` (larga no alto), `alto` (grande no alto), `centro`, `mini` (canto de baixo à esquerda). Cada bloco tem o seu (references/plano.md, seção 3).
- **Cabeça inteira com qualquer gravação.** A janela segue o rosto (rastro do motor). Com gravação muito perto da câmera (rosto largo), a janela da pessoa perde o zoom e estreita sozinha (até 3:4) para mostrar da testa ao queixo; os cartões no peito descem até abaixo do queixo (`zona`).
- Nunca recortada do fundo e nunca numa coluna vertical estreita ao lado: funciona com qualquer gravação.

## 5. Cores, textura e som

- Papel de parede lavanda-ardósia `#A39DBD`, com dunas `#B3AECB`, `#958FB1` e `#8A84A7` que derivam devagar (escuro o bastante para as janelas brancas destacarem).
- Janelas brancas com barra `#F3F2F7` e sombra macia; painel `#F7F6FA`; texto e teclas grafite `#17141F`/`#23202C`; texto de apoio `#5F5A72`; esboço `#B8B3C8`/`#E4E1EC`.
- **Violeta elétrico `#5B3DF5` = o acento**: tecla apertada, item da vez, etapa da vez, clique, destaque no texto, curva da tendência, botão clicado, barra de progresso. Violeta-claro `#ECE8FE`/`#DCD5FD` só como fundo de seleção.
- O alerta não ganha cor nova: é a notificação **escura** (grafite) com o triângulo violeta.
- **Som raro e tonal**: um "toc" grave por tecla e por item (a nota sobe), duas notas quando algo dá resultado (aba que volta, número que termina, veredito, balão), duas descendo no alerta, uma ao salvar e três ao enviar. Nada de clique agudo, ruído ou sino.

## O que pode mudar por vídeo

- Textos, tempos, teclas, itens, abas, a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área), os rótulos, o chip, o resultado da busca, o destinatário do fechamento.
- O lugar da pessoa num momento (`pessoa`), com moderação: os padrões foram pensados para nada cobrir o rosto.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica do desktop (`src/cena.ts`, `src/geometria.ts`, `src/blocos.ts`): lugares da janela, gestos e caminhos do mouse, tempos das trocas, a regra de nunca cobrir o rosto.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `violeta` (e os fundos claros derivados, `violetaFundo` e `violetaFundo2`, e o `teclaApertadaLado`, uma versão mais escura) em `src/tema.ts`, por uma cor viva o bastante para ler texto branco em cima. O papel de parede e o grafite seguram a elegância.
- As fontes e os tamanhos; as margens de 40 px das janelas.
- Não adicione emojis, logotipos (de sistema, de app, de rede social), brilho atrás da pessoa, contorno nas letras, gradientes, telas de código ou "hacker", transições além das janelas e do mouse. Não troque os ícones a traço por ícones coloridos ou de banco.

## Se precisar de algo que o modelo não tem

- **Um ícone novo**: acrescente em `DESENHOS` (`src/componentes/Icones.tsx`): viewBox 48×48, traço único (`tracos`, na ordem em que se desenham), pontas redondas, o objeto ocupando de ~6 a ~42; áreas cheias só em `cheios`. Genérico: nada que lembre o logotipo de um produto.
- **Uma janela nova** (calendário, terminal, editor…): use a moldura `Janela` (`src/componentes/Janela.tsx`), a área livre do lugar da pessoa (`areaDoMomento` em `src/geometria.ts`), abra e feche com `janelaAberta(t, m.de, fim)`, meça o texto com `encaixar` e desenhe-o com `TextoFalado` (`src/texto.tsx`), e faça o conteúdo esperar a lápis. Acrescente o tipo em `src/plano.ts`, o lugar padrão em `LUGAR_PADRAO`, o ícone do dock e o nome do app em `iconeDoTipo`/`APP_DO_TIPO` e `TIPOS_DE_JANELA` (`src/geometria.ts`), os gestos do mouse em `roteiroDoMouse` (`src/cena.ts`) e o caso em `src/Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
