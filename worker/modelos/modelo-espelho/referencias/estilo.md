# O estilo Espelho

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o luxo discreto de uma revista de alto padrão: pouca coisa, bem desenhada, se movendo com calma e com significado. Quase toda "melhoria" que acrescenta enfeite piora o resultado. O estilo vale para qualquer assunto: o que muda de um vídeo para outro é o conteúdo dos blocos, nunca a linguagem.

## A ideia

Um espelho. Um fio dourado fino divide a tela **na horizontal**, como a linha de um reflexo, e sobe ou desce conforme a fala. Embaixo fica sempre a pessoa, numa moldura larga ancorada na base do quadro; em cima fica o que ela está dizendo, como uma página de revista: a capa (abertura, frase, pergunta, destaque, definição, número) ou a matéria (lista, passos, comparação, gráfico, mapa). A assinatura é o **mapeamento**: uma figura simétrica desenhada a traço, de pé na linha do espelho, com as partes que importam numeradas, acendendo uma a uma.

## 1. Dinâmica do motion

- **O fio revela.** Toda palavra entra atrás de um filete dourado que a atravessa da esquerda para a direita (`PalavraRevelada`, em `src/anim.tsx`), no instante em que é dita. Terminada a entrada, a palavra fica como texto simples (sem a máscara).
- **O reflexo desenha.** Figuras e fios se fazem do centro para fora, as duas metades juntas (`espelhar`, `FioDoCentro`). Os fios entre itens também se abrem do centro.
- **Cada coisa no seu tempo.** Itens, pontos, lados, opções e dados entram no `em` da palavra que os nomeia; números contam com um losango correndo numa régua; barras crescem; curvas se desenham com o véu pontilhado por baixo; o lado errado é riscado quando é dito.
- **Esboço antes do conteúdo.** O que vai receber algo já nasce apagado: losangos e círculos vazados, trilhos nude, fios tracejados, aspas, o "?". Nunca uma caixa vazia.
- **Trocas sem quadro vazio e sem dupla exposição.** A linha desliza ~0,7 s (curva simétrica, a partir do corte) e a pessoa vai junto. Mesma altura: a faixa de cima corre de lado (porta de correr). Altura diferente: um fio dourado vertical atravessa a faixa junto com a linha; atrás dele a página nova, na frente a velha. Para a tela cheia, a pessoa sobe e cobre a página.
- **Desliza e assenta.** Nada quica, gira, pulsa ou treme. Nada parado mais de ~2,5 s.
- **Hierarquia no tempo.** O item da vez fica inteiro; os anteriores apagam para ~55%. Na comparação, o lado que está sendo falado fica inteiro e o outro apaga.

## 2. Organização e hierarquia

- **Uma ideia por vez** na faixa de cima, entre y 168 (abaixo da interface do app) e a linha menos 40 px; de x 60 a x 960 (os botões do app ocupam os 120 px da direita).
- **Capa (texto centrado):** abertura/manchete, frase, pergunta, destaque, definição e número ficam centrados numa coluna de 840 px; a linha desce só o necessário (430 a ~700 px) e a pessoa fica grande.
- **Matéria (painel):** lista, passos, comparação e gráfico ocupam a faixa toda, alinhados à esquerda (título no alto com filete dourado, itens descendo até a linha); a linha fica entre 640 e 880 px.
- **Mapa:** a figura de um lado, de pé na linha (um fio tracejado desce do pé do desenho até o losango da linha); do outro, uma coluna com rótulo e título no alto e nota e legenda numerada junto da linha. Dois mapas seguidos trocam o desenho de lado.
- **Comparação como reflexo:** o primeiro lado em cima, à esquerda; o segundo embaixo, à direita; o fio do meio com o sinal (× ou ↓).
- Rótulos pequenos em caixa alta; títulos grandes; notas e significados em itálico; números enormes.

## 3. Tipografia

- **Bodoni Moda** (didone de revista), pelo Google Fonts: 500 em títulos, itens e números; itálico 400/500 em ênfases, notas, frases, significados e chamadas. Espaçamento entre letras de −0,012em a −0,02em, nunca mais apertado.
- **Jost** (sans geométrica): 500 em caixa alta com espaçamento 0,18–0,22em para rótulos, unidades, botões e a etiqueta ILUSTRATIVO; a legenda em 44 px.
- **Tamanhos (quadro de 1080):** abertura/manchete 72–104 px; destaque 72–132; termo da definição 72–112; número 120–210; títulos de painel 60–84; itens 44–80; textos da comparação 56–96; notas e rótulos em itálico 44–70; legenda do mapa 44–58; rótulos em caixa alta 30–36. Nada abaixo de 30 px.
- **O texto é medido de verdade** (`src/larguras.ts`, larguras da fonte tiradas do navegador do render; `src/medida.ts`): o corpo diminui até o mínimo e a linha quebra em 2 ou 3 linhas equilibradas; nunca vaza. As palavras ficam separadas por uma margem fixa (não pelo espaço), e a medida usa a mesma margem.

## 4. A moldura da pessoa

- Sempre **embaixo**, na largura toda, da linha até a base do quadro (`src/layout.ts`). O rosto fica no centro, o alto da cabeça ~80 px abaixo da linha e o **queixo nunca abaixo de y 1500**, mesmo no pulo de zoom dos cortes (1 ↔ 1,05, troca seca).
- A moldura segue o rosto quadro a quadro (o rastro do motor).
- **Gravação muito fechada (selfie):** a moldura estreita e vira uma janela larga e centrada, com um aro dourado fino nos lados e embaixo; a cabeça fica inteira. Quando o cabelo encosta no alto da gravação, a margem acima dele some (não há fundo para mostrar).
- Nunca a pessoa numa coluna estreita ao lado, nunca uma segunda cópia dela, nunca recortada do fundo.
- Entre momentos com respiro (> 0,3 s), a pessoa volta para a tela cheia, com a legenda.

## 5. Cores, textura e som

- **Champanhe** `#EFE6DA` (fundo), **café** `#2B1E17` (traços e textos), **dourado** `#A68A5B` (o fio, os losangos, os pontos, as faixas, os símbolos), **dourado escuro** `#86683D` (texto dourado sobre champanhe), **nude** `#E4D5C3` (trilhos vazios), **véu dourado** (pontilhado das áreas acesas) e **bordô** `#8C3B33` só para alerta, risco e o lado errado.
- Sem degradê colorido, sem sombra, sem brilho atrás da pessoa, sem texto com contorno, sem emoji. A única "textura" é o pontilhado dourado das áreas acesas.
- **Traços:** contorno 3,4 px, detalhe 2,6, fino 2; fios 2–2,5 px; mapeamento tracejado em dourado.
- **Som raro e tonal** (`public/sfx`): um tom grave na abertura e no fechamento; um deslizar grave quando a linha muda de altura ou a faixa troca; uma nota curta (três alturas) quando um ponto, item, lado ou dado entra, quando um número termina de contar ou algo é riscado. Nunca dois sons a menos de 0,45 s; nada de ruído, clique agudo ou sino.

## 6. O mapa (a assinatura)

- Figuras em `src/figuras.ts` (e o rosto em `src/componentes/Rosto.tsx`), todas numa caixa de 400 × 540 com o eixo em x = 200. Só a metade esquerda é escrita; o reflexo é feito na hora.
- Cada figura tem 5 vagas (onde um ponto pode acender), a ordem de uso para 2 a 5 pontos, as alturas das linhas de mapeamento e da linha dourada tracejada, e o pé.
- Ponto aceso: véu dourado + pontilhado + contorno tracejado, revelados em círculo a partir do ponto; o círculo vazado da vaga se enche de ouro com o número. A legenda numera na mesma ordem.
- O rosto tem as áreas anatômicas e os efeitos `relaxar` (fibras do músculo que se esticam, rugas que alisam) e `volume` (curvas de nível que crescem).

## O que pode mudar por vídeo

- Textos, tempos, blocos, figura e lado do mapa (é o trabalho do plano).
- `marca` (nome e área).
- O recorte (9:16 ou 3:4), escolhido pelo `cortar.mjs`.
- `sfx: false`, se o usuário não quiser sons.
- `caixas.pessoa` (`queixo`, `margem`, `zoom`), se a estimativa da cabeça errar ou a gravação for muito aberta.

## O que não mudar sem o usuário pedir

- Cores, fontes, espessuras e tamanhos (em `src/tema.ts` e nas geometrias). Se o usuário pedir a cor da marca dele, troque **só** o dourado (`ouro`, `ouroTexto`, `ouroVeu`) por um tom igualmente sóbrio (um rosé queimado `#A8726A` ou um verde-sálvia escuro `#6F7F6A`); champanhe e café seguram o estilo.
- A geometria dos layouts: altura da linha, margem da cabeça, queixo máximo, pulo de zoom (`src/layout.ts`); posições na faixa de cima (`src/geometria.ts` e `src/blocos.ts`). Os textos e desenhos se ajustam sozinhos à linha; não fixe posições em px nos componentes.
- As figuras e as áreas do rosto.
- A regra de uma cor de acento: se tudo fica dourado, nada é assunto; o bordô é só para o alerta.
- Não adicione emojis, stickers, fotos de banco, barras de progresso, tremidas, flashes, transições entre cortes, brilho atrás da pessoa ou texto com contorno.

## Se precisar de algo que o modelo não tem

- **Uma figura nova para o mapa:** acrescente em `src/figuras.ts` (metade esquerda dos traços, com peso, ordem e duração; 5 vagas de cima para baixo; `escolha` para 2 a 5 pontos; `guias`, `guiaOuro` e `pe`), o nome no tipo `Figura` (`src/plano.ts`) e na tabela do SKILL.md. Desenhe simétrico, com 15 a 30 traços, como uma gravura de atlas.
- **Uma área nova do rosto:** acrescente em `AREAS` (`src/componentes/Rosto.tsx`) a forma, o `ponto` e a `marca`; o nome em `NOMES_DAS_AREAS` (`src/geometria.ts`) e a chave no tipo `Area`.
- **Um bloco novo:** siga a gramática acima (a pessoa embaixo; a altura da linha em `linhaDe`, `src/layout.ts`; o conteúdo só na faixa de cima; a geometria numa função pura com o texto medido por `src/medida.ts`; texto falado com `TextoEmLinhas`/`PalavraRevelada` e `temposDoTexto`; traços com `Traco`; cores de `tema.ts`) e consulte a skill do Remotion para as regras de animação.
