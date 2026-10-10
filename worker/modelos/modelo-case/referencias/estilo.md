# O estilo Case

O que faz um vídeo parecer "do modelo Case", com qualquer assunto. Use para decidir o que nunca muda quando você adapta o plano.

## A ideia

Um **relatório de consultoria impresso** que se preenche enquanto a pessoa fala: a prova de que algo mudou, organizada como um documento sério (ANTES → O QUE FIZEMOS → DEPOIS → a prova → o próximo passo). É sóbrio e editorial, não "dashboard" escuro nem cartão de rede social: papel, tinta, filetes e um único coral.

## 1. Dinâmica do motion

- **O documento sendo escrito, sem molde:** cada peça só aparece quando é dita, já com conteúdo e com movimento (escrita, desenho, barra crescendo). Nunca há linha cinza, caixa vazia ou campo tracejado esperando. O conjunto da página fica centrado e sobe suave (0,42 s) quando uma peça nova entra embaixo.
- **Gancho:** o quadro 0 já mostra a ficha de quem é o case (quadrinho com ícone + título grande) e o carimbo coral ANTES bate na primeira palavra (entra grande, assenta torto em −7°).
- **Entradas:** as peças deslizam 14–24 px e assentam sem passar do ponto (0,32 s, curva de saída suave). Valores e rótulos são **datilografados** palavra por palavra, cada palavra no instante dito, com um cursor coral que pisca até a palavra terminar.
- **Traços:** filetes, sublinhados, o ✓ das caixas, a régua do prazo e as mini-ilustrações **se desenham** (0,4–0,7 s). As ondas do megafone e a lâmpada pulsam devagar depois de prontas (movimento interno).
- **A câmera do relatório:** entre as seções, a folha desce 0,42 s (curva de entrada e saída), chegando 0,15 s antes da primeira palavra da página. Nunca há corte nem troca de fundo.
- **O resultado:** a barra DEPOIS aparece na altura do ANTES e **cai** (ou sobe) até a proporção dita; o colchete coral e a relação batem com um soco de 6%, e a pessoa ganha um soco de 5% de zoom.
- **A prova:** "digitando…" com três pontos que ondulam, o balão que abre a partir do canto, as estrelas que entram já cheias, uma a uma, com um pequeno salto.
- **O fechamento:** a palavra-chave é digitada letra a letra na caixa de comentário; o botão de enviar acende e é "tocado" (encolhe 12% e solta um anel).
- Nada de giro, tremida, flash, brilho, glitch, partícula ou luz atrás da pessoa.

## 2. Organização e hierarquia

- **Tela dividida, sempre:** a folha em cima (x 40–1040, y 92–980, cantos de 18 px, sombra macia) e a moldura da pessoa embaixo (a partir de y 1000). Nada importante acima de y 120, abaixo de y 1700 nem a menos de 64 px das laterais (o conteúdo da folha começa em x 84).
- **Cabeçalho fixo** (y 122–188): quadradinho coral + título do relatório (mono 32 px) à esquerda; os pontos das seções (18 px) à direita; um filete de tinta embaixo.
- **Página** (912 × 758, a janela inteira): no alto, a etiqueta da seção (mono 30 px em caixa alta, que entra numa varrida já cheia de tinta; DEPOIS e PRÓXIMO PASSO em coral) com um filete que corre até a margem; na ficha ANTES, o carimbo faz esse papel. Embaixo, o conteúdo centrado. Uma ideia por página.
- **Hierarquia:** valor/título grande (52–124 px) > rótulo mono (30 px; carimbo 40 px) > detalhe cinza (30–44 px). O coral marca **uma coisa por página** (o número dito, o item da vez, a barra DEPOIS, a palavra-chave).
- Ficha: quadrinho ilustrado à esquerda, rótulo + valor à direita, filete entre as métricas. Lista: caixa/marcador, quadrinho ilustrado opcional, texto; a faixa coral clara marca o item da vez.

## 3. Tipografia

- **Inter** (Google Fonts) para tudo o que se lê: 800 em valores, títulos e itens (tracking −0,022em); 700 no texto corrido e no depoimento; 500 nos detalhes. Números com a mesma Inter (largura medida antes de desenhar: nada vaza).
- **Fragment Mono** (Google Fonts) só em etiquetas curtas em caixa alta (30 px ou mais; carimbo 40 px), com espaçamento 0,1–0,14em: etiqueta de seção, rótulo de métrica, eixo do gráfico, "início", "ILUSTRATIVO", área da tarja, título do cabeçalho.
- Nada condensado; nada em caixa alta longa fora das etiquetas.

## 4. Moldura da pessoa

- Sempre embaixo, larga (x 40–1040, cantos de 18 px; os de baixo ficam fora do quadro), com a cabeça inteira e ~56 px de folga acima do cabelo; o rosto no eixo central e com ~29% da largura da moldura, seguido quadro a quadro (`VideoNaCaixa` com `rosto={plano.rosto}`).
- Troca de escala em corte seco (100% ↔ 106%) só quando o trecho anterior durou mais de 1 s; soco de 5% quando a relação do resultado bate.
- A cor do vídeo nunca muda; nada de halo, brilho ou luz atrás da pessoa.
- Tarja: cartão branco com filete coral à esquerda, nome em Inter 800 (40 px; nunca menos de 34) e área em mono, presa entre a folha e a moldura, à esquerda, de 0,2 s a ~3,6 s.

## 5. Cores

| Papel | Cor |
|---|---|
| mesa (fundo) | #DFE2E6 → #CDD2D8 |
| papel da folha | #FAFAF7 |
| quadrinhos, conversa | #F1F0EB / #F2F1EC |
| tinta (texto, barra ANTES, etiquetas) | #121722 |
| tinta secundária / fraca | #5E6573 / #9AA0AB |
| filetes | #DEDCD5 |
| **acento único: coral** | #FF5A36 (escuro #D9401F) |
| coral claro (marca-texto, faixa da vez, fundo de ícone) | #FFE6DE / #FFF3EF |

Sem segunda cor de destaque: o que é bom, o que é ruim e a palavra-chave usam o mesmo coral (o contexto diz o resto). Nada de preto + dourado, neon, verde-dinheiro ou vermelho de alerta piscando.

## 6. Sons

Tonais, raros e bem abaixo da voz (volume 0,14–0,26): nota de marimba por item marcado (Ré, Fá#, Lá, Ré subindo), deslize grave de 0,4 s na queda (ou subida) da barra, duas notas na relação, toque duplo agudo no balão, brilho curto nas estrelas, "pop" tonal no enviar. Nada de sino, máquina de escrever, ruído branco ou "risco de papel".

## 7. Imagens

O estilo é vetorial: as mini-ilustrações do template (`icone`) cobrem as coisas mais comuns de um case. A única imagem externa é o **print de verdade** do depoimento (campo `arquivo`), que preenche o balão sem faixa preta. Nunca logo de app, de banco ou de rede social; nunca foto de outra pessoa.
