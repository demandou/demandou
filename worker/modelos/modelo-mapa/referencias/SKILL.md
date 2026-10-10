---
name: modelo-mapa
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Mapa: a tela vira um papel pontilhado onde um mapa de ideias cresce no ritmo da fala. Cada ideia é uma estação do papel e a câmera desliza de uma para outra; a pessoa é um cartão ligado ao conteúdo por um ramo de tinta; toda palavra já está a lápis e ganha tinta quando é dita, com um único marca-texto amarelo no que importa. Serve para qualquer assunto (o exemplo do modelo é estudos, mas funciona com finanças, cripto, saúde, música, vendas, carreira, histórias): a IA traduz a fala para os blocos do estilo e usa o mapa mental como assinatura. Use sempre que o usuário pedir para editar \"no modelo Mapa\", \"estilo mapa mental\", \"estilo caderno\" ou \"com marca-texto\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Mapa

O vídeo vira um caderno que ganha vida enquanto a pessoa explica: um papel branco-lilás com grade de pontos onde cresce um mapa de ideias. A pessoa abre em quadro cheio e recua para um **cartão** — um nó do mapa, ligado ao conteúdo por um ramo de tinta. Cada momento do vídeo é uma **estação** do papel; na troca, a câmera desliza até a próxima estação e o cartão da pessoa muda de lugar e de tamanho no mesmo movimento. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em estações, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com estudos (revisão espaçada), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo se **escreve** na fala. Cada palavra, nó, ramo, disco, caixinha e trilho já está no papel a lápis (cinza claro, tracejado); no instante em que é dito, a tinta passa por cima da esquerda para a direita e o marca-texto chega logo depois no que importa. Ramos se desenham do nó para fora, números contam e a caneta os circula, o alfinete crava, flashcards viram. A única transição é a **câmera deslizando pelo papel** (0,64 s, macia nas duas pontas), sempre com duas estações à vista no meio do deslize — nunca corte seco, zoom de impacto ou flash.
- **Organização e hierarquia:** uma ideia por estação, lida como um mapa: um nó principal (o termo, o "?", o número circulado, o nó central) e o que sai dele por ramos (itens, passos, lados, significados). O título da estação é grande em serifa; nós, rótulos e detalhes, menores. A ordem das estações é a ordem do raciocínio, descendo em zigue-zague pelo papel (direita → baixo → esquerda → baixo).
- **Tipografia:** **Bitter** 700–800 (serifa de apostila) em títulos, frases, números e respostas; **Readex Pro** 500–700 nos nós, rótulos, opções, legenda e letreiros. Letreiros em caixa-alta espaçada a 32 px. Títulos de 64 a 170 px, nós de 34 a 72 px, nada abaixo de 30 px; o template mede a fonte e reduz para caber, nunca vaza.
- **Moldura da pessoa:** abre em quadro cheio com o rosto na linha do centro e recua para um **cartão** branco de cantos redondos (sombra curta, nunca brilho). Em cada estação o cartão tem um lugar: grande em cima (abertura, mapa de abertura, fechamento), pequeno num canto de cima (listas, passos, números, gráficos, perguntas, o mapa do meio do vídeo), médio no alto, no centro (destaque). Um ramo de tinta sai do cartão e chega no nó principal da estação. O rosto é seguido quadro a quadro; gravação de selfie ajusta o zoom sozinha para a cabeça caber.
- **Cores, textura e som:** papel #F2F1F5 com pontos #CDC9DC presos ao papel; tinta índigo #1E1A3C; lápis (três cinzas lilás) para o que ainda vai ser dito, o que foi esquecido e o que é secundário; **marca-texto amarelo #F6E24A, o único acento** (o que importa, o vencedor, a resposta, o item da vez). Alerta = bloco cheio de tinta com texto branco. Sons tonais e raros: um "vum" grave no deslize, notas curtas nos ramos e itens, notas subindo nos passos, um toque quando o número para, um toque surdo no alfinete, um acorde no fim.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Profa. Ana" / "Redação ENEM"): vão na etiqueta do cartão no fechamento. Sem resposta, siga sem nome.

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela.

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Um item curto `[sem fala, sai]` no meio do vídeo pode ser uma palavra curta ("Dó", "sete"): meça o volume antes de aceitar (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`; perto de −60 dB é silêncio, −30 dB ou mais alto é fala).

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo, **as pausas entre frases viram cortes, e é nelas que a câmera desliza para a próxima estação** (o movimento esconde o pulo do corte). Mantenha a proposta do `preparar`; pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.505 --rosto-y 0.31 --queixo-y 0.43
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa vive num cartão que muda de tamanho); gravação horizontal vira 3:4. Não precisa passar `--recorte`. O `zona` que o script calcula não é usada por este modelo. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: o cartão da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Gravação bem perto da câmera (selfie) é normal: o aviso de "topo da cabeça cortado" vale só para o quadro cheio; nos cartões, o zoom desce sozinho para a cabeça caber.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias (em três estações diferentes). O retângulo roxo tracejado é o cartão da pessoa naquele instante e a cruz azul marca onde o rosto deve cair dentro dele: **a cruz tem que cair entre os olhos e o nariz, e a cabeça tem que aparecer no cartão**. A linha vertical fina é o centro do quadro (onde fica o rosto na abertura em quadro cheio). A linha laranja é o topo seguro (abas do app); a vermelha de baixo e a vermelha vertical à direita marcam a interface do aplicativo (nada importante abaixo de 1520 px nem à direita de 960 px na metade de baixo). Se o rosto não estiver certo, refaça o passo 4; se só a cabeça cortar no cartão, use `retrato` no plano (veja "Quando algo dá errado").

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`mapa`, ou a `curva`) entra pelo menos uma vez**, mesmo que o assunto seja outro: veja "A assinatura em qualquer assunto".

Pense como quem desenha o raciocínio no caderno enquanto explica: cada estação é uma ideia, e a ordem das estações é a ordem do raciocínio. Alterne estações de cartão grande (abertura, destaque, fechamento) e de cartão pequeno (listas, números, gráficos).

### 7. Planejar os momentos

Leia `references/plano.md` (a gramática das estações, os campos de cada bloco, limites de texto, regras de tempo e um exemplo completo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, ramo, passo, lado, dado ou opção entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe e se lê (nada cortado, nada embaixo do cartão da pessoa)?
- a cabeça aparece no cartão, sem nada por cima do rosto?
- cada item, ramo, passo e número aparece na palavra certa? O número é o que a pessoa disse?
- nada parado mais de ~2,5 s?
- no meio dos deslizes (o `de` de cada momento, −0,1 e +0,2 s; `node scripts/stills.mjs 8.55 8.6 8.7 8.8`), as duas estações aparecem, cada uma com conteúdo legível — nenhum quadro só de papel?
- nada importante abaixo da linha da interface do app?

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-mapa.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (gráfico sem números ditos, a curva);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um texto que você enxugou).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | cartão grande da pessoa em cima; o título enorme se escreve embaixo, com marca-texto no `destaque`; um ramo desce do cartão até ele |
| lista | `topicos` | um tronco de tinta desce do cartão pequeno e cada item é um nó (pílula) que nasce dele na sua palavra; o item da vez fica com marca-texto; o título ao lado do cartão |
| passos | `passos` | discos numerados num caminho de pontos; a caneta risca o caminho até cada passo, o disco se enche de marca-texto e o texto se escreve ao lado |
| número | `numero` | o rótulo ao lado do cartão; o número conta em pt-BR, a caneta o circula e o marca-texto passa por baixo; uma fileira de pontos é riscada enquanto ele conta |
| comparação | `comparacao` | dois cartões de anotação ligados por × ou por uma seta; o vencedor ganha marca-texto e um visto; no errado-certo, o errado é riscado |
| gráfico | `grafico` | o cartão branco do gráfico: linha que a caneta liga ponto a ponto, barras sobre trilhos a lápis (a maior em marca-texto), pizza que se abre no mostrador; sem números, a forma (sobe, cai, oscila) com o selo "ilustrativo" |
| destaque | `destaque` | o cartão da pessoa no alto, no centro, e a palavra enorme embaixo, centrada, ligada a ele por um ramo; `chave` = marca-texto; `alerta` = bloco cheio de tinta com a palavra em branco e um selo "!" |
| definição | `definicao` | o termo é um nó que se enche de tinta; um ramo grosso desce até um cartão pautado que o alfinete crava quando o significado é dito |
| frase | `frase` | aspas grandes de tinta ao lado do cartão e a frase enorme embaixo; marca-texto no `destaque`, traço de tinta no `risco` |
| pergunta | `pergunta` | a caneta circula um "?" grande ao lado do cartão; a pergunta se escreve embaixo; as opções são caixinhas de caderno |
| fechamento | `cta` | cartão grande com a etiqueta de nome e um selo no canto (fita de salvar, "+", balão, elo) que se enche de marca-texto; a chamada embaixo |
| **assinatura** | `mapa` | o mapa mental: nó central cheio de tinta e ramos que nascem dele na fala; pode apagar (`esqueceEm`) ou fixar com marca-texto (`fixaEm`). Abrindo o vídeo, a pessoa grande em cima; no meio do vídeo, o mapa é o herói, grande, com a pessoa num cartão pequeno |
| **assinatura** | `curva` | queda e retomada: a caneta desenha algo caindo e cada ação dita o levanta de volta, sobre um calendário de pontos; sempre ilustrativa |
| ideia-chave | `titulo` | o título enorme como nó do mapa, com um ramo grosso vindo do nó de origem e pontos de intervalo embaixo |
| tempo / fração | `contador` | um mostrador de relógio: o número conta e o ponteiro varre a fatia em marca-texto |
| quanto rende | `barras` | barras de proporção sem números (a forte passa da borda) e um cartão de anotação com alfinete |
| perguntas e respostas | `cartoes` | flashcards que viram da pergunta para a resposta, com uma frase riscada no pé |

## A assinatura em qualquer assunto

O **`mapa`** mostra **várias coisas que saem de um ponto**: as causas de um problema, as partes de um todo, as opções de uma escolha, os ingredientes de um resultado. O nó central é o ponto; cada ramo nasce na palavra que o nomeia. `esqueceEm` apaga os ramos (perder, esquecer, abandonar) e `fixaEm` os grifa (escolher, fixar, dominar). A **`curva`** mostra **algo que cai com o tempo e volta a subir a cada ação**, com rótulos livres (`eixo`, `unidade`, `inicio`, `sem`, `com`).

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `mapa` com `centro: "Quem perde"`, `titulo: "Mesmo na alta, tem gente que perde"` e os ramos "Compra por impulso" (em "compra"), "Moeda sem critério" (em "moeda") e "Risco que não entende" (em "risco"). No meio do vídeo, o mapa ocupa a tela; o título se escreve ao lado do cartão da pessoa.
2. **Música.** "Com quatro acordes você toca centenas de músicas: Sol, Ré, Mi menor e Dó."
   `abertura` com a primeira frase; depois `mapa` com `centro: "4 acordes"` e um ramo por acorde, cada um no instante em que é dito.
3. **Saúde e rotina (curva).** "A sua energia cai ao longo da manhã; uma pausa de cinco minutos a cada hora traz ela de volta."
   `curva` com `eixo: "energia"`, `unidade: "hora"`, `unidades: "horas"`, `inicio: "início"`, `sem: "sem pausa"`, `com: "com pausa"` e um marco por pausa dita (`revisoes: [{ "dia": 1, "em": … }, { "dia": 2, "em": … }]`).
4. **Bem distante: relacionamento.** "O que acaba com um casal não é uma briga: é a falta de conversa, o celular na mesa e o carinho que vai sumindo."
   `mapa` com `centro: "O casal"` e os ramos "Falta de conversa", "Celular na mesa" e "Carinho sumindo", com `esqueceEm` na palavra "sumindo": os ramos se apagam um por um e o nó central perde a tinta — a imagem do que se perde.

Outros usos: os sintomas de uma doença em volta do nome dela; as partes de um contrato; os ingredientes de uma receita; as áreas de uma carreira; os personagens de uma história. Se a fala tem só uma sequência, use `passos`; se tem um ponto de onde saem coisas, use o `mapa`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Um número que não foi dito não entra na tela.
- Ilustrativo só onde o bloco permite (o `grafico` sem `dados`, a `curva`, as `barras` de proporção, o `numero` com `ilustrativo`), sempre com o selo visível.
- Flashcards (`cartoes`) com perguntas que resumem o próprio vídeo não inventam nada; perguntas de conteúdo só com fatos de que você tem certeza.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta, a assinatura) e escolha um bloco para ele na tabela acima. Não use `--forcar`.
- **"A assinatura não cabe no assunto"**: procure na fala um ponto de onde saem coisas (causas, partes, opções) e use o `mapa`; ou algo que cai e volta com uma ação repetida, e use a `curva` com rótulos do assunto.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Cabeça cortada no cartão**: ponha `"retrato": { "zoom": 0.85 }` no plano (mostra mais; o zoom nunca fica abaixo do que cobre o cartão) ou `"ancoraY"` (0,4 sobe o rosto, 0,55 desce) e confira com `--guias`.
- **Uma estação aparece vazia no meio do deslize**: o momento ficou curto demais (menos de ~1,5 s); junte com o vizinho.
- **A coluna ao lado do cartão pequeno ficou vazia**: `topicos`, `passos`, `grafico`, `comparacao` e o `mapa` do meio do vídeo usam ali o `titulo`. Dê um título curto com as palavras da fala.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
