# Estilo do Palco (para conferir os quadros e para quem mexer no template)

O Palco é o editor que "mostra". A pessoa fala em quadro cheio; quando cita algo que dá para ver, o assunto ocupa a tela como num palco aceso, com anotações limpas no ponto citado, e a pessoa vira uma janela arredondada num canto de baixo. Sóbrio: se um quadro parece "editado demais", está errado.

## Identidade

| Papel | Valor |
|---|---|
| Palco (fundo atrás do painel e da janela) | `#131518` |
| Painel / painel claro (listas, cartões) | `#1D2024` / `#272B30` |
| Linha | `#353A41` |
| Texto / apagado | `#F2F1ED` / `#8D939C` |
| **Destaque** (anotações, tarja da palavra, marcadores, sublinhado) | azul-cobalto `#3D7BFF` — a única cor de destaque |
| Marca-texto | o mesmo azul a 42% |
| Texto sobre o vídeo | claro com sombra `0 2px 14px rgba(0,0,0,.55)` |

- Fonte: **Manrope** (600 a 800), bem legível. Larguras reais em `src/larguras.ts`; `src/medida.ts` mede, quebra e reduz o corpo.
- Tamanhos: legenda 44–62 px no modo (a) e 36–46 no palco; abertura 54–88; títulos do palco 26–38; etiquetas das anotações 32; listas 32–60; número até 300; nada abaixo de 24 px.
- **Proibido:** filtro, LUT, vinheta, brilho, desfoque ou cor sobre o vídeo da pessoa; texto com contorno; preto e dourado; mais de uma cor de destaque; tremer, girar, piscar, quicar; a janela cobrir o ponto anotado.

## Layout (quadro 1080×1920)

Modo (a), calculado a partir do rosto (`src/tema.ts → medidas`): rosto livre; legenda logo abaixo do queixo no zoom mais fechado; chip e cartões de fala abaixo dela; nada abaixo de y 1490 (interface do app) nem à direita de x 960 (botões).

Modo (b), o palco (constantes `PAINEL` e `JANELA` em `src/tema.ts`):
- **Painel**: x 36, y 150, 1008×1000, raio 34. Foto "cobrir" (enquadrada pelo foco) ou print "inteira" (sem corte).
- **Janela da pessoa**: 360×450, raio 40, num canto de baixo (y 1040 a 1490), sobre a borda de baixo do painel (cobre só os 110 px de baixo dele). Mostra cabeça e ombros inteiros, seguindo o rosto. Canto esquerdo x 36, direito x 684.
- **Legenda**: ao lado da janela, abaixo do painel, até 2 linhas, alinhada à esquerda. Nunca sobre a borda de uma moldura.
- **Título do palco**: etiqueta escura no alto à esquerda do painel; **rótulo** da imagem: pílula clara no canto de baixo oposto à janela.

## Movimento

| O quê | Como |
|---|---|
| Entrar no palco | 0,2 s antes da fala, a pessoa encolhe para a janela em 0,5 s (curva macia, sem quique) enquanto o painel se revela atrás; sai do mesmo jeito |
| Várias páginas seguidas (menos de 0,6 s entre elas) | a pessoa não volta ao quadro cheio: a página nova desliza da direita e cobre a anterior (opaca); a janela troca de canto só se uma anotação cair no canto dela |
| Foto no painel | aproxima ~4,5% (print 1,5%) no tempo da página, ancorada no foco; as anotações andam junto |
| Círculo | desenhado em 0,5 s, uma volta e um pouco mais |
| Seta | haste curva em 0,38 s, depois a ponta; etiqueta na cauda |
| Marca-texto | faixa azul revelada da esquerda em 0,4 s |
| Foco | o quadrado de foco fecha no ponto |
| Xis | dois traços cruzados sobre o que não deve estar ali |
| Segunda imagem | o painel se divide: a primeira sobe para a metade de cima, a segunda entra embaixo |
| Câmera no modo (a) | 1,0 / 1,12 / 1,24 trocando em cada corte e na volta do palco, nunca o mesmo duas vezes; aproximação lenta em trecho longo |
| Som | um "vum" tonal baixo quando o palco abre (`"sfx": false` desliga); mais nada |

## Conferência dos quadros (olhe a ~540 px de largura)

- Rosto livre no modo (a), inclusive em zoom 1,24? Cabeça inteira, com folga em cima, na janela?
- A janela não cobre nenhum ponto anotado nem o título?
- A anotação está **no ponto citado** (círculo na janela, seta no talher)? Uma anotação por palavra dita, no tempo da palavra?
- A legenda no palco está ao lado da janela, em até 2 linhas, sem encostar na borda do painel nem da janela?
- A imagem é aquilo que foi dito, nítida, sem marca, logo ou gente reconhecível?
- Nas trocas (a cada 0,05 s em volta de entrada e saída do palco): nenhum quadro vazio, nenhum texto sobre outro?
- A cor do vídeo da pessoa está igual à da gravação?

## Onde mexer no template

| Arquivo | O quê |
|---|---|
| `src/tema.ts` | cores, fonte, zooms, `PAINEL`, `JANELA`, limites da interface |
| `src/cenas.ts` | quando o palco abre e fecha; junção de páginas seguidas |
| `src/palco.ts` | modo em cada instante, caixa da pessoa, geometria da foto no painel |
| `src/camera.ts` | o zoom de cada trecho no modo (a) |
| `src/componentes/Palco.tsx` | painel, troca de páginas, título, rótulo, foto + anotações |
| `src/componentes/Anotacoes.tsx` | círculo, seta, marca-texto, foco, xis |
| `src/componentes/BlocosPalco.tsx` | listas, passos, número, comparação, gráfico, definição dentro do painel |
| `src/componentes/BlocosFala.tsx` | abertura, frase, pergunta, cta, chip (modo a) |
| `src/componentes/Legenda.tsx` | a legenda nos dois modos |
| `ferramentas/justar.mjs` | cortes justos nas pausas reais |
