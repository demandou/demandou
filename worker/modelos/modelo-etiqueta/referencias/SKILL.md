---
name: modelo-etiqueta
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Etiqueta, a prateleira em degraus de preço: parede verde-menta em cima com três degraus (barato, médio, caro) e a pessoa embaixo; cada preço dito faz uma etiqueta cair, balançar e contar o valor, o produto cai no degrau, a faixa mostra \"o que muda\", um medidor \"vale a pena?\" move a agulha e um selo carimba o melhor custo-benefício. Funciona sem foto, com cartões tipográficos. Serve para qualquer comparação de faixas (planos, hotéis, cursos, ferramentas, serviços, produtos): a IA traduz a fala para os blocos do estilo e busca as imagens. Use quando o usuário pedir \"modelo Etiqueta\", \"barato, médio e caro\", \"vale a pena\", \"custo-benefício\", \"faixas de preço\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Etiqueta

O vídeo vira uma prateleira em degraus de preço: a pessoa embaixo, uma parede verde em cima onde cada preço dito pendura uma **etiqueta** que balança e conta o valor, e o produto cai no **degrau** dele. A faixa do degrau mostra **o que muda** e quanto o preço subiu; um **medidor** "vale a pena?" vai de um degrau a outro, e um **selo** carimba o melhor custo-benefício. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com tênis de corrida, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** cada preço dito faz a etiqueta **cair** do varal (0,5 s, com passar do ponto), **balançar** como pêndulo e **contar** do zero ao valor; o degrau sobe e o produto cai nele, amassa de leve e deixa sombra. O que muda sobe na faixa do degrau com a diferença de preço. A agulha do medidor procura no meio e salta de degrau em degrau; o selo carimba girando enquanto os outros degraus esmaecem. Nada de fade lento; sempre algo novo a cada ~1,5 s.
- **Organização e hierarquia:** a parede fica entre y 132 e y 900: título numa linha, varal em y 232, etiquetas escalonadas (a do mais caro no alto), degraus que sobem da esquerda (barato) para a direita (caro), medidor no canto de cima à esquerda. Cada degrau tem `$`, `$$`, `$$$`, a pílula "o que muda", a diferença em tomate e o texto.
- **Tipografia:** uma família só, **Sora** (Google Fonts), larga e redonda, com algarismos claros: 800 em preços, rótulos e textos. Preço 32–56 px, texto do degrau 30–40 px, título 42–62 px. Nada condensado, nada com contorno.
- **Moldura da pessoa:** quadro cheio quando não há prateleira (abertura, fechamento); com a prateleira, a pessoa vai para a metade de baixo (a partir de y 900), cabeça inteira logo abaixo da legenda da emenda. A troca empurra: a parede desce junto com a emenda em 0,4 s. Nunca coluna estreita ao lado. O rosto é seguido quadro a quadro.
- **Cores, textura e som:** verde-menta (#0E7C66) com furinhos de painel; **papel creme** (#FFF6E3) nas etiquetas e cartões, texto tinta verde-garrafa (#10352D); **tomate** (#E8402B) no preço, nas tarjas e na palavra falada; **limão** (#FFE14D, texto escuro) no que muda, no destaque e no selo; madeira clara nos degraus. Sombras sob as peças, nunca brilho atrás da pessoa. Sons tonais e raros: um "tum" na etiqueta, um tique na faixa, um toque na agulha e uma subida de notas no selo.

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

Neste modelo **as pausas viram cortes secos**, mas cada degrau precisa de espaço para a etiqueta cair e o preço contar (cerca de 1 s entre um preço e o próximo). Se a pessoa fala os preços muito coladinhos, **mantenha uma pausa curta** (0,2 a 0,3 s) entre eles; se o vídeo ficar longo demais, corte as explicações de cada item em vez de apertar as pausas.

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

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: ache as **faixas** (os 2 a 4 níveis que a pessoa compara, do mais barato ao mais caro), o instante em que diz o preço de cada uma (`em`), o instante em que diz **o que muda** (`textoEm`) e o instante em que **avalia** se vale a pena (`valeEm`). Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`etiqueta`) entra uma vez, com todos os degraus num só momento** (ou em vários momentos com o mesmo `titulo`, para intercalar outros blocos entre os degraus). Abra com a `abertura` (o gancho) e, se a pessoa escolhe uma faixa, feche com o `selo`.

- Faixas sem preço (planos "básico, pro, premium")? Peça os valores ao usuário (o degrau precisa de `preco`) ou use `topicos` para o que não tem número.
- Se a pessoa não escolhe uma faixa, não ponha `selo`. O medidor continua valendo (`vale` nos degraus).
- Se o vídeo explica cada faixa por muito tempo, use um `etiqueta` por degrau, todos com o mesmo `titulo`, e entre eles os outros blocos (`numero`, `comparacao`, `destaque`…) com a pessoa embaixo da parede.
- Sem faixas de preço (ex.: um relato)? Procure o que se compara em níveis: opções do mais simples ao mais completo, ou do pior ao melhor.

### 6b. Imagens

Leia `references/imagens.md`.

1. Para cada degrau, liste o produto que a pessoa nomeia (uma imagem por degrau; ela pousa no degrau, então prefira **objeto inteiro com fundo transparente**). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "tapioca crepe"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Escolha a candidata que mostra a coisa inteira, reconhecível em 1 s, sem gente reconhecível, logo ou texto, **de preferência um objeto recortado** (PNG transparente: o Fluent 3D ou a pasta `imagens/`). Uma busca em português pode trazer quadros ou nomes de coisas diferentes: busque em inglês e pelo nome mais específico.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` ou **não ponha `imagem`** no degrau: ele ganha um cartão de papel com o `nome`. **Uma prateleira inteira sem foto é um estilo válido.**
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos degraus, `imagem: { "id": "tenis1" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

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

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade (para a prateleira, peça também quadros nos instantes de cada `em` + 0,6 s e do selo + 0,5 s):
- a etiqueta cai quando o preço é dito e o número final é o preço dito? O produto está no degrau certo?
- a faixa do degrau mostra o texto certo e a diferença de preço correta (preço do degrau menos o do degrau de baixo)? O texto cabe e **não fica atrás da legenda** (a legenda ocupa y ~860–940)?
- o medidor aparece ao lado da primeira etiqueta, a agulha vai para onde a pessoa avaliou e não cobre o título nem a etiqueta?
- o selo carimba o degrau que a pessoa escolheu, legível, e os outros esmaecem?
- o título cabe em **uma linha** e nada passa da emenda (y 900)? Com 4 degraus, os textos continuam legíveis?
- o gancho aparece no primeiro quadro e termina em menos de 1,5 s? O texto cabe (nada cortado)?
- nas trocas, nenhum quadro com a metade de cima vazia, nenhum texto do peito em cima do rosto que ainda está subindo e nenhum texto sobre outro? Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 4.7 4.75 4.8 4.85 4.9`).
- nada importante fora das linhas da interface do app?

Corrija o plano (texto mais curto, outra imagem, outro foco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-etiqueta.mp4"
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
| abertura | `abertura` | quadro cheio: o gancho escrito em tarjas no peito, palavra por palavra em menos de 1 s, o `destaque` na tarja tomate; com `imagem`, por cima de uma foto em tela cheia |
| lista | `topicos` | pessoa embaixo: título branco com traço tomate; cada item é um cartão branco que salta no seu `em` (com a foto do item numa bolinha, se tiver `imagem`); o item da vez fica tomate |
| passos | `passos` | pessoa embaixo: cartões numerados ligados por um traço tomate que desce até o passo da vez |
| número | `numero` | quadro cheio: o número conta numa placa verde-escura gigante (pt-BR, algarismos fixos), o rótulo carimba numa tarja tomate embaixo, soco de zoom; com `imagem`, por cima da foto em tela cheia |
| comparação | `comparacao` | pessoa embaixo: dois cartões que se encaram (foto em cima se tiver `imagem`, rótulo na tarja, texto grande); antes de serem ditos, o lugar de cada um espera com um "?"; VS no meio (`contra`), seta (`antes-depois`), ✗ limão e ✓ verde (`errado-certo`); o vencedor ganha borda tomate, o outro fica cinza |
| gráfico | `grafico` | pessoa embaixo: barras brancas com a maior em tomate, linha tomate que anda de ponto em ponto, rosca colorida; sem números ditos, a curva da tendência (verde sobe, verde cai, limão oscila) com "ILUSTRATIVO" |
| destaque | `destaque` | quadro cheio: a palavra carimbada em tarjas tomate (`chave`) ou limão com texto escuro (`alerta`), inclinada; `detalhe` numa placa verde-escura menor embaixo |
| definição | `definicao` | pessoa embaixo: o termo enorme em branco sobre o verde, um traço tomate que se desenha embaixo, o significado num cartão branco que sobe na fala |
| frase | `frase` | quadro cheio: a frase em tarjas no peito, palavra por palavra na fala, com um selo tomate de aspas; `destaque` na tarja tomate; `risco` riscado em tomate quando é dito |
| pergunta | `pergunta` | pessoa embaixo: a pergunta grande em branco sobre o verde; as `opcoes` entram como opções de enquete (letra na bolinha tomate), a mais recente fica tomate; sem opções, um "?" tomate balançando |
| fechamento | `cta` | quadro cheio: a chamada em tarjas, `destaque` tomate, ícone num círculo tomate com um anel que pulsa (`salvar`, `seguir`, `comentar`, `link`), etiqueta com nome e área; fica até o último quadro |
| **assinatura** | `etiqueta` | a parede verde em cima com o varal, a pessoa embaixo: uma etiqueta de papel por preço dito (cai, balança, o preço conta) e o degrau que sobe com o produto em cima; a faixa do degrau mostra "o que muda" e a diferença de preço (`▲ +R$ 400`); o medidor "vale a pena?" (agulha entre NÃO e SIM) e o selo "melhor custo-benefício" que carimba o degrau escolhido enquanto os outros esmaecem |

## A assinatura em qualquer assunto

A `etiqueta` é **"o que você ganha a cada degrau que paga a mais, e onde está o ponto que compensa"**: qualquer coisa que tem faixas (de preço, de nível, de esforço) vira degraus de uma prateleira, e o selo no meio segura a atenção até o veredito. Cada degrau precisa de **o preço dito** (`em`, `preco`), **o que muda** (`texto`, curto) e, se a pessoa avalia, **quanto vale a pena** (`vale`).

1. **Finanças/cripto.** "Três jeitos de guardar cripto. Deixar na corretora é de graça, mas a chave não é sua. Uma carteira de aplicativo custa zero e você guarda a chave. Uma carteira física custa uns 500 reais e é o mais seguro. Para quem tem pouco, o aplicativo é o que compensa."
   `etiqueta` com `titulo: "Onde guardar"`, três degraus: "Corretora" (`preco` 0, "Chave não é sua"), "Aplicativo" (`preco` 0, "Você guarda a chave"), "Física" (`preco` 500, "O mais seguro"), sem imagem (cartões com o `nome`); `selo` no segundo. Preços iguais não mostram diferença (`▲ +R$ 0`): nesse caso use `topicos` ou ponha um valor só nos degraus que têm.
2. **Saúde ou rotina.** "Academia de 100, 200 ou 400 reais por mês. A de 100 tem os aparelhos e pronto. A de 200 tem aula coletiva e acompanhamento. A de 400 tem personal. Se você treina sozinho, a de 200 já basta."
   `etiqueta` com `titulo: "Academia"`, `sufixo: "/mês"`, três degraus com fotos de aparelho, aula e personal; `selo` no do meio com `texto: "Já basta"`.
3. **Algo bem distante (viagem ou carreira).** "Hotel de 100, 500 ou 2.000 reais a diária. O de 100 é só a cama. O de 500 tem café da manhã e piscina. O de 2.000 tem vista e serviço de quarto. Para uma viagem de poucos dias, o de 500 é o ponto certo."
   `etiqueta` com `titulo: "Hotel"`, `sufixo: "/diária"`, fotos ou cartões, `vale` crescendo e caindo (0,3, 0,85, 0,4) e `selo` no do meio.

Sem faixas no vídeo? Procure o que a pessoa compara em níveis (opções, planos, versões) e use `topicos` ou `passos` para o que não for faixa; mas toda edição tem uma `etiqueta`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("praticamente não estraga" não vira "nunca estraga").
- Não invente número, nome, preço nem fato. Os **preços são os que a pessoa disse**, em ordem do mais barato ao mais caro; a diferença entre degraus é só a conta dos dois preços ditos. A agulha do medidor segue a avaliação que ela fez: nunca invente um veredito. A imagem ilustra o que foi dito; não mostra algo que a fala não disse (nada de foto de uma marca, de uma pessoa real ou de um "print" que não existe).
- Número ilustrativo só onde o bloco permite (a curva de tendência, `ilustrativo: true`), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Num vão entre dois degraus, cabe um `destaque` ou um `numero` com a pessoa embaixo da parede. Não use `--forcar`.
- **A pessoa fala os preços colados** (como "200, 600 e 1.500"): é normal, as etiquetas caem em sequência (a ordem é a da fala).
- **A foto tem pouca resolução, texto ou marca d'água**: outra candidata, outro foco, ou nenhuma foto naquele degrau (o cartão tipográfico). Imagem feia é pior que cartão.
- **A busca trouxe quadros, logotipos ou algo errado** (acontece com palavras ambíguas): busque em inglês e pelo nome mais específico, ou peça a foto ao usuário (`imagens/`).
- **O texto do degrau não cabe**: o degrau reduz o corpo até 30 px e quebra em 3 linhas; encurte o `texto` (até ~28 caracteres).
- **Mais de 4 degraus**: as colunas ficam estreitas demais. Divida em duas prateleiras (dois momentos `etiqueta` com títulos diferentes).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache. Rode de novo mais tarde para os que ficaram sem imagem.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **O texto do peito entrou um pouco depois da palavra**: logo depois da prateleira ou de uma lista, ele espera a pessoa voltar para o quadro cheio (para não cair em cima do rosto). Se a palavra é importante, termine o momento anterior um pouco antes.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
