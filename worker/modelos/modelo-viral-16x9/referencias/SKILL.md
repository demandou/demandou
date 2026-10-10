---
name: modelo-viral-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Viral. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Viral, a edição de retenção: gancho escrito no primeiro segundo, legenda karaokê com a palavra falada numa tarja rosa, zoom de impacto seguindo o rosto nos cortes e nas palavras fortes, imagens que cortam para a tela cheia ou saltam como cartão no quadro da esquerda enquanto a pessoa vai para uma moldura à direita, e barra de progresso no topo, em Montserrat cheia, placas escuras e rosa. Serve para qualquer assunto (o exemplo do modelo é uma curiosidade sobre mel, mas funciona com notícias, finanças, cripto, saúde, negócios, histórias, aulas): a IA traduz a fala para os blocos do estilo e busca as imagens sozinha. Use sempre que o usuário pedir para editar \"no modelo Viral\", \"estilo viral\", \"edição de retenção\", \"com legenda karaokê\", \"com imagens que aparecem na fala\" ou \"estilo curiosidades\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação à esquerda)."
---

# Modelo Viral (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Viral no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: a mesma Montserrat, as mesmas placas escuras e tarjas rosa, a legenda karaokê, o zoom de impacto, o corte e o pop, os mesmos sons e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada, com a legenda no terço de baixo. Os blocos de apoio entram **só quando acrescentam clareza** à fala e a pessoa volta para o quadro cheio quando a ideia termina. É um vídeo longo: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** No vertical a pessoa descia para a metade de baixo; aqui ela desliza para uma **moldura na faixa da direita** (x 1180 a 1920, a altura toda), com o rosto centralizado nela e acompanhado com suavidade (o rastro do rosto), e o conteúdo (o cartão do `pop`, a lista, a comparação, o gráfico, a definição, a pergunta) ocupa o **quadro da esquerda** (x 96 a 1106, y 120 a 948), no fundo grafite. Um traço rosa vertical marca a emenda.
- **Os textos de quadro cheio viram fileiras.** O gancho, o destaque, a frase e a chamada ficam numa faixa larga na altura do peito (do queixo até y 948), em menos linhas; o número e o rótulo ficam lado a lado; o ícone da chamada fica ao lado do texto. Tudo é medido e encolhe até caber na largura e na altura da faixa.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira uma edição de retenção: a pessoa em quadro cheio, com um salto de zoom no rosto a cada corte e a cada palavra forte; a legenda em telas curtas de até três palavras, com uma tarja rosa que corre de palavra em palavra; e, nas coisas concretas que a pessoa nomeia, a imagem **corta** para a tela inteira por um segundo ou **salta** como um cartão no quadro da esquerda enquanto a pessoa vai para a moldura da direita. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma curiosidade (o mel que não estraga), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** ritmo de retenção. O gancho é escrito nos primeiros ~0,8 s (a primeira palavra já está no primeiro quadro). Cada corte do vídeo é um salto seco de zoom (alterna 100% e 109%); cada palavra forte (destaque, número, gancho, chamada) é um "soco" de zoom de 11% que entra em 0,14 s e volta devagar, sempre centrado no rosto (o rosto é seguido quadro a quadro). Textos chegam como adesivos: escala com um leve passar do ponto (0,25 s), o destaque chega como carimbo (maior → assenta em 0,2 s). A imagem do corte entra seca, 7% maior, e assenta; depois aproxima devagar. Nada fica parado: a tarja da legenda anda a cada palavra.
- **Organização e hierarquia:** três lugares que se alternam. **Quadro cheio** (a pessoa inteira; o texto em tarjas numa fileira larga na altura do peito); **pessoa na moldura da direita, quadro à esquerda** (a pessoa desliza para a faixa da direita e o quadro da esquerda recebe o cartão de imagem, a lista, a comparação, o gráfico); **imagem em tela cheia** (o corte, ~1 s, com a legenda por cima). Uma ideia por tela; o texto principal grande, rótulos menores.
- **Tipografia:** uma família só, **Montserrat** (Google Fonts), larga e cheia: 900 em caixa alta na legenda, no gancho, nos destaques, números e títulos; 800 em itens e opções; 700 em detalhes. Algarismos de largura igual nos contadores. No quadro deitado: legenda 60 px; gancho 52–96; destaque 56–110; número 84–190; rótulo do número 38–84; frase 44–80; chamada 48–86; títulos 44–78; itens 28–62. Nada condensado, nada com contorno: o contraste vem das placas escuras e das tarjas de cor.
- **Moldura da pessoa:** quadro cheio, como foi gravado, com zoom de impacto; ou a **moldura da direita** (x 1180 a 1920, a altura toda), com o rosto centralizado na largura dela, a ~40% da altura, um pouco mais perto (112%) e acompanhado com suavidade. A troca empurra: o quadro da esquerda entra junto com a emenda e a pessoa desliza para a direita (0,38 s); na volta, ela cresce de novo por cima de tudo. Nunca janelinha no canto.
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

Neste modelo **as pausas excessivas viram cortes secos, e cada corte ganha um salto de zoom**: é o ritmo do estilo. No vídeo completo (aula 9) mantenha as respirações naturais e o tempo de entender a explicação; a proposta do `preparar` já faz isso.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.36 --queixo-y 0.55
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para o zoom de impacto, para a faixa do peito e para a moldura da direita. Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, as imagens e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): o zoom de impacto e a moldura da direita acompanham quando a pessoa se mexe. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a caixa verde tracejada (a faixa do peito, onde ficam os textos de quadro cheio) deve começar abaixo do queixo; a caixa rosa tracejada é a moldura da direita (com a elipse rosa onde o rosto cai nela); a caixa azul clara é o quadro da esquerda; a amarela é a legenda; nada importante abaixo da linha vermelha (controles do player). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 6 s (no vídeo completo a explicação respira), dê a cada uma uma forma (lista, número, comparação, coisa concreta, palavra forte…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`corte` e `pop`) entra pelo menos uma vez**, e de preferência nas coisas concretas que a fala nomeia: veja "A assinatura em qualquer assunto".

A tela cheia é a base: abra o quadro da esquerda quando ele acrescentar clareza e volte para a pessoa quando a ideia terminar. Alterne os três lugares: quadro cheio → imagem → quadro cheio. Nunca três momentos iguais seguidos. Abra com a `abertura` (o gancho) e feche com o `cta`.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (nos trechos de imagem, uma a cada 3 a 8 s; nunca duas na mesma frase). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "camera tripod"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos. Para as imagens que vão para a **tela cheia** (`corte`), rode com `--lado 2400`: a foto precisa de resolução para cobrir 1920×1080.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo ou texto (micrografias costumam ter uma faixa de dados embaixo: ela aparece na tela cheia); foto de verdade quando é foto; **deitada e grande (1920 px ou mais de largura) para o `corte`**, porque a tela cheia agora é deitada; as pequenas, quadradas ou em pé vão para o `pop` (cartão).
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira; as linhas da folha marcam 0,25 / 0,5 / 0,75). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (vira cartão com a palavra).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "mel", "efeito": "aproximar" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a descrição do vídeo.

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

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- a imagem do `corte` mostra o assunto inteiro e **acima da legenda** (se o assunto ficou pequeno numa foto larga, use `zoom` 1,3–1,6 no corte)? Nada de texto, marca d'água ou gente reconhecível?
- no `pop` e nos blocos do quadro da esquerda, o conteúdo está inteiro à esquerda da emenda, e o rosto da pessoa inteiro e centralizado na moldura da direita?
- o gancho aparece no primeiro quadro e termina em menos de 1,5 s?
- o texto cabe (nada cortado), o número certo aparece quando a palavra é dita, a tarja da legenda cai na palavra falada?
- nas trocas, nenhum quadro com o lado da esquerda vazio, nenhum texto do peito em cima do rosto que ainda está voltando e nenhum texto sobre outro? Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 4.7 4.75 4.8 4.85 4.9`).
- nada importante abaixo de y 984 (controles do player)?

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

| Forma da informação | `tipo` no plano | Como aparece neste estilo (quadro deitado) |
|---|---|---|
| abertura | `abertura` | quadro cheio: o gancho escrito em tarjas numa fileira larga no peito, palavra por palavra em menos de 1 s, o `destaque` na tarja rosa, com soco de zoom; com `imagem`, por cima de uma foto em tela cheia |
| lista | `topicos` | pessoa na moldura da direita: no quadro da esquerda, título branco com traço rosa; cada item é um cartão branco que salta no seu `em` (com a foto do item numa bolinha, se tiver `imagem`); o item da vez fica rosa |
| passos | `passos` | pessoa na moldura: cartões numerados no quadro da esquerda, ligados por um traço rosa que desce até o passo da vez |
| número | `numero` | quadro cheio: o número conta numa placa escura gigante (pt-BR, algarismos fixos) e o rótulo carimba numa tarja rosa **ao lado**, colado na placa, com soco de zoom; com `imagem`, por cima da foto em tela cheia |
| comparação | `comparacao` | pessoa na moldura: no quadro da esquerda, dois cartões que se encaram (foto em cima se tiver `imagem`, rótulo na tarja, texto grande); antes de serem ditos, o lugar de cada um espera com um "?"; VS no meio (`contra`), seta (`antes-depois`), ✗ amarelo e ✓ verde (`errado-certo`); o vencedor ganha borda rosa, o outro fica cinza |
| gráfico | `grafico` | pessoa na moldura: no quadro da esquerda, barras brancas com a maior em rosa, linha rosa que anda de ponto em ponto, rosca colorida; sem números ditos, a curva da tendência (verde sobe, rosa cai, amarela oscila) com "ILUSTRATIVO" |
| destaque | `destaque` | quadro cheio: a palavra carimbada em tarjas rosa (`chave`) ou amarelas com texto escuro (`alerta`), inclinada, com soco de zoom; `detalhe` numa placa escura menor embaixo |
| definição | `definicao` | pessoa na moldura: no quadro da esquerda, o termo enorme em branco, um traço rosa que se desenha embaixo, o significado num cartão branco que sobe na fala |
| frase | `frase` | quadro cheio: a frase em tarjas no peito, palavra por palavra na fala, com um selo rosa de aspas; `destaque` na tarja rosa; `risco` riscado em rosa quando é dito |
| pergunta | `pergunta` | pessoa na moldura: no quadro da esquerda, a pergunta grande em branco; as `opcoes` entram como opções de enquete (letra na bolinha rosa), a mais recente fica rosa; sem opções, um "?" rosa balançando |
| fechamento | `cta` | quadro cheio: a chamada em tarjas, `destaque` rosa, o ícone num círculo rosa **ao lado** da chamada, com um anel que pulsa (`salvar`, `seguir`, `comentar`, `link`), etiqueta com nome e área embaixo; fica até o último quadro |
| **assinatura** | `corte` | a imagem toma a tela inteira (1920×1080) por 0,8–1,2 s: entra seca, 7% maior, assenta e aproxima devagar; a legenda continua por cima; `zoom` aproxima um assunto pequeno e o põe acima da legenda; `rotulo` opcional numa tarja no alto, à esquerda |
| **assinatura** | `pop` | a pessoa desliza para a moldura da direita e um cartão de foto com borda branca salta no quadro da esquerda (inclinado, alternando o lado), sobre a própria foto desfocada; a legenda continua embaixo, na moldura; objeto 3D transparente vira adesivo solto; `rotulo` opcional numa tarja no canto |

## A assinatura em qualquer assunto

O `corte` e o `pop` são **"mostre o que a pessoa acabou de nomear"**: cada coisa concreta da fala (um lugar, um objeto, um bicho, um produto, um gráfico, um documento) vira imagem no instante em que é dita. O `corte` é para o que merece a tela inteira por um segundo (lugar, paisagem, close impressionante, o resultado); o `pop` é para o que é melhor visto como objeto, ao lado da pessoa (produto, documento, foto pequena, quadrada ou em pé). Mesmo um assunto abstrato tem coisas concretas: o exemplo, o lugar, o objeto que a pessoa usa para explicar.

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
- **A imagem do corte ficou mole ou com o assunto pequeno**: escolha uma candidata deitada e maior (`--lado 2400`), mude o foco, use `zoom` no corte, ou leve a imagem para um `pop` (cartão menor fica nítido).
- **A imagem tem texto, marca d'água ou faixa de dados**: outra candidata, ou outro foco que tire a faixa do quadro; no `pop` o cartão recorta pelo foco.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache. Rode de novo mais tarde para os que ficaram sem imagem.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens. A faixa do peito do quadro deitado é baixa: texto longo encolhe.
- **O texto do peito entrou um pouco depois da palavra**: logo depois de um `pop` ou lista, ele espera a pessoa voltar para o quadro cheio (para não cair em cima do rosto). Se a palavra é importante, termine o momento anterior um pouco antes.
- **O rosto não ficou no centro da moldura**: a pessoa foi gravada muito perto da borda do quadro; o vídeo não deixa borda vazia, então o rosto para antes. Confira as guias (passo 5) e as medidas do rosto (passo 4).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o quadro 1920×1080; o vídeo sai menos nítido. Avise o usuário.
