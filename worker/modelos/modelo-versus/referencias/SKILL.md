---
name: modelo-versus
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Versus, a tela de luta: em cima, as duas imagens se encaram em painéis inclinados com um VS no meio; cada rodada ganha ícone, uma barra de cada lado que enche com a fala e um ponto no placar; no fim, placar final e perfis (\"pra quem é cada um\"). A pessoa fica embaixo numa moldura larga. Funciona sem foto, com o nome gigante no painel. Kanit itálica, vermelho e azul-ciano sobre grafite. Serve para qualquer A contra B (produtos, serviços, métodos, dinheiro, carreira, treinos): a IA traduz a fala para os blocos do estilo e busca as imagens. Use quando o usuário pedir \"modelo Versus\", \"A contra B\", \"X ou Y\", \"isso ou aquilo\", \"comparação em rodadas\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Versus

O vídeo vira uma luta: a pessoa embaixo, a arena em cima. Primeiro as duas imagens **se encaram** (cada uma entra do seu canto e o **VS** bate no meio); depois cada **rodada** traz um ícone, uma barra de cada lado que **enche** quando a pessoa fala daquele lado e um **ponto** que cai no placar de quem vence; no fim, o **placar final** e os **perfis** ("pra quem é cada um") deslizam para o lado que serve a cada um. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com airfryer × forno elétrico, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** entradas secas e firmes, com golpe. Cada lado **entra do seu canto** em 0,38 s (A pela esquerda, B pela direita), o **VS** carimba grande e assenta (a arena treme 0,3 s e a pessoa leva um soco de zoom). Na rodada, o ícone e o critério saltam no meio, a barra de cada lado **sobe** em 0,5 s quando o lado é dito, e quem vence leva um carimbo **+1** na barra, o placar do alto bate e a barra de quem perdeu vira cinza. Os perfis do veredito nascem no centro e **deslizam** para o lado deles. Uma faixa vermelha, azul e âmbar cruza a arena na diagonal quando começa um bloco novo. Nada de fade, nada de brilho; a linha que divide os cantos anda para o lado de quem está mais forte.
- **Organização e hierarquia:** a tela é sempre dividida: **arena** em cima (y 128 a 908), **pessoa** embaixo (a partir de y 960), com uma costura vermelha e azul entre elas. Na rodada, o placar fica no alto (miniatura, nome e pontos de cada lado), o ícone e o critério no meio e uma barra de 306 px de cada lado, com o texto do lado numa placa embaixo dela. Uma ideia por vez.
- **Tipografia:** uma família só, **Kanit** (Google Fonts), larga e firme, com cara de cartaz de luta: itálico 800/900 em caixa alta para nomes, placar, rodadas e títulos; itálico 700 para o texto corrido. Nome do lado 34–66 px (150 px gigante quando não há foto); placar 140–190 px; critério 34–62 px. Nada condensado, nada com contorno.
- **Moldura da pessoa:** sempre numa moldura larga embaixo, de ponta a ponta (nunca coluna estreita, nunca janela pequena), com a cabeça inteira logo abaixo da costura e a legenda abaixo do queixo. O vídeo alterna 100% e 106% a cada corte e leva um soco de 7% a cada golpe (VS, rodada, ponto, placar). O rosto é seguido quadro a quadro.
- **Cores, textura e som:** grafite arroxeado (#16141C, arena #1E1B26) no fundo; **vermelho** (#FF4438) é o lado A e **azul-ciano** (#22B8F0) o lado B, cada um com borda escura embaixo; **âmbar** (#FFC233, texto escuro) para o VS, o ponto, o número da rodada e a palavra falada; **índigo** (#5B4BFF) só como a cor neutra dos blocos universais (títulos, tarjas); papel (#FFF7EC) nos cartões; cinza (#5E5A68) para quem perde. Sombras duras e curtas, cara de cartaz impresso, nunca brilho atrás da pessoa. Linhas de velocidade inclinadas andam devagar no fundo. Sons tonais e raros, bem abaixo da voz: um "vs" no encontro, um toque na rodada, um "ponto" no +1, um golpe no placar final, tiques nos perfis.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Curiosidades"): vão numa etiqueta embaixo da chamada final (se houver `cta`). Sem resposta, siga sem nome. Pergunte também se ele tem **imagens próprias** (produto, print, foto pessoal): elas vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas.

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
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Números curtos ditos sozinhos** ("Mil.", "Cem.") às vezes voltam como `[sem fala, sai]`. Antes de aceitar um item desses no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala. Se for fala, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo: `{ "em": 3.18, "ate": 3.4, "w": "Mil" }`).

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas viram cortes secos**, mas cada rodada precisa de espaço para a barra encher e o ponto bater (cerca de 1,5 s entre o fim de uma rodada e o começo da seguinte). Se a pessoa fala as rodadas coladinhas, **mantenha uma pausa curta** (0,2 a 0,3 s) antes de "rodada dois"; se o vídeo ficar longo demais, corte explicações em vez de apertar as pausas.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa fica sempre embaixo e o modelo reposiciona o quadro); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, as imagens e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a moldura de baixo acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto, com a cabeça inteira logo abaixo da costura (a linha rosa, y 960); as linhas amarelas são a faixa da legenda (abaixo do queixo, y ~1540); nada importante fora das linhas vermelhas (interface do aplicativo, e a coluna de botões à direita). **Ignore a caixa verde da zona do peito**: este modelo não a usa (a arena fica em cima). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: ache os **dois lados** da luta (A e B, e o instante em que cada um é nomeado), as **rodadas** (o critério de cada uma, o que a pessoa diz de cada lado, quem leva o ponto e quando) e o **veredito** ("pra quem é cada um": os perfis e o lado de cada um). Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura entra uma vez por luta**, sempre nesta ordem: um `versus`, uma ou mais `rodada` e um `veredito`. Abra com o `versus` (a pergunta "A ou B?" é o gancho) e, se houver espaço, feche com o `cta`.

- Sem rodadas explícitas ("isso é mais barato, aquilo é mais prático")? Cada critério que a pessoa compara vira uma rodada; o critério vira o `titulo` (curto: "Preço", "Tempo", "Espaço") e o ícone mais próximo.
- Sem veredito dito? Procure o "depende": "pra quem mora sozinho, A; pra família, B" já são os perfis. Se a pessoa só dá a opinião dela ("eu prefiro B"), use um `veredito` com um perfil e o `destaque` ou a `frase` para o resto.
- Só uma coisa (sem A contra B)? Procure o contraste escondido (antes × depois, mito × verdade, o que se diz × o que acontece) e use o `versus` com os dois lados desse contraste.

### 6b. Imagens

Leia `references/imagens.md`.

1. Liste as coisas que a pessoa nomeia como **lados** (obrigatório: uma imagem para cada lado do `versus`) e, se quiser, uma imagem de apoio por rodada (ex.: "lasanha" na rodada do espaço). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "air fryer"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
   - **Lados que não são coisas** ("à vista × parcelar", "esperar × comprar agora") **não precisam de imagem**: deixe o lado sem `imagem` e o painel vira um cartão colorido com o nome gigante.
2. `node scripts/imagens.mjs --lado 1600`: o painel é de ~500×590 px (fica nítido com 1000 px). Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Escolha a candidata que mostra a coisa inteira, reconhecível em 1 s, sem gente reconhecível, logo ou texto, de preferência com fundo limpo. Os dois lados ficam lado a lado: prefira duas fotos com enquadramento parecido.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` ou **não ponha `imagem`** no lado: ele vira o cartão colorido com o nome. **Uma luta inteira sem foto é um estilo válido.**
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos lados do `versus` (e na `rodada`), `imagem: { "id": "airfryer" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada lado, barra, ponto, perfil e imagem entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (o template ainda as quebra em telas de até 3 palavras).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "é fryer": "Airfryer" }`). A transcrição quase não põe ponto final entre as frases curtas ("Ponto para a Airfryer Rodada 2"): ponha o ponto em `correcoes` (`"Ponto para Airfryer": "Ponto para Airfryer."`) para a legenda nunca juntar duas frases numa linha. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade (para a luta, peça também quadros no VS, no fim de cada barra e no carimbo do ponto):
- os dois lados aparecem **inteiros** nos painéis, cada um com o nome legível, e o VS bate no meio sem esconder o assunto das imagens?
- em cada rodada, o ícone combina com o critério, a barra do lado certo enche quando a pessoa fala dele, o texto da placa cabe e o **+1** cai em quem a pessoa disse?
- o placar do alto confere com os pontos ditos? O **placar final** do veredito fica na tela por pelo menos 1,2 s com os dois perfis já nos lados?
- cada perfil foi para o lado que a pessoa disse?
- a legenda fica abaixo do queixo, sem cobrir o rosto, sem juntar duas frases e sem aparecer onde a arena já mostra o mesmo texto?
- o gancho aparece no primeiro quadro? O texto cabe (nada cortado)?
- nas trocas, nenhum texto sobre outro? Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 4.7 4.75 4.8 4.85 4.9`).
- nada importante fora das linhas da interface do app?

Corrija o plano (texto mais curto, outra imagem, outro foco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-versus.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- as **imagens usadas** e de onde vieram, e o texto do `creditos.txt` quando houver CC BY;
- o que é ilustrativo (a `forca` das barras é visual: mostra quem foi melhor, não um número medido; curvas de tendência e números marcados `ilustrativo`);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, quem leva o ponto numa rodada em que a pessoa não foi clara, uma imagem que só ele pode trocar por uma melhor).

## Blocos deste modelo

Todos os blocos acontecem **na arena** (a metade de cima); a pessoa fica embaixo o tempo todo.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | o gancho escrito em tarjas no meio da arena, palavra por palavra em menos de 1 s, o `destaque` na tarja índigo; com `imagem`, por cima de uma foto que cobre a arena |
| lista | `topicos` | título branco com traço índigo; cada item é um cartão de papel que salta no seu `em` (com a foto do item numa bolinha, se tiver `imagem`); o item da vez fica índigo |
| passos | `passos` | cartões numerados ligados por um traço índigo que desce até o passo da vez |
| número | `numero` | o número conta numa placa escura gigante (pt-BR), o rótulo carimba numa tarja índigo embaixo; com `imagem`, por cima da foto |
| comparação | `comparacao` | dois cartões que se encaram (rótulo na tarja, texto grande), VS no meio; o vencedor ganha borda índigo, o outro fica cinza. Para uma luta com rodadas e placar use o `versus`: a `comparacao` é só um "isso ou aquilo" de uma frase |
| gráfico | `grafico` | barras de papel com a maior em índigo, linha índigo que anda de ponto em ponto, rosca colorida; sem números ditos, a curva da tendência com "ILUSTRATIVO" |
| destaque | `destaque` | a palavra carimbada em tarja índigo (`chave`) ou âmbar com texto escuro (`alerta`), inclinada; `detalhe` numa placa escura menor embaixo |
| definição | `definicao` | o termo enorme em branco, um traço índigo que se desenha embaixo, o significado num cartão de papel que sobe na fala |
| frase | `frase` | a frase em tarjas no meio da arena, palavra por palavra na fala, com um selo índigo de aspas; `destaque` e `risco` em índigo |
| pergunta | `pergunta` | a pergunta grande em branco; as `opcoes` entram como opções de enquete, a mais recente fica índigo; sem opções, um "?" índigo balançando |
| fechamento | `cta` | a chamada em tarjas, ícone num círculo índigo com um anel que pulsa (`salvar`, `seguir`, `comentar`, `link`), etiqueta com nome e área; fica até o último quadro |
| **assinatura** | `versus` | a tela de luta: A entra pela esquerda (vermelho), B pela direita (azul-ciano), cada um no `em` da palavra que o nomeia, em painéis inclinados com a imagem (ou o nome gigante, sem imagem); o **VS** âmbar carimba quando os dois estão na tela; `titulo` opcional (a pergunta) numa placa no alto |
| **assinatura** | `rodada` | placar no alto (miniaturas, nomes, pontos); no meio, "RODADA N", o ícone (`tempo`, `espaco`, `energia`, `dinheiro`, `qualidade`, `saude`, `sabor`, `facilidade`, `seguranca`, `pessoas`) e o critério; uma barra de cada lado que enche no `em` de cada lado, com o `texto` curto numa placa embaixo; o `vencedor` leva o **+1** (a outra barra vira cinza) ou "EMPATE"; `imagem` bate grande e encolhe para uma medalha no alto da barra do lado dela |
| **assinatura** | `veredito` | o placar final bate grande (cada lado na sua cor, quem lidera ganha um aro âmbar), "Pra quem é cada um?" e os perfis: cada cartão de papel nasce no centro e desliza para o lado que serve a ele; 1 a 4 perfis |

## A assinatura em qualquer assunto

A luta é **"duas opções, um critério por vez, um jeito de decidir"**: qualquer "isso ou aquilo" vira dois cantos, rodadas que enchem barras e um veredito que divide por perfil, porque quase toda comparação boa termina em "depende de quem você é". Os lados podem ser coisas (foto) ou ideias (nome gigante, sem foto). Cada lado precisa de **um nome curto** (até ~16 caracteres) e cada rodada, de **um critério** (até ~14 caracteres) e do **instante em que cada lado é falado**.

1. **Finanças/cripto.** "Comprar por impulso ou entender antes de decidir? Rodada um, risco: quem compra por impulso assume risco que não entende. Ponto pra quem entende. No fim, se você quer decidir com calma, entende antes."
   `versus` com os lados "Por impulso" e "Com critério" (sem imagem: painéis coloridos com o nome gigante); `rodada` com `titulo: "Risco"`, `icone: "seguranca"`, `a.texto: "risco que não entende"`, `vencedor: 1`; `veredito` com o perfil "Entender antes de decidir" no lado B. Nada de número de lucro: só o que foi dito.
2. **Saúde ou rotina.** "Treinar de manhã ou à noite? Rodada um, energia: de manhã eu rendo mais. Ponto pra manhã. Rodada dois, sono: treinar tarde me deixa agitado. Ponto pra manhã também. Mas quem só tem tempo à noite, treina à noite."
   `versus` com "De manhã" × "À noite" (fotos de academia opcionais), duas `rodada` (`energia`, `sono` → ícone `saude`) e `veredito` com os perfis "Rende mais cedo" (A) e "Só tem tempo à noite" (B). O placar 2 × 0 e o perfil do B mostram que o ponto não decide tudo.
3. **Algo bem distante (carreira ou relacionamento).** "Aceitar a proposta ou ficar onde estou? Rodada um, dinheiro: a proposta paga mais. Rodada dois, tranquilidade: aqui eu durmo em paz. Empate. Se você está começando, aceita. Se tem filho pequeno, fica."
   `versus` com "Aceitar" × "Ficar" (sem imagem), duas rodadas (`dinheiro` vence A; `pessoas` ou `saude` vence B), `veredito` com dois perfis nos lados. Se a pessoa disser "empate", `vencedor: "empate"`.

Sem A contra B no vídeo? Procure o contraste escondido (antes × depois, mito × verdade, o que se diz × o que acontece); se não houver nenhum, use `topicos`/`passos` para o que não for luta, mas toda edição tem um `versus`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("esquenta em dois, três minutos" vira "2 a 3 min").
- Não invente número, nome, preço nem fato. **Quem vence cada rodada é o que a pessoa disse**: nunca decida o ponto por conta própria; se ela não disse quem ganhou, deixe sem `vencedor` (a rodada fica sem ponto) ou use `"empate"` só quando ela disser. O texto de cada lado é só o que ela falou daquele lado: um lado que ela não comentou fica sem `texto` (a barra sobe com `forca` baixa ou nem sobe).
- `forca` (0 a 1) é só visual: quem vence enche mais. Não representa um número medido; não escreva um número na barra que a pessoa não disse.
- A imagem ilustra o que foi dito; não mostra uma marca, uma pessoa real ou um "print" que a fala não citou. O placar do alto e o do veredito são a **soma dos pontos ditos**.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Num vão entre duas rodadas, cabe um `destaque` ou um `numero` na arena. Não use `--forcar`.
- **A pessoa fala as rodadas coladas**: mantenha uma pausa curta no passo 3, ou use `rodada` sem `imagem` e sem `texto` nos lados (só as barras), que é o mais rápido.
- **A imagem tem pouca resolução, texto ou marca d'água**: outra candidata (`--lado 1600`), outro foco, ou nenhuma imagem naquele lado (o cartão colorido com o nome). Imagem feia é pior que cartão.
- **A busca trouxe quadros, logotipos ou algo errado**: busque em inglês e pelo nome mais específico, ou peça a foto ao usuário (`imagens/`).
- **O nome do lado não cabe**: o painel reduz o corpo até 56 px e quebra em até 3 linhas (sem imagem) ou 34 px em uma linha (com imagem); se ainda ficar apertado, encurte o `nome` (até ~16 caracteres).
- **Mais de 4 rodadas**: o placar do alto continua legível, mas a luta cansa; agrupe critérios parecidos ou use um segundo `versus` depois do veredito.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache. Rode de novo mais tarde para os que ficaram sem imagem.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
