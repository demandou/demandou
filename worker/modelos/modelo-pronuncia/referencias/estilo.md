# Estilo Pronúncia: o que cada peça faz e por quê

Para quem vai ajustar o modelo ou explicar o visual ao usuário. O código está em `src/` do template: `tema.ts` (cores e fontes), `layout.ts` (estados da tela e a câmera lenta), `componentes/Ficha.tsx` (a ficha de som), `componentes/CameraLenta.tsx` (a repetição com a lupa), `componentes/Ponto.tsx` (o ponto que pula e o traço do certo), `componentes/Cartoes.tsx` (cartões no peito) e `componentes/Painel.tsx` (listas, comparação e gráfico no painel).

## A ideia

Um estúdio de dicção: o som desenhado na tela. A palavra é desmontada, a parte forte é marcada por um ponto que pula como o ritmo da voz, e a própria pessoa repete devagar com a boca ampliada. Limpo, editorial, sem emoji e sem enfeite.

## 1. Dinâmica do motion

- **O ponto coral** (raio 11 a 16 px) é a assinatura em todos os blocos: salta em arco para a palavra ou sílaba que está sendo dita (0,2 s) e pousa achatando de leve. Na ficha, passa pelas sílabas faladas e para na forte; na câmera lenta, acompanha as sílabas medidas na voz.
- Entradas firmes, sem quique: subir 12 a 26 px com opacidade (0,22 a 0,3 s). Quando a entrada termina, o texto fica desenhado simples.
- **Risco** (errado, letras mudas): uma linha coral que corre da esquerda para a direita em 0,3 s; o texto riscado apaga.
- **Traço do certo**: uma curva desenhada à mão, coral, 7 px, que se desenha em 0,4 s embaixo da leitura (e do `destaque` chave, e do vencedor da comparação).
- **Câmera lenta**: corte seco de zoom (0,12 s) para a tela inteira com aproximação de 16%; a lupa abre em 0,24 s; o véu violeta, a palavra e a onda entram só quando a pessoa já cobriu a tela; tudo sai 0,12 s antes da volta.
- **Cortina** entre fichas: uma faixa violeta-clara de 150 px com borda coral de 8 px atravessa o painel em 0,42 s.
- Ritmo: algo novo a cada 0,5 a 2 s (sílaba, risco, traço, nota, foto, ponto).

## 2. Organização e hierarquia

- Ficha (de cima para baixo): cabeçalho ("1 de 3" à esquerda, idioma · sotaque à direita) → a palavra (o maior elemento da tela) → fonética + nota → "não é" riscado → jeito de ler com traço; a foto no canto direito das duas linhas.
- Painel (listas, comparação, gráfico): rótulo lilás + título no topo, o corpo embaixo; o item dito fica creme, os outros mais claros.
- Cartão no peito: rótulo lilás em caixa alta, o texto grande, o detalhe menor em lilás.

## 3. Tipografia

- **Manrope** 800 para a palavra, os títulos e os itens; 700 para o errado e textos de apoio; caixa alta espaçada (0,13 em) nos rótulos. Espaçamento levemente fechado (−0,015 a −0,02 em), nunca condensado.
- **Charis SIL** para a fonética (todos os símbolos do alfabeto fonético). Não use outra fonte nela.
- Tamanhos: palavra 64–190 px; títulos ≥ 72 px; texto ≥ 44 px; rótulos ≥ 32 px; nada abaixo de 30 px.
- Todo texto é medido no navegador do render (`measureText` com a fonte carregada) e reduzido até caber.

## 4. Moldura da pessoa

- Tela cheia: rosto no lugar do enquadramento, cartão violeta logo abaixo do queixo.
- Moldura larga embaixo: x 36, y 1046, 1008 × 838, cantos de 44 px, borda creme fina, nome numa etiqueta violeta no canto. Cabeça inteira, ombros e um pouco do peito.
- Câmera lenta: tela inteira, 16% mais perto; a lupa (raio 150–250 px, aumento 2,1×) fica a ~0,35 largura de rosto abaixo do centro do rosto (a boca) e segue o rastreio; aro creme de 10 px com anel coral por dentro e um cabo curto.
- Nunca coluna estreita; nunca a pessoa solta num fundo vazio durante a troca.

## 5. Cores, textura e som

| Papel | Cor |
|---|---|
| Fundo dos painéis e cartões | violeta profundo `#1D1550` (cartão a 94%) |
| Faixa da cortina, pílulas | `#271D66` |
| O que se lê | creme `#FBF6EE` |
| O som: ponto, sílaba forte, traço, risco, nota | coral `#FF5C7A` |
| Apoio: rótulos, fonética, separadores | lilás `#B3A8EC` |
| Riscado / apagado | creme a 34% |

Sons (em `public/sfx/`, tonais e raros): `certo.wav` (duas notas subindo), `lenta.wav` (um tom que desce, baixo), `nota.wav` (uma nota curta), `fim.wav` (acorde suave). Nada de ruído, sino ou "whoosh".

## O que pode mudar por vídeo

- Idioma e sotaque de cada ficha; os textos fixos (`rotulos`) para um vídeo em espanhol.
- A velocidade da câmera lenta (pela pausa, ou forçada).
- Com ou sem foto, com ou sem "não é", com ou sem nota.

## O que não mudar sem o usuário pedir

- A paleta, as duas fontes e o ponto coral.
- A pessoa na moldura larga embaixo nas fichas (nunca numa coluna lateral).
- A câmera lenta com a voz da própria pessoa (nunca voz sintética).
- Nenhum emoji na tela; nenhum "Remotion" escrito.

## Se precisar de algo que o modelo não tem

Use o bloco universal mais próximo (`references/adaptar.md`). Para uma palavra sem repetição, a ficha funciona sem `lenta`. Para várias palavras curtas sem explicação, um `repita` ou um `topicos` cobre melhor que muitas fichas seguidas.
