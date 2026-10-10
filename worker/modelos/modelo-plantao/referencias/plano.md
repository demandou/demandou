# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `barra`, `letreiro`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais (marca, barra, letreiro)
2. A gramática: quadro cheio e tela dividida
3. Os blocos universais (os 11 que todo modelo do pack tem)
4. Os blocos próprios do Plantão (a assinatura)
5. Regras de tempo
6. Texto, números e fidelidade
7. Legenda, correções e sons
8. Exemplo completo (vídeo sobre cripto)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "barra": { "tema": "Bitcoin" },
  "letreiro": { "rotulo": "Resumo", "itens": ["Bitcoin rompeu os US$ 83 mil", "Mercado subindo não significa dinheiro no bolso"] },
  "sfx": true,
  "correcoes": { "Cloud": "Claude" }
}
```

- `marca`: `nome` (até ~18 caracteres) e `area` (a função, até ~16) aparecem na **tarja de nome**, embaixo da manchete, da abertura e do fechamento. `nome` vazio = sem tarja de nome.
- `barra`: a barra vermelha "EXPLICANDO" com relógio, no alto à esquerda. Entra sozinha (logo depois da vinheta, ou em 0,2 s) e fica até o fim; o relógio conta o tempo e **para na última palavra**.
  - `tema` (opcional): o assunto numa tarja branca ao lado do relógio (até ~14 caracteres: "Bitcoin", "Cachorro", "Vendas"). Acende quando a palavra é dita; se ela não é dita depois do começo, use `temaEm` (ex.: 0.5).
  - `texto` (opcional): troca "EXPLICANDO" por outra palavra curta em caixa-alta (até ~12 letras: "ALERTA", "RESUMINDO").
  - `meta` (opcional): os segundos prometidos ("entenda em 30 segundos"): o anel do relógio enche nesse tempo.
  - `de` (opcional): quando a barra entra.
- `letreiro`: as frases que correm na base (o "resumo da notícia"). Escreva 3 a 5 frases curtas **que resumem a fala**, fiéis a ela. `rotulo` (até ~10 letras; padrão "Resumo"). Sem `itens`, não há letreiro.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática: quadro cheio e tela dividida

Cada bloco escolhe sozinho o quadro da pessoa:

| Quadro | Blocos | A pessoa | A tela |
|---|---|---|---|
| **Cheio** | `abertura`, `manchete`, `vinheta`, `destaque`, `definicao`, `pergunta` sem opções, `cta` e trechos sem momento | quadro cheio, rosto na linha do centro | tarja de TV na altura do peito, sempre abaixo do queixo |
| **Dividida** | `topicos`, `passos`, `numero`, `dado`, `comparacao`, `grafico`, `frase`, `pergunta` com opções, `etiqueta`, `nota` | sobe para a metade de cima, cortada logo abaixo do queixo | painel azul do estúdio embaixo, com o fio azul elétrico na divisa |

Por cima de tudo, sempre: a barra "EXPLICANDO" e o letreiro.

O template já cuida das trocas:
- **Cheio → dividida**: a troca começa 0,2 s antes do `de` e leva 0,5 s; o painel já está desenhado atrás da pessoa, que encolhe revelando-o. O corte da fala cai no meio do movimento.
- **Dividida → dividida** (painéis colados): a pessoa fica; uma faixa azul elétrico atravessa o painel da esquerda para a direita (0,45 s), o painel novo aparece à esquerda dela e o antigo some à direita. Nunca os dois textos juntos.
- **Dividida → cheio**: a pessoa cresce por cima do painel (é a cortina) e a tarja entra quando ela já cobriu tudo.
- **Cheio → cheio**: a tarja que sai desliza para a esquerda enquanto a nova abre varrendo.
- Dentro de cada trecho a câmera se aproxima devagar (3,5%); um corte no meio de um trecho em quadro cheio ganha um reenquadramento seco.

Ritmo: alterne. Um vídeo de 30–45 s costuma ter 3 a 5 idas e voltas entre cheio e dividida. Painéis seguidos funcionam (a cortina faz a troca), mas mais de ~15 s seguidos em painel cansa; uma tarja entre dois painéis precisa de pelo menos ~1,8 s.

## 3. Os blocos universais

Campos comuns a todos: `tipo`, `de`, `ate` e `legenda?` (true = a legenda continua durante o momento; quase nunca). Todo campo `em`/`…Em` é o instante de uma palavra dita.

### `abertura` — quadro cheio

```json
{ "tipo": "abertura", "de": 0, "ate": 3.2, "texto": "Três erros que travam suas vendas", "destaque": "travam suas vendas", "em": 0.2, "chapeu": "Vendas" }
```

- `texto`: até ~60 caracteres (até 3 linhas, 60–112 px). Monta palavra por palavra a partir de `em` (padrão: `de`).
- `destaque` (opcional): trecho exato do texto em azul elétrico. `chapeu` (próprio, opcional): 1 a 3 palavras na aba azul.

### `topicos` — painel, lista sem ordem (2 a 5 itens)

```json
{ "tipo": "topicos", "de": 17.7, "ate": 23.95, "titulo": "Tem gente que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.78, "detalhe": "sem estudar", "detalheEm": 20.4 } ] }
```

- `titulo` (opcional): até ~36 caracteres, cabeçalho branco com o marcador azul.
- `itens[].texto`: 2 a 6 palavras (até ~32 caracteres; uma linha, 30–60 px). `em` = a primeira palavra do item. `detalhe` (opcional): até ~24 caracteres, menor, na mesma tarja; `detalheEm` = quando é dito.

### `passos` — painel, sequência (2 a 5 itens)

Mesmos campos de `topicos`. Etapas numeradas num trilho que acende de uma para a outra. Use quando a ordem importa (processo, caminho, "primeiro… depois…").

### `numero` — painel, o número que conta

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número (sem formatação); aparece no formato brasileiro ("83.000", "1,5"). `casas`: casas decimais.
- `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "kg", "anos"): ganham espaço quando são palavras.
- `rotulo`: até ~40 caracteres (2 linhas); `rotuloEm` = quando é dito (padrão: começo do momento).
- `ilustrativo: true` mostra o selo "ilustrativo" (número de exemplo que a pessoa deu como exemplo).
- Próprios (opcionais): `apoio` (linha de apoio, até ~60 caracteres; `apoioEm`) e `fonte` (só se a pessoa citou).

### `comparacao` — painel, dois lados

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.8, "titulo": "Na alta", "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "Seu bolso", "texto": "Sem dinheiro", "em": 10.91 } ],
  "vencedor": 0, "vencedorEm": 12.0 }
```

- `modo`: `contra` (× no meio, padrão), `antes-depois` (→ no meio) ou `errado-certo` (o lado 1 ganha o visto e o lado 0 o ×, mesmo sem `vencedor`).
- `lados[].rotulo` até ~16 caracteres (tarja branca); `texto` até ~30 caracteres (até 3 linhas, 40–72 px); `em` = quando o lado é dito.
- `vencedor` (opcional): 0 ou 1; `vencedorEm` = quando o veredito aparece (padrão: logo depois do segundo lado).

### `grafico` — painel

Com números ditos (2 a 6):

```json
{ "tipo": "grafico", "de": 10, "ate": 15, "forma": "barras", "titulo": "Vendas por mês", "unidade": "mil",
  "dados": [ { "rotulo": "Jan", "valor": 12, "em": 10.4 }, { "rotulo": "Fev", "valor": 18, "em": 11.2 }, { "rotulo": "Mar", "valor": 25, "em": 12.1 } ] }
```

Sem números (a forma da ideia, com o selo ILUSTRATIVO):

```json
{ "tipo": "grafico", "de": 5.9, "ate": 8.55, "forma": "linha", "titulo": "Um ciclo de alta", "destaque": "alta", "tendencia": "sobe", "tendenciaEm": 6.15, "ilustrativo": true }
```

- `forma`: `barras` (crescem, o maior em branco), `linha` (anda de ponto em ponto) ou `pizza` (anel que se fatia, com legenda e valores). Sem `dados`, `barras` vira barras na forma da tendência e `pizza` vira linha.
- `dados[].rotulo` até ~14 caracteres (até 2 linhas, 30–34 px); `valor` = o número dito; `em` = quando é dito.
- `tendencia`: `sobe`, `cai` ou `oscila`; `tendenciaEm` = a palavra que nomeia o movimento. Sem `dados`, **`ilustrativo: true` é obrigatório**.
- `unidade`: "R$"/"US$" vira prefixo; o resto ("%", "mil", "kg") vira sufixo.
- `titulo` (até ~34 caracteres) e `destaque` (próprio: o trecho do título que vai numa tarja branca, no lugar dele).
- Próprio: `series` (1 ou 2 linhas com rótulo que sobem ou descem, a primeira branca e a segunda azul-clara). Com `series`, o gráfico desenha as linhas do vídeo de exemplo:
  ```json
  "series": [ { "rotulo": "Preços sobem", "em": 4.06, "sentido": "sobe", "detalhe": { "texto": "de forma geral", "em": 4.9, "feixe": true } },
              { "rotulo": "Seu dinheiro compra menos", "em": 5.93, "sentido": "desce" } ], "eixo": "Tempo"
  ```
  `rotulo` até ~30 caracteres (3 linhas na coluna da direita); `detalhe` até ~18; `feixe: true` desenha linhas finas ao lado ("várias coisas juntas"); `eixo` = rótulo do eixo de baixo ("" esconde). Mantenha `forma`, `tendencia` e `ilustrativo: true` junto (a conferência pede).

### `destaque` — quadro cheio

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta", "detalhe": "mesmo na alta", "detalheEm": 14.93 }
```

- `texto`: até ~40 caracteres (até 3 linhas, 64–124 px). A faixa abre no começo do momento com o texto "a lápis"; as palavras acendem a partir de `em`.
- `nivel`: `alerta` (bloco vermelho com triângulo: risco, erro, perigo) ou `chave` (bloco azul com losango: palavra-chave, padrão).
- `detalhe` (opcional): até ~40 caracteres, numa tarja escura embaixo; `detalheEm` = quando é dito (pode ser antes do `em`).

### `definicao` — quadro cheio

```json
{ "tipo": "definicao", "de": 4.33, "ate": 7.75, "termo": "Chocolate", "em": 4.39, "significado": "Tem teobromina, tóxica para ele", "significadoEm": 5.44 }
```

- `termo`: até ~24 caracteres (até 2 linhas, 60–116 px). `significado`: até ~60 caracteres (até 2 linhas, 38–50 px), na tarja escura com "=" que acende em `significadoEm`.

### `frase` — painel, a citação

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.15, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68, "em": 33.83 }
```

- `texto`: até ~70 caracteres (até 4 linhas, 46–84 px), palavra por palavra a partir de `em`.
- `destaque` (opcional): trecho exato que ganha a tarja branca quando é dito. `risco` (opcional): trecho exato riscado em `riscoEm` (padrão: logo depois de ser dito).

### `pergunta`

Sem opções (quadro cheio): `{ "tipo": "pergunta", "de": 24, "ate": 28, "texto": "Como avaliar os projetos?", "em": 24.58 }` — até ~60 caracteres, 3 linhas.

Com opções (painel de enquete):

```json
{ "tipo": "pergunta", "de": 35.15, "ate": 39.95, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o patrimônio", "em": 37.98 } ] }
```

- `opcoes`: 2 a 4, cada uma até ~40 caracteres (vai a 2 linhas quando precisa), com o `em` da primeira palavra. A pergunta em cima: até ~50 caracteres.

### `cta` — quadro cheio, o fechamento

```json
{ "tipo": "cta", "de": 39.95, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: até ~60 caracteres (até 3 linhas), fiel ao que foi dito. `destaque` (opcional) em azul elétrico.
- `icone`: `seguir` (padrão; "+ Seguir" vira "✓ Seguindo"), `salvar` ("Salvar" vira "Salvo"), `comentar` ou `link` (o elo, "Acesse"). `botao` (próprio): troca o texto do botão (até ~14 caracteres).

## 4. Os blocos próprios do Plantão (a assinatura)

### `etiqueta` — painel, um valor que muda

```json
{ "tipo": "etiqueta", "de": 0, "ate": 4.33, "sentido": "desce",
  "taxa": { "rotulo": "Alimentos", "valor": "3", "em": 0.30 },
  "antes": { "rotulo": "Parecem", "valor": "Inofensivos", "em": 1.77 },
  "depois": { "rotulo": "Para o seu cachorro", "valor": "Fazem mal", "em": 2.69 },
  "sobeEm": 2.67 }
```

- `antes` e `depois`: `rotulo` até ~20 caracteres (30–38 px); `valor` até ~8 caracteres para números ("R$ 100" → "R$ 105": os algarismos rolam como placar) ou até ~14 por linha para palavras (até 2 linhas, 40–104 px; o novo rola para o lugar do antigo); `em` = quando o valor é dito.
- `sobeEm` (opcional): quando a etiqueta começa a andar (padrão: a primeira palavra de `depois.rotulo`, achada na fala).
- `sentido`: `sobe` (padrão: antes embaixo à esquerda → depois em cima à direita) ou `desce` (o contrário: perda, piora, preço que cai).
- `taxa` (opcional): um número ou estado no canto livre (`rotulo` até ~18, `valor` até ~6 caracteres, conta até o valor no `em`).
- `diferenca` (opcional): o selo na quina do trilho ("+R$ 5", "+3 h"). **Confira a conta.**
- Pede uns 3,5 s ou mais (do começo do momento ao `depois.em` + 0,5 s).
- `quadro: "lateral"` (próprio do vídeo de exemplo): o painel em pé à esquerda e a pessoa na coluna da direita. Use só com a pessoa bem centrada e longe da câmera; o padrão (tela dividida) serve para qualquer gravação.

### `nota` — painel, algo que perde força

```json
{ "tipo": "nota", "de": 14.9, "ate": 17.7, "rotulo": "Mesmo na alta", "valor": "Dinheiro", "simbolo": "US$",
  "notaEm": 15.32, "perda": { "texto": "Tem gente que perde", "em": 15.96 } }
```

- `valor`: o que vai impresso: dinheiro ("R$ 100": o símbolo vai no selo), um número ("8 horas") ou uma palavra ("Carinho").
- `simbolo` (opcional): o selo redondo (padrão: o símbolo da moeda do valor; sem moeda, sem selo).
- `rotulo`: a linha de cima, até ~30 caracteres. `notaEm`: quando a nota chega. `paradoEm` (opcional): o selo de pausa ("parado").
- `perda.texto`: a linha de baixo, até ~28 caracteres, com ▼; `perda.em`: quando a nota começa a encolher (leva até o fim do momento: deixe ~1 s ou mais depois dele).
- `escala` (0,5–0,92; padrão 0,72): o tamanho final. É metáfora — não escreva porcentagem de perda que não foi dita.

### `manchete` — quadro cheio, o GC

```json
{ "tipo": "manchete", "de": 2.85, "ate": 5.9, "chapeu": "Reacendeu a conversa", "titulo": "O novo bull market", "destaque": "bull market" }
```

- `titulo`: até ~32 caracteres (1 ou 2 linhas, 60–116 px). `chapeu` (opcional): até ~24 caracteres na aba azul. `destaque` (opcional) em azul elétrico. `tarja: false` esconde a tarja de nome.

### `vinheta` — quadro cheio, só na abertura

```json
{ "tipo": "vinheta", "de": 0, "ate": 2.25, "titulo": "Entenda", "subtitulo": "em 30 segundos" }
```

- `titulo`: **uma palavra dita**, até ~10 letras. `subtitulo` (opcional): até ~24 caracteres, dito logo depois; um número nele dispara o cronômetro.

### `dado` — painel (formato antigo do número)

`{ "tipo": "dado", "rotulo": "Taxa básica de juros", "valor": "10,5%", "em": 8.9, "apoio": "a maior em sete anos", "fonte": "Fonte: Banco Central" }` — o valor já escrito como texto. Prefira `numero`.

## 5. Regras de tempo

- **Fronteiras na pausa entre frases**: o `de` de um momento = o `ate` do anterior = o valor de `cortesEm` que fica entre as duas frases (sem corte: o `em` da primeira palavra menos 0,1). O primeiro começa em 0; o `ate` do último é a `duracao`.
- Sub-passos (`em`, `…Em`, `itens[].em`, `opcoes[].em`, `dados[].em`, `lados[].em`): o `em` da palavra que nomeia o item, tirado de `work/palavras.json`. Nada aparece antes de ser dito.
- A primeira coisa de um painel acende até ~1,5 s depois de ele abrir; nada fica parado mais de ~2,5 s (a conferência reprova acima de 4,5 s).
- Painel: de ~2 s a ~8 s (abaixo de 2 s a troca come metade do tempo). Tarja: de ~1,8 s em diante.
- Não repita o mesmo bloco três vezes seguidas.

## 6. Texto, números e fidelidade

- Use as palavras da fala, na ordem em que são ditas (o template procura cada palavra na fala para acendê-la no tempo certo). Pode enxugar ("os preços sobem" → "Preços sobem"). Números em algarismo casam com a palavra falada ("3" ↔ "três").
- Números no formato brasileiro: "R$ 1.412", "10,5%", "3 milhões". No `numero` e no `grafico`, `valor` é número puro; a formatação é automática.
- Não acrescente número, data, fonte ou fato que a pessoa não disse. O letreiro também só resume a fala.
- Formas sem números (tendência, nota que encolhe, etiqueta de palavras) são metáforas: o gráfico sem dados leva `ilustrativo: true`.
- Diga na entrega quais contas aparecem na tela.

## 7. Legenda, correções e sons

- A legenda é montada sozinha a partir de `palavras`: uma linha "closed caption" (tarja azul-noite, logo acima do letreiro). Ela **some durante os momentos** e aparece nos trechos sem momento. `semLegenda` acrescenta faixas sem legenda.
- Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Selique": "Selic" }`. Valem também para achar as palavras dos textos na fala. Não edite `palavras` à mão.
- Sons automáticos (nunca dois a menos de 0,45 s): duas notas na vinheta e na abertura, um "vum" grave na troca de quadro (mais baixo na cortina entre painéis), uma nota subindo (dó, mi, sol) quando um item, número, opção ou dado acende, duas notas descendo na perda da nota, na etiqueta que desce e no destaque de alerta, um acorde curto quando a chamada termina.

## 8. Exemplo completo (vídeo sobre cripto, 43 s, sem cortes internos)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "barra": { "tema": "Bitcoin", "temaEm": 0.5 },
  "letreiro": { "rotulo": "Resumo", "itens": [
    "Bitcoin rompeu os US$ 83 mil e reacendeu a conversa sobre o bull market",
    "Mercado subindo não significa dinheiro no bolso",
    "Tem gente que perde: impulso, moeda sem critério, risco que não entende",
    "Aula gratuita: como analisar o mercado, os riscos e a escolha dos ativos",
    "Sem promessa de lucro" ] },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "manchete", "de": 2.85, "ate": 5.9, "chapeu": "Reacendeu a conversa", "titulo": "O novo bull market", "destaque": "bull market" },
    { "tipo": "grafico", "de": 5.9, "ate": 8.55, "forma": "linha", "titulo": "Um ciclo de alta", "destaque": "alta", "tendencia": "sobe", "tendenciaEm": 6.15, "ilustrativo": true },
    { "tipo": "etiqueta", "de": 8.55, "ate": 12.85, "sentido": "desce", "sobeEm": 9.87,
      "antes": { "rotulo": "O mercado", "valor": "Subindo", "em": 9.31 },
      "depois": { "rotulo": "No bolso", "valor": "Sem dinheiro", "em": 10.91 } },
    { "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "nota", "de": 14.9, "ate": 17.7, "rotulo": "Mesmo na alta", "valor": "Dinheiro", "simbolo": "US$", "notaEm": 15.32, "perda": { "texto": "Tem gente que perde", "em": 15.96 } },
    { "tipo": "topicos", "de": 17.7, "ate": 23.95, "itens": [
      { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.78 }, { "texto": "Risco que não entende", "em": 21.75 } ] },
    { "tipo": "pergunta", "de": 23.95, "ate": 27.95, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "destaque", "de": 27.95, "ate": 29.95, "texto": "Aula gratuita", "em": 28.62, "nivel": "chave", "detalhe": "para te explicar", "detalheEm": 29.27 },
    { "tipo": "passos", "de": 29.95, "ate": 33.75, "titulo": "Como eu analiso", "itens": [
      { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.15, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68, "em": 33.83 },
    { "tipo": "pergunta", "de": 35.15, "ate": 39.95, "texto": "Você quer…", "em": 35.23, "opcoes": [
      { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o patrimônio", "em": 37.98 } ] },
    { "tipo": "cta", "de": 39.95, "ate": 43.067, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ]
}
```

O que acontece: o primeiro quadro já mostra a pessoa em cima e "US$ 83.000" a lápis no painel; o número conta no "83 mil". Na manchete a pessoa volta ao quadro cheio. O gráfico de alta se desenha no "ciclo", com o selo ILUSTRATIVO. A etiqueta "O mercado / Subindo" desce pelo trilho até "No bolso / Sem dinheiro". O alerta vermelho bate em "para a maioria". A nota "Dinheiro" encolhe em "tem gente que perde"; a cortina azul passa e os três motivos entram em tarjas, um por palavra. A pergunta vira tarja com "?"; "Aula gratuita" na faixa azul; o trilho dos passos acende; "promessa de lucro" é riscada; a enquete abre as opções A e B; o fechamento mostra o elo "Acesse" e o relógio para na última palavra.
