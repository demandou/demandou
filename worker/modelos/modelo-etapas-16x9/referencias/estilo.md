# Estilo do Etapas (para conferir os quadros e para quem mexer no template)

O Etapas é o "editor de explicador com gravação de tela": nenhum efeito chamativo. O que prende é o ritmo: a pessoa em tela cheia, a pílula que troca em seco, a tela que muda a cada 0,3 a 1 s, a grade numerada. Se um quadro parece "editado demais" (transição, brilho, caixa de legenda, palavra colorida), está errado; se a tela fica parada por muito tempo numa etapa, também.

Esta é a versão deitada (16:9, 1920×1080) para o vídeo completo do YouTube: o estilo é o mesmo do vertical, a composição segue a aula 9 do curso (a pessoa em tela cheia como base; no modo B ela vai para a moldura da direita e a tela ocupa o quadro da esquerda).

## Identidade

| Papel | Valor |
|---|---|
| **Destaque** (pílula, logo, círculos numerados) | laranja `#D97757`, texto branco |
| Legenda | branco, minúscula, Manrope 700, 36 a 52 px, sombra suave, sem caixa |
| Blocos de texto (tela grafite) | fundo `#17120F`, texto osso `#F4EEE8`, apoio `#9C9086` |
| Fundo atrás de tudo | preto (no modo B, o quadro da esquerda em volta da tela) |
| Fonte | Manrope (600 a 800) |

## Geometria (1920 × 1080) e margem segura

- **Margem segura (regra do Tiago, no quadro do YouTube):** nada importante a menos de 80 px das laterais (96 px para texto em tela cheia) nem de 100 px do topo; nada importante abaixo de y 984 (controles do player). Texto sempre cabe no fundo dele (medido, fonte reduzida, linha quebrada).
- **Modo B (aula 9: moldura à direita, quadro à esquerda):** a costura em x 1216. Tela no quadro da esquerda em x 80, y 100, 1056 × 760 (termina em y 860), com fundo preto em volta; pílula 724 × 84 centrada na borda de baixo da tela (centro em x 608, y 864); a pessoa na moldura da direita (x 1216 a 1920, altura toda), o rosto no meio da largura dela (~290 px de rosto), topo da cabeça em y ~180 em qualquer zoom; ombros e peito visíveis; legenda centrada na moldura, em y ~846 (até 560 px de largura).
- **Modo A:** a pessoa em tela cheia (o vídeo deitado inteiro, rosto um pouco deslocado para o lado contrário ao cabeçalho); o cabeçalho numa coluna de 440 a 600 px ao lado do rosto (logo, ícones e pílula de 1 ou 2 linhas, centrados na coluna, na altura do rosto), terminando acima da legenda; legenda embaixo do rosto, em y ~846.
- **Modo C:** a pessoa em tela cheia, com o topo da cabeça onde foi gravado; legenda embaixo do rosto, em y ~846 (até 880 px de largura).
- **Prints:** preenchem a tela (cover); `rolar`, `zoom` e `foco` escolhem o pedaço. Sem faixa preta.

## Movimento

- Tudo é corte seco. Única exceção: o dissolve de ~0,9 s no antes/depois.
- A página rola devagar dentro da tela (`rolar`), o cursor passeia; a pessoa dá saltos de escala de 8 a 15% nos cortes e a cada ~3 s parado, em tela cheia e na moldura (o menor salto ainda cobre o quadro). Na moldura, o rosto é acompanhado com ajuste suave (rastreio do rosto), sem saltos nem cortes no rosto. Nunca zoom animado, nunca balanço.
- Sem som de efeito (o áudio é só a voz, normalizada a −14 LUFS).

## Conferindo um quadro

1. Modo B: a tela inteira no quadro da esquerda, a pílula inteira na borda de baixo dela, a pessoa na moldura da direita com o rosto no meio, a cabeça inteira com folga em cima, ombros e peito visíveis, a legenda embaixo e centrada na moldura, o print legível e sem banner.
2. Modo A: o cabeçalho completo na coluna ao lado do rosto, nada cobrindo o rosto.
3. Nada abaixo de y 984 (controles do player), nada encostado nas laterais.
4. A cor da pessoa igual à do original. Nenhum nome de ferramenta de edição em tela nenhuma.
