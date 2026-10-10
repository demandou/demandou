# O estilo Prompt

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma aula de prompt bem desenhada — clara, tátil, calma — e não um vídeo com enfeites de "inteligência artificial". Quase toda "melhoria" que adiciona coisa (brilho, neon, partículas, cérebro digital, robô, código caindo, gradiente roxo) piora o resultado.

## A ideia

Prompt bom não é texto mágico: é um pedido montado com peças. O modelo mostra isso literalmente. O pedido vago aparece num chat e recebe uma resposta cinza e borrada — o vago "não entra em foco". Depois cada parte do prompt vira um bloco colorido com dente, que encaixa no de cima no instante em que a pessoa diz o nome dele, e o texto da peça é digitado na fala. O prompt montado vai para a caixa e a resposta entra em foco, linha por linha, e cada cor de peça reaparece no que ela mudou na resposta. O espectador vê o prompt sendo construído, não lê sobre ele.

## Regras que definem o estilo

- **Uma bancada neutra.** Fundo cinza-claro frio `#DFE2E6`, sem textura, sem grade, sem brilho. Os cartões e janelas são brancos com sombra macia; a pessoa fica numa janela com moldura branca de 7 px. A bancada é escura o bastante para o branco destacar e clara o bastante para as peças brilharem.
- **A cor só existe nas peças.** Quatro cores, na ordem em que as peças entram: anil `#3157D5`, jade `#0F8A65`, mostarda `#E6A61F` (texto escuro `#2A1E04` em cima) e framboesa `#D2457A`. Cada uma tem uma versão escura para texto sobre fundo claro (`#2645B0`, `#0B6F51`, `#93650A`, `#B23462`) e uma clara para chips e colunas (`#DFE6FB`, `#D6EFE6`, `#FBEDCC`, `#F9DFE8`). Todo o resto é neutro: tinta `#15171C`, texto de apoio `#5A606B`, lápis `#9CA3AD`/`#C9CED5`, borrado `#9AA0A9`, cartões `#FFFFFF`/`#F2F3F5`. Na resposta, a cor de cada peça aparece **só no que ela mudou** (o papel da IA, o título, as etiquetas do contexto, a coluna pedida no formato) — nunca como enfeite.
- **As peças são blocos de verdade.** Retângulo arredondado com um recorte no alto e um dente embaixo, na mesma posição: o dente de uma entra no recorte da de baixo. Cor chapada com um brilho leve no alto e um fio claro na borda de cima, sombra curta. Letreiro em caixa alta com ícone a traço numa pastilha translúcida, contador "1/4" à direita e o texto grande embaixo. Na fila (cabeçalho e fechamento) as peças encaixam pelo lado.
- **Espera a lápis em tudo.** O que vai receber algo já existe tracejado e apagado: as vagas das peças (com o nome apagado e barras no lugar do texto), a fila de progresso, a caixa de texto do chat ("Pergunte qualquer coisa"), a resposta borrada antes de entrar em foco. Nada surge do vazio e nenhuma caixa fica vazia.
- **O vago é borrado; o certo é nítido.** A resposta genérica é cinza e borrada (blur forte); a resposta nova chega borrada e entra em foco — o desfoque é o único "efeito" do modelo e tem significado. Não use desfoque em mais nada.
- **Um chat fictício.** "Assistente", avatar redondo escuro com "IA" em fonte de números, balões arredondados, caixa de texto com botão de enviar redondo. Nada de logotipo, nome ou cor de produto real.
- **Duas fontes**: Anuphan (títulos, textos, tabela) em 500 a 700 — o I maiúsculo tem serifa e o l tem cauda, então "IA", "Il1", "Inglês" nunca se confundem — e Sometype Mono (letreiros em caixa alta, contadores, números da tabela). Gratuitas, do Google Fonts. Nada de condensada.
- **Legível no celular** (julgue nos quadros reduzidos a 540 px): título da bancada 84 px (74 se passar de 26 caracteres), nome grande da peça até 116 px, título do fechamento 72 px, título da resposta 60 px, texto das peças 44–56 px (o mesmo em todas), legenda 46 px, linhas da tabela, nota, balões, caixa de texto e botões 44 px, "Assistente" 38–40 px, etiquetas 36–38 px, assinatura 36 px, "PEÇA 1 DE 4" e números da fila 34 px, "como nutricionista" e etiqueta do nome 34 px, letreiros das peças, contadores, "SEU PROMPT", cabeçalho da tabela e "EXEMPLO" 32 px. Nada abaixo de 32 px.
- **Zonas reservadas**: nada acima de 176 px (abas do app), nada à direita de 960 px (botões do app), conteúdo até ~1500 px, nada abaixo de 1560 px (interface do app). Os cartões no peito (abertura e fechamento) ficam entre 120 e 960 px, centrados no rosto, abaixo do queixo.
- **A pessoa muda de lugar a cada ato** (tela cheia → janela larga no alto → janela no canto → janelinha ao lado da caixa → tela cheia), sempre com o rosto inteiro, nunca recortada do fundo, nunca coberta. As trocas duram 0,6 s, arrancam e freiam por igual, e caem nos cortes.
- **Movimento com significado**: o pedido é digitado letra a letra, o cartão do chat cresce quando a conversa começa, as vagas acendem no número dito, cada peça entra pela esquerda, sobe e desce encaixando, o texto é digitado na fala com cursor, o nome grande troca subindo, a fila se pinta, as peças encolhem para a caixa, o botão é tocado, a resposta entra em foco linha por linha e os números contam, os botões finais viram "Salvo" e "Testando". Sem quique, sem elástico, sem giro, sem brilho, sem tremida, sem flash.
- **Som raro e tonal**: um envio suave, um tom abafado no "vago", um "toc" grave por peça (a nota sobe a cada peça, como um acorde que se monta), duas notas no envio do prompt, um acorde curto quando a tabela fica pronta, uma nota ao salvar e duas ao testar. Nada de clique agudo, ruído ou sino.

## Os blocos universais neste estilo

Os 11 blocos universais (`abertura`, `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `frase`, `pergunta`, `cta`) usam as mesmas peças da assinatura: cartão branco no peito em tela cheia, ou bancada com a pessoa numa janela; peça com dente para `passos`, `numero`, `destaque` e `topicos`; o vago (cinza, tracejado) é o lado que perde na `comparacao`; o foco é o que entra no `grafico`. Mesmas regras: texto digitado na fala, espera a lápis, cor só nas peças (framboesa = alerta, anil = chave), tamanhos mínimos, nada abaixo de 32 px, sem desfoque fora do "vago".

## O que pode mudar por vídeo

- Textos, tempos, peças (2 a 5), nomes, a tabela e a escolha dos componentes (é o trabalho do plano).
- `marca` (nome e área), o pedido vago, as etiquetas, o papel da IA, a nota e a coluna destacada.
- `ajusteJanela`, para a cabeça caber inteira nas janelas.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- A mecânica (`src/geometria.ts`): lugares da pessoa, tamanhos da pilha, da caixa e do cartão, tempos das trocas, a regra de nunca cobrir o rosto.
- Cores. Se o usuário pedir as cores da marca dele, troque **as quatro peças juntas** em `PECAS` (`src/tema.ts`) por quatro cores da marca com o mesmo peso (nenhuma muito mais clara que as outras), mantendo para cada uma a versão escura (texto sobre fundo claro) e a clara (chips). A bancada, o branco e a tinta seguram a elegância — não pinte a bancada.
- As fontes e os tamanhos; as margens de 60 px.
- Não adicione emojis, logotipos (de assistente, de app, de rede social), robôs, cérebros, partículas, brilho atrás da pessoa, contorno nas letras, gradientes coloridos, telas de código, transições além das trocas de lugar e do foco. Não troque os ícones a traço por ícones coloridos ou de banco.

## Se precisar de algo que o modelo não tem

- **Um ícone novo**: acrescente em `DESENHOS` (`src/componentes/Icones.tsx`) — viewBox 48×48, traço único (`tracos`), pontas redondas, o objeto ocupando de ~6 a ~42; áreas cheias só em `cheios`. Genérico: nada que lembre o logotipo de um produto. Para o ícone sair sozinho pelo nome da peça, acrescente o nome em `iconeDaPeca`.
- **Uma quinta peça**: o modelo foi desenhado para até 4 cores; a quinta repete o anil. Se a fala tem cinco partes, prefira juntar duas numa peça só ou usar `passos`.
- **Um componente novo** (por exemplo, uma comparação antes/depois em dois cartões): use a bancada (`cor.bancada`), cartões brancos com `sombra()`, a pessoa num dos lugares de `LUGAR` (`src/geometria.ts`), conteúdo esperando a lápis e entrando no tempo das palavras (`temposDoTexto`, `Digitado`, `PalavraPorPalavra` em `src/anim.tsx`). Acrescente o tipo em `src/plano.ts`, o lugar da pessoa em `estadosDaPessoa`, os sons em `sons` e o caso em `src/Edicao.tsx`. Consulte a skill do Remotion para as regras de animação.
