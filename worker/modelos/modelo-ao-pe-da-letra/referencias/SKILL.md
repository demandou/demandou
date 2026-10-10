---
name: modelo-ao-pe-da-letra
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Ao Pé da Letra: painel vermelho-carimbo em cima com duas fichas lado a lado, \"AO PÉ DA LETRA\" (imagem literal, batida com um carimbo NÃO) e \"O QUE QUER DIZER\" (o sentido real), a expressão digitada no alto, legenda bilíngue (português em creme, a outra língua em azul-céu) e a pessoa numa moldura larga embaixo. O humor vem do contraste das imagens. Serve para qualquer assunto: expressões em inglês ou espanhol, gírias, traduções que dão errado, jargão contra linguagem simples, mito contra verdade, finanças, saúde. Use quando o usuário pedir \"modelo Ao Pé da Letra\", \"expressões em inglês\", \"literal contra real\", \"tradução que dá errado\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Ao Pé da Letra

O vídeo vira um jogo de contraste: quando a pessoa diz a expressão, ela desce para uma moldura larga e o painel de cima mostra duas fichas de papel. Na da esquerda, o que a expressão diz **ao pé da letra**, com a imagem literal (um balde azul) e um carimbo NÃO vermelho batendo em cima. Na da direita, **o que quer dizer** de verdade, com a imagem do sentido. A expressão aparece digitada no alto e a legenda pinta a outra língua em cor.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com expressões em inglês, mas o vídeo do usuário pode ser sobre qualquer coisa (espanhol, gírias, jargão, mito e verdade). Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a expressão é digitada letra por letra com um cursor; cada ficha entra quando a pessoa fala o que ela mostra (a imagem se revela, o texto se monta na fala). O **carimbo NÃO** bate de grande para o tamanho certo em 0,2 s, a ficha treme de leve e a imagem de baixo perde cor. Quando a ficha da direita ganha um segundo passo (o certo em inglês), ela gira como uma carta e o novo conteúdo entra, com um traço azul desenhado à mão e uma moldura azul. Entre duas expressões, uma cortina vermelho-escura passa pelo painel.
- **Organização e hierarquia:** no alto, o rótulo "EXPRESSÕES" e a expressão digitada em fonte mono grande. Embaixo dela, duas fichas de 462 px de largura, uma ao lado da outra, que ocupam o painel inteiro: rótulo, imagem grande (418 × 372), texto de 36 a 64 px e uma linha de detalhe. Antes de entrar, a ficha vazia já está lá com um "?" tracejado: o espectador sabe que o contraste vem.
- **Tipografia:** Be Vietnam Pro (500, 700, 800, 900) para tudo o que se lê; Roboto Mono para o que é digitado. Títulos ≥ 70 px, texto ≥ 36 px, rótulos em caixa alta ≥ 27 px. Todo texto é medido com a fonte de verdade e reduzido para caber.
- **Moldura da pessoa:** três situações. **Tela cheia** com um cartão de tinta no peito (abertura, número, destaque, definição, frase, pergunta, fechamento). **Moldura larga embaixo** (cabeça e ombros, cantos arredondados, nome na etiqueta) quando um painel ocupa a parte de cima; a legenda desce para dentro da moldura, abaixo do queixo. A pessoa nunca fica numa coluna estreita e a moldura segue o rosto pelo rastreio.
- **Cores, textura e som:** vermelho-carimbo `#E5402A` (fundo dos painéis), papel creme `#FFF5E6` (as fichas e tudo o que se lê sobre o fundo), tinta azul-noite `#171430` (cartões no peito e texto sobre o papel), **azul-céu** `#8DBEFF` = outra língua (legenda, ponto que pula) e azul-cobalto `#2355E8` (o inglês nas fichas, o certo), carimbo `#D4261A`. A borda dos cartões é uma faixa diagonal de correio aéreo (vermelho, creme e azul). Sons raros e tonais: uma batida grave e curta quando o carimbo cai, duas notas quando o certo se desenha, uma nota curta nos itens, um acorde suave no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Prof. Ana — Inglês"): o nome vai na etiqueta da moldura e na assinatura do fechamento; a área vira o rótulo da abertura. Sem resposta, siga sem nome.
## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela.

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`; use o idioma em que a pessoa **fala**, não o da palavra ensinada), `--modelo small` para máquinas fracas.

A transcrição em português escreve as palavras estrangeiras do jeito que ouviu ("Comfortabullo", "vejetabol"). Anote-as: vão virar `correcoes` no passo 7, e os tempos delas continuam certos.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** são trechos de 0,7 s ou mais em que o Whisper não reconheceu palavras. Uma expressão estrangeira dita sozinha costuma cair aqui: eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica.

Pausas curtas (até ~0,5 s) são respiração e ficam. Só as pausas longas saem. **Deixe a pausa depois de cada expressão estrangeira**: é nela que o carimbo NÃO bate e que a imagem do sentido entra.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, calcula `rosto`, `zona` e os pontos de corte no plano. Este modelo fixa o recorte vertical em 9:16 (`modelo.json`): a pessoa é reposicionada pela moldura. Vídeo horizontal vira 3:4 com a base escura; o modelo funciona igual. Leia os avisos que o script imprime.

No fim, o `cortar.mjs` segue o rosto pelo vídeo (`rosto.rastro`). **Este modelo usa o rastreio**: a moldura da pessoa segue o rosto quando ela se mexe. Se o script disser que o rosto ficou sem rastro (de perfil, mão na frente), o enquadramento fica fixo; avise o usuário.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto; a caixa azul (cartão no peito) deve começar abaixo do queixo; a caixa amarela (legenda) deve ficar acima da linha vermelha (interface do aplicativo); as caixas roxas mostram o painel e a moldura larga. Se não estiver certo, refaça o passo 4 com medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`literal`) entra **pelo menos uma vez**; num vídeo sobre outro assunto, use-a em cada "o que parece contra o que é" (o termo técnico contra o que ele significa, o mito contra a verdade, o que se diz contra o que se quer dizer). Uma expressão é um `literal`; duas expressões seguidas trocam por cortina.

### 6b. Imagens

Leia `references/imagens.md`. **Neste modelo a imagem é protagonista**: cada `literal` precisa de uma imagem para o lado "ao pé da letra" e de uma para cada passo de "o que quer dizer".

1. A partir do mapa e de `work/palavras.json`, liste as imagens: para `kick the bucket`, um balde; para `bater as botas`, botas velhas; para `throw in the towel`, uma toalha jogada no ringue. Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (em inglês, concreto, a **coisa literal** que a expressão descreve: "bucket", "old leather boots"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Para o lado literal, peça o objeto simples e engraçado (`objeto` dá o emoji 3D sobre fundo claro); para o sentido, peça a cena ou a emoção (uma pessoa envergonhada, um ringue).
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`).
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem logo ou texto. O quadro da ficha é 418 × 372 (quase quadrado): prefira o assunto no centro. Objeto com fundo transparente entra como adesivo, sobre um fundo claro.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (a ficha mostra um cartão azul com o texto, nunca um buraco).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "balde" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `idioma2`, `semLegenda` e `correcoes`.

- `idioma2`: os trechos falados **na outra língua**, em segundos (`[{ "de": 2.8, "ate": 3.7 }]`). A legenda os pinta de azul-céu. Pegue o `em` da primeira e o `ate` da última palavra de cada trecho em `work/palavras.json`.
- `correcoes`: a transcrição em português escreve o inglês do jeito que ouviu ("Embarrassem-se" por "Embarrass yourself"). Corrija aqui; os tempos continuam certos. Para forçar uma quebra de linha da legenda, ponha a pontuação na correção (`"towel": "towel."`).
- Nos `literal`, `legenda: true`: a legenda bilíngue é a metade da graça.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda e marca linha com palavra sozinha; corrija o que der.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem reduzida a ~540 px de largura e confira:
- a expressão digitada cabe numa linha? As duas fichas estão inteiras, com imagem e texto legíveis, e o NÃO cai sobre a imagem sem esconder o objeto todo?
- a imagem da esquerda é mesmo o literal e a da direita o sentido? Imagem errada ou feia é pior que o cartão azul: troque ou `--escolher <id> 0`;
- a legenda fica abaixo do queixo, dentro da moldura, com a outra língua em azul-céu? Nenhuma linha junta duas frases?
- nas trocas (o `de` de cada `literal`), a tela nunca fica vazia nem com duas coisas por cima uma da outra.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-ao-pe-da-letra.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- de onde vieram as imagens (`creditos.txt`) e o que é ilustrativo;
- o que o usuário deve conferir: **as traduções e os sentidos** (escritos a partir da fala: peça a um professor para revisar se for aula), uma expressão que a transcrição pode ter errado, uma imagem em dúvida.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Tela cheia. Cartão de tinta no peito com a faixa de correio aéreo no topo: o rótulo pêssego (a área) e o título montado palavra por palavra, com o ponto azul-céu pulando para cada palavra dita; o `destaque` em azul-céu. |
| lista | `topicos` | Painel vermelho em cima, pessoa na moldura. Linhas grandes em creme que entram na fala; o ponto pula para a linha dita, as anteriores ficam mais claras. |
| passos | `passos` | Painel. Linhas numeradas ligadas por um traço que se acende até a etapa dita. |
| número | `numero` | Tela cheia. Cartão no peito: o número enorme contando, rótulo embaixo; "ilustrativo" quando for o caso. |
| comparação | `comparacao` | Painel. Dois lados empilhados; em `errado-certo` o errado leva o risco e o certo o traço desenhado (a mesma gramática do carimbo e do certo do `literal`). |
| gráfico | `grafico` | Painel. Barras (a maior em azul-céu), linha que se desenha ou anel; sem números, a onda da tendência com "ilustrativo". |
| destaque | `destaque` | Tela cheia. Cartão no peito: a frase enorme com traço embaixo (`chave`) ou toda em azul-céu (`alerta`); foto opcional no canto. |
| definição | `definicao` | Tela cheia. Verbete: o termo grande com o ponto, o significado escrito na fala; foto opcional. |
| frase | `frase` | Tela cheia. Aspas grandes em azul-céu e a frase montada palavra por palavra. |
| pergunta | `pergunta` | Tela cheia. A pergunta na fala e as opções como pílulas que entram quando ditas. |
| fechamento | `cta` | Tela cheia. Ícone de traço num círculo vermelho, a chamada na fala e a assinatura com nome e área. |
| **assinatura** | `literal` | Painel em cima, pessoa na moldura embaixo: a expressão digitada, a ficha "AO PÉ DA LETRA" (imagem literal + texto em azul + carimbo NÃO) e a ficha "O QUE QUER DIZER" (imagem do sentido); um segundo passo gira a ficha para "o certo em inglês" com traço azul. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa do bloco (`grafico` com `tendencia`).

## A assinatura em qualquer assunto

A assinatura do Ao Pé da Letra é **"o que parece contra o que é"**: uma frase, termo ou promessa que, lida ao pé da letra, diz uma coisa (carimbada com NÃO) e, de verdade, quer dizer outra. Funciona com qualquer par literal e real.

1. **Finanças / cripto.** "Mercado subindo não significa dinheiro no bolso, literalmente. Tem gente que perde mesmo na alta."
   - `literal` `expressao: "mercado subindo"`, `ao: { texto: "dinheiro no bolso" }` (carimbado NÃO), `quer: [{ texto: "tem gente que perde", detalhe: "mesmo na alta" }]`. Imagens: moedas no bolso contra um gráfico em queda; sem imagem boa, o cartão azul com o texto.
2. **Saúde / rotina.** "Dieta 'sem açúcar' ao pé da letra é sem açúcar. Na embalagem, quer dizer sem açúcar adicionado."
   - `literal` `expressao: "sem açúcar"`, `ao: { texto: "zero açúcar" }`, `quer: [{ texto: "sem açúcar adicionado", detalhe: "a fruta ainda tem" }]`. Imagens: um pote de açúcar vazio contra uma fruta cortada.
3. **Algo bem distante (carreira, relacionamento, história pessoal).** "Quando o chefe diz 'a porta está aberta', ao pé da letra é uma porta. Na prática, quer dizer 'pode pedir demissão'."
   - `literal` `expressao: "a porta está aberta"`, `ao: { texto: "uma porta aberta" }`, `quer: [{ texto: "pode pedir demissão" }]`. Imagens: uma porta contra uma caixa de papelão com objetos de mesa.

**Espanhol.** O mesmo bloco com as expressões em espanhol ("tirar la casa por la ventana" → "throw the house out the window", que em português é "jogar dinheiro fora"), `idioma2` nos trechos em espanhol e, se o vídeo for **falado em espanhol** (público latino), `rotulos` no plano: `"ao": "al pie de la letra"`, `"querDizer": "lo que quiere decir"`, `"certoEm": "lo correcto en inglés"`, `"nao": "NO"`, `"expressoes": "expresiones"` (lista completa em `references/plano.md`) e `preparar.mjs --idioma es`.

## Fidelidade

- Tudo na tela vem da fala. As traduções e os sentidos são o que a pessoa diz; não acrescente significado que ela não falou (se faltar o sentido, deixe só a imagem e o texto dito, sem `detalhe`).
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- O carimbo NÃO marca o literal que a pessoa descarta; só use quando ela disser que o literal está errado ou engraçado.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente passos em `quer` com `em`.
- **A legenda não pinta a outra língua**: confira o `idioma2` (o `em` da primeira palavra do trecho tem que estar dentro do intervalo).
- **A expressão digitada vem pequena**: passou de ~22 letras; encurte com as palavras da fala.
- **Imagem ruim ou borrada**: o objeto 3D tem 256 px e fica nítido só como adesivo (já é tratado assim); para foto, escolha uma candidata com pelo menos 1000 px.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou a expressão estrangeira**: use `correcoes` no plano (os tempos continuam certos).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
