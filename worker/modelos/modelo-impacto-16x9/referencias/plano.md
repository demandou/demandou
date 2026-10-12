# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o rastro do rosto), `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Como a tela se divide (a gramática do modelo)
2. Campos gerais
3. Os blocos universais
4. Os blocos próprios do Impacto (a assinatura)
5. Como o texto vira palavras enormes
6. Regras de tempo
7. Legenda e correções
8. Exemplo completo (um vídeo sobre cripto)

## 1. Como a tela se divide

Você não posiciona nada à mão: o lugar da pessoa sai do tipo de bloco.

- **Quadro cheio**: fora dos momentos. A pessoa ocupa a tela com o rosto no centro e a legenda aparece abaixo do queixo. Em cada corte dentro desses trechos o zoom troca seco (1 ↔ 1,08), para disfarçar o pulo.
- **De lado**: `abertura`, `topicos`, `numero`, `comparacao`, `destaque`, `definicao`, `frase`, `pergunta`, `cta`, `gancho` e `virada`. A caixa da pessoa desliza para um lado (coluna inteira, 45% da largura, rosto centrado nela) e o bloco ocupa o outro. **O lado alterna sozinho** a cada momento (pessoa à direita, depois à esquerda…). Na base da coluna livre fica a assinatura (filete, nome e área, da `marca`).
- **Tela cheia**: `passos`, `grafico` e `circuito`. O conteúdo toma o quadro e a pessoa vira uma janela no canto de cima, à direita.

Trocas:
- Dois momentos com menos de 0,35 s entre eles ficam **colados**: a pessoa vai direto do lugar de um para o do outro. Com mais espaço, ela volta ao quadro cheio e a legenda aparece.
- Quando a pessoa pula de um lado para o outro, a borda da caixa cobre o que sai e revela o que entra. Nas outras trocas coladas (de lado para tela cheia, tela cheia para tela cheia, mesmo lado), um filete verde-limão varre a área do texto e faz o mesmo papel. As duas páginas nunca aparecem juntas.
- Para forçar um lado, use `"lado": "esquerda"` ou `"direita"` no momento (é o lado da **pessoa**); a alternância continua a partir dele. Dois momentos seguidos do mesmo lado funcionam, mas perdem o pulo: evite.

Gravação de selfie (rosto grande no quadro): a coluna da pessoa alarga sozinha (até 580 px) e a coluna do texto fica mais estreita (~416 px). Escreva textos ainda mais curtos nesse caso.

## 2. Campos gerais

```json
{
  "marca": { "nome": "Carla Nunes", "area": "Nutricionista" },
  "sfx": true,
  "correcoes": { "Jão": "João", "chat GPT": "ChatGPT" }
}
```

- `marca`: a assinatura na base da coluna livre, em todo momento de lado. `nome` vazio = sem assinatura. `nome` até 16 caracteres; `area` até 24 (mais longa, quebra em duas linhas).
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte.

Campos que todo momento aceita: `tipo`, `de`, `ate`, `legenda` (opcional, `true` mantém a legenda durante o momento) e `lado` (opcional, só nos blocos de lado).

## 3. Os blocos universais

Os mesmos 11 blocos (mesmos nomes e campos) existem em todos os modelos do pack. Aqui está como cada um aparece no Impacto e quanto texto cabe. Os limites existem porque as palavras são enormes: a coluna do texto tem ~506 px (416 px em selfie). Texto mais longo continua cabendo (o bloco reduz o corpo e quebra mais linhas), mas perde o impacto.

### `abertura`: o título que bate

```json
{ "tipo": "abertura", "de": 0, "ate": 3.0, "texto": "Você não precisa de 1 hora de academia", "destaque": "1 hora", "em": 0.31 }
```

- `texto`: até ~40 caracteres, com as palavras da fala, na ordem. Vira 2 a 5 linhas em caixa alta.
- `destaque` (opcional): o trecho **exato** do texto que fica no acento; a pancada grave cai na palavra mais longa dele.
- `em` (opcional): quando o texto começa a ser dito (padrão: `de`).
- `rotulo` (opcional, do Impacto): o assunto em 1 a 3 palavras, pequeno e espaçado, em cima.

### `topicos`: lista sem ordem

```json
{ "tipo": "topicos", "de": 17.2, "ate": 23.6, "titulo": "Por que perde",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 },
             { "texto": "Escolhe moeda sem critério", "em": 19.21 },
             { "texto": "Assume risco que não entende", "em": 21.25 } ] }
```

- `itens`: 2 a 5, de 2 a 5 palavras (até ~30 caracteres). `em` = a primeira palavra do item. As palavras do item batem uma a uma.
- `titulo` (opcional): até ~30 caracteres, em rótulo espaçado.
- `detalhe` (opcional): até ~40 caracteres, menor, embaixo do item, logo depois dele.
- Com 4 ou 5 itens longos o corpo cai para ~50 px; prefira 3 itens curtos.

### `passos`: sequência em ordem (tela cheia)

```json
{ "tipo": "passos", "de": 28.0, "ate": 33.7, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 },
             { "texto": "A escolha dos ativos", "em": 32.21 } ], "fimEm": 33.2 }
```

- `itens`: 2 a 5, até ~40 caracteres (quebra em até 3 linhas). As vagas 01, 02, 03 aparecem junto com a ficha; cada etapa entra palavra por palavra no seu `em`; a anterior ganha ✓.
- `titulo` (opcional): até ~30 caracteres, ao lado da janela; se começar com número ("3 passos"), o número fica grande, em mono, no acento.
- `detalhe` (opcional): até ~40 caracteres, embaixo da etapa.
- `fimEm` (opcional, do Impacto): quando a pessoa fecha a ideia; tudo fica com ✓.

### `numero`: número que conta

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34,
  "rotulo": "Bitcoin rompeu", "rotuloEm": 0.10 }
```

- `valor`: o número dito, como número (`83000`, `1.5`, `73`). Formato pt-BR na tela (83.000; 1,5). Anos (1931, 2007) aparecem sem ponto.
- `em`: a palavra do número; a contagem parte de zero logo depois de `de` e **trava no acento** nesse instante. Comece o momento 0,4 a 0,8 s antes.
- `rotulo`: até ~24 caracteres (2 linhas), o assunto do número, em palavras enormes embaixo. `rotuloEm` (opcional): quando ele bate (padrão: logo depois do número).
- `prefixo`: moeda ou sinal ("R$", "US$"), pequeno, em cima do número.
- `sufixo`: curto ("%", "x") cola no número; palavra ("kg", "anos", "mil") vira uma linha grande embaixo.
- Número grande demais para ficar gigante na coluna (83000) aparece sozinho como "83" + "MIL" (exato, nunca arredonda).
- `casas`: casas decimais. `ilustrativo: true` põe a etiqueta "ilustrativo".
- Do Impacto (opcionais): `marcadores` (quantos tracinhos enchem com a contagem; padrão: o próprio valor até 30, senão 24; `0` desliga) e `complemento` `{ "em", "texto" }` (até 16 caracteres, no acento, embaixo dos marcadores).

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.8, "modo": "errado-certo", "titulo": "Antes de comprar",
  "lados": [ { "rotulo": "O que todo mundo faz", "texto": "Compra na alta", "em": 9.31 },
             { "rotulo": "O que funciona", "texto": "Estuda o projeto", "em": 10.91 } ] }
```

- `lados`: 2, cada um com `rotulo` (até ~20 caracteres, rótulo espaçado; aparece apagado desde o início e acende no `em`) e `texto` (até ~30 caracteres, palavras enormes).
- `modo`: `contra` ("VS" entre os dois, padrão), `antes-depois` (seta para baixo), `errado-certo` ("×"; o primeiro lado é riscado quando o segundo é dito e o segundo fica no acento).
- `vencedor` (0 ou 1) e `vencedorEm` (opcionais): quem ganha fica no acento; o outro é riscado. Sem `vencedorEm`, logo depois do segundo lado.
- `titulo` (opcional): até ~30 caracteres, em cima.

### `grafico`: números ou tendência (tela cheia)

```json
{ "tipo": "grafico", "de": 9.45, "ate": 13.2, "forma": "barras", "titulo": "Altura", "unidade": "m",
  "dados": [ { "rotulo": "Estátua", "valor": 30, "em": 9.61 }, { "rotulo": "Com o pedestal", "valor": 38, "em": 11.59 } ] }
```
```json
{ "tipo": "grafico", "de": 9.7, "ate": 12.8, "forma": "linha", "titulo": "Mercado", "tendencia": "sobe", "tendenciaEm": 9.8, "ilustrativo": true }
```

- `dados`: **2 a 6 números ditos**, cada um com `rotulo` (até ~14 caracteres), `valor` e `em`. `barras`: barras grossas que crescem na palavra de cada uma, com o valor contando; `linha`: pontos quadrados ligados por um traço que avança de um ao outro; `pizza`: um anel dividido, cada fatia na sua palavra, a porcentagem da fatia no centro.
- Sem números ditos: `tendencia` (`sobe`, `cai`, `oscila`) + `ilustrativo: true`. Uma linha se desenha do começo ao fim do momento, com a caneta quadrada no acento e a seta no fim; a etiqueta "ilustrativo" aparece em cima. `tendenciaEm` (opcional): quando o traço começa.
- `unidade` (opcional): "%", "x" colados ao número; "R$" antes; "m", "kg", "mil" depois, menores.
- `titulo` (opcional): até ~30 caracteres, ao lado da janela.
- Com 1 número só, use `numero`.

### `destaque`: a palavra que bate

```json
{ "tipo": "destaque", "de": 15.85, "ate": 17.2, "texto": "Tem gente que perde", "em": 15.96, "nivel": "alerta" }
```

- `texto`: 2 a 4 palavras (até ~24 caracteres).
- `nivel`: `chave` (padrão: filete no acento e as palavras em verde-limão) ou `alerta` (tarjas verde-limão que crescem palavra por palavra, texto quase preto; pancada grave).
- `detalhe` (opcional, até ~50 caracteres) e `detalheEm`: uma linha menor embaixo, quando é dita.

### `definicao`: termo e significado

```json
{ "tipo": "definicao", "de": 4.95, "ate": 8.6, "termo": "Novo bull market", "em": 5.05,
  "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo`: até ~20 caracteres. Bate grande no `em`.
- `significado`: até ~40 caracteres. No `significadoEm` o termo encolhe para cima no acento, um "=" bate e o significado entra palavra por palavra.

### `frase`: frase de efeito

```json
{ "tipo": "frase", "de": 33.7, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "em": 33.83 }
```

- `texto`: até ~50 caracteres, as palavras da fala na ordem.
- `destaque` (opcional): trecho exato no acento.
- `risco` (opcional): trecho exato atravessado por uma barra no acento; `riscoEm` (opcional) é o instante (padrão: logo depois da última palavra do trecho). Pancada grave no risco.
- `em` (opcional): quando o texto começa a ser dito.

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~45 caracteres. Um "?" enorme no acento abre o bloco.
- `opcoes` (opcional): 2 a 4, até ~30 caracteres cada, numa ficha curta A, B, C, D; a letra acende quando a opção é dita.
- `em` (opcional): quando a pergunta começa a ser dita.

### `cta`: chamada final

```json
{ "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: até ~40 caracteres, com as palavras da fala. Pode pular palavras ditas ("Toca em Saiba Mais" para "Toca aqui em Saiba Mais"): cada palavra escrita acha a sua na fala.
- `icone`: `salvar`, `seguir`, `comentar` ou `link`. Sem `icone`, o avião de papel ("manda para alguém"), que parte devagar depois de desenhado.
- `destaque` (opcional): trecho exato no acento.
- `itens` (opcional, do Impacto): as linhas escritas à mão, cada uma `{ "em", "texto", "destaque"? }`, para escolher a quebra (como no `gancho`). Com `itens`, eles mandam no desenho; `texto` continua obrigatório.
- Se for o último momento, fica até o fim do vídeo.

## 4. Os blocos próprios do Impacto (a assinatura)

O `conferir.mjs` exige `circuito` ou `virada` pelo menos uma vez.

### `circuito`: a ficha que se cumpre (tela cheia)

```json
{ "tipo": "circuito", "de": 6.6, "ate": 16.16, "rotulo": "Treino de 20 min",
  "titulo": { "em": 6.69, "texto": "4 exercícios" },
  "intervalo": { "trabalho": 40, "descanso": 20, "em": 7.94, "descansoEm": 9.07 },
  "itens": [ { "em": 10.62, "texto": "Agachamento" }, { "em": 11.7, "texto": "Flexão" },
             { "em": 12.68, "texto": "Prancha" }, { "em": 13.53, "texto": "Polichinelo" } ],
  "voltas": { "em": 14.54, "valor": "4", "texto": "voltas" }, "fimEm": 15.64 }
```

- Para qualquer lista dita em sequência: método, rotina, critérios, etapas, fatos de uma ficha técnica.
- `itens`: 2 a 5, até ~40 caracteres (quebram em até 3 linhas), com `detalhe` opcional. O item da vez aceso, os que passaram com ✓.
- `titulo`: texto (aparece com a ficha) ou `{ "em", "texto" }` (bate na palavra). Até ~30 caracteres; começando com número, o número fica grande no acento.
- `rotulo` (opcional): até ~22 caracteres, pequeno, no topo.
- `intervalo` (opcional): **só quando a pessoa diz dois tempos** (treino e descanso, foco e pausa). `em` = quando o primeiro é dito, `descansoEm` = o segundo. `nomes` (opcional, padrão ["treino", "descanso"]) e `unidade` ("s", padrão, ou "min"). O anel dá uma volta por item, com o cronômetro correndo. Sem `intervalo`, a lista sobe e fica maior.
- `voltas` (opcional): selo no acento, `valor` até 3 caracteres ("4", "3x") e `texto` até 10 ("voltas", "dias", "rodadas").
- `fimEm` (opcional): quando a pessoa fecha a ideia ("e acabou", "pronto"): o anel fecha com um ✓ e todos os itens ficam marcados.
- Pode durar até ~12 s; mais que isso, divida.

### `virada`: não é X, é Y

```json
{ "tipo": "virada", "de": 16.16, "ate": 21.32, "rotulo": "O segredo",
  "nao": { "em": 16.61, "prefixo": "não é o", "linhas": ["treino", "perfeito"] },
  "grifoEm": 18.32,
  "sim": [ { "em": 18.37, "texto": "o treino" }, { "em": 18.67, "texto": "que você" },
           { "em": 19.53, "texto": "repete", "destaque": true } ],
  "selo": { "em": 20.06, "texto": "3x por semana" } }
```

- Para qualquer frase que troca uma ideia por outra ("não é X, é Y", "X não significa Y", "esquece X, faz Y").
- `nao.linhas`: 1 ou 2 linhas, até ~10 caracteres cada. `nao.prefixo` (opcional, até ~16): o "não é o" que vem antes, menor. `nao.em`: a primeira palavra do prefixo (ou da primeira linha). As palavras de prefixo e linhas são escritas **na ordem e na quantidade em que foram ditas**.
- `grifoEm`: a palavra que vira a frase ("É…", "mas…", "literalmente"): X é riscado, encolhe para cima e Y começa a entrar 0,3 s depois.
- `sim`: 2 a 4 linhas como as do `gancho` (até ~10 caracteres), uma em `destaque`.
- `selo` (opcional): até 16 caracteres, num bloco no acento. `rotulo` (opcional): até ~20, quando a pessoa anuncia ("O segredo", "A verdade").

### `gancho`: abertura com a quebra escolhida

```json
{ "tipo": "gancho", "de": 0, "ate": 3.0, "itens": [
  { "em": 0.31, "texto": "Você não" }, { "em": 0.74, "texto": "precisa de" },
  { "em": 1.45, "texto": "1 hora de", "destaque": true }, { "em": 2.17, "texto": "academia" } ] }
```

- `itens`: 2 a 5 linhas, 1 a 2 palavras e 8 a 10 caracteres cada. `em` = a primeira palavra falada da linha; pular palavras **entre** linhas pode.
- `destaque`: uma linha, a que carrega a promessa. `rotulo` (opcional): o assunto, pequeno.

## 5. Como o texto vira palavras enormes

- Em `abertura`, `frase`, `destaque`, `pergunta`, `cta`, `definicao`, `comparacao`, `topicos` e `numero.rotulo`, o modelo **quebra o texto sozinho** em linhas de cartaz: cada linha ocupa a largura da coluna, a quebra escolhida é a que deixa a menor linha o maior possível, uma palavra pequena ("de", "a") nunca fica sozinha e nenhuma linha passa de 2,2× a menor.
- Cada palavra escrita procura a sua na fala, na ordem, a partir do `em` do bloco: "pra" acha "para", "1" acha "um", plural acha singular. Palavras que não estão na fala entram junto com as vizinhas. Por isso: **use as palavras da fala**, na ordem; pode pular palavras ("Toca em Saiba Mais" para "Toca aqui em Saiba Mais").
- Texto que não cabe nunca vaza: o corpo cai até o mínimo legível (~44 px) e as linhas aumentam. Se você vir uma linha bem menor que as outras, encurte.
- Palavra muito longa ("posicionamento", "criptomoedas") limita o corpo da linha dela; se ela for o centro da ideia, deixe-a numa linha curta ou num bloco só dela.

## 6. Regras de tempo

- `de`: de 0,1 a 0,3 s antes da primeira palavra que o momento mostra (a caixa leva 0,3 s para abrir o espaço). No `numero`, 0,4 a 0,8 s antes do `em`. Nunca antes do `ate` do momento anterior. Um bloco que só mostra o rótulo por mais de ~1 s parece vazio: comece mais perto da primeira palavra.
- `ate`: o `em` da **primeira palavra que o momento não cobre** (a frase seguinte), menos 0,05. Em trechos curtos a transcrição às vezes marca uma palavra um pouco antes da anterior: use o **menor** `em` da frase seguinte, senão essa palavra some da legenda. O último momento, se termina a menos de 0,3 s do fim, fica na tela até o último quadro.
- Para a pessoa ir direto de um momento para outro, faça o `de` do segundo igual ao `ate` do primeiro.
- Duração: mínimo ~1,3 s. Blocos de lado até ~6 s (mais que isso, divida ou devolva à legenda). Tela cheia (`passos`, `grafico`, `circuito`) até ~12 s.
- Dentro do momento, cada item entra no `em` da palavra que o nomeia. Nada aparece antes de ser dito.
- Trechos só com a pessoa e a legenda: até ~3 s, nas frases de ligação ("anota aí", "olha só"). O `conferir.mjs` recusa vãos de mais de 3,5 s e menos de 70% do vídeo com momento.

## 7. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez, em Sora, abaixo do queixo; cada palavra entra quando é dita e a da vez fica no acento. Ela **some durante os momentos** (as palavras grandes já mostram o que é dito) e volta quando a pessoa volta ao quadro cheio.

- `"legenda": true` no momento: a legenda continua durante ele (nos blocos de lado, na coluna livre, entre o bloco, que sobe um pouco, e a assinatura). Use quando o bloco mostra só parte da fala.
- `semLegenda`: faixas extras sem legenda (`[ { "de": 21.3, "ate": 22.2 } ]`).
- `correcoes`: palavras que a transcrição errou, sem pontuação: `{ "Jão": "João", "chat GPT": "ChatGPT", "né": "" }`. A chave pode ter várias palavras; `""` apaga. Valem para a legenda **e** para as palavras grandes. Só corrija o que você tem certeza. Não edite `palavras` à mão.

Para ver todas as linhas de legenda antes de renderizar: `node scripts/legendas.mjs`.

## 8. Exemplo completo (um vídeo sobre cripto)

Fala (selfie, 43 s depois do corte): "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.10 },
    { "tipo": "definicao", "de": 4.95, "ate": 8.6, "termo": "Novo bull market", "em": 5.05, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "virada", "de": 9.7, "ate": 14.88, "rotulo": "Mercado subindo",
      "nao": { "em": 9.87, "prefixo": "não significa", "linhas": ["dinheiro", "no bolso"] }, "grifoEm": 12.91,
      "sim": [ { "em": 13.46, "texto": "para a" }, { "em": 13.82, "texto": "maioria", "destaque": true } ],
      "selo": { "em": 14.25, "texto": "das pessoas" } },
    { "tipo": "destaque", "de": 15.85, "ate": 17.2, "texto": "Tem gente que perde", "em": 15.96, "nivel": "alerta" },
    { "tipo": "topicos", "de": 17.2, "ate": 23.6, "titulo": "Por que perde", "itens": [
      { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Escolhe moeda sem critério", "em": 19.21 },
      { "texto": "Assume risco que não entende", "em": 21.25 } ] },
    { "tipo": "frase", "de": 24.45, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "destaque": "avaliar os projetos", "em": 24.58 },
    { "tipo": "circuito", "de": 28.0, "ate": 33.7, "titulo": { "em": 28.62, "texto": "Aula gratuita" }, "itens": [
      { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.7, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "em": 33.83 },
    { "tipo": "pergunta", "de": 35.2, "ate": 40.0, "texto": "Você quer", "em": 35.23, "opcoes": [
      { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

Com esse plano: o vídeo abre com a pessoa em quadro cheio e ela desliza para a direita enquanto US$ 83 conta e trava em "83", com "MIL" e "BITCOIN ROMPEU" embaixo. Volta ao centro em "e reacendeu a conversa sobre o" (legenda), pula para a esquerda na definição, para a direita na virada (o "dinheiro no bolso" é riscado em "literalmente"), respira em "Mesmo na alta", e então emenda alerta, tópicos e a frase, sempre trocando de lado. A ficha da aula toma a tela (a pessoa vira janela), o filete varre de volta para a frase com o risco, e pergunta e chamada fecham trocando de lado, com a chamada até o último quadro. O exemplo do próprio template (`src/plano.json`) é o vídeo do personal trainer, com `gancho`, `numero`, `circuito`, `virada` e `cta`.
