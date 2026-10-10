---
name: modelo-prompt
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Prompt: uma bancada cinza-clara onde as ideias se montam com peças coloridas que encaixam como blocos com dente (o texto de cada peça é digitado no ritmo da fala), num chat fictício em que o que é vago chega cinza e borrado e o que é certo entra em foco. A pessoa muda de lugar a cada momento: tela cheia com um cartão no peito, janela larga no alto, janela no canto, janelinha ao lado. Serve para qualquer assunto (o exemplo é IA e prompts, mas funciona com finanças e cripto, saúde, odontologia, vendas, carreira, relacionamento, aulas): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Prompt\", \"estilo montagem de prompt\", \"estilo peças que encaixam\" ou \"estilo chat\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920 renderizado com Remotion."
---

# Modelo Prompt

Transforma uma gravação bruta (uma pessoa falando para a câmera) num vídeo vertical em que **cada ideia se monta na tela como um prompt**: peças coloridas encaixam uma na outra pelo dente, o texto de cada peça é digitado no instante em que é dito, e o que é vago aparece cinza e borrado até entrar em foco. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com IA e prompts, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo entra no instante em que é dito e com significado: texto digitado com cursor, peça que sobe e desce encaixando o dente na de baixo ("toc" grave), o vago borrado que entra em foco, números que contam, o botão que é tocado. Antes de ser dito, o lugar de cada coisa aparece **a lápis** (tracejado, apagado). Sem quique, sem giro, sem brilho. As trocas cruzam: a bancada que sai é empurrada para o lado enquanto a nova entra, e a pessoa muda de tamanho no mesmo gesto, sem quadro vazio.
- **Organização e hierarquia:** uma coisa grande por vez (o nome da peça, a frase da peça, o número). O resto fica pequeno: contador "1/4", etiquetas, "ilustrativo". Cartões brancos com sombra macia sobre a bancada; em tela cheia, um cartão no peito, abaixo do queixo.
- **Tipografia:** Anuphan 500 a 700 (títulos, textos) e Sometype Mono (letreiros em caixa alta, contadores, números). Nada de condensada. Texto das peças de 44 a 56 px, títulos de 60 a 116 px, nada abaixo de 32 px. Todo texto é medido e reduzido para caber.
- **Moldura da pessoa:** muda de lugar a cada momento: tela cheia (cartão no peito), janela larga no alto, janela no canto, janelinha ao lado da caixa. Moldura branca de 7 px, cabeça inteira, nunca numa coluna estreita ao lado, nunca coberta; a janela segue o rosto.
- **Cores, textura e som:** bancada cinza-clara fria, tinta quase preta, cartões brancos. A cor só existe nas peças: anil, jade, mostarda e framboesa, nessa ordem; a framboesa também é o alerta e o anil a palavra-chave. Sem textura. Som raro e tonal: um "toc" grave por peça (a nota sobe a cada peça), um envio suave, um acorde quando algo entra em foco.

## Antes de começar

1. **Carregue a skill do Remotion** (`remotion-best-practices`). Este modelo é um projeto Remotion e as regras dela valem aqui. Se não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. Três ressalvas, porque aqui o projeto já vem pronto: não precisa carregar `remotion-create` nem abrir o Studio (os quadros do `stills.mjs` são a prévia), e o pedido de edição já é o pedido para renderizar.
2. Confirme o caminho do vídeo. Se o usuário não disse o **nome e a área** de quem aparece (ex.: "Carla" / "IA na prática"), pergunte uma vez: o nome vai na etiqueta da janela e na assinatura do fechamento; a área vai ao lado do nome. Sem resposta, siga sem nome (a etiqueta e a assinatura somem).
3. **O chat é fictício.** O assistente da tela se chama "Assistente" e tem um avatar neutro ("IA"); não ponha nome, logotipo nem cores de um produto real. A resposta em tabela é **ilustrativa** e sai com a etiqueta "exemplo": deixe-a plausível (nada de número absurdo, nada de dado pessoal real) e coerente com as peças. Nenhum texto de tela pode citar ferramenta de edição de vídeo.
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

Os nomes das peças costumam vir separados e às vezes errados: "Papel:" vira um item curto, "Contexto:" vira "Com o texto", "Aja como" vira "Haja como". Anote: vão virar `correcoes` (passo 7).

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas** — a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala — ouça com atenção, costuma esconder repetições.

**Itens curtos sem transcrição ou marcados `[sem fala, sai]`** podem ser exatamente o nome de uma peça ("Tarefa:", "Formato:"), que o Whisper perde com frequência. Antes de tirar, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica (`"manter": true`). O nome perdido não entra em `palavras`; use o começo do trecho como `em` da peça.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a que combina com onde o vídeo vai ser postado e, na dúvida, com a última. Diga na entrega qual ficou e por quê.

Neste modelo **as trocas de momento escondem os cortes** (a pessoa muda de lugar em cima do pulo). Pausas curtas dentro de uma frase (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa gravação vertical em 9:16 (a pessoa é reposicionada em janelas, não precisa de espaço abaixo do queixo); gravação horizontal vira 3:4, e as janelas e a tela cheia cobrem o quadro do mesmo jeito. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul deve cair no rosto, inclusive dentro das janelas pequenas (a caixa lilás tracejada é a janela da pessoa naquele instante); a linha laranja vertical é a margem direita (nada passa dela — ali ficam os botões do app); a amarela é a base do conteúdo e a vermelha o começo da interface do app. A caixa amarela tracejada no peito é onde ficam os cartões da abertura e do fechamento: o queixo tem que ficar acima dela. Se a cruz não estiver no rosto, refaça o passo 4 com medidas melhores. Se o rosto ficar alto ou baixo demais nas janelas (cabeça cortada, muito queixo), use `ajusteJanela` no plano (`references/plano.md`, seção 1).

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: uma linha por batida (2 a 5 s, uma ideia), com o tempo, o trecho falado, a forma (lista, número, comparação, tendência…), o bloco **deste modelo** (tabela "Blocos deste modelo") e o que aparece na tela. A assinatura (`montagem`) entra **pelo menos uma vez**, como metáfora se o assunto não for prompt: "partes que se somam num resultado" (veja "A assinatura em qualquer assunto").

Pense também no **lugar da pessoa**: cada momento a muda de lugar (tela cheia, janela no alto, no canto, ao lado). Tela cheia no começo e no fim.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, os lugares da pessoa e as regras de tempo) e preencha em `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`.

**O texto das peças e dos itens é digitado no instante em que é dito.** O template procura cada palavra do `texto` na fala, a partir do `em`; escreva o texto com as palavras que a pessoa diz, na ordem em que diz (corrigidas por `correcoes`). Tudo o que aparece na tela vem da fala (pode enxugar, não pode inventar). O que é ilustrativo (a linha do gráfico sem números, o pedido vago, a tabela de exemplo) sai com a etiqueta visível.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento) e marca palavra sozinha; corrija o que der.

### 8. Conferir os momentos

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um depois de cada sub-passo (cada peça, o envio, a resposta entrando em foco, os botões) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade: o texto de cada peça está inteiro e no tamanho das outras? Alguma coisa cobre o rosto? A cabeça inteira cabe nas janelas pequenas? A tabela cabe sem cortar palavra ("…" no fim de uma célula = texto comprido demais)? Tem acento errado? Confira também **o meio das trocas de lugar** (o `de` de cada momento + 0,3 s e a primeira peça − 0,1 s, por exemplo `node scripts/stills.mjs 3.8 5.45 16.4 19.8`): o que sai cruza com o que entra, sem quadro vazio. Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-prompt.mp4"
```

Renderiza e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e onde estava a pessoa);
- o que é **ilustrativo** (a linha do gráfico, o pedido vago, a tabela de exemplo);
- o que o usuário deve conferir (uma palavra que a transcrição pode ter errado, uma tomada escolhida no lugar dele, um dado de exemplo que ele queira trocar).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Tela cheia. A caixa de mensagem do chat no peito: a frase é digitada na fala, o `destaque` na cor da primeira peça, e o botão de enviar é tocado no fim. |
| lista | `topicos` | Bancada (pessoa na janelinha). A resposta do assistente em lista: cada item entra em foco na sua palavra, com uma peça pequena numerada que encaixa ao lado; "2 de 3" no cabeçalho. |
| passos | `passos` | Bancada. Peças numeradas que encaixam uma na outra pelo dente (a ordem), cada passo digitado na fala. |
| número | `numero` | Tela cheia. O cartão do assistente: o rótulo e o número dentro de uma peça que encaixa e conta. |
| comparação | `comparacao` | Bancada (pessoa na janela larga). Dois cartões lado a lado entram em foco; o que perde fica vago (cinza, tracejado), o que ganha ganha cor e visto. |
| gráfico | `grafico` | Bancada. Resposta do assistente com barras em forma de peça, linha que se desenha ou fila de peças proporcional. Sem números ditos: a curva da tendência e a etiqueta "ilustrativo". |
| destaque | `destaque` | Tela cheia. Uma peça grande encaixa no peito com o texto digitado; `alerta` em framboesa, `chave` em anil; o `detalhe` numa etiqueta escura. |
| definição | `definicao` | Tela cheia. Uma conversa curta: o termo num balão escuro e o significado no balão do assistente, entrando em foco palavra por palavra. |
| frase | `frase` | Tela cheia. Uma nota fixada: as palavras entram em foco na fala; o `risco` é riscado quando é dito. |
| pergunta | `pergunta` | Tela cheia. A caixa de mensagem com a pergunta digitada; as `opcoes` viram sugestões que acendem quando são ditas. |
| fechamento | `cta` | Tela cheia. As peças da última montagem em fila, a chamada montada na fala e o botão (salvar, seguir, comentar, link) tocado na palavra. |
| **assinatura** | `montagem` | Janela no alto e depois no canto. O título se monta e as vagas aparecem a lápis; cada peça encaixa na pilha com o texto digitado na fala. Qualquer coisa que "se soma numa só". |
| assinatura | `vago` | Tela cheia. Um pedido vago é digitado e enviado; a resposta chega cinza e borrada com etiquetas nas palavras da fala. |
| assinatura | `resposta` | Janelinha ao lado. As peças da montagem entram na caixa, o prompt é enviado e a resposta entra em foco linha por linha, como tabela. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa (`tendencia` no gráfico).

## A assinatura em qualquer assunto

A assinatura do Prompt é **"as partes que se somam num resultado"**: a `montagem` empilha peças com nome e frase, e a cor de cada peça é a mesma que reaparece no que ela mudou (`resposta`). O `vago` é o contrário: "o jeito errado de dizer, que não entra em foco". As duas funcionam como metáfora para qualquer assunto.

1. **Finanças / cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   - `montagem`: título "Mesmo na alta, tem gente que perde" (`destaque` "perde"); peças Impulso, Critério e Risco, cada texto digitado na fala.
   - Depois, `cta` com as três peças em fila e o botão "Saiba Mais" (`icone: "link"`).
2. **Saúde bucal.** "Quase todo mundo erra em três coisas: escova por menos de 2 minutos, aperta demais e esquece o fio dental."
   - `montagem`: título "Quase todo mundo erra em 3 coisas"; peças Tempo, Força e Fio.
   - Em seguida, `topicos` "O certo": 2 minutos, movimento leve, fio dental todo dia.
3. **Relacionamento (bem distante).** "Na hora da briga, eu respiro, pergunto o que ela precisa e só então respondo."
   - `passos`: Respiro, Pergunto, Respondo, cada peça encaixando na seguinte.
   - Antes, o `vago` com o pedido "ela nunca me escuta" e a resposta cinza e borrada, etiquetas "resultado ruim" e "pedido vago".

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Impulso"), sem mudar o sentido.
- Não invente número, nome, preço, prazo nem fato. O pedido vago, a resposta borrada e a tabela da `resposta` são ilustrativos e saem marcados ("exemplo", "ilustrativo").
- O chat é fictício: o assistente se chama "Assistente", sem logotipo, nome nem cor de produto real. Nenhum texto de tela pode citar ferramenta de edição de vídeo.
- Gráfico sem números ditos usa `tendencia` com `ilustrativo: true`.

## Quando algo dá errado

- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`. Faltou a assinatura: use a `montagem` como metáfora.
- **O texto da peça aparece antes ou depois da fala**: o `texto` não bate com as palavras faladas (ou a correção não foi feita). Confira em `work/palavras.json` e ajuste `texto` ou `correcoes`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano (aceita várias palavras: `{ "Com o texto": "Contexto" }`).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Cabeça cortada ou rosto baixo nas janelas** (pessoa muito alta ou muito baixa no quadro, óculos que precisam ficar inteiros): use `ajusteJanela` (`references/plano.md`).
- **Célula da tabela termina em "…"**: o texto passou do limite da coluna; encurte conforme `references/plano.md`.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução; o vídeo sai menos nítido. Avise o usuário.
