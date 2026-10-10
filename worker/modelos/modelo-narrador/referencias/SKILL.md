---
name: modelo-narrador
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Narrador: a voz conta a história e imagens em tela cheia, com aproximação ou panorâmica lenta, carregam de 50% a 70% do vídeo; datas e lugares entram como letreiros em serifa, rótulos de museu nomeiam cada imagem e a pessoa volta em quadro cheio nas frases-chave. Documentário sóbrio: noite azulada, marfim e um destaque vermelhão, sem mexer na cor do vídeo. Serve para qualquer assunto (curiosidades, história de marca, biografia, ciência, finanças, viagens): a IA lista o que a fala cita, busca ou pede as imagens e traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Narrador\", \"estilo documentário\", \"narração com imagens\", \"conta a história com fotos\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Narrador

O vídeo vira um mini-documentário: a pessoa abre falando para a câmera e, a partir daí, a voz continua enquanto fotos e gravuras tomam a tela, andando devagar (aproximam, correm ou se afastam). Quando a fala cita uma data ou um lugar, ele aparece como letreiro ("Paris, 1889"); cada imagem leva um rótulo discreto de museu. A pessoa volta em quadro cheio nas frases que pesam: a virada, a conclusão. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (as tomadas, o ritmo, o que vira imagem, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com "A Torre Eiffel era pra ter sido desmontada", mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a história corre nas imagens. Cada cena entra por dissolve de 0,3 s (ou corte seco, ou uma cortina que varre da esquerda), anda o tempo todo em ~3% por segundo (aproximar, panorâmica, afastar, alternando) e se dissolve na seguinte; na volta para a pessoa a foto se desfaz. O rótulo desliza da esquerda (0,45 s); o letreiro cresce linha a linha na hora em que a data ou o lugar é dito. A pessoa reenquadra em toda volta e em todo corte (1,0 / 1,12 / 1,25, nunca repetindo), seguindo o rosto. Nada treme, gira, pisca ou troca de cor.
- **Organização e hierarquia:** a imagem é a protagonista (tela cheia, com um véu leve só em cima e embaixo da foto). Letreiro no alto, em serifa grande, com o contexto em versalete pequeno acima; rótulo de museu no alto à esquerda; legenda numa faixa fixa abaixo do queixo, na mesma altura sobre a pessoa e sobre as imagens. Textos sobre a pessoa (abertura, destaque, frase, pergunta, fechamento) ficam entre o queixo e a interface e substituem a legenda.
- **Tipografia:** Playfair Display (serifa) nos letreiros, aberturas, destaques e citações; Figtree na legenda, nos rótulos e nas pranchas. Legenda 42–58 px; letreiro até ~120 px; rótulos 27 px em versalete com espaçamento; nada abaixo de 24 px. Texto medido com a fonte real, diminui para caber.
- **Moldura da pessoa:** quadro cheio, sempre montado (é dela que vem a voz); as imagens cobrem a pessoa por inteiro e ela volta cheia. Nunca janela, nunca coluna.
- **Cores, textura e som:** noite azulada `#0E1319` (pranchas e véu), marfim `#F2ECE1` (texto), e **um** destaque vermelhão `#E8603C` (traço do letreiro, palavra-chave, número). **Nunca** filtro, LUT, vinheta, brilho ou desfoque sobre a pessoa. Som: uma passagem tonal baixa quando a primeira imagem de um bloco entra (`"sfx": false` desliga); mais nada.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; e a busca de imagens). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **nome e área** de quem fala (vão na tarja discreta do começo; sem resposta, siga sem tarja);
   - **se ele tem imagens próprias** para entrar no vídeo (o produto, o lugar, prints, antes e depois, fotos dele). Se tiver, peça para pôr na pasta `imagens/` do projeto (criada no passo 1), com nomes que digam o que são (`prensa.jpg`, `print-comentario.png`). Elas passam na frente de qualquer busca.

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

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha azul é o queixo no zoom mais fechado; a verde é onde começam os textos sobre a pessoa; a amarela, onde a legenda começa; a roxa, a altura dos letreiros no alto; nada importante abaixo da linha vermelha (interface do aplicativo) nem na faixa vermelha da direita (botões). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s e dê a cada uma uma forma e um bloco **deste modelo** (tabela "Blocos deste modelo", abaixo). A pergunta de cada batida no Narrador é: **a fala descreve algo que dá para mostrar?** Se sim, é uma `cena` (a assinatura); se cita data, lugar ou nome de capítulo, a cena ganha um `letreiro`. Se é a virada ou a conclusão, a pessoa volta cheia (`destaque`, `frase`). Número, lista, passos e comparação viram `prancha` sobre a cena que estiver por baixo.

Meta: 50% a 70% do tempo em imagem; cenas de ~1,5 a 3,5 s; a pessoa abre (`abertura`, gancho) e fecha (`destaque`, `frase`, `pergunta` ou `cta`); algo novo na tela a cada ~3 a 4 s.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (objeto, comida, lugar, ferramenta, situação, tipo de pessoa; uma a cada ~3 a 5 s, e cada uma ocupa a tela inteira; nunca duas na mesma frase). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "takeaway coffee cup", "french press coffee", "meal prep containers"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - **Antes de buscar, confira a resposta do usuário sobre imagens próprias** (passo 3 de "Antes de começar"). Produto dele, o lugar dele, prints, antes e depois: só ele tem. Liste o que você acha que deveria vir dele e, se a pasta ainda estiver vazia, pergunte de novo uma vez, dizendo o nome sugerido de cada arquivo.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo, marca ou texto grande; foto de verdade quando é foto; **a tela é sempre cheia**: prefira foto em pé ou deitada de ≥ 1600 px de lado maior (a câmera anda por ela). Para história, prefira o acervo público (Wikimedia Commons, domínio público, é uma das fontes do `imagens.mjs`: use buscas com o nome e o ano, em inglês), com gravuras e fotos de época; foto de época em preto e branco é bem-vinda, a cor dela é da imagem, nunca do vídeo da pessoa.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira; as linhas da folha marcam 0,25 / 0,5 / 0,75). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (a cena vira um cartão escuro com a palavra em serifa: **cartão é melhor que imagem errada**).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "construcao" }` (o efeito alterna sozinho entre aproximar, panorâmica e afastar; mande `efeito` só se quiser outro). Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser mandar na câmera, `camera`. Imagem, letreiro e pessoa precisam se revezar: escreva as cenas primeiro (a história), depois os letreiros nas datas e lugares ditos, depois os textos sobre a pessoa nas frases-chave.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "500 reais": "R$ 500" }`). Frase sem ponto no fim que emenda com a próxima na legenda: corrija com as duas últimas palavras (`{ "nem abria": "nem abria." }`); nunca uma palavra comum sozinha (`"uma"` mudaria todas). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- **o rosto nunca está coberto** (nem em zoom 1,25; letreiros e frases ficam no alto ou abaixo do queixo) e a legenda não encosta no rótulo nem no letreiro;
- a imagem certa aparece quando a palavra é dita, com o assunto inteiro (o foco certo);
- a tarja da legenda está na palavra que está sendo dita; nenhuma frase emenda com a seguinte;
- o texto cabe (nada cortado), nada abaixo da linha da interface nem na faixa dos botões;
- nada parado mais de ~4 s (cenas se movem sempre; a prancha lisa só com ≤ 3 s); nenhum quadro com dois textos um sobre o outro nas trocas. Gere quadros a cada 0,05 s em volta de cada entrada e saída (`node scripts/stills.mjs 7.1 7.15 7.2 7.3 8.55 8.6 8.65`).

Corrija o plano (texto mais curto, outro lado, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-narrador.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (quantas pausas viraram corte);
- o **mapa resumido** (que bloco e que imagem entrou em cada trecho);
- de onde vieram as imagens (pasta do usuário ou busca) e o texto de `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que ele pode trocar por uma própria).

## Ritmo e cortes (cortar como editor)

- **Corte pelas pausas reais, nunca pelos tempos das palavras.** O Whisper estica o começo de algumas frases para dentro do silêncio; o `preparar` acha as pausas pelo áudio e o `justar` parte delas. Se precisar ajustar à mão, meça o silêncio com `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`.
- **Respiro de 0,1 a 0,2 s em cada corte** (0,06 s antes da fala, o resto depois). Menos que isso a fala fica robótica e come consoantes; mais que isso parece pausa.
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada no meio, comentário fora do vídeo. **O que fica:** pausa curta de vírgula (o `justar` deixa), uma pausa dramática antes de um número ou de uma revelação (marque à mão um respiro maior nesse corte), risada curta que faz parte da fala.
- **Cada corte troca o enquadramento** (o template faz sozinho: 1,0 → 1,12 → 1,25…, nunca repete). É isso que esconde o pulo do corte. A volta de uma imagem em tela cheia também troca.
- **Ênfase:** num trecho importante sem corte, use `camera` com `aproximar: true` (aproximação lenta) ou, uma ou duas vezes no vídeo, um "soco" de câmera na palavra (`{ "em": 3.18, "zoom": 1.12 }`). Mais que isso cansa.
- **Ritmo das cenas (a regra do Narrador):** de 50% a 70% do tempo é imagem em tela cheia, em cenas de ~1,5 a 3,5 s (nunca uma imagem parada além de 4 s: troque ou dissolva na seguinte). A pessoa volta em quadro cheio nas frases-chave: a abertura, a virada, a conclusão. Nunca mais de ~4 s só com legenda sobre a pessoa. A volta da pessoa troca o enquadramento (1,0 / 1,12 / 1,25).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (imagem)** | `cena` | foto em tela cheia que anda devagar (aproximar, panorâmica, afastar), dissolve de 0,3 s; `rotulo` de museu no alto (quadradinho vermelhão + versalete); `transicao` `dissolver` / `corte` / `cortina`; `direcao` da panorâmica; legenda continua por cima. Sem imagem: cartão escuro com a palavra em serifa |
| **assinatura (data/lugar)** | `letreiro` | `texto` grande em serifa ("Paris, 1889") com traço vermelhão e `sub` pequeno em versalete acima ("Exposição Universal"); no alto, sobre a imagem ou sobre a pessoa; cada linha entra quando é dita |
| abertura | `abertura` | o gancho em serifa sobre a pessoa, palavra por palavra; o `destaque` em vermelhão; com `imagem`, sobre a foto |
| lista | `topicos` | prancha escura (ou a imagem escurecida): índice de museu, um item por linha, cada um no seu `em`, o da vez em marfim |
| passos | `passos` | etapas numeradas em itálico ligadas por um fio vertical que desce até a atual |
| número | `numero` | prancha com o número contando em pt-BR, `titulo` pequeno acima e `rotulo` embaixo |
| comparação | `comparacao` | dois lados, cada um no seu `em`; o vencedor em marfim e vermelhão, o outro apaga |
| gráfico | `grafico` | barras, linha ou pizza sobre a prancha; sem números ditos, curva com a etiqueta "ilustrativo" |
| destaque | `destaque` | sobre a pessoa: a frase-chave em serifa abaixo do queixo (`alerta` em vermelhão) |
| definição | `definicao` | prancha: o termo em serifa e o significado linha a linha |
| frase | `frase` | citação em itálico sobre a pessoa, palavra por palavra; `destaque` em vermelhão; `risco` riscado quando é dito |
| pergunta | `pergunta` | a pergunta sobre a pessoa e as `opcoes` como linhas |
| fechamento | `cta` | chamada com o ícone (seguir, salvar, comentar, link) sobre a pessoa |

## A assinatura em qualquer assunto

A `cena` com o `letreiro` representa **"o que a voz conta, mostrado como arquivo"**: toda fala que narra tem épocas, lugares, objetos e personagens. Quando a imagem exata não existe, mostre o contexto (a época, o lugar) e, em último caso, o cartão com a palavra. Nunca uma imagem que não é aquilo.

1. **Finanças/cripto.** "Em 2017 o Bitcoin passou de 20 mil dólares e, um ano depois, caiu para 3 mil."
   `letreiro` "2017" com `sub` "O primeiro auge" em "2017"; `numero` 20 mil em "20 mil"; `letreiro` "2018" em "um ano depois"; `cena` (cartão com a palavra "Bitcoin" ou foto de arquivo de mineração) por baixo; a pessoa volta com `destaque` `alerta` "caiu para 3 mil".
2. **Saúde/rotina.** "Os médicos descobriram o sono REM em 1953, numa universidade de Chicago."
   `cena` com a foto de época do laboratório (domínio público), `letreiro` "Chicago, 1953" com `sub` "Universidade", `definicao` de "sono REM" e a pessoa voltando cheia na frase de conclusão.
3. **Algo bem distante (história pessoal/de marca).** "Minha avó abriu a padaria em 1974, numa esquina de Recife, com um forno emprestado."
   As fotos são dela: o usuário põe em `imagens/` (`padaria-1974.jpg`); `letreiro` "Recife, 1974"; `cena` do forno; a pessoa volta cheia em "emprestado". Sem foto da família, cartão com o ano em serifa, nunca uma padaria qualquer.

Outros nichos: ciência (cada descoberta, uma cena com letreiro de ano e cientista), geografia e viagem (o lugar em tela cheia, o nome em letreiro), biografia (a linha do tempo em `passos`), marca (o produto do usuário vem de `imagens/`).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- A imagem mostra **o que foi dito**. Rótulo só descreve o que a imagem é de fato ("Gravura da torre, c. 1895"), nunca afirma o que a fala diz sem a imagem provar. Datas e nomes do letreiro são os da fala.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- Sem marca e sem pessoa famosa nas buscas; print, só o real que o usuário mandar. Se `creditos.txt` listar imagens que exigem crédito, entregue o texto para a legenda do post.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A fala ainda tem pausas longas no vídeo**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: aumente o respiro (`node ferramentas/justar.mjs --respiro 0.22`) ou, só naquele corte, afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **A tarja da legenda está uma palavra atrasada**: o tempo daquela palavra no Whisper está esticado; confira em `work/palavras.json` e corrija o `em` dela no `src/plano.json` (em `palavras`).
- **A imagem ficou mole em tela cheia**: era pequena; troque por uma maior (`--refazer`, fotos do Commons em 2400 px) ou use o cartão com a palavra.
- **O letreiro encostou na legenda ou no rosto**: encurte o `texto`/`sub`, ou ponha `legenda: false` no momento.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
