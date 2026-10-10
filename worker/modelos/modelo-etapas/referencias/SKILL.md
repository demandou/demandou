---
name: modelo-etapas
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Etapas, o formato viral \"explicador + gravação de tela\": abre com o rosto grande e um cabeçalho fixo (logo, ícones do processo e pílula de título), passa para a tela dividida (gravação de tela real em cima, no máximo ~38% da altura, pílula com o nome de cada etapa na junção e a pessoa embaixo com cabeça e ombros e legenda abaixo do queixo), recapitula numa grade 2x2 numerada e fecha com o rosto e um CTA de palavra-chave. Só corte seco, sem mexer na cor do vídeo. Serve para qualquer processo em etapas, método, fluxo ou lista: a IA captura prints de páginas públicas ou usa os do usuário. Use quando o usuário pedir \"modelo Etapas\", \"explicador com gravação de tela\", \"tela em cima e eu embaixo com rótulo da etapa\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Etapas

O vídeo vira o explicador viral de processo em etapas: começa com o rosto grande e um cabeçalho que promete o tema; no primeiro corte a tela se divide (gravação de tela real em cima, o rosto embaixo) e uma pílula laranja nomeia cada etapa, trocando em seco na frase que a abre; os prints do mesmo assunto mudam o tempo todo ("muita coisa acontecendo"); no fim, uma grade numerada recapitula e o rosto volta em tela cheia para a parte pessoal e o CTA. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, capturar prints, conferir, renderizar); você faz a de editor (as tomadas, o mapa das etapas, quais prints, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um prompt em quatro peças (Papel, Tarefa, Contexto, Formato), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O DNA deste formato

Vem da decupagem de um Reel de fluxo de agentes com 446 comentários. Reproduza só o que o Reel tem; nada extra.

1. **A primeira palavra sai em até 0,1 s e o primeiro quadro já é o layout final**: cabeçalho, rosto e legenda completos, sem fade, sem logo de entrada, sem silêncio. O `cortar` e o `justar` fazem isso (o vídeo já começa na fala).
2. **Gancho de até 3 s**: uma afirmação contrária ao que se diz por aí ("X não é hype pra quem sabe o que construir"), dita com o rosto grande (modo A). A `abertura` cobre o gancho e a frase que promete o tema.
3. **Cabeçalho fixo de 3 camadas** no topo, do primeiro quadro até o primeiro corte para a tela: logo (quadrado laranja com estrela), ícones do processo ligados por setas (um por etapa, 2 a 5) e uma pílula laranja de 1 ou 2 linhas com o título do formato (`texto` + `sub`). Estático, sem animação.
4. **Cada etapa tem uma pílula-rótulo** (nome da função em caixa-alta, laranja, ícone à esquerda, ~67% da largura, centrada na junção entre a tela e o rosto). O texto **troca em seco** no instante da frase que abre a etapa ("o segundo agente…"). É a `etapa`.
5. **Layout de prova (modo B)**: gravação de tela no topo (952 × 610 px, no máximo ~38% da altura, margem de 64 px dos lados e 120 px em cima), a pílula na junção e a pessoa com **todo o resto da altura**: cabeça inteira com folga em cima, ombros e peito visíveis, legenda logo abaixo do queixo. O rosto nunca é coberto e a pessoa nunca fica só com a cabeça.
6. **As telas entram em corte seco na primeira palavra da etapa**; na parte rápida, a tela troca a cada 0,3 a 1,0 s com prints **diferentes do mesmo assunto** (páginas diferentes ou pontos diferentes da mesma página). O objetivo é "muita coisa acontecendo", não seguir palavra por palavra.
7. **Um único dissolve de ~1 s** para mostrar antes/depois (`dissolve: true` na tela do depois). Todo o resto é corte seco.
8. **Recapitulação**: uma `grade` 2x2 com os prints das etapas, círculos laranja numerados 1 a 4, por ~3 a 4 s, logo antes do número-prova.
9. **A prova numérica** ("quatro reuniões marcadas") vai com um print real parado (`prova`), ~6 s: agenda, painel, e-mail, resultado.
10. **Volta ao rosto limpo em tela cheia** (modo C) para a parte pessoal/opinião e para a oferta, em corte seco.
11. **No rosto limpo, salto de escala de 8 a 15% a cada ~2 a 6 s** para não ficar plano estático. Salto, nunca zoom animado. A câmera do template faz sozinha (também a cada troca de etapa).
12. **Legenda em todo o vídeo**: minúscula, branca, sem caixa, sem cor de destaque, 2 a 3 palavras por vez, sempre logo abaixo do queixo, em todos os modos (no B ela cai sobre o peito, abaixo da cabeça).
13. **Ritmo de fala ~180 palavras por minuto**: tire todo silêncio, respiro de 0,2 a 0,4 s entre frases.
14. **Fecha com oferta e CTA de palavra-chave** nos últimos ~8 s ("comenta CLAUDE que eu te mando o link"), e o vídeo termina na última palavra, sem tela final nem fade. Pergunte ao usuário **qual palavra-chave e qual promessa**; a legenda mostra a palavra entre aspas (`correcoes`: `{ "comenta claude": "comenta \"claude\"" }`).

**O que não tem:** motion graphic animado, transição (whoosh, glitch, flash), zoom animado, emoji, palavra colorida na legenda, caixa de legenda, tela final, logo do canal, efeito sonoro, mudança na cor da pessoa.

## Regras da revisão do Tiago (valem em toda edição)

1. **Margem segura:** nenhum texto, rótulo, cartão ou print importante encosta nas laterais. Margem lateral ≥ 64 px (≥ 6%), topo ≥ 120 px, e nada importante abaixo de y 1700 (interface do app). A tela do topo respeita isso (x 64, y 120, 952 px de largura).
2. **Sem tarja preta sobrando:** prints e telas **preenchem** a moldura (cover, com recorte ou foco); nunca letterbox. Em volta da tela aparece o vídeo da pessoa, nunca preto. Se a proporção do print não couber, mude o `zoom`/`rolar`/`foco` ou escolha outro print.
3. **Timing:** cada rótulo de etapa entra na palavra que o nomeia (±0,15 s) e o que está na tela é literalmente o que está sendo dito. Rode `node ferramentas/timing.mjs` (passo 7) e corrija todo desvio. Rótulo sem lógica com a fala é proibido.
4. **Texto sempre cabe no fundo dele:** pílula, cabeçalho, legenda e blocos medem o texto e reduzem a fonte ou quebram a linha; a letra nunca passa da caixa ou da faixa. Conferir nos quadros.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** nenhuma animação de entrada. Tudo é corte seco entre os modos A, B e C e entre as telas. Só se mexem: a página que rola devagar dentro da tela, o cursor que passeia, e o salto de escala do rosto em cada corte.
- **Organização e hierarquia:** três modos. A (cabeçalho em cima, rosto grande, legenda no peito), B (tela 952×610 no topo, pílula na junção, a pessoa com cabeça inteira, ombros e peito, legenda abaixo do queixo), C (rosto grande e legenda abaixo do queixo). O modo vem do momento: `abertura` = A, `cta` ou nada = C, o resto = B.
- **Tipografia:** Manrope. Pílula em 800 caixa-alta com espaçamento leve; legenda em 700 minúscula, 36 a 52 px, sempre cabendo em 880 px. Texto medido com as larguras reais da fonte, nunca vaza.
- **Moldura da pessoa:** quadro cheio nos modos A e C; no B, tudo abaixo da tela (a pessoa tem ~62% da altura). O topo da cabeça fica sempre na mesma linha de cada modo, com folga abaixo da pílula, e ombros e peito aparecem. Rastreio de rosto ligado.
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

Ele transforma cada pausa de 0,38 s ou mais entre trechos mantidos num corte com ~0,3 s de respiro (o ritmo do Etapas: fala corrida a ~180 palavras por minuto, respiro de 0,2 a 0,4 s, nunca silêncio). Pausas menores (vírgulas, respiração no meio da frase) ficam como estão.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa 9:16 (quadro cheio) para gravação vertical e horizontal; numa gravação horizontal o quadro é um recorte em volta do rosto, então ela precisa de boa resolução (1080p no mínimo; 4K fica nítido). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a câmera acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha branca é a base da tela do topo (modo B); a laranja é a base da pílula; a azul é o queixo; a amarela é onde a legenda começa; nada importante abaixo da linha vermelha (interface do aplicativo) nem na faixa vermelha da direita (botões). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Ele segue a espinha do Reel:

1. **Gancho (modo A)**: a primeira frase ou duas, até ~8 s no máximo. `abertura` com o título do formato (`texto`, `sub`) e `etapas` = quantas etapas a fala vai ter.
2. **Cada etapa que a pessoa enumera ("o primeiro…", "o segundo…", "a quarta peça…")**: uma `etapa`, com o nome da função na pílula (`rotulo`: uma ou duas palavras tiradas da fala) e de 3 a 6 telas que trocam a cada 0,3 a 1 s. Quando não há "agentes", a etapa é qualquer passo, peça, ferramenta, fase ou item do método.
3. **Recapitulação**: uma `grade` quando as etapas acabam ("todo esse fluxo…", "com essas quatro peças…").
4. **A prova ("o resultado")**: uma `prova` com um print real parado (agenda, painel, e-mail, resultado), só se o usuário tiver o print ou houver uma página pública que mostre aquilo. Sem print, use `numero` ou `destaque`.
5. **Virada, opinião, oferta e CTA (modo C)**: rosto limpo. Um `cta` cobre a chamada final. Os trechos pessoais ficam sem momento (o rosto volta sozinho).
6. Para o que não é etapa (uma definição, um número, uma comparação, uma lista curta, uma pergunta), use os blocos universais; eles aparecem na tela do topo, no grafite, com a pílula opcional (`pilula`).

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

Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- **modo A**: o cabeçalho completo no topo, a cabeça abaixo dele, a legenda abaixo do queixo;
- **modo B**: a tela ocupa o topo (até y 730); a pílula está centrada na junção com o texto inteiro; a cabeça está inteira, com folga abaixo da pílula, e ombros e peito aparecem; a legenda está abaixo do queixo; **o rosto nunca é coberto**;
- **modo C**: rosto grande, legenda abaixo do queixo, nada mais;
- o print certo aparece na etapa certa, legível, sem banner nem aviso; o cursor aparece;
- a grade mostra os números 1 a N e cada print reconhecível;
- nada importante abaixo da linha da interface (vermelha nas guias) nem na faixa dos botões.

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

- **Fala corrida, ~180 palavras por minuto.** Corte pelas pausas reais (o `preparar` acha as pausas pelo áudio, o `justar` parte delas), nunca pelos tempos das palavras do Whisper. Se precisar ajustar à mão, meça o silêncio com `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`.
- **Respiro de 0,2 a 0,4 s em cada corte** (`justar --respiro 0.3`). Menos que isso a fala fica robótica; mais parece pausa.
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora do vídeo. **O que fica:** a vírgula e a respiração curta.
- **Cada corte e cada troca de etapa dá um salto de escala** no rosto (o template faz sozinho: ciclo de 8 a 15%, nunca o mesmo tamanho duas vezes seguidas, e um salto extra a cada ~3 s de rosto parado). É salto, nunca zoom animado.
- **Ritmo da tela:** a etapa troca de print a cada 0,3 a 1,0 s na parte rápida; a `prova` fica parada ~6 s; a `grade`, 3 a 4 s. O e-mail ou o resultado mostrado por 10 s sem corte só funciona se a pílula e a legenda mantêm o ritmo.
- **Ênfase:** num trecho importante sem corte, um "soco" de câmera (`camera: [{ "em": 3.18, "zoom": 1.12 }]`) no máximo uma ou duas vezes.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (1)** | `etapa` | a pílula laranja com o nome da etapa na junção (troca em seco) e a tela do topo trocando de print a cada 0,3 a 1 s, com página que rola e cursor; `dissolve` num único antes/depois |
| **assinatura (2)** | `grade` | a recapitulação: 2 a 5 prints numa grade, círculos laranja numerados |
| **assinatura (3)** | `prova` | um print real parado na tela do topo (opcional: pílula, zoom e foco num ponto) |
| abertura | `abertura` | modo A: cabeçalho fixo com logo, ícones do processo ligados por setas e pílula de título em 1 ou 2 linhas |
| lista | `topicos` | tela grafite com título pequeno e linhas que entram na fala, marcador laranja na da vez |
| passos | `passos` | a mesma lista numerada, com um fio que desce até o passo da vez |
| número | `numero` | o número contando em pt-BR, enorme, com o `rotulo` embaixo |
| comparação | `comparacao` | duas metades da tela, cada uma no seu `em`; o vencedor fica, o outro apaga |
| gráfico | `grafico` | barras, linha ou rosca em osso com o item da vez em laranja; sem números ditos, curva com a etiqueta "ilustrativo" |
| destaque | `destaque` | a palavra-chave grande com ícone de traço; `nivel: "alerta"` inverte para osso |
| definição | `definicao` | o termo em 800 e o significado linha a linha |
| frase | `frase` | a frase em tipo grande, palavra por palavra |
| pergunta | `pergunta` | a pergunta e as `opcoes` em linhas |
| fechamento | `cta` | modo C: rosto grande em tela cheia; a chamada vai na legenda (com a palavra-chave entre aspas via `correcoes`), sem nada por cima |

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
- **O vídeo é horizontal:** o quadro é um recorte em volta do rosto; precisa de 1080p no mínimo (4K fica nítido). Rosto muito pequeno no original deixa o modo A/C mole: avise o usuário.
- **Pouco material para 3 etapas:** use duas etapas + `destaque`/`topicos`; não repita o mesmo print sem mudar o ponto da rolagem.
