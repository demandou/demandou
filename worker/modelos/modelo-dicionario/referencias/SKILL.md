---
name: modelo-dicionario
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Dicionário: o vídeo vira um dicionário bem impresso (papel-bíblia, tinta e uma cor de capa, ameixa), em que cada ideia é uma página que vira, com palavra-título em sílabas, acepções numeradas, a fala em itálico na coluna, cartão de nota que risca o engano e gira para o sentido certo com carimbo, e a pessoa num quadro emoldurado que troca de lado a cada página ou grande em cima, com a folha subindo por baixo. Serve para qualquer assunto (o exemplo é um professor de espanhol, mas funciona com finanças, cripto, saúde, imóveis, carreira, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Dicionário\", \"estilo dicionário\", \"estilo verbete\" ou \"com página de dicionário\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Dicionário

O vídeo vira um dicionário que alguém folheia enquanto fala. Abre num frontispício: a pessoa grande em cima e uma folha de papel-bíblia subindo por baixo, com o título que se monta palavra por palavra. Cada ideia vira uma **página**: a pessoa passa para um quadro emoldurado no alto (como a ilustração do verbete), a fala corre em itálico na coluna ao lado, e o conteúdo se escreve embaixo, no ritmo da fala — palavra-título em sílabas, acepções numeradas, um número que conta, dois cartões de nota, uma gravura. Entre uma página e outra, a página **vira**. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor e de lexicógrafo (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um professor de espanhol (falsos amigos), mas o vídeo do usuário pode ser sobre qualquer coisa: cripto, saúde, imóveis, vendas, uma história. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** gestos de quem consulta um livro. A página vira na lombada (giro 3D de 0,62 s, com a sombra da folha); a folha do frontispício sobe por baixo e, no fim, vira como página. As palavras "imprimem" no instante em que são ditas (sobem 12 px e ganham tinta, sem quique); a palavra-título entra sílaba por sílaba; o risco se desenha; o cartão de nota gira (flip); o carimbo desce e bate seco; um número conta; o marca-texto ameixa passa por baixo do item da vez. Antes de ser dita, cada coisa já está "a lápis" (traço cinza do tamanho dela): nunca há caixa vazia.
- **Organização e hierarquia:** a lógica de um verbete. Em cima, o cabeçalho com as palavras-guia e o número da página; no alto, a pessoa e, ao lado dela, a cabeça do verbete (o título do bloco, em ameixa) e a abonação (a fala do momento em itálico); embaixo, o corpo, grande: a palavra-título, as acepções "1. 2. 3.", os passos encadeados, o cartão. Uma ideia grande por vez; classe, pronúncia, rótulos e a fala ficam menores.
- **Tipografia:** Source Serif 4 em tudo que é texto (negrito nas palavras-título e acepções, itálico nos exemplos e na fala, 400 nas definições) e Source Sans 3 só em caixa-alta espaçada e números (letreiros, chips, carimbo, números dos sentidos). Palavras-título de 92 a 132 px, corpo do bloco de 44 a 88 px, nada abaixo de 30 px. O texto é medido com as larguras reais da fonte e diminui para caber; nunca vaza.
- **Moldura da pessoa:** dois lugares. **Página:** um quadro de 560×700 px no alto, com fio de tinta, que troca de lado (direita, esquerda) a cada página — a assinatura (`verbete`, `remissao`) também pode ocupar uma coluna larga quando tem verbetes vizinhos. **Frontispício:** a pessoa grande em cima, com o rosto livre, e a folha cobrindo do peito para baixo (abertura, perguntas, destaques, frases, fechamento). A troca é a própria caixa da pessoa crescendo ou encolhendo; o rosto é seguido quadro a quadro, e numa gravação perto da câmera o quadro aproxima menos, para a cabeça caber.
- **Cores, textura e som:** papel-bíblia `#F3EFE6` com textura leve e a sombra da lombada, tinta `#1B1A1F`, cinza `#625D66` (classe, glosa, fala), lápis `#B4AEB6` (o que ainda vai ser dito) e **ameixa `#5C2750`, o único acento** (palavras-título, risco, carimbo, marca-texto, abas, fita). Sons raros e tonais: a folha que sobe, cada virada de página, o carimbo, a palavra certa, a fita do fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; as fontes vêm do Google Fonts). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla" / "Nutrição"): vão no letreiro das folhas do frontispício e na assinatura da epígrafe. Sem resposta, siga sem nome. Se o vídeo ensina palavras de outro idioma, pergunte também qual é o idioma (vai nos chips do cartão).

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

Vídeo em português com palavras de outro idioma no meio: deixe `--idioma pt`. O Whisper escreve as palavras estrangeiras "aportuguesadas" ("Exquisito" sai "Esquisito"); os tempos continuam certos, o texto da tela vem do plano e a legenda se corrige com `correcoes`.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Trecho marcado `[sem transcrição: ouça antes de tirar]`: ouça antes; se for fala, deixe.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre as frases viram cortes, e é nelas que a página vira** (o movimento esconde o pulo do corte). Mantenha a proposta do `preparar`.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa é reenquadrada em cada página e o frontispício cobre a parte de baixo); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam (o campo `caixas`, se você usou, precisa ser recolocado à mão).

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): o quadro da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. O aviso "o queixo ficou muito perto da zona" é normal numa gravação bem perto da câmera: a folha do frontispício começa logo abaixo do queixo e o conteúdo dela fica um pouco mais compacto. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias. No frontispício (pessoa grande em cima): a cruz azul cai no rosto e a linha azul marca o topo da folha — ela tem que ficar abaixo do queixo. Numa página: a caixa verde é a pessoa (a cabeça inteira dentro dela), a laranja é o conteúdo, a amarela é a legenda, e nada importante abaixo da linha vermelha (interface do aplicativo). Se a cruz não cair no rosto, refaça o passo 4 com medidas corrigidas. Se a cabeça ficar cortada no quadro da página, ajuste `caixas` no plano (veja `references/plano.md`).

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos, definição…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`verbete` ou `remissao`) entra pelo menos uma vez**, mesmo que o assunto não seja palavras: veja "A assinatura em qualquer assunto".

Alterne os dois lugares da pessoa: uma ou duas páginas, depois um frontispício (pergunta, destaque, frase), e vice-versa. Abra com um frontispício (`abertura`, ou o primeiro bloco com `"layout": "frontispicio"`) e feche com o `cta`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, regras de tempo e um exemplo de plano) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada item, lado, dado ou palavra entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Palavras que a transcrição errou vão em `correcoes` (ex.: `{ "calção": "caução" }`): elas corrigem a legenda e a fala em itálico da coluna. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- o texto cabe (nada cortado, nada saindo da página, nada embaixo do quadro da pessoa)?
- a palavra-título está grande e com as sílabas certas? A coluna ao lado tem a cabeça e a fala?
- o cartão já virou quando o sentido certo é dito? O carimbo não cobre texto?
- no frontispício, a folha começa abaixo do queixo e o texto está legível?
- nada parado mais de ~2,5 s, nenhum quadro vazio e nenhum texto sobre outro no meio das viradas? Gere quadros a cada 0,1 s em volta de cada troca (`node scripts/stills.mjs 8.6 8.7 8.8 8.9 9.0`).

Corrija o plano (texto mais curto, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-dicionario.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curva de tendência sem números);
- o que está na tela e não veio palavra por palavra da fala (classe gramatical, pronúncia, vizinhos, um título resumido), para o usuário conferir;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | frontispício: letreiro com o nome, título em negrito palavra por palavra (o `destaque` em itálico ameixa), subtítulo e, se quiser, o número grande em ameixa ("3 coisas") |
| lista | `topicos` | página: acepções de verbete — "1." "2." "3." em ameixa e o item em negrito, cada um na sua palavra; o marca-texto ameixa passa por baixo do item da vez; o título vira a cabeça do verbete na coluna ao lado |
| passos | `passos` | página: remissões encadeadas — chips numerados (ameixa cheio no passo da vez) ligados por um fio que desce até o passo dito; os passos já ditos ficam em cinza |
| número | `numero` | página (ou frontispício): o número como palavra-título, contando em ameixa (prefixo e sufixo em itálico cinza), "[oitenta e três mil dólares]" por extenso quando é grande, e o rótulo como acepção "1." |
| comparação | `comparacao` | página: dois cartões de nota lado a lado, com "×" (contra) ou "→" (antes-depois, errado-certo) entre eles; o vencedor ganha moldura ameixa e marca-texto, o outro fica cinza (e riscado em errado-certo) |
| gráfico | `grafico` | página: gravura a nanquim — barras hachuradas que crescem, linha que se desenha ponto a ponto, pizza fatiada com legenda; o dado da vez em ameixa; sem números, uma curva ilustrativa com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | frontispício: `alerta` = um carimbo ameixa grande que bate na folha; `chave` = a palavra enorme em negrito e o marca-texto passando por baixo; `detalhe` em itálico embaixo |
| definição | `definicao` | página: o verbete simples — palavra-título em ameixa (sílabas, classe e pronúncia opcionais), um fio e "1." com o significado; antes de ser dita, lacunas a lápis |
| frase | `frase` | frontispício: epígrafe em itálico com aspas ameixa, palavra por palavra, `destaque` em ameixa, `risco` riscado na hora e a assinatura "— nome"; com `traducao`, vira o exemplo de uso bilíngue numa página |
| pergunta | `pergunta` | frontispício: um "?" grande em ameixa ao lado da pergunta, e as opções "a)" "b)" entrando cada uma na sua palavra |
| fechamento | `cta` | frontispício: a chamada grande (com `destaque` em itálico ameixa); `salvar` = a fita marcadora cai da borda; `seguir`, `comentar`, `link` = ícone em traço ameixa |
| **assinatura** | `verbete` | página: palavra-título em sílabas e o cartão de nota que nasce a lápis, mostra o que a palavra PARECE, risca, gira e mostra o que ela é de verdade, com o carimbo |
| **assinatura** | `remissao` | página: "→ o que se procura", lacunas a lápis, a palavra certa em sílabas e a definição palavra por palavra (com desenho opcional) |

Toda página tem o cabeçalho com palavras-guia tiradas do próprio conteúdo, o número da página, a fala do momento em itálico na coluna estreita (ou verbetes vizinhos, quando o plano traz) e uma aba no índice de dedo da borda direita.

## A assinatura em qualquer assunto

O `verbete` mostra **"o que parece × o que é"**: um termo, a leitura comum (riscada) e o sentido real, com o carimbo (padrão "Engano comum"). Serve para mito × verdade, expectativa × realidade, jargão mal entendido. A `remissao` mostra **"o nome certo para uma ideia"**: a ideia descrita e o termo que a resolve. Os rótulos do cartão (`parece.rotulo`, `significa.rotulo`) e o texto do carimbo são livres; os chips de idioma só aparecem quando você põe `idioma`.

Três exemplos fora do nicho do exemplo:

1. **Finanças/cripto.** "Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde."
   `verbete`: `palavra` "mercado subindo" (em "mercado"); `parece` "dinheiro no bolso" (em "dinheiro"), `riscaEm` em "literalmente"; `significa` com `rotulo` "Mesmo na alta" e `texto` "tem gente que perde" (em "tem"), `viraEm` logo antes de "Mesmo"; `carimbo` em "perde" (texto padrão, "Engano comum").
2. **Saúde.** "Muita gente acha que carboidrato engorda. Na verdade, ele é a principal fonte de energia do corpo; o problema é a quantidade."
   `verbete`: `palavra` "carboidrato" (`silabas` "car·boi·dra·to", `classe` "s.m."); `parece` "engorda" riscado em "Na verdade"; `significa` "principal fonte de energia" com `extra` "depende da quantidade"; `carimbo` com `texto` "Mito".
3. **Relacionamento (bem distante).** "Ciúme não é prova de amor. É insegurança."
   `verbete`: `palavra` "ciúme"; `parece` "prova de amor" (riscado no "não é"); `significa` "insegurança" (em "insegurança"); carimbo padrão.

E a `remissao` num vídeo de imóveis: "e o tipo de garantia: fiador, caução ou seguro-fiança" → `rotulo` "O tipo de garantia", `palavra` "garantia" (`silabas` "ga·ran·ti·a", `classe` "s.f."), `definicao` "fiador, caução ou seguro-fiança", cada garantia entrando na sua palavra.

Outros usos: um termo de mercado que todo mundo usa errado ("ROI", "inflação"); um hábito que parece produtivo e não é; uma palavra técnica do trabalho do usuário. Se a fala só explica um termo, sem engano nenhum, use `definicao` e guarde a assinatura para a `remissao` ou para outro trecho.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Classe gramatical, pronúncia e verbetes vizinhos só entram se você tiver certeza (é um dicionário: o que não for certo fica de fora).
- Número ilustrativo só onde o bloco permite (a curva de tendência), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: ela é o estilo. Procure um "parece × é" (um engano, um mito, uma expectativa) para o `verbete`, ou um "como se chama isso?" para a `remissao`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano` (confira os tempos, que mudam com o corte novo).
- **A transcrição errou uma palavra**: use `correcoes` no plano e escreva a grafia certa nos textos.
- **Texto pequeno demais ou em muitas linhas**: o texto passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Cabeça cortada no quadro da página**: ajuste `caixas.<layout>.zoom` (menor mostra mais) ou `ancoraY` (mais alto = rosto mais para baixo).
- **A coluna ao lado do quadro está cheia de traços a lápis**: é a fala do momento que ainda não foi dita; ela ganha tinta palavra por palavra. Se o momento é longo e a fala curta, encurte o momento.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
