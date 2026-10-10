# Estilo do Narrador (para conferir os quadros e para quem mexer no template)

O Narrador é um mini-documentário: a voz conta e as imagens carregam. Sóbrio, sem efeito chamativo. Se um quadro parece "editado demais" ou a pessoa fica mais de ~4 s sem imagem nem letreiro, está errado.

## Identidade

| Papel | Valor |
|---|---|
| Noite (pranchas, véu sobre as fotos) | `#0E1319` |
| Marfim (texto) | `#F2ECE1` |
| Apagado / linha | marfim a 62% / 30% |
| **Destaque** (traço do letreiro, palavra-chave, número, quadradinho do rótulo) | vermelhão `#E8603C`, o único |
| Texto sobre vídeo e foto | marfim, sombra `0 2px 16px rgba(0,0,0,.55)` |

- Fontes: **Playfair Display** (letreiros, abertura, destaque, frase, números) e **Figtree** (legenda, rótulos, pranchas). Larguras reais em `src/larguras.ts`; `src/medida.ts` mede, quebra e reduz.
- **Proibido:** filtro, LUT, vinheta, brilho, desfoque ou cor sobre a pessoa (o véu escuro existe só sobre as fotos); texto com contorno; preto e dourado; mais de um destaque; tremer, girar, piscar.

## Layout (1080×1920)

1. Rosto na altura gravada; nunca coberto. Zoom da pessoa: 1,0 / 1,12 / 1,25 alternando em cada corte e em cada volta.
2. Legenda: faixa fixa abaixo do queixo (no zoom mais fechado), a mesma altura sobre pessoa e imagem, até 2 linhas, traço vermelhão na palavra dita.
3. Letreiro e rótulo: no alto (rótulo em y 176, letreiro a partir de ~y 300).
4. Textos sobre a pessoa: entre o queixo e a interface (y 1490); nada à direita de x 960.
5. Tarja de nome: alto à esquerda, só no começo, em serifa com traço vermelhão.

## Movimento

| O quê | Como |
|---|---|
| Cena | dissolve 0,3 s (ou corte, ou cortina); anda ~3%/s (aproximar / panorâmica / afastar alternando); duas cenas coladas se dissolvem uma na outra |
| Rótulo | desliza da esquerda em 0,45 s quando a coisa é dita |
| Letreiro | `sub` e `texto` sobem e aparecem quando ditos; traço vermelhão se completa |
| Pessoa | troca de zoom em cada corte e volta, seguindo o rosto; aproximação lenta ≤ 5% |
| Textos falados | cada palavra sobe e aparece na hora em que é dita |
| Som | passagem tonal baixa quando a pessoa sai e a primeira imagem entra |

## Conferência dos quadros (~540 px)

- 50% a 70% do tempo em imagem? Nenhum trecho só com legenda além de ~3,5 s?
- A imagem é **aquilo** que foi dito? O rótulo descreve a imagem sem inventar?
- Letreiro, rótulo e legenda não se sobrepõem; letreiro não cobre o rosto no zoom 1,25?
- Nenhuma frase emenda com a seguinte na legenda?
- A cor da pessoa está igual à da gravação?

## Onde mexer no template

`src/tema.ts` (cores, fontes, zooms, limites), `src/camera.ts` (zoom por trecho), `src/componentes/Cena.tsx` (a imagem e o rótulo), `Letreiro.tsx`, `Legenda.tsx`, `NaPessoa.tsx` (abertura, destaque, frase, pergunta, cta), `Pranchas.tsx` (número, lista, passos, comparação, gráfico, definição), `Texto.tsx`, `ferramentas/justar.mjs`.
