---
name: modelo-devocional
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Devocional, uma página de livro de devoção calma e viva: a fala é escrita palavra por palavra em serifada grande sobre pergaminho, a palavra-chave acende, a página vira entre os blocos e a poeira de luz fica só no fundo. No versículo ou na citação a página fica cheia (capitular e referência em versalete) e a pessoa vai para um medalhão; no resto ela fica numa moldura larga embaixo. Serve para qualquer assunto (o exemplo é Mateus 11:28, mas funciona com reflexão, autoajuda, finanças, saúde, histórias e frases de livro): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Devocional\", \"versículo do dia\", \"mensagem do dia\", \"reflexão\", \"vídeo para igreja\", \"citação com voz\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Devocional

O vídeo vira uma **página de livro de devoção**: pergaminho marfim em cima, a pessoa numa moldura larga embaixo. A fala é escrita na página palavra por palavra, em serifada grande e bem espaçada; a palavra que importa **acende** (fica oliva, com uma luz creme por trás e um fio de luz embaixo); entre um bloco e outro a **página vira**. No **versículo** (ou citação) a página fica cheia: o texto inteiro já está nela "a lápis" e cada palavra ganha tinta quando é dita, com a capitular, a chamada e a referência em versalete; a pessoa vai para um medalhão no centro de baixo e volta depois. Poeira de luz e uma luz de janela passeiam devagar só na página, nunca na pessoa. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher a palavra que acende, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um versículo (Mateus 11:28), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** calma, mas viva: algo muda a cada ~2,5 s, mesmo que seja só uma palavra ganhando tinta. As palavras aparecem como tinta (opacidade + desfoque que some + 10 px de subida, 0,42 s), no instante em que são ditas. A palavra-chave acende em 0,6 s. Entre os blocos a página vira em 0,5 s, girando na lombada (à esquerda), com sombra na folha de baixo. Desenhos de traço fino se desenham na palavra que os nomeia e depois têm um movimento lento (o sol nasce, a chama tremula, o ramo balança). Nada gira, treme, pisca ou salta.
- **Organização e hierarquia:** uma coisa por página, centrada, com muito respiro. Títulos e rótulos em versalete oliva com um ornamento (dois fios e um raminho); o texto falado é o maior elemento; o que acende é a ênfase. No versículo: chamada no alto, texto com capitular, ornamento e a referência embaixo.
- **Tipografia:** **EB Garamond** (500, sem condensar) para tudo que é lido na página: 56–108 px no versículo, 56–96 px na abertura, até 300 px na palavra da `luz`; itálico para frases de apoio e fechamento; versalete (capitais menores, +0,06 a +0,08em) para chamada, referência, títulos e rótulos. **Manrope** só na tarja do nome (48 px, nunca menos de 40) e na legenda. Tracking nunca mais apertado que −0,01em.
- **Moldura da pessoa:** moldura larga embaixo (x 36 a 1044, a partir de y 1000, cantos de 44 px, um filete oliva em volta), cabeça inteira com ~52 px de folga, rosto no eixo central e seguido quadro a quadro (`VideoNaCaixa` com `plano.rosto`). No versículo ela se recolhe num medalhão (420 × 500, centro de baixo, de y 1190 a 1690) com a cabeça inteira; no bloco seguinte volta. Escala 100% ↔ 104% em corte seco. A tarja (cartão claro com fita oliva, nome em 48 px e área em 34 px) fica acima da moldura, à esquerda, com 34 px de folga, nos primeiros ~3,5 s.
- **Cores, textura e som:** pergaminho marfim (#F3EAD4, textura feita por código, com deriva lenta), tinta azul-noite (#1E2945), verde-oliva (#5B6A2E) nos ornamentos e no que acende, luz creme, acento suave de aurora (#C9866A) no sol, no selo da carta e no coração, tijolo (#9C4535) só em alerta e risco. **Nada de preto + dourado.** Sons tonais, raros e baixos: um sopro tonal quando a página vira, uma nota macia quando uma palavra acende, um toque curto em itens e referência, duas notas no envio. Nada de sino, coro, órgão, ruído de papel ou ruído branco.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "André Lacerda" / "Reflexão do dia"): vão na tarja do começo. Sem resposta, siga sem tarja. Não ponha título religioso (pastor, padre, igreja) que a pessoa não pediu. Se houver citação, pergunte a **fonte só se ela não foi dita** e não a escreva na tela sem que a pessoa diga (ver "Fidelidade").

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

### 3. Escolher as tomadas (e o ritmo calmo)

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica.

**O ritmo do Devocional** (calmo, mas sem silêncio morto):
- entre frases: **~0,4 a 0,6 s** de respiro (é aí que a página vira);
- dentro do versículo, mantenha as pausas naturais de leitura (os trechos encostados, o `ate` de um = o `de` do próximo: o `cortar.mjs` junta vizinhos com menos de 0,3 s entre eles e mantém a pausa original);
- **depois da frase principal** (a que tem a palavra que acende), pode ficar um respiro natural de até ~0,9 s: é o tempo da luz;
- a primeira palavra sai em ≤ 0,1 s (ponha o `de` do primeiro trecho ~0,2 s antes dela).

Para apertar uma pausa, mexa no `ate` do trecho de antes e no `de` do de depois, deixando **pelo menos 0,31 s cortados** entre eles (com menos, o cortar junta os dois e a pausa inteira volta). A pausa que fica = (`ate` − fim da última palavra) + (começo da próxima palavra − `de`).

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.41
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo** (`modelo.json` fixa a gravação vertical em 9:16; a pessoa fica sempre na moldura de baixo ou no medalhão). Refazendo o corte depois de já ter planejado, use `--manter-plano` (e confira de novo os tempos em `palavras` e nos momentos: tudo depois do corte mudado anda junto). No fim, o `cortar.mjs` segue o rosto pelo vídeo: a moldura acompanha quando a pessoa se mexe.

### 4b. Corrigir as palavras

Abra `src/plano.json` → `palavras` (o mesmo que `work/palavras.json`) e corrija o que a transcrição errou, **no lugar certo da lista**:
- a grafia do versículo ou da citação **como a pessoa falou** (a transcrição costuma trocar "estais" por "estáis", "pra" por "para", "vós" por "vos");
- números da referência: deixe como algarismos ("11,", "28.") ou por extenso; o timing gate aceita os dois;
- o começo de palavras com consoante suave ("Manda", "Descansar") costuma vir ~0,1–0,15 s adiantado: se o gate ou o quadro mostrar desvio, meça o volume (`ffmpeg -ss <de> -t 0.6 -i public/base.mp4 -af volumedetect -f null -`) e acerte o `em`.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto, com a cabeça inteira logo abaixo da linha rosa (a moldura, y 1000); o retângulo verde é a área de texto da página; a linha amarela é o centro da legenda (abaixo do queixo); nada importante fora das linhas vermelhas (interface do app e margens de 64 px). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Ache:
- o **gancho** (a primeira frase) e a palavra que pode acender nele;
- a **citação**: versículo, frase de livro, frase de autor, conselho de alguém ("minha avó dizia…") ou a frase mais forte da própria pessoa. Anote a chamada, se foi dita ("Está escrito", "Como dizia…"), e a referência, se foi dita, com o instante de cada pedaço ("Mateus" / "onze" / "vinte e oito");
- a **frase-chave** com UMA palavra que resume tudo ("fé", "descanso", "paciência", "critério"): é a `luz`;
- listas, números, comparações, perguntas (os blocos universais);
- o fechamento (mandar para alguém, salvar, comentar, seguir).

Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`versiculo`) entra pelo menos uma vez**, e em vídeos de mais de 20 s use os dois efeitos próprios (`versiculo` e `luz`). Sem citação nenhuma na fala, o `versiculo` entra no **modo reflexão** com a frase mais forte da pessoa, exatamente como ela disse.

**Desenhos (opcionais, vetor, sem imagem de banco):** `abertura`, `frase`, `destaque` e `luz` aceitam `desenho` na palavra que ele mostra literalmente: `amanhecer` (acordar, manhã, recomeço), `vela` (oração, esperança, noite difícil), `livro` (estudo, leitura, escrita), `ramo` (paz, reconciliação), `coracao` (amor, cuidado), `caminho` (direção, jornada), `lua` (noite, sono, descanso), `semente` (começo, crescer, plantar). Use só quando a palavra pede; desenho que "mais ou menos combina" é proibido.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada `em` vem de `palavras`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: o **timing gate**. Cada entrada precisa cair a ±0,15 s da palavra que a nomeia (primeira palavra do bloco, chamada, cada pedaço da referência, a palavra que acende, itens, desenho); corrija até sair **APROVADO**. "Confira no quadro" = o texto da tela não é a palavra dita (resumo): olhe o quadro daquele instante no passo 8;
- `node scripts/legendas.mjs`: lista as linhas de legenda (que só aparecem nos momentos com `legenda: true`).

**Os blocos se encostam** (o `ate` de um = o `de` do próximo) e o `de` do bloco seguinte fica **na pausa, ~0,2 a 0,35 s antes da primeira palavra dele** (nunca antes de a última palavra do anterior terminar): a página vira em 0,5 s e a primeira palavra nova cai quando a folha já abriu. Depois de uma `luz`, deixe a palavra acesa legível por **≥ 0,8 s** antes da virada.

**O fim do vídeo**: o vídeo termina ~0,3 s depois da última palavra: ponha em `duracao` (e no `ate` do último momento) o fim da última palavra + 0,3 s.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros **reduzidos à largura de um celular (~540 px)** e confira de verdade (peça também quadros 0,3 s depois de cada palavra que acende e no meio de cada virada de página):
- o versículo (ou a citação) é **exatamente o que foi dito**? A referência aparece só se foi dita, pedaço por pedaço, na palavra?
- a palavra que acende é a que importa, e acende **na palavra**?
- o texto cabe e se lê em 1 s no celular? Nada encostado nas margens (64 px), nada acima de y 120, nada importante abaixo de y 1700;
- no medalhão a cabeça está inteira e o rosto no centro? A tarja tem o nome legível (≥ 34 px)?
- a virada de página não pega uma palavra nova no meio por muito tempo (se pegar, adiante o `de` do bloco para a pausa)?
- o fechamento fica legível por pelo menos 1,2 s?
- a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-devocional.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho) e o maior desvio do timing gate;
- a citação mostrada e a fonte (só se dita);
- o que é ilustrativo;
- o que o usuário deve conferir (a grafia da citação, uma palavra que a transcrição trocou).

## Blocos deste modelo

Todos os blocos são escritos **na página** (em cima); a pessoa fica embaixo, e no versículo vai para o medalhão.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | a frase do gancho escrita palavra por palavra, grande, centrada; cada frase numa linha nova; `destaque` acende; `desenho` opcional acima |
| lista | `topicos` | título em versalete com ornamento; cada item numa linha com uma folhinha oliva que entra no `em`; a folha da vez ganha luz |
| passos | `passos` | o mesmo, com bolinhas oliva ligadas por um fio que desce até o passo da vez (sem números) |
| número | `numero` | o número grande em EB Garamond contando, que acende oliva no fim; ornamento; o rótulo em itálico; "ilustrativo" em versalete quando for |
| comparação | `comparacao` | um livro aberto: cada lado numa página, com a dobra no meio e rótulo em versalete; o vencedor acende, o outro esmaece (`errado-certo`: risco de tinta no errado) |
| gráfico | `grafico` | desenhado a tinta: barras hachuradas (a maior em oliva), linha oliva com pontos, pizza; sem números ditos, a curva da tendência com "ilustrativo" |
| destaque | `destaque` | a frase curta em EB Garamond 600, enorme, que acende inteira; `alerta` = tijolo, sem luz |
| definição | `definicao` | verbete: o termo grande, um fio oliva que se desenha, o significado em itálico palavra por palavra |
| frase | `frase` | aspas oliva grandes e a frase palavra por palavra; `destaque` acende, `risco` leva um traço de tinta |
| pergunta | `pergunta` | a pergunta grande sobre um "?" oliva bem claro que respira; `opcoes` em linhas com círculos que se desenham |
| fechamento | `cta` | um ícone de traço fino (carta que se fecha com um coração, marcador, balão, +, elo) e o convite em itálico; `destaque` acende |
| **assinatura** | `versiculo` | a página fica cheia, a pessoa vai para o medalhão; chamada em versalete, texto inteiro "a lápis" que ganha tinta na fala, capitular (escritura) ou aspas (livro/autor), a palavra que acende, a referência em versalete montada pedaço por pedaço |
| próprio | `luz` | a frase em itálico pequena e UMA palavra enorme no meio que acende na fala, com a luz subindo atrás e poeira de luz em volta |

## A assinatura em qualquer assunto

O `versiculo` é **"uma frase que merece ser guardada, escrita numa página enquanto a voz a lê"**: versículo, citação de livro, frase de autor, conselho de alguém ou a frase mais forte da própria pessoa (modo reflexão). A `luz` é **"a palavra que resume tudo"**.

1. **Finanças/cripto.** "Mas o mercado subindo não significa dinheiro no bolso, literalmente, para a maioria das pessoas."
   `versiculo` com `modo: "reflexao"`, `texto` exatamente como foi dito e `destaque: "maioria das pessoas"`; depois uma `luz` com `texto: "Agora, como avaliar os projetos e pensar no seu posicionamento?"` e `palavra: "posicionamento"`. Nenhuma referência (ninguém foi citado).
2. **Saúde ou rotina.** "Meu médico me disse uma coisa que eu nunca esqueci: o corpo cobra o descanso que você não dá. Dormir também é cuidar."
   `versiculo` com `modo: "autor"`, `chamada: "Meu médico me disse"` e `texto: "o corpo cobra o descanso que você não dá"` (sem `referencia`: a chamada já diz quem falou); depois `luz` com `texto: "Dormir também é cuidar."`, `palavra: "cuidar"` e `desenho: "lua"` em "Dormir".
3. **Algo bem distante (relacionamento, carreira, história pessoal).** "No livro O Pequeno Príncipe tem uma frase: só se vê bem com o coração. Eu demorei dez anos para entender."
   `versiculo` com `modo: "livro"`, `texto: "Só se vê bem com o coração."`, `obra: "O Pequeno Príncipe"` na palavra "Pequeno"; depois `numero` (10 anos, dito) ou `luz` com `palavra: "coração"` e `desenho: "coracao"`.

Sem citação e sem frase forte? Use a frase do gancho em modo reflexão. Toda edição tem um `versiculo`.

## Fidelidade

- Tudo na tela vem da fala.
- **O versículo ou a citação é exatamente o que a pessoa disse**, com as palavras dela. Nunca troque pela versão de uma tradução da Bíblia ou do livro, nunca complete o que ela não disse e nunca corrija a teologia.
- **A referência (livro, capítulo, versículo, autor, obra) só aparece se foi dita.** Nunca mostre um número que não foi falado (nem número de página, nem "dia 1").
- **Respeitoso e sem denominação**: nada de símbolo de igreja, santo, logotipo ou título que a pessoa não pediu. Os desenhos são neutros (luz, vela, livro, ramo).
- Número ilustrativo só onde o bloco permite, com a etiqueta visível.
- Nenhuma marca ou logo real na tela (o ícone de enviar é uma carta, não o de um aplicativo).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Se ele pedir "dois efeitos próprios", acrescente uma `luz` na frase-chave ou um `versiculo` em modo reflexão. Não use `--forcar`.
- **Timing gate fora**: a palavra em `palavras` está errada (corrija no passo 4b) ou o `em` está noutra palavra.
- **A palavra que acende some rápido** (a página vira logo depois): ela precisa de ≥ 0,8 s legível. Deixe o respiro natural depois dela no corte (passo 3) e ponha o `de` do bloco seguinte ~0,2 s antes da próxima palavra.
- **O versículo ficou pequeno**: ele é longo demais para uma página (mais de ~180 caracteres). Divida em dois `versiculo` seguidos (a página continua cheia e vira entre eles).
- **O desenho não tem a ver com a palavra**: tire o desenho. Texto sozinho é o estilo.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
