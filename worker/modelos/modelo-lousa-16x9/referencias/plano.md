# O plano de edição (`src/plano.json`), versão deitada (16:9, 1920×1080)

## 0. No quadro deitado (16:9)

Tudo o que está abaixo vale, com estas diferenças (o template faz sozinho; o plano só precisa respeitar os limites):

- **Composição (aula 9 do curso):** a pessoa em tela cheia é a base. Numa página da lousa, a pessoa vai para uma moldura do lado direito, com o rosto centralizado e acompanhado com ajuste suave, e a lousa ocupa o lado esquerdo. Onde este texto diz "ao lado da janela", leia "no topo da lousa, à esquerda da janela"; onde diz "embaixo", leia "embaixo, na lousa à esquerda". Os blocos, os campos e os limites de texto são os mesmos do vertical.
- **Os dois lugares:** `alto` = janela grande (moldura larga à direita); canto (`direita`) = janela retrato (moldura estreita à direita, com o cabeçalho no topo da lousa). A pessoa fica sempre à direita: `esquerda` vale como `direita`.
- **Tempo de leitura e respiro (aula 9):** página de 2,5 a ~8 s; entre ideias, a pessoa em tela cheia de 1 a ~8 s, com legenda. O `conferir.mjs` deste modelo pede ≥ 50% de cobertura, trecho só com legenda até ~8 s, um momento a cada ~10 s e nada parado mais de ~6 s. Não cubra cada frase: no vídeo completo, a lousa abre onde a ideia ganha com ela e fecha quando a ideia termina.
- **Margens do YouTube:** 96 px nas laterais; a legenda termina em y 976; nada importante abaixo de y 984 (controles do player).

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` / `…Em` é o instante de uma palavra dita.

## Sumário

0. No quadro deitado (16:9)
1. Campos gerais
2. Páginas e lugares da pessoa
3. Os 11 blocos universais
4. A assinatura: a conta na lousa (`coluna`, `resultado`, `virgula`, `fracao`, `regra`, `titulo`)
5. O que a lousa sabe escrever
6. Regras de tempo
7. Legenda e correções
8. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Prof. Tiago Moura", "area": "Matemática" },
  "sfx": true,
  "correcoes": { "DOSI": "Doze." }
}
```

- `marca`: aparece só no fechamento (`cta`), como assinatura embaixo da chamada ("Prof. Tiago Moura · Matemática"). `nome` vazio = sem assinatura.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão. (A Lousa não usa a `zona`: a pessoa muda de lugar.) No 16:9, `rosto` traz também o `quadro` (1920×1080) e o `rastro` que a janela segue.
- `caixas` (opcional, raro): ajuste fino do enquadramento da pessoa em cada lugar, por exemplo `"caixas": { "direita": { "zoom": 1.2 } }` se o rosto ficar grande demais na janela retrato, ou `{ "alto": { "ancoraY": 0.36 } }` para subir o rosto na janela grande. Sem ajuste, o zoom já se adapta à gravação: o rosto ocupa ~metade da largura da janela retrato e ~um terço da janela grande, centralizado (perto da câmera, aproxima menos).

## 2. Páginas e lugares da pessoa

Cada momento é uma **página da lousa**. A troca acontece sozinha, nesta ordem:

1. **A janela vai para o lugar novo** (~0,6 s; no quadro deitado ela muda de tamanho entre a grande e a retrato, sempre à direita, ou sai da tela cheia). O giz da página anterior que ela vai cobrir some enquanto ela chega. O título da página nova, ao lado da janela, é escrito na palavra dele; o que já foi dito aparece à medida que a janela libera o lugar.
2. **A página anterior fica inteira um instante** (~0,45 s depois da última palavra escrita; ~0,85 s quando ela termina num resultado circulado ou sublinhado).
3. **O apagador limpa** (~0,42 s, só onde havia giz), deixando a névoa de giz apagado.
4. **Só com a lousa limpa** a página nova é escrita embaixo (nem o esboço aparece antes). Resultados que reaparecem iguais (o total que vira resposta) deslizam até o lugar novo.

Por isso o conteúdo de baixo de uma página pode entrar até ~1 s depois da palavra que o diz. `"legenda": true` na página mantém a fala na tela nesse meio-tempo.

| Lugar | A pessoa | A lousa | Blocos que vão para lá sem `layout` |
|---|---|---|---|
| `alto` (janela grande) | moldura larga à direita, 720 × 784 px, rosto centralizado (cabeça e ombros) | à esquerda da janela, ~944 × 784 px (até ~874 sem legenda), conteúdo centrado | `abertura`, `titulo`, `frase`, `destaque`, `cta`, `pergunta` sem opções; `topicos`, `passos`, `comparacao` e `grafico` sem `titulo` |
| canto (`direita`; `esquerda` é o mesmo) (janela retrato) | moldura estreita à direita, 540 × 784 px, rosto centralizado e maior | **cabeçalho** no topo da lousa, ao lado da janela (~1124 × 196 px: o título cabe em 1 linha grande ou 2 menores) + a lousa embaixo, na largura toda (~1124 × 552 px, até ~642 sem legenda) | `numero`, `definicao`, `pergunta` com opções, `topicos`/`passos`/`comparacao`/`grafico` com `titulo`, e a conta (`coluna`, `resultado`, `virgula`, `fracao`, `regra`) |

- Sem `layout`, cada bloco vai para o lugar padrão da tabela. Ponha `"layout": "alto" | "direita"` só para mudar isso. Duas páginas seguidas na janela retrato usam o mesmo cabeçalho: o título novo espera o apagador.
- Antes do primeiro momento e em qualquer respiro de mais de 0,3 s entre momentos, a pessoa fica em **tela cheia** (com legenda). No vídeo completo a tela cheia é a base: deixe respiros de 1 a ~8 s entre as ideias e abra o vídeo com o rosto cheio (o gancho).
- Na janela retrato, **sempre** tenha algo para o cabeçalho (`titulo`, `rotulo`, `termo` ou a pergunta). Bloco com título opcional sem título vai para a janela grande.
- Nos cortes dentro de um mesmo lugar, o enquadramento troca seco (×1 ↔ ×1,07) para disfarçar o pulo.

## 3. Os 11 blocos universais

Campos comuns: `tipo`, `de`, `ate`, `legenda?` (true = a legenda continua), `layout?`. Os blocos medem o texto com a letra de verdade e diminuem até caber; passou do limite, fica pequeno na tela: encurte com as palavras da fala.

### `abertura`: o tema (janela grande)

```json
{ "tipo": "abertura", "de": 0.25, "ate": 2.85, "texto": "Três peças para se vestir melhor sem esforço",
  "destaque": "Três peças", "rotulo": "Estilo", "em": 0.29 }
```

- `texto`: até ~60 caracteres, com as palavras **na ordem em que são faladas** (cada uma é escrita quando é dita); até 4 linhas.
- `destaque` (opcional): trecho exato em giz amarelo, sublinhado quando termina de ser escrito (sem destaque, a última linha é sublinhada). O destaque não quebra no meio.
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`). `rotulo` (opcional, só na Lousa): o tema em 1–3 palavras, em caixa-alta, em cima.

### `topicos`: lista sem ordem (janela retrato com `titulo`, janela grande sem)

```json
{ "tipo": "topicos", "de": 14.9, "ate": 23.9, "titulo": "Por que perde", "tituloEm": 16.84,
  "itens": [ { "texto": "Impulso", "em": 18.45 },
             { "texto": "Sem critério", "em": 20.18, "detalhe": "escolhe qualquer moeda" },
             { "texto": "Risco que não entende", "em": 21.75 } ] }
```

- 2 a 5 `itens`; cada `texto` de 1 a 5 palavras (até ~24 caracteres; quebra em 2 linhas). `detalhe` (opcional) em letra menor embaixo, escrito depois do item.
- `titulo` (até ~16 caracteres fica grande; até ~30 quebra) e `passo` (rótulo pequeno em caixa-alta acima do título) vão ao lado da janela; `tituloEm` = a palavra que o diz.
- Cada item entra no `em` da palavra que o nomeia, com um traço amarelo na frente (o traço aparece esboçado antes). Sobrando ~1,7 s depois do último item, uma moldura de giz fecha a lista.

### `passos`: sequência em ordem (janela retrato com `titulo`, janela grande sem)

```json
{ "tipo": "passos", "de": 28.0, "ate": 33.75, "passo": "Aula gratuita", "titulo": "Como eu analiso", "tituloEm": 30.09,
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- Mesmos campos e limites de `topicos`. O algarismo de cada passo (1, 2, 3…) aparece esboçado, é escrito e circulado no `em` do passo, e uma seta liga um passo ao outro. Para "uma… duas… três…", ponha o `em` no número dito.

### `numero`: um número dito (janela retrato)

```json
{ "tipo": "numero", "de": 0.45, "ate": 4.95, "legenda": true, "valor": 83000, "em": 1.34,
  "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
```

- `valor`: número (sem aspas). Escrito em pt-BR: `83000` → "83.000"; `1.5` → "1,5" (`casas` fixa as decimais).
- `prefixo` ("R$", "US$", "+") e `sufixo` ("%", "mil", "mi", "kg", "anos"): "%" fica do tamanho do número; palavras ficam menores. Prefira `"valor": 83, "sufixo": "mil"` a 83000 quando a pessoa diz "83 mil".
- `rotulo` (até ~30 caracteres): o que o número é, escrito ao lado da janela palavra por palavra a partir de `rotuloEm` (padrão: `de`).
- `em`: a palavra do número. O número é escrito algarismo por algarismo e ganha sublinhado duplo.
- `ilustrativo: true`: número aproximado ou de exemplo; ganha "≈" e a etiqueta ILUSTRATIVO. Não use para número inventado.

### `comparacao`: dois lados (janela grande sem `titulo`, janela retrato com)

```json
{ "tipo": "comparacao", "de": 8.55, "ate": 12.85, "legenda": true, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 8.77 },
             { "rotulo": "No bolso", "texto": "não significa dinheiro", "em": 9.87 } ] }
```

- A lousa dividida em T. `rotulo` de cada lado: 1 a 3 palavras (amarelo, em cima). `texto`: até ~30 caracteres (até 4 linhas, embaixo).
- `modo`: `contra` (padrão, só o T), `antes-depois` (uma seta atravessa o T), `errado-certo` (✗ rosa no primeiro lado, ✓ amarelo no segundo; o rótulo errado fica rosa).
- `vencedor` (0 ou 1) circula o rótulo desse lado em `vencedorEm` (padrão: logo depois do texto dele).
- Cada lado entra no `em` dele: o rótulo primeiro, depois as palavras do texto conforme são ditas.

### `grafico`: barras, linha, pizza ou tendência (janela retrato com `titulo`, janela grande sem)

```json
{ "tipo": "grafico", "de": 4.9, "ate": 8.6, "forma": "linha", "titulo": "Ciclo de alta", "tituloEm": 6.15,
  "tendencia": "sobe", "tendenciaEm": 6.15, "ilustrativo": true }
```

```json
{ "tipo": "grafico", "de": 20.0, "ate": 25.0, "forma": "barras", "titulo": "Gasto por mês", "unidade": "R$",
  "dados": [ { "rotulo": "Janeiro", "valor": 1200, "em": 20.4 }, { "rotulo": "Fevereiro", "valor": 800, "em": 22.1 } ] }
```

- Com `dados` (2 a 6 números **ditos**): `barras` = retângulos de giz hachurados (o maior em amarelo) com o valor em cima e o rótulo embaixo; `linha` = pontos circulados ligados por traços; `pizza` = círculo com as fatias numeradas e a legenda "1 Rótulo valor" ao lado (proporção sobre a soma). Rótulos de até ~12 caracteres. Cada dado entra no `em` dele.
- `unidade`: "%" vai colado em cada valor; outra unidade ("mil", "R$", "kg") é escrita pequena no alto do eixo.
- Sem números ditos: `tendencia` (`sobe`, `cai`, `oscila`) com `ilustrativo: true`. A curva amarela é desenhada devagar a partir de `tendenciaEm` (até ~2,6 s), com ponta de seta, e a etiqueta ILUSTRATIVO aparece.

### `destaque`: a palavra que bate forte (janela grande)

```json
{ "tipo": "destaque", "de": 12.85, "ate": 15.4, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: 1 a 5 palavras (até ~28 caracteres), escrito grande, palavra por palavra a partir de `em`.
- `nivel`: `chave` (padrão; amarelo com sublinhado duplo) ou `alerta` (giz rosa, com o sinal de atenção desenhado antes).
- `detalhe` (opcional, até ~40 caracteres) menor embaixo, a partir de `detalheEm`.

### `definicao`: termo e significado (janela retrato)

```json
{ "tipo": "definicao", "de": 4.95, "ate": 8.55, "termo": "Bull market", "em": 5.3,
  "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` (até ~20 caracteres): grande, em amarelo, ao lado da janela, sublinhado. `significado` (até ~60 caracteres): embaixo, depois de um "=", palavra por palavra a partir de `significadoEm`.

### `frase`: citação, opinião forte (janela grande)

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68, "em": 33.83 }
```

- `texto`: até ~70 caracteres, palavras na ordem da fala, entre aspas grandes de giz amarelo.
- `destaque` (opcional): trecho em amarelo. `risco` (opcional): trecho riscado a giz rosa assim que é escrito (não antes de `riscoEm`). `em`: quando começa a ser dito.

### `pergunta`: para quem assiste (janela grande sem opções, janela retrato com)

```json
{ "tipo": "pergunta", "de": 23.9, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 }
```

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- Sem `opcoes`: um "?" grande esboçado em cima, que se completa quando a pergunta termina; a pergunta (até ~70 caracteres) embaixo, palavra por palavra.
- Com `opcoes` (2 a 4, até ~28 caracteres cada): a pergunta vai ao lado da janela (encurte para caber: "Você quer…") e as opções viram questão de prova (☐ a) ☐ b)…), cada uma na sua palavra.

### `cta`: fechamento (janela grande)

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
```

- `texto`: a chamada, palavras na ordem da fala, até ~45 caracteres (até 3 linhas; quanto mais curta, maior).
- `icone`: `salvar` (padrão; o marcador se enche de amarelo), `seguir`, `comentar` ou `link` (dois elos que se ligam). `iconeEm` (opcional): quando o ícone "acontece" (padrão: logo depois da última palavra).
- `destaque`: trecho em amarelo e sublinhado (padrão: a primeira palavra em amarelo). `em`: quando a chamada começa a ser dita.
- Na janela grande (padrão), o ícone fica grande em cima e a chamada embaixo, na lousa. Na janela retrato (`"layout": "direita"`), use `titulo` no topo da lousa (ex.: "Salva e me segue", `tituloEm` na palavra) e, se quiser, a `regra` para levar: `"regra": { "rotulo": "Funciona com qualquer valor", "linhas": [ { "texto": "15% = 10% + metade", "em": 15.28, "destaque": "15%" } ], "molduraEm": 17.05 }` (1 linha na janela grande, até 2 na retrato).
- A assinatura (`marca`) aparece embaixo quando o ícone acontece. O último momento vai até o fim do vídeo.

## 4. A assinatura: a conta na lousa

Pelo menos um destes entra em todo vídeo (o `conferir.mjs` exige `coluna`, `resultado`, `virgula` ou `fracao`). Todos ficam na janela retrato, com o cabeçalho de passo no topo da lousa, ao lado da janela: `passo` (rótulo pequeno, "Passo 1") e `titulo` (giz amarelo grande, escrito em `tituloEm`).

### `coluna`: a conta armada, com números ou palavras

```json
{ "tipo": "coluna", "de": 15.4, "ate": 23.9, "legenda": true, "passo": "Mesmo na alta", "titulo": "Tem gente que perde", "tituloEm": 15.96,
  "operador": "+", "operadorEm": 19.1,
  "itens": [ { "valor": "impulso", "em": 18.45 }, { "valor": "sem critério", "em": 20.18 }, { "valor": "risco sem entender", "em": 21.75 } ],
  "tracoEm": 22.5, "total": { "valor": "perda", "em": 22.86 } }
```

- **Com números** (`"8"`, `"4"`): parcelas alinhadas à direita, o sinal na última, o traço e o total circulado; `rotulo` (opcional, até ~6 caracteres) em amarelo à esquerda de cada linha. 2 ou 3 parcelas de até 5 algarismos. **Confira a conta.**
- **Com palavras** (qualquer `valor` com letras): as parcelas uma embaixo da outra, cada uma com o sinal na frente (a partir da segunda), o traço e "= total" circulado. 2 a 4 parcelas de 1 a 3 palavras (a mais longa quebra em duas linhas); total de 1 a 2 palavras. É a "conta" de qualquer assunto: motivos → consequência, ingredientes → resultado.
- `operador`: `"+"`, `"−"` ou `"×"`. `operadorEm`: quando o primeiro sinal é escrito. `tracoEm`: o traço (na palavra que fecha: "e", "isso dá", "vira"). `total.em`: a palavra do resultado.
- Parcela sem `em`: desliza da página anterior se o mesmo valor estiver lá; senão, é escrita logo que a lousa fica limpa.

### `resultado`: a pergunta e a resposta sublinhada

```json
{ "tipo": "resultado", "de": 12.51, "ate": 15.18, "rotulo": "Resposta",
  "conta": "15% de 80", "contaEm": 12.6, "destaque": "15%", "valor": "R$ 12", "valorEm": 14.37 }
```

- `conta`: a pergunta, palavras na ordem da fala (até ~40 caracteres; no topo da lousa, ao lado da janela, numa linha grande ou em 2 menores). `destaque`: trecho em amarelo.
- `valor`: a resposta, número ("R$ 12") ou palavra ("critério", até ~20 caracteres), escrita grande com "=" e sublinhado duplo em `valorEm`. Se o número dela estava na página anterior (o total da coluna), ele desliza até aqui e o prefixo ("R$") é escrito na palavra.
- `molduraEm` (opcional): moldura de giz em volta da resposta.

### `virgula`: "anda a vírgula"

```json
{ "tipo": "virgula", "de": 3.5, "ate": 8.15, "legenda": true, "passo": "Passo 1", "titulo": "10%", "tituloEm": 5.21,
  "prefixo": "R$", "numero": "80", "numeroEm": 4.12, "casas": 1, "moverEm": 6.38, "resultado": "8", "resultadoEm": 7.6 }
```

- `numero`: sem ponto de milhar, até 5 algarismos; pode ter vírgula ("3,5"). `prefixo` (até 3 caracteres) menor, antes.
- `casas`: quantas casas a vírgula anda. Positivo = para a esquerda (divide: 10% anda 1, 1% anda 2); negativo = para a direita (multiplica). Zeros que faltam aparecem sozinhos.
- `numeroEm`, `moverEm` ("andar a vírgula"), `resultadoEm`: as palavras. `resultado`: o valor certo, como a pessoa fala ("8", não "8,0").

### `fracao`: divide com um traço

```json
{ "tipo": "fracao", "de": 8.15, "ate": 10.7, "legenda": true, "passo": "Passo 2", "titulo": "5%", "tituloEm": 9.4,
  "numerador": "8", "nota": "metade", "notaEm": 8.2, "tracoEm": 8.5, "denominador": "2", "denominadorEm": 8.72,
  "resultado": "4", "resultadoEm": 10.2 }
```

- `numerador`, `denominador`: até 4 caracteres (aceita palavras curtas: "1" / "10" = "a cada 10"). `resultado`: até 5. Sem `numeradorEm`, o numerador desliza da página anterior se estiver lá.
- `nota` (opcional, até ~10 caracteres): a palavra ao lado do traço ("metade", "um terço").

### `regra`: o macete para levar

```json
{ "tipo": "regra", "de": 10.8, "ate": 13.4, "passo": "Macete", "titulo": "vírgula",
  "linhas": [ { "texto": "10% = anda 1 casa", "em": 11.0, "destaque": "10%" }, { "texto": "1% = anda 2 casas", "em": 12.0, "destaque": "1%" } ],
  "molduraEm": 12.9 }
```

- Até 3 linhas de até ~16 caracteres (mais que isso encolhe), cada uma escrita em sequência a partir do `em`. Serve para fórmula, regra de bolso, tradução ("I am = eu sou").

### `titulo`: abertura em linhas (a do demo)

```json
{ "tipo": "titulo", "de": 0.45, "ate": 3.5, "legenda": true, "rotulo": "Cálculo mental",
  "linhas": ["15%", "de cabeça?"], "destaque": "15%", "sublinharEm": 2.95 }
```

- O mesmo que a `abertura`, com as linhas escolhidas por você (1 a 3; linha de até 6 caracteres fica gigante). `sublinharEm`: sublinhado amarelo embaixo da última linha.

## 5. O que a lousa sabe escrever

- **Algarismos e sinais** são traços de giz: `0–9 % , . + − = ÷ × / : ( ) ≈ →`, e `R$` / `US$`. Use `−` (menos) e `×`, não `-` e `x`, nas contas.
- **Letras** são a letra manuscrita (Mali), com acentos e ç.
- Cor: branco é o padrão; amarelo é o assunto do instante (títulos, resultados, destaques); rosa só para o erro/alerta. Não pinte tudo de amarelo.

## 6. Regras de tempo

- `de`: o `em` da primeira palavra da batida, menos 0,05 a 0,3. Nunca antes do `ate` do momento anterior.
- `ate`: o `de` do momento seguinte (momentos colados: o apagador e a troca de lugar são a transição), ou o fim do vídeo no último.
- Página mínima: ~2,5 s no quadro deitado (tempo de leitura). Uma frase curta depois de um resultado circulado tem pouca lousa limpa: junte com a seguinte ou estenda.
- Itens, lados, opções, dados, números: `em` = o `em` da palavra que os nomeia. Nada aparece antes de ser dito (o esboço fraco é só a forma, nunca o texto).
- **Nada parado:** algo novo a cada 1,5 a 3 s. Página com mais de ~5 s precisa de itens entrando por dentro (o `conferir.mjs` deste modelo reprova acima de 6 s).
- **Respiro (aula 9):** entre as ideias, a pessoa em tela cheia de 1 a ~8 s, com legenda. Cobertura de pelo menos 50% do vídeo; nenhum trecho de mais de ~8 s só com a pessoa e a legenda; um momento a cada ~10 s.
- A página termina inteira: dê ~0,5 s depois da última palavra antes do `de` seguinte quando der (um destaque que termina junto com a fala some rápido).

## 7. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez (até ~42 caracteres, 54 px), numa tarja escura larga, centrada, com a base na área segura de baixo (y 976, acima dos controles do player e abaixo da moldura da pessoa). Ela **some durante um momento**, a não ser que o momento tenha `"legenda": true`.

- Use `"legenda": true` quando a lousa resume a fala (passos da conta, uma comparação, uma lista curta, um número com contexto): a legenda carrega a frase inteira e cobre o instante em que a lousa é limpa. A lousa já deixa espaço para ela.
- Sem legenda quando a lousa escreve a própria fala (abertura, frase, destaque, pergunta, fechamento).
- `semLegenda`: faixas extras sem legenda (ex.: `[ { "de": 0.85, "ate": 2.5 } ]`).
- `correcoes`, sem pontuação na chave: `{ "DOSI": "Doze.", "Jaquet tem": "Jaqueta em" }`. A chave pode ter várias palavras seguidas e `""` apaga. Ponto no fim fecha a linha da legenda ali. Não edite `palavras` à mão. As correções valem para a legenda; na lousa, escreva o texto certo no próprio bloco.

Para ver todas as linhas de legenda antes de renderizar: `node scripts/legendas.mjs`.

## 8. Exemplos completos

### Cripto (43 s, nenhum número inventado)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0.45, "ate": 4.95, "legenda": true, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" },
    { "tipo": "definicao", "de": 4.95, "ate": 8.55, "termo": "Bull market", "em": 5.3, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.55, "ate": 12.85, "legenda": true, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 15.4, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "coluna", "de": 15.4, "ate": 23.9, "legenda": true, "passo": "Mesmo na alta", "titulo": "Tem gente que perde", "tituloEm": 15.96,
      "operador": "+", "operadorEm": 19.1,
      "itens": [ { "valor": "impulso", "em": 18.45 }, { "valor": "sem critério", "em": 20.18 }, { "valor": "risco sem entender", "em": 21.75 } ],
      "tracoEm": 22.5, "total": { "valor": "perda", "em": 22.86 } },
    { "tipo": "pergunta", "de": 23.9, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "passos", "de": 28.0, "ate": 33.75, "legenda": true, "passo": "Aula gratuita", "titulo": "Como eu analiso", "tituloEm": 30.09,
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68, "em": 33.83 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
  ]
}
```

Lugares (sozinhos, no quadro deitado): tela cheia → janela retrato (número) → janela retrato (definição) → janela grande (T) → janela grande (alerta) → janela retrato (a conta) → janela grande (pergunta) → janela retrato (passos) → janela grande (frase) → janela retrato (questão) → janela grande (fechamento). A pessoa fica sempre à direita. Este exemplo é um vídeo curto, com as páginas coladas; no vídeo completo, deixe respiros em tela cheia entre as ideias (aula 9).

### Matemática (o demo, 20 s)

Fala: "Quer calcular quinze por cento de cabeça? Olha que fácil. Pega oitenta reais. Dez por cento é só andar a vírgula: oito. Metade disso é cinco por cento: quatro. Soma os dois: doze. Quinze por cento de oitenta é doze reais. Funciona com qualquer valor. Salva e testa na próxima conta do restaurante."

```json
{
  "marca": { "nome": "Prof. Tiago Moura", "area": "Matemática" },
  "correcoes": { "DOSI": "Doze.", "80,00": "80.", "12,00": "12", "4": "Quatro." },
  "semLegenda": [ { "de": 0.85, "ate": 2.5 } ],
  "momentos": [
    { "tipo": "titulo", "de": 0.45, "ate": 3.5, "legenda": true, "rotulo": "Cálculo mental", "linhas": ["15%", "de cabeça?"], "destaque": "15%", "sublinharEm": 2.95 },
    { "tipo": "virgula", "de": 3.5, "ate": 8.15, "legenda": true, "passo": "Passo 1", "titulo": "10%", "tituloEm": 5.21,
      "prefixo": "R$", "numero": "80", "numeroEm": 4.12, "casas": 1, "moverEm": 6.38, "resultado": "8", "resultadoEm": 7.6 },
    { "tipo": "fracao", "de": 8.15, "ate": 10.7, "legenda": true, "passo": "Passo 2", "titulo": "5%", "tituloEm": 9.4,
      "numerador": "8", "nota": "metade", "notaEm": 8.2, "tracoEm": 8.5, "denominador": "2", "denominadorEm": 8.72, "resultado": "4", "resultadoEm": 10.2 },
    { "tipo": "coluna", "de": 10.7, "ate": 12.51, "legenda": true, "passo": "Passo 3", "titulo": "soma", "tituloEm": 10.76,
      "operador": "+", "operadorEm": 11.0, "itens": [ { "valor": "8", "rotulo": "10%" }, { "valor": "4", "rotulo": "5%" } ],
      "tracoEm": 11.5, "total": { "valor": "12", "rotulo": "15%", "em": 11.95 } },
    { "tipo": "resultado", "de": 12.51, "ate": 15.18, "rotulo": "Resposta", "conta": "15% de 80", "contaEm": 12.6, "destaque": "15%", "valor": "R$ 12", "valorEm": 14.37 },
    { "tipo": "cta", "de": 15.18, "ate": 19.92,
      "regra": { "rotulo": "Funciona com qualquer valor", "linhas": [ { "texto": "15% = 10% + metade", "em": 15.28, "destaque": "15%" } ], "molduraEm": 17.05 },
      "texto": "Salva e testa na próxima conta", "icone": "salvar" }
  ]
}
```

O 8 da vírgula vira o numerador; o 8 e o 4 vão para a coluna; o 12 vira a resposta (deslizam sozinhos de uma página para a outra).
