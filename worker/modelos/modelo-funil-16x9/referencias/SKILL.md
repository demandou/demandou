---
name: modelo-funil
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Funil: um gráfico de jornal em papel cinza que se monta ao vivo na fala (pontos que são pessoas caem e descem por um funil, contadores, listas, passos, comparações e gráficos feitos de pontos), em grafite, com laranja só para o problema e verde só para o conserto, e a pessoa num bloco ao lado que acompanha o item da vez e volta ao quadro cheio nas frases fortes. Serve para qualquer assunto (o exemplo do modelo é marketing, mas funciona com cripto, saúde, vendas, carreira, aulas, histórias): a IA traduz a fala para os blocos do estilo e usa o funil como metáfora de muitos começam, poucos chegam. Use sempre que o usuário pedir para editar \"no modelo Funil\", \"estilo funil\", \"com o funil animado\" ou \"com gráfico de jornal\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Funil

O vídeo vira um gráfico de dados que se monta enquanto a pessoa fala, como os de um bom jornal impresso. Ela abre em quadro cheio com um cartão grafite no peito; quando explica algo, encolhe para um bloco à direita e a tela vira uma página de papel: um funil cujos pontos (pessoas) descem pelo gargalo, uma lista, um tubo de passos, uma comparação ou um gráfico de pontos. O bloco desce junto com o item da vez. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com marketing (anúncio → clique → checkout → compra), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo se monta na fala. Palavras sobem de trás de uma régua no instante em que são ditas; números contam até o valor; pontos (pessoas) caem e assentam como areia, descem pelo gargalo e quem fica pelo caminho apaga; traços se desenham. Antes de ser dito, cada coisa já aparece "a lápis" (apagada, tracejada): nunca há caixa vazia. Entra decidido e assenta, sem quique. Entre duas páginas, uma régua grafite desce pela tela como uma cortina: acima dela já é a página nova, abaixo ainda é a velha. Nunca dois textos um sobre o outro: o cartão sai antes de a página aparecer, e a página apaga antes de o cartão entrar.
- **Organização e hierarquia:** uma ideia por tela. Na página, o conteúdo fica numa coluna à esquerda, de cima para baixo (título → itens), e a pessoa fica no bloco à direita, na altura do item da vez. Um item grande por vez; rótulos, detalhes e escalas menores. Etiqueta "ILUSTRATIVO" no alto quando o desenho não vem de números ditos.
- **Tipografia:** uma família só, Schibsted Grotesk (grotesca de jornal, o "I" tem serifa): 800 em títulos, números e itens; 600–700 em rótulos e detalhes. Algarismos de largura igual nos contadores. Títulos de 56 a 104 px, itens de 44 a 96 px, nada abaixo de 30 px; o texto diminui para caber, nunca vaza.
- **Moldura da pessoa:** dois lugares. Quadro cheio, com o rosto na linha do centro e um cartão grafite na altura do peito (abertura, número, destaque, frase, pergunta, fechamento); ou o **bloco**, um retrato de 380 a 440 px com fio grafite e o nome, à direita da página, que acompanha o item da vez (no funil, desce junto com o fluxo). A troca é a própria caixa da pessoa encolhendo ou crescendo; o rosto é seguido quadro a quadro.
- **Cores, textura e som:** papel cinza-quente com grade de pontos, grafite, um tom de miolo. Laranja de sinal **só** para o problema (o que vaza, o que é riscado, o alerta); verde **só** para o conserto (o que passa a mais depois de consertar, o lado certo). Sons tonais e raros: um "vum" grave quando a página abre, gotas quando itens e etapas entram, duas notas descendo no alerta, duas subindo no conserto, um fecho no fim.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Tráfego pago"): o nome vai na etiqueta do bloco e, com a área, na assinatura do fechamento. Sem resposta, siga sem nome.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições (ou uma fala lenta, como "quatro… sete… oito").

**Números curtos ditos sozinhos** ("Mil.", "Cem.") às vezes voltam como `[sem fala, sai]`. Antes de aceitar um item desses no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala. Se for fala, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo: `{ "em": 3.18, "ate": 3.4, "w": "Mil" }`).

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre as frases viram cortes, e é nelas que a pessoa costuma trocar de lugar** (encolhe para o bloco ou volta ao quadro cheio): o movimento esconde o pulo do corte. Mantenha a proposta do `preparar`; pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.425
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa muda de lugar entre o quadro cheio e o bloco); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto e a linha vertical fina mostra o centro do quadro (o rosto deve estar nela); a caixa azul tracejada (cartões de quadro cheio) deve começar abaixo do queixo; a roxa é a área do funil; as laranja são a faixa por onde o bloco da pessoa anda; a amarela é a legenda; nada importante abaixo da linha vermelha (interface do aplicativo). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`funil`, e de preferência também o `conserto`) entra pelo menos uma vez**, mesmo que o assunto não tenha números: veja "A assinatura em qualquer assunto".

Alterne os dois lugares: depois de uma ou duas páginas, uma frase ou um destaque em quadro cheio, e vice-versa. Abra e feche em quadro cheio.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, etapa, lado ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "478": "4-7-8" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe (nada cortado, nada embaixo do bloco da pessoa)?
- o número certo aparece quando a palavra é dita?
- o bloco da pessoa está ao lado do item da vez, com o rosto inteiro e sem cobrir nada?
- no funil: o rótulo de cada etapa cabe à esquerda, o alerta acende no passo certo, o conserto também?
- nada parado mais de ~2,5 s, nenhum quadro vazio e nenhum texto sobre outro no meio das trocas? Gere quadros a cada 0,05 s em volta de cada troca (`node scripts/stills.mjs 8.45 8.5 8.55 8.6 8.65`)?
- nada importante abaixo da linha da interface do app?

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-funil.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (pontos do funil sem números ditos, ganho de um conserto sem taxa, curvas de tendência);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `gancho`) | quadro cheio: cartão grafite no peito, título que acende palavra por palavra; o `destaque` fica laranja e uma fileira de pontos cai quando ele é dito. No começo do vídeo, o primeiro quadro mostra o texto inteiro (capa) |
| lista | `topicos` | página: cada item é uma linha com um ponto grafite que cai e assenta; divisas finas entre as linhas; o bloco desce para o item da vez |
| passos | `passos` | página: o gargalo do funil vira um tubo dividido em seções numeradas; um ponto desce seção a seção e pousa no número do passo dito |
| número | `numero` | quadro cheio: cartão com o número contando em pt-BR (prefixo e sufixo menores) e uma régua com o marcador correndo; até 12 inteiros, pontos que caem um a um; em %, uma grade de 100 pontos que se enche |
| comparação | `comparacao` | página: dois lados um embaixo do outro, cada um com um selo (o nome do lado) e o texto grande; × no meio (`contra`) ou ↓ (`antes-depois`, `errado-certo`); o errado leva risco laranja, o certo selo verde; o bloco desce para o lado da vez |
| gráfico | `grafico` | página: `barras` = fileiras de pontos (cada ponto vale um número redondo, o último pode ser parcial); `linha` = pontos ligados por um traço; `pizza` = grade de 100 pontos; sem números ditos = curva (ou colunas de pontos) com a etiqueta ILUSTRATIVO; o bloco acompanha o dado da vez |
| destaque | `destaque` | quadro cheio: a palavra grande; `alerta` = laranja, ícone de alerta e pontos que caem; `chave` = branco com sublinhado que se desenha |
| definição | `definicao` | página: o termo grande enche a boca de um funil pequeno; no significado, três pontos passam pelo bico e o significado se escreve embaixo |
| frase | `frase` | quadro cheio: cartão com o texto; `destaque` em laranja; `risco` riscado em laranja quando é dito |
| pergunta | `pergunta` | quadro cheio: cartão com um "?" num círculo branco e a pergunta; as `opcoes` entram como etiquetas, cada uma na sua palavra |
| fechamento | `cta` | quadro cheio: ícone num quadrado branco, a chamada com o `destaque` sublinhado e a assinatura (nome e área) |
| **assinatura** | `funil` | página: o funil desenhado (largura de cada etapa = quantos chegam lá), os pontos enchem a boca e descem a cada etapa dita, quem fica apaga; contadores e taxas quando há números ditos; só os rótulos e a etiqueta ILUSTRATIVO quando não há |
| **assinatura** | `conserto` | o mesmo funil de volta: o passo que vaza pisca em laranja (`alertas`), o conserto o deixa verde e mais pontos descem em verde, o funil engrossa embaixo |

## A assinatura em qualquer assunto

O funil mostra **"muitos começam, poucos chegam"** e **onde se perde gente pelo caminho**; o conserto mostra **o que faz mais gente passar**. Quase toda fala tem isso: um processo em que muitos desistem, erram ou se dispersam, uma sequência que vai filtrando, um resultado que poucos alcançam. Os números são opcionais:

- **Sem números** (só texto): escreva as etapas sem `valor`. O funil usa proporções ilustrativas, não mostra número nenhum e põe a etiqueta ILUSTRATIVO. Os motivos de perda viram `alertas` (laranja) nos passos.
- **Taxas ditas** ("só 10% clicam"): `taxa` na etapa; a base ilustrativa é 100.
- **Números parciais** ("de 200, só 3"): `valor` só nas etapas ditas; as outras ficam sem número na tela.
- **Conserto sem taxa**: deixe `taxa` de fora; o ganho é ilustrativo (a taxa dobra) e a tela não inventa porcentagem; `texto` dá nome ao conserto no selo verde.

Três exemplos fora do marketing:

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento?"
   `funil` sem números: "Entram na alta" (em "alta") → "Compram por impulso" (em "compra") → "Escolhem sem critério" (em "escolhe") → "Poucos lucram" (em "risco", `passo: "risco"`), com `alertas` em "impulso", "critério" e "entende". Depois um `conserto` sem taxa: o passo do critério fica verde em "avaliar" (`texto: "avaliar"`) e o do risco em "posicionamento".
2. **Saúde (respiração e ansiedade).** "Inspira pelo nariz contando até 4, segura o ar contando até 7, solta devagar pela boca contando até oito."
   `funil` sem números com `unidade: "agitação"` ("● = agitação"): "Inspira até 4" → "Segura até 7" → "Solta até 8". A cada fase, menos agitação passa; os 4, 7 e 8 entram no rótulo na hora em que são ditos.
3. **Carreira (números parciais e conserto sem taxa).** "Mandei uns 200 currículos, consegui 3 entrevistas e nenhuma proposta. Quando reescrevi o perfil, as entrevistas voltaram."
   `funil`: "Currículos enviados" (`valor: 200`) → "Entrevistas" (`valor: 3`, `passo: "perfil"`) → "Propostas" (sem `valor`); `alerta` no passo do perfil em "nenhuma"; `conserto` em "reescrevi" sem `taxa`, `texto: "perfil novo"`: os pontos verdes descem e os números que mudam aparecem com "≈".

Outros usos: alunos que começam um curso e poucos terminam; leitores que abrem um e-mail e poucos clicam; casais que começam a terapia e desistem no meio; uma receita em que cada etapa "filtra" o erro mais comum. Se a fala tem um processo em etapas sem perda nenhuma, use `passos`; se tem uma perda, use o `funil`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Etapa sem número dito fica sem número na tela.
- Número ilustrativo só onde o bloco permite (os pontos do funil, a curva de tendência, o ganho de um conserto sem taxa), sempre com a etiqueta ILUSTRATIVO visível ou o "≈".

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure o "muitos começam, poucos chegam" ou "onde se perde" na fala e use o funil sem números (veja acima).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **O número de uma etapa sumiu do vídeo**: o "Mil." curto saiu como `[sem fala, sai]` no passo 3. Volte, meça o volume, marque `"manter": true` e rode o `cortar` de novo com `--manter-plano`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Rótulo do funil apertado à esquerda**: encurte ("chegam ao checkout" → "no checkout") ou use menos etapas; sem números o funil já fica mais estreito para os rótulos caberem.
- **O bloco da pessoa ficou mais baixo do que a etapa de que ela fala**: no funil ele só cabe ao lado das etapas onde o funil já afinou; nas de cima ele espera logo abaixo da boca. Nas outras páginas ele não desce até a zona dos botões do app. É o comportamento do modelo.
- **Rosto cortado no bloco**: ajuste `retrato` no plano (zoom menor mostra mais; `ancoraY` sobe ou desce o rosto).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
