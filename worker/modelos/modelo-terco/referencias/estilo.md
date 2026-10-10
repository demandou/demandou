# Estilo do Terço (para conferir os quadros e para quem mexer no template)

O Terço é o "editor que entende de recursos" em tela dividida: nada de efeito chamativo. O palco de cima mostra o que a fala está dizendo; a pessoa embaixo nunca é coberta nem recolorida. Se um quadro parece "editado demais" ou o palco está vazio, está errado.

## Identidade

| Papel | Valor |
|---|---|
| Palco | grafite `#11151B` (segundo plano `#1A1F27`) |
| Texto no palco | osso `#F2EFE9`; apoio cinza `#8A919B`; fios `rgba(242,239,233,.16)` |
| **Destaque** (número, traço, sublinhado da palavra, progresso) | azul-cobalto `#5B84FF`, o único |
| Palco invertido (alerta) | fundo osso, texto grafite |
| Texto sobre o vídeo | branco, sombra `0 2px 12px rgba(0,0,0,.55)` |

- Fonte: **Manrope** (500 a 800). Larguras reais em `src/larguras.ts`; `src/medida.ts` mede, quebra e reduz o corpo.
- Nada abaixo de 24 px no palco. Números e títulos em 800.
- **Proibido:** filtro, LUT, vinheta, brilho, desfoque ou cor sobre o vídeo da pessoa; texto com contorno; preto e dourado; fonte condensada; mais de um destaque; tremer, girar, piscar, quicar.

## Layout (quadro 1080×1920)

1. **Palco**: y 0 a 640, sempre ocupado.
2. **Divisória**: fio de 5 px em y 638 com a linha de progresso do vídeo em azul.
3. **Pessoa**: y 640 a 1920, largura total. O topo da cabeça fica 48 px abaixo da divisória em qualquer zoom (`caixaDaPessoa` em `src/tema.ts`); o zoom mais fechado é o maior (até 1,2) em que a legenda ainda cabe acima da interface.
4. **Legenda**: ~22 px abaixo do queixo no zoom mais fechado, até 2 linhas, acima de y 1490.
5. **Interface do app**: nada importante abaixo de y 1490 nem à direita de x 960.

`--guias` desenha tudo isso.

## Movimento

| O quê | Como |
|---|---|
| Troca no palco | 0,5 s; o que entra é opaco e cobre o anterior (cortina com fio azul, deslize de baixo ou lateral); o anterior recua 25% |
| Imagem | aproxima até 6% desde a entrada |
| Texto falado | cada palavra sobe e aparece na hora em que é dita |
| Número | conta de 0 ao valor em ~1 s |
| Ícone | se desenha em traço no `iconeEm` |
| Corte | troca de zoom ~1,0 / ~1,1 / ~1,2 (nunca repete), cabeça na mesma linha, rosto seguido quadro a quadro |
| Legenda | linha nova sobe 10 px; o sublinhado desliza de palavra em palavra |
| Som | "vum" tonal baixo quando uma imagem entra; nada mais |

## Conferência dos quadros (olhe a ~540 px de largura)

- A cabeça está inteira, com folga sobre ela, em todos os zooms?
- O palco está ocupado em todos os quadros e o texto cabe?
- Nas trocas, nenhum quadro com dois textos um sobre o outro?
- A imagem é **aquilo** que foi dito, reconhecível em 1 s, sem marca, logo ou gente reconhecível?
- A legenda está logo abaixo do queixo, com no máximo 2 linhas, e a palavra dita está sublinhada?
- A cor do vídeo da pessoa está igual à da gravação?

## Onde mexer no template

| Arquivo | O quê |
|---|---|
| `src/tema.ts` | cores, fonte, grade do palco, zooms, cálculo das faixas |
| `src/camera.ts` | o zoom de cada trecho e a aproximação lenta |
| `src/componentes/Palco.tsx` | as trocas do palco |
| `src/componentes/Blocos.tsx` | a assinatura (inserção, capítulo) e os 11 blocos universais |
| `src/componentes/Legenda.tsx` | a legenda |
| `src/componentes/Texto.tsx`, `Icones.tsx` | texto que se monta na fala; ícones de traço |
| `ferramentas/justar.mjs` | cortes justos nas pausas reais |
