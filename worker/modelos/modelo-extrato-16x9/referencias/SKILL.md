---
name: modelo-extrato-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Extrato. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Extrato: o que ela diz vira um cupom de papel térmico que imprime linha a linha no ritmo da fala (itens com pontilhado, números que contam, contas com sinal magenta, total com fio duplo, carimbo de tinta, linha de corte com tesoura, frases que acendem palavra por palavra), em fonte mono de impressora, tinta preta e um só magenta, com a pessoa numa moldura à direita enquanto o rolo imprime à esquerda, ou em quadro cheio com uma tira de cupom ao lado do rosto. Serve para qualquer assunto (o exemplo do modelo é finanças do dia a dia, mas funciona com cripto, psicologia, saúde, vendas, carreira, aulas, histórias): a IA traduz a fala para os blocos do estilo e usa a conta (itens que somam um resultado) como metáfora. Use sempre que o usuário pedir para editar \"no modelo Extrato\", \"estilo cupom\", \"estilo recibo\" ou \"estilo nota fiscal\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, o cupom à esquerda)."
---

# Modelo Extrato (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Extrato no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, o papel térmico, a impressão no ritmo da fala, o carimbo, a tesoura, os sons e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio (o vídeo 16:9 inteiro, como foi gravado), com legenda no terço de baixo. O cupom entra **só quando acrescenta clareza** à fala e a pessoa volta ao quadro cheio quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Quando a fala vira conta (o rolo), a pessoa vai para uma moldura do lado direito (760 × 912 px, cantos de 24 px, sombra), com o rosto centralizado nela e acompanhado com ajuste suave, sem saltos; o rolo imprime no quadro do lado esquerdo, saindo do alto, e rola para cima. A cada etapa o rolo dá um passo de lado dentro do quadro (a moldura não sai da direita).
- **A tira sobe ao lado do rosto.** Frases, números, alertas e perguntas saem numa tira curta de cupom com a pessoa em quadro cheio, subindo do pé do quadro ao lado do rosto (nunca sobre ele), alternando de lado quando os dois lados têm espaço. Se o rosto foi gravado num canto, a tira vai para o lado livre; se nem assim couber, o vídeo desliza e aproxima o mínimo.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais para o texto, nada importante abaixo de y 984 (controles do player).

## O modelo

O vídeo vira um extrato impresso ao vivo: cada coisa que a pessoa diz sai como uma linha de cupom de papel térmico no instante em que é dita. As explicações em sequência imprimem num rolo comprido no lado esquerdo, com a pessoa na moldura da direita; as frases soltas, os números, os alertas e as perguntas saem numa tira curta de cupom ao lado do rosto, com a pessoa em quadro cheio. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com finanças do dia a dia (a conta do café), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** imprimir. Cada linha empurra o papel a altura dela (0,24 s, decidido) e a tinta revela (0,16 s); as palavras de uma frase acendem uma a uma, cada uma quando é dita; números contam até o valor; o que ainda vai ser dito espera a lápis (preço "R$ __,__", casas tracejadas, a caixa do carimbo); o carimbo bate de 150% para 100% em 0,13 s e dá um tranco no papel; a tesoura corre pela linha de corte; o marca-texto varre e o risco corta em magenta. O rolo rola para cima; a tira sobe do pé do quadro e cai quando o momento acaba. Nada de quique, giro ou elástico.
- **Organização e hierarquia:** tudo é linha de cupom, de cima para baixo, na ordem da fala: título de seção centrado entre fios, itens com pontilhado até a borda e o valor (ou o "−" magenta) à direita, notas em cinza menor, total com fio duplo, "=" magenta e o número grande à direita. Um rolo só para as explicações (lista, passos, comparação, gráfico, a conta); cada etapa nova abre com a linha de corte ✂. Uma ideia por tira.
- **Tipografia:** Spline Sans Mono (500 a 700, sempre em caixa-alta) para tudo o que o cupom imprime; IBM Plex Sans 700 no carimbo e na legenda. As duas passam no "Iogurte Il1". Frases de 50 a 64 px, itens de 42 a 56, títulos de 36 a 44, totais de 72 a 104; o texto diminui e quebra (até 2 ou 3 linhas) para caber, nunca vaza, nunca abaixo de 30 px na tela.
- **Moldura da pessoa:** dois lugares. **Tela dividida** (o rolo): a pessoa numa moldura à direita (760 × 912 px, cantos de 24 px, sombra), com o rosto no centro dela, e o rolo no quadro da esquerda (papel em escala 1,2), saindo do alto; a última linha impressa fica em y 900 e o papel rola para cima. **Quadro cheio** (a tira): o vídeo inteiro, como foi gravado, e a tira de cupom subindo do pé do quadro ao lado do rosto, com a última linha em y 800 (acima da legenda), alternando esquerda e direita quando os dois lados têm espaço. A pessoa cresce e encolhe nas fronteiras dos momentos; o rosto é seguido quadro a quadro; o papel nunca passa sobre o rosto.
- **Cores, textura e som:** balcão grafite (#1C1D20), papel térmico (#F7F4EE) com bordas serrilhadas e sombra macia, tinta quase preta (#222120), cinza (#7E7A72) para o secundário, lápis (#BDB8AE) para o que espera e **um só acento, o magenta de tinta de carimbo (#D81E6C)**: sinais, "=", marca-texto, risco, carimbo, o "−" dos débitos. Sons tonais e raros: duas notas quando um total termina de contar ou o lado certo ganha o selo, um baque grave no carimbo, duas notas descendo no risco ou no "não" da tesoura, um acorde quando o rodapé imprime.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Psicologia clínica"): eles são impressos no cabeçalho e no rodapé do cupom. Sem resposta, siga sem nome.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições (ou uma fala lenta, como "quatro… sete… oito").

**Números curtos ditos sozinhos** ("Oito.", "Doze.") às vezes voltam como `[sem fala, sai]`. Antes de aceitar um item desses no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala. Se for fala, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo: `{ "em": 3.18, "ate": 3.36, "w": "8" }`).

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre as frases viram cortes, e é nelas que a pessoa troca de lugar** (encolhe para a moldura da direita, ao lado do rolo, ou volta ao quadro cheio com a tira): o movimento esconde o pulo do corte. Mantenha a proposta do `preparar`; pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.38 --queixo-y 0.55
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para a moldura e para as tiras. Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a moldura acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no centro do rosto; as caixas verdes são as faixas das tiras do quadro cheio, dos dois lados (a tira de verdade fica ao lado do rosto, do lado que tiver espaço); a roxa é a moldura da pessoa na tela dividida, à direita, com o centro marcado; a laranja é o quadro do rolo, à esquerda, com a linha de impressão; a amarela é a legenda (terço de baixo); nada importante abaixo da linha vermelha (controles do player). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`conta`) entra pelo menos uma vez**, mesmo que o assunto não tenha números: veja "A assinatura em qualquer assunto".

Alterne os dois lugares: depois de um ou dois momentos no rolo, uma tira em quadro cheio, e vice-versa. No vídeo completo a tela cheia é a base (aula 9): o cupom entra onde ajuda a entender, não em toda frase, e os respiros só com a pessoa e a legenda podem ir de 1 a ~8 s. Abra com uma tira (`abertura`, `numero` ou `frase`) e feche com o `cta`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `cabecalho`, `momentos`, `semLegenda` e `correcoes` (e `moeda`, se os valores ditos não são em reais). Cada item, linha, lado ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento e nos momentos com `legenda: true`).

**Confira as contas.** Os valores vêm do que a pessoa disse; o template só formata (R$ 2.112,00). Refaça cada multiplicação e soma de uma `conta` antes de renderizar. Se a conta falada estiver errada, não corrija em silêncio: avise o usuário.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "478": "4-7-8" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o texto do cupom cabe (nada cortado, nenhuma palavra partida sem necessidade)?
- cada linha imprime quando a palavra é dita? o número chega ao valor certo logo depois de dito?
- a tira fica ao lado do rosto, o rolo no quadro da esquerda e a pessoa na moldura da direita, com o rosto no centro dela, sem nada sobre o rosto?
- o carimbo bate em papel livre, sem cobrir texto?
- nada parado mais de ~2,5 s, nenhum quadro vazio e nenhum texto sobre outro no meio das trocas? Gere quadros a cada 0,1 s em volta de cada troca (`node scripts/stills.mjs 8.45 8.55 8.65 8.75`): a tira cai antes de a pessoa encolher para a moldura e sobe depois que ela voltou ao quadro cheio.
- nada importante abaixo de y 984 (controles do player)? a legenda fica numa linha só, no terço de baixo?

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-extrato.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (casas sem número dito, gráfico de tendência, resultado em palavras);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma conta que você simplificou).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | tira em quadro cheio: o título do cupom (`cabecalho`) já impresso e o texto acendendo palavra por palavra; o `destaque` ganha marca-texto magenta |
| lista | `topicos` | no rolo: título de seção centrado e cada item numa linha com um quadrado de tinta, que bate no seu `em`, e o pontilhado correndo até a borda; `detalhe` em cinza embaixo |
| passos | `passos` | no rolo: cada passo com o número numa caixa, ligados por um tracejado vertical; a caixa do passo da vez fica cheia de tinta e anda para o próximo quando ele é dito |
| número | `numero` | tira: fio duplo, "= RÓTULO" e o número grande que conta (prefixo e sufixo menores); antes de dito, os algarismos esperam a lápis ("__.___") |
| comparação | `comparacao` | no rolo: os dois lados um embaixo do outro (rótulo cinza + texto grande), separados por "VS" (`contra`) ou uma seta (`antes-depois`, `errado-certo`); o errado é riscado em magenta com um ✕, o certo (ou o `vencedor`) leva um selo redondo ✓ |
| gráfico | `grafico` | no rolo: barras de tinta que sobem do esboço a lápis, linha traçada ponto a ponto ou pizza que se varre, com os valores em pt-BR; o dado da vez em magenta; sem números ditos, a forma da tendência traçada com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | tira: `alerta` = um **carimbo magenta** com a frase, que bate quando ela é dita (o lugar espera tracejado); `chave` = a frase grande com marca-texto magenta |
| definição | `definicao` | tira: o termo grande palavra por palavra e, no significado, "= SIGNIFICADO" com o "=" magenta e o termo grifado |
| frase | `frase` | tira: a frase grande palavra por palavra; `destaque` com marca-texto, `risco` riscado em magenta quando é dito |
| pergunta | `pergunta` | tira: a pergunta palavra por palavra e uma linha a lápis para responder; com `opcoes`, uma caixinha de marcar por opção, cada uma no seu `em` |
| fechamento | `cta` | tira: a chamada grande com o ícone magenta no fim e o rodapé do cupom (nome · área e código de barras) |
| **assinatura** | `conta` | no rolo: a conta impressa — itens com valor (ou "−"/"+" magenta), multiplicações "× 22", casas que se preenchem, o total com fio duplo que conta (ou o resultado em palavras) e o carimbo |
| assinatura (final) | `fechamento` | a última `conta`, que termina com o rodapé do cupom; pode ter campos em branco para quem assiste preencher |

Qualquer bloco muda de lugar com `"quadro": "cheio"` (tira) ou `"quadro": "dividido"` (rolo): por exemplo, uma pergunta com opções ou uma definição no rolo, ou uma conta curta numa tira.

## A assinatura em qualquer assunto

A `conta` mostra **"pequenas coisas que se somam (ou se multiplicam) até um resultado"**: o custo escondido, o saldo de um hábito, o que se acumula. Quase toda fala tem isso: motivos que levam a uma consequência, hábitos que constroem algo, passos que viram um resultado. Os números são opcionais:

- **Com números ditos**: `item` com `valor`, `vezes` com o fator, `grade` com as casas e o `total` que conta (a conta do café: 8 × 22 = 176).
- **Sem números**: `item` com `valor` em texto (`"−"` para o que tira, `"+"` para o que soma), `grade` de `pontos` com `"ilustrativo": true` e o `total` com `resultado` em palavras ("PERDE", "CALMA", "CONFIANÇA"). Nada de número inventado.

Três exemplos fora das finanças do dia a dia:

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `conta`: `texto` "Mesmo na alta" → `nota` "Tem gente que perde:" → três `item` com `valor: "−"` ("Compra por impulso", "Moeda sem critério", "Risco sem entender"), cada um na sua palavra → `total` "Saldo" com `resultado: "Perde"`.
2. **Psicologia/saúde.** "Inspira pelo nariz contando até 4, segura o ar contando até 7, solta devagar contando até 8, repete quatro vezes."
   `conta`: `item` "Inspira pelo nariz" com `valor: "4"`, `item` "Segura o ar" com `valor: "7"`, `item` "Solta devagar" com `valor: "8"` (cada valor na palavra do número) → `vezes` "Repete" com `fator: "4"` → `grade` de `pontos` com 4 casas que se enchem enquanto a pessoa diz "quatro vezes".
3. **Bem distante (relacionamento).** "Confiança não vem de um grande gesto: vem de cumprir o que combinou, ouvir sem o celular e pedir desculpa quando erra."
   `conta`: três `item` com `valor: "+"` ("Cumprir o combinado", "Ouvir sem celular", "Pedir desculpa") → `total` "Resultado" com `resultado: "Confiança"` e `carimbo` "Sem grande gesto".

Outros usos: o tempo de tela de um dia ("3 h × 365"), os ingredientes de um hábito, os custos de uma decisão de carreira, o "extrato" de uma semana de treino, o placar de um jogo. Se a fala só enumera sem chegar a um resultado, use `topicos`; se chega a um resultado (mesmo em palavras), use a `conta`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Item sem valor dito fica sem valor ou com "−"/"+".
- Número ilustrativo só onde o bloco permite (casas de `grade` sem quantidade dita, gráfico de tendência), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure na fala o que se soma até um resultado (motivos → consequência, hábitos → efeito) e use a `conta` sem números (veja acima).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Um número sumiu do vídeo**: o número curto saiu como `[sem fala, sai]` no passo 3. Volte, meça o volume, marque `"manter": true` e rode o `cortar` de novo com `--manter-plano`.
- **A transcrição escreveu o número por extenso ou errado** ("oito" em vez de "8"): o cupom usa os valores do plano; para a legenda, use `correcoes`.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala.
- **A tira ficou pequena (o papel encolheu)**: o conteúdo dela é alto demais para a altura do quadro (da linha de impressão, em y 800, até o topo) ou o rosto deixou pouco espaço dos lados. Encurte o texto, tire uma opção ou mande o bloco para o rolo (`"quadro": "dividido"`).
- **O rolo ficou com pouca coisa por muito tempo**: a etapa tem pouca coisa impressa; acrescente a linha que desenha a ideia (um item, uma nota, uma `grade`) ou junte duas etapas curtas.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
