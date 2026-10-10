# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Os exemplos de cada componente abaixo vêm de um mesmo vídeo (o do exemplo completo, na seção 10), com os mesmos tempos.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática: quadro cheio × prancheta
3. Os cinco componentes (`momentos`)
4. O campo (`dica.campo`)
5. O gol de frente (`dica.gol`)
6. Lances prontos para adaptar
7. Como dividir a fala
8. Regras de tempo
9. Legenda, correções e sons
10. Exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago", "area": "Treinador" },
  "sfx": true,
  "correcoes": { "para": "pra" }
}
```

- `marca`: `nome` e `area` aparecem na tarja da caixa de transmissão (duas linhas, 36 e 32 px, embaixo da pessoa, durante as dicas) e na tarja do fechamento (`cta`). Nome curto (até ~10 caracteres; até ~14 no fechamento), área até ~12 (mais que isso o corpo da tarja da caixa desce até 30 px). `nome` vazio = caixa sem tarja e fechamento só com a chamada.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. `zona.topo` é onde começam as artes de quadro cheio (logo abaixo do queixo).

## 2. A gramática: quadro cheio × prancheta

É a assinatura do modelo — um programa de análise de futebol na TV:

| Estado | Quando | A pessoa | A tela |
|---|---|---|---|
| **Quadro cheio** | `abertura`, `numero`, `destaque`, `definicao`, `frase`, `pergunta`, `resumo`, `cta`, trechos sem momento e a vinheta do começo de cada `dica` | rosto na linha do centro | arte de TV na altura do peito (tarja escura, quadrado amarelo, faixa amarela) |
| **Prancheta** | cada `dica` (a partir de `pranchetaEm`) e cada `topicos`, `passos`, `comparacao` e `grafico` (a partir do `de`) | encolhe para a **caixa de transmissão** no canto de cima à direita (como um comentarista), com a tarja de nome | campo de giz sobre a grama e/ou o gol visto de frente; cabeçalho da dica à esquerda da caixa |

O **placar** "DICA 1/3" (com três marcas que se preenchem) fica no canto de cima à esquerda desde a primeira dica até o fim; o número rola quando a dica muda.

Regras que o template já cumpre sozinho (não precisa escrever nada):

- **Vinheta da dica**: de `de` até `pranchetaEm`, a pessoa está em quadro cheio e entra a vinheta "DICA N" (quadrado amarelo com o número, marcas de 1 a 3). Em `pranchetaEm` − 0,12 s a pessoa encolhe para a caixa e a prancheta aparece por trás dela, já desenhada.
- **Volta ao quadro cheio**: 0,24 s antes do `ate` da dica a pessoa cresce de volta e cobre a prancheta; o corte que costuma ficar na fronteira cai no meio desse movimento. A arte seguinte (vinheta, resumo, frase, fechamento) só entra quando a pessoa já cobriu a tela.
- **Corte num trecho em quadro cheio** (longe de uma troca): troca seca de enquadramento (6%) para disfarçar o pulo.
- **Nenhum quadro vazio**: títulos e tarjas nascem com as palavras "apagadas" (esboço) e cada palavra acende quando é dita; as zonas do gol nascem tracejadas e acendem; a arte que sai cruza com a que entra.
- **Texto nunca cortado**: as tarjas e etiquetas entram varrendo, mas só o fundo é recortado — o texto aparece inteiro quando o fundo já abriu; na saída, a arte inteira desliza e some.
- **Uma bola só**: quando a câmera entra no gol, a bola do campo some antes de a bola da vista de frente aparecer.
- **Último momento**: fica até o último quadro.

Dois cuidados seus:

- **A primeira palavra de cada dica é o número** ("Um:", "Dois:"…). Coloque o `de` da dica logo antes dele (de preferência no `cortesEm` da pausa) e o `pranchetaEm` logo depois dele, uns 0,1–0,2 s antes da primeira palavra da explicação. Se a pessoa não diz o número, use `pranchetaEm` = `de` + 0,6 (a vinheta ainda aparece) — ou igual a `de` para pular a vinheta.
- **Momentos encostados**: o `ate` de um = o `de` do próximo, na pausa entre as frases (de preferência exatamente num valor de `cortesEm`).

## 3. Os cinco componentes

Os limites de texto existem porque o componente diminui o corpo para caber: passou do limite, fica pequeno ou quebra em muitas linhas. Palavras de títulos entram **no instante em que são ditas** (o template procura cada palavra na fala) — por isso use as palavras que a pessoa diz, na ordem em que diz (pode pular palavras: "Olha o goleiro" para "olha onde está o goleiro"). Números escritos em algarismo ("3") casam com a palavra falada ("três").

### `abertura` — quadro cheio, a tarja de abertura

Para a primeira frase (a promessa). Um número no começo do título vira o numeral gigante no quadrado amarelo; o resto do título aparece apagado desde o primeiro quadro (vira a capa do post) e acende palavra por palavra. Uma bola rola sobre a tarja, deixando o rastro tracejado de um passe, do começo ao fim da frase.

```json
{ "tipo": "abertura", "de": 0, "ate": 2.69, "texto": "3 dicas pra fazer mais gol na pelada", "destaque": "mais gol" }
```

- `texto` (ou `titulo`): até ~40 caracteres além do número (até 4 linhas). Sem número no começo, a tarja fica só com o texto.
- `destaque` (opcional): trecho exato do título em amarelo (a promessa).

### `dica` — vinheta + prancheta

O coração do modelo. Cada dica tem cabeçalho (título grande e apoio, à esquerda da caixa de transmissão) e um lance desenhado: `campo` (visto de cima, perspectiva leve), `gol` (visto de frente) ou os dois — com os dois, a câmera "entra" no gol no instante `gol.em`.

```json
{ "tipo": "dica", "de": 2.69, "ate": 6.04, "pranchetaEm": 3.25,
  "titulo": "Olha o goleiro", "apoio": "Antes de a bola chegar,",
  "campo": { … ver seção 4 … } }
```

- `pranchetaEm`: quando a pessoa encolhe e a prancheta entra (ver seção 2).
- `titulo`: a ideia da dica, curta — **até ~16 caracteres** (2 linhas no corpo grande, 88 px). Até ~30 ainda cabe, menor. Fica em caixa-alta.
- `apoio` (opcional): a frase que acompanha, até ~40 caracteres (2–3 linhas de 48 px). Se é dita antes do título, aparece em cima dele; se depois, embaixo.
- `campo` e/ou `gol`: pelo menos um dos dois. Sem nenhum, a prancheta fica só com o gramado.

### `resumo` — quadro cheio, os itens que se marcam

Para o "treina isso", "lembra das três": título falado, os itens com o número no quadrado amarelo e um visto que se desenha, um por um. Com `resultado`, a tarja vira um placar "? × ?" cujos números giram e param em "?" — "me conta o resultado".

```json
{ "tipo": "resumo", "de": 13.64, "ate": 16.13, "titulo": "Treina isso no próximo jogo",
  "itens": [ { "texto": "Olha o goleiro", "em": 13.95 },
             { "texto": "Chuta no canto oposto", "em": 14.22 },
             { "texto": "Rasteiro", "em": 14.5 } ],
  "resultado": { "texto": "Me conta o resultado", "em": 14.99 } }
```

- `titulo`: até ~30 caracteres (2 linhas).
- `itens`: 2 a 4, `texto` até ~24 caracteres. Quando a fala só diz "isso", os itens são os títulos das dicas (ditos antes) e entram em sequência, a cada ~0,25–0,3 s, enquanto o título é dito.
- `resultado` (opcional): `texto` falado (até ~24 caracteres); `em` = a primeira palavra dele. Pede ~1 s depois do `em`.

### `frase` — quadro cheio, uma frase em tarja de TV

Para uma regra, uma virada, um dado que merece ficar ("Bola baixa é mais difícil de defender").

```json
{ "tipo": "frase", "de": 9.9, "ate": 12.4, "texto": "Bola baixa é mais difícil de defender", "destaque": "mais difícil", "rotulo": "Regra" }
```

- `texto`: até ~45 caracteres (3 linhas), fiel ao que foi dito. `destaque`: trecho exato em amarelo. `rotulo` (opcional): etiqueta amarela acima da tarja, 1–2 palavras.

### `cta` — quadro cheio, o fechamento

Tarja de nome (como a de um entrevistado na TV) e, embaixo, a faixa amarela com a chamada falada e um "+" que vira visto quando a frase termina.

```json
{ "tipo": "cta", "de": 16.13, "ate": 17.8, "texto": "Me segue pra mais dicas", "icone": "seguir" }
```

- `texto`: a chamada falada, até ~26 caracteres (2 linhas). Sem `marca.nome`, aparece só a faixa amarela.

## 3b. Os blocos universais (qualquer assunto)

Os 11 blocos universais existem em todos os modelos do pack, com os mesmos campos. Aqui `abertura`, `numero`, `destaque`, `definicao`, `frase`, `pergunta` e `cta` são **quadro cheio** (arte de TV na altura do peito); `topicos`, `passos`, `comparacao` e `grafico` são **prancheta** (a pessoa vai para a caixa de transmissão e a tela vira o quadro de giz). Em todos: `de`, `ate`, `legenda?`; todo `em` é o instante de uma palavra dita. O texto cabe sempre (o corpo diminui até um mínimo legível, nunca vaza).

`abertura` (campo `texto`; `titulo` continua valendo), `frase` (com `risco` e `riscoEm`: trecho riscado com um traço amarelo quando dito) e `cta` (com `icone`: `seguir`, `salvar`, `comentar` ou `link`, e `destaque` sublinhado) aceitam também `em?`, o instante em que o texto começa a ser dito.

| Tipo | Campos | Como aparece | Limite de texto |
|---|---|---|---|
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | placar: o número conta em pt-BR numa faixa amarela, com barra de progresso; rótulo na tarja escura | rótulo ~30 |
| `destaque` | `texto`, `em`, `nivel?` (`alerta` amarelo cheio, `chave` tarja escura), `detalhe?`, `detalheEm?` | tarja grande com etiqueta "Atenção" ou "Anote" | texto ~40, detalhe ~60 |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | termo na faixa amarela, significado na tarja escura | termo ~24, significado ~70 |
| `pergunta` | `texto`, `opcoes?` (2 a 4: `texto`, `em`), `em?` | "?" no quadrado amarelo; opções A, B, C como enquete com vistos | texto ~80, opção ~30 |
| `topicos` | `titulo?`, `itens` (2 a 5: `texto`, `em`, `detalhe?`) | fichas amarelas no gramado, cada uma com uma tarja com o item | item 2 a 6 palavras; `detalhe` só com até 3 itens |
| `passos` | `titulo?`, `itens` (2 a 5) | fichas numeradas ligadas por passes; a bola rola de uma à próxima | idem |
| `comparacao` | `titulo?`, `modo?`, `lados` (2: `rotulo`, `texto`, `em`), `vencedor?`, `vencedorEm?` | campo dividido ao meio; uma ficha e duas tarjas de cada lado; o vencedor acende e ganha a etiqueta ("Melhor", "Certo", "Agora") | rótulo ~14, texto ~45 |
| `grafico` | `titulo?`, `forma` (`barras`, `linha`, `pizza`), `dados?` (2 a 6: `rotulo`, `valor`, `em`), `tendencia?`, `tendenciaEm?`, `unidade?`, `ilustrativo?` | barras amarelas, rota de giz com fichas ou círculo dividido; sem `dados`, a curva com a bola e "ilustrativo" | `rotulo` ~10 |

Regras:

- **Sem números ditos, sem números na tela.** `grafico` sem `dados` exige `tendencia` e `ilustrativo: true`.
- O `titulo` dos blocos de prancheta aparece à esquerda da caixa de transmissão, como o título de uma dica. O placar "DICA N/total" só aparece quando há 2 ou mais `dica`; os blocos de prancheta não são contados nele.
- **Blocos de prancheta seguidos**: a pessoa fica na caixa o tempo todo; só o quadro muda.
- **Nunca o mesmo bloco três vezes seguidas.**

### A `dica` em qualquer assunto

`campo.jogadores[].rotulo` põe um nome livre ao lado da ficha ("Investidor", "Etapa 1"); `passe.rotulo` põe uma etiqueta no meio da seta ("depois", "vira"). As fichas podem ficar em qualquer lugar do campo (`y` de 3 a 18 m aparecem na tela). `numero` é opcional. `gol` e `campo` são opcionais; use só o que a fala pede.

## 4. O campo (`dica.campo`)

O campo é a área de ataque vista de trás do lance, com o gol no alto (linha do gol, grande área, pequena área, marca do pênalti, meia-lua). Coordenadas **em metros**:

- `x`: de um lado ao outro, **0 = meio do gol**; negativo = esquerda de quem olha a tela, positivo = direita.
- `y`: distância da linha do gol para fora (para baixo na tela).

| Referência | x | y |
|---|---|---|
| traves | −3,66 / 3,66 | 0 |
| pequena área (bicos) | ±9,16 | 5,5 |
| marca do pênalti | 0 | 11 |
| grande área (linha da frente) | de −20,16 a 20,16 | 16,5 |
| topo da meia-lua | 0 | 20,15 |

**O que cabe na tela** (a câmera é fechada na área): o fundo vai até y ≈ 19,5 (borda de baixo, logo acima da interface do app); o topo da meia-lua fica logo abaixo da borda. Use a parte de baixo: quem passa ou conduz de longe fica bem em y 18–19. A largura visível diminui para baixo — e os botões do app (curtir, comentar) ficam à direita, embaixo. Mantenha as fichas dentro desta faixa:

| y | x mínimo | x máximo (fora dos botões) |
|---|---|---|
| 0–5 | −14 | 12 |
| 9–13 | −12 | 10 |
| 16–18 | −10 | 8,5 |
| 18–19,5 | −9 | 8 |

### `jogadores`

```json
{ "id": "9", "time": "nosso", "numero": "9", "x": 0.5, "y": 17.5 }
```

- `id`: nome curto usado nas ações ("9", "ponta", "gk").
- `time`: `nosso` (ficha amarela, número escuro), `adversario` (ficha escura, número claro) ou `goleiro` (o goleiro adversário: ficha branca). 3 a 6 fichas por lance: só quem importa para a dica.
- `numero`: 1 ou 2 caracteres na ficha.

`bola`: o `id` de quem começa com ela (ex.: `"7"`) ou um ponto `{ "x": 0, "y": 11 }`.

### `acoes`

Cada ação tem `em` (o instante da palavra que ela ilustra). Elas acontecem na ordem do tempo; uma ação com `em` **antes** de `pranchetaEm` já aparece pronta quando a prancheta entra (use isso para mostrar "de onde a bola veio": o passe da jogada anterior, já tracejado).

| Ação | Campos | O que faz |
|---|---|---|
| `passe` | `de`, `para`, `em` | seta **tracejada** branca do pé de quem passa até quem recebe (0,45 s); a bola rola junto (chega em 0,6 s) e passa a ser de quem recebeu |
| `chute` | `de`, `alvo` (`esquerda`, `direita`, `centro`), `em` | seta **contínua amarela** até o canto do gol (0,4 s); a bola vai junto e fica no gol |
| `corrida` | `quem`, `para` {x,y}, `em`, `ate` (opcional, padrão `em` + 0,8) | o jogador anda até o ponto, deixando um rastro pontilhado; se está com a bola, leva a bola |
| `olhar` | `quem`, `alvo`, `em` | um cone de visão sai do jogador até o alvo (0,5 s) |
| `destaque` | `quem`, `rotulo` (opcional), `em` | anel amarelo que assenta na ficha + etiqueta de TV (ex.: "Goleiro"), em cima da ficha ou embaixo dela se estiver perto do gol |
| `espaco` | `lado` (`esquerda`/`direita`), `em` | o lado do gol que ficou livre acende em amarelo (da trave até o goleiro) |

Para "cruzado", ponha quem chuta de um lado e chute para o canto do outro lado — a seta precisa sair na diagonal. Quem recebe um passe deve terminar a corrida antes de a bola chegar (`ate` da corrida ≤ `em` do passe + 0,6).

## 5. O gol de frente (`dica.gol`)

O gol ocupa a largura da tela, com rede, o goleiro (desenho chapado) e **seis zonas** — esquerda/centro/direita × alto/baixo, sempre do ponto de vista de quem olha a tela: `esquerda-alto`, `centro-alto`, `direita-alto`, `esquerda-baixo`, `centro-baixo`, `direita-baixo`. As zonas nascem tracejadas (esboço) e acendem em amarelo.

```json
"gol": { "em": 7.85, "goleiro": 0.3, "bola": "esquerda-baixo", "atacante": "9",
  "acoes": [ { "tipo": "zona", "zonas": ["esquerda-alto", "esquerda-baixo"], "rotulo": "Canto oposto", "em": 8.41 },
             { "tipo": "origem", "lado": "direita", "rotulo": "A bola veio daqui", "em": 8.95 } ] }
```

- `em`: com `campo` na mesma dica, quando a câmera entra no gol (o campo cresce em volta do gol até ele virar o gol de frente, 0,6 s). Sem `campo`, use o `pranchetaEm` da dica: a dica já abre no gol e as traves se desenham.
- `goleiro`: de −1 (colado na trave esquerda) a 1 (na direita); 0 = no meio. Ele desliza um pouco para o lado da `origem` quando ela aparece.
- `bola` (opcional): a bola já está dentro do gol nesta zona, com o caminho do chute desenhado (continuação de um `chute` do campo).
- `atacante` (opcional): número de quem chuta — ficha amarela na frente da tela, com a bola no pé (antes do chute).

| Ação | Campos | O que faz |
|---|---|---|
| `zona` | `zonas` (lista), `rotulo` (opcional), `em` | as zonas acendem; uma zona só acende mais forte. A etiqueta fica acima do gol, ou embaixo se as zonas forem a fileira de baixo inteira |
| `chute` | `alvo` (uma zona), `em` | a bola sai do pé de quem chuta e entra na zona (0,6 s), com o rastro amarelo; rasteira (pelo chão) se a zona for de baixo, em arco se for de cima |
| `defesa` | `lado`, `em`, `alcanca` (padrão `false`) | o goleiro pula para o lado; com `alcanca: false` ele chega alto e atrasado (a bola passa por baixo); com `true`, as luvas chegam no canto |
| `origem` | `lado`, `rotulo` (opcional), `em` | uma bola na lateral e o passe tracejado até quem chuta: de onde a bola veio |

Etiquetas: até ~20 caracteres (caixa-alta, 40 px; o corpo diminui até 34 px para caber e, se ainda assim não couber, a etiqueta quebra em duas linhas — texto nunca é cortado). Duas etiquetas no mesmo lugar se sobrepõem — use uma acima do gol e no máximo uma embaixo.

## 6. Lances prontos para adaptar

Copie e ajuste as posições. Os `em` estão em 0 de propósito: troque cada um pelo tempo da palavra que a ação ilustra (e o `ate` das corridas, até 0,6 s depois do `em` do passe).

**Cruzamento rasteiro da direita, finalização no segundo poste:**
```json
"jogadores": [ { "id": "9", "time": "nosso", "numero": "9", "x": 0.5, "y": 17.5 },
               { "id": "7", "time": "nosso", "numero": "7", "x": 9, "y": 19.6 },
               { "id": "4", "time": "adversario", "numero": "4", "x": -4, "y": 9 },
               { "id": "5", "time": "adversario", "numero": "5", "x": 7.5, "y": 10.5 },
               { "id": "gk", "time": "goleiro", "numero": "1", "x": 1.5, "y": 0.9 } ],
"bola": "7",
"acoes": [ { "tipo": "corrida", "quem": "9", "para": { "x": 3.5, "y": 12 }, "em": 0, "ate": 0 },
           { "tipo": "passe", "de": "7", "para": "9", "em": 0 },
           { "tipo": "chute", "de": "9", "alvo": "esquerda", "em": 0 } ]
```

**Passe em profundidade pelo meio (atacante sai da linha da defesa):**
```json
"jogadores": [ { "id": "10", "time": "nosso", "numero": "10", "x": -2, "y": 19 },
               { "id": "9", "time": "nosso", "numero": "9", "x": 2, "y": 15 },
               { "id": "3", "time": "adversario", "numero": "3", "x": -1, "y": 14 },
               { "id": "4", "time": "adversario", "numero": "4", "x": 5, "y": 14.5 },
               { "id": "gk", "time": "goleiro", "numero": "1", "x": 0, "y": 1.5 } ],
"bola": "10",
"acoes": [ { "tipo": "corrida", "quem": "9", "para": { "x": 1, "y": 9 }, "em": 0, "ate": 0 },
           { "tipo": "passe", "de": "10", "para": "9", "em": 0 } ]
```

**Goleiro saindo do gol (o "olha o goleiro" de um chute por cobertura):** goleiro em `{ "x": 0, "y": 5 }`, atacante em `{ "x": -1, "y": 15 }`, `olhar` do atacante para o goleiro e `destaque` com rótulo "Adiantado".

## 7. Como dividir a fala

Leia a transcrição inteira e pergunte, frase a frase: *num programa de análise, isto seria qual tela?*

| A fala traz… | Componente |
|---|---|
| a frase de abertura (a promessa, "3 dicas…") | `abertura` |
| cada dica / jogada / fundamento | `dica` (uma por dica, com o lance que a ilustra) |
| uma regra ou frase forte fora das dicas | `frase` |
| "treina isso", "lembra das três", "na próxima pelada…" | `resumo` |
| a chamada final | `cta` |

- 2 a 4 dicas num vídeo de 20–60 s; cada dica entre ~3 e ~8 s. Menos que 2,5 s não dá tempo de o lance acontecer; mais que ~8 s, divida em duas ações de campo e gol (ou duas dicas).
- Uma ação por batida da fala, a cada ~0,5–1,5 s. Dica sem ação por mais de ~2,5 s parece parada: acrescente uma corrida, um destaque, a entrada no gol.
- Não force: se a fala não descreve jogada nenhuma, use `frase` em vez de inventar um lance.

## 8. Regras de tempo

- **Fronteiras de momento na pausa entre frases**: o `de` de um = o `ate` do anterior = o valor de `cortesEm` que fica entre as duas frases (ou, sem corte, o `em` da primeira palavra menos 0,1). O primeiro momento começa em 0; o `ate` do último é a `duracao`.
- `pranchetaEm`: logo depois do número da dica (ver seção 2).
- Sub-passos (`em` das ações, `gol.em`, `itens[].em`, `resultado.em`): o `em` da palavra, tirado de `work/palavras.json`. O passe chega ~0,6 s depois do `em` — para "antes de a bola **chegar**", ponha o `em` do passe uns 0,5 s antes de "chegar". A entrada no gol leva 0,6 s — comece-a uns 0,2 s antes da palavra "canto".
- Nada fica parado mais de ~2,5 s.

## 9. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`: uma linha numa tarja escura de transmissão (y ≈ 1436), a palavra da vez em amarelo. Ela **some durante os momentos** (as artes e o cabeçalho já mostram o que é dito) e aparece nos trechos sem momento. `"legenda": true` no momento a mantém (evite durante a prancheta: cobre o campo). `semLegenda` acrescenta faixas sem legenda.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Jão": "João", "né": "" }`. Só corrija o que você tem certeza. Não edite `palavras` à mão — o `cortar.mjs` reescreve esse campo.

Sons (automáticos, tonais, nunca dois a menos de 0,45 s): duas notas de placar na abertura e em cada vinheta, um "vum" grave quando a prancheta entra e quando a câmera entra no gol, um toque surdo de bola no passe, um mais forte no chute, uma nota curta (subindo de altura) quando uma zona acende ou um jogador é destacado, e um acorde curto no fim. `"sfx": false` desliga.

## 10. Exemplo completo

Roteiro: "Três dicas pra fazer mais gol na pelada. Um: antes de a bola chegar, olha onde está o goleiro. Dois: chuta cruzado, no canto oposto de onde a bola veio. Três: rasteiro, que bola baixa é mais difícil de defender. Treina isso no próximo jogo e me conta o resultado. Me segue pra mais dicas."

Cortes em 2,69 · 6,04 · 9,87 · 13,64 · 16,13 (as pausas antes de cada dica, do resumo e do fechamento).

```json
{
  "marca": { "nome": "Tiago", "area": "Treinador" },
  "correcoes": { "para": "pra" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 2.69, "texto": "3 dicas pra fazer mais gol na pelada", "destaque": "mais gol" },
    { "tipo": "dica", "de": 2.69, "ate": 6.04, "pranchetaEm": 3.25, "titulo": "Olha o goleiro", "apoio": "Antes de a bola chegar,",
      "campo": {
        "jogadores": [
          { "id": "9", "time": "nosso", "numero": "9", "x": 0.5, "y": 17.5 },
          { "id": "7", "time": "nosso", "numero": "7", "x": 9, "y": 19.6 },
          { "id": "4", "time": "adversario", "numero": "4", "x": -4, "y": 9 },
          { "id": "5", "time": "adversario", "numero": "5", "x": 7.5, "y": 10.5 },
          { "id": "gk", "time": "goleiro", "numero": "1", "x": 1.5, "y": 0.9 } ],
        "bola": "7",
        "acoes": [
          { "tipo": "corrida", "quem": "7", "para": { "x": 8.5, "y": 18.6 }, "em": 3.4, "ate": 3.75 },
          { "tipo": "corrida", "quem": "9", "para": { "x": 3.5, "y": 12 }, "em": 3.5, "ate": 4.3 },
          { "tipo": "corrida", "quem": "4", "para": { "x": -2.5, "y": 9.5 }, "em": 3.6, "ate": 4.3 },
          { "tipo": "corrida", "quem": "5", "para": { "x": 6.8, "y": 9.4 }, "em": 3.7, "ate": 4.4 },
          { "tipo": "passe", "de": "7", "para": "9", "em": 3.69 },
          { "tipo": "olhar", "quem": "9", "alvo": "gk", "em": 4.45 },
          { "tipo": "destaque", "quem": "gk", "rotulo": "Goleiro", "em": 5.25 },
          { "tipo": "espaco", "lado": "esquerda", "em": 5.5 } ] } },
    { "tipo": "dica", "de": 6.04, "ate": 9.87, "pranchetaEm": 6.8, "titulo": "Chuta cruzado",
      "campo": {
        "jogadores": [
          { "id": "9", "time": "nosso", "numero": "9", "x": 3.5, "y": 12 },
          { "id": "7", "time": "nosso", "numero": "7", "x": 8.5, "y": 18.6 },
          { "id": "4", "time": "adversario", "numero": "4", "x": -2.5, "y": 9.5 },
          { "id": "5", "time": "adversario", "numero": "5", "x": 6.8, "y": 9.4 },
          { "id": "gk", "time": "goleiro", "numero": "1", "x": 1.5, "y": 0.9 } ],
        "bola": "7",
        "acoes": [
          { "tipo": "passe", "de": "7", "para": "9", "em": 5.0 },
          { "tipo": "chute", "de": "9", "alvo": "esquerda", "em": 7.0 } ] },
      "gol": { "em": 7.85, "goleiro": 0.3, "bola": "esquerda-baixo", "atacante": "9",
        "acoes": [
          { "tipo": "zona", "zonas": ["esquerda-alto", "esquerda-baixo"], "rotulo": "Canto oposto", "em": 8.41 },
          { "tipo": "origem", "lado": "direita", "rotulo": "A bola veio daqui", "em": 8.95 } ] } },
    { "tipo": "dica", "de": 9.87, "ate": 13.64, "pranchetaEm": 10.6, "titulo": "Rasteiro", "apoio": "Bola baixa é mais difícil de defender",
      "gol": { "em": 10.6, "goleiro": 0, "atacante": "9",
        "acoes": [
          { "tipo": "zona", "zonas": ["esquerda-baixo", "centro-baixo", "direita-baixo"], "em": 11.0 },
          { "tipo": "chute", "alvo": "esquerda-baixo", "em": 11.75 },
          { "tipo": "defesa", "lado": "esquerda", "em": 12.2 },
          { "tipo": "zona", "zonas": ["esquerda-baixo"], "rotulo": "Difícil de defender", "em": 12.62 } ] } },
    { "tipo": "resumo", "de": 13.64, "ate": 16.13, "titulo": "Treina isso no próximo jogo",
      "itens": [ { "texto": "Olha o goleiro", "em": 13.95 }, { "texto": "Chuta no canto oposto", "em": 14.22 }, { "texto": "Rasteiro", "em": 14.5 } ],
      "resultado": { "texto": "Me conta o resultado", "em": 14.99 } },
    { "tipo": "cta", "de": 16.13, "ate": 17.8, "texto": "Me segue pra mais dicas", "icone": "seguir" }
  ]
}
```

Com esse plano: a abertura já está montada no primeiro quadro, com o "3" no quadrado amarelo e o título apagado acendendo na fala; em cada dica entra a vinheta "DICA N" e a pessoa encolhe para a caixa de transmissão. Na dica 1, o ponta conduz, o 9 se desloca, o passe tracejado chega no "chegar", o cone de visão sai no "olha" e o goleiro ganha anel e etiqueta no "goleiro"; o lado livre do gol acende. Na dica 2, a mesma jogada continua (o passe já tracejado mostra de onde a bola veio), o chute cruzado corre em amarelo, a câmera entra no gol, a coluna da esquerda acende no "oposto" e a origem aparece no "de onde a bola veio". Na dica 3, o gol abre sozinho, a fileira de baixo acende no "rasteiro", a bola rola pelo chão, o goleiro pula atrasado e o canto ganha a etiqueta. O resumo marca as três dicas e vira o placar "? × ?"; o fechamento termina com o nome e a chamada. Nenhum trecho fica sem momento, então esse vídeo não tem legenda.
