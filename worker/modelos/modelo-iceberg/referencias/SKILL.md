---
name: modelo-iceberg
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Iceberg, camadas de profundidade: um iceberg ilustrado na água, a câmera mergulha um nível por vez conforme a fala, a água escurece e um medidor de profundidade conta, cada nível ganha foto e nome, e a pessoa fica numa janela larga e flutuante que desce junto. Serve para qualquer assunto (o exemplo do modelo é o café, mas funciona com finanças, saúde, vendas, histórias, aulas, curiosidades...): a IA traduz a fala para os blocos do estilo, do mais conhecido ao mais obscuro. Use sempre que o usuário pedir para editar \"no modelo Iceberg\", \"estilo Iceberg\", \"iceberg de...\", \"camadas\", \"do mais conhecido ao mais obscuro\", \"o que ninguém sabe sobre...\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080x1920."
---

# Modelo Iceberg

O vídeo vira um mergulho. Um iceberg inteiro aparece sobre a linha d'água com um "?" em cada camada; conforme a pessoa fala, a câmera desce **um nível por vez**, a água escurece e um medidor de profundidade conta. Cada nível ganha a foto e o nome do item. A pessoa fica numa **janela larga e flutuante** embaixo, que afunda um pouco a cada descida.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com o café, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** o mundo é uma coluna alta e a câmera **desce** (0,7 a 1,1 s, curva suave) até o nível que vai ser dito; quando o nome aparece, o cartão salta e um anel de sonar abre na água. Ao sair do nível, o cartão encolhe e fica preso ao gelo. Os blocos universais são **placas de gelo** que sobem da água e afundam na saída. Nada fica parado: bolhas, raios de luz, ondas e o medidor andam o tempo todo.
- **Organização e hierarquia:** o conteúdo ocupa a faixa de y 150 a 980; a janela da pessoa fica embaixo (y 1000 a 1560). O nível: etiqueta coral em cima, foto 700x400, nome em placa escura, detalhes embaixo. O medidor (leitura em mono + régua) fica à esquerda.
- **Tipografia:** **Outfit** (Google Fonts), larga e legível, 800 nos títulos e nomes, 700 nos detalhes; **Overpass Mono** só nos números do medidor. Nada condensado, nada com contorno.
- **Moldura da pessoa:** sempre uma janela larga (940x560) com a cabeça inteira, seguindo o rosto; nunca uma coluna estreita. A legenda fica na base da janela, abaixo do queixo, com a palavra dita em coral.
- **Cores, textura e som:** céu gelado, água do ciano ao abismo (`#3CC3DC` a `#020B19`), gelo branco que azula com a fundura, tinta azul-marinho sobre o gelo, **coral** (`#FF7F50`) para a ênfase, ciano de sonar para os traços. Sem preto e dourado. Sons tonais e baixos: mergulho, sonar, tique, bolha.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Curiosidades"): vão na etiqueta do canto da janela da pessoa. Sem resposta, siga sem nome. Pergunte também se ele tem **imagens próprias** (produto, print, foto pessoal): elas vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas.

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



Neste modelo **as pausas viram cortes secos**, mas cada nível precisa de ~1 s para a câmera descer até ele antes de o nome ser dito. Se a pessoa fala os níveis colados, mantenha uma pausa de 0,2 a 0,3 s entre eles.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa fica sempre na janela larga); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, as imagens e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a janela acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto dentro da janela (caixa rosa); a caixa verde é a zona de conteúdo; a linha amarela é a legenda. A janela mostra a cabeça inteira com folga em cima.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Ache a **escada**: itens que vão do mais conhecido ao mais obscuro (ou do mais raso ao mais profundo). Cada degrau vira um **nível** do `iceberg` (2 a 6), com `em` = o instante em que a pessoa diz o nome. O que não é degrau vira outro bloco do estilo (tabela abaixo). Se a fala não tem escada, procure uma: camadas de um problema, do que todos veem ao que ninguém vê.

### 6b. Imagens

Leia `references/imagens.md`.

1. Para cada posição do nível, liste a coisa que a pessoa nomeia (uma imagem por posição; ela fica num cartão 700×400 em cada nível: pede uma foto horizontal, reconhecível de longe). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "tapioca crepe"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs --lado 2400`: a foto precisa de resolução para um cartão nítido. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Escolha a candidata que mostra a coisa inteira, reconhecível em 1 s, sem gente reconhecível, logo ou texto, **horizontal** (o cartão é 700×400). Uma busca em português pode trazer um quadro com o nome (ex.: "pastel" traz pinturas de Degas): busque em inglês ou com o nome do prato.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` ou **não ponha `imagem`** na posição: ela vira um cartão tipográfico azul com o nome, que faz o mesmo caminho (toma a tela, voa e vira o corpo da casa). **Um iceberg inteiro sem foto é um estilo válido.**
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos níveis do nível, `imagem: { "id": "pastel" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada nível, item, lado ou dado entra no `em` da palavra que o nomeia (`work/palavras.json`).

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`.

### 8. Conferir os quadros

`node scripts/stills.mjs --momentos` e, para o iceberg, quadros no meio de cada descida. Olhe-os reduzidos a ~540 px:
- a câmera chega ao nível quando o nome aparece, e o "?" some?
- foto reconhecível, nome cabe (até 2 linhas), detalhes sem se atropelar?
- o medidor sobe junto com a câmera e a janela mostra a cabeça inteira?
- a legenda está na base da janela e nenhuma placa passa de y 980?

### 9. Renderizar e entregar

`node scripts/render.mjs "out/<nome>-iceberg.mp4"`. Entregue o caminho, a duração, o mapa resumido, as imagens usadas (com o texto de `creditos.txt` se houver CC BY), o que é ilustrativo (os números do medidor são decorativos; diga se o usuário passou `profundidade`) e o que ele deve conferir.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | placa de gelo no topo; o título se monta palavra a palavra sobre o iceberg inteiro, `destaque` em coral |
| lista | `topicos` | placas de gelo empilhadas, alternando de lado; marcador em losango; a da vez ganha borda coral |
| passos | `passos` | placas numeradas (círculo coral) ligadas por uma sonda de sonar que desce até o passo da vez |
| número | `numero` | placa grande; o número conta, uma barra coral cresce, o rótulo entra embaixo; anel de sonar no fim |
| comparação | `comparacao` | duas placas lado a lado (VS no meio); o vencedor sobe com borda coral e o outro afunda |
| gráfico | `grafico` | colunas de gelo (a maior em coral), linha que anda de ponto em ponto, pizza; sem números, curva com ILUSTRATIVO |
| destaque | `destaque` | placa com o texto carimbado; `alerta` com borda e selo vermelhos, `chave` com losango coral; `detalhe` em placa escura |
| definição | `definicao` | o termo numa placa escura, uma sonda desce e o significado se monta numa placa de gelo |
| frase | `frase` | placa com aspas coral, palavra a palavra; `destaque` em coral; `risco` riscado |
| pergunta | `pergunta` | placa com a pergunta; `opcoes` como placas A, B, C... |
| fechamento | `cta` | placa com ícone num círculo coral com anel que pulsa; fica até o último quadro |
| **assinatura** | `iceberg` | o mergulho: níveis com foto e nome, câmera que desce, água que escurece, medidor de profundidade |

## A assinatura em qualquer assunto

O `iceberg` é **"do que todo mundo conhece ao que quase ninguém sabe"**: qualquer coisa em camadas de profundidade, em que cada degrau é mais raro, mais caro, mais perigoso ou mais obscuro que o anterior.

1. **Finanças/cripto.** "O iceberg do Bitcoin. Na superfície, o preço. Mais fundo, as corretoras. Mais fundo, as carteiras sem custódia. No fundo, os riscos que quase ninguém lê."
   `iceberg` com 4 níveis em cartões tipográficos ("Preço", "Corretoras", "Carteiras", "Riscos ocultos") ou fotos de produto; `unidade` pode ser "m" (decorativa).
2. **Saúde ou rotina.** "Sono: todo mundo sabe que precisa dormir 8 horas. Mais fundo, a luz da manhã. Mais fundo, a temperatura do quarto. No fundo, a hora do último café."
   `iceberg` com 4 níveis, uma foto por nível (`busca: "morning light window"`), `detalhes` com a explicação curta.
3. **Algo bem distante (história pessoal ou carreira).** "O iceberg da minha carreira. O que aparece: o cargo. Abaixo, as noites sem dormir. Mais fundo, o ano em que quase desisti."
   `iceberg` com 3 níveis em cartões tipográficos e `rotulo` em cada ("O que aparece", "Por baixo", "No fundo"); sem foto, são memórias.

Sem escada na fala? Use `topicos` ou `passos` para o que não for escada, mas toda edição tem um `iceberg`.

## Fidelidade

- Tudo na tela vem da fala; textos resumidos com as palavras dela.
- Não invente número, nome, preço nem fato. A **ordem dos níveis é a que a pessoa disse**.
- Os números do medidor são decorativos (uma régua, não um dado); a foto ilustra o que foi dito, sem mostrar algo que a fala não disse.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele. Não use `--forcar`.
- **Níveis muito colados**: cada descida leva ~1 s; use `desceEm` explícito ou mantenha uma pausa curta no passo 3.
- **Foto fraca, com texto ou marca**: outra candidata, outro foco, ou nenhuma imagem no nível (vira cartão tipográfico). Imagem feia é pior que cartão.
- **Mais de 6 níveis**: divida em dois icebergs (momentos separados).
- **A transcrição errou um nome**: use `correcoes`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem; mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: `xcode-select --install`.
- **Texto pequeno ou quebrado em muitas linhas**: passou do limite do bloco (`references/plano.md`); encurte ou use menos itens.
