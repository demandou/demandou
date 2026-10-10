# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `oval`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou terminado em `Em` é o instante de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática da prancha (onde fica a pessoa)
3. Os 11 blocos universais
4. A assinatura: `figura` (vaso, janela, terra), ações e etiquetas
5. Os outros tipos próprios: `capa` e `nota`
6. Limites de texto (o que cabe)
7. Regras de tempo
8. Legenda, correções e sons
9. Exemplos completos

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "sfx": true,
  "correcoes": { "para mais": "pra mais" }
}
```

- `marca`: `nome` e `area` aparecem embaixo do oval no frontispício ("TIAGO LEMOS · CRIPTO"), no cabeçalho corrido da prancha ("Herbário de Tiago Lemos") e no pé do cartão do fechamento ("leg. Tiago Lemos · Cripto"; *leg.* é como as etiquetas de herbário marcam quem coletou). Juntos, até ~28 caracteres. `nome` vazio = sem assinatura (o cabeçalho corrido fica só "Herbário").
- `oval` (opcional): ajuste do enquadramento dentro do oval, para todos os ovais. `{ "zoom": 1.15 }` aproxima, `0.85` afasta; `"ancoraY"` é a altura do rosto dentro do oval (0 = topo, 1 = base; padrão 0,40 no oval grande e 0,46 nos pequenos). Em gravação muito perto da câmera o template já afasta sozinho (pelo tamanho do rosto medido no rastreio); só mexa se os quadros mostrarem a cabeça cortada ou o rosto pequeno.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão.

## 2. A gramática da prancha (onde fica a pessoa)

O próprio tipo do momento decide o lugar da pessoa. Você não escreve layout.

| Lugar | Blocos | A pessoa | A tela |
|---|---|---|---|
| **Frontispício** | `abertura`, `capa` | oval grande no alto (620×800 px) | assinatura embaixo do oval, título grande, medalhões, espécime no pé |
| **Prancha** | `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `definicao`, `figura` | oval pequeno num canto de cima (392×500 à direita, ou 428×542 à esquerda) | cabeçalho do outro lado do oval (rótulo, fio, título); o desenho no corpo, de 700 px até 1530 px |
| **Tela cheia** | `destaque`, `frase`, `pergunta`, `cta`, `nota` e os trechos sem momento (1,2 s ou mais) | o oval se abre em tela cheia, rosto no centro, aproximação lenta | cartão de herbário (ou a etiqueta de campo, no `destaque`) na altura do peito, logo abaixo do queixo |

O que o template faz sozinho:

- **A câmera corre pelo papel**: cada frontispício e cada prancha ficam ao lado da anterior; na troca (0,72 s), a prancha que sai leva tudo o que tem e a que chega já vem com o desenho e o texto **a lápis** (cinza), legíveis. O oval viaja junto e o cabeçalho novo só aparece quando ele assentou. Nunca há quadro vazio nem dois textos um sobre o outro.
- **O oval troca de lado**: os blocos universais de prancha alternam o oval entre o canto direito e o esquerdo; a `figura` de vaso ou janela usa o direito, o detalhe da terra o esquerdo.
- **De tela cheia para prancha**: a câmera chega escondida atrás do vídeo e a prancha nova aparece em volta do oval que encolhe (a prancha velha não volta).
- **De prancha para tela cheia**: o oval cresce até cobrir a tela (a elipse primeiro, os cantos no fim) e só então o cartão sobe.
- **Mergulho**: uma `figura` com `vista: "terra"` logo depois de uma `figura` de vaso (encostadas) não corre: a câmera mergulha no mesmo vaso.
- **A troca cai no corte**: se há um corte (`cortesEm`) entre 0,3 s antes e 0,15 s depois da fronteira, a troca começa 0,14 s antes dele.
- **Último momento**: fica até o último quadro.

## 3. Os 11 blocos universais

Campos comuns: `tipo`, `de`, `ate` e `legenda?` (não use `legenda: true` neste modelo; a prancha e o cartão ocupam o lugar dela). Os blocos de prancha aceitam também `rotulo` (o versalete do cabeçalho; padrão "FIG. N"). **Dê sempre um `titulo` aos blocos de prancha**: é o texto grande ao lado do oval. Sem `titulo`, o `rotulo` vira o título; sem os dois, o cabeçalho mostra só os medalhões.

### `abertura` — frontispício

```json
{ "tipo": "abertura", "de": 28.03, "ate": 30.09, "texto": "Uma aula gratuita para te explicar", "destaque": "aula gratuita", "em": 28.46, "indice": 3 }
```
- `texto`: palavras da fala; quebra sozinho em até 3 linhas (124 px, encolhe até 76 px). Até ~45 caracteres.
- `destaque` (opcional): trecho exato do texto em itálico verde-musgo, com aguada por trás.
- `em` (opcional): quando o texto começa a ser dito (padrão `de`). Use quando o momento começa antes da primeira palavra do texto ("Eu gravei uma aula…" com texto "Uma aula…").
- `indice` (opcional, deste modelo): quantos medalhões I, II, III… se desenham embaixo do título (até 5). Use quando a pessoa anuncia quantos itens vêm.
- No pé da página, um raminho prensado a lápis ganha tinta na última palavra do título.
- Serve para o início do vídeo ou para abrir uma parte nova (o anúncio de uma aula, de um método).

### `topicos` — lista sem ordem (2 a 5 itens)

```json
{ "tipo": "topicos", "de": 16.8, "ate": 23.6, "titulo": "Por que perdem",
  "itens": [ { "texto": "Compra por impulso", "em": 17.73 }, { "texto": "Moeda sem critério", "em": 19.21, "detalhe": "sem olhar o projeto" }, { "texto": "Risco que não entende", "em": 21.75 } ] }
```
- Um ramo prensado desce pela prancha; cada item é uma folha com o número no nó, a linha-guia e a etiqueta de espécime. Antes do `em`, folha e etiqueta estão a lápis; no `em`, ganham tinta; o item da vez fica com o número cheio de verde-musgo.
- `texto`: 2 a 6 palavras (56 px, encolhe e quebra em 2 linhas). `detalhe` (opcional): uma linha menor embaixo, em verde-musgo.

### `passos` — sequência em ordem (2 a 5 itens)

```json
{ "tipo": "passos", "de": 30.09, "ate": 33.83, "titulo": "Como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] }
```
- Estágios de crescimento (2 passos: semente → flor; 3: semente → muda → flor; 4 e 5: semente, broto, muda, planta, flor), com o medalhão romano e o texto (78 px, encolhe até 44, 2 linhas). Uma seta tracejada liga um estágio ao próximo e se desenha quando o próximo é dito.
- `detalhe` (opcional): uma linha em itálico verde-musgo embaixo do texto.

### `numero` — número que conta

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```
- `rotulo`: vira o título da prancha (palavras da fala, até ~30 caracteres); `rotuloEm` = quando ele é dito.
- `valor`: o número dito (conta a partir do `em`, até 1,5 s, terminando antes de a prancha sair). Formato brasileiro: 83.000; 1,5; casas com `casas`.
- `prefixo` ("R$", "US$") fica em cima do número; `sufixo` curto ("%", "mil", "kg", até 4 letras) fica ao lado; sufixo longo ("pessoas por dia") vai embaixo, em itálico.
- `ilustrativo: true` mostra a etiqueta ILUSTRATIVO (só para número que não foi dito exatamente).
- Ao lado, um raminho cresce junto com a contagem e uma cota com setas mede a altura dele.

### `comparacao` — dois lados

```json
{ "tipo": "comparacao", "de": 8.67, "ate": 12.85, "titulo": "Mercado × bolso", "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ],
  "vencedor": 0, "vencedorEm": 11.99 }
```
- Fig. A à esquerda, Fig. B à direita, separadas por um fio de pena com um medalhão (× em `contra`, → nos outros).
- `modo`: `contra` (padrão; duas folhas diferentes), `antes-depois` (broto → planta crescida), `errado-certo` (o A é um ramo murcho com selo ✗ e texto em garança; o B, viçoso com ✓). No errado-certo, o lado errado é sempre o A.
- `rotulo` de cada lado: 1 a 3 palavras em versalete (34 px). `texto`: até ~45 caracteres (76 px, encolhe até 46, 3 linhas).
- `vencedor` (opcional) + `vencedorEm`: o vencedor ganha o selo ✓ e o outro lado murcha e empalidece.

### `grafico`

Com números ditos (2 a 6 `dados`):
```json
{ "tipo": "grafico", "de": 5.0, "ate": 9.0, "titulo": "Vendas no ano", "forma": "barras", "unidade": "mil",
  "dados": [ { "rotulo": "2023", "valor": 40, "em": 5.6 }, { "rotulo": "2024", "valor": 65, "em": 6.8 }, { "rotulo": "2025", "valor": 120, "em": 8.1 } ] }
```
- `barras`: colunas de aquarela com hachura e contorno a pena, que crescem no `em`; o valor em cima, o rótulo embaixo (itálico, 2 linhas).
- `linha`: um caule que liga os pontos, com uma folha em cada ponto; o trecho até o ponto se desenha no `em` dele.
- `pizza`: fatias de aquarela com hachura e etiquetas numeradas ("rótulo · valor"); se os valores somam 100, aparece "%".
- `unidade` (opcional): "%", "R$", "mil", "kg"… aparece junto de cada valor.

Sem números ditos (forma qualitativa):
```json
{ "tipo": "grafico", "de": 8.67, "ate": 10.9, "titulo": "Mercado subindo", "forma": "linha", "tendencia": "sobe", "tendenciaEm": 9.31, "ilustrativo": true }
```
- Um caule com folhas atravessa a prancha: `sobe`, `cai` (as folhas empalidecem e uma cai no fim) ou `oscila`. A etiqueta ILUSTRATIVO aparece sozinha. `ilustrativo: true` é obrigatório.

### `destaque` — palavra que bate forte (tela cheia)

```json
{ "tipo": "destaque", "de": 12.85, "ate": 14.93, "texto": "Para a maioria", "em": 13.46, "nivel": "alerta", "detalhe": "das pessoas", "detalheEm": 14.25 }
```
- A etiqueta de campo presa por um barbante entra pela esquerda e assenta no peito.
- `texto`: até ~30 caracteres (124 px, encolhe até 72, 2 linhas). `nivel`: `alerta` (garança e selo ✗) ou `chave` (itálico verde-musgo com aguada); sem nível, tinta.
- `detalhe` + `detalheEm` (opcionais): uma linha menor em itálico embaixo.

### `definicao` — termo e significado

```json
{ "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```
- O `termo` é o título da prancha, em itálico verde-musgo (até ~25 caracteres); o rótulo padrão é "DEFINIÇÃO".
- O `significado` (até ~70 caracteres, 84 px, encolhe até 50, 4 linhas) se escreve na etiqueta de herbário no `significadoEm`, ligada ao raminho prensado por uma linha-guia.

### `frase` — frase de efeito (tela cheia)

```json
{ "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.03 }
```
- O cartão de herbário (rótulo padrão "NOTA"; mude com `rotulo`). `texto` até ~70 caracteres (92 px, encolhe e quebra em até 3 linhas).
- `destaque`: trecho em itálico verde-musgo com aguada. `risco` + `riscoEm`: o trecho é riscado à pena em garança, palavra por palavra.
- `em` (opcional): quando o texto começa a ser dito.

### `pergunta` (tela cheia)

```json
{ "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```
- O cartão com o "?" num medalhão (rótulo "PERGUNTA"). `opcoes`: 2 a 4, cada uma uma etiqueta (a, b, c, d) que ganha tinta no seu `em`; até ~40 caracteres cada.

### `cta` — fechamento (tela cheia)

```json
{ "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```
- O cartão com o ícone desenhado a pena no canto (`salvar`, `seguir`, `comentar` ou `link`), o texto (até ~60 caracteres) com o `destaque` em verde-musgo e "leg. nome · área" embaixo.
- Formato antigo (continua valendo): `linhas` (2 ou 3; a última vira o apoio em itálico) e `icones` (`[{ "em": 14.48, "icone": "salvar" }, …]`, cada um no seu tempo; `salvar` também prende o cartão com fitas de linho). Mesmo com `linhas`, escreva o `texto` (a conferência pede).

## 4. A assinatura: `figura`

A prancha com a planta desenhada em corte, que **age na fala**. É o que dá a cara do modelo: use pelo menos uma vez, como metáfora quando o assunto é outro (veja o SKILL.md).

```json
{ "tipo": "figura", "de": 14.93, "ate": 24.1, "vista": "vaso", "rotulo": "Mesmo na alta", "titulo": "Tem gente que perde", "destaque": "perde",
  "acoes": [ { "em": 15.48, "acao": "brotar" }, { "em": 17.73, "acao": "regar" }, { "em": 18.45, "acao": "encharcar" },
             { "em": 20.18, "acao": "semFuro" }, { "em": 21.75, "acao": "apodrecer" } ],
  "etiquetas": [ { "em": 18.3, "alvo": "agua", "texto": "Impulso", "erro": true },
                 { "em": 20.2, "alvo": "fundo", "texto": "Sem critério", "erro": true },
                 { "em": 21.8, "alvo": "raiz", "texto": "Risco que não entende", "erro": true } ] }
```

- `vista`: `"vaso"` (padrão — a planta inteira num vaso de barro em corte: folhas, terra, raízes, parede hachurada, fundo), `"janela"` (uma janela em arco com sol e luz à esquerda, a régua no piso e o vaso perto dela) ou `"terra"` (o detalhe ampliado da terra; logo depois de uma figura `vaso` encostada, a câmera mergulha nela).
- `titulo`: palavras da fala; uma frase (quebra sozinha em até 3 linhas, 112 px até 64) ou linhas já quebradas (`["Regar", "demais"]`).
- `rotulo` (opcional): o versalete acima do título (padrão "FIG. N"). `numero` (opcional): 1, 2, 3… acende o índice de medalhões (quantos = o maior `numero` do plano). `destaque`: trecho do título em itálico verde-musgo. `apoio` (opcional): uma frase curta em itálico embaixo do título.
- Uma figura precisa de pelo menos ~1,5 s; com 3 s ou mais, dê a ela duas ou três ações e etiquetas.

### Ações (cada uma no `em` da palavra que ela ilustra)

| Ação | Vista | O que aparece | Sentido para usar em qualquer assunto |
|---|---|---|---|
| `regar` | vaso | o regador entra, inclina e despeja | dar, investir, colocar, fazer algo |
| `encharcar` | vaso | a água sobe dentro do vaso | excesso, exagero, "demais" |
| `apodrecer` | vaso | as raízes escurecem das pontas para cima | o problema que não se vê, o risco escondido |
| `murchar` | todas | as folhas caem e perdem a cor | perder força, cansaço, queda |
| `amarelar` | todas | as folhas ficam pálidas | falta do essencial, desgaste |
| `brotar` | vaso | uma folha nova se abre no alto | crescimento, alta, resultado novo |
| `afastar` | janela | o vaso desliza para longe da luz (cota e escala de luz) | distância do que importa |
| `aproximar` | janela | o vaso volta para a luz e recupera a cor | voltar ao essencial, correção |
| `semFuro` | vaso | o fundo ganha um furo tracejado com ✗ | falta de filtro, de saída, de critério |
| `acumular` | vaso | a água junta no fundo | o que vai sendo empurrado, acúmulo |
| `furo` | vaso | o furo se abre e a água escorre | a solução, a válvula de escape |
| `dedo` | terra | um dedo entra na terra | conferir antes, testar, avaliar |
| `umida` / `seca` | terra | a terra em volta do dedo escurece / clareia | o resultado do teste |
| `esperar` | terra | o sol cruza um arco e uma plaquinha espeta na terra com o `texto` (até ~8 caracteres, padrão "+1 dia") | paciência, prazo |

Ações de outra vista são ignoradas. Não use uma ação cujo sentido a fala não tenha.

### Etiquetas de espécime (até 3 por figura)

`{ "em": 21.8, "alvo": "raiz", "texto": "Risco que não entende", "erro": true }`
- `alvo`: na vista `vaso`: `folha`, `caule`, `terra`, `raiz`, `agua`, `vaso`, `fundo`, `furo`, `regador` (o regador sai depois de despejar: prefira `agua`). Na `janela`: `janela`, `luz`, `regua`. Na `terra`: `dedo`, `umida`, `sol`, `terra`, `raiz`.
- `texto`: palavras da fala, até ~22 caracteres (46 px; mais longo quebra em 2 linhas). `erro: true` = garança. `lado` (opcional): `"esquerda"` ou `"direita"`.
- O template põe a etiqueta ao lado do desenho quando cabe, ou na linha de baixo do vaso (duas vagas, esquerda e direita). Com 3 etiquetas no vaso, o vaso fica um pouco menor e abre uma segunda linha. Ponha o `em` ~0,2 s antes da palavra principal.

## 5. Os outros tipos próprios

- **`capa`** (formato antigo do frontispício, continua valendo): `linhas` (até 3 já quebradas), `destaque`, `indice`, `ramoEm` (quando o espécime do pé ganha tinta). No pé, o vaso pequeno em vez do raminho.
- **`nota`**: o cartão de herbário para um aviso no meio do vídeo: `texto` (ou `linhas`), `rotulo` (padrão "NOTA"), `destaque`. Prefira `frase`, que também risca.

## 6. Limites de texto (o que cabe)

O template mede o texto com a largura real da fonte e encolhe até o mínimo legível; passou disso, quebra em mais linhas. Mesmo assim, texto curto fica melhor:

| Onde | Ideal | Corpo |
|---|---|---|
| título de prancha | até ~30 caracteres (2 linhas) | 112 → 64 px |
| título do frontispício | até ~45 caracteres (3 linhas) | 124 → 76 px |
| item de lista | 2 a 6 palavras | 62 → 40 px |
| passo | 2 a 6 palavras | 78 → 44 px |
| lado da comparação | até ~45 caracteres | 76 → 46 px |
| destaque | até ~30 caracteres | 124 → 72 px |
| frase, pergunta, cta | até ~60 caracteres | 92 → 60 px |
| etiqueta da figura | até ~22 caracteres | 46 → 38 px |
| rótulo (versalete) | 1 a 3 palavras | 34 px |

Em gravação muito perto da câmera, os cartões de tela cheia têm pouco espaço entre o queixo e a interface do app e o texto deles fica menor: encurte.

## 7. Regras de tempo

- **Momentos encostados**: o `ate` de um = o `de` do próximo, na pausa entre as duas frases (de preferência num valor de `cortesEm`).
- **Buraco de 1,2 s ou mais** entre momentos vira tela cheia com legenda; buraco menor é absorvido. A conferência reprova trecho de mais de ~3,5 s só com legenda.
- **Cada coisa no seu `em`**: o `em` é o início da palavra em `work/palavras.json`. Nada aparece antes de ser dito (a lápis pode: é o esboço).
- **Ritmo**: algo muda na tela a cada 1,5–2,5 s. Momento com mais de ~4 s precisa de itens, ações ou etiquetas entrando por dentro dele. Não repita o mesmo bloco três vezes seguidas.
- **Estrutura típica** (30–45 s): abertura ou número → 2 a 4 pranchas (uma delas a `figura`) intercaladas com 1 ou 2 cartões de tela cheia → `cta`.

## 8. Legenda, correções e sons

- **Legenda**: aparece só nos trechos sem momento (pessoa em tela cheia), numa tira de papel de etiqueta abaixo do queixo; as palavras estão em grafite e ganham tinta quando faladas. `semLegenda` tira a legenda de um trecho: `[{ "de": 1.2, "ate": 2.0 }]`.
- **Correções**: `{ "suculenta s": "suculentas" }` — uma ou mais palavras seguidas viram outra coisa na legenda; `""` apaga.
- **"pra" e "pro"**: pode escrever "pra"/"pro" nos textos: o template casa com "para". Algarismos ("3", "+1") casam com "três", "mais um".
- **Sons** (automáticos, raros e tonais, nunca dois a menos de 0,45 s): duas notas graves quando a câmera corre (a altura muda a cada prancha); uma descida grave no mergulho; uma nota curta de pena quando um item, passo, lado, dado ou opção ganha tinta; três notas subindo no número e na tendência que sobe; dois tons graves descendo na raiz podre e na tendência que cai; duas notas descendo no alerta, no risco da frase e no ✗; um toque grave na definição, na pergunta e no dedo; um acorde macio no fechamento. `"sfx": false` desliga.

## 9. Exemplos completos

### Cripto (43 s, vídeo de selfie): 11 momentos, 10 tipos

```json
{
  "marca": { "nome": "Tiago Lemos", "area": "Cripto" },
  "momentos": [
    { "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "prefixo": "US$", "em": 1.34, "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
    { "tipo": "definicao", "de": 2.89, "ate": 8.67, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
    { "tipo": "comparacao", "de": 8.67, "ate": 12.85, "titulo": "Mercado × bolso", "modo": "contra",
      "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ],
      "vencedor": 0, "vencedorEm": 11.99 },
    { "tipo": "destaque", "de": 12.85, "ate": 14.93, "texto": "Para a maioria", "em": 13.46, "nivel": "alerta", "detalhe": "das pessoas", "detalheEm": 14.25 },
    { "tipo": "figura", "de": 14.93, "ate": 24.1, "vista": "vaso", "rotulo": "Mesmo na alta", "titulo": "Tem gente que perde", "destaque": "perde",
      "acoes": [ { "em": 15.48, "acao": "brotar" }, { "em": 17.73, "acao": "regar" }, { "em": 18.45, "acao": "encharcar" },
                 { "em": 20.18, "acao": "semFuro" }, { "em": 21.75, "acao": "apodrecer" } ],
      "etiquetas": [ { "em": 18.3, "alvo": "agua", "texto": "Impulso", "erro": true },
                     { "em": 20.2, "alvo": "fundo", "texto": "Sem critério", "erro": true },
                     { "em": 21.8, "alvo": "raiz", "texto": "Risco que não entende", "erro": true } ] },
    { "tipo": "figura", "de": 24.1, "ate": 28.03, "vista": "terra", "rotulo": "Agora", "titulo": "Como avaliar os projetos?",
      "acoes": [ { "em": 24.95, "acao": "dedo" } ],
      "etiquetas": [ { "em": 26.89, "alvo": "terra", "texto": "Seu posicionamento" } ] },
    { "tipo": "abertura", "de": 28.03, "ate": 30.09, "texto": "Uma aula gratuita para te explicar", "destaque": "aula gratuita", "em": 28.46, "indice": 3 },
    { "tipo": "passos", "de": 30.09, "ate": 33.83, "titulo": "Como eu analiso",
      "itens": [ { "texto": "O mercado", "em": 30.86 }, { "texto": "Os riscos", "em": 31.47 }, { "texto": "A escolha dos ativos", "em": 32.21 } ] },
    { "tipo": "frase", "de": 33.83, "ate": 35.23, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.03 },
    { "tipo": "pergunta", "de": 35.23, "ate": 40.05, "texto": "Você quer…", "em": 35.23,
      "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
    { "tipo": "cta", "de": 40.05, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula agora", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
  ]
}
```

### Jardinagem (o demo, 17 s): a assinatura pura

"3 erros que matam a sua planta. Regar demais, que apodrece a raiz, deixar longe da luz e usar vaso sem furo, que acumula água no fundo. Antes de regar, enfia o dedo na terra. Se ainda estiver úmida, espera mais um dia. Salva e me segue pra mais dicas de plantas."

```json
{
  "marca": { "nome": "Tiago", "area": "Plantas" },
  "correcoes": { "para mais": "pra mais" },
  "momentos": [
    { "tipo": "capa", "de": 0, "ate": 2.27, "linhas": ["3 erros que", "matam a sua", "planta"], "destaque": "planta", "indice": 3 },
    { "tipo": "figura", "de": 2.27, "ate": 4.85, "vista": "vaso", "numero": 1, "rotulo": "Erro nº 1", "titulo": ["Regar", "demais"],
      "acoes": [ { "em": 2.39, "acao": "regar" }, { "em": 2.75, "acao": "encharcar" }, { "em": 3.6, "acao": "apodrecer" } ],
      "etiquetas": [ { "em": 3.62, "alvo": "raiz", "texto": "apodrece a raiz", "erro": true } ] },
    { "tipo": "figura", "de": 4.85, "ate": 6.4, "vista": "janela", "numero": 2, "rotulo": "Erro nº 2", "titulo": ["Longe", "da luz"],
      "acoes": [ { "em": 5.32, "acao": "afastar" }, { "em": 5.96, "acao": "amarelar" } ],
      "etiquetas": [ { "em": 5.84, "alvo": "regua", "texto": "longe" } ] },
    { "tipo": "figura", "de": 6.4, "ate": 9.32, "vista": "vaso", "numero": 3, "rotulo": "Erro nº 3", "titulo": ["Vaso", "sem furo"],
      "acoes": [ { "em": 7.1, "acao": "semFuro" }, { "em": 8.05, "acao": "acumular" }, { "em": 8.95, "acao": "furo" } ],
      "etiquetas": [ { "em": 7.12, "alvo": "furo", "texto": "sem furo", "erro": true }, { "em": 8.3, "alvo": "agua", "texto": "água no fundo", "erro": true } ] },
    { "tipo": "figura", "de": 9.32, "ate": 14.43, "vista": "terra", "rotulo": "Antes de regar", "titulo": ["Enfia o dedo", "na terra"],
      "acoes": [ { "em": 10.44, "acao": "dedo" }, { "em": 12.14, "acao": "umida" }, { "em": 13.42, "acao": "esperar", "texto": "+1 dia" } ],
      "etiquetas": [ { "em": 12.85, "alvo": "umida", "texto": "úmida" } ] },
    { "tipo": "cta", "de": 14.43, "ate": 16.96, "texto": "Salva e me segue pra mais dicas de plantas",
      "linhas": ["Salva e", "me segue", "pra mais dicas de plantas"],
      "icones": [ { "em": 14.48, "icone": "salvar" }, { "em": 14.77, "icone": "seguir" } ] }
  ]
}
```
