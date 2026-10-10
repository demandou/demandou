---
name: modelo-ignicao
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Ignição: a tela inteira vira o painel de um carro à noite. A chave gira na primeira palavra, os ponteiros varrem, as luzes-espia acendem quando cada ideia é dita, a tela central mostra listas, números, comparações, gráficos e a rota do navegador, e a pessoa muda de lugar com o modo do painel (tela central, retrovisor de dentro, retrovisor da direita). Preto de painel, luz marfim, vermelho só nos alertas. Serve para qualquer assunto (o exemplo do modelo é mecânica, mas funciona com finanças, cripto, saúde, beleza, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Ignição\", \"estilo painel de carro\", \"com as luzes do painel\" ou \"estilo dashboard\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Ignição

O vídeo vira o painel de instrumentos de um carro à noite. Ele abre com a pessoa em quadro cheio; na primeira palavra a chave gira: a pessoa encolhe para uma moldura do painel, os ponteiros varrem até o fim da escala e voltam, as luzes-espia acendem juntas um instante (o teste de lâmpadas) e o painel assume. Daí em diante, cada ideia da fala é um **modo** do painel: luzes que acendem uma a uma, um mostrador digital que conta, a estrada vista de cima com paradas, o navegador traçando a rota, a mensagem que se acende na barra. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com mecânica (luzes do painel), mas o vídeo do usuário pode ser sobre qualquer coisa: o painel é a linguagem, não o tema. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a fala comanda o painel. Todo texto nasce apagado atrás do vidro fumê e acende palavra por palavra quando é dito; luzes acendem no instante em que são nomeadas (as vermelhas piscam); os ponteiros contam a história (varrem na partida, rodam a ~60, aceleram num número, caem a zero ao "encostar"; ao "desligar" o giro cai e o painel escurece); números contam até o valor; traços, rotas e colunas se desenham. Entra decidido e assenta, sem quique. Na troca de modo, todas as peças deslizam juntas (0,56 s) e o corte da fala cai no meio do movimento; o conteúdo que sai some antes de o novo acender: nunca dois textos um sobre o outro.
- **Organização e hierarquia:** uma ideia por tela. A tela central de vidro escuro é o lugar da informação: um item grande por vez (a luz da vez, o item com o cursor do menu, a parada onde o carro está), o resto apagado ou mais baixo de luz. Rótulos pequenos em caixa-alta espaçada em cima; contadores ("2 / 3") entre os mostradores; a fileira de luzes-espia sempre no painel.
- **Tipografia:** uma família só, Tomorrow (letra de painel, técnica, sem ser condensada; o I maiúsculo tem serifa), pesos 500 a 700, todo texto do painel em caixa-alta. Títulos de 60 a 96 px, textos de 44 a 92 px, rótulos de 30 a 34 px; o template mede cada texto com a própria fonte e diminui até caber: nunca vaza.
- **Moldura da pessoa:** três lugares, nunca uma coluna estreita. Na **tela central** do painel (860×744: abertura, frases, pergunta simples, fechamento), no **retrovisor de dentro** (760×556 no alto: luzes, listas, passos, números, gráficos, comparação, rota) ou no **retrovisor da direita** (444×556: parada, definição). A pessoa muda de lugar com o modo; o rosto é seguido quadro a quadro dentro da moldura; gravação muito perto da câmera aproxima menos sozinha.
- **Cores, textura e som:** carcaça preta fosca, vidro mais escuro, aros de metal; **marfim** = a luz de fundo (ponteiros, números, texto); aço nos rótulos; **vermelho só nas luzes de alerta**, âmbar nas de atenção, **verde só na seta** do fechamento. Sons raros, tonais e graves: a partida, uma nota por item que acende, o alerta duplo, a descida do motor, duas notas da rota, o "toc" da seta.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Auto elétrica"): eles vão no "perfil do motorista", o selo no canto da tela central na abertura e no fechamento. Sem resposta, siga sem nome (o selo não aparece).

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Palavra que não parece ter sido dita** (um "e aí", um "obrigado" no meio de uma pausa): meça o volume dela (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`). Perto de −50 dB ou menos é respiração ou silêncio que o Whisper "ouviu": termine o item antes dela (ajuste o `ate`). −30 dB ou mais alto é fala.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre as ideias viram cortes, e é nelas que o painel troca de modo** (o movimento das peças esconde o pulo do corte). Mantenha a proposta do `preparar`; pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.495 --rosto-y 0.31 --queixo-y 0.415
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa muda de lugar a cada modo); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: a moldura da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Gravação muito perto da câmera (selfie) é normal: as molduras aproximam menos e sobem o rosto para o queixo caber, e o teste de lâmpadas da partida vai para baixo da moldura para não cobrir o rosto. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul é onde o plano acha que está o rosto **no quadro cheio** (tem que cair entre os olhos e a ponta do nariz); a caixa roxa tracejada é a moldura da pessoa no modo daquele instante (o rosto tem que aparecer inteiro e centrado nela); a laranja é a tela central; as linhas vermelhas são os limites do aplicativo (abas em cima, legenda do post e botões embaixo). Depois de planejar, passe tempos para ver cada modo: `node scripts/stills.mjs --guias 6.5 12`. Se a cruz não estiver no rosto, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`luzes`, `parada` ou `rota`) entra pelo menos uma vez**, mesmo que o assunto não tenha nada de carro: veja "A assinatura em qualquer assunto".

Pense como quem desenha o painel: **cada ideia é um modo**, e a pessoa muda de lugar com ele. Alterne os lugares: depois de uma ou duas telas grandes (pessoa no retrovisor), uma frase na barra (pessoa na tela central) ou uma parada ou definição (retrovisor da direita). Feche com o `cta`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, as luzes disponíveis, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, luz, lado, dado ou passo entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`. Tudo que aparece na tela tem que ser fiel ao que a pessoa disse.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (neste modelo a legenda só existe fora dos momentos, na barra de mensagens).

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe e está grande (nada cortado, nada fora do vidro)?
- a luz certa acende na palavra certa? o número certo aparece quando é dito?
- a cabeça aparece nas molduras, sem nada por cima do rosto?
- o carro anda na estrada dos passos e encosta na parada? a rota acende e o pino chega?
- nada parado mais de ~2,5 s?
- **o meio das trocas de modo**: gere quadros a cada 0,05 a 0,1 s em volta de cada fronteira (`node scripts/stills.mjs 8.3 8.4 8.47 8.54 8.7`). O que sai some antes de o que entra acender; nunca dois textos um sobre o outro, nunca a tela vazia por mais de um quadro.

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-ignicao.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (a curva de uma tendência sem números, os ponteiros da comparação, o carro que encosta como metáfora);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma luz escolhida por aproximação).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `ignicao`) | a chave gira na primeira palavra (teste de lâmpadas, ponteiros varrem); pessoa na tela central; na barra de mensagens o `destaque` acende grande e o resto da frase, menor, em cima ou embaixo dele |
| lista | `topicos` | pessoa no retrovisor; a tela grande vira o menu do computador de bordo: cada item com a sua luzinha numerada, o cursor desliza até o item da vez; contador "2 / 4" entre os mostradores |
| passos | `passos` | a estrada vista de cima, com uma parada numerada por etapa; o carro anda até a parada da etapa dita, a rota fica acesa atrás dele e a etapa feita ganha o visto |
| número | `numero` | a tela vira o mostrador digital: o ponteiro varre a escala redonda do valor e o visor conta em pt-BR (US$ 83.000; 1,5; 8 HORAS); o velocímetro acelera junto |
| comparação | `comparacao` | a tela se divide em dois lados, um em cima de cada mostrador grande; os mostradores perdem os números e ganham o nome do lado; o ponteiro de cada lado sobe quando ele é dito; o vencedor vai alto, o outro cai e apaga (`errado-certo`: o errado é riscado) |
| gráfico | `grafico` | o histórico do computador de bordo: colunas que sobem (`barras`), pontos ligados por um traço (`linha`), um anel em fatias de marfim (`pizza`); sem números ditos, a curva da `tendencia` com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | pessoa no retrovisor; uma luz grande acende na tela com a frase: `alerta` = o triângulo vermelho piscando (também na fileira); `chave` = a luz de informação, marfim |
| definição | `definicao` | pessoa no retrovisor da direita; o termo acende no painel ao lado dela; um traço desce até a tela e o significado acende lá |
| frase | `frase` | pessoa na tela central; a frase acende na barra de mensagens; o `destaque` ganha um sublinhado que se desenha; o `risco` apaga e é riscado (com a descida do motor) |
| pergunta | `pergunta` | sem opções: o "?" e a pergunta na barra; com opções: a caixa de diálogo do painel, com os botões acendendo e o cursor passando de um para o outro |
| fechamento | `cta` | pessoa na tela central; o ícone da ação (salvar, seguir, comentar, link) se desenha, a chamada acende e a seta verde de direção pisca na palavra da ação; o motor desliga no fim |
| **assinatura** | `luzes` | luzes-espia que acendem uma a uma: cada uma ganha a tela grande (desenho grande, nome, frase sobre ela), acende na fileira e o contador rola; desenhos de carro, símbolos gerais ou luzes numeradas |
| **assinatura** | `parada` | pessoa no retrovisor da direita; a condição acende no painel ao lado (com as luzes dela piscando) e a tela mostra a pista vista de cima e os passos: o carro encosta, o motor desliga |
| **assinatura** | `rota` | o navegador em perspectiva: a instrução acende no alto, a rota acende do carro até o pino do destino e o carro anda até lá |
| mensagem com número | `aviso` | uma regra ou medida: o número conta, o texto acende, uma luz opcional acende ao lado |

## A assinatura em qualquer assunto

A assinatura deste modelo é o painel **falando com quem dirige**: as **luzes** mostram "estes são os sinais, motivos ou itens" (cada um acende quando é dito); a **parada** mostra "quando acontecer X, pare e faça isto" (o carro encosta = pausar, o motor desliga = cortar de vez); a **rota** mostra "o caminho até um destino" (a direção, o lugar, o objetivo). Nada disso precisa de carro na fala: é a metáfora visual. Use os símbolos gerais (`alerta`, `info`, `tempo`, `dinheiro`, `pessoa`, `coracao`, `raio`, `servico`) ou as **luzes numeradas** (`n1` a `n5`, o padrão quando não há ícone).

Três exemplos fora da mecânica:

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento?"
   `luzes` com `titulo: "Perde porque"` e três luzes numeradas vermelhas: "Impulso" (em "compra", detalhe "Compra por impulso"), "Sem critério" (em "escolhe", detalhe "Escolhe moeda sem critério"), "Risco" (em "assume", detalhe "Assume risco que não entende"). Depois uma `parada`: condição "Como avaliar?", passos "Os projetos" (`acao: "encostar"`: o carro encosta para avaliar) e "Seu posicionamento".
2. **Saúde e rotina.** "Se você acordar com dor de cabeça três dias seguidos, corta o café, bebe água e procura um médico."
   `parada` com `icones: ["alerta"]` e condição "Dor de cabeça 3 dias seguidos"; passos "Corta o café" (`desligar`: o giro cai e o painel escurece) e "Bebe água" (`nenhuma`); depois uma `rota` com instrução "Procura um médico", destino "Médico".
3. **Beleza (bem distante).** "Três truques… Um: corretivo em triângulo embaixo dos olhos. Dois: blush mais alto, na direção da têmpora. Três: iluminador no ponto alto da maçã."
   Os truques são luzes numeradas em âmbar: `luzes` com a luz `n1` ("Corretivo", em "Um"), uma `rota` com `icone: "n2"`, instrução "Blush um pouco mais alto" e destino "Têmpora" (a rota acende em "direção" e o carro chega em "têmpora"), e outra `luzes` com `n3` ("Iluminador"). A fileira de luzes vira o placar dos truques: 1, 2 e 3 acendem ao longo do vídeo.

Outros usos: os "sinais de que um cliente vai cancelar" acendendo como luzes; "quando bater a ansiedade, pare e respire" como parada (o carro encosta); "o caminho até a primeira venda" como rota; uma conversa sobre relacionamento em que "três sinais vermelhos" acendem. Se a fala tem uma lista de sinais, use `luzes`; se tem "se/quando… faça", `parada`; se tem um destino ou uma direção, `rota`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, distância, taxa nem fato. O mapa do navegador e a estrada não mostram números.
- Ilustrativo só onde o bloco permite (a curva da `tendencia`, os ponteiros da comparação, o carro como metáfora), com a etiqueta ILUSTRATIVO quando for um gráfico.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure na fala uma lista (luzes), um "se/quando… faça" (parada) ou um destino (rota) e use os símbolos gerais ou as luzes numeradas.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado em muitas linhas**: passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Uma luz ou palavra acende antes ou depois da hora**: o `em` está errado; pegue o tempo em `work/palavras.json` (o Whisper às vezes adianta uma palavra curta; confira no quadro).
- **O rosto ficou grande ou o topo da cabeça cortou numa moldura**: é gravação muito perto da câmera; o modelo já aproxima o mínimo e sobe o rosto. Se o queixo cortar, refaça o passo 4 medindo o queixo com cuidado.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
