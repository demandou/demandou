# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática: os modos do painel
3. Os blocos universais (os mesmos em todos os modelos do pack)
4. A assinatura: `luzes`, `parada`, `rota` (e `ignicao`, `aviso`)
5. As luzes-espia
6. Como dividir a fala
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Auto elétrica" },
  "sfx": true,
  "correcoes": { "para o mecânico": "pro mecânico" }
}
```

- `marca`: `nome` e `area` aparecem no "perfil do motorista", o selo no canto de cima da tela central (na abertura, depois da varredura dos ponteiros, e no fechamento). Até ~22 caracteres somando os dois. Vazio = sem selo.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. A `zona` não é usada por este modelo.

## 2. A gramática: os modos do painel

A tela inteira é o painel de instrumentos: o **velocímetro** (esquerda) e o **conta-giros** (direita), a **fileira de luzes-espia**, a **tela central** (vidro escuro onde entra o conteúdo de cada momento) e, na base do quadro, o alto do **volante**. Cada momento é um modo do painel; na troca de modo todas as peças deslizam juntas (0,56 s) e a pessoa muda de lugar com elas. Você não escolhe o modo: ele vem do `tipo`.

| Modo | Blocos | A pessoa | A tela central | Mostradores | Luzes-espia |
|---|---|---|---|---|---|
| **Quadro cheio** | o começo do vídeo, até a chave girar | rosto na linha do centro | (por trás) | (por trás) | (por trás) |
| **Clássico** | `abertura`, `ignicao`, `frase`, `pergunta` sem opções, `cta` e trechos sem momento | na **tela central** (860×744) | a barra de mensagens (960×166), logo abaixo da pessoa | grandes, embaixo, com números | pequenas, entre os mostradores |
| **Retrovisor** | `luzes`, `destaque`, `aviso` | no **retrovisor de dentro**, no alto (760×556) | grande (960×480) | compactos, nos cantos | grandes, no alto da tela |
| **Tela grande** | `rota`, `topicos`, `passos`, `numero`, `grafico`, `pergunta` com opções | no retrovisor de dentro | grande (960×480), inteira para o conteúdo | compactos, nos cantos (contador entre eles) | pequenas, embaixo |
| **Retrovisor da direita** | `parada`, `definicao` | no **retrovisor da direita** (444×556) | 960×352; à esquerda do retrovisor, o painel da condição ou do termo | grandes, embaixo | no alto do painel ao lado do retrovisor |
| **Comparar** | `comparacao` | no retrovisor de dentro | 960×330, dividida em dois lados | grandes, um embaixo de cada lado, sem números | pequenas, entre os mostradores |

Regras que o template já cumpre sozinho (não precisa escrever nada):

- **A partida**: o vídeo abre em quadro cheio; na primeira palavra (ou no `ignicaoEm` da `ignicao`) a chave gira: a pessoa encolhe para a moldura do primeiro momento (0,7 s), os ponteiros varrem até o fim da escala e voltam, oito luzes acendem juntas por ~1,2 s numa faixa na altura do peito (o teste de lâmpadas) e encolhem até a fileira. São as luzes de carro quando o plano usa alguma; senão, as luzes do plano e os símbolos gerais. Gravação muito perto da câmera: a faixa vai logo abaixo da moldura (nunca sobre o rosto) e o conteúdo do primeiro momento espera ela recolher.
- **Os ponteiros contam a história**: rodando a ~60 km/h; um `numero` acelera um pouco; na `parada`, "encostar" leva a velocidade a zero e vira o volante, "desligar" leva o giro a zero e escurece o painel; na `rota` o carro anda até o destino e para; na `comparacao` os ponteiros viram os dois lados; no fechamento o carro estaciona e desliga no último instante.
- **Troca de modo**: começa 0,3 s antes do `de` do momento, para o corte que fica na fronteira cair no meio do movimento. A fileira de luzes que atravessa a tela apaga no meio do caminho.
- **Nenhum quadro vazio, nunca dois textos juntos**: o conteúdo de dentro da tela central é recortado pelo vidro (aparece com a tela que cresce); o que sai some (0,2 s) antes de o que entra aparecer, já em esboço. Todo texto nasce "apagado" (esboço atrás do vidro fumê) e acende palavra por palavra quando é dito.
- **Último momento**: fica até o último quadro.

Um cuidado seu: **momentos encostados**. O `ate` de um = o `de` do próximo, na pausa entre as frases (de preferência num valor de `cortesEm`). Um buraco de mais de 0,8 s entre momentos volta ao modo clássico, com legenda.

## 3. Os blocos universais

Campos comuns: `tipo`, `de`, `ate` (e `legenda`, sem efeito neste modelo). Todo campo `em` ou `…Em` é o instante de uma palavra dita. Os limites de texto existem porque o bloco diminui o corpo para caber: passou do limite, fica pequeno ou quebra em mais linhas (nunca vaza). Palavras de títulos e frases acendem **no instante em que são ditas** (o template procura cada palavra na fala), então use as palavras da pessoa, na ordem em que ela diz (pode pular palavras). Algarismos casam com o número falado ("3" ↔ "três"); "pra"/"pro" casam com "para". Todo texto do painel fica em caixa-alta.

### `abertura` — a promessa (modo clássico)

```json
{ "tipo": "abertura", "de": 0, "ate": 4.62, "texto": "3 truques de maquiagem mais descansada em 5 minutos", "destaque": "3 truques de maquiagem", "em": 0.3 }
```

- `texto`: a frase de abertura, falada (até ~50 caracteres).
- `destaque` (opcional): o trecho exato do `texto` que vira a linha grande (60–96 px, uma linha: até ~22 caracteres). O resto fica menor (32–44 px), em cima e/ou embaixo, na ordem da fala. Sem destaque, a frase toda em até 2 linhas (48–84 px).
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`). No começo do vídeo, a chave gira nessa palavra.
- A `ignicao` (seção 4) é a mesma abertura com `titulo` + `apoio` separados.

### `topicos` — lista sem ordem (modo tela grande)

O menu do computador de bordo: os itens já estão na tela, apagados; cada um acende na sua palavra com a luzinha numerada dele, e o cursor (faixa clara com filete marfim) desliza até o item da vez. Os anteriores baixam um pouco a luz. Entre os mostradores, o contador "2 / 4" com o `titulo`.

```json
{ "tipo": "topicos", "de": 12.4, "ate": 18.0, "titulo": "Sinais de cansaço",
  "itens": [ { "texto": "Olheira funda", "em": 12.9 }, { "texto": "Pele opaca", "em": 14.3 }, { "texto": "Boca seca", "em": 16.1, "detalhe": "Falta de água" } ] }
```

- `itens`: 2 a 5. `texto` de 2 a 6 palavras (até ~26 caracteres; 1 ou 2 linhas de 44–64 px). Todos os itens ficam no mesmo corpo: com 4 ou 5 itens, mantenha cada um com até ~18 caracteres para eles continuarem grandes (um item longo faz a lista inteira diminuir). `detalhe` (opcional) aparece embaixo, menor, se houver espaço (até 3 itens).
- `titulo` (opcional): o nome do contador (até ~22 caracteres). Sem ele, "Itens".

### `passos` — sequência em ordem (modo tela grande)

A estrada vista de cima, com uma parada numerada por etapa; o carro desce a estrada e para na parada da etapa dita; a rota fica acesa atrás dele e a etapa feita ganha o visto. Contador "Etapa" embaixo.

```json
{ "tipo": "passos", "de": 30.05, "ate": 33.75, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

- `itens`: 2 a 5, em ordem; mesmos limites dos `topicos`. `titulo` (opcional): o nome do contador (padrão "Etapas").

### `numero` — um número dito (modo tela grande)

O mostrador digital: à esquerda, uma escala de 270° com o fim "redondo" acima do valor (0 · metade · fim, em "mil"/"mi" quando grande); o ponteiro e o arco de leitura varrem enquanto, à direita, o visor conta em pt-BR. O velocímetro acelera junto.

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" }
```

- `valor`: só o número dito (83000, 1.5, 8). `casas`: decimais (padrão 0). `em`: a palavra do número.
- `rotulo`: o que é o número (até ~30 caracteres, 1–2 linhas). `rotuloEm` (opcional): quando o rótulo começa a ser dito.
- `prefixo` / `sufixo` (opcionais, curtos): "US$", "R$", "%", "mil", "horas", "kg". Ficam menores, ao lado do número.
- `ilustrativo: true` põe a etiqueta ILUSTRATIVO (só use se o número não foi dito exatamente; prefira não usar).

### `comparacao` — dois lados (modo comparar)

A tela se divide em dois lados, um em cima de cada mostrador grande. Os mostradores perdem os números e ganham o nome do lado; o ponteiro de cada lado sobe quando ele é dito. Com `vencedor`, o ponteiro do vencedor vai alto, o do outro cai quase a zero, e o lado que perde baixa a luz (em `errado-certo`, o errado é riscado).

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ],
  "vencedor": 0 }
```

- `lados`: exatamente 2. `rotulo`: o nome do lado (até ~14 caracteres; vai também no mostrador). `texto`: o que se diz dele (até ~30 caracteres, até 3 linhas de 44–66 px). `em`: quando o lado começa a ser dito.
- `modo` (opcional): `contra` (×, padrão), `antes-depois` (→), `errado-certo` (→, o vencedor padrão é o lado 1).
- `vencedor` (opcional): 0 ou 1. `vencedorEm` (opcional): os dois ponteiros sobem juntos até a metade e se separam nessa palavra. Sem `vencedor`, os dois param no meio.
- `titulo` (opcional): uma linha pequena no alto da tela (até ~30 caracteres).

### `grafico` — algo que sobe, cai, se divide (modo tela grande)

O histórico do computador de bordo, todo em marfim.

```json
{ "tipo": "grafico", "de": 20.1, "ate": 24.8, "forma": "barras", "titulo": "Vendas por mês", "unidade": "mil",
  "dados": [ { "rotulo": "Janeiro", "valor": 12, "em": 20.6 }, { "rotulo": "Fevereiro", "valor": 18, "em": 21.9 }, { "rotulo": "Março", "valor": 31, "em": 23.2 } ] }
```

```json
{ "tipo": "grafico", "de": 9.0, "ate": 12.9, "forma": "linha", "titulo": "Mercado", "tendencia": "sobe", "tendenciaEm": 9.3, "ilustrativo": true }
```

- `forma`: `barras` (colunas que sobem quando cada número é dito), `linha` (pontos ligados por um traço que se desenha de ponto em ponto), `pizza` (um anel com fatias em tons de marfim e a legenda ao lado).
- `dados`: 2 a 6 números **ditos**, cada um com `rotulo` (até ~12 caracteres; 1–2 linhas de 30–32 px), `valor` e `em`. `unidade` (opcional): vai depois do valor ("%", "mil", "kg").
- Sem números ditos: `tendencia` (`sobe`, `cai`, `oscila`) + `ilustrativo: true`. A curva se desenha a partir de `tendenciaEm` (ou do `de`) e a etiqueta ILUSTRATIVO aparece no alto.
- `titulo` (opcional): até ~28 caracteres, uma linha.

### `destaque` — a frase curta que bate forte (modo retrovisor)

Uma luz grande acende na tela com a frase ao lado. `alerta` = o triângulo vermelho de alerta geral, que pisca (também na fileira), com o rótulo "Alerta" e o som de alerta. `chave` (padrão) = a luz de informação, marfim, que respira.

```json
{ "tipo": "destaque", "de": 12.85, "ate": 17.6, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta",
  "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 14.93 }
```

- `texto`: até ~30 caracteres (até 3 linhas de 52–92 px). `em`: quando ele começa a ser dito.
- `detalhe` (opcional): até ~36 caracteres, embaixo e menor, acendendo a partir de `detalheEm`.
- `icone` (opcional): troca a luz (seção 5).

### `definicao` — um termo explicado (modo retrovisor da direita)

O termo acende grande no painel ao lado do retrovisor; quando o significado começa a ser dito, um traço desce até a tela central e o significado acende lá.

```json
{ "tipo": "definicao", "de": 4.95, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo`: até ~24 caracteres (até 3 linhas de 48–84 px). `significado`: até ~50 caracteres (até 3 linhas de 44–84 px).

### `frase` — opinião, conclusão (modo clássico)

A frase acende na barra de mensagens, abaixo da pessoa.

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.15, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "em": 33.83 }
```

- `texto`: até ~60 caracteres (até 3 linhas de 44–68 px).
- `destaque` (opcional): trecho exato que ganha um sublinhado marfim que se desenha quando é dito.
- `risco` (opcional): trecho exato que apaga e é riscado em `riscoEm` (padrão: quando a última palavra dele é dita), com a descida do motor.
- `em` (opcional): quando o texto começa a ser dito.

### `pergunta` — para quem assiste

Sem `opcoes`: o "?" e a pergunta na barra (modo clássico; até ~50 caracteres). Com `opcoes`: a caixa de diálogo do painel (modo tela grande): a pergunta no alto (até ~40 caracteres, 2 linhas), as opções como botões que acendem e o cursor passando de um para o outro.

```json
{ "tipo": "pergunta", "de": 35.15, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `opcoes`: 2 a 4, cada uma até ~30 caracteres (1–2 linhas de 40–52 px), no `em` em que é dita.

### `cta` — o fechamento (modo clássico)

A pessoa volta à tela central; o ícone da ação se desenha na primeira palavra, a chamada acende palavra por palavra e a seta verde de direção pisca na palavra da ação ("manda", "toca", "segue", "comenta", "clica", "acessa"…; se só houver "salva", nela).

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca aqui em Saiba Mais", "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
```

- `texto`: até ~34 caracteres (até 2 linhas de 44–64 px).
- `icone` (opcional): `salvar` (padrão, o marcador), `seguir`, `comentar` ou `link`.
- `destaque` (opcional): trecho exato sublinhado. `setaEm` (opcional): quando a seta começa a piscar. `em` (opcional).

## 4. A assinatura

Use pelo menos um destes três em todo vídeo (o `conferir.mjs` exige). Eles servem para qualquer assunto: são metáforas do painel (veja "A assinatura em qualquer assunto" no SKILL.md).

### `luzes` — sinais que acendem um a um (modo retrovisor)

Cada luz acende na fileira no instante em que é nomeada e ganha a tela central: o desenho grande se traça, o nome acende na palavra dita e a frase sobre ela acende palavra por palavra. Embaixo, entre os mostradores, o contador "Luzes de alerta 2/3" (ou o seu `titulo`) rola a cada luz.

```json
{ "tipo": "luzes", "de": 17.6, "ate": 24.05, "titulo": "Perde porque", "itens": [
  { "em": 17.73, "nome": "Impulso", "detalhe": "Compra por impulso", "detalheEm": 17.73, "cor": "vermelho" },
  { "em": 19.21, "nome": "Sem critério", "detalhe": "Escolhe moeda sem critério", "detalheEm": 19.21, "cor": "vermelho" },
  { "em": 21.25, "nome": "Risco", "detalhe": "Assume risco que não entende", "detalheEm": 21.25, "cor": "vermelho" } ] }
```

- `itens`: 1 a 4. Cada um ocupa a tela até o próximo; dê ao menos ~1,2 s por luz.
- `em`: quando a luz acende (a palavra que a nomeia ou o começo da frase sobre ela).
- `icone` (opcional): uma das luzes da seção 5. **Sem ícone, a luz numerada da posição** (1, 2, 3…). Para continuar a numeração em outro momento, passe `"icone": "n3"`.
- `nome`: até ~14 caracteres (uma linha de 64–92 px; palavra longa vai em duas linhas menores).
- `detalhe` (opcional): até ~32 caracteres (duas linhas de 44–52 px). `detalheEm`: quando ele começa a ser dito (nas luzes de carro, o desenho reage ali).
- `cor` (opcional): `vermelho` (problema, pare), `ambar` (atenção) ou `marfim` (neutro). Sem `cor`, a cor padrão da luz.
- `titulo` (opcional): o nome do contador (até ~22 caracteres). Com uma luz só não há contador: o `titulo` aparece sozinho entre os mostradores. Sem `titulo`, a contagem diz "Luz 1 de 3"; com `titulo`, só "1 de 3".

### `parada` — "quando acontecer X, faça isto" (modo retrovisor da direita)

À esquerda do retrovisor, as luzes da condição piscam e a condição acende; na tela central, a pista vista de cima (o carro anda na faixa da direita, a faixa tracejada corre com a velocidade) e os passos, numerados, cada um com um visto quando termina.

```json
{ "tipo": "parada", "de": 9.38, "ate": 15.09, "icones": ["oleo", "temperatura"],
  "condicao": "Óleo ou temperatura acesos em vermelho",
  "passos": [ { "em": 12.28, "texto": "Encosta com segurança", "acao": "encostar" },
              { "em": 13.89, "texto": "Desliga o motor", "acao": "desligar" } ] }
```

- `icones` (opcional): as luzes que piscam (0 a 3). Sem elas, nenhuma pisca.
- `condicao`: falada, até ~44 caracteres (até 4 linhas de 44–64 px).
- `passos`: 1 a 3, `texto` falado até ~22 caracteres (duas linhas). `acao`: `encostar` (o carro vai para o acostamento, o volante vira, a velocidade cai a zero: pausar, frear, parar para pensar), `desligar` (o giro cai a zero e o painel escurece: parar de vez, cortar) ou `nenhuma` (só o texto). Use `encostar` antes de `desligar`.

### `rota` — o caminho até um destino (modo tela grande)

Para "vai direto pro…", "leva na…", "procura um…", "na direção de…", "o caminho até…". O mapa em perspectiva com a avenida à frente; a instrução acende no alto, como num navegador; a rota acende do carro até o pino, o carro anda (as ruas correm por baixo) e o pino acende na chegada. Embaixo, entre os mostradores, a condição (com "Alerta" em cima só quando a luz é vermelha).

```json
{ "tipo": "rota", "de": 15.09, "ate": 18.04, "icone": "bateria", "condicao": "Bateria acesa",
  "instrucao": "Vai direto pro mecânico", "destino": "Mecânico", "pino": "chave", "rotaEm": 16.61, "chegadaEm": 17.4 }
```

- `icone` e `condicao` (opcionais): a luz que motiva a rota (fica acesa) e uma frase falada curta (até ~16 caracteres), em qualquer ponto do momento.
- `instrucao`: falada, até ~30 caracteres (duas linhas de 44–56 px).
- `destino`: o rótulo do pino, até ~12 caracteres. `pino` (opcional): `bandeira` (padrão), `chave` (oficina) ou `casa`.
- `rotaEm`: quando a rota acende (ex.: "direto", "direção"). `chegadaEm`: quando o carro chega (ex.: o nome do destino); dê ao menos 0,6 s entre os dois.
- Não invente distância nem tempo de viagem: o mapa não mostra números.

### `ignicao` — a abertura com título e apoio (modo clássico)

```json
{ "tipo": "ignicao", "de": 0, "ate": 3.6, "ignicaoEm": 0.32, "titulo": "3 luzes do painel", "apoio": "que você nunca pode ignorar" }
```

- `ignicaoEm` (opcional): quando a chave gira (a primeira palavra). `titulo`: até ~18 caracteres (uma linha, 60–96 px). `apoio` (opcional): até ~32 caracteres (uma linha menor).

### `aviso` — uma regra ou medida (modo retrovisor)

O número conta até o valor quando é dito; o texto acende palavra por palavra; uma luz opcional acende na fileira e ao lado do texto; o rótulo vai para a faixa entre os mostradores.

```json
{ "tipo": "aviso", "de": 12.3, "ate": 15.1, "rotulo": "Pneus", "texto": "Calibra toda semana",
  "valor": { "numero": 32, "unidade": "psi", "em": 12.6 }, "icone": "pneu" }
```

- `rotulo` (opcional): até ~14 caracteres. `texto`: falado, até ~40 caracteres (até 3 linhas).
- `valor` (opcional): `numero` (só o que foi dito), `unidade` curta, `em`, `casas`.

## 5. As luzes-espia

Desenhos a traço, padrão genérico de painel (nada de marca). Apagadas, ficam como esboço atrás do vidro; acesas, na cor da luz com um halo curto no próprio desenho.

| `icone` | O que é | Cor padrão | Reação do desenho grande |
|---|---|---|---|
| `oleo` | pressão do óleo (a almotolia) | vermelho | a gota pinga do bico; no `detalheEm` acende uma chama e ela vira lamparina |
| `temperatura` | temperatura do motor | vermelho | a coluna sobe; no `detalheEm` passa da última marca |
| `bateria` | carga da bateria | vermelho | as barras de carga se apagam uma a uma no `detalheEm`; a última pisca |
| `freio` | freio de mão / fluido de freio | vermelho | acende e respira |
| `motor` | injeção / motor | âmbar | acende e respira |
| `pneu` | pressão dos pneus | âmbar | acende e respira |
| `combustivel` | reserva de combustível | âmbar | acende e respira |
| `cinto` | cinto de segurança | vermelho | acende e respira |
| `alerta` | triângulo com "!" (alerta geral: risco, erro, cuidado) | vermelho | acende e respira (no `destaque` de alerta, pisca) |
| `info` | "i" num círculo (informação, ponto-chave) | marfim | acende e respira |
| `servico` | chave de boca (ajuste, manutenção, ferramenta) | âmbar | acende e respira |
| `tempo` | relógio (prazo, hora, rotina) | âmbar | acende e respira |
| `dinheiro` | moeda com cifrão (preço, dinheiro, investimento) | âmbar | acende e respira |
| `pessoa` | cabeça e ombros (cliente, paciente, público) | marfim | acende e respira |
| `coracao` | coração (saúde, relação, cuidado) | vermelho | acende e respira |
| `raio` | raio (energia, rapidez) | âmbar | acende e respira |
| `n1` … `n5` | **luz numerada** (o padrão neutro: o número dentro do contorno de uma luz) | âmbar | acende e respira |

A fileira mostra as luzes de todos os momentos (`luzes`, `parada`, `rota`, `aviso`, `destaque`), na ordem em que aparecem pela primeira vez (até 4). A `cor` de um item de `luzes` vale para aquela luz em todos os momentos.

## 6. Como dividir a fala

Leia a transcrição inteira e faça o mapa editorial (`references/adaptar.md`). Pergunte, frase a frase: *no painel do carro, isto seria qual tela?*

| A fala traz… | Bloco |
|---|---|
| a promessa, o tema do vídeo | `abertura` (ou `ignicao`) |
| uma lista de sinais, motivos, erros, dicas que "acendem" | `luzes` (um item por sinal) |
| uma lista neutra, sem ordem | `topicos` |
| um processo, etapas em ordem, "primeiro… depois…" | `passos` |
| "se acontecer / quando… faça…" | `parada` |
| "vai / leva / procura / na direção de…" (um lugar, um objetivo) | `rota` |
| um número, preço, porcentagem, data, quantidade | `numero` (ou `aviso` para uma regra com número) |
| dois lados: A × B, antes × depois, errado × certo | `comparacao` |
| algo que sobe, cai, oscila; números em série | `grafico` |
| alerta, palavra-chave forte | `destaque` |
| um termo técnico explicado | `definicao` |
| frase de efeito, opinião, conclusão | `frase` |
| pergunta para quem assiste | `pergunta` |
| a chamada final | `cta` |

- Um vídeo de 20–60 s tem de 5 a 12 momentos. Cada modo novo é uma troca de layout: é ela que dá o ritmo. Alterne a pessoa entre a tela central, o retrovisor e o retrovisor da direita.
- Uma coisa acende ou se mexe a cada ~0,5–1,5 s: uma luz, uma palavra, um item, um passo, a rota. Momento sem sub-passo por mais de ~2,5 s parece parado: divida a fala em mais itens ou em dois momentos.
- Não repita o mesmo bloco três vezes seguidas.
- Não force: se a fala não tem o dado que um bloco pede, use outro bloco. Não use `parada` com passos que a pessoa não disse.

## 7. Regras de tempo

- **Fronteiras de momento na pausa entre frases**: o `de` de um = o `ate` do anterior = o valor de `cortesEm` que fica entre as duas frases (ou, sem corte, um instante entre a última palavra de uma ideia e a primeira da outra). O primeiro momento começa em 0; o `ate` do último é a `duracao`.
- Sub-passos (`itens[].em`, `detalheEm`, `passos[].em`, `lados[].em`, `dados[].em`, `opcoes[].em`, `rotaEm`, `chegadaEm`, `significadoEm`, `valor.em`): o `em` da palavra, tirado de `work/palavras.json`. Nada aparece antes de ser dito.
- Confira nos quadros as palavras curtas no começo de frase ("e a da bateria"): o Whisper às vezes adianta o tempo delas em ~0,1 s.

## 8. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`, na barra de mensagens do modo clássico (texto marfim, palavra por palavra). Neste modelo ela só aparece **fora dos momentos** (os textos do painel já mostram o que é dito); `legenda: true` num momento não tem efeito. `semLegenda` acrescenta faixas sem legenda.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "para o mecânico": "pro mecânico" }`. Só corrija o que você tem certeza. Não edite `palavras` à mão: o `cortar.mjs` reescreve esse campo.

Sons (automáticos, tonais e graves, nunca dois a menos de 0,45 s): a partida na chave, uma nota por item que acende (luzes, tópicos, passos, lados, dados, opções, número, termo), o alerta grave duplo na `parada` e no `destaque` de alerta, a descida do motor no "desligar" e no trecho riscado, duas notas quando a rota acende e o "toc" surdo da seta no fechamento. `"sfx": false` desliga.

## 9. Exemplos completos

### O exemplo do modelo (mecânica, 20 s)

Roteiro: "Três luzes do painel que você nunca pode ignorar. A do óleo, que parece uma lamparina. A da temperatura, um termômetro. E a da bateria. Óleo ou temperatura acesos em vermelho: encosta com segurança e desliga o motor. Bateria acesa: vai direto pro mecânico. Salva e manda pra quem dirige."

```json
{
  "marca": { "nome": "Tiago", "area": "Mecânica" },
  "correcoes": { "para o mecânico": "pro mecânico", "para quem": "pra quem" },
  "momentos": [
    { "tipo": "ignicao", "de": 0, "ate": 3.6, "ignicaoEm": 0.32, "titulo": "3 luzes do painel", "apoio": "que você nunca pode ignorar" },
    { "tipo": "luzes", "de": 3.6, "ate": 9.38, "itens": [
      { "em": 3.8, "icone": "oleo", "nome": "Óleo", "detalhe": "Parece uma lamparina", "detalheEm": 5.31 },
      { "em": 6.24, "icone": "temperatura", "nome": "Temperatura", "detalhe": "Um termômetro", "detalheEm": 7.52 },
      { "em": 8.62, "icone": "bateria", "nome": "Bateria" } ] },
    { "tipo": "parada", "de": 9.38, "ate": 15.09, "icones": ["oleo", "temperatura"],
      "condicao": "Óleo ou temperatura acesos em vermelho",
      "passos": [ { "em": 12.28, "texto": "Encosta com segurança", "acao": "encostar" },
                  { "em": 13.89, "texto": "Desliga o motor", "acao": "desligar" } ] },
    { "tipo": "rota", "de": 15.09, "ate": 18.04, "icone": "bateria", "condicao": "Bateria acesa",
      "instrucao": "Vai direto pro mecânico", "destino": "Mecânico", "pino": "chave", "rotaEm": 16.61, "chegadaEm": 17.4 },
    { "tipo": "cta", "de": 18.04, "ate": 20.36, "texto": "Salva e manda pra quem dirige" }
  ]
}
```

### Outro assunto (cripto, 43 s, sem nada de carro na fala)

Roteiro: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "prefixo": "US$" },
    { "tipo": "frase", "de": 2.85, "ate": 4.95, "texto": "Reacendeu a conversa", "em": 2.99 },
    { "tipo": "definicao", "de": 4.95, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ], "vencedor": 0 },
    { "tipo": "destaque", "de": 12.85, "ate": 17.6, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta",
      "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 14.93 },
    { "tipo": "luzes", "de": 17.6, "ate": 24.05, "titulo": "Perde porque", "itens": [
      { "em": 17.73, "nome": "Impulso", "detalhe": "Compra por impulso", "detalheEm": 17.73, "cor": "vermelho" },
      { "em": 19.21, "nome": "Sem critério", "detalhe": "Escolhe moeda sem critério", "detalheEm": 19.21, "cor": "vermelho" },
      { "em": 21.25, "nome": "Risco", "detalhe": "Assume risco que não entende", "detalheEm": 21.25, "cor": "vermelho" } ] },
    { "tipo": "parada", "de": 24.05, "ate": 28.0, "condicao": "Como avaliar?",
      "passos": [ { "em": 25.53, "texto": "Os projetos", "acao": "encostar" }, { "em": 26.89, "texto": "Seu posicionamento", "acao": "nenhuma" } ] },
    { "tipo": "rota", "de": 28.0, "ate": 30.05, "instrucao": "Gravei uma aula gratuita", "destino": "Aula", "rotaEm": 28.62, "chegadaEm": 29.6 },
    { "tipo": "passos", "de": 30.05, "ate": 33.75, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.15, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "em": 33.83 },
    { "tipo": "pergunta", "de": 35.15, "ate": 40.0, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca aqui em Saiba Mais", "icone": "link", "destaque": "Saiba Mais", "em": 40.05 }
  ]
}
```
