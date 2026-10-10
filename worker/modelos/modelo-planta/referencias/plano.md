# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` / `…Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. Layouts: onde a pessoa fica
3. Regras de tempo e de texto
4. Os 11 blocos universais
5. A assinatura: `planta` (e `medida`, `antesDepois`, `titulo`)
6. O desenho técnico em centímetros (planta, elevação, biblioteca)
7. Legenda e correções
8. Exemplo completo (vídeo sobre cripto)
9. Exemplo do desenho técnico (o demo de arquitetura)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Ana Ribeiro", "area": "Design de interiores" },
  "sfx": true,
  "correcoes": { "Jão": "João" }
}
```

- `marca`: aparece só no fechamento (`cta`), como o carimbo de uma prancha (células AUTOR e ÁREA). `nome` vazio = sem assinatura.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`, `palavras`: calculados pelo `cortar.mjs`. Não mexa à mão.
- `caixas` (opcional, raro): ajuste fino do enquadramento da pessoa em cada layout, por exemplo `"caixas": { "cheia": { "zoom": 1.4, "ancoraY": 0.45 } }`. Sem `caixas`, o zoom de cada caixa sai da largura do rosto medida pelo `cortar.mjs` (funciona com gravação aberta ou bem perto da câmera). `zoom` menor mostra mais (nunca abaixo de 1); `ancoraY` é a altura do rosto dentro da caixa (0 = topo, 1 = base).

## 2. Layouts: onde a pessoa fica

A pessoa mudar de lugar para abrir espaço para a prancha é parte do estilo. Cada momento tem um layout: o padrão do bloco (tabela da seção 4) ou o que você escrever em `"layout"`.

| Layout | A pessoa | A prancha | Bom para |
|---|---|---|---|
| `cheio` | tela cheia, rosto no centro | um cartão de papel na altura do peito | abertura, número, destaque, frase, pergunta, fechamento |
| `dividida` | faixa larga na parte de cima (1008 × 640 px) | sobe por baixo junto com a borda do vídeo; ~1000 × 700 px úteis (cabeçalho + corpo) | tópicos, passos, comparação, gráfico, definição, planta |
| `cheia` | janelinha no canto de cima à direita (336 × 424 px) | ocupa a tela; o título fica ao lado da janela e o corpo embaixo dela (~1000 × 890 px) | o trecho mais rico: a planta, um gráfico, a definição, um passo a passo longo |

- Entre dois momentos com respiro de mais de 0,3 s, a pessoa volta para a tela cheia. Momentos colados passam direto de um layout para o outro.
- A troca de layout começa no corte mais próximo (o movimento esconde o pulo do corte) e leva 0,6 s. Em tela cheia o zoom alterna entre 1 e 1,08 nos cortes, com troca seca. Não precisa escrever nada.
- **Trocas sem quadro vazio:** de tela cheia para a prancha, a folha já está montada por baixo e a pessoa encolhe revelando-a; da prancha para a tela cheia, a pessoa cresce por cima da folha e o cartão seguinte só desenrola depois; de uma folha para outra, a régua paralela desce pela tela trocando a folha. Você não faz nada: é o template.
- Use pelo menos dois layouts de prancha num vídeo de 30–60 s e não repita o mesmo layout de prancha três vezes seguidas. `cheia` é o clímax: uma ou duas vezes. Na `cheia`, dê `titulo` aos blocos que aceitam (o título fica ao lado da janela; sem ele, aquele canto fica vazio).
- `lateral` (pessoa numa coluna estreita à esquerda) existe só para planos antigos. **Não use**: no celular, a coluna come o rosto de quem se mexe. Para desenhos altos, use a `cheia`.
- Um bloco de prancha com `"layout": "cheio"` vira uma folha pequena no peito: evite.

## 3. Regras de tempo e de texto

**Tempo**
- `de`: o `em` da primeira palavra que o momento cobre (a primeira da frase: "Mas", "Segundo", "Agora"), menos 0,05 (nunca menor que 0 nem antes do `ate` do anterior).
- `ate`: o `em` da **primeira palavra que o momento não cobre**, ou o fim do vídeo. O último momento, se for o `cta` ou terminar a menos de 0,3 s do fim, fica até o último quadro.
- Duração mínima: ~1,5 s (o cartão leva 0,5 s para desenrolar; a pessoa, 0,6 s para mudar de lugar).
- **Nada parado:** dentro de um momento, algo novo a cada 1,5–2,5 s (uma palavra do título, um item, um cômodo, um número contando, uma cota). Momento com mais de ~4 s precisa de itens entrando por dentro dele. Se a fala não tem mais o que mostrar, encurte o momento e comece outro.
- Cada item, cômodo, lado, dado ou opção: `em` = o `em` da palavra que o nomeia. Nada aparece antes de ser dito (o que vai ser dito fica só esboçado a lápis).
- `em` em `abertura`, `frase`, `pergunta` e `cta`: o instante em que o TEXTO começa a ser dito (padrão: `de`). Use quando o momento começa antes da primeira palavra do texto ("Agora, como…" com texto "Como…").

**Texto**
- Use as palavras da própria fala, resumidas se precisar ("compra por impulso" → "Impulso"), sem mudar o sentido.
- Todo texto é medido e reduzido até um mínimo legível; passou do limite abaixo, fica pequeno ou quebra em mais linhas. Encurte em vez de forçar.
- Os textos que se montam palavra por palavra (abertura, frase, pergunta, destaque, cta, títulos de prancha, significado da definição, lados da comparação) acendem cada palavra quando ela é dita: escreva-os **na ordem da fala** sempre que der.

## 4. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate`, `legenda?` (true = a legenda continua durante o momento) e `layout?`.

| `tipo` | Layout padrão | Limites |
|---|---|---|
| `abertura` | `cheio` | `texto` até ~60 caracteres (até 3 linhas); `rotulo` até ~24 |
| `topicos` | `dividida` | 2 a 5 itens; `texto` até ~32, `detalhe` até ~40; `titulo` até ~40 (`cheia`: ~24) |
| `passos` | `dividida` | 2 a 5 itens; `texto` até ~32, `detalhe` até ~40; `titulo` até ~40 (`cheia`: ~24) |
| `numero` | `cheio` | `rotulo` até ~28; `prefixo`/`sufixo` curtos ("US$", "R$", "%", "mil", "kg") |
| `comparacao` | `dividida` | `rotulo` até ~16; `texto` até ~40 cada lado |
| `grafico` | `dividida` | `dados` 2 a 6, `rotulo` até ~14; `unidade` curta |
| `destaque` | `cheio` | `texto` até ~30 (até 2 linhas); `detalhe` até ~40 |
| `definicao` | `dividida` | `termo` até ~20; `significado` até ~60 |
| `frase` | `cheio` | `texto` até ~70 |
| `pergunta` | `cheio` | `texto` até ~60; `opcoes` 2 a 4, até ~24 cada |
| `cta` | `cheio` | `texto` até ~36; `detalhe` até ~24 |

### `abertura`: carimbo de prancha no peito

```json
{ "tipo": "abertura", "de": 0, "ate": 3.2, "texto": "Seu cliente pergunta o preço no Direct e some", "destaque": "some", "rotulo": "Vendas no Direct" }
```

- O cartão desenrola na altura do peito; cada palavra entra quando é dita; uma cota se desenha embaixo.
- `destaque` (opcional): trecho exato em terracota (mais pesado). Fica numa linha só.
- `rotulo` (opcional, deste modelo): o tema em 2–3 palavras, em caixa alta técnica, acima do texto.
- `cota` (opcional, deste modelo): `{ "texto": "sala", "em": 3.07, "efeito": "encolhe" }` — texto curto sobre a cota; `efeito` `"encolhe"` (menor, apertado) ou `"cresce"` (maior, amplo) na palavra que diz isso.
- `em` (opcional): quando o texto começa a ser dito.
- No começo do vídeo, o cartão já está aberto no primeiro quadro (a capa do Reels não fica vazia).

### `topicos`: as notas da folha

```json
{ "tipo": "topicos", "de": 3.2, "ate": 6.9, "titulo": "Para de responder",
  "itens": [ { "texto": "Só com o valor", "em": 4.08, "detalhe": "resposta seca" },
             { "texto": "Sem perguntar", "em": 4.95 } ] }
```

- Para 2 a 5 coisas **sem ordem** (motivos, erros, dicas, sinais).
- Cada item é uma linha com um marcador quadrado; o marcador acende em terracota quando o item é dito, o anterior volta ao grafite e um nível ▷ anda até a linha da vez. Antes de serem ditos, marcador e régua estão a lápis.
- `titulo` (opcional): vira o cabeçalho da folha (a lápis, passado a nanquim na fala). `subtitulo` (opcional, deste modelo): complemento do título, menor, também com palavras da fala. `numero` (opcional): "01", "02"… num círculo, quando a fala numera.
- `detalhe` (opcional): uma linha menor, em cinza, logo depois do item.

### `passos`: o percurso

```json
{ "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 },
             { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- Para 2 a 5 itens **em ordem** (sequência, processo, caminho, como fazer).
- Círculos numerados numa coluna, ligados pela circulação tracejada em terracota: a cada passo dito, a circulação chega no círculo dele (com a seta) e o número acende.
- `icone` (opcional, por item): um objeto da biblioteca (seção 6) ou uma ferramenta: `trena`, `nivel`, `lapis`, `rolo`, `lampada`, `tomada`, `esquadro`, `check`. Nome desconhecido vira um marcador neutro.
- `detalhe`, `titulo`, `subtitulo`, `numero`: como em `topicos`.

### `numero`: a cota que conta

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "em": 1.34 }
```

- O cartão traz o `rotulo` em caixa alta técnica (entra em `rotuloEm`, padrão: logo no começo), o número a lápis em zero e uma cota embaixo. Em `em`, o número passa a nanquim e conta até `valor` (1,2 s) enquanto a cota cresce.
- Formato pt-BR (83.000; 1,5). `casas`: casas decimais (padrão: 0 para inteiros, 1 para quebrados).
- `prefixo` / `sufixo`: menores, em terracota ("R$", "US$" / "%", "mil", "mi", "kg", "dias").
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO. Só número dito; hipótese não vira número.

### `comparacao`: duas vistas

```json
{ "tipo": "comparacao", "de": 35.23, "ate": 40.05, "titulo": "Você quer…", "modo": "contra",
  "lados": [ { "rotulo": "Entender", "texto": "Antes de decidir", "em": 35.93 },
             { "rotulo": "Correr o risco", "texto": "De perder o patrimônio", "em": 37.98 } ],
  "vencedor": 0, "vencedorEm": 39.31 }
```

- Duas molduras (vistas) que se desenham quando o lado é dito, com o `rotulo` em caixa alta e o `texto` palavra por palavra. Na `dividida`, lado a lado; na `cheia`, uma sobre a outra.
- `modo`: `"contra"` (× entre as vistas, padrão), `"antes-depois"` (a seta da circulação; o antes recua para o cinza quando o depois é dito), `"errado-certo"` (× no errado, ✓ no certo; o errado é riscado quando o certo é dito). Em `errado-certo`, o lado 0 é o errado.
- `vencedor` (0 ou 1) e `vencedorEm`: o outro lado é riscado em terracota e recua; a moldura do vencedor acende.
- `titulo` (opcional): o cabeçalho da folha.

### `grafico`: a elevação

```json
{ "tipo": "grafico", "de": 6.92, "ate": 9.97, "titulo": "Conversão", "forma": "barras", "unidade": "%",
  "dados": [ { "rotulo": "Só preço", "valor": 4, "em": 7.59 }, { "rotulo": "Com pergunta", "valor": 12.5, "em": 8.43 } ] }
```

- `forma`: `"barras"` (prédios que sobem do chão hachurado, com um nível ▽ e o valor contando no topo), `"linha"` (corte de terreno que se desenha ponto a ponto, com hachura por baixo), `"pizza"` (planta circular dividida, com números de chamada e a legenda ao lado).
- `dados`: 2 a 6 números **ditos**, cada um no seu `em`. O dado da vez fica em terracota. `unidade` curta ("%", "mil", "kg") vai junto do valor; mais longa, só no alto do gráfico.
- **Sem números ditos:** deixe `dados` de fora e use `"tendencia": "sobe" | "cai" | "oscila"` com `"ilustrativo": true` e `tendenciaEm` (a palavra que diz a tendência). `linha` vira uma escada que sobe ou desce (com a seta e o SOBE/DESCE das plantas); `barras` vira prédios crescendo ou diminuindo; `oscila` vira um terreno ondulado. A etiqueta ILUSTRATIVO aparece.

### `destaque`: a palavra que bate

```json
{ "tipo": "destaque", "de": 13.4, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- Cartão no peito com a frase curta grande, palavra por palavra.
- `nivel`: `"alerta"` (risco, erro, problema) = texto em terracota sobre uma área hachurada que cresce e um ×; `"chave"` (padrão) = uma cota em terracota que mede a frase.
- `detalhe` (opcional) + `detalheEm`: uma linha menor em cinza, embaixo.

### `definicao`: o termo e a chamada

```json
{ "tipo": "definicao", "de": 4.68, "ate": 8.67, "termo": "Bull market", "em": 5.3,
  "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- O termo grande, a lápis desde o começo, com uma cota em cima; passa a nanquim em `em`. Em `significadoEm`, a linha de chamada desce em terracota e o significado é escrito palavra por palavra.
- Na `cheia`, o termo fica ao lado da janela da pessoa e o significado embaixo.

### `frase`: a frase de efeito

```json
{ "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68 }
```

- Cartão no peito, palavra por palavra. `destaque` (opcional): trecho em terracota. `risco` (opcional) + `riscoEm`: o trecho é riscado em terracota, palavra por palavra, e recua para o cinza (padrão: logo depois da última palavra).

### `pergunta`: a chamada com "?"

```json
{ "tipo": "pergunta", "de": 17.17, "ate": 18.73, "texto": "Conversa vira venda?",
  "opcoes": [ { "texto": "Sim, sempre", "em": 17.63 }, { "texto": "Depende da conversa", "em": 17.96 } ] }
```

- Cartão com "?" num círculo de chamada e a pergunta palavra por palavra. `opcoes` (opcional, 2 a 4): etiquetas com filete que entram cada uma no seu `em`; a da vez fica em terracota.

### `cta`: o carimbo de fechamento

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste à aula", "destaque": "Saiba Mais", "icone": "link" }
```

- `icone`: `"seguir"` (padrão), `"salvar"`, `"comentar"` ou `"link"`. `destaque`: trecho em terracota (fica numa linha só). `detalhe` (opcional, deste modelo): complemento curto em cinza. Embaixo, as células AUTOR e ÁREA vêm de `marca`.
- Se for o último momento, fica até o fim do vídeo.

## 5. A assinatura: `planta`

A planta baixa que se desenha na fala é o que dá a cara do modelo. Entra **pelo menos uma vez** em todo vídeo (o `conferir.mjs` exige). Dois modos:

### Planta livre (qualquer assunto): `comodos`

```json
{ "tipo": "planta", "de": 14.93, "ate": 24.21, "layout": "cheia", "titulo": "Tem gente que perde",
  "comodos": [
    { "texto": "Na alta", "em": 15.32 },
    { "texto": "Compra por impulso", "em": 17.73, "alerta": true },
    { "texto": "Moeda sem critério", "em": 19.21, "alerta": true },
    { "texto": "Risco que não entende", "em": 21.25, "alerta": true } ],
  "percurso": { "bloqueado": true, "bloqueioEm": 22.86 } }
```

- A planta já se desenha quando a prancha entra (paredes em poché, portas, os números 01, 02… a lápis em cada cômodo). Cada cômodo recebe o seu texto quando ele é dito; a porta dele abre e a circulação tracejada em terracota anda até ele, entrando pela porta da rua.
- `comodos`: **2 a 5** (até 6, apertado), em ordem de percurso; `texto` até ~24 caracteres, `detalhe` (opcional) até ~16. Os cômodos se arrumam sozinhos em fileiras (2 lado a lado; 3 = 2 + 1; 4 = 2 + 2; 5 = 3 + 2); a circulação percorre em serpentina.
- `alerta: true`: o cômodo é um problema; ganha a área hachurada em terracota e o texto em terracota quando é dito.
- `percurso` (opcional): `{ "bloqueado": true, "bloqueioEm": <s> }` termina a circulação num × no último cômodo (o caminho trava, "poucos chegam"); sem `bloqueado`, termina numa seta (o caminho completo).
- `titulo` (com as palavras da fala), `subtitulo`, `numero`: o cabeçalho da prancha. Na `cheia`, o título fica ao lado da janela (~24 caracteres) e a planta ocupa a folha embaixo; na `dividida`, título em cima (~45 caracteres) e a planta embaixo.
- A planta livre é um esquema: leva "SEM ESCALA" no canto e nenhuma medida.
- Momento longo é bem-vindo aqui (até ~10 s), desde que um cômodo entre a cada ~2 s.

### Desenho técnico (espaços de verdade): `ambiente` + `objetos`

Para quando a fala é sobre um espaço real (sala, cozinha, loja, consultório, canteiro): paredes, portas, janelas e móveis em centímetros, que entram quando são ditos, se movem, ganham cota, circulação e áreas. O sistema completo está na seção 6.

```json
{ "tipo": "planta", "de": 3.5, "ate": 9.49, "legenda": true, "escala": "1:50",
  "titulo": "Móvel encostado em todas as paredes",
  "ambiente": { "largura": 480, "profundidade": 360,
    "portas": [{ "parede": "baixo", "pos": 30, "largura": 80 }],
    "janelas": [{ "parede": "cima", "pos": 150, "largura": 180 }] },
  "objetos": [ { "tipo": "sofa", "em": 3.63, "x": 135, "y": 0, "frente": "baixo", "rotulo": "sofá" } ],
  "areas": [{ "em": 6.75, "x": 110, "y": 120, "w": 300, "h": 170, "texto": "espaço" }],
  "circulacao": { "em": 8.19, "pontos": [[70, 350], [70, 250], [240, 250], [240, 102]], "bloqueada": true, "dur": 1 } }
```

### Outros tipos próprios

- `medida` (padrão `cheio`): como o `numero`, com um detalhe desenhado ao lado — `desde: "parede"` (vista de cima: o móvel se afasta da parede enquanto a cota conta), `"chao"` ou `"teto"` (vista de frente). Campos: `valor`, `unidade`, `casas`, `em` → `emFim` (a contagem), `rotulo` (até ~30), `numero`, `desde`, `objeto` (da biblioteca), `mover` (false = objeto parado). Sem `desde` e sem `objeto`, é só o número com a cota.
- `antesDepois` (padrão `dividida`, recomendado `cheia`): duas plantas do mesmo `ambiente` (`antes.objetos`, `depois.objetos`, `depois.em` = quando o depois acende; o antes recua para o cinza) ou dois textos (`antes.texto`, `depois.texto`); `resumo` com até 3 etiquetas de até ~12 caracteres. Para comparar ideias sem desenho, prefira `comparacao`.
- `titulo` (padrão `cheio`): o título do demo, em `linhas` escritas à mão (2 ou 3, até ~16 caracteres cada), com `rotulo`, `enfase` e `cota`. Para vídeos novos, use `abertura`, que quebra as linhas sozinha.

## 6. O desenho técnico em centímetros

Uma `planta` com `ambiente` (e cada lado de um `antesDepois` com `objetos`) é uma **cena**: um ambiente e uma lista de objetos, tudo em centímetros reais (o template escala sozinho para caber na tela).

### Planta (vista de cima) — `"vista": "planta"` (padrão)

```json
"ambiente": { "largura": 480, "profundidade": 360, "parede": 15,
  "portas": [{ "parede": "baixo", "pos": 30, "largura": 80, "dobradica": "inicio" }],
  "janelas": [{ "parede": "cima", "pos": 150, "largura": 180 }] }
```

- `largura` × `profundidade`: medidas **internas** do cômodo. Tamanhos típicos: sala 480 × 360, quarto 360 × 320, cozinha 300 × 250, banheiro 180 × 240, varanda 400 × 150.
- Coordenadas: `x` cresce para a direita a partir da face interna da parede da esquerda; `y` cresce para baixo a partir da face interna da parede de cima. `(0, 0)` é o canto interno de cima à esquerda.
- `portas` / `janelas`: `parede` é `"cima"`, `"baixo"`, `"esquerda"` ou `"direita"`; `pos` é a distância do canto até o vão (da esquerda, nas paredes de cima e de baixo; de cima, nas laterais). A porta abre para dentro; `dobradica` `"inicio"` (padrão) ou `"fim"` escolhe o lado. Deixe livre o quarto de círculo da porta (raio = largura).
- `paredesEm` (opcional): quando as paredes começam a se desenhar (padrão: logo no início do momento). Elas levam ~0,9 s.
- `escala` (opcional): texto "ESC. 1:50" embaixo do desenho, à direita.

**Objetos** (seção 5 tem a lista e os tamanhos):

```json
{ "tipo": "sofa", "em": 3.63, "x": 135, "y": 0, "frente": "baixo", "rotulo": "sofá" }
```

- `x`, `y`: canto de cima à esquerda da **área que o objeto ocupa**; `w`, `h`: largura e profundidade dessa área (já na posição em que ele está). Sem `w`/`h`, usa o tamanho padrão (girado se a frente for para o lado).
- `frente`: para onde fica a frente do móvel. Encostado na parede de cima → `"baixo"`; na de baixo → `"cima"`; na da esquerda → `"direita"`; na da direita → `"esquerda"`.
- Encostar: `y: 0` (parede de cima), `y: profundidade − h` (de baixo), `x: 0` (esquerda), `x: largura − w` (direita).
- `em`: quando o desenho do objeto começa (~0,6 s para completar). Ponha no `em` da palavra que fala dele.
- `rotulo` (opcional): nome curto dentro do objeto ("sofá", "cama"), em 28 px. Só em objetos grandes (sofá, cama, mesa, armário, bancada) e com até ~8 letras; poltrona e criado não comportam.
- `muda`: movimento e/ou mudança de tamanho, `{ "em", "x"?, "y"?, "w"?, "h"?, "dur"? }` (ou uma lista delas). Afastar o sofá, crescer o tapete, trocar a mesa de lugar. O objeto que muda **fica em terracota** a partir da primeira mudança (é o assunto).
- `destaque`: número (fica terracota a partir desse tempo), `true` (sempre) ou `false` (nunca, nem quando muda).
- `cota`: `{ "lado": "cima", "em"?, "texto"?, "numero"? }` — cota do objeto até a parede daquele lado, com o número real em cm; acompanha o objeto quando ele se move (a cota cresce e o número conta sozinhos). `"numero": false` tira o número (use quando a pessoa não disse a medida); `texto` vai antes do número ou no lugar dele.
- `pes`: tempo em que os pés da frente acendem (quadradinhos nos cantos; só em sofá, poltrona, cama, mesas, cadeira, aparador, rack, criado). Feito para a regra do tapete.
- `marca`: `{ "n": 1, "em": 22.54, "lado"? }` — círculo numerado no objeto (`"centro"`, padrão, ou fora dele: `"cima"`, `"baixo"`, `"esquerda"`, `"direita"`).
- Tapetes ficam sempre por baixo dos móveis, não importa a ordem da lista.

**Circulação** — percurso tracejado em terracota, que se desenha:

```json
"circulacao": { "em": 8.19, "pontos": [[70, 350], [70, 250], [240, 250], [240, 102]], "bloqueada": true, "dur": 1.0 }
```

- `pontos` em cm, com trechos só na horizontal ou só na vertical (mude um eixo por vez). Comece na porta.
- `bloqueada: true` termina num × (circulação travada); sem, termina numa seta (circulação livre).

**Áreas** — retângulo tracejado com véu terracota e rótulo, que cresce do centro: `"areas": [{ "em": 6.75, "x": 110, "y": 120, "w": 300, "h": 170, "texto": "espaço" }]`. Para "espaço livre", "área de circulação", "área gourmet".

**Cotas soltas** — entre dois pontos quaisquer (horizontal ou vertical): `"cotas": [{ "em": 12, "de": [0, 200], "ate": [480, 200], "valor": 480, "unidade": "cm" }]`. Com `valor`, o número conta; com `texto`, mostra o texto. Só com medidas ditas.

### Elevação (vista de frente) — `"vista": "elevacao"`

Para alturas: cortina, pé-direito, bancada, quadro, pendente, armário, nicho.

```json
{ "tipo": "planta", "vista": "elevacao", "layout": "cheia", "numero": "03",
  "titulo": "Cortina", "subtitulo": "do teto até o chão",
  "ambiente": { "largura": 125, "altura": 270 },
  "objetos": [
    { "tipo": "janela", "em": 19.87, "x": 48, "y": 90, "w": 72, "h": 140 },
    { "tipo": "cortina", "em": 20.15, "x": 10, "y": 80, "w": 50, "h": 160,
      "tetoEm": 20.51, "chaoEm": 21.38, "cota": { "lado": "esquerda", "numero": false } } ],
  "niveis": [ { "em": 20.57, "y": 270, "texto": "teto" }, { "em": 21.41, "y": 0, "texto": "chão" } ] }
```

- `ambiente`: `largura` do trecho de parede mostrado e `altura` (pé-direito). Mostre só o trecho que importa: parede estreita = desenho alto e grande (na `cheia`, 150–250 cm de largura fica ótimo).
- Objetos: `x` a partir da esquerda da parede; **`y` é a altura da base do objeto a partir do chão**; `w` × `h` = largura × altura.
- `cortina` com `tetoEm` / `chaoEm`: começa do tamanho dado e, nesses tempos, sobe até o teto e desce até o chão.
- `pendente`: o fio vai sozinho até o teto.
- `cota` na elevação mede o **próprio objeto**: `"esquerda"`/`"direita"` = altura, `"cima"`/`"baixo"` = largura (acompanha a cortina crescendo).
- `niveis`: marcas de nível ▽ com texto ("teto", "chão", "bancada 90"), em terracota, na altura `y`, por dentro da parede, junto à borda direita — deixe esse canto livre de objetos na altura do nível.
- A elevação ocupa toda a altura disponível: na `cheia`, uma parede de ~200 cm de largura e 270 de altura fica com ~850 px de altura.

### Biblioteca de objetos

Tamanhos padrão em cm (planta: largura × profundidade com a frente para baixo; elevação: largura × altura, e a altura da base quando não é o chão).

| Tipo | Planta | Elevação |
|---|---|---|
| `sofa` | 210 × 90 | 210 × 85 |
| `poltrona` | 80 × 80 | 80 × 90 |
| `mesaCentro` | 100 × 55 | 100 × 42 |
| `mesa` | 160 × 90 | 160 × 75 |
| `mesaRedonda` | 110 × 110 | 110 × 75 |
| `cadeira` | 45 × 45 | 45 × 90 |
| `cama` | 160 × 200 | 160 × 100 |
| `criado` | 45 × 40 | 45 × 55 |
| `armario` | 180 × 60 | 180 × 240 |
| `estante` | 160 × 35 | 160 × 200 |
| `rack` | 180 × 45 | 180 × 50 |
| `tv` | 120 × 8 | 120 × 70, base a 90 |
| `aparador` | 140 × 40 | 140 × 80 |
| `tapete` | 200 × 140 | linha no chão |
| `luminaria` (de piso) | 45 × 45 | 45 × 160 |
| `pendente` | 40 × 40 (tracejado) | 40 × 30, base a 160 |
| `vaso` (planta) | 50 × 50 | 45 × 90 |
| `cortina` | 200 × 15 (onda ao longo da parede) | 60 × 250 (um painel) |
| `bancada` | 200 × 60 (com cuba e cooktop) | 200 × 90 |
| `janela` | — (use `janelas` do ambiente) | 160 × 140, base a 90 |
| `porta` | — (use `portas` do ambiente) | 80 × 210 |
| `quadro` | 80 × 4 | 80 × 60, base a 140 |

Planta com mais de ~8 objetos fica poluída no celular. Móveis "de composição" (que a pessoa não citou) podem entrar para a sala parecer real, mas com `em` no início do momento e sem destaque.


## 7. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez, numa etiqueta de papel, sempre na mesma altura (logo acima da interface do aplicativo). Ela **some durante os momentos**, porque o bloco já mostra o que é dito. Dois ajustes:

- `"legenda": true` no momento: a legenda continua durante ele. Use numa planta de desenho técnico quando a fala tem mais do que o título mostra ("Parece que ganha espaço, mas trava a circulação").
- `semLegenda`: faixas extras sem legenda (`[ { "de": 3.5, "ate": 6.23 } ]`).

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Jão": "João" }`. A chave pode ter várias palavras seguidas e `""` apaga. Só corrija o que você tem certeza. Não edite `palavras` à mão.

Para ver as linhas de legenda antes de renderizar: `node scripts/legendas.mjs`.

## 8. Exemplo completo (vídeo sobre cripto)

Fala (43 s): "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

Layouts: `cheio` (número) → `cheio` (frase) → `cheia` (definição) → `dividida` (comparação) → `cheio` (destaque) → `cheia` (planta) → `cheio` (pergunta) → `dividida` (passos) → `cheio` (frase) → `dividida` (comparação) → `cheio` (fechamento).

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Mercado cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "em": 1.34 },
    { "tipo": "frase", "de": 2.89, "ate": 4.68, "texto": "Reacendeu a conversa", "destaque": "conversa", "em": 2.99 },
    { "tipo": "definicao", "de": 4.68, "ate": 8.67, "layout": "cheia", "termo": "Bull market", "em": 5.3,
      "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 },
                 { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.91, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "planta", "de": 14.93, "ate": 24.21, "layout": "cheia", "titulo": "Tem gente que perde",
      "comodos": [
        { "texto": "Na alta", "em": 15.32 },
        { "texto": "Compra por impulso", "em": 17.73, "alerta": true },
        { "texto": "Moeda sem critério", "em": 19.21, "alerta": true },
        { "texto": "Risco que não entende", "em": 21.25, "alerta": true } ],
      "percurso": { "bloqueado": true, "bloqueioEm": 22.86 } },
    { "tipo": "pergunta", "de": 24.21, "ate": 28.03, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita", "subtitulo": "como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 },
                 { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.68 },
    { "tipo": "comparacao", "de": 35.23, "ate": 40.05, "titulo": "Você quer…", "modo": "contra", "vencedor": 0, "vencedorEm": 39.31,
      "lados": [ { "rotulo": "Entender", "texto": "Antes de decidir", "em": 35.93 },
                 { "rotulo": "Correr o risco", "texto": "De perder o patrimônio", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste à aula", "destaque": "Saiba Mais", "icone": "link" }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

O que é ilustrativo: a planta (SEM ESCALA). O número de 83 mil foi dito.

## 9. Exemplo do desenho técnico (o demo de arquitetura)

Roteiro: "O erro que deixa qualquer sala parecendo menor: móvel encostado em todas as paredes. Parece que ganha espaço, mas trava a circulação. Faz o contrário. Primeiro: afasta o sofá uns vinte centímetros da parede. Segundo: tapete grande, que pegue pelo menos os pés da frente dos móveis. Terceiro: cortina do teto até o chão. Três ajustes, zero reforma, e a sala parece outra. Me segue pra mais projeto sem quebra-quebra."

O demo foi feito antes da regra da coluna estreita e ainda usa a `lateral` na cortina; num vídeo novo, ponha a elevação da cortina na `cheia`.

```json
{
  "marca": { "nome": "Tiago Moura", "area": "Arquitetura de interiores" },
  "caixas": { "dividida": { "zoom": 1.0, "ancoraY": 0.54 }, "cheia": { "zoom": 1.8, "ancoraY": 0.47 }, "lateral": { "zoom": 1.0 } },
  "momentos": [
    { "tipo": "titulo", "de": 0, "ate": 3.5, "rotulo": "Layout de sala",
      "linhas": ["O erro que deixa", "qualquer sala", "parecendo menor"], "enfase": "menor",
      "cota": { "texto": "sala", "em": 3.07, "efeito": "encolhe" } },

    { "tipo": "planta", "de": 3.5, "ate": 9.49, "legenda": true, "escala": "1:50",
      "titulo": "Móvel encostado em todas as paredes",
      "ambiente": { "largura": 480, "profundidade": 360,
        "portas": [{ "parede": "baixo", "pos": 30, "largura": 80 }],
        "janelas": [{ "parede": "cima", "pos": 150, "largura": 180 }] },
      "objetos": [
        { "tipo": "sofa", "em": 3.63, "x": 135, "y": 0, "frente": "baixo", "rotulo": "sofá" },
        { "tipo": "poltrona", "em": 3.97, "x": 0, "y": 110, "frente": "direita" },
        { "tipo": "estante", "em": 5, "x": 445, "y": 90, "w": 35, "h": 160, "frente": "esquerda" },
        { "tipo": "rack", "em": 5.55, "x": 150, "y": 315, "w": 180, "h": 45, "frente": "cima" } ],
      "areas": [{ "em": 6.75, "x": 110, "y": 120, "w": 300, "h": 170, "texto": "espaço" }],
      "circulacao": { "em": 8.19, "pontos": [[70, 350], [70, 250], [240, 250], [240, 102]], "bloqueada": true, "dur": 1 } },

    { "tipo": "medida", "de": 10.4, "ate": 14.28, "numero": "01", "rotulo": "Afaste o sofá da parede",
      "valor": 20, "unidade": "cm", "em": 11.46, "emFim": 12.72, "desde": "parede", "objeto": "sofa" },

    { "tipo": "planta", "de": 14.28, "ate": 19.47, "layout": "cheia", "numero": "02",
      "titulo": "Tapete grande", "subtitulo": "pelo menos os pés da frente", "escala": "1:50",
      "ambiente": { "largura": 480, "profundidade": 360,
        "portas": [{ "parede": "baixo", "pos": 30, "largura": 80 }],
        "janelas": [{ "parede": "cima", "pos": 150, "largura": 180 }] },
      "paredesEm": 14.43,
      "objetos": [
        { "tipo": "tapete", "em": 15.25, "x": 175, "y": 130, "w": 130, "h": 95,
          "muda": { "em": 15.71, "x": 95, "y": 75, "w": 290, "h": 225, "dur": 0.9 } },
        { "tipo": "sofa", "em": 14.68, "x": 135, "y": 20, "frente": "baixo", "rotulo": "sofá", "pes": 17.89,
          "cota": { "lado": "cima", "em": 14.83 } },
        { "tipo": "mesaCentro", "em": 14.83, "x": 190, "y": 165, "w": 100, "h": 55 },
        { "tipo": "poltrona", "em": 14.93, "x": 125, "y": 255, "frente": "cima", "pes": 17.89 },
        { "tipo": "poltrona", "em": 15.03, "x": 275, "y": 255, "frente": "cima", "pes": 17.89 },
        { "tipo": "estante", "em": 15.13, "x": 445, "y": 100, "w": 35, "h": 160, "frente": "esquerda" } ] },

    { "tipo": "planta", "de": 19.47, "ate": 22.21, "layout": "lateral", "vista": "elevacao", "numero": "03",
      "titulo": "Cortina", "subtitulo": "do teto até o chão",
      "ambiente": { "largura": 125, "altura": 270 },
      "objetos": [
        { "tipo": "janela", "em": 19.87, "x": 48, "y": 90, "w": 72, "h": 140 },
        { "tipo": "cortina", "em": 20.15, "x": 10, "y": 80, "w": 50, "h": 160,
          "tetoEm": 20.51, "chaoEm": 21.38, "cota": { "lado": "esquerda", "numero": false } } ],
      "niveis": [{ "em": 20.57, "y": 270, "texto": "teto" }, { "em": 21.41, "y": 0, "texto": "chão" }] },

    { "tipo": "antesDepois", "de": 22.21, "ate": 26.2, "layout": "cheia", "legenda": true,
      "ambiente": { "largura": 480, "profundidade": 360,
        "portas": [{ "parede": "baixo", "pos": 30, "largura": 80 }],
        "janelas": [{ "parede": "cima", "pos": 150, "largura": 180 }] },
      "antes": { "rotulo": "Antes",
        "objetos": [
          { "tipo": "sofa", "em": 22.26, "x": 135, "y": 0, "frente": "baixo" },
          { "tipo": "poltrona", "em": 22.29, "x": 0, "y": 110, "frente": "direita" },
          { "tipo": "estante", "em": 22.32, "x": 445, "y": 90, "w": 35, "h": 160, "frente": "esquerda" },
          { "tipo": "rack", "em": 22.35, "x": 150, "y": 315, "w": 180, "h": 45, "frente": "cima" } ],
        "circulacao": { "em": 22.36, "pontos": [[70, 350], [70, 250], [240, 250], [240, 102]], "bloqueada": true, "dur": 0.5 } },
      "depois": { "rotulo": "Depois", "em": 22.54,
        "objetos": [
          { "tipo": "tapete", "em": 22.81, "x": 95, "y": 75, "w": 290, "h": 225, "marca": { "n": 2, "em": 22.86, "lado": "baixo" } },
          { "tipo": "sofa", "em": 22.41, "x": 135, "y": 20, "frente": "baixo", "marca": { "n": 1, "em": 22.54 } },
          { "tipo": "mesaCentro", "em": 22.46, "x": 190, "y": 165, "w": 100, "h": 55 },
          { "tipo": "poltrona", "em": 22.49, "x": 125, "y": 255, "frente": "cima" },
          { "tipo": "poltrona", "em": 22.51, "x": 275, "y": 255, "frente": "cima" },
          { "tipo": "estante", "em": 22.53, "x": 445, "y": 100, "w": 35, "h": 160, "frente": "esquerda" },
          { "tipo": "cortina", "em": 23.16, "x": 110, "y": 2, "w": 260, "h": 14, "marca": { "n": 3, "em": 23.21, "lado": "direita" } } ],
        "circulacao": { "em": 25.53, "pontos": [[70, 350], [70, 232], [400, 232], [400, 60]], "dur": 0.6 } },
      "resumo": [{ "em": 22.54, "texto": "3 ajustes" }, { "em": 23.76, "texto": "0 reforma" }] },

    { "tipo": "cta", "de": 26.18, "ate": 29.2, "texto": "Siga para mais projetos", "detalhe": "sem quebra-quebra", "icone": "seguir" }
  ],
  "semLegenda": [{ "de": 3.5, "ate": 6.23 }, { "de": 22.21, "ate": 24.95 }]
}
```

Com esse plano, a legenda aparece só em "Parece que ganha espaço, mas trava a circulação", "Faz o contrário" e "e a sala parece outra". O "Primeiro", "Segundo", "Terceiro" viram os números 01, 02, 03 de três blocos diferentes, cada um num layout.
