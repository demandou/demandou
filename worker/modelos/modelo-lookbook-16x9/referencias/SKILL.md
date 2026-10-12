---
name: modelo-lookbook
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Lookbook: uma revista folheada em papel areia, tinta preta e um só acento índigo, com serifa de revista. A pessoa vira a foto da página e muda de lugar a cada ideia (emoldurada na capa, de um lado com a coluna de papel do outro, retrato largo em cima ou embaixo, impressão girada na colagem), e a informação entra como peças de catálogo: numeral grande, cartão de produto, amostras de tecido, fita métrica, pino com linha fina, etiqueta de roupa. Serve para qualquer assunto (o exemplo do modelo é moda masculina, mas funciona com finanças, saúde, aulas, vendas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Lookbook\", \"estilo lookbook\", \"estilo revista\", \"estilo catálogo\" ou \"estilo editorial de moda\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Lookbook

O vídeo vira as páginas de uma revista de moda sendo folheada. A pessoa é a foto da página: abre emoldurada na capa, com a manchete em cima; a cada ideia, a página muda e ela vai para outro lugar (de um lado, com a coluna de papel do outro; num retrato largo em cima ou embaixo); a informação chega como peças de um catálogo: o numeral índigo grande, o cartão de produto, a amostra de tecido que se estende, a fita métrica do alfaiate, o pino com a linha fina. No fim, uma etiqueta de roupa pendurada fecha com a chamada. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em páginas, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com moda masculina (três peças apontadas no corpo), mas o vídeo do usuário pode ser sobre qualquer coisa: cripto, uma conta de cabeça, uma rotina de saúde, uma história. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** movimento editorial, decidido, que assenta (nada de quique). Tudo espera "a lápis" antes de ser dito: o título aparece apagado e cada palavra ganha tinta quando é falada; cartões chegam com o lugar do texto tracejado; amostras chegam tracejadas e o pano se estende da esquerda para a direita na palavra; o numeral sobe de trás de uma régua; números contam e um pino corre na fita métrica; linhas finas se desenham até o cartão. A cada momento a página vira: a foto da pessoa desliza para o novo lugar em 0,6 s e funciona como cortina (o papel que sai fica embaixo dela), o conteúdo novo entra junto, e o texto novo só aparece quando o velho já saiu.
- **Organização e hierarquia:** uma página por ideia, como num catálogo. Item numerado = uma página com o numeral grande ("01 de 03") na coluna e o nome em serifa; o que se diz dele vai num cartão de papel claro, com rótulos em caixa alta espaçada e o valor em serifa. Listas e passos ficam numa página larga, de cima para baixo. Um cabeçalho corrido (nome da "revista" à esquerda, fólio "Nº 01 / 03" à direita, sobre um fio fino) fica no topo o vídeo todo.
- **Tipografia:** Playfair Display (serifa de revista com algarismos alinhados) para títulos, numerais, nomes e valores, com itálico para complementos e destaques; IBM Plex Sans para rótulos em caixa alta espaçada, detalhes e legenda (o "I" tem serifa, não vira "l"). Títulos de 56 a 156 px, numeral de 196 px, texto de cartão ≥ 44 px, rótulos ≥ 30 px. O texto é medido com as larguras reais das fontes e diminui ou quebra para caber; nunca vaza.
- **Moldura da pessoa:** a foto da página, sem recorte do fundo, com o rosto seguido quadro a quadro. Lugares: `capa` (emoldurada pelo papel, embaixo da manchete), `direita`/`esquerda` (680 px de largura, do cabeçalho até 1700 px, com a coluna de papel do outro lado; os cartões avançam sobre ela só abaixo do queixo), `topo`/`baixo` (retrato largo de 780 a 920 px; a página abre no resto), `colagem` (impressão girada com borda branca) e `cheio` (quadro inteiro, no fechamento). Páginas laterais alternam direita ↔ esquerda (a pessoa cruza a página); páginas largas alternam topo ↔ baixo.
- **Cores, textura e som:** papel areia `#EFEAE1`, cartões num papel mais claro com sombra suave, tinta `#171614`, um único acento índigo de jeans `#2C4069` (numeral, pino, destaque, "a resposta") e um vinho escuro `#7A2C2C` só para alerta e risco. As amostras de tecido (linho, sarja, lã, jeans…) dão a textura. Sons raros e tonais: um grave que desce a cada troca de página, uma nota curta no pino (subindo de altura), um acorde quando a colagem se forma, um tom grave na capa e na etiqueta.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Marina" / "Finanças pessoais"): vão na assinatura da etiqueta final, e a área também no fólio do cabeçalho. Sem resposta, siga sem assinatura.

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
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Uma palavra curta e solta que não faz sentido costuma ser invenção da transcrição: não corte o trecho, corrija ou apague a palavra com `correcoes` (passo 7). Número curto dito sozinho ("Oito.", "Doze.") às vezes volta escrito errado ("DOSI"): corrija em `correcoes`.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam; só as longas saem. Neste modelo as trocas de página começam no corte mais próximo: o deslizar da foto esconde o pulo.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.50 --rosto-y 0.335 --queixo-y 0.44
```

O script corta, centraliza o rosto e calcula `rosto` e os pontos de corte no plano. O `modelo.json` do projeto já fixa o recorte vertical em 9:16 (a pessoa vira a foto e muda de lugar): não precisa de `--recorte`. Gravação perto da câmera (selfie) funciona: o modelo usa o queixo para manter o rosto inteiro nos retratos largos e para pôr os cartões laterais abaixo dele. Refazendo o corte depois de já ter planejado, use `--manter-plano`.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: a foto acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento (e os pontos do corpo, se for usar pinos)

```bash
node scripts/stills.mjs --guias
```

A cruz azul deve cair no rosto; a faixa amarela é a legenda; nada importante abaixo da linha vermelha (interface do aplicativo). A foto ganha uma grade em frações (0,1 em 0,1) e os **pontos do corpo** (gola, peito, ombros, lapelas, pulsos, cintura) aparecem com o nome.

Os pontos só importam quando um item é **algo que a pessoa veste ou usa** (a camisa, o relógio, o crachá, o avental): aí o pino com a linha fina aponta a peça no corpo. Os padrões acompanham a posição e o tamanho do rosto; se um ponto não cair na peça certa, leia a posição na grade e escreva só esse ponto em `pontos` no plano (`"pontos": { "jaquetaDir": { "x": 0.80, "y": 0.52 } }`). Nunca ancore um pino nas mãos nem no pulso (as mãos gesticulam): para relógio, pulseira e anel, use o `detalhe` (recorte aproximado do próprio vídeo). Em assunto abstrato, não use `ponto`: a página de catálogo fica sem pino.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`peca`, e quando houver resumo também a `colagem`) entra pelo menos uma vez**, mesmo que o assunto não seja moda: veja "A assinatura em qualquer assunto".

Pense como o editor de uma revista: abra com a capa (`abertura`, ou `numero` quando a primeira frase é um número); cada item de uma lista que a pessoa desenvolve vira uma página `peca` numerada; o resto vira páginas largas (lista, passos, número, gráfico, comparação, definição) e páginas laterais (destaque, frase, pergunta). Alterne: depois de duas ou três páginas laterais, uma página larga, e vice-versa (o layout troca sozinho; veja `references/plano.md`). Feche com a etiqueta (`cta`).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, regras de tempo e dois planos completos) e preencha `src/plano.json`: `marca`, `cabecalho` (o nome da "revista": o tema em 1 a 3 palavras, como "Guia cripto" ou "Conta de cabeça"), `momentos`, `semLegenda` e `correcoes`. Cada item, lado, dado ou palavra entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe e é legível (nada cortado, nada vazando do cartão)?
- cada coisa entra quando a palavra é dita? Nada parado mais de ~2,5 s?
- nas páginas laterais, o cartão fica abaixo do queixo e o rosto fica livre?
- nas trocas de página: nenhum quadro com dois textos um sobre o outro, nenhum quadro vazio? Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 8.55 8.6 8.65 8.7 8.75`);
- os pinos (se houver) caem na peça certa, não na mão nem no rosto?
- nada importante abaixo da linha da interface do app?

Corrija o plano (texto mais curto, outro bloco, outro `em`, outro `layout`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-lookbook.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curvas de tendência sem números, cor e textura das amostras, a escala da fita métrica);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um ponto ajustado à mão).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `capa`, com as linhas à mão) | capa de revista: a foto emoldurada pelo papel e a manchete em cima, inteira a lápis desde o primeiro quadro; cada palavra ganha tinta quando é dita; a primeira linha é grande; o `destaque` fica em itálico índigo com sublinhado que se desenha |
| lista | `topicos` | página larga: o cartão de catálogo com uma linha por item (numeral índigo "01", o texto em serifa, um fio fino entre as linhas); cada linha espera tracejada e ganha tinta na palavra dela; um traço índigo anda até o item da vez |
| passos | `passos` | página larga: a fita métrica do alfaiate se desenrola na vertical; a cada passo dito, um pino numerado crava na fita e uma linha fina leva ao nome do passo |
| número | `numero` | página larga (ou a capa, se for o primeiro momento): rótulo em caixa alta, o número em índigo contando em pt-BR (prefixo e sufixo menores) e a fita métrica embaixo, com o pino correndo de 0 até a medida |
| comparação | `comparacao` | página larga: dois cartões lado a lado, cada um com uma amostra de tecido em cima, o rótulo e o texto; "×" no meio (`contra`) ou uma seta fina (`antes-depois`, `errado-certo`); o lado que vence ganha o jeans índigo, o sublinhado e o pino; o errado é riscado em vinho |
| gráfico | `grafico` | página larga: `barras` = tiras de tecido que se estendem como um corte de pano (a maior em jeans índigo); `linha` = traço fino de tinta com um pino em cada ponto; `pizza` = amostra redonda em fatias de tecido com a legenda ao lado; sem números ditos (`tendencia`) = o traço desenha a curva com o papel cru embaixo e um pino na ponta (ou tiras que crescem), com "ILUSTRATIVO" |
| destaque | `destaque` | página lateral: um pino grande na coluna (índigo; vinho com "!" no `alerta`), um fio de prumo desce até o cartão onde a frase chega em itálico grande com sublinhado; o `detalhe` entra embaixo, menor |
| definição | `definicao` | página larga: o termo em itálico grande, a lápis, ganhando tinta palavra por palavra; um pino crava embaixo dele e a linha fina de catálogo leva ao cartão onde o significado ganha tinta |
| frase | `frase` | página lateral: aspas índigo grandes na coluna; o cartão com a frase a lápis, cada palavra ganhando tinta quando é dita; `destaque` em itálico índigo sublinhado; `risco` riscado em vinho quando é dito |
| pergunta | `pergunta` | página lateral: um "?" índigo grande na coluna; o cartão com a pergunta a lápis → tinta e as `opcoes` chegando como etiquetas de roupa penduradas, cada uma na sua palavra |
| fechamento | `cta` | quadro cheio: uma etiqueta de roupa (cantos chanfrados, furo) sobe e assenta, presa à gola por um cordão quando a gola aparece; ícone desenhado, a chamada palavra por palavra com o `destaque` em índigo, e a assinatura |
| **assinatura** | `peca` | página lateral de catálogo: o numeral grande "01 de 03" (com um rótulo como "peça", "motivo", "passo") e o nome na coluna; o cartão de produto desliza ao lado, abaixo do queixo, com as linhas ditas (`atributos`), e, quando o item é algo que a pessoa veste, a amostra do tecido, o pino com a linha fina, a medida de alfaiate e o recorte de detalhe. Sem nada para o cartão, o nome e o complemento vão grandes no cartão |
| **assinatura** | `colagem` | o conjunto montado: a foto vira uma impressão girada com borda branca e os itens chegam em volta como recortes de revista (a amostra, o recorte do vídeo, ou o nome escrito); embaixo, o subtítulo e o título se montam palavra por palavra |

## A assinatura em qualquer assunto

A `peca` é **um item de uma série apresentado como peça de catálogo**: tem número de série ("02 de 03"), nome, e uma ficha com o que se diz dele. Qualquer fala que enumere e desenvolva itens (motivos, erros, passos de uma conta, hábitos, produtos, fases de uma história) cabe nela; os rótulos da ficha são livres ("Resultado", "Por quê", "Quando", "Custo"). A `colagem` é **o conjunto montado**: os itens que se juntam num resultado ("com essas três, vira um look"; "com esses três hábitos, o mês fecha"; "é isso que a aula cobre"). Nada disso precisa de número nem de cor: sem `amostra`, a página não tem tecido; sem `ponto`, não tem pino; sem números ditos, nada de valores.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. [...] Gravei uma aula para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos."
   Três `peca` com `"rotulo": "motivo"`: "Compra / *por impulso*" (nome em "compra", complemento em "por"), "Moeda / *sem critério*", "Risco / *que não entende*"; a pessoa cruza a página a cada motivo. Depois uma `colagem` com itens novos só com `nome` ("O mercado", "Os riscos", "A escolha dos ativos", cada um no seu `em`), `subtitulo` "Eu gravei uma aula gratuita" e `titulo` "como eu analiso".
2. **Aula / conta de cabeça.** "10% é só andar a vírgula. Oito. Metade disso é 5%. Quatro."
   Duas `peca` com `"rotulo": "passo"`: "10%" / *andar a vírgula* com `atributos: [{ "rotulo": "Resultado", "valor": "R$ 8", "em": <"Oito"> }]`, e "5%" / *metade disso* com "R$ 4". O cartão curto mostra o valor grande.
3. **Saúde e rotina.** "Três coisas que mudaram meu sono: desligar a tela uma hora antes, quarto escuro e acordar sempre no mesmo horário."
   Três `peca` com `"rotulo": "hábito"` (só nome e complemento, que vão grandes no cartão): "Desligar a tela / *uma hora antes*", "Quarto / *escuro*", "Acordar / *no mesmo horário*"; a capa (`abertura`) é "Três coisas que mudaram meu sono". Se a fala só enumera rápido (menos de ~1,5 s por item), use um `topicos` no lugar das três páginas.
4. **Bem distante: relacionamento / história pessoal.** "Quando a gente se conheceu, eu morava em Recife; dois anos depois, Lisboa; hoje, a nossa casa em Porto Alegre."
   Três `peca` com `"rotulo": "capítulo"`, nome = a cidade, `atributos` com o que foi dito ("Quando" → "dois anos depois"); a `colagem` final junta as três cidades em recortes com o título "a nossa casa".
5. **Moda e produto (o uso original).** Uma `peca` por peça vestida, com `ponto` (pino na roupa), `amostra` (cor e tecido), `atributos`, `variantes`, `combina`, `medida`, `detalhe` e `preco`; a `colagem` junta as amostras. Veja o exemplo completo em `references/plano.md`.

Se a fala não enumera nada, a assinatura ainda entra: o resumo final vira `colagem` (com os nomes das ideias do vídeo) ou um único item vira uma `peca` sem número.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido. Rótulos estruturais curtos ("motivo", "passo", "Resultado", "Valor") são permitidos.
- Não invente número, nome, preço, tecido, medida nem fato. Um número dito por extenso pode virar algarismo ("Oito" → "R$ 8" quando o contexto é dinheiro dito).
- Ilustrativo só onde o bloco permite (a curva de `tendencia`, sempre com "ILUSTRATIVO" visível; a escala da fita métrica; a cor e a trama das amostras).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure na fala uma série de itens (motivos, passos, hábitos, capítulos) para virar páginas `peca`, ou um resumo para virar `colagem`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Texto pequeno ou quebrado em muitas linhas**: passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Cartão lateral cobrindo o queixo**: o modelo calcula o queixo pelo rastro do rosto; se a pessoa abaixa muito a cabeça num trecho, use uma página larga (`topicos`, `numero`…) nesse trecho ou ponha `"layout": "topo"` no momento.
- **Pino fora da peça**: confira os pontos com `stills.mjs --guias` e corrija em `pontos`. "Esq" e "Dir" são os lados da imagem, não do corpo.
- **O título da capa ou da colagem aparece antes da fala**: alguma palavra do título não existe na fala (o template procura cada palavra na transcrição). Use as palavras ditas, na ordem, ou corrija a transcrição em `correcoes`.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano` (confira os tempos, que mudam).
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
