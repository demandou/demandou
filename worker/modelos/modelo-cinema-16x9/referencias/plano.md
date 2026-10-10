# O plano de edição (`src/plano.json`), versão deitada (16:9, 1920×1080)

## 0. No quadro deitado (16:9)

Tudo o que está abaixo vale, com estas diferenças (o template faz sozinho; o plano só precisa respeitar os limites):

- **Composição (aula 9 do curso):** a base é a pessoa em tela cheia (o vídeo deitado inteiro), com as barras de cinema finas em cima e embaixo e a narração na barra de baixo. Nos **blocos de barra** (`abertura`, `letreiro`, `numero`, `destaque`, `definicao`, `comparacao`, `pergunta`, `cta`) a pessoa desliza para uma **moldura do lado direito** (x 1056 a 1824, y 96 a 984), com o rosto centralizado e acompanhado com ajuste suave, e o texto vai para o **quadro preto do lado esquerdo** (896 px de largura, ~870 px de altura). Onde este texto diz "na barra de cima", leia "em cima, no quadro"; "na barra de baixo", leia "embaixo, no quadro". Nos de **cartela alta** (`topicos`, `passos`, `grafico`) a moldura desce para a base (y 404 a 984) e a lista ou o gráfico ocupa o quadro da esquerda.
- **Tela cheia continua tela cheia:** a `cartela` fecha no preto numa fileira (o desenho de um lado; crédito, título e frases do outro); a `frase` cresce na barra de baixo (níveis 2 e 3) ou sobre a imagem escurecida, abaixo do queixo; a `fala` fica no lugar da narração.
- **As barras no 16:9:** respiro (nível 1) = janela de y 50 a 850; tensão (2) = 80 a 790; clímax (3) = 120 a 720, rosto em close. A barra de baixo cresce com o nível: antes de uma `frase` longa, suba a curva para 3.
- **Tamanhos:** os limites de texto deste guia valem iguais (o quadro tem a largura da coluna do vertical). A `frase` no 16:9 fica melhor com **até ~40 caracteres** (uma linha grande na barra de baixo); a forma antiga (`linhas` já quebradas) é quebrada de novo para o quadro largo.
- **Tempo de leitura e respiro (aula 9):** bloco de 2,5 a ~8 s; entre blocos, a pessoa em tela cheia de 1 a ~8 s com a narração. O `conferir.mjs` deste modelo pede ≥ 50% de cobertura, trecho só com legenda até ~8 s, um momento a cada ~10 s e nada parado mais de ~6 s. Não cubra cada frase: no vídeo completo, o bloco entra onde a ideia merece apoio.
- **Margens:** 96 px nas laterais; a narração e todo texto ficam acima de y 984 (controles do player).

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `intensidade`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` / `…Em` é o `em` de uma palavra dita.

Os exemplos vêm de um vídeo sobre cripto (o exemplo completo está na seção 9), não do demo: o modelo serve para qualquer assunto.

## Sumário

1. Campos gerais
2. A gramática: barras, blocos de barra, cartela alta, cartela e narração
3. A curva das barras (`intensidade`)
4. Os 11 blocos universais
5. A assinatura: `letreiro` e `cartela` (e a `fala`)
6. Os desenhos
7. Como escolher os blocos
8. Regras de tempo, narração e correções
9. Exemplo completo
10. Cuidado ao mexer no template

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "sfx": true,
  "grao": true,
  "correcoes": { "Cloud": "Claude" }
}
```

- `marca`: `nome` grande e `area` em crédito âmbar na barra de cima dos créditos finais; o `nome` também é o crédito padrão da `abertura`. `nome` vazio = sem assinatura (os créditos mostram o ícone da ação grande no lugar).
- `sfx`: `false` desliga os sons (poucos e graves).
- `grao`: `false` tira o grão de filme (deixe ligado; só desligue se o usuário pedir).
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática

Fora dos blocos, a imagem da pessoa vive numa **janela da largura toda entre as barras pretas** (o quadro deitado inteiro). O texto mora no preto, nunca sobre o rosto. Há quatro jeitos de um momento ocupar a tela:

- **Blocos de barra** (`abertura`, `letreiro`, `numero`, `destaque`, `definicao`, `comparacao`, `pergunta`, `cta`): a janela desliza para a moldura da direita (close ou larga) e o texto ocupa o quadro preto da esquerda: o contexto em cima, a informação principal embaixo. A imagem escurece um pouco sob os que falam "por cima" do rosto (abertura, letreiro, número, destaque); no `destaque` de alerta ela também esfria.
- **Cartela alta** (`topicos`, `passos`, `grafico`): a moldura desce para a base, do lado direito (o rosto continua visível), e o quadro da esquerda vira uma cartela preta com a lista ou o gráfico.
- **Cartela** (`cartela`): as barras se encontram e a tela fica preta por 2 a 3,5 s, com um desenho a traço ao lado do texto; depois reabrem. Use pouco (0 a 2 por vídeo).
- **Frase-chave e fala** (`frase`, `fala`): seguem a curva das barras, em tela cheia; a frase cresce na barra de baixo (ou sobre a imagem escurecida, abaixo do queixo, quando a barra é fina); a fala vira diálogo de romance.

Fora dos momentos, a **narração** (a legenda) aparece uma frase por vez na barra de baixo, numa linha, entrando em foco palavra por palavra, e as barras seguem a curva de intensidade.

Enquanto as barras e a moldura se mexem, elas recortam o texto como uma cortina: o texto do quadro é revelado pela janela que desliza para a direita, o que sai apaga antes de a janela voltar. Nada disso recorta a pessoa do fundo: funciona com a gravação de qualquer um.

## 3. A curva das barras (`intensidade`)

Uma lista de mudanças, em ordem. Cada item vale a partir de `de`; as barras levam ~1,2 s para chegar ao novo nível.

| `nivel` | Nome | A tela | Quando usar |
|---|---|---|---|
| `0` | aberto | tela cheia, sem barras | alívio, solução, virada boa; respiro depois de um trecho fechado |
| `1` | respiro | barras finas (janela de ~2,4:1), narração embaixo | a explicação calma, o contexto |
| `2` | tensão | janela larga (~2,7:1), rosto e ombros | a fala aperta: o problema, o "mas…", o "até que…" |
| `3` | clímax | cinemascope apertado (~3,2:1), rosto em close, barra de baixo alta | a revelação, a frase forte, a fala de alguém |
| `4` | fechado | tela preta | o silêncio antes do fechamento (os créditos reabrem) |

```json
"intensidade": [
  { "de": 0, "nivel": 1 },
  { "de": 33.3, "nivel": 3 }
]
```

- **Os blocos mandam nas barras enquanto duram** (cada um tem o seu nível; veja a tabela da seção 4). A curva vale nos trechos entre eles e sob `frase` e `fala`. Itens da curva que caem dentro de um bloco de barra, cartela alta ou cartela são ignorados — só vale o último antes do fim dele, e é para ele que as barras voltam quando o bloco termina.
- Ponha a mudança ~0,4 s **antes** da frase que ela acompanha. Antes de uma `frase` que precisa de uma barra grossa (nível 2 ou 3), mude a curva antes de o bloco anterior terminar.
- Não troque de nível mais de uma vez a cada ~2,5 s.
- Sem `intensidade`, o template usa uma curva automática (1 na narração, 2 nas frases, 3 nas falas). Funciona, mas é plana: escreva a sua.

## 4. Os 11 blocos universais

Campos comuns: `tipo`, `de`, `ate` e `legenda?` (`true` mantém a narração durante o momento; quase nunca). Os textos são medidos com a fonte de verdade e diminuem para caber, mas os limites abaixo mantêm a letra grande na tela. Se não cabe, reescreva mais curto com as palavras da fala.

| `tipo` | A pessoa (16:9) | Onde fica o texto |
|---|---|---|
| `abertura` | moldura da direita em close (ou larga, `nivel: 2`) | no quadro da esquerda: crédito/desenho em cima, título embaixo |
| `topicos`, `passos`, `grafico` | moldura baixa, na base do lado direito | tudo na cartela do quadro da esquerda |
| `numero` | moldura em close | no quadro: rótulo (e desenho) em cima, número embaixo |
| `comparacao` | moldura em close | no quadro: um lado em cima, o outro embaixo |
| `destaque` | moldura em close (`alerta`) ou larga (`chave`) | no quadro, sob uma régua |
| `definicao` | moldura larga | no quadro: termo em cima, significado embaixo |
| `frase` | tela cheia, segue a curva | na barra de baixo ou sobre a imagem escurecida |
| `pergunta` | moldura em close | no quadro: pergunta em cima, opções embaixo |
| `cta` | moldura larga (ou close, `nivel: 3`) | no quadro: assinatura em cima, chamada embaixo |

### `abertura` — o título do vídeo

```json
{ "tipo": "abertura", "de": 0, "ate": 2.85, "texto": "O Bitcoin rompeu os 83 mil dólares", "destaque": "83 mil dólares", "em": 0.03 }
```

- `texto`: **até ~50 caracteres** (até 3 linhas), com as palavras da fala; cada palavra ganha foco quando é dita.
- `destaque` (opcional): trecho exato do texto em itálico âmbar.
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`).
- Opcionais do Cinema: `rotulo` (crédito em caixa alta na barra de cima; padrão: o `nome` da `marca`), `rotuloEm`, `desenho` (seção 6) e `nivel` (3 padrão, ou 2).
- No começo do vídeo (`de` 0), o primeiro quadro já mostra o crédito, o desenho e o título inteiro, mais apagado (a capa do vídeo); cada palavra acende quando é dita.

### `topicos` — lista sem ordem (2 a 5 itens)

```json
{ "tipo": "topicos", "de": 17.22, "ate": 24.15, "titulo": "Tem gente que perde",
  "itens": [
    { "texto": "Compra por impulso", "em": 17.73 },
    { "texto": "Escolhe moeda sem critério", "em": 19.21 },
    { "texto": "Assume risco que não entende", "em": 21.25, "detalhe": "sem saber o que compra" }
  ] }
```

- `titulo` (opcional): crédito em caixa alta âmbar no alto da cartela, **até ~40 caracteres** (mais longo vira uma linha em itálico).
- `itens`: 2 a 5, cada um com `texto` (**2 a 6 palavras, até ~32 caracteres**; quebra em até 2 linhas) e `em` (a palavra que o nomeia). `detalhe` (opcional) fica embaixo, menor, em itálico.
- Todos os itens já aparecem "a lápis" (apagados e desfocados) quando a cartela abre; cada um ganha foco e o travessão âmbar no seu `em`, e os anteriores recuam.
- Com 5 itens longos a letra diminui (até 46 px): prefira itens curtos.

### `passos` — sequência em ordem (2 a 5 itens)

```json
{ "tipo": "passos", "de": 30.07, "ate": 33.78, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- Os mesmos campos e limites dos `topicos`. Os itens ganham algarismos âmbar em itálico e um fio que desce até o passo da vez.

### `numero` — um número dito

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "em": 1.34,
  "desenho": { "tipo": "moedas", "em": 0 } }
```

- `valor`: o número (sem pontos: `83000`; decimais com ponto: `1.5`). A tela mostra em pt-BR ("83.000", "1,5").
- `casas`: casas decimais (padrão 0). Para milhões/mil escreva `valor: 1.5, casas: 1, sufixo: "mi"`.
- `prefixo` / `sufixo` (opcionais, curtos): "R$", "US$", "%", "mil", "mi", "por mês". Ficam menores, ao lado do número.
- `em`: a palavra que diz o número. Os algarismos rolam como um hodômetro a partir daí e pousam ~1,1 s depois (com uma nota grave). Antes do `em`, o contador já está na tela, parado em zero.
- `rotulo`: o que o número é, como crédito em caixa alta na barra de cima, **até ~28 caracteres** (mais longo vira itálico). `rotuloEm` (opcional): quando entra.
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO (só para número de exemplo que a pessoa disse que é exemplo).
- `desenho` (opcional do Cinema): um desenho na barra de cima, acima do rótulo (seção 6).

### `comparacao` — dois lados

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 12.86, "modo": "contra",
  "lados": [ { "rotulo": "O mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `lados`: exatamente 2, cada um com `rotulo` (crédito em caixa alta, **até ~20 caracteres**), `texto` (**até ~40 caracteres**, até 2 linhas) e `em`. O primeiro fica na barra de cima, o segundo na de baixo.
- `modo`: `contra` (padrão), `antes-depois` ou `errado-certo`.
- `vencedor` (0 ou 1) e `vencedorEm`: no instante, o lado que perde esfria (cinza frio) e o que ganha recebe a régua âmbar. Em `errado-certo`, o vencedor padrão é o lado 1 e o lado errado também é riscado.
- `titulo` (opcional): crédito pequeno acima do primeiro lado, **até ~30 caracteres**.

### `grafico` — barras, linha ou pizza

```json
{ "tipo": "grafico", "de": 8.25, "ate": 11.33, "forma": "barras", "titulo": "Em um ano", "unidade": "R$",
  "dados": [ { "rotulo": "Por mês", "valor": 176, "em": 8.28 }, { "rotulo": "Em um ano", "valor": 2112, "em": 9.17 } ] }
```

```json
{ "tipo": "grafico", "de": 17.2, "ate": 21.0, "forma": "linha", "titulo": "Mercado subindo", "tendencia": "sobe", "tendenciaEm": 17.7, "ilustrativo": true }
```

- `forma`: `barras` (colunas a traço que sobem do chão), `linha` (um traço que anda de ponto em ponto, com um círculo na ponta) ou `pizza` (um mostrador cujos arcos se fecham, com a legenda ao lado; os valores viram fatias proporcionais, `unidade` padrão "%").
- `dados`: **2 a 6** números **ditos**, cada um com `rotulo` (**até ~14 caracteres**), `valor` e `em`. Cada coluna, ponto ou fatia entra no seu `em`.
- `unidade` (opcional): "R$", "US$", "%", "kg", "mil"… aparece junto de cada valor.
- **Sem números ditos**: deixe `dados` de fora e use `tendencia` (`sobe`, `cai` ou `oscila`) com `ilustrativo: true`. A curva (ou 6 colunas, em `barras`) se desenha de `tendenciaEm` até o fim do momento, com a etiqueta ILUSTRATIVO. Nunca invente valores.
- `titulo` (opcional): crédito em caixa alta no alto, **até ~40 caracteres**.

### `destaque` — uma palavra ou frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.9, "ate": 14.88, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: **até ~30 caracteres** (até 2 linhas, letra bem grande). `em`: a palavra.
- `nivel`: `alerta` (padrão; as barras apertam em close e a imagem esfria, perdendo a cor quente — o problema, o risco, o erro) ou `chave` (itálico âmbar, janela larga — a ideia boa, a palavra-chave).
- `detalhe` e `detalheEm` (opcionais): uma linha menor em itálico embaixo.

### `definicao` — um termo explicado

```json
{ "tipo": "definicao", "de": 2.89, "ate": 8.62, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo`: **até ~24 caracteres**, em itálico âmbar na barra de cima. `em`: quando é dito.
- `significado`: **até ~60 caracteres** (até 2 linhas) na barra de baixo, como uma legenda; ganha foco palavra por palavra a partir de `significadoEm`.

### `frase` — a frase-chave

```json
{ "tipo": "frase", "de": 33.8, "ate": 35.18, "texto": "Sem promessa de lucro.", "risco": "promessa de lucro.", "riscoEm": 34.7 }
```

- `texto`: **até ~60 caracteres**, com as palavras ditas, na ordem (o template quebra em 2 ou 3 linhas equilibradas). Cada palavra entra em foco quando é dita e o bloco cresce devagar.
- `destaque` (opcional): trecho exato em itálico âmbar — uma só ênfase, na palavra que dói.
- `risco` e `riscoEm` (opcionais): trecho exato que um traço âmbar risca no instante (padrão: logo depois de ele ser dito); depois ele esfria.
- `em` (opcional): quando o texto começa a ser dito, se o momento começa antes.
- Também aceita a forma antiga: `linhas` (2 ou 3 linhas já quebradas, até 20 caracteres cada) e `enfase`. No 16:9 elas viram um texto só, quebrado de novo para o quadro largo.
- Onde fica: na barra de baixo se a curva deixa ela alta o bastante (níveis 2 e 3; no 3 cabe uma linha bem grande); senão sobre a imagem escurecida, abaixo do queixo. No quadro deitado, prefira **até ~40 caracteres** e suba a curva para 3 ~0,5 s antes. **Uma a três por vídeo.**

### `pergunta` — para quem assiste

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: **até ~60 caracteres**, em itálico na barra de cima (sem `opcoes`, vai para a de baixo).
- `opcoes` (opcional): **2 a 4**, cada uma com `texto` (**até ~30 caracteres**) e `em`; um círculo a traço se fecha em cada uma quando é dita.
- `em` (opcional): quando a pergunta começa a ser dita.

### `cta` — o fechamento (créditos)

```json
{ "tipo": "cta", "de": 40.02, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora.", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: **até ~60 caracteres** (quebra sozinho em duas linhas equilibradas).
- `icone`: `seguir` (padrão), `salvar`, `comentar` ou `link`.
- `destaque` (opcional): trecho em itálico âmbar. `em` (opcional): quando começa a ser dito.
- `nivel` (opcional, padrão 2): 2 (ou menos) = a pessoa na moldura larga; 3 = a moldura em close.
- É o último momento e fica até o fim do vídeo. `creditos` é o nome antigo, com os mesmos campos.

## 5. A assinatura: `letreiro` e `cartela` (e a `fala`)

Use **pelo menos um dos dois** em todo vídeo (o `conferir.mjs` exige). Eles são o que faz o vídeo ter cara de filme, seja qual for o assunto.

### `letreiro` — título de cena sobre a imagem

Para marcar **quando, onde, o quê ou que capítulo** ("Todo dia, às seis", "Em 2021", "Agora…", "No dia da entrevista", "Aquele café"), **com a pessoa na tela**. A pessoa vai para a moldura da direita (em close, ou larga com `nivel: 2`), a imagem escurece, e o letreiro ocupa o quadro da esquerda: desenho e crédito em cima; título e frases embaixo. Serve para abrir o vídeo (o rosto já no primeiro quadro) e no meio, como abertura de capítulo.

```json
{ "tipo": "letreiro", "de": 24.19, "ate": 27.98, "nivel": 3,
  "rotulo": "Agora", "rotuloEm": 24.21,
  "titulo": "Como avaliar os projetos", "tituloEm": 24.58,
  "linhas": [ { "em": 26.41, "texto": "e pensar no seu posicionamento?" } ],
  "desenho": { "tipo": "balanca", "em": 24.4, "passos": [ { "em": 24.95 }, { "em": 27.06 } ] } }
```

- `rotulo` (opcional): crédito em caixa alta, **até 22 caracteres**, na barra de cima. `rotuloEm`: quando entra.
- `titulo` (opcional): o letreiro grande, na barra de baixo, **até ~26 caracteres** (2 linhas). Hora, ano ou número só com dígitos ("18:00", "6h30", "1998", "2.112") **rolam como um contador mecânico**: começam em `contarDe` (padrão: 8 minutos antes da hora, 12 anos antes do ano, zero nos outros), rolam a partir de `tituloEm` e pousam no valor em `pousaEm` (padrão: ~1 s depois). Título de texto entra desfocado e cada palavra ganha foco quando é dita.
- `linhas` (opcional): até 2 frases da fala, **até ~30 caracteres cada**, cada uma no `em` da primeira palavra dela. Com título e linhas juntos a letra das linhas encolhe.
- `desenho` (opcional): na barra de cima, acima do rótulo (seção 6).
- `nivel` (opcional): 3 (padrão, a moldura em close) ou 2 (a moldura larga).
- `cabeca` (opcional): o cabeçalho de capítulo que aparece por ~3 s na barra de cima quando a **curva** aperta depois (nível 2 ou 3), **até 24 caracteres**. `""` apaga.
- **Abrindo o vídeo** (`de` 0): o primeiro quadro já mostra o crédito e o desenho; título numérico aparece parado em `contarDe` e rola quando a hora é dita.
- Duração: a da frase que ele marca (2 a 4 s).

### `cartela` — corte para o preto

Para cortar para **a imagem que resume uma ideia** (as moedas que desmoronam em "tem gente que perde", o calendário em "três meses depois") ou marcar uma passagem de tempo com peso. As barras se fecham em ~0,5 s a partir de `de`; o conteúdo entra quando a tela está preta. **Nunca no começo do vídeo** (a capa precisa do rosto no primeiro quadro: use `letreiro` ou `abertura`).

```json
{ "tipo": "cartela", "de": 14.92, "ate": 17.2, "rotulo": "Mesmo na alta", "rotuloEm": 14.93,
  "linhas": [ { "em": 15.96, "texto": "Tem gente que perde." } ],
  "desenho": { "tipo": "moedas", "em": 15.35, "sentido": "cai" }, "cabeca": "" }
```

- `rotulo`, `titulo`, `contarDe`, `tituloEm`, `pousaEm`: como no `letreiro` (aqui o título fica na coluna do texto da fileira, ao lado do desenho, até ~20 caracteres).
- `linhas` (opcional): até 2 frases da fala, **até ~30 caracteres cada**, cada uma no `em` da primeira palavra; a anterior recua quando a seguinte entra.
- `desenho` (opcional): seção 6. `lugar`: `"acima"` ou `"abaixo"` do título; no 16:9, `"acima"` põe o desenho à esquerda do texto e `"abaixo"` à direita.
- `cabeca`: como no letreiro.
- Duração: **2 a 3,5 s** (o preto esconde a pessoa: é um corte, não uma cena). **No máximo duas por vídeo**, nunca seguidas.

### `fala` — o que alguém disse

```json
{ "tipo": "fala", "de": 22.91, "ate": 25.93, "texto": "Você só perde quando vende", "quem": "meu primeiro chefe dizia", "quemEm": 24.77 }
```

- `texto`: **até 44 caracteres**, sem o travessão e sem a vírgula final. `quem` (opcional, **até 20 caracteres**) e `quemEm`: como foi dito.
- Segue a curva: fica melhor com as barras no nível 3 (suba a curva 0,3–0,5 s antes).

## 6. Os desenhos

Traço âmbar e marfim, grosso o bastante para ler de longe, que se desenha quando o bloco abre e faz uma ação com sentido. São metáforas: escolha o que **ilustra** a ideia dita, sem afirmar nada que não foi dito. Os `passos` disparam as ações na hora da fala. Vão no `letreiro` (em cima, no quadro), na `cartela` (ao lado do texto, no preto), na `abertura` e no `numero` (em cima, no quadro).

| `tipo` | O que é | Serve para | `passos` |
|---|---|---|---|
| `moedas` | três pilhas de moedas | dinheiro, juntar, perder, crescer | nenhum. `sentido: "sobe"` (padrão): as moedas caem e as pilhas crescem durante o momento; `"cai"`: as pilhas desmoronam |
| `balanca` | balança de dois pratos | decidir, avaliar, comparar, equilíbrio, risco × retorno | 1º: pende para um lado; 2º: pende para o outro. Sem passos: oscila e equilibra |
| `estrada` | estrada em perspectiva, as faixas correndo | caminho, jornada, plano, próximos passos | cada passo acende um marco na beira da estrada |
| `lampada` | lâmpada | ideia, descobrir, entender, aprender | 1º: acende (padrão: ~1,3 s depois de começar) |
| `calendario` | bloco de calendário | dias, semanas, prazos, "um ano depois" | cada passo arranca uma folha; sem passos, uma folha cai a cada ~0,8 s |
| `ampulheta` | ampulheta | tempo acabando, paciência, espera | nenhum: a areia escorre do começo ao fim |
| `relogio` | mostrador com ponteiros | hora marcada, rotina, pontualidade | nenhum: os ponteiros andam até a `hora` ("18:00"; padrão: o título, se for hora) |
| `sol` | o sol se pondo no horizonte | fim do dia, fim de uma fase | nenhum: afunda do começo ao fim |
| `xicaras` | duas xícaras de café com vapor | café, conversa, encontro, um gasto pequeno do dia | 1º: a primeira é bebida; 2º: a segunda esfria |
| `banco` | banco de praça com poste | lugar, espera, encontro | 1º: o poste acende; 2º: aparece uma xícara no banco |

- `em`: quando começa a se desenhar (padrão: quando as barras assentam). No bloco que abre o vídeo, o template já deixa o desenho pronto no primeiro quadro.
- Use desenho só quando ele **ajuda a ver** a ideia. Sem um que sirva, deixe sem (a cartela fica com uma régua âmbar fina).
- Se a fala pede outro objeto (uma carta, uma porta), veja `references/estilo.md`, "Se precisar de algo que o modelo não tem".

## 7. Como escolher os blocos

Siga o mapa editorial (`references/adaptar.md`) e use a tabela "Blocos deste modelo" do SKILL.md. Neste estilo:

1. **A abertura** do vídeo: `abertura`, `numero` (se a primeira frase tem um número forte) ou `letreiro` (se ela marca quando, onde, o quê). Nunca tela preta no primeiro quadro.
2. **Contexto calmo** sem forma clara: deixe a pessoa em tela cheia com a narração, a curva em 1 (no vídeo completo, de 1 a ~8 s seguidos).
3. **Listas, passos e números em série**: `topicos`, `passos`, `grafico` (cartela alta).
4. **Termo explicado**: `definicao`. **Dois lados**: `comparacao`. **Alerta ou palavra-chave**: `destaque`.
5. **O "capítulo" que começa** ("Agora…", "Três meses depois…"): `letreiro`. **A imagem que resume uma ideia**: `cartela` com desenho (0 a 2 por vídeo).
6. **A frase que fica** (conclusão, virada, opinião forte): `frase` (1 a 3 por vídeo). **O que alguém disse**: `fala`.
7. **A chamada**: `cta`.

Ritmo:
- Varie o lugar do texto: depois de um ou dois blocos de barra, uma cartela alta (a moldura desce) ou uma frase em tela cheia; e vice-versa. Entre blocos, devolva a tela cheia para a pessoa. Não repita o mesmo bloco três vezes seguidas.
- Nunca dois momentos ao mesmo tempo; nunca duas cartelas seguidas.
- Momento com mais de ~6 s precisa de itens entrando por dentro dele (bloco de 2,5 a ~8 s, para dar tempo de ler).

## 8. Regras de tempo, narração e correções

- `de`: o `em` da primeira palavra que o momento cobre, menos ~0,05. Exceção: `cartela` começa ~0,5 s antes da primeira palavra que ela mostra (o tempo de as barras fecharem).
- `ate`: o `em` da **primeira palavra que o momento não cobre** (a frase seguinte), menos ~0,05 — ou o fim do vídeo. A narração volta exatamente ali. Momentos vizinhos podem encostar.
- Dentro dos blocos, cada `em` é o `em` da palavra correspondente. Nada aparece antes de ser dito (o que já está na tela "a lápis" — apagado e desfocado — ganha foco na palavra).
- Os blocos já esperam ~0,15 s depois do `de` para entrar (o anterior termina de sair), e o texto que sai apaga nos últimos 0,4 s do momento.
- Letreiro ou cartela sem `linhas`: a fala que eles cobrem fica sem legenda — é de propósito, o título diz a mesma coisa.

**Narração (legenda).** Montada sozinha a partir de `palavras`: uma frase por vez, no meio da barra de baixo, numa linha (52 px na barra fina, até 58 px na grossa; frase longa diminui até 46 px e só então quebra em duas), sempre acima dos controles do player (y 984). Ela some durante os momentos. `semLegenda` esconde trechos extras:

```json
"semLegenda": [ { "de": 2.9, "ate": 4.4 } ]
```

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Jão": "João", "10": "dez", "né": "" }`. A chave pode ter várias palavras seguidas; `""` apaga. Só corrija o que você tem certeza. Não edite `palavras` à mão — o `cortar.mjs` reescreve esse campo.

Para ver as linhas de narração antes de renderizar: `node scripts/legendas.mjs`.

## 9. Exemplo completo

Fala (cripto, 43 s): "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "intensidade": [ { "de": 0, "nivel": 1 }, { "de": 33.3, "nivel": 3 } ],
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "em": 1.34,
      "desenho": { "tipo": "moedas", "em": 0 } },
    { "tipo": "definicao", "de": 2.89, "ate": 8.62, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.86, "modo": "contra",
      "lados": [ { "rotulo": "O mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.9, "ate": 14.88, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "cartela", "de": 14.92, "ate": 17.2, "rotulo": "Mesmo na alta", "rotuloEm": 14.93,
      "linhas": [ { "em": 15.96, "texto": "Tem gente que perde." } ], "desenho": { "tipo": "moedas", "em": 15.35, "sentido": "cai" }, "cabeca": "" },
    { "tipo": "topicos", "de": 17.22, "ate": 24.15,
      "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21 }, { "texto": "Assume risco que não entende", "em": 21.25 } ] },
    { "tipo": "letreiro", "de": 24.19, "ate": 27.98, "nivel": 3, "rotulo": "Agora", "rotuloEm": 24.21, "titulo": "Como avaliar os projetos", "tituloEm": 24.58,
      "linhas": [ { "em": 26.41, "texto": "e pensar no seu posicionamento?" } ],
      "desenho": { "tipo": "balanca", "em": 24.4, "passos": [ { "em": 24.95 }, { "em": 27.06 } ] } },
    { "tipo": "destaque", "de": 28.01, "ate": 30.05, "texto": "Uma aula gratuita", "em": 28.46, "nivel": "chave" },
    { "tipo": "passos", "de": 30.07, "ate": 33.78, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.8, "ate": 35.18, "texto": "Sem promessa de lucro.", "risco": "promessa de lucro.", "riscoEm": 34.7 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.02, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora.", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

Como a tela respira nesse plano (no quadro deitado): abre com a pessoa em close na moldura da direita e, no quadro da esquerda, a pilha de moedas crescendo e US$ 83.000 rolando; a moldura abre um pouco para "Bull market" (em cima) e "um ciclo de alta" (embaixo, como legenda); volta ao close com o mercado em cima e o bolso embaixo; a imagem esfria no alerta "para a maioria das pessoas"; corta para o preto, com as moedas desmoronando ao lado da frase; a moldura desce para a base e os três motivos entram como créditos no quadro; sobe de novo para o letreiro "Agora", com a balança pendendo; "uma aula gratuita" em itálico âmbar; os três passos na cartela com o fio descendo; "sem promessa de lucro" riscado em tela cheia, na barra de baixo alta do close; a pergunta com as duas opções; os créditos com a assinatura. No vídeo completo, entre esses blocos, a pessoa volta à tela cheia com a narração.

O demo do modelo (`src/plano.json` do template) mostra o mesmo estilo com uma história: dois letreiros (a hora rolando com o sol, o banco da praça), a cartela das xícaras, três frases-chave, a fala do senhor e os créditos.

## 10. Cuidado ao mexer no template

O vídeo da pessoa (`VideoNaCaixa`) fica **sempre montado**, mesmo quando a tela está preta numa cartela: é ele que toca a voz. Se um componente novo esconder o vídeo com renderização condicional (`{aberta ? <VideoNaCaixa…/> : null}`), a voz some naquele trecho do render. Para esconder a imagem, feche a janela (altura 0), nunca desmonte o vídeo.
