# O estilo Espelho

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é o luxo discreto de uma revista de alto padrão: pouca coisa, bem desenhada, se movendo com calma e com significado. Quase toda "melhoria" que acrescenta enfeite piora o resultado. O estilo vale para qualquer assunto: o que muda de um vídeo para outro é o conteúdo dos blocos, nunca a linguagem.

## A ideia

Um espelho. No quadro deitado (16:9, 1920×1080, o vídeo completo do YouTube), a pessoa fala em tela cheia e, quando a fala pede apoio, um fio dourado fino divide a tela **de pé**, como a linha de um reflexo, e anda para um lado ou para o outro conforme a fala (a regra da aula 9 do curso: a pessoa numa moldura à direita, a explicação à esquerda). À direita fica a pessoa, numa moldura de alto a baixo, com o rosto centralizado e acompanhado; à esquerda fica o que ela está dizendo, como uma página de revista: a capa (abertura, frase, pergunta, destaque, definição, número) ou a matéria (lista, passos, comparação, gráfico, mapa). A assinatura é o **mapeamento**: uma figura simétrica desenhada a traço, de pé na base da página, com as partes que importam numeradas, acendendo uma a uma.

## 1. Dinâmica do motion

- **O fio revela.** Toda palavra entra atrás de um filete dourado que a atravessa da esquerda para a direita (`PalavraRevelada`, em `src/anim.tsx`), no instante em que é dita. Terminada a entrada, a palavra fica como texto simples (sem a máscara).
- **O reflexo desenha.** Figuras e fios se fazem do centro para fora, as duas metades juntas (`espelhar`, `FioDoCentro`). Os fios entre itens também se abrem do centro.
- **Cada coisa no seu tempo.** Itens, pontos, lados, opções e dados entram no `em` da palavra que os nomeia; números contam com um losango correndo numa régua; barras crescem; curvas se desenham com o véu pontilhado por baixo; o lado errado é riscado quando é dito.
- **Esboço antes do conteúdo.** O que vai receber algo já nasce apagado: losangos e círculos vazados, trilhos nude, fios tracejados, aspas, o "?". Nunca uma caixa vazia.
- **Trocas sem quadro vazio e sem dupla exposição.** A linha de pé desliza ~0,7 s para o lado (curva simétrica, a partir do corte) e a pessoa vai junto. Mesmo lugar: a página corre de lado (porta de correr; a velha sai pela esquerda, a nova sai de trás da moldura). Lugar diferente: um fio dourado atravessa o quadro da esquerda para a direita junto com a linha; atrás dele a página nova, na frente a velha. Para a tela cheia, a moldura avança para a esquerda e a pessoa cobre a página.
- **Desliza e assenta.** Nada quica, gira, pulsa ou treme. Nada parado mais de ~2,5 s.
- **Hierarquia no tempo.** O item da vez fica inteiro; os anteriores apagam para ~55%. Na comparação, o lado que está sendo falado fica inteiro e o outro apaga.

## 2. Organização e hierarquia

- **Uma ideia por vez** na página do quadro da esquerda: a mesma página do vertical, com 900 px de largura útil (de x 90 a 990 dela), posta no meio do quadro, entre a borda esquerda e a linha do espelho, e no meio da altura da tela (`paginaNoQuadro`, `src/layout.ts`). Nada importante abaixo de y 984 (controles do player).
- **Capa (texto centrado):** abertura/manchete, frase, pergunta, destaque, definição e número ficam centrados numa coluna de 840 px; a página só tem a altura que o texto pede, a linha fica mais à esquerda (x ~1040) e a moldura da pessoa larga (~880 px).
- **Matéria (painel):** lista, passos, comparação e gráfico ocupam a página toda, alinhados à esquerda (título no alto com filete dourado, itens descendo até a base da página); a página fica mais alta e a linha anda para a direita (x ~1080 a 1150).
- **Mapa:** a figura de um lado, de pé na base da página, um fio dourado de borda a borda do quadro da esquerda que se abre do centro (um fio tracejado desce do pé do desenho até o losango dessa base); do outro, uma coluna com rótulo e título no alto e nota e legenda numerada junto da base. Dois mapas seguidos trocam o desenho de lado.
- **Comparação como reflexo:** o primeiro lado em cima, à esquerda; o segundo embaixo, à direita; o fio do meio com o sinal (× ou ↓).
- Rótulos pequenos em caixa alta; títulos grandes; notas e significados em itálico; números enormes.

## 3. Tipografia

- **Bodoni Moda** (didone de revista), pelo Google Fonts: 500 em títulos, itens e números; itálico 400/500 em ênfases, notas, frases, significados e chamadas. Espaçamento entre letras de −0,012em a −0,02em, nunca mais apertado.
- **Jost** (sans geométrica): 500 em caixa alta com espaçamento 0,18–0,22em para rótulos, unidades, botões e a etiqueta ILUSTRATIVO; a legenda em 44 px.
- **Tamanhos (na página de 1080 de largura, os mesmos no quadro deitado):** abertura/manchete 72–104 px; destaque 72–132; termo da definição 72–112; número 120–210; títulos de painel 60–84; itens 44–80; textos da comparação 56–96; notas e rótulos em itálico 44–70; legenda do mapa 44–58; rótulos em caixa alta 30–36. Nada abaixo de 30 px.
- **O texto é medido de verdade** (`src/larguras.ts`, larguras da fonte tiradas do navegador do render; `src/medida.ts`): o corpo diminui até o mínimo e a linha quebra em 2 ou 3 linhas equilibradas; nunca vaza. As palavras ficam separadas por uma margem fixa (não pelo espaço), e a medida usa a mesma margem.

## 4. A moldura da pessoa

- **A base é a tela cheia:** a gravação 16:9 inteira, sem recorte vertical, com a legenda no terço de baixo.
- **Num bloco, a moldura da direita**, de alto a baixo, da linha do espelho até a borda do quadro (`caixaDaPessoa`, `src/layout.ts`), com 760 a 880 px de largura. O rosto fica centralizado na horizontal; a moldura acompanha o rosto quadro a quadro com ajuste suave (o rastro do motor), sem saltos nem cortes no rosto. No pulo de zoom dos cortes (1 ↔ 1,05, troca seca) o rosto fica parado.
- Pessoa longe da câmera (cabeça pequena): a moldura aproxima até 1,3×, com o rosto a ~40% da altura e a cabeça inteira.
- Nunca uma segunda cópia da pessoa, nunca recortada do fundo, nunca texto sobre o rosto.
- Entre momentos com respiro (> 0,3 s), a pessoa volta para a tela cheia, com a legenda.

## 5. Cores, textura e som

- **Champanhe** `#EFE6DA` (fundo), **café** `#2B1E17` (traços e textos), **dourado** `#A68A5B` (o fio, os losangos, os pontos, as faixas, os símbolos), **dourado escuro** `#86683D` (texto dourado sobre champanhe), **nude** `#E4D5C3` (trilhos vazios), **véu dourado** (pontilhado das áreas acesas) e **bordô** `#8C3B33` só para alerta, risco e o lado errado.
- Sem degradê colorido, sem sombra, sem brilho atrás da pessoa, sem texto com contorno, sem emoji. A única "textura" é o pontilhado dourado das áreas acesas.
- **Traços:** contorno 3,4 px, detalhe 2,6, fino 2; fios 2–2,5 px; mapeamento tracejado em dourado.
- **Som raro e tonal** (`public/sfx`): um tom grave na abertura e no fechamento; um deslizar grave quando a linha muda de lugar ou a página troca; uma nota curta (três alturas) quando um ponto, item, lado ou dado entra, quando um número termina de contar ou algo é riscado. Nunca dois sons a menos de 0,45 s; nada de ruído, clique agudo ou sino.

## 6. O mapa (a assinatura)

- Figuras em `src/figuras.ts` (e o rosto em `src/componentes/Rosto.tsx`), todas numa caixa de 400 × 540 com o eixo em x = 200. Só a metade esquerda é escrita; o reflexo é feito na hora.
- Cada figura tem 5 vagas (onde um ponto pode acender), a ordem de uso para 2 a 5 pontos, as alturas das linhas de mapeamento e da linha dourada tracejada, e o pé.
- Ponto aceso: véu dourado + pontilhado + contorno tracejado, revelados em círculo a partir do ponto; o círculo vazado da vaga se enche de ouro com o número. A legenda numera na mesma ordem.
- O rosto tem as áreas anatômicas e os efeitos `relaxar` (fibras do músculo que se esticam, rugas que alisam) e `volume` (curvas de nível que crescem).

## O que pode mudar por vídeo

- Textos, tempos, blocos, figura e lado do mapa (é o trabalho do plano).
- `marca` (nome e área).
- Nada de recorte: o quadro é sempre 16:9 (1920×1080) e a gravação deitada entra inteira.
- `sfx: false`, se o usuário não quiser sons.
- `caixas.pessoa` (`queixo`, `margem`, `zoom`), se a estimativa da cabeça errar ou a gravação for muito aberta.

## O que não mudar sem o usuário pedir

- Cores, fontes, espessuras e tamanhos (em `src/tema.ts` e nas geometrias). Se o usuário pedir a cor da marca dele, troque **só** o dourado (`ouro`, `ouroTexto`, `ouroVeu`) por um tom igualmente sóbrio (um rosé queimado `#A8726A` ou um verde-sálvia escuro `#6F7F6A`); champanhe e café seguram o estilo.
- A geometria dos layouts: o lugar da linha de pé (`xDaLinha`), a página no quadro (`paginaNoQuadro`), o zoom e o pulo da moldura (`src/layout.ts`); posições na página (`src/geometria.ts` e `src/blocos.ts`). Os textos e desenhos se ajustam sozinhos à base da página; não fixe posições em px nos componentes.
- As figuras e as áreas do rosto.
- A regra de uma cor de acento: se tudo fica dourado, nada é assunto; o bordô é só para o alerta.
- Não adicione emojis, stickers, fotos de banco, barras de progresso, tremidas, flashes, transições entre cortes, brilho atrás da pessoa ou texto com contorno.

## Se precisar de algo que o modelo não tem

- **Uma figura nova para o mapa:** acrescente em `src/figuras.ts` (metade esquerda dos traços, com peso, ordem e duração; 5 vagas de cima para baixo; `escolha` para 2 a 5 pontos; `guias`, `guiaOuro` e `pe`), o nome no tipo `Figura` (`src/plano.ts`) e na tabela do SKILL.md. Desenhe simétrico, com 15 a 30 traços, como uma gravura de atlas.
- **Uma área nova do rosto:** acrescente em `AREAS` (`src/componentes/Rosto.tsx`) a forma, o `ponto` e a `marca`; o nome em `NOMES_DAS_AREAS` (`src/geometria.ts`) e a chave no tipo `Area`.
- **Um bloco novo:** siga a gramática acima (a pessoa na moldura da direita; a base da página em `linhaDe`, `src/layout.ts`; o conteúdo só na página do quadro da esquerda; a geometria numa função pura com o texto medido por `src/medida.ts`; texto falado com `TextoEmLinhas`/`PalavraRevelada` e `temposDoTexto`; traços com `Traco`; cores de `tema.ts`) e consulte a skill do Remotion para as regras de animação.
