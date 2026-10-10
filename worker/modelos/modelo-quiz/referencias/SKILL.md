---
name: modelo-quiz
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Quiz, um programa de perguntas de TV claro e refinado: a pergunta grande no alto, as alternativas numa grade acima da cabeça (cada uma entra na letra falada, com ilustração), o anel de contagem 3-2-1 sincronizado com a fala, a revelação (a certa acende em verde, as outras apagam) e o cartão do fato. A pessoa fica embaixo numa moldura larga. Funciona com 2, 3 ou 4 alternativas e com verdadeiro ou falso. Serve para qualquer assunto (o exemplo é o maior órgão do corpo, mas funciona com finanças, saúde, idiomas, concursos, vendas, histórias): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Quiz\", \"pergunta e resposta\", \"teste se você sabe\", \"verdadeiro ou falso\", \"adivinha\", \"comenta se acertou\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Quiz

O vídeo vira um programa de perguntas: a pessoa embaixo, como a câmera do apresentador, e o **painel** em cima. A pergunta se monta palavra por palavra; cada alternativa **acende na letra falada** ("A,"), e o nome e a ilustração entram na palavra dela ("fígado"); o **anel** conta "três… dois… um…" junto com a voz; na **revelação** a certa acende em verde e as outras apagam; depois a resposta sobe para uma faixa verde e o **cartão do fato** explica o porquê. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com "qual é o maior órgão do corpo humano?", mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** entradas de placar de TV: o cartão sobe 34 px e assenta com um leve passar do ponto (0,34 s); depois flutua ±3 px, cada um no seu tempo. A pergunta monta palavra por palavra na fala. O anel aparece no primeiro número, o arco cobalto **esvazia** até a revelação e cada número dito entra com um soco curto. Na revelação: a certa vira verde (0,3 s), ganha o selo ✓ e um brilho atravessa uma vez; as outras ficam cinza e encolhem 4%; a pessoa leva um soco de 5% de zoom. Com um fato logo depois, a certa **voa** até o alto e vira a faixa da resposta; o cartão do fato só aparece depois que ela assenta. Nada de giro, tremida, flash ou brilho atrás da pessoa.
- **Organização e hierarquia:** a tela é sempre dividida: o **painel** em cima (y 132 a 966, margem lateral de 64 px) e a **moldura da pessoa** embaixo (a partir de y 1000). No quiz: pergunta grande no alto, grade de alternativas embaixo dela (2×2 com 4; 2×2 com o anel na quarta casa com 3; lado a lado com 2), selos de letra nos cantos de fora, anel no meio. Uma pergunta por vez.
- **Tipografia:** uma família só, **Sora** (Google Fonts): 800 para pergunta, alternativas sem imagem, números e títulos (40–108 px, tracking −0,02em); 700 para nomes com imagem e texto corrido (28–64 px); 600 para detalhes. Nada condensado, nada em caixa alta longa (só as etiquetas curtas).
- **Moldura da pessoa:** sempre numa moldura larga embaixo (x 30 a 1050, cantos de 46 px, os de baixo fora do quadro), com a cabeça inteira e ~56 px de folga acima do cabelo, o rosto no eixo central e seguido quadro a quadro. Troca de escala em corte seco (100% ↔ 106%) só quando o trecho anterior durou mais de 1 s; soco de 5% na revelação. A tarja do apresentador (nome em 44 px, área em 30 px) fica logo acima da moldura, à esquerda, nos primeiros ~3 s.
- **Cores, textura e som:** fundo de estúdio claro (#ECEFF7, com uma luz branca no centro e anéis finos girando devagar), cartões brancos com sombra macia, tinta azul-marinho (#13183A), **um destaque: cobalto** (#2F4BFF) para letras, anel e ênfase, **verde só para a certa** (#12B76A), cinza (#A9AFC6) para o que apaga, coral (#F2553D) só no alerta. Nada de cassino: sem roleta, luzes piscando, moedas, "jackpot", dourado ou neon. Sons tonais, raros e baixos: uma nota de marimba por alternativa (subindo), um "toc" grave por número da contagem, duas notas subindo na revelação.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Prof. Rafael Nunes" / "Ciências"): vão na tarja de apresentador no começo. Sem resposta, siga sem tarja. Pergunte também se ele tem **imagens próprias** das alternativas (produto, foto, print): elas vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas. Se a resposta certa não estiver clara na fala, **pergunte qual é** antes de planejar.

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

### 3. Escolher as tomadas (e o ritmo do quiz)

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica.

**Letras e números soltos** ("A,", "C,", "um…") quase sempre voltam como `[palavra curta sem transcrição]` ou errados ("Si" no lugar de "C", "3s" no lugar de "três"). **Mantenha esses trechos** (são as letras das alternativas e a contagem). Para ter certeza de que é fala, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`: −30 dB ou mais alto é fala).

**O ritmo do quiz** (o corte é seu, não do script):
- entre a letra e o nome ("A, fígado"): ~0,17 s de respiro;
- entre uma alternativa e a próxima: ~0,2 s;
- antes da contagem: ~0,3 s;
- **a contagem e a pausa antes da resposta ficam naturais** (é o suspense). Para isso, deixe os trechos "três", "dois", "um" e a resposta colados (o `ate` de um = o `de` do próximo): o `cortar.mjs` junta vizinhos com menos de 0,3 s entre eles e mantém a pausa original.

Para apertar uma pausa, mexa no `ate` do trecho de antes e no `de` do de depois, deixando **pelo menos 0,31 s cortados** entre eles (com menos, o cortar junta os dois e a pausa inteira volta).

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo** (`modelo.json` fixa a gravação vertical em 9:16; a pessoa fica sempre na moldura de baixo). Refazendo o corte depois de já ter planejado, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo: a moldura acompanha quando a pessoa se mexe.

### 4b. Corrigir as palavras

Abra `src/plano.json` → `palavras` (o mesmo que `work/palavras.json`) e corrija o que a transcrição errou nas letras, números e nomes das alternativas, **no lugar certo da lista**:
- troque o texto (`"Si."` → `"C,"`, `"3s"` → `"Três…"`, `"Peli."` → `"pele."`);
- acrescente a palavra que faltou com o tempo dela: uma letra solta vira um trecho próprio, então ela começa **~0,06 s depois do corte** correspondente em `cortesEm`;
- apague palavras inventadas no silêncio (ex.: um "E aí" que ninguém disse).

O Whisper costuma marcar o começo de "fígado", "cérebro" e outras palavras com consoante suave ~0,1 s atrasado; se o timing gate (passo 7) mostrar desvio, confira o quadro.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto, com a cabeça inteira logo abaixo da linha rosa (a moldura, y 1000); a linha amarela é o centro da legenda (abaixo do queixo); o retângulo verde é o painel; nada importante fora das linhas vermelhas (interface do app e margens de 64 px). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Ache:
- a **pergunta** (e a palavra em que ela começa);
- as **alternativas**: para cada uma, o instante da letra (se ela diz "A, B, C") e o instante do nome;
- a **contagem** ("três, dois, um", "valendo", um silêncio de suspense);
- a **resposta** (a palavra que revela a certa) e o **fato** que vem depois (o porquê, o dado curto);
- o fechamento (comentário, salvar, seguir).

Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`quiz`) entra pelo menos uma vez**, e a conferência pede pelo menos dois efeitos próprios (`quiz`, `fato`, `revelacao`): normalmente `quiz` + `fato`.

- **Vídeo com várias perguntas**: um `quiz` por pergunta (com `rotulo` "PERGUNTA 2" só se ela disser), cada um com seu `fato` ou direto para o próximo.
- **Sem letras faladas** ("é fígado, cérebro, pele ou intestino?"): cada alternativa entra no nome dela (`em` = nome, sem `textoEm`).
- **Sem contagem falada**: use `relogioEm` (o anel esvazia sem números, com uma ampulheta) no silêncio antes da resposta, ou revele direto.
- **Verdadeiro ou falso**: `modo: "vf"` com 2 alternativas ("Verdadeiro", "Falso").
- **Sem resposta certa** (enquete, "qual você prefere?"): `pergunta` com `opcoes` (o mesmo painel, sem anel nem revelação).
- **Sem pergunta nenhuma no vídeo**: ache a provocação escondida ("sabe quanto…?", "adivinha", "o erro mais comum é…") e use `revelacao` (cartão-mistério que vira na palavra) ou transforme um mito em verdadeiro ou falso.

### 6b. Imagens

Leia `references/imagens.md`. Imagem nas alternativas é opcional: **sem imagem, o cartão mostra o nome grande** (estilo válido, ótimo para palavras, datas e conceitos). Use imagem quando a alternativa é uma coisa (órgão, fruta, objeto, lugar, animal).

1. Liste as alternativas que são coisas e, se quiser, uma imagem para o `fato`. Escreva `work/imagens.json`: `id`, `em` (instante do nome), `palavra`, `busca` (inglês, concreto: "human liver"; bicho e planta pelo nome científico), `tipo` (prefira `objeto`: PNG transparente, fica inteiro no cartão e também no verde da revelação) e `arquivo` quando vier da pasta `imagens/`.
   - Nada de pessoa famosa nem marca na busca. As quatro alternativas ficam lado a lado: prefira imagens do mesmo tipo (todas objetos 3D, ou todas ilustrações).
   - Se o usuário tem um gerador de imagens, pode gerar as quatro ilustrações **numa imagem só em grade 2×2** (mesmo estilo, fundo branco, **sem texto e sem logo**) e recortar cada uma em PNG transparente em `imagens/`.
2. `node scripts/imagens.mjs --lado 1000`. Leia os avisos.
3. Abra `work/imagens.jpg`. Escolha a candidata que mostra a coisa inteira, reconhecível em 1 s, sem gente, logo ou texto.
4. `node scripts/imagens.mjs --escolher <id> <n>`. Nenhuma serve: `--refazer <id> --busca "outro termo"`, ou deixe a alternativa sem `imagem`.
5. `node scripts/imagens.mjs --folha`; depois `--limpar`.
6. Nas alternativas, `imagem: { "id": "figado" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada letra, nome, número da contagem, revelação e destaque entra no `em` da palavra, tirado de `palavras`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: o **timing gate**. Cada entrada precisa cair a ±0,15 s da palavra que a nomeia (letra, nome, número, resposta, dado); corrija até sair **APROVADO**. "Confira no quadro" = o texto da tela não é a palavra dita (resumo): olhe o quadro daquele instante no passo 8;
- `node scripts/legendas.mjs`: lista as linhas de legenda (que só aparecem nos momentos com `legenda: true`).

**O fim do vídeo**: o `cortar.mjs` deixa ~0,4 s de respiro depois do último trecho. O vídeo deve terminar ~0,3 s depois da última palavra: ponha em `duracao` (e no `ate` do último momento) o fim da última palavra + 0,3 s.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros **reduzidos à largura de um celular (~540 px)** e confira de verdade (peça também quadros na letra e no nome de cada alternativa, em cada número da contagem, 0,2 s depois da revelação e no meio do voo da resposta):
- a pergunta cabe e se lê em 1 s? Cada alternativa entra **na letra** e o nome e a imagem **no nome**?
- a imagem de cada alternativa é a coisa dita, inteira, sem texto nem logo?
- o anel mostra o número que está sendo dito e não cobre o nome de nenhuma alternativa?
- a certa é **a que a pessoa disse**? Ela acende na palavra da resposta e as outras apagam?
- o fato mostra só números ditos? O dado grande cabe na moldura de medida?
- o fechamento fica legível por pelo menos 1,2 s?
- legenda (quando houver) abaixo do queixo, sem juntar duas frases; nada encostado nas margens, nada importante abaixo de y 1700.
- a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-quiz.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho) e o maior desvio do timing gate;
- as **imagens usadas** e de onde vieram (e o texto do `creditos.txt` quando houver CC BY);
- o que é ilustrativo;
- o que o usuário deve conferir (uma letra que a transcrição perdeu, a resposta certa se ela não ficou clara, uma imagem que só ele pode trocar).

## Blocos deste modelo

Todos os blocos acontecem **no painel** (em cima); a pessoa fica embaixo o tempo todo.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | o título do programa: os quatro selos A B C D saltam em fila e o texto se monta grande no meio do painel, o `destaque` em cobalto |
| lista | `topicos` | linhas brancas como alternativas, cada uma com um selo ✓ cobalto, entrando no seu `em`; a da vez ganha borda cobalto |
| passos | `passos` | as mesmas linhas com selos numerados, ligadas por um fio cobalto que desce até o passo da vez |
| número | `numero` | o placar: número enorme contando num cartão branco, com uma régua cobalto que enche; o rótulo numa pílula cobalto embaixo |
| comparação | `comparacao` | duas alternativas lado a lado (rótulo numa etiqueta, texto grande); o `vencedor` acende em verde e o outro apaga, como na revelação; `errado-certo` usa os selos ✗ e ✓ |
| gráfico | `grafico` | num cartão branco: barras cobalto que sobem com o valor em cima, linha que anda de ponto em ponto, rosca (o anel do quiz); sem números ditos, a curva da tendência com a etiqueta "ilustrativo" |
| destaque | `destaque` | a frase grande num cartão com borda cobalto e selo ✓ (`chave`) ou borda e texto coral com selo "!" (`alerta`) |
| definição | `definicao` | o termo enorme com um traço cobalto que se desenha embaixo; o significado sobe num cartão branco, palavra por palavra |
| frase | `frase` | a frase num cartão branco com o selo de aspas cobalto, palavra por palavra; `destaque` em cobalto, `risco` riscado em coral |
| pergunta | `pergunta` | com `opcoes`: o painel do quiz sem anel nem revelação (enquete); sem opções: a pergunta grande sob um "?" num anel tracejado que gira |
| fechamento | `cta` | o ícone num círculo cobalto com um anel que pulsa, a chamada grande e, depois de um quiz, a fileira das alternativas com a certa em verde |
| **assinatura** | `quiz` | a pergunta no alto, a grade de alternativas (cada uma na letra e no nome), o anel 3-2-1 no meio, a revelação em verde |
| próprio | `fato` | depois de um `quiz`: a certa vira a faixa verde do alto e o cartão do fato entra embaixo, com o dado grande dentro de uma moldura de medida; sozinho: um "você sabia?" com etiqueta |
| próprio | `revelacao` | o cartão-mistério cobalto com "?" que vira na palavra e mostra a resposta (e a imagem); aceita a contagem no anel |

## A assinatura em qualquer assunto

O quiz é **"uma pergunta, algumas saídas possíveis, um suspense e uma verdade"**: qualquer fala que testa o público, desfaz um mito ou provoca "você sabe?" vira o painel. As alternativas podem ser coisas (com imagem) ou ideias (nome grande); a resposta certa é sempre a que a pessoa diz.

1. **Finanças/cripto.** "Mercado subindo é dinheiro no bolso? Não, literalmente, para a maioria das pessoas."
   `quiz` com `modo: "vf"`, `texto: "Mercado subindo = dinheiro no bolso?"`, alternativas "Verdadeiro" e "Falso" (entrando em "subindo" e "não"), `relogioEm` no silêncio, `certa: 1`, `revelaEm` na palavra da resposta; `fato` com `texto: "Não para a maioria das pessoas"` e `destaque: "maioria"`. Nenhum número de lucro: só o que foi dito.
2. **Saúde ou rotina.** "Quantos copos de água por dia? A, dois. B, cinco. C, oito. Valendo… É oito! E café não conta."
   `quiz` com três alternativas (a grade 2×2 com o anel na quarta casa), letra e número de cada uma no `em`/`textoEm`, `relogioEm` em "Valendo", `certa: 2`; `fato` com `destaque: "8 copos"` e `detalhe: "café não conta"`.
3. **Algo bem distante (história pessoal, relacionamento, carreira).** "Adivinha quantas vezes eu fui recusado antes do primeiro emprego? Três, dois, um… Quarenta e duas."
   `revelacao` com `texto: "Quantas vezes eu fui recusado?"`, a `contagem` no anel e `resposta: "42 vezes"` na palavra "quarenta"; depois um `frase` ou `destaque` com a lição. Para "você é do time A ou B?", `pergunta` com `opcoes` (enquete, sem certa).

Sem pergunta no vídeo? Procure o "sabe qual…", o "o erro mais comum é…", o mito que ela desmente; transforme em `revelacao` ou em verdadeiro ou falso. Toda edição tem um `quiz`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("ela cobre quase dois metros quadrados" vira "Ela cobre quase 2 m²").
- **A resposta certa é a que a pessoa disse.** Nunca decida por conta própria; se ela não revelou, pergunte ao usuário ou use `pergunta` (sem certa).
- **Nunca mostre um número que não foi dito**: nem placar, nem "pergunta 1 de 5", nem porcentagem de acertos.
- A imagem ilustra o que foi dito; nada de marca, pessoa real ou print que a fala não citou.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Se ele pedir "dois efeitos próprios", acrescente o `fato` depois da revelação ou uma `revelacao` numa provocação. Não use `--forcar`.
- **Timing gate fora**: a palavra em `palavras` está errada (corrija no passo 4b) ou o `em` está noutra palavra. Use o `em` da letra para o cartão e o do nome para `textoEm`.
- **A alternativa não cabe**: o cartão reduz o corpo até 28–30 px e quebra em 2 ou 3 linhas; se ficar apertado, encurte com as palavras da fala (até ~22 caracteres com imagem, ~34 sem).
- **Mais de 4 alternativas**: o painel mostra 4. Divida em duas perguntas ou use `topicos`.
- **A imagem tem fundo, texto ou marca d'água**: prefira `tipo: "objeto"` (PNG transparente), outra candidata, ou nenhuma imagem (o nome grande no cartão).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
