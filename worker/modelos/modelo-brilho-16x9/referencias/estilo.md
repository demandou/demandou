# O estilo Brilho

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a sensação de uma revista de beleza feita sobre a pessoa: um camarim editorial em creme, com a informação aparecendo na pele, no peito ou numa página ao lado no instante em que é dita. Funciona com qualquer assunto porque o estilo está no **jeito** de mostrar, não no tema. Quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

A pessoa fica em quadro cheio e a edição escreve sobre ela: o título se monta no peito, palavra por palavra, e a palavra-chave ganha uma faixa de cor passada por trás, como uma amostra de batom no papel. Quando a explicação pede espaço, a pessoa desliza para um lado e uma página creme abre do outro: rótulo em caixa alta, número enorme e fino, o nome, a amostra de cor passada, os itens com círculos vinho. Quando o rosto entra na metáfora (pensar, ver, falar — ou a maquiagem do exemplo), traços finos creme anotam o próprio rosto e uma linha-guia liga a marca ao texto da página. Os cartões creme sobem de baixo e param antes do queixo.

## Os cinco pontos do estilo

1. **Dinâmica do motion.** Entra macio e decidido (curva que desacelera no fim), assenta sem quique. Palavras sobem de trás de uma máscara no tempo da fala e, assim que terminam de entrar, viram texto simples (nada de camada escondida). A faixa de cor passa da esquerda para a direita atrás da palavra; vizinhas marcadas formam uma faixa só. Amostras são "passadas" no papel; godês "prensam" a cor; traços se desenham; números contam; o número grande do painel rola para o próximo; o cartão sobe e cresce a cada item; a mancha do blush sobe; o brilho cintila de leve (o único movimento contínuo). O que vai chegar já está "a lápis" (cinza, tracejado) e ganha cor quando é dito.
2. **Organização e hierarquia.** Uma ideia por vez. Página: rótulo em caixa alta vinho → número enorme e fino → nome grande → amostra → itens (círculo vinho + texto), espalhados até a base. Cartão: número ou "?" grande à esquerda, divisória fina, rótulo e nome, godê à direita, itens embaixo. Peito: linha grande e fina, depois linhas menores. O item atual fica cheio; os anteriores ficam com 55% de opacidade.
3. **Tipografia.** Uma fonte: Quicksand (Google Fonts). 300/400 só nos números grandes (150 px ou mais) e na primeira linha da abertura; 500 no texto corrido; 600 nos nomes, itens, dicas e legenda; 700 nos rótulos em caixa alta espaçada (30 px, 0,2 em). A Quicksand fina fica fraca no celular: texto de leitura nunca abaixo de 500 nem de 40 px. Todo texto é medido com a largura real da fonte (`src/medida.ts`, `src/larguras.ts`) e encolhe até caber, quebrando em linhas.
4. **Moldura da pessoa.** `cheio` (rosto na linha do centro; o zoom troca seco 1 ↔ 1,06 nos cortes), `perto` (aproximação no rosto) e `lado` (a pessoa ocupa 600 px de largura, ~56%, e o painel creme o resto; alterna de lado). A troca acontece no corte e leva 0,6 s; o painel acompanha a borda da pessoa; quando ela volta, cobre a página antes de o texto novo aparecer. Nada de recortar a pessoa do fundo nem de encolher a pessoa numa janelinha. Cartões param antes do queixo (calculado com `rostoLargura`).
5. **Cores, textura e som.** Creme `#F8F0EA` (papel, cartões, traços), creme escuro `#E9D9CF` (divisórias), tinta ameixa `#3A2330` (texto no creme), tinta suave `#7A6570`, lápis `#C9B9BD` (o que ainda vai chegar), **um acento vinho** `#8E2A4E` (números, círculos, linhas, alerta), blush `#E8A3A3` (faixa da palavra-chave, número no peito, risco). Cores de amostra (pêssego, rosa, bronze, batom, nude…) só nas amostras, nos gráficos e nas marcas. Traços das anotações em creme quase branco, finos (3–4 px), com uma sombra mínima para separar da pele clara. Som raro e tonal: tom grave na abertura e no fechamento, uma nota por bloco subindo como uma escala, a nota mais grave no alerta, um acorde no resultado. Nada de ruído, "risco de papel", clique agudo, sino ou "plim".

## Os blocos universais na linguagem do Brilho

- **No peito** (`abertura`, `numero`, `destaque`, `frase`, `resultado`): creme com sombra suave sobre um véu escuro que sobe embaixo; a faixa de cor por trás do que importa; o número grande em blush; ícones a traço num círculo.
- **No cartão que sobe** (`truque`, `comparacao`, `grafico`, `pergunta`, `cta`, `amostras` em godês): creme, cantos de 48, sombra suave; godês, passadas e pinceladas no lugar de barras e marcadores genéricos.
- **Na página ao lado** (`truque`, `topicos`, `passos`, `definicao`, `amostras`): a mesma folha do truque, com a costura do lado da pessoa, as amostras passadas, os círculos vinho e as linhas-guia vinho.

## Medidas (quadro 1080 × 1920)

- Margem lateral 56–64 px; interface do app abaixo de 1560 px; cartões terminam em 1530 (1372 com legenda); legenda em 1404.
- Abertura: primeira linha até 150 px (300), demais até 98 px. Número no peito: 300 px (encolhe junto com prefixo e sufixo). Destaque: até 118 px. Frase: até 100 px.
- Painel: rótulo em 92 px do topo; número 300 px (truque) ou 140–250 px (passos); nome até 110 px; amostra 130–156 px de altura; dicas 54 px (até 44); itens dos tópicos 40–64 px; base em ~1486 px.
- Cartão: 1000 px de largura; dicas 48 px (até 40); "?" e número com 160–170 px; godê 124–144 px.
- Etiquetas no rosto: 42 px; círculos e pontos com ~0,07–0,12 da largura do rosto.
- Julgue sempre em quadros de 540 px de largura.

## O que pode mudar por vídeo

- Textos, tempos, blocos, layouts e marcas (é o trabalho do plano).
- `marca` (nome e área).
- `cor` de truques, marcas, amostras e itens (nome de produto/tom ou hexadecimal); `rotulo` dos truques.
- `zonas`, `zoomPerto`, `zoomLado` e a `altura` do triângulo, para ajustar a este rosto.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores da interface, fonte, espessuras de traço e tamanhos de texto (`src/tema.ts`). Se o usuário pedir a cor da marca dele, troque **só** o acento (`berry`): o creme e a tinta seguram o estilo; um vinho mais escuro, um terracota ou um rosa-antigo funcionam.
- As posições dos layouts (`src/layout.ts`) e as zonas padrão do rosto (`src/rosto.ts`).
- A regra de um acento: se tudo fica vinho, nada é assunto.
- Não adicione emojis, stickers, brilho ou glow atrás da pessoa, texto com contorno, tremidas, flashes, transições entre cortes ou fotos de banco. Não simule antes-e-depois nem "pele perfeita": as marcas são um guia.

## Se precisar de algo que o modelo não tem

- **Uma zona nova do rosto**: acrescente em `ZONAS` (`src/rosto.ts`) e no tipo `Zona` (`src/plano.ts`). Confira com `stills.mjs --guias`.
- **Uma forma nova de marca**: siga as de `src/componentes/Marcas.tsx` (geometria em `rosto.ponto({ u, v })`, cor esfumada na `CamadaDeCor`, traço creme na `CamadaDeTraco`, tudo no `em` da palavra).
- **Um ícone novo**: acrescente o traço em `src/componentes/Icones.tsx` (caixa 100 × 100, só linhas) e o nome em `Icone` (`src/plano.ts`).
- **Uma cor de amostra nova**: acrescente em `PRODUTOS` (`src/tema.ts`).
- **Texto que precisa caber num lugar novo**: use `medir`/`TextoFalado` (`src/componentes/Texto.tsx`), nunca estimativa por número de letras.
- Consulte a skill do Remotion para as regras de animação.
