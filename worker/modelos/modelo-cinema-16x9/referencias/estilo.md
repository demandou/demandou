# O estilo Cinema (versão deitada, 16:9)

O sistema abaixo é o do vertical e vale inteiro no quadro deitado (1920×1080): as mesmas fontes, cores, barras, o foco de lente, os contadores, os desenhos e os sons. Muda só a diagramação, pela aula 9 do curso (editar uma aula horizontal): a pessoa em tela cheia é a base; nos blocos ela vai para uma moldura à direita, com o rosto centralizado, e o texto ocupa o quadro preto à esquerda. As medidas do 16:9 estão em "Medidas (quadro deitado 1920 × 1080)", no fim.

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a contenção: a fala é da pessoa, a edição só dá a ela a linguagem de um filme. Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

Uma pessoa falando numa sala escura, filmada como cinema. A tela respira com a fala: as barras pretas se fecham quando ela aperta e se abrem quando ela solta, a câmera se aproxima devagar, e tudo o que se escreve aparece nas barras, como os créditos e as legendas de um filme. Dinâmico sem ser agitado: algo sempre se move, mas nada pula. Funciona com qualquer assunto — uma história, uma aula, finanças, saúde, vendas, uma opinião.

## 1. Dinâmica do motion

- **As barras são travellings.** Toda troca de enquadramento leva ~1 s (0,5 s para fechar no preto), acelera e desacelera (`travelling` em `src/anim.tsx`). Não existe corte seco de enquadramento.
- **A câmera nunca para.** Dentro de cada nível ela aproxima devagar (0,4 %/s na tela aberta até 2,2 %/s no close, no máximo +12 %). Nada de tremida, balanço ou zoom rápido.
- **O texto entra em foco.** Narração, títulos, itens, opções, falas e chamada entram inteiros, desfocados e apagados ("a lápis"), e cada palavra ganha nitidez no instante em que é dita (ajuste de foco de lente). A frase-chave é a exceção: suas palavras nascem do nada, grandes, e o bloco cresce devagar. Terminada a animação, a palavra é desenhada como texto simples.
- **Números rolam como contador mecânico.** Horas e anos rolam até o valor dito; os números contados a partir do zero rolam como um hodômetro (os algarismos da direita dão voltas) e pousam com uma nota grave.
- **Créditos se aproximam.** O texto em caixa alta entra com as letras afastadas e se aproxima até o espaçamento final.
- **Desenhos têm ação.** Cada desenho a traço se desenha e faz uma coisa com sentido na hora da fala (as moedas desmoronam, a balança pende, a lâmpada acende, o calendário perde folhas, o café esfria).
- **Trocas sem dupla exposição.** O texto de um momento apaga e desfoca nos últimos 0,4 s; o do seguinte entra ~0,15 s depois do começo. Enquanto as barras se mexem, elas recortam o texto como uma cortina: a janela da pessoa nunca passa por cima de um texto.

## 2. Organização e hierarquia

- **O texto mora no preto, a pessoa fica na moldura.** No quadro deitado, nos blocos de barra a janela da pessoa desliza para a moldura da direita e o texto ocupa o quadro preto da esquerda: a informação principal embaixo (o título, o número, o significado, a chamada) e o contexto em cima (o crédito, o termo, o primeiro lado, a pergunta), numa coluna centrada.
- **A cartela alta para listas e gráficos.** A moldura desce para a base, do lado direito, e o quadro da esquerda vira uma cartela: título em caixa alta âmbar no alto, itens grandes empilhados (com travessão âmbar ou algarismo âmbar) ou o gráfico a traço. O item da vez fica aceso, os anteriores recuam, os que vêm estão "a lápis".
- **O corte para o preto.** A cartela fecha a tela por 2 a 3,5 s; no quadro deitado ela é uma fileira: o desenho de um lado, o crédito, o título e as frases do outro (sem desenho, uma coluna no meio). É rara (0 a 2 por vídeo).
- **Uma ideia grande por vez.** Títulos e números grandes; créditos, rótulos e detalhes pequenos; nada disputa o mesmo tamanho.

## 3. Tipografia

- **Cormorant Garamond** (serifada de livro/cinema), 600, para tudo que é dito; itálico (500–600) para ênfase, termos, falas e perguntas. Algarismos alinhados.
- **Jost** 500, só em caixa alta espaçada (0,34 em), pequena e âmbar, como crédito de filme.
- Os textos são **medidos com as larguras reais das fontes** (`src/larguras.ts` e `src/medida.ts`) e diminuem até caber, em até 2 ou 3 linhas equilibradas; nunca vazam. Crédito comprido demais para uma linha vira itálico.
- Tamanhos no quadro deitado (o quadro do texto tem 896 px de largura, a coluna do vertical): títulos 56–150 px, números até 210 px, itens 46–96 px, narração 46–58 px (uma linha), frase-chave 60–128 px, detalhes 48 px, créditos 30–36 px. A Cormorant tem letras pequenas para o tamanho: não desça desses mínimos.

## 4. Moldura da pessoa

- **Fora dos blocos, uma janela da largura toda** entre as barras pretas (a pessoa em tela cheia, como foi gravada). As alturas (`src/layout.ts`): aberta (tela cheia), respiro (50–850 px), tensão (80–790), clímax (120–720, cinemascope apertado), fechada (as barras se encontram em 480).
- **Nos blocos, a moldura da direita** (aula 9): x 1056–1824, y 96–984, com o rosto centralizado (close ou larga, o zoom sai do tamanho do rosto medido); na cartela alta, a moldura baixa (y 404–984). A janela desliza até lá como um travelling e o quadro preto da esquerda leva o texto.
- O rosto é seguido quadro a quadro (o `rastro` do motor), com ajuste suave na moldura. Em gravação muito perto da câmera (o rosto ocupa mais de ~1/4 da largura do quadro deitado), as janelas não aproximam mais e o rosto sobe um pouco, para caberem olhos e boca.
- Nada recorta a pessoa do fundo e nada fica sobre o rosto: funciona com a gravação de qualquer um.
- **O rosto está no primeiro quadro.** O vídeo abre com um bloco de barra (abertura, número, letreiro) já montado — nunca com tela preta.

## 5. Cores, textura e som

- **Paleta curta e com papéis**: preto quente `#0B0806` (barras, cartelas); marfim `#F0E6D2` (texto); âmbar `#D9A45B` e âmbar claro `#E9BE7E` (o único acento: créditos, ênfase, travessões, algarismos, traços dos desenhos e gráficos, régua do que ganha); cinza frio `#8C9196` (o que esfria, apaga ou está errado: o trecho riscado, o lado que perde, a etiqueta ILUSTRATIVO).
- **Gradação de filme** dentro da janela: contraste um pouco maior, cor menos saturada e puxada para o quente, vinheta suave e grão de película fino. No `destaque` de alerta, a imagem **esfria** (quase sem cor, tom frio). As barras ficam num preto limpo.
- **Som raro, grave e tonal** (`public/sfx/`): `fecha` quando as barras apertam num letreiro, abertura ou número (ou a tela fecha numa cartela); `pousa` quando a hora ou o número pousam, no significado e no segundo lado; `frase-1/2` sob cada frase-chave e destaque-chave; `alerta` (duas notas graves descendo) no destaque de alerta; `desce` (um sopro grave que desce) quando a janela desce para a cartela alta (no 16:9, a moldura baixa); `fim` nos créditos. Nada de "whoosh", clique de projetor, ruído de película ou sino.
- Nada de brilho atrás da pessoa, vazamento de luz, arranhão de filme, emoji, contorno no texto ou gradiente colorido.

## O que pode mudar por vídeo

- Textos, tempos, a curva de intensidade e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área dos créditos).
- O quadro é sempre 16:9 (1920×1080): a gravação deitada entra inteira; o layout reenquadra a pessoa na janela e na moldura.
- `sfx: false` (sem sons) e `grao: false` (sem grão), se o usuário pedir.

## O que não mudar sem o usuário pedir

- Cores, fontes e tamanhos. Se o usuário quiser a cor da marca dele, troque **só** o âmbar (e o âmbar claro) em `src/tema.ts`; o preto quente e o marfim seguram o clima.
- A geometria dos níveis e da moldura (`src/layout.ts`): a barra de baixo guarda a narração acima dos controles do player (y < 984) e o quadro da esquerda tem a largura da coluna do vertical; mexer nelas empurra o texto para baixo dos controles ou para cima do rosto.
- A regra de um momento por vez, de nenhuma cartela seguida de outra e de nenhum texto sobre o rosto.
- Não adicione barras de progresso, transições de corte, flashes ou stickers. Eles pertencem a outros modelos.

## Se precisar de algo que o modelo não tem

- **Um desenho novo** (uma carta, uma porta): em `src/componentes/Desenhos.tsx`, siga o molde dos existentes — `viewBox` próprio, traço 4 (3,5 nos detalhes), âmbar para o que tem luz, valor ou ênfase e marfim para o objeto, cada traço com `pathLength={1}` e `strokeDashoffset` ligado ao tempo para se desenhar, e **uma ação com significado** disparada pelos `passos`. Registre o nome em `TipoDeDesenho` (`src/plano.ts`), em `LARGURA_DO_DESENHO` e em `PROPORCAO_DO_DESENHO`.
- **Um componente novo**: texto dito usa `TextoEmFoco` (`src/componentes/Foco.tsx`, que mede e quebra o texto); texto de bloco fica dentro de `NoQuadro` + `Coluna` (`src/componentes/Barras.tsx`: o quadro preto à esquerda da moldura, revelado pela janela que desliza), com as alturas de `divisaoDoQuadro` (`src/layout.ts`); texto em tela cheia que mora numa barra fica dentro de `NaBarra`; nunca em px fixos sobre o rosto; saída com `saindo` + um leve desfoque; e um nível de barras em `alvoDoBloco` (`src/layout.ts`). Consulte a skill do Remotion para as regras de animação.
- **Cuidado (a voz some)**: o vídeo da pessoa (`VideoNaCaixa`) fica **sempre montado**, mesmo com a tela fechada numa cartela — é ele que toca a voz. Se um componente o esconder com renderização condicional (`{aberta ? <VideoNaCaixa…/> : null}`), o render sai mudo naquele trecho. Para "esconder" a imagem, feche a janela (altura 0); nunca desmonte o vídeo. Depois de qualquer mudança, meça o áudio de um trecho de cartela no render (`ffmpeg -ss <de> -t 1 -i saida.mp4 -af volumedetect -f null -`): perto de −90 dB é voz sumida.

## Medidas (quadro deitado 1920 × 1080)

| O quê | Onde |
|---|---|
| margens seguras (YouTube) | 96 px nas laterais; nada abaixo de y 984 (controles do player) |
| janela dos níveis (a largura toda) | respiro y 50–850 · tensão 80–790 · clímax 120–720 · fechada em 480 |
| moldura dos blocos (a pessoa) | x 1056–1824, y 96–984, rosto centralizado (close: ~42% da largura da moldura; larga: ~33%) |
| moldura baixa (listas, passos, gráficos) | x 1056–1824, y 404–984 |
| quadro do texto (os blocos) | x 96–992 (896 px), y 104–976; o de cima e o de baixo do vertical numa coluna centrada, com 44 px entre eles |
| cartela (o preto) | fileira entre as margens (x 96–1824, y 96–984): desenho até 600 px de altura e a coluna do texto até 1000 px |
| narração | uma linha, 46–58 px, no meio da barra de baixo (y 860–930) |
| frase-chave | na barra de baixo (níveis 2 e 3) ou sobre a imagem escurecida, abaixo do queixo, até 1440 px de largura |
| cabeçalho de capítulo | no meio da barra de cima, só nos níveis 2 e 3 |

### A composição da aula 9 do curso (editar uma aula horizontal)

- Tela cheia como base; o bloco abre quando acrescenta clareza e fecha ao fim da ideia.
- A pessoa numa moldura à direita, com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto); a explicação no quadro à esquerda, entrando na ordem do raciocínio, com tempo de leitura.
- Sem excesso de cor nem informação simultânea: um bloco, uma ideia, o âmbar em uma coisa.
- Cortes nas pausas excessivas e nos erros, mantendo a respiração natural: o `cortar.mjs` deste modelo não corta as pausas de até ~0,45 s entre trechos mantidos, e no Cinema a pausa de até ~1,2 s é narração (junte os itens, como diz o SKILL.md).
