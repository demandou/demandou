# O estilo Figurinha (versão deitada, 16:9)

Na versão deitada (1920×1080, o vídeo completo do YouTube) o estilo é o mesmo do vertical; muda só a composição, pela aula 9 do curso: a pessoa em tela cheia é a base, e nas páginas, no álbum e no especial ela vira a figurinha especial numa moldura do lado direito, com o bloco colado no quadro do lado esquerdo. O que no vertical era empilhado vira fileira ou coluna.

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um álbum de figurinhas **caprichado**: papel de verdade, figurinhas que descolam e colam com peso, um carimbo com falhas de tinta, um mascote expressivo. É quente e divertido sem ser infantil; o que separa um do outro é a contenção. E vale para qualquer assunto: o álbum é a forma, a fala do usuário é o conteúdo.

## A ideia

Quem fala está montando, junto com quem assiste, a página de um álbum. Cada coisa que ela cita vira uma figurinha que entra na coleção; o veredito (✗, ✓ ou uma palavra da fala) é um carimbo. Ela mesma é a figurinha especial da página, e um vira-lata caramelo acompanha tudo e reage.

## 1. Dinâmica do motion

- **Física de papel, sem quique.** Etiqueta e figurinha colam chegando ~8% maiores, 3° inclinadas e 26 px acima, e assentam em ~0,4 s (curva que desacelera). Saem puxadas para baixo, para longe do rosto, opacas até sair. Nada de elástico, mola, balanço, flash ou partícula.
- **Esboço a lápis antes da tinta.** Toda palavra, casa, selo, trilha, barra e carimbo que ainda vai aparecer já está a lápis (cinza claro, tracejado). Na palavra dita, ganha tinta e cor. Nenhuma caixa fica vazia.
- **Palavra por palavra.** Títulos, nomes e frases passam do lápis à tinta uma palavra de cada vez, subindo um pouco, no ritmo da fala. Terminada a entrada, a palavra é desenhada uma vez só, como texto simples.
- **A figurinha do álbum:** chega numa cartela (deslizando da direita), o canto dobra (descola), ela sobe com a sombra mais longa, assenta com a sombra curta, leva o carimbo e voa para a sua casa na fileira.
- **O carimbo é o clímax:** cai de cima em 0,12 s e para seco na palavra; o desenho embaixo desbota para ele ler por cima; o cachorro reage no mesmo instante.
- **A página vira:** duas páginas seguidas, a nova desliza da direita por cima da velha em 0,5 s, com sombra de papel na beirada. Nunca uma página aparece através da outra.
- **A pessoa é quem muda de lugar:** tela cheia ↔ figurinha da moldura da direita (páginas e álbum) ↔ figurinha especial grande, em 0,55 s, começando ~0,15 s antes da fronteira (o corte cai no meio do movimento). O conteúdo novo aparece junto com a troca; ao voltar ao quadro cheio, a etiqueta entra quando a pessoa já cobre a tela.
- **Nada parado:** algo muda a cada 1,5 a 2,5 s (uma palavra, uma figurinha, um carimbo, o cachorro, o brilho da moldura a cada ~3 s).

## 2. Organização e hierarquia

- **Uma ideia por tela.** O que está sendo dito é o maior; rótulos, detalhes e números de casa são menores.
- **Tela cheia:** a pessoa como foi gravada; etiqueta no peito, no terço de baixo (da `zona` abaixo do queixo até y 954), 1360 de largura centrada no rosto (a pergunta com opções e o fechamento, de margem a margem); o selo redondo fica ao lado do texto (número da abertura, "?" da pergunta), numa fileira.
- **Página:** figurinha da pessoa na moldura da direita (556×820, x 1268 a 1824); no quadro da esquerda (x 96 a 1220), título no alto, alinhado à esquerda, até 2 linhas largas, com o cachorro espiando na ponta da linha, apoiado na beirada do conteúdo; conteúdo de margem a margem do quadro de y 310 até 954; listas de 4 ou 5 itens em duas colunas, comparação lado a lado.
- **Álbum:** figurinha da pessoa na moldura da direita; no quadro da esquerda, o cachorro no alto, sentado atrás da figurinha da vez (1124×478, deitada), com o texto (Nº, nome, porquê) à esquerda e o desenho do lado da pessoa; fileira de casas numeradas embaixo (y 784 a 954).
- **Especial:** a moldura da pessoa cresce para a esquerda (800×660), a etiqueta do conselho cola ao lado dela, por cima da beirada, e a fileira continua embaixo.
- **Levemente torto, como colado à mão:** 1° a 3° de inclinação, alternando o sentido. Nunca mais que isso.

## 3. Tipografia

- **Uma fonte:** Recursive (Google Fonts), variável, no eixo casual (CASL 1). 900 em títulos, nomes e números; 720–800 em textos; 860 em rótulos de caixa-alta espaçada (0,06em). Espaçamento entre letras nos títulos: −0,01em. Ela tem I maiúsculo com serifa e l com rabicho: "Iogurte", "Il1" e "IPTU" não confundem.
- **Tamanhos (os mesmos do vertical, no quadro deitado de 1920 de largura, visto numa tela maior):** títulos de 56 a 104 px (o número do `numero` até 190 px), textos de apoio ≥ 40 px, chips e números de casa ≥ 30 px. Todo texto é medido com as larguras reais da fonte (`src/medida.ts`) e encolhe até o mínimo para caber em 2 ou 3 linhas; nunca vaza nem é cortado.
- Nada de fonte condensada, nada de contorno no texto.

## 4. Moldura da pessoa

- **Tela cheia:** o vídeo deitado inteiro, como foi gravado (`VideoNaCaixa`), nunca esticado.
- **Figurinha especial:** recorte branco, borda índigo `#2E2A62`, selo de estrela no canto e um brilho que atravessa **só a borda** a cada ~3,2 s; faixa de nome e área sobre o peito, nunca sobre o queixo. Nada brilha, desfoca ou acende atrás da pessoa. No quadro deitado ela fica sempre na moldura da direita, com o rosto centralizado e acompanhado.
- O rosto é seguido quadro a quadro (rastro do motor) e fica no centro da moldura. Sem ajuste, o template mede o rosto pelo rastro e aproxima até ele ocupar ~42% da largura da figurinha (zoom de 1 a 1,6; sem rastro, 1,4). `figurinhaDaPessoa` ajusta à mão.
- A figurinha da pessoa nunca cobre texto: cada cena reserva o lugar dela.

## 5. Cores, textura e som

- **Cores** (em `src/tema.ts`): papel creme `#F4ECDD` com trama de pontos; cartela `#FBF7EF`; lápis `#B5A893`/`#D3C7B3`; tinta índigo `#262347` (contornos e texto); framboesa `#D2385B` (destaques, carimbo ✗, alerta, selos); verde `#2F7D62` (carimbo ✓, o certo); caramelo `#D98A3F` (o cachorro); índigo da moldura `#2E2A62` (figurinha especial e figurinha brilhante). Fundos das figurinhas, claros e chapados: rosa, manteiga, menta, céu, lavanda, pêssego. Uma cor de destaque por bloco de texto, no máximo.
- **Ilustração:** traço índigo de espessura constante (2,6 no viewBox de 200), cor chapada, um reflexo branco discreto. Sem degradê, sem sombra pintada, sem emoji.
- **Papel quadriculado** (gráfico) e **papel pautado** (verso da definição): linhas índigo bem claras.
- **Som raro e tonal:** um toque grave quando um papel cola, uma nota curta subindo quando a figurinha descola ou a página vira, um baque grave no carimbo (com altura diferente a cada vez), duas notas suaves na figurinha especial e no número que termina de contar. Nada de ruído, "risco de papel", clique agudo ou sino; nunca dois sons a menos de 0,45 s.

## O cachorro

Um vira-lata caramelo sentado, recortado como figurinha (borda branca). É o mascote do álbum em qualquer assunto, não enfeite: aparece e **reage ao que é dito**: `querendo` (língua de fora) quando chega algo bom, `curioso` (cabeça inclinada), `susto` (olhos arregalados, orelhas para trás, três traços) no ✗ e no alerta, `feliz` no ✓, na figurinha brilhante e no fechamento, `preocupado` antes do conselho. Respira e abana o rabo devagar. Nunca passa por cima do rosto: no álbum fica na ponta esquerda do quadro (do lado oposto à pessoa), atrás da figurinha da vez; nas páginas espia na ponta da linha do título; nas etiquetas espia por cima da borda, do lado oposto ao rosto, e sai junto com a etiqueta. `"mascote": "nenhum"` tira o cachorro.

## O que pode mudar por vídeo

- Textos, tempos, desenhos, carimbos e a escolha dos blocos (é o trabalho do plano).
- `marca`, `mascote`, `figurinhaDaPessoa`, `sfx: false` (`lados` só vale no vertical).
- O texto do carimbo (`textoCarimbo`) e o tipo (`nao`, `pode`, `nenhum`).

## O que não mudar sem o usuário pedir

- Cores, fonte e tamanhos mínimos. Se o usuário pedir a cor da marca dele, troque **só** o framboesa (`carimbo` em `src/tema.ts`); papel, tinta e caramelo seguram a identidade.
- A posição das coisas: nada sobre o rosto, nada abaixo dos controles do player (y 984), nada colado nas laterais (96 px).
- A física de papel (sem quique), a regra do esboço a lápis e a página que vira.
- Não adicione emojis, brilho atrás da pessoa, degradês coloridos, tremidas, flashes, confete ou partículas.

## Se precisar de algo que o modelo não tem

**Um desenho novo** (em `src/componentes/Desenhos.tsx`):

1. Desenhe num viewBox de 200×200, centrado, ocupando ~150 px.
2. Use as peças prontas: `Forma` (contorno + cor chapada), `Bola`, `Detalhe` (linha interna; com `soCor` ela some no esboço) e `Reflexo` (brilho branco, só na versão colorida). Contorno padrão 2,6.
3. Confira as duas versões: colorida (figurinha) e a lápis (`lapis`, a casa vazia do álbum): o esboço tem que ser reconhecível só pelo traço.
4. Acrescente o nome em `Desenho` (em `src/plano.ts`), em `fundoDoDesenho` (o fundo padrão) e na tabela de `references/plano.md`.
5. Teste num quadro do `stills.mjs` reduzido a 960 px de largura: o desenho não pode ser confundido com outro.

**Uma reação nova do cachorro:** uma pose em `POSES` (`src/componentes/Cao.tsx`) combinando os traços que já existem, e o nome em `Reacao` (`src/plano.ts`).

**Um bloco novo:** siga a gramática acima: papel que cola e descola (`Etiqueta`, `Figurinha`, `colando`, `descolando` em `src/componentes/Figurinha.tsx`), casas a lápis (`CasaLapis` em `src/componentes/Blocos.tsx`), palavras que passam do lápis à tinta (`Palavras` em `src/anim.tsx`), texto medido (`encaixar` em `src/medida.ts`), cores de `tema.ts`; e consulte a skill do Remotion para as regras de animação.
