# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Os exemplos abaixo vêm de um mesmo vídeo (o do exemplo completo, na seção 9), com os mesmos tempos.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática: quadro cheio × negatoscópio × pausa
3. Os componentes da assinatura (`momentos`)
3B. Os 11 blocos universais e o `ajuste` de qualquer assunto
4. A cena da chapa: partes, alvos e vistas
5. Os passos de um ajuste
6. Correções prontas para adaptar
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Dr. Tiago Moura", "area": "Fisioterapia" },
  "sfx": true,
  "correcoes": { "Home Office": "Home office" }
}
```

- `marca`: `nome` e `area` aparecem no rodapé da chapa da pessoa (duas linhas em marcação de filme, 30 px, durante os ajustes e a pausa) e na assinatura do fechamento (`cta`). Nome até ~18 caracteres e área até ~18 (mais que isso o rodapé corta com reticências). Os dois vazios = chapa sem rodapé e fechamento sem assinatura.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. `zona.topo` é onde começam as artes de quadro cheio (logo abaixo do queixo).

## 2. A gramática: quadro cheio × negatoscópio × pausa

É a assinatura do modelo — uma sala de laudos:

| Estado | Quando | A pessoa | A tela |
|---|---|---|---|
| **Quadro cheio** | `abertura`, `numero`, `destaque`, `definicao`, `frase`, `pergunta`, `laudo`, `cta` e trechos sem momento | rosto na linha do centro | chapa-cartão na altura do peito (borda de luz fria, filme escuro) |
| **Negatoscópio** | cada `ajuste`, `topicos`, `passos`, `comparacao` e `grafico` | vira a **chapa iluminada** no alto (aro escuro, borda de luz, rodapé com nome e área), à esquerda no 1º ajuste, à direita no 2º, e assim por diante | bloco do título do outro lado da pessoa; embaixo, o negatoscópio com a chapa de raio-x do ajuste |
| **Pausa** | `pausa` | chapa iluminada **no centro** | relógio à esquerda e cronômetro à direita da pessoa; no negatoscópio, a chapa com o título escrito e o esqueleto que se levanta e caminha até a porta |

Regras que o template já cumpre sozinho (não precisa escrever nada):

- **Trocas de lugar**: a pessoa muda de lugar em 0,55 s, começando 0,06 s antes do `de` do momento — o corte que costuma ficar na fronteira cai no meio do movimento. Do quadro cheio para o primeiro ajuste, o negatoscópio acende por trás dela (com duas pequenas oscilações, como lâmpada fria) e a primeira chapa já está no painel, revelando-se; a cada ajuste seguinte, a chapa nova desliza da direita por cima da anterior.
- **A postura vai sendo corrigida de chapa em chapa**: numa chapa, as partes corrigidas nos ajustes anteriores já aparecem certas, a do ajuste atual começa errada e as dos ajustes seguintes ainda estão erradas. Você só escreve o `corrige` de cada ajuste.
- **Contagem de chapas**: o bloco do título mostra os quadradinhos dos ajustes (os feitos com ✓, o atual aceso) e a etiqueta "AJUSTE 1/3".
- **Corte num trecho em quadro cheio** (longe de uma troca): troca seca de enquadramento (6%) para disfarçar o pulo.
- **Nenhum quadro vazio**: títulos nascem com as palavras em esboço e cada palavra se revela quando é dita; os mostradores da pausa nascem em esboço; as miniaturas do fechamento já estão no cartão, apagadas, antes de chegar; a chapa que sai fica por baixo até a nova cobrir o painel; a arte que sai cruza com a que entra.
- **Arte de quadro cheio depois do negatoscópio**: só entra quando a pessoa já cresceu e cobriu a tela.
- **Último momento**: fica até o último quadro.

Um cuidado seu: **momentos encostados**. O `ate` de um = o `de` do próximo, na pausa entre as frases (de preferência exatamente num valor de `cortesEm`). Um intervalo sem momento entre dois ajustes faz a pessoa voltar ao quadro cheio no meio (e o negatoscópio apaga) — use só se for de propósito.

## 3. Os componentes da assinatura

Os limites de texto existem porque o componente diminui o corpo para caber: passou do limite, fica pequeno ou quebra em muitas linhas. Palavras de títulos entram **no instante em que são ditas** (o template procura cada palavra na fala) — por isso use as palavras que a pessoa diz, na ordem em que diz (pode pular palavras: "Pés apoiados no chão" para "os pés apoiados no chão"). Números escritos em algarismo ("3", "90°") casam com a palavra falada ("três", "noventa"); "pra" casa com "para".

### `abertura` — quadro cheio, a chapa de abertura

Para a primeira frase (a dor, a promessa). À esquerda, uma miniatura da chapa com o esqueleto à mesa com a postura toda errada; à direita, o título se revela palavra por palavra.

```json
{
  "tipo": "abertura", "de": 0, "ate": 4.22,
  "titulo": "Home office acabando com as suas costas?",
  "destaque": "costas?",
  "tensaoEm": 2.04,
  "chamada": { "texto": "Ajusta 3 coisas", "em": 2.86, "itens": [{ "em": 3.22 }, { "em": 3.42 }, { "em": 3.62 }] }
}
```

- `texto` (ou `titulo`, o nome antigo): até ~45 caracteres (até 4 linhas, 88 → 64 px). `em` (opcional): quando o texto começa a ser dito. Sem `tensaoEm`, a miniatura mostra a coluna desalinhada.
- `destaque` (opcional): trecho exato do título em vermelho — **a dor** ("costas?", "lombar", "dor no pescoço"). O vermelho do modelo é só para tensão.
- `tensaoEm` (opcional): quando os pontos de tensão da miniatura acendem (pescoço, ombro e lombar, um depois do outro). Use a palavra da dor.
- `chamada` (opcional): no instante `em`, o título sai e entra uma chamada curta (até ~18 caracteres, 2 linhas, 116 → 72 px; algarismos ficam em ciano). Cada item de `itens` põe um número (1, 2, 3…) no desenho, no lugar do ajuste correspondente (o 1º item aponta para o que o 1º ajuste corrige: a tela, os pés, o cotovelo…). Espalhe os itens pela palavra do número e pela seguinte ("três coisas"), ~0,2 s entre eles.

### `ajuste` — o negatoscópio

O coração do modelo. A pessoa vira a chapa iluminada no alto; do outro lado fica o bloco do título; embaixo, a chapa de raio-x com a correção.

```json
{
  "tipo": "ajuste", "de": 4.22, "ate": 7.23,
  "titulo": "Tela na altura dos olhos",
  "apoio": "pra não curvar o pescoço",
  "vista": "tela",
  "passos": [
    { "tipo": "destaque", "alvo": "tela", "rotulo": "Tela", "em": 4.32 },
    { "tipo": "tensao", "alvo": "pescoco", "rotulo": "Pescoço", "em": 4.55, "apagaEm": 6.95 },
    { "tipo": "linha", "linha": "olhos", "em": 4.75 },
    { "tipo": "corrige", "parte": "tela", "em": 4.85, "dur": 0.95 },
    { "tipo": "corrige", "parte": "pescoco", "em": 5.6, "dur": 1.2 },
    { "tipo": "corrige", "parte": "tronco", "em": 5.75, "dur": 1.1 },
    { "tipo": "linha", "linha": "prumo", "em": 6.5 }
  ]
}
```

- `titulo`: até ~30 caracteres (até 3 linhas, 88 → 66 px, numa coluna de 448 px). Use as palavras faladas.
- `apoio` (opcional): até ~40 caracteres (até 3 linhas, 48 → 44 px), também falado — o porquê ("pra não curvar o pescoço") ou o detalhe ("com os joelhos em 90°").
- `rotulo` (opcional): a etiqueta acima do título; padrão "AJUSTE 1/3" (o número e o total são contados sozinhos).
- `vista`: o recorte da chapa (seção 4). Escolha a que mostra a parte corrigida.
- `lado` (opcional): `"esquerda"` ou `"direita"` (de que lado fica a pessoa). Padrão: alterna, começando pela esquerda. Deixe alternar: a mudança de lado é parte do ritmo.
- `passos`: a correção, passo a passo (seção 5).

### `pausa` — a pessoa no centro, o esqueleto caminha

Para uma regra de movimento ("a cada hora, levanta e caminha"). A pessoa vai para o centro; à esquerda, um relógio; à direita, um cronômetro; no negatoscópio, uma chapa com o título escrito no alto e o esqueleto sentado (postura certa) que se levanta e caminha até a porta, acendendo a régua do chão.

```json
{
  "tipo": "pausa", "de": 13.21, "ate": 16.25,
  "titulo": "A cada hora, levanta e caminha 2 minutos",
  "relogio": { "texto": "1 h", "em": 13.31, "ate": 14.25 },
  "levantaEm": 14.27,
  "caminhaEm": 14.94,
  "tempo": { "texto": "2 min", "em": 15.4 }
}
```

- `titulo`: até ~42 caracteres (até 2 linhas, 72 → 58 px), falado.
- `relogio` (opcional): o ponteiro dá uma volta de `em` até `ate` (padrão `em` + 1 s) e o anel se completa; `texto` (até ~6 caracteres) vai embaixo. Use a frase do intervalo ("a cada hora", "a cada 30 minutos" → "30 min").
- `levantaEm` (opcional): o esqueleto se levanta da cadeira (0,6 s). Use o verbo ("levanta").
- `caminhaEm` (opcional, depois de `levantaEm` + 0,6): ele começa a andar até o fim da pausa. Use o verbo ("caminha", "anda").
- `tempo` (opcional): o anel do cronômetro se completa em 0,85 s; `texto` (até ~6 caracteres) vai embaixo ("2 min").
- Sem `levantaEm`, o esqueleto fica sentado (uma pausa que é só uma regra de tempo); sem `relogio` ou `tempo`, o mostrador não aparece.

### `laudo` — quadro cheio, a frase do laudo

Para uma frase que merece ficar (uma regra, um dado, um alerta) fora dos ajustes.

```json
{ "tipo": "laudo", "de": 16.3, "ate": 19.1, "rotulo": "Atenção", "texto": "Dor que não passa em uma semana: procura avaliação", "destaque": "procura avaliação" }
```

- `rotulo` (opcional): etiqueta em marcação de filme acima da frase; padrão "LAUDO".
- `texto`: até ~60 caracteres (até 4 linhas, 84 → 64 px), fiel ao que foi dito.
- `destaque` (opcional): trecho exato do texto em ciano.

### `cta` — quadro cheio, o fechamento

```json
{ "tipo": "cta", "de": 16.25, "ate": 18.52, "texto": "Salva e ajusta agora.", "icone": "salvar" }
```

- `texto`: a chamada falada, até ~28 caracteres (até 2 linhas, 84 → 66 px).
- `icone`: `salvar` (padrão), `seguir`, `comentar` ou `compartilhar` — o que a chamada pede. O ícone se preenche de ciano na primeira palavra.
- `recapitular` (opcional): `false` tira as miniaturas. Por padrão, as chapas dos ajustes (até 4) aparecem em miniatura, já corrigidas, e cada uma ganha ✓ na última palavra da chamada.
- A assinatura (`marca.nome · marca.area`) vai no rodapé do cartão.

## 3B. Os 11 blocos universais e o `ajuste` de qualquer assunto

Os 11 blocos existem em todos os modelos do pack com os mesmos campos (veja `references/adaptar.md` para escolher o bloco). Campos comuns: `tipo`, `de`, `ate`, `legenda?`. Todo `em` é o instante da palavra dita, tirado de `work/palavras.json`. Os exemplos vêm de um vídeo sobre cripto.

| `tipo` | Estado | Campos e limites |
|---|---|---|
| `abertura` | quadro cheio | `texto` (até ~45), `destaque?`, `em?` (e os campos antigos da seção 3) |
| `numero` | quadro cheio | `valor`, `em`, `rotulo` (até ~28), `rotuloEm?`, `prefixo?`, `sufixo?` ("mil", "mi", "%"), `casas?`, `ilustrativo?`. Formato pt-BR |
| `destaque` | quadro cheio | `texto` (até ~30), `em`, `nivel?` (`alerta` vermelho, `chave` branco com régua ciano), `detalhe?`, `detalheEm?` |
| `definicao` | quadro cheio | `termo` (até ~22), `em`, `significado` (até ~50), `significadoEm` |
| `frase` | quadro cheio | `texto` (até ~50), `destaque?` (ciano), `risco?` (riscado em vermelho), `riscoEm?`, `em?` |
| `pergunta` | quadro cheio | `texto` (até ~60), `opcoes?` 2 a 4 `{texto` até ~28, `em}`, `em?` |
| `cta` | quadro cheio | `texto` (até ~50), `icone?` (`salvar`, `seguir`, `comentar`, `link`, `compartilhar`), `destaque?` (ciano), `em?`, `recapitular?` |
| `topicos` | negatoscópio | `titulo?` (até ~30), `itens` 2 a 5 `{texto` (2 a 6 palavras, até ~30), `em`, `detalhe?}` |
| `passos` | negatoscópio | `titulo?`, `itens` 2 a 5 em ordem, como em `topicos` |
| `comparacao` | negatoscópio | `titulo?`, `modo?` (`contra`, `antes-depois`, `errado-certo`), `lados` (dois: `{rotulo` até ~14, `texto` até ~30, `em}`), `vencedor?`, `vencedorEm?` |
| `grafico` | negatoscópio | `titulo?`, `forma` (`barras`, `linha`, `pizza`), `dados?` 2 a 6 `{rotulo, valor, em}` (só números ditos), `tendencia?` + `tendenciaEm?`, `unidade?`, `ilustrativo?` |

- **Sem número dito:** `grafico` com `tendencia` e `ilustrativo: true` (a etiqueta aparece sozinha), ou `comparacao`.
- **Negatoscópio:** a pessoa vira a chapa no alto (o lado alterna) e o bloco do título fica do outro lado; o filme do momento desliza por cima do anterior. Cada item entra no seu `em`.

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
{ "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
{ "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
{ "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita: como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
{ "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.9 }
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "icone": "link", "destaque": "Saiba Mais" }
```

### `ajuste` com `itens` (qualquer assunto)

Sem `vista` nem `passos`: o raio-x mostra **uma coluna vista de frente**, com cada item preso a uma vértebra.

```json
{ "tipo": "ajuste", "de": 14.93, "ate": 24.21, "titulo": "Mesmo na alta, tem gente que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.78 }, { "texto": "Risco que não entende", "em": 21.75 } ] }
{ "tipo": "ajuste", "de": 24.21, "ate": 28.03, "titulo": "Como avaliar os projetos?", "apoio": "e pensar no seu posicionamento",
  "itens": [ { "texto": "Avaliar os projetos", "em": 24.95, "tipo": "ok" }, { "texto": "Posicionamento", "em": 27.06, "tipo": "ok" } ],
  "alinha": { "em": 27.3 } }
```

- `itens`: 2 a 5, cada um `{ texto` (até ~24 caracteres, rótulo em caixa alta), `em`, `tipo?`, `apagaEm? }`. `tipo: "tensao"` (padrão) é o problema: o ponto acende em vermelho e pulsa. `tipo: "ok"` é o que está certo ou o conserto: entra já em ciano com ✓.
- `alinha: { em, texto? }`: o conserto. A coluna se endireita, a linha de prumo ciano se desenha (com `texto` numa etiqueta) e todas as tensões apagam para o ciano com ✓. Ponha na palavra do conserto; um `ajuste` seguinte que traga os `ok` pode ter o seu próprio `alinha`.
- `titulo`, `apoio`, `rotulo` (padrão "RAIO-X") e `lado` valem como no modo postura. É metáfora, não medida: a coluna não mostra dado nenhum.

## 4. A cena da chapa: partes, alvos e vistas

A chapa mostra **uma pessoa sentada à mesa, de perfil** (olhando para a direita): cadeira com rodízios, mesa, monitor, teclado e o chão. O esqueleto é desenhado em traço luminoso (crânio, coluna vértebra por vértebra, costelas, pelve, ossos longos, mãos e pés) com a silhueta do corpo apagada em volta.

### Partes que se corrigem (`corrige.parte`)

| Parte | Errado (começo) | Certo (fim) |
|---|---|---|
| `tela` | monitor baixo, direto na mesa | monitor sobe num suporte até o topo da tela ficar na altura dos olhos |
| `pescoco` | cabeça projetada para a frente, olhando para baixo | cabeça no prumo, olhar na horizontal |
| `tronco` | costas em C, pelve para trás | coluna com as curvas naturais, apoiada |
| `pernas` | pés encolhidos embaixo da cadeira, na ponta | pés apoiados no chão, joelho em 90° |
| `antebraco` | antebraço solto no ar, braço esticado até o teclado longe | antebraço apoiado na mesa |
| `cotovelo` | cotovelo afastado, lá na frente | cotovelo perto do corpo (o teclado vem junto) |

`antebraco` e `cotovelo` são dois tempos do mesmo braço. Sem `antebraco` no plano, o braço faz os dois de uma vez no `corrige` do `cotovelo`.

### Alvos (`alvo` de destaque, tensão e rótulo)

`tela`, `olhos`, `pescoco` (atrás do pescoço), `ombro` (alto do ombro), `cotovelo`, `punho`, `lombar` (atrás da lombar), `quadril`, `joelho`, `tornozelo`, `pes`.

Onde a tensão costuma acender: `pescoco` (tela baixa, cabeça para a frente), `lombar` (pés sem apoio, costas em C), `ombro` (braço esticado, cotovelo longe).

### Vistas (`ajuste.vista`)

| Vista | Mostra | Boa para |
|---|---|---|
| `tela` | cabeça, pescoço, tronco, mesa e monitor | tela, pescoço, tronco; linhas `olhos` e `prumo` |
| `pernas` | lombar, quadril, pernas, pés e chão | pernas; ângulo do `joelho`; apoio dos `pes` |
| `bracos` | cabeça, tronco, braço, mesa e teclado | antebraço e cotovelo; apoio do `antebraco`; `distancia` |
| `coluna` | a coluna inteira com o crânio, sentado | tronco e pescoço; `prumo`; tensão na lombar |
| `inteiro` | o corpo todo à mesa | um resumo, ou mais de uma parte de uma vez |

## 5. Os passos de um ajuste

Cada passo tem um `em` (a palavra que ele ilustra). Os rótulos ficam em marcação de filme (32 px, caixa-alta) com um fio até o alvo; o template mantém tudo dentro da chapa.

- `{ "tipo": "tensao", "alvo": "pescoco", "rotulo": "Pescoço", "em": 4.55, "apagaEm": 6.95 }` — ponto vermelho que pulsa; em `apagaEm` ele apaga para o ciano e o rótulo ganha ✓. Ponha o `apagaEm` no fim da correção (a palavra que fecha a ideia: "pescoço", "chão", "corpo"). Um por ajuste.
- `{ "tipo": "corrige", "parte": "tela", "em": 4.85, "dur": 0.95 }` — a parte sai do errado para o certo em `dur` segundos (padrão 0,9). Comece no verbo ou na palavra da posição ("altura", "apoiados", "perto"). Partes que andam juntas (tela → pescoço → tronco) podem começar escalonadas: o pescoço endireita enquanto a tela sobe.
- `{ "tipo": "destaque", "alvo": "pes", "rotulo": "Pés", "em": 7.32 }` — anel ciano que se desenha em volta do alvo (na `tela`, um retângulo em volta do monitor). Use na palavra que nomeia a parte. `rotulo` é opcional.
- `{ "tipo": "linha", "linha": "olhos", "em": 4.75 }` — a linha horizontal na altura dos olhos até a tela, com o olhar tracejado: o olhar desce até a tela baixa e, quando ela sobe, os dois se encontram.
- `{ "tipo": "linha", "linha": "prumo", "em": 6.5 }` — a linha vertical pelo ombro: a orelha tem que estar nela (uma seta vermelha mostra o desvio enquanto a cabeça está para a frente).
- `{ "tipo": "angulo", "alvo": "joelho", "em": 9.55 }` — os dois eixos tracejados e o arco se desenham na articulação (`joelho`, `cotovelo` ou `quadril`), e o valor conta até o ângulo real do desenho; em 90° aparece o esquadro. Ponha **depois** do `corrige` dessa parte (o valor mostrado é o do desenho naquele instante). Na postura certa, joelho e quadril dão 90°; use o ângulo só quando a pessoa fala do ângulo.
- `{ "tipo": "apoio", "alvo": "pes", "em": 8.33 }` — a superfície acende: o chão sob os pés (`pes`), a mesa sob o antebraço (`antebraco`) ou o encosto atrás das costas (`costas`). `rotulo` opcional.
- `{ "tipo": "distancia", "alvo": "cotovelo", "em": 12.1 }` — seta dupla entre o tronco e o cotovelo; encolhe e some quando o `corrige` do `cotovelo` traz o braço para perto do corpo. Ponha um pouco antes desse `corrige`.

Ritmo: um passo a cada ~0,5–1 s, cada um numa palavra. Rótulos: no máximo três por chapa, em alvos de cantos diferentes (o título já diz o principal; não precisa rotular tudo).

## 6. Correções prontas para adaptar

**Tela baixa** (vista `tela`): destaque `tela` → tensão `pescoco` → linha `olhos` → corrige `tela` → corrige `pescoco` (e `tronco`) → linha `prumo` → tensão apaga.

**Pés sem apoio** (vista `pernas`): destaque `pes` → tensão `lombar` → corrige `pernas` → apoio `pes` (tensão apaga) → destaque `joelho` → angulo `joelho`.

**Braço esticado** (vista `bracos`): destaque `cotovelo` → tensão `ombro` → corrige `antebraco` → apoio `antebraco` → distancia `cotovelo` → corrige `cotovelo` → tensão apaga.

**Costas curvadas** (vista `coluna`): tensão `lombar` → linha `prumo` → corrige `tronco` → apoio `costas` → corrige `pescoco` → tensão apaga.

## 7. Regras de tempo

- Momentos encostados, sem buracos (seção 2). O primeiro começa em 0; o último vai até o fim.
- Cada `ajuste` precisa de pelo menos ~2,2 s (a troca leva 0,55 s); a `pausa`, de ~2,5 s.
- Passos dentro do ajuste: entre `de` + 0,05 e `ate` − 0,3. `apagaEm` até `ate` − 0,15.
- Os sub-passos da `chamada` e os `em` da pausa dentro do próprio momento.
- O `de` do fechamento, logo antes da primeira palavra da chamada.

## 8. Legenda, correções e sons

- **Legenda**: só aparece nos trechos sem momento (e nos momentos com `"legenda": true`), abaixo do queixo, 46 px, cada palavra se revelando na fala. Se a fala inteira estiver coberta por momentos, não haverá legenda — é o normal neste modelo, porque os títulos já são as palavras faladas.
- `semLegenda`: `[{ "de": 3.1, "ate": 4.0 }]` esconde a legenda num trecho.
- `correcoes`: `{ "Home Office": "Home office" }` — uma ou mais palavras viram outra coisa (vale para legenda e para o casamento dos títulos com a fala).
- **Sons** (automáticos, tonais e raros): um "vum" grave quando o negatoscópio acende, um toque surdo quando uma chapa encosta no painel, um pulso grave quando a tensão da abertura acende, duas notas subindo quando uma tensão apaga, uma nota curta quando um ângulo fecha ou o cronômetro completa, um tom que sobe quando a tela sobe ou o esqueleto se levanta, e um acorde curto no fechamento. Nunca dois a menos de 0,45 s.

## 9. Exemplo completo

Fisioterapeuta, 18,5 s: "Home office acabando com as suas costas? Ajusta três coisas. A tela na altura dos olhos, pra não curvar o pescoço. Os pés apoiados no chão, com os joelhos em noventa graus. E os cotovelos apoiados, perto do corpo. A cada hora, levanta e caminha dois minutos. Salva e ajusta agora."

```json
{
  "marca": { "nome": "Dr. Tiago Moura", "area": "Fisioterapia" },
  "correcoes": { "Home Office": "Home office" },
  "momentos": [
    {
      "tipo": "abertura", "de": 0, "ate": 4.22,
      "titulo": "Home office acabando com as suas costas?",
      "destaque": "costas?",
      "tensaoEm": 2.04,
      "chamada": { "texto": "Ajusta 3 coisas", "em": 2.86, "itens": [{ "em": 3.22 }, { "em": 3.42 }, { "em": 3.62 }] }
    },
    {
      "tipo": "ajuste", "de": 4.22, "ate": 7.23,
      "titulo": "Tela na altura dos olhos",
      "apoio": "pra não curvar o pescoço",
      "vista": "tela",
      "passos": [
        { "tipo": "tensao", "alvo": "pescoco", "rotulo": "Pescoço", "em": 4.55, "apagaEm": 6.95 },
        { "tipo": "destaque", "alvo": "tela", "rotulo": "Tela", "em": 4.32 },
        { "tipo": "linha", "linha": "olhos", "em": 4.75 },
        { "tipo": "corrige", "parte": "tela", "em": 4.85, "dur": 0.95 },
        { "tipo": "corrige", "parte": "pescoco", "em": 5.6, "dur": 1.2 },
        { "tipo": "corrige", "parte": "tronco", "em": 5.75, "dur": 1.1 },
        { "tipo": "linha", "linha": "prumo", "em": 6.5 }
      ]
    },
    {
      "tipo": "ajuste", "de": 7.23, "ate": 10.59,
      "titulo": "Pés apoiados no chão",
      "apoio": "com os joelhos em 90°",
      "vista": "pernas",
      "passos": [
        { "tipo": "tensao", "alvo": "lombar", "rotulo": "Lombar", "em": 7.6, "apagaEm": 8.55 },
        { "tipo": "destaque", "alvo": "pes", "rotulo": "Pés", "em": 7.32 },
        { "tipo": "corrige", "parte": "pernas", "em": 7.62, "dur": 0.9 },
        { "tipo": "apoio", "alvo": "pes", "em": 8.33 },
        { "tipo": "destaque", "alvo": "joelho", "em": 9.12 },
        { "tipo": "angulo", "alvo": "joelho", "em": 9.55 }
      ]
    },
    {
      "tipo": "ajuste", "de": 10.59, "ate": 13.21,
      "titulo": "Cotovelos apoiados",
      "apoio": "perto do corpo",
      "vista": "bracos",
      "passos": [
        { "tipo": "tensao", "alvo": "ombro", "rotulo": "Ombro", "em": 10.9, "apagaEm": 12.85 },
        { "tipo": "destaque", "alvo": "cotovelo", "rotulo": "Cotovelo", "em": 10.73 },
        { "tipo": "corrige", "parte": "antebraco", "em": 11.47, "dur": 0.7 },
        { "tipo": "apoio", "alvo": "antebraco", "rotulo": "Apoio", "em": 11.7 },
        { "tipo": "distancia", "alvo": "cotovelo", "em": 12.1 },
        { "tipo": "corrige", "parte": "cotovelo", "em": 12.36, "dur": 0.7 }
      ]
    },
    {
      "tipo": "pausa", "de": 13.21, "ate": 16.25,
      "titulo": "A cada hora, levanta e caminha 2 minutos",
      "relogio": { "texto": "1 h", "em": 13.31, "ate": 14.25 },
      "levantaEm": 14.27,
      "caminhaEm": 14.94,
      "tempo": { "texto": "2 min", "em": 15.4 }
    },
    { "tipo": "cta", "de": 16.25, "ate": 18.52, "texto": "Salva e ajusta agora.", "icone": "salvar" }
  ]
}
```
