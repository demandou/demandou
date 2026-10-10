---
name: modelo-cifra-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Cifra. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Cifra: uma aula de música desenhada no tempo da fala. A pessoa fica numa moldura do lado direito que muda de lugar e pulsa a cada batida, e o quadro à esquerda vira um palco escuro de ébano onde tudo nasce a lápis e ganha tinta marfim e azul quando é dito: cordas que vibram, bolinhas de dedo, a linha de compassos com metrônomo, as setas da batida, a folha de cifra na estante. Serve para qualquer assunto (o exemplo do modelo é uma aula de violão, mas funciona com finanças, cripto, direito, saúde, vendas, carreira, histórias, aulas): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Cifra\", \"estilo Cifra\", \"estilo aula de música\" ou \"com diagrama de acordes\", e quando quiser o vídeo longo do YouTube (ou uma aula horizontal) nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa em tela cheia como base; nos blocos, uma moldura à direita e a explicação à esquerda)."
---

# Modelo Cifra (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Cifra no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: a mesma fonte, as mesmas cores, o lápis que ganha tinta na fala, as cordas, a folha de cifra, o metrônomo, os mesmos sons e os mesmos blocos e campos do plano. O que muda é a diagramação, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada (o vídeo deitado inteiro, sem recorte vertical), com legenda no terço de baixo. Um bloco abre **só quando acrescenta clareza** à fala e a pessoa volta à tela cheia quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Nos blocos em janela, a pessoa vai para uma **moldura do lado direito**, com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto, sem saltos), e a arte ocupa o **quadro do lado esquerdo**, na altura toda. As quatro janelas do vertical continuam (`topo`, `canto`, `centro`, `estante`), agora como quatro molduras da direita: larga em cima, estreita no canto (com o metrônomo ao lado), no meio da altura e embaixo. A pessoa ainda troca de lugar entre um bloco e outro, sem sair do lado direito.
- **Cartões de quadro cheio** (`abertura`, `destaque`, `frase`, `pergunta`, `cta`): a pessoa continua em tela cheia e o cartão de palco fica no peito, logo abaixo do queixo, centrado no rosto (1360 px de largura, baixo). O conteúdo se arruma em fileiras: o numeral da abertura numa coluna à esquerda do título, a fermata ao lado da pergunta, as opções lado a lado.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

## O modelo

O vídeo vira uma aula de música bem desenhada, sobre qualquer assunto. A pessoa fala em quadro cheio e, nos cartões, ganha um cartão de palco no peito; quando explica algo, vai para uma **moldura à direita** que troca de lugar (larga em cima, no canto, no meio, embaixo) e pulsa de leve a cada item dito. O quadro à esquerda é um palco escuro onde a fala se desenha com as peças de uma aula de violão: cordas, trastes e bolinhas de dedo, a linha de compassos com o metrônomo, as setas da batida, a folha de cifra na estante. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma aula de violão, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo nasce **a lápis** (texto apagado, traço tracejado, bolinha pontilhada) e ganha tinta no instante em que é dito, palavra por palavra. As cordas vibram quando algo "soa"; uma bolinha de dedo cai na casa; o número conta enquanto a bolinha sobe o braço; o pêndulo do metrônomo bate a cada passo; a seta da batida se enche no sentido do movimento; a faixa da letra enche como karaokê. Entra decidido e assenta, sem quique. Nas trocas, a moldura que se move revela a arte nova; o que sai some antes de o texto novo aparecer.
- **Organização e hierarquia:** uma ideia por tela. O item da vez fica **azul** (o que soa agora), os já ditos ficam marfim, os que vêm ficam a lápis. Títulos grandes no alto da arte, itens com o mesmo corpo, detalhes menores e mais apagados. Listas viram linhas da folha de cifra; sequências viram compassos numerados; dois lados viram duas cordas (uma soa ○, a outra abafa ×).
- **Tipografia:** uma família só, **Schibsted Grotesk** (Google Fonts, gratuita; o I maiúsculo tem serifa): 800/900 em títulos, números e cifras; 600/700 em textos e rótulos. Títulos de 64 a 140 px, textos ≥ 40 px, rótulos em caixa-alta ≥ 30 px. O texto é medido e diminui para caber em até 2 ou 3 linhas; nunca vaza.
- **Moldura da pessoa:** quadro cheio (o vídeo deitado inteiro, como foi gravado) nos cartões e nos respiros; nos outros blocos, uma **moldura à direita** com cantos arredondados e traço de marfim em um de quatro lugares (`topo`, `canto`, `centro`, `estante`), com a cabeça inteira, o rosto centralizado e seguido quadro a quadro com ajuste suave. A moldura cresce 2% e acende um anel azul a cada item, passo, seta ou dado dito. Nunca uma coluna vertical estreita, nunca cobrindo texto.
- **Cores, textura e som:** palco de ébano `#14110F`, tinta marfim `#F3EBDD`, **um** acento azul `#86C5EE` (o que soa agora); a folha de cifra é papel marfim com tinta escura e o azul fundo `#2C6A9C`. Sem segunda cor de destaque: o alerta é o × e a corda abafada. Sons de corda, graves e raros, uns 8 dB abaixo da voz: a nota de cada item, o toque de madeira do metrônomo, a palhetada de cada seta, um arpejo no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Direito do consumidor"): vão no cartão do fechamento, com a palheta. Sem resposta, siga sem nome.

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

**Palavras curtas ditas sozinhas** ("1.", "Sol.", "Ré.", "baixo, cima…") às vezes somem da transcrição ou voltam como `[sem fala, sai]` / `[palavra curta sem transcrição]`. **Nunca tire um item curto no meio de uma sequência sem medir**: `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -` (perto de −60 dB é silêncio; −30 dB ou mais alto é fala). Se for fala, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo: `{ "em": 13.12, "ate": 13.45, "w": "1." }`). Palavra que ficou errada ("HÉ?" no lugar de "Ré") você corrige depois em `correcoes`.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu (ou a pessoa tocando o instrumento de propósito): eles vêm com `"manter": true` e só saem se você confirmar que não há nada que preste.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.415
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); cada moldura reenquadra o rosto sozinha. Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Na versão deitada o corte mantém as respirações naturais (só corta pausa acima de ~0,45 s): é uma aula. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a moldura da pessoa acompanha quando ela se mexe (e o tamanho do rosto medido decide quanto cada moldura aproxima) e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto; a caixa azul tracejada (o cartão de quadro cheio, no peito) deve começar abaixo do queixo; os contornos brancos pontilhados são as quatro molduras da direita (`topo`, `canto`, `centro`, `estante`); a caixa laranja tracejada é o quadro da arte, à esquerda, e a pontilhada é a coluna do metrônomo (só no `canto`); a caixa amarela é a legenda (terço de baixo); nada importante abaixo da linha vermelha (controles do player). Se a cruz não cair no rosto, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`batida`, `compasso`, `cifra` ou `acordes`) entra pelo menos uma vez**, mesmo que o assunto não seja música: veja "A assinatura em qualquer assunto".

Alterne os lugares da pessoa: depois de um ou dois blocos em moldura, um cartão em quadro cheio ou um respiro em tela cheia com legenda (no vídeo completo, de 1 a ~8 s), e vice-versa. A tela cheia é a base da aula: o bloco entra onde ajuda a entender, não em toda frase. Abra e feche em quadro cheio (`abertura` ou `numero` no começo, `cta` no fim) e não repita o mesmo bloco três vezes seguidas.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, passo, lado, dado ou seta entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento ou com `"legenda": true`).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "HÉ? Mi": "Ré, Mi" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o texto cabe (nada cortado, nada embaixo da moldura da pessoa)? O cartão de quadro cheio fica entre o queixo e a legenda?
- o item certo fica azul quando a palavra é dita? O resto está a lápis antes de ser dito?
- o rosto aparece inteiro e centrado em cada moldura, e nada cobre o rosto em quadro cheio?
- **nas trocas** (o `de` de cada momento + 0,05 / 0,15 / 0,3 s): a moldura que se move revela a arte nova (saindo da tela cheia, a arte entra presa à borda esquerda da moldura); nenhum quadro com dois textos um sobre o outro; nenhum quadro com a pessoa solta num palco vazio. Para um instante específico: `node scripts/stills.mjs 7.3 12.45`;
- nos acordes (se houver): cada diagrama, corda por corda (× e ○ nas cordas certas, cada bolinha na casa e na corda certas, o número do dedo, a pestana);
- nada importante abaixo de y 984 (controles do player).

Corrija o plano (texto mais curto, outro bloco, outro `em`, outra `janela`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-cifra-16x9.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curva de tendência sem números ditos, `"ilustrativo": true` num número);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma digitação de acorde que você escolheu).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | quadro cheio: cartão de palco no peito; o título nasce a lápis e ganha tinta palavra por palavra (`destaque` em azul); um número no começo vira o numeral grande azul, numa coluna à esquerda do título; opcional, a linha de apoio escrita como linha de cifra (`apoio` + `cifras`) |
| lista | `topicos` | moldura embaixo, à direita (estante): no quadro à esquerda, a folha de cifra em papel marfim; cada item é uma linha da letra, com a bolinha de dedo que cai quando ele é dito e a faixa que enche como karaokê; o item da vez em azul |
| passos | `passos` | moldura estreita no canto de cima: o metrônomo na coluna ao lado dela (o pêndulo bate a cada passo; embaixo, o título e "1/3 → 2/3"); no quadro à esquerda, a linha de compassos ‖: 1 │ 2 │ 3 :‖ com um passo por compasso, o número grande à esquerda e a seta de troca descendo até o próximo |
| número | `numero` | moldura larga em cima, à direita; no quadro à esquerda, o rótulo ganha tinta, o número conta em pt-BR enquanto a bolinha de dedo sobe o braço do violão até a 12ª casa; quando chega, as cordas soam e o número fica azul |
| comparação | `comparacao` | moldura larga em cima, à direita; no quadro à esquerda, dois lados, cada um com as suas seis cordas que vibram quando ele é dito; no veredito, o lado que vale ganha ○ azul e continua soando, o outro ganha × e as cordas abafam; entre eles, a barra dupla (contra) ou a seta de troca (antes → depois, errado → certo) |
| gráfico | `grafico` | moldura no meio da altura, à direita; no quadro à esquerda, `barras` = setas para cima sobre as cordas, altura do valor; `linha` = uma corda grossa pelos pontos (bolinhas de dedo); `pizza` = a boca do violão dividida em fatias; sem números ditos = uma corda que sobe, cai ou oscila, com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | quadro cheio: no cartão do peito, a palavra grande e as seis cordas tocadas quando ela é dita; `chave` = azul com ○ (soa); `alerta` = marfim com × e as cordas abafadas |
| definição | `definicao` | moldura embaixo, à direita; no quadro à esquerda, na folha de cifra, o termo vai em cima, como a cifra, e o significado embaixo, como a letra que enche palavra por palavra |
| frase | `frase` | quadro cheio: cartão com a frase palavra por palavra; `destaque` em azul com traço embaixo; `risco` = o traço passa por cima e as palavras apagam |
| pergunta | `pergunta` | quadro cheio: a fermata azul (o sinal de "segura") ao lado da pergunta; as `opcoes` como etiquetas lado a lado que ganham a palheta e a tinta, cada uma na sua palavra (com 3 ou 4 opções, a pessoa vai para a moldura do meio e a pergunta ganha o quadro à esquerda) |
| fechamento | `cta` | quadro cheio: a palheta, o nome e a área, a chamada (`destaque` sublinhado) e o botão com o ícone (`salvar`, `seguir`, `comentar`, `link`) apertado quando o destaque é dito |
| **assinatura** | `batida` | moldura no meio da altura, à direita; no quadro à esquerda, setas ↓ e ↑ sobre as seis cordas, cada uma se enchendo no sentido do movimento quando é dita, com o rótulo embaixo; as cordas vibram na ordem da mão |
| **assinatura** | `compasso` | moldura estreita no canto de cima: a linha de compassos ‖: … :‖ no quadro à esquerda, com o metrônomo de pêndulo na coluna ao lado da moldura e o andamento ("devagar" → "acelera"); cada compasso é uma cifra (com o diagrama) ou um texto curto; o compasso em curso anda no tempo do pêndulo |
| **assinatura** | `cifra` | moldura embaixo, à direita: no quadro à esquerda, a folha na estante; marcas (acordes ou textos curtos) acendem sobre as linhas da letra, que enchem como karaokê; em cima, a semana que se completa dia a dia |
| **assinatura** | `acordes` | moldura larga em cima, à direita: no quadro à esquerda, 1 a 4 diagramas de acorde corretos que se desenham quando cada acorde é dito (cordas, casas, dedos numerados, × e ○, pestana); colado num `compasso` com os mesmos acordes, os diagramas viajam para os compassos |

## A assinatura em qualquer assunto

A assinatura do Cifra é **a aula de música como linguagem**: o **ritmo** (`batida`: o que sobe e o que cai, um movimento de cada vez), a **repetição com andamento** (`compasso`: uma rotina, um ciclo, um hábito que se repete, devagar → acelera) e a **folha na estante** (`cifra`: um roteiro com marcas, o plano da semana). `acordes` é só para acordes de verdade (nunca invente um diagrama). Pelo menos um dos quatro entra em todo vídeo.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `batida` com `titulo: "Tem gente que perde"` e quatro setas: ↑ `"na alta"` (em "alta"), ↓ `"impulso"` (em "impulso"), ↓ `"sem critério"` (em "critério"), ↓ `"risco"` (em "risco"). O mercado sobe uma vez; a pessoa cai três. Depois, "como eu analiso o mercado, os riscos e a escolha dos ativos" vira a `cifra` "Aula gratuita: como eu analiso", com uma marca por linha (O mercado · Os riscos · A escolha dos ativos), cada uma acendendo na sua palavra.
2. **Saúde e rotina.** "Treina três vezes na semana: segunda, quarta e sexta. Começa devagar e, depois de um mês, acelera."
   `compasso` com `compassos: [{ "texto": "Segunda", "em": … }, { "texto": "Quarta", "em": … }, { "texto": "Sexta", "em": … }]` e `andamentos: [{ "em": <"devagar">, "texto": "devagar" }, { "em": <"acelera">, "texto": "acelera" }]`: o pêndulo começa lento e acelera junto com a fala. Se a fala for "em uma semana você já sente", use a `cifra` com `semana: { "em": <"semana">, "rotulo": "1 semana" }`.
3. **Bem distante: direito, ou uma história pessoal.** "A loja se recusou? Aí já é caso de PROCON, ou de advogado." → `batida` "A loja se recusou?": ↓ `"recusou"`, ↑ `"PROCON"`, ↑ `"advogado"`. Uma história: "Perdi o emprego, a gente brigava muito. Aí veio a terapia, e as coisas voltaram a subir." → `batida` "Foi assim": ↓ `"emprego"`, ↓ `"brigas"`, ↑ `"terapia"`, ↑ `"voltou"`.

Outros usos: um processo que se repete toda semana (`compasso`); "faz assim, depois assim, e de novo" (`compasso` com textos); o roteiro de uma aula, de uma viagem, de um evento (`cifra` com marcas por linha); qualquer "sobe e desce", "ganha e perde", "acerta e erra" (`batida`). Se a fala não tem nada disso, use a `batida` no trecho com mais contraste (o problema ↓, a solução ↑).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Gráfico sem números ditos usa `tendencia` com `"ilustrativo": true` (a etiqueta aparece na tela).
- Não invente acorde, digitação, andamento em BPM nem tom. Acorde fora do dicionário sem `forma` aparece só com a cifra e o nome, sem diagrama.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **"A assinatura não aparece"**: procure na fala um contraste (o que sobe e o que cai → `batida`), uma repetição (→ `compasso`) ou um roteiro (→ `cifra`). Veja "A assinatura em qualquer assunto".
- **Texto pequeno demais ou quebrado em muitas linhas**: passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Dois blocos seguidos no mesmo lugar** (a pessoa não se mexe): troque o lugar do segundo com `"janela"` (`topo`, `canto`, `centro`, `estante` ou `cheio`). No quadro deitado todas as molduras ficam à direita; a troca muda a altura e o tamanho da moldura.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma palavra dita sumiu do vídeo ou do tempo**: ela saiu como `[sem fala, sai]` no passo 3. Volte, meça o volume, marque `"manter": true` e rode o `cortar` de novo com `--manter-plano`.
- **O diagrama do acorde não aparece**: a cifra não está no dicionário e o acorde não tem `forma`. Escreva `forma` e `dedos` (veja `references/plano.md`) ou deixe só a cifra.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
