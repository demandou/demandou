# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática do carrossel (páginas da pessoa × páginas de conteúdo)
3. Os blocos (`momentos`): os 11 universais e os próprios do Carrossel
4. Os desenhos
5. Regras de tempo
6. Legenda e correções
7. Sons
8. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Finanças sem drama" },
  "sfx": true,
  "correcoes": { "para comer": "pra comer" }
}
```

- `marca`: `nome` e `area` aparecem no cabeçalho das páginas de conteúdo (avatar + nome + área, como o de um post) e na assinatura do fechamento (`cta`). `nome` vazio = cabeçalho só com o avatar e fechamento sem assinatura. Nome até ~16 caracteres, área até ~26 (encolhem se passar).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte.

## 2. A gramática do carrossel

É a cara do modelo. O vídeo é um trilho de **páginas** lado a lado; cada troca de página é um **deslize** da direita para a esquerda, como o dedo passando um carrossel. Os **pontinhos** (embaixo, sempre visíveis) mostram em que página estamos, e o **contador** ("3/7", no canto de cima) aparece a cada página nova e some sozinho. O tipo do momento decide a página:

| Página | Blocos | A pessoa |
|---|---|---|
| **Da pessoa** | `abertura`, `capa`, `numero`, `destaque`, `frase`, `pergunta`, `cta` e os trechos sem momento | ocupa a página inteira, rosto no centro; o bloco é um cartão (creme; petróleo no `destaque` de alerta) na altura do peito, abaixo do queixo |
| **De conteúdo** | `topicos`, `passos`, `lista`, `comparacao`, `troca`, `grafico`, `definicao` | sai pelo lado junto com a página dela; fica viva num avatar redondo no cabeçalho |
| **De conteúdo com cartão** | `calendario` | volta encolhida num cartão arredondado no alto da página, ao lado do título |

O template já cumpre (não precisa escrever nada):
- **Cada momento de conteúdo é uma página.** Momentos da pessoa colados (ou com trechos sem momento entre eles) viram uma página só: a pessoa fica e o cartão troca (um sai descendo; o próximo só entra depois, logo antes da primeira palavra dele: nunca dois cartões sobrepostos). Trecho sem momento é página da pessoa com legenda.
- **O deslize cai no corte**: se há um corte (`cortesEm`) a menos de 0,2 s da fronteira entre duas páginas, o deslize começa 0,2 s antes dele e o pulo some no movimento. Corte no meio de uma página da pessoa ganha uma troca seca de enquadramento (6%).
- **Nenhum quadro vazio**: a página que entra já traz o cabeçalho, o título e as vagas tracejadas (ou o esboço "a lápis") do que vai chegar; os textos entram na fala. O conteúdo chega um pouco depois da borda da página (paralaxe).
- **Capa no início**: o cartão da primeira página da pessoa já está montado no primeiro quadro (vira a miniatura do post) e o "arrasta →" aparece meio segundo antes do primeiro deslize.
- **Cartões que cabem**: o cartão da página da pessoa mede o próprio texto e encolhe para caber entre o queixo e os pontinhos, mesmo em gravação perto da câmera.
- **Último momento**: fica até o último quadro.

Cuidados seus:
- **Páginas encostadas**: o `ate` de uma = o `de` da próxima, na pausa entre as frases (de preferência num valor de `cortesEm`). Um buraco entre dois momentos vira uma página da pessoa só com legenda: ótimo com 2 s ou mais de fala; picotado se for menor.
- **A pessoa volta**: no máximo ~12 s seguidos de páginas de conteúdo; depois, uma página da pessoa (`destaque`, `frase`, `numero`, `pergunta`) devolve o rosto em tela cheia.
- **Duração**: página de conteúdo entre ~2,5 e ~6 s (menos que 1,8 s ninguém lê); cartão da pessoa a partir de ~1,5 s.

## 3. Os blocos (`momentos`)

Campos comuns a todos: `tipo`, `de`, `ate` e `legenda?` (true = a legenda continua durante o momento). Os 11 blocos universais têm os mesmos campos em todos os modelos do pack; os campos marcados "(Carrossel)" são extras opcionais deste modelo.

Palavras de títulos, nomes e frases entram **no instante em que são ditas** (o template procura cada palavra na fala, em ordem): use as palavras da pessoa, na ordem em que ela diz. Números escritos em algarismo ("3", "1") casam com a palavra falada ("três", "uma"). Palavra que não está na fala entra logo depois da anterior.

Os limites de texto abaixo são de leitura: o template mede tudo e encolhe o corpo até um mínimo legível; passou muito, fica pequeno no celular. Reescreva mais curto, como um editor faria num slide.

### `abertura` — página da pessoa (a capa)

```json
{ "tipo": "abertura", "de": 0, "ate": 1.62, "texto": "Sabe achar o Cruzeiro do Sul?", "destaque": "Cruzeiro do Sul" }
```

- `texto`: até ~40 caracteres (2 a 3 linhas). Um número no começo ("3 erros que…") vira o numeral coral grande ao lado.
- `destaque` (opcional): trecho exato do texto em coral.
- `em` (opcional): quando o texto começa a ser dito (padrão `de`).
- `subtitulo` (Carrossel, opcional): linha de apoio menor, até ~50 caracteres; o cartão cresce quando ela começa.
- `arrasta` (Carrossel): `false` tira o "arrasta →" (padrão: aparece quando é a primeira página).

### `topicos` — página de conteúdo: lista sem ordem

```json
{ "tipo": "topicos", "de": 17.25, "ate": 23.9, "titulo": "Perde porque",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73, "desenho": "carrinho" },
             { "texto": "Escolhe moeda sem critério", "em": 19.21, "desenho": "dado" },
             { "texto": "Assume risco que não entende", "em": 21.25, "desenho": "alerta" } ] }
```

- `itens`: 2 a 5. `texto` até ~30 caracteres (2 linhas); `em` = a primeira palavra do item. `detalhe` (opcional): segunda linha menor, até ~30 caracteres.
- `titulo` (opcional): até ~32 caracteres (2 linhas). `rotulo` (Carrossel, opcional): 1 a 3 palavras em caixa alta coral acima do título.
- `desenho` (ou `icone`, opcional, por item): um nome da seção 4. Sem desenho, o texto ocupa o cartão.
- Menos de ~1,2 s entre um item e o outro não dá para ler: junte itens ou deixe parte na legenda.

### `passos` — página de conteúdo: sequência em ordem

```json
{ "tipo": "passos", "de": 30.0, "ate": 33.7, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

Os mesmos campos de `topicos`. Os números ficam numa coluna à esquerda, ligados por uma linha que se completa quando o próximo passo é dito.

### `numero` — página da pessoa: o numeral que conta

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número dito, escrito como número (`83000`, `1.5`, `37.5`); o template formata em pt-BR (83.000; 1,5) e conta de 0 até ele a partir de `em` (a palavra do número). Antes disso o zero espera "a lápis".
- `rotulo`: o que é o número, até ~36 caracteres (2 linhas), acima do numeral. `rotuloEm` (opcional): quando o rótulo começa a ser dito.
- `prefixo` / `sufixo` (opcionais): "R$", "US$", "%", "mil", "kg", "estrelas" — menores, ao lado do numeral. `casas` (opcional): casas decimais.
- `ilustrativo: true`: etiqueta ILUSTRATIVO no cartão (só para número que não foi dito exatamente assim).
- `detalhe` (Carrossel, opcional): linha de apoio sob a régua, até ~36 caracteres.
- `arrasta` (Carrossel): como na `abertura`.

### `comparacao` — página de conteúdo "sai → entra" com dois lados

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77, "desenho": "grafico-sobe" },
             { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87, "desenho": "moeda" } ] }
```

- `lados`: exatamente 2, cada um com `rotulo` (caixa alta, até ~16 caracteres), `texto` (até ~24 caracteres, 2 linhas) e `em`. `desenho`/`icone` (Carrossel, opcional) por lado.
- `modo`: `contra` (× coral no meio; padrão), `antes-depois` (seta) ou `errado-certo` (seta, e o primeiro lado é riscado quando o segundo começa a ser dito).
- `vencedor` (0 ou 1, opcional): o lado que ganha recebe um selo coral com visto e o outro apaga; `vencedorEm` (opcional) = quando (padrão: 0,6 s depois do lado vencedor).
- `titulo` (opcional): linha de título no topo da página, até ~24 caracteres.

### `grafico` — página de conteúdo

Com números ditos:

```json
{ "tipo": "grafico", "de": 3, "ate": 6.5, "titulo": "Quanto sobra no fim do mês", "forma": "barras", "unidade": "R$",
  "dados": [ { "rotulo": "Janeiro", "valor": 1200, "em": 3.5 }, { "rotulo": "Fevereiro", "valor": 850.5, "em": 4.1 }, { "rotulo": "Março", "valor": 2300, "em": 4.6 } ] }
```

Sem números ditos (a forma mostra a ideia, nenhum número aparece):

```json
{ "tipo": "grafico", "de": 2.9, "ate": 6, "titulo": "Bitcoin", "forma": "linha", "tendencia": "sobe", "tendenciaEm": 3.2, "ilustrativo": true }
```

- `forma`: `barras` (a maior fica coral; o valor conta em cima de cada barra e o rótulo fica embaixo), `linha` (o traço anda de um ponto ao outro na palavra de cada dado; valor e rótulo embaixo de cada ponto, o último em coral) ou `pizza` (rosca que se completa fatia a fatia, com legenda).
- `dados`: 2 a 6 números **ditos**, cada um com `rotulo` (até ~14 caracteres), `valor` e `em`. Com um número só, use `numero`.
- `unidade` (opcional): moeda vai antes ("R$ 1.200"), o resto depois ("40%", "86,7 kg").
- `tendencia` (`sobe`, `cai`, `oscila`) com `ilustrativo: true`, quando a fala só diz que algo cresce, cai ou oscila. `tendenciaEm`: quando a curva começa a se desenhar. Com `forma: "barras"` a tendência vira barras subindo ou descendo.
- `titulo` (opcional): até ~32 caracteres (2 linhas). `rotulo` (Carrossel, opcional): caixa alta coral acima do título.

### `destaque` — página da pessoa: a palavra ou frase que bate forte

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: até ~36 caracteres (2 a 3 linhas grandes). `em`: a primeira palavra.
- `nivel`: `chave` (padrão; cartão creme, sublinhado coral na última linha) ou `alerta` (cartão petróleo com o sinal "!" coral, para risco, erro, problema).
- `detalhe` (opcional): linha menor embaixo, até ~40 caracteres; `detalheEm` = quando é dita.

### `definicao` — página de conteúdo: termo e significado

```json
{ "tipo": "definicao", "de": 2.89, "ate": 8.6, "titulo": "Reacendeu a conversa",
  "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo`: até ~24 caracteres (2 linhas enormes); `em` = quando é dito.
- `significado`: até ~70 caracteres (3 linhas no cartão); `significadoEm` = a primeira palavra dele.
- `titulo` (Carrossel, opcional): título curto no topo, com palavras faladas antes do termo (até ~28 caracteres). Sem ele, aparece "O que é".

### `frase` — página da pessoa: a frase que merece ficar

```json
{ "tipo": "frase", "de": 33.7, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "em": 33.83 }
```

- `texto`: até ~50 caracteres (3 linhas), fiel ao que foi dito (pode enxugar, não pode mudar o sentido). O cartão cresce linha a linha.
- `destaque` (opcional): trecho exato em coral. `risco` (opcional): trecho exato atravessado pelo risco coral, palavra por palavra, logo depois de cada uma aparecer; use quando a fala nega aquilo. `riscoEm` (opcional): não antes deste instante. Não use `risco` e `destaque` no mesmo trecho. (Nomes antigos que continuam valendo: `risca`, `enfase`.)
- `em` (opcional): quando o texto começa a ser dito.

### `pergunta` — página da pessoa: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres sem opções; com opções, até ~30 (a pergunta encurta e as opções carregam o resto).
- `opcoes` (opcional): 2 a 4, cada uma até ~28 caracteres, com o `em` da primeira palavra; chegam como as barras de uma enquete do app (nenhum voto é inventado).

### `cta` — página da pessoa: o fechamento

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais", "destaque": "Saiba Mais", "icone": "link",
  "detalhe": "e assiste essa aula agora", "toqueEm": 41.0 }
```

- `texto`: até ~24 caracteres (2 linhas). `destaque` (opcional): trecho em coral, sublinhado.
- `icone`: `seguir` (padrão; "Seguir" → "Seguindo"), `salvar` ("Salvar" → "Salvo"), `comentar` ("Comentar" → "Enviado") ou `link` ("Saiba mais" → "Abrindo"). (O nome antigo `acao` continua valendo, com `compartilhar` = "Enviar" → "Enviado".)
- `detalhe` (Carrossel, opcional): complemento menor, até ~50 caracteres.
- `toqueEm` (Carrossel, opcional): quando o botão é tocado — a palavra mais forte depois da chamada; padrão, 60% do momento.
- `em` (opcional): quando o texto começa a ser dito.

### `troca` — página de conteúdo, a ASSINATURA: "sai → entra"

```json
{ "tipo": "troca", "de": 3.21, "ate": 7.71,
  "sai": { "texto": "Suco de caixinha", "desenho": "suco-caixinha", "em": 3.54 },
  "riscaEm": 4.53,
  "entra": { "texto": "Fruta inteira", "desenho": "fruta", "em": 4.92 },
  "vantagens": [ { "em": 6.06, "texto": "tem fibra" }, { "em": 6.86, "texto": "mata a fome" } ] }
```

O item que sai está num cartão areia (o desenho já vem pronto com a página); na palavra de ligação ("pela", "por", "em vez de", "como") um risco coral atravessa o nome e o cartão apaga; uma seta coral aparece; o item que entra chega **deslizando da direita** num cartão petróleo, com o desenho se fazendo.

- `sai.texto` e `entra.texto`: até ~20 caracteres cada (2 linhas grandes); até ~40 ainda cabe, menor.
- `sai.em`: a primeira palavra do item que sai; `entra.em`: a palavra em que o novo começa a chegar.
- `riscaEm` (opcional): a palavra de ligação. **Sem `riscaEm`, a página vira "de → para"**: nada é riscado e a seta liga um ao outro (aparece 0,45 s antes de `entra.em`) — para "isto leva àquilo", "aponta para", "vira".
- `rotulo` (opcional): o título do topo; padrão "Troca 1", "Troca 2"… (um número no fim sai em coral). Para outro assunto, troque: "Agora", "Em vez de", "A direção" — até ~20 caracteres.
- `rotulos` (opcional): os rótulos em caixa alta dos dois cartões; padrão `["Sai", "Entra"]`. Ex.: `["Antes", "Depois"]`, `["Mito", "Verdade"]`, `["O braço", "Aponta para"]` (até ~16 caracteres).
- `entra.extra` (opcional): o complemento que chega depois ("com banana", "e o posicionamento"), até ~20 caracteres, em coral; `extra.em` = a primeira palavra dele. `extra.desenho` (opcional) pousa no desenho principal.
- `vantagens` (opcional): até 2 etiquetas com visto coral, até ~14 caracteres cada, que acendem quando são ditas. Só o que a pessoa falou.
- `desenho` (ou `icone`): um nome da seção 4; cada cartão sem desenho usa a largura toda para o texto.

### `calendario` — página de conteúdo com a pessoa num cartão

Para ritmo e constância: "uma por semana", "todo dia durante um mês", "um pouco por mês o ano inteiro", fases de um processo no tempo.

```json
{ "tipo": "calendario", "de": 15.52, "ate": 18.21, "titulo": "1 troca por semana", "destaque": "1 troca",
  "linhas": [ { "em": 16.1, "rotulo": "Semana 1", "desenho": "fruta" }, { "em": 16.36, "rotulo": "Semana 2", "desenho": "iogurte" },
              { "em": 16.62, "rotulo": "Semana 3", "desenho": "agua" }, { "em": 16.88, "rotulo": "Semana 4", "desenho": "mais" } ],
  "fechamento": { "em": 16.96, "texto": "muda o mês inteiro" } }
```

- `titulo`: até ~24 caracteres (3 linhas curtas ao lado do cartão da pessoa). `destaque`: trecho exato em coral.
- `linhas`: 2 a 5; `rotulo` até ~12 caracteres ("Semana 1", "Mês 3", "Fase 2"). As linhas se completam em sequência, a cada ~0,25–0,4 s, enquanto a frase é dita.
- `desenho` por linha (opcional); `mais` (um + tracejado) para "a próxima". `celulas`: quantas bolinhas por linha (padrão 7; de 4 a 10).
- `fechamento` (opcional): a conclusão sob o título, até ~26 caracteres, com sublinhado coral; o visto em onda começa 0,3 s depois.

### `lista` — página de conteúdo com itens numerados

Os mesmos campos de `topicos` (`titulo` opcional, `rotulo`, `itens` 2 a 5 com `detalhe` e `desenho`), com números nas vagas.

### `capa` — o nome antigo da abertura

`titulo`, `subtitulo`, `destaque`, `em`, `arrasta`: igual à `abertura` (com `titulo` no lugar de `texto`).

## 4. Os desenhos

Traço de uma espessura só, cantos redondos, cor chapada por baixo — parecem do mesmo ilustrador em todas as páginas. Use o nome exato em `desenho` (ou `icone`); nome que não existe fica sem desenho.

| Grupo | Nomes |
|---|---|
| Dinheiro e mercado | `moeda`, `cofrinho`, `cartao`, `carrinho`, `grafico-sobe`, `grafico-cai` |
| Sinais e ideias | `alerta`, `lupa`, `alvo`, `lampada`, `escudo`, `dado` (sorte, impulso), `mais` (um + para "o próximo") |
| Pessoas e casa | `pessoa`, `coracao`, `casa`, `balao` (conversa, comentário) |
| Tempo e rotina | `calendario`, `despertador`, `celular`, `livro`, `lista` |
| Céu e direção | `estrela`, `lua`, `constelacao` (pontos ligados: constelação, rede, conexão), `bussola` |
| Comida e bebida | `fruta`, `banana`, `limao`, `iogurte`, `suco-caixinha`, `biscoito`, `refrigerante`, `agua` (as bolhas sobem), `cafe`, `doce`, `pao`, `salada` |

Escolha o desenho pelo que o item **é**, não por associação distante. Se nada combina, deixe sem desenho: o cartão fica só com texto e continua bonito. Desenho novo: veja `references/estilo.md`.

## 5. Regras de tempo

- **Fronteiras de página na pausa entre frases**: o `de` de uma página = o `ate` da anterior = o valor de `cortesEm` entre as duas frases (ou, sem corte, o `em` da primeira palavra da página menos 0,1). O primeiro momento começa em 0; o `ate` do último é o fim do vídeo (`duracao`).
- **Sub-passos** (`em` dos itens, lados, dados e opções; `riscaEm`, `entra.em`, `extra.em`, `vantagens[].em`, `significadoEm`, `rotuloEm`, `detalheEm`, `toqueEm`…): o `em` da palavra em `work/palavras.json`. O template já adianta o movimento o suficiente para ele estar acontecendo quando a palavra soa. Nada aparece antes de ser dito.
- **Nada parado mais de ~2,5 s**: página de conteúdo longa precisa de itens entrando por dentro dela; se não tiver, encurte a página ou divida.
- Não repita o mesmo bloco três vezes seguidas, a não ser que a fala seja mesmo uma série (três trocas, por exemplo).

## 6. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez, numa etiqueta creme logo acima dos pontinhos, com a palavra da vez em coral. Ela **some durante um momento** (o cartão ou a página já mostram o que é dito) e aparece nos trechos sem momento — as páginas da pessoa "só com legenda". Dois ajustes:

- `"legenda": true` no momento: a legenda continua durante ele (o cartão sobe para não cobri-la). Evite em página de conteúdo: o conteúdo encolhe para liberar a faixa.
- `semLegenda`: faixas extras sem legenda: `"semLegenda": [ { "de": 2.9, "ate": 5.4 } ]`.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Jão": "João", "chat GPT": "ChatGPT", "né": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. Só corrija o que você tem certeza. Não edite `palavras` à mão — o `cortar.mjs` reescreve esse campo. Para ver as linhas de legenda: `node scripts/legendas.mjs`.

## 7. Sons

Automáticos, poucos e tonais: um "vum" grave a cada deslize (a nota sobe um degrau a cada página), duas notas curtas quando algo novo chega (o item novo da troca, o segundo lado, um item da lista, o significado, um dado, uma opção, o número), e um toque grave no `destaque` e no botão do fechamento. Nunca dois sons a menos de 0,45 s. `"sfx": false` desliga.

## 8. Exemplos completos

### Alimentação (o vídeo de exemplo do modelo)

Roteiro: "Três trocas simples pra comer melhor sem passar fome. Troca o suco de caixinha pela fruta inteira: tem fibra e mata a fome. Troca o biscoito recheado por iogurte natural com banana. E troca o refrigerante por água com gás e limão. Não precisa cortar tudo de uma vez. Uma troca por semana já muda o mês inteiro. Me segue pra mais trocas assim."

Cortes em 3,21 · 7,71 · 10,85 · 13,72 · 15,52 · 18,21. Sete páginas, cada fronteira num corte:

```json
{
  "marca": { "nome": "Tiago", "area": "Alimentação sem neura" },
  "correcoes": { "para comer": "pra comer" },
  "momentos": [
    { "tipo": "capa", "de": 0, "ate": 3.21, "titulo": "3 trocas simples", "subtitulo": "pra comer melhor sem passar fome" },
    { "tipo": "troca", "de": 3.21, "ate": 7.71,
      "sai": { "texto": "Suco de caixinha", "desenho": "suco-caixinha", "em": 3.54 }, "riscaEm": 4.53,
      "entra": { "texto": "Fruta inteira", "desenho": "fruta", "em": 4.92 },
      "vantagens": [ { "em": 6.06, "texto": "tem fibra" }, { "em": 6.86, "texto": "mata a fome" } ] },
    { "tipo": "troca", "de": 7.71, "ate": 10.85,
      "sai": { "texto": "Biscoito recheado", "desenho": "biscoito", "em": 8.02 }, "riscaEm": 9.06,
      "entra": { "texto": "Iogurte natural", "desenho": "iogurte", "em": 9.26,
                 "extra": { "texto": "com banana", "desenho": "banana", "em": 10.24 } } },
    { "tipo": "troca", "de": 10.85, "ate": 13.72,
      "sai": { "texto": "Refrigerante", "desenho": "refrigerante", "em": 11.24 }, "riscaEm": 12.11,
      "entra": { "texto": "Água com gás", "desenho": "agua", "em": 12.32,
                 "extra": { "texto": "e limão", "desenho": "limao", "em": 13.21 } } },
    { "tipo": "frase", "de": 13.72, "ate": 15.52, "texto": "Não precisa cortar tudo de uma vez", "risca": "tudo de uma vez" },
    { "tipo": "calendario", "de": 15.52, "ate": 18.21, "titulo": "1 troca por semana", "destaque": "1 troca",
      "linhas": [ { "em": 16.1, "rotulo": "Semana 1", "desenho": "fruta" }, { "em": 16.36, "rotulo": "Semana 2", "desenho": "iogurte" },
                  { "em": 16.62, "rotulo": "Semana 3", "desenho": "agua" }, { "em": 16.88, "rotulo": "Semana 4", "desenho": "mais" } ],
      "fechamento": { "em": 16.96, "texto": "muda o mês inteiro" } },
    { "tipo": "cta", "de": 18.21, "ate": 20.52, "texto": "Me segue", "detalhe": "pra mais trocas assim", "acao": "seguir", "toqueEm": 19.13 }
  ]
}
```

### Cripto (outro assunto, o mesmo estilo; uma tomada só, sem cortes)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

Nove páginas, 12 momentos, 10 tipos:

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "definicao", "de": 2.89, "ate": 8.6, "titulo": "Reacendeu a conversa", "termo": "Bull market", "em": 5.3,
      "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77, "desenho": "grafico-sobe" },
                 { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87, "desenho": "moeda" } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "frase", "de": 14.93, "ate": 17.25, "texto": "Mesmo na alta, tem gente que perde", "destaque": "perde", "em": 14.93 },
    { "tipo": "topicos", "de": 17.25, "ate": 23.9, "titulo": "Perde porque",
      "itens": [ { "texto": "Compra por impulso", "em": 17.73, "desenho": "carrinho" },
                 { "texto": "Escolhe moeda sem critério", "em": 19.21, "desenho": "dado" },
                 { "texto": "Assume risco que não entende", "em": 21.25, "desenho": "alerta" } ] },
    { "tipo": "troca", "de": 23.9, "ate": 28.03, "rotulo": "Agora",
      "sai": { "texto": "Compra por impulso", "em": 24.21, "desenho": "carrinho" }, "riscaEm": 24.58,
      "entra": { "texto": "Avaliar os projetos", "em": 24.95, "desenho": "lupa", "extra": { "texto": "e o posicionamento", "em": 26.41 } } },
    { "tipo": "destaque", "de": 28.03, "ate": 30.0, "texto": "Aula gratuita", "em": 28.62, "nivel": "chave", "detalhe": "para te explicar", "detalheEm": 29.27 },
    { "tipo": "passos", "de": 30.0, "ate": 33.7, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86, "desenho": "grafico-sobe" }, { "texto": "Os riscos", "em": 31.47, "desenho": "alerta" },
                 { "texto": "A escolha dos ativos", "em": 32.21, "desenho": "alvo" } ] },
    { "tipo": "frase", "de": 33.7, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "em": 33.83 },
    { "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.067, "texto": "Toca em Saiba Mais", "destaque": "Saiba Mais", "icone": "link",
      "detalhe": "e assiste essa aula agora", "em": 40.05, "toqueEm": 41.0 }
  ]
}
```

A `troca` "Compra por impulso → Avaliar os projetos" é a assinatura usada como leitura editorial da pergunta "como avaliar os projetos?" logo depois dos motivos de perda: diga isso na entrega.
