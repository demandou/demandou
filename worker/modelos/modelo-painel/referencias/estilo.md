# O estilo Painel

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a clareza de um bom painel de dados; quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

Quem explica ganha uma tela maior. Enquanto a pessoa fala de ideias soltas, ela ocupa o quadro; quando a fala organiza alguma coisa (um número, uma lista, uma tendência, uma proporção, um passo a passo), ela vai para uma janela no canto, como num telejornal de economia ou numa chamada com tela compartilhada, e um painel abre para mostrar a informação se montando. Serve para qualquer assunto: ingredientes viram indicadores, sintomas viram linhas de status, um conselho vira um alerta, uma história vira uma linha que sobe ou cai. Calmo e preciso, nunca "cassino": nada pisca, nada explode, os números contam e as linhas se desenham na medida da fala.

## 1. Dinâmica do motion

- **Entrada de dado**: rótulos, valores e textos entram por uma máscara que abre da esquerda (como um dado sendo impresso). Terminada a entrada, o texto fica desenhado simples, sem máscara.
- **Números contam** com aceleração e freio (contador do cabeçalho, indicadores, valores das barras).
- **Linhas e barras se desenham na medida da fala**: a ponta da linha anda até cada número quando ele é dito; cada barra cresce na palavra dela; a barra da divisão enche parte a parte.
- **Itens acendem na palavra**: o que ainda não foi dito espera "a lápis" (contorno tracejado, traço cinza no lugar do texto, nome apagado). Uma **moldura de seleção** desliza até a linha que está sendo dita; nos passos, a linha de progresso avança de nó em nó.
- **Dado ao vivo**: o último dado "respira" (um anel que se abre e some). É o único movimento contínuo decorativo.
- **Trocas sem tela vazia**: o painel fica numa camada **embaixo** da pessoa. Indo para o painel, ele se monta embaixo um pouco antes (cabeçalho, grade, cartões "a lápis") e a pessoa encolhe até a janela revelando-o, enquanto o cartão de tela cheia some cruzando. Voltando, a pessoa cresce por cima do painel, que sai junto, e o cartão seguinte entra durante a troca. Entre dois painéis, a janela troca de canto, o cabeçalho antigo sai e o corpo antigo desliza para fora enquanto o novo entra. Nenhum quadro mostra a pessoa solta num fundo vazio. Cartões de tela cheia abrem da esquerda e saem subindo de leve.
- **Movimento com significado**: o contador acompanha a ponta da linha; a parte que importa acende; o caminho ruim fica reto e a parte perdida aparece tracejada; o alerta tem o selo vermelho; a dica abre embaixo do termo. Se um movimento não explica nada, ele não entra.
- Sem quique, sem elástico, sem giro, sem brilho, sem tremida.

## 2. Organização e hierarquia

- **Painel**: cabeçalho ao lado da janela (largura 574 px): rótulo âmbar em caixa alta com um quadradinho, um filete, e embaixo **uma** leitura grande (o número que conta, a seta da tendência com a leitura, ou o progresso "02/03" com a barra em segmentos). Corpo largo embaixo (960 × 716 px, de y 668 a 1384): o gráfico, a barra, os cartões ou a lista ocupam quase todo o corpo. Nota de rodapé em mono apagado. Legenda numa faixa fixa (y 1448).
- **Tela cheia**: um cartão grafite (960 px de largura) na altura do peito, dentro da `zona`; legenda logo abaixo do queixo quando não há cartão.
- **Uma ideia grande por vez**. O resto menor: rótulo âmbar pequeno, número ou título grande, detalhe em mono suave.
- Itens sempre **numerados** (01, 02…) ou com **status** (ponto, seta, ✓/✗). É o que faz qualquer lista parecer um painel.

## 3. Tipografia

- **Geist** (500 e 600) para texto; **Geist Mono** (400 e 500) para todo número, rótulos em caixa alta, eixos e notas. Ambas gratuitas, pelo Google Fonts. Nada de fonte condensada; espaçamento entre letras de no máximo −0,02em.
- Nos números grandes, "R$", "US$", "%" saem menores e mais apagados ao lado dos dígitos; unidades em palavra ("lata", "mil") saem em Geist, com espaço.
- Tamanhos no quadro 1080×1920: títulos de cartão 54 a 84 px; número do cabeçalho até 132 px; texto de linha/cartão ≥ 44 px; rótulos em caixa alta ≥ 30 px; eixos ≥ 28 px; legenda 46 px.
- **Todo texto é medido** com as larguras da própria fonte (`src/medida.ts`): o bloco escolhe o maior corpo que cabe, quebra em até 2 ou 3 linhas e prefere menos linhas quando isso custa pouco corpo. Nunca corta nem vaza.

## 4. Moldura da pessoa

- **Tela cheia**: o rosto na linha vertical do centro, com uma aproximação lenta e contínua (até 4,5%) que muda de direção na fronteira de cada momento; em cada corte, um salto seco de 6% disfarça o pulo.
- **Janela**: 350 × 440 px, cantos de 28 px, num canto de cima (y 190), cabeça e ombros, borda fina e a etiqueta com o nome. O enquadramento sai do tamanho do rosto medido no rastreio (`retrato` no plano só para ajuste fino). A janela segue o rosto.
- Recorte 3:4 (pessoa perto da câmera ou vídeo horizontal): o vídeo fica em cima e a base vira o fundo grafite do painel, onde entram os cartões e a legenda.
- Nunca uma coluna vertical estreita com a pessoa; nada sobre o rosto em tela cheia; nada recorta a pessoa do fundo.

## 5. Cores, textura e som

- Fundo grafite quase preto, puxado para o verde, `#0A120F`; cartões `rgba(10,18,15,0.9)` com borda fina.
- Texto `#EDF3EF`; suave (62%) e apagado (36%) para a hierarquia.
- **Menta `#5FDDA4`** = o positivo, o resultado, o item atual. **Âmbar `#F0B64E`** = rótulos, marcações, etiqueta "ilustrativo". **Cinza-esverdeado `#C4D0CA`** = a base, o neutro. **Vermelho suave `#EE7766`** só para perda, risco, erro, alerta. Uma coisa em menta por vez.
- Sem textura, sem gradiente colorido, sem glow. Só um degradê quase invisível sob a linha do gráfico.
- **Som raro e tonal** (`public/sfx/`): tom grave quando o painel abre, notas suaves nas revelações de dado (subindo nos passos), subida curta quando um número conta, ✓ sobe, ✗ e alerta descem, uma nota no fechamento. Nada de ruído, clique agudo ou sino.

## 6. Honestidade dos dados

Toda conta mostra os parâmetros (`ficha`) e a nota "Simulação ilustrativa"; dado real mostra a fonte; forma sem números leva a etiqueta "ilustrativo" e não mostra número nenhum. É parte do estilo, não um detalhe.

## O que pode mudar por vídeo

- Textos, tempos, números e a escolha dos blocos (o trabalho do plano).
- O canto da janela em cada painel (`janela`) e o enquadramento dentro dela (`retrato`).
- `marca` (nome e área), o `tom` de listas, cartões e tendências.
- O recorte (9:16, 3:4, 4:5 ou 1:1), escolhido pelo `cortar.mjs`.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A grade do painel, o tamanho e a posição da janela (`src/layout.ts`), as fontes e os tamanhos mínimos.
- Cores. Se o usuário pedir as cores da marca dele, troque **só** o `positivo` (e, se precisar, o `ambar`) em `src/tema.ts`, conferindo o contraste sobre o grafite. Vermelho continua reservado para o negativo.
- Um momento por vez; nada sobre o rosto.
- Não adicione emojis, stickers, brilhos, gradientes coloridos, contornos nas letras, tremidas, flashes ou transições entre cortes. Não troque o gráfico por ícones de moeda, foguete ou seta subindo: o dado é o visual.

## Se precisar de algo que o modelo não tem

Um tipo de painel novo (uma tabela, um velocímetro): crie o componente dentro da moldura `Painel` (`src/componentes/Painel.tsx`), que já dá o cabeçalho, a nota, a etiqueta "ilustrativo" e a saída; use `prog`, `Revela` e `contar` de `src/anim.tsx`, `encaixar` de `src/medida.ts` para o texto caber, as cores e `formatar` de `src/tema.ts`, e o corpo dentro de `PAINEL.corpo` (`src/layout.ts`). Acrescente o tipo em `src/plano.ts` e em `TIPOS_DE_PAINEL` (é isso que manda a pessoa para a janela), e o caso em `src/Edicao.tsx`. Um bloco de tela cheia novo: use `Cartao` e a `zona` (veja `src/componentes/Cartoes.tsx`). Consulte a skill do Remotion para as regras de animação.
