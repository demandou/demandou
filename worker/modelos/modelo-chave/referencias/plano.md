# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastro do rosto), `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `pessoa`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: peito, parede, quadro de chaves
3. Os 11 blocos universais
4. A assinatura: `item` (com `prancheta`, `conta`, `chaveiro`) e `vezes`
5. Os tipos do demo: `porta` e `placa`
6. Limites de texto
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla Dias", "area": "Psicóloga" },
  "sfx": true,
  "correcoes": { "478": "4-7-8" }
}
```

- `marca`: `nome` e `area` vão na placa preta do fechamento, onde a chave gira ("Carla Dias · PSICÓLOGA"). Juntos, até ~34 caracteres. `nome` vazio = sem placa.
- `pessoa` (opcional): ajuste da pessoa nas portas menores. `"ancoraY"` (0 a 1) é a altura do rosto dentro da porta; o padrão é calculado pelo tamanho do rosto na gravação. Maior desce o rosto (use se a cabeça cortar no alto). `"zoom": 1.1` aproxima.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores.

## 2. A gramática: peito, parede, quadro de chaves

O tipo de cada momento decide onde a pessoa fica; o template faz as trocas sozinho.

| Gramática | Blocos | A pessoa | O conteúdo |
|---|---|---|---|
| **Peito** (quadro cheio) | `abertura`, `frase`, `destaque`, `definicao`, `pergunta`, `cta`, `porta`, `placa`, trecho sem momento | a tela inteira é o vão da porta, com o batente em volta | etiquetas e placas logo abaixo do queixo (`zona.topo`), acima da interface do app |
| **Parede** | `topicos`, `passos`, `numero`, `comparacao`, `grafico` | numa porta larga apoiada no piso, embaixo e no centro, com a cabeça inteira | o objeto pendurado na parede, em cima (de 196 px até ~30 px acima da porta) |
| **Quadro de chaves** | `item` | `prancheta` e `conta`: na porta de baixo; `chaveiro`: numa porta larga no alto, sob o quadro | o quadro de chaves no alto (uma etiqueta por item do vídeo) e o painel do item |
| **N×** | `vezes` | em pé, à direita (gravação de perto: na porta de baixo) | a coluna da esquerda (ou a parede) com o número grande e as etiquetas |

O que o template já faz sozinho (não precisa escrever nada):

- **A porta abre o vídeo** quando o primeiro momento é a `abertura` (ou a `porta`) e começa em 0: a folha de madeira destrava e gira em ~0,8 s, revelando a pessoa. Depois, o batente acompanha a pessoa em toda troca.
- **As trocas são um movimento de câmera pelo hall**: a pessoa muda de porta em 0,52 s, começando 0,14 s antes da fronteira (o pulo do corte some no movimento); o objeto da parede que sai e o que entra andam juntos para o mesmo lado, sem se sobrepor. Entre dois blocos de peito, a arte que sai desce e some antes de a nova entrar. Vindo de uma porta pequena, a arte do peito só entra quando a pessoa já cresceu.
- **O quadro de chaves** desce do alto quando começa um `item` e sobe quando o último item seguido termina. Tem um gancho por `item` do vídeo inteiro, na ordem; itens em lugares diferentes do vídeo dividem o mesmo quadro ("Item 1 de 2" e, mais tarde, "Item 2 de 2").
- **Nada nasce vazio**: títulos, itens, números, linhas e etiquetas já estão desenhados a lápis (cinza, tracejado) e ganham tinta, papel ou cor no instante em que são ditos.
- **O texto sempre cabe**: cada bloco mede o texto com as fontes de verdade e reduz o corpo até um mínimo legível, em 2 ou 3 linhas.
- **Gravação de perto** (o rosto ocupa boa parte do quadro): as portas ficam mais quadradas para a cabeça caber, `item` com `lado` e o `vezes` vão para a porta de baixo, e o fechamento fica compacto.
- **Último momento**: fica até o último quadro.

## 3. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate` e `legenda?` (`true` = a legenda continua aparecendo; não use em blocos de parede, onde ela cairia no rosto da porta de baixo).

### `abertura`

```json
{ "tipo": "abertura", "de": 0, "ate": 1.75, "texto": "Quando bater a ansiedade", "destaque": "ansiedade", "em": 0.1 }
```

- `texto`: a frase de abertura, palavras da fala (até ~60 caracteres; vira até 3 linhas).
- `destaque` (opcional): trecho exato do texto que fica verde.
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`). Use quando o momento começa antes da primeira palavra do texto.
- Extras do Chave: `rotulo` (caixa alta verde acima do título, até ~24 caracteres), `numero` (o número na porta e na plaquinha do batente, até ~6 caracteres: "302", "Sala 4").
- Como primeiro momento (`de` = 0), a porta se abre. Em outro lugar, é só a etiqueta no peito.

### `topicos` — lista sem ordem

```json
{ "tipo": "topicos", "de": 17.2, "ate": 23.9, "titulo": "Tem gente que perde",
  "itens": [
    { "texto": "Compra por impulso", "em": 17.73 },
    { "texto": "Escolhe moeda sem critério", "em": 19.21 },
    { "texto": "Assume risco que não entende", "em": 21.25, "detalhe": "e não sabe quanto pode perder" }
  ] }
```

- 2 a 5 `itens`, cada um com `texto` (2 a 6 palavras da fala) e `em` (a palavra que nomeia o item). `detalhe` (opcional) aparece menor, em cinza, e também ganha tinta nas palavras dele.
- `titulo` (opcional): até ~40 caracteres.
- Na tela: o quadro de chaves vertical. Com 5 itens longos, o corpo desce até 32 px e, se ainda não couber, os detalhes saem (o texto principal nunca some).

### `passos` — sequência em ordem

```json
{ "tipo": "passos", "de": 4.98, "ate": 13.8,
  "itens": [
    { "texto": "Inspira pelo nariz", "em": 5.07, "detalhe": "contando até 4" },
    { "texto": "Segura o ar", "em": 8.05, "detalhe": "contando até 7" },
    { "texto": "Solta devagar pela boca", "em": 10.53, "detalhe": "contando até 8" }
  ] }
```

- Mesmos campos do `topicos`. Na tela: a prancheta com os círculos numerados e o traço verde descendo de um passo ao outro.
- Use para processo, caminho, "primeiro… depois…", etapas no tempo.

### `numero` — um número dito

```json
{ "tipo": "numero", "de": 1.25, "ate": 4.9, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
```

- `valor` (número puro: `83000`, `1.5`), `em` (a palavra do número), `rotulo` (o que é, até ~40 caracteres; 2 linhas).
- Opcionais: `rotuloEm` (quando o rótulo ganha tinta), `prefixo` ("R$", "US$"), `sufixo` ("%", "mil", "kg", "anos"), `casas` (casas decimais), `inicio` (de onde a contagem parte; padrão 0), `ilustrativo` (mostra o selo).
- O número conta até o valor em ~1 s a partir de `em`, em formato pt-BR (83.000; 1,5). Grandes como "83 mil" podem ir como `valor: 83, sufixo: "mil"` ou `valor: 83000`.

### `comparacao` — dois lados

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
  "lados": [
    { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 },
    { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 }
  ] }
```

- `lados`: exatamente 2, cada um com `rotulo` (caixa alta, até ~18 caracteres), `texto` (até ~40 caracteres) e `em`.
- `modo` (opcional): `contra` ("×" entre as etiquetas, padrão), `antes-depois` ou `errado-certo` (seta de latão).
- `vencedor` (0 ou 1) e `vencedorEm` (opcionais): o vencedor fica verde com o visto; o outro, o xis terracota. Em `errado-certo` sem vencedor, o lado 1 ganha logo depois de ser dito.
- `titulo` (opcional): até ~40 caracteres, acima do trilho.

### `grafico`

Com números ditos (2 a 6):

```json
{ "tipo": "grafico", "de": 6.5, "ate": 9.0, "titulo": "Bitcoin no ano", "forma": "linha", "unidade": "mil",
  "dados": [ { "rotulo": "Jan", "valor": 42, "em": 6.6 }, { "rotulo": "Abr", "valor": 61, "em": 7.2 }, { "rotulo": "Out", "valor": 83, "em": 7.9 } ] }
```

Sem números (forma qualitativa):

```json
{ "tipo": "grafico", "de": 17.45, "ate": 20.13, "titulo": "Ajuda o corpo a desacelerar", "forma": "linha", "tendencia": "cai", "tendenciaEm": 18.11, "ilustrativo": true }
```

- `forma`: `barras`, `linha` ou `pizza`.
- `dados`: 2 a 6, cada um com `rotulo` (até ~12 caracteres), `valor` e `em`. Barras são proporcionais ao valor; a linha usa uma escala que mostra a variação; a pizza mostra a porcentagem de cada parte (ou o valor, se houver `unidade` que não seja "%").
- `unidade` (opcional): "R$", "US$", "%", "mil", "kg"… (moeda vai antes do número, o resto depois).
- Sem `dados`: `tendencia` (`sobe`, `cai` ou `oscila`), `tendenciaEm` (a palavra da tendência) e `ilustrativo: true` (obrigatório). `forma: "barras"` faz cinco barras que crescem em sequência; `linha` (ou `pizza`), a curva. A tinta é sempre o verde.
- `titulo` (opcional): até ~40 caracteres.

### `destaque`

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto` (até ~50 caracteres) e `em`. `nivel`: `chave` (placa preta com a chave de latão, padrão) ou `alerta` (placa terracota com o triângulo).
- `detalhe` e `detalheEm` (opcionais): uma linha menor numa tira de papel embaixo da placa (até ~50 caracteres).

### `definicao`

```json
{ "tipo": "definicao", "de": 4.9, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo` (até ~28 caracteres) com o `em` dele; `significado` (até ~70 caracteres) com o `significadoEm` (a primeira palavra do significado).

### `frase`

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "em": 33.83 }
```

- `texto` (até ~70 caracteres), `destaque` (trecho em verde), `risco` (trecho riscado em terracota quando é dito; `riscoEm` fixa o instante), `em` (quando o texto começa a ser dito).

### `pergunta`

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 39.95, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto` (até ~70 caracteres), `em` (opcional) e `opcoes` (opcional, 2 a 4, cada uma com `texto` até ~30 caracteres e `em`). Duas opções ficam uma embaixo da outra; três ou quatro, em grade.

### `cta` — fechamento

```json
{ "tipo": "cta", "de": 39.95, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: a chamada, palavras da fala (até ~60 caracteres; 1 ou 2 linhas). `destaque`: trecho em verde. `em`: quando a chamada começa a ser dita.
- `icone`: `salvar`, `seguir`, `comentar` ou `link` (sem ícone: a chave do modelo).
- Extra do Chave: `acoes` (1 ou 2 etiquetas de ação com texto, como no demo: `[{ "texto": "Salva", "icone": "salvar", "em": 17.04 }, { "texto": "Manda", "icone": "enviar", "em": 17.22 }]`). Com `acoes`, o `texto` vira o complemento dito depois delas ("pra quem está procurando casa").
- A placa com `marca` aparece no fim e a chave gira na última palavra. Use como último momento.

## 4. A assinatura

### `item` — uma parte do vídeo no quadro de chaves

```json
{ "tipo": "item", "de": 14.9, "ate": 23.9, "etiqueta": "Perde", "etiquetaEm": 16.84, "titulo": "Tem gente que perde",
  "painel": { "tipo": "conta", "linhas": [
    { "rotulo": "Compra por impulso", "em": 17.73 },
    { "rotulo": "Moeda sem critério", "em": 19.78 },
    { "rotulo": "Risco que não entende", "em": 21.75 } ],
    "total": "Perde, mesmo na alta" } }
```

- `etiqueta`: uma palavra da fala para a etiqueta do quadro (até ~10 caracteres; "Vistoria", "Perde", "Aula", "Inspira").
- `etiquetaEm` (opcional): quando a etiqueta acende (padrão: a primeira palavra do título).
- `titulo`: o título do painel (até ~26 caracteres).
- `painel`: um dos três abaixo.
- `lado` (`esquerda` ou `direita`, opcional, só para prancheta e conta): põe a pessoa numa porta estreita ao lado do painel, como no demo. Só use com a pessoa longe da câmera e parada; sem `lado`, a pessoa vai para a porta de baixo (recomendado). Em gravação de perto o `lado` é ignorado.
- Use 1 a 4 `item` no vídeo (o quadro tem um gancho por item). Um `item` dura o tempo da parte inteira (pode passar de 8 s, desde que os sub-passos entrem a cada 1,5 a 2,5 s).

**Painel `prancheta`** — checagem, lista com visto:

```json
{ "tipo": "prancheta", "subtitulo": "antes de investir",
  "itens": [ { "texto": "Reserva de emergência", "em": 15.6 }, { "texto": "Dívidas quitadas", "em": 15.9 }, { "texto": "Objetivo claro", "em": 16.2 } ] }
```

- `itens`: 2 a 5, cada um com `texto` (até ~30 caracteres) e `em`; `desenho` opcional (`sala`, `cozinha`, `quarto`, `banheiro`, `varanda`, `lavanderia`, `garagem`, `escritorio`): com desenho em todos, a prancheta mostra miniaturas que "viram foto" (como no demo, onde o formato antigo `comodos` também vale).
- `subtitulo` (opcional): uma linha de apoio (até ~30 caracteres).

**Painel `conta`** — partes que somam num resultado:

- `linhas`: 2 a 4, cada uma com `rotulo` (até ~22 caracteres), `em` e `valor` (número dito).
- Com valores: cada valor conta, a barra ganha o pedaço da linha e o `total` (padrão "Total") soma. `prefixo` ("R$"), `sufixo` ("h", "kg", "%") e `casas` formatam os números. `nota` (opcional) no pé: "valores de exemplo", a fonte do dado.
- **Sem valores** (qualitativa): cada linha ganha o visto e o pedaço da barra (`peso` opcional, padrão 1); o `total` é o resultado em palavras ("Perde, mesmo na alta", "Cansaço"), e a nota "ilustrativo" aparece sozinha.

**Painel `chaveiro`** — opções, "as chaves" de alguma coisa:

```json
{ "tipo": "chaveiro", "chaves": [
  { "texto": "O mercado", "icone": "grafico", "em": 30.86 },
  { "texto": "Os riscos", "icone": "alerta", "em": 31.86 },
  { "texto": "A escolha dos ativos", "icone": "lupa", "em": 32.29 } ] }
```

- `chaves`: 1 a 4, cada uma com `texto` (até ~22 caracteres; 2 linhas) e `em`.
- No couro: `icone` (opcional), ou `marca` (até 3 caracteres: "4", "7", "A"), ou, sem os dois, o número do chaveiro.
- Ícones: `pessoa`, `dinheiro`, `escudo`, `documento`, `casa`, `predio`, `calendario`, `chave`, `lupa`, `salvar`, `enviar`, `seguir`, `comentar`, `link`, `alerta`, `coracao`, `relogio`, `grafico`, `alvo`, `lampada`, `check`, `estrela`, `carrinho`, `livro`.
- O chaveiro põe a pessoa numa porta larga no alto, sob o quadro; os chaveiros ficam numa fileira de pregos embaixo dela.

### `vezes` — uma contagem repetida

```json
{ "tipo": "vezes", "de": 13.8, "ate": 15.5, "rotulo": "Repete", "n": 4, "numeroEm": 14.45, "unidade": "vezes" }
```

- `rotulo` (caixa alta, até ~22 caracteres), `n` (2 a 6), `numeroEm` (a palavra do número), `unidade` (o que é contado, palavras da fala: "vezes", "meses de aluguel", "parcelas").
- Opcionais: `prefixo` ("até", "no máximo"), `etiquetas` (o texto de cada etiqueta e quando acende: `[{ "texto": "1º mês", "em": 15.78 }, …]`; sem elas, as etiquetas mostram 1, 2, 3… e acendem em sequência logo depois do número), `fonte` (a regra ou o dado, no pé).

## 5. Os tipos do demo

- `porta`: a abertura do demo, com `linhas` (até 3, já quebradas), `enfase`, `rotulo`, `numero` e `etiquetas: { "n": 3, "em": 2.63 }` (as etiquetinhas "1 2 3" que acendem quando a quantidade é dita). Prefira `abertura`.
- `placa`: frase no peito com `rotulo`, `texto` e `enfase`. Prefira `frase`.

## 6. Limites de texto

Os blocos medem e reduzem o texto sozinhos, mas cada um tem um tamanho em que fica bonito:

| Campo | Ideal | Máximo |
|---|---|---|
| título de abertura, frase, pergunta | até 40 caracteres | ~70 |
| título de bloco de parede ou painel | até 26 caracteres | ~40 |
| item de lista, passo, opção | 2 a 5 palavras | ~40 caracteres |
| rótulo em caixa alta, etiqueta do quadro | 1 ou 2 palavras | ~22 / ~10 caracteres |
| rótulo de barra, ponto da linha | 1 palavra | ~12 caracteres |

Texto passando do máximo fica pequeno: encurte com as palavras da fala.

## 7. Regras de tempo

- Cada momento começa na primeira palavra da batida e vai até a batida seguinte; momentos vizinhos podem encostar (`ate` de um = `de` do outro). O template corta sobreposições.
- Dentro do momento, cada item entra no `em` da palavra que o nomeia. Nada aparece antes de ser dito (a não ser o esboço a lápis).
- Nada fica parado mais de ~2,5 s: um momento com mais de ~4 s precisa de sub-passos com `em` espalhados.
- A pessoa muda de lugar nas fronteiras: alterne peito e parede. Trechos só com a pessoa e a legenda: no máximo ~3 s, e só em respiros.
- Não repita o mesmo bloco três vezes seguidas.

## 8. Legenda, correções e sons

- A legenda (uma etiqueta de papel abaixo do queixo, a palavra da vez em verde) aparece só nos trechos sem momento e nunca com a pessoa na porta de baixo. `semLegenda`: `[{ "de": 4.0, "ate": 5.2 }]` tira trechos extras.
- `correcoes`: palavra ou expressão errada → certa (`{ "calção": "caução", "478": "4-7-8" }`). Valem para a legenda e para a sincronia dos textos. Só corrija o que tiver certeza.
- Sons: saem sozinhos, um por batida importante (porta, gancho, chave, número, conta fechando, fechamento, chave girando), nunca dois a menos de 0,45 s. `"sfx": false` desliga.

## 9. Exemplo completo

Vídeo de 22 s de um psicólogo: "Quando bater a ansiedade, tenta a respiração 4-7-8. Inspira pelo nariz, contando até 4; segura o ar contando até 7; solta devagar pela boca, contando até oito. Repete quatro vezes. Não substitui a terapia, mas ajuda o corpo a desacelerar na hora. Salva para quando precisar."

```json
{
  "marca": { "nome": "Carla Dias", "area": "Psicóloga" },
  "correcoes": { "478": "4-7-8" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 1.75, "texto": "Quando bater a ansiedade", "destaque": "ansiedade", "em": 0.1 },
    { "tipo": "destaque", "de": 1.75, "ate": 4.98, "texto": "Tenta a respiração 4-7-8", "em": 1.81, "nivel": "chave" },
    { "tipo": "passos", "de": 4.98, "ate": 13.8, "itens": [
      { "texto": "Inspira pelo nariz", "em": 5.07, "detalhe": "contando até 4" },
      { "texto": "Segura o ar", "em": 8.05, "detalhe": "contando até 7" },
      { "texto": "Solta devagar pela boca", "em": 10.53, "detalhe": "contando até 8" } ] },
    { "tipo": "vezes", "de": 13.8, "ate": 15.5, "rotulo": "Repete", "n": 4, "numeroEm": 14.45, "unidade": "vezes" },
    { "tipo": "frase", "de": 15.5, "ate": 17.45, "texto": "Não substitui a terapia", "destaque": "a terapia", "em": 15.6 },
    { "tipo": "grafico", "de": 17.45, "ate": 20.13, "titulo": "Ajuda o corpo a desacelerar", "forma": "linha", "tendencia": "cai", "tendenciaEm": 18.11, "ilustrativo": true },
    { "tipo": "cta", "de": 20.13, "ate": 22.04, "texto": "Salva para quando precisar", "icone": "salvar", "em": 20.22 }
  ],
  "semLegenda": []
}
```

Ritmo de layout: peito (porta abrindo) → peito (placa) → parede (prancheta) → N× (pessoa à direita) → peito → parede (recibo) → peito (fechamento).
