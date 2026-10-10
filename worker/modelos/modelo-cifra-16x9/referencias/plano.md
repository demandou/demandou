# O plano de edição (`src/plano.json`), versão deitada (16:9, 1920×1080)

## 0. No quadro deitado (16:9)

Os blocos, os campos e os limites de texto são os mesmos do vertical: um plano do Cifra vertical vale aqui sem mudar nada. O template faz a diagramação sozinho; o plano só precisa respeitar estas diferenças:

- **Composição (aula 9 do curso):** a pessoa em tela cheia é a base. Nos blocos em janela, ela vai para uma moldura do lado direito (rosto centralizado, acompanhado com ajuste suave) e a arte ocupa o quadro do lado esquerdo (~1030 px de largura, ~850 px de altura; ~850 × 850 no `canto`, com a coluna do metrônomo entre os compassos e a pessoa). Onde este texto diz "embaixo da janela" ou "em cima da janela", leia "no quadro à esquerda".
- **Cartões de quadro cheio** (`abertura`, `destaque`, `frase`, `pergunta` até 2 opções, `cta`): a pessoa continua em tela cheia e o cartão fica no peito, abaixo do queixo, largo e baixo (1360 px de largura, ~300 px de altura). O conteúdo vai em fileiras e o texto encolhe para caber: prefira títulos e frases curtos (o limite de caracteres de cada bloco continua valendo).
- **Tempo de leitura e respiro (aula 9):** é uma aula, não um anúncio. Bloco de 2,5 a ~10 s; entre blocos, a pessoa em tela cheia com legenda de 1 a ~8 s. O `conferir.mjs` deste modelo pede ≥ 50% de cobertura, trecho só com legenda até ~8 s, um momento a cada ~10 s e nada parado mais de ~6 s. Não cubra cada frase: o bloco entra onde a ideia precisa de apoio visual.
- **Margens:** 96 px nas laterais; a legenda fica no terço de baixo (y 900); nada importante abaixo de y 984 (controles do player).

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: quadro cheio, janelas e pulso
3. Os blocos universais (os 11 que existem em todos os modelos)
4. A assinatura: `batida`, `compasso`, `cifra` e `acordes`
5. Acordes: forma, dedos e dicionário
6. Regras de tempo
7. Legenda, correções e sons
8. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Carla", "area": "Direito do consumidor" },
  "sfx": true,
  "correcoes": { "HÉ? Mi": "Ré, Mi" }
}
```

- `marca`: aparece só no fechamento (`cta`), ao lado da palheta. O nome encolhe para caber (até ~20 caracteres); a área, até ~26. `nome` vazio = fechamento sem assinatura.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs` (no 16:9, `videoAltura` é 1080 e `rosto` traz o `quadro` 1920×1080 e o `rastro`). Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores. `zona.topo` é onde começa o cartão de quadro cheio (60 px abaixo do queixo); o tamanho do rosto medido decide quanto cada moldura aproxima.

## 2. A gramática: quadro cheio, molduras e pulso

Cada bloco tem o seu lugar para a pessoa (o padrão abaixo). Um momento pode trocar com `"janela": "cheio" | "topo" | "canto" | "centro" | "estante"`: use para variar quando dois blocos do mesmo lugar vêm seguidos. No quadro deitado, todas as janelas são molduras do lado direito; a troca muda a altura e o tamanho da moldura.

| Lugar | Blocos (padrão) | A pessoa | A arte |
|---|---|---|---|
| `cheio` | `abertura`, `destaque`, `frase`, `pergunta` (até 2 opções), `cta` | tela cheia, como foi gravada | cartão de palco no peito, abaixo do queixo, centrado no rosto, **na frente** do vídeo (1360 px, até y 976) |
| `topo` | `numero`, `comparacao`, `acordes` | moldura larga em cima, à direita (652×560, rosto e ombros) | no quadro à esquerda, de x 96 a 1124, de y 96 a 948 |
| `centro` | `grafico`, `batida`, `pergunta` com 3 ou 4 opções | moldura no meio da altura, à direita (652×600) | no quadro à esquerda, de x 96 a 1124, de y 96 a 948 |
| `canto` | `passos`, `compasso` | moldura estreita no canto de cima, à direita (440×540) | o metrônomo na coluna ao lado da moldura (x 984 a 1344); os compassos no quadro à esquerda, de x 96 a 944 |
| `estante` | `topicos`, `definicao`, `cifra` | moldura embaixo, à direita (652×520) | a folha de cifra no quadro à esquerda, de x 96 a 1124, de y 96 a 948 |

O template já faz sozinho:

- **Troca de lugar** (0,55 s, a partir do `de`): nos blocos em moldura, a arte fica **atrás** da pessoa e já entra inteira, a lápis; saindo da tela cheia, a pessoa encolhe para a direita e a arte entra presa à borda esquerda da moldura. Entre duas molduras, a arte que sai some em 0,1 s e só então a nova aparece (nunca dois textos um sobre o outro). Quando a pessoa volta à tela cheia, a arte fica até ser coberta. O cartão de quadro cheio entra ~0,3 s depois do `de` quando a pessoa vem de uma janela; entre dois cartões seguidos, o novo espera o velho sumir.
- **Momentos colados** (o `de` de um = o `ate` do anterior) passam direto de um lugar para o outro. Entre dois momentos separados por mais de 1 s, a pessoa volta ao quadro cheio.
- **O pulso**: a moldura cresce 2% e acende um anel azul em cada item, passo, dado, lado, seta, acorde, marca da folha e batida do metrônomo. Em quadro cheio não há pulso.
- **Esboço a lápis**: antes de ser dito, todo texto aparece apagado, todo traço tracejado, toda bolinha pontilhada, o número zerado. Nada de caixa vazia.
- **Texto que cabe**: cada bloco mede o texto (larguras reais da fonte) e diminui o corpo até caber, em até 2 ou 3 linhas, sem cortar. Os limites abaixo existem para o texto não ficar pequeno demais.
- Um corte no meio de um trecho na mesma janela ganha uma troca seca de enquadramento (zoom 1 ↔ 1,06); um corte perto de uma troca de lugar some no movimento. Por isso vale pôr as fronteiras dos momentos nos cortes.

## 3. Os blocos universais

Os campos são os mesmos em todos os modelos do pack. Palavras de títulos, itens e rótulos entram **no instante em que são ditas** (o template procura cada palavra na fala a partir do `em` do bloco ou do item): use as palavras que a pessoa diz, na ordem em que diz (pode pular palavras). Números em algarismo ("4") casam com a palavra falada ("quatro").

### `abertura` (quadro cheio): a promessa, a pergunta, o tema

```json
{ "tipo": "abertura", "de": 0, "ate": 2.6, "texto": "Comprou pela internet e se arrependeu?", "destaque": "se arrependeu?", "em": 0.28 }
```

- `texto`: até ~45 caracteres (cabe em até 3 linhas). Um número no começo ("4 acordes", "3 erros…") vira o numeral grande azul.
- `destaque` (opcional): trecho exato do texto em azul. `em` (opcional): quando o texto começa a ser dito (padrão: `de`).
- Do Cifra, opcional: `apoio` (uma segunda linha falada, até ~32 caracteres) e `cifras` (até 6 acordes escritos em cima das palavras do apoio, como numa cifra; só em vídeo de música). `titulo` é o nome antigo de `texto` e continua valendo.

### `topicos` (estante): lista sem ordem (motivos, erros, dicas, sinais)

```json
{ "tipo": "topicos", "de": 29, "ate": 33, "titulo": "Três erros que custam caro",
  "itens": [ { "texto": "Comprar por impulso", "em": 29.4 },
             { "texto": "Escolher sem critério", "em": 30.6, "detalhe": "só porque um amigo indicou" },
             { "texto": "Assumir risco que não entende", "em": 31.8 } ] }
```

- 2 a 5 itens; `texto` de 2 a 6 palavras (até ~40 caracteres); `detalhe` (opcional) até ~30, numa linha menor embaixo, que ganha tinta quando é dito. `titulo` (opcional) até ~40.
- Na tela: a folha de cifra; cada item é uma linha com a bolinha de dedo e a faixa que enche enquanto ele é falado. Todos os itens com o mesmo corpo (de 66 até 32 px, o maior em que a lista inteira cabe). Com 5 itens e detalhes, o corpo fica pequeno: prefira 3 ou 4.

### `passos` (canto): itens EM ORDEM (processo, caminho, "primeiro… depois…")

```json
{ "tipo": "passos", "de": 10.15, "ate": 22.2, "titulo": "Funciona assim",
  "itens": [ { "texto": "O prazo conta da chegada", "em": 11.02 },
             { "texto": "A loja devolve tudo", "em": 14.9, "detalhe": "inclusive o frete" },
             { "texto": "Peça por escrito", "em": 18.78, "detalhe": "e guarde o protocolo" } ] }
```

- 2 a 5 itens; `texto` até ~32 caracteres (até 2 linhas); `detalhe` até ~34 (uma linha). `titulo` (opcional) até ~30: vai em caixa-alta embaixo do metrônomo, em cima do contador "1/3".
- Na tela: um compasso por linha (‖: no começo, :‖ no fim), o número grande à esquerda, o texto à direita, a barrinha que enche até o próximo passo; o pêndulo bate em cada `em`; a seta de troca desce até o próximo.
- Use o `em` da palavra que abre o passo (o "1.", o "primeiro", ou a primeira palavra dele).

### `numero` (topo): um número dito

```json
{ "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "em": 1.34 }
```

- `valor`: o número dito (83000 para "83 mil"; 2.5 para "dois e meio"). `casas`: casas decimais (2,5 → `"casas": 1`). Sai em pt-BR (83.000; 2,5).
- `prefixo` ("R$", "US$") e `sufixo` ("%", "mil", "dias", "anos"): menores, ao lado. Prefira o valor inteiro com prefixo ("US$ 83.000") a "83" + "mil".
- `rotulo`: o que o número mede, até ~45 caracteres (até 2 linhas), com palavras da fala; `rotuloEm`: quando o rótulo começa a ser dito (padrão: `de`).
- `em`: a palavra do número. Ele conta em 1,1 s; quando chega, as cordas soam e ele fica azul. `ilustrativo: true` põe a etiqueta (só se o número não foi dito exatamente assim).

### `comparacao` (topo): dois lados

```json
{ "tipo": "comparacao", "de": 8.6, "ate": 12.85,
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 },
             { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ],
  "vencedor": 0, "vencedorEm": 11.99 }
```

- `rotulo`: até ~18 caracteres (caixa-alta pequena); `texto`: até ~36 (até 2 linhas, até 96 px). `titulo` (opcional) até ~30, em cima.
- `modo`: `"contra"` (padrão; barra dupla entre os lados), `"antes-depois"` ou `"errado-certo"` (seta de troca descendo). Em `errado-certo`, o lado 2 é o certo (vencedor) se você não disser outro.
- `vencedor` (0 ou 1, opcional) e `vencedorEm` (padrão: 0,45 s depois do lado vencedor): o vencedor ganha ○ azul, o fundo azul e continua soando; o outro ganha × e as cordas abafam. Use o vencedor para "o que vale" e "o que não vale" (mercado sobe ○ × bolso vazio; entender ○ × correr o risco).

### `grafico` (centro): números ditos ou uma tendência

```json
{ "tipo": "grafico", "de": 7, "ate": 10.5, "forma": "barras", "titulo": "Quanto rendeu",
  "dados": [ { "rotulo": "2023", "valor": 12, "em": 7.3 }, { "rotulo": "2024", "valor": 30, "em": 8.1 } ], "unidade": "%" }
```

- `forma`: `"barras"` (setas para cima sobre as cordas, altura proporcional), `"linha"` (uma corda grossa pelos pontos) ou `"pizza"` (a boca do violão em fatias, com a legenda ao lado).
- `dados`: 2 a 6 números **ditos**, cada um no seu `em`; `rotulo` até ~10 caracteres com 6 dados (até ~16 com 2 ou 3). `unidade` ("%", "mil", "kg") vai junto do valor.
- **Sem números ditos**: não use `dados`; use `"tendencia": "sobe" | "cai" | "oscila"`, `tendenciaEm` (a palavra que diz a tendência) e `"ilustrativo": true` (obrigatório; a etiqueta aparece). Uma corda se desenha subindo, caindo ou oscilando em 1,5 s, com a bolinha na ponta; `unidade` vira o rótulo do eixo.

### `destaque` (quadro cheio): uma palavra ou frase curta que bate forte

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" }
```

- `texto`: até ~35 caracteres (até 3 linhas, até 124 px). `nivel`: `"chave"` (padrão: azul, ○, as cordas soam) ou `"alerta"` (marfim, ×, as cordas vibram e abafam).
- `detalhe` (opcional) até ~40 e `detalheEm`: uma linha menor embaixo das cordas.

### `definicao` (estante): um termo explicado

```json
{ "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` até ~24 caracteres (até 2 linhas, até 140 px); `significado` até ~60 (até 3 linhas). Na folha: o termo em cima, como a cifra; o significado embaixo, como a letra, com a faixa que enche enquanto é dito.

### `frase` (quadro cheio): opinião forte, regra, conclusão

```json
{ "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro" }
```

- `texto` até ~70 caracteres. `destaque` (trecho exato em azul, sublinhado); `risco` (trecho exato riscado quando é dito; `riscoEm` para outro instante); `rotulo` (etiqueta pequena em cima, até ~16: "DICA", "REGRA"); `em` (quando o texto começa).

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 24.1, "ate": 28, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 }
```

- `texto` até ~60 caracteres. `opcoes` (opcional): 2 a 4, cada uma até ~28 caracteres, no `em` da sua palavra. Com 2 opções, fica no cartão do peito (a fermata ao lado da pergunta, as opções lado a lado); com 3 ou 4, a pessoa vai para a moldura do meio e a pergunta ganha o quadro à esquerda.

### `cta` (quadro cheio): fechamento

```json
{ "tipo": "cta", "de": 40, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link" }
```

- `texto` até ~45 caracteres. `icone`: `"salvar"`, `"seguir"`, `"comentar"` ou `"link"` (o ícone vai no botão; o botão diz "Salvar", "Seguir", "Comentar" ou "Saiba mais"; `botao` troca o texto, até ~12).
- `destaque`: trecho exato sublinhado em azul; o botão é **apertado** quando ele é dito (`botaoEm` para outro instante). Sem destaque, o botão é apertado logo depois da primeira palavra.
- O cartão entra uns 0,3 s depois do `de` (a pessoa cresce de volta ao quadro cheio antes): comece o `cta` pelo menos 0,5 s antes do instante do aperto, mesmo que ele comece no fim da frase anterior.

## 4. A assinatura: `batida`, `compasso`, `cifra` e `acordes`

Pelo menos um deles entra em todo vídeo (o `conferir.mjs` exige). Os três primeiros servem para qualquer assunto; `acordes` só para acordes de verdade.

### `batida` (centro): os altos e baixos

```json
{ "tipo": "batida", "de": 14.9, "ate": 24.1, "titulo": "Tem gente que perde",
  "setas": [ { "dir": "cima", "em": 15.48, "rotulo": "na alta" }, { "dir": "baixo", "em": 18.45, "rotulo": "impulso" },
             { "dir": "baixo", "em": 20.43, "rotulo": "sem critério" }, { "dir": "baixo", "em": 21.75, "rotulo": "risco" } ] }
```

- `titulo`: palavras faladas, até ~40 caracteres (até 2 linhas). `setas`: 2 a 6, cada uma no `em` da sua palavra; `dir` `"baixo"` ou `"cima"`; `rotulo` até ~12 caracteres com 4 setas, ~8 com 6 (padrão: "baixo"/"cima").
- Na música: o padrão de batida ("baixo, baixo, cima, cima, baixo"). Em qualquer assunto: o que cai (↓: perda, erro, problema, recusa) e o que sobe (↑: alta, solução, ganho, saída). A seta se enche no sentido do movimento e as cordas vibram na ordem da mão.
- O `de` pode vir 1–2 s antes da primeira seta: as setas a lápis já mostram o desenho que vem.

### `compasso` (canto): o que se repete, com andamento

```json
{ "tipo": "compasso", "de": 6.84, "ate": 12.2, "legenda": true, "compassos": ["G", "D", "Em", "C"], "trocaEm": 7.2, "tocarEm": 9.01,
  "andamentos": [ { "em": 8.14, "texto": "devagar", "periodo": 1.05 }, { "em": 11.28, "texto": "acelera", "periodo": 0.5 } ] }
```

- `compassos`: 2 a 4 cifras (cada compasso com o diagrama do acorde) **ou** 2 a 5 textos curtos (até ~32 caracteres: os tempos de uma rotina, de um ciclo). Um texto pode vir como `{ "texto": "Treino", "em": 3.2 }`: nasce a lápis e ganha tinta quando é dito.
- `andamentos` (opcional): cada um vale a partir do seu `em` ("devagar", "acelera", "mais rápido"); `texto` até ~10 caracteres; `periodo` = segundos por compasso (devagar 0,9–1,2; acelerado 0,45–0,6; sem ele, 1 s e depois a metade). Sem andamentos, o pêndulo bate a cada 1 s.
- `titulo` (opcional): o rótulo em cima do andamento (padrão "andamento"). `trocaEm`: quando as setas de troca se desenham. `tocarEm`: quando o compasso em curso começa a andar. `diagramas: false`: só as cifras, sem diagrama (ukulele, cavaquinho, teclado).
- **Colado num `acordes` com os mesmos acordes** (o `de` do compasso = o `ate` do acordes), os diagramas viajam da grade para os compassos. `"legenda": true` é o normal aqui (a fala costuma ter mais do que a tela mostra).

### `cifra` (estante): a folha na estante (um roteiro com marcas)

```json
{ "tipo": "cifra", "de": 28, "ate": 33.75, "titulo": "Aula gratuita: como eu analiso", "tituloEm": 28.62,
  "linhas": [ [ { "cifra": "O mercado", "em": 30.91 } ], [ { "cifra": "Os riscos", "em": 31.86 } ], [ { "cifra": "A escolha dos ativos", "em": 32.29 } ] ] }
```

- `titulo` até ~40 caracteres (até 2 linhas), ganha tinta a partir de `tituloEm`. `linhas`: 1 a 3 linhas com 1 a 4 marcas cada; cada marca é uma cifra ("G", "F#m") ou um texto curto (até ~24 caracteres numa linha com 1 marca, ~10 com 3 ou 4). Cada marca acende no seu `em` e a faixa da letra embaixo enche como karaokê (o modelo nunca escreve letra de música).
- `semana` (opcional): `{ "em": 18.45, "rotulo": "1 semana de treino" }`: os 7 dias (seg a dom) se marcam um a um em ~0,5 s, para "em uma semana", "em sete dias". `tom` (opcional, só em música e só se foi dito ou é óbvio).

### `acordes` (topo): diagramas de acorde

```json
{ "tipo": "acordes", "de": 3.42, "ate": 6.84, "acordes": [ { "cifra": "G", "em": 3.79 }, { "cifra": "D", "em": 4.68 }, { "cifra": "Em", "em": 5.48 }, { "cifra": "C", "em": 6.41 } ] }
```

- 1 a 4 acordes; cada um se desenha no seu `em` (cordas, trastes, × e ○, os dedos caindo um a um) com a nota grave do acorde, no quadro à esquerda. Ordem: 1 grande; 2 lado a lado; 3 = dois em cima e um embaixo; 4 = 2 × 2. Mais de 4: dois `acordes` seguidos (o segundo com `"janela": "estante"`).
- Acorde fora do dicionário e sem `forma`: aparece só a cifra grande e o nome, sem diagrama.

## 5. Acordes: forma, dedos e dicionário

```json
{ "cifra": "G", "nome": "Sol", "forma": "320003", "dedos": "210003", "em": 3.79 }
```

- `forma`: a casa de cada corda, **da 6ª (Mi grave, a mais grossa) para a 1ª (mi agudo)**. `x` = não toca (×), `0` = corda solta (○). Com casa acima de 9, separe por vírgula: `"x,10,12,12,12,10"`.
- `dedos`: o dedo de cada corda no mesmo formato (1 indicador, 2 médio, 3 anelar, 4 mínimo; `0` ou `x` = sem dedo). **O mesmo dedo em várias cordas na mesma casa vira pestana.** Acima da 4ª casa, o diagrama mostra a casa inicial ao lado ("5ª").
- `nome`: sai sozinho da cifra (G → Sol, Em → Mi menor, F#m → Fá sustenido menor, A7 → Lá com sétima, Cmaj7 → Dó com sétima maior). Cifra com sustenido/bemol: escreva `F#m`, `Bb`; a tela mostra F♯m, B♭.

**Dicionário do template** (`src/acordes.ts`, posições mais ensinadas): C x32010/x32010 · D xx0232/xx0132 · E 022100/023100 · F 133211/134211 (pestana) · G 320003/210003 · A x02220/x01230 · B x24442/x12341 (pestana) · Am x02210/x02310 · Bm x24432/x13421 (pestana) · Dm xx0231/xx0231 · Em 022000/023000 · A7 x02020/x02030 · B7 x21202/x21304 · C7 x32310/x32410 · D7 xx0212/xx0213 · E7 020100/020100 · G7 320001/320001.

Se a pessoa ensina outra digitação, escreva a forma e os dedos dela. Diagrama errado num vídeo de professor é um problema sério: na dúvida, mostre só a cifra e avise o usuário.

## 6. Regras de tempo

- **Fronteiras**: o `de` de um momento = o `ate` do anterior, na pausa entre as frases (de preferência num valor de `cortesEm`) ou uns 0,3 s antes da primeira palavra que o momento mostra. O primeiro momento começa em 0; o `ate` do último é a `duracao`.
- Sub-passos (`itens[].em`, `lados[].em`, `dados[].em`, `setas[].em`, `opcoes[].em`, `linhas[][].em`, `acordes[].em`, `andamentos[].em`, `em`, `rotuloEm`, `significadoEm`, `vencedorEm`, `tendenciaEm`, `detalheEm`, `riscoEm`, `tituloEm`, `botaoEm`): o `em` da palavra, tirado de `work/palavras.json`. Nada aparece com tinta antes de ser dito.
- **Nada parado tempo demais**: no vídeo completo, algo novo entra a cada 2 a 4 s dentro de um bloco (palavra, item, seta, compasso); momento longo precisa de itens entrando por dentro dele. O `conferir.mjs` deste modelo reprova momento com mais de ~6 s sem nada novo.
- **Ritmo da aula (aula 9)**: tela cheia é a base; um bloco a cada ~10 s no mínimo, com tempo de leitura (2,5 s ou mais); não repita o mesmo bloco três vezes seguidas; alterne moldura, cartão de quadro cheio e respiro em tela cheia com legenda (1 a ~8 s).

## 7. Legenda, correções e sons

A legenda é montada sozinha a partir de `palavras`: uma linha numa faixa escura de palco, no terço de baixo (y 900, até ~42 caracteres por linha), a palavra da vez acende. Ela **some durante os momentos** (a arte já mostra o que é dito) e aparece nos trechos sem momento; `"legenda": true` a mantém (o normal no `compasso` de música); com ela, a arte e o cartão de quadro cheio terminam acima da legenda. `semLegenda` acrescenta faixas sem legenda.

Palavras que a transcrição errou vão em `correcoes`: `{ "HÉ? Mi": "Ré, Mi", "dot.": "Dó." }`. A pontuação colada na **última** palavra da regra é mantida. Só corrija o que você tem certeza. Não edite `palavras` à mão: o `cortar.mjs` reescreve esse campo.

Sons (automáticos, sons de corda graves, uns 8 dB abaixo da voz, nunca dois a menos de 0,2 s): notas de uma escala subindo em cada item, opção, dado e lado; um toque de madeira em cada passo e em cada batida do metrônomo; uma palhetada em cada seta (descendo ou subindo), no destaque-chave e no veredito; um toque abafado no alerta; um Sol grave na abertura e quando o número chega; a nota de cada acorde; um arpejo curto no botão do fechamento. `"sfx": false` desliga.

## 8. Exemplos completos

### Vídeo sobre cripto (43 s)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.85, "valor": 83000, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1, "em": 1.34 },
    { "tipo": "definicao", "de": 2.85, "ate": 8.6, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.6, "ate": 12.85, "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ], "vencedor": 0, "vencedorEm": 11.99 },
    { "tipo": "destaque", "de": 12.85, "ate": 14.9, "texto": "Para a maioria das pessoas", "em": 13.46, "nivel": "alerta" },
    { "tipo": "batida", "de": 14.9, "ate": 24.1, "titulo": "Tem gente que perde", "setas": [ { "dir": "cima", "em": 15.48, "rotulo": "na alta" }, { "dir": "baixo", "em": 18.45, "rotulo": "impulso" }, { "dir": "baixo", "em": 20.43, "rotulo": "sem critério" }, { "dir": "baixo", "em": 21.75, "rotulo": "risco" } ] },
    { "tipo": "pergunta", "de": 24.1, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
    { "tipo": "cifra", "de": 28.0, "ate": 33.75, "titulo": "Aula gratuita: como eu analiso", "tituloEm": 28.62, "linhas": [ [ { "cifra": "O mercado", "em": 30.91 } ], [ { "cifra": "Os riscos", "em": 31.86 } ], [ { "cifra": "A escolha dos ativos", "em": 32.29 } ] ] },
    { "tipo": "frase", "de": 33.75, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro" },
    { "tipo": "comparacao", "de": 35.2, "ate": 40.0, "titulo": "Você quer…", "lados": [ { "rotulo": "Entender", "texto": "Antes de decidir", "em": 35.93 }, { "rotulo": "Correr o risco", "texto": "De perder o patrimônio", "em": 37.98 } ], "vencedor": 0, "vencedorEm": 38.81 },
    { "tipo": "cta", "de": 40.0, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste a aula", "destaque": "Saiba Mais", "icone": "link" }
  ],
  "semLegenda": [],
  "correcoes": {}
}
```

Os lugares alternam: topo → estante → topo → cheio → centro → cheio → estante → cheio → topo → cheio (no quadro deitado, as molduras sobem e descem do lado direito e os cartões ficam no peito, com a pessoa em tela cheia). Num vídeo completo, este mesmo trecho ganharia respiros em tela cheia com legenda entre alguns blocos.

### O vídeo de exemplo do modelo (aula de violão, 23,6 s)

Roteiro: "Com quatro acordes você toca centenas de músicas. Sol, Ré, Mi menor e Dó. Treina a troca entre eles devagar, um por compasso. Quando ficar natural, acelera e coloca uma batida simples: baixo, baixo, cima, cima, baixo. Em uma semana você já acompanha suas músicas favoritas. Me segue pra mais aulas de violão."

```json
{
  "marca": { "nome": "Tiago", "area": "Violão" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 3.42, "texto": "4 acordes", "apoio": "você toca centenas de músicas", "destaque": "centenas", "cifras": ["G", "D", "Em", "C"] },
    { "tipo": "acordes", "de": 3.42, "ate": 6.84, "acordes": [ { "cifra": "G", "em": 3.79 }, { "cifra": "D", "em": 4.68 }, { "cifra": "Em", "em": 5.48 }, { "cifra": "C", "em": 6.41 } ] },
    { "tipo": "compasso", "de": 6.84, "ate": 12.2, "legenda": true, "compassos": ["G", "D", "Em", "C"], "trocaEm": 7.2, "tocarEm": 9.01,
      "andamentos": [ { "em": 8.14, "texto": "devagar", "periodo": 1.05 }, { "em": 11.28, "texto": "acelera", "periodo": 0.5 } ] },
    { "tipo": "batida", "de": 12.2, "ate": 18.25, "titulo": "Batida simples", "setas": [ { "dir": "baixo", "em": 13.92 }, { "dir": "baixo", "em": 14.85 }, { "dir": "cima", "em": 15.81 }, { "dir": "cima", "em": 16.76 }, { "dir": "baixo", "em": 17.75 } ] },
    { "tipo": "cifra", "de": 18.25, "ate": 21.05, "titulo": "Suas músicas favoritas", "tituloEm": 20.12, "tom": "G", "semana": { "em": 18.45, "rotulo": "1 semana de treino" },
      "linhas": [ [ { "cifra": "G", "em": 18.89 }, { "cifra": "D", "em": 19.4 } ], [ { "cifra": "Em", "em": 19.99 }, { "cifra": "C", "em": 20.38 } ] ] },
    { "tipo": "cta", "de": 21.05, "ate": 23.56, "texto": "Mais aulas de violão", "botao": "Seguir", "botaoEm": 21.58 }
  ],
  "semLegenda": [ { "de": 11.25, "ate": 12.25 } ],
  "correcoes": { "HÉ? Mi": "Ré, Mi", "i": "e", "dot.": "Dó.", "sim": "cima", "segue para": "segue pra" }
}
```
