---
name: modelo-tatica
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Tática: um programa de análise de TV esportiva. Em quadro cheio, tarjas de TV na altura do peito; quando explica algo, a pessoa vira o comentarista numa caixa de transmissão no canto e a tela vira uma prancheta de giz sobre a grama, com fichas que andam, passes tracejados, a bola que rola e o gol com zonas que acendem, sob o placar \"DICA 1/3\". Verde de campo, giz, amarelo de placar e preto de TV, fonte larga e pesada. Serve para qualquer assunto (o exemplo do modelo é uma pelada de futebol, mas funciona com finanças, saúde, vendas, aulas, histórias…): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Tática\", \"estilo prancheta\", \"estilo TV esportiva\", \"com placar\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920 renderizado com Remotion."
---

# Modelo Tática

O vídeo vira um programa de análise na TV. A pessoa abre em quadro cheio com uma tarja de TV na altura do peito; quando explica algo, encolhe para uma caixa de transmissão no canto (como um comentarista) e a tela vira uma prancheta de giz, onde o assunto se desenha no ritmo da fala: fichas entram, setas tracejadas se desenham, a bola rola, zonas acendem. Entre uma explicação e outra ela volta ao quadro cheio. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, renderizar); você faz a parte de editor (escolher as tomadas, fazer o mapa editorial, montar o plano, conferir o resultado).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com futebol, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** entra decidido e assenta, sem quique. Tarjas de TV varrem da esquerda para a direita (só o fundo; o texto aparece inteiro); cada palavra sobe de trás de uma régua no instante em que é dita, já esboçada em apagado. Na prancheta, fichas crescem do chão, a seta tracejada de um passe se desenha e a bola rola junto, zonas e áreas acendem em amarelo, a câmera "entra" no gol. A pessoa encolhe e cresce em 0,52 s com a prancheta já desenhada atrás.
- **Organização e hierarquia:** uma ideia por tela. Em quadro cheio, uma tarja grande na altura do peito (quadrado amarelo para número ou "?", tarja escura para o texto). Na prancheta, o título da vez em letras grandes à esquerda da caixa de transmissão e o diagrama embaixo, com etiquetas curtas. Placar "DICA 1/3" no canto.
- **Tipografia:** Hubot Sans, uma família só, em dois cortes: larga, pesada e em caixa-alta (placar, títulos, números, itens) e normal (apoio, legenda). Nada abaixo de 30 px; o texto diminui para caber, nunca vaza.
- **Moldura da pessoa:** dois lugares. Quadro cheio, com o rosto na linha do centro; ou a **caixa de transmissão** no canto de cima à direita (384 × 486 px, fio claro e tarja com nome e área). Nunca numa coluna estreita ao lado. A moldura segue o rosto.
- **Cores, textura e som:** verde de gramado com faixas de corte, giz, um amarelo de placar (só para o que é assunto: nosso time, chute, zona acesa, números) e o preto de TV (tarjas e adversário). Sons tonais e raros: "vum" grave quando a prancheta entra, nota de placar nas tarjas, toque de bola nos passes.

## Antes de começar

1. **Carregue a skill do Remotion** (`remotion-best-practices`). Este modelo é um projeto Remotion e as regras dela valem aqui. Se não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. Três ressalvas, porque aqui o projeto já vem pronto: não precisa carregar `remotion-create` nem abrir o Studio (os quadros do `stills.mjs` são a prévia), e o pedido de edição já é o pedido para renderizar.
2. Confirme o caminho do vídeo. Se o usuário não disse o **nome e a área** de quem aparece (ex.: "Carla" / "Preparadora de goleiros"), pergunte uma vez: o nome e a área vão na tarja da caixa de transmissão e na tarja do fechamento. Sem resposta, siga sem nome (a caixa fica sem tarja e o fechamento fica só com a chamada).
3. Requisitos: Node 18+ e uns 3,5 GB livres na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto em si, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).

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

**Cuidado com a numeração das dicas.** Neste modelo a pessoa costuma dizer "Um:", "Dois:", "Três:" sozinhos, com pausa antes e depois. Um "Um" curto pode voltar como `[sem fala, sai]` (o Whisper descarta palavra muito curta). Antes de aceitar qualquer item `[sem fala, sai]` no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala. Se for o número da dica, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo: `{ "em": 3.18, "ate": 3.36, "w": "1." }`, com os tempos tirados do `silencedetect`), para ela entrar na linha do tempo.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo, **as pausas antes de cada dica viram cortes, e é nelas que a pessoa sai da caixa e volta ao quadro cheio** (o movimento esconde o pulo do corte). Mantenha a proposta do `preparar`: cada trecho de fala separado. Pausas curtas dentro de uma frase (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.495 --rosto-y 0.31 --queixo-y 0.43
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` na raiz do projeto fixa a gravação vertical em 9:16 (a pessoa muda de lugar entre o quadro cheio e a caixa de transmissão, e o 9:16 amplia menos o vídeo); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto e a linha vertical fina mostra o centro do quadro (o rosto deve estar nela); a caixa azul tracejada (artes de quadro cheio) deve começar abaixo do queixo; a roxa é a caixa de transmissão do canto (o rosto aparece inteiro nela durante as dicas); as laranja são o placar "DICA 1/3" e o cabeçalho da dica; a amarela é a legenda; tudo acima da linha vermelha (interface do aplicativo). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Planejar os momentos e montar os lances

Leia `references/plano.md` — a gramática (quadro cheio × prancheta), cada componente, o sistema de coordenadas do campo, as zonas do gol, os limites de texto e as regras de tempo — e preencha em `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`.

Antes de planejar, faça o mapa editorial (`references/adaptar.md`): cada batida da fala ganha uma forma (lista, passos, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo, e vai para `work/mapa.md`. A assinatura (`dica`) entra pelo menos uma vez.

Pense como o analista do programa: **cada dica é um lance**. Desenhe só o que explica a dica: os jogadores que importam (3 a 6 fichas), a bola, e as ações na ordem em que são ditas — o passe tracejado quando a pessoa fala da bola chegando, o chute amarelo quando diz "chuta", o cone quando diz "olha", a etiqueta quando nomeia alguém, a câmera entrando no gol quando fala do canto, as zonas acendendo quando diz "rasteiro" ou "canto oposto". Cada ação no `em` da palavra que ela ilustra. Tudo que aparece na tela tem que ser fiel ao que a pessoa disse; não invente regra, número nem jogada que contradiga a fala.

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza.

Depois de preencher, rode `node scripts/conferir.mjs --mapa` e corrija até **APROVADO** (nunca use `--forcar`); então `node scripts/legendas.mjs`: ele lista as linhas de legenda com o tempo (só existem nos trechos sem momento) e marca linha com palavra sozinha ou terminando em "de", "e", "um".

### 7. Conferir os momentos

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`: a entrada da prancheta, cada ação do campo, a entrada no gol, cada zona, o chute, o pulo do goleiro, cada item do resumo) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade: o título cabe ao lado da caixa de transmissão? As fichas estão dentro da tela (nada atrás dos botões do app, à direita embaixo)? A seta do passe sai de quem passa e chega em quem recebe? O chute vai para o canto certo (esquerda e direita de quem olha a tela)? A etiqueta cobre alguma ficha? A zona certa acendeu? O rosto aparece inteiro na caixa? Confira também o **meio das trocas** (o `pranchetaEm` de cada dica, e o `ate` dela − 0,1 s): a prancheta tem que aparecer já desenhada atrás da pessoa que encolhe, e a arte de quadro cheio só entra quando a pessoa já cobriu a prancheta. Corrija o plano e repita até estar limpo.

### 8. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-tatica.mp4"
```

Renderiza e normaliza o áudio. Entregue o caminho do arquivo e um resumo curto: duração final, quanto foi cortado, quais momentos e lances entraram, e o que o usuário deve conferir (uma tomada em que você ficou em dúvida, uma palavra que a transcrição pode ter errado, um lance que você simplificou).

## O estilo em uma frase

Um programa de análise na TV: a pessoa é o comentarista, a prancheta de giz mostra o lance se desenhando no ritmo da fala, e o pacote gráfico (placar "1/3", vinheta "DICA 2", tarjas) é sóbrio — verde de campo, giz, um amarelo de placar e o preto de TV, fonte larga e pesada. Detalhes e o que pode ou não ser mudado estão em `references/estilo.md` — leia antes de alterar qualquer componente ou cor.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | tarja de TV com o título que acende palavra por palavra; um número no começo vira o numeral no quadrado amarelo; uma bola rola sobre a tarja |
| lista | `topicos` | prancheta: fichas amarelas entram no gramado, cada uma com uma tarja de TV com o item |
| passos | `passos` | prancheta: fichas numeradas ligadas por passes tracejados; a bola rola de uma à próxima |
| número | `numero` | placar de TV: o número conta dentro de uma faixa amarela, com o rótulo na tarja escura |
| comparação | `comparacao` | prancheta: o campo dividido ao meio por giz, uma ficha e uma tarja de cada lado; o lado vencedor acende |
| gráfico | `grafico` | prancheta: barras amarelas, rota de giz com fichas ou círculo central dividido; sem números, a curva com a bola e "ilustrativo" |
| destaque | `destaque` | tarja que bate forte: amarelo cheio com a etiqueta "Atenção" (alerta) ou tarja escura com "Anote" (chave) |
| definição | `definicao` | tarja de glossário: o termo na faixa amarela e o significado na tarja escura, ligados por um "=" |
| frase | `frase` | tarja de TV com a frase; o que é riscado ganha um traço amarelo |
| pergunta | `pergunta` | tarja com o "?" no quadrado amarelo; as opções viram uma enquete A, B, C com vistos |
| fechamento | `cta` | tarja de nome e faixa amarela com a chamada e o botão (seguir, salvar, comentar ou link) |
| **assinatura** | `dica` | vinheta "DICA N", prancheta com o diagrama (fichas com nomes livres, passes, destaques, o gol) e o placar |
| outros | `resumo` | tarja com os itens que se marcam um a um e, se quiser, o placar "? × ?" do resultado |

## A assinatura em qualquer assunto

A `dica` mostra **"uma jogada desenhada na prancheta"**: quem está em campo, como a bola passa de um para outro, onde há espaço. Qualquer fala com atores e relações vira jogada: fichas são pessoas, etapas, ideias ou erros (com `rotulo` livre); o passe é o fluxo ("leva a", "vira"); o destaque nomeia o ponto crítico; as zonas do gol marcam alvos ou resultados. Nada de futebol na tela é obrigatório: use só fichas, passes e etiquetas.

1. **Finanças/cripto.** "Tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   Uma `dica` com `campo`: a ficha `Você` (nosso, número 1) e três fichas adversárias com `rotulo` "Impulso", "Sem critério" e "Risco"; um `passe` de uma para a outra, cada um no `em` da palavra, e um `destaque` na última com `rotulo` "Prejuízo".
2. **Saúde (sono).** "Evita tela uma hora antes e deixa o quarto escuro e fresco."
   `dica` com fichas "Você", "Tela" e "Quarto", `passe` de "Tela" para fora do campo (uma `corrida` da ficha para a lateral) e `espaco` ou `zona` acesa no gol com `rotulo` "Sono".
3. **Relacionamento ou carreira.** "Primeiro ouve, depois responde, só então decide."
   Três fichas nossas "Ouvir", "Responder" e "Decidir" ligadas por `passe` com `rotulo` ("depois", "só então"); ou o bloco `passos`, se a ordem é tudo.

Outros usos: fases de um treino, de um funil, de um processo; "quem passa a bola para quem" em equipes, famílias, ferramentas. Se a fala não tem atores nem relações, use outro bloco da tabela: toda fala tem uma forma (veja `references/adaptar.md`).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, regra nem fato.
- Número ilustrativo só onde o bloco permite (`grafico` sem `dados`), com a etiqueta "ilustrativo" visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele; não use `--forcar`.

- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **O número da dica sumiu do vídeo**: o "Um:" curto saiu como `[sem fala, sai]` no passo 3. Volte, meça o volume, marque `"manter": true` e rode o `cortar` de novo com `--manter-plano`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: passou do limite do componente; encurte conforme `references/plano.md`.
- **Ficha fora da tela ou atrás dos botões do app**: o campo mostra uns 26 m de largura na altura da marca do pênalti; mantenha as fichas entre x −11 e 11 (ver a tabela em `references/plano.md`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
