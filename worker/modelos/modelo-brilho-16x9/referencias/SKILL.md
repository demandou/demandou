---
name: modelo-brilho
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Brilho: camarim editorial em creme, blush e vinho, Quicksand, palavras que sobem no tempo da fala com uma faixa de cor passada por trás, painel creme que abre ao lado quando a pessoa desliza, amostras de cor passadas no papel, números grandes e finos, e anotações finas que acompanham o rosto. Serve para qualquer assunto (o exemplo do modelo é maquiagem, mas funciona com finanças, cripto, saúde, vendas, carros, histórias, aulas): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar 'no modelo Brilho', 'estilo Brilho', 'estilo beleza', 'com anotação no rosto', 'estilo tutorial de maquiagem' ou 'face chart', e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Brilho

A gravação bruta vira um vídeo vertical com cara de revista de beleza: a pessoa em quadro cheio, o texto montando-se no peito dela palavra por palavra, uma página creme que abre ao lado quando a explicação pede espaço, amostras de cor "passadas" no papel e, quando a fala combina, anotações finas desenhadas no próprio rosto, seguindo a cabeça.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com maquiagem, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo entra macio e decidido e assenta sem quique. Palavras sobem de trás de uma máscara no instante em que são ditas; a palavra-chave ganha uma faixa de cor passada por trás, da esquerda para a direita; amostras de cor são "passadas" no papel; traços finos se desenham; números contam; o cartão sobe de baixo e cresce a cada item. O que vai chegar já aparece "a lápis" (cinza, tracejado) e ganha cor quando é dito. Nada gira, pulsa ou treme.
- **Organização e hierarquia:** uma ideia por vez. Em cima, um rótulo em caixa alta vinho; depois o nome grande (ou o número enorme e fino); depois a amostra de cor; depois os itens, cada um com um círculo vinho. O item atual fica forte, os anteriores ficam suaves. No painel, o texto encosta na costura, do lado da pessoa.
- **Tipografia:** uma fonte só, Quicksand (arredondada, elegante, sem condensar). 300/400 nos números grandes e na primeira linha da abertura; 500 no texto corrido; 600 nos nomes, itens e legenda; 700 nos rótulos em caixa alta espaçada. Corpo mínimo de 40 px; títulos de 64 a 150 px. Todo texto é medido com a fonte de verdade e encolhe até caber.
- **Moldura da pessoa:** três lugares. **Quadro cheio** (texto no peito ou cartão creme que sobe de baixo), **perto** (a câmera aproxima o rosto, cartão embaixo) e **lado** (a pessoa desliza e ocupa ~56% da largura; um painel creme abre do outro lado, como a página de uma revista). A troca acontece nos cortes e leva 0,6 s; a página que sai é coberta pela pessoa antes de o texto novo aparecer. O rosto é seguido quadro a quadro, e as anotações e os cartões respeitam o queixo.
- **Cores e som:** creme `#F8F0EA` (papel), tinta ameixa `#3A2330`, **um acento vinho** `#8E2A4E` (números, círculos, linhas, alerta) e blush `#E8A3A3` (faixa da palavra-chave, número grande no peito). As cores de amostra (pêssego, rosa, bronze, batom…) só aparecem nas amostras e nas marcas. Som raro e tonal: um tom grave na abertura e no fechamento, uma nota por bloco subindo como uma escala, a nota mais grave no alerta, um acorde no resultado.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e o modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala ("Carla — Maquiadora", "Tiago Lemos — Cripto"): vão na assinatura do fechamento. Sem resposta, siga sem assinatura.

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
- **erros, tosses, "pera, vou de novo"**.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala (costuma esconder repetições). Trecho marcado `[sem transcrição: ouça antes de tirar]` pode ser fala que a transcrição perdeu.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam; só as longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.39 --rosto-y 0.37 --queixo-y 0.50
```

O script corta, centraliza o rosto e calcula `rosto` e os pontos de corte no plano. Neste modelo a pessoa fica sempre em quadro cheio: o `modelo.json` já fixa o recorte vertical em 9:16 (não precisa de `--recorte`). Leia os avisos (um aviso de ampliação quer dizer que a gravação tem pouca resolução para o recorte; avise o usuário). No fim ele segue o rosto pelo vídeo inteiro (`rosto.rastro`) e, se o centro lido na grade errou, refaz o corte com o rosto no centro.

### 5. Medir a largura do rosto e refazer o rastro

Os cartões que sobem de baixo param antes do queixo, e as anotações no rosto são posicionadas em frações da **largura do rosto**. Meça:

1. `node scripts/stills.mjs --guias 2` e abra `out/stills/guias-t002.00.jpg`. Leia a **largura do rosto**: de uma bochecha à outra na altura dos olhos, sem as orelhas, em fração da largura do quadro (ex.: de 0,29 a 0,71 → `0.42`).
2. Refaça o rastro com essa largura (ela fica em `rostoLargura`):

```bash
node ferramentas/rastrear-rosto.mjs --largura 0.42
```

**Confira** com guias em vários instantes: `node scripts/stills.mjs --guias 1 4 7 10 13 16`. A elipse verde tracejada deve contornar o rosto e a cruz cair entre os olhos e o nariz; os pontos rosa são as zonas do rosto (`testa`, `olhos`, `macaAlta`, `cupido`…).

- Elipse larga ou estreita demais → rode de novo com outra `--largura`.
- Cruz deslocada sempre para o mesmo lado → `node scripts/rastrear.mjs --conferir 7`, meça o centro num quadro e rode `node ferramentas/rastrear-rosto.mjs --largura 0.42 --em 7 --x 0.49 --y 0.25`.
- Uma zona fora do lugar para este rosto → ajuste só ela em `zonas` (`references/plano.md`, seção 3).
- **Óculos**: marca de bochecha e de olho fica **abaixo da armação** (desça as zonas em `zonas`).
- **Pessoa sentada, rosto pequeno** (~0,30 da largura): `"zoomPerto": 1.4` e `"zoomLado": 1.25`. **Selfie, rosto enorme** (~0,5 da largura ou mais): `"zoomPerto": 1.1` (a câmera quase não aproxima e os cartões ganham espaço).

Se você refizer o corte (`cortar.mjs --manter-plano`), `rostoLargura`, `zonas` e os zooms continuam no plano e o rastro é refeito sozinho.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`truque` ou `amostras`) entra pelo menos uma vez.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, layouts e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Os tempos vêm de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO**. Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele. **Não use `--forcar`.**
- `node scripts/legendas.mjs`: lista as linhas de legenda dos trechos sem momento e marca palavra sozinha ou linha terminando em "de", "e", "um".

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um depois de cada instante marcado (cada item, dica, marca, `...Em`) e um logo depois do fim. Olhe os quadros reduzidos a ~540 px de largura e confira:
- o texto cabe e está inteiro (ele encolhe sozinho até um mínimo; se ficou pequeno, encurte);
- o cartão não cobre a boca nem o queixo;
- a marca no rosto está na área certa (e não em cima da lente dos óculos);
- o painel tem algo em cada parte (nada de meia página vazia);
- na troca de layout, o texto que sai sumiu antes de o novo aparecer.

Para um instante específico: `node scripts/stills.mjs 12.4 18`. Corrija e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-brilho.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (cores das amostras, gráfico sem números);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um trecho em que o rosto virou e a anotação pode ter escorregado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | no peito: primeira linha grande e fina, o resto palavra por palavra, o `destaque` com a faixa blush passada por trás |
| lista | `topicos` | painel creme ao lado: cada item é uma amostra passada com o nome embaixo e o detalhe em tinta suave |
| passos | `passos` | painel creme: número enorme e fino que vira 01 → 02 → 03 a cada passo, lista com círculos numerados, progresso ● ● ○ |
| número | `numero` | no peito: o rótulo em cima e o número contando em blush, com prefixo (US$, R$) e sufixo ao lado |
| comparação | `comparacao` | cartão que sobe de baixo (perto): dois godês lado a lado; o que perde fica "a lápis", o que ganha leva o check |
| gráfico | `grafico` | cartão: barras = amostras passadas no comprimento do valor; linha = traço de pincel; pizza = godê dividido; sem números, uma pincelada que sobe/cai/oscila com a etiqueta "ilustrativo" |
| destaque | `destaque` | no peito: ícone num círculo, a frase com a faixa inteira por trás (vinho no alerta, blush na chave) |
| definição | `definicao` | painel: o termo sobe em tinta, a amostra é passada, uma linha-guia vinho desce até o significado |
| frase | `frase` | no peito: uma pincelada curta de blush abre a frase; `destaque` com faixa, `risco` riscado em blush quando é dito |
| pergunta | `pergunta` | cartão: "?" grande e fino em vinho, a pergunta palavra por palavra, opções em pílulas que acendem quando ditas |
| fechamento | `cta` | cartão: ícone que se desenha (salvar, seguir, comentar, link), a chamada com `destaque`, a assinatura |
| **assinatura** | `truque` | o ponto numerado: rótulo ("Passo 2 de 3", "Erro", "Mesmo na alta"), número enorme, o nome "a lápis" que ganha tinta, a amostra de cor, as dicas que entram na fala e, quando combina, **anotações no rosto** ligadas às dicas por linhas-guia. Cartão embaixo (perto) ou página ao lado (lado) |
| **assinatura** | `amostras` | paleta de 2 a 4 cores com nome (opções, perfis, categorias): passadas no painel ou godês num cartão |
| fecho da assinatura | `resultado` | as marcas dos truques voltam juntas no rosto, com a frase e um número opcional no peito |

## A assinatura em qualquer assunto

O `truque` é **um ponto com nome, cor e dicas**: o "produto" é o nome do ponto, a amostra é a cor dele (ilustrativa) e as dicas são o que a pessoa diz sobre ele. As **anotações no rosto** (`marcas`) usam o rosto como mapa quando a fala combina: testa = pensar, decidir, critério; olhos = ver, entender, prestar atenção; boca = falar, prometer, pedir; bochecha = emoção, sorriso. Quando nada disso combina, o truque vai sem marcas e continua com a cara do Brilho (número, nome, amostra, dicas). As `amostras` são **qualquer conjunto de 2 a 4 opções com nome**.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento?" → `truque` (lado) com rótulo "Mesmo na alta", nome "Tem gente que perde", amostra vinho e as três dicas; um círculo fino acende na testa em "critério" e embaixo do olho em "não entende", com linhas-guia até as dicas. Em seguida, um `truque` (perto) "Agora / Como avaliar", amostra blush, dicas "os projetos" e "pensar no seu posicionamento", e um brilho na testa em "pensar". Os perfis "conservador, moderado, arrojado" viram `amostras`.
2. **Saúde e rotina.** "Três hábitos para dormir melhor: desligue a tela uma hora antes, quarto escuro e fresco, e acorde sempre no mesmo horário." → três `truque` numerados ("Hábito 1 de 3"…), cada um com sua amostra (`sombra`, `vinho`, `pessego`), alternando perto e lado; em "desligue a tela", um círculo fino nos olhos. Fecha com `resultado` ("Pronto, sono de verdade").
3. **Bem distante: relacionamento ou história pessoal.** "Os três sinais de que a relação precisa de conversa: silêncio no jantar, planos que nunca saem do papel e irritação com pequenas coisas." → `amostras` ("Três sinais": Silêncio, Planos parados, Irritação) e, quando a pessoa diz o que fazer, um `truque` com as dicas ditas e um círculo fino na boca em "conversa". Numa história de carreira ("saí da agência, fiquei seis meses sem cliente, aí veio o primeiro contrato"), cada fase é um `truque` numerado ("Fase 1 de 3"), com a cor esquentando de `sombra` para `blush`.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir ("compra por impulso" → "Impulso"), mas não pode mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Um bloco que pede um dado que a fala não tem dá lugar a outro bloco.
- As cores das amostras são ilustrativas (a cor típica do produto, ou um tom da paleta). Gráfico sem números ditos usa `tendencia` com `"ilustrativo": true`; a etiqueta aparece na tela.
- Anotação no rosto é um guia esquemático: sem antes-e-depois fabricado, sem "pele perfeita".

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Se ele diz que a assinatura não aparece, use um `truque` ou `amostras` como metáfora (seção acima).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Texto pequeno demais**: o bloco encolheu para caber. Encurte conforme os limites de `references/plano.md`.
- **O cartão cobre a boca**: confira `rostoLargura` (passo 5) e, em selfie com rosto enorme, use `"zoomPerto": 1.1`; para listas longas, prefira um bloco de painel (`topicos`, `passos`, `definicao`, `truque` com `"layout": "lado"`).
- **As anotações estão no lugar errado**: confira `rostoLargura` e o rastro com `stills.mjs --guias` (passo 5). Marca em cima da lente: desça a zona em `zonas` ou use um ponto livre `{ "u": 0.3, "v": 0.2 }`.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).

Detalhes do visual e o que pode ou não ser mudado: `references/estilo.md`.
