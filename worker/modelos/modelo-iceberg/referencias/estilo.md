# O estilo Iceberg

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o **mergulho**: do que todo mundo conhece ao que quase ninguém sabe, camada por camada, com a água escurecendo e um medidor contando.

## 1. Dinâmica do motion
- A câmera desce de nível em nível (0,7 a 1,1 s, curva suave), chegando quando o nome é dito. Antes do primeiro nível mostra o iceberg inteiro com "?" em cada camada; no fim pode se afastar (`resumoEm`).
- O cartão do nível salta (55% a 100%) com um anel de sonar; ao sair, encolhe e fica preso ao gelo.
- Placas dos blocos: sobem 150 px da água em 0,46 s, balançam de leve e afundam na saída. A janela da pessoa afunda até 26 px quando a câmera desce.
- Sempre em movimento: ondas, raios de luz, bolhas e a régua do medidor.

## 2. Organização
- Conteúdo em y 150-980 (x 60-1020); janela da pessoa em y 1000-1560. Medidor à esquerda: leitura em y 150-270, régua em y 290-990.
- Nível: etiqueta coral, foto 700x400, nome em placa escura (até 2 linhas, 38-66 px), detalhes um a um.
- Nada acima de y 110 nem importante abaixo de y 1540.

## 3. Tipografia
- Outfit (800 títulos e nomes, 700 detalhes, 500 apoio). Overpass Mono só no medidor. Nada condensado, sem contorno nas letras.

## 4. Moldura da pessoa
- Janela larga 940x560, cabeça inteira, borda de gelo com espessura, nome e área no canto (nome masculino coerente com a pessoa), legenda na base, abaixo do queixo. Segue o rosto. O vídeo fica montado o tempo todo.

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
- Foto horizontal, reconhecível de longe, sem texto nem marca. Imagem feia é pior que cartão tipográfico. Créditos CC BY vão para a legenda do post, nunca na tela.

## O que não fazer
- Reordenar os níveis; mais de 6 níveis num iceberg; trocar a cor coral por momento; escrever o nome de qualquer ferramenta na tela.
