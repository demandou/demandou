---
name: modelo-case
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Case, um relatório de consultoria que se monta enquanto ela fala: papel claro, tinta escura e um acento coral; a ficha ANTES com as métricas ditas, as mudanças marcadas com mini-ilustração, a linha do tempo do prazo, o gráfico ANTES × DEPOIS que cai ou sobe na proporção dita, o print do depoimento com estrelas e a caixa de comentário com a palavra-chave. A pessoa fica embaixo numa moldura larga e a câmera desce de página em página. Serve para qualquer assunto (o exemplo é um case de tráfego pago, mas funciona com finanças, saúde, vendas, histórias, aulas): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Case\", \"estudo de caso\", \"antes e depois do cliente\", \"prova social\", \"resultado de cliente\", \"depoimento\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Case

O vídeo vira um **relatório de case** sendo escrito: a folha em cima, com o cabeçalho fixo (o título do relatório e um ponto por seção) e as páginas por onde a câmera desce; a pessoa embaixo, numa moldura larga. **Nada de molde:** cada peça só aparece quando é dita, já com conteúdo e com movimento (rótulos e valores datilografados, caixas que se marcam, ilustrações que se desenham, a barra que cai, as estrelas que acendem), e o conjunto da página fica centrado e sobe suave quando uma peça nova entra. O quadro 0 já tem conteúdo: a ficha de quem é o case ("Cliente" + ícone) e, na primeira palavra, o carimbo ANTES. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em páginas, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um case de tráfego pago, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** um documento sendo escrito, sem nunca mostrar o molde (nada de linha cinza, caixa vazia ou campo tracejado esperando). As peças deslizam pouco (14–24 px) e assentam sem passar do ponto; filetes e sublinhados se desenham; valores e rótulos são datilografados com um cursor coral; caixas de marcar enchem de coral e o ✓ se desenha; as mini-ilustrações se desenham como caneta; a faixa coral clara anda até o item da vez; a barra DEPOIS cai (ou sobe) até a proporção dita e o colchete coral bate com a relação ("pela metade"). Entre as seções, a câmera **desce** pela folha (0,42 s, sem corte), chegando 0,15 s antes da primeira palavra da página; dentro da página, o conjunto fica centrado e sobe quando uma peça nova entra embaixo. Nada de giro, tremida, flash ou brilho atrás da pessoa.
- **Organização e hierarquia:** a tela é sempre dividida: a **folha** em cima (x 40–1040, y 92–980; conteúdo com margem de 84 px) e a **moldura da pessoa** embaixo (a partir de y 1000). Cada momento vira uma **página** da altura da janela, com a etiqueta da seção no alto (O QUE FIZEMOS, DEPOIS, PRÓXIMO PASSO…); a ficha ANTES usa o carimbo coral no lugar da etiqueta. O cabeçalho fixo mostra o título do relatório (mono 32 px) e os pontos das seções (feita = tinta, atual = coral, futura = contorno). Uma ideia por página.
- **Tipografia:** **Inter** para tudo o que se lê (800 nos valores e títulos, 52–120 px, tracking −0,022em; 700 no texto corrido; 500 nos detalhes); **Fragment Mono** só nas etiquetas curtas em caixa alta (cabeçalho, seção, carimbo, rótulo de métrica, eixo, "ILUSTRATIVO"), 30–40 px (nunca menos de 30 nos rótulos). Nada condensado.
- **Moldura da pessoa:** sempre embaixo, larga (x 40–1040, cantos de 18 px, os de baixo fora do quadro), com a cabeça inteira e ~56 px de folga, o rosto no eixo central e seguido quadro a quadro. Troca de escala em corte seco (100% ↔ 106%) só quando o trecho anterior durou mais de 1 s; soco de 5% quando o resultado bate. A tarja (nome ≥ 34 px + área em mono, com filete coral) fica presa entre a folha e a moldura, à esquerda, de 0,2 s a ~3,6 s.
- **Cores, textura e som:** mesa cinza-azulada (#DFE2E6), papel claro (#FAFAF7), tinta quase preta (#121722), cinzas de tinta para o secundário, filetes finos (#DEDCD5), **um único acento: coral** (#FF5A36) para o que importa (resultado, palavra-chave, item marcado) e seu tom claro (#FFE6DE) no marca-texto e nas faixas. Sons tonais, raros e baixos: uma nota de marimba por item marcado (subindo), um deslize grave na queda da barra, duas notas no resultado, um toque duplo na mensagem, um brilho curto nas estrelas e um "pop" no enviar. Nada de sino, ruído branco ou cara de cassino.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez:
   - **nome e área** de quem fala (ex.: "Rafael Moura" / "Gestor de tráfego"): vão na tarja do começo. Sem resposta, siga sem tarja;
   - o **título do relatório** (padrão "Relatório"; ex.: "Relatório de case", "Diagnóstico da loja");
   - a **palavra-chave do comentário** e a promessa (ex.: comenta CASE → recebe o diagnóstico), se o fechamento for de comentário;
   - se existe **um print de verdade** da mensagem do cliente (vai no depoimento, campo `arquivo`). Se não existir e a fala citar uma mensagem, pergunte o texto real; só use um texto de exemplo se o usuário autorizar, e avise na entrega.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica.

**O ritmo do Case:** fala corrida, respiros de 0,2 a 0,4 s (o `cortar.mjs` tira as pausas longas e junta vizinhos com menos de 0,3 s). Deixe um respiro natural **antes da virada** ("Em sessenta dias…") e depois do resultado: é onde a câmera desce para a página seguinte.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.42
```

O recorte já vem decidido pelo modelo (`modelo.json` fixa 9:16; a pessoa fica sempre na moldura de baixo). Refazendo o corte depois de já ter planejado, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo: a moldura acompanha quando a pessoa se mexe.

### 4b. Corrigir as palavras (e o tempo delas)

Abra `src/plano.json` → `palavras` e corrija o que a transcrição errou nos números, nomes e na palavra-chave (`"Casey."` → `"CASE."`). **Confira o começo das palavras que vão disparar peças**: o Whisper às vezes adianta 0,1–0,2 s o começo de uma frase depois de um corte. Para conferir, meça a energia do áudio do vídeo de trabalho (`ffmpeg -i public/base.mp4 -ac 1 -ar 16000 -f s16le -` e o RMS em janelas de 10 ms): a palavra começa onde o nível sobe de −60 dB para −30 dB ou mais. Ajuste o `em` (e o `ate` da palavra anterior). Ajuste também `duracao` para terminar ~0,3 s depois do fim da última palavra.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto, com a cabeça inteira logo abaixo da linha rosa (a moldura, y 1000); o retângulo verde é a janela das páginas; nada importante fora das linhas vermelhas (interface do app e margens de 64 px). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Num case, procure:
- o **antes**: os números e sintomas ditos (gasto, faturamento, peso, horas, "quase não vendia");
- **o que foi feito**: as mudanças, os passos, as decisões (2 a 5);
- o **prazo** ("em 60 dias", "em três meses", "numa semana");
- o **resultado**: o que mudou e **em que proporção dita** ("caiu pela metade", "dobrou", "triplicou", "de 80 para 40");
- a **prova**: a mensagem, o print, a avaliação;
- o **fechamento**: a pergunta e a palavra-chave do comentário (ou salvar, seguir, link).

Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`case`) entra pelo menos uma vez**, e vídeos com mais de 20 s pedem pelo menos dois efeitos próprios (`case`, `ficha`, `depoimento`). Sem números na fala, a assinatura continua: o `antes` com o sintoma em palavras, as mudanças como lista e o `resultado` com `ilustrativo: true` (a direção sem proporção).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `relatorio`, `momentos`, `semLegenda` e `correcoes`. Cada rótulo, valor, item, prazo, verbo do resultado ("caiu"), relação ("pela metade") e palavra-chave entra no `em` da palavra, tirado de `palavras`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: o **timing gate**. Cada entrada precisa cair a ±0,15 s da palavra que a nomeia; corrija até sair **APROVADO**. "Confira no quadro" = o texto da tela resume a fala (ex.: rótulo "Gasto em anúncio" na palavra "gastava"): olhe o quadro daquele instante no passo 8;
- `node scripts/legendas.mjs`: lista as linhas de legenda (que só aparecem nos momentos com `legenda: true` e nos trechos sem momento).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs 2.9 6.9 12.5 16.6
```

Peça quadros **parados** (não no meio da descida da câmera): um pouco depois do último item de cada página, no resultado e no fim. Abra os quadros **reduzidos à largura de um celular (~540 px)** e confira de verdade:
- o quadro 0 já tem conteúdo (a ficha de quem é o case)? Nenhum quadro mostra molde (linha cinza, caixa vazia, campo tracejado)?
- cada página tem a etiqueta certa e se lê em 1 s? Os valores cabem na linha (nada vaza da folha)?
- cada peça entra **na palavra** e mostra **o que foi dito** (o número dito, a mudança dita, o ícone da coisa)?
- **nenhum número que não foi falado** (nem porcentagem calculada, nem data, nem hora no print)?
- a barra DEPOIS para na proporção dita? Sem proporção dita, a etiqueta "ILUSTRATIVO" aparece?
- o depoimento é o texto real (ou está avisado como exemplo)? Sem logo de app nem de marca?
- o fechamento fica legível por pelo menos 1,2 s e a palavra-chave aparece escrita na caixa?
- tarja legível (nome ≥ 34 px); nada encostado nas margens; nada importante abaixo de y 1700; a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-case.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que página entrou em cada trecho) e o maior desvio do timing gate;
- o que é ilustrativo (resultado sem proporção dita, depoimento de exemplo);
- o que o usuário deve conferir (um número que a transcrição pode ter trocado, o texto do depoimento, a palavra-chave).

## Blocos deste modelo

Todos os blocos viram **páginas da folha** (em cima); a pessoa fica embaixo o tempo todo.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | página TEMA: um traço coral se desenha e o título se monta grande, palavra por palavra, com o marca-texto coral claro no `destaque` |
| lista | `topicos` | página com etiqueta e título opcional; linhas com marcador quadrado que acende em coral na fala, mini-ilustração opcional (`icone`) e a faixa coral clara andando até o item da vez |
| passos | `passos` | a lista que se marca: caixas que enchem de coral com ✓ desenhado, ligadas por um traço que enche até o passo da vez |
| número | `numero` | página EM NÚMEROS: o número enorme contando, uma régua coral que enche e o rótulo embaixo, palavra por palavra |
| comparação | `comparacao` | duas colunas do relatório (rótulo em mono, texto grande); a vencedora ganha borda e selo ✓ coral, a outra esmaece; `errado-certo` usa ✗ e ✓ |
| gráfico | `grafico` | barras de tinta com a última em coral, linha de tinta com o último ponto coral, ou rosca; sem números ditos, a curva coral percorre a forma tracejada com "ILUSTRATIVO" |
| destaque | `destaque` | a frase grande com o filete coral vertical que se desenha; `alerta` = etiqueta ATENÇÃO coral e texto coral |
| definição | `definicao` | o verbete: o termo enorme com sublinhado coral e o significado datilografado |
| frase | `frase` | a citação com as aspas coral grandes, palavra por palavra; `destaque` em coral com marca-texto, `risco` riscado |
| pergunta | `pergunta` | a pergunta grande com o marca-texto no `destaque`; com `opcoes`, a lista de marcadores; seguida de um `cta`, divide a página PRÓXIMO PASSO |
| fechamento | `cta` | página PRÓXIMO PASSO: a chamada grande (palavra-chave em coral) e a **caixa de comentário** em que a palavra é digitada e o enviar é tocado; `salvar`, `seguir` e `link` viram um botão que acende |
| **assinatura** | `case` | as páginas ANTES (a ficha de quem é o case com o carimbo coral ANTES, e as métricas ditas com quadrinho ilustrado e traço de tendência), O QUE FIZEMOS (as mudanças que se marcam, com mini-ilustração) e DEPOIS (o prazo na linha do tempo com bandeira + o gráfico ANTES × DEPOIS que cai ou sobe e o colchete com a relação dita) |
| próprio | `ficha` | a ficha do ANTES sozinha, com o carimbo que você der (HOJE, O MERCADO, RAIO-X): título opcional + 1 a 3 métricas datilografadas |
| próprio | `depoimento` | o print da mensagem numa conversa genérica: cartão com "digitando…", o balão na palavra, as estrelas entrando já cheias, uma a uma; com `arquivo`, o print de verdade |

## A assinatura em qualquer assunto

O case é **"como estava → o que foi feito → em quanto tempo → o que mudou → a prova"**. Toda fala que conta uma virada (de alguém, de um negócio, de um corpo, de uma rotina) cabe nele; as partes que a fala não tiver ficam de fora.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde, porque compra por impulso… Na aula eu mostro como analiso o mercado, os riscos e a escolha dos ativos… e você corre o risco de perder o seu patrimônio."
   `case` com `antes` (etiqueta "O problema", métrica "Mesmo na alta" → "tem gente que perde", `sinal: "cai"`); outro `case` com `mudancas` (etiqueta "Na aula", título "Aula gratuita: como eu analiso", itens "O mercado", "Os riscos", "A escolha dos ativos" com ícones `grafico`, `escudo`, `alvo`); e um `case` com `resultado` "O risco de perder", `direcao: "cai"`, `movimentoEm` em "perder", `ilustrativo: true` (sem proporção, porque nenhuma foi dita). O preço do Bitcoin dito vira uma `ficha` ("Bitcoin" → "US$ 83 mil", `sinal: "sobe"`).
2. **Saúde ou rotina.** "Eu dormia cinco horas e vivia cansado. Mudei três coisas: celular fora do quarto, café só até as duas e o mesmo horário todo dia. Em um mês, passei a dormir sete horas."
   `antes`: "Sono" → "5 horas por noite" (ícone `relogio`, `sinal: "plano"`) e "Energia" → "vivia cansado"; `mudancas` com as três (ícones `telefone`, `relogio`, `calendario`); `prazo` "um mês"; `resultado` "Horas de sono", `direcao: "sobe"`, `valorAntes: "5 h"`, `valorDepois: "7 h"`, `fator: 1.4` (7 ÷ 5, os dois números ditos) e `relacao: "7 horas"`.
3. **Algo bem distante (carreira, relacionamento, história pessoal).** "Mandei cinquenta currículos e ninguém respondeu. Aí refiz o currículo, o LinkedIn e o jeito de me apresentar. Em duas semanas, três entrevistas. Olha o que a recrutadora me escreveu."
   `antes`: "Currículos enviados" → "50" e "Respostas" → "nenhuma" (`sinal: "plano"`); `mudancas` com as três (ícones `documento`, `pessoa`, `mensagem`); `prazo` "duas semanas"; `ficha` "Entrevistas" → "3"; `depoimento` com a mensagem real da recrutadora (sem nome de empresa, sem logo), sem estrelas.

Sem proporção dita, nunca invente "−50%" ou "2x": use `ilustrativo: true` e a relação em palavras que a pessoa disse ("caiu muito", "melhorou").

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("cinco mil reais por mês" vira "R$ 5 mil" + "por mês").
- **Nunca mostre um número que não foi dito**: nem a porcentagem calculada de "metade", nem datas, nem horas no print, nem numeração de seções.
- O `fator` do resultado vem da relação dita ("metade" = 0,5; "dobro" = 2; "triplicou" = 3) ou dos dois números ditos; sem isso, `ilustrativo: true`.
- O depoimento é o texto real que o cliente mandou (ou o print dele). Texto de exemplo só com autorização, e avisado na entrega. Nunca nome real de terceiros nem logo de app.
- Estrelas só se a avaliação existir (`estrelas` = a nota dada).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Se ele pedir "dois efeitos próprios", acrescente uma `ficha` com um dado dito ou separe o `case` em `antes`/`mudancas`/`resultado` em trechos diferentes. Não use `--forcar`.
- **Timing gate fora**: a palavra em `palavras` está errada ou adiantada (corrija no passo 4b) ou o `em` está noutra palavra.
- **O quadro 0 está vazio**: dê ao primeiro `case`/`ficha` um `titulo` (quem é o case: "Cliente", "A loja", "Eu") com `tituloEm: 0`; ele já aparece no quadro 0 e o carimbo bate na primeira palavra.
- **A página não dá tempo de ser lida** (fala muito corrida): a câmera chega 0,15 s antes da primeira palavra da página. Junte duas falas na mesma página (ex.: `prazo` e `resultado` dividem a página DEPOIS; uma `pergunta` seguida de `cta` divide o PRÓXIMO PASSO) ou deixe um respiro maior no corte.
- **O valor não cabe**: a ficha reduz até 52 px e quebra em 2 linhas; encurte com as palavras da fala (até ~22 caracteres por valor, ~28 por item de lista).
- **Mais de 3 métricas ou 5 mudanças**: divida em duas páginas (dois `case`, ou `case` + `ficha`).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
