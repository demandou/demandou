# O estilo Estúdio

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer o corte de um podcast bem produzido — uma mesa de corte com câmeras, a voz visível e um pacote gráfico de programa — com qualquer assunto. Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

Num podcast gravado em vídeo, o editor do corte faz três coisas: troca de câmera nas frases fortes, põe na tela o que importa da conversa e lembra de onde aquele trecho saiu. O modelo repete isso com qualquer fala. A pessoa está sempre num quadro de câmera; nos cortes e nas viradas, a câmera troca seco para o close. A voz é visível: a onda do áudio de verdade corre embaixo do quadro, passando por uma agulha. A cada ideia o quadro muda de lugar para dar espaço ao que é dito — o cartão de entrevista, a pauta, o número que conta, a história no tempo, o gráfico, a frase para salvar — e, no fim, vira a capa do próprio episódio num player. No alto, a régua do episódio diz o tempo todo em que capítulo estamos.

## 1. Dinâmica do motion

- **Troca de lugar do quadro**: 0,55 s, curva macia nas duas pontas, começando 0,15 s antes do momento (o corte que cai na fronteira some no movimento). O quadro muda de lugar, não de forma: nunca estica nem distorce o vídeo (o `VideoNaCaixa` só reenquadra).
- **Câmeras**: troca seca de enquadramento (aberto 1×, médio 1,14×, close 1,28×), com a luz rosa da etiqueta piscando. Nada de zoom animado, "punch-in" elástico, tremida ou flash.
- **Texto que acende**: perguntas, respostas, itens, lados, frases, significados e a chamada nascem inteiros a lápis (24% de branco) e cada palavra acende no instante em que é dita; o destaque acende em rosa. O gancho da abertura e o rótulo do player se montam palavra por palavra (sobem e assentam). Terminada a animação, a palavra é desenhada uma vez só, simples.
- **Contagem e varredura**: números contam até o valor dito; barras (a trilha, o medidor, a tendência) se enchem de rosa da esquerda para a direita com uma agulha branca correndo, como a onda de um editor de áudio.
- **Espera sem vazio**: o que vai receber algo (marca da fileira, marco, botão, placa de alerta, barra do gráfico) nasce tracejado ou a lápis.
- **Entradas e saídas sem dupla exposição**: cartões sobem de baixo, opacos, cobrindo o que estava ali, e descem vazios (o texto some antes). Cartão que encosta em outro troca no lugar. Os textos que dividem a mesma faixa saem inteiros até o fim do momento; o próximo só aparece depois. O que fica ao lado do quadro espera ele liberar o espaço e sai antes de ele voltar.
- **Ritmo**: algo novo a cada ~1,5–2,5 s; nada parado mais de ~2,5 s. Movimento editorial: entra decidido e assenta, sem quique nem elástico. Cada animação diz alguma coisa (o número corre até o valor dito, o risco passa na palavra negada, o botão é apertado no verbo).

## 2. Organização e hierarquia

- Três andares: a **régua** no alto (y 156–244), o **quadro** com a onda presa embaixo, e o **conteúdo** na faixa que sobra (embaixo do quadro até ~1540 px, ao lado dele nas colunas, ou em cima quando ele desce para o pé da tela).
- Uma ideia por tela. O texto principal é o maior; rótulos mono pequenos ficam no alto do conteúdo, com um fio até a borda; detalhes e marcas de tempo menores.
- Listas e passos: um corpo só para todos os itens (o maior em que todos cabem), cada item na sua linha.
- O item da vez é marcado: cursor rosa (pauta), segmento rosa enchendo (passos), barra rosa (gráfico), contador "02/03".

## 3. Tipografia

- **Schibsted Grotesk**: 800 nos títulos, números, itens, perguntas e frases; 700 na legenda, rótulos de gráfico e significados; 600 no apoio (resumo da pergunta, detalhes). O **I maiúsculo tem serifa**: "Iogurte", "IPTU" e "Il1" nunca confundem I com l.
- **Martian Mono** 500, caixa-alta: EP, CAM, capítulo, relógio, cronômetro, PERGUNTA/RESPOSTA/EM PAUTA/GLOSSÁRIO, marcas de tempo, números de capítulo, pontas da trilha.
- Espaçamento das letras de −0,012em nos títulos (nunca mais apertado que −0,025em); nada condensado.
- As medidas vêm da própria fonte (`src/medidas.ts`): o template escolhe o corpo e quebra as linhas antes de desenhar; com texto longo, diminui até ~44 px e aceita mais uma linha. Nunca corta nem vaza.
- Tamanhos (julgue nos quadros reduzidos a 540 px): gancho 64–108 px, destaque 60–120, pergunta 56–96 (até 44 com opções e texto longo), resposta 56–100, itens da pauta e dos passos 44–84, lados da comparação 52–100, frase até 112, termo 64–104, significado 44–72, número grande até 220, unidades 34–58, legenda 46–56; rótulos mono 30–40. Nada abaixo de 30 px.

## 4. Moldura da pessoa

- **Sempre num quadro de câmera**: cantos de 30 px, filete claro de 2 px (10% de branco), sem sombra, sem brilho atrás. Etiqueta da câmera no canto de cima à esquerda (fundo escuro translúcido, luz rosa, "CAM 3 · CLOSE" em mono 32 px; só "CAM 3" nas colunas). Nada é desenhado sobre o quadro além da etiqueta; o rosto nunca é coberto.
- **Os lugares** (px no 1080×1920): palco 1008×1040; abertura 1008×860; entrevista 1008×660; citação 1008×740; pauta 1008×580; coluna à esquerda 480×700; coluna à direita 480×760; pé da tela 1008×600 (y 868–1468); capa do player 872×720 (menor com a chamada em 2–3 linhas). Nunca uma coluna estreita: as colunas têm 480 px de largura e a cabeça inteira.
- **Rosto**: seguido quadro a quadro (o rastreio do motor). O template mantém olhos e queixo sempre dentro do quadro; a cabeça inteira (cabelo e queixo, com 26 px de folga) quando a gravação deixa. Em gravação perto da câmera, o quadro largo afasta até onde dá e deixa o alto do cabelo sair, como num close de verdade.
- **O começo**: quadro cheio no primeiro meio segundo, depois recua para o estúdio revelando a régua.

## 5. Cores, textura e som

- Estúdio quase preto (#0C0B0E, com um leve degradê para #121116 embaixo), painéis #17161B (cartões, player), painel claro #211F26 (a linha da vez na pauta).
- Texto em branco quente (#F3EFE8), suave a 64%, a lápis a 24% e 36%.
- **Rosa elétrico (#FF3D7F) = a luz de "no ar"**: a onda falada, o chip, o capítulo atual, o destaque, o risco, o marco, o botão, a placa de alerta, o item da vez, as marcas de tempo ditas. Texto sobre o rosa em #160A10. **Uma cor de acento só**: nada de segunda cor, gradiente colorido ou brilho.
- Sons em `public/sfx/` (tonais, raros, nunca dois a menos de 0,45 s): `abre.wav` (grave, quando o quadro recua), `capitulo-1/2/3.wav` (uma nota por capítulo novo, subindo), `marco.wav` (nota curta: marco da trilha e placa de alerta), `seguir.wav` (duas notas no botão do fim). Nada de clique, sino, ruído, "whoosh" ou trilha.

## 6. Áreas reservadas

- Nada acima de 150 px (abas do app) nem abaixo de 1570 px (interface do app).
- A trilha, o medidor e os gráficos terminam em x 960 (à direita, embaixo, ficam os botões do app).

## O que pode mudar por vídeo

- Textos, tempos, blocos, capítulos e câmeras (é o trabalho do plano).
- `marca` (nome e programa) e `episodio` (número, início do corte, duração total).
- `cabeca`, quando a gravação pede.
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; gravação horizontal vira 3:4.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica do quadro (`src/layout.ts`): os lugares, a duração e a curva da troca, os fatores das câmeras. É a identidade do modelo.
- A onda medida: não troque por barras aleatórias.
- Cores. Se o usuário pedir a cor do programa dele, troque **só** o `acento` em `src/tema.ts` (e, se ela for clara, o `sobreAcento`) por uma cor forte que leia sobre o preto. Uma cor só.
- As fontes e os tamanhos; as margens de 36 px.
- Não adicione emojis, logotipos de plataforma de podcast, microfones desenhados, brilho atrás da pessoa, contorno nas letras, gradientes coloridos, flashes, zoom animado ou transições além da troca de lugar e da troca de câmera.

## Se precisar de algo que o modelo não tem

Os 11 blocos universais e a assinatura cobrem as formas de qualquer fala (`references/adaptar.md`). Se ainda assim precisar de outro componente, crie-o em `src/componentes/` seguindo `Definicao.tsx` (faixa embaixo do quadro com `abaixoDoQuadro`, `caber` para o corpo, `Linhas` com `modo="acende"`, `faixa()` para entrar depois e sair antes) ou `Pauta.tsx` (cartão com `ritmoDoCartao`); se ele precisar de outro lugar para o quadro, acrescente em `LUGARES` e em `layoutDe` (`src/layout.ts`), e o tipo em `src/plano.ts`. Mantenha o rosa como única cor e o texto a lápis antes da fala. Consulte a skill do Remotion para as regras de animação.
