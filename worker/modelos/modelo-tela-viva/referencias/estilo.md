# Estilo da Tela Viva (para conferir os quadros e para quem mexer no template)

A Tela Viva é o formato de demonstração mais simples que existe: uma gravação de tela em cima, a pessoa embaixo, um rótulo branco entre as duas. Nada de efeito. Se um quadro parece "editado demais" (animação de entrada, brilho, emoji, caixa colorida) ou se a tela de cima está parada, está errado.

## Identidade

| Papel | Valor |
|---|---|
| Fundo do quadro | **nunca preto**: o próprio vídeo da pessoa preenche 1080×1920 e, atrás, uma cópia borrada (blur 14 px) mostra o cenário em volta da tela |
| Rótulo | caixa branca `#FFFFFF`, cantos de 26 px, texto preto `#0B0B10` em Manrope 800 |
| Legenda | branco, Manrope 600 ~48 px, minúscula, sombra `0 2px 10px rgba(0,0,0,.45)` |
| Tela de cima | a captura real da página, em moldura de cantos de 16 px |
| Blocos extras (dentro da moldura) | fundo `#0C0B12`, texto `#F6F5FA`, apoio `#9A97A8`, **um** destaque roxo-neon `#B678FF` |
| Cursor | seta branca com contorno preto e sombra; o clique é um anel branco de 0,5 s |

- Fonte: **Manrope** (500 a 800). Larguras reais em `src/larguras.ts`; `src/medida.ts` mede, quebra e reduz o corpo.
- **Proibido:** filtro, LUT, vinheta, brilho, desfoque ou cor sobre o vídeo da pessoa; transição; zoom animado; texto com contorno; emoji; logo; texto de chamada; som de efeito; interface falsa desenhada à mão.

## Layout (quadro 1080×1920, medido no Reel original)

1. **Moldura da tela**: x 64 a 1016, y 120 a 772 (margem segura de 64 px nas laterais e 120 px no topo), flutuando sobre o vídeo, com cantos de 20 px e sombra suave: **zero preto** (em volta aparece o cenário da pessoa). A captura **preenche** a moldura (cover com foco e aproximação).
2. **Rótulo**: y 650 a 754, ~58% da largura (cresce até 80% se o texto é longo), **sobre a base da tela**.
3. **Pessoa**: y 770 a 1920, largura total. O topo da cabeça fica 85 px abaixo do início da moldura da pessoa em qualquer zoom (olhos por volta de y 1130). Dois zooms: 1,00 e 1,06, trocando só nos cortes.
4. **Legenda**: centro em y 1565 (82%), 1 linha de 2 a 4 palavras.
5. **Margens (revisão do Tiago):** laterais ≥ 64 px, topo ≥ 120 px, nada importante abaixo de y 1700. O texto sempre cabe na caixa dele (medido, reduzido ou quebrado).
6. A legenda fica abaixo da linha da interface do app **de propósito**: é onde o Reel original a põe (no peito).

`--guias` desenha tudo isso.

## Movimento

- **Corte seco em tudo.** Entre cenas da tela, entre o rótulo e a ausência dele, entre blocos.
- **A câmera da captura anda sem parar**: entre `ini` e `fim`, 62% linear e 38% suave. Nunca para no meio.
- **O cursor** chega ao ponto na palavra, em até 0,7 s, com partida e chegada suaves; depois do último ponto deriva de leve (nunca congela).
- **O rosto**: reenquadra ~6% só nos cortes e segue o rosto quando a pessoa se mexe (`VideoNaCaixa`).
- Sem som de efeito.

## Medidas da câmera sobre a captura

A captura é desenhada num palco de 1080×740 que encolhe 0,881× para a moldura. `zoom` 1 = cover (a captura cobre a moldura inteira). Largura visível = `1 ÷ zoom` da captura; altura visível = `0,682 ÷ (proporcao × zoom)` (nunca passa de 1). O centro é limitado para nunca mostrar borda vazia.
