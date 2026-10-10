# Estilo do Guia (para conferir os quadros e para quem mexer no template)

O Guia é o editor que "ensina o caminho". A pessoa é um recorte sem fundo na metade de baixo; atrás dela, telas claras de aula (mapa, prints com seta, pílulas) trocam em corte seco. Sóbrio: só o que o Reel tem. Sem legenda, sem música visível, sem B-roll, sem transição.

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

## Regras da revisão do Tiago (03/10/2026)

1. **Margem segura:** laterais ≥ 64 px (≥ 6% da largura), topo ≥ 120 px, nada importante abaixo de y 1490 (interface do app; o limite geral é y 1700). Vale para título e placas do mapa, o bloco no zoom (~3x, com ≥ 120 px de folga), cartão do print (936 px a partir de y 140, 952 com a pessoa no topo), seta e rótulo (a seta troca de lado se a cauda passaria da margem; o rótulo é empurrado para dentro) e pílula do CTA (940 px). Atrás do CTA fica o último print parado no cartão dele, dentro das margens (nunca uma página sangrando pelas laterais). No zoom da placa a estrada some (não sobra fatia de estrada cortada na borda). A pessoa sangra pela borda de baixo, mas rosto e mãos que apontam ficam dentro (pose `borda` com o rosto em x 78%).
2. **Sem tarja preta:** o print preenche o cartão, que se ajusta à altura da página; nunca letterbox.
3. **Timing:** tela, zoom, print, seta e item entram na palavra que os nomeia (±0,15 s) e mostram o que é dito; `ferramentas/conferir-tempos.mjs` reprova desvios. Rótulo sem lógica com a fala é proibido.
4. **Texto cabe no fundo dele:** `encaixar` mede com as larguras da Manrope e reduz o corpo ou quebra a linha.

## Layout (quadro 1080×1920)

- Conteúdo na metade de cima (y < 860); a cabeça da pessoa entre 50% e 70% da altura; nada abaixo de y 1490 (interface do app) nem à direita de x 960.
- **Poses** (`src/poses.ts`): `dir` (rosto em x 76%), `esq` (24%), `centro` (50%) com o rosto a 62% da altura e escala 0,54 a 0,6; `topo` (miniatura em y 11,5%, a tela a cobre pela cintura); `borda` (escala 0,7, inclinada −9°, rosto em x 90%). O corpo sempre chega à borda de baixo.
- **Mapa:** título 56 a 92 px (largura 742) no alto à esquerda com a estrela de 150 px à direita (termina em x 1016), subtítulo em letra de mão 74 px, estrada serpenteando à direita, blocos empilhados (número cinza-claro 72 px com a estrela ao lado, título 28 a 38 px, detalhe 21 a 25 px) que se alternam entre a margem esquerda (x 70) e a direita (x 740), com poste e disco preto numerado na beira da estrada. **Zoom:** escala 3,0 a 3,1 centrada no bloco da placa (270 px de largura, ~850 px na tela), que cai em (540, 520); as outras placas e a estrada somem.
- **Print:** print real recortado no trecho que a fala cita (capturado em janela estreita, escala 3, texto da tela ≥ 26 px no vídeo), cartão de 936 px (952 com a pessoa no topo) com a altura da própria imagem, raio 22, sombra suave, aproximação de 1 a 1,03x; barra de navegador com o endereço quando a fala diz o site; seta vermelha de 230 px com contorno branco, ponta no ponto `x,y`, pílula vermelha ao lado da haste (não na cauda, que cai na cabeça) entrando na palavra dela. Cada print é o passo do tutorial que está sendo falado, na ferramenta real.
- **Pílula preta:** texto branco 700, cantos totalmente arredondados. **CTA:** 840 px de largura, raio 64, texto branco 800 de 52 a 96 px.

## Movimento

| O quê | Como |
|---|---|
| Troca de tela | corte seco, no quadro da palavra que a nomeia |
| Zoom da placa | corte (crop), depois aproximação lenta de 6% no momento |
| Seta | chega em 0,26 s deslizando ~60 px, curva suave sem quique |
| Pessoa muda de lugar | corte seco na troca de tela; dentro da mesma tela, desliza em 0,3 s |
| Itens de lista | entram na palavra, 0,28 s, deslizando 30 px |
| Som | "vum" tonal baixo (0,3) só no zoom da placa |
