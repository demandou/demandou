# O estilo Impacto

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a energia **com ordem**: tudo é rápido e forte, mas nada treme, pisca ou quica. Quase toda "melhoria" que adiciona efeito piora o resultado. O estilo vale para qualquer assunto: o que muda de um vídeo para outro são as palavras, nunca o sistema abaixo.

## A ideia

Um criador direto, falando com energia. A edição se comporta como um cartaz esportivo que se monta no ritmo da fala: a pessoa abre espaço, a palavra bate, a pessoa pula para o outro lado, a próxima bate. Quando a fala vira método, lista ou dado, a tela inteira vira a ficha e a pessoa vira uma janela.

## 1. Dinâmica do motion

- **A batida.** Cada palavra grande aparece no instante em que é dita: entra 8% maior, a ~30 px do lugar, e assenta em ~6 quadros (`batida` em `src/anim.tsx`). Itens de lista sobem em vez de deslizar. Terminada a entrada, o texto fica simples, sem escala nem deslocamento por cima.
- **O pulo.** A caixa da pessoa anda em 0,3 s (`TRANSICAO` em `src/layout.ts`), com aceleração e freio, sem passar do ponto. Os blocos de lado alternam o lado da pessoa.
- **A cortina.** A borda da caixa (um filete verde-limão de 6 px) revela o texto que entra e cobre o que sai. Quando a caixa não atravessa a tela (de lado para tela cheia, tela cheia para tela cheia, mesmo lado), um filete igual varre a área do texto em 0,34 s: atrás dele, o momento novo; na frente, o que sai. Nunca duas páginas juntas, nunca quadro vazio.
- **Progressão dentro do bloco.** Algo muda a cada ~1 s: o número conta e trava (com um pulso de 7%), os marcadores enchem, a barra do item da vez desce até ele, o risco atravessa, o ✓ se desenha, o anel gira uma volta por item, a linha do gráfico avança com a caneta quadrada, o ícone se desenha e o avião parte, a pilha cresce 3% devagar enquanto está na tela.
- **Proibido:** digitação letra a letra, palavra voando pela tela, quique, elástico, tremida, flash, zoom pulsando, giro.

## 2. Organização e hierarquia

- **Uma ideia grande por vez.** O resto é menor: rótulo espaçado em cima (o assunto), as palavras enormes no meio, o detalhe embaixo, a assinatura na base.
- **Colunas justificadas.** Cada linha do cartaz ocupa a largura toda da coluna: palavras curtas ficam enormes, longas menores. A quebra é automática (a que deixa a menor linha o maior possível; nenhuma linha passa de 2,2× a menor; palavra pequena nunca sozinha).
- **Listas são fichas.** Na coluna (`topicos`): linhas finas marcam as vagas, cada item entra na sua palavra, o da vez aceso com a barra no acento, os anteriores esmaecem. Em tela cheia (`passos`, `circuito`): 01, 02, 03 em mono, o da vez aceso e numerado no acento, os que passaram apagados com ✓.
- **Números são cronômetros.** Mono, gigantes, contam de zero com zeros à esquerda e travam no acento na palavra dita. Moeda pequena em cima; "%" e "x" colados; "mil", "kg" e o assunto em palavras enormes embaixo.
- **A assinatura ancora a coluna.** Na base da coluna livre, sempre no mesmo lugar: filete curto no acento, nome em Sora ExtraBold e área em rótulo espaçado. Ela troca de lado junto com a pessoa e se redesenha a cada momento. É o único elemento fixo: não acrescente outros.

## 3. Tipografia

- **Sora** (Google Fonts): ExtraBold 800 nas palavras grandes, em caixa alta e um pouco mais juntas (−0,02 em); Bold 700 na legenda, nos detalhes e nas opções; SemiBold 600 nos rótulos, em caixa alta com espaçamento largo (0,16 em).
- **Azeret Mono** (Google Fonts): números, cronômetro, numeração das fichas, letras das opções. Dígitos de largura fixa, zero sem risco.
- **Tamanhos no quadro de 1080 px:** palavras grandes de 64 a 230 px (o cartaz escolhe); número até 360 px; textos de apoio ≥ 44 px; rótulos de 30 a 40 px; legenda de 44 a 64 px. Nada abaixo de 30 px.
- Todo texto é medido com as larguras reais da Sora (`src/tema.ts`) e reduzido até caber; nunca vaza nem é cortado. Nada de fonte condensada, contorno ou brilho.

## 4. Moldura da pessoa

- **Quadro cheio** entre os momentos: rosto no centro, zoom alternando 1 ↔ 1,08 a cada volta e em cada corte (disfarça o pulo). Legenda abaixo do queixo.
- **Coluna de um lado** nos blocos de texto: coluna inteira de 490 px (45% da largura), rosto centrado nela, zoom leve. Em gravação de selfie (rosto grande no quadro, medido pelo rastro do `cortar.mjs`), a coluna alarga até 580 px para o rosto caber inteiro, sem zoom extra.
- **Janela no canto de cima, à direita** (308 × 410 px) nos blocos em tela cheia. A aproximação se ajusta ao tamanho do rosto (1,8× numa gravação comum, menos numa selfie), sempre com a cabeça inteira.
- A caixa segue o rosto quando a pessoa se mexe. Nada recorta a pessoa do fundo; funciona com qualquer gravação.

## 5. Cores, textura e som

- **Três cores:** quase preto `#0B0B0B` (fundo), branco-gelo `#F3F2EC` (texto) e **um** acento elétrico, verde-limão `#C8FF2E`. O acento marca: o trecho em destaque, o número travado, o risco, o filete, os ícones, as tarjas de alerta, o selo, a barra do item da vez, o item numerado ativo. Texto sobre o acento é sempre o quase preto. Apagado (34% do branco) para o que passou; trilho (14%) para vagas e eixos.
- **Textura:** nenhuma. Chapado, como um cartaz impresso. Sem degradê, sem sombra (só uma sombra curta na legenda sobre o vídeo), sem segunda cor de acento.
- **Sons** (`public/sfx/`, tonais, gerados com seno e envelope curto): pancada grave (seno de 120 para 52 Hz) no número que trava, no risco, no alerta, no selo e no destaque da abertura; subida curta quando uma tela cheia abre e quando a chamada começa; bipe baixo, cada vez um tom acima, em cada item de lista, opção ou dado. Nada de ruído, estalo, "whoosh" ou sino.

## 6. Medidas (`src/tema.ts` e `src/layout.ts`)

| Medida | Valor |
|---|---|
| Quadro | 1080 × 1920 |
| Limite da interface do app | y = 1600 |
| Base da assinatura | y = 1548 |
| Coluna da pessoa (`LADO_W`) | 490 px (até 580 px em selfie) |
| Margem externa / respiro até a pessoa | 48 px / 36 px |
| Coluna do texto | ~506 px (~416 px em selfie) |
| Faixa vertical dos blocos de lado | y 230 a 1348 (com assinatura) |
| Janela | x 712, y 214, 308 × 410 px |
| Troca da caixa / cortina | 0,3 s / 0,34 s |
| Colados (sem voltar ao quadro cheio) | menos de 0,35 s entre os momentos |

## O que pode mudar por vídeo

- Textos, tempos e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área).
- O lado da pessoa num momento (`lado`), quando a alternância automática deixar a pessoa sempre do mesmo lado nos momentos mais importantes.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores, fontes e tamanhos. Se o usuário pedir a cor da marca dele, troque **só** `cor.volt` em `src/tema.ts` por uma cor clara e saturada (laranja vivo, ciano, amarelo): o texto em cima do acento é quase preto, então cor escura não serve. Fundo e branco-gelo seguram o estilo.
- A largura da caixa da pessoa, as margens, a base da assinatura e a janela (`src/tema.ts`): foram medidas para o texto caber grande, o rosto não ser cortado e nada encostar nos botões do app.
- A velocidade das trocas (`TRANSICAO`) e da batida das palavras (`batida`).
- Não adicione emojis, stickers, tremidas, flashes, zoom pulsando, brilho atrás da pessoa, barra de progresso ou transições entre cortes. Energia aqui vem do ritmo e do pulo de lado, não de efeito.

## Se precisar de algo que o modelo não tem

- **Um ícone novo:** adicione o traço em `src/componentes/Icones.tsx` (viewBox 48×48, só linhas) e o nome no tipo `icone` do `Cta` em `src/plano.ts`.
- **Um bloco novo:** siga a gramática acima. Decida se ele é de lado (use `NaColuna` de `src/componentes/Coluna.tsx` e o `Cartaz` de `src/componentes/Cartaz.tsx`, que já medem, quebram e casam as palavras com a fala) ou em tela cheia (registre o tipo em `TELA_CHEIA`, em `src/plano.ts`, e use `ctx.geo.janela` para desviar da janela). Cada peça entra com `batida` no tempo da palavra (`alinhar` em `src/texto.ts`), sai com `saindo(t, ctx.saida)` e usa só as cores de `tema.ts`. Consulte a skill do Remotion para as regras de animação.
