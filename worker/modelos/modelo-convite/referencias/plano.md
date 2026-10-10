# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `monograma` e `pessoa`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática do convite (os quatro estados)
3. Blocos no convite grande: `abertura`, `convite`, `numero`, `definicao`, `destaque`, `frase`, `pergunta`
4. A assinatura: `marco` e `passos`
5. Blocos na mesa: `topicos`, `comparacao`, `grafico`
6. O fechamento: `cta`
7. Ícones
8. Regras de tempo e de texto
9. Legenda, correções e sons
10. Exemplo 1: o demo (cerimonialista)
11. Exemplo 2: um vídeo de cripto

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "monograma": "T",
  "pessoa": { "zoom": 1, "ancoraY": 0.4 },
  "sfx": true,
  "correcoes": { "para o": "pro" }
}
```

- `marca`: `nome` e `area` são a assinatura do convite: em caixa-alta espaçada no pé do convite grande ("TIAGO LEMOS · CRIPTO") e em itálico embaixo da foto do convite pequeno. Juntos, até ~26 caracteres (encolhe até 32 px para caber). `nome` vazio = sem assinatura.
- `monograma` (opcional): a letra do lacre de cera. Sem ele, vale a inicial de `marca.nome`; com `""` (ou sem nome), o lacre leva um ornamento.
- `pessoa` (opcional): ajuste do rosto nas fotos em arco. `zoom` 1,15 aproxima (gravação aberta, rosto pequeno); 0,86 afasta (gravação perto da câmera, rosto grande ou cabelo cortado pelo arco). `ancoraY` (padrão 0,40) é a altura do rosto dentro da foto grande: maior desce o rosto.
- `sfx`: `false` desliga os sons.
- `rosto`, `videoAltura`, `zona`: calculados pelo `cortar.mjs`. Não mexa à mão; este modelo não usa a `zona`.

## 2. A gramática do convite

O tipo do momento decide o estado. O template faz as trocas sozinho:

| Estado | Blocos | A pessoa | O resto da tela |
|---|---|---|---|
| **convite** | `abertura`, `convite`, `numero`, `definicao`, `destaque`, `frase`, `pergunta` e trechos sem momento | na foto em arco de um convite de papel algodão que ocupa a tela (foto 636×852; 556×712 quando o bloco tem mais texto) | embaixo do lacre, o bloco (ou a legenda) |
| **cronograma** (assinatura) | `marco`, `passos` | o convite encolhe para um lado do alto (foto 500×624), trocando de lado a cada bloco | do outro lado, o mostrador; no meio, a fita de cetim; embaixo, o cartão cai na pilha |
| **mesa** | `topicos`, `comparacao`, `grafico` | igual ao cronograma | o mostrador e o cartão na pilha; a fita da última sequência fica na mesa |
| **final** | `cta` | o convite volta grande, um pouco mais estreito | por trás, os cartões da pilha abertos em leque e a fita |

O que o template já faz (não precisa escrever nada):

- **Abertura do vídeo**: começa em quadro cheio e, em 0,6 s, a imagem se fecha na foto em arco. Nenhum texto se escreve antes de a foto se formar.
- **Trocas**: o convite encolhe ou cresce em 0,6 a 0,78 s, começando 0,18 s antes do corte (o pulo do corte some no movimento). O texto que sai some no começo da troca; o cartão novo desliza por baixo do convite enquanto ele encolhe; o texto novo aparece quando o convite já assentou.
- **Cartões**: cada bloco do cronograma e da mesa vira um cartão que entra por um lado, girado, e assenta sobre os anteriores. No fechamento, a pilha se abre em leque atrás do convite.
- **Lápis e tinta**: o texto dos cartões (e da maioria dos blocos) já chega escrito a lápis; cada palavra ganha tinta quando é dita. Nada aparece antes de ser dito, a não ser o esboço a lápis.
- **Lacre**: estampa na abertura e de novo em cada `destaque`, numa `frase` com `seloEm` e no fechamento.
- **Mostrador**: no cronograma e na mesa, do lado livre: conta os marcos (com números, o arco encolhe na proporção: 12 → 9 → 6), os passos (I, II, III), os itens (1, 2, 3), divide-se em duas metades na comparação, mostra o valor da vez ou a seta da tendência no gráfico.
- **Texto que cabe**: todo texto é medido com a fonte de verdade e encolhe até caber (até 44 px no texto, 30 px nos letreiros). Palavra comprida demais quebra a linha antes; nada vaza.
- **Último momento**: vai até o último quadro; no último 0,8 s um reflexo atravessa o lacre.

## 3. Blocos no convite grande

### `abertura` — a primeira frase

```json
{ "tipo": "abertura", "de": 0, "ate": 2.6, "texto": "Três atalhos que vão te poupar horas", "destaque": "Três atalhos", "em": 0.1 }
```

- `texto`: a promessa ou a pergunta, com as palavras da fala. Curto (até ~18 letras) sai inteiro em caligrafia grande; mais longo sai em itálico (até 3–4 linhas) e o `destaque` vira caligrafia.
- `destaque` (opcional): trecho exato do texto, 1 a 3 palavras.
- `em` (opcional): quando o texto começa a ser dito (padrão `de`).
- `subtitulo` (opcional): letreiro em caixa-alta embaixo do ornamento, até ~26 caracteres.
- `seloEm` (opcional): quando o lacre estampa (padrão: 1,2 s depois do `em`).

### `convite` — a abertura do demo (título curto + letreiro)

```json
{ "tipo": "convite", "de": 0, "ate": 2.6, "titulo": "Vai casar?", "subtitulo": "Anota esse cronograma", "seloEm": 1.95 }
```

`titulo` em caligrafia (até ~12 letras), `subtitulo` em letreiro (até ~26), `seloEm` na palavra forte. Use `abertura` quando o título for mais longo.

### `numero` — o "save the date"

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor`: o número dito, em número ("83000", "1.5", "40"). Aparece em pt-BR: 83.000; 1,5.
- `em`: a palavra do número. Ele conta de 0 até o valor em 1,3 s.
- `rotulo`: o que é o número, com palavras da fala (até ~40 letras; curto sai em caligrafia, longo em itálico).
- `rotuloEm` (opcional): quando o rótulo é dito (padrão `de`).
- `prefixo` / `sufixo` (opcionais): "R$", "US$", "%", "mil", "kg", "% ao ano". Saem menores ao lado do número.
- `casas` (opcional): casas decimais (padrão 0).
- `ilustrativo` (opcional): mostra a etiqueta "ILUSTRATIVO". Só use quando o número é um exemplo que a pessoa disse ser exemplo.

### `definicao` — termo e significado

```json
{ "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 5.96 }
```

- `termo`: em caligrafia (com algarismo ou símbolo, em letra gravada), até ~24 letras. Fica a lápis até o `em`.
- `significado`: em itálico, até ~70 letras, a lápis até o `significadoEm`.

### `destaque` — a frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.91, "ate": 17.25, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta", "detalhe": "Tem gente que perde", "detalheEm": 15.96 }
```

- `texto`: até ~50 letras (curto fica em caligrafia grande; 2 linhas no máximo).
- `nivel`: `"alerta"` (tinta e sublinhado vermelhos: risco, erro, problema) ou `"chave"` (padrão: sublinhado azul).
- `detalhe` / `detalheEm` (opcionais): uma linha menor em itálico embaixo.
- O lacre estampa de novo no `em`. Use para batidas fortes, não em sequência.

### `frase` — frase de efeito

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.55, "em": 33.83 }
```

- `texto`: fiel à fala, até ~90 letras (até 28 fica em 78 px; mais longo encolhe; acima de 64 letras a foto fica um pouco menor).
- `destaque` (opcional): trecho exato que vira caligrafia (1 a 3 palavras).
- `risco` / `riscoEm` (opcionais): trecho exato riscado em tinta vermelha quando é dito ("sem ~~promessa de lucro~~").
- `em` (opcional): quando o texto começa a ser dito.
- `seloEm` (opcional): re-estampa do lacre.

### `pergunta` — o cartão de resposta

```json
{ "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: a pergunta (curta sai em caligrafia; longa em itálico, até ~80 letras).
- `opcoes` (opcional, 2 a 4): cada uma com o quadradinho a pena e o texto (até ~30 letras), no seu `em`. Com opções, a foto fica um pouco menor.

## 4. A assinatura: `marco` e `passos`

### `marco` — um marco do cronograma

```json
{ "tipo": "marco", "de": 2.6, "ate": 6.58, "numero": "12", "unidade": "meses antes", "extenso": "Doze meses antes", "numeroEm": 2.68,
  "itens": [ { "em": 4.21, "texto": "Data", "icone": "calendario" }, { "em": 4.58, "texto": "Local", "icone": "local" } ] }
```

Marcos seguidos formam uma sequência: a fita se desenrola até cada número, o mostrador rola para ele e um cartão por marco cai na pilha.

- `numero` (opcional): o que vai na fita e no mostrador, até 3 caracteres ("12", "9", "1º", "A"). Escreva em algarismo mesmo que a pessoa diga por extenso. **Sem `numero`**, o marco ganha a posição dele na sequência (1, 2, 3…): não é inventar, é a ordem.
- `unidade` (opcional): embaixo do número no mostrador, uma palavra por linha (até 2 palavras de ~8 letras): "meses antes", "dias", "anos". Singular quando o número é 1.
- `extenso` (opcional): o cabeçalho do cartão, com as palavras da fala, até ~20 letras ("Doze meses antes", "Primeira semana", "Ctrl + Shift + T"). Com algarismo ou símbolo sai em letra gravada. Sem `extenso`, o cabeçalho é o número + a unidade.
- `numeroEm` (opcional): quando o número é dito (padrão: logo depois do `de`). A fita, o mostrador e a queda do cartão acontecem aí.
- `itens`: de 1 a 4. `em` = a primeira palavra do item; `texto` enxuto, até ~24 letras (quebra em 2 linhas); `icone` opcional (tabela na seção 7; sem ícone, um losango azul).
- `pessoa` (opcional): `"esq"` ou `"dir"`, o lado da foto. Sem ele, alterna.
- Com números que descem (12 → 9 → 6), o arco do mostrador encolhe na proporção; com números que sobem (1 → 2 → 3) ele cresce.
- Um marco precisa de pelo menos ~2,3 s. A fita comporta até ~6 marcos.

### `passos` — uma sequência em ordem

```json
{ "tipo": "passos", "de": 30.0, "ate": 33.75, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```

Um cartão só: a fita marca I · II · III, o mostrador gira para o numeral da vez e o cartão traz os passos com o numeral romano azul.

- `titulo` (opcional): o cabeçalho em caligrafia, até ~24 letras.
- `itens`: 2 a 5, em ordem, cada um no seu `em`, até ~26 letras; `detalhe` opcional (uma linha menor embaixo).
- Use `passos` para um processo dito de uma vez; use `marco` quando cada etapa tem seu número ou mais de um item.

## 5. Blocos na mesa

### `topicos` — lista sem ordem

```json
{ "tipo": "topicos", "de": 17.25, "ate": 24.1, "titulo": "Perde porque",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.21 }, { "texto": "Risco que não entende", "em": 21.25 } ] }
```

- `titulo` (opcional, recomendado): o cabeçalho em caligrafia, com palavras da fala, até ~24 letras.
- `itens`: 2 a 5, cada um no seu `em`, até ~26 letras; `detalhe` (opcional) e `icone` (opcional; sem ícone, um losango azul).
- O mostrador conta os itens (1, 2, 3) conforme são ditos.
- Com 5 itens, prefira sem `detalhe`: o cartão aperta o respiro e o corpo para caber.

### `comparacao` — dois lados

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `lados`: exatamente 2. `rotulo` em letreiro (até ~14 letras), `texto` até ~32 letras (até 3 linhas), `em` de cada lado.
- `modo`: `"contra"` (padrão, ×), `"antes-depois"` (seta) ou `"errado-certo"` (o lado perdedor é riscado em vermelho).
- `vencedor` (opcional, 0 ou 1) e `vencedorEm`: o lado que ganha recebe um lacre pequeno e o outro esmaece.
- `titulo` (opcional): cabeçalho em caligrafia.

### `grafico` — números ditos ou tendência

```json
{ "tipo": "grafico", "de": 9.8, "ate": 13.0, "titulo": "Gasto por categoria", "forma": "barras", "unidade": "mil",
  "dados": [ { "rotulo": "Moradia", "valor": 2.4, "em": 9.9 }, { "rotulo": "Mercado", "valor": 1.2, "em": 10.4 } ] }
```

```json
{ "tipo": "grafico", "de": 8.67, "ate": 12.9, "titulo": "O mercado subindo", "forma": "linha", "tendencia": "sobe", "tendenciaEm": 9.31, "ilustrativo": true }
```

- `forma`: `"barras"` (barras de fita de cetim, com o valor no fim), `"linha"` (linha a pena com losangos e os valores em cima) ou `"pizza"` (anel com a legenda e as porcentagens).
- `dados` (2 a 6): só números **ditos**, cada um com `rotulo` (até ~14 letras), `valor` e `em`.
- Sem números ditos: `tendencia` (`"sobe"`, `"cai"`, `"oscila"`), `tendenciaEm` e `"ilustrativo": true`. Sai uma curva a pena na direção dita e a etiqueta "ILUSTRATIVO".
- `unidade` (opcional): "mil", "%", "kg"… (vai junto dos valores e embaixo do mostrador).

## 6. O fechamento: `cta`

```json
{ "tipo": "cta", "de": 17.88, "ate": 20.32, "texto": "Salva", "complemento": "e manda pro seu amor", "destaque": "seu amor", "seloEm": 18.1 }
```

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "complemento": "e assiste essa aula agora", "em": 40.05 }
```

- `texto`: a chamada. Curta (até ~12 letras, sem destaque) sai em caligrafia grande; mais longa sai em itálico com o `destaque` em caligrafia azul.
- `destaque` (opcional): trecho exato do `texto` ou do `complemento`.
- `icone` (opcional): `"salvar"`, `"seguir"`, `"comentar"` ou `"link"`: um ícone a pena num círculo, acima da chamada.
- `complemento` (opcional): o resto da frase, em itálico, até ~30 letras.
- `em` (opcional): quando a chamada começa a ser dita. `seloEm` (opcional): a re-estampa do lacre (padrão: logo depois do `de`).

## 7. Ícones

Opcionais em itens de `marco` e `topicos`. Sem ícone, o item ganha um losango azul. Não ponha ícone errado.

| Ícone | Use para |
|---|---|
| `calendario` | data, dia, agenda |
| `relogio` | tempo, prazo, horário |
| `local` | local, endereço, destino |
| `casa` | casa, imóvel, família |
| `orcamento` | dinheiro, orçamento, valor, pagamento |
| `grafico` | crescimento, resultado, métrica |
| `alerta` | risco, cuidado, erro comum |
| `certo` / `errado` | o que fazer / o que evitar |
| `lupa` | analisar, pesquisar, conferir |
| `ideia` | dica, ideia, estratégia |
| `coracao` | saúde, relacionamento, cuidado |
| `estrela` | favorito, qualidade, destaque |
| `pessoa` | cliente, pessoa, perfil |
| `livro` | estudo, curso, leitura |
| `telefone` | celular, ligação, app |
| `computador` / `teclado` / `janela` | computador, atalho, navegador, aba |
| `copiar` / `recorte` | copiar, área de transferência, print, recorte |
| `cadeado` | segurança, senha, privacidade |
| `mensagem` | conversa, mensagem, comentário |
| `presente` | bônus, presente, brinde |
| `seta` | próximo passo, direção |
| `lista` | checklist, tarefas |
| `camera` | foto, vídeo, gravação |
| `musica` | música, áudio |
| `convite` / `envio` | convite, carta, envio |
| `confirmacao` | confirmação, presença |
| `buffet` / `bolo` / `taca` | comida, doces, bebida, brinde |
| `flores` | decoração, flores |
| `traje` / `prova` | roupa, prova, ajuste |
| `aliancas` | casamento, compromisso |

## 8. Regras de tempo e de texto

- **Momentos encostados**: o `ate` de um = o `de` do próximo, na pausa entre as frases, de preferência num valor de `cortesEm`. Buraco de 1,2 s ou mais vira trecho sem momento (convite grande com legenda); o `conferir.mjs` recusa trecho de mais de ~3,5 s só com legenda.
- **Tempos**: cada item, número, opção e lado entra no `em` da palavra que o nomeia. Títulos, cabeçalhos, frases e complementos não precisam de tempo por palavra: o template acha cada palavra na fala (texto enxugado continua no ritmo).
- **Ritmo**: algo muda a cada 1,5–2,5 s. Momento com mais de ~4 s precisa de itens entrando por dentro. Não repita o mesmo bloco três vezes seguidas (marcos de uma mesma sequência são a exceção: são a assinatura). Alterne o convite grande com a mesa ou o cronograma.
- **Duração mínima**: blocos de mesa e cronograma, ~2,3 s (o cartão leva 0,6 s para pousar); blocos do convite grande, ~1,4 s.
- **Texto**: curto e com as palavras da fala; pode resumir, não pode mudar o sentido. Os limites de letras acima são para o texto sair grande; passando deles, o template encolhe até 44 px (e o cartão aperta o respiro), mas o vídeo perde força.
- **"pra" e "pro"**: a transcrição costuma escrever "para" e "para o". Pode escrever "pra"/"pro" nos textos: o template casa as duas formas.

## 9. Legenda, correções e sons

- **Legenda**: aparece só nos trechos sem momento, dentro do convite grande, embaixo do lacre (texto chocolate no papel, 60 px). Nos momentos ela some, porque o bloco já mostra o que é dito; neste modelo `legenda: true` num momento não tem efeito. `semLegenda` tira a legenda de um trecho: `[{ "de": 1.2, "ate": 2.0 }]`.
- **Correções**: `{ "bufê": "buffet" }` troca uma ou mais palavras seguidas na legenda; `""` apaga. Só corrija o que você tem certeza.
- **Sons** (automáticos, raros e tonais): o baque da cera quando o lacre estampa; um sopro grave quando uma fita entra; uma nota que sobe a cada cartão que pousa; um acorde curto no fechamento. Nunca dois sons a menos de 0,4 s. `"sfx": false` desliga.

## 10. Exemplo 1: o demo (cerimonialista, 20,3 s)

Fala: "Vai casar? Anota aí esse cronograma. Doze meses antes: data, local e orçamento. Nove meses: fotógrafo e buffet. Seis meses: convites e traje. Três meses: envio dos convites. Um mês: prova final e confirmação dos convidados. Salva e manda pro seu amor." Cortes em 2,60 · 6,58 · 9,33 · 11,98 · 14,48 · 15,17 · 17,88.

```json
{
  "marca": { "nome": "Tiago", "area": "Cerimonial" },
  "sfx": true,
  "correcoes": { "para o": "pro" },
  "semLegenda": [],
  "momentos": [
    { "tipo": "convite", "de": 0, "ate": 2.6, "titulo": "Vai casar?", "subtitulo": "Anota esse cronograma", "seloEm": 1.95 },
    { "tipo": "marco", "de": 2.6, "ate": 6.58, "numero": "12", "unidade": "meses antes", "extenso": "Doze meses antes", "numeroEm": 2.68,
      "itens": [ { "em": 4.21, "texto": "Data", "icone": "calendario" }, { "em": 4.58, "texto": "Local", "icone": "local" }, { "em": 5.24, "texto": "Orçamento", "icone": "orcamento" } ] },
    { "tipo": "marco", "de": 6.58, "ate": 9.33, "numero": "9", "unidade": "meses", "extenso": "Nove meses", "numeroEm": 6.7,
      "itens": [ { "em": 7.89, "texto": "Fotógrafo", "icone": "camera" }, { "em": 8.77, "texto": "Buffet", "icone": "buffet" } ] },
    { "tipo": "marco", "de": 9.33, "ate": 11.98, "numero": "6", "unidade": "meses", "extenso": "Seis meses", "numeroEm": 9.43,
      "itens": [ { "em": 10.63, "texto": "Convites", "icone": "convite" }, { "em": 11.41, "texto": "Traje", "icone": "traje" } ] },
    { "tipo": "marco", "de": 11.98, "ate": 14.48, "numero": "3", "unidade": "meses", "extenso": "Três meses", "numeroEm": 12.09,
      "itens": [ { "em": 13.21, "texto": "Envio dos convites", "icone": "envio" } ] },
    { "tipo": "marco", "de": 14.48, "ate": 17.88, "numero": "1", "unidade": "mês", "extenso": "Um mês", "numeroEm": 14.56,
      "itens": [ { "em": 15.27, "texto": "Prova final", "icone": "prova" }, { "em": 16.16, "texto": "Confirmação dos convidados", "icone": "confirmacao" } ] },
    { "tipo": "cta", "de": 17.88, "ate": 20.32, "texto": "Salva", "complemento": "e manda pro seu amor", "destaque": "seu amor", "seloEm": 18.1 }
  ]
}
```

## 11. Exemplo 2: um vídeo de cripto (43,1 s)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "pessoa": { "zoom": 0.86 },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 5.96 },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.91, "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
    { "tipo": "destaque", "de": 12.91, "ate": 17.25, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta", "detalhe": "Tem gente que perde", "detalheEm": 15.96 },
    { "tipo": "topicos", "de": 17.25, "ate": 24.1, "titulo": "Perde porque",
      "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.21 }, { "texto": "Risco que não entende", "em": 21.25 } ] },
    { "tipo": "pergunta", "de": 24.1, "ate": 28.03, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "destaque", "de": 28.03, "ate": 30.0, "texto": "Aula gratuita", "em": 28.62, "nivel": "chave" },
    { "tipo": "passos", "de": 30.0, "ate": 33.75, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.55, "em": 33.83 },
    { "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.067, "texto": "Toca em Saiba Mais", "destaque": "Saiba Mais", "icone": "link", "complemento": "e assiste essa aula agora", "em": 40.05 }
  ]
}
```

Repare: a assinatura entra nos `passos` da aula (a fita e o mostrador com I · II · III); os três motivos viram `topicos`, não três frases; "mercado subindo × dinheiro no bolso" vira `comparacao`; nenhum número foi inventado (o único número dito, 83 mil dólares, aparece como foi dito).
