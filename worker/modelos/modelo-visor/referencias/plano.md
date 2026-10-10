# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `cortesEm` e `palavras` (e `zona`, que este modelo não usa). Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Os exemplos das seções 3 e 9a vêm do vídeo de demonstração (fotografia), com os mesmos tempos.

## Sumário

1. Campos gerais
2. A gramática do visor (o que já é automático)
3. Os componentes da assinatura (`abertura`, `cena`, `foco`, `comparar`, `cta`)
4. Os blocos universais (`topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `frase`, `pergunta`)
5. Onde fica a pessoa
6. Como dividir a fala em momentos
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago", "area": "Fotografia" },
  "sfx": true,
  "correcoes": { "para": "pra" }
}
```

- `marca`: aparece só no cartão de perfil do fechamento (`cta`). `nome` até 16 caracteres, `area` até 18. `nome` vazio = cartão sem perfil, só com a chamada e o botão.
- `sfx`: `false` desliga os sons.
- `rosto`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem a cruz fora do rosto, refaça o corte.

## 2. A gramática do visor (o que já é automático)

O vídeo inteiro é a tela de uma câmera fictícia. Você não escreve nada disto — tudo sai dos momentos:

- **Leituras no alto**: ISO, velocidade e abertura assentam quando o visor liga; o EV aparece e sobe (e a velocidade cai) enquanto a régua de exposição é arrastada.
- **Ícone da grade** (alto, à esquerda): a lápis até a grade dos terços se desenhar pela primeira vez; então acende no acento e fica ligado.
- **Contador de fotos** (alto, à direita): vira a cada foto — o disparo do `comparar` e a foto final do `cta`.
- **Cantos de enquadramento**: abraçam o que está em foco — a pessoa em tela cheia, ou a cena quando a tela se divide — e se movem junto com cada troca de lugar.
- **Seletor de modos** (embaixo): um nome por momento (FOTO, LENTE, GRADE, FOCO E LUZ, COMPARAR, SEGUIR…); desliza para o modo do momento quando ele começa. Troque o nome com `modo` (até 10 caracteres).
- **Galeria, obturador, virar câmera** (embaixo): a galeria fica a lápis até a primeira foto e mostra sempre a última (a cena ajustada ou o retrato da pessoa), com um anel que se abre quando ela chega; o obturador afunda em cada foto; o botão de virar gira a cada troca de lugar.
- **Zoom em tela cheia**: alterna 1 e 1,04 em cada corte (disfarça o pulo) e aproxima 4% quando o foco trava.
- **A cena ilustrada** (uma xícara de café na mesa, com a luz de uma janela): cada momento `cena` mostra só o seu defeito — ele aparece quando o momento começa e some com a ação. O assunto que sai do centro continua na linha depois. No `comparar`, o ANTES junta todos os defeitos do vídeo e o DEPOIS mostra a foto com todos os ajustes.

## 3. Os componentes da assinatura

Os limites de texto existem para o texto caber legível no celular. Se a ideia não cabe, reescreva mais curto, como um editor faria num título — mas **com as palavras que a pessoa disse**, porque cada palavra ganha cor no instante em que é falada (o texto inteiro espera "a lápis" antes disso).

### `abertura` — o visor liga

O visor liga (cantos fecham, leituras assentam), a detecção de rosto acha a pessoa (uma moldura branca fina em volta do rosto) e o título se monta palavra por palavra num rótulo de vidro, no peito. Sempre em tela cheia.

```json
{ "tipo": "abertura", "de": 0, "ate": 3.02,
  "texto": "3 ajustes pra fotos melhores no celular", "destaque": "3" }
```

- `texto` (o campo universal): o título inteiro, até ~60 caracteres. O modelo mede, quebra em até 3 linhas e reduz o corpo (de 86 até 54 px) até caber. **Prefira `texto`.**
- `linhas` (opcional, à mão): 2 ou 3 linhas, **até 18 caracteres cada**; se existir, manda sobre `texto`.
- `em` (opcional): o instante em que o texto começa a ser dito, quando o momento começa antes da primeira palavra.
- `destaque`: uma palavra ou trecho exato do texto, que ganha o acento. Números podem ser escritos em algarismo ("3" casa com "três").
- `rotulo` (opcional): letreiro pequeno em cima do título, até 26 caracteres (ex.: "Fotografia no celular"). Não é falado, então aparece de uma vez.
- `ate`: o começo da frase seguinte (≈ 0,05 s antes da primeira palavra do próximo momento).

### `cena` — um ajuste na foto ilustrada

A pessoa vai para um cartão e a cena ilustrada ocupa o resto do visor, com um rótulo de vidro: "AJUSTE 01" (acende quando o número é dito), o título e uma segunda linha. No lugar `topo` o rótulo vira um painel ao lado da pessoa, com o ícone da ação embaixo (a lápis até a ação, no acento quando ela termina). A cena começa com o defeito da dica e, no instante do gesto, a ação conserta.

```json
{ "tipo": "cena", "de": 3.02, "ate": 7.0,
  "numero": 1, "numeroEm": 3.07,
  "titulo": "Limpa a lente", "detalhe": "com a camiseta",
  "acao": "limpar", "acaoEm": 3.86, "acaoAte": 5.5,
  "nota": { "texto": "vive engordurada", "em": 5.83, "icone": "digital" } }
```

```json
{ "tipo": "cena", "de": 7.0, "ate": 11.88,
  "numero": 2, "numeroEm": 7.06,
  "titulo": "Liga a grade", "detalhe": "assunto numa das linhas",
  "acao": "tercos", "gradeEm": 8.17, "acaoEm": 8.66, "acaoAte": 10.32,
  "marcaEm": 10.99, "nota": { "texto": "não no centro", "em": 10.99 } }
```

As cinco ações:

| `acao` | A cena começa… | No `acaoEm` → `acaoAte` | Para dicas de… |
|---|---|---|---|
| `limpar` | embaçada, com uma digital e manchas de gordura | um pano de camiseta passa e limpa | lente suja, limpar a câmera |
| `tercos` | com a xícara no centro | a xícara desliza até a linha dos terços; o ponto forte acende no fim | grade, regra dos terços, composição |
| `foco` | fora de foco | um toque abre um anel na xícara, o quadrado de foco procura e trava (a cena fica nítida na trava) | tocar para focar, foco no assunto |
| `luz` | escura | a régua de exposição aparece ao lado da xícara e o sol sobe enquanto a cena clareia (o EV sobe no alto) | exposição, luz, foto escura |
| `horizonte` | torta | a cena gira até a borda da mesa ficar reta; o nível acende | horizonte, nível, foto torta |

Campos:

- `titulo`: **até 18 caracteres**, palavras faladas ("Limpa a lente", "Liga a grade"). No painel do `topo` ele quebra em duas linhas; quebre onde a frase respira.
- `detalhe` (opcional): **até 26 caracteres**, palavras faladas logo depois do título.
- `numero` e `numeroEm`: o número do ajuste (vira "AJUSTE 01") e quando ele é dito ("Primeiro", "Segundo"). Ou `rotulo` para outro texto (ex.: "DICA 1").
- `acaoEm`: a palavra do gesto ("Limpa", "coloca", "toca", "arrasta"). `acaoAte`: quando o gesto termina — a palavra de chegada ("linhas") ou 1–2 s depois. Padrão: 1,4 s depois.
- `gradeEm` (opcional): quando a grade dos terços se desenha (a palavra "grade"). No `tercos`, se faltar, a grade entra 0,4 s antes da ação. Depois de desenhada, a grade fica em todas as cenas seguintes (é um ajuste da câmera).
- `marcaEm` (só `tercos`): quando o centro é riscado com um ✕ ("não no centro").
- `lado` (só `tercos`): para qual linha a xícara vai — `"esquerda"` (padrão) ou `"direita"`.
- `nota` (opcional): uma frase curta com ícone, no instante em que é dita. **Até 22 caracteres** (até 16 se ficar ao lado do ✕). No `topo`, a nota rola para o lugar da segunda linha do painel; com o centro riscado, aparece ao lado do ✕ (que sobe o necessário para não encostar na xícara, longe do vapor); senão, embaixo à esquerda da cena. Ícones: `digital`, `xis`, `camiseta`, `sol`, `grade`, `check`, `nivel`, `lupa`.
- `pessoa` (opcional): `topo`, `janela` ou `lado` (seção 5). Sem ele, as cenas alternam `topo` e `janela`.

### `foco` — o quadrado de foco no rosto

A pessoa em tela cheia: um toque abre um anel no rosto, o quadrado de foco procura (muda de tamanho e lugar aos trancos) e trava no rosto com o acento e o selo "FOCO TRAVADO". Se houver `luzEm`, a imagem escurece um pouco na trava (a câmera mediu errado) e a régua de exposição aparece ao lado do rosto: o sol sobe, a luz volta e o EV conta até o valor de `ev`.

```json
{ "tipo": "foco", "de": 11.88, "ate": 15.8,
  "numero": 3, "numeroEm": 11.93,
  "titulo": "Toca pra focar", "detalhe": "e arrasta pra ajustar a luz",
  "toqueEm": 12.56, "travaEm": 13.58, "luzEm": 14.16, "luzAte": 15.63, "ev": "+0,7" }
```

- `toqueEm`: a palavra "toca" (ou equivalente). `travaEm`: a palavra "focar" — pelo menos 0,6 s depois do toque, para a procura aparecer.
- `luzEm` e `luzAte` (opcionais): o começo do arrasto ("arrasta") e a última palavra da frase ("luz"). Sem eles, não há régua.
- `ev`: o valor final da régua, com vírgula ("+0,7", "+1,0").
- `selo` (qualquer assunto): texto livre no lugar de "FOCO TRAVADO", até 16 caracteres ("Na mira", "Na lei"). `valor`: texto livre no lugar do EV que sobe com a régua ("+40%").
- `titulo` até 18 caracteres; `detalhe` até 28.
- `quadro` (opcional): ajuste do quadrado, em frações do quadro — `{ "tamanho": 0.4, "x": 0, "y": 0.012 }`. `tamanho` é a largura do quadrado (0,4 = 40% da largura do quadro, bom para um rosto que ocupa ~35% da largura). Rosto maior ou menor na gravação: aumente ou diminua. Óculos, testa alta ou queixo cortado: desloque com `y` (positivo desce).
- Use em tela cheia (padrão). O quadrado acompanha o zoom.

### `comparar` — ANTES e DEPOIS

A pessoa vira uma janelinha pequena no canto de cima e o visor inteiro mostra a cena com todos os ajustes. O obturador dispara com um piscar suave (nunca branco cheio), a foto encolhe para a metade de baixo (DEPOIS) e uma cópia voa para a galeria (o contador vira). A foto antiga entra na metade de cima como ANTES (com todos os defeitos dos ajustes do vídeo) e, na palavra "compara", a grade cobre as duas: o centro do ANTES é riscado e o ponto forte do DEPOIS acende (só se o vídeo teve `tercos`). As duas fotos ocupam a largura toda do visor.

```json
{ "tipo": "comparar", "de": 15.8, "ate": 18.55, "legenda": true,
  "disparoEm": 16.2, "antesEm": 16.62, "compararEm": 17.85 }
```

- `disparoEm`: dentro da palavra "fotografa" (ou "tira a foto"), **pelo menos 0,35 s depois de `de`** (a pessoa ainda está indo para a janelinha).
- `antesEm`: quando a foto antiga entra ("de novo", "a mesma cena", "antes"), pelo menos 0,4 s depois do disparo. Até lá, o lugar do ANTES espera a lápis.
- `compararEm`: a palavra "compara" (ou "olha a diferença"). Deixe pelo menos 0,5 s entre ela e o `ate`.
- `antes` e `depois` (opcionais): nomes dos cartões, até 8 caracteres.
- `antesTexto` e `depoisTexto` (qualquer assunto): uma frase curta (até ~30 caracteres) numa faixa de vidro embaixo de cada cartão ("compra por impulso" / "com critério").
- A tela não escreve a frase falada: use `"legenda": true` para a legenda carregar a fala. Ela aparece na borda de baixo da foto ANTES, só depois que a pessoa chegou na janelinha (nunca passa pelo rosto).
- Só faz sentido depois de pelo menos um `cena` (ou um `foco` com luz): é a comparação do que foi ajustado.

### `cta` — fechamento

A pessoa volta para a tela cheia e um cartão de perfil de vidro entra no peito: a chamada se monta palavra por palavra, o avatar (uma cópia muda do vídeo, num círculo), o nome e a área da `marca`, e o botão — a lápis até ser apertado no `botaoEm`. Na última batida, o obturador tira uma foto da pessoa (piscar suave): o retrato congelado aparece na galeria com um anel e o contador vira.

```json
{ "tipo": "cta", "de": 18.55, "ate": 20.44,
  "texto": "Me segue", "detalhe": "pra mais dicas", "botaoEm": 18.96, "acao": "seguir", "fotoEm": 19.5 }
```

- `fotoEm`: a foto final — entre 0,6 e 1 s antes do fim do vídeo, depois da última palavra da chamada se der. Padrão: 0,6 s depois do botão. `false` = sem foto final.
- `texto`: até ~40 caracteres, palavras faladas (o modelo quebra em até 2 linhas e reduz o corpo até caber). `detalhe`: até ~32.
- `acao` ou `icone` (o campo universal): o que o botão pede: `seguir` (padrão: "Seguir" → "Seguindo"), `salvar` ("Salvar" → "Salvo"), `comentar` ("Comentar" → "Comentado") ou `link` ("Abrir link" → "Abrindo").
- `destaque`: palavra ou trecho do `texto` que ganha o acento. `em`: quando o texto começa a ser dito.
- `botaoEm`: quando a ação é dita — **pelo menos 0,4 s depois de `de`** (o cartão entra 0,3 s depois do começo). Se a palavra cair antes, use a próxima ("mais", "dicas"). Sem `botaoEm`, o botão é apertado 0,2 s depois da última palavra do `texto`.
- Se for o último momento, fica até o fim do vídeo.

## 4. Os blocos universais

São os blocos que existem em todos os modelos, com os mesmos campos (`motor/BLOCOS.md`). Servem para qualquer assunto. Todo campo `em` (ou `…Em`) é o `em` da palavra dita, em `work/palavras.json`. Os textos são **medidos com a própria fonte**: se não couberem, o corpo diminui até um mínimo legível e o texto quebra em mais linhas; nunca vaza. O que ainda não foi dito espera "a lápis": itens e opções, só como contorno tracejado; títulos, em cinza claro.

Dois jeitos de aparecer:

- **Tela de vidro** (`topicos`, `passos`, `comparacao`, `grafico`): a pessoa vai para o cartão de cima (`topo`) ou para a janelinha (`janela`), alternando. O painel ao lado dela mostra o nome do bloco, o contador `01/03` e o `titulo`; a tela de vidro embaixo mostra o conteúdo. Sem `titulo`, o painel mostra o contador grande.
- **Rótulo no peito** (`numero`, `destaque`, `definicao`, `frase`, `pergunta`): a pessoa fica em tela cheia e um rótulo de vidro sobe do peito; o rosto fica livre.

### `topicos` e `passos`

```json
{ "tipo": "topicos", "de": 16.95, "ate": 24.1,
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 },
             { "texto": "Moeda sem critério", "em": 19.21 },
             { "texto": "Risco que não entende", "em": 21.25 } ] }
```

- `itens`: de 2 a 5, cada um com `texto` (2 a 6 palavras) e `em`; `detalhe` opcional (uma linha menor, ~40 caracteres, falada logo depois do texto). `titulo` opcional (até ~40 caracteres, palavras ditas).
- `topicos` = itens sem ordem: linhas de menu com índice `01`, `02` e um quadrado de foco que anda até o item atual. `passos` = itens em ordem: pontos de foco numerados ligados por um trilho que se completa até o próximo passo.
- Sem ícones: o índice é o padrão.

### `numero`

```json
{ "tipo": "numero", "de": 0, "ate": 4.95, "valor": 83000, "em": 1.3, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- A leitura de exposição conta de 0 até `valor`, a partir de `em` (1,15 s). Formato pt-BR (`83.000`, `1,5`). `casas`: casas decimais (padrão: as de `valor`). `prefixo` ("US$", "R$") e `sufixo` ("mil", "%", "dias") ficam menores. Anos (1900 a 2100) saem sem ponto de milhar.
- `rotulo`: o que o número mede (até ~40 caracteres, 1 ou 2 linhas), falado a partir de `rotuloEm` (padrão: `em` + 0,3).
- `ilustrativo: true` põe a etiqueta ILUSTRATIVO (use quando o número não foi dito).

### `comparacao`

```json
{ "tipo": "comparacao", "de": 8.55, "ate": 13.4, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 9.31 },
             { "rotulo": "Seu bolso", "texto": "não vira dinheiro", "em": 9.87 } ],
  "vencedor": 0, "vencedorEm": 12.0 }
```

- `lados`: sempre 2, cada um com `rotulo` (até 14 caracteres, em mono), `texto` (até ~40 caracteres) e `em`.
- `modo`: `contra` (selo VS), `antes-depois` (seta) ou `errado-certo` (o primeiro lado em vermelho com ✕, o segundo no acento com ✓). Para escolher o nome do seletor de modos use `seletor`, não `modo`.
- `vencedor` (0 ou 1) e `vencedorEm`: no instante dito, o vencedor trava no acento com um check e o outro apaga (continua legível).

### `grafico`

```json
{ "tipo": "grafico", "de": 9.0, "ate": 14.0, "forma": "barras", "titulo": "Vendas por ano",
  "dados": [ { "rotulo": "2023", "valor": 120, "em": 10.1 }, { "rotulo": "2024", "valor": 180, "em": 11.4 } ], "unidade": "mil" }
```

```json
{ "tipo": "grafico", "de": 8.6, "ate": 11.7, "forma": "linha", "titulo": "Mercado subindo",
  "tendencia": "sobe", "tendenciaEm": 9.31, "ilustrativo": true }
```

- Com `dados` (de 2 a 6, números ditos): `barras` (histograma, a maior em acento), `linha` (a linha se desenha de ponto em ponto) ou `pizza` (as fatias se abrem). `unidade` ("%", "mil", "R$") vai junto dos valores. Um dado só: use `numero`.
- Sem `dados`: só a forma da tendência (`sobe`, `cai`, `oscila`), desenhada a partir de `tendenciaEm`, **com `ilustrativo: true`** (a etiqueta fica visível). Não invente valores.

### `destaque`

```json
{ "tipo": "destaque", "de": 13.4, "ate": 16.95, "texto": "Para a maioria", "em": 13.46, "nivel": "alerta",
  "detalhe": "tem gente que perde", "detalheEm": 15.96 }
```

- `texto`: uma frase curta (até ~30 caracteres), em até 3 linhas. `detalhe` (opcional, até ~40): linha menor, a partir de `detalheEm` (padrão: logo depois do texto).
- `nivel`: `alerta` (vermelho, faixa de zebra correndo, para problema, erro e risco) ou `chave` (padrão; um quadrado de foco trava em volta do texto, no acento).

### `definicao`

```json
{ "tipo": "definicao", "de": 4.95, "ate": 8.55, "termo": "Bull market", "em": 5.3,
  "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo`: até ~24 caracteres. `significado`: até ~70 caracteres, em até 3 linhas, falado a partir de `significadoEm`.

### `frase`

```json
{ "tipo": "frase", "de": 33.65, "ate": 35.15, "texto": "Sem promessa de lucro", "em": 33.83,
  "risco": "promessa de lucro", "riscoEm": 34.03 }
```

- `texto`: até ~90 caracteres, em até 4 linhas. `destaque`: trecho que ganha o acento. `risco`: trecho riscado em vermelho no instante `riscoEm` (padrão: a palavra dita). `em`: quando o texto começa a ser dito.

### `pergunta`

```json
{ "tipo": "pergunta", "de": 35.15, "ate": 40.0, "texto": "Você quer entender antes de decidir?", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes", "em": 35.93 }, { "texto": "Perder o patrimônio", "em": 38.81 } ] }
```

- `texto`: até ~90 caracteres. `opcoes` (opcional, 2 a 4, até ~24 caracteres cada): pílulas A, B, C que acendem na palavra dita.
- Em tela cheia, o rótulo ocupa no máximo a metade de baixo da tela: texto e opções menores quando o conjunto é grande.

## 5. Onde fica a pessoa

| Lugar | Como fica | Quem usa |
|---|---|---|
| `cheia` | a pessoa é o visor | `abertura`, `foco`, `cta`, `numero`, `destaque`, `definicao`, `frase`, `pergunta` e os trechos sem momento |
| `topo` | painel do rótulo em cima à esquerda, cartão da pessoa em cima à direita; a cena (ou a tela de vidro) larga e alta embaixo | `cena`, `topicos`, `passos`, `comparacao`, `grafico` (1º, 3º…) |
| `janela` | a cena (ou a tela de vidro) ocupa o visor; a pessoa vira a janelinha da câmera frontal, no canto de cima à direita; rótulo no alto, à esquerda | os mesmos tipos (2º, 4º…) |
| `lado` | a pessoa numa coluna à esquerda; a cena numa coluna estreita à direita | `cena`, se pedir |
| `mini` | as duas fotos da comparação ocupam o visor; a pessoa vira uma janelinha pequena no canto de cima | `comparar` (sempre) |

- A troca de lugar leva ~0,5 s e sempre cruza: a pessoa encolhe e revela a cena, ou cresce por cima dela. Nunca há quadro vazio.
- `abertura` e `cta` ficam sempre em tela cheia; `comparar`, sempre em `mini`; `cena` nunca em tela cheia nem em `mini`.
- Em `lado`, a cena fica estreita (xícara menor): prefira `topo` ou `janela` para os ajustes.
- O vídeo da pessoa nunca é esticado: o motor só reenquadra (`VideoNaCaixa`), sempre com o rosto no lugar.

## 6. Como dividir a fala em momentos

Leia a transcrição inteira e pergunte, frase a frase: *o que a câmera faria aqui?*

| A fala traz… | Componente |
|---|---|
| a promessa de abertura ("3 ajustes pra…") | `abertura` |
| enumeração sem ordem ("três erros", itens separados por vírgula) | `topicos` |
| sequência, processo, "primeiro… depois…" | `passos` |
| número, preço, porcentagem, tempo | `numero` |
| dois lados (A x B, antes x depois, errado x certo) | `comparacao` |
| algo que sobe, cai, cresce; proporção; evolução | `grafico` |
| alerta, risco, erro, palavra-chave forte | `destaque` |
| termo técnico explicado | `definicao` |
| frase de efeito, opinião forte, conclusão | `frase` |
| pergunta feita a quem assiste | `pergunta` |
| uma dica que muda a foto (limpar, compor, focar no assunto, clarear, endireitar) | `cena` com a ação certa |
| tocar na tela para focar, travar foco/exposição, arrastar a luz | `foco` |
| "tira de novo e compara", "olha a diferença", "antes e depois" | `comparar` |
| a chamada final | `cta` |

- Um vídeo de 20–60 s pede de 4 a 7 momentos. Em vídeos mais longos, um a cada 5–10 s; os trechos entre momentos ficam com a pessoa em tela cheia e a legenda.
- Nunca dois momentos ao mesmo tempo. Não repita a mesma ação de `cena` duas vezes seguidas.
- Uma enumeração ("Primeiro… Segundo… Terceiro…"): cada item vira um momento, começando na palavra do número, com `numero`/`numeroEm`.
- Uma dica que não é de imagem (ex.: "usa um microfone") vira o bloco da forma dela (`destaque`, `topicos`, `passos`…); `foco` sem régua serve para "olha aqui, trava nisto", e `cena` entra como metáfora.
- Não repita o mesmo bloco três vezes seguidas. A assinatura (`cena`, `foco` ou `comparar`) entra pelo menos uma vez.

## 7. Regras de tempo

- `de`: o `em` da primeira palavra que o momento cobre, menos 0,05 (nunca menor que 0 nem antes do `ate` do anterior). Momentos colados (o `ate` de um = o `de` do outro) trocam de layout direto, sem voltar à tela cheia.
- `ate`: o `em` da **primeira palavra que o momento não cobre**, ou o fim do vídeo.
- Duração mínima: 2,5 s para `cena`, `foco`, `comparar` e os blocos de tela de vidro; 1,5 s para `frase`, `destaque` e `numero` (a troca de lugar leva meio segundo e o rótulo entra 0,4 s depois do começo); 1,8 s para `cta`.
- Nada parado: se um momento passa de ~3 s sem nada novo (palavra do título, ação, nota, ✕), divida a fala em dois momentos ou acrescente uma `nota` com uma frase dita ali.
- Cada `…Em` é o `em` da palavra correspondente em `work/palavras.json` (o gesto pode vir 0,05–0,1 s antes, para casar com o som).

## 8. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`, numa faixa de vidro acima do seletor de modos. Ela **some durante os momentos**, porque o rótulo de cada momento já escreve a fala no ritmo. Dois ajustes:

- `"legenda": true` no momento: a legenda continua durante ele. Use no `comparar` (a tela não escreve a frase) e quando um rótulo mostra só parte de uma fala longa. Em tela cheia, o rótulo sobe para dar lugar à legenda.
- `semLegenda`: faixas extras sem legenda (`[ { "de": 2.6, "ate": 4.75 } ]`).

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "para": "pra", "Iphone": "iPhone", "né": "" }`. A chave pode ter várias palavras seguidas (viram uma só) e `""` apaga a palavra. O mesmo texto corrigido é usado para achar o tempo das palavras dos rótulos. Não edite `palavras` à mão — o `cortar.mjs` reescreve esse campo.

Sons (tonais, graves, um por batida): o visor liga na abertura; duas notas quando a grade se desenha; um deslize descendente quando o pano limpa a lente; um baque quando o assunto encaixa na linha; dois toques quando o foco trava; um deslize lento que sobe com o sol; o obturador (dois baques graves) em cada foto; duas notas no botão do fechamento. `"sfx": false` desliga todos.

Para ver as linhas de legenda antes de renderizar: `node scripts/legendas.mjs`.

## 9. Exemplos completos

### 9a. Fotografia (o demo)

Roteiro: "Três ajustes pra fotos melhores no celular. Primeiro: limpa a lente com a camiseta, ela vive engordurada. Segundo: liga a grade e coloca o assunto numa das linhas, não no centro. Terceiro: toca na tela pra focar e arrasta pra ajustar a luz. Fotografa de novo a mesma cena e compara. Me segue pra mais dicas."

```json
{
  "marca": { "nome": "Tiago", "area": "Fotografia" },
  "correcoes": { "para": "pra" },
  "semLegenda": [],
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 3.02,
      "linhas": ["3 ajustes", "pra fotos melhores", "no celular"], "destaque": "3" },
    { "tipo": "cena", "de": 3.02, "ate": 7.0, "numero": 1, "numeroEm": 3.07,
      "titulo": "Limpa a lente", "detalhe": "com a camiseta",
      "acao": "limpar", "acaoEm": 3.86, "acaoAte": 5.5,
      "nota": { "texto": "vive engordurada", "em": 5.83, "icone": "digital" } },
    { "tipo": "cena", "de": 7.0, "ate": 11.88, "numero": 2, "numeroEm": 7.06,
      "titulo": "Liga a grade", "detalhe": "assunto numa das linhas",
      "acao": "tercos", "gradeEm": 8.17, "acaoEm": 8.66, "acaoAte": 10.32,
      "marcaEm": 10.99, "nota": { "texto": "não no centro", "em": 10.99 } },
    { "tipo": "foco", "de": 11.88, "ate": 15.8, "numero": 3, "numeroEm": 11.93,
      "titulo": "Toca pra focar", "detalhe": "e arrasta pra ajustar a luz",
      "toqueEm": 12.56, "travaEm": 13.58, "luzEm": 14.16, "luzAte": 15.63, "ev": "+0,7" },
    { "tipo": "comparar", "de": 15.8, "ate": 18.55, "legenda": true,
      "disparoEm": 16.2, "antesEm": 16.62, "compararEm": 17.85 },
    { "tipo": "cta", "de": 18.55, "ate": 20.44,
      "texto": "Me segue", "detalhe": "pra mais dicas", "botaoEm": 18.96, "acao": "seguir", "fotoEm": 19.5 }
  ]
}
```

Com esse plano: a pessoa começa em tela cheia, vai para o cartão de cima (ao lado do painel) enquanto a lente é limpa, vira a janelinha da câmera frontal enquanto a grade se desenha e a xícara sai do centro, volta à tela cheia para o foco travar no rosto e o sol subir, vira uma janelinha pequena enquanto as duas fotos são comparadas e volta à tela cheia no fechamento, que termina com a foto final indo para a galeria. A legenda só aparece na comparação; no resto, os rótulos escrevem a fala palavra por palavra.


### 9b. Cripto (o mesmo estilo com outro assunto)

Fala (43 s): "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago", "area": "Mercado cripto" },
  "momentos": [
    {"tipo": "numero", "de": 0, "ate": 4.95, "valor": 83000, "em": 1.3, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1},
    {"tipo": "definicao", "de": 4.95, "ate": 8.55, "termo": "Bull market", "em": 5.3, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15},
    {"tipo": "comparacao", "de": 8.55, "ate": 13.4, "modo": "contra", "lados": [{"rotulo": "Mercado", "texto": "subindo", "em": 9.31}, {"rotulo": "Seu bolso", "texto": "não vira dinheiro", "em": 9.87}], "vencedor": 0, "vencedorEm": 12.0},
    {"tipo": "destaque", "de": 13.4, "ate": 16.95, "texto": "Para a maioria", "em": 13.46, "nivel": "alerta", "detalhe": "tem gente que perde", "detalheEm": 15.96},
    {"tipo": "topicos", "de": 16.95, "ate": 24.1, "itens": [{"texto": "Compra por impulso", "em": 17.73}, {"texto": "Moeda sem critério", "em": 19.21}, {"texto": "Risco que não entende", "em": 21.25}]},
    {"tipo": "pergunta", "de": 24.1, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58},
    {"tipo": "foco", "de": 28.0, "ate": 30.4, "titulo": "Aula gratuita", "detalhe": "pra te explicar", "toqueEm": 28.2, "travaEm": 28.84, "selo": "Na mira"},
    {"tipo": "passos", "de": 30.4, "ate": 33.65, "titulo": "Como eu analiso", "itens": [{"texto": "Mercado", "em": 30.91}, {"texto": "Riscos", "em": 31.86}, {"texto": "Escolha dos ativos", "em": 32.29}]},
    {"tipo": "frase", "de": 33.65, "ate": 35.15, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro", "riscoEm": 34.03},
    {"tipo": "pergunta", "de": 35.15, "ate": 40.0, "texto": "Você quer entender antes de decidir e correr o risco de perder o seu patrimônio?", "em": 35.23, "opcoes": [{"texto": "Entender antes", "em": 35.93}, {"texto": "Perder o patrimônio", "em": 38.81}]},
    {"tipo": "cta", "de": 40.0, "ate": 43.067, "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "em": 40.05}
  ]
}
```

Leitura do mapa: número (US$ 83.000 contando) → definição (Bull market) → comparação (mercado subindo × bolso, vence o mercado) → destaque de alerta ("Para a maioria … tem gente que perde") → lista dos três motivos → pergunta → `foco` com o selo "Na mira" (a assinatura) → passos (Mercado, Riscos, Escolha dos ativos) → frase com "promessa de lucro" riscada → pergunta com duas opções → `cta` de link.
