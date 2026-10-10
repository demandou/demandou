# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `pagina`, `momentos`, `semLegenda` e `correcoes`.

Os exemplos de cada componente vêm do mesmo vídeo (o exemplo completo da seção 9), com os mesmos tempos. Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado** — pegue-os em `work/palavras.json` (cada palavra tem `em` e `ate`).

## Sumário

1. Campos gerais
2. A página do celular (`pagina`)
3. A gramática: quadro cheio × canvas
4. Os componentes da assinatura (`abertura`, `revisao`, `conserto`, `resultado`, `frase`, `cta`)
5. Erros e consertos: o que cada tipo desenha (e como usar com qualquer assunto)
6. Os blocos universais (`topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `pergunta`)
7. Como dividir a fala em momentos
8. Regras de tempo
9. Legenda, correções e sons
10. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago", "area": "Design" },
  "sfx": true,
  "correcoes": { "Contraste": "contraste", "Forte": "forte" }
}
```

- `marca.nome` e `marca.area`: o cabeçalho do comentário — no balão embaixo da pessoa, durante o canvas, e no cartão do fechamento ("Tiago Design · agora"). Nome até ~10 caracteres, área até ~12 (os dois numa linha de 416 px). `nome` vazio = o comentário se chama "Comentário"; a inicial do nome vai no pino vermelho do fechamento.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores (e `--manter-plano`). `zona.topo` é onde começam os cartões de quadro cheio (logo abaixo do queixo).

## 2. A página do celular (`pagina`)

O celular do canvas mostra uma página fictícia: primeiro em **wireframe cinza** (blocos, linhas de texto fictício, a imagem com um "X", o menu com links demais, o título fraco em letra clara, o botão lá embaixo), depois **limpa e na cor da marca** (o logotipo em texto, a promessa grande, o botão logo abaixo, uma ilustração, uma linha de apoio e três selos). Sem `pagina`, o template usa uma página genérica ("Sua marca") — sempre preencha.

```json
"pagina": {
  "nome": "Página inicial",
  "marca": "Fermento",
  "tituloAntes": "Bem-vindos à nossa padaria artesanal",
  "promessa": "Pão quentinho na sua porta às 7h.",
  "botao": "Assinar agora",
  "apoio": "Entrega grátis no bairro.",
  "ilustracao": "pao",
  "cor": "#FFD95A",
  "tinta": "#17130E",
  "palavras": 148,
  "rolagem": 1810
}
```

| Campo | O que é | Limite |
|---|---|---|
| `nome` | nome da tela, na barra do canvas ("Página inicial", "Página de vendas"); ganha o selo "v2" quando tudo é consertado | ~18 caracteres |
| `marca` | nome da marca fictícia, em texto serifado no topo da página limpa. **Nunca uma marca real** | ~12 |
| `tituloAntes` | o título fraco e genérico do wireframe, em letra clara (o "antes") | ~45 (2 linhas) |
| `promessa` | a promessa em uma frase, em serifada grande na página limpa (o "depois") | ~36 (2–3 linhas) |
| `botao` | o texto do botão | ~16 |
| `apoio` | linha curta abaixo da ilustração (opcional) | ~28 (1 linha) |
| `ilustracao` | o desenho no lugar da imagem: `pao`, `produto` (caixa), `curso` (vídeo com play), `agenda` (calendário), `cafe` | — |
| `cor`, `tinta` | o fundo da página limpa e a cor do texto sobre ele | ver abaixo |
| `palavras` | quantas palavras a parede de texto tem (inspetor do erro `texto`) | padrão 148 |
| `rolagem` | quantos px até o botão escondido (inspetor do erro `botao`) | padrão 1810 |
| `pesoAntes`, `pesoDepois` | peso da imagem antes e depois (erro e conserto `imagem`) | padrão "4,8 MB" e "180 KB" |
| `links` | quantos links o menu lotado tem (erro `menu`) | padrão 9 |

- **Cor da página**: a cor da marca do usuário, se ele der; senão, uma cor viva e clara para o nicho (amarelo-manteiga para comida, menta para educação e saúde, pêssego para beleza, azul-céu para serviços). `tinta` é um quase-preto puxado para o tom da cor. O inspetor calcula o contraste **de verdade** (fórmula WCAG) entre `tinta` e `cor`: confira no `stills.mjs` que deu 7:1 ou mais ("AAA"); abaixo de 4,5:1 o vídeo estaria se contradizendo. Fundo escuro com `tinta` clara também funciona.
- **A promessa** é a frase que a pessoa diria que a página promete — curta, concreta, no tom do negócio. Ela entra palavra por palavra (como texto fictício virando texto) logo depois que a parede de texto some.
- Os números do inspetor são ilustrativos: deixe os padrões, a menos que a pessoa diga um número ("cento e cinquenta palavras", "a imagem tinha 5 mega").

## 3. A gramática: quadro cheio × canvas

É a assinatura do modelo — uma revisão de página num programa de design:

| Estado | Quando | A pessoa | A tela |
|---|---|---|---|
| **Quadro cheio** | `abertura`, `frase`, `cta`, `numero`, `destaque`, `definicao`, `pergunta` e trechos sem momento | rosto na linha do centro | um cartão claro na altura do peito: camada de texto selecionada (título, frase) ou o comentário do fechamento |
| **Canvas** | `revisao`, `conserto`, `resultado` (celular) e `topicos`, `passos`, `comparacao`, `grafico` (frame de design) | encolhe e vira o **comentário fixado** no alto à direita (canto de baixo em ponta, borda clara), com o balão da fala embaixo | canvas grafite com grade de pontos: o celular à esquerda, o inspetor embaixo do balão, a barra do canvas em cima (nome da tela e o contador "3 problemas" → "Tudo certo") |

Regras que o template já cumpre sozinho (não precisa escrever nada):

- **Entrada no canvas**: 0,2 s antes do `de` do primeiro momento de canvas a pessoa começa a encolher (0,6 s) e o canvas aparece por trás dela, já desenhado; o corte que costuma ficar na fronteira cai no meio do movimento. O cartão de quadro cheio que vinha antes sai junto.
- **Momentos de canvas seguidos** (menos de 0,8 s entre eles) são um canvas só: a pessoa fica no comentário e a página continua de um para o outro (os erros abertos continuam marcados até o seu conserto).
- **Volta ao quadro cheio**: 0,12 s antes do `ate` do último momento de canvas a pessoa cresce de volta e cobre o canvas; o cartão seguinte só entra quando ela já cobriu a tela. O último momento fica até o último quadro.
- **Corte num trecho parado** (longe de uma troca): troca seca de enquadramento (6% no quadro cheio, 7% no comentário) para disfarçar o pulo.
- **Nenhum quadro vazio**: palavras de título, frase, promessa e fechamento nascem como barras cinzas de wireframe e viram texto quando são ditas; o botão tem uma vaga tracejada esperando; o inspetor nasce tracejado; os cartões do inspetor trocam em carrossel (um sobe, o outro chega).
- **A página se mexe sozinha** a partir dos erros e passos: rola até o botão escondido e volta, a parede de texto recolhe, a imagem sobe, o botão viaja até a vaga, a cor se espalha a partir do botão.

## 4. Os componentes da assinatura

Os limites de texto existem porque o espaço é fixo: passou do limite, quebra em linhas demais ou fica pequeno. Palavras de títulos, frases e da chamada entram **no instante em que são ditas** (o template procura cada palavra na fala) — use as palavras que a pessoa diz, na ordem em que diz (pode pular palavras). Algarismos ("3") casam com a palavra falada ("três").

### `abertura` — o título como camada de texto selecionada

Quadro cheio. No peito, um cartão claro com a caixa de seleção vermelha, alças nos cantos, o nome da camada ("Título") em cima e a medida L × A embaixo (os números contam quando a seleção aparece). As palavras nascem como barras cinzas e viram texto no ritmo da fala.

```json
{ "tipo": "abertura", "de": 0, "ate": 3.31, "texto": "3 erros que fazem o cliente sair do seu site", "destaque": "3" }
```

- `texto` (o campo universal; `titulo` continua valendo): a frase do gancho, fiel à fala, até ~60 caracteres. O modelo mede, quebra em até 3 linhas e reduz o corpo (de 86 até 48 px) até caber. `destaque`: palavra(s) exata(s) do texto em vermelho — normalmente o número.
- `em` (opcional): o instante em que o texto começa a ser dito, quando o momento começa antes da primeira palavra.
- `ate`: no corte em que a pessoa encolhe para o canvas (o cartão sai junto com o movimento).

### `revisao` — os erros, um por um

Canvas. Cada erro ganha, no seu `em`: um contorno vermelho tracejado no bloco do celular, uma etiqueta vermelha numerada ("1 Texto demais"), o som de um erro (tons que descem), o contador da barra sobe ("2 problemas") e o inspetor troca para a medida daquele erro. O que cada tipo desenha está na seção 5.

```json
{ "tipo": "revisao", "de": 3.31, "ate": 9.2, "legenda": true,
  "erros": [
    { "em": 3.62, "tipo": "texto", "rotulo": "Texto demais", "medeEm": 4.25 },
    { "em": 5.27, "tipo": "botao", "rotulo": "Botão escondido" },
    { "em": 7.04, "tipo": "contraste", "rotulo": "Pouco contraste", "medeEm": 8.17 } ] }
```

- `erros`: 1 a 4, **um de cada tipo** (cada tipo tem uma área só no celular). `tipo`: `texto`, `botao`, `contraste`, `imagem` ou `menu` (seção 5).
- `em`: a palavra que nomeia o erro ("demais", "Botão", "letra"). A numeração segue a ordem do tempo.
- `rotulo`: o texto da etiqueta, curto, até ~16 caracteres ("Texto demais", "Botão escondido", "Pouco contraste", "Imagem pesada", "Menu lotado").
- `medeEm` (opcional): o segundo tempo do erro, na palavra que completa a ideia — `texto`: a régua vermelha "1ª tela · 844" se desenha ao longo da tela ("primeira tela"); `contraste`: o conta-gotas sai da letra e pega a cor do fundo, e só então o contraste é calculado ("fundo claro"). Sem ele, acontece 0,6 s depois do `em`.
- `medida` (qualquer assunto): o que o inspetor mostra no lugar da medida da página. `false` = só o nome do problema, sem número; `{ "valor": "3 de 10", "texto": "compram por impulso" }` = um número ou trecho dito e uma linha embaixo. Sem `medida`, o inspetor mede a página fictícia (palavras, rolagem, contraste…): use só quando o erro é mesmo de uma página.
- `legenda: true`: a fala aparece no balão do comentário (recomendado em todo momento de canvas — seção 9).

### `conserto` — a página se reconstrói

Canvas. Cada passo, no seu `em`, transforma a página e fecha a etiqueta do erro do mesmo tipo (ela fica escura com um ✓, o rótulo é riscado e some), com um som que sobe; o contador desce e, no fim, vira "Tudo certo" e a tela ganha o selo "v2".

```json
{ "tipo": "conserto", "de": 9.2, "ate": 13.97, "legenda": true,
  "passos": [ { "em": 9.3, "tipo": "promessa" }, { "em": 11.19, "tipo": "botao" }, { "em": 12.63, "tipo": "contraste" } ] }
```

- `passos`: 1 a 5, um de cada tipo, no `em` da palavra que pede o conserto ("Coloca", "botão", "contraste"). Os tipos estão na seção 5. Cada passo aceita `rotulo` (o nome no inspetor) e `medida` (como nos erros; se o erro do mesmo tipo tem `medida`, o passo mostra um cartão "Resolvido" com o rótulo dele).
- **O que não tiver passo próprio acontece junto com o último passo** (a página termina limpa de qualquer jeito). Ex.: só `promessa` e `contraste` → o botão sobe junto com a cor.
- Deixe ~1,2 s ou mais entre `promessa` e o passo seguinte: as palavras da promessa entram nesse intervalo.

### `resultado` — a página vende

Canvas. Um toque no botão (círculo que abre) e, no `em` de cada item, um aviso branco sobe no pé do celular ("✓ Novo pedido · Assinatura · agora"), empilhando; o inspetor conta "+1, +2, +3" e as barras "antes / depois" crescem.

```json
{ "tipo": "resultado", "de": 13.97, "ate": 16.2, "legenda": true, "rotulo": "Pedidos",
  "itens": [ { "em": 14.1, "texto": "Novo pedido", "detalhe": "Assinatura · agora" },
             { "em": 14.91, "texto": "Novo pedido", "detalhe": "Assinatura · agora" },
             { "em": 15.46, "texto": "Novo pedido", "detalhe": "Assinatura · agora" } ] }
```

- `itens`: 1 a 3 avisos, cada um numa palavra da frase ("segundos", "página", "vende"). `texto` até ~16 caracteres, `detalhe` até ~20 (opcional). Use o que a página vende: "Novo pedido", "Nova matrícula", "Novo contato", "Consulta marcada".
- `rotulo`: o nome da contagem no inspetor ("Pedidos", "Alunos", "Contatos"), até ~10 caracteres.
- Serve para "a página vende mais", "o cliente compra", "chegam os contatos". Não escreva números de resultado que a pessoa não disse.

### `frase` — uma frase em quadro cheio

Quadro cheio: uma camada de texto selecionada (como a abertura, um pouco menor) com uma frase — uma regra, uma virada, um dado. Bom para separar a revisão do conserto ("Agora, o jeito certo:") ou para uma ideia que não é um erro da página.

```json
{ "tipo": "frase", "de": 9.2, "ate": 11.16, "texto": "Coloca a promessa em uma frase", "destaque": "uma frase", "rotulo": "Regra" }
```

- `texto`: fiel à fala, até ~90 caracteres (3 linhas; o corpo diminui até caber). `destaque`: palavras exatas em vermelho. `rotulo`: o nome da camada em cima ("Regra", "Dado", "Dica"), até ~12 caracteres. `em`: quando o texto começa a ser dito.
- `risco` (opcional): trecho do texto riscado em vermelho quando é dito (`riscoEm`: padrão, a palavra dita). Ex.: `"texto": "Sem promessa de lucro", "risco": "promessa de lucro"`.
- Dure pelo menos ~1,6 s (a pessoa cresce, o cartão entra, as palavras acendem, ela encolhe de novo).

### `cta` — o comentário do fechamento

Quadro cheio. No peito, o comentário do designer: pino vermelho com a inicial, nome, área e "agora"; a chamada falada (barras que viram palavras); embaixo, dois botões — a ação (salvar, seguir ou comentar) acende em vermelho quando é dita e "Resolver" vira "✓ Resolvido" na cor da página no fim.

```json
{ "tipo": "cta", "de": 16.2, "ate": 18.96, "texto": "Salva e revisa a sua página hoje.", "icone": "salvar" }
```

- `texto`: a chamada, fiel à fala, até ~60 caracteres (até 3 linhas; o corpo diminui até caber). `destaque`: trecho que fica em vermelho. `em`: quando o texto começa a ser dito.
- `icone`: `salvar` (padrão; "Salvar" → "Salvo"), `seguir` ("Seguir" → "Seguindo"), `comentar` ("Comentar" → "Comentado") ou `link` ("Abrir link" → "Abrindo").
- `iconeEm` (opcional): quando a ação acende — padrão: na primeira palavra (ou logo que o cartão entra). `resolvidoEm` (opcional): quando vira "Resolvido" — padrão: na última palavra.
- Último momento: fica até o fim do vídeo.

## 5. Erros e consertos: o que cada tipo desenha

| Tipo do erro | No celular | No inspetor | Segundo tempo (`medeEm`) | Passo que conserta | O conserto |
|---|---|---|---|---|---|
| `texto` | contorno na parede de texto (12 linhas) | "1ª TELA": palavras contando até `palavras`, uma miniatura de tela cheia de linhas, "ideal: 1 frase" | régua vermelha "1ª tela · 844" ao longo da tela | `promessa` | a parede recolhe linha por linha, a imagem sobe e a promessa entra palavra por palavra; o inspetor conta até o número de palavras da promessa |
| `botao` | a página **rola** até o botão lá embaixo (0,95 s) e a etiqueta aparece quando ele chega | "ROLAGEM": px até o botão, contando junto com a rolagem; minimapa com a janela da 1ª tela e o botão no fundo | — | `botao` | o botão sobe até a vaga tracejada logo abaixo da promessa; aparecem as redlines de espaçamento (24 e 32 px); a contagem desce a 0 |
| `contraste` | contorno no título fraco; o conta-gotas pega a cor da letra | "CONTRASTE": amostras de letra e fundo, "–,–:1 medindo…", depois 1,5:1 com a régua (mínimo 4,5) | o conta-gotas pega a cor do fundo e o contraste é calculado | `contraste` | a cor da marca se espalha a partir do botão; texto e botão ganham a `tinta`, a ilustração e os selos entram; o inspetor conta até o contraste real |
| `imagem` | contorno na imagem, que gira carregando com uma barra parada | "IMAGEM": `pesoAntes`, "para carregar" | — | `imagem` | o "X" vira a ilustração; `pesoDepois`, "carrega na hora" |
| `menu` | contorno no menu com links demais (etiqueta à direita) | "MENU": links contando até `links` | — | `menu` | os links somem e fica só a marca e o ícone de menu; "1 link no topo" |

- A rolagem do `botao` desce no `em` dele e volta ao topo no erro seguinte (ou no começo do conserto). Por isso a etiqueta do botão aparece ~0,7 s depois do `em`: ponha o `em` na primeira palavra do erro ("Botão").
- Etiquetas e contornos acompanham o bloco: se a página rola, eles rolam junto.

## 6. Os blocos universais

São os blocos que existem em todos os modelos, com os mesmos campos (`motor/BLOCOS.md`). Servem para qualquer assunto. Todo campo `em` (ou `…Em`) é o `em` da palavra dita, em `work/palavras.json`. Os textos são **medidos com a própria fonte**: se não couberem, o corpo diminui até um mínimo legível e o texto quebra em mais linhas; nunca vaza. O que ainda não foi dito é só a barra cinza do tamanho da palavra, nunca o texto.

Dois jeitos de aparecer:

- **Frame de design** (`topicos`, `passos`, `comparacao`, `grafico`): a pessoa encolhe para o comentário e o conteúdo aparece num frame no lugar do celular, com o painel de **camadas** no lugar do inspetor (cada item vira uma camada, a atual em vermelho) e o nome do bloco na barra do canvas. Entre dois frames, o novo entra por varredura de cima para baixo, cobrindo o antigo; do frame para o celular, o frame se recolhe.
- **Camada em quadro cheio** (`numero`, `destaque`, `definicao`, `pergunta`): a pessoa fica em quadro cheio, o rosto na linha do centro, e uma camada selecionada (caixa vermelha, alças, nome, medida L × A) aparece na altura do peito.

### `topicos` e `passos`

```json
{ "tipo": "topicos", "de": 16.95, "ate": 24.1,
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 },
             { "texto": "Moeda sem critério", "em": 19.21 },
             { "texto": "Risco que não entende", "em": 21.25 } ] }
```

- `itens`: de 2 a 5, cada um com `texto` (2 a 6 palavras; o frame é estreito, 3 a 4 linhas cabem) e `em`; `detalhe` opcional (uma linha menor, ~40 caracteres, falada logo depois). `titulo` opcional (até ~40 caracteres, no alto do frame).
- Cada item é um cartão branco com a etiqueta vermelha numerada; no `em` ele ganha o contorno tracejado vermelho e as barras viram texto; quando o seguinte chega, a etiqueta fica escura. `passos`: igual, com um conector tracejado entre os cartões que se completa em vermelho até o próximo.

### `numero`

```json
{ "tipo": "numero", "de": 0, "ate": 4.95, "valor": 83000, "em": 1.3, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- O número conta de 0 até `valor` a partir de `em` (1,15 s), em pt-BR (`83.000`, `1,5`), com um marca-texto da cor da página no fim. `casas`: casas decimais (padrão: as de `valor`). `prefixo` ("US$", "R$") e `sufixo` ("mil", "%", "dias") ficam menores. Anos (1900 a 2100) saem sem ponto de milhar.
- `rotulo`: o que o número mede (até ~40 caracteres), falado a partir de `rotuloEm` (padrão: `em` + 0,3). `ilustrativo: true` põe a etiqueta ILUSTRATIVO.

### `comparacao`

```json
{ "tipo": "comparacao", "de": 8.55, "ate": 13.4, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "subindo", "em": 9.31 },
             { "rotulo": "Seu bolso", "texto": "não vira dinheiro", "em": 9.87 } ],
  "vencedor": 0, "vencedorEm": 12.0 }
```

- `lados`: sempre 2, cada um com `rotulo` (até 16 caracteres, em mono), `texto` (até ~40 caracteres) e `em`. Os cartões ficam empilhados no frame.
- `modo`: `contra` (selo VS), `antes-depois` (seta; o segundo cartão ganha a cor da página) ou `errado-certo` (o primeiro com contorno vermelho e ✕, o segundo na cor da página com ✓).
- `vencedor` (0 ou 1) e `vencedorEm`: no instante dito, o vencedor ganha a cor da página e um ✓, o outro apaga (continua legível).

### `grafico`

```json
{ "tipo": "grafico", "de": 10.3, "ate": 13.45, "forma": "pizza", "unidade": "%",
  "dados": [ { "rotulo": "Zona 2", "valor": 80, "em": 10.63 }, { "rotulo": "Mais fortes", "valor": 20, "em": 12.01 } ] }
```

```json
{ "tipo": "grafico", "de": 8.6, "ate": 11.7, "forma": "linha", "titulo": "Mercado subindo",
  "tendencia": "sobe", "tendenciaEm": 9.31, "ilustrativo": true }
```

- Com `dados` (de 2 a 6, números ditos): `barras` (horizontais, a maior na cor da página), `linha` (pontos com etiquetas numeradas e uma lista embaixo) ou `pizza` (fatias que se abrem, com legenda). `unidade` vai junto dos valores. Um dado só: use `numero`.
- Sem `dados`: só a forma da tendência (`sobe`, `cai`, `oscila`), desenhada a partir de `tendenciaEm`, **com `ilustrativo: true`**. Não invente valores.

### `destaque`

```json
{ "tipo": "destaque", "de": 13.4, "ate": 16.95, "texto": "Para a maioria", "em": 13.46, "nivel": "alerta",
  "detalhe": "tem gente que perde", "detalheEm": 15.96 }
```

- `texto`: até ~30 caracteres, em até 3 linhas. `detalhe` (opcional, até ~40): linha menor, a partir de `detalheEm`.
- `nivel`: `alerta` (cartão vermelho, texto branco, "!") ou `chave` (padrão; marca-texto da cor da página sob o texto).

### `definicao`

```json
{ "tipo": "definicao", "de": 4.95, "ate": 8.55, "termo": "Bull market", "em": 5.3,
  "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo`: até ~24 caracteres. `significado`: até ~70 caracteres, em até 3 linhas, a partir de `significadoEm`.

### `pergunta`

```json
{ "tipo": "pergunta", "de": 35.15, "ate": 40.0, "texto": "Você quer entender antes de decidir?", "em": 35.23,
  "opcoes": [ { "texto": "Entender", "em": 35.93 }, { "texto": "Perder", "em": 38.81 } ] }
```

- `texto`: até ~60 caracteres quando há opções (a camada tem altura limitada); até ~90 sem opções. `opcoes` (opcional, 2 a 4, até ~16 caracteres cada, de preferência numa linha só): botões de rádio tracejados que se preenchem na palavra dita.
- A camada de quadro cheio tem, no máximo, a altura da `zona` menos ~120 px; o texto diminui até caber.

## 7. Como dividir a fala em momentos

Leia a transcrição inteira e pergunte, frase a frase: *numa revisão de página, o que eu mostraria agora?*

| A fala traz… | Componente |
|---|---|
| a frase de abertura (a promessa, os "3 erros") | `abertura` |
| o que está errado numa página | `revisao` (um erro por item dito) |
| como consertar | `conserto` (um passo por conserto dito) |
| o efeito (vende mais, converte, o cliente compra) | `resultado` |
| enumeração sem ordem ("três erros", itens separados por vírgula) | `topicos` |
| sequência, processo, "primeiro… depois…" | `passos` |
| número, preço, porcentagem, tempo | `numero` |
| dois lados (A x B, antes x depois, errado x certo) | `comparacao` |
| algo que sobe, cai, cresce; proporção | `grafico` |
| alerta, risco, palavra-chave forte | `destaque` |
| termo técnico explicado | `definicao` |
| pergunta feita a quem assiste | `pergunta` |
| uma regra, uma virada, uma frase de efeito | `frase` |
| a chamada final (salva, me segue, comenta) | `cta` |

- Um vídeo típico: `abertura` → `revisao` → `conserto` → `resultado` → `cta`, com momentos **encostados** (o `ate` de um = o `de` do próximo) e as fronteiras nos cortes (`cortesEm`) ou nas pausas entre frases.
- Fala que só aponta erros (sem conserto): `abertura` → `revisao` → `cta`. Fala que só ensina a fazer certo: `abertura` → `conserto` (a página começa em wireframe e se monta) → `cta`.
- Os momentos de canvas ficam em sequência; para "respirar" no meio, um `frase` curto em quadro cheio entre a revisão e o conserto funciona bem (a pessoa cresce e encolhe de novo).
- Trecho sem momento = quadro cheio com a legenda abaixo do queixo. Use pouco.
- Não repita o mesmo bloco três vezes seguidas. A assinatura (`revisao`, `conserto` ou `resultado`) entra pelo menos uma vez, de forma metafórica se o assunto não for uma página (seção 5, `medida`).

## 8. Regras de tempo

- O primeiro momento começa em 0. O `ate` do último é o fim do vídeo (`duracao`).
- Fronteiras: no corte (`cortesEm`) ou na pausa entre frases. Nas trocas de layout a pessoa se move por 0,6 s; não marque nada importante no meio segundo depois do `de` do primeiro momento de canvas (o primeiro erro fica bem ~0,3 s depois do `de`).
- Um erro ou passo a cada ~1,5–2,5 s, cada um na sua palavra. Dois a menos de ~0,5 s um do outro se atropelam no inspetor.
- Nada fica parado mais de ~2,5 s: se um erro fala por muito tempo, use o `medeEm`; se o resultado é longo, mais um aviso.

## 9. Legenda, correções e sons

- **No canvas, a fala vai para o balão do comentário**, embaixo da pessoa: o nome, "agora" e a frase em curso, cada palavra acendendo quando é dita (a última frase fica até a próxima — o balão nunca fica vazio). Marque `"legenda": true` nos momentos de canvas: assim o `legendas.mjs` lista essas linhas para você conferir as quebras.
- **Em quadro cheio**, a legenda (um rótulo grafite, abaixo do queixo) aparece só nos trechos sem momento; a abertura, a frase e o fechamento já mostram o que é dito. `semLegenda` tira legenda de trechos extras.
- Palavras que a transcrição errou vão em `correcoes`, de preferência **sem a pontuação** (a original é mantida): `{ "Contraste": "contraste", "chat GPT": "ChatGPT", "né": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. Se a correção trouxer a sua própria pontuação, ela vale no lugar da original — assim uma frase que terminou sem ponto (o Whisper às vezes esquece) ganha o ponto: `{ "claro": "claro." }`. Não edite `palavras` à mão (o `cortar.mjs` reescreve esse campo).
- Sons (automáticos, tonais, discretos): um tom grave quando o canvas abre, um tom que desce a cada erro (a etiqueta aparecendo), um que sobe a cada passo do conserto, duas notas no primeiro aviso de venda e um acorde quando a ação do fechamento acende. `"sfx": false` desliga.

## 10. Exemplos completos

### 10a. Revisão de landing page (o demo)

Roteiro: "Três erros que fazem o cliente sair do seu site. Texto demais na primeira tela. Botão de compra escondido. E letra clara em fundo claro. Coloca a promessa em uma frase: o botão logo abaixo e contraste forte. Em segundos, a página vende mais. Salva e revisa a sua página hoje."

Cortes em 3,31 · 5,18 · 6,94 · 9,11 · 13,93 · 16,20 (duração 18,96 s). Cinco momentos encostados:

```json
{
  "marca": { "nome": "Tiago", "area": "Design" },
  "pagina": {
    "nome": "Página inicial", "marca": "Fermento",
    "tituloAntes": "Bem-vindos à nossa padaria artesanal",
    "promessa": "Pão quentinho na sua porta às 7h.",
    "botao": "Assinar agora", "apoio": "Entrega grátis no bairro.",
    "ilustracao": "pao", "cor": "#FFD95A", "tinta": "#17130E",
    "palavras": 148, "rolagem": 1810
  },
  "correcoes": { "claro": "claro.", "Contraste": "contraste", "Forte": "forte" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 3.31, "titulo": "3 erros que fazem o cliente sair do seu site", "destaque": "3" },
    { "tipo": "revisao", "de": 3.31, "ate": 9.2, "legenda": true, "erros": [
      { "em": 3.62, "tipo": "texto", "rotulo": "Texto demais", "medeEm": 4.25 },
      { "em": 5.27, "tipo": "botao", "rotulo": "Botão escondido" },
      { "em": 7.04, "tipo": "contraste", "rotulo": "Pouco contraste", "medeEm": 8.17 } ] },
    { "tipo": "conserto", "de": 9.2, "ate": 13.97, "legenda": true, "passos": [
      { "em": 9.3, "tipo": "promessa" }, { "em": 11.19, "tipo": "botao" }, { "em": 12.63, "tipo": "contraste" } ] },
    { "tipo": "resultado", "de": 13.97, "ate": 16.2, "legenda": true, "rotulo": "Pedidos", "itens": [
      { "em": 14.1, "texto": "Novo pedido", "detalhe": "Assinatura · agora" },
      { "em": 14.91, "texto": "Novo pedido", "detalhe": "Assinatura · agora" },
      { "em": 15.46, "texto": "Novo pedido", "detalhe": "Assinatura · agora" } ] },
    { "tipo": "cta", "de": 16.2, "ate": 18.96, "texto": "Salva e revisa a sua página hoje.", "icone": "salvar" }
  ]
}
```

Com esse plano: o título se monta como camada de texto selecionada sobre a pessoa; no corte, ela encolhe para o comentário e o canvas aparece com o celular em wireframe. "Texto demais" marca a parede de texto (148 palavras) e a régua da 1ª tela se desenha em "primeira tela"; em "Botão" a página rola até o botão lá embaixo (1.810 px); em "letra clara" o conta-gotas pega a letra e, em "fundo", o fundo — 1,5:1. Em "Coloca" a parede recolhe e a promessa entra palavra por palavra; em "botão" ele sobe para logo abaixo dela, com as medidas de 24 e 32 px; em "contraste" o amarelo se espalha a partir do botão (13,5:1, AAA) e a barra vira "Tudo certo · v2". O botão é tocado e três pedidos chegam; no corte, a pessoa volta ao quadro cheio com o comentário "Salva e revisa a sua página hoje", que é salvo e marcado como resolvido.


### 10b. Cripto (o mesmo estilo com outro assunto)

Fala (43 s): "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago", "area": "Cripto" },
  "pagina": { "nome": "Seu plano", "marca": "Cripto", "tituloAntes": "Compre a moeda que está subindo agora", "promessa": "Entenda antes de investir.", "botao": "Ver a aula", "apoio": "Sem promessa de lucro.", "ilustracao": "curso" },
  "momentos": [
    {"tipo": "numero", "de": 0, "ate": 4.95, "valor": 83000, "em": 1.3, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1},
    {"tipo": "definicao", "de": 4.95, "ate": 8.55, "termo": "Bull market", "em": 5.3, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15},
    {"tipo": "comparacao", "de": 8.55, "ate": 13.4, "modo": "contra", "lados": [{"rotulo": "Mercado", "texto": "subindo", "em": 9.31}, {"rotulo": "Seu bolso", "texto": "não vira dinheiro", "em": 9.87}], "vencedor": 0, "vencedorEm": 12.0},
    {"tipo": "destaque", "de": 13.4, "ate": 16.95, "texto": "Para a maioria", "em": 13.46, "nivel": "alerta", "detalhe": "tem gente que perde", "detalheEm": 15.96},
    {"tipo": "revisao", "de": 16.95, "ate": 24.1, "legenda": true, "erros": [{"em": 17.73, "tipo": "texto", "rotulo": "Compra impulsiva", "medida": false}, {"em": 19.21, "tipo": "contraste", "rotulo": "Sem critério", "medida": false}, {"em": 21.25, "tipo": "botao", "rotulo": "Risco invisível", "medida": false}]},
    {"tipo": "pergunta", "de": 24.1, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58},
    {"tipo": "destaque", "de": 28.0, "ate": 30.4, "texto": "Aula gratuita", "em": 28.62, "nivel": "chave"},
    {"tipo": "conserto", "de": 30.4, "ate": 33.65, "legenda": true, "passos": [{"em": 30.91, "tipo": "promessa", "rotulo": "Mercado", "medida": false}, {"em": 31.86, "tipo": "botao", "rotulo": "Riscos", "medida": false}, {"em": 32.29, "tipo": "contraste", "rotulo": "Ativos", "medida": false}]},
    {"tipo": "frase", "de": 33.65, "ate": 35.15, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro", "riscoEm": 34.03},
    {"tipo": "pergunta", "de": 35.15, "ate": 40.0, "texto": "Você quer entender antes de decidir?", "em": 35.23, "opcoes": [{"texto": "Entender", "em": 35.93}, {"texto": "Perder", "em": 38.81}]},
    {"tipo": "cta", "de": 40.0, "ate": 43.067, "texto": "Toca aqui em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "em": 40.05}
  ]
}
```

Leitura do mapa: número (US$ 83.000 contando) → definição (Bull market) → comparação (mercado × bolso, vence o mercado) → destaque de alerta → `revisao` com os três motivos como erros sem número (`medida: false`) → pergunta → destaque `chave` → `conserto` com mercado, riscos e ativos → frase com "promessa de lucro" riscada → pergunta com duas opções → `cta` de link.
