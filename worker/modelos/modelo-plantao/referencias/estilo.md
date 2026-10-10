# O estilo Plantão

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um explicador de telejornal bem produzido — o apresentador, o pacote gráfico da emissora e o painel que desenha a notícia — e não um vídeo com enfeites de jornal. Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

Quem explica uma notícia na TV faz três coisas: apresenta o assunto na tarja, chama a arte (a tela se divide e o painel desenha o que está sendo dito) e volta para a câmera. O modelo repete esse ritmo com **qualquer assunto**: um alimento tóxico para cães, um ciclo de alta do Bitcoin, um processo de vendas. A barra vermelha "EXPLICANDO", com o relógio contando, diz o tempo todo que a explicação está no ar; o letreiro na base resume a fala, correndo sem parar.

## As cinco coisas que fazem o estilo

### 1. Dinâmica do motion

- **Entra varrendo da esquerda e assenta.** Só o fundo da tarja é recortado; o texto aparece inteiro quando a tarja já abriu. Sai deslizando para a esquerda, cruzando com o que entra. Curvas de pacote gráfico: decididas na entrada, macias nas trocas. Sem quique, sem elástico, sem giro de enfeite, sem tremida, sem flash.
- **Tudo nasce "a lápis".** O que vai aparecer já está lá, tracejado em azul-claro ou com as palavras apagadas (16–40%), e ganha cor no instante em que é dito: a palavra é "varrida" pela cor da esquerda para a direita; números contam; valores rolam como placar (o novo empurra o antigo, nunca os dois sobrepostos); linhas e trilhos se desenham; a etiqueta anda; a nota encolhe. Terminada a animação, a palavra é desenhada simples, numa camada só.
- **Trocas sem quadro vazio e sem dupla exposição.**
  - quadro cheio → tela dividida: o painel já está pronto atrás da pessoa, que encolhe revelando-o (0,5 s, começando 0,2 s antes do momento, para esconder o corte);
  - painel → painel: uma faixa azul elétrico de 26 px atravessa o painel (0,45 s); o novo fica à esquerda dela, o antigo à direita;
  - painel → quadro cheio: a pessoa cresce por cima do painel e a tarja só entra quando ela já cobriu tudo;
  - tarja → tarja: a que sai desliza e some antes de o texto da nova aparecer.
- **Nada parado mais de ~2,5 s**: além dos itens que entram na fala, o relógio da barra roda, o letreiro corre (118 px/s), a câmera se aproxima devagar (3,5%) e a ponta de uma linha desenhada "respira".

### 2. Organização e hierarquia

- **Uma ideia por tela.** Tarja: chapéu pequeno na aba azul, a frase grande na tarja branca, o nome pequeno na tarja escura. Painel: cabeçalho curto (marcador azul + caixa-alta branca, ou a palavra-tema numa tarja branca), o desenho ocupando o painel, rótulos menores em azul-claro.
- Listas são tarjas brancas empilhadas com o marcador azul (a seta marca o item atual); sequências são quadrados numerados num trilho; números grandes ficam centrados com uma linha azul que corre; comparações são duas colunas com um fio e o selo do modo no meio.
- **A arte enche o painel.** Listas e números ficam centrados na altura; gráficos vão do cabeçalho até logo acima do letreiro; a etiqueta e a nota ocupam a largura.

### 3. Tipografia

- **Uma família só: Schibsted Grotesk** (variável, gratuita, do Google Fonts), grotesca larga desenhada para jornalismo: 900 em caixa-alta nas manchetes, na vinheta e nos valores; 800 em caixa-alta espaçada (0,06 em) nos rótulos, na barra, no letreiro e nas tarjas; 600–700 nos textos de apoio e na legenda. Números tabulares no relógio e nos valores. O I maiúsculo tem serifa ("Iogurte", "IPTU", "Il1" não confundem). Nada de fonte condensada.
- **Medidas na própria fonte**: `src/medidas.ts` tem a largura de cada letra em cada peso. Todo texto escolhe o corpo e quebra as linhas antes de desenhar; nada vaza (palavra longa demais reduz o corpo).
- **Tamanhos (quadro de 1080 de largura, julgue reduzido a 540 px):** vinheta 100–176 px; abertura, manchete, termo da definição 60–116 px; destaque 64–124 px; chamada do fechamento 56–92 px; números do painel 70–210 px; valores da etiqueta 40–104 px; textos de lista, passos e opções 30–60 px (normalmente 44–56); cabeçalhos de painel 38–52 px; rótulos de etiqueta, gráfico e tarjas 30–40 px; legenda 46 px; barra 34–38 px; letreiro 36 px; nada abaixo de 30 px.

### 4. Moldura da pessoa

- **Quadro cheio**: rosto na linha vertical do centro; as tarjas ficam na altura do peito, ancoradas logo acima do letreiro, e **nunca sobem acima do queixo** (o template estima o queixo pelo rastro do rosto e reduz a tarja para caber).
- **Tela dividida**: a pessoa ocupa a metade de cima, cortada logo abaixo do queixo (linha entre 860 e 980 px); um fio azul elétrico de 6 px marca a divisa. O rosto não sai do lugar. Em gravação muito perto da câmera (o queixo passaria da linha), a faixa da pessoa encolhe um pouco, presa no alto e centrada, com o estúdio dos dois lados e o fio azul nas laterais.
- A caixa da pessoa segue o rosto (rastro do motor). Nada recorta a pessoa do fundo. Nunca a pessoa numa coluna estreita: o formato `lateral` (painel em pé à esquerda) existe só para o vídeo de exemplo.

### 5. Cores, textura e som

- **Azul de estúdio `#0B1D6E`** no fundo dos painéis, com uma grade fina de "parede de dados" que corre devagar; **azul-noite `#061247`** nas faixas escuras (letreiro, relógio, tarja de nome, detalhe).
- **Azul elétrico `#2251FF` = o acento**: vinheta, abas, marcadores, trilhos acesos, fio da divisa, cortina, destaque de texto, selo da diferença.
- **Azul-claro `#A9C3FF`**: apoio, rótulos, segunda linha dos gráficos, esboços "a lápis".
- **Branco `#F3F5FA`** das tarjas, da etiqueta e da nota (texto azul profundo em cima).
- **Um único vermelho `#E3122C`**: a barra "EXPLICANDO" e o bloco do destaque de alerta. Em nenhum outro lugar.
- Desenhos chapados e de traço firme: linhas de 12 px com ponta redonda e o ponto que corre na ponta, triângulos ▲/▼, etiqueta de preço com furo, nota fictícia com selo e ondas finas. Nada de cédula real, logotipo de banco ou de emissora.
- **Som raro e tonal**: duas notas na abertura, um "vum" grave em cada troca de quadro, notas curtas subindo (dó, mi, sol) quando um item ou número acende, duas notas descendo na perda e no alerta, um acorde curto no fim. Nada de bipe agudo, sirene, ruído, clique ou sino.

## Cantos e faixas reservados

- Nada acima de 170 px (abas do app): a barra começa ali.
- O letreiro termina em 1552 px, acima da interface do app (1560 px).
- As tarjas ficam entre o queixo e o letreiro; o rosto nunca é coberto.
- Os painéis ficam entre a divisa e o letreiro.

## O que pode mudar por vídeo

- Textos, tempos, números e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e função), `barra` (assunto, meta, a palavra vermelha), `letreiro` (rótulo e frases).
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica dos quadros (`src/layout.ts`): a divisa logo abaixo do queixo, a duração e a curva da troca, a cortina entre painéis.
- A moldura (barra no alto à esquerda, letreiro na base) e as faixas reservadas.
- Cores. Se o usuário pedir a cor do canal dele, troque **só** o `eletrico` em `src/tema.ts` por outra cor saturada e escura o bastante para o texto branco ler em cima dela; mantenha o azul de estúdio, o branco e o vermelho só na barra e no alerta.
- A fonte, os tamanhos e as margens de 60 px.
- Não adicione emojis, logotipos de emissora, mapa-múndi girando, globo 3D, "BREAKING NEWS", sirene, brilho atrás da pessoa, contorno nas letras, gradientes, flashes, "zoom de impacto" ou transições entre cortes além das trocas de quadro. Não troque os desenhos chapados por fotos de banco de imagem.

## Se precisar de algo que o modelo não tem

- **Outro painel**: crie um componente irmão de `Topicos.tsx` ou `GraficoDados.tsx` que receba `area` e `entra` e desenhe dentro da `area`, com tudo nascendo "a lápis" e cada sub-passo no `em` da palavra (`temposDoTexto` de `src/anim.tsx`), medindo o texto com `caber`/`caberNaAltura` de `src/medidas.ts`. Registre o tipo em `src/plano.ts`, inclua-o em `PAINEIS` (`src/layout.ts`) e desenhe-o em `src/Edicao.tsx`. A cortina e as trocas vêm de graça.
- **Outra tarja de quadro cheio**: siga `Manchete.tsx` — use o `Gc` e o `textoDoGc` (cabe na altura entre o queixo e o letreiro) e as palavras acendendo na fala.
- Consulte a skill do Remotion para as regras de animação.
