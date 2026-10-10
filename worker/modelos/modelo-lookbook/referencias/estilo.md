# O estilo Lookbook

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma revista de moda de verdade, seja qual for o assunto: papel, tinta, uma cor só e muito cuidado com o espaço. Quase toda "melhoria" que adiciona brilho, cor ou enfeite tira ele desse lugar.

## A ideia

O vídeo é uma revista folheada. A pessoa é a foto da página e muda de lugar a cada página; a informação chega como as peças de um catálogo: o numeral grande da série, o cartão de produto com rótulos e valores, a amostra de tecido, a fita métrica do alfaiate, o pino com a linha fina, a colagem de recortes, a etiqueta de roupa. Em moda, essas peças descrevem roupas; em qualquer outro assunto, descrevem motivos, passos, números e ideias, com a mesma gramática.

## O sistema visual

### Motion

- **Espera a lápis:** tudo o que vai receber uma palavra chega antes, desenhado a lápis: títulos inteiros em cinza claro (capa, colagem, frase, pergunta, termo da definição), o lugar do texto tracejado nos cartões, amostras tracejadas com hachura, pinos tracejados na fita. Na palavra, ganha tinta. Nenhum cartão vazio.
- **Entradas:** o texto sobe de trás de uma máscara e assenta (e, terminada a subida, é desenhado simples); o pano da amostra se estende da esquerda para a direita; o pino se desenha (anel de tinta + miolo índigo); a linha fina corre do pino até o cartão; números contam e o pino corre na fita métrica; recortes da colagem chegam girados e assentam; a etiqueta sobe e assenta. Curva "decidida que assenta" (`assenta` em `src/anim.tsx`); sem quique, sem elástico, sem brilho, sem tremida.
- **Trocas de página:** a foto desliza para o novo lugar em 0,62 s, começando no corte mais próximo. O que é de papel (títulos, listas, gráficos, a coluna) fica **embaixo** da foto: ela cobre como cortina o que sai e revela o que entra. O que avança sobre a foto (cartões laterais, pinos, recortes da colagem, a etiqueta) fica por cima; o cartão novo só entra 0,28 s depois do início, quando o velho já saiu (0,26 s). Nunca dois textos um sobre o outro.
- **Sempre acontecendo algo:** cada item entra no seu `em`; nada fica parado mais de ~2,5 s; a página muda a cada momento.

### Organização e hierarquia

- Uma página por ideia. Cabeçalho corrido no topo o vídeo todo: o nome da "revista" à esquerda, o fólio à direita ("Nº 01 / 03" nas páginas numeradas, a área da marca no resto), sobre um fio fino de tinta. A foto nunca cobre essa faixa.
- **Página lateral** (`peca`, `destaque`, `frase`, `pergunta`): coluna de papel com a marca da página no alto (numeral "01 de 03", pino grande com fio de prumo, aspas, interrogação) e o cartão embaixo, assentado na base (1572 px), avançando sobre a foto só abaixo do queixo.
- **Página larga** (`topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao`): título em itálico, depois o conteúdo de cima para baixo, centralizado na área e crescendo para ocupá-la (a área nunca fica com um terço vazio).
- O que é grande: o numeral, o número que conta, o termo, o nome do item. O que é pequeno: rótulos em caixa alta, detalhes em sans, a escala da fita.

### Tipografia

- Playfair Display 400 (algarismos alinhados): títulos, numerais, nomes, valores, frases; itálico para complementos, destaques e títulos de página.
- IBM Plex Sans 400–600: rótulos em caixa alta espaçada (0,18em), detalhes, opções, legenda. O "I" maiúsculo tem serifa.
- Tamanhos no quadro de 1080: numeral 196 px; manchete até 150; títulos 56 a 156; texto de cartão ≥ 44; rótulos ≥ 30. O texto é medido com as larguras reais das fontes (`src/larguras.ts`, `src/medida.ts`) e encolhe ou quebra (até 2 ou 3 linhas) para caber; um trecho de destaque não é quebrado entre linhas.

### Moldura da pessoa

- A pessoa é a foto: nunca recortada do fundo nem distorcida; o rosto é seguido quadro a quadro (`VideoNaCaixa` do motor).
- Lugares (`src/pessoa.ts`): `capa` (emoldurada pelo papel, de 500 px para baixo), `direita`/`esquerda` (680 × 1564 px, de ombro a ombro), `topo`/`baixo` (retrato de 1080 px de largura, 780 px de altura; até 920 px quando o rosto é grande, para olhos e queixo caberem), `colagem` (impressão girada com borda branca), `cheio` (quadro inteiro).
- O queixo é calculado pelo rastro do rosto: cartões laterais e retratos largos o respeitam. O rosto nunca é coberto; pinos só na roupa, nunca no rosto nem nas mãos.

### Cores, textura e som

- Papel areia `#EFEAE1`; cartões e etiquetas em `#F8F5EF` com sombra suave, sem cantos arredondados; tinta `#171614`; lápis `#ADA597` / `#CFC8BB`.
- **Um acento:** índigo de jeans `#2C4069` (numeral, miolo do pino, destaque, o lado que vence, o maior dado). **Alerta:** vinho escuro `#7A2C2C`, só para alerta e risco.
- Textura vem das amostras de tecido (linho, sarja, lã, algodão, jeans, couro, metal…) e da fita métrica em papel cru. Nos blocos universais, a cartela neutra do modelo (`CARTELA` em `src/tema.ts`) e o jeans para o que importa.
- Sons (`public/sfx`): um grave que desce a cada troca de página, uma nota curta no pino (subindo de altura), um acorde quando a colagem se forma, um tom grave na capa e na etiqueta. Nunca dois a menos de 0,45 s. Nada de ruído, clique agudo, papel ou sino.

## O que pode mudar por vídeo

- Textos, tempos, blocos e layouts (é o trabalho do plano).
- `marca`, `cabecalho` (o nome da "revista"), `folio` da colagem, `rotulo` das páginas de catálogo.
- `pontos` do corpo e `zoomLado`, quando há pinos na roupa.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Papel, tinta e fontes. Se o usuário pedir as cores da marca dele, troque **só** o índigo (`indigo` e `indigoClaro` em `src/tema.ts`) por um tom escuro e sóbrio da marca; o papel e a tinta seguram o editorial.
- A regra de anotar a roupa e nunca o rosto nem as mãos; o cartão lateral abaixo do queixo.
- As camadas das trocas (papel embaixo da foto, cartões por cima) e a espera a lápis.
- Não adicione emoji, figurinhas, fita adesiva, brilho atrás da pessoa, contorno nas letras, gradiente colorido, barras de progresso ou transições de efeito. Eles pertencem a outros modelos.

## Se precisar de algo que o modelo não tem

- **Um tecido novo:** um `case` em `Trama` (`src/componentes/Amostra.tsx`), o nome no tipo `Tecido` (`src/plano.ts`) e em `NOME_TECIDO` (`src/componentes/Ficha.tsx`).
- **Uma cor nova:** em `CORES` (`src/tema.ts`).
- **Um ponto do corpo usado sempre:** em `PONTOS_PADRAO` (`src/pessoa.ts`); para um vídeo só, `pontos` no plano.
- **Um bloco novo:** siga a gramática acima — a foto num dos layouts de `src/pessoa.ts`, a área de `areaDaPagina`/`ladoDaPagina`, papel e tinta de `tema.ts`, texto medido com `src/medida.ts`, entrada por máscara com `Sobe`, saída com `saida()`, espera a lápis, camada "papel" ou "sobre" em `src/Edicao.tsx` — e consulte a skill do Remotion para as regras de animação.
