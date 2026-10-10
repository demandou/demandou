---
name: modelo-carrossel
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Carrossel: o vídeo inteiro vira um post de carrossel do Instagram. Páginas creme deslizam da direita, os pontinhos e o contador \"3/7\" ficam à vista, a pessoa é a capa (cartão no peito) e vira avatar no cabeçalho das páginas de conteúdo; o gesto da casa é o \"sai → entra\" (o item velho riscado em coral, a seta, o novo chegando num cartão petróleo), com listas, passos, gráficos, definições e enquete no mesmo traço. Serve para qualquer assunto (o exemplo do modelo é alimentação, mas funciona com finanças, cripto, saúde, carreira, ciência, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Carrossel\", \"estilo carrossel\", \"com páginas deslizando\" ou \"como um post de carrossel\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Carrossel

O vídeo inteiro se comporta como um post de carrossel do Instagram. Cada ideia é uma página que entra deslizando da direita; a pessoa é a capa, sai pelo lado quando uma página de conteúdo entra (e fica viva num avatar no cabeçalho) e volta nas páginas dela, com um cartão creme na altura do peito. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em páginas, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com alimentação ("3 trocas simples"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo é página. A troca de página é sempre um deslize da direita para a esquerda (0,62 s, arranca macio e freia longo, como o dedo que solta a página); no meio do deslize as duas páginas recuam e ganham cantos redondos sobre o "tampo" petróleo. Dentro da página, cada coisa chega no instante em que é dita: palavras sobem de trás de uma régua, itens chegam deslizando da direita para uma vaga tracejada que já esperava, o risco coral atravessa o que sai, números contam, traços se desenham. Sem quique, sem brilho.
- **Organização e hierarquia:** uma ideia por página, como num carrossel que a gente salva. Na página de conteúdo: cabeçalho (avatar + nome) → título grande → o corpo (cartões, lista, gráfico) ocupando a página até os pontinhos. Na página da pessoa: um cartão só, abaixo do queixo. Um item grande por vez; rótulos em caixa alta pequenos; o contador "3/7" e os pontinhos dizem quanto falta.
- **Tipografia:** uma família só, Parkinsans (geométrica, aberta; o I maiúsculo tem serifa e nunca vira "l"), de 500 a 800. Títulos 800 compactos (62 a 150 px), nomes de itens 600 (44 a 90 px), apoio 500 (40 a 54 px), rótulos em caixa alta espaçada (30 a 34 px). O texto é medido com as larguras reais da fonte e encolhe para caber; nunca vaza.
- **Moldura da pessoa:** três lugares. Página da pessoa: quadro cheio, rosto na linha do centro, cartão creme no peito. Página de conteúdo: a pessoa sai junto com a página e fica num avatar redondo com anel coral no cabeçalho, como o de um post. Calendário: ela volta num cartão arredondado no alto. A troca de lugar é o próprio deslize; o rosto é seguido quadro a quadro. Nada de coluna vertical estreita.
- **Cores, textura e som:** creme `#F4ECE1` (papel), areia `#E8DAC7` (o que sai, as vagas), petróleo `#0F4B5A` (texto) e petróleo escuro `#0A3440` (o cartão que entra, o alerta, o tampo), e **um** acento coral `#E9684C` (o numeral, o risco, a seta, o marcador da vez, o botão). Desenhos a traço de 7 px com pontas redondas e cor chapada que acende depois. Sons tonais e raros: um "vum" grave por página (sobe de nota a cada página), duas notas quando algo novo chega, um toque grave no destaque e no botão.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Finanças sem drama"): vão no cabeçalho das páginas de conteúdo (como o de um post) e na assinatura do fechamento. Sem resposta, siga sem nome (o cabeçalho fica só com o avatar).

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

Neste modelo **as pausas entre frases viram cortes, e é nos cortes que as páginas deslizam** (o deslize esconde o pulo do corte). Mantenha a proposta do `preparar`: cada trecho de fala separado. Pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.48 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa ocupa a página inteira; mais nítido); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Em gravação muito perto da câmera ele protege o topo da cabeça e avisa; os cartões da página da pessoa encolhem para caber abaixo do queixo. Se ele disser **"queixo em" mais de ~1060 px**, rode de novo com `--recorte 3:4`: a pessoa fica no alto de uma página creme, com os cartões logo abaixo do queixo. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto (a linha vertical fina mostra o centro do quadro — o rosto deve estar nela); a caixa azul (zona dos cartões nas páginas da pessoa) deve começar abaixo do queixo; a roxa é onde a pessoa está naquele instante; a amarela é a legenda; as laranja são os pontinhos (embaixo) e o canto reservado ao contador "3/7" (em cima, à direita); nada importante abaixo da linha vermelha (interface do aplicativo). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`troca`, ou a `comparacao`, que usa a mesma página "sai → entra") entra pelo menos uma vez**, mesmo que o assunto seja outro: veja "A assinatura em qualquer assunto".

Pense como quem monta um carrossel: **uma ideia por página**.
- Alterne os lugares da pessoa: depois de uma a três páginas de conteúdo, uma página da pessoa (número, destaque, frase, pergunta) a traz de volta. No máximo ~12 s seguidos sem ela em quadro cheio.
- Abra com uma página da pessoa (`abertura`, `capa` ou `numero`: vira a capa do post) e feche com o `cta`.
- Um vídeo de 20 a 60 s pede de 5 a 12 páginas. Momentos da pessoa colados viram uma página só (o cartão troca, a página fica); cada momento de conteúdo é uma página.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, desenhos e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, dado ou opção entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`. Faça as páginas **encostadas** (o `ate` de uma = o `de` da próxima), com as fronteiras nas pausas entre frases — de preferência num valor de `cortesEm` —, para o deslize cair em cima do corte.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes` (`{ "Jão": "João", "chat GPT": "ChatGPT" }`). Só corrija o que você tem certeza; se não tiver, deixe como foi transcrito e aponte na entrega.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe, está inteiro e dá para ler?
- cada item, número, risco e opção aparece quando a palavra é dita, e é o certo?
- a página de conteúdo tem conteúdo de alto a baixo, sem um terço vazio?
- o cartão da página da pessoa fica abaixo do queixo, sem cobrir a boca?
- nada parado mais de ~2,5 s?
- o meio de dois ou três deslizes (o `de` da página − 0,1 s, por exemplo `node scripts/stills.mjs 3.1 12.75`): as duas páginas aparecem com conteúdo, sem quadro vazio e sem dois cartões sobrepostos?

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-carrossel.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho, quantas páginas);
- o que é ilustrativo (gráfico sem números ditos, a troca usada como metáfora);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma versão que você escolheu no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `capa`) | página da pessoa: cartão creme no peito, o título sobe palavra por palavra; um número no começo vira o numeral coral grande; `destaque` em coral; no primeiro quadro o cartão já está montado (capa do post) e o "arrasta →" aparece antes do primeiro deslize |
| lista | `topicos` | página de conteúdo: título grande e vagas tracejadas; cada item chega deslizando da direita num cartão areia, com marcador redondo; o marcador da vez fica coral e os anteriores escurecem; desenho opcional à direita |
| passos | `passos` | página de conteúdo: números numa coluna à esquerda ligados por uma linha pontilhada que fica cheia quando o próximo passo chega; os cartões chegam à direita |
| número | `numero` | página da pessoa: o rótulo em cima e o numeral coral contando em pt-BR (prefixo e sufixo menores), com uma régua coral que corre junto; o zero espera "a lápis" |
| comparação | `comparacao` | a página "sai → entra": lado 1 no cartão areia, lado 2 chegando da direita no cartão petróleo; × coral (`contra`) ou seta (`antes-depois`, `errado-certo`); no `errado-certo` o primeiro é riscado; o vencedor ganha um selo coral com visto e o outro apaga |
| gráfico | `grafico` | página de conteúdo: barras com contorno petróleo (a maior em coral), linha que anda de ponto em ponto com os valores embaixo, ou rosca que se completa fatia a fatia com legenda; sem números ditos, uma curva (ou barras) de tendência com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | página da pessoa: `chave` = cartão creme, texto grande e sublinhado coral; `alerta` = cartão petróleo com o sinal "!" coral; o cartão cresce linha a linha e o `detalhe` entra embaixo |
| definição | `definicao` | página de conteúdo: o termo enorme sai de um esboço a lápis e ganha sublinhado coral; um "=" coral atravessa o vão e o significado chega deslizando num cartão petróleo |
| frase | `frase` | página da pessoa: cartão creme que cresce linha a linha; `destaque` em coral; `risco` atravessado em coral, palavra por palavra, quando é dito |
| pergunta | `pergunta` | página da pessoa: "?" coral e a pergunta; as `opcoes` chegam como as barras de uma enquete do app |
| fechamento | `cta` | página da pessoa: a chamada (com `destaque` sublinhado), a assinatura e o botão do app que é tocado e muda: Seguir → Seguindo, Salvar → Salvo, Comentar → Enviado, Saiba mais → Abrindo |
| **assinatura** | `troca` | a página "sai → entra": o item velho no cartão areia é riscado em coral na palavra de ligação, a seta coral atravessa o vão e o novo chega deslizando no cartão petróleo, com desenho, complemento e etiquetas de vantagem; sem `riscaEm`, vira "de → para" (nada é riscado) |
| ritmo, constância | `calendario` | página com a pessoa num cartão no alto; cada período (semana, mês, fase) se completa quando é dito e tudo ganha visto numa onda |
| lista numerada | `lista` | como `topicos`, com números nas vagas |

## A assinatura em qualquer assunto

A `troca` mostra **"isto dá lugar àquilo"**: o hábito velho e o novo, o erro e o conserto, o mito e a verdade, o antes e o depois, "não faça X, faça Y". Sem `riscaEm`, ela mostra **"isto leva àquilo"** (de → para): um ponto de partida e um destino, um sinal e o que ele indica, uma causa e o efeito. Quase toda fala tem um dos dois. Use os `rotulos` dos cartões (padrão "Sai" e "Entra") e o `rotulo` da página (padrão "Troca 1") com palavras do assunto.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso… Agora, como avaliar os projetos e pensar no seu posicionamento?"
   `troca` com `rotulo: "Agora"`: SAI "Compra por impulso" (desenho `carrinho`), riscado em "como" (`riscaEm`); ENTRA "Avaliar os projetos" (desenho `lupa`) em "avaliar", com `extra` "e o posicionamento" em "pensar". Os motivos de perda antes dela viram `topicos`.
2. **Saúde e rotina.** "Em vez de olhar o celular antes de dormir, deixa um livro na cabeceira: você pega no sono mais rápido."
   `troca` com `rotulo: "Antes de dormir"`: SAI "Celular na cama" (`celular`), riscado em "deixa"; ENTRA "Um livro na cabeceira" (`livro`), `vantagens` "dorme mais rápido".
3. **Bem distante: astronomia (de → para, sem risco).** "O braço mais comprido aponta para a direção do Polo Sul Celeste."
   `troca` sem `riscaEm`, `rotulo: "A direção"`, `rotulos: ["O braço", "Aponta para"]`: SAI "Mais comprido" (`constelacao`); ENTRA "Polo Sul Celeste" (`bussola`) em "aponta". A seta coral liga um ao outro.

Outros usos: relacionamento ("menos cobrança, mais conversa"), carreira ("currículo genérico → currículo por vaga"), mito × verdade em qualquer área (`comparacao` com `modo: "errado-certo"`), uma receita que troca um ingrediente, uma história pessoal "eu era assim → hoje sou assim" (`rotulos: ["Antes", "Depois"]`, sem risco). Se a fala não tem nada que substitui ou leva a outra coisa, a `comparacao` (`contra`) cumpre a assinatura com dois lados ditos.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Item sem número dito fica sem número na tela.
- Número ilustrativo só onde o bloco permite (a tendência do `grafico`, o `numero` com `ilustrativo: true`), sempre com a etiqueta ILUSTRATIVO visível.
- A `troca` usada como metáfora (o que sai e o que entra não foram ditos com essas palavras) entra na entrega como leitura editorial.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure o "isto dá lugar àquilo" ou o "isto leva àquilo" na fala (veja acima) ou use a `comparacao` com dois lados ditos.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais**: passou do limite do bloco (ele encolhe para caber); encurte com as palavras da fala conforme `references/plano.md`, ou use menos itens.
- **Cartão da página da pessoa colado no queixo**: a gravação está muito perto da câmera; os cartões já encolhem para caber. Encurte o texto do cartão ou refaça o corte com `--recorte 3:4`.
- **Pulo visível no meio de uma página da pessoa**: um corte caiu longe de uma fronteira de página. O template aproxima o enquadramento 6% nesse corte para disfarçar; se ainda incomodar, mova a fronteira da página para o corte.
- **Página de conteúdo longa demais (mais de ~6 s)**: divida em duas páginas ou devolva a pessoa com um `destaque` ou uma `frase` no meio.
- **O render parou por tempo esgotado** ("timeout … exceeded") com o computador ocupado: feche outros programas pesados e rode o `render.mjs` de novo.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
