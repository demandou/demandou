---
name: modelo-aula
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Aula, a edição de um curso gravado em 16:9: o professor em quadro cheio na abertura e nas viradas, com cartões de papel; no modo slide, o slide branco ocupa ~62% da tela e se monta na fala (título palavra por palavra, itens, fórmula termo a termo, gráfico que se desenha, número que conta) enquanto o professor fica numa janela arredondada ao lado, seguindo o rosto; cartão de capítulo, barra de progresso da aula e cartão de resumo; papel claro, tinta azul-noite e um violeta. Serve para qualquer assunto (o exemplo é juros compostos, mas funciona com finanças, saúde, vendas, idiomas, treinamentos): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Aula\", \"estilo Aula\", \"videoaula\", \"aula gravada\", \"edição de curso\" ou \"vídeo com slides\". Entrega um MP4 horizontal 1920×1080 (16:9) para curso e YouTube."
---

# Modelo Aula

O vídeo vira uma aula de curso online editada por profissional, deitada (16:9). O professor abre a aula em quadro cheio, com a capa da aula ao lado; quando a fala traz conteúdo, ele **vai para uma janela arredondada ao lado** e o **slide ocupa ~62% da tela e se monta na fala**: o título palavra por palavra, os itens um a um, a fórmula escrita termo a termo, o gráfico que se desenha, o número que conta. Nas viradas (a ideia-chave, o alerta, o fechamento) o professor volta para o quadro cheio. No alto, a barra de progresso da aula; no fim, o cartão de resumo. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de professor-editor: as tomadas, o mapa da fala, os slides e a conferência dos quadros.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma aula de juros compostos, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

**Formato:** este modelo entrega **16:9 (1920×1080) para curso e YouTube**. Gravação deitada entra inteira; gravação vertical funciona, mas o vídeo vira uma faixa deitada em volta do rosto (avise o usuário que perde definição e que o ideal é gravar deitado).

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** dois modos que se alternam sozinhos, sempre com **troca seca, como um corte**: a janela nunca passa por cima do texto do slide e nenhum texto fica cortado ao meio. **Modo professor:** quadro cheio; cortes seguidos alternam a câmera (1,0 ↔ 1,12) e cada tomada aproxima devagar; o cartão de papel aparece e some junto com o corte. **Modo slide:** o professor vai direto para a janela e o conteúdo do slide entra no lugar (aparece e sobe 12 px em 0,22 s); depois tudo entra na palavra dita (palavras sobem 10 px, linhas se desenham, números contam, termos acendem com o marca-texto violeta e assentam em tinta quando o próximo é dito). Slide seguido de slide: o conteúdo de um sai (0,16 s) e o do outro entra no lugar, nunca os dois juntos. No fim (`cauda`), o professor sai e o resumo vai para o centro. Nada fica parado mais de ~2,5 s.
- **Organização e hierarquia:** uma ideia por slide. No alto do slide, o sobretítulo violeta em caixa alta e o título grande; embaixo, o conteúdo (itens, fórmula, gráfico, número) e, no último slide, o resumo. A janela do professor fica do lado em que ele foi gravado; o slide, no outro. No modo professor, os cartões ficam embaixo no lado livre, todos com a mesma largura (cobrem o que estiver na mesa ao lado da pessoa). A barra de progresso (aula, título, um trecho por seção e o nome da seção) fica no alto, nos dois modos, desde o quadro 0. Margem segura de 96 px nas laterais e 64 px no alto; nada abaixo de y 984 (controles do player).
- **Tipografia:** **Plus Jakarta Sans** (600 a 800) para tudo que se lê, títulos 800 com tracking −0,025em; **STIX Two** (itálico para as letras, como nos livros) só nas fórmulas e variáveis, grandes e bem espaçadas. Títulos de slide 40 a 64 px; capa até 112 px; itens 26 a 52 px; barra de progresso 28 a 30 px; nome do professor 34 a 38 px; nada abaixo de 22 px (no 16:9 tudo é visto menor: pense num celular deitado). Texto medido com a fonte real: diminui para caber, nunca vaza.
- **Moldura da pessoa:** quadro cheio no modo professor (seguindo o rosto); no modo slide, janela arredondada de 520×660 com moldura branca, a cabeça inteira e folga, seguindo o rosto quadro a quadro. Nunca coluna estreita, nunca o rosto coberto.
- **Cores, textura e som:** papel claro `#ECEAE4` com quadriculado bem leve, folha branca, tinta azul-noite `#161B2E`, cinza `#5F6678` e **um** acento, o violeta `#6B3BF2` (marca-texto `#E7DEFF`); vermelho `#E5484D` só no risco e no errado. **Nada de lousa verde**, nada de preto e dourado. **Nunca** filtro, LUT, brilho ou halo sobre a pessoa. Sons tonais e baixos: um "virar de página" nas trocas de modo e de slide e um toque quando a fórmula fecha (`"sfx": false` desliga). Nunca sino. **Sem legenda por padrão** (o slide já escreve o essencial; texto igual à narração por cima de um gráfico atrapalha o aprendizado); `"legendas": true` liga uma legenda discreta.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **nome e área** de quem dá a aula (vão no cartão de capítulo ou na janela; sem resposta, siga sem nome);
   - **o número e o título da aula** ("Aula 3 · Juros compostos", "Módulo 2 · Aula 1"); sem resposta, use só o título tirado da fala e nenhum número;
   - **se quer legenda** (o padrão é sem; num curso para quem assiste sem som, ligue).

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela.

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas. Ele avisa que o modelo entrega 16:9.

### 3. Escolher as tomadas e justar os cortes

Leia a lista como um editor (veja **Ritmo e cortes**, abaixo). Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, "é…" longos sozinhos, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (meça o volume: `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`; perto de −60 dB é silêncio, −30 dB ou mais é fala).

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Depois de escolher, deixe os cortes justos:

```bash
node ferramentas/justar.mjs --respiro 0.24
```

Ele transforma cada pausa de 0,38 s ou mais entre trechos mantidos num corte com ~0,2 s de respiro (aula pede um pouco mais de respiro que um vídeo de YouTube: quem assiste está anotando). Pausas menores (vírgulas) ficam como estão.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.66 --rosto-y 0.31 --queixo-y 0.42
```

O `modelo.json` do template pede `"formato": "16:9"`: o vídeo de trabalho sai em 1920×1080 (a gravação deitada entra inteira, sem recorte). Não passe `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, aula e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a janela acompanha quando a pessoa se mexe. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento e o tempo das palavras

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; o retângulo amarelo é a margem segura; os verdes são o slide e a janela (no modo slide); nada importante abaixo da linha vermelha (controles do player). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

Repare **de que lado a pessoa está**: a janela fica desse lado e o slide do outro; no modo professor, os cartões entram no lado livre.

**O tempo das palavras.** Na Aula cada termo da fórmula e cada número entram na palavra exata. Se o `preparar` avisou "tempos do Whisper quebrados" num trecho, ou se a fala tem uma fórmula, uma conta ou uma lista ditada devagar, confira:

```bash
node ferramentas/ataques.mjs --de 14.8 --ate 19.5
```

Ele mostra o volume de 20 em 20 ms e os **ataques** (onde a voz volta depois de uma pausa). Palavras ditas pausadamente começam nesses ataques. Corrija o `em` dessas palavras (e o `ate` da anterior) em `src/plano.json → palavras` e em `work/palavras.json`.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Na Aula a pergunta é: **onde o professor fala com o aluno (modo professor) e onde ele ensina um conteúdo (modo slide)? Cada conteúdo vira qual slide?**

1. **Abertura da aula:** "nesta aula", "hoje você vai aprender" vira `capitulo`: a capa já aberta no quadro 0 (número, título e nome do professor), e a fala acende o número e as palavras do título. Gancho sem título de aula vira `abertura`.
2. **Slides (a assinatura, pelo menos 1 vez):** todo conteúdo vira slide, um por ideia. Fórmula, regra, sigla ou expressão ditada → `slide` com `formula` (termo a termo). Lista de pontos, regras, erros → `slide` com `itens` (ou `topicos`). Etapas em ordem → `passos`. Um número dito → `numero` (com `desde` quando sai de um valor para outro; ele conta em 0,36 s a partir do `em`: ponha o `em` na primeira palavra do número, para chegar no valor enquanto ele é dito). Duas coisas comparadas → `comparacao` ou um `grafico` com `series` (qualitativo). Termo novo → `definicao`. Exercício, pergunta para o aluno → `pergunta`.
3. **Viradas (modo professor):** a ideia-chave dita para a câmera ("e aqui está o segredo", "no composto…"), um alerta, uma frase forte → `destaque` ou `frase` em quadro cheio. Coloque a virada **num corte** quando der (o professor volta seco). Uma virada dentro de um slide interrompe o slide; depois ele continua de onde estava.
4. **Resumo (no fim):** o último slide ganha `resumo`: 2 a 4 frases curtas **do que já foi dito** ("Simples: sobre o valor inicial"), que entram em sequência numa palavra do fim ("anota", "resumindo", "então"). Para o resumo (e a fórmula completa) ficar legível ≥ 1,2 s mesmo quando a fala acaba nele, use `cauda`: logo depois da última palavra o professor sai da janela, o slide vai para o centro e o vídeo segue até ~1,2 s depois da última palavra (`duracao`).
5. **Seções:** cada mudança de assunto vira uma seção da barra de progresso (`aula.secoes`), com um nome curto na voz da fala.
6. **Fechamento:** "comenta", "baixa o material", "próxima aula" vira `cta` em quadro cheio.
7. Respiros só com o professor em quadro cheio (até 3,5 s) são bem-vindos entre ideias.

### 7. Planejar os momentos

Leia `references/plano.md` (campos, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `aula`, `momentos`, `legendas`, `semLegenda` e `correcoes`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: cada coisa na palavra que a nomeia (±0,15 s), cada termo da fórmula na palavra dita, cada número dito, cada frase do resumo já dita antes. Corrija até sair "Tempo OK";
- com legenda ligada, `node scripts/legendas.mjs` lista as linhas.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `"sob": "sobre"`, `"1.000,00": "1.000"`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida a ~540 a 960 px de largura** e confira:
- o rosto nunca está coberto; na janela, a cabeça inteira com folga;
- no modo slide, o slide e a janela não se encostam; nada vaza da folha;
- cada coisa aparece quando a palavra é dita, e é **aquilo** que foi dito (a fórmula termo a termo, o número dito, nada a mais);
- o texto cabe, está legível e nada encosta na margem nem desce abaixo da linha do player;
- **nas trocas** (professor ↔ slide, slide ↔ slide, a cauda), nenhum quadro com dois textos um sobre o outro, texto cortado ou cartão meio transparente: confira 4 quadros em cada troca (`node scripts/stills.mjs 3.05 3.14 3.22 3.36`);
- nenhuma caixa vazia nem gráfico "esperando"; nenhum slide só com o título por mais de ~1,5 s;
- no modo professor, o cartão cobre o que distrai na mesa (ele fica embaixo, no lado livre).

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-aula.mp4"
```

Ele confere o plano de novo, renderiza em 1920×1080 e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho, os slides, as viradas e as seções);
- o que é ilustrativo (gráficos sem números);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, o número e o título da aula).

## Ritmo e cortes (cortar como editor de curso)

- **Corte pelas pausas reais, nunca pelos tempos das palavras.** O `preparar` acha as pausas pelo áudio e o `justar` parte delas.
- **Respiro de 0,2 a 0,25 s em cada corte.** Aula é um pouco mais calma que um vídeo de YouTube, mas pausa longa sobrando parece erro.
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora da aula. **O que fica:** a pausa antes de uma conta ou de uma fórmula (é quando o aluno pensa).
- **Um slide por ideia.** Troque de slide num corte ou na primeira palavra da ideia nova; deixe o slide anterior até lá.
- **Virada com juízo:** no máximo uma a cada ~10 s, de preferência num corte; uma aula inteira em quadro cheio vira conversa, uma aula inteira em slide perde o professor.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (slide)** | `slide` | modo slide: folha branca (~62%) com sobretítulo, título palavra por palavra (marca-texto no `destaque`), `itens` que entram um a um, `formula` escrita termo a termo (o termo da vez acende; completa, ganha a moldura violeta e o lápis), `termos` que acendem de novo e `resumo` no pé; o professor na janela ao lado |
| capítulo | `capitulo` | modo professor: a capa da aula embaixo no lado livre, já aberta (número, chamada opcional, título grande, nome do professor); a fala acende o número e cada palavra do título com o marca-texto, e o traço violeta se desenha |
| abertura | `abertura` | modo professor: cartão com o gancho palavra por palavra, marca-texto no `destaque` |
| lista | `topicos` | modo slide: linhas que entram na fala; quadradinho violeta na da vez, as anteriores em cinza |
| passos | `passos` | modo slide: selos 1, 2, 3 ligados por um fio violeta que desce até o passo da vez |
| número | `numero` | modo slide: ocupa a folha inteira, centrado; com `desde`, o valor de partida em cima, a etiqueta `via` ("1% ao mês"), a seta que desce e o valor final grande em violeta, contando em 0,36 s; sem `desde`, o número grande e a barra que enche |
| comparação | `comparacao` | modo slide: duas colunas com "vs" ou "→"; o vencedor acende em violeta com o visto, o outro apaga (riscado em vermelho no errado-certo) |
| gráfico | `grafico` | modo slide: com `dados`, barras que crescem, linha ponto a ponto ou rosca; com `series` (sem números), as linhas qualitativas que se desenham na fala, a legenda com a nota, a linha de base e o sombreado da diferença; sempre "ilustrativo" sem números |
| destaque | `destaque` | modo professor (a virada): a palavra-chave grande no cartão embaixo do lado livre, com o marca-texto que passa por trás; `detalhe` embaixo |
| definição | `definicao` | modo slide: o termo enorme em violeta com o marca-texto, o fio e o significado palavra por palavra |
| frase | `frase` | modo professor: cartão com as aspas violeta e a frase palavra por palavra; `risco` riscado em vermelho |
| pergunta | `pergunta` | modo slide: "PERGUNTA", a pergunta palavra por palavra e as alternativas com letra; `certa` acende com o visto e as outras apagam |
| fechamento | `cta` | modo professor: cartão embaixo no lado livre com o ícone (salvar, comentar, link, seguir) e a chamada na fala |
| resumo | `resumo` (no `slide`) | no pé do último slide: linhas com visto que entram em sequência, o assunto em tinta e o resto em cinza |

## A assinatura em qualquer assunto

O slide representa **"agora presta atenção, que isto é o conteúdo"**: o professor dá espaço e o quadro se monta enquanto ele fala, como numa aula boa. Serve para qualquer explicação: regra, fórmula, lista, etapas, conta.

1. **Finanças/cripto.** "Mesmo na alta tem gente que perde: compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `slide` com `titulo: "Quem perde na alta"`, `destaque: "perde"` e três `itens` ("Compra por impulso" em "compra", "Escolhe moeda sem critério" em "escolhe", "Assume risco que não entende" em "assume"); o termo "alta" acende de novo quando é dito (`termos`).
2. **Saúde (hidratação).** "A conta é simples: trinta e cinco mililitros vezes o seu peso."
   `slide` com `titulo: "Quanto beber por dia"` e `formula`: `35 ml` em "trinta", `×` em "vezes", `peso` em "peso" (cada termo na palavra). Se a pessoa disser o próprio peso, um `numero` com o resultado dito.
3. **Idiomas / história pessoal.** "Em inglês, o passado regular é o verbo mais ED: work vira worked, play vira played."
   `slide` com `titulo: "Passado regular"`, `formula` `verbo` · `+` · `ed` (na fala "verbo", "mais", "ED") e `itens` "work → worked" e "play → played" nas palavras ditas. Numa história ("fui demitido, voltei a estudar e abri minha empresa"), `passos` com as três etapas e uma `frase` em quadro cheio na lição.

Outros nichos: vendas (as etapas do funil em `passos`, a taxa dita num `numero`), treinamento corporativo (a norma em `definicao`, o certo e o errado em `comparacao`), concursos (a pegadinha em `pergunta` com `certa`), receitas (ingredientes em `itens`, a proporção em `formula`).

## Fidelidade

- Tudo na tela vem da fala; títulos de slide e nomes de seção podem resumir com as palavras dela, sem mudar o sentido.
- A fórmula é **exatamente** a dita, termo a termo. Não acrescente unidades, índices nem passos que não foram falados.
- **Nunca mostre um número que não foi falado** (nada de valores mês a mês, totais ou porcentagens "de brinde"). Gráfico sem números ditos é qualitativo e leva a etiqueta "ilustrativo".
- O resumo só repete o que já foi dito antes dele.
- O número da aula vem do usuário; sem ele, não há número.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **`timing.mjs` acusou desvio**: use o `em` da palavra que nomeia a coisa em `work/palavras.json`. Se o tempo da própria palavra está errado (o termo aparece antes ou depois de ser dito), confira com `ferramentas/ataques.mjs` e corrija a palavra.
- **A fórmula não cabe**: ela diminui sozinha até ~56 px; com mais de ~12 termos, divida em dois slides (a fórmula e depois a aplicação).
- **A capa passa rápido demais**: o nome do professor só entra na capa quando ela fica ≥ 1,5 s na tela; senão ele aparece na janela, no primeiro slide.
- **Dois textos se sobrepõem numa troca**: o cartão do modo professor termina no `de` do slide (a troca é seca); dois slides seguidos: o `ate` de um é o `de` do outro. Para uma virada no meio de um slide, comece-a num corte.
- **A fala acaba na fórmula ou no resumo**: use `cauda` (o professor sai e o slide vai ao centro, legível ≥ 1,2 s). `cauda.de` + 0,35 s precisa caber no vídeo de trabalho.
- **A janela corta a cabeça**: a pessoa foi gravada muito perto da câmera; o template já aproxima menos quando o rosto é grande. Se ainda cortar, refaça o passo 4 conferindo `--rosto-y`.
- **A gravação é vertical**: o vídeo de trabalho vira uma faixa deitada do original (aviso do `cortar`); avise o usuário que o ideal para este modelo é gravar deitado.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
