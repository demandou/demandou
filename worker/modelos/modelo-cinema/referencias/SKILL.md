---
name: modelo-cinema
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Cinema: linguagem de filme em preto quente e âmbar. A imagem vive entre barras pretas que abrem e fecham com a intensidade da fala; o texto mora nas barras e entra em foco palavra por palavra (serifada de livro, créditos em caixa alta); números rolam como contador mecânico; listas e gráficos viram cartelas de crédito com a janela da pessoa descendo para a base; cortes curtos para o preto com desenhos a traço; frases-chave grandes; créditos finais com a chamada. Serve para qualquer assunto (o exemplo é uma história, mas funciona com finanças, cripto, saúde, vendas, aulas, opinião): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Cinema\", \"estilo cinema\", \"cinematográfico\", \"com barras de cinema\" ou \"estilo storytelling\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Cinema

O vídeo vira um filme: a pessoa fala de dentro de uma janela de cinema entre duas barras pretas, e é nas barras que tudo acontece. Elas apertam quando a fala aperta e se abrem quando ela solta; o título, o número que rola, o termo e o seu significado, os dois lados de uma comparação aparecem nelas, entrando em foco como num ajuste de lente. Quando há uma lista ou um gráfico, a janela desce para a base da tela e a barra de cima vira uma cartela de créditos. De vez em quando, um corte curto para o preto com um desenho a traço. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de diretor (escolher as tomadas, traduzir a fala em blocos, desenhar a curva das barras, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma história (um senhor, duas xícaras de café), mas o vídeo do usuário pode ser sobre qualquer coisa: finanças, cripto, saúde, vendas, uma aula, uma opinião, uma história. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** nada pula, tudo desliza. As barras se movem como um carrinho de travelling (~1 s, acelera e desacelera); a câmera dentro da janela aproxima devagar e sem parar, mais rápido quanto mais intenso. O texto entra inteiro, desfocado e apagado, e cada palavra ganha foco no instante em que é dita. Números rolam como um contador mecânico; desenhos a traço se desenham e fazem uma ação com sentido (as moedas desmoronam, a balança pende, o sol se põe). O que sai apaga e desfoca antes de o novo entrar; as barras recortam o texto como uma cortina enquanto se mexem.
- **Organização e hierarquia:** o texto nunca fica sobre o rosto. Nos blocos de barra, a informação principal fica na barra de baixo (o título, o número, o significado) e o contexto na de cima (o crédito, o termo, o primeiro lado), com o rosto no meio. Nos blocos de cartela alta (listas, passos, gráficos), a janela desce para a base e a cartela de cima empilha título em caixa alta e itens grandes, de cima para baixo; o item da vez fica aceso, os anteriores recuam. Uma ideia grande por vez; créditos, rótulos e detalhes menores.
- **Tipografia:** Cormorant Garamond (serifada de livro e de cinema) para tudo que é dito: 600 nos textos, itálico para ênfase, falas, termos e perguntas; algarismos alinhados. Jost só em caixa alta espaçada, pequena, âmbar, como crédito de filme. Os textos são medidos com a fonte de verdade e diminuem para caber (até 2 ou 3 linhas), nunca vazam. Mínimos na tela de 1080: textos 44 px, créditos 30 px, títulos 72 px ou mais.
- **Moldura da pessoa:** sempre uma janela da largura toda entre duas barras pretas, em cinco alturas: aberta (tela cheia), respiro (barras finas), tensão (janela larga, rosto e ombros), clímax (cinemascope, rosto em close) e fechada (tela preta, nas cartelas). Nas listas e gráficos, a janela vira uma faixa de cinemascope na base da tela. O rosto é seguido quadro a quadro; em gravação muito perto da câmera, as janelas não aproximam mais (o rosto já está em close).
- **Cores, textura e som:** preto quente (`#0B0806`) nas barras, marfim no texto, âmbar como único acento (créditos, ênfase, traços, travessões, números de passos), cinza frio para o que esfria, apaga ou está errado (o risco, o lado que perde, o alerta, que também esfria a imagem). Gradação quente com vinheta e grão de película fino só dentro da janela. Sons raros, graves e tonais: um grave quando as barras apertam, uma nota quando o número pousa, um acorde sob as frases-chave, duas notas descendo no alerta, um sopro grave quando a janela desce, um acorde nos créditos.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o render baixa as fontes do Google Fonts). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Marina" / "Finanças pessoais"): vão na assinatura dos créditos finais e no crédito da abertura. Sem resposta, siga sem nome (os créditos mostram o ícone da ação no lugar da assinatura).

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Trecho `[sem transcrição: ouça antes de tirar]`: meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`); perto de −60 dB é silêncio e sai, perto de −20 dB é fala e fica.

**No Cinema, a pausa é narração.** O silêncio antes de "Até que…", ou depois da frase que dá o nó, faz a fala respirar. Mantenha as pausas de até ~1,2 s: se a gravação é uma fala contínua com essas pausas, junte todos os itens mantidos num só (de o início do primeiro ao fim do último) e o vídeo sai sem cortes. Só saem os silêncios longos, as tomadas erradas e as repetições.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais) não são tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.32 --queixo-y 0.43
```

O recorte já vem decidido pelo modelo (`modelo.json`): gravação vertical sai em 9:16 mesmo com o queixo baixo (o template reenquadra a pessoa dentro da janela entre as barras); horizontal vira 3:4. Leia os avisos que ele imprime. Refazendo o corte depois de já ter planejado, use `--manter-plano`.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a janela acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto; a linha "queixo agora" deve cair no queixo; as caixas roxas mostram as janelas dos níveis 1 a 3 e a "janela das listas" (a faixa da base, usada por tópicos, passos e gráficos) — o rosto deve aparecer nelas; a caixa amarela é onde a narração fica naquele instante e deve estar acima da linha vermelha (interface do aplicativo). Se a cruz ou o queixo estiverem errados, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`letreiro` ou `cartela`) entra pelo menos uma vez**, seja qual for o assunto: veja "A assinatura em qualquer assunto".

Pense também como diretor: onde a fala aperta (barras fechando, close) e onde solta (tela aberta). Alterne os lugares do texto: blocos de barra (o rosto no meio), cartela alta (a janela na base) e, raramente, o corte para o preto. Abra com o rosto na tela (nunca com tela preta) e feche com o `cta`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, os limites de texto, a curva das barras e as regras de tempo) e preencha `src/plano.json`: `marca`, `intensidade`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, opção ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas da narração (só existem nos trechos sem momento) e marca linha com palavra sozinha.

Nomes e termos que a transcrição errou vão em `correcoes` (`{ "Jão": "João", "10": "dez" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Confira também o quadro 0 (`node scripts/stills.mjs 0`): é a capa do vídeo e precisa mostrar o rosto e o texto do primeiro bloco. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe e está inteiro, sem nada sobre o rosto?
- o número certo aparece quando a palavra é dita? A hora ou o valor pousam no lugar?
- o rosto aparece bem na janela (no close e na faixa das listas)?
- nas trocas (`de` de cada momento e `ate` − 0,1 s): o texto que sai some antes de o novo aparecer, sem dois textos um sobre o outro?
- nada parado mais de ~2,5 s, nada abaixo da linha da interface do app?
- erro de digitação ou de acento?

Corrija o plano (texto mais curto, outro bloco, outro `em`, outra curva) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-cinema.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (ou que a gravação ficou inteira porque as pausas eram narração);
- o **mapa resumido** (que bloco entrou em cada trecho) e a curva das barras em uma linha;
- o que é ilustrativo (curvas de tendência sem números ditos);
- o que o usuário deve conferir (uma palavra que a transcrição pode ter errado, uma tomada em dúvida).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | as barras apertam em close, a imagem escurece e o título se monta palavra por palavra na barra de baixo (`destaque` em itálico âmbar); na de cima, o crédito (`rotulo` ou o nome de quem fala) e, se quiser, um desenho a traço. No começo do vídeo, o primeiro quadro já mostra tudo (é a capa) |
| lista | `topicos` | a janela desce para a base (faixa de cinemascope) e a barra de cima vira uma cartela de créditos: título em caixa alta âmbar e itens grandes com um travessão âmbar, cada um entrando em foco na sua palavra; o da vez fica aceso, os anteriores recuam |
| passos | `passos` | a mesma cartela alta, com algarismos âmbar em itálico ligados por um fio que desce até o passo da vez |
| número | `numero` | close; na barra de baixo o número rola como um hodômetro até o valor (pt-BR), com prefixo e sufixo menores e uma régua que corre junto; na de cima, o rótulo como crédito (e, se quiser, um desenho) |
| comparação | `comparacao` | close; um lado na barra de cima e o outro na de baixo, o rosto no meio; cada lado com o rótulo em crédito e o texto grande; no `vencedorEm`, o lado que perde esfria (e é riscado em `errado-certo`) e o que ganha recebe a régua âmbar |
| gráfico | `grafico` | cartela alta: `barras` = colunas a traço âmbar que sobem do chão; `linha` = um traço que anda de ponto em ponto com um círculo na ponta; `pizza` = um mostrador cujos arcos se fecham, com a legenda ao lado; sem números ditos, a curva (ou as colunas) da tendência, desenhada do começo ao fim, e a etiqueta ILUSTRATIVO |
| destaque | `destaque` | a frase curta grande na barra de baixo; `alerta` = as barras apertam e a imagem esfria (perde a cor quente); `chave` = itálico âmbar, janela larga |
| definição | `definicao` | janela larga; o termo em itálico âmbar na barra de cima e o significado na de baixo, como a legenda de uma língua estrangeira |
| frase | `frase` | frase-chave: cresce em tipografia grande na barra de baixo (ou sobre a imagem escurecida, abaixo do queixo); `destaque` em itálico âmbar; `risco` riscado por um traço âmbar quando é dito, depois esfria |
| pergunta | `pergunta` | close; a pergunta em itálico na barra de cima; as `opcoes` na de baixo, cada uma com um círculo a traço que se fecha quando é dita |
| fechamento | `cta` (ou `creditos`) | créditos de filme: a assinatura (área em crédito, nome grande) na barra de cima — sem nome, o ícone da ação grande —, a chamada palavra por palavra na de baixo, `destaque` em itálico âmbar |
| **assinatura** | `letreiro` | as barras apertam sobre a imagem escurecida e a hora, o lugar, o tema ou o capítulo aparecem nelas: desenho a traço e crédito em cima, título grande e até 2 linhas da fala embaixo; hora, ano ou número no título rolam como contador |
| **assinatura** | `cartela` | corte para o preto de 2 a 3,5 s: as barras se encontram, um desenho a traço faz sua ação (as moedas desmoronam, a balança pende, a lâmpada acende, as folhas do calendário caem), com crédito, título e as frases da fala; depois as barras reabrem |
| a curva das barras | `intensidade` | nos trechos sem bloco de barra, as barras seguem a curva (0 aberto, 1 respiro, 2 tensão, 3 close, 4 preto): elas apertam quando a fala aperta |
| fala citada | `fala` | o que alguém disse vira diálogo de romance: travessão âmbar, itálico e quem disse em crédito |

## A assinatura em qualquer assunto

O **letreiro** é o "título de cena" do cinema: põe na tela **quando, onde, o quê ou que capítulo** começa, com o rosto ainda na tela. A **cartela** é o **corte para uma imagem**: a fala para por um instante no preto e mostra, num desenho a traço com uma ação, a imagem que resume a ideia. Qualquer fala tem um "capítulo" que começa e uma imagem que a resume. Os desenhos não são do assunto do demo: `moedas`, `balanca`, `estrada`, `lampada`, `calendario`, `ampulheta`, `relogio`, `sol`, `xicaras` e `banco` servem como metáforas (veja `references/plano.md`); sem um desenho que sirva, a cartela fica só com crédito, título e frases.

Três exemplos fora do nicho do demo:

1. **Finanças/cripto.** "O Bitcoin rompeu os 83 mil dólares… Mesmo na alta, tem gente que perde porque compra por impulso… Agora, como avaliar os projetos e pensar no seu posicionamento?"
   - `cartela` em "Mesmo na alta, tem gente que perde": crédito MESMO NA ALTA, as `moedas` desmoronando (`sentido: "cai"`) e a linha "Tem gente que perde." no "tem".
   - `letreiro` em "Agora, como avaliar…": crédito AGORA, a `balanca` pendendo para um lado em "avaliar" e para o outro em "posicionamento" (dois `passos`), título "Como avaliar os projetos" e a linha "e pensar no seu posicionamento?".
   - Em "Aquele café de oito reais por dia parece nada" (finanças pessoais): `letreiro` de abertura com as `xicaras`, crédito AQUELE CAFÉ, título "Oito reais por dia" e a primeira xícara sendo bebida em "nada".
2. **Saúde e rotina.** "Às seis da manhã eu já estou na academia. Três meses depois, os exames mudaram."
   - `letreiro` de abertura: crédito TODO DIA, título "6:00" rolando como contador (`contarDe: "5:52"`, pousando em "manhã") e o `relogio` com os ponteiros andando até a hora.
   - `cartela` em "Três meses depois": o `calendario` perdendo folhas, título "Três meses depois" e a linha "os exames mudaram."
3. **Carreira (bem distante).** "No dia da entrevista eu travei. Eu tinha estudado tudo, mas faltou uma coisa: treinar em voz alta."
   - `letreiro` em "No dia da entrevista": crédito NO DIA DA ENTREVISTA, a `ampulheta` escorrendo e o título "Eu travei".
   - `cartela` em "faltou uma coisa": a `lampada` acendendo no "treinar" (`passos`), título "Treinar em voz alta".

Use a **curva** (`intensidade`) em qualquer assunto: a explicação calma fica em 1 (barras finas), o problema aperta para 2 e 3, o alívio ou a solução abre para 0, o silêncio antes do fechamento fecha em 4.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, hora, lugar, ano nem fato. Um desenho é metáfora, não informação: ele não pode afirmar o que não foi dito.
- Número ilustrativo só no gráfico sem números ditos (`tendencia`), sempre com a etiqueta ILUSTRATIVO visível; no `numero`, `ilustrativo: true` também mostra a etiqueta.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não combina" com o assunto**: ela é o estilo. Procure na fala o "capítulo" que começa ("Agora…", "No começo…", "Em um ano…") para o `letreiro`, e a imagem que resume uma ideia para a `cartela`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais**: passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **A frase-chave aparece tarde ou cortada**: as barras ainda estavam se mexendo quando ela começou. Mude a curva (`intensidade`) ~0,5 s antes da frase ou use um bloco de barra (`destaque`).
- **O render sai mudo em algum trecho**: um componente desmontou o vídeo da pessoa (veja o "Cuidado" em `references/estilo.md`).
- **O rosto sai cortado no close**: a medida do rosto está errada (refaça o passo 4) ou a pessoa se mexe muito — use o nível 2 nesse trecho.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
