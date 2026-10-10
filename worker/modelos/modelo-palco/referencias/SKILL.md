---
name: modelo-palco
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Palco, com dois modos que se alternam: na fala normal, a pessoa em quadro cheio, com cortes justos e reenquadramento a cada corte; quando ela cita algo que dá para ver (foto, print, lista, número), o assunto ocupa a tela com anotações limpas no ponto citado (círculo, seta, marca-texto) e a pessoa vira uma janela arredondada num canto de baixo. Sóbrio, um destaque azul-cobalto, sem mexer na cor do vídeo. Serve para qualquer assunto (tutoriais, finanças, saúde, vendas, viagens, aulas): a IA lista o que a pessoa cita, busca ou pede as imagens e escolhe o ponto de cada anotação. Use quando o usuário pedir \"modelo Palco\", \"mostrar na tela com a minha janelinha no canto\", \"tutorial com anotações\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Palco

O vídeo vira uma aula bem editada: a pessoa fala em quadro cheio e, no instante em que cita algo que dá para ver, o assunto toma a tela, a pessoa encolhe para uma janela arredondada num canto de baixo, e uma anotação limpa (um círculo, uma seta, um marca-texto) aparece no ponto exato, na hora em que a palavra é dita. Quando o assunto acaba, a pessoa volta ao quadro cheio. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (as tomadas, o ritmo dos cortes, o que vira palco, o ponto de cada anotação, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com fotografia de comida ("Fotos de comida com o celular"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a dinâmica vem de dois modos que se alternam e do ritmo de corte, não de efeito. Cada pausa vira um corte com 0,1 a 0,2 s de respiro; no modo (a) o enquadramento troca entre 1,0, 1,12 e 1,24 em cada corte (nunca o mesmo duas vezes), sempre seguindo o rosto. O palco abre com a pessoa encolhendo em 0,5 s (curva macia, sem quique) enquanto o painel se revela; várias páginas seguidas se cobrem deslizando da direita, e a pessoa só volta ao quadro cheio quando o assunto acaba. A foto aproxima devagar (~4,5%) com as anotações presas ao ponto. Nada treme, gira, pisca ou troca de cor.
- **Organização e hierarquia:** no modo (a), o rosto livre, a legenda logo abaixo do queixo, chips de palavra-chave abaixo dela. No modo (b), o painel grande (1008×1000) com o assunto, um título pequeno no alto à esquerda, a janela da pessoa no canto de baixo (cabeça inteira, por cima da borda do painel) e a legenda ao lado da janela. Uma anotação por palavra dita, no tempo dela.
- **Tipografia:** Manrope, legível. Legenda em 800 (44 a 62 px no modo (a), 36 a 46 no palco), a palavra dita em branco sobre uma tarja azul. Títulos 26 a 38 px, etiquetas das anotações 32 px, nada abaixo de 24 px. O texto é medido com as larguras reais da fonte e diminui para caber, nunca vaza.
- **Moldura da pessoa:** quadro cheio no modo (a); no modo (b), uma janela 360×450 de cantos arredondados (raio 40) num canto de baixo, mostrando cabeça e ombros inteiros e seguindo o rosto quando ela se mexe. O canto esquerdo ou direito é escolhido sozinho para ficar **longe** do ponto anotado (e pode ser forçado com `canto`).
- **Cores, textura e som:** palco grafite `#131518`, painéis `#1D2024`, texto `#F2F1ED`, apoio `#8D939C` e **um** destaque azul-cobalto `#3D7BFF` (anotações, tarja da palavra, marcadores). Cantos suaves, sombra discreta. **Nunca** filtro, LUT, vinheta, brilho ou desfoque sobre a pessoa. Som: um "vum" tonal baixo quando o palco abre (`"sfx": false` desliga); mais nada.

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

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa 9:16 (quadro cheio) para gravação vertical e horizontal; numa gravação horizontal o quadro é um recorte em volta do rosto, então ela precisa de boa resolução (1080p no mínimo; 4K fica nítido). A janela do palco mostra o rosto de perto (zoom ~2): gravação de 1080p vertical ainda fica nítida, abaixo disso a janela amolece. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a câmera acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha azul é o queixo no zoom mais fechado; a amarela é onde a legenda do modo (a) começa; a verde, onde o chip começa; nada importante abaixo da linha vermelha (interface do aplicativo) nem na faixa vermelha da direita (botões). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s e dê a cada uma uma forma e um bloco **deste modelo** (tabela "Blocos deste modelo", abaixo). No Palco a pergunta principal de cada batida é: **a pessoa citou algo que dá para mostrar e apontar?** Se sim, é um `palco`, e você já decide qual palavra ganha qual anotação. Se a fala é uma lista, uma sequência, um número, uma comparação ou uma definição, é o bloco de palco correspondente (`topicos`, `passos`, `numero`, `comparacao`, `definicao`). Se não, a pessoa fica em quadro cheio (modo (a)) com a legenda, um chip (`destaque`) ou nada.

Ritmo entre os modos:
- Abra em modo (a) com `abertura` (o gancho), 2 a 3 s, antes do primeiro palco.
- Um palco de 1,8 a 4,5 s por assunto concreto; no máximo ~60% do vídeo no modo (b). A pessoa em quadro cheio entre os palcos é metade da graça: deixe **0,6 s ou mais** entre dois palcos para ela voltar. Quando dois assuntos vêm colados (menos de 0,6 s), eles viram uma cena só: a página nova cobre a anterior e a janela fica no lugar.
- Um palco com duas coisas citadas em sequência ("pizza e mesa posta") usa `segunda` (o painel se divide).
- Algo novo na tela (palco, anotação, chip, reenquadramento) a cada ~4 a 6 s. Feche com `cta` ou `frase` em modo (a).

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (objeto, comida, lugar, ferramenta, situação, tipo de pessoa; uma a cada ~4 a 6 s; nunca duas na mesma frase). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "takeaway coffee cup", "french press coffee", "meal prep containers"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - **Antes de buscar, confira a resposta do usuário sobre imagens próprias** (passo 3 de "Antes de começar"). Produto dele, o lugar dele, prints, antes e depois: só ele tem. Liste o que você acha que deveria vir dele e, se a pasta ainda estiver vazia, pergunte de novo uma vez, dizendo o nome sugerido de cada arquivo.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo, marca ou texto grande; foto de verdade quando é foto; **de preferência quadrada ou em pé, com 1000 px ou mais** — a imagem ocupa um painel de 1008×1000, então foto deitada ou pequena perde as laterais ou fica mole. Print ou tela: só o real que o usuário mandar (`ajuste: "inteira"`). Anote, na hora de escolher, **onde está cada coisa que a pessoa vai citar** (em frações da imagem inteira): é o ponto das anotações.
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
- **modo (a)**: o rosto nunca está coberto (nem em zoom 1,24) e o chip fica abaixo da legenda;
- **palco**: a cabeça inteira cabe na janela, com folga em cima; a janela **não cobre** nenhum ponto anotado nem o título; a legenda está ao lado da janela, em até 2 linhas, sem encostar na borda do painel;
- **cada anotação cai no que a pessoa cita** (círculo no objeto, seta no detalhe, marca-texto na linha certa do print) e aparece na palavra certa; a etiqueta é legível e cabe no painel;
- a imagem certa, nítida, com o assunto inteiro (o foco certo); texto cabe, nada cortado, nada abaixo da linha da interface nem na faixa dos botões;
- a tarja da legenda está na palavra dita; nenhuma frase emenda com a seguinte;
- nada parado mais de ~2,5 s; nenhum quadro vazio nem com dois textos um sobre o outro nas trocas. Gere quadros a cada 0,05 s em volta de cada entrada e saída do palco (`node scripts/stills.mjs 3.1 3.2 3.3 3.4 7.9 8.0 8.1 8.3`).

Corrija o plano (outro ponto da anotação, outro `canto`, texto mais curto, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-palco.mp4"
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
- **Cada corte troca o enquadramento** (o template faz sozinho: 1,0 → 1,12 → 1,24…, nunca repete). É isso que esconde o pulo do corte. A volta do palco também troca.
- **Ênfase:** num trecho importante sem corte, use `camera` com `aproximar: true` (aproximação lenta) ou, uma ou duas vezes no vídeo, um "soco" de câmera na palavra (`{ "em": 3.18, "zoom": 1.12 }`). Mais que isso cansa.
- **Ritmo dos palcos:** um palco de 1,8 a 4,5 s por assunto concreto, com a pessoa em quadro cheio entre eles (0,6 s ou mais; o ideal é uma frase curta). Troque de assunto dentro de uma cena com uma nova página (a nova cobre a anterior) quando as falas vêm coladas.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura** | `palco` | o assunto no painel (foto "cobrir" ou print "inteira"), com `titulo`, `etiqueta`, `rotulo` e `anotacoes` (círculo, seta, marca-texto, foco, xis) presas ao ponto e desenhadas na palavra dita; `segunda` divide o painel em dois assuntos; a pessoa vira a janela do canto |
| abertura | `abertura` | o gancho no lugar da legenda, maior (54 a 88 px), palavra por palavra; o `destaque` ganha um sublinhado azul que se desenha junto |
| lista | `topicos` | painel com linhas largas; cada uma entra na fala e a da vez ganha o marca-texto azul; janela no canto |
| passos | `passos` | o mesmo painel com marcadores numerados |
| número | `numero` | o número gigante contando em pt-BR (até 300 px), traço azul que se completa, `titulo` em cima e `rotulo` embaixo |
| comparação | `comparacao` | duas metades lado a lado, cada uma no seu `em`, com foto opcional; sinal →, × ou ≠ no meio; o vencedor ganha o contorno azul, o outro apaga (riscado em `errado-certo`) |
| gráfico | `grafico` | barras que crescem na fala (a da vez em azul), linha que se desenha, ou rosca; sem números ditos, uma curva com "ilustrativo" |
| destaque | `destaque` | chip de palavra-chave abaixo da legenda, no modo (a) (`alerta` = pílula clara); `detalhe` em texto menor embaixo |
| definição | `definicao` | o termo grande, traço azul, o significado linha a linha, no painel |
| frase | `frase` | cartão escuro largo no lugar da legenda, com barra azul à esquerda; palavra por palavra; `destaque` sublinhado; `risco` riscado quando dito |
| pergunta | `pergunta` | cartão escuro no lugar da legenda, a pergunta e as `opcoes` (miniatura redonda ou letra) |
| fechamento | `cta` | pílula escura com o ícone num círculo azul (seguir, salvar, comentar, link) e a chamada palavra por palavra |

## A assinatura em qualquer assunto

O `palco` representa **"olha isto, é exatamente aqui"**: a fala aponta para algo que existe, e a edição põe esse algo na tela e aponta de volta. Quando a fala é abstrata, procure o exemplo dentro dela e anote nele; quando nem isso existe, use `topicos`, `definicao` ou `numero` (também são palco) em vez de forçar uma imagem.

1. **Finanças/cripto.** "No gráfico do Bitcoin, comprar aqui no topo foi o erro; o certo era esperar a queda até aqui."
   `palco` com o print do gráfico do usuário (`ajuste: "inteira"`, o `id` com "print"): `xis` no topo em "aqui no topo", `seta` com a etiqueta "esperar" na região da queda em "até aqui". Sem print do usuário, não invente o gráfico: use `grafico` com `tendencia: "oscila"` e `ilustrativo: true`.
2. **Saúde (sono).** "Tira o celular do quarto, põe uma cortina blackout e deixa a temperatura baixa."
   `passos` com os três itens (cada linha acende na fala); um `palco` com a foto do quarto escuro e um `circulo` na janela com cortina em "cortina blackout".
3. **Tutorial de software / carreira.** "No seu currículo, põe o resultado primeiro; aqui, nessa linha, o número que mostra o impacto."
   `palco` com o print do currículo do usuário: `marca` (sem texto, faixa de marca-texto) sobre a linha do número em "nessa linha" e `seta` com a etiqueta "o impacto". Se o usuário não mandou print, `definicao` ("Resultado primeiro") com o significado dito.

Outros nichos: receita (cada ingrediente citado num `palco` com `segunda`), viagem (o mapa ou a foto do lugar com `circulo` no ponto), decoração (antes e depois em `comparacao` com fotos), vendas (o produto do usuário em `imagens/` com `foco` nos detalhes).

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
- **A imagem ficou mole no painel**: era pequena ou deitada; troque por uma quadrada ou em pé (`--refazer`, `--lado 2400` com fotos do Commons) ou use `topicos`/`definicao` no lugar.
- **A anotação caiu fora do ponto**: `x` e `y` são frações da imagem **inteira** (não do painel); releia a folha, corrija e confira no quadro. Com `ajuste: "cobrir"` partes das bordas ficam cortadas: ajuste o `foco`.
- **A janela cobre o que está anotado**: force o outro `canto`, ou mova o ponto de interesse com o `foco`.
- **A pessoa não volta ao quadro cheio entre dois palcos**: eles estão a menos de 0,6 s; afaste `ate`/`de` ou aceite a cena de duas páginas.
- **A legenda do palco ficou apertada**: ela tem ~520 px de largura ao lado da janela; frases de mais de ~34 caracteres já quebram em 2 linhas. Corrija a pontuação em `correcoes` para a frase ser cortada mais cedo.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
