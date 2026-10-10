# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastro), `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser, `trilha` e `legendaNoDividido`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita (o `ferramentas/timing.mjs` confere: ±0,15 s).

## Sumário

1. Campos gerais
2. A gramática: os layouts e a prancha
3. A assinatura: `anatomia` (rosto e esquema) e o catálogo do rosto
4. Os efeitos próprios: `virada`, `mito`, `corte`, `linhaDoTempo`
5. Os 11 blocos universais
6. Regras de tempo
7. Legenda, sons e trilha
8. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Dr. Rafael Lima", "area": "Dermatologia" },
  "sfx": true,
  "correcoes": { "corrugadô": "corrugador" },
  "trilha": { "arquivo": "trilha.mp3", "volume": 0.12 },
  "legendaNoDividido": "topo"
}
```

- `marca`: `nome` (Sora 700, ≥ 34 px) e `area` vão num crachá clínico branco, embaixo à esquerda, de 0,4 s a 5 s. Sem `nome`, sem crachá.
- `sfx`: `false` desliga os sons.
- `trilha` (opcional): um arquivo do usuário em `public/` (sem batida: piano, pads, cordas). Entra a ~12% com fade. Sem `trilha`, só os sons tonais.
- `legendaNoDividido`: `"topo"` (padrão, como no exemplo: na costura, logo abaixo da borda de cima da moldura, acima da cabeça) ou `"queixo"`.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão (a `zona` não é usada neste modelo). Os `cortesEm` alternam o zoom do quadro cheio (1,00 / 1,12).

## 2. A gramática

| Layout | Quando | O que aparece |
|---|---|---|
| **cheio** | antes da virada; entre pranchas, se a virada trocou a roupa | a pessoa no quadro inteiro, rosto no eixo central. O `mito` aparece no alto sobre uma faixa de papel |
| **consultório** | depois de uma `virada` **sem** vídeo de figurino | papel clínico; a pessoa numa moldura grande (x 44, y 300, 992 × 1556); o `mito` acima dela |
| **dividido** | durante qualquer bloco de prancha (`anatomia`, `corte`, `linhaDoTempo` e os 11 universais) | a prancha em cima (y 0 a 840, área útil x 64 a 1016, y 130 a 800); a pessoa na moldura larga embaixo (x 60, y 840, 960 × 1016, cantos de 44 px) |
| **tela** | `linhaDoTempo` com `telaCheia: true` | a curva na tela inteira; a moldura desce e some (a voz continua) |

- A tela divide no `de` do primeiro bloco de prancha (0,66 s) e volta no `ate` do último. **Pranchas a menos de 1,6 s uma da outra não desfazem a divisão**: encadeie os blocos de uma explicação.
- Um bloco de prancha por vez. A `anatomia` e o `corte` podem se encostar: se o `corte` começa até 0,6 s antes ou depois do fim da `anatomia`, a câmera **mergulha** na região (`corte.regiao`) e a lente do corte abre ali.
- O `mito` e a `virada` não são blocos de prancha: ficam por cima do layout atual.
- A legenda continua por padrão em `virada`, `mito`, `anatomia`, `corte` e `linhaDoTempo` (eles não escrevem a fala) e some nos 11 blocos universais. `"legenda": true/false` troca.

O template faz sozinho: os layouts e as transições, a câmera da prancha, a posição dos rótulos, o encaixe do texto (nunca vaza), a legenda, o rastreio do rosto e os sons.

## 3. A assinatura: `anatomia`

### 3a. O rosto (`parte: "rosto"`, padrão)

```json
{ "tipo": "anatomia", "de": 3.12, "ate": 13.5, "musculosEm": 3.94, "contraiEm": 5.11,
  "origem": { "x": 0.894, "y": 0.245, "tamanho": 0.17 },
  "estruturas": [
    { "id": "frontal", "rotulo": "Frontal", "regiaoEm": 5.83, "em": 6.73, "funcao": "linhas horizontais", "funcaoEm": 7.77 },
    { "id": "corrugador", "rotulo": "Corrugador", "regiaoEm": 9.67, "em": 10.8, "funcao": "o famoso", "funcaoEm": 12.08, "grande": "11", "grandeEm": 12.66 }
  ] }
```

- **Entrada (`de`):** a ilustração sai do ponto `origem` do vídeo (frações do quadro de trabalho: um quadro de anatomia na parede, um modelo na mesa; `tamanho` = altura da cabeça desenhada em fração da largura do quadro) ou, sem `origem`, se desenha no lugar. Gira de 3/4 para frente em ~1,4 s. Comece a `anatomia` na palavra que puxa a explicação ("ele **relaxa**…").
- **`musculosEm`:** a varredura que revela os músculos por baixo da pele (a palavra "músculo"). Padrão: 0,6 s antes da primeira estrutura que é músculo. Só áreas da pele (testa, olheira…) não revelam músculos.
- **`contraiEm`** (opcional): "o músculo que faz a ruga": as estruturas contraem juntas e as rugas aparecem de leve.
- **`estruturas`** (1 a 5): cada uma com:
  - `id` do catálogo (abaixo) e `rotulo` (o nome **que a pessoa disse**, até ~22 caracteres);
  - `regiaoEm` (opcional): a palavra da região dita antes ("na **testa**", "entre as **sobrancelhas**"): a câmera vai até lá (sai 0,35 s antes, chega em 0,7 s), a retícula marca e a estrutura pré-acende;
  - `em`: a palavra que nomeia a estrutura: ela acende (fibras de luz correndo, contorno azul, pulsando) e o rótulo entra;
  - `funcao` + `funcaoEm` (opcional, até ~30 caracteres): o que ela faz, com as palavras da fala; cabe em 1 ou 2 linhas;
  - `grande` + `grandeEm` (opcional, ≤ 4 caracteres): número ou sigla grande em azul, **só se dito** ("11" quando ele diz "onze");
  - `rugas` (padrão `true` quando a estrutura tem rugas no catálogo): as rugas entram no `grandeEm`, senão no `funcaoEm`, senão 0,6 s depois do `em`, e ficam a 42% depois;
  - `lado` (opcional): força o rótulo à `"esquerda"` ou à `"direita"`. Padrão: estruturas do meio do rosto alternam (a primeira à esquerda); as laterais vão à direita.
- Um rótulo por vez: o da estrutura anterior sai quando a câmera parte para a próxima. Deixe **≥ 1,2 s** entre uma estrutura e outra.
- O selo "conteúdo ilustrativo" aparece embaixo à esquerda da prancha (`ilustrativo: false` desliga, só se o usuário pedir).

**Catálogo do rosto** (`id` → o que desenha; as rugas entre parênteses):

| Músculos | Onde | Rugas |
|---|---|---|
| `frontal` | testa (dois ventres verticais) | testa: linhas horizontais |
| `corrugador` | sob a sobrancelha, puxa para o meio | glabela: o "11" |
| `procero` | raiz do nariz | glabela |
| `orbicularOlho` (ou `orbicular`) | anel em volta do olho | pés de galinha |
| `orbicularBoca` | anel em volta da boca | linhas acima do lábio ("código de barras") |
| `zigomaticoMaior`, `zigomaticoMenor` | da maçã do rosto ao canto da boca (sorriso) | sulco nasogeniano |
| `levantadorLabio`, `levantadorAsa` | do olho/nariz ao lábio de cima | sulco (o primeiro) |
| `nasal` | dorso do nariz | — |
| `risorio` | do canto da boca para o lado | — |
| `depressorAngulo` | do canto da boca para baixo | marionete |
| `depressorLabio`, `mentual` | lábio de baixo e queixo | — |
| `masseter` | mandíbula (mastigação, bruxismo) | — |
| `temporal` | têmpora | — |

| Áreas (só a pele) | Onde |
|---|---|
| `testa`, `glabela` (entre as sobrancelhas), `pesDeGalinha` | com as rugas da região |
| `olheira`, `palpebra` | sob e sobre o olho (a olheira ganha o traço azul) |
| `nariz`, `macas` (maçãs do rosto), `bochecha` | — |
| `sulco` (bigode chinês), `labios`, `queixo`, `mandibula` | o sulco e os lábios com marcas |
| `pele` | o rosto inteiro |

Nomes alternativos aceitos: `bigodeChines`/`nasogeniano` → `sulco`, `malar` → `macas`, `boca` → `labios`, `olho` → `orbicularOlho`, `papada` → `queixo`. Estrutura fora da lista: use a área mais próxima ou o esquema.

### 3b. O esquema (`parte: "esquema"`)

Um corpo em traço fino (cápsula 2.5D) dividido em **2 a 6 regiões** empilhadas, uma por estrutura, na ordem do plano (de cima para baixo). Serve para qualquer assunto (o modo ilustrativo: cripto, rotina, carreira) e para partes do corpo fora do rosto (coluna, dente, joelho, intestino).

```json
{ "tipo": "anatomia", "parte": "esquema", "de": 14.9, "ate": 23.9, "titulo": "gente que perde", "tituloEm": 16.21,
  "estruturas": [
    { "id": "compra", "rotulo": "Compra", "em": 17.73, "funcao": "por impulso", "funcaoEm": 18.21 },
    { "id": "moeda", "rotulo": "Moeda", "em": 19.78, "funcao": "sem critério", "funcaoEm": 20.18 },
    { "id": "risco", "rotulo": "Risco", "em": 21.75, "funcao": "que não entende", "funcaoEm": 22.16 }
  ] }
```

- `titulo` (opcional, **só se dito**): o nome do que está sendo dissecado, em caixa alta no alto da prancha.
- Cada região: `id` livre, `rotulo` (até ~18 caracteres, quebra em 2 linhas), `em`, `funcao`/`funcaoEm`, `grande`/`grandeEm`, `regiaoEm`, `lado` como no rosto, e `material` (a textura): `neutro` (padrão, traço azul-tinta), `musculo`, `osso`, `disco`, `nervo`, `pele`, `derme`, `gordura`, `tendao`, `esmalte`, `dentina`, `polpa`, `gengiva`.
- Os rótulos **ficam** (a prancha se completa): alternam esquerda/direita na altura da região; o atual fica forte, os anteriores a 62%. Um pulso de luz corre pelo eixo central até a região dita.

## 4. Os efeitos próprios

### `virada`

```json
{ "tipo": "virada", "de": 0, "ate": 1.75, "texto": "E se eu fosse", "nome": "MÉDICO", "em": 0, "nomeEm": 0.66,
  "trocaEm": 1.13, "video": "virada.mp4", "videoDe": 1.1 }
```

- `texto` (pequeno, até ~30 caracteres) entra em `em`; `nome` (grande, até ~14 caracteres, em caixa alta) entra letra a letra em `nomeEm`, acima da cabeça (y ~330).
- `trocaEm` (padrão `ate` − 0,6): a linha de luz desce em 0,6 s e a pergunta some. Ponha na palavra seguinte à profissão (a primeira da explicação) ou no corte.
- `video` (opcional): a gravação com a roupa trocada (SKILL.md, passo 5b), mudo; `videoDe` = segundo do vídeo de trabalho em que ele começa (≤ `trocaEm`). Sem `video`, a linha de luz leva a pessoa para a moldura do consultório.
- Um `virada` por vídeo, no começo.

### `mito`

```json
{ "tipo": "mito", "de": 1.04, "ate": 5.9, "sujeito": "Botox", "sujeitoEm": 1.24, "naoEm": 1.96, "errado": "preenche", "erradoEm": 2.16,
  "riscoEm": 2.6, "certo": "relaxa", "certoEm": 3.32, "complemento": "o músculo", "complementoEm": 3.94, "objeto": "seringa" }
```

- O cabeçalho "Sujeito ≠ [ERRADO]": o `errado` (até ~16 caracteres) numa seringa de traço fino (`objeto: "seringa"`, para injetáveis) ou numa etiqueta (padrão); o ≠ entra no `naoEm`, o risco no `riscoEm`; no `certoEm` o errado sai e entra "Sujeito **certo** complemento" (o certo em azul). Tudo cabe numa linha (encolhe junto se precisar).
- `de` ~0,2 s antes do sujeito; `ate` quando a explicação seguinte já está na tela (sai em 0,38 s). Pode durar por cima do começo de uma `anatomia` (fica no alto da prancha, acima dos rótulos).

### `corte`

```json
{ "tipo": "corte", "de": 14.98, "ate": 20.3, "regiao": "frontal",
  "camadas": [
    { "material": "pele", "rotulo": "Pele", "estado": "com ruga", "novoEstado": "lisa", "novoEstadoEm": 19.6 },
    { "material": "gordura" },
    { "material": "musculo", "rotulo": "Músculo", "estado": "contraído", "novoEstado": "descansa", "novoEstadoEm": 18.9 }
  ],
  "vinco": { "alisaEm": 19.6 },
  "sinal": { "rotulo": "Nervo", "em": 16.9 },
  "agente": { "rotulo": "Toxina", "em": 15.4, "efeito": "bloqueia o sinal", "efeitoEm": 15.9 },
  "relaxaEm": 18.9 }
```

- Um bloco 3D de tecido abre numa lente (do centro da prancha, ou mergulhando da `anatomia` anterior) e se alarga. **2 a 5 camadas**, de cima para baixo, com `material` (lista do esquema), `rotulo` (até ~10 caracteres), `estado` → `novoEstado` (em azul, no `novoEstadoEm`) e `em` (quando o rótulo entra).
- `vinco`: a superfície tem uma ruga que alisa no `alisaEm`. `relaxaEm`: o músculo relaxa (fibras finas).
- `sinal`: o nervo no fundo, com pulsos de luz que contraem o músculo (padrão: um ao abrir, outros a cada 1,6 s); `bloqueioEm` = a partir de quando os pulsos param na junção (padrão: o `efeitoEm` do agente).
- `agente`: a agulha entra, as moléculas se prendem na junção e viram barreira no `efeitoEm`.
- `etiqueta`: o canto de cima (padrão "corte ampliado"; no modo ilustrativo, "ilustrativo").
- Dente: `esmalte`, `dentina`, `polpa` (+ `gengiva`, `osso`). Coluna: `osso`, `disco`, `osso` + `sinal`. Pele e gordura (nutrição): `pele`, `gordura`, `musculo`. Outros assuntos: camadas `neutro` (alternam o tom e a hachura).

### `linhaDoTempo`

```json
{ "tipo": "linhaDoTempo", "de": 20.4, "ate": 26.6, "titulo": "efeito do botox", "curva": "sobe-e-cai",
  "marcos": [
    { "quando": "3 dias", "em": 21.6, "texto": "começa a agir", "textoEm": 20.6, "valor": "3", "prefixo": "dia" },
    { "quando": "3 meses", "em": 24.0, "texto": "dura", "valor": "3–4", "sufixo": "meses", "valorEm": 24.3 }
  ] }
```

- **2 a 5 marcos** no eixo (`quando` = rótulo do eixo, até ~12 caracteres), espaçados por igual ou em `posicao` (0 a 1). A curva corre até cada marco no `em` dele.
- Marcos com `valor` viram números-herói em cima (no máximo 2; até ~4 caracteres; `prefixo`/`sufixo` pequenos; `texto` acima). Marcos sem `valor` com `texto` ganham uma anotação perto do ponto.
- `curva`: `sobe-e-cai` (efeito que começa, chega no máximo e passa — padrão), `sobe`, `cai`, `estavel`.
- `telaCheia: true`: ocupa a tela inteira (a pessoa sai; use quando a pessoa fica fora de quadro ou o trecho é longo). `ilustrativo: true` mostra o selo.
- Só números ditos: "começa em três dias e dura três a quatro meses" → dois heróis; não invente "efeito máximo em 2 semanas" se não foi dito.

## 5. Os 11 blocos universais

Campos exatos (iguais em todos os modelos do pack). Aparecem na prancha, com a pessoa embaixo.

| `tipo` | Campos | Limites e dicas |
|---|---|---|
| `abertura` | `texto`, `destaque?`, `em?` | até ~60 caracteres; `destaque` = trecho exato em azul |
| `topicos` | `titulo?`, `itens[{texto, em, detalhe?}]` | 2 a 5 itens, até ~34 caracteres cada; `detalhe` até ~40 |
| `passos` | `titulo?`, `itens[{texto, em, detalhe?}]` | 2 a 5, em ordem; o pulso corre até o passo dito |
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | pt-BR ("83 mil": `valor` 83, `sufixo` " mil"; R$/US$ no `prefixo`) |
| `comparacao` | `titulo?`, `modo?`, `lados[2]{rotulo, texto, em}`, `vencedor?`, `vencedorEm?` | `texto` até ~60 caracteres por lado |
| `grafico` | `titulo?`, `forma`, `dados?[{rotulo, valor, em}]`, `tendencia?`, `tendenciaEm?`, `unidade?`, `ilustrativo?` | 2 a 6 dados ditos; sem dados, `tendencia` + `ilustrativo: true` |
| `destaque` | `texto`, `em`, `nivel?`, `detalhe?`, `detalheEm?` | até ~40 caracteres; `alerta` em vermelho clínico |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | termo até ~24, significado até ~110 |
| `frase` | `texto`, `destaque?`, `risco?`, `riscoEm?`, `em?` | até ~110 caracteres |
| `pergunta` | `texto`, `opcoes?[{texto, em}]`, `em?` | 2 a 4 opções de até ~30 caracteres |
| `cta` | `texto`, `icone?`, `destaque?`, `em?` | `icone`: `salvar` (padrão), `seguir`, `comentar`, `link` |

## 6. Regras de tempo

- `de` de cada bloco ~0,1 a 0,3 s antes da primeira palavra dele; `ate` no começo do próximo (ou 0,3 s depois da última palavra).
- Todo `em`/`…Em` = o `em` da palavra que nomeia a coisa (±0,15 s). O `timing.mjs` confere.
- Nada parado > 2,5 s sem algo novo: numa explicação longa, ponha mais estruturas, a função, o número, ou divida em dois blocos.
- A conferência exige: ≥ 70% do vídeo com bloco na tela, nenhum vão > 3,5 s, um bloco a cada 8 s, 3 ou 4 tipos diferentes, a assinatura `anatomia` e (vídeos > 20 s) pelo menos 2 efeitos próprios.

## 7. Legenda, sons e trilha

- Legenda: Sora 800 toda branca, contorno preto e leve sombra, até 3 palavras (~18 caracteres) por vez, cada palavra sobe quando é dita. Quadro cheio: abaixo do queixo. Tela dividida: na costura (y ~930). Some nos 11 blocos universais (eles escrevem a fala).
- Sons (automáticos, tonais e baixos): cristal na virada, sopro quando a tela divide, um tom por estrutura citada, mergulho e trava no corte, sopro de descanso no `relaxaEm`, subida na linha do tempo, um tom nos números e destaques.
- `trilha`: só se o usuário der o arquivo. Nada com batida.

## 8. O exemplo completo (o médico, 13 s)

```json
"momentos": [
  { "tipo": "virada", "de": 0, "ate": 1.75, "texto": "E se eu fosse", "nome": "MÉDICO", "em": 0, "nomeEm": 0.66, "trocaEm": 1.13, "video": "virada/base.mp4", "videoDe": 0 },
  { "tipo": "mito", "de": 1.04, "ate": 5.9, "sujeito": "Botox", "sujeitoEm": 1.24, "naoEm": 1.96, "errado": "preenche", "erradoEm": 2.16, "riscoEm": 2.6, "certo": "relaxa", "certoEm": 3.32, "complemento": "o músculo", "complementoEm": 3.94, "objeto": "seringa" },
  { "tipo": "anatomia", "de": 3.12, "ate": 13.5, "origem": { "x": 0.8944, "y": 0.2448, "tamanho": 0.1685 }, "musculosEm": 3.94, "contraiEm": 5.107,
    "estruturas": [
      { "id": "frontal", "rotulo": "Frontal", "regiaoEm": 5.827, "em": 6.727, "funcao": "linhas horizontais", "funcaoEm": 7.767 },
      { "id": "corrugador", "rotulo": "Corrugador", "regiaoEm": 9.667, "em": 10.8, "funcao": "o famoso", "funcaoEm": 12.08, "grande": "11", "grandeEm": 12.66 }
    ] }
]
```

Fala: "E se eu fosse médico? Botox não preenche ruga, ele relaxa o músculo que faz a ruga. Na testa, o frontal faz as linhas horizontais. Entre as sobrancelhas, o corrugador faz o famoso onze." Continuando a mesma fala, o orbicular entraria como terceira estrutura ("no canto do olho, o orbicular faz o pé de galinha"), o `corte` mergulharia na testa ("a toxina bloqueia o sinal do nervo, o músculo descansa e a pele alisa") e a `linhaDoTempo` fecharia ("começa a agir em três dias e dura de três a quatro meses").
