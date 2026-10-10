# O estilo Currículo

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é parecer uma revisão de verdade, feita na frente de quem assiste: uma folha limpa sobre a mesa, uma caneta que só marca o que a pessoa diz, no instante em que diz, e a pessoa presente o tempo todo como o bilhete adesivo que guia a correção. Tudo é papel, tinta e caneta; nada de interface, ícone de app ou cartão genérico. Funciona com qualquer assunto porque qualquer assunto pode virar um documento revisado: uma análise, um plano, um diagnóstico, uma lista de erros, uma regra.

## Os cinco pilares

### 1. Dinâmica do motion

- **Lápis → tinta.** Toda linha da folha nasce a lápis (`#BAC0C8`) e ganha tinta palavra por palavra quando é dita (0,2 s por palavra). Seções que ainda vão demorar mais de ~3 s aparecem só como barras a lápis (o esboço do documento): nada de texto legível antes da hora, nunca uma caixa vazia.
- **A caneta age na palavra.** Visto, círculo, sublinhado, risco, chave, seta, X, caixa, traço de gráfico e nota à mão acontecem no `em` da palavra, num gesto só que acelera e freia (curva de mão). Uma marca por gesto.
- **Números e gráficos se fazem na fala.** O número conta de 0 até o valor em ~1 s e a caneta circula; barras sobem, a linha se desenha ponto a ponto, a fatia da pizza varre, a curva de tendência corre com a seta no fim.
- **A câmera nunca para.** Enquanto um momento dura, a folha se aproxima 3,5 % em volta do foco; entre seções, a câmera anda pela folha.
- **Trocas cruzadas.** A pessoa e a folha mudam de lugar juntas em 0,6 s, começando em cima do corte. Os cartões de tela cheia saem 0,3 s antes da troca e entram 0,4 s depois do começo dela (já com a pessoa grande): nunca um cartão sobre a folha, nunca um quadro vazio, nunca duas páginas de texto uma sobre a outra.
- **Sem quique, sem elástico.** Entra decidido e assenta; inclinações pequenas só nos papéis (bilhete −1,2°, cartões ±1°, leque).

### 2. Organização e hierarquia

- **Uma folha só que guarda as marcas.** Cada momento que acontece na folha vira uma seção, na ordem da fala, de cima para baixo. O que a caneta fez continua lá.
- **A seção da vez manda.** Na margem, a seta de caneta do bilhete aponta para ela; embaixo e em cima, a folha se aproxima e o resto fica a meio-tom (60 %).
- **Ordem de tamanho:** número grande (até 156 px) > título do documento (64 px) > termo, pergunta, título de cartão (52–96 px) > linhas da folha (42 px, até 34) > notas à mão (44 px, até 30) > títulos de seção em caixa alta (30 px, até 24).
- **A largura do texto é fixa** (548 px da folha): o texto termina antes da faixa do bilhete da margem. O texto quebra em até 2 ou 3 linhas e diminui até o mínimo; palavra comprida demais em rótulo de gráfico ganha hífen.

### 3. Tipografia

- **Literata** (serifa do documento): título da folha 700, linhas 400–600, termos e perguntas 700, números 700 com algarismos de largura igual.
- **Inclusive Sans**: títulos de seção e rótulos em caixa alta com espaçamento 0,14–0,16 em, aba do bilhete, legenda.
- **Playpen Sans** (a letra da caneta): notas, significados, valores de gráfico, "ilustrativo", chamada final.
- Todas com I maiúsculo diferente de l e 1. Nenhuma condensada, nenhum espaçamento negativo. Nada abaixo de 30 px na tela (na folha ampliada, os rótulos de 22–24 px viram 31–34 px).
- O texto é medido com a própria fonte no navegador do render (`src/medida.ts`), depois que as fontes carregaram.

### 4. Moldura da pessoa

- **Um bilhete adesivo de papel**, não um balão de interface: papel `#FFFDF6` um tom mais quente que a folha, cantos retos, sombra que enverga na base, aba vermelha com o nome saindo por cima, contagem "2 de 3" escrita à mão (quando há `erro`). O vídeo dentro dele é sempre o próprio vídeo reenquadrado, com o rosto seguido quadro a quadro; nada é recortado do fundo.
- **Quatro lugares** (o tipo do momento decide): tela cheia (abertura, destaque, fechamento; cartões abaixo do queixo); margem direita, 420 px, colado na borda da folha, com seta de caneta até a seção (lista, passos, definição, frase, marcar, riscar, páginas); embaixo, 708 px, com a folha ampliada em cima (número, comparação, gráfico, reescrita); em cima, 992 px, com a folha embaixo (pergunta, cronômetro).
- Nunca uma coluna vertical estreita; cabeça inteira nos bilhetes; nada desenha por cima do rosto.
- Erros já revisados (com `erro`) viram bilhetes pequenos no alto da margem, com o avatar da pessoa, o resumo e um visto.

### 5. Cores, textura e som

- **Cinco tons e uma caneta:** mesa `#D3D8DE`, papel `#FFFFFF`, bilhete `#FFFDF6`, tinta `#1C2129`, lápis `#BAC0C8`, e o vermelho da caneta `#D9352A` (com `#FBE3E0` só de fundo de barra de gráfico). O vermelho é a única ênfase: problema, alerta, destaque, gráfico, tudo é caneta. Fatias de pizza usam o mesmo vermelho em transparências diferentes.
- **Textura de papel:** sombra de papel sobre a mesa (não é brilho), bilhete que enverga. Nada de gradiente colorido, glow, contorno em letras, emoji ou marca-texto.
- **Som raro e tonal:** um tom grave quando a folha chega; uma nota curta na marca principal de cada momento (sobe de altura: 1, 2, 3); duas notas que resolvem quando uma troca é aceita ou um lado vence; um tom grave quando o cronômetro fecha; duas notas no fechamento. Nunca dois sons a menos de 0,45 s. Nada de ruído branco, "risco de caneta", clique agudo ou sino.

## Medidas (quadro 1080 × 1920)

- Interface do app: nada importante acima de 150 px nem abaixo de 1560 px.
- Folha: 720 px de largura, margem de 48 px, texto em 548 px; em leitura, escala 1 (margem), 1,15 (pergunta) ou até 1,4 (embaixo).
- Bilhete da margem: x 644, 420 × 534 px. Bilhete de baixo: x 186, y 950, 708 × 570 px. Bilhete de cima: x 44, y 172, 992 × 642 px.
- Cartões de tela cheia: a faixa `zona` que o `cortar.mjs` calcula (abaixo do queixo).
- Legenda: tira de papel de 46 px, abaixo do queixo, só nos trechos sem momento.

## O que pode mudar por vídeo

- Textos, tempos e a escolha dos blocos (é o trabalho do plano).
- `marca` e `documento` (o título do assunto, a linha de baixo, as seções extras).
- O enquadramento da pessoa em cada lugar (`caixas`), se a gravação pedir.
- `sfx: false`, se o usuário não quiser sons.

## O que não mudar sem o usuário pedir

- Cores e fontes. Se o usuário pedir a cor da marca dele, troque **só** o `vermelho` (e o `vermelhoClaro`) em `src/tema.ts` por um tom escuro e saturado que leia bem sobre o branco e tenha cara de caneta; mesa, papel, tinta e lápis seguram a identidade.
- A regra de lápis → tinta e de a caneta agir na palavra dita.
- A folha única que guarda as marcas, e os quatro lugares da pessoa.
- Não adicione fotos, logotipos, emojis, marca-texto colorido, brilho atrás da pessoa, contorno em letras, balões de interface, ícones de app, transições de flash ou tremidas. Não ponha dados de contato nem nome de pessoa real na folha. Não invente números.

## Se precisar de algo que o modelo não tem

- **Uma marca de caneta nova:** desenhe o caminho em `src/anim.tsx` (como `caminhoChave` ou `caminhoSeta`) e desenhe com `Traco` (o progresso vem de `prog(t, em, dur, gesto)`).
- **Uma seção nova na folha:** monte a geometria em `montarFolha` (`src/documento.ts`, medindo o texto com `montarLinhas`/`encaixar`), desenhe em `src/componentes/Secoes.tsx` e registre em `SECOES`; decida o lugar da pessoa em `lugarDoMomento` e a vista da folha em `vistaE_ancora` (`src/cena.ts`); acrescente o tipo em `src/plano.ts`.
- **Um cartão de tela cheia novo:** siga `Destaque.tsx` (entra 0,4 s depois do `de`, sai 0,3 s antes do fim).
- Consulte a skill do Remotion para as regras de animação.
