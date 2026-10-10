---
name: modelo-lousa
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Lousa: a tela vira um quadro-negro e o que a pessoa diz é escrito a giz na hora em que é dito (algarismos traço a traço, letra manuscrita, um giz amarelo para o assunto), a pessoa vira uma janela riscada a giz que muda de lugar a cada página e o apagador limpa a lousa entre as ideias; a assinatura é a conta armada (parcelas, traço e resultado circulado), com números ou com palavras. Serve para qualquer assunto (o exemplo é matemática, mas funciona com finanças, cripto, saúde, moda, vendas, carreira, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Lousa\", \"estilo lousa\", \"estilo quadro-negro\", \"com giz\" ou \"como uma aula no quadro\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Lousa

O vídeo vira uma aula num quadro-negro bonito. A pessoa abre em tela cheia e logo vira uma janela presa na lousa, com moldura riscada a giz; o que ela diz é escrito a giz na hora em que é dito: o tema, uma lista, os passos circulados, um número, um quadro dividido em T, um gráfico de eixos riscados à mão e, na assinatura, a conta armada que fecha num resultado circulado. Entre uma ideia e outra o apagador limpa a página e a janela muda de lugar. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em páginas de lousa, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com matemática (15% de cabeça), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo nasce na mão, no ritmo da fala. Cada palavra é escrita quando é dita (a letra se revela da esquerda para a direita; algarismos e sinais são traços de giz desenhados na ordem da mão); depois vêm os gestos de professor: sublinhar, circular, riscar, emoldurar, ligar com seta. O que vai ser escrito aparece antes em giz bem fraco (esboço) e é escrito por cima. Entre duas páginas, o apagador de feltro passa (com um pouco de pó) e só depois a página nova é escrita onde a antiga estava; nunca há duas páginas misturadas. A janela da pessoa troca de lugar em ~0,6 s e o que já foi dito aparece escrito à medida que ela libera a lousa.
- **Organização e hierarquia:** uma página por ideia. Com a janela num canto, o título da página fica ao lado dela, grande, em giz amarelo; o conteúdo vem embaixo, na largura toda, de cima para baixo. Com a janela no alto, o conteúdo fica embaixo dela, centrado. O assunto do instante é grande e amarelo; rótulos (caixa-alta pequena), detalhes e esboços são menores e mais fracos.
- **Tipografia:** Mali 600 (letra manuscrita redonda, I e l diferentes) para tudo que é escrito na lousa; Atkinson Hyperlegible Next para rótulos em caixa-alta espaçada, legenda e assinatura. Algarismos e sinais (`0–9 % , . + − × ÷ = / : ( ) R$ US$ ≈ →`) não são fonte: são traços de giz. O texto é medido com a letra de verdade: diminui até caber e quebra em até 3 ou 4 linhas; nunca vaza.
- **Moldura da pessoa:** três lugares. Tela cheia no começo (o rosto é o gancho) e nos respiros; **alto** = janela grande centralizada no alto, a lousa embaixo; **canto** = janela retrato no canto de cima, alternando direita e esquerda a cada página, com o título ao lado. A janela tem moldura riscada a giz, mostra a cabeça inteira e segue o rosto quadro a quadro (gravação muito perto da câmera aproxima menos).
- **Cores, textura e som:** lousa verde quase preta com névoa de giz apagado, giz branco, **um giz amarelo** só para o assunto do instante e um **giz rosa** só para o erro e o alerta (o que é riscado, o lado errado, o sinal de atenção). Filtro de giz em tudo (borda irregular e grão fixo). Sons raros e tonais: um "vuum" grave quando o apagador passa, notas de marimba subindo a cada passo, duas notas descendo no alerta, um acorde na resposta.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`). As fontes (Mali e Atkinson Hyperlegible Next) vêm do Google Fonts na hora do render.
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Prof.ª Ana Lima" / "Português"): vão na assinatura do fechamento. Sem resposta, siga sem assinatura.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Trecho marcado `[sem transcrição: ouça antes de tirar]`: ouça antes de tirar; se for fala, deixe.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas são respiração; o corte as encurta sozinho. Numa explicação com resposta ("quanto dá? Oito."), não tire a pausa antes da resposta: ela é o tempo da lousa.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.505 --rosto-y 0.30 --queixo-y 0.415
```

O script corta, recorta e calcula `rosto` e os pontos de corte no plano. Este modelo fixa o vertical em 9:16 (`modelo.json`): a pessoa muda de lugar na lousa e não precisa de espaço abaixo do queixo. Vídeo horizontal vira 3:4 e funciona do mesmo jeito. Refazendo o corte depois de já ter planejado, use `--manter-plano`.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a janela acompanha quando a pessoa se mexe, aproxima menos quando a gravação é muito perto da câmera e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul cai no rosto (só em tela cheia); a caixa verde é a janela da pessoa; a laranja, o cabeçalho ao lado dela; a rosa, a área da lousa; a amarela, a legenda, acima da linha vermelha (interface do aplicativo). Antes de haver momentos no plano, a pessoa aparece em tela cheia: confira a cruz. Depois de planejar, peça guias em tempos dentro dos momentos (`node scripts/stills.mjs --guias 2.5 10 20`). Se o rosto ficar pequeno ou cortado na janela, ajuste `caixas` no plano (ver `references/plano.md`).

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, passos, número, comparação…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`coluna` ou `resultado`) entra pelo menos uma vez**, mesmo que o assunto não tenha números: veja "A assinatura em qualquer assunto".

Pense como professor no quadro: cada ideia é uma página. Varie o lugar da pessoa: blocos com título vão para o canto (os cantos se alternam sozinhos); abertura, frase, destaque e fechamento vão para o alto. Abra com o rosto em tela cheia por ~0,3 a 0,5 s.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada palavra, item, lado ou número entra no `em` da palavra que o diz, tirado de `work/palavras.json`.

**Números:** confira toda conta antes de escrever (10% de 80 = 8; 8 + 4 = 12). Se a pessoa errou a conta na fala, não "conserte" a lousa em silêncio: avise o usuário.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só aparecem fora dos momentos ou nos momentos com `"legenda": true`).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "DOSI": "Doze." }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada `em` e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe e se lê (nada atrás da janela, nada cortado, nada abaixo da linha da interface)?
- cada coisa aparece quando a palavra é dita? A conta está certa?
- o título ao lado da janela tem algo escrito (o canto não ficou vazio)?
- nada parado mais de ~2,5 s? Uma página longa precisa de itens entrando por dentro dela.
- nas trocas, nenhum quadro com a lousa vazia e a pessoa num cartão solto, nenhuma página nova escrita sobre a velha? Gere quadros a cada 0,1 s em volta de cada `de` (`node scripts/stills.mjs 8.5 8.6 8.7 8.8 8.9`).

Corrija o plano (texto mais curto, outro bloco, outro `em`, outro `layout`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-lousa.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curva de tendência sem números, número aproximado);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma conta).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `titulo`) | janela no alto; o tema escrito a giz palavra por palavra, centrado, até 4 linhas; o `destaque` em amarelo e sublinhado; `rotulo` opcional em caixa-alta em cima |
| lista | `topicos` | com `titulo`: janela no canto e o título amarelo ao lado; embaixo, cada item com um traço amarelo na frente, escrito na palavra dele; `detalhe` menor embaixo; se sobra tempo, uma moldura de giz fecha a lista |
| passos | `passos` | o mesmo lugar; algarismos a giz (esboçados antes) circulados em amarelo quando cada passo é dito, ligados por setas; notas subindo a cada passo |
| número | `numero` | janela no canto; o `rotulo` escrito ao lado dela; embaixo, o número grande em amarelo, algarismo por algarismo em pt-BR (US$ 83.000; 1,5), prefixo e sufixo menores, sublinhado duplo; `ilustrativo` ganha "≈" e a etiqueta ILUSTRATIVO |
| comparação | `comparacao` | a lousa dividida em T (o quadro de prós e contras): rótulos amarelos em cima, textos embaixo, cada lado na palavra dele; `errado-certo` = ✗ rosa e ✓ amarelo; `antes-depois` = seta atravessando o T; `vencedor` circulado |
| gráfico | `grafico` | eixos riscados à mão; `barras` = retângulos de giz hachurados (o maior em amarelo) com o valor em cima; `linha` = pontos circulados ligados por traços; `pizza` = círculo de giz com fatias numeradas e legenda; sem números, a curva da `tendencia` desenhada devagar em amarelo, com ponta de seta e ILUSTRATIVO |
| destaque | `destaque` | janela no alto; a palavra grande escrita a giz; `chave` = amarelo com sublinhado duplo; `alerta` = giz rosa com o sinal de atenção (triângulo com "!") |
| definição | `definicao` | verbete de lousa: o termo grande em amarelo ao lado da janela, sublinhado; embaixo, "= significado", palavra por palavra |
| frase | `frase` | janela no alto; a frase entre aspas grandes de giz amarelo, palavra por palavra; `destaque` amarelo; `risco` riscado a giz rosa na hora em que é dito |
| pergunta | `pergunta` | sem opções: janela no alto, um "?" grande de giz em cima e a pergunta embaixo; com `opcoes`: questão de prova, a pergunta ao lado da janela e embaixo ☐ a) ☐ b) ☐ c) |
| fechamento | `cta` | janela no alto: ícone a giz grande (salvar, seguir, comentar, link) que "acontece" em amarelo, a chamada embaixo com o `destaque` sublinhado e a assinatura; no canto, com `titulo` ao lado da janela e, se quiser, a `regra` emoldurada |
| **assinatura** | `coluna` | a conta armada: parcelas uma embaixo da outra, o sinal, o traço e o total circulado em amarelo. Com números (soma, subtração, multiplicação) ou com **palavras** ("impulso + sem critério + risco = perda") |
| **assinatura** | `resultado` | a pergunta vira conta ao lado da janela ("Como avaliar?") e a resposta ganha "=" e sublinhado duplo embaixo; número ("R$ 12") ou palavra ("critério") |
| conta | `virgula`, `fracao` | a vírgula que pula casas por cima de uma seta (10%, 1%, ×10, conversões); a divisão com um traço ("metade", "um terço"; aceita palavras curtas) |
| regra | `regra` | até 3 linhas a giz emolduradas: o macete, a regra de bolso, a fórmula para levar |

Os resultados passam de uma página para a outra sozinhos: o total de uma `coluna` que reaparece igual numa `resultado` (ou o resultado de uma `virgula` que vira parcela) desliza por cima do apagador até o lugar novo.

## A assinatura em qualquer assunto

A `coluna` é **"isto + isto + isto dá aquilo"**: partes que somam (ou tiram) um resultado. A `resultado` é **"a pergunta = a resposta"**, com a resposta sublinhada duas vezes. Quase toda fala tem uma das duas: motivos que levam a uma consequência, ingredientes de um resultado, hábitos que somam, custos que se acumulam, a resposta de uma pergunta feita no próprio vídeo. Com palavras, as parcelas são escritas na palavra de cada uma e o total circulado sai no fim da frase.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `coluna` com `passo: "Mesmo na alta"` e `titulo: "Tem gente que perde"`; itens `impulso` (em "impulso"), `sem critério` (em "sem"), `risco sem entender` (em "risco"); `operador: "+"`; `tracoEm` no fim da frase; `total: "perda"` circulado. Com números ditos ("gastei 200 no cartão e 150 no pix"), a mesma coluna soma `200 + 150 = 350`.
2. **Saúde (rotina).** "Dormir sete horas, beber dois litros de água e caminhar vinte minutos: isso já é metade do caminho."
   `coluna`: `dormir 7 h` + `2 litros de água` + `caminhar 20 min` = `metade do caminho`, cada parcela na palavra dela; ou uma `resultado` com `conta: "O que muda o dia?"` e `valor: "dormir bem"`.
3. **Bem distante (relacionamento / história pessoal).** "Briga de casal quase sempre é cansaço, mais uma expectativa que ninguém falou, mais o celular na mesa."
   `coluna`: `cansaço` + `expectativa não dita` + `celular na mesa` = `briga`, com `titulo: "A conta da briga"`. Numa história ("eu tinha 19 anos, 300 reais e uma ideia"), a coluna soma `19 anos` + `R$ 300` + `uma ideia` = `a primeira loja`.

Moda, receita, vendas e carreira seguem a mesma lógica: "camisa + jaqueta + relógio + jeans = look"; "farinha + ovo + tempo = bolo"; "lead + conversa + prova = venda". Se a fala só enumera, sem um resultado, use `topicos` ou `passos`; a assinatura entra onde a fala conclui algo.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela ("compra por impulso" → "impulso"; "tem gente que perde" → "perda"), sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Confira toda conta.
- Número ilustrativo só onde o bloco permite (a curva de `tendencia`, um `numero` com `ilustrativo: true`), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta, a assinatura) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: procure a frase que conclui algo ("por isso…", "isso dá…", "é por causa de…") ou a pergunta que o próprio vídeo responde, e use a `coluna` de palavras ou a `resultado` (veja acima).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Quadros sem a letra manuscrita (fonte genérica) ou render parado esperando**: sem internet as fontes do Google não carregam. Conecte e rode de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano (vale para a legenda); na lousa, escreva o texto certo no bloco.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto escrito um pouco depois da palavra no começo de uma página**: é proposital. A página anterior fica inteira um instante, o apagador limpa e só então a nova é escrita (até ~1 s; um pouco mais quando o resultado anterior foi circulado). Use `"legenda": true` na página para a fala não ficar sem apoio; o título ao lado da janela sai na palavra.
- **Texto pequeno demais**: passou do limite do bloco e encolheu; encurte com as palavras da fala (limites em `references/plano.md`) ou use menos itens.
- **O canto ao lado da janela ficou vazio**: o bloco foi para o canto sem `titulo`. Dê um `titulo` (palavras da fala) ou ponha `"layout": "alto"`.
- **Rosto cortado ou pequeno na janela**: ajuste `caixas` no plano (zoom menor mostra mais; `ancoraY` sobe ou desce o rosto).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
