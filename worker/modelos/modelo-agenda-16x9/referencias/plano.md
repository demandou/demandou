# O plano de edição (`src/plano.json`)

**Versão deitada (16:9, 1920×1080), para o vídeo completo do YouTube.** Os campos são os mesmos do vertical; muda a diagramação, pela aula 9 do curso: a tela cheia é a base, e na folha a pessoa fica numa moldura do lado direito, com o conteúdo no quadro à esquerda. Os tamanhos de letra citados aqui são em unidades da tela virtual de 2400×1350 (saem a 80% em px do quadro).

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `agenda`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json` (cada palavra tem `em` e `ate`). Todo campo `em` ou `…Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática da agenda (lugares da pessoa, trocas, cortina)
3. Os 11 blocos universais
4. A assinatura: `blocos` e `ciclos`
5. Os outros tipos deste modelo: `gancho`, `tarefas`
6. Como dividir a fala em momentos
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Finanças" },
  "agenda": { "titulo": "Criptomoedas", "dia": "Hoje", "inicio": "09:00" },
  "sfx": true,
  "correcoes": {}
}
```

- `marca.nome` e `marca.area`: a etiqueta do compromisso de vídeo (ícone de câmera + "Carla · Finanças"). Em tela cheia ela fica no alto, à esquerda, dentro da margem segura; com a pessoa na folha, no pé da moldura (na moldura pequena do canto, só o nome). Nome até ~14 caracteres, área até ~18 (passou disso, termina em "…"). Os dois vazios = sem etiqueta.
- `agenda.titulo`: o nome da agenda no cabeçalho da folha, até ~40 caracteres (o cabeçalho atravessa a tela; mais que isso diminui e termina em "…"). Use uma palavra da fala que dê o assunto ("Criptomoedas", "Um senhor", "Rotina de estudos"). Padrão: a `resposta` do `gancho`, ou a `marca.area`. Um momento `blocos` pode trocar o nome a partir dele (`agenda`).
- `agenda.dia`: à direita do cabeçalho, com ícone de calendário. Padrão "Hoje"; `""` esconde. Até ~10 caracteres ("Segunda", "Todo dia").
- `agenda.inicio`: o horário do primeiro bloco de tempo, quando houver durações ditas. Padrão: o `inicio` do primeiro bloco, ou 09:00 (só aparece se os blocos tiverem `minutos`).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs` (no 16:9, `rosto.quadro` é 1920×1080 e `videoAltura` é 1080). Não mexa à mão.

## 2. A gramática da agenda

O vídeo inteiro é um app de agenda fictício (sem marca): fundo cinza-frio, uma folha branca de cantos redondos que ocupa a tela (de 52 a 1252 unidades, com 60 de cada lado), com cabeçalho (quadradinho tomate, nome da agenda, dia), régua à esquerda e linhas finas.

**A pessoa é o compromisso de vídeo** e muda de lugar a cada momento. O template decide o lugar pelo tipo; você não escreve posições. Pela aula 9 do curso, na folha ela fica **sempre numa moldura do lado direito**, com o rosto centralizado e acompanhado, e o conteúdo ocupa o **quadro à esquerda** (da margem segura até a moldura). Os nomes dos lugares são os do vertical; no quadro deitado eles são molduras de tamanhos diferentes, todas encostadas na direita (larguras em unidades):

| Lugar | Onde | Tipos |
|---|---|---|
| tela cheia | quadro inteiro, a pessoa como foi gravada; o cartão branco numa coluna livre ao lado do peito (à esquerda dela quando cabe), centrado na linha do peito | `abertura`, `gancho`, `destaque`, `pergunta`, `cta`, `numero` no primeiro momento; trechos sem momento |
| `topo` (moldura larga) | 800 de largura, a altura da folha; o conteúdo no quadro à esquerda (~1360 de largura) | `topicos`, `comparacao`, `grafico`, `definicao`, `numero`, `blocos`, `tarefas` |
| `lado` (moldura em pé) | 660 de largura, a altura da folha (720 de altura quando o anel do cronômetro fica embaixo dela); o quadro à esquerda fica mais largo (~1500) | `passos`, `numero`, `definicao`, `topicos` (4 ou 5 itens), `comparacao` e `blocos` alternados |
| no canto | pequena no alto à direita (420×480), com o contador dos ciclos embaixo | `ciclos`; `grafico` com título, alternando com a moldura larga |
| no alto (a maior) | 940 de largura, a altura da folha; a linha do dia e a frase no quadro à esquerda | `frase` |

- **Alternância:** dois momentos seguidos na folha não repetem a moldura quando o tipo tem alternativa (larga ↔ em pé; gráfico: larga ↔ canto). Para forçar, `"pessoa": "topo"` ou `"lado"` em `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao` e `blocos` (no `numero`, também `"cheia"`).
- **Trocas:** a pessoa muda de moldura em 0,6 s, começando 0,15 s antes do `de` (o corte na fronteira some no movimento). Saindo da tela cheia, a folha já está inteira embaixo e a caixa encolhe sobre ela até a moldura da direita, levando o cartão do peito junto; voltando, a pessoa cresce por cima da folha.
- **Cortina:** entre dois momentos na folha (quando um deles não é a agenda de blocos), a linha do "agora" (tomate, com uma bolinha) varre a folha de cima para baixo em 0,5 s. Acima dela já está o momento novo, abaixo ainda o anterior: nunca dois textos sobrepostos, nunca uma página vazia.
- **Espera a lápis:** cada lugar que vai receber algo aparece antes tracejado e apagado; na palavra, o bloco cai e assenta.
- **Nada passa na frente do rosto:** o conteúdo da folha fica sempre no quadro à esquerda, fora da moldura; o cartão da tela cheia fica numa coluna que não alcança o rosto em nenhum instante do momento (a coluna é medida com o rastro do rosto).
- **Trecho sem momento** (buraco de mais de 1,2 s entre momentos, ou antes do primeiro) = a pessoa em tela cheia com legenda, na área segura de baixo. No vídeo completo esse respiro é normal (até ~8 s): a folha abre só quando ajuda a entender.
- **Margens do YouTube:** o texto fica a 96 px das laterais e nada importante passa de y 984 (controles do player); o template já respeita isso.

## 3. Os 11 blocos universais

Os campos são os mesmos em todos os modelos do pack. Os limites de texto são para o texto caber grande: o template mede cada texto e diminui o corpo até um mínimo legível (2 ou 3 linhas); passou muito do limite, fica pequeno. Use as palavras da fala, na ordem em que são ditas (o template procura cada palavra na fala para acendê-la na hora; algarismos casam com números falados).

Campos comuns: `tipo`, `de`, `ate` e `legenda?: true` (mantém a legenda durante o momento: em tela cheia, embaixo, com o cartão subindo para ficar acima dela; na folha, no pé da moldura, menos na pequena do canto).

### `abertura`: o título ao lado do peito

```json
{ "tipo": "abertura", "de": 0, "ate": 2.85, "texto": "Todo dia, às seis da tarde", "destaque": "seis da tarde", "em": 0.34 }
```

- `texto`: até ~60 caracteres (cabe em 1 a 3 linhas de 96 a 60 unidades, na largura da coluna ao lado do peito, de ~780 a 1040). Se monta palavra por palavra, a partir do lápis (o primeiro quadro já mostra o título apagado: serve de capa).
- `destaque`: trecho exato do texto que fica tomate.
- `em`: quando o texto começa a ser dito (padrão `de`).
- Com blocos de tempo no plano, o dia em miniatura aparece embaixo e acende depois da última palavra.

### `topicos`: itens que caem como blocos

```json
{ "tipo": "topicos", "de": 15.9, "ate": 24.1, "titulo": "Tem gente que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 },
             { "texto": "Escolhe moeda sem critério", "em": 19.21 },
             { "texto": "Assume risco que não entende", "em": 21.25, "detalhe": "opcional, menor" } ] }
```

- `titulo` (opcional): até ~40 caracteres, se monta na fala.
- `itens`: **2 a 5**, `texto` de 2 a 6 palavras (até ~32 caracteres), `em` na palavra que o nomeia, `detalhe` opcional (até ~24 caracteres, uma linha menor).
- Todos os itens no mesmo corpo (o maior que serve para todos). Com 4 ou 5 itens, a pessoa vai para a moldura em pé e o quadro da lista fica mais largo.

### `passos`: a linha do tempo

```json
{ "tipo": "passos", "de": 12.87, "ate": 16.32, "titulo": "opcional",
  "itens": [ { "texto": "Uma menina", "em": 13.31 }, { "texto": "Sentou do lado", "em": 14.0 }, { "texto": "Pegou a xícara", "em": 15.09 } ] }
```

- `itens`: **2 a 5**, em ordem; `texto` até ~28 caracteres; `detalhe` opcional.
- Cada passo acende o marcador numerado, a linha tomate se enche até ele, o realce claro anda até ele; os anteriores ganham ✓.

### `numero`: o anel do cronômetro

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número dito (sem pontos: `83000`, `2.5`). Conta de 0 até ele a partir de `em` (0,8 a 1,5 s), em pt-BR ("83.000", "2,5").
- `prefixo` ("US$", "R$") e `sufixo` ("%", "anos", "mil"): `sufixo` de até 2 caracteres fica colado ao número ("37,5%"); mais longo vai embaixo dele.
- `casas`: casas decimais (padrão: as do valor).
- `rotulo`: o que o número é, até ~40 caracteres, palavras da fala; `rotuloEm`: quando ele é dito (padrão `de`).
- `ilustrativo: true`: mostra a etiqueta ILUSTRATIVO (número que não foi dito exatamente).
- Com `sufixo` "%", o arco para na porcentagem; nos outros, ele se enche junto com a contagem. Depois de contar, a marcação "agora" segue andando devagar em volta do anel.
- **Primeiro momento do vídeo** (`de` = 0): vira um widget ao lado do peito com a pessoa em tela cheia (anel pequeno + número grande + rótulo). Em outro lugar, na folha: anel grande (até 560) no quadro à esquerda e o rótulo ao lado dele. `"pessoa": "cheia"` força o widget.

### `comparacao`: dois dias

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "titulo": "opcional", "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 },
             { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ],
  "vencedor": 0, "vencedorEm": 39.35 }
```

- `lados`: exatamente 2. `rotulo` até ~16 caracteres (caixa alta pequena, acende no `em`); `texto` até ~32 caracteres. O bloco do lado cai quando a primeira palavra do `texto` é dita.
- `modo`: `contra` (× no meio), `antes-depois` (seta; o "antes" apaga quando o "depois" é dito, que fica tomate) ou `errado-certo` (o primeiro lado é riscado em tomate, o segundo fica verde com ✓; ponha o errado primeiro).
- `vencedor` (0 ou 1) e `vencedorEm`: o vencedor fica tomate com ✓ e o outro apaga.
- No quadro deitado os dois dias ficam sempre lado a lado, no quadro à esquerda da moldura.

### `grafico`: sobre as linhas da régua

```json
{ "tipo": "grafico", "de": 7.5, "ate": 10.0, "titulo": "Preço do Bitcoin", "forma": "barras", "unidade": "US$",
  "dados": [ { "rotulo": "2021", "valor": 47000, "em": 7.7 }, { "rotulo": "2024", "valor": 93000, "em": 8.9 } ] }
```

```json
{ "tipo": "grafico", "de": 16.32, "ate": 19.55, "titulo": "Sorriu pela primeira vez", "forma": "linha",
  "tendencia": "sobe", "tendenciaEm": 18.53, "ilustrativo": true }
```

- `forma`: `barras` (colunas que sobem; a da vez tomate, as outras ardósia), `linha` (pontos que caem ligados por um traço tomate) ou `pizza` (o anel dividido em arcos, com legenda e porcentagens).
- `dados`: **2 a 6** números **ditos**, cada um com `rotulo` (até ~12 caracteres), `valor` e `em`. Valores grandes demais para a coluna viram "47 mil", "1,5 mi".
- Sem números ditos: `tendencia` (`sobe`, `cai`, `oscila`) + `ilustrativo: true` (obrigatório) e `tendenciaEm` (a palavra em que a curva chega ao fim). A curva tracejada espera a lápis e se desenha em tomate; `forma: "barras"` com tendência = seis colunas que crescem em cascata.
- `unidade`: "%", "R$", "US$", "€" entram nos números; qualquer outra ("kg", "alunos") vira uma nota ao lado da etiqueta.
- Com `titulo`, a pessoa alterna entre a moldura larga e a pequena do canto; o título fica no alto do quadro à esquerda e o gráfico embaixo dele, na largura do quadro.

### `destaque`: um bloco que cai ao lado do peito

```json
{ "tipo": "destaque", "de": 12.85, "ate": 15.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta", "detalhe": "opcional", "detalheEm": 14.2 }
```

- `texto`: até ~40 caracteres (1 a 3 linhas de 100 a 60 unidades), se monta a partir de `em`.
- `nivel`: `alerta` = bloco tomate cheio com aviso; `chave` (padrão) = cartão branco e um grifo tomate que se desenha embaixo.
- `detalhe` (até ~40 caracteres) e `detalheEm`: uma linha menor embaixo.

### `definicao`: o termo que se abre

```json
{ "tipo": "definicao", "de": 4.95, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo`: até ~20 caracteres (o termo espera a lápis no lugar dele e cai num bloco tomate em `em`).
- `significado`: até ~50 caracteres; em `significadoEm` o bloco se abre para baixo e o significado se escreve.

### `frase`: a moral, com a linha do dia

```json
{ "tipo": "frase", "de": 23.0, "ate": 25.0, "texto": "Não existe atalho. Existe método e paciência.", "destaque": "método", "risco": "atalho", "riscoEm": 23.8 }
```

- `texto`: até ~90 caracteres. A primeira frase (até o primeiro ponto, ! ou ?) sai grande (até 100 unidades), o resto menor (até 66). A pessoa fica na moldura maior, à direita, e a frase no quadro à esquerda.
- `destaque`: trecho em tomate (`enfase` é o nome antigo). `risco`: trecho riscado em tomate em `riscoEm` (padrão: logo depois da última palavra do trecho). `em`: quando o texto começa (padrão `de`).
- Com blocos de tempo no plano, a agenda inteira vira a linha do dia no alto do quadro à esquerda, acima da frase, e a marcação "agora" a percorre (com horário, se as durações foram ditas), concluindo cada bloco com ✓. `marcaDe` e `concluiEm` mudam o começo e o fim da marcação. Sem blocos, a frase sai maior, sozinha no quadro à esquerda.

### `pergunta`: o convite

```json
{ "tipo": "pergunta", "de": 24.1, "ate": 28.0, "texto": "Como avaliar os projetos?", "em": 24.58,
  "opcoes": [ { "texto": "Entender antes", "em": 35.93 }, { "texto": "Correr o risco", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres; espera a lápis e se monta a partir de `em`.
- `opcoes`: **2 a 4** botões de resposta (até ~24 caracteres cada), cada um acende na sua palavra. Quebram em duas fileiras se não couberem.

### `cta`: o lembrete

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "acaoEm": 40.05,
  "etiquetas": [ { "texto": "Essa aula", "icone": "livro", "em": 41.72 }, { "texto": "Agora", "icone": "relogio", "em": 42.22 } ] }
```

- `texto`: a chamada, até ~60 caracteres (uma linha de 84 unidades se couber; senão 2 de 72 ou 3 de 60). `titulo` é o nome antigo.
- `icone`: o botão: `salvar` ("Salvar" → "Salvo", padrão), `seguir` ("Seguir" → "Seguindo"), `comentar` ("Comentar" → "Comentado"), `link` ("Abrir" → "Aberto"). `acao` é o nome antigo.
- `acaoEm`: a palavra em que o botão afunda ("salva", "segue", "toca"); o botão espera o cartão assentar (no mínimo 0,4 s depois do `de`).
- `destaque`: trecho em tomate. `rotulo`: letreiro em cima (padrão "Lembrete"; até ~14 caracteres).
- `etiquetas` (opcional, até 2): quando, onde, com quem; `texto` até ~14 caracteres, `icone`, `em`.
- Com blocos de tempo no plano, o dia em miniatura aparece no cartão (com ✓ se houve `frase` antes).

### Ícones disponíveis

`celular`, `email`, `mensagem`, `video`, `noticia`, `calendario`, `maleta`, `relogio`, `salvar`, `seguir`, `comentar`, `camera`, `check`, `casa`, `cafe`, `livro`, `alvo`, `silencio`, `link`, `alerta`, `pergunta`, `seta`, `setaBaixo`, `xis`, `sobe`. Todos a traço, genéricos (usados em `sem`, `etiquetas` e nos avisos do `gancho`).

## 4. A assinatura: `blocos` e `ciclos`

### `blocos`: blocos de agenda que caem

```json
{ "tipo": "blocos", "de": 30.0, "ate": 35.2, "agenda": "Aula gratuita",
  "blocos": [ { "categoria": "foco", "titulo": "O mercado", "em": 30.86 },
              { "categoria": "foco", "titulo": "Os riscos", "em": 31.47 },
              { "categoria": "foco", "titulo": "A escolha dos ativos", "em": 32.21 } ],
  "sem": { "texto": "Promessa de lucro", "icone": "sobe", "em": 33.83, "riscaEm": 34.68 } }
```

```json
{ "tipo": "blocos", "de": 3.2, "ate": 6.5,
  "blocos": [ { "categoria": "foco", "minutos": 25, "em": 3.55, "titulo": "Foco total" } ],
  "cronometro": { "em": 4.64, "ate": 6.3 },
  "sem": { "texto": "Celular", "icone": "celular", "em": 5.38, "riscaEm": 5.78 } }
```

- `blocos[]`: **1 a 4** por momento. Cada um: `categoria`, `titulo` (palavras faladas, até ~24 caracteres), `em` (a palavra que o nomeia: o bloco cai e o título acende na fala).
  - `categoria`: `foco` (tomate cheio, texto branco: o principal), `pausa` (verde-folha claro: leve, positivo, descanso), `longa` (verde-manjericão), `outro` (ardósia: neutro, compromisso).
  - `minutos` (opcional): a duração **dita**. Com ela, a altura é a duração, a régua mostra os horários e o bloco mostra "25 min · 09:00". Sem ela, o bloco é qualitativo: altura padrão, sem horário nem duração, e a régua mostra o número dele na sequência.
  - `inicio` (opcional): horário dito ("18:00"); a régua o mostra. Com `minutos`, os seguintes continuam dele.
  - `quando` (opcional): o que a régua mostra na altura do bloco sem horário ("Antes", "Depois", "1º"; até ~7 caracteres).
- `agenda` (opcional): o nome da agenda no cabeçalho a partir deste momento (o antigo rola para cima).
- `pessoa`: `"topo"` (moldura larga, padrão do primeiro) ou `"lado"` (moldura em pé); momentos `blocos` seguidos alternam sozinhos. Os blocos ficam sempre à esquerda da moldura. Um bloco grande sozinho vira o **bloco grande** (horário, título enorme e, com a moldura larga, o anel dentro).
- `cronometro` (só com `minutos`): o anel conta o último bloco do momento, acelerado, de `em` até `ate` (padrão: 0,15 s antes do fim). Com a moldura larga ele fica dentro do bloco (se o bloco for alto o bastante); com a moldura em pé, a moldura fica mais baixa e o anel entra embaixo da pessoa.
- `sem`: o que fica de fora: `texto` até ~18 caracteres, `icone`, `em` (entra) e `riscaEm` (o traço tomate atravessa; 0,3 s ou mais depois). Fica dentro do bloco grande, ou logo abaixo do último bloco.
- **A agenda acumula:** o que caiu num momento `blocos` continua nos seguintes (a escala se ajusta; agenda comprida demais rola para cima e os blocos antigos somem embaixo do cabeçalho), até a `frase` transformar tudo na linha do dia.

### `ciclos`: repetir o que está na agenda

```json
{ "tipo": "ciclos", "de": 9.84, "ate": 12.87, "itens": [ { "em": 9.94 }, { "em": 10.62 }, { "em": 11.29 }, { "em": 11.93 } ],
  "rotulo": "anos", "rotuloEm": 10.62, "contagem": false }
```

- Só depois de um momento `blocos`: o padrão (os blocos desde o último `ciclos`) se copia para baixo, um ciclo por item (**2 a 6**), em cascata, cada um na sua palavra. O primeiro item é o ciclo que já está lá.
- A pessoa vai para a moldura pequena do canto e o anel vira contador, embaixo dela: "2 de 4" → "4 ciclos". `rotulo` ("ciclos", "dias", "vezes", até ~10 caracteres) acende em `rotuloEm`.
- `contagem: false`: quando a fala não diz quantas vezes ("durante anos", "todo dia"), o contador não mostra número: os arcos acendem e o `rotulo` fica no centro.
- `final` (opcional): um bloco no fim do ciclo, com duração que pode esticar ("pausa longa de 15 a 30 minutos"): `categoria`, `titulo`, `em`, `minutos`, `minutosEm`, `maxMinutos`, `maxEm`; depois que a faixa fecha, o anel conta esse bloco (`cronometroEm`, `null` desliga).

## 5. Os outros tipos deste modelo

### `gancho`: pergunta, distrações e resposta

```json
{ "tipo": "gancho", "de": 0, "ate": 3.2, "pergunta": "Não consegue focar?",
  "distracoes": [ { "texto": "E-mail novo", "icone": "email", "em": 0.42 }, { "texto": "12 mensagens", "icone": "mensagem", "em": 0.68 } ],
  "resposta": "Técnica Pomodoro", "respostaRotulo": "Testa a", "varreEm": 1.43 }
```

A pergunta (até ~40 caracteres) se monta no cartão ao lado do peito enquanto avisos (até 4, texto até ~14 caracteres, ilustrativos, mas do assunto) se amontoam; em `varreEm` eles são varridos e a `resposta` (até ~22 caracteres; vira o nome da agenda) entra com o dia em miniatura. Sem `resposta`, o cartão fica só com a pergunta.

### `tarefas`: lista de afazeres marcada na fala

```json
{ "tipo": "tarefas", "de": 13.2, "ate": 16.5, "titulo": "Antes de dormir",
  "itens": [ { "texto": "Celular longe", "em": 13.45, "feitoEm": 14.0 }, { "texto": "Luz baixa", "em": 14.5, "feitoEm": 15.0 } ] }
```

A pessoa na moldura larga, à direita, e uma lista com caixinhas no quadro à esquerda: cada item entra na palavra e é marcado com ✓ tomate em `feitoEm` (opcional, 0,4 s ou mais depois). Até 4 itens de ~26 caracteres; `titulo` até ~24.

## 6. Como dividir a fala em momentos

Siga `references/adaptar.md` (o mapa editorial). Para este modelo:

| A fala traz… | Bloco |
|---|---|
| o tema, a promessa, a pergunta do começo | `abertura` (ou `gancho`, com resposta) |
| um número, preço, quantidade, porcentagem | `numero` |
| três motivos, erros, dicas, sinais | `topicos` |
| uma sequência, um processo, "primeiro… depois…" | `passos` |
| um plano, uma rotina, um programa, o que vem antes e depois, o que fica de fora | **`blocos`** |
| uma repetição ("todo dia", "a cada quatro", "durante anos") | **`ciclos`** |
| dois lados (A × B, antes × depois, errado × certo) | `comparacao` |
| números ditos em série, ou algo que sobe, cai, oscila | `grafico` |
| um termo explicado | `definicao` |
| uma palavra forte, um alerta | `destaque` |
| a moral, uma citação, "sem X" | `frase` (com `risco`) |
| uma pergunta para quem assiste | `pergunta` |
| a chamada final | `cta` |

- Momentos **encostados** (o `ate` de um = o `de` do próximo), com as fronteiras nos cortes (`cortesEm`) ou nas pausas entre frases; no vídeo completo, respiros só com a pessoa e a legenda entre eles também valem (até ~8 s).
- Um momento de 2 a 6 s; numa explicação longa, mais itens com `em` dentro dele. No vídeo completo, pelo menos um momento a cada ~10 s e pelo menos metade do vídeo com momento na tela (o `conferir.mjs` cobra pelo `modelo.json`).
- Varie: não repita o mesmo tipo três vezes seguidas; alterne tela cheia e folha.

## 7. Regras de tempo

- O primeiro momento começa em 0. O `ate` do último é o fim do vídeo (`duracao`).
- A troca começa 0,15 s antes do `de` e dura 0,6 s (a cortina, 0,5 s). Um `em` logo no começo do momento funciona, mas fica melhor a partir de `de` + 0,3.
- Um bloco leva 0,4 s para cair: entre dois itens do mesmo momento, deixe 0,3 s ou mais.
- Nada fica parado mais de ~2,5 s: num momento longo, mais itens com `em`, um `detalhe`, um `sem`, um `cronometro`, ou divida em dois.
- Cada `em` cai no começo de uma palavra de `work/palavras.json` (o `conferir.mjs` avisa quando não cai).

## 8. Legenda, correções e sons

A legenda é uma etiqueta branca de agenda na área segura de baixo (acima dos controles do player), centrada, com a palavra da vez sublinhada em tomate. Ela aparece **só nos trechos sem momento**. `"legenda": true` num momento mantém a legenda durante ele, mas só onde há lugar (em tela cheia, embaixo, com o cartão acima dela; na folha, no pé da moldura, menos na pequena do canto). `semLegenda` tira legenda de trechos extras.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Testa técnica": "Testa a técnica", "né": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. Vale para a legenda e para a busca das palavras dos títulos. Não edite `palavras` à mão (o `cortar.mjs` reescreve esse campo). Para ver as linhas de legenda: `node scripts/legendas.mjs`.

Sons (automáticos, tonais, discretos): um "toc" grave quando um bloco assenta (a nota muda com a categoria), notas que sobem a cada item, passo, dado, opção ou ciclo, um traço grave quando algo é riscado, duas notas quando o dia em miniatura acende, quando um número termina de contar, quando a linha do dia se conclui e quando o lembrete é salvo. `"sfx": false` desliga.

## 9. Exemplos completos

### Produtividade (o vídeo de exemplo do modelo)

Roteiro: "Não consegue focar? Testa a técnica Pomodoro. Vinte e cinco minutos de foco total, sem celular. Depois, cinco minutos de pausa. A cada quatro ciclos, uma pausa longa, de quinze a trinta minutos. Parece simples, e é exatamente por isso que funciona. Salva e testa hoje no seu trabalho."

```json
{
  "marca": { "nome": "Tiago", "area": "Produtividade" },
  "agenda": { "inicio": "09:00", "dia": "Hoje" },
  "momentos": [
    { "tipo": "gancho", "de": 0, "ate": 3.2, "pergunta": "Não consegue focar?",
      "distracoes": [ { "texto": "E-mail novo", "icone": "email", "em": 0.42 }, { "texto": "12 mensagens", "icone": "mensagem", "em": 0.68 },
                      { "texto": "Vídeo curto", "icone": "video", "em": 0.95 }, { "texto": "Notícias", "icone": "noticia", "em": 1.18 } ],
      "resposta": "Técnica Pomodoro", "respostaRotulo": "Testa a", "varreEm": 1.43 },
    { "tipo": "blocos", "de": 3.2, "ate": 6.5,
      "blocos": [ { "categoria": "foco", "minutos": 25, "em": 3.55, "titulo": "Foco total" } ],
      "cronometro": { "em": 4.64, "ate": 6.3 },
      "sem": { "texto": "Celular", "icone": "celular", "em": 5.38, "riscaEm": 5.78 } },
    { "tipo": "blocos", "de": 6.5, "ate": 8.73,
      "blocos": [ { "categoria": "pausa", "minutos": 5, "em": 6.98, "titulo": "Pausa" } ],
      "cronometro": { "em": 7.47, "ate": 8.6 } },
    { "tipo": "ciclos", "de": 8.73, "ate": 13.22, "itens": [ { "em": 9.06 }, { "em": 9.3 }, { "em": 9.52 }, { "em": 9.74 } ],
      "rotulo": "ciclos", "rotuloEm": 9.58,
      "final": { "categoria": "longa", "titulo": "Pausa longa", "em": 10.5, "minutos": 15, "minutosEm": 11.51, "maxMinutos": 30, "maxEm": 11.95 } },
    { "tipo": "frase", "de": 13.22, "ate": 16.55, "texto": "Parece simples. É exatamente por isso que funciona.", "destaque": "funciona" },
    { "tipo": "cta", "de": 16.55, "ate": 19.32, "texto": "Testa hoje no seu trabalho", "rotulo": "Lembrete", "icone": "salvar", "acaoEm": 16.7,
      "etiquetas": [ { "texto": "Hoje", "icone": "calendario", "em": 17.29 }, { "texto": "No trabalho", "icone": "maleta", "em": 17.97 } ] }
  ]
}
```

### Cripto (um assunto sem horário nenhum)

"O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

| Trecho | Bloco |
|---|---|
| "O Bitcoin rompeu os 83 mil dólares" | `numero` 83000, prefixo US$, widget ao lado do peito |
| "reacendeu a conversa" | `destaque` chave |
| "bull market, um ciclo de alta das criptomoedas" | `definicao` |
| "o mercado subindo não significa dinheiro no bolso" | `comparacao` Mercado: Subindo × No bolso: Não significa dinheiro |
| "para a maioria das pessoas" | `destaque` alerta |
| "tem gente que perde porque compra por impulso, escolhe…, assume…" | `topicos` com título "Tem gente que perde" |
| "como avaliar os projetos e pensar no seu posicionamento?" | `pergunta` |
| "gravei uma aula gratuita para te explicar" | `destaque` chave com `detalhe` |
| "como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro" | **`blocos`** sem `minutos`, `agenda: "Aula gratuita"`, `sem` "Promessa de lucro" |
| "você quer entender antes de decidir e correr o risco de perder…?" | `comparacao` contra, vencedor 0 |
| "Toca aqui em Saiba Mais e assiste essa aula agora" | `cta` link, etiquetas "Essa aula" e "Agora" |
