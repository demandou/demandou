---
name: modelo-mosaico
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Mosaico: a tela vira uma página de revista em ladrilhos arredondados (creme, verde-folha, tomate, gema e tinta sobre fundo aveia) que se remonta a cada ideia; a pessoa é um dos ladrilhos e muda de lugar e de tamanho, enquanto os outros montam a informação na fala (frações, um disco dividido em partes, casas com ícones, listas, números que contam, comparações em dois ladrilhos). Serve para qualquer assunto (o exemplo do modelo é nutrição, mas funciona com finanças, cripto, saúde, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Mosaico\", \"estilo mosaico\", \"estilo bento\", \"em blocos\", \"estilo revista\" ou \"com grade\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Mosaico

O vídeo vira uma página de revista que se remonta a cada frase: ladrilhos chapados com rejunte, a pessoa num deles, e a informação organizada em pedaços — cada ideia ganha o seu ladrilho, que se monta no ritmo da fala. Uma peça atravessa as páginas (no exemplo, o prato que se preenche parte a parte) e amarra o vídeo.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com nutrição (o método do prato), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a cada momento, a página inteira se remonta em 0,72 s: os ladrilhos deslizam, se esticam (a borda da frente sai antes, a de trás vem depois, então a página nunca abre buraco) e trocam de cor com uma varredura; o que entra cresce da borda, o que sai encolhe para ela. Dentro de cada ladrilho, tudo entra na palavra dita: títulos se revelam palavra por palavra, casas e faixas nascem "a lápis" (tracejadas) e se completam no item, fatias do disco giram até a fração, números contam, o trilho dos passos avança. Sem quique, sem giro, sem brilho.
- **Organização e hierarquia:** uma ideia por página. O bloco principal ganha o ladrilho maior; a pessoa fica num ladrilho em pé ao lado de um companheiro menor (a peça que fica, o bloco anterior ou a assinatura). Listas viram um mosaico dentro do mosaico (faixas ou casas); comparações e definições viram dois ladrilhos lado a lado; o todo e as partes viram o disco. O grande é o dado ou a frase; o pequeno é rótulo e apoio.
- **Tipografia:** Bricolage Grotesque (títulos, números e frações, 700–800, letras levemente apertadas) e Instrument Sans (rótulos, apoio, legenda, rodapé, 600–700). Frações tipográficas (numerador, barra inclinada que se desenha, denominador). Todo texto é medido e reduzido para caber, em até 2 a 4 linhas; títulos ≥ 84 px nos ladrilhos grandes, apoio ≥ 44 px, rótulos ≥ 34 px.
- **Moldura da pessoa:** sempre um ladrilho arredondado da grade (nunca recortada do fundo, nunca uma coluna estreita): metade da largura e em pé quando há companheiro, ou faixa larga embaixo/em cima. Ela muda de lugar a cada página e segue o rosto. Nos respiros entre momentos, volta à tela cheia com a legenda. Gravação de selfie (rosto grande) ganha sempre um ladrilho em pé, para a cabeça caber inteira.
- **Cores, textura e som:** página aveia `#E7DFCF`; ladrilhos creme, verde-folha (principal), tomate (alerta, problema), gema (número, chave) e tinta (frase, termo); cada ladrilho com uma cor chapada, nunca duas iguais lado a lado. Sem sombra, degradê ou textura. Sons raros e tonais: um encaixe grave na remontagem, uma nota por parte servida ou dado dito, um acorde curto no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Ana Ribeiro — Nutricionista esportiva"): vão para o rodapé da página e para o ladrilho de assinatura. Sem resposta, siga sem nome.

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
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Trecho marcado `[sem transcrição: ouça antes de tirar]` pode ser fala que a transcrição perdeu: só tire se tiver certeza.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam; só as longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.50 --rosto-y 0.365 --queixo-y 0.475
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. Neste modelo a pessoa quase sempre está num ladrilho, então o `modelo.json` do projeto fixa **gravação vertical em 9:16** (guarda a gravação inteira e dá mais imagem para enquadrar cada ladrilho). Gravação horizontal vira 3:4, e o template também lida com ela. Leia os avisos que o script imprime.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: o ladrilho da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Gravação de selfie (aviso "a gravação está bem perto da câmera") é normal aqui: o modelo percebe o rosto grande e dá à pessoa ladrilhos em pé, onde a cabeça cabe inteira.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul cai no rosto (só com a pessoa em tela cheia); a caixa verde é o ladrilho da pessoa (o rosto tem que estar inteiro e perto do meio dela); as caixas laranja são os outros ladrilhos, com a letra de cada um; a linha vermelha é o limite da interface do aplicativo (nenhum texto passa dela). Se o rosto sair cortado nos ladrilhos, ajuste `pessoa.zoom` no plano (`references/plano.md`); se a cruz não cair no rosto, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, número, comparação, partes de um todo…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo.

- A assinatura (`partes` ou `grupo`) entra **pelo menos uma vez**, de forma metafórica se o assunto for outro (veja "A assinatura em qualquer assunto").
- Escolha **a peça que fica**: um bloco que resume o vídeo (o disco das partes, o número principal) e que atravessa as páginas seguintes, menor, como o prato do exemplo. É só pôr `"fica": true` (ou o segundo até quando ele fica) nesse momento.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, a grade e as regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada momento é **uma página**: o `tipo` dele é o bloco principal; a grade, as cores e o lugar da pessoa o modelo escolhe sozinho (você pode escrever a grade à mão, se quiser).

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda (só aparecem nos respiros em tela cheia) e marca linha com palavra sozinha; corrija o que der.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe os quadros reduzidos a ~540 px de largura e confira: o texto cabe e está inteiro? Algum ladrilho ficou com um terço vazio por muito tempo? A pessoa está inteira no ladrilho dela? A tela muda de verdade a cada 1,5 a 2,5 s? Tem erro de digitação ou acento? Para ver uma remontagem por dentro, peça quadros seguidos: `node scripts/stills.mjs 6.52 6.62 6.72 6.82 6.92`. Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-mosaico.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e qual foi a peça que fica);
- o que é **ilustrativo** (formas sem números ditos);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um ícone que você escolheu para ilustrar uma categoria).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Ladrilho verde grande; o título assenta embaixo e se monta palavra por palavra; o `destaque` em gema. |
| lista | `topicos` | Mosaico dentro do ladrilho: uma faixa por item, nascendo a lápis; no item dito a faixa acende, uma pastilha colorida se encaixa e o texto se revela. |
| passos | `passos` | As mesmas faixas, numeradas em círculos de ênfase, ligadas por um trilho que avança até o passo dito. |
| número | `numero` | Ladrilho gema: o número enorme conta (pt-BR), com o prefixo e o sufixo menores ao lado e o rótulo em cima ou embaixo. |
| comparação | `comparacao` | Dois ladrilhos lado a lado (ou um sobre o outro), cada um se preenche a partir do rejunte no seu lado; uma peça redonda pousa no rejunte (×, seta); errado × certo ganham ✗ e ✓. |
| gráfico | `grafico` | Gráfico de pastilhas: barras feitas de ladrilhos pequenos que se assentam de baixo para cima; linha que corre sobre uma grade de pastilhas e acende as de baixo; pizza = o disco das partes. Sem números ditos: a forma da tendência e a etiqueta "ilustrativo". |
| destaque | `destaque` | Ladrilho chapado (gema = chave, tomate = alerta) com o ícone se desenhando e a frase enorme em Bricolage 800; uma barra de base cresce embaixo. |
| definição | `definicao` | Dois ladrilhos: o termo enorme num ladrilho tinta; o significado num ladrilho creme que se encaixa quando é dito, com uma peça "=" no rejunte. |
| frase | `frase` | Ladrilho tinta, a frase palavra por palavra; o `risco` é riscado em tomate quando é dito; o `destaque` ganha gema e uma barra de base. |
| pergunta | `pergunta` | Ladrilho com uma peça redonda "?", a pergunta se montando e as opções em faixas que acendem cada uma na sua palavra. |
| fechamento | `cta` | Ladrilho gema (ou verde): o ícone (salvar, seguir, comentar, link) se desenha e se preenche na ação; o texto se monta na fala, o `destaque` em ênfase. |
| **assinatura** | `partes` | O disco visto de cima (no exemplo, o prato): a borda se desenha e fecha, linhas tracejadas mostram onde as partes vão ficar, e cada parte gira até o tamanho certo na sua palavra, com a legenda entrando ao lado. Sem frações ditas, partes iguais e "ilustrativo". É a melhor peça que fica. |
| **assinatura** | `grupo` | Fração ou número curto grande + nome do grupo; embaixo, uma casa por item, com o ícone a lápis que se completa quando o item é dito (ou o nome do item, grande, se não houver ícone). |
| referência | `selo` | Peça redonda com ícone, título e uma linha de apoio. |
| título extra | `titulo` | Um segundo título num ladrilho companheiro (ex.: "é mais simples do que parece"). |
| assinatura de quem fala | `marca` | Área em caixa alta, filete e o nome grande. |
| o exemplo | `prato` | O mesmo disco das `partes`, com o nome do exemplo, garfo e faca (`talheresEm`) e fio de azeite (`azeite`). |

Qualquer forma de informação tem um bloco aqui. Se a fala não tem números, use a versão sem números (`grafico` com `tendencia`, `partes` sem `fracao`, `grupo` sem `fracao`).

## A assinatura em qualquer assunto

A assinatura do Mosaico é **"a ideia em pedaços que formam um todo"**: o disco que se divide parte a parte (`partes`) e o grupo com uma casa por item (`grupo`). Ela serve para tudo o que tem partes, ingredientes, motivos ou componentes — e o disco, como peça que fica, carrega o todo pelas páginas.

1. **Finanças / cripto.** "Eu gravei uma aula para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos."
   - `partes` com `titulo` "Aula gratuita" e três partes sem fração (iguais, "ilustrativo"): "o mercado", "os riscos", "a escolha dos ativos", cada uma na sua palavra; com `"fica": true` ele acompanha a pergunta e o fechamento.
   - "Tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende" → `grupo` "Tem gente que perde", casas `raio` "por impulso", `alvo` "sem critério", `alerta` "risco que não entende".
2. **Saúde / rotina.** "Do meu dia, oito horas são de sono, oito de trabalho e o resto eu divido entre treino e família."
   - `partes` "O meu dia": 1/3 "sono", 1/3 "trabalho", 1/3 "treino e família" (frações tiradas das horas ditas: 8 de 24 = 1/3), o disco gira fatia por fatia.
   - "Três sinais de que você dorme mal: acorda cansado, precisa de café e cochila à tarde" → `grupo` com `fracao` "3", casas `lua` "acorda cansado", `xicara` "café", `relogio` "cochila à tarde".
3. **Algo bem distante (uma história).** "Todo dia um senhor sentava na praça com duas xícaras de café. Bebia uma; a outra esfriava."
   - `partes` "Duas xícaras de café": ½ "bebia uma" (gema), ½ "a outra esfriava" (tinta) — uma de duas é metade, e o disco vira a lembrança que atravessa a história até o fim (`"fica": true`).
   - Relacionamento: "o que mantém um casal é conversa, rotina e respeito" → `grupo` "O que mantém", casas `mensagem` "conversa", `calendario` "rotina", `coracao` "respeito".

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "por impulso"), sem mudar o sentido.
- Não invente número, nome, preço, fração nem fato. Fração só se for dita ou se sair direto da fala (uma de duas = ½; 8 de 24 horas = ⅓).
- Forma sem números só nos campos ilustrativos (`tendencia`, `partes` sem `fracao`); a etiqueta "ilustrativo" aparece sozinha.
- Ícones podem ilustrar uma categoria dita ("vegetais e legumes" → brócolis, cenoura); texto na tela, só com palavras ditas.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois momentos ou acrescente itens com `em`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Erro "a letra X não forma um retângulo" / "não tem bloco" / "não tem a pessoa"**: a grade escrita à mão está errada. Cada letra forma um retângulo, a letra `p` (a pessoa) aparece em toda grade e toda letra tem um bloco — ou tire o campo `grade` e deixe o modelo escolher.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano` (os momentos, a marca e as correções continuam).
- **O console avisou "tempos do Whisper quebrados"**: confira nos quadros os itens daquele trecho; se algum entrar fora da palavra, acerte o `em` no plano.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais num ladrilho**: o bloco reduz o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala, ou tire um companheiro da página (`"sozinho": true`).
- **Rosto pequeno ou cortado nos ladrilhos**: ajuste `"pessoa": { "zoom": 1.2 }` (rosto pequeno, gravação aberta) ou `0.8` (rosto grande demais). O modelo já reduz o zoom sozinho em gravação de selfie.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
