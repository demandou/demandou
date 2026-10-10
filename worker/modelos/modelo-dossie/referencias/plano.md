# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita (o `ferramentas/timing.mjs` confere: ±0,15 s).

## Sumário

1. Campos gerais
2. A gramática: o quadro, a câmera e o fio
3. A assinatura: `quadro`
4. Os 11 blocos universais
5. Regras de tempo
6. Legenda, correções e sons
7. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Rafael Moura", "area": "Golpes e fraudes" },
  "sfx": true,
  "correcoes": { "PIX": "Pix", "banco,": "banco." }
}
```

- `marca`: `nome` (Sora, ≥ 34 px) e `area` (datilografada) vão numa etiqueta manila dentro da moldura da pessoa, de 0,25 s a 5,5 s (sem `nome`, sem etiqueta).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão (a `zona` não é usada neste modelo).
- `imagens`: escrito pelo `imagens.mjs`. Não mexa à mão.

## 2. A gramática

| Lugar | O que fica ali |
|---|---|
| **O quadro** (y 0 a 1040) | a cortiça escura. Cada momento vira uma peça presa num ponto do quadro, em anel em volta de um centro livre (blocos de 3×3, sentido horário a partir do canto de cima à esquerda). A câmera enquadra a peça atual a ~80% da área segura (x 64 a 1016, y 130 a 1006); as vizinhas e o fio aparecem cortados nas bordas. |
| **A viagem** | quando a peça nova é dita, a câmera sai da anterior ~0,27 s antes da palavra e chega 0,08 s depois (≤ 0,35 s, com leve desfoque de movimento). O fio vermelho estica do pino da peça anterior até o pino da nova e chega na palavra; a peça assenta na palavra. As peças ficam presas: o quadro acumula o caso. |
| **O quadro inteiro** | o primeiro `destaque` depois de 3 peças vai para o centro do bloco: a câmera recua e mostra todas as peças, os fios de todas convergem para o memorando, o carimbo bate no `em` e a câmera aproxima devagar até a próxima viagem. Reserve 2 a 3 s para ele. |
| **A pessoa** (y 1064 em diante) | a moldura larga, o vídeo inteiro, cabeça inteira. Não muda de lugar. |
| **A legenda** | uma linha em Sora numa faixa escura translúcida, abaixo do queixo. |

O template faz sozinho: a posição das peças, a câmera, os fios e os pinos (o fio prende no lado de onde vem a outra peça e não atravessa papel), o tamanho do texto (encaixa e nunca vaza), a legenda, o rastreio do rosto e os sons. Um momento nunca invade o seguinte.

Campos de todo momento: `tipo`, `de`, `ate` e `legenda?`. Padrão: a legenda aparece em `quadro`, `numero`, `grafico` e `comparacao` e some nos outros (que já escrevem a fala). `true`/`false` troca.

## 3. A assinatura: `quadro`

```json
{ "tipo": "quadro", "de": 2.95, "ate": 12.12, "evidencias": [
  { "em": 3.89, "forma": "ligacao", "titulo": "Central de Segurança", "texto": "Seu banco", "textoEm": 4.78, "icone": "predio" },
  { "em": 5.45, "forma": "ficha", "titulo": "Eles já sabem",
    "campos": [{ "rotulo": "Nome", "tarja": true, "em": 6.71 }, { "rotulo": "CPF", "tarja": true, "em": 7.57 }] },
  { "em": 8.5, "forma": "alerta", "titulo": "Central de Segurança", "texto": "Pix suspeito" },
  { "em": 10.18, "forma": "mensagem", "titulo": "Central de Segurança", "icone": "predio",
    "texto": "Faça outro Pix pra proteger sua conta.", "destaque": "proteger sua conta", "destaqueEm": 11.17 }
] }
```

- Cada prova é uma estação do quadro: a câmera chega e ela assenta no `em` (a palavra que a nomeia). De 2 a 6 provas por `quadro`; entre uma e outra, **pelo menos 1,2 s** (para ler).
- `forma` (padrão: `foto` com `imagem`, senão `ficha`):

| `forma` | Como aparece | Campos |
|---|---|---|
| `foto` | polaroide com aproximação lenta | `imagem` (obrigatória), `titulo` = legenda na borda branca (até ~40 caracteres) |
| `ficha` | ficha datilografada | `titulo` (até ~40), `campos` (até 4: `rotulo` curto + `valor` datilografado **ou** `tarja: true`, cada um no seu `em`), `texto` (observação, até ~110), `destaque` |
| `ligacao` | celular tocando (vibra, ondas) | `titulo` = quem liga (até ~36), `texto` = linha de baixo (até ~30) em `textoEm`, `icone` |
| `mensagem` | print de conversa | `titulo` = quem mandou, `texto` = a mensagem (até ~120), `destaque` + `destaqueEm` (tarja de tinta), `icone` |
| `alerta` | print de notificação | `titulo` = de onde vem (até ~30), `texto` = o aviso (até ~50), palavra por palavra a partir de `textoEm`, `destaque` |

- `rotulo`: a etiqueta da prova (padrão "PROVA A", "PROVA B"… na ordem do vídeo inteiro).
- `icone`: `pessoa` (padrão) ou `predio` (empresa, banco, órgão). Nunca logo de marca.
- `tarja: true` = o dado existe mas **não foi dito** (ou é sensível): aparece a barra de censura, nunca um valor inventado.
- `destaque` = trecho exato de `texto`; ganha a tarja de tinta (fundo tinta, letra papel) em `destaqueEm`.

## 4. Os 11 blocos universais

Os campos são os de `references/adaptar.md`. Extras e limites neste modelo:

| Tipo | Campos extras | Limites |
|---|---|---|
| `abertura` | `abreEm` (a capa abre; padrão `de` + 0,15), `carimbo` (padrão "CONFIDENCIAL") + `carimboEm`, `imagem` + `imagemEm` (polaroide com clipe), `rotulo` (etiqueta da capa, padrão "DOSSIÊ") | `texto` até ~60 caracteres (corpo 108 a 54 px, 3 linhas); `destaque` = trecho exato (tarja de tinta) |
| `topicos`, `passos` | — | 2 a 5 itens; `texto` até ~50; `detalhe` até ~45 (1 linha); `titulo` até ~30 (fita de etiquetadora) |
| `numero` | — | `valor` até 7 dígitos; `prefixo` curto ("R$ ", "US$ "); `sufixo` curto ("%", " mil"); `rotulo` até ~70 (palavra por palavra a partir de `rotuloEm`) |
| `comparacao` | — | `rotulo` até ~18 (datilografado); `texto` de cada lado até ~70; `vencedor` → carimbo CONFIRMADO; `errado-certo` → FALSO no lado 0 |
| `grafico` | — | `barras` 2 a 6 dados (`rotulo` até ~14); `linha` 2 a 6 pontos; `pizza` 2 a 4 fatias; sem `dados`, `tendencia` + `ilustrativo: true`; `titulo` até ~50 |
| `destaque` | — | `texto` = o carimbo, até ~30 caracteres (3 linhas, corpo 164 a 64 px: legível com o quadro inteiro na tela); `detalhe` até ~24 vira datilografado, até ~110 vira texto; `nivel` `alerta` (rótulo ALERTA) ou `chave` (CONCLUSÃO) |
| `definicao` | — | `termo` até ~28; `significado` até ~140 |
| `frase` | — | `texto` até ~120; `destaque` e `risco` = trechos exatos |
| `pergunta` | — | `texto` até ~90; `opcoes` 2 a 4 (até ~30 cada) |
| `cta` | `carimbo` (padrão pelo ícone: SALVE ESTE CASO, SIGA O CASO, COMENTE, LINK NA BIO) + `carimboEm`, `imagem` + `imagemEm` | `texto` até ~50 (3 a 4 linhas); `icone`: `salvar`, `seguir`, `comentar` ou `link`; `destaque` = trecho exato |

- O `cta` como **último momento** de um vídeo que abriu com `abertura` leva a câmera de volta para a mesma pasta, que fecha (o relatório da abertura continua dentro). Sem abertura, uma pasta nova chega e fecha.
- O `cta` escreve o texto a partir de 0,45 s depois do `em` (a capa fecha antes). Ponha o `carimboEm` numa palavra depois disso.

## 5. Regras de tempo

- Deixe os momentos **encostados** (o `ate` de um é o `de` do outro): o quadro nunca para.
- A peça assenta no instante de chegada: `quadro` → o `em` de cada prova; `destaque` → 0,22 s antes do `em` (o carimbo bate no `em`); `cta` → o `em`; os outros → o `de`. Ponha o `de` na primeira palavra do assunto.
- Entre duas chegadas, **pelo menos 1,2 s**: a câmera sai ~0,3 s antes da próxima chegada e a peça precisa ficar parada para ser lida.
- Cada item, campo, lado, dado, carimbo e foto entra no `em` da palavra que o nomeia.
- Peça com pouco texto (número, carimbo) pede 1,8 a 3 s; ficha com campos, 2 a 3,5 s.

## 6. Legenda, correções e sons

- A legenda vem das `palavras` de `cortar.mjs`, uma linha curta por vez (nunca duas frases na mesma linha). Nomes errados e pontos que a transcrição perdeu vão em `correcoes` (`{ "chat GPT": "ChatGPT", "banco,": "banco." }`); a correção vale só para a legenda. Só corrija o que você tem certeza.
- `semLegenda`: `[{ "de": 3, "ate": 4.5 }]` apaga a legenda numa faixa.
- Sons (`public/sfx`, tonais e raros): corda dedilhada quando o fio chega (`fio`), batida grave no carimbo (`carimbo`), duas notas quando a pasta abre (`pasta`), três notas de marimba no fim (`fim`). `sfx: false` desliga.

## 7. O exemplo completo

O plano do demo (golpe da falsa central, 17 s) está em `assets/template/src/plano.json`. Resumo:

```json
[
  { "tipo": "abertura", "de": 0, "ate": 2.95, "texto": "Golpe da falsa central", "destaque": "falsa central",
    "em": 1.19, "abreEm": 0.31, "carimboEm": 1.02, "imagem": { "id": "central" }, "imagemEm": 2.24 },
  { "tipo": "quadro", "de": 2.95, "ate": 12.12, "evidencias": [ "…as quatro provas da seção 3…" ] },
  { "tipo": "destaque", "de": 12.12, "ate": 14.7, "texto": "Banco nunca pede Pix", "em": 12.34,
    "nivel": "alerta", "detalhe": "por telefone", "detalheEm": 13.67 },
  { "tipo": "cta", "de": 14.7, "ate": 17.0, "texto": "Salva e manda pra sua mãe", "destaque": "sua mãe",
    "icone": "salvar", "em": 14.76, "carimboEm": 15.5, "imagem": { "id": "mae" }, "imagemEm": 16.11 }
]
```
