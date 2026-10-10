# Estilo do Yap (para conferir os quadros e para quem mexer no template)

O Yap é o "editor que entende de recursos": nada de efeito chamativo. A pessoa e a fala são o vídeo; o ritmo vem dos cortes justos e da câmera; as imagens entram com inteligência quando algo concreto é dito. Se um quadro parece "editado demais", está errado.

## Identidade

| Papel | Valor |
|---|---|
| Papel (cartões, pílulas, etiquetas) | `#F7F6F2` |
| Tinta (texto nos cartões, pílula de alerta) | `#15171B` |
| Apoio (rótulos, títulos pequenos) | `#6B6F76` |
| Linha (marcadores passados, contornos) | `#E2E0D9` |
| **Destaque** (tarja da palavra, marcadores, traços) | lima `#D9F45F` — a única cor de destaque |
| Texto sobre o vídeo | branco, sombra `0 2px 14px rgba(0,0,0,.55)` |
| Cartões | raio 30 px, sombra `0 16px 40px rgba(0,0,0,.30)` |

- Fonte: **Plus Jakarta Sans** (500 a 800). Larguras reais da fonte em `src/larguras.ts`; `src/medida.ts` mede, quebra e reduz o corpo.
- Tamanhos: legenda 44–62 px (800); abertura 54–88; frase 40–70; número até 150; chip 36–62; rótulos e etiquetas 34–42 (700); nada abaixo de 24 px.
- **Proibido:** filtro, LUT, vinheta, brilho, desfoque ou cor sobre o vídeo da pessoa; texto com contorno; preto e dourado; mais de uma cor de destaque; tremer, girar, piscar, quicar.

## Layout (quadro 1080×1920)

Calculado a partir do rosto (`src/tema.ts → medidas`), igual para qualquer gravação:

1. **Rosto**: na altura em que foi gravado (o `cortar` põe o queixo entre ~800 e 920 px). Nunca coberto.
2. **Legenda**: começa ~34 px abaixo do queixo **no zoom mais fechado** (1,22 + folga do rastro). No exemplo, y 914. Até 2 linhas.
3. **Zona das inserções**: do topo da legenda + 192 px até y 1490 (interface do app), de x 64 até x 960 (botões do app à direita). No exemplo, 1106–1490.
4. **Tarja de nome**: alto à esquerda (y 150), acima da cabeça, só no começo.
5. **Tela cheia**: a foto cobre tudo; a legenda continua por cima; a etiqueta do item fica no alto à esquerda (y 226).

`--guias` desenha tudo isso: elipse do rosto, linha do queixo, início da legenda, início dos cartões, limite da interface e faixa dos botões.

## Movimento

| O quê | Como |
|---|---|
| Corte | troca de zoom 1,0 / 1,12 / 1,22 (nunca repete), rosto na mesma altura, seguido quadro a quadro |
| Trecho longo (≥ 2,4 s) | aproxima ~3% devagar (seno); ênfase pedida: 5%; nunca mais de 6% em 2 s |
| Cartão | máscara que sobe em 0,42 s + 26 px de subida (curva que desacelera); sombra acompanha; saída 0,2 s (some e desce 14 px) |
| Foto no cartão | aproxima 7% no tempo do cartão, ancorada no foco |
| Etiqueta | revela da esquerda para a direita em 0,34 s quando o nome é dito |
| Tela cheia | corte seco de entrada e de saída; aproxima 5% |
| Legenda | linha nova entra em 0,14 s (sobe 10 px); a tarja desliza 0,1 s até a palavra seguinte; ao trocar de linha, pula |
| Texto falado (abertura, frase, pergunta, cta) | cada palavra sobe 10 px e aparece em 0,16 s na hora em que é dita; depois fica como texto simples |
| Número | conta de 0 ao valor em 1 s; o traço lima embaixo se completa junto |
| Chip | aparece no `em` (0,3 s, de 94% a 100%) |
| Som | "vum" tonal (330→495 Hz, 0,4 s, baixo) quando uma imagem entra; nada mais |

## Conferência dos quadros (olhe a ~540 px de largura)

- O rosto está livre em todos os quadros, inclusive nos de zoom 1,22?
- A legenda está logo abaixo do queixo, com no máximo 2 linhas, e a tarja está na palavra dita?
- O cartão está abaixo da legenda, sem encostar, e ao lado do ombro (alternando)?
- A imagem é **aquilo** que foi dito, reconhecível em 1 s, sem marca, logo ou gente reconhecível?
- A tela cheia está nítida (foto em pé)?
- Nas trocas (a cada 0,05 s em volta de `de` e `ate`): nenhum quadro com dois textos um sobre o outro, nenhum cartão vazio parado?
- Nada abaixo de y 1490 nem na faixa dos botões à direita?
- A cor do vídeo da pessoa está igual à da gravação?

## Onde mexer no template

| Arquivo | O quê |
|---|---|
| `src/tema.ts` | cores, fonte, zooms, limites da interface, cálculo das faixas |
| `src/camera.ts` | o zoom de cada trecho e a aproximação lenta |
| `src/componentes/Legenda.tsx` | a legenda com a tarja |
| `src/componentes/Insercao.tsx` | a assinatura (cartão, tela cheia, adesivo, sem imagem) |
| `src/componentes/Blocos.tsx` | os 11 blocos universais |
| `src/componentes/Pecas.tsx` | cartão com máscara, etiqueta, marcador, lados |
| `src/componentes/Texto.tsx` | texto que se monta na fala (destaque e risco) |
| `ferramentas/justar.mjs` | cortes justos nas pausas reais |
