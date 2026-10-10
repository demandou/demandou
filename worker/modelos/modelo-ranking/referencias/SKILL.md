---
name: modelo-ranking
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Ranking, a contagem regressiva: um placar azul de quadra em cima com as casas do N ao 1 e a pessoa embaixo; em cada posição o número bate num selo limão, a foto toma a tela por cerca de 1 segundo e voa para a casa dela no placar, e o 1º lugar fica escondido atrás de um \"?\" até o fim, quando um foco de luz o revela. Funciona também sem foto, com cartões tipográficos. Em Rubik larga, azul, giz e limão. Serve para qualquer assunto (o exemplo do modelo é um top 5 de lanches de rua, mas funciona com filmes, ferramentas, hábitos, erros, investimentos, cidades, dicas, o melhor e o pior de qualquer coisa): a IA traduz a fala para os blocos do estilo e busca as imagens sozinha. Use sempre que o usuário pedir para editar \"no modelo Ranking\", \"estilo ranking\", \"top 5\", \"contagem regressiva\", \"do último ao primeiro\" ou \"placar\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Ranking

O vídeo vira um placar que se completa: a pessoa embaixo, um placar azul em cima com as casas do N ao 1 esperando vazias. A cada posição dita, o número **bate** num selo limão, a foto da coisa **toma a tela** por cerca de um segundo e **voa** para a casa dela, onde assenta com o nome. O primeiro lugar fica escondido atrás de um "?" até o fim, e é revelado com um foco de luz. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com lanches de rua, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** o ritmo é o da contagem regressiva. Cada posição tem três tempos: o número **bate** (um selo limão de 330 px salta no meio do placar, treme e voa em 0,25 s para a aba da casa, 0,5 s no total); a foto **toma a tela** por cerca de 1 s (entra 7% maior e assenta, aproxima devagar; a aba do número e uma plaquinha com o nome por cima); a foto **voa** em 0,5 s, encolhendo e inclinando, até a miniatura da casa, e o nome desliza para dentro dela. Casas vazias esperam desde o começo (tracejadas); a aba da casa da vez é limão e assenta em azul. O 1º lugar espera atrás de um "?" que balança, com uma luz que corre pela casa; quando é dito, o placar escurece, um feixe de luz cai sobre a casa e a foto chega com uma moldura limão e 30% mais tempo de tela. Nada de fade; entradas secas, com um leve passar do ponto.
- **Organização e hierarquia:** o placar fica entre y 132 e y 872, com o 1º lugar no alto e o último embaixo; a contagem **sobe** do fim para o começo. Título do placar numa tarja azul, com "TOP N" em limão. Cada casa: aba quadrada com o número, corpo de giz com o nome em caixa alta e a miniatura à direita (sem foto, o corpo todo é um cartão azul com o nome). Uma ideia por vez: só a casa da vez está acesa.
- **Tipografia:** uma família só, **Rubik** (Google Fonts), larga, de cantos levemente arredondados e algarismos fortes: 900 em caixa alta nos números, nomes, títulos e tarjas; 700–800 nos detalhes. Nome na casa 26–62 px (cabe a 2 linhas); nome na tela cheia até 150 px; selo do número 330 px. Nada condensado, nada com contorno.
- **Moldura da pessoa:** quadro cheio quando não há placar (abertura, fechamento); com o placar, a pessoa vai para a metade de baixo (a partir de y 900) com a cabeça inteira logo abaixo da legenda da emenda. A troca empurra: o placar desce junto com a emenda em 0,4 s. Nunca coluna estreita ao lado. O rosto é seguido quadro a quadro.
- **Cores, textura e som:** azul de quadra (#101A8C) no placar; **limão** (#D2F43C, texto escuro) para a casa da vez, o número que bate, o 1º lugar e o foco de luz; **azul vivo** (#3347FF, borda #1B2AC4) para tarjas, a palavra falada e a barra de progresso; casas de **giz** (#F6F3E8) com texto tinta (#0B1040); verde só para o lado certo. Sombras duras embaixo das peças, nunca brilho atrás da pessoa. Sons tonais e raros: um "tum" no número, um deslize curto no voo, um toque ao assentar, um suspense baixo antes do 1º lugar e uma subida de notas na revelação.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Curiosidades"): vão numa etiqueta embaixo da chamada final. Sem resposta, siga sem nome. Pergunte também se ele tem **imagens próprias** (produto, print, foto pessoal): elas vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas.

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

Neste modelo **as pausas viram cortes secos**, mas cada posição precisa de espaço para o número bater e a foto voar (cerca de 2 s entre uma posição e a próxima). Se a pessoa fala os itens muito coladinhos, **mantenha uma pausa curta** (0,2 a 0,3 s) entre eles; se o vídeo ficar longo demais, corte as explicações de cada item em vez de apertar as pausas.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa muda de lugar entre o quadro cheio e a metade de baixo); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, as imagens e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a metade de baixo acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a caixa verde tracejada (a zona do peito, onde ficam os textos de quadro cheio) deve começar abaixo do queixo; as linhas amarelas são a faixa da legenda; a rosa é a emenda (onde a pessoa começa quando desce); nada importante fora das linhas vermelhas (interface do aplicativo, e a coluna de botões à direita). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: ache a **lista** (os itens que a pessoa ordena), a posição de cada um (`em` = quando diz "em quinto", "número 3", "o segundo") e o instante em que diz o nome (`textoEm`). Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`ranking`) entra uma vez, com todos os itens da lista num só momento** (ou em vários momentos com o mesmo `titulo`, para intercalar outros blocos entre as posições). Abra com a `abertura` (o gancho) e feche com o `cta` ("comenta o seu número 1").

- Quem fala o ranking de trás para a frente (5, 4, 3…) tem o efeito completo: o 1º fica escondido até o fim. Se fala do 1º para o último, use `"segredo": false`.
- Se o vídeo tem **mais de uma lista** ou explica cada item por muito tempo, use um `ranking` por posição, todos com o mesmo `titulo`, e entre eles os outros blocos (`numero`, `comparacao`, `destaque`…) com a pessoa embaixo do placar.
- Ranking sem lista (ex.: um relato)? Procure o que a pessoa ordena sem perceber: erros do pior ao pior, etapas, motivos, lugares.

### 6b. Imagens

Leia `references/imagens.md`.

1. Para cada posição do ranking, liste a coisa que a pessoa nomeia (uma imagem por posição; ela ocupa a tela inteira por ~1 s, então pesa mais que em outros modelos). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "tapioca crepe"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs --lado 2400`: a foto precisa de resolução para cobrir 1080×1920. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Escolha a candidata que mostra a coisa inteira, reconhecível em 1 s, sem gente reconhecível, logo ou texto, **grande e de preferência em pé** (ela cobre a tela). Uma busca em português pode trazer um quadro com o nome (ex.: "pastel" traz pinturas de Degas): busque em inglês ou com o nome do prato.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` ou **não ponha `imagem`** na posição: ela vira um cartão tipográfico azul com o nome, que faz o mesmo caminho (toma a tela, voa e vira o corpo da casa). **Um ranking inteiro sem foto é um estilo válido.**
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos itens do ranking, `imagem: { "id": "pastel" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, dado ou imagem entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (o template ainda as quebra em telas de até 3 palavras).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "chat GPT": "ChatGPT" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade (para um ranking, peça também quadros nos instantes de cada posição: `em`, `textoEm` + 0,4 s e `voaDe` + 0,25 s):
- o selo do número bate no meio do placar e a aba da casa certa fica limão? O número é o da posição que a pessoa disse?
- a foto em tela cheia mostra a coisa inteira, **acima da plaquinha com o nome** (que fica em y ~1050), sem texto, marca d'água ou gente reconhecível? O nome cabe?
- o voo termina na casa certa, e a miniatura assentada é a mesma foto?
- o 1º lugar está escondido (com "?") até ser dito, e a revelação escurece o placar e acende a casa?
- as casas vazias aparecem desde o começo e o placar não passa da emenda (y 900)? Com 6 a 8 posições, os nomes continuam legíveis?
- o gancho aparece no primeiro quadro e termina em menos de 1,5 s? O texto cabe (nada cortado)?
- nas trocas, nenhum quadro com a metade de cima vazia, nenhum texto do peito em cima do rosto que ainda está subindo e nenhum texto sobre outro? Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 4.7 4.75 4.8 4.85 4.9`).
- nada importante fora das linhas da interface do app?

Corrija o plano (texto mais curto, outra imagem, outro foco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-ranking.mp4"
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
| abertura | `abertura` | quadro cheio: o gancho escrito em tarjas no peito, palavra por palavra em menos de 1 s, o `destaque` na tarja azul vivo; com `imagem`, por cima de uma foto em tela cheia |
| lista | `topicos` | pessoa embaixo: título branco com traço azul vivo; cada item é um cartão branco que salta no seu `em` (com a foto do item numa bolinha, se tiver `imagem`); o item da vez fica azul vivo |
| passos | `passos` | pessoa embaixo: cartões numerados ligados por um traço azul vivo que desce até o passo da vez |
| número | `numero` | quadro cheio: o número conta numa placa azul-escura gigante (pt-BR, algarismos fixos), o rótulo carimba numa tarja azul vivo embaixo, soco de zoom; com `imagem`, por cima da foto em tela cheia |
| comparação | `comparacao` | pessoa embaixo: dois cartões que se encaram (foto em cima se tiver `imagem`, rótulo na tarja, texto grande); antes de serem ditos, o lugar de cada um espera com um "?"; VS no meio (`contra`), seta (`antes-depois`), ✗ limão e ✓ verde (`errado-certo`); o vencedor ganha borda azul vivo, o outro fica cinza |
| gráfico | `grafico` | pessoa embaixo: barras brancas com a maior em azul vivo, linha azul vivo que anda de ponto em ponto, rosca colorida; sem números ditos, a curva da tendência (verde sobe, azul cai, limão oscila) com "ILUSTRATIVO" |
| destaque | `destaque` | quadro cheio: a palavra carimbada em tarjas azul vivo (`chave`) ou limão com texto escuro (`alerta`), inclinada; `detalhe` numa placa azul-escura menor embaixo |
| definição | `definicao` | pessoa embaixo: o termo enorme em branco sobre o azul, um traço azul vivo que se desenha embaixo, o significado num cartão branco que sobe na fala |
| frase | `frase` | quadro cheio: a frase em tarjas no peito, palavra por palavra na fala, com um selo azul vivo de aspas; `destaque` na tarja azul vivo; `risco` riscado em azul vivo quando é dito |
| pergunta | `pergunta` | pessoa embaixo: a pergunta grande em branco sobre o azul; as `opcoes` entram como opções de enquete (letra na bolinha azul vivo), a mais recente fica azul vivo; sem opções, um "?" azul vivo balançando |
| fechamento | `cta` | quadro cheio: a chamada em tarjas, `destaque` azul vivo, ícone num círculo azul vivo com um anel que pulsa (`salvar`, `seguir`, `comentar`, `link`), etiqueta com nome e área; fica até o último quadro |
| **assinatura** | `ranking` | o placar do N ao 1 em cima, a pessoa embaixo: título numa tarja azul com "TOP N" em limão; casas vazias tracejadas desde o começo; em cada posição, o selo limão bate no meio do placar e voa para a aba, a foto toma a tela por ~1 s (`tela`, de 0,5 a 1,5) com a aba do número e a plaquinha do nome, e voa para a miniatura da casa (sem foto, um cartão azul com o nome voa e vira o corpo da casa); `detalhe` numa linha pequena abaixo do nome; o 1º lugar espera atrás de um "?" até ser dito (`segredo: false` desliga) e é revelado com um foco de luz |

## A assinatura em qualquer assunto

O `ranking` é **"uma lista que se completa até o melhor (ou o pior)"**: qualquer coisa que a pessoa ordena, do último ao primeiro, vira casas de um placar que o espectador quer ver completo, e o primeiro lugar escondido segura a atenção até o fim. Os itens podem ser coisas (foto), ideias ou erros (cartão tipográfico). Cada item precisa de **a posição dita** (`em`) e **o nome** (`texto`, curto, até ~28 caracteres).

1. **Finanças/cripto.** "Os três erros que mais quebram quem começa em cripto. Em terceiro, comprar porque o preço subiu. Em segundo, deixar tudo numa corretora só. E em primeiro: investir dinheiro que você não pode perder."
   `ranking` com `titulo: "Erros em cripto"`, `total: 3` e três itens **sem imagem** (cartões tipográficos): "Comprar porque subiu" (posição 3), "Tudo numa corretora" (2), "Dinheiro que não pode perder" (1, escondido até o fim). Se o usuário quiser fotos, objetos 3D genéricos (`moeda`, `cofre`); nada de logo.
2. **Saúde ou rotina.** "Cinco hábitos que melhoram o meu sono, do menos para o mais importante: ler antes de dormir, quarto escuro, sem cafeína à tarde, horário fixo e, em primeiro, celular fora do quarto."
   `ranking` com cinco itens, `titulo: "Hábitos do sono"`, uma foto por item (`busca: "reading book in bed"`, `"dark bedroom"`…); o 1º, "Celular fora do quarto", só aparece no fim.
3. **Algo bem distante (carreira ou história pessoal).** "Os empregos que mais me ensinaram. Em quarto, vender pão com meu pai. Em terceiro, o estágio que paguei para fazer. Em segundo, lavar louça num restaurante. E em primeiro, o dia em que fui demitido."
   `ranking` com quatro itens de cartão tipográfico (sem foto: são memórias) e `detalhe` em cada casa com uma palavra da fala ("aos 12 anos"); depois, um `destaque` no 1º. A revelação do "demitido" é o gancho emocional.

Sem lista no vídeo? Procure o que a pessoa ordena sem notar (motivos, etapas, erros, lugares) e use `topicos` ou `passos` para o que não for ranking; mas toda edição tem um `ranking`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("praticamente não estraga" não vira "nunca estraga").
- Não invente número, nome, preço nem fato. A **ordem do ranking é a que a pessoa disse**: nunca reordene nem adivinhe uma posição que ela não falou. A imagem ilustra o que foi dito; não mostra algo que a fala não disse (nada de foto de uma marca, de uma pessoa real ou de um "print" que não existe).
- Número ilustrativo só onde o bloco permite (a curva de tendência, `ilustrativo: true`), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Num vão entre duas posições, cabe um `destaque` ou um `numero` com a pessoa embaixo do placar. Não use `--forcar`.
- **A pessoa fala os itens colados e a foto não cabe**: o `ranking` já encurta a foto para a próxima posição não esbarrar nela (mínimo 0,4 s). Se ficar apertado, use `tela: 0.6`, tire `detalhe` e corte a explicação de cada item no passo 3.
- **A foto tem pouca resolução, texto ou marca d'água**: outra candidata (`--lado 2400`), outro foco, ou nenhuma foto naquela posição (o cartão tipográfico). Imagem feia é pior que cartão.
- **A busca trouxe quadros, logotipos ou algo errado** (acontece com palavras como "pastel"): busque em inglês e pelo nome mais específico, ou peça a foto ao usuário (`imagens/`).
- **O nome da posição não cabe**: o placar reduz o corpo até 26 px e quebra em 2 linhas; se ainda ficar apertado, encurte o `texto` (até ~28 caracteres) e ponha o resto em `detalhe`.
- **Mais de 6 posições**: as casas diminuem (mínimo 76 px). Passou de 8, divida em dois placares (dois momentos `ranking` com títulos diferentes).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache. Rode de novo mais tarde para os que ficaram sem imagem.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **O texto do peito entrou um pouco depois da palavra**: logo depois do placar ou de uma lista, ele espera a pessoa voltar para o quadro cheio (para não cair em cima do rosto). Se a palavra é importante, termine o momento anterior um pouco antes.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
