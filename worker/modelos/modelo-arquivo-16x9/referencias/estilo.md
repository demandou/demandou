# O estilo Arquivo

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um documentário de verdade (sóbrio, jornalístico, com textura de papel e de filme) e estar em movimento o tempo todo, porque cada coisa dita é registrada na hora. Ele serve para qualquer assunto: o que muda é o conteúdo dos documentos, nunca a linguagem.

Esta é a versão deitada (16:9, 1920×1080), para o vídeo completo do YouTube. O estilo é o mesmo do vertical (fontes, cores, papéis, datilografia, sons, a foto que muda de lugar); muda só a diagramação, pela regra da aula 9 do curso: a tela cheia é a base e, quando a fala vira registro, a foto da pessoa fica numa moldura do lado direito e o documento no quadro do lado esquerdo.

## A ideia

Um documentarista montando um dossiê enquanto a pessoa fala. O presente é a gravação em cores, em tela cheia, com supers no terço de baixo, abaixo do queixo. Quando a fala vira registro, a imagem "envelhece" (o preto e branco desce como a luz de um scanner) e vira uma foto impressa, presa com fita numa folha de arquivo, na moldura do lado direito; um documento desliza pela mesa no quadro do lado esquerdo. A cada documento a foto muda de lugar na coluna da direita. Quando a fala volta para quem assiste, a foto cresce de volta para a tela cheia por cima dos papéis e a cor volta.

## 1. Dinâmica do motion

- **Máquina de escrever:** todo texto de registro é datilografado letra por letra, com cursor vermelho, a partir do instante em que é dito, com uma leve irregularidade de tinta; terminada a datilografia, o texto fica numa camada só, limpa. Títulos e frases faladas batem palavra por palavra.
- **Papel na mesa:** documentos entram deslizando da direita, decididos, e assentam (curva que freia no fim, sem quique nem elástico). O que sai é empurrado para a esquerda, opaco; o que entra passa por cima (uma cortina de papel), nunca dois textos transparentes sobrepostos.
- **A foto:** troca de lugar em 0,65 s, começando em cima do corte mais próximo; enquanto anda, passa por cima dos papéis (nenhum papel cobre o rosto). Indo para a tela cheia, cresce por cima do documento, que fica parado embaixo até ser coberto.
- **Gestos do arquivo:** o carimbo desce acelerando e bate seco (a tinta falhada); o fio vermelho se estica de uma tachinha à outra; a régua corre sob o ponteiro fixo; a tarja vermelha da margem anda até o item da vez; traços e gráficos se desenham a tinta; a rasura corre pela palavra riscada.
- **Espera a lápis:** antes de ser dito, cada lugar já está impresso (linha tracejada, número cinza, contorno da ficha, gráfico tracejado). Nada de caixa vazia por mais de ~0,3 s.
- **Ritmo:** algo muda a cada 1–2,5 s (item, campo, carimbo, número, troca de lugar).

## 2. Organização e hierarquia

- Um documento por vez, com um título (caixa alta, Archivo 800, grande) e um corpo.
- A foto fica sempre na coluna da direita e o documento no quadro da esquerda. No layout `canto` a foto é pequena: o título fica ao lado dela e o corpo ocupa a largura toda embaixo, em fileiras e colunas (a lista em duas colunas, os passos numa fileira com o fio em arco por cima); em `base`, `topo` e `direita`, título em cima e corpo embaixo, no quadro da esquerda.
- Em tela cheia, os supers ficam no terço de baixo, abaixo do queixo, alinhados à esquerda (até ~2/3 da largura); a régua do número e da linha do tempo atravessa o quadro, com o ponteiro no meio; as opções da pergunta entram lado a lado. O quadro deitado é baixo: nada de pilha alta.
- O que é dito é grande; o que é formulário (rótulos, números de item, cabeçalho) é pequeno, em máquina de escrever.
- O cabeçalho da folha ("ARQUIVO · ASSUNTO" e "FL. 02/05") fica fixo no alto; o número da folha rola a cada documento.
- Documentos têm o tamanho do conteúdo e ficam no meio do espaço livre: nunca um terço da folha vazio.

## 3. Tipografia

- **Archivo** (Google Fonts, largura normal, nunca condensada): títulos, nomes, números grandes, supers e legenda. 800 nos títulos e itens fortes, 700 nos itens de lista e nas opções.
- **Courier Prime** (máquina de escrever): campos, rótulos, datas, significados, cabeçalhos.
- Medidas no quadro de 1920×1080: as mesmas do vertical. Títulos de 72 a 104 px; itens de 44 a 86 px; rótulos em caixa alta espaçada de 28 a 40 px; nada abaixo de 28 px; legenda de 44 px. O número da régua vai até 136 px (a faixa abaixo do queixo é baixa).
- O texto é medido com as larguras reais das fontes (`src/medida.ts`, `src/larguras.ts`): diminui até o mínimo legível e quebra em até 2–4 linhas; nunca vaza nem é cortado.

## 4. Moldura da pessoa

- **Tela cheia** (presente, em cores): a gravação inteira, como foi feita; supers no terço de baixo, abaixo do queixo, sobre um véu escuro suave que começa logo acima deles (para ler sobre qualquer roupa). É escurecimento, não brilho nem moldura.
- **Foto de arquivo** (folha): preto e branco levemente quente, contraste, grão que ferve e vinheta; borda branca, fita adesiva, sombra de papel e inclinação de até 2°. Sempre na moldura do lado direito (aula 9), com o rosto no centro dela; quatro lugares na coluna da direita: `direita` (alta, no meio), `topo` (larga, no alto), `base` (larga, embaixo) e `canto` (pequena, no canto de cima). O zoom sai da largura do rosto medida: cabeça inteira, com folga, qualquer que seja a distância da câmera.
- Nunca do lado esquerdo: o lado esquerdo é do documento (`esquerda` vale como `direita`).
- Nunca recorte a pessoa do fundo: a foto é o próprio vídeo reenquadrado, funciona com qualquer gravação. O rosto é seguido quadro a quadro.

## 5. Cores, textura e som

- Papel `#ECE8DF` (a folha; `#F7F5EF` nas fichas), tinta `#151515`, vermelho de carimbo `#C92A1F`, o único acento (carimbos, cursor, fio, tachinhas, tarjas, margens, ponteiro, hachura dos gráficos). Pedra, tijolo e concreto só dentro da amostra das `camadas`.
- Textura, não efeito: fibra de papel e luz de mesa na folha; grão só na foto de arquivo; sombra de papel. Nada de brilho atrás da pessoa, contorno em letras, emoji ou degradê colorido.
- Som raro e tonal (`public/sfx/`): um tom grave quando a imagem vira arquivo, um deslizar grave quando a folha muda, um baque no carimbo, notas curtas quando um passo se liga, uma lista fecha, um significado se escreve ou o fechamento entra, uma subida quando a régua corre. Nada de "tec-tec" de máquina de escrever, ruído branco, clique agudo ou sino.

## O que pode mudar por vídeo

- Textos, tempos, a escolha dos blocos e o `layout` de cada documento (é o trabalho do plano).
- `marca`, `assunto`, `passado`, `caixas`.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores e fontes. Se o usuário pedir a cor da marca dele, troque **só** o `vermelho` em `src/tema.ts` por um tom escuro e saturado da marca (precisa ler bem sobre o papel e ter cara de carimbo); papel e tinta seguram a identidade.
- O preto e branco da foto de arquivo e a regra de um documento por vez, com a foto mudando de lugar.
- Não adicione fotos de banco, mapas de satélite, emojis, transições de flash ou tremidas. Não invente dados para preencher fichas: campo sem fato dito fica de fora.

## Se precisar de algo que o modelo não tem

Um documento novo segue a gramática: um papel (`Cartao` ou `cor.cartao` + `sombraPapel`) dentro de `Deslizar` (`src/componentes/Papel.tsx`), na região do layout (`regiaoDoLayout` e `partesDaRegiao` em `src/layout.ts`), com rótulos pré-impressos em Courier, valores com `Datilo` no `em` de cada palavra, textos medidos com `encaixar`/`encaixarBloco` (`src/medida.ts`) e carimbo com `Carimbo`. Registre o tipo em `src/plano.ts`, os layouts aceitos em `ACEITOS` (`src/layout.ts`) e o desenho e o som em `src/Edicao.tsx`; consulte a skill do Remotion para as regras de animação.
