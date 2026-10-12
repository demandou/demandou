---
name: modelo-janelas
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Janelas: a tela vira uma área de trabalho fictícia e clara (sem marca de sistema), a pessoa é a janela de uma chamada de vídeo que o mouse arrasta, minimiza e maximiza, e cada ideia abre a janela que a mostra (nota, assistente com etapas, painel com número, gráfico, dicionário, tela dividida, caixa de diálogo, notificação), com teclas grafite que afundam em violeta no instante em que são ditas. Serve para qualquer assunto (o exemplo do modelo é tecnologia, mas funciona com finanças, cripto, saúde, casamento, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo e usa as teclas como a combinação da ideia. Use sempre que o usuário pedir para editar \"no modelo Janelas\", \"estilo desktop\", \"estilo área de trabalho\", \"com teclas de atalho\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Janelas

O vídeo inteiro acontece numa área de trabalho calma e bem desenhada. A pessoa é a janela de uma videochamada: começa em tela cheia, o mouse a arrasta para o alto quando uma janela precisa de espaço, minimiza numa miniatura quando a janela precisa da tela, traz de volta pelo dock. Cada ideia dita abre a janela que a mostra, como num tutorial gravado, e as teclas grandes afundam no ritmo da fala. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com atalhos de teclado, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** movimento de sistema operacional. Janelas crescem a partir do ícone no dock (arranque rápido, assentamento macio, sem quique) e voltam para ele; o texto é digitado com cursor ou sobe de trás de uma régua palavra por palavra, na fala; itens ocupam vagas tracejadas quando são ditos; números contam; o mouse arrasta, clica, seleciona, passa por cima. As teclas esperam "a lápis", ganham corpo e afundam em violeta na palavra. Nas trocas, a janela nova abre já na fronteira, opaca, por cima da que sai, enquanto a pessoa muda de lugar: nunca um quadro vazio, nunca dois textos um sobre o outro.
- **Organização e hierarquia:** uma janela por ideia, grande (92% da largura), sempre num lugar que não cobre o rosto: embaixo da pessoa, em cima da miniatura ou no peito (tela cheia). Barra de título pequena (o "app"), a frase dita grande, os itens em linhas com ícone, o item da vez selecionado em violeta. O que ainda não foi dito espera tracejado.
- **Tipografia:** Atkinson Hyperlegible Next (interface; o "I" tem serifa e o "l" tem cauda) de 500 a 800, e JetBrains Mono para teclas, números, endereços e valores. Títulos 56–124 px, textos de corpo ≥ 44 px, rótulos ≥ 30 px; todo texto é medido e reduzido até caber, em até 2 ou 3 linhas.
- **Moldura da pessoa:** a janela da chamada (barra com câmera, nome e área; etiqueta com barrinhas de voz), sempre por cima das outras janelas. Cinco lugares: tela cheia, larga no alto, grande no alto, no centro e minimizada no canto. O mouse faz o gesto de cada troca (arrasta pela barra, clica em "–", clica no ícone do dock, duplo clique para maximizar). A janela segue o rosto; com gravação muito perto da câmera ela estreita sozinha para a cabeça caber inteira. Nada recorta a pessoa do fundo.
- **Cores, textura e som:** papel de parede lavanda-ardósia com dunas que derivam devagar, janelas brancas com sombra macia, grafite para texto e teclas, **um** acento violeta elétrico `#5B3DF5` para o que acabou de acontecer (tecla apertada, item da vez, clique, destaque). Nada de logotipo, gradiente colorido, brilho ou emoji. Sons raros e tonais: um "toc" grave por tecla e por item (a nota sobe), duas notas no resultado, duas descendo no alerta.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Produtividade"): o nome vai na etiqueta e na barra da janela da chamada, a área depois dele. Sem resposta, siga sem nome (a janela se chama "Chamada").
4. **Teclas de verdade.** Se a fala cita um atalho de teclado, ele tem que estar certo na tela: confira o atalho (sistema, programa, o que ele faz) e, se a fala estiver errada ou ambígua, avise o usuário antes de renderizar. Nenhum texto de tela pode citar ferramenta de edição de vídeo.

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

Termos e números costumam vir escritos de jeitos estranhos ("Ctrl+Shift+T" numa palavra só, "Doze" por extenso, um "O" que não foi dito). Anote: vão virar `correcoes` (passo 7).

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Itens curtos sem transcrição ou marcados `[sem fala, sai]`** podem ser uma palavra curta que o Whisper perdeu ("Um:", "Dois:"). Antes de tirar, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica (`"manter": true`).

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as trocas de momento escondem os cortes** (a janela da pessoa muda de lugar em cima do pulo). Pausas curtas dentro de uma frase (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa é reposicionada em janelas); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a janela da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Gravação muito perto da câmera (rosto largo) não é problema: as janelas da pessoa estreitam sozinhas até mostrar a cabeça inteira, e os cartões no peito descem até abaixo do queixo. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul deve cair no rosto **dentro da janela da pessoa** (caixa roxa tracejada) e a linha vertical fina marca o centro do quadro; a faixa amarela é onde ficam os cartões no peito quando a pessoa está em tela cheia (o queixo tem que ficar acima dela); a linha laranja é o limite das abas do app e a vermelha o da interface embaixo. Se a cruz não estiver no rosto, refaça o passo 4 com medidas melhores.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, passos, número, comparação…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. Pergunte, frase a frase: *num computador, que janela eu abriria para mostrar isto?*

**A assinatura (`teclas`, ou o `recorte`) entra pelo menos uma vez**, mesmo que o assunto não tenha nada de teclado: veja "A assinatura em qualquer assunto".

Alterne os lugares da pessoa (cada bloco tem o seu: tela cheia, alto, miniatura). Abra com a `abertura` em tela cheia e feche com o `cta`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, opção, dado ou tecla entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`. Para achar o começo de cada tecla de um atalho falado ("Control Shift T", que o Whisper cola num tempo só): `node ferramentas/teclas.mjs <de> <até>` (seção 5 de `references/plano.md`).

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento, com a pessoa em tela cheia).

Palavras que a transcrição errou vão em `correcoes` (ex.: `{ "O Windows": "Windows" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe e dá para ler (nada cortado, nada embaixo da janela da pessoa)?
- cada coisa aparece quando a palavra é dita (a tecla afunda, o item entra, o número conta)?
- a janela da pessoa mostra a cabeça inteira e nada cobre o rosto? O mouse não para em cima de texto?
- nada parado mais de ~2,5 s?
- nas trocas, nenhum quadro só com a pessoa num desktop vazio e nenhum texto sobre outro? Gere quadros a cada 0,05–0,1 s em volta de cada `de` (`node scripts/stills.mjs 8.45 8.5 8.6 8.7 8.8`).

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-janelas.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curva de tendência sem números ditos, número marcado `ilustrativo`);
- o que o usuário deve conferir (um atalho que você não pôde confirmar, uma palavra que a transcrição pode ter errado, uma tomada que você escolheu no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | tela cheia; a barra de busca do sistema no peito, onde o texto é **digitado** na fala com cursor violeta; no Enter (a tecla ⏎ afunda) aparece a linha de resultado; a janela da chamada sai da tela cheia |
| lista | `topicos` | pessoa larga no alto; embaixo, a janela "Notas" com o título dito e vagas tracejadas; cada item ocupa a sua na palavra e o mouse o seleciona (violeta). Com 4 ou 5 itens a pessoa minimiza e um contador "Item 3 de 5" fica ao lado |
| passos | `passos` | pessoa minimizada no canto; em cima, o assistente "Passo a passo": etapas numeradas ligadas por um fio que enche de violeta até a etapa dita, as que passaram ganham ✓; ao lado, a janelinha "Progresso" com "2/3" e a barra |
| número | `numero` | pessoa grande no alto; embaixo, o "Painel": rótulo, o número em mono contando até o valor (pt-BR, prefixo e sufixo menores) e a barra que enche junto; etiqueta ILUSTRATIVO na barra de título quando for o caso |
| comparação | `comparacao` | tela dividida: duas janelas lado a lado embaixo da pessoa (o nome do lado na barra, o texto grande no corpo, cada uma na sua palavra), × (contra) ou › (antes-depois, errado-certo) entre elas; no veredito o mouse clica na que ganha (contorno violeta e ✓), a outra apaga e, em errado-certo, é riscada |
| gráfico | `grafico` | janela "Gráfico": barras grafite que crescem dado a dado (a da vez em violeta), linha ponto a ponto ou rosca com legenda; sem números ditos, uma curva de tendência que se desenha, com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | tela cheia; uma notificação do sistema no peito. `chave` = clara com o marcador violeta; `alerta` = escura com o triângulo; a frase sobe palavra por palavra e o detalhe entra menor |
| definição | `definicao` | janela "Dicionário": o termo enorme com sublinhado tracejado; no significado, o mouse passa por cima e um balão de ajuda escuro abre com o significado dito |
| frase | `frase` | pessoa no centro; embaixo, uma nota onde a frase é digitada na fala com cursor violeta; `destaque` em violeta; no `risco`, o mouse seleciona as palavras e elas são riscadas |
| pergunta | `pergunta` | tela cheia; uma caixa de diálogo no peito com "?" e a pergunta; as opções viram botões, cada um na sua palavra, e o foco (contorno violeta) passa para o que acabou de entrar |
| fechamento | `cta` | cartão de compartilhar embaixo da pessoa: a chamada e um botão (`link` = o trecho em destaque, `seguir`, `salvar`, `comentar` com o campo digitado) que o mouse clica na palavra; ou a forma salvar + enviar com o destinatário digitado |
| **assinatura** | `teclas` | teclas grafite grandes embaixo da pessoa, com o rótulo em caixa alta em cima (e um chip violeta opcional): cada tecla afunda e acende em violeta na palavra; podem ser teclas de verdade ou **palavras** (a combinação da ideia); palavras compridas quebram em duas filas; uma frase curta pode ficar embaixo |
| **assinatura** | `recorte` | a tela escurece, o mouse vira mira e arrasta um retângulo em volta do rosto com a frase dita presa nele; na captura, a imagem congelada voa para um aviso embaixo ("✓" + a frase) |
| abas | `navegador` | navegador genérico embaixo da pessoa: cada aba abre na sua palavra (o mouse clica no "+") com o título grande e a frase dita na página; ou uma aba fecha sem querer e volta no atalho |
| painel de itens | `lista` | painel com itens de tipos (texto, imagem, link, endereço, valor, arquivo, contato, data), selo violeta e o item que o mouse escolhe; com teclas, a pessoa minimiza e o atalho fica ao lado |

## A assinatura em qualquer assunto

As teclas mostram **"a combinação"**: duas a quatro coisas que, apertadas juntas, dão o resultado (o atalho para alguma coisa). Quase toda fala tem isso: os três critérios, os ingredientes de uma decisão, a fórmula de um método, o que fazer num prazo. Cada tecla é uma palavra curta da fala e afunda quando ela é dita; o rótulo de cima diz para que serve a combinação; uma frase curta pode completar embaixo. O `recorte` mostra **"guarde isto"**: a frase que a pessoa quer que fique.

1. **Finanças/cripto.** "Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro."
   `teclas`: `chip` "Aula gratuita" (em "aula"), `rotulo` "Como eu analiso" (`numeroEm` em "como"), teclas `Mercado` · `Riscos` · `Ativos`, cada uma no `em` da sua palavra, e `descricao` "Sem promessa de lucro" (`descricaoEm` em "sem").
2. **Saúde (respiração).** "Inspira contando até quatro, segura até sete, solta até oito."
   `teclas`: `rotulo` "Respiração 4-7-8", teclas `4` · `7` · `8` (em "quatro", "sete", "oito"), `descricao` "inspira · segura · solta".
3. **Bem distante: casamento.** "Doze meses antes: data, local e orçamento."
   `teclas`: `rotulo` "12 meses antes" (em "doze"), teclas `Data` · `Local` · `Orçamento`. O resto do cronograma vira `passos` ("9 meses: fotógrafo e buffet" → "6 meses: convites e traje" → …).

Outros usos: "o que faz um bom pitch: problema + prova + pedido"; "num relacionamento: ouvir + perguntar + só depois responder"; "a regra do treino: carga + descanso + sono". Para o `recorte`: "se você guardar uma coisa deste vídeo, guarde isto…" (`rotuloSelecao` = a frase dita).

Se a fala cita um atalho de teclado de verdade, as teclas mostram exatamente as teclas ditas (`Ctrl`, `Shift`, `T`), e o `navegador`, a `lista` e o `recorte` podem trazer o mesmo campo `teclas`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, prazo nem fato. Itens de exemplo inventados (num painel de "tudo o que você copiou") só quando a fala pede um exemplo, e nunca com dados pessoais, senhas ou marcas.
- Número ilustrativo só onde o bloco permite (a curva de tendência, um `numero` marcado `ilustrativo`), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure a combinação (duas a quatro coisas ditas em sequência) e use `teclas` com palavras; ou o `recorte` na frase mais importante.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A tecla afunda antes ou depois da palavra**: o `em` dela está errado. Rode `node ferramentas/teclas.mjs` no trecho e recalcule.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano. Uma "palavra" que é só símbolo ("+") não pode ser corrigida; ela some sozinha dentro de um momento.
- **Texto pequeno demais ou quebrado em muitas linhas**: o texto passou do limite do bloco (`references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **O retângulo do recorte não enquadra o rosto** (óculos, cabeça baixa, rosto fora do centro): use `ajuste` no momento `recorte`.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução; o vídeo sai menos nítido. Avise o usuário.
