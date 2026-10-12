# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `retrato`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: quadro cheio × página
3. Os blocos de quadro cheio (`abertura`, `numero`, `destaque`, `frase`, `pergunta`, `cta`)
4. Os blocos de página (`topicos`, `passos`, `comparacao`, `grafico`, `definicao`)
5. A assinatura: `funil` e `conserto`
6. Regras de tempo
7. Legenda, correções e sons
8. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Tráfego pago" },
  "sfx": true,
  "retrato": { "zoom": 2.15, "ancoraY": 0.42 },
  "correcoes": {}
}
```

- `marca`: `nome` vai na etiqueta do bloco (canto de baixo, 32 px) e, com `area`, na assinatura do fechamento (`cta`). Nome até ~14 caracteres, área até ~18. `nome` vazio = bloco sem etiqueta e fechamento sem assinatura.
- `sfx`: `false` desliga os sons.
- `retrato` (opcional): enquadramento da pessoa dentro do bloco. `zoom` 2 a 2,6 mostra cabeça e ombros (menor = mostra mais; ~1,9 se a pessoa está muito perto da câmera); `ancoraY` é a altura do rosto no bloco, de 0 (topo) a 1 (base), padrão 0,42.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. `zona.topo` é onde começam os cartões de quadro cheio (logo abaixo do queixo).

## 2. A gramática: quadro cheio × página

| Lugar | Blocos | A pessoa | A tela |
|---|---|---|---|
| **Quadro cheio** | `abertura`/`gancho`, `numero`, `destaque`, `frase`, `pergunta`, `cta` e trechos sem momento | rosto na linha do centro, aproximando devagar (até 4%) | cartão grafite na altura do peito, texto que se monta palavra por palavra |
| **Página** | `funil`, `conserto`, `topicos`, `passos`, `comparacao`, `grafico`, `definicao` | encolhe para o **bloco**, à direita, com fio grafite e a etiqueta com o nome; acompanha o item da vez | papel cinza com grade de pontos; o gráfico na coluna da esquerda; etiqueta "ILUSTRATIVO" no alto quando o desenho não vem de números ditos |

O template já faz sozinho:

- **Troca de lugar**: a pessoa encolhe para o bloco 0,12 s antes do `de` de um momento de página e volta ao quadro cheio 0,15 s antes do `ate` (0,55 s, macio nas duas pontas). Um corte na fronteira cai no meio desse movimento. **Nunca dois textos um sobre o outro**: o cartão que sai termina de sumir no `de` da página, e só então a página aparece, por trás da pessoa que encolhe; na volta, a página apaga logo no começo da troca e o cartão só entra quando a pessoa já cobriu a tela.
- **Páginas encostadas** (menos de 0,4 s entre elas) ficam sem voltar ao quadro cheio: a pessoa continua no bloco e uma régua grafite desce pela tela como uma cortina (0,4 s, centrada na troca): acima dela já é a página nova, abaixo ainda é a velha. `funil` seguido do seu `conserto` é a mesma tela (o funil não sai).
- **O bloco acompanha**: ele vai para a altura do item, lado, dado ou etapa da vez, um instante antes de a palavra ser dita; numa troca de página, ele já sai para o primeiro item da página nova antes da cortina. Ele fica numa faixa só dele, à direita: o texto da página quebra antes dela e nunca fica embaixo do bloco. Nas páginas comuns ele fica entre o título e a zona dos botões do app; no funil ele só cabe ao lado das etapas onde o funil já afinou (nas de cima, espera logo abaixo da boca).
- **Esboço a lápis**: antes de ser dito, cada texto aparece apagado, cada ponto tracejado e cada número como "—". Nada de caixa vazia.
- **Texto que cabe**: cada bloco mede o texto e diminui o corpo até caber (até 2 ou 3 linhas), sem cortar. Os limites abaixo existem para o texto não ficar pequeno demais.
- **Último momento**: fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, na pausa entre as frases (de preferência exatamente num valor de `cortesEm`).
- **Abra e feche em quadro cheio** (`abertura` ou `numero` no começo, `cta` no fim) e **alterne os lugares**: depois de uma ou duas páginas, um cartão; nunca três momentos iguais seguidos.

## 3. Blocos de quadro cheio

Cartão grafite (cantos de 30 px) na `zona`, texto branco. Palavras de títulos e rótulos entram **no instante em que são ditas** (o template procura cada palavra na fala): use as palavras que a pessoa diz, na ordem em que diz (pode pular palavras). Números em algarismo ("10") casam com a palavra falada ("dez").

### `abertura` (ou `gancho`): a promessa, a pergunta, o tema

```json
{ "tipo": "abertura", "de": 0, "ate": 2.1, "texto": "Por que seu anúncio não vende?", "destaque": "não vende?" }
```

- `texto`: até ~45 caracteres (até 3 linhas; o corpo desce de 78 até 60 px).
- `em` (opcional, também em `frase`, `pergunta` e `cta`): o instante em que o **texto** começa a ser dito, quando o momento começa antes dele (ex.: o momento pega "Segundo, quando…" e o texto é "Quando…"). Padrão: `de`.
- `destaque` (opcional): trecho exato em **laranja** (o problema). Com destaque, uma fileira de pontos (pessoas) acende e cai em laranja quando ele é dito. Sem problema na frase, não use destaque.
- `pontos` (opcional): `false` tira a fileira (no `gancho` ela vem sempre; na `abertura`, só com destaque).
- No começo do vídeo, o primeiro quadro mostra o texto inteiro aceso (a capa do post); logo depois ele volta ao esboço e acende na fala.

### `numero`: um número que conta

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
```

- `valor` (número), `em` (a palavra do número: o contador começa ali), `rotulo` (o que é, até ~30 caracteres, 2 linhas). `rotuloEm` (opcional) = quando o rótulo se monta.
- `prefixo` ("R$", "US$") e `sufixo` ("mil", "%", "vezes", "dias") ficam menores ao lado. Escreva o número inteiro em `valor` (83000, não 83) e use `sufixo: "mil"` só se a pessoa disser "mil" e você quiser o número curto (83 + "mil").
- `casas`: casas decimais (1,5 → `"valor": 1.5, "casas": 1`). Formato pt-BR automático (83.000; 1,5).
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO no cartão.
- O desenho embaixo do número escolhe sozinho: **régua** de 0 a um fim redondo (83.000 → 0 a 100 mil) com o marcador correndo; **pontos** que caem um a um quando é um inteiro de 1 a 12 (o número já entra no valor, sem contar); **grade de 100 pontos** que se enche quando o sufixo é "%".

### `destaque`: uma palavra ou frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.88, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: até ~30 caracteres (corpo de 104 até 64 px, até 3 linhas). `em`: a primeira palavra dita.
- `nivel`: `"alerta"` = texto laranja, ícone de alerta e pontos que caem (risco, erro, perda); `"chave"` (padrão) = branco com um sublinhado que se desenha.
- `detalhe` (opcional, até ~50 caracteres) e `detalheEm`: uma linha menor embaixo.

### `frase`: frase de efeito, opinião, conclusão

```json
{ "tipo": "frase", "de": 8.75, "ate": 10.7, "texto": "O problema quase nunca é o anúncio", "destaque": "O problema", "risco": "anúncio" }
```

- `texto`: até ~60 caracteres (até 3 linhas), fiel ao que foi dito.
- `destaque`: trecho exato em laranja (o problema). `risco`: trecho exato riscado em laranja logo depois de ser dito (o que **não** é); `riscoEm` força o instante.

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…",
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres. Um "?" num círculo branco fica à esquerda.
- `opcoes` (opcional): 2 a 4 etiquetas de até ~28 caracteres, cada uma no `em` da palavra que a nomeia (com 1 só, o `conferir` reprova: ponha a opção no texto).

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "icone": "link", "destaque": "Saiba Mais" }
```

- `texto`: a chamada falada, até ~40 caracteres.
- `icone`: `salvar` (padrão), `seguir`, `comentar` ou `link` (outro valor reprova no `conferir`). `destaque`: trecho que ganha um sublinhado branco quando é dito. A assinatura (nome e área) entra depois da última palavra.

## 4. Blocos de página

Coluna da esquerda, de cima para baixo; o bloco da pessoa à direita. Itens de 44 a 96 px (todos do mesmo corpo, o maior que cabe em até 2 linhas, ou 3 se precisar), títulos de 56 a 80 px.

### `topicos`: lista sem ordem (motivos, erros, dicas, sinais)

```json
{ "tipo": "topicos", "de": 3.0, "ate": 9.0, "titulo": "Três erros na alta",
  "itens": [ { "texto": "Comprar por impulso", "em": 3.4 },
             { "texto": "Moeda sem critério", "em": 5.1, "detalhe": "escolha por moda" },
             { "texto": "Risco sem entender", "em": 7.2 } ] }
```

- `titulo` (opcional): até ~40 caracteres, na largura toda.
- `itens`: 2 a 5, cada um com `texto` (2 a 6 palavras, até ~30 caracteres), `em` e `detalhe` opcional (até ~40). Cada item tem um ponto grafite que cai e assenta no seu `em`.

### `passos`: sequência em ordem (processo, caminho, como fazer)

```json
{ "tipo": "passos", "de": 28.0, "ate": 33.7, "titulo": "Aula gratuita: como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.91 }, { "texto": "Os riscos", "em": 31.86 }, { "texto": "A escolha dos ativos", "em": 32.29 } ] }
```

- Mesmos campos de `topicos`. O tubo (o gargalo do funil) tem uma seção numerada por item; um ponto desce e pousa no número do passo dito.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 },
             { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `lados`: exatamente 2, um embaixo do outro. `rotulo` vai num selo em caixa-alta (até ~14 caracteres); `texto` é a frase grande (até ~30 caracteres).
- `modo`: `contra` (× no meio, padrão), `antes-depois` (↓; o "antes" apaga quando o "depois" é dito), `errado-certo` (o errado ganha selo e risco laranja; o certo, selo verde).
- `vencedor` (0 ou 1) e `vencedorEm` (opcional): o vencedor ganha um sublinhado grosso (verde no `errado-certo`) e o outro apaga.
- `titulo` (opcional): até ~40 caracteres.

### `grafico`: gráfico feito de pontos

```json
{ "tipo": "grafico", "de": 8, "ate": 12, "titulo": "Preço do Bitcoin", "forma": "barras", "unidade": "US$",
  "dados": [ { "rotulo": "2021", "valor": 69000, "em": 8.5 }, { "rotulo": "Hoje", "valor": 83000, "em": 10.9 } ] }
```

- `forma`: `barras` (uma fileira de pontos por dado; cada ponto vale um número redondo, mostrado no alto como "● = US$ 10 mil"; o último ponto pode ser parcial), `linha` (pontos ligados por um traço, valor em cima, rótulo embaixo) ou `pizza` (grade de 100 pontos, uma parte por dado; até 4 partes, legenda embaixo).
- `dados`: 2 a 6 números **ditos**, cada um com `rotulo` (barras até ~16 caracteres; linha até ~8), `valor` e `em`. Com um número só, use o bloco `numero`.
- `unidade` (opcional): `"%"`, `"R$"`, `"US$"` (antes do número) ou uma palavra ("alunos", que vai na nota dos pontos).
- **Sem números ditos**: tire `dados` e use `tendencia` (`sobe`, `cai` ou `oscila`), `tendenciaEm` (a palavra da tendência) e `ilustrativo: true`. `linha` vira uma curva que se desenha com um ponto na ponta e a área embaixo; `barras` vira colunas de pontos que crescem. A etiqueta ILUSTRATIVO aparece no alto.
- `titulo` (opcional): até ~40 caracteres.

### `definicao`: termo explicado

```json
{ "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo`: até ~20 caracteres (até 2 linhas, de 150 até 72 px). `em`: quando o termo é dito; a boca de um funil pequeno se enche de pontos.
- `significado`: até ~45 caracteres (até 3 linhas). `significadoEm`: quando a explicação começa; três pontos passam pelo bico e o significado se escreve embaixo.

## 5. A assinatura: `funil` e `conserto`

O funil desenhado: a largura de cada etapa é quantos chegam lá (larga na boca, fina no bico). A boca enche de **pontos** (pessoas, ou o que `unidade` disser); em cada etapa seguinte, no instante em que ela é dita, os pontos escolhidos descem pelo gargalo e assentam no fundo da etapa; quem ficou apaga. O bloco da pessoa desce junto. **Use pelo menos uma vez em todo vídeo** (veja "A assinatura em qualquer assunto" no SKILL.md).

### `funil`

```json
{ "tipo": "funil", "de": 14.88, "ate": 23.9, "unidade": "pessoas",
  "etapas": [ { "em": 15.48, "texto": "Entram na alta" },
              { "em": 17.73, "texto": "Compram por impulso" },
              { "em": 19.21, "texto": "Escolhem sem critério" },
              { "em": 21.75, "texto": "Poucos lucram", "passo": "risco" } ],
  "alertas": [ { "etapa": 1, "em": 18.45 }, { "etapa": 2, "em": 20.43 }, { "etapa": 3, "em": 22.41 } ] }
```

- `etapas`: 2 a 5, de cima para baixo (com números, 2 a 4 ficam melhores).
  - `em`: o instante em que a etapa é dita (o número, ou a palavra que a nomeia).
  - `texto`: o que essas pessoas fazem, com as palavras da fala. Na primeira etapa ele fica acima da boca, numa linha (até ~28 caracteres); nas outras, à esquerda da parede (até ~24 caracteres, 2 ou 3 linhas).
  - `valor` (opcional): quantos chegam (dito na fala). Cada `valor` ≤ o da etapa de cima.
  - `taxa` (opcional): a taxa **dita** do passo que leva a esta etapa, em % ("só 10% clicam" → `"taxa": 10`).
  - `plural` (opcional): forma usada quando o número na tela deixa de ser 1 ("compra" → "compras").
  - `passo` (opcional, etapa 1 em diante): nome curto (até ~12 caracteres) do passo que **leva** a esta etapa, onde pode vazar ("página", "risco"). Aparece no selo quando o passo entra em alerta ou é consertado.
- **Os números** (qualquer mistura funciona):
  - todas as etapas com `valor`: contadores contam, o selo de cada passo mostra a taxa ("↓ 10%"), a nota mostra quanto vale um ponto ("● = 10 pessoas");
  - só `taxa` dita: a base é 100 e as etapas contam a partir dela;
  - alguns `valor`: as etapas sem número mostram só o rótulo (a largura delas é ilustrativa);
  - **nenhum número**: só os rótulos, em grafite forte; o funil fica um pouco mais estreito para eles caberem; a etiqueta ILUSTRATIVO aparece sozinha.
- `rotulo` (opcional): etiqueta no alto ("Exemplo"). Sem `rotulo`, aparece "Ilustrativo" sempre que algum número for inventado. `rotuloEm` força o instante.
- `ilustrativo: true`: força a etiqueta.
- `unidade` (opcional): o que cada ponto representa, no plural ("pessoas", "leads", "alunos", "agitação"). Sem números, a nota fica "● = agitação".
- `alertas` (opcional): passos que já vazam enquanto o funil se monta (veja abaixo).

### `conserto`: o funil de volta, o vazamento e o conserto

```json
{ "tipo": "conserto", "de": 23.9, "ate": 28.0,
  "consertos": [ { "etapa": 2, "em": 24.95, "texto": "avaliar" }, { "etapa": 3, "em": 27.06, "texto": "posicionamento" } ] }
```

Vale para o último `funil` antes dele (encostado, é a mesma tela; com outro momento no meio, o funil volta já montado). Etapas contam de cima para baixo a partir de **0**; um **passo** é identificado pela etapa que ele alimenta (o passo 2 leva da etapa 1 à 2).

- `alertas`: `{ "etapa", "em" }`. O selo do passo fica laranja e pisca (depois respira devagar), com o nome do `passo` e a taxa (se houver números), e os pontos que ficaram na etapa de cima pulsam em laranja: o vazamento. `em` = a palavra que aponta o problema.
- `consertos`: `{ "etapa", "em", "taxa"?, "texto"? }`. O selo fica verde com um visto, mais pontos descem **em verde** e as etapas de baixo crescem junto (o funil alarga embaixo). `em` = a palavra da solução.
  - `taxa` (%): a taxa nova do passo. Sem ela, o ganho é ilustrativo (a taxa dobra) e a tela **não** mostra porcentagem nova; os contadores que mudam ganham "≈".
  - `texto` (até ~14 caracteres): o nome do conserto no selo verde (no lugar do `passo`).
- `caminho` (opcional): `{ "de", "ate", "em", "ateEm"?, "texto"? }`: um traço laranja que desce pela parede direita da etapa `de` até o fundo da `ate`, com o `texto` (até ~12 caracteres, padrão "o caminho"). Some antes do primeiro conserto.
- `depois` (opcional): `{ "texto", "em", "carimbo"?, "carimboEm"? }`: um botão no alto, à direita (até ~18 caracteres), com seta tracejada para a boca; em `carimboEm` ele fica tracejado com o selo grafite "DEPOIS" (ou o `carimbo`).

## 6. Regras de tempo

- **Fronteiras na pausa entre frases**: o `de` de um = o `ate` do anterior = o valor de `cortesEm` entre as duas frases (ou, sem corte, o `em` da primeira palavra menos 0,1). O primeiro momento começa em 0; o `ate` do último é a `duracao`.
- **Sub-passos** (`itens[].em`, `lados[].em`, `dados[].em`, `etapas[].em`, `alertas[].em`, `consertos[].em`, `opcoes[].em`, `significadoEm`, `tendenciaEm`…): o `em` da palavra, tirado de `work/palavras.json`. Nada aparece antes de ser dito (só o esboço a lápis).
- **A última etapa do funil precisa pousar antes de a pessoa crescer**: entre o `em` da última etapa e o `ate` do `funil`, deixe ~0,75 s.
- **Nada parado mais de ~2,5 s**: momento com mais de ~4 s precisa de itens entrando por dentro dele (o `conferir.mjs` reprova acima de 4,5 s).
- **Só pessoa e legenda**: no máximo ~3 s, e só em respiros.

## 7. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`: uma linha numa tarja grafite, a palavra da vez acende. Ela **some durante os momentos** e aparece nos trechos sem momento: logo abaixo do queixo no quadro cheio, na base da página. `"legenda": true` no momento a mantém (evite na página). `semLegenda` acrescenta faixas sem legenda.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Jão": "João", "478": "4-7-8", "né": "" }`. Só corrija o que você tem certeza. Não edite `palavras` à mão: o `cortar.mjs` reescreve esse campo.

Sons (automáticos, tonais, nunca dois a menos de 0,4 s): um "vum" grave quando a página abre; uma gota curta quando cada etapa, item, dado ou lado entra (no funil, cada vez mais grave); duas notas descendo em cada alerta (e no lado errado, no destaque de alerta); duas subindo em cada conserto (e no lado certo); um acorde curto no fechamento. `"sfx": false` desliga.

## 8. Exemplos completos

### O exemplo do modelo (marketing, com números)

Roteiro: "Por que seu anúncio não vende? Olha esse exemplo. Mil pessoas veem o anúncio. Cem clicam. Dez chegam ao checkout. Uma compra. O problema quase nunca é o anúncio: é o caminho entre o clique e a compra. Melhora a página e o checkout antes de gastar mais com tráfego. Salva e revisa o seu funil hoje." Cortes em 8,64 · 12,87 · 16,36.

```json
{
  "marca": { "nome": "Tiago", "area": "Marketing" },
  "momentos": [
    { "tipo": "gancho", "de": 0, "ate": 2.1, "texto": "Por que seu anúncio não vende?", "destaque": "não vende?" },
    { "tipo": "funil", "de": 2.1, "ate": 8.75, "rotulo": "Exemplo",
      "etapas": [
        { "em": 3.25, "valor": 1000, "texto": "veem o anúncio" },
        { "em": 5.1, "valor": 100, "texto": "clicam", "passo": "clique" },
        { "em": 6.24, "valor": 10, "texto": "chegam ao checkout", "passo": "página" },
        { "em": 7.97, "valor": 1, "texto": "compra", "plural": "compras", "passo": "checkout" } ] },
    { "tipo": "frase", "de": 8.75, "ate": 10.7, "texto": "O problema quase nunca é o anúncio", "destaque": "O problema", "risco": "anúncio" },
    { "tipo": "conserto", "de": 10.7, "ate": 16.36,
      "caminho": { "de": 1, "ate": 3, "em": 10.83, "ateEm": 12.44, "texto": "o caminho" },
      "alertas": [ { "etapa": 2, "em": 11.81 }, { "etapa": 3, "em": 12.44 } ],
      "consertos": [ { "etapa": 2, "em": 13.29, "taxa": 20 }, { "etapa": 3, "em": 13.87, "taxa": 20 } ],
      "depois": { "texto": "+ R$ em tráfego", "em": 14.84, "carimbo": "depois", "carimboEm": 15.56 } },
    { "tipo": "cta", "de": 16.36, "ate": 18.84, "texto": "Salva e revisa o seu funil hoje", "icone": "salvar", "destaque": "funil" }
  ]
}
```

### Um vídeo sem nenhum número de funil (cripto, 43 s)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" },
    { "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 14.88, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "funil", "de": 14.88, "ate": 23.9, "unidade": "pessoas",
      "etapas": [ { "em": 15.48, "texto": "Entram na alta" }, { "em": 17.73, "texto": "Compram por impulso" },
                  { "em": 19.21, "texto": "Escolhem sem critério" }, { "em": 21.75, "texto": "Poucos lucram", "passo": "risco" } ],
      "alertas": [ { "etapa": 1, "em": 18.45 }, { "etapa": 2, "em": 20.43 }, { "etapa": 3, "em": 22.41 } ] },
    { "tipo": "conserto", "de": 23.9, "ate": 28.0,
      "consertos": [ { "etapa": 2, "em": 24.95, "texto": "avaliar" }, { "etapa": 3, "em": 27.06, "texto": "posicionamento" } ] },
    { "tipo": "passos", "de": 28.0, "ate": 33.7, "titulo": "Aula gratuita: como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.91 }, { "texto": "Os riscos", "em": 31.86 }, { "texto": "A escolha dos ativos", "em": 32.29 } ] },
    { "tipo": "frase", "de": 33.7, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro" },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…",
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.067, "texto": "Toca em Saiba Mais e assiste a aula", "icone": "link", "destaque": "Saiba Mais" }
  ]
}
```

Dez momentos, dez tipos, nenhum trecho só com legenda. O funil e o conserto não mostram número nenhum (etiqueta ILUSTRATIVO); o único número na tela é o que foi dito (US$ 83.000).
