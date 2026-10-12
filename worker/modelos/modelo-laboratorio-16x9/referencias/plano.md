# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. Folhas, troca de folha e lugares da foto
3. Os blocos universais (abertura, topicos, passos, numero, comparacao, grafico, destaque, definicao, frase, pergunta, cta)
4. A assinatura: as figuras de experimento (espectro, particulas, ondas, observador, trajeto) e as anotações
5. Como escolher os blocos
6. Regras de tempo
7. Legenda e correções
8. Exemplos completos (o demo de ciência e um vídeo de cripto)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Ana Lima", "area": "Química" },
  "sfx": true,
  "correcoes": { "Segue para": "Segue pra" }
}
```

- `marca`: o nome e a área vão na assinatura impressa do fechamento ("ANA LIMA · QUÍMICA"); a área também vai na linha impressa da `abertura`. `nome` vazio = sem assinatura.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão. (O Laboratório não usa a `zona`: a pessoa muda de lugar.)
- `caixas` (opcional, raro): ajuste fino da pessoa em cada lugar, por exemplo `"caixas": { "direita": { "zoom": 1.4 } }` se o rosto ficar grande demais na foto do canto, ou `{ "topo": { "ancoraY": 0.42 } }` para subir o rosto na foto grande. Sem isso, o zoom se ajusta sozinho ao tamanho do rosto medido pelo `cortar.mjs` (selfie perto da câmera ou plano aberto). `ancoraY`: 0 = rosto no alto da foto, 1 = embaixo (padrão 0,46–0,47).

## 2. Folhas, troca de folha e lugares da foto

Cada momento é uma **folha** do caderno. A pessoa é uma foto redonda **colada na folha** (borda de papel, dois pedaços de fita), sempre no lugar reservado para ela; o conteúdo é diagramado em volta desse lugar, então a foto nunca fica por cima de texto ou desenho. Quando um momento começa:

1. **A folha nova sobe de baixo por cima da anterior** (~0,7 s), já com tudo esboçado a lápis e a foto no lugar novo. A anterior sobe um pouco junto, só o bastante para a foto dela sair pelo alto: nunca há papel vazio e nenhum rosto é coberto. Durante a troca aparecem as duas fotos (mudas; a voz vem do som do vídeo, que toca o tempo todo).
2. Quando a folha assenta, um **círculo a tinta** é riscado em volta da foto.
3. Cada parte é **passada a tinta** (ou pintada a lápis de cor) no instante marcado no plano.

Saindo da tela cheia (no começo, ou depois de um respiro), a pessoa encolhe até o lugar da foto: para o `topo`, a folha sobe colada embaixo dela; para os cantos, a folha já está no lugar e a pessoa, encolhendo, revela o título e o desenho. A troca começa no `de` do momento, encostada no corte mais próximo (o movimento esconde o pulo do corte).

| Lugar | A foto | A folha | Padrão de |
|---|---|---|---|
| `topo` | foto redonda grande no alto, centralizada | linha impressa + texto embaixo, na largura toda (~950 × 590 px) | `abertura`, `titulo`, `destaque`, `definicao`, `frase`, `cta` |
| `direita` | foto redonda no canto de cima, à direita | **cabeçalho** ao lado dela (~480 × 410 px: linha impressa + título à mão) + **corpo** embaixo, na largura toda (~950 × 765 px, até y 1440) | `topicos`, `numero`, `pergunta`, `espectro`, `ondas`, `anotacoes` |
| `esquerda` | o mesmo, espelhado | o mesmo, espelhado | `passos`, `comparacao`, `grafico`, `particulas`, `trajeto` |
| `baixo` | foto no centro, embaixo, em pé no horizonte | o céu da figura em cima dela | só `observador` |

- **A foto troca de lugar a cada folha** (é a assinatura do modelo). Quando duas folhas seguidas cairiam no mesmo canto, a segunda vai para o outro sozinha; quando duas folhas de texto seguidas cairiam no `topo`, a segunda vai para um canto (a abertura e o fechamento ficam no topo). Para forçar um lugar, use `"layout"` no momento.
- Antes do primeiro momento e em qualquer respiro de mais de 0,3 s entre momentos, a pessoa fica em **tela cheia** (com legenda). Comece o primeiro momento ~0,15 s depois do início: o primeiro quadro com o rosto cheio é o gancho.
- **A linha impressa** de cada folha é o campo `rotulo` (até ~22 caracteres, ex.: "Fig. 2 · Bitcoin"). Sem `rotulo`, o modelo escreve sozinho "Fig. N · <nome>" nos desenhos e "Nota N · <nome>" nos blocos de texto (Medida, Amostras, Procedimento, Observações, Atenção, Definição, Anotação, Pergunta…). No `numero`, a linha impressa é `impresso` (o `rotulo` é o nome do número).

## 3. Os blocos universais

Os limites de texto existem porque cada bloco mede o texto e diminui a letra para caber: passou do limite, a letra fica pequena no celular. Se a ideia não cabe, encurte com as palavras da fala. Texto à mão é escrito **palavra por palavra no tempo da fala** (o tempo de cada palavra é achado sozinho dentro do momento): escreva as palavras **na ordem em que são faladas**.

`abertura`, `frase`, `pergunta` e `cta` aceitam `em?`: o instante em que o texto começa a ser dito (padrão: `de`). Use quando o momento começa antes da primeira palavra do texto.

**Cabeçalho** (nos blocos com a foto num canto): `titulo` (texto, até ~30 caracteres; quebra sozinho em até 3 linhas, de 104 a 64 px) e a linha impressa (`rotulo`). Com a foto no `topo`, o título vai numa linha no alto do corpo.

### `abertura` — o tema, a promessa, a pergunta inicial (padrão: `topo`)

```json
{ "tipo": "abertura", "de": 0.15, "ate": 2.78, "texto": "Três peças para se vestir melhor sem esforço", "destaque": "sem esforço", "em": 0.29 }
```

- `texto` até ~50 caracteres: quebra sozinho em até 3 linhas, de 150 a 84 px. `destaque` (trecho exato) em azul, com sublinhado ondulado; `corDestaque`: `"vermelho"` para um problema.
- Linha impressa: `rotulo` à esquerda (padrão "Experimento") e `assunto` à direita (padrão: a área da `marca`).
- O nome antigo `titulo` (com `linhas`: 1 a 3 linhas dadas à mão) continua valendo.
- Sem legenda (o caderno escreve a fala).

### `topicos` — lista sem ordem: motivos, erros, dicas, sinais (padrão: `direita`)

```json
{ "tipo": "topicos", "de": 2.78, "ate": 6.34, "legenda": true, "rotulo": "Peça 1 · Camisa", "titulo": "Camisa branca",
  "itens": [ { "texto": "de algodão", "em": 4.17 }, { "texto": "bem ajustada no ombro", "em": 5.07, "detalhe": "sem sobrar tecido" } ] }
```

- `itens`: 2 a 5; `texto` de 2 a 6 palavras (até ~30 caracteres; quebra em 2 linhas); `em` = a primeira palavra do item. `detalhe` opcional (menor, tom suave), escrito na fala logo depois do item.
- Cada item ganha uma setinha a tinta; a do item da vez fica azul e os anteriores descansam um tom abaixo.

### `passos` — sequência em ordem: processo, caminho, como fazer (padrão: `esquerda`)

```json
{ "tipo": "passos", "de": 27.95, "ate": 33.4, "legenda": true, "rotulo": "Fig. 5 · Como eu analiso", "titulo": "Aula gratuita",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- `itens`: 2 a 5, na ordem; mesmos limites do `topicos`; `detalhe` opcional.
- Números em círculos a tinta, ligados por um traço que desce até o próximo passo quando ele é dito; o passo da vez é pintado de azul.

### `numero` — um número dito (padrão: `direita`)

```json
{ "tipo": "numero", "de": 0.15, "ate": 3.8, "legenda": true, "impresso": "Fig. 1 · Bitcoin",
  "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "valor": 83000, "em": 1.34, "prefixo": "US$" }
```

- `valor` (número puro: 83000, 1.5, 37.5), `em` = a palavra do número; a leitura conta de 0 até o valor em ~1,1 s, formatada em pt-BR ("83.000", "1,5"). `casas`: casas decimais (padrão: 0 para inteiro, 1 para decimal).
- `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "kg", "anos") ficam menores ao lado. Para "83 mil", use `valor: 83000` ou `valor: 83, sufixo: "mil"`.
- `rotulo` (até ~30 caracteres): o nome do número, à mão no cabeçalho, palavra por palavra (`rotuloEm` opcional). `impresso`: a linha impressa.
- A proveta enche até o valor numa escala "redonda" (83.000 numa escala até 100 mil; porcentagem até 100%). `ilustrativo: true` põe o carimbo "ilustrativo" (só para um número que a pessoa disse ser aproximado ou exemplo).

### `comparacao` — dois lados: A × B, antes × depois, errado × certo (padrão: `esquerda`)

```json
{ "tipo": "comparacao", "de": 8.55, "ate": 12.6, "legenda": true, "titulo": "Não significa", "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "sem dinheiro", "em": 10.91 } ] }
```

- `lados`: exatamente 2; `rotulo` (até ~16 caracteres, impresso em cima da caixa) e `texto` (até ~40 caracteres, à mão, quebra em até 3 linhas); `em` = a palavra que nomeia o lado.
- `modo`: `"contra"` (um "×" entre as caixas, padrão), `"antes-depois"` (uma seta) ou `"errado-certo"` (✗ vermelhão no primeiro, ✓ azul no segundo).
- `vencedor` (0 ou 1) e `vencedorEm` (padrão: 0,7 s depois do segundo lado): a vencedora ganha um círculo a tinta azul e a outra descansa.

### `grafico` — algo que sobe, cai, se divide, se compara (padrão: `esquerda`)

Com números **ditos** (`dados`, 2 a 6):

```json
{ "tipo": "grafico", "de": 3.8, "ate": 8.0, "legenda": true, "titulo": "Quanto rende por ano", "forma": "barras", "unidade": "%",
  "dados": [ { "rotulo": "Poupança", "valor": 6.2, "em": 4.3 }, { "rotulo": "Tesouro Selic", "valor": 10.5, "em": 5.6 }, { "rotulo": "CDB", "valor": 11.8, "em": 6.9 } ] }
```

- `forma`: `"barras"` (barras hachuradas a lápis de cor que crescem na palavra), `"linha"` (vai de ponto em ponto) ou `"pizza"` (fatias na cor do lápis, com a legenda e a porcentagem de cada fatia).
- `rotulo` de cada dado até ~14 caracteres (quebra em 2 linhas); `unidade` vai junto de cada valor ("%", "mil", "R$", "kg").

Sem números ditos (forma qualitativa):

```json
{ "tipo": "grafico", "de": 3.8, "ate": 8.0, "legenda": true, "titulo": "Bitcoin", "forma": "linha", "tendencia": "sobe", "tendenciaEm": 5.3, "ilustrativo": true }
```

- `tendencia`: `"sobe"`, `"cai"` ou `"oscila"`; `tendenciaEm`: a curva se desenha (~0,9 s), com uma seta na ponta. Com `"forma": "barras"`, cinco barras em escada crescem uma a uma. `ilustrativo: true` (obrigatório sem dados): o carimbo "ilustrativo" aparece.
- Opcionais: `eixoX`/`eixoY` (rótulos à mão dos eixos, até ~16 caracteres), `cor` (`azul`, `vermelho`, `tinta`), `curva` para uma forma exata (`sobe`, `desce`, `cai-rapido`, `sobe-rapido`, `pico`, `satura`) e `pontos` (até 3 marcas na curva: `{ "x": 0.15, "rotulo": "azul: muito", "em": 5.6, "cor": "azul" }`, `x` de 0 a 1).

### `destaque` — uma frase curta que bate forte (padrão: `topo`)

```json
{ "tipo": "destaque", "de": 12.6, "ate": 14.88, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto` até ~40 caracteres (3 linhas, 112 a 68 px), escrito na fala. `nivel`: `"alerta"` (triângulo e texto em vermelhão, padrão) ou `"chave"` (asterisco azul, texto em tinta). `detalhe` + `detalheEm` opcionais: uma linha menor embaixo. Uma caixa a tinta é riscada em volta quando o texto termina.
- Sem legenda.

### `definicao` — um termo explicado (padrão: `topo`)

```json
{ "tipo": "definicao", "de": 3.8, "ate": 8.55, "legenda": true, "termo": "Bull market", "em": 5.3, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` até ~20 caracteres, à mão, sublinhado em azul; `significado` até ~45 caracteres, em azul, depois de uma seta. Com a foto num canto, o termo vai no cabeçalho.

### `frase` — frase de efeito, opinião, conclusão (padrão: `topo`)

```json
{ "tipo": "frase", "de": 33.4, "ate": 35.2, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro", "riscoEm": 34.55 }
```

- `texto` até ~50 caracteres (3 linhas, 120 a 68 px), entre aspas desenhadas. `destaque`: trecho em azul. `risco`: trecho riscado a vermelhão palavra a palavra a partir de `riscoEm` (padrão: logo depois de cada palavra ser escrita).
- Sem legenda.

### `pergunta` — pergunta para quem assiste (padrão: `direita`)

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto` até ~50 caracteres; `opcoes` opcionais, 2 a 4, até ~30 caracteres cada, cada uma com uma caixinha de marcar desenhada na sua palavra. Com a foto num canto, um "?" grande à mão fica no cabeçalho; sem opções e com a foto no topo, o "?" vai embaixo da pergunta.
- Sem legenda.

### `cta` — o fechamento (padrão: `topo`)

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "rotulo": "Aula gratuita", "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto` até ~40 caracteres (2 linhas, 136 a 84 px); `destaque` em azul; `icone`: `"seguir"` (um "+", padrão), `"salvar"` (marcador), `"comentar"` (balão) ou `"link"` (corrente); `iconeEm` opcional (padrão: logo depois da última palavra). A assinatura (`marca`) entra junto.
- O último momento fica até o fim do vídeo. Sem legenda.

## 4. A assinatura: as figuras de experimento

Pelo menos uma figura de experimento entra em todo vídeo (o `conferir.mjs` exige). São metáforas desenhadas: os rótulos são livres e nenhuma leva número. Cada uma tem o cabeçalho (`rotulo` + `titulo`, aqui em 1 ou 2 linhas: `["tem gente", "que perde"]` ou um texto só), `destaque` + `corDestaque` (`azul`/`vermelho`) para pintar uma palavra do título.

**Anotação** (`nota` em `espectro` e `ondas`): `{ "texto": "todas as cores", "em": 2.62, "cor": "azul" }`, texto à mão a partir de `em`, com uma seta até o desenho. Até ~16 caracteres.

### `espectro` — um todo que se abre em partes (padrão: `direita`)

Uma fonte de luz (um Sol à mão) solta um feixe que entra num prisma e se abre. Sem `partes`: em sete cores (luz, arco-íris, "tem todas as cores", "neutro combina com tudo"). Com `partes`: em 2 a 5 feixes com nome, cada um no seu `em` ("as causas de um resultado", "os ingredientes", "o que forma um look").

```json
{ "tipo": "espectro", "de": 14.88, "ate": 23.75, "legenda": true, "rotulo": "Fig. 3 · Por que perde", "titulo": ["tem gente", "que perde"],
  "destaque": "perde", "corDestaque": "vermelho", "fonte": "alta", "fonteEm": 15.32, "abreEm": 17.25,
  "partes": [ { "texto": "compra por impulso", "em": 17.73 }, { "texto": "moeda sem critério", "em": 19.78 }, { "texto": "risco que não entende", "em": 21.75 } ] }
```

- `fonte` (até ~10 caracteres) e `fonteEm`: a fonte se desenha e o nome é escrito embaixo. `feixe` (até ~12 caracteres) e `feixeEm` (padrão `fonteEm` + 0,25): o feixe sai.
- `abreEm`: o feixe passa pelo prisma (no modo de cores, o leque se abre aqui; `pontas` opcionais: nomes das duas pontas do leque).
- `partes`: 2 a 5, até ~24 caracteres (quebra em 2 linhas), `em` = a palavra que nomeia a parte; `cor` opcional (`azul`, `vermelho`, `tinta`; sem ela, tons de lápis de cor do espectro).

### `particulas` — algo entra, bate e se espalha (padrão: `esquerda`)

Um arco embaixo, uma camada em volta (atmosfera, água, o mercado, o corpo), um feixe que entra do alto, bate nas partículas e as atingidas soltam pontinhos para todos os lados.

```json
{ "tipo": "particulas", "de": 3.79, "ate": 8.04, "legenda": true, "rotulo": "Fig. 2 · Atmosfera", "titulo": ["entra na", "atmosfera"],
  "entraEm": 4.33, "camadaEm": 4.85, "bateEm": 5.67, "particulas": "moléculas do ar", "particulasEm": 6.08, "espalhaEm": 7.36, "efeito": "se espalha", "cor": "azul" }
```

- `entraEm`: o feixe começa a entrar (chega na primeira partícula em `bateEm`, padrão `entraEm` + 0,8). `camadaEm`: a borda da camada é passada a tinta; `camada` (opcional): nome impresso dentro dela.
- `particulas` (até ~18 caracteres) e `particulasEm`: as partículas aparecem e o rótulo é escrito, com seta. `espalhaEm`: os pontinhos se espalham; `efeito` (até ~12 caracteres): anotação na cor deles. `cor`: `azul` (padrão), `vermelho` ou `tinta`.

### `ondas` — dois ritmos lado a lado (padrão: `direita`)

```json
{ "tipo": "ondas", "de": 8.04, "ate": 12.32, "legenda": true, "rotulo": "Fig. 3 · Rayleigh", "titulo": ["onda mais", "curta"],
  "ondas": [ { "rotulo": "luz azul", "cor": "azul", "ciclos": 5.5, "em": 8.28, "medida": "onda curta", "espalha": 1, "espalhaEm": 10.4 },
             { "rotulo": "luz vermelha", "cor": "vermelho", "ciclos": 2, "em": 9.3, "medida": "onda longa", "espalha": 0.18, "espalhaEm": 11.74 } ],
  "medirEm": 9.7, "nota": { "texto": "muito mais!", "em": 10.86, "cor": "azul" } }
```

- `ondas`: 2 ou 3. `rotulo` até ~18 caracteres; `ciclos`: 3 a 7 = agitada/curta, 1,5 a 2,5 = calma/longa; `em`: a onda se desenha. `medida` (até ~14 caracteres) e `medirEm` (padrão: 0,4 s depois da última onda): as cotas aparecem. `valor`: só um número dito (ou consagrado, marcado "aprox.").
- `espalha` (0 a 1) e `espalhaEm`: quantos pontinhos a partícula no fim da onda solta e quando.

### `observador` — de onde você olhar, tudo chega até você (sempre `baixo`)

A foto desce para o horizonte. Linhas de visada saem dela, uma a uma, para pontos do céu; depois a cor volta de todos os lados e o céu se pinta de cima para baixo com o título.

```json
{ "tipo": "observador", "de": 23.75, "ate": 27.95, "legenda": true, "rotulo": "Fig. 4 · Como avaliar",
  "olharEm": 24.95, "direcoes": 5, "alvo": "os projetos", "alvoEm": 25.53, "chegaEm": 26.89, "titulo": "seu posicionamento", "cor": "azul" }
```

- `olharEm`: a primeira linha de visada (as outras a cada ~0,28 s); `direcoes`: 3 a 5. `alvo` (opcional, até ~24 caracteres) e `alvoEm`: o nome do que se olha, à mão no alto, com seta até um ponto; sai quando o título entra.
- `chegaEm`: a cor volta e o céu se pinta (~0,75 s); `titulo` (até ~20 caracteres): escrito grande no céu. `cor`: `azul` (céu de dia) ou `vermelho` (fim de tarde).

### `trajeto` — o caminho curto e o longo (padrão: `esquerda`)

Uma cúpula embaixo, uma camada em volta e uma pessoa desenhada no alto. Primeiro o caminho curto (de cima, azul); o Sol desce até o horizonte, a camada muda de cor, o caminho longo ganha uma medida e chega vermelho na pessoa.

```json
{ "tipo": "trajeto", "de": 15.36, "ate": 19.16, "legenda": true, "rotulo": "Fig. 5 · Pôr do sol", "titulo": ["No pôr", "do sol"],
  "desceEm": 15.95, "atravessaEm": 16.75, "curto": "pouco ar", "observador": "você", "medida": "mais ar", "medidaEm": 17.35,
  "sobraEm": 18.14, "sobra": "sobra o vermelho", "horas": ["12h", "18h"] }
```

- `desceEm`: o Sol desce (~1,25 s; deixe ~0,5 s de folha parada antes). `atravessaEm`: a medida longa fica a tinta e pontinhos se soltam pelo caminho. `curto` (opcional), `observador` (padrão "você"), `medida` (até ~12 caracteres) e `medidaEm`: os rótulos. `sobraEm`: o caminho longo fica vermelho; `sobra` (até ~20 caracteres): anotação embaixo. `horas` (opcional): os dois rótulos impressos das posições do Sol.

### `anotacoes` — notas livres à mão (padrão: `direita`)

```json
{ "tipo": "anotacoes", "de": 1.57, "ate": 4.2, "legenda": true, "rotulo": "Nota 1 · Resumo", "titulo": ["resumo"],
  "linhas": [ { "texto": "estude antes de comprar", "em": 1.9 }, { "texto": "diversifique", "em": 2.6 }, { "texto": "sem promessa de lucro", "em": 3.2, "destaque": "sem promessa", "cor": "vermelho" } ],
  "caixaEm": 3.8 }
```

- Até 4 linhas, até ~30 caracteres cada; `caixaEm` opcional: caixa a tinta em volta da última (a conclusão). Prefira `topicos`/`passos` quando a fala é uma lista; `anotacoes` é para o "resumindo".

## 5. Como escolher os blocos

Faça antes o mapa editorial (`references/adaptar.md`). Depois, para cada batida, o bloco deste estilo:

| Na fala | Bloco |
|---|---|
| tema, promessa, pergunta inicial | `abertura` |
| enumeração sem ordem (motivos, erros, dicas, peças) | `topicos` |
| sequência, processo, "primeiro… depois…" | `passos` |
| um número dito (preço, porcentagem, quantidade, tempo) | `numero` |
| dois lados (A × B, antes × depois, errado × certo, opções) | `comparacao` |
| vários números ditos, algo que sobe/cai, maioria × minoria | `grafico` (com `dados` ou `tendencia`) |
| alerta, risco, palavra-chave forte | `destaque` |
| termo explicado | `definicao` |
| frase de efeito, conclusão, "sem promessa de…" | `frase` (com `risco` para o que é negado) |
| pergunta para quem assiste | `pergunta` |
| chamada final | `cta` |
| "um todo feito de partes", causas, ingredientes, "neutro combina com tudo" | `espectro` (assinatura) |
| algo entra num meio e se espalha, se perde, se difunde | `particulas` (assinatura) |
| ritmo rápido × lento, curto × longo prazo, agitado × calmo | `ondas` (assinatura) |
| "de onde você olhar", "tudo chega até você", "olhar para vários lados" | `observador` (assinatura) |
| o caminho mais longo muda o resultado | `trajeto` (assinatura) |

- Um vídeo de 20–60 s pede de 6 a 12 folhas, **coladas** (o `ate` de uma é o `de` da seguinte). Um respiro em tela cheia (com legenda) entre folhas é bem-vindo em vídeo longo, para uma frase de virada.
- Não repita o mesmo bloco três vezes seguidas. Use a assinatura pelo menos uma vez.
- Numere as folhas pelo `rotulo` quando a fala tiver uma ordem própria ("Peça 1 · Camisa", "Peça 2 · Jaqueta"); senão, deixe o modelo numerar.

## 6. Regras de tempo

- `de`: o `em` da primeira palavra da batida, menos 0,05 a 0,3; nunca antes do `ate` do momento anterior. `ate`: o `de` do momento seguinte, ou o fim do vídeo no último.
- **Duração mínima de uma folha: ~2 s** (a troca leva 0,7 s). Folha mais curta: junte com a vizinha.
- Cada parte: `…Em`/`em` = o `em` da palavra que a diz (menos 0,05). Nada aparece antes de ser dito; o que vai aparecer já está esboçado a lápis.
- **Nada parado**: dentro de uma folha, algo novo a cada 1–2,5 s (um item, uma palavra do título, uma parte do desenho). Folha com mais de ~4 s precisa de itens entrando por dentro dela.
- Na primeira folha depois da tela cheia, as palavras ditas enquanto a pessoa ainda encolhe são escritas em cascata rápida logo que o papel aparece.

## 7. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez, numa tira de papel clara presa no caderno, Lexend 54 (frase longa encolhe até 46), com a base logo acima da interface do aplicativo. Ela **some durante um momento**, a não ser que ele tenha `"legenda": true`. Use `"legenda": true` nas folhas de desenho e de lista (a fala tem mais do que o caderno escreve); nas folhas de texto (`abertura`, `destaque`, `frase`, `pergunta`, `cta`) o caderno já escreve a fala.

- **Quebrar a linha no fim de uma frase**: ponha em `semLegenda` uma faixa de 0,01 s entre as duas palavras (depois do `em` da última palavra de uma e antes do `em` da primeira da outra): `{ "de": 9.8, "ate": 9.81 }`.
- `correcoes`, sem pontuação na chave: `{ "Jaquet tem": "jaqueta em", "Tchau": "", "Uma": "Uma:" }`. A chave pode ter várias palavras seguidas; `""` apaga; ponto no fim da correção fecha a linha ali. Não edite `palavras` à mão.
- `node scripts/legendas.mjs` lista todas as linhas antes de renderizar e marca palavra sozinha.

## 8. Exemplos completos

### O demo do modelo (divulgação científica, 21 s)

Roteiro: "Por que o céu é azul? A luz do Sol tem todas as cores. Quando ela entra na atmosfera, bate nas moléculas do ar e se espalha. A luz azul tem onda mais curta e se espalha muito mais que a vermelha. Por isso, de qualquer lugar que você olhe, chega azul. No pôr do sol, a luz atravessa mais ar, e sobra o vermelho. Segue pra mais ciência."

Lugares: tela cheia → `topo` (pergunta) → `direita` (espectro) → `esquerda` (atmosfera) → `direita` (ondas) → `baixo` (observador) → `esquerda` (pôr do sol) → `topo` (fechamento).

```json
{
  "marca": { "nome": "Tiago", "area": "Ciência" },
  "correcoes": { "Segue para": "Segue pra", "cores": "cores.", "vermelha": "vermelha." },
  "semLegenda": [ { "de": 3.8, "ate": 3.81 }, { "de": 8.05, "ate": 8.06 }, { "de": 12.33, "ate": 12.34 },
                  { "de": 15.37, "ate": 15.38 }, { "de": 16.425, "ate": 16.428 }, { "de": 17.95, "ate": 17.96 } ],
  "momentos": [
    { "tipo": "titulo", "de": 0.15, "ate": 1.57, "rotulo": "Experimento nº 07", "assunto": "Óptica",
      "linhas": ["Por que o céu", "é azul?"], "destaque": "azul?", "corDestaque": "azul", "sublinharEm": 1.3 },
    { "tipo": "espectro", "de": 1.57, "ate": 3.79, "legenda": true, "rotulo": "Fig. 1 · Luz branca", "titulo": ["a luz do Sol"],
      "fonte": "Sol", "fonteEm": 2.0, "feixe": "luz branca", "feixeEm": 2.3, "abreEm": 2.62,
      "pontas": ["vermelho", "violeta"], "nota": { "texto": "todas as cores", "em": 2.62 } },
    { "tipo": "particulas", "de": 3.79, "ate": 8.04, "legenda": true, "rotulo": "Fig. 2 · Atmosfera", "titulo": ["entra na", "atmosfera"],
      "entraEm": 4.33, "camadaEm": 4.85, "bateEm": 5.67, "particulas": "moléculas do ar", "particulasEm": 6.08,
      "espalhaEm": 7.36, "efeito": "se espalha", "cor": "azul" },
    { "tipo": "ondas", "de": 8.04, "ate": 12.32, "legenda": true, "rotulo": "Fig. 3 · Rayleigh", "titulo": ["onda mais", "curta"],
      "ondas": [
        { "rotulo": "luz azul", "cor": "azul", "ciclos": 5.5, "em": 8.28, "medida": "onda curta", "espalha": 1, "espalhaEm": 10.4 },
        { "rotulo": "luz vermelha", "cor": "vermelho", "ciclos": 2, "em": 9.3, "medida": "onda longa", "espalha": 0.18, "espalhaEm": 11.74 } ],
      "medirEm": 9.7, "nota": { "texto": "muito mais!", "em": 10.86, "cor": "azul" } },
    { "tipo": "observador", "de": 12.32, "ate": 15.36, "legenda": true, "rotulo": "Fig. 4 · O céu daqui",
      "olharEm": 12.9, "direcoes": 5, "chegaEm": 14.67, "titulo": "chega azul", "cor": "azul" },
    { "tipo": "trajeto", "de": 15.36, "ate": 19.16, "legenda": true, "rotulo": "Fig. 5 · Pôr do sol", "titulo": ["No pôr", "do sol"],
      "desceEm": 15.95, "atravessaEm": 16.75, "curto": "pouco ar", "observador": "você", "medida": "mais ar", "medidaEm": 17.35,
      "sobraEm": 18.14, "sobra": "sobra o vermelho", "horas": ["12h", "18h"] },
    { "tipo": "cta", "de": 19.16, "ate": 20.92, "rotulo": "Próximo experimento",
      "texto": "Segue pra mais ciência", "destaque": "ciência", "icone": "seguir" }
  ]
}
```

### Um vídeo de outro assunto (cripto, 43 s, sem nada de ciência)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "semLegenda": [ { "de": 9.8, "ate": 9.81 }, { "de": 32.1, "ate": 32.11 } ],
  "momentos": [
    { "tipo": "numero", "de": 0.15, "ate": 3.8, "legenda": true, "impresso": "Fig. 1 · Bitcoin", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "valor": 83000, "em": 1.34, "prefixo": "US$" },
    { "tipo": "definicao", "de": 3.8, "ate": 8.55, "legenda": true, "termo": "Bull market", "em": 5.3, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.55, "ate": 12.6, "legenda": true, "titulo": "Não significa", "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "sem dinheiro", "em": 10.91 } ] },
    { "tipo": "destaque", "de": 12.6, "ate": 14.88, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "espectro", "de": 14.88, "ate": 23.75, "legenda": true, "rotulo": "Fig. 3 · Por que perde", "titulo": ["tem gente", "que perde"],
      "destaque": "perde", "corDestaque": "vermelho", "fonte": "alta", "fonteEm": 15.32, "abreEm": 17.25,
      "partes": [ { "texto": "compra por impulso", "em": 17.73 }, { "texto": "moeda sem critério", "em": 19.78 }, { "texto": "risco que não entende", "em": 21.75 } ] },
    { "tipo": "observador", "de": 23.75, "ate": 27.95, "legenda": true, "rotulo": "Fig. 4 · Como avaliar", "olharEm": 24.95, "direcoes": 5,
      "alvo": "os projetos", "alvoEm": 25.53, "chegaEm": 26.89, "titulo": "seu posicionamento", "cor": "azul" },
    { "tipo": "passos", "de": 27.95, "ate": 33.4, "legenda": true, "rotulo": "Fig. 5 · Como eu analiso", "titulo": "Aula gratuita",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.4, "ate": 35.2, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro", "riscoEm": 34.55 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "rotulo": "Aula gratuita", "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ]
}
```

Lugares que saem sozinhos: `direita` (número) → `topo` (definição) → `esquerda` (amostras) → `topo` (alerta) → `direita` (espectro) → `baixo` (observador) → `esquerda` (procedimento) → `topo` (frase) → `direita` (pergunta) → `topo` (fechamento).
