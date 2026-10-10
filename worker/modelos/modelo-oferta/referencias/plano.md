# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e corrige `palavras` quando a transcrição errou um número ou um nome (SKILL.md, passo 4b).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: página em cima, pessoa embaixo
3. A assinatura: `oferta`
4. Os efeitos próprios: `garantia` e `prazo` (e a doca)
5. Os blocos universais
6. Regras de tempo
7. Legenda, correções e sons
8. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Lucas Andrade", "area": "Mentor de Reels" },
  "sfx": true,
  "correcoes": {},
  "semLegenda": []
}
```

- `marca`: `nome` (40 px, nunca menos de 34) e `area` (28 px, nunca menos de 22) vão na tarja da costura, à esquerda, de 0,2 s até o primeiro bloco depois da abertura (no máximo 3,2 s). `nome` vazio = sem tarja. A inicial do nome vai no círculo verde.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`, `cortesEm`: calculados pelo `cortar.mjs`. Não mexa à mão. (A `zona` não é usada: a pessoa fica sempre na moldura de baixo.)
- `imagens`: escrito pelo `imagens.mjs` a cada `--escolher`. Para uma foto própria em `public/img/`, acrescente à mão: `"curso": { "arquivo": "img/curso.jpg", "largura": 640, "altura": 640, "transparente": false, "palavra": "curso" }`. A `palavra` é usada pelo timing gate (imagem da abertura).

## 2. A gramática

A tela é **sempre dividida**: a **página** em cima (x 64 a 1016, y 132 a 966) e a **pessoa** embaixo, numa moldura larga de cantos arredondados (a partir de y 1000). A pessoa nunca muda de lugar; o que muda é a página.

O template já faz sozinho:

- **A pilha usa a página inteira** até o valor ser dito (cartões de até 224 px de altura, descendo do alto na ordem da fala: cada novo cai e encaixa embaixo do anterior); no rótulo do valor, ela se compacta para cima e o cartão do preço sobe embaixo dela.
- **A doca**: `garantia`, `prazo` e `cta` que começam até 0,3 s depois do fim da `oferta` (e uns dos outros) **continuam a página**: a pilha sai para cima, o cartão do preço sobe para o alto (y 146) e eles se montam embaixo dele, cada um ficando até o fim da cadeia. O selo carimba grande no meio da área livre e, quando o próximo entra, voa para o canto direito do cartão do preço, onde fica só com o centro ("7 DIAS" grande; sem número, o escudo). O prazo fica em cima e o botão embaixo dele.
- **Troca de bloco**: o bloco que sai encolhe 3% e some em 0,2 s enquanto o próximo entra. Nada de faixa, flash ou cortina.
- **Câmera da pessoa**: troca de escala (100% ↔ 106%) em corte seco só quando o trecho anterior durou mais de 1 s; soco de 4% quando o preço bate e quando o selo carimba. O rosto é seguido.
- **Texto que cabe**: cada bloco mede o texto com as larguras reais da Plus Jakarta Sans e diminui o corpo até caber, sem cortar.
- **Último momento**: o `cta` final (ou o que termina colado no fim) fica até o último quadro.

Dois cuidados seus:

- **Momentos encostados**: o `ate` de um = o `de` do próximo, de preferência na pausa entre as frases.
- **A cadeia da oferta**: `garantia.de` = `oferta.ate`, `prazo.de` = `garantia.ate`, `cta.de` = `prazo.ate` (qualquer subconjunto, nessa ordem ou noutra).

## 3. A assinatura: `oferta`

```json
{
  "tipo": "oferta", "de": 2.45, "ate": 12.6,
  "titulo": "Você leva", "em": 2.5,
  "itens": [
    { "texto": "Curso completo", "em": 2.9, "imagem": { "id": "curso" } },
    { "texto": "30 roteiros prontos", "em": 3.8, "imagem": { "id": "roteiros" } },
    { "texto": "Mentoria ao vivo", "em": 5.62, "imagem": { "id": "mentoria" } }
  ],
  "ancora": { "valor": 997, "prefixo": "R$", "em": 8.87, "rotulo": "Tudo isso valeria", "rotuloEm": 7.08 },
  "preco": { "valor": 297, "prefixo": "R$", "em": 11.45, "rotulo": "Hoje sai por", "rotuloEm": 10.31, "riscoEm": 10.31 }
}
```

- `titulo` (opcional, **só se for dito**: "Você leva", "Inclui", "No kit"): etiqueta em caixa alta que anda com o topo da pilha; entra em `em`.
- `itens`: 0 a 5 entregas, na ordem da fala.
  - `texto`: o nome (até ~28 caracteres; 54–60 px em até 2 linhas, reduz até 28). Pode resumir com as palavras da fala.
  - `em`: a palavra que nomeia a entrega. O cartão aparece nela, cai e pousa 0,2 s depois.
  - `imagem` (opcional): `{ "id": "…" }` de `plano.imagens`. A foto preenche o quadrado da esquerda (cover, cantos arredondados).
  - `icone` (opcional, sem imagem): `aula`, `documento`, `pasta`, `chamada`, `presente`, `comunidade`, `certificado`, `suporte`, `grafico`, `escudo`, `calendario`, `estrela`, `carrinho`, `moeda`, `check`. Sem imagem nem ícone: o selo com o número do item.
  - `detalhe` (opcional): uma linha pequena embaixo do nome (só o que foi dito).
  - `preco` (opcional, **só se for dito**: "um bônus de 197"): texto livre numa pílula à direita.
- `ancora` (opcional): o valor de referência ("valeria", "custava", "de").
  - `valor` (número; bate inteiro, com um soco, na palavra `em`) **ou** `texto` (sem número: "o que eu gastei em 3 anos").
  - `prefixo` ("R$", "US$"), `sufixo` ("/mês", " mil"), `casas` (casas decimais).
  - `rotulo` + `rotuloEm`: as palavras ditas antes do número ("Tudo isso valeria"), montando palavra por palavra. O cartão do preço sobe no `rotuloEm` (ou no `em`).
- `preco` (opcional, mas quase sempre presente): o preço real, com os mesmos campos.
  - `em`: a palavra do número ("297"). É quando o preço **bate**.
  - `rotulo` + `rotuloEm`: "Hoje sai por", "Por", "Só".
  - `riscoEm`: quando o risco vermelho atravessa a âncora grande (padrão: `rotuloEm`). 0,4 s depois (e pelo menos 0,5 s antes do preço) a âncora riscada encolhe para o lado do rótulo do preço. O preço **cai e bate** grande em verde no `em`, de uma vez: nenhum número intermediário aparece.
  - Sem `ancora`: o preço só bate. Com `texto` ("Gratuita", "De graça", "Vagas abertas"): o texto bate em verde.
- `ilustrativo: true`: etiqueta "ilustrativo" no canto do cartão do preço (use quando os valores forem exemplo, não fala).

## 4. Os efeitos próprios

### `garantia`: o selo que carimba

```json
{ "tipo": "garantia", "de": 12.6, "ate": 14.18, "texto": "garantia", "valor": "7", "unidade": "dias", "em": 12.64, "valorEm": 13.25 }
```

- `texto`: o que corre em volta do selo, em caixa alta ("garantia", "risco zero", "satisfação garantida", "sem promessa de lucro"). Texto longo dá a volta inteira.
- `em`: a palavra da garantia. O selo desce grande e inclinado e carimba 0,16 s depois.
- `valor` + `unidade` (opcionais, **só se forem ditos**): o centro ("7" + "dias", "30" + "dias"); entram em `valorEm` (a palavra do número). Sem `valor`: o escudo com ✓ no centro.
- Na doca: carimba no meio da área livre e voa para o canto do cartão do preço quando o próximo bloco entra. Sozinho: no meio da página.

### `prazo`: a contagem do prazo

```json
{ "tipo": "prazo", "de": 14.18, "ate": 15.45, "texto": "Só até domingo", "em": 14.22, "dia": "domingo", "diaEm": 14.58 }
```

- `texto`: a frase dita ("Só até domingo", "Só hoje", "Últimas vagas"), em até 1 linha, montando palavra por palavra a partir de `em`. O dia (quando houver) fica em verde.
- `dia` (opcional, **só se for dito**): `segunda`, `terca`, `quarta`, `quinta`, `sexta`, `sabado`, `domingo`. A régua da semana (SEG a DOM) aparece e o tempo corre de dia em dia até ele, que acende em verde com um anel pulsando em `diaEm` (a palavra do dia).
- Sem `dia`: uma barra de tempo esvazia de `em` até `fimEm` (padrão: o fim do momento), com um relógio girando. Nunca mostre horas ou datas que não foram ditas.

## 5. Os blocos universais

Os 11 blocos têm os mesmos campos em todos os modelos do pack (`references/adaptar.md`). Aqui:

- `abertura` `{ texto, destaque?, em?, imagem?, imagemEm? }`: a etiqueta de produto pendurada (até ~60 caracteres; 76–96 px em até 3 linhas). `imagem` (o produto) entra em `imagemEm` (a palavra dele).
- `topicos` `{ titulo?, itens: [{ texto, em, detalhe?, imagem?, icone? }] }`: a pilha (2 a 5 cartões, descendo na ordem da fala; sem imagem nem ícone, um ✓).
- `passos` (mesmos campos): os mesmos cartões, em ordem, com o número no selo.
- `numero` `{ valor, em, rotulo, rotuloEm?, prefixo?, sufixo?, casas?, ilustrativo? }`: o cartão de preço com o número contando (90–190 px).
- `comparacao` `{ titulo?, modo?, lados: [{ rotulo, texto, em, imagem? }, …], vencedor?, vencedorEm? }`: duas etiquetas; o que perde é riscado em vermelho em `vencedorEm`.
- `grafico` `{ titulo?, forma, dados?, tendencia?, tendenciaEm?, unidade?, ilustrativo? }`: 2 a 6 números ditos; sem números, a tendência com "ilustrativo".
- `destaque` `{ texto, em, nivel?, detalhe?, detalheEm? }`, `definicao` `{ termo, em, significado, significadoEm }`, `frase` `{ texto, destaque?, risco?, riscoEm?, em? }`, `pergunta` `{ texto, opcoes?, em? }`.
- `cta` `{ texto, icone?, em?, toqueEm? }`: o botão. `texto` = o que foi dito ("Link na bio", "Clica em saiba mais"; até ~24 caracteres, 2 linhas no máximo). `icone`: `link` (padrão), `salvar`, `seguir`, `comentar`. `toqueEm`: quando o dedo toca a seta (padrão: a última palavra do texto); deixe pelo menos 0,4 s até o fim do vídeo.

## 6. Regras de tempo

- Todo `em`/`…Em` é o começo de uma palavra dita (±0,15 s, conferido pelo `node ferramentas/timing.mjs`).
- Entrega: a palavra que a nomeia ("curso", "trinta", "mentoria"). Âncora: a palavra do número (`rotuloEm` na primeira palavra do rótulo). Preço: a palavra do número; `riscoEm` no começo do rótulo do preço ("Hoje"). Garantia: "garantia" (ou a primeira palavra do texto); `valorEm`: o número. Prazo: a primeira palavra; `diaEm`: o dia. Botão: `em` na primeira palavra, `toqueEm` numa palavra do texto.
- Algo muda a cada ~1,5–2,5 s: se a fala tem um trecho longo sem entrega nem número, divida o momento ou use outro bloco.
- Entre o risco e o preço, deixe pelo menos ~0,6 s (o risco leva 0,3 s e a âncora encolhe antes de o preço cair).

## 7. Legenda, correções e sons

- A legenda some durante os momentos (a página mostra a fala); `legenda: true` num momento a mantém (pílula marfim abaixo do queixo, até 4 palavras, a palavra dita em verde). `semLegenda` tira trechos da legenda.
- `correcoes`: `{ "chat GPT": "ChatGPT" }` troca palavras só na legenda; para números e nomes que o timing gate confere, corrija direto em `palavras`.
- Sons (automáticos): `pousa` (entrega pousa e âncora bate), `sobe` (o bloco `numero` conta), `risco`, `bate` (preço), `carimbo` (selo), `tique` (dia do prazo), `toque` (botão), `entra` (abertura, destaque, definição, botão). Tonais e baixos; `sfx: false` desliga.

## 8. O exemplo completo

O plano do exemplo está em `src/plano.json` do template e comentado em `references/exemplo/plano-comentado.md` (com a folha `quadros.jpg` e o `exemplo.mp4`).
