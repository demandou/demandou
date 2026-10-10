---
name: modelo-roteiro
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Roteiro: um roteiro de viagem ilustrado que se desenha na fala (cartão de embarque, mapa em areia e azulejo com a rota andando de pino em pino, barra do dia com o sol, cartões-postais com carimbo, a pessoa viajando num postal, fechamento em página de passaporte). Serve para qualquer assunto (o exemplo do modelo é um dia em Lisboa, mas funciona com finanças, saúde, vendas, aulas, histórias…): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Roteiro\", \"estilo roteiro de viagem\", \"com mapa\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual, inclusive para viagem, passeio, roteiro ou guia local. Entrega um MP4 vertical 1080×1920 renderizado com Remotion."
---

# Modelo Roteiro

O vídeo vira um roteiro de viagem que se desenha enquanto a pessoa fala. Ela abre em tela cheia com um cartão de embarque; quando explica algo, encolhe para um cartão-postal e a tela vira um mapa ilustrado, onde a rota anda de pino em pino, o sol atravessa o dia e cada ideia ganha um cartão com carimbo; no fim ela volta para a tela cheia com uma página de passaporte. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, renderizar); você faz a parte de editor (escolher as tomadas, fazer o mapa editorial, montar o plano, conferir o resultado).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um dia em Lisboa, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo está esboçado a lápis e ganha tinta no instante em que é dito: a rota pontilhada anda de pino em pino, o pino cai e assenta, o carimbo bate decidido, o sol percorre um arco, a câmera do mapa acompanha a viagem. Entra decidido e assenta, sem quique; nada fica parado por mais de ~2,5 s.
- **Organização e hierarquia:** uma ideia por tela. Em tela cheia, um papel grande na altura do peito (abaixo do queixo). No mapa, a pessoa num postal no alto, o mapa com os pinos no meio e, embaixo, os cartões do que está sendo dito: o item da vez em tinta, o resto a lápis. Título do bloco numa cartela no alto, rótulos pequenos em caixa alta.
- **Tipografia:** Fraunces (serifada de exibição; 600 a 700 em nomes, números e títulos, itálico nas ênfases) e Fira Sans (rótulos em caixa alta espaçada, chips, detalhes). Nada abaixo de 30 px; o texto diminui para caber, nunca vaza.
- **Moldura da pessoa:** dois lugares. Quadro cheio, com o rosto na linha do centro, ou o cartão-postal (moldura de papel, selo, nome e área) com ~400 a 512 px, que viaja junto com a rota e troca de lado quando a viagem muda de direção. A troca leva 0,75 s, começa num corte e nunca deixa quadro vazio nem dois papéis um sobre o outro. A moldura segue o rosto.
- **Cores, textura e som:** areia (o chão do mapa), papel (os cartões), céu (a água), **um** azul de azulejo para o assunto e o amarelo do sol só no sol; telha (vermelho) só para o problema: alerta, lado errado, risco, carimbo de "evite". Sons tonais e raros: acorde na abertura, uma nota por pino, um "tum" grave por carimbo.

## Antes de começar

1. **Carregue a skill do Remotion** (`remotion-best-practices`). Este modelo é um projeto Remotion e as regras dela valem aqui. Se não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. Três ressalvas, porque aqui o projeto já vem pronto: não precisa carregar `remotion-create` nem abrir o Studio (os quadros do `stills.mjs` são a prévia), e o pedido de edição já é o pedido para renderizar.
2. Confirme o caminho do vídeo. Se o usuário não disse o **nome e a área** de quem aparece (ex.: "Carla" / "Viagens"), pergunte uma vez: o nome vai no cartão de embarque (passageiro), no rodapé do postal e no topo do passaporte. Sem resposta, siga sem nome.
3. Se o vídeo fala de **lugares reais** (uma cidade, um roteiro), confirme a cidade ou região: o mapa é desenhado por você a partir da geografia real (seção "O mapa" de `references/plano.md`); não use mapa da internet nem imagem de satélite. Se o assunto não é um lugar, não precisa de mapa: o template desenha um mapa genérico.
4. Requisitos: Node 18+ e uns 3,5 GB livres na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto em si, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).

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

- **tentativas abandonadas e repetidas** — a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala — ouça com atenção, costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (sem como ouvir, meça o volume com `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`: perto de −60 dB é silêncio).

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a que combina com onde o vídeo vai ser postado e, na dúvida, com a última. Diga na entrega qual ficou e por quê.

Neste modelo, **as pausas entre frases viram cortes, e é nos cortes que o layout muda** (a pessoa encolhe para o postal ou volta para a tela cheia; a rota parte para a próxima parada). Mantenha a proposta do `preparar`: cada trecho de fala separado. Pausas curtas dentro de uma frase (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.495 --rosto-y 0.31 --queixo-y 0.44
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` na raiz do projeto fixa gravação vertical em 9:16 (a pessoa vai e volta do postal, e o 9:16 amplia menos o vídeo — fica mais nítido); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, o mapa, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto (a linha vertical fina é o centro do quadro — o rosto deve estar nela); a caixa azul tracejada (zona dos cartões de tela cheia: embarque e passaporte) deve começar abaixo do queixo; a caixa verde é onde a pessoa está naquele instante; a amarela é a legenda; nada importante abaixo da linha vermelha (interface do aplicativo). Nos quadros de mapa aparecem também a barra do dia e a faixa dos cartões das paradas (laranja). Se a cruz não cair no rosto, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial e plano

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: cada batida ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`parada`) entra pelo menos uma vez, de forma metafórica se o assunto não for um lugar.

Depois leia `references/plano.md` (os campos de todos os blocos, limites de texto, o mapa e regras de tempo) e preencha em `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes` (e `mapa`/`dia`, só quando a fala é sobre lugares e horas do dia).

Quando a fala é de viagem, pense como quem monta um roteiro: **cada lugar dito é uma parada** (pino e cartão-postal); o transporte dito vira bilhete e veículo andando na rota; a hora do dia dita move o sol. Tudo na tela é fiel ao que a pessoa disse **e verdadeiro**: não invente horário, preço, distância, número de linha, número ou fato. Nomes que a transcrição errou vão em `correcoes`; só corrija o que você tem certeza.

Depois de preencher:

```bash
node scripts/conferir.mjs --mapa   # corrija até APROVADO; nunca use --forcar
node scripts/legendas.mjs
```

### 7. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`: o período, o trajeto, a linha, cada lugar, a ligação, o carimbo, os ícones da dica, o marcador do fechamento) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:

- o **rosto** aparece inteiro no postal e nada passa por cima dele;
- os **pinos** estão no lugar certo do mapa (o lugar de beira-rio na margem, o mirante no morro), nenhum pino fica embaixo do postal ou dos cartões no instante em que cai, e nenhum rótulo de bairro fica atrás de um pino;
- a **rota** passa por terra (não atravessa o rio sem ponte, a não ser de barco) e o veículo anda no trecho certo;
- os **cartões** cabem: nome inteiro, sem letra cortada, acentos certos, carimbo sem cobrir o nome;
- o **sol** está no rótulo certo da barra do dia.

Confira também o meio das trocas de layout (o `de` do primeiro momento de mapa + 0,3 s e o `de` do fechamento + 0,3 s, por exemplo `node scripts/stills.mjs 2.7 15.3`): o mapa já aparece com conteúdo enquanto a pessoa encolhe ou cresce. Corrija o plano e repita até estar limpo.

### 8. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-roteiro.mp4"
```

Renderiza e normaliza o áudio. Entregue o caminho do arquivo e um resumo curto: duração final, quanto foi cortado, as paradas e o transporte que entraram, e o que o usuário deve conferir (a posição de um lugar no mapa que você estimou, uma palavra que a transcrição pode ter errado, uma tomada que você escolheu no lugar dele).

## O estilo em uma frase

Um roteiro de viagem que se desenha na hora: tudo está esboçado a lápis e ganha tinta de azulejo quando é dito — a rota de pino em pino, o nome de cada lugar, o sol que atravessa o dia, o carimbo de "visitado" —, com a pessoa viajando num cartão-postal sobre um mapa ilustrado em areia e céu. Detalhes e o que pode ou não ser mudado estão em `references/estilo.md` — leia antes de alterar qualquer componente ou cor.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `embarque`) | cartão de embarque no peito; o texto ganha tinta palavra por palavra e o aviãozinho cruza o bilhete |
| lista | `topicos` | pinos que caem no mapa, um por item, e um guia de papel embaixo com marcadores de azulejo |
| passos | `passos` | a rota anda de pino numerado em pino numerado; o itinerário embaixo se preenche |
| número | `numero` | etiqueta de bagagem; o número conta em pt-BR enquanto o marcador anda na escala do mapa |
| comparação | `comparacao` | a rota se divide em dois caminhos e dois cartões-postais; o lado vencedor ganha carimbo |
| gráfico | `grafico` | quarteirões que crescem, rota com pinos nos valores ou carimbo redondo; sem números, o perfil de um caminho com "ilustrativo" |
| destaque | `destaque` | papel com texto grande e um carimbo redondo que bate (telha no alerta, azulejo na chave) |
| definição | `definicao` | placa de rua de azulejo com o termo; a rota desce até o significado |
| frase | `frase` | verso de cartão-postal com o texto à mão; o que é riscado ganha risco de telha |
| pergunta | `pergunta` | formulário de desembarque com caixinhas que ganham visto |
| fechamento | `cta` | página de passaporte com carimbos e a vaga a lápis do próximo roteiro |
| **assinatura** | `parada` | a rota chega ao pino, o cartão-postal ganha tinta e o carimbo bate |
| outros | `dica` | o mapa se afasta e mostra a rota inteira com um conselho |

## A assinatura em qualquer assunto

A parada mostra **"uma jornada em etapas"**: cada etapa é um pino no caminho, com um cartão e um carimbo no fim. Serve para qualquer sequência de pontos pelos quais se passa: erros que levam a um prejuízo, estações de um método, fases de uma rotina, capítulos de uma história. O lugar pode ser só um nome (sem `x`, `y` nem `desenho`); o cartão mostra um pedaço de mapa com o pino.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   Duas paradas: [`Compra por impulso`, `Moeda sem critério`] e [`Risco que não entende`] com `carimbo: { "texto": "Evite", "alerta": true }`. A rota do prejuízo anda de pino em pino e o último carimbo bate em telha.
2. **Saúde (postura).** "Ajusta a tela na altura dos olhos, os pés no chão e os cotovelos perto do corpo."
   Uma parada por ajuste, com `nome` curto ("Tela na altura dos olhos") e `carimbo: { "texto": "Ajuste" }`; ou `passos` se a ordem importa. Uma cifra dita ("joelhos em 90 graus") vira `numero` com `sufixo: "°"`.
3. **Relacionamento ou carreira (história pessoal).** "Primeiro a gente se ignorou, depois conversou, só então fez as pazes."
   Três lugares nomeados "Silêncio", "Conversa" e "Paz", em duas paradas, com `ligacao` ("depois", "só então") só se for dito; ou `passos` sem posição no mapa.

Outros usos: etapas de um funil de vendas, de um treino, de uma receita, de um processo no trabalho. Se a fala não tem etapas, use outro bloco da tabela: toda fala tem uma forma (veja `references/adaptar.md`).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, linha de transporte nem fato.
- Número ilustrativo só onde o bloco permite (`grafico` sem `dados`), com a etiqueta "ilustrativo" visível.

## Quando algo dá errado

- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele; não use `--forcar`.
- **Pino escondido atrás do postal ou dos cartões**: o mapa enquadra cada parada com o pino à direita (postal à esquerda) ou à esquerda (postal à direita), conforme a direção da viagem. Se um pino de uma parada com dois lugares cair embaixo do postal, aproxime os dois lugares no mapa ou ajuste as coordenadas (o mapa é abstrato: pode encurtar distâncias).
- **Rosto pequeno ou cortado no postal**: ajuste `postal.zoom` (1,6 a 2,6) e `postal.ancoraY` (0,3 a 0,5) no plano.
- **Texto pequeno demais num cartão**: o nome passou do limite e encolheu; encurte conforme `references/plano.md`.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
