# O estilo Manifesto

Leia antes de alterar qualquer componente, cor ou fonte do template. A força deste modelo está em pouca coisa muito grande; quase toda "melhoria" que adiciona elemento enfraquece o pôster. O estilo vale para qualquer assunto: o que muda de um vídeo para outro é o texto, a palavra-janela e os blocos, nunca o sistema abaixo.

## A ideia

Um manifesto colado na parede, frase por frase. A pessoa fala; quando a ideia merece parede, um pôster de cor chapada cobre a tela e a palavra que importa vira uma janela gigante: a pessoa continua ali, falando dentro das letras. Entre um pôster e outro, ela volta limpa, em quadro cheio, e números e alertas batem numa placa no peito. O contraste entre o pôster (tipografia, cor chapada) e a pessoa (imagem, voz) é o ritmo do vídeo.

## 1. Dinâmica do motion

- **A lápis, depois tinta.** Todo pôster e toda placa entram com o conteúdo inteiro desenhado apagado, no lugar e no tamanho finais. Cada palavra ganha tinta, da esquerda para a direita, no instante em que é dita. Nunca há caixa ou faixa vazia esperando a fala. Terminada a tinta, a palavra é texto simples (sem máscara por cima).
- **A janela abre na palavra.** As letras (ou o círculo) chegam 30% maiores e assentam em volta do rosto em ~0,4 s, junto com uma luz suave só em volta do rosto; golpe grave. Nas listas, o contador troca seco ("01" → "02") com um pequeno golpe nas letras.
- **Movimento com significado**: o risco passa da esquerda para a direita quando a negação termina; a seta dos passos desce até o próximo passo; o número conta; a coluna sobe; a linha grossa anda de ponto a ponto; os degraus da escalada crescem como a frase cresce, e o "torto" entra torto.
- **Entradas e saídas**: o pôster entra seco num corte (ou colado no anterior) ou sobe de baixo como uma folha sólida de borda seca (0,22 s); sai "mergulhando" na janela, crescendo em volta do rosto enquanto um círculo de borda seca abre a partir dele (0,34 s). Dois pôsteres colados trocam secos. A placa entra varrendo da esquerda e sai varrendo para a direita. Nenhuma troca passa por véu, transparência ou quadro cinza; nunca dois textos um sobre o outro.
- **Sempre acontecendo alguma coisa**: dentro de um pôster entra algo novo a cada 1,5 a 2,5 s, e o vídeo aproxima devagar dentro das letras. No quadro cheio, a legenda entra palavra por palavra e o enquadramento troca seco (1 ↔ 1,1) nos cortes e frases novas.
- **Sem**: quique, elástico, tremida, brilho, glow atrás da pessoa, partículas, transições extras entre cortes.

## 2. Organização e hierarquia

- **Uma ideia por pôster**, numa pilha vertical centralizada, montada em volta do rosto: o que vem antes da palavra-janela fica acima dela, o que vem depois, abaixo. Se o rosto não pode ficar onde está, a pilha desce ou sobe e o vídeo desliza junto, aproximando só o necessário.
- **Hierarquia por tamanho**: a palavra-janela é a maior coisa da tela (até ~640 px); o `destaque` vem grande (até 150 px) e na cor de acento; o resto do texto, 60 a 120 px; detalhes e rótulos, 44 a 56 px; letreiros, 32 px.
- **Listas**: título no alto, contador na janela, itens empilhados embaixo; o item da vez em tinta cheia, os que já passaram num tom mais claro. **Comparação**: o pôster se divide em dois campos, um lado em cada, "VS" na emenda. **Gráfico**: título e janela em cima, o desenho ocupando a parte de baixo.
- **Letreiros fixos** nos cantos de cima: "Nº 01" (número do pôster) à esquerda, a área de quem fala à direita. Nada abaixo da linha da interface do app (y 1600); no `cta`, o conteúdo para antes da assinatura.

## 3. Tipografia

- **Unbounded** (larga e pesada), sempre em CAIXA-ALTA: em caixa-baixa o I dela se confunde com o l. Peso 900 nas palavras grandes, 700 abaixo de 70 px. Espaçamento entre letras −0,02 em; o espaço entre palavras é uma margem fixa de 0,3 em (nunca o caractere de espaço).
- **DM Mono** 500 nos letreiros ("Nº 01", área, rótulos de gráfico, "ou", "ilustrativo"), em caixa-alta espaçada (0,14 em), 32 px.
- **Medida de verdade**: o template mede cada texto com as larguras da própria fonte e encaixa no maior corpo que cabe, em até 2 ou 3 linhas equilibradas; números com moeda e escala não se separam ("R$ 100 MIL"). Mínimos: 56 px nas linhas, 44 px nos detalhes, 30 px nos rótulos de gráfico.
- Nada condensado, nada com contorno, nada com sombra colorida.

## 4. Moldura da pessoa

- **Quadro cheio**: rosto na linha vertical do centro, legenda abaixo do queixo, placa na altura do peito logo abaixo dela.
- **Dentro das letras**: o campo do pôster é sólido; a pessoa aparece em cor só dentro das letras da palavra-janela (ou do círculo, quando não há palavra curta), com o centro do rosto no meio da primeira linha. Uma luz suave em volta do rosto (40% do campo) deixa o rosto inteiro onde um vão de letra passa.
- O vídeo nunca é recortado do fundo nem distorcido: só desliza e aproxima por igual. O rosto é seguido quadro a quadro (`rosto.rastro`). Gravação perto da câmera vira um close dentro das letras.
- A voz vem sempre do mesmo vídeo, montado o tempo todo.

## 5. Cores, textura e som

- **Três cores**: preto `#0A0A0C`, azul-cobalto elétrico `#2A3CFF` e branco frio `#EEEFF1`.
- **Três campos de pôster**: **cobalto** (letras brancas, acento preto), **papel** (branco frio, letras pretas, acento cobalto), **preto** (letras brancas, acento cobalto: o campo do alerta). Os campos se alternam sozinhos; a comparação usa os dois primeiros. O acento aparece em uma coisa por pôster: o risco, o `destaque`, a palavra que fecha a ideia, o maior dado.
- **Placa**: cobalto (padrão) ou preta (alerta), com os algarismos ou a palavra vazados quando são grandes o bastante para ler assim.
- **Lápis**: o mesmo texto no tom do campo, bem apagado (7% a 12%).
- **Som raro e tonal**: golpe grave quando a janela abre (e no alerta), toques em escada nos riscos, itens, opções, dados e degraus, um toque quando a placa entra, duas notas suaves no `cta`. Nada de ruído, clique agudo ou sino.

## Medidas (quadro 1080 × 1920)

| O quê | Onde |
|---|---|
| letreiros do topo | y 136, margens de 60 px |
| faixa do pôster | y 210 a 1500 (1420 com a assinatura do `cta`) |
| largura do texto / da janela | 960 / 1000 px |
| legenda | logo abaixo do queixo (zona do `cortar.mjs` − 34 px), entre y 900 e 1280 |
| placa | largura 920 px, logo abaixo do queixo, acaba antes de y 1576 |
| interface do app | abaixo de y 1600 |

## O que pode mudar por vídeo

- Quais ideias viram pôster ou placa, a palavra-janela e a quebra dela, os textos, tempos e tamanhos das linhas do `cartaz` (é o trabalho do plano).
- O campo de cada bloco (`campo`), se a alternância automática não servir (gravação com fundo claro pede mais `cobalto`; alerta pede `preto`).
- `marca` (nome e área), o ícone do `cta`.
- `fantasma` (0 a 0,08; padrão 0, campo sólido), só se o usuário quiser ver a pessoa de leve atrás do pôster.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores e fontes. Se o usuário pedir a cor da marca dele, troque **só** o cobalto em `src/tema.ts` (`cor.cobalto` e os campos que usam ele) por outra cor forte e escura o bastante para o texto branco ler em cima; preto e branco frio seguram o resto.
- A regra de uma janela por pôster, sempre com o rosto dentro.
- Caixa-alta em tudo que é Unbounded; as entradas a lápis.
- Não adicione emojis, stickers, contornos nas letras, sombras coloridas, brilho atrás da pessoa, degradês, barras de progresso ou transições extras. Eles pertencem a outros modelos.

## Se precisar de algo que o modelo não tem

- Um ícone novo para o `cta`/`fecho`: desenhe em `src/componentes/Icones.tsx` (viewBox 100×100, só traço, espessura 8) e acrescente o nome em `src/plano.ts`.
- Um bloco novo: siga a gramática acima. A diagramação dos blocos universais está em `src/blocos.ts` (a pilha em volta do rosto, a escolha da janela pelo custo de zoom, vazio e tamanho); o desenho em `src/componentes/Bloco.tsx` (campo + janela + linhas `LinhaDeTexto` com o tempo de cada palavra). Consulte a skill do Remotion para as regras de animação.
