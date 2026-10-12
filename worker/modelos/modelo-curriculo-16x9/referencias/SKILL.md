---
name: modelo-curriculo
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Currículo: uma folha branca sobre uma mesa cinza é revisada a caneta vermelha enquanto a pessoa fala. As linhas nascem a lápis e ganham tinta palavra por palavra; a caneta risca, circula, abre chave, desenha gráficos e escreve notas à mão; a pessoa vira um bilhete adesivo de papel que muda de lugar a cada ideia (tela cheia, margem, embaixo, em cima). Serve para qualquer assunto (o exemplo do modelo é carreira, mas funciona com finanças, cripto, saúde, esporte, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Currículo\", \"estilo revisão\", \"caneta vermelha\" ou \"folha corrigida\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Currículo

O vídeo vira uma mesa de revisão. Uma folha de verdade (o documento do assunto: um currículo, uma análise, um plano de treino, uma redação) é corrigida a caneta vermelha enquanto a pessoa fala. Ela abre em tela cheia com um recorte de papel no peito; quando explica algo, vira um bilhete adesivo colado na margem da folha, com uma seta de caneta até o trecho de que fala; para um número, um gráfico ou uma comparação, a folha se aproxima e a pessoa desce para um bilhete largo embaixo; para uma pergunta, ela sobe para um bilhete grande em cima. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com carreira (três erros de currículo), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo acontece na palavra dita. Cada linha da folha nasce a lápis (cinza-claro) e ganha tinta palavra por palavra quando é falada; a caneta vermelha risca, circula, sublinha, abre chave, dá visto, liga números e desenha gráficos num gesto só, que acelera e freia como mão de verdade. O que ainda vai demorar aparece só como barras a lápis (o esboço do documento). A folha desliza e assenta; enquanto um momento dura, a câmera se aproxima devagar (3,5 %): nada fica parado. Nas trocas, a pessoa e a folha se movem juntas (0,6 s, começando em cima do corte): nenhum quadro vazio, nenhum texto sobre outro.
- **Organização e hierarquia:** uma folha só, que guarda as marcas: cada ideia vira uma seção, de cima para baixo, na ordem da fala, e a câmera anda até a seção da vez. Título do documento grande em serifa; títulos de seção em caixa alta espaçada; o texto da seção em serifa; o que a caneta escreve, à mão, em vermelho. A informação principal (o número, o termo, a pergunta) é a maior coisa da tela; o resto é menor ou fica a meio-tom.
- **Tipografia:** três fontes do Google Fonts, todas com I maiúsculo diferente de l e 1. Literata (a serifa do documento: títulos, linhas, números), Inclusive Sans (títulos de seção em caixa alta, a aba do bilhete, a legenda) e Playpen Sans (a letra da caneta). Linhas da folha de 34 a 56 px, números até 156 px, notas à mão de 30 a 46 px, nada abaixo de 30 px na tela; o texto é medido com a própria fonte, quebra em até 2 ou 3 linhas e diminui até um mínimo legível, nunca vaza.
- **Moldura da pessoa:** um bilhete adesivo de papel (papel quente, aba vermelha com o nome, sombra que enverga), sempre o próprio vídeo reenquadrado, com o rosto seguido quadro a quadro. Quatro lugares, escolhidos pelo tipo de cada momento: tela cheia (abertura, destaque, fechamento), bilhete na margem direita com seta de caneta (seções da folha), bilhete largo embaixo com a folha ampliada em cima (número, comparação, gráfico, reescrita) e bilhete grande em cima com a folha embaixo (pergunta, cronômetro). Nunca uma coluna vertical estreita; o bilhete nunca cobre o texto da seção (o texto da folha termina antes da margem dele).
- **Cores, textura e som:** mesa cinza-fria `#D3D8DE`, papel branco, bilhete `#FFFDF6`, tinta grafite `#1C2129`, lápis `#BAC0C8` e uma cor só de ênfase: o vermelho da caneta `#D9352A` (risco, círculo, nota, gráfico, alerta). Sombra de papel, nada de brilho. Sons tonais e raros: um tom grave quando a folha chega, uma nota curta em cada marca importante (sobe de altura), duas notas quando uma troca é aceita, um fecho no fim.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Finanças"): o nome vai na aba vermelha do bilhete e os dois na assinatura do fechamento. Sem resposta, siga sem nome (a aba vira "Comentário").
4. **O documento é do assunto, e neutro.** O título da folha é o tema do vídeo ("Bitcoin em alta", "Treino de corrida", "Sono"), um nome fictício (currículo) ou o título de um texto. Nunca o nome de uma pessoa real nem dados de contato. Tudo o que aparece escrito na folha sai da fala.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições. Itens marcados `[sem transcrição: ouça antes de tirar]` podem ser fala que o Whisper perdeu: só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as trocas de lugar da pessoa escondem os cortes** (o bilhete muda de lugar em cima do pulo). Pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.50 --rosto-y 0.305 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa gravação vertical em 9:16 (a pessoa é reposicionada em bilhetes); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, o documento e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: o bilhete da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Gravação perto da câmera (selfie) corta um pouco o topo da cabeça em tela cheia; nos bilhetes a cabeça aparece inteira. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul deve cair no rosto **dentro do bilhete da pessoa** (caixa lilás tracejada), em qualquer lugar em que ela esteja; a linha vertical fina marca o centro do quadro; a caixa amarela é onde ficam os cartões da tela cheia (o queixo tem que ficar acima dela); a linha laranja é o limite da interface do app em cima e a vermelha embaixo. Para conferir um lugar específico, passe tempos: `node scripts/stills.mjs --guias 5.5 13.5 17`. Se a cruz não estiver no rosto, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`marcar`, `riscar` ou `reescrever`) entra pelo menos uma vez**, mesmo que o assunto seja outro: veja "A assinatura em qualquer assunto".

Alterne os lugares da pessoa (o tipo do bloco decide): depois de duas ou três seções na margem, um número ou gráfico embaixo, um destaque em tela cheia ou uma pergunta em cima. Abra e feche em tela cheia (`abertura` ou `destaque` no começo, `cta` no fim) sempre que a fala permitir.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `documento`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, dado ou marca de caneta entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- a tinta e a caneta chegam logo depois da palavra dita?
- o texto cabe (nada passando da borda da folha, nada embaixo do bilhete)?
- o rosto está inteiro no bilhete e nada desenha por cima dele?
- no meio das trocas, a pessoa e a folha cruzam sem quadro vazio e sem cartão sobre a folha? Gere quadros a cada 0,05 a 0,1 s em volta de cada `de` (`node scripts/stills.mjs 8.6 8.7 8.8 8.9 9.0`);
- nada parado mais de ~2,5 s?
- nada importante abaixo da linha da interface do app?

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-curriculo.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho) e o documento que você criou para a folha;
- o que é ilustrativo (uma curva de tendência sem números ditos, um número marcado `ilustrativo`);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um resumo que você escreveu na nota da caneta).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | tela cheia: recorte de papel no peito; o título (2 ou 3 linhas, serifa) chega palavra por palavra; a caneta circula o `destaque` (uma palavra) ou o sublinha (um trecho) |
| lista | `topicos` | margem: uma seção com título em caixa alta; cada item ganha tinta na sua palavra e o marcador a lápis vira um visto de caneta; `detalhe` escrito à mão embaixo |
| passos | `passos` | margem: linhas numeradas à mão; a caneta circula o número no passo dito e liga um número ao próximo com um traço |
| número | `numero` | embaixo: a folha ampliada; o rótulo ganha tinta e o número grande (serifa, pt-BR, prefixo e sufixo menores) conta até o valor; a caneta circula; `ilustrativo` escrito à mão |
| comparação | `comparacao` | embaixo: duas colunas com fio no meio; × de caneta (`contra`) ou seta (`antes-depois`); o lado que perde é riscado e o que ganha leva caixa e visto (`errado-certo` = o segundo ganha) |
| gráfico | `grafico` | embaixo: desenhado a caneta na folha. `barras` = colunas vermelhas que sobem na palavra, valor à mão em cima; `linha` = pontos ligados a caneta; `pizza` = círculo em fatias de vermelho com legenda; sem números ditos = curva de tendência com seta e "ilustrativo" à mão |
| destaque | `destaque` | tela cheia: cartão no peito. `alerta` = "!" circulado e a frase escrita à mão em vermelho, dois traços embaixo; `chave` = a frase em tinta, sublinhada; `detalhe` menor embaixo |
| definição | `definicao` | margem: o termo em tinta, sublinhado; uma seta de caneta e o significado escrito à mão |
| frase | `frase` | margem: aspas de caneta e a citação ganhando tinta palavra por palavra; `destaque` sublinhado, `risco` riscado quando é dito |
| pergunta | `pergunta` | em cima: a pessoa num bilhete grande; a pergunta se escreve na folha embaixo, as `opcoes` em caixinhas desenhadas a caneta; um bilhete com "?" cola na margem |
| fechamento | `cta` | tela cheia: cartão com o ícone da ação, a chamada escrita à mão (o `destaque` sublinhado ou circulado), visto e assinatura |
| **assinatura** | `marcar` | margem: uma seção com 2 a 4 linhas que ganham tinta; a caneta abre uma chave nelas e escreve o diagnóstico (`nota`) e, depois de uma seta, a saída (`pergunta`) |
| **assinatura** | `riscar` | margem: a frase errada ganha tinta enquanto é dita, a caneta escreve por quê (`nota`) e risca |
| **assinatura** | `reescrever` | embaixo: a câmera chega perto de uma linha, ela é riscada palavra por palavra, a versão nova é escrita à mão e a troca é aceita |
| tempo | `cronometro` | em cima: um cronômetro de papel dá a volta enquanto a frase assenta; o olhar passeia pela folha revisada |
| excesso de volume | `paginas` | margem: as folhas abrem em leque, o número grande é riscado e corrigido, as que sobram levam um X |

## A assinatura em qualquer assunto

A assinatura é **a revisão a caneta**: o vídeo trata o assunto como um documento que está sendo corrigido. Em qualquer fala há algo para revisar:
- `marcar` = **um diagnóstico**: 2 a 4 coisas que a pessoa enumera (erros, causas, sintomas, hábitos, regras) ganham uma chave e uma nota que resume ("tarefas → resultados?", "briga → pausa", "80/20");
- `riscar` = **uma ideia errada**: um mito, uma crença, uma frase que não se deve dizer é escrita e riscada, com a nota do porquê;
- `reescrever` = **antes → depois**: a versão velha é riscada e a nova escrita à mão ("em vez de…, faça…").

Três exemplos fora de carreira:

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `marcar` com `secao: "Mesmo na alta"`, `subtitulo: "Tem gente que perde porque"` (ganha tinta na fala) e as linhas "Compra por impulso" (no "compra"), "Escolhe moeda sem critério" (no "escolhe"), "Assume risco que não entende" (no "assume"). Sem `nota`, a chave se fecha quando a última linha termina; se a fala segue com "como avaliar os projetos?", ela pode virar `pergunta: { "texto": "como avaliar?" }` depois da seta.
2. **Saúde e rotina.** "Muita gente acha que café à noite não atrapalha. Atrapalha. Em vez de 'vou dormir quando der', decide: deito às onze."
   `riscar` com `secao: "Mito"`, `frase: "Café à noite não atrapalha"` (ganha tinta na fala) e `nota: { "texto": "atrapalha" }` no "Atrapalha"; depois `reescrever` com `secao: "Sono"`, `antes: "Vou dormir quando der"`, `depois: "Deito às onze"`, `destaque: "onze"`.
3. **Bem distante (relacionamento).** "Três sinais de que a conversa vai virar briga: o tom sobe, entra a ironia e aparece a palavra 'sempre'. Nessa hora, pausa."
   `marcar` com `secao: "Sinais"`, as linhas "O tom sobe", "Entra a ironia", "A palavra 'sempre'" (cada uma na sua palavra), `nota: { "texto": "briga" }` no "briga" e `pergunta: { "texto": "pausa" }` no "pausa".

Esporte (corrida): "Devagar no dia a dia. Forte de vez em quando." vira `marcar` com `secao: "Intensidade"`, as duas linhas e `nota: "80/20"` (resumo dos números ditos logo antes). Se a fala não parece ter lista, mito nem troca, procure de novo: quase todo vídeo tem um "o erro é…", um "não faça…" ou um "em vez de…".

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido. Nota da caneta que resume (como "80/20") só com dados ditos.
- Não invente número, nome, preço, taxa nem fato. O cronômetro só mostra número se ele foi dito; o gráfico sem números ditos usa `tendencia` com `ilustrativo: true`.
- Número ilustrativo só onde o bloco permite, sempre com a nota "ilustrativo" visível.
- O título da folha e as seções `extras` são neutros: nunca o nome de alguém real, nem dados de contato.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure a lista que vira diagnóstico (`marcar`), a ideia errada (`riscar`) ou a troca (`reescrever`); veja os exemplos acima.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A marca de caneta cai antes ou depois da palavra**: o `em` está errado; confira em `work/palavras.json`. Para frases (`frase`, `riscar.frase`, `reescrever.antes/depois`, `abertura`, `cta`), o template acha o tempo de cada palavra sozinho, mas só se as palavras forem as da fala, na mesma ordem.
- **Texto pequeno ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **O rosto corta no bilhete** (cabeça alta, enquadramento fechado): use `caixas` no plano para baixar o zoom daquele lugar (`references/plano.md`).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução; o vídeo sai menos nítido. Avise o usuário.
