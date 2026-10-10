---
name: modelo-agenda
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Agenda: a tela vira um app de agenda limpo e sem marca, a pessoa é o compromisso de vídeo que muda de lugar a cada momento (tela cheia com cartão no peito, larga em cima, numa raia ao lado, no canto), e as ideias caem como blocos de agenda na hora em que são ditas (listas, passos numa linha do tempo, números no anel do cronômetro, comparações em dois dias, gráficos sobre a régua), com tomate, verde e ardósia e a linha do agora varrendo a página. Serve para qualquer assunto (o exemplo do modelo é produtividade, mas funciona com cripto, finanças, saúde, vendas, histórias, aulas): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Agenda\", \"estilo agenda\" ou \"estilo planner\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Agenda

O vídeo vira um app de agenda bem desenhado que se monta enquanto a pessoa fala. Ela abre em tela cheia, com um cartão branco no peito; quando explica algo, encolhe e vira o compromisso de vídeo dentro da folha da agenda, e as ideias caem em volta dela como blocos que se encaixam nos seus lugares a lápis. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com produtividade (a técnica Pomodoro), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo espera "a lápis" (contorno tracejado, palavra apagada) e, na palavra dita, **cai e assenta** como um bloco de agenda: vem um pouco de cima e maior, com sombra alta, e pousa no lugar com sombra baixa, sem quique. Palavras sobem de trás de uma régua no seu tempo; números contam enquanto o anel do cronômetro se enche; a linha do tempo se enche até o passo dito. Entre dois momentos na folha, **a linha do "agora" (tomate, com uma bolinha) varre a página** de cima para baixo: acima dela já está o momento novo, abaixo ainda o anterior. A pessoa muda de lugar na mesma hora, em 0,6 s.
- **Organização e hierarquia:** uma ideia por momento. Na folha, o conteúdo fica do lado ou embaixo da pessoa, nunca por baixo dela: título do momento no alto, itens como blocos empilhados ou marcadores numa linha. O item da vez é tomate cheio; os anteriores ficam ardósia claro. Rótulos em caixa alta pequenos, texto principal grande. A régua de horas à esquerda mostra horários quando eles foram ditos (ou a ordem, quando não foram).
- **Tipografia:** uma fonte só, Golos Text (Google Fonts), 600 a 800, com números tabulares. Títulos de 56 a 104 px, itens de 40 a 72 px, nada abaixo de 30 px. Todo texto é medido: diminui até caber em 2 ou 3 linhas, nunca vaza.
- **Moldura da pessoa:** é o compromisso de vídeo da agenda. Tela cheia (rosto na linha do centro, etiqueta "câmera · nome · área" no alto) para abertura, destaque, pergunta e fechamento, com um cartão branco no peito, abaixo do queixo. Na folha, uma caixa de cantos redondos com fio e sombra baixa: **larga em cima** (952×620), **em pé na raia da direita** (432×820), **pequena no canto** (340×420) ou **grande no alto** (952×680). Momentos seguidos na folha alternam o lugar. O rosto é seguido quadro a quadro; em gravações muito perto da câmera, o zoom das caixas estreitas desce para a cabeça caber.
- **Cores, textura e som:** fundo de app cinza-frio, folha branca, tinta quase preta. **Tomate** = o principal, o item da vez, ênfase e alerta; **verde** = o certo, pausa, o que passa; **ardósia** = neutro, o que já passou. Sombras baixas e macias, nada de brilho. Sons tonais e raros: um "toc" grave quando um bloco assenta, notas que sobem nos itens, um traço grave no risco, duas notas quando algo se conclui ou é salvo.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Estudos"): vão na etiqueta do compromisso de vídeo. Sem resposta, siga sem nome (a etiqueta some).

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

Números costumam vir em algarismos ("25 minutos", "83 mil") — ótimo, o template casa algarismo com palavra falada.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições. Itens curtos marcados `[sem fala, sai]` podem ser um número curto que o Whisper perdeu ("Um:"); meça o volume antes de tirar (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio, perto de −20 dB é fala.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais) não são tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as trocas de momento escondem os cortes** (a pessoa muda de lugar em cima do pulo); dois momentos seguidos em tela cheia alternam o enquadramento (1 ↔ 1,06) e um corte no meio de um trecho ganha uma troca seca de enquadramento. Pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.50 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa gravação vertical em 9:16 (a pessoa é reposicionada dentro da agenda); gravação horizontal vira 3:4 e o template amplia para encher a tela cheia. Não precisa passar `--recorte`. Os cartões no peito começam abaixo do queixo (o template lê a `zona`). Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul deve cair no rosto **dentro da caixa da pessoa** (roxa tracejada) e a linha vertical fina marca o centro do quadro; a moldura laranja tracejada é a folha da agenda (de 110 a 1540 px); a faixa amarela é onde ficam os cartões no peito com a pessoa em tela cheia (o queixo tem que ficar acima dela); a linha vermelha é o limite da interface do app embaixo. Para ver a cruz em vários lugares da pessoa, peça guias em tempos de momentos diferentes (`node scripts/stills.mjs --guias 1 5 10`). Se a cruz não estiver no rosto, refaça o passo 4 com medidas melhores.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`blocos`, e se couber `ciclos`) entra pelo menos uma vez**, mesmo que o assunto não tenha horário nenhum: veja "A assinatura em qualquer assunto".

Alterne tela cheia e folha: depois de um ou dois momentos na folha, um destaque, uma pergunta ou um número em tela cheia, e vice-versa. Abra e feche em tela cheia (a abertura, ou um número no primeiro momento, e o `cta`).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `agenda`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, passo ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "Testa técnica": "Testa a técnica" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe e dá para ler (nada cortado, nada embaixo da caixa da pessoa)?
- cada bloco cai na palavra certa e o título acende na fala?
- a pessoa está bem enquadrada em cada lugar (cabeça inteira nas caixas estreitas, queixo acima do cartão no peito)?
- nada parado mais de ~2,5 s?
- nas trocas, nenhum quadro vazio nem dois textos um sobre o outro? Peça quadros no meio de duas ou três trocas (o `de` do momento + 0,1 s e + 0,3 s, por exemplo `node scripts/stills.mjs 8.7 8.9`): a linha do "agora" está varrendo a página, com o momento novo acima e o anterior abaixo?

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-agenda.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curvas de tendência, números marcados `ilustrativo`);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um número que você não pôde confirmar).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `gancho`) | tela cheia: cartão branco no peito, o título se monta na fala a partir do lápis; o `destaque` fica tomate; se houver blocos de tempo no plano, o dia em miniatura acende embaixo. O `gancho` (pergunta, avisos que se amontoam e resposta) continua valendo |
| lista | `topicos` | na folha: cada item é um bloco que cai no seu lugar a lápis; o da vez fica tomate, os anteriores ardósia; título do momento no alto; com 4 ou 5 itens a pessoa vai para a raia |
| passos | `passos` | na folha: a linha do tempo da agenda; cada passo acende o marcador numerado, a linha tomate se enche até ele, o realce anda e os passos feitos ganham ✓ |
| número | `numero` | o anel do cronômetro: o número conta em pt-BR enquanto o arco se enche (em %, até a porcentagem) e a marcação "agora" segue girando; na folha, anel grande com o rótulo ao lado ou embaixo; no primeiro momento do vídeo, um widget no peito |
| comparação | `comparacao` | na folha: dois "dias" lado a lado (ou um embaixo do outro), rótulo em caixa alta e um bloco que cai em cada; × no meio (`contra`) ou seta; o errado é riscado, o certo fica verde com ✓, o vencedor fica tomate com ✓ |
| gráfico | `grafico` | sobre as linhas da régua: `barras` = colunas de cantos redondos que sobem (a da vez tomate); `linha` = pontos que caem ligados por traço tomate; `pizza` = o anel dividido em arcos com legenda; sem números ditos = a curva tracejada a lápis se desenha em tomate, com a etiqueta ILUSTRATIVO. Com título, a pessoa vai para o canto e o gráfico ocupa a largura toda |
| destaque | `destaque` | tela cheia: um bloco cai no peito; `alerta` = tomate cheio com aviso; `chave` = branco com grifo tomate que se desenha |
| definição | `definicao` | na folha: o termo cai num bloco tomate e, no significado, o bloco se abre para baixo como um evento aberto |
| frase | `frase` | a pessoa grande no alto, a agenda inteira vira a linha do dia e a marcação a conclui bloco a bloco; a frase se monta embaixo (a primeira parte maior), `destaque` em tomate, `risco` riscado |
| pergunta | `pergunta` | tela cheia: um convite de agenda com "?" tomate; as `opcoes` são botões de resposta que acendem na fala |
| fechamento | `cta` | tela cheia: o cartão de lembrete com botão (Salvar, Seguir, Comentar, Abrir) que afunda na palavra, o título da fala, o dia em miniatura e etiquetas |
| **assinatura** | `blocos` | na folha: blocos de agenda caem nos seus lugares a lápis, com título da fala; com `minutos`, a altura é a duração e a régua mostra os horários; sem `minutos`, blocos iguais na ordem dita; `sem` = o que fica de fora, riscado; `cronometro` = o anel conta o bloco |
| **assinatura** | `ciclos` | a pessoa vai para o canto e o que está na agenda se repete para baixo, um ciclo por palavra; o anel vira contador (com número, ou com o rótulo no centro quando a fala não diz quantas vezes) |
| lista de afazeres | `tarefas` | a pessoa em cima e uma lista com caixinhas que se marcam com ✓ tomate |

## A assinatura em qualquer assunto

A agenda mostra **"o que acontece e em que ordem"**: um plano, uma rotina, um programa, o que vem antes e o que vem depois, o que fica de fora. Quase toda fala tem isso, mesmo sem horário: as partes de uma aula, a ordem certa de fazer algo, um hábito que se repete, o que alguém faz todo dia. Os horários e as durações são opcionais:

- **Sem horário nem duração:** escreva os blocos sem `minutos`. Eles caem iguais, na ordem dita, e a régua mostra o número de cada um (ou o `quando` que você escrever: "Antes", "Depois", "Todo dia"). A agenda não mostra horário inventado.
- **Horário dito** ("às seis da tarde"): `inicio: "18:00"` no bloco; a régua mostra 18:00.
- **Duração dita** ("25 minutos de foco"): `minutos: 25`; a altura é a duração, os horários se somam e o `cronometro` pode contar.
- **O que fica de fora:** `sem` (entra na palavra e é riscado na seguinte).
- **Repetição** ("todo dia", "durante anos", "a cada quatro"): `ciclos` depois dos blocos; sem número dito, `contagem: false` e o rótulo no centro do anel.

Três exemplos fora da produtividade:

1. **Finanças/cripto.** "Gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro."
   `blocos` com `agenda: "Aula gratuita"` (o cabeçalho da folha troca de nome): "O mercado" (em "mercado") → "Os riscos" (em "os") → "A escolha dos ativos" (em "a escolha"), todos `foco` e sem `minutos`; `sem`: "Promessa de lucro" (em "sem", riscado em "lucro").
2. **Saúde e rotina.** "Acordo às seis, tomo água, faço dez minutos de alongamento e só depois pego o celular."
   `blocos`: "Acordar" (`inicio: "06:00"`, em "acordo") → "Água" (em "água") → "Alongamento" (`minutos: 10`, em "alongamento"); `sem`: "Celular" (em "só depois", riscado em "celular"). Sem duração dita na água, ela fica sem `minutos`.
3. **História pessoal.** "Todo dia, às seis da tarde, um senhor sentava no mesmo banco da praça. Durante anos, ninguém perguntou nada."
   `agenda: { "titulo": "Um senhor", "dia": "Todo dia" }`; `blocos`: "No mesmo banco da praça" (`inicio: "18:00"`, `foco`, em "no"); depois `ciclos` com um item em cada palavra de "Durante anos, ninguém perguntou", `rotulo: "anos"`, `contagem: false`: o compromisso das 18:00 se repete dia após dia.

Outros usos: as etapas de uma consulta ou de um tratamento; o roteiro de uma viagem; a ordem de uma receita (`blocos` com o tempo de forno); a rotina de estudos para uma prova; o "antes e depois" de uma decisão (`quando: "Antes"` / `"Depois"`).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, horário, duração, nome, preço nem fato. Bloco sem duração dita fica sem `minutos`; gráfico sem números ditos usa `tendencia` com `ilustrativo: true`.
- Número ilustrativo só onde o bloco permite (`numero` e `grafico` com `ilustrativo: true`), sempre com a etiqueta ILUSTRATIVO visível.
- Nenhum texto de tela pode citar ferramenta de edição de vídeo.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta, a assinatura ausente) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure na fala uma ordem (primeiro, depois), um programa (as partes de algo), uma rotina ou uma repetição, e use `blocos` sem `minutos` (veja acima).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Um bloco cai antes ou depois da palavra**: o `em` dele está errado. Confira em `work/palavras.json` e mova.
- **O título de um bloco entra todo de uma vez, sem acompanhar a fala**: as palavras do `titulo`/`texto` não foram achadas na fala daquele momento. Use as palavras que a pessoa diz, na ordem em que diz.
- **Texto pequeno demais ou em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **A cabeça aparece cortada na caixa larga em cima**: acontece em gravações muito perto da câmera (o rosto ocupa a largura toda). As caixas estreitas já se ajustam sozinhas; se incomodar, prefira blocos com a pessoa na raia (`"pessoa": "lado"`).
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução; o vídeo sai menos nítido. Avise o usuário.
