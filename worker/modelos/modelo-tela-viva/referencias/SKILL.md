---
name: modelo-tela-viva
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Tela Viva, o formato viral de demonstração: layout dividido fixo do primeiro ao último quadro, com uma gravação de tela que nunca para (rola, aproxima, cursor clicando) flutuando sobre o próprio cenário, um rótulo branco com o nome do assunto no gancho e a pessoa em take único embaixo com legenda minúscula no peito. Sem transição, sem logo, sem texto de chamada. Serve para qualquer assunto (ferramenta de IA, site, app, planilha, tutorial, produto): a IA captura as páginas reais, escolhe onde a câmera para e traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Tela Viva\", \"tela em cima e eu embaixo\", \"gravação de tela dividida\", \"mostra a tela enquanto eu falo\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Tela Viva

O vídeo vira uma demonstração ao vivo: em cima, uma **gravação de tela** (89% da largura, 30% da altura) que se mexe o tempo todo; na junção, um **rótulo branco** com o assunto; embaixo, a pessoa (60% do quadro) falando em um take só, com a legenda pequena no peito. O primeiro quadro já é o layout final. Quem prende a atenção é o movimento da tela, não o corte nem o efeito. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, capturar páginas, conferir, renderizar); você faz a parte de editor (as tomadas, o ritmo dos cortes, o que mostrar na tela e quando, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com atalhos do Windows, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda é um erro: o `render.mjs` recusa.

## O DNA deste formato

Vem do Reel "Claude 5.5 é o novo teto do 3D com IA" (60 s, 6 mil curtidas, quase sem edição). Cada regra abaixo é uma instrução para você.

1. **Layout fixo do primeiro ao último quadro**: tela em cima (~88% da largura, de y 120 a y 772), rótulo branco sobre a parte de baixo da tela, rosto embaixo (~60%). Nada muda de lugar e **não existe preto no quadro**: o vídeo da pessoa preenche tudo e a tela flutua por cima, com cantos arredondados e sombra.
2. **A primeira palavra sai em até 0,1 s** e a primeira frase tem um adjetivo de espanto ("isso aqui é insano", "olha isso"). Se o usuário começa com enrolação, corte até a primeira frase que prende.
3. **O rótulo branco abre o vídeo** e some em corte seco em ~15% da duração (nos vídeos curtos, no primeiro corte da tela). Nunca volta. É o bloco `abertura`.
4. **A tela nunca fica parada**: câmera sobre a captura andando o tempo todo (rola e aproxima devagar) e o cursor se mexendo. Nenhuma imagem parada por mais de ~2 s.
5. **Troque a cena da tela a cada 5 a 10 s** (nos vídeos curtos, a cada ~4 s), sempre entre frases, nunca no meio de uma. Cada troca é um corte seco, sem animação.
6. **Números concretos na fala** sustentam o "insano" ("145 peças", "3 atalhos"). Se o usuário não disse nenhum, não invente.
7. **O rosto é um take único**: só 1 a 3 reenquadramentos de ~6% (um a cada ~20 s), sempre num corte da fala; nunca zoom animado.
8. **Legenda branca, minúscula, sem caixa**, 2 a 4 palavras por vez, centro a 82% da altura (no peito). Sem cor de destaque, sem sublinhado.
9. **Gestos de dedo e mão a cada ênfase**: mantenha as tomadas em que ele gesticula e sorri; a energia faz parte do formato.
10. **Duas provas em sequência, a segunda maior que a primeira** ("nesse aqui…"), com virada no meio. Ao montar o mapa, dê à segunda prova a captura mais impressionante.
11. **Uma provocação comparativa antes da chamada** ("o modelo anterior parece uma criança"), quando a fala tiver.
12. **Chamada final em pergunta + ação dupla** ("deixa nos comentários e dá dois toques"), só na voz, sem texto na tela.
13. **Termina na última palavra**, sem tela final, sem logo.
14. **O que este formato não tem**: motion graphic, emoji, transição entre cenas, zoom animado, texto de chamada, música ou som de efeito. Reproduza só o que o Reel tem.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** quase nenhuma. Tudo é corte seco (entra e sai sem animação). O movimento está dentro da gravação: a câmera percorre a captura sem parar (rola e aproxima, ~0,5 a 1% de zoom por segundo), o cursor desliza até o que a pessoa nomeia, na palavra, e clica (um anel branco que abre e some em 0,5 s). Embaixo, só reenquadramentos de ~6% nos cortes.
- **Organização e hierarquia:** três faixas fixas. A moldura da tela (x 64 a 1016, y 120 a 772, cantos de 16 px), o rótulo (y 650 a 754, ~58% da largura, sobre a base da tela) e a pessoa (de y 770 até a base). Um assunto por vez na tela; o rótulo é a única hierarquia.
- **Tipografia:** Manrope. Rótulo em 800, preto sobre branco, 60 px (menor se for longo). Legenda em 600, ~48 px, minúscula. Nos blocos que entram na moldura (quando o vídeo pede), 600 a 800, nada abaixo de 24 px.
- **Moldura da pessoa:** a pessoa ocupa a parte de baixo de borda a borda, com a cabeça centralizada e inteira (olhos por volta de y 1130) e segue o rosto. Nunca vira janela nem coluna lateral.
- **Cores, textura e som:** **zero preto**: o cenário da pessoa (a cópia borrada do próprio vídeo) aparece em volta da tela; branco do rótulo e da legenda, páginas reais em cima, e **um** destaque, o roxo-neon do estúdio `#B678FF`, só nos blocos extras. Nada sobre a pessoa: a cor do vídeo nunca muda. Sem som de efeito (o formato é só voz).

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB, que também faz as capturas de tela). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **o assunto em poucas palavras**: vai no rótulo branco do começo ("Atalhos do Windows", "Claude Opus 5.5", "Meu novo site"). Sem resposta, tire do próprio vídeo;
   - **o que aparece na tela de cima**: se ele tem gravações de tela ou prints próprios do assunto (peça para pôr em `public/tela/`), ou se você pode usar páginas públicas (você captura com `ferramentas/capturar.mjs`);
   - **a chamada final**: o vídeo termina na última palavra, sem tela final. Se a fala dele já tem a chamada ("deixa nos comentários e dá dois toques na tela", "comenta X que eu te mando…"), ela fica só na voz. Nunca vai texto de chamada na tela.

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela. Crie também `public/tela/` lá dentro (as capturas e prints da tela de cima).

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas.

### 3. Escolher as tomadas e justar os cortes

Leia a lista como um editor (veja **Ritmo e cortes**, abaixo). Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, "é…" longos sozinhos, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (meça o volume: `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`; perto de −60 dB é silêncio, −30 dB ou mais é fala).

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Depois de escolher, deixe os cortes justos:

```bash
node ferramentas/justar.mjs
```

Ele transforma cada pausa de 0,38 s ou mais entre trechos mantidos num corte com ~0,16 s de respiro (`--respiro 0.2` para uma fala mais calma). Pausas menores (vírgulas, respiração no meio da frase) ficam como estão.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa 9:16 (quadro cheio) para gravação vertical e horizontal; numa gravação horizontal o quadro é um recorte em volta do rosto, então ela precisa de boa resolução (1080p no mínimo; 4K fica nítido). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a câmera acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha branca é a base da moldura da tela; a roxa é o rótulo; a verde é o topo da cabeça, igual nos dois zooms; a azul é o queixo no zoom mais fechado; a amarela é o centro da legenda; a legenda do Reel original fica abaixo da linha vermelha de propósito (no peito); nada importante da tela de cima na faixa vermelha da direita. Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s. A tela de cima mostra **uma gravação contínua**: cada **cena** (1 a 3 batidas, 4 a 10 s) é uma `tela` com uma captura real e uma câmera que anda. Perguntas do mapa:

- **Qual é a prova de cada parte da fala?** Uma página, um print, um app. Cada prova é uma `tela`; a segunda deve ser maior que a primeira (DNA 10).
- **Em que palavra a câmera chega e o cursor clica?** Cada cursor entra na palavra que nomeia a coisa (`em`).
- **O vídeo tem uma forma que a tela não resolve?** (um número solto, uma lista de motivos, uma comparação): use o bloco universal correspondente, que ocupa a moldura em corte seco no lugar da gravação. Use pouco: o Reel original não tem nenhum.
- **O rótulo:** uma `abertura` de 0 até o primeiro corte da tela (no máximo ~15% do vídeo).

### 6b. Capturas da tela de cima

1. Liste as páginas que provam o que a pessoa diz (uma por cena). Prefira páginas reais e públicas do assunto: documentação oficial, a página do produto, uma tabela, uma matéria. Material do usuário em `public/tela/` passa na frente.
2. Capture cada uma:

```bash
node ferramentas/capturar.mjs "https://…" <nome> [--clicar "texto do botão"] [--altura 1000] [--max 5200]
```

   Grava `public/tela/<nome>.jpg` (página inteira, 2× de resolução, sem interface do navegador) e imprime a **proporção altura ÷ largura**. `--clicar` abre acordeões e abas pelo texto do botão antes da captura (para mostrar o item que a pessoa cita). Print ou gravação do próprio usuário: ponha o arquivo `.jpg` em `public/tela/`; a proporção é altura ÷ largura em pixels (`ffprobe -v error -show_entries stream=width,height -of csv=p=0 arquivo`).
3. Olhe cada captura reduzida (`sips -Z 900` no Mac, ou `ffmpeg -i x.jpg -vf scale=900:-1 pequena.jpg`) e **meça onde está o que a pessoa cita**, em frações da captura inteira (0 = topo/esquerda, 1 = base/direita). É com essas frações que você escreve a câmera e o cursor. Recorte a região para conferir (um `crop` com Pillow ou `ffmpeg -vf crop`).
4. **Nada de interface desenhada à mão**: a tela é sempre uma captura real. Nada de "Remotion" aparecendo em nenhuma captura.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser, `camera`. Deixe `"sfx": false`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). O aviso "três `tela` seguidos" é esperado neste modelo: ignore-o. Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda do motor (o modelo as divide em pedaços de 2 a 4 palavras).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "Shift + S": "Shift+S" }`).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
node ferramentas/conferir-tempos.mjs
```

Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- a captura preenche a moldura sem nenhuma faixa preta em volta e sem vão preto até o rosto;
- o rótulo está inteiro, centralizado, sem o texto vazando, e some no corte certo;
- a tela mostra **o que a pessoa está dizendo** naquele instante e o texto da captura está legível (se não, aumente o `zoom` final);
- o cursor está em cima do item citado quando ele é dito, e o clique cai na palavra;
- a cabeça está inteira, com folga abaixo do rótulo, e a legenda está no peito, sem encostar no queixo;
- nenhuma cena para: compare dois quadros da mesma `tela` (início e fim); a câmera precisa ter andado.

Gere quadros em volta de cada corte (`node scripts/stills.mjs 7.1 7.3 7.5`) para ver que a troca é seca. Corrija o plano (outra fração, mais zoom, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-tela-viva.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (quantas pausas viraram corte);
- o **mapa resumido** (que cena e que captura entrou em cada trecho);
- de onde vieram as capturas (endereços das páginas ou arquivos do usuário);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma captura que ele pode trocar por uma gravação própria).

## Regras de margem, timing e texto (revisão do Tiago)

- **Margem segura:** nenhum texto, rótulo ou print importante encosta nas laterais (≥ 64 px de cada lado), nada importante acima de y 120 e nada importante abaixo de y 1700 (interface do app). A moldura, o rótulo e os blocos já respeitam; a legenda fica em y 1565.
- **Zero preto:** a tela flutua sobre o vídeo da pessoa (cenário borrado em volta, nunca preto).
- **Sem tarja preta:** a captura **preenche** a moldura inteira (cover, com foco em `x`,`y` e aproximação). Nunca letterbox. Se a captura for baixa e larga, o template já a amplia até cobrir; escolha o foco no que importa.
- **Timing:** todo `em` (cursor, clique, itens) cai na palavra que nomeia a coisa, ±0,15 s, e a tela mostra literalmente o que está sendo dito. Rode `node ferramentas/conferir-tempos.mjs` e corrija os "FORA". Olhe 1 quadro em cada entrada. Rótulo sem relação com a fala é proibido.
- **Texto cabe:** o rótulo e os blocos medem o texto e reduzem o corpo ou quebram a linha; nunca deixam a letra passar da caixa. Se o texto ainda ficar pequeno demais, encurte-o.

## Ritmo e cortes

- **Fala corrida: toda pausa sai.** Use o `preparar` e o `justar` (`node ferramentas/justar.mjs --respiro 0.2`): o respiro entre frases fica entre 0,2 e 0,4 s (nunca mais). Corte pelas pausas reais, nunca pelos tempos das palavras (o Whisper estica o começo das frases para dentro do silêncio: meça com `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`).
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora do vídeo. **O que fica:** pausa curta de vírgula, gesto e sorriso.
- **Cada corte reenquadra o rosto em ~6%** (o template faz sozinho: 1,00 e 1,06, nunca o mesmo duas vezes). É isso que esconde o pulo do corte. Num vídeo curto, os cortes de fala são os únicos reenquadramentos; não crie outros.
- **Só corte seco.** Nada de transição, filtro, LUT ou mudança na cor da pessoa.
- **A tela troca nos cortes da fala**, entre frases (cada `tela` começa onde uma frase começa). A câmera de cada `tela` anda do primeiro ao último quadro dela: `ini` e `fim` diferentes, com zoom variando de ~1,0 a ~2,2. O cursor tem pelo menos um ponto a cada ~3 s.
- **O vídeo termina na última palavra.** Sem tela final.

## Blocos deste modelo

A moldura da tela mostra o momento atual e troca **em corte seco**. O `tela` é o padrão; os outros só entram quando a fala tem uma forma que a gravação não resolve.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (1)** | `tela` | um trecho da gravação: captura real de página (`captura`, `proporcao`), câmera que anda de `ini` a `fim` (centro `x`,`y` em frações da captura e `zoom`) e `cursor` com pontos nas palavras ditas (`clique: true` desenha o toque) |
| **assinatura (2)** | `abertura` | o rótulo branco na junção, com o assunto, pronto desde o primeiro quadro, em corte seco no começo e no fim |
| lista | `topicos` | dentro da moldura, fundo escuro, linhas brancas que entram na fala e marcador neon na da vez |
| passos | `passos` | a mesma lista com números e um fio que desce até o passo da vez |
| número | `numero` | o número contando em pt-BR, enorme, na moldura, com o `rotulo` embaixo |
| comparação | `comparacao` | duas metades da moldura, cada uma entrando no seu `em`; símbolo entre elas |
| gráfico | `grafico` | barras, linha ou rosca desenhadas na fala; sem números ditos, uma curva com "ilustrativo" |
| destaque | `destaque` | a palavra-chave grande, com ícone de traço; `alerta` inverte a moldura para branco |
| definição | `definicao` | o termo em 800 e o significado linha a linha |
| frase | `frase` | a frase em tipo grande, palavra por palavra (a legenda some) |
| pergunta | `pergunta` | a pergunta e as `opcoes` em linhas (a legenda some) |
| fechamento | `cta` | pílula com o ícone e a chamada na moldura. **Evite**: o formato original não tem texto de chamada; só use se o usuário pedir |

## A assinatura em qualquer assunto

A assinatura é **"a prova ao vivo"**: enquanto a pessoa fala, a tela de cima mostra a coisa de verdade, andando, com o cursor apontando. O rótulo diz do que se trata. Vale para qualquer assunto que tenha um lugar onde ver a coisa.

1. **Finanças/cripto.** "Olha esse gráfico do Bitcoin: em um ano subiu 120%. Nesse outro site dá para ver quem mais comprou."
   Rótulo "Bitcoin em 2026". `tela` 1: página pública de cotação (capture com `capturar.mjs`) com a câmera descendo até o gráfico e o cursor parando no número quando ele é dito; `tela` 2: a página maior, de um relatório, com o cursor no trecho citado. Se não houver número dito, não escreva nenhum.
2. **Saúde/rotina.** "Esse estudo mostra que dormir sete horas muda tudo. E nesse aplicativo eu acompanho meu sono."
   Rótulo "Sono e saúde". `tela` 1: a página do estudo, com a câmera no resumo; `tela` 2: o site do aplicativo, com o cursor no recurso. Nada de "7 horas" na tela que ele não tenha dito.
3. **História pessoal/carreira.** "Esse foi o primeiro site que eu fiz. Hoje ele está assim."
   Rótulo "Meu primeiro site". `tela` 1: um print antigo que o usuário mandou (`public/tela/`), com a câmera aproximando devagar; `tela` 2: a página atual capturada, com o cursor passando pelas seções. Sem prints do usuário, use só a página atual: não invente o antigo.

## Fidelidade

- Tudo na tela vem da fala; o rótulo resume o assunto com as palavras dele.
- A captura mostra **o que foi dito**, não uma interpretação. Na dúvida, escolha outra página ou peça um print ao usuário.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- O cursor só aponta para texto que existe na captura, e na palavra em que ele é dito.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`. Um momento `tela` longo precisa de pontos de `cursor` com `em` dentro dele (um a cada ~3 s).
- **A fala ainda tem pausas longas no vídeo**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: aumente o respiro (`node ferramentas/justar.mjs --respiro 0.22`) ou, só naquele corte, afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **O `capturar.mjs` não acha o Chrome**: rode `npx remotion browser ensure` dentro do projeto.
- **A captura saiu com banner de cookies, login ou "entrar"**: tente outra página do mesmo assunto, ou use `--clicar` num botão de recusar/fechar; se o aviso ficar num canto e o cursor/câmera não passam por ele, tudo bem.
- **A página está colapsada (acordeão, aba)**: use `--clicar "texto do título"` para abrir antes de capturar.
- **A câmera não chega no que a pessoa cita**: reveja as frações `x` e `y` no recorte da captura; o centro da câmera é limitado pelas bordas da captura (nunca mostra borda vazia).
- **O texto da captura está pequeno**: aumente o `zoom` do `fim` (2,0 a 2,4 é legível no celular) e ajuste `x` para o item ficar no centro.
- **A legenda ficou com um pedaço estranho** ("+ s tira"): corrija com `correcoes` (`{ "Shift + S": "Shift+S" }`).
- **A tarja do nome de quem fala**: este modelo não usa; o nome da pessoa não aparece.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
