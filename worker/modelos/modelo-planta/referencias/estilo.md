# O estilo Planta

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a precisão: parece uma prancha de arquiteto sendo desenhada na hora, seja qual for o assunto. Quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

Uma prancheta. Quando a pessoa explica algo, a tela vira papel de desenho e o que ela diz vira desenho técnico no mesmo instante: uma lista vira as notas numeradas da folha, uma sequência vira um percurso tracejado, um número vira uma cota que conta, duas opções viram duas vistas, uma tendência vira uma elevação, e uma ideia encadeada vira uma **planta baixa** em que cada cômodo é uma parte da ideia e a circulação mostra o caminho. Para abrir espaço para a prancha, a pessoa muda de lugar na tela (sobe para uma faixa larga ou vira uma janelinha presa no canto) e volta para a tela cheia nos cartões do peito.

## O sistema visual

### Dinâmica do motion
- **Tudo se desenha na fala.** Linhas se traçam (o traço cresce do começo ao fim), paredes se fecham em volta do cômodo, a circulação tracejada avança até o item dito, números contam (1,2 s, com freio) enquanto a cota cresce, cada palavra de um título ou de uma frase sobe de trás de uma régua no instante em que é dita.
- **A lápis → a nanquim.** O que ainda vai ser dito já aparece esboçado em cinza claro e tracejado (o título da prancha, o termo da definição, os marcadores das notas, os círculos dos passos, as molduras da comparação, os números dos cômodos, o contador em zero). Quando a palavra é dita, passa a grafite. Assim a folha nunca fica vazia e nada aparece antes da hora.
- **Ao longo dos eixos.** Cartões desenrolam de cima para baixo, a prancha sobe junto com a borda do vídeo, itens entram deslizando na horizontal, áreas crescem do centro. Nada gira, quica, pulsa ou treme. Curvas decididas que assentam (`entra` e `preciso` em `src/anim.tsx`).
- **Trocas.** A pessoa muda de lugar em 0,6 s, começando no corte mais próximo. De tela cheia para a prancha, a folha já está montada por baixo e a pessoa encolhe revelando-a; da prancha para a tela cheia, ela cresce por cima da folha e o cartão seguinte só desenrola depois. De uma folha para outra, a **régua paralela** (faixa de papel com filete e marcas de escala) desce pela tela em 0,5 s: acima dela, a folha nova; abaixo, a velha. Nunca duas folhas uma sobre a outra, nunca papel vazio. Entre dois cartões, o primeiro termina de apagar no começo do segundo.
- **Nada parado.** Algo novo a cada 1,5–2,5 s dentro de cada bloco.

### Organização e hierarquia
- Uma ideia por folha. **Cabeçalho** no alto (número de chamada num círculo, título em Sora que vira nanquim na fala, régua fina, subtítulo), **corpo** com o desenho ou a lista, **notas** pequenas (rótulos técnicos em mono, "SEM ESCALA", "ILUSTRATIVO").
- **Um acento por vez**: o terracota marca só o que está sendo dito agora (o item da vez, a cota, a circulação, o cômodo em alerta, a ênfase). O resto fica em grafite e cinza. Se tudo fica terracota, nada é assunto.
- Forma de cada informação: lista = notas com marcador quadrado e nível ▷; sequência = círculos numerados ligados pela circulação; número = cota; comparação = duas vistas; gráfico = elevação (prédios, terreno, planta circular, escada); definição = termo com cota e linha de chamada; ideias encadeadas = cômodos de uma planta com circulação.

### Tipografia
- **Sora** (Google Fonts): 300 para títulos e números grandes, 400 para textos e itens, 600 só na ênfase. **IBM Plex Mono** 500, caixa alta espaçada (0,08–0,14 em): rótulos técnicos, cotas, níveis, números dos cômodos, etiquetas.
- Tamanhos no quadro de 1080: títulos de prancha 56–88 px (uma linha enquanto der ≥ 64 px), texto de abertura 60–104 px, números 72–210 px, textos de corpo ≥ 44 px, detalhes ≥ 34 px, rótulos técnicos ≥ 28 px. Espaçamento entre letras de no máximo −0,03 em.
- Todo texto é medido com as larguras reais da Sora (`src/larguras.ts`, `src/texto.ts`), quebrado em linhas equilibradas e reduzido até o mínimo; nunca vaza. O trecho em destaque não quebra no meio.

### Moldura da pessoa
- Sempre um retângulo com filete grafite fino (nada recortado do fundo, nada de cantos arredondados ou sombra).
- **Tela cheia** (`cheio`): rosto na linha vertical do centro; zoom alterna 1 ↔ 1,08 com troca seca nos cortes. Cartões de papel na altura do peito, abaixo do queixo, nunca abaixo da legenda.
- **Dividida**: faixa larga de 1008 × 640 px no alto; a prancha ocupa o resto. Nunca uma coluna estreita ao lado.
- **Prancha cheia** (`cheia`): janela de 336 × 424 px no canto de cima à direita; o título da folha fica ao lado dela e o corpo começa abaixo dela, então a janela nunca cobre texto.
- O rosto é seguido quadro a quadro (`rosto.rastro`) e o zoom de cada caixa sai da largura do rosto: gravação aberta ou de selfie ficam enquadradas sem ajuste. `caixas` no plano corrige casos raros.

### Cores, textura e som
- Papel `#F3F0E8` com grade milimetrada quase invisível (30 px fina, 150 px um pouco mais forte); grafite `#1F1F1D`; cinza `#8A867D` (secundário, rótulos); cinza claro `#C9C4B8` (réguas, eixos); lápis `#ADA89D` (o esboço); **terracota `#C4623A`** (o acento) e o véu terracota a 10% (só para preencher áreas, nunca texto).
- Traços: forte 5 px (paredes, contornos), médio 3,6 px, fino 2,4 px (chamadas, réguas); paredes da planta livre em poché de 14 px, internas de 8 px; circulação tracejada de 5,5 px.
- Sem degradê, sombra, brilho, textura de papel amassado, emoji ou sticker.
- Sons (`public/sfx/`, tonais, gerados com ffmpeg): `folha.wav` grave quando a prancha sobe; `traco-1..3.wav` notas de lápis quando um item, cômodo ou dado entra; `cota.wav` um "tique" tonal quando uma medida fecha ou o significado chega. Nunca dois sons a menos de 0,45 s; nada de ruído, risco de papel, clique agudo ou sino.

### Medidas fixas (em `src/tema.ts` e `src/layout.ts`)
- Margem da prancha 36 px; base da prancha 1414 px; legenda em 1440 px (etiqueta de papel, Sora 44); limite da interface do app 1560 px.
- Cartões do peito: começam na `zona` do plano (abaixo do queixo) e sobem no máximo até logo abaixo do queixo; a base fica em 1400 px (até 1500 px quando a pessoa está muito perto da câmera).

## O que pode mudar por vídeo

- Textos, tempos, blocos e layouts (é o trabalho do plano).
- `marca` (nome e área), `sfx: false`, `caixas` (ajuste fino do enquadramento).
- O recorte (9:16 para vertical, 3:4 para horizontal), escolhido pelo `cortar.mjs`.

## O que não mudar sem o usuário pedir

- Cores, fontes, espessuras de traço e tamanhos mínimos de texto (em `src/tema.ts`). Se o usuário pedir a cor da marca dele, troque **só** o acento (`acento` e `acentoVeu`); papel e grafite seguram o estilo. Um azul de planta (`#2F5D8A`) também funciona como acento.
- As posições dos layouts (em `src/layout.ts`), a altura da legenda e o jeito das trocas (`src/troca.ts`).
- A regra de um acento por vez e a do esboço a lápis.
- Não adicione emojis, stickers, barras de progresso, tremidas, flashes, transições entre cortes, sombras ou fotos de banco.

## Se precisar de algo que o modelo não tem

- **Um móvel novo** (desenho técnico): acrescente o desenho em `src/desenho/biblioteca.ts` (planta com a frente para baixo e/ou elevação com a base embaixo; só retângulos, linhas e círculos; `forte` para o contorno, `fino` para detalhes), o tamanho padrão nas duas tabelas e o nome em `TipoObjeto` (`src/plano.ts`).
- **Um ícone novo para `passos`**: acrescente o traço em `src/componentes/Icones.tsx` (caixa 100 × 100, só linhas) e o nome em `Icone`.
- **Um bloco novo**: siga a gramática acima — folha com `Folha` (cabeçalho + corpo, `src/componentes/Folha.tsx`), traços com `Traco`, texto falado com `Palavras` e `temposDoTexto` (`src/anim.tsx`), texto medido com `encaixar` (`src/texto.ts`), cores de `tema.ts`, o esboço a lápis antes da fala — registre o layout padrão em `LAYOUT_PADRAO` (`src/layout.ts`) e o desenho em `Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
