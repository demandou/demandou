# O estilo Rótulo

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma ficha técnica impressa de verdade (filetes, emblema, letras miúdas, números em círculo) e a sensação de estar lendo essa ficha com uma lupa ao lado de quem entende do assunto. Quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

O vídeo inteiro é a anatomia de um rótulo. O assunto não importa: o rótulo é a ficha técnica do que a pessoa explica (um vinho, um ativo, um hábito, uma lembrança). A pessoa abre em quadro cheio, com uma ficha de papel na altura do peito. Quando a explicação começa, o próprio vídeo encolhe e vira o **camafeu**, o emblema oval de um rótulo que ocupa a tela sobre o vidro escuro de uma garrafa, com quatro campos em volta, o nome grande e uma linha larga embaixo. A **câmera** passeia pelo rótulo, a **lupa** lê cada campo quando ele é dito e a **ficha**, agora impressa no pé do rótulo, explica com o desenho do bloco. Cada campo lido fica numerado, como numa prancha de anatomia. A pessoa volta ao quadro cheio nas perguntas, nos carimbos fortes e no fechamento, quando um lacre de cera carimba a ficha. Clássico e calmo, sem ser antigo.

## O sistema visual

### Dinâmica do motion
- **Lápis → tinta**: todo texto, traço, caixa e número aparece desde o começo em cinza de lápis (`#C9BFB1`, traço tracejado) e ganha tinta na palavra em que é dito, abrindo da esquerda para a direita. Terminada a entrada, a palavra fica desenhada uma vez só, sem máscara. Nada fica vazio, nada pula na tela.
- **Curvas**: entra decidido e assenta devagar (Bezier 0,16 · 1 · 0,3 · 1); trocas de layout, câmera e lupa com curva firme e simétrica (0,65 · 0 · 0,35 · 1). Sem quique, sem elástico, sem giro decorativo, sem flash.
- **Troca de estado**: o vídeo encolhe do quadro cheio até o camafeu (os cantos arredondam até a elipse) em 0,8 s, começando 0,16 s antes do corte; o rótulo aparece em volta. A ficha não se mexe: é o mesmo papel no peito e no pé do rótulo.
- **Câmera e lupa**: em cada campo lido, a câmera aproxima 6–12% e puxa o campo para perto do meio (o camafeu e os números vão junto); a lupa desliza até o campo e, se o caminho passaria pelo rosto, sai do papel e pousa no campo novo.
- **Dentro de cada bloco** algo muda a cada 1,5–2,5 s: um item ganha tinta, uma linha-guia se desenha, um número conta, um medidor enche, um ponteiro gira, um carimbo bate.
- **Fichas que se cruzam**: a ficha que sai vai para a esquerda enquanto a próxima chega pela direita, sempre com conteúdo.

### Organização e hierarquia
- **Rótulo** (em cima): o resumo do vídeo. Nome grande (Caslon Display 72 px), linha larga em caixa alta (36 px), quatro campos com rótulo em caixa alta pequena e o valor (64 px em Display quando é curto; o 3º em itálico vinho; o 4º em caixa alta).
- **Ficha** (embaixo, 936 px de largura): cabeçalho com o número do campo em círculo vinho, o título em caixa alta espaçada e, à direita, um losango por campo lido (cheio quando já lido); o corpo com uma ideia grande por vez e o resto menor.
- **Numeração**: o número do campo é o mesmo no aro da lupa, no cabeçalho da ficha, na linha-guia do `campo` e impresso ao lado do campo no rótulo.

### Tipografia
- Libre Caslon Display (nome do rótulo, números grandes, o "?" e as aspas) e Libre Caslon Text (todo o resto), as duas gratuitas no Google Fonts, num peso só (400), com itálico de verdade. A hierarquia vem do tamanho, da caixa alta e do itálico.
- O I maiúsculo tem serifa dos dois lados e o l só à esquerda: "Iogurte", "Il1", "IPTU" não se confundem. Algarismos sempre alinhados. Nada de fonte condensada, nada de espaçamento negativo.
- Tamanhos (quadro de 1080 de largura; julgue nos quadros reduzidos a 540 px): títulos da ficha 84–96 px (mínimo 52), corpo de lista e comparação 44–72 px, notas em itálico 44–56 px, números grandes 96–156 px, cabeçalho 34 px em caixa alta, rótulos de gráfico e pontas de medidor 30–34 px, legenda 52 px. Nada abaixo de 30 px (só as letras miúdas do pé, que ficam sob a interface do app).
- Os textos medem a si mesmos e encolhem até o mínimo, quebrando em linhas equilibradas, sem linha terminando em "de", "para", "o".

### Moldura da pessoa
- **Quadro cheio**: rosto na linha vertical do centro, a ficha começa logo abaixo do queixo (entre 1076 e 1100 px) e vai até 1556 px.
- **Camafeu**: oval de 400×500 px centrado em (540, 410), com moldura dupla (tinta 4 px e vinho 2,2 px) e quatro losangos; o rosto inteiro, com testa e queixo, a 62% da altura da oval. O tamanho do rosto é calculado pelo rastro; `camafeu.zoom` e `camafeu.ancoraY` ajustam.
- A pessoa nunca é recortada do fundo nem coberta: a lupa e a ficha passam longe do camafeu. Nunca uma coluna vertical estreita.
- O camafeu segue o rosto quando a pessoa se mexe.

### Cores, textura e som
- **papel** `#F4EEE3` (rótulo e ficha); `#E9E0D0` na faixa do cabeçalho e no trilho do medidor.
- **tinta** `#211B18` (todo texto e traço); `#62574F` nos rótulos em caixa alta e nos detalhes.
- **vinho** `#701C2E`: o único destaque (grifos, números dos campos, linha-guia da vez, medidor, ponteiro, carimbo de alerta, lacre, barra maior do gráfico). `#E7D3D0` (vinho claro) só no preenchimento do mapa e da área do gráfico.
- **lápis** `#C9BFB1`: o que ainda não foi dito.
- **vidro** `#0D1310`: a garrafa em volta do rótulo, com um reflexo vertical quase imperceptível nas bordas.
- Nada de gradiente decorativo, brilho atrás da pessoa, contorno em letra, emoji, dourado ou textura forte.
- **Som** raro e tonal (senos com envelope curto e passa-baixa, em `public/sfx/`): "vum" grave na troca de estado, nota curta que sobe de altura a cada campo lido, dois tons quando um número conta, um tom grave no carimbo e no lacre, nota grave no significado, no vencedor e no risco, deslizar tonal no gráfico, acorde quando o medidor enche. Nada de ruído, clique agudo, tilintar ou sino.

## Como cada bloco usa as peças da assinatura

| Peça | Onde aparece |
|---|---|
| lupa + câmera sobre o rótulo | todo momento no rótulo (o campo do `alvo`); `passos`, `topicos` e `comparacao` fazem a lupa andar pela linha larga |
| linha-guia pontilhada | `topicos` (até a margem), `definicao` (do termo ao significado), `campo` (do valor ao número), lupa → ficha nas linhas largas |
| losango vinho | marcador de `topicos`, centro do filete da `comparacao`, índice do cabeçalho, ornamentos do rótulo |
| número em círculo | `passos`, cabeçalho, aro da lupa, marcas do rótulo |
| régua | `numero` (enche com a contagem), `ano` (marcador anda até o ano) |
| medidor (barra + mostrador) | `medidor` e `teor` |
| carimbo de borda dupla | `destaque` |
| mostrador de marcas | `selo` da `abertura`, selo do "?" da `pergunta` |
| lacre de cera | `cta` (num vídeo de bebida, as taças brindam) |

## O que pode mudar por vídeo

- O rótulo inteiro (`nome`, `linha`, `campos`, `pe`, `volume`): é a ficha técnica do assunto do vídeo.
- Textos, tempos, o bloco de cada trecho, o campo que a lupa lê (`alvo`), onde fica a pessoa (`pessoa`), as pontas e o nível do medidor, a forma do gráfico, o ícone do fechamento.
- `marca` (nome e área), o enquadramento no camafeu (`camafeu.zoom`, `camafeu.ancoraY`), `sfx: false`.

## O que não mudar sem o usuário pedir

- A mecânica (`src/layout.ts`): o tamanho e o lugar do camafeu, dos campos e das linhas do rótulo, a câmera, a lupa, a ficha, as curvas e durações das trocas, o início da troca antes do corte.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `vinho` (e o `vinhoClaro`, uma versão bem clara dele) em `src/tema.ts`, por uma cor escura e média que funcione como texto e preenchimento sobre o papel; papel, tinta e vidro seguram a elegância.
- A fonte e os tamanhos; nada de texto que precise ser lido abaixo de 1560 px.
- Não adicione emojis, stickers, fotos de banco, brilho atrás da pessoa, contorno nas letras, gradientes, tremidas, flashes, dourado ou "foil". Não troque os desenhos a traço por ilustrações coloridas.

## Se precisar de algo que o modelo não tem

- **Um país novo no mapa da `origem`**: os contornos ficam em `src/mapas.ts` (Natural Earth 1:50m, domínio público, simplificados numa caixa de 100×100 com o norte para cima). Acrescente uma entrada no mesmo formato, com no máximo ~200 pontos, e confira o ponto de uma cidade conhecida.
- **Um desenho novo de `variedade`**: acrescente o nome no tipo `Desenho` (`src/plano.ts`) e um componente em `src/componentes/Desenhos.tsx` no mesmo padrão (viewBox 320×300, traço de tinta de 3,5–5 px com pontas redondas, partes que se desenham em sequência com `Traco`).
- **Um tipo de momento novo**: um componente em `src/componentes/Blocos.tsx` que desenha numa caixa w×h a partir do `CABECALHO`, usando `Cabecalho`, `Linhas` (texto que ganha tinta na fala), `prog` e as cores de `src/tema.ts`; acrescente o tipo em `src/plano.ts` e o caso em `src/componentes/Ficha.tsx`. A lupa e a câmera já funcionam para qualquer momento no rótulo (pelo `alvo`). Consulte a skill do Remotion para as regras de animação.
