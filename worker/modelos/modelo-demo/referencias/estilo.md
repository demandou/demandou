# Estilo do Demo (para conferir os quadros e para quem mexer no template)

O Demo é um formato de demonstração sem motion graphic: o material em cima, a pessoa embaixo, uma faixa verde na emenda só no gancho, legenda laranja em tudo. Se um quadro parece "editado demais" (animação de entrada, brilho, emoji, caixa extra, zoom na pessoa) ou se o material de cima está parado, está errado.

## Identidade

| Papel | Valor |
|---|---|
| Fundo do quadro | `#050A08` |
| Faixa-rótulo | verde `#4CD137`, cantos de 14 px, texto branco Manrope 800, 2 linhas |
| Legenda | Bebas Neue, `#F4A53C`, contorno `#3A1E08` (6 px) e sombra marrom, caixa-alta, 86 a 96 px |
| Insert | a captura real ou a imagem, sem moldura, sem cantos, sem sombra |
| Blocos extras (no insert) | fundo `#0B1714`, texto `#F4F7F5`, apoio `#8FA39B`, **um** destaque verde `#4CD137` |
| Cursor | seta branca com contorno preto; o clique é um anel branco de 0,5 s |

- Fontes: **Bebas Neue** (legenda) e **Manrope** (faixa e blocos), ambas do Google Fonts. Larguras reais em `src/larguras.ts`; `src/medida.ts` mede e quebra.
- **Proibido:** filtro, LUT, vinheta, brilho, desfoque ou cor sobre o vídeo da pessoa; transição; zoom animado ou punch-in; emoji; logo; texto de chamada; som de efeito; interface desenhada à mão.

## Layout (quadro 1080×1920, medido no Reel original)

1. **Split**: insert de y 0 a 845 (44%); faixa verde centrada em y 845 (só no gancho); pessoa de 845 à base (zoom 1,08), topo da cabeça 140 px abaixo da emenda.
2. **Cheio**: insert 1080×1920, a pessoa some.
3. **Eu**: pessoa em tela cheia, zoom 1,3, topo da cabeça em y ~330.
4. **Legenda**: centro em y 1536 (80%) nos três.

`--guias` desenha tudo isso.

## Movimento

- **Corte seco em tudo**: entre layouts, entre inserts, na faixa.
- **A câmera da captura anda sem parar** (62% linear, 38% suave); o cursor chega ao ponto na palavra, em até 0,7 s; a foto aproxima ~14%.
- **A pessoa não anima**: muda de enquadramento só com o layout, e segue o rosto quando se mexe.
