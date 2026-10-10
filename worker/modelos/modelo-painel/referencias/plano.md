# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática de layout: tela cheia e painel
3. Números: da fala, de uma tabela, de uma conta ou ilustrativos
4. Os blocos (`momentos`): os 11 universais e os próprios do Painel
5. Regras de tempo
6. Legenda e correções
7. Sons
8. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla Nunes", "area": "Nutricionista" },
  "sfx": true,
  "correcoes": { "500,00": "500", "100,00": "100 mil" }
}
```

- `marca`: o nome aparece numa etiqueta no canto da janela (durante os painéis) e, com a área, na assinatura do fechamento (`cta`). A área também é o rótulo âmbar da `abertura`. `nome` vazio = sem etiqueta e sem assinatura.
- `sfx`: `false` desliga os sons.
- `retrato` (opcional): o enquadramento da pessoa dentro da janela. Sem ele, o template calcula pelo tamanho do rosto medido no rastreio (cabeça e ombros, perto ou longe da câmera). Só use se os quadros mostrarem a janela cortando o cabelo ou com rosto demais: `{ "zoom": 1.65, "ancoraY": 0.45 }` (`zoom` de 1 a 2,6, menor mostra mais; `ancoraY` = altura do rosto na janela, 0 = topo, 1 = base).
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática de layout: tela cheia e painel

É o que dá a cara do modelo. O próprio tipo do momento decide o estado:

| Estado | Blocos | O que acontece |
|---|---|---|
| **Tela cheia** | `abertura`, `gancho`, `numero`, `comparacao`, `destaque` (frase), `definicao`, `frase`, `pergunta`, `cta`, e os trechos sem momento | A pessoa ocupa o quadro, rosto no centro, aproximação lenta e contínua; o bloco é um cartão grafite na altura do peito, dentro da `zona`. |
| **Painel** | `grafico`, `divisao`, `painel`, `topicos`, `passos`, `destaque` com `eixo` (barras) | A pessoa encolhe para uma **janela** num canto de cima e o painel grafite ocupa a tela: cabeçalho ao lado da janela, corpo largo embaixo, nota de rodapé e a legenda numa faixa fixa. |

O template já cumpre:
- **Troca de estado sem tela vazia**: o painel se monta **embaixo** da pessoa um pouco antes do `de` (cabeçalho, grade, cartões "a lápis"); no `de`, ela encolhe em 0,6 s até a janela e vai revelando o painel pronto, enquanto o cartão de tela cheia anterior some cruzando. Na volta (no `ate`), ela cresce **por cima** do painel, que sai junto, e o cartão seguinte entra durante a troca.
- **Painéis seguidos** (um começa onde o outro termina): a janela troca de canto (direita, esquerda, direita…). O corpo antigo desliza para fora enquanto o novo entra; a tela nunca fica vazia. Para escolher o canto: `"janela": "esq"` ou `"dir"`.
- **Abertura no início**: o cartão já aparece no primeiro quadro (vira a capa) e as palavras entram na fala.
- **Último momento**: fica até o último quadro.

Cuidados seus:
- Entre dois painéis, um trecho de tela cheia com menos de ~1,8 s fica picotado (encolhe, cresce, encolhe). Emende os painéis (`ate` de um = `de` do outro) ou ponha um bloco de tela cheia mais longo.
- Não deixe a pessoa na janela mais de ~15 s seguidos: ela é o rosto do vídeo.
- Painel com menos de 3 s não dá tempo de ler; tela cheia com menos de 1,8 s também não.

## 3. Números: da fala, de uma tabela, de uma conta ou ilustrativos

Um vídeo com número errado é um problema sério para quem assina. Regras:

1. **Número dito** pela pessoa → entra direto (`numero`, `dados` do `grafico`, `valor` da `divisao` e dos cartões do `painel`). Escreva como número (`83000`, não `"83 mil"`); o template formata em pt-BR (83.000; 1,5) e conta até ele.
2. **Tabela do usuário** (planilha, print) → pode usar; ponha a fonte na `nota` ("Fonte: balanço 2025").
3. **Conta sua** a partir de parâmetros que a pessoa disse (aporte, taxa, prazo) → é uma **simulação**: use o gráfico de simulação (seção 4, `grafico` com `series`), mostre os parâmetros na `ficha` e deixe a `nota` "Simulação ilustrativa". Faça a conta com um script, não de cabeça, e confira que ela bate com o que a pessoa disse. Se não bater, avise o usuário antes de renderizar.
4. **Sem números** → use o modo **ilustrativo** do bloco: `grafico` com `tendencia` (e `ilustrativo: true`), `divisao` com `peso` no lugar de `valor`, `painel` com `texto` no lugar de `valor`, barras do `destaque` sem `valores`. A forma mostra a ideia, **nenhum número aparece** e a etiqueta "ilustrativo" fica visível no canto do painel.

Nunca invente número para um gráfico ficar bonito.

## 4. Os blocos (`momentos`)

Campos comuns a todos: `tipo`, `de`, `ate` e `legenda` (opcional; `true` = a legenda continua durante o momento). Todo campo `em`/`…Em` é o instante de uma palavra dita (o `em` dela em `work/palavras.json`).

Os textos são medidos e reduzidos para caber (até 2 ou 3 linhas). Os limites abaixo são para o texto ficar grande e legível; passou deles, encurte com as palavras da fala.

### Campos comuns dos painéis (`grafico`, `divisao`, `painel`, `topicos`, `passos`, `destaque` em barras)

- `titulo` (opcional): o assunto do painel, em caixa alta âmbar no topo do cabeçalho, até ~40 caracteres (2 linhas). Ex.: "Ingredientes", "Tem gente que perde", "Bitcoin".
- `rotulo` (opcional): se você usar `rotulo`, ele vira a linha âmbar e o `titulo` vira uma frase maior no meio do cabeçalho (até ~34 caracteres).
- `ficha` (opcional, até 3): linhas "chave → valor" no cabeçalho, cada uma acendendo no seu `em` (os parâmetros de uma conta: "Aporte → R$ 500/mês"). Chave até 10 caracteres, valor até 12.
- `nota` (opcional): rodapé (a fonte do dado, "Simulação ilustrativa"). Sem `nota`, nada.
- `janela` (opcional): `"esq"` ou `"dir"`.
- `legenda: true` é o normal nos painéis.

### `abertura` (tela cheia)

```json
{ "tipo": "abertura", "de": 0, "ate": 2.99, "texto": "Brigadeiro de colher cremoso em três passos", "destaque": "três passos" }
```
- `texto`: o título, até ~60 caracteres, **com as palavras na ordem da fala** (cada palavra entra quando é dita).
- `em` (opcional): quando a primeira palavra do `texto` é dita (padrão: o `de`). Use quando o momento começa antes do texto.
- `destaque` (opcional): trecho exato do `texto` que sai em menta.
- `rotulo` (opcional): a linha âmbar acima do título. Padrão: a `marca.area`.

### `gancho` (tela cheia, próprio do Painel): abertura com número

```json
{ "tipo": "gancho", "de": 0, "ate": 2.85, "linhas": [ { "em": 0.03, "texto": "O Bitcoin rompeu" } ],
  "numero": { "em": 1.34, "para": 83000, "prefixo": "US$ " } }
```
- `linhas`: 1 ou 2, até 16 caracteres cada; `em` = a primeira palavra da linha.
- `numero`: conta de `de` (padrão 0) até `para` a partir de `em` (a palavra do número), com uma curva se desenhando ao lado. `prefixo`, `sufixo`, `casas`. Se `para` < `de`, é uma queda (cor de perda). `curva: false` tira a curva.
- `rotulo` (opcional): linha âmbar.

### `topicos` (painel): lista sem ordem

```json
{ "tipo": "topicos", "de": 8.08, "ate": 12.09, "legenda": true, "titulo": "Primeiro",
  "itens": [ { "texto": "Tudo na panela", "em": 9.05 }, { "texto": "Fogo baixo", "em": 10.12 }, { "texto": "Mexendo sem parar", "em": 11.01 } ] }
```
- `itens`: 2 a 5. `texto` de 2 a 6 palavras (até ~32 caracteres); `em` = a palavra que nomeia o item. `detalhe` (opcional, até ~28 caracteres) sai embaixo, em mono; `detalheEm` (opcional) faz o detalhe entrar na palavra dele.
- `tom` (opcional): `"positivo"` (menta, padrão), `"negativo"` (vermelho suave: erros, riscos, motivos de perder) ou `"neutro"` (âmbar).

### `passos` (painel): sequência em ordem

```json
{ "tipo": "passos", "de": 29.95, "ate": 33.75, "legenda": true, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```
- Mesmos campos de `topicos` (sem `tom`). Os nós são numerados 1, 2, 3…; a linha avança até cada etapa na palavra dela.

### `numero` (tela cheia): um indicador

```json
{ "tipo": "numero", "de": 0, "ate": 2.6, "valor": 56, "sufixo": "%", "em": 0.6,
  "rotulo": "dos juros chegam nos últimos três anos", "titulo": "Juros compostos" }
```
- `valor` (número) conta a partir de `em`. `prefixo` ("R$ ", "US$ "), `sufixo` ("%", " mil", " kg"), `casas`. `inicio` (opcional): de onde a contagem parte (padrão 0).
- `rotulo`: o que o número é, até ~50 caracteres. `rotuloEm` (opcional): quando ele aparece; se for dito depois do número, vai embaixo dele.
- `titulo` (opcional): linha âmbar acima. `ilustrativo: true` põe a etiqueta (use só se o número for um exemplo dito como exemplo).
- Porcentagem até 100 ganha uma barra que enche junto. Inteiros abaixo de 10 aparecem direto, sem contar.

### `comparacao` (tela cheia)

```json
{ "tipo": "comparacao", "de": 8.62, "ate": 12.85,
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 8.77, "vereditoEm": 9.31 },
             { "rotulo": "Seu bolso", "texto": "sem dinheiro", "em": 10.91, "vereditoEm": 11.99 } ],
  "vencedor": 0 }
```
- `lados`: exatamente 2. `rotulo` até ~16 caracteres (o título do cartão); `texto` até ~28 (o veredito); `em` = quando o lado é dito.
- `vencedor` (0 ou 1, opcional): o lado bom ganha ✓ e a curva completa; o outro, ✗ e a curva interrompida com a parte perdida tracejada. `modo: "errado-certo"` sem `vencedor` = o lado 1 vence.
- `vencedorEm` (opcional): quando os dois se resolvem. Melhor ainda: `vereditoEm` em cada lado (a palavra do veredito: "**ganha**", "**perde**"). Sem nenhum, cada lado resolve 1 s depois do seu `em`.
- Sem vencedor (`modo: "contra"` ou `"antes-depois"`): os cartões ficam lado a lado, com "×" ou "→" entre eles.
- `titulo` (opcional): etiqueta acima dos cartões.

### `grafico` (painel, assinatura)

Com números ditos:
```json
{ "tipo": "grafico", "de": 9.0, "ate": 12.0, "legenda": true, "titulo": "Bitcoin", "forma": "linha", "unidade": "US$",
  "dados": [ { "rotulo": "2019", "valor": 7000, "em": 9.4 }, { "rotulo": "2021", "valor": 64000, "em": 10.0 },
             { "rotulo": "2022", "valor": 16000, "em": 10.6 }, { "rotulo": "2024", "valor": 83000, "em": 11.2 } ] }
```
Sem números (ilustrativo):
```json
{ "tipo": "grafico", "de": 2.85, "ate": 8.62, "legenda": true, "titulo": "Bitcoin", "forma": "linha",
  "tendencia": "sobe", "tendenciaEm": 6.64, "ilustrativo": true, "leitura": "ciclo de alta",
  "itens": [ { "em": 5.30, "texto": "bull market" } ] }
```
- `forma`: `"linha"` (área que se desenha), `"barras"` ou `"pizza"` (no Painel, a pizza é a barra que se divide, igual à `divisao`).
- `dados`: 2 a 6 números **ditos** (com 1 só, use `numero`; o `conferir` recusa), cada um com `rotulo` (até ~10 caracteres no eixo), `valor` e `em`. A ponta da linha (ou a barra) chega a cada valor na palavra dele; o contador do cabeçalho acompanha. `unidade`: "R$", "US$", "%", "mil", "kg"… (vira prefixo ou sufixo).
- `tendencia` (sem `dados`): `"sobe"`, `"cai"` ou `"oscila"`; a forma inteira espera tracejada "a lápis" e a linha colorida a percorre até o `tendenciaEm` (a palavra que fecha a ideia); `ilustrativo: true` é obrigatório. `leitura` (opcional, até ~24 caracteres, palavras da fala): a leitura grande no cabeçalho ao lado da seta ("em alta", "caindo", "deixa esfriar"), que aparece no `tendenciaEm`. `eixo` (opcional): rótulos do eixo horizontal sem números (["Seg", "Ter", "Qua"]).
- `tom` (opcional): cor da tendência. Padrão: sobe = menta, cai = vermelho suave, oscila = âmbar. Quando cair é bom (ansiedade, custo, dor), use `"tom": "positivo"`; para algo neutro (temperatura, tempo), `"neutro"`.
- `itens` (opcional, até 3 anotações): sem `ponto` → etiqueta no alto do gráfico; com `ponto` (índice do ponto: dos `dados`, do `eixo`, ou de 0 a 8 na forma ilustrativa) → linha tracejada naquele ponto e o texto ao lado. Até ~16 caracteres.
- **Simulação calculada** (próprio do Painel, seção 3): `eixo` (3 a 13 pontos), `series` (1 ou 2, a segunda empilha sobre a primeira e ganha a menta), `prefixo`, `eixoNome`, `desenho: { de, ate }`, `total` ("saldo no ano {x}"), `itens` com `serie` (acende a faixa e escreve o valor final). Junto vão `"forma": "linha"`, `"tendencia"` e `"ilustrativo": true`, e a `nota` "Simulação ilustrativa". Veja o exemplo completo (seção 8).

### `destaque` (tela cheia): a palavra ou frase que bate forte

```json
{ "tipo": "destaque", "de": 12.85, "ate": 15.9, "nivel": "alerta", "texto": "Para a maioria das pessoas", "em": 13.46,
  "detalhe": "mesmo na alta", "detalheEm": 14.93 }
```
- `texto`: até ~40 caracteres, na ordem da fala; `em` = a primeira palavra dele.
- `nivel`: `"alerta"` (padrão; vermelho suave: risco, erro, perda) ou `"chave"` (menta: a ideia principal, a dica).
- `detalhe` (opcional, até ~50): linha em mono embaixo; `detalheEm` = quando entra (padrão: logo depois do texto).

**`destaque` em barras (painel, próprio do Painel)**: com `eixo` (e `valores`), vira barras que crescem uma a uma; no `em` a `faixa` acende, ganha uma chave com a soma e o `texto` em cima. Sem `valores` (ou com `ilustrativo: true`), as alturas são só a forma e nenhum número aparece.
```json
{ "tipo": "destaque", "de": 11.63, "ate": 16.75, "legenda": true, "texto": "nos últimos 3 anos", "em": 15.26,
  "rotulo": "Juros ganhos em cada ano", "prefixo": "R$ ", "eixo": ["1","2","3","4","5","6","7","8","9","10"],
  "valores": [270,898,1587,2345,3181,4098,5108,6219,7441,8785], "faixa": { "de": 7, "ate": 9 },
  "numero": { "em": 13.01, "de": 0, "para": 56, "sufixo": "%", "texto": "dos juros" }, "nota": "Simulação ilustrativa" }
```
- `eixo`: 3 a 12 rótulos curtos. `faixa`: índices (a partir de 0, inclusive) das barras que acendem; sem ela, a última. `numero` (opcional): o contador do cabeçalho.

### `definicao` (tela cheia)

```json
{ "tipo": "definicao", "de": 2.6, "ate": 5.4, "termo": "Bull market", "em": 2.8,
  "significado": "um ciclo de alta prolongado das criptomoedas", "significadoEm": 3.8 }
```
- `termo` até ~20 caracteres (mono menta, sublinhado); `significado` até ~70 (abre numa caixa de dica no `significadoEm`).

### `frase` (tela cheia)

```json
{ "tipo": "frase", "de": 33.75, "ate": 36.5, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68 }
```
- `texto` até ~70 caracteres, com as palavras na ordem da fala (cada palavra entra quando é dita). `em` (opcional): quando a primeira palavra do `texto` é dita (padrão: o `de`); use quando o momento começa antes dela (ex.: o momento cobre "Segundo," e o texto começa em "quando").
- `destaque` (opcional): trecho em menta. `risco` (opcional): trecho riscado em vermelho suave no `riscoEm` (a palavra que nega: "sem promessa…").

### `pergunta` (tela cheia)

```json
{ "tipo": "pergunta", "de": 23.7, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?" }
```
- `texto` até ~70 caracteres, na ordem da fala; `em` (opcional) = quando a pergunta começa a ser dita (padrão: o `de`). Sem `opcoes`, um campo com o cursor piscando aparece depois da pergunta.
- `opcoes` (opcional, 2 a 4; o `conferir` recusa 1 ou mais de 4): `{ "texto": "Comprar por impulso", "em": 6.4 }`, até ~30 caracteres cada.

### `cta` (tela cheia): fechamento

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "icone": "link", "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais",
  "apoio": "e assiste essa aula agora" }
```
- `texto`: a chamada, até ~32 caracteres, na ordem da fala; `em` (opcional) = quando ela começa a ser dita (padrão: o `de`). `destaque` (opcional): trecho em menta.
- `icone`: `seguir` (padrão), `salvar`, `comentar` ou `link`.
- `apoio` (opcional, até ~60): o resto da frase; começa na palavra seguinte à chamada.
- `campo` (opcional, próprio do Painel): um campo que digita valores, para "faça a conta com o seu valor": `{ "em": 21.87, "rotulo": "Seu aporte", "valores": ["R$ 1.000"] }`.
- A assinatura (`marca`) aparece por último; o fechamento fica até o fim do vídeo.

### `divisao` (painel, assinatura): um todo que se divide

```json
{ "tipo": "divisao", "de": 8.74, "ate": 11.63, "legenda": true, "rotulo": "De onde vem o saldo", "prefixo": "R$ ", "total": "total em 10 anos",
  "itens": [ { "em": 8.81, "valor": 60000, "texto": "do seu bolso" }, { "em": 9.35, "valor": 39932, "texto": "juros sobre juros" } ],
  "nota": "Simulação ilustrativa" }
```
Sem números:
```json
{ "tipo": "divisao", "de": 14.5, "ate": 17.0, "legenda": true, "titulo": "Quem lucra na alta", "ilustrativo": true,
  "itens": [ { "texto": "a maioria não lucra", "peso": 8, "em": 14.8 }, { "texto": "poucos lucram", "peso": 2, "em": 15.6 } ] }
```
- `itens`: 2 a 5 partes, da esquerda para a direita, cada uma no seu `em`; `texto` até ~24 caracteres. `valor` = número dito; sem número, `peso` = só o tamanho relativo da parte (nunca aparece). Partes só com `peso` deixam o painel ilustrativo sozinho.
- Com números: o cabeçalho conta o total (`total` = o texto sob ele); em porcentagem (`unidade` ou `sufixo` "%"), mostra a parte em destaque. Sem números: o cabeçalho lê o nome da parte que acabou de entrar.
- `destaque` (opcional): índice da parte na cor de destaque (padrão: a última). `tom: "negativo"` pinta essa parte de vermelho suave.
- `fatias` + `grifoEm` (opcionais, com números reais): no `grifoEm`, a parte em destaque se revela feita de fatias (ex.: os juros de cada ano). As fatias somam o valor da parte.

### `painel` (painel, assinatura): painel de indicadores

```json
{ "tipo": "painel", "de": 2.99, "ate": 8.08, "legenda": true, "titulo": "Ingredientes",
  "cartoes": [ { "rotulo": "Leite condensado", "valor": 1, "sufixo": " lata", "em": 3.11 },
               { "rotulo": "Manteiga", "valor": 1, "sufixo": " colher", "em": 4.9 },
               { "rotulo": "Chocolate em pó", "valor": 3, "sufixo": " colheres", "em": 6.29 } ] }
```
- `cartoes`: 2 a 4 (3 = linhas largas; 2 ou 4 = duas colunas). `rotulo` até ~20 caracteres (caixa alta âmbar); `em` = a palavra do cartão.
- O conteúdo é **um** destes: `valor` (número dito, conta; com `prefixo`, `sufixo`, `casas`) ou `texto` (um estado em palavras da fala, até ~22 caracteres: "baixo", "sem critério", "saudável"). Inteiros abaixo de 10 ("1 lata", "3 colheres") aparecem direto, sem contar. Unidade em palavra vai no `sufixo` com espaço: `" lata"`, `" kg"`.
- `tom` (opcional): `"positivo"`, `"negativo"` ou `"neutro"`. `tendencia` (opcional): `"sobe"`, `"cai"` ou `"estavel"` (seta no canto do cartão).
- Organiza qualquer assunto como um dashboard: ingredientes e quantidades, sintomas e estados, motivos e riscos, metas e resultados.

## 5. Regras de tempo

- `de`: o `em` da primeira palavra que o momento cobre, menos ~0,05 (nunca antes do `ate` do momento anterior).
- `ate`: o `em` da **primeira palavra que o momento não cobre**, ou o fim do vídeo. Momentos vizinhos podem encostar (e devem, entre dois painéis).
- Cada item entra no `em` da palavra que o nomeia. Nada aparece antes de ser dito.
- Duração mínima: 1,8 s em tela cheia; 3 s num painel.
- Nada parado mais de ~2,5 s: um painel longo precisa de itens, anotações ou a ficha entrando por dentro; se não houver, divida em dois momentos.
- Nos blocos que se montam palavra por palavra (`abertura`, `frase`, `pergunta`, `cta`, `destaque`), o texto da tela segue a ordem da fala, a partir do `em` do bloco (ou do `de`, se não houver `em`).

## 6. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez, numa cápsula escura, com os números em mono menta. Ela fica abaixo do queixo em tela cheia, abaixo do cartão quando o momento tem `legenda: true`, e na faixa fixa do rodapé nos painéis. Ela **some durante um momento sem `legenda: true`**: use `legenda: true` nos painéis e deixe sem nos blocos de tela cheia (eles já mostram o que é dito). Para esconder um pedaço: `"semLegenda": [ { "de": 2.9, "ate": 5.4 } ]`.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação; a chave pode ter várias palavras seguidas e `""` apaga a palavra.
- Número escrito errado: `"500,00": "500"`, `"100,00": "100 mil"`.
- Frase sem ponto final que emenda na próxima legenda: `"bolso": "bolso."` (se a palavra se repete, use as duas últimas palavras como chave).
- Forçar uma quebra de linha: uma faixa `semLegenda` de 0,01 s entre as duas palavras.
- Cuidado com palavras comuns: `"para": "pra"` troca também o verbo parar.

Só corrija o que você tem certeza. Não edite `palavras` à mão. Para ver as linhas: `node scripts/legendas.mjs`.

## 7. Sons

Automáticos, raros e tonais: um tom grave quando o painel abre (vindo da tela cheia), uma nota suave quando um item, cartão ou dado se revela (subindo nas etapas dos `passos`), uma subida quando um número conta, ✓ sobe e ✗ desce, um tom grave no `destaque` de alerta, uma nota no fechamento. A troca de canto da janela não tem som. `"sfx": false` desliga tudo.

## 8. Exemplos completos

### Finanças, com simulação (o vídeo de exemplo do modelo)

Roteiro: "Quinhentos reais por mês podem virar cem mil. Investindo a dez por cento ao ano, em dez anos você coloca sessenta mil do seu bolso. Os outros quarenta mil vêm dos juros sobre juros. E o detalhe: mais da metade desses juros aparece só nos últimos três anos. Quem começa cedo ganha. Quem para no meio perde a melhor parte. Me segue pra fazer a conta com o seu valor."

A conta (aporte de R$ 500 no fim de cada mês, 10% ao ano, taxa mensal `1,10^(1/12) − 1`) dá o saldo de cada ano: 0 / 6.270 / 13.168 / 20.755 / 29.100 / 38.281 / 48.379 / 59.487 / 71.706 / 85.147 / 99.932. Juros = saldo − aplicado.

```json
{
  "marca": { "nome": "Tiago Moura", "area": "Planejador financeiro" },
  "retrato": { "zoom": 1.65, "ancoraY": 0.45 },
  "momentos": [
    { "tipo": "gancho", "de": 0, "ate": 3.27, "rotulo": "Planejamento financeiro",
      "linhas": [ { "em": 0.34, "texto": "R$ 500 por mês" }, { "em": 1.96, "texto": "podem virar" } ],
      "numero": { "em": 2.37, "de": 500, "para": 100000, "prefixo": "R$ " } },
    { "tipo": "grafico", "de": 3.27, "ate": 8.74, "legenda": true, "forma": "linha", "tendencia": "sobe", "tendenciaEm": 6.45,
      "ilustrativo": true, "rotulo": "Juros compostos", "nota": "Simulação ilustrativa",
      "ficha": [ { "em": 3.65, "rotulo": "Aporte", "valor": "R$ 500/mês" }, { "em": 4.21, "rotulo": "Taxa", "valor": "10% a.a." },
                 { "em": 5.67, "rotulo": "Prazo", "valor": "10 anos" } ],
      "eixo": ["0","1","2","3","4","5","6","7","8","9","10"], "eixoNome": "anos", "prefixo": "R$ ",
      "series": [ { "nome": "Seu dinheiro", "valores": [0,6000,12000,18000,24000,30000,36000,42000,48000,54000,60000] },
                  { "nome": "Juros", "valores": [0,270,1168,2755,5100,8281,12379,17487,23706,31147,39932] } ],
      "desenho": { "de": 4.05, "ate": 6.45 }, "total": "saldo no ano {x}",
      "itens": [ { "em": 7.39, "texto": "do seu bolso", "serie": 0 } ] },
    { "tipo": "divisao", "de": 8.74, "ate": 11.63, "legenda": true, "rotulo": "De onde vem o saldo", "prefixo": "R$ ",
      "total": "total em 10 anos", "nota": "Simulação ilustrativa",
      "itens": [ { "em": 8.81, "valor": 60000, "texto": "do seu bolso" }, { "em": 9.35, "valor": 39932, "texto": "juros sobre juros" } ],
      "fatias": [270,898,1587,2345,3181,4098,5108,6219,7441,8785], "grifoEm": 10.47 },
    { "tipo": "destaque", "de": 11.63, "ate": 16.75, "legenda": true, "texto": "nos últimos 3 anos", "em": 15.26,
      "rotulo": "Juros ganhos em cada ano", "prefixo": "R$ ", "nota": "Simulação ilustrativa",
      "eixo": ["1","2","3","4","5","6","7","8","9","10"], "valores": [270,898,1587,2345,3181,4098,5108,6219,7441,8785],
      "faixa": { "de": 7, "ate": 9 }, "numero": { "em": 13.01, "de": 0, "para": 56, "sufixo": "%", "texto": "dos juros" } },
    { "tipo": "comparacao", "de": 16.75, "ate": 20.95, "vencedor": 0,
      "lados": [ { "rotulo": "Começa cedo", "texto": "ganha", "em": 16.88, "vereditoEm": 17.85 },
                 { "rotulo": "Para no meio", "texto": "perde a melhor parte", "em": 18.63, "vereditoEm": 19.72 } ] },
    { "tipo": "cta", "de": 20.95, "ate": 23.4, "texto": "Me segue", "apoio": "pra fazer a conta com o seu valor",
      "icone": "seguir", "campo": { "em": 21.87, "rotulo": "Seu aporte", "valores": ["R$ 1.000"] } }
  ],
  "semLegenda": [ { "de": 12.69, "ate": 12.7 } ],
  "correcoes": { "500,00": "500", "100,00": "100 mil", "sobre juros": "sobre juros." }
}
```

### Receita, quase sem números (outro assunto, o mesmo estilo)

Roteiro: "Brigadeiro de colher cremoso em três passos: uma lata de leite condensado, uma colher de manteiga e três colheres de chocolate em pó. Primeiro: tudo na panela, fogo baixo, mexendo sem parar. Segundo: quando der para ver o fundo da panela, desliga. Terceiro: passa para o pote ainda quente e deixa esfriar. Salva essa receita e me marca quando fizer."

```json
{
  "marca": { "nome": "Tiago", "area": "Confeitaria" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 2.99, "texto": "Brigadeiro de colher cremoso em três passos", "destaque": "três passos" },
    { "tipo": "painel", "de": 2.99, "ate": 8.08, "legenda": true, "titulo": "Ingredientes",
      "cartoes": [ { "rotulo": "Leite condensado", "valor": 1, "sufixo": " lata", "em": 3.11 },
                   { "rotulo": "Manteiga", "valor": 1, "sufixo": " colher", "em": 4.9 },
                   { "rotulo": "Chocolate em pó", "valor": 3, "sufixo": " colheres", "em": 6.29 } ] },
    { "tipo": "topicos", "de": 8.08, "ate": 12.09, "legenda": true, "titulo": "Primeiro",
      "itens": [ { "texto": "Tudo na panela", "em": 9.05 }, { "texto": "Fogo baixo", "em": 10.12 }, { "texto": "Mexendo sem parar", "em": 11.01 } ] },
    { "tipo": "frase", "de": 12.09, "ate": 15.41, "texto": "Segundo: quando der para ver o fundo da panela, desliga.", "destaque": "desliga." },
    { "tipo": "grafico", "de": 15.41, "ate": 18.68, "legenda": true, "titulo": "Terceiro", "forma": "linha",
      "tendencia": "cai", "tendenciaEm": 18.15, "ilustrativo": true, "tom": "neutro", "leitura": "deixa esfriar",
      "itens": [ { "em": 16.99, "texto": "ainda quente", "ponto": 0 } ] },
    { "tipo": "cta", "de": 18.68, "ate": 21.36, "texto": "Salva essa receita", "icone": "salvar", "apoio": "e me marca quando fizer" }
  ]
}
```
