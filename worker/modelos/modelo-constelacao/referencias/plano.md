# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `ocular` e `ceu`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: tela cheia × carta
3. Blocos de tela cheia (`abertura`, `destaque`, `frase`, `pergunta`, `cta`, `numero` no peito)
4. Blocos de carta (`topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao`)
5. A assinatura: `constelacao`
6. Onde fica a ocular
7. Céu de verdade: `ceu` e `carta` (para vídeos sobre o céu)
8. Regras de tempo
9. Legenda, correções e sons
10. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Finanças" },
  "sfx": true,
  "ocular": { "zoom": 0.5, "alturaRosto": 0.45 },
  "correcoes": {}
}
```

- `marca`: `nome` e `area` viram a assinatura que corre no arco de cima da ocular ("CARLA · FINANÇAS") e a linha do fechamento. Juntos, até ~24 caracteres. Vazios = sem assinatura.
- `sfx`: `false` desliga os sons.
- `ocular` (opcional): o enquadramento da pessoa dentro da janela redonda. Sem ele, o zoom vem da largura do rosto medida no `cortar` (gravação de perto afasta). `zoom` (0,3 a 0,7) aumenta o rosto; `alturaRosto` (0,35 a 0,55) é onde o centro do rosto fica no círculo, de cima para baixo. Se o cabelo encostar na borda de cima, **diminua** o zoom ou aumente `alturaRosto`.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão. `zona.topo` é onde começa o texto no peito (logo abaixo do queixo).

## 2. A gramática: tela cheia × carta

| Lugar | Blocos | A pessoa | A tela |
|---|---|---|---|
| **Tela cheia** | `abertura`, `destaque`, `frase`, `pergunta`, `cta`, `numero` com `tela: "cheia"` e trechos sem momento | rosto na linha do centro | o texto no peito, sobre um degradê escuro; a legenda nos trechos sem momento |
| **Carta** | `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao`, `constelacao`, `carta` | numa **ocular** redonda e escura, com anel graduado e a assinatura no arco | uma carta celeste desenhada (grade, Via Láctea, estrelinhas), com o bloco desenhado em estrelas, linhas e nomes |

O que o template já faz sozinho:

- **Íris.** Momentos de carta colados (ou com menos de 1,5 s entre eles) formam um bloco só. No começo do bloco, o quadro cheio se fecha como uma íris em volta do rosto e leva a pessoa até a ocular (0,7 s); no fim, ela se abre de volta para a tela cheia. As duas trocas começam no corte mais próximo (até 0,3 s antes do `de`). O texto de tela cheia fica **dentro** da íris: o próprio círculo o apaga ao fechar e o revela ao abrir. A carta já está lá, a lápis, enquanto a íris fecha, e só sai quando o círculo cobre a tela.
- **A luneta anda.** Dentro de um bloco, a cada momento novo o céu inteiro desliza (para baixo ou para cima, alternando) e a ocular muda de canto: o bloco que sai vai embora com o céu e o que entra chega com ele. Nunca dois blocos parados um sobre o outro.
- **A ocular alterna sozinha** entre `topo-direita`, `baixo-centro` e `topo-esquerda` (nunca repete a posição dentro de um bloco; a `constelacao` vai sempre para um canto de cima, onde a carta é mais alta). Use `ocular` no momento só para forçar outra posição (seção 6).
- **Tudo nasce a lápis.** Cada estrela que vai acender tem um círculo tracejado; cada linha futura é um pontilhado; cada texto aparece apagado. Na palavra dita, ganha tinta. Nada de caixa vazia.
- **O localizador** (círculo vermelho com quatro marcas) vai para cada coisa no instante em que é dita; se a primeira coisa do bloco demora, ele chega antes, "procurando".
- **Texto que cabe.** Cada bloco mede o texto e diminui o corpo até caber (até 2 ou 3 linhas), sem cortar. Os limites abaixo existem para o texto não ficar pequeno demais.
- **Último momento**: fica até o último quadro.

Dois cuidados seus:
- **Momentos encostados**: o `ate` de um = o `de` do próximo, na pausa entre as frases (de preferência exatamente num valor de `cortesEm`).
- **Abra e feche em tela cheia** e **alterne**: depois de um ou dois blocos de carta, um de tela cheia; nunca três momentos iguais seguidos.

## 3. Blocos de tela cheia

O texto fica no peito, centralizado, em Spectral, e se monta **palavra por palavra no instante em que cada uma é dita** (o template procura cada palavra na fala). Use as palavras da pessoa, na ordem em que ela diz (pode pular palavras). Números em algarismo ("10") casam com a palavra falada ("dez").

Todos aceitam `em` (opcional): o instante em que o texto começa a ser dito, quando o momento começa antes da primeira palavra.

### `abertura`: a promessa, a pergunta, o tema

```json
{ "tipo": "abertura", "de": 0, "ate": 3.1, "rotulo": "Vendas no Direct", "texto": "Seu cliente pergunta o preço no Direct e some", "destaque": "e some", "em": 0.33 }
```

- `texto`: até ~50 caracteres.
- `destaque` (opcional): o trecho exato que ganha linha própria em itálico maior (o nome da coisa, a promessa, o problema). Até ~20 caracteres.
- `rotulo` (opcional): o tema em 2 a 4 palavras (até ~22 caracteres), num letreiro entre dois filetes.
- Uma miniatura da constelação do vídeo (a primeira `constelacao` ou `carta` do plano) se acende num canto do céu, longe da cabeça, enquanto o título é dito. Num vídeo que não é sobre o céu, ela vem num disco de carta escuro (legível em qualquer fundo). Se a cabeça ocupa os dois cantos (gravação muito perto), ela não aparece.
- Forma antiga (ainda aceita): `linhas` (2 ou 3) e `enfase` (índice da linha em itálico).

### `destaque`: uma palavra ou frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.91, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: até ~30 caracteres (corpo de 116 até 66 px, até 3 linhas). `em`: a primeira palavra dita.
- `nivel`: `"alerta"` = texto em vermelho de lanterna, com o localizador que se desenha acima e duas notas descendo (risco, erro, perda); `"chave"` (padrão) = branco, com uma estrela de quatro pontas que se enche e um sublinhado que se desenha.
- `detalhe` (opcional, até ~40 caracteres) e `detalheEm`: uma linha menor em itálico embaixo.

### `frase`: frase de efeito, opinião, conclusão

```json
{ "tipo": "frase", "de": 33.83, "ate": 35.55, "texto": "Sem promessa de lucro", "risco": "promessa de lucro" }
```

- `texto`: até ~70 caracteres, fiel ao que foi dito.
- `destaque` (opcional): trecho exato em linha própria, itálico maior.
- `risco` (opcional): trecho exato riscado em vermelho **enquanto é dito** (o que não é). `riscoEm` força o instante em que o risco começa.

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.55, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres. Um "?" num anel que se desenha fica acima.
- `opcoes` (opcional): 2 a 4 selos de até ~30 caracteres, cada um no `em` da palavra que o nomeia (o selo nasce tracejado e acende).

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "icone": "link", "destaque": "Saiba Mais" }
```

- `texto`: a chamada falada, até ~45 caracteres. Curta (até ~16 caracteres), fica numa linha com o ícone ao lado; mais longa, o ícone vai em cima.
- `icone`: `salvar` (padrão), `seguir`, `comentar` ou `link`; preenche na primeira palavra (ou em `acaoEm`).
- `destaque`: trecho que fica em itálico com um sublinhado quando é dito.
- `detalhe` (opcional): uma segunda linha falada, em itálico (até ~28 caracteres). `nuvemEm` (opcional, só para fala sobre céu limpo): uma nuvem a traço se desfaz e vira estrela.
- A assinatura (`marca`) entra embaixo.

### `numero` no peito (`tela: "cheia"`)

O mesmo bloco `numero` da seção 4, desenhado no peito: bom para abrir o vídeo com um número ("O Bitcoin rompeu os 83 mil dólares").

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "tela": "cheia", "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

## 4. Blocos de carta

A pessoa vai para a ocular (seção 6). O título do bloco (`titulo`, opcional, até ~40 caracteres) fica ao lado da ocular quando ela está no alto, ou no topo da carta quando ela está embaixo: itálico, sublinhado, como o nome de uma constelação; ele se acende palavra por palavra.

### `topicos`: lista sem ordem (motivos, erros, dicas, sinais)

```json
{ "tipo": "topicos", "de": 3.0, "ate": 9.0, "titulo": "Três erros na alta",
  "itens": [ { "texto": "Comprar por impulso", "em": 3.4 },
             { "texto": "Moeda sem critério", "em": 5.1, "detalhe": "escolha por moda" },
             { "texto": "Risco sem entender", "em": 7.2 } ] }
```

- `itens`: 2 a 5, cada um com `texto` (1 a 5 palavras, até ~30 caracteres), `em` e `detalhe` opcional (até ~40, em letra menor).
- Cada item é uma estrela (de brilhos diferentes, espalhadas como um aglomerado) com o nome ao lado; acende na palavra e o localizador vai até ela. Todos os itens têm o mesmo corpo (de 92 até 48 px); itens curtos ficam grandes.

### `passos`: sequência em ordem (processo, caminho, como fazer)

```json
{ "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita: como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.91 }, { "texto": "Os riscos", "em": 31.86 }, { "texto": "A escolha dos ativos", "em": 32.29 } ] }
```

- Mesmos campos de `topicos`. As estrelas são numeradas e se ligam por uma linha azul-gelo, uma a uma, no `em` de cada passo; a última ganha raios.

### `numero`: um número que conta

```json
{ "tipo": "numero", "de": 8, "ate": 11, "valor": 42, "em": 8.6, "sufixo": "%", "rotulo": "dos alunos desistem" }
```

- `valor` (número), `em` (a palavra do número: o contador começa ali), `rotulo` (o que é, até ~30 caracteres, em letreiro; fica ao lado da ocular quando ela está no alto). `rotuloEm` (opcional) = quando o rótulo se acende.
- `prefixo` ("R$", "US$") e `sufixo` ("mil", "%", "dias") ficam menores ao lado. Escreva o número inteiro em `valor` (83000, não 83). `casas`: casas decimais (1,5 → `"valor": 1.5, "casas": 1`). Formato pt-BR automático.
- O desenho embaixo escolhe sozinho: **estrelas de quatro pontas** que acendem uma a uma quando é um inteiro de 1 a 12 (o número conta junto); um **anel graduado** que se enche em vermelho quando o sufixo é "%"; para qualquer outro número, uma **régua graduada** de 0 a um fim redondo (83.000 → 0 a 100 mil) com a reta vermelha correndo junto com a contagem até uma cruz.
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO.
- `tela: "cheia"` desenha o bloco no peito, com a pessoa em tela cheia (seção 3).

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `lados`: exatamente 2, um sobre o outro, cada um com uma estrela grande, `rotulo` em letreiro (até ~16 caracteres) e `texto` grande (até ~30 caracteres).
- `modo`: `contra` (padrão: × entre as duas estrelas), `antes-depois` (a reta vermelha tracejada desce do "antes" ao "depois", com seta; o "antes" apaga), `errado-certo` (o letreiro do errado em vermelho; quando o certo é dito, o errado é riscado em vermelho e apaga, e o certo ganha raios e um visto).
- `vencedor` (0 ou 1) e `vencedorEm` (opcional): o vencedor ganha raios; o outro apaga.
- `titulo` (opcional): até ~40 caracteres.

### `grafico`: gráfico feito de estrelas

```json
{ "tipo": "grafico", "de": 8, "ate": 12, "titulo": "Faturamento por trimestre", "forma": "barras", "unidade": "R$",
  "dados": [ { "rotulo": "Abril", "valor": 3500, "em": 8.8 }, { "rotulo": "Dezembro", "valor": 15000, "em": 10.0 } ] }
```

- `forma`: `barras` (uma haste azul-gelo que sobe da linha de base com uma estrela no topo, valor em cima, rótulo embaixo), `linha` (estrelas na altura de cada valor, ligadas como uma constelação, uma a uma) ou `pizza` (um anel graduado com um arco por dado, cada um na sua cor, e a legenda ao lado).
- `dados`: 2 a 6 números **ditos**, cada um com `rotulo` (até ~16 caracteres), `valor` e `em`.
- `unidade` (opcional): `"%"`, `"R$"`, `"US$"` (no número) ou uma palavra ("alunos", que vai num letreiro no alto). Valores de 10 mil para cima viram "15 mil".
- **Sem números ditos**: tire `dados` e use `tendencia` (`sobe`, `cai` ou `oscila`), `tendenciaEm` (a palavra da tendência) e `ilustrativo: true`. `linha` vira uma trajetória de estrelas que se liga na fala e termina numa estrela com raios; `barras` vira hastes que crescem uma a uma. A etiqueta ILUSTRATIVO aparece no alto.
- `titulo` (opcional): até ~40 caracteres.

### `definicao`: termo explicado

```json
{ "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo`: até ~20 caracteres (itálico grande, de 136 até 70 px, até 2 linhas): é o nome de uma estrela brilhante que acende com raios no `em`.
- `significado`: até ~60 caracteres (até 3 linhas). No `significadoEm`, a reta vermelha tracejada desce da estrela até uma cruz, e o significado se escreve ao lado dela.

## 5. A assinatura: `constelacao`

Cada ideia é uma estrela que acende e ganha nome no instante em que é dita; as estrelas se ligam numa figura; a figura ganha nome; e uma reta vermelha tracejada sai da figura até o **alvo** (aonde aquilo leva), com uma cruz e a rosa dos ventos. **Use pelo menos uma vez em todo vídeo** (veja "A assinatura em qualquer assunto" no SKILL.md).

```json
{ "tipo": "constelacao", "de": 14.93, "ate": 23.63, "titulo": "Mesmo na alta", "tituloEm": 14.93,
  "estrelas": [ { "texto": "Compra por impulso", "em": 17.73 },
                { "texto": "Moeda sem critério", "em": 19.78 },
                { "texto": "Risco que não entende", "em": 21.75 } ],
  "alvo": { "texto": "Tem gente que perde", "em": 15.96 } }
```

- `estrelas`: 2 a 6, na ordem em que são ditas. `texto` curto: **1 a 4 palavras, até ~22 caracteres** (o nome fica ao lado da estrela, em itálico, de 62 até 44 px, até 3 linhas). `em`: a palavra que nomeia a ideia.
- A figura vem do número de estrelas: 2 = um par; 3 = triângulo; 4 = cruz (como o Cruzeiro); 5 = W (como Cassiopeia); 6 = concha (como a Ursa Maior). Os nomes ficam dos dois lados, fora da figura (nunca cruzam uma linha).
- `ligar` (opcional): `"figura"` (padrão) liga as estrelas no desenho da figura (o triângulo fecha, a cruz cruza); `"caminho"` liga cada estrela só à seguinte, para uma sequência ("primeiro… depois… só então…"). Cada linha se desenha quando as duas estrelas dela já acenderam.
- `titulo` (opcional, até ~30 caracteres): o nome da figura, ao lado da ocular; `tituloEm` = quando ele começa a ser dito.
- `alvo` (opcional): `{ "texto", "em", "chegaEm"? }`, aonde a figura leva (até ~24 caracteres, **dito na fala**). A cruz e o nome entram no `em`; a reta sai da última estrela e chega ao alvo logo depois da última estrela (ou no `em`, se o alvo é dito depois dela); `chegaEm` força a chegada. Sem alvo dito, deixe sem `alvo`.
- O localizador vai de estrela em estrela e, no fim, segue a ponta da reta até o alvo; a figura inteira pulsa quando a reta chega.

## 6. Onde fica a ocular

Nos momentos de carta, `ocular` (opcional) força a posição; sem ele, o template alterna sozinho (seção 2).

| `ocular` | A pessoa | O conteúdo | Bom para |
|---|---|---|---|
| `topo-direita` / `topo-esquerda` | no alto, num canto | o título ao lado da ocular; o conteúdo da metade para baixo, na largura toda | constelação, listas com título, definição, gráficos |
| `baixo-centro` | embaixo, no meio | o título e o conteúdo na metade de cima, na largura toda | comparação, passos, número, gráficos de linha |
| `baixo-direita` / `baixo-esquerda`, `meio-direita` / `meio-esquerda` | posições da carta de céu real | — | use só na `carta` (seção 7) |

Nos blocos de carta não use `"legenda": true`: a carta já mostra o que é dito, e a faixa da legenda fica com a ocular.

## 7. Céu de verdade: `ceu` e `carta` (para vídeos sobre o céu)

Quando o vídeo é sobre o céu (achar uma constelação, uma estrela, um planeta), a assinatura é a **carta celeste de verdade**: estrelas reais do catálogo, na posição certa, e passos que acontecem na fala. O demo do modelo (Cruzeiro do Sul) é feito assim. Para qualquer outro assunto, use a `constelacao` (seção 5).

### O céu (`ceu`)

```json
"ceu": {
  "estrelas": [ { "id": "acrux" }, { "id": "mimosa" }, { "id": "gacrux" }, { "id": "imai" }, { "id": "ginan" },
                { "id": "alfa-centauro" }, { "id": "beta-centauro" } ],
  "pontos": [ { "id": "polo-sul" } ],
  "centro": { "ar": 12.45, "dec": -70 },
  "viaLactea": true
}
```

Ids do catálogo (`src/catalogo.ts`):

| Grupo | ids |
|---|---|
| Cruzeiro do Sul | `acrux` (pé, a Estrela de Magalhães), `gacrux` (topo), `mimosa` (braço esquerdo), `imai` (braço direito), `ginan` (a Intrometida, fraca) |
| Ponteiras (Centauro) | `alfa-centauro`, `beta-centauro` |
| Falso Cruzeiro | `avior`, `aspidiske`, `delta-velorum`, `markeb` |
| Órion e Três Marias | `betelgeuse`, `rigel`, `bellatrix`, `saiph`, `meissa`, `alnitak`, `alnilam`, `mintaka` (as três últimas são as Três Marias) |
| Escorpião | `antares`, `acrab`, `dschubba`, `pi-escorpiao`, `sigma-escorpiao`, `tau-escorpiao`, `epsilon-escorpiao`, `mu-escorpiao`, `zeta-escorpiao`, `eta-escorpiao`, `sargas`, `iota-escorpiao`, `girtab`, `shaula`, `lesath` |
| Brilhantes avulsas | `sirius`, `canopus`, `achernar`, `aldebaran`, `pleiades`, `procyon`, `vega`, `altair`, `arcturus`, `spica`, `fomalhaut`, `polaris` |
| Pontos | `polo-sul`, `polo-norte` |

- Astro fora do catálogo: `{ "id": "jupiter", "ar": 4.2, "dec": 20.5, "mag": -2.5, "nome": "Júpiter" }` (ascensão reta em **horas**, declinação em graus), só com coordenadas confiáveis. Planeta muda de lugar: só com a data certa.
- `mag`: quanto **menor**, maior o ponto (−1,5 a 5). `centro`: o centro da projeção (define o "para cima"; a carta é o céu visto de baixo, norte para cima e **leste à esquerda**). `viaLactea`: desenha a faixa pontilhada e o Saco de Carvão. `semente`: muda as estrelinhas de fundo.
- Com `ceu` de estrelas reais, a carta inteira (inclusive os blocos universais) usa esse céu de fundo.

### `carta`

```json
{ "tipo": "carta", "de": 1.67, "ate": 6.25, "legenda": true, "ocular": "topo-direita",
  "passos": [
    { "acao": "acender", "em": 2.03, "estrelas": ["gacrux", "mimosa", "acrux", "imai"], "ritmo": 0.5, "contador": "estrelas brilhantes" },
    { "acao": "ligar", "em": 3.94, "linhas": [["gacrux", "acrux"], ["mimosa", "imai"]], "nome": "Cruzeiro do Sul", "nomeEm": 4.38 },
    { "acao": "afastar", "em": 4.71, "fator": 0.62 },
    { "acao": "rumo", "em": 5.45, "direcao": "S" } ] }
```

- `ocular`: qualquer uma das seis posições de canto e meio (topo, meio e baixo, à direita ou à esquerda). Uma reta que desce pede `meio-*`; figura larga, `topo-*`.
- `enquadrar` (opcional): ids que precisam estar no quadro desde o começo do momento.
- `passos`: um a cada 1 a 2 s, cada um no `em` da palavra. `legenda: true` costuma ser bom na carta (ela mostra poucas palavras).

| `acao` | Campos | O que acontece |
|---|---|---|
| `acender` | `estrelas`, `ritmo` (padrão 0,45), `contador` (opcional) | as estrelas acendem uma a uma; com `contador`, o total aparece grande no canto livre ao lado da ocular, com um marcador por estrela |
| `ligar` | `linhas` (pares de ids), `nome`, `nomeEm` | as linhas se desenham; o nome da figura se escreve embaixo dela, em itálico |
| `afastar` | `fator` (0,5–0,8) | a câmera se afasta |
| `rumo` | `direcao`: `N`, `S`, `L` ou `O` | a rosa dos ventos se desenha num canto, com a direção em vermelho |
| `destacar` | `de`, `ate`, `texto` | o segmento fica vermelho e uma cota com o texto aparece do lado de fora |
| `prolongar` | `de`, `ate`, `alvo`, `chegaEm`, `marca` `{ texto, em, rosa }` | a reta continua tracejada até o alvo, com marcas de medida; no alvo, cruz, anéis, rosa e nome |
| `brilhar` | `estrelas` | a estrela cresce e ganha raios |
| `nomear` | `estrela`, `texto`, `lado` | linha-guia e nome em itálico |
| `apontar` | `de`, `por`, `alvo`, `texto`, `textoEm` | seta pontilhada vermelha que passa por `por` até perto do `alvo`; selo com visto |

Regras: tudo verdadeiro no céu e fiel à fala; `acender` antes de `ligar`, `nomear` e `brilhar` das mesmas estrelas; `prolongar` só quando a reta realmente aponta para o alvo; limites: `contador` até 26 caracteres, `nome` até 20, `destacar.texto` até 24, `marca.texto` até 20, `nomear.texto` até 18, selo até 16. Uma `carta` com x/y (sem céu real) também funciona, mas para ideias a `constelacao` é mais simples.

## 8. Regras de tempo

- **Fronteiras na pausa entre frases**: o `de` de um = o `ate` do anterior = o valor de `cortesEm` entre as duas frases (ou, sem corte, o `em` da primeira palavra menos 0,1). O primeiro momento começa em 0; o `ate` do último é a `duracao`.
- **Sub-passos** (`itens[].em`, `estrelas[].em`, `lados[].em`, `dados[].em`, `opcoes[].em`, `alvo.em`, `significadoEm`, `tendenciaEm`…): o `em` da palavra, tirado de `work/palavras.json`. Nada aparece antes de ser dito (só o esboço a lápis).
- **Nada parado mais de ~2,5 s**: momento com mais de ~4 s precisa de coisas entrando por dentro dele (o `conferir.mjs` reprova acima de 4,5 s).
- **Duas telas cheias seguidas** (ex.: `abertura` e `frase`): o texto que sai some inteiro antes do que entra; deixe a fronteira na pausa.
- **Frase com `risco` curta**: o risco corre enquanto o trecho é dito; se o momento acaba logo depois, adiante `riscoEm`.
- **Só pessoa e legenda**: no máximo ~3 s, e só em respiros.

## 9. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`, uma linha por vez, numa placa escura: abaixo do peito em tela cheia, acima da interface do app nas cartas. Ela **some durante os momentos** (o bloco já mostra o que é dito) e aparece nos trechos sem momento; `"legenda": true` no momento a mantém (use só na `carta` de céu real). `semLegenda` acrescenta faixas sem legenda.

Palavras que a transcrição errou vão em `correcoes`, sem mexer em `palavras`: `{ "Jão": "João", "Celeste": "Celeste." }`. A chave pode ter várias palavras seguidas e `""` apaga. Só corrija o que você tem certeza. Rode `node scripts/legendas.mjs` e corrija linhas com palavra sozinha.

Sons (automáticos, tonais, nunca dois a menos de 0,3 s; `"sfx": false` desliga): um sopro grave quando a íris fecha e abre (e mais leve quando a luneta muda de lugar); uma nota curta por estrela, item, dado, lado ou opção que acende (subindo de altura); um tom grave quando a reta chega ao alvo, quando um número termina de contar e quando a definição chega; duas notas no visto (vencedor, certo); duas notas descendo no destaque de alerta; uma no ícone do fechamento.

## 10. Exemplos completos

### Cripto (assunto fora do céu)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.89, "tela": "cheia", "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.91, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "constelacao", "de": 14.93, "ate": 23.63, "titulo": "Mesmo na alta", "tituloEm": 14.93,
      "estrelas": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.78 }, { "texto": "Risco que não entende", "em": 21.75 } ],
      "alvo": { "texto": "Tem gente que perde", "em": 15.96 } },
    { "tipo": "pergunta", "de": 23.63, "ate": 28.03, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita: como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.91 }, { "texto": "Os riscos", "em": 31.86 }, { "texto": "A escolha dos ativos", "em": 32.29 } ] },
    { "tipo": "frase", "de": 33.83, "ate": 35.55, "texto": "Sem promessa de lucro", "risco": "promessa de lucro" },
    { "tipo": "pergunta", "de": 35.55, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "icone": "link", "destaque": "Saiba Mais" }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

Por que assim: abre com o número contando no peito; a definição e a comparação vão para a carta (a ocular no alto e depois embaixo); o alerta volta à tela cheia; os três motivos viram a constelação, com o alvo "Tem gente que perde" marcado quando é dito e a reta chegando nele quando a pessoa termina o último motivo; a pergunta, a frase riscada, a pergunta com opções e o fechamento ficam em tela cheia, intercalados com os passos da aula na carta.

### Céu de verdade (o exemplo do modelo)

Fala: "Sabe achar o Cruzeiro do Sul? Procura quatro estrelas brilhantes formando uma cruz pequena no céu do sul. O braço mais comprido aponta pra direção do polo sul celeste. Do lado, duas estrelas muito brilhantes, Alfa e Beta Centauro, ajudam a confirmar. Salva e testa na próxima noite sem nuvem."

```json
{
  "marca": { "nome": "Tiago", "area": "Céu noturno" },
  "ceu": {
    "estrelas": [ { "id": "acrux" }, { "id": "mimosa" }, { "id": "gacrux" }, { "id": "imai" }, { "id": "ginan" },
                  { "id": "alfa-centauro" }, { "id": "beta-centauro" } ],
    "pontos": [ { "id": "polo-sul" } ],
    "centro": { "ar": 12.45, "dec": -70 },
    "viaLactea": true
  },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 1.67, "rotulo": "Céu noturno", "texto": "Sabe achar o Cruzeiro do Sul?", "destaque": "Cruzeiro do Sul?" },
    { "tipo": "carta", "de": 1.67, "ate": 6.25, "legenda": true, "ocular": "topo-direita", "passos": [
      { "acao": "acender", "em": 2.03, "estrelas": ["gacrux", "mimosa", "acrux", "imai"], "ritmo": 0.5, "contador": "estrelas brilhantes" },
      { "acao": "ligar", "em": 3.94, "linhas": [["gacrux", "acrux"], ["mimosa", "imai"]], "nome": "Cruzeiro do Sul", "nomeEm": 4.38 },
      { "acao": "afastar", "em": 4.71, "fator": 0.62 },
      { "acao": "rumo", "em": 5.45, "direcao": "S" } ] },
    { "tipo": "carta", "de": 6.25, "ate": 10.03, "legenda": true, "ocular": "meio-direita",
      "enquadrar": ["gacrux", "mimosa", "acrux", "imai"], "passos": [
      { "acao": "destacar", "em": 6.33, "de": "gacrux", "ate": "acrux", "texto": "braço mais comprido" },
      { "acao": "prolongar", "em": 7.78, "de": "gacrux", "ate": "acrux", "alvo": "polo-sul", "chegaEm": 8.85,
        "marca": { "texto": "Polo Sul Celeste", "em": 8.8, "rosa": true } } ] },
    { "tipo": "carta", "de": 10.03, "ate": 16.21, "legenda": true, "ocular": "topo-esquerda",
      "enquadrar": ["gacrux", "mimosa", "acrux", "imai", "alfa-centauro", "beta-centauro"], "passos": [
      { "acao": "acender", "em": 10.92, "estrelas": ["alfa-centauro", "beta-centauro"], "ritmo": 0.3, "contador": "estrelas muito brilhantes" },
      { "acao": "brilhar", "em": 11.8, "estrelas": ["alfa-centauro", "beta-centauro"] },
      { "acao": "nomear", "em": 13.23, "estrela": "alfa-centauro", "texto": "Alfa Centauro", "lado": "baixo" },
      { "acao": "nomear", "em": 13.83, "estrela": "beta-centauro", "texto": "Beta Centauro", "lado": "cima" },
      { "acao": "apontar", "em": 15.12, "de": "alfa-centauro", "por": "beta-centauro", "alvo": "gacrux", "texto": "confirmado", "textoEm": 15.5 } ] },
    { "tipo": "cta", "de": 16.21, "ate": 19.32, "texto": "Salva e testa", "icone": "salvar", "acaoEm": 16.26,
      "detalhe": "na próxima noite sem nuvem", "nuvemEm": 18.2 }
  ],
  "semLegenda": [],
  "correcoes": { "céu do sul": "céu do sul.", "Celeste": "Celeste." }
}
```
