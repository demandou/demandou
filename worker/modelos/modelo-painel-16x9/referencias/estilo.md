# O estilo Painel (versão deitada, 16:9)

O sistema abaixo é o do vertical e vale inteiro no quadro deitado: as mesmas cores, fontes, blocos, sons e o mesmo movimento. O que muda é a diagramação no quadro 1920 × 1080, pela composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação à esquerda), descrita em "Medidas (quadro deitado 1920 × 1080)".

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a clareza de um bom painel de dados; quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

Quem explica ganha uma tela maior. Enquanto a pessoa fala de ideias soltas, ela ocupa o quadro; quando a fala organiza alguma coisa (um número, uma lista, uma tendência, uma proporção, um passo a passo), ela vai para uma moldura do lado direito, como num telejornal de economia ou numa chamada com tela compartilhada, e um painel abre do lado esquerdo para mostrar a informação se montando. Serve para qualquer assunto: ingredientes viram indicadores, sintomas viram linhas de status, um conselho vira um alerta, uma história vira uma linha que sobe ou cai. Calmo e preciso, nunca "cassino": nada pisca, nada explode, os números contam e as linhas se desenham na medida da fala.

## 1. Dinâmica do motion

- **Entrada de dado**: rótulos, valores e textos entram por uma máscara que abre da esquerda (como um dado sendo impresso). Terminada a entrada, o texto fica desenhado simples, sem máscara.
- **Números contam** com aceleração e freio (contador do cabeçalho, indicadores, valores das barras).
- **Linhas e barras se desenham na medida da fala**: a ponta da linha anda até cada número quando ele é dito; cada barra cresce na palavra dela; a barra da divisão enche parte a parte.
- **Itens acendem na palavra**: o que ainda não foi dito espera "a lápis" (contorno tracejado, traço cinza no lugar do texto, nome apagado). Uma **moldura de seleção** desliza até a linha que está sendo dita; nos passos, a linha de progresso avança de nó em nó.
- **Dado ao vivo**: o último dado "respira" (um anel que se abre e some). É o único movimento contínuo decorativo.
- **Trocas sem tela vazia**: o painel fica numa camada **embaixo** da pessoa. Indo para o painel, ele se monta embaixo um pouco antes (cabeçalho, grade, cartões "a lápis") e a pessoa encolhe até a moldura revelando-o, enquanto o cartão de tela cheia some cruzando. Voltando, a pessoa cresce por cima do painel, que sai junto, e o cartão seguinte entra durante a troca. Entre dois painéis, a pessoa fica na moldura, o cabeçalho antigo sai e o corpo antigo desliza para fora enquanto o novo entra. Nenhum quadro mostra a pessoa solta num fundo vazio. Cartões de tela cheia abrem da esquerda e saem subindo de leve.
- **Movimento com significado**: o contador acompanha a ponta da linha; a parte que importa acende; o caminho ruim fica reto e a parte perdida aparece tracejada; o alerta tem o selo vermelho; a dica abre embaixo do termo. Se um movimento não explica nada, ele não entra.
- Sem quique, sem elástico, sem giro, sem brilho, sem tremida.

## 2. Organização e hierarquia

- **Painel** (lado esquerdo do quadro deitado): cabeçalho em cima, na largura do painel: rótulo âmbar em caixa alta com um quadradinho e um filete; embaixo, o título ou a ficha à esquerda e **uma** leitura grande à direita (o número que conta, a seta da tendência com a leitura, ou o progresso "02/03" com a barra em segmentos). Corpo largo embaixo: o gráfico, a barra, os cartões ou a lista ocupam quase todo o corpo; no corpo largo e baixo, 2 ou 3 indicadores ficam lado a lado e as partes da divisão numa fileira só. Nota de rodapé em mono apagado. Legenda na faixa de baixo.
- **Tela cheia**: um cartão grafite na coluna livre ao lado da pessoa, na altura do rosto, sem cobrir o rosto; legenda na faixa de baixo.
- **Uma ideia grande por vez**. O resto menor: rótulo âmbar pequeno, número ou título grande, detalhe em mono suave.
- Itens sempre **numerados** (01, 02…) ou com **status** (ponto, seta, ✓/✗). É o que faz qualquer lista parecer um painel.

## 3. Tipografia

- **Geist** (500 e 600) para texto; **Geist Mono** (400 e 500) para todo número, rótulos em caixa alta, eixos e notas. Ambas gratuitas, pelo Google Fonts. Nada de fonte condensada; espaçamento entre letras de no máximo −0,02em.
- Nos números grandes, "R$", "US$", "%" saem menores e mais apagados ao lado dos dígitos; unidades em palavra ("lata", "mil") saem em Geist, com espaço.
- Tamanhos: os do vertical (títulos de cartão 54 a 84 px; número do cabeçalho até 132 px; texto de linha/cartão ≥ 44 px; rótulos em caixa alta ≥ 30 px; eixos ≥ 28 px), desenhados numa camada lógica e encolhidos pela `ESCALA` 0,84 no quadro deitado (`src/tema.ts`): a proporção entre eles e a conta de medir e encolher não mudam. Legenda 44 px, direto no quadro.
- **Todo texto é medido** com as larguras da própria fonte (`src/medida.ts`): o bloco escolhe o maior corpo que cabe, quebra em até 2 ou 3 linhas e prefere menos linhas quando isso custa pouco corpo. Nunca corta nem vaza.

## 4. Moldura da pessoa

- **Tela cheia**: a pessoa como foi gravada, com uma aproximação lenta e contínua (até 4,5%) que muda de direção na fronteira de cada momento; em cada corte, um salto seco de 6% disfarça o pulo. Com um cartão na tela e a pessoa no meio da gravação, o vídeo desliza um pouco para o lado oposto ao cartão (aproxima o mínimo para não sobrar borda, no máximo 15%).
- **Moldura**: 544 × 760 px, cantos de 28 px, do lado direito (x 1280, y 100), cabeça e ombros, o rosto centralizado nela, borda fina e a etiqueta com o nome. O enquadramento sai do tamanho do rosto medido no rastreio (`retrato` no plano só para ajuste fino). A moldura segue o rosto com ajuste suave, sem saltos.
- Nada sobre o rosto em tela cheia; nada recorta a pessoa do fundo.

## Medidas (quadro deitado 1920 × 1080)

| O quê | Onde |
|---|---|
| margens seguras (YouTube) | 96 px nas laterais; nada abaixo de y 984 (controles do player) |
| moldura da pessoa (painéis) | x 1280 a 1824, y 100 a 860 (544 × 760), sempre à direita |
| painel (o quadro da explicação) | x 96 a 1232; cabeçalho y 100 a 316 (contador numa coluna de 436 px à direita), corpo y 352 a 820, nota y 828 |
| cartões de tela cheia | coluna livre ao lado da pessoa, 660 a 900 px de largura, topo na altura do rosto (y 120 a 280), base até y 864 |
| legenda | y 884, centrada, até ~42 caracteres por linha |
| escala dos painéis e cartões | 0,84 (camada lógica com as medidas do vertical) |

### A composição da aula 9 do curso (editar uma aula horizontal)

- Tela cheia como base; o painel abre quando acrescenta clareza e fecha ao fim da ideia.
- A pessoa numa moldura à direita, com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto); a explicação no quadro à esquerda, entrando na ordem do raciocínio, com tempo de leitura.
- Sem excesso de cor nem informação simultânea: um painel, uma ideia, a menta em uma coisa.
- Cortes nas pausas excessivas e nos erros, mantendo a respiração natural.

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
- O enquadramento dentro da moldura (`retrato`). O lado da moldura não muda: sempre a direita.
- `marca` (nome e área), o `tom` de listas, cartões e tendências.
- O quadro é sempre 1920 × 1080; um original vertical vira uma faixa deitada em volta do rosto (`cortar.mjs`).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A grade do painel, o tamanho e a posição da moldura e a coluna dos cartões (`src/layout.ts`), as fontes, a escala e os tamanhos mínimos.
- Cores. Se o usuário pedir as cores da marca dele, troque **só** o `positivo` (e, se precisar, o `ambar`) em `src/tema.ts`, conferindo o contraste sobre o grafite. Vermelho continua reservado para o negativo.
- Um momento por vez; nada sobre o rosto.
- Não adicione emojis, stickers, brilhos, gradientes coloridos, contornos nas letras, tremidas, flashes ou transições entre cortes. Não troque o gráfico por ícones de moeda, foguete ou seta subindo: o dado é o visual.

## Se precisar de algo que o modelo não tem

Um tipo de painel novo (uma tabela, um velocímetro): crie o componente dentro da moldura `Painel` (`src/componentes/Painel.tsx`), que já dá o cabeçalho, a nota, a etiqueta "ilustrativo" e a saída; use `prog`, `Revela` e `contar` de `src/anim.tsx`, `encaixar` de `src/medida.ts` para o texto caber, as cores e `formatar` de `src/tema.ts`, e o corpo dentro de `PAINEL.corpo` (`src/layout.ts`). Acrescente o tipo em `src/plano.ts` e em `TIPOS_DE_PAINEL` (é isso que manda a pessoa para a moldura), e o caso em `src/Edicao.tsx`. Os painéis são desenhados na camada lógica (`PLANO` em `src/tema.ts`): use as medidas de `PAINEL` e, para o lado direito, `PLANO.w`. Um bloco de tela cheia novo: use `Cartao` e a `zona` (a largura vem em `zona.largura`; veja `src/componentes/Cartoes.tsx`). Consulte a skill do Remotion para as regras de animação.
