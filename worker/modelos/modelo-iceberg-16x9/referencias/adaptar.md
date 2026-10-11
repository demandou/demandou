# Como aplicar este modelo a QUALQUER vídeo

**Este modelo é um estilo, não um assunto.** O vídeo de exemplo foi gravado sobre um tema só para mostrar o estilo. O vídeo do usuário pode falar de qualquer coisa: cripto, saúde, receita, vendas, uma história pessoal, uma opinião. O seu trabalho é **traduzir a fala dele para a linguagem visual deste modelo**:
- o jeito de animar;
- a organização e a hierarquia da informação;
- as fontes e as cores;
- o jeito como a moldura da pessoa se move.

A pergunta nunca é "este vídeo combina com o modelo?". A pergunta é "como este modelo mostra esta ideia?".

## No vídeo completo (16:9): a aula 9 do curso

O vídeo deitado é longo e é uma aula, não um anúncio. A tela cheia é a base: a pessoa fala, com legenda, e o mundo do iceberg abre **só quando acrescenta clareza** (uma escada do mais conhecido ao mais obscuro, uma lista, um número, uma comparação, uma pergunta para quem assiste) e fecha quando a ideia termina: a pessoa vai para a janela da direita, o conteúdo entra no quadro da esquerda e, no fim do momento, ela volta à tela cheia. Dê tempo de leitura (momento de 2 s ou mais), não encha os espaços com texto sem função e preserve a fala real: tudo o que entra na tela é dito, nada é inventado. A régua abaixo vale com os limites deste modelo (`modelo.json`): 50% ou mais de cobertura e respiros de até ~8 s.

## A regra que não se quebra

Nunca entregue um vídeo com só legenda, abertura e fechamento. A tela muda a cada 1,5 a 2,5 segundos com algo ligado ao que está sendo dito: um item que entra, um número que conta, um desenho que se completa, uma troca de layout.

O `render.mjs` roda `node scripts/conferir.mjs` antes de renderizar e **recusa** o plano quando:
- menos de ~50% do vídeo tem momento na tela (no vertical, 70%);
- há um trecho de mais de ~8 s só com a pessoa e a legenda (no vertical, 3,5 s);
- há poucos momentos, ou poucos tipos diferentes de momento;
- um momento fica parado tempo demais;
- a assinatura do modelo não aparece.

Quando ele reprovar, ele diz o trecho falado que ficou vazio. Escolha um bloco para esse trecho e rode de novo. **Não use `--forcar` para fugir da conferência.**

## Passo 0: estude o exemplo do modelo (2 minutos, antes do mapa)

A skill traz o exemplo do modelo em `references/exemplo/`:
- **`quadros.jpg`:** um quadro de cada momento do exemplo, com o nome do bloco e a fala embaixo. **Abra e olhe.** É a forma mais precisa de entender o estilo: como o texto aparece, o tamanho de cada coisa, a cor de ênfase. A folha é a do Iceberg vertical: o estilo é o mesmo; no quadro deitado, o conteúdo fica no quadro da esquerda e a pessoa na janela larga da direita (ou em tela cheia nos respiros).
- **`plano-comentado.md`:** cada momento do exemplo com a fala e o JSON exato que gerou o efeito. Mostra como uma frase vira um bloco e como o texto da tela é encurtado.
- **`exemplo.mp4`:** o vídeo inteiro. Se precisar ver um instante entre dois momentos, extraia o quadro com ffmpeg.

O exemplo é de outro assunto: copie o **estilo** (quais blocos, em que ordem, o ritmo, a hierarquia), nunca o assunto. A conferência exige pelo menos 2 efeitos próprios do modelo, além da assinatura e dos blocos universais. Os efeitos marcados como "próprio" e "ASSINATURA" na folha são os que dão a cara do modelo: procure na fala do usuário onde cada um cabe.

## Passo A: o mapa editorial (antes de escrever o plano)

1. Leia a fala inteira em `work/palavras.json`, depois do corte. Divida em **batidas**: cada ideia, normalmente uma frase ou meia frase, de 2 a 5 s.

2. Dê a cada batida uma **forma de informação**:

| Na fala | Forma | Bloco universal (existe em todos os modelos) |
|---|---|---|
| promessa, pergunta inicial, tema do vídeo | abertura | `abertura` |
| enumeração: "três erros", "primeiro… depois…", itens separados por vírgula | lista | `topicos` |
| sequência, processo, caminho, etapas no tempo, "como fazer" | passos | `passos` |
| número, preço, porcentagem, data, quantidade, tempo | número | `numero` |
| dois lados: A x B, antes x depois, errado x certo, mito x verdade, quem ganha x quem perde | comparação | `comparacao` |
| algo que sobe, cai, cresce, a maioria contra poucos, proporção, evolução | gráfico | `grafico` |
| alerta, risco, erro, palavra-chave forte | destaque | `destaque` |
| termo técnico explicado ("bull market, um ciclo de alta") | definição | `definicao` |
| frase de efeito, opinião forte, conclusão | frase | `frase` |
| pergunta feita para quem assiste | pergunta | `pergunta` |
| chamada final: salvar, seguir, comentar, link, "toca em saiba mais" | fechamento | `cta` |

   **Uma frase pode ter mais de uma forma.** "Tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende" é um `destaque` ("tem gente que perde") seguido de `topicos` (os três motivos). Prefira a forma mais rica: três motivos ditos em sequência são `topicos`, não três `frase`.

3. Escolha, para cada batida, o **bloco deste modelo**. A tabela "Blocos deste modelo" no SKILL.md diz como cada forma aparece neste estilo.
   - **Use a assinatura do modelo** (o bloco que dá a cara dele) **pelo menos uma vez**, mesmo que o assunto seja outro. A seção "A assinatura em qualquer assunto" do SKILL.md mostra como.
   - A assinatura costuma servir como metáfora. Exemplo: um funil serve para qualquer "muitos começam, poucos chegam".

4. Escreva o mapa em `work/mapa.md`, uma linha por batida: tempo, trecho falado, forma, bloco escolhido e o que aparece na tela. Esse mapa vai, resumido, na sua resposta final.

## Passo B: do mapa para o plano

- **Tempo.**
  - Cada momento começa na primeira palavra da batida e vai até a batida seguinte; momentos vizinhos podem encostar.
  - Dentro do momento, cada item entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`. Nada aparece antes de ser dito.
- **Texto de tela.**
  - Curto e com as palavras da própria fala: título até ~40 caracteres, item de 2 a 6 palavras.
  - Uma ideia grande por vez. O resto fica menor (hierarquia).
  - Pode resumir ("compra por impulso" → "Impulso"), mas não pode mudar o sentido.
- **Fidelidade.**
  - Não invente número, nome, preço, taxa nem fato.
  - Gráfico sem números ditos usa a forma qualitativa (`tendencia`) com `ilustrativo: true`.
  - Se um bloco pede um dado que a fala não tem, use outro bloco. Não preencha com chute.
- **Ritmo.**
  - Não repita o mesmo bloco três vezes seguidas.
  - Siga a gramática de layout do modelo: a pessoa muda de lugar nas fronteiras das batidas (tela cheia nos respiros, janela da direita nos momentos).
  - Momento com mais de ~4 s precisa de itens entrando por dentro dele.
- **Só pessoa e legenda:** no vídeo completo, de 1 a ~8 s, nos respiros entre ideias (a tela cheia é a base da aula). Vão de menos de ~1,6 s entre dois momentos não chega a ser respiro: a pessoa fica na janela.

## Passo C: conferir antes de renderizar

```bash
node scripts/conferir.mjs --mapa
```

Corrija até aparecer **APROVADO**. Depois rode `node scripts/stills.mjs --momentos` e olhe os quadros: o texto cabe? Nada cobre o rosto? A tela muda de verdade?

## Exemplo (vídeo sobre cripto num modelo de outro assunto)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta. Mas o mercado subindo não significa dinheiro no bolso para a maioria. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Como avaliar os projetos? Gravei uma aula gratuita explicando como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Toca em Saiba Mais."

| Batida | Forma | O que entra na tela |
|---|---|---|
| "Bitcoin rompeu os 83 mil dólares" | `numero` | US$ 83.000 contando, rótulo "Bitcoin" |
| "reacendeu… bull market, um ciclo de alta" | `definicao` | "Bull market" → "ciclo de alta" |
| "mercado subindo não significa dinheiro no bolso para a maioria" | `grafico` (tendência sobe, ilustrativo) ou `comparacao` | linha subindo × bolso vazio; ou "mercado sobe" × "seu saldo" |
| "tem gente que perde" | `destaque` (alerta) | "Tem gente que perde" |
| "compra por impulso, escolhe sem critério, assume risco que não entende" | `topicos` | Impulso · Sem critério · Risco sem entender, cada um na sua palavra |
| "como avaliar os projetos?" | `pergunta` | a pergunta se monta |
| "analiso o mercado, os riscos e a escolha dos ativos" | `passos` | Mercado → Riscos → Ativos |
| "sem promessa de lucro" | `frase` com risco | "promessa de lucro" riscada |
| "Toca em Saiba Mais" | `cta` (link) | o botão |

Num modelo de **funil**, a assinatura entra nos três motivos: "muitos entram na alta → compram por impulso → sem critério → poucos saem no lucro", sem números e marcado como ilustrativo.

Num modelo de **cozinha** (receita), os mesmos três motivos viram ingredientes que caem na panela ("receita do prejuízo").

## Onde o mapa costuma falhar

- **Tudo virou `frase`.** Procure listas, números e comparações escondidos na fala: quase todo vídeo tem.
- **Assinatura deixada de fora porque "o assunto é outro".** Ela é o estilo. Use-a como metáfora.
- **Texto longo demais no cartão.** Encurte com as palavras da fala.
- **Itens entrando todos juntos.** Cada um entra na própria palavra.
