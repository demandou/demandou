# O estilo Autoridade

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a contenção; quase toda "melhoria" que adiciona coisa piora o resultado. O estilo vale para qualquer assunto: o que muda de um vídeo para outro é o conteúdo dos blocos, nunca a linguagem.

## A ideia

Um especialista falando com calma. A edição se comporta como o projeto gráfico de uma revista séria: aparece quando tem algo a dizer, some quando não tem. Quando a fala se apoia em algo concreto (uma lei, um estudo, uma ficha, uma receita, o plano de uma aula), ele vira um documento de papel citado na página.

## Motion

- **Entrada:** o texto sobe de trás de uma máscara e assenta (curva `bezier(0.16, 1, 0.3, 1)`, ~0,35 a 0,6 s). Títulos, frases, perguntas e chamadas sobem **palavra por palavra**, cada palavra no instante em que é dita; o lugar de cada palavra é reservado antes (nada pula). Terminada a subida, a palavra é texto simples (sem máscara).
- **Papel:** o cartão de papel sobe ~70 px e aparece; enquanto está na tela, aproxima de leve (até 1,8%), para a câmera não parar. Nos cartões de opção, o papel sobe de baixo e cobre o cartão quando a opção é dita; o perdedor devolve o papel.
- **Traços:** filetes de latão, fios entre passos, sinal de alerta, ícones, a curva do gráfico: tudo se desenha da esquerda para a direita (ou ao longo do caminho).
- **Marca-texto e risco:** o marca-texto de latão passa por trás das palavras como uma caneta, proporcional à largura de cada palavra; o risco de lacre corta o trecho quando ele é dito, e o trecho apaga um pouco.
- **Números:** contam até o valor dito em ~1,3 s, acelerando e freando como uma apuração; números de um algarismo só sobem (as barrinhas fazem a contagem).
- **Saída:** o bloco apaga subindo 14 px em 0,24 s e termina **antes** de o próximo começar. Nunca dois blocos ao mesmo tempo, nunca duas páginas de texto sobrepostas.
- **Pessoa:** zoom em troca seca (1 ↔ 1,05) nos cortes e nas fronteiras dos momentos, sempre partindo do rosto.
- Sem quique, sem elástico, sem giro, sem brilho, sem flash, sem tremida.

## Organização e hierarquia

- **Um destaque por vez**, centralizado na zona da altura do peito (abaixo do queixo, acima da legenda). Blocos grandes (gráfico, documento, lista longa) podem subir até 90 px acima da zona, sempre abaixo do queixo.
- **Uma coisa grande por bloco**: o número, o título, o termo, a frase. O resto é menor (rótulo, detalhe, letreiro).
- **Letreiro** (Inter 600, caixa alta, espaçamento 0,22 em) para o tema, a fonte do documento e os rótulos dos lados.
- **Listas**: uma linha por item, fio fino entre eles; o item atual em marfim cheio, os anteriores recuam (42% mais apagados). Tópicos com travessão de latão; passos com numerais de latão ligados por um fio. Lista ou ficha que não cabe **rola** (o item novo entra embaixo, o primeiro sai inteiro por cima); o texto nunca fica pequeno demais.
- **Documento** (`citacao`, `definicao`, `grafico`): papel marfim com filete de latão de 6 px em cima, sombra suave; fonte em letreiro, título serifado, fio fino, conteúdo. Ficha com linhas pautadas a lápis antes de serem ditas: o papel nunca fica em branco.

## Tipografia

- **Instrument Serif** (regular e itálico): títulos, números, listas, documentos, frases. O itálico é a ênfase (sempre em latão).
- **Inter** (500 e 600): letreiros em caixa alta espaçada, detalhes, rótulos de gráfico, legenda.
- Medidas no quadro de 1080 de largura: títulos de 72 a 132 px; número até 380 px; texto de corpo ≥ 44 px; detalhe ≥ 40 px; letreiros e rótulos de gráfico ≥ 30 px (nunca abaixo de 28).
- Todo texto é medido com a própria fonte (`src/medida.ts`) e reduzido até o mínimo, em até 2 ou 3 linhas equilibradas. Palavra comprida demais desce até 80% do mínimo, nunca vaza.

## Moldura da pessoa

- Quadro cheio, rosto na linha vertical do centro; o quadro segue o rosto quando a pessoa se mexe (rastreio do motor).
- Nada cobre o rosto. Nada no topo.
- Gravação horizontal ou com a pessoa baixa (ou muito perto da câmera) vira recorte 3:4: a pessoa sobe, a base vira fundo tinta e os blocos entram na faixa entre o peito e a base. É o mesmo estilo.
- Um degradê escuro sobe na metade de baixo só enquanto há texto para ler.

## Cores, textura e som

| Papel | Cor | Uso |
|---|---|---|
| tinta | `#0E1726` | fundo, texto sobre o papel |
| papel | `#F2ECDF` | texto sobre o escuro, cartões |
| latão | `#B9975B` / `#D6B57C` | a ênfase: itálico, filetes, numerais, o dado principal, o marca-texto. Uma coisa dourada por bloco |
| lacre | `#C8664E` | **só** alerta, risco e o lado errado. Nunca em texto corrido |

- Sem contorno nas letras (só uma sombra suave para ler sobre roupa clara), sem brilho atrás da pessoa, sem gradiente colorido.
- Som quase ausente e tonal (`public/sfx/`): `tom.wav` (grave) no número, no alerta, no vencedor e no fechamento; `papel.wav` (deslizar grave) quando o papel entra; `tique.wav` (nota curta) em cada item, opção, lado ou dado. Dois sons a menos de 0,25 s viram um. Nada de ruído, clique agudo ou sino; nada em cima da fala.

## O que pode mudar por vídeo

- Textos, tempos e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área).
- O recorte (9:16, 3:4, 4:5 ou 1:1), escolhido pelo `cortar.mjs` a partir do rosto e do queixo.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores, fontes e tamanhos. Se o usuário pedir as cores da marca dele, troque **só** o latão (e o latão claro) em `src/tema.ts`; tinta e papel seguram a sobriedade.
- A posição dos blocos (nada no topo, nada sobre o rosto, nada colado nas bordas).
- A regra de um destaque por vez.
- Não adicione emojis, stickers, barras de progresso, tremidas, flashes, molduras coloridas ou transições entre cortes. Eles pertencem a outros modelos.

## Se precisar de algo que o modelo não tem

- Um ícone novo: adicione o traço em `src/componentes/Icones.tsx` (viewBox 48×48, só linhas, espessura 1,6) e o nome em `src/plano.ts`.
- Um bloco novo: siga a gramática acima (entrada por máscara com `Linha` ou `Palavras`, saída com `Bloco`, papel com `Papel`, texto medido com `encaixar`/`encaixarNaCaixa`, cores de `tema.ts`, tudo dentro da zona) e consulte a skill do Remotion para as regras de animação.
