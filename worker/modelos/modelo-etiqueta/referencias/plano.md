# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser, `progresso`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: quadro cheio, pessoa embaixo, tela cheia
3. A assinatura: `etiqueta`
4. Blocos de quadro cheio (`abertura`, `numero`, `destaque`, `frase`, `cta`)
5. Blocos com a pessoa embaixo (`topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta`)
6. Regras de tempo
7. Legenda, correções e sons
8. O exemplo completo (e a prateleira sem imagem)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Lanches" },
  "sfx": true,
  "progresso": true,
  "correcoes": {}
}
```

- `marca`: `nome` e `area` vão numa etiqueta escura embaixo da chamada final (`cta`), quando a chamada termina de entrar. `nome` vazio = sem etiqueta.
- `sfx`: `false` desliga os sons. `progresso`: `false` tira a barra verde do topo.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão.
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Não mexa à mão; se o plano for recriado, rode `node scripts/imagens.mjs --folha` para gravar de novo.

## 2. A gramática

| Lugar | Blocos | A pessoa | A tela |
|---|---|---|---|
| **Quadro cheio** | `abertura`, `numero`, `destaque`, `frase`, `cta` e os trechos sem momento | inteira, rosto na linha do centro | texto em tarjas na altura do peito; legenda abaixo do queixo |
| **Pessoa embaixo** | `etiqueta`, `topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta` | desce para a metade de baixo (a partir de y 900), cabeça inteira | a metade de cima (y 132 a 872) recebe o parede ou o conteúdo; a legenda fica na emenda |
| **Tela cheia** | `numero`/`destaque`/`abertura` com `imagem` |

O template já faz sozinho:

- **Troca**: a pessoa desce em 0,38 s a partir do `de` de um momento "embaixo" e a metade de cima desce junto com a emenda (o conteúdo entra empurrando, nunca há metade vazia). Na volta, ela sobe a partir do `ate` cobrindo a metade de cima. Dois momentos "embaixo" com menos de 0,4 s entre eles ficam sem voltar ao quadro cheio: o conteúdo velho some em 0,16 s e o novo começa a entrar 0,2 s depois do `de`.
- **Textos do peito depois de uma troca**: esperam a pessoa voltar para o quadro cheio (até ~0,4 s depois do `de`), para nunca cair em cima do rosto que ainda está subindo.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da Sora e diminui o corpo até caber (até 2, 3 ou 4 linhas), sem cortar.
- **Último momento**: o `cta` final (ou o que termina colado no fim) fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases ou num valor de `cortesEm`.
- **Alterne os lugares**: quadro cheio → imagem → quadro cheio. Nunca três momentos iguais seguidos. Abra com `abertura`, feche com `cta`.

## 3. A assinatura: `etiqueta`

A prateleira em degraus de preço em cima, a pessoa embaixo. Um momento `etiqueta` tem todos os degraus; vários momentos com o mesmo `titulo` são a mesma prateleira (o segundo já começa com os degraus que o primeiro montou), o que permite intercalar outros blocos entre os degraus.

```json
{ "tipo": "etiqueta", "de": 0.98, "ate": 14.84, "titulo": "Barato, médio ou caro?", "tituloEm": 1.0, "unidade": "R$",
  "degraus": [
    { "rotulo": "Barato", "preco": 200, "em": 0.99, "texto": "Amortecimento básico", "textoEm": 5.15, "imagem": { "id": "tenis1" }, "vale": 0.4, "valeEm": 6.01 },
    { "rotulo": "Médio", "preco": 600, "em": 1.77, "texto": "Espuma mais leve", "textoEm": 7.49, "imagem": { "id": "tenis2" }, "vale": 0.82, "valeEm": 8.23 } ],
  "selo": { "degrau": 1, "texto": "Melhor custo-benefício", "em": 13.45, "vale": 0.95, "valeEm": 12.67 } }
```

- `titulo` (opcional, até ~28 caracteres, uma linha): numa faixa no alto da parede. `tituloEm`: quando entra (padrão: `de` + 0,05).
- `unidade` (padrão `"R$"`) vai antes do preço; `sufixo` (ex.: `"/mês"`) vai depois. Valem para a prateleira inteira.
- `degraus` (2 a 4, do mais barato ao mais caro, na ordem em que os preços são ditos):
  - `rotulo`: a faixa da etiqueta ("Barato", "Médio", "Caro", ou o que a fala usar; até ~10 caracteres).
  - `preco` (número) e `em`: **o instante em que a pessoa diz o preço**. Nesse instante a etiqueta cai do varal, balança, o preço conta de 0 até o valor, o degrau sobe e o produto cai em cima dele.
  - `texto` (2 a 6 palavras, até ~28 caracteres) e `textoEm`: **o que muda** neste degrau; aparece na faixa do degrau com a diferença de preço para o degrau de baixo (calculada: `▲ +R$ 400`). O primeiro degrau mostra "a base".
  - `imagem`: `{ "id", "foco"?, "efeito"? }`. PNG transparente (objeto) pousa no degrau; foto comum vira um cartão com borda de papel; **sem `imagem`**, um cartão tipográfico com o `nome` (ou o rótulo) faz o papel.
  - `nome`: nome curto do produto, só para o cartão sem imagem.
  - `vale` (0 a 1) e `valeEm`: a posição da agulha do medidor "vale a pena?" quando a pessoa avalia aquele degrau (0 = não, 1 = sim). Sem `vale`, o degrau não mexe na agulha.
- `medidor` (opcional): `{ "rotulo": "Vale a pena?" }` troca a pergunta. O medidor aparece sozinho, ao lado da primeira etiqueta, procurando (a agulha balança no meio) até o primeiro `vale`.
- `selo` (opcional, mas é o fecho da assinatura): `{ "degrau": 1, "texto"?, "em", "vale"?, "valeEm"? }`. `degrau` é o índice (0 = o mais barato). Em `valeEm` a agulha vai para `vale` e os outros degraus esmaecem; em `em` o selo carimba o degrau escolhido. Só use se a pessoa escolhe um degrau; senão, deixe sem selo.
- **Sons**: `bate` quando a etiqueta cai, `tique` na faixa do degrau, `pop` na agulha, `revela` no selo.
- A **legenda** fica na emenda durante a prateleira.

## 4. Blocos de quadro cheio

Texto em tarjas: cada linha numa placa escura, caixa alta, Sora 800; o trecho `destaque` (texto exato, como está em `texto`) ganha a tarja tomate. Os blocos que se montam na fala procuram cada palavra no que foi dito a partir do `em`: use as palavras da pessoa, na ordem em que ela diz.

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
- `rotulo` (até ~30 caracteres) carimba numa tarja tomate embaixo no `rotuloEm` (padrão: `em` + 0,3).
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO (só quando o número não foi dito exatamente assim).
- `imagem` (opcional): o número por cima da foto em tela cheia (vira um corte com número).

### `destaque`: palavra que bate forte

```json
{ "tipo": "destaque", "de": 16.45, "ate": 17.46, "texto": "não joga fora", "em": 16.48, "nivel": "alerta" }
```

- `texto`: 1 a 5 palavras (até ~30 caracteres); carimba no `em`. `nivel`: `chave` (verde, padrão) ou `alerta` (limão, texto escuro: o problema, o "não faça").
- `detalhe` (opcional, até ~60 caracteres): placa escura menor embaixo, no `detalheEm` (padrão: `em` + 0,45).
- Duração: 0,8 a 2 s. `imagem` (opcional): por cima de uma foto em tela cheia.

### `frase`: frase de efeito, conclusão, citação

```json
{ "tipo": "frase", "de": 0, "ate": 1.8, "texto": "Quem guarda mel não perde dinheiro", "destaque": "mel", "risco": "perde dinheiro", "riscoEm": 1.0 }
```

- `texto`: até ~70 caracteres (até 4 linhas). Palavra por palavra na fala a partir do `em` (padrão: `de`). Selo verde de aspas no canto.
- `risco` (opcional): trecho riscado em verde no `riscoEm` (padrão: quando é dito).

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 18.88, "ate": 20.68, "texto": "Manda pra quem joga mel fora", "destaque": "joga mel fora", "em": 18.95, "icone": "seguir" }
```

- `texto`: até ~50 caracteres, palavra por palavra na fala. `icone` (opcional): `salvar`, `seguir`, `comentar` ou `link`, num círculo verde com anel pulsando. Sem ícone, só a chamada.
- Depois de montado, o bloco "respira" (nunca fica parado) e a etiqueta com `marca` entra embaixo. Fica até o último quadro.

## 5. Blocos com a pessoa embaixo

A metade de cima vai de y 128 (abaixo da interface do app) a y 752. Título opcional em branco, caixa alta, 44–78 px, com um traço verde acima; entra palavra por palavra na fala a partir do `de`.

### `topicos`: lista sem ordem (motivos, sinais, dicas)

```json
{ "tipo": "topicos", "de": 1.8, "ate": 3.6, "titulo": "Três sinais de mel puro",
  "itens": [ { "texto": "Cristaliza com o tempo", "em": 2.0, "imagem": { "id": "cristalizado" } },
             { "texto": "Não escorre como água", "em": 2.5, "detalhe": "fica em fio grosso" },
             { "texto": "Cheiro de flor", "em": 3.0 } ] }
```

- 2 a 5 itens; cada um até ~45 caracteres (até 2 linhas); `detalhe` até ~50. Cada cartão salta no seu `em`; o da vez fica verde. `imagem` no item = foto redonda no lugar do marcador.
- O corpo é o maior que cabe (28–62 px) e a lista fica centrada na altura livre.

### `passos`: sequência em ordem

Mesmos campos de `topicos`. Cartões numerados; um traço verde desce do 1 até o passo da vez.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 9.47, "ate": 13.03, "titulo": "O segredo é simples", "modo": "contra",
  "lados": [ { "rotulo": "Água", "texto": "quase nenhuma", "em": 10.82, "imagem": { "id": "agua" } },
             { "rotulo": "Açúcar", "texto": "muito", "em": 12.0, "imagem": { "id": "acucar" } } ] }
```

- `rotulo`: até ~14 caracteres (tarja). `texto`: até ~30 caracteres (2 linhas com foto, 4 sem). `imagem` por lado (opcional): foto em cima do cartão; se só um lado tem, o outro fica com a área escura.
- `modo`: `contra` (VS), `antes-depois` (seta), `errado-certo` (o primeiro lado é o errado: tarja limão e ✗; o segundo, verde e ✓).
- `vencedor` (0 ou 1) e `vencedorEm`: o vencedor ganha borda verde e ✓; o outro fica cinza.
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

- `texto`: até ~70 caracteres, palavra por palavra na fala a partir do `em`. `opcoes` (opcional): 2 a 4, cada uma até ~40 caracteres, no `em` em que é dita (enquete). Sem opções, um "?" verde.

## 6. Regras de tempo

- **Cobertura**: pelo menos 70% do vídeo com algum momento; nenhum trecho só com legenda maior que 3,5 s; pelo menos um momento a cada 8 s; pelo menos 2 tipos diferentes até 20 s, 3 até 40 s, 4 acima. O `conferir.mjs` cobra.
- **Nada parado**: dentro de um momento, no máximo 4,5 s sem algo novo (item, palavra, número, troca).
- **Ritmo da Etiqueta**: a prateleira é um momento longo, mas sempre com algo novo (etiqueta, produto, faixa, agulha, selo) a cada ~1,5 s; ao redor, momentos curtos de quadro cheio (a `abertura` de 1 a 3 s, o `cta` de 2 a 3 s) fazem o respiro.
- O primeiro momento começa em 0 (o gancho). O último termina no fim do vídeo.

## 7. Legenda, correções e sons

- **Legenda**: aparece nos trechos sem momento e na `etiqueta`; some nos outros blocos (eles já mostram o texto). `legenda: true` num momento a mantém; `false` na `etiqueta` a esconde. `semLegenda: [{ "de": 4.0, "ate": 5.2 }]` esconde num trecho. O template quebra cada frase em telas de até 3 palavras (uma linha) e a tarja tomate anda para a palavra falada.
- `correcoes`: `{ "chat GPT": "ChatGPT" }` troca palavras na legenda.
- **Sons** (em `public/sfx`): `bate` na etiqueta que cai, `tique` na faixa do degrau e em itens, dados e opções, `pop` na agulha, `revela` no selo, `impacto` no gancho/número/destaque chave, `alerta` no destaque alerta, `fim` no fechamento. Volumes baixos, bem abaixo da voz.

## 8. O exemplo completo (tênis de corrida, 14,8 s)

Fala: "Tênis de corrida de 200, 600 e 1.500 reais. O de 200 tem amortecimento básico. O de 600 tem espuma mais leve. O de 1.500 tem placa de carbono. Para quem está começando, o do meio é o melhor custo-benefício."

Dois momentos: `abertura` (o gancho em quadro cheio, 0,9 s) e a `etiqueta` com os três degraus e o selo. As imagens são três tênis em PNG transparente (`tenis1`, `tenis2`, `tenis3`).

```json
[
  {
    "tipo": "abertura",
    "de": 0.05,
    "ate": 0.98,
    "texto": "Tênis de corrida",
    "destaque": "corrida",
    "em": 0.1
  },
  {
    "tipo": "etiqueta",
    "de": 0.98,
    "ate": 14.84,
    "titulo": "Barato, médio ou caro?",
    "tituloEm": 1.0,
    "unidade": "R$",
    "degraus": [
      {
        "rotulo": "Barato",
        "preco": 200,
        "em": 0.99,
        "texto": "Amortecimento básico",
        "textoEm": 5.15,
        "imagem": {
          "id": "tenis1"
        },
        "vale": 0.4,
        "valeEm": 6.01
      },
      {
        "rotulo": "Médio",
        "preco": 600,
        "em": 1.77,
        "texto": "Espuma mais leve",
        "textoEm": 7.49,
        "imagem": {
          "id": "tenis2"
        },
        "vale": 0.82,
        "valeEm": 8.23
      },
      {
        "rotulo": "Caro",
        "preco": 1500,
        "em": 2.53,
        "texto": "Placa de carbono",
        "textoEm": 10.06,
        "imagem": {
          "id": "tenis3"
        },
        "vale": 0.3,
        "valeEm": 10.48
      }
    ],
    "medidor": {
      "rotulo": "Vale a pena?"
    },
    "selo": {
      "degrau": 1,
      "texto": "Melhor custo-benefício",
      "em": 13.45,
      "vale": 0.95,
      "valeEm": 12.67
    }
  }
]
```

**A mesma prateleira sem imagem:** tire o `imagem` de cada degrau e ponha `nome`. Cada degrau ganha um cartão de papel com o nome.
