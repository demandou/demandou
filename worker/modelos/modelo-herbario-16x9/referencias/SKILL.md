---
name: modelo-herbario
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Herbário: o vídeo vira uma prancha botânica de livro antigo em papel cinza-sálvia, com a pessoa numa moldura oval que muda de tamanho e de lugar, títulos que nascem a lápis e ganham tinta na fala, desenhos a pena e aquarela que agem no que é dito (ramos, folhas numeradas, estágios de crescimento, a planta no vaso em corte), etiquetas de espécime e a câmera correndo pelo papel de prancha em prancha. Serve para qualquer assunto (o exemplo do modelo é jardinagem, mas funciona com cripto, finanças, saúde, vendas, carreira, aulas, histórias): a IA traduz a fala para os blocos do estilo e usa a planta como metáfora do que se cuida e cresce. Use sempre que o usuário pedir para editar \"no modelo Herbário\", \"estilo herbário\", \"prancha botânica\" ou \"estilo livro antigo de botânica\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Herbário

O vídeo vira um livro de botânica aberto. A pessoa abre num frontispício (oval grande no alto, título embaixo); quando explica algo, encolhe para um oval no canto e a tela vira uma prancha: um ramo cujas folhas são os itens de uma lista, estágios de crescimento para um passo a passo, um espécime medido para um número, dois espécimes lado a lado para uma comparação, um gráfico a pena e aquarela, a etiqueta de herbário de uma definição, e a assinatura: a planta no vaso em corte que age na fala. A câmera corre pelo papel de uma prancha para a próxima; nas frases fortes o oval se abre em tela cheia e um cartão de herbário sobe até o peito. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com jardinagem ("3 erros que matam a sua planta"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo nasce a lápis (cinza, traço fino) e ganha tinta na fala: cada palavra é passada a tinta da esquerda para a direita no instante em que é dita; cada desenho é passado a pena e a aquarela entra logo atrás, um pouco fora do registro. Entre pranchas, a câmera corre pelo papel (0,72 s, curva firme) e o oval viaja junto; o cabeçalho novo só aparece quando o oval assentou. Dentro da prancha algo se completa a cada 1,5–2,5 s: uma folha que se abre, a pena que desce pelo caule, um número que conta, uma etiqueta que se desdobra. Entra decidido e assenta: sem quique, sem giro, sem flash.
- **Organização e hierarquia:** uma prancha por ideia. No alto, o cabeçalho ao lado do oval: rótulo em versalete (FIG. 3, ERRO Nº 1), fio de pena e o título grande. No corpo (de 700 px até a interface do app), o desenho, que é o protagonista, com os itens numerados (1, 2, 3 nas etiquetas; I, II, III nos medalhões). Um item grande por vez; rótulos e detalhes menores, em itálico.
- **Tipografia:** uma família só, gratuita: Alegreya 700 nos títulos e textos, Alegreya itálica 600 nas etiquetas, nos termos e nos detalhes, Alegreya SC (versaletes espaçados) nos rótulos e medalhões, Alegreya Sans 700 só na legenda. Algarismos lineais, números no formato brasileiro. Títulos de 72 a 124 px, textos de 44 a 92 px, nada abaixo de 30 px; o texto encolhe e quebra para caber, nunca vaza.
- **Moldura da pessoa:** uma moldura oval de herbário (filete de pena, passe-partout, dois "pregos"). Grande no alto no frontispício; no canto de cima à direita ou à esquerda nas pranchas (ela troca de lado a cada prancha); aberta em tela cheia nos cartões (frase, destaque, pergunta, fechamento). O rosto é seguido quadro a quadro e, em gravação muito perto da câmera, o oval afasta sozinho para a cabeça caber.
- **Cores, textura e som:** papel cinza-sálvia com fibras, tinta ferrogálica verde-negra, grafite para o que ainda vai ser dito, um único acento verde-musgo (rótulos, destaques, o item da vez), garança só para o problema (alerta, erro, risco), aquarelas lavadas só dentro dos desenhos. Sons raros e tonais: duas notas graves quando a câmera corre, uma nota curta de pena quando um item ganha tinta, duas notas descendo no alerta, três subindo num número ou num crescimento, um acorde no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Marta" / "Horta em casa"): vão embaixo do oval no frontispício, no cabeçalho corrido ("Herbário de Marta") e no cartão do fechamento ("leg. Marta · Horta em casa"). Sem resposta, siga sem nome.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Palavras curtas ditas sozinhas** ("Mil.", "Cem.") às vezes voltam como `[sem fala, sai]`. Antes de aceitar um item desses no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala. Se for fala, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo: `{ "em": 3.18, "ate": 3.4, "w": "Mil" }`). Itens marcados `[sem transcrição: ouça antes de tirar]` vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre frases viram cortes, e é nos cortes que a câmera corre para a próxima prancha ou o oval muda de lugar**: o movimento esconde o pulo do corte. Mantenha a proposta do `preparar`, com cada trecho de fala separado; pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (o oval precisa de imagem em volta do rosto, e os cartões são em tela cheia); gravação horizontal vira 3:4 e o template também lida com ela. Os cartões de tela cheia param logo abaixo do `zona.topo` (abaixo do queixo) e encolhem o texto para não descer até a interface do app. Refazendo o corte depois de já ter planejado, use `--manter-plano`.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: o oval acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar. O aviso "gravação bem perto da câmera" é normal em selfie: o oval afasta sozinho.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias. Nesta hora o plano ainda não tem momentos, então a pessoa aparece em tela cheia: a cruz azul tem que cair no rosto e a linha vertical fina mostra o centro do quadro; a caixa azul tracejada é onde os cartões de tela cheia começam (abaixo do queixo); a amarela é a legenda; tudo que é texto fica acima da linha vermelha (interface do app). Se a cruz não cair no rosto, refaça o passo 4.

Depois de planejar, `node scripts/stills.mjs --guias 3 9 20` mostra as guias das pranchas: o contorno verde é o oval da pessoa (o rosto inteiro, com um respiro em cima), a caixa laranja é o cabeçalho e a roxa a área do desenho. Rosto pequeno ou grande demais no oval: ajuste `oval.zoom` no plano (`references/plano.md`).

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`figura`) entra pelo menos uma vez**, mesmo que o assunto não tenha nada de planta: veja "A assinatura em qualquer assunto".

Alterne os lugares: depois de uma ou duas pranchas, um cartão em tela cheia (frase, destaque, pergunta), e vice-versa. Duas pranchas seguidas também funcionam: a câmera corre e o oval troca de lado.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, regras de tempo e um exemplo completo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, dado, ação ou etiqueta entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`. Nos blocos de prancha, dê sempre um `titulo` curto com palavras da fala: ele é o que fica grande ao lado do oval.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "suculenta s": "suculentas" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe, está inteiro e dá para ler? Cada palavra ganha tinta quando é dita?
- a folha, o estágio, o lado ou a ação certa acontece na palavra certa?
- as etiquetas apontam para a coisa certa e não cobrem o rosto, o título nem outra etiqueta?
- o oval mostra a cabeça inteira e não cobre texto?
- nada parado mais de ~2,5 s, nenhum quadro vazio e nenhum texto sobre outro no meio das trocas? Gere quadros a cada 0,05–0,1 s em volta de cada troca (`node scripts/stills.mjs 8.6 8.65 8.7 8.75 8.8`).
- nada importante abaixo da linha da interface do app?

Corrija o plano (texto mais curto, outro bloco, outro `em`, outro `alvo`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-herbario.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curva de tendência sem números, as ações da planta usadas como metáfora);
- o que o usuário deve conferir (uma tomada em dúvida, um termo que a transcrição pode ter errado, uma metáfora que você escolheu).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `capa`) | frontispício: a pessoa no oval grande no alto, o nome e a área embaixo, o título escrito a lápis que ganha tinta palavra por palavra (`destaque` em itálico verde-musgo com aguada), medalhões I II III (`indice`) e, no pé, um raminho prensado preso por fitas de linho que ganha tinta no fim do título |
| lista | `topicos` | prancha: um ramo prensado que a pena desenha de cima para baixo; cada item é uma folha numerada no caule, com a linha-guia e a etiqueta de espécime; o item da vez fica com o número cheio de verde-musgo |
| passos | `passos` | prancha: estágios de crescimento (semente → broto → muda → planta → flor), um por passo, ligados por uma seta tracejada, com o medalhão romano e o texto; o estágio ganha tinta e aquarela no seu `em` |
| número | `numero` | prancha: o `rotulo` é o título; o número conta em algarismos grandes (formato brasileiro, prefixo em cima, sufixo curto ao lado) enquanto um raminho cresce ao lado de uma cota com setas, como um espécime medido |
| comparação | `comparacao` | prancha: Fig. A e Fig. B lado a lado, separadas por um fio de pena com medalhão (× ou →); `contra` = duas folhas diferentes; `antes-depois` = broto → planta; `errado-certo` = ramo murcho com selo ✗ em garança × ramo viçoso com ✓; o lado que perde (`vencedor`) murcha e empalidece |
| gráfico | `grafico` | prancha: eixos a pena; `barras` = colunas de aquarela com hachura; `linha` = um caule com uma folha em cada ponto; `pizza` = fatias de aquarela com etiquetas numeradas; sem números ditos = um caule com folhas que sobe, cai (e empalidece) ou oscila, com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | tela cheia: uma etiqueta de campo presa por um barbante entra pela esquerda e assenta no peito; `alerta` = texto em garança e selo ✗; `chave` = itálico verde-musgo com aguada |
| definição | `definicao` | prancha: o termo é o título, em itálico verde-musgo (como um nome científico); um raminho prensado preso por fitas e a etiqueta de herbário, ligada por uma linha-guia, onde o significado se escreve |
| frase | `frase` | tela cheia: o cartão de herbário sobe até o peito; `destaque` em itálico verde-musgo; `risco` riscado à pena em garança quando é dito; um raminho se desenha no canto |
| pergunta | `pergunta` | tela cheia: o cartão com o "?" num medalhão; as `opcoes` (a, b, c, d) são etiquetas de espécime que ganham tinta na sua palavra |
| fechamento | `cta` | tela cheia: o cartão com o ícone desenhado a pena (salvar, seguir, comentar, link), a chamada com o `destaque` em verde-musgo e "leg. nome · área" |
| **assinatura** | `figura` | prancha: a planta num vaso em corte (ou a janela com a régua da luz, ou o detalhe da terra) que **age na fala**: regar, encharcar, apodrecer a raiz, murchar, amarelar, brotar, afastar da luz, furo, dedo na terra, esperar; com até 3 etiquetas de espécime |
| aviso solto | `nota` | tela cheia: o cartão de herbário com um rótulo (`rotulo`) e o texto |

## A assinatura em qualquer assunto

A `figura` mostra **algo que se cuida e cresce, e o que faz isso dar certo ou morrer**: o excesso (regar demais, encharcar), o problema que não se vê (a raiz que apodrece), a falta do essencial (longe da luz, folhas pálidas), a saída que falta (vaso sem furo, água acumulada), o crescimento (folha nova), o conferir antes de agir (o dedo na terra) e a paciência (esperar mais um dia). O título e as etiquetas são as palavras da fala; as ações são a metáfora. Escolha ações que tenham o mesmo sentido do que a pessoa diz e não ponha texto inventado.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos?"
   `figura` vaso, `rotulo: "Mesmo na alta"`, `titulo: "Tem gente que perde"`, `destaque: "perde"`: `brotar` em "alta" (o mercado cresce), `regar` + `encharcar` em "compra por impulso" (excesso), `semFuro` em "sem critério" (nada filtra), `apodrecer` em "risco" (o que não se vê); etiquetas em garança "Impulso" (`alvo: "agua"`), "Sem critério" (`fundo`), "Risco que não entende" (`raiz`). Em seguida, `figura` terra (a câmera mergulha no mesmo vaso), `titulo: "Como avaliar os projetos?"`: o `dedo` entra na terra em "avaliar" (conferir antes de decidir).
2. **Saúde (sono).** "Quem dorme pouco vive no limite: o corpo não recupera e a energia some. Desliga a tela uma hora antes e o sono volta."
   `figura` vaso, `titulo: "Dorme pouco"`: `murchar` em "não recupera", `amarelar` em "a energia some", etiqueta "o corpo não recupera" (`folha`); depois `figura` janela, `titulo: "Desliga a tela"`: `aproximar` em "o sono volta" (a planta volta para a luz e recupera a cor).
3. **Relacionamento (bem distante).** "Relação não acaba de uma vez: é a conversa que ninguém tem, o problema que vai sendo empurrado. Antes de brigar, pergunta como o outro está."
   `figura` vaso, `titulo: "Não acaba de uma vez"`: `acumular` em "empurrado" (a água parada no fundo), `apodrecer` em "problema", etiquetas "a conversa que ninguém tem" (`terra`) e "o problema empurrado" (`raiz`, `erro: true`); depois `figura` terra, `titulo: "Antes de brigar"`: `dedo` em "pergunta".

Outros usos: vendas (o cliente que esfria longe da atenção: janela + `afastar`), carreira (a folha nova de uma habilidade: `brotar`), uma história pessoal (o vaso que quase morreu e voltou: `murchar` → `furo` → `brotar`). Se a fala tem uma lista simples sem nada de "cuidar", use `topicos`; se tem um processo, `passos`; a `figura` entra no trecho em que a ideia é causa e efeito.

## Fidelidade

- Tudo o que é texto na tela vem da fala; pode resumir com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Gráfico sem números ditos usa a forma qualitativa (`tendencia`) com `ilustrativo: true`.
- As ações da `figura` são metáforas visuais: diga na entrega quais você escolheu.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta, a assinatura ausente) e escolha um bloco para ele. Não use `--forcar`.
- **"A planta não tem nada a ver com o assunto"**: ela é o estilo. Procure na fala causa e efeito, excesso e falta, algo que cresce ou definha, e use a `figura` como metáfora (veja acima).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: passou do limite do bloco (`references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Etiqueta longe do ponto ou com a linha cruzando o desenho**: troque o `alvo` por um ponto do mesmo lado em que a etiqueta cabe, use `lado`, ou encurte o texto.
- **Pulo visível na troca de prancha**: a fronteira do momento ficou longe de um corte. Mova o `de` do momento para o valor de `cortesEm` mais próximo.
- **Rosto pequeno, grande ou cortado no oval**: `"oval": { "zoom": 1.15 }` aproxima, `0.85` afasta; `"ancoraY"` (padrão 0,40 no oval grande e 0,46 nos pequenos) sobe ou desce o rosto.
- **Cartão de tela cheia com texto pequeno**: a pessoa está gravada muito perto da câmera (o queixo fica baixo e sobra pouco espaço até a interface do app); encurte o texto do cartão.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
