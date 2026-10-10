---
name: modelo-pulso
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Pulso: a tela vira um app de treino claro com um relógio esportivo (fictícios, sem marca). A pessoa troca de lugar a cada ideia (tela cheia com cartão no peito, o visor redondo do relógio, o card de cima, o avatar de um mapa); o anel do relógio acende parte por parte, o ponteiro anda, números contam, casas enchem, uma rota se desenha e o traçado do pulso bate a cada palavra, com as cinco cores das zonas como as únicas cores fortes. Serve para qualquer assunto (o exemplo do modelo é corrida, mas funciona com cripto, finanças, saúde, arquitetura, vendas, carreira, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Pulso\", \"estilo relógio\", \"estilo app de treino\" ou \"com o anel das zonas\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Pulso

O vídeo vira um app de treino bem desenhado, claro e preciso, em que cada ideia dita vira algo que acende, conta ou se desenha. A pessoa abre em tela cheia com um cartão branco no peito e o traçado do pulso batendo a cada palavra; depois vira o visor redondo de um relógio esportivo (o anel acende em volta dela), o card de cima de um painel, ou o avatar no canto de um mapa; e fecha em tela cheia com o cartão de ação. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com corrida (zonas de frequência cardíaca), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo acende na fala, como um relógio medindo. Antes de ser dito, cada coisa já existe "a lápis" (palavras em cinza-esboço, partes do anel tracejadas, linhas de lista como esqueleto cinza de app, balão tracejado com três pontinhos "digitando", casas tracejadas, "0"); na palavra, ela acende na cor. O anel do relógio acende parte por parte e o ponteiro (um botão branco) corre até a parte da vez e fica oscilando de leve, como uma frequência. Números contam em dígitos de largura fixa; casas enchem em cascata; rotas se desenham com um ponto na ponta; o pulso desenha um batimento por palavra. Entra decidido e assenta, sem quique. Nas trocas, a pessoa é a cortina (o painel novo aparece enquanto ela encolhe; o velho fica até ela crescer por cima) e, de um lugar do app para outro, as páginas deslizam juntas, como num app de celular. Nunca um texto por cima de outro, nunca um quadro vazio.
- **Organização e hierarquia:** uma ideia por tela, de cima para baixo: a pessoa (no relógio, no card ou no mapa) e, embaixo dela, o painel da ideia. Um item grande por vez (o item da vez ganha uma faixa clara na cor; os que passaram ficam cinza); números e títulos grandes, rótulos e unidades menores. Etiqueta "ilustrativo" ou "valores de exemplo" sempre que o desenho não vem de números ditos.
- **Tipografia:** Bai Jamjuree 700 (letra de mostrador esportivo, largura normal, nada condensado) em títulos, números e itens; Reddit Sans 600–800 em rótulos, unidades e letreiros em caixa alta espaçada. Algarismos de largura fixa nos contadores. Títulos de 60 a 112 px, itens de 44 a 72 px, rótulos ≥ 34 px, nada abaixo de 30 px. Todo texto é medido com a própria fonte e diminui para caber: nunca vaza.
- **Moldura da pessoa:** seis lugares, decididos pelo tipo do bloco: **tela cheia** (rosto na linha do centro, cartão branco logo abaixo do queixo); **o visor redondo do relógio** (grande, no alto ou menor), com a caixa preta fosca, as alças curtas e o anel em volta; **o card de cima** (largo, cantos arredondados; mais alto quando a pessoa grava de perto, para a cabeça caber); **o avatar redondo** no canto de um mapa. A troca leva 0,6 s, começa logo antes da primeira palavra da batida e esconde o pulo do corte. O rosto é seguido quadro a quadro; nada passa por cima do visor.
- **Cores, textura e som:** fundo giz com curvas de nível bem leves, cartões brancos, o relógio preto fosco e as cinco cores das zonas como as únicas cores fortes: cinza (1, o que passou), **azul (2, a cor da marca e do neutro)**, verde (3, o certo), laranja (4, a atenção, o problema), vermelho (5, o alerta, o risco). Sons tonais e raros: batida grave de coração no alerta, notas subindo quando o anel completa, um "bip" grave quando algo trava, um tom quando uma parte enche, duas notas no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Finanças"): os dois vão na assinatura do alto, ao lado do coração azul. Sem resposta, siga sem nome (a assinatura some).

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

Números costumam vir em algarismos ("83 mil", "80%", "20") — ótimo: o template casa algarismo com palavra falada. Expressões com hífen ("dia-a-dia") e palavras grudadas só importam se aparecerem na legenda ou num rótulo; anote para `correcoes` (passo 7).

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Números curtos ditos sozinhos** ("Mil.", "Cem.") às vezes voltam como `[sem fala, sai]`. Antes de aceitar um item desses no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala. Se for fala, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo).

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre as frases viram cortes, e é nelas que a pessoa costuma trocar de lugar**: o movimento esconde o pulo do corte. Mantenha a proposta do `preparar`.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.49 --rosto-y 0.31 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, a altura do queixo (`zona.topo`, que põe os cartões do peito logo abaixo dele) e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa é reposicionada no relógio, no card e no mapa); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe, e o template usa a largura do rosto medida para a cabeça caber inteira no visor, no card e no avatar (gravação de perto fica com menos zoom e o card de cima mais alto). Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul deve cair no rosto **dentro da caixa da pessoa** (roxa tracejada) e a linha vertical fina marca o centro do quadro; a faixa amarela é onde ficam os cartões no peito (o queixo fica acima dela); a linha vermelha vertical é o limite da direita (nada a menos de 120 px da borda); a laranja é o topo e a vermelha horizontal o limite da interface do app embaixo. Para ver a cruz nos outros lugares da pessoa, peça guias nos tempos de momentos diferentes depois do passo 7 (`node scripts/stills.mjs --guias 1 5 9 14`). Se a cruz não estiver no rosto, refaça o passo 4 com medidas melhores.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`zonas`, `zona`, `divisao` ou `rota`) entra pelo menos uma vez**, mesmo que o assunto não tenha nada de treino: veja "A assinatura em qualquer assunto".

Alterne os lugares da pessoa (o tipo decide o lugar): depois de um ou dois blocos no relógio, um no card ou no mapa; abra e feche em tela cheia. Dois blocos seguidos no mesmo lugar ficam parados demais.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, opção ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe e dá para ler? Nada por baixo do relógio, do card ou do avatar?
- cada coisa acende na palavra certa? O número fecha no valor dito?
- a cabeça está inteira no visor, no card e no avatar?
- as etiquetas "ilustrativo"/"valores de exemplo" estão onde o número não foi dito?
- nada parado mais de ~2,5 s, nenhum quadro vazio e nenhum texto sobre outro no meio das trocas? Gere quadros a cada 0,05–0,1 s em volta de cada `de` (`node scripts/stills.mjs 8.55 8.6 8.65 8.7 8.8`).

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-pulso.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (proporção da divisão sem porcentagem dita, curvas de tendência, leituras de exemplo);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Lugar da pessoa | Como aparece neste estilo |
|---|---|---|---|
| abertura | `abertura` (ou `gancho`) | tela cheia | cartão branco no peito: o título acende palavra por palavra e o traçado do pulso corre embaixo, um batimento por palavra; `destaque` em azul; `alertaEm` faz um batimento vermelho alto |
| lista | `topicos` | relógio menor | o anel se divide em uma parte por item (numeradas no aro); cada parte acende quando o item é dito e o ponteiro vai até ela; embaixo, as linhas do app (número no círculo + texto) saem do esqueleto cinza na palavra; a faixa clara anda até o item da vez |
| passos | `passos` | avatar no mapa | uma rota se desenha no mapa de parada em parada (pinos numerados que acendem na palavra), com o ponto correndo na ponta; embaixo do mapa, a lista dos passos acompanha |
| número | `numero` | tela cheia | cartão no peito: o rótulo se monta na fala, o número conta em pt-BR (prefixo e sufixo menores) e a régua das cinco zonas enche junto, com o ponteiro na ponta |
| comparação | `comparacao` | card de cima | dois monitores lado a lado: rótulo, texto e um traçado de pulso que começa a bater quando o lado é dito; o vencedor ganha ✓ e batimento firme em verde, o outro ✗ e o traçado vira linha reta |
| gráfico | `grafico` | card de cima (pizza: relógio no alto) | `barras` = colunas de casas que enchem com o valor contando em cima; `linha` = gráfico de frequência com as faixas das zonas ao fundo e a caneta desenhando; `pizza` = o anel do relógio dividido nas proporções, com a legenda embaixo; sem números ditos = a forma da tendência com "ilustrativo" |
| destaque | `destaque` | relógio grande | o anel inteiro acende numa cor só e o ponteiro corre até o fim; `alerta` = vermelho, com o coração acelerado; `chave` = azul; a frase bate embaixo, grande |
| definição | `definicao` | relógio no alto | o termo acende como uma zona em foco (as outras apagam, o ponteiro desce até ela); o balão "digitando" ganha o significado |
| frase | `frase` | card de cima | a frase se monta grande sobre o traçado do pulso; `destaque` na cor da zona; `risco` riscado em vermelho quando é dito, com um batimento de alerta |
| pergunta | `pergunta` | relógio no alto | chega como mensagem no relógio: balão "digitando" → a pergunta; as `opcoes` viram botões de resposta rápida que acendem na palavra (o anel acende uma parte por opção) |
| fechamento | `cta` | tela cheia | cartão de ação no peito: letreiro, botão que afunda e muda (Salvar → Salvo, Seguir → Seguindo, Comentar, Abrir), o texto com `destaque` em azul e um pulso (ou a barra da divisão) em miniatura |
| **assinatura** | `zonas` | relógio grande | o anel das cinco zonas acende zona por zona (cinza → vermelho) e o ponteiro sobe; o título se monta embaixo, com a régua "baixo → alto" (rótulos livres) |
| **assinatura** | `zona` | relógio no alto | uma zona em foco: o nome (qualquer termo) acende na cor dela, o balão ganha o significado e até 2 leituras contam |
| **assinatura** | `divisao` | card de cima | a barra de casas: a parte maior enche contando a porcentagem, a menor enche na outra cor e a barra se divide; sem porcentagem dita, proporção ilustrativa |
| **assinatura** | `rota` | avatar no mapa | dois trechos na cor da zona: o longo e lento (zona 1–2) e o curto e rápido (zona 3–5); rótulos e leituras embaixo |

## A assinatura em qualquer assunto

O relógio do Pulso mede **intensidade**: quanto, em que nível, em que ritmo. Isso existe em quase toda fala, mesmo longe do esporte:
- `zonas` = **uma escala de 1 a 5** de qualquer coisa (risco, energia, maturidade, urgência, temperatura de um mercado). Rótulos das pontas livres em `escala`.
- `zona` = **um nível em foco com o que ele significa** (um termo técnico, uma fase, um tipo): o nome na cor da zona e o significado no balão. Zona 2–3 para o saudável, 4–5 para o arriscado.
- `divisao` = **a maior parte × uma parte** (o 80/20 de qualquer coisa; "a maioria das pessoas…"; "quase todo o tempo…"). Sem porcentagem dita, use `ilustrativo: true`.
- `rota` = **dois ritmos ou dois caminhos**: o longo e leve × o curto e forte (rotina × pico; o que parece bom × o que trava; devagar × rápido).

Três exemplos fora da corrida:

1. **Finanças/cripto.** "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas."
   `numero` 83.000 com `prefixo: "US$"` no peito; depois `zonas` com `titulo: "Reacendeu a conversa"`, `escala: ["baixa", "alta"]` (o anel reacende zona por zona em "reacendeu"); depois `zona` 4 com `titulo: "Bull market"` (em "market") e `balao: { "texto": "ciclo de alta" }` (em "ciclo"): o mercado está na zona laranja.
2. **Saúde/rotina.** "Passe a maior parte da semana em movimento leve, caminhar, alongar; e só um ou dois dias de esforço de verdade."
   `divisao` com `ilustrativo: true`, `casas: 7`, `unidade: "cada casa é um dia"` e `partes: [{ "texto": "movimento leve", "zona": 2, "em": <"leve"> }, { "texto": "esforço de verdade", "zona": 4, "em": <"esforço"> }]` — a semana enche de azul e se divide no laranja, sem porcentagem na tela.
3. **Arquitetura (bem distante).** "Móvel encostado em todas as paredes. Parece que ganha espaço, mas trava a circulação."
   `destaque` alerta "Móvel encostado em todas as paredes" (o anel vermelho), depois `rota`: trecho 1 "Parece que ganha espaço" (zona 2, a volta longa e azul), trecho 2 "Mas trava a circulação" (zona 5, o traço curto e vermelho), sem leituras (sem a etiqueta "exemplo").

Outros usos: `zonas` para "os 5 níveis de maturidade de uma empresa"; `zona` para "fase 3 do luto: barganha — tentar negociar com o que aconteceu"; `divisao` para "a maior parte das brigas de casal é sobre coisas pequenas"; `rota` para "no começo da carreira, devagar; depois de um ano, você acelera".

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Etapa sem número dito fica sem número na tela.
- Número ilustrativo só onde o bloco permite (a proporção da divisão, a forma do gráfico, as leituras de exemplo da zona e da rota), sempre com a etiqueta "ilustrativo", "valores de exemplo" ou "exemplo" visível. Nunca tire a etiqueta.
- Nenhum texto de tela cita ferramenta de edição, marca de relógio ou de app.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure na fala um nível, uma escala, "a maioria × uma parte" ou dois ritmos (veja acima) e use `zonas`, `zona`, `divisao` ou `rota`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Algo acende antes ou depois da palavra**: o `em` está errado. Confira em `work/palavras.json` e mova. Nos primeiros 0,3 s de um momento a pessoa ainda está mudando de lugar: prefira que o primeiro item caia depois disso.
- **Um texto entra todo de uma vez, sem acompanhar a fala**: as palavras dele não foram achadas na fala daquele momento. Use as palavras que a pessoa diz, na ordem em que diz; palavra com hífen na transcrição vira `correcoes`.
- **Texto pequeno demais**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **A cabeça corta no visor, no card ou no avatar**: o rosto medido está errado (refaça o passo 4). Gravação muito de perto: o template já reduz o zoom; o que sobra cortado é o que a câmera não pegou — avise o usuário.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução; o vídeo sai menos nítido. Avise o usuário.
