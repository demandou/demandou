# O estilo Cinema

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

- **O texto mora nas barras, o rosto fica no meio.** Nos blocos de barra, a informação principal vai na barra de baixo (o título, o número, o significado, a chamada) e o contexto na de cima (o crédito, o termo, o primeiro lado, a pergunta).
- **A cartela alta para listas e gráficos.** A janela desce para a base da tela (uma faixa de cinemascope) e a barra de cima vira uma cartela: título em caixa alta âmbar no alto, itens grandes empilhados (com travessão âmbar ou algarismo âmbar) ou o gráfico a traço. O item da vez fica aceso, os anteriores recuam, os que vêm estão "a lápis".
- **O corte para o preto.** A cartela fecha a tela por 2 a 3,5 s: desenho no centro, crédito, título e frases embaixo. É rara (0 a 2 por vídeo).
- **Uma ideia grande por vez.** Títulos e números grandes; créditos, rótulos e detalhes pequenos; nada disputa o mesmo tamanho.

## 3. Tipografia

- **Cormorant Garamond** (serifada de livro/cinema), 600, para tudo que é dito; itálico (500–600) para ênfase, termos, falas e perguntas. Algarismos alinhados.
- **Jost** 500, só em caixa alta espaçada (0,34 em), pequena e âmbar, como crédito de filme.
- Os textos são **medidos com as larguras reais das fontes** (`src/larguras.ts` e `src/medida.ts`) e diminuem até caber, em até 2 ou 3 linhas equilibradas; nunca vazam. Crédito comprido demais para uma linha vira itálico.
- Tamanhos na tela de 1080 de largura: títulos 72–150 px, números até 210 px, itens 46–96 px, narração 66–76 px, detalhes 48 px, créditos 30–36 px. A Cormorant tem letras pequenas para o tamanho: não desça desses mínimos.

## 4. Moldura da pessoa

- **Uma janela da largura toda**, sempre, entre duas barras pretas. As alturas (`src/layout.ts`): aberta (tela cheia), respiro (230–1360 px), tensão (470–1250), clímax (600–1120, cinemascope), fechada (as barras se encontram em 860) e a cartela alta (990–1560, a faixa da base).
- O rosto é seguido quadro a quadro (o `rastro` do motor). Em gravação muito perto da câmera (o rosto ocupa mais da metade da largura), as janelas não aproximam mais e o rosto sobe um pouco, para caberem olhos e boca.
- Nada recorta a pessoa do fundo e nada fica sobre o rosto: funciona com a gravação de qualquer um.
- **O rosto está no primeiro quadro.** O vídeo abre com um bloco de barra (abertura, número, letreiro) já montado — nunca com tela preta.

## 5. Cores, textura e som

- **Paleta curta e com papéis**: preto quente `#0B0806` (barras, cartelas); marfim `#F0E6D2` (texto); âmbar `#D9A45B` e âmbar claro `#E9BE7E` (o único acento: créditos, ênfase, travessões, algarismos, traços dos desenhos e gráficos, régua do que ganha); cinza frio `#8C9196` (o que esfria, apaga ou está errado: o trecho riscado, o lado que perde, a etiqueta ILUSTRATIVO).
- **Gradação de filme** dentro da janela: contraste um pouco maior, cor menos saturada e puxada para o quente, vinheta suave e grão de película fino. No `destaque` de alerta, a imagem **esfria** (quase sem cor, tom frio). As barras ficam num preto limpo.
- **Som raro, grave e tonal** (`public/sfx/`): `fecha` quando as barras apertam num letreiro, abertura ou número (ou a tela fecha numa cartela); `pousa` quando a hora ou o número pousam, no significado e no segundo lado; `frase-1/2` sob cada frase-chave e destaque-chave; `alerta` (duas notas graves descendo) no destaque de alerta; `desce` (um sopro grave que desce) quando a janela desce para a cartela alta; `fim` nos créditos. Nada de "whoosh", clique de projetor, ruído de película ou sino.
- Nada de brilho atrás da pessoa, vazamento de luz, arranhão de filme, emoji, contorno no texto ou gradiente colorido.

## O que pode mudar por vídeo

- Textos, tempos, a curva de intensidade e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área dos créditos).
- O recorte (9:16 ou 3:4): o layout reenquadra a pessoa dentro da janela.
- `sfx: false` (sem sons) e `grao: false` (sem grão), se o usuário pedir.

## O que não mudar sem o usuário pedir

- Cores, fontes e tamanhos. Se o usuário quiser a cor da marca dele, troque **só** o âmbar (e o âmbar claro) em `src/tema.ts`; o preto quente e o marfim seguram o clima.
- A geometria dos níveis (`src/layout.ts`): a barra de baixo guarda o texto acima da interface do aplicativo (y < 1560); mexer nela empurra o texto para baixo dos botões.
- A regra de um momento por vez, de nenhuma cartela seguida de outra e de nenhum texto sobre o rosto.
- Não adicione barras de progresso, transições de corte, flashes ou stickers. Eles pertencem a outros modelos.

## Se precisar de algo que o modelo não tem

- **Um desenho novo** (uma carta, uma porta): em `src/componentes/Desenhos.tsx`, siga o molde dos existentes — `viewBox` próprio, traço 4 (3,5 nos detalhes), âmbar para o que tem luz, valor ou ênfase e marfim para o objeto, cada traço com `pathLength={1}` e `strokeDashoffset` ligado ao tempo para se desenhar, e **uma ação com significado** disparada pelos `passos`. Registre o nome em `TipoDeDesenho` (`src/plano.ts`), em `LARGURA_DO_DESENHO` e em `PROPORCAO_DO_DESENHO`.
- **Um componente novo**: texto dito usa `TextoEmFoco` (`src/componentes/Foco.tsx`, que mede e quebra o texto); texto que mora numa barra fica dentro de `NaBarra` (`src/componentes/Barras.tsx`), posicionado pelas faixas do estado assentado (`faixasDoEstado`), nunca em px fixos sobre o rosto; saída com `saindo` + um leve desfoque; e um nível de barras em `alvoDoBloco` (`src/layout.ts`). Consulte a skill do Remotion para as regras de animação.
- **Cuidado (a voz some)**: o vídeo da pessoa (`VideoNaCaixa`) fica **sempre montado**, mesmo com a tela fechada numa cartela — é ele que toca a voz. Se um componente o esconder com renderização condicional (`{aberta ? <VideoNaCaixa…/> : null}`), o render sai mudo naquele trecho. Para "esconder" a imagem, feche a janela (altura 0); nunca desmonte o vídeo. Depois de qualquer mudança, meça o áudio de um trecho de cartela no render (`ffmpeg -ss <de> -t 1 -i saida.mp4 -af volumedetect -f null -`): perto de −90 dB é voz sumida.
