---
name: modelo-receita
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Receita: uma ficha de receita de papel creme sobe e ocupa a tela, a pessoa vai para uma janela arredondada que troca de canto, tudo se escreve a lápis e ganha tinta cacau quando é dito, com um único acento pistache, serifada DM Serif; listas viram linhas da ficha, números contam num copo medidor, e os ingredientes caem numa panela vista de cima que reage ao que é dito. Serve para qualquer assunto (o exemplo do modelo é confeitaria, mas funciona com finanças e cripto, carreira, saúde, vendas, histórias, aulas…): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar 'no modelo Receita', 'estilo receita' ou 'ficha de receita', e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual, seja a receita de um doce ou a 'receita' de qualquer resultado. Entrega um MP4 vertical 1080×1920 feito com Remotion."
---

# Modelo Receita

Transforma uma gravação bruta (uma pessoa falando para a câmera) num vídeo vertical editado no estilo Receita: o vídeo vira uma ficha de receita. A ficha começa na altura do peito com o nome da receita, sobe e ocupa a tela com a pessoa numa janela arredondada no canto; os ingredientes entram um a um e caem numa panela desenhada vista de cima; cada passo tem um número grande e a panela reage ao que a pessoa diz; no fim a ficha desce e a pessoa volta ao quadro cheio. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, renderizar); você faz a parte de editor (escolher as tomadas, dividir a fala em momentos da receita, conferir o resultado).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com confeitaria, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** movimento editorial, sem quique: entra decidido e assenta devagar. Tudo já está escrito a lápis e ganha tinta cacau palavra por palavra no instante em que é dito; o número rola como num contador; cada item de lista nasce a lápis e ganha um visto pistache. A ficha sobe e desce nas trocas, a janela da pessoa muda de canto, e a panela (que atravessa o vídeo) segura a tela. Nunca fica parado mais de ~2,5 s.
- **Organização e hierarquia:** o vídeo inteiro é uma ficha de receita de papel pautado. Um título grande (a ideia principal) e o resto menor, em linhas empilhadas; cabeçalho ao lado da janela, corpo embaixo, índice no pé. Lista = linhas da ficha; passos = círculos numerados ligados por um fio; comparação = dois cartões com × ou seta; gráfico = potes que enchem, traço a lápis ou torta.
- **Tipografia:** DM Serif Display (títulos e números) e DM Serif Text (rótulos, itens, anotações), peso único, normal e itálico; hierarquia por tamanho e itálico, nunca por peso. Rótulos em caixa alta de 56 px, itens de 68 a 76 px, títulos de 84 a 100 px; mínimos legíveis no celular.
- **Moldura da pessoa:** com a ficha no peito (abertura, destaque, definição, frase, pergunta, cta), quadro cheio com o rosto no centro e a ficha logo abaixo do queixo; com a ficha em cima (listas, passos, número, comparação, gráfico, ingredientes), uma janela arredondada de cantos grandes num canto de cima, que alterna de lado. Nada é desenhado sobre o rosto. A janela segue o rosto.
- **Cores, textura e som:** cacau `#3A2621` (a tinta de todo texto), creme de leite `#F6EFE4` (o papel), pistache `#A9BD6C` (único acento: grifo, visto, fita), caramelo `#D4883F` só para calor e alerta. Sem gradiente, brilho ou contorno em letra. Sons raros e tonais: um "vum" grave quando a ficha sobe, uma nota curta por item, nada de sino.

## Antes de começar

1. **Carregue a skill do Remotion** (`remotion-best-practices`). Este modelo é um projeto Remotion e as regras dela valem aqui. Se não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. Três ressalvas, porque aqui o projeto já vem pronto: não precisa carregar `remotion-create` nem abrir o Studio (os quadros do `stills.mjs` são a prévia), e o pedido de edição já é o pedido para renderizar.
2. Confirme o caminho do vídeo. Se o usuário não disse o **nome e a área** de quem aparece (ex.: "Carla" / "Doces de festa"), pergunte uma vez: vão na ficha, abaixo do nome da receita, e na assinatura do fechamento. Sem resposta, siga sem assinatura.
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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala — costuma esconder repetições. Trecho marcado `[sem transcrição: ouça antes de tirar]` — se for fala, deixe.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre frases viram cortes e é nos cortes que o layout troca** (a ficha sobe, a janela muda de canto): o movimento esconde o pulo do corte. Por isso vale manter a proposta do `preparar`, com cada trecho de fala separado. Pausas curtas dentro de uma frase (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.49 --rosto-y 0.30 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` do projeto fixa gravação vertical em 9:16 (a pessoa ocupa o quadro inteiro na abertura e no fechamento, e a janela dos cantos precisa de imagem para enquadrar o rosto); gravação horizontal vira 3:4 e o template também lida com ela. A altura da ficha no peito sai do `zona.topo` (logo abaixo do queixo). Leia os avisos que o script imprime. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

Se o `preparar` avisou "tempos do Whisper quebrados" em algum trecho, as palavras dele foram redistribuídas pela fala e podem estar alguns décimos adiantadas ou atrasadas: confira nos quadros do passo 8 se cada ingrediente e cada item entra na palavra certa e, se não, acerte o `em` dele no plano.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias. Nesta hora o plano ainda não tem momentos, então a pessoa aparece em quadro cheio: a cruz azul tem que cair no rosto, e a linha vertical fina mostra o centro do quadro (o rosto deve estar nela); a linha laranja é onde a ficha vai parar no peito (tem que ficar abaixo do queixo, sem cortar a boca); a caixa amarela é a legenda; tudo que é texto fica acima da linha vermelha (interface do aplicativo). Se a cruz não cair no rosto ou a linha laranja cortar o queixo, refaça o passo 4 com as medidas corrigidas.

Depois de planejar (passo 7), `node scripts/stills.mjs --guias 5 10` mostra as guias da ficha em cima: a caixa roxa é a janela da pessoa (o rosto tem que estar inteiro, com um respiro em cima), a verde o cabeçalho ao lado dela e a azul o corpo da ficha. Se o rosto ficar pequeno ou grande demais na janela, ajuste `pessoa.zoom` no plano (ver `references/plano.md`).

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: cada batida ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. Os ingredientes ou o passo (a assinatura) entram pelo menos uma vez, mesmo que o assunto não seja culinário.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `cozinha` (só se usar panela), `momentos`, `semLegenda` e `correcoes`.

Faça os momentos **encostados um no outro** (o `ate` de um = o `de` do próximo), com as fronteiras nas pausas entre frases, de preferência num valor de `cortesEm`. Tudo na tela vem da fala: não invente quantidade, nome, número nem fato. Ícones e ações da panela podem ilustrar o que foi dito; **texto na tela só com palavras ditas** (pode enxugar, não pode mudar o sentido). Nomes que a transcrição errou vão em `correcoes`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (não use `--forcar`); se reprovar, leia o trecho que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só aparecem nos trechos sem momento).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`: cada ingrediente, a queda dele na panela, o número do passo, cada item do passo) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade: o texto cabe, está inteiro e dá para ler? Cada palavra entra quando é dita? O ingrediente certo caiu na panela? A anotação aponta para a coisa certa (a chama, a colher, o pote)? A janela cobre algum texto? Tem erro de digitação ou acento? Confira também o **meio de duas ou três trocas** (o `de` do momento + 0,1 s, por exemplo `node scripts/stills.mjs 3.1 8.1 12.2`): o que sai cruza com o que entra, sem quadro vazio. Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-receita.mp4"
```

Renderiza e normaliza o áudio. Entregue o caminho do arquivo, a duração final, quanto foi cortado, o **mapa resumido** (que bloco entrou em cada trecho), o que é ilustrativo (gráfico sem números) e o que o usuário deve conferir (uma tomada em dúvida, um número que a transcrição pode ter errado).

## O estilo em uma frase

Uma ficha de receita de papel creme sobre uma mesa cacau: o texto já está escrito "a lápis" e ganha tinta quando é dito, números de gota em DM Serif Display, letras grandes de ler no celular, ícones a traço, uma panela vista de cima que é a protagonista e realmente cozinha o que a pessoa fala, e um único acento pistache — o grifo, o visto, a espátula, a fita. Detalhes e o que pode ou não ser mudado estão em `references/estilo.md` — leia antes de alterar qualquer componente ou cor.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | ficha no peito, título escrito a lápis que ganha tinta na fala; sobe para o cabeçalho se vierem `ingredientes` |
| lista | `topicos` | ficha em cima: cada item é uma linha pautada que nasce a lápis e ganha tinta e um visto pistache |
| passos | `passos` | círculos numerados ligados por um fio; "Passo N de T" rola a cada item |
| número | `numero` | número enorme que conta, com o copo medidor enchendo até a marca |
| comparação | `comparacao` | dois cartões empilhados com × ou seta; o vencedor ganha o visto, o errado é riscado |
| gráfico | `grafico` | barras = potes que enchem; linha = traço a lápis; pizza = torta vista de cima; sem `dados`, a forma da tendência com "ilustrativo" |
| destaque | `destaque` | frase curta e forte na ficha do peito; `alerta` acende a chama caramelo |
| definição | `definicao` | o termo grande e uma seta a lápis até o significado |
| frase | `frase` | citação entre aspas na ficha do peito; o `risco` é riscado quando dito |
| pergunta | `pergunta` | "?" num círculo; as opções entram como etiquetas |
| fechamento | `cta` | a ficha desce, fita (salvar), "+" (seguir), balão (comentar) ou clipe (link) |
| **assinatura** | `ingredientes` | linhas de ingrediente com ícone a traço que caem na panela vista de cima |
| **assinatura** | `passo` | número gigante, título escrito na fala e a panela reagindo (fogo, mexer, fundo, desligar, pote, vapor) |
| próprio | `dica` | uma frase na ficha do peito com rótulo |

## A assinatura em qualquer assunto

A assinatura é **"o que entra num resultado, e o que acontece com ele"**: ingredientes que caem na panela e passos que a panela cozinha. Serve de metáfora para qualquer "receita de…". `quantidade` e `unidade` são opcionais; sem elas a linha mostra só o ícone neutro (`tigela`) e o nome. As ações da panela só entram quando a pessoa descreve calor, mistura ou espera.

1. **Finanças e cripto:** "Tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco." → `ingredientes` com rótulo "Perde porque" e itens "Impulso", "Sem critério", "Risco", cada um caindo na panela, sem quantidade.
2. **Saúde e rotina:** "Para dormir melhor: 2 xícaras de chá, 30 minutos sem tela, e deixa o quarto escuro." → `ingredientes` (`quantidade` 2, `unidade` xícaras, `icone` xicara; itens sem número com `tigela`), depois `passo` com anotações de texto, sem ação de panela.
3. **Carreira (bem distante):** "Currículo bom tem aumentei as vendas em 20%, é lido em segundos e facilita a vida do recrutador." → `ingredientes` com `quantidade` "20", `unidade` "%", nome "mais vendas" e dois itens só de nome. Para "o jeito de fazer", use `passo` com `titulo` e anotações curtas.

## Fidelidade

- Tudo na tela vem da fala.
- Não invente número, nome, preço, quantidade nem fato.
- Número ilustrativo só onde o bloco permite (`grafico` sem `dados`), e com a etiqueta visível.

## Limites deste modelo

- A saída é sempre vertical 1080×1920.
- A cozinha desenhada cobre o que vai ao fogo numa panela (ou numa tigela) e termina num pote. Receita de forno, de liquidificador ou montada no prato, e qualquer assunto sem calor, funcionam com os ingredientes e os passos: os itens do passo viram anotações só de texto. Não force uma ação que a pessoa não descreveu.
- Os ícones vêm de uma biblioteca fixa (lista em `references/plano.md`). Ingrediente sem ícone que combine fica com o ícone de tigela, que é neutro; não ponha um ícone errado.
- Sem trilha musical e sem b-roll: o modelo não inventa imagens.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta como vazio e escolha um bloco da tabela para ele. Não use `--forcar`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **O console avisou "tempos do Whisper quebrados"**: confira nos quadros os itens daquele trecho; se algum entrar fora da palavra, acerte o `em` no plano (nesse trecho, os tempos de `work/palavras.json` são uma boa base, não uma verdade).
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto saindo da coluna, por baixo da janela ou pequeno demais**: passou do limite do componente (os textos são grandes de propósito, para o celular); encurte (fiel à fala) conforme `references/plano.md`. Mais de 4 ingredientes num momento deixam as linhas menores: divida em dois momentos de ingredientes.
- **Pulo visível na troca de layout**: a fronteira do momento ficou longe de um corte. Mova o `de` do momento para o valor de `cortesEm` mais próximo.
- **Rosto pequeno ou cortado na janela**: `"pessoa": { "zoom": 1.15 }` se o rosto ficou pequeno (gravação aberta), `0.85` se ficou grande demais (gravação fechada); `"ancoraY"` (padrão 0,42) sobe ou desce o rosto dentro da janela.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
