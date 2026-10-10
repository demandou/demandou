# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser, `progresso`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: arena em cima, pessoa embaixo
3. A assinatura: `versus`, `rodada`, `veredito`
4. Blocos do peito (`abertura`, `numero`, `destaque`, `frase`, `cta`)
5. Blocos de conteúdo (`topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta`)
6. Regras de tempo
7. Legenda, correções e sons
8. O exemplo completo (e a luta sem foto)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Cozinha" },
  "sfx": true,
  "progresso": true,
  "correcoes": {}
}
```

- `marca`: `nome` e `area` vão numa etiqueta escura embaixo da chamada final (`cta`), quando a chamada termina de entrar. `nome` vazio = sem etiqueta.
- `sfx`: `false` desliga os sons. `progresso`: `false` tira a barra vermelha e azul do topo.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão. (A `zona` não é usada: a pessoa fica sempre embaixo.)
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Não mexa à mão; se o plano for recriado, rode `node scripts/imagens.mjs --folha` para gravar de novo.

## 2. A gramática

A tela é **sempre dividida**: a **arena** em cima (y 128 a 908, abaixo da interface do app) e a **pessoa** embaixo, numa moldura larga de ponta a ponta (a partir de y 960), com uma costura vermelha e azul entre as duas. A pessoa nunca muda de lugar; o que muda é a arena.

| Lugar | Blocos | A arena |
|---|---|---|
| **A luta** | `versus`, `rodada`, `veredito` | o duelo inteiro: os dois lados, as barras, o placar, os perfis |
| **O peito** | `abertura`, `numero`, `destaque`, `frase`, `cta` | texto em tarjas no meio da arena (centro em y ~518); com `imagem`, a foto cobre a arena e o texto desce |
| **O conteúdo** | `topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta` | o bloco ocupa a arena de cima a baixo |

O template já faz sozinho:

- **Um duelo** é um `versus` e as `rodada` e o `veredito` que vêm depois dele (outros blocos podem ficar no meio). O placar do alto soma os pontos das rodadas e a linha que divide os cantos anda para o lado de quem tem a barra mais cheia.
- **Troca**: uma faixa vermelha, azul e âmbar cruza a arena na diagonal quando começa um bloco novo (menos nas rodadas e no veredito, que continuam a luta). Cada golpe (VS, rodada, ponto, placar, destaque) dá um soco de zoom de 7% na pessoa, e o vídeo alterna 100% e 106% a cada corte.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da Kanit e diminui o corpo até caber, sem cortar.
- **Último momento**: o `cta` final (ou o que termina colado no fim) fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases ou num valor de `cortesEm`.
- **A ordem da luta**: `versus` → `rodada`(s) → `veredito`. Abra com o `versus` (ou uma `abertura` curta antes dele) e feche com o `veredito` ou o `cta`.

## 3. A assinatura: a luta

### `versus`: a tela de luta

```json
{ "tipo": "versus", "de": 0, "ate": 2.45, "titulo": "Airfryer ou forno elétrico?", "tituloEm": 0.25,
  "lados": [ { "nome": "Airfryer", "em": 0.3, "imagem": { "id": "airfryer" } },
             { "nome": "Forno elétrico", "em": 0.94, "imagem": { "id": "forno" } } ] }
```

- `lados`: exatamente dois. `nome`: até ~16 caracteres. `em`: **o instante em que a pessoa diz o nome do lado**; o painel entra do canto (A pela esquerda, vermelho; B pela direita, azul-ciano) em 0,38 s. O **VS** bate 0,12 s depois de o segundo lado entrar.
- `imagem`: `{ "id", "foco"?, "efeito"? }`. **Sem `imagem`, o painel vira um cartão colorido com o nome gigante** (até 150 px, 3 linhas): é o que serve para "à vista × parcelar".
- `titulo` (opcional, até ~40 caracteres): a pergunta da luta numa placa no alto. `tituloEm` (padrão `de`).
- Duração: 1,5 a 3 s. O `ate` é o `de` da primeira `rodada`. Os dois lados e o VS precisam estar na tela por pelo menos 0,8 s.
- A **legenda some** durante o `versus` (o título e os nomes já dizem o que é falado).

### `rodada`: um critério, as barras, o ponto

```json
{ "tipo": "rodada", "de": 2.45, "ate": 9.42, "titulo": "Tempo", "icone": "tempo", "em": 2.5,
  "a": { "texto": "2 a 3 min", "em": 5.35, "forca": 0.92 },
  "b": { "texto": "10 min", "em": 7.7, "forca": 0.38 },
  "vencedor": 0, "vencedorEm": 8.78 }
```

- `titulo`: o critério, até ~14 caracteres (2 linhas): "Tempo", "Espaço", "Conta de luz". `em`: quando o critério é dito (o número da rodada, o ícone e o título saltam juntos; padrão `de`).
- `icone` (opcional): `tempo`, `espaco`, `energia`, `dinheiro`, `qualidade`, `saude`, `sabor`, `facilidade`, `seguranca` ou `pessoas`. Sem ícone, o círculo mostra o número da rodada. `numero`: força outro número (padrão: a ordem).
- `a` e `b` (um por lado; um lado sem fala fica de fora e a barra dele não sobe): `em` = **o instante em que a pessoa fala daquele lado**; a barra sobe em 0,5 s. `texto` (opcional, até ~24 caracteres, 2 linhas): o que ela disse do lado, numa placa embaixo da barra. `forca` (0 a 1, padrão: 0,92 para quem vence, 0,66 no empate, 0,38 para quem perde): quanto a barra enche. **É só visual**: quem vence enche mais; não é um número medido.
- `vencedor`: `0` (lado A), `1` (lado B) ou `"empate"`; sem `vencedor`, a rodada não pontua. `vencedorEm`: **o instante em que a pessoa dá o ponto** ("ponto pra airfryer"; pegue o `em` do nome); o **+1** carimba na barra do vencedor, o placar do alto bate e a outra barra vira cinza. Padrão: 0,8 s depois da última coisa que aconteceu na rodada.
- `imagem` (opcional), `imagemEm` e `imagemLado` (0, 1 ou omitido para o meio): uma imagem de apoio que bate grande por cima da barra e depois encolhe para uma medalha no alto da barra do lado dela (sem lado, fica grande no meio do círculo do ícone).
- A cada rodada nova, as barras esvaziam e recomeçam. O **placar do alto** (miniatura, nome e pontos) entra na primeira rodada.
- A **legenda continua aparecendo** na rodada (as barras só escrevem as palavras-chave). `legenda: false` esconde.
- **Duração:** do fim do que veio antes até o próximo `de`. Dentro dela, algo novo (barra, texto, ponto, imagem) a cada ≤ 3 s. Cada rodada precisa de pelo menos 2 s.

### `veredito`: o placar final e os perfis

```json
{ "tipo": "veredito", "de": 14.26, "ate": 18.28, "placarEm": 14.3,
  "perfis": [ { "texto": "Mora sozinho ou a dois", "em": 14.45, "lado": 0, "ladoEm": 15.85 },
              { "texto": "Família grande", "em": 16.5, "lado": 1, "ladoEm": 16.78 } ] }
```

- `placarEm` (padrão `de`): o placar final bate grande (cada lado na sua cor; quem lidera ganha um aro âmbar; empate, sem aro) com os dois nomes embaixo. O placar é a soma dos `vencedor` das rodadas do mesmo duelo.
- `perfis`: 1 a 4. `texto` (até ~28 caracteres, 3 linhas): **o perfil que a pessoa descreve** ("mora sozinho", "família grande", "quem tem pouco tempo"). `em`: quando ela o diz (o cartão nasce no centro). `lado`: 0 ou 1, o lado que serve a esse perfil. `ladoEm`: **quando ela diz qual lado serve** (o cartão desliza até a coluna do lado, 0,4 s; padrão: `em` + 0,55).
- `titulo` (opcional, até ~28 caracteres): troca o "Pra quem é cada um?".
- Com 3 ou 4 perfis, os cartões ficam em duas linhas por coluna (menores). Sem nenhum perfil dito, use o `destaque`/`frase` e deixe o `veredito` só com o placar (um perfil com o resumo da pessoa).
- **Duração:** o último cartão precisa estar no lado dele por **pelo menos 1,2 s** antes do fim do vídeo (ou do momento seguinte). Termine o `veredito` no fim da fala ou estenda até o `cta`.
- A **legenda some** durante o veredito (os cartões já mostram o que é dito).

## 4. Blocos do peito (abertura, numero, destaque, frase, cta)

Texto em tarjas, no meio da arena: cada linha numa placa escura, caixa alta, Kanit itálica 900; o trecho `destaque` (texto exato, como está em `texto`) ganha a tarja índigo. Os blocos que se montam na fala procuram cada palavra no que foi dito a partir do `em`: use as palavras da pessoa, na ordem em que ela diz.

### `abertura`: o gancho escrito

```json
{ "tipo": "abertura", "de": 0, "ate": 2.08, "texto": "O mel praticamente não estraga", "destaque": "não estraga", "em": 0 }
```

- Entra **inteiro em menos de 1 s** a partir do `em` (padrão: `de`), palavra por palavra, sem esperar a fala: é o gancho escrito. Com `em` 0, a primeira palavra já está no primeiro quadro.
- `texto`: 3 a 8 palavras (até ~45 caracteres), a promessa ou a curiosidade, com as palavras da fala. `destaque`: 1 a 3 palavras.
- Duração: 1,5 a 3 s. `imagem` (opcional): o gancho por cima de uma foto que cobre a arena (corte seco no começo).

### `numero`: um número que conta

```json
{ "tipo": "numero", "de": 6.8, "ate": 8.36, "valor": 3000, "em": 7.34, "prefixo": "+", "rotulo": "anos", "rotuloEm": 7.9 }
```

- A placa entra 0,25 s antes do `em` e o número conta de 0 até `valor` em 0,9 s a partir do `em`, em pt-BR (3.000; 1,5). `casas` para decimais. `prefixo`/`sufixo` curtos: `"R$ "`, `"US$ "`, `"+"`, `"%"`, `" mil"`, `" kg"`.
- `rotulo` (até ~30 caracteres) carimba numa tarja índigo embaixo no `rotuloEm` (padrão: `em` + 0,3).
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO (só quando o número não foi dito exatamente assim).
- `imagem` (opcional): o número por cima da foto que cobre a arena (vira um corte com número).

### `destaque`: palavra que bate forte

```json
{ "tipo": "destaque", "de": 16.45, "ate": 17.46, "texto": "não joga fora", "em": 16.48, "nivel": "alerta" }
```

- `texto`: 1 a 5 palavras (até ~30 caracteres); carimba no `em`. `nivel`: `chave` (índigo, padrão) ou `alerta` (âmbar, texto escuro: o problema, o "não faça").
- `detalhe` (opcional, até ~60 caracteres): placa escura menor embaixo, no `detalheEm` (padrão: `em` + 0,45).
- Duração: 0,8 a 2 s. `imagem` (opcional): por cima de uma foto que cobre a arena.

### `frase`: frase de efeito, conclusão, citação

```json
{ "tipo": "frase", "de": 0, "ate": 1.8, "texto": "Quem guarda mel não perde dinheiro", "destaque": "mel", "risco": "perde dinheiro", "riscoEm": 1.0 }
```

- `texto`: até ~70 caracteres (até 4 linhas). Palavra por palavra na fala a partir do `em` (padrão: `de`). Selo índigo de aspas no canto.
- `risco` (opcional): trecho riscado em índigo no `riscoEm` (padrão: quando é dito).

### `cta`: o fechamento

```json
{ "tipo": "cta", "de": 18.88, "ate": 20.68, "texto": "Manda pra quem joga mel fora", "destaque": "joga mel fora", "em": 18.95, "icone": "seguir" }
```

- `texto`: até ~50 caracteres, palavra por palavra na fala. `icone` (opcional): `salvar`, `seguir`, `comentar` ou `link`, num círculo índigo com anel pulsando. Sem ícone, só a chamada.
- Depois de montado, o bloco "respira" (nunca fica parado) e a etiqueta com `marca` entra embaixo. Fica até o último quadro.

## 5. Blocos de conteúdo (topicos, passos, comparacao, grafico, definicao, pergunta)

O conteúdo ocupa a arena (y 132 a 904). Título opcional em branco, caixa alta, 44–78 px, com um traço índigo acima; entra palavra por palavra na fala a partir do `de`.

### `topicos`: lista sem ordem (motivos, sinais, dicas)

```json
{ "tipo": "topicos", "de": 1.8, "ate": 3.6, "titulo": "Três sinais de mel puro",
  "itens": [ { "texto": "Cristaliza com o tempo", "em": 2.0, "imagem": { "id": "cristalizado" } },
             { "texto": "Não escorre como água", "em": 2.5, "detalhe": "fica em fio grosso" },
             { "texto": "Cheiro de flor", "em": 3.0 } ] }
```

- 2 a 5 itens; cada um até ~45 caracteres (até 2 linhas); `detalhe` até ~50. Cada cartão salta no seu `em`; o da vez fica índigo. `imagem` no item = foto redonda no lugar do marcador.
- O corpo é o maior que cabe (28–62 px) e a lista fica centrada na altura livre.

### `passos`: sequência em ordem

Mesmos campos de `topicos`. Cartões numerados; um traço índigo desce do 1 até o passo da vez.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 9.47, "ate": 13.03, "titulo": "O segredo é simples", "modo": "contra",
  "lados": [ { "rotulo": "Água", "texto": "quase nenhuma", "em": 10.82, "imagem": { "id": "agua" } },
             { "rotulo": "Açúcar", "texto": "muito", "em": 12.0, "imagem": { "id": "acucar" } } ] }
```

- `rotulo`: até ~14 caracteres (tarja). `texto`: até ~30 caracteres (2 linhas com foto, 4 sem). `imagem` por lado (opcional): foto em cima do cartão; se só um lado tem, o outro fica com a área escura.
- `modo`: `contra` (VS), `antes-depois` (seta), `errado-certo` (o primeiro lado é o errado: tarja âmbar e ✗; o segundo, verde e ✓).
- `vencedor` (0 ou 1) e `vencedorEm`: o vencedor ganha borda índigo e ✓; o outro fica cinza.
- Antes de cada lado ser dito, o lugar dele espera com um "?" tracejado.

### `grafico`

- `forma`: `barras`, `linha` ou `pizza`. `dados`: 2 a 6 números **ditos**, cada um com `rotulo` (até ~14 caracteres) e `em`. `unidade`: `"%"`, `"R$"`, `"US$"`, `"kg"`, `"mil t"`…
- Sem números: `tendencia` (`sobe`, `cai`, `oscila`), `tendenciaEm` e `ilustrativo: true`; a curva se desenha em 1,4 s com a etiqueta ILUSTRATIVO.

### `definicao`: termo explicado

```json
{ "tipo": "definicao", "de": 12.6, "ate": 14.4, "termo": "Higroscópico", "em": 12.8, "significado": "Que puxa a umidade do ar para dentro", "significadoEm": 13.3 }
```

- `termo`: até ~24 caracteres. `significado`: até ~110 caracteres, palavra por palavra na fala. `imagem` (opcional): foto redonda ao lado do termo.

### `pergunta`

- `texto`: até ~70 caracteres, palavra por palavra na fala a partir do `em`. `opcoes` (opcional): 2 a 4, cada uma até ~40 caracteres, no `em` em que é dita (enquete). Sem opções, um "?" índigo.

## 6. Regras de tempo

- **Cobertura**: pelo menos 70% do vídeo com algum momento; nenhum trecho só com legenda maior que 3,5 s; pelo menos um momento a cada 8 s; pelo menos 3 tipos diferentes (4 em vídeos com mais de 40 s). O `conferir.mjs` cobra.
- **Nada parado**: dentro de um momento, no máximo 4,5 s sem algo novo (lado, barra, ponto, perfil, item, palavra, número).
- **Ritmo do Versus**: o `versus` abre curto (1,5 a 3 s); cada `rodada` tem algo novo a cada ~2 s; o `veredito` fecha com o placar na tela por ≥ 1,2 s. Em vídeos longos, intercale `numero`, `destaque` ou `definicao` entre as rodadas.
- O primeiro momento começa em 0 (o gancho). O último termina no fim do vídeo.

## 7. Legenda, correções e sons

- **Legenda**: aparece nos trechos sem momento e na `rodada`; some nos outros blocos (eles já mostram o texto). `legenda: true` num momento a mantém; `false` na `rodada` a esconde. `semLegenda: [{ "de": 4.0, "ate": 5.2 }]` esconde num trecho. Fica sempre **abaixo do queixo** (y ~1540), em telas de até 3 palavras numa linha; a palavra falada ganha uma tarja âmbar. A transcrição quase não põe ponto entre frases curtas: ponha o ponto em `correcoes` (`"Ponto para Airfryer": "Ponto para Airfryer."`) para a legenda nunca juntar duas frases.
- `correcoes`: `{ "chat GPT": "ChatGPT" }` troca palavras na legenda.
- **Sons** (em `public/sfx`, bem abaixo da voz): `vs` no encontro dos lados, `rodada` na entrada de cada rodada, `ponto` no +1, `golpe` no placar final, `tique` em perfis, itens, dados e opções, `impacto` no gancho/número/destaque chave, `alerta` no destaque alerta, `pop` em comparação e frase, `fim` no `cta`. Dois sons a menos de 0,12 s viram um só.

## 8. O exemplo completo (airfryer × forno elétrico, 18,3 s)

Fala: "Airfryer ou forno elétrico? Rodada um, tempo. A airfryer esquenta em dois, três minutos. O forno leva uns dez. Ponto para a airfryer. Rodada dois, espaço. No forno cabe uma lasanha inteira. Ponto para o forno. Mora sozinho ou a dois? Airfryer. Família grande? Forno."

O plano completo deste exemplo está em `assets/template/src/plano.json` (4 momentos: `versus`, duas `rodada`, `veredito`; placar final 1 × 1, decidido pelos perfis). Os pedidos de imagem (`work/imagens.json`): `airfryer` ("air fryer"), `forno` ("toaster oven") e `lasanha` ("lasagna", imagem de apoio da rodada do espaço).

**A mesma luta sem foto** ("pagar à vista × parcelar"): é só tirar o `imagem` dos lados. Cada painel vira um cartão colorido com o nome gigante:

```json
{ "tipo": "versus", "de": 0, "ate": 2.6, "titulo": "À vista ou parcelado?",
  "lados": [ { "nome": "À vista", "em": 0.5 }, { "nome": "Parcelar", "em": 1.2 } ] },
{ "tipo": "rodada", "de": 2.6, "ate": 7.0, "titulo": "Desconto", "icone": "dinheiro", "em": 2.7,
  "a": { "texto": "até 10%", "em": 3.4 }, "b": { "texto": "sem desconto", "em": 4.6 }, "vencedor": 0, "vencedorEm": 5.4 },
{ "tipo": "veredito", "de": 7.0, "ate": 11.0, "perfis": [
  { "texto": "Tem a reserva guardada", "em": 7.4, "lado": 0, "ladoEm": 8.6 },
  { "texto": "Dinheiro curto no mês", "em": 9.2, "lado": 1, "ladoEm": 10.0 } ] }
```
