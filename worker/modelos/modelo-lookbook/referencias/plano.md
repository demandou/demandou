# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o `rastro`), `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `cabecalho`, `momentos`, `semLegenda` e `correcoes` (e, quando usa pinos na roupa, `pontos` e `zoomLado`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em`/`…Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. Layouts: onde a foto da pessoa fica
3. Regras de tempo
4. Os 11 blocos universais
5. A assinatura: `peca` e `colagem` (e a `capa`)
6. Pontos do corpo (só para pinos na roupa)
7. Tecidos e cores
8. Legenda e correções
9. Exemplos completos (cripto e moda)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "cabecalho": "Guia cripto",
  "sfx": true,
  "correcoes": { "DOSI": "Doze." }
}
```

- `marca`: a assinatura da etiqueta final (nome em itálico + área em caixa alta índigo). A `area` também aparece no cabeçalho, à direita, fora das páginas numeradas. `nome` vazio = sem nome.
- `cabecalho`: o texto fixo do canto esquerdo de cima, em caixa alta espaçada: o nome da "revista". Use o tema do vídeo em 1 a 3 palavras, até ~16 caracteres ("Guia cripto", "Conta de cabeça", "Diário do sono"). Sem ele, aparece "Lookbook".
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`, `palavras`: do `cortar.mjs`. Não mexa à mão.

## 2. Layouts: onde a foto da pessoa fica

A pessoa é a foto da página. Cada momento põe a foto num lugar; a troca desliza em 0,6 s, começando no corte mais próximo. O conteúdo "de papel" fica embaixo da foto (ela cobre como cortina o que sai e revela o que entra); cartões, pinos e a etiqueta ficam por cima.

| Layout | A foto | A página | Blocos |
|---|---|---|---|
| `capa` | emoldurada pelo papel, de 500 px para baixo | a manchete (ou o número) na faixa de cima | `abertura`, `capa`; `numero` quando é o primeiro momento |
| `direita` / `esquerda` | 680 px de largura, do cabeçalho até 1700 px, de um lado | a coluna de papel do outro lado (numeral, nome, marca da página) e o cartão, que avança sobre a foto **abaixo do queixo** e assenta na base (1572 px) | `peca`, `destaque`, `frase`, `pergunta` |
| `topo` / `baixo` | retrato largo (780 px; até 920 px numa gravação perto da câmera) em cima ou embaixo | a página larga no resto da tela | `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao` |
| `colagem` | impressão girada com borda branca | recortes em volta e o título embaixo | `colagem` |
| `cheio` | quadro inteiro, abaixo do cabeçalho | a etiqueta embaixo | `cta` |

- **A troca é automática:** páginas laterais alternam direita ↔ esquerda (a pessoa cruza a página); páginas largas alternam topo ↔ baixo e nunca repetem o lugar do momento anterior. Para escolher, escreva `"layout"` no momento (`"direita"`/`"esquerda"` nos laterais, `"topo"`/`"baixo"` nos largos; a `peca` aceita também `"topo"` e `"cheio"`).
- Entre dois momentos com respiro de mais de 0,3 s, a foto volta ao quadro cheio e a legenda aparece. Momentos colados (o `ate` de um é o `de` do outro) trocam de página direto: é o ritmo do modelo.
- Alterne os dois tipos de página: duas ou três laterais seguidas, depois uma larga.

## 3. Regras de tempo

- `de`: o `em` da primeira palavra que o momento cobre, menos ~0,05 (numa `peca` numerada, a palavra do número: "Um", "Dois", "Primeiro"). Nunca antes do `ate` do momento anterior.
- `ate`: o `de` do momento seguinte (páginas coladas), ou o fim do vídeo.
- Cada coisa dentro do momento entra no `em` da palavra dela; nada aparece em tinta antes de ser dito (a lápis, sim: é a espera do modelo). O template nunca mostra um item antes de ~0,3 s depois do `de` (a página precisa abrir).
- Entre duas entradas, no máximo ~2,5 s. Momento com mais de ~4 s precisa de itens entrando por dentro dele.
- Página: entre 1,5 e 6 s. Menos de ~1,4 s a foto mal assenta.
- `abertura`, `frase`, `pergunta`, `cta` (e `capa`, `colagem`) aceitam `em`: quando o texto começa a ser dito, se o momento começa antes dele.

## 4. Os 11 blocos universais

Campos comuns: `tipo`, `de`, `ate`, `legenda?` (true = a legenda continua durante o momento; quase nunca). Os limites de texto existem porque o template mede e encolhe o texto para caber: passou do limite, fica pequeno no celular. Se a ideia não cabe, resuma com as palavras da fala.

### `abertura` — capa de revista (layout `capa`)

```json
{ "tipo": "abertura", "de": 0, "ate": 3.8, "texto": "Quer calcular 15% de cabeça?", "destaque": "de cabeça?", "em": 0.13 }
```

- `texto`: a frase de abertura com as palavras ditas, na ordem (o template procura cada palavra na fala para ela ganhar tinta na hora). **Até ~60 caracteres.** O template escolhe as linhas: a primeira (1 a 4 palavras) grande, o resto em até 2 linhas médias.
- `destaque` (opcional): trecho exato em itálico índigo, com sublinhado que se desenha.
- `rotulo` (opcional): o texto do cabeçalho à direita durante a capa.
- O título fica inteiro a lápis desde o primeiro quadro. Para escolher as linhas à mão, use `capa` (seção 5).

### `topicos` — o cartão de catálogo (página larga)

```json
{ "tipo": "topicos", "de": 24.15, "ate": 28.0, "titulo": "Agora, como…",
  "itens": [ { "texto": "Avaliar os projetos", "em": 24.95 }, { "texto": "Pensar no seu posicionamento", "em": 26.47, "detalhe": "antes de comprar" } ] }
```

- 2 a 5 itens sem ordem (motivos, dicas, sinais). `texto` **até ~32 caracteres** (2 linhas no máximo); `detalhe` (opcional) **até ~45**, em sans menor.
- `titulo` (opcional, **até ~40**): itálico grande acima do cartão.
- Cada linha espera tracejada e ganha tinta no `em`; um traço índigo anda até o item da vez. O corpo cresce (até 76 px) para o cartão ocupar a página; com 5 itens e detalhes ele desce até ~44 px.

### `passos` — a fita métrica (página larga)

```json
{ "tipo": "passos", "de": 28.0, "ate": 33.7, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.91 }, { "texto": "Os riscos", "em": 31.86 }, { "texto": "A escolha dos ativos", "em": 32.29 } ] }
```

- 2 a 5 itens **em ordem**. Mesmos limites de `topicos`. A fita se desenrola até o passo dito e um pino numerado crava nela, com a linha fina até o nome.

### `numero` — o numeral índigo com a fita métrica (página larga ou capa)

```json
{ "tipo": "numero", "de": 0, "ate": 3.75, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
```

- `valor`: o número dito (o template formata em pt-BR: 83.000; 1,5). `casas`: casas decimais (`2` para "R$ 80,00"). `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "kg", "dias") ficam menores.
- `rotulo`: **até ~30 caracteres**, caixa alta em cima. `rotuloEm` (opcional): quando entra.
- O número conta a partir de `em` (termina antes de a página sair); a fita vai de 0 a um teto redondo (83.000 → 100.000) e o pino corre até a medida. `ilustrativo: true` mostra a etiqueta.
- Primeiro momento do vídeo: vira a manchete da capa, acima da foto. Para forçar, `"layout": "capa"`.

### `comparacao` — dois cartões com amostra (página larga)

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "não significa dinheiro", "em": 10.19 } ] }
```

- `modo`: `contra` (× no meio), `antes-depois` (seta), `errado-certo` (seta; o errado é riscado em vinho e o certo ganha o índigo).
- `rotulo` **até ~22 caracteres** (caixa alta, até 2 linhas); `texto` **até ~40** (até 3 linhas).
- `vencedor` (0 ou 1, opcional) e `vencedorEm`: o lado que vence ganha o jeans índigo, o sublinhado e o pino. Sem `vencedorEm`, ~0,45 s depois do segundo lado.
- `titulo` (opcional) em itálico acima.

### `grafico` — tecido, traço fino e pinos (página larga)

```json
{ "tipo": "grafico", "de": 10.75, "ate": 12.6, "titulo": "Soma os dois", "forma": "barras", "unidade": "R$",
  "dados": [ { "rotulo": "10%", "valor": 8, "em": 11.01 }, { "rotulo": "5%", "valor": 4, "em": 11.22 }, { "rotulo": "15%", "valor": 12, "em": 11.99 } ] }
```

- `forma`: `barras` (tiras de tecido que se estendem; a maior em jeans), `linha` (traço com um pino por ponto; até 6), `pizza` (amostra redonda em fatias; os valores viram proporções).
- `dados`: **2 a 6 números ditos**, cada um no seu `em`; `rotulo` **até ~12 caracteres**. `unidade`: "%", "R$", "US$", "kg", "mil"… (vai junto do valor).
- **Sem números ditos:** `tendencia` (`sobe`, `cai`, `oscila`), `tendenciaEm` e `"ilustrativo": true`. O traço desenha a curva com o papel cru embaixo e um pino na ponta (com `forma: "barras"`, cinco tiras crescem seguindo a tendência). A etiqueta "ILUSTRATIVO" fica no alto.
- `titulo` (opcional) **até ~36 caracteres**.

### `destaque` — o pino e o cartão (página lateral)

```json
{ "tipo": "destaque", "de": 12.85, "ate": 17.6, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta",
  "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 15.48 }
```

- `texto`: **até ~40 caracteres**, itálico grande (até 3 linhas). `nivel`: `alerta` (vinho, "!" no pino) ou `chave` (índigo, padrão).
- `detalhe` (opcional, **até ~60**) e `detalheEm`: sans menor embaixo.

### `definicao` — termo, pino e significado (página larga)

```json
{ "tipo": "definicao", "de": 3.75, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` **até ~24 caracteres** (itálico grande, a lápis desde a abertura da página; cada palavra ganha tinta quando é dita). `significado` **até ~70** (até 3 linhas no cartão). Serve também para igualdades ditas ("15% de 80" → "R$ 12,00").

### `frase` — aspas e cartão (página lateral)

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.03 }
```

- `texto`: **até ~90 caracteres**, com as palavras da fala; chega a lápis e cada palavra ganha tinta quando é dita. `destaque` (opcional): trecho em itálico índigo sublinhado. `risco` (opcional) e `riscoEm`: trecho riscado em vinho. `rotulo` (opcional): caixa alta índigo em cima.

### `pergunta` — "?" e etiquetas (página lateral)

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o patrimônio", "em": 37.98 } ] }
```

- `texto` **até ~70 caracteres**. `opcoes` (opcional): **2 a 4**, cada uma **até ~40 caracteres**, entram como etiquetas de roupa no seu `em` (duas curtas ficam lado a lado; senão, uma embaixo da outra).

### `cta` — a etiqueta de roupa (quadro cheio)

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: **até ~45 caracteres** (até 3 linhas; a etiqueta alarga para textos longos). Cada palavra ganha tinta quando é dita; o `destaque` fica junto numa linha, em itálico índigo sublinhado.
- `icone`: `salvar`, `seguir`, `comentar` ou `link`.
- `detalhe` (opcional, **até ~30**) e `detalheEm`; a assinatura (`marca`) entra em `assinaturaEm` (padrão: 0,5 s depois).
- `ponto` (opcional, padrão `gola`): onde o cordão prende; se o ponto não aparece na foto (gravação perto da câmera), a etiqueta fica sem cordão.
- `textoEm` (nome antigo de `em`): a chamada sobe inteira de uma vez, em vez de palavra por palavra.
- Se for o último momento, fica até o fim do vídeo.

## 5. A assinatura: `peca` e `colagem` (e a `capa`)

### `peca` — a página de catálogo (lateral, alternando; ou `topo`)

Um item de uma série: uma peça de roupa, um motivo, um passo de uma conta, um hábito, um capítulo de uma história.

```json
{ "tipo": "peca", "de": 5.2, "ate": 8.2, "numero": 1, "rotulo": "passo",
  "nome": "10%", "nomeEm": 5.26, "complemento": "andar a vírgula", "complementoEm": 6.41,
  "atributos": [ { "rotulo": "Resultado", "valor": "R$ 8", "em": 7.66 } ] }
```

- `numero` (opcional): 1, 2, 3… quando a fala numera ou enumera. `total`: o "de 03" (padrão: quantas `peca` o plano tem). `rotulo` (opcional): caixa alta acima do numeral ("peça", "motivo", "passo", "hábito", "capítulo"); sem ele, só o numeral.
- `nome` (**até ~16 caracteres**, até 2 linhas) e `complemento` (**até ~30**, itálico, até 3 linhas), com as palavras da fala; `nomeEm`, `complementoEm` (o complemento pode vir antes do nome, se for dito antes).
- `atributos` (opcional, **até 3**): as linhas do cartão — `rotulo` livre em caixa alta (**até ~16**) e `valor` dito (**até ~24**, quebra em 2 linhas). Cartão só com 1 ou 2 linhas mostra o valor grande.
- **Sem nada para o cartão** (só nome e complemento): na página lateral, o nome e o complemento vão grandes num cartão abaixo do queixo, e a coluna fica com o numeral.
- **Itens que a pessoa veste ou usa** (o uso original, moda e produto):
  - `ponto`: onde o pino encosta no corpo (seção 6); `pontoEm` (padrão: `nomeEm`). Sem `ponto`, sem pino.
  - `amostra`: `{ "cor": "branco", "tecido": "algodao", "em": 4.31 }` (seção 7): o pano se estende no `em`.
  - `variantes`: `{ "rotulo": "Pulseira", "em": 11.96, "conector": "ou", "itens": [ { "nome": "couro", "cor": "couro", "tecido": "couro", "em": 12.35 }, { "nome": "metal", "cor": "metal", "tecido": "metal", "em": 12.83 } ] }` — 2 itens de até ~7 caracteres.
  - `combina`: `{ "rotulo": "Combina com", "em": 8.92, "ate": 9.7, "cores": ["branco", "preto", "marinho"] }` — 3 a 5 cores.
  - `medida`: `{ "de": "pescoco", "ate": "ombroEsq", "em": 5.79, "texto": "no ombro" }` — linha de alfaiate entre dois pontos.
  - `detalhe` (só com `"layout": "topo"`): `{ "ponto": "pulsoDir", "em": 10.69, "zoom": 2.1, "rotulo": "detalhe · pulso" }` — recorte aproximado do próprio vídeo (relógio, botão, trama). `zoom` 1,8 a 3.
  - `preco`: `{ "valor": "R$ 189", "em": 5.1 }`, só se foi dito.
- Página entre 1,5 e 6 s. Três ou mais `peca` seguidas são o ritmo do catálogo (o `conferir` só avisa).

### `colagem` — o conjunto montado

```json
{ "tipo": "colagem", "de": 28.0, "ate": 33.75, "subtitulo": "Eu gravei uma aula gratuita", "titulo": "como eu analiso", "enfase": "analiso", "folio": "aula gratuita",
  "itens": [ { "nome": "O mercado", "em": 30.91 }, { "nome": "Os riscos", "em": 31.86 }, { "nome": "A escolha dos ativos", "em": 32.29 } ] }
```

- `itens`: 2 a 4. `peca`: o `numero` de uma `peca` anterior (reaproveita a amostra, o recorte de detalhe ou o nome). Item novo: `nome` (**até ~24 caracteres**); com `cor`/`tecido` vira amostra, sem eles vira um recorte com o nome escrito. Cada um no seu `em` (para peças já mostradas, espaçadas ~0,2 s a partir da palavra que as retoma: "essas três").
- `subtitulo` (opcional, **até ~30**) e `titulo` (**até ~20**; mais longo, quebra em 2 linhas menores): palavras da fala, na ordem, montadas palavra por palavra. `enfase`: trecho do título em itálico índigo sublinhado. `em` (opcional): quando o subtítulo começa a ser dito.
- `folio` (opcional): o texto do cabeçalho à direita durante a colagem (ex.: "o look", "a aula").

### `capa` — a abertura com as linhas à mão

```json
{ "tipo": "capa", "de": 0, "ate": 2.83, "linhas": ["3 peças", "pra se vestir melhor", "sem esforço"], "enfase": "sem esforço" }
```

- `linhas`: 2 ou 3, palavras da fala na ordem; a primeira grande (**até ~12 caracteres**), as outras **até ~24**. `enfase`: como o `destaque` da `abertura`. `rotulo`: o cabeçalho à direita.

## 6. Pontos do corpo (só para pinos na roupa)

Pinos, medidas, o cordão da etiqueta e o recorte de detalhe apontam para **pontos do corpo**, em frações do vídeo da pessoa (0 = esquerda/topo, 1 = direita/base). "Esq" e "Dir" são os lados da **imagem**. Os padrões servem para uma pessoa sentada, do peito para cima; eles andam e se afastam junto com o rosto (rosto maior, numa gravação perto da câmera, afasta os pontos).

| Ponto | Onde fica (pessoa padrão) | x | y |
|---|---|---|---|
| `gola` | ponta da gola (lado esquerdo da imagem) | 0,405 | 0,515 |
| `pescoco` | base do pescoço | 0,50 | 0,485 |
| `peito` | carcela da camisa | 0,507 | 0,62 |
| `camisa` | tecido da camisa, mais embaixo | 0,47 | 0,73 |
| `ombroEsq` / `ombroDir` | ponta do ombro | 0,12 / 0,885 | 0,485 |
| `lapelaEsq` / `lapelaDir` | lapela ou frente da jaqueta | 0,33 / 0,665 | 0,57 |
| `jaquetaEsq` / `jaquetaDir` | peito da jaqueta, perto do ombro | 0,21 / 0,79 | 0,50 |
| `pulsoEsq` / `pulsoDir` | pulso — só para `detalhe` | 0,27 / 0,76 | 0,86 / 0,85 |
| `cintura` | cintura (cinto) | 0,50 | 0,82 |

Para corrigir ou criar um ponto, leia a posição na grade dos quadros de guias e escreva em `pontos` (vale exatamente como está): `"pontos": { "jaquetaDir": { "x": 0.80, "y": 0.52 }, "bolso": { "x": 0.70, "y": 0.66 } }`. Em qualquer campo de ponto também vale `{ "x": 0.7, "y": 0.66 }`. Nunca ponha pino em mão, pulso ou algo que a pessoa segura; prefira peito e ombros. O pino só aparece se cair dentro da foto. `zoomLado` (padrão 1): aproxima a foto das páginas laterais quando a pessoa está longe da câmera (1,15 a 1,25).

## 7. Tecidos e cores

`tecido`: `liso`, `algodao`, `linho`, `sarja`, `jeans`, `malha`, `la`, `seda`, `couro`, `metal`. `cor`: `branco`, `offwhite`, `creme`, `bege`, `areia`, `pedra`, `neutro`, `caqui`, `caramelo`, `couro`, `marrom`, `cinza`, `grafite`, `preto`, `marinho`, `jeans`, `azul`, `oliva`, `verde`, `vinho`, `vermelho`, `rosa`, `metal`, `prata`, `dourado` — ou `"#RRGGBB"`. Nos blocos universais (comparação, barras, pizza) as amostras vêm sozinhas da cartela neutra do modelo, com o jeans índigo para o que vence ou o maior: você não escolhe cor.

## 8. Legenda e correções

A legenda (uma tira de papel com a linha falada, cada palavra passando de lápis para tinta) aparece só **fora dos momentos**: nas páginas, a tela já mostra o que é dito. `semLegenda` esconde faixas extras: `[ { "de": 6.5, "ate": 7.1 } ]`.

Palavras que a transcrição errou vão em `correcoes`: `{ "DOSI": "Doze.", "Jaquet tem": "Jaqueta em", "Tchau": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. As correções valem para a legenda **e** para a busca das palavras dos títulos (capa, abertura, colagem, frase, pergunta, cta, definição). Não edite `palavras` à mão. Para ver as linhas de legenda: `node scripts/legendas.mjs`.

## 9. Exemplos completos

### Cripto (assunto fora da moda, 43 s)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "cabecalho": "Guia cripto",
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 3.75, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" },
    { "tipo": "definicao", "de": 3.75, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "não significa dinheiro", "em": 10.19 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 17.6, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta", "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 15.48 },
    { "tipo": "peca", "de": 17.6, "ate": 19.15, "numero": 1, "rotulo": "motivo", "nome": "Compra", "nomeEm": 17.73, "complemento": "por impulso", "complementoEm": 18.21 },
    { "tipo": "peca", "de": 19.15, "ate": 21.2, "numero": 2, "rotulo": "motivo", "nome": "Moeda", "nomeEm": 19.78, "complemento": "sem critério", "complementoEm": 20.18 },
    { "tipo": "peca", "de": 21.2, "ate": 24.15, "numero": 3, "rotulo": "motivo", "nome": "Risco", "nomeEm": 21.75, "complemento": "que não entende", "complementoEm": 22.16 },
    { "tipo": "topicos", "de": 24.15, "ate": 28.0, "titulo": "Agora, como…",
      "itens": [ { "texto": "Avaliar os projetos", "em": 24.95 }, { "texto": "Pensar no seu posicionamento", "em": 26.47 } ] },
    { "tipo": "colagem", "de": 28.0, "ate": 33.75, "subtitulo": "Eu gravei uma aula gratuita", "titulo": "como eu analiso", "enfase": "analiso", "folio": "aula gratuita",
      "itens": [ { "nome": "O mercado", "em": 30.91 }, { "nome": "Os riscos", "em": 31.86 }, { "nome": "A escolha dos ativos", "em": 32.29 } ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.03 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o patrimônio", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

Os layouts saem sozinhos: capa (o número) → topo → baixo → direita → esquerda → direita → esquerda → topo → colagem → direita → esquerda → cheio.

### Moda masculina (o demo do modelo, 18,8 s)

Roteiro: "Três peças pra se vestir melhor sem esforço. Uma: camisa branca de algodão, bem ajustada no ombro. Duas: jaqueta em tom neutro, que combina com tudo. Três: relógio simples, de pulseira de couro ou metal. Com essas três, qualquer calça jeans vira um look. Salva e me segue pra mais dicas de estilo."

```json
{
  "marca": { "nome": "Tiago", "area": "Estilo masculino" },
  "momentos": [
    { "tipo": "capa", "de": 0, "ate": 2.83, "linhas": ["3 peças", "pra se vestir melhor", "sem esforço"], "enfase": "sem esforço" },
    { "tipo": "peca", "de": 2.83, "ate": 6.43, "numero": 1, "layout": "direita", "rotulo": "peça",
      "nome": "Camisa", "nomeEm": 3.53, "complemento": "branca", "complementoEm": 3.75,
      "ponto": "peito", "amostra": { "cor": "branco", "tecido": "algodao", "em": 4.31 },
      "atributos": [ { "rotulo": "Tecido", "valor": "algodão", "em": 4.31 }, { "rotulo": "Caimento", "valor": "bem ajustada", "em": 5.07 } ],
      "medida": { "de": "pescoco", "ate": "ombroEsq", "em": 5.79, "texto": "no ombro" } },
    { "tipo": "peca", "de": 6.43, "ate": 9.87, "numero": 2, "layout": "esquerda", "rotulo": "peça",
      "nome": "Jaqueta", "nomeEm": 7.22, "complemento": "tom neutro", "complementoEm": 7.88,
      "ponto": "jaquetaDir", "amostra": { "cor": "pedra", "tecido": "sarja", "em": 7.88 },
      "combina": { "rotulo": "Combina com", "em": 8.92, "ate": 9.7, "cores": ["branco", "preto", "marinho", "oliva", "jeans"] } },
    { "tipo": "peca", "de": 9.87, "ate": 13.5, "numero": 3, "layout": "topo", "rotulo": "peça", "nome": "Relógio", "nomeEm": 10.69, "ponto": "pulsoDir",
      "detalhe": { "ponto": "pulsoDir", "em": 10.69, "zoom": 2.1, "rotulo": "detalhe · pulso" },
      "atributos": [ { "rotulo": "Estilo", "valor": "simples", "em": 11.01 } ],
      "variantes": { "rotulo": "Pulseira", "em": 11.96, "itens": [ { "nome": "couro", "cor": "couro", "tecido": "couro", "em": 12.35 }, { "nome": "metal", "cor": "metal", "tecido": "metal", "em": 12.83 } ] } },
    { "tipo": "colagem", "de": 13.5, "ate": 16.38, "folio": "o look",
      "itens": [ { "peca": 1, "em": 13.62 }, { "peca": 2, "em": 13.8 }, { "peca": 3, "em": 13.98 }, { "nome": "calça jeans", "cor": "jeans", "tecido": "jeans", "em": 14.91 } ],
      "subtitulo": "Com essas três,", "titulo": "vira um look.", "enfase": "look." },
    { "tipo": "cta", "de": 16.38, "ate": 18.84, "texto": "Salve e siga", "textoEm": 16.43,
      "detalhe": "mais dicas de estilo", "detalheEm": 17.35, "assinaturaEm": 17.83, "icone": "salvar" }
  ],
  "semLegenda": [],
  "correcoes": { "para": "pra", "Jaquet tem": "Jaqueta em", "tipo cera": "de pulseira", "Tchau": "", "3": "Três" }
}
```

O relógio não ganha pino (o pulso se mexe com as mãos): ele aparece no `detalhe` e volta, num círculo, na colagem. A "calça jeans" só é citada no resumo, então entra direto na colagem.
