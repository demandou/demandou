# O estilo Campo

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o **caderno de campo**: a vista de cima com os talhões que se contornam na fala, e os instrumentos do painel (cotação, medidor, previsão) que mostram literalmente o que a pessoa diz. Ele é feito de poucas peças repetidas com rigor: chão de palha com curvas de nível, cartão creme com cabeçalho verde, etiqueta em mono, contorno e mira em amarelo de sinalização. Quase toda "melhoria" que adiciona outro tipo de peça (brilho, neon, fundo escuro de painel, textura de couro, trator em 3D, bandeira) piora.

O estilo vale para qualquer assunto: agro, pecuária, máquinas, cooperativas, mas também finanças, saúde, carreira e histórias. O que muda de um vídeo para outro é o mapa, as fotos e os textos, nunca a linguagem visual abaixo.

## A ideia

A pessoa mostra o campo dela. O vídeo **abre o caderno do agrônomo**: a vista de cima com os talhões contornados, o indicador que subiu, o reservatório que baixou, a chuva que vem, a planilha. A pessoa fica embaixo o tempo todo, numa moldura larga (nunca numa coluna estreita).

## 1. Dinâmica do motion

- **Pouso**: todo cartão entra descendo sobre o painel: escala 1,05 → 1 e sobe 14–26 px em 0,36 s, sem passar do ponto (curva de saída suave). Terminada a entrada, o cartão fica desenhado limpo.
- **Contorno de talhão**: o traço amarelo (com um traço escuro por baixo, para ler sobre telhado branco) corre em volta de cada talhão em 0,55 s, um talhão a cada 0,07 s, a partir de `contornoEm`; uma faixa amarela de varredura desce uma vez pelo mapa.
- **Câmera de drone**: o mapa se aproxima devagar (1,02 → 1,06) o tempo todo; em cada `marcar`, voa até o talhão (0,35 s antes da palavra, 0,8 s de viagem), que ocupa ~38% da largura; nunca mostra borda.
- **Mira de levantamento**: quatro cantos que chegam de fora (46 px) e travam no alvo em 0,38 s: no talhão marcado (em creme sobre a foto), na foto que entra (amarelos), no vencedor da comparação.
- **Texto**: palavra por palavra, cada uma subindo 28% do corpo e acendendo em 0,22 s no instante em que é dita; o grifo amarelo corre por trás do trecho `destaque` logo depois.
- **Instrumentos**: o mini-gráfico da cotação anda do nível de antes (tracejado) até o de agora, com o ponto final pulsando; a variação conta em 0,6 s e dá um soco de 5%. O nível do medidor vai do cheio até a fração dita com uma onda na superfície e uma gota caindo do gotejador; a marca amarela se estende quando a fração é dita. Na previsão, a frente que chega desliza da direita e os quadros da direita viram (giro horizontal curto) um a um.
- **Sempre vivo**: as curvas de nível do fundo derivam, as fotos se aproximam (1,04 → 1,14), a chuva cai, o sol gira devagar, os brotos balançam, a planilha flutua ±4 px, o braço do pivô gira.
- **Troca de bloco**: o bloco que sai some em 0,14 s; o próximo pousa. Nada de cortina, flash, giro ou zoom brusco.

## 2. Organização e hierarquia

- **Duas partes**: o painel em cima (x 64 a 1016, y 132 a 976; a interface do app ocupa os primeiros ~120 px) e a moldura da pessoa embaixo (x 36 a 1044, a partir de y 1012, cantos de 40 px, borda creme de 6 px; os de baixo ficam fora do quadro).
- **Talhão**: título (opcional) centrado no alto, até 2 linhas, quebrando antes do trecho grifado; o mapa ocupa o resto do painel, num cartão de borda creme. Rosa dos ventos (só o "N") no canto de baixo à direita; "ilustrativo" no canto de baixo à esquerda quando o mapa é desenhado.
- **Cotação e medidor com foto**: a foto entra ocupando o painel inteiro (952 × 844 px) com o rótulo se escrevendo numa etiqueta; quando o instrumento tem o que mostrar (o movimento, o nível), ela recolhe para a faixa de cima (952 × 372 px, 0,4 s) e o cartão pousa embaixo dela. Nunca um cartão vazio esperando dado. Sem foto, o instrumento ocupa o painel.
- **Cotação**: cabeçalho verde de 82 px com o rótulo em mono e a seta; a variação à esquerda (até 170 px), o período numa etiqueta amarela embaixo dela, o mini-gráfico à direita.
- **Medidor**: o reservatório à esquerda (290 px de largura) com a mangueira e o gotejador em cima; o texto à direita, alinhado à esquerda, até 3 linhas.
- **Previsão**: a frase no alto (centrada, quebra antes do "quando"); o céu sobre a lavoura em perspectiva; a faixa de 7 quadros sem rótulo embaixo e a chave com o "quando" sob os 3 da direita.
- **Fechamento com material**: a planilha de verdade (até 600 px: cabeçalho verde com o nome e a seta de baixar, coluna ITEM com os itens escritos, coluna ✓, "Total" em amarelo) e a chamada embaixo dela, o conjunto centrado no painel. Sem itens, o arquivo com a seta de baixar. Nada de barras cinza de "carregando".
- **Gráfico sem números**: colunas nomeadas (2 a 5) centradas sobre a faixa de terra, a que a fala destaca em verde com o broto, as outras em terra clara; nome embaixo de cada uma; "ilustrativo" pequeno no canto de cima à direita, com folga.
- **Margens**: nada de texto ou cartão a menos de 64 px das laterais, nada acima de y 120, nada importante abaixo de y 1700.
- **Tarja**: no terço de baixo da moldura, à esquerda (x 64), logo abaixo do queixo: quadrado amarelo com o broto, nome em Plus Jakarta 800 de 46 px (mínimo 34) e área em Fira Mono 700 caixa alta de 28 px (mínimo 22), verde. Fica de 0,25 s a ~2,6 s.
- **Legenda**: só quando um momento pede (`legenda: true`): pílula creme abaixo do queixo, até 4 palavras, a palavra dita com o grifo amarelo.

## 3. Tipografia

- **Plus Jakarta Sans** (Google Fonts) 800 para títulos e chamadas, 700 para itens e texto corrido, 600 para detalhes; tracking −0,02em no 800 e −0,01em no resto (nunca mais apertado que −0,025em).
- **Fira Mono** 700 para todo número (variação, leitura, valores do gráfico) e para os rótulos de instrumento e etiquetas em caixa alta ("CAIXA DO TOMATE", "SEMANA QUE VEM", "ILUSTRATIVO"), tracking +0,04em.
- Tamanhos: abertura 56–108 px; título de talhão 48–82 px; previsão 46–76 px; medidor 46–86 px; título de bloco 40–64 px; itens 28–54 px; variação da cotação até 170 px; número até 200 px.
- O texto é medido com as larguras reais das fontes (`src/larguras.ts`; a mono tem 0,6 do corpo por caractere) e reduz até caber; nunca vaza nem é cortado.

## 4. Moldura da pessoa

- Sempre a moldura larga embaixo; o rosto ocupa ~28% da largura da moldura, com o centro no eixo do quadro e ~60 px de folga acima do cabelo.
- `VideoNaCaixa` com `rosto={plano.rosto}`: a moldura segue o rosto quadro a quadro.
- Escala por trecho: 100% ↔ 106% em corte seco, só quando o trecho anterior durou mais de 1 s. Soco de 4% quando a variação da cotação ou um número bate.
- **Nunca** mexa na cor do vídeo: sem filtro, brilho, halo ou luz atrás da pessoa. A única sombra é a da moldura, para fora dela.

## 5. Cores

| Papel | Cor |
|---|---|
| chão do painel (palha) | #EFE9DA (luz no centro, #E6DEC9 nas bordas), curvas de nível marrons a 16% |
| cartões | #FFFDF7, borda #E0D6BF, sombra macia marrom |
| tinta | #1E2B20 (texto), #5F6B58 (detalhes) |
| verde-lavoura | #2F7A3A (o que cresce, o certo), #1F5A2A (cabeçalhos), #DDEBD2 (claro) |
| terra | #9A5B2E (solo, o que cai, o lado ruim), #F1E1CF (claro) |
| céu e água | #3D8FCC, #22679E (escuro), #DCEEFA (claro) |
| amarelo de sinalização (o único destaque) | #F4BE1B: contorno de talhão, mira, grifo, palavra-chave, período, cursor |
| alerta | #B9412A (só no `destaque` de alerta e no risco) |

Não use preto com dourado, fundo escuro de painel (é o Painel), verde-limão neon, gradiente arco-íris nem as cores de marcas de máquinas.

## 6. Sons

Tonais, raros e bem abaixo da voz (volume 0,12 a 0,24 antes da normalização a −14 LUFS): um "toc" de madeira quando os talhões começam a se contornar e na chave da previsão, uma nota de kalimba por item (ré, mi, fá#, lá), um pouso grave quando o talhão acende e quando a chuva chega, duas notas subindo quando o número bate e na chamada final, uma gota no nível do medidor. Nada de sino, trator, mugido, aplauso ou ruído branco.

## 7. Imagens

- **Vista de cima**: foto de drone ou satélite, nadir (de cima), sem rótulo de mapa, com as divisas visíveis; os talhões são marcados à mão em `areas`. Sem foto boa, o mapa desenhado (com "ilustrativo").
- **Cotação e medidor**: a coisa dita, de perto e reconhecível (caixa de tomate, saca, gado no cocho, gotejador), em paisagem; enquadre pelo `foco`.
- Nunca imagem com texto, logo, marca de máquina ou pessoa reconhecível.
