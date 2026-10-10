# Estilo da Órbita (para conferir os quadros e para quem mexer no template)

A Órbita é uma aula de ciências de documentário em Reel vertical: a pessoa fala, o fundo vira espaço profundo em 3D e a câmera se move pela escala na palavra. Nasceu do trecho do professor de ciências do Reel "Conteúdo 2.0" do Tiago (a virada com troca de roupa, o recuo da Terra até o Sol, o Sol que apaga quando as mãos caem, o céu com o tempo da luz de cada corpo). Entrega **MP4 vertical 1080×1920**. Se um quadro parece "cheio", colorido demais ou "efeito de PowerPoint", está errado: é escuro, limpo e com um destaque só.

## Identidade

| Papel | Valor |
|---|---|
| Espaço (fundo) | degradê `#0A0E1C` → `#05070F` → `#04050A`; estrelas brancas, algumas quentes e algumas frias, com a faixa discreta da Via Láctea, piscando de leve |
| **Destaque** (Sol, luz, traços, nome da virada, valores) | laranja do Sol `#D97757`; claro `#F0A27F`; quente `#FFE6DA` (a luz e o fóton) |
| Texto | `#FFF8F2`; apoio `rgba(255,248,242,0.66)`; fraco `rgba(255,248,242,0.32)`; linhas e cotas `rgba(255,240,228,0.42)` |
| Alerta | brasa `#FF6A4D` |
| Moldura | cantos de 44 px, borda interna de 1,5 px `rgba(255,250,240,0.5)`, sombra `0 30px 80px rgba(0,0,0,0.6)`, **fundo natural** do vídeo |

- Fontes: **Sora** 500–800 para tudo que se lê (títulos 800, tracking −0,02 a −0,025em); **IBM Plex Mono** 500/600 só para números, relógios e contadores. Nunca condensada. `src/medida.ts` mede com a fonte real, quebra em linhas equilibradas e reduz o corpo até o mínimo; nunca vaza.
- Legenda: Sora 800, 66 px, branca, contorno preto de 10 px por trás (`paintOrder: stroke fill`) e sombra leve; blocos de até 3 palavras (~18 letras); cada palavra sobe pela máscara quando é dita. Centro em y 1330 no quadro cheio e y 1420 na moldura (no peito, abaixo do queixo).
- **Proibido:** mexer na cor do vídeo da pessoa (filtro, brilho, halo ou luz atrás dela; o feixe do `raio` é a única luz que toca o rosto, e de leve), preto com dourado, mais de uma cor de destaque, palavra colorida na legenda, logo ou marca real (inclusive no símbolo da moeda), número que não foi dito, a palavra "Remotion" na tela.

## Layout (quadro 1080×1920)

1. **Margens:** 64 px nas laterais, nada importante acima de y 120 nem abaixo de y 1700 (a moldura vai até 1856, mas o rosto e a legenda ficam bem acima).
2. **Quadro cheio** (fora do espaço): o rosto no eixo do meio, o zoom troca a cada corte (1,00 ↔ 1,12, mais um empurrão de 1,5% dentro do trecho). A pergunta da virada fica em cima da cabeça (y 220 a 440).
3. **No espaço:** a pessoa na moldura (x 64, y 800, 952 × 1056), rosto a ~30% da altura dela; a informação na faixa de y 150 a 760.
4. **A cena de escala:** origem no alto à esquerda (centro ~x 164, raio ~200 px, pode passar da borda), destino à direita (~x 880, y 560), caminho da luz entre eles, cota paralela ao caminho, relógio no alto à direita (rótulo de 30 px, número em mono de 132 px), aviso embaixo do destino, alinhado à direita.
5. **O céu:** até 4 corpos em lugares fixos (embaixo à esquerda, à direita, no meio, no alto à direita), cada um com "Nome · valor" embaixo.
6. **Blocos universais:** centralizados na faixa de cima; listas com os corpos à esquerda e os textos à direita.
7. **Com `recorte`:** a pessoa sem moldura, um pouco maior, com o rosto perto de y 985, na frente das estrelas; a cena de escala fica na altura original (sem subir).

## Movimento

| O quê | Como |
|---|---|
| Entrada no espaço | a pessoa encolhe para a moldura em 0,9 s (ease in-out) enquanto a câmera 3D recua de colada no destino até o plano geral em 1,15 s (zoom exponencial, parece contínuo); no `mergulho`, vem de muito longe |
| Dentro da órbita | o fóton viaja com rastro; a luz flui em traços pelo caminho aceso; o relógio conta; o destino dá um "ping" quando a luz chega; a câmera se afasta mais 4,5% até o fim |
| O evento | `apaga`: o Sol respira (+8%) e apaga em brasa em 0,7 s; o calor em volta some; a frente de onda (arcos) viaja e o destino escurece quando ela chega. `acende`: o inverso, com um clarão. `explode`: clarão, o corpo incha, onda de choque e fragmentos |
| Troca de bloco | a câmera sobe 9 unidades em 0,85 s (grua): o bloco que sai desce, o novo entra por cima, as estrelas passam |
| Textos | sobem 18 px saindo de 8 px de desfoque, palavra por palavra; ao terminar, o texto final fica limpo (sem máscara) |
| Corpos | entram crescendo (0,85 → 1) e aparecendo em 0,4 s; giram devagar; nas listas, andam no arco de órbita |
| Virada | a pergunta: "E se eu fosse" sobe da máscara, o nome entra letra por letra (22 ms entre letras), o complemento sobe; tudo sai com desfoque quando a linha de luz desce (0,6 s, com um brilho na frente dela) |
| Saída do espaço | a pessoa volta ao quadro cheio em 0,6 s |

## Som

Tonal, raro e bem abaixo da voz: `virada.wav` (cristal) 0,25 s antes da linha de luz; `recuo.wav` na entrada da órbita; `apaga.wav` (desligar e queda grave) no evento; `acende.wav` (o mesmo ao contrário, subindo até a palavra); `explode.wav` (impacto grave); `ceu.wav` quando a câmera sobe para o céu; `passa.wav` (baixinho) na grua entre blocos; `tom.wav`/`tom2.wav` alternados nos itens; `numero.wav` quando o número termina de contar. Nunca sino, nunca ruído branco. Música só com `trilha` (sem batida, ~12 dB abaixo da voz).

## O que olhar nos quadros

- A pessoa: cabeça inteira na moldura, com folga; o rosto não sai do lugar quando ela se mexe; cor do vídeo intacta.
- O espaço: escuro de verdade (sem cinza lavado), estrelas finas, o Sol com o calor em volta e a granulação; a Terra com o lado de dia virado para o Sol.
- A informação: dentro da faixa de cima, sem encostar nas bordas nem descer para a moldura; uma coisa por vez; números só os ditos.
- A troca: nenhum quadro com dois blocos um sobre o outro (a grua leva o de baixo para fora).
- O evento: cai na palavra (ou no gesto); a última frente chega no destino na palavra seguinte.
