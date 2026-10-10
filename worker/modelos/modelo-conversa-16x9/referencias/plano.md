# O plano de edição (`src/plano.json`), versão deitada (16:9, 1920×1080)

## 0. No quadro deitado (16:9)

Tudo o que está abaixo vale, com estas diferenças (o template faz sozinho; o plano só precisa respeitar os limites):

- **Composição (aula 9 do curso):** na tela do app, a pessoa fica na **moldura da direita** (a bolha redonda de 620 px, com o rosto centralizado e seguido) e a conversa no **quadro da esquerda** (uma coluna de ~1030 px de largura e ~740 px de altura úteis, entre a fixada e a barra de gravação). O cabeçalho do contato e a mensagem fixada atravessam a tela no topo. A bolha tem tamanho fixo: onde este texto fala da bolha que cresce ou encolhe com a conversa, no quadro deitado ela fica do mesmo tamanho (a conversa ganha a altura da coluna).
- **Quadro cheio:** a pessoa como foi gravada e o balão **ao lado do rosto**, na altura do peito (centrado na linha do queixo): as suas mensagens (e os blocos universais) à direita da pessoa, as do outro lado à esquerda; se aquele lado for estreito, o lado mais largo. Onde este texto diz "no peito", leia "ao lado do rosto, na altura do peito". A pílula fica no topo, centralizada; a legenda no campo de texto, centralizado embaixo.
- **Comparação e contraste:** as duas faixas, uma embaixo da outra, no quadro da esquerda, centradas na altura.
- **Tamanhos:** os tamanhos deste documento (balão de 70, número até 120, fixada de 52…) estão em unidades da tela virtual do app (2400×1350); no vídeo saem a 80%. Os limites de caracteres continuam os mesmos.
- **Tempo de leitura e respiro (aula 9):** a tela do app de ~2,5 a ~8 s; entre elas, a pessoa em tela cheia (com um balão ou só com a legenda, de 1 a ~8 s). O `conferir.mjs` deste modelo pede ≥ 50% de cobertura, trecho só com legenda até ~8 s, um momento a cada ~10 s e nada parado mais de ~6 s. Não cubra cada frase: no vídeo completo, a tela do app entra onde a ideia pede apoio visual.
- **Margens:** 96 px nas laterais; nada importante abaixo de y 984 (controles do player: ali fica só a barra de gravação, que é moldura).

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `contato`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: quadro cheio × tela do app
3. Blocos de quadro cheio (`abertura`, `numero`, `destaque`, `frase`, `pergunta`, `cta`)
4. Blocos da tela do app (`topicos`, `passos`, `definicao`, `grafico`, `comparacao`)
5. A assinatura: `conversa`, `contraste` e `balao`
6. As mensagens (dentro de `conversa`, `balao` e `contraste`)
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "contato": { "nome": "Você", "hora": "14:02" },
  "sfx": true,
  "correcoes": {}
}
```

- `marca`: `nome` e `area` aparecem na pílula de assinatura do fechamento (`cta`). `nome` vazio = sem assinatura. Nome até ~14 caracteres, área até ~24.
- `contato`: o outro lado da conversa: o nome no cabeçalho do app e na pílula do topo, e a hora dos balões. Use um papel, nunca o nome de uma pessoa real: "Você" (quem assiste, o padrão), "Cliente", "Paciente", "Aluna", "Seguidor". Até ~14 caracteres.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs` no quadro 1920×1080 (`videoAltura` 1080, `rosto.quadro` 1920×1080). Não mexa à mão. `zona.topo` fica logo abaixo do queixo: o balão do quadro cheio se centra na linha do queixo, ao lado do rosto.

## 2. A gramática: quadro cheio × tela do app

| Estado | Blocos | A pessoa | O que aparece |
|---|---|---|---|
| **Quadro cheio** (a base) | `abertura`, `numero`, `destaque`, `frase`, `pergunta`, `cta`, `balao` e os trechos sem momento | ocupa a tela inteira, como foi gravada | a pílula escura no topo (o contato, um passo ou a assinatura), UM balão ao lado do rosto, na altura do peito, e, nos trechos sem momento, a legenda digitada no campo de texto |
| **Tela do app** | `topicos`, `passos`, `definicao`, `grafico`, `comparacao`, `conversa`, `contraste` | vira uma bolha redonda (mensagem de vídeo sendo gravada) na moldura da direita, com o anel tangerina; embaixo, a barra de gravação do app | o cabeçalho do contato (online / digitando… / offline) e a mensagem fixada (o título da tela) no topo, e a conversa no quadro da esquerda, que rola para cima a cada mensagem |

O template já faz sozinho:

- **A troca é a bolha que se expande ou encolhe** (0,6 s, começando 0,06 s antes do `de`). O app fica **atrás** do vídeo: quando a pessoa encolhe, a conversa já está lá. Nunca há quadro vazio.
- **O balão do quadro cheio sai antes de a pessoa encolher** e nunca passa por cima do rosto (ele fica numa coluna livre ao lado, medida com o rosto em todo o trecho); o seguinte só entra com a pessoa já em quadro cheio. Nunca dois textos um sobre o outro.
- **É uma conversa só.** As mensagens dos blocos de quadro cheio (abertura, número, destaque, frase, pergunta, balão) entram na conversa e aparecem nela quando a pessoa vira bolha; listas, passos, definições e gráficos são mensagens do mesmo fio. A conversa só começa de novo ("Conversa nova · hoje") com `"nova": true` numa `conversa`; depois de uma `comparacao` ou `contraste` (telas próprias), o fio de antes volta.
- **A mensagem fixada** mostra o título da tela: o `titulo` de `topicos`, `passos`, `grafico` e `comparacao`, ou a `fixada` de uma `conversa`. Sem título, a barra recolhe e a conversa ganha o espaço. Uma `conversa` sem `fixada` mantém a de antes; o `contraste` recolhe a barra.
- **A pessoa e a conversa ficam lado a lado**: a bolha tem 620 px na moldura da direita, a conversa ocupa a coluna da esquerda; as mensagens mais antigas sobem para fora, como no celular.
- **Texto que cabe**: cada balão mede o texto e diminui o corpo até caber (até 3 linhas), sem cortar; nenhuma linha termina em "e", "de", "o"…
- **O primeiro momento já está na tela no primeiro quadro** (a capa do post).

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, na pausa entre as frases (de preferência num valor de `cortesEm`). Buraco entre momentos vira quadro cheio só com a legenda.
- **Alterne**: a pessoa volta ao quadro cheio pelo menos a cada ~10 s (no vídeo completo a tela cheia é a base); nunca três momentos do mesmo tipo seguidos.

## 3. Blocos de quadro cheio

Um balão **seu** (tangerina) ao lado do rosto, na altura do peito (à direita da pessoa; se aquele lado for estreito, no lado mais largo). Antes dele, um "digitando…". Textos que se escrevem **palavra por palavra** (`abertura`, `frase`, `pergunta`, `cta`) acendem cada palavra no instante em que ela é dita: use as palavras que a pessoa diz, na ordem em que diz (pode pular palavras; palavra não dita entra logo depois da anterior). Números em algarismo ("3") casam com a palavra falada ("três"). `em` (opcional nesses quatro): quando o texto começa a ser dito, se o momento começa antes.

### `abertura`: a promessa, a pergunta, o tema

```json
{ "tipo": "abertura", "de": 0, "ate": 2.27, "texto": "3 erros que matam a sua planta", "destaque": "matam a sua planta", "em": 0.29 }
```

- `texto`: até ~45 caracteres (80 px em negrito, até 3 linhas; diminui até 58 px). Já nasce esboçado (apagado) e cada palavra acende quando é dita: o primeiro quadro é a capa.
- `destaque` (opcional): trecho **exato** do texto que "trava" quando é dito (fundo escuro, letra tangerina).

### `numero`: número, preço, porcentagem, data, quantidade

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu" }
```

- `valor` (número), `em` (a palavra do número), `rotulo` (o que é, até ~40 caracteres; fica pequeno em cima).
- O balão chega com o rótulo e os pontinhos no lugar do valor; no `em`, o valor conta de 0 até `valor` (1,1 s), em pt-BR (83.000; 47,5).
- Opcionais: `prefixo` ("R$", "US$"), `sufixo` ("%", "mil", "kg", "anos"), `casas` (casas decimais), `rotuloEm` (o balão chega já nessa palavra), `ilustrativo: true` (etiqueta ILUSTRATIVO no balão; só para número que não foi dito com precisão).

### `destaque`: uma palavra ou frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.85, "ate": 17.2, "texto": "Para a maioria das pessoas", "em": 13.46,
  "nivel": "alerta", "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 15.96 }
```

- `texto`: até ~30 caracteres (96 px em negrito, diminui até 60 px). Chega pronto no `em`.
- `nivel`: `"chave"` (padrão, balão tangerina) ou `"alerta"` (balão frio, cinza, com ✕: a cor do que dá errado neste estilo).
- `detalhe` (opcional, até ~50 caracteres): uma linha menor embaixo, apagada até `detalheEm`.

### `frase`: frase de efeito, opinião, conclusão

```json
{ "tipo": "frase", "de": 33.8, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68, "em": 33.83 }
```

- `texto`: até ~60 caracteres (74 px, até 3 linhas).
- `destaque` (opcional): trecho exato que trava no escuro. `risco` (opcional): trecho exato riscado por um traço a partir de `riscoEm` (a última palavra dele).

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres. `opcoes` (opcional, 2 a 4): as **respostas rápidas** do app, botões embaixo do balão (até ~30 caracteres cada), que nascem tracejados e acendem cada um na sua palavra. Depois da última, o contato fica "digitando…".

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link", "toqueEm": 40.65 }
```

- `texto`: até ~45 caracteres, as palavras ditas (diminui para caber com o botão).
- `icone`: `salvar` ("Salvar" → "Salvo"), `seguir` ("Seguir" → "Seguindo"), `comentar` ("Comentar" → "Comentado") ou `link` (o botão "Saiba mais" acende). (`acao` é o nome antigo; aceita também `compartilhar`.)
- `toqueEm`: quando o botão é tocado, de preferência na palavra da ação, pelo menos 0,5 s depois do `de`.
- `destaque` (opcional): trecho que trava no escuro. `reacao` (opcional): `{ "em", "icone" }`, o contato reage ao balão no fim.
- A pílula do topo vira a assinatura (`marca`).

## 4. Blocos da tela do app

### `topicos`: lista sem ordem (motivos, erros, dicas, sinais)

```json
{ "tipo": "topicos", "de": 2.27, "ate": 9.32, "titulo": "3 erros", "itens": [
  { "texto": "Regar demais", "em": 2.39, "detalhe": "Apodrece a raiz" },
  { "texto": "Longe da luz", "em": 5.32 },
  { "texto": "Vaso sem furo", "em": 6.74, "detalhe": "Acumula água no fundo" } ] }
```

- 2 a 5 itens; cada um chega como uma **mensagem sua**, no seu `em`, com um "digitando…" curto antes. Item de 2 a 6 palavras (até ~30 caracteres). Com 4 ou 5 itens a letra diminui um pouco (64 / 58 px) para todos caberem.
- `titulo` (opcional, até ~38 caracteres): vira a mensagem fixada. Sem título, a barra recolhe.
- `detalhe` (opcional, até ~30 caracteres): uma segunda linha menor no balão, apagada até a palavra dela ser dita (o template acha a palavra na fala sozinho).

### `passos`: sequência em ordem (processo, caminho, etapas)

```json
{ "tipo": "passos", "de": 30.0, "ate": 33.8, "titulo": "Como eu analiso", "itens": [
  { "texto": "O mercado", "em": 30.91 }, { "texto": "Os riscos", "em": 31.86 }, { "texto": "A escolha dos ativos", "em": 32.29 } ] }
```

- 2 a 5 itens, como em `topicos`, mas cada mensagem tem o número numa bolinha escura e o passo anterior ganha ✓ quando o próximo é dito. Com `titulo`, a fixada conta "1/3 → 2/3 → 3/3".

### `definicao`: termo técnico explicado

```json
{ "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` (até ~24 caracteres) chega como mensagem sua em negrito, no `em`.
- `significado` (até ~70 caracteres) chega no `significadoEm` como **resposta** ao termo: o balão traz o termo citado em cima, como o "responder" do app.

### `grafico`: algo que sobe, cai, cresce, divide

```json
{ "tipo": "grafico", "de": 3.4, "ate": 5.0, "titulo": "Faturamento por canal", "forma": "barras", "unidade": "mil reais", "dados": [
  { "rotulo": "Instagram", "valor": 120, "em": 3.6 }, { "rotulo": "Indicação", "valor": 85, "em": 3.8 }, { "rotulo": "Tráfego pago", "valor": 240, "em": 4.0 } ] }
```

- Um cartão claro "compartilhado" na conversa (como um aviso do sistema), com o desenho em tinta e os dados no acento. `titulo` (opcional) vira a fixada.
- `dados` (números **ditos**, 2 a 6; rótulo até ~28 caracteres): `forma` `"barras"` (barras deitadas que crescem, rótulo à esquerda, valor na ponta), `"linha"` (o traço anda de ponto em ponto, valor em cima, rótulo embaixo) ou `"pizza"` (uma rosca que se fecha, com a legenda em %). Cada dado entra no seu `em`.
- **Sem números ditos**: deixe `dados` de fora e use `"tendencia": "sobe" | "cai" | "oscila"`, `"tendenciaEm"` (a palavra) e `"ilustrativo": true`. A curva se desenha na fala com a etiqueta ILUSTRATIVO e um ponto pulsa na ponta.
- `unidade` (opcional): pequena, no canto do cartão.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra", "lados": [
  { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 },
  { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 10.19 } ],
  "vencedor": 0, "vencedorEm": 11.99 }
```

- Duas faixas, uma embaixo da outra, no quadro da esquerda: o `rotulo` (até ~24 caracteres, em negrito) e o `texto` num balão (até ~50 caracteres, até 2 linhas). Cada faixa nasce tracejada e acende no seu `em`.
- `modo`: `"contra"` (× entre as faixas), `"antes-depois"` (↓; o "antes" fica no balão do outro lado, ardósia) ou `"errado-certo"` (↓; o de cima esfria e o de baixo acende quando o certo é dito).
- `vencedor` (0 ou 1) e `vencedorEm` (opcionais): o lado que perde esfria para cinza com ✕, o que ganha acende (borda tangerina, ✓).
- `titulo` (opcional) vira a fixada. As faixas ficam no meio da altura da coluna; a bolha segue na moldura da direita.

## 5. A assinatura: `conversa`, `contraste` e `balao`

A fala vira uma troca de mensagens. **A sua mensagem** (`"de": "eu"`) é o que a pessoa diz, ensina, recomenda; **a do outro lado** (`"de": "outro"`) é a dúvida, a objeção, o pedido ou a reação de quem assiste, com as palavras da fala. Textos que aparecem **palavra por palavra** (a fixada, a pílula do passo, os títulos do contraste, a condição do preço, o título do cartão) precisam usar as palavras ditas, na ordem.

### `conversa`: a tela do app com mensagens encenadas

```json
{ "tipo": "conversa", "de": 17.2, "ate": 23.6,
  "fixada": { "rotulo": "Erro", "tom": "errado", "texto": "Tem gente que perde" },
  "mensagens": [
    { "de": "eu", "em": 17.73, "digitando": 0.3, "texto": "Compra por impulso", "esfriaEm": 18.45 },
    { "de": "eu", "em": 19.78, "digitando": 0.4, "texto": "Moeda sem critério", "esfriaEm": 20.43 },
    { "de": "eu", "em": 21.75, "digitando": 0.4, "texto": "Risco que não entende", "esfriaEm": 22.86 } ] }
```

- `mensagens`: 1 a 4 por momento (seção 6). Mensagem com `em` antes do `de` do momento já está na conversa quando ela abre (sem "digitando…").
- `fixada` (opcional): `texto` até ~38 caracteres (uma linha de 52 px; passou disso, duas linhas menores), `rotulo` curto ("1/3", "Erro", "Dica", "Certo"), `tom`: `"certo"` (acento) ou `"errado"` (cinza com ✕). Sem `fixada`, continua a de antes.
- `nova: true`: começa outra conversa (a anterior rola para fora e a nova abre com o cartão do contato).
- `offlineEm` (opcional): o cabeçalho passa para "offline" (o "e some").
- Uma `conversa` entre ~1,5 e ~6 s. Mais que isso, divida em duas (a segunda só troca a fixada e continua o fio).

### `contraste`: este caminho esfria, aquele acende

```json
{ "tipo": "contraste", "de": 17.0, "ate": 18.8, "esquerdaEm": 17.05, "direitaEm": 17.85,
  "esquerda": { "titulo": "Celular na cama", "viraEm": 17.4,
                "mensagens": [ { "de": "eu", "em": 17.1, "texto": "Só mais um vídeo" } ],
                "resultado": { "em": 17.6, "texto": "1h da manhã", "tipo": "ruim" } },
  "direita":  { "titulo": "Livro", "mensagens": [ { "de": "eu", "em": 17.9, "texto": "Boa noite" } ],
                "resultado": { "em": 18.3, "texto": "dorme", "tipo": "bom" } } }
```

- Duas faixas lidas como a frase falada: título à esquerda, a palavra do desfecho à direita, embaixo a mensagem → a seta (desenha-se em `viraEm`) → o desfecho. `esquerda` é a de cima, `direita` a de baixo; qualquer uma pode ser a boa.
- `titulo`: até ~18 caracteres, palavras ditas. `mensagens`: UMA mensagem curta (até ~18 caracteres). `esfriaEm`/`vistoEm` antes do `de` deixam a mensagem já cinza com "Visto".
- `resultado.tipo`: `"ruim"` (o balão de resposta que nunca chega, tracejado, e a palavra em cinza com ✕) ou `"bom"` (a palavra em tangerina com ✓ e, no lugar do desfecho, um selo ✓; com `valor`, um cartão claro com ✓, o `rotulo` pequeno e o `valor` grande, como "Pago · R$ 197"). `texto`: a palavra dita, até ~12 caracteres. ("vacuo"/"venda" são os nomes antigos.)
- `esquerdaEm`/`direitaEm`: a primeira palavra do título de cada faixa.

### `balao`: UMA mensagem ao lado do rosto, em quadro cheio

```json
{ "tipo": "balao", "de": 23.6, "ate": 28.0,
  "mensagem": { "de": "outro", "em": 27.06, "digitando": 2.4, "texto": "Como avaliar os projetos e pensar no posicionamento?" } }
```

- As suas mensagens ficam à direita da pessoa, as do outro lado à esquerda. Para a dúvida do outro lado chegando (a pílula mostra "digitando…" enquanto a pergunta é feita), para o cartão que você manda (`"tipo": "cartao"`), para a mensagem que abre o vídeo. A mensagem entra na conversa seguinte (`"naConversa": false` para não entrar).
- `mensagem`: até ~50 caracteres em texto (72 px); cartão e preço usam letra menor. `fixada` (opcional): a pílula do topo vira um passo (como a fixada). `offlineEm` (opcional): o contato fica offline e o balão dele apaga um pouco.

## 6. As mensagens

Cada mensagem tem `de` (`"eu"` ou `"outro"`) e `em` (quando aparece). Antes dela vem um "digitando…" de `digitando` segundos (padrão 0,6; `0` = chega direto).

| `tipo` | O que é | Campos |
|---|---|---|
| `texto` (padrão) | balão comum | `texto`: até ~36 caracteres na conversa (2 linhas de 70 px) |
| `preco` | balão com um valor grande; a condição chega presa a ele | `valor` ("R$ 197", "3 x por semana"); `condicao` (opcional): `{ "em", "texto", "desenho" }`, o balão cresce, as palavras acendem na fala e, na última, a condição trava. `texto` da condição até ~28 caracteres, de preferência com uma vírgula onde quebra |
| `cartao` | cartão com um desenho a traço, título e uma linha com ✓ | `desenho`, `titulo` (até ~16, palavras faladas), `linha` (até ~20) e `linhaEm` (quando o ✓ acende) |
| `confirmacao` | aviso do sistema, compacto e centralizado: ✓, um texto pequeno e o valor | `texto` ("Consulta marcada", "Pagamento recebido"), `valor` (opcional); `digitando: 0`. ("pagamento" é o nome antigo) |
| `digitando` | só o "digitando…", que some sem virar mensagem (o vácuo) | `em` (aparece) e `ate` (some) |

Extras de qualquer mensagem:

- `vistoEm`: "Visto" embaixo de uma mensagem sua (e os dois tiques).
- `esfriaEm`: a mensagem sua perde a cor e fica cinza: foi ignorada, deu errado.
- `reacao`: `{ "em", "icone" }` com `coracao`, `joinha` ou `check`, que pousa no canto do balão (deixe ~0,5 s antes do fim do momento para ela ser vista).
- `hora`: a hora do balão (padrão: a do `contato`).

Desenhos (`desenho`), todos a traço, sem marca: `presente`, `caixa`, `sacola`, `agenda`, `curso` (tela com play), `frete` (caminhão), `relogio`, `desconto` (etiqueta), `garantia` (escudo com ✓), `documento`, `grafico`, `moeda`, `lampada`, `alvo`, `folha` (planta), `coracao`, `casa`. Escolha pelo que a coisa **é**; se nada combina, use `caixa` ou `documento`.

## 7. Regras de tempo

- **Fronteiras na pausa entre frases**: o `de` de um momento = o `ate` do anterior = o valor de `cortesEm` entre as duas frases (ou, sem corte, o `em` da primeira palavra do momento menos 0,1). O primeiro momento começa em 0; o `ate` do último é a `duracao`.
- Cada item, mensagem, lado ou dado chega na palavra que o nomeia. O "digitando…" começa antes, sozinho. Nada aparece antes de ser dito (só o esboço apagado).
- No quadro cheio, o balão começa a aparecer ~0,2 s depois do `de` (a pessoa ainda está crescendo); um `em` muito colado no `de` faz o balão chegar já pronto.
- Nunca duas mensagens com menos de ~0,5 s entre uma e outra: a conversa rola e a de cima some antes de ser lida.
- A cada 1,5–2,5 s alguma coisa chega: um "digitando…", uma mensagem, uma reação, um ✓, a troca da fixada, um dado. Um trecho de mais de ~2,5 s sem nada novo pede um passo a mais.

## 8. Legenda, correções e sons

A legenda é o **campo de texto do app**: com a pessoa em quadro cheio, a frase falada se digita no campo embaixo, palavra por palavra, com a palavra da vez no acento e o cursor piscando. Ela **some durante um momento** e aparece nos trechos sem momento. Na tela do app ela nunca aparece.

- `"legenda": true` num momento de quadro cheio: a legenda continua durante ele (use num `balao` de abertura, quando a frase falada não está no balão).
- `semLegenda`: faixas extras sem legenda: `"semLegenda": [ { "de": 2.9, "ate": 5.4 } ]`.
- `correcoes`: palavras que a transcrição errou, sem pontuação: `{ "Jão": "João", "chat GPT": "ChatGPT", "né": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. Só corrija o que você tem certeza. Não edite `palavras` à mão.

Sons (automáticos, poucos e tonais): um "vum" grave quando a pessoa cresce ou encolhe, um deslize grave quando a tela rola para outra, duas notas suaves quando chega mensagem do outro lado, uma nota curta quando sai mensagem sua (mais presente no número, no preço e no gráfico), um tom que desce no que esfria (alerta, risco, desfecho ruim, vácuo), um acorde curto no que dá certo (confirmação, desfecho bom, vencedor), um toque grave no botão do fechamento. Nunca dois sons a menos de 0,45 s.

## 9. Exemplos completos

### Cripto (43 s, um modelo de vendas falando de mercado)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "contato": { "nome": "Você", "hora": "14:02" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu" },
    { "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra", "lados": [
        { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 },
        { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 10.19 } ], "vencedor": 0, "vencedorEm": 11.99 },
    { "tipo": "destaque", "de": 12.85, "ate": 17.2, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta",
      "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 15.96 },
    { "tipo": "conversa", "de": 17.2, "ate": 23.6, "fixada": { "rotulo": "Erro", "tom": "errado", "texto": "Tem gente que perde" },
      "mensagens": [
        { "de": "eu", "em": 17.73, "digitando": 0.3, "texto": "Compra por impulso", "esfriaEm": 18.45 },
        { "de": "eu", "em": 19.78, "digitando": 0.4, "texto": "Moeda sem critério", "esfriaEm": 20.43 },
        { "de": "eu", "em": 21.75, "digitando": 0.4, "texto": "Risco que não entende", "esfriaEm": 22.86 } ] },
    { "tipo": "balao", "de": 23.6, "ate": 28.0,
      "mensagem": { "de": "outro", "em": 27.06, "digitando": 2.4, "texto": "Como avaliar os projetos e pensar no posicionamento?" } },
    { "tipo": "balao", "de": 28.0, "ate": 30.0,
      "mensagem": { "de": "eu", "tipo": "cartao", "em": 28.62, "digitando": 0.4, "desenho": "curso", "titulo": "Aula gratuita", "linha": "Para te explicar", "linhaEm": 29.6 } },
    { "tipo": "passos", "de": 30.0, "ate": 33.8, "titulo": "Como eu analiso", "itens": [
        { "texto": "O mercado", "em": 30.91 }, { "texto": "Os riscos", "em": 31.86 }, { "texto": "A escolha dos ativos", "em": 32.29 } ] },
    { "tipo": "frase", "de": 33.8, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68, "em": 33.83 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23, "opcoes": [
        { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05, "toqueEm": 40.65 }
  ]
}
```

Com esse plano: o vídeo abre com o balão "Bitcoin rompeu" e os pontinhos, ao lado do rosto; no "83" o valor conta até US$ 83.000. A pessoa encolhe para a bolha na moldura da direita e a conversa nova abre no quadro da esquerda; "Bull market" chega em negrito e a resposta citando o termo traz "Ciclo de alta das criptomoedas". A tela rola para as duas faixas: "Mercado · Subindo" e "No bolso · Não significa dinheiro", que esfria com ✕ no "bolso". Em quadro cheio, o alerta frio "Para a maioria das pessoas" e, embaixo, "Mesmo na alta, tem gente que perde". De volta à conversa, a fixada "✕ Erro · Tem gente que perde" e os três motivos chegando e esfriando um a um. O outro lado digita a pergunta durante a fala e ela chega no "posicionamento"; você responde com o cartão "Aula gratuita". Os três passos chegam numerados e ganham ✓; "promessa de lucro" é riscada; a pergunta ganha duas respostas rápidas; o fechamento escreve a chamada, trava "Saiba Mais" e o botão é tocado.

### Vendas no direct (o exemplo do modelo)

O plano do vídeo de exemplo está em `src/plano.json` do template, antes do `cortar`: um `balao` do outro lado ("Oi! Quanto custa?") com `offlineEm`, uma `conversa` com o jeito errado (o "R$ 197." seco que fica no "Visto", esfria e um `digitando` que some), três passos em `conversa` e `balao` (pergunta, cartão do produto, preço com condição, "Fechado!" com ✓ e a `confirmacao`), um `contraste` ("Resposta seca → vácuo" / "Conversa → venda", com `rotulo: "Pago"` e `valor`) e o `cta` com "Salva e testa hoje.".
