# O estilo Devocional

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a **página de livro de devoção**: o texto escrito na fala em serifada grande, a palavra que acende, a página que vira, a luz e a poeira só no fundo. Ele é feito de poucas peças repetidas com rigor: pergaminho, tinta azul-noite, versalete oliva, ornamento, luz creme. Quase toda "melhoria" que acrescenta outro tipo de peça (brilho dourado, raios de luz fortes, coro de anjos, cruz, pomba, vitral, moldura barroca, fundo de céu com nuvens, texto com sombra) piora e puxa para a cara de "imagem de bom-dia", que é o oposto do estilo.

O estilo vale para qualquer assunto: fé, reflexão, autoajuda, luto, relacionamento, carreira, finanças, saúde. O que muda de um vídeo para outro é o texto, a palavra que acende e o desenho (quando houver), nunca a linguagem visual abaixo.

## A ideia

A pessoa diz algo que merece ser guardado. O vídeo **escreve isso numa página enquanto a voz lê**: a página já tem o texto clarinho, a lápis, e cada palavra ganha tinta quando é dita; a palavra que importa acende; quando a ideia muda, a página vira. No versículo (ou citação), a página fica cheia e a pessoa vai para um medalhão embaixo, como o retrato de um livro antigo; depois volta para a moldura larga.

## 1. Dinâmica do motion

- **Calmo, mas vivo**: algo muda a cada ~2,5 s, mesmo que seja só uma palavra ganhando tinta ou a luz respirando. Nada fica congelado.
- **Tinta que aparece**: cada palavra surge em 0,42 s (opacidade, desfoque de 5 px que some, 10 px de subida), no instante em que é dita. Terminada a entrada, a palavra fica desenhada simples (sem filtro nem transform).
- **A lápis** (versículo): o texto inteiro aparece em 0,6 s a 13% de opacidade quando a página vira; cada palavra passa de lápis a tinta em ~0,5 s quando é dita.
- **Acender**: a palavra passa de azul-noite a oliva em 0,6 s; uma luz creme se abre atrás dela (70% → 100%) e respira ±5%; um fio oliva se desenha embaixo, da esquerda para a direita.
- **A `luz`**: a palavra enorme nasce de dentro da luz (legível em ~0,1 s; desfoque 10 px → 0, 94% → 100%, creme → oliva em 0,4 s) e fica legível ≥ 0,8 s antes da virada; a luz sobe 60 px atrás dela e cresce; a poeira sobe em volta; o ornamento se abre embaixo.
- **A página vira**: a folha gira 90° na lombada (à esquerda), levantando na direção de quem vê, em 0,5 s (entrada e saída suaves); ela escurece de leve ao levantar e deixa uma sombra na folha de baixo. A folha nova já está no lugar.
- **A moldura**: no versículo, a moldura larga se recolhe no medalhão em 0,5 s (junto com a virada) e volta do mesmo jeito.
- **Desenhos**: os traços se desenham em sequência (~1,2 s), o preenchimento entra depois; então cada desenho tem um movimento lento próprio (o sol nasce, a chama tremula, o ramo balança, o coração bate de leve, a carta se fecha com um coração).
- **Fundo**: a textura do papel deriva devagar (escala ±2%, deslocamento de ~10 px em ~30 s), uma luz de janela passeia na diagonal (período de ~34 s) por baixo do texto, a poeira de luz (72 pontos de 4 a 8 px, alguns grandes e desfocados, mais fortes dentro do facho) sobe de 5 a 17 px/s piscando de leve.
- **Nada de**: giro, tremida, flash, zoom brusco, contagem regressiva, texto que pula, brilho atrás da pessoa.

## 2. Organização e hierarquia

- **Duas partes**: a página (área de texto de x 64 a 1016, de y 150 até ~44 px acima da moldura) e a moldura larga da pessoa (x 36 a 1044, a partir de y 1000; cantos de 44 px; os de baixo ficam fora do quadro). No versículo: área de texto até y 1146 e o medalhão de 420 × 500 no centro de baixo (y 1190 a 1690).
- **Uma ideia por página**, centrada na vertical, com respiro em volta.
- **Hierarquia**: texto falado (grande) > palavra acesa (oliva) > títulos e referência (versalete oliva) > rótulos e detalhes (itálico azul-noite claro).
- **Versículo**: chamada em versalete (44 px) com ornamento → texto (capitular de duas linhas no modo escritura; aspas no livro/autor) → ornamento → referência em versalete (até 50 px).
- **Margens**: nada de texto a menos de 64 px das laterais, nada acima de y 120, nada importante abaixo de y 1700. A tarja fica acima da moldura com 34 px de folga (y 842 a 966), à esquerda.
- **Legenda**: só quando um momento pede (`legenda: true`): pílula de papel claro abaixo do queixo, até 4 palavras, a palavra dita em oliva.

## 3. Tipografia

- **EB Garamond** (Google Fonts) para tudo que é lido na página: 500 no texto (nunca 400 fino em tamanho pequeno), 600 no `destaque` e no termo da `definicao`, itálico 500 para frases de apoio, rótulos e fechamento. Corpos: versículo 56–108 px (entrelinha 1,22); abertura 56–96; frase 52–90; destaque 60–124; palavra da `luz` até 300; números até 260 (algarismos alinhados).
- **Versalete** (feito no template: maiúsculas cheias + minúsculas em maiúsculas a 74%, espaçamento +0,06 a +0,08em) para chamada, referência, títulos, rótulos de comparação e "ilustrativo".
- **Manrope** 700/800 só na tarja do nome (48 px, mínimo 40; área em EB Garamond itálico 34 px, mínimo 28) e na legenda (até 50 px).
- Nada condensado, nada em caixa alta longa, tracking nunca mais apertado que −0,01em. Serifa de livro só em texto grande e bem espaçado.
- O texto é medido com as larguras reais das fontes (`src/larguras.ts`) e reduz até caber; cada frase começa numa linha nova; nunca vaza nem é cortado.

## 4. Moldura da pessoa

- Moldura larga embaixo; o rosto com ~28% da largura da moldura, no eixo central, ~52 px de folga acima do cabelo. Medalhão no versículo: rosto com ~44% da largura do medalhão, cabeça inteira.
- `VideoNaCaixa` com `rosto={plano.rosto}`: a moldura segue o rosto quadro a quadro.
- Um filete oliva (2 px) a 10 px da moldura, como passe-partout; sombra macia só para fora.
- **Nunca** mexa na cor do vídeo: sem filtro, brilho, halo ou luz atrás da pessoa. A luz e a poeira ficam por baixo do vídeo e a luz some antes da moldura.

## 5. Cores

| Papel | Cor |
|---|---|
| papel (pergaminho marfim) | #F3EAD4 (textura `public/devocional/papel.jpg`, feita por código) |
| tinta (texto) | azul-noite #1E2945; suave #596079 |
| lápis (o que ainda vai ser dito) | azul-noite a 13% |
| oliva (ornamento, capitular, versalete, o que acende) | #5B6A2E; escura #46521F; clara #DDE2C2 |
| luz (atrás do que acende) e poeira | creme #FFFBEF e branco quente |
| acento suave (sol, selo, coração) | aurora #C9866A; clara #EFD2C3 |
| alerta (risco, `destaque` de alerta) | tijolo #9C4535 |

**Não use preto com dourado** (é a marca do Cofre), nem dourado metálico, céu azul com nuvens, roxo de vitral ou gradiente arco-íris.

## 6. Sons

Tonais, raros e bem abaixo da voz (volume 0,1 a 0,18 antes da normalização a −14 LUFS): um sopro tonal de duas notas quando a página vira, uma nota macia (sol + ré) quando uma palavra acende, um toque curto de madeira afinada nos itens e na referência, uma nota grave quando um desenho começa, duas notas subindo quando a carta do fechamento se fecha. Nada de sino, coro, órgão, harpa de "milagre", ruído de papel ou ruído branco.

## 7. Imagens

- Este estilo é tipografia e traço: **sem fotos de banco**. Quando uma palavra pede imagem, use um dos desenhos de traço fino (`amanhecer`, `vela`, `livro`, `ramo`, `coracao`, `caminho`, `lua`, `semente`), e só se ele mostra literalmente o que foi dito.
- Nada de símbolo de denominação (cruz, santo, terço, estrela de Davi, logotipo de igreja), a não ser que o usuário peça.
