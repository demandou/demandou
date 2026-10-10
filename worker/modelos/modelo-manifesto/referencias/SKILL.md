---
name: modelo-manifesto
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Manifesto: as ideias viram pôsteres tipográficos em tela cheia (campo sólido azul-cobalto, branco frio ou preto, fonte larga e pesada em caixa-alta, cada palavra ganhando tinta no instante em que é dita) e a pessoa continua falando DENTRO das letras de uma palavra gigante; entre os pôsteres ela volta ao quadro cheio, com legenda, e números e alertas entram numa placa no peito. Serve para qualquer assunto (o exemplo do modelo é motivacional, mas funciona com cripto, finanças, saúde, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Manifesto\", \"estilo manifesto\", \"vídeo dentro das letras\", \"texto com o vídeo dentro\" ou \"pôster tipográfico\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Manifesto

O vídeo vira um manifesto colado na parede, frase por frase. Quando uma ideia merece parede, um pôster de cor chapada cobre a tela, o texto se escreve palavra por palavra e uma palavra curta vira uma janela gigante: a pessoa continua falando dentro das letras, com o rosto na primeira linha. Entre um pôster e outro ela volta inteira, em quadro cheio, com legenda grande; números e alertas batem numa placa na altura do peito. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor e de diretor de arte (escolher as tomadas, traduzir a fala em blocos, escolher a palavra-janela, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma fala motivacional, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo já está no pôster "a lápis" (apagado, no tamanho e no lugar certos) e cada palavra ganha tinta, da esquerda para a direita, no instante em que é dita. A palavra-janela abre quando é dita: as letras chegam um pouco maiores e assentam em volta do rosto, com um golpe grave. Riscos passam na palavra negada; contadores trocam secos ("01" → "02"); números contam; colunas e linhas grossas se desenham. O pôster entra seco num corte (ou colado no anterior) ou sobe como uma folha de borda seca; sai "mergulhando" na janela, com um círculo que abre a partir do rosto. Nada de véu, transparência, quique ou brilho.
- **Organização e hierarquia:** uma ideia por pôster, tudo centralizado numa pilha vertical montada em volta do rosto: o que vem antes da palavra-janela fica acima dela, o que vem depois fica abaixo. A palavra-janela é a maior coisa da tela; o trecho de `destaque` vem grande e na cor de acento; o resto, menor. Letreiros fixos nos cantos de cima: "Nº 01" (o número do pôster) à esquerda, a área de quem fala à direita.
- **Tipografia:** Unbounded (larga e pesada) sempre em CAIXA-ALTA: 900 nas palavras grandes, 700 nas pequenas; DM Mono nos letreiros. O texto é medido com as larguras da fonte e diminui até caber (nunca vaza); mínimo de 56 px nas linhas do pôster e 44 px nos detalhes. Nada condensado, espaçamento entre letras de −0,02 em.
- **Moldura da pessoa:** dois lugares. **Quadro cheio**, com o rosto na linha do centro, legenda abaixo do queixo e, às vezes, uma placa no peito (número, destaque); ou **dentro das letras** da palavra-janela do pôster, com uma luz suave só em volta do rosto para ele continuar inteiro onde um vão de letra passa. O vídeo nunca é recortado do fundo nem distorcido: só desliza e aproxima por igual, e segue o rosto quadro a quadro. Sem palavra curta no bloco, a pessoa aparece num círculo de borda seca.
- **Cores, textura e som:** preto `#0A0A0C`, azul-cobalto `#2A3CFF` e branco frio `#EEEFF1`. Três campos de pôster: **cobalto** (letras brancas, acento preto), **papel** (letras pretas, acento cobalto) e **preto** (letras brancas, acento cobalto, para alerta). Os campos se alternam sozinhos. Sons tonais e raros: golpe grave quando a janela abre, toques em escada nos riscos, itens e degraus, duas notas suaves na chamada final.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; as fontes Unbounded e DM Mono vêm do Google Fonts na hora do render). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Liderança"): a área aparece no canto de cada pôster e os dois vão na assinatura do `cta`. Sem resposta, siga sem nome.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições. Itens marcados `[sem transcrição: ouça antes de tirar]` podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

As pausas entre as frases viram cortes, e um pôster que começa num corte entra seco: o corte some. Mantenha a proposta do `preparar`; pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. **Meça com cuidado**: a palavra-janela de cada pôster é montada em volta deste ponto. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.35 --queixo-y 0.48
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa ocupa o quadro todo, por baixo dos pôsteres); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: as letras acompanham quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar. Gravação muito perto da câmera (selfie) funciona: o rosto fica grande dentro das letras, como um close.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no centro do rosto (entre os olhos e a ponta do nariz); a caixa azul tracejada é a faixa onde os pôsteres se montam; a amarela é a legenda do quadro cheio (deve começar abaixo do queixo); a laranja é o lugar do selo; nada importante abaixo da linha vermelha (interface do aplicativo). Se a cruz não estiver no rosto, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`cartaz` ou `escalada`) entra pelo menos uma vez**, seja qual for o assunto: veja "A assinatura em qualquer assunto".

**O ritmo do Manifesto é pôster × quadro cheio.** No mapa, alterne:
- no máximo **dois ou três pôsteres colados** seguidos (o novo entra seco no lugar do outro);
- depois, a pessoa volta: uma **placa** (`numero`, `destaque`) no quadro cheio, ou um respiro de 0,3 a 3 s só com legenda (a saída do pôster em círculo é o que dá o fôlego);
- abra com uma abertura forte (pôster ou placa) e feche com o `cta`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, a escolha da palavra-janela, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, opção ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`. O texto de tela usa as palavras da fala, na ordem em que foram ditas.

**A palavra-janela** (campo `janela` nos blocos de pôster): uma palavra curta (2 a 6 letras) do próprio texto, dita com força, **de preferência do começo da frase**, porque o rosto fica na altura em que ela está. Sem `janela`, o template escolhe sozinho a melhor (de preferência a do `destaque`) e, sem nenhuma palavra curta, mostra a pessoa num círculo. Nas listas a janela é o contador "01, 02, 03"; na comparação, "VS".

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem no quadro cheio).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "100,00": "100 mil" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- **o rosto está dentro das letras?** Os olhos têm que cair na primeira linha da janela. Se o rosto ficou grande demais ou caiu num pedaço de letra, troque a palavra-janela (uma do começo do texto) ou deixe o template escolher;
- o texto cabe e lê no celular (nada abaixo de ~56 px nas linhas grandes)? Nada atrás da interface do app?
- a tinta de cada palavra entra quando ela é dita; o risco passa na palavra certa; o contador troca no item certo; o número conta na palavra dita?
- nada parado mais de ~2,5 s e o pôster não ficou com um terço vazio? Se ficou, use menos texto em cima da janela ou uma palavra-janela do meio do texto (o que vem depois dela vai para baixo);
- nas trocas, nenhum quadro vazio e nenhum texto sobre outro. Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 8.55 8.6 8.65 8.7`).

Corrija o plano (outra palavra-janela, texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-manifesto.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e qual palavra virou janela);
- o que é ilustrativo (gráfico de tendência sem números ditos, número marcado como ilustrativo);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | pôster: o texto se escreve palavra por palavra em volta da palavra-janela; o `destaque` vem grande, na cor de acento |
| lista | `topicos` | pôster: título em cima, a janela é o **contador** do item da vez ("01" → "02" → "03", troca seca com golpe), os itens empilhados embaixo, já "a lápis"; cada um ganha tinta na sua palavra e o anterior fica num tom mais claro |
| passos | `passos` | o mesmo pôster da lista, com uma **seta grossa de acento** que desce de um passo ao outro quando o próximo é dito |
| número | `numero` | **placa** no peito, no quadro cheio: rótulo em letreiro, o número vazado (a pessoa aparece dentro dos algarismos) contando em pt-BR, prefixo e sufixo menores, marcas que acendem enquanto conta; etiqueta ILUSTRATIVO quando for o caso |
| comparação | `comparacao` | **pôster dividido**: o lado 1 no campo de cima, o lado 2 no campo de baixo (as duas cores do modelo), a janela "VS" na emenda com o rosto dentro; o perdedor é riscado; o vencedor (ou o "depois") vem na cor de acento |
| gráfico | `grafico` | pôster com o desenho chapado embaixo da janela: `barras` = colunas sólidas que sobem e contam; `linha` = traço grosso de acento com quadrados nos pontos; `pizza` = anel grosso com a legenda ao lado; sem números ditos, a forma da `tendencia` (sobe, cai, oscila) com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | **placa** no peito: a palavra ou frase curta grande (vazada quando é uma palavra só); `alerta` = placa preta com um traço cobalto que se desenha; `detalhe` menor embaixo |
| definição | `definicao` | pôster: o termo grande, um "=" na cor de acento e o significado escrito embaixo no `significadoEm` |
| frase | `frase` | pôster: a frase em volta da palavra-janela; `destaque` grande e na cor de acento; `risco` riscado quando é dito |
| pergunta | `pergunta` | pôster: a pergunta em volta da janela e as `opcoes` empilhadas embaixo, separadas por um "ou" em letreiro de acento, cada uma na sua palavra |
| fechamento | `cta` | pôster final: ícone (seguir, salvar, comentar, link) antes da primeira linha, a chamada com a janela, a assinatura (nome e área) sobre um filete; fica até o fim |
| **assinatura** | `cartaz` | o pôster livre do manifesto: linhas em cima (`topo`), a palavra-janela, as **negações riscadas** uma a uma (`negacoes`) e as linhas de baixo (`base`), cada uma com o tamanho que você der |
| **assinatura** | `escalada` | a frase que cresce: dois ou três degraus que entram cada vez maiores (o anterior encolhe e vira rastro no topo; um degrau pode entrar torto) e terminam na janela gigante |
| batida no quadro cheio | `selo` | placa pequena com texto vazado e marcas que acendem (um prazo que vira "AGORA."); mantém a legenda |

## A assinatura em qualquer assunto

A assinatura do Manifesto é **a palavra-janela com a pessoa dentro**, e os dois pôsteres que só ele tem:

- **`cartaz`: o pôster da tese.** Serve para qualquer frase que merece parede e, principalmente, para **o que não é** ("não é X, não é Y"): as negações aparecem a lápis e são riscadas uma a uma quando ditas. Qualquer "isso não significa aquilo", "não é sorte", "sem promessa", "esqueça X" vira cartaz.
- **`escalada`: a frase que cresce.** Serve para qualquer gradação de 2 ou 3 passos curtos que pioram, melhoram ou se repetem ("começa pequeno, começa torto, mas começa"; "compra por impulso, escolhe sem critério, assume risco"), terminando numa palavra curta que vira janela.

Três exemplos fora do nicho do demo:

1. **Cripto/finanças.** "Mas o mercado subindo não significa dinheiro no bolso." → `cartaz`: `topo` "O MERCADO SUBINDO" (84 px), `janela` `["NÃO"]` no "não", `negacoes` `[{ antes: "SIGNIFICA", palavra: "DINHEIRO", riscoEm }]`, `base` "NO BOLSO" (150 px). Logo depois, "tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende" → `escalada`: degraus "COMPRA / POR IMPULSO." e "ESCOLHE / SEM CRITÉRIO." (torto), `final` com `antes` "ASSUME" e a janela `["RIS", "CO"]`.
2. **Saúde (sono).** "Dormir bem não é luxo, não é preguiça, não é tempo perdido. É você se recuperando." → `cartaz` com janela `["NÃO"]`, `batidas` nos outros "não" e três `negacoes` (LUXO, PREGUIÇA, TEMPO PERDIDO), seguido de uma `frase` "É você se recuperando" com janela "VOCÊ".
3. **Relacionamento / história pessoal.** "Primeiro eu ignorei. Depois eu justifiquei. Até que eu fui embora." → `escalada`: degraus "IGNOREI" e "JUSTIFIQUEI" (torto), `final` com `antes` "ATÉ QUE" e a janela `["FUI"]`; ou "Amor não é ciúme, não é controle" → `cartaz` com as negações CIÚME e CONTROLE.

Outros usos: um "não" de vendedor ("não é desconto, é valor"); uma aula ("não decore, entenda"); uma receita ("sem farinha, sem açúcar, sem culpa"). Se a fala não tem negação nem gradação, o `cartaz` serve como a frase mais forte do vídeo (topo + janela + base com os tamanhos que você escolher).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido. A palavra-janela é uma palavra do texto do bloco (ou o contador, ou "VS").
- Não invente número, nome, preço, taxa nem fato. Gráfico sem números ditos usa `tendencia` com `ilustrativo: true` (a etiqueta aparece sozinha).
- Número ilustrativo só onde o bloco permite (`numero` com `ilustrativo: true`), sempre com a etiqueta visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure na fala um "não é", um "sem", um "isso não significa" (→ `cartaz`) ou uma gradação de 2 ou 3 passos (→ `escalada`). Sem nada disso, use o `cartaz` para a frase mais forte.
- **O rosto ficou muito grande, cortado ou fora das letras**: a palavra-janela está no fim de um texto longo e o vídeo teve de aproximar para levar o rosto até ela. Escolha uma palavra do começo do texto, encurte o que vem antes dela, ou tire `janela` e deixe o template escolher.
- **Pôster com um terço vazio embaixo**: há texto demais acima da janela e nada abaixo. Use uma palavra-janela do meio do texto (o resto vai para baixo dela) ou junte a frase seguinte ao bloco.
- **Pôsteres demais seguidos**: a pessoa some do quadro cheio. Troque um deles por uma placa (`numero`, `destaque`) ou deixe um respiro de meio segundo entre dois pôsteres.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
