---
name: modelo-yap
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Yap: a pessoa em quadro cheio o vídeo inteiro, cortes justos nas pausas com reenquadramento em cada corte seguindo o rosto, legenda refinada logo abaixo do queixo com a palavra falada numa tarja suave, e inserções inteligentes (a imagem do que a pessoa cita num cartão ao lado do ombro, um chip de palavra-chave, um número que conta, de vez em quando um corte de 1 s para a imagem em tela cheia). Sóbrio e profissional: não mexe na cor do vídeo. Serve para qualquer assunto (o exemplo é economia doméstica, mas funciona com saúde, culinária, vendas, viagens, aulas): a IA lista o que a pessoa cita, busca ou pede as imagens e traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Yap\", \"estilo yap\", \"yap content\", \"só legenda e inserções\", \"corta as pausas e põe imagem quando eu falar de algo\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Yap

O vídeo vira um "yap" bem editado: a pessoa fala em quadro cheio o tempo todo, sem pausa morta, e a câmera muda de distância em cada corte. A legenda fica logo abaixo do queixo e a palavra que está sendo dita ganha uma tarja lima. Sempre que a pessoa cita algo concreto (um objeto, uma comida, um lugar, um serviço, um dado), a imagem disso entra num cartão claro na altura do peito, ao lado do ombro, nunca sobre o rosto. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (as tomadas, o ritmo dos cortes, o que vira imagem, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com economia doméstica ("Três coisas que parei de comprar"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a dinâmica vem do **ritmo de corte** e da **câmera**, não de efeito. Cada pausa vira um corte com 0,1 a 0,2 s de respiro; em cada corte o enquadramento troca entre 1,0, 1,12 e 1,22 (nunca o mesmo duas vezes), sempre seguindo o rosto; trechos longos aproximam devagar (no máximo ~6% em 2 s). Cartões entram por uma máscara que sobe (0,4 s), sem quique; a foto dentro deles aproxima devagar; a etiqueta com o nome se revela da esquerda quando a palavra é dita; a saída é curta (0,2 s). A tela cheia é um corte seco de ~1 s. Nada treme, gira, pisca ou troca de cor.
- **Organização e hierarquia:** três andares fixos. Em cima, o rosto (nunca coberto). Logo abaixo do queixo, a legenda (até 2 linhas). Na altura do peito, as inserções (cartão, chip, número, comparação, lista), alternando os lados do ombro. Uma inserção por vez; a legenda continua durante elas. Abertura, frase, pergunta e fechamento mostram a própria fala e entram no lugar da legenda.
- **Tipografia:** Plus Jakarta Sans. Legenda em 800, 44 a 62 px, branca com sombra discreta; a palavra dita em tinta grafite sobre a tarja lima. Números em 800 até 150 px; rótulos e etiquetas em 700, 34 a 42 px; nada abaixo de 24 px. O texto é medido com as larguras reais da fonte e diminui para caber, nunca vaza.
- **Moldura da pessoa:** quadro cheio o vídeo inteiro (o vídeo da pessoa nunca encolhe nem vira janela). O rosto fica na mesma altura em qualquer zoom; o reenquadramento só aproxima. Imagens em tela cheia cobrem a pessoa por ~1 s e voltam com outro zoom.
- **Cores, textura e som:** papel claro `#F7F6F2`, tinta grafite `#15171B`, cinza de apoio e **um** destaque lima `#D9F45F` (tarja da palavra, marcadores, traços). Cantos de 30 px e sombra discreta. **Nunca** filtro, LUT, vinheta, brilho ou desfoque sobre a pessoa. Som: um "vum" tonal baixo quando uma imagem entra (`"sfx": false` desliga); mais nada.

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

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha azul é o queixo no zoom mais fechado; a amarela é onde a legenda começa; a verde, onde os cartões começam; nada importante abaixo da linha vermelha (interface do aplicativo) nem na faixa vermelha da direita (botões). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s e dê a cada uma uma forma e um bloco **deste modelo** (tabela "Blocos deste modelo", abaixo). No Yap a pergunta principal de cada batida é: **a pessoa citou algo que dá para mostrar?** Se sim, é uma `insercao` (a assinatura). Se não, é um chip (`destaque`), um `numero`, uma `comparacao`, uma lista… ou um respiro só com legenda (até 4,5 s).

Meta: uma imagem a cada ~4 a 6 s nos trechos concretos, nunca duas na mesma frase; e algo novo na tela (inserção, chip ou reenquadramento) a cada ~4 a 6 s no vídeo todo. Abra com `abertura` (o gancho) e feche com `pergunta` ou `cta` quando a fala pedir.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (objeto, comida, lugar, ferramenta, situação, tipo de pessoa; uma a cada ~4 a 6 s; nunca duas na mesma frase). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "takeaway coffee cup", "french press coffee", "meal prep containers"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - **Antes de buscar, confira a resposta do usuário sobre imagens próprias** (passo 3 de "Antes de começar"). Produto dele, o lugar dele, prints, antes e depois: só ele tem. Liste o que você acha que deveria vir dele e, se a pasta ainda estiver vazia, pergunte de novo uma vez, dizendo o nome sugerido de cada arquivo.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo, marca ou texto grande; foto de verdade quando é foto; **em pé (retrato) para a tela cheia** — foto deitada pequena fica mole em tela cheia, use-a no cartão.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira; as linhas da folha marcam 0,25 / 0,5 / 0,75). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (o cartão mostra a palavra: **cartão é melhor que imagem errada**).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "prensa" }` (o efeito padrão é aproximar devagar). Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser mandar na câmera, `camera`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "500 reais": "R$ 500" }`). Frase sem ponto no fim que emenda com a próxima na legenda: corrija com as duas últimas palavras (`{ "nem abria": "nem abria." }`); nunca uma palavra comum sozinha (`"uma"` mudaria todas). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- **o rosto nunca está coberto** (nem em zoom 1,22) e o cartão fica abaixo da legenda, sem encostar nela;
- a imagem certa aparece quando a palavra é dita, com o assunto inteiro (o foco certo);
- a tarja da legenda está na palavra que está sendo dita; nenhuma frase emenda com a seguinte;
- o texto cabe (nada cortado), nada abaixo da linha da interface nem na faixa dos botões;
- nada parado mais de ~2,5 s dentro de um cartão; nenhum quadro com dois textos um sobre o outro nas trocas. Gere quadros a cada 0,05 s em volta de cada entrada e saída (`node scripts/stills.mjs 7.1 7.15 7.2 7.3 8.55 8.6 8.65`).

Corrija o plano (texto mais curto, outro lado, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-yap.mp4"
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
- **Cada corte troca o enquadramento** (o template faz sozinho: 1,0 → 1,12 → 1,22…, nunca repete). É isso que esconde o pulo do corte. A volta de uma imagem em tela cheia também troca.
- **Ênfase:** num trecho importante sem corte, use `camera` com `aproximar: true` (aproximação lenta) ou, uma ou duas vezes no vídeo, um "soco" de câmera na palavra (`{ "em": 3.18, "zoom": 1.12 }`). Mais que isso cansa.
- **Ritmo das inserções:** uma imagem a cada ~4 a 6 s quando a fala é concreta; respiros só com legenda entre elas (até 4,5 s). Tela cheia de vez em quando (uma a cada 15–20 s), de 0,8 a 1,2 s, sempre com foto em pé e nítida.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura** | `insercao` | a imagem do que é citado: cartão de foto (cantos de 30 px, sombra discreta) na altura do peito, ao lado do ombro (alterna dir/esq), entrando por máscara; a foto aproxima devagar; etiqueta clara com o nome (`rotulo`) e marcador lima (`etiqueta` "1", "2"…) quando é item de lista. `forma: "tela"` = corte de ~1 s para a foto em tela cheia, com a legenda por cima. Objeto 3D transparente vira adesivo; sem imagem, o cartão mostra a palavra |
| abertura | `abertura` | o gancho no lugar da legenda, maior (54 a 88 px), branco, palavra por palavra; o `destaque` ganha a tarja lima que cresce junto com as palavras |
| lista | `topicos` | cartão claro no peito; cada linha entra na fala com um marcador quadrado (lima no item da vez, cinza nos anteriores) |
| passos | `passos` | o mesmo cartão com marcadores numerados e um fio que desce até o passo da vez |
| número | `numero` | cartão claro com o número contando em pt-BR (até 150 px), um traço lima que se completa com a contagem, o `titulo` pequeno em cima e o `rotulo` embaixo |
| comparação | `comparacao` | dois cartões lado a lado no peito, cada um no seu `em` (rótulo pequeno + texto grande); um círculo lima com →, × ou ≠ entre eles; o vencedor ganha a faixa lima, o outro apaga (e é riscado em `errado-certo`) |
| gráfico | `grafico` | cartão claro: barras que crescem na fala (a da vez em lima), linha que se desenha com pontos lima, ou rosca; sem números ditos, uma curva com a etiqueta "ilustrativo" |
| destaque | `destaque` | o **chip de palavra-chave**: pílula clara com um quadradinho lima (`alerta` = pílula grafite); o `detalhe` entra numa etiqueta menor embaixo |
| definição | `definicao` | cartão claro: o termo em 800, um traço lima, o significado linha a linha |
| frase | `frase` | cartão claro largo no lugar da legenda, com uma barra lima à esquerda; a fala palavra por palavra; `destaque` na tarja lima; `risco` riscado quando é dito |
| pergunta | `pergunta` | cartão claro no lugar da legenda: a pergunta palavra por palavra e as `opcoes` como linhas, cada uma com miniatura redonda (`imagem`) ou letra |
| fechamento | `cta` | pílula clara com o ícone num círculo lima (seguir, salvar, comentar, link) e a chamada palavra por palavra |

## A assinatura em qualquer assunto

A `insercao` representa **"o que a pessoa está dizendo, mostrado"**: toda fala concreta tem coisas, lugares, gestos e situações. Quando a fala é abstrata, procure o exemplo dentro dela ("gastar com besteira" → a sacola de compras; "ansiedade à noite" → o celular aceso na cama) e, quando nem isso existe, use o cartão com a palavra (nunca uma imagem que não é aquilo).

1. **Finanças/cripto.** "Muita gente entrou no Bitcoin no topo, comprou por impulso no celular e vendeu no pânico."
   `insercao` com uma moeda (`tipo: "objeto"`, vira adesivo) em "Bitcoin"; `insercao` com a mão segurando o celular em "celular" (lado oposto); `destaque` `alerta` "vendeu no pânico". Sem números ditos, nada de gráfico com valores: se quiser a curva, `grafico` com `tendencia: "oscila"` e `ilustrativo: true`.
2. **Saúde (sono).** "Eu tirei o celular do quarto, comprei uma cortina blackout e passei a dormir às onze."
   `insercao` celular na mesa de cabeceira (em "celular"), `insercao` cortina (em "cortina", `busca: "blackout curtain bedroom"`), `numero` 11 com `sufixo: "h"` e `rotulo: "da noite"` em "onze". Uma `forma: "tela"` com o quarto escuro, se houver foto em pé boa.
3. **História pessoal / relacionamento.** "No nosso primeiro encontro a gente foi numa feira de rua, choveu e acabamos dividindo um guarda-chuva."
   `insercao` feira de rua (em "feira"), `insercao` guarda-chuva (`tipo: "objeto"`), e se o usuário tiver uma foto do dia, ela entra no lugar da busca (`arquivo` em `imagens/`). Fecha com `frase` com a linha mais bonita da fala.

Outros nichos: receita (cada ingrediente citado vira um cartão; a quantidade, um `numero`), vendas (o produto do usuário vem de `imagens/`; o preço dito, um `numero`), viagem (o lugar em tela cheia ~1 s; dicas em `topicos`), aula (os termos em `definicao`; a sequência em `passos`).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- A imagem mostra **o que foi dito**, não uma interpretação. Na dúvida, cartão com a palavra.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- Sem marca e sem pessoa famosa nas buscas; print, só o real que o usuário mandar.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A fala ainda tem pausas longas no vídeo**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: aumente o respiro (`node ferramentas/justar.mjs --respiro 0.22`) ou, só naquele corte, afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **A tarja da legenda está uma palavra atrasada**: o tempo daquela palavra no Whisper está esticado; confira em `work/palavras.json` e corrija o `em` dela no `src/plano.json` (em `palavras`).
- **A imagem ficou mole em tela cheia**: era pequena ou deitada; troque por uma em pé (`--refazer`, `--lado 2400` com fotos do Commons) ou use-a como cartão.
- **O cartão encostou na legenda**: a legenda está em 2 linhas longas; encurte o `rotulo`, ou ponha `legenda: false` no momento e deixe o cartão falar sozinho.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
