# O plano de edição (`src/plano.json`), versão deitada (16:9, 1920×1080)

## 0. No quadro deitado (16:9)

Tudo o que está abaixo vale, com estas diferenças (o template faz sozinho; o plano só precisa respeitar os limites):

- **Composição (aula 9 do curso):** no pôster, o texto vai no lado esquerdo (o quadro, ~840 px de largura e ~810 px de altura úteis) e a palavra-janela, com a pessoa dentro, no lado direito (a moldura). Onde este texto diz "acima da janela" e "abaixo da janela", leia "em cima e embaixo, no quadro à esquerda". A janela continua sendo uma palavra do texto, dita com força; ela não precisa mais vir do começo da frase (o rosto não depende da altura dela no texto), mas palavra de 2 a 4 letras continua dando a maior janela.
- **Tamanhos:** os `tamanho` do `cartaz` são os do vertical; o template multiplica por 0,84 e encolhe o que não couber no quadro. Como o quadro é baixo, use no máximo 3 linhas no `topo` + `base` juntos, ou 3 negações com 1 linha de base.
- **Comparação:** os dois lados ficam um em cima do outro no quadro da esquerda (o campo se divide no meio da altura), o "VS" na moldura da direita.
- **Tempo de leitura e respiro (aula 9):** pôster de 2,5 a ~8 s; entre pôsteres, a pessoa em tela cheia de 1 a ~8 s com legenda. O `conferir.mjs` deste modelo pede ≥ 50% de cobertura, trecho só com legenda até ~8 s, um momento a cada ~10 s e nada parado mais de ~6 s. Não cubra cada frase: no vídeo completo, o pôster entra onde a ideia merece parede.
- **Margens:** a legenda fica no terço de baixo; nada importante abaixo de y 984 (controles do player).

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: pôster × quadro cheio
3. A palavra-janela (o coração do estilo)
4. Como o texto do pôster se monta
5. Blocos de pôster: `abertura`, `frase`, `pergunta`, `cta`, `definicao`, `topicos`, `passos`, `comparacao`, `grafico`
6. Blocos de placa (quadro cheio): `numero`, `destaque`
7. A assinatura: `cartaz` e `escalada`
8. O `selo`
9. Regras de tempo e de ritmo
10. Legenda, correções e sons
11. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "sfx": true,
  "correcoes": {}
}
```

- `marca.area` aparece no canto de cima, à direita, de cada pôster (letreiro em caixa-alta, até ~14 caracteres); `nome` e `area` formam a assinatura do `cta` (e do `cartaz` com `fecho`). Nome até ~16 caracteres. Vazios = sem letreiro e sem assinatura. No canto esquerdo cada pôster leva o número dele ("Nº 01", "Nº 02"…).
- `sfx`: `false` desliga os sons.
- `fantasma` (opcional, 0 a 0,08; padrão 0): quanto da pessoa aparece apagada atrás do campo inteiro do pôster. Deixe 0 (campo sólido), salvo pedido do usuário.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. A janela de cada pôster é montada em volta de `rosto`.

## 2. A gramática: pôster × quadro cheio

| Lugar | Blocos | A pessoa | A tela |
|---|---|---|---|
| **Pôster** (tela cheia) | `abertura`, `frase`, `pergunta`, `cta`, `definicao`, `topicos`, `passos`, `comparacao`, `grafico`, `cartaz`, `escalada` | coberta por um campo sólido; aparece em cor **só dentro das letras da palavra-janela** (ou do círculo) | campo `cobalto`, `papel` ou `preto`; texto "a lápis" que ganha tinta palavra por palavra; a palavra-janela gigante |
| **Placa** (quadro cheio) | `numero`, `destaque` (e o `selo`) | inteira, rosto no centro | uma placa de cor na altura do peito, logo abaixo do queixo |
| **Quadro cheio** | trechos sem momento | inteira; o enquadramento troca seco (1 ↔ 1,1) nos cortes e frases novas | legenda grande em caixa-alta abaixo do queixo |

O template cuida sozinho de:
- **Entrada**: pôster que começa num corte (até 0,12 s de um valor de `cortesEm`), no início do vídeo ou colado no anterior entra **seco**. Fora disso, o campo sobe de baixo em 0,22 s, com borda seca.
- **Espera sem vazio**: o pôster entra com tudo "a lápis" (o texto apagado, no lugar e no tamanho certos); cada palavra ganha tinta quando é dita.
- **Saída**: quando o próximo pôster não vem colado, o pôster "mergulha" na janela (cresce em volta do rosto enquanto um círculo abre a partir dele, 0,34 s) e termina na pessoa limpa. Dois pôsteres colados trocam secos (nunca dois textos um sobre o outro).
- **Campos**: alternam sozinhos (cobalto, papel, cobalto…). Use `campo` num bloco só para forçar; `"preto"` é o campo de alerta.
- **Câmera**: dentro dos blocos de pôster, o vídeo aproxima devagar (até 3,5%) dentro das letras.
- **Legenda**: some nos pôsteres e nas placas, volta no quadro cheio.

## 3. A palavra-janela (o coração do estilo)

Em todo bloco de pôster, a pessoa aparece dentro das letras de uma palavra curta e gigante. O rosto fica no meio da **primeira linha** da palavra. Como a pilha do pôster é montada em volta do rosto, **a altura da janela no texto decide tudo**: o que vem antes dela fica acima, o que vem depois fica abaixo.

- Campo `janela` (opcional) nos blocos `abertura`, `frase`, `pergunta`, `cta`, `definicao`, `grafico`, `topicos`, `passos` e `comparacao`:
  - **uma palavra do texto do bloco**, de 2 a 6 letras ou algarismos: `"VOCÊ"`, `"NÃO"`, `"SEM"`, `"500"`, `"HOJE"`. Ela sai do texto e vira a janela, no lugar em que estava na frase. O template quebra em linhas de 2 a 3 letras ("VO/CÊ", "AGO/RA", "PER/DE"); para quebrar diferente, escreva a barra: `"CO/ME/ÇA"`;
  - `""` (vazio): sem palavra; a pessoa aparece num **círculo** de borda seca;
  - sem o campo: o template escolhe sozinho a melhor palavra curta do texto (primeiro as do `destaque`), pesando o tamanho da janela, quanto o vídeo precisa aproximar e o espaço vazio; sem nenhuma palavra curta, usa o círculo.
- **Escolha a palavra para onde a frase aponta, de preferência no começo do texto** (ou no meio, quando há muito texto). Uma janela no fim de um texto longo empurra o rosto para baixo: o vídeo aproxima demais e a pessoa vira um pedaço de rosto nas letras.
- 2 ou 3 letras na primeira linha dão o maior rosto. Palavras de 4 letras sem sílaba boa ("MAIS", "QUER") ficam numa linha só, menor. Palavras com mais de 6 letras não viram janela.
- Nas listas (`topicos`, `passos`) a janela é o **contador** do item da vez ("01", "02"…) e na `comparacao` é **"VS"**; use `janela` só para trocar por uma palavra dita.
- Não repita a mesma palavra-janela em dois pôsteres seguidos.

## 4. Como o texto do pôster se monta

- **Tempo de cada palavra**: o template acha cada palavra escrita na fala a partir do `em` do bloco (ou do item), pelo conteúdo. Escreva as palavras **como foram ditas** (pode cortar palavras e resumir, mas use as palavras da fala): palavra escrita que não foi dita entra logo depois da anterior.
- **Tamanho**: o texto é medido com as larguras da fonte e encaixado no maior corpo que cabe (quebrando em até 2 ou 3 linhas equilibradas). Números com moeda e escala ficam juntos ("R$ 100 MIL", "US$ 83.000", "10%"). Nunca vaza. Mínimos: 56 px nas linhas, 44 px nos detalhes.
- **Hierarquia**: o trecho de `destaque` sai maior (até 150 px) e na cor de acento; o resto do texto, de 60 a 120 px; a palavra-janela é a maior coisa da tela.
- **Limites práticos** (para o pôster respirar):

| Campo | Até |
|---|---|
| `texto` de `abertura`, `frase`, `cta` | ~60 caracteres |
| `texto` de `pergunta` com opções | ~40 caracteres |
| `titulo` (listas, gráfico, comparação) | ~40 caracteres |
| item de `topicos`/`passos` | 2 a 5 palavras (~28 caracteres); `detalhe` até ~30 |
| `rotulo` e `texto` de cada lado da `comparacao` | ~24 e ~30 caracteres |
| `termo` / `significado` da `definicao` | ~20 / ~40 caracteres |
| opção de `pergunta` | ~28 caracteres |
| `texto` de `destaque` (placa) | ~30 caracteres; uma palavra só sai vazada e enorme |

Passou disso, o texto encolhe até o mínimo e a janela fica menor: encurte com as palavras da fala.

## 5. Blocos de pôster

Campos comuns: `tipo`, `de`, `ate`, e os opcionais `campo` (`"cobalto"`, `"papel"`, `"preto"`) e `janela` (seção 3). `legenda: true` não tem efeito nos pôsteres (a legenda nunca fica por cima de um pôster).

### `abertura`: a promessa, a pergunta, o tema

```json
{ "tipo": "abertura", "de": 0.0, "ate": 3.03, "texto": "R$ 500 por mês podem virar R$ 100 mil",
  "destaque": "R$ 100 mil", "janela": "500", "em": 0.1 }
```

- `texto`: a frase, com as palavras da fala. `destaque` (opcional): trecho exato do texto que sai grande e na cor de acento.
- `em` (opcional, também em `frase`, `pergunta` e `cta`): quando o texto começa a ser dito (padrão: `de`). Use quando o momento começa antes da primeira palavra do texto.
- O pôster que começa em `de` 0 já está na tela no primeiro quadro, a lápis.

### `frase`: frase de efeito, opinião, conclusão

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.15, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.95 }
```

- `destaque` (opcional) como na abertura; `risco` (opcional): trecho exato riscado em `riscoEm` (perto do fim da última palavra dele). A janela nunca sai de dentro do `risco`.
- Para um alerta ("tem gente que perde"), use `"campo": "preto"` e o `destaque` na palavra do problema.

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.45, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 },
              { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `opcoes` (opcional): 2 a 4, empilhadas abaixo da pergunta, separadas por "ou"; cada uma ganha tinta no seu `em`. Com opções, escreva a pergunta curta ("Você quer…") e deixe as opções carregarem o resto.

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula agora",
  "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `icone`: `seguir`, `salvar`, `comentar` ou `link` (padrão `link`): vai antes da primeira linha. `destaque`: a ação ("Me segue", "Saiba Mais", "Comenta"). Com `marca.nome`, a assinatura (nome e área sobre um filete) fica embaixo.
- O `cta` que termina perto do fim fica até o último quadro.

### `definicao`: termo explicado

```json
{ "tipo": "definicao", "de": 5.25, "ate": 8.6, "termo": "Bull market", "em": 5.3,
  "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- O termo grande em cima, um "=" na cor de acento (em `significadoEm`) e o significado embaixo. A janela sai, de preferência, do termo ("BULL / MAR·KET").

### `topicos`: lista sem ordem (motivos, erros, dicas, sinais)

```json
{ "tipo": "topicos", "de": 12.0, "ate": 18.0, "titulo": "Três erros",
  "itens": [ { "texto": "Comprar por impulso", "em": 12.4 },
             { "texto": "Escolher sem critério", "em": 14.1, "detalhe": "moeda da moda" },
             { "texto": "Risco que não entende", "em": 16.0 } ] }
```

- 2 a 5 itens. O título (opcional) fica no alto; a janela é o contador "01", que troca seco para "02", "03" no `em` de cada item; os itens ficam abaixo, já a lápis desde o começo, e ganham tinta um a um; o anterior fica num tom mais claro. `detalhe` (opcional) sai menor embaixo do item, na fala logo depois dele.

### `passos`: sequência em ordem (processo, caminho, como fazer)

Mesmos campos de `topicos`. Entre um passo e o próximo, uma seta grossa de acento desce quando o próximo é dito.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 16.6, "ate": 20.7, "modo": "contra",
  "lados": [ { "rotulo": "Quem começa cedo", "texto": "Ganha", "em": 16.64 },
             { "rotulo": "Quem para no meio", "texto": "Perde a melhor parte", "em": 18.39 } ],
  "vencedor": 0, "vencedorEm": 20.1 }
```

- O pôster se divide: o lado 1 no campo de cima, o lado 2 no campo de baixo (a outra cor), a janela "VS" na emenda com o rosto dentro.
- `rotulo`: o nome do lado, menor, em cima do `texto` (que sai grande). O `em` do lado é o da primeira palavra do rótulo (ou do texto, se o rótulo não foi dito).
- `modo`: `contra` (padrão), `antes-depois` (o lado 2 sai na cor de acento) ou `errado-certo` (o lado 1 é riscado quando o lado 2 é dito; o lado 2 na cor de acento).
- `vencedor` (0 ou 1, opcional): o outro lado é riscado em `vencedorEm` (padrão: logo depois do lado vencedor ser dito) e o vencedor sai na cor de acento.

### `grafico`: gráfico chapado

```json
{ "tipo": "grafico", "de": 5.25, "ate": 11.38, "titulo": "Em 10 anos", "forma": "pizza", "unidade": "mil",
  "dados": [ { "rotulo": "Do seu bolso", "valor": 60, "em": 7.15 },
             { "rotulo": "Juros sobre juros", "valor": 40, "em": 9.11 } ] }
```

- `forma`: `barras` (colunas sólidas que sobem e contam; a maior na cor de acento), `linha` (traço grosso de acento que anda de ponto a ponto) ou `pizza` (anel grosso, fatias que se desenham, legenda ao lado).
- `dados`: 2 a 6 números **ditos**, cada um no seu `em`. Cada valor sai com as casas dele, em pt-BR ("6,17", "12"). `unidade` curta (até 4 letras: "%", "mil", "kg") vai colada no valor ("40 MIL", "10%"); mais longa vira letreiro no alto.
- Sem números ditos: troque `dados` por `tendencia` (`"sobe"`, `"cai"` ou `"oscila"`, desenhada a partir de `tendenciaEm`) e ponha `"ilustrativo": true`; a etiqueta ILUSTRATIVO aparece. `barras` vira colunas que crescem ou diminuem; `linha` e `pizza` viram a linha grossa com seta.
- A janela sai do `titulo` (ou use `janela`); sem título, o círculo.

## 6. Blocos de placa (quadro cheio)

A placa entra varrendo da esquerda, na altura do peito, logo abaixo do queixo, com tudo a lápis; sai varrendo para a direita (ou fica por baixo do pôster que entrar no fim dela). A pessoa continua inteira. Campos comuns: `tipo`, `de`, `ate`, `campo` (opcional), `legenda` (opcional; com `true`, a legenda continua e a placa desce para baixo dela).

### `numero`: um número que conta

```json
{ "tipo": "numero", "de": 0.0, "ate": 2.85, "valor": 83000, "em": 1.34,
  "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
```

- `valor` (número puro: 83000, 1.5, 10), `em` (a palavra do número: o "83" de "83 mil"), `rotulo` (letreiro em cima; `rotuloEm` opcional), `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "% ao ano") menores, `casas` (padrão: as do valor), `ilustrativo: true` mostra a etiqueta.
- O número conta de 0 até `valor` em ~1 s, em pt-BR ("83.000", "1,5"); os algarismos grandes são vazados (a pessoa aparece dentro deles); 12 marcas acendem enquanto conta.

### `destaque`: palavra ou frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "chave" }
```

- `nivel`: `chave` (placa cobalto, padrão) ou `alerta` (placa preta, com um traço cobalto que se desenha embaixo do texto). `detalhe` (opcional) sai menor embaixo, em `detalheEm`.
- Uma palavra só sai enorme e vazada ("CUIDADO", "AGORA."); frase mais longa sai em tinta clara, em até 2 linhas.

## 7. A assinatura: `cartaz` e `escalada`

O `conferir.mjs` exige pelo menos um dos dois.

### `cartaz`: o pôster da tese (e das negações)

```json
{ "tipo": "cartaz", "de": 8.6, "ate": 12.85,
  "topo": [ { "em": 8.7, "texto": "O MERCADO SUBINDO", "tamanho": 84 } ],
  "janela": { "em": 9.87, "linhas": ["NÃO"] },
  "negacoes": [ { "em": 10.19, "antes": "SIGNIFICA", "palavra": "DINHEIRO", "riscoEm": 11.5 } ],
  "base": [ { "em": 11.78, "texto": "NO BOLSO", "tamanho": 150 } ] }
```

- `topo` (até 3 linhas) acima da janela, `negacoes` (até 3) e `base` (até 2 linhas) abaixo. Cada linha `{ em, texto, tamanho?, acento? }`: uma linha só (não quebra), que encolhe se não couber na largura do quadro (~840 px no 16:9); o `tamanho` (px do vertical, padrão 96; no 16:9 sai × 0,84) dá a hierarquia. Quantos caracteres cabem: 230 px → 4 · 170 → 6 · 150 → 7 · 120 → 9 · 96 → 11 · 84 → 12 · 72 → 15 · 64 → 17. Não use menos de 56 px. Se sobrar uma faixa vazia embaixo, aumente a `base`.
- `acento: true` pinta a linha na cor de acento (uma por pôster).
- `janela`: aqui é um objeto `{ em, linhas, batidas?, zoom? }`: `linhas` já quebradas (`["VO", "CÊ"]`, `["NÃO"]`), `batidas` = instantes em que a palavra bate de novo (cada "não" de uma lista), `zoom` 1 a 1,4 aproxima o vídeo nas letras.
- `negacoes`: `antes` (o começo da frase, 54 px) e `palavra` (a palavra negada, 150 px), riscada em `riscoEm` (perto do fim da palavra). `em` é a primeira palavra de `antes`; a `palavra` é a que vem logo depois na fala. Para um "não significa dinheiro no bolso", risque a palavra que perde ("DINHEIRO") e ponha o resto na `base`.
- `fecho` (só no último): `{ "icone": "comentar" }` (`comentar`, `salvar`, `seguir`, `enviar`, `link`): ícone antes da primeira linha do `topo`, assinatura embaixo, fica até o fim.

### `escalada`: a frase que cresce

```json
{ "tipo": "escalada", "de": 17.6, "ate": 23.5,
  "degraus": [ { "em": 17.73, "texto": "COMPRA", "nota": "POR IMPULSO.", "notaEm": 18.21 },
               { "em": 19.21, "texto": "ESCOLHE", "nota": "SEM CRITÉRIO.", "notaEm": 20.18, "torto": true } ],
  "final": { "em": 21.75, "antes": "ASSUME", "antesEm": 21.25, "linhas": ["RIS", "CO"] } }
```

- `degraus`: 1 a 3, cada um com `texto` curto (até ~8 caracteres), `nota` (até ~13, menor e na cor de acento) e `notaEm`; `torto: true` entra inclinado (para "torto", "errado", "sem critério"). Cada degrau entra maior que o anterior, que encolhe e vira rastro no topo.
- `final`: a palavra que vira a janela gigante (`linhas` como no cartaz) e, se houver, `antes` (palavra curta em cima: "MAS", "ATÉ QUE", "ASSUME") com `antesEm`.
- A escalada inteira pede ~3 a 6 s.

## 8. O `selo`

```json
{ "tipo": "selo", "de": 14.9, "ate": 18.83,
  "itens": [ { "em": 15.04, "rotulo": "DAQUI A", "texto": "1 ANO" }, { "em": 18.4, "texto": "AGORA.", "acento": true } ],
  "marcas": { "de": 15.3, "ate": 18.2, "quantas": 12 } }
```

Uma placa pequena (640 px) no peito, com a legenda continuando. `itens` 1 a 3 (texto até ~7 caracteres, vazado; `rotulo` até ~16), um trocando o outro no seu `em`; `acento: true` vira a placa para o branco com golpe grave. `marcas` acendem uma a uma (meses, dias). Use num trecho de quadro cheio de 3 s ou mais, com um prazo ou uma palavra que fecha a ideia.

## 9. Regras de tempo e de ritmo

- `de` do pôster: **num valor de `cortesEm`** sempre que houver um corte de 0 a 0,3 s antes da primeira palavra que ele mostra (entra seco). Sem corte por perto: 0,15 a 0,25 s antes da primeira palavra (o campo leva 0,22 s para subir). Nunca antes do `ate` do anterior.
- `ate`: o `em` da primeira palavra que o bloco não mostra (a frase seguinte), ou um valor de `cortesEm` logo antes dela. Para dois pôsteres colados, faça o `de` do segundo igual ao `ate` do primeiro.
- `em` de cada item, lado, opção, dado = o `em` da palavra que o nomeia. Nada aparece antes de ser dito.
- **Duração**: pôster de 2,5 a ~8 s no quadro deitado (tempo de leitura); algo novo entra a cada 2 a 4 s (palavra, janela, risco, item). Se a pessoa fala muito sem nada novo para mostrar, encerre o bloco.
- **Ritmo**: no máximo 2 pôsteres colados seguidos; depois, uma placa ou um respiro de quadro cheio (1 a ~8 s). Não repita a mesma estrutura duas vezes seguidas (duas listas, duas escaladas).
- **Cobertura** (o `conferir.mjs` deste modelo cobra, pelo `modelo.json`): ≥ 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com legenda, um momento a cada ~10 s.

## 10. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`: caixa-alta grande (56 px) na fonte larga, no terço de baixo, em pedaços de uma linha (até ~28 caracteres); a palavra da vez numa tarja de cobalto. Ela só aparece no quadro cheio (e durante o `selo`).

- `semLegenda`: faixas extras sem legenda (`[ { "de": 21.3, "ate": 22.2 } ]`).
- `correcoes`: palavras que a transcrição errou, sem pontuação: `{ "100,00": "100 mil", "chat GPT": "ChatGPT", "né": "" }`. A chave pode ter várias palavras seguidas (viram uma só) e `""` apaga a palavra. Valem para a legenda e para o tempo das palavras dos pôsteres. Não edite `palavras` à mão.
- `node scripts/legendas.mjs` lista as linhas de legenda.

Sons (automáticos, tonais e raros): golpe grave quando cada janela abre (e no `destaque` de alerta e no item de acento do selo), toques em escada nos riscos, nos itens da lista, nas opções, nos dados e nos degraus, um toque quando a placa entra, duas notas suaves no `cta`. Dois sons a menos de 0,25 s viram um só. `"sfx": false` desliga todos.

## 11. Exemplos completos

### O exemplo do modelo (motivacional, 21,6 s)

"Ninguém vai fazer por você. Não é o momento perfeito, não é a ferramenta certa, não é o curso que falta. É você, hoje, com o que tem. Começa pequeno. Começa torto. Mas começa. Daqui a um ano, você vai agradecer a pessoa que decidiu agora. Comenta: eu começo hoje." (cortes em 2,04 · 7,53 · 10,42 · 14,45 · 18,83 · 19,55)

```json
{
  "marca": { "nome": "Tiago", "area": "Mentalidade" },
  "momentos": [
    { "tipo": "cartaz", "de": 0.08, "ate": 2.04,
      "topo": [ { "em": 0.3, "texto": "NINGUÉM", "tamanho": 150 }, { "em": 0.68, "texto": "VAI FAZER POR", "tamanho": 72 } ],
      "janela": { "em": 1.63, "linhas": ["VO", "CÊ"] } },
    { "tipo": "cartaz", "de": 2.04, "ate": 7.62,
      "janela": { "em": 2.13, "linhas": ["NÃO"], "batidas": [4.0, 5.98] },
      "negacoes": [ { "em": 2.45, "antes": "O MOMENTO", "palavra": "PERFEITO", "riscoEm": 3.9 },
                    { "em": 4.47, "antes": "A FERRAMENTA", "palavra": "CERTA", "riscoEm": 5.68 },
                    { "em": 6.36, "antes": "O CURSO QUE", "palavra": "FALTA", "riscoEm": 7.3 } ] },
    { "tipo": "escalada", "de": 10.42, "ate": 14.5,
      "degraus": [ { "em": 10.52, "texto": "COMEÇA", "nota": "PEQUENO.", "notaEm": 10.94 },
                   { "em": 11.94, "texto": "COMEÇA", "nota": "TORTO.", "notaEm": 12.51, "torto": true } ],
      "final": { "em": 13.61, "antes": "MAS", "antesEm": 13.43, "linhas": ["CO", "ME", "ÇA"] } },
    { "tipo": "selo", "de": 14.9, "ate": 18.83,
      "itens": [ { "em": 15.04, "rotulo": "DAQUI A", "texto": "1 ANO" }, { "em": 18.4, "texto": "AGORA.", "acento": true } ],
      "marcas": { "de": 15.3, "ate": 18.2, "quantas": 12 } },
    { "tipo": "cartaz", "de": 18.83, "ate": 21.6, "fecho": { "icone": "comentar" },
      "topo": [ { "em": 18.93, "texto": "COMENTA:", "tamanho": 84 } ],
      "janela": { "em": 19.65, "linhas": ["EU"] },
      "base": [ { "em": 19.73, "texto": "COMEÇO", "tamanho": 170 }, { "em": 20.71, "texto": "HOJE.", "tamanho": 230, "acento": true } ] }
  ]
}
```

### Um vídeo de outro assunto (cripto, 43 s, sem cortes)

"O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0.0, "ate": 2.85, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" },
    { "tipo": "definicao", "de": 5.25, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "cartaz", "de": 8.6, "ate": 12.85,
      "topo": [ { "em": 8.7, "texto": "O MERCADO SUBINDO", "tamanho": 84 } ],
      "janela": { "em": 9.87, "linhas": ["NÃO"] },
      "negacoes": [ { "em": 10.19, "antes": "SIGNIFICA", "palavra": "DINHEIRO", "riscoEm": 11.5 } ],
      "base": [ { "em": 11.78, "texto": "NO BOLSO", "tamanho": 150 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "chave" },
    { "tipo": "frase", "de": 14.9, "ate": 17.6, "texto": "Mesmo na alta, tem gente que perde", "destaque": "perde", "em": 14.93, "campo": "preto" },
    { "tipo": "escalada", "de": 17.6, "ate": 23.5,
      "degraus": [ { "em": 17.73, "texto": "COMPRA", "nota": "POR IMPULSO.", "notaEm": 18.21 },
                   { "em": 19.21, "texto": "ESCOLHE", "nota": "SEM CRITÉRIO.", "notaEm": 20.18, "torto": true } ],
      "final": { "em": 21.75, "antes": "ASSUME", "antesEm": 21.25, "linhas": ["RIS", "CO"] } },
    { "tipo": "pergunta", "de": 24.15, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "destaque", "de": 28.0, "ate": 30.0, "texto": "Aula gratuita", "em": 28.62, "nivel": "chave" },
    { "tipo": "passos", "de": 30.0, "ate": 33.75, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.15, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.95, "em": 33.83 },
    { "tipo": "pergunta", "de": 35.45, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ]
}
```

Repare:
- o número abre na placa, com a pessoa inteira; "e reacendeu a conversa sobre o novo" fica só com legenda (2,4 s de respiro);
- a definição pôs a janela no termo ("BULL / MAR·KET"): o rosto fica no alto, onde já está, e o significado desce;
- o cartaz risca "DINHEIRO" e deixa "NO BOLSO" na base, em letra grande: o pôster fica cheio;
- a frase de alerta usa o campo preto, com "PERDE" grande em cobalto; o template pôs a janela em "GEN·TE", do meio da frase, para o resto ir para baixo;
- a escalada carrega os três motivos e termina com a pessoa dentro de "RIS·CO";
- depois de dois pôsteres colados (passos e frase), um respiro de 0,3 s: a frase sai em círculo e a pergunta sobe;
- nunca mais de 3 pôsteres seguidos sem a pessoa voltar ao quadro cheio (placa ou respiro).
