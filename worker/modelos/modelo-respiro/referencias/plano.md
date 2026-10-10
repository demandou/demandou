# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona` (não usada neste modelo), `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `janela`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json` (cada palavra tem `em` = início e `ate` = fim) e confira os instantes da contagem com `node utilitarios/ouvir.mjs <de> <ate>`.

Os exemplos vêm do vídeo de demonstração (seção 7), com os mesmos tempos.

## Sumário

1. Campos gerais
2. Os lugares: onde a pessoa, a forma e as notas ficam
3. Os seis componentes
4. Como escolher os momentos
5. Regras de tempo
6. Legenda e correções
7. Exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Moura", "area": "Psicólogo" },
  "sfx": true,
  "correcoes": { "478": "4-7-8" }
}
```

- `marca`: aparece só no fechamento (`cta`), embaixo da chamada: o nome em serifada e a área escrita à mão, com uma bolinha de damasco que respira ao lado. `nome` vazio = sem assinatura.
- `sfx`: `false` desliga os sons (uma nota que sobe no começo da inspiração, uma parada na pausa, uma que desce na expiração, um acorde grave quando o mapa se completa, duas notas quando a forma se divide e um acorde no fechamento).
- `janela` (opcional, raro): `{ "zoom": 1.25, "ancoraY": 0.42 }` (o padrão) — enquadramento da pessoa nas janelas menores (`esquerda`, `direita`, `embaixo`), pensado para quem grava sentado, do peito para cima (rosto com ~1/3 da largura). `zoom` maior = rosto maior (~1,1 numa gravação fechada, de rosto grande; ~1,6 numa aberta, de meio corpo); `ancoraY` é a altura do rosto dentro da janela (0 = topo, 1 = base).
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. Os lugares: onde a pessoa, a forma e as notas ficam

A pessoa fica sempre numa **janela em arco** (cantos de cima redondos, de baixo quase retos) com uma moldura pontilhada a lápis. A janela **respira**: cresce um pouco na inspiração, volta na expiração e, fora das fases, respira devagar sozinha. Cada momento tem um lugar (o padrão do componente ou o que você escrever em `"layout"`):

| `layout` | A pessoa | A forma do respiro | Notas e texto | Padrão de |
|---|---|---|---|---|
| `janela` | arco grande no alto (960 × 920 px) | guardada no começo do mapa / da onda | no papel embaixo, a largura toda (~930 × 530 px) | `abertura`, `nota`, `lista` |
| `esquerda` | arco no alto à esquerda (604 × 770) | grande, embaixo, no centro (anel de ~640 px) | coluna à direita da pessoa (~356 × 740), com o mapa pequeno | `fase` "inspira" |
| `direita` | arco no alto à direita | grande, embaixo | coluna à esquerda da pessoa | `fase` "segura" |
| `embaixo` | arco embaixo à esquerda (604 × 712) | grande, no alto | coluna embaixo à direita | `fase` "solta", `ciclos` |
| `fecho` | arco centralizado, mais estreito (820 × 940) | bolinha ao lado da assinatura | papel embaixo, com o mapa pequeno como assinatura do respiro | `cta` |

- O vídeo começa em **tela cheia** e vira janela em arco no primeiro segundo, sozinho.
- Entre dois momentos com mais de 0,4 s de intervalo, a janela cresce (quase a tela toda, 992 × 1296) e a legenda aparece escrita no papel embaixo dela.
- As trocas de lugar levam ~1,1 s, com a mesma curva lenta. Quando a pessoa e a forma trocam de andar (de `direita` para `embaixo`, por exemplo), cada uma contorna a outra por um lado, e a forma passa **por trás** da janela — nunca por cima do rosto.
- As notas do momento novo esperam a janela sair da área delas (≈0,8 s depois do `de`); as palavras ditas nesse meio-tempo entram em cascata. Por isso **comece cada momento na pausa antes da frase**, não na primeira palavra (seção 5).
- **Quem sai espera quem entra**: o texto de um momento só se dissolve quando o do seguinte começa a aparecer (a não ser que a janela vá passar por cima dele); o anel da contagem viaja com a forma até o anel seguinte aparecer; o mapa que muda de lugar some devagar onde estava enquanto aparece no lugar novo. Nenhuma troca deixa metade da tela vazia.
- Use os lugares para dar ritmo: numa respiração em três fases, cada fase num lugar diferente (o padrão já faz isso: esquerda → direita → embaixo).

## 3. Os componentes: blocos universais e a assinatura

Os limites de texto existem porque o componente diminui a letra para caber: passou do limite, fica pequeno demais para ler no celular. Se a ideia não cabe, reescreva mais curto — com palavras da fala.

Em todo texto, cada palavra entra **no instante em que é dita** (o template acha a palavra em `palavras`; palavra que não foi dita entra logo depois da anterior). A escrita à mão aparece da esquerda para a direita, como a caneta passando; a serifada sobe devagar e ganha foco. Escreva os textos com as palavras da fala, na ordem em que são faladas ("pra" e "para", "4" e "quatro" casam sozinhos).

### Blocos universais (qualquer assunto)

Mesmos `tipo` e campos de todos os modelos do pack. Todo momento tem `de`, `ate` e `legenda?`; todo `em` é o instante da palavra dita. Os textos são medidos: encolhem até um mínimo legível e quebram, mas escreva curto (item de 2 a 6 palavras, título até ~40 caracteres).

| `tipo` | Campos | Como aparece | Limites |
|---|---|---|---|
| `abertura` | `texto`, `destaque?`, `em?`, `mao?`, `mapaEm?` | janela grande; linha à mão e título em serifada com grifo | `mapaEm` só com `fase` contadas |
| `topicos` | `titulo?`, `itens[{texto, em, detalhe?}]` | itens à mão com bolinha que respira | 2 a 5 itens |
| `passos` | `titulo?`, `itens[{texto, em, detalhe?}]` | estações numeradas e ponto que anda | 2 a 5 itens, em ordem |
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | número contando dentro da forma, que enche | pt-BR; `sufixo` "mil", "%" |
| `comparacao` | `titulo?`, `modo?`, `lados[2]{rotulo, texto, em}`, `vencedor?`, `vencedorEm?` | duas formas; a vencedora enche, a outra esvazia | `texto` até 3 linhas por lado |
| `grafico` | `titulo?`, `forma`, `dados?[{rotulo, valor, em}]`, `tendencia?`, `tendenciaEm?`, `unidade?`, `ilustrativo?` | barras, linha ou pizza à mão | `dados` 2 a 6, só números ditos; sem `dados`, `tendencia` com "(ilustrativo)" |
| `destaque` | `texto`, `em`, `nivel?` (`alerta`, `chave`), `detalhe?`, `detalheEm?` | frase dentro da forma | até 3 linhas; `alerta` esvazia a forma |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | termo sublinhado, traço, significado à mão | termo até 2 linhas |
| `frase` | `texto`, `destaque?`, `risco?`, `riscoEm?`, `em?` | aspas e itálico; `risco` riscado | até 4 linhas |
| `pergunta` | `texto`, `opcoes?[{texto, em}]`, `em?` | pergunta e opções com bolinha | `opcoes` 2 a 4 |
| `cta` | `texto`, `icone?` (`salvar`, `seguir`, `comentar`, `link`), `destaque?`, `em?`, `iconeEm?`, `assinaturaEm?` | ver `cta` abaixo | até 3 linhas |

O lugar padrão de cada bloco está na seção 2 (`topicos`, `definicao`, `frase`, `pergunta`: janela com papel embaixo, ou página se a lista é alta; `numero`: esquerda; `comparacao`: dupla; `destaque`: centro). O template alterna os lados para dois blocos seguidos não ficarem no mesmo lugar. `lista` continua valendo como nome antigo de `topicos`.

Exemplo (cripto, sem respiração):

```json
{ "tipo": "numero", "de": 0, "ate": 3, "valor": 83, "prefixo": "US$", "sufixo": "mil", "em": 1.34, "rotulo": "Bitcoin", "rotuloEm": 0.1 },
{ "tipo": "fase", "de": 3, "ate": 8.6, "fase": "enche", "nota": "ciclo de alta", "detalhe": "das criptomoedas",
  "marcas": [ { "texto": "Bull market", "em": 5.3 }, { "texto": "ciclo de alta", "em": 6.15 } ] },
{ "tipo": "comparacao", "de": 8.6, "ate": 14.9, "modo": "contra", "titulo": "Mercado subindo",
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 9.31 }, { "rotulo": "Seu bolso", "texto": "sem dinheiro", "em": 10.91 } ], "vencedor": 0, "vencedorEm": 11.99 },
{ "tipo": "destaque", "de": 14.9, "ate": 17.6, "texto": "Tem gente que perde", "em": 15.96, "nivel": "alerta" },
{ "tipo": "topicos", "de": 17.6, "ate": 24, "titulo": "Perde porque", "itens": [ { "texto": "Impulso", "em": 18.45 }, { "texto": "Sem critério", "em": 20.18 }, { "texto": "Risco que não entende", "em": 21.75 } ] }
```

### Assinatura: `fase` e `ciclos`

### `abertura` — o tema, e o mapa do respiro (padrão: `janela`)

Uma linha à mão (`mao`) e o título em serifada (`texto`) no alto do papel. Com `mapaEm`, o **mapa do respiro** já aparece a lápis embaixo — uma linha que sobe (inspira), anda no alto (segura) e desce (solta), cada etapa do tamanho da sua contagem, com o número grande em cima e o nome à mão embaixo — e cada etapa ganha tinta no instante em que o número é dito, com um ponto de damasco andando por ela. As etapas vêm das `fase` do plano, na ordem.

```json
{ "tipo": "abertura", "de": 0, "ate": 5.1, "mao": "quando bater a ansiedade,", "texto": "tenta a respiração",
  "mapaEm": [3.46, 3.7, 4.5] }
```

- `mao`: até ~28 caracteres (uma linha).
- `texto`: com mapa, **uma linha de até ~20 caracteres** (104 px); sem mapa, até ~36 caracteres em duas linhas (até 118 px), e o bloco fica no meio do papel.
- `enfase` (opcional): trecho do título com grifo de marca-texto damasco, que passa logo depois da última palavra.
- `mapaEm`: um instante por fase do plano, o `em` de cada número dito ("quatro", "sete", "oito"). Deixe de fora se o vídeo não tem respiração com números.
- Termine a abertura ~0,6 s depois do último número (o mapa leva ~0,55 s para ganhar tinta); a forma nasce do ponto no fim do mapa e viaja para o lugar da primeira fase durante a pausa.

### `fase` — a forma enche, fica cheia ou esvazia, com a contagem (padrão: pelo nome da fase)

O componente principal. A forma (três camadas de damasco com a borda ondulando devagar) fica grande no meio do espaço livre, dentro de um **anel de contagem**: uma marca por número, já a lápis, e um traço de tinta que corre pelo anel, contínuo, da primeira palavra até o número final; cada marca ganha tinta quando o traço passa e o número (1, 2, 3…) troca no centro da forma. Quando a contagem é lenta (mais de ~0,45 s por número), o número troca subindo; quando é rápida (a fala diz "segura o ar contando até sete" em menos de 2 s), os números se dissolvem um no outro, sem tique — a pausa tem que parecer ar parado, não relógio. Antes da contagem, o total aparece apagado no centro (o "4" que vai ser contado).

- `"inspira"` (padrão `esquerda`): a forma começa vazia e enche até a última marca.
- `"segura"` (padrão `direita`): a forma fica cheia; a borda fica um pouco mais viva.
- `"solta"` (padrão `embaixo`): a forma começa cheia e esvazia até a última marca.

Na coluna ao lado: a `nota` à mão grande, o `detalhe` menor embaixo e o **mapa pequeno**, com a etapa atual em destaque e o ponto andando por ela junto com a contagem.

```json
{ "tipo": "fase", "de": 5.1, "ate": 8.7, "fase": "inspira", "contagem": 4, "contaEm": 6.05, "chegaEm": 7.98,
  "nota": "inspira", "detalhe": "pelo nariz" }
```

- `fase`: `inspira`, `segura`, `solta` ou os sinônimos `enche`, `fica`, `esvazia` (para assuntos que não são respiração).
- Três jeitos de marcar o anel: `contagem` (números 1, 2, 3…), `marcas` (2 a 5 palavras ditas, `{ "texto", "em" }`, que entram no centro da forma) ou nenhum (traço contínuo de `contaEm` a `chegaEm`). `contaEm`/`chegaEm` são opcionais: com `marcas`, valem a primeira e a última.
- O mapa do respiro só aparece quando as fases têm `contagem`.
- `contagem`: até quanto se conta (2 a 10).
- `contaEm`: quando a contagem começa (a marca 1), em geral a primeira palavra da frase ou a seguinte. `chegaEm`: o instante **exato** em que o número final é dito — a última marca cai aqui. As marcas do meio ficam espaçadas por igual (um metrônomo). Confira os dois com `node utilitarios/ouvir.mjs`.
- `nota`: uma palavra, até ~8 caracteres ("inspira", "segura", "solta", "expira"). `detalhe`: até ~18 caracteres, quebra em duas linhas na coluna ("devagar pela boca").
- A forma termina de encher/esvaziar ~0,45 s depois de `chegaEm`: deixe o `ate` pelo menos 0,5 s depois dele.
- Uma fase só é um vídeo legítimo também ("solta o ar devagar contando até seis"): o mapa terá uma etapa.

### `ciclos` — repete N vezes (padrão: `embaixo`)

A forma grande se divide, como líquido, em N formas menores dispostas num círculo no lugar dela (os lugares já aparecem a lápis); cada uma enche e esvazia na sua vez, numa onda que dá a volta, com o número dentro e um traço de tinta correndo pelo círculo; o ponto do mapa percorre o mapa inteiro de novo. No fim, as formas se juntam de volta numa só.

```json
{ "tipo": "ciclos", "de": 15.85, "ate": 18.4, "vezes": 4, "divideEm": 16.3, "nota": "repete", "detalhe": "4 vezes" }
```

- `vezes`: 2 a 6.
- `divideEm`: quando a forma se divide — no "repete"/"repita". As formas respiram logo depois; **precisa de ~2 s entre `divideEm` e `ate`** (as respirações dividem esse tempo, cada uma começando um passo depois da outra, e as formas se juntam nos últimos 0,6 s).
- `nota` e `detalhe`: como na `fase`.
- Use logo depois da última `fase` (a forma está vazia e pequena, no mesmo lugar).

### `nota` — uma ressalva ou reflexão, como num diário (padrão: `janela`)

Uma linha à mão (com sublinhado opcional) e uma frase em serifada (com grifo de marca-texto opcional). Com `ondaEm`, uma **onda que desacelera** se desenha embaixo: começa apertada, agitada, e vai abrindo até quase virar linha reta, com o ponto de damasco na ponta do traço. O lugar da onda já aparece a lápis desde o começo da nota.

```json
{ "tipo": "nota", "de": 18.4, "ate": 23.5, "mao": "não substitui a terapia,", "sublinhar": "a terapia", "sublinharEm": 19.6,
  "texto": "mas ajuda o corpo a desacelerar na hora", "grifo": "desacelerar", "grifoEm": 21.6, "ondaEm": 21.6 }
```

- `mao`: até ~26 caracteres (uma linha). `sublinhar` + `sublinharEm`: trecho exato da linha e o `em` da palavra.
- `texto`: com onda, até ~40 caracteres (duas linhas); sem onda, até ~60 (três linhas) e o bloco fica no meio do papel.
- `grifo` + `grifoEm`: trecho exato da frase e o `em` da palavra.
- `ondaEm`: o `em` da palavra que fala de acalmar ("desacelerar", "acalmar", "relaxar", "devagar"). A onda leva ~1,9 s para se desenhar: deixe ~2 s até o `ate`.

### `lista` — passos ou sinais, sem contagem (padrão: `janela`)

Título em serifada e até 4 itens à mão, cada um com uma bolinha que já está a lápis e enche de damasco quando o item é dito.

```json
{ "tipo": "lista", "de": 3.0, "ate": 9.4, "titulo": "Três sinais de ansiedade",
  "itens": [{ "em": 4.1, "texto": "coração acelerado" }, { "em": 5.9, "texto": "mãos frias" }, { "em": 7.6, "texto": "pensamento em loop" }] }
```

- `titulo`: até ~20 caracteres (uma linha). `enfase` opcional (grifo).
- `itens`: 2 a 4, `texto` até ~22 caracteres, `em` = primeira palavra do item.

### `cta` — fechamento (padrão: `fecho`)

A janela estreita e centraliza; embaixo, o ícone (que já está a lápis) ganha tinta e damasco quando a palavra é dita, a chamada se escreve à mão, grande, e a assinatura (`marca`) entra embaixo, com a bolinha que respira.

```json
{ "tipo": "cta", "de": 23.5, "ate": 25.32, "texto": "salva pra quando precisar", "icone": "salvar", "iconeEm": 23.84, "assinaturaEm": 24.4 }
```

- `texto`: a frase dita, até ~30 caracteres (duas linhas de ~15).
- `icone`: `salvar` (marcador de página), `seguir`, `comentar` ou `link` (dois elos). `iconeEm`: o `em` da palavra que pede ("salva", "segue", "comenta", "manda").
- `assinaturaEm`: deixe a assinatura entrar **antes** da última palavra quando o vídeo acaba logo depois da fala (ela precisa de ~0,8 s para assentar).
- Se for o último momento, fica até o fim do vídeo.

## 4. Como escolher os momentos

Leia a transcrição inteira antes de marcar qualquer coisa e pergunte, frase a frase: *o que o espectador precisa ver aqui para respirar junto ou lembrar depois?*

| A fala traz… | Componente |
|---|---|
| o tema, a promessa, o nome da técnica ("respiração 4-7-8", "respiração quadrada") | `abertura` (com `mapaEm` se os números forem ditos) |
| "inspira… contando até N" | `fase` "inspira" |
| "segura o ar… N" | `fase` "segura" |
| "solta / expira… N" | `fase` "solta" |
| "repete N vezes", "faz N ciclos" | `ciclos` |
| uma ressalva, uma reflexão, um "não é sobre…, é sobre…" | `nota` (com `ondaEm` se falar de acalmar) |
| sinais, passos, dicas sem contagem | `lista` |
| a chamada final | `cta` |

- Um vídeo de 20–60 s pede de 4 a 8 momentos. Numa respiração guiada, cada fase dita é um momento — não junte duas fases numa só.
- Momentos colados (sem intervalo) deixam o vídeo inteiro "no diário"; um intervalo de mais de 0,4 s devolve a pessoa à janela grande com legenda. Use o intervalo como respiro entre blocos de assunto, não no meio da técnica.
- Respiração "quadrada" (4-4-4-4) = quatro `fase`: inspira, segura, solta, segura — use `"layout"` para variar o lugar da segunda pausa (por exemplo `"esquerda"`).
- Nunca dois momentos ao mesmo tempo.

## 5. Regras de tempo

- **Comece cada momento na pausa antes da frase** (≈0,1 s depois do fim da frase anterior), não na primeira palavra: a troca de lugar acontece no silêncio e as notas chegam com a fala. Exceção: o primeiro momento começa em 0.
- `ate`: o `de` do momento seguinte (momentos colados) ou o fim do vídeo. O último momento, se termina a menos de 0,6 s do fim, fica até o último quadro.
- **Nada parado**: dentro de cada momento, alguma coisa nova a cada 1,5–2,5 s (uma palavra, uma marca da contagem, o grifo, o sublinhado, a onda). A forma, a janela e a moldura sempre se movem um pouco, mas não contam como novidade. Se a fala não tem mais o que mostrar, encurte o momento.
- Contagem: `contaEm` ≥ `de` + 0,9 quando a fase muda de lugar (a forma está viajando até ~1,1 s depois do `de`; o anel só aparece quando ela chega). Com ~0,25 s ou menos entre as marcas, a contagem fica corrida: prefira começar `contaEm` mais cedo, na primeira palavra da frase.
- Instantes de sublinhado, grifo, onda e ícone: o `em` da palavra que fala deles.

## 6. Legenda e correções

A legenda é montada sozinha a partir de `palavras` e aparece **fora dos momentos**: escrita no papel, embaixo da janela grande, em serifada de 68 px, cada palavra passando de apagada para tinta quando é falada. Durante um momento ela some, porque o componente já mostra o que é dito. Dois ajustes:

- `"legenda": true` num momento de layout `janela` (uma `nota` ou `lista` curta): a legenda continua durante ele, na base do papel. Nos outros layouts ela não cabe — não use.
- `semLegenda`: faixas extras sem legenda: `"semLegenda": [ { "de": 3.2, "ate": 6.0 } ]`.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação na chave: `{ "478": "4-7-8", "Rafa El": "Rafael" }`. A pontuação colada na palavra original é preservada; se o valor terminar com pontuação própria ("4-7-8."), ela substitui a original. A chave pode ter várias palavras seguidas e `""` apaga. Só corrija o que você tem certeza. Não edite `palavras` à mão.

## 7. Exemplo completo

Roteiro: "Quando bater ansiedade, tenta a respiração quatro, sete, oito. Inspira pelo nariz contando até quatro. Segura o ar contando até sete. Solta devagar pela boca contando até oito. Repete quatro vezes. Não substitui a terapia, mas ajuda o corpo a desacelerar na hora. Salva pra quando precisar."

Gravação de 25,3 s, com as pausas de respiração mantidas (os trechos de `cortes.json` foram esticados até o seguinte). Lugares: tela cheia → `janela` (abertura com o mapa) → `esquerda` (inspira) → `direita` (segura) → `embaixo` (solta e repete) → `janela` (nota com a onda) → `fecho` (chamada). O Whisper juntou "quatro, sete, oito" numa palavra só ("478"); os instantes dos números (3,46 / 3,70 / 4,50) e das contagens saíram do `ouvir.mjs`.

```json
{
  "marca": { "nome": "Tiago Moura", "area": "Psicólogo" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 5.1, "mao": "quando bater a ansiedade,", "texto": "tenta a respiração",
      "mapaEm": [3.46, 3.7, 4.5] },

    { "tipo": "fase", "de": 5.1, "ate": 8.7, "fase": "inspira", "contagem": 4, "contaEm": 6.05, "chegaEm": 7.98,
      "nota": "inspira", "detalhe": "pelo nariz" },

    { "tipo": "fase", "de": 8.7, "ate": 11.25, "fase": "segura", "contagem": 7, "contaEm": 9.26, "chegaEm": 10.96,
      "nota": "segura", "detalhe": "o ar" },

    { "tipo": "fase", "de": 11.25, "ate": 15.85, "fase": "solta", "contagem": 8, "contaEm": 12.34, "chegaEm": 14.95,
      "nota": "solta", "detalhe": "devagar pela boca" },

    { "tipo": "ciclos", "de": 15.85, "ate": 18.4, "vezes": 4, "divideEm": 16.3, "nota": "repete", "detalhe": "4 vezes" },

    { "tipo": "nota", "de": 18.4, "ate": 23.5, "mao": "não substitui a terapia,", "sublinhar": "a terapia", "sublinharEm": 19.6,
      "texto": "mas ajuda o corpo a desacelerar na hora", "grifo": "desacelerar", "grifoEm": 21.6, "ondaEm": 21.6 },

    { "tipo": "cta", "de": 23.5, "ate": 25.32, "texto": "salva pra quando precisar", "icone": "salvar",
      "iconeEm": 23.84, "assinaturaEm": 24.4 }
  ],
  "semLegenda": [],
  "correcoes": { "478": "4-7-8" }
}
```

Com esse plano, cada frase tem um componente, então a legenda não aparece. Repare que os `de` das fases caem nas pausas (5,1 / 8,7 / 11,25), não nas primeiras palavras (5,72 / 9,26 / 12,34): a janela troca de lugar no silêncio e a nota chega com a fala.
