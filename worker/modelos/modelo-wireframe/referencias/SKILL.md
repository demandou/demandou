---
name: modelo-wireframe
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Wireframe: a tela vira um canvas de design (grafite com grade de pontos). A pessoa abre em quadro cheio com o título como camada de texto selecionada, depois encolhe e vira um comentário fixado ao lado de um celular em wireframe ou de um frame de design com painel de camadas; cada ideia ganha etiqueta vermelha numerada, contorno tracejado e medida (listas, passos, comparações, gráficos, números, alertas) e, no conserto, o wireframe vira página limpa na cor da marca. Serve para qualquer assunto (landing page, finanças, saúde, corrida, direito, vendas, aulas): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Wireframe\", \"estilo canvas de design\" ou \"estilo revisão de página\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Wireframe

Transforma uma gravação bruta (uma pessoa falando para a câmera) num vídeo vertical que parece uma revisão num programa de design. A pessoa abre em quadro cheio com o título montado como uma camada de texto selecionada; quando a explicação começa, ela encolhe e vira um **comentário fixado no canvas**, ao lado de um celular em wireframe cinza (ou de um frame de design, para listas, passos, comparações e gráficos). Cada ideia ganha a sua etiqueta vermelha numerada e a sua medida; no conserto, o wireframe se reconstrói limpo e colorido, passo a passo, no ritmo da fala; no fim ela volta ao quadro cheio com um comentário que pede para salvar. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, renderizar); você faz a parte de editor e de designer (escolher as tomadas, traduzir a fala para os blocos, ligar cada item à palavra certa, conferir o resultado).

**Este modelo é um estilo, não um assunto.** O exemplo foi uma revisão de página, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** movimento editorial, decidido, sem quique. Tudo o que ainda não foi dito é só uma **barra cinza de wireframe** do tamanho da palavra; ela vira texto no instante em que a palavra é dita. Itens ganham contorno vermelho tracejado e etiqueta numerada quando entram; a página, o frame e o inspetor se mexem sozinhos. A pessoa encolhe para o comentário e cresce de volta cruzando com o conteúdo: nunca há quadro vazio nem duas páginas de texto uma sobre a outra.
- **Organização e hierarquia:** uma ideia grande por vez, num cartão claro. No canvas, o conteúdo fica à esquerda (celular ou frame), o painel de inspetor ou de camadas à direita, a pessoa em cima. Itens são cartões numerados; o vermelho marca o que é revisado, a cor da página marca o que ficou certo.
- **Tipografia:** Inclusive Sans (títulos 700, texto 500; o "I" tem serifa e o "l" tem cauda, não se confundem), Red Hat Mono para medidas, nomes de camada e números, Young Serif só na promessa da página reconstruída. Títulos de 44 a 92 px, texto de 36 a 62, nada abaixo de 30.
- **Moldura da pessoa:** quadro cheio com o rosto na linha do centro e um cartão claro na altura do peito (camada selecionada com alças e a medida L × A), ou o comentário fixado no alto à direita, com o balão da fala embaixo. Nunca numa coluna estreita.
- **Cores, textura e som:** canvas grafite com grade de pontos, cinzas do wireframe, vermelho de revisão (etiquetas, contornos, alertas) e a cor da página (do plano, em `pagina.cor`) para o que foi resolvido. Sem brilho, sem emoji, sem logotipo. Sons tonais e raros: tons que descem a cada erro, tons que sobem a cada conserto.

## Antes de começar

0. **Ambiente.** Este modelo roda **no computador** do usuário (Claude Code, o app do Claude com acesso ao terminal, ou o Codex). Se você não consegue rodar comandos nele (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**: não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
1. **Carregue a skill do Remotion** (`remotion-best-practices`). Este modelo é um projeto Remotion e as regras dela valem aqui. Se não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. Três ressalvas, porque aqui o projeto já vem pronto: não precisa carregar `remotion-create` nem abrir o Studio (os quadros do `stills.mjs` são a prévia), e o pedido de edição já é o pedido para renderizar.
2. Confirme o caminho do vídeo. Se o usuário não disse o **nome e a área** de quem aparece (ex.: "Carla" / "UX"), pergunte uma vez: vão no cabeçalho do comentário (no canvas e no fechamento). Sem resposta, siga sem nome (o comentário se chama "Comentário").
3. **A página do celular é fictícia** (só aparece nos momentos `revisao`, `conserto` e `resultado`). Se a fala é sobre um negócio ou produto do usuário, pergunte (uma vez) o nome da marca, a promessa e a cor; sem resposta, invente uma página plausível para o assunto (uma padaria, um curso, uma clínica, um plano de treino), **sem marca real e sem logotipo**, e diga na entrega o que inventou. Tudo que a página "corrige" tem que ser o que a pessoa disse.
4. Requisitos: Node 18+ e uns 3,5 GB livres na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto em si, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).

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

- **tentativas abandonadas e repetidas** — a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala — ouça com atenção, costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (meça: `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -` — perto de −60 dB é silêncio; −30 dB ou mais alto é fala). Um "Um:", "Dois:" curto também pode voltar como `[sem fala, sai]`: confira do mesmo jeito antes de aceitar.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo, **a pausa antes do primeiro erro vira o corte em que a pessoa encolhe para o canvas**, e a pausa antes do fechamento, o corte em que ela volta (o movimento esconde o pulo). Mantenha a proposta do `preparar`: cada trecho de fala separado. Pausas curtas dentro de uma frase (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` na raiz do projeto fixa a gravação vertical em 9:16 (a pessoa muda de lugar entre o quadro cheio e o comentário no canvas); gravação horizontal vira 3:4, e a faixa de baixo vira o canvas. Não precisa passar `--recorte`. **Refazendo o corte depois de já ter planejado, use `--manter-plano`**: sem ele, o plano volta ao esqueleto e `pagina`, `momentos`, `marca` e `correcoes` se perdem.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias (15%, 50% e 85% do vídeo). Nos quadros em **quadro cheio**: a cruz deve cair no rosto e a linha vertical fina mostra o centro do quadro (o rosto deve estar nela); a caixa azul tracejada (cartões do título, das frases e do fechamento) deve começar abaixo do queixo; a amarela é a legenda; tudo acima da linha vermelha e fora da faixa rosa da direita (interface do aplicativo). Nos quadros de **canvas**: o rosto tem que aparecer inteiro na caixa roxa "pessoa", com um respiro em cima. Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: cada batida (ideia de 2 a 5 s) ganha uma forma (lista, número, comparação, erro, conserto…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`revisao`, `conserto` ou `resultado`) entra pelo menos uma vez, mesmo que o assunto não seja uma página: veja "A assinatura em qualquer assunto".

### 7. Planejar a página e os momentos

Leia `references/plano.md` (a gramática quadro cheio × canvas, a página fictícia, cada bloco, limites de texto e regras de tempo) e preencha em `src/plano.json`: `marca`, `pagina`, `momentos`, `semLegenda` e `correcoes`. Se algum momento usar o celular (`revisao`, `conserto`, `resultado`), monte a `pagina`; sem eles, ela não aparece.

Tudo que aparece na tela tem que ser fiel ao que a pessoa disse; não invente dado, regra ou número que contradiga a fala. Os números do inspetor (palavras, px de rolagem, peso da imagem, links) são ilustrativos e ficam em `pagina`: se o assunto não é uma página, use `medida` no erro e no passo (veja `references/plano.md`) para o inspetor mostrar só o que veio da fala.

Depois:

```bash
node scripts/conferir.mjs --mapa     # corrija até aparecer APROVADO
node scripts/legendas.mjs
```

Se o `conferir` reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele. **Não use `--forcar`.** O `legendas.mjs` lista as linhas de fala dos trechos que mostram legenda (nos momentos de canvas com `"legenda": true` são as linhas do **balão do comentário**) e marca linha com palavra sozinha ou terminando em "de", "e", "um". Nomes e termos que a transcrição errou vão em `correcoes`; só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um logo depois do fim. Abra cada imagem **reduzida a ~540 px de largura** e confira de verdade: o texto cabe? A etiqueta ou o item certo aparece na palavra certa? O rosto aparece inteiro no comentário e livre em quadro cheio? Confira também o **meio das trocas** (a entrada de cada momento de canvas e o `de` do fechamento): o canvas aparece já desenhado atrás da pessoa que encolhe, o cartão de quadro cheio só entra quando ela já cobriu o canvas, e nunca há duas páginas de texto sobrepostas. Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-wireframe.mp4"
```

Confere o plano de novo, renderiza e normaliza o áudio. Entregue:

- o caminho do arquivo;
- a duração final e quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- a página fictícia que você montou, se houve (marca, promessa, cor);
- o que é ilustrativo (números do inspetor, gráficos sem números ditos);
- o que o usuário deve conferir (uma tomada em que você ficou em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | quadro cheio: o título como camada de texto selecionada (caixa vermelha, alças, nome "Título", medida L × A); cada palavra nasce como barra cinza e vira texto |
| lista | `topicos` | frame de design no lugar do celular: cartões brancos com etiqueta vermelha numerada, contorno tracejado no item atual; painel de camadas ao lado |
| passos | `passos` | o mesmo frame, com um conector tracejado que se completa em vermelho até o próximo passo |
| número | `numero` | quadro cheio: camada selecionada com o número em mono grande contando (US$ 83.000), marca-texto da cor da página e a medida L × A |
| comparação | `comparacao` | frame com dois cartões empilhados e um selo VS; o vencedor ganha a cor da página com ✓, o outro apaga; `antes-depois` e `errado-certo` pintam o segundo cartão de cor |
| gráfico | `grafico` | frame com barras horizontais, linha com pontos numerados, pizza ou a curva da tendência, sempre com etiqueta ILUSTRATIVO quando não há números ditos |
| destaque | `destaque` | quadro cheio: `alerta` = cartão vermelho com texto branco e "!"; `chave` = marca-texto da cor da página sob o texto |
| definição | `definicao` | quadro cheio: duas camadas, o termo (com marca-texto) e o significado, ligadas por uma redline "24 px" |
| frase | `frase` | quadro cheio: camada de texto; o trecho `risco` é riscado em vermelho quando é dito |
| pergunta | `pergunta` | quadro cheio: a pergunta e as opções como botões de rádio tracejados que se preenchem na palavra dita |
| fechamento | `cta` | quadro cheio: o comentário do designer com a ação (salvar, seguir, comentar, link) que acende e o "Resolver" que vira "Resolvido" |
| **assinatura** | `revisao`, `conserto`, `resultado` | o celular em wireframe com erros numerados e medidos, a página que se reconstrói na cor da marca e os avisos de venda |

## A assinatura em qualquer assunto

A assinatura do Wireframe é **revisar algo, marcar o que está errado e mostrar o que fica certo**. Serve de metáfora para qualquer "erro → conserto". Cada erro tem um tipo que escolhe a área do celular (`texto` = excesso, `botao` = o que fica escondido, `contraste` = o que não se destaca, `imagem` = o que pesa, `menu` = opções demais) e um `rotulo` livre. Para assuntos que não são uma página, dê `medida: false` (só o nome do problema) ou `medida: { "valor": "3 de 10", "texto": "compram por impulso" }` com o que foi dito, e o mesmo nos passos do conserto.

1. **Cripto / finanças.** Fala: "tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende… analiso o mercado, os riscos e a escolha dos ativos." → `revisao` com 3 erros (`texto` "Compra impulsiva", `contraste` "Sem critério", `botao` "Risco invisível", todos com `medida: false`) e `conserto` com 3 passos (`promessa` "Mercado", `botao` "Riscos", `contraste` "Ativos"). A `pagina` vira "Seu plano": promessa "Entenda antes de investir.", botão "Ver a aula".
2. **Saúde ou corrida.** Fala: "Usa zonas de frequência cardíaca. A zona 2 é aquela em que você consegue conversar." → `conserto` (sem revisão) com passos "Zonas", "Zona 2", "Conversar": a página "Plano de treino" se monta em cor, passo a passo.
3. **Relacionamento ou história pessoal.** Fala: "Eu respondia no impulso, brigava por tudo e me afastava… hoje eu respiro antes de falar." → `revisao` com os três hábitos (rótulos "Resposta no impulso", "Briga", "Afastamento") e `conserto` com "Respira". A página é "Minha rotina"; tudo que o inspetor mostra vem da fala (`medida: false`).

## Fidelidade

- Tudo na tela vem da fala. Pode resumir, mas não pode mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Os números do inspetor da página fictícia são ilustrativos; fora de páginas, use `medida: false`.
- Gráfico sem números ditos usa a forma qualitativa (`tendencia`) com `ilustrativo: true`.

## Quando algo dá errado

- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A página voltou a ser a genérica ("Sua marca")**: o `cortar.mjs` foi rodado de novo sem `--manter-plano` e apagou `pagina`. Recoloque o bloco.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele (`references/adaptar.md`). Nunca use `--forcar`.
- **Promessa quebrada em 4 linhas ou letra pequena no celular**: passou de ~36 caracteres; encurte (a promessa é uma frase só).
- **Etiquetas uma em cima da outra**: dois erros do mesmo tipo no plano; cada tipo tem uma área só no celular, então use um tipo por erro (ver `references/plano.md`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
