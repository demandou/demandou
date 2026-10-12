---
name: modelo-arquivo-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Arquivo. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Arquivo: linguagem de documentário em papel off-white, tinta preta e um único vermelho de carimbo, com tudo datilografado na hora em que é dito; a pessoa fica em cores em tela cheia e vira foto de arquivo (preto e branco, grão) presa numa folha de dossiê, que muda de lugar a cada documento: fichas de registro com carimbo, fichas catalográficas, relatórios, fichas ligadas por fio vermelho, gráficos em papel quadriculado e a régua da linha do tempo. Serve para qualquer assunto (o exemplo do modelo é um documentário de história, mas funciona com cripto, IA, saúde, vendas, carreira, aulas): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Arquivo\", \"estilo documentário\", \"estilo dossiê\" ou \"com linha do tempo\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, o documento à esquerda)."
---

# Modelo Arquivo (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Arquivo no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, papéis, a datilografia na fala, a foto de arquivo que muda de lugar e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada, com legenda no terço de baixo; os supers (abertura, número, destaque, frase, pergunta, crédito, linha do tempo, fechamento) entram abaixo do queixo. A folha abre **só quando a fala vira registro** (um caso, uma lista, uma comparação, um gráfico, uma definição) e volta para a pessoa quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Na folha, a pessoa vira a foto de arquivo presa do lado direito, com o rosto centralizado nela e acompanhado de leve (o rastro do `cortar.mjs`), e o documento ocupa o lado esquerdo. A foto continua mudando de lugar a cada documento, sempre na coluna da direita: alta no meio (`direita`), larga no alto (`topo`), larga embaixo (`base`) ou pequena no canto (`canto`, com o título ao lado dela e o corpo do documento na folha inteira, embaixo).
- **Fileiras e colunas, não pilhas altas.** O quadro deitado é baixo: no canto, os passos ficam numa fileira com o fio em arco por cima e a lista ganha duas colunas; as opções da pergunta entram lado a lado; a linha do tempo põe a manchete à esquerda, o contador no meio e o carimbo à direita, sobre a régua que atravessa o quadro.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s. Documento com menos de ~2,5 s não dá tempo de ler.
- **Margens do YouTube:** 96 px nas laterais, o cabeçalho da folha no alto, nada importante abaixo de y 984 (controles do player).

O vídeo vira um dossiê sendo montado enquanto a pessoa fala. Ela aparece em cores, em tela cheia (o presente), com supers de documentário no terço de baixo, abaixo do queixo; quando a fala vira registro, a imagem "envelhece" como num scanner e vira uma foto impressa presa numa folha de arquivo, na moldura da direita, e um documento desliza pela mesa no quadro da esquerda: uma ficha com carimbo, uma ficha catalográfica, um relatório, fichas ligadas por fio vermelho, um gráfico em papel quadriculado. Tudo o que é escrito é datilografado no instante em que é dito. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um documentário de história, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** máquina de escrever e papel. Cada texto de registro é datilografado letra por letra, com cursor vermelho, a partir da palavra dita; títulos falados batem palavra por palavra. Documentos deslizam pela mesa, decididos, e assentam (sem quique); o que sai é empurrado para fora e o que entra passa por cima, como uma cortina de papel. Carimbos descem e batem seco com a tinta falhada; o fio vermelho se estica de uma ficha à outra; a régua corre sob o ponteiro; traços e gráficos se desenham a tinta. Antes de ser dito, cada lugar já está impresso "a lápis" (linha tracejada, número cinza): nunca há caixa vazia.
- **Organização e hierarquia:** um documento por vez. O título do documento em caixa alta, grande, em cima (ao lado da foto quando ela está no canto); embaixo, o corpo: linhas numeradas, fichas em ordem, dois documentos lado a lado, um gráfico. Rótulos pré-impressos pequenos em máquina de escrever; o que é dito, grande. Carimbo ILUSTRATIVO quando o desenho não vem de números ditos.
- **Tipografia:** duas fontes do Google Fonts. Archivo (grotesca jornalística, largura normal, nunca condensada) em títulos, números grandes, supers e legenda: 800 nos títulos, 700 nos itens. Courier Prime (máquina de escrever) em tudo que é registro: campos, rótulos, datas, significados. Títulos de 72 a 104 px, itens de 44 a 86 px, rótulos de 30 a 40 px; o texto é medido e diminui ou quebra em até 2 ou 3 linhas para caber, nunca vaza.
- **Moldura da pessoa:** dois estados. Tela cheia em cores (abertura, número, destaque, frase, pergunta, fechamento), como foi gravada; ou **foto de arquivo** em preto e branco com grão, borda branca, fita adesiva e uma inclinação de até 2°, presa numa folha de dossiê, **sempre na moldura do lado direito** (aula 9): alta no meio (`direita`), larga no alto (`topo`), larga embaixo (`base`) ou pequena no canto (`canto`). A foto muda de lugar a cada documento, num movimento de 0,65 s que passa por cima dos papéis (nunca há papel sobre o rosto). O rosto fica no centro da foto, no tamanho certo para a moldura (o zoom sai do rosto medido), e é seguido quadro a quadro.
- **Cores, textura e som:** papel `#ECE8DF` com fibra e luz de mesa, fichas `#F7F5EF`, tinta `#151515` e um único vermelho de carimbo `#C92A1F` (carimbos, cursor, fio, tarjas, margens, ponteiro). Grão de filme só na foto de arquivo; sombra de papel sob fichas e fotos. Sons raros e tonais: um tom grave quando a imagem vira arquivo, um deslizar grave na troca de folha, um baque no carimbo, notas curtas quando um passo se liga ou um significado se escreve, uma subida quando a régua corre.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Ana Lima" / "Nutrição"): vão na assinatura de documentário do fechamento. O **assunto** em duas ou três palavras vai no cabeçalho das folhas ("ARQUIVO · CRIPTOMOEDAS"): tire da fala. Sem resposta, siga sem nome.
4. **Fatos na tela.** Tudo o que aparece vem da fala ou do usuário. Um dado extra (um nome, uma data) só entra se você tiver certeza dele ou se o usuário confirmar; na dúvida, fica de fora.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Itens marcados `[sem transcrição: ouça antes de tirar]` podem ser fala que o Whisper perdeu: só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam; só as longas saem. As trocas de lugar da foto começam em cima do corte mais próximo: o movimento esconde o pulo.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.36 --queixo-y 0.5
```

**O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); a pessoa é reenquadrada em cada lugar da foto. Gravação vertical vira uma faixa deitada em volta do rosto (para a melhor imagem, grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano` (os momentos, a marca e as correções continuam; confira os tempos depois).

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: a foto acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul cai no rosto (em tela cheia); a caixa azul tracejada é onde entram os supers (abertura, número, destaque, frase, pergunta, fechamento), no terço de baixo, e deve começar abaixo do queixo; a verde é a pessoa (na folha, a foto na moldura da direita); a laranja, o documento (o quadro da esquerda); a amarela, a legenda, acima da linha vermelha (controles do player). Se a cruz não cair no rosto, refaça o passo 4 com medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`ficha`, `pessoas` ou `linha`) entra pelo menos uma vez**, mesmo que o assunto não seja história: veja "A assinatura em qualquer assunto".

Alterne os dois estados, com a tela cheia como base (aula 9): a folha abre quando a fala vira registro e, depois de um ou dois documentos, a pessoa volta em tela cheia, com um super ou só com a legenda (no completo, respiros de 1 a ~8 s). Abra e feche em tela cheia (o presente). Dois documentos seguidos mudam a foto de lugar sozinhos (o template alterna os lugares da coluna da direita: `base`, `topo`, `canto` e `direita`); você pode escolher com `"layout"`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `assunto`, `momentos`, `semLegenda` e `correcoes` (e, se quiser, `passado`). Cada item, campo, lado ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só aparecem nos trechos sem momento).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o texto datilografado cabe e está inteiro, com os acentos?
- cada coisa aparece quando a palavra é dita?
- o rosto está inteiro e no centro da foto, na moldura da direita, e nenhum papel o cobre? Em tela cheia, os supers ficam abaixo do queixo?
- o carimbo não cobre texto importante?
- nada parado mais de ~2,5 s, nenhum quadro vazio no meio das trocas (confira também `node scripts/stills.mjs <de> <de+0.2> <de+0.4>` nas trocas de folha)?
- nada importante abaixo de y 984 (controles do player)?

Corrija o plano (texto mais curto, outro bloco, outro `em`, outro `layout`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-arquivo.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (gráfico sem números ditos, linha do tempo sem anos) e quais fatos da tela não vieram da fala;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | tela cheia: rótulo pré-impresso (o assunto) e o título em caixa alta datilografado palavra por palavra no terço de baixo, abaixo do queixo; o `destaque` vira tarja vermelha; um traço vermelho fecha |
| lista | `topicos` | folha: um relatório pré-impresso com linhas numeradas 01–05; cada item é datilografado na sua linha quando é dito e uma tarja vermelha na margem anda até o item da vez; no `canto`, em duas colunas |
| passos | `passos` | folha: fichas presas com tachinhas em zigue-zague, numeradas; cada uma cai no lugar no seu passo e o fio vermelho se estica desde a anterior; no `canto`, numa fileira da esquerda para a direita, com o fio em arco por cima |
| número | `numero` | tela cheia: o rótulo datilografado e o número contando em pt-BR sobre a régua de documentário, que atravessa o quadro e corre sob o ponteiro vermelho, no meio, até o valor; `ilustrativo` = carimbo ILUSTRATIVO |
| comparação | `comparacao` | folha: dois documentos lado a lado com o rótulo carimbado e o texto grande; selo × (`contra`) ou → (`antes-depois`, `errado-certo`); o vencedor ganha um círculo vermelho à mão, o outro um risco na diagonal |
| gráfico | `grafico` | folha: anexo em papel quadriculado; `barras` com hachura vermelha, `linha` a tinta com pontos vermelhos, `pizza` em fatias de hachura e tinta, cada dado no seu `em`; sem números ditos, a curva da `tendencia` (ou barras que sobem/caem) com o carimbo ILUSTRATIVO |
| destaque | `destaque` | tela cheia: uma tira de papel entra no terço de baixo; `alerta` = carimbo vermelho de filete duplo que bate seco; `chave` = a palavra datilografada e sublinhada em vermelho |
| definição | `definicao` | folha: ficha catalográfica com margem vermelha e pauta; o termo datilografado grande (ao lado da foto, no canto) e o significado nas linhas |
| frase | `frase` | tela cheia: aspas vermelhas e a frase datilografada palavra por palavra; `destaque` em tarja vermelha; `risco` rasurado por um traço vermelho quando é dito |
| pergunta | `pergunta` | tela cheia: um "?" carimbado em vermelho e a pergunta palavra por palavra; as `opcoes` chegam como tiras de questionário, lado a lado numa fileira, com a casinha de marcar vazia |
| fechamento | `cta` | tela cheia: assinatura de documentário (traço vermelho, nome em caixa alta, área datilografada) e a chamada datilografada numa tira de papel com ícone; `destaque` sublinhado |
| **assinatura** | `ficha` | folha: a ficha de registro (tarja vermelha, cabeçalho pré-impresso, título datilografado, até 3 campos, carimbo que bate); registra qualquer coisa: um caso, um produto, um ativo, um sintoma, uma ideia |
| **assinatura** | `pessoas` | folha: fichas de pessoas ou personagens (papel carimbado, nome, dados), lado a lado, ligadas por fio vermelho em arco |
| **assinatura** | `linha` | tela cheia: a régua da linha do tempo atravessa o quadro e corre sob o ponteiro de um ano ao outro, com a manchete à esquerda, o contador no meio e o carimbo à direita; sem anos, de um marco ao outro, com o nome do marco grande |
| capítulo | `credito` | tela cheia: crédito de documentário, um lugar ou tema grande e uma linha em partes (data, valor) |
| lugar | `local` | folha (canto): o nome do lugar ao lado da foto e, embaixo, a carta quadriculada onde latitude e longitude se cruzam, com o detalhe datilografado ao lado |
| medida | `escala` | folha (canto): o número à esquerda e a régua de perícia crescendo por partes ao lado do objeto (`blocos` serve para qualquer coisa) |
| por dentro × por fora | `camadas` | folha (topo): uma amostra em que a camada de fora cobre a de dentro, peça por peça, no quadro da esquerda |

## A assinatura em qualquer assunto

A assinatura do Arquivo é **o registro**: transformar o que a pessoa diz em documento de dossiê. A `ficha` registra *um caso* com seus campos e um carimbo que dá o veredito; as `pessoas` registram *quem é quem* (gente, papéis, personagens) e o fio mostra *quem liga a quem*; a `linha` registra *uma passagem*: de um ano a outro, ou de uma fase a outra, sem anos. Quase toda fala tem um caso, um personagem ou uma passagem.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `ficha`: `titulo` { `rotulo`: "Caso", `texto`: "Tem gente que perde", `em` em "tem" }, `carimbo` { `texto`: "Mesmo na alta", `em` em "alta" }, `campos`: "Motivo 01" → "Compra por impulso" (em "compra"), "Motivo 02" → "Moeda sem critério" (em "escolhe"), "Motivo 03" → "Risco que não entende" (em "assume").
2. **Inteligência artificial (um papel).** "Papel: haja como um nutricionista."
   `pessoas` com uma ficha: `rotulo` "Peça 01", `titulo` "Papel", `rotuloNome` "Haja como", `pessoas`: [{ `papel`: "Papel", `nome`: "Nutricionista", `em` em "haja", `nomeEm` em "nutricionista" }].
3. **Saúde (uma passagem sem anos).** "Na primeira semana você dorme mal, na segunda o corpo acostuma, e no fim do mês nem lembra do café."
   `linha` sem `ano`: `marcos` [{ `texto`: "Semana 1", `em` em "primeira" }, { `texto`: "Semana 2", `em` em "segunda" }, { `texto`: "Fim do mês", `em` em "fim" }], `manchete` "o corpo acostuma". A régua anda por igual de um marco ao outro e o nome do marco aparece grande no lugar do ano.
4. **Relacionamento (personagens ligados).** "O problema não é ele nem você: é o jeito que vocês conversam."
   `pessoas` com duas fichas (`papel` "Ele" e "Você"; `nome` só com o que foi dito, ex.: "Ele" / "Você", `rotuloNome` "Quem") e `ligacao` em "conversam": o fio vermelho é a conversa.

Se a fala é só opinião, sem caso, personagem nem passagem, a `ficha` registra a própria ideia: `titulo` = a tese, `campos` = os argumentos, `carimbo` = a conclusão dita.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, data nem fato. Campo sem fato dito ou confirmado fica de fora.
- Número ilustrativo só onde o bloco permite (`grafico` com `tendencia`, `numero` com `ilustrativo`), sempre com o carimbo ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **"A assinatura não cabe no assunto"**: ela é o estilo. Procure na fala um caso (vira `ficha`), um personagem ou papel (vira `pessoas`) ou uma passagem (vira `linha`, com ou sem anos).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`; confira os tempos depois.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano (a chave pode ter várias palavras: `{ "Com o texto": "Contexto" }`).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Rosto cortado na foto da folha**: ajuste `caixas.<layout>.ancoraY` (mais baixo = rosto desce na foto) ou `zoom` no plano.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
