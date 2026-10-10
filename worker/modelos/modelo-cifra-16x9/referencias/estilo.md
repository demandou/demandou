# O estilo Cifra (versão deitada, 16:9)

O sistema abaixo é o do vertical e vale inteiro no quadro deitado: a mesma fonte, as mesmas cores, o mesmo motion, os mesmos sons. As medidas do 16:9 e a composição da aula 9 do curso (a pessoa em tela cheia como base; nos blocos, uma moldura à direita e a arte no quadro à esquerda) estão em "Medidas (quadro deitado 1920 × 1080)", no fim.

Leia antes de alterar qualquer componente, cor ou fonte do template. O valor deste modelo é a fala virar uma aula de música desenhada no tempo certo; quase toda "melhoria" que adiciona enfeite piora o resultado.

O estilo vale para qualquer assunto: música, cripto, direito, saúde, carreira, vendas, histórias. O que muda de um vídeo para outro é o conteúdo dos blocos, nunca a linguagem visual abaixo.

## A ideia

Uma aula bem desenhada. A pessoa é o professor numa janela; o resto da tela é um palco escuro onde o que ela diz aparece com as peças de uma aula de violão: **cordas** que vibram quando algo soa, **bolinhas de dedo** que caem na casa, o **braço** do violão, a **linha de compassos** com o sinal de repetição, o **metrônomo** de pêndulo, as **setas da batida**, a **folha de cifra** em papel marfim na estante, o **○** (corda que soa) e o **×** (corda que não toca), a **palheta**. Tudo nasce a lápis e ganha tinta no instante em que é falado: o vídeo inteiro tem o ritmo da fala.

## 1. Dinâmica do motion

- **Lápis → tinta.** Antes de ser dito: texto apagado (lápis, 30–46%), traço tracejado, bolinha pontilhada, número zerado. No `em`: a palavra ganha tinta e sobe um pouco (0,3 s); terminada a entrada, ela é desenhada simples (uma camada só).
- **Movimento com significado**: as cordas vibram quando algo soa (decaem em ~0,5 s; abafadas param em 0,1 s); a bolinha de dedo cai na casa; o número conta (1,1 s) enquanto a bolinha sobe o braço; o pêndulo bate a cada passo ou batida e o peso desce quando o andamento acelera; a seta se enche no sentido do movimento; a faixa da letra enche como karaokê enquanto o item é dito; o traço de risco passa por cima das palavras.
- **A janela pulsa**: cresce 2% por inteiro e acende um anel azul a cada item, passo, dado, seta ou acorde. Leve, sem distorcer. Não é brilho: é um traço.
- **Trocas**: a pessoa muda de lugar em 0,55 s no `de`. Saindo do quadro cheio, a pessoa encolhe para a moldura da direita e a arte nova entra presa à borda esquerda da moldura que se move: o espaço liberado já mostra a arte. Entre duas molduras, a arte velha some em 0,1 s e só então a nova aparece, revelada pela moldura que se move. Voltando ao quadro cheio, a arte fica até ser coberta e o cartão entra ~0,3 s depois. Entre dois cartões, o novo espera o velho sumir. **Nunca dois textos um sobre o outro; nunca a pessoa solta num palco vazio.**
- **Nada parado mais de ~2,5 s**: sempre há uma palavra ganhando tinta, uma corda vibrando, uma faixa enchendo, o pêndulo balançando.
- Entra decidido e assenta: sem quique, sem elástico, sem giro, sem zoom de impacto.

## 2. Organização e hierarquia

- **Uma ideia por tela.** Um momento = um bloco.
- **O que soa agora é azul**; o que já soou é marfim; o que vem é lápis. Só existe um item azul por vez.
- **Molduras**: a arte ocupa o quadro à esquerda inteiro (de x 96 até a moldura, de y 96 a 948), centrada na altura; título em cima (64–84 px), itens com o mesmo corpo, detalhes menores e mais apagados (marfim 72% ou tinta 55% no papel).
- **Folha de cifra** (`topicos`, `definicao`, `cifra`): papel marfim de cantos 30 px, margem 52 px, título com traço embaixo, linhas com a faixa da letra; a folha tem a altura do conteúdo e fica no meio do espaço livre (nada de papel vazio).
- **Linha de compassos** (`passos`, `compasso` com textos): um compasso por linha, ‖: no começo e :‖ no fim, o número grande à esquerda (onde fica a cifra), uma linha a lápis separando, o texto à direita, a barrinha embaixo; o metrônomo e o contador na coluna ao lado da moldura do canto (entre os compassos e a pessoa).
- **Cartões de quadro cheio**: palco escuro a 92% com a pestana de marfim que se desenha no alto, no peito: na `zona` (abaixo do queixo), centrado no rosto, 1360 px de largura, até y 976 (ou até a legenda, quando ela está junto). O cartão é largo e baixo: o conteúdo vai em fileiras (o numeral ao lado do título, a fermata ao lado da pergunta, as opções lado a lado); o texto principal manda.
- Margens reservadas: 96 px nas laterais, nada acima de y 96 (o título do player) nem abaixo de y 984 (controles do player).

## 3. Tipografia

- **Uma família só: Schibsted Grotesk** (Google Fonts). Larga, sem nada condensado; o **I maiúsculo tem serifa** ("Iogurte", "IPTU", "Il1" não confundem).
- 900 em números grandes e termos; 800 em títulos, itens e cifras; 700 em rótulos e significados; 600 em detalhes. Espaçamento −0,02em nos títulos; caixa-alta espaçada (0,14em) só nos rótulos pequenos.
- Números sempre em pt-BR (83.000; 2,5; R$; US$; %), cada algarismo numa caixa de largura fixa (não dançam enquanto contam).
- **O texto é medido** (larguras reais da fonte, em `src/larguras.ts`) e diminui para caber em até 2 ou 3 linhas; nunca é cortado nem vaza.
- **Tamanhos** (os mesmos do vertical, no quadro de 1080 de altura): número 96–250; termo da definição 64–140; destaque 52–124; títulos 64–112; itens 32–66 (o maior que cabe); textos de cartão ≥ 40; rótulos em caixa-alta ≥ 30; cifras 58–72; números de dedo ≥ 40; legenda 46. **Nada abaixo de 30 px** (a não ser uma palavra única que não cabe na coluna, que encolhe sozinha).
- Nada de contorno nas letras, sombra ou fonte condensada.

## 4. Moldura da pessoa

- **Quadro cheio**: o vídeo deitado inteiro, como foi gravado (sem recorte vertical); em cada corte dentro de um trecho cheio, uma troca seca de 6% em volta do rosto disfarça o pulo.
- **Molduras** (px, 1920×1080; todas encostadas na margem direita; cantos de 36 px; traço de marfim de 3 px):
  - `topo` 652×560 em (1172, 96): rosto e ombros, a sala ao fundo; arte no quadro à esquerda;
  - `canto` 440×540 em (1384, 96): a coluna do metrônomo ao lado (360 px, em x 984), os compassos no quadro à esquerda;
  - `centro` 652×600 em (1172, 222): no meio da altura; arte à esquerda;
  - `estante` 652×520 em (1172, 348): embaixo; a folha à esquerda.
- Cada moldura reenquadra o vídeo com o rosto centrado e segue o rosto com ajuste suave: funciona com qualquer gravação, sem recortar a pessoa do fundo. A aproximação sai do tamanho do rosto medido (o rosto ocupa ~34% da largura da moldura larga, ~40% das do meio e de baixo, ~46% da do canto). A cabeça aparece inteira. Nunca cobre texto; nunca uma coluna vertical estreita ao lado.

## 5. Cores, textura e som

- **Três cores**: ébano `#14110F` → `#1E1A16` (o palco, um degradê quase imperceptível), marfim `#F3EBDD` (texto e traço), azul `#86C5EE` (o que soa agora; fundo azul a 16%). Cordas e trastes em marfim a 58%; lápis a 30–46%.
- **A folha de cifra**: papel `#F3EBDD`, tinta `#1B1714`, tinta suave 55%, lápis 22%, azul fundo `#2C6A9C` para o que soa agora.
- **Sem segunda cor de destaque**: o alerta e o "errado" são o × e a corda abafada, em marfim; o "certo" e o vencedor são o ○ azul.
- **Som de corda, baixo e raro**, uns 8 dB abaixo da voz, nunca dois a menos de 0,2 s: a nota de cada acorde; notas de uma escala (Sol pentatônica) subindo nos itens, opções, dados e lados; um toque de madeira grave em cada batida do metrônomo e em cada passo; uma palhetada abafada em cada seta, no destaque-chave e no veredito; um Sol grave na abertura e quando o número chega; um arpejo curto no botão do fechamento. Nada de ruído, clique agudo, sino, caixa registradora. Sem trilha.

## O que pode mudar por vídeo

- Textos, tempos, a escolha dos blocos e da assinatura (é o trabalho do plano).
- O lugar da pessoa num momento (`janela`), para variar quando dois blocos do mesmo lugar vêm seguidos.
- `marca` (nome e área). `sfx: false`, se o usuário não quiser sons.
- O recorte: o `modelo.json` pede 16:9; a gravação deitada entra inteira (gravação vertical vira uma faixa deitada em volta do rosto).

## O que não mudar sem o usuário pedir

- Cores e fonte. Se o usuário pedir a cor da marca dele, troque **só** o azul (`azul` e `azulFundo`, e o `azulTinta` da folha) em `src/tema.ts`; o ébano e o marfim seguram o estilo.
- O tamanho e a posição das molduras (`JANELAS` em `src/layout.ts`): cada uma foi medida para mostrar o rosto inteiro e deixar a arte legível no quadro à esquerda.
- A regra do lápis (nada entra pronto antes de ser dito) e a regra do azul (só o que soa agora).
- A medição do texto (`src/medida.ts`, `src/larguras.ts`).
- Não adicione emoji, figurinhas, brilho atrás da pessoa, texto com contorno, notas musicais voando, partitura de enfeite, barra de progresso, gradientes coloridos ou transições de efeito entre cortes.

## Se precisar de algo que o modelo não tem

- **Uma forma nova de informação**: quase sempre ela cabe num dos 11 blocos ou numa das quatro assinaturas (veja a tabela do SKILL.md). Se não couber, crie um componente irmão em `src/componentes/` com as mesmas peças (cordas de `Cordas.tsx`, ○ e ×, bolinhas de dedo, papel de `Folha.tsx`, compassos de `LinhaDeTextos.tsx`, texto de `src/texto.tsx` medido com `src/medida.ts`), um lugar para a pessoa (`janelaPadrao` em `src/layout.ts`), a arte no quadro à esquerda (`areaDe`), lápis → tinta no `em` de cada palavra e as cores de `tema.ts`. Acrescente o tipo em `src/plano.ts` e consulte a skill do Remotion para as regras de animação.
- **Um acorde novo no dicionário**: acrescente em `DICIONARIO` (`src/acordes.ts`) com `forma` e `dedos` conferidos corda por corda.

## Medidas (quadro deitado 1920 × 1080)

| O quê | Onde |
|---|---|
| margens seguras (YouTube) | 96 px nas laterais; nada acima de y 96 nem abaixo de y 984 (controles do player) |
| quadro (a arte dos blocos em moldura) | do x 96 até 48 px antes da moldura (~1030 px; ~850 px no `canto`), de y 96 a 948 |
| molduras (a pessoa) | à direita: `topo` 652×560 em (1172, 96) · `canto` 440×540 em (1384, 96) · `centro` 652×600 em (1172, 222) · `estante` 652×520 em (1172, 348) |
| coluna do metrônomo (`canto`) | 360 px em x 984, entre os compassos e a moldura |
| cartão de quadro cheio | no peito: da `zona.topo` (60 px abaixo do queixo) até y 976, 1360 px, centrado no rosto; no mínimo 270 px de altura |
| legenda | terço de baixo, y 900, 46 px, até ~42 caracteres por linha; com a legenda junto, a arte e o cartão terminam em y 884 |

### A composição da aula 9 do curso (editar uma aula horizontal)

- Tela cheia como base; o bloco abre quando acrescenta clareza à fala e a pessoa volta à tela cheia ao fim da ideia.
- A pessoa numa moldura à direita, com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto); a explicação no quadro à esquerda, entrando na ordem do raciocínio, com tempo de leitura.
- Sem excesso de cor nem informação simultânea: um bloco, uma ideia, o azul só no que soa agora.
- Cortes nas pausas excessivas e nos erros, mantendo a respiração natural (o `cortar.mjs` deste modelo só corta pausa acima de ~0,45 s).
