---
name: modelo-viral
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Viral, a edição de retenção dos Reels: gancho escrito no primeiro segundo, legenda karaokê com a palavra falada numa tarja rosa, zoom de impacto seguindo o rosto nos cortes e nas palavras fortes, imagens que cortam para a tela cheia ou saltam como cartão acima da cabeça (a pessoa desce para a metade de baixo) e barra de progresso no topo, em Montserrat cheia, placas escuras e rosa. Serve para qualquer assunto (o exemplo do modelo é uma curiosidade sobre mel, mas funciona com notícias, finanças, cripto, saúde, negócios, histórias, aulas): a IA traduz a fala para os blocos do estilo e busca as imagens sozinha. Use sempre que o usuário pedir para editar \"no modelo Viral\", \"estilo viral\", \"edição de retenção\", \"com legenda karaokê\", \"com imagens que aparecem na fala\" ou \"estilo curiosidades\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Viral

O vídeo vira uma edição de retenção: a pessoa em quadro cheio, com um salto de zoom no rosto a cada corte e a cada palavra forte; a legenda em telas curtas de até três palavras, com uma tarja rosa que corre de palavra em palavra; e, nas coisas concretas que a pessoa nomeia, a imagem **corta** para a tela inteira por um segundo ou **salta** como um cartão acima da cabeça enquanto a pessoa desce para a metade de baixo. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma curiosidade (o mel que não estraga), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** ritmo de retenção. O gancho é escrito nos primeiros ~0,8 s (a primeira palavra já está no primeiro quadro). Cada corte do vídeo é um salto seco de zoom (alterna 100% e 109%); cada palavra forte (destaque, número, gancho, chamada) é um "soco" de zoom de 11% que entra em 0,14 s e volta devagar, sempre centrado no rosto (o rosto é seguido quadro a quadro). Textos chegam como adesivos: escala com um leve passar do ponto (0,25 s), o destaque chega como carimbo (maior → assenta em 0,2 s). A imagem do corte entra seca, 7% maior, e assenta; depois aproxima devagar. Nada fica parado: a tarja da legenda anda a cada palavra.
- **Organização e hierarquia:** três lugares que se alternam. **Quadro cheio** (a pessoa inteira; o texto em tarjas na altura do peito); **imagem em cima, pessoa embaixo** (a pessoa desce para a metade de baixo e a metade de cima recebe o cartão de imagem, a lista, a comparação, o gráfico); **imagem em tela cheia** (o corte, ~1 s, com a legenda por cima). Uma ideia por tela; o texto principal grande, rótulos menores.
- **Tipografia:** uma família só, **Montserrat** (Google Fonts), larga e cheia: 900 em caixa alta na legenda, no gancho, nos destaques, números e títulos; 800 em itens e opções; 700 em detalhes. Algarismos de largura igual nos contadores. Legenda 66 px; gancho 62–112; destaque 64–128; número 96–230; títulos 44–78; itens 28–62. Nada condensado, nada com contorno: o contraste vem das placas escuras e das tarjas de cor.
- **Moldura da pessoa:** quadro cheio com o rosto na linha do centro e zoom de impacto; ou a metade de baixo (a partir de y 820), com a cabeça inteira logo abaixo da legenda, que fica na emenda. A troca empurra: a metade de cima desce junto com a emenda e a pessoa desliza para baixo (0,38 s); na volta, ela sobe cobrindo tudo. Nunca coluna estreita ao lado.
- **Cores, textura e som:** placas grafite quase pretas (#121016, 90%) atrás do texto branco; **rosa** (#FF2E63, com uma borda mais escura embaixo, cara de adesivo) para a palavra falada, o trecho em destaque, a emenda e a barra de progresso; **amarelo** (#FFC21A, texto escuro) só para alerta; verde (#2BD97C) só para o lado certo. Sons tonais e raros: um "tum" grave no corte, uma bolha no cartão que salta, um grave redondo no carimbo, duas notas descendo no alerta, um toque curto em itens e três notas subindo no fechamento.

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

Neste modelo **as pausas viram cortes secos, e cada corte ganha um salto de zoom**: é o ritmo do estilo. Mantenha a proposta do `preparar`.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa muda de lugar entre o quadro cheio e a metade de baixo); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, as imagens e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): o zoom de impacto e a metade de baixo acompanham quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a caixa verde tracejada (a zona do peito, onde ficam os textos de quadro cheio) deve começar abaixo do queixo; as linhas amarelas são a faixa da legenda; a rosa é a emenda (onde a pessoa começa quando desce); nada importante fora das linhas vermelhas (interface do aplicativo, e a coluna de botões à direita). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 1 a 4 s (o Viral é rápido), dê a cada uma uma forma (lista, número, comparação, coisa concreta, palavra forte…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`corte` e `pop`) entra pelo menos uma vez**, e de preferência em toda coisa concreta que a fala nomeia: veja "A assinatura em qualquer assunto".

Alterne os três lugares: quadro cheio → imagem → quadro cheio. Nunca três momentos iguais seguidos. Abra com a `abertura` (o gancho) e feche com o `cta`.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (um a cada 2 a 4 s nos trechos de imagem; nunca duas na mesma frase). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "camera tripod"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos. Para as imagens que vão para a **tela cheia** (`corte`), rode com `--lado 2400`: a foto precisa de resolução para cobrir 1080×1920.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo ou texto (micrografias costumam ter uma faixa de dados embaixo: ela aparece na tela cheia); foto de verdade quando é foto; **em pé e grande (1600 px ou mais) para o `corte`**; as pequenas ou deitadas vão para o `pop` (cartão).
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira; as linhas da folha marcam 0,25 / 0,5 / 0,75). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (vira cartão com a palavra).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "mel", "efeito": "aproximar" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser, `impactos`. Cada item, lado, dado ou imagem entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (o template ainda as quebra em telas de até 3 palavras).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "chat GPT": "ChatGPT" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- a imagem do `corte` mostra o assunto inteiro e **acima da legenda** (se o assunto ficou pequeno numa foto larga, use `zoom` 1,3–1,6 no corte)? Nada de texto, marca d'água ou gente reconhecível?
- o cartão do `pop` está inteiro acima da legenda da emenda, e a cabeça da pessoa inteira embaixo?
- o gancho aparece no primeiro quadro e termina em menos de 1,5 s?
- o texto cabe (nada cortado), o número certo aparece quando a palavra é dita, a tarja da legenda cai na palavra falada?
- nas trocas, nenhum quadro com a metade de cima vazia, nenhum texto do peito em cima do rosto que ainda está subindo e nenhum texto sobre outro? Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 4.7 4.75 4.8 4.85 4.9`).
- nada importante fora das linhas da interface do app?

Corrija o plano (texto mais curto, outra imagem, outro foco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-viral.mp4"
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
| abertura | `abertura` | quadro cheio: o gancho escrito em tarjas no peito, palavra por palavra em menos de 1 s, o `destaque` na tarja rosa, com soco de zoom; com `imagem`, por cima de uma foto em tela cheia |
| lista | `topicos` | pessoa embaixo: título branco com traço rosa; cada item é um cartão branco que salta no seu `em` (com a foto do item numa bolinha, se tiver `imagem`); o item da vez fica rosa |
| passos | `passos` | pessoa embaixo: cartões numerados ligados por um traço rosa que desce até o passo da vez |
| número | `numero` | quadro cheio: o número conta numa placa escura gigante (pt-BR, algarismos fixos), o rótulo carimba numa tarja rosa embaixo, soco de zoom; com `imagem`, por cima da foto em tela cheia |
| comparação | `comparacao` | pessoa embaixo: dois cartões que se encaram (foto em cima se tiver `imagem`, rótulo na tarja, texto grande); antes de serem ditos, o lugar de cada um espera com um "?"; VS no meio (`contra`), seta (`antes-depois`), ✗ amarelo e ✓ verde (`errado-certo`); o vencedor ganha borda rosa, o outro fica cinza |
| gráfico | `grafico` | pessoa embaixo: barras brancas com a maior em rosa, linha rosa que anda de ponto em ponto, rosca colorida; sem números ditos, a curva da tendência (verde sobe, rosa cai, amarela oscila) com "ILUSTRATIVO" |
| destaque | `destaque` | quadro cheio: a palavra carimbada em tarjas rosa (`chave`) ou amarelas com texto escuro (`alerta`), inclinada, com soco de zoom; `detalhe` numa placa escura menor embaixo |
| definição | `definicao` | pessoa embaixo: o termo enorme em branco, um traço rosa que se desenha embaixo, o significado num cartão branco que sobe na fala |
| frase | `frase` | quadro cheio: a frase em tarjas no peito, palavra por palavra na fala, com um selo rosa de aspas; `destaque` na tarja rosa; `risco` riscado em rosa quando é dito |
| pergunta | `pergunta` | pessoa embaixo: a pergunta grande em branco; as `opcoes` entram como opções de enquete (letra na bolinha rosa), a mais recente fica rosa; sem opções, um "?" rosa balançando |
| fechamento | `cta` | quadro cheio: a chamada em tarjas, `destaque` rosa, ícone num círculo rosa com um anel que pulsa (`salvar`, `seguir`, `comentar`, `link`), etiqueta com nome e área; fica até o último quadro |
| **assinatura** | `corte` | a imagem toma a tela inteira por 0,8–1,2 s: entra seca, 7% maior, assenta e aproxima devagar; a legenda continua por cima; `zoom` aproxima um assunto pequeno e o põe acima da legenda; `rotulo` opcional numa tarja no alto |
| **assinatura** | `pop` | a pessoa desce para a metade de baixo e um cartão de foto com borda branca salta acima da cabeça (inclinado, alternando o lado), sobre a própria foto desfocada; a legenda continua na emenda; objeto 3D transparente vira adesivo solto; `rotulo` opcional numa tarja no canto |

## A assinatura em qualquer assunto

O `corte` e o `pop` são **"mostre o que a pessoa acabou de nomear"**: cada coisa concreta da fala (um lugar, um objeto, um bicho, um produto, um gráfico, um documento) vira imagem no instante em que é dita. O `corte` é para o que merece a tela inteira por um segundo (lugar, paisagem, close impressionante, o resultado); o `pop` é para o que é melhor visto como objeto, ao lado da pessoa (produto, documento, foto pequena ou deitada). Mesmo um assunto abstrato tem coisas concretas: o exemplo, o lugar, o objeto que a pessoa usa para explicar.

1. **Finanças/cripto.** "O Bitcoin passou de 83 mil dólares, mas a maioria compra no impulso, na alta, e vende no pânico."
   `numero` 83.000 (`prefixo: "US$ "`, `rotulo: "o Bitcoin"`) → `corte` em "alta" com uma foto de pregão ou de um gráfico subindo num monitor (`busca: "stock market screen"`) → `pop` em "impulso" com um celular na mão (`busca: "smartphone in hand"`) → `destaque` alerta "vende no pânico". Sem marca e sem logo na busca: a moeda vira o objeto 3D `coin` (`tipo: "objeto"`), que o `pop` mostra como adesivo solto.
2. **Saúde (sono).** "Quem dorme menos de seis horas come mais doce no dia seguinte. A luz do celular atrasa o sono, então deixa ele fora do quarto."
   `numero` 6 (`rotulo: "horas de sono"`) → `pop` em "doce" (`busca: "chocolate cake slice"`) → `corte` em "luz do celular" com um quarto escuro iluminado pela tela (`busca: "phone screen dark bedroom"`) → `cta` "deixa ele fora do quarto" com `icone: "salvar"`.
3. **História pessoal (mudança de cidade).** "Eu saí de Recife com uma mala e quinhentos reais. O primeiro emprego foi lavando louça. Hoje eu tenho meu restaurante."
   `abertura` "Saí de Recife com uma mala" → `corte` em "Recife" (`busca: "recife brazil skyline"`) → `pop` em "mala" (`tipo: "objeto"`, o 3D de mala) → `numero` 500 (`prefixo: "R$ "`, `rotulo: "no bolso"`) → `comparacao` `antes-depois` ("lavando louça" × "meu restaurante") com `imagem` em cada lado (a foto do restaurante vem da pasta `imagens/` do usuário).

Sem nada concreto num trecho, use `destaque`, `frase` ou `topicos`; mas toda edição tem pelo menos um `corte` ou um `pop`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("praticamente não estraga" não vira "nunca estraga").
- Não invente número, nome, preço nem fato. A imagem ilustra o que foi dito; não mostra algo que a fala não disse (nada de foto de uma marca, de uma pessoa real ou de um "print" que não existe).
- Número ilustrativo só onde o bloco permite (a curva de tendência, `ilustrativo: true`), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Num vão, quase sempre cabe um `pop` ou um `corte` da coisa que a pessoa está nomeando. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: procure o exemplo, o lugar ou o objeto da fala (veja acima). Sem imagem boa, `--escolher <id> 0` vira um cartão tipográfico com a palavra, no mesmo lugar.
- **A imagem do corte ficou mole ou com o assunto pequeno**: escolha uma candidata em pé e maior (`--lado 2400`), mude o foco, use `zoom` no corte, ou leve a imagem para um `pop` (cartão menor fica nítido).
- **A imagem tem texto, marca d'água ou faixa de dados**: outra candidata, ou outro foco que tire a faixa do quadro; no `pop` o cartão recorta pelo foco.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache. Rode de novo mais tarde para os que ficaram sem imagem.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **O texto do peito entrou um pouco depois da palavra**: logo depois de um `pop` ou lista, ele espera a pessoa voltar para o quadro cheio (para não cair em cima do rosto). Se a palavra é importante, termine o momento anterior um pouco antes.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
