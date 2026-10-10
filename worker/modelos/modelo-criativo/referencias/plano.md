# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `cor`, `variantes`, `momentos`, `semLegenda` e `correcoes`, e corrige `palavras` quando a transcrição errou.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado** (o plano principal tem todos os ganchos seguidos e o corpo). Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. Variantes de gancho
3. A gramática: pessoa em quadro cheio, legenda, palco e botão
4. A assinatura: `heroi` e `prova`
5. Os efeitos próprios: `gancho` e `selo`
6. Os blocos universais
7. Regras de tempo
8. Legenda, correções e sons
9. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Rafael Duarte", "area": "Corredor" },
  "cor": "",
  "sfx": true,
  "correcoes": { "Clique": "Clica" },
  "semLegenda": []
}
```

- `marca`: `nome` (até 46 px, mínimo 34, em até 2 linhas) e `area` (até 30 px) num cartão de perfil de vidro fumê no canto de cima à esquerda (x 64, y 214, abaixo da zona da plataforma), na largura livre ao lado da cabeça, de 0,25 s a ~3 s de cada variante. `nome` vazio = sem tarja.
- `cor`: a cor da marca do produto em hexadecimal (`"#1E88FF"`). É o **único destaque** do vídeo (botão, selos, ✓, números, palavra-chave). Vazio = laranja-sinal `#FF6A13`. O texto em cima do destaque escolhe sozinho tinta ou branco (o de maior contraste).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão.
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Para uma imagem própria já pronta em `public/img/`, acrescente à mão:
  - recorte do produto (PNG transparente): `"garrafa": { "arquivo": "img/garrafa.png", "largura": 412, "altura": 1100, "transparente": true, "palavra": "garrafa" }`;
  - foto de prova: `"gelo": { "arquivo": "img/gelo.jpg", "largura": 1185, "altura": 881, "foco": { "x": 0.4, "y": 0.5 }, "palavra": "água gelada" }`. O `foco` (frações da imagem) é o ponto que fica no centro do cartão.

## 2. Variantes de gancho

```json
"variantes": {
  "ganchos": [
    { "nome": "A", "de": 0, "ate": 2.86 },
    { "nome": "B", "de": 2.86, "ate": 6.79 },
    { "nome": "C", "de": 6.79, "ate": 9.3 }
  ],
  "corpo": { "de": 9.3, "ate": 18.52 }
}
```

- `ganchos`: 2 ou 3 (até 5), na ordem do vídeo cortado. `de`/`ate` na pausa entre as frases (o `ate` de um = o `de` do próximo). `nome` vira o nome do arquivo (`… - gancho A.mp4`).
- `corpo`: do fim do último gancho até o fim do vídeo.
- `node scripts-modelo/variantes.mjs` monta cada variante assim:
  - **o gancho** começa 0,1 s antes da primeira palavra dele e termina 0,12 s depois da última;
  - **o corpo** começa 0,1 s antes da primeira palavra e termina **0,3 s depois da última palavra**;
  - os dois são emendados em corte seco (a câmera troca de escala na emenda); todos os tempos dos momentos, das palavras e dos cortes são refeitos;
  - os momentos que começam dentro do gancho X vão para a variante X; os que começam no corpo vão para todas.
- Os planos montados ficam em `out/variantes/plano-<nome>.json` (com `trechos` e `variante`): use-os com `node ferramentas/timing.mjs --plano out/variantes/plano-B.json`.
- **Cada gancho tem o seu momento começando no `de` dele** (o primeiro quadro da variante já está montado). Momentos de um gancho não podem passar para dentro do próximo.

## 3. A gramática

A pessoa fica **sempre em quadro cheio**, com o rosto onde foi gravado. Por cima dela, quatro lugares fixos:

- **legenda**: logo abaixo do queixo (y ≈ queixo + 74, já contando a maior aproximação), sempre ligada;
- **botão** (só no `cta`): 112 px abaixo do centro da legenda;
- **palco**: do topo da legenda + 66 px até y 1632, de x 64 a 1016 (~952 × 687 px). Um cartão por vez. No `cta`, o palco começa abaixo do botão;
- **zona segura do Ads**: nada importante acima de y 192 (10%) nem abaixo de y 1651 (14%); margem lateral de 64 px.

O template já faz sozinho:

- **Câmera**: troca de escala em corte seco a cada tomada e na emenda gancho → corpo (100% ↔ 107%), aproxima 1,5% a cada 3 s (no máximo 3%), soco de 4% no número, no selo, no destaque e no toque do botão. O rosto é seguido.
- **Primeiro quadro montado**: um momento com `de` ≤ 0,05 s (o primeiro de cada variante) já aparece inteiro no quadro 0, e a primeira linha da legenda também.
- **Troca de cartão**: o que sai some em 0,14 s (encolhe 3%) enquanto o próximo entra; uma `prova` seguida de outra `prova` mantém o cartão e só a foto troca.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da Sora e diminui o corpo até caber, sem cortar.
- **Último momento**: o `cta` (ou o que termina colado no fim) fica até o último quadro.

## 4. A assinatura

### `heroi`: o produto num cartão de vidro com profundidade

```json
{ "tipo": "heroi", "de": 6.79, "ate": 9.3, "imagem": { "id": "garrafa" }, "em": 6.88, "palavra": "Essa",
  "titulo": "Vai comigo em todo treino", "tituloEm": 7.65, "destaque": "todo treino" }
```

- `imagem`: de preferência o **recorte do produto** (PNG transparente): ele fica em pé à esquerda do cartão, passando ~130 px da borda de cima, com sombra de contato; aproxima mais rápido que o cartão. Uma foto comum preenche a metade esquerda do cartão.
- `icone` (modo ilustrativo, sem imagem): um bloco de vidro 3D na cor da marca com o ícone (`play` para aula/vídeo, `estrela`, `presente`, `raio`, `coracao`, `cifrao`…).
- `em`: a palavra que nomeia o produto ("essa", "garrafa", "o curso"); `palavra`: essa palavra, para o timing gate.
- `titulo` (opcional): até ~40 caracteres (70 px, 3 linhas, reduz até 40), à direita do produto; entra **junto com o cartão**, já escrito, e as palavras acendem na fala a partir de `tituloEm` (nunca um cartão vazio esperando o texto). `destaque`: o trecho na cor da marca, com um traço.
- `etiquetas` (opcional): `[{ "texto": "500 ml", "em": 3.2, "icone": "raio" }]` — pílulas fumê que saltam embaixo à direita do cartão, cada uma na sua palavra (até 3, ~20 caracteres).

### `prova`: o benefício com a prova visual literal

```json
{ "tipo": "prova", "de": 9.3, "ate": 12.08, "imagem": { "id": "gelo" }, "em": 9.42, "palavra": "Ela",
  "texto": "Mantém a água gelada", "textoEm": 9.45, "numero": { "valor": 24, "em": 11.13, "sufixo": "horas" } }
```

- `imagem`: a foto do **mesmo produto na situação dita** (com gelo, na mochila, no porta-copo; a tela do app com o resultado; o cliente usando). O cartão é deitado (~924 × 650): foto deitada, ou `foco` no produto.
- `icone` (modo ilustrativo, sem foto): o ícone num bloco de vidro 3D, num cartão fumê.
- `em`: a palavra que nomeia o que a foto mostra; `palavra`: essa palavra (timing gate).
- `texto`: o benefício curto (até ~32 caracteres; 60 px em até 2 linhas, reduz até 40), numa faixa fumê com o ✓ na cor da marca, palavra por palavra a partir de `textoEm` (a primeira palavra dita do benefício).
- `numero` (opcional, **só se dito**): `{ valor, em, prefixo?, sufixo?, casas? }` — um selo redondo na cor da marca no canto de cima à direita da foto, que **bate já no valor dito** na palavra (o anel enche em 0,6 s em volta); `sufixo` vai embaixo do número ("horas", "%", "dias").
- `nivel: "contra"`: um problema (✗ coral no lugar do ✓): "mercado subindo não é dinheiro no bolso".
- `telaCheia` (opcional): um instante; a foto começa cobrindo a tela inteira e encolhe para o cartão nesse instante (use uma foto **em pé**). Bom para a primeira prova ou para um gancho.
- `etiquetas` (opcional): no canto de cima à esquerda da foto.
- **Provas seguidas** (`de` de uma = `ate` da outra): o cartão continua, a faixa nova entra ~0,12 s depois e a foto nova passa por cima da anterior no `em` dela (cortina da direita para a esquerda). Por isso, a faixa pode começar antes da foto ("Não vaza" em "não", a foto da mochila em "mochila").

## 5. Os efeitos próprios

### `gancho`: a manchete montada no primeiro quadro

```json
{ "tipo": "gancho", "de": 0, "ate": 2.86, "texto": "Não segura o gelo?", "destaque": "gelo", "em": 1.62, "icone": "gelo", "iconeEm": 2.39 }
{ "tipo": "gancho", "de": 2.86, "ate": 6.79, "texto": "No carro fechado, no sol, o dia inteiro", "destaque": "o dia inteiro", "em": 3.91,
  "imagem": { "id": "carro-sol" }, "telaCheia": 4.38, "icone": "sol", "iconeEm": 5.39 }
```

- `texto`: a manchete do gancho (até ~45 caracteres; 88 px sem foto, 70 px com foto, até 3 linhas). **A ideia-chave curta, com as palavras da fala** ("Não segura o gelo?" para "Para de comprar garrafa que não segura o gelo"): a legenda já mostra a frase inteira, a manchete não a repete palavra por palavra. **No começo da variante ela já está inteira**; as palavras acendem quando são ditas a partir de `em` (a primeira palavra dita da manchete) e o `destaque` vira a cor da marca com um traço embaixo.
- `imagem` (opcional): uma foto da situação num cartão acima da placa (a placa cobre a base da foto). Com `telaCheia`, a foto começa em tela cheia e encolhe para o cartão nesse instante, revelando a pessoa (deixe ~1,2–1,6 s em tela cheia).
- `icone` + `iconeEm` (opcional): um adesivo redondo na cor da marca com o ícone (`gelo`, `sol`, `relogio`, `carro`, `mochila`, `treino`, `alerta`, `raio`…), na palavra que o nomeia.
- `etiquetas` (opcional): embaixo da placa (sem foto) ou no canto de cima à esquerda da foto.

### `selo`: o adesivo da oferta

```json
{ "tipo": "selo", "de": 17.31, "ate": 18.52, "texto": "Frete grátis", "em": 17.31, "icone": "frete" }
```

- Um disco de 276 px na cor da marca, borda branca, o ícone e o `texto` (até ~22 caracteres, 2 linhas em caixa alta) no meio; carimba (entra girado e maior) em `em` e o anel tracejado gira devagar. Fica **no canto de cima à direita do cartão da vez** (é uma camada: o cartão continua).
- `icone`: `frete`, `garantia`, `desconto`, `presente`, `estrela`, `relogio`.
- Só o que foi dito. Evite um selo ao mesmo tempo que o `numero` de uma prova (os dois ficam no mesmo canto).

## 6. Os blocos universais

Os campos são os mesmos em todos os modelos do pack. Aqui eles acontecem no palco, em vidro.

- `abertura` `{ texto, destaque?, em? }`: igual ao `gancho` sem foto.
- `topicos` / `passos` `{ titulo?, itens: [{ texto, em, detalhe? }] }`: 2 a 5 itens (até ~30 caracteres, 54 px, 2 linhas), numa placa fumê; ✓ na cor da marca (`topicos`) ou discos numerados ligados por um traço (`passos`). `titulo` até ~36 caracteres.
- `numero` `{ valor, em, rotulo, rotuloEm?, prefixo?, sufixo?, casas?, ilustrativo?, imagem? }`: conta em 0,45 s a partir de `em`, pt-BR, até 210 px na cor da marca; `rotulo` até ~50 caracteres.
- `comparacao` `{ titulo?, modo?, lados: [{ rotulo, texto, em, imagem? }, …], vencedor?, vencedorEm? }`: dois cartões claros; antes de cada lado ser dito, o lugar dele espera tracejado. `errado-certo`: ✗ e ✓; `contra`: "VS" no meio; `antes-depois`: seta.
- `grafico` `{ titulo?, forma, dados?, tendencia?, tendenciaEm?, unidade?, ilustrativo? }`: 2 a 6 dados ditos; sem dados, a curva com "ilustrativo".
- `destaque` `{ texto, em, nivel?, detalhe?, detalheEm? }`: até ~30 caracteres (120 px, caixa alta, 2 linhas).
- `definicao` `{ termo, em, significado, significadoEm }`: termo até ~20 caracteres; significado até ~120.
- `frase` `{ texto, destaque?, risco?, riscoEm?, em? }`: até ~90 caracteres.
- `pergunta` `{ texto, opcoes?, em? }`: com 2 a 4 `opcoes` `{ texto, em }` (pílulas claras, a da vez na cor da marca); sem opções, um "?" balançando no canto.
- `cta` `{ texto, icone?, destaque?, em?, toqueEm?, imagem?, titulo?, tituloEm? }`:
  - `texto`: o que o **botão** diz (só o que foi dito: "Saiba mais", "Compre agora", "Chama no direct"; até ~20 caracteres, 56 px). O botão entra em `em` (a primeira palavra do texto dita); a seta aponta para baixo, para o botão da plataforma (`icone` `comentar`/`salvar`/`seguir` troca a seta).
  - `toqueEm`: o dedo toca o botão (padrão: 0,5 s depois de `em`).
  - `imagem`: o produto no cartão final (como o `heroi`); `titulo` + `tituloEm`: a frase ao lado ("Garante a sua"). Sem imagem, o `titulo` vai numa placa fumê.

## 7. Regras de tempo

- Cada `em` é o início de uma palavra dita (±0,15 s). `node ferramentas/timing.mjs` confere a manchete, o ícone, o produto, a foto, o benefício, o número, o selo, o botão e o primeiro item de cada bloco.
- O Whisper às vezes marca palavras com consoante surda ("cabe", "vinte e quatro") até ~0,2 s antes do som. Na dúvida, meça o volume em volta (`ffmpeg -ss <t> -t 0.6 -i public/base.mp4 -af volumedetect -f null -`, ou olhe a forma de onda) e corrija o `em` em `palavras`.
- Nada fica parado mais de ~2,5 s: numa prova longa, use `numero` ou `etiquetas`; num herói longo, `etiquetas`.
- O primeiro momento de cada gancho começa no `de` do gancho; o primeiro do corpo, no `de` do corpo.
- O número aparece **no valor dito, na palavra** (o selo da prova bate direto; o bloco `numero` conta em 0,45 s). Deixe ~0,6 s antes da próxima prova.
- O `cta` fica até o fim; o selo, de preferência, ≥ 1 s na tela.

## 8. Legenda, correções e sons

- **Legenda**: sempre ligada (anúncio é visto sem som), numa pílula de vidro fumê logo abaixo do queixo, até 4 palavras, a palavra dita na cor da marca, nunca juntando duas frases. `legenda: false` num momento só se um cartão já mostra exatamente a mesma fala (raro aqui).
- **`correcoes`**: troca de palavras na legenda (`{ "Clique": "Clica" }`). Para tempos e números, corrija `palavras` direto (o timing gate lê de lá).
- **Sons** (tonais, baixos): "pop" grave no herói, no adesivo do gancho, no destaque e no toque do botão; nota de marimba em cada foto de prova (subindo); "toc" quando o número termina de contar; duas notas no selo; uma virada quando a foto em tela cheia encolhe.

## 9. O exemplo completo (garrafa térmica, 3 ganchos + corpo, 18,5 s no plano principal)

Fala: [A] "Para de comprar garrafa que não segura o gelo." [B] "Deixei essa garrafa no carro fechado, no sol, o dia inteiro." [C] "Essa é a garrafa que vai comigo em todo treino." [corpo] "Ela mantém a água gelada por vinte e quatro horas, não vaza na mochila e cabe no porta-copo do carro. Clica em saiba mais e garante a sua com frete grátis."

```json
"marca": { "nome": "Rafael Duarte", "area": "Corredor" },
"variantes": { "ganchos": [ { "nome": "A", "de": 0, "ate": 2.86 }, { "nome": "B", "de": 2.86, "ate": 6.79 }, { "nome": "C", "de": 6.79, "ate": 9.3 } ],
               "corpo": { "de": 9.3, "ate": 18.52 } },
"momentos": [
  { "tipo": "gancho", "de": 0, "ate": 2.86, "texto": "Não segura o gelo?", "destaque": "gelo", "em": 1.62, "icone": "gelo", "iconeEm": 2.39 },
  { "tipo": "gancho", "de": 2.86, "ate": 6.79, "texto": "No carro fechado, no sol, o dia inteiro", "destaque": "o dia inteiro", "em": 3.91,
    "imagem": { "id": "carro-sol" }, "telaCheia": 4.38, "icone": "sol", "iconeEm": 5.39 },
  { "tipo": "heroi", "de": 6.79, "ate": 9.3, "imagem": { "id": "garrafa" }, "em": 6.88, "palavra": "Essa",
    "titulo": "Vai comigo em todo treino", "tituloEm": 7.65, "destaque": "todo treino" },
  { "tipo": "prova", "de": 9.3, "ate": 12.08, "imagem": { "id": "gelo" }, "em": 9.42, "palavra": "Ela",
    "texto": "Mantém a água gelada", "textoEm": 9.45, "numero": { "valor": 24, "em": 11.13, "sufixo": "horas" } },
  { "tipo": "prova", "de": 12.08, "ate": 13.48, "imagem": { "id": "mochila" }, "em": 12.8, "palavra": "mochila", "texto": "Não vaza na mochila", "textoEm": 12.08 },
  { "tipo": "prova", "de": 13.48, "ate": 15.21, "imagem": { "id": "porta-copo" }, "em": 13.89, "palavra": "porta-copo", "texto": "Cabe no porta-copo do carro", "textoEm": 13.7 },
  { "tipo": "cta", "de": 15.21, "ate": 18.52, "texto": "Saiba mais", "em": 15.49, "toqueEm": 15.62, "icone": "link",
    "imagem": { "id": "garrafa" }, "titulo": "Garante a sua", "tituloEm": 16.26 },
  { "tipo": "selo", "de": 17.31, "ate": 18.52, "texto": "Frete grátis", "em": 17.31, "icone": "frete" }
]
```

As variantes: **A** 11,84 s, **B** 13,12 s, **C** 11,68 s. Cada uma termina ~0,3 s depois de "grátis".

O mesmo estilo num anúncio de cripto (aula gratuita, 43 s, só o plano): `gancho` "O Bitcoin rompeu os 83 mil dólares" (ícone de gráfico), `definicao` de bull market, `prova` contra com `icone: "cifrao"` ("Não significa dinheiro no bolso" + etiqueta "para a maioria"), `topicos` (os 3 erros de quem perde na alta), `pergunta`, `heroi` ilustrativo com `icone: "play"` ("Aula gratuita" + etiquetas "o mercado", "os riscos", "a escolha dos ativos"), `selo` "Sem promessa de lucro", `frase` "Entender antes de decidir" e `cta` "Saiba mais" com o título "Assiste essa aula agora".
