# O estilo Carrossel

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um carrossel bem desenhado — do tipo que a gente salva — e não um vídeo com enfeites; quase toda "melhoria" que adiciona coisa piora o resultado. O estilo vale para qualquer assunto: o que muda de um vídeo para outro é o conteúdo das páginas, nunca o jeito delas.

## A ideia

O vídeo inteiro é um post de carrossel. A pessoa é a capa; quando ela começa a explicar, o dedo "passa" a página: a pessoa sai pelo lado e entra um slide desenhado com a informação; depois, ela volta. Quem assiste reconhece o gesto na hora (é o gesto que faz o dia todo) e sente o vídeo avançando — os pontinhos embaixo dizem quanto falta. Fresco e alegre, sem ser infantil.

## 1. Dinâmica do motion

- **O deslize de página** (`src/paginas.ts`): da direita para a esquerda, 0,62 s, curva `bezier(0.62, 0, 0.18, 1)` (arranca macio, corre no meio, freia longo). Durante ele as duas páginas recuam 5,5% e ganham cantos de 52 px, revelando o tampo petróleo entre elas (vão de 34 px). O conteúdo da página chega 120 px depois da borda (paralaxe). O deslize começa 0,2 s antes do corte mais próximo da fronteira, para esconder o pulo.
- **Dentro da página, tudo chega na fala**: cada palavra de título sobe de trás de uma régua (0,42 s) no instante em que é dita e, assentada, vira texto simples (sem máscara). Itens, lados e opções chegam **deslizando da direita** (o mesmo gesto do carrossel, em miniatura) para uma vaga tracejada que já esperava por eles. Números contam (0,9 s, freando). Traços se desenham com pontas redondas; a cor chapada acende depois do traço.
- **O risco coral** é o gesto do "sai": passa da esquerda para a direita na palavra de ligação (troca) ou em cada palavra negada (frase), sempre depois de a palavra aparecer.
- **Nunca vazio, nunca dois por cima**: a página que chega já traz cabeçalho, título e as vagas (ou o esboço "a lápis" do termo, o zero do número); na página da pessoa, o cartão que sai desce e some antes de o próximo subir, logo antes da primeira palavra dele.
- **O marcador anda**: nas listas, o marcador do item da vez fica coral e os anteriores escurecem; nos passos, a linha entre os números fica cheia quando o próximo é dito.
- Entra decidido e assenta: sem quique, sem elástico, sem giro, sem brilho, sem tremida.

## 2. Organização e hierarquia

- **Uma ideia por página.** Página de conteúdo, de cima para baixo: cabeçalho do post (avatar 112 px + nome 46 px + área 37 px, a 176 px do topo) → título grande (a partir de 332 px) → o corpo (cartões, lista, gráfico) ocupando a página até ~1490 px, logo acima dos pontinhos, sem faixa vazia.
- **Página da pessoa**: um cartão só, centrado entre o queixo e a base útil (1392 px; desce até 1490 px quando precisa e não há legenda). O cartão mede o próprio texto e encolhe para caber abaixo do queixo.
- **Um item grande por vez**: o nome do item é o maior texto do cartão; rótulos em caixa alta pequenos acima; detalhes menores e mais claros embaixo.
- **Cantos reservados**: o canto de cima à direita é do contador "3/7" (os títulos começam abaixo dele); a faixa de 1520 a 1560 px é dos pontinhos; abaixo de 1560 px, a interface do app; acima de 176 px, as abas do app. Margens laterais de 60 px.

## 3. Tipografia

- **Uma família só: Parkinsans** (Google Fonts), sans geométrica, aberta e amigável. Foi escolhida também porque o **I maiúsculo tem serifa**: "Iogurte", "Inglês", "IPTU" nunca são lidos como "l". Nada de fonte condensada.
- **Pesos e papéis**: 800 nos títulos, numerais, destaques e termos (espaçamento −0,02 a −0,035em); 700 nas frases e chamadas; 600 nos nomes de itens, opções e rótulos de gráfico; 500 no apoio.
- **Tamanhos** (quadro de 1080 de largura; julgue nos quadros reduzidos a 540 px): títulos de página 62 a 96 px; termo da definição até 150 px; numeral até 176 px (o da capa, 2,2× o título); nomes de itens 44 a 90 px; frases 60 a 80 px; apoio 40 a 54 px; rótulos em caixa alta espaçada (0,14em) 30 a 34 px; contador 40 px. Nada abaixo de 30 px.
- **Medida de verdade**: `src/medida.ts` mede cada texto com as larguras reais da Parkinsans (`src/larguras.ts`), quebra em linhas equilibradas e reduz o corpo até um mínimo legível; nunca vaza. Números em pt-BR (83.000; 1,5; R$ antes, % depois).

## 4. Moldura da pessoa

- **Página da pessoa**: quadro cheio, rosto na linha vertical do centro, zoom mínimo e fixo; o rosto é seguido quadro a quadro (`VideoNaCaixa` com `plano.rosto`).
- **Página de conteúdo**: a pessoa sai junto com a página e fica viva no avatar redondo do cabeçalho (cabeça inteira, anel coral com respiro creme), como o de um post.
- **Calendário**: ela volta num cartão arredondado (452 × 620 px) no alto, à esquerda, ao lado do título.
- **Durante um deslize** entre duas páginas com a pessoa, a da página que sai (ou entra) é uma cópia muda do mesmo vídeo: a voz vem sempre de uma só, que nunca desmonta.
- Nunca recortada do fundo (funciona com qualquer gravação); nunca numa coluna vertical estreita. Vídeo 3:4 (horizontal, ou pessoa muito baixa) fica no alto de uma página creme — um slide de foto em cima e texto embaixo.

## 5. Cores, textura e som

- **Poucas cores, cada uma com função**: creme `#F4ECE1` (o papel das páginas e dos cartões), areia `#E8DAC7` (o que sai, as vagas, as etiquetas, as barras), petróleo `#0F4B5A` (o texto e o traço), petróleo escuro `#0A3440` (o cartão do que entra, o significado, o alerta, o tampo, os pontinhos) e **um acento coral `#E9684C`**: o numeral, o risco, a seta, o "=", o "?", o marcador da vez, a maior barra, o último ponto, o botão.
- **Desenhos a traço** (`src/componentes/Desenhos.tsx`): viewBox 200 × 200, traço único (7 px no cartão grande, 5 px nas listas) com pontas redondas, uma cor chapada por baixo. No cartão petróleo o traço é creme e o acento coral; no areia, petróleo.
- **Sem**: gradiente, brilho atrás da pessoa, contorno nas letras, emoji, sticker, foto de banco.
- **Som raro e tonal** (`public/sfx`): um "vum" grave por página, subindo de nota a cada página (6 notas em ciclo); duas notas curtas quando algo novo chega; um toque grave no destaque e no botão. Nunca dois sons a menos de 0,45 s. Nada de ruído, clique agudo ou sino.
- **Legenda**: só nas páginas da pessoa sem cartão; uma linha numa etiqueta creme logo acima dos pontinhos, palavra da vez em coral.

## O que pode mudar por vídeo

- Textos, tempos, desenhos e a escolha dos blocos (é o trabalho do plano).
- `marca` (nome e área), o `rotulo` da página da troca e os `rotulos` dos cartões, o botão do fechamento (`icone`).
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; 3:4 quando a pessoa está muito baixa (`--recorte 3:4`) ou a gravação é horizontal.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica do carrossel (`src/paginas.ts`): duração e curva do deslize, recuo das páginas, paralaxe, pontinhos e contador. É a identidade do modelo.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `coral` em `src/tema.ts` por uma cor quente e viva o bastante para ler sobre creme e sobre petróleo; creme, areia e petróleo seguram a elegância.
- A fonte, os tamanhos mínimos e as margens; nada abaixo dos pontinhos nem acima de 176 px.
- Não adicione emojis, stickers, brilho atrás da pessoa, contorno nas letras, gradientes, tremidas, flashes ou transições além do deslize. Não troque os desenhos a traço por fotos ou ícones coloridos.

## Se precisar de algo que o modelo não tem

- **Um desenho novo**: acrescente em `DESENHOS` (`src/componentes/Desenhos.tsx`) — viewBox 200 × 200, o objeto ocupando de ~30 a ~180, `tracos` (as linhas, na ordem em que devem se desenhar) e `forma` (as áreas chapadas: `corpo` e no máximo uma de `acento`). Mesmo traço, pontas redondas, sem detalhe miúdo. Se ele recebe complementos, dê um `encaixe` (onde o complemento pousa).
- **Um tipo de página novo**: um componente que desenha em coordenadas da página (1080 × 1920), com o conteúdo entre 332 px e 1490 px, usando `prog`, `TextoFalado` e `temposDoTexto` de `src/anim.tsx`, `encaixar` de `src/medida.ts` e as cores de `src/tema.ts`. Acrescente o tipo em `src/plano.ts`, diga em `TIPOS_DE_CONTEUDO` (`src/paginas.ts`) se ele é página de conteúdo, e o caso em `src/Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
