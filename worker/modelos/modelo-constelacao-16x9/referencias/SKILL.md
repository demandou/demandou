---
name: modelo-constelacao-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Constelação. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Constelação: o vídeo vira uma carta celeste desenhada; a pessoa entra numa ocular de telescópio redonda, na moldura da direita, que sobe e desce a cada ideia; cada coisa dita é uma estrela que acende e ganha nome, as ideias se ligam numa constelação e uma reta vermelha tracejada leva até o alvo, com um localizador vermelho sempre no que está sendo dito; a tela cheia é a base, com o texto no peito. Anil, branco e vermelho de lanterna, Spectral e Reddit Sans. Serve para qualquer assunto (o exemplo do modelo é astronomia, mas funciona com finanças, cripto, vendas, saúde, carreira, relacionamento, aulas e histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Constelação\", \"estilo carta celeste\", \"com constelação\" ou \"céu estrelado\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura redonda à direita, a carta à esquerda)."
---

# Modelo Constelação (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Esta é a Constelação no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, sons, a carta celeste, a íris, a luneta, o localizador, a ocular e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada (o vídeo deitado entra inteiro, sem recorte vertical), com legenda no terço de baixo. A carta abre **só quando acrescenta clareza** à fala e volta para a pessoa quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Na carta, a íris fecha em volta do rosto e leva a pessoa para a **ocular**, na coluna da direita (centro em x 1472), com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto, sem saltos). O bloco ocupa o **quadro** da esquerda (x 106 a 1100, y 116 a 880). A cada ideia a ocular sobe ou desce na coluna (`topo-direita`, `meio-direita`, `baixo-direita`) e o céu desliza; o título do bloco fica na coluna dela, embaixo ou em cima.
- **Tela cheia em fileiras.** O texto de tela cheia fica no peito, centralizado, numa faixa larga e baixa: de logo abaixo do queixo até ~y 968 (ou até a legenda). No lugar da pilha alta do vertical, as peças ficam lado a lado: o "?" e a estrela do destaque ao lado do texto, o número ao lado do desenho, o ícone do fechamento ao lado da chamada.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s. Bloco com menos de ~2,5 s não dá tempo de ler.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira uma carta do céu que se desenha enquanto a pessoa fala. Ela abre em tela cheia, com o título no peito; quando explica algo, o quadro se fecha como uma íris em volta do rosto, ela vira uma ocular de telescópio na moldura da direita e o lado esquerdo vira uma carta celeste: cada coisa dita é uma estrela que acende e ganha nome, as estrelas se ligam, uma reta vermelha leva ao alvo. No fim a íris se abre e ela fecha em tela cheia. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com astronomia (achar o Cruzeiro do Sul), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo nasce "a lápis" (estrela com círculo tracejado, linha pontilhada, texto apagado) e ganha tinta na palavra dita: a estrela acende com uma onda curta, a linha corre de uma estrela à outra, o nome se escreve palavra por palavra, a reta tracejada vermelha anda até o alvo. Um localizador vermelho (círculo fino com quatro marcas) vai sempre ao que está sendo dito. As trocas são de telescópio: a íris fecha em volta do rosto e leva a pessoa para a ocular; entre dois blocos da carta, o céu inteiro desliza (a luneta é reapontada) e a ocular sobe ou desce na moldura da direita. Movimento que sai devagar e chega devagar, sem quique.
- **Organização e hierarquia:** uma ideia por tela. Na carta, a pessoa fica na ocular da moldura da direita e o conteúdo ocupa o quadro da esquerda: estrelas à esquerda com os nomes ao lado (listas, passos, lados de uma comparação), figuras no meio com os nomes dos dois lados (a constelação), gráficos feitos de estrelas. O título do bloco (itálico, sublinhado, como o nome de uma constelação) fica ao lado da ocular, na coluna dela (embaixo ou em cima), ou no alto do quadro quando a ocular está no meio. O que está sendo dito é grande e aceso; o resto fica a lápis ou menor. Em tela cheia, o texto fica no peito, centralizado, numa faixa larga e baixa, e o trecho de ênfase ganha linha própria em itálico maior.
- **Tipografia:** Spectral (serifada de atlas) para títulos, nomes, itens e números; itálico para nomes de estrelas, figuras e ênfase. Reddit Sans em caixa-alta espaçada para letreiros (rótulos, unidades, "ilustrativo") e para a legenda. Títulos de 60 a 136 px, itens de 44 a 92 px, nada abaixo de 30 px; o texto é medido e diminui para caber, nunca vaza.
- **Moldura da pessoa:** dois lugares. Tela cheia (como foi gravada, a base do vídeo deitado) para abrir, fechar, para as frases fortes e para os respiros; ou a **ocular**, uma janela redonda escura com anel graduado que gira um pouco a cada troca e a assinatura (nome · área) correndo no arco. Nos blocos de carta ela fica sempre na moldura da direita (aula 9) e alterna a altura: grande no meio, ou no alto ou embaixo, com o título ao lado. O rosto fica centralizado na ocular e é seguido quadro a quadro; nada cobre a ocular.
- **Cores, textura e som:** céu anil quase preto com grade de coordenadas, Via Láctea pontilhada e estrelinhas que cintilam; branco quente para estrelas e texto; azul-gelo para as linhas da constelação; **um** vermelho de lanterna só para o que guia o olho (localizador, reta até o alvo, cruz do alvo, alerta, risco). Sons tonais e raros: sopro grave na íris, uma nota por estrela que acende (subindo), tom grave quando a reta chega ao alvo, duas notas descendo no alerta.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Finanças"): viram a assinatura no arco da ocular e no fechamento. Sem resposta, siga sem assinatura.

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

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (sem como ouvir, meça o volume com `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`: perto de −60 dB é silêncio).

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre frases viram cortes, e é nos cortes que o layout muda** (a íris fecha ou abre, a ocular troca de canto): o movimento esconde o pulo. Mantenha a proposta do `preparar`.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.415
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para a íris, a ocular e a faixa do peito (`zona.topo` fica logo abaixo do queixo). Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: a ocular acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias. Em tela cheia: a cruz deve cair no rosto (a linha vertical fina é o centro do quadro) e a caixa azul tracejada (texto no peito) deve começar abaixo do queixo. Nas cartas: o círculo verde é a ocular (a moldura da direita), o traço verde marca a altura do rosto dentro dela e a linha verde vertical separa a coluna da moldura do quadro; a caixa laranja é o quadro do conteúdo e a roxa, o lugar do título. A caixa amarela é a legenda (terço de baixo); nada importante fora das linhas rosa (margens de 96 px) nem abaixo da linha vermelha (controles do player). Se a cruz não cair no rosto, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`constelacao`, ou a `carta` de céu real quando o vídeo é sobre o céu) entra pelo menos uma vez**, mesmo que o assunto não tenha nada de céu: veja "A assinatura em qualquer assunto".

Alterne os dois lugares: depois de um ou dois blocos de carta, uma frase forte em tela cheia ou um respiro só com a pessoa e a legenda, e vice-versa. No vídeo completo a tela cheia é a base (aula 9): a carta entra onde ajuda a entender, não em toda frase. Abra e feche em tela cheia (`abertura` ou `numero` com `tela: "cheia"` no começo, `cta` no fim).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, posições da ocular e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes` (e `ceu`, só para céu real). Cada item, estrela, lado ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento ou com `"legenda": true`).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "Alfa Centauri": "Alfa Centauro" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o texto cabe, sem bater em outro texto, na ocular ou no anel? Nada do quadro passa para a coluna da ocular? Nada abaixo de y 984 (controles do player)?
- cada estrela acende e cada nome se escreve quando a palavra é dita?
- o rosto aparece na ocular, sem nada por cima?
- na constelação: os nomes ficam ao lado das estrelas certas, a reta chega ao alvo e o nome do alvo cabe?
- nada parado mais de ~2,5 s?

Confira também as trocas com tempos soltos (`node scripts/stills.mjs 4.9 5.0 5.1 5.2`), a cada 0,1 s em volta de cada `de` e `ate`: a carta já aparece (a lápis) enquanto a íris fecha; quando ela abre, a carta só sai quando o círculo cobre a tela; entre dois blocos de carta, o que sai e o que entra deslizam juntos com o céu e a ocular sobe ou desce na moldura da direita; nunca dois textos de tela cheia ao mesmo tempo. Corrija o plano e repita.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-constelacao.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curva de tendência sem números, etiqueta "ilustrativo");
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma estrela de céu real cuja posição você deu à mão).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | tela cheia: letreiro entre filetes, título no peito que se acende palavra por palavra, o `destaque` em linha própria, itálico maior; uma miniatura da constelação do vídeo se liga num canto de cima, longe da cabeça (num disco de carta, se o fundo não é o céu) |
| lista | `topicos` | carta: cada item é uma estrela (de brilhos diferentes, como um aglomerado) com o nome ao lado; acende na palavra, e o localizador vai de uma a outra |
| passos | `passos` | carta: estrelas numeradas que se ligam por uma linha azul-gelo, uma a uma, na ordem dita; a última ganha raios |
| número | `numero` | carta (ou peito, com `tela: "cheia"`): o número grande contando em pt-BR, o rótulo em letreiro; embaixo (no peito, ao lado, numa fileira), uma régua graduada com a reta vermelha correndo até a cruz, um anel graduado que se enche (%) ou estrelas de quatro pontas que acendem uma a uma (1 a 12) |
| comparação | `comparacao` | carta: duas estrelas grandes, uma sobre a outra, cada uma com letreiro e texto; × entre elas (`contra`), reta vermelha tracejada com seta (`antes-depois`), ou o errado riscado em vermelho e o certo com raios e visto (`errado-certo`) |
| gráfico | `grafico` | carta: barras = hastes com uma estrela no topo; linha = estrelas ligadas como constelação; pizza = anel graduado com arcos; sem números ditos, uma trajetória de estrelas que sobe, cai ou oscila, com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | tela cheia: a palavra grande no peito; `alerta` em vermelho com o localizador desenhado ao lado; `chave` em branco com estrela de quatro pontas ao lado e sublinhado |
| definição | `definicao` | carta: o termo é o nome de uma estrela brilhante (itálico grande, sublinhado); no significado, a reta vermelha desce da estrela até uma cruz e o significado se escreve ao lado |
| frase | `frase` | tela cheia: a frase no peito, palavra por palavra; `destaque` em itálico maior, `risco` riscado em vermelho enquanto é dito |
| pergunta | `pergunta` | tela cheia: um "?" num anel que se desenha, ao lado da pergunta, e as `opcoes` como selos lado a lado que acendem cada um na sua palavra |
| fechamento | `cta` | tela cheia: ícone a traço que se preenche (salvar, seguir, comentar, link) ao lado da chamada, o `destaque` sublinhado, a assinatura entre filetes |
| **assinatura** | `constelacao` | carta: cada ideia é uma estrela que acende e ganha nome; elas se ligam numa figura (triângulo, cruz, W, concha) ou num caminho; a figura ganha nome; uma reta vermelha tracejada sai dela até o `alvo`, com cruz e rosa dos ventos |
| **assinatura (céu real)** | `carta` | carta celeste de verdade, com estrelas do catálogo: acender, ligar, destacar, prolongar até o polo, nomear, apontar (para vídeos sobre o céu) |

## A assinatura em qualquer assunto

A constelação mostra **"coisas soltas que, ligadas, formam uma figura, e a figura aponta para algum lugar"**: motivos que levam a um resultado, hábitos que formam uma rotina, sinais que apontam um diagnóstico, etapas que levam a uma meta. As estrelas são as ideias ditas; o `alvo` é aonde elas levam (o problema, o objetivo, a consequência), sempre com palavras da fala. Quando as ideias são uma sequência (primeiro, depois, por fim), use `"ligar": "caminho"`.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `constelacao` com `titulo: "Mesmo na alta"`; estrelas "Compra por impulso" (em "compra"), "Moeda sem critério" (em "moeda"), "Risco que não entende" (em "risco"); `alvo: { "texto": "Tem gente que perde", "em": <"tem"> }`. A cruz e o nome do alvo entram quando ele é dito; as três estrelas acendem e se ligam num triângulo; no fim, a reta vermelha sai da figura e chega ao alvo.
2. **Saúde (sono).** "Para dormir melhor: desliga a tela uma hora antes, deixa o quarto escuro e acorda sempre no mesmo horário. É isso que regula o seu relógio."
   `constelacao` com `titulo: "Dormir melhor"`; estrelas "Tela desligada", "Quarto escuro", "Mesmo horário"; `alvo: { "texto": "Relógio regulado", "em": <"regula"> }`.
3. **Bem distante: história pessoal.** "O que salvou meu casamento foi conversar sem celular, pedir desculpa de verdade, dividir a casa e voltar a rir junto."
   `constelacao` com quatro estrelas (a figura da cruz): "Conversar sem celular", "Pedir desculpa", "Dividir a casa", "Rir junto", e `titulo: "O que salvou"`. Sem um alvo dito, não ponha `alvo`: a figura fecha sozinha com o nome.

Outros usos: os três pilares de um método (triângulo), cinco passos de uma rotina (`"ligar": "caminho"`, o W), seis hábitos de um time (a concha), "primeiro pergunta, depois mostra, só então fala o preço" (caminho até o alvo "com uma condição"). Se a fala é uma lista solta sem "aonde leva", use `topicos`; se é uma sequência curta sem metáfora, `passos`; a constelação é para quando as ideias **formam algo juntas**. Em vídeo sobre o céu de verdade, a assinatura é a `carta` com estrelas reais (`references/plano.md`, seção 7).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. O `alvo` de uma constelação é algo **dito** (não conclua pela pessoa).
- Número ilustrativo só onde o bloco permite (a curva de tendência do `grafico`), sempre com a etiqueta ILUSTRATIVO visível.
- Em céu real, nada de estrela, distância, brilho ou direção inventados; se a pessoa disser algo astronomicamente errado, avise o usuário em vez de desenhar o erro.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure na fala as ideias que formam algo juntas (motivos, hábitos, etapas, pilares) e use a `constelacao`; o alvo é o resultado dito.
- **Nome de estrela pequeno ou em três linhas**: o nome está comprido; use 1 a 4 palavras ("Compra por impulso", não "compra por impulso quando vê o preço subir").
- **Texto encostando na ocular**: use outra posição em `ocular` (veja `references/plano.md`) ou encurte o título.
- **Cabeça cortada ou rosto pequeno na ocular**: ajuste `ocular.zoom` (0,3 a 0,7) e `ocular.alturaRosto` (0,35 a 0,55) no plano. Gravação muito perto da câmera já tem o alto da cabeça fora do quadro: é normal.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
