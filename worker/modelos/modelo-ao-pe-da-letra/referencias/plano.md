# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto` (com o `rastro`), `zona`, `cortesEm` e `palavras`. O `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `idioma2`, `semLegenda`, `correcoes` e, se precisar, `rotulos`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática de layout: tela cheia e painel
3. A assinatura: `literal`
4. Os 11 blocos universais
5. Regras de tempo
6. Legenda bilíngue, correções e textos fixos
7. Sons
8. Exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Prof. Tiago", "area": "Expressões" },
  "sfx": true,
  "correcoes": { "Embarrassem-se": "Embarrass yourself" },
  "idioma2": [ { "de": 2.8, "ate": 3.7 }, { "de": 6.9, "ate": 7.9 } ]
}
```

- `marca`: o nome aparece na etiqueta da moldura (painéis) e, com a área, na assinatura do fechamento (`cta`). A área é o rótulo da `abertura`. `nome` vazio = sem etiqueta e sem assinatura.
- `idioma2`: os trechos falados na outra língua (inglês, espanhol…), em segundos. A legenda os pinta de azul-céu.
- `sfx`: `false` desliga os sons.
- `rotulos` (opcional): troca os textos fixos da tela (seção 6).
- `rosto`, `zona`, `videoAltura`, `imagens`: calculados pelos scripts. Não mexa à mão.

## 2. A gramática de layout

O próprio tipo do momento decide o estado da tela:

| Estado | Blocos | O que acontece |
|---|---|---|
| **Tela cheia** | `abertura`, `numero`, `destaque`, `definicao`, `frase`, `pergunta`, `cta` e os trechos sem momento | A pessoa ocupa o quadro; o bloco é um cartão de tinta no peito, dentro da `zona`. |
| **Painel** | `literal`, `topicos`, `passos`, `comparacao`, `grafico` | A parte de cima vira um painel vermelho-carimbo (até y = 1040) e a pessoa desce para uma moldura larga embaixo (cabeça e ombros, nome na etiqueta). A legenda desce para dentro da moldura, abaixo do queixo. |

O template já cumpre:
- **Troca sem tela vazia**: o painel se monta **embaixo** da pessoa; no `de`, ela encolhe em 0,55 s revelando o painel, enquanto o cartão de tela cheia anterior some por cima. Na volta, ela cresce por cima do painel.
- **Painéis seguidos** (o `de` de um = o `ate` do outro, com folga de até 0,4 s): uma cortina vermelho-escura com a borda azul passa da direita para a esquerda.
- **Dois cartões de tela cheia seguidos**: o primeiro some inteiro antes de o segundo entrar.
- **Último momento**: fica até o último quadro.

Cuidados seus:
- Um `literal` com menos de ~3,5 s não dá tempo de ler as duas fichas. Entre dois `literal`, não deixe tela cheia com menos de ~1,8 s: emende-os.
- Não deixe a pessoa na moldura mais de ~15 s seguidos sem um bloco de tela cheia.

## 3. A assinatura: `literal`

```json
{ "tipo": "literal", "de": 2.7, "ate": 8.62, "legenda": true,
  "expressao": "chutar o balde", "expressaoEm": 2.72,
  "ao": { "texto": "kick the bucket", "em": 2.85, "imagem": { "id": "balde" } },
  "carimboEm": 3.73,
  "quer": [
    { "texto": "bater as botas", "em": 4.81, "detalhe": "morrer", "detalheEm": 5.66, "imagem": { "id": "botas" } },
    { "texto": "throw in the towel", "em": 6.92, "rotulo": "o certo em inglês", "detalhe": "jogar a toalha", "detalheEm": 8.07, "certo": true, "imagem": { "id": "toalha" } }
  ] }
```

- `expressao`: a expressão original, digitada letra por letra no alto (mono, 50 a 92 px, uma linha; até ~22 letras). `expressaoEm`: quando começa a digitar (padrão: `de` + 0,1).
- `ao`: a ficha da esquerda, "AO PÉ DA LETRA". `texto` (até ~28 caracteres, 2 linhas, em azul), `em` (quando é dito: a imagem e o texto entram aí), `imagem` (`{ id, foco?, efeito? }`), `detalhe` e `detalheEm` opcionais (uma linha menor embaixo, até ~28 caracteres).
- `carimboEm`: quando o carimbo NÃO bate na ficha da esquerda (padrão: `ao.em` + 0,95). Ponha no instante em que a pessoa descarta o literal ("só que…", "mas…", "não é"). A imagem de baixo perde cor.
- `quer`: a ficha da direita, "O QUE QUER DIZER". Um passo (a maioria) ou **dois ou três**: cada passo toma o lugar do anterior com um giro de carta, no seu `em`. Campos do passo: `texto`, `em`, `detalhe`, `detalheEm`, `imagem`, `rotulo` (troca o rótulo da ficha: "o certo em inglês", "na prática"…) e `certo: true` (moldura azul e traço desenhado embaixo, 0,9 s depois do `em`).
- Antes de a imagem entrar, a ficha mostra um quadro vazio com "?". Sem imagem (`imagem` omitido ou escolhida como 0), o quadro vira um cartão azul com o próprio texto.
- Legenda: ponha `"legenda": true` para a legenda bilíngue continuar (dentro da moldura).
- Duração natural: da primeira palavra da expressão até o fim do último passo, com 3,5 a 9 s.

## 4. Os 11 blocos universais

Campos comuns a todos: `tipo`, `de`, `ate` e `legenda` (opcional; `true` = a legenda continua durante o momento). Todo campo `em`/`…Em` é o instante de uma palavra dita.

Os textos são medidos com a fonte de verdade e reduzidos para caber. Os limites abaixo são para o texto ficar grande e legível; passou deles, encurte com as palavras da fala.

### `abertura` (tela cheia)
```json
{ "tipo": "abertura", "de": 0, "ate": 2.62, "em": 0.84, "texto": "Chutar o balde ao pé da letra", "destaque": "ao pé da letra" }
```
- `texto`: até ~70 caracteres (até 4 linhas), com as palavras na ordem da fala. `destaque`: trecho exato em azul-céu. `rotulo`: a linha lilás (padrão: `marca.area`). `em`: quando a primeira palavra do texto é dita (padrão: `de`).

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
- `texto` até ~30 caracteres (2 linhas). `nivel`: `chave` (traço azul-céu embaixo) ou `alerta` (texto azul-céu, rótulo "atenção"). `detalhe` até ~40. `imagem` opcional.

### `definicao` (tela cheia)
```json
{ "tipo": "definicao", "de": 17.6, "ate": 19.2, "termo": "schwa", "em": 17.69, "significado": "a vogal fraca do inglês, quase um murmúrio", "significadoEm": 18.04 }
```
- `termo` até ~20 caracteres; `significado` até ~90 caracteres (3 linhas), escrito na fala. `imagem` opcional.

### `frase` (tela cheia)
- `texto` até ~90 caracteres (4 linhas), `destaque` (azul-céu), `risco` + `riscoEm` (riscado), `em`.

### `pergunta` (tela cheia)
- `texto` até ~60 caracteres; `opcoes`: 2 a 4 pílulas, até ~16 caracteres cada, cada uma no seu `em`; `em`.

### `cta` (tela cheia): fechamento
```json
{ "tipo": "cta", "de": 19.28, "ate": 21.12, "texto": "Salva e treina hoje.", "icone": "salvar", "em": 19.33, "destaque": "treina hoje." }
```
- `texto` até ~50 caracteres; `icone`: `salvar`, `seguir`, `comentar` ou `link`; `destaque`; `em`. A assinatura (nome · área) entra embaixo.

## 5. Regras de tempo

- Cada momento começa um pouco antes da primeira palavra dele (0,05 a 0,2 s) e termina onde o seguinte começa. Cobertura de 100% é o normal neste modelo.
- Todo `em` é o começo de uma palavra dita (o `em` dela em `work/palavras.json`; a transcrição pode errar um ou dois décimos em palavra estrangeira, tudo bem).
- No `literal`: `expressaoEm` ≤ `ao.em` < `carimboEm` < `quer[0].em` < `quer[1].em` é a ordem natural, mas siga a ordem da fala.
- Depois de mudar um corte, rode `cortar.mjs --manter-plano` e confira os tempos.

## 6. Legenda bilíngue, correções e textos fixos

- A legenda (faixa de tinta, a palavra dita acesa e as que vêm esmaecidas) aparece nos trechos sem momento ou com `legenda: true`. **O português fica em creme; os trechos de `idioma2` ficam em azul-céu e mais grossos.** Nos painéis, ela desce para dentro da moldura, abaixo do queixo. Linhas nunca juntam duas frases: o motor quebra em pontuação e pausa; use `correcoes` para pôr o ponto que faltou.
- `correcoes`: troca palavras da transcrição na legenda e na montagem dos títulos (`"Embarrassem-se": "Embarrass yourself"`). Uma correção com pontuação própria vale no lugar da original. `""` apaga.
- `semLegenda`: trechos sem legenda (`[{ "de": 3, "ate": 5 }]`).
- `rotulos`: os textos fixos da tela, para um vídeo em outro idioma ou outro tom. Chaves e padrões: `expressoes` "expressões", `ao` "ao pé da letra", `querDizer` "o que quer dizer", `certoEm` "o certo em inglês", `nao` "NÃO", `quer` "quer dizer", `guarde` "guarde isto", `atencao` "atenção", `numero` "em número", `numeros` "em números", `voce` "e você?", `ilustrativo` "ilustrativo", `certo` "o certo", `compare` "compare", `naoEE` "não é · é". Exemplo em espanhol:
  ```json
  "rotulos": { "expressoes": "expresiones", "ao": "al pie de la letra", "querDizer": "lo que quiere decir", "certoEm": "lo correcto en inglés", "nao": "NO", "quer": "significa", "guarde": "recuerda", "atencao": "atención", "numero": "en número", "numeros": "en números", "voce": "¿y tú?", "certo": "lo correcto", "compare": "compara", "naoEE": "no es · es" }
  ```
  O papel `nao` aceita até ~5 letras (o carimbo é grande).

## 7. Sons

O template põe sozinho: uma batida grave e curta quando o carimbo cai, duas notas quando o certo se desenha, uma nota curta em cada item de lista e no número, e um acorde suave no fechamento. Todos bem abaixo da voz. `"sfx": false` desliga.

## 8. Exemplo completo

"Se você traduzir 'chutar o balde' ao pé da letra, vira kick the bucket. Só que em inglês isso é bater as botas, morrer. O certo é throw in the towel: jogar a toalha. E 'pagar mico' não é pay the monkey. É embarrass yourself. Ao pé da letra, o inglês fica engraçado. Comenta uma expressão pra eu traduzir."

`abertura` (0–2,6) → `literal` chutar o balde (2,7–8,6; dois passos em `quer`) → `literal` pagar mico (8,7–12,4; entra por cortina) → `frase` (12,5–14,4) → `cta` (14,6–16,9). Veja `src/plano.json` do template.
