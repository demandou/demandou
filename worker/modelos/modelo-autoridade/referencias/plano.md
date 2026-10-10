# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. Os blocos universais (`abertura`, `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `frase`, `pergunta`, `cta`)
3. A assinatura: `citacao` (o cartão-documento)
4. Os blocos do vídeo de exemplo (`gancho`, `lista`, `contraste`)
5. Regras de tempo e de ritmo
6. Legenda e correções
7. Enquadramentos (zoom)
8. Exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "sfx": true,
  "correcoes": { "Jão": "João", "chat GPT": "ChatGPT" }
}
```

- `marca`: aparece só no fechamento (`cta`). `nome` vazio = sem assinatura.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores.

Todo momento tem `tipo`, `de`, `ate` e, opcional, `legenda: true` (a legenda continua aparecendo durante ele; veja a seção 6).

## 2. Os blocos universais

Os blocos medem o texto com a própria fonte e reduzem o corpo até um mínimo legível (títulos 72 px, corpo 44 px), quebrando em 2 ou 3 linhas. Os limites abaixo existem porque, passando deles, o texto fica pequeno demais para ler no celular. Se a ideia não cabe, reescreva mais curto, com as palavras da fala, ou divida em dois blocos.

### `abertura`: título de abertura

A promessa, a pergunta ou o tema do vídeo. Cada palavra sobe de trás da máscara no instante em que é dita; o `destaque` fica em itálico latão e ganha um filete que se desenha quando termina de ser dito.

```json
{ "tipo": "abertura", "de": 0, "ate": 2.6, "rotulo": "Direito do consumidor",
  "texto": "Comprou pela internet e se arrependeu?", "destaque": "se arrependeu?" }
```

- `texto`: até ~50 caracteres. Use as palavras da fala, na ordem em que são ditas (cada palavra procura a sua na fala; palavra que não está na fala entra logo depois da anterior).
- `destaque` (opcional): trecho **exato** do texto.
- `em` (opcional): quando o texto começa a ser dito, se o momento começa antes ("Olha só: comprou pela…"). Padrão: `de`.
- `rotulo` (opcional): o tema em 2 a 4 palavras, em letreiro entre dois filetes.
- `ate`: no máximo ~1 s depois da última palavra. Título parado na tela é o erro que mais derruba a retenção.

### `topicos`: lista sem ordem

Motivos, erros, dicas, sinais. Cada item entra na sua palavra com um travessão de latão; os anteriores recuam.

```json
{ "tipo": "topicos", "de": 17.65, "ate": 23.65, "titulo": "Por que perde",
  "itens": [
    { "texto": "Compra por impulso", "em": 17.73 },
    { "texto": "Escolhe moeda sem critério", "em": 19.21 },
    { "texto": "Assume risco que não entende", "em": 21.25, "detalhe": "e não sabe o que comprou" } ] }
```

- 2 a 5 itens. `texto`: 2 a 6 palavras (até ~40 caracteres). `em`: o `em` da primeira palavra do item.
- `titulo` (opcional): letreiro curto em cima (até ~30 caracteres).
- `detalhe` (opcional): uma linha menor embaixo do item (até ~45 caracteres).
- `icone` (opcional, por item): `caixa`, `retorno`, `documento`, `relogio`, `escudo`, `check`, `alerta`, `moeda`, `grafico`, `lupa`, `pessoa`, `coracao`, `calendario`, `ideia`. Só se tiver a ver com o item; todos ou nenhum.
- Com 4 ou 5 itens longos, a lista rola: o item novo entra embaixo e o primeiro sai por cima, inteiro.
- Item falado em menos de ~1,2 s depois do anterior fica difícil de ler: junte os dois ou deixe com a legenda.

### `passos`: itens em ordem

Sequência, processo, caminho. Mesmos campos de `topicos`; aparece com numerais de latão (1, 2, 3…) ligados por um fio que se desenha de um passo ao seguinte.

```json
{ "tipo": "passos", "de": 10.98, "ate": 22.26, "titulo": "Funciona assim",
  "itens": [
    { "texto": "O prazo conta da chegada do produto", "em": 11.25 },
    { "texto": "A loja devolve tudo, inclusive o frete", "em": 15.1 },
    { "texto": "Peça por escrito e guarde o protocolo", "em": 18.98 } ] }
```

### `numero`: número em destaque

Um número dito que é o centro da frase: preço, prazo, porcentagem, quantidade, data. O numeral de latão conta até o valor a partir de `em` (números de um algarismo só sobem, sem contar).

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "prefixo": "US$", "em": 0.1,
  "rotulo": "O Bitcoin rompeu", "rotuloEm": 0.62 }
```

- `valor`: número (não texto). Formato pt-BR na tela: 83000 → "83.000"; 1.5 → "1,5" (`casas` fixa as casas decimais).
- `prefixo` (opcional): "R$", "US$". `sufixo` (opcional, até ~8 caracteres): "%", "mil", "mi", "dias", "kg". Para "83 mil", use `valor: 83, sufixo: "mil"` ou `valor: 83000`.
- `rotulo`: o que o número mede, com as palavras da fala (até ~40 caracteres). Curto e com `sufixo`: letreiro ao lado; longo ou sem `sufixo`: serifada embaixo. `rotuloEm` (opcional): quando o rótulo é dito.
- `marcadores` (opcional, 2 a 12): barrinhas que preenchem uma a uma, para contagens pequenas (7 dias, 3 parcelas).
- `ilustrativo: true` só se o número for um exemplo dado pela pessoa ("imagina que você ganhe 5 mil"): a etiqueta aparece.
- Hipótese sem número dito ("imagina quando chegar lá") não é `numero`.

### `comparacao`: dois lados

A × B, antes × depois, errado × certo, mito × verdade, quem ganha × quem perde.

```json
{ "tipo": "comparacao", "de": 8.62, "ate": 12.85, "modo": "contra",
  "lados": [
    { "rotulo": "O mercado", "texto": "Subindo", "em": 8.77 },
    { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `lados`: exatamente 2. `rotulo`: 1 a 3 palavras (letreiro). `texto`: até ~30 caracteres (até 3 linhas).
- `modo`: `contra` (× entre os cartões, padrão), `antes-depois` ou `errado-certo` (→ entre eles; o segundo lado vence sozinho).
- `vencedor` (opcional, 0 ou 1) e `vencedorEm`: o lado vencedor ganha o filete de latão e o visto; o outro devolve o papel e apaga. Sem `vencedorEm`, ~0,7 s depois do segundo lado.
- `titulo` (opcional): até ~30 caracteres, em serifada em cima.

### `grafico`: gráfico (recorte de jornal)

Algo que sobe, cai, cresce, proporções, evolução. O gráfico é impresso em tinta no cartão de papel.

Com números ditos (2 a 6):

```json
{ "tipo": "grafico", "de": 9, "ate": 13, "forma": "barras", "titulo": "Retorno por ano", "unidade": "%",
  "dados": [ { "rotulo": "2022", "valor": 12, "em": 9.4 }, { "rotulo": "2023", "valor": 35.5, "em": 10.2 },
             { "rotulo": "2024", "valor": 60, "em": 11.8 } ] }
```

Sem números ditos (forma qualitativa):

```json
{ "tipo": "grafico", "de": 9.3, "ate": 12.8, "forma": "linha", "titulo": "O mercado subindo",
  "tendencia": "sobe", "tendenciaEm": 9.31, "ilustrativo": true }
```

- `forma`: `barras` (cada barra cresce na sua palavra; a maior fica em latão), `linha` (o traço avança de ponto em ponto) ou `pizza` (um anel que se fecha fatia por fatia, com a legenda ao lado).
- `dados`: só números **ditos**. `rotulo` de cada dado: até ~14 caracteres (cabe em 2 linhas pequenas).
- `unidade` (opcional): curta ("%", "kg", "R$") vai junto de cada valor; longa ("em dólares") vira um letreiro sob o título.
- `tendencia`: `sobe`, `cai` ou `oscila`; `tendenciaEm`: quando a ideia é dita (a curva se desenha em ~1,7 s). Sem `dados`, `ilustrativo: true` é obrigatório.
- `titulo`: até ~30 caracteres.

### `destaque`: palavra ou frase que bate forte

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: 1 a 5 palavras (até ~30 caracteres). Monta-se palavra por palavra a partir de `em`.
- `nivel`: `chave` (padrão; itálico latão com filete) ou `alerta` (marfim, sinal de alerta e traço em lacre: risco, erro, perigo).
- `detalhe` (opcional, até ~50 caracteres) e `detalheEm`: uma linha menor embaixo, quando é dita.

### `definicao`: termo explicado

```json
{ "tipo": "definicao", "de": 5.2, "ate": 8.62, "termo": "Bull market", "em": 5.3,
  "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- Verbete no cartão de papel. `termo`: até ~24 caracteres. `significado`: até ~70 caracteres, com as palavras da fala; escreve-se palavra por palavra a partir de `significadoEm` e o marca-texto passa por baixo no fim.
- Comece o momento perto do `em` do termo (o papel entra junto com ele).

### `frase`: frase de efeito

```json
{ "tipo": "frase", "de": 14.9, "ate": 17.65, "texto": "Mesmo na alta, tem gente que perde", "destaque": "perde", "em": 14.93 }
```

- `texto`: até ~70 caracteres, fiel ao que foi dito. Monta-se palavra por palavra.
- `destaque` (opcional): trecho exato em itálico latão.
- `risco` (opcional): trecho exato riscado em lacre quando é dito ("sem ~~promessa de lucro~~"); `riscoEm` fixa o instante.
- `em` (opcional): quando o texto começa a ser dito. `rotulo` (opcional): letreiro em cima.
- Uma ou duas por vídeo. Se tudo é frase de efeito, nada é.

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres (sem opções, até 3 linhas; com opções, até 2). Monta-se palavra por palavra a partir de `em`.
- `opcoes` (opcional): 2 a 4, até ~28 caracteres cada; cada cartão se enche de papel no seu `em`. Pergunta longa com opções: comece o momento nas últimas palavras dela e deixe o começo com a legenda (cartões apagados por muito tempo parecem travados).

### `cta`: fechamento

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: até ~30 caracteres (até 2 linhas). `destaque` (opcional) em itálico latão.
- `icone`: `salvar` (padrão), `seguir`, `comentar` ou `link` (saiba mais, link na bio).
- Se for o último momento, fica na tela até o fim do vídeo, com a assinatura (`marca`).

## 3. A assinatura: `citacao` (o cartão-documento)

O documento que sustenta a fala: papel marfim com filete de latão, a `fonte` em letreiro, o `titulo` em serifada e, embaixo, **um** dos dois:

- **Trecho com marca-texto** (`texto` + `grifo`): para lei, estudo, norma, regra, recomendação, uma frase de alguém.

```json
{ "tipo": "citacao", "de": 6.63, "ate": 10.22, "fonte": "Lei nº 8.078/1990 · CDC", "titulo": "Art. 49",
  "texto": "O consumidor pode desistir do contrato, no prazo de 7 dias a contar de sua assinatura ou do ato de recebimento do produto ou serviço…",
  "grifo": "no prazo de 7 dias", "grifoEm": 8.7 }
```

- **Ficha** (`itens`): para o conteúdo de uma aula, ingredientes, regras de um combinado, o que vem num plano, cláusulas, sintomas. As linhas já aparecem pautadas a lápis e cada uma se escreve no seu `em`; o `grifo` (opcional) marca uma delas.

```json
{ "tipo": "citacao", "de": 28.0, "ate": 35.2, "titulo": "Aula gratuita", "em": 28.62,
  "itens": [ { "texto": "Como eu analiso o mercado", "em": 30.09 }, { "texto": "Os riscos", "em": 31.47 },
             { "texto": "A escolha dos ativos", "em": 32.21 }, { "texto": "Sem promessa de lucro", "em": 33.83 } ],
  "grifo": "Sem promessa de lucro", "grifoEm": 34.55 }
```

- `titulo`: até ~20 caracteres. `fonte` (opcional): quem publicou ou o tipo do documento (até ~40 caracteres). `texto`: até ~130 caracteres. `itens`: 2 a 5 (até 6), até ~32 caracteres cada.
- `grifo`: trecho **exato** do `texto` (ou o texto de um item); `grifoEm`: quando a ideia grifada é dita.
- `em` (opcional): quando o título é dito; o papel entra junto com ele. Comece o momento perto dessa palavra.
- Até ~7 s na tela, com uma linha ou o grifo entrando a cada 1,5 a 2,5 s.
- **Texto literal de lei, norma ou estudo só se o usuário forneceu ou se você tem certeza dele.** Na dúvida, o `texto` é um resumo fiel do que a pessoa falou.
- Use **pelo menos uma vez** por vídeo (o `conferir.mjs` cobra). Veja "A assinatura em qualquer assunto" no SKILL.md.

## 4. Os blocos do vídeo de exemplo

Continuam funcionando, mas para vídeos novos prefira os universais:

- `gancho` (`linhas` até 3, `enfase` = índice da linha em itálico) → prefira `abertura`.
- `lista` (`rotulo`, `itens` com `icone`, numerada) → prefira `passos` ou `topicos`.
- `contraste` (`pergunta` + 2 `opcoes` + `conector`) → prefira `pergunta` com `opcoes`.

## 5. Regras de tempo e de ritmo

- `de`: o `em` da primeira palavra que o momento cobre, menos 0,05 (nunca antes do `ate` do momento anterior).
- `ate`: o `em` da **primeira palavra que o momento não cobre** (a frase seguinte), ou o fim do vídeo. Momentos vizinhos podem encostar: o que sai apaga antes do que entra aparecer.
- Duração mínima: 1,8 s.
- Nada parado: dentro de um momento, algo novo (uma palavra, um item, um grifo, um lado) a cada 1,5 a 2,5 s. Momento com mais de ~4 s precisa de itens com `em` por dentro.
- Cobertura: pelo menos ~70% do vídeo com bloco na tela; nenhum trecho de mais de ~3,5 s só com a pessoa e a legenda.
- Variedade: um vídeo de 30 a 60 s pede 7 a 12 momentos, de 4 ou mais tipos. Não repita o mesmo bloco três vezes seguidas.
- Nunca dois momentos ao mesmo tempo.

## 6. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez, logo abaixo da zona dos blocos. Ela **some durante um momento**, porque o bloco já mostra o que é dito. Dois ajustes:

- `"legenda": true` no momento: a legenda continua durante ele. Use quando o bloco mostra só parte da fala (um `numero` que fica na tela enquanto a pessoa explica).
- `semLegenda`: faixas extras sem legenda, para esconder só o trecho que o bloco já mostra:

```json
"semLegenda": [ { "de": 2.6, "ate": 4.75 } ]
```

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "Jão": "João", "chat GPT": "ChatGPT", "né": "" }`. A chave pode ter várias palavras seguidas (viram uma só) e `""` apaga a palavra. Só corrija o que você tem certeza. Não edite `palavras` à mão: o `cortar.mjs` reescreve esse campo.

Para ver todas as linhas de legenda antes de renderizar: `node scripts/legendas.mjs`.

## 7. Enquadramentos (zoom)

Não precisa escrever nada: sem o campo `enquadramentos`, o template troca o zoom (entre 1 e 1,05) em cada corte, para disfarçar o pulo, e na entrada dos momentos, para dar ritmo. O zoom parte do rosto, então o rosto não sai do lugar.

Só escreva `enquadramentos` se quiser controlar à mão; aí ele substitui o automático inteiro: `[ { "de": 0, "zoom": 1 }, { "de": 2.6, "zoom": 1.05 } ]`. Troca seca no início de uma frase ou em cima de um corte; entre 1 e 1,08; trechos de 3 a 8 s.

## 8. Exemplo completo (cripto, 43 s)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "prefixo": "US$", "em": 0.1, "rotulo": "O Bitcoin rompeu", "rotuloEm": 0.62 },
    { "tipo": "definicao", "de": 5.2, "ate": 8.62, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.62, "ate": 12.85, "modo": "contra", "lados": [
      { "rotulo": "O mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "frase", "de": 14.9, "ate": 17.65, "texto": "Mesmo na alta, tem gente que perde", "destaque": "perde", "em": 14.93 },
    { "tipo": "topicos", "de": 17.65, "ate": 23.65, "itens": [
      { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21 },
      { "texto": "Assume risco que não entende", "em": 21.25 } ] },
    { "tipo": "pergunta", "de": 24.15, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "citacao", "de": 28.0, "ate": 35.2, "titulo": "Aula gratuita", "em": 28.62, "itens": [
      { "texto": "Como eu analiso o mercado", "em": 30.09 }, { "texto": "Os riscos", "em": 31.47 },
      { "texto": "A escolha dos ativos", "em": 32.21 }, { "texto": "Sem promessa de lucro", "em": 33.83 } ],
      "grifo": "Sem promessa de lucro", "grifoEm": 34.55 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer…", "em": 35.23, "opcoes": [
      { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

De 2,9 s a 5,2 s ("e reacendeu a conversa sobre o novo") fica só a pessoa com a legenda: um respiro curto entre o número e a definição.
