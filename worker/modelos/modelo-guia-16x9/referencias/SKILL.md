---
name: modelo-guia-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Guia. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Guia: a pessoa fala em tela cheia e, quando a fala ensina um passo, corte seco para uma tela clara de aula no quadro da esquerda (um infográfico-estrada com as etapas numeradas e zoom na etapa citada, prints reais com seta vermelha grossa no botão, pílulas pretas de arquivo, números, diagramas e um CTA de palavra-chave numa pílula rosa), com a pessoa numa moldura do lado direito, o rosto centralizado e acompanhado. Sem legenda. Serve para qualquer assunto (tutorial, roteiro de estudo, passo a passo, produto, finanças, saúde): a IA transforma a fala em etapas, prints e rótulos. Use quando o usuário pedir o \"modelo Guia\" para o vídeo longo, \"tutorial deitado com prints e setas\", \"aula com mapa de etapas\", ou quiser uma edição pronta para o YouTube nesse visual. Entrega um MP4 deitado 1920×1080. O recorte sem fundo da pessoa (macOS) é opcional nesta versão."
---

# Modelo Guia (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Guia no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, pílulas, estrela, setas, o mesmo infográfico-estrada, o mesmo som e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada (sem zoom no rosto; a câmera só corrige de leve quando ela se mexe). A tela de aula abre **só quando acrescenta clareza** à fala e volta para a pessoa quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **O quadro à esquerda, a moldura à direita.** Num momento, corte seco para o fundo branco: a tela do bloco ocupa o **quadro do lado esquerdo** e a pessoa vai para uma **moldura do lado direito** (600 px de largura, de y 96 até a borda de baixo, cantos de cima arredondados), com o rosto centralizado nela (~38% da largura, a ~34% da altura) e acompanhado com ajuste suave pelo rastro do rosto. Com o recorte sem fundo (`public/pessoa.webm`), a pessoa fica no mesmo lugar sem moldura, com o corpo chegando à borda de baixo. A moldura é sempre à direita: o campo `pessoa` do plano (as poses do vertical) é aceito e ignorado.
- **Corte seco nas duas direções.** Nada de transição: a tela de aula entra no quadro da palavra que a nomeia e a tela cheia volta no fim da ideia. Duas telas separadas por menos de 0,5 s emendam (a anterior fica até a seguinte entrar), para a pessoa nunca piscar em tela cheia por meio segundo.
- **As telas recompostas para o quadro deitado.** As telas são desenhadas com as medidas do vertical (1080 px lógicos de largura, a faixa que no vertical fica acima da cabeça) e ampliadas ~1,04x até o quadro da esquerda: o texto continua medido e reduzido para caber, nada vaza. O infográfico-estrada fica **deitado**: a estrada atravessa o quadro da esquerda para a direita e as placas ficam em fileira, alternando acima e abaixo dela, em ordem. As opções da `pergunta` ficam em fileiras de duas. O print baixo desce para perto do meio da tela de aula.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com tela de aula, nenhum trecho de mais de ~8 s só com a pessoa, um momento a cada ~10 s, nada parado mais de ~6 s. O `cortar.mjs` junta pausas menores que 0,45 s (no vertical, 0,3 s): a respiração natural fica.
- **Margens do YouTube:** nada a menos de 64 px das laterais, nada importante abaixo de y 1000 (controles do player). Sem legenda (o Guia não tem).

O vídeo vira uma aula-guia: a pessoa fala em tela cheia e, a cada passo ensinado, a tela vira uma lousa clara com o **mapa** do vídeo (um infográfico com estrada e placas numeradas), o **zoom** na placa da etapa citada, o **print real com seta vermelha grossa** no botão, as pílulas pretas dos arquivos e ferramentas, e no fim a pílula "Comenta PALAVRA para receber". Você faz o editor: o mapa, as etapas, os prints, o ponto de cada seta e quando voltar à tela cheia.

**Este modelo é um estilo, não um assunto.** O exemplo é um guia rápido do ChatGPT para iniciantes (3 etapas, prints reais do chatgpt.com), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a dinâmica vem da troca de tela, não de efeito. Cada tela entra em **corte seco**, no quadro da palavra que a nomeia ("um", "dia dois", "projetos"); o zoom da placa é um corte (crop de ~2,5x) com uma aproximação lenta por dentro; o print rola devagar e aproxima no ponto; a seta vermelha chega em 0,26 s, sem quicar. No quadro deitado, a outra troca é a da **tela cheia para a tela de aula** e de volta, também em corte seco. Nada de transição, brilho, glitch ou zoom no rosto.
- **Organização e hierarquia:** a tela de aula ocupa o quadro da esquerda e a pessoa a moldura da direita; uma não cobre a outra. O mapa inteiro abre o roteiro (título e subtítulo no alto, a estrada deitada com as placas em fileira). Prints ficam num cartão de 936 px lógicos (~977 px no quadro) dentro das margens; o print alto rola até o ponto, o baixo desce para perto do meio. Rótulos de arquivo e ferramenta são pílulas pretas com texto branco e ficam enquanto o item é explicado.
- **Tipografia:** Manrope 800 para títulos e números (preto), 600 para apoio (cinza), letra de mão (Caveat) só no subtítulo do mapa. Títulos 56 a 112 px lógicos, rótulos de pílula 34 a 56 px, nada abaixo de 24 px (a camada é ampliada ~1,04x no quadro). Sem legenda palavra a palavra.
- **Moldura da pessoa:** dois estados, sempre em corte seco. Tela cheia (como foi gravada) e moldura à direita (cabeça e ombros, o rosto no meio dela, sangrando pela borda de baixo como o corpo do vertical). Sem filtro e sem borda; segue o rosto quando ela se mexe. Com o recorte sem fundo, a pessoa fica sem moldura no mesmo lugar. Nunca numa coluna estreita.
- **Cores, textura e som:** fundo branco, tinta preta `#141414`, **um** laranja de marca `#D97757` (estrela, números, item da vez, grifo), vermelho `#E5322D` só nas setas de clique e rosa `#F0405A` só no CTA. Estrada cinza-grafite com faixa branca tracejada. Som: um "vum" tonal baixo (volume 0,3) só no zoom da placa; `"sfx": false` desliga.
- **Regras da revisão (valem sempre):**
  1. **Margem segura:** nada de texto, placa, título, cartão, print, seta ou pílula encosta nas laterais (≥ 64 px), nem entra na moldura da pessoa, nem desce abaixo de y 1000 (controles do player). O zoom da placa deixa o bloco com folga no quadro da esquerda. A estrada pode sangrar pela borda da esquerda e seguir por trás da pessoa; o rosto e as mãos que apontam ficam dentro do quadro.
  2. **Sem tarja preta:** o print preenche o cartão (o cartão se ajusta à altura da página; nunca faixa preta em cima ou embaixo). Se a proporção não couber, recorte pelo ponto da seta.
  3. **Timing:** cada etapa (zoom da placa), cada print, cada seta e cada item entra **na palavra que o nomeia** (±0,15 s) e mostra literalmente o que está sendo dito. Rótulo sem lógica com a fala é proibido: o tutorial precisa fazer sentido passo a passo. Rode `node ferramentas/conferir-tempos.mjs` (passo 7): ele compara cada `em`/`de` com `work/palavras.json` e reprova desvio maior que 0,15 s.
  4. **O texto sempre cabe no fundo dele:** o template mede e reduz o corpo ou quebra a linha; se o texto do plano for longo demais, encurte.
  5. **O tutorial precisa fazer sentido passo a passo:** cada etapa do mapa é uma ação que a pessoa fala, e o print logo depois mostra **essa** ação na ferramenta real (o site citado, o botão citado, o campo preenchido). Página de enciclopédia, notícia ou tela "parecida" não serve como passo de tutorial. Sem print real da ação, use `passos`/`topicos`, nunca `print`.
  6. **Print legível:** o cartão tem 936 px lógicos (~977 px no vídeo); o texto da tela precisa chegar a ≥ 26 px no vídeo. Capture numa janela estreita (420 a 600 px) com `--escala 3` e recorte só o trecho citado (`--recorte`), em vez de encolher uma página larga inteira.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; e a busca de imagens). O recorte sem fundo da pessoa é **opcional** nesta versão e só roda no **macOS** (Vision da Apple, pelas ferramentas do Xcode: `xcode-select --install`); sem ele, a pessoa aparece no retângulo da moldura.
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo (de preferência gravado **deitado**). Pergunte **uma vez**, numa mensagem só:
   - **a palavra-chave do CTA** ("comenta GUIA", "comenta AULA") e **o que ele promete mandar** (o guia, a planilha, o link). Sem resposta, use a palavra mais óbvia do assunto e avise na entrega;
   - **se ele tem prints próprios** (telas do app, do site, documentos) para entrar no vídeo. Se tiver, peça para pôr na pasta `imagens/` do projeto com nomes que digam o que são (`menu-projetos.png`). Prints do usuário passam na frente de qualquer captura de página pública.


## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela. Crie também a pasta `imagens/` lá dentro (para as imagens do usuário).

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas.

### 3. Escolher as tomadas e justar os cortes

Leia a lista como um editor (veja **Ritmo e cortes**, abaixo). Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, "é…" longos sozinhos, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (meça o volume: `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`; perto de −60 dB é silêncio, −30 dB ou mais é fala).

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Depois de escolher, deixe os cortes justos:

```bash
node ferramentas/justar.mjs --respiro 0.2
```

Ele transforma cada pausa longa entre trechos mantidos num corte com respiro. Numa aula, use o respiro de 0,2 s: a fala fica corrida sem perder a respiração natural. Pausas menores (vírgulas, respiração no meio da frase) ficam como estão.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.38 --queixo-y 0.52
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O formato já vem decidido pelo modelo**: o `modelo.json` fixa 16:9 (quadro 1920×1080); uma gravação deitada entra inteira e uma em pé vira uma faixa deitada em volta do rosto (avise o usuário: grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo (`rosto.rastro`): a câmera acompanha quando a pessoa se mexe, na tela cheia de leve e na moldura de perto. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 4b. Recortar a pessoa (opcional, só no macOS)

```bash
node ferramentas/recortar.mjs
```

Gera `public/pessoa.webm`: a pessoa sem fundo, com transparência, a partir do vídeo já cortado (`public/base.mp4`). Compila um programa pequeno em Swift na primeira vez (~30 s) e processa ~1 s de vídeo por ~2 s. **Rode de novo sempre que refizer o corte** (`cortar.mjs`), senão o recorte sai da voz. Com ele, a pessoa fica sem moldura na tela de aula; sem ele (ou com `"recorte": false` no plano), a pessoa aparece no retângulo da moldura, o que também é o visual deste modelo no quadro deitado. A tela cheia usa sempre o vídeo gravado.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: as linhas laranja das margens laterais (64 px), a vermelha da área segura de baixo (y 1000, controles do player), a azul da área da tela de aula e a roxa da moldura da pessoa, com a linha do rosto. Na moldura, o rosto precisa cair perto da linha roxa, inteiro e no meio. Com o recorte, olhe também a borda (cabelo, mãos): se aparecer halo do fundo antigo, a tomada tinha parede clara atrás; avise o usuário.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 1,5 a 6 s e dê a cada uma uma forma e um bloco **deste modelo** (tabela "Blocos deste modelo", abaixo), ou "tela cheia" quando a pessoa só conversa. As perguntas do Guia, em ordem:

1. **A fala é um roteiro de etapas ("dia 1 ao 5", "três passos", "primeiro… depois…")?** Então é o `mapa`: o infográfico inteiro quando o roteiro é apresentado e, **na palavra de cada etapa**, um momento `mapa` com `foco` na placa dela. 2 a 6 placas, cada uma com título de 2 a 3 palavras e um detalhe.
2. **A pessoa manda clicar, abrir, trocar de aba ou mostra uma tela?** É um `print` com `setas` no botão, na palavra do botão.
3. **A pessoa cita arquivos, ferramentas, pastas, documentos?** É `topicos` (pílulas pretas empilhadas) ou `print` com `rotulo`.
4. **Um conceito abstrato ("não sabe nada sobre você")?** `destaque` com a estrela e a palavra grande; ou `pergunta`.
5. **Número, comparação, gráfico, definição?** Os blocos universais.
6. **A pessoa conta uma história, dá contexto, conversa com quem assiste?** Tela cheia (nenhum momento), no máximo ~8 s seguidos.
7. O fim é sempre `cta` (pílula) nos últimos 3 a 5 s.

Ritmo de aula: a tela de aula abre na palavra do passo e fica enquanto ele é explicado (uma tela nova a cada 3 a 8 s dentro de um passo); entre um passo e outro, a pessoa volta à tela cheia. Pelo menos metade do vídeo com tela de aula; nenhum trecho de mais de ~8 s só com a pessoa. O corte da tela cai no meio da frase, na palavra do número ou do botão.

### 6b. Prints e capturas

O Guia usa **print de tela real**; fotos só em casos raros (`references/imagens.md`). Antes de capturar, escreva `work/roteiro-visual.md`: uma tabela palavra → o que aparece → fonte (qual tela, qual botão, qual recorte).

1. Prints do usuário: `node ferramentas/capturar.mjs --arquivo menu=imagens/menu-projetos.png`.
2. Páginas públicas, com interação: `ferramentas/capturar-tela.mjs` abre a página no Chrome headless do projeto (com agente de navegador comum, em pt-BR), faz cliques e digita **sem enviar nada**, e grava só o trecho pedido, em alta:
   ```bash
   # descobrir onde estão os botões e campos (x,y em px da janela)
   node ferramentas/capturar-tela.mjs teste https://chatgpt.com/ --inspecionar 1
   # a tela inicial numa janela estreita (texto grande no cartão)
   node ferramentas/capturar-tela.mjs etapa1 https://chatgpt.com/ --largura 600 --altura 420 --escala 3
   # só o seletor do topo (x,y,largura,altura em px da janela)
   node ferramentas/capturar-tela.mjs etapa2 https://chatgpt.com/ --recorte 262,0,300,90 --escala 4
   # a caixa de mensagem com o prompt escrito (nada é enviado)
   node ferramentas/capturar-tela.mjs etapa3 https://chatgpt.com/ --largura 420 --altura 760 --escala 3 --recorte 0,308,420,214 \
     --acoes '[{"clicar":"textarea"},{"digitar":"Você é um nutricionista. Monte um cardápio..."}]'
   ```
   Ações: `clicar` (seletor CSS), `clicarTexto`, `clicarEm` ([x,y]), `digitar`, `tecla`, `esperar` (s). `--espera 12` = segundos de carregamento. Sem login, sem banner de cookie, sem enviar formulário, **nunca com o nome da ferramenta de edição à mostra**. Para uma página estática inteira, `capturar.mjs` continua servindo (`--escala 2 --agente desktop`).
3. **Olhe cada print** (tooltip, banner, popup, página certa? O layout da página muda com o tamanho da janela: confira o recorte) e anote **onde está o botão ou o trecho citado**, em frações da imagem: é a ponta da seta.
4. **O que exige login não se inventa.** Se a tela da etapa só existe logado (lista de modelos, configurações), mostre o elemento real visível sem login (o botão/seletor fechado) com a seta, ou peça o print ao usuário. Nunca desenhe uma interface falsa. Diga isso na entrega.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `mapa` (o infográfico), `momentos` e `correcoes`; deixe `marca` vazia e `semLegenda` cobrindo o vídeo todo (o Guia não tem legenda). Os trechos sem momento são a tela cheia.

Depois:
- `node ferramentas/conferir-tempos.mjs`: o gate de timing; corrija até sair **APROVADO**;
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;


### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida a ~960 px de largura** e confira de verdade:
- **mapa inteiro:** título legível, 2 a 6 placas em fileira na estrada, nada encostado na moldura; **zoom:** a placa certa, número e título inteiros, nada cortado, folga nas margens;
- **print:** a página certa, sem banner nem tooltip; texto da tela legível (≥ 26 px); a seta aponta **exatamente** o botão ou trecho citado (a ponta é o ponto `x,y`) e aparece na palavra dita; a pílula da seta fica dentro do quadro da esquerda;
- **pessoa:** na tela cheia, como gravada; na moldura, o rosto inteiro e no meio, sem pular; com o recorte, sem halo claro nas bordas;
- **margens:** nada a menos de 64 px das laterais (`stills.mjs --guias` desenha as linhas), nada dentro da moldura, nada importante abaixo de y 1000;
- rótulos e textos cabem; nenhum quadro vazio; nenhuma piscada da tela cheia entre duas telas; pílula do CTA legível por mais de 1,2 s.

Corrija o plano (outro ponto da seta, texto mais curto, outro `em`, um vão para a tela cheia) e repita até estar limpo (no máximo 2 rodadas).

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-guia.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (quantas pausas viraram corte);
- o **mapa resumido** (que bloco e que imagem entrou em cada trecho, e onde ficou a tela cheia);
- de onde vieram as imagens (pasta do usuário ou busca) e o texto de `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que ele pode trocar por uma própria).


## Ritmo e cortes (cortar como editor de aula)

- **Corte pelas pausas reais**, com respiro de ~0,2 s (`ferramentas/justar.mjs --respiro 0.2`). É uma aula: corte as pausas excessivas e os erros, mas mantenha a respiração natural e o tempo de entender a explicação. Não acelere como se fosse um anúncio.
- **A pessoa é contínua.** Quem corta é a tela; por isso o Guia **não** reenquadra nem dá zoom no rosto a cada corte do vídeo. A única "câmera" é o zoom na placa do mapa (e o acompanhamento suave do rosto).
- **O que sai:** silêncio longo, "é…" longos, tomada repetida (fica a última completa), frase abandonada, comentário depois do fim.
- **O corte da tela cai no meio da frase, na palavra do número ou do botão**, nunca no fim de uma frase. A volta à tela cheia cai no fim da ideia.

## Blocos deste modelo

Todos aparecem no quadro da esquerda, com a pessoa na moldura da direita.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura 1: roteiro/etapas** | `mapa` (+ `plano.mapa`) | infográfico branco com título, subtítulo em letra de mão e uma estrada deitada que atravessa o quadro com as placas numeradas em fileira (acima e abaixo dela, em ordem); um momento sem `foco` mostra tudo, um com `foco: n` dá o zoom na placa n (corte seco) |
| **assinatura 2: ação de interface** | `print` | a captura real (recortada no trecho citado) num cartão dentro das margens, com seta vermelha grossa no ponto (`setas`; a pílula da seta entra na palavra dela, `textoEm`), barra de navegador com o site falado (`endereco`), pílula preta opcional (`rotulo`) |
| abertura | `abertura` | estrela laranja que gira ao entrar e o título enorme, palavra por palavra; `destaque` ganha grifo laranja |
| lista | `topicos` | pílulas pretas com texto branco empilhadas; a da vez fica laranja; `detalhe` em cinza embaixo |
| passos | `passos` | mini estrada com placas numeradas; o traço escuro avança até a da vez |
| número | `numero` | número gigante laranja contando em pt-BR, traço preto que se completa, rótulo embaixo |
| comparação | `comparacao` | dois cartões lado a lado com pílula de rótulo; o vencedor ganha contorno laranja, o outro apaga |
| gráfico | `grafico` | barras pretas (a da vez laranja), linha ou rosca; sem números ditos, uma curva laranja "ilustrativo" |
| destaque | `destaque` | ícone da estrela (quadrado laranja) e a palavra grande; `alerta` = pílula vermelha |
| definição | `definicao` | o termo numa pílula preta grande e o significado embaixo |
| frase | `frase` | aspas laranja e a frase grande palavra por palavra; `risco` riscado quando dito |
| pergunta | `pergunta` | estrela e a pergunta grande; `opcoes` em pílulas com contorno, em fileiras de duas |
| fechamento | `cta` | pílula rosa-vermelha larga (940 px lógicos) por cima do último print, que fica parado no cartão dele; "Comenta PALAVRA", palavra por palavra |

Campo `pessoa` (as poses do vertical): aceito e ignorado no quadro deitado. A pessoa fica sempre na moldura da direita durante a tela de aula e em tela cheia fora dela.

## A assinatura em qualquer assunto

O `mapa` representa **"este é o caminho, e é aqui que estamos"**: mostra o percurso inteiro antes do começo e volta a cada etapa. O `print` representa **"clica exatamente aqui"**.

1. **Finanças/cripto.** "Em cinco passos você sai do zero ao primeiro investimento: abrir conta, entender risco, fazer o primeiro aporte…"
   `mapa` com 5 placas ("Abra a conta", "Entenda o risco"…); zoom em cada uma na palavra do passo; `print` do app da corretora do usuário com seta no botão "Investir". Sem print do usuário, não invente o app: use `passos`.
2. **Saúde (sono).** "Semana 1, tira a tela do quarto. Semana 2, horário fixo. Semana 3, luz da manhã."
   `mapa` com 3 placas (uma por semana, detalhe curto); `destaque` com a estrela para a ideia central ("rotina").
3. **Carreira/currículo.** "No LinkedIn, vai em Perfil, depois em Adicionar seção e escolhe Projetos."
   `print` real do LinkedIn do usuário com a seta no botão (uma seta por clique, cada uma na palavra dita); `mapa` para as 3 etapas do perfil.

Outros nichos: receita (placas = etapas, `topicos` = ingredientes), viagem (placas = dias), estudo (placas = semanas), vendas (placas = o funil; print da página de vendas).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- A imagem mostra **o que foi dito**, não uma interpretação. Na dúvida, cartão com a palavra.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- Sem marca e sem pessoa famosa nas buscas; print, só o real que o usuário mandar.
- Se a fala final revela algo (por exemplo, que a edição foi feita por IA), preserve esse momento sem antecipá-lo; se não foi gravado, não crie a afirmação.


## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A fala ainda tem pausas longas no vídeo**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: aumente o respiro (`node ferramentas/justar.mjs --respiro 0.22`) ou, só naquele corte, afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **A seta caiu fora do botão:** `x` e `y` são frações do print **inteiro**; releia o print, corrija e confira no quadro.
- **A pessoa pisca em tela cheia entre duas telas:** o vão entre os momentos passou de 0,5 s; encoste o `ate` de um no `de` do outro, ou deixe um vão de verdade (≥ 2 s) para a tela cheia.
- **O rosto sai do meio da moldura:** confira o rastro com `node scripts/rastrear.mjs --conferir <segundos>`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de faixa deitada no cortar** (gravação em pé): o vídeo de trabalho é uma faixa em volta do rosto e sai menos nítido. Avise o usuário: grave deitado.
- **O recorte da pessoa ficou com halo ou cortou cabelo/mão:** a tomada tem parede clara ou pouca luz; rode `node ferramentas/recortar.mjs` de novo só se mudar a tomada, ou apague `public/pessoa.webm` (a pessoa volta ao retângulo da moldura). `cortar.mjs` e `recortar.mjs` precisam rodar nessa ordem.
