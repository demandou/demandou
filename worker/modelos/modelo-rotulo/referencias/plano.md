# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `rotulo`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `camafeu`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. O rótulo (`rotulo`)
3. A gramática: quadro cheio × rótulo, e a lupa (`pessoa`, `alvo`, `trecho`)
4. Os 11 blocos universais
5. A assinatura: `campo` e `medidor`
6. Os tipos do exemplo de bebida (`origem`, `variedade`, `ano`, `teor`, `nota`)
7. Regras de tempo, legenda, correções e sons
8. Exemplos: o sommelier e um vídeo de saúde

## 1. Campos gerais

```json
{
  "marca": { "nome": "Ana Souza", "area": "Nutrição" },
  "sfx": true,
  "correcoes": { "para a sua": "pra sua" },
  "semLegenda": []
}
```

- `marca`: aparece nas letras miúdas do pé do rótulo ("Uma leitura de Ana Souza · Nutrição"), no cabeçalho do fechamento e nas iniciais do lacre. Juntos, até ~28 caracteres. `nome` vazio: o pé mostra o nome do rótulo e o lacre leva um visto.
- `camafeu` (opcional): ajuste da pessoa dentro do camafeu (oval de 400×500 px). Sem ele, o tamanho do rosto é calculado pelo rastro do rosto; em gravação muito perto da câmera (selfie), o rosto sobe na oval para o queixo não cortar. `{ "zoom": 2.8 }` aproxima, `1.6` afasta; `"ancoraY"` (padrão 0,62) é a altura do rosto na oval (menor sobe o rosto; se o queixo cortar, diminua).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. O rótulo (`rotulo`)

O rótulo é a **ficha técnica fictícia do que o vídeo explica**. Ele ocupa a tela nos momentos do rótulo: o camafeu (a pessoa) no alto, quatro **campos** em volta dele, o **nome** grande embaixo e a **linha larga** em caixa alta.

```
  [campo 1]   ( camafeu )   [campo 2]
  [campo 3]   (         )   [campo 4]
             Nome do rótulo
         ────────── ◆ ──────────
       LINHA · LARGA · EM CAIXA ALTA
```

```json
"rotulo": {
  "nome": "Bitcoin",
  "linha": "Mercado · Riscos · Ativos",
  "campos": [
    { "nome": "Preço", "valor": "US$ 83 mil" },
    { "nome": "Ciclo", "valor": "Alta" },
    { "nome": "Lucro", "valor": "Sem promessa" },
    { "nome": "Aula", "valor": "Gratuita" }
  ]
}
```

| Campo | Onde fica | Limite |
|---|---|---|
| `nome` | logo abaixo do camafeu (Caslon Display 72 px) | 1 a 3 palavras, até ~24 caracteres (encolhe até caber) |
| `linha` (opcional) | em caixa alta embaixo do nome | 2 a 4 itens separados por " · ", até ~40 caracteres; passou disso, quebra em duas linhas. Sem `linha`, um ornamento ocupa o lugar |
| `campos` | até 4, em volta do camafeu, nesta ordem: alto à esquerda, alto à direita, baixo à esquerda, baixo à direita | `nome` (opcional): caixa alta pequena, até ~14 caracteres; `valor`: até ~14 caracteres por palavra e 2 linhas curtas. Nos de cima, valor curto ("US$ 83 mil", "10 anos", "Alta") sai grande em Caslon Display; o 3º sai em itálico vinho; o 4º em caixa alta. Menos de 4 campos: as vagas viram ornamento |
| `pe` (opcional) | letras miúdas acima da marca, no pé (sob a interface do app) | padrão "Uma leitura de" |
| `volume` (opcional) | última linha das letras miúdas | até ~12 caracteres |

Como montar:
- Tudo vem da fala: os campos são os dados e as palavras-chave do vídeo (um número dito, um nome, uma qualidade, o "quem/onde/quando" de uma história).
- Pense no rótulo como o resumo do vídeo: no fim, a lupa terá lido e numerado cada campo.
- Nunca use marca, empresa ou produto real que a pessoa não citou.

**Formato de bebida** (o do exemplo do sommelier, ainda aceito): sem `campos`, o rótulo usa `categoria`, `destaque` (a uva), `origem` (a linha larga), `ano` + `anoRotulo` ("Safra") e `teor` ("14% vol"), e o pé diz "Engarrafado por".

## 3. A gramática: quadro cheio × rótulo, e a lupa

| Estado | Momentos (padrão) | A pessoa | O que acontece |
|---|---|---|---|
| **Quadro cheio** | `abertura`, `pergunta`, `cta` | quadro cheio, rosto no centro | a ficha de papel fica na altura do peito |
| **Rótulo** | todos os outros | o camafeu oval do rótulo, que anda com a câmera | a câmera aproxima o campo, a lupa lê, a ficha (no mesmo lugar, agora o pé do rótulo) explica |
| **Sem momento** | buraco de 1,2 s ou mais | quadro cheio | a ficha desce e sai; a legenda aparece abaixo do queixo |

Campos que **todo momento** aceita, além dos do bloco:
- `"pessoa": "cheia"` ou `"camafeu"`: troca o estado do momento. Alterne de vez em quando (um carimbo ou uma frase forte em quadro cheio no meio do rótulo): a pessoa mudar de lugar é parte do estilo.
- `"alvo"`: o campo que a lupa lê neste momento. Pode ser o `nome` de um campo ("Preço"), o `valor` dele, o número do campo (1 a 4), `"nome"` (o nome do rótulo), `"linha"` ou um trecho da linha larga ("Riscos"). Sem `alvo`, o template escolhe o campo cujo texto aparece no momento; se nenhum combina, o próximo campo ainda não lido.
- `"trecho"`: o pedaço da linha larga (ou do nome) onde a lupa para.
- `"legenda": true`: mantém a legenda durante o momento.

Itens de `topicos` e `passos` e lados de `comparacao` também aceitam `alvo`/`trecho`: a lupa anda até eles quando são ditos. Item cujo texto aparece na linha larga ("Mercado" com a linha "Mercado · Riscos · Ativos") já leva a lupa até lá sozinho.

O que o template faz sozinho:
- **A troca**: o quadro cheio encolhe até o camafeu (os cantos arredondam até a elipse) em 0,8 s, começando 0,16 s antes da fronteira; com a fronteira num corte, o pulo some.
- **A câmera**: em cada campo lido, aproxima 6–12% e puxa o campo para perto do meio; o camafeu vai junto.
- **A lupa**: entra pela direita meio segundo depois da troca, amplia a impressão de verdade e leva o número do campo no aro; nas linhas largas, uma linha pontilhada desce dela até a ficha. Quando o caminho passaria pelo rosto, ela sai do papel e pousa no campo novo.
- **Os números**: cada campo ganha um número na primeira leitura (o mesmo do aro da lupa e do cabeçalho da ficha), e o número fica impresso ao lado dele quando a lupa sai. No cabeçalho da ficha, um losango por campo lido.
- **A ficha troca deslizando**: a de cada momento entra pela direita enquanto a anterior sai pela esquerda.
- **Nada chega vazio**: todo texto e traço já está a lápis e ganha tinta na palavra em que é dito.

## 4. Os 11 blocos universais

Campos comuns: `tipo`, `de`, `ate` e os da seção 3. `titulo` (opcional, até ~24 caracteres) é o cabeçalho da ficha; sem ele, o cabeçalho é o nome do campo que a lupa lê, ou um padrão do tipo. Textos com as palavras da fala. Os tamanhos encolhem até o mínimo legível, mas dentro dos limites abaixo tudo fica grande.

### `abertura`

```json
{ "tipo": "abertura", "de": 0, "ate": 2.6, "texto": "Três sinais de que você dorme mal", "destaque": "dorme mal",
  "rotulo": "Ficha técnica do sono", "selo": { "em": 0.4, "valor": "3" } }
```
- `texto`: o título, até ~50 caracteres (até 3 linhas de 96 px; mais longo cai para 4 linhas menores). Ou `linhas` (as quebras escritas por você, até ~17 caracteres cada).
- `destaque`: trecho exato do título em itálico vinho.
- `em` (opcional): o instante em que o título começa a ser dito (padrão: `de`). Use quando o momento começa antes da fala (uma pausa, um respiro).
- `rotulo`: caixa alta acima do título (padrão "Ficha técnica").
- `selo` (opcional): mostrador redondo à direita com o `valor` no meio e `marcas` que se acendem a partir de `em` (a palavra do número). Bom para "3 sinais", "10 segundos", "às seis" (com `marcas: 12`, vira um relógio).

### `topicos`

```json
{ "tipo": "topicos", "de": 17.25, "ate": 24.21, "alvo": "Riscos", "titulo": "Por que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 },
             { "texto": "Escolhe moeda sem critério", "em": 19.21 },
             { "texto": "Assume risco que não entende", "em": 21.25 } ] }
```
- 2 a 5 itens, de 2 a 6 palavras (até ~30 caracteres). Com até 3 itens, cada um pode ter 2 linhas; com 4 ou 5, uma linha cada (ou duas colunas, se precisar).
- `detalhe` (opcional, até ~20 caracteres): em itálico, alinhado à direita no fim da linha-guia; sai se não couber.
- Cada item entra no seu `em`; a linha-guia do item da vez fica vinho.

### `passos`

Igual a `topicos`, mas em ordem: números em círculo vinho ligados por um traço que chega quando o passo é dito.
```json
{ "tipo": "passos", "de": 30.4, "ate": 33.6, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86, "trecho": "Mercado" },
             { "texto": "Os riscos", "em": 31.47, "trecho": "Riscos" },
             { "texto": "A escolha dos ativos", "em": 32.21, "trecho": "Ativos" } ] }
```

### `numero`

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "pessoa": "cheia", "titulo": "Bitcoin", "valor": 83000, "prefixo": "US$",
  "em": 1.34, "rotulo": "rompeu os 83 mil dólares", "rotuloEm": 0.62 }
```
- `valor`: o número dito; conta de 0 até ele a partir de `em`, no formato pt-BR (83.000; 1,5). `casas`: casas decimais.
- `prefixo` ("US$", "R$") e `sufixo` ("%", "mil", "mi", "anos"): em vinho, menores. Para "83 mil" você pode usar `valor: 83, sufixo: "mil"`.
- `rotulo`: o que o número é, até ~60 caracteres, em itálico (ao lado do número se couber, senão embaixo). `rotuloEm`: a primeira palavra dele.
- `ilustrativo: true` mostra a etiqueta (número que não foi dito exatamente).

### `comparacao`

```json
{ "tipo": "comparacao", "de": 35.23, "ate": 40.05, "modo": "errado-certo",
  "lados": [ { "rotulo": "Entender", "texto": "antes de decidir", "em": 35.93 },
             { "rotulo": "Ou correr o risco", "texto": "de perder o seu patrimônio", "em": 37.98 } ],
  "vencedor": 0, "vencedorEm": 39.31 }
```
- `modo`: `contra` (× no losango, padrão), `antes-depois` (seta), `errado-certo`.
- `lados[].rotulo`: caixa alta, 1 a 3 palavras; `texto`: até ~40 caracteres.
- `vencedor` / `vencedorEm`: o lado que ganha o grifo vinho; o outro esmaece (e é riscado em `errado-certo`). Em `errado-certo` sem `vencedor`, ganha o lado 1.

### `grafico`

Com números ditos (`dados` com 2 a 6 itens; fora disso o `conferir` reprova):
```json
{ "tipo": "grafico", "de": 4, "ate": 8, "forma": "barras", "unidade": "%",
  "dados": [ { "rotulo": "Poupança", "valor": 6.2, "em": 4.3 }, { "rotulo": "Ações", "valor": 15, "em": 6.4 } ] }
```
Sem números (a forma da tendência, sempre com a etiqueta):
```json
{ "tipo": "grafico", "de": 8.67, "ate": 11.75, "alvo": "Mercado", "titulo": "Mercado", "forma": "linha",
  "tendencia": "sobe", "tendenciaEm": 9.31, "ilustrativo": true }
```
- `forma`: `barras` (cada barra cresce no seu `em`; a maior em vinho), `linha` (a linha anda de ponto em ponto) ou `pizza` (cada fatia abre no seu `em`, com a legenda e as porcentagens).
- `dados[].rotulo`: até ~14 caracteres. `unidade`: "%", "mil", "kg"…
- `tendencia`: `sobe`, `cai` ou `oscila`; `tendenciaEm`: a palavra que dá o sentido (a seta aparece nela). `ilustrativo: true` é obrigatório sem `dados`.

### `destaque`

```json
{ "tipo": "destaque", "de": 14.93, "ate": 17.25, "pessoa": "cheia", "texto": "Tem gente que perde", "em": 15.96,
  "nivel": "alerta", "detalhe": "mesmo na alta", "detalheEm": 14.93 }
```
- `texto`: o carimbo, até ~30 caracteres (caixa alta, 2 linhas). `em`: quando ele bate.
- `nivel`: `alerta` (vinho, padrão) ou `chave` (tinta).
- `detalhe` (opcional, até ~50 caracteres) em itálico embaixo, a partir de `detalheEm`.
- Fica bem em quadro cheio (`"pessoa": "cheia"`): o carimbo bate no peito.

### `definicao`

```json
{ "tipo": "definicao", "de": 5.25, "ate": 8.67, "alvo": "Ciclo", "termo": "Bull market", "em": 5.30,
  "significado": "um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```
- `termo`: até ~28 caracteres. `significado`: até ~60 caracteres, em itálico, depois da linha-guia.

### `frase`

```json
{ "tipo": "frase", "de": 33.6, "ate": 35.23, "alvo": "Lucro", "texto": "Sem promessa de lucro",
  "risco": "promessa de lucro", "riscoEm": 34.68 }
```
- `texto`: a frase dita, até ~90 caracteres (frase curta sai grande, até 92 px). `destaque`: trecho em itálico vinho. `risco`: trecho riscado em vinho em `riscoEm` (padrão: logo depois da última palavra dele).
- `em` (opcional): o instante em que a frase começa a ser dita (padrão: `de`).

### `pergunta`

```json
{ "tipo": "pergunta", "de": 24.21, "ate": 28.03, "texto": "Como avaliar os projetos e pensar no seu posicionamento?" }
```
- `texto`: até ~70 caracteres. `opcoes` (opcional; se houver, de 2 a 4, até ~24 caracteres cada, `{ "texto", "em" }`): caixinhas de marcar que ganham tinta no seu `em`.
- `em` (opcional): o instante em que a pergunta começa a ser dita (padrão: `de`); o selo do "?" acende a partir dela.
- Padrão em quadro cheio (a pergunta é para quem assiste).

### `cta`

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais", "icone": "link" }
```
- `texto`: a chamada, até ~45 caracteres (ou `linhas`, 1 a 3). `destaque`: trecho com o grifo vinho.
- `icone`: `salvar` (fita marcadora, padrão), `seguir` ("+" que vira visto), `comentar` (balão), `link` (etiqueta de pendurar com seta: "saiba mais", "link na bio"). Outro valor reprova no `conferir`.
- `em` (opcional): o instante em que a chamada começa a ser dita (padrão: a primeira palavra); o ícone age nele.
- Na última palavra, o lacre de cera com as iniciais da `marca` carimba a ficha (num vídeo com taça, as taças brindam).

## 5. A assinatura: `campo` e `medidor`

Use pelo menos uma das duas em todo vídeo (o `conferir.mjs` exige).

### `campo`: a lupa lê um campo do rótulo

```json
{ "tipo": "campo", "de": 2.89, "ate": 5.25, "alvo": "Preço",
  "valor": { "em": 2.99, "texto": "US$ 83 mil" },
  "linhas": [ { "em": 2.99, "texto": "reacendeu a conversa" } ] }
```
- `alvo`: o campo (sem ele, o template escolhe).
- `valor` (opcional): o valor grande na ficha, até ~24 caracteres; sem ele, o valor do campo no rótulo. Uma linha-guia pontilhada vai dele até o número do campo.
- `linhas` (opcional, até 2): frases da fala em itálico, até ~50 caracteres cada.
- `titulo` (opcional): padrão = o nome do campo.

### `medidor`: qualquer escala

```json
{ "tipo": "medidor", "de": 11.75, "ate": 14.93, "alvo": "Lucro", "titulo": "Dinheiro no bolso",
  "valor": { "em": 11.99, "texto": "No bolso?" }, "em": 12.91, "pontas": ["vazio", "cheio"], "nivel": 0.12,
  "cheioEm": 13.82, "nota": { "em": 13.46, "texto": "para a maioria das pessoas", "destaque": "maioria" }, "ilustrativo": true }
```
- `valor` (opcional): a palavra ou o número dito, até ~24 caracteres.
- `pontas`: as duas pontas da escala (até ~12 caracteres cada): "baixo/alto", "fácil/difícil", "leve/intenso".
- `nivel` (0 a 1): até onde enche, em `cheioEm` (a palavra que dá o sentido). Em `em` o medidor ganha tinta e dá um primeiro toque.
- `nota` (opcional): frase em itálico, até ~50 caracteres.
- `ilustrativo: true` quando o nível não foi dito em número (quase sempre).
- `taca` (opcional, para bebidas): `{ "em": 15.5, "liquido": "tinto" }` troca o mostrador por uma taça que se enche (`tinto`, `rose`, `branco`, `cerveja`, `cafe`).

## 6. Os tipos do exemplo de bebida

Continuam valendo e servem fora do vinho quando a fala combina:
- `origem` (um lugar): a lupa anda pela linha larga do país para a região; mapinha do país com o ponto (`pais: { em, texto, mapa? }`, `regiao?: { em, texto, lat?, lon? }`, `nota?`). Mapas: `argentina`, `chile`, `brasil`, `uruguai`, `peru`, `colombia`, `mexico`, `guatemala`, `estados-unidos`, `canada`, `franca`, `italia`, `espanha`, `portugal`, `alemanha`, `austria`, `hungria`, `grecia`, `belgica`, `holanda`, `reino-unido`, `irlanda`, `republica-tcheca`, `africa-do-sul`, `etiopia`, `quenia`, `australia`, `nova-zelandia`, `japao`. Sem mapa, uma rosa dos ventos.
- `variedade`: um desenho a traço (`cacho`, `lupulo`, `grao`, `espiga`) e 1 a 3 exemplos ditos (`em`, `itens`, `conector`).
- `ano` (um ano): o número rola até o ano e um marcador anda numa régua de sete anos (`em`, `valor?` com 4 algarismos, `nota?`, `marcaEm?`).
- `teor`: o número conta, o medidor de corpo enche e a taça se enche (`em`, `valor?`, `unidade?`, `subida?`, `medidor: { em, de, ate, nivel, cheioEm }`, `taca?`).
- `nota`: o mesmo que `campo` (nome antigo).

## 7. Regras de tempo, legenda, correções e sons

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência num valor de `cortesEm` (a troca esconde o pulo do corte).
- **Buraco de 1,2 s ou mais** entre momentos vira trecho sem momento (pessoa em quadro cheio com legenda). Buraco menor é absorvido pelo momento anterior. No máximo ~3 s só com a pessoa.
- **Durações**: de 1,5 a 4 s por momento; o primeiro momento do rótulo, 2,4 s ou mais (o camafeu e a lupa entram nele). Momento com mais de ~4 s precisa de itens entrando por dentro dele.
- **Sub-passos**: cada `em` é a primeira palavra daquilo em `work/palavras.json`, dentro do momento. Nada aparece antes de ser dito.
- **Ritmo**: algo muda a cada 1,5–2,5 s. Não repita o mesmo bloco três vezes seguidas. Alterne quadro cheio e rótulo a cada 2 ou 3 momentos.
- **Lupa**: um campo diferente a cada momento do rótulo, de preferência; no fim, todos os campos lidos.
- **Legenda**: só nos trechos sem momento, numa etiqueta de papel abaixo do queixo, com a palavra da vez em itálico vinho. `semLegenda` tira de um trecho (`[{ "de": 1.2, "ate": 2.0 }]`).
- **Correções**: `{ "Malbéque": "Malbec" }`; `""` apaga. Só corrija o que você tem certeza.
- **"pra" e "pro"**: pode escrever na tela; o template casa com "para" da fala. Números casam com a palavra falada ("10" com "dez").
- **Sons** (automáticos, raros e tonais, nunca dois a menos de 0,42 s): "vum" grave quando a pessoa vira camafeu e quando volta; uma nota que sobe de altura a cada momento do rótulo; dois tons quando um número conta; um tom grave quando o carimbo bate e quando o lacre carimba; uma nota grave no significado da definição, no vencedor da comparação e no risco da frase; um deslizar tonal quando o gráfico começa; um acorde quando o medidor enche e quando o ícone do fechamento age. `"sfx": false` desliga.

## 8. Exemplos

### O sommelier (o exemplo do modelo, formato de bebida)

18,9 s, cortes em 2,98 · 7,07 · 10,88 · 13,09 · 16,82 (as fronteiras dos momentos). O rótulo é inventado; a fala só ensina onde olhar.

```json
{
  "marca": { "nome": "Tiago", "area": "Vinhos" },
  "rotulo": { "categoria": "Vinho tinto", "nome": "Vale Velado", "destaque": "Malbec",
              "origem": "Mendoza · Argentina", "ano": "2021", "anoRotulo": "Safra",
              "teor": "14% vol", "volume": "750 ml" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 2.98, "texto": "Como ler o rótulo de um vinho em 10 segundos",
      "rotulo": "Anatomia do rótulo", "linhas": ["Como ler o rótulo", "de um vinho", "em 10 segundos"],
      "destaque": "10 segundos", "selo": { "em": 1.92, "valor": "10" } },
    { "tipo": "origem", "de": 2.98, "ate": 7.07,
      "pais": { "em": 3.86, "texto": "Argentina", "mapa": "argentina" },
      "regiao": { "em": 4.43, "texto": "Mendoza", "lat": -32.9, "lon": -68.8 },
      "nota": { "em": 5.43, "texto": "dizem muito sobre o estilo", "destaque": "estilo" } },
    { "tipo": "variedade", "de": 7.07, "ate": 10.88, "em": 8.09, "desenho": "cacho",
      "itens": [ { "em": 8.78, "texto": "Cabernet Sauvignon" }, { "em": 10.21, "texto": "Malbec" } ], "conector": "ou" },
    { "tipo": "ano", "de": 10.88, "ate": 13.09, "em": 11.06,
      "nota": { "em": 12.21, "texto": "o ano da colheita", "destaque": "colheita" } },
    { "tipo": "teor", "de": 13.09, "ate": 16.82, "em": 13.19, "valor": 14,
      "subida": { "em": 14.03, "texto": "mais alto" },
      "medidor": { "em": 15.02, "de": "leve", "ate": "encorpado", "nivel": 0.86, "cheioEm": 16.25 },
      "taca": { "em": 15.54, "liquido": "tinto" } },
    { "tipo": "cta", "de": 16.82, "ate": 18.92, "texto": "Salva pra sua próxima compra",
      "linhas": ["Salva pra sua", "próxima compra"], "destaque": "próxima compra", "icone": "salvar" }
  ]
}
```

### Fora do vinho: um vídeo de saúde (tempos ilustrativos)

Fala: "Você dorme mal e acha que é normal? Dormir menos de 6 horas derruba a concentração. O ideal é de 7 a 9 horas. Três hábitos ajudam: horário fixo, quarto escuro e nada de tela antes de deitar. Salva para lembrar hoje à noite."

```json
{
  "marca": { "nome": "Ana Souza", "area": "Sono" },
  "rotulo": { "nome": "Sono", "linha": "Horário · Escuro · Sem tela",
              "campos": [ { "nome": "Limite", "valor": "6 h" }, { "nome": "Ideal", "valor": "7 a 9 h" },
                          { "nome": "Perde", "valor": "Concentração" } ] },
  "momentos": [
    { "tipo": "pergunta", "de": 0, "ate": 2.6, "texto": "Você dorme mal e acha que é normal?" },
    { "tipo": "numero", "de": 2.6, "ate": 4.4, "alvo": "Limite", "valor": 6, "sufixo": "horas", "em": 3.2,
      "rotulo": "menos que isso derruba a concentração", "rotuloEm": 3.0 },
    { "tipo": "medidor", "de": 4.4, "ate": 6.2, "alvo": "Perde", "titulo": "Concentração", "em": 4.6,
      "pontas": ["baixa", "alta"], "nivel": 0.2, "cheioEm": 5.4, "ilustrativo": true },
    { "tipo": "campo", "de": 6.2, "ate": 8.0, "alvo": "Ideal", "valor": { "em": 6.6, "texto": "7 a 9 horas" } },
    { "tipo": "passos", "de": 8.0, "ate": 11.8, "titulo": "Três hábitos",
      "itens": [ { "texto": "Horário fixo", "em": 8.9, "trecho": "Horário" },
                 { "texto": "Quarto escuro", "em": 9.9, "trecho": "Escuro" },
                 { "texto": "Nada de tela antes de deitar", "em": 10.7, "trecho": "Sem tela" } ] },
    { "tipo": "cta", "de": 11.8, "ate": 13.5, "texto": "Salva para lembrar hoje à noite", "destaque": "hoje à noite" }
  ]
}
```

Repare: o rótulo resume o vídeo; cada momento do rótulo lê um campo diferente; o medidor sem número dito leva "ilustrativo"; a pergunta e o fechamento ficam em quadro cheio.
