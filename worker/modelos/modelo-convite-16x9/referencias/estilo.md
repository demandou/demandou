# O estilo Convite (versão deitada, 16:9)

Esta é a versão deitada (1920×1080), para o vídeo completo do YouTube. O estilo é o mesmo do vertical; o que muda é a composição, pela aula 9 do curso (editar uma aula horizontal): a pessoa em tela cheia é a base, e nos blocos ela vai para a foto em arco do lado direito (a moldura) enquanto o bloco ocupa o lado esquerdo (o quadro).

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer papelaria fina de verdade, daquela que se guarda numa caixa, e não um vídeo com enfeites. Ele nasceu com um cerimonialista, mas é um **estilo**: com cripto, tecnologia, saúde ou uma história pessoal, a fala vira convite, cartões, fita, mostrador e lacre do mesmo jeito. Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

O vídeo é uma aula com uma suíte de papelaria pousada numa mesa de linho: o convite, os cartões, a fita, o lacre, o mostrador. Nos trechos sem bloco, a pessoa fala em tela cheia, com a legenda num cartão de papel. Quando a ideia pede apoio visual, o vídeo se fecha na foto em arco do convite, do lado direito. Uma ideia grande vai à esquerda da foto, no convite grande. Uma lista, uma comparação, um gráfico ou uma sequência viram um cartão que cai na pilha, enquanto o convite encolhe para a direita. No fim, o convite volta grande por cima dos cartões abertos em leque, e o lacre estampa de novo. Elegante e calmo, nunca enfeitado.

## 1. Dinâmica do motion

- **Papel que pousa:** tudo entra decidido e assenta (curva 0,16 · 1 · 0,3 · 1), sem quique nem elástico. Os cartões entram por um lado, girados e um pouco maiores, como jogados na mesa, e assentam sobre os anteriores; os de baixo afundam 4 px.
- **Lápis e tinta:** o texto já está escrito a lápis (`#C7BDB3`) e cada palavra ganha tinta chocolate no instante em que é dita, abrindo da esquerda para a direita como a pena. Ícones e quadradinhos se desenham a traço no mesmo instante. Terminada a escrita, fica só o texto final (sem a camada da animação).
- **Objetos com significado:** o número conta até o valor dito; a fita se desenrola até o marco dito (com um vinco de luz onde sai do rolo) sobre um caminho já riscado a lápis; o mostrador gira e o número rola; o arco do mostrador encolhe na proporção (12 → 9 → 6) ou cresce (1 → 2 → 3); o sublinhado a pena corre embaixo do destaque; o risco vermelho passa sobre o trecho negado; o lacre levanta e estampa de novo nas batidas fortes.
- **Trocas:** o convite encolhe ou cresce em 0,6 s (mesmo tipo de estado) ou 0,78 s (estados diferentes, e toda vez que o vídeo abre para a tela cheia ou fecha na foto), curva firme e simétrica, começando 0,18 s antes do corte. Vindo da tela cheia, o texto do bloco só aparece quando o vídeo já fechou na foto (nunca texto por cima do vídeo); indo para ela, a legenda só aparece quando o vídeo terminou de abrir. O texto que sai some em 0,2 s, antes de qualquer texto novo aparecer; o cartão novo desliza por baixo do convite enquanto ele encolhe; vindo da mesa, o texto do convite grande só aparece quando o convite já cobriu a pilha. Nunca um quadro com a pessoa sozinha num fundo vazio, nunca duas páginas de texto uma sobre a outra.
- **Nada parado:** cada item no seu `em`; a cada 1,5–2,5 s algo novo (uma palavra ganha tinta, um item entra, o número rola, a fita corre). No último 0,8 s um reflexo atravessa o lacre.

## 2. Organização e hierarquia

A tela cheia e quatro estados de papel (`src/layout.ts`, medidas em `src/tema.ts`, quadro de 1920×1080):

| Estado | Medidas | Blocos |
|---|---|---|
| **tela cheia** | o vídeo deitado inteiro, como foi gravado; a legenda num cartão de papel algodão centrado, de até 1240 px de texto e 2 linhas, terminando em y 958 | trechos sem momento (buraco de 2 s ou mais entre dois blocos) |
| **convite** | cartão deitado 1728×968 a partir de x 96, y 56; moldura dupla a 26 px da borda; foto em arco 538×720 à direita (x 1190, y 146; ou 488×654 quando o bloco tem mais texto) com o lacre na base; o texto no quadro da esquerda, da moldura do cartão até a foto (~940 px de largura, de y 166 a 928) | abertura, convite, numero, definicao, destaque, frase, pergunta |
| **cronograma** | convite pequeno 528×780 à direita (x 1296, y 150; foto 472×590, rosto com ~255 px); fita (58 px de largura) em y 214, de x 34 até a borda do convite, com as marcas de x 210 a 1130; mostrador (raio 116) em x 214, y 584; cartão da pilha 820×502 de x 410 a 1230, y 374 a 876 | marco, passos |
| **mesa** | igual ao cronograma; a fita da última sequência fica na mesa | topicos, comparacao, grafico |
| **final** | convite 1584×936 (x 168, y 72; foto 500×668 à direita) por cima da pilha aberta em leque (só as bordas dos cartões aparecem dos lados) e da fita atravessando a suíte | cta |

- **Uma coisa grande por tela:** no convite grande, o título em caligrafia, o número ou a frase; no cronograma e na mesa, o numeral do mostrador e o cabeçalho do cartão; o resto menor.
- **No cartão:** cabeçalho em caligrafia (ou letra gravada), filete com losango azul, e o conteúdo centrado no miolo (692×426). Itens com marcador (ícone a traço, losango azul ou numeral romano), cada um numa linha.
- **A pessoa fica sempre à direita** no quadro deitado (a moldura da aula 9); entre dois blocos da pilha o convite pequeno não se mexe e o mostrador some e volta no mesmo lugar quando o conteúdo muda.

## 3. Tipografia (Google Fonts)

- **Great Vibes** (caligrafia): só palavras curtas de destaque: títulos curtos (até ~24 letras), cabeçalhos dos cartões, termos, o destaque de uma frase, a chamada curta do fechamento. Nunca em item, legenda ou texto longo; nunca com algarismo ou símbolo.
- **Cinzel** (letra gravada): números, letreiros em caixa-alta espaçada (0,14–0,2 em), rótulos, a assinatura e todo texto com algarismo ou símbolo ("CTRL + SHIFT + T", "R$ 500").
- **EB Garamond** 600 e itálico 500: itens, frases, perguntas, complementos, legenda. "Iogurte Il1 IPTU" não se confundem. Nada de fonte condensada.
- **Medidas (quadro de 1920×1080):** título em caligrafia 156 px (até 180 na chamada curta); número do "save the date" até 176 px; cabeçalho dos cartões 92 px; itens 70/64/60/54/48 px conforme a quantidade (1 a 5); número do mostrador 138 px; números da fita 40 px; frase 78/66/58 px; letreiros 34–38 px; assinatura 34 px; legenda 54 px. Todo texto é medido (`src/medida.ts`, com a fonte carregada) e encolhe até caber: **mínimo 44 px no texto** e 30 px nos letreiros; só uma lista cheia demais (5 itens com detalhe) desce mais. Nada de texto abaixo de y 958, nem fora das margens de 96 px dos lados (os controles do player começam em ~984).

## 4. Moldura da pessoa

- Dois lugares: a **tela cheia** (o vídeo deitado inteiro, como foi gravado, nos trechos sem momento) e a **foto em arco** do lado direito, com moldura de dois fios (12 e 22 px por fora), nunca recortada do fundo, nunca coberta, nunca distorcida. O único objeto que encosta nela é o lacre, na base da foto, sobre o peito.
- O vídeo se fecha na foto em arco (e abre de volta até a tela inteira) em 0,78 s; começando o vídeo num bloco, ele começa em tela cheia e se fecha em 0,6 s, como no vertical. O lacre e a moldura da foto somem quando o vídeo abre e voltam quando ele fecha.
- Na foto o rosto tem a presença do vertical (~54% da largura da foto pequena, ~43% da grande), medido pela largura do rosto no rastro do `cortar.mjs`, sem passar de 1,5× o tamanho gravado. A foto segue o rosto quando a pessoa se mexe (`rosto.rastro` do motor), com o rosto centralizado. Ajuste por plano: `pessoa.zoom` (0,86 afasta; 1,15 aproxima) e `pessoa.ancoraY`.
- Funciona com gravação deitada (entra inteira, 1920×1080). Gravação vertical vira uma faixa deitada em volta do rosto.

## 5. Cores, textura e som

- **Linho azul-pó** `#BCC9D5`: a mesa, com trama fina e uma luz suave do alto à esquerda. Risco a lápis no linho `#6E8094`.
- **Papel algodão** `#FBF8F3` (e `#F6F0E7`, `#F1F3F4` para os cartões da pilha não ficarem idênticos), com grão leve.
- **Tinta chocolate** `#3A2A22` em todo texto e traço; `#76675D` nos letreiros, rótulos e na assinatura.
- **Fita de cetim chocolate** `#5B3B2F`, com um brilho comprido e faixas de luz: cetim, nunca couro. As barras do gráfico são pedaços dessa fita.
- **Cera azul** `#40618A`: o lacre, o arco do mostrador, os losangos, os numerais dos passos, o destaque do fechamento. É o único acento.
- **Tinta vermelha apagada** `#9A3B32`: só `destaque` de alerta, `risco` e o lado errado da comparação.
- Nada de dourado, gradiente decorativo, brilho atrás da pessoa, contorno em letra, emoji ou sticker.
- **Som raro e tonal** (`public/sfx/`, senos com envelope curto e passa-baixa): o baque grave da cera quando o lacre estampa; um sopro grave quando uma fita entra; uma nota curta, subindo a cada cartão que pousa; um acorde macio na re-estampa do fechamento. Nunca dois sons a menos de 0,4 s. Nada de ruído, papel amassado, clique agudo ou sino.

## O que pode mudar por vídeo

- Textos, tempos, números, itens, ícones e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área) e `monograma` (a letra do lacre).
- O enquadramento na foto (`pessoa.zoom`, `pessoa.ancoraY`). O lado da foto não muda no quadro deitado (sempre à direita); `pessoa: "esq"` ou `"dir"` nos blocos fica só para o plano valer nas duas versões.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica da tela cheia e dos quatro estados (`src/layout.ts` e as medidas em `src/tema.ts`): tamanhos, margens, curvas e durações das trocas, a foto à direita e o quadro à esquerda.
- Cores. Se o usuário pedir as cores da marca dele, troque **só** a cera (`cera`, `ceraBrilho`, `ceraSombra`: uma cor média e duas variações) e, se quiser, o linho (`linho`, `linhoClaro`, `linhoLapis`), sempre em tons suaves. Papel algodão e tinta chocolate seguram a elegância.
- As fontes e os tamanhos mínimos.
- Não adicione emojis, stickers, fotos de banco, flores desenhadas, purpurina, dourado, brilho atrás da pessoa, contorno nas letras, tremidas, flashes ou transições além das trocas do convite. Não troque os ícones a traço por ícones coloridos.

## Se precisar de algo que o modelo não tem

- **Um ícone novo:** acrescente em `CAMINHOS` (`src/componentes/Icones.tsx`): quadrado de 64, o desenho entre ~6 e ~58, só caminhos de traço, na ordem em que se desenham, sem detalhe miúdo. Acrescente o nome no tipo `Icone` (`src/plano.ts`) e na tabela de `references/plano.md`.
- **Mais marcos do que cabem na fita:** acima de ~6, divida a fala em duas sequências com um bloco do convite grande no meio (cada sequência tem a sua fita).
- **Um tipo de momento novo:** um componente que desenha na área de texto do convite (`src/componentes/NoConvite.tsx`) ou no miolo de um cartão (`src/componentes/Cartoes.tsx`), usando `TextoEscrito` (`src/componentes/Texto.tsx`), `encaixar` (`src/medida.ts`), `prog` e `Traco` (`src/anim.tsx`) e as cores de `src/tema.ts`. Acrescente o tipo em `src/plano.ts`, diga em `modoDo` (`src/layout.ts`) em que estado ele vive e o caso em `Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
