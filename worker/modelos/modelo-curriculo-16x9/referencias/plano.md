# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `documento`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. A gramática da revisão (onde fica a pessoa, o que a folha faz)
2. Campos gerais e o `documento`
3. Os 11 blocos universais
4. A assinatura e os tipos próprios (`marcar`, `riscar`, `reescrever`, `cronometro`, `paginas`)
5. Regras de tempo
6. Legenda, correções e ajustes de enquadramento
7. Exemplo completo (cripto) e o demo (carreira)

## 1. A gramática da revisão

A tela é uma mesa cinza com uma folha branca: o documento do assunto. Cada momento que acontece na folha vira uma **seção**, de cima para baixo, na ordem do vídeo, e a câmera anda até a seção da vez. A pessoa é um **bilhete adesivo de papel** (aba vermelha com o nome) e muda de lugar conforme o tipo do momento. Você não escreve posições: elas saem do tipo.

| Tipo | Onde fica a pessoa | O que a folha faz |
|---|---|---|
| `abertura`, `destaque`, `cta` | tela cheia (cartão de papel no peito) | sai do quadro por baixo |
| `topicos`, `passos`, `definicao`, `frase`, `marcar`, `riscar`, `paginas` | bilhete na margem direita, com uma seta de caneta até a seção | folha em tamanho de leitura; a seção da vez no meio da tela |
| `numero`, `comparacao`, `grafico`, `reescrever` | bilhete largo embaixo | a folha se aproxima (até 1,4×) e mostra só a seção, em cima; o resto da folha fica a meio-tom |
| `pergunta`, `cronometro` | bilhete grande em cima | a folha embaixo (pergunta: um pouco ampliada, com um bilhete "?" na margem; cronômetro: o começo da folha e o mostrador) |

Regras que valem para todos:

- **A folha é uma só e guarda as marcas.** O que a caneta riscou, circulou ou escreveu continua lá; a câmera volta a passar por ali.
- **Lápis → tinta.** Uma seção aparece a lápis uns 3 s antes do momento dela (antes disso, só barras de esboço); cada palavra ganha tinta quando é dita. Por isso os textos da folha precisam ser **as palavras da fala, na ordem** (pode resumir, mas as palavras que ficam devem ser as ditas).
- **A caneta age na palavra.** Visto, número circulado, risco, círculo, chave, seta e notas à mão acontecem no `em` da palavra que os justifica.
- **Nada que não foi dito.** Número, prazo, porcentagem ou fato só entra na tela se a pessoa disse.
- Entre dois momentos com mais de 0,15 s de intervalo a pessoa volta para a tela cheia e a legenda aparece. Momentos encostados (o `ate` de um = o `de` do seguinte) fazem a pessoa ir direto de um lugar para o outro.
- **Todo texto é medido.** Ele quebra em até 2 ou 3 linhas e diminui até um mínimo legível; nunca vaza. Os limites abaixo são para ficar **bonito** (corpo grande, poucas linhas); passar deles não quebra, mas deixa a letra menor.

## 2. Campos gerais e o `documento`

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "documento": { "titulo": "Bitcoin em alta", "subtitulo": "Análise · criptomoedas" },
  "sfx": true
}
```

- `marca.nome`: na aba vermelha do bilhete (até **14 caracteres** ficam numa linha) e, com `area`, na assinatura do fechamento. Vazio = "Comentário" e sem assinatura.
- `documento.titulo`: o título grande da folha: **o tema do vídeo** ("Treino de corrida", "Sono", "Bitcoin em alta"), um nome fictício (currículo) ou o título de um texto. Até **24 caracteres** numa linha (até ~45 em duas). Nunca um nome real nem dados de contato.
- `documento.subtitulo` (opcional): a linha em caixa alta embaixo ("Anotações · corrida", "Analista comercial"). Até **26 caracteres**.
- `documento.extras` (opcional): seções que só compõem a folha, em texto apagado, depois das seções do vídeo: `[{ "titulo": "Formação", "linhas": ["Administração · 2020"] }]`. Coisas neutras e plausíveis; 0 a 2 seções.
- Sem `documento`, a folha usa o `marca.nome` ou "Anotações" como título.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 3. Os 11 blocos universais

Os mesmos tipos e campos de todos os modelos do pack, desenhados na linguagem da revisão. Campos comuns: `tipo`, `de`, `ate`, `legenda?`. Todo `em`/`…Em` é o instante de uma palavra dita.

### `abertura` — título no peito (tela cheia)

```json
{ "tipo": "abertura", "de": 0, "ate": 1.92, "texto": "Quer correr mais sem se machucar?", "destaque": "sem se machucar", "em": 0.28 }
```

- `texto`: as palavras da fala, até **45 caracteres** (quebra sozinho em 2 ou 3 linhas, 96 → 56 px).
- `destaque` (opcional): trecho exato do texto. Uma palavra = a caneta circula; um trecho = a caneta sublinha, quando ele termina de ser dito.
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`). Use quando o momento começa antes da primeira palavra do texto.
- `rotulo` (opcional): o tema, em caixa alta pequena em cima (até 24 caracteres). `linhas` (opcional): quebra manual, uma string por linha.
- O cartão sai 0,3 s antes do `ate`, para a troca de lugar acontecer limpa.

### `topicos` — lista (margem)

```json
{ "tipo": "topicos", "de": 30.05, "ate": 33.78, "titulo": "Os três erros",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 },
             { "texto": "Escolhe sem critério", "em": 19.21, "detalhe": "só porque viu no grupo" } ] }
```

- `titulo` (opcional): título da seção em caixa alta, até **26 caracteres** (até ~50 em duas linhas).
- `itens`: **2 a 5**, cada um com `texto` (até **24 caracteres** numa linha; até ~45 em duas) e `em` (a palavra que nomeia o item). O marcador a lápis vira um visto de caneta e o texto ganha tinta na fala.
- `detalhe` (opcional): escrito à mão embaixo do item, até **40 caracteres**.

### `passos` — sequência (margem)

Mesmos campos de `topicos`. Os itens ganham números escritos à mão, circulados na hora em que o passo é dito; um traço de caneta liga um número ao próximo. Use quando a ordem importa (processo, caminho, "primeiro… depois…").

### `numero` — número (embaixo, folha ampliada)

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número dito (conta de 0 até ele a partir de `em`, em ~1 s, e a caneta circula). Formato pt-BR automático: 83.000; 1,5.
- `casas` (opcional): casas decimais (padrão 0). `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "mi", "km", "horas"): menores, ao lado. "83 mil dólares" = `valor: 83000, prefixo: "US$"` ou `valor: 83, sufixo: "mil"`.
- `rotulo`: o que o número mede, com as palavras da fala, até **40 caracteres** (fica em cima do número). `rotuloEm` (opcional): quando o rótulo é dito (padrão: `em`).
- `ilustrativo: true`: escreve "ilustrativo" à mão embaixo. Só para número que não é um dado real dito.

### `comparacao` — dois lados (embaixo)

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 },
             { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `lados`: exatamente 2, cada um com `rotulo` (caixa alta, até **14 caracteres**), `texto` (até **30 caracteres**, quebra em até 3 linhas na coluna) e `em`.
- `modo`: `contra` (padrão: × de caneta no fio do meio), `antes-depois` (seta) ou `errado-certo` (o primeiro é o errado: é riscado; o segundo ganha caixa e visto).
- `vencedor` (opcional, 0 ou 1): o lado que ganha (caixa e visto); o outro é riscado. `vencedorEm`: quando (padrão: logo depois que os dois foram ditos).
- `titulo` (opcional): título da seção em caixa alta.

### `grafico` — desenhado a caneta (embaixo)

```json
{ "tipo": "grafico", "de": 11.49, "ate": 13.41, "forma": "pizza", "titulo": "Os treinos", "unidade": "%",
  "dados": [ { "rotulo": "Na zona 2", "valor": 80, "em": 10.63 }, { "rotulo": "Mais fortes", "valor": 20, "em": 12.01 } ] }
```

- `forma`: `barras` (colunas que sobem na palavra, valor escrito à mão em cima), `linha` (pontos ligados a caneta) ou `pizza` (círculo em fatias, legenda à direita).
- `dados`: **2 a 6** números **ditos**, cada um com `rotulo` (até **14 caracteres** com 2 a 3 dados; até **8** com 5 a 6), `valor` e `em`. Um dado dito antes do momento (`em` menor que `de`) já aparece pronto quando a câmera chega.
- `unidade` (opcional): "%", "km", "mil"… vai junto de cada valor.
- **Sem números ditos**: deixe `dados` de fora e use `tendencia` (`sobe`, `cai` ou `oscila`) com `ilustrativo: true`: uma curva desenhada a caneta, com seta, e "ilustrativo" à mão. `tendenciaEm` (opcional): quando a caneta começa (padrão: logo depois do início).
- `titulo` (opcional): caixa alta, até **24 caracteres** (com "ilustrativo", ele fica mais estreito).

### `destaque` — palavra ou frase curta que bate (tela cheia)

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: até **40 caracteres** (2 ou 3 linhas, 84 → 52 px), as palavras da fala.
- `nivel`: `alerta` (padrão: "!" circulado, a frase escrita à mão em vermelho, dois traços embaixo) ou `chave` (a frase em tinta, sublinhada).
- `detalhe` (opcional): até **40 caracteres**, menor, embaixo; `detalheEm`: quando é dito.
- O cartão entra quando a pessoa já está em tela cheia (0,4 s depois do `de`).

### `definicao` — termo explicado (margem)

```json
{ "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo`: até **24 caracteres** (56 px, até 2 linhas). Ganha tinta no `em` e é sublinhado quando o significado começa.
- `significado`: até **60 caracteres**, escrito à mão depois de uma seta, palavra por palavra a partir de `significadoEm`.

### `frase` — citação ou frase de efeito (margem)

```json
{ "tipo": "frase", "de": 33.78, "ate": 35.2, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro" }
```

- `texto`: até **70 caracteres** (50 → 36 px, até 3 linhas), as palavras da fala; aspas de caneta na margem.
- `destaque` (opcional): trecho exato, sublinhado quando é dito.
- `risco` (opcional): trecho exato, riscado logo depois de ser dito (ou em `riscoEm`).
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`).

### `pergunta` — pergunta para quem assiste (em cima)

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até **60 caracteres** (52 → 38 px, até 3 linhas). `em` (opcional): quando começa a ser dito.
- `opcoes` (opcional): **2 a 4**, cada uma até **28 caracteres**, com `em`: a caixinha é desenhada a caneta e o texto ganha tinta.
- Um bilhete com "?" escrito à mão entra na margem da folha.

### `cta` — fechamento (tela cheia)

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: as palavras da fala, até **45 caracteres** (escrito à mão em 2 ou 3 linhas, 76 → 48 px).
- `icone`: `salvar` (padrão), `seguir`, `comentar` ou `link`.
- `destaque` (opcional): uma palavra é circulada; um trecho é sublinhado.
- `em` (opcional): quando o texto começa a ser dito. Se for o último momento, fica até o fim do vídeo.

## 4. A assinatura e os tipos próprios

**Use pelo menos um de `marcar`, `riscar` ou `reescrever` em todo vídeo** (o `conferir.mjs` exige em vídeos de mais de 15 s). Veja "A assinatura em qualquer assunto" no SKILL.md.

### `marcar` — linhas com chave e diagnóstico (margem)

Para 2 a 4 coisas enumeradas (erros, causas, sintomas, hábitos, regras). As linhas ganham tinta uma a uma, a caneta abre uma chave na margem e escreve o diagnóstico embaixo; `pergunta` acrescenta uma seta e a segunda nota (a saída).

```json
{ "tipo": "marcar", "de": 14.9, "ate": 24.15, "secao": "Mesmo na alta", "subtitulo": "Tem gente que perde porque",
  "linhas": [ { "texto": "Compra por impulso", "em": 17.73 },
              { "texto": "Escolhe moeda sem critério", "em": 19.21 },
              { "texto": "Assume risco que não entende", "em": 21.25 } ] }
```

- `secao`: título da seção, até **26 caracteres**.
- `subtitulo` (opcional): até **30 caracteres**; ganha tinta quando é dito (se não é dito, entra logo no começo). A seta do bilhete aponta para ele.
- `linhas`: 2 a 4, até **24 caracteres** (até ~45 em duas linhas). Cada uma ganha tinta palavra por palavra a partir do seu `em`. Linhas que não são ditas (o exemplo do documento) entram em sequência rápida: ponha `em` 0,1–0,15 s uma da outra.
- `nota` (opcional): o diagnóstico, até **14 caracteres**, `em` = a palavra que diz o problema; a chave se desenha nela. Sem `nota`, a chave se fecha quando a última linha termina de ser dita.
- `pergunta` (opcional): depois de uma seta, até **16 caracteres** ("resultados?", "pausa"). `nota` + `pergunta` juntas cabem numa linha.
- `erro` e `resumo` (opcionais, só em vídeos do tipo "três erros"): o bilhete mostra "2 de 3" à mão e o erro vira um bilhete resolvido no alto da margem.

### `riscar` — a ideia errada (margem)

```json
{ "tipo": "riscar", "de": 4.0, "ate": 7.85, "secao": "Objetivo", "frase": "Busco crescer na empresa.",
  "riscoEm": 7.25, "nota": { "texto": "genérico", "em": 4.6 } }
```

- `secao`: até **26 caracteres** ("Mito", "Crença", "Objetivo").
- `frase`: as palavras citadas, na ordem da fala, até **45 caracteres** (até 2 linhas).
- `nota` (opcional): por que está errado, até **26 caracteres**, `em` = a palavra que diz o problema. A seta do bilhete aponta para ela.
- `riscoEm` (opcional): quando o risco passa (padrão: logo depois da última palavra da frase).
- `erro`, `resumo` (opcionais): como no `marcar`.

### `reescrever` — antes → depois (embaixo)

A câmera chega perto da linha; ela é riscada **palavra por palavra** enquanto a pessoa diz a versão velha; um sinal de inserção abre espaço e a versão nova é escrita à mão; o `destaque` é circulado; no fim a troca é aceita e a linha nova entra impressa.

```json
{ "tipo": "reescrever", "de": 10.46, "ate": 15.7, "antes": "Responsável pelas vendas", "depois": "Aumentei as vendas em 20%", "destaque": "20%", "aceitaEm": 15.25 }
```

- `antes`: as palavras da fala, até **30 caracteres**. Se for igual a uma linha de um `marcar` anterior, a reescrita acontece nela; senão vira uma seção nova (dê `secao`).
- `depois`: as palavras da fala na ordem, até **34 caracteres**. Número dito por extenso ("vinte por cento") pode ser escrito em algarismos ("20%").
- `destaque` (opcional): uma palavra exata de `depois`, circulada.
- `aceitaEm` (opcional): quando a linha nova entra impressa (padrão: 0,3 s depois da última palavra).
- Pede 3,5 s ou mais.

### `cronometro` — leitura ou tempo (em cima)

```json
{ "tipo": "cronometro", "de": 15.7, "ate": 18.3, "frase": "Recrutador lê em segundos", "voltaEm": 17.3, "fim": { "texto": "Facilita.", "em": 17.56 } }
```

- `frase`: as palavras da fala, até **28 caracteres**, em duas linhas embaixo do mostrador.
- `segundos` (opcional): **só se a pessoa disser o número**; o mostrador ganha N divisões e o número assenta com a `unidade` (padrão "segundos").
- `voltaEm` (opcional): quando o ponteiro fecha a volta. `fim` (opcional): a palavra de conclusão; a caneta enquadra a linha reescrita (ou a primeira linha marcada) e dá um visto.

### `paginas` — excesso de volume (margem)

```json
{ "tipo": "paginas", "de": 2.44, "ate": 4.0, "total": 3, "ideal": 2, "xEm": 2.87, "nota": { "texto": "máx. 2 páginas", "em": 3.3 } }
```

- `total` (2 a 4 folhas) e `ideal` (menor): ditos na fala. `unidade` (opcional, padrão "páginas") é a palavra ao lado do contador.
- `xEm`: a palavra do número certo; o risco, o número novo e o X acontecem aí. `nota` (opcional): até 18 caracteres.

## 5. Regras de tempo

- `de`: o `em` da primeira palavra que o momento cobre, menos 0,05 (nunca menor que 0 nem antes do `ate` do momento anterior). As trocas de lugar começam em cima do corte mais próximo, se houver um a menos de 0,15 s.
- `ate`: o `em` da **primeira palavra que o momento não cobre**, ou o fim do vídeo.
- Duração mínima: 1,5 s. Algo precisa mudar a cada ~1,5–2,5 s: momento de mais de ~4 s precisa de itens entrando por dentro dele (o `conferir.mjs` reprova acima de 4,5 s parado).
- Item, lado, dado, nota, risco: `em` = o `em` da palavra que o nomeia. Nada aparece antes de ser dito.
- Não repita o mesmo tipo três vezes seguidas; alterne os lugares da pessoa (margem → embaixo → tela cheia → em cima).
- A câmera se aproxima devagar da folha durante cada momento (sozinha): não precisa de nada no plano.

## 6. Legenda, correções e ajustes de enquadramento

A legenda é montada sozinha a partir de `palavras`: uma tira de papel abaixo do queixo. Ela **some durante os momentos** (a folha já mostra o que é dito). `"legenda": true` num momento a mantém; `semLegenda` esconde trechos extras.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Jão": "João" }`. Não edite `palavras` à mão.

Enquadramento da pessoa em cada lugar: se a cabeça cortar ou o rosto ficar pequeno num dos bilhetes, ajuste em `caixas` (o padrão serve para a maioria das gravações):

```json
"caixas": { "margem": { "zoom": 1.45, "ancoraY": 0.48 }, "topo": { "zoom": 1.1 } }
```

`zoom` maior aproxima; `ancoraY` (0 a 1) é a altura do rosto dentro do bilhete. Lugares: `cheio`, `margem`, `embaixo`, `topo`. Confira com `stills.mjs --guias <tempo>`.

## 7. Exemplo completo (cripto) e o demo (carreira)

Fala (43 s): "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "documento": { "titulo": "Bitcoin em alta", "subtitulo": "Análise · criptomoedas" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "marcar", "de": 14.9, "ate": 24.15, "secao": "Mesmo na alta", "subtitulo": "Tem gente que perde porque",
      "linhas": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21 },
                  { "texto": "Assume risco que não entende", "em": 21.25 } ] },
    { "tipo": "pergunta", "de": 24.15, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "destaque", "de": 28.0, "ate": 30.05, "texto": "Uma aula gratuita", "em": 28.46, "nivel": "chave", "detalhe": "para te explicar", "detalheEm": 29.27 },
    { "tipo": "passos", "de": 30.05, "ate": 33.78, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.78, "ate": 35.2, "texto": "Sem promessa de lucro", "em": 33.83, "risco": "promessa de lucro" },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

A pessoa faz o caminho embaixo → margem → embaixo → tela cheia → margem → em cima → tela cheia → margem → margem → em cima → tela cheia; a folha guarda as seções na ordem (número, definição, comparação, diagnóstico, pergunta, passos, frase, pergunta). Nada é ilustrativo: todos os números foram ditos.

O demo do modelo (carreira, 20,8 s: "Três erros que derrubam o seu currículo…") está em `src/plano.json` do template: `abertura` com `linhas`, `paginas`, `riscar`, `marcar` (com `erro`, `nota` e `pergunta`), `reescrever` na linha do `marcar`, `cronometro` sem número (a fala diz só "em segundos") e `cta`.
