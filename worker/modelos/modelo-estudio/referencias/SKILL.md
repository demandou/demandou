---
name: modelo-estudio
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Estúdio: um corte de podcast bem produzido, num estúdio escuro com um rosa elétrico de luz de \"no ar\". A pessoa fica num quadro de câmera que muda de lugar a cada ideia e troca de enquadramento (aberto, close); a onda da voz de verdade corre embaixo; a régua do episódio com capítulos fica no alto; e os textos acendem palavra por palavra em cartões de entrevista, pauta, números, gráficos e num player no fim. Serve para qualquer assunto (o exemplo é um podcast sobre carreira, mas funciona com cripto, saúde, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Estúdio\", \"estilo podcast\", \"corte de podcast\" ou \"corte de live\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Estúdio

O vídeo vira o corte de um podcast bem produzido. A pessoa aparece num quadro de câmera ("● CAM 1 · ABERTO"), com a onda do áudio dela correndo embaixo, medida da própria gravação. A cada ideia o quadro muda de lugar — sobe para dar espaço a um cartão de entrevista, vira coluna de um lado para um número e do outro para uma história no tempo, desce para o pé da tela quando um gráfico ou um passo a passo ocupa o alto, vira a capa de um player no fim — e, nas frases fortes, troca de câmera como numa mesa de corte. No alto, a régua do episódio mostra o capítulo atual e a barra de capítulos se preenchendo. Os scripts fazem a parte mecânica (medir, transcrever, cortar, medir a onda, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um podcast sobre carreira, mas o vídeo do usuário pode ser sobre qualquer coisa: cripto, saúde, receita, vendas, uma história pessoal, uma aula. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** é uma mesa de corte. O quadro da pessoa troca de lugar nas fronteiras das ideias (0,55 s, macio nas pontas, começando um pouco antes da frase para esconder o corte) e troca de câmera seco (aberto → close) nas palavras fortes. Tudo que vai receber texto nasce **a lápis** (24% de branco) e cada palavra **acende** no instante em que é dita; números contam até o valor dito; barras se enchem de rosa com uma agulha branca correndo, como a onda de um editor de áudio. Cartões sobem de baixo, opacos, cobrindo o que estava ali, e descem vazios no fim: nunca dois textos um sobre o outro. Nada fica parado mais de ~2,5 s.
- **Organização e hierarquia:** uma ideia por tela, em três andares: a régua do episódio no alto (capítulo atual), o quadro da pessoa com a onda presa embaixo dele, e o conteúdo na faixa que sobra (embaixo do quadro, ao lado dele ou em cima, quando ele desce). O texto principal é o maior da tela; rótulos de estúdio em mono caixa-alta (PERGUNTA, EM PAUTA, GLOSSÁRIO, marcas de tempo) são pequenos e ficam em cima do conteúdo, com um fio até a borda.
- **Tipografia:** duas famílias, nada condensado. **Schibsted Grotesk** (800 em títulos, números e itens; 700 em apoio) e **Martian Mono** (500, caixa-alta) nos rótulos de estúdio, marcas de tempo, cronômetro e números de capítulo. Títulos de 64 a 120 px, itens de 44 a 100 px, nada abaixo de 30 px. O template mede o texto com a largura real de cada letra e diminui o corpo até caber, em até 2 ou 3 linhas.
- **Moldura da pessoa:** sempre num quadro de câmera (cantos de 30 px, filete claro, etiqueta "CAM 3 · CLOSE"), nunca recortada do fundo e nunca coberta. Nove lugares: palco (grande, com legenda), abertura (grande), entrevista (baixo, cartão embaixo), pauta (o mais baixo), citação (médio), coluna à esquerda (trilha), coluna à direita (número), pé da tela (gráfico e passos) e a capa do player. O rosto é seguido quadro a quadro; o template mantém olhos e queixo sempre dentro (e a cabeça inteira, quando a gravação deixa).
- **Cores, textura e som:** estúdio quase preto (#0C0B0E, painéis #17161B), branco quente (#F3EFE8) e **um acento só, o rosa elétrico (#FF3D7F) da luz de "no ar"**: a onda falada, o chip do episódio, o capítulo atual, o destaque, o risco, o marco, o botão, o item da vez. Nada de segunda cor, gradiente ou brilho. Som raro e tonal: um tom grave quando o quadro recua para o estúdio, uma nota por capítulo novo (subindo), uma nota curta no marco e na placa de alerta, duas notas no botão do fim.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez, junto, o que o usuário não disse:
   - **nome e programa ou área** (ex.: "Carla" / "Café com Carla", ou "Tiago" / "Cripto"): vão no player do fechamento e, se o programa for curto (até 12 letras), no chip do alto;
   - **episódio**, se o vídeo for o corte de um episódio: número, minuto em que o trecho começa e duração total (ex.: "EP. 12, a partir de 32:10, de 58:20"). Sem resposta, siga sem: o chip mostra o programa (ou "CORTE") e o player mostra só o corte.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições. Itens `[sem transcrição: ouça antes de tirar]` podem ser fala que o Whisper perdeu: só tire se confirmar que não há fala.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **os cortes viram cortes de câmera**: cada pulo de corte é escondido por uma troca de lugar do quadro (na fronteira de um momento) ou por uma troca de câmera (aberto ↔ close). Por isso mantenha a proposta do `preparar` (cada trecho de fala separado): as pausas entre as frases saem e o ritmo fica de corte de podcast.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.29 --queixo-y 0.41
```

O script corta, enquadra, segue o rosto pelo vídeo e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa muda de lugar e de tamanho o tempo todo); gravação horizontal vira 3:4. Não precisa passar `--recorte`, e os avisos do `cortar` sobre a "zona" abaixo do queixo não valem aqui (este modelo reposiciona a pessoa). Refazendo o corte depois de já ter planejado, use `--manter-plano`.

**Gravação perto da câmera (selfie, rosto grande):** o template mede a cabeça pelo rastreio do rosto e, nos quadros largos e baixos, guarda olhos e queixo dentro e deixa o alto do cabelo sair, como num close de verdade. Se nas guias o queixo ou os olhos encostarem na borda, ajuste `cabeca` no plano (`references/plano.md`, seção 1).

### 5. Medir a onda do áudio

```bash
node ferramentas/onda.mjs
```

Mede o volume da voz no vídeo cortado (20 valores por segundo) e grava `src/onda.json`: é isso que faz a onda embaixo do quadro reagir de verdade à fala. **Rode de novo sempre que refizer o corte.** Se você esquecer, o template desenha uma onda estimada pelas palavras (funciona, mas é menos viva).

### 6. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a caixa azul tracejada é o quadro da pessoa naquele instante, a cruz deve cair no rosto e a linha vertical fina mostra o centro; a amarela é a legenda; a linha vermelha é o limite da interface do aplicativo e o retângulo vermelho, à direita embaixo, a faixa dos botões do app. Se a cruz não estiver no rosto, refaça o passo 4 com medidas corrigidas (e depois o 5).

### 7. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo, anotando **o lugar do quadro** de cada batida. **A assinatura (`resposta` ou `trilha`) entra pelo menos uma vez**, mesmo que o assunto não seja uma entrevista nem uma história com números: veja "A assinatura em qualquer assunto".

Pense como o editor de cortes de um podcast: **cada ideia ganha uma tela e o quadro muda de lugar com ela.** Não deixe o quadro no mesmo lugar por mais de ~6 s (troque de bloco), nem troque de lugar mais rápido que a cada ~1,5 s. Dê nome aos capítulos (3 a 6 num vídeo de 20 a 60 s).

### 8. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, câmeras, capítulos e regras de tempo) e preencha `src/plano.json`: `marca`, `episodio`, `momentos`, `cameras` (opcional), `semLegenda` e `correcoes`. Cada item, lado, opção ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem no palco e na trilha) e marca linha com palavra sozinha.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "Cloud": "Claude" }`). Só corrija o que você tem certeza.

### 9. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
node scripts/stills.mjs 8.45 8.55 8.65 8.75
```

O primeiro gera, para cada momento, um quadro antes, um no meio, um depois de cada sub-passo (cada `em`) e um depois do fim. O segundo serve para olhar **o meio das trocas de lugar**: gere quadros a cada 0,1 s em volta de cada fronteira de momento. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe (nada cortado, nada embaixo do quadro da pessoa ou dos botões do app)?
- cada palavra acende quando é dita; o número termina no valor dito?
- o rosto aparece com olhos e queixo dentro do quadro; a etiqueta da câmera bate com o enquadramento?
- nas trocas: nenhum quadro em que dois textos aparecem um sobre o outro, nenhum texto pela metade atrás do quadro que se move?
- nada parado mais de ~2,5 s?

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 10. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-estudio.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e onde ficou o quadro);
- o que é ilustrativo (barras de tendência sem números ditos, a forma da trilha);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, o número do episódio que você não sabia).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Lugar do quadro | Como aparece neste estilo |
|---|---|---|---|
| abertura | `abertura` | grande | o gancho se monta palavra por palavra embaixo da onda, o `destaque` em rosa; o vídeo abre em quadro cheio e recua para o estúdio |
| lista | `topicos` | pauta (o mais baixo) | o cartão "EM PAUTA" (ou o `titulo`) sobe de baixo; um item por linha a lápis, cada um acende na sua palavra com a **marca de tempo do episódio** em rosa à esquerda; o cursor rosa desce até o item da vez; contador 02/03 |
| passos | `passos` | pé da tela | o quadro desce e, em cima, os passos numerados 01, 02, 03… ao lado da **barra de capítulos em pé** (a da régua): o passo dito fica branco, o da vez enche de rosa, os que vêm ficam a lápis |
| número | `numero` | coluna à direita | à esquerda, o número grande conta até o valor (pt-BR; prefixo em mono rosa em cima, sufixo menor ao lado) e o rótulo acende embaixo; no pé, o **medidor de nível** da mesa sobe junto (em %, até a porcentagem; inteiro até 12, uma casa por unidade) |
| comparação | `comparacao` | entrevista | dois cartões lado a lado com rótulo mono e o texto que acende na fala; selo × (contra) ou → no meio; o vencedor ganha contorno rosa e um visto, o outro apaga (no errado-certo, ganha um ×) |
| gráfico | `grafico` | pé da tela | em cima, no traço da onda: barras arredondadas que crescem na fala (a da vez rosa, as ditas brancas), linha de pontos que se ligam, anel que se divide com a legenda; **sem números ditos**: uma onda de barras que sobe, cai ou oscila, varrida pela agulha, com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | grande (close na palavra) | `alerta`: a **placa rosa de "no ar"** acende da esquerda para a direita, com o triângulo e o texto escuro; `chave`: o texto grande acende e ganha o sublinhado rosa; o `detalhe` menor embaixo |
| definição | `definicao` | médio | a nota "GLOSSÁRIO": o termo grande acende com o sublinhado rosa; embaixo, o "=" rosa e o significado acendendo palavra por palavra |
| frase | `frase` (ou `citacao`) | médio (close na virada) | "“ FRASE DO EPISÓDIO" e a frase inteira a lápis, cada palavra acende; `risco` riscado em rosa; `destaque` em rosa com sublinhado |
| pergunta | `pergunta` | entrevista (close no destaque) | o **cartão "P"** sobe de baixo com a pergunta a lápis acendendo; as `opcoes` entram como etiquetas contornadas que acendem em rosa |
| fechamento | `cta` (ou `player`) | capa do player | o quadro vira a **capa de um player de podcast** (título, programa, barra do episódio, controles); embaixo, a chamada em até 3 linhas com o botão rosa (ícone + verbo ou "Saiba Mais") apertado quando é dito |
| **assinatura** | `resposta` | entrevista | no mesmo cartão da pergunta: ela encolhe para uma linha no alto e entra o **"R"** com a resposta; a `fileira` de marcas (dias, passos, palavras ditas) acende uma a uma |
| **assinatura** | `trilha` | coluna à esquerda | a **história no tempo**: à direita, o começo pequeno e o ponto grande (número que conta ou texto que acende); embaixo, a trilha de barras que sobe/cai/assenta junto com a agulha; o marco rosa chega no fim |

Fora dos momentos, a pessoa fica no **palco** (quadro grande com a legenda embaixo da onda). Use o palco só em respiros curtos (até ~3 s).

## A assinatura em qualquer assunto

O que faz um vídeo parecer do Estúdio, além do quadro, da onda e da régua, são dois blocos:

- **`resposta` (o cartão P/R de entrevista) = "uma pergunta e a resposta dela".** Quase toda fala tem uma: a pergunta que a pessoa faz em voz alta ("como avaliar os projetos?"), a dúvida que ela responde ("o que eu faço? eu…"), um mito e a verdade, um problema e a saída. O rótulo do cartão é livre (`rotulo`: "MITO"/"VERDADE", "DÚVIDA"/"SAÍDA"), a letra grande é a primeira letra dele, e a `fileira` vira as marcas da resposta (os itens que ela cita, cada um na sua palavra).
- **`trilha` = "algo que anda no tempo e chega num ponto".** Um preço que subiu, um hábito que se repetiu, um sintoma que avançou, uma carreira que virou. Com número dito, o ponto grande conta; **sem número, ele é um texto que acende** e as barras ganham a etiqueta ILUSTRATIVO. A `curva` diz a forma do caminho: `sobe`, `cai`, `oscila` ou `constante`.

Três exemplos fora do nicho do demo:

1. **Finanças/cripto.** "…reacendeu a conversa sobre o novo bull market, um ciclo de alta. […] Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos."
   `trilha` sem número: `inicio` { texto "A conversa", rotulo "Reacendeu" }, `contagem` { texto "Um ciclo de alta", rotulo "Bull market" }, `curva: "sobe"`, `ilustrativo: true`. Depois, `pergunta` "Como avaliar os projetos e pensar no seu posicionamento?" (destaque "posicionamento?") e, colada nela, `resposta` "Gravei uma aula gratuita" (destaque "aula gratuita") com a `fileira` `[{ "texto": "Mercado", "em": … }, { "texto": "Riscos", "em": … }, { "texto": "Ativos", "em": … }]`.
2. **Saúde (nutrição).** "Eu passei 10 anos de dieta em dieta. Quando parei de cortar tudo e comecei a comer de 3 em 3 horas, em 6 meses perdi 12 quilos."
   `trilha`: `inicio` { valor 10, unidade "anos de dieta", rotulo "Antes" }, `contagem` { valor 12, unidade "quilos a menos", rotulo "6 meses", `em` na virada "comecei", `ate` em "quilos" }, `curva: "cai"`, `marco` { texto "De 3 em 3 horas" }. Sem números ditos: `contagem` { texto "Sem cortar tudo" }, `curva: "constante"`, `ilustrativo: true`.
3. **Carreira/relacionamento (bem distante).** "Todo mundo me pergunta: dá para mudar de carreira depois dos 40? Dá. Eu mudei aos 42, com dois filhos e um financiamento."
   `pergunta` "Dá para mudar de carreira depois dos 40?" + `resposta` "Dá. Eu mudei aos 42" (destaque "aos 42") com a `fileira` de "Dois filhos" e "Financiamento", cada uma na sua palavra. Para um mito: `pergunta` com `rotulo: "Mito"` e `resposta` com `rotulo: "Verdade"`.

Os outros blocos também carregam a cara do modelo com qualquer assunto: a pauta do episódio (`topicos`) para qualquer lista; a placa de "no ar" (`destaque` alerta) para qualquer risco; o player (`cta`) para qualquer chamada — "Saiba Mais", "salva", "comenta", "link na bio".

## Capítulos e câmeras

- **Capítulos:** todo momento pode abrir um capítulo (`"capitulo": "O preço"`, até ~16 caracteres). A régua mostra o número e o nome do capítulo atual, e a barra se divide em um segmento por capítulo. 3 a 6 por vídeo; o nome é um título editorial curto (não precisa ser dito).
- **Câmeras:** sem `cameras` no plano, o template decide: cada lugar novo abre no aberto; a pergunta e a frase cortam para o close no `destaque`; o destaque corta para o close na palavra; cada corte longe de uma troca de lugar alterna aberto ↔ close. Para escolher à mão, veja `references/plano.md`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Número que não foi dito não aparece.
- Ilustrativo só onde o bloco permite (a forma da trilha, a tendência do gráfico), sempre com a etiqueta ILUSTRATIVO visível.
- O título do player (`titulo`) e os nomes de capítulo são editoriais: use a ideia central do vídeo, com palavras dele.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta, a assinatura ausente) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure a pergunta e a resposta, ou o que anda no tempo, e use `resposta` ou `trilha` (sem números, se for o caso).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A onda parece "inventada" (não acompanha a voz)**: o `src/onda.json` é de outro corte. Rode `node ferramentas/onda.mjs`.
- **Uma palavra acende na hora errada**: o texto precisa usar as palavras ditas, na ordem (pode pular palavras). Números em algarismo casam com o falado por extenso ("300" ↔ "trezentos"). Se a fala usa outra palavra, escreva a que foi dita.
- **Texto pequeno demais**: passou do limite do bloco (`references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Queixo ou olhos encostando na borda do quadro**: ajuste `cabeca` no plano.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido (o close amplia mais). Avise o usuário e prefira menos closes.
