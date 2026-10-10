# O estilo Dicionário

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer um dicionário de verdade, bem impresso (sóbrio, tipográfico, com a graça das convenções de dicionário: sílabas com ponto, classe em itálico, acepções numeradas, abonação em itálico, palavras-guia no cabeçalho, índice de dedo) e estar em movimento o tempo todo, porque cada coisa dita se escreve na hora. Vale para qualquer assunto: o dicionário é a forma; o conteúdo é a fala da pessoa.

## A ideia

Quem fala está folheando um dicionário do próprio assunto. A abertura é o frontispício: a pessoa grande em cima e a folha subindo por baixo com o título. Cada ideia é uma página: a pessoa vira a figura impressa da página (um quadro emoldurado no alto), a fala dela corre em itálico na coluna ao lado, como a abonação de um verbete, e o conteúdo se escreve embaixo: o termo como palavra-título, os motivos como acepções, os passos como remissões encadeadas, o número como verbete, a comparação em dois cartões de nota, o gráfico como gravura. A assinatura é o cartão de nota que mostra o que a palavra parece, risca, gira e mostra o que ela é, com o carimbo. Entre uma página e outra a página vira. Perguntas, destaques e frases fortes voltam ao frontispício (a pessoa grande, falando direto com quem assiste). O fechamento é a folha com a fita marcadora.

## 1. Dinâmica do motion

- **Gestos de livro.** A página vira na lombada (giro 3D de 0,62 s, com a folha escurecendo e a sombra dela na página de baixo); a folha do frontispício sobe por baixo em 0,55 s e, no fim, vira como página. O cartão de nota gira (0,46 s) e levanta um tiquinho no meio do giro.
- **Impressão.** Cada palavra entra no instante em que é dita: sobe 12 px e ganha tinta em 0,22 s, sem quique. A palavra-título entra sílaba por sílaba (0,07 s entre elas). Terminada a entrada, o texto fica simples, sem camadas.
- **Gestos de leitor.** O risco se desenha da esquerda para a direita; o marca-texto ameixa passa por baixo do item da vez (e sai quando vem o próximo); o carimbo desce acelerando e bate seco (o cartão afunda 4 px); o número conta; o fio entre os passos desce; a linha do gráfico se desenha; a fita cai e balança de leve.
- **Espera sem vazio.** Tudo que ainda vai ser dito já está a lápis: traços do tamanho de cada palavra, lacunas por sílaba, o cartão tracejado, o contorno do carimbo, o chip do passo tracejado. Ganha tinta no `em`.
- **Trocas sem quadro vazio e sem dupla exposição.** A página que sai vira por cima da que entra (cada folha com o seu texto, nunca um texto fantasma sobre outro); a folha do frontispício sobe cobrindo a página enquanto a pessoa cresce; a pessoa só encolhe para o quadro depois que a folha do frontispício virou.
- **Nada parado.** Numa página, a fala da coluna anda palavra por palavra; no corpo, algo novo a cada 0,5 a 2 s.

## 2. Organização e hierarquia

- **Página:** cabeçalho (palavras-guia em negrito nos cantos, número da página em sans no meio, fio de tinta) → no alto, a pessoa e a coluna estreita (a cabeça do verbete em ameixa e a abonação em itálico cinza) → embaixo, o corpo do bloco, grande. Abaixo de 1540 px fica só papel (é onde a interface do app cobre).
- **Frontispício:** a pessoa em cima (rosto livre, a folha começa abaixo do queixo) → letreiro em caixa-alta com fio → o bloco.
- **Uma ideia grande por vez.** Grande: palavra-título, item, número, pergunta, chamada. Médio: acepções, cartões, rótulos de gráfico. Pequeno: classe, pronúncia, "por extenso", letreiros, a fala da coluna.
- **Convenções de dicionário:** sílabas separadas por "·" (espaço entre as palavras de uma expressão), classe abreviada em itálico (`adj.`, `s.m.`, `loc.`), pronúncia aproximada entre colchetes com a tônica em negrito, acepções "1. 2. 3.", remissão com seta "→", exemplos e citações em itálico, número por extenso entre colchetes.
- **Índice de dedo** na borda direita: uma aba por página, a da vez em ameixa.

## 3. Tipografia

- **Source Serif 4** (Google Fonts) em tudo que é texto: 700 nas palavras-título, acepções, itens e cartões; 800 nas chamadas e no destaque-chave; itálico 400 na abonação, detalhes, prefixos e sufixos; itálico 600 na epígrafe; 400 nas definições e na pronúncia.
- **Source Sans 3** só em caixa-alta espaçada (0,08 a 0,15 em) e números: letreiros, rótulos dos cartões, chips, carimbo, números das acepções e dos passos, número da página, ILUSTRATIVO.
- **Tamanhos (quadro de 1080 de largura):** palavras-título 92 a 132 px; número que conta até 240 px; corpo dos blocos 44 a 88 px; abonação 40 px; letreiros 30 a 34 px; nada abaixo de 30 px. Nada de fonte condensada nem espaçamento negativo.
- **Medida real:** o texto é medido com as larguras da própria fonte (`src/medida.ts` + `src/larguras.ts`), quebra em linhas e diminui até um mínimo legível; nunca vaza nem corta.

## 4. Moldura da pessoa

- **Página:** quadro de 560×700 px no alto da página (à direita ou à esquerda, trocando a cada página), com fio de tinta de 3 px, sem sombra e sem brilho. A assinatura com verbetes vizinhos pode usar a coluna larga (520 px da altura da página).
- **Frontispício:** a pessoa em tela cheia na parte de cima, a folha cobrindo do peito para baixo.
- A troca é a caixa da pessoa crescendo ou encolhendo (0,6 s), de preferência em cima de um corte. Em cortes dentro de uma página, o zoom troca seco (6 %) para disfarçar o pulo.
- Nunca recortada do fundo, nunca esticada: é o próprio vídeo reenquadrado, seguindo o rosto. Rosto grande (gravação perto da câmera) → o quadro aproxima menos, para a cabeça caber.

## 5. Cores, textura e som

- **Papel** `#F3EFE6` (cartão `#FAF8F2`) com a textura `public/papel.png` e uma sombra suave perto da lombada (esquerda). **Tinta** `#1B1A1F`. **Cinza** `#625D66` (classe, glosa, abonação, rótulos). **Lápis** `#B4AEB6` (esboços). **Ameixa** `#5C2750`, a cor da capa e o único acento: palavras-título, cabeça do verbete, números das acepções, chips, risco, marca-texto (ameixa a 16 %), carimbo, abas, fita, o dado da vez no gráfico.
- **Gravura:** gráficos a nanquim com hachuras em 45°, pontos e cruzado; nada de cor chapada além da ameixa.
- **Textura, não efeito:** nada de brilho atrás da pessoa, contorno em letra, emoji, degradê colorido ou ícone genérico. Sombras só de papel sobre papel.
- **Som raro e tonal** (`public/sfx`): um tom grave quando a folha do frontispício sobe, um tom que desce a cada virada (três alturas que se alternam), um baque grave no carimbo, duas notas subindo na palavra certa, um acorde suave na fita. No mínimo 0,45 s entre dois sons. Nada de ruído de papel, clique agudo ou sino.

## O que pode mudar por vídeo

- Textos, tempos e a escolha dos blocos (é o trabalho do plano).
- O lugar de um bloco (`layout`: página ou frontispício, lado do quadro).
- Rótulos do cartão, texto do carimbo, chips de idioma, letreiro da abertura.
- `marca`, `sfx: false`, `"legenda": true` em momentos específicos, `caixas` para o enquadramento.
- O recorte (9:16, 3:4), escolhido no `cortar.mjs`.

## O que não mudar sem o usuário pedir

- Cores e fontes. Se o usuário pedir a cor da marca dele, troque **só** a `ameixa` (e `ameixaVeu`/`ameixaClara`, os tons dela) em `src/tema.ts` por um tom escuro e saturado de "capa de livro" (vinho, verde-garrafa, azul-tinta), que leia bem sobre o papel com texto claro por cima. Papel e tinta seguram a identidade.
- A página com cabeçalho, colunas e fio; a virada de página; o cartão que gira; o frontispício.
- A pessoa mudando de lugar a cada página.
- Não adicione fotos de banco, bandeiras, emojis, transições de flash ou tremidas. Não invente sentido, classe, pronúncia ou vizinho: o que não for certo fica de fora.

## Se precisar de algo que o modelo não tem

- **Um desenho novo** (uma figura para um verbete): crie um componente em `src/componentes/Figuras.tsx` que desenha num `viewBox` 400×400 com silhueta de tinta (cor do traço vem por `cor`), mostre o desenho inteiro a lápis antes do `em` e faça a tinta entrar por partes (traços com `strokeDashoffset`); registre em `FIGURAS` e acrescente o nome ao tipo `Figura` em `src/plano.ts`. Tem que ser legível em cada quadro.
- **Um bloco novo**: desenhe dentro de uma região (`Regiao`: a área de conteúdo da página ou da folha do frontispício), como os de `src/componentes/Blocos.tsx`: texto medido com `encaixar` (`src/medida.ts`) e desenhado com `LinhasFaladas` (`src/componentes/Texto.tsx`), esboço a lápis antes de cada `em`, uma ameixa só para o que é a resposta. Registre o tipo em `src/plano.ts`, o desenho em `CorpoDoBloco` (`src/componentes/Paginas.tsx`) e consulte a skill do Remotion para as regras de animação.
