---
name: modelo-reacao
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Reação: o conteúdo que ela comenta (um comentário de seguidor, um post, uma manchete ou um print) fica em cima, num cartão que sobe como num feed, com um marca-texto amarelo que passa na linha que ela está lendo e a câmera aproximando o trecho; a pessoa fica numa moldura larga embaixo, com a cabeça inteira, em Rubik, azul-ardósia, branco, amarelo e laranja. Serve para qualquer assunto (o exemplo do modelo é uma resposta a um seguidor sobre IA e edição, mas funciona com notícias, finanças, cripto, saúde, boatos, carreira, histórias): a IA traduz a fala para os blocos do estilo e busca as imagens sozinha. Use sempre que o usuário pedir para editar \"no modelo Reação\", \"estilo reação\", \"respondendo comentário\", \"comentando um print\", \"reagindo a um post\" ou \"comentando uma notícia\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Reação

O vídeo vira uma reação: em cima, o conteúdo que a pessoa está comentando (o comentário de um seguidor, um post, uma manchete, um print), num cartão que sobe como num feed; embaixo, ela numa moldura larga, com a cabeça inteira. Um marca-texto amarelo passa na linha que ela está lendo e a câmera aproxima o trecho; o que ela desmente leva um risco vermelho. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com a resposta a um seguidor sobre IA e edição, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** o movimento de um feed. Cada cartão sobe por trás da moldura da pessoa (0,5 s, desliza e assenta, sem quicar) e empurra o anterior para cima, que some enquanto sobe: nunca uma mesa vazia, nunca dois textos no mesmo lugar. O **marca-texto amarelo** é o gesto central: ele varre a linha que a pessoa está lendo, palavra por palavra no ritmo da fala; nas listas, ele desce de item em item. No `print`, a câmera aproxima o trecho marcado (zoom de 10 a 22% dentro do cartão) e volta; o trecho desmentido ganha um risco vermelho que atravessa a linha.
- **Organização e hierarquia:** a **mesa** em cima (um fundo azul-ardósia com pontinhos, y 124 a 902) e a **pessoa numa moldura larga** embaixo (y 960 em diante, 1024 px de largura, cantos arredondados e anel branco). Um cartão por vez, centrado na mesa; o texto principal grande, rótulos pequenos. Cartões brancos informam, o escuro bate forte (destaque, abertura), o laranja chama (fechamento, aba "Respondendo").
- **Tipografia:** uma família só, **Rubik** (Google Fonts), larga e de cantos levemente arredondados: 800 nos títulos, destaques e números; 700 em itens e legenda; 600 e 500 em textos de apoio. Texto do cartão entre 40 e 124 px; rótulos a partir de 26 px; legenda 34–50 px. Nada condensado, nada com contorno.
- **Moldura da pessoa:** sempre a mesma, larga e embaixo, com a cabeça inteira logo abaixo da emenda; nunca coluna estreita ao lado. O rosto é seguido quadro a quadro: a moldura reenquadra de leve quando a pessoa se mexe.
- **Cores, textura e som:** fundo azul-ardósia (#1E3350) com pontinhos; cartões brancos (#FFFFFF, tinta #121820) e escuros (#0F1A2B); **amarelo** (#FFE14A) só para o marca-texto e a palavra falada na legenda; **laranja** (#FF6A3D) para a aba, o fechamento e os acentos; vermelho (#E5383B) para o que foi desmentido e verde (#1FAA6B) só para o lado certo. Nenhum logo nem marca de rede social: o cartão de comentário e o de post são genéricos, desenhados. Sons tonais e raros: uma bolha curta quando o cartão sobe, um toque em cada trecho marcado, duas notas descendo no riscado e no alerta, três notas subindo no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Finanças"): vão num cartão de perfil que abre o vídeo quando ele não começa com um comentário ou um print. Sem resposta, siga sem nome. Pergunte também se ele tem **imagens próprias** (produto, print, foto pessoal): elas vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas.

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

**Números curtos ditos sozinhos** ("Mil.", "Cem.") às vezes voltam como `[sem fala, sai]`. Antes de aceitar um item desses no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala. Se for fala, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo: `{ "em": 3.18, "ate": 3.4, "w": "Mil" }`).

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas viram cortes secos**; a pessoa fica sempre na mesma moldura e o cartão de cima continua rolando. Mantenha a proposta do `preparar`.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa fica na moldura larga de baixo, que mostra a cabeça inteira); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, as imagens e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a moldura da pessoa acompanha o rosto quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto, **com a cabeça inteira abaixo da linha rosa** (a emenda entre a mesa e a moldura da pessoa); a caixa verde tracejada é a mesa onde os cartões passam; nada importante fora das linhas vermelhas (interface do aplicativo). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (o que a pessoa está lendo ou respondendo, lista, número, comparação, coisa concreta, palavra forte…) e escolha o bloco **deste modelo** na tabela abaixo. **A assinatura (`comentario` ou `print`) entra pelo menos uma vez**: veja "A assinatura em qualquer assunto". Se o vídeo responde alguém, abra com o `comentario`; se comenta uma notícia, um post ou um print, abra com o `print`; senão, com a `abertura`. Feche com o `cta`.

Os cartões sobem um a um como num feed: o novo entra por trás da moldura da pessoa e empurra o anterior para cima. Varie o tipo do cartão (nunca três brancos e iguais seguidos) e use `foto` para a coisa concreta que a fala nomeia.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar como `foto` (um cartão a cada 3 a 5 s, nunca dois na mesma frase). Se o usuário tem o **print real** (post, comentário, notícia), ele vai em `imagens/` e entra como `tipo: "print"`. Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "camera tripod"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos. O cartão de foto tem 960 px de largura: o padrão (`--lado 1600`) basta.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro e reconhecível, **deitada** (o cartão é 960×620), sem gente reconhecível, logo ou texto.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira; as linhas da folha marcam 0,25 / 0,5 / 0,75). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (vira cartão com a palavra).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "camera", "efeito": "aproximar" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, dado ou imagem entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (o template mostra uma linha curta de cada vez).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "chat GPT": "ChatGPT" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto do cartão cabe e está legível; o marca-texto amarelo está na linha que a pessoa diz;
- no `print`, a câmera aproxima o trecho certo sem cortar a palavra, e o riscado cai quando a pessoa desmente;
- a foto mostra o assunto inteiro; a etiqueta entra na palavra dita;
- a cabeça da pessoa está inteira na moldura de baixo, e a legenda (quando aparece) não cobre o cabelo;
- nas trocas, o cartão novo sobe empurrando o anterior: nenhum texto sobre outro, nenhum quadro com a mesa vazia no meio do vídeo (gere quadros a cada 0,1 s em volta de uma troca: `node scripts/stills.mjs 4.2 4.3 4.4 4.5`);
- nada importante fora das linhas da interface do app.

Corrija o plano (texto mais curto, outra imagem, outro foco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-reacao.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- as **imagens usadas** e de onde vieram, e o texto do `creditos.txt` quando houver CC BY;
- o que é ilustrativo (curvas de tendência, números marcados `ilustrativo`);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que só ele pode trocar por uma melhor).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | cartão escuro com o título grande, palavra por palavra na fala; o `destaque` ganha o marca-texto amarelo |
| lista | `topicos` | cartão branco com título laranja; cada item entra no seu `em` com um quadradinho de ✓, e o marca-texto desce de item em item |
| passos | `passos` | o mesmo, com bolinhas numeradas 1, 2, 3 |
| número | `numero` | cartão branco: o número conta gigante (pt-BR), o sufixo em laranja, o rótulo ganha o marca-texto; com `ilustrativo` aparece a etiqueta "número ilustrativo" |
| comparação | `comparacao` | dois painéis lado a lado dentro do cartão, cada um entra no seu `em` com a etiqueta colorida; o vencedor ganha borda verde e ✓, o outro esmaece |
| gráfico | `grafico` | cartão branco: barras que crescem, linha que se desenha ou rosca; sem números ditos, a curva da tendência com a etiqueta "ilustrativo" |
| destaque | `destaque` | cartão escuro com o texto varrido pelo marca-texto amarelo (`chave`) ou cartão coral com ícone de alerta (`alerta`); `detalhe` menor embaixo |
| definição | `definicao` | o termo numa etiqueta laranja, o significado embaixo, palavra por palavra na fala |
| frase | `frase` | cartão branco com aspas laranja grandes; `destaque` no marca-texto; `risco` riscado em vermelho quando é dito |
| pergunta | `pergunta` | cartão branco com o balão laranja e a pergunta; as `opcoes` entram como botões A, B, C |
| fechamento | `cta` | cartão laranja com o ícone num círculo branco (`salvar`, `seguir`, `comentar`, `link`) e a chamada em branco; `destaque` no marca-texto |
| **assinatura** | `comentario` | o cartão do comentário de um seguidor, com a aba laranja "Respondendo", avatar com a inicial, `@autor` e o texto: o marca-texto acompanha a leitura palavra por palavra |
| **assinatura** | `print` | post, manchete ou o print de verdade do usuário (`imagem` do tipo `print`); `grifos` passam o marca-texto na linha lida e a câmera aproxima o trecho; `risco` risca o que foi desmentido |
| foto de apoio | `foto` | cartão grande de foto com aproximação lenta e uma etiqueta amarela com a palavra dita; a legenda continua |

## A assinatura em qualquer assunto

O `comentario` e o `print` são **"a pessoa reage a algo que outra pessoa disse ou publicou"**: o conteúdo original fica em cima, lido de verdade, e a pessoa embaixo responde, confirma ou desmente. Serve para responder seguidor, comentar notícia, analisar post, desmentir boato. Quando não existe print, o `print` desenha um post ou manchete genérico com as palavras da fala; nunca imite o visual de uma rede ou jornal real.

1. **Finanças/cripto.** "O Bitcoin rompeu os 83 mil dólares. Mas mercado subindo não significa dinheiro no bolso."
   `print` (`forma: "manchete"`, `texto: "O Bitcoin rompeu os 83 mil dólares"`, `grifos: [{ "trecho": "83 mil dólares", "em": 1.3 }]`) → `comparacao` `errado-certo` ("Mercado sobe" × "Dinheiro no bolso") → `topicos` com os erros que a pessoa lista (compra por impulso, moeda sem critério) → `cta` `link`.
2. **Saúde ou rotina.** "A Marina perguntou: 'café depois das 16h estraga o sono?' Estraga: a cafeína fica no corpo por umas seis horas."
   `comentario` (`autor: "marina"`, o texto da pergunta, `em` na primeira palavra lida) → `numero` 6 (`rotulo: "horas de cafeína no corpo"`) → `foto` de uma xícara no `rotulo` "Café" → `cta` `salvar`.
3. **Relacionamento ou carreira.** "Vi um post dizendo que quem muda de emprego com frequência 'não tem lealdade'. Discordo: lealdade é com o seu futuro."
   `print` (`forma: "post"`, `autor` omitido, o texto do post, `grifos` em "não tem lealdade", `risco` no mesmo trecho quando a pessoa discorda) → `frase` com `destaque: "lealdade é com o seu futuro"` → `pergunta`: "E você, já mudou de área?".

Se o usuário tem o print real, ele vai em `imagens/` e o `print` o mostra (`imagem` com `tipo: "print"`, sem `texto`), com `grifos` por `area` (em frações da imagem). Sem print real e sem texto da fala que sirva de post, use `comentario`, `frase` ou `destaque`; mas toda edição tem pelo menos um `comentario` ou um `print`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("praticamente não estraga" não vira "nunca estraga").
- Não invente número, nome, preço nem fato. A imagem ilustra o que foi dito; não mostra algo que a fala não disse (nada de foto de uma marca, de uma pessoa real ou de um "print" de notícia ou de rede que não existe: o post desenhado é genérico e traz só as palavras da fala).
- Número ilustrativo só onde o bloco permite (a curva de tendência, `ilustrativo: true`), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Num vão, quase sempre cabe uma `foto` da coisa que a pessoa está nomeando ou um `destaque`. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: a pessoa sempre reage a algo (uma pergunta, uma notícia, uma crença comum). Escreva esse "algo" com as palavras da fala num `print` genérico ou num `comentario`.
- **O zoom do `print` corta o texto**: o trecho marcado é largo demais; marque menos palavras em `grifos` ou use `zoom: false`.
- **A foto ficou pequena ou com o assunto cortado**: outra candidata deitada, ou mude o `foco`.
- **A imagem tem texto, marca d'água ou logo**: outra candidata, ou outro foco que tire o texto do quadro.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
