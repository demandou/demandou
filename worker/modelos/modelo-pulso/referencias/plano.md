# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o `rastro`), `zona` (aqui ela só diz onde fica o queixo), `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json` (cada palavra tem `em` e `ate`). Todo campo `em`/`…Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática do app (os lugares da pessoa)
3. Os 11 blocos universais
4. A assinatura: `zonas`, `zona`, `divisao`, `rota`
5. Regras de tempo e de texto
6. Legenda, correções e sons
7. Exemplo completo (vídeo de cripto)

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "sfx": true,
  "correcoes": { "dia-a-dia": "dia a dia" },
  "semLegenda": []
}
```

- `marca.nome` e `marca.area`: a assinatura no alto, à esquerda (coração azul + "Tiago Lemos · Cripto"). Fica no mesmo lugar o vídeo inteiro. Nome até ~16 caracteres, área até ~26. Os dois vazios = sem assinatura.
- `sfx`: `false` desliga os sons.
- `rosto`, `videoAltura`, `zona`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática do app

O vídeo inteiro é um app de treino claro, fictício e sem marca. **O tipo do bloco decide onde a pessoa fica** (você não escreve posições):

| Lugar | Tipos | O que acontece |
|---|---|---|
| tela cheia, cartão branco no peito (logo abaixo do queixo) | `abertura`/`gancho`, `numero`, `cta` | o cartão entra subindo quando a pessoa cresce; entre dois cartões seguidos, os dois deslizam juntos |
| relógio grande (visor de 600 px no meio) | `destaque`, `zonas` | a caixa preta fosca do relógio cresce em volta da pessoa; o anel acende; o painel fica embaixo |
| relógio no alto (visor de 480 px) | `zona`, `definicao`, `pergunta`, `grafico` em pizza | o painel embaixo tem mais lugar: nome, balão, opções, legenda |
| relógio menor (visor de 420 px) | `topicos` | sobra lugar para até 5 linhas de lista |
| card de cima (840 px de largura; mais alto em gravação de perto) | `frase`, `comparacao`, `grafico` (barras e linha), `divisao` | o painel fica embaixo do card |
| avatar redondo no canto de um mapa | `passos`, `rota` | o mapa ocupa o alto; a lista ou os trechos ficam embaixo |

- A troca leva 0,6 s e começa 0,15 s antes do `de`. Saindo da tela cheia, o painel novo já está embaixo da pessoa e aparece enquanto ela encolhe; voltando para a tela cheia, a pessoa cresce por cima do painel; de um lugar do app para outro, as páginas deslizam juntas (a velha sai pela esquerda, a nova entra pela direita).
- **Trecho sem momento** (buraco de mais de 1,2 s entre momentos, ou antes do primeiro) = a pessoa em tela cheia com legenda. Evite: o `conferir` reprova vãos de mais de 3,5 s.
- **Varie os lugares**: dois momentos seguidos no mesmo lugar deixam a tela parada. Abra e feche em tela cheia.

## 3. Os 11 blocos universais

Os campos são os mesmos em todos os modelos do pack. Os limites de texto existem porque o espaço é fixo: o template mede cada texto com a própria fonte e diminui o corpo até um mínimo legível, mas passou muito do limite, a letra fica pequena. Palavras de títulos e rótulos entram **no instante em que são ditas** (o template procura cada palavra na fala do momento): use as palavras que a pessoa diz, na ordem em que diz. Algarismos ("2", "80%", "20") casam com a palavra falada ("dois", "oitenta", "vinte").

`legenda?: true` em qualquer momento mantém a legenda (normalmente não precisa).

### `abertura` — o título no peito, com o pulso batendo

```json
{ "tipo": "abertura", "de": 0, "ate": 3.23, "texto": "O erro que deixa qualquer sala parecendo menor", "destaque": "parecendo menor", "alertaEm": 0.1 }
```

- `texto`: a promessa, pergunta ou tema, fiel à fala, até ~50 caracteres (até 3 linhas, 60–92 px).
- `destaque` (opcional): trecho exato do texto que fica azul.
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`). Use quando o momento começa antes da primeira palavra.
- `rotulo` (opcional): letreiro pequeno em cima, com um coração vermelho, até ~24 caracteres.
- `alertaEm` (opcional): a palavra do risco ("erro", "machucar", "perder"): o batimento dela sai alto e vermelho, com uma batida grave.
- `gancho` é o nome antigo do mesmo bloco (mesmos campos).

### `topicos` — lista no relógio

```json
{ "tipo": "topicos", "de": 17.6, "ate": 24.21, "zona": 4, "itens": [
  { "texto": "Compra por impulso", "em": 17.73 },
  { "texto": "Escolhe moeda sem critério", "em": 19.21 },
  { "texto": "Assume risco que não entende", "em": 21.25, "detalhe": "opcional", "detalheEm": 22.4 }
] }
```

- `itens`: **2 a 5**, sem ordem (motivos, erros, dicas, sinais). Texto de 2 a 6 palavras (até ~32 caracteres; quebra em 2 linhas). `detalhe` opcional (até ~40 caracteres, menor, cinza), no `detalheEm` (padrão: logo depois do item).
- `titulo` (opcional): até ~36 caracteres, em cima da lista.
- `zona` (opcional): a cor da lista e do anel. 2 = neutro (padrão), 3 = acertos, 4 = problemas, 5 = riscos.
- O anel se divide em uma parte por item; cada parte acende na palavra e o ponteiro vai até ela.

### `passos` — sequência no mapa

```json
{ "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita", "itens": [
  { "texto": "O mercado", "em": 30.86 },
  { "texto": "Os riscos", "em": 31.47 },
  { "texto": "A escolha dos ativos", "em": 32.21 }
] }
```

- `itens`: **2 a 5**, em ordem (processo, caminho, etapas). Mesmos limites dos `topicos`. O primeiro item é o ponto de partida da rota; a rota se desenha até a parada seguinte em cada palavra.
- `titulo` (opcional), `zona` (cor da rota; padrão 2).
- Com 4–5 itens ou detalhes, o mapa encolhe para a lista caber.

### `numero` — a leitura grande no peito

```json
{ "tipo": "numero", "de": 0.03, "ate": 2.89, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número dito (sem pontos: 83000; decimais com ponto: 1.5). Conta de 0 até ele a partir de `em` (~1,1 s) e aparece em pt-BR ("83.000", "1,5").
- `rotulo`: o que o número é, com palavras da fala, até ~40 caracteres (2 linhas); entra palavra por palavra a partir de `rotuloEm` (padrão: `de`).
- `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "cm", "dias") ficam menores ao lado. "83 mil" pode ser `valor: 83000` ou `valor: 83` com `sufixo: "mil"`.
- `casas`: casas decimais (padrão: 0 para inteiro, 1 para decimal). `ilustrativo: true` põe a etiqueta (só para número que não foi dito como fato). `zona`: cor do ponteiro da régua.

### `comparacao` — dois monitores

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 12.9, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ],
  "vencedor": 0, "vencedorEm": 11.99 }
```

- `lados`: exatamente 2. `rotulo` até ~16 caracteres (letreiro em caixa alta); `texto` até ~28 caracteres (até 3 linhas). Cada lado acende e começa a bater no seu `em`.
- `modo`: `contra` (azul × laranja, "×" no meio; padrão), `antes-depois` (cinza → azul, seta) ou `errado-certo` (vermelho → verde, seta; o lado 0 é o errado).
- `vencedor` (opcional, 0 ou 1) e `vencedorEm`: o vencedor ganha ✓ e batimento firme em verde; o outro ganha ✗ e o traçado vira linha reta. Em `errado-certo`, o vencedor padrão é o 1.
- `titulo` (opcional): uma linha em cima, até ~34 caracteres.

### `grafico` — gráfico no painel

```json
{ "tipo": "grafico", "de": 10, "ate": 14, "forma": "barras", "titulo": "Vendas por ano", "unidade": "mil",
  "dados": [ { "rotulo": "2023", "valor": 40, "em": 10.4 }, { "rotulo": "2024", "valor": 65, "em": 11.6 }, { "rotulo": "2025", "valor": 90, "em": 12.8 } ] }
```
```json
{ "tipo": "grafico", "de": 9, "ate": 12, "forma": "linha", "tendencia": "sobe", "tendenciaEm": 9.3, "ilustrativo": true, "titulo": "O mercado subindo" }
```

- `forma`: `barras` (colunas de casas que enchem, valor contando em cima, rótulo embaixo), `linha` (gráfico de frequência: as faixas das zonas ao fundo e a caneta ligando os pontos) ou `pizza` (o anel do relógio dividido nas proporções, com a pessoa no relógio no alto e a legenda embaixo; sem `unidade`, mostra porcentagens).
- `dados`: só números **ditos**, **2 a 6**, cada um no seu `em`. `rotulo` até ~14 caracteres.
- Sem números ditos: `tendencia` (`sobe`, `cai`, `oscila`), `tendenciaEm` (padrão: logo no começo) e `ilustrativo: true` (obrigatório). A forma se desenha e a etiqueta "ilustrativo" aparece. Pizza sem dados vira linha.
- `unidade` (opcional): "%", "mil", "kg"… ao lado dos valores. `zona`: cor (padrão 2; `cai` = 4). `titulo` opcional (até ~40 caracteres).

### `destaque` — o anel inteiro numa cor

```json
{ "tipo": "destaque", "de": 12.9, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: uma palavra ou frase curta, até ~36 caracteres (2 linhas grandes).
- `nivel`: `alerta` (vermelho, coração acelerado, batida grave) ou `chave` (azul; padrão).
- `detalhe` (opcional, até ~40 caracteres, menor) no `detalheEm`.

### `definicao` — o termo como uma zona em foco

```json
{ "tipo": "definicao", "de": 5, "ate": 8.6, "termo": "Bull market", "em": 5.4, "significado": "ciclo de alta", "significadoEm": 6.15, "zona": 4 }
```

- `termo`: até ~22 caracteres (grande, na cor da zona). `significado`: até ~40 caracteres (no balão, 2 linhas).
- `zona` (opcional): qual zona do anel acende (padrão 2).
- É o mesmo desenho da `zona` da assinatura (sem leituras).

### `frase` — a frase sobre o pulso

```json
{ "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.03 }
```

- `texto`: até ~60 caracteres (até 3 linhas, 60–96 px).
- `destaque` (opcional): trecho exato na cor da `zona` (padrão 2; 3 = certo, 5 = alerta). `enfase` é o nome antigo.
- `risco` (opcional): trecho exato que é riscado em vermelho, palavra por palavra, a partir de `riscoEm` (padrão: quando a primeira palavra dele é dita).
- `em` (opcional): quando o texto começa a ser dito.

### `pergunta` — a mensagem no relógio

```json
{ "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres (até 3 linhas no balão). O balão espera "digitando" até `em`.
- `opcoes` (opcional): **2 a 4**, até ~32 caracteres cada, cada uma no seu `em`. Com 4, ficam em duas colunas.

### `cta` — o cartão de ação

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "destaque": "Saiba Mais", "icone": "link", "acaoEm": 40.65 }
```

- `texto`: a chamada, até ~50 caracteres (até 3 linhas). `destaque` (opcional) em azul.
- `icone`: `salvar` (padrão), `seguir`, `comentar` ou `link` — o botão ("Salvar" → "Salvo", "Seguir" → "Seguindo", "Comentar" → "Comentado", "Abrir" → "Aberto").
- `acaoEm` (opcional): quando o botão é apertado (a palavra "salva", "segue", "toca"); padrão: logo no começo.
- `rotulo` (opcional): o letreiro em cima (padrão "Próximo passo"), até ~20 caracteres.
- `em` (opcional): quando o texto começa a ser dito. Embaixo, um pulso em miniatura (ou a barra da `divisao`, se o vídeo teve uma).
- `titulo`/`acao` são os nomes antigos de `texto`/`icone`.

## 4. A assinatura: `zonas`, `zona`, `divisao`, `rota`

Use pelo menos um destes (o `conferir` exige). Exemplos do vídeo de corrida do modelo; em "A assinatura em qualquer assunto" (SKILL.md), os usos fora do esporte.

### `zonas` — o anel das cinco zonas (uma escala de 1 a 5)

```json
{ "tipo": "zonas", "de": 1.92, "ate": 3.94, "titulo": "Zonas de frequência cardíaca", "acendeEm": 2.42, "passo": 0.28, "escala": ["leve", "máximo"] }
```

- `titulo`: palavras faladas, até ~40 caracteres (até 2 linhas).
- `acendeEm` (padrão `de` + 0,45 s): quando a zona 1 acende; as outras seguem a cada `passo` s (padrão 0,28). Para "reacendeu", "subiu", "esquentou", ponha a zona 1 nessa palavra e um `passo` maior (0,4) para o anel acender junto com a fala.
- `escala`: rótulos das pontas da régua (padrão `["baixo", "alto"]`); `null` = sem régua.

### `zona` — um nível em foco

```json
{ "tipo": "zona", "de": 3.94, "ate": 7.7, "zona": 2, "em": 4.53, "titulo": "Zona 2",
  "balao": { "texto": "dá pra conversar", "em": 6.24 },
  "leituras": [ { "tipo": "bpm", "valor": "132" }, { "tipo": "pace", "valor": "6:20" } ] }
```

- `zona`: 1 a 5 (a cor e a parte do anel). `em`: a palavra que nomeia o nível. Depois de um `zonas`, o ponteiro desce do topo até ela.
- `titulo` (padrão "Zona N"): qualquer termo, até ~22 caracteres.
- `balao`: o que o nível significa, até ~40 caracteres.
- `leituras` (opcional, até 2): `tipo` `bpm` (inteiro), `pace` ("6:20") ou `numero` (padrão: qualquer número em pt-BR, com `unidade` livre e `casas`); `rotulo` pequeno embaixo (até ~14 caracteres). Leituras que a pessoa não disse levam "valores de exemplo" (padrão); leitura dita: `"exemplo": false`.
- Sem leituras, o nome e o balão ficam maiores e centrados.

### `divisao` — a maior parte × uma parte

```json
{ "tipo": "divisao", "de": 7.7, "ate": 13.41, "rotulo": "Seus treinos", "zona": { "numero": 2, "em": 8.1 }, "casas": 10, "unidade": "cada casa é um treino",
  "partes": [ { "pct": 80, "texto": "maior parte", "zona": 2, "em": 10.63, "encheEm": 8.96 }, { "pct": 20, "texto": "mais fortes", "zona": 4, "em": 12.01 } ] }
```

- `partes`: exatamente 2, a maior primeiro. `pct` (somam 100), `texto` (até ~22 caracteres, 2 linhas), `zona` (cor), `em` (a palavra do número ou do rótulo), `encheEm` (quando as casas começam a encher; padrão 0,6 s antes do `em`), `textoEm` (opcional).
- Sem porcentagem dita: tire os `pct` (ou ponha `ilustrativo: true`): a barra usa 70/30 (ou o `pct` que você der como proporção), não mostra porcentagem e põe a etiqueta "ilustrativo".
- `rotulo` (letreiro em cima, opcional), `etiqueta` (`{ "texto", "em", "zona" }`: um selo que acende no canto; `zona: { numero, em }` é o nome antigo, que escreve "Zona N"), `casas` (4 a 20; padrão 10), `unidade` (o que é cada casa, opcional).

### `rota` — dois ritmos no mapa

```json
{ "tipo": "rota", "de": 13.41, "ate": 16.31, "trechos": [
  { "texto": "Devagar no dia a dia", "zona": 2, "em": 13.7, "ate": 14.9, "pace": "6:20", "bpm": 128 },
  { "texto": "Forte de vez em quando", "zona": 4, "em": 15.24, "ate": 15.85, "pace": "4:40", "bpm": 165 } ] }
```

- `trechos`: 1 ou 2. O primeiro é a volta longa no parque, o segundo um traço reto e curto. `texto` até ~26 caracteres; `zona` = cor (1–2 = traço lento; 3–5 = rápido); `em` = quando o traço começa; `ate` = quando termina (padrão 1,3 s ou 0,6 s).
- Leituras opcionais: `pace` e `bpm` (corrida) ou `leitura: { "valor": "3x", "unidade": "por semana" }`. Com leituras, aparece a etiqueta "exemplo" (`"exemplo": false` se forem ditas). Sem leituras, o rótulo fica maior (até 2 linhas).

## 5. Regras de tempo e de texto

- **Cada momento começa na primeira palavra da batida** e vai até a batida seguinte (momentos vizinhos encostam: `ate` de um = `de` do outro).
- **Cada item entra no `em` da palavra que o nomeia.** Nada aparece antes de ser dito (antes disso, só o esboço). Nos primeiros ~0,3 s de um momento a pessoa ainda está mudando de lugar: se der, o primeiro item cai depois disso.
- **Nada parado mais de ~2,5 s**: momento com mais de ~4 s precisa de itens, lados, opções ou dados entrando por dentro dele. O `conferir` reprova trechos de mais de 4,5 s sem nada novo.
- **Cobertura**: ~70% do vídeo ou mais com momento na tela; nenhum trecho de mais de 3,5 s só com a pessoa e a legenda.
- **Variedade**: não repita o mesmo bloco três vezes seguidas; use pelo menos 3 tipos (4 em vídeos de mais de 40 s) e a assinatura uma vez.
- **Texto de tela**: curto e com as palavras da fala; pode resumir ("compra por impulso" → "Impulso"), sem mudar o sentido. Uma ideia grande por vez.
- **Fidelidade**: não invente número, nome, preço, taxa nem fato. Sem número dito, use a forma ilustrativa (`grafico` com `tendencia`, `divisao` sem `pct`) ou outro bloco.

## 6. Legenda, correções e sons

- A legenda (faixa escura de notificação, palavra da vez sublinhada em azul) só aparece com a pessoa em tela cheia e sem momento na tela, ou com `legenda: true`. `semLegenda: [{ "de": 0, "ate": 2 }]` tira trechos.
- `correcoes`: troca palavras da transcrição na legenda e na busca dos rótulos (`{ "dia-a-dia": "dia a dia" }`).
- Sons (um por batida importante, tonais): batida grave no `alertaEm` da abertura e no `destaque` alerta; notas subindo quando o anel das `zonas` completa ou quando o último tópico acende; "bip" grave quando a `zona`, a `definicao`, o `destaque` chave ou o `numero` travam; tom quando a parte maior da `divisao` enche e outro quando ela divide; uma nota por trecho de `rota` e no começo e fim dos `passos`; duas notas no `cta`. `sfx: false` desliga.

## 7. Exemplo completo (vídeo de cripto, 43 s)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0.03, "ate": 2.89, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "zonas", "de": 2.89, "ate": 5.0, "titulo": "Reacendeu a conversa", "acendeEm": 3.0, "passo": 0.4, "escala": ["baixa", "alta"] },
    { "tipo": "zona", "de": 5.0, "ate": 8.67, "zona": 4, "em": 5.4, "titulo": "Bull market", "balao": { "texto": "ciclo de alta", "em": 6.15 } },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.9, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 9.31 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ],
      "vencedor": 0, "vencedorEm": 11.99 },
    { "tipo": "destaque", "de": 12.9, "ate": 14.93, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "frase", "de": 14.93, "ate": 17.6, "texto": "Mesmo na alta, tem gente que perde", "destaque": "tem gente que perde", "zona": 5 },
    { "tipo": "topicos", "de": 17.6, "ate": 24.21, "zona": 4, "itens": [
      { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21 }, { "texto": "Assume risco que não entende", "em": 21.25 } ] },
    { "tipo": "destaque", "de": 24.21, "ate": 28.03, "texto": "Como avaliar os projetos?", "em": 24.58, "nivel": "chave", "detalhe": "e pensar no seu posicionamento", "detalheEm": 26.41 },
    { "tipo": "passos", "de": 28.03, "ate": 33.83, "titulo": "Aula gratuita", "itens": [
      { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.03 },
    { "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23, "opcoes": [
      { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "destaque": "Saiba Mais", "icone": "link", "acaoEm": 40.65 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

Lugares da pessoa nesse plano: tela cheia → relógio grande → relógio no alto → card → relógio grande (vermelho) → card → relógio menor → relógio grande (azul) → mapa → card → relógio no alto → tela cheia. A assinatura entra duas vezes (`zonas` e `zona`): o mercado "reacende" no anel e o bull market é a zona laranja.
