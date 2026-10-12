---
name: modelo-multicamera
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Multicâmera, a cara de um canal de YouTube bem editado: plano aberto e fechado que se alternam a cada corte e mudança de assunto, sempre seguindo o rosto, com aproximação lenta nas ênfases; cortes para a imagem do que é citado em tela cheia com movimento lento; títulos de capítulo discretos numa tarja; legenda mínima e um único destaque vermelho. Sóbrio: não mexe na cor do vídeo. Serve para qualquer assunto (carreira, finanças, saúde, tecnologia, aulas, histórias): a IA divide a fala em capítulos, busca ou pede as imagens e traduz o resto para os blocos do estilo. Use quando o usuário pedir \"modelo Multicâmera\", \"várias câmeras\", \"edição de canal do YouTube\", \"edição profissional sem exagero\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Multicâmera

O vídeo vira a gravação de um estúdio com três câmeras. As duas primeiras olham a pessoa: uma aberta e uma fechada, e a edição troca de uma para a outra em cada corte e em cada assunto novo (o pulo do corte some, porque o enquadramento muda). A terceira, a "câmera C", mostra o que a pessoa cita: a imagem em tela cheia, com movimento lento, por 1 a 2 s. Cada assunto abre com um título de capítulo numa tarja discreta. O resto é mínimo: legenda pequena, um destaque vermelho (a luz de "no ar" da câmera) e painéis grafite quando a fala pede lista, número ou comparação. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de diretor de corte: as tomadas, os capítulos, o que vira imagem e a conferência dos quadros.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com carreira ("Três erros que derrubam uma entrevista de emprego"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a dinâmica vem da **mesa de corte**. Cada trecho entre cortes fica numa câmera só e a câmera troca no corte seguinte (aberto 1,0 ↔ fechado 1,3, nunca a mesma duas vezes seguidas; o gancho começa no fechado; cada capítulo abre no aberto). Nas ênfases a câmera aproxima devagar (no máximo ~6% em 2 s). A câmera C é um corte seco com a imagem se movendo lentamente (~6%). Tarjas e painéis entram por máscara em 0,4 s, sem quique, e saem em 0,2 s. Nada treme, gira, pisca ou troca de cor.
- **Organização e hierarquia:** a pessoa ocupa a tela; o rosto nunca é coberto. A tarja de capítulo e os painéis ficam no terço de baixo, entre o queixo (no plano fechado) e a legenda; a legenda fica logo embaixo, mínima (1 linha, pequena). Uma coisa por vez. Abertura, frase, pergunta e fechamento mostram a própria fala no lugar da legenda.
- **Tipografia:** Onest (500 a 800), branca. Títulos de capítulo em 700, ~38 px; legenda ~44 px; abertura 54 a 88 px; nada abaixo de 24 px. Texto medido com a fonte real: diminui para caber, nunca vaza.
- **Moldura da pessoa:** quadro cheio o vídeo inteiro, seguindo o rosto quadro a quadro; a linha dos olhos fica na mesma altura nas duas câmeras. Nunca janela, nunca coluna.
- **Cores, textura e som:** grafite `#16181D` (tarjas e painéis), branco, cinza de apoio e **um** destaque, o vermelho `#FF4A3D` (quadradinho do número do capítulo, traço do destaque, alerta). Cantos de 10 px e sombra discreta. **Nunca** filtro, LUT, vinheta, brilho ou desfoque sobre a pessoa. Som: um "toc" tonal baixo quando a câmera C entra (`"sfx": false` desliga); mais nada.

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

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha azul é o queixo no plano fechado; a amarela é onde a legenda fica; a verde, onde começam as tarjas e painéis; nada importante abaixo da linha vermelha (interface do aplicativo) nem na faixa vermelha da direita (botões). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. No Multicâmera a pergunta é: **quais são os assuntos (capítulos) e o que a pessoa cita que dá para mostrar?**

1. Divida a fala em capítulos: cada "primeiro…, segundo…", cada mudança de tema vira um `capitulo` com um título curto na voz da fala ("Pesquise a empresa"). Vídeo de menos de 20 s: 2 ou 3 capítulos; sem estrutura clara, 1 capítulo a cada ~8 a 12 s ou nenhum (a câmera ainda alterna nos cortes).
2. Dentro de cada capítulo, o que é concreto e citado vira `cena` (a câmera C): uma a cada ~5 a 8 s, 1 a 2 s cada.
3. O resto: `destaque` (palavra-chave ou alerta), `numero`, `comparacao`, `topicos`/`passos`, `frase`. Abra com `abertura` e feche com `frase`, `pergunta` ou `cta` quando a fala pedir. Respiros só com legenda são bem-vindos (até 4,5 s), com a câmera alternando.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (objeto, lugar, ferramenta, situação, tipo de pessoa). Escreva `work/imagens.json`: `id`, `em`, `palavra`, `busca` (inglês, concreto: "interview desk two people", "shipping box"), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - **Antes de buscar, confira a resposta do usuário sobre imagens próprias.** Produto, lugar, prints, antes e depois: só ele tem. Se a pasta ainda estiver vazia, pergunte de novo uma vez, dizendo o nome sugerido de cada arquivo.
   - Nada de pessoa famosa nem marca na busca: peça ao usuário. Print, só o real.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo, marca ou texto grande. **Em pé (retrato) ou grande ocupa a tela toda**; foto deitada ou pequena entra inteira sobre um fundo feito dela mesma (o template decide sozinho).
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`. Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (a cena mostra a palavra num cartão: **cartão é melhor que imagem errada**).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "entrevista" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (campos, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser mandar na câmera, `camera`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes`. Frase sem ponto no fim que emenda com a próxima na legenda: corrija com as últimas palavras (`{ "pesquisar a empresa": "pesquisar a empresa." }`); nunca uma palavra comum sozinha. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida à largura de um celular (~360 a 540 px)** e confira:
- o rosto nunca está coberto, nem no plano fechado, e a tarja fica abaixo do queixo sem encostar na legenda;
- a câmera mudou em cada corte (dois quadros vizinhos de cortes diferentes têm enquadramentos diferentes);
- a imagem certa aparece quando a palavra é dita, com o assunto inteiro; a legenda nunca junta duas frases;
- a tarja de capítulo está legível, o texto cabe, nada abaixo da linha da interface nem na faixa dos botões;
- nenhum painel vazio esperando o primeiro item (comece o painel na primeira palavra dita);
- nenhum quadro com dois textos um sobre o outro nas trocas (`node scripts/stills.mjs 7.1 7.15 7.2`).

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-multicamera.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (capítulos, cenas e imagens de cada trecho);
- de onde vieram as imagens e o texto de `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que ele pode trocar por uma própria).

## Ritmo e cortes (cortar como editor)

- **Corte pelas pausas reais, nunca pelos tempos das palavras.** O `preparar` acha as pausas pelo áudio e o `justar` parte delas. Para medir à mão: `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`.
- **Respiro de 0,1 a 0,2 s em cada corte.** Menos deixa a fala robótica; mais parece pausa.
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada, comentário fora do vídeo. **O que fica:** pausa curta de vírgula e a pausa dramática antes de uma revelação.
- **Mais cortes = mais câmeras.** Um vídeo com poucos cortes fica numa câmera só por muito tempo: use `camera` para dar uma troca de plano no meio da frase, 1 ou 2 vezes por 15 s, só numa ênfase.
- **Câmera C com juízo:** uma cena a cada ~5 a 8 s, de 1 a 2 s; nunca duas na mesma frase; nunca sobre a palavra mais importante da fala (a pessoa precisa ser vista dizendo-a).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (câmera C)** | `cena` | corte seco para a imagem do que é citado, em tela cheia, com movimento lento (foto deitada ou pequena entra inteira sobre um fundo feito dela, desfocado e escurecido); `rotulo` numa tarja no alto; sem imagem, cartão grafite com a palavra |
| **assinatura (capítulo)** | `capitulo` | tarja grafite discreta no terço de baixo: o número no quadrado vermelho e o título; a câmera abre no plano aberto |
| **assinatura (mesa de corte)** | automática (`camera` opcional) | aberto ↔ fechado em cada corte e capítulo; aproximação lenta nas ênfases |
| abertura | `abertura` | o gancho em painel grafite no terço de baixo, palavra por palavra; o `destaque` ganha o traço vermelho |
| lista | `topicos` | painel grafite; cada linha entra na fala; a da vez em branco, as outras em cinza |
| passos | `passos` | o mesmo painel com etapas numeradas ligadas por um fio até a da vez |
| número | `numero` | painel grafite com o número contando em pt-BR, o `titulo` pequeno em cima e o `rotulo` embaixo |
| comparação | `comparacao` | dois lados no painel, cada um no seu `em`; o vencedor ganha o traço vermelho, o outro apaga |
| gráfico | `grafico` | barras, linha ou rosca em painel grafite; sem números ditos, uma curva com a etiqueta "ilustrativo" |
| destaque | `destaque` | tarja de palavra-chave (a ênfase também aproxima a câmera); `alerta` = tarja vermelha |
| definição | `definicao` | o termo e o significado linha a linha em painel grafite |
| frase | `frase` | painel com a fala palavra por palavra; `risco` riscado quando dito; a câmera aproxima |
| pergunta | `pergunta` | a pergunta palavra por palavra e as `opcoes` em linhas |
| fechamento | `cta` | tarja com o ícone (seguir, salvar, comentar, link) e a chamada palavra por palavra |

## A assinatura em qualquer assunto

A mesa de corte e a câmera C representam **"o vídeo de quem sabe fazer vídeo"**: a fala tem estrutura (capítulos) e coisas citadas (imagens), e a edição mostra os dois sem exagero.

1. **Finanças/cripto.** "Três erros de quem entra em cripto: comprar no topo, não ter reserva e vender no pânico."
   Três `capitulo` ("Comprar no topo", "Sem reserva", "Vender no pânico"); `cena` com a moeda (`tipo: "objeto"`) em "Bitcoin" e com o celular em "pânico"; `destaque` `alerta` "vendeu no pânico". Sem números ditos, nada de gráfico com valores.
2. **Saúde (sono).** "Para dormir melhor: tire o celular do quarto, escureça o ambiente e durma no mesmo horário."
   `capitulo` "1. Celular fora", "2. Quarto escuro", "3. Mesmo horário"; `cena` do celular na cabeceira e da cortina blackout; `numero` 23 com `sufixo: "h"` quando o horário é dito.
3. **História pessoal / carreira.** "Fui demitido, voltei a estudar e em um ano abri a minha empresa."
   `capitulo` "A demissão", "A volta aos estudos", "A empresa"; `cena` com a foto do usuário (de `imagens/`) no lugar da busca; fecha com `frase` com a linha mais forte.

Outros nichos: receita (cada etapa um capítulo, cada ingrediente uma cena), vendas (o produto do usuário vem de `imagens/`; o preço dito, um `numero`), tecnologia (cada ferramenta citada, uma cena), aula (termos em `definicao`).

## Fidelidade

- Tudo na tela vem da fala; os títulos de capítulo podem resumir com as palavras dela, sem mudar o sentido.
- A imagem mostra **o que foi dito**, não uma interpretação. Na dúvida, cartão com a palavra.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- Sem marca e sem pessoa famosa nas buscas; print, só o real que o usuário mandar.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A câmera não troca onde deveria**: ela só troca em `cortesEm` (os cortes), em capítulos e na volta das cenas. Fala sem cortes por muito tempo: acrescente `camera` com um `em` na ênfase.
- **A tarja de capítulo é cortada pela cena**: termine o `capitulo` antes da `cena` (`ate` ≤ `de` da cena).
- **A fala ainda tem pausas longas**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: `node ferramentas/justar.mjs --respiro 0.22` ou afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **A imagem ficou mole em tela cheia**: era pequena ou deitada; use `"forma": "faixa"` ou troque por uma em pé (`--refazer`).
- **A legenda emenda duas frases**: corrija com `correcoes` (frase terminando em ponto).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
