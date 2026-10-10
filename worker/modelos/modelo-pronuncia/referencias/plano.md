# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o `rastro`), `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. A `ferramentas/camera-lenta.mjs` completa o `lenta` das fichas. Você preenche `marca`, `momentos`, `semLegenda`, `correcoes` e, se precisar, `rotulos`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática de layout: tela cheia, ficha e câmera lenta
3. A assinatura: `pronuncia` (e a câmera lenta)
4. `repita` (repete comigo)
5. Os 11 blocos universais
6. Regras de tempo
7. Legenda, correções e textos fixos
8. Sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Prof. Tiago", "area": "Inglês" },
  "sfx": true,
  "correcoes": { "Comfortabullo": "Comfortable" }
}
```

- `marca`: o nome aparece na etiqueta da moldura (fichas e painéis) e, com a área, na assinatura do fechamento (`cta`). A área é o rótulo lilás da `abertura`. `nome` vazio = sem etiqueta e sem assinatura.
- `sfx`: `false` desliga os sons.
- `rotulos` (opcional): troca os textos fixos da tela (seção 7).
- `rosto`, `zona`, `videoAltura`, `imagens`: calculados pelos scripts. Não mexa à mão.

## 2. A gramática de layout

O próprio tipo do momento decide o estado da tela:

| Estado | Blocos | O que acontece |
|---|---|---|
| **Tela cheia** | `abertura`, `numero`, `destaque`, `definicao`, `frase`, `pergunta`, `cta`, `repita` e os trechos sem momento | A pessoa ocupa o quadro; o bloco é um cartão violeta no peito, dentro da `zona`. |
| **Ficha / painel** | `pronuncia`, `topicos`, `passos`, `comparacao`, `grafico` | A parte de cima vira um painel violeta (até y = 1040) e a pessoa desce para uma moldura larga embaixo (cabeça e ombros, nome na etiqueta). |
| **Câmera lenta** | dentro de uma `pronuncia` com `lenta` | Corte seco para a tela inteira, um pouco mais perto; lupa na boca, a palavra compacta em cima, a onda embaixo. No fim, volta para a moldura (ou para a tela cheia do bloco seguinte). |

O template já cumpre:
- **Troca sem tela vazia**: a ficha se monta **embaixo** da pessoa; no `de`, ela encolhe em 0,55 s revelando a ficha, enquanto o cartão de tela cheia anterior some por cima. Na volta, ela cresce por cima da ficha.
- **Fichas/painéis seguidos** (o `de` de um = o `ate` do outro): uma cortina violeta com a borda coral passa da direita para a esquerda; o que sai fica de um lado, o que entra do outro. Se a ficha anterior termina na câmera lenta, a seguinte já entra montada embaixo e a pessoa encolhe revelando-a.
- **Dois cartões de tela cheia seguidos**: o primeiro some inteiro antes de o segundo entrar.
- **Último momento**: fica até o último quadro.

Cuidados seus:
- Ficha com menos de ~3 s não dá tempo de ler. Entre duas fichas, não deixe um trecho de tela cheia com menos de ~1,8 s: emende-as.
- Não deixe a pessoa na moldura mais de ~15 s seguidos sem uma câmera lenta ou um bloco de tela cheia.

## 3. A assinatura: `pronuncia`

```json
{ "tipo": "pronuncia", "de": 3.77, "ate": 8.3, "palavra": "comfortable", "em": 3.87,
  "silabas": [ { "texto": "comf", "forte": true }, { "texto": "or", "muda": true }, { "texto": "ta" }, { "texto": "ble" } ],
  "mudaEm": 7.79,
  "fonetica": "/ˈkʌmf.tɚ.bəl/",
  "errado": "con-for-TEI-bou", "erradoEm": 5.06,
  "leitura": "KÂMF-ter-bou", "leituraEm": 5.98,
  "nota": "só 3 sílabas", "notaEm": 7.74,
  "imagem": { "id": "poltrona", "efeito": "aproximar" },
  "lenta": { "de": 6.55, "ate": 7.29 } }
```

- `palavra`: a palavra escrita (ou uma expressão curta de até ~16 letras). Fica numa linha só, no maior corpo que cabe (64 a 190 px).
- `em`: quando a palavra é dita pela primeira vez. As sílabas entram ali, uma a uma, e o ponto pula até a forte. Se o `de` vem bem antes do `em` ("a segunda: vegetable"), o número da ficha aparece grande ("2 de 3") até a palavra ser dita.
- `silabas` (opcional): a palavra **escrita** dividida em partes. Os textos somados, na ordem, formam a palavra. `forte: true` na sílaba tônica (o ponto pousa nela). `muda: true` nas letras que não se falam ("or" em comfortable, o "e" de vegetable, o "o" de chocolate): ficam apagadas e riscadas a partir de `mudaEm`. As partes faladas (as que não são mudas) correspondem, em ordem, às partes da `leitura`. Sem `silabas`, a palavra inteira é uma sílaba forte.
- `fonetica` (opcional): a transcrição no alfabeto fonético internacional, entre barras, para o sotaque da ficha. Use ʌ ə ɚ ɪ ʊ ɑ ɔ æ ɛ θ ð ʃ ʒ tʃ dʒ ŋ ˈ ː e o ponto entre sílabas. Até ~18 símbolos.
- `leitura` (opcional): o jeito de ler para quem fala português, com hífens entre as partes e a sílaba forte em MAIÚSCULAS ("KÂMF-ter-bou", "VÉDJ-ta-bou", "TCHÓK-lit"). A parte forte sai em coral, com um traço desenhado embaixo. `leituraEm`: quando a pessoa mostra o jeito certo ("é assim"); padrão: logo depois do `em`. Até ~16 caracteres.
- `rotuloLeitura` (opcional): o rótulo acima da leitura. Padrão: "jeito brasileiro de ler".
- `errado` e `erradoEm` (opcionais): a pronúncia errada, escrita do mesmo jeito que a leitura; aparece com o rótulo "não é" e é riscada em coral logo depois. Só use se a pessoa disser a forma errada. Até ~18 caracteres.
- `nota` e `notaEm` (opcionais): uma observação curta da fala, numa pílula coral ao lado da fonética ("só 3 sílabas", "o e do meio some", "o rr vibra"). Até ~20 caracteres.
- `idioma` (padrão "inglês") e `sotaque` (padrão "americano" para inglês; vazio para os outros): o cabeçalho mostra "INGLÊS · AMERICANO". Britânico: `"sotaque": "britânico"` (e escreva a fonética e a leitura britânicas: /ˈkʌmf.tə.bəl/, "KÂMF-tâ-bou").
- `imagem` (opcional): a foto do significado, num cartão inclinado no canto (330×370). Sem foto, as linhas ocupam a largura toda.
- O cabeçalho conta as fichas do vídeo ("1 de 3") quando há mais de uma.

### A câmera lenta (`lenta`)

- Você escreve só `"lenta": { "de": …, "ate": … }`: o `em` e o `ate` da **repetição** da palavra em `work/palavras.json` (a segunda vez que ela é dita; a câmera lenta toma o lugar dela). Se a pessoa disser a palavra uma vez só, use essa única vez.
- Rode `node ferramentas/camera-lenta.mjs`. Ela grava no próprio `lenta`:
  - `origem` (a palavra exata na voz), `em` (quando a repetição começa: logo que a frase anterior termina) e `fim` (quando a voz normal volta);
  - `ritmo`: a velocidade que faz a palavra preencher a pausa (0,45× a 0,85×; aparece na tela como "câmera lenta 0,6×");
  - `silabas` (os limites das sílabas medidos na voz), `onda` (a forma da voz) e `arquivo` (`lenta/<palavra>.wav`, a voz recortada e mais lenta, sem mudar o tom).
- Durante a repetição: a voz normal do vídeo abaixa, a voz lenta toca, a pessoa aparece em câmera lenta na mesma velocidade (a boca bate com o som), a lupa abre na boca e segue o rosto, a onda acende e o ponto pula de sílaba em sílaba.
- O `ate` da ficha precisa ir pelo menos até o `fim` da `lenta` (a ferramenta avisa). O momento seguinte começa nesse `fim`.
- Para forçar (raro): `"emPedido"`, `"fimPedido"` ou `"ritmoPedido"` dentro de `lenta`, ou `--ritmo 0.6` na linha de comando. Uma ficha sem `lenta` funciona igual, só sem a repetição.

## 4. `repita` (repete comigo)

```json
{ "tipo": "repita", "de": 16.26, "ate": 19.28, "texto": "Agora repete comigo", "em": 16.04,
  "itens": [ { "texto": "comfortable", "em": 17.54 }, { "texto": "vegetable", "em": 18.28 }, { "texto": "chocolate", "em": 18.78 } ] }
```

- Tela cheia, cartão no peito. O título (`texto`, padrão "Repete comigo") se monta na fala; cada item acende quando é dito, com o ponto na sílaba forte e o jeito de ler ao lado.
- `itens`: 2 a 5, até ~14 letras cada. `leitura` e `forte` (o trecho que leva o ponto) são opcionais: sem eles, o template usa os da ficha `pronuncia` com a mesma palavra.
- Serve para qualquer sequência dita para o público repetir: frases de treino, um trava-língua, os passos de um exercício de respiração.

## 5. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate` e `legenda` (opcional; `true` = a legenda continua durante o momento). Todo campo `em`/`…Em` é o instante de uma palavra dita.

Os textos são medidos com a fonte de verdade e reduzidos para caber. Os limites abaixo são para o texto ficar grande e legível; passou deles, encurte com as palavras da fala.

### `abertura` (tela cheia)
```json
{ "tipo": "abertura", "de": 0, "ate": 3.77, "em": 0.11, "texto": "Três palavras em inglês que quase todo brasileiro fala errado.", "destaque": "fala errado." }
```
- `texto`: até ~70 caracteres (até 4 linhas), com as palavras na ordem da fala. `destaque`: trecho exato em coral. `rotulo`: a linha lilás (padrão: `marca.area`). `em`: quando a primeira palavra do texto é dita (padrão: `de`).

### `topicos` (painel): lista sem ordem
```json
{ "tipo": "topicos", "de": 0, "ate": 3.6, "rotulo": "três sinais", "titulo": "Quando o sotaque atrapalha",
  "itens": [ { "texto": "Ninguém entende de primeira", "em": 0.32, "detalhe": "repetem a pergunta" }, { "texto": "Você evita palavras longas", "em": 1.25 } ] }
```
- `itens`: 2 a 5, até ~45 caracteres (2 linhas), `detalhe` até ~30, `imagem` opcional (miniatura à direita). `rotulo` (lilás) e `titulo` (até ~40 caracteres, 2 linhas) opcionais.

### `passos` (painel): sequência em ordem
Os mesmos campos de `topicos`. As linhas ganham números ligados por um traço que se acende até a etapa dita.

### `numero` (tela cheia)
```json
{ "tipo": "numero", "de": 14, "ate": 16, "valor": 83000, "em": 14.05, "rotulo": "palavras no dicionário", "prefixo": "", "sufixo": "" }
```
- Conta até `valor` a partir de `em` (1 s). Formato pt-BR (83.000; 1,5). `prefixo` ("US$ "), `sufixo` ("%", " mil"), `casas`, `rotulo` (até ~40), `rotuloEm`, `ilustrativo`.

### `comparacao` (painel)
```json
{ "tipo": "comparacao", "de": 7.6, "ate": 11, "modo": "errado-certo", "titulo": "Como soa",
  "lados": [ { "rotulo": "errado", "texto": "con-for-TEI-bou", "em": 7.74 }, { "rotulo": "certo", "texto": "KÂMF-ter-bou", "em": 9.11 } ],
  "vencedor": 1, "vencedorEm": 10.23 }
```
- `modo`: `contra` (padrão, "vs"), `antes-depois` ("→") ou `errado-certo` (o errado é riscado, o certo sublinhado). `texto` até ~40 caracteres. `vencedor` e `vencedorEm` opcionais.

### `grafico` (painel)
```json
{ "tipo": "grafico", "de": 11, "ate": 14, "forma": "barras", "titulo": "Sílabas faladas",
  "dados": [ { "rotulo": "escrito", "valor": 4, "em": 11.11 }, { "rotulo": "falado", "valor": 3, "em": 12.43 } ] }
```
- `forma`: `barras`, `linha` ou `pizza`. `dados`: 2 a 6 números **ditos**, cada um no seu `em`; `rotulo` até ~12 caracteres; `unidade` ("%", "R$", "kg").
- Sem números: `"tendencia": "sobe" | "cai" | "oscila"`, `tendenciaEm` e `"ilustrativo": true` (a etiqueta aparece sozinha).

### `destaque` (tela cheia)
```json
{ "tipo": "destaque", "de": 16, "ate": 17.6, "texto": "Treine todo dia", "em": 16.04, "nivel": "chave", "detalhe": "cinco minutos bastam", "detalheEm": 16.69 }
```
- `texto` até ~30 caracteres (2 linhas). `nivel`: `chave` (traço coral embaixo) ou `alerta` (texto coral, rótulo "atenção"). `detalhe` até ~40. `imagem` opcional.

### `definicao` (tela cheia)
```json
{ "tipo": "definicao", "de": 17.6, "ate": 19.2, "termo": "schwa", "fonetica": "/ʃwɑː/", "em": 17.69, "significado": "a vogal fraca do inglês, quase um murmúrio", "significadoEm": 18.04 }
```
- `termo` até ~20 caracteres; `fonetica` opcional; `significado` até ~90 caracteres (3 linhas), escrito na fala. `imagem` opcional.

### `frase` (tela cheia)
- `texto` até ~90 caracteres (4 linhas), `destaque` (coral), `risco` + `riscoEm` (riscado), `em`.

### `pergunta` (tela cheia)
- `texto` até ~60 caracteres; `opcoes`: 2 a 4 pílulas, até ~16 caracteres cada, cada uma no seu `em`; `em`.

### `cta` (tela cheia): fechamento
```json
{ "tipo": "cta", "de": 19.28, "ate": 21.12, "texto": "Salva e treina hoje.", "icone": "salvar", "em": 19.33, "destaque": "treina hoje." }
```
- `texto` até ~50 caracteres; `icone`: `salvar`, `seguir`, `comentar` ou `link`; `destaque`; `em`. A assinatura (nome · área) entra embaixo.

## 6. Regras de tempo

- Cada momento começa um pouco antes da primeira palavra dele (0,05 a 0,2 s) e termina onde o seguinte começa. Cobertura de 100% é o normal neste modelo.
- Todo `em` é o começo de uma palavra dita (o `em` dela em `work/palavras.json`; a transcrição pode errar um ou dois décimos em palavra estrangeira, tudo bem).
- Na ficha: `em` ≤ `erradoEm` < `leituraEm` < `lenta` < `notaEm` é a ordem natural de uma explicação, mas siga a ordem da fala.
- Depois de mudar um corte, rode `cortar.mjs --manter-plano`, confira os tempos e rode a `camera-lenta.mjs` de novo.

## 7. Legenda, correções e textos fixos

- A legenda (faixa violeta, a palavra dita com um ponto coral embaixo) só aparece nos trechos sem momento ou com `legenda: true`. Neste modelo quase tudo é momento: ela aparece pouco.
- `correcoes`: troca palavras da transcrição na legenda e na montagem dos títulos (`"Comfortabullo": "Comfortable"`). `""` apaga.
- `semLegenda`: trechos sem legenda (`[{ "de": 3, "ate": 5 }]`).
- `rotulos`: os textos fixos da tela, para um vídeo em outro idioma ou outro tom. Chaves e padrões: `pronuncia` "pronúncia", `idioma` "inglês", `sotaque` "americano", `de` "de" (1 de 3), `naoE` "não é", `leitura` "jeito brasileiro de ler", `lenta` "câmera lenta", `repita` "Repete comigo", `quer` "quer dizer", `guarde` "guarde isto", `atencao` "atenção", `numero` "em número", `numeros` "em números", `voce` "e você?", `ilustrativo` "ilustrativo", `certo` "o certo", `compare` "compare", `naoEE` "não é · é". Exemplo em espanhol:
  ```json
  "rotulos": { "pronuncia": "pronunciación", "idioma": "inglés", "sotaque": "americano", "naoE": "no es", "leitura": "cómo se lee", "lenta": "cámara lenta", "repita": "Repite conmigo", "quer": "significa", "guarde": "recuerda", "atencao": "atención", "numero": "en número", "numeros": "en números", "voce": "¿y tú?", "certo": "lo correcto", "compare": "compara", "naoEE": "no es · es" }
  ```

## 8. Sons

O template põe sozinho: duas notas quando o jeito certo se desenha, um tom que desce no começo da câmera lenta (baixo, para não brigar com a voz), uma nota curta em cada item de lista e no número, e um acorde suave no fechamento. `"sfx": false` desliga.

## 9. Exemplos completos

### Inglês (o vídeo de exemplo do modelo, 21 s)

"Três palavras em inglês que quase todo brasileiro fala errado. Comfortable. Não é confortable, é assim: comfortable. Só três sílabas. Segunda: vegetable. O e do meio some. Vegetable. E a terceira: chocolate. Duas sílabas só. Chocolate. Agora repete comigo: comfortable, vegetable, chocolate. Salva e treina hoje."

`abertura` (0–3,8) → `pronuncia` comfortable (3,8–8,3, `lenta` na repetição) → `pronuncia` vegetable (8,3–12,6, entra por cortina com "2 de 3") → `pronuncia` chocolate (12,6–16,3, entra embaixo da câmera lenta anterior) → `repita` (16,3–19,3) → `cta` (19,3–21,1). Veja `src/plano.json` do template.

### Outro assunto, o mesmo estilo (oratória)

"Três palavras que travam qualquer apresentação. A primeira: 'paralelepípedo'. Não é para-le-pí-pe-do. É pa-ra-le-le-pí-pe-do. Pa-ra-le-le-pí-pe-do. Sabe por que trava? Língua dura, pressa e falta de ar."

- `abertura` "Três palavras que travam qualquer apresentação".
- `pronuncia` `palavra: "paralelepípedo"`, `idioma: "português"`, `silabas` pa · ra · le · le · pí (forte) · pe · do, `errado: "para-le-PÍ-pe-do"`, `leitura: "pa-ra-le-le-PÍ-pe-do"`, `rotuloLeitura: "devagar"`, `lenta` na repetição.
- `topicos` "Por que trava": "Língua dura", "Pressa", "Falta de ar".
