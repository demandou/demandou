# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: a mesa e a moldura
3. A assinatura: `comentario` e `print`
4. `foto`
5. Os 11 blocos universais
6. Regras de tempo
7. Legenda, correções e sons
8. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Finanças" },
  "sfx": true,
  "correcoes": {}
}
```

- `marca`: `nome` e `area` vão num cartão de perfil que abre o vídeo **quando nenhum momento começa até 0,6 s** (sem `nome`, nenhum cartão de perfil).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão (a `zona` não é usada neste modelo).
- `imagens`: escrito pelo `imagens.mjs`. Não mexa à mão.

## 2. A gramática

| Lugar | O que fica ali |
|---|---|
| **A mesa** (y 124 a 902) | um cartão por vez, centrado. O próximo sobe por trás da moldura da pessoa em 0,5 s, começando 0,12 s antes do `de` do momento, e empurra o anterior para cima, que some. Cartão mais alto que a mesa encolhe sozinho. |
| **A moldura da pessoa** (y 960 em diante) | o vídeo inteiro, sempre, com a cabeça inteira. Não muda de lugar. |
| **A legenda** | uma linha curta numa pílula escura, na emenda; some nos momentos com `legenda: false`. |

O template já faz sozinho: o feed, o marca-texto, o zoom do `print`, o corpo do texto (encaixa em 1 a 4 linhas e nunca vaza), a legenda, o rastreio do rosto e os sons. Um momento nunca invade o seguinte.

Campos de todo momento: `tipo`, `de`, `ate` e `legenda?` (`true` = a legenda continua; `false` = some; padrão: some, exceto em `foto`). Use `legenda: true` nos cartões cujo texto **não** repete a fala (`print`, `foto`, `numero`) e deixe `false` onde o cartão já escreve o que é dito (`comentario`, `abertura`, `frase`, `cta`, `destaque`).

## 3. A assinatura

### `comentario` — o comentário que a pessoa responde

```json
{ "tipo": "comentario", "de": 0.33, "ate": 4.18, "autor": "marcos", "texto": "A IA vai acabar com o editor de vídeo?", "em": 1.85, "legenda": false }
```

- `autor`: sem `@`. O avatar é uma bolinha colorida com a inicial.
- `texto`: o comentário, com as palavras ditas (até ~120 caracteres: o corpo vai de 84 a 44 px).
- `em`: o instante da primeira palavra do comentário que a pessoa lê. O marca-texto acompanha a leitura palavra por palavra a partir dele. Se a pessoa diz "Respondendo o Marcos" antes, o `de` fica no começo e o `em` na primeira palavra do comentário.
- `respondendo: false`: tira a aba laranja "Respondendo".
- Abre o vídeo: coloque `de` perto de 0 (o cartão sobe de trás da moldura nos primeiros 0,5 s).

### `print` — post, manchete ou print de verdade

```json
{ "tipo": "print", "de": 6.4, "ate": 9.05, "forma": "manchete", "fonte": "Manchete",
  "texto": "Câmera digital: o fotógrafo vai acabar?",
  "grifos": [{ "trecho": "fotógrafo vai acabar", "em": 7.15 }],
  "risco": { "trecho": "vai acabar?", "em": 8.49 }, "legenda": true }
```

- Três jeitos de usar:
  1. **Post desenhado** (`forma: "post"`, padrão): cabeçalho com avatar genérico, `autor` (padrão "Post") e `fonte` numa etiqueta; `texto` embaixo (até ~220 caracteres).
  2. **Manchete desenhada** (`forma: "manchete"`): faixa escura com `fonte` (ou `autor`) em caixa alta e o texto grande (até ~110 caracteres).
  3. **Print de verdade do usuário**: `imagem: { "id": "..." }` do tipo `print` (da pasta `imagens/`) e **sem `texto`**. Com `texto` **e** `imagem`, a imagem vira a foto dentro do post.
- `grifos`: trechos marcados com o marca-texto. Cada um: `trecho` (palavras exatas do `texto`) **ou** `area` (no print de verdade, em frações da imagem: `{ "x": 0.1, "y": 0.4, "w": 0.7, "h": 0.12 }`), mais o `em` da palavra em que a pessoa começa a ler esse trecho. O marca-texto varre o trecho no ritmo da fala e a câmera aproxima (10 a 22%), segurando até o próximo grifo ou até o `risco`.
- `risco`: `{ "trecho": "...", "em": ... }` risca em vermelho o que foi **desmentido**, no `em` da palavra do desmentido ("não é bem assim", "falso", "acabou").
- `zoom: false`: não aproxima.
- Nunca invente um print de notícia ou de rede social: o `print` desenhado é genérico e traz só as palavras da fala.

## 4. `foto`

```json
{ "tipo": "foto", "de": 4.27, "ate": 6.4, "imagem": { "id": "camera", "efeito": "aproximar" }, "rotulo": "Câmera digital", "rotuloEm": 5.2 }
```

Cartão de foto (960×620) com aproximação lenta. `rotulo` (opcional, curto) é uma etiqueta amarela com a palavra dita, entra em `rotuloEm`. A legenda continua. Sem imagem boa, o cartão vira uma cartela tipográfica com a palavra.

## 5. Os 11 blocos universais

Os campos são os de `references/adaptar.md` (`abertura`, `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `frase`, `pergunta`, `cta`). Limites neste modelo:

| Tipo | Limites |
|---|---|
| `abertura` | `texto` até ~70 caracteres (corpo 112 a 58 px, 4 linhas); `destaque` = trecho exato que ganha o marca-texto |
| `topicos`, `passos` | 2 a 5 itens; `texto` do item até ~55 caracteres; `detalhe` até ~70; `titulo` até ~30 (caixa alta laranja) |
| `numero` | `valor` até 7 dígitos; `prefixo` curto ("R$ "), `sufixo` curto ("%", "×", " mil"); `rotulo` até ~45 caracteres |
| `comparacao` | `rotulo` até ~18 caracteres; `texto` de cada lado até ~50; `modo`: `contra` (azul × laranja), `antes-depois` (cinza × laranja), `errado-certo` (vermelho × verde) |
| `grafico` | `barras` 2 a 6 dados (`rotulo` até ~14 caracteres); `linha` 2 a 6 pontos; `pizza` 2 a 4 fatias; sem `dados`, `tendencia` + `ilustrativo: true` |
| `destaque` | `texto` até ~30 caracteres (corpo 124 a 60 px); `detalhe` até ~80; `nivel`: `chave` (cartão escuro com marca-texto) ou `alerta` (coral com ícone) |
| `definicao` | `termo` até ~28 caracteres; `significado` até ~110 |
| `frase` | `texto` até ~90 caracteres; `destaque` e `risco` = trechos exatos |
| `pergunta` | `texto` até ~80 caracteres; `opcoes` 2 a 4 (até ~35 caracteres cada) |
| `cta` | `texto` até ~55 caracteres; `icone`: `salvar`, `seguir`, `comentar` ou `link`; `destaque` = trecho exato |

## 6. Regras de tempo

- Um momento termina quando o próximo começa; o cartão novo começa a subir 0,12 s antes do `de`. Deixe os momentos **encostados** (o `ate` de um é o `de` do outro) para a mesa nunca ficar vazia.
- Cada item, lado, dado e opção entra no `em` da palavra que o nomeia.
- Um momento de texto precisa de pelo menos 1,2 s para ser lido; um cartão de foto, de 1,5 s.
- Momentos com pouco texto (número, destaque) e `print` com zoom pedem 2 a 3 s.
- O cartão não pode abrir antes de a pessoa dizer o assunto dele: `de` perto da primeira palavra.

## 7. Legenda, correções e sons

- A legenda vem das `palavras` de `cortar.mjs`; `legenda: false` esconde-a no momento. Nomes errados vão em `correcoes` (`{ "chat GPT": "ChatGPT" }`); a correção vale só para a legenda e para os cartões que usam o texto falado. Só corrija o que você tem certeza.
- `semLegenda`: `[{ "de": 3, "ate": 4.5 }]` apaga a legenda numa faixa.
- Sons (`public/sfx`, tonais e raros): bolha quando o cartão sobe, toque em cada grifo e item, duas notas no riscado e no alerta, grave no número e no destaque, três notas no fechamento. `sfx: false` desliga.

## 8. O exemplo completo

O plano do demo (resposta a um seguidor sobre IA e edição) está em `assets/template/src/plano.json`. Resumo:

```json
[
  { "tipo": "comentario", "de": 0.33, "ate": 4.18, "autor": "marcos", "texto": "A IA vai acabar com o editor de vídeo?", "em": 1.85, "legenda": false },
  { "tipo": "foto", "de": 4.27, "ate": 6.4, "imagem": { "id": "camera", "efeito": "aproximar" }, "rotulo": "Câmera digital", "rotuloEm": 5.2 },
  { "tipo": "print", "de": 6.4, "ate": 9.05, "forma": "manchete", "fonte": "Manchete", "texto": "Câmera digital: o fotógrafo vai acabar?",
    "grifos": [{ "trecho": "fotógrafo vai acabar", "em": 7.15 }], "risco": { "trecho": "vai acabar?", "em": 8.49 }, "legenda": true },
  { "tipo": "destaque", "de": 9.05, "ate": 12.02, "texto": "Com a IA é igual", "em": 9.06, "nivel": "chave", "detalhe": "Quem sabe pedir o que quer", "detalheEm": 10.28 },
  { "tipo": "numero", "de": 12.02, "ate": 13.33, "valor": 10, "em": 12.17, "rotulo": "vezes mais", "rotuloEm": 12.62, "sufixo": "×", "legenda": true },
  { "tipo": "cta", "de": 13.37, "ate": 15.2, "texto": "Deixe a sua pergunta aqui embaixo", "icone": "comentar", "em": 13.37 }
]
```

E o `work/imagens.json` que gerou a foto:

```json
[ { "id": "camera", "em": 5.58, "palavra": "câmera digital", "busca": "digital camera", "tipo": "foto" } ]
```

A busca "photographer taking pictures" não trouxe nada que servisse (palco, foto antiga, pintura): foi para `--escolher fotografo 0` e o assunto ficou na manchete.
