# O estilo Transformação

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **prova visual**: o espectador vê o antes virar depois enquanto a pessoa explica como. Ele é feito de poucas peças repetidas com rigor: a foto grande com a cortina, o pino numerado, o cartão claro de dica e a pessoa numa moldura larga. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, contorno, emoji, transição de efeito) piora.

## 1. Dinâmica do motion
- **Câmera**: desliza até a área da dica em ~0,75 s (foco em frações da foto, zoom 1,3–3); entre dicas, aproximação lenta contínua (3,5%).
- **Alça**: em cada dica volta ao antes (0,45 s) e varre até o depois durante a fala; a alça some quando encosta na borda.
- **Pinos**: o disco numerado aparece quando a cortina passa pelo ponto (marca o depois), com salto leve.
- **Cartão da dica**: entra uma vez (primeira dica); depois só o conteúdo troca (o antigo sai antes de o novo aparecer). Texto palavra por palavra na fala; detalhe em verde depois.
- **Troca de lugar**: o painel desce junto com a emenda em 0,45 s; nenhum quadro com buraco.
- **Revelação**: a foto cresce até a tela inteira (0,6 s), a pessoa vai para a janela, e a alça varre o resultado.

## 2. Organização e hierarquia
- Quadro cheio (texto no cartão, na altura do peito) → painel (conteúdo y 150–1100, pessoa embaixo a partir de y 1160) → janela. Nunca coluna estreita.
- Uma ideia por tela; a foto é a protagonista, o texto é de apoio.
- Legenda abaixo do queixo, dentro da área da pessoa; some quando um cartão já mostra o texto.
- Nada importante acima de y 150 (interface do app), abaixo de y 1540 ou na coluna direita abaixo de y 1080.

## 3. Tipografia
Outfit (Google Fonts), uma família: 800 principais, 700 definições, 500 detalhes. Rótulos ANTES/DEPOIS em caixa alta com tracking 0,08em. Mínimos: dica 42 px, detalhe 30, legenda 58.

## 4. Cores, textura e som
- Linho #EFE9DF (fundo do painel), papel #F8F4ED (cartões), tinta #1D2B27.
- Verde-mar #137A6A / #0C5348 / #CFE7DF: depois, pinos, palavra falada, ênfase.
- Cinza-pedra #8A7E73: antes. Argila #C8552E: alerta e risco.
- Sombras suaves (0 14px 36px, 20%), nunca brilho. Sem preto e dourado.
- Sons tonais e raros, bem abaixo da voz (volumes 0,22–0,30): toque por dica, grave redondo na revelação, fechamento em três notas.

## 5. O que não fazer
- Não use fotos que não alinham; não aproxime logos ou texto pequeno; não ponha dois pinos no mesmo lugar.
- Não escreva o nome da ferramenta de renderização em nenhum texto da tela.
- Não prometa resultado nas legendas de conteúdo de saúde.
