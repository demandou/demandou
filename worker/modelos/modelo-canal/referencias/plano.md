# O plano do Canal (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo 1920×1080, `rosto` com o rastro e o quadro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `marca`, `momentos`, `legendas`, `correcoes`, `semLegenda` e, se quiser, `camera` e `sfx`.

Todos os tempos são em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra em `work/palavras.json` (o `conferir` avisa e o `ferramentas/timing.mjs` reprova o que passar de ±0,15 s).

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "Rafael Moura", "area": "Testes de equipamento", "de": 0.45, "ate": 3.6 }`. Tarja de nome embaixo no lado livre (padrão: de 0,3 s por 3,4 s). Também é o nome no lembrete de inscrição. `nome: ""` = sem tarja |
| `legendas` | `false` (padrão, YouTube) ou `true`: legenda embaixo no centro, estilo legenda de player, até 2 linhas, com um traço cobalto na palavra dita |
| `sfx` | `true` (padrão): "vum" tonal quando o reframe entra, toque no corte para o B-roll, tique no clique da inscrição. `false` desliga. Nunca sino |
| `camera` | opcional; veja "A mesa de corte" |
| `correcoes` | `{ "chat gpt": "ChatGPT" }`: troca uma ou mais palavras seguidas na legenda e nos textos falados |
| `semLegenda` | `[{ "de": 12.0, "ate": 13.5 }]`: trechos sem legenda (só vale com `legendas: true`) |
| `imagens` | escrito pelo `imagens.mjs`; não edite à mão |
| `lado` (em qualquer momento) | `"dir"` ou `"esq"`: de que lado fica a informação. Padrão: o lado oposto ao rosto |

## A assinatura: `reframe`

```json
{ "tipo": "reframe", "de": 3.79, "ate": 8.7, "titulo": "Os 3 microfones",
  "itens": [
    { "texto": "Lapela", "em": 4.68, "imagem": { "id": "mic-lapela" } },
    { "texto": "USB", "em": 6.29, "imagem": { "id": "mic-usb" } },
    { "texto": "Sem fio", "em": 7.56, "imagem": { "id": "mic-sem-fio" } } ] }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `itens` | sim | 1 a 4 itens: `texto` (o nome, até ~22 caracteres, 1 linha), `em` (a palavra que nomeia o item), `imagem` (opcional, `{ "id" }` de `plano.imagens`, com `foco`/`efeito`), `detalhe` (opcional, até ~40 caracteres, uma linha cinza embaixo do nome) |
| `titulo` | não | o assunto da lista, até ~30 caracteres. Fica grande na área da foto até o primeiro item e depois vira o rótulo do alto, com o contador "1/3" |
| `numerar` | não | `false` tira os selos numerados (use quando a ordem não importa e nenhum "primeiro, segundo" foi dito) |
| `de`, `ate` | sim | `de` num corte ou na primeira palavra do assunto (no máximo ~1,5 s antes do primeiro item); `ate` ≥ 1,2 s depois do último item (pode atravessar um corte: a câmera aperta mais um pouco no corte) |

- Com foto em algum item, a área grande é 16:9 (744×418): o objeto inteiro, sem tarja preta. Item sem foto ali mostra o cartão tipográfico com o nome.
- Sem foto nenhuma, a área é um cartão tipográfico mais baixo: ideias, erros, motivos, opções.
- A câmera aproxima e empurra a pessoa para o lado oposto ao painel; seco num corte, em 0,5 s no meio da frase.

## Os outros efeitos próprios

### `cena` (B-roll)
`{ "tipo": "cena", "de": 12.75, "ate": 13.99, "em": 12.75, "imagem": { "id": "rua", "efeito": "aproximar" }, "rotulo": "Barulho de rua" }`
- Foto deitada e grande cobre a tela 1920×1080, com movimento lento (`aproximar` padrão, `afastar`, `panoramica`, `parado`). 1 a 2,2 s; `de` 0 a 0,1 s antes do `em`.
- `rotulo` (até ~30 caracteres) numa etiqueta de vidro no alto à esquerda, com barras de som; `rotuloEm` = quando é dito. Sem `rotulo` quando um `capitulo` está por cima.
- Sem imagem (`--escolher <id> 0`): cartão de tinta com a palavra.

### `capitulo`
`{ "tipo": "capitulo", "de": 12.75, "ate": 13.99, "texto": "Teste com barulho de rua", "em": 12.75 }`
- `texto` até ~40 caracteres (até 2 linhas), com as palavras da fala. "CAPÍTULO" em mono em cima; `numero` (opcional) acrescenta o número ("Capítulo 2"); sem `numero`, não aparece número.
- A barra de capítulos tem um trecho por `capitulo` do plano; o da vez enche durante o momento.
- `de` = o corte em que o assunto muda (a câmera abre no plano aberto) ou o começo da `cena` que abre o assunto (o capítulo fica por cima do B-roll). 1,2 a 2,5 s.

### `chamada` (o que vem adiante)
`{ "tipo": "chamada", "de": 11.62, "ate": 12.75, "texto": "No final: teste com barulho", "em": 11.67 }`
- Chip discreto embaixo no lado livre: ▶ num selo cobalto + `texto` (até ~34 caracteres, 1 linha), com as palavras da fala. Entra no `em` (a palavra que anuncia: "final", "daqui a pouco"…).
- Use nos ganchos de retenção ("fica até o final", "já já eu mostro"). Termine no `de` do capítulo ou do bloco anunciado: ele aparece no mesmo canto. 1 a 2 s.

### `inscricao` (lembrete de inscrição)
`{ "tipo": "inscricao", "de": 14.05, "ate": 15.56, "texto": "Se inscreve no canal", "em": 14.09, "cliqueEm": 14.55 }`
- Avatar com o símbolo de play + o nome (`canal`, padrão `marca.nome`) + `texto` em cinza + o botão "Inscrever-se". O cursor entra no `em`, clica no `cliqueEm` (padrão: `em` + 0,45) e o botão vira "Inscrito". Sem sino.
- Use quando a fala pede inscrição. A câmera vai para o plano médio. ≥ 1,2 s.

## Os blocos universais

Os que entram **no reframe** (a pessoa vai para o lado e o painel ocupa a metade livre): `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao`, `frase`, `pergunta`. Momentos de reframe seguidos (menos de 0,6 s entre eles, do mesmo lado) viram um reframe só: a câmera fica no lado e só o painel troca.

### `abertura`
`{ "tipo": "abertura", "de": 0, "ate": 3.76, "texto": "Testei os 3 microfones mais vendidos até R$ 500", "destaque": "até R$ 500", "em": 0.06 }`
- `texto` até ~60 caracteres (até 4 linhas de 52 a 92 px). Pode resumir a fala: cada palavra entra quando é dita; a que não foi dita igual ("3" para "três") entra logo depois da anterior.
- `destaque`: trecho exato do `texto`; o marcador cobalto cresce por trás das palavras.
- Fica no lado livre sem empurrar a pessoa; com a tarja de nome no mesmo trecho, o título sobe e a tarja fica embaixo.

### `numero`
`{ "tipo": "numero", "de": 3.0, "ate": 5.2, "valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei" }`
- Conta de 0 até `valor` em 0,9 s a partir de `em`, em pt-BR. `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", "h"), `casas`. `rotulo` até ~40; `titulo` (rótulo mono do alto) até ~30. `ilustrativo: true` põe a etiqueta.
- `de` a no máximo ~0,3 s antes do `em`.

### `topicos` e `passos`
`{ "tipo": "passos", "de": 30.85, "ate": 33.7, "titulo": "Como eu analiso", "itens": [{ "texto": "O mercado", "em": 30.91 }, { "texto": "Os riscos", "em": 31.86 }, { "texto": "A escolha dos ativos", "em": 32.29, "detalhe": "sem promessa" }] }`
- 2 a 5 itens, `texto` até ~30 caracteres (1 linha), `detalhe` até ~40. `passos` = em ordem (selos "01, 02…" e o fio cobalto).

### `comparacao`
`{ "tipo": "comparacao", "de": 12.6, "ate": 14.5, "modo": "contra", "lados": [{ "rotulo": "Lapela", "texto": "som mais limpo", "em": 12.8 }, { "rotulo": "USB", "texto": "mais prático", "em": 13.6 }], "vencedor": 0, "vencedorEm": 14.1 }`
- Dois cartões empilhados; `rotulo` até ~24 (mono), `texto` até ~40 (até 3 linhas). `modo`: `contra` ("vs"), `antes-depois` e `errado-certo` ("↓"; no errado-certo o perdedor é riscado em coral). `vencedor` + `vencedorEm`: o vencedor acende em cobalto, o outro apaga.

### `grafico`
- Com números ditos: `"forma": "barras" | "linha" | "pizza"`, `dados` com 2 a 6 itens `{ "rotulo", "valor", "em" }`, `unidade` ("mil", "%").
- Sem números: `tendencia` (`sobe`, `cai`, `oscila`) + `tendenciaEm` + `"ilustrativo": true` (obrigatório).
- `titulo` até ~30 caracteres.

### `destaque` (palavra-chave)
`{ "tipo": "destaque", "de": 9.6, "ate": 11.25, "texto": "O mais barato", "em": 9.86, "detalhe": "ganhou no som", "detalheEm": 10.39 }`
- `texto` curto (1 a 5 palavras; até 2 linhas). Fica no lado livre, na altura do rosto. `nivel: "alerta"` = traço e linha do tempo em coral.
- `detalhe` até ~40 caracteres, embaixo, no `detalheEm`. Não empurra a pessoa: combina com um corte para o plano fechado.

### `definicao`
`{ "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "um ciclo de alta das criptomoedas", "significadoEm": 5.96 }`
- `termo` até ~26 caracteres; `significado` até ~140 (4 linhas).

### `frase`
`{ "tipo": "frase", "de": 35.23, "ate": 40.0, "texto": "Entender antes de decidir", "destaque": "antes de decidir", "em": 35.93 }`
- `texto` até ~120 caracteres (até 4 linhas de 42 a 70 px). Palavra por palavra. `risco`/`riscoEm`: trecho riscado em coral.

### `pergunta`
`{ "tipo": "pergunta", "de": 24.21, "ate": 28.0, "texto": "Como avaliar os projetos?", "em": 24.58, "opcoes": [{ "texto": "Pelo time", "em": 25.1 }, { "texto": "Pelo uso", "em": 25.9 }] }`
- `texto` até ~70 caracteres; `opcoes` 2 a 4, `texto` até ~30 (letras A, B, C…).

### `cta`
`{ "tipo": "cta", "de": 40.05, "ate": 43.0, "texto": "Toca em Saiba Mais e assiste a aula", "icone": "link", "em": 40.05 }`
- `icone: "seguir"` = o lembrete de inscrição (como `inscricao`). `salvar`, `comentar`, `link`: cartão embaixo no lado livre com o ícone e a chamada palavra por palavra; `destaque` no marcador.

## A mesa de corte (câmera)

Sem nada no plano: a câmera troca em cada corte (`cortesEm`), aberto 1,0 ↔ fechado 1,3 (médio 1,15 para não repetir); começa aberta; o capítulo abre no aberto; a inscrição vai para o médio; a volta do reframe abre; a volta do B-roll muda de câmera. Abertura, destaque, frase e o reframe aproximam devagar (até ~4%) até o próximo corte.

`"camera": [{ "em": 8.8, "plano": "medio", "aproximar": 0.06 }, { "em": 11.31, "aproximar": true }]`
- Um item num corte escolhe o plano daquele trecho (`"aberto"`, `"fechado"`, `"medio"` ou `zoom`). Fora de um corte, é uma troca de câmera seca no meio da frase (1 ou 2 vezes por 15 s, numa ênfase).
- `aproximar: true`: aproximação lenta até o próximo corte (até ~4%). `aproximar: 0.06`: punch-in de ênfase de 6% em até 0,8 s (na palavra de impacto: "surpreendeu").
- O rosto fica na mesma altura em todas as câmeras.

## Regras de tempo

- Um bloco de informação por vez no lado livre; 0 a 0,3 s de respiro entre eles. O `capitulo` pode ficar por cima de uma `cena`; a tarja de nome convive com a `abertura`.
- Trecho só com a pessoa: até 3,5 s (o `conferir` reprova acima disso). Algo novo (corte de câmera, item, painel) a cada ~1,5 a 2,5 s.
- Cobertura: 70% ou mais do vídeo. O `reframe` aparece pelo menos uma vez; em vídeos de mais de 20 s, pelo menos 2 efeitos próprios (`reframe`, `cena`, `capitulo`, `inscricao`).
- Cada cartão, item, imagem e palavra-chave entra na palavra que o nomeia (±0,15 s): `node ferramentas/timing.mjs`.
- Texto final (inscrição, último cartão, placar) legível por ≥ 1,2 s.
