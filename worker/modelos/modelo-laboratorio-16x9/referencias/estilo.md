# O estilo Laboratório

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer o caderno de quem fez o experimento: o raciocínio aparece no papel no ritmo da fala, primeiro a lápis, depois a tinta. Vale para qualquer assunto: cripto, moda, saúde ou ciência viram figuras e notas do mesmo caderno. Quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

Um caderno de laboratório. A tela vira uma folha de papel milimetrado; a pessoa sai da tela cheia e vira uma foto redonda colada com dois pedaços de fita (a "janela de observação"). Cada ideia da fala é uma folha numerada (Fig. 1, Nota 2…), diagramada em volta do lugar da foto: a folha nova sobe de baixo por cima da anterior, já esboçada a lápis e com a foto colada num lugar novo; quando ela assenta, um círculo a tinta é riscado em volta da foto, e cada parte é passada a tinta, ou pintada a lápis de cor, no instante em que é dita.

## Os cinco pontos do estilo

### 1. Dinâmica do motion

- **Esboço a lápis → tinta na palavra.** Tudo que vai aparecer numa folha já está lá em cinza claro (texto) ou tracejado (desenho) quando a folha chega, e ganha tinta e cor no instante em que é dito. Nunca uma área vazia esperando.
- A caneta corre decidida: cada palavra em 0,2–0,75 s, da esquerda para a direita; traços se desenham do começo ao fim. Terminada a escrita, o texto fica simples, sem a camada de lápis nem a máscara.
- As folhas e a pessoa andam com curva de ida e volta, sem quique (~0,7 s na troca de folha, ~0,6 s saindo da tela cheia).
- O desenho nunca congela: ondas continuam andando, a luz corre dentro do feixe, pontinhos espalhados seguem se afastando; números contam como leitura de instrumento (~1,1 s); o item da vez muda de tom.
- **Movimento com significado:** o feixe se abre porque o todo tem partes; a proveta enche até o valor dito; o traço do procedimento desce até o passo dito; as linhas de visada saem da pessoa porque é ela quem olha; o risco atravessa o que é negado. Se um movimento não explica nada, ele não entra.

### 2. Organização e hierarquia

- Cada folha tem três camadas: a **linha impressa** no alto ("FIG. 2 · BITCOIN", "NOTA 1 · DEFINIÇÃO", com uma régua embaixo), o **título à mão** grande ao lado da foto, e o **corpo** na largura toda (desenho, lista, amostras, gráfico).
- Uma coisa grande por vez: o item da vez fica em tinta cheia (e a seta dele azul); os anteriores descansam um tom abaixo. Detalhes e escalas menores.
- Desenhos são numerados "Fig. N"; blocos de texto, "Nota N" (o modelo numera sozinho quando o plano não dá `rotulo`).

### 3. Tipografia

Três vozes, todas gratuitas do Google Fonts, nenhuma condensada:
- **Edu SA Hand** (letra escolar legível, "I" maiúsculo com serifa): tudo que é escrito à mão. Títulos de 64 a 150 px, itens de 52 a 104 px, anotações e rótulos ≥ 40 px.
- **Space Mono** (I com serifa, l e 1 diferentes): o que vem impresso no caderno (linhas das folhas, escalas, a leitura do número, horas, o carimbo "ilustrativo", a assinatura). ≥ 30 px.
- **Lexend**: a legenda, 54 px (mínimo 46).

Todo texto é medido de verdade (canvas, com a fonte carregada) e quebrado em até 2 ou 3 linhas no maior corpo que cabe; se nem assim couber, diminui só o necessário. Nunca vaza nem corta.

### 4. Moldura da pessoa

- Tela cheia só no começo (o gancho) e em respiros de mais de 0,3 s entre folhas.
- Nas folhas, a pessoa é uma **foto redonda** com borda de papel, sombra curta e dois pedaços de fita; o círculo a tinta é riscado em volta quando a folha assenta.
- Quatro lugares: `topo` (foto grande, centralizada, texto embaixo), `direita` e `esquerda` (foto de 430 px no canto de cima, cabeçalho ao lado, corpo embaixo) e `baixo` (só o `observador`: a pessoa no horizonte, o céu em cima). Folhas seguidas trocam de lugar sozinhas.
- **A foto é parte da folha:** o lugar dela é reservado e o conteúdo é diagramado em volta, então ela nunca passa por cima de texto. Na troca, a folha nova (com a foto nova) sobe por cima da anterior, e a anterior sobe só o bastante para a foto dela sair pelo alto: sem papel vazio, sem rosto coberto, sem duas páginas de texto sobrepostas.
- A foto segue o rosto (rastreio do motor) e ajusta o zoom ao tamanho do rosto da gravação, para mostrar a cabeça inteira em selfie ou em plano aberto. Nada de recortar a pessoa do fundo.

### 5. Cores, textura e som

- Papel `#F2F2EA` com grade verde-sálvia (quadradinho de 36 px, linha forte a cada 5), tinta azul-preta `#1D2935`.
- **Azul** `#2361CF`: o que é chave, o certo, o resultado, o destaque. **Vermelhão** `#DD5228`: alerta, risco, erro, o que é riscado. Âmbar `#EFA634` só na fonte de luz. Lápis cinza `#A7AEA9` só no esboço.
- As cores do espectro só no feixe que se abre e nas fatias da pizza (tons de lápis de cor escuros o bastante para escrever o nome na cor); os dois céus (dia e fim de tarde) só no `observador` e no `trajeto`.
- Traço de mão: tremor leve e fixo (não "ferve"), hachura clara de lápis de cor por cima das áreas pintadas. Traços de 4–6 px; ondas, feixes e curvas de 8–12 px.
- Sem brilho, sem contorno de texto, sem degradê fora dos céus, sem emoji.
- **Som raro e tonal**: um tom grave e macio a cada folha nova (três alturas que se revezam); duas notas suaves subindo quando o feixe se abre ou a leitura do número termina; um acorde quando o céu se pinta ou a amostra vencedora é marcada; um acorde grave no alerta e no pôr do sol; um acorde no fechamento. Nada de ruído de papel, clique agudo ou sino. Sons em `public/sfx/`, gerados com ffmpeg (seno, envelope curto, passa-baixa).

## Medidas (quadro 1080 × 1920)

- Margem lateral 64 px; o corpo das folhas vai até y 1440; a legenda assenta a base em y 1552 (a interface do app começa em ~1560).
- Foto: `topo` Ø 640 com centro em (540, 490); cantos Ø 430 com centro em (800, 410) ou (280, 410); `baixo` Ø 420 com centro em (540, 1150).
- Cabeçalho ao lado da foto do canto: ~480 × 410 px; corpo: ~950 × 765 px; com a foto no topo, o corpo é ~950 × 590 px.

## O que pode mudar por vídeo

- Textos, tempos, a escolha dos blocos e dos lugares (é o trabalho do plano).
- `marca` (nome e área), `rotulo` das folhas.
- `sfx: false`, se o usuário não quiser sons.
- `caixas`, se o rosto ficar grande ou pequeno demais na foto redonda.

## O que não mudar sem o usuário pedir

- Cores, fontes, tamanhos, a grade do papel e o tremor de mão (em `src/tema.ts`, `src/tinta/` e `src/componentes/Papel.tsx`). Se o usuário pedir a cor da marca dele, troque **só** o `azul` (e o `azulClaro`) por um tom de caneta firme da marca; papel, tinta e vermelhão seguram o estilo.
- As posições e tamanhos da foto e da legenda (em `src/layout.ts` e `src/tema.ts`). Se mudar o lugar da foto, mude junto as áreas do cabeçalho e do corpo (`areasDoLayout`): o conteúdo nunca pode encostar na foto.
- A voz: as fotos são todas mudas e a voz vem do som do próprio vídeo (`Voz`, em `src/componentes/Janela.tsx`), montado do começo ao fim. Não tire esse som nem desmude uma foto (a voz sairia dobrada na troca de folha).
- A regra do esboço a lápis: tirar o esboço deixa áreas vazias esperando a fala.
- Não adicione emojis, figurinhas, brilho atrás da pessoa, sombras longas, barras de progresso, tremidas, flashes, transições entre cortes, fotos de banco ou ícones prontos de biblioteca. Eles pertencem a outros modelos.

## Onde fica cada bloco no código

- `src/figuras/Titulo.tsx` (`abertura`/`titulo`), `Lista.tsx` (`topicos`), `Procedimento.tsx` (`passos`), `Medida.tsx` (`numero`), `Amostras.tsx` (`comparacao`), `Grafico.tsx` (`grafico`), `Notas.tsx` (`destaque`, `definicao`, `frase`, `pergunta`), `Cta.tsx` (`cta`).
- A assinatura: `Espectro.tsx`, `Particulas.tsx`, `Ondas.tsx`, `Observador.tsx`, `Trajeto.tsx`; `Anotacoes.tsx`.
- Peças comuns: `src/tinta/Tinta.tsx` (traço, tracejado, esboço, seta, cota, molécula, círculo), `src/tinta/Escrita.tsx` (letra à mão, risco), `src/figuras/texto.tsx` (texto medido de qualquer tamanho), `src/figuras/Topo.tsx` e `src/componentes/Cabecalho.tsx` (linha impressa e título), `src/medir.ts` (medida e quebra de texto), `src/layout.ts` (lugares da foto, alternância, troca de folha).

## Se precisar de algo que o modelo não tem

- **Um desenho novo** (um circuito, um órgão, uma máquina): escreva um componente em `src/figuras/`, seguindo o molde dos que existem: recebe `m`, `t`, `areas`, `palavras`, `chegada`, `id`, `revela` e `rotulo`; usa `cabecalhoDoBloco` (`Topo.tsx`) para o cabeçalho; desenha num `<svg>` do tamanho do quadro, dentro do corpo, sem invadir o lugar da foto; cada parte com seu `…Em`, desenhada com `Traco`/`Tracejado`/`Seta`/`Cota` e esboçada antes com `Esboco`; textos com `prepararTexto` + `TextoAMao`. Depois acrescente o tipo em `src/plano.ts`, o lugar padrão em `LAYOUT_PADRAO` (`src/layout.ts`) e o `case` em `src/Edicao.tsx`. Confira num quadro a 540 px. Consulte a skill do Remotion para as regras de animação.
- **Um ícone novo para o `cta`**: acrescente em `ICONES` (`src/figuras/Cta.tsx`), num quadrado de ~56 px em volta do centro, e o nome no tipo `Cta["icone"]` (`src/plano.ts`). A conferência aceita só os quatro universais (`seguir`, `salvar`, `comentar`, `link`).
- **Uma forma de curva nova para o `grafico`**: acrescente em `FORMAS` (`src/figuras/Grafico.tsx`) uma função de 0–1 para 0–1 e o nome no tipo `Grafico["curva"]`.
