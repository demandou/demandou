---
name: modelo-tese
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Tese, o Reel de opinião viral sem pacote gráfico: tela dividida do primeiro ao último quadro (a informação inserida na faixa de cima, 45% da altura, e a pessoa bem centralizada embaixo, sempre com o rosto à vista, inclusive no gancho), rosto fechado em tela cheia só nas viradas, fala corrida sem respiro e legenda minúscula branca com contorno abaixo do queixo. Serve para qualquer assunto (notícia, opinião, finanças, saúde, tecnologia, histórias): a IA organiza a fala em gancho, tese, prova, explicação, clímax e chamada para seguir, busca as imagens e traduz o resto para os blocos do estilo. Use sempre que o usuário pedir \"modelo Tese\", \"estilo Tese\", \"Reel de opinião\", \"edição de notícia com imagem em cima\", \"tela dividida com imagem no topo\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Tese

O vídeo vira um Reel de opinião noticioso, em tela dividida do começo ao fim: em cima, numa faixa de 45% da altura (y 0 a 864), a prova (a imagem do que ele cita, ou o texto); embaixo, ele, bem centralizado, com a legenda minúscula abaixo do queixo. O rosto está na tela desde o primeiro quadro, e nas viradas e perguntas diretas a edição corta para ele em tela cheia. A fala corre sem ar. Não há título, logo, caixa, B-roll em tela cheia nem efeito: só o corte seco e a legenda. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de diretor de corte: o argumento, o que vira imagem, onde entra o rosto fechado.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com ciência ("Por que o céu é azul?"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** corte seco e mais nada. O vídeo é split o tempo todo; o que muda é o que está em cima (imagem ↔ texto ↔ outra imagem) e, nas viradas, o rosto fechado em tela cheia (~2 s). A inserção entra **na palavra que a nomeia** (±0,15 s), mostra literalmente o que está sendo dito e fica a frase inteira; troca a cada frase. Imagem parada ganha um push-in lento de ~6%; o rosto nunca tem zoom animado (o enquadramento muda no corte). Sem transição, filtro, tremor ou som de efeito.
- **Organização e hierarquia:** a faixa de cima (y 0 a 864, 45% da altura) é só da informação inserida; o resto (y 864 a 1920) é da pessoa, bem centralizada, cabeça inteira com folga, rosto em ~38% da largura. A legenda é a única constante, abaixo do queixo. Em tela cheia, o rosto ocupa ~70% da largura.
- **Margem segura:** nenhum texto, rótulo ou cartão importante encosta nas laterais (margem ≥ 64 px de cada lado), o texto de topo começa em y ≥ 120 e nada importante fica abaixo de y 1700 (interface do app). Texto sempre cabe na caixa dele: o template mede, reduz a fonte ou quebra a linha.
- **Tipografia:** Onest, branca. Legenda: minúscula, 700, ~56 px, 2 a 4 palavras por quadro, contorno preto fino, sem caixa, centro em x 50% e y 1610 em qualquer enquadramento. Textos de bloco: 500 a 800, grandes (ocupam o palco de cima).
- **Moldura da pessoa:** a mesma câmera reenquadrada: no split ela ocupa 1080×1056 (rosto bem no centro, cabeça inteira com folga), no fechado a tela toda; sempre seguindo o rosto (rastreio quadro a quadro). Nunca janela, nunca coluna.
- **Cores, textura e som:** a cor do vídeo da pessoa nunca muda. O palco de texto é quase preto (`#0C0B12`) com texto branco; **sem cor de destaque**. Imagens **preenchem** a moldura (nunca faixa preta nem fundo desfocado). Sem efeito sonoro.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; e a busca de imagens). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **se ele tem imagens próprias** para entrar no vídeo (o produto, prints, vídeos que ele quer provar, fotos). Se tiver, peça para pôr na pasta `imagens/` do projeto (criada no passo 1), com nomes que digam o que são. Elas passam na frente de qualquer busca;
   - **se o vídeo termina pedindo para seguir ou com palavra-chave** ("comenta X que eu te mando…"): qual palavra e qual promessa. O Reel original termina pedindo para seguir, ligado à tese. Sem resposta, feche com um `cta` de seguir.
   Este modelo não tem tarja de nome: não pergunte nome nem área.
## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela. Crie também a pasta `imagens/` lá dentro (para as imagens do usuário).

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

Depois de escolher, deixe os cortes justos (nesta fala corrida, use o respiro curto):

```bash
node ferramentas/justar.mjs --respiro 0.2
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

Gera três quadros com guias: a linha azul é a base da faixa de cima (45% da altura, y 864), a verde marca a margem segura (laterais a 64 px, topo a 120) e a vermelha o rodapé do app (y 1700); a amarela é o centro da legenda (y 1610). O rosto tem que ficar inteiro e centrado na área de baixo no split e no centro (linha azul vertical) no rosto fechado. Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Na Tese a pergunta é: **qual é o argumento e o que mostrar em cima a cada frase?** O Reel tem cinco blocos:

1. **Gancho (0 a 3 s):** já em split, com o rosto à vista desde o primeiro quadro. Em cima, o texto do gancho (`abertura`) ou a imagem do objeto da história. Frase curta com superlativo e objeto; a segunda frase vira o ângulo real (a tese).
2. **Tese (até ~13 s):** `cena` com a prova em cima. Uma objeção do público ou do cético pode ficar entre aspas (`correcoes`) com a prova em cima enquanto ele fala.
3. **Prova e explicação:** imagens que provam, `comparacao`, `topicos`, `passos`, `numero`, `definicao` na faixa de cima. **Lista de 4 itens fica sob UMA imagem contínua de 7 a 8 s**, não uma imagem por item.
4. **Virada e pergunta direta:** `fechado` (~2 s) na frase que muda o sentido ("o mais louco é o motivo disso") e na pergunta ao espectador.
5. **Clímax e chamada:** a frase mais forte numa imagem única de ~6 s; o fecho com `cta` de seguir ligado à tese. Só falado ou texto simples; sem @ nem emoji.

**Regra do layout:** `fechado` = rosto em tela cheia; **todo o resto** (`cena`, blocos de texto, tempo sem momento) = split. O vídeo começa em split. Não use B-roll em tela cheia. Varie o que está em cima (imagem, texto, outra imagem) e nunca ponha duas vezes a mesma imagem seguidas.

**Timing:** cada inserção entra na palavra que a nomeia. Ponha o `de` da `cena` no início dessa palavra (`work/palavras.json`), não no corte. O trecho anterior pode se estender até lá (o `ate` do momento anterior não precisa cair num corte).

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (objeto, lugar, ferramenta, situação, tipo de pessoa). Escreva `work/imagens.json`: `id`, `em`, `palavra`, `busca` (inglês, concreto: "interview desk two people", "shipping box"), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - **Antes de buscar, confira a resposta do usuário sobre imagens próprias.** Produto, lugar, prints, antes e depois: só ele tem. Se a pasta ainda estiver vazia, pergunte de novo uma vez, dizendo o nome sugerido de cada arquivo.
   - Nada de pessoa famosa nem marca na busca: peça ao usuário. Print, só o real.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo, marca ou texto grande. **A imagem preenche a faixa de cima (1080×864, quase quadrada, proporção 5:4): prefira foto deitada ou quadrada com o assunto reconhecível no centro e marque o `--foco` no assunto; foto em pé é cortada em cima e embaixo.** Imagem conceitual (ilustração de IA) é bem-vinda quando é a metáfora da frase; imagem errada é pior que um cartão.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`. Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (a cena mostra a palavra num cartão: **cartão é melhor que imagem errada**).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "ceu" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (campos, limites de texto e regras de tempo) e preencha `src/plano.json`: `momentos`, `semLegenda` e `correcoes` (`marca` fica vazia).

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/conferir-tempo.mjs`: compara o `em` e a entrada de cada inserção com o tempo da palavra em `palavras.json` e lista os desvios; corrija até dar **Timing OK** (±0,15 s);
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes`. A legenda sai toda em minúsculas por conta do estilo.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida à largura de um celular (~360 a 540 px)** e confira:
- o rosto está à vista desde o primeiro quadro, centralizado, e nunca coberto;
- a faixa de cima ocupa 45% da altura (y 0 a 864), e a imagem preenche a moldura (sem faixa preta);
- nenhum texto encosta nas laterais (≥ 64 px), o texto de topo começa em y ≥ 120, nada importante abaixo de y 1700;
- o texto cabe na caixa dele (nenhuma letra extrapola);
- em cada entrada de inserção, **1 quadro** mostra literalmente o que está sendo dito;
- a legenda está no mesmo lugar em todos os quadros, abaixo do queixo, sem juntar duas frases;
- nenhum palco de texto vazio esperando o primeiro item;
- nenhum quadro com dois textos um sobre o outro nas trocas (`node scripts/stills.mjs 7.1 7.15 7.2`).

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-tese.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (layout e imagem de cada trecho);
- de onde vieram as imagens e o texto de `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que ele pode trocar por uma própria).

## Ritmo e cortes (cortar como editor)

- **Fala corrida, quase sem ar (~200 palavras por minuto).** Toda pausa sai: o respiro entre os cortes fica entre 0,2 e 0,4 s. Rode `node ferramentas/justar.mjs --respiro 0.2` depois de marcar as tomadas. A primeira palavra sai em até 0,1 s: corte o começo até ali e comece o vídeo já em split com o rosto à vista (sem intro, sem logo).
- **Corte pelas pausas reais, nunca pelos tempos das palavras.** O `preparar` acha as pausas pelo áudio e o `justar` parte delas. Para medir à mão: `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`.
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora do vídeo. Pausa de vírgula fica só se tiver menos de 0,3 s.
- **A inserção entra na palavra que a nomeia (±0,15 s) e fica a frase inteira (3 a 8 s);** muda a cada frase. O corte para o rosto fechado cai numa pausa ou no fim de frase.
- **Rosto fechado só na virada e na pergunta direta** (~2 s cada, no máximo 3). O resto do vídeo é split; segmentos de 1 a 8 s, média ~4 s.
- **O vídeo termina na última palavra**, sem tela final.

## Blocos deste modelo

Os blocos de texto ocupam a **faixa de cima** (45% da altura, y 0 a 864; palco quase preto, texto branco, corte seco, dentro da margem segura) com a pessoa embaixo: são o layout split.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (imagem)** | `cena` | a imagem do que é citado na faixa de cima, preenchendo a moldura (1080×864); entra na palavra que a nomeia; push-in lento de ~6%; sem imagem, cartão com a palavra |
| **assinatura (rosto)** | `fechado` | a pessoa em tela cheia, rosto grande (~70% da largura); só na virada e na pergunta direta |
| abertura | `abertura` | o gancho em texto grande no palco de cima, palavra por palavra; `destaque` sublinhado |
| lista | `topicos` | linhas grandes no palco; a da vez em branco, as outras em cinza |
| passos | `passos` | o mesmo palco com etapas numeradas ligadas por um fio |
| número | `numero` | o número enorme contando em pt-BR, `rotulo` ao lado, `titulo` pequeno em cima |
| comparação | `comparacao` | duas colunas no palco; o vencedor fica aceso, o outro apaga |
| gráfico | `grafico` | barras, linha ou rosca em branco e cinza; sem números ditos, curva com a etiqueta "ilustrativo" |
| destaque | `destaque` | a palavra-chave enorme; `alerta` = caixa branca sólida com texto escuro |
| definição | `definicao` | o termo grande, um traço e o significado linha a linha |
| frase | `frase` | a fala palavra por palavra no palco; `risco` riscado quando dito |
| pergunta | `pergunta` | a pergunta palavra por palavra e as `opcoes` em linhas |
| fechamento | `cta` | quadrado branco com o ícone (seguir, salvar, comentar, link) e a chamada |

## A assinatura em qualquer assunto

A assinatura representa **"a prova ao lado de quem fala"**: a imagem ou o dado em cima, o apresentador embaixo, e o olho no olho (rosto fechado) na virada. Cada um tem uma função, não um assunto.

1. **Finanças/cripto.** "Essa é uma das coisas mais loucas que eu vi no mercado. O problema não é o golpe, é quem acredita nele."
   `abertura` no topo com a frase do gancho; `cena` com a imagem da corretora ou da moeda (`tipo: "foto"`) na palavra que a nomeia; `cena` com o gráfico real do preço na segunda frase; `fechado` em "o problema é quem acredita"; `cta` de seguir ligado à tese.
2. **Saúde (sono).** "Todo mundo diz para dormir oito horas. Só que o mais importante é outra coisa: a hora em que você dorme."
   `cena` com um quarto à noite em cima; `topicos` com três hábitos no palco de cima; `fechado` em "outra coisa"; `numero` 23 com `sufixo: "h"` em "a hora em que você dorme".
3. **História pessoal / carreira.** "Fui demitido numa terça. Pensei que era o fim, mas foi a melhor coisa que me aconteceu."
   `cena` com a foto do usuário (de `imagens/`) no gancho; `fechado` em "mas foi a melhor coisa"; `frase` com a linha mais forte; fecha em split com `cta` de seguir.

Outros nichos: notícia de tecnologia (o print real em cima na palavra citada), receita (o prato pronto no gancho, cada etapa em `passos`), vendas (o produto do usuário vem de `imagens/`; o preço dito, um `numero`).

## O DNA deste formato

Estas são as regras do Reel original, reescritas para você aplicar a qualquer vídeo:

1. A primeira palavra sai em até 0,05 s e o primeiro quadro já é o layout final: tela dividida com o rosto à vista (revisão do Tiago: o gancho sempre mostra o apresentador; nada de abrir com B-roll em tela cheia).
2. O gancho é um superlativo mais o objeto em até 2,5 s ("isso é uma das coisas mais loucas que eu já vi com…"); a segunda frase vira o ângulo, a tese real.
3. O vídeo é tela dividida do começo ao fim; o que muda é o que está em cima (imagem ↔ texto ↔ outra imagem) e, nas viradas, o rosto fechado em tela cheia. Segmentos de 1 a 8 s, média ~4 s.
4. A faixa de cima ocupa 45% da altura (1080×864, y 0 a 864, sem divisória nem borda) e só tem a informação inserida; o resto é da pessoa, bem centralizada (cabeça inteira com folga, rosto em ~38% da largura), com a legenda abaixo do queixo.
5. O rosto fechado em tela cheia (~70% da largura) só nos momentos de virada e de pergunta direta, ~2 s cada.
6. A inserção entra na palavra que a nomeia (±0,15 s) e mostra literalmente o que é dito; fica a frase inteira (3 a 8 s); muda a cada frase; lista de 4 itens fica sob UMA imagem contínua. O corte para o rosto fechado cai numa pausa ou no fim de frase.
7. Legenda palavra a palavra: 2 a 4 palavras, minúscula, sans bold branca com contorno preto fino, sem caixa, ~56 px, centrada, y = 83 a 84%, igual em todos os layouts, troca em corte seco, pontuação mantida, escrita coloquial.
8. Cite a objeção do público ou do cético entre aspas na legenda e mostre a prova em cima enquanto a pessoa fala a objeção.
9. Prove com material real (print, gravação de tela, busca, resultado) na faixa de cima, preenchendo a moldura. Imagens do usuário em `imagens/` passam na frente de qualquer busca.
10. Imagens estáticas ganham push-in lento de 5 a 8%; sem mexer na luz, sem filtro.
11. Estrutura em cinco blocos: gancho (0 a 3 s), tese (3 a 13), prova (13 a 31), explicação em lista (31 a 52), clímax e chamada (52 a 65). A frase mais forte vai em ~6 s sob uma imagem única antes da chamada.
12. A chamada é para seguir, ligada à tese ("pensar com a própria cabeça"), só falada, 6 a 7 s, em split, com a pessoa apontando para si. Sem "comenta", sem @, sem emoji, sem texto de CTA fora do bloco; se o usuário pedir palavra-chave, use o bloco `cta`.
13. Gestos de mão e rosto sorrindo (não sério) quebram o clima pesado; roupa de cor viva contra fundo escuro separa a pessoa da imagem de cima (isso vem da gravação, não da edição).
14. Sem pausa nem respiro: ~200 palavras por minuto; o corte remove o ar entre frases.

**O que este formato não tem (não acrescente):** título, rótulo, logo, @, barra, emoji; cor de destaque na legenda; zoom animado no rosto; transição entre cortes; cartões ou prints pequenos flutuando (a inserção sempre preenche a faixa de cima); B-roll em tela cheia; faixa preta ou fundo desfocado ao redor da imagem; texto fora da margem segura; efeitos sonoros e tremor; divisória entre a faixa de cima e a pessoa.

## Fidelidade

- Tudo na tela vem da fala; os textos de bloco podem resumir com as palavras dela, sem mudar o sentido.
- A imagem mostra **o que foi dito**, não uma interpretação. Na dúvida, cartão com a palavra.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- Sem marca e sem pessoa famosa nas buscas; print, só o real que o usuário mandar.


## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **`conferir-tempo.mjs` mostrou desvio**: mova o `de` da `cena` (e o `em` dos itens) para o início da palavra que a nomeia em `work/palavras.json`.
- **A pessoa fica pequena, fora do centro ou o rosto cortado no split**: refaça o passo 4 com `--rosto-y` e `--queixo-y` medidos de novo; o enquadramento é calculado pela largura do rosto.
- **A imagem ficou cortada no assunto**: a faixa é larga e baixa; marque o `--foco` no assunto ou troque por foto deitada (`--refazer`).
- **A fala ainda tem pausas longas**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode `justar.mjs --respiro 0.2` de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: `node ferramentas/justar.mjs --respiro 0.22` ou afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **A legenda emenda duas frases**: corrija com `correcoes` (frase terminando em ponto).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
