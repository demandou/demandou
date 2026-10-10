---
name: modelo-planta
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Planta: a tela vira uma prancheta de arquiteto (papel com grade, grafite e um único acento terracota) e o que a pessoa explica é desenhado na hora em que é dito: planta baixa em que cada cômodo é uma ideia e a circulação tracejada percorre o caminho, cotas que medem, números que contam, notas, passos ligados por um percurso, duas vistas comparadas e gráficos em elevação; a pessoa muda de lugar (tela cheia, faixa larga em cima, janela no canto) para abrir espaço para a prancha. Serve para qualquer assunto (o exemplo é arquitetura de interiores, mas funciona com finanças, saúde, vendas, carreira, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Planta\", \"estilo planta baixa\", \"estilo prancheta\" ou \"com desenho técnico\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Planta

O vídeo vira uma prancheta de arquiteto sendo desenhada ao vivo. A pessoa fala em tela cheia com um cartão de papel na altura do peito; quando a fala organiza uma ideia, ela muda de lugar (sobe para uma faixa larga ou vira uma janelinha presa no canto) e a prancha se desenha no ritmo das palavras: paredes, portas, a circulação tracejada, cotas, níveis, notas numeradas. Preciso, calmo, sem enfeite.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com arquitetura de interiores (layout de sala), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo é desenho técnico acontecendo na fala. Linhas se traçam, paredes se fecham, números contam enquanto uma cota cresce embaixo deles, cada item entra na palavra que o nomeia. O que ainda vai ser dito já está esboçado **a lápis** (cinza claro, tracejado) e é **passado a nanquim** quando é falado: nunca há folha vazia. Movimento ao longo dos eixos, decidido e que assenta; nada gira, quica ou pulsa. Entre duas folhas, a **régua paralela** da prancheta desce pela tela: acima dela já é a folha nova, abaixo ainda é a velha. A pessoa encolhe revelando a prancha que já está por baixo e cresce por cima dela na volta.
- **Organização e hierarquia:** uma ideia por folha. Cabeçalho da prancha no alto (número de chamada ① + título que vira nanquim na fala), o desenho ou a lista no corpo, notas e cotas menores. Um elemento em terracota por vez: o que está sendo dito agora. Listas viram notas numeradas; sequências, um percurso; comparações, duas vistas; números, cotas; ideias encadeadas, cômodos de uma planta.
- **Tipografia:** Sora (300 para títulos e números grandes, 400 para textos, 600 só na ênfase) e IBM Plex Mono em caixa alta espaçada para rótulos técnicos, cotas, níveis e "SEM ESCALA". Títulos de prancha de 56 a 88 px (uma linha enquanto der), textos de corpo ≥ 44 px, rótulos técnicos ≥ 28 px. Todo texto é medido com as larguras reais da fonte e reduzido para caber, em até 2 ou 3 linhas.
- **Moldura da pessoa:** três lugares, sempre num retângulo com filete fino, rosto seguido quadro a quadro. **Tela cheia** (rosto na linha do centro, cartão de papel no peito); **dividida** (faixa larga em cima, a prancha sobe por baixo junto com a borda do vídeo); **prancha cheia** (janelinha no canto de cima à direita, título ao lado dela, desenho embaixo; a janela nunca cobre texto). A troca leva 0,6 s e começa no corte mais próximo. O zoom de cada caixa sai da largura do rosto: funciona com pessoa em pé ou bem perto da câmera.
- **Cores, textura e som:** papel `#F3F0E8` com grade milimetrada quase invisível, grafite `#1F1F1D` para traços e textos, cinza para o secundário, **um único acento terracota** `#C4623A` para o assunto do instante (o item da vez, a cota, a circulação, o alerta, a ênfase). Sem degradê, sombra ou brilho. Sons raros e tonais: um tom grave quando a prancha sobe, uma nota de lápis quando algo muda no desenho, um "tique" tonal quando uma medida fecha.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Ana Ribeiro — Design de interiores"): viram o carimbo do fechamento (AUTOR e ÁREA). Sem resposta, siga sem assinatura.

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
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam; só as longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.32 --queixo-y 0.43
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: gravação vertical fica em 9:16 (a pessoa ocupa a tela e muda de lugar); gravação horizontal vira 3:4, com a pessoa em cima e a base de papel, onde entram os cartões e a legenda. Gravação bem perto da câmera (selfie) funciona: o script avisa que o topo da cabeça fica um pouco cortado em tela cheia, e as caixas do modelo ajustam o zoom pela largura do rosto. Refazendo o corte depois de já ter planejado, use `--manter-plano`.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul cai no rosto (só aparece em tela cheia); a caixa azul tracejada é onde entram os cartões no peito; a caixa verde é a pessoa; a laranja, a prancha; a amarela, a legenda, acima da linha vermelha (interface do aplicativo). Se a cruz não cair no rosto, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`planta`) entra pelo menos uma vez**, mesmo que o assunto não tenha nada de espaço: veja "A assinatura em qualquer assunto".

Pense também no lugar da pessoa: alterne cartão no peito (tela cheia) e prancha (dividida ou cheia). Abra e feche em tela cheia. Use a prancha cheia para o trecho mais rico (a planta, de preferência). Não deixe o mesmo layout de prancha três vezes seguidas.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, layouts e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, cômodo, lado, dado ou opção entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento e nos momentos com `"legenda": true`).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "Jão": "João" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe (nada cortado, nada embaixo da janela da pessoa)?
- cada item, cômodo, número entra quando a palavra é dita?
- a planta está legível (cômodos com texto inteiro, circulação passando pelas portas)?
- a janela ou a faixa da pessoa mostra o rosto, sem cobrir nada?
- nada parado mais de ~2,5 s, nenhum quadro vazio e nenhum texto sobre outro no meio das trocas? Gere quadros a cada 0,05–0,1 s em volta de cada troca (`node scripts/stills.mjs 8.6 8.65 8.7 8.75 8.8`);
- nada importante abaixo da linha da interface do app?

Corrija o plano (texto mais curto, outro bloco, outro `em`, outro layout) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-planta.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (planta "SEM ESCALA", gráfico de tendência, número marcado como ilustrativo);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma medida "de composição").

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | tela cheia: cartão de papel no peito (carimbo de prancha) com rótulo técnico opcional; o texto se monta palavra por palavra e uma cota se desenha embaixo; o `destaque` fica terracota. No começo do vídeo, o cartão já está aberto no primeiro quadro |
| lista | `topicos` | prancha: as NOTAS da folha. Cada item é uma linha com marcador quadrado que acende em terracota quando é dito; um nível ▷ anda até o item da vez; os que virão estão esboçados a lápis |
| passos | `passos` | prancha: um percurso. Círculos numerados (01, 02…) numa coluna, ligados pela circulação tracejada em terracota, que chega em cada passo quando ele é dito; ícone a traço opcional |
| número | `numero` | tela cheia: cartão com o rótulo técnico, o número a lápis em zero que conta até o valor quando é dito (prefixo e sufixo menores, em terracota) e a cota crescendo embaixo junto com a contagem |
| comparação | `comparacao` | prancha: duas vistas (molduras que se desenham quando o lado é dito), rótulo em caixa alta e o texto palavra por palavra; × entre elas (`contra`) ou a seta da circulação (`antes-depois`); o lado que perde é riscado em terracota; em `errado-certo`, × no errado e ✓ no certo. Na prancha cheia, uma sobre a outra |
| gráfico | `grafico` | prancha: elevação de arquiteto. `barras` = prédios que sobem do chão hachurado com um nível ▽ e o valor; `linha` = corte de terreno que se desenha ponto a ponto; `pizza` = planta circular dividida com números de chamada; sem números = escada com a seta SOBE/DESCE, prédios crescendo ou terreno ondulado, com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | tela cheia: a frase curta grande no cartão; `alerta` = em terracota sobre uma área hachurada que cresce e um ×; `chave` = uma cota que mede a palavra |
| definição | `definicao` | prancha: o termo grande com uma cota em cima, a lápis até ser dito; uma linha de chamada em terracota desce até o significado, que é passado a nanquim palavra por palavra. Na prancha cheia, o termo fica ao lado da janela |
| frase | `frase` | tela cheia: cartão com a frase palavra por palavra, `destaque` em terracota, `risco` riscado em terracota quando é dito |
| pergunta | `pergunta` | tela cheia: cartão com "?" num círculo de chamada e a pergunta; as `opcoes` entram como etiquetas, cada uma na sua palavra |
| fechamento | `cta` | tela cheia: carimbo de prancha com ícone a traço, a chamada palavra por palavra (`destaque` em terracota) e as células AUTOR e ÁREA |
| **assinatura** | `planta` | prancha: **planta baixa** que se desenha. Modo livre (qualquer assunto): `comodos` (2 a 5), cada cômodo é uma ideia que entra quando é dita, a porta dele abre e a circulação tracejada anda até ele; `alerta` hachura o cômodo em terracota; `percurso.bloqueado` termina num × (o caminho trava). Marcada "SEM ESCALA". Modo desenho técnico (espaços de verdade): ambiente e móveis em centímetros |
| medida com desenho | `medida` | tela cheia: como o `numero`, com um detalhe desenhado ao lado (parede, chão ou teto e um móvel que se afasta enquanto a cota conta) |
| antes e depois desenhado | `antesDepois` | prancha: duas plantas do mesmo ambiente (o antes recua para o cinza, o depois acende com marcas numeradas) e etiquetas de resumo |
| título fixo do exemplo | `titulo` | o título do demo, em linhas escritas à mão; para vídeos novos, use `abertura` |

## A assinatura em qualquer assunto

A planta baixa mostra **um percurso por etapas ou as partes de um todo**: cada cômodo é uma ideia, e a circulação tracejada mostra o caminho de uma ideia para a outra. Serve para "o caminho que as pessoas fazem", "as partes de uma rotina", "as fases de um processo", "onde a coisa trava". Cômodos em `alerta` são os problemas; `percurso.bloqueado` é o caminho que não chega ao fim; sem bloqueio, a seta chega no último cômodo. Não precisa de número nenhum: a planta é um esquema e leva "SEM ESCALA".

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `planta` na prancha cheia, `titulo: "Tem gente que perde"`, `comodos`: "Na alta" (em "alta") → "Compra por impulso" (em "compra", `alerta`) → "Moeda sem critério" (em "escolhe", `alerta`) → "Risco que não entende" (em "assume", `alerta`), com `percurso: { bloqueado: true, bloqueioEm: <em de "entende"> }`. A circulação entra pela porta, atravessa os três cômodos hachurados e trava num ×.
2. **Saúde e rotina (sono).** "Para dormir melhor: desliga a tela uma hora antes, deixa o quarto escuro e fresco, e acorda sempre no mesmo horário."
   `planta` com `titulo: "Para dormir melhor"`, `comodos`: "Tela desligada" (em "desliga") → "Quarto escuro e fresco" (em "quarto") → "Mesmo horário" (em "acorda"), sem bloqueio: a seta chega no último cômodo (a rotina completa).
3. **Algo bem distante (relacionamento).** "Toda briga nossa seguia o mesmo caminho: um comentário, aí a defesa, aí o silêncio de dias. Quando a gente aprendeu a pedir uma pausa, o caminho mudou."
   `planta` com `titulo: "O caminho da briga"`, `comodos`: "Comentário" → "Defesa" (`alerta`) → "Silêncio de dias" (`alerta`), `percurso.bloqueado` no "dias"; depois um `destaque` (chave) "Pedir uma pausa", ou uma segunda `planta` com "Comentário" → "Pausa" → "Conversa", sem bloqueio.

Outros usos: as etapas de um atendimento (vendas), as partes de uma aula, os cômodos de um "dia ideal", o caminho de um pedido até a entrega, as paradas de uma viagem. Se a fala tem uma lista solta sem caminho, use `topicos`; se tem uma ordem que se percorre ou um lugar onde trava, use a `planta`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa, medida nem fato.
- Ilustrativo só onde o bloco permite: a planta livre ("SEM ESCALA"), o gráfico de tendência e o número com `ilustrativo: true` (a etiqueta fica visível).
- No modo desenho técnico, móveis "de composição" (que a pessoa não citou) podem entrar para o ambiente parecer real, mas nenhuma cota com número que não foi dito.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **"A assinatura não cabe no assunto"**: ela é o estilo. Procure na fala um caminho, uma rotina, um processo ou as partes de um todo e use a planta livre (veja acima).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Cômodo com texto apertado**: use menos cômodos (5 é o limite confortável), encurte o texto ("compram por impulso" → "Impulso") ou passe a planta para a prancha cheia (`"layout": "cheia"`).
- **Rosto cortado ou pequeno demais numa caixa**: ajuste `caixas` no plano (`zoom` menor mostra mais; `ancoraY` sobe ou desce o rosto). Veja `references/plano.md`.
- **Desenho técnico pequeno demais**: o ambiente está grande demais para a região; use um ambiente menor (em cm), mostre só a parte que importa, ou use a prancha cheia.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
