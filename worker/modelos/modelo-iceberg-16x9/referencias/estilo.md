# O estilo Iceberg (versão deitada, 16:9)

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o **mergulho**: do que todo mundo conhece ao que quase ninguém sabe, camada por camada, com a água escurecendo e um medidor contando. A versão deitada (1920x1080, o vídeo completo do YouTube) tem o mesmo estilo do vertical; só a diagramação muda, pela aula 9 do curso: a pessoa em tela cheia é a base e, nos momentos, ela vai para a janela da direita e o conteúdo ocupa o quadro da esquerda.

## 1. Dinâmica do motion
- A câmera desce de nível em nível (0,7 a 1,1 s, curva suave), chegando quando o nome é dito. Antes do primeiro nível mostra o iceberg inteiro com "?" em cada camada; no fim pode se afastar (`resumoEm`).
- O cartão do nível salta (55% a 100%) com um anel de sonar; ao sair, encolhe e fica preso ao gelo.
- Placas dos blocos: sobem 150 px da água em 0,46 s, balançam de leve e afundam na saída. A janela da pessoa afunda até 26 px quando a câmera desce.
- A troca entre tela cheia e janela leva ~0,55 s: a janela chega ~0,6 s antes do momento e a pessoa volta à tela cheia quando ele termina. Em tela cheia o vídeo fica parado, como foi gravado; na janela, ele balança com a água.
- Sempre em movimento: ondas, raios de luz, bolhas e a régua do medidor.

## 2. Organização (quadro 1920x1080)
- Respiro: a pessoa em tela cheia; a legenda centrada embaixo, com a base em y 956; a etiqueta com nome e área no canto de cima, dentro da margem.
- Momento: o mundo do iceberg ocupa a tela inteira, atrás de tudo. O **quadro** do conteúdo fica à esquerda (x 152 a 1032, y 136 a 936); a **janela** da pessoa, à direita (x 1094 a 1824, y 136 a 796); a faixa do nível, embaixo da janela (y 848 a 932). A câmera do mundo mira o centro do quadro (x 592, y 536).
- Medidor na borda esquerda: leitura em x 40 a 290, y 32 a 136; régua em y 156 a 936, com a marca na altura do centro do quadro.
- Nível: etiqueta coral, foto 700x400, nome em placa escura (até 2 linhas, 38-66 px), detalhes um a um, numa pilha centrada no quadro; se passar da altura dele, o cartão inteiro encolhe junto.
- Margens do YouTube: 96 px nas laterais; nada importante abaixo de y 984 (controles do player).

## 3. Tipografia
- Outfit (800 títulos e nomes, 700 detalhes, 500 apoio). Overpass Mono só no medidor. Nada condensado, sem contorno nas letras. Todo texto é medido pelo quadro (largura e altura) e encolhe até caber; nada vaza.

## 4. Moldura da pessoa
- Tela cheia nos respiros. Nos momentos, janela larga 730x660 à direita, cabeça inteira com o rosto no centro (acompanhado com ajuste suave pelo rastro do rosto), borda de gelo com espessura, nome e área no canto (nome masculino coerente com a pessoa), legenda na base, abaixo do queixo. O vídeo fica montado o tempo todo.

## 5. Cores e som
| Papel | Cor |
|---|---|
| céu | `#F4FBFF` a `#CBEAF6` |
| água | `#3CC3DC`, `#1683B3`, `#0C4677`, `#061F3F`, `#020B19` |
| gelo | `#FFFFFF`, `#E6F7FF`, `#B4DDEE`, `#5FA6CC`, `#173F66` |
| tinta | `#062A44` |
| ênfase (coral) | `#FF7F50` / `#C9532C` |
| sonar | `#8BEBFF` |
| alerta / certo | `#FF4F6A` / `#4FE3A8` |
- Nada de preto e dourado, nada de brilho atrás da pessoa. Sons tonais baixos em `public/sfx`: mergulho, sonar, tique, bolha, alerta, fim.

## 6. Imagens
- Foto horizontal, reconhecível de longe, sem texto nem marca. Imagem feia é pior que cartão tipográfico. Créditos CC BY vão para a descrição do vídeo, nunca na tela.

## O que não fazer
- Reordenar os níveis; mais de 6 níveis num iceberg; trocar a cor coral por momento; escrever o nome de qualquer ferramenta na tela; pôr placa ou cartão na janela da pessoa; deixar a pessoa na janela durante um respiro longo (a tela cheia é a base da aula).
