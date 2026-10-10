# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastro do rosto), `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json` (cada palavra tem `em` e `ate`). Todo campo `em` ou `…Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática do desktop
3. Os lugares da pessoa
4. Os 11 blocos universais
5. A assinatura e os outros tipos próprios (`teclas`, `recorte`, `navegador`, `lista`)
6. O tempo das teclas de um atalho falado
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago", "area": "Tecnologia sem complicação" },
  "sfx": true,
  "correcoes": { "O Windows": "Windows" }
}
```

- `marca.nome`: vai na etiqueta da chamada (com as barrinhas de voz) e na barra da janela da pessoa. Curto (até ~12 caracteres). Vazio = sem etiqueta, e a janela se chama "Chamada".
- `marca.area`: vai na barra da janela da chamada, depois do nome. Até ~30 caracteres (some nas janelas estreitas).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática do desktop

A tela é uma área de trabalho fictícia: papel de parede lavanda-ardósia, barra de menu em cima (o nome do "app" ativo muda sozinho), dock embaixo com seis ícones a traço. Nada de logotipo de sistema, navegador ou programa.

- **A pessoa é a janela de uma videochamada**, sempre por cima das outras janelas (nunca é coberta). Ela muda de lugar conforme o bloco (seção 3) e **o mouse faz o gesto**: arrasta pela barra de título, clica em "–" para minimizar, clica no ícone da chamada no dock para restaurar, dá duplo clique para maximizar. O template calcula isso sozinho a partir dos momentos.
- **Cada bloco abre a janela que o mostra**, crescendo do ícone no dock: notas, assistente, painel, gráfico, dicionário, navegador. Destaque e pergunta são elementos do sistema no peito da pessoa em tela cheia (notificação, caixa de diálogo).
- **Trocas sem quadro vazio**: a janela nova abre já no `de`, opaca, por cima da que sai, enquanto a pessoa muda de lugar; a que sai fecha por trás. Quando o que entra fica direto no desktop (teclas) ou é um cartão, a janela velha fecha antes. Cartões no peito só entram quando a pessoa já cobre a tela.
- **Espera a lápis**: o que vai receber algo quando a palavra for dita já existe tracejado e apagado (as teclas, as vagas da lista, as etapas, o balão, os botões).
- **Trecho sem momento** = a pessoa em tela cheia, com a legenda "ao vivo" da chamada.
- **Gravação perto da câmera** (rosto largo): as janelas da pessoa estreitam e afastam sozinhas para a cabeça caber inteira; os cartões no peito descem até abaixo do queixo (`zona`).

## 3. Os lugares da pessoa

| Lugar | Onde | Padrão de |
|---|---|---|
| `cheia` | tela cheia, rosto no centro | `abertura`, `destaque`, `pergunta` e trechos sem momento |
| `topo` | larga, em cima (até 1000×600) | `topicos` (até 3 itens), `grafico`, `definicao`, `navegador`, `lista` sem teclas (até 3 itens), `teclas` em duas filas |
| `alto` | grande, no alto (até 920×800) | `numero`, `comparacao`, `teclas`, `cta` |
| `centro` | quase quadrada, no centro (até 900×830) | `frase`, `recorte` |
| `mini` | miniatura no canto de baixo à esquerda (440×452) | `passos`, `topicos` com 4 ou 5 itens, `lista` |

Mude com `"pessoa": "<lugar>"` num momento só se tiver motivo: o conteúdo de cada bloco foi pensado para o lugar padrão. Blocos seguidos com o mesmo lugar deixam a pessoa parada e só a janela troca; alterne quando der.

## 4. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate`, `legenda?` (true = a legenda continua aparecendo) e `pessoa?`. Os limites de texto são para caber com letra grande; o template mede e reduz até um mínimo legível, mas texto curto fica melhor. Palavras de títulos e frases entram **no instante em que são ditas** (o template procura cada palavra na fala): use as palavras da pessoa, na ordem. Algarismos ("3", "12") casam com a palavra falada ("três", "doze").

### `abertura` — a barra de busca

```json
{ "tipo": "abertura", "de": 0, "ate": 2.6, "texto": "Vai casar? Anota aí esse cronograma", "destaque": "cronograma",
  "em": 0.1, "resultado": "Cronograma", "icone": "data" }
```
- `texto` (até ~60 caracteres, até 3 linhas): digitado na fala. `destaque`: trecho exato em violeta. `em`: quando o texto começa a ser dito (padrão `de`). `titulo` é o nome antigo de `texto` e continua valendo.
- `resultado` (até ~22 caracteres, padrão "Abrir"), `icone` (padrão `globo`; lista na seção 5) e `contagem` (um número curto à direita): a linha que aparece no Enter. `enterEm`: o Enter (padrão: 0,35 s depois da última palavra).
- Ponha o `ate` 0,2 s antes do corte seguinte: a janela começa a sair da tela cheia ainda na última palavra.

### `topicos` — lista sem ordem (motivos, erros, dicas, sinais)

```json
{ "tipo": "topicos", "de": 15.9, "ate": 23.9, "titulo": "Tem gente que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 },
             { "texto": "Escolhe moeda sem critério", "em": 19.21, "detalhe": "sem olhar o projeto" },
             { "texto": "Assume risco que não entende", "em": 21.25, "icone": "aviso" } ] }
```
- 2 a 5 itens; `texto` de 2 a 6 palavras (até ~32 caracteres); `detalhe` opcional (uma linha menor, até ~40 caracteres), que entra junto ou na palavra dele (`detalheEm`). `titulo` opcional (até ~40 caracteres).
- `icone` por item é opcional (seção 5); sem ele, um marcador violeta neutro.
- Com 4 ou 5 itens a pessoa minimiza e a nota ocupa a tela de cima, com o contador "Item 3 de 5" ao lado.

### `passos` — sequência em ordem (processo, caminho, cronograma)

```json
{ "tipo": "passos", "de": 6.58, "ate": 14.48, "titulo": "Cronograma",
  "itens": [ { "texto": "9 meses", "em": 6.70, "detalhe": "Fotógrafo e buffet", "detalheEm": 7.89 },
             { "texto": "6 meses", "em": 9.43, "detalhe": "Convites e traje", "detalheEm": 10.63 },
             { "texto": "3 meses", "em": 12.09, "detalhe": "Envio dos convites", "detalheEm": 13.21 } ] }
```
- 2 a 5 etapas, mesmos campos dos tópicos. A etapa dita fica em violeta, as anteriores ganham ✓, o fio que as liga enche até a da vez; ao lado da miniatura, "2/3" e a barra de progresso.

### `numero` — um número que conta

```json
{ "tipo": "numero", "de": 1.2, "ate": 4.62, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 1.25 }
```
- `valor` (número puro: 83000, 1.5), `em` (a palavra do número: a contagem dura ~1,3 s), `rotulo` (até ~40 caracteres) e `rotuloEm` opcional.
- `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "kg", "dias") ficam menores. `casas` = casas decimais (1,5 → `casas: 1`). `inicio`: de onde a contagem parte (padrão 0). `ilustrativo: true` põe a etiqueta ILUSTRATIVO.
- Formato pt-BR automático: 83000 → 83.000; 1.5 → 1,5.

### `comparacao` — dois lados

```json
{ "tipo": "comparacao", "de": 8.5, "ate": 13.3, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 },
             { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ],
  "vencedor": 1, "vencedorEm": 11.2 }
```
- `lados`: exatamente 2. `rotulo` (até ~18 caracteres) vai na barra da janela; `texto` (até ~40 caracteres) grande no corpo.
- `modo`: `contra` (×, padrão), `antes-depois` ou `errado-certo` (›). `titulo` opcional (caixa alta em cima das janelas, até ~30 caracteres).
- `vencedor` (0 ou 1) e `vencedorEm`: o mouse clica na janela que ganha. Em `errado-certo`, o texto da outra é riscado. Sem vencedor, as duas ficam iguais.

### `grafico` — barras, linha, rosca ou tendência

Com números ditos:
```json
{ "tipo": "grafico", "de": 7.5, "ate": 11.0, "titulo": "Convidados por mês", "forma": "barras",
  "dados": [ { "rotulo": "Março", "valor": 45, "em": 7.6 }, { "rotulo": "Abril", "valor": 200, "em": 8.2 } ], "unidade": "pessoas" }
```
Sem números ditos (a forma mostra a ideia, a etiqueta ILUSTRATIVO aparece):
```json
{ "tipo": "grafico", "de": 12.0, "ate": 15.0, "titulo": "O preço caiu", "forma": "linha",
  "tendencia": "cai", "tendenciaEm": 12.2, "ilustrativo": true, "leitura": "caindo desde março" }
```
- `forma`: `barras`, `linha` ou `pizza` (rosca com legenda). `dados`: 2 a 6 números **ditos**, cada um no seu `em`; `rotulo` curto (até ~10 caracteres com 5 ou 6 barras, ~16 com 2 a 4). `unidade`: "R$", "US$", "%", "kg"… (na rosca sem unidade, aparece a porcentagem de cada fatia).
- `tendencia`: `sobe`, `cai` ou `oscila`; `tendenciaEm`: quando a curva começa a se desenhar (~1,7 s); `leitura` opcional (até ~30 caracteres, palavras da fala) embaixo da curva. Com `forma: "barras"`, a tendência vira sete colunas que crescem.

### `destaque` — uma frase que bate forte

```json
{ "tipo": "destaque", "de": 13.3, "ate": 15.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta",
  "detalhe": "Mesmo na alta", "detalheEm": 14.93 }
```
- `texto` (até ~50 caracteres, até 3 linhas grandes), `em`. `nivel`: `chave` (notificação clara, padrão) ou `alerta` (escura, com o triângulo, para risco e erro). `detalhe` (até ~60 caracteres) e `detalheEm` opcionais.

### `definicao` — termo e significado

```json
{ "tipo": "definicao", "de": 4.62, "ate": 8.5, "termo": "Bull market", "em": 5.30,
  "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```
- `termo` (até ~24 caracteres) entra no `em`; o `significado` (até ~90 caracteres) abre no balão no `significadoEm`, palavra por palavra.

### `frase` — citação, opinião forte, conclusão

```json
{ "tipo": "frase", "de": 23.9, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?",
  "destaque": "posicionamento?", "em": 24.58 }
```
- `texto` (até ~80 caracteres): digitado na nota, na fala. `destaque`: trecho em violeta. `risco` + `riscoEm`: trecho que o mouse seleciona e risca quando é dito ("~~promessa de lucro~~"). `em`: quando o texto começa a ser dito.

### `pergunta` — pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```
- `texto` (até ~70 caracteres). `opcoes`: 2 a 4 (opcionais), cada uma até ~30 caracteres, no seu `em`. Com 2 ou 4 opções, os botões ficam em duas colunas; com 3, um embaixo do outro.

### `cta` — fechamento

Universal (um botão):
```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora",
  "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
```
- `texto` (até ~60 caracteres, 2 linhas), `destaque` (o trecho do botão, em violeta no texto). `icone`: `link` (o botão mostra o `destaque`; padrão quando há destaque), `seguir` ("Seguir" → "Seguindo"), `salvar` ("Salvar" → "Salvo", padrão sem destaque) ou `comentar` (o `destaque` é digitado num campo e o botão "Comentar" confirma). `cliqueEm`: quando o mouse clica (padrão: logo depois da palavra do `destaque`).

Salvar e enviar (quando a fala é "salva e manda para…"):
```json
{ "tipo": "cta", "de": 17.88, "ate": 20.32, "texto": "Salva e manda", "salvarEm": 18.12, "enviarEm": 18.4,
  "para": "o seu amor", "avatar": "contato", "enviadoEm": 19.55 }
```
- `texto` até ~16 caracteres (uma linha grande). `salvarEm`/`enviarEm` logo depois das palavras (0,25 s ou mais entre os dois); `para` (até ~22 caracteres, palavras ditas) é digitado; `enviadoEm` depois da última palavra dele; `avatar` = ícone do contato. `acao: "seguir"` troca "Enviar" por "Seguir" (sem `para`).
- O último momento fica até o último quadro.

## 5. A assinatura e os outros tipos próprios

Campos de atalho (valem em `teclas`, `navegador`, `lista` e `recorte`):
- `teclas`: `[{ "tecla": "Mercado", "em": 30.91 }, …]`, até 4. Uma tecla pode ser uma tecla de verdade (`Ctrl`, `Shift` ganha ⇧, `Alt`, `Tab`, `Enter` ganha ⏎, `Esc`, `Win`, `Cmd`, `Espaço`, uma letra ou número) ou **uma palavra curta da fala** (até ~12 caracteres; palavras compridas quebram as teclas em duas filas). `em` = começo da palavra (ou da tecla, seção 6).
- `numero` (vira "Atalho 1" em cima das teclas) ou `rotulo` (texto livre em caixa alta, até ~40 caracteres, quebra em 2 linhas), e `numeroEm`: quando o rótulo acende.

### `teclas` — a combinação, grande (assinatura)

```json
{ "tipo": "teclas", "de": 28.0, "ate": 35.2, "chip": { "texto": "Aula gratuita", "em": 28.62 },
  "rotulo": "Como eu analiso", "numeroEm": 30.09,
  "teclas": [ { "tecla": "Mercado", "em": 30.91 }, { "tecla": "Riscos", "em": 31.86 }, { "tecla": "Ativos", "em": 33.12 } ],
  "descricao": "Sem promessa de lucro", "descricaoEm": 33.83 }
```
- As teclas esperam a lápis, afundam e acendem em violeta na palavra, ficam "seguradas" até 0,55 s depois da última e sobem juntas.
- `chip` (até ~16 caracteres): etiqueta violeta ao lado do rótulo, na palavra. `descricao` (até ~70 caracteres) + `descricaoEm`: frase embaixo das teclas.
- `trocaEm`: num `teclas` logo depois de outro momento com o mesmo número de teclas, elas continuam e só as diferentes viram (Win → Cmd) nesse instante.

### `recorte` — "guarde isto" (assinatura)

```json
{ "tipo": "recorte", "de": 11.81, "ate": 16.4, "numero": 3, "numeroEm": 12.02,
  "teclas": [ { "tecla": "Win", "em": 12.78 }, { "tecla": "Shift", "em": 13.32 }, { "tecla": "S", "em": 13.76 } ],
  "selecionaEm": 14.3, "soltaEm": 15.25, "capturaEm": 15.95,
  "rotuloSelecao": "Print de só um pedaço da tela", "aviso": "Print copiado", "avisoDetalhe": "na área de transferência" }
```
- `selecionaEm` → `soltaEm`: o arrasto do retângulo em volta do rosto (~0,8–1,2 s), começando na palavra da ação. `capturaEm`: um instante depois da última palavra da frase (padrão: 0,5 s depois de soltar). `escureceEm` opcional.
- `rotuloSelecao` (até ~32 caracteres): a frase dita, presa no retângulo. `aviso` (padrão: a própria frase) e `avisoDetalhe` (uma linha, só se for verdade) no aviso que recebe a imagem. `teclas` é opcional.
- `ajuste`: `{ "x": 0, "y": 30, "w": -40, "h": 0 }` desloca/encolhe o retângulo em px (óculos, cabeça baixa, rosto fora do centro).

### `navegador` — abas

Abas que abrem na fala:
```json
{ "tipo": "navegador", "de": 0, "ate": 3.0,
  "abas": [ { "titulo": "Fotógrafo", "icone": "camera", "texto": "Veja o portfólio inteiro" },
            { "titulo": "Buffet", "em": 1.2, "texto": "Peça degustação antes de fechar" } ],
  "aviso": { "texto": "Compare pelo menos três", "destaque": "três", "em": 2.4 } }
```
A aba que fecha e volta (atalho de navegador):
```json
{ "tipo": "navegador", "de": 2.9, "ate": 7.28, "numero": 1, "numeroEm": 3.2,
  "teclas": [ { "tecla": "Ctrl", "em": 3.92 }, { "tecla": "Shift", "em": 4.4 }, { "tecla": "T", "em": 4.78 } ],
  "abas": [ { "titulo": "E-mail", "icone": "email" }, { "titulo": "Passagens", "icone": "aviao" } ],
  "ativa": 1, "fechaEm": 3.72, "reabreEm": 5.14,
  "aviso": { "texto": "Reabre a aba que você fechou sem querer", "destaque": "fechou sem querer" } }
```
- `abas`: 2 a 4, título até ~9 caracteres (4 abas: ~6). A primeira já está aberta; as outras abrem no `em` delas (o mouse clica no "+") e viram a aba da vez, com o título grande e a frase `texto` (até ~70 caracteres) na página.
- `ativa` + `fechaEm` + `reabreEm`: o mouse fecha a aba sem querer e ela volta na palavra. `aviso`: a frase dita (até ~44 caracteres) num aviso do sistema, com `destaque` em violeta e `em` opcional.

### `lista` — painel com itens de tipos

```json
{ "tipo": "lista", "de": 7.28, "ate": 11.81, "numero": 2, "numeroEm": 7.44,
  "teclas": [ { "tecla": "Win", "em": 8.26 }, { "tecla": "V", "em": 8.8 } ],
  "titulo": "Área de transferência", "subtitulo": "Tudo o que você copiou",
  "itens": [ { "texto": "Reunião às 15h na sala 2", "tipo": "texto", "em": 7.3 },
             { "texto": "Rua das Flores, 120", "tipo": "endereco", "em": 9.7 } ],
  "primeiro": "último", "selo": { "texto": "não só o último", "em": 10.78 },
  "escolhe": 1, "escolheEm": 11.3, "escolheTexto": "Colado" }
```
- `titulo` (barra, até ~26), `subtitulo` (a frase dita, até ~24), `itens` 2 a 5 (o primeiro já está no painel; os outros no `em`), `texto` até ~28, `tipo`: `texto`, `imagem`, `link`, `endereco`, `dinheiro`, `arquivo`, `contato`, `data` (decide o ícone; `icone` também vale). `primeiro`, `selo` (até ~18), `escolhe` + `escolheEm` + `escolheTexto` (o mouse escolhe um item; padrão "Escolhido").
- Com `teclas`, a pessoa minimiza e o atalho fica ao lado. Sem teclas, até 3 itens o painel fica embaixo da pessoa; 4 ou 5, a pessoa minimiza e o contador fica ao lado. Para uma lista comum, prefira `topicos`.

### Ícones disponíveis

`globo`, `pasta`, `prancheta`, `tesoura`, `camera`, `nota`, `teclado`, `busca`, `marcador`, `enviar`, `mouse`, `link`, `imagem`, `texto`, `endereco`, `dinheiro`, `arquivo`, `contato`, `data`, `check`, `reabrir`, `mais`, `seguir`, `planilha`, `email`, `aviao`, `microfone`, `colar`, `aviso`, `pergunta`, `comentar`, `grafico`, `livro`, `etapas`. Todos a traço, genéricos.

## 6. O tempo das teclas de um atalho falado

Quando a tecla é uma palavra comum ("Mercado", "Data"), o `em` é o da palavra em `work/palavras.json`. Num atalho falado ("Control Shift T"), o Whisper costuma colar tudo num tempo só. Rode:

```bash
node ferramentas/teclas.mjs <de> <até>
```

no trecho do atalho (com 0,2 s de folga para cada lado). Ele marca o começo de cada sílaba. Conte as sílabas na ordem: Control 2 (con-trol) · Shift 2 (xíf-ti) · Windows 2 (uín-dous) · Command 2–3 · Alt 2 · Tab 2 · Enter 2 · Esc 2 · uma letra 1 ("tê"; "ésse" e "éle" 2) · um número como é falado ("qua-tro" 2). O `em` de cada tecla é o começo da primeira sílaba dela. Exemplo: `3.80 5.20` deu `3.92 · 4.16 · 4.42 · 4.58 · 4.78` → Ctrl 3,92, Shift 4,42, T 4,78.

## 7. Regras de tempo

- O primeiro momento começa em 0. O último vai até o fim do vídeo (`duracao`). Momentos **encostados** (o `ate` de um = o `de` do próximo), com as fronteiras nos cortes (`cortesEm`) ou nas pausas entre frases.
- A pessoa muda de lugar nos 0,5–0,6 s depois do `de`; não marque nada importante nesse meio segundo.
- Cada momento de 2,5 a 8 s; com mais de ~4 s, itens entrando por dentro dele. Nada parado mais de ~2,5 s: use os `em` dos itens, `detalheEm`, `vencedorEm`, `riscoEm`, `descricaoEm`.
- O mouse precisa de ~0,3 s entre um gesto e o seguinte (arrasto da janela, clique num item, clique no botão).
- Não repita o mesmo bloco três vezes seguidas; alterne os lugares da pessoa.

## 8. Legenda, correções e sons

A legenda é a legenda "ao vivo" da chamada: uma faixa escura no peito da pessoa em tela cheia, a palavra da vez em violeta-claro. Ela aparece **só nos trechos sem momento**. `"legenda": true` num momento a mantém (vai para o pé da janela da pessoa, se ela for larga). `semLegenda` tira legenda de trechos extras.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "O Windows": "Windows", "né": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. Não edite `palavras` à mão. Para ver as linhas de legenda: `node scripts/legendas.mjs`.

Sons (automáticos, tonais, discretos): um "toc" grave por tecla e por item, subindo de nota; duas notas quando algo dá resultado (a aba volta, o número termina de contar, o veredito, o balão abre); duas descendo no alerta; uma nota ao salvar e três ao enviar.

## 9. Exemplos completos

### Cripto (fala sem atalho nenhum, 43 s)

"O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
"momentos": [
  { "tipo": "abertura", "de": 0, "ate": 1.2, "texto": "O Bitcoin rompeu", "destaque": "Bitcoin", "em": 0.03, "resultado": "Bitcoin", "icone": "dinheiro", "enterEm": 0.98 },
  { "tipo": "numero", "de": 1.2, "ate": 4.62, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 1.25 },
  { "tipo": "definicao", "de": 4.62, "ate": 8.5, "termo": "Bull market", "em": 5.30, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 },
  { "tipo": "comparacao", "de": 8.5, "ate": 13.3, "modo": "contra", "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
  { "tipo": "destaque", "de": 13.3, "ate": 15.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta", "detalhe": "Mesmo na alta", "detalheEm": 14.93 },
  { "tipo": "topicos", "de": 15.9, "ate": 23.9, "titulo": "Tem gente que perde", "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21 }, { "texto": "Assume risco que não entende", "em": 21.25 } ] },
  { "tipo": "frase", "de": 23.9, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "destaque": "posicionamento?", "em": 24.58 },
  { "tipo": "teclas", "de": 28.0, "ate": 35.2, "chip": { "texto": "Aula gratuita", "em": 28.62 }, "rotulo": "Como eu analiso", "numeroEm": 30.09, "teclas": [ { "tecla": "Mercado", "em": 30.91 }, { "tecla": "Riscos", "em": 31.86 }, { "tecla": "Ativos", "em": 33.12 } ], "descricao": "Sem promessa de lucro", "descricaoEm": 33.83 },
  { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23, "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
  { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca aqui em Saiba Mais e assiste essa aula agora", "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
]
```

A busca digita o gancho; a pessoa vai para o alto e o painel conta US$ 83.000; o dicionário abre "Bull market" e o mouse mostra o significado; a tela divide mercado × bolso; o aviso escuro "Para a maioria das pessoas" sobe no peito; a nota se preenche com os três motivos; a pergunta é digitada numa nota; as teclas Mercado + Riscos + Ativos afundam (a assinatura); o diálogo traz as duas opções; o cartão final clica em "Saiba Mais".

### Atalhos de teclado (o vídeo de exemplo, 21,6 s)

"Três atalhos que vão te poupar horas no computador. Um: Control Shift T reabre a aba que você fechou sem querer. Dois: Windows V mostra tudo o que você copiou, não só o último. Três: Windows Shift S tira print de só um pedaço da tela. No Mac, é Command Shift quatro. Salva e manda pra quem só usa o mouse."

```json
"momentos": [
  { "tipo": "abertura", "de": 0, "ate": 2.9, "texto": "3 atalhos que vão te poupar horas no computador", "destaque": "horas", "resultado": "Atalhos de teclado", "contagem": "3", "icone": "teclado", "enterEm": 2.6 },
  { "tipo": "navegador", "de": 2.9, "ate": 7.28, "numero": 1, "numeroEm": 3.2, "teclas": [ { "tecla": "Ctrl", "em": 3.92 }, { "tecla": "Shift", "em": 4.4 }, { "tecla": "T", "em": 4.78 } ], "abas": [ { "titulo": "E-mail", "icone": "email" }, { "titulo": "Planilha", "icone": "planilha" }, { "titulo": "Passagens", "icone": "aviao" } ], "ativa": 2, "fechaEm": 3.72, "reabreEm": 5.14, "aviso": { "texto": "Reabre a aba que você fechou sem querer", "destaque": "fechou sem querer" } },
  { "tipo": "lista", "de": 7.28, "ate": 11.81, "numero": 2, "numeroEm": 7.43, "teclas": [ { "tecla": "Win", "em": 8.26 }, { "tecla": "V", "em": 8.8 } ], "titulo": "Área de transferência", "subtitulo": "Tudo o que você copiou", "itens": [ { "texto": "Reunião às 15h na sala 2", "tipo": "texto", "em": 7.3 }, { "texto": "Captura de tela.png", "tipo": "imagem", "em": 9.09 }, { "texto": "Rua das Flores, 120", "tipo": "endereco", "em": 9.7 }, { "texto": "R$ 1.250,00", "tipo": "dinheiro", "em": 10.09 } ], "primeiro": "último", "selo": { "texto": "não só o último", "em": 10.78 }, "escolhe": 2, "escolheEm": 11.3, "escolheTexto": "Colado" },
  { "tipo": "recorte", "de": 11.81, "ate": 16.4, "numero": 3, "numeroEm": 12.02, "teclas": [ { "tecla": "Win", "em": 12.78 }, { "tecla": "Shift", "em": 13.32 }, { "tecla": "S", "em": 13.76 } ], "selecionaEm": 14.3, "soltaEm": 15.25, "capturaEm": 15.95, "rotuloSelecao": "Print de só um pedaço da tela", "aviso": "Print copiado", "avisoDetalhe": "na área de transferência" },
  { "tipo": "teclas", "de": 16.4, "ate": 18.64, "chip": { "texto": "No Mac", "em": 16.55 }, "trocaEm": 16.85, "teclas": [ { "tecla": "Cmd", "em": 17.48 }, { "tecla": "Shift", "em": 17.98 }, { "tecla": "4", "em": 18.32 } ] },
  { "tipo": "cta", "de": 18.64, "ate": 21.56, "texto": "Salva e manda", "salvarEm": 18.92, "enviarEm": 19.2, "para": "quem só usa o mouse", "avatar": "mouse", "enviadoEm": 21.05 }
]
```
