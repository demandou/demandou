---
name: modelo-conversa-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Conversa. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Conversa: o vídeo vira um app de mensagens noturno e sem marca, com balões tangerina chegando com \"digitando…\" no ritmo da fala, a conversa rolando como no celular, a pessoa como mensagem de vídeo redonda que cresce para o quadro cheio entre os momentos, o que dá errado esfriando para cinza e o que dá certo acendendo. Serve para qualquer assunto (o exemplo do modelo é vendas no direct, mas funciona com finanças, cripto, saúde, plantas, aulas, histórias, opinião): a IA traduz a fala em mensagens, listas, passos, números, gráficos e comparações deste estilo. Use sempre que o usuário pedir para editar \"no modelo Conversa\", \"estilo conversa\", \"com balões de mensagem\", \"como print de conversa\" ou \"estilo chat\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a conversa à esquerda)."
---

# Modelo Conversa (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Conversa no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: a mesma fonte, as mesmas cores, os mesmos balões, o "digitando…", o que esfria e o que acende, os mesmos sons e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada, com a legenda no campo de texto embaixo (centralizado, na área segura). A tela do app abre **só quando acrescenta clareza** à fala e volta para a pessoa quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Na tela do app, a pessoa vira a mensagem de vídeo redonda numa **moldura do lado direito** (620 px, com o rosto centralizado e seguido com ajuste suave, sem saltos) e a conversa ocupa o **quadro do lado esquerdo**: uma coluna de ~1030 px, embaixo do cabeçalho do contato e da mensagem fixada, que atravessam a tela. A barra de gravação fecha embaixo, na faixa dos controles do player (é só moldura).
- **No quadro cheio, o balão vai ao lado do rosto**, na altura do peito (centrado na linha do queixo), numa coluna livre: as suas mensagens à direita da pessoa, as do outro lado à esquerda, como na conversa. Se a pessoa gravou fora do centro e aquele lado ficou estreito, o balão vai para o lado mais largo. Ele nunca cobre o rosto, mesmo quando a pessoa se mexe.
- **Comparação e contraste:** as duas faixas, uma embaixo da outra, no quadro da esquerda, centradas na altura; a pessoa segue na moldura.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).
- **Tamanhos:** o app e os balões são desenhados numa tela virtual de 2400×1350 unidades, reduzida a 80% no quadro. Os tamanhos deste documento e do `plano.md` (balão de 70, número até 120…) estão nessas unidades: no vídeo saem a 80% (56 px, 96 px…).

A tela vira um app de mensagens bem desenhado, do tipo que dá vontade de tirar print. Cada ideia dita chega como mensagem: a lista vira mensagens em sequência, os passos ganham número e ✓, o número conta dentro do balão, o termo técnico ganha uma resposta citando ele, o gráfico chega como um cartão compartilhado. A pessoa é uma mensagem de vídeo redonda gravando na moldura da direita, ao lado da conversa, e, quando a ideia pede o rosto, a mensagem se expande para o quadro cheio com um balão ao lado do rosto. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com vendas no direct, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo é gesto de app. Cada mensagem chega com "digitando…" (três pontos numa onda de opacidade) e vira o balão; o balão novo empurra os de cima e a conversa rola como no celular. O que dá errado **esfria** (o balão tangerina vira cinza, fica no "Visto"); o que dá certo **acende** (✓ que se desenha, reação que pousa, borda no acento). Números contam dentro do balão, passos ganham ✓ quando o próximo é dito, palavras se escrevem na fala e o trecho-chave "trava" (fundo escuro, letra no acento). Entra decidido e assenta, sem quique, sem giro, sem flash.
- **Organização e hierarquia:** a conversa é lida de cima para baixo, como no celular, no quadro da esquerda. No topo, a **mensagem fixada** diz o assunto da tela (o título da lista, "2/3 Como eu analiso", "✕ Erro"); embaixo dela, os balões, um por ideia; o mais novo fica sempre embaixo, e a pessoa fica ao lado, na moldura da direita. Uma ideia grande por balão; rótulo, hora e detalhe pequenos. Comparações viram duas faixas, uma embaixo da outra.
- **Tipografia:** uma família só, Atkinson Hyperlegible Next (I, l e 1 nunca se confundem). 500 nos balões, 600–700 em nomes, fixada e títulos, 800 em números, destaques e termos. Balões de 58 a 96, número até 120, nada abaixo de 30 (em unidades: no quadro deitado saem a 80%, de 46 a 77 px, número até 96 px, nada abaixo de 24 px). O texto diminui até caber (até 3 linhas), nunca vaza.
- **Moldura da pessoa:** dois estados e um gesto só. **Quadro cheio** (a pessoa como foi gravada, pílula escura no topo, UM balão ao lado do rosto, legenda digitada no campo de texto embaixo) ou **tela do app** (a pessoa vira uma bolha redonda de 620 px na moldura da direita, com o rosto centralizado e o anel tangerina de gravação correndo; a conversa fica no quadro da esquerda). A troca é sempre a bolha que se expande ou encolhe (0,6 s), e o app fica atrás do vídeo: quando a pessoa encolhe, a conversa já está lá. O rosto é seguido quadro a quadro.
- **Cores, textura e som:** tinta-noite `#0E1116`, barras `#161A21`, balão do outro lado ardósia `#232934`, texto porcelana `#F2EEE7`, **tangerina `#FF7A33` = o acento** (os seus balões, o anel, o que dá certo), cinza-frio `#353B46` (o que dá errado). Nada do verde do WhatsApp nem do gradiente do Instagram. Sons tonais e raros: um "vum" grave na troca, notas curtas nas mensagens, um tom que desce no que esfria, um acorde curto no que dá certo, um toque grave no botão.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez, junto:
   - **nome e área** de quem fala (ex.: "Carla" / "Atendimento"): vão na pílula de assinatura do fechamento;
   - **com quem a pessoa conversa** no vídeo, se não for óbvio: o nome no cabeçalho do app (`contato`). Sem resposta, fica "Você" (quem assiste);
   - se a fala cita **preço, produto ou condição**, quais são os reais.
   Sem resposta nenhuma, siga sem assinatura.

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

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (sem como ouvir, meça o volume com `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`: perto de −60 dB é silêncio).

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a que combina com onde o vídeo vai ser postado ("toque em Saiba Mais" só existe em anúncio) e, na dúvida, com a última. Diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre frases viram cortes, e é nos cortes que o layout muda** (a pessoa cresce ou encolhe, a conversa rola para uma tela nova): o movimento esconde o pulo do corte. Mantenha a proposta do `preparar`.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.41
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para a bolha, para a coluna do balão e para a linha do queixo. Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto e a linha vertical fina mostra o centro do quadro; a caixa laranja de cima é a pílula do topo (acima da cabeça ou, no máximo, sobre o cabelo); as duas caixas azuis são as colunas dos balões do quadro cheio, dos dois lados da pessoa (nenhuma pode pegar o rosto), com a linha do queixo; a amarela é o campo de texto da legenda; as verdes pontilhadas são o quadro da conversa e a moldura da bolha (as telas do app); a roxa é a pessoa naquele instante; nada importante abaixo da linha vermelha (controles do player). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`conversa` ou `contraste`) entra pelo menos uma vez**, mesmo que o assunto não seja atendimento: veja "A assinatura em qualquer assunto".

Alterne os dois estados, e no vídeo completo a **tela cheia é a base** (aula 9): a tela do app abre onde ajuda a entender (uma lista, passos, uma definição, uma comparação, a conversa encenada) e volta para a pessoa quando a ideia termina. Depois de uma ou duas telas do app, um momento de quadro cheio ou um respiro só com a legenda (de 1 a ~8 s). **A pessoa volta ao quadro cheio pelo menos a cada ~10 s.** Abra e feche em quadro cheio (`abertura`, `numero` ou `balao` no começo; `cta` no fim).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `contato`, `momentos`, `semLegenda` e `correcoes`. Cada item, mensagem, lado ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem com a pessoa em quadro cheio, nos trechos sem momento ou com `"legenda": true`).

Nomes e termos que a transcrição errou vão em `correcoes` (`{ "Jão": "João", "chat GPT": "ChatGPT" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o texto de cada balão cabe e dá para ler? Nenhum balão do quadro cheio cobre o rosto (ele fica ao lado, na coluna livre)?
- a conversa tem algo chegando a cada 1,5–2,5 s, sem tela parada?
- o quadro da conversa tem o que ler (as mensagens do momento e as de antes), sem a coluna quase vazia? A pessoa está centralizada na moldura da direita?
- no meio das trocas (`node scripts/stills.mjs 8.55 8.6 8.65 8.7` em volta de cada `de`): a pessoa está no meio do movimento, nenhum balão passa por cima do rosto e nunca há dois textos um sobre o outro?
- nada importante abaixo de y 984 (controles do player)?

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-conversa.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é encenado (as mensagens do outro lado) e o que é ilustrativo (curvas sem números ditos);
- o que o usuário deve conferir (preço ou produto de exemplo, uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | quadro cheio: um balão seu ao lado do rosto com o título já esboçado (a capa do post), cada palavra acende quando é dita; o `destaque` trava no escuro com letra tangerina |
| lista | `topicos` | tela do app: cada item chega como uma mensagem sua, no seu `em`, com um "digitando…" curto; o `titulo` vira a mensagem fixada; o `detalhe` é uma segunda linha menor que acende quando é dita |
| passos | `passos` | tela do app: cada passo chega como mensagem com o número numa bolinha escura; o anterior ganha ✓ quando o próximo é dito; a fixada conta "1/3 → 2/3 → 3/3" |
| número | `numero` | quadro cheio: um balão seu com o rótulo pequeno e os pontinhos no lugar do valor; no `em`, o valor conta até o número (pt-BR, até 120 px) |
| comparação | `comparacao` | tela do app: duas faixas, uma embaixo da outra no quadro da esquerda (rótulo + balão), com × ou ↓ entre elas; o lado que perde esfria para cinza com ✕, o que ganha acende com borda e ✓ |
| gráfico | `grafico` | tela do app: um cartão claro compartilhado na conversa; barras deitadas que crescem, linha que anda de ponto em ponto ou rosca que se fecha, cada dado no seu `em`; sem números ditos, uma curva que se desenha com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | quadro cheio: a palavra grande (800) num balão ao lado do rosto; `chave` = tangerina; `alerta` = balão frio com ✕ (a cor do que dá errado); o `detalhe` acende embaixo quando é dito |
| definição | `definicao` | tela do app: o termo chega em negrito; o significado chega como **resposta** a ele, com o termo citado em cima (como "responder" no app) |
| frase | `frase` | quadro cheio: o balão se escreve palavra por palavra; `destaque` trava no escuro; `risco` é riscado por um traço na palavra dita |
| pergunta | `pergunta` | quadro cheio: o balão se escreve na fala e as `opcoes` entram embaixo como **respostas rápidas** (botões do app), cada uma na sua palavra; depois, o contato fica "digitando…" |
| fechamento | `cta` | quadro cheio: um balão com a chamada escrita na fala e um botão do app tocado na palavra (Salvar → Salvo, Seguir → Seguindo, Comentar, Saiba mais); a pílula do topo vira a assinatura |
| **assinatura** | `conversa` | tela do app: troca de mensagens encenada entre você e o outro lado (`de: "eu"` / `"outro"`), com "digitando…", "Visto", o que esfria, reações, preço com condição, cartão e confirmação; a fixada diz o passo ou o erro |
| **assinatura** | `contraste` | tela do app: duas faixas no quadro da esquerda, lidas como a frase falada, "isto → vira aquilo": uma mensagem, a seta que se desenha no "vira" e o desfecho (`ruim`: o balão de resposta que nunca chega; `bom`: o cartão com ✓) |
| **assinatura** | `balao` | quadro cheio: UMA mensagem de qualquer lado ao lado do rosto, as suas à direita da pessoa e as do outro lado à esquerda (a dúvida do outro lado chegando com "digitando…", o cartão que você manda); entra na conversa seguinte |

## A assinatura em qualquer assunto

A assinatura é **a conversa**: a fala vira uma troca de mensagens. O que a pessoa afirma, ensina ou recomenda chega como mensagem **dela** (tangerina); a dúvida, a objeção, o pedido ou a reação de quem assiste chega como mensagem **do outro lado** (ardósia), com as palavras da fala. O que dá errado esfria e fica no "Visto"; o que dá certo acende, ganha ✓ ou reação. O `contraste` é "este caminho esfria, aquele acende". Toda fala tem isso: um erro e um acerto, uma pergunta e uma resposta, um conselho e o resultado.

Três exemplos fora de vendas:

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar."
   `conversa` com `fixada: { rotulo: "Erro", tom: "errado", texto: "Tem gente que perde" }` e três mensagens suas que **esfriam** quando cada motivo é dito: "Compra por impulso" (`esfriaEm` em "impulso"), "Moeda sem critério", "Risco que não entende". Depois um `balao` do **outro lado**: "Como avaliar os projetos e pensar no posicionamento?" chega com "digitando…" enquanto a pergunta é feita, e um `balao` seu com o `cartao` "Aula gratuita" (`desenho: "curso"`, linha "Para te explicar").
2. **Saúde (sono).** "Você deita, pega o celular e quando vê já é uma da manhã. Troca a tela por um livro: em uma semana você dorme mais rápido."
   `contraste`: faixa de cima "Celular na cama" com a mensagem "Só mais um vídeo" → desfecho `ruim` "1h da manhã"; faixa de baixo "Livro" com "Boa noite" → desfecho `bom` "dorme" (sem `valor`, um selo ✓). Ou uma `conversa`: o outro lado manda "Não consigo dormir" (em "deita"), você responde "Troca a tela por um livro" (em "troca") e ele reage com ✓ em "semana".
3. **Relacionamento / história pessoal.** "Eu mandei 'precisamos conversar' e fiquei três dias sem resposta. Hoje eu sei: a mensagem certa é dizer o que você sente, não cobrar."
   `conversa` com `fixada: { rotulo: "Errado", tom: "errado", texto: "Cobrar" }`: sua mensagem "Precisamos conversar" chega, ganha "Visto" e esfria; um `digitando` do outro lado aparece e some (o vácuo) em "três dias". Depois outra `conversa` com `fixada: { rotulo: "Certo", texto: "Dizer o que sente" }`: "Senti sua falta" e a resposta do outro lado com uma reação de coração.

Outros usos: plantas ("ainda úmida?" → "espera mais um dia" com um joinha desenhado), aulas (a dúvida do aluno chega e a resposta vem em passos), carreira (o e-mail que fica no "Visto" × o que recebe resposta). Os blocos universais vivem **dentro** dessa conversa: listas, passos, definições e gráficos são mensagens; abertura, número, destaque, frase e pergunta são balões ao lado do rosto.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- As mensagens do outro lado são encenação: curtas, naturais, com as palavras da fala ("Como avaliar os projetos?"). Nunca ponha na boca do outro lado um número, um elogio, um resultado ou um depoimento que não foi dito.
- Não invente número, nome, preço, taxa nem fato. Preço e produto: os reais, informados pelo usuário; sem eles, deixe de fora (ou valores redondos de exemplo, avisados na entrega).
- Número ilustrativo só onde o bloco permite (`numero` e `grafico` com `ilustrativo`, a curva de tendência), sempre com a etiqueta ILUSTRATIVO visível.

## Limites

- A saída é sempre deitada 1920×1080 (16:9), com uma pessoa falando para a câmera. A versão vertical (Reels, TikTok, Shorts) é o modelo `modelo-conversa`.
- O app é fictício e sem marca: não imite WhatsApp, Instagram nem nenhum app real (nada de logo, verde do WhatsApp ou gradiente do Instagram), e nenhum meio de pagamento com nome de marca.
- Sem trilha musical e sem b-roll: os desenhos são a traço e vêm de uma biblioteca fixa (lista em `references/plano.md`).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure na fala um erro e um acerto (`contraste`, ou uma `conversa` em que o erro esfria), uma dúvida e a resposta (`balao` do outro lado + sua resposta) ou um conselho e a reação (`conversa` com `reacao`). Veja os exemplos acima.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Balão pequeno demais ou com muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou divida em duas mensagens.
- **A conversa sobe e some antes de ler**: mensagens demais em pouco tempo; deixe no máximo uma mensagem nova a cada ~0,5 s, ou divida em duas telas.
- **O primeiro item de uma lista some lá em cima**: com 5 itens longos a conversa rola; encurte os itens ou use menos.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
