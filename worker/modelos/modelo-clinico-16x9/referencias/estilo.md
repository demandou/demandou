# O estilo Clínico (versão deitada, 16:9)

Esta é a versão do quadro deitado (1920×1080, o vídeo completo do YouTube). O estilo é o mesmo do vertical; muda a composição, pela aula 9 do curso (editar uma aula horizontal): a tela cheia é a base, a lupa fica na moldura da direita com o rosto centralizado e acompanhado de leve, e o exame ocupa o quadro da esquerda.

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a clareza de consultório: parece alguém explicando com uma lupa na mão e um atlas aberto, seja o assunto um dente, uma carteira de cripto ou um chute a gol. Quase toda "melhoria" que adiciona enfeite piora o resultado.

## A ideia

Uma lupa. Na abertura, a pessoa está em tela cheia, como foi gravada, e a frase se escreve numa faixa larga na base do quadro, que se dissolve em branco. Quando ela começa a explicar, o quadro fecha num círculo em volta do rosto e o círculo encolhe e viaja até a moldura da direita: vira a lupa, com aro azul, e a tela vira o fundo branco do consultório. Ao lado dela, no quadro da esquerda, a informação aparece como num exame: um mostrador que mede, um desenho de atlas com rótulos, uma lista de achados, uma conduta numerada, um traçado em papel milimetrado, um verbete. ✗ vermelho no que está errado, ✓ azul no que está certo. No fechamento, a pessoa volta para a tela cheia.

## O sistema visual (vale para qualquer assunto)

### Dinâmica do motion
- Tudo entra no instante em que é dito: palavras sobem de trás de uma régua invisível, itens ganham ponto e linha-guia, anéis se traçam, o ponteiro corre, números contam com freio, desenhos se traçam e agem.
- Antes de ser dito, o lugar de cada coisa já aparece **a lápis** (traço cinza no lugar da palavra, círculo tracejado, haste cinza): nunca uma caixa vazia, nunca texto legível antes da hora.
- Entra decidido e assenta (curva `entra` em `src/anim.tsx`); nada quica nem pulsa; só o ponto de dor do desenho, que pulsa porque é dor, e o anel graduado atrás da lupa, que gira devagar (o instrumento está ligado).
- **As trocas cruzam.** Da tela cheia para a lupa, o quadro fecha num círculo grande em volta do rosto (0,22 s) e então encolhe e viaja até a moldura da direita (0,4 s), revelando a página nova em volta. De uma lupa para outra, o conteúdo antigo sai quando ela começa a viajar e o novo entra por baixo dela. De volta para a tela cheia, o círculo cresce por cima do conteúdo antigo e abre para o retângulo. Nunca duas páginas de texto uma sobre a outra.
- Terminada a entrada de uma palavra, ela fica como texto simples (sem a máscara de entrada).

### Organização e hierarquia
- A pessoa (a lupa) fica na moldura da direita, com o rosto no centro dela; o conteúdo se organiza no quadro da esquerda, em cinco lugares: tela cheia (texto numa faixa de névoa abaixo do queixo, em fileiras e colunas), `topo` (lupa grande no meio da altura, título e corpo centralizados no quadro), `centro` (lupa com o mostrador em volta, título ou número no quadro, na altura dele), `canto` (lupa pequena no alto, título embaixo dela, conteúdo grande no quadro inteiro), `lado` (lupa média mais alta, título e conteúdo alinhados à esquerda).
- Cabeçalho = número num anel ("01", "02"… quando a fala numera) + título. Corpo = o exame (desenho, mostrador, lista, traçado). Uma coisa grande por vez; rótulos, detalhes e etiquetas menores.
- Sem título, o cabeçalho de uma lista vira um contador ("2/3" num anel que enche).
- A lupa muda de tamanho e altura a cada momento (nunca o mesmo lugar três vezes seguidas), sem sair da moldura da direita. Tela cheia no começo, no fim e entre os blocos (a base da aula).

### Tipografia
- Uma família só: **Figtree** (Google Fonts), sem condensada, espaçamento entre letras de −0,02 a −0,01 em.
- 800 nos textos de tela cheia, números e termos; 700 nos títulos da lupa, itens e rótulos; 600 na legenda e nos rótulos em caixa alta (com +0,08 em).
- Todo texto é **medido** com as larguras reais da fonte (`src/larguras.ts`, `src/medida.ts`), quebrado em linhas equilibradas e reduzido até caber; nunca vaza.
- Tamanhos (quadro 1920 × 1080): tela cheia 56 a 112 px; títulos da lupa 60 a 88 px; número do `numero` até 190 px; itens 44 a 76 px; opções 36 a 58 px; rótulos de atlas 34 a 52 px; etiquetas em caixa alta ≥ 30 px; legenda 44 px. Nada abaixo de 30 px. Margens do YouTube: 96 px nas laterais e nada importante abaixo de y 984 (controles do player).

### Moldura da pessoa
- A pessoa é sempre o vídeo inteiro reenquadrado (`VideoNaCaixa` do motor), nunca recortada do fundo: em tela cheia ou dentro do círculo.
- Em tela cheia, a gravação deitada entra inteira, como foi feita; o zoom alterna 1 ↔ 1,06 em volta do rosto, com troca seca nos cortes.
- Na lupa (moldura da direita), o rosto ocupa ~43% do diâmetro (o zoom sai do tamanho do rosto medido pelo `cortar.mjs`; no 16:9 fica perto de 1,9), cabeça no centro, um pouco de ombro; a lupa segue o rosto com ajuste suave quando a pessoa se mexe, sem saltos.
- O aro: um filete azul de 3,5 px afastado 11 px do vídeo, que acompanha a forma da caixa. Atrás da lupa, três anéis quase invisíveis se abrem quando o círculo se forma e um anel graduado gira devagar. Nada de brilho, sombra ou halo atrás da pessoa.

### Cores, textura e som
- Fundo `#F3F6FA` (branco frio); branco puro na névoa, nos cartões e preenchimentos.
- Tinta `#0E2445` (azul quase preto) para texto.
- **Azul clínico `#1A4E9A`** para traços, números, ênfase, ✓ e o que está certo; azul-claro `#DCE6F4` para preenchimentos.
- Cinzas suaves para linhas de apoio, tecidos e o "a lápis" (`#CCD4DF`).
- **Vermelho `#CC3F36` só para o erro**: ✗, o ponteiro que trava, a região que dói, o risco, o alerta. Se tudo fica vermelho, nada é erro.
- Textura: papel milimetrado azul-claro nos traçados; preenchimentos claros e traço com pontas arredondadas nos desenhos (4,5–5,5 px nos contornos, 2,5–3,5 nos detalhes).
- Som raro e tonal: uma nota grave quando a lupa chega a um lugar novo (uma altura por lugar), duas notas descendo no ✗, duas subindo no ✓ (cada ✓ um pouco mais agudo), um acorde suave no fechamento. Nada de ruído, clique agudo, sino ou "whoosh"; nada em cima de cada palavra.

## Como cada bloco aparece

| Bloco | Peça do Clínico |
|---|---|
| `abertura`, `titulo` | texto grande na faixa de névoa branca abaixo do queixo; `titulo` pode ter o par ✓ / ✗ da dúvida, ao lado do texto |
| `topicos` | linhas de atlas: haste azul, ponto e linha-guia com cotovelo até cada achado; ✗/✓ opcionais |
| `passos` | a conduta: anéis numerados ligados, o passo atual cheio de azul |
| `numero` | o mostrador em volta da lupa (à direita) enche enquanto o número conta; o número grande no quadro da esquerda |
| `comparacao` | duas colunas de exame com selos; o veredito dá ✓ a um lado e ✗ ao outro |
| `grafico` | traçado azul em papel milimetrado; pizza = anel dividido com a legenda ao lado; sem números, curva com lupa de detalhe e "ilustrativo" |
| `destaque` | selo do exame (✗ alerta / anel chave) + frase grande sublinhada |
| `definicao` | verbete de atlas: termo sublinhado, ponto e linha-guia até o significado |
| `frase` | anotação na névoa, com risco vermelho palavra por palavra |
| `pergunta` | ficha de consulta: anel "?" e a pergunta à esquerda, opções com círculo de marcar à direita |
| `cta` | chamada à esquerda; botão de traço que se desenha + assinatura de prontuário à direita |
| `cronometro` (assinatura) | o aro da lupa vira instrumento: mede tempo, nível ou meta; trava em vermelho ou fecha em azul |
| `anatomia` (assinatura) | prancha de atlas: cérebro, corpo, coluna, dentes; ações, rótulos e veredito |
| `contagem` | pequenas lupas numeradas que se fecham na contagem |
| `checklist` | a conduta com ícones que se mexem e ✓; em tela cheia, o título ao lado (ou em cima) das linhas |

## O que pode mudar por vídeo

- Textos, tempos, blocos, desenhos, ações, rótulos e os lugares da lupa (é o trabalho do plano).
- `marca` (nome e área).
- Nada de recorte: o `modelo.json` pede `"formato": "16:9"` e a gravação deitada entra inteira (1920×1080).
- `lupa.zoom` / `lupa.ancoraY`, se o rosto ficar grande ou pequeno demais no círculo.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores, fonte, espessuras de traço e tamanhos de texto (em `src/tema.ts`). Se o usuário pedir a cor da marca dele, troque **só** `azul` (e, se precisar, `azulClaro`, uma versão bem clara dele); o vermelho do erro, a tinta e o fundo seguram o estilo. Um verde-petróleo (`#0F6B6B`) ou um azul-marinho funcionam; cores quentes (laranja, rosa) brigam com o vermelho do ✗.
- As posições e tamanhos da lupa (em `src/layout.ts`: sempre na moldura da direita), a altura da legenda, a faixa de névoa e a troca em círculo.
- A regra do vermelho só no erro.
- Não adicione emojis, stickers, barras de progresso, tremidas, flashes, transições entre cortes, sombras, brilhos, fotos de banco ou imagens de pessoas reais. Em saúde, nada de antes-e-depois de paciente nem promessa de resultado.

## Se precisar de algo que o modelo não tem

- **Um desenho novo** (olho, pulmão, pata de cachorro, uma moeda, uma trave de gol…): crie `src/desenhos/<Nome>.tsx` seguindo `Cerebro.tsx` ou `Dente.tsx`: um componente que recebe `t`, `de`, `acoes` e `id` e desenha numa caixa própria (em unidades do desenho), com o contorno em `Traco` (de `src/anim.tsx`) que se traça a partir de `de`, preenchimentos claros de `tema.ts`, e cada ação lida da lista `acoes` pelo nome e animada com `prog(t, em, dur)`. Exporte a caixa útil (`CAIXA_…`) e os alvos (`ALVOS_…`: ponto `x`, `y` e a direção padrão da linha-guia `dx`, `dy`, em px da tela), registre em `src/desenhos/biblioteca.tsx` e acrescente o nome em `Desenho` e as ações em `Acao` (`src/plano.ts`). Vermelho só na ação que mostra o problema. Confira com `stills.mjs` e rode `npx tsc --noEmit`.
- **Um ícone novo para a `checklist`**: acrescente o traço em `IconeDoItem` (`src/componentes/Icones.tsx`, caixa 100 × 100, com um movimento pequeno que tenha a ver com o item) e o nome em `IconeItem`.
- **Um bloco novo**: siga a gramática acima (lugar da lupa vindo de `src/layout.ts`: `areasDoLayout` dá o cabeçalho, o corpo e o quadro inteiro da esquerda; cabeçalho com `Cabecalho`, texto falado com `TextoFalado` + `encaixar`/`encaixarTitulo` (`src/medida.ts`) e `temposDoTexto`, selos com `Selo`, rótulos com `Rotulo` com os `limites` do quadro, cores de `tema.ts`, medidas do quadro em `QUADRO`) e consulte a skill do Remotion para as regras de animação.
