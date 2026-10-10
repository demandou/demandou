# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastro), `zona` (este modelo não usa), `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, raramente, `pessoa`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. Cada momento é uma página
3. A peça que fica, os companheiros e a grade
4. Os blocos universais
5. A assinatura: `partes` e `grupo`
6. Blocos extras: `selo`, `titulo`, `marca`, `prato`, `lista`
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos
10. Ícones disponíveis

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Moura", "area": "Nutricionista" },
  "sfx": true,
  "correcoes": { "1/4": "Um quarto," }
}
```

- `marca`: aparece no rodapé da página (sempre) e no ladrilho de assinatura (`marca`), que o modelo também usa sozinho para completar uma página. Nome até ~16 caracteres, área até ~24. `nome` vazio = sem assinatura.
- `sfx`: `false` desliga os sons.
- `pessoa` (opcional, raro): `{ "zoom": 1.2 }` aproxima o rosto em todos os ladrilhos (gravação muito aberta); `0.8` afasta. `{ "ancoraY": 0.4 }` fixa a altura do rosto dentro do ladrilho (0 = topo, 1 = base). Sem `pessoa`, o template escolhe o zoom pelo tamanho do ladrilho e pelo tamanho do rosto medido no rastreio (selfie = menos zoom).
- `rosto`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. Cada momento é uma página

Um momento = uma página do mosaico. O `tipo` do momento é o **bloco principal** da página, com os campos dele; o resto (grade, cores, lugar da pessoa) é opcional.

```json
{ "tipo": "destaque", "de": 12.88, "ate": 14.9, "nivel": "alerta", "texto": "Para a maioria das pessoas", "em": 13.46 }
```

Campos de página (todos opcionais, além de `de` e `ate`):

| Campo | O que faz |
|---|---|
| `de`, `ate` | começo e fim da página (segundos) |
| `fica` | `true`: o ladrilho deste momento continua nas páginas seguintes, menor (a peça que fica). Um número: continua até esse segundo. |
| `sozinho` | `true`: esta página não leva a peça que fica |
| `blocos` | ladrilhos companheiros desta página (seção 3) |
| `cor` | cor do ladrilho principal: `folha`, `tomate`, `gema`, `creme`, `tinta` (sem ela, o modelo escolhe sem repetir a cor do vizinho) |
| `grade`, `linhas`, `colunas`, `espelhar`, `area` | a grade escrita à mão (seção 3) |
| `legenda` | `true`: a legenda continua aparecendo durante a página (só em ladrilho de pessoa com 560 px de largura ou mais) |
| `id` | nome do ladrilho, para um companheiro de uma página seguinte continuar este bloco (`{ "id": "…" }`) |

O que o template faz sozinho:

- **Escolhe a grade**: o bloco principal no ladrilho maior; a pessoa num ladrilho que muda de lugar a cada página (andando num eixo só, sem cruzar com a peça que continua); o companheiro ao lado dela. Blocos de desenho (`grafico`, `partes`, `grupo`, listas com 4 ou 5 itens) ganham um ladrilho mais alto.
- **Remonta a página** em 0,72 s na troca de momento (encostada no corte mais próximo, para esconder o pulo do corte). Momentos encostados (o próximo começa até 0,3 s depois) passam direto de uma página para a outra; com um respiro maior, a pessoa volta à tela cheia com a legenda.
- **Gravação de selfie** (rosto grande): uma página sem companheiro leva o bloco anterior, menor, ao lado da pessoa (se ele couber num ladrilho pequeno: número, destaque, frase, título, definição, selo, pergunta sem opções, partes) ou a assinatura com nome e área. Assim a pessoa fica sempre num ladrilho em pé, com a cabeça inteira.
- **Cores**: cada bloco tem a sua preferida; duas cores iguais nunca ficam lado a lado e o ladrilho principal troca de cor de uma página para a outra.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais das fontes e diminui o corpo até caber (até 2 a 4 linhas), sem cortar nem vazar. Os limites abaixo existem para o texto não ficar pequeno demais.
- **Último momento**: se termina a menos de 0,3 s do fim, fica até o último quadro.

## 3. A peça que fica, os companheiros e a grade

**A peça que fica** é o fio condutor do Mosaico (no exemplo, o prato). Ponha `"fica": true` no momento dela: nas páginas seguintes ela vira um ladrilho menor ao lado da pessoa, andando e mudando de tamanho a cada remontagem, até outra peça com `fica` tomar o lugar (ou até o segundo dado em `fica`). Boas peças que ficam: o disco das `partes`, o `numero` principal, um `destaque` curto. Uma por vez.

**Companheiros** (`blocos`): ladrilhos extras da página. Cada um é um bloco completo (`{ "tipo": "titulo", "quebra": ["é mais", "simples"] }`) ou a continuação de um ladrilho anterior (`{ "id": "prato" }`). Sem `grade`, o modelo põe cada um num ladrilho livre; com `grade`, diga a letra (`"area": "b"`).

**A grade à mão** (opcional): escrita como `grid-template-areas` do CSS, cada string é uma linha, cada letra um ladrilho, `p` é a pessoa. O bloco principal fica na letra `a` (ou na letra de `area`).

```json
{ "tipo": "grupo", "de": 6.58, "ate": 11.6, "grade": ["ap", "bb"], "linhas": [640, 1200], "area": "b", "cor": "tomate",
  "fracao": "1/4", "titulo": "Proteína", "itens": [ … ],
  "blocos": [ { "id": "prato", "area": "a" } ] }
```

- Todas as strings com o mesmo número de letras; cada letra forma um **retângulo**; `p` aparece em toda grade; toda letra tem um bloco (letra que sobrar ganha a assinatura com nome e área).
- `linhas` e `colunas`: pesos da altura de cada linha e da largura de cada coluna (`[2, 1]` = a primeira tem o dobro). `espelhar: true` inverte na horizontal.
- O ladrilho da pessoa: pelo menos ~400 px de largura e altura de pelo menos 0,55 × a largura. Nunca uma coluna estreita da altura da tela.
- A grade vai do topo até y = 1690; embaixo fica o rodapé (nome, área e uma peça por página). Nenhum texto passa de y = 1545 (interface do app): ladrilho de texto na última linha fica com um pedaço vazio embaixo.
- Arranjos prontos (`"grade": "<nome>"`): `capa` (`["tt","ap","bp"]`), `metade` (`["aa","bp"]`), `L` (`["ap","bb"]`), `destaque` (`["aa","pb"]`), `palco` (`["aa","aa","bp"]`), `quartos` (`["ab","cp"]`), `faixas` (`["a","p","b"]`), `retrato` (`["pp","ab"]`), `pilha` (`["a","p"]`), `base` (`["p","a"]`).

## 4. Os blocos universais

Os 11 blocos que todo modelo do pack tem, com os mesmos campos. Largura útil num ladrilho de largura inteira: ~930 px; em meio ladrilho: ~420 px.

### `abertura`: o tema, a promessa (ladrilho verde)

```json
{ "tipo": "abertura", "de": 0.11, "ate": 3.57, "texto": "Montar um prato equilibrado", "destaque": "equilibrado", "em": 0.2 }
```
- `texto` até ~45 caracteres; se monta palavra por palavra, assentado embaixo do ladrilho (até 128 px).
- `destaque` (opcional): trecho exato na cor de ênfase. `em` (opcional): quando o texto começa a ser dito (padrão: `de`). `rotulo` (opcional): chapéu em caixa alta. `quebra` (opcional): as linhas escritas à mão.

### `topicos`: lista sem ordem (ladrilho creme)

```json
{ "tipo": "topicos", "titulo": "Três sinais", "itens": [
  { "texto": "acorda cansado", "em": 3.1 }, { "texto": "precisa de café", "em": 4.0, "detalhe": "logo cedo" }, { "texto": "cochila à tarde", "em": 5.2 } ] }
```
- 2 a 5 itens; `texto` de 2 a 6 palavras (até ~30 caracteres), `detalhe` opcional (até ~35, menor), `icone` opcional (seção 10). `titulo` opcional, até ~30.
- Cada item é uma faixa que nasce a lápis e acende no `em`, com uma pastilha colorida; a faixa do item atual fica mais clara.

### `passos`: itens em ordem (ladrilho creme)

Mesmos campos de `topicos`. As faixas são numeradas e um trilho liga os números, avançando até o passo dito.

### `numero`: um número que conta (ladrilho gema)

```json
{ "tipo": "numero", "valor": 83000, "prefixo": "US$", "em": 1.34, "emFim": 2.6, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```
- Conta de 0 até `valor` a partir de `em` (a palavra do número) até `emFim` (padrão: 1,2 s depois). Formato pt-BR (83.000; 1,5). `casas`: casas decimais.
- `prefixo` ("US$", "R$") e `sufixo` ("mil", "%", "kg", "anos") até ~8 caracteres, menores, ao lado do número (ou em cima/embaixo, se não couber).
- `rotulo` até ~40 caracteres; `rotuloEm` (padrão: o fim da contagem). Dito antes do número, ele fica em cima; depois, embaixo.
- `ilustrativo: true` mostra a etiqueta (só para número que não é dado: "um em cada três" → use `partes`, não invente).

### `comparacao`: dois lados em dois ladrilhos

```json
{ "tipo": "comparacao", "modo": "contra", "titulo": "Você quer",
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "não significa dinheiro", "em": 9.87 } ],
  "vencedor": 1, "vencedorEm": 11.2 }
```
- `modo`: `contra` (tinta × creme, peça "×" no rejunte), `antes-depois` (creme × verde, peça com seta), `errado-certo` (tomate com ✗ × verde com ✓; o primeiro lado é o errado).
- `rotulo` até ~16 caracteres (chapéu em caixa alta); `texto` até ~35. `titulo` opcional (faixa escura em cima).
- `vencedor` (0 ou 1, opcional): o lado que vence ganha ✓ e o outro apaga um pouco em `vencedorEm`.
- Ponha primeiro o lado dito primeiro: o ladrilho que espera a vez fica a lápis.

### `grafico`: gráfico de pastilhas (ladrilho creme)

```json
{ "tipo": "grafico", "forma": "barras", "titulo": "Vendas por mês", "unidade": "mil",
  "dados": [ { "rotulo": "jan", "valor": 12, "em": 3.2 }, { "rotulo": "fev", "valor": 18, "em": 4.1 }, { "rotulo": "mar", "valor": 25, "em": 5.0 } ] }
{ "tipo": "grafico", "forma": "linha", "tendencia": "sobe", "tendenciaEm": 3.0, "ilustrativo": true, "titulo": "Reacendeu a conversa" }
```
- `forma`: `barras` (colunas de pastilhas que se assentam de baixo para cima), `linha` (corre sobre uma grade de pastilhas e acende as de baixo) ou `pizza` (o disco das partes, com o valor de cada dado na legenda).
- `dados`: 2 a 6 números **ditos**, cada um no seu `em`; `rotulo` até ~12 caracteres; `unidade` ("%", "mil", "R$", "kg").
- Sem números ditos: `tendencia` (`sobe`, `cai`, `oscila`) + `ilustrativo: true`; a forma se desenha a partir de `tendenciaEm` e a etiqueta "ilustrativo" aparece no canto. Sobe = verde, cai = tomate, oscila = gema.
- `titulo` até ~35 caracteres.

### `destaque`: a palavra que bate forte

```json
{ "tipo": "destaque", "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta", "detalhe": "mesmo na alta", "detalheEm": 15.0 }
```
- `texto` até ~40 caracteres, enorme (até 156 px), palavra por palavra; uma barra de base cresce quando ele termina.
- `nivel`: `alerta` (ladrilho tomate, triângulo) ou `chave` (gema, chave); sem `nivel`, gema sem ícone.
- `detalhe` (opcional, até ~60) entra em `detalheEm`.

### `definicao`: o termo e o que ele quer dizer

```json
{ "tipo": "definicao", "termo": "Bull market", "em": 5.3, "significado": "um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```
- `termo` até ~20 caracteres (num ladrilho tinta, enorme); `significado` até ~60 (no ladrilho creme que se encaixa embaixo, com a peça "=").

### `frase`: frase de efeito (ladrilho tinta)

```json
{ "tipo": "frase", "texto": "Não é dieta da moda, é base.", "risco": "dieta da moda", "destaque": "base", "em": 22.1 }
```
- `texto` até ~60 caracteres, palavra por palavra. `risco`: trecho exato riscado em tomate depois de dito (ou em `riscoEm`). `destaque`: trecho exato em ênfase, com barra de base. `quebra` (opcional): as linhas à mão (`["Não é", "dieta", "da moda,", "é base."]`).
- Citação: ponha as aspas no texto (`"“Minha esposa sentava aí.”"`).

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o seu patrimônio", "em": 37.98 } ] }
```
- `texto` até ~70 caracteres; `opcoes` de 2 a 4 (até ~45 caracteres cada), cada uma acende na sua palavra.

### `cta`: o fechamento (ladrilho gema ou verde)

```json
{ "tipo": "cta", "icone": "link", "texto": "Toca aqui em Saiba Mais e assiste essa aula agora.", "destaque": "Saiba Mais", "em": 40.05 }
```
- `icone`: `salvar` (padrão), `seguir`, `comentar` ou `link` ("toca em Saiba Mais", "link na bio"). Ele se desenha quando o ladrilho entra e se preenche no `em` (a palavra da ação).
- `texto` até ~60 caracteres; `destaque` em ênfase.

## 5. A assinatura: `partes` e `grupo`

O `conferir.mjs` exige uma das duas (ou o `prato`) pelo menos uma vez.

### `partes`: um todo dividido (o disco)

```json
{ "tipo": "partes", "de": 28.0, "ate": 33.8, "fica": true, "titulo": "Aula gratuita",
  "partes": [ { "rotulo": "o mercado", "em": 30.86 }, { "rotulo": "os riscos", "em": 31.82 }, { "rotulo": "a escolha dos ativos", "em": 32.21 } ] }
```
- `partes`: 2 a 5 (até 6). Cada uma gira até o seu tamanho no `em` (a palavra que a nomeia) e a legenda dela entra ao lado (ladrilho largo) ou embaixo (ladrilho alto); em ladrilho pequeno (peça que fica), só o disco.
- `fracao` (opcional, 0 a 1): só quando a proporção é dita ou sai direto da fala ("metade", "um quarto", "8 de 24 horas"). Sem nenhuma `fracao`, as partes ficam iguais e a etiqueta "ilustrativo" aparece. Com frações, a fração tipográfica aparece dentro da fatia (disco grande).
- `cor` (opcional): `folha`, `tomate`, `gema`, `tinta` (padrão nessa ordem). `rotulo` até ~30 caracteres. `titulo` opcional, até ~30.
- A primeira parte fica à esquerda (termina às 12h); as seguintes vão no sentido horário.
- É a melhor peça que fica: com `"fica": true` ele atravessa as páginas seguintes.

### `grupo`: um grupo com uma casa por item

```json
{ "tipo": "grupo", "fracao": "1/4", "titulo": "Proteína",
  "itens": [ { "em": 8.87, "icone": "frango", "texto": "frango" }, { "em": 9.51, "icone": "peixe", "texto": "peixe" } ] }
```
- `fracao` (opcional): fração ("1/2", "1/4", "2/3") que se monta tipograficamente, ou um número curto ("3", "3x", "80%"). `titulo` até ~30 caracteres.
- `itens`: 2 a 5 (até 6). Com `icone`, a casa nasce com o ícone a lápis e se completa no `em`; o `texto` (até ~22 caracteres) entra embaixo. Sem `icone`, a casa mostra o `texto` grande. Sem `texto`, só o ícone (categoria dita: "vegetais e legumes" → brócolis, cenoura…).

## 6. Blocos extras

- `selo`: `{ "tipo": "selo", "icone": "pessoa", "titulo": "Um senhor", "texto": "sentava no mesmo banco da praça" }` — peça redonda com ícone, título (até ~25) e apoio (até ~60), os dois palavra por palavra. Referência, personagem, detalhe curto.
- `titulo`: `{ "tipo": "titulo", "texto": "é mais simples do que parece", "enfase": "simples" }` (ou `quebra`) — um segundo título, bom como companheiro.
- `marca`: `{ "tipo": "marca" }` — a assinatura com nome e área.
- `prato`: o disco das `partes` com o nome do exemplo, e mais `talheresEm` (garfo e faca chegam), `azeite: { "em": … }` (fio de azeite sobre a primeira parte) e `rotulosEm` (legenda de todas as partes de uma vez, em ladrilho largo).
- `lista`: o nome antigo de `passos`.

## 7. Regras de tempo

- `de`: o `em` da primeira palavra da batida, menos 0,05 (nunca antes do `ate` do momento anterior). O primeiro momento pode começar em ~0,1 s: o vídeo abre com a pessoa em tela cheia e, na primeira palavra, a página se monta em volta dela.
- `ate`: o `de` do próximo momento (páginas encostadas) ou o `em` da primeira palavra que a batida não cobre. Encoste os momentos sempre que puder: um respiro de 0,3 a 1 s vira um pisca de tela cheia.
- **Nada parado**: dentro de cada página, algo novo a cada 1,5–2,5 s (uma palavra do título, um item, uma parte, o risco da frase). Página com mais de ~4 s precisa de itens entrando por dentro dela; se a fala não tem mais o que mostrar, encurte e comece a próxima.
- Itens, partes, lados, dados, opções, `rotuloEm`, `significadoEm`, `riscoEm`: o `em` da palavra que fala daquilo.

## 8. Legenda, correções e sons

- A legenda aparece só nos respiros em tela cheia (e com `"legenda": true` num ladrilho de pessoa largo), numa peça creme dentro do ladrilho da pessoa. Durante as páginas ela some: os blocos já escrevem o que é dito.
- `semLegenda`: faixas extras sem legenda: `[ { "de": 3.27, "ate": 6.0 } ]`.
- `correcoes`: palavras que a transcrição errou, sem pontuação: `{ "1/4": "Um quarto," }`. A chave pode ter várias palavras seguidas e `""` apaga. Não edite `palavras` à mão.
- Sons (automáticos): um encaixe grave em cada remontagem; uma nota por parte do disco, por dado dito, no fim da contagem de um número, quando um lado vence e quando o significado se encaixa; um acorde curto no fechamento. Nunca dois colados.

## 9. Exemplos completos

### Vídeo de cripto (43 s, gravação de selfie)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0.1, "ate": 2.95, "fica": 14.9, "valor": 83000, "prefixo": "US$", "em": 1.34, "emFim": 2.6, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "grafico", "de": 2.95, "ate": 5.0, "forma": "linha", "tendencia": "sobe", "tendenciaEm": 3.0, "ilustrativo": true, "titulo": "Reacendeu a conversa" },
    { "tipo": "definicao", "de": 5.0, "ate": 8.62, "termo": "Bull market", "em": 5.3, "significado": "um ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.62, "ate": 12.88, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.88, "ate": 14.9, "nivel": "alerta", "texto": "Para a maioria das pessoas", "em": 13.46 },
    { "tipo": "grupo", "de": 14.9, "ate": 24.15, "titulo": "Tem gente que perde",
      "itens": [ { "em": 18.21, "icone": "raio", "texto": "por impulso" }, { "em": 20.18, "icone": "alvo", "texto": "sem critério" }, { "em": 21.75, "icone": "alerta", "texto": "risco que não entende" } ] },
    { "tipo": "pergunta", "de": 24.15, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "partes", "de": 28.0, "ate": 33.8, "fica": true, "titulo": "Aula gratuita",
      "partes": [ { "em": 30.86, "rotulo": "o mercado" }, { "em": 31.82, "rotulo": "os riscos" }, { "em": 32.21, "rotulo": "a escolha dos ativos" } ] },
    { "tipo": "frase", "de": 33.8, "ate": 35.2, "texto": "Sem promessa de lucro.", "risco": "promessa de lucro", "em": 33.83 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.02, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o seu patrimônio", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.02, "ate": 43.07, "icone": "link", "texto": "Toca aqui em Saiba Mais e assiste essa aula agora.", "destaque": "Saiba Mais", "em": 40.05 }
  ]
}
```

O número do Bitcoin fica ao lado da pessoa até o alerta; o disco da aula (a assinatura) entra depois e fica até o fim. Nenhuma grade foi escrita: o modelo escolheu.

### O exemplo do modelo (nutricionista, 27 s, grades escritas à mão)

```json
{
  "marca": { "nome": "Tiago Moura", "area": "Nutricionista" },
  "pessoa": { "zoom": 0.75 },
  "correcoes": { "1/4": "Um quarto," },
  "momentos": [
    { "tipo": "abertura", "de": 0.11, "ate": 3.57, "grade": "capa", "area": "t", "cor": "folha", "texto": "Montar um prato equilibrado", "quebra": ["Montar um prato", "equilibrado"],
      "blocos": [
        { "tipo": "prato", "id": "prato", "area": "a", "cor": "creme", "talheresEm": 2.23,
          "partes": [ { "fracao": 0.5, "cor": "folha", "em": 3.6, "rotulo": "vegetais" }, { "fracao": 0.25, "cor": "tomate", "em": 6.62, "rotulo": "proteína" },
                      { "fracao": 0.25, "cor": "gema", "em": 11.67, "rotulo": "carboidrato" } ],
          "azeite": { "em": 16.7 }, "rotulosEm": 18.94 },
        { "tipo": "titulo", "area": "b", "cor": "gema", "quebra": ["é mais", "simples", "do que", "parece."], "enfase": "simples" } ] },
    { "tipo": "grupo", "de": 3.58, "ate": 6.58, "grade": "metade", "area": "a", "cor": "folha", "fracao": "1/2", "titulo": "Vegetais e legumes",
      "itens": [ { "em": 4.98, "icone": "brocolis" }, { "em": 5.26, "icone": "cenoura" }, { "em": 5.77, "icone": "folha" }, { "em": 6.04, "icone": "tomate" } ],
      "blocos": [ { "id": "prato", "area": "b" } ] },
    { "tipo": "grupo", "de": 6.58, "ate": 11.6, "grade": "L", "area": "b", "cor": "tomate", "fracao": "1/4", "titulo": "Proteína",
      "itens": [ { "em": 8.87, "icone": "frango", "texto": "frango" }, { "em": 9.51, "icone": "peixe", "texto": "peixe" }, { "em": 10.23, "icone": "ovo", "texto": "ovo" }, { "em": 10.8, "icone": "feijao", "texto": "feijão" } ],
      "blocos": [ { "id": "prato", "area": "a" } ] },
    "… (carboidrato, azeite, método do prato, frase e fechamento: o prato continua em todas as páginas)",
    { "tipo": "cta", "de": 24.18, "ate": 27.04, "grade": ["pp", "ak"], "linhas": [1.25, 1], "colunas": [2, 1], "area": "a", "cor": "gema",
      "icone": "salvar", "texto": "Salva e usa no seu próximo almoço.", "quebra": ["Salva e usa", "no seu próximo", "almoço."], "em": 24.25,
      "blocos": [ { "id": "prato", "area": "k" } ] }
  ]
}
```

O plano completo está em `src/plano.json` do template.

## 10. Ícones disponíveis

Gerais (qualquer assunto): `alerta`, `chave`, `raio`, `alvo`, `lupa`, `escudo`, `moeda`, `carteira`, `sobe`, `cai`, `lampada`, `livro`, `play`, `pessoa`, `pessoas`, `casa`, `calendario`, `mensagem`, `estrela`, `cadeado`, `seta`, `relogio`, `lua`, `coracao`, `documento`, `check`, `x`, `interrogacao`, `xicara`.
Comida e rotina: `brocolis`, `folha`, `cenoura`, `tomate`, `frango`, `peixe`, `ovo`, `feijao`, `leite`, `arroz`, `batata`, `mandioca`, `pao`, `azeite`, `gota`, `maca`, `copo`, `prato`, `halter`, `tenis`.
Ações (fechamento): `salvar`, `seguir`, `comentar`, `compartilhar`, `link`.

Nenhum serve? Use `grupo` sem `icone` (a casa mostra o texto grande) ou `topicos`. Para criar um ícone, veja `references/estilo.md`.
