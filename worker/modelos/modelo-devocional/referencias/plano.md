# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e corrige `palavras` quando a transcrição errou (SKILL.md, passo 4b).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: a página em cima, a pessoa embaixo
3. A assinatura: `versiculo`
4. O efeito próprio: `luz`
5. Os blocos universais
6. Desenhos
7. Regras de tempo
8. Legenda, correções e sons
9. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "André Lacerda", "area": "Reflexão do dia" },
  "sfx": true,
  "correcoes": {},
  "semLegenda": []
}
```

- `marca`: `nome` (Manrope 700, 48 px, nunca menos de 40) e `area` (EB Garamond itálico, 34 px, nunca menos de 28) vão na tarja: um cartão claro com uma fita oliva (124 px de altura), acima da moldura com 34 px de folga, à esquerda, de 0,25 s a ~3,6 s (sai antes se um `versiculo` encher a página). `nome` vazio = sem tarja. Nada de título religioso que a pessoa não pediu.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão. (A `zona` não é usada: a pessoa fica sempre na moldura de baixo ou no medalhão.)

## 2. A gramática

A tela é uma **página de livro** (pergaminho marfim, com a lombada à esquerda) e a pessoa fica numa **moldura larga embaixo** (x 36 a 1044, a partir de y 1000). A área de texto da página vai de x 64 a 1016 e de y 150 até ~44 px acima da moldura (até ~812 enquanto a tarja aparece).

O template já faz sozinho:

- **A página vira entre os blocos**: no `de` de cada bloco (menos o primeiro, se começar em 0), a folha anterior gira na lombada em 0,5 s e mostra a nova embaixo (o centro aparece em ~0,3 s). Por isso o `de` de um bloco fica **na pausa, ~0,2 a 0,35 s antes da primeira palavra dele**.
- **Cada bloco fica até o próximo entrar** (o último, até o fim). Não há página vazia entre blocos encostados.
- **O versículo enche a página**: a moldura da pessoa se recolhe num medalhão (420 × 500, de y 1190 a 1690, cabeça inteira) durante a virada (0,5 s) e volta no bloco seguinte. Dois `versiculo` seguidos mantêm a página cheia.
- **O primeiro quadro já é o layout final**: no primeiro bloco (que começa em 0), a primeira palavra já está na página no quadro 0.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da EB Garamond e da Manrope e diminui o corpo até caber, sem cortar; cada frase começa numa linha nova (nunca duas frases na mesma linha).
- **Câmera da pessoa**: troca de escala (100% ↔ 104%) em corte seco só quando o trecho anterior durou mais de 1 s. O rosto é seguido.
- **Fundo vivo**: a textura do papel deriva devagar, uma luz de janela passeia por baixo do texto e a poeira de luz sobe na página. Nada disso passa na pessoa (o vídeo fica por cima e a luz some antes da moldura).

## 3. A assinatura: `versiculo`

```json
{
  "tipo": "versiculo", "de": 4.26, "ate": 14.17,
  "chamada": "Está escrito", "chamadaEm": 4.58,
  "texto": "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", "em": 5.73,
  "destaque": "aliviarei",
  "referencia": "Mateus 11:28",
  "referenciaPartes": [ { "texto": "Mateus", "em": 11.28 }, { "texto": "11", "em": 12.12 }, { "texto": ":28", "em": 13.29 } ]
}
```

- `texto`: **exatamente o que foi dito** (até ~180 caracteres; 108 px, reduz até 56). Entra inteiro "a lápis" quando a página vira e cada palavra ganha tinta no instante em que é dita, a partir de `em` (a primeira palavra).
- `destaque` (opcional): o trecho que acende (1 a 3 palavras). Acende na palavra dita, ou em `destaqueEm`.
- `chamada` (opcional, **só se for dita**): "Está escrito", "Como dizia minha avó", "Meu pai sempre falava". Versalete oliva no alto, com o ornamento, em `chamadaEm`.
- `referencia` (opcional, **só se for dita**): "Mateus 11:28", "Salmos 23:1", "C. S. Lewis". Versalete oliva embaixo do texto, depois de um ornamento.
  - `referenciaPartes`: monta a referência na fala, cada pedaço no `em` da palavra dele ("Mateus" → "11" em "onze" → ":28" em "vinte"). Pedaços que começam com ":" , "," ou "." grudam no anterior.
  - Sem partes, a referência inteira entra em `referenciaEm`.
- `obra` / `obraEm` (opcional, modo livro): o título do livro, em itálico, embaixo do autor.
- `modo`:
  - `"escritura"` (padrão quando há referência): capitular oliva de duas linhas, texto alinhado à esquerda;
  - `"livro"` e `"autor"`: aspas oliva grandes no alto, texto centrado, "— referência" embaixo;
  - `"reflexao"` (padrão sem referência): texto centrado em itálico e um ornamento fechando. É o modo para a frase forte da própria pessoa.

## 4. O efeito próprio: `luz`

```json
{ "tipo": "luz", "de": 14.17, "ate": 16.85, "texto": "Descansar também é fé.", "em": 14.52, "palavra": "fé", "palavraEm": 15.91 }
```

- `texto`: a frase (até ~80 caracteres). O que vem antes da `palavra` é escrito em itálico pequeno no alto (78 px, até 2 linhas); o que vem depois, embaixo dela.
- `palavra`: UMA palavra do texto (pode ser a última). Fica enorme no meio (até 300 px; uma palavra longa como "posicionamento" reduz até caber) e **acende** em `palavraEm`: aparece de dentro da luz, fica legível em ~0,1 s e assenta de creme a oliva em 0,4 s, a luz creme sobe atrás e a poeira sobe em volta. Antes disso, a luz já espera no lugar, respirando.
- `detalhe` / `detalheEm` (opcional): uma linha pequena em itálico no fim.
- `desenho` / `desenhoEm` (opcional): um desenho pequeno acima da frase.
- Deixe **pelo menos 0,8 s** entre `palavraEm` e o fim do bloco (a palavra acesa precisa ser lida antes da página virar). Se a fala emenda logo, a virada pode cair ~0,2 s antes da próxima palavra.

## 5. Os blocos universais

Os campos são os mesmos em todos os modelos do pack. Aqui eles são escritos na página.

- `abertura` `{ texto, destaque?, em?, desenho?, desenhoEm? }`: até ~70 caracteres (96 px, até 4 linhas; cada frase numa linha nova). `destaque` acende quando é dito.
- `topicos` / `passos` `{ titulo?, itens: [{ texto, em, detalhe? }] }`: 2 a 5 itens, até ~40 caracteres cada (66 px com 2 itens, 48 px com 5; até 2 linhas). `titulo` até ~40 caracteres em versalete (vira itálico se for longo). `passos` não mostra números: um fio liga as bolinhas.
- `numero` `{ valor, em, rotulo, rotuloEm?, prefixo?, sufixo?, casas?, ilustrativo? }`: conta em 1,1 s a partir de `em` e acende oliva no fim; formato pt-BR. `rotulo` até ~60 caracteres em itálico.
- `comparacao` `{ titulo?, modo?, lados: [{ rotulo, texto, em }, …], vencedor?, vencedorEm? }`: um livro aberto, uma ideia em cada página; `rotulo` até ~14 caracteres (versalete), `texto` até ~50. O `vencedor` acende em `vencedorEm` e o outro esmaece; `errado-certo` risca o errado com tinta tijolo; `antes-depois` põe uma seta na dobra.
- `grafico` `{ titulo?, forma, dados?, tendencia?, tendenciaEm?, unidade?, ilustrativo? }`: 2 a 6 dados ditos (barras hachuradas, a maior em oliva; linha oliva; pizza); sem dados, a curva da tendência com "ilustrativo".
- `destaque` `{ texto, em, nivel?, detalhe?, detalheEm?, desenho? }`: até ~40 caracteres (124 px, 3 linhas), acende inteiro logo depois da primeira palavra; `alerta` = tinta tijolo, sem luz.
- `definicao` `{ termo, em, significado, significadoEm }`: termo até ~24 caracteres; significado até ~120 (itálico).
- `frase` `{ texto, destaque?, risco?, riscoEm?, em?, desenho? }`: até ~120 caracteres (90 px, 5 linhas) sob aspas oliva grandes.
- `pergunta` `{ texto, opcoes?, em? }`: até ~80 caracteres (92 px) sobre um "?" oliva bem claro; 2 a 4 `opcoes` `{ texto, em }` em linhas com círculos.
- `cta` `{ texto, icone?, destaque?, em? }`: até ~70 caracteres em itálico (80 px, 3 linhas). `icone`: `salvar` (marcador), `comentar` (balão), `seguir` (+), `link` (elo). **Sem `icone`, ele vem do verbo**: manda/envia/compartilha/marca → **carta** (que se fecha com um coração); salva/guarda → marcador; segue → +; link/clica/toca → elo; o resto → balão.

## 6. Desenhos

`abertura`, `frase`, `destaque` e `luz` aceitam `desenho` + `desenhoEm` (a palavra que ele mostra literalmente; sem `desenhoEm`, entra com o bloco). Os traços se desenham em ~1,2 s e depois o desenho tem movimento próprio:

| `desenho` | mostra | movimento |
|---|---|---|
| `amanhecer` | janela em arco com o sol nascendo no horizonte | o sol sobe devagar, os raios respiram |
| `vela` | vela acesa | a chama tremula |
| `livro` | livro aberto com fita marcadora | — |
| `ramo` | ramo de oliveira | balança |
| `coracao` | coração | bate de leve |
| `caminho` | estrada até o horizonte | a faixa do meio anda |
| `lua` | lua crescente e estrelas | — |
| `semente` | broto saindo da terra | — |

## 7. Regras de tempo

- Cada `em` é o início de uma palavra dita (±0,15 s). O `node ferramentas/timing.mjs` confere: a primeira palavra de cada bloco, a chamada, cada pedaço da referência, a palavra que acende, itens, lados, dados, opções e o desenho.
- **Blocos encostados**: o `ate` de um = o `de` do próximo, na pausa, **~0,2 a 0,35 s antes da primeira palavra do bloco novo** e nunca antes de a última palavra do anterior terminar (a página vira em 0,5 s). Não deixe o `de` cair no meio de uma frase.
- Nada fica parado mais de ~2,5 s: numa pausa longa use a `luz` (a luz espera respirando) ou um desenho.
- O fechamento fica legível por pelo menos 1,2 s.
- O primeiro momento começa em 0; o vídeo termina ~0,3 s depois da última palavra.

## 8. Legenda, correções e sons

- **Legenda**: some em todos os blocos (a página mostra a fala). Use `legenda: true` num momento para mantê-la. Ela fica numa pílula de papel claro abaixo do queixo, até 4 palavras, a palavra dita em oliva, nunca juntando duas frases.
- **`correcoes`**: troca de palavras na legenda (`{ "estáis": "estais" }`). Para o texto do versículo e os números da referência, corrija `palavras` direto (passo 4b), porque o timing gate lê de lá.
- **Sons** (tonais, raros, baixos): um sopro tonal na virada da página, uma nota macia quando uma palavra acende (abertura, versículo, luz, frase, destaque, vencedor, fim da contagem do número), um toque curto nos itens, nas opções, na definição e no primeiro pedaço da referência, uma nota grave quando um desenho começa, duas notas subindo no envio da carta.

## 9. O exemplo completo (Mateus 11:28, 19,9 s)

Fala: "Tem dias em que a gente acorda sem força nenhuma. E tudo bem. Está escrito: Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei. Mateus, capítulo onze, versículo vinte e oito. Descansar também é fé. Manda esse vídeo pra alguém que precisa ouvir isso hoje."

```json
"marca": { "nome": "André Lacerda", "area": "Reflexão do dia" },
"momentos": [
  { "tipo": "abertura", "de": 0, "ate": 4.26, "em": 0.09, "texto": "Tem dias em que a gente acorda sem força nenhuma. E tudo bem.", "destaque": "tudo bem", "desenho": "amanhecer", "desenhoEm": 1.35 },
  { "tipo": "versiculo", "de": 4.26, "ate": 14.17, "chamada": "Está escrito", "chamadaEm": 4.58, "em": 5.73,
    "texto": "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", "destaque": "aliviarei",
    "referencia": "Mateus 11:28",
    "referenciaPartes": [ { "texto": "Mateus", "em": 11.28 }, { "texto": "11", "em": 12.12 }, { "texto": ":28", "em": 13.29 } ] },
  { "tipo": "luz", "de": 14.17, "ate": 16.85, "em": 14.52, "texto": "Descansar também é fé.", "palavra": "fé", "palavraEm": 15.91 },
  { "tipo": "cta", "de": 16.85, "ate": 19.9, "em": 17.05, "texto": "Manda esse vídeo pra alguém que precisa ouvir isso hoje.", "destaque": "alguém" }
]
```

`duracao` = 19,9 s: a última palavra ("hoje") termina em ~19,62 s.

O mesmo estilo num vídeo de cripto (só o plano, sem render): `numero` (US$ 83 mil, com o rótulo "O Bitcoin rompeu"), `definicao` de bull market, `versiculo` em modo reflexão com a frase da própria pessoa ("Mas o mercado subindo não significa dinheiro no bolso…", acende "maioria das pessoas"), `topicos` (os três erros de quem perde na alta), `luz` em "posicionamento", `passos` (o que a aula analisa), `frase` com risco em "promessa de lucro", `comparacao` errado-certo e `cta` com `link`.
