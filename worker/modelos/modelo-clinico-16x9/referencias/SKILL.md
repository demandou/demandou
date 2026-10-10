---
name: modelo-clinico-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Clínico. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Clínico: um consultório limpo (branco, azul clínico, vermelho só no erro) em que a pessoa vira uma lupa, um círculo com aro azul na moldura da direita, e a fala vira um exame que se desenha na hora no quadro da esquerda: mostrador que gira em volta dela, prancha de atlas com rótulos (cérebro, corpo, coluna, dentes), achados com ✓ e ✗, conduta numerada, traçado em papel milimetrado. Serve para qualquer assunto (o exemplo é de dentista, mas funciona com cripto, finanças, esporte, vendas, carreira, relacionamento, aulas): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Clínico\", \"estilo lupa\", \"estilo consultório\" ou \"com desenho de atlas\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação à esquerda)."
---

# Modelo Clínico (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Clínico no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: a mesma fonte, as mesmas cores, a lupa com aro azul, a névoa branca, o "a lápis", os mesmos blocos, sons e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada, com legenda no terço de baixo. A lupa abre **só quando o bloco acrescenta clareza** à fala e volta para a tela cheia quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Nos momentos de lupa, a pessoa fica num círculo na coluna da direita (centro perto de 74% da largura), com o rosto centralizado nele e acompanhado com ajuste suave, sem saltos; o exame (cabeçalho e corpo) ocupa o lado esquerdo. A lupa não troca de lado: ela muda de **tamanho e altura** a cada momento (grande no meio, com o mostrador, pequena no alto, média), e a viagem entre os lugares continua visível.
- **Tela cheia com texto:** a base do quadro, abaixo do queixo, vira uma **faixa larga de névoa branca** (de y ~640 a ~980) e o texto entra ali, em fileiras e colunas, não numa pilha alta: a pergunta à esquerda e as opções à direita; a chamada à esquerda e os botões com a assinatura à direita; a conduta com o título ao lado das linhas.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais; nada importante abaixo de y 984 (controles do player).

O vídeo do Clínico é um exame feito ao vivo. A pessoa abre em tela cheia, com a frase se escrevendo na faixa de névoa da base do quadro; quando ela começa a explicar, o quadro fecha num círculo em volta do rosto e encolhe até a moldura da direita, onde vira uma **lupa** com aro azul. Ao lado dela, o que é dito aparece como num consultório: um mostrador que mede, um desenho de atlas com rótulos, uma lista de achados, uma conduta numerada. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com saúde bucal, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo entra no instante em que é dito: palavras sobem de trás de uma régua, itens ganham ponto e linha-guia, anéis se traçam, o ponteiro corre, números contam com freio, desenhos se traçam e agem (uma região acende, a coluna entorta). Antes de ser dito, o lugar de cada coisa aparece **a lápis** (traço cinza). Entra decidido e assenta, sem quique. As trocas cruzam: o quadro fecha num círculo em volta do rosto e encolhe até a moldura da direita, revelando a página nova; de uma lupa para outra, o conteúdo antigo sai quando ela começa a viajar e o novo entra por baixo dela; de volta, o círculo cresce por cima e abre para a tela cheia.
- **Organização e hierarquia:** a pessoa (a lupa) fica na moldura da direita; o exame se organiza no quadro da esquerda: um cabeçalho (número num anel "01", "02"… e o título) e o corpo do exame (desenho, mostrador, lista, traçado). Na lupa pequena do alto (`canto`), o título fica embaixo dela e o corpo usa o quadro inteiro. Uma coisa grande por vez; rótulos, detalhes e a etiqueta "ilustrativo" menores. Erro com ✗ vermelho, acerto com ✓ azul.
- **Tipografia:** uma família só, Figtree (sem condensada): 800 na tela cheia, números e termos; 700 nos títulos da lupa, itens e rótulos; 600 na legenda. Tela cheia de 56 a 112 px, títulos da lupa de 60 a 88 px, itens de 44 a 76 px, rótulos de atlas ≥ 34 px. Todo texto é medido e reduzido para caber, em linhas equilibradas; nunca vaza.
- **Moldura da pessoa:** tela cheia como foi gravada (texto na faixa de névoa abaixo do queixo) ou a lupa na moldura da direita: um círculo de 364 a 620 px com aro azul fino, cabeça inteira, que segue o rosto quando a pessoa se mexe. Atrás dela, anéis finos e um anel graduado que gira devagar. Nada de recortar a pessoa do fundo, nada de brilho atrás dela.
- **Cores, textura e som:** fundo branco frio, tinta azul quase preta, **azul clínico** para traços, números e o que está certo, **vermelho só para o erro**. Papel milimetrado azul-claro nos traçados, traço de atlas com pontas arredondadas. Som raro e tonal: uma nota grave quando a lupa chega a um lugar novo, duas notas descendo no ✗, duas subindo no ✓, um acorde no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Dra. Ana Ribeiro" / "Fisioterapeuta", "Carla" / "Educação financeira"): vão na assinatura do fechamento, como num prontuário. Sem resposta, siga sem assinatura.

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela.

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que a transcrição perdeu (um "Um:" curto, por exemplo): eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; perto de −20 dB é fala e fica.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, fique com a última e diga na entrega qual ficou e por quê.

É uma aula (aula 9): corte as pausas excessivas e os erros, mas mantenha as respirações naturais e o tempo de entender. O `cortar.mjs` deste modelo só junta pausas menores que ~0,45 s.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.49 --rosto-y 0.38 --queixo-y 0.56
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O formato já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para a lupa e para a faixa de névoa (a `zona` começa 60 px abaixo do queixo). Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). No fim, ele segue o rosto pelo vídeo: a lupa acompanha quando a pessoa se mexe. Leia os avisos que ele imprime. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul cai no rosto (só em tela cheia); a caixa azul tracejada é a faixa onde o texto entra em tela cheia (abaixo do queixo, na névoa branca); o contorno verde é a pessoa (em tela cheia, o quadro todo; na lupa, o círculo da direita); a caixa laranja é o cabeçalho; a lilás, o corpo do exame; a amarela, a legenda, acima da linha vermelha (controles do player). Se a cruz não cair no rosto, refaça o passo 4 com medidas corrigidas.

Na lupa, o rosto ocupa uns 43% do círculo (o zoom sai do tamanho do rosto medido no passo 4; no 16:9 o rosto gravado é estreito e o zoom fica perto de 1,9). Se a cabeça sair cortada ou pequena demais, ajuste `"lupa": { "zoom": …, "ancoraY": … }` no plano (veja `references/plano.md`) e confira com `node scripts/stills.mjs --guias 5 10`.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: uma linha por batida (2 a 5 s, uma ideia), com o tempo, o trecho falado, a forma (lista, número, comparação, tendência…), o bloco **deste modelo** (tabela abaixo), o lugar da lupa e o que aparece na tela. A assinatura (`cronometro` ou `anatomia`) entra **pelo menos uma vez**, como metáfora se o assunto for outro (veja "A assinatura em qualquer assunto").

Pense também na **viagem da lupa**: a tela cheia é a base; cada momento de lupa num tamanho e altura diferente do anterior (alto e pequeno, médio, grande, com mostrador), tela cheia no começo e no fim, e nenhum trecho de tela cheia com menos de ~1,8 s entre dois momentos de lupa. No vídeo completo, entre um bloco e outro, deixe a pessoa falar em tela cheia com a legenda (um respiro de 1 a ~8 s).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, ação, rótulo e selo tem seu `em`, tirado de `work/palavras.json`. Tudo o que aparece na tela vem da fala.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda (as que aparecem fora dos momentos) e marca palavra sozinha; corrija o que der.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira: o texto cabe e está inteiro? A informação está organizada, com uma coisa grande por vez? Algo entra a cada 1,5 a 2,5 s? A lupa fica na moldura da direita, não cobre texto e mostra a cabeça inteira, com o rosto no centro? O rótulo aponta a parte certa e não entra na lupa? O ✗/✓ bate com a fala? Nada abaixo de y 984 (controles do player)? Para ver um instante específico (o meio de uma troca): `node scripts/stills.mjs 12.7 18.4`. Corrija e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-clinico.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e onde estava a lupa);
- o que é **ilustrativo** (mostrador ou curva sem números) e as metáforas usadas (por exemplo, o cérebro para "impulso" e "critério");
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma versão escolhida no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo (quadro deitado) |
|---|---|---|
| abertura | `abertura` | Tela cheia. A frase sobe palavra por palavra na faixa de névoa abaixo do queixo, grande, em até 3 linhas largas; o `destaque` em azul. |
| lista | `topicos` | Lupa pequena no alto, à direita, com o título embaixo dela. Linhas de atlas no quadro da esquerda: uma haste azul desce e cada achado ganha ponto e linha-guia com cotovelo na palavra dele; ✗/✓ opcionais. Sem título, um contador "2/3" embaixo da lupa. |
| passos | `passos` | Lupa média à direita. A conduta no quadro da esquerda: anéis numerados ligados por um traço que avança; o passo atual fica cheio de azul. |
| número | `numero` | Lupa com o mostrador à direita: ele se monta em volta dela e o anel enche enquanto o número conta (porcentagem enche até o valor); o número grande e o rótulo no quadro da esquerda. |
| comparação | `comparacao` | Lupa grande à direita. Duas colunas de exame com selos no quadro da esquerda; no veredito, ✓ azul e sublinhado para um lado, ✗ vermelho para o outro. |
| gráfico | `grafico` | Lupa pequena no alto, à direita. Traçado azul em papel milimetrado no quadro inteiro da esquerda (linha, barras, pizza em anel com a legenda ao lado). Sem números: a curva da tendência com uma lupa de detalhe no fim e a etiqueta "ilustrativo". |
| destaque | `destaque` | Tela cheia. Selo do exame (✗ vermelho no alerta, anel azul na palavra-chave) e a frase grande sublinhada, na faixa de névoa. |
| definição | `definicao` | Lupa grande à direita. Verbete de atlas no quadro da esquerda: o termo sublinhado, um ponto e a linha-guia descendo até o significado em azul. |
| frase | `frase` | Tela cheia. Anotação na faixa de névoa; o trecho negado riscado em vermelho, palavra por palavra. |
| pergunta | `pergunta` | Tela cheia. Ficha de consulta na faixa de névoa: anel com "?" e a pergunta à esquerda, as opções com o círculo de marcar à direita. |
| fechamento | `cta` | Tela cheia. A chamada à esquerda; o botão de traço (salvar, seguir, comentar, link) e a assinatura de prontuário à direita. |
| **assinatura** | `cronometro` | Lupa com o mostrador à direita. O aro vira um mostrador que mede tempo, nível ou qualquer meta: o ponteiro corre e trava em vermelho antes da meta, ou fecha a volta em azul. O título e o veredito no quadro da esquerda. |
| **assinatura** | `anatomia` | Lupa pequena no alto (ou média), à direita. Prancha de atlas (cérebro, corpo, coluna, dentes) no quadro da esquerda, que se traça; regiões acendem na fala, rótulos com linha-guia, lupa de detalhe e veredito ✓/✗. |
| contagem | `contagem` | Lupa grande à direita. Pequenas lupas numeradas que se fecham na contagem ("três coisas"), no quadro da esquerda. |
| conduta | `checklist` | Tela cheia (ou lupa). "O certo": o título ao lado das linhas, cada linha com ícone que se mexe e ✓. |
| abertura em linhas | `titulo` | Tela cheia, as linhas escolhidas à mão (ou reorganizadas em 2 linhas largas) e o par ✓ / ✗ da dúvida ao lado. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa (`tendencia` no gráfico, meta em palavras no mostrador).

## A assinatura em qualquer assunto

A assinatura do Clínico é **"examinar a ideia"**: a lupa vai para a moldura e a fala vira um instrumento que mede (o mostrador: algo que chega ou não chega a uma meta) ou uma prancha de atlas (o que está acontecendo por dentro: na cabeça, no corpo, na base). As pranchas funcionam como metáfora: o **cérebro** serve para decisão, impulso, emoção, hábito e foco; o **corpo**, para esforço, ação e onde algo pesa; a **coluna**, para a base que entorta e se alinha.

1. **Finanças / cripto.** "Mas o mercado subindo não significa dinheiro no bolso… tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   - `cronometro`: título "Mercado subindo", `meta` "No bolso", o ponteiro corre em "mercado" e trava em "não" (`para`), `ilustrativo: true`, veredito ✗ "Não significa dinheiro".
   - `anatomia` com `desenho: "cerebro"`: "Mesmo na alta, tem gente que perde"; a amígdala acende em vermelho em "impulso" (rótulo "Impulso"), o frontal em "critério" ("Sem critério"), o temporal em "risco" ("Risco que não entende").
2. **Esporte.** "Antes de a bola chegar, olha onde está o goleiro… rasteiro, que bola baixa é mais difícil de defender."
   - `cronometro`: "Antes de a bola chegar, olha o goleiro", `meta` "Bola chega", o ponteiro corre do "Antes" e fecha a volta (✓), `ilustrativo: true`.
   - `anatomia` com `desenho: "corpo"` (o goleiro): "Rasteiro"; os pés acendem em azul (`acende`, alvo `pe`) com o rótulo "Bola baixa" e o veredito ✓ "Mais difícil de defender".
3. **Relacionamento (bem distante).** "A maioria das brigas começa no cansaço, não no assunto. Espera vinte minutos antes de responder."
   - `anatomia` com `desenho: "cerebro"`: "A maioria das brigas começa no cansaço"; a amígdala acende em vermelho em "cansaço" (rótulo "Cansaço") e o frontal ganha o rótulo "Não no assunto".
   - `cronometro`: "Espera 20 minutos", `meta` "20 min", sem `para`: o ponteiro fecha a volta em azul e ganha ✓.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Impulso"), sem mudar o sentido.
- Não invente número, nome, preço, prazo, porcentagem, diagnóstico nem recomendação que a pessoa não disse.
- Sem número dito, use as formas ilustrativas (`tendencia`, meta em palavras com `ilustrativo: true`); a etiqueta "ilustrativo" aparece sozinha.
- Os desenhos são esquemáticos e, fora da saúde, metáforas; diga isso na entrega. Em vídeos de saúde: nada de promessa de resultado nem de diagnóstico.
- Se a fala final revelar que a edição foi feita pela IA, preserve esse momento sem antecipá-lo; se isso não estiver gravado, não crie a afirmação (aula 9).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`. Faltou a assinatura: use o `cronometro` (qualquer meta, tempo ou evento) ou o `anatomia` como metáfora.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano` (os momentos, a marca e as correções continuam).
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Rosto cortado ou pequeno na lupa**: ajuste `lupa.zoom` (e, se precisar, `lupa.ancoraY`) no plano.
- **Rótulo fora do lugar ou em cima de outro**: confira o `alvo` (lista em `references/plano.md`) e use alvos de lados diferentes; o nome vira sozinho para o outro lado, quebra em duas linhas quando não cabe e nunca entra na lupa da direita nem desce até o veredito.
- **Texto pequeno demais**: o bloco reduz o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala.
- **Gravação vertical**: este modelo entrega 16:9, e a gravação em pé vira uma faixa deitada muito aproximada em volta do rosto. Para vídeo em pé, use o modelo vertical.
