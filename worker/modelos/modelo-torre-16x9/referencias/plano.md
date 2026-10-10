# O plano de edição (`src/plano.json`), versão deitada (16:9, 1920×1080)

## 0. No quadro deitado (16:9)

Tudo o que está abaixo vale, com estas diferenças (o template faz sozinho; o plano só precisa respeitar os limites):

- **Composição (aula 9 do curso):** a pessoa em **tela cheia** é a base. Cada momento abre o **quadro da esquerda** (o mundo 3D e o bloco, x 56 a 1050) e leva a pessoa para a **moldura da direita** (x 1096 a 1824, y 96 a 880), com o rosto no meio dela, acompanhado com ajuste suave. Quando o momento termina e o próximo demora mais de ~1,6 s, a pessoa volta à tela cheia (com legenda). Onde este texto fala em "ponte", "palco", "metade de cima" ou "moldura de baixo", leia "o quadro da esquerda, com a pessoa na moldura da direita".
- **Medidas:** os blocos, as colunas e os rótulos são medidos no espaço do vertical (1080 de largura, a metade de cima) e desenhados a 92% no quadro da esquerda. Os px das tabelas abaixo são desse espaço: na tela saem × 0,92. Os limites de texto são os mesmos; o template mede com as fontes de verdade e reduz até caber (nada vaza do quadro para a moldura).
- **Sem "por cima da cabeça":** `abertura`, `pergunta` e `cta` ficam no quadro da esquerda, no meio da faixa dos blocos, também no começo do vídeo.
- **Tempo de leitura e respiro (aula 9):** bloco de 2,5 a ~8 s; entre blocos, a pessoa em tela cheia de 2 a ~8 s, ou blocos encostados (o quadro fica aberto). O `conferir.mjs` deste modelo pede ≥ 50% de cobertura, trecho só com legenda até ~8 s, um momento a cada ~10 s e nada parado mais de ~6 s. Não cubra cada frase: no vídeo completo, o bloco entra onde a ideia ganha com o apoio visual. Evite abrir e fechar o quadro a cada frase (vão de menos de 2 s entre momentos: encoste um no outro).
- **Legenda:** sempre no terço de baixo, centrada (centro em y 932, Sora 800 58 px); `posicaoLegenda` não muda nada aqui.
- **Margens:** 96 px nas laterais; nada importante abaixo de y 984 (controles do player).

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o `rastro` do rosto), `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `virada`, `posicaoLegenda`, `momentos`, `semLegenda`, `correcoes` e corrige `palavras` quando a transcrição errou um número, um preço ou um nome (SKILL.md, passo 4b).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita (o `ferramentas/timing.mjs` confere: ±0,15 s).

## Sumário

1. Campos gerais
2. A gramática: tela cheia, quadro e o mundo 3D
3. A assinatura: `torre`, `rota`, `planta`, `preco`
4. Os blocos universais
5. Regras de tempo
6. Legenda, correções e sons
7. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Rafael Moura", "area": "Corretor de imóveis" },
  "virada": { "em": 1.93, "video": "virada.mp4" },
  "posicaoLegenda": "queixo",
  "trilha": { "arquivo": "trilha.mp3", "volume": 0.08 },
  "sfx": true,
  "correcoes": {},
  "semLegenda": []
}
```

- `marca`: `nome` (Manrope 800, 44 px, nunca menos de 34) e `area` (caixa alta espaçada, 24 px) vão numa tarja de vidro-noite junto da pessoa (em tela cheia, no terço de baixo à esquerda, acima da legenda; na moldura da direita, no canto de baixo dela), de 0,3 s até antes do primeiro bloco que não seja a abertura (no máximo 3,8 s). `nome` vazio = sem tarja (o exemplo não tem).
- `virada` (opcional, uma vez): a linha de luz desce pela moldura em `em`.
  - `video`: a mesma gravação cortada, com a roupa/cenário trocado por uma IA de vídeo, em `public/` (mesma duração e enquadramento). Depois da linha ela aparece; a voz continua vindo de `video` do plano.
  - `antes`: o contrário, quando o vídeo principal já tem a troca dentro (era o caso do exemplo): a camada "antes" fica por cima até a linha passar. Precisa durar pelo menos até `em` + 0,7 s.
  - Sem `video` nem `antes`: a cidade fica apagada até a linha passar (ela acende de cima para baixo) e o filete da moldura fica dourado. A pessoa não muda.
- `posicaoLegenda`: do vertical (`"queixo"` ou `"costura"`). No 16:9 é aceito e não muda nada: a legenda fica sempre no terço de baixo.
- `trilha` (opcional): música do usuário em `public/`, sem batida, bem baixa (`volume` 0,06 a 0,12; repete se for curta). Sem `trilha`, só os sons do modelo.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs` (no 16:9, `rosto` traz o `quadro` 1920×1080). Não mexa à mão. A `zona` não é usada (a pessoa fica em tela cheia ou na moldura). `cortesEm` alterna o enquadramento a cada corte.

## 2. A gramática: tela cheia, quadro e o mundo 3D

- **Tela cheia** (a base, fora dos momentos): a pessoa como foi gravada, com a legenda no terço de baixo. O punch de cada corte e o empurrão lento continuam.
- **Quadro aberto** (durante os momentos): ~0,4 s antes do `de`, a pessoa vai em 0,55 s para a moldura da direita e o quadro da esquerda mostra o mundo 3D com o bloco. Momentos com menos de ~1,6 s entre eles ficam no mesmo quadro aberto; no fim, a pessoa volta à tela cheia. Antes do primeiro bloco que não seja `abertura`/`pergunta` (a ponte do vertical), o topo do quadro fica um pouco mais escuro e, com uma `torre` que tem `nome`, o letreiro nasce grande e vira cabeçalho 0,14 s depois do nome dito.
- **O mundo 3D muda de cena pelos blocos:**
  - `torre` → órbita lenta em volta do prédio que sobe;
  - `rota` e `passos` → a cidade baixa e vira mapa em relevo (0,9 s);
  - `planta` → mergulho no escuro e a planta humanizada;
  - `preco` → continua a cena de antes (escurece atrás da etiqueta);
  - blocos universais → a cidade desfoca e escurece e a câmera segue em órbita lenta (o prédio, se já subiu, continua aceso).
- **Cabeçalho**: o `nome` da primeira `torre` vira o cabeçalho do canto de cima do quadro (volta sempre que o quadro abre, até o fim). Os blocos universais começam abaixo dele (y 300 no espaço de medida).
- **Troca de bloco**: o que sai some com desfoque (0,3 s) enquanto o próximo entra. Entre o mapa e a planta, o mergulho escurece a tela por ~0,4 s.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases.
- **O `de` é onde a cena começa a mudar** (a câmera vai para o mapa, o mergulho começa); o `em` é a palavra que nomeia a coisa. Ex.: "Olha onde ele fica, a quatro minutos…" → `rota` com `de` em "Olha", `pinoEm` em "fica", `tempo.em` em "quatro".

## 3. A assinatura

### 3.1 `torre`: o número que vira andares

```json
{
  "tipo": "torre", "de": 2.0, "ate": 5.74,
  "categoria": "Residencial", "categoriaEm": 2.28,
  "nome": "Aurora", "nomeEm": 2.88, "emblema": "sol",
  "valor": 18, "em": 3.46, "ateEm": 4.94,
  "rotulo": "andares", "rotuloEm": 3.86,
  "local": "Pinheiros", "localEm": 4.94,
  "selo": "imóvel ilustrativo"
}
```

- `valor` + `em` + `ateEm`: o 1º andar pousa em `em`, o último em `ateEm` (+0,2 s); o contador da coluna conta junto (01 → 18) e termina no `valor` exato. Sem `ateEm`, sobe em 1,3 s.
- `andares` (opcional): quantos andares desenhar (4 a 30). Padrão: o próprio `valor`. No modo ilustrativo (`valor` 83, 1.250…), ponha 16 a 24.
- `rotulo` (obrigatório, caixa alta espaçada, 32 px): "andares", "torres", "unidades", "dólares"…; `prefixo`/`sufixo` (pequenos, champanhe): "R$", "mil", "mi"; `casas` para decimais.
- `nome` (o empreendimento, serifa 176 px que reduz até caber; vira cabeçalho de até 600 px), `categoria` (linha pequena acima: "Residencial", "Edifício", "Condomínio", "Business"), `emblema`: `sol`, `folha`, `onda`, `estrela` ou `nenhum` (padrão). Sem `nome`, sem letreiro.
- `local` + `localEm`: o bairro com o pino dourado, abaixo do rótulo.
- `selo`: texto pequeno do canto de cima à direita ("imóvel ilustrativo", "lançamento", "ilustrativo"). Some quando entra uma etiqueta de preço com `nota`.
- `fachada`: `residencial` (padrão: varandas em L, ripado de madeira, luz quente) ou `comercial` (pele de vidro, luz fria, sem varandas).
- `andarDestaque`: `{ "andar": 12, "em": 6.1, "texto": "Sala no 12º" }` acende aquele andar em dourado e mostra a etiqueta na coluna.
- `ilustrativo: true` para número que não é de prédio.

### 3.2 `rota`: o mapa traça o caminho

```json
{
  "tipo": "rota", "de": 5.74, "ate": 8.86,
  "em": 5.74, "pinoEm": 6.2,
  "tempo": { "valor": 4, "unidade": "min", "em": 7.02, "unidadeEm": 7.38 },
  "modo": "a pé", "modoEm": 8.06,
  "destino": { "texto": "do metrô", "em": 8.38, "rotulo": "Metrô", "icone": "metro" },
  "ruas": ["R. Fradique Coutinho", "R. dos Pinheiros"]
}
```

- `em`: a cidade começa a virar mapa; `pinoEm`: o pino dourado cai no prédio (padrão `em` + 0,45).
- `tempo` (opcional): o número grande da coluna (`valor` + `unidade`: "min", "km", "meses"); a rota começa a correr em `tempo.em` e chega ao destino em `destino.em`.
- `modo`: `a pé`, `de carro`, `de bicicleta` ou `de ônibus` (ícone + texto na coluna).
- `destino`: `texto` = como foi dito ("do metrô", na coluna); `rotulo` = a placa no mapa (padrão: o texto sem "do/da"); `icone`: `metro`, `onibus`, `escola`, `parque`, `mercado`, `praia`, `hospital`, `shopping` ou `pino`.
- `paradas` (opcional, até 3): pontos no caminho, `{ "texto": "a padaria", "em": 7.4 }`; cada um acende quando é dito. Sem `tempo`, a coluna vira a lista numerada das paradas + o destino.
- `titulo` (opcional): linha em caixa alta no alto da coluna ("Aula gratuita").
- `ruas` (opcional, até 2): nomes deitados nas ruas do mapa. **Só se foram ditos ou o usuário pediu.**
- O mapa é ilustrativo: não é a cidade real.

### 3.3 `planta`: o que tem dentro

```json
{
  "tipo": "planta", "de": 8.86, "ate": 14.67,
  "em": 9.1, "rotulo": "por dentro", "forma": "apartamento",
  "area": { "valor": 72, "em": 9.85, "ateEm": 10.99, "unidade": "m²", "unidadeEm": 11.49 },
  "comodos": [
    { "texto": "Suíte", "comodo": "suite", "quantidade": 2, "em": 13.11 },
    { "texto": "Varanda gourmet", "comodo": "varanda", "em": 13.83 }
  ]
}
```

- `de`: o mergulho começa (a câmera desce no escuro); `em`: a planta entra (o traço de arquiteto começa a se desenhar). Deixe ~0,25 s entre os dois.
- `area` (opcional): conta de 0 até `valor` entre `em` e `ateEm` enquanto as paredes sobem; `unidade` (padrão "m²") entra em `unidadeEm`. Depois a área vai pequena para o canto. Sem `area`, as paredes sobem em ~1,1 s.
- `rotulo` (opcional): caixa alta embaixo do número ("por dentro", "planta", "a casa").
- `comodos`: cada um acende (piso dourado + borda) com a etiqueta no `em` da palavra. `comodo` escolhe a peça: `suite`, `quarto`, `sala`, `cozinha`, `varanda`, `banheiro`, `escritorio`, `reuniao`, `recepcao`, `copa`, `quintal`, `piscina`, `garagem`, `frente`, `fundos` (sem `comodo`, o modelo adivinha pelo texto). `quantidade` (até 4) acende várias ("Suíte 1", "Suíte 2", a 0,22 s uma da outra). `m2` só se foi dito.
- `forma`: `apartamento` (padrão: estar, cozinha com ilha, varanda gourmet, 2 suítes, 2 banhos, mobiliado), `casa` (o mesmo + garagem com carro, quintal, piscina e muro baixo), `sala` (sala comercial: open space com mesas, sala de reunião, diretoria, recepção, copa) ou `terreno` (o lote gramado em quatro áreas, cerca, estacas e cotas douradas; os cômodos viram as áreas, na ordem).

### 3.4 `preco`: a etiqueta dourada

```json
{
  "tipo": "preco", "de": 14.67, "ate": 16.63,
  "valor": 1100000, "em": 14.85, "prefixo": "R$",
  "rotulo": "a partir de", "rotuloEm": 15.37,
  "partes": [ { "valor": 1000000, "em": 15.91 }, { "valor": 1100000, "em": 16.33 } ],
  "nota": "imóvel ilustrativo"
}
```

- `em`: a etiqueta desce no fio e bate. `partes`: a contagem para em cada pedaço dito ("um milhão" → 1.000.000 em "milhão"; "e cem" → 1.100.000 em "cem"). Sem `partes`, conta até `valor` em 1,1 s.
- `prefixo`/`sufixo` ("R$", "mil", "/mês"), `casas` para centavos. O número reduz até caber.
- `rotulo` ("a partir de", "por", "entrada de") e `nota` (linha pequena embaixo).
- Continua a cena 3D de antes, escurecida. Num vídeo que termina no preço, fica até o último quadro.

## 4. Os blocos universais

Campos iguais em todos os modelos do pack. Limites de texto: o template mede com as fontes de verdade e reduz até o mínimo; passou disso, quebra mais uma linha (nunca corta).

| `tipo` | Campos | Limites e como fica |
|---|---|---|
| `abertura` | `texto`, `destaque?`, `em?` | até ~45 caracteres. Com `destaque` (trecho exato do texto): o que vem antes sobe numa linha pequena (Sora 600, 46 px), o destaque entra letra a letra grande (Sora 800 champanhe, 124 px → 64) e o resto vem embaixo em caixa alta espaçada. Sem destaque: a frase inteira palavra por palavra (Sora 800, até 104 px) |
| `topicos` | `titulo?`, `itens[2..5] {texto, em, detalhe?}` | etiquetas de vidro com borda champanhe (56 px com até 3 itens, 50 com 4, 44 com 5; até 2 linhas); `detalhe` numa linha menor |
| `passos` | `titulo?`, `itens[2..5] {texto, em, detalhe?}` | vira mapa: a rota passa pelas paradas numeradas na ordem; a coluna lista 01, 02, 03 (até 2 linhas cada) |
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | número em serifa (230 px, reduz até caber em 900), conta em ~1 s; rótulo em caixa alta até 3 linhas |
| `comparacao` | `titulo?`, `modo?`, `lados[2] {rotulo, texto, em}`, `vencedor?`, `vencedorEm?` | duas fichas 440 × 520; texto até 6 linhas (62 → 34 px). `modo`: `contra` (×), `antes-depois` (→), `errado-certo` (o lado 1 em coral) |
| `grafico` | `titulo?`, `forma`, `dados[2..6] {rotulo, valor, em}`, `unidade?`, `tendencia?`, `tendenciaEm?`, `ilustrativo?` | `barras` = prédios que sobem andar por andar; `linha`; `pizza`. Sem números ditos: `tendencia` (`sobe`, `cai`, `oscila`) + `ilustrativo: true` |
| `destaque` | `texto`, `em`, `nivel?`, `detalhe?`, `detalheEm?` | até ~40 caracteres (116 → 56 px, 3 linhas); `alerta` em coral |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | termo em serifa (150 → 72 px); significado até ~110 caracteres |
| `frase` | `texto`, `destaque?`, `risco?`, `riscoEm?`, `em?` | até ~90 caracteres (74 → 44 px); `destaque` e `risco` são trechos exatos do texto |
| `pergunta` | `texto`, `opcoes[2..4]? {texto, em}`, `em?` | até ~70 caracteres; opções em etiquetas A, B, C, D |
| `cta` | `texto`, `icone?`, `destaque?`, `em?` | até ~50 caracteres (66 → 38 px, 3 linhas) na etiqueta dourada; `icone`: `salvar`, `seguir`, `comentar`, `link` |

Todos aceitam `legenda: true` (a legenda continua durante o bloco). No exemplo, todos os momentos têm `legenda: true`; nos blocos que já escrevem a fala inteira (`frase`, `destaque`, `abertura` sem destaque), deixe sem.

## 5. Regras de tempo

- Todo `em`/`…Em` = o `em` de uma palavra dita (±0,15 s). O andar 1 pousa na palavra do número; o último, na palavra que fecha a frase (o bairro, "andares").
- Cada bloco dura pelo menos ~2,5 s (tempo de leitura da aula); nada fica parado mais de ~4 s (a conferência deste modelo reprova acima de 6 s sem nada novo: divida ou acrescente itens com `em`).
- A `planta` precisa de ~4 s para mostrar tudo (traço → paredes → móveis → cômodos). Com menos, corte `comodos`.
- A `torre` precisa de ~1 s entre `em` e `ateEm` para os andares lerem como "subindo".
- O último momento termina em `duracao`.

## 6. Legenda, correções e sons

- Legenda Sora 800, 58 px, toda branca com contorno preto de 9 px e sombra leve, no terço de baixo (centro em y 932); blocos de até 3 palavras (~18 letras), cada palavra sobe quando é dita. Ela aparece fora dos momentos (a pessoa em tela cheia) e nos momentos com `legenda: true` (embaixo do quadro e da moldura).
- `correcoes`: `{ "chat GPT": "ChatGPT" }` troca palavras na legenda; `""` apaga. `semLegenda`: `[{ "de": 3.2, "ate": 4.0 }]`.
- Sons (automáticos): cristal na virada; a obra subindo na `torre` e no `grafico`; o pino na `rota` e no vencedor da `comparacao`; o mergulho e as paredes na `planta`; a seleção nos cômodos, tópicos, opções e definição; a etiqueta e o "hall" no `preco`, no `numero`, no `destaque` e no `cta`.

## 7. O exemplo completo

O plano do exemplo está em `assets/template/src/plano.json` (e comentado em `references/exemplo/plano-comentado.md`): `abertura` (0–1,93 s; o quadro já abre no primeiro quadro, porque a abertura começa em 0) → virada em 1,93 s → `torre` (2,0–5,74) → `rota` (5,74–8,86) → `planta` (8,86–14,67) → `preco` (14,67–16,63).
