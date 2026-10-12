---
name: modelo-kit-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Kit. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Kit, \"tudo o que você precisa\": a pessoa em tela cheia como base e, a cada bloco, uma mesa de madeira vista de cima no quadro da esquerda, com a pessoa numa moldura à direita. A cada item dito, a câmera desliza até o lugar dele, o objeto cai num cartão com sombra, uma linha leva à etiqueta com nome e função e o contador anda (\"1 de 4\"); no fim a câmera se afasta e mostra o kit completo. Papel, fita crepe e azul cobalto sobre carvalho, em Rubik. Serve para qualquer assunto (bolsa de viagem, setup de trabalho, ferramentas, ingredientes, pilares de um método): a IA traduz a fala para os blocos do estilo e busca as imagens. Use quando o usuário pedir \"modelo Kit\", \"o que você precisa\", \"o que tem na minha bolsa\", \"lista de itens\", ou quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a mesa à esquerda)."
---

# Modelo Kit (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Kit no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: a mesma Rubik, o mesmo papel, fita crepe e azul cobalto sobre carvalho, a mesma queda com sombra, a mesma câmera que desliza pela mesa, os mesmos sons e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada, com a legenda (a fita crepe) no terço de baixo. A mesa abre **só quando acrescenta clareza** à fala, e a pessoa volta para o quadro cheio quando a ideia termina (respiro de mais de ~1,2 s sem momento). É um vídeo longo: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, a mesa à esquerda.** No vertical a mesa ficava em cima e a pessoa numa moldura larga embaixo; aqui a pessoa desliza (0,4 s) para uma **moldura na faixa da direita** (x 1180 a 1920, a altura toda), com o rosto centralizado nela, a ~40% da altura, e acompanhado com suavidade (o rastro do rosto). A **mesa** ocupa o **quadro da esquerda** (x 0 a 1180; área útil das folhas x 96 a 1116, y 84 a 884). A borda de madeira, que no vertical era a costura horizontal, vira uma costura vertical, com a sombra caindo na moldura.
- **As folhas e o kit têm o mesmo desenho.** A área útil da mesa deitada (1020 × 800) é maior que a do vertical (960 × 724): as folhas, as etiquetas e a grade do kit ficam do mesmo tamanho, centradas nela, e a vista geral do kit cabe na altura toda da mesa. Tudo é medido e encolhe até caber (nada passa da borda da mesa para a moldura).
- **O contador "N de M"** fica no pé da mesa, à esquerda (y 904 a 972), acima dos controles do player. A **legenda** fica no terço de baixo (centro em y 916): no meio do quadro com a pessoa em tela cheia e centrada na moldura quando a mesa está aberta.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira uma mesa vista de cima: no quadro da esquerda, um tampo de carvalho com um lugar marcado (contorno pontilhado numerado) para cada coisa que a pessoa menciona; à direita, a pessoa numa moldura. A cada item dito, a câmera **desliza** até o lugar dele, o objeto **cai** no cartão com sombra, uma linha pontilhada **liga** o objeto à etiqueta (nome e para que serve) e o contador anda. No fim, a câmera **se afasta** e mostra o kit completo, com o contador marcado ✓. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com o kit para gravar com o celular, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo é papel e objeto **pousando** num tampo. Cada peça cai de cima em 0,3 s (começa 24% maior, com a sombra longa e difusa; pousa com a sombra curta e firme e um assentar de 0,14 s). A câmera desliza com começo e fim macios (0,4 s) de um lugar para o outro, com uma deriva mínima para a mesa nunca congelar. Cada item tem quatro tempos: a câmera chega, o objeto cai (`em`), a linha pontilhada se desenha até a etiqueta (+0,1 a +0,45 s) e a etiqueta pousa (+0,42 s; o `detalhe` aparece no `detalheEm`). No fim a câmera se afasta (0,8 s). O que sai é varrido para cima; o que entra cai. Nada de fade solto.
- **Organização e hierarquia:** o kit é uma grade 2 por 2 (até 6 lugares): cada célula tem o cartão do objeto de um lado e a etiqueta do outro, ligados pela linha pontilhada de cobalto; a etiqueta tem o nome grande (28 a 46 px), o `detalhe` menor e um número. Os blocos sem objetos (título, lista, número…) são **folhas de papel** postas no tampo, ocupando ~90% da largura da mesa. O contador "N de M" fica no pé da mesa, à esquerda.
- **Tipografia:** uma família só, **Rubik** (Google Fonts): 800 nos títulos, nomes e números, 700 em textos de apoio, 500 nos detalhes. Nada condensado, nada com contorno. A legenda é uma fita crepe no terço de baixo, 1 a 3 palavras por vez, com a palavra dita em azul cobalto.
- **Moldura da pessoa:** tela cheia como base (como foi gravada); com a mesa aberta, a **moldura da direita** (x 1180 a 1920, a altura toda), com a cabeça inteira e o rosto centralizado na largura dela, a ~40% da altura (o rosto ocupa ~40% da largura da moldura); a borda da mesa projeta uma sombra sobre ela. Nunca janelinha no canto. O rosto é seguido com suavidade.
- **Cores, textura e som:** tampo de **carvalho claro** (#DDBB92, textura em `public/mesa.jpg`), papel creme (#FFFDF7), tinta (#1F2430), **azul cobalto** (#2F56E0) para o contador, a linha, os números e o marca-texto, vermelho de caneta (#E4462D) só para alerta, verde (#1E9E62) para o certo, kraft (#C9A57A) para etiquetas de papel pardo e cartões sem foto. Sombras de objeto na mesa, nunca brilho. Sons tonais e raros, bem abaixo da voz: uma batida surda quando o objeto cai, um toque na etiqueta, um deslize no afastar, um carimbo nos destaques.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Curiosidades"). Sem resposta, siga sem nome. Pergunte também se ele tem **imagens próprias** (produto, print, foto pessoal): elas vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas.

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

Neste modelo **as pausas excessivas viram cortes secos**; no vídeo completo (aula 9) mantenha as respirações naturais e o tempo de entender a explicação (a proposta do `preparar` já faz isso). Cada item do kit precisa de cerca de 1,5 s entre um e o próximo para a câmera chegar, o objeto cair e a etiqueta pousar. Se a pessoa fala os itens colados, **mantenha uma pausa curta** (0,2 a 0,3 s) entre eles; se o vídeo ficar longo demais, corte as explicações de cada item em vez de apertar as pausas.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.36 --queixo-y 0.55
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para a tela cheia e para a moldura da direita. Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de planejar, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo (a moldura da direita acompanha a pessoa quando ela se mexe). Se nas guias o rosto sair do lugar, rode `node scripts/rastrear.mjs --conferir <segundos>`.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera quadros com guias: a elipse azul deve cair no rosto; a linha vertical azul-clara é o centro da pessoa (do quadro cheio ou da moldura; o rosto fica nela); a caixa verde tracejada é a área útil da mesa; as linhas amarelas são a faixa da legenda; a rosa vertical é a borda da mesa (a moldura começa nela); nada importante fora das margens vermelhas nem abaixo da linha vermelha de baixo (controles do player). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: ache **o que a pessoa lista como coisas** (objetos, ferramentas, ingredientes, itens de uma bolsa, pilares de um método), o instante em que diz o nome de cada uma (`em`) e para que serve (`detalhe`, `detalheEm`). Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`kit`) entra uma vez, com todos os itens num só momento** (2 a 6 itens). Abra com a `abertura` (o gancho, escrito numa folha) e feche com o `cta`. A tela cheia é a base: nos trechos que só conversam, entre um bloco e outro, deixe a pessoa em tela cheia (respiro); a mesa abre de novo no próximo momento.

- Se a fala diz "você só precisa de quatro coisas", os lugares vazios (`lugaresEm`) aparecem nesse instante: o espectador vê o kit por preencher.
- Se diz um resumo ("tudo junto custa menos que…", "é isso que eu levo"), ele vira o `total`; a câmera se afasta (`afastarEm`) um instante antes.
- Mais de 6 coisas, ou coisas sem objeto físico (ideias, etapas)? Use `topicos` ou `passos`; ou divida em dois kits (dois momentos `kit`).

### 6b. Imagens

Leia `references/imagens.md`.

1. Para cada item do kit, escreva em `work/imagens.json`: `id`, `em`, `palavra`, `busca` (inglês, concreto: "camera tripod"; **tipo `objeto`** busca um objeto 3D genérico, **`foto`** busca uma foto de produto em fundo neutro) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de marca nem pessoa famosa na busca; se o usuário tem o produto, a foto dele (`imagens/`) passa na frente.
2. `node scripts/imagens.mjs`; abra `work/imagens.jpg` **uma vez** e escolha a candidata que mostra o objeto inteiro, reconhecível, de preferência sobre fundo claro (o cartão é de papel branco e a foto se mistura com ele), sem texto nem logo.
3. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`. Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` ou **não ponha `imagem`** no item: ele vira um cartão de papel pardo com o nome, que cai do mesmo jeito. **Um kit inteiro sem foto é um estilo válido.**
4. Nos itens, `imagem: { "id": "tripe" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a descrição do vídeo.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, dado ou imagem entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o objeto cai no lugar certo, o cartão mostra a coisa inteira (sem texto nem marca d'água) e a etiqueta tem o nome que a pessoa disse?
- a linha pontilhada liga o cartão à etiqueta e o contador mostra o número certo?
- na vista final, todos os itens cabem e leem bem? A câmera fica parada por pelo menos 1,2 s com o kit completo?
- as folhas dos outros blocos ocupam a mesa (nada pequeno no topo com a madeira vazia embaixo), o texto cabe e nada passa da borda da mesa para a moldura da pessoa?
- o rosto está inteiro e centralizado na moldura da direita, e a legenda fica no terço de baixo, dentro da moldura (ou no meio, com a pessoa em tela cheia)? Ela sumiu quando a fala já está em destaque na mesa?
- nas trocas entre tela cheia e moldura, nenhum quadro com a mesa vazia quando a primeira peça já devia ter caído? Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 4.7 4.75 4.8 4.85 4.9`).
- nada importante abaixo de y 984 (controles do player)?

Corrija o plano (texto mais curto, outra imagem, outro foco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-kit.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- as **imagens usadas** e de onde vieram, e o texto do `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que só ele pode trocar por uma melhor).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | uma folha grande presa com fita no tampo, o título escrito palavra por palavra na fala, o `destaque` com marca-texto azul cobalto |
| lista | `topicos` | etiquetas de papel que caem uma a uma (numeração em círculo cobalto, `detalhe` pequeno); título numa tira de papel pardo |
| passos | `passos` | as mesmas etiquetas numeradas, ligadas por um barbante pontilhado cobalto que desce até o passo da vez |
| número | `numero` | etiqueta de preço pendurada por um barbante, com furo: o número conta em cobalto, o rótulo aparece embaixo |
| comparação | `comparacao` | duas folhas lado a lado com a aba do rótulo colorida (`contra` cobalto/tinta, `antes-depois` cinza/cobalto, `errado-certo` vermelho/verde); no vencedor, um selo verde ✓; o outro desbota |
| gráfico | `grafico` | folha quadriculada com barras, linha ou pizza desenhadas; sem números ditos, a curva da tendência com a etiqueta `ilustrativo` |
| destaque | `destaque` | cartão carimbado: `chave` em cobalto com texto branco, `alerta` com borda e texto vermelhos (caixa alta); `detalhe` numa etiqueta kraft |
| definição | `definicao` | ficha de dicionário com linha vermelha: o termo grande em cobalto, o significado se revela na fala |
| frase | `frase` | folha com aspas grandes, palavra por palavra; `destaque` em marca-texto; `risco` riscado a caneta vermelha quando é dito |
| pergunta | `pergunta` | folha com a pergunta e um "?" grande ao fundo; as `opcoes` caem como post-its coloridos |
| fechamento | `cta` | cartão largo no pé da mesa com o ícone num círculo cobalto (`salvar`, `seguir`, `comentar`, `link`); o kit completo continua visível atrás |
| **assinatura** | `kit` | a mesa com lugares pontilhados numerados; por item: a câmera chega, o objeto cai no cartão, a linha pontilhada liga à etiqueta (nome, `detalhe`, `preco`), o contador anda; `afastarEm` mostra tudo; `total` cai como uma etiqueta kraft embaixo |

## A assinatura em qualquer assunto

O `kit` é **"as poucas coisas que formam o todo"**: qualquer conjunto finito que a pessoa enumera vira lugares numa mesa que o espectador vê se preencher, e a vista final é o resumo para salvar. Cada item precisa de `nome` (curto, até ~28 caracteres) e `em` (o instante em que a pessoa o diz); o resto é opcional.

1. **Finanças/cripto.** "Para avaliar um projeto eu olho três coisas: o mercado, os riscos e a escolha dos ativos. Sem promessa de lucro."
   `kit` com três itens **sem imagem** (cartões de papel pardo): "O mercado", "Os riscos", "A escolha dos ativos", `total: "Sem promessa de lucro"`. Se o usuário quiser objetos, 3D genéricos (`moeda`, `cofre`, `gráfico`); nada de logo.
2. **Saúde ou rotina.** "Na minha bolsa de academia tem sempre quatro coisas: garrafa d'água, toalha, fone e a corda de pular."
   `kit` com quatro itens e uma foto de produto por item (`busca: "water bottle"`, `"gym towel"`…), `detalhe` com o para quê ("para não desidratar").
3. **Algo bem distante (relacionamento ou história pessoal).** "O que fez meu casamento durar: conversar toda noite, nunca dormir brigados e rir de nós mesmos."
   `kit` com três itens de cartão tipográfico (não são objetos), `lugaresEm` na fala "o que fez durar", `total` com a conclusão.

Sem itens no vídeo? Procure o que a pessoa enumera sem notar (motivos, ferramentas, etapas, pilares); se não houver nada contável, use `topicos`/`passos`, mas toda edição tem um `kit`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço nem fato. O `preco` só entra se a pessoa disse o valor. A imagem ilustra o que foi dito; não mostra uma marca, uma pessoa real ou um produto que a fala não citou.
- Número ilustrativo só onde o bloco permite, sempre com a etiqueta `ilustrativo` visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Num vão entre dois itens do kit, cabe o `detalhe` do item (com `detalheEm`) ou um `destaque`. Não use `--forcar`.
- **A mesa abre e fecha toda hora**: respiros curtos (menos de ~1,2 s) já mantêm a mesa aberta; se o vaivém incomodar, encoste os momentos vizinhos (`ate` de um = `de` do outro) ou ponha um bloco no trecho.
- **Os itens são falados colados**: a câmera precisa de ~0,4 s para chegar. Mantenha uma pausa de 0,2 a 0,3 s entre eles no passo 3 ou use menos `detalhe`.
- **A foto tem texto, marca ou fundo escuro**: outra candidata, outro foco, ou nenhuma imagem (cartão de papel pardo). Imagem feia é pior que cartão. Fundo branco é o ideal: o cartão é de papel branco.
- **A busca trouxe quadros, logotipos ou algo errado**: busque em inglês e pelo nome mais específico, ou peça a foto ao usuário (`imagens/`).
- **O nome do item não cabe**: a etiqueta reduz o corpo até 28 px e quebra em 2 linhas; encurte o `nome` e ponha o resto em `detalhe`.
- **Mais de 6 itens**: divida em dois kits (dois momentos `kit` com `de`/`ate` diferentes).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
