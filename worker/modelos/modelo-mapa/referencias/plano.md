# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastro do rosto), `zona` (não usada aqui), `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: estações, câmera e o cartão da pessoa
3. Os 11 blocos universais
4. A assinatura e os blocos próprios do Mapa
5. Como dividir a fala
6. Regras de tempo
7. Limites de texto
8. Legenda, correções e sons
9. Exemplo completo (um vídeo sobre cripto)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "abreCheio": true,
  "sfx": true,
  "correcoes": { "Jão": "João" },
  "retrato": { "zoom": 1, "ancoraY": 0.46 }
}
```

- `marca`: `nome` e `area` aparecem na etiqueta presa ao cartão da pessoa no fechamento (`cta`), em 64 e 42 px. Nome até ~18 caracteres, área até ~22. `nome` vazio = fechamento sem etiqueta.
- `abreCheio` (padrão `true`): o vídeo abre com a pessoa em quadro cheio e, em 0,14 s, ela recua para o cartão da primeira estação. `false` abre direto no cartão.
- `sfx`: `false` desliga os sons.
- `retrato` (opcional): ajusta o enquadramento da pessoa em **todos** os cartões. `zoom` multiplica o zoom de cada cartão (menos de 1 mostra mais; nunca fica abaixo do mínimo que cobre o cartão); `ancoraY` fixa a altura do rosto dentro do cartão (0 = topo, 1 = base). Gravação bem perto da câmera (selfie) já é ajustada sozinha: o zoom desce para a cabeça caber. Só use se as guias mostrarem a cabeça cortada.
- `rosto`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática: estações, câmera e o cartão da pessoa

É o que dá a cara do modelo, com qualquer assunto. A tela é um **papel pontilhado** e cada momento é uma **estação** num ponto diferente desse papel. Na fronteira entre dois momentos, a câmera **desliza** de uma estação para a próxima (0,64 s, macia nas duas pontas, com um leve recuo no meio), na ordem direita → baixo → esquerda → baixo…; os pontos do papel deslizam junto. No mesmo movimento, o **cartão da pessoa** (o vídeo dela num cartão branco de cantos redondos) muda de lugar e de tamanho, e um **ramo de tinta** o liga ao nó principal da estação.

| Estação (`tipo`) | Onde fica o cartão da pessoa | O que ocupa o resto da tela |
|---|---|---|
| `abertura` | grande, em cima (960×760) | o título enorme embaixo; o ramo desce do cartão até ele |
| `topicos` | pequeno, em cima à esquerda (400×500) | o título à direita; o tronco desce do cartão e os itens nascem dele |
| `passos` | pequeno, em cima à direita (430×540) | o título à esquerda; o caminho de discos numerados embaixo |
| `numero` | pequeno, em cima à direita | o rótulo à esquerda; o número circulado no meio |
| `comparacao` | pequeno, em cima à esquerda | o título (ou o × grande) à direita; os dois cartões embaixo |
| `grafico` | pequeno, em cima à esquerda | o título e o selo à direita; o cartão do gráfico embaixo |
| `destaque` | médio, no alto, no centro (480×540) | a palavra enorme embaixo; o ramo desce do cartão até ela |
| `definicao` | pequeno, em cima à direita | o termo (nó de tinta) à esquerda; o cartão pautado com o alfinete embaixo |
| `frase` | médio, em cima à direita (550×660) | aspas de tinta à esquerda; a frase enorme embaixo |
| `pergunta` | pequeno, em cima à esquerda | o "?" circulado à direita; a pergunta e as caixinhas embaixo |
| `cta` | grande, em cima (960×900), com a etiqueta e o selo no canto | a chamada embaixo (e o calendário de pontos, se houver curva) |
| `mapa` | grande, em cima (960×760) | o nó central e os ramos embaixo; o título falado no pé |
| `titulo` | médio, em cima à direita | o nó de origem à esquerda; o título enorme embaixo; os pontos dos intervalos |
| `curva` | pequeno, em cima à esquerda | letreiro, "ilustrativo", frase e o contador à direita; o cartão do gráfico embaixo |
| `contador` | pequeno, em cima à direita | a frase à esquerda; o relógio grande no meio |
| `barras` | pequeno, embaixo à esquerda | a frase no alto; as barras; o cartão de anotação com alfinete |
| `cartoes` | pequeno, em cima à esquerda | a frase à direita; a pilha de flashcards; a frase riscada no pé |
| trecho sem momento | grande (960×1130) | a legenda embaixo do cartão |

Regras que o template já cumpre sozinho:

- **O deslize começa 0,16 s antes do `de`** do momento: o corte que costuma cair na fronteira fica no meio do movimento.
- **Nenhum quadro só de papel**: as estações vizinhas ficam encostadas; no meio do deslize aparecem as duas, cada uma com conteúdo e cada uma no seu lugar do papel. A que chega já traz tudo esboçado a lápis.
- **Esboço a lápis**: toda palavra, nó, ramo, caixinha, disco e trilho já está no papel em cinza claro antes de ser dito; a tinta passa por cima, da esquerda para a direita, na palavra. Terminada a escrita, a palavra fica desenhada uma vez só, limpa.
- **A voz**: o vídeo da pessoa fica montado o tempo todo; só existe um cartão da pessoa.
- **Trecho sem momento** (≥ 0,6 s) vira uma estação de fala: cartão grande e legenda. Lacunas menores são absorvidas pelo momento anterior.
- **Texto que cabe**: o template mede a própria fonte, escolhe o corpo e quebra as linhas (equilibradas) antes de desenhar, sem descer abaixo do mínimo legível.

## 3. Os 11 blocos universais

Os mesmos `tipo` e campos existem em todos os modelos do pack; aqui eles aparecem na linguagem do Mapa. Campos comuns a todos: `tipo`, `de`, `ate` e `legenda?` (não use: veja a seção 8).

### `abertura` — o título que abre

```json
{ "tipo": "abertura", "de": 0, "ate": 3.6, "texto": "Com quatro acordes você toca centenas de músicas", "destaque": "centenas de músicas", "em": 0.27 }
```

O cartão grande da pessoa em cima e o `texto` se escrevendo embaixo, palavra por palavra (Bitter, 132 a 72 px, até 3 linhas). `destaque`: trecho exato que ganha marca-texto logo depois de dito. `em` (opcional): o instante em que o texto começa a ser dito (padrão: `de`).

### `topicos` — lista sem ordem (motivos, erros, dicas, sinais)

```json
{ "tipo": "topicos", "de": 13.0, "ate": 16.0, "titulo": "Dois sinais de alerta",
  "itens": [ { "texto": "Promessa de lucro", "em": 13.3 }, { "texto": "Pressa para entrar", "em": 14.0, "detalhe": "quem apressa quer vender" } ] }
```

Um tronco de tinta desce do cartão da pessoa e cada item é um **nó** (pílula) que nasce dele no seu `em`; o item da vez ganha marca-texto, que passa para o seguinte. `titulo` se escreve ao lado do cartão (até 4 linhas, 76 a 48 px) — use sempre que puder: sem ele, a coluna ao lado do cartão fica só com o papel. `detalhe`: uma linha menor embaixo do nó.

- 2 a 5 itens. Com 4 ou 5, os nós ficam menores (52 e 46 px).

### `passos` — sequência em ordem (processo, caminho, etapas)

```json
{ "tipo": "passos", "de": 28.03, "ate": 33.7, "titulo": "Aula gratuita: como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

Discos numerados num caminho de pontos (o mesmo calendário de pontos da curva); no `em` de cada passo, a caneta risca o caminho até ele, o disco se enche de marca-texto e o texto se escreve ao lado (Bitter, 84 a 44 px, até 2 linhas). `detalhe` opcional, menor, embaixo.

- 2 a 5 itens.

### `numero` — um número dito

```json
{ "tipo": "numero", "de": 0, "ate": 3.8, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

O `rotulo` se escreve ao lado do cartão (a partir de `rotuloEm`); em `em`, o número conta de 0 até `valor` (0,9 s) em pt-BR ("83.000", "1,5"), uma fileira de pontos do papel é riscada enquanto ele conta, e, quando ele para, a caneta o circula e o marca-texto passa por baixo.

- `prefixo` ("US$", "R$") e `sufixo` ("mil", "mi", "semana") saem menores; `%` e `x` no sufixo saem maiores. `casas`: casas decimais (padrão: as do `valor`).
- `ilustrativo: true` põe o selo "ilustrativo" (número que não é medida exata).
- **Use o número que a pessoa diz.** "83 mil dólares" = `valor: 83000, prefixo: "US$"`.

### `comparacao` — dois lados

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
  "lados": [ { "rotulo": "mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "no bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

Dois cartões de anotação, um embaixo do outro, ligados por um disco: × em `contra`; seta em `antes-depois` e `errado-certo`. Cada cartão traz o `rotulo` (letreiro em caixa-alta) e o `texto` (Bitter, 96 a 52 px, até 2 linhas), e ganha tinta no seu `em`.

- `vencedor` (0 ou 1) + `vencedorEm`: o cartão vencedor se enche de marca-texto e ganha um visto; o outro esmaece.
- `errado-certo`: o lado 0 é o errado, o 1 o certo (vencedor padrão 1); o errado é **riscado** quando o certo vence.
- Sem `titulo`, a coluna ao lado do cartão mostra o × (ou a seta) grande, desenhado nos `em` dos lados.

### `grafico` — algo que sobe, cai, cresce, se divide

Com números ditos (`dados`, 2 a 6):

```json
{ "tipo": "grafico", "de": 10.2, "ate": 13.0, "titulo": "Preço nos últimos meses", "forma": "linha", "unidade": "mil",
  "dados": [ { "rotulo": "Jan", "valor": 42, "em": 10.4 }, { "rotulo": "Mai", "valor": 83, "em": 12.0 } ] }
```

Sem números (a forma, com o selo "ilustrativo"):

```json
{ "tipo": "grafico", "de": 10.01, "ate": 13.85, "titulo": "Quando ficar natural, acelera", "forma": "linha",
  "tendencia": "sobe", "tendenciaEm": 11.28, "unidade": "velocidade", "ilustrativo": true }
```

O mesmo cartão branco da curva, embaixo do cartão da pessoa.
- `linha`: a caneta liga os pontos, um a cada `em`, com o valor em cima e o rótulo embaixo; o ponto da vez ganha um disco de marca-texto.
- `barras`: barras deitadas que crescem sobre trilhos a lápis; a maior é marca-texto com contorno de tinta, as outras são lápis; o valor aparece na ponta.
- `pizza`: fatias que se abrem no mostrador, cada uma no seu `em` (a maior em marca-texto), com a legenda embaixo.
- Sem `dados`: `tendencia` ("sobe", "cai", "oscila") — a caneta desenha a forma sobre o esboço a lápis em 1,5 s a partir de `tendenciaEm`; com `forma: "barras"`, seis colunas que sobem ou descem. `unidade` vira o letreiro "↑ unidade" do eixo. O selo "ilustrativo" aparece sempre que não há `dados`.
- `unidade` com dados: vai depois de cada valor ("42 mil", "55%").

### `destaque` — uma palavra ou frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.91, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

O cartão da pessoa no alto, no centro, e a palavra enorme embaixo, centrada (Bitter, 170 a 84 px, até 3 linhas), ligada a ele por um ramo que desce.
- `chave` (padrão): a tinta escreve e o marca-texto passa por baixo de cada palavra.
- `alerta`: um bloco de tinta se enche por trás e a palavra sai em branco, com um selo "!" no canto (o "cheio de tinta" do nó central do mapa).
- `detalhe` + `detalheEm`: uma linha menor embaixo (64 a 44 px).

### `definicao` — um termo explicado

```json
{ "tipo": "definicao", "de": 3.8, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

O `termo` é um nó do mapa à esquerda do cartão da pessoa, que se enche de tinta no `em`; dele desce um ramo grosso até um cartão de anotação pautado, que chega torto e é cravado pelo alfinete em `significadoEm`, quando o significado começa a se escrever (Bitter, 112 a 56 px, até 4 linhas).

### `frase` — frase de efeito, opinião, conclusão

```json
{ "tipo": "frase", "de": 33.7, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.95, "em": 33.83 }
```

Aspas grandes de tinta à esquerda do cartão da pessoa (o ramo dela chega nelas) e a frase enorme embaixo, palavra por palavra (Bitter, 128 a 64 px, até 4 linhas). `destaque`: trecho com marca-texto. `risco`: trecho que leva um traço de tinta em `riscoEm` (padrão: logo depois de dito).

### `pergunta` — pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer:", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o seu patrimônio", "em": 37.98 } ] }
```

A caneta circula um "?" grande ao lado do cartão da pessoa; a pergunta se escreve embaixo (Bitter, 120 a 60 px). `opcoes` (2 a 4): caixinhas de caderno; cada opção ganha tinta no seu `em` e a caixinha da opção da vez fica com marca-texto. Sem opções, a pergunta fica maior.

### `cta` — o fechamento

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

O cartão grande da pessoa com a etiqueta de nome (`marca`) presa no canto de baixo e um **selo** no canto de cima, que se enche de marca-texto na primeira palavra (ou em `salvaEm`): `salvar` = fita de marcador (padrão), `seguir` = "+", `comentar` = balão, `link` = elo. A chamada se escreve embaixo com o `destaque`. Se o plano tem uma `curva` (ou `dias`), o pé mostra o calendário de pontos com o dia de hoje aceso e os outros a lápis; sem isso, a chamada ganha uma linha a mais.

## 4. A assinatura e os blocos próprios do Mapa

A assinatura (`mapa` ou `curva`) tem que aparecer pelo menos uma vez — o `conferir.mjs` cobra. Veja exemplos fora do nicho no SKILL.md ("A assinatura em qualquer assunto").

### `mapa` — o mapa mental (assinatura)

```json
{ "tipo": "mapa", "de": 14.93, "ate": 24.21, "centro": "Quem perde", "titulo": "Mesmo na alta, tem gente que perde",
  "ramos": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.78 }, { "texto": "Risco que não entende", "em": 21.75 } ] }
```

O nó central (cheio de tinta) à esquerda; os ramos nascem dele para a direita, um a cada `em`. Serve para tudo o que **sai de um ponto**: causas de um problema, partes de um todo, opções, ingredientes, acordes, sintomas. `titulo` (opcional) é a frase falada que se escreve embaixo (2 linhas, 92 a 64 px); sem ele, o mapa desce para o meio da faixa. `apagado`: trecho do título que fica a lápis.
- `esqueceEm`: os ramos se apagam um por um e o nó central perde a tinta (esquecer, perder, abandonar, cortar).
- `fixaEm`: os ramos ganham marca-texto um por um (lembrar, fixar, escolher, dominar); depois de um `esqueceEm`, devolve a tinta.
- 2 a 5 ramos. Ramo longo encolhe (até 34 px) e, com até 4 ramos, quebra em 2 linhas; o nó central quebra em 2 linhas quando isso deixa os ramos maiores.

### `curva` — queda e retomada (assinatura)

```json
{ "tipo": "curva", "de": 3.88, "ate": 8.93, "rotulo": "curva do esquecimento", "titulo": "Estudou hoje?",
  "estudoEm": 3.97, "revisoes": [ { "dia": 1, "em": 5.31 }, { "dia": 7, "em": 6.66 }, { "dia": 30, "em": 8.06 } ],
  "eixo": "memória", "unidade": "dia", "unidades": "dias", "inicio": "hoje", "sem": "sem revisão", "com": "com revisão" }
```

Algo **cai com o tempo e cada ação o levanta de volta**, e a queda seguinte é mais lenta: memória e revisão, energia e pausa, motivação e pequenas vitórias, músculo e treino. Em `estudoEm` a caneta começa a desenhar a queda; cada marco (`revisoes[]`, `dia` crescente) faz a curva subir no seu `em`, com um degrau de marca-texto. O eixo de baixo é um calendário de pontos (um por unidade); ao lado do cartão da pessoa, um contador acompanha a caneta. Sempre ilustrativa: o selo é fixo e o eixo de cima não tem números.
- Rótulos livres: `eixo` (o que cai: "↑ memória", "↑ energia"), `unidade`/`unidades` ("dia"/"dias", "semana"/"semanas"), `inicio` (o marco zero: "hoje", "início"), `sem` (a linha a lápis do que acontece sem a ação) e `com` (a cauda). Sem eles, aparecem só os números.
- 1 a 4 marcos. Dê ~0,8 s entre um marco e o próximo. Momento de 3 a 6 s. `semRevisao: false` tira a linha a lápis.

### `titulo` — a ideia-chave como nó grande

```json
{ "tipo": "titulo", "de": 2.29, "ate": 3.88, "rotulo": "o método", "origem": "conteúdo",
  "apoio": "Usa a", "texto": "revisão espaçada", "destaque": "espaçada", "intervalos": [0, 1, 7, 30], "zero": "hoje" }
```

`texto` em Bitter enorme (156 a 84 px, até 3 linhas), `destaque` em marca-texto. `apoio`: linha menor falada antes. `origem`: nó de onde desce o ramo grosso (repita o nó central do `mapa` para costurar as estações). `rotulo`: letreiro. `intervalos` (opcional): pontos com espaço crescente embaixo do título (dias, semanas, etapas); `zero` é o rótulo do ponto 0.

### `contador` — o relógio que conta

```json
{ "tipo": "contador", "de": 8.93, "ate": 11.05, "rotulo": "minutos por revisão",
  "texto": "Cada revisão leva poucos minutos", "destaque": "poucos minutos", "valor": 5, "unidade": "min", "em": 10.13 }
```

Um mostrador de relógio: em `em` o número conta até `valor` e o ponteiro varre a fatia (em marca-texto). Bom para tempo e para "uma fração de um todo". `volta`: o valor de uma volta inteira (padrão 60 até 40; acima, o dobro do valor em múltiplos de 60). Valor inteiro de até 3 dígitos; `unidade` curta.

### `barras` — comparação de quanto dura ou rende, com alfinete

```json
{ "tipo": "barras", "de": 11.05, "ate": 13.37, "texto": "fixa o conteúdo por muito mais tempo", "destaque": "muito mais tempo",
  "no": "conteúdo", "fixaEm": 11.6, "eixo": "tempo na memória",
  "barras": [ { "texto": "sem revisão", "valor": 0.32, "em": 12.07 }, { "texto": "com revisão", "valor": 1.12, "em": 12.3, "forte": true } ] }
```

Barras de proporção (sem números): `valor` relativo (1 = largura toda; acima de 1 passa da borda com seta dupla — o "muito mais"). `forte` = marca-texto. `no` + `fixaEm`: o cartão de anotação recebe um alfinete. `eixo`: o rótulo embaixo. 2 barras (3 no máximo). Para números ditos, use `grafico` com `forma: "barras"`.

### `cartoes` — flashcards que viram

```json
{ "tipo": "cartoes", "de": 13.37, "ate": 16.94, "rotulo": "questões", "texto": "Junta isso com questões",
  "cartoes": [ { "pergunta": "Quando revisar?", "resposta": "Amanhã, 7 e 30 dias", "em": 14.25 } ],
  "rodape": "Você para de recomeçar do zero", "riscado": "recomeçar do zero", "riscaEm": 16.6 }
```

1 a 3 flashcards; cada um vira da pergunta para a resposta no seu `em`. Perguntas que resumem o próprio vídeo não inventam nada. `rodape` + `riscado` + `riscaEm`: frase no pé com um trecho riscado.

## 5. Como dividir a fala

Siga `references/adaptar.md` (o mapa editorial em `work/mapa.md`). Neste modelo:

| A fala traz… | Bloco do Mapa |
|---|---|
| o tema, a promessa, a pergunta inicial | `abertura` (ou `mapa` com título, se a abertura já enumera coisas) |
| várias coisas que saem de um ponto (causas, partes, opções) | **`mapa`** (assinatura) ou `topicos` |
| uma lista de motivos, erros, dicas | `topicos` |
| uma sequência, um processo, um caminho | `passos` |
| um número, preço, porcentagem, quantidade | `numero` (tempo curto: `contador`) |
| A × B, antes × depois, errado × certo | `comparacao` |
| algo que sobe, cai, se divide; números em série | `grafico` |
| algo que cai e volta a subir com uma ação que se repete | **`curva`** (assinatura) |
| um alerta, uma palavra-chave | `destaque` |
| um termo técnico explicado | `definicao` |
| uma frase de efeito, uma conclusão, algo que deixa de ser feito | `frase` (com `risco`) |
| uma pergunta para quem assiste | `pergunta` |
| a chamada final | `cta` |

- Um vídeo de 20–45 s pede 6 a 10 estações.
- Não repita o mesmo bloco três vezes seguidas; alterne cartão grande e cartão pequeno.
- Nada fica parado mais de ~2,5 s: um item, um ramo, um passo, um número ou uma palavra escrita.

## 6. Regras de tempo

- **Fronteiras de momento na pausa entre frases**: o `de` de um = o `ate` do anterior = o valor de `cortesEm` que fica entre as duas frases (ou, sem corte, o `em` da primeira palavra da frase nova menos 0,1). O primeiro momento começa em 0; o `ate` do último é a `duracao`.
- **Estação de 1,5 a 6 s.** Menos de ~1,5 s não dá tempo de ler depois do deslize (junte com a vizinha). Mais de ~6 s só com itens entrando por dentro (ramos, passos, opções).
- Sub-passos (`itens[].em`, `ramos[].em`, `lados[].em`, `dados[].em`, `opcoes[].em`, `em`, `significadoEm`, `riscoEm`, `vencedorEm`, `tendenciaEm`…): o `em` da palavra, tirado de `work/palavras.json`. Nada aparece antes de ser dito.
- As palavras dos textos (`texto`, `titulo`, `rotulo`, `significado`, `detalhe`…) acham sozinhas o seu tempo na fala, a partir do `em` do bloco ou do item; texto enxugado continua no ritmo. Escreva números como a pessoa fala ou em algarismos ("7" casa com "sete").
- Um sub-passo dito durante o deslize (os 0,64 s a partir do `de` − 0,16) acontece no meio do movimento; se for importante, ponha-o logo depois.

## 7. Limites de texto

O template escolhe o corpo e quebra as linhas medindo a própria fonte, mas não desce abaixo do mínimo legível. Passando destes limites, encurte com as palavras da fala:

| Campo | Limite |
|---|---|
| `abertura.texto` | ~60 caracteres (3 linhas) |
| `topicos.titulo`, `passos.titulo`, `comparacao.titulo`, `grafico.titulo` | ~40 |
| `topicos.itens[].texto` | ~24 (uma linha; quebra em 2 se precisar) · `detalhe` ~40 |
| `passos.itens[].texto` | ~30 (2 linhas) · `detalhe` ~40 |
| `numero.rotulo` | ~50 (4 linhas, coluna estreita) · `prefixo`/`sufixo` ~8 |
| `comparacao.lados[].rotulo` | ~20 (letreiro) · `texto` ~40 (2 linhas) |
| `grafico.dados[].rotulo` | ~10 em `linha` com 6 pontos; ~20 em `barras`; ~12 em `pizza` |
| `destaque.texto` | ~30 (3 linhas) · `detalhe` ~50 |
| `definicao.termo` | ~24 (2 linhas no nó) · `significado` ~90 (4 linhas) |
| `frase.texto` | ~70 (4 linhas) |
| `pergunta.texto` | ~60 · `opcoes[].texto` ~40 (2 linhas) |
| `cta.texto` | ~40 com calendário; ~60 sem |
| `mapa.centro` | ~20 (quebra em 2 linhas) · `ramos[].texto` ~18 · `titulo` ~40 |
| `titulo.texto` | ~30 (3 linhas); `apoio` ~20; `rotulo` e `origem` ~16 |
| `curva.titulo` | ~30 (2 linhas); `rotulo` ~24 |
| `contador.texto` | ~50 (4 linhas); `rotulo` ~24 |
| `barras.texto` | ~60 (3 linhas); `barras[].texto` ~20; `no` ~20 |
| `cartoes.texto` | ~30; `pergunta` ~32; `resposta` ~28; `rodape` ~40 |

Letreiros (`rotulo` das comparações, da curva, do título) saem em caixa-alta espaçada; escreva-os em minúsculas no plano.

## 8. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`: uma linha em tinta sobre o papel (Readex Pro 50 px), a palavra da vez com marca-texto. Ela **só aparece nos trechos sem momento** (logo abaixo do cartão grande): nas estações, os próprios textos já se escrevem no ritmo da fala. `"legenda": true` num momento a mostra na faixa de baixo (y ≈ 1424), mas quase todas as estações usam essa faixa — **não use**. `semLegenda` acrescenta faixas sem legenda.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Jão": "João", "né": "" }`. Só corrija o que você tem certeza. Não edite `palavras` à mão.

Sons (automáticos, tonais, nunca dois a menos de 0,45 s): um "vum" grave a cada deslize, uma nota curta quando um ramo, item, lado, opção ou dado nasce, notas subindo nos passos e nas revisões da curva, uma descida no esquecimento, no alerta e na frase riscada, um toque quando um número para, um toque surdo quando o alfinete crava, uma nota quando um flashcard vira e um acorde curto no fim. `"sfx": false` desliga.

## 9. Exemplo completo (um vídeo sobre cripto)

Vídeo de 43 s, sem cortes internos. `palavras` e os campos mecânicos foram omitidos. (O plano do exemplo do modelo, sobre estudos, está em `src/plano.json` do template.)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "abreCheio": true,
  "sfx": true,
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 3.8, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "definicao", "de": 3.8, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
      "lados": [ { "rotulo": "mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "no bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.91, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "mapa", "de": 14.93, "ate": 24.21, "centro": "Quem perde", "titulo": "Mesmo na alta, tem gente que perde",
      "ramos": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.78 }, { "texto": "Risco que não entende", "em": 21.75 } ] },
    { "tipo": "pergunta", "de": 24.21, "ate": 28.03, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "passos", "de": 28.03, "ate": 33.7, "titulo": "Aula gratuita: como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.7, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.95, "em": 33.83 },
    { "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer:", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o seu patrimônio", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

A assinatura entra nos três motivos: o mapa mental "Quem perde" com um ramo para cada motivo, na palavra em que ele é dito.
