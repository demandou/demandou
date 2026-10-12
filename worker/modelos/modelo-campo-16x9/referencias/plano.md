# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e corrige `palavras` quando a transcrição errou (SKILL.md, passo 4b).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: painel de campo em cima, pessoa embaixo
3. A assinatura: `talhao`
4. Os instrumentos próprios: `cotacao`, `medidor`, `previsao`
5. Os blocos universais
6. Regras de tempo
7. Legenda, correções e sons
8. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Lucas Ferraz", "area": "Engenheiro agrônomo" },
  "sfx": true,
  "correcoes": {},
  "semLegenda": []
}
```

- `marca`: `nome` (46 px, nunca menos de 34) e `area` (mono caixa alta, 28 px, nunca menos de 22) vão na tarja no terço de baixo da moldura, à esquerda, de 0,25 s a ~2,6 s. `nome` vazio = sem tarja.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão. (A `zona` não é usada: a pessoa fica sempre na moldura de baixo.)
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Para uma foto própria em `public/img/`, acrescente à mão: `"estufas": { "arquivo": "img/estufas.jpg", "largura": 2000, "altura": 1493, "palavra": "estufas" }` (com `"foco": { "x": 0.5, "y": 0.4 }` se a coisa não estiver no meio).

## 2. A gramática

A tela é **sempre dividida**: o **painel de campo** em cima (x 64 a 1016, y 132 a 976) e a **pessoa** embaixo, numa moldura larga (a partir de y 1012). A pessoa nunca muda de lugar; o que muda é o painel.

O template já faz sozinho:

- **Troca de bloco**: o bloco que sai some em 0,14 s enquanto o próximo pousa.
- **Câmera da pessoa**: troca de escala (100% ↔ 106%) em corte seco só quando o trecho anterior durou mais de 1 s; soco de 4% quando a variação da `cotacao` ou um `numero` bate. O rosto é seguido.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais das fontes e diminui o corpo até caber, sem cortar. Títulos de duas linhas quebram antes do trecho grifado.
- **Último momento**: o `cta` final (ou o que termina colado no fim) fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, **logo antes da palavra em que o próximo entra** (assim o painel nunca fica vazio: o que sai cruza com o que entra).
- **Um bloco por ideia**, de ~1,5 a 3,5 s; nada parado mais de ~2,5 s.

## 3. A assinatura: `talhao`

```json
{
  "tipo": "talhao", "de": 0, "ate": 2.32,
  "texto": "Produtor, olha isso.", "em": 0.27, "destaque": "olha isso.",
  "imagem": { "id": "estufas" },
  "areas": [ { "x": 0.086, "y": 0.100, "w": 0.195, "h": 0.185 }, { "x": 0.296, "y": 0.301, "w": 0.200, "h": 0.188 } ],
  "contornoEm": 0.27,
  "marcar": [ { "area": 1, "em": 1.45 } ]
}
```

- `texto` (opcional, até ~45 caracteres): título que se monta palavra por palavra no alto (48–82 px, 2 linhas); `destaque` = trecho com o grifo amarelo. Se `em` ≤ 0,4 s e o talhão abre o vídeo, a primeira palavra já está no primeiro quadro (gancho).
- `imagem` (opcional): a vista de cima. **Sem imagem**, o template desenha um mapa de lavoura (6 talhões: 0, 1, 2 em cima da esquerda para a direita; 3, 4, 5 embaixo), com a etiqueta "ilustrativo": é o modo para qualquer assunto.
- `areas`: os talhões **da foto**, em frações da imagem (`x`, `y` = canto de cima à esquerda; `w`, `h`), de 2 a 12. Marque olhando a foto com grade, seguindo as divisas que se veem. No mapa desenhado, deixe sem `areas` (ele usa os 6 dele).
- `contornoEm`: quando os contornos começam (padrão: `em`). Os talhões se contornam um a cada 0,07 s, na ordem da lista.
- `marcar`: os talhões que acendem um a um (`area` = índice em `areas`), cada um no `em` da palavra; `texto` (opcional, até ~24 caracteres, **só palavras ditas**) vira a estaca com o rótulo. A câmera voa até o talhão 0,35 s antes da palavra.
- Duração boa: 1,5 a 9 s (com um `marcar` a cada ~2 s).

## 4. Os instrumentos próprios

### `cotacao`: o indicador

```json
{ "tipo": "cotacao", "de": 2.32, "ate": 5.62, "rotulo": "Caixa do tomate", "em": 2.33, "direcao": "sobe",
  "sobeEm": 3.12, "valor": 30, "valorEm": 3.60, "sufixo": "%", "periodo": "no mês", "periodoEm": 4.55,
  "imagem": { "id": "caixas" } }
```

- `rotulo` (até ~28 caracteres): o que subiu ou caiu; entra palavra por palavra numa etiqueta sobre a foto (sem foto, grande no meio do painel) e depois fica no cabeçalho verde do indicador.
- A foto (`imagem`, opcional) entra em `em` e ocupa o painel inteiro até o movimento (`sobeEm`); aí ela recolhe para a faixa de cima e o cartão do indicador pousa já com o gráfico andando. Nunca há cartão vazio esperando o número.
- `direcao`: `sobe` (verde) ou `cai` (terra). `sobeEm`: a palavra do movimento ("subiu", "caiu", "rompeu"): o mini-gráfico começa a andar.
- `valor` + `valorEm`: **só o número dito**; conta em 0,6 s. `prefixo` padrão "+" (sobe) ou "−" (cai); `sufixo` padrão "%". Para um preço: `"prefixo": "R$ "`, `"sufixo": ""` ou `"US$ "` + `" mil"`. Sem número dito, omita `valor`: aparece a seta grande e a etiqueta "ilustrativo".
- `periodo` + `periodoEm` (opcional, só palavras ditas: "no mês", "na semana", "em um ano"): etiqueta amarela.

### `medidor`: o reservatório

```json
{ "tipo": "medidor", "de": 5.62, "ate": 7.88, "titulo": "Gotejamento", "em": 5.67, "fracao": 0.5,
  "mudaEm": 6.37, "fracaoEm": 7.02, "texto": "Gastou metade da água", "textoEm": 6.37, "destaque": "metade",
  "imagem": { "id": "gotejamento" } }
```

- `fracao`: a proporção **dita** ("metade" 0.5, "um terço" 0.333, "um quarto" 0.25, "três quartos" 0.75; "o dobro" 2: a escala dobra e o nível sobe de meio até o topo). Nunca escreva a porcentagem na tela se ela não foi dita.
- `titulo` (opcional, até ~20 caracteres): o contexto, numa etiqueta na foto (ou acima do texto, sem foto), em `em`.
- `mudaEm`: o nível começa a mudar ("gastou", "caiu", "usou"); `fracaoEm`: a palavra da fração (a marca amarela trava).
- `texto` (até ~40 caracteres, 3 linhas) se monta a partir de `textoEm` (padrão `fracaoEm`); `destaque` ganha o grifo.
- `cor`: `agua` (padrão), `terra` (ração, combustível, solo, dinheiro que vai embora) ou `verde` (o que cresce).

### `previsao`: o que está chegando

```json
{ "tipo": "previsao", "de": 9.30, "ate": 11.25, "texto": "A chuva volta na semana que vem", "em": 9.45,
  "destaque": "semana que vem", "agora": "sol", "chegada": "chuva", "chegaEm": 9.54,
  "quando": "semana que vem", "quandoEm": 10.29 }
```

- `texto` (até ~45 caracteres, 2 linhas) se monta no alto; `destaque` grifado (a quebra cai antes dele).
- `agora` / `chegada`: `sol`, `nuvem`, `chuva`, `tempestade`, `vento`, `geada`. A frente que chega entra em `chegaEm` (a palavra do clima, ou a palavra da ameaça numa metáfora: "risco", "crise") e os 3 quadros da direita viram.
- `quando` + `quandoEm` (opcional, **só palavras ditas**): a chave sob os quadros. Os quadros nunca têm dia, data, temperatura ou milímetro.

## 5. Os blocos universais

Os campos são os mesmos em todos os modelos do pack. Aqui eles acontecem no painel de campo.

- `abertura` `{ texto, destaque?, em? }`: até ~40 caracteres (108 px, até 3 linhas), com a estaca e os sulcos. Se `em` ≤ 0,2 s, a primeira palavra já está no primeiro quadro.
- `topicos` / `passos` `{ titulo?, itens: [{ texto, em, detalhe? }] }`: 2 a 5 itens, até ~40 caracteres cada (54 px, 2 linhas). `titulo` até ~50 caracteres.
- `numero` `{ valor, em, rotulo, rotuloEm?, prefixo?, sufixo?, casas?, ilustrativo? }`: conta em 0,9 s a partir de `em`, em mono; formato pt-BR. `rotulo` até ~50 caracteres.
- `comparacao` `{ titulo?, modo?, lados: [{ rotulo, texto, em, imagem? }, …], vencedor?, vencedorEm? }`: dois talhões; `rotulo` em mono (até ~16 caracteres), `texto` até ~40. `antes-depois`: o lado 0 com cabeçalho terra. `errado-certo`: ✗ e ✓.
- `grafico` `{ titulo?, forma, dados?, tendencia?, tendenciaEm?, unidade?, ilustrativo?, rotulos? }`: 2 a 6 dados ditos (`barras`, `linha` ou `pizza` = pivô central); sem dados, `tendencia` (`sobe`, `cai`, `oscila`) com "ilustrativo". **Prefira `rotulos`** (do Campo: 2 a 5 nomes, ex.: `["Sem gotejamento", "Com gotejamento"]`): colunas nomeadas, sem valor; as primeiras aparecem na entrada e a última (verde, com o broto) cresce em `tendenciaEm`, a palavra da comparação ("colheu mais"). Sem `rotulos`, 5 colunas anônimas brotam a partir de `tendenciaEm`. `unidade` curta (até 3 caracteres: "%", "t") vai junto do número; longa ("sacas por hectare") vira etiqueta.
- `destaque` `{ texto, em, nivel?, detalhe?, detalheEm? }`: até ~50 caracteres (96 px, 3 linhas) na placa.
- `definicao` `{ termo, em, significado, significadoEm }`: termo até ~24 caracteres; significado até ~120.
- `frase` `{ texto, destaque?, risco?, riscoEm?, em? }`: até ~110 caracteres (84 px, 4 linhas).
- `pergunta` `{ texto, opcoes?, em? }`: com 2 a 4 `opcoes` `{ texto, em }`, talhões coloridos em grade; sem opções, a pergunta grande com a estaca "?".
- `cta` `{ texto, icone?, destaque?, em?, material? }`: até ~40 caracteres. `icone`: `comentar` (padrão), `salvar`, `seguir`, `link`. `destaque` = a palavra-chave (grifo amarelo). `material` `{ texto, em, forma?, linhas? }`: o que ela oferece ("Planilha de custo da estufa", até ~50 caracteres), entrando no `em` da palavra que o nomeia. Com `linhas` (2 a 6 itens **escritos, sem números**, até ~24 caracteres: os que o usuário confirmar que o material tem), é a planilha de verdade: coluna ITEM e coluna ✓ marcando linha a linha; uma última linha "Total" ganha o amarelo. Sem `linhas`, é o arquivo (ícone de planilha ou lista, o nome e a seta de baixar). Nunca barras cinza de "carregando".

## 6. Regras de tempo

- Cada `em` é o início de uma palavra dita (±0,15 s). O `node ferramentas/timing.mjs` confere título, contorno, talhões marcados, rótulo, movimento, valor, período, nível, clima, "quando", chamada, material e o primeiro item de cada bloco.
- Nada fica parado mais de ~2,5 s: num talhão longo, mais um `marcar`; numa cotação longa, `periodo`.
- O `de` do bloco seguinte fica logo antes da palavra em que ele entra (0,01–0,1 s antes); o bloco anterior fica na tela até lá.
- O fechamento fica legível até o fim (o vídeo termina ~0,3 s depois da última palavra).
- O primeiro momento começa em 0.

## 7. Legenda, correções e sons

- **Legenda**: some em todos os blocos (o painel mostra a fala). Use `legenda: true` num momento para mantê-la. Ela fica numa pílula creme abaixo do queixo, até 4 palavras, a palavra dita com grifo amarelo, nunca juntando duas frases; não aparece enquanto a tarja está na tela.
- **`correcoes`**: troca de palavras na legenda (`{ "pivo": "pivô" }`). Para palavras com inserção, corrija `palavras` direto (passo 4b), porque o timing gate lê de lá.
- **Sons** (tonais, baixos): "toc" de madeira no contorno e na chave da previsão, kalimba nos itens e dados, pouso grave no talhão marcado, na chegada da previsão e no material, duas notas subindo na variação, no número e na chamada, uma gota no nível do medidor.

## 8. O exemplo completo (tomate em estufa, 14,3 s)

Fala: "Produtor, olha isso. A caixa do tomate subiu trinta por cento no mês. Quem irrigou por gotejamento gastou metade da água e colheu mais por hectare. E a chuva volta na semana que vem. Quer a planilha de custo da estufa? Comenta TOMATE."

```json
"marca": { "nome": "Lucas Ferraz", "area": "Engenheiro agrônomo" },
"momentos": [
  { "tipo": "talhao", "de": 0, "ate": 2.32, "texto": "Produtor, olha isso.", "em": 0.27, "destaque": "olha isso.",
    "imagem": { "id": "estufas" }, "areas": [ "…10 estufas marcadas na foto…" ], "contornoEm": 0.27, "marcar": [ { "area": 5, "em": 1.45 } ] },
  { "tipo": "cotacao", "de": 2.32, "ate": 5.62, "rotulo": "Caixa do tomate", "em": 2.33, "direcao": "sobe", "sobeEm": 3.12,
    "valor": 30, "valorEm": 3.60, "sufixo": "%", "periodo": "no mês", "periodoEm": 4.55, "imagem": { "id": "caixas" } },
  { "tipo": "medidor", "de": 5.62, "ate": 7.88, "titulo": "Gotejamento", "em": 5.67, "fracao": 0.5, "mudaEm": 6.37, "fracaoEm": 7.02,
    "texto": "Gastou metade da água", "textoEm": 6.37, "destaque": "metade", "imagem": { "id": "gotejamento" } },
  { "tipo": "grafico", "de": 7.88, "ate": 9.30, "titulo": "Colheu mais por hectare", "forma": "barras", "tendencia": "sobe", "tendenciaEm": 8.03,
    "rotulos": [ "Sem gotejamento", "Com gotejamento" ], "ilustrativo": true },
  { "tipo": "previsao", "de": 9.30, "ate": 11.25, "texto": "A chuva volta na semana que vem", "em": 9.45, "destaque": "semana que vem",
    "agora": "sol", "chegada": "chuva", "chegaEm": 9.54, "quando": "semana que vem", "quandoEm": 10.29 },
  { "tipo": "cta", "de": 11.25, "ate": 14.28, "texto": "Comenta TOMATE", "destaque": "TOMATE", "icone": "comentar", "em": 12.95,
    "material": { "texto": "Planilha de custo da estufa", "em": 11.30, "linhas": [ "Mudas", "Irrigação", "Adubo", "Mão de obra", "Total" ] } }
]
```

Repare: "colheu mais por hectare" não tem número, então virou duas colunas nomeadas sem valor, com "ilustrativo"; a planilha mostra itens escritos e ✓, sem valores; a previsão não tem dia nem milímetro; o único número na tela é o dito (30%).
