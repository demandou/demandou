---
name: modelo-demo
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Demo, o formato viral de demonstração: a pessoa fala corrida e a edição é só o que ela mostra, em três layouts trocados em corte seco (material em cima e ela embaixo, material em tela cheia, ou ela em tela cheia mais fechada quando fala direto com quem assiste), faixa verde de benefício só no gancho, gravações de tela reais com cursor na ordem da fala e legenda laranja-ouro em caixa-alta o tempo todo. Sem transição, sem zoom animado. Serve para qualquer assunto (ferramenta de IA, app, planilha, tutorial, produto, site): a IA captura as páginas reais e traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Demo\", \"Reel de demonstração com a tela em cima\", \"mostra a tela enquanto eu falo\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Demo

O vídeo vira uma demonstração ao vivo e **corrida**: a pessoa fala sem respiro e a edição só troca o que aparece, em três layouts, sempre em corte seco. **Split**: o material (imagem, gravação de tela) nos 44% de cima, sem borda, e ela embaixo olhando para a tela. **Cheio**: o material ocupa o quadro todo e só a voz continua. **Eu**: ela em tela cheia, mais fechada, para o argumento e a chamada final. Na emenda do split, uma faixa verde com o benefício, só nos primeiros segundos. A legenda laranja-ouro, em caixa-alta, não sai de cena. O primeiro quadro já é o layout final. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, capturar páginas, conferir, renderizar); você faz a parte de editor (as tomadas, o que mostrar e quando, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com erros de site, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda é um erro: o `render.mjs` recusa.

## O DNA deste formato

Vem do Reel "Google enterrou 90% do mercado de apps" (93 s, 894 comentários na palavra-chave, nenhum motion graphic). Cada regra abaixo é uma instrução para você.

1. **A primeira palavra sai em até 0,1 s** e o primeiro quadro já é o layout final (insert em cima, rosto embaixo, faixa verde), sem intro, logo nem fade. Se o usuário começa com enrolação, corte até a primeira frase que prende.
2. **Gancho = uma afirmação ousada + uma imagem-metáfora literal** no insert de cima durante o gancho (o Reel original: o mascote do Google enterrando os concorrentes; o exemplo: a placa de saída para "cliente sair do site"). Busque com `imagens.mjs` (só fontes grátis); se nada servir, use uma gravação de tela do assunto.
3. **A faixa-rótulo verde** (benefício, texto branco, duas linhas, ~44% da largura) fica colada na emenda do split **só durante o gancho** (até o primeiro corte de layout) e depois sai, sem voltar. É o bloco `abertura`. Escreva o benefício, não o tema ("Venda mais com o seu site").
4. **Três layouts, trocados só por corte seco**, a cada 3 a 17 s (média ~8 s): split (insert em cima, 44% da altura, sem borda nem cantos, a pessoa embaixo), cheio (o insert ocupa tudo, a pessoa some, fica só a voz) e eu (tela cheia, zoom ~1,3). Quem muda é o layout, não o plano dela: ela nunca ganha zoom animado nem punch-in.
5. **Fala corrida, 200+ palavras por minuto**: toda pausa sai e o respiro entre frases fica entre 0,2 e 0,4 s. Não há jump cut visível: o corte que o espectador vê é o do layout.
6. **Todo insert entra na palavra que o nomeia** ("criei esse aplicativo" corta para o app no "criei") e dura até a próxima ideia.
7. **Demonstração de tela sempre com cursor e ação** (clique, rolagem), na ordem exata em que ele fala; durante ela ele olha para baixo/para o lado, como se operasse. Use material real (`ferramentas/capturar.mjs`), nunca interface desenhada.
8. **O resultado impressionante fica parado numa grade ou arte** por até ~10 s enquanto ele reage com gestos, sem zoom. Se tiver uma prova final, dê a ela o insert mais longo.
9. **Quando ele fala direto ao espectador** (o argumento "e o melhor, é de graça", a chamada), o insert some e ele vem em tela cheia, mais fechado (layout eu).
10. **Legenda em 100% do tempo**, em todos os layouts, na mesma altura (80% da altura): caixa-alta, fonte display condensada, laranja-ouro com contorno escuro, 2 a 3 palavras por vez, fade-in curto. Sem caixa, sem cor por palavra.
11. **A venda entra no último terço** (a ponte "isso é só uma das habilidades…", uma ou duas artes do produto, a data), depois a chamada. Se o usuário não vende nada, a fala termina na chamada.
12. **Chamada de palavra-chave** ("comenta X que eu te mando…") falada em tela cheia (eu), nos últimos ~6 s, **sem texto de chamada na tela**. O vídeo termina na última palavra, no corte seco.
13. **Artes e pôsteres do próprio criador** entram como insert com movimento leve (a `imagem` aproxima devagar) para não parecer foto parada.
14. **O que este formato não tem**: zoom animado, tremida, transição (só corte seco), motion graphic além da faixa verde, emoji, logo fixo, barra de progresso, cor de destaque por palavra, moldura ou sombra nos inserts, som de efeito.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** quase nenhuma, de propósito. Tudo é corte seco. O movimento mora **dentro** do material: a câmera percorre a captura sem parar (rola e aproxima devagar), o cursor desliza até o que a pessoa nomeia, na palavra, e clica (anel branco de 0,5 s), a foto aproxima ~14% ao longo do trecho. A pessoa nunca anima.
- **Organização e hierarquia:** três layouts. Split: insert de y 0 a 845 (44%), faixa verde centrada na emenda, pessoa de y 845 até a base com a cabeça 140 px abaixo da emenda. Cheio: insert 100%. Eu: pessoa em tela cheia, zoom 1,3. A legenda fica sempre em y 1536 (80%).
- **Tipografia:** a legenda é **Bebas Neue** (display condensada, vem do Google Fonts, grátis), ~86 a 96 px, laranja-ouro `#F4A53C`, contorno `#3A1E08`. A faixa verde e os blocos usam Manrope (800 na faixa, texto branco).
- **Moldura da pessoa:** quadro cheio embaixo do insert, de borda a borda, cabeça inteira e centralizada, seguindo o rosto. Nunca coluna lateral nem janela.
- **Cores, textura e som:** o verde `#4CD137` da faixa é o único destaque (também nos blocos extras, em fundo verde-garrafa `#0B1714`). Nada sobre a pessoa: a cor do vídeo nunca muda. Sem som de efeito (só voz).

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB, que também faz as capturas de tela). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **o benefício em poucas palavras**: vai na faixa verde do gancho ("Venda mais com o seu site", "Crie apps de graça com IA"). Sem resposta, tire do próprio vídeo;
   - **o que aparece na tela de cima**: se ele tem gravações de tela ou prints próprios do assunto (peça para pôr em `public/tela/`), ou se você pode usar páginas públicas (você captura com `ferramentas/capturar.mjs`);
   - **a palavra-chave e a promessa da chamada final** ("comenta MESTRE que eu te mando o link"): se ele já falou na gravação, ela fica só na voz, em tela cheia. Se a gravação ainda não tem chamada, avise para regravar o final. Nunca vai texto de chamada na tela;
   - **o que ele quer mostrar como "resultado"** (uma arte, um print, uma grade): em `public/img/` ou `imagens/`.


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

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha branca é a emenda do split (y 845); a verde é o topo da cabeça no split; a azul é o queixo; a amarela é o centro da legenda (80%); a vermelha é o limite da interface do app. Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s e dê a cada trecho um **layout** (split, cheio ou eu) e um material:

- **Gancho (0 até o primeiro corte, 3 a 7 s):** `abertura` (a faixa verde com o benefício) + uma `imagem` metáfora em split.
- **Cada passo que ele mostra** vira uma `tela` (captura real, cursor na ordem da fala). Prefira split; use `cheio` quando a tela for a prova principal ou ele estiver só dizendo o que se vê.
- **Resultado:** uma `imagem` ou `tela` que fica por vários segundos enquanto ele reage.
- **Argumento direto e chamada final:** layout eu. O `cta` já é eu por padrão e não desenha nada na tela.
- **Formas que a gravação não resolve** (um número solto, uma lista de motivos, uma comparação): bloco universal no insert de cima (só em split). Use pouco: o Reel original não tem nenhum.

Um bloco só dura até a próxima ideia; a troca acontece **na palavra que nomeia o novo material**.

### 6b. Capturas e imagens

1. Liste as páginas que provam o que a pessoa diz (uma por cena). Para ficar legível em split, a captura precisa de largura ~1280 (`--largura 1280`); em `cheio` a captura tem que cobrir o quadro todo: com `proporcao` baixa (página curta), use `zoom` ≥ 1920 ÷ (1080 × proporcao). Prefira páginas reais e públicas do assunto: documentação oficial, a página do produto, uma tabela, uma matéria. Material do usuário em `public/tela/` passa na frente.
2. Capture cada uma:

```bash
node ferramentas/capturar.mjs "https://…" <nome> [--clicar "texto do botão"] [--altura 1000] [--max 5200]
```

   Grava `public/tela/<nome>.jpg` (página inteira, 2× de resolução, sem interface do navegador) e imprime a **proporção altura ÷ largura**. `--clicar` abre acordeões e abas pelo texto do botão antes da captura (para mostrar o item que a pessoa cita). Print ou gravação do próprio usuário: ponha o arquivo `.jpg` em `public/tela/`; a proporção é altura ÷ largura em pixels (`ffprobe -v error -show_entries stream=width,height -of csv=p=0 arquivo`).
3. Olhe cada captura reduzida (`sips -Z 900` no Mac, ou `ffmpeg -i x.jpg -vf scale=900:-1 pequena.jpg`) e **meça onde está o que a pessoa cita**, em frações da captura inteira (0 = topo/esquerda, 1 = base/direita). É com essas frações que você escreve a câmera e o cursor. Recorte a região para conferir (um `crop` com Pillow ou `ffmpeg -vf crop`).
4. **Nada de interface desenhada à mão**: a tela é sempre uma captura real. Nada de "Remotion" aparecendo em nenhuma captura.

Para o **gancho**, e para qualquer arte de resultado, use o guia `references/imagens.md` (`node scripts/imagens.mjs`: só fontes grátis; olhe a folha uma vez, escolha com `--escolher` e marque o foco). Imagem errada é pior que uma gravação de tela: se nada servir, comece com a tela. Cada imagem entra num momento `imagem` (`"imagem": { "id": "saida" }`).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada momento ganha `layout` quando não for o padrão (`tela`/`imagem`: split; `cta`: eu). Deixe `"sfx": false`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). O aviso "três `tela` seguidos" é esperado neste modelo: ignore-o. Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda do motor (o modelo as divide em pedaços de 2 a 3 palavras).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "Shift + S": "Shift+S" }`).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- a faixa verde está inteira, centrada na emenda, em duas linhas, e some no primeiro corte de layout;
- cada troca de layout cai na palavra que nomeia o novo material;
- no layout eu a cabeça está inteira e a legenda continua na mesma altura;
- a tela mostra **o que a pessoa está dizendo** naquele instante e o texto da captura está legível (se não, aumente o `zoom` final);
- o cursor está em cima do item citado quando ele é dito, e o clique cai na palavra;
- no split a cabeça está inteira, abaixo da faixa verde, e a legenda não encosta no queixo;
- nenhuma cena para: compare dois quadros da mesma `tela` (início e fim); a câmera precisa ter andado.

Gere quadros em volta de cada corte (`node scripts/stills.mjs 7.1 7.3 7.5`) para ver que a troca é seca. Corrija o plano (outra fração, mais zoom, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-demo.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (quantas pausas viraram corte);
- o **mapa resumido** (que cena e que captura entrou em cada trecho);
- de onde vieram as capturas (endereços das páginas ou arquivos do usuário);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma captura que ele pode trocar por uma gravação própria).

## Ritmo e cortes

- **Fala corrida: toda pausa sai.** Use o `preparar` e o `justar` (`node ferramentas/justar.mjs --respiro 0.2`): o respiro entre frases fica entre 0,2 e 0,4 s (nunca mais). Corte pelas pausas reais, nunca pelos tempos das palavras (o Whisper estica o começo das frases para dentro do silêncio: meça com `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`).
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora do vídeo. **O que fica:** pausa curta de vírgula, gesto e sorriso.
- **O corte que se vê é o do layout**, não o da fala: faça o corte de fala coincidir com a troca de insert sempre que der, para o jump cut não aparecer.
- **Só corte seco.** Nada de transição, filtro, LUT ou mudança na cor da pessoa. Sem zoom animado: a câmera da pessoa só muda com o layout.
- **Cada layout dura de 3 a 17 s** (média ~8 s) e troca entre frases, na palavra que nomeia o material.
- **O vídeo termina na última palavra.** Sem tela final.

## Blocos deste modelo

O insert de cima mostra o momento atual e troca **em corte seco**. `tela` e `imagem` são o padrão; os blocos universais só entram quando a fala tem uma forma que a gravação não resolve (em split).

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (1)** | `tela` | gravação de tela real: captura de página (`captura`, `proporcao`), câmera que anda de `ini` a `fim` e `cursor` com pontos nas palavras ditas (`clique: true` desenha o toque). Em `split` (padrão) ou `cheio` |
| **assinatura (2)** | `abertura` | a faixa verde na emenda do split, benefício em duas linhas, só no gancho |
| imagem | `imagem` | foto ou arte no insert (split ou cheio), aproximação lenta, corte seco |
| lista | `topicos` | no insert, fundo verde-garrafa, linhas brancas que entram na fala, marcador verde na da vez |
| passos | `passos` | a mesma lista com números e um fio que desce |
| número | `numero` | o número contando em pt-BR, enorme, com o `rotulo` embaixo |
| comparação | `comparacao` | duas metades do insert, cada uma no seu `em` |
| gráfico | `grafico` | barras, linha ou rosca desenhadas na fala |
| destaque | `destaque` | a palavra-chave grande, com ícone de traço |
| definição | `definicao` | o termo em 800 e o significado linha a linha |
| frase | `frase` | a frase em tipo grande, palavra por palavra (a legenda some) |
| pergunta | `pergunta` | a pergunta e as `opcoes` em linhas (a legenda some) |
| fechamento | `cta` | **layout eu, sem nada na tela**: a pessoa em tela cheia, mais fechada, e a legenda; a chamada é só voz |

## A assinatura em qualquer assunto

A assinatura é **"o material na hora em que é nomeado"**: a pessoa fala corrida e, na palavra exata, o insert troca para a coisa de verdade (a página, o app, a arte), com cursor mostrando; quando o argumento é dela, o insert some e ela vem para perto.

1. **Finanças/cripto.** "O Bitcoin passou de 100 mil. Olha o gráfico nesse site: aqui o preço, aqui o volume. E o melhor, você acompanha de graça."
   Faixa "Acompanhe o Bitcoin de graça". Gancho: imagem de moeda física (busca "bitcoin coin") ou o site. `tela` split na página pública de cotação com o cursor no preço, depois no volume; "e o melhor, de graça" em layout eu.
2. **Saúde/rotina.** "Dormir bem muda tudo. Nesse aplicativo eu vejo meu sono por noite, e aqui a média da semana."
   Faixa "Durma melhor em 7 dias" (só se ele disse). `tela` split no site do aplicativo, cursor na tela de sono; resultado numa `imagem` parada enquanto ele reage.
3. **História pessoal/carreira.** "Esse foi o primeiro site que eu fiz. Hoje ele está assim. E o que eu aprendi foi isso."
   Faixa "Do primeiro site ao atual". `imagem` do print antigo (do usuário) em split, `tela` cheia da página de hoje com rolagem, depois layout eu para o aprendizado.

## Fidelidade

- Tudo na tela vem da fala; a faixa verde resume o benefício com as palavras dele.
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
- **A captura em tela cheia aparece com borda branca**: a captura é baixa demais para cobrir 1080×1920; aumente o `zoom` do `ini` e do `fim` (≥ 1920 ÷ (1080 × `proporcao`)).
- **A imagem do gancho ficou ruim**: `node scripts/imagens.mjs --refazer <id> --busca "outro termo em inglês"`; se nada serve, use uma `tela` no gancho em vez da imagem.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
