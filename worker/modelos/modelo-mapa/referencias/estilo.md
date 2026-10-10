# O estilo Mapa

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um caderno bem diagramado que ganha vida — um mapa do raciocínio que cresce enquanto a pessoa explica — e não um vídeo com enfeites. Quase toda "melhoria" que adiciona coisa piora o resultado. O estilo vale para qualquer assunto: estudos, cripto, música, saúde, vendas, uma história pessoal.

## A ideia

Quem explica bem desenha o raciocínio enquanto fala: escreve a palavra-chave, puxa um ramo, numera os passos, circula o número, risca o que não serve, grifa o que importa. O modelo repete esse gesto. A pessoa é um **cartão no mapa**, ligado ao conteúdo por um ramo de tinta; cada ideia é uma **estação** do papel; entre uma ideia e outra a câmera **desliza** pelo papel seguindo o raciocínio, e o cartão da pessoa muda de lugar e de tamanho no mesmo movimento. Tudo o que vai ser dito já está no papel **a lápis**; a tinta passa por cima no instante da fala, e o **marca-texto** chega logo depois no que importa.

## 1. Dinâmica do motion

- **Escrita, não animação de texto.** Toda palavra nasce como esboço a lápis; no instante em que é dita, a tinta passa por cima da esquerda para a direita (0,3 s) e a palavra assenta 6% para cima. Terminada a escrita, a palavra é desenhada uma vez só (sem a camada de esboço nem a máscara). O marca-texto varre por trás da palavra 0,12 s depois, levemente inclinado, e emenda com a próxima palavra marcada. O riscado é um traço de tinta reto. Espaço entre palavras é margem fixa (0,26 do corpo).
- **Desenhos que se completam na fala.** Ramos se desenham do nó para fora; o caminho dos passos é riscado pela caneta até o passo dito; o número conta e, quando para, a caneta o circula; a linha do gráfico é ligada ponto a ponto; as fatias da pizza se abrem; o alfinete crava o cartão de anotação, que chega torto e assenta; o flashcard vira; a caixinha da opção da vez se enche de marca-texto.
- **A câmera passeia.** Cada momento é uma estação; a troca é um deslize de 0,64 s (direita → baixo → esquerda → baixo…), macio nas duas pontas, com um recuo de 5% no meio. As estações ficam encostadas: no meio do deslize sempre aparecem duas, cada uma com conteúdo, cada uma no seu lugar do papel (nunca uma sobre a outra). É a única transição do modelo — nada de corte seco entre estações, zoom de impacto, giro ou flash.
- **Movimento editorial**: entra decidido e assenta (curva `0.16, 1, 0.3, 1`); a câmera e o cartão deslizam macios nas duas pontas; nada de quique, elástico, tremida ou giro de enfeite. O único giro é o do flashcard virando, que é o que um flashcard faz.
- **Nada parado mais de ~2,5 s**: dentro de uma estação, sempre há um item, um ramo, uma palavra ou um número entrando.

## 2. Organização e hierarquia

- **Uma ideia por estação**, lida como um mapa: um nó principal e o que sai dele por ramos.
  - Nós principais: o nó central do mapa (cheio de tinta), o termo da definição, o "?" circulado, o número circulado, as aspas, o tronco da lista, o primeiro disco dos passos.
  - O ramo da pessoa sempre chega no nó principal: é o que faz a pessoa ser parte do mapa.
- **Hierarquia por tamanho e peso**, nunca por cor: o título da estação é grande em Bitter; nós, rótulos e detalhes são menores em Readex; o secundário fica a lápis.
- **O papel tem lugares fixos** por estação (tabela em `references/plano.md`): o cartão num canto, o título ao lado dele, o conteúdo no corpo. Nada encosta no cartão da pessoa; nada cobre o rosto (só a etiqueta de nome, no fechamento, encosta na base do cartão).
- **Área útil**: conteúdo entre y 150 (abaixo das abas do app) e y 1520 (acima da legenda do post); na metade de baixo, nada à direita de x 960 (botões do app). Margem de 60 px à esquerda.
- **Honestidade nos desenhos.** A curva é sempre "ilustrativa": sem porcentagens no eixo, só a forma. Gráfico sem números ditos mostra só a tendência, com o selo "ilustrativo". Barras de proporção não levam números. Número na tela é o número dito.

## 3. Tipografia

- **Duas famílias gratuitas, nada condensado.** **Bitter** (serifa egípcia de apostila, 700–800) nos títulos, frases faladas, números grandes, respostas, termos e no nome; **Readex Pro** (sans de leitura, 500–700) nos nós, rótulos, opções, perguntas dos flashcards, legenda e letreiros. As duas têm o **I maiúsculo serifado** ("Iogurte", "IPTU" e "Il1" nunca confundem I com l).
- Letreiros em caixa-alta espaçada (0,14 em) a 32 px.
- **Legível no celular** (julgue nos quadros reduzidos a 540 px): títulos e frases 64–170 px, nós 34–72 px, rótulos e legendas de gráfico ≥ 34 px, letreiros 32 px, números grandes 110–280 px, legenda 50 px.
- **O texto sempre cabe.** As medidas vêm da própria fonte (`src/medidas.ts`): o template escolhe o corpo, quebra as linhas equilibradas e reduz até o mínimo legível antes de desenhar. Nós longos quebram em duas linhas (cartão de cantos redondos).

## 4. Moldura da pessoa

- **A pessoa é um cartão.** Vídeo com cantos de 28–34 px, borda branca de 10 px, fio de 2 px e uma sombra curta e escura embaixo (nunca brilho, nunca halo colorido).
- **Abre em quadro cheio**, com o rosto na linha do centro, e recua para o cartão da primeira estação no primeiro instante.
- **Um lugar por estação**: grande em cima (abertura, mapa que abre o vídeo, fechamento), pequeno num canto de cima (tópicos, passos, número, comparação, gráfico, definição, pergunta, curva, contador, flashcards e o mapa do meio do vídeo), médio em cima à direita (frase, título), médio no alto, no centro (destaque), pequeno embaixo à esquerda (barras). Quase todos os lugares ficam na faixa de cima: na troca de estação o cartão anda pouco e não atravessa o texto. Nunca numa coluna vertical estreita colada na borda.
- **Segue o rosto** quadro a quadro (o motor faz). Gravação perto da câmera (selfie): o zoom de cada cartão desce sozinho (até o mínimo que cobre o cartão) para a cabeça caber; `retrato` no plano ajusta à mão.
- O vídeo da pessoa fica montado o tempo todo (é ele que carrega a voz); só existe um cartão da pessoa.

## 5. Cores, textura e som

- **Papel, não tela.** Fundo branco levemente lilás (#F2F1F5) com uma grade de pontos (#CDC9DC, passo de 44 px) presa ao papel: quando a câmera anda, os pontos andam junto. Nada de gradiente, textura de papel amassado ou vinheta.
- **Três tons e um acento.** Tinta índigo (#1E1A3C) para texto, ramos, contornos, curvas e o bloco de alerta; lápis (#A6A2BB, #C6C2D6 e #D9D6E4) para o que ainda vai ser dito, o que foi esquecido e o que é secundário; branco para cartões e nós. **Marca-texto amarelo (#F6E24A)** é o único acento: o trecho em destaque, o item da vez, o disco do passo dito, o vencedor, a barra maior, o degrau da revisão, a fatia do relógio, o alfinete, a resposta do flashcard, o selo do fechamento. Se tudo for amarelo, nada é.
- **Alerta sem cor nova**: o alerta é o "cheio de tinta" (bloco índigo com texto branco e um selo "!"), o mesmo do nó central.
- **Som raro e tonal**: um "vum" grave no deslize, notas curtas de seno (pentatônica) nos ramos, itens, lados, opções e dados, notas subindo nos passos e nas revisões, uma descida no esquecimento, no alerta e na frase riscada, um toque quando o número ou o contador param, um toque surdo no alfinete, uma nota quando um flashcard vira, um acorde curto no fim. Nunca dois sons a menos de 0,45 s. Nada de ruído branco, "risco de lápis", virar de página, clique agudo ou sino.

## O que pode mudar por vídeo

- Textos, tempos e a escolha das estações (é o trabalho do plano).
- `marca` (nome e área).
- `abreCheio: false`, se o usuário não quiser a abertura em quadro cheio.
- `foco` do `mapa` ("pessoa" ou "mapa"), se o padrão (pessoa grande quando o mapa abre o vídeo; mapa grande no meio) não servir.
- `retrato` (zoom e altura do rosto nos cartões), se a gravação pedir.
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; gravação horizontal vira 3:4.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica das estações (`src/layout.ts`): o deslize, a duração, a ordem das direções, o encosto entre estações e a regra de só montar a estação anterior durante o deslize. É a identidade do modelo.
- O lugar do cartão da pessoa em cada tipo (`CARTAO` em `src/tema.ts`). Para enquadrar melhor, use `retrato` no plano.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `marca` em `src/tema.ts` por uma cor clara e luminosa o bastante para a tinta índigo ser lida em cima (como um marca-texto de verdade: verde-limão, rosa-claro, laranja-claro). A tinta, o lápis e o papel seguram o visual.
- As fontes e os tamanhos mínimos; a margem de 60 px.
- Não adicione emojis, ícones prontos (lâmpada, cérebro, moeda, foguete), logotipos, brilho atrás da pessoa, contorno nas letras, gradientes, fotos, "zoom de impacto" ou transições entre cortes além do deslize. Não troque os desenhos de tinta por ilustrações 3D.

## Se precisar de algo que o modelo não tem

- **Primeiro, use um bloco que já existe**: quase toda fala cabe nos 11 blocos universais mais a assinatura (`references/plano.md`, seção 5).
- **Outra estação** (uma linha do tempo, uma tabela, uma escala): crie um componente irmão em `src/componentes/`, desenhado em coordenadas da estação (0–1080 × 0–1920), com a mesma linguagem — esboço a lápis antes da fala, tinta na palavra, marca-texto no que importa, `Escrita` de `src/anim.tsx` para os textos falados e `diagramar` de `src/medidas.ts` para o texto caber. Acrescente o tipo em `src/plano.ts`, o lugar do cartão da pessoa em `CARTAO` (`src/tema.ts`), a faixa vertical do conteúdo em `FAIXA` (`src/layout.ts`), o ponto do ramo da pessoa em `src/componentes/RamoDaPessoa.tsx` e o `case` em `src/Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
- **Mais sub-passos num componente**: siga o padrão `em`/`...Em` no plano (o `stills.mjs --momentos` e o `conferir.mjs` acham esses campos sozinhos) e sempre deixe o elemento já esboçado antes do instante.
