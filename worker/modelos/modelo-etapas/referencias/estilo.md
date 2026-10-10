# Estilo do Etapas (para conferir os quadros e para quem mexer no template)

O Etapas é o "editor de explicador com gravação de tela": nenhum efeito chamativo. O que prende é o ritmo: o rosto grande, a pílula que troca em seco, a tela que muda a cada 0,3 a 1 s, a grade numerada. Se um quadro parece "editado demais" (transição, brilho, caixa de legenda, palavra colorida), está errado; se a tela do topo fica parada por muito tempo numa etapa, também.

## Identidade

| Papel | Valor |
|---|---|
| **Destaque** (pílula, logo, círculos numerados) | laranja `#D97757`, texto branco |
| Legenda | branco, minúscula, Manrope 700, 36 a 52 px, sombra suave, sem caixa |
| Blocos de texto (tela grafite) | fundo `#17120F`, texto osso `#F4EEE8`, apoio `#9C9086` |
| Fundo atrás de tudo | preto (a margem de 54 px dos lados e 40 px do topo em volta da tela) |
| Fonte | Manrope (600 a 800) |

## Geometria (1080 × 1920) e margem segura

- **Margem segura (regra do Tiago):** nada importante a menos de 64 px das laterais nem de 120 px do topo; nada importante abaixo de y 1700 (interface do app). Texto sempre cabe no fundo dele (medido, fonte reduzida, linha quebrada).
- **Modo B:** tela x 64, y 120, 952 × 610 (termina em y 730, ~38% da altura); pílula 724 × 84 centrada em y 734 (a junção); a pessoa de y 500 para baixo (uma cópia muda do vídeo preenche a margem em volta da tela: nunca tarja preta); topo da cabeça em y ~940 em qualquer zoom, com folga abaixo da pílula; ombros e peito visíveis; legenda logo abaixo do queixo (y ~1550).
- **Modo A:** cabeçalho em y 124 a ~530 (logo, ícones, pílula de 1 ou 2 linhas); topo da cabeça em y 680; legenda abaixo do queixo.
- **Modo C:** topo da cabeça em y 360; legenda abaixo do queixo (~y 1150).
- **Prints:** preenchem a tela (cover); `rolar`, `zoom` e `foco` escolhem o pedaço. Sem faixa preta.

## Movimento

- Tudo é corte seco. Única exceção: o dissolve de ~0,9 s no antes/depois.
- A página rola devagar dentro da tela (`rolar`), o cursor passeia; o rosto dá saltos de escala de 8 a 15% nos cortes e a cada ~3 s parado. Nunca zoom animado, nunca balanço.
- Sem som de efeito (o áudio é só a voz, normalizada a −14 LUFS).

## Conferindo um quadro

1. Modo B: a pílula inteira na junção, a cabeça inteira com folga abaixo dela, ombros e peito visíveis, a legenda abaixo do queixo, o print legível e sem banner.
2. Modo A: o cabeçalho completo, nada cobrindo o rosto.
3. A cor da pessoa igual à do original. Nenhum nome de ferramenta de edição em tela nenhuma.
