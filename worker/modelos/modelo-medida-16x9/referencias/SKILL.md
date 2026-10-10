---
name: modelo-medida-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Medida. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Medida, um laboratório de cozinha que torna uma quantidade palpável: o objeto do assunto (lata, garrafa, pacote, frasco) nasce no peito da pessoa e voa para um papel creme, a quantidade vira unidades 3D (sachês, cubos, moedas, comprimidos) que caem num copo de vidro, a linha da recomendação ou do limite é marcada e, quando a quantidade passa dela, o alerta fica vermelho; a pessoa vai para uma moldura arredondada à direita, e a virada com linha de luz pode trocar a roupa dela. Serve para qualquer assunto (o exemplo é um nutricionista, mas funciona com saúde, finanças, cripto, consumo, rotina, histórias): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Medida\", \"estilo Medida\", \"quanto tem de X em Y\", \"mostrar a quantidade\", \"vídeo de nutricionista\" e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação à esquerda)."
---

# Modelo Medida (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Medida no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, o papel creme, o palco 3D (objeto, copo de vidro, unidades com física, linha da referência, vermelho do limite), os mesmos sons e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada, com a legenda na área segura de baixo. O papel abre **só quando acrescenta clareza** à fala e a pessoa volta à tela cheia quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Quando entra a explicação, o vídeo se recolhe numa **moldura do lado direito** (x 1184 a 1824, y 132 a 948), com o **rosto centralizado** nela e acompanhado de leve pelo rastro (sem saltos nem cortes no rosto), e o **papel creme** recebe o palco e os blocos no **quadro da esquerda** (x 96 a 1120, y 132 a 948). O palco da assinatura é o mesmo desenho do vertical (objeto à esquerda, copo no meio, números e rótulos à direita), levado inteiro para o quadro.
- **Títulos de tela cheia ao lado da pessoa.** No quadro deitado não há altura acima da cabeça: a pergunta da `virada` e a `abertura` ficam na coluna livre ao lado da pessoa, na altura do rosto.
- **O objeto no peito** tem o tamanho do rosto e para acima da faixa da legenda; no `palcoEm` ele voa para o papel da esquerda enquanto a pessoa vai para a moldura da direita.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s. O `cortar.mjs` junta pausas de até 0,45 s (mantém a respiração natural).
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira uma bancada de laboratório de cozinha. A pessoa começa em tela cheia; quando entra a informação, o vídeo se **recolhe numa moldura** à direita (cantos arredondados, borda fina, sombra suave, fundo natural) e um **papel creme** aparece à esquerda. Ali, a fala vira coisa que se pega: o **objeto** do assunto em 3D, as **unidades** que caem uma a uma num **copo de vidro** com física, a **linha tracejada** da recomendação em volta do copo e o **vermelho** quando passa do limite. Os scripts fazem a parte mecânica (medir, transcrever, cortar, seguir o rosto, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um nutricionista ("uma lata de refrigerante tem trinta e cinco gramas de açúcar, sete sachês"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** física de verdade e revelação editorial. O objeto nasce pequeno no peito da pessoa, gira até mostrar o rótulo na palavra e, quando o papel entra, voa para ele com um giro completo. As unidades **caem** uma a uma (0,115 s entre elas), quicam e assentam na pilha; o copo entra com elas. A linha tracejada **se desenha** em volta do copo e puxa uma guia até o rótulo. Os números **contam**; os rótulos **sobem por máscara** com desfoque. Lata e garrafa **despejam** no copo e o nível cruza a linha exatamente na palavra do "passou". Um empurrão lento de câmera no palco durante a explicação: nada fica parado. Trocas: o bloco que sai sobe 24 px e some em 0,3 s.
- **Organização e hierarquia:** papel à esquerda (x 96 a 1120, y 132 a 948), moldura da pessoa à direita (x 1184 a 1824, y 132 a 948). Na assinatura: objeto à esquerda, copo no meio, números e rótulos à direita; a quantidade grande primeiro, depois as unidades, depois a linha. Uma ideia por vez no papel.
- **Tipografia:** **Sora** para números e textos de leitura (800 nos números e títulos, 700 nos itens, 600 nos detalhes; tracking ≥ −0,025em). **Fraunces itálica** nos rótulos curtos ("de açúcar", "ideal do dia", títulos de bloco). Legenda Sora 800 toda branca com contorno preto e sombra leve, blocos de até 3 palavras. Nada condensado.
- **Moldura da pessoa:** tela cheia na abertura, na virada, enquanto o objeto está no peito e nos respiros (no vídeo completo, a tela cheia é a base); moldura arredondada à direita quando o papel entra (a troca leva 0,52 s). Na moldura, o rosto fica centralizado e é seguido de leve quadro a quadro. Punch de corte: 1,00 ↔ 1,12 em tela cheia, 1,00 ↔ 1,07 na moldura, com empurrão lento de 1,5% dentro de cada trecho. Legenda na área segura de baixo em tela cheia e logo abaixo do queixo, dentro da moldura.
- **Cores, textura e som:** papel creme (#F3EEE4) com grão, tinta verde-escura (#1C2A22), sálvia profunda (#2B5A44) para ênfase, menta (#A9D8B6) para luz e líquido, **vermelho (#CF4536) só quando passa do limite**. Vidro com reflexo de estúdio claro. Sons tonais e raros: o cristal da virada, o ar que sobe quando o objeto nasce, a lata que abre, os sachês que caem, o líquido que despeja, a nota grave do limite, marimba nos tópicos, tons nos passos. Nada de sino, nada de ruído, nada de batida.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - O palco é **3D (WebGL)**: os quadros e o render usam a GPU. O `modelo.json` do template já pede isso (`"gl": "angle"`) e os scripts do motor ligam sozinhos; não tire essa linha.
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo e pergunte uma vez:
   - **nome e área** de quem fala (ex.: "Rafael Moura" / "Nutricionista"): vão na tarja do começo. Sem resposta, siga sem tarja;
   - se ele quer a **virada com troca de roupa** (passo opcional 4c) e se já tem o vídeo com a roupa trocada;
   - se ele tem uma **trilha** sem batida (opcional; o padrão é só efeitos sonoros).

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica.

Ritmo de aula (vídeo completo): respiro natural entre as frases, sem acelerar. O `cortar.mjs` junta trechos com menos de 0,45 s entre eles e corta o resto.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); a pessoa é reposicionada pelo template (tela cheia ou moldura da direita). Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo: a tela cheia e a moldura acompanham quando a pessoa se mexe.

### 4b. Corrigir as palavras

Abra `src/plano.json` → `palavras` (o mesmo que `work/palavras.json`) e corrija o que a transcrição errou, **no lugar certo da lista**:
- números: a transcrição escreve "35" ou "35 g" onde a pessoa disse "trinta e cinco gramas". Deixe uma palavra por palavra dita (`"trinta"`, `"e"`, `"cinco"`, `"gramas"`), com os tempos de cada uma: as unidades e os números entram nessas palavras;
- siglas e nomes (OMS, Anvisa, nomes de alimentos e remédios);
- apague palavras inventadas no silêncio.

### 4c. (Opcional) A virada com troca de roupa

O exemplo abre com a pergunta "E se eu fosse / NUTRICIONISTA" e, na virada, uma **linha de luz** desce pela tela trocando a roupa da pessoa ao vivo (a fala continua sincronizada). Isso precisa de um segundo vídeo: **a mesma gravação com a roupa trocada**, gerado numa IA de vídeo que edita um vídeo existente a partir de uma imagem de referência da roupa.

- Gere a partir de `public/base.mp4` (o vídeo de trabalho, já cortado), para os quadros baterem.
- Confira antes de usar: o rosto no mesmo lugar e do mesmo tamanho (sem "cabeça maior"), a boca sincronizada com a fala, a mesma duração. Algumas IAs devolvem o vídeo truncado no segundo inteiro ou mais curto no fim: complete com o último quadro (`ffmpeg -i virada.mp4 -vf tpad=stop_mode=clone:stop_duration=1 -r 30 ...`).
- Se só gerou o trecho a partir da virada, monte o arquivo na mesma linha do tempo: o começo de `base.mp4` até a virada + o trecho gerado (ffmpeg `concat`), 30 fps, mesmo tamanho.
- Salve como `public/virada/base.mp4` e ponha no plano `"videoVirada": "virada/base.mp4"`. A voz continua vindo do vídeo principal.

**Sem esse vídeo, a virada continua**: a pergunta aparece ao lado da cabeça e a linha de luz troca o **enquadramento** (a câmera fecha), sem trocar a pessoa. Nunca gere uma pessoa nova nem mude o rosto de quem fala.

### 4d. (Opcional) O objeto entre as mãos

No exemplo, a lata nasce **entre as mãos** dele e acompanha o movimento. O motor não rastreia mãos: sem rastreio, o objeto nasce no **ponto de entrega** (à altura do peito, no eixo do rosto, dentro do quadro) e flutua de leve, o que já funciona. Se o usuário tiver um rastreio de mãos feito sobre `public/base.mp4` (MediaPipe Hands, Apple Vision ou uma lista t,x,y), rode `node ferramentas/maos.mjs rastreio.json`: o plano ganha `maos` e o objeto passa a nascer entre elas.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A cruz azul deve cair no rosto; o retângulo verde é a moldura da direita (a pessoa, com a cabeça inteira e o rosto no centro, quando o papel está na tela); o tracejado azul é o papel da esquerda, onde os blocos desenham; a faixa amarela é a legenda (área segura de baixo; na moldura, abaixo do queixo); nada importante abaixo da linha vermelha (y 984, controles do player). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Procure, nesta ordem:
- a **quantidade palpável** ("quanto tem de X em Y", "quantos…", "equivale a…", um consumo, um gasto, uma dose, um tempo): vira a **assinatura `medida`**. Ache na fala o objeto (lata, garrafa, pacote, frasco), a quantidade, a unidade física que a representa (sachê, cubo, moeda, comprimido), a referência (recomendação, limite, meta) e o "passou";
- o **objeto** citado sem quantidade (um alimento, um produto, um remédio): `objeto`, com até 3 informações ditas;
- a **pergunta da virada** ("E se eu fosse…", "E se você…", o nome do tema): `virada`;
- o resto da fala: os blocos universais (tabela abaixo).

Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`medida`) entra pelo menos uma vez**, e a conferência pede pelo menos dois efeitos próprios (`medida`, `objeto`, `virada`) em vídeos de mais de 20 s: normalmente `virada` + `medida` ou `objeto` + `medida`.

- **Sem números ditos** (cripto, opinião, rotina): `medida` em **modo ilustrativo** (`"ilustrativo": true`): as unidades caem sem número na tela, a linha marca a ideia ("o que o mercado subiu", "o que sobra no fim do mês") e o selo "ilustrativo" aparece. **Nunca invente número.**
- **Abaixo da meta** (a quantidade não chega na referência): ponha a linha acima da pilha (`referencia.unidades` maior que `unidades.numero`) e não use `passou`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e `references/estilo.md` (posições, cores, movimento), e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda`, `correcoes` (e `videoVirada`, `trilha`, se houver). Cada unidade, número, rótulo e linha entra no `em` da palavra, tirado de `palavras`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

**O fim do vídeo**: ponha em `duracao` (e no `ate` do último momento) o fim da última palavra + 0,3 s.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o objeto nasce **na palavra que o nomeia**, no peito, sem cobrir o rosto nem a legenda, e mostra o rótulo inteiro (sem marca real)?
- o papel entra na palavra certa, à esquerda, e a moldura da direita mostra a cabeça inteira, com o rosto no centro?
- cada número aparece **só quando é dito** e conta até o valor dito? As unidades começam a cair na palavra do número de unidades?
- a linha tracejada fica na altura certa (a referência dita) e o rótulo dela não encosta no valor?
- o vermelho só aparece quando passa da linha, na palavra do "passou"?
- os blocos universais cabem no papel da esquerda, sem texto cortado nem encostado nas margens, e nada invade a moldura?
- legenda na área segura de baixo (na moldura, abaixo do queixo), sem juntar duas frases; nada importante abaixo de y 984;
- a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-medida.mp4"
```

Ele confere o plano de novo, renderiza com a GPU e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (selo na tela) e as contas mostradas (ex.: "5 g cada" = 35 ÷ 7);
- o que o usuário deve conferir (um número, a referência citada, a virada).

## Blocos deste modelo

Tudo acontece no papel creme, no quadro da esquerda, com a pessoa na moldura da direita; só a `abertura` e a `virada` ficam sobre a pessoa em tela cheia, na coluna livre ao lado dela.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | título branco palavra por palavra **ao lado da cabeça** (na coluna livre), sobre a pessoa em tela cheia, o `destaque` em menta; se a coluna for estreita demais, vai para o papel como frase grande |
| lista | `topicos` | **sachês de papel** (creme, serrilhados, com a faixa sálvia) que caem e assentam um embaixo do outro, cada um na palavra; o da vez ganha a faixa escura |
| passos | `passos` | uma **proveta graduada** que enche de menta a cada passo; o texto de cada passo entra na altura da marca dele, com o número numa pílula |
| número | `numero` | o número grande em Sora contando, o rótulo em itálico embaixo e uma **fita métrica** que corre enquanto ele conta; selo "ilustrativo" quando for |
| comparação | `comparacao` | duas **fichas de amostra** lado a lado, com o rótulo numa pílula e um "vs" (ou →) no tracejado do meio; o `vencedor` ganha a borda sálvia e o ✓; `errado-certo` risca o lado errado em vermelho com ✕ |
| gráfico | `grafico` | `barras` = uma fileira de **copos de vidro 3D** que enchem até o valor dito, o maior com o anel tracejado; `linha` = papel graduado com a linha que se desenha ponto a ponto; `pizza` = **um prato** visto de cima, com as porções entrando; sem números, os copos enchem na forma da `tendencia` com o selo |
| destaque | `destaque` | a palavra grande sobre a **linha tracejada**; `alerta` = vermelho com o triângulo ▲ do limite; `chave` = tinta escura com a linha sálvia |
| definição | `definicao` | um **rótulo nutricional**: o termo grande, a régua grossa preta e o significado em linhas separadas por fios |
| frase | `frase` | a frase grande palavra por palavra, com as aspas em menta; `destaque` em Fraunces itálica sálvia; `risco` riscado em vermelho |
| pergunta | `pergunta` | a pergunta palavra por palavra e as `opcoes` em pílulas de rótulo que caem; a da vez fica cheia |
| fechamento | `cta` | o texto palavra por palavra e um **botão redondo** sálvia (salvar, seguir, comentar ou link) que aperta sozinho, com a linha tracejada |
| **assinatura** | `medida` | o objeto nasce no peito e voa para o papel da esquerda; a quantidade conta; as unidades caem no copo; a linha da referência é marcada; passou = vermelho (lata e garrafa despejam) |
| próprio | `objeto` | o objeto nasce no peito, gira até o rótulo, voa para o papel e ganha até 3 informações ditas ao lado, uma por fala |
| próprio | `virada` | "E se eu fosse" + NOME ao lado da cabeça e a linha de luz que troca a roupa (com `videoVirada`) ou o enquadramento |

## A assinatura em qualquer assunto

A `medida` é **"tornar uma quantidade palpável"**: qualquer fala que diz quanto tem de alguma coisa em outra, quanto custa, quanto se gasta, quanto tempo leva, quanto falta ou quanto passou do ideal. O objeto é o assunto; as unidades são a quantidade em pedaços que dá para contar; a linha é a referência (recomendação, limite, meta, média).

1. **Finanças e cripto (modo ilustrativo).** "Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas."
   `medida` com `ilustrativo: true`, `recipiente: "pote"`, `referencia` = `{ "unidades": 9, "em": <"subindo">, "rotulo": "o mercado subindo" }` (a linha fica no alto do pote) e `unidades` = `{ "forma": "moeda", "numero": 4, "em": <"dinheiro">, "rotulo": "dinheiro no bolso", "etiqueta": { "meio": "$" } }`: as moedas caem e param bem abaixo da linha. Nenhum número na tela. Com números ditos ("a assinatura custa quarenta reais, oito moedas de cinco; o ideal para lazer é trinta"), as moedas contam e o vermelho mostra o estouro.
2. **Saúde ou rotina.** "Esse frasco de analgésico: o máximo por dia são quatro comprimidos. Tem gente que toma seis e passa do limite."
   `medida` com `objeto` = `{ "forma": "pote", "rotulo": "Analgésico", "icone": "cruz", "em": <"frasco"> }`, `unidades` = `{ "forma": "comprimido", "numero": 6, "em": <"seis"> }`, `referencia` = `{ "valor": 4, "em": <"máximo">, "rotulo": "máximo do dia", "valorEm": <"quatro"> }` e `passou` = `{ "em": <"passa"> }`: a faixa acima da linha fica vermelha e o marcador sobe. Sem `quantidade` (o número de comprimidos já é a medida).
3. **Algo bem distante (tempo, carreira).** "Cinco horas por dia no celular são trinta e cinco horas por semana. O tempo que você diz que não tem para estudar é de trinta horas: já passou."
   `medida` sem objeto, `quantidade` = `{ "valor": 35, "em": <"trinta">, "sufixo": "h", "rotulo": "por semana" }`, `unidades` = `{ "forma": "cubo", "numero": 7, "em": <"semana">, "rotulo": "dias de 5 h", "numeroGrande": false }`, `referencia` = `{ "valor": 30, "em": <"tempo">, "rotulo": "o tempo de estudar", "valorEm": <"trinta" (a segunda)> }` e `passou` = `{ "em": <"passou"> }`: os sete cubos passam da linha e o marcador vermelho conta até 35 h.

O `objeto` sozinho serve para qualquer coisa citada (um produto, um alimento, um documento numa caixa, um frasco), e a `virada` serve para qualquer "e se…" ou troca de papel ("E se você fosse o seu cliente?", "Antes / depois").

## Fidelidade

- Tudo na tela vem da fala. Os rótulos podem ser resumidos com as palavras dela ("o ideal, segundo a OMS, é menos de vinte e cinco" vira "ideal do dia · OMS · < 25 g").
- **Nunca mostre um número que não foi dito.** O contador por unidade e o `detalhe` ("de 5 g cada") são contas diretas dos números ditos (35 ÷ 7): use só quando a conta é exata e óbvia; na dúvida, deixe de fora.
- As unidades são uma imagem da quantidade: o número de unidades tem que ser o dito (ou a conta exata). No modo ilustrativo, o selo "ilustrativo" fica na tela.
- **Nenhuma marca real**: o rótulo do objeto é genérico ("REFRIGERANTE", "SUCO", "ANALGÉSICO"), sem logo, sem nome de fabricante.
- A virada nunca muda o rosto nem gera outra pessoa.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Se ele pedir "dois efeitos próprios", acrescente uma `virada` (a pergunta de abertura) ou um `objeto` (algo citado). Não use `--forcar`.
- **"Error creating WebGL context"** no render ou nos quadros: confira se o `modelo.json` do projeto ainda tem `"gl": "angle"`.
- **Mais de 12 unidades**: o copo mostra até 12. Use uma unidade maior ("1 sachê = 10 g") ou o modo ilustrativo.
- **O texto não cabe** (rótulo, unidade, referência): os rótulos reduzem e quebram em 2 linhas; encurte com as palavras da fala (até ~24 caracteres por rótulo).
- **A virada ficou com o rosto deslocado ou a boca fora de sincronia**: o vídeo da virada não bate com `base.mp4`; refaça a geração ou tire `videoVirada` (a virada troca só o enquadramento).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
