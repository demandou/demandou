---
name: modelo-guia
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Guia: a pessoa vira um recorte sem fundo na metade de baixo da tela, sobre telas claras de aula que trocam com corte seco a cada 3 a 6 s: um infográfico-estrada com as etapas numeradas (com zoom na etapa citada), prints reais com seta vermelha grossa no botão, pílulas pretas de arquivo, números, diagramas e um CTA de palavra-chave numa pílula rosa. Sem legenda. Serve para qualquer assunto (tutorial, roteiro de estudo, passo a passo, produto, finanças, saúde): a IA transforma a fala em etapas, prints e rótulos. Use quando o usuário pedir \"modelo Guia\", \"guia em passos com mapa\", \"recorte da minha pessoa sobre infográfico\", \"tutorial com prints e setas\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920. Precisa de macOS para o recorte automático da pessoa."
---

# Modelo Guia

O vídeo vira uma aula-guia: a pessoa sai do cenário e fica recortada, sem fundo, na metade de baixo da tela (cabeça entre 50% e 70% da altura, ombros cortados pela borda), e atrás dela a tela de conteúdo troca a cada 3 a 6 s com corte seco. O primeiro quadro já mostra o **mapa** do vídeo (um infográfico com estrada e placas numeradas); cada etapa citada ganha um **zoom** na placa dela; cada ação de interface vira um **print real com seta vermelha grossa** no botão; os arquivos e ferramentas viram pílulas pretas; o fim é uma pílula "Comenta PALAVRA para receber". Você faz o editor: o mapa, as etapas, os prints e o ponto de cada seta.

**Este modelo é um estilo, não um assunto.** O exemplo é um guia rápido do ChatGPT para iniciantes (3 etapas, prints reais do chatgpt.com), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a dinâmica vem da troca de tela, não de efeito. Cada tela entra em **corte seco**, no quadro da palavra que a nomeia ("um", "dia dois", "projetos"); o zoom da placa é um corte (crop de ~3x) com uma aproximação lenta por dentro; o print rola devagar e aproxima no ponto; a seta vermelha chega em 0,26 s, sem quicar. A pessoa **pula de lugar** (direita, esquerda, centro, encolhida no topo, colada na borda) para nunca cobrir o texto-chave; trocas de lugar dentro da mesma tela deslizam em 0,3 s. Nada de transição, brilho, glitch ou zoom no rosto.
- **Organização e hierarquia:** a tela de conteúdo ocupa a metade de cima (y < 860) e a pessoa a de baixo; a cabeça pode sobrepor a base do cartão. O mapa vem inteiro no primeiro quadro, com a pessoa no canto de baixo à direita. Prints largos (≥ 76% da largura) ficam no alto; se o print é grande, a pessoa **encolhe para o topo** e o print a cobre pela cintura. Rótulos de arquivo e ferramenta são pílulas pretas com texto branco e ficam enquanto o item é explicado.
- **Tipografia:** Manrope 800 para títulos e números (preto), 600 para apoio (cinza), letra de mão (Caveat) só no subtítulo do mapa. Títulos 56 a 112 px, rótulos de pílula 34 a 56 px, nada abaixo de 24 px. Sem legenda palavra a palavra.
- **Moldura da pessoa:** recorte sem fundo (segmentação de pessoas do macOS), sem filtro e sem borda; segue o rosto quando ela se mexe; o corpo sempre chega à borda de baixo (menos na miniatura do topo). Nunca numa coluna estreita ao lado.
- **Cores, textura e som:** fundo branco, tinta preta `#141414`, **um** laranja de marca `#D97757` (estrela, números, item da vez, grifo), vermelho `#E5322D` só nas setas de clique e rosa `#F0405A` só no CTA. Estrada cinza-grafite com faixa branca tracejada. Som: um "vum" tonal baixo (volume 0,3) só no zoom da placa; `"sfx": false` desliga.
- **Regras da revisão (valem sempre):**
  1. **Margem segura:** nada de texto, placa, título, cartão, print, seta ou pílula encosta nas laterais: ≥ 64 px de cada lado (≥ 6% da largura), topo ≥ 120 px, e nada importante abaixo de y 1490 (interface do app). O zoom da placa é de ~3x justamente para o bloco ficar com folga. O recorte da pessoa pode sangrar pela borda de baixo, mas o rosto e as mãos que apontam ficam dentro do quadro.
  2. **Sem tarja preta:** o print preenche o cartão (o cartão se ajusta à altura da página; nunca faixa preta em cima ou embaixo). Se a proporção não couber, recorte pelo ponto da seta.
  3. **Timing:** cada etapa (zoom da placa), cada print, cada seta e cada item entra **na palavra que o nomeia** (±0,15 s) e mostra literalmente o que está sendo dito. Rótulo sem lógica com a fala é proibido: o tutorial precisa fazer sentido passo a passo. Rode `node ferramentas/conferir-tempos.mjs` (passo 7): ele compara cada `em`/`de` com `work/palavras.json` e reprova desvio maior que 0,15 s.
  4. **O texto sempre cabe no fundo dele:** o template mede e reduz o corpo ou quebra a linha; se o texto do plano for longo demais, encurte.
  5. **O tutorial precisa fazer sentido passo a passo:** cada etapa do mapa é uma ação que a pessoa fala, e o print logo depois mostra **essa** ação na ferramenta real (o site citado, o botão citado, o campo preenchido). Página de enciclopédia, notícia ou tela "parecida" não serve como passo de tutorial. Sem print real da ação, use `passos`/`topicos`, nunca `print`.
  6. **Print legível:** o cartão tem 936 px de largura; o texto da tela precisa chegar a ≥ 26 px no vídeo. Capture numa janela estreita (420 a 600 px) com `--escala 3` e recorte só o trecho citado (`--recorte`), em vez de encolher uma página larga inteira.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de **macOS** (o recorte da pessoa usa o Vision da Apple, pelas ferramentas do Xcode: `xcode-select --install`), Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; e a busca de imagens). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
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
node ferramentas/justar.mjs
```

Ele transforma cada pausa de 0,38 s ou mais entre trechos mantidos num corte com ~0,16 s de respiro (`--respiro 0.2` para uma fala mais calma). Pausas menores (vírgulas, respiração no meio da frase) ficam como estão.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa 9:16 (quadro cheio) para gravação vertical e horizontal; numa gravação horizontal o quadro é um recorte em volta do rosto, então ela precisa de boa resolução (1080p no mínimo; 4K fica nítido). A pessoa aparece em ~55% da largura do quadro, então 1080p vertical é suficiente. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a câmera acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 4b. Recortar a pessoa

```bash
node ferramentas/recortar.mjs
```

Gera `public/pessoa.webm`: a pessoa sem fundo, com transparência, a partir do vídeo já cortado (`public/base.mp4`). Compila um programa pequeno em Swift na primeira vez (~30 s) e processa ~1 s de vídeo por ~2 s. **Rode de novo sempre que refizer o corte** (`cortar.mjs`), senão o recorte sai da voz. Sem macOS, ponha `"recorte": false` no `plano.json`: a pessoa aparece em retângulo, sem recorte (perde o visual do modelo; avise o usuário).


### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cabeça da pessoa precisa cair entre as duas linhas azuis (50% e 70% da altura); nada importante abaixo da linha vermelha (interface do app) nem na faixa vermelha da direita (botões). Olhe também a borda do recorte (cabelo, mãos): se aparecer halo do fundo antigo, a tomada tinha parede clara atrás; avise o usuário.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 1,5 a 6 s e dê a cada uma uma forma e um bloco **deste modelo** (tabela "Blocos deste modelo", abaixo). As perguntas do Guia, em ordem:

1. **A fala é um roteiro de etapas ("dia 1 ao 5", "três passos", "primeiro… depois…")?** Então é o `mapa`: uma abertura com o infográfico inteiro (a pessoa no canto) e, **na palavra de cada etapa**, um momento `mapa` com `foco` na placa dela. 2 a 6 placas, cada uma com título de 2 a 3 palavras e um detalhe.
2. **A pessoa manda clicar, abrir, trocar de aba ou mostra uma tela?** É um `print` com `setas` no botão, na palavra do botão.
3. **A pessoa cita arquivos, ferramentas, pastas, documentos?** É `topicos` (pílulas pretas empilhadas) ou `print` com `rotulo`.
4. **Um conceito abstrato ("não sabe nada sobre você")?** `destaque` com a estrela e a palavra grande; ou `pergunta`.
5. **Número, comparação, gráfico, definição?** Os blocos universais.
6. O fim é sempre `cta` (pílula) nos últimos 3 a 5 s.

Ritmo: uma tela nova a cada 3 a 6 s (média ~4,5 s; nenhuma passa de 8 s sem a pessoa mudar de lugar); o primeiro momento começa no tempo 0 com o mapa inteiro; corte seco no meio da frase, na palavra do número; o trecho mais longo (explicação) pode ter a pessoa encolhida (`"pessoa": "topo"`) sobre um print grande.

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

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `mapa` (o infográfico), `momentos` e `correcoes`; deixe `marca` vazia e `semLegenda` cobrindo o vídeo todo (o Guia não tem legenda).

Depois:
- `node ferramentas/conferir-tempos.mjs`: o gate de timing; corrija até sair **APROVADO**;
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;


### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida a ~540 px de largura** e confira de verdade:
- **mapa inteiro:** título legível, 2 a 6 placas na estrada, a pessoa no canto sem cobrir o título; **zoom:** a placa certa, número e título inteiros, nada cortado na esquerda, a pessoa fora do texto;
- **print:** a página certa, sem banner nem tooltip; texto da tela legível (≥ 26 px); a seta aponta **exatamente** o botão ou trecho citado (a ponta é o ponto `x,y`) e aparece na palavra dita; a pílula da seta não cai na cabeça; a pessoa não cobre o ponto;
- **cabeça** da pessoa entre 50% e 70% da altura (ou a miniatura do topo), corpo até a borda de baixo, sem halo claro nas bordas;
- **margens:** nada a menos de 64 px das laterais (`stills.mjs --guias` desenha as linhas laranja da margem), em especial o título e o bloco no zoom da placa, o cartão do print, as setas e a pílula do CTA; rosto e mãos da pessoa dentro do quadro;
- rótulos e textos cabem, nada abaixo da linha da interface; nenhum quadro vazio; pílula do CTA legível por mais de 1,2 s.

Corrija o plano (outro ponto da seta, outro `pessoa`, texto mais curto, outro `em`) e repita até estar limpo (no máximo 2 rodadas).

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-guia.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (quantas pausas viraram corte);
- o **mapa resumido** (que bloco e que imagem entrou em cada trecho);
- de onde vieram as imagens (pasta do usuário ou busca) e o texto de `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que ele pode trocar por uma própria).


## Ritmo e cortes (cortar como editor)

- **Corte pelas pausas reais**, com respiro de 0,1 a 0,2 s (`ferramentas/justar.mjs` faz). A fala é corrida (~220 palavras por minuto): nenhum silêncio acima de 0,3 s.
- **O recorte da pessoa é contínuo.** Quem corta é a tela de trás; por isso o Guia **não** reenquadra nem dá zoom no rosto a cada corte do vídeo. A única "câmera" é o zoom na placa do mapa.
- **O que sai:** silêncio, "é…" longos, tomada repetida (fica a última completa), frase abandonada, comentário depois do fim.
- **O corte da tela cai no meio da frase, na palavra do número ou do botão**, nunca no fim de uma frase.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura 1: roteiro/etapas** | `mapa` (+ `plano.mapa`) | infográfico branco com título, subtítulo em letra de mão e estrada com placas numeradas; um momento sem `foco` mostra tudo (pessoa no canto), um com `foco: n` dá o zoom na placa n (corte seco) |
| **assinatura 2: ação de interface** | `print` | a captura real (recortada no trecho citado) num cartão no topo, dentro das margens, com seta vermelha grossa no ponto (`setas`; a pílula da seta entra na palavra dela, `textoEm`), barra de navegador com o site falado (`endereco`), pílula preta opcional (`rotulo`); a pessoa embaixo ou encolhida no topo |
| abertura | `abertura` | estrela laranja que gira ao entrar e o título enorme, palavra por palavra; `destaque` ganha grifo laranja |
| lista | `topicos` | pílulas pretas com texto branco empilhadas; a da vez fica laranja; `detalhe` em cinza embaixo |
| passos | `passos` | mini estrada vertical com placas numeradas; o traço escuro avança até a da vez |
| número | `numero` | número gigante laranja contando em pt-BR, traço preto que se completa, rótulo embaixo |
| comparação | `comparacao` | dois cartões lado a lado com pílula de rótulo; o vencedor ganha contorno laranja, o outro apaga |
| gráfico | `grafico` | barras pretas (a da vez laranja), linha ou rosca; sem números ditos, uma curva laranja "ilustrativo" |
| destaque | `destaque` | ícone da estrela (quadrado laranja) e a palavra grande acima da cabeça; `alerta` = pílula vermelha |
| definição | `definicao` | o termo numa pílula preta grande e o significado embaixo |
| frase | `frase` | aspas laranja e a frase grande palavra por palavra; `risco` riscado quando dito |
| pergunta | `pergunta` | estrela e a pergunta grande; `opcoes` em pílulas com contorno |
| fechamento | `cta` | pílula rosa-vermelha larga (940 px, dentro das margens) por cima do último print, que fica parado no cartão dele; "Comenta PALAVRA", palavra por palavra |

Campo `pessoa` em qualquer momento: `"dir"`, `"esq"`, `"centro"`, `"topo"` (encolhida no alto, a tela a cobre pela cintura; use com `print`) ou `"borda"` (grande, inclinada, colada na borda direita; use com conteúdo alinhado à esquerda); ou uma lista `[{ "em": 12.4, "pose": "dir" }, …]` para ela pular de lugar durante a mesma tela. Sem o campo, o template alterna sozinho.

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


## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A fala ainda tem pausas longas no vídeo**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: aumente o respiro (`node ferramentas/justar.mjs --respiro 0.22`) ou, só naquele corte, afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **A seta caiu fora do botão:** `x` e `y` são frações do print **inteiro**; releia o print, corrija e confira no quadro.
- **A pessoa cobre o ponto da seta ou o texto:** troque o `pessoa` do momento (`esq`, `dir`, `topo`).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
- **O recorte da pessoa ficou com halo ou cortou cabelo/mão:** a tomada tem parede clara ou pouca luz; rode `node ferramentas/recortar.mjs` de novo só se mudar a tomada, senão avise o usuário. `cortar.mjs` e `recortar.mjs` precisam rodar nessa ordem.
- **`pessoa.webm` não existe:** o render falha. Rode o passo 4b (ou `"recorte": false` no plano).

