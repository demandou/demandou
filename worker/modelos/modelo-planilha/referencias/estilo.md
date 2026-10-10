# O estilo Planilha

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma planilha de verdade, bem desenhada — clara, precisa, crível — com qualquer assunto: imposto, cripto, roteiro de viagem, rotina de sono, vendas. Quase toda "melhoria" que adiciona coisa (gráfico 3D, moedas caindo, cifrões, brilho, verde de planilha) piora o resultado.

## A ideia

Organizar uma ideia é montar uma planilha. A tela inteira vira uma, e a pessoa entra nela como uma célula mesclada, presa à grade: ela é "recortada e colada" de um lugar para outro conforme a informação precisa de espaço. A fala é digitada célula a célula, o cursor framboesa pula no ritmo, a barra de fórmula mostra o que está sendo escrito, as marcas entram, o total soma sozinho. Quem assiste vê a planilha sendo montada ao vivo — e qualquer assunto cabe numa planilha.

## O sistema visual

### Dinâmica do motion
- **Tudo é digitado**, letra a letra, a partir da palavra falada, com o cursor de texto framboesa. Nenhum texto aparece com fade ou zoom. Uma palavra só começa quando a anterior terminou.
- **O cursor de célula é o protagonista do ritmo**: borda framboesa de 5 px com a alça de preencher no canto; pula para a célula da vez (0,2 s, decidido e macio); a letra da coluna e o número da linha acendem; na série dos passos e no preencher vira uma seleção tingida que desce pela coluna.
- **Operações de planilha dão o movimento de cada bloco**: o ✓/✗ assenta num círculo; o número conta e ganha um traço embaixo; a formatação condicional pinta a célula da esquerda para a direita; a nota abre presa por um traço; o tachado risca; a lista suspensa abre; as barras crescem, a linha avança de ponto em ponto, a rosca se fatia; o total recalcula (lampejo) e fecha com o traço duplo; a aba nova nasce; o arquivo fica "Salvo".
- **A pessoa muda de lugar em toda fronteira** (0,55 s, curva suave, sem quique), com o contorno tracejado que anda ("recortar") marcando o lugar novo. Na abertura e nos blocos de cima, ela ganha um empurrão lento de 3%.
- **Trocas sem vazio e sem fantasma**: a célula nova limpa o lugar dela de uma vez (opaca, sem transparência); o conteúdo antigo fica até a pessoa deslizar por cima dele, como uma cortina, ou é apagado (como o Delete) logo antes de o novo escrever. Nunca duas páginas de texto uma sobre a outra.
- **Espera "a lápis"**: tudo que vai receber algo nasce com barras cinza, círculos e etiquetas tracejadas; ganha cor na palavra.

### Organização e hierarquia
- Uma ideia grande por vez, numa célula mesclada; o resto é grade.
- Listas e avaliações viram **tabela** (cabeçalho em caixa alta com fio grafite, linhas de 88 a 170 px, ✓/✗ na coluna B, detalhe na C, total embaixo). Sequências viram a **série 1, 2, 3** na coluna A, ligada por um traço.
- Na faixa, a **célula ao lado da pessoa** é a lente: amplia o item da vez (com "2/4" e a barrinha de células), o passo da vez (número grande) ou os dados do gráfico.
- A **barra de fórmula** repete o que está sendo digitado; a **caixa de nome** dá o endereço; a **barra de status** conta ou soma as marcas.

### Tipografia
- **IBM Plex Sans** (interface; o I maiúsculo tem serifa e o l tem cauda, então "IPTU", "Inglês" e "Il1" nunca se confundem) em 500 a 700, números tabulares; **Red Hat Mono** para fórmulas, valores crus e endereços. Gratuitas, do Google Fonts. Nada de condensada, espaçamento entre letras de no máximo −0,01em.
- **Todo texto é medido** com as larguras reais da fonte (`src/medida.ts` + `src/larguras.ts`): o bloco escolhe o maior corpo que cabe, quebra em até 2 ou 3 linhas e nunca vaza.
- Tamanhos no quadro de 1080: título e destaque 56–96 px; número 72–200 px; textos de célula 44–76 px (tabela 38–56); rótulos em caixa alta 28–34 px; etiquetas 34–42 px; barra de fórmula 46 px (duas linhas de 40, nunca abaixo de 38); abas 34 px; números das linhas e barra de status 30 px. Nada abaixo de 28 px.

### A moldura da pessoa
- A pessoa é uma **célula mesclada** encaixada nas linhas da grade, com um fio cinza de borda (sem sombra nem brilho) e a etiqueta no pé (barrinha framboesa, nome em grafite, área em cinza). Nunca é coberta, nunca é recortada do fundo, nunca é esticada: o vídeo só é reenquadrado.
- Seis lugares (grande, alto, esquerda, direita, estreita, cheia). O template confere a cabeça pelo rastro do rosto: abre o quadro e desce o rosto quando a cabeça não caberia; com gravação muito perto da câmera, o lugar "alto" ganha duas linhas.
- A célula segue o rosto quando a pessoa se mexe (rastro do motor).

### Cores, textura e som
- Grade e células brancas (`#FFFFFF`) sobre o cinza-claro do aplicativo (`#F3F4F6`), cabeçalhos `#ECEEF2`, linhas `#DCE0E6`, texto grafite `#15181D`, apoio `#5A626F`, esboço `#C3C8D0`/`#E6E9EE`.
- **Framboesa `#D11F6A` = o acento**: cursor, ✓, total, destaque, formatação condicional de alerta, fórmula (nomes), etiqueta da pessoa, recortar, aba ativa, o que acabou de acontecer. Framboesa-claro (`#FCE7F0`, `#F8CFE0`) só como fundo de seleção, de destaque "chave" e das barras anteriores. ✗ e o "contra" ficam em grafite. Nada de gradiente, neon ou segunda cor forte. Nunca o verde de planilha.
- Som raro e tonal: toque grave quando um item entra (sobe uma nota por linha), duas notas no ✓, acorde curto quando um número ou fórmula dá resultado, arpejo no preencher e no gráfico sem números, nota curta na aba, na nota e no tachado, duas notas descendo ao salvar. Nada de clique agudo, ruído, "dinheiro caindo" ou sino.

## Medidas da grade (px no quadro 1080 × 1920)

- Barra de título 0–96 e ferramentas 96–176 (decoração, ficam embaixo das abas do app); barra de fórmula 176–296; letras das colunas 296–348; a grade de 348 a 1504; abas da planilha 1504–1580 (o texto termina antes de 1560); barra de status embaixo (atrás da interface do app).
- Colunas: A 48–360, B 360–592, C 592–1040 (D cortada à direita). Faixa de cima: 5 linhas de 100 px (348–848). Embaixo: cabeçalho da tabela de 68 px e linhas de 128 px (as da `linha`) ou de 88 a 170 px (as dos blocos).
- Células de conteúdo: de cima 992 × 300; larga embaixo 992 × 460 (ou 992 × 332 com gravação perto da câmera); ao lado da pessoa 448, 312 ou 544 × 500; área de baixo 992 × 656.

## O que pode mudar por vídeo

- Textos, tempos, itens e a escolha dos blocos (é o trabalho do plano).
- `marca`, `planilha` (nome do arquivo e abas), `tabela` (títulos das colunas, marca ou número, rótulo do total).
- O lugar da pessoa num momento (`pessoa`), com moderação.
- `enquadramento`, quando a cabeça aparece cortada.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A grade (`src/tema.ts`, `src/grade.ts`, `src/blocos.ts`): larguras das colunas, alturas das linhas, lugares da pessoa. Tudo encaixa nela.
- A direção (`src/roteiro.ts`): trocas, alternância, regra de saída das células (coberta ou apagada), tempos completados.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `acento` em `src/tema.ts`, junto com `acentoEscuro` (uns 25% mais escuro), `acentoFundo` e `acentoFundo2` (bem claros) e `acentoRgb` (a mesma cor em "R,G,B"). Uma cor viva o bastante para texto branco em cima. Verde de planilha, não.
- As fontes e os tamanhos. Se trocar a fonte, gere de novo `src/larguras.ts` (larguras reais), senão o texto deixa de caber.
- Não adicione emojis, logotipos (de programa, de banco, do governo, de rede social), cifrões soltos, moedas, brilho atrás da pessoa, contorno nas letras, gradientes, gráficos 3D, transições além do deslizar da célula.

## Se precisar de algo que o modelo não tem

- **Um ícone novo**: acrescente em `DESENHOS` (`src/componentes/Icones.tsx`) — viewBox 48×48, traços na ordem em que se desenham, pontas redondas, o objeto ocupando de ~6 a ~42. Genérico: nada que lembre o logotipo de um produto ou órgão.
- **Uma ilustração nova para a célula ao lado da `linha`**: um tipo novo em `Ilustracao` (`src/plano.ts`) e um componente em `src/componentes/Destaque.tsx` que use a `Moldura`, meça o texto (`encaixar`), espere "a lápis" até o `em` e use só o acento.
- **Um bloco novo**: tipo em `src/plano.ts`; lugar padrão em `lugaresDosMomentos` (`src/grade.ts`); alvos do cursor, barra de fórmula e sons em `src/roteiro.ts`; o componente dentro de `CelulaBloco` (`src/componentes/Blocos.tsx`) ou na faixa (`src/componentes/Faixa.tsx`); o caso em `src/Edicao.tsx`. Toda célula nova encaixa nas bordas de `COL` e das linhas. Consulte a skill do Remotion para as regras de animação.
