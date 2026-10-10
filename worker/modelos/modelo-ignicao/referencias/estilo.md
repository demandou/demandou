# O estilo Ignição

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer o painel de instrumentos de um carro bom, à noite (sóbrio, preciso, com a luz que acende na hora certa), e não um vídeo com enfeites automotivos. Quase toda "melhoria" que adiciona coisa piora o resultado. O assunto do vídeo pode ser qualquer um: o painel é a linguagem.

## A ideia

No carro, o painel fala com o motorista: na partida os ponteiros varrem e todas as luzes acendem um instante; rodando, uma luz que acende é um aviso; o computador de bordo mostra números, listas e históricos; o navegador diz para onde ir. O modelo faz a fala da pessoa comandar o painel. A chave gira na primeira palavra; cada luz, item, número ou lado acende quando é dito; o carro encosta quando a ideia é "parar", o motor desliga quando é "cortar", a rota acende quando há um destino. A pessoa muda de lugar com o modo do painel, como num painel digital que troca de tela: na tela central, no retrovisor de dentro (de onde o motorista se vê) ou no retrovisor da direita (onde quem vai encostar olha).

## 1. Dinâmica do motion

- **Modos, não cenas.** Cada momento é um modo do painel e todas as peças deslizam juntas para o novo lugar (0,56 s, macio nas duas pontas): os mostradores crescem ou encolhem para os cantos, a tela central cresce ou vira a barra de mensagens, a fileira de luzes muda de lugar e de tamanho, a pessoa muda de moldura. O corte da fala cai no meio do movimento. A fileira de luzes que atravessa a tela inteira apaga no meio do caminho.
- **Nada aparece do nada, nada se sobrepõe.** O conteúdo de dentro da tela central é recortado pelo vidro e surge junto com a tela que cresce. O que sai some (0,2 s) antes de o próximo entrar já em esboço: nunca dois textos ao mesmo tempo. O que fica fora da tela (contadores, painel da condição ou do termo) só entra quando as peças já pararam.
- **Texto que acende**: todo texto nasce apagado (a 20%, o letreiro atrás do vidro fumê) e cada palavra acende quando é dita, com um assentamento curto; terminada a entrada, a palavra é desenhada simples (sem deslocamento). As luzes apagadas, as caixas e os botões também ficam lá como esboço: nada de caixa vazia esperando a fala.
- **Movimento com significado**: os ponteiros contam a história (varrem na partida, rodam a ~60, aceleram num número, caem a zero ao encostar, o giro cai e o painel escurece ao desligar; na comparação, cada ponteiro é um lado); a gota pinga do bico da almotolia; a coluna do termômetro sobe; a bateria descarrega; o carro desce a estrada dos passos e para em cada etapa; o cursor do menu desliza até o item da vez; a rota acende e as ruas passam por baixo do carro; a curva da tendência se desenha. Entra decidido e assenta: sem quique, sem elástico, sem giro de enfeite, sem tremida (rodando, os ponteiros só "respiram" de leve).
- **Nada parado mais de ~2,5 s**: dentro de cada momento algo acende ou anda no ritmo da fala.

## 2. Organização e hierarquia

- **Uma ideia por tela.** A tela central é o lugar da informação; um item grande por vez: a luz da vez (desenho grande + nome + frase), o item com o cursor do menu, a parada onde o carro está, o lado que acabou de ser dito. Os itens anteriores baixam um pouco a luz; os seguintes ficam apagados.
- **Rótulos pequenos em cima, conteúdo grande embaixo**: "1 DE 3", "TERMO", "SIGNIFICA", "ALERTA", "O QUE FAZER" em caixa-alta espaçada, cor de aço.
- **Contadores entre os mostradores**: o número que rola ("2 / 3") com o nome da lista; é o placar do momento.
- **A fileira de luzes-espia** fica sempre no painel (até 4 luzes do plano) e acende junto com a tela: a luz da vez acende nos dois lugares.

## 3. Tipografia

- **Uma família só: Tomorrow** (Google Fonts), a letra de painel: desenho técnico, cantos retos e curvas abertas, sem ser condensada. Pesos 500, 600 e 700; todo texto do painel em caixa-alta, rótulos em caixa-alta espaçada (0,14 em). O I maiúsculo tem serifa ("Iogurte", "IPTU", "Il1" não confundem) e os acentos do português ficam inteiros.
- **Legível no celular** (julgue nos quadros reduzidos a 540 px): título da abertura 60–96 px (linhas menores 32–44); nome da luz 64–92; frase da luz e detalhes 44–52; itens de lista e de passos 44–64; termo 48–84 e significado 44–84; frase e pergunta na barra 44–68; visor do número até 150; condição da parada 44–64; instrução do navegador 44–56; chamada 44–64; contador 62–104; números dos mostradores ≥ 32; rótulos ≥ 30; legenda 44–54.
- **Medido de verdade**: as larguras vêm da própria fonte (`src/medidas.ts`); o template escolhe o corpo e quebra as linhas antes de desenhar, e diminui até um mínimo legível. Nunca corta nem vaza.

## 4. A moldura da pessoa

- **Três molduras** (nenhuma recorta a pessoa do fundo nem distorce o vídeo): tela central (860×744, aro fino), retrovisor de dentro (760×556 no alto, aro preto grosso e a haste até o teto) e retrovisor da direita (444×556, a carcaça do espelho e o braço que prende na porta). Nunca uma coluna estreita ao lado.
- **Cabeça inteira** sempre que a gravação permite: as molduras foram desenhadas para um rosto com ~36% da largura do quadro (respiro de 30 px ou mais acima do cabelo). Gravação mais perto da câmera aproxima menos (até o mínimo que cobre a moldura) e sobe o rosto para o queixo caber; o teste de lâmpadas vai para baixo da moldura.
- **O rosto é seguido** quadro a quadro dentro da moldura (o rastreio do motor). Corte no meio de um modo ganha uma troca seca de enquadramento (5%) para disfarçar o pulo.
- **Quando a pessoa muda de lugar**: em toda troca de modo. Tela central = abertura, frase, pergunta simples, fechamento e trechos sem momento; retrovisor de dentro = as telas grandes; retrovisor da direita = parada e definição.

## 5. Cores, textura e som

- **Poucas cores, cada uma com a função que tem num painel de verdade**: carcaça preta fosca (#0B0C0E) com textura de plástico quase invisível, vidro mais escuro (#07080A), metal (#2B2E33 → #5A6067); **marfim (#F1EDE4) = a luz de fundo** (ponteiros, números, texto, colunas, rotas); aço (#9AA0A7) nos rótulos; **vermelho (#FF3B2F) só nas luzes de alerta** (e no traço delas); âmbar (#FFB020) só nas luzes de atenção; **verde (#2FD46E) só na seta de direção** do fechamento. Gráficos usam só tons de marfim.
- Nada de vermelho em texto, faixa de rotação ou fundo; nada de azul, degradê colorido, brilho atrás da pessoa ou contorno nas letras. O único "brilho" é o halo curto da própria lâmpada acesa.
- **Som raro, tonal e grave**: a partida, uma nota por item que acende (subindo de altura), o alerta duplo grave, a descida do motor desligando (também no trecho riscado), duas notas da rota e o "toc" surdo da seta. Nada de sino, bipe agudo, ruído de motor gravado, buzina ou clique.

## Medidas (px, quadro 1080×1920)

- Nada acima de 170 px (abas do app) além da haste do retrovisor; nada de texto abaixo de 1560 px (legenda do post e botões): ali fica só o volante.
- Margens laterais de 60 px. Tela central nos modos grandes: 960×480 a partir de (60, 792); barra de mensagens: 960×166 a partir de (60, 966).

## O que pode mudar por vídeo

- Textos, tempos, luzes e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área no perfil do motorista).
- A cor de uma luz (`cor` nos itens de `luzes`): vermelho para problema, âmbar para atenção, marfim para neutro.
- O símbolo do pino da rota (`pino`).
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; gravação horizontal vira 3:4.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica dos modos (`src/layout.ts`): o lugar e o tamanho das molduras, dos mostradores, da tela central e da fileira de luzes em cada modo, a duração e a curva da troca. É a identidade do modelo.
- A história dos ponteiros (`motorDo` em `src/layout.ts`).
- Cores: a carcaça, o marfim e o metal seguram o visual; o vermelho é só de alerta. Não pinte texto, contadores ou setas de vermelho para "chamar atenção".
- A fonte e os tamanhos; as margens de 60 px.
- Não adicione emojis, logotipos de montadora, desenhos de carros de verdade, fotos de painel, brilho atrás da pessoa, contorno nas letras, faixas de "neon", flashes, "zoom de impacto" ou transições entre cortes além da troca de modo.

## Se precisar de algo que o modelo não tem

- **Outra luz-espia** (ABS, airbag, farol alto, ou um símbolo geral novo): acrescente o nome em `Icone` (`src/plano.ts`) e o desenho em `DESENHOS` (`src/componentes/Icones.tsx`), a traço num quadro de 120×120, linha de 7,2 (na fileira). Copie o padrão das existentes: forma reconhecível em 60 px, nada de texto dentro além de "!" ou "i". A cor padrão vai em `corPadrao`. Consulte a skill do Remotion para as regras de animação.
- **Outra ação na pista** (pisca-alerta, triângulo atrás do carro): acrescente o valor em `Passo.acao` e o desenho em `TelaParada.tsx`, com a mesma linguagem (traço marfim, carro visto de cima).
- **Outro modo**: acrescente o modo em `Modo` e a geometria em `geometriaDe` (`src/layout.ts`), escolha a moldura da pessoa entre as três existentes e crie o conteúdo como os `Tela*.tsx`, com a parte de dentro da tela central e a de fora separadas (`parte`), texto que acende com `Acende` e corpo escolhido com `diagramar`.
