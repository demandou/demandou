# Estilo do Multicâmera (para conferir os quadros e para quem mexer no template)

O Multicâmera é a edição de um canal de YouTube bem feito: parece gravado com várias câmeras e organizado em capítulos. Nada chamativo. Se um quadro parece "editado demais", está errado.

## Identidade

| Papel | Valor |
|---|---|
| Tarjas e painéis | grafite `#16181D`, trilho `#2A2E36` |
| Texto | branco; apoio `#A7ADB7` |
| **Destaque** (número do capítulo, traço, alerta) | vermelho "no ar" `#FF4A3D`, a única cor de destaque |
| Texto sobre o vídeo | branco, sombra `0 2px 12px rgba(0,0,0,.55)` |
| Painéis | raio 10 px, sombra `0 12px 32px rgba(0,0,0,.30)` |

- Fonte: **Onest** (500 a 800). Larguras reais em `src/larguras.ts`; `src/medida.ts` mede, quebra e reduz o corpo.
- Tamanhos: capítulo ~38 px (700); legenda ~44 px; abertura 54–88; nada abaixo de 24 px.
- **Proibido:** filtro, LUT, vinheta, brilho, desfoque ou cor sobre o vídeo da pessoa; texto com contorno; preto e dourado; mais de uma cor de destaque; tremer, girar, piscar, quicar.

## Layout (quadro 1080×1920)

Calculado a partir do rosto (`src/tema.ts → medidas`), igual para qualquer gravação:
1. **Rosto**: na altura gravada, nunca coberto, nas duas câmeras.
2. **Tarjas e painéis**: do queixo no plano fechado + folga até a legenda (ou até y 1490 sem legenda), de x 64 a x 960.
3. **Legenda**: embaixo das tarjas, a última linha termina em y 1446.
4. **Tarja de nome**: alto à esquerda, só no começo.
5. **Câmera C**: a foto cobre tudo (ou entra inteira sobre fundo borrado dela); a legenda continua por cima; o rótulo fica no alto.

## Movimento

| O quê | Como |
|---|---|
| Câmera | aberto 1,0 ↔ fechado 1,3 em cada corte; capítulo abre no aberto; médio 1,15 só para evitar repetição |
| Ênfase | aproxima devagar (seno) até o próximo corte, no máximo ~5% (6% em 2 s) |
| Câmera C | corte seco; a foto se move ~6% |
| Tarja e painel | máscara em 0,4 s sem quique; saída 0,2 s |
| Texto falado | cada palavra aparece na hora em que é dita |
| Número | conta de 0 ao valor em 1 s |
| Som | "toc" tonal baixo na entrada da câmera C; nada mais |

## Conferência dos quadros (olhe a ~360–540 px de largura)

- O rosto está livre em todos os quadros, inclusive no plano fechado?
- Dois quadros de cortes vizinhos têm câmeras diferentes?
- A tarja de capítulo está legível e sem encostar na legenda? A legenda tem 1 linha e não junta frases?
- A imagem da cena é **aquilo** que foi dito, sem marca, logo ou gente reconhecível? Nítida em tela cheia?
- Nas trocas, nenhum quadro com dois textos sobrepostos; nenhum painel vazio parado?
- Nada abaixo de y 1490 nem na faixa dos botões à direita?
- A cor da pessoa está igual à da gravação?

## Onde mexer no template

| Arquivo | O quê |
|---|---|
| `src/tema.ts` | cores, fonte, zooms (ABERTO/FECHADO/MEDIO), limites da interface, cálculo das faixas |
| `src/camera.ts` | a mesa de corte: câmera de cada trecho e aproximação lenta |
| `src/componentes/Assinatura.tsx` | `cena`, `capitulo` e a tarja de nome |
| `src/componentes/Blocos.tsx` | os 11 blocos universais |
| `src/componentes/Legenda.tsx`, `Pecas.tsx`, `Texto.tsx` | legenda, tarjas/painéis, texto falado |
| `ferramentas/justar.mjs` | cortes justos nas pausas reais |
