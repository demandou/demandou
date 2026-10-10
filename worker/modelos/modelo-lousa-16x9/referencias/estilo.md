# O estilo Lousa (versão deitada, 16:9)

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma aula de verdade num quadro-negro bonito: tudo nasce na mão, no ritmo da fala, com qualquer assunto. Quase toda "melhoria" que adiciona enfeite piora o resultado.

O sistema abaixo é o do vertical e vale inteiro no quadro deitado. O que muda é a composição, pela aula 9 do curso (a pessoa em tela cheia como base; na explicação, a pessoa numa moldura à direita e a lousa à esquerda), e as medidas, que estão em "Medidas (quadro deitado 1920 × 1080)".

## A ideia

Um professor no quadro. A tela vira uma lousa verde quase preta; a pessoa sai da tela cheia e vira uma janela presa no quadro, do lado direito, com moldura riscada a giz. Cada ideia da fala que merece lousa é uma página: o que é dito é escrito a giz quando é dito, e o professor sublinha, circula, risca, emoldura e liga com setas. Entre uma página e outra, o apagador de feltro limpa a lousa (deixando a névoa de giz que toda lousa tem) e a janela muda de tamanho para dar espaço à página nova. A assinatura é a conta armada: parcelas, sinal, traço e o resultado circulado, com números ou com palavras.

## No vídeo completo (16:9): a aula 9 do curso

- **Tela cheia como base.** A pessoa fala em quadro cheio, como foi gravada, com legenda. A lousa abre só quando acrescenta clareza à fala (uma lista, um número, uma conta, uma comparação, uma pergunta para quem assiste) e a pessoa volta à tela cheia quando a ideia termina.
- **Moldura à direita, lousa à esquerda.** Na página, a pessoa fica numa moldura do lado direito, com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto, sem saltos nem cortes no rosto); a lousa ocupa o lado esquerdo e o giz entra na ordem do raciocínio, com tempo de leitura.
- **Sem excesso:** um amarelo por vez, uma ideia por página, nenhum giz sem função. É uma aula: não acelere como se fosse um anúncio.

## Motion (dinâmica)

- **Escrita na fala:** cada palavra é escrita no instante em que é dita, revelada da esquerda para a direita; algarismos e sinais são traços desenhados na ordem da mão (`src/giz/glifos.ts`). Texto que não está na fala (um resumo) entra logo depois da palavra anterior, no mesmo ritmo. Terminada a escrita, o texto fica desenhado simples, sem máscara.
- **Gestos de professor depois da escrita:** sublinhado (abertura, termo, chamada), sublinhado duplo (número, resposta, destaque-chave), círculo (passo, total, vencedor, ponto do gráfico), risco rosa (frase), moldura (lista que fecha, regra), seta (passos, antes-depois, tendência), "?" que se completa (pergunta), ícone que "acontece" (chamada). Se um gesto não explica nada, ele não entra.
- **Espera sem vazio:** a forma do que vai ser escrito aparece em giz bem fraco (17%) assim que o lugar fica livre: o título ao lado da janela, o "= ?" da conta, os traços da lista, os algarismos dos passos, o T da comparação, os eixos do gráfico, o círculo da pizza. O texto em si só aparece quando é dito.
- **Troca de página limpa:** a janela vai para o lugar novo (~0,6 s, curva de ida e volta, sem quique; no quadro deitado ela muda de tamanho entre a janela grande e a retrato, sempre à direita) → o título novo é escrito ao lado dela na palavra (e o que já foi dito aparece à medida que a janela libera a lousa) → a página anterior fica inteira um instante (0,45 s; 0,85 s depois de um resultado circulado) → o apagador passa (~0,42 s) → só então a página nova é escrita, e os números que passam de uma página para outra deslizam até o lugar novo. Nunca há giz novo junto de giz meio apagado.
- **Nada parado:** algo novo a cada 1,5 a 3 s dentro da página; uma curva de tendência é desenhada devagar; uma lista que termina cedo ganha a moldura. Fora das páginas, a pessoa em tela cheia é o respiro.

## Organização e hierarquia

- Uma página por ideia, na lousa à esquerda. Janela retrato: título grande em amarelo no topo da lousa, ao lado da janela (com rótulo pequeno em caixa-alta acima, opcional); o conteúdo embaixo, na largura toda da lousa, centrado na altura. Janela grande: o conteúdo centrado na lousa, ao lado da janela.
- O assunto do instante é grande e amarelo; o resto é branco; detalhes, unidades, eixos e esboços são menores e mais fracos.
- Listas de cima para baixo (traço na frente, ou algarismo circulado nos passos), comparação em T, gráfico com eixos riscados, verbete "termo = significado", questão de prova "☐ a)".

## Tipografia

- **Mali 600** (Google Fonts): tudo que é escrito na lousa. Redonda, larga, I e l bem diferentes.
- **Atkinson Hyperlegible Next 500/700** (Google Fonts): rótulos em caixa-alta espaçada (34 px, 0,16em), legenda (54 px no quadro deitado, encolhe até 46 numa linha), assinatura.
- Algarismos e sinais a traço: `0–9 % , . + − × ÷ = / : ( ) ≈ →`, `R$` e `US$` (o R, o U e o S viram traço só dentro da moeda; nas palavras são letras).
- Tamanhos (altura da maiúscula): números da conta 100–240 px (resposta até 280), título ao lado da janela até 190, texto de bloco 52–170 conforme o espaço, detalhe ≥ 40, rótulos 34, nada abaixo de ~34. No quadro deitado a conta não desce de 100 px (no vertical, 120: o quadro deitado é visto maior). O texto é medido com a letra carregada (`measureText`) e encolhe até caber na região da lousa; quebra em linhas equilibradas, prefere menos linhas, não deixa palavra órfã nem quebra o destaque no meio.

## Moldura da pessoa

- Tela cheia no começo (o gancho), nos respiros de mais de 0,3 s entre páginas e em todo trecho sem lousa (no vídeo completo, a base).
- **Janela grande** (`alto`): moldura larga, 720 × 784, presa à margem direita. **Janela retrato** (canto): moldura estreita, 540 × 784, presa à margem direita. A pessoa nunca vai para a esquerda: a aula 9 fixa a moldura à direita.
- Moldura de giz riscada na primeira vez que a pessoa sai da tela cheia; ela acompanha a janela.
- O rosto fica no centro da janela, cabeça inteira, seguindo o rastro do `cortar.mjs` com ajuste suave. A aproximação sai da largura do rosto medida: ~metade da largura da janela retrato, ~um terço da janela grande. Gravação muito perto da câmera (rosto largo no quadro) aproxima menos sozinha.
- Nada de recortar a pessoa do fundo, nada de coluna vertical estreita.

## Medidas (quadro deitado 1920 × 1080)

| O quê | Onde |
|---|---|
| margens seguras (YouTube) | 96 px nas laterais; nada abaixo de y 984 (controles do player) |
| molduras da pessoa | do topo da lousa (y 76) até y 860, presas à margem direita; janela grande 720 px de largura (x 1104), janela retrato 540 px (x 1284) |
| lousa com a janela grande | x 96 a 1040 (944 px), y 76 a 860 (950 sem legenda) |
| lousa com a janela retrato | cabeçalho x 96 a 1220 (1124 px), y 76 a 272; conteúdo y 308 a 860 (950 sem legenda) |
| vão entre a lousa e a moldura | 64 px |
| legenda | tarja centrada, base em y 976, 54 px, até ~42 caracteres por linha; abaixo da moldura |

## Cores, textura e som

- Lousa `#17211C` com textura de giz apagado (`public/lousa/fundo.jpg`, a mesma textura do vertical, deitada); giz `#EEEDE6`; **amarelo** `#F3D66B` só para o assunto do instante; **rosa** `#F29B8D` só para o erro e o alerta (risco, lado errado, sinal de atenção). Sem degradê, sem brilho, sem contorno de texto, sem sombra atrás da pessoa.
- Filtro de giz em tudo que é escrito (borda levemente irregular e grão fixo, que não "ferve" de um quadro para o outro).
- Sons tonais e raros (`public/sfx/`): "vuum" grave do apagador; notas de marimba (sol, lá, si, ré) a cada resultado, passo, lado, dado ou opção; duas notas descendo no alerta (`alerta.wav`); acorde na resposta final. Nada de ruído de giz riscando, clique agudo ou sino.

## O que pode mudar por vídeo

- Textos, números, tempos, a escolha dos blocos e os lugares (é o trabalho do plano).
- `marca` (nome e área), `sfx: false`, `caixas` (enquadramento da pessoa em cada lugar).

## O que não mudar sem o usuário pedir

- Cores, fontes, espessura do traço, tamanhos e o filtro de giz (`src/tema.ts`, `src/giz/`). Se o usuário pedir a cor da marca dele, troque **só** o `amarelo` por um tom claro de giz (pastel); a lousa e o giz branco seguram o estilo. Uma lousa preta (`#151515`) também funciona, trocando a imagem do fundo.
- As posições das janelas e da legenda (`src/layout.ts`, `src/tema.ts`), e a moldura à direita.
- A regra de um amarelo por vez e do rosa só para o erro.
- Não adicione emojis, figurinhas, brilho atrás da pessoa, sombras longas, barras de progresso, tremidas, flashes, transições entre cortes ou fotos de banco.

## Onde fica cada coisa no código

- `src/blocos.ts`: os blocos universais (abertura, tópicos, passos, número, comparação, gráfico, destaque, definição, frase, pergunta); o `cta` está em `src/paginas.ts`.
- `src/paginas.ts`: a conta (título, vírgula, fração, coluna de números ou de palavras, resultado, regra), o fechamento, o apagador, a espera pelo lugar limpo e a passagem dos números entre páginas.
- `src/pecas.ts`: as peças (escrita, traço, rótulo), a medida e a quebra de texto, o cabeçalho ao lado da janela.
- `src/layout.ts`: os lugares da pessoa (a moldura à direita, grande ou retrato, e a tela cheia), o enquadramento do rosto em cada um e as regiões da lousa.
- `src/tema.ts`: cores, fontes e as medidas do quadro deitado (margens, topo da lousa, legenda, limites de baixo).
- `src/giz/`: a escrita a giz, os algarismos e sinais desenhados, as formas à mão (círculo, sublinhado, seta, moldura) e o filtro.

## Se precisar de algo que o modelo não tem

- **Um sinal novo** (ex.: `<`, `>`, `√`): desenhe os traços em `src/giz/glifos.ts`, numa caixa de altura 100 (topo 0, base 100), com `a` = largura de avanço, só com `M`, `L` e `C` absolutos, na ordem em que a mão escreve. Confira num quadro a 960 px.
- **Um ícone novo para o `cta`**: acrescente em `ICONES` (`src/paginas.ts`), caixa 100 × 100, com `contorno` (giz branco) e `acontece` (riscos amarelos), e o nome no tipo `Cta["icone"]` (`src/plano.ts`). O `conferir.mjs` só aceita `salvar`, `seguir`, `comentar` e `link`.
- **Um bloco novo**: escreva uma função em `src/blocos.ts` que devolve peças (`escrita`, `traco`, `rotulo`) com posição e tempo, usando as regiões do lugar, `ajustarTexto`/`quebrar` para o tamanho e os gestos comuns (`sublinhadoDuplo`, `circuloEm`, `cabecalho`). O desenho, o apagador, a espera pelo lugar livre e a passagem entre páginas vêm prontos. Consulte a skill do Remotion para as regras de animação.
