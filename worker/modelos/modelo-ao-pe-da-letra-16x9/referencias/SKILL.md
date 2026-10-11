---
name: modelo-ao-pe-da-letra-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Ao Pé da Letra. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Ao Pé da Letra: painel vermelho-carimbo com duas fichas lado a lado, \"AO PÉ DA LETRA\" (imagem literal, batida com um carimbo NÃO) e \"O QUE QUER DIZER\" (o sentido real), a expressão digitada no alto, legenda bilíngue (português em creme, a outra língua em azul-céu) e a pessoa numa moldura à direita. O humor vem do contraste das imagens. Serve para qualquer assunto: expressões em inglês ou espanhol, gírias, traduções que dão errado, jargão contra linguagem simples, mito contra verdade, finanças, saúde. Use quando o usuário pedir \"modelo Ao Pé da Letra\", \"expressões em inglês\", \"literal contra real\", \"tradução que dá errado\", e quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação à esquerda)."
---

# Modelo Ao Pé da Letra (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Ao Pé da Letra no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, fichas, carimbo, cortina, legenda bilíngue, sons e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio. Os blocos curtos (abertura, número, destaque, definição, frase, pergunta, fechamento) continuam de tela cheia, no cartão de tinta no peito, logo abaixo do queixo e centrado no rosto: mais largo e mais baixo que no vertical (até 1080 px de largura), porque o quadro deitado não tem altura para uma pilha alta.
- **O painel só abre quando acrescenta clareza.** Na assinatura (`literal`) e nos blocos de lista, passos, comparação e gráfico, o vermelho-carimbo toma o quadro, a pessoa vai para uma **moldura do lado direito** (x 1264, y 64, 560 × 912, retrato de cabeça, ombros e peito), com o rosto centralizado e acompanhado suavemente pelo rastro, e o bloco ocupa o **quadro do lado esquerdo** (x 96, y 64, 1120 × 808). Quando a ideia termina, a pessoa cresce de volta para a tela inteira.
- **Legenda na área segura de baixo**, numa linha só (o corpo encolhe de 48 até 36 px para caber), terminando em y 976: centrada no quadro na tela cheia; com o painel, embaixo do quadro da esquerda, ao lado da moldura.
- **Ritmo de aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s. Corte as pausas longas e os erros, mas mantenha as respirações e o tempo de entender: não acelere como se fosse um anúncio.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira um jogo de contraste: quando a pessoa diz a expressão, ela vai para a moldura da direita e o quadro da esquerda mostra duas fichas de papel. Na da esquerda, o que a expressão diz **ao pé da letra**, com a imagem literal (um balde azul) e um carimbo NÃO vermelho batendo em cima. Na da direita, **o que quer dizer** de verdade, com a imagem do sentido. A expressão aparece digitada no alto e a legenda pinta a outra língua em cor.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com expressões em inglês, mas o vídeo do usuário pode ser sobre qualquer coisa (espanhol, gírias, jargão, mito e verdade). Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a expressão é digitada letra por letra com um cursor; cada ficha entra quando a pessoa fala o que ela mostra (a imagem se revela, o texto se monta na fala). O **carimbo NÃO** bate de grande para o tamanho certo em 0,2 s, a ficha treme de leve e a imagem de baixo perde cor. Quando a ficha da direita ganha um segundo passo (o certo em inglês), ela gira como uma carta e o novo conteúdo entra, com um traço azul desenhado à mão e uma moldura azul. Entre duas expressões, uma cortina vermelho-escura passa pelo painel.
- **Organização e hierarquia:** no alto do quadro da esquerda, o rótulo "EXPRESSÕES" e a expressão digitada em fonte mono grande. Embaixo dela, duas fichas de 542 × 636 px, uma ao lado da outra, que ocupam o quadro inteiro: rótulo, imagem deitada (498 × 304), texto de 34 a 56 px e uma linha de detalhe. Antes de entrar, a ficha vazia já está lá com um "?" tracejado: o espectador sabe que o contraste vem.
- **Tipografia:** Be Vietnam Pro (500, 700, 800, 900) para tudo o que se lê; Roboto Mono para o que é digitado. No quadro deitado: títulos de 64 a 84 px, texto ≥ 34 px, rótulos em caixa alta ≥ 26 px, legenda de 36 a 48 px. Todo texto é medido com a fonte de verdade e reduzido para caber.
- **Moldura da pessoa:** duas situações. **Tela cheia** com um cartão de tinta no peito (abertura, número, destaque, definição, frase, pergunta, fechamento), centrado no rosto. **Moldura à direita** (retrato alto de cabeça, ombros e peito, cantos arredondados, nome na etiqueta) quando um painel ocupa o quadro da esquerda; a legenda fica embaixo do quadro, ao lado da moldura. O rosto fica no meio da moldura e ela segue o rosto pelo rastreio, com ajuste suave, sem saltos.
- **Cores, textura e som:** vermelho-carimbo `#E5402A` (fundo dos painéis), papel creme `#FFF5E6` (as fichas e tudo o que se lê sobre o fundo), tinta azul-noite `#171430` (cartões no peito e texto sobre o papel), **azul-céu** `#8DBEFF` = outra língua (legenda, ponto que pula) e azul-cobalto `#2355E8` (o inglês nas fichas, o certo), carimbo `#D4261A`. A borda dos cartões é uma faixa diagonal de correio aéreo (vermelho, creme e azul). Sons raros e tonais: uma batida grave e curta quando o carimbo cai, duas notas quando o certo se desenha, uma nota curta nos itens, um acorde suave no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
   - A gravação ideal é **deitada** (16:9). Um original vertical funciona, mas o vídeo de trabalho vira uma faixa deitada em volta do rosto, com menos imagem.
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

Pausas curtas (até ~0,5 s) são respiração e ficam. Só as pausas longas saem. **Deixe a pausa depois de cada expressão estrangeira**: é nela que o carimbo NÃO bate e que a imagem do sentido entra. No vídeo longo vale a regra da aula 9: corte as pausas excessivas e os erros, mas preserve o tempo de entender a explicação; os improvisos corretos ficam.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, calcula `rosto` (com o `quadro` 1920×1080), `zona` e os pontos de corte no plano. Este modelo entrega sempre o quadro deitado 1920×1080 (`modelo.json`, `"formato": "16:9"`): um original deitado entra inteiro; um vertical vira uma faixa deitada em volta do rosto. A `zona` é a faixa do peito, de 60 px abaixo do queixo até 72 px da base. Leia os avisos que o script imprime.

No fim, o `cortar.mjs` segue o rosto pelo vídeo (`rosto.rastro`). **Este modelo usa o rastreio**: na moldura da direita o rosto fica centralizado e a moldura acompanha a pessoa quando ela se mexe, com ajuste suave. Se o script disser que o rosto ficou sem rastro (de perfil, mão na frente), o enquadramento fica fixo; avise o usuário.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto; a caixa azul (cartão no peito) deve começar abaixo do queixo; as caixas amarelas (a legenda na tela cheia e com o painel) devem ficar acima da linha vermelha (controles do player); as caixas roxas mostram o quadro do painel, à esquerda, e a moldura da pessoa, à direita; as linhas rosa nas laterais são as margens seguras. Se não estiver certo, refaça o passo 4 com medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`literal`) entra **pelo menos uma vez**; num vídeo sobre outro assunto, use-a em cada "o que parece contra o que é" (o termo técnico contra o que ele significa, o mito contra a verdade, o que se diz contra o que se quer dizer). Uma expressão é um `literal`; duas expressões seguidas trocam por cortina.

### 6b. Imagens

Leia `references/imagens.md`. **Neste modelo a imagem é protagonista**: cada `literal` precisa de uma imagem para o lado "ao pé da letra" e de uma para cada passo de "o que quer dizer".

1. A partir do mapa e de `work/palavras.json`, liste as imagens: para `kick the bucket`, um balde; para `bater as botas`, botas velhas; para `throw in the towel`, uma toalha jogada no ringue. Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (em inglês, concreto, a **coisa literal** que a expressão descreve: "bucket", "old leather boots"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Para o lado literal, peça o objeto simples e engraçado (`objeto` dá o emoji 3D sobre fundo claro); para o sentido, peça a cena ou a emoção (uma pessoa envergonhada, um ringue).
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`).
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem logo ou texto. No quadro deitado a imagem da ficha é 498 × 304 (deitada): prefira o assunto no centro e fotos deitadas. Objeto com fundo transparente entra como adesivo, sobre um fundo claro.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (a ficha mostra um cartão azul com o texto, nunca um buraco).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "balde" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `idioma2`, `semLegenda` e `correcoes`.

- `idioma2`: os trechos falados **na outra língua**, em segundos (`[{ "de": 2.8, "ate": 3.7 }]`). A legenda os pinta de azul-céu. Pegue o `em` da primeira e o `ate` da última palavra de cada trecho em `work/palavras.json`.
- `correcoes`: a transcrição em português escreve o inglês do jeito que ouviu ("Embarrassem-se" por "Embarrass yourself"). Corrija aqui; os tempos continuam certos. Para forçar uma quebra de linha da legenda, ponha a pontuação na correção (`"towel": "towel."`).
- Nos `literal`, `legenda: true`: a legenda bilíngue é a metade da graça (ela fica embaixo do quadro da esquerda, ao lado da moldura).

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda e marca linha com palavra sozinha; corrija o que der.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Os quadros saem com metade do tamanho (960 × 540); olhe cada um e confira:
- a expressão digitada cabe numa linha? As duas fichas estão inteiras no quadro da esquerda, com imagem e texto legíveis, e o NÃO cai sobre a imagem sem esconder o objeto todo?
- a imagem da esquerda é mesmo o literal e a da direita o sentido? Imagem errada ou feia é pior que o cartão azul: troque ou `--escolher <id> 0`;
- a pessoa está inteira na moldura da direita, com o rosto no meio, e nada do bloco passa por cima dela?
- na tela cheia, o cartão no peito fica abaixo do queixo, sem cobrir o rosto, e acima da legenda e dos controles do player?
- a legenda fica numa linha, na área segura de baixo, com a outra língua em azul-céu? Nenhuma linha junta duas frases?
- nas trocas (o `de` de cada `literal`), a tela nunca fica vazia nem com duas coisas por cima uma da outra.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-ao-pe-da-letra-16x9.mp4"
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
| abertura | `abertura` | Tela cheia. Cartão de tinta no peito (centrado no rosto) com a faixa de correio aéreo no topo: o rótulo pêssego (a área) e o título montado palavra por palavra, com o ponto azul-céu pulando para cada palavra dita; o `destaque` em azul-céu. |
| lista | `topicos` | Painel vermelho no quadro da esquerda, pessoa na moldura da direita. Linhas grandes em creme que entram na fala; o ponto pula para a linha dita, as anteriores ficam mais claras. |
| passos | `passos` | Painel. Linhas numeradas ligadas por um traço que se acende até a etapa dita. |
| número | `numero` | Tela cheia. Cartão no peito: o número enorme contando, rótulo embaixo; "ilustrativo" quando for o caso. |
| comparação | `comparacao` | Painel. Dois lados empilhados no quadro da esquerda; em `errado-certo` o errado leva o risco e o certo o traço desenhado (a mesma gramática do carimbo e do certo do `literal`). |
| gráfico | `grafico` | Painel. Barras (a maior em azul-céu), linha que se desenha ou anel; sem números, a onda da tendência com "ilustrativo". |
| destaque | `destaque` | Tela cheia. Cartão no peito: a frase enorme com traço embaixo (`chave`) ou toda em azul-céu (`alerta`); foto opcional no canto. |
| definição | `definicao` | Tela cheia. Verbete: o termo grande com o ponto, o significado escrito na fala; foto opcional. |
| frase | `frase` | Tela cheia. Aspas grandes em azul-céu e a frase montada palavra por palavra. |
| pergunta | `pergunta` | Tela cheia. A pergunta na fala e as opções como pílulas que entram quando ditas. |
| fechamento | `cta` | Tela cheia. Ícone de traço num círculo vermelho, a chamada na fala e a assinatura com nome e área. |
| **assinatura** | `literal` | Painel no quadro da esquerda, pessoa na moldura da direita: a expressão digitada, a ficha "AO PÉ DA LETRA" (imagem literal + texto em azul + carimbo NÃO) e a ficha "O QUE QUER DIZER" (imagem do sentido), lado a lado; um segundo passo gira a ficha para "o certo em inglês" com traço azul. |

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
- **A expressão digitada vem pequena**: passou de ~26 letras; encurte com as palavras da fala.
- **Imagem ruim ou borrada**: o objeto 3D tem 256 px e fica nítido só como adesivo (já é tratado assim); para foto, escolha uma candidata com pelo menos 1000 px.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou a expressão estrangeira**: use `correcoes` no plano (os tempos continuam certos).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o quadro 1920×1080 (ou é vertical e virou uma faixa deitada); o vídeo sai menos nítido. Avise o usuário.
- **Cartão no peito subindo sobre o rosto**: a pessoa foi gravada muito baixa no quadro e o texto do cartão é longo; encurte o texto com as palavras da fala ou troque por um bloco de painel.
