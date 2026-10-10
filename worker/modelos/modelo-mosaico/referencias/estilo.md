# O estilo Mosaico

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a diagramação: uma página de revista em ladrilhos que se remonta a cada frase. Quase toda "melhoria" que adiciona enfeite piora o resultado. O estilo vale para qualquer assunto: o que muda de um vídeo para outro é o conteúdo dos ladrilhos, nunca a linguagem.

## A ideia

A tela é uma página cor de aveia coberta de ladrilhos arredondados, como um mosaico com rejunte. A pessoa é um desses ladrilhos. A cada momento da fala a página se remonta: a pessoa troca de lugar e de tamanho, o bloco novo ocupa o ladrilho grande, e a peça que fica (no exemplo, o prato) atravessa a página e segue se completando. A informação é organizada em pedaços — e a própria grade mostra a organização: uma lista vira faixas dentro do ladrilho, uma comparação vira dois ladrilhos, um todo vira o disco dividido.

## Motion

- **Remontagem** (`src/grade.ts`): 0,72 s, todos os ladrilhos com a mesma curva simétrica, encostada no corte mais próximo. A borda da frente de cada ladrilho sai antes e a de trás vem depois (o ladrilho se estica e assenta), então a página não abre buraco. Ladrilho que só cresce ou encolhe no lugar não força a troca em duas etapas; se alguém viaja na diagonal, a remontagem vai em duas etapas (horizontal, depois vertical) e nenhum ladrilho passa de 45% da tela no meio da troca.
- **Troca por dentro**: um bloco novo que cai em boa parte do lugar de um que sai herda aquele ladrilho; a cor nova varre o ladrilho na direção do movimento (nunca mistura as cores) e o conteúdo antigo some antes de o novo aparecer (sem dupla exposição).
- **Entrada e saída**: o que só entra cresce da borda da tela e revela o conteúdo como uma cortina; o que só sai encolhe para a borda.
- **Dentro do ladrilho**: tudo entra na palavra dita. Texto se revela palavra por palavra (uma cortina da esquerda para a direita, assentando de leve) e, terminada a entrada, é desenhado simples, sem máscara. Faixas, casas, pastilhas e ladrilhos de comparação nascem **a lápis** (contorno tracejado apagado) e se completam no seu `em`. Fatias do disco giram até a fração; números contam com freio; o trilho dos passos avança; a linha do gráfico corre e acende as pastilhas de baixo.
- **Ritmo**: uma remontagem a cada 1,2–5 s e, dentro de cada página, algo novo a cada 1,5–2,5 s. Sem quique, sem giro, sem escala elástica, sem tremida, sem zoom contínuo.

## Organização e hierarquia

- Uma ideia por página. O bloco principal ganha o ladrilho maior; a pessoa, um ladrilho em pé (meia largura) ao lado de um companheiro menor, ou uma faixa larga quando está sozinha.
- O companheiro é a peça que fica (o fio condutor), o bloco anterior (em gravação de selfie) ou a assinatura (nome e área).
- O grande é o dado, o termo ou a frase; o pequeno é rótulo, chapéu e apoio. Rótulos em caixa alta espaçada, chapéus com um filete que se desenha.
- **Mosaico dentro do mosaico**: listas em faixas, grupos em casas, gráficos em pastilhas, comparação e definição em dois ladrilhos com uma peça redonda pousada no rejunte (×, seta, =).

## Tipografia

- **Bricolage Grotesque** (títulos, números, frações, itens; 700 e 800; espaçamento −0,015 a −0,04em) e **Instrument Sans** (rótulos, apoio, legenda, rodapé; 600 e 700). As duas gratuitas, pelo Google Fonts. Nada de fonte condensada.
- **Frações tipográficas**: numerador em cima, barra inclinada que se desenha, denominador embaixo — nunca o caractere "½" pronto. É a marca visual do modelo (no grupo, dentro das fatias do disco, na legenda do prato).
- **Medida de verdade**: `src/medida.ts` mede cada texto com as larguras reais das fontes (`src/larguras.ts`), quebra em linhas equilibradas e reduz o corpo até caber. Tamanhos na tela de 1080: títulos de ladrilho grande até 128 px (≥ 84 px), destaque até 156 px, número até 340 px, itens 40–68 px, apoio ≥ 44 px, rótulos ≥ 34 px, caixa alta ≥ 30 px. Julgue em quadros reduzidos a 540 px.

## A moldura da pessoa

- Sempre um ladrilho da grade, cantos de 34 px, com o vídeo inteiro reenquadrado (nunca recortada do fundo). Nos respiros entre momentos, ela volta para a tela cheia (cantos retos) e a página some por trás dela.
- Ladrilho em pé (meia largura) com companheiro; faixa larga quando sozinha; nunca uma coluna estreita da altura da tela.
- O ladrilho segue o rosto (rastreio do motor). Ladrilho pequeno = mais perto do rosto; gravação de selfie (rosto grande no rastreio) = menos zoom e sempre ladrilho em pé, para a cabeça caber inteira.
- A pessoa muda de lugar a cada página, de preferência num eixo só e sem cruzar a peça que continua.

## Cores, textura e som

- Página aveia `#E7DFCF`; ladrilhos **creme** `#F8F3E9` (listas, gráficos, disco), **verde-folha** `#4F6B3C` (o principal, o que é bom), **tomate** `#C4553B` (alerta, problema, o lado errado), **gema** `#E1A73F` (número, chave, fechamento) e **tinta** `#262821` (frase de efeito, termo). Cada ladrilho com uma cor chapada; nunca duas iguais lado a lado.
- O destaque dentro de um ladrilho é uma cor só: gema no verde e no tinta, verde no gema e no creme, creme-claro no tomate.
- Sem sombra, sem brilho, sem degradê, sem textura, sem contorno em texto. O único dourado claro é o fio de azeite do exemplo.
- **Sons** raros e tonais: um encaixe grave em cada remontagem; uma nota de marimba suave (ré, fá sustenido, lá) por parte servida, dado dito ou número que termina de contar; um tom que desliza no azeite; um arpejo curto no fechamento. Quando dois caem juntos, fica a nota. Nada de ruído, clique agudo ou sino.

## Medidas

Margem 24 px, rejunte 16 px, raio 34 px (`src/tema.ts`). A grade vai de y = 24 a 1690; embaixo, o rodapé (nome e área em caixa alta 32 px à esquerda; uma peça por página à direita, a atual acesa em verde), que cai sob a interface do app. Nenhum texto passa de y = 1545. Legenda: peça creme dentro do ladrilho da pessoa, Instrument Sans 44, cada palavra escurecendo quando é falada.

## O que pode mudar por vídeo

- Os blocos, os textos, os tempos, a peça que fica e, se quiser, as grades e as cores de cada ladrilho (é o trabalho do plano).
- `marca` (nome e área).
- O recorte (9:16 para gravação vertical; 3:4 para horizontal).
- `sfx: false`, se o usuário não quiser sons.
- `pessoa.zoom` / `pessoa.ancoraY`, se a gravação for muito aberta ou muito fechada.

## O que não mudar sem o usuário pedir

- A paleta, as fontes, a margem, o rejunte, o raio e o tempo da remontagem (`src/tema.ts`). Se o usuário pedir as cores da marca dele, troque **uma** das cores de ladrilho (normalmente a `folha`) por uma cor da marca de valor parecido — escura o bastante para texto creme por cima — e mantenha a página aveia, o creme e a tinta.
- A curva e a mecânica da remontagem (`src/grade.ts`) e a escolha automática das páginas (`src/paginas.ts`).
- Não adicione emojis, stickers, barras de progresso, tremidas, flashes, zoom contínuo, sombras, brilhos, contorno em texto, degradês ou fotos de banco.

## Se precisar de algo que o modelo não tem

- **Um ícone novo**: acrescente os traços em `src/componentes/Icones.tsx` (caixa 100 × 100, só linhas, pontas redondas, sem preenchimento; confira num quadro que ele se lê a 120 px) e o nome em `Icone` (`src/plano.ts`).
- **Um arranjo pronto novo**: acrescente em `ARRANJOS` (`src/grade.ts`) com a grade e os pesos; o ladrilho da pessoa precisa de altura ≥ 0,55 × a largura e nunca é uma coluna estreita.
- **Um bloco novo**: um componente em `src/componentes/` que recebe `PropsBloco` (tamanho do ladrilho, altura útil acima da interface, paleta do ladrilho, palavras e janela de tempo), mede o texto com `encaixar` (`src/medida.ts`), usa `TextoFalado` para texto dito, `Icone` para ícones, `prog` para o tempo e as cores de `paleta`; registre em `src/componentes/Bloco.tsx`, no tipo `Conteudo` (`src/plano.ts`) e nas cores (`corPadrao` em `src/grade.ts`, `PREFERIDAS` em `src/paginas.ts`). Consulte a skill do Remotion para as regras de animação.
