# O estilo Extrato (versão deitada, 16:9)

O sistema abaixo é o do vertical e vale inteiro no quadro deitado: as mesmas cores, fontes, papel, blocos, sons e o mesmo movimento de impressora. O que muda é a diagramação no quadro 1920 × 1080, pela composição da aula 9 do curso (quadro cheio como base; a pessoa numa moldura à direita quando o rolo imprime à esquerda), descrita em "Moldura da pessoa".

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um objeto de verdade — um cupom de papel térmico saindo da impressora enquanto a pessoa fala — e não um vídeo com "elementos gráficos". Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

Quem fala para a câmera está, no fundo, tirando um extrato: o que entra, o que sai, quantas vezes, quanto dá no fim. O modelo imprime isso na hora em que é dito, seja qual for o assunto: os motivos de quem perde dinheiro viram itens com "−" magenta e o saldo "PERDE"; a respiração 4-7-8 vira "INSPIRA ........ 4"; um alerta vira um carimbo; uma promessa que não existe é riscada. As explicações em sequência imprimem num rolo comprido, no lado esquerdo do quadro, com a pessoa numa moldura à direita; frases, números e alertas saem numa tira curta que sobe ao lado do rosto, até a altura do peito, com a pessoa em quadro cheio.

## O sistema visual

### Motion (como as coisas entram, assentam e saem)

- **Imprimir é avançar e revelar.** Cada linha entra empurrando o papel a altura dela (0,24 s, decidido, sem quique) e a tinta revela em 0,16 s. Nada de digitar letra por letra (só o `resultado` em palavras do total, que "conta" como um número), nada de deslizar de lado, nada de piscar.
- **Na fala.** Palavras de uma frase revelam uma a uma, cada uma quando é dita; números contam (em degraus iguais ao desenho, ou suaves); valores esperam a lápis e ganham tinta na palavra.
- **A espera é a lápis** (#BDB8AE, tracejado): o preço "R$ __,__", os algarismos "__.___", as casas, as colunas do gráfico, a caixa do carimbo, a linha de resposta. Nunca uma caixa vazia.
- **Ênfases desenhadas**: o marca-texto varre da esquerda para a direita (0,34 s); o risco corta em 0,3 s; a tesoura corre pela linha de corte; o carimbo bate de 150% para 100% em 0,13 s, dá um tranco de 6 px no papel e assenta; o selo ✓ bate igual; o pontilhado dos itens corre até a borda.
- **Dentro de um momento**, algo muda a cada 1,5 a 2,5 s: uma linha nova, a caixa do passo da vez que anda, o dado da vez em magenta, a contagem.
- **Trocas de lugar** (0,62 s, macias nas duas pontas, começando 0,2 s antes do `de`): a pessoa encolhe para a moldura da direita e o rolo aparece já impresso no quadro da esquerda, ou ela cresce para o quadro cheio e cobre o rolo. A tira cai (0,4 s, acelerando) **antes** de a pessoa encolher e sobe (0,55 s, decidida) **depois** que ela cresceu: o papel nunca passa sobre o rosto, nunca há dois textos um sobre o outro, nunca um quadro vazio. Entre dois momentos do rolo, a linha de corte e um passo de 36 px do rolo para o lado, dentro do quadro (a moldura não troca de lado).

### Organização e hierarquia

- **Tudo é linha de cupom**, de cima para baixo, na ordem da fala, alinhado à esquerda do papel (títulos centrados).
- **Hierarquia por peso e corpo**, não por cor: frase/termo/resultado grandes (52 a 104 px, 700); itens médios (42 a 56, 600); títulos de seção pequenos e espaçados (36 a 44, 700, entre fios); notas, rótulos e unidades em cinza (30 a 40, 500 a 600).
- **O valor fica à direita**, ligado ao nome pelo pontilhado; o total tem fio duplo em cima, "=" magenta e o número grande alinhado à direita.
- **Uma ideia por tira**; o rolo guarda a sequência inteira (o que já foi dito sobe e sai pelo alto).

### Tipografia

- **Spline Sans Mono** (500 a 700, sempre em caixa-alta) para tudo o que o cupom imprime: a cara de impressora. Todo caractere tem 0,6 do corpo, então o template mede o texto contando letras e nada estoura a largura do papel. Algarismos dos totais em 700 com espaçamento −0,03 em.
- **IBM Plex Sans** (600 a 700) só no carimbo (caixa-alta, +0,05 em) e na legenda.
- As duas passam no "Iogurte Il1 IPTU" (I com serifa, l com cauda, 1 com bandeira). Nada de fonte condensada, máquina de escrever borrada ou pixel.
- **Legível na tela deitada** (julgue em quadros de ~960 px de largura): no papel do rolo (×1,2 na tela) e da tira (×0,66 a 1,1): frases 50 a 64; itens 42 a 56; títulos 36 a 44; rótulo do total 32 a 38; algarismos do total 72 a 104 (o mesmo corpo em todo o papel); notas 30 a 40; carimbo 40 a 84. Nada abaixo de 30 px na tela.

### Moldura da pessoa

Medidas no quadro deitado (1920 × 1080). Margens do YouTube: 96 px nas laterais para o texto; nada importante abaixo de y 984 (controles do player).

- **Tela dividida (o rolo)**: a pessoa numa moldura à direita (x 1088, y 72, 760 × 912 px; cantos de 24 px; sombra), com o rosto no centro da moldura na horizontal e a 36% da altura dela, aproximado 1,1× (até 1,5× quando o rosto foi gravado colado numa borda) e seguido com ajuste suave, sem saltos. O rolo (papel de 605 px em escala 1,2 = 726 px) fica centrado no quadro da esquerda (de x 96 a x 1040), preso no alto (y 64) enquanto é curto e rolando quando a última linha chega a y 900; o papel continua até o pé do quadro.
- **Quadro cheio (a tira)**: o vídeo 16:9 inteiro, como foi gravado (sem recorte em pé); a tira (papel de 605 px em escala 1,1, que diminui até 0,66 se o conteúdo não couber entre y 800 e o topo, ou se o espaço ao lado do rosto for estreito) a 64 px da borda, do lado em que fica a pelo menos 64 px do rosto durante o momento (alternando esquerda e direita quando os dois lados cabem), com a última linha em y 800 e só 44 px de papel embaixo. Se nenhum lado couber, o vídeo desliza e aproxima o mínimo (até 1,4×) para afastar o rosto.
- **Abertura do layout "lado"**: o cupom curto (escala 0,9) no canto de baixo à esquerda, ao lado do rosto, com a última linha em y 800; depois ele vira o rolo do quadro da esquerda.
- **Legenda**: no quadro cheio, centrada no terço de baixo (y 884, 46 px, uma linha, até 1400 px de largura); na tela dividida, no pé da moldura (40 px, até duas linhas).
- **Nada de coluna estreita**: a pessoa nunca fica numa faixa estreita ao lado do papel; a moldura tem 40% da largura do quadro e quase a altura toda, com folga para a pessoa se mexer.
- **Corte num trecho parado** (longe de uma troca): passo seco de zoom de 7% na pessoa, para disfarçar o pulo.

### Cores, textura e som

- **Balcão grafite** (#1C1D20) como fundo; **papel térmico** (#F7F4EE) com bordas serrilhadas (o corte da guilhotina), leve sombreado nas laterais (a curvatura) e sombra macia sobre o balcão.
- **Tinta térmica** quase preta (#222120) para tudo o que foi impresso; **cinza** (#7E7A72) para notas, rótulos, linha de corte e o lado que perde; **lápis** (#BDB8AE) para o que espera.
- **Magenta de tinta de carimbo (#D81E6C) é o único acento**, e só em operações e ênfases: sinal da operação, "=", marca-texto (a 26%), risco, "−" dos débitos, carimbo, selo ✓, "VS", o dado da vez no gráfico, o ícone do `cta`. Nada de verde de dinheiro, vermelho de alerta, dourado, gradiente ou neon.
- **Som raro e tonal**: duas notas (Mi–Lá) quando um total termina de contar ou o lado certo ganha o selo; um baque grave (~72 Hz) em cada carimbo; duas notas descendo no risco ou no "não" da tesoura; um acorde curto (Dó–Sol–Mi) quando o rodapé imprime. Nunca dois a menos de 0,45 s. Nada de barulho de impressora (é ruído), caixa registradora, moeda ou sino.

## O que pode mudar por vídeo

- Textos, valores, tempos e a escolha dos blocos (é o trabalho do plano), inclusive o lugar de cada um (`quadro`).
- `cabecalho`, `marca`, `moeda`.
- O desenho da conta: `pontos`, `casas`, `xicaras`, `moedas` ou `degraus`, com os rótulos que fizerem sentido.
- O texto dos carimbos.
- O recorte: o `modelo.json` pede `"formato": "16:9"`; a gravação deitada entra inteira (1920×1080) e a vertical vira uma faixa deitada em volta do rosto.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica (`src/layout.ts` e `src/recibo.ts`): o rolo único que rola, a tira que sobe e cai ao lado do rosto, a moldura à direita com o rolo à esquerda, a ordem das trocas (a tira sai antes, entra depois), a linha de corte entre etapas. É a identidade do modelo.
- O papel, a tinta e o magenta. Se o usuário pedir a cor da marca dele, troque **só** o `magenta` (e o `magentaVeu`, a mesma cor a 26%) em `src/tema.ts` por uma cor escura o bastante para ler sobre o papel.
- As fontes e os tamanhos.
- Não adicione emojis, logotipos, cédulas e moedas em 3D, gráficos de bolsa "reais", brilho atrás da pessoa, contorno nas letras, gradientes, flashes ou transições além das descritas aqui.

## Se precisar de algo que o modelo não tem

- **Outra linha no cupom** (subtotal com desconto, parcelamento "10× R$ 29,90", porcentagem com barra): acrescente o tipo em `Linha` (`src/plano.ts`), a altura em `ALTURA` e o desmembramento em blocos em `linhaEmBlocos` (`src/recibo.ts`), e o desenho em `src/componentes/Recibo.tsx`, com a mesma linguagem: caixa-alta mono, tinta preta, espera a lápis, magenta só na operação ou na ênfase. Consulte a skill do Remotion para as regras de animação.
- **Outro ícone**: acrescente os traços em `src/componentes/Icones.tsx` (quadrado de 48, traço de 3,4, pontas redondas) e o nome em `Icone` (`src/plano.ts`). Desenho simples, reconhecível a 44 px.
