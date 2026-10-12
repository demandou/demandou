# Estilo do Guia, versão deitada (para conferir os quadros e para quem mexer no template)

O Guia é o editor que "ensina o caminho". No quadro deitado (16:9, 1920×1080, o vídeo longo do YouTube) vale a regra da aula 9 do curso: a pessoa em tela cheia é a base e, a cada passo ensinado, corte seco para uma tela clara de aula (mapa, prints com seta, pílulas) no quadro da esquerda, com a pessoa numa moldura do lado direito. Sóbrio: sem legenda, sem música visível, sem B-roll, sem transição.

## Identidade

| Papel | Valor |
|---|---|
| Fundo | branco `#FFFFFF` |
| Tinta / apoio / linha | `#141414` / `#8C8C92` / `#D9D8D3` |
| **Marca** (estrela, números, item da vez, grifo) | laranja `#D97757` |
| Seta de clique | vermelho `#E5322D` (só setas) |
| CTA | rosa `#F0405A` (só a pílula do fim) |
| Estrada | `#2B2B2E` com faixa branca tracejada |

- Fonte: **Manrope** (600 a 800); letra de mão **Caveat** só no subtítulo do mapa. `src/medida.ts` mede, quebra e reduz o corpo.
- **Proibido:** filtro, LUT, vinheta, brilho ou desfoque sobre a pessoa; texto com contorno; legenda; transição; zoom no rosto; mais de uma cor de marca; interface desenhada à mão (print sempre real); o nome da ferramenta de edição em qualquer tela.

## Regras da revisão do Tiago (03/10/2026), no quadro deitado

1. **Margem segura:** laterais ≥ 64 px, nada importante abaixo de y 1000 (controles do player), nada dentro da moldura da pessoa. Vale para título e placas do mapa, o bloco no zoom (~2,5x, com folga no quadro da esquerda), cartão do print (936 px lógicos a partir de y 140), seta e rótulo (a seta troca de lado se a cauda passaria da margem, do topo ou da base; o rótulo é empurrado para dentro) e pílula do CTA (940 px lógicos). Atrás do CTA fica o último print parado no cartão dele, dentro das margens. No zoom da placa a estrada some. A estrada do mapa inteiro pode sangrar pela borda da esquerda e passar por trás da pessoa.
2. **Sem tarja preta:** o print preenche o cartão, que se ajusta à altura da página; nunca letterbox.
3. **Timing:** tela, zoom, print, seta e item entram na palavra que os nomeia (±0,15 s) e mostram o que é dito; `ferramentas/conferir-tempos.mjs` reprova desvios. Rótulo sem lógica com a fala é proibido.
4. **Texto cabe no fundo dele:** `encaixar` mede com as larguras da Manrope e reduz o corpo ou quebra a linha.

## Layout (quadro 1920×1080)

- **Tela cheia** (fora dos momentos): o vídeo como foi gravado, sem zoom; a câmera só corrige de leve quando a pessoa se mexe (rastro do rosto).
- **Tela de aula** (num momento): fundo branco no quadro inteiro. A **moldura** da pessoa fica à direita: x 1240 a 1840 (600 px), de y 96 até a borda de baixo (sangra, como o corpo do vertical), cantos de cima com raio 28, sem borda e sem filtro; o rosto no meio dela, ocupando ~38% da largura, a ~34% da altura visível, acompanhado de perto pelo rastro. Com o recorte sem fundo (`public/pessoa.webm`) a pessoa fica no mesmo lugar sem moldura, com o corpo chegando à borda de baixo. O **quadro** da esquerda (x 36 a 1164, y 40 a 1000) recebe a tela do bloco.
- **Camada lógica** (`src/tema.ts`): as telas são desenhadas com as medidas do vertical (1080 px de largura, o conteúdo entre y 96 e ~930, a faixa que no vertical fica acima da cabeça) e ampliadas pela `ESCALA` (~1,04) até o quadro da esquerda. Margem lógica de 64 px; base útil lógica y 930.
- **Mapa:** título 44 a 64 px (até 2 linhas, largura 782) no alto à esquerda com a estrela de 130 px à direita, subtítulo em letra de mão 60 px; a estrada deitada (asfalto de 96 px, ondulando 20 px) atravessa a tela em y ~620, entra pela borda da esquerda e segue por trás da pessoa; as placas em fileira, na ordem, alternando acima (blocos terminando em y 528) e abaixo (começando em y 732), com poste e disco preto numerado (56 px, anel branco) na beira da estrada; blocos de até 320 px (mais estreitos com 5 ou 6 placas), número cinza-claro 56 px com a estrela ao lado, título 26 a 36 px, detalhe 20 a 24 px. **Zoom:** escala de ~2,4 a 3 no bloco da placa (até 760 × 560 px lógicos), centrado no quadro da esquerda; as outras placas e a estrada somem.
- **Print:** print real recortado no trecho que a fala cita (capturado em janela estreita, escala 3, texto da tela ≥ 26 px no vídeo), cartão de 936 px lógicos com a altura da própria imagem, raio 22, sombra suave, aproximação de 1 a 1,03x; o print baixo desce para perto do meio da tela de aula; barra de navegador com o endereço quando a fala diz o site; seta vermelha de 230 px com contorno branco, ponta no ponto `x,y`, pílula vermelha ao lado da haste entrando na palavra dela. Cada print é o passo do tutorial que está sendo falado, na ferramenta real.
- **Pergunta:** as opções em fileiras de duas (não numa pilha alta).
- **Pílula preta:** texto branco 700, cantos totalmente arredondados. **CTA:** 940 px lógicos de largura, raio 72, texto branco 800 de 60 a 124 px.

## Movimento

| O quê | Como |
|---|---|
| Tela cheia ↔ tela de aula | corte seco: entra na palavra do passo, volta no fim da ideia; vão menor que 0,5 s emenda as telas |
| Troca de tela | corte seco, no quadro da palavra que a nomeia |
| Zoom da placa | corte (crop), depois aproximação lenta de 4% no momento |
| Seta | chega em 0,26 s deslizando ~60 px, curva suave sem quique |
| Pessoa | na moldura, o rosto acompanhado de perto; na tela cheia, só correções suaves |
| Itens de lista | entram na palavra, 0,28 s, deslizando 30 px |
| Som | "vum" tonal baixo (0,3) só no zoom da placa |
