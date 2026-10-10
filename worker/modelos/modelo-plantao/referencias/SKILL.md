---
name: modelo-plantao
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Plantão: um explicador de telejornal. Barra vermelha EXPLICANDO com relógio, tarjas de TV na altura do peito com nome e função, letreiro correndo na base e a tela que se divide (a pessoa em cima, o painel azul do estúdio embaixo) para desenhar cada ideia na fala: etiqueta que sobe pelo trilho, nota que encolhe, linhas que se cruzam, número que conta, listas em tarjas. Azul de estúdio, branco e um único vermelho. Serve para qualquer assunto (o exemplo do modelo é economia, mas funciona com cripto, saúde, pets, vendas, carreira, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Plantão\", \"estilo telejornal\", \"estilo jornal\", \"cara de notícia\" ou \"entenda em 30 segundos\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Plantão

O vídeo vira um explicador de telejornal: a pessoa é o apresentador, o pacote gráfico é sóbrio e firme, e a cada ideia a tela muda como numa edição de TV — a tarja entra na altura do peito, ou a pessoa sobe para a metade de cima e o painel do estúdio desenha o que está sendo dito. A barra "EXPLICANDO" com o relógio e o letreiro na base ficam no ar o tempo todo.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com economia (inflação), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** pacote gráfico de TV. Tudo entra varrendo da esquerda (só o fundo é recortado; o texto aparece inteiro quando a tarja já abriu) e assenta, sem quique. Antes de ser dito, tudo já está "a lápis" (contorno tracejado, palavras apagadas) e ganha cor na palavra: o texto acende palavra por palavra, os números contam, os valores rolam como placar, as linhas se desenham, a etiqueta sobe pelo trilho, a nota encolhe. Entre dois painéis, uma faixa azul elétrico atravessa o painel como uma cortina; entre o painel e a tarja, a própria pessoa cresce por cima do painel.
- **Organização e hierarquia:** uma ideia por tela. Em quadro cheio, a tarja de TV (GC) na altura do peito: aba azul (chapéu ou botão), tarja branca com o texto grande em caixa-alta e a tarja escura de nome embaixo. No painel do estúdio, cabeçalho curto em cima e o desenho ocupando o painel (lista em tarjas, trilho numerado, número grande, gráfico, etiqueta, nota). A moldura fixa — barra no alto à esquerda, letreiro na base — resume o assunto.
- **Tipografia:** uma família só, Schibsted Grotesk (grotesca larga de jornal, Google Fonts): 900 em caixa-alta nas manchetes e valores, 800 em caixa-alta espaçada nos rótulos, 600–700 nos textos de apoio. Títulos de tarja de 60 a 116 px, textos de painel ≥ 44 px, rótulos ≥ 30 px. Todo texto é medido na própria fonte e reduzido para caber, em até 2 ou 3 linhas.
- **Moldura da pessoa:** dois quadros. **Cheio** (rosto na linha do centro, tarja no peito) e **dividida** (a pessoa na metade de cima, cortada logo abaixo do queixo, com um fio azul elétrico na divisa; o painel embaixo). A troca leva 0,5 s, macia, e esconde os cortes da fala. Em gravação muito perto da câmera, a faixa da pessoa fica um pouco mais estreita para o queixo caber. A caixa segue o rosto. Nada recorta a pessoa do fundo.
- **Cores, textura e som:** azul de estúdio `#0B1D6E` com uma grade fina que corre devagar, azul-noite `#061247`, **azul elétrico `#2251FF` = o acento**, azul-claro `#A9C3FF` no apoio, branco das tarjas `#F3F5FA`, e **um único vermelho `#E3122C`** (a barra EXPLICANDO e o bloco do alerta). Sons raros e tonais: duas notas na abertura, um "vum" grave na troca de quadro, notas que sobem quando um item ou número acende, duas notas descendo na perda e no alerta, um acorde no fim.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e função** de quem fala (ex.: "Carla Souza" / "Economista"): vão na tarja de nome, embaixo da manchete, da abertura e do fechamento. Sem resposta, siga sem nome (as tarjas ficam só com o texto).

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela.

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições. Itens `[sem transcrição: ouça antes de tirar]` vêm com `"manter": true` e só saem se você confirmar que não há fala (sem como ouvir, meça o volume: perto de −60 dB é silêncio).

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre as frases viram cortes, e é nelas que a tela muda de quadro** (a pessoa sobe para a tela dividida ou volta ao quadro cheio): o movimento esconde o pulo do corte. Mantenha a proposta do `preparar`: cada trecho de fala separado.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo** (`modelo.json`: gravação vertical fica 9:16; horizontal vira 3:4). Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, a barra, o letreiro e as correções continuam. No fim, o `cortar.mjs` segue o rosto pelo vídeo: a caixa da pessoa acompanha quando ela se mexe. O aviso "gravação bem perto da câmera" é normal em selfie: em quadro cheio o topo da cabeça fica cortado e as tarjas ficam um pouco menores (elas nunca sobem acima do queixo); na tela dividida a faixa da pessoa estreita para a cabeça caber.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Três quadros com guias: a cruz deve cair no rosto, na linha vertical do centro; a faixa laranja (barra EXPLICANDO) fica no alto; a linha rosa é o queixo estimado (as tarjas de quadro cheio começam abaixo dela); a linha roxa é a divisa da tela dividida (deve passar **abaixo do queixo**; o retângulo roxo tracejado, quando aparece, é a faixa estreitada da pessoa); a amarela é a legenda; a branca é o letreiro, logo acima da linha vermelha (interface do aplicativo). Se o queixo estimado estiver errado, refaça o passo 4 com medidas melhores.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: uma linha por batida (2 a 5 s, uma ideia), com o tempo, o trecho falado, a forma (lista, número, comparação, tendência…), o bloco **deste modelo** (tabela abaixo) e o que aparece na tela.

- A **assinatura** entra pelo menos uma vez: `etiqueta` (um valor que muda), `nota` (algo que perde força), `manchete` (a tarja de telejornal) ou `vinheta`. Prefira a `etiqueta` ou a `nota` como metáfora sempre que a fala tiver um "era assim, ficou assado" ou uma perda — é o que mais dá a cara do Plantão (veja "A assinatura em qualquer assunto").
- **Alterne os quadros:** blocos de painel mandam a pessoa para cima; tarjas a trazem de volta ao quadro cheio. Evite mais de ~15 s seguidos de painel e evite uma tarja de menos de ~1,8 s entre dois painéis (emende os painéis: a cortina azul faz a troca).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, regras de tempo e um exemplo) e preencha `src/plano.json`: `marca`, `barra`, `letreiro`, `momentos`, `semLegenda` e `correcoes`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem reduzida a ~540 px de largura e confira: o texto cabe e está inteiro? A tarja encosta no queixo? O rosto aparece inteiro na metade de cima? A etiqueta e a nota mostram o valor certo? A tela muda de verdade a cada 1,5 a 2,5 s? Confira também o **meio das trocas** com tempos soltos (`node scripts/stills.mjs 12.7 12.8 12.9`): a cortina azul passa entre dois painéis sem os dois textos um em cima do outro, e a pessoa cresce por cima do painel antes de a tarja entrar. Corrija o plano e repita.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-plantao.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é **ilustrativo** (formas sem números) e as contas que aparecem na tela (para o usuário conferir);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Quadro cheio. Três faixas cruzam a tela (o risco da vinheta) e o título entra na tarja branca do GC, palavra por palavra; `chapeu` na aba azul, `destaque` em azul elétrico, tarja de nome embaixo. |
| lista | `topicos` | Painel. Tarjas brancas empilhadas, cada uma com o marcador azul; acendem na palavra do item (a seta marca o item atual); o `detalhe` entra no tempo dele. |
| passos | `passos` | Painel. Etapas numeradas num trilho vertical: o azul corre pelo trilho até a etapa dita, o número acende, o texto entra palavra por palavra. |
| número | `numero` | Painel. O rótulo em azul-claro, o número grande contando no formato brasileiro, uma linha azul que corre; `apoio` e `fonte` opcionais. |
| comparação | `comparacao` | Painel. O placar de dois lados: rótulo em tarja branca e texto grande em cada coluna, × ou → no fio do meio; o vencedor ganha o visto azul e o outro apaga com ×. |
| gráfico | `grafico` | Painel. Barras que crescem, linha que anda de ponto em ponto ou anel (pizza) que se fatia, com os valores contando. Sem números: a forma da tendência se desenha com ▲/▼ e o selo ILUSTRATIVO. Com `series`, as linhas com rótulo que se cruzam (o gráfico do exemplo). |
| destaque | `destaque` | Quadro cheio. A faixa de plantão de ponta a ponta: bloco vermelho com o triângulo (alerta) ou azul com o losango (chave) e a frase grande; o detalhe numa tarja escura. |
| definição | `definicao` | Quadro cheio. O GC de verbete: o termo na tarja branca e, embaixo, a tarja escura com "=" e o significado, que acende quando é dito. |
| frase | `frase` | Painel. A citação: aspas azuis, o texto em caixa-alta palavra por palavra, o `destaque` numa tarja branca, o `risco` riscado por um traço branco. |
| pergunta | `pergunta` | Sem opções: quadro cheio, GC com o "?" na aba. Com opções: painel de enquete, opções A, B, C em tarjas que acendem no tempo de cada uma. |
| fechamento | `cta` | Quadro cheio. GC com a chamada palavra por palavra, tarja de nome e o botão na aba: "Seguir" vira "Seguindo", "Salvar" vira "Salvo"; `link` mostra o elo ("Acesse"). |
| **assinatura** | `etiqueta` | Painel. A etiqueta de preço deitada: nasce a lápis, acende no valor de antes e sobe (ou desce) na diagonal pelo trilho até a vaga do valor novo, que rola como placar. Números ou palavras. |
| **assinatura** | `nota` | Painel. Uma nota fictícia (o valor impresso) chega, ganha o selo de pausa e encolhe na palavra da perda; fica o contorno do tamanho original. |
| **assinatura** | `manchete` | Quadro cheio. O GC clássico: chapéu na aba, manchete na tarja branca, tarja de nome. |
| **assinatura** | `vinheta` | Quadro cheio. A placa azul com uma palavra gigante ("ENTENDA", "ALERTA") e o cronômetro que dispara no número do subtítulo. Só na abertura. |
| número já escrito | `dado` | Como o `numero`, com o valor em texto ("10,5%"). Formato antigo; prefira `numero`. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa (`tendencia` no gráfico, palavras na etiqueta e na nota).

## A assinatura em qualquer assunto

A assinatura do Plantão é **o telejornal explicando**: a tarja que apresenta o assunto e o painel do estúdio que transforma a ideia num objeto que se mexe. Duas peças levam qualquer assunto:
- a **etiqueta** = "era isto, passou a ser aquilo" (um preço, um estado, uma fase, uma promessa e a realidade);
- a **nota** = "tem valor, mas perde força" (dinheiro, tempo, energia, confiança).

1. **Finanças / cripto.** "Mas o mercado subindo não significa dinheiro no bolso… mesmo na alta, tem gente que perde."
   - `etiqueta` com `sentido: "desce"`: antes {rótulo "O mercado", valor "Subindo"} → depois {rótulo "No bolso", valor "Sem dinheiro"}, a etiqueta desce na palavra "não".
   - `nota`: rótulo "Mesmo na alta", valor "Dinheiro", símbolo "US$"; encolhe em "tem gente que perde".
2. **Saúde / pets.** "Três alimentos que parecem inofensivos e fazem mal para o seu cachorro."
   - `etiqueta` descendo: `taxa` {rótulo "Alimentos", valor "3"}, antes {"Parecem", "Inofensivos"} → depois {"Para o seu cachorro", "Fazem mal"}.
   - Rotina: "eu dormia 5 horas, hoje durmo 8" → `etiqueta` subindo, antes {"Eu dormia", "5 horas"} → depois {"Hoje durmo", "8 horas"}, selo "+3 h".
3. **Bem distante (relacionamento, carreira, história pessoal).**
   - "Quando a gente para de conversar, o carinho continua lá, mas vai encolhendo" → `nota`: rótulo "Sem conversa", valor "Carinho" (sem símbolo), encolhe em "vai encolhendo".
   - "Eu era estagiário, três anos depois virei gerente" → `etiqueta` subindo: antes {"Eu era", "Estagiário"} → depois {"Três anos depois", "Gerente"}.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Impulso"), sem mudar o sentido.
- Não invente número, nome, preço, taxa, fonte nem fato. Confira toda conta (`diferenca` = depois − antes).
- Formas sem números (linha da tendência, nota que encolhe, etiqueta de palavras) são metáforas: a etiqueta "ilustrativo" aparece sozinha nos gráficos sem dados; não ponha porcentagens que não foram ditas.
- O canal é fictício: nada de logotipo, vinheta ou nome de emissora real. Se o usuário pedir a marca de uma emissora de verdade, use o nome dele no lugar.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`. Assinatura ausente: use a `etiqueta` ou a `nota` como metáfora, ou abra com uma `manchete`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Uma palavra acende cedo ou tarde demais**: o template procura as palavras do texto na fala a partir do `em` (ou do começo do momento). Use no texto as palavras que a pessoa diz, na ordem em que diz, e confira o `em` em `work/palavras.json`.
- **Texto pequeno demais**: o bloco reduz o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala.
- **A tarja encosta no queixo ou a cabeça encosta na barra EXPLICANDO**: meça de novo o queixo em `work/medir-*.jpg` e refaça o corte com o `--queixo-y` certo.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
