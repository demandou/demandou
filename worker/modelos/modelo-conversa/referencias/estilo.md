# O estilo Conversa

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um app de mensagens de verdade, bem desenhado e sem marca (do tipo que dá vontade de tirar print), e não um vídeo com balõezinhos colados por cima. Quase toda "melhoria" que adiciona coisa piora o resultado.

## A ideia

Todo mundo vive dentro de uma conversa. O modelo transforma a fala numa: quem assiste reconhece na hora o "digitando…", o "Visto", a resposta citando a mensagem, o ✓ do que deu certo, e sente cada ideia acontecendo na tela. A pessoa não sai de cena: ela é uma mensagem de vídeo sendo gravada dentro do app e, quando a ideia pede o rosto, a mensagem se expande para a tela cheia e depois volta a ser bolha. É o mesmo gesto do app, e é ele que dá ritmo ao vídeo. O assunto pode ser qualquer um: o estilo é a conversa, não o tema.

## 1. Dinâmica do motion

- **Dois estados e um gesto só.** Quadro cheio e tela do app. A troca é sempre a bolha que se expande ou encolhe (0,6 s, curva macia nas duas pontas), passando por um retângulo de cantos redondos. O app fica **atrás** do vídeo: quando a pessoa encolhe, a conversa já está lá.
- **A conversa é física.** Cada mensagem chega com "digitando…" (três pontos numa onda de opacidade, sem pulo), o "digitando…" vira o balão (o balão cresce até o tamanho do texto), o balão novo empurra os de cima e a conversa rola como no celular; o que sobe some num degradê embaixo da mensagem fixada. A tela que muda (uma comparação, um contraste) chega rolando de baixo, como a próxima tela do celular.
- **Esfria e acende.** O que dá errado esfria (o balão tangerina vira cinza, ganha "Visto", ✕); o que dá certo acende (✓ que se desenha, borda tangerina, reação que pousa, a condição que trava). A cor conta a história.
- **Tudo na fala.** Palavras se escrevem quando são ditas; o trecho-chave trava (fundo escuro, letra tangerina); o risco corre pela palavra; o número conta; o passo anterior ganha ✓ quando o próximo é dito; a curva do gráfico se desenha; a resposta rápida acende na palavra dela. Antes de ser dito, cada coisa aparece apagada ou tracejada ("a lápis"): nunca uma caixa vazia.
- **Movimento editorial.** Chega decidido e assenta: sem quique, sem elástico, sem giro, sem tremida, sem flash, sem brilho.

## 2. Organização e hierarquia

- **De cima para baixo, como no celular.** Cabeçalho do contato (nome e status) → mensagem fixada (o título da tela) → a conversa → a pessoa (a bolha) → a barra de gravação. A mensagem mais nova fica sempre embaixo, perto da pessoa.
- **Uma ideia por balão.** O que é dito em lista vira várias mensagens; o que é dito em ordem ganha número; o termo e a explicação são mensagem e resposta; o gráfico é um cartão compartilhado. Rótulo, hora, detalhe e "Visto" são pequenos; o texto do balão é o que se lê.
- **Seus × do outro lado.** Os seus balões (o que a pessoa diz) são tangerina, à direita; os do outro lado (a dúvida, a objeção, a reação de quem assiste) são ardósia, à esquerda.
- **No quadro cheio, UM balão no peito**, abaixo do queixo, e a pílula no topo. Nunca dois balões soltos na tela.

## 3. Tipografia

- **Uma fonte**: Atkinson Hyperlegible Next, uma sans de interface desenhada para leitura (o I maiúsculo tem serifa, o l tem cauda, o 1 tem bandeira: "Iogurte", "IPTU" e "Inglês" nunca viram "l"). Pesos 500 (balões), 600–700 (nomes, fixada, títulos, rótulos, respostas rápidas) e 800 (números, destaques, termos, títulos do contraste). Gratuita, do Google Fonts. Nada de fonte condensada nem espaçamento apertado (no máximo −0,02em nos números grandes).
- **Tamanhos** (julgue nos quadros reduzidos a 540 px, pela altura das maiúsculas, que na Atkinson é 0,67 do corpo): balões na conversa 70 px (58–64 em listas de 4–5 itens), no quadro cheio 72 px, abertura 80 px em negrito, destaque 96 px em negrito, número até 120 px, preço 120 px, fixada 52 px, nome no cabeçalho 60 px e status 46 px, pílula 52/40 px, respostas rápidas 44–48 px, títulos do contraste 74 px e desfechos 86 px, legenda 54 px, gráficos 30–42 px. Só a hora, os vistos e a barra de gravação ficam pequenos (30–44 px). Nada abaixo de 30 px.
- **O texto cabe sempre**: cada balão mede o texto (tabela de larguras da fonte em `src/metrica.ts`) e diminui o corpo até um mínimo legível, em até 3 linhas; nenhuma linha termina em "e", "de", "o".

## 4. Moldura da pessoa

- **Quadro cheio**: a pessoa inteira, rosto na linha vertical do centro, aproximando um pouco para seguir o rosto. Pílula escura no topo (acima da cabeça ou sobre o cabelo), o balão no peito (a partir de `zona.topo`, abaixo do queixo), a legenda no campo de texto acima de 1536 px.
- **Tela do app**: a pessoa é uma bolha redonda, centralizada, apoiada a 1544 px (acima da interface do Reels/TikTok), com rosto e ombros e o anel tangerina de gravação correndo durante todo o trecho no app. A bolha divide a tela com a conversa: grande (até 680 px) quando o momento tem pouca coisa, menor (até 440–500 px) quando as mensagens precisam de espaço; nas duas faixas, o que sobrar embaixo delas (470–640 px). Embaixo, a barra de gravação (tempo piscando, "deslize para cancelar", enviar) fecha a tela como num celular.
- O vídeo nunca é recortado do fundo: funciona com qualquer gravação. Uma pessoa só na tela, sempre com a voz. O rosto é seguido quadro a quadro (`rosto.rastro`).

## 5. Cores, textura e som

- **Poucas cores, cada uma com função**: tinta-noite `#0E1116` (o fundo do app), barra `#161A21` (cabeçalho, fixada, faixas), ardósia `#232934` (balão do outro lado), porcelana `#F2EEE7` (texto claro, cartões do sistema e do gráfico), **tangerina `#FF7A33` = o acento** (seus balões, o anel, o "digitando…" no cabeçalho, o botão, o que dá certo), cinza-frio `#353B46` (o que dá errado, o que esfria). Nada do verde do WhatsApp, nada do gradiente do Instagram, nenhum azul de app.
- **Desenhos a traço**: o cartão, a condição e as reações usam ícones grandes de traço único (pontas redondas) que se desenham na fala, com uma cor chapada que acende depois. Nada de foto de banco, emoji ou ícone colorido.
- **Som raro e tonal**: um "vum" grave na troca de estado, um deslize grave na troca de tela, notas curtas e suaves nas mensagens, um tom que desce no que esfria, um acorde curto no que dá certo, um toque grave no botão. Nada de ruído, clique agudo ou sino.

## O que pode mudar por vídeo

- Textos, tempos, blocos e mensagens encenadas (é o trabalho do plano).
- `marca` (assinatura), `contato` (o papel do outro lado: "Você", "Cliente", "Paciente", "Aluna") e a hora dos balões.
- A ação do botão do fechamento (`icone`), os desenhos dos cartões.
- O recorte: o `modelo.json` fixa 9:16 para gravação vertical; 3:4 para gravação horizontal.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A gramática (`src/layout.ts`, `src/fio.ts`, `src/blocos.ts`): os dois estados, o gesto da bolha, a duração e a curva da troca, a rolagem da conversa, o app atrás do vídeo. É a identidade do modelo.
- Cores. Se o usuário pedir a cor da marca dele, troque **só** o `acento` (e o `acentoClaro`) em `src/tema.ts` por uma cor viva o bastante para ler texto escuro em cima dela; a tinta-noite, a ardósia e a porcelana seguram a elegância. Nunca o verde do WhatsApp nem o gradiente do Instagram.
- A fonte e os tamanhos (não diminua nenhum: eles são o mínimo legível no celular); as margens de 56 px; nada importante acima de 176 px nem abaixo de 1560 px (abaixo, só a barra de gravação, que é moldura).
- Não adicione logos, nomes de apps, meios de pagamento com marca, emojis, stickers, brilho atrás da pessoa, contorno nas letras, gradientes coloridos ou transições além da bolha que cresce e encolhe e da conversa que rola.

## Se precisar de algo que o modelo não tem

- **Um desenho novo**: acrescente em `DESENHOS` (`src/componentes/Icones.tsx`): viewBox 200×200, o objeto ocupando de ~20 a ~180, `tracos` (as linhas, na ordem em que devem se desenhar), `forma` (a área chapada) e, se quiser, `acento` (uma segunda área). Mesmo traço, pontas redondas, sem detalhe miúdo. Acrescente o nome no tipo `Desenho` (`src/plano.ts`).
- **Um tipo de mensagem novo**: acrescente o tipo em `Msg` (`src/blocos.ts`), a medida dele em `medidas` (`src/fio.ts`: a altura precisa ser conhecida sem medir o DOM; use `larguraTexto` e `quebrarLinhas` de `src/tema.ts`) e o desenho dele em `Balao` (`src/componentes/Balao.tsx`). Consulte a skill do Remotion para as regras de animação.
- **Uma fonte nova**: as larguras dos caracteres estão em `src/metrica.ts` (medidas no navegador). Trocar a fonte pede medir de novo; sem isso, os balões ficam do tamanho errado.
