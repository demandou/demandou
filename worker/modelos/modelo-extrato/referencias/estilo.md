# O estilo Extrato

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um objeto de verdade — um cupom de papel térmico saindo da impressora enquanto a pessoa fala — e não um vídeo com "elementos gráficos". Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

Quem fala para a câmera está, no fundo, tirando um extrato: o que entra, o que sai, quantas vezes, quanto dá no fim. O modelo imprime isso na hora em que é dito, seja qual for o assunto: os motivos de quem perde dinheiro viram itens com "−" magenta e o saldo "PERDE"; a respiração 4-7-8 vira "INSPIRA ........ 4"; um alerta vira um carimbo; uma promessa que não existe é riscada. As explicações em sequência imprimem num rolo comprido; frases, números e alertas saem numa tira curta que sobe até o peito da pessoa.

## O sistema visual

### Motion (como as coisas entram, assentam e saem)

- **Imprimir é avançar e revelar.** Cada linha entra empurrando o papel a altura dela (0,24 s, decidido, sem quique) e a tinta revela em 0,16 s. Nada de digitar letra por letra (só o `resultado` em palavras do total, que "conta" como um número), nada de deslizar de lado, nada de piscar.
- **Na fala.** Palavras de uma frase revelam uma a uma, cada uma quando é dita; números contam (em degraus iguais ao desenho, ou suaves); valores esperam a lápis e ganham tinta na palavra.
- **A espera é a lápis** (#BDB8AE, tracejado): o preço "R$ __,__", os algarismos "__.___", as casas, as colunas do gráfico, a caixa do carimbo, a linha de resposta. Nunca uma caixa vazia.
- **Ênfases desenhadas**: o marca-texto varre da esquerda para a direita (0,34 s); o risco corta em 0,3 s; a tesoura corre pela linha de corte; o carimbo bate de 150% para 100% em 0,13 s, dá um tranco de 6 px no papel e assenta; o selo ✓ bate igual; o pontilhado dos itens corre até a borda.
- **Dentro de um momento**, algo muda a cada 1,5 a 2,5 s: uma linha nova, a caixa do passo da vez que anda, o dado da vez em magenta, a contagem.
- **Trocas de lugar** (0,62 s, macias nas duas pontas, começando 0,2 s antes do `de`): a pessoa encolhe para a moldura e o rolo aparece já impresso atrás dela, ou ela cresce e cobre o rolo. A tira cai (0,4 s, acelerando) **antes** de a pessoa encolher e sobe (0,55 s, decidida) **depois** que ela cresceu: o papel nunca passa sobre o rosto, nunca há dois textos um sobre o outro, nunca um quadro vazio. Entre dois momentos do rolo, a linha de corte e um passo de 30 px do rolo para o lado.

### Organização e hierarquia

- **Tudo é linha de cupom**, de cima para baixo, na ordem da fala, alinhado à esquerda do papel (títulos centrados).
- **Hierarquia por peso e corpo**, não por cor: frase/termo/resultado grandes (52 a 104 px, 700); itens médios (42 a 56, 600); títulos de seção pequenos e espaçados (36 a 44, 700, entre fios); notas, rótulos e unidades em cinza (30 a 40, 500 a 600).
- **O valor fica à direita**, ligado ao nome pelo pontilhado; o total tem fio duplo em cima, "=" magenta e o número grande alinhado à direita.
- **Uma ideia por tira**; o rolo guarda a sequência inteira (o que já foi dito sobe e sai pelo alto).

### Tipografia

- **Spline Sans Mono** (500 a 700, sempre em caixa-alta) para tudo o que o cupom imprime: a cara de impressora. Todo caractere tem 0,6 do corpo, então o template mede o texto contando letras e nada estoura a largura do papel. Algarismos dos totais em 700 com espaçamento −0,03 em.
- **IBM Plex Sans** (600 a 700) só no carimbo (caixa-alta, +0,05 em) e na legenda.
- As duas passam no "Iogurte Il1 IPTU" (I com serifa, l com cauda, 1 com bandeira). Nada de fonte condensada, máquina de escrever borrada ou pixel.
- **Legível no celular** (julgue em quadros de 540 px): no papel do rolo (×1,25 na tela) e da tira (×0,72 a 1,15): frases 50 a 64; itens 42 a 56; títulos 36 a 44; rótulo do total 32 a 38; algarismos do total 72 a 104 (o mesmo corpo em todo o papel); notas 30 a 40; carimbo 40 a 84. Nada abaixo de 30 px na tela.

### Moldura da pessoa

- **Tela dividida (o rolo)**: a pessoa numa moldura larga embaixo (x 16, y 960, 1048 × 944 px; cantos de 24 px; sombra), rosto a 24% da altura da moldura, seguido quadro a quadro. O rolo (papel de 605 px em escala 1,25 = 756 px) fica centrado em cima, preso no alto (y 112) enquanto é curto e rolando quando a última linha chega a 30 px da moldura; o papel continua por trás dela.
- **Quadro cheio (a tira)**: rosto na linha do centro (zoom mínimo para isso); a tira (papel de 605 px em escala 1,15, que diminui até 0,72 se o conteúdo não couber abaixo do queixo) a 28 px da borda, alternando esquerda e direita, com a última linha a 1470 px e só 44 px de papel embaixo; nunca sobe acima de `zona.topo` + 18 px.
- **Nada de coluna estreita**: a pessoa nunca fica numa faixa vertical ao lado do papel (quem se mexe sai dela). O layout "lado" do exemplo do modelo existe só para gravações paradas e centradas.
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
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; gravação horizontal vira 3:4.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica (`src/layout.ts` e `src/recibo.ts`): o rolo único que rola, a tira que sobe e cai, a moldura larga embaixo, a ordem das trocas (a tira sai antes, entra depois), a linha de corte entre etapas. É a identidade do modelo.
- O papel, a tinta e o magenta. Se o usuário pedir a cor da marca dele, troque **só** o `magenta` (e o `magentaVeu`, a mesma cor a 26%) em `src/tema.ts` por uma cor escura o bastante para ler sobre o papel.
- As fontes e os tamanhos.
- Não adicione emojis, logotipos, cédulas e moedas em 3D, gráficos de bolsa "reais", brilho atrás da pessoa, contorno nas letras, gradientes, flashes ou transições além das descritas aqui.

## Se precisar de algo que o modelo não tem

- **Outra linha no cupom** (subtotal com desconto, parcelamento "10× R$ 29,90", porcentagem com barra): acrescente o tipo em `Linha` (`src/plano.ts`), a altura em `ALTURA` e o desmembramento em blocos em `linhaEmBlocos` (`src/recibo.ts`), e o desenho em `src/componentes/Recibo.tsx`, com a mesma linguagem: caixa-alta mono, tinta preta, espera a lápis, magenta só na operação ou na ênfase. Consulte a skill do Remotion para as regras de animação.
- **Outro ícone**: acrescente os traços em `src/componentes/Icones.tsx` (quadrado de 48, traço de 3,4, pontas redondas) e o nome em `Icone` (`src/plano.ts`). Desenho simples, reconhecível a 44 px.
