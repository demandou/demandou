# Estilo Ao Pé da Letra: o que cada peça faz e por quê

Para quem vai ajustar o modelo ou explicar o visual ao usuário. O código está em `src/` do template: `tema.ts` (cores e fontes), `layout.ts` (estados da tela), `componentes/Literal.tsx` (as duas fichas, o carimbo e a expressão digitada), `componentes/Legendas.tsx` (a legenda bilíngue), `componentes/Ponto.tsx` (o ponto que pula e o traço do certo), `componentes/Cartoes.tsx` (cartões no peito) e `componentes/Painel.tsx` (listas, comparação e gráfico no painel).

## A ideia

Um carimbo de correio aéreo: o literal é descartado com um NÃO vermelho e o sentido de verdade vem na ficha do lado. O humor mora no contraste entre as duas imagens (um balde azul contra um par de botas velhas). Papel creme sobre vermelho, faixas diagonais de carta internacional, sem emoji de rosto e sem enfeite que não seja a imagem.

## 1. Dinâmica do motion

- **A expressão digitada**: letra por letra (~16 por segundo), com cursor azul-céu que pisca; o texto fica entre aspas.
- **As fichas**: a vazia já está na tela, tracejada, com um "?". Quando o texto é dito, a imagem se revela da esquerda para a direita (0,35 s) com aproximação lenta, e o texto se monta palavra por palavra. O objeto 3D (emoji de coisa) entra como adesivo com um leve salto e flutua.
- **O carimbo**: NÃO em 112 px, rotacionado −13°, borda vermelha de 11 px, fundo creme a 90%. Entra de 2,3× para 1× em 0,2 s com desaceleração forte, a ficha treme ~5 px por 0,35 s e a imagem perde 55% da cor.
- **O giro de carta**: a ficha da direita fecha em X até zero, troca o conteúdo no meio e abre (0,4 s). O passo `certo` ganha moldura azul de 9 px e um traço desenhado à mão (0,45 s).
- **Cortina** entre dois painéis: faixa vermelho-escura de 150 px com borda azul que atravessa em 0,42 s.
- Ritmo: algo novo a cada 0,5 a 2 s (letra, imagem, texto, carimbo, passo).

## 2. Organização e hierarquia

- Painel (de cima para baixo): rótulo "EXPRESSÕES" em pêssego → a expressão digitada (a maior coisa, mono) → as duas fichas de 462 × 722 px lado a lado (rótulo, imagem 418 × 372, texto, detalhe). As fichas ocupam o painel até y ≈ 985; a moldura da pessoa começa em y = 1046.
- Esquerda é sempre "ao pé da letra" (texto em azul-cobalto); direita é sempre o sentido (texto em tinta).
- Cartão no peito: rótulo pêssego em caixa alta, o texto grande, o detalhe menor.

## 3. Tipografia

- **Be Vietnam Pro** 800/900 para os textos, 700 para a legenda comum e os detalhes; caixa alta espaçada (0,07 a 0,12 em) nos rótulos. Nunca condensada.
- **Roboto Mono** 700 só para a expressão digitada.
- Tamanhos: expressão 50–92 px; texto das fichas 36–64 px; detalhe 36 px; rótulos ≥ 27 px; legenda 52 px.
- Todo texto é medido no navegador do render (`measureText` com a fonte carregada) e reduzido até caber.

## 4. Legenda bilíngue

Faixa de tinta com cantos arredondados, 52 px. O português em creme (peso 700); os trechos de `idioma2` em azul-céu (peso 900). A palavra dita fica acesa e as seguintes a 42%. Nos painéis, a legenda fica na moldura, a ~1664 px, abaixo do queixo; em tela cheia, abaixo do cartão da zona. Some durante cartões de tela cheia (eles já mostram o texto).

## 5. Moldura da pessoa

- Tela cheia: rosto no lugar do enquadramento, cartão de tinta logo abaixo do queixo.
- Moldura larga embaixo: x 36, y 1046, 1008 × 838, cantos de 44 px, borda creme fina, nome numa etiqueta de tinta no canto. Cabeça inteira, ombros e um pouco do peito.
- Nunca coluna estreita; nunca a pessoa solta num fundo vazio durante a troca.

## 6. Cores, textura e som

| Papel | Cor |
|---|---|
| Fundo dos painéis (vermelho-carimbo) | `#E5402A` |
| Cortina | `#C3301D` |
| Cartão no peito e legenda (tinta azul-noite, 95%) | `#171430` |
| O que se lê sobre vermelho e tinta (creme) | `#FFF5E6` |
| Apoio: rótulos (pêssego) | `#FFD2C2` |
| Outra língua na legenda, ponto, ênfase (azul-céu) | `#8DBEFF` |
| Papel das fichas | `#FFF5E6` (fundo da imagem `#F3E4CC`) |
| Inglês nas fichas, rótulo "o que quer dizer", o certo (azul-cobalto) | `#2355E8` |
| Carimbo NÃO | `#D4261A` |

Textura: a faixa diagonal de correio aéreo (vermelho · creme · azul) no topo das fichas e dos cartões. Sons (em `public/sfx/`, tonais e raros): `carimbo.wav` (batida grave que desce), `certo.wav` (duas notas subindo), `nota.wav` (uma nota curta), `fim.wav` (acorde suave). Nada de ruído, sino ou "whoosh".

## O que pode mudar por vídeo

- Os textos fixos (`rotulos`) para um vídeo em espanhol ou outro tom.
- Quantos passos tem a ficha da direita (1 a 3) e qual deles é o `certo`.
- Com imagem ou com o cartão azul de texto.

## O que não mudar sem o usuário pedir

- A paleta, as duas fontes e o carimbo NÃO.
- A pessoa na moldura larga embaixo nos painéis (nunca numa coluna lateral).
- Nenhum emoji de rosto na tela; nenhum "Remotion" escrito.

## Se precisar de algo que o modelo não tem

Use o bloco universal mais próximo (`references/adaptar.md`). Para um único contraste sem imagens, um `comparacao` `errado-certo` cobre; para um termo e seu significado, `definicao`.
