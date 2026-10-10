# O plano de edição (`src/plano.json`), versão deitada (16:9, 1920×1080)

Os campos são os mesmos do Viral vertical; muda só onde cada coisa fica no quadro deitado, pela composição da aula 9 do curso: a pessoa em tela cheia como base e, quando um bloco pede apoio visual, a pessoa numa moldura à direita e o conteúdo no quadro da esquerda.

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser, `impactos` e `progresso`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: quadro cheio, pessoa na moldura da direita, tela cheia
3. A assinatura: `corte` e `pop`
4. Blocos de quadro cheio (`abertura`, `numero`, `destaque`, `frase`, `cta`)
5. Blocos com a pessoa na moldura (`topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta`)
6. Regras de tempo
7. Legenda, zoom, correções e sons
8. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Curiosidades" },
  "sfx": true,
  "progresso": true,
  "impactos": [3.04, 13.99],
  "correcoes": {}
}
```

- `marca`: `nome` e `area` vão numa etiqueta escura embaixo da chamada final (`cta`), quando a chamada termina de entrar. `nome` vazio = sem etiqueta.
- `sfx`: `false` desliga os sons. `progresso`: `false` tira a barra rosa do topo.
- `impactos` (opcional): instantes de palavras fortes **fora** dos momentos de texto que ganham o soco de zoom no rosto (ex.: o "nunca" de uma frase que está só na legenda). Use pouco: 1 a cada 5 s, no máximo.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão.
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Não mexa à mão; se o plano for recriado, rode `node scripts/imagens.mjs --folha` para gravar de novo.

## 2. A gramática

| Lugar | Blocos | A pessoa | A tela |
|---|---|---|---|
| **Quadro cheio** (a base) | `abertura`, `numero`, `destaque`, `frase`, `cta` e os trechos sem momento | inteira, como foi gravada; salto de zoom a cada corte, soco de zoom nas palavras fortes | texto em tarjas numa fileira larga na altura do peito (do queixo até y 948); legenda no terço de baixo (centro em y 900) |
| **Pessoa na moldura** | `pop`, `topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta` | desliza para a moldura da direita (x 1180 a 1920, a altura toda), com o rosto centralizado nela e acompanhado com suavidade | o quadro da esquerda (x 96 a 1106, y 120 a 948) recebe o conteúdo, no fundo grafite; um traço rosa vertical marca a emenda; no `pop`, a legenda fica embaixo, na moldura |
| **Tela cheia** | `corte` (e `numero`/`destaque`/`abertura` com `imagem`) | escondida (o vídeo continua tocando por baixo) | a foto em tela inteira (1920×1080), aproximando devagar; legenda por cima |

O template já faz sozinho:

- **Troca**: a pessoa desliza para a moldura da direita em 0,38 s a partir do `de` de um momento "na moldura" e o quadro da esquerda entra junto com a emenda (o conteúdo entra empurrando, nunca há lado vazio). Na volta, ela cresce de novo para o quadro cheio a partir do `ate`, cobrindo o quadro da esquerda. Dois momentos "na moldura" com menos de 0,4 s entre eles ficam sem voltar ao quadro cheio: o conteúdo velho some em 0,16 s e o novo começa a entrar 0,2 s depois do `de`.
- **Textos do peito depois de uma troca**: esperam a pessoa voltar para o quadro cheio (até ~0,4 s depois do `de`), para nunca cair em cima do rosto que ainda está voltando.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da Montserrat e diminui o corpo até caber na largura e na altura do lugar dele (até 2, 3 ou 4 linhas), sem cortar. A faixa do peito do quadro deitado é baixa: texto longo sai menor.
- **Último momento**: o `cta` final (ou o que termina colado no fim) fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases ou num valor de `cortesEm`.
- **Alterne os lugares**: quadro cheio → imagem → quadro cheio. Nunca três momentos iguais seguidos. Abra com `abertura`, feche com `cta`.
- **A tela cheia é a base** (aula 9): abra o quadro da esquerda quando ele acrescentar clareza e volte para a pessoa quando a ideia terminar.

## 3. A assinatura

### `corte`: a imagem toma a tela inteira

```json
{ "tipo": "corte", "de": 5.7, "ate": 6.8, "imagem": { "id": "piramides", "efeito": "aproximar" }, "zoom": 1.4 }
```

- **Duração: 0,8 a 1,2 s.** Comece na palavra que nomeia a coisa (ou 0,05 s antes). Mais que 1,5 s cansa; para mostrar mais, faça dois cortes ou um `pop`.
- `imagem.id`: um pedido do `work/imagens.json` já escolhido. `efeito`: `aproximar` (padrão), `afastar`, `panoramica`, `parado`. `imagem.foco` (opcional) vale por cima do foco escolhido.
- `zoom` (opcional, 1 a 2): começa mais perto do foco e sobe o assunto para ~40% da altura (acima da legenda). Use quando o assunto ficou pequeno na foto (paisagem, prédio ao longe): 1,3 a 1,6.
- `rotulo` (opcional): etiqueta curta numa tarja rosa no alto, à esquerda (até ~22 caracteres), com palavras da fala. Na maioria das vezes a legenda já basta.
- A legenda continua por cima (para escondê-la: `"legenda": false`).
- Imagem boa para o corte: **deitada, 1920 px ou mais de largura, assunto inteiro, sem texto** (a tela cheia é 1920×1080: uma foto em pé perde a maior parte em cima e embaixo). Sem imagem (`--escolher <id> 0`), vira um cartão escuro com a palavra.

### `pop`: o cartão salta no quadro da esquerda

```json
{ "tipo": "pop", "de": 4.7, "ate": 5.7, "imagem": { "id": "potes" }, "rotulo": "Potes de mel", "rotuloEm": 4.88 }
```

- **Duração: 1 a 2,5 s.** A pessoa desliza para a moldura da direita e o cartão salta no `em` (padrão: o `de`), no centro do quadro da esquerda. Comece o momento na palavra que nomeia a coisa ou um pouco antes.
- O cartão segue a proporção da foto (até 880 × 660 px), com borda branca e inclinação que alterna de lado; o fundo do quadro da esquerda é a própria foto desfocada e escura. Objeto 3D transparente (`tipo: "objeto"`) vira adesivo solto, sem cartão.
- `rotulo` / `rotuloEm` (opcionais): etiqueta rosa no canto do cartão. Use quando a legenda não diz o nome da coisa naquele instante; se diz, deixe sem (fica repetido).
- A legenda continua embaixo, centrada na moldura da pessoa (para escondê-la: `"legenda": false`).
- Bom para: foto pequena, quadrada ou em pé, produto, documento, objeto, a foto que o usuário mandou.

## 4. Blocos de quadro cheio

Texto em tarjas: cada linha numa placa escura, caixa alta, Montserrat 900; o trecho `destaque` (texto exato, como está em `texto`) ganha a tarja rosa. No quadro deitado o bloco fica numa fileira larga (até ~1400 px) na faixa do peito, do queixo até y 948, centrado no rosto; com `imagem`, no meio da foto em tela cheia. Os blocos que se montam na fala procuram cada palavra no que foi dito a partir do `em`: use as palavras da pessoa, na ordem em que ela diz.

### `abertura`: o gancho escrito

```json
{ "tipo": "abertura", "de": 0, "ate": 2.08, "texto": "O mel praticamente não estraga", "destaque": "não estraga", "em": 0 }
```

- Entra **inteiro em menos de 1 s** a partir do `em` (padrão: `de`), palavra por palavra, sem esperar a fala: é o gancho escrito. Com `em` 0, a primeira palavra já está no primeiro quadro.
- `texto`: 3 a 8 palavras (até ~45 caracteres), a promessa ou a curiosidade, com as palavras da fala. `destaque`: 1 a 3 palavras.
- Duração: 1,5 a 3 s. `imagem` (opcional): o gancho por cima de uma foto em tela cheia (corte seco no começo).

### `numero`: um número que conta

```json
{ "tipo": "numero", "de": 6.8, "ate": 8.36, "valor": 3000, "em": 7.34, "prefixo": "+", "rotulo": "anos", "rotuloEm": 7.9 }
```

- A placa entra 0,25 s antes do `em` e o número conta de 0 até `valor` em 0,9 s a partir do `em`, em pt-BR (3.000; 1,5). `casas` para decimais. `prefixo`/`sufixo` curtos: `"R$ "`, `"US$ "`, `"+"`, `"%"`, `" mil"`, `" kg"`.
- `rotulo` (até ~30 caracteres) carimba numa tarja rosa **ao lado** da placa, colado nela, no `rotuloEm` (padrão: `em` + 0,3). Rótulo curto lê melhor: o número e o rótulo dividem a largura do quadro.
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO (só quando o número não foi dito exatamente assim).
- `imagem` (opcional): o número por cima da foto em tela cheia (vira um corte com número).

### `destaque`: palavra que bate forte

```json
{ "tipo": "destaque", "de": 16.45, "ate": 17.46, "texto": "não joga fora", "em": 16.48, "nivel": "alerta" }
```

- `texto`: 1 a 5 palavras (até ~30 caracteres); carimba no `em`, com soco de zoom. `nivel`: `chave` (rosa, padrão) ou `alerta` (amarelo, texto escuro: o problema, o "não faça").
- `detalhe` (opcional, até ~60 caracteres): placa escura menor embaixo, no `detalheEm` (padrão: `em` + 0,45).
- Duração: 0,8 a 2 s. `imagem` (opcional): por cima de uma foto em tela cheia.

### `frase`: frase de efeito, conclusão, citação

```json
{ "tipo": "frase", "de": 0, "ate": 1.8, "texto": "Quem guarda mel não perde dinheiro", "destaque": "mel", "risco": "perde dinheiro", "riscoEm": 1.0 }
```

- `texto`: até ~70 caracteres (até 4 linhas). Palavra por palavra na fala a partir do `em` (padrão: `de`). Selo rosa de aspas no canto.
- `risco` (opcional): trecho riscado em rosa no `riscoEm` (padrão: quando é dito).

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 18.88, "ate": 20.68, "texto": "Manda pra quem joga mel fora", "destaque": "joga mel fora", "em": 18.95, "icone": "seguir" }
```

- `texto`: até ~50 caracteres, palavra por palavra na fala. `icone` (opcional): `salvar`, `seguir`, `comentar` ou `link`, num círculo rosa com anel pulsando, **ao lado** da chamada. Sem ícone, só a chamada.
- Depois de montado, o bloco "respira" (nunca fica parado) e a etiqueta com `marca` entra embaixo. Fica até o último quadro.

## 5. Blocos com a pessoa na moldura

A pessoa fica na moldura da direita (x 1180 a 1920) e o conteúdo vai para o quadro da esquerda, de x 96 a 1106 e de y 120 (abaixo do título do player) a y 948 (acima dos controles). Título opcional em branco, caixa alta, 44–78 px, com um traço rosa acima; entra palavra por palavra na fala a partir do `de`.

### `topicos`: lista sem ordem (motivos, sinais, dicas)

```json
{ "tipo": "topicos", "de": 1.8, "ate": 3.6, "titulo": "Três sinais de mel puro",
  "itens": [ { "texto": "Cristaliza com o tempo", "em": 2.0, "imagem": { "id": "cristalizado" } },
             { "texto": "Não escorre como água", "em": 2.5, "detalhe": "fica em fio grosso" },
             { "texto": "Cheiro de flor", "em": 3.0 } ] }
```

- 2 a 5 itens; cada um até ~45 caracteres (até 2 linhas); `detalhe` até ~50. Cada cartão salta no seu `em`; o da vez fica rosa. `imagem` no item = foto redonda no lugar do marcador.
- O corpo é o maior que cabe (28–62 px) e a lista fica centrada na altura livre.

### `passos`: sequência em ordem

Mesmos campos de `topicos`. Cartões numerados; um traço rosa desce do 1 até o passo da vez.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 9.47, "ate": 13.03, "titulo": "O segredo é simples", "modo": "contra",
  "lados": [ { "rotulo": "Água", "texto": "quase nenhuma", "em": 10.82, "imagem": { "id": "agua" } },
             { "rotulo": "Açúcar", "texto": "muito", "em": 12.0, "imagem": { "id": "acucar" } } ] }
```

- `rotulo`: até ~14 caracteres (tarja). `texto`: até ~30 caracteres (2 linhas com foto, 4 sem). `imagem` por lado (opcional): foto em cima do cartão; se só um lado tem, o outro fica com a área escura. Os dois cartões ficam lado a lado no quadro da esquerda (até 470 × 640 px cada).
- `modo`: `contra` (VS), `antes-depois` (seta), `errado-certo` (o primeiro lado é o errado: tarja amarela e ✗; o segundo, verde e ✓).
- `vencedor` (0 ou 1) e `vencedorEm`: o vencedor ganha borda rosa e ✓; o outro fica cinza.
- Antes de cada lado ser dito, o lugar dele espera com um "?" tracejado.

### `grafico`

- `forma`: `barras`, `linha` ou `pizza`. `dados`: 2 a 6 números **ditos**, cada um com `rotulo` (até ~14 caracteres) e `em`. `unidade`: `"%"`, `"R$"`, `"US$"`, `"kg"`, `"mil t"`…
- Sem números: `tendencia` (`sobe`, `cai`, `oscila`), `tendenciaEm` e `ilustrativo: true`; a curva se desenha em 1,4 s com a etiqueta ILUSTRATIVO.

### `definicao`: termo explicado

```json
{ "tipo": "definicao", "de": 12.6, "ate": 14.4, "termo": "Higroscópico", "em": 12.8, "significado": "Que puxa a umidade do ar para dentro", "significadoEm": 13.3 }
```

- `termo`: até ~24 caracteres. `significado`: até ~110 caracteres, palavra por palavra na fala. `imagem` (opcional): foto redonda ao lado do termo.

### `pergunta`

- `texto`: até ~70 caracteres, palavra por palavra na fala a partir do `em`. `opcoes` (opcional): 2 a 4, cada uma até ~40 caracteres, no `em` em que é dita (enquete). Sem opções, um "?" rosa.

## 6. Regras de tempo

- **Cobertura** (o `modelo.json` desta versão ajusta para o vídeo longo, e o `conferir.mjs` cobra): pelo menos 50% do vídeo com algum momento; nenhum trecho só com legenda maior que ~8 s; pelo menos um momento a cada 10 s; pelo menos 3 tipos diferentes (4 em vídeos com mais de 40 s).
- **Nada parado**: dentro de um momento, no máximo 6 s sem algo novo (item, palavra, número, troca).
- **Ritmo do Viral no vídeo longo**: a tela cheia é a base e cada bloco entra quando acrescenta clareza, com tempo de leitura (um bloco do quadro da esquerda raramente com menos de 2 s); uma imagem (`corte` ou `pop`) nas coisas concretas que a fala nomeia; trechos só com a pessoa e a legenda entre os blocos são bons, é ali que o salto de zoom do corte aparece. Não acelere como se fosse um anúncio.
- O primeiro momento começa em 0 (o gancho). O último termina no fim do vídeo.

## 7. Legenda, zoom, correções e sons

- **Legenda**: aparece nos trechos sem momento, no `corte` e no `pop`; some nos outros blocos (eles já mostram o texto). `legenda: true` num momento a mantém; `false` no `corte`/`pop` a esconde. `semLegenda: [{ "de": 4.0, "ate": 5.2 }]` esconde num trecho. O template quebra cada frase em telas de até 3 palavras (uma linha) e a tarja rosa anda para a palavra falada. No quadro deitado ela fica no terço de baixo (centro em y 900): centrada no quadro cheio e centrada na moldura da direita quando a pessoa está nela.
- **Zoom**: salto seco em cada `cortesEm` e na volta de cada imagem em tela cheia (alterna 100% e 109%); soco de 11% no `em` da `abertura`, do `numero` e do `destaque` sem imagem, do `cta` e em cada `impactos`. Com a pessoa na moldura, sem zoom de impacto (ela fica um pouco mais perto, 112%, com o rosto centralizado).
- `correcoes`: `{ "chat GPT": "ChatGPT" }` troca palavras na legenda.
- **Sons** (em `public/sfx`): `corte` no início de cada corte, `pop` no cartão e em cada lado da comparação, `impacto` no gancho/número/destaque chave, `alerta` no destaque alerta, `tique` em itens, dados e opções, `fim` no `cta`. Dois sons a menos de 0,12 s viram um só.

## 8. O exemplo completo (curiosidade, 20,7 s)

O exemplo foi gravado para o vertical; o plano dele vale igual no quadro deitado (os campos não mudam, o `cortar.mjs` grava o `rosto` e a `zona` do 1920×1080).

Fala: "O mel é um dos poucos alimentos que praticamente não estragam. Arqueólogos acharam potes de mel em tumbas do Egito com mais de 3 mil anos e ainda dava para comer. O segredo é simples: quase nenhuma água e muito açúcar. Bactéria nenhuma sobrevive ali. Então, se o seu mel cristalizou, não joga fora: é só aquecer em banho-maria. Manda pra quem joga mel fora."

```json
"momentos": [
  { "tipo": "abertura", "de": 0, "ate": 2.08, "texto": "O mel praticamente não estraga", "destaque": "não estraga", "em": 0 },
  { "tipo": "corte", "de": 2.12, "ate": 3.32, "imagem": { "id": "escorrendo", "efeito": "aproximar" } },
  { "tipo": "pop", "de": 4.7, "ate": 5.7, "imagem": { "id": "potes" } },
  { "tipo": "corte", "de": 5.7, "ate": 6.8, "imagem": { "id": "piramides", "efeito": "aproximar" }, "zoom": 1.4 },
  { "tipo": "numero", "de": 6.8, "ate": 8.36, "valor": 3000, "em": 7.34, "prefixo": "+", "rotulo": "anos", "rotuloEm": 7.9 },
  { "tipo": "destaque", "de": 8.36, "ate": 9.44, "texto": "ainda dava para comer", "em": 8.42, "nivel": "chave" },
  { "tipo": "comparacao", "de": 9.47, "ate": 13.03, "titulo": "O segredo é simples", "modo": "contra", "lados": [
    { "rotulo": "Água", "texto": "quase nenhuma", "em": 10.82, "imagem": { "id": "agua" } },
    { "rotulo": "Açúcar", "texto": "muito", "em": 12.0, "imagem": { "id": "acucar" } } ] },
  { "tipo": "corte", "de": 13.05, "ate": 14.22, "imagem": { "id": "bacteria", "efeito": "aproximar" } },
  { "tipo": "pop", "de": 15.42, "ate": 16.3, "imagem": { "id": "cristalizado" } },
  { "tipo": "destaque", "de": 16.45, "ate": 17.46, "texto": "não joga fora", "em": 16.48, "nivel": "alerta" },
  { "tipo": "pop", "de": 17.5, "ate": 18.85, "imagem": { "id": "banhomaria" } },
  { "tipo": "cta", "de": 18.88, "ate": 20.68, "texto": "Manda pra quem joga mel fora", "destaque": "joga mel fora", "em": 18.95 }
]
```

E o `work/imagens.json` que gerou as imagens (com `--lado 2400`):

```json
[
  { "id": "escorrendo", "em": 2.26, "palavra": "mel", "busca": "honey dipper", "tipo": "foto" },
  { "id": "potes", "em": 4.88, "palavra": "potes de mel", "busca": "ancient egyptian jar", "tipo": "foto" },
  { "id": "piramides", "em": 5.76, "palavra": "tumbas do Egito", "busca": "egypt pyramids", "tipo": "foto" },
  { "id": "agua", "em": 11.5, "palavra": "água", "busca": "water drop", "tipo": "foto" },
  { "id": "acucar", "em": 12.44, "palavra": "açúcar", "busca": "sugar cubes", "tipo": "foto" },
  { "id": "bacteria", "em": 13.13, "palavra": "bactéria", "busca": "colorized scanning electron micrograph bacteria", "tipo": "foto" },
  { "id": "cristalizado", "em": 15.7, "palavra": "mel cristalizado", "busca": "crystallized honey", "tipo": "foto" },
  { "id": "banhomaria", "em": 18.19, "palavra": "banho-maria", "busca": "pot of boiling water", "tipo": "foto" }
]
```

Repare: as imagens grandes foram para o `corte` (mel escorrendo, pirâmides, bactéria colorida); as pequenas ou quadradas, para o `pop` (pote antigo, mel cristalizado, panela). No quadro deitado, prefira para o `corte` as deitadas (as pirâmides, a bactéria); uma em pé, como o mel escorrendo, perde o alto e o pé da foto na tela cheia: escolha bem o foco ou leve para um `pop`. "banho-maria" e "double boiler" trouxeram diagramas e caldeiras de trem; "pot of boiling water" trouxe a panela. A micrografia cinza tinha uma faixa de dados embaixo; a colorida, não.
