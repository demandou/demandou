# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastreio), `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `episodio`, `momentos`, `cameras` (opcional), `semLegenda` e `correcoes`. A onda do áudio não fica no plano: ela vem de `src/onda.json`, gerado por `node ferramentas/onda.mjs`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: o quadro de estúdio e os lugares
3. Os 11 blocos universais
4. A assinatura: `resposta` e `trilha`
5. Câmeras (`cameras`)
6. Capítulos
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Café com Carla" },
  "episodio": { "numero": "12", "inicio": "32:10", "total": "58:20" },
  "sfx": true,
  "correcoes": { "para": "pra" }
}
```

- `marca`: `area` é o programa ou o assunto ("Podcast", "Café com Carla", "Cripto"), `nome` é quem fala. Aparecem juntos no player do fechamento ("Café com Carla · Carla", até ~40 caracteres somados). Sem `episodio.numero`, a `area` vai no chip do alto se tiver até 12 caracteres (senão o chip diz "CORTE").
- `episodio` (opcional; use só se o vídeo for o corte de um episódio):
  - `numero`: vai no chip "EP. 12" do alto (até 4 caracteres);
  - `inicio`: em que ponto do episódio o corte começa ("32:10" ou "1:02:15"). O relógio do alto corre a partir dele, e as marcas de tempo da pauta (`topicos`) também;
  - `total`: a duração do episódio inteiro. Com `inicio` e `total`, a barra do player mostra o episódio inteiro, o trecho do corte em rosa e "+26 MIN" do resto. Sem eles, o relógio some e as marcas da pauta mostram o tempo do próprio corte (00:17).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. Este modelo reposiciona a pessoa e não usa a `zona`.
- `cabeca` (opcional): quanto a cabeça ocupa acima e abaixo do centro do rosto, em fração da altura do quadro (1920). Sem ele, o template usa a medida do rastreio do rosto (ou, sem rastreio, `{ "acima": 0.155, "abaixo": 0.125 }`: pessoa sentada, do peito para cima). Com ela, o template mantém a cabeça inteira no quadro quando dá e, quando não dá (gravação perto da câmera num quadro largo e baixo), guarda olhos e queixo e deixa o alto do cabelo sair. Se o queixo encostar embaixo, aumente `abaixo`; se o cabelo encostar em cima num quadro grande, aumente `acima`. Para conferir: `abaixo` ≈ (queixo − centro do rosto) e `acima` ≈ 1,3 × isso, lidos nas guias.

## 2. A gramática: o quadro de estúdio e os lugares

A pessoa fica **sempre** num quadro de estúdio (cantos de 30 px, filete claro, etiqueta "● CAM 1 · ABERTO" no canto de cima), montado o vídeo inteiro (é ele que carrega a voz). Embaixo do quadro corre a **onda do áudio**: a voz de verdade passando por uma agulha fixa no meio, o que já foi dito em rosa, o que vem a lápis. No alto fica a **régua do episódio** (chip, capítulo atual, relógio, barra de capítulos). Cada bloco põe o quadro num lugar:

| Lugar | Blocos | O quadro da pessoa (px, no 1080×1920) | O resto da tela |
|---|---|---|---|
| **palco** | trechos sem momento | grande: 1008×1040, de y 262 a 1302 | onda + legenda embaixo |
| **abertura** | `abertura`, `destaque` | 1008×860 | onda + o texto grande (y 1240–1540) |
| **entrevista** | `pergunta`, `resposta`, `comparacao` | 1008×660 | onda + o cartão (y 1030–1540) |
| **citação** | `frase`/`citacao`, `definicao` | 1008×740 | onda + o texto (y 1110–1540) |
| **pauta** | `topicos` | 1008×580 | onda + o cartão da pauta (y 944–1540) |
| **coluna à esquerda** | `trilha` | 480×700 à esquerda | à direita o ponto grande; embaixo a trilha; legenda |
| **coluna à direita** | `numero` | 480×760 à direita | à esquerda o número; embaixo o medidor |
| **pé da tela** | `passos`, `grafico` | 1008×600, de y 868 a 1468 | o conteúdo em cima (y 276–838) |
| **player** | `cta`/`player` | vira a capa do player: 872×720 (menor se a chamada tiver 2–3 linhas) | o cartão do player e a chamada embaixo |

Regras que o template já cumpre sozinho:

- **O começo**: o vídeo abre com a pessoa em quadro cheio e, no primeiro meio segundo, o quadro recua para o lugar do primeiro bloco e revela a régua.
- **Troca de lugar**: o quadro começa a se mover 0,15 s antes do `de` do momento (0,55 s, macio nas pontas). O corte que fica na fronteira cai no meio do movimento e some.
- **Nunca dois textos um sobre o outro**: o texto que sai some inteiro até o fim do momento; o que entra aparece depois. Os cartões (pergunta/resposta, pauta, comparação) sobem de baixo, opacos, e descem vazios; quando um cartão encosta em outro, eles trocam no lugar (o texto de um some, o do outro acende). O que fica ao lado do quadro (as colunas) só entra quando o quadro já liberou aquele lado. Tudo que vai receber texto nasce a lápis.
- **Perguntas e respostas coladas** dividem um cartão só: a pergunta grande some e volta como uma linha no alto do cartão da resposta.
- **Último momento**: fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases (um valor de `cortesEm`, ou a primeira palavra da frase seguinte menos 0,1). Um vão de menos de 0,6 s entre dois momentos não vira palco.
- **Variedade de lugar**: o que dá vida ao modelo é o quadro mudar de lugar. Evite o mesmo lugar por mais de ~6 s seguidos e evite trocar de lugar mais rápido que a cada ~1,5 s.

## 3. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate`, `legenda?` (true = a legenda continua aparecendo) e `capitulo?` (seção 6).

Os textos acendem **no instante em que as palavras são ditas** (o template procura cada palavra na fala): use as palavras que a pessoa diz, na ordem em que diz (pode pular palavras). Números em algarismo ("300", "83", "1º") casam com o falado por extenso ("trezentos", "oitenta e três", "primeiro"); "pra" casa com "para". Trechos de `destaque` e `risco` são trechos exatos do texto (a pontuação não importa).

Os limites de texto abaixo são os de uma tela bonita. O template mede o texto e diminui o corpo até caber (até ~44 px), mas um texto longo demais fica pequeno: encurte com as palavras da fala.

### `abertura` — o gancho

O quadro grande; embaixo da onda, o gancho se monta palavra por palavra (cada palavra sobe no seu tempo), com o `destaque` em rosa.

```json
{ "tipo": "abertura", "de": 0, "ate": 3.48, "capitulo": "A pergunta",
  "texto": "A pergunta que mais mudou a minha carreira", "destaque": "mudou a minha carreira" }
```

- `texto`: até ~48 caracteres (3 linhas de 64–108 px). `titulo` é o nome antigo e continua valendo.
- `destaque` (opcional): o pedaço que importa, em rosa.
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`).

### `topicos` — a pauta

O quadro fica no lugar mais baixo e o cartão da pauta sobe de baixo: o rótulo mono ("EM PAUTA" ou o `titulo`) com o contador "02/03" à direita e um item por linha, a lápis. Cada item acende na sua palavra e ganha, à esquerda, a marca de tempo do episódio em que foi dito (▸ 32:14); o cursor rosa desce até o item da vez e a linha dele fica marcada.

```json
{ "tipo": "topicos", "de": 17.6, "ate": 24.1, "titulo": "Tem gente que perde",
  "itens": [
    { "texto": "Compra por impulso", "em": 17.73 },
    { "texto": "Escolhe moeda sem critério", "em": 19.21 },
    { "texto": "Assume risco que não entende", "em": 21.25 } ] }
```

- `itens`: 2 a 5, cada um de 2 a 6 palavras (até ~30 caracteres; 2 linhas no máximo). `em` = a palavra que nomeia o item.
- `titulo` (opcional): até ~28 caracteres, em mono.
- `detalhe` (opcional, por item): uma linha menor embaixo do item (até ~40 caracteres).

### `passos` — os capítulos do que vem

O quadro desce para o pé da tela; em cima, o rótulo ("PASSO A PASSO" ou o `titulo`) com o contador, e os passos numerados 01, 02, 03… ao lado da barra de capítulos em pé: o passo dito fica branco, o da vez se enche de rosa até o próximo, os que vêm ficam a lápis. Cada texto acende palavra por palavra.

```json
{ "tipo": "passos", "de": 29.9, "ate": 33.8, "titulo": "Como eu analiso",
  "itens": [
    { "texto": "O mercado", "em": 30.86 },
    { "texto": "Os riscos", "em": 31.47 },
    { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- `itens`: 2 a 5, **em ordem**, até ~30 caracteres cada. `detalhe` opcional.

### `numero` — o número que conta

O quadro vai para a coluna da direita. À esquerda, o prefixo em mono rosa ("US$"), o número grande contando até o valor a partir de `em` (pt-BR: 83.000; 1,5) com o sufixo menor ao lado ("%", "mil", "kg"), e o rótulo embaixo, que acende no `rotuloEm`. No pé, o medidor de nível sobe junto: com `sufixo: "%"`, ele acende até a porcentagem; um inteiro de 1 a 12 vira uma casa por unidade; o resto, uma rampa inteira.

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34,
  "rotulo": "O Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número dito (até ~7 algarismos). `casas`: casas decimais (padrão 0). `prefixo`/`sufixo` curtos.
- `rotulo`: o que o número mede, com palavras da fala (até ~40 caracteres, 3 linhas).
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO (só para número que a fala dá como exemplo).
- Pede uns 2,5–5 s.

### `comparacao` — dois lados

O quadro fica no lugar de entrevista; embaixo, dois cartões lado a lado, cada um com o rótulo mono e o texto a lápis, que acende palavra por palavra a partir do `em` do lado. No meio, o selo: × (`contra`) ou → (`antes-depois`, `errado-certo`). Com `vencedor`, o lado que ganha recebe contorno rosa e um visto no `vencedorEm` e o outro apaga; no `errado-certo`, o lado 1 vence sozinho e o errado ganha um ×.

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 },
             { "rotulo": "Bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `lados`: 2, cada `texto` até ~32 caracteres (4 linhas de 52–100 px); `rotulo` até ~14.
- `vencedor` (0 ou 1) e `vencedorEm` opcionais.

### `grafico` — a forma dos números

O quadro desce para o pé da tela e o gráfico ocupa o alto, com o rótulo mono (o `titulo`, ou "EM NÚMEROS"/"TENDÊNCIA").

```json
{ "tipo": "grafico", "de": 10.2, "ate": 14.0, "forma": "barras", "titulo": "Quanto custa", "unidade": "%",
  "dados": [ { "rotulo": "Antes", "valor": 30, "em": 10.4 }, { "rotulo": "Depois", "valor": 70, "em": 12.1 } ] }
```

```json
{ "tipo": "grafico", "de": 2.9, "ate": 8.6, "forma": "linha", "titulo": "Bitcoin", "tendencia": "sobe", "tendenciaEm": 6.15, "ilustrativo": true }
```

- **Com números ditos** (`dados`, 2 a 6, cada um com `rotulo` até ~16 caracteres): `barras` = barras arredondadas que crescem até o valor no `em` (a da vez em rosa, as já ditas brancas, o valor em cima e o rótulo embaixo); `linha` = pontos que se ligam um a um na fala; `pizza` = um anel que se divide fatia a fatia, com a legenda ao lado (em %, se `unidade` for "%" ou os valores somarem 100).
- **Sem números ditos** (`tendencia`: "sobe", "cai" ou "oscila", com `ilustrativo: true`): uma onda de barras com essa forma, varrida pela agulha a partir do `tendenciaEm` (padrão: logo depois de `de`), com a etiqueta ILUSTRATIVO.
- `unidade` (opcional): curta ("%", "kg", "mil") vai junto do valor; longa ("reais por mês") vai no alto, ao lado do rótulo.

### `destaque` — a palavra que bate forte

O quadro grande, com corte seco para o close no `em`. Embaixo da onda:
- `"nivel": "alerta"`: a placa rosa de "no ar", a lápis até o `em`, acende da esquerda para a direita com o triângulo de alerta e o texto escuro; toca uma nota curta;
- `"nivel": "chave"` (padrão): o texto grande a lápis acende palavra por palavra e ganha o sublinhado rosa.

```json
{ "tipo": "destaque", "de": 12.85, "ate": 17.6, "nivel": "alerta", "texto": "Para a maioria das pessoas", "em": 13.46,
  "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 14.93 }
```

- `texto`: até ~30 caracteres (2 linhas de 60–120 px).
- `detalhe` (opcional): uma linha menor embaixo (até ~40 caracteres), que acende no `detalheEm`.

### `definicao` — o termo explicado

O quadro no lugar médio; embaixo, a nota "GLOSSÁRIO": o termo grande acende no `em` e ganha o sublinhado rosa; embaixo, o "=" rosa e o significado, a lápis, acendendo palavra por palavra a partir do `significadoEm`.

```json
{ "tipo": "definicao", "de": 4.6, "ate": 8.6, "termo": "Bull market", "em": 5.3,
  "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo`: até ~24 caracteres; `significado`: até ~60 (3 linhas).

### `frase` — a frase forte (ou `citacao`, o nome antigo)

O quadro no lugar médio (combina com um close na virada); embaixo, o rótulo "“ FRASE DO EPISÓDIO" e a frase inteira a lápis; cada palavra acende na fala. O trecho de `risco` ganha um risco rosa e apaga um instante depois de ser dito (ou no `riscoEm`); o `destaque` acende em rosa e ganha um sublinhado que se desenha.

```json
{ "tipo": "frase", "de": 15.19, "ate": 18.33, "capitulo": "A lição",
  "texto": "Consistência não é talento, é agenda.", "risco": "talento,", "destaque": "é agenda." }
```

- `texto`: até ~60 caracteres, fiel à fala. O template escolhe o maior corpo que enche a faixa (até 112 px), em 2 ou 3 linhas. Uma ou duas por vídeo.
- `rotulo` (opcional): outra etiqueta ("A LIÇÃO", "PARA SALVAR"), até ~24 caracteres.
- `em` (opcional): quando o texto começa a ser dito. Na `citacao`, o riscado se chama `risca`.

### `pergunta` — o cartão "P"

O quadro sobe e fica baixo; embaixo, o cartão de entrevista sobe com o rótulo "PERGUNTA" e a pergunta inteira a lápis, com o "P" rosa pendurado à esquerda; cada palavra acende quando é dita. As `opcoes` entram como etiquetas contornadas embaixo da pergunta e acendem em rosa, cada uma na sua palavra.

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "em": 35.23,
  "texto": "Você quer entender antes de decidir e correr o risco de perder o seu patrimônio?",
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres para ficar grande (aceita até ~90, em 4 linhas menores). Serve para a pergunta feita para quem assiste, lida de um comentário ou contada ("me perguntaram…").
- `destaque` (opcional): o miolo da pergunta, em rosa; a câmera corta para o close nele.
- `opcoes` (opcional): 2 a 4, até ~28 caracteres cada.
- `rotulo` (opcional): outro nome para o cartão ("DÚVIDA", "MITO"); a letra grande é a primeira letra dele.
- `letra` (opcional): a marca grande pendurada, quando a primeira letra do rótulo não serve ("?", "1", "¼").

### `cta` — o fechamento (ou `player`, o nome antigo)

O quadro vira a capa de um player de podcast; o cartão abre a partir dele. Embaixo da capa: a onda, o rótulo falado em mono rosa (opcional), o título, "Programa · Nome", a barra do episódio com a agulha, o tempo e os controles. Fora do cartão, a chamada falada em até 3 linhas, com o botão rosa (contornado até ser dito, apertado quando é dito) e as outras palavras acendendo na fala.

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "em": 40.05, "capitulo": "A aula",
  "texto": "Toca aqui em Saiba Mais e assiste essa aula agora.", "icone": "link", "botao": "Saiba Mais",
  "titulo": "Aula gratuita: como eu analiso" }
```

- `texto`: a chamada falada, até ~50 caracteres (1 linha até ~24, 2 a 3 linhas acima disso; a capa encolhe para caber).
- `botao` (opcional): a palavra ou o trecho (até 2–3 palavras) do texto que vai no botão. Sem isto: o primeiro verbo de chamada (segue, salva, comenta, toca, clica, assiste, acessa…).
- `icone` (opcional): `salvar`, `seguir`, `comentar` ou `link`, desenhado dentro do botão.
- `destaque` (opcional): trecho do texto em rosa.
- `titulo` (opcional): o título do player (até ~30 caracteres numa linha). Sem isto, usa o texto da abertura ou o programa.
- `rotulo` (opcional): uma linha falada em mono acima do título ("O corte do episódio de hoje").
- `seguirEm` (opcional): quando o botão é apertado. `restoEm` (só com `episodio.inicio` e `total`): quando o resto do episódio acende na barra.
- Fica até o fim do vídeo. Use como último momento.
- No `player` (nome antigo) o texto se chama `chamada`.

## 4. A assinatura: `resposta` e `trilha`

Use pelo menos uma das duas em todo vídeo (o `conferir.mjs` exige). O SKILL.md mostra como usá-las em qualquer assunto.

### `resposta` — o cartão "R"

No mesmo cartão da pergunta (se vier colada nela), a pergunta encolhe para duas linhas no alto (36–40 px), entra o rótulo "RESPOSTA" com o "R" pendurado e a resposta a lápis, que acende na fala. Embaixo, a `fileira` de marcas acende uma a uma.

```json
{ "tipo": "resposta", "de": 28.0, "ate": 33.75, "texto": "Gravei uma aula gratuita", "destaque": "aula gratuita",
  "rotuloEm": 28.03, "em": 28.43,
  "fileira": { "itens": [ { "texto": "Mercado", "em": 30.91 }, { "texto": "Riscos", "em": 31.86 }, { "texto": "Ativos", "em": 33.12 } ] } }
```

- `texto`: até ~40 caracteres (2 linhas de 56–100 px), fiel à fala.
- `rotuloEm` (opcional): quando o "R" acende — no "Eu respondi", "a resposta é". Sem isto, na entrada.
- `rotulo` (opcional): outro nome ("VERDADE", "SAÍDA", "1/4 DO PRATO"); a letra grande é a primeira letra dele.
- `letra` (opcional): a marca grande pendurada, quando a primeira letra do rótulo não serve ("¼", "2", "!").
- `em` (opcional): quando o texto da resposta começa a ser dito (padrão: `de` + 0,1).
- Sem `pergunta` antes, duas `resposta` coladas dividem o mesmo cartão (a primeira some e a segunda entra): é assim que se mostram partes de um todo, cada uma com as suas marcas ("1/4 do prato: Proteína — frango, peixe, ovo" e depois "O outro quarto: Carboidrato — arroz, batata").
- `pergunta` (opcional): a linha do alto. Sem isto, usa a do último momento `pergunta`; sem nenhuma, o cartão fica só com a resposta.
- `fileira` (opcional): até 8 marcas. Marcas curtas (1 a 3 caracteres: os dias "D S T Q Q S S", "1 2 3") viram quadradinhos iguais que acendem a cada 0,1 s a partir de `fileira.em`. Palavras (até ~16 caracteres) viram etiquetas em mono; use objetos `{ "texto", "em" }` para cada uma acender na sua palavra.

### `trilha` — a história no tempo

A pessoa vai para a coluna da esquerda. À direita, o começo pequeno (`inicio`) e, embaixo dele, o ponto grande (`contagem`). Embaixo de tudo, a **trilha**: 52 barras como a onda de um período inteiro, que se preenchem da esquerda para a direita junto com o ponto grande, com a agulha correndo; no fim dela, o **marco** desce como um marcador de capítulo. A legenda pode continuar (`legenda: true`).

```json
{ "tipo": "trilha", "de": 9.43, "ate": 15.19, "legenda": true, "capitulo": "Um ano depois",
  "inicio": { "em": 10.07, "valor": 10, "unidade": "minutos por dia", "rotulo": "Dia 1", "relogio": true },
  "contagem": { "em": 11.14, "ate": 13.29, "valor": 300, "unidade": "textos", "rotulo": "1 ano" },
  "marco": { "em": 13.96, "texto": "1º cliente" } }
```

Sem números (texto que acende e barras ilustrativas):

```json
{ "tipo": "trilha", "de": 2.85, "ate": 8.6, "curva": "sobe", "ilustrativo": true,
  "inicio": { "em": 2.99, "texto": "A conversa", "rotulo": "Reacendeu" },
  "contagem": { "em": 5.3, "ate": 7.16, "texto": "Um ciclo de alta", "rotulo": "Bull market" },
  "marco": { "em": 7.16, "texto": "Criptomoedas" } }
```

- `inicio` (opcional): o ponto de partida. Com `valor` (número) ele conta de 0 até o valor; com `relogio: true` o valor é em minutos e vira um cronômetro (00:00 → 10:00); sem `valor`, use `texto` (até ~20 caracteres). `unidade` (até ~20), `rotulo` (mono rosa, até ~12). Sem `inicio`, o ponto grande desce para o meio da coluna.
- `contagem`: o ponto grande. `em` = onde a trilha começa a andar; `ate` = o fim da palavra do número ou da virada (padrão: `em` + 1,4 s). Com `valor` (até ~7 algarismos, pt-BR; `prefixo`, `sufixo`, `casas`), o número chega ao valor junto com a trilha; sem `valor`, o `texto` (até ~24 caracteres, 1 a 3 linhas) acende palavra por palavra a partir do `em`. `unidade` (até ~16) e `rotulo` (mono, até ~12).
- `marco` (opcional): `texto` até ~18 caracteres; `em` = a palavra dele. Antes disso o marco aparece tracejado no fim da trilha.
- `curva` (opcional): a forma das barras — `constante` (padrão: começa irregular e assenta), `sobe`, `cai`, `oscila`.
- `ilustrativo` (opcional): mostra a etiqueta ILUSTRATIVO entre as pontas (use quando a forma das barras não vem de números ditos).
- `pontas` (opcional): os rótulos das duas pontas da trilha. Padrão: o `rotulo` do início e o da contagem.
- Pede uns 4–7 s.

## 5. Câmeras (`cameras`)

O quadro tem três enquadramentos, como três câmeras de um estúdio. A troca é **seca** (um corte), a etiqueta do canto muda e a luz rosa dela pisca:

| `plano` | Zoom sobre o lugar do quadro | Etiqueta |
|---|---|---|
| `aberto` | 1× (o enquadramento do lugar) | CAM 1 · ABERTO |
| `medio` | 1,14× | CAM 2 · MÉDIO |
| `close` | 1,28× | CAM 3 · CLOSE |

O template mantém olhos e queixo sempre dentro do quadro (e a cabeça inteira quando a gravação deixa; ver `cabeca`, seção 1).

```json
"cameras": [ { "em": 0, "plano": "aberto" }, { "em": 4.72, "plano": "close" }, { "em": 6.24, "plano": "aberto" } ]
```

- Cada item vale a partir de `em` até o próximo. O player ignora a câmera (a capa tem enquadramento próprio).
- **Onde cortar**: (1) em **todo valor de `cortesEm` que cai no meio de um momento** (o pulo do corte vira um corte de câmera); (2) na primeira palavra da frase forte, 0,04 s antes dela; (3) de volta ao aberto quando o assunto muda.
- Ritmo: uma troca a cada ~2–5 s; não fique mais de ~5 s em close.
- Sem `cameras` (ou vazio), o template decide sozinho: cada lugar novo abre no aberto; a pergunta e a frase ganham close na primeira palavra do `destaque`; o `destaque` ganha close na palavra; cada corte longe de uma troca de lugar alterna aberto ↔ close.

## 6. Capítulos

Todo momento pode abrir um capítulo com `"capitulo": "A resposta"` (até ~16 caracteres; aparece em caixa-alta). A régua do alto mostra o número e o nome do capítulo atual (o novo entra rolando de baixo, com uma nota) e a barra de capítulos tem um segmento por capítulo, proporcional à duração: os passados em branco, o atual se preenchendo em rosa. O primeiro capítulo vale desde o começo do vídeo.

- 3 a 6 capítulos num vídeo de 20–60 s. O nome é um título editorial curto, não precisa ser dito: "O preço", "A pergunta", "Como avaliar", "A aula".
- Sem nenhum `capitulo`, a régua mostra só o chip e a barra inteira se preenche com o vídeo.

## 7. Regras de tempo

- **Fronteiras de momento na pausa entre frases**: o `de` de um = o `ate` do anterior = o valor de `cortesEm` entre as duas frases (ou, sem corte, o `em` da primeira palavra da frase seguinte menos 0,1). O primeiro momento pode começar em 0; o `ate` do último é a `duracao`.
- Sub-passos (`itens[].em`, `lados[].em`, `opcoes[].em`, `dados[].em`, `rotuloEm`, `detalheEm`, `significadoEm`, `fileira`, `inicio.em`, `contagem.em`/`ate`, `marco.em`, `seguirEm`): o `em` (ou o `ate`, onde indicado) da palavra, tirado de `work/palavras.json`. Nada aparece antes de ser dito.
- Momento com mais de ~4 s precisa de itens entrando por dentro dele (o `conferir.mjs` reprova momento parado por mais de 4,5 s).
- Só pessoa e legenda (palco): no máximo ~3 s, em respiros.
- Não repita o mesmo bloco três vezes seguidas.

## 8. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`: uma ou duas linhas embaixo da onda (46–56 px), a frase a lápis, cada palavra acendendo em branco e a palavra da vez em rosa. Ela aparece **só no palco e na trilha** (`legenda: true`); nos outros blocos a tela já mostra a fala. `semLegenda` acrescenta faixas sem legenda.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "para": "pra", "Cloud": "Claude", "né": "" }`. Elas valem para a legenda e para os textos que acendem. Só corrija o que você tem certeza. Não edite `palavras` à mão — o `cortar.mjs` reescreve esse campo.

Sons (automáticos, tonais, nunca dois a menos de 0,45 s): um tom grave quando o quadro recua para o estúdio no começo, uma nota quando um capítulo novo abre (sobe de altura a cada capítulo), uma nota curta no marco da trilha e na placa de alerta, e duas notas no botão do fechamento. Nada de clique, sino, ruído ou "whoosh". `"sfx": false` desliga.

## 9. Exemplos completos

### Um vídeo sobre cripto (43 s, sem episódio)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "capitulo": "O preço", "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "O Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "trilha", "de": 2.85, "ate": 8.6, "capitulo": "Bull market", "curva": "sobe", "ilustrativo": true,
      "inicio": { "em": 2.99, "texto": "A conversa", "rotulo": "Reacendeu" },
      "contagem": { "em": 5.3, "ate": 7.16, "texto": "Um ciclo de alta", "rotulo": "Bull market" },
      "marco": { "em": 7.16, "texto": "Criptomoedas" } },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "capitulo": "Mercado × bolso", "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "Bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 17.6, "capitulo": "Quem perde", "nivel": "alerta", "texto": "Para a maioria das pessoas", "em": 13.46,
      "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 14.93 },
    { "tipo": "topicos", "de": 17.6, "ate": 24.1, "titulo": "Tem gente que perde",
      "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21 }, { "texto": "Assume risco que não entende", "em": 21.25 } ] },
    { "tipo": "pergunta", "de": 24.1, "ate": 28.0, "capitulo": "Como avaliar", "em": 24.58,
      "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "destaque": "posicionamento?" },
    { "tipo": "resposta", "de": 28.0, "ate": 33.75, "texto": "Gravei uma aula gratuita", "destaque": "aula gratuita", "rotuloEm": 28.03, "em": 28.43,
      "fileira": { "itens": [ { "texto": "Mercado", "em": 30.91 }, { "texto": "Riscos", "em": 31.86 }, { "texto": "Ativos", "em": 33.12 } ] } },
    { "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro.", "risco": "promessa de lucro.", "em": 33.83 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "em": 35.23,
      "texto": "Você quer entender antes de decidir e correr o risco de perder o seu patrimônio?",
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "capitulo": "A aula", "em": 40.05,
      "texto": "Toca aqui em Saiba Mais e assiste essa aula agora.", "icone": "link", "botao": "Saiba Mais", "titulo": "Aula gratuita: como eu analiso" }
  ]
}
```

O quadro passa pela coluna da direita (o número), pela da esquerda (a trilha), pelo lugar de entrevista (a comparação), pelo grande (a placa de alerta, em close), pelo mais baixo (a pauta), de novo pela entrevista (pergunta → resposta no mesmo cartão), pelo médio (a frase), pela entrevista (a pergunta com opções) e termina na capa do player.

### O exemplo do modelo (podcast, 22 s, com episódio)

Fala: "A pergunta que mais mudou a minha carreira foi simples: o que você faria se ninguém estivesse olhando? Eu respondi: escreveria todos os dias. Comecei com dez minutos. Um ano depois, eram trezentos textos e o primeiro cliente. Consistência não é talento, é agenda. Esse é o corte do episódio de hoje. Segue pra ouvir o resto."

```json
{
  "marca": { "nome": "Tiago", "area": "Podcast" },
  "episodio": { "numero": "12", "inicio": "32:10", "total": "58:20" },
  "cameras": [
    { "em": 0, "plano": "aberto" }, { "em": 4.72, "plano": "close" }, { "em": 6.24, "plano": "aberto" },
    { "em": 11.04, "plano": "close" }, { "em": 15.19, "plano": "aberto" }, { "em": 17.56, "plano": "close" }
  ],
  "correcoes": { "para": "pra" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 3.48, "capitulo": "A pergunta",
      "texto": "A pergunta que mais mudou a minha carreira", "destaque": "mudou a minha carreira" },
    { "tipo": "pergunta", "de": 3.48, "ate": 6.24,
      "texto": "O que você faria se ninguém estivesse olhando?", "destaque": "ninguém estivesse olhando?" },
    { "tipo": "resposta", "de": 6.24, "ate": 9.43, "capitulo": "A resposta",
      "texto": "Escreveria todos os dias.", "destaque": "todos os dias.", "rotuloEm": 6.35,
      "fileira": { "itens": ["D", "S", "T", "Q", "Q", "S", "S"], "em": 8.4 } },
    { "tipo": "trilha", "de": 9.43, "ate": 15.19, "legenda": true, "capitulo": "Um ano depois",
      "inicio": { "em": 10.07, "valor": 10, "unidade": "minutos por dia", "rotulo": "Dia 1", "relogio": true },
      "contagem": { "em": 11.14, "ate": 13.29, "valor": 300, "unidade": "textos", "rotulo": "1 ano" },
      "marco": { "em": 13.96, "texto": "1º cliente" } },
    { "tipo": "citacao", "de": 15.19, "ate": 18.33, "capitulo": "A lição",
      "texto": "Consistência não é talento, é agenda.", "risca": "talento,", "destaque": "é agenda." },
    { "tipo": "player", "de": 18.33, "ate": 22.36, "capitulo": "O episódio",
      "rotulo": "O corte do episódio de hoje", "titulo": "Consistência é agenda",
      "chamada": "Segue pra ouvir o resto", "seguirEm": 20.79, "restoEm": 21.44 }
  ]
}
```
