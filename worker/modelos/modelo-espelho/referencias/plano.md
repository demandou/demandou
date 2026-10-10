# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A linha do espelho e a moldura da pessoa
3. Os blocos universais (os 11 que todo modelo do pack tem)
4. Os blocos próprios do Espelho: `mapa` (a assinatura), `manchete` e a comparação com régua
5. Figuras e áreas do mapa
6. Regras de tempo
7. Legenda e correções
8. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Ana Lima", "area": "Finanças pessoais" },
  "sfx": true,
  "correcoes": { "bitcoim": "Bitcoin" }
}
```

- `marca`: aparece só no fechamento (`cta`), como assinatura na faixa de cima. `nome` vazio = sem assinatura. Nome longo vai em 2 linhas.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.
- `caixas` (opcional, raro): ajuste fino do enquadramento.
  - `"pessoa": { "queixo": 830 }`: o queixo em px no quadro (o número que o `cortar.mjs` imprime em "queixo em N px"), quando as guias mostram o traço do queixo ou do alto da cabeça longe do lugar certo.
  - `"pessoa": { "margem": 110 }`: px entre a linha do espelho e o alto da cabeça (padrão 80). Aumente para cabelo alto, coque ou chapéu.
  - `"pessoa": { "zoom": 1.4 }`: aproxima a pessoa na moldura de baixo (padrão automático, de 1 a 1,35).
  - `"cheio": { "zoom": 1.1 }`: a pessoa em tela cheia (só entre momentos com respiro).

## 2. A linha do espelho e a moldura da pessoa

O fio dourado do espelho divide a tela **na horizontal**. **Embaixo** fica sempre a pessoa, numa moldura larga ancorada na base do quadro; **em cima** fica o bloco do momento. A altura da linha sai do próprio bloco, sozinha:

| Bloco | Linha do espelho | Em cima |
|---|---|---|
| `abertura`, `manchete`, `frase`, `pergunta`, `destaque`, `definicao`, `numero` | alta: desce só o que o texto pede (430 a ~700 px) | o texto centrado, como capa de revista |
| `topicos`, `passos`, `comparacao`, `grafico` | média-baixa: 640 a 880 px, conforme a quantidade de coisas | o painel na largura toda, alinhado à esquerda |
| `mapa` | baixa (~800 a 880 px) | a figura de um lado, a coluna de textos do outro |
| `cta` | média (~620 a 900 px) | assinatura, chamada e botão |

- A moldura ocupa a **largura toda**, da linha até a base do quadro, com o rosto no centro, o alto da cabeça ~80 px abaixo da linha e o **queixo nunca abaixo de y 1500** (abaixo vem a interface do app).
- Em gravação muito fechada (selfie: a cabeça ocupa quase metade da altura), a moldura estreita e vira uma janela larga, centrada, com um aro dourado fino: a cabeça fica inteira. Nunca uma coluna estreita ao lado.
- Quando a linha muda de altura, a pessoa desliza junto (~0,7 s; a troca começa no corte mais próximo). Ao mesmo tempo, um fio dourado vertical atravessa a faixa de cima da esquerda para a direita: atrás dele já é a página nova, na frente ainda é a velha (nunca as duas no mesmo lugar).
- A comparação com régua (`escala`) fica com a linha em ~850 px e usa a própria linha como régua.
- Dois momentos colados com a linha na mesma altura trocam como uma porta de correr: a faixa de cima inteira corre para a esquerda e a nova entra pela direita.
- Um losango dourado corre na linha: no mapa, no eixo da figura (um fio tracejado desce do pé do desenho até ele); nos blocos de texto e no fechamento, sobre o eixo do rosto da pessoa.
- Entre dois momentos com respiro de mais de 0,3 s, a linha sobe e some e a pessoa volta para a tela cheia, com a legenda. O que estava em cima fica até a pessoa cobri-lo.

## 3. Os blocos universais

Campos comuns a todos: `tipo`, `de`, `ate` e `legenda?` (`true` = a legenda continua durante o momento). Todo campo `em`/`…Em` é o instante de uma palavra dita.

Todo texto de tela entra **palavra por palavra, no instante em que é dita**: um fio dourado atravessa a palavra e ela aparece atrás dele. Use as palavras da fala, na ordem em que são ditas; palavra que não foi dita (um texto resumido) entra logo depois da anterior. O texto é medido com a largura real da fonte: o corpo diminui e a linha quebra até o limite do bloco; se passar disso, o texto fica pequeno ou quebra demais. Os limites abaixo são o que fica bonito.

### `abertura` — capa de revista

```json
{ "tipo": "abertura", "de": 0, "ate": 3.48, "texto": "A pergunta que mais mudou a minha carreira", "destaque": "mudou a minha carreira" }
```

- `texto`: até ~45 caracteres (vira 1 a 3 linhas equilibradas, de 72 a 104 px).
- `destaque` (opcional): trecho **exato** do texto, em itálico dourado.
- `em` (opcional): quando o texto começa a ser dito, se o momento começa antes ("Olha, a pergunta…" com texto "A pergunta…").
- No começo do vídeo, o que é dito nos primeiros 0,6 s já aparece no primeiro quadro (a capa do Reels).

### `topicos` — lista sem ordem (2 a 5 itens)

```json
{ "tipo": "topicos", "de": 17.25, "ate": 24.1, "titulo": "Por que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 },
             { "texto": "Moeda sem critério", "em": 19.21, "detalhe": "só porque está subindo" },
             { "texto": "Risco que não entende", "em": 21.25 } ] }
```

- `titulo` (opcional): até ~40 caracteres (1 ou 2 linhas, 60 a 84 px), com um filete dourado embaixo.
- `itens`: 2 a 5. `texto` de 2 a 6 palavras (até ~30 caracteres, 1 ou 2 linhas, 44 a 80 px: quanto menos itens, maior). `detalhe` (opcional): até ~40 caracteres, em itálico dourado embaixo do item.
- Cada item entra no seu `em`; o losango dele (vazado desde o começo) se enche de ouro. O item da vez fica inteiro e os anteriores apagam um pouco.

### `passos` — sequência em ordem (2 a 5 itens)

```json
{ "tipo": "passos", "de": 28.0, "ate": 33.75, "titulo": "Aula gratuita: como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- Mesmos campos e limites de `topicos`. Os itens ganham círculos numerados (vazados no começo) e um fio dourado que desce de um círculo ao outro quando cada passo é dito.

### `numero` — um número que conta

```json
{ "tipo": "numero", "de": 0, "ate": 5.05, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número dito (83 mil → `83000`; 1,5 → `1.5` com `casas: 1`). Aparece em pt-BR (83.000; 1,5).
- `em`: a palavra do número; ele conta de 0 até `valor` em ~1,3 s, com o losango correndo na régua.
- `rotulo`: o que o número é, até ~40 caracteres (itálico embaixo da régua, 1 ou 2 linhas). `rotuloEm`: quando o rótulo é dito (padrão: `de`).
- `prefixo` ("US$", "R$") e `sufixo` ("%", "mil", "mi", "minutos", "anos"): menores, em dourado. "Mil"/"mi" podem ir no sufixo em vez de zeros (`"valor": 83, "sufixo": "mil"`).
- `ilustrativo: true`: mostra a etiqueta ILUSTRATIVO (só para um número aproximado que a pessoa deu como exemplo).

### `comparacao` — dois lados (forma universal)

```json
{ "tipo": "comparacao", "de": 15.19, "ate": 18.33, "titulo": "Consistência", "modo": "errado-certo",
  "lados": [ { "rotulo": "Não é", "texto": "Talento", "em": 16.23 }, { "rotulo": "É", "texto": "Agenda", "em": 17.6 } ],
  "vencedor": 1, "vencedorEm": 17.9 }
```

- `lados`: exatamente 2. O primeiro fica em cima, alinhado à esquerda; o segundo embaixo, alinhado à direita (o reflexo). `rotulo` em caixa alta (até ~20 caracteres); `texto` grande (até ~30 caracteres, 1 ou 2 linhas, 56 a 96 px); `em`: quando o lado começa a ser dito.
- `titulo` (opcional): o que se compara, em caixa alta no alto (até ~30 caracteres).
- `modo`: `contra` (padrão, × no meio), `antes-depois` ou `errado-certo` (↓ no meio). Em `errado-certo` o primeiro lado é o errado: é riscado em bordô e o segundo ganha o selo.
- `vencedor` (0 ou 1, opcional): o lado que ganha o selo (círculo e visto) em `vencedorEm` (padrão: ~0,9 s depois do segundo lado); o outro apaga.
- O lado que está sendo falado fica inteiro; o outro apaga um pouco.

### `grafico` — barras, linha ou pizza

Com números ditos (2 a 6 `dados`):

```json
{ "tipo": "grafico", "de": 11, "ate": 14, "forma": "barras", "titulo": "Volume por trimestre", "unidade": "mi",
  "dados": [ { "rotulo": "Janeiro", "valor": 1.5, "em": 11.3 }, { "rotulo": "Abril", "valor": 2.75, "em": 11.9 }, { "rotulo": "Julho", "valor": 4, "em": 12.5 } ] }
```

- `barras`: uma linha por dado, nome à esquerda, valor à direita e a faixa dourada crescendo no trilho quando o dado é dito (proporcional ao maior).
- `linha`: um losango por dado, ligados por um fio dourado que se desenha de um dado ao outro; valor em cima, rótulo embaixo (rótulos curtos: anos, meses).
- `pizza`: um anel com uma fatia por dado; a fatia da vez aparece em número grande no centro e a legenda fica ao lado. Os valores são partes de um todo (somam 100%, por exemplo).
- `unidade` (opcional): "%", "mi", "kg"… em caixa alta pequena ao lado dos valores.

Sem números ditos (uma tendência):

```json
{ "tipo": "grafico", "de": 14.93, "ate": 17.25, "forma": "linha", "tendencia": "sobe", "tendenciaEm": 15.48, "ilustrativo": true, "titulo": "Mesmo na alta, tem gente que perde" }
```

- `tendencia`: `sobe`, `cai` ou `oscila`. `forma: "linha"` (ou `pizza`) = uma curva dourada com o véu pontilhado embaixo; `forma: "barras"` = seis colunas que crescem uma depois da outra. `tendenciaEm`: quando ela começa a se desenhar (~1,8 s).
- `ilustrativo: true` é obrigatório (o `conferir` reprova sem): a etiqueta ILUSTRATIVO aparece no alto, à direita.
- `titulo` (opcional): até ~40 caracteres, 1 ou 2 linhas.

### `destaque` — uma frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: até ~30 caracteres (1 ou 2 linhas, 72 a 132 px), entre dois fios que se abrem do centro.
- `nivel`: `alerta` (bordô: risco, erro, perda) ou `chave` (itálico dourado: a ideia central); sem `nivel`, café.
- `detalhe` (opcional): até ~50 caracteres, em itálico embaixo, em `detalheEm`.

### `definicao` — um termo e o que ele significa

```json
{ "tipo": "definicao", "de": 5.05, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo`: até ~24 caracteres (72 a 112 px). `significado`: até ~45 caracteres, em itálico, embaixo do fio dourado que se abre quando ele é dito (como o reflexo do termo).

### `frase` — citação ou frase de efeito

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.9, "em": 33.83 }
```

- `texto`: até ~70 caracteres (1 a 3 linhas, itálico de 56 a 92 px), com aspas douradas em cima.
- `destaque` (opcional): trecho exato em dourado. `risco` (opcional): trecho exato que é riscado em bordô, palavra por palavra, a partir de `riscoEm` (logo depois de ser dito).
- `em` (opcional): quando o texto começa a ser dito.

### `pergunta` — pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres (1 a 3 linhas), com um "?" dourado grande em cima.
- `opcoes` (opcional): 2 a 4, cada uma até ~32 caracteres, com letra (A, B, C, D) num círculo que se enche de ouro quando a opção é dita.
- `em` (opcional): quando a pergunta começa a ser dita.

### `cta` — fechamento

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
```

- `texto`: a chamada com as palavras da fala, até ~60 caracteres (1 ou 2 linhas em itálico, 48 a 64 px).
- `icone`: `seguir` (padrão), `salvar`, `comentar` ou `link` — vira o botão desenhado a traço (SEGUIR, SALVAR, COMENTAR; no `link`, o `destaque` em caixa alta, ex.: SAIBA MAIS).
- `destaque` (opcional): trecho exato da chamada em dourado. O botão se desenha quando ele é dito (sem `destaque`, logo depois da última palavra). `iconeEm` (opcional) força esse tempo.
- A assinatura (`marca`) entra no alto. Se for o último momento, fica na tela até o fim do vídeo.

## 4. Os blocos próprios do Espelho

### `mapa` — a assinatura: uma figura com pontos numerados

Na faixa de cima, uma figura desenhada a traço fica de um lado, o maior possível, de pé na linha do espelho: ela se faz em ~1,3 s (a metade esquerda e o reflexo juntos, do centro para fora), as linhas de mapeamento e a linha dourada tracejada se desenham, e os círculos vazados das vagas aparecem ligados por um tracejado. Do outro lado, uma coluna: rótulo e título no alto; nota e legenda embaixo, junto da linha. Cada ponto **acende quando é dito**: o véu dourado pontilhado se abre, o círculo se enche com o número e o nome entra na legenda.

Qualquer assunto, com `pontos`:

```json
{ "tipo": "mapa", "de": 17.25, "ate": 24.1, "figura": "moeda", "lado": "esquerda", "titulo": "Por que perde",
  "pontos": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.21 }, { "texto": "Risco que não entende", "em": 21.25 } ] }
```

O rosto, com áreas anatômicas e efeitos (estética, pele):

```json
{ "tipo": "mapa", "de": 9.37, "ate": 16.74, "lado": "direita",
  "rotulo": "Preenchimento", "titulo": "Repõe volume", "nota": "com ácido hialurônico",
  "efeito": { "tipo": "volume", "em": 12.42 },
  "areas": [ { "area": "labios", "em": 13.41 }, { "area": "olheiras", "em": 14.49 }, { "area": "contorno", "em": 15.45 } ] }
```

- `figura`: veja a seção 5 (padrão: `rosto` se houver `areas` ou `efeito`, senão `espelho`).
- `lado`: de que lado fica o **desenho** (`esquerda` ou `direita`); os textos ficam do outro. Dois mapas seguidos? Um de cada lado (o reflexo).
- `pontos` (qualquer figura, inclusive o rosto): 2 a 5, cada um no `em` da palavra que o nomeia; `texto` até ~22 caracteres (quebra em 2 linhas na legenda, 44 a 58 px). A ordem da lista é a ordem dos números.
- `titulo`: até ~20 caracteres (1 ou 2 linhas, 66 a 90 px). Título mais longo encolhe a figura: reescreva mais curto.
- `rotulo` (opcional): o assunto em caixa alta, até ~22 caracteres.
- `nota` (opcional): frase em itálico, até ~32 caracteres. Com 4 ou 5 pontos, deixe a nota de fora.
- Só na figura `rosto`: `areas` (1 a 3, nomes anatômicos da seção 5; `texto` troca o nome da legenda) e `efeito` (`relaxar`: as fibras do músculo da testa se desenham em `inicioEm` e se esticam em `em`, as rugas alisam; `volume`: curvas de nível crescem nas maçãs e nos lábios em `em`).
- O momento leva ~1,3 s para a figura se desenhar: deixe pelo menos 3 s de mapa.

### `manchete` — a capa com extras

A `abertura` quebra o texto sozinha. Use `manchete` quando quiser escolher as linhas e os extras:

```json
{ "tipo": "manchete", "de": 0, "ate": 4.07, "linhas": ["Toxina botulínica", "≠ preenchimento"], "sub": "não são a mesma coisa", "simboloEm": 2.5 }
```

```json
{ "tipo": "manchete", "de": 23.89, "ate": 28.29, "abre": "Antes de qualquer procedimento,",
  "linhas": ["avaliação com um", "profissional habilitado"], "enfase": "profissional habilitado", "seloEm": 27.78 }
```

- `linhas`: 1 a 3, até ~20 caracteres cada, com as palavras na ordem em que são faladas. Corpo até 104 px.
- Símbolos `≠`, `×`, `→`, `+` e `=` numa linha viram traços dourados desenhados; entram com a palavra seguinte, ou em `simboloEm`.
- `enfase`: trecho exato em itálico dourado. `abre`: frase em itálico acima (até ~34 caracteres). `rotulo`: linha em caixa alta acima de tudo (2 ou 3 palavras). `sub`: linha em caixa alta embaixo (até ~30 caracteres). Use um extra por manchete.
- `seloEm`: um selo dourado (círculo com visto) se desenha no fim da última linha. Use para uma recomendação ou um "isso, sim", não para promessas.
- `em` (opcional): quando o título começa a ser dito.

### `comparacao` com régua — prazos e quantidades na mesma escala

A comparação universal (`lados`) com `escala`: a linha do espelho vira uma régua (0 à esquerda, tiques subindo da linha) e cada lado ganha um trilho com uma faixa dourada que cresce enquanto a pessoa fala o número:

```json
{ "tipo": "comparacao", "de": 16.74, "ate": 23.89, "titulo": "Duração do efeito",
  "escala": { "ate": 18, "passo": 3 },
  "lados": [
    { "rotulo": "Toxina", "texto": "4 a 6 meses", "em": 17.44, "areas": ["testa"],
      "faixa": { "de": 4, "ate": 6, "em": 18.6, "emFim": 19.32 } },
    { "rotulo": "Preenchimento", "texto": "6 meses", "em": 20.09,
      "faixa": { "de": 6, "ate": 18, "em": 21.95, "emFim": 23.38 },
      "textos": { "sobre": "em média", "fim": "1 ano e meio" } } ] }
```

- Com `escala`, `rotulo` é o nome do lado (até 16 caracteres; entra em foco, sublinhado em ouro, no `em`) e `texto` é o número sobre o começo da faixa (até ~12 caracteres: o número fica grande e o resto vira unidade em caixa alta, "4 a 6" + MESES).
- `escala.ate`: o maior valor da régua, na unidade que a pessoa usou; `passo`: um tique a cada quanto (padrão `ate/6`).
- `faixa`: `de`/`ate` na unidade da escala; cresce entre `em` (a palavra do primeiro número) e `emFim` (a do último).
- `textos` (opcional): `fim` sobre o fim da faixa, `sobre` em caixa alta na linha do nome (a ressalva: "em média"). Escreva os números como a pessoa disse ("1 ano e meio", não "18 meses").
- `areas` (opcional): um rostinho com essas áreas ao lado do número (só em estética).
- A forma antiga (`rotulo` do momento, `esquerda` e `direita`) continua funcionando.

## 5. Figuras e áreas do mapa

| `figura` | O desenho | Os pontos acendem (2 / 3 / 4 / 5 pontos) |
|---|---|---|
| `espelho` | espelho de mão oval com cabo | no vidro, de cima para baixo, e no cabo |
| `pessoa` | busto: cabeça, pescoço e ombros | cabeça, pescoço, ombros, peito |
| `moeda` | moeda com louro e losango, sobre uma pilha | nas laterais, no alto, embaixo e na pilha |
| `microfone` | microfone de estúdio no garfo, com haste e base | grade, anel, corpo, garfo, base |
| `coracao` | coração com contorno duplo e eixo tracejado | nos dois lobos, no meio e na ponta |
| `lampada` | lâmpada com filamento dourado e raios | no vidro, no filamento e na base |
| `ampulheta` | ampulheta com areia caindo | de cima para baixo, como a areia |
| `casa` | casa com janelas, porta e óculo | óculo, janelas, porta, chão |
| `planta` | planta num vaso, folhas espelhadas | do vaso para o broto (a planta cresce) |
| `livro` | livro aberto com fitilho dourado | nas duas páginas e no fitilho |
| `rosto` | rosto feminino de frente, cabelo preso | `areas` anatômicas; com `pontos`: testa, maçãs, lábios, olheiras, queixo |

Áreas do `rosto` (só com `areas`):

| `area` | Nome na legenda |
|---|---|
| `testa` | Testa |
| `glabela` | Entre as sobrancelhas |
| `pesDeGalinha` | Pés de galinha |
| `olheiras` | Olheiras |
| `macas` | Maçãs do rosto |
| `nariz` | Nariz |
| `bigodeChines` | Bigode chinês |
| `labios` | Lábios |
| `queixo` | Queixo |
| `contorno` | Contorno do rosto |

Áreas simétricas acendem dos dois lados ao mesmo tempo. Evite no mesmo mapa `nariz` com `olheiras` ou `queixo` com `labios` (os números ficam no mesmo lugar).

## 6. Regras de tempo

- `de`: o `em` da **primeira palavra da batida**, menos ~0,05 (nunca antes do `ate` do momento anterior). Se há um corte (`cortesEm`) até 0,15 s antes, use o corte: a troca esconde o pulo. Momento que começa muito antes da primeira palavra mostra a faixa de cima quase vazia enquanto a linha desliza.
- `ate`: o `de` do momento seguinte (momentos colados) ou o `em` da primeira palavra que o momento não cobre. O último momento, se termina a menos de 0,3 s do fim, fica até o último quadro.
- Item, ponto, lado, opção, dado, número: o `em` da palavra que o nomeia.
- Nada parado mais de ~2,5 s: um momento de mais de ~4 s precisa de itens entrando por dentro. Divida ou acrescente pontos/itens que a fala justifique.
- Duração mínima de um momento: ~1,5 s (a troca leva 0,7 s).
- Não repita o mesmo bloco três vezes seguidas.

## 7. Legenda e correções

A legenda é montada sozinha a partir de `palavras`, numa cápsula champanhe, e **some durante um momento** (o bloco já escreve o que é dito). Em tela cheia ela fica logo acima da interface do app; com a tela dividida, sobre a linha do espelho.

- `"legenda": true` num momento: a legenda continua durante ele (num mapa longo em que a fala vai além do que está escrito).
- `semLegenda`: faixas extras sem legenda (`[{ "de": 2.9, "ate": 5.4 }]`).
- `correcoes`: palavras que a transcrição errou, sem pontuação (`{ "bitcoim": "Bitcoin" }`); a chave pode ter várias palavras e `""` apaga a palavra. Não edite `palavras` à mão.

Para ver as linhas de legenda antes de renderizar: `node scripts/legendas.mjs`.

## 8. Exemplos completos

### Cripto (43 s, gravação de selfie)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 5.05, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "definicao", "de": 5.05, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "um ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.85, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "grafico", "de": 14.93, "ate": 17.25, "forma": "linha", "tendencia": "sobe", "tendenciaEm": 15.48, "ilustrativo": true, "titulo": "Mesmo na alta, tem gente que perde" },
    { "tipo": "mapa", "de": 17.25, "ate": 24.1, "figura": "moeda", "lado": "esquerda", "titulo": "Por que perde",
      "pontos": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.21 }, { "texto": "Risco que não entende", "em": 21.25 } ] },
    { "tipo": "pergunta", "de": 24.1, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "passos", "de": 28.0, "ate": 33.75, "titulo": "Aula gratuita: como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.9, "em": 33.83 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

### O exemplo do modelo (harmonização facial, 31 s)

```json
{
  "marca": { "nome": "Dr. Tiago Moura", "area": "Harmonização facial" },
  "momentos": [
    { "tipo": "manchete", "de": 0, "ate": 4.07, "linhas": ["Toxina botulínica", "≠ preenchimento"], "sub": "não são a mesma coisa", "simboloEm": 2.5 },
    { "tipo": "mapa", "de": 4.07, "ate": 9.37, "lado": "esquerda", "rotulo": "Toxina botulínica", "titulo": "Relaxa o músculo", "nota": "suaviza as rugas de expressão",
      "efeito": { "tipo": "relaxar", "em": 6.33, "inicioEm": 5.26 }, "areas": [ { "area": "testa", "em": 8.91 } ] },
    { "tipo": "mapa", "de": 9.37, "ate": 16.74, "lado": "direita", "rotulo": "Preenchimento", "titulo": "Repõe volume", "nota": "com ácido hialurônico",
      "efeito": { "tipo": "volume", "em": 12.42 }, "areas": [ { "area": "labios", "em": 13.41 }, { "area": "olheiras", "em": 14.49 }, { "area": "contorno", "em": 15.45 } ] },
    { "tipo": "comparacao", "de": 16.74, "ate": 23.89, "titulo": "Duração do efeito", "escala": { "ate": 18, "passo": 3 },
      "lados": [ { "rotulo": "Toxina", "texto": "4 a 6 meses", "em": 17.44, "areas": ["testa"], "faixa": { "de": 4, "ate": 6, "em": 18.6, "emFim": 19.32 } },
                 { "rotulo": "Preenchimento", "texto": "6 meses", "em": 20.09, "faixa": { "de": 6, "ate": 18, "em": 21.95, "emFim": 23.38 }, "textos": { "sobre": "em média", "fim": "1 ano e meio" } } ] },
    { "tipo": "manchete", "de": 23.89, "ate": 28.29, "abre": "Antes de qualquer procedimento,", "linhas": ["avaliação com um", "profissional habilitado"], "enfase": "profissional habilitado", "seloEm": 27.78 },
    { "tipo": "cta", "de": 28.29, "ate": 30.96, "texto": "Siga para mais dicas", "icone": "seguir", "iconeEm": 29.29 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```
