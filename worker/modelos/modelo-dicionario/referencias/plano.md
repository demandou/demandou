# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: página × frontispício
3. Os 11 blocos universais
4. A assinatura: `verbete` e `remissao`
5. Os vizinhos e os desenhos
6. Regras de tempo
7. Legenda, correções e sons
8. Exemplo completo (vídeo sobre cripto)
9. O exemplo do modelo (professor de espanhol)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "sfx": true,
  "correcoes": { "calção": "caução" },
  "semLegenda": []
}
```

- `marca`: o letreiro em caixa-alta no alto das folhas do frontispício ("TIAGO LEMOS · CRIPTO") e a assinatura da epígrafe ("— Tiago Lemos"). `nome` vazio = sem letreiro.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte. `zona.topo` é o topo da folha do frontispício (o template mantém entre 940 e 1120 px).
- `caixas` (opcional, raro): ajuste fino da pessoa em cada layout de página, se a cabeça ficar cortada: `"caixas": { "quadro-direita": { "ancoraY": 0.45, "zoom": 1.2 } }`. Padrão: no quadro, `ancoraY` 0,42 e `zoom` entre 1 e 1,55 (o template aproxima menos quando o rastreio mediu um rosto grande, de gravação perto da câmera); na coluna, `ancoraY` 0,3 e `zoom` até 1,2. `ancoraY` é a altura do rosto dentro do quadro (0 = topo, 1 = base); `zoom` acima de 1 aproxima. O `--manter-plano` do `cortar` não guarda este campo.

## 2. A gramática: página × frontispício

**Página** (`topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao`, `verbete`, `remissao`, e `frase` com `traducao`): a tela inteira vira uma página de dicionário, com cabeçalho (palavras-guia nos cantos, tiradas do próprio conteúdo, e o número da página no meio) e um fio entre as colunas. A pessoa vira a figura impressa da página:

| Layout | A pessoa | O conteúdo (corpo do bloco) | A coluna estreita |
|---|---|---|---|
| `quadro-direita` | quadro de 560×700 px no alto, à direita | largura toda, embaixo (948×560 px) | à esquerda do quadro (352 px): título do bloco + a fala em itálico, ou verbetes vizinhos |
| `quadro-esquerda` | o mesmo, à esquerda | largura toda, embaixo | à direita do quadro |
| `coluna-esquerda` | coluna larga (520 px) à esquerda, da altura da página | coluna estreita à direita | — (só `verbete` e `remissao` com vizinhos) |
| `coluna-direita` | coluna larga à direita | coluna estreita à esquerda | — (idem) |

**Frontispício** (`abertura`, `cta`, `pergunta`, `destaque`, `frase` sem tradução, e qualquer bloco com `"layout": "frontispicio"`): a pessoa grande em cima, com o rosto livre; uma folha de papel sobe pela parte de baixo (de `zona.topo` até o pé do quadro), com o letreiro da `marca` no alto e o bloco embaixo dele (área de 948 px de largura por 330 a 470 px de altura, conforme o queixo).

- **Os layouts se escolhem sozinhos**: a pessoa **troca de lado a cada página**. Só escreva `"layout"` para forçar um lugar (`"quadro-direita"`, `"quadro-esquerda"`, `"frontispicio"`…). Para abrir o vídeo com um bloco que não é a `abertura` (um número, por exemplo), use `"layout": "frontispicio"`; para pôr uma pergunta, destaque ou frase numa página, use `"layout": "quadro-direita"` (ou esquerda).
- **A coluna estreita** de uma página mostra, em cima, o título do bloco como cabeça do verbete (`titulo` de `topicos`, `passos`, `comparacao`, `grafico`, em ameixa) e, embaixo, a **abonação**: o trecho falado do momento em itálico, que sai do lápis para a tinta palavra por palavra (a palavra da vez em ameixa). Numa `definicao`, `verbete` ou `remissao` com `vizinhos`, a coluna mostra os verbetes vizinhos.
- **Trocas** (sempre sem quadro vazio): entre duas páginas coladas (respiro menor que 0,3 s) a página **vira** em 0,62 s, para a frente ou para trás conforme a ordem alfabética das palavras-guia. Do frontispício para uma página, a folha do frontispício vira e só então a pessoa encolhe para o quadro. De uma página para um frontispício, a pessoa cresce e a folha sobe por baixo, cobrindo a página. Entre dois frontispícios colados, a folha de cima vira e revela a de baixo. Com respiro maior que 0,3 s, a pessoa volta à tela cheia (com a legenda) até o próximo momento.
- **Índice de dedo**: na borda direita, uma aba por página (o texto é `aba`, ou as duas primeiras letras da palavra-guia); a da página atual sai para fora em ameixa. Com mais de dez páginas, ficam só as dos verbetes e definições.

## 3. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate`, `legenda?` (true = a legenda continua aparecendo) e `layout?`. Os limites de texto existem porque o bloco diminui o texto para caber: passou do limite, fica pequeno no celular. Se não cabe, escreva mais curto, com as palavras da fala.

### `abertura` — frontispício com o título

```json
{ "tipo": "abertura", "de": 0, "ate": 3.6, "texto": "Antes de alugar um apartamento", "destaque": "apartamento", "em": 0.32,
  "subtitulo": "confere três coisas", "numero": { "texto": "3", "em": 2.63 } }
```

- `texto`: o título, palavras da fala na ordem (cada uma entra quando é dita); até ~40 caracteres, quebra sozinho em até 3 linhas (`" / "` força a quebra). `destaque`: trecho exato do título ou do subtítulo, em itálico ameixa. `em`: quando o texto começa a ser dito (padrão `de`).
- Deste modelo: `subtitulo` (até ~30 caracteres, palavra por palavra), `numero` (o número dito, até 2 caracteres, grande em ameixa à esquerda do título; antes de ser dito fica a lápis) e `rotulo` (letreiro do alto, padrão: nome · área da `marca`). Os nomes antigos `titulo`/`enfase` continuam valendo.

### `topicos` — acepções numeradas

```json
{ "tipo": "topicos", "de": 17.25, "ate": 24.21, "titulo": "Por que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21, "detalhe": "sem olhar o projeto" },
             { "texto": "Assume risco que não entende", "em": 21.25 } ] }
```

- 2 a 5 itens, sem ordem (motivos, erros, dicas). `texto` de 1 a 6 palavras (até ~30 caracteres; quebra em 2 linhas); `detalhe` opcional, até ~30, em itálico cinza embaixo. Cada item entra no seu `em`; antes disso, o lugar dele é um traço a lápis. O marca-texto ameixa passa por baixo do item da vez.
- `titulo` (opcional, até ~30): vai para a cabeça da coluna ao lado da pessoa.

### `passos` — remissões encadeadas

Mesmos campos de `topicos`, para itens **em ordem** (sequência, processo, caminho). Chips numerados: o do passo da vez em ameixa cheio, os anteriores em contorno ameixa (e o texto em cinza), os que faltam a lápis; um fio ameixa desce de um chip ao outro quando o passo seguinte é dito.

### `numero` — o número como palavra-título

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "layout": "frontispicio", "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.62 }
```

- `valor` conta de 0 até o número a partir de `em`, em pt-BR (83.000; 1,5). `casas`: casas decimais. `prefixo` ("R$", "US$", "até") e `sufixo` ("%", "mil", "mi", "meses") ficam em itálico cinza ao lado. Para "1,5 milhão": `"valor": 1.5, "casas": 1, "sufixo": "mi"`.
- Número grande (a partir de mil, com `mil`/`mi`/`bi` no sufixo contando) ganha a linha **por extenso** entre colchetes ("[oitenta e três mil dólares]", "[um milhão e quinhentos mil reais]"); `"extenso": false` tira.
- `rotulo` (até ~40 caracteres): o que o número mede, como acepção "1." embaixo; entra em `rotuloEm` (padrão `em` + 0,35). `ilustrativo: true` mostra a etiqueta ILUSTRATIVO.

### `comparacao` — dois cartões de nota

```json
{ "tipo": "comparacao", "de": 3.0, "ate": 6.2, "titulo": "Antes e depois", "modo": "antes-depois",
  "lados": [ { "rotulo": "Antes", "texto": "Respondia todo mundo na hora", "em": 3.1 }, { "rotulo": "Depois", "texto": "Dois horários fixos por dia", "em": 4.6 } ],
  "vencedor": 1, "vencedorEm": 5.4 }
```

- `modo`: `contra` (padrão, "×" entre os cartões), `antes-depois` ou `errado-certo` ("→"). Em `errado-certo` o vencedor é o lado 1 se você não disser, e o outro lado é riscado.
- `rotulo` até ~20 caracteres (caixa-alta pequena); `texto` até ~40 (quebra em até 4 linhas). Cada cartão nasce a lápis e ganha tinta no seu `em`; os textos saem no ritmo da fala.
- `vencedor` (opcional): o cartão ganha moldura ameixa, marca-texto e sobe um pouco em `vencedorEm` (padrão: 0,6 s depois do último lado); o outro fica cinza.

### `grafico` — a gravura

```json
{ "tipo": "grafico", "de": 5.0, "ate": 8.0, "titulo": "Vendas por trimestre", "forma": "barras", "unidade": "mil",
  "dados": [ { "rotulo": "T1", "valor": 120, "em": 5.2 }, { "rotulo": "T2", "valor": 340, "em": 6.1 } ] }
```

- `forma`: `barras` (hachuradas, crescem no `em` de cada dado), `linha` (pontos ligados por um traço que se desenha) ou `pizza` (fatias com legenda: amostra, valor, rótulo).
- `dados`: 2 a 6 números **ditos**, cada um no seu `em`; `rotulo` até ~20 caracteres. O dado da vez fica em ameixa. `unidade` curta ("%", "mil", "kg") vai junto do número; longa ("pessoas por dia") vira o letreiro do eixo.
- **Sem números ditos**: deixe `dados` de fora e use `tendencia` (`sobe`, `cai`, `oscila`) com `ilustrativo: true`. A curva se desenha a partir de `tendenciaEm` com a etiqueta ILUSTRATIVO; nenhum número aparece.

### `destaque` — o carimbo ou o grifo

```json
{ "tipo": "destaque", "de": 14.9, "ate": 17.6, "texto": "Tem gente que perde", "em": 15.96, "nivel": "alerta", "detalhe": "mesmo na alta" }
```

- `nivel: "alerta"`: o texto em caixa-alta dentro de um carimbo ameixa que bate na folha no `em` (antes, o contorno do carimbo a lápis). `"chave"` (padrão): o texto enorme em negrito, palavra por palavra a partir do `em`, e o marca-texto ameixa passando por baixo.
- `texto` até ~36 caracteres (alerta: até 2 linhas; chave: até 3). `detalhe` (até ~50) em itálico cinza embaixo, em `detalheEm` (padrão `em` + 0,6).
- Fica no frontispício (padrão).

### `definicao` — o verbete simples

```json
{ "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "bull market", "em": 5.30, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` (até ~20 caracteres) vira a palavra-título em ameixa; antes de ser dito, lacunas a lápis (uma por sílaba). `significado` (até ~60) entra palavra por palavra a partir de `significadoEm`, como acepção "1.", com marca-texto no fim.
- Deste modelo (opcionais): `silabas` ("pa·tri·mô·ni·o"), `classe` ("s.m.", "loc."), `pronuncia`, `aba`, `vizinhos`. Só ponha classe e sílabas se tiver certeza.

### `frase` — a epígrafe

```json
{ "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.75 }
```

- `texto` até ~70 caracteres, em itálico, palavra por palavra a partir de `em`; aspas ameixa grandes e a assinatura "— nome" no fim. `destaque`: trecho exato em ameixa. `risco`: trecho exato riscado em `riscoEm` (padrão: logo depois de ele ser dito).
- **Exemplo de uso bilíngue** (vídeos de idioma): acrescente `traducao` (`{ "texto": "A paella estava deliciosa.", "em": 17.6 }`) e, se quiser, `idioma` ("ES"), `rotulo` ("Exemplo") e `destaqueTraducao`. Aí a frase vira uma página: a frase no idioma em itálico (com chip), um fio e a tradução embaixo.

### `pergunta`

```json
{ "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o patrimônio", "em": 37.98 } ] }
```

- `texto` até ~60 caracteres, palavra por palavra, ao lado de um "?" grande em ameixa. `opcoes` (opcional): 2 a 4, até ~40 caracteres cada, com "a)" "b)"…, cada uma no seu `em` (antes, a lápis).

### `cta` — o fechamento

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: a chamada inteira, palavras da fala (até ~50 caracteres; quebra em até 3 linhas). `destaque`: trecho em itálico ameixa. `icone`: `salvar` (padrão: a fita marcadora cai da borda da folha), `seguir`, `comentar` ou `link`.
- Deste modelo: `chamada` (opcional) — a palavra de ordem bem grande ("Salva"), e aí `texto` é o resto da frase, menor.
- Se for o último momento, fica até o fim do vídeo.

## 4. A assinatura: `verbete` e `remissao`

Use pelo menos uma das duas (o `conferir.mjs` exige).

### `verbete` — o que parece × o que é

```json
{ "tipo": "verbete", "de": 8.67, "ate": 17.25,
  "palavra": { "texto": "mercado subindo", "em": 8.77 },
  "parece": { "texto": "dinheiro no bolso", "em": 10.91, "riscaEm": 12.91 },
  "significa": { "texto": "tem gente que perde", "em": 15.96, "rotulo": "Mesmo na alta", "viraEm": 14.7 },
  "carimbo": { "em": 16.84 } }
```

A palavra-título entra sílaba por sílaba em ameixa. Embaixo, o cartão de nota nasce a lápis, ganha tinta 0,45 s antes de `parece.em`, mostra a leitura comum ("PARECE"), risca em `riscaEm`, **gira** em `viraEm` e mostra o sentido real ("SIGNIFICA") com marca-texto; o carimbo bate no canto.

- `palavra.texto`: o termo (uma palavra ou expressão curta, até ~18 caracteres). `silabas` (opcional): com `·` entre as sílabas e espaço entre as palavras ("bull mar·ket"); são os pontos onde a palavra pode quebrar. `classe` e `pronuncia` (opcionais): `pronuncia` aproximada para brasileiro ler, sílabas com hífen e a tônica em MAIÚSCULAS (`eks-ki-SÍ-to`), com o rótulo "pronúncia aproximada".
- `parece`: a leitura comum, o engano, o mito (`texto` até ~30 caracteres, quebra em 2 linhas; `glosa` opcional, "= o sentido dela", até ~20). `riscaEm` padrão: `em` + 0,55 — ponha na palavra que nega ("**não** é", "na verdade"). `rotulo` troca o "Parece" ("Todo mundo acha", "Mito"). `idioma` mostra um chip ("PT").
- `significa`: o sentido real (`texto` até ~30; `extra` opcional vira o segundo sentido numerado, "1. … / 2. …"). `viraEm` (padrão `em` − 0,45): o cartão gira em 0,46 s — ponha na palavra que anuncia ("**é**", "quer dizer", "mesmo"). `rotulo` troca o "Significa" ("Na verdade", "Mesmo na alta").
- `idioma` (opcional): chip do verso ("ES", "EN"); sem ele, só o rótulo.
- `carimbo` (opcional): `em` logo depois do sentido; `texto` padrão "Engano comum" (até ~14 caracteres: "Mito", "Atenção", "Falso amigo"). Sem `carimbo`, sem carimbo.
- `figura` (opcional) em `parece`/`significa`: um dos desenhos prontos (seção 5). `aba`: texto da aba do índice.

### `remissao` — o nome certo para uma ideia

```json
{ "tipo": "remissao", "de": 10.0, "ate": 14.35,
  "rotulo": { "texto": "O tipo de garantia", "em": 10.08 },
  "palavra": { "texto": "garantia", "silabas": "ga·ran·ti·a", "em": 10.65 }, "classe": "s.f.",
  "definicao": { "texto": "fiador, caução ou seguro-fiança", "em": 11.69 } }
```

- O letreiro com seta ("→ O tipo de garantia", palavras da fala, até ~30 caracteres) bate palavra por palavra; o lugar da palavra fica em lacunas a lápis até ela ser dita; então entram a palavra-título, a classe e a definição (até ~40 caracteres), esta palavra por palavra na fala.
- `figura` opcional: `{ "nome": "polvo", "em": 13.75 }` desenha à esquerda (seção 5).
- Logo depois de um `verbete`, a remissão continua a aba dele (é a resposta dele); sozinha, ganha a aba dela.

## 5. Os vizinhos e os desenhos

`vizinhos` (opcional, em `verbete`, `remissao`, `definicao` e na frase bilíngue) são os verbetes que vêm antes e depois da palavra na ordem alfabética, em tinta mais clara, enchendo a coluna estreita; o primeiro de `antes` e o último de `depois` viram as palavras-guia do cabeçalho:

```json
"vizinhos": { "antes": [ { "palavra": "explicar", "classe": "v.", "def": "explicar" } ], "depois": [ { "palavra": "extraño", "classe": "adj.", "def": "estranho" } ] }
```

- **Só palavras reais**, vizinhas de verdade, com definição curta certa (é o que faz um vídeo de idioma parecer um dicionário de verdade). `antes`: 8 a 12; `depois`: 3 a 6. Na dúvida, deixe de fora: sem vizinhos, a coluna mostra a fala do momento em itálico (a abonação), que já é conteúdo do vídeo.
- Os layouts de coluna larga só são usados por um `verbete` ou `remissao` com pelo menos 4 vizinhos e palavra que cabe grande na coluna.

**Desenhos prontos:** `"polvo"` (o animal) e `"poeira"` (nuvem de pó). Antes do `em`, o desenho aparece a lápis; no `em`, ganha tinta; num `parece`, é riscado junto. Fora disso, os blocos funcionam só com texto; desenho novo, veja `references/estilo.md`.

## 6. Regras de tempo

- **Momentos colados** (o `ate` de um = o `de` do próximo) é o normal neste modelo: as páginas viram uma atrás da outra. `de`: o corte logo antes da primeira palavra do momento (veja `cortesEm`), ou o `em` dessa palavra menos 0,05. `ate`: o `de` do momento seguinte.
- Duração de uma página: ~2,5 s ou mais (a virada leva 0,62 s). Um frontispício curto (~1,5 s, como uma frase de três palavras) funciona, porque a folha que sobe já traz o texto.
- Cada coisa entra no `em` da palavra que a nomeia. Nada aparece antes de ser dito (antes, só o traço a lápis).
- Momento com mais de ~4 s precisa de itens entrando por dentro dele (o `conferir.mjs` reprova um momento parado mais de 4,5 s). Numa página, a fala em itálico da coluna também anda palavra por palavra.
- No `verbete`: palavra-título → `parece.em` → `riscaEm` → `viraEm` → `significa.em` → `carimbo.em`, com pelo menos ~0,3 s entre um e outro e o carimbo pelo menos 0,5 s antes do fim.
- Não repita o mesmo bloco três vezes seguidas; alterne página e frontispício.

## 7. Legenda, correções e sons

A legenda é uma tira de papel com o texto em itálico serifado, sempre na mesma altura, acima da interface do app; a palavra dita fica em ameixa. Ela **some durante os momentos** (a página já mostra a fala na coluna). `"legenda": true` num momento mantém a legenda (o conteúdo sobe para caber em cima dela). `semLegenda` esconde trechos extras.

`correcoes` corrige palavras da transcrição, para a legenda e para a fala em itálico da coluna: `{ "calção": "caução", "Esquisito": "Exquisito" }`. A chave pode ter várias palavras seguidas e diferencia maiúsculas; `""` apaga a palavra. Não edite `palavras` à mão (o `cortar.mjs` reescreve esse campo).

Sons (tonais, raros, com no mínimo 0,45 s entre um e outro): a folha da abertura que sobe, cada virada de página, a folha de um frontispício no meio do vídeo (subindo ou virando), cada carimbo (verbete e destaque de alerta), a palavra certa (remissão, definição, vencedor da comparação) e o fechamento (a fita, ou um tom no ícone).

## 8. Exemplo completo (vídeo sobre cripto)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.89, "layout": "frontispicio", "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.62 },
    { "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "bull market", "em": 5.30, "significado": "ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "verbete", "de": 8.67, "ate": 17.25, "palavra": { "texto": "mercado subindo", "em": 8.77 },
      "parece": { "texto": "dinheiro no bolso", "em": 10.91, "riscaEm": 12.91 },
      "significa": { "texto": "tem gente que perde", "em": 15.96, "rotulo": "Mesmo na alta", "viraEm": 14.7 },
      "carimbo": { "em": 16.84 } },
    { "tipo": "topicos", "de": 17.25, "ate": 24.21, "titulo": "Por que perde", "itens": [
      { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21 }, { "texto": "Assume risco que não entende", "em": 21.25 } ] },
    { "tipo": "pergunta", "de": 24.21, "ate": 28.03, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita: como eu analiso", "itens": [
      { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.75 },
    { "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23, "opcoes": [
      { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder o patrimônio", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ]
}
```

Com esse plano: a folha sobe e o "US$ 83.000" conta em ameixa, com "[oitenta e três mil dólares]" por extenso; a folha vira e a pessoa encolhe para o quadro da direita enquanto "bull market" sai das lacunas a lápis e "1. ciclo de alta das criptomoedas" se escreve; a página vira para "mercado subindo", o cartão mostra "dinheiro no bolso", risca em "literalmente", gira em "Mesmo na alta" e o carimbo ENGANO COMUM bate em "perde"; na página seguinte, "Por que perde" vira a cabeça do verbete e os três motivos entram como acepções; a pergunta sobe numa folha com o "?"; a página dos passos encadeia mercado → riscos → ativos; "sem promessa de lucro" é riscado na epígrafe; a pergunta com opções e a chamada com o ícone de link fecham, cada folha virando sobre a seguinte.

## 9. O exemplo do modelo (professor de espanhol)

Roteiro: "Três palavras em espanhol que enganam todo brasileiro. 'Exquisito' não é esquisito: quer dizer delicioso. 'Embarazada' não é embaraçada: é grávida. E 'polvo' não é o animal: é poeira. O polvo, em espanhol, é 'pulpo'. Salva pra não passar vergonha na próxima viagem." O plano completo (com os vizinhos de cada página) está em `src/plano.json` do template. Os momentos, sem os vizinhos:

```json
[
  { "tipo": "abertura", "de": 0, "ate": 3.33, "texto": "palavras / em espanhol", "destaque": "enganam", "rotulo": "Falsos amigos · ES → PT",
    "numero": { "em": 0.1, "texto": "3" }, "subtitulo": "que enganam todo brasileiro" },
  { "tipo": "verbete", "de": 3.33, "ate": 7.1, "palavra": { "em": 3.41, "texto": "exquisito", "silabas": "ex·qui·si·to" }, "classe": "adj.", "pronuncia": "eks-ki-SÍ-to", "idioma": "ES",
    "parece": { "em": 4.6, "texto": "esquisito", "glosa": "estranho", "riscaEm": 5.25, "idioma": "PT" },
    "significa": { "em": 6.38, "texto": "delicioso", "extra": "requintado", "viraEm": 5.85 }, "carimbo": { "em": 6.62, "texto": "Falso amigo" } },
  { "tipo": "verbete", "de": 7.1, "ate": 10.46, "palavra": { "em": 7.2, "texto": "embarazada", "silabas": "em·ba·ra·za·da" }, "classe": "adj.", "pronuncia": "em-ba-ra-SSA-da", "idioma": "ES",
    "parece": { "em": 8.53, "texto": "embaraçada", "glosa": "envergonhada", "riscaEm": 9.12, "idioma": "PT" },
    "significa": { "em": 9.66, "texto": "grávida", "viraEm": 9.3 }, "carimbo": { "em": 9.98, "texto": "Falso amigo" } },
  { "tipo": "verbete", "de": 10.46, "ate": 13.53, "palavra": { "em": 10.55, "texto": "polvo", "silabas": "pol·vo" }, "classe": "s.m.", "pronuncia": "PÔL-bo", "idioma": "ES",
    "parece": { "em": 11.07, "texto": "polvo", "glosa": "o animal", "figura": "polvo", "riscaEm": 12.1, "idioma": "PT" },
    "significa": { "em": 12.92, "texto": "poeira", "extra": "pó", "figura": "poeira", "viraEm": 12.45 }, "carimbo": { "em": 13.05, "texto": "Falso amigo" } },
  { "tipo": "remissao", "de": 13.53, "ate": 16.1, "rotulo": { "em": 13.6, "texto": "O polvo, em espanhol" }, "figura": { "nome": "polvo", "em": 13.75 },
    "palavra": { "em": 15.28, "texto": "pulpo", "silabas": "pul·po" }, "classe": "s.m.", "pronuncia": "PUL-po", "definicao": { "em": 15.55, "texto": "polvo (o animal)" } },
  { "tipo": "cta", "de": 16.1, "ate": 19.28, "chamada": "Salva", "texto": "pra não passar vergonha / na próxima viagem.", "destaque": "vergonha", "icone": "salvar" }
]
```

Num vídeo de idioma: `correcoes` para as palavras estrangeiras que o Whisper aportuguesou (`{ "Esquisito": "Exquisito" }`, diferenciando maiúsculas), vizinhos reais no idioma, `idioma` nos chips, pronúncia aproximada e o carimbo "Falso amigo".
