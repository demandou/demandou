---
name: modelo-raiox
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Raio-X: uma sala de laudos escura, azulada, em que a pessoa vira uma chapa iluminada que muda de lado e embaixo acende um negatoscópio com o filme do momento (lista de achados, régua de passos, duas chapas lado a lado, gráfico em traço de osso, e o raio-x de uma coluna que mostra onde está a tensão em vermelho e o que corrige em ciano com ✓). Serve para qualquer assunto (o exemplo é fisioterapia e postura, mas funciona com finanças e cripto, IA, vendas, carreira, relacionamento, aulas): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir \"modelo Raio-X\", \"estilo raio-x\", \"negatoscópio\" ou \"estilo laudo\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920 feito com Remotion."
---

# Modelo Raio-X

O vídeo vira uma sala de laudos. A pessoa abre em quadro cheio, com uma chapa-cartão na altura do peito; nos blocos de informação, ela vira uma chapa iluminada no alto da tela (à esquerda ou à direita, alternando) e embaixo acende um negatoscópio, com um filme novo para cada momento. A assinatura é o **raio-x**: uma coluna que mostra onde está a tensão (ponto vermelho que acende e pulsa) e o que corrige (ciano, ✓), ou, nos vídeos de postura, o esqueleto sentado que se corrige. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com fisioterapia e postura, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** o texto se revela como filme no revelador: cada palavra nasce em esboço e acende no instante em que é dita (leve desfoque que assenta, passando pelo ciano até o branco). Cada item acende o seu anel, a régua se enche, o número conta, o traço se desenha. Entra decidido e assenta, sem quique. As trocas cruzam: a chapa nova desliza da direita por cima da anterior, e a pessoa muda de lugar no mesmo gesto, sem quadro vazio.
- **Organização e hierarquia:** no negatoscópio, o bloco do título fica de um lado da pessoa e o filme do momento ocupa a metade de baixo. Uma coisa grande por vez (o título, o número, a frase); rótulos de filme, etiquetas e "ilustrativo" ficam pequenos, em caixa alta mono. Em quadro cheio, a chapa-cartão fica abaixo do queixo.
- **Tipografia:** Inclusive Sans (700 nos títulos, 500 no apoio, 600 na legenda; o I maiúsculo é serifado) e Reddit Mono nas marcações de filme. Nada de condensada. Títulos de 60 a 116 px, nada abaixo de 32 px. Todo texto é medido e reduzido para caber.
- **Moldura da pessoa:** quadro cheio com o rosto na linha do centro, ou uma **chapa iluminada** (aro escuro, borda de luz fria, rodapé com nome e área) no alto, à esquerda ou à direita, e no centro na pausa. Cabeça inteira, nunca numa coluna estreita, sem brilho atrás dela; o rosto não recebe filtro de raio-x. A chapa segue o rosto.
- **Cores, textura e som:** fundo quase preto azulado, filme em negativo azulado com grão, traço de osso claro, **ciano para medida e para o que está certo**, **vermelho só para tensão e alerta**. Som raro e tonal: um "vum" grave quando o negatoscópio acende, duas notas subindo quando a tensão apaga, um acorde curto no fim.

## Antes de começar

1. **Carregue a skill do Remotion** (`remotion-best-practices`). Este modelo é um projeto Remotion e as regras dela valem aqui. Se não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. Três ressalvas, porque aqui o projeto já vem pronto: não precisa carregar `remotion-create` nem abrir o Studio (os quadros do `stills.mjs` são a prévia), e o pedido de edição já é o pedido para renderizar.
2. Confirme o caminho do vídeo. Se o usuário não disse o **nome e a área** de quem aparece (ex.: "Dra. Ana Lima" / "Fisioterapia"), pergunte uma vez: eles vão no rodapé da chapa da pessoa e na assinatura do fechamento. Sem resposta, siga sem nome (a chapa fica sem rodapé e o fechamento sem assinatura).
3. Requisitos: Node 18+ e uns 3,5 GB livres na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto em si, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).

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

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Antes de aceitar um item `[sem fala, sai]` curto no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo, **a pausa antes de cada item vira corte, e é nela que a pessoa muda de lugar** (de quadro cheio para a chapa no alto, de um lado para o outro, para o centro e de volta): o movimento esconde o pulo do corte. Mantenha a proposta do `preparar`: cada trecho de fala separado. Pausas curtas dentro de uma frase (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.495 --rosto-y 0.30 --queixo-y 0.405
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` na raiz do projeto fixa a gravação vertical em 9:16 (a pessoa muda de lugar entre o quadro cheio e as chapas, e o 9:16 amplia menos o vídeo); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto e a linha vertical fina mostra o centro do quadro (o rosto deve estar nela); a caixa azul tracejada (artes de quadro cheio: abertura, laudo, fechamento) deve começar abaixo do queixo; as roxas são as três chapas da pessoa (esquerda, direita e a da pausa, no centro) — o rosto aparece inteiro nelas; a laranja é o negatoscópio; a amarela é a legenda; as linhas vermelhas são o topo seguro e o limite da interface do aplicativo, e a rosa tracejada à direita marca a coluna de botões (nenhum texto passa dela). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: uma linha por batida (2 a 5 s, uma ideia), com o tempo, o trecho falado, a forma (lista, número, comparação, tendência…), o bloco **deste modelo** (tabela "Blocos deste modelo") e o que aparece na tela. A assinatura (`ajuste`) entra **pelo menos uma vez**, como metáfora se o assunto não for postura (veja "A assinatura em qualquer assunto").

Pense também no **lugar da pessoa**: quadro cheio no começo e no fim, e a chapa alternando de lado entre os blocos do negatoscópio.

### 7. Planejar os momentos

Leia `references/plano.md` (a gramática, os campos de cada bloco, a cena da chapa, os limites de texto e as regras de tempo) e preencha em `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, passo e rótulo tem o seu `em`, tirado de `work/palavras.json`; nada aparece antes de ser dito. Tudo o que aparece na tela vem da fala: não invente número, ângulo nem recomendação que a pessoa não deu.

No modo postura (esqueleto sentado), pense como o fisioterapeuta que mostra a chapa ao paciente: cada `ajuste` é uma correção (`tensao`, `corrige` no verbo, `linha`, `angulo`, `apoio`). Em qualquer outro assunto, o `ajuste` usa `itens`: os problemas acendem em vermelho nas vértebras e o conserto alinha a coluna.

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza. Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda com o tempo (só existem nos trechos sem momento) e marca linha com palavra sozinha ou terminando em "de", "e", "um".

### 8. Conferir os momentos

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`: cada passo da chapa, `apagaEm`, os itens da chamada, o relógio, o levantar, o caminhar, o cronômetro) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade: o título cabe ao lado da chapa da pessoa? O rosto aparece inteiro na chapa (sem cortar a cabeça)? O ponto de tensão está no lugar certo do corpo? Os rótulos se sobrepõem? A parte se corrigiu na palavra certa? O arco mostra 90° quando a pessoa fala de 90°? Confira também o **meio das trocas** (o `de` de cada ajuste e da pausa, e o `de` do fechamento + 0,3 s): a chapa nova tem que chegar já desenhada, e a arte de quadro cheio só entra quando a pessoa já cobriu o negatoscópio. Corrija o plano e repita até estar limpo. Para um instante específico: `node scripts/stills.mjs 12.4 18`.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-raiox.mp4"
```

Renderiza e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e para onde a chapa foi);
- o que é **ilustrativo** (curva sem números, raio-x como metáfora);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma simplificação que você fez).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Quadro cheio. Chapa-cartão no peito: miniatura de uma chapa à esquerda e o texto se revelando palavra por palavra; o `destaque` em vermelho acende os pontos de tensão da miniatura. |
| lista | `topicos` | Negatoscópio. Achados no filme: cada item acende o seu anel quando é dito e a faixa de leitura ciano desce até ele. |
| passos | `passos` | Negatoscópio. Régua vertical com marcas: cada passo acende o seu número e a régua se enche até ele. |
| número | `numero` | Quadro cheio. Mostrador cujo anel se completa e o número contando ao lado; rótulo em marcação de filme. |
| comparação | `comparacao` | Negatoscópio. Duas chapas lado a lado, como quem compara dois filmes; o vencedor ganha ciano e ✓. |
| gráfico | `grafico` | Negatoscópio. Barras, linha ou anel em traço de osso; sem números, uma curva de tendência com a etiqueta "ilustrativo". |
| destaque | `destaque` | Quadro cheio. `alerta`: vermelho com o ponto de tensão pulsando; `chave`: branco com a régua ciano que se desenha embaixo. |
| definição | `definicao` | Quadro cheio. O termo grande, a cota ciano (├──┤) que o mede e o significado embaixo. |
| frase | `frase` | Quadro cheio. A frase palavra por palavra; `destaque` em ciano; o `risco` riscado em vermelho. |
| pergunta | `pergunta` | Quadro cheio. "?" num anel ciano e a pergunta; as `opcoes` entram como etiquetas de filme. |
| fechamento | `cta` | Quadro cheio. Ícone, chamada com `destaque` em ciano, as chapas do vídeo em miniatura (cada uma ganha ✓) e a assinatura. |
| **assinatura** | `ajuste` | Negatoscópio. O raio-x: com `itens`, uma coluna vista de frente com cada item preso a uma vértebra (tensão em vermelho, `ok` já em ciano ✓) e o `alinha` que a endireita; com `vista` + `passos`, o esqueleto sentado que se corrige. |
| outros tipos próprios | `laudo` | Quadro cheio. Uma regra, dado ou alerta que merece ficar, com etiqueta ("LAUDO", "REGRA"). |
| | `pausa` | Chapa no centro entre um relógio e um cronômetro; "a cada X, faça Y". |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa (`tendencia` no gráfico).

## A assinatura em qualquer assunto

A assinatura do Raio-X é **"onde está a tensão e o que corrige"**: a coluna do raio-x é a metáfora de qualquer sistema com um ponto que dói. Cada item vira uma vértebra: vermelho para o problema, ciano com ✓ para o que está certo ou o conserto, e o `alinha` endireita tudo.

1. **Finanças / cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Como avaliar os projetos e pensar no seu posicionamento?"
   - `ajuste` com `itens`: título "Mesmo na alta, tem gente que perde"; três tensões em vermelho ("Compra por impulso", "Moeda sem critério", "Risco que não entende"), cada uma na sua palavra.
   - Segundo `ajuste`: "Como avaliar os projetos?", itens `ok` "Avaliar os projetos" e "Posicionamento", e `alinha`: a coluna se endireita e as três tensões apagam com ✓.
2. **IA no dia a dia.** "Monta o prompt em quatro peças: papel, tarefa, contexto e formato. Com essas peças, a resposta muda completamente."
   - `ajuste` com `itens` do tipo `ok`: Papel, Tarefa, Contexto e Formato, cada um acendendo em ciano na palavra dita, e `alinha` no fim, quando o prompt fica montado.
3. **Relacionamento (bem distante).** "A gente briga porque eu só ouço pela metade, respondo com pressa e esqueço o que ela pediu. O certo é ouvir até o fim."
   - `ajuste` com `itens`: três tensões ("Ouço pela metade", "Respondo com pressa", "Esqueço o que ela pediu").
   - Depois, um item `ok` "Ouvir até o fim" e o `alinha`.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, ângulo nem recomendação que a pessoa não disse.
- A coluna do raio-x e os pontos de tensão são uma **metáfora**, não uma medida: diga isso na entrega quando o assunto não for corpo. Sem número dito, o gráfico usa `tendencia` com `ilustrativo: true`.
- Em vídeos de saúde: nada de diagnóstico nem promessa de resultado.

## Quando algo dá errado

- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`. Faltou a assinatura: use o `ajuste` com `itens`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Título pequeno demais ou quebrado em muitas linhas**: passou do limite do componente; encurte conforme `references/plano.md` (o template diminui o corpo até o mínimo para caber).
- **Rótulos da chapa se sobrepondo**: dois passos com rótulo no mesmo canto do desenho. Tire o `rotulo` de um deles (o título já diz a palavra) ou use alvos diferentes.
- **A cabeça corta no alto da chapa da pessoa**: o enquadramento é fechado. Em `src/tema.ts`, diminua o `zoom` de `PESSOA_ESQUERDA` (1,55 → 1,35); o rosto fica menor, mas inteiro.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
