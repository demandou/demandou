# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser, `progresso`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: quadro cheio, pessoa embaixo, tela cheia
3. A assinatura: `ranking`
4. Blocos de quadro cheio (`abertura`, `numero`, `destaque`, `frase`, `cta`)
5. Blocos com a pessoa embaixo (`topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta`)
6. Regras de tempo
7. Legenda, correções e sons
8. O exemplo completo (e o ranking sem foto)

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
- `sfx`: `false` desliga os sons. `progresso`: `false` tira a barra azul do topo.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão.
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Não mexa à mão; se o plano for recriado, rode `node scripts/imagens.mjs --folha` para gravar de novo.

## 2. A gramática

| Lugar | Blocos | A pessoa | A tela |
|---|---|---|---|
| **Quadro cheio** | `abertura`, `numero`, `destaque`, `frase`, `cta` e os trechos sem momento | inteira, rosto na linha do centro | texto em tarjas na altura do peito; legenda abaixo do queixo |
| **Pessoa embaixo** | `ranking`, `topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta` | desce para a metade de baixo (a partir de y 900), cabeça inteira | a metade de cima (y 132 a 872) recebe o placar ou o conteúdo; a legenda fica na emenda |
| **Tela cheia** | a foto de cada posição do `ranking` (e `numero`/`destaque`/`abertura` com `imagem`) | a pessoa continua tocando por baixo (a voz não corta) | a foto em tela inteira, aproximando devagar, por cerca de 1 s; depois voa para a casa dela |

O template já faz sozinho:

- **Troca**: a pessoa desce em 0,38 s a partir do `de` de um momento "embaixo" e a metade de cima desce junto com a emenda (o conteúdo entra empurrando, nunca há metade vazia). Na volta, ela sobe a partir do `ate` cobrindo a metade de cima. Dois momentos "embaixo" com menos de 0,4 s entre eles ficam sem voltar ao quadro cheio: o conteúdo velho some em 0,16 s e o novo começa a entrar 0,2 s depois do `de`.
- **Textos do peito depois de uma troca**: esperam a pessoa voltar para o quadro cheio (até ~0,4 s depois do `de`), para nunca cair em cima do rosto que ainda está subindo.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da Rubik e diminui o corpo até caber (até 2, 3 ou 4 linhas), sem cortar.
- **Último momento**: o `cta` final (ou o que termina colado no fim) fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases ou num valor de `cortesEm`.
- **Alterne os lugares**: quadro cheio → imagem → quadro cheio. Nunca três momentos iguais seguidos. Abra com `abertura`, feche com `cta`.

## 3. A assinatura: `ranking`

O placar do N ao 1 em cima, a pessoa embaixo. Um momento `ranking` tem todos os itens da lista; vários momentos com o mesmo `titulo` são o mesmo placar (o segundo já começa com as casas que o primeiro preencheu), o que permite intercalar outros blocos entre as posições.

```json
{ "tipo": "ranking", "de": 2.8, "ate": 12.95, "titulo": "Lanches de rua", "tituloEm": 2.85, "tela": 0.75, "itens": [
  { "posicao": 5, "em": 2.95, "texto": "Pastel de feira", "textoEm": 3.62, "imagem": { "id": "pastel" } },
  { "posicao": 4, "em": 4.82, "texto": "Tapioca", "textoEm": 5.62, "imagem": { "id": "tapioca" } },
  { "posicao": 1, "em": 10.8, "texto": "Pão de queijo", "textoEm": 11.3, "imagem": { "id": "paodequeijo" } } ] }
```

- `titulo` (opcional, até ~24 caracteres, caixa alta): numa tarja azul no alto do placar, com "TOP N" em limão. `tituloEm` (padrão `de`).
- `total`: quantas casas o placar tem (padrão: a maior `posicao` dita; mínimo 2). Casas além de 6 ficam menores (mínimo 76 px); com mais de 8, divida em dois placares.
- Cada item:
  - `posicao`: o número (1 a N).
  - `em`: **o instante em que a pessoa diz a posição** ("em quinto"; pegue o `em` de "quinto"): o selo limão bate no placar e voa para a aba da casa (0,5 s).
  - `texto`: o nome da coisa, até ~28 caracteres (se for maior, resuma com as palavras da fala; o que sobrar vai em `detalhe`).
  - `textoEm`: quando o nome é dito: a foto toma a tela. Padrão `em` + 0,5; nunca antes disso (o número precisa assentar). Use o `em` da palavra que nomeia a coisa.
  - `detalhe` e `detalheEm` (opcionais, até ~30 caracteres): uma linha pequena abaixo do nome, só com o que a pessoa disse ("com caldo de cana"). Padrão de `detalheEm`: logo depois de a foto assentar.
  - `imagem`: `{ "id", "foco"?, "efeito"? }`. **Sem `imagem`, ou com imagem `sem`, entra um cartão tipográfico azul com o nome**, que faz o mesmo caminho (toma a tela, voa e vira o corpo da casa). Um ranking inteiro de cartões é um estilo válido (listas de ideias, erros, hábitos).
- `tela`: segundos da foto em tela cheia (0,5 a 1,5; padrão 1; o 1º lugar fica 30% mais). O template encurta sozinho a foto de uma posição quando a seguinte vem logo (mínimo 0,4 s): num ranking rápido, use `tela` 0,6 a 0,8.
- `fecho` (opcional): `{ "texto": "Comenta o seu número 1", "em": 12.95 }`. A chamada final aparece na área da pessoa (y ~1400) com o placar completo em cima; use no lugar do `cta` e estenda o `ate` do `ranking` até o fim do vídeo. O placar fica legível enquanto a pessoa fecha.
- `segredo`: `false` desliga o "?" do 1º lugar (para quem fala do 1º ao último). Com segredo, a casa 1 espera tracejada com um "?" e uma luz que corre; no `em` do 1 o placar escurece, um feixe de luz cai sobre a casa e a foto chega com uma moldura limão.
- **Duração do momento:** de pouco antes da primeira posição até o fim do vídeo, com o `fecho` (o placar completo fica ≥ 1,2 s na tela). Sem `fecho`, termine ≥ 1,2 s depois de a foto do último assentar (`textoEm` + `tela` × 1,3 + 0,35 s) e use o `cta`.
- **Espaço entre posições:** cada uma precisa de ~2 s (0,5 de número + ~1 de foto + 0,5 de voo). O número da seguinte já pode bater enquanto a foto da anterior voa. Se a fala é mais rápida que isso, reduza `tela`, tire `detalhe` ou deixe a pessoa falar com pausa (passo 3 do fluxo).
- A **legenda** fica na emenda durante o ranking, mas **some enquanto a foto (ou o cartão) ocupa a tela**: o nome grande já fala por ela.
- Imagem boa: grande, a coisa inteira, sem texto, de preferência em pé (cobre 1080×1920 com o foco certo).

## 4. Blocos de quadro cheio

Texto em tarjas: cada linha numa placa escura, caixa alta, Rubik 900; o trecho `destaque` (texto exato, como está em `texto`) ganha a tarja azul. Os blocos que se montam na fala procuram cada palavra no que foi dito a partir do `em`: use as palavras da pessoa, na ordem em que ela diz.

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
- `rotulo` (até ~30 caracteres) carimba numa tarja azul embaixo no `rotuloEm` (padrão: `em` + 0,3).
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO (só quando o número não foi dito exatamente assim).
- `imagem` (opcional): o número por cima da foto em tela cheia (vira um corte com número).

### `destaque`: palavra que bate forte

```json
{ "tipo": "destaque", "de": 16.45, "ate": 17.46, "texto": "não joga fora", "em": 16.48, "nivel": "alerta" }
```

- `texto`: 1 a 5 palavras (até ~30 caracteres); carimba no `em`. `nivel`: `chave` (azul, padrão) ou `alerta` (limão, texto escuro: o problema, o "não faça").
- `detalhe` (opcional, até ~60 caracteres): placa escura menor embaixo, no `detalheEm` (padrão: `em` + 0,45).
- Duração: 0,8 a 2 s. `imagem` (opcional): por cima de uma foto em tela cheia.

### `frase`: frase de efeito, conclusão, citação

```json
{ "tipo": "frase", "de": 0, "ate": 1.8, "texto": "Quem guarda mel não perde dinheiro", "destaque": "mel", "risco": "perde dinheiro", "riscoEm": 1.0 }
```

- `texto`: até ~70 caracteres (até 4 linhas). Palavra por palavra na fala a partir do `em` (padrão: `de`). Selo azul de aspas no canto.
- `risco` (opcional): trecho riscado em azul no `riscoEm` (padrão: quando é dito).

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 18.88, "ate": 20.68, "texto": "Manda pra quem joga mel fora", "destaque": "joga mel fora", "em": 18.95, "icone": "seguir" }
```

- `texto`: até ~50 caracteres, palavra por palavra na fala. `icone` (opcional): `salvar`, `seguir`, `comentar` ou `link`, num círculo azul com anel pulsando. Sem ícone, só a chamada.
- Depois de montado, o bloco "respira" (nunca fica parado) e a etiqueta com `marca` entra embaixo. Fica até o último quadro.

## 5. Blocos com a pessoa embaixo

A metade de cima vai de y 128 (abaixo da interface do app) a y 752. Título opcional em branco, caixa alta, 44–78 px, com um traço azul acima; entra palavra por palavra na fala a partir do `de`.

### `topicos`: lista sem ordem (motivos, sinais, dicas)

```json
{ "tipo": "topicos", "de": 1.8, "ate": 3.6, "titulo": "Três sinais de mel puro",
  "itens": [ { "texto": "Cristaliza com o tempo", "em": 2.0, "imagem": { "id": "cristalizado" } },
             { "texto": "Não escorre como água", "em": 2.5, "detalhe": "fica em fio grosso" },
             { "texto": "Cheiro de flor", "em": 3.0 } ] }
```

- 2 a 5 itens; cada um até ~45 caracteres (até 2 linhas); `detalhe` até ~50. Cada cartão salta no seu `em`; o da vez fica azul. `imagem` no item = foto redonda no lugar do marcador.
- O corpo é o maior que cabe (28–62 px) e a lista fica centrada na altura livre.

### `passos`: sequência em ordem

Mesmos campos de `topicos`. Cartões numerados; um traço azul desce do 1 até o passo da vez.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 9.47, "ate": 13.03, "titulo": "O segredo é simples", "modo": "contra",
  "lados": [ { "rotulo": "Água", "texto": "quase nenhuma", "em": 10.82, "imagem": { "id": "agua" } },
             { "rotulo": "Açúcar", "texto": "muito", "em": 12.0, "imagem": { "id": "acucar" } } ] }
```

- `rotulo`: até ~14 caracteres (tarja). `texto`: até ~30 caracteres (2 linhas com foto, 4 sem). `imagem` por lado (opcional): foto em cima do cartão; se só um lado tem, o outro fica com a área escura.
- `modo`: `contra` (VS), `antes-depois` (seta), `errado-certo` (o primeiro lado é o errado: tarja limão e ✗; o segundo, verde e ✓).
- `vencedor` (0 ou 1) e `vencedorEm`: o vencedor ganha borda azul e ✓; o outro fica cinza.
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

- `texto`: até ~70 caracteres, palavra por palavra na fala a partir do `em`. `opcoes` (opcional): 2 a 4, cada uma até ~40 caracteres, no `em` em que é dita (enquete). Sem opções, um "?" azul.

## 6. Regras de tempo

- **Cobertura**: pelo menos 70% do vídeo com algum momento; nenhum trecho só com legenda maior que 3,5 s; pelo menos um momento a cada 8 s; pelo menos 3 tipos diferentes (4 em vídeos com mais de 40 s). O `conferir.mjs` cobra.
- **Nada parado**: dentro de um momento, no máximo 4,5 s sem algo novo (item, palavra, número, troca).
- **Ritmo do Ranking**: o placar é um momento longo, mas sempre com algo novo (número, foto, voo, texto) a cada ~1 s; ao redor, momentos curtos de quadro cheio (a `abertura` de 2 a 3 s, o `cta` de 2 a 3 s) fazem o respiro.
- O primeiro momento começa em 0 (o gancho). O último termina no fim do vídeo.

## 7. Legenda, correções e sons

- **Legenda**: aparece nos trechos sem momento e no `ranking`; some nos outros blocos (eles já mostram o texto). `legenda: true` num momento a mantém; `false` no `ranking` a esconde. `semLegenda: [{ "de": 4.0, "ate": 5.2 }]` esconde num trecho. O template quebra cada frase em telas de até 3 palavras (uma linha) e a tarja azul anda para a palavra falada.
- `correcoes`: `{ "chat GPT": "ChatGPT" }` troca palavras na legenda.
- **Sons** (em `public/sfx`): `bate` no número, `voa` no voo da foto, `casa` ao assentar, `suspense` 1 s antes do 1º lugar, `revela` na revelação, `impacto` no gancho/número/destaque chave, `alerta` no destaque alerta, `tique` em itens, dados e opções, `fim` no `cta`. Dois sons a menos de 0,12 s viram um só.

## 8. O exemplo completo (lanches de rua, 15,2 s)

Fala: "Meu ranking dos lanches de rua do Brasil. Em quinto, o pastel de feira. Em quarto, a tapioca. Em terceiro, a coxinha. Em segundo, o acarajé. E em primeiro lugar, o pão de queijo. Concorda? Comenta o seu número 1 aqui embaixo."

```json
"momentos": [
  {
    "tipo": "abertura",
    "de": 0.2,
    "ate": 2.8,
    "texto": "Meu ranking dos lanches de rua do Brasil",
    "destaque": "lanches de rua",
    "em": 0.28
  },
  {
    "tipo": "ranking",
    "de": 2.8,
    "ate": 12.95,
    "titulo": "Lanches de rua",
    "tituloEm": 2.85,
    "tela": 0.75,
    "itens": [
      {
        "posicao": 5,
        "em": 2.95,
        "texto": "Pastel de feira",
        "textoEm": 3.62,
        "imagem": {
          "id": "pastel"
        }
      },
      {
        "posicao": 4,
        "em": 4.82,
        "texto": "Tapioca",
        "textoEm": 5.62,
        "imagem": {
          "id": "tapioca"
        }
      },
      {
        "posicao": 3,
        "em": 6.4,
        "texto": "Coxinha",
        "textoEm": 7.23,
        "imagem": {
          "id": "coxinha"
        }
      },
      {
        "posicao": 2,
        "em": 8.05,
        "texto": "Acarajé",
        "textoEm": 8.84,
        "imagem": {
          "id": "acaraje"
        }
      },
      {
        "posicao": 1,
        "em": 10.8,
        "texto": "Pão de queijo",
        "textoEm": 11.3,
        "imagem": {
          "id": "paodequeijo"
        }
      }
    ]
  },
  {
    "tipo": "cta",
    "de": 12.95,
    "ate": 15.2,
    "texto": "Comenta o seu número 1",
    "icone": "comentar",
    "em": 13.0
  }
]
```

O `work/imagens.json` que gerou as imagens: um pedido por posição (`pastel`, `tapioca`, `coxinha`, `acaraje`, `paodequeijo`), com `busca` em inglês ou pelo nome do prato; "pastel" em português trouxe quadros do pintor Degas, por isso o pedido usou "pastel de bacalhau"/"fried pastry". Fotos CC BY ficam em `creditos.txt`.

**O mesmo ranking sem foto:** é só tirar o `imagem` de cada item. Cada posição vira um cartão azul com o nome, que toma a tela, voa e vira o corpo da casa:

```json
{ "tipo": "ranking", "de": 2.8, "ate": 12.95, "titulo": "Erros em cripto", "itens": [
  { "posicao": 3, "em": 2.95, "texto": "Comprar porque subiu" },
  { "posicao": 2, "em": 4.82, "texto": "Tudo numa corretora" },
  { "posicao": 1, "em": 6.4, "texto": "Dinheiro que não pode perder" } ] }
```
