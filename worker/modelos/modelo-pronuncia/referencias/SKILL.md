---
name: modelo-pronuncia
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Pronúncia: uma ficha de som violeta em cima (a palavra enorme dividida em sílabas, um ponto coral que pula até a sílaba forte, a fonética, a pronúncia errada riscada, o jeito certo de ler com um traço desenhado e a foto do significado) e a pessoa numa moldura larga embaixo; o momento-assinatura repete a palavra em câmera lenta com a voz da própria pessoa, com uma lupa redonda na boca que segue o rosto e a onda da voz correndo embaixo; fecha com \"repete comigo\" em karaokê. Serve para qualquer assunto (o exemplo do modelo é pronúncia de inglês americano, mas funciona com espanhol, sotaque, fonoaudiologia, oratória, termos técnicos, finanças, saúde ou histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Pronúncia\", \"estilo pronúncia\", \"vídeo de como se fala\", \"aula de pronúncia\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Pronúncia

O vídeo vira uma aula de som: quando a pessoa diz a palavra, ela desce para uma moldura larga e a palavra se monta enorme em sílabas, com um ponto coral pulando até a sílaba forte. A pronúncia errada é riscada, o jeito certo ganha um traço desenhado à mão, e na repetição a tela inteira vira câmera lenta: a voz da própria pessoa mais devagar, a boca ampliada numa lupa e a onda da voz correndo embaixo.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com pronúncia de inglês, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo segue o ritmo da fala. O **ponto coral** pula de palavra em palavra (ou de sílaba em sílaba) e pousa com um leve achatamento: é a marca do modelo, presente em todos os blocos. As sílabas entram uma a uma; o errado é riscado por uma linha coral que corre; o certo ganha um traço desenhado à mão embaixo. Na repetição, um corte seco de zoom leva a pessoa à tela inteira em câmera lenta, a lupa abre na boca, a onda acende sílaba por sílaba. Entre duas fichas, uma cortina violeta com a borda coral passa da direita para a esquerda.
- **Organização e hierarquia:** a palavra é a coisa maior da tela (até 190 px); embaixo, a fonética em fonte de dicionário; depois, duas linhas: "não é" (riscado) e "jeito brasileiro de ler" (a sílaba forte em MAIÚSCULAS e coral). A foto do significado fica num cartão inclinado no canto. Cabeçalho com "1 de 3" e o idioma · sotaque.
- **Tipografia:** Manrope (500, 700 e 800) para tudo o que se lê; Charis SIL para a transcrição fonética (tem todos os símbolos do alfabeto fonético). Títulos ≥ 72 px, texto ≥ 44 px, rótulos em caixa alta ≥ 32 px. Todo texto é medido com a fonte de verdade e reduzido para caber.
- **Moldura da pessoa:** três estados. **Tela cheia** com um cartão violeta no peito (abertura, número, destaque, definição, frase, pergunta, repete comigo, fechamento). **Moldura larga embaixo** (cabeça e ombros, cantos arredondados, nome na etiqueta) quando a ficha ou um painel ocupa a parte de cima. **Câmera lenta**: tela inteira um pouco mais perto, com a lupa na boca. A pessoa nunca fica numa coluna estreita e as trocas nunca deixam a tela vazia: a ficha já está montada embaixo e a pessoa encolhe revelando-a; na volta, ela cresce por cima. Tudo segue o rosto pelo rastreio.
- **Cores, textura e som:** violeta profundo `#1D1550` (fundo dos painéis e cartões), creme quente `#FBF6EE` (o que se lê), **coral** `#FF5C7A` = o som (o ponto, a sílaba forte, o traço do certo, o risco do errado), **lilás** `#B3A8EC` = apoio (rótulos, fonética). Sons raros e tonais: duas notas quando o certo se desenha, um tom que desce quando entra a câmera lenta, uma nota curta nos itens, um acorde suave no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Prof. Ana — Inglês"): o nome vai na etiqueta da moldura e na assinatura do fechamento; a área vira o rótulo da abertura. Sem resposta, siga sem nome.
4. **Idioma e sotaque.** O padrão é inglês americano. Pergunte só se não der para saber pela fala: britânico (`"sotaque": "britânico"`), espanhol (`"idioma": "espanhol"`, `"sotaque": "latino"` ou `"da Espanha"`) ou outro. A fonética e o jeito de ler mudam com o sotaque: escreva-os para o sotaque escolhido.

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

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa. **Atenção:** neste modelo a pessoa repete a palavra de propósito ("Comfortable. Não é X, é assim: comfortable"). Essa repetição **fica**: é nela que entra a câmera lenta;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** são trechos de 0,7 s ou mais em que o Whisper não reconheceu palavras. Podem ser fala que a transcrição perdeu (uma palavra estrangeira dita sozinha costuma cair aqui): eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica.

**Deixe a pausa depois da palavra repetida.** A câmera lenta ocupa a palavra repetida **mais a pausa em volta dela** (a voz lenta é mais longa que a normal). Se o item da repetição termina logo depois da palavra e há silêncio até o item seguinte, estique o `ate` dele até 0,05 s antes do `de` do seguinte. Sem pausa, a câmera lenta fica pouco lenta (a ferramenta avisa).

Pausas curtas (até ~0,5 s) são respiração e ficam. Só as pausas longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, calcula `rosto`, `zona` e os pontos de corte no plano. Este modelo fixa o recorte vertical em 9:16 (`modelo.json`): a pessoa é reposicionada pela moldura. Vídeo horizontal vira 3:4 com a base escura; o modelo funciona igual. Leia os avisos que o script imprime.

No fim, o `cortar.mjs` segue o rosto pelo vídeo (`rosto.rastro`). **Este modelo depende do rastreio**: é ele que põe a lupa na boca quando a pessoa se mexe. Se o script disser que o rosto ficou sem rastro (de perfil, mão na frente), a lupa fica no lugar fixo do rosto; avise o usuário.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto e o **círculo coral ("boca (lupa)") na boca**; a caixa azul (cartão no peito) deve começar abaixo do queixo; a caixa amarela (legenda) deve ficar acima da linha vermelha (interface do aplicativo); as caixas roxas mostram o painel e a moldura larga. Se não estiver certo, refaça o passo 4 com medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`pronuncia`) entra **pelo menos uma vez**; num vídeo sobre outro assunto, use-a para a palavra-chave do vídeo (o termo difícil, o nome, a sigla). Cada palavra ensinada é uma ficha `pronuncia`; fichas seguidas trocam por cortina.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (um a cada 2 a 4 s nos trechos de imagem; nunca duas na mesma frase). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "camera tripod"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
   - **Neste modelo:** cada ficha `pronuncia` pede a foto do significado da palavra (a poltrona para "comfortable", legumes para "vegetable"); `destaque`, `definicao` e os itens de `topicos`/`passos` aceitam foto também.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo ou texto; foto de verdade quando é foto. O cartão da ficha é quase quadrado (330×370): prefira o assunto no centro.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira; as linhas da folha marcam 0,25 / 0,5 / 0,75). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (a ficha fica sem cartão de foto).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "poltrona", "efeito": "aproximar" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos e preparar a câmera lenta

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`.

Em cada ficha `pronuncia` com repetição, ponha `"lenta": { "de": …, "ate": … }` com o `em` e o `ate` da **repetição** da palavra em `work/palavras.json`. Depois rode:

```bash
node ferramentas/camera-lenta.mjs
```

Ela acha a palavra exata na voz, mede a pausa em volta, escolhe a velocidade (0,45× a 0,85×), recorta a palavra do áudio e a deixa lenta sem mudar o tom (`public/lenta/<palavra>.wav`), mede a onda e as sílabas, e grava tudo em `lenta`. Leia o que ela imprime: se disser "pouca pausa", volte ao passo 3 e deixe a pausa; se disser que o momento termina antes da voz voltar, acerte o `ate` da ficha (e o `de` do momento seguinte) para o valor que ela mostra. **Rode de novo** sempre que refizer o corte ou mudar o `de`/`ate` de uma `lenta`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda e marca linha com palavra sozinha; corrija o que der.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem reduzida a ~540 px de largura e confira:
- a palavra está inteira e grande? As sílabas somadas formam a palavra? O ponto pousa na sílaba forte?
- a fonética mostra os símbolos (nenhum quadradinho)? O "não é" está riscado e o certo sublinhado?
- **na câmera lenta** (`node scripts/stills.mjs <lenta.em + 0,4> <lenta.em + 0,8>`): a lupa está na boca (não no queixo nem no nariz)? A boca ampliada aparece inteira? A onda e as sílabas embaixo estão legíveis?
- a foto do significado mostra o assunto? A moldura mostra a cabeça inteira?
- nas trocas (o `de` de cada ficha e o fim de cada câmera lenta), a tela nunca fica vazia nem com duas coisas por cima uma da outra.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-pronuncia.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho) e a velocidade de cada câmera lenta;
- de onde vieram as imagens (`creditos.txt`) e o que é ilustrativo;
- o que o usuário deve conferir: **a fonética e o jeito de ler** (escritos por você: peça para um professor revisar se o vídeo for de aula), uma palavra que a transcrição pode ter errado, uma tomada em dúvida.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Tela cheia. Cartão violeta no peito: o rótulo lilás (a área) e o título montado palavra por palavra, com o ponto pulando para cada palavra dita; o `destaque` em coral. |
| lista | `topicos` | Painel em cima, pessoa na moldura. Linhas grandes que entram na fala; o ponto coral pula para a linha dita, as anteriores ficam mais claras. Itens aceitam foto. |
| passos | `passos` | Painel. Linhas numeradas ligadas por um traço que se acende em coral até a etapa dita; o número da etapa atual vira um selo coral. |
| número | `numero` | Tela cheia. Cartão no peito: o número enorme contando e o ponto pousando nele no fim; rótulo embaixo; "ilustrativo" quando for o caso. |
| comparação | `comparacao` | Painel. Dois lados empilhados com rótulo; em `errado-certo` o errado leva o risco coral e o certo o traço desenhado (a mesma gramática da ficha); em `contra`/`antes-depois`, "vs" ou "→" entre eles e o traço no vencedor. |
| gráfico | `grafico` | Painel. Barras como medidores de som (a maior em coral), linha que se desenha com o ponto correndo nela, anel (`pizza`). Sem números: a onda da tendência (sobe, cai, oscila) com a etiqueta "ilustrativo". |
| destaque | `destaque` | Tela cheia. Cartão no peito: a frase enorme com o traço coral embaixo (`chave`) ou toda em coral (`alerta`); o detalhe em lilás; foto opcional no canto. |
| definição | `definicao` | Tela cheia. Verbete: o termo grande com o ponto, a fonética opcional em Charis SIL, o significado escrito na fala; foto opcional. |
| frase | `frase` | Tela cheia. Aspas coral e a frase montada palavra por palavra; `risco` riscado em coral quando é dito. |
| pergunta | `pergunta` | Tela cheia. A pergunta na fala e as opções como pílulas que entram quando ditas, com o ponto pulando entre elas. |
| fechamento | `cta` | Tela cheia. Ícone de traço que se desenha num círculo coral, a chamada na fala (o `destaque` em coral) e a assinatura com nome e área. |
| **assinatura** | `pronuncia` | Ficha de som em cima, pessoa na moldura embaixo: a palavra em sílabas (letras mudas riscadas), o ponto pulando até a forte, fonética, "não é" riscado, o jeito de ler com traço, a foto do significado, uma nota curta; com `lenta`, a repetição em câmera lenta com a lupa na boca e a onda da voz. |
| treino em sequência | `repita` | Tela cheia. Cartão "Repete comigo": as palavras acendem em karaokê quando ditas, cada uma com o ponto na sílaba forte e o jeito de ler ao lado. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa do bloco (`grafico` com `tendencia`).

## A assinatura em qualquer assunto

A assinatura do Pronúncia é **"olha como se diz isso, devagar"**: uma palavra (ou nome, ou termo) que as pessoas falam errado, desmontada em partes, com o jeito certo marcado e a própria pessoa repetindo em câmera lenta com a boca ampliada. Funciona com qualquer palavra dita duas vezes.

1. **Finanças / cripto.** "Todo mundo fala 'bitcoin' certo, mas erra 'Ethereum'. Não é 'eté-reum'. É assim: Ethereum."
   - `pronuncia` `palavra: "Ethereum"`, `silabas`: e · the (forte) · re · um, `fonetica: "/ɪˈθɪə.ri.əm/"`, `errado: "e-té-REUM"`, `leitura: "i-THÍ-ri-am"`, `nota: "o th é com a língua nos dentes"`, foto de moedas, `lenta` na segunda vez que ele diz "Ethereum". Depois, `topicos` com os três termos que mais se erram, ou `comparacao` errado-certo.
2. **Saúde / rotina (fonoaudiologia, nutrição).** "O nome do suplemento é 'whey'. Não é 'uêi protêin' com e aberto. Whey."
   - `pronuncia` `palavra: "whey"`, uma sílaba (`forte`), `fonetica: "/weɪ/"`, `errado: "UÉI"`, `leitura: "UÊI"`, foto de um pote de proteína sem marca (`objeto`), `lenta` na repetição. Uma fonoaudióloga usa a mesma ficha para "paralelepípedo" (pa · ra · le · le · PÍ · pe · do) e a lupa mostra a língua.
3. **Algo bem distante (nomes, carreira, história pessoal).** "Meu sobrenome é polonês e ninguém acerta: Wójcik. Não é 'uó-jik'. É 'VÔI-tchik'."
   - `pronuncia` `palavra: "Wójcik"`, `idioma: "polonês"`, `sotaque: ""`, `silabas`: wój (forte) · cik, `errado: "uó-JIK"`, `leitura: "VÔI-tchik"`, `rotuloLeitura: "como se lê"`, sem foto, `lenta` quando ele repete o nome. Serve igual para nome de empresa, de vinho, de cidade, de remédio.

**Espanhol.** A mesma ficha com `"idioma": "espanhol"` e `"sotaque": "latino"` (ou `"da Espanha"`): `palavra: "perro"`, `silabas`: pe · rro (o "rr" forte), `fonetica: "/ˈpe.ro/"`, `errado: "PÉ-ro"` (r fraco), `leitura: "PÊ-rrro"`, `nota: "o rr vibra"`. Para um vídeo **falado em espanhol** (público latino), troque os textos fixos com `rotulos` no plano (ex.: `"naoE": "no es"`, `"leitura": "cómo se lee"`, `"lenta": "cámara lenta"`, `"repita": "Repite conmigo"`; lista completa em `references/plano.md`) e rode o `preparar.mjs` com `--idioma es`.

## Fidelidade

- Tudo na tela vem da fala. A fonética e o jeito de ler são a escrita do que a pessoa diz (ou do padrão do sotaque escolhido); não ensine uma pronúncia diferente da que ela fala no vídeo. Se a pessoa falar diferente do padrão, siga a fala e avise o usuário.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- A câmera lenta usa só a voz da própria pessoa (o trecho dela, mais devagar). Nada de voz sintética.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`.
- **A câmera lenta corta o começo da frase seguinte** ou a ferramenta avisa "pouca pausa": deixe a pausa depois da palavra no `cortes.json` (passo 3) e rode `cortar.mjs --manter-plano` e a ferramenta de novo. Para forçar uma velocidade: `node ferramentas/camera-lenta.mjs --ritmo 0.6`.
- **A lupa ficou no queixo ou no nariz**: o rastreio está fora; refaça com `node scripts/rastrear.mjs --em <instante> --x <x> --y <y>` medindo o rosto num quadro de guias. Se a pessoa ficou de perfil, escolha outra repetição da palavra para a `lenta`.
- **A ferramenta achou a palavra errada** (pegou o fim da frase anterior): ajuste o `de` da `lenta` para o começo da palavra e rode de novo.
- **Quadradinhos na fonética**: use os símbolos do alfabeto fonético internacional (ʌ ə ɚ ɪ ʊ θ ð ʃ ʒ ˈ); emoji e símbolos inventados não aparecem.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou a palavra estrangeira**: use `correcoes` no plano (os tempos continuam certos).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais**: o bloco reduz o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido (e a lupa mais ainda). Avise o usuário.
