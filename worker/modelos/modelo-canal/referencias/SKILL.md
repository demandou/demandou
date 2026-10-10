---
name: modelo-canal
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Canal, a edição de um canal de YouTube bem feito, em 16:9: punch-ins alternados nos cortes seguindo o rosto; o reframe (a câmera aproxima e empurra a pessoa para um lado, e a informação entra na metade livre num painel de vidro escuro com um destaque cobalto); B-roll em tela cheia com movimento lento; tarja de nome, títulos de capítulo, palavras-chave e lembrete de inscrição sem sino; sem legenda por padrão. Serve para qualquer assunto (o exemplo é um teste de microfones, mas funciona com finanças, saúde, aulas, vendas, histórias): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Canal\", \"estilo Canal\", \"edição para YouTube\", \"vídeo horizontal\", \"16:9\" ou um talking head editado para o YouTube. Entrega um MP4 horizontal 1920×1080 (16:9) para YouTube."
---

# Modelo Canal

O vídeo vira um episódio de canal de YouTube editado por profissional, deitado (16:9). A pessoa fala em quadro cheio e a câmera muda a cada corte (aberto, médio, fechado), sempre seguindo o rosto. Quando a fala traz informação (os itens de uma lista, um número, uma comparação), a câmera **aproxima e empurra a pessoa para um lado** e a informação ocupa a metade livre, num painel de vidro escuro: é o **reframe**, a assinatura do modelo. O que é concreto e citado vira B-roll em tela cheia; os assuntos ganham título de capítulo; a palavra-chave aparece ao lado do rosto; no fim, o botão de inscrição que o cursor clica. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de diretor: as tomadas, o mapa da fala, as imagens e a conferência dos quadros.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um teste de microfones, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

**Formato:** este modelo entrega **16:9 (1920×1080) para YouTube**. Gravação deitada entra inteira; gravação vertical funciona, mas o vídeo vira uma faixa deitada em volta do rosto (avise o usuário que perde definição e que o ideal é gravar deitado).

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a dinâmica vem da **mesa de corte**. Cada trecho entre cortes fica numa câmera só e ela troca no corte seguinte (aberto 1,0 ↔ fechado 1,3; médio 1,15 para não repetir), sempre seguindo o rosto. No **reframe** a câmera aproxima (~1,3) e empurra a pessoa para o lado: seco quando cai num corte, num movimento de 0,5 s no meio da frase; um corte dentro do reframe aperta mais um pouco. Nas ênfases a câmera aproxima devagar (até ~4%). Painéis entram deslizando do lado livre e se abrem de cima para baixo (0,4 s), sem quique; o conteúdo entra na fala; uma linha cobalto corre no alto do painel enquanto ele está no ar. B-roll é corte seco com a foto andando devagar (~7%).
- **Organização e hierarquia:** a informação fica sempre no **lado livre** (o oposto ao rosto), longe da pessoa; o rosto nunca é coberto. No reframe, o painel lateral (824 px de largura) tem o rótulo em mono no alto, a área grande (foto ou número ou lista) e a trilha embaixo. Tarja de nome, capítulo e inscrição ficam embaixo, encostadas na margem de fora; a palavra-chave fica na altura do rosto. Uma coisa por vez. Margem segura de 96 px nas laterais e 72 px no alto; nada abaixo de y 984 (controles do player).
- **Tipografia:** **Inter** (500 a 800) para tudo que se lê, com tracking −0,02em nos títulos; **DM Mono** (500) só em rótulos curtos, contadores ("1/3") e o "CAPÍTULO". Abertura 52 a 92 px; nomes nos cartões 36 a 64 px; palavra-chave 48 a 88 px; nada abaixo de 18 px. Texto medido com a fonte real: diminui para caber, nunca vaza.
- **Moldura da pessoa:** quadro cheio o vídeo inteiro (nunca janela, nunca coluna), seguindo o rosto quadro a quadro; a linha dos olhos fica na mesma altura em todas as câmeras. No reframe a pessoa vai para ~27% da largura (do lado oposto ao da informação).
- **Cores, textura e som:** vidro escuro `rgba(17,19,24,0.80)` com desfoque do fundo, texto giz `#F6F5F1`, cinza de apoio `#A3A9B4` e **um** destaque, o cobalto `#3D63FF` (marcador da abertura, selos numerados, traços, botão de inscrição); coral `#FF5B4A` só no alerta e no risco. Cantos de 22 px. **Nunca** filtro, LUT, vinheta, brilho ou halo sobre a pessoa. Sons tonais e baixos: um "vum" curto quando o reframe entra, um toque no corte para o B-roll e um tique no clique da inscrição (`"sfx": false` desliga). **Nunca sino.** Sem legenda por padrão (`"legendas": true` liga).

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; e a busca de imagens). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **nome e área** de quem fala (vão na tarja de nome e no lembrete de inscrição; sem resposta, siga sem tarja);
   - **se ele tem imagens próprias** para entrar no vídeo (o produto, o lugar, prints, antes e depois). Se tiver, peça para pôr na pasta `imagens/` do projeto (criada no passo 1), com nomes que digam o que são (`microfone-usb.jpg`, `print-painel.png`). Elas passam na frente de qualquer busca;
   - **se quer legenda** (no YouTube o padrão é sem; quem quer liga o CC).

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela. Crie também a pasta `imagens/` lá dentro (para as imagens do usuário).

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas. Ele avisa que o modelo entrega 16:9.

### 3. Escolher as tomadas e justar os cortes

Leia a lista como um editor (veja **Ritmo e cortes**, abaixo). Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, "é…" longos sozinhos, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (meça o volume: `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`; perto de −60 dB é silêncio, −30 dB ou mais é fala).

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Depois de escolher, deixe os cortes justos (é o jump cut do YouTube, e cada corte troca a câmera):

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
node scripts/cortar.mjs --rosto-x 0.33 --rosto-y 0.29 --queixo-y 0.41
```

O `modelo.json` do template pede `"formato": "16:9"`: o vídeo de trabalho sai em 1920×1080 (a gravação deitada entra inteira, sem recorte). Não passe `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a câmera acompanha quando a pessoa se mexe. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; o retângulo amarelo é a margem segura; o verde, o lado livre (onde entram os painéis); nada importante abaixo da linha vermelha (controles do player). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

Repare **de que lado a pessoa está**: a informação entra no lado oposto ao rosto (rosto à esquerda → painéis à direita). Gravação com a pessoa bem no meio também funciona: o reframe aproxima um pouco mais para abrir o lado livre.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. No Canal a pergunta é: **onde a fala traz informação (vira reframe), o que ela cita que dá para mostrar (vira cartão ou B-roll), e quais são os assuntos (capítulos)?**

1. **Abertura:** o gancho dos primeiros segundos vira `abertura` no lado livre (junto com a tarja de nome, se houver).
2. **Reframe (a assinatura, pelo menos 1 vez):** toda enumeração de coisas ("o primeiro…, o segundo…", "três erros…", "as opções são…") vira `reframe` com um cartão por item (foto quando a coisa é concreta, cartão tipográfico quando é ideia). Número dito, comparação, passos, definição, frase forte e pergunta também entram no reframe com o bloco universal deles.
3. **B-roll:** o que é concreto e citado (um lugar, uma situação, um objeto que não está numa lista) vira `cena` em tela cheia, 1 a 2 s, uma a cada ~6 a 10 s.
4. **Capítulos:** cada mudança de assunto vira `capitulo` com um título curto na voz da fala. Pode ficar por cima de uma `cena` (o título do capítulo sobre o B-roll que abre o assunto).
5. **Palavra-chave:** a ideia que bate forte numa frase (o veredito, o alerta) vira `destaque` ao lado do rosto, num plano fechado.
6. **Fechamento:** "se inscreve", "inscreva-se no canal" vira `inscricao` (o botão que o cursor clica); outros pedidos ("comenta", "link na descrição") viram `cta`.
7. **Ganchos de retenção:** "fica até o final", "daqui a pouco eu mostro" viram `chamada` (o chip que anuncia o que vem), entrando na palavra que o anuncia.
8. Respiros só com a pessoa (até 3,5 s) são bem-vindos, sem ficar parados: a câmera troca nos cortes e, numa frase de impacto sem corte ("e o resultado me surpreendeu"), use `camera` com `"plano"` (troca seca) e/ou `"aproximar": 0.06` (punch-in de ênfase).

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (os itens do reframe, o lugar do B-roll). Escreva `work/imagens.json`: `id`, `em`, `palavra`, `busca` (inglês, concreto: "lavalier microphone clip", "busy city street"), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - **Antes de buscar, confira a resposta do usuário sobre imagens próprias.** Produto, lugar, prints, antes e depois: só ele tem. Se a pasta ainda estiver vazia, pergunte de novo uma vez, dizendo o nome sugerido de cada arquivo.
   - Nada de pessoa famosa nem marca na busca: peça ao usuário. Print, só o real.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo, marca ou texto grande. Para os cartões do reframe, prefira o objeto inteiro sobre fundo limpo (deitada, ~16:9); para o B-roll, foto deitada e grande (ela cobre a tela 1920×1080).
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`. Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (o cartão mostra a palavra: **cartão é melhor que imagem errada**).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "lapela" }` (no item do reframe ou na cena). Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a descrição do vídeo.

### 7. Planejar os momentos

Leia `references/plano.md` (campos, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `legendas`, `semLegenda`, `correcoes` e, se quiser mandar na câmera, `camera`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: cada inserção na palavra que a nomeia (±0,15 s) e cada texto do reframe, da palavra-chave, do capítulo e do B-roll dito ali perto. Corrija até sair "Tempo OK";
- com legenda ligada, `node scripts/legendas.mjs` lista as linhas.

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida a ~540 a 960 px de largura** e confira:
- o rosto nunca está coberto; no reframe, a pessoa foi para o lado e o painel não encosta nela;
- a câmera mudou em cada corte (dois quadros vizinhos de cortes diferentes têm enquadramentos diferentes);
- o cartão certo aparece quando a palavra é dita, com o objeto inteiro; o B-roll é **aquilo** que foi dito;
- o texto cabe, está legível e nada encosta na margem nem desce abaixo da linha do player;
- nenhum painel vazio esperando (o título grande do reframe preenche a área até o primeiro item, por no máximo ~1,5 s);
- nenhum quadro com dois textos um sobre o outro nas trocas (`node scripts/stills.mjs 7.9 7.95 8.0`).

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-canal.mp4"
```

Ele confere o plano de novo, renderiza em 1920×1080 e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho, os capítulos e as imagens);
- de onde vieram as imagens e o texto de `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que ele pode trocar por uma própria).

## Ritmo e cortes (cortar como editor)

- **Corte pelas pausas reais, nunca pelos tempos das palavras.** O `preparar` acha as pausas pelo áudio e o `justar` parte delas.
- **Respiro de 0,1 a 0,2 s em cada corte.** Menos deixa a fala robótica; mais parece pausa.
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora do vídeo. **O que fica:** pausa curta de vírgula e a pausa dramática antes de uma revelação.
- **Mais cortes = mais câmeras.** Fala sem cortes por muito tempo: use `camera` para uma troca de plano no meio da frase (seca, como um corte de câmera) ou um punch-in de ênfase (`"aproximar": 0.06`), 1 ou 2 vezes por 15 s, numa ênfase.
- **Reframe com juízo:** comece num corte quando der (entra seco, como um corte de câmera) ou na primeira palavra da informação; termine logo depois do último item, com o último cartão visível por ≥ 1,2 s.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (reframe)** | `reframe` | a câmera aproxima e empurra a pessoa para o lado; no lado livre, painel de vidro com o título grande e, item por item na fala, o cartão (foto ou cartão tipográfico) com o selo numerado e o nome; a trilha embaixo acende cada item dito |
| B-roll | `cena` | a imagem do que é citado em tela cheia, corte seco, movimento lento; `rotulo` numa etiqueta de vidro com barras de som no alto |
| capítulo | `capitulo` | cartão de vidro embaixo no lado livre: "CAPÍTULO" em mono, o título e a barra de capítulos (um trecho por capítulo; o da vez enche) |
| chamada | `chamada` | chip discreto embaixo no lado livre (▶ no selo cobalto + texto curto) que anuncia o que vem ("No final: teste com barulho"); dá lugar ao capítulo ou ao bloco anunciado no mesmo canto |
| lembrete de inscrição | `inscricao` | avatar + nome + botão cobalto "Inscrever-se"; o cursor entra, clica e o botão vira "Inscrito". Sem sino |
| abertura | `abertura` | painel de vidro no lado livre com o gancho palavra por palavra; `destaque` no marcador cobalto; o painel cresce com as linhas |
| lista | `topicos` | no reframe: linhas que entram na fala, marcador cobalto na da vez, as outras em cinza |
| passos | `passos` | no reframe: selos "01, 02…" ligados por um fio cobalto que desce até o passo da vez |
| número | `numero` | no reframe: o número contando em pt-BR, a barra cobalto que enche e o rótulo |
| comparação | `comparacao` | no reframe: dois cartões empilhados ("vs" ou "↓"); o vencedor acende em cobalto com o selo de ok, o outro apaga (riscado em coral no errado-certo) |
| gráfico | `grafico` | no reframe: barras, linha ou rosca; sem números ditos, a curva da tendência com "ilustrativo" |
| destaque (palavra-chave) | `destaque` | chip de vidro na altura do rosto, no lado livre, com o traço cobalto (coral no alerta) e o `detalhe` embaixo; a câmera aproxima devagar |
| definição | `definicao` | no reframe: o termo, o fio cobalto e o significado linha a linha |
| frase | `frase` | no reframe: aspas cobalto e a fala palavra por palavra; `destaque` no marcador, `risco` riscado |
| pergunta | `pergunta` | no reframe: o "?" no selo cobalto, a pergunta palavra por palavra e as opções com letra |
| fechamento | `cta` | com `icone: "seguir"`, o lembrete de inscrição; com `salvar`, `comentar` ou `link`, cartão embaixo no lado livre com o ícone e a chamada na fala |

## A assinatura em qualquer assunto

O reframe representa **"agora presta atenção nisto"**: a pessoa abre espaço e a informação entra ao lado dela, item por item, no ritmo da fala. Serve para qualquer enumeração, comparação ou dado.

1. **Finanças/cripto.** "Tem gente que perde na alta porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `reframe` com `titulo: "Por que perde na alta"` e três itens sem foto ("Compra por impulso" em "compra", "Moeda sem critério" em "moeda", "Risco que não entende" em "risco"): o cartão tipográfico mostra o número grande e o nome, e a trilha acende cada um.
2. **Saúde (sono).** "Três coisas que eu mudei para dormir melhor: celular fora do quarto, quarto escuro e mesmo horário."
   `reframe` com três itens e fotos (`imagens.mjs`: "phone on nightstand", "blackout curtain", "alarm clock"); depois um `numero` 23 com `sufixo: "h"` se o horário for dito, que entra no mesmo reframe.
3. **Carreira / história pessoal.** "Fui demitido, voltei a estudar e um ano depois abri a minha empresa."
   `reframe` com `titulo: "Em um ano"` e três itens ("Demitido", "De volta aos estudos", "A empresa"), com a foto do usuário (de `imagens/`) no último; fecha com `frase` na linha mais forte.

Outros nichos: receita (os ingredientes como cartões com foto), vendas (o produto do usuário no cartão; o preço dito, um `numero`), aula (os termos em `definicao`, as etapas em `passos`), tecnologia (cada ferramenta, um cartão).

## Fidelidade

- Tudo na tela vem da fala; títulos de capítulo e de reframe podem resumir com as palavras dela, sem mudar o sentido.
- A imagem mostra **o que foi dito**, não uma interpretação. Na dúvida, cartão tipográfico.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível. Os números dos cartões do reframe (1, 2, 3) são a ordem dos itens; `numerar: false` tira.
- Sem marca, sem logo e sem pessoa famosa nas imagens; print, só o real que o usuário mandar. O botão de inscrição é genérico (sem logo de plataforma).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **`timing.mjs` acusou desvio**: use o `em` da palavra que nomeia a coisa em `work/palavras.json`; se o texto não foi dito ali, troque o texto pelas palavras da fala.
- **O painel encosta na pessoa**: ela foi gravada muito perto do meio ou muito perto da câmera. Ponha `"lado"` no momento para escolher o outro lado, ou deixe o reframe aproximar mais (o template já calcula o zoom que leva o rosto até ~27% da largura).
- **A câmera não troca onde deveria**: ela troca em `cortesEm`, no reframe, no capítulo, na inscrição e na volta do B-roll. Fala sem cortes: acrescente `camera` com um `em` na ênfase.
- **O último cartão do reframe passa rápido demais**: estenda o `ate` do reframe para ≥ 1,2 s depois do último item (ele pode atravessar um corte).
- **A gravação é vertical**: o vídeo de trabalho vira uma faixa deitada do original (aviso do `cortar`); avise o usuário que o ideal para este modelo é gravar deitado.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
