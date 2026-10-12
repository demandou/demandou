---
name: modelo-etapas-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Etapas. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Etapas, o formato viral \"explicador + gravação de tela\": abre com a pessoa em tela cheia e um cabeçalho fixo numa coluna ao lado do rosto (logo, ícones do processo e pílula de título), passa para a tela dividida da aula 9 do curso (gravação de tela real no quadro da esquerda, pílula com o nome de cada etapa na borda de baixo da tela, a pessoa na moldura da direita com o rosto centralizado e acompanhado, legenda na área segura de baixo), recapitula numa grade 2x2 numerada e fecha com a pessoa em tela cheia e um CTA de palavra-chave. Só corte seco, sem mexer na cor do vídeo. Serve para qualquer processo em etapas, método, fluxo ou lista: a IA captura prints de páginas públicas ou usa os do usuário. Use quando o usuário pedir \"modelo Etapas\", \"explicador com gravação de tela\", \"tela de um lado e eu do outro com rótulo da etapa\", ou quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação à esquerda)."
---

# Modelo Etapas (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Etapas no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: a mesma fonte, o mesmo laranja, a pílula que troca em seco, a gravação de tela que rola com cursor, a grade numerada, a legenda minúscula e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** Nos modos A e C a pessoa fala em tela cheia (o vídeo deitado inteiro, sem recorte vertical), com a legenda na área segura de baixo. A tela (modo B) abre **só quando acrescenta clareza** à fala e volta para a pessoa quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** No modo B a pessoa vai para a **moldura da direita** (x 1216 a 1920, altura toda), com o rosto centralizado nela e acompanhado com ajuste suave, sem saltos nem cortes no rosto; a **tela** fica no quadro da esquerda (x 80, y 100, 1056 × 760, fundo preto em volta), com a pílula da etapa centrada na borda de baixo dela. A legenda fica embaixo, centrada na moldura.
- **O cabeçalho (modo A) vira coluna:** logo, ícones e pílula de título empilhados numa coluna de 440 a 600 px ao lado do rosto (à esquerda dele quando a pessoa está no meio ou à direita da gravação), na altura do rosto e acima da legenda. O rosto anda um pouco para o outro lado, sem nunca ser coberto.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s. O `cortar` deitado só corta pausas de 0,45 s ou mais e o `justar` deixa ~0,3 s de respiro: a respiração natural fica.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira o explicador viral de processo em etapas: começa com a pessoa em tela cheia e um cabeçalho que promete o tema; no primeiro corte a tela se divide (gravação de tela real no quadro da esquerda, a pessoa na moldura da direita) e uma pílula laranja nomeia cada etapa, trocando em seco na frase que a abre; os prints do mesmo assunto mudam o tempo todo ("muita coisa acontecendo"); no fim, uma grade numerada recapitula e o rosto volta em tela cheia para a parte pessoal e o CTA. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, capturar prints, conferir, renderizar); você faz a de editor (as tomadas, o mapa das etapas, quais prints, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um prompt em quatro peças (Papel, Tarefa, Contexto, Formato), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O DNA deste formato

Vem da decupagem de um Reel de fluxo de agentes com 446 comentários. Reproduza só o que o Reel tem; nada extra.

1. **A primeira palavra sai em até 0,1 s e o primeiro quadro já é o layout final**: cabeçalho, pessoa e legenda completos, sem fade, sem logo de entrada, sem silêncio. O `cortar` e o `justar` fazem isso (o vídeo já começa na fala).
2. **Gancho de até 3 s**: uma afirmação contrária ao que se diz por aí ("X não é hype pra quem sabe o que construir"), dita com a pessoa em tela cheia (modo A). A `abertura` cobre o gancho e a frase que promete o tema.
3. **Cabeçalho fixo de 3 camadas** numa coluna ao lado do rosto, do primeiro quadro até o primeiro corte para a tela: logo (quadrado laranja com estrela), ícones do processo ligados por setas (um por etapa, 2 a 5) e uma pílula laranja de 1 ou 2 linhas com o título do formato (`texto` + `sub`). Estático, sem animação.
4. **Cada etapa tem uma pílula-rótulo** (nome da função em caixa-alta, laranja, ícone à esquerda, até 724 px, centrada na borda de baixo da tela, a junção da tela com o quadro). O texto **troca em seco** no instante da frase que abre a etapa ("o segundo agente…"). É a `etapa`.
5. **Layout de prova (modo B)**: gravação de tela no quadro da esquerda (1056 × 760 px, x 80, y 100, fundo preto em volta), a pílula na borda de baixo dela e a pessoa na **moldura da direita, na altura toda** (704 px de largura): rosto centralizado na largura, topo da cabeça em y ~180 com folga em cima, ombros e peito visíveis, legenda embaixo, centrada na moldura. O rosto nunca é coberto e a pessoa nunca fica só com a cabeça.
6. **As telas entram em corte seco na primeira palavra da etapa**; na parte rápida, a tela troca a cada 0,3 a 1,0 s com prints **diferentes do mesmo assunto** (páginas diferentes ou pontos diferentes da mesma página). O objetivo é "muita coisa acontecendo", não seguir palavra por palavra.
7. **Um único dissolve de ~1 s** para mostrar antes/depois (`dissolve: true` na tela do depois). Todo o resto é corte seco.
8. **Recapitulação**: uma `grade` 2x2 com os prints das etapas, círculos laranja numerados 1 a 4, por ~3 a 4 s, logo antes do número-prova.
9. **A prova numérica** ("quatro reuniões marcadas") vai com um print real parado (`prova`), ~6 s: agenda, painel, e-mail, resultado.
10. **Volta à pessoa em tela cheia, sem nada** (modo C) para a parte pessoal/opinião e para a oferta, em corte seco.
11. **Em tela cheia e na moldura, salto de escala de 8 a 15% a cada ~2 a 6 s** para não ficar plano estático. Salto, nunca zoom animado. A câmera do template faz sozinha (também a cada troca de etapa). Em tela cheia o menor salto ainda cobre o quadro inteiro (o vídeo nunca deixa borda).
12. **Legenda em todo o vídeo**: minúscula, branca, sem caixa, sem cor de destaque, 2 a 3 palavras por vez, na área segura de baixo (topo em y ~846, nunca acima do queixo, nunca abaixo de y 984), em todos os modos: em tela cheia centrada embaixo do rosto, no B centrada na moldura.
13. **Ritmo de fala corrido, mas de aula**: tire o silêncio e as pausas excessivas, deixe ~0,3 s de respiro nos cortes e mantenha a respiração natural (pausas menores que ~0,75 s ficam). Não acelere como num anúncio.
14. **Fecha com oferta e CTA de palavra-chave** nos últimos ~8 s ("comenta CLAUDE que eu te mando o link"), e o vídeo termina na última palavra, sem tela final nem fade. Pergunte ao usuário **qual palavra-chave e qual promessa**; a legenda mostra a palavra entre aspas (`correcoes`: `{ "comenta claude": "comenta \"claude\"" }`).

**O que não tem:** motion graphic animado, transição (whoosh, glitch, flash), zoom animado, emoji, palavra colorida na legenda, caixa de legenda, tela final, logo do canal, efeito sonoro, mudança na cor da pessoa.

## Regras da revisão do Tiago (valem em toda edição)

1. **Margem segura:** nenhum texto, rótulo, cartão ou print importante encosta nas laterais. Margem lateral ≥ 80 px (96 px para texto em tela cheia), topo ≥ 100 px, e nada importante abaixo de y 984 (controles do player do YouTube). A tela respeita isso (x 80, y 100, 1056 × 760, termina em y 860; a pílula termina em y ~906).
2. **Sem tarja preta sobrando:** prints e telas **preenchem** a tela (cover, com recorte ou foco); nunca letterbox. No quadro deitado, o fundo em volta da tela é o preto do quadro da esquerda (a pessoa aparece uma vez só, na moldura da direita, que o vídeo sempre cobre inteira). Se a proporção do print não couber, mude o `zoom`/`rolar`/`foco` ou escolha outro print.
3. **Timing:** cada rótulo de etapa entra na palavra que o nomeia (±0,15 s) e o que está na tela é literalmente o que está sendo dito. Rode `node ferramentas/timing.mjs` (passo 7) e corrija todo desvio. Rótulo sem lógica com a fala é proibido.
4. **Texto sempre cabe no fundo dele:** pílula, cabeçalho, legenda e blocos medem o texto e reduzem a fonte ou quebram a linha; a letra nunca passa da caixa ou da faixa. Conferir nos quadros.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** nenhuma animação de entrada. Tudo é corte seco entre os modos A, B e C e entre as telas. Só se mexem: a página que rola devagar dentro da tela, o cursor que passeia, e o salto de escala do rosto em cada corte.
- **Organização e hierarquia:** três modos. A (a pessoa em tela cheia, o cabeçalho numa coluna ao lado do rosto, legenda embaixo), B (tela 1056×760 no quadro da esquerda, pílula na borda de baixo dela, a pessoa na moldura da direita com cabeça inteira, ombros e peito, legenda embaixo, centrada na moldura), C (a pessoa em tela cheia e a legenda embaixo). O modo vem do momento: `abertura` = A, `cta` ou nada = C, o resto = B.
- **Tipografia:** Manrope. Pílula em 800 caixa-alta com espaçamento leve; legenda em 700 minúscula, 36 a 52 px, sempre cabendo em 880 px (tela cheia) ou 560 px (moldura); se não couber, o corpo continua encolhendo. Texto medido com as larguras reais da fonte, nunca vaza.
- **Moldura da pessoa:** tela cheia nos modos A e C (o vídeo deitado inteiro, com o topo da cabeça onde foi gravado); no B, a moldura da direita na altura toda, com o rosto no meio da largura dela e o topo da cabeça em y ~180 em qualquer zoom, ombros e peito aparecendo. Rastreio de rosto ligado: na moldura a câmera acompanha o rosto com ajuste suave.
- **Cores, textura e som:** laranja `#D97757` como único destaque (pílula, logo, círculos numerados), branco na legenda, grafite quente `#17120F` nos blocos de texto. As telas são prints reais, claros ou escuros, como são. Sem som de efeito.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB, que também captura os prints das páginas). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **a palavra-chave e a promessa do CTA** ("comenta CLAUDE que eu te mando o link", "comenta e dá dois toques"), se a fala termina com uma chamada;
   - **se ele tem prints próprios** para as telas (o site dele, agenda, painel, e-mail, resultado). Se tiver, peça para pôr na pasta `imagens/` do projeto (criada no passo 1), com nomes que digam o que são (`agenda.png`, `email.png`). Eles passam na frente de qualquer página pública.

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela. Crie também a pasta `imagens/` lá dentro (para as imagens do usuário).

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas.

### 3. Escolher as tomadas e justar os cortes

Leia a lista como um editor (veja **Ritmo e cortes**, abaixo). Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, "é…" longos sozinhos, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (meça o volume: `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`; perto de −60 dB é silêncio, −30 dB ou mais é fala).

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Depois de escolher, deixe os cortes justos:

```bash
node ferramentas/justar.mjs --respiro 0.3
```

Ele transforma cada pausa longa entre trechos mantidos num corte com ~0,3 s de respiro. No vídeo deitado vale a regra da aula 9: corte a pausa excessiva, mas mantenha a respiração natural; por isso pausas menores que ~0,75 s (vírgulas, respiração, o tempo de entender) ficam inteiras, e o `cortar` deitado só corta pausas de 0,45 s ou mais.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.38 --queixo-y 0.55
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para a moldura e para a legenda. Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo (`rosto.rastro`): na moldura da direita a câmera mantém o rosto centralizado e acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; no modo B, a faixa rosa vertical é a costura entre o quadro da esquerda e a moldura da pessoa, a linha branca é a base da tela e a laranja é a base da pílula; no modo A, a faixa laranja clara é a coluna do cabeçalho (não pode cair no rosto); a azul é o queixo; a amarela é onde a legenda começa (e a largura dela); nada importante abaixo da linha vermelha (controles do player) nem nas faixas vermelhas das laterais (margem de 96 px). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Ele segue a espinha do Reel:

1. **Gancho (modo A)**: a primeira frase ou duas, até ~8 s no máximo (no vídeo completo, a abertura pode cobrir a apresentação do tema inteira). `abertura` com o título do formato (`texto`, `sub`) e `etapas` = quantas etapas a fala vai ter.
2. **Cada etapa que a pessoa enumera ("o primeiro…", "o segundo…", "a quarta peça…")**: uma `etapa`, com o nome da função na pílula (`rotulo`: uma ou duas palavras tiradas da fala) e de 3 a 6 telas que trocam a cada 0,3 a 1 s. Quando não há "agentes", a etapa é qualquer passo, peça, ferramenta, fase ou item do método.
3. **Recapitulação**: uma `grade` quando as etapas acabam ("todo esse fluxo…", "com essas quatro peças…").
4. **A prova ("o resultado")**: uma `prova` com um print real parado (agenda, painel, e-mail, resultado), só se o usuário tiver o print ou houver uma página pública que mostre aquilo. Sem print, use `numero` ou `destaque`.
5. **Virada, opinião, oferta e CTA (modo C)**: a pessoa em tela cheia. Um `cta` cobre a chamada final. Os trechos pessoais ficam sem momento (a tela cheia volta sozinha). No vídeo completo, alterne: a tela abre quando a fala mostra ou enumera algo e fecha quando a ideia termina; respiros de tela cheia de até ~8 s entre os blocos.
6. Para o que não é etapa (uma definição, um número, uma comparação, uma lista curta, uma pergunta), use os blocos universais; eles aparecem na tela do quadro da esquerda, no grafite, com a pessoa na moldura e a pílula opcional (`pilula`).

### 6b. Prints (as telas)

Os prints são o que a pessoa **mostraria na tela** ao falar. Não use o buscador de imagens: este modelo usa gravação de tela real.

1. Para cada etapa, liste 2 a 4 páginas públicas **sobre o assunto citado** (a página do produto, uma documentação, uma lista, um artigo, uma tabela) e, se o usuário tiver, os prints dele em `imagens/` (agenda, painel, e-mail, o site dele). Print do usuário vale mais que qualquer página pública.
2. `node ferramentas/capturar.mjs id=https://pagina id2=https://outra ...` captura a página inteira (1280 × 3000) em `public/img/` e registra em `plano.imagens`. Print do usuário: `node ferramentas/capturar.mjs --arquivo agenda=imagens/agenda.png`.
3. **Olhe cada captura** (abra `public/img/<id>.png` reduzida): página errada, aviso de cookie, banner enorme, erro 404, tela de login ou texto com o nome da ferramenta de edição = refaça com outra página. Material livre e tela de verdade; nada de interface desenhada à mão que pareça motion graphic. Sem página boa, use outra etapa do mesmo assunto antes de inventar.
4. Para a sensação de varredura rápida, use a mesma captura em pontos diferentes (`rolar: [0, 0.12]`, depois `[0.4, 0.5]`, depois `[0.75, 0.9]`) e capturas diferentes do mesmo assunto.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `momentos`, `semLegenda`, `correcoes` e, se quiser mandar na câmera, `camera`. `marca` pode ficar vazio (o Etapas não escreve o nome na tela). Cada momento vai de `de` a `ate`; o momento seguinte começa onde o anterior termina, e **o corte para o rosto limpo é um momento que acaba** (ou um `cta`).

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Os avisos "três etapa seguidos" e "em fora do começo de uma palavra" são esperados neste formato (as etapas são seguidas por natureza; a troca de tela não segue palavra). Reprovou: leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: cada rótulo de etapa e cada item na palavra que o nomeia (±0,15 s); corrija o `de`/`em` até sair **Tempo OK**;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "com o texto": "contexto" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- **modo A**: a pessoa em tela cheia, o cabeçalho completo na coluna ao lado do rosto, **sem cobrir o rosto**, a legenda embaixo;
- **modo B**: a tela ocupa o quadro da esquerda (até y 860); a pílula está centrada na borda de baixo dela com o texto inteiro; a pessoa está na moldura da direita com o rosto no meio da largura, a cabeça inteira com folga em cima, ombros e peito aparecendo; a legenda está embaixo, centrada na moldura; **o rosto nunca é coberto**;
- **modo C**: a pessoa em tela cheia, a legenda embaixo, nada mais;
- o print certo aparece na etapa certa, legível, sem banner nem aviso; o cursor aparece;
- a grade mostra os números 1 a N e cada print reconhecível;
- nada importante abaixo da linha dos controles do player (vermelha nas guias, y 984) nem nas margens laterais.

Gere também quadros em volta de cada troca de etapa (`node scripts/stills.mjs 4.4 4.5 4.6`): a pílula troca de uma vez, sem dois textos juntos. Corrija o plano e repita (no máximo duas rodadas).

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-etapas.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (quantas pausas viraram corte);
- o **mapa resumido** (que bloco e quais prints entraram em cada trecho);
- de onde vieram os prints (páginas públicas com o endereço, ou os do usuário);
- o que o usuário deve conferir (uma página capturada que ele pode trocar por um print próprio, a palavra-chave do CTA, uma palavra que a transcrição pode ter errado).

## Ritmo e cortes (cortar como editor)

- **Fala corrida, com ritmo de aula.** Corte pelas pausas reais (o `preparar` acha as pausas pelo áudio, o `justar` parte delas), nunca pelos tempos das palavras do Whisper. Se precisar ajustar à mão, meça o silêncio com `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`.
- **Respiro de ~0,3 s em cada corte** (`justar --respiro 0.3`, o padrão no 16:9), e a respiração natural fica (pausas menores que ~0,75 s não viram corte). Menos que isso a aula fica robótica.
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora do vídeo. **O que fica:** a vírgula e a respiração curta.
- **Cada corte e cada troca de etapa dá um salto de escala** na pessoa (em tela cheia e na moldura) (o template faz sozinho: ciclo de 8 a 15%, nunca o mesmo tamanho duas vezes seguidas, e um salto extra a cada ~3 s de rosto parado). É salto, nunca zoom animado.
- **Ritmo da tela:** a etapa troca de print a cada 0,3 a 1,0 s na parte rápida; a `prova` fica parada ~6 s; a `grade`, 3 a 4 s. O e-mail ou o resultado mostrado por 10 s sem corte só funciona se a pílula e a legenda mantêm o ritmo.
- **Ênfase:** num trecho importante sem corte, um "soco" de câmera (`camera: [{ "em": 3.18, "zoom": 1.12 }]`) no máximo uma ou duas vezes.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (1)** | `etapa` | a pílula laranja com o nome da etapa na borda de baixo da tela (troca em seco) e a tela do quadro da esquerda trocando de print a cada 0,3 a 1 s, com página que rola e cursor; a pessoa na moldura da direita; `dissolve` num único antes/depois |
| **assinatura (2)** | `grade` | a recapitulação: 2 a 5 prints numa grade na tela do quadro da esquerda, círculos laranja numerados |
| **assinatura (3)** | `prova` | um print real parado na tela do quadro da esquerda (opcional: pílula, zoom e foco num ponto) |
| abertura | `abertura` | modo A: a pessoa em tela cheia e o cabeçalho fixo numa coluna ao lado do rosto, com logo, ícones do processo ligados por setas e pílula de título em 1 ou 2 linhas |
| lista | `topicos` | tela grafite com título pequeno e linhas que entram na fala, marcador laranja na da vez |
| passos | `passos` | a mesma lista numerada, com um fio que desce até o passo da vez |
| número | `numero` | o número contando em pt-BR, enorme, com o `rotulo` embaixo |
| comparação | `comparacao` | duas metades da tela, cada uma no seu `em`; o vencedor fica, o outro apaga |
| gráfico | `grafico` | barras, linha ou rosca em osso com o item da vez em laranja; sem números ditos, curva com a etiqueta "ilustrativo" |
| destaque | `destaque` | a palavra-chave grande com ícone de traço; `nivel: "alerta"` inverte para osso |
| definição | `definicao` | o termo em 800 e o significado linha a linha |
| frase | `frase` | a frase em tipo grande, palavra por palavra |
| pergunta | `pergunta` | a pergunta e as `opcoes` em linhas |
| fechamento | `cta` | modo C: a pessoa em tela cheia; a chamada vai na legenda (com a palavra-chave entre aspas via `correcoes`), sem nada por cima |

## A assinatura em qualquer assunto

A assinatura do Etapas é **"um processo explicado etapa por etapa, com a prova na tela"**: a pessoa nomeia N partes, e cada uma ganha o nome numa pílula e imagens reais do que está sendo citado.

1. **Finanças/cripto.** "Tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `abertura` "Bitcoin nos 83 mil" / "Novo bull market" (3 ícones `sobe`); três `etapa`: "Compra por impulso" (prints de gráficos e de uma corretora pública), "Moeda sem critério" (a lista de moedas), "Risco que não entende" (a página de riscos); `grade` com as três; `cta` com "Saiba Mais".
2. **Saúde/rotina.** "Minha manhã tem quatro passos: água, luz do sol, proteína e caminhada."
   quatro `etapa` ("Água", "Luz do sol", "Proteína", "Caminhada") com páginas públicas de cada tema trocando a cada ~0,7 s; `grade` 1 a 4; `prova` com o print do relógio de saúde do usuário, se ele mandar.
3. **Carreira/relacionamento (história pessoal).** "Conheci minha esposa em três momentos: a faculdade, o estágio e a mudança de cidade."
   três `etapa` ("Faculdade", "Estágio", "Mudança") com as fotos e prints do usuário (`imagens/`) em vez de páginas públicas; sem foto, `frase` e `destaque` no lugar das telas. A `grade` reúne as três; o final volta ao rosto.

## Fidelidade

- Tudo na tela vem da fala; os rótulos podem ser resumidos com as palavras dela, sem mudar o sentido.
- A tela mostra **o assunto que foi dito**, nunca uma interpretação. Print errado é pior que um bloco de texto.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, com a etiqueta visível.
- Nunca escreva o nome da ferramenta de edição em tela nenhuma (nem num print capturado).

## Quando algo dá errado

- **`conferir.mjs` reprovou:** leia o trecho falado que ele aponta e escolha um bloco para ele (uma `etapa` se a fala enumera, `destaque` se tem uma palavra-chave, `numero` se tem número).
- **O rosto sai do lugar nas guias:** refaça o passo 4 com as medidas corrigidas; `node scripts/rastrear.mjs --conferir <segundos>` indica o que fazer.
- **A captura falhou ou veio com banner:** outra página do mesmo assunto, ou peça um print ao usuário (`--arquivo`). Para o Chrome, `npx remotion browser ensure`.
- **O vídeo é vertical:** o `cortar` usa uma faixa deitada em volta do rosto e a imagem fica ampliada (menos nítida); avise o usuário e peça a gravação deitada. Rosto muito pequeno no original deixa a moldura mole (o zoom da moldura vai até 1,6×): avise também.
- **Pouco material para 3 etapas:** use duas etapas + `destaque`/`topicos`; não repita o mesmo print sem mudar o ponto da rolagem.
