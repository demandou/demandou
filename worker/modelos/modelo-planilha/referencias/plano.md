# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastro do rosto), `zona` (não usada aqui), `cortesEm` e `palavras`. Você preenche `marca`, `planilha`, `tabela`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json` (cada palavra tem `em` e `ate`). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita: nada entra na tela antes de ser dito.

## Sumário

1. Campos gerais
2. A gramática da planilha (onde ficam a pessoa e o conteúdo)
3. Os 11 blocos universais
4. A assinatura: `linha`, `tabela`, `preencher` (e `celula`)
5. Os lugares da pessoa
6. Do mapa ao plano
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Moura", "area": "Contador" },
  "planilha": { "arquivo": "Deduções do IR", "abas": ["Simplificada", "Completa"], "aba": 0 },
  "tabela": { "colunas": ["Despesa", "Dedutível?", "Limite"], "tipo": "marca", "total": "Total" },
  "sfx": true,
  "correcoes": { "para a": "pra" }
}
```

- `marca.nome` e `marca.area`: a etiqueta no pé da célula da pessoa ("Tiago Moura · Contador"). Nome até ~18 caracteres. A área só aparece quando cabe inteira. Vazio = sem etiqueta.
- `planilha.arquivo`: o nome do arquivo na barra de título, até ~26 caracteres, tirado do assunto da fala ("Bitcoin e bull market", "Roteiro Lisboa", "Rotina de sono"). Nunca o nome de um programa.
- `planilha.abas`: as abas embaixo, 1 a 3, até ~14 caracteres cada; `aba`: índice da que começa ativa. Qualquer momento troca a aba ativa (ou cria uma nova) com `"aba": { "nome": "...", "em": ... }`, na palavra dita: bom para marcar uma virada da fala ("Aula gratuita", "Próxima declaração").
- `tabela`: vale para as `linha` (seção 4). `colunas`: os títulos das 3 colunas (caixa alta na tela), até ~12, ~10 e ~14 caracteres. `tipo`: `"marca"` (padrão: a coluna 2 recebe ✓/✗ e o total conta) ou `"numero"` (a coluna 2 recebe valores e o total soma; com `prefixo` "R$" e `casas` 0 ou 2). `total`: rótulo da linha de total, até ~12 caracteres; `false` tira a linha.
- `enquadramento` (opcional): `{ "zoom": 0.9, "ancoraY": 0.03 }` multiplica o zoom de todos os lugares e desce (+) ou sobe (−) o rosto dentro da célula. Use só se o cabelo ou o queixo aparecerem cortados nos quadros (o template já confere a cabeça pelo rastro do rosto).
- `sfx`: `false` desliga os sons.
- `rosto`, `videoAltura`, `palavras`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática da planilha

A tela inteira é uma planilha fictícia: barra de título com o nome do arquivo, barra de ferramentas, **barra de fórmula** (caixa de nome com o endereço + "fx" + o texto), cabeçalhos A B C D e 1, 2, 3…, a grade, as abas embaixo e a barra de status.

- **A pessoa é uma célula mesclada**, sempre por cima das outras. Ela muda de lugar na fronteira de cada momento (0,55 s, com o contorno tracejado de "recortar" no lugar novo) — veja a seção 5.
- **O conteúdo entra em células encaixadas na grade**, conforme o lugar da pessoa:
  - pessoa **grande** (embaixo): uma **célula de cima** (linhas 1–3, 992 × 300 px);
  - pessoa **alta** (em cima): uma **célula larga embaixo** (linhas 8–11, 992 × 460 px; com gravação muito perto da câmera, linhas 10–11, 992 × 332 px, porque a pessoa precisa de mais altura);
  - pessoa na **faixa** de cima (esquerda, direita ou estreita): uma **célula ao lado** dela (448, 312 ou 544 × 500 px) e a **área de baixo** inteira (992 × 656 px) para a tabela ou o gráfico.
- **Tudo é digitado** na palavra dita, letra a letra, com o cursor de texto piscando. O **cursor de célula** (borda framboesa com a alça de preencher) pula para a célula da vez; a letra da coluna e o número da linha acendem; a caixa de nome mostra o endereço ("A7", "C9", "A7:A9").
- **A barra de fórmula mostra o que está sendo digitado** (texto, valor, fórmula em mono). Fora dos momentos, ela é a legenda.
- **Esboço "a lápis":** toda célula nasce com barras cinza, círculos e etiquetas tracejadas no lugar do que vai entrar; cada parte ganha cor na sua palavra.
- **Trocas sem quadro vazio e sem páginas sobrepostas** (o template cuida): a célula nova limpa o lugar dela de uma vez; o conteúdo antigo fica até a pessoa deslizar por cima dele (como uma cortina) ou é apagado logo antes de o novo escrever.
- **Todo texto é medido** com as larguras reais da fonte: o corpo desce até um mínimo legível e quebra em 2 ou 3 linhas. Passou dos limites abaixo, encurte com as palavras da fala.

## 3. Os 11 blocos universais

Os mesmos `tipo` e campos de todos os modelos do pack, desenhados como planilha. Campos comuns: `tipo`, `de`, `ate`, `legenda?`, `pessoa?` (seção 5) e `aba?`.

### `abertura` — o título digitado em cima da pessoa

Pessoa **grande** com um empurrão lento de 3%; o texto é digitado na célula de cima, palavra por palavra. `destaque` = trecho exato em framboesa. `selo` (próprio da planilha): o complemento falado logo depois, numa etiqueta que se confirma (✓) no `confirmaEm`.

```json
{ "tipo": "abertura", "de": 0, "ate": 4.45, "texto": "3 despesas que podem diminuir o seu imposto de renda", "destaque": "imposto de renda",
  "selo": { "texto": "na declaração completa", "confirmaEm": 4.0 }, "aba": { "nome": "Completa", "em": 4.0 } }
```

- `texto` até ~55 caracteres (3 linhas). `em` (opcional): quando o texto começa a ser dito (padrão `de`). `titulo` é o nome antigo de `texto` e continua valendo.

### `topicos` — lista sem ordem: uma tabela que se preenche linha a linha

Pessoa na faixa. A área de baixo vira uma tabela: cabeçalho com o `titulo` e uma linha por item, digitada na palavra dele; o `detalhe` entra na coluna C. A célula ao lado da pessoa mostra **o item da vez** grande, com "2/4" e uma barrinha de células que se pinta a cada item.

```json
{ "tipo": "topicos", "de": 14.9, "ate": 23.7, "titulo": "Tem gente que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.78 }, { "texto": "Risco sem entender", "em": 21.75 } ] }
```

- 2 a 5 itens. `texto` até ~30 caracteres (quebra em 2 linhas); `detalhe` (opcional) até ~30, no `detalheEm` (padrão: quando as palavras dele são ditas). `titulo` até ~30.
- Da planilha: `marca: "sim" | "nao"` num item põe ✓ ou ✗ no fim da linha (no `marcaEm`).

### `passos` — sequência: a série 1, 2, 3 arrastada pela alça de preencher

Pessoa na faixa. Embaixo, a coluna A recebe 1, 2, 3… (a seleção desce pela coluna, como quem arrasta a alça de preencher) e um traço liga um número ao seguinte; o texto do passo é digitado em B–C, com o `detalhe` embaixo. A célula ao lado mostra o número grande do passo ("2/3"), o texto do passo e uma barra de progresso.

```json
{ "tipo": "passos", "de": 30.0, "ate": 33.75, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- 2 a 5 itens **em ordem**. Mesmos limites dos tópicos.

### `numero` — o valor é digitado e a célula formata e conta

Pessoa **grande**; a célula de cima mostra o `rotulo` em caixa alta e o número grande contando até `valor` (formato pt-BR), com um traço que se desenha embaixo quando a conta termina. A barra de fórmula mostra o valor cru sendo digitado ("83000"); o botão R$ ou % da barra de ferramentas acende.

```json
{ "tipo": "numero", "de": 0, "ate": 4.6, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "valor": 83000, "prefixo": "US$", "em": 1.34 }
```

- `prefixo` ("R$", "US$"), `sufixo` ("%", " mil", " kg"), `casas` (0 a 2). `rotulo` até ~30 caracteres. `ilustrativo: true` mostra a etiqueta "ilustrativo" (só para número que é um exemplo combinado com o usuário). `formula` (opcional): o que aparece na barra de fórmula no lugar do valor cru ("=12%*RENDA").
- Só número dito (ou calculado do que foi dito). Número que é nome (linha 28, ano, código) não conta: use `destaque` ou um exemplo de `linha`.

### `comparacao` — duas linhas com formatação condicional

A célula (larga ou de cima) vira duas linhas: cada lado com o `rotulo` em caixa alta e o `texto` grande. Com `vencedor`, a linha vencedora ganha o fundo framboesa-claro e ✓, a outra ✗ e o texto apagado, no `vencedorEm`. `modo`: `"contra"` (× entre as linhas), `"antes-depois"` (↓) ou `"errado-certo"` (sem vencedor: ✗ na primeira e ✓ na segunda, cada uma quando termina de ser dita).

```json
{ "tipo": "comparacao", "de": 8.55, "ate": 12.85, "vencedor": 0, "vencedorEm": 12.2,
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "não significa dinheiro", "em": 9.87 } ] }
```

- `rotulo` até ~20 caracteres (entra quando é dito, antes ou depois do texto); `texto` até ~45 (2 linhas). `titulo` (opcional) aparece em cima quando a célula é alta.

### `grafico` — os dados entram nas células e o gráfico se desenha

Pessoa **estreita** (coluna C). A célula ao lado vira o intervalo de dados (rótulo | valor), cada linha digitada e contando na sua palavra; a área de baixo é o gráfico da planilha, com o `titulo` no cabeçalho: barras que crescem (a da vez em framboesa), linha que avança de ponto em ponto, ou pizza (rosca) que se fatia. O ícone de gráfico da barra de ferramentas acende.

```json
{ "tipo": "grafico", "de": 11.2, "ate": 13.6, "forma": "barras", "titulo": "Vendas por trimestre", "unidade": "mil",
  "dados": [ { "rotulo": "1º trimestre", "valor": 120, "em": 11.4 }, { "rotulo": "2º trimestre", "valor": 340, "em": 11.9 } ] }
```

- `dados`: 2 a 6 números **ditos**; `rotulo` até ~14 caracteres. `unidade`: "R$"/"US$" vira prefixo, o resto sufixo ("mil", "%", "kg"); ou use `prefixo`/`sufixo`/`casas`.
- **Sem números ditos:** `"tendencia": "sobe" | "cai" | "oscila"`, `"tendenciaEm"` e `"ilustrativo": true`. A forma se desenha ao longo do momento (linha com área, ou barras que crescem uma a uma) e a etiqueta "ilustrativo" fica visível; a célula ao lado mostra a seta da tendência.

### `destaque` — formatação condicional

Pessoa **grande**; a frase curta é digitada na célula de cima e, quando termina, a regra condicional pinta a célula: `"nivel": "alerta"` = célula framboesa com texto branco e ícone de alerta; `"chave"` (padrão) = framboesa-claro com ícone de chave. `detalhe` entra embaixo, menor.

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.85, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto` até ~45 caracteres (2 linhas); `detalhe` até ~50, no `detalheEm`.

### `definicao` — o termo na célula, o significado numa nota presa a ela

O `termo` é digitado grande; o triângulo de "célula com nota" aparece no canto e, no `significadoEm`, a nota abre presa por um traço, com o significado digitado.

```json
{ "tipo": "definicao", "de": 4.6, "ate": 8.55, "termo": "Bull market", "em": 5.3, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` até ~22 caracteres (1 linha); `significado` até ~80 (até 3 linhas).

### `frase` — digitada, com destaque e tachado

A frase é digitada com uma barra framboesa que cresce ao lado; `destaque` fica em framboesa; `risco` é **tachado** (um traço framboesa) no `riscoEm`, como o botão de tachado da planilha.

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.15, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro", "riscoEm": 34.75 }
```

- `texto` até ~70 caracteres (3 linhas). `em` (opcional): quando a frase começa a ser dita.

### `pergunta` — digitada, com as opções numa lista suspensa

Um selo "?" e a pergunta digitada. Com `opcoes` (2 a 4), elas entram cada uma na sua palavra: numa lista suspensa aberta (célula alta) ou em etiquetas de lista suspensa com ▾ (célula baixa); a última dita fica selecionada. Sem opções, um campo de resposta espera com o cursor piscando.

```json
{ "tipo": "pergunta", "de": 35.15, "ate": 39.95, "texto": "Você quer", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto` até ~70 caracteres; cada opção até ~28.

### `cta` — o fechamento

A célula larga embaixo da pessoa recebe a chamada digitada e o ícone num ladrilho que se preenche no `iconeEm` (padrão: a primeira palavra da chamada). `icone`: `salvar` (o arquivo passa a "Salvo"), `seguir`, `comentar` ou `link`. Fica até o fim do vídeo.

```json
{ "tipo": "cta", "de": 39.95, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto` até ~50 caracteres (2 ou 3 linhas). `em`: quando a chamada começa a ser dita.

## 4. A assinatura: a tabela que se preenche no ritmo da fala

Use pelo menos uma vez (o `conferir.mjs` exige `linha`, `tabela` ou `preencher`). Ela serve para qualquer assunto em que coisas são **avaliadas uma a uma**: despesas, erros, sinais, paradas de um roteiro, hábitos, etapas com um "sim/não".

### `tabela` — a tabela inteira num momento (listas rápidas)

Pessoa na faixa; a área de baixo vira uma tabela de 3 colunas: o item (A), a marca (B: ✓, ✗ ou um número) e o detalhe (C), cada um digitado na sua palavra. A linha de total conta (ou soma) e fecha com o traço duplo de contabilidade e a fórmula (`=CONT.SE(...)` ou `=SOMA(...)`) na barra. A célula ao lado mostra o `titulo` e a linha da vez ampliada, com a marca.

```json
{ "tipo": "tabela", "de": 14.85, "ate": 23.7, "titulo": "Tem gente que perde", "colunas": ["Atitude", "Critério?", "Como"], "conta": "nao", "total": "Total",
  "linhas": [
    { "texto": "Compra", "em": 17.73, "detalhe": "por impulso", "detalheEm": 18.21, "marca": "nao", "marcaEm": 18.75 },
    { "texto": "Escolhe moeda", "em": 19.21, "detalhe": "sem critério", "detalheEm": 20.18, "marca": "nao", "marcaEm": 20.75 },
    { "texto": "Assume risco", "em": 21.25, "detalhe": "que não entende", "detalheEm": 22.16, "marca": "nao", "marcaEm": 22.9 } ] }
```

- 2 a 5 linhas. `texto` até ~16 caracteres (coluna A, até 2 linhas); `detalhe` até ~24. `marca`: `"sim"` (✓), `"nao"` (✗) ou um número (com `prefixo` e `casas` no momento: o total soma).
- `colunas` (padrão: as de `plano.tabela`), `total` (rótulo; `false` tira), `conta`: o total conta os ✓ (`"sim"`, padrão) ou os ✗ (`"nao"`).
- Sem número dito, use ✓/✗: a marca resume a fala ("sem critério" → ✗ na coluna "Critério?"). Não invente valores.

### `linha` — um item por momento (a pessoa muda de lado a cada um)

Para itens com tempo para respirar (3 a 6 s cada). A pessoa vai para a faixa (esquerda e direita, alternando); a tabela se acumula embaixo, com as colunas de `plano.tabela`; cada `linha` preenche a sua.

```json
{ "tipo": "linha", "de": 4.45, "ate": 9.55,
  "item": { "texto": "Saúde", "em": 4.57 },
  "exemplos": [ { "texto": "Consultas", "em": 5.5 }, { "texto": "Exames", "em": 6.4 }, { "texto": "Plano de saúde", "em": 7.14 } ],
  "marca": { "em": 7.95 }, "detalhe": { "texto": "sem limite", "em": 8.4 },
  "destaque": { "tipo": "infinito", "rotulo": "Saúde", "icone": "saude", "texto": "sem limite de valor", "em": 8.5 } }
```

- `item.texto` até ~16 caracteres (quebra em 2 linhas sem etiqueta). `item.etiqueta` (opcional): selo curto embaixo ("privada · PGBL"), até ~16, palavras faladas.
- `exemplos` (até 3, cada um até ~16): abrem numa sub-linha como etiquetas, cada uma no seu `em`.
- `marca.em`: o ✓ (padrão), `"valor": "nao"` (✗) ou um número (com `plano.tabela.tipo: "numero"`).
- `detalhe`: a coluna C, até ~24 caracteres. `formula` (opcional): `{ "texto": "=12% × RENDA_TRIBUTÁVEL", "em": 16.85, "enterEm": 18.75 }` é digitada na barra e na célula; no `enterEm` a célula mostra o `detalhe` como resultado.
- `destaque` (opcional): a célula ao lado da pessoa, que ilustra a linha. Sem ele, a célula mostra o item da vez ampliado (com "1/3" e a marca). Tipos:
  - `infinito` — o ∞ se desenha e a frase entra embaixo ("sem limite", "para sempre", "ilimitado"). `texto` até ~22.
  - `regras` — até 3 regras curtas, cada uma com ícone num quadradinho que acende no seu `em`. `texto` até ~20.
  - `pizza` — a fatia `pct` cresce no `em` com o número contando; `texto` entra no `textoEm`. Só porcentagem dita.
  - `numero` — um número grande conta até `valor` (com `prefixo`, `sufixo`, `casas`) e `texto` embaixo. Só quantidade dita.
  - `icone` — um ícone grande se desenha no `em` e a frase entra embaixo (`texto`, até ~32).
  - Todos têm `rotulo` (caixa alta no alto, até ~20) e `icone` opcional.
- Até 4 `linha` por vídeo; as seguidas formam a mesma tabela, e o total fecha com o traço duplo depois da última marca.

### `preencher` — uma marca em todas as linhas

Depois das `linha`: o cursor seleciona a coluna A e arrasta para baixo; cada linha ganha o ícone `marca` (uma a cada 0,2 s a partir do `em`); a frase dita entra na célula ao lado, com um ícone grande. Para o que vale para todas as linhas: "guarda os comprovantes", "dá pra fazer tudo de transporte público", "faz isso todo dia".

```json
{ "tipo": "preencher", "de": 19.17, "ate": 21.25, "texto": "Guarda todos os comprovantes", "icone": "comprovante", "marca": "clipe", "em": 19.5 }
```

- `texto` até ~45 caracteres. `em`: a palavra "todos/tudo/cada".

### `celula` — uma frase ou uma conta numa célula larga

Pessoa alta; a célula larga recebe a frase digitada (com `rotulo` em cima) e, se houver `numero`, ele conta no `em` (a `formula` dele vai para a barra). Para a conta que fecha uma tabela numérica.

```json
{ "tipo": "celula", "de": 16.0, "ate": 19.2, "rotulo": "Total do mês", "texto": "Quanto sai do caixa todo mês", "destaque": "caixa",
  "numero": { "valor": 2270, "prefixo": "R$", "em": 17.5, "formula": "=SOMA(B7:B9)" } }
```

### Ícones disponíveis

Gerais: `lista`, `lampada`, `alvo`, `chave`, `alerta`, `relogio`, `calendario`, `pessoa`, `livro`, `coracao`, `estrela`, `mundo`, `sol`, `pino`, `bonde`, `aviao`, `mala`, `casa`, `carro`, `cartao`, `dinheiro`, `documento`, `porcentagem`, `grafico`, `sobe`, `cai`, `oscila`, `teto`, `saude`, `educacao`, `previdencia`. Marcas: `check`, `xis`, `clipe`, `comprovante`. Fechamento: `salvar`, `seguir`, `comentar`, `link`. Todos a traço, genéricos. Ícone novo: veja `references/estilo.md`.

## 5. Os lugares da pessoa

| Lugar | Onde (células) | O conteúdo fica | Padrão de |
|---|---|---|---|
| `grande` | A–C, linhas 4–11 | na célula de cima (linhas 1–3) | `abertura`, `numero`, `destaque` |
| `alto` | A–C, linhas 1–7 (1–9 com gravação perto da câmera) | na célula larga de baixo | `frase`, `definicao`, `pergunta`, `comparacao`, `cta`, `celula` |
| `esquerda` | A–B, linhas 1–5 | célula em C + área de baixo | blocos da faixa (alternando) |
| `direita` | B–C, linhas 1–5 | célula em A + área de baixo | blocos da faixa (alternando) |
| `estreita` | C, linhas 1–5 | célula em A–B + área de baixo | `grafico`, `linha` com pizza |
| `cheia` | A–C, linhas 1–11 | — (a fala na barra de fórmula) | trechos sem momento |

- Blocos da faixa (`linha`, `tabela`, `topicos`, `passos`, `preencher`, `grafico`) alternam esquerda e direita.
- Dois blocos de uma célula seguidos no mesmo lugar trocam (grande ↔ alto), para a pessoa sempre se mover; o `cta` fica sempre embaixo.
- `"pessoa"` força um lugar: blocos de uma célula aceitam `grande` ou `alto`; blocos da faixa aceitam `esquerda`, `direita` ou `estreita`. Use só com motivo (os padrões já evitam cobrir o rosto e cortar texto).

## 6. Do mapa ao plano

Siga `references/adaptar.md` (mapa editorial). Para cada batida, este é o bloco da planilha:

| A fala traz… | Bloco |
|---|---|
| a promessa, o tema, a pergunta inicial | `abertura` |
| um número dito (preço, quantidade, porcentagem) | `numero` |
| um termo explicado | `definicao` |
| dois lados (A × B, antes × depois, errado × certo) | `comparacao` |
| alerta, risco, palavra-chave | `destaque` |
| enumeração rápida (motivos, erros, sinais) que dá para avaliar com ✓/✗ | **`tabela`** (assinatura) |
| enumeração sem avaliação | `topicos` |
| itens com tempo, um de cada vez (3–6 s cada) | **`linha`** (assinatura) |
| o que vale para todos os itens já ditos | **`preencher`** (assinatura) |
| sequência, processo, caminho | `passos` |
| números ditos em série, ou algo que sobe/cai | `grafico` |
| frase de efeito, opinião, "sem promessa de…" | `frase` |
| pergunta para quem assiste | `pergunta` |
| chamada final | `cta` |

- Momentos **encostados** (o `ate` de um = o `de` do seguinte), com as fronteiras nos cortes (`cortesEm`) ou nas pausas entre frases.
- Não repita o mesmo bloco três vezes seguidas (exceto `linha`, que forma a tabela).
- Fala sem número: use ✓/✗, `topicos`, `passos`, `grafico` com `tendencia` (ilustrativo). Nunca preencha com número chutado.

## 7. Regras de tempo

- O primeiro momento começa em 0; o `ate` do último é a `duracao`.
- A troca de lugar da pessoa dura 0,55 s a partir do `de`: ponha o `de` num corte ou numa pausa, logo antes da primeira palavra da batida.
- Cada `em` é a palavra dita: o cursor pula 0,1 s antes e a célula é digitada a partir dela. Textos de várias palavras se acham sozinhos na fala: escreva com as palavras ditas, na ordem em que são ditas (algarismos casam com números falados; "pra" casa com "para").
- Entre dois sub-passos, pelo menos ~0,35 s.
- Nada parado mais de ~2,5 s: um momento com mais de ~4 s precisa de itens entrando por dentro dele.
- Só pessoa e legenda: no máximo ~3 s (o `conferir.mjs` reprova trechos maiores).

## 8. Legenda, correções e sons

A legenda é a **barra de fórmula**: nos trechos sem momento, a fala aparece digitada nela. Dentro dos momentos ela mostra o que está sendo digitado. `"legenda": true` mantém a legenda durante um momento; `semLegenda` tira trechos extras. `node scripts/legendas.mjs` lista as linhas.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "para a": "pra", "P G B L": "PGBL", "né": "" }`.

Sons (automáticos, tonais, discretos): um toque grave quando cada item entra (a nota sobe a cada linha), duas notas no ✓, um acorde curto quando um número ou fórmula dá resultado, um arpejo no preencher e no gráfico sem números, uma nota curta na aba, na nota da definição e no tachado, duas notas descendo ao salvar. `"sfx": false` desliga.

## 9. Exemplos completos

### Demo (contador, 23 s): abertura, três `linha`, `preencher`, `cta`

```json
{
  "marca": { "nome": "Tiago Moura", "area": "Contador" },
  "planilha": { "arquivo": "Deduções do IR", "abas": ["Simplificada", "Completa"], "aba": 0 },
  "tabela": { "colunas": ["Despesa", "Dedutível?", "Limite"], "tipo": "marca", "total": "Total" },
  "correcoes": { "para a": "pra" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 4.45, "texto": "3 despesas que podem diminuir o seu imposto de renda", "destaque": "imposto de renda",
      "selo": { "texto": "na declaração completa", "confirmaEm": 4.0 }, "aba": { "nome": "Completa", "em": 4.0 } },
    { "tipo": "linha", "de": 4.45, "ate": 9.55, "item": { "texto": "Saúde", "em": 4.57 },
      "exemplos": [ { "texto": "Consultas", "em": 5.5 }, { "texto": "Exames", "em": 6.4 }, { "texto": "Plano de saúde", "em": 7.14 } ],
      "marca": { "em": 7.95 }, "detalhe": { "texto": "sem limite", "em": 8.4 },
      "destaque": { "tipo": "infinito", "rotulo": "Saúde", "icone": "saude", "texto": "sem limite de valor", "em": 8.5 } },
    { "tipo": "linha", "de": 9.55, "ate": 13.88, "item": { "texto": "Educação", "em": 9.63 },
      "exemplos": [ { "texto": "Escola", "em": 10.66 }, { "texto": "Faculdade", "em": 11.09 } ],
      "marca": { "em": 11.8 }, "detalhe": { "texto": "anual por pessoa", "em": 12.5 },
      "destaque": { "tipo": "regras", "rotulo": "Educação", "icone": "educacao",
        "linhas": [ { "texto": "limite anual", "icone": "calendario", "em": 12.26 }, { "texto": "por pessoa", "icone": "pessoa", "em": 12.85 } ] } },
    { "tipo": "linha", "de": 13.88, "ate": 19.17, "item": { "texto": "Previdência", "em": 13.97, "etiqueta": "privada · PGBL" },
      "marca": { "em": 16.5 }, "formula": { "texto": "=12% × RENDA_TRIBUTÁVEL", "em": 16.85, "enterEm": 18.75 },
      "detalhe": { "texto": "até 12% da renda", "em": 18.75 },
      "destaque": { "tipo": "pizza", "rotulo": "Previdência privada", "icone": "previdencia", "pct": 12, "em": 16.89, "texto": "da renda tributável", "textoEm": 17.86 } },
    { "tipo": "preencher", "de": 19.17, "ate": 21.25, "texto": "Guarda todos os comprovantes", "icone": "comprovante", "marca": "clipe", "em": 19.5 },
    { "tipo": "cta", "de": 21.25, "ate": 23.24, "texto": "Salva pra próxima declaração", "destaque": "Salva", "icone": "salvar", "iconeEm": 21.45,
      "aba": { "nome": "Próxima declaração", "em": 21.7 } }
  ]
}
```

### Outro assunto (cripto, 43 s): 11 momentos, nove tipos

`numero` "Bitcoin rompeu" US$ 83.000 → `definicao` Bull market / ciclo de alta das criptomoedas → `comparacao` Mercado: subindo ✓ × No bolso: não significa dinheiro ✗ → `destaque` alerta "Para a maioria das pessoas" → **`tabela`** "Tem gente que perde" (Compra ✗ por impulso · Escolhe moeda ✗ sem critério · Assume risco ✗ que não entende; total 3) → `pergunta` "Como avaliar os projetos e pensar no seu posicionamento?" → `destaque` chave "Aula gratuita" (com a aba nova "Aula gratuita") → `passos` "Como eu analiso": O mercado → Os riscos → A escolha dos ativos → `frase` "Sem promessa de lucro" com "promessa de lucro" tachado → `pergunta` "Você quer" com as opções "Entender antes de decidir" e "Correr o risco de perder" → `cta` link "Toca aqui em Saiba Mais e assiste essa aula". Os campos de cada um estão nos exemplos das seções 3 e 4.
