# O estilo Convite

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer papelaria fina de verdade, daquela que se guarda numa caixa, e não um vídeo com enfeites. Ele nasceu com um cerimonialista, mas é um **estilo**: com cripto, tecnologia, saúde ou uma história pessoal, a fala vira convite, cartões, fita, mostrador e lacre do mesmo jeito. Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

O vídeo inteiro é uma suíte de papelaria pousada numa mesa de linho: o convite, os cartões, a fita, o lacre, o mostrador. A pessoa é a foto do convite, sempre numa moldura em arco. Uma ideia grande vai embaixo do lacre, no convite grande. Uma lista, uma comparação, um gráfico ou uma sequência viram um cartão que cai na pilha, enquanto o convite encolhe para um canto. No fim, o convite volta grande por cima dos cartões abertos em leque, e o lacre estampa de novo. Elegante e calmo, nunca enfeitado.

## 1. Dinâmica do motion

- **Papel que pousa:** tudo entra decidido e assenta (curva 0,16 · 1 · 0,3 · 1), sem quique nem elástico. Os cartões entram por um lado, girados e um pouco maiores, como jogados na mesa, e assentam sobre os anteriores; os de baixo afundam 4 px.
- **Lápis e tinta:** o texto já está escrito a lápis (`#C7BDB3`) e cada palavra ganha tinta chocolate no instante em que é dita, abrindo da esquerda para a direita como a pena. Ícones e quadradinhos se desenham a traço no mesmo instante. Terminada a escrita, fica só o texto final (sem a camada da animação).
- **Objetos com significado:** o número conta até o valor dito; a fita se desenrola até o marco dito (com um vinco de luz onde sai do rolo) sobre um caminho já riscado a lápis; o mostrador gira e o número rola; o arco do mostrador encolhe na proporção (12 → 9 → 6) ou cresce (1 → 2 → 3); o sublinhado a pena corre embaixo do destaque; o risco vermelho passa sobre o trecho negado; o lacre levanta e estampa de novo nas batidas fortes.
- **Trocas:** o convite encolhe, cresce ou troca de lado em 0,6 s (mesmo tipo de estado) ou 0,78 s (estados diferentes), curva firme e simétrica, começando 0,18 s antes do corte. O texto que sai some em 0,2 s, antes de qualquer texto novo aparecer; o cartão novo desliza por baixo do convite enquanto ele encolhe; vindo da mesa, o texto do convite grande só aparece quando o convite já cobriu a pilha. Nunca um quadro com a pessoa sozinha num fundo vazio, nunca duas páginas de texto uma sobre a outra.
- **Nada parado:** cada item no seu `em`; a cada 1,5–2,5 s algo novo (uma palavra ganha tinta, um item entra, o número rola, a fita corre). No último 0,8 s um reflexo atravessa o lacre.

## 2. Organização e hierarquia

Quatro estados (`src/layout.ts`):

| Estado | Medidas | Blocos |
|---|---|---|
| **convite** | cartão 896×1424 a partir de x 92, y 96; moldura dupla a 26 px da borda; foto em arco 636×852 (ou 556×712 quando o bloco tem mais texto) com o lacre na base; o texto entre o lacre e a base do cartão | abertura, convite, numero, definicao, destaque, frase, pergunta, trechos sem momento |
| **cronograma** | convite pequeno 560×820 num lado (margem 84; foto 500×624, rosto com ~270 px); mostrador (raio 128, y 436) no centro da coluna livre; fita (58 px de largura) em y 962; cartão da pilha 820×502 de y 1018 a 1520 | marco, passos |
| **mesa** | igual ao cronograma; a fita da última sequência fica na mesa | topicos, comparacao, grafico |
| **final** | convite 824×1408 (foto 584×790) por cima da pilha aberta em leque (só as bordas dos cartões aparecem dos lados) e da fita atravessando a suíte | cta |

- **Uma coisa grande por tela:** no convite grande, o título em caligrafia, o número ou a frase; no cronograma e na mesa, o numeral do mostrador e o cabeçalho do cartão; o resto menor.
- **No cartão:** cabeçalho em caligrafia (ou letra gravada), filete com losango azul, e o conteúdo centrado no miolo (692×426). Itens com marcador (ícone a traço, losango azul ou numeral romano), cada um numa linha.
- **A pessoa troca de lado** a cada bloco do cronograma e da mesa (esquerda → direita…); o mostrador troca com ela, sumindo de um lado e voltando do outro.

## 3. Tipografia (Google Fonts)

- **Great Vibes** (caligrafia): só palavras curtas de destaque: títulos curtos (até ~24 letras), cabeçalhos dos cartões, termos, o destaque de uma frase, a chamada curta do fechamento. Nunca em item, legenda ou texto longo; nunca com algarismo ou símbolo.
- **Cinzel** (letra gravada): números, letreiros em caixa-alta espaçada (0,14–0,2 em), rótulos, a assinatura e todo texto com algarismo ou símbolo ("CTRL + SHIFT + T", "R$ 500").
- **EB Garamond** 600 e itálico 500: itens, frases, perguntas, complementos, legenda. "Iogurte Il1 IPTU" não se confundem. Nada de fonte condensada.
- **Medidas (quadro de 1080):** título em caligrafia 156 px (até 180 na chamada curta); número do "save the date" até 176 px; cabeçalho dos cartões 92 px; itens 70/64/60/54/48 px conforme a quantidade (1 a 5); número do mostrador 138 px; números da fita 40 px; frase 78/66/58 px; letreiros 34–38 px; assinatura 34 px; legenda 60 px. Todo texto é medido (`src/medida.ts`, com a fonte carregada) e encolhe até caber: **mínimo 44 px no texto** e 30 px nos letreiros; só uma lista cheia demais (5 itens com detalhe) desce mais. Nada passa de 1520 px de altura (a interface do aplicativo começa em ~1560).

## 4. Moldura da pessoa

- Sempre numa foto em arco com moldura de dois fios (12 e 22 px por fora), nunca recortada do fundo, nunca coberta, nunca distorcida. O único objeto que encosta nela é o lacre, na base da foto, sobre o peito.
- O vídeo começa em quadro cheio e se fecha na foto em arco em 0,6 s.
- A foto segue o rosto quando a pessoa se mexe (`rosto.rastro` do motor). Ajuste por plano: `pessoa.zoom` (0,86 para gravação perto da câmera; 1,15 para gravação aberta) e `pessoa.ancoraY`.
- Funciona com qualquer gravação: vertical em 9:16, horizontal em 3:4.

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
- O lado da foto em cada bloco do cronograma e da mesa (`pessoa: "esq"` ou `"dir"`) e o enquadramento (`pessoa.zoom`, `pessoa.ancoraY`).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica dos quatro estados (`src/layout.ts` e as medidas em `src/tema.ts`): tamanhos, margens, curvas e durações das trocas.
- Cores. Se o usuário pedir as cores da marca dele, troque **só** a cera (`cera`, `ceraBrilho`, `ceraSombra`: uma cor média e duas variações) e, se quiser, o linho (`linho`, `linhoClaro`, `linhoLapis`), sempre em tons suaves. Papel algodão e tinta chocolate seguram a elegância.
- As fontes e os tamanhos mínimos.
- Não adicione emojis, stickers, fotos de banco, flores desenhadas, purpurina, dourado, brilho atrás da pessoa, contorno nas letras, tremidas, flashes ou transições além das trocas do convite. Não troque os ícones a traço por ícones coloridos.

## Se precisar de algo que o modelo não tem

- **Um ícone novo:** acrescente em `CAMINHOS` (`src/componentes/Icones.tsx`): quadrado de 64, o desenho entre ~6 e ~58, só caminhos de traço, na ordem em que se desenham, sem detalhe miúdo. Acrescente o nome no tipo `Icone` (`src/plano.ts`) e na tabela de `references/plano.md`.
- **Mais marcos do que cabem na fita:** acima de ~6, divida a fala em duas sequências com um bloco do convite grande no meio (cada sequência tem a sua fita).
- **Um tipo de momento novo:** um componente que desenha na área de texto do convite (`src/componentes/NoConvite.tsx`) ou no miolo de um cartão (`src/componentes/Cartoes.tsx`), usando `TextoEscrito` (`src/componentes/Texto.tsx`), `encaixar` (`src/medida.ts`), `prog` e `Traco` (`src/anim.tsx`) e as cores de `src/tema.ts`. Acrescente o tipo em `src/plano.ts`, diga em `modoDo` (`src/layout.ts`) em que estado ele vive e o caso em `Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
