---
name: modelo-visor
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Visor: a edição inteira vira a interface de uma câmera fictícia, sem marca (cantos de enquadramento, ISO e velocidade, seletor de modos, obturador com piscar suave, contador de fotos), em vidro fumê escuro com um acento água-marinha. A pessoa alterna entre tela cheia, um cartão ou janelinha e telas de vidro com listas, passos, comparações e gráficos; números viram leituras de exposição, alertas viram aviso de zebra, o foco trava no rosto e, no fim, a câmera tira uma foto da pessoa. Serve para qualquer assunto (o exemplo do modelo é fotografia no celular, mas funciona com finanças, direito, saúde, vendas, histórias, aulas…): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Visor\", \"estilo câmera\" ou \"interface de câmera\", ou quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920 feito com Remotion."
---

# Modelo Visor

Transforma uma gravação bruta (uma pessoa falando para a câmera) num vídeo vertical em que a tela inteira é o visor de uma câmera. A pessoa aparece em tela cheia, num cartão ou numa janelinha (a câmera frontal); a informação da fala vira interface: uma leitura de exposição que conta, um quadrado de foco que trava, linhas de menu com pontos de foco, um histograma, dois quadros lado a lado. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, renderizar); você faz a parte de editor (escolher as tomadas, traduzir cada ideia para um bloco, achar o instante de cada palavra, conferir o resultado).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com fotografia, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** movimento de câmera: entra decidido e assenta, sem quique. O que ainda não foi dito espera "a lápis" (só o contorno tracejado, ou o texto em cinza claro) e ganha corpo na palavra dita. Um quadrado de foco procura aos trancos e trava no acento; o seletor de modos desliza a cada momento; o contador de fotos vira. Nas trocas de layout a pessoa encolhe revelando o conteúdo (ou cresce cobrindo-o): nunca há quadro vazio nem duas páginas de texto uma sobre a outra.
- **Organização e hierarquia:** uma ideia por vez. O título ou a leitura principal é grande; o detalhe vem menor, embaixo. Listas e passos são linhas de menu com um índice em mono e um quadrado de foco que anda de item em item. Comparações são dois quadros lado a lado. Gráficos são histogramas e linhas sobre a grade dos terços.
- **Tipografia:** Hanken Grotesk (títulos 700, texto 500 e 600; o "l" tem rabicho, não se confunde com o "I") e Chivo Mono (números da câmera, rótulos em caixa alta espaçada). Títulos de 52 a 100 px, texto de 36 a 62, nada abaixo de 30.
- **Moldura da pessoa:** tela cheia (a pessoa é o visor) com um rótulo de vidro no peito; ou um cartão em cima à direita (`topo`), ou a janelinha da câmera frontal (`janela`), com o conteúdo numa tela de vidro embaixo. Nunca numa coluna estreita. A pessoa muda de lugar nas fronteiras entre os momentos e o quadro acompanha o rosto.
- **Cores, textura e som:** corpo `#0A0B0C`, vidro fumê, branco `#F3F4F1`, acento água-marinha `#3EE0CF` (travou, ligou, deu certo, o item atual) e o vermelho de aviso `#FF6B57` só para alerta, erro e risco. Sons tonais e raros, um por batida importante (grade, foco, obturador, botão).

## Antes de começar

0. **Ambiente.** Este modelo roda **no computador** do usuário (Claude Code, o app do Claude com acesso ao terminal, ou o Codex). Se você não consegue rodar comandos nele (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**: não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
1. **Carregue a skill do Remotion** (`remotion-best-practices`). Este modelo é um projeto Remotion e as regras dela valem aqui. Se não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. Três ressalvas, porque aqui o projeto já vem pronto: não precisa carregar `remotion-create` nem abrir o Studio (os quadros do `stills.mjs` são a prévia), e o pedido de edição já é o pedido para renderizar.
2. Confirme o caminho do vídeo. Se o usuário não disse o **nome e a área** de quem aparece (ex.: "Ana Lima" / "Fotografia de produto"), pergunte uma vez; isso vira o cartão de perfil do fechamento. Sem resposta, o cartão sai só com a chamada e o botão.
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

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a que combina com onde o vídeo vai ser postado — num Reel orgânico, "segue" ou "salva" funciona; "toque em Saiba Mais" só existe em anúncio — e, na dúvida, com a última. Diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam; só as longas saem. Se vier um trecho só, a gravação é contínua e não há o que escolher.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.30 --queixo-y 0.41
```

O script corta e calcula `rosto` e os pontos de corte no plano. Este modelo fixa o recorte vertical em 9:16 (está no `modelo.json`): a pessoa é reposicionada pelo próprio modelo, então não precisa de espaço abaixo do queixo. O `rosto` é o que mais importa aqui: ele ancora a pessoa em todos os cartões e o quadrado de foco. Leia os avisos que o script imprime.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto **em qualquer lugar em que a pessoa estiver** (tela cheia, cartão, janelinha, coluna); a caixa azul é a área do visor; a caixa amarela é a faixa da legenda; abaixo da linha vermelha fica a interface do aplicativo. Se a cruz estiver fora do rosto, refaça o passo 4 com medidas melhores.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: cada batida (ideia de 2 a 5 s) ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`cena`, `foco` ou `comparar`) entra pelo menos uma vez, mesmo que o assunto não seja de fotografia: veja "A assinatura em qualquer assunto".

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha em `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Os layouts se alternam sozinhos (as telas de vidro e as cenas trocam entre cartão em cima e janelinha), a interface da câmera reage sozinha (grade acende, EV sobe, contador de fotos vira, seletor de modos desliza) e os sons já vêm marcados: você só escreve os momentos e os tempos.

Depois:

```bash
node scripts/conferir.mjs --mapa     # corrija até aparecer APROVADO
node scripts/legendas.mjs
```

Se o `conferir` reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele. **Não use `--forcar`.**

Nomes e termos que a transcrição errou vão em `correcoes` (`{ "para": "pra", "Iphone": "iPhone" }`). O `legendas.mjs` lista as linhas de legenda que vão aparecer (fora dos momentos, ou em momentos com `"legenda": true`) e marca palavra sozinha ou linha terminando em "de", "e", "um".

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um depois de cada instante marcado e um logo depois. Olhe os quadros reduzidos a ~540 px de largura e confira de verdade:

- o texto cabe, sem sair da tela de vidro nem do rótulo?
- o rótulo ou a tela de vidro cobre o rosto? (não pode: o rosto fica livre em tela cheia, no cartão e na janelinha)
- nas trocas de layout (quadros a cada 0,1 s em volta de cada `de` e `ate`), há quadro vazio ou duas páginas de texto sobrepostas? (não pode)
- cada item entra na palavra dele, e nada fica parado mais de ~2,5 s?
- a legenda aparece só onde a tela não mostra o que é dito?
- no `foco`, o quadrado abraça o rosto, sem cortar a testa nem passar do queixo? Se não, ajuste `quadro`.

Corrija o plano e repita. Para um instante específico: `node scripts/stills.mjs 12.4 18`.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-visor.mp4"
```

Confere o plano de novo, renderiza e normaliza o áudio. Entregue:

- o caminho do arquivo;
- a duração final e quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (gráficos sem números ditos, cenas metafóricas);
- o que o usuário deve conferir (uma tomada em que você ficou em dúvida, uma palavra que a transcrição pode ter errado, uma versão que você escolheu no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | o visor liga (cantos fecham, leituras assentam), a detecção de rosto acha a pessoa e o título se monta palavra por palavra num rótulo de vidro no peito; tela cheia |
| lista | `topicos` | tela de vidro com linhas de menu (índice em mono, texto, detalhe); um quadrado de foco anda de item em item e trava no atual; contador `01/03` no painel ao lado da pessoa |
| passos | `passos` | a mesma tela, com um trilho de pontos de foco numerados: a linha pontilhada se completa no acento até o próximo passo |
| número | `numero` | leitura de exposição no peito: o número conta em mono grande (US$ 83.000), o rótulo se monta embaixo e uma régua de exposição corre |
| comparação | `comparacao` | dois quadros de vidro lado a lado com um selo VS (ou seta); o vencedor trava no acento com um check e o outro apaga |
| gráfico | `grafico` | tela de vidro sobre a grade dos terços: barras como histograma, linha que se desenha, pizza que se abre, ou só a curva da tendência com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | `alerta`: aviso de superexposição (faixa de zebra correndo) em vermelho; `chave`: quadrado de foco que trava em volta do texto |
| definição | `definicao` | o termo trava num quadrado de foco; uma linha se desenha e o significado se escreve embaixo |
| frase | `frase` | citação com aspas grandes no acento; o trecho `risco` é riscado quando é dito |
| pergunta | `pergunta` | a pergunta se monta; as opções são modos de um seletor (A, B, C) que acendem uma a uma |
| fechamento | `cta` | cartão de perfil com o botão (seguir, salvar, comentar, link) a lápis até ser apertado; a câmera tira uma foto da pessoa que voa para a galeria |
| **assinatura** | `cena`, `foco`, `comparar` | a foto que melhora a cada ajuste; o foco que trava no rosto com a régua de exposição; o ANTES e DEPOIS com a grade |

## A assinatura em qualquer assunto

A assinatura do Visor é **a câmera ajustando algo até ficar certo**: limpar o que atrapalha, tirar do centro, travar o foco, dar luz, endireitar, comparar antes e depois. Isso serve de metáfora para qualquer dica de "faça assim e melhora". Use `foco` quando a ideia é "olha aqui, trava nisto"; use `cena` quando a dica é um ajuste (a xícara é a foto sendo melhorada, e o título e o detalhe falam do assunto de verdade); use `comparar` para antes e depois (`antesTexto` e `depoisTexto` escrevem a frase embaixo de cada cartão).

1. **Cripto / finanças.** Fala: "Mesmo na alta, tem gente que perde porque compra por impulso. Agora, como avaliar os projetos?" → `foco` com `titulo` "Aula gratuita", `selo` "Na mira" (no lugar de "FOCO TRAVADO"): o quadrado procura e trava no rosto enquanto ele diz "gratuita". Para "o mercado sobe, o seu bolso não": `comparacao` (contra) com `vencedor` 0.
2. **Direito / consumidor.** Fala: "Está no artigo 49 do Código de Defesa do Consumidor." → `foco` com `titulo` "Artigo 49", `detalhe` "do Código de Defesa do Consumidor", `selo` "Na lei". O quadrado trava no rosto na palavra "artigo".
3. **Saúde, rotina ou relacionamento.** Fala: "Antes de responder aquela mensagem, respira. Limpa a cabeça antes de decidir." → `cena` com `acao` "limpar", `titulo` "Limpa a cabeça", `detalhe` "antes de decidir": a lente embaçada se limpa no instante em que ele diz "limpa", como metáfora de clareza. Para "antes eu dormia mal, depois que cortei o celular na cama durmo bem": `comparacao` modo `antes-depois` ("Antes: dormia mal", "Depois: durmo bem"), ou `comparar` com `antesTexto` e `depoisTexto` se o vídeo já teve uma `cena`.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir ("compra por impulso" → "Impulso"), mas não pode mudar o sentido.
- Não invente número, nome, preço, taxa nem fato.
- Gráfico sem números ditos usa a forma qualitativa (`tendencia`) com `ilustrativo: true`.
- A cena da xícara é uma metáfora: nunca diga que ela é a coisa de que a pessoa fala.

## Quando algo dá errado

- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele (`references/adaptar.md`). Nunca use `--forcar`.
- **Texto estourando ou muito pequeno**: os blocos medem e reduzem o texto sozinhos até um mínimo legível; se ainda ficar apertado, encurte conforme `references/plano.md`.
- **O quadrado de foco não abraça o rosto** (rosto muito grande, pequeno ou de óculos): ajuste `quadro` (`tamanho`, `x`, `y`) no momento `foco`.
- **A pessoa sai cortada no cartão de cima ou na janelinha**: o `rosto` do plano está errado; refaça o passo 4.
