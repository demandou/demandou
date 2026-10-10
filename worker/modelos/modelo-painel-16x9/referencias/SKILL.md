---
name: modelo-painel-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Painel. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Painel: um painel de dados calmo e preciso (grafite quase preto, menta e âmbar, números em fonte mono). Quando a fala explica algo, a pessoa encolhe para uma moldura do lado direito e um painel abre no lado esquerdo com gráfico que se desenha na fala, barra que se divide, cartões de indicador e listas de status; entre um painel e outro ela volta à tela cheia com cartões na coluna livre ao lado dela. Serve para qualquer assunto (o exemplo do modelo é finanças, mas funciona com cripto, saúde, receita, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo e, sem números ditos, usa formas ilustrativas. Use sempre que o usuário pedir para editar \"no modelo Painel\", \"estilo painel\", \"estilo dashboard\", \"com gráficos e indicadores\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação à esquerda)."
---

# Modelo Painel (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Painel no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, cartões, gráficos, sons, o mesmo movimento e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada, com a legenda na área segura de baixo. O painel abre **só quando acrescenta clareza** à fala e volta para a pessoa quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Nos momentos de painel, a pessoa encolhe para uma **moldura do lado direito** (544 × 760 px, cabeça e ombros, o rosto centralizado nela e acompanhado com ajuste suave pelo rastro do rosto) e o painel ocupa o **lado esquerdo**: o cabeçalho em cima (rótulo âmbar; embaixo, o título ou a ficha à esquerda e o contador à direita) e o corpo largo embaixo (gráfico, barra, cartões, lista). A moldura fica sempre à direita: o campo `janela` do plano é aceito e ignorado.
- **Cartões de tela cheia na coluna livre.** Abertura, gancho, número, comparação, destaque, definição, frase, pergunta e fechamento continuam em tela cheia: o cartão grafite entra na coluna livre ao lado da pessoa (o lado com mais espaço), na altura do rosto, sem cobrir o rosto. Com a pessoa no meio da gravação, o vídeo desliza um pouco para o outro lado enquanto o cartão está na tela (aproxima o mínimo para não sobrar borda, no máximo 15%).
- **Listas, indicadores e partes em fileiras.** O corpo do painel deitado é largo e baixo: 2 ou 3 indicadores ficam lado a lado, as partes da `divisao` numa fileira só, as linhas das listas largas e baixas.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira um painel de dados ao vivo: a pessoa fala em tela cheia e, quando a fala organiza uma ideia (um número, uma lista, uma comparação, uma tendência), ela vai para a moldura da direita e o lado esquerdo vira um painel grafite que monta a informação no ritmo da fala. Calmo, preciso, sem enfeite.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com finanças (juros compostos), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo entra como um dado sendo impresso: uma máscara abre da esquerda, números contam com aceleração e freio, linhas e barras se desenham na medida da fala, cada item acende na palavra dele. Uma moldura de seleção desliza até o item que está sendo dito; o último dado "respira" (um anel que se abre e some, como dado ao vivo). Sem quique, sem giro, sem brilho. Entre dois painéis, o corpo antigo desliza para fora enquanto o novo entra.
- **Organização e hierarquia:** a informação é organizada como um dashboard. No quadro deitado: cabeçalho em cima, na largura do painel (rótulo âmbar em caixa alta; embaixo, o título ou a ficha à esquerda e o número grande, a seta da tendência ou o progresso "02/03" à direita), corpo largo embaixo (gráfico, barra, cartões, lista) e nota de rodapé. Uma coisa grande por vez; o resto menor. Itens sempre numerados ou com status.
- **Tipografia:** Geist (textos, 500 e 600) e Geist Mono (todo número, rótulos em caixa alta). Dígitos de largura igual; "R$", "%" e unidades menores ao lado do número. Os tamanhos são os do vertical (títulos de 54 a 84 px, textos de corpo ≥ 44 px, rótulos ≥ 30 px), desenhados numa camada encolhida para 0,84 no quadro deitado. Todo texto é medido e reduzido para caber, em até 2 ou 3 linhas.
- **Moldura da pessoa:** dois estados. Tela cheia (como foi gravada, aproximação lenta e contínua, cartão grafite na coluna livre ao lado dela) e moldura (cabeça e ombros, do lado direito, borda fina e a etiqueta com o nome). A troca leva 0,6 s, na fronteira do momento, e nunca deixa a tela vazia: o painel já está montado embaixo e a pessoa encolhe revelando-o; na volta, ela cresce por cima do painel que sai. Painéis seguidos ficam na mesma moldura: o cabeçalho troca e o corpo antigo desliza para fora enquanto o novo entra. A moldura segue o rosto. Nada recorta a pessoa do fundo.
- **Cores, textura e som:** fundo grafite puxado para o verde `#0A120F`, texto quase branco, **menta** `#5FDDA4` = o resultado/o positivo, **âmbar** `#F0B64E` = rótulos e marcações, cinza-esverdeado = a base, **vermelho suave** `#EE7766` só para perda, risco ou erro. Sons raros e tonais: um tom grave quando o painel abre, notas suaves quando um dado se revela, ✓ sobe, ✗ desce.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla Nunes — Nutricionista"): o nome vai na etiqueta da moldura e na assinatura do fechamento; a área vira o rótulo da abertura. Sem resposta, siga sem nome.
4. **Números.** Todo número na tela vem da fala (ou de uma tabela que o usuário mandou). Fala sem números não é problema: os blocos do Painel têm um modo **ilustrativo** (a forma mostra a ideia, nenhum número aparece e a etiqueta "ilustrativo" fica visível).

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

Números falados costumam vir escritos de jeitos estranhos ("R$ 100,00" para "cem mil", "500,00" para "quinhentos reais"). Anote-os: vão virar `correcoes` no passo 7.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** são trechos de 0,7 s ou mais em que o Whisper não reconheceu palavras. Podem ser fala que a transcrição perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, escolha pela lógica de onde o vídeo vai ser postado ("toque em Saiba Mais" só existe em anúncio) e, na dúvida, fique com a última. Diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam. Só as pausas longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.48 --rosto-y 0.38 --queixo-y 0.47
```

O script corta e calcula `rosto`, `zona` e os pontos de corte no plano. Este modelo entrega sempre o quadro 1920×1080: um original deitado entra inteiro; um original vertical vira uma faixa deitada em volta do rosto (para a melhor imagem, grave deitado). Ele corta as pausas longas e os erros, mas mantém a respiração natural (é uma aula, não um anúncio). Leia os avisos que o script imprime.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a moldura dos painéis usa esse rastreio para manter o rosto centralizado nela e mostrar cabeça e ombros, esteja a pessoa perto ou longe da câmera; a largura do rosto também decide a coluna dos cartões de tela cheia.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto; a caixa azul (a coluna dos cartões de tela cheia) não pode encostar no rosto; a caixa verde é a área do painel e a roxa, a moldura da direita; a caixa amarela (legenda) fica acima da linha vermelha (controles do player). Se a cruz não cair no rosto, refaça o passo 4 com medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, número, comparação, tendência…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`grafico`, `divisao` ou `painel`) entra **pelo menos uma vez**, de forma ilustrativa se a fala não tiver números.

Pense também na **gramática de layout** (aula 9): tela cheia é a base; os blocos de painel mandam a pessoa para a moldura da direita só quando a ideia pede apoio visual, e os de tela cheia a trazem de volta. Alterne: não deixe a pessoa mais de ~20 s seguidos na moldura, e não faça um trecho de tela cheia com menos de ~1,8 s entre dois painéis (emende os painéis). No vídeo longo, deixe trechos só com a pessoa e a legenda (respiro), sem passar de ~8 s.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Nos blocos de painel, use `"legenda": true` (a pessoa está na moldura; a legenda ajuda a acompanhar).

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda e marca linha com palavra sozinha; corrija o que der.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem (960 × 540) e confira: o texto cabe e está inteiro? Os números batem com a fala? A moldura mostra a cabeça inteira, com o rosto no meio, sem cortar o rosto (se não, ajuste `retrato` no plano)? O painel encosta na moldura? Nada fica abaixo da linha dos controles do player? Algo novo entra a cada poucos segundos, com tempo de leitura? Nada cobre o rosto em tela cheia? Para um instante específico (o meio de uma troca): `node scripts/stills.mjs 12.7 18.4`.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-painel.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é **ilustrativo** (formas sem números) e de onde vieram os números (da fala ou de uma tabela do usuário);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma versão escolhida no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Tela cheia. Cartão grafite com o rótulo âmbar (a área da pessoa) e o título montado palavra por palavra; o `destaque` em menta. |
| abertura com número | `gancho` | Tela cheia. Título curto + o número-chave contando, com uma curva que se desenha ao lado. |
| lista | `topicos` | Painel. Quadro de status: cada item é uma linha numerada que acende na sua palavra, com um ponto de status; uma moldura de seleção desliza até o item dito; o cabeçalho conta "02/05". |
| passos | `passos` | Painel. Pipeline: nós numerados ligados por uma linha que avança de etapa em etapa, cada etapa num cartão; o cabeçalho mostra o progresso. |
| número | `numero` | Tela cheia. Cartão indicador: o rótulo, o número grande em mono menta contando e um ponto "ao vivo"; porcentagem ganha uma barra que enche. |
| comparação | `comparacao` | Tela cheia. Dois cartões lado a lado; com vencedor, ✓ e curva completa × ✗ e curva interrompida; sem vencedor, "×" ou "→" entre eles. |
| gráfico | `grafico` | Painel (assinatura). Linha que avança de um número dito ao outro, barras que crescem na palavra de cada uma, ou a barra que se divide (`pizza`). Sem números: a forma da tendência (sobe, cai, oscila), a seta no cabeçalho e a etiqueta "ilustrativo". |
| destaque | `destaque` | Tela cheia. Alerta do painel: selo de alerta (vermelho suave) ou de chave (menta), a frase grande na fala e o detalhe em mono. Com `eixo`, vira barras com uma faixa acesa (painel). |
| definição | `definicao` | Tela cheia. A dica de um gráfico: o termo em mono menta sublinhado e, quando o significado é dito, uma caixa de dica abre embaixo dele. |
| frase | `frase` | Tela cheia. A anotação do analista: um traço menta cresce ao lado enquanto a frase se monta; `risco` é riscado em vermelho suave. |
| pergunta | `pergunta` | Tela cheia. Campo de busca: selo "?" âmbar, a pergunta na fala, opções com anel ou um campo com o cursor piscando. |
| fechamento | `cta` | Tela cheia. Ícone de traço que se desenha, a chamada na fala (o `destaque` em menta), o apoio e a assinatura com nome e área. |
| **assinatura** | `grafico` | (acima) |
| **assinatura** | `divisao` | Painel. Um todo numa barra só, preenchida parte a parte, com a porcentagem e o valor de cada parte. Sem números, só a proporção (`peso`) e os nomes; o cabeçalho lê a parte que acabou de entrar. |
| **assinatura** | `painel` | Painel. Painel de indicadores: 2 a 4 cartões, cada um acende na sua palavra com um número que conta ou um estado em palavras ("baixo", "sem critério"), a cor do tom e a seta da tendência. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa do bloco (`tendencia`, `peso`, `texto` no lugar do valor).

## A assinatura em qualquer assunto

A assinatura do Painel é **"a fala vira um dashboard"**: a pessoa vai para a moldura da direita e a ideia aparece como um dado que se monta: uma linha que sobe ou cai, um todo que se divide, cartões de indicador que acendem. Funciona com números ditos e, sem eles, de forma ilustrativa.

1. **Finanças / cripto.** "O Bitcoin rompeu os 83 mil e reacendeu o bull market… tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   - `grafico` linha, `tendencia: "sobe"`, `ilustrativo: true`, título "Bitcoin", leitura "ciclo de alta", etiqueta "bull market" na palavra.
   - `painel` "Tem gente que perde": cartões Compra → "por impulso", Moeda → "sem critério", Risco → "que não entende", todos com `tom: "negativo"`.
2. **Saúde / rotina.** "Em três semanas de caminhada a minha ansiedade caiu, o sono melhorou e eu parei de beliscar à noite."
   - `grafico` barras, `tendencia: "cai"`, `tom: "positivo"` (cair é bom aqui), `eixo: ["Sem 1", "Sem 2", "Sem 3"]`, leitura "ansiedade caiu".
   - `painel` "Três semanas depois": Ansiedade → "caiu" (`tendencia: "cai"`, `tom: "positivo"`), Sono → "melhorou" (`tendencia: "sobe"`), Beliscar → "parei".
3. **Algo bem distante (receita, relacionamento).**
   - Receita: "uma lata de leite condensado, uma colher de manteiga e três colheres de chocolate" → `painel` "Ingredientes" com 1 lata · 1 colher · 3 colheres contando; "passa para o pote ainda quente e deixa esfriar" → `grafico` linha, `tendencia: "cai"`, `tom: "neutro"`, leitura "deixa esfriar", marca "ainda quente" no começo da linha.
   - Relacionamento: "a maior parte das brigas começa no cansaço, não no assunto" → `divisao` ilustrativa: "cansaço" (`peso` 3) × "o assunto" (`peso` 1), sem números.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Impulso"), sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Uma conta sua a partir de parâmetros que a pessoa disse (aporte, taxa, prazo) é uma **simulação**: mostre os parâmetros na `ficha` e a nota "Simulação ilustrativa" (detalhes em `references/plano.md`, seção 3).
- Forma sem números só nos campos ilustrativos (`tendencia`, `peso`, `ilustrativo: true`); a etiqueta "ilustrativo" aparece sozinha. Nenhum número inventado vai para a tela.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais**: o bloco reduz o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala.
- **A moldura corta o cabelo ou mostra rosto demais**: ajuste `retrato` no plano (`zoom` menor mostra mais; `ancoraY` sobe ou desce o rosto).
- **Original vertical**: o vídeo de trabalho é uma faixa deitada em volta do rosto e sai menos nítido. Avise o usuário; o ideal é gravar deitado.
