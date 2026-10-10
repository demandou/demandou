# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `assunto`, `momentos`, `semLegenda` e `correcoes` (e, se quiser, `passado` e `caixas`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. Onde a pessoa fica (layouts)
3. O passado (a foto de arquivo)
4. Os 11 blocos universais
5. A assinatura e os outros tipos do modelo
6. Regras de tempo
7. Legenda e correções
8. Exemplo (vídeo sobre cripto)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Ana Lima", "area": "Nutrição" },
  "assunto": "Criptomoedas",
  "sfx": true,
  "correcoes": { "Com o texto": "Contexto" }
}
```

- `marca`: aparece só no fechamento (`cta`), como assinatura de documentário. `nome` vazio = sem assinatura.
- `assunto`: vai no cabeçalho das folhas ("ARQUIVO · CRIPTOMOEDAS") e no rótulo da `abertura`. Curto: até ~24 caracteres.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.
- `caixas` (opcional): ajuste fino da pessoa na foto de cada layout, se o rosto ficar cortado: `"caixas": { "base": { "ancoraY": 0.5, "zoom": 1.15 } }`. `ancoraY` = altura do rosto dentro da foto (0 = topo, 1 = base); `zoom` acima de 1 aproxima.

## 2. Onde a pessoa fica

Cada bloco tem um layout padrão; os de folha aceitam outro com `"layout"`.

| Layout | A pessoa | O documento | Padrão de |
|---|---|---|---|
| `cheio` | vídeo em tela cheia, em cores (o presente) | supers na altura do peito | `abertura`, `numero`, `destaque`, `frase`, `pergunta`, `cta`, `credito`, `linha` |
| `base` | foto de arquivo larga, embaixo | a parte de cima da folha | `topicos`, `comparacao`, `ficha`, `pessoas` (e `passos` sem título) |
| `topo` | foto de arquivo larga, em cima | a metade de baixo | `grafico`, `camadas` |
| `canto` | foto pequena no canto de cima, à direita | o título ao lado da foto e o corpo na largura toda, embaixo | `passos` (com título), `definicao`, `escala`, `local` |

- `topicos`, `passos`, `comparacao` e `grafico` só vão para o `canto` com `titulo` (o título ocupa o lugar ao lado da foto).
- **A foto muda de lugar a cada documento.** Se dois documentos seguidos cairiam no mesmo layout, o template manda o segundo para outro layout que ele aceita. Para escolher você mesmo, use `"layout"`.
- Entre um momento e outro, se houver um respiro de mais de 0,3 s, a pessoa volta para a tela cheia.
- `esquerda` e `direita` (foto numa coluna ao lado) existem só para o exemplo antigo do modelo: não use (a pessoa sai do quadro numa coluna estreita).

## 3. O passado

`passado` é a lista de trechos em que a imagem da pessoa vira **arquivo** (preto e branco, grão, vinheta). Sem o campo, ela vira arquivo durante os documentos de folha e volta a ter cor em tela cheia — é o certo para quase todo vídeo.

- Num vídeo de história, você pode marcar o passado de verdade: comece na palavra que leva para trás ("em 1931", "naquela época") e termine na que traz de volta ("hoje").
- `"passado": []` deixa a foto sempre em cores.

## 4. Os 11 blocos universais

Campos comuns: `tipo`, `de`, `ate`, `legenda?` (true = a legenda continua durante o momento) e `layout?`.

Os limites de texto são para caber legível no celular: o template mede o texto, diminui o corpo e quebra em linhas, mas passou do limite, fica pequeno. Encurte com as palavras da fala.

### `abertura` (tela cheia)

```json
{ "tipo": "abertura", "de": 0, "ate": 3.55, "texto": "Seu resultado com IA é ruim porque o pedido é vago", "destaque": "vago", "em": 0.28 }
```

- `texto`: até ~55 caracteres; vira caixa alta e bate palavra por palavra (cada palavra no instante em que é dita).
- `destaque` (opcional): trecho exato do texto que ganha a tarja vermelha.
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`).
- `rotulo` (opcional): o rótulo pré-impresso acima do título (padrão: o `assunto`).

### `topicos` — relatório com linhas numeradas (folha)

```json
{ "tipo": "topicos", "de": 10.64, "ate": 13.78, "titulo": "Contexto",
  "itens": [ { "texto": "Vegetariano", "em": 11.69 }, { "texto": "Treino de manhã", "em": 12.8, "detalhe": "antes do trabalho" } ] }
```

- 2 a 5 itens **sem ordem** (motivos, erros, dicas, sinais). `texto`: 2 a 6 palavras (até ~30 caracteres). `detalhe` (opcional): até ~30, em máquina de escrever, embaixo.
- `titulo` (opcional): até ~30 caracteres, datilografado no começo do momento.

### `passos` — fichas ligadas pelo fio vermelho (folha)

```json
{ "tipo": "passos", "de": 30.09, "ate": 33.83, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- 2 a 5 itens **em ordem** (sequência, processo, caminho). `texto`: até ~30 caracteres. `detalhe` (opcional): até ~30.

### `numero` — o número na régua (tela cheia)

```json
{ "tipo": "numero", "de": 0, "ate": 4.68, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número dito (número de verdade: `83000`, `1.5`). Conta de 0 até ele a partir de `em`, em pt-BR ("83.000", "1,5"); a régua corre junto, sob o ponteiro vermelho.
- `prefixo`/`sufixo` (opcionais): "US$", "R$", "%", "mil", "kg", "peças" (até ~10 caracteres). `casas`: casas decimais.
- `rotulo`: o que é o número, até ~30 caracteres, datilografado em `rotuloEm` (padrão: um pouco antes do número).
- `ilustrativo: true` só se o número não foi dito exatamente (aparece o carimbo ILUSTRATIVO). O normal é não usar.

### `comparacao` — dois documentos lado a lado (folha)

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `modo`: `contra` (selo ×), `antes-depois` ou `errado-certo` (selo →).
- `rotulo`: até ~16 caracteres; `texto`: até ~40.
- `vencedor` (0 ou 1, opcional) e `vencedorEm`: o lado que ganha recebe um círculo vermelho à mão e o outro um risco na diagonal. Em `errado-certo`, o lado 1 é o certo mesmo sem `vencedor`.

### `grafico` — anexo em papel quadriculado (folha)

```json
{ "tipo": "grafico", "de": 5.2, "ate": 9.0, "titulo": "Vendas por mês", "forma": "barras", "unidade": "mil",
  "dados": [ { "rotulo": "Janeiro", "valor": 12, "em": 6.1 }, { "rotulo": "Fevereiro", "valor": 18, "em": 7.0 } ] }
```

- `forma`: `barras`, `linha` ou `pizza`. `dados`: 2 a 6 números **ditos**, cada um no seu `em`. `rotulo`: até ~14 caracteres.
- Sem números ditos: troque `dados` por `"tendencia": "sobe" | "cai" | "oscila"`, `tendenciaEm` (a palavra que fala da subida/queda) e `"ilustrativo": true`. A curva (ou barras, ou a fatia da pizza) mostra só a tendência, com o carimbo ILUSTRATIVO.
- `unidade` (opcional): vai junto de cada valor ("mil", "%", "kg"); na pizza, `%` usa os valores como porcentagens.

### `destaque` — a tira de papel no peito (tela cheia)

```json
{ "tipo": "destaque", "de": 12.91, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: até ~30 caracteres (caixa alta, até 2 linhas). `nivel`: `alerta` (padrão: carimbo vermelho que bate) ou `chave` (datilografado e sublinhado).
- `detalhe` e `detalheEm` (opcionais): uma linha a mais, até ~40 caracteres.

### `definicao` — ficha catalográfica (folha)

```json
{ "tipo": "definicao", "de": 4.68, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo`: até ~24 caracteres. `significado`: até ~90 (datilografado nas linhas da ficha).

### `frase` — citação (tela cheia)

```json
{ "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.8 }
```

- `texto`: até ~70 caracteres, com as palavras da fala (bate palavra por palavra).
- `destaque` (opcional): trecho com a tarja vermelha. `risco` (opcional): trecho rasurado em vermelho a partir de `riscoEm` (use o fim da última palavra do trecho: a rasura passa por cima do que acabou de ser dito).
- `em` (opcional): quando o texto começa a ser dito.

### `pergunta` — para quem assiste (tela cheia)

```json
{ "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer entender antes de decidir?", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres. `opcoes` (opcional): 2 a 4, cada uma até ~30 caracteres, no seu `em`.

### `cta` — assinatura e chamada (tela cheia)

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: até ~45 caracteres, fiel à fala. `icone`: `seguir` (padrão), `salvar`, `comentar` ou `link`. `destaque` (opcional): trecho sublinhado em vermelho.
- `em` (opcional): quando a chamada começa a ser datilografada (padrão: logo depois da assinatura).
- Se for o último momento, fica até o fim do vídeo.

## 5. A assinatura e os outros tipos do modelo

**Use pelo menos um de `ficha`, `pessoas` ou `linha`** (o `conferir.mjs` exige). Veja "A assinatura em qualquer assunto" no SKILL.md.

### `ficha` — ficha de registro (folha; assinatura)

```json
{ "tipo": "ficha", "de": 14.93, "ate": 23.63,
  "titulo": { "em": 15.96, "texto": "Tem gente que perde", "rotulo": "Caso" },
  "carimbo": { "em": 15.32, "texto": "Mesmo na alta" },
  "campos": [ { "em": 17.73, "rotulo": "Motivo 01", "valor": "Compra por impulso" },
              { "em": 19.21, "rotulo": "Motivo 02", "valor": "Moeda sem critério" },
              { "em": 21.25, "rotulo": "Motivo 03", "valor": "Risco que não entende" } ] }
```

- Registra qualquer coisa: um caso, um produto, um ativo, um sintoma, uma tarefa, uma ideia.
- `cabecalho` (opcional): o cabeçalho pré-impresso (padrão "Ficha de registro"; ex.: "Peça 02", "Ficha do paciente").
- `titulo.texto`: até ~30 caracteres (sem campos, até ~40: vira o documento). `titulo.rotulo`: o nome do campo ("Caso", "Produto", "Tarefa"; padrão "Registro").
- `campos`: 0 a 3; `rotulo` até ~18 caracteres, `valor` até ~36 (datilografado em até 2 linhas).
- `carimbo` (opcional): `texto` até ~16 caracteres (até 2 linhas), no `em` da palavra que ele carimba; `detalhe` curto (data, número).
- `coordenadas` (opcional, só para lugares conferidos): `{ "em", "local", "lat", "lon" }`.

### `pessoas` — fichas de pessoas ou personagens (folha; assinatura)

```json
{ "tipo": "pessoas", "de": 5.53, "ate": 8.04, "rotulo": "Peça 01", "titulo": "Papel", "rotuloNome": "Personagem",
  "pessoas": [ { "em": 6.49, "papel": "Haja como", "nome": "Nutricionista", "nomeEm": 7.04 } ] }
```

- 1 a 3 fichas (lado a lado). `papel`: até ~14 caracteres (o carimbo da ficha). `nome`: até ~24. `detalhe` (opcional): até ~30; partes separadas por " · " viram linhas.
- `titulo` (opcional): palavras da fala, na ordem (batem palavra por palavra). `rotulo`: o rótulo vermelho acima dele (padrão "Dossiê").
- `rotuloNome` (opcional): o rótulo acima do nome (padrão "Nome"; para papéis e personagens: "Personagem", "Quem").
- `ligacao` (opcional): `{ "em" }` — o fio vermelho liga a primeira ficha à segunda na palavra que liga as duas ("junto com", "contra", "a partir de").

### `linha` — linha do tempo (tela cheia; assinatura)

```json
{ "tipo": "linha", "de": 25.66, "ate": 29.72,
  "marcos": [ { "em": 25.66, "ano": 1931, "texto": "Inauguração" }, { "em": 25.72, "ano": 2007, "texto": "Sete maravilhas" } ],
  "manchete": "Uma das sete maravilhas do mundo moderno", "enfase": "sete maravilhas",
  "carimbo": { "em": 27.61, "texto": "Eleito", "detalhe": "07.07.2007" } }
```

- `marcos`: 2 a 4, em ordem. Com `ano`, a régua corre de um ano ao outro e o contador mostra o ano. **Sem `ano`** (fases: "semana 1", "hoje", "daqui a um ano"), a régua anda por igual de um marco ao outro e o `texto` do marco aparece grande no lugar do ano (até ~18 caracteres).
- `manchete` (opcional): até ~45 caracteres, palavras da fala na ordem; `enfase`: trecho com tarja vermelha. `carimbo` (opcional): como o da ficha.

### Outros tipos

- `credito` (tela cheia): crédito de documentário. `{ "rotulo": "Local e data", "lugar": { "em", "texto" }, "data": [ { "em", "texto" } ], "separador": "." }`. `lugar.texto` até ~20 (um lugar, um nome, um tema); `data` são as partes da linha de baixo, cada uma no seu `em` (data, valor, ano); `separador` padrão "." (use " · " para partes que não são data).
- `local` (folha, canto): `{ "rotulo", "coordenadas": { "em", "local", "lat", "lon" }, "detalhe": { "em", "texto" } }` — só com coordenadas conferidas.
- `escala` (folha, canto): régua de perícia. `{ "rotulo": "Altura", "unidade": "m", "desenho": "blocos", "partes": [ { "em", "valor", "rotulo" } ] }` — 1 a 4 partes de baixo para cima, números ditos; `desenho`: `blocos` (qualquer coisa), `torre` ou `estatua`.
- `camadas` (folha, topo): por dentro × por fora. `{ "dentro": { "em", "titulo", "material", "nome", "nomeEm" }, "fora": { …, "cobreAte" }, "destaque": { "em", "texto" } }` — `material`: `concreto`, `tijolo`, `mosaico` ou `pedra` (é a textura: serve como metáfora de "o que se vê × o que tem por baixo").

## 6. Regras de tempo

- `de`: o `em` da primeira palavra da batida (pode ser −0,05). `ate`: o `em` da primeira palavra da batida seguinte, ou o fim do vídeo. Momentos colados fazem a foto mudar de lugar direto.
- Sub-passos (`em` de item, campo, lado, dado, carimbo, marco): o `em` da palavra que o nomeia. Nada aparece antes de ser dito.
- Duração: 2 a 6 s. Momento de mais de ~4 s precisa de itens entrando por dentro dele; nada parado mais de ~2,5 s.
- Do documento para a tela cheia, o super espera ~0,4 s a foto crescer; entre duas folhas, o documento novo espera 0,2 s a foto começar a andar. Palavras ditas nesse intervalo aparecem assim que o super entra.
- Não repita o mesmo bloco três vezes seguidas; alterne folha e tela cheia.

## 7. Legenda e correções

A legenda (tarja preta, texto claro, sempre na mesma altura) aparece só nos trechos **sem momento**: durante um momento ela some, porque o documento já mostra a fala. `"legenda": true` no momento mantém a legenda (use quando o documento mostra só parte do que é dito). `semLegenda`: faixas extras sem legenda.

Palavras que a transcrição errou vão em `correcoes`: `{ "Jão": "João", "chat GPT": "ChatGPT", "Com o texto": "Contexto", "né": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. Só corrija o que você tem certeza. Não edite `palavras` à mão.

## 8. Exemplo (vídeo sobre cripto, 43 s)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Mercado cripto" },
  "assunto": "Criptomoedas",
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 4.68, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "definicao", "de": 4.68, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Um ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.91, "layout": "topo", "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.91, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "ficha", "de": 14.93, "ate": 23.63,
      "titulo": { "em": 15.96, "texto": "Tem gente que perde", "rotulo": "Caso" }, "carimbo": { "em": 15.32, "texto": "Mesmo na alta" },
      "campos": [ { "em": 17.73, "rotulo": "Motivo 01", "valor": "Compra por impulso" },
                  { "em": 19.21, "rotulo": "Motivo 02", "valor": "Moeda sem critério" },
                  { "em": 21.25, "rotulo": "Motivo 03", "valor": "Risco que não entende" } ] },
    { "tipo": "frase", "de": 24.21, "ate": 28.03, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "destaque": "posicionamento?", "em": 24.58 },
    { "tipo": "destaque", "de": 28.03, "ate": 30.09, "texto": "Aula gratuita", "em": 28.62, "nivel": "chave", "detalhe": "para te explicar", "detalheEm": 29.27 },
    { "tipo": "passos", "de": 30.09, "ate": 33.83, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.8 },
    { "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer entender antes de decidir?", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ]
}
```

Com esse plano: abre em cores com US$ 83.000 contando sobre a régua; em "bull market" a imagem vira arquivo e encolhe para o canto, e a ficha catalográfica define o termo; a foto sobe para o alto na comparação; volta a cor no carimbo PARA A MAIORIA DAS PESSOAS; a foto desce para a base na ficha do caso (carimbo MESMO NA ALTA, os três motivos datilografados); as frases, a aula e a pergunta ficam em tela cheia, com os passos da análise numa folha no meio; fecha com a assinatura e a chamada.

O plano do exemplo do próprio modelo (o documentário do Cristo Redentor) está em `assets/template/src/plano.json`: ele usa `credito`, `ficha`, `escala`, `camadas`, `pessoas` e `linha` com anos e fatos conferidos.
