---
name: modelo-convite-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Convite. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Convite: papelaria fina sobre linho azul-pó. A pessoa vira a foto em arco de um convite de papel algodão, um lacre de cera azul estampa, os títulos se escrevem a pena em caligrafia e cada ideia vira um cartão que cai na pilha, com fita de cetim e um mostrador que gira. Serve para qualquer assunto (o exemplo do modelo é um cerimonialista, mas funciona com finanças, cripto, tecnologia, saúde, vendas, aulas, histórias…): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Convite\", \"estilo convite\", \"papelaria\" ou \"elegante, de casamento\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa em tela cheia como base; nos blocos, a pessoa na foto em arco à direita e a explicação à esquerda)."
---

# Modelo Convite (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Convite no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, papéis, a tinta que corre na fala, o lacre, a fita, o mostrador, a pilha de cartões e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** Nos trechos sem momento, a pessoa fala em tela cheia, como foi gravada (o vídeo deitado inteiro), com a legenda num cartão de papel algodão no terço de baixo. O bloco abre **só quando acrescenta clareza** à fala e a pessoa volta à tela cheia quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Quando um bloco entra, o vídeo se fecha na foto em arco do convite, que fica sempre do lado **direito** (a moldura), com o rosto centralizado e acompanhado suavemente quando a pessoa se mexe. O bloco ocupa o lado **esquerdo** (o quadro): no convite grande, o texto à esquerda da foto; no cronograma e na mesa, a fita no alto, o mostrador e a pilha de cartões. Terminada a ideia, a foto abre de novo até a tela inteira.
- **A foto não troca de lado.** No vertical a foto pequena alternava de lado a cada cartão; no deitado ela fica sempre à direita (o campo `pessoa` dos blocos não muda nada aqui) e o movimento vem do cartão que cai, da fita que corre e do mostrador que gira.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s. Um buraco de 2 s ou mais entre dois momentos vira tela cheia; menor que isso, o bloco anterior continua. Bloco com menos de ~2,5 s não dá tempo de ler.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira uma suíte de papelaria fina pousada numa mesa de linho: a pessoa é a foto em arco de um convite, um lacre de cera estampa o monograma, cada palavra importante se escreve a pena no tempo da fala e cada ideia vira um cartão que cai na pilha. Elegante e calmo, nunca enfeitado.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um cerimonialista falando de casamento, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo é papel que pousa decidido e assenta, sem quique. O texto já está escrito a lápis e cada palavra ganha tinta chocolate no instante em que é dita, como a pena correndo. Números contam, a fita de cetim se desenrola até o marco dito, o mostrador gira, o lacre levanta e estampa de novo nas batidas fortes. Nas trocas, o convite encolhe ou cresce enquanto o cartão novo desliza por baixo dele: nunca um quadro vazio.
- **Organização e hierarquia:** a tela cheia (a pessoa com a legenda) e quatro estados de papel. **Convite grande:** o convite deitado, com a foto em arco à direita e uma ideia grande à esquerda (abertura, número, definição, destaque, frase, pergunta). **Cronograma** (a assinatura): o convite encolhe para o lado direito, a fita corre no alto do quadro da esquerda, o mostrador gira ao lado da pilha e um cartão cai nela (marcos e passos). **Mesa:** o mesmo arranjo sem fita nova, o cartão traz a lista, a comparação ou o gráfico. **Final:** o convite volta grande por cima da pilha aberta em leque. Em cada tela, uma coisa grande (o título em caligrafia, o número, o numeral do mostrador) e o resto menor.
- **Tipografia:** Great Vibes (caligrafia) só nas palavras curtas de destaque; Cinzel (letra gravada, caixa-alta espaçada) nos números, letreiros e rótulos; EB Garamond 600 e itálico nos itens, frases e legenda. Texto com algarismo ou símbolo ("Ctrl + T", "R$ 500") vai em letra gravada, nunca em caligrafia. Tudo medido para caber: corpo mínimo 44 px no texto e 30 px nos letreiros.
- **Moldura da pessoa:** dois lugares. **Tela cheia**, como foi gravada, nos trechos sem momento; ou a **foto em arco** do lado direito, com moldura de dois fios, nunca recortada do fundo, nunca coberta: grande (538×720) no convite, um pouco menor (488×654) quando o bloco tem mais texto, pequena (472×590, rosto com ~255 px) no cronograma e na mesa. O vídeo se fecha no arco (e abre de volta até a tela inteira) em 0,78 s, começando um pouco antes do corte. O template mede o rosto pelo rastro do `cortar.mjs` para ele ter na foto a mesma presença do vertical, e a foto segue o rosto quando a pessoa se mexe.
- **Cores, textura e som:** linho azul-pó com trama, papel algodão com grão, tinta chocolate, fita de cetim chocolate, cera azul como único acento e uma tinta vermelha apagada só para alerta, risco e o lado errado. Sons raros e tonais: o baque da cera no lacre, uma nota que sobe a cada cartão que pousa, um sopro grave quando a fita entra, um acorde curto no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e o modelo de transcrição, 1,6 GB, uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala ("Carla" / "Nutrição"): vão na assinatura do convite, e a inicial do nome vira o monograma do lacre. Sem resposta, siga sem nome (o lacre leva um ornamento).

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

- **tentativas abandonadas e repetidas** (a mesma frase começada várias vezes): fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala, que costuma esconder repetições. Trecho marcado `[sem transcrição: ouça antes de tirar]`: se for fala, deixe.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre frases viram cortes, e é nos cortes que o layout troca** (o vídeo abre ou fecha na foto, o convite encolhe, um cartão cai): o movimento esconde o pulo do corte. Vale manter a proposta do `preparar`, com cada trecho de fala separado.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.49 --rosto-y 0.30 --queixo-y 0.41
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para a foto em arco. Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. A `zona` que o script calcula não é usada aqui. Leia os avisos que o script imprime. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a foto em arco acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

Se o `preparar` avisou "tempos do Whisper quebrados" em algum trecho, as palavras dele foram redistribuídas e podem estar alguns décimos fora: confira nos quadros do passo 8 se cada palavra ganha tinta na hora certa e, se não, acerte o `em` no plano.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias. Sem momentos no plano, a pessoa aparece em tela cheia: a cruz azul tem que cair no centro do rosto (entre os olhos e a ponta do nariz); as linhas azuis verticais são as margens laterais do YouTube; a caixa amarela é a faixa da legenda; a linha vermelha é o limite dos controles do player. Depois de planejar, `node scripts/stills.mjs --guias 5 10` mostra a foto em arco de um bloco: a caixa roxa é a foto (o rosto tem que estar inteiro dentro dela, centralizado, com respiro em cima).

O template já mede o tamanho do rosto pelo rastro. Se mesmo assim o rosto ficar grande demais na foto (cabelo cortado pelo arco): `"pessoa": { "zoom": 0.86 }` no plano; pequeno demais: `1.15`.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`marco` ou `passos`) entra pelo menos uma vez, de forma metafórica se o assunto for outro (veja "A assinatura em qualquer assunto").

Pense também no ritmo do estilo e da aula: a tela cheia é a base, e o bloco entra onde ajuda a entender, não em toda frase. Alterne a tela cheia (respiros de 2 a ~8 s, com legenda), o convite grande e a mesa ou o cronograma (a pessoa muda de tamanho a cada troca). Três blocos de convite grande seguidos deixam o vídeo parado no mesmo enquadramento.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, os limites de texto, as regras de tempo e dois exemplos completos) e preencha em `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `monograma` e `pessoa`).

Depois:

- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda (só aparecem em trechos sem momento, na tela cheia, num cartão de papel no terço de baixo).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um depois de cada palavra-chave (todo campo `em` ou terminado em `Em`) e um depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:

- o texto cabe, está inteiro e dá para ler? (o template encolhe o texto até 44 px; se ficou pequeno, encurte com as palavras da fala);
- cada palavra ganha tinta quando é dita? O número conta até o valor certo?
- o rosto está inteiro e centralizado na foto em arco da direita, sem nada por cima?
- na tela cheia, a legenda cabe no cartão e nada fica abaixo de y 984 (controles do player)?
- tem erro de digitação ou acento?

Confira também o **meio das trocas** (o `de` de alguns momentos + 0,1 a 0,4 s, por exemplo `node scripts/stills.mjs 8.8 17.4 30.2`): o vídeo abre ou fecha na foto, o convite encolhe ou cresce enquanto o cartão novo entra por baixo; nenhum quadro com a pessoa sozinha num fundo vazio, nenhum texto por cima do vídeo, nenhum texto fantasma por cima de outro. Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-convite.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio. Entregue:

- o caminho do arquivo (horizontal 1920×1080);
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (gráfico de tendência, número marcado `ilustrativo`);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um ícone escolhido para ilustrar uma fala).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `convite`) | convite grande: o título se escreve a pena à esquerda da foto (curto, inteiro em caligrafia; longo, em itálico com o `destaque` em caligrafia), o ornamento se desenha e o lacre estampa na base da foto |
| lista | `topicos` | mesa: o mostrador conta 1 · 2 · 3; o cartão cai na pilha com o `titulo` em caligrafia e os itens a lápis, cada um ganha tinta (e um losango azul ou um ícone) na sua palavra |
| passos | `passos` | **cronograma** (assinatura): a fita se desenrola marcando I · II · III, o mostrador gira para cada numeral e o cartão traz os passos numerados em romanos azuis |
| número | `numero` | convite grande, como um "save the date": o rótulo em caligrafia e o número contando em letra gravada (formato pt-BR), com o ornamento embaixo |
| comparação | `comparacao` | mesa: o mostrador se divide em duas metades com o × (ou a seta de antes → depois); o cartão traz os dois lados separados por um filete; o vencedor ganha um lacre pequeno; o lado errado é riscado em tinta vermelha |
| gráfico | `grafico` | mesa: no cartão, barras de fita de cetim, linha a pena com losangos azuis ou anel (pizza); o mostrador mostra o valor da vez. Sem números ditos: uma curva a pena na direção dita, com "ILUSTRATIVO" |
| destaque | `destaque` | convite grande: a frase curta em caligrafia (vermelha no `alerta`), sublinhada a pena, e o lacre estampa de novo |
| definição | `definicao` | convite grande: o termo em caligrafia, o filete com o losango e o significado em itálico embaixo |
| frase | `frase` | convite grande: a frase em itálico palavra por palavra, o `destaque` em caligrafia, o `risco` riscado em tinta vermelha, a assinatura no pé |
| pergunta | `pergunta` | convite grande, como um cartão de resposta: a pergunta e, para cada opção, um quadradinho a pena e o texto |
| fechamento | `cta` | final: o convite volta grande sobre a pilha aberta em leque; a chamada em caligrafia (ou em itálico com o destaque em caligrafia azul), o ícone a pena num círculo, o lacre estampa de novo e a assinatura entra |
| **assinatura** | `marco` | **cronograma**: a fita se desenrola até o número dito, o mostrador gira para ele (o arco encolhe na proporção) e um cartão cai na pilha com o cabeçalho e até 4 itens com ícone |

## A assinatura em qualquer assunto

O cronograma (`marco` e `passos`) é a ideia de **"uma coisa depois da outra, marcada numa fita"**: etapas no tempo, uma contagem regressiva, uma lista numerada, o caminho até um resultado. Sem número dito, o marco ganha a posição dele (1, 2, 3); os passos ganham numerais romanos.

1. **Finanças / cripto.** "Eu analiso o mercado, os riscos e a escolha dos ativos." → `passos` com `titulo` "Como eu analiso" e três itens: a fita marca I · II · III e o cartão traz "O mercado · Os riscos · A escolha dos ativos". Outra fala, "Em 2021 foi a 69 mil, em 2022 caiu para 16 mil", vira dois `marco` com `numero` "21" e "22" e os valores nos itens.
2. **Saúde e rotina.** "Primeira semana, só caminhada. Segunda, corrida leve. Na terceira, intervalado." → três `marco` com `numero` "1", "2", "3", `unidade` "semana", `extenso` "Primeira semana", "Segunda semana", "Terceira semana" e um item cada ("Só caminhada"…).
3. **Algo bem distante: uma história pessoal.** "Com 18 eu saí de casa, com 25 abri a empresa, com 30 quebrei, com 32 recomecei." → quatro `marco` com `numero` "18", "25", "30", "32", `unidade` "anos" e um item cada: a fita conta a vida e o mostrador mostra a idade.
4. **Tecnologia.** "Três atalhos: Ctrl + Shift + T reabre a aba, Windows + V mostra o que você copiou…" → um `marco` por atalho, sem `numero` (vira 1, 2, 3), com o atalho no `extenso` (sai em letra gravada) e o que ele faz nos itens.

## Fidelidade

- Tudo na tela vem da fala: pode enxugar ("compra por impulso" → "Impulso"), não pode mudar o sentido.
- Não invente número, nome, preço, prazo nem fato. Se um bloco pede um dado que a fala não tem, use outro bloco.
- Número ilustrativo só onde o bloco permite (`grafico` com `tendencia`, `numero` com `ilustrativo`), e a etiqueta "ILUSTRATIVO" aparece.
- Ícones podem ilustrar o que foi dito (um relógio para "tempo"); na dúvida, deixe sem ícone (vira o losango azul).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele (lista, número, comparação, destaque…). Não use `--forcar`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou cartão apertado**: o template encolhe o texto para caber, até 44 px. Encurte com as palavras da fala, tire o `detalhe` de alguns itens ou divida o bloco em dois (limites em `references/plano.md`).
- **Pulo visível na troca de layout**: a fronteira do momento ficou longe de um corte. Mova o `de` do momento para o valor de `cortesEm` mais próximo.
- **Rosto pequeno, grande ou cortado em cima na foto em arco**: o template mede o rosto pelo rastro; se ainda assim ficar fora, `"pessoa": { "zoom": 1.15 }` aproxima ou `0.86` afasta; `"ancoraY"` (padrão 0,40) desce o rosto dentro da foto quando maior. O vídeo não passa de 1,5× o tamanho gravado: numa gravação muito aberta o rosto fica um pouco menor na foto.
- **Respiro piscando (o vídeo abre e fecha logo em seguida)**: um buraco de 2 s ou pouco mais entre dois blocos vira tela cheia. Encoste os blocos (o `ate` de um = o `de` do outro) ou deixe o respiro mais longo.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
