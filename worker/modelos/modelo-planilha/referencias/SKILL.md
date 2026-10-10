---
name: modelo-planilha
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Planilha: a tela vira uma planilha fictícia, clara e precisa (grafite e um acento framboesa), a pessoa é uma célula mesclada que muda de lugar na grade, e a fala é digitada célula a célula com o cursor pulando no ritmo; listas viram tabelas com ✓/✗ e total, passos viram a série 1, 2, 3, números são digitados e formatados, comparações ganham formatação condicional, gráficos se desenham dos dados. Serve para qualquer assunto (o exemplo do modelo é imposto de renda, mas funciona com cripto, viagem, saúde, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Planilha\", \"estilo planilha\", \"estilo Excel\", \"com tabela\" ou \"em forma de planilha\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Planilha

O vídeo inteiro acontece dentro de uma planilha: a pessoa é uma célula mesclada, "recortada e colada" de um lugar para outro da grade, e tudo o que ela diz é digitado nas células na hora em que é dito — itens viram linhas, marcas entram, o total soma, a barra de fórmula acompanha.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com imposto de renda, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo é digitado letra a letra na palavra dita, com o cursor de texto framboesa; o cursor de célula pula para a célula da vez e acende a coluna e a linha; cada bloco é uma operação de planilha que se completa na fala (✓/✗ que assenta, número que conta e é formatado, formatação condicional que pinta a célula, nota que abre, tachado que risca, lista suspensa que abre, barras que crescem, total que recalcula e fecha com traço duplo, aba nova, "Salvo"). Sem quique, sem brilho, sem fade de texto.
- **Organização e hierarquia:** uma ideia grande por vez numa célula mesclada; listas e avaliações viram tabela (item, marca, detalhe, total), sequências viram a série 1, 2, 3 na coluna A; na faixa, a célula ao lado da pessoa amplia o item da vez; a barra de fórmula repete o que está sendo digitado.
- **Tipografia:** IBM Plex Sans 500–700 com números tabulares, Red Hat Mono para fórmulas e endereços; títulos e destaques 56–96 px, textos 44–76 px, rótulos em caixa alta ≥ 28 px. Todo texto é medido e reduzido até caber, em 2 ou 3 linhas.
- **Moldura da pessoa:** uma célula mesclada encaixada na grade, com fio cinza e etiqueta de nome no pé; seis lugares (grande embaixo, alta em cima, faixa à esquerda/direita/estreita, cheia); muda de lugar em toda fronteira (0,55 s) com o contorno tracejado de "recortar"; segue o rosto; o template confere a cabeça inteira e abre o quadro quando precisa. Nunca coluna estreita de cima a baixo.
- **Cores, textura e som:** grade branca sobre cinza-claro, texto grafite, **framboesa `#D11F6A`** = o acento (cursor, ✓, total, destaque, alerta), framboesa-claro só como fundo; esboço "a lápis" em cinza até a palavra. Sons tonais e raros (toque que sobe a cada item, duas notas no ✓, acorde no resultado, arpejo no preencher).

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (vão na etiqueta da célula da pessoa, ex.: "Carla Dias · Nutricionista"). O **nome do arquivo** da planilha e os **títulos das colunas** você tira do assunto da fala. Sem resposta, siga sem nome.
4. **Números e fatos.** Tudo que aparece em célula vira "dado" aos olhos de quem assiste. Só ponha na tela número, regra ou valor que a pessoa disse. Se um valor pode estar desatualizado (imposto, taxa, preço), avise o usuário antes de renderizar. Fala sem números não é problema: use ✓/✗, listas, passos e gráficos de tendência ("ilustrativo"). Nenhum texto de tela cita ferramenta de edição nem nome de programa de planilha.

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

Números e siglas costumam vir estranhos ("12 %", "P G B L", "para a" no lugar de "pra"). Anote: vão virar `correcoes` (passo 7).

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas** — a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala — ouça com atenção, costuma esconder repetições.

Itens marcados `[sem transcrição: ouça antes de tirar]` podem ser fala que o Whisper perdeu ("Um:", "Saúde."). Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última. Diga na entrega qual ficou e por quê.

Neste modelo **as trocas de momento escondem os cortes** (a célula da pessoa muda de lugar em cima do pulo). Pausas curtas dentro de uma frase (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.50 --rosto-y 0.30 --queixo-y 0.43
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo** (`modelo.json`: vertical em 9:16, porque a pessoa é reposicionada em células); gravação horizontal vira 3:4. Refazendo o corte depois de já ter planejado, use `--manter-plano`.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a célula da pessoa acompanha quando ela se mexe, e o template usa o tamanho do rosto para mostrar a cabeça inteira em cada lugar (gravação muito perto da câmera também funciona: o lugar "alto" ganha mais altura). Se o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul deve cair no rosto **dentro da célula da pessoa** (caixa roxa tracejada); a linha laranja é o limite das abas do app (acima dela, só decoração) e a vermelha o da interface embaixo. Se a cruz não estiver no rosto, refaça o passo 4 com medidas melhores.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (uma ideia, 2 a 5 s) ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`tabela`, `linha` ou `preencher`) entra **pelo menos uma vez** — veja "A assinatura em qualquer assunto".

Pense também no lugar da pessoa: os blocos de uma célula a põem embaixo (o conteúdo em cima) ou em cima (o conteúdo embaixo); os blocos da faixa a põem no alto, à esquerda ou à direita, com a tabela ou o gráfico embaixo. Alterne famílias para a tela mudar de verdade.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, lugares e regras de tempo) e preencha `src/plano.json`: `marca`, `planilha`, `tabela`, `momentos`, `semLegenda` e `correcoes`. Escreva os textos com as palavras ditas, na ordem em que são ditas: o template acha cada palavra na fala e a digita na hora.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda (só nos trechos sem momento; a legenda é a barra de fórmula).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem **reduzida a ~540 px de largura** e confira: cada célula é digitada logo depois da sua palavra? O texto cabe (nada cortado)? O cursor está na célula certa? A célula da pessoa mostra a cabeça inteira? O total bate com as marcas? Tem acento errado? Confira também **o meio de duas ou três trocas** (`de` + 0,1 a 0,4 s, por exemplo `node scripts/stills.mjs 14.95 15.1 15.3`): nada de quadro vazio nem de duas páginas de texto uma sobre a outra. Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-planilha.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é **ilustrativo** (gráficos de tendência) e de onde vieram os números;
- o que o usuário deve conferir (uma regra ou valor que você não pôde confirmar, uma palavra que a transcrição pode ter errado, uma tomada escolhida no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Pessoa grande embaixo; o título é digitado na célula mesclada de cima, palavra por palavra, com o trecho de `destaque` em framboesa e um selo opcional que se confirma (✓). |
| lista | `topicos` | Pessoa na faixa; embaixo, uma tabela com o título no cabeçalho e uma linha por item, digitada na palavra dele (detalhe na coluna C); ao lado da pessoa, o item da vez ampliado com "2/4" e a barrinha de células. |
| passos | `passos` | Pessoa na faixa; a coluna A recebe 1, 2, 3 pela alça de preencher (a seleção desce) e um traço liga os números; o passo é digitado em B–C; ao lado, o número grande do passo e a barra de progresso. |
| número | `numero` | Pessoa grande; na célula de cima, o rótulo em caixa alta e o número grande contando (pt-BR), com o traço de formato embaixo; a barra de fórmula mostra o valor cru; R$ ou % acende. |
| comparação | `comparacao` | Duas linhas na célula (rótulo + texto); a regra condicional pinta a vencedora de framboesa-claro com ✓ e apaga a outra com ✗; × ou ↓ entre elas. |
| gráfico | `grafico` | Pessoa estreita; os dados são digitados nas células ao lado (rótulo | valor) e o gráfico da planilha se desenha embaixo: barras, linha ou rosca. Sem números: a forma da tendência se desenha, com a etiqueta "ilustrativo". |
| destaque | `destaque` | Pessoa grande; a frase é digitada em cima e a formatação condicional pinta a célula: framboesa com alerta, ou framboesa-claro com chave. |
| definição | `definicao` | O termo digitado grande; o triângulo de "célula com nota" aparece e a nota abre presa a ele, com o significado. |
| frase | `frase` | A frase digitada com uma barra framboesa que cresce ao lado; o `destaque` em framboesa; o `risco` tachado quando é dito. |
| pergunta | `pergunta` | Selo "?" e a pergunta digitada; as opções abrem numa lista suspensa (ou etiquetas com ▾), cada uma na sua palavra; sem opções, um campo de resposta pisca. |
| fechamento | `cta` | Pessoa em cima; a célula larga embaixo recebe a chamada digitada e o ícone (salvar, seguir, comentar, link) se preenche; com salvar, o arquivo fica "Salvo". |
| **assinatura** | `tabela` | A tabela inteira num momento: item, ✓/✗ (ou valor) e detalhe digitados na fala, total que conta ou soma e fecha com o traço duplo e a fórmula na barra; ao lado, a linha da vez ampliada. |
| **assinatura** | `linha` | Um item por momento (a pessoa troca de lado a cada um): a linha é preenchida célula a célula, os exemplos abrem numa sub-linha, uma fórmula opcional dá resultado, e a célula ao lado ilustra (∞, regras, pizza, número, ícone ou o item ampliado). |
| **assinatura** | `preencher` | A coluna A é selecionada e arrastada: cada linha da tabela ganha um ícone (o que vale para todas), e a frase entra ao lado. |
| frase ou conta larga | `celula` | Uma célula larga com rótulo, frase e um número que conta (com a fórmula na barra). |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa marcas ✓/✗, listas, passos e gráficos de tendência.

## A assinatura em qualquer assunto

A assinatura da Planilha é **"avaliar coisas uma a uma numa tabela que se preenche enquanto a pessoa fala"**: cada item ganha uma linha, uma marca (✓, ✗ ou um valor) e um detalhe, e o total fecha a conta. Serve para tudo o que é lista com um "sim ou não", um "quanto" ou um "onde/quando" — e o `preencher` marca o que vale para todos.

1. **Finanças / cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   - `tabela` com `titulo` "Tem gente que perde", colunas Atitude · Critério? · Como: Compra ✗ por impulso / Escolhe moeda ✗ sem critério / Assume risco ✗ que não entende; `conta: "nao"`, total 3 com o traço duplo e `=CONT.SE(B7:B9;"✗")` na barra.
2. **Saúde / rotina.** "Pra dormir melhor: desliga a tela uma hora antes, deixa o quarto escuro e acorda no mesmo horário. Faz isso todo dia, inclusive no fim de semana."
   - `tabela` "Dormir melhor", colunas Hábito · Faz? · Quando: Desliga a tela ✓ uma hora antes / Quarto escuro ✓ / Mesmo horário ✓ para acordar; depois `preencher` com o ícone `calendario` em todas as linhas ("Faz isso todo dia").
3. **Bem distante (viagem, relacionamento, história).**
   - Viagem: "Um dia em Lisboa: de manhã, Torre de Belém e o Pastel de Belém; à tarde, o elétrico 28 até a Alfama; no fim do dia, pôr do sol no miradouro da Senhora do Monte. Dá pra fazer tudo de transporte público." → três `linha` (Manhã, Tarde, Fim do dia) com os lugares como exemplos, ✓ na coluna "Roteiro" e o detalhe "onde"; a célula ao lado com regras (bonde, pino) e o sol que se desenha; `preencher` com o bonde em todas as linhas.
   - Relacionamento: "Três sinais de que a conversa precisa acontecer: você evita o assunto, ensaia a briga na cabeça e já desistiu de ser ouvido." → `tabela` Sinal · Acontece? · Como, com ✓ em cada um e total 3.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Compra · por impulso"), sem mudar o sentido. Marcas ✓/✗ resumem o que foi dito, nunca acrescentam.
- Não invente número, nome, preço, taxa nem fato. Número só no `numero`, no `grafico` com `dados`, na `pizza`, nas marcas numéricas e na `celula` — sempre o dito.
- Forma sem números só no `grafico` com `tendencia` e `ilustrativo: true` (a etiqueta aparece sozinha).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Momento longo parado: divida em dois ou acrescente itens com `em`. Assinatura ausente: transforme a lista principal da fala numa `tabela` (ou as partes com tempo em `linha`).
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma célula é digitada antes ou depois da palavra**: o `em` dela está errado. Confira em `work/palavras.json`.
- **Um texto sai todo de uma vez ou fora do ritmo**: as palavras escritas não casam com as faladas. Escreva como foi dito; algarismos ("12%") casam com a fala ("doze por cento").
- **A transcrição errou um nome, sigla ou número**: use `correcoes` no plano.
- **Texto pequeno demais**: o bloco reduziu o corpo para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala.
- **A cabeça aparece cortada numa célula**: `enquadramento` no plano (`references/plano.md`, seção 1).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução; o vídeo sai menos nítido. Avise o usuário.
