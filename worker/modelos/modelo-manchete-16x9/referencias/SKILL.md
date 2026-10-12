---
name: modelo-manchete
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Manchete, o jeito dos Reels de notícia comentada: tela dividida na horizontal, com a faixa de cima ocupada por B-roll (foto ou imagem do que a fala diz, trocando em corte seco a cada 6 a 14 s), uma tarja rosa com pergunta provocativa no começo, e a pessoa embaixo em plano fixo, com legenda palavra a palavra, branca e sem caixa, no peito. Sóbrio: sem transição, sem zoom, sem efeito, sem mexer na cor do vídeo. Serve para qualquer assunto (notícia, tecnologia, finanças, saúde, esporte, política): a IA busca as imagens, escreve a tarja e divide a fala em B-rolls. Use quando o usuário pedir para editar \"no modelo Manchete\", \"estilo notícia\", \"B-roll em cima e eu embaixo\", \"como aquele Reel do Cybercab\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Manchete

O vídeo vira um Reel de notícia comentada: em cima, uma faixa de B-roll de borda a borda (1080×600 px, preenchida inteira pela imagem) que sempre mostra o que a pessoa está dizendo e troca em corte seco na virada de cada ideia; no primeiro quadro, uma tarja de pergunta provocativa; embaixo, a pessoa em plano fixo, com a fala corrida (nenhuma pausa) e a legenda palavra a palavra no peito. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (as tomadas, a tarja, a divisão em B-rolls, o que vira imagem, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma notícia de tecnologia (o óculos que traduz conversas), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em B-rolls deste estilo. Uma edição só com legenda é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** quase nenhuma, de propósito. Só corte seco: o B-roll troca de uma imagem para outra sem transição, a cada 6 a 14 s num vídeo longo (num Reel curto, de até ~20 s, cada coisa que a fala nomeia ganha o seu B-roll, de 2,5 a 4 s), e dentro do mesmo B-roll o ângulo muda a cada 1,5 a 5 s (outro foco, outro enquadramento, aproximação lenta). A tarja está no primeiro quadro e fica ~6 s, saindo num corte de B-roll. A pessoa não corta nem dá zoom. Nada treme, gira, pisca ou troca de cor.
- **Organização e hierarquia:** três camadas fixas. Faixa do B-roll (x 0–1080, y 0–600; a imagem preenche tudo, sem borda preta), tarja colada na borda de baixo dela e pessoa abaixo. A imagem é o assunto; a tarja é a única frase grande; a legenda é pequena e fica no peito.
- **Tipografia:** Manrope 800. Tarja em caixa-alta (34 a 50 px, pílula de 84 px, texto branco); legenda em minúsculas e pequena (38 a 50 px), sem caixa, sem contorno, sem cor de destaque, só uma sombra leve, logo abaixo do queixo (no colarinho, nunca na boca).
- **Moldura da pessoa:** quadro cheio abaixo da faixa, plano médio-peito, **rosto na linha central** (x = W/2), um zoom só o vídeo inteiro. A moldura segue o rosto quando a pessoa se mexe. O rosto nunca é coberto.
- **Cores, textura e som:** **um** destaque rosa-vermelho `#F2305B` (a tarja). **Nunca** filtro, LUT, vinheta ou brilho sobre a pessoa. Sem som de efeito.

## O DNA deste formato

Tirado de um Reel real de notícia comentada (tecnologia/negócios) com 54 s e 180 palavras. Estas regras valem para qualquer vídeo.

1. **Duas faixas:** B-roll em cima (~35% da altura, de borda a borda, preenchido pela imagem, acima da cabeça), pessoa embaixo, rosto centrado na vertical.
2. **Começo imediato:** a primeira palavra sai em até 0,1 s e o primeiro quadro já tem B-roll, tarja e a pessoa. Sem intro, sem logo, sem "oi".
3. **Tarja:** pergunta provocativa de 2 a 4 palavras, caixa-alta, cor viva, cantos arredondados, **montada na borda de baixo do B-roll** (metade na foto) e centrada, nos primeiros ~6 s; sai num corte de B-roll (`tarjaAte`).
4. **Pessoa fixa:** sem zoom, sem punch-in, sem jump cut visível. Todo o dinamismo vem do B-roll.
5. **B-roll em corte seco** a cada 6 a 14 s, **na virada de ideia**, variando o tipo (foto de imprensa → rua → ponto de vista → detalhe).
6. **B-roll literal:** ilustra exatamente o que a fala diz ("não tem volante" mostra o carro sem volante) e muda de ângulo a cada 2 a 5 s.
7. **Legenda palavra a palavra:** branca, bold, sem caixa, 2 a 4 palavras, minúsculas, altura do peito (~80% da tela), troca a cada 0,5 a 1 s com a fala.
8. **Fala corrida:** ar entre frases ≤ 0,2 s, perto de 190 a 200 palavras por minuto. Toda pausa sai.
9. **Gestos:** a mão marca números e ênfases (o dedo no "trinta"). Não corte um gesto no meio.
10. **Número ou nome concreto na primeira frase** (30 mil dólares, Elon Musk). Se a gravação não tem, peça ao usuário para regravar o começo ou avise que o gancho ficou fraco.
11. **Ponte local no meio** ("não dá para dizer que nunca vai dar certo no Brasil"): traz a notícia para o público. É da fala do usuário; você não inventa, só garante que ela fique.
12. **Fechamento sem tela final:** pergunta de opinião + comentar + dois toques, **falado**, sem texto de chamada na tela, sem pausa no fim; o vídeo termina na última palavra.

**O que NÃO tem:** selo (quadrado com foto ou ícone ao lado da tarja), punch-in, jump cut no plano da pessoa, emoji ou ícone animado, texto grande no meio do B-roll, transição, tela final, rótulos depois dos 6 s, destaque colorido na legenda, efeito sonoro.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; e a busca de imagens). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **quem ou o que é o assunto da notícia** (o personagem, o produto, o lugar) e **se ele tem imagens próprias** para o B-roll (prints, fotos, vídeos de rede social com crédito). Se tiver, peça para pôr na pasta `imagens/` do projeto (criada no passo 1), com nomes que digam o que são (`fila-de-carros.jpg`, `elon.jpg`). Elas passam na frente de qualquer busca;
   - **como o vídeo fecha**: o formato termina com uma pergunta de opinião falada ("o que você acha disso? Deixa aqui nos comentários e dá dois toques na tela"). Se a gravação já fecha assim, ótimo; se não, avise que o fechamento vai sem chamada (não se inventa fala nem se põe texto de chamada na tela).

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
node ferramentas/justar.mjs
```

Ele transforma cada pausa de 0,38 s ou mais entre trechos mantidos num corte com ~0,16 s de respiro (`--respiro 0.2` para uma fala mais calma). Pausas menores (vírgulas, respiração no meio da frase) ficam como estão.

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

Gera três quadros com guias: a elipse azul deve cair no rosto, **na linha central**; a linha branca é a base da faixa do B-roll (a tarja começa nela); a verde é o topo da cabeça (deve ficar abaixo da tarja); a azul é o queixo; a amarela é onde a legenda começa; nada importante abaixo da linha vermelha (interface do aplicativo) nem na faixa vermelha da direita (botões). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Na Manchete o trabalho é **dividir a fala em 2 a 4 ideias** e dar a cada uma um B-roll (6 a 14 s), na virada de ideia:
- a primeira ideia (o gancho, com o nome ou o número concreto) é a `manchete`: B-roll + **tarja** (a pergunta provocativa em 2 a 4 palavras, que vem da fala: "FIM DO UBER?", "SEU DINHEIRO ENCOLHEU?") ;
- as seguintes são `insercao`, na ordem em que a fala muda de assunto (explicação → prova → objeção → fechamento), variando o tipo de imagem;
- dentro de cada B-roll, marque as trocas de ângulo (`angulos`) a cada 2 a 5 s, em palavras-chave.

Blocos universais (`numero`, `topicos`, `comparacao`…) só entram se a fala depender de um número ou de uma lista; o formato original quase não tem texto na faixa. Se entrarem, vão no lugar de um B-roll, nunca por cima dele. **Exceção para vídeos com mais de 40 s:** o `conferir` exige 4 tipos de bloco; nesses, intercale um `destaque` ou uma `pergunta` curtos (3 a 5 s) entre os B-rolls.

### 6b. Imagens

Leia `references/imagens.md`.

1. Para cada B-roll, escreva um pedido em `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "supermarket shelves", "gold electric car parked"), `tipo: "foto"` e `arquivo` quando vier da pasta `imagens/`. O B-roll ilustra **literalmente** o que a fala diz. **Antes de buscar, confira a resposta do usuário sobre imagens próprias.**
   - Pessoa famosa e marca não vêm de busca: peça a foto ao usuário (`imagens/`). Print, só o real que ele mandar.
   - Sem imagem boa, **cartão com o nome** (cartão é melhor que imagem errada). Marca/empresa: foto do produto, nunca o logo oficial.
   - **Uma imagem por ideia que a fala nomeia**, trocando **na palavra** (ex.: "óculos" → óculos de realidade aumentada; "você fala… a outra pessoa" → duas pessoas conversando; "tradução… na lente" → a lente com o texto; "viajar" → viajante no aeroporto; "Brasil" → uma rua brasileira reconhecível). Escreva antes `work/roteiro-visual.md`: palavra → o que aparece → fonte.
   - **Notícia = foto real** (Wikimedia/Openverse; `--lado 2400`). Quando não há foto livre que mostre aquilo **literalmente** (um conceito, um "imagina…", um detalhe de produto), gere a imagem (se o usuário tiver um gerador de imagens conectado, como o Magnific) em estilo fotojornalismo, horizontal 16:9, sem texto nem logo, e marque `"credito": "imagem ilustrativa"`. Ponha o arquivo em `imagens/`. Banco genérico que "mais ou menos" combina não serve; evite fotos de protesto, política ou placa de carro legível em primeiro plano.
2. `node scripts/imagens.mjs`. Leia os avisos e abra `work/imagens.jpg` (e `imagens-2.jpg`…).
3. Escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, **deitada (paisagem)** e de boa resolução (a faixa tem 1080×600 e a foto se mexe: prefira 1600 px). `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`. Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (cartão).
4. `node scripts/imagens.mjs --folha` e confira o círculo do foco. Depois `--limpar`.
5. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post (ou use `credito` no momento).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `momentos`, `semLegenda` e `correcoes` (`marca` fica vazia). O momento fica na faixa até o próximo começar: não deixe `ate` passar do `de` do seguinte.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um B-roll para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "sai bér": "Cybercab" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- **o primeiro quadro já é o layout final**: B-roll, tarja e a pessoa; a primeira palavra sai em até 0,1 s (se não, corte o começo em `work/cortes.json`);
- **o rosto está na linha central**, com a cabeça inteira e a tarja sem encostar nela;
- a faixa está sempre **toda preenchida** (nenhuma borda preta), a imagem é **aquilo** que foi dito e o assunto está inteiro (o foco certo); `node ferramentas/timing.mjs` sem desvios acima de 0,15 s;
- a tarja está centrada, montada na borda da faixa, e some num corte de B-roll perto dos 6 s;
- a legenda é branca, sem caixa, 2 a 4 palavras, logo abaixo do queixo, sem cobrir o rosto; nada abaixo da linha da interface nem na faixa dos botões;
- as trocas de B-roll e de ângulo são em corte seco (nenhum quadro com duas imagens misturadas).

Corrija o plano (outro foco, outro `em`, tarja mais curta) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-manchete.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (quantas pausas viraram corte);
- o **mapa resumido** (que B-roll entrou em cada trecho, qual é a tarja);
- de onde vieram as imagens (pasta do usuário ou busca) e o texto de `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que ele pode trocar por uma própria).

## Ritmo e cortes (cortar como editor)

- **Fala corrida, sem pausa.** Toda pausa vira corte com **0,1 a 0,2 s** de respiro (`node ferramentas/justar.mjs --respiro 0.12` deixa ainda mais seco; o padrão é 0,16 s). Perto de 190 a 200 palavras por minuto: se a gravação está lenta, corte também as hesitações ("é…", "né", recomeços).
- **Corte pelas pausas reais, nunca pelos tempos das palavras.** O Whisper estica o começo de algumas frases para dentro do silêncio; o `preparar` acha as pausas pelo áudio. Se precisar ajustar à mão, meça com `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`.
- **A primeira palavra em até 0,1 s:** ajuste o `de` do primeiro trecho em `work/cortes.json` para ~0,05 s antes da primeira palavra; o vídeo termina na última palavra, sem silêncio no fim.
- **O que sai:** silêncio, "é…"/"hã…" sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora do vídeo. **O que fica:** o gesto e a respiração curta entre frases.
- **O corte não troca o enquadramento:** a pessoa fica em plano fixo; o salto do corte é escondido pela fala corrida e pelo B-roll, que só troca na virada de ideia (nunca em todo corte).
- **Ritmo do B-roll:** 2 a 4 B-rolls num vídeo de 30 a 60 s; dentro de cada um, uma troca de ângulo a cada 2 a 5 s.

## Blocos deste modelo

Todo bloco ocupa a faixa do B-roll (1080×600) e fica nela até o próximo entrar, em corte seco.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (1)** | `manchete` | o primeiro B-roll, com a tarja (pergunta de 2 a 4 palavras, centrada na borda da faixa); a tarja fica ~6 s (`tarjaAte`) e sai num corte. O modelo não tem selo |
| **assinatura (2)** | `insercao` | o B-roll seguinte: a foto do que a fala diz, em corte seco, com trocas de ângulo (`angulos`) e aproximação lenta; `credito` miúdo opcional |
| abertura | `abertura` | o gancho em tipo grande, palavra por palavra, no lugar do B-roll (raro: o formato abre com B-roll) |
| lista | `topicos` | título pequeno e linhas que entram na fala |
| passos | `passos` | a mesma lista com números |
| número | `numero` | o número contando em pt-BR, enorme, com o `rotulo` |
| comparação | `comparacao` | duas metades da faixa, cada uma no seu `em` |
| gráfico | `grafico` | barras, linha ou rosca desenhadas na fala |
| destaque | `destaque` | a palavra-chave grande; `nivel: "alerta"` inverte a faixa |
| definição | `definicao` | o termo e o significado linha a linha |
| frase | `frase` | a frase em tipo grande, palavra por palavra |
| pergunta | `pergunta` | a pergunta e as opções em linhas |
| fechamento | `cta` | pílula com ícone e a chamada; **o formato não usa**: o fechamento é falado, sem texto na tela |

## A assinatura em qualquer assunto

A Manchete é: **uma pergunta provocativa + a prova em imagem, ideia por ideia**. A fala vira 2 a 4 ideias; cada uma ganha a imagem literal do que diz; a primeira ganha também a tarja.

1. **Finanças/cripto.** "Bitcoin passou de cem mil dólares e a Bolsa caiu no mesmo dia. Em 2017 foi igual…"
   `manchete`: B-roll de um painel de cotações (busca "stock market screen"), tarja "O FIM DA BOLSA?"; `insercao` do gráfico em "2017" (foto de tela de trading); `insercao` do fechamento.
2. **Saúde.** "Dormir menos de seis horas encolhe o cérebro, segundo um estudo de Harvard…"
   `manchete`: B-roll de pessoa dormindo (busca "person sleeping bed"), tarja "SONO ENCOLHE O CÉREBRO?"; `insercao` de um relógio de cabeceira em "seis horas"; `insercao` de uma ressonância em "cérebro".
3. **Algo bem distante (esporte, carreira, história pessoal).** "O Palmeiras contratou um garoto de 17 anos por 40 milhões…"
   `manchete`: B-roll do estádio, tarja "O NOVO NEYMAR?"; `insercao` da torcida em "40 milhões"; `insercao` do gramado no fechamento.

## Margem segura, preenchimento e timing (revisão do Tiago)

- **Margem segura:** nenhum texto, rótulo, cartão ou print importante encosta nas laterais: ≥ 64 px de cada lado, ≥ 120 px do topo, e nada importante abaixo de y 1700 (interface do app). Vale para a tarja, o crédito e todo bloco de texto; a foto em si vai de borda a borda.
- **Sem tarja preta:** a imagem ou o vídeo **preenche** a faixa inteira (cover com `foco`); nunca letterbox. Imagem em pé ou muito estreita: ponha o `foco` no assunto, ou escolha outra. Se não houver foto boa, cartão (que também preenche). Não há vão entre a faixa e a pessoa.
- **Timing:** cada B-roll e cada troca de ângulo entram na palavra que os nomeia (±0,15 s) e mostram literalmente o que é dito. Rode `node ferramentas/timing.mjs` e corrija todo desvio listado; olhe também um quadro em cada entrada. Rótulo ou tarja sem lógica com a fala é proibido.
- **O texto cabe no fundo dele:** o texto é medido e a fonte diminui ou a linha quebra; nunca deixe a letra passar da tarja ou da faixa. Tarja longa demais: encurte a pergunta.

## Fidelidade

- Tudo na tela vem da fala; a tarja é uma **pergunta** feita com as palavras e o tema dela, sem afirmar o que a fala não afirma.
- A imagem mostra **o que foi dito**, não uma interpretação. Na dúvida, cartão com a palavra.
- Não invente número, nome, preço nem fato. Sem pessoa famosa nem marca nas buscas: peça a foto ao usuário. Print, só o real.
- Foto de pessoa real só se o usuário mandou ou se é imagem livre da própria pessoa; nunca gere o rosto de ninguém.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A fala ainda tem pausas longas no vídeo**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: aumente o respiro (`node ferramentas/justar.mjs --respiro 0.22`) ou, só naquele corte, afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **A tarja da legenda está uma palavra atrasada**: o tempo daquela palavra no Whisper está esticado; confira em `work/palavras.json` e corrija o `em` dela no `src/plano.json` (em `palavras`).
- **A imagem ficou mole na faixa**: era pequena; troque (`--refazer`, `--lado 2400` com fotos do Commons). A faixa é larga (1080×600): foto deitada funciona melhor que em pé.
- **A tarja ficou pequena ou comprida**: encurte para 2 a 4 palavras; o corpo diminui para caber, e abaixo de 40 px ela merece outra pergunta.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
