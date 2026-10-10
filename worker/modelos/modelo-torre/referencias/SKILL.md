---
name: modelo-torre
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Torre, um lançamento imobiliário à noite em 3D: a pessoa numa moldura com o fundo natural, a virada com uma linha de luz (troca de roupa opcional), a cidade noturna, um prédio que sobe andar por andar no número dito, o mapa que traça a rota dourada até o destino, o mergulho na planta humanizada com os cômodos ditos acesos e a etiqueta de preço dourada que bate na palavra. Feito para corretor e imobiliária (apartamento, casa, sala comercial, terreno), mas serve para qualquer assunto (finanças, cripto, saúde, aulas, histórias): a IA traduz a fala para os blocos do estilo, com modo ilustrativo em que um número vira os andares da torre. Use quando o usuário pedir \"modelo Torre\", \"estilo lançamento\", \"vídeo de imóvel\", \"apresentar um apartamento\", \"vídeo de corretor\" ou quiser uma edição 3D premium pronta para Reels, TikTok ou Shorts. Entrega um MP4 vertical 1080×1920."
---

# Modelo Torre

O vídeo vira o filme de lançamento de um empreendimento, à noite. A pessoa fica sempre numa **moldura com o fundo natural dela**; no começo a moldura é grande e o título nasce por cima da cabeça ("Se eu fosse um **CORRETOR**"). Na virada, uma **linha de luz** desce pela moldura (e troca a roupa, se houver o vídeo trocado). Depois a moldura desce para a metade de baixo e o **mundo 3D** ocupa a de cima: a cidade com as janelas acesas, a **torre que sobe andar por andar** enquanto o contador conta, a cidade que baixa e vira **mapa com a rota dourada** até o destino, o **mergulho na planta humanizada** (traço de arquiteto → paredes → móveis → os cômodos ditos acendem) e a **etiqueta de preço** dourada que desce presa por um fio. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, seguir o rosto, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um corretor de imóveis ("Residencial Aurora, dezoito andares subindo em Pinheiros…"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** nada pula, tudo **se constrói**. Os andares pousam um a um (descem 0,6 u e assentam em 0,3 s, a luz das janelas acende logo depois); um contorno-fantasma da torre e um anel dourado de obra sobem junto. A câmera 3D nunca para: órbita lenta em volta da torre, sobe para o mapa (a cidade baixa em 0,9 s), mergulha no escuro e cai em cima da planta, que inclina enquanto as paredes sobem. A rota se desenha de ponta a ponta com uma cabeça luminosa; o pino cai e solta um anel. A etiqueta de preço desce girando no fio e o número conta até cada pedaço dito. Textos entram subindo por máscara com desfoque (0,3 s) e saem com desfoque. Nenhum giro solto, tremida, flash ou neon.
- **Organização e hierarquia:** começo = **ponte** (moldura grande x 44–1036, y 476–1856; título por cima da cabeça). Depois = **palco** (moldura x 76–1004, y 984–1856; o mundo 3D em cima). No palco: o **nome do empreendimento** no canto de cima à esquerda (vira cabeçalho e fica até o fim), o **selo** no canto direito, a **coluna da esquerda** com o número grande (andares, minutos, m²) + filete dourado + rótulo, e o mundo 3D à direita. Uma ideia por vez.
- **Tipografia:** **Cormorant Garamond 600** só nos números grandes e no nome do empreendimento (texto grande e bem espaçado); **Manrope 700** nos rótulos em caixa alta espaçada (0,3em) e no texto das etiquetas; **Sora 800** nos títulos e na legenda (tracking −0,02em, nunca mais apertado que −0,025em). Nada condensado.
- **Moldura da pessoa:** sempre numa moldura de cantos arredondados (46–48 px), filete champanhe fino e sombra suave, com o **fundo natural** (nada de recorte serrilhado, nada de brilho atrás dela, a cor do vídeo nunca muda). O rosto no eixo central, seguido quadro a quadro; a cada corte do vídeo o enquadramento alterna (100% ↔ 108%) e empurra 1,6% devagar dentro do trecho. Gravação de muito perto não aproxima: o rosto desce na moldura para a cabeça caber inteira.
- **Cores, textura e som:** azul-noite e grafite (#070C17, #0E1729), marfim no texto (#F5F0E6), **um** acento champanhe (#D9BE8A / #F1DFB6) em filetes, pinos, rota e etiquetas; coral queimado (#E58A6E) só para alerta. Legenda toda branca com contorno preto e sombra leve (sem palavra colorida). Sons tonais, raros e baixos: cristal na virada, a obra que sobe, o pino que soa, o mergulho, as paredes, a seleção dos cômodos, a etiqueta que assenta e o "hall" no preço. Música só se o usuário mandar a dele (`trilha`), sem batida.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres, de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e de **placa de vídeo** (o mundo 3D é WebGL; qualquer Mac com Apple Silicon ou PC com GPU serve). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo e pergunte uma vez:
   - **nome e área** de quem fala (ex.: "Rafael Moura" / "Corretor de imóveis"): vão na tarja do começo. Sem resposta, siga sem tarja;
   - se ele tem o **vídeo da virada** (a mesma gravação com a roupa ou o cenário trocado por uma IA de vídeo; veja "A virada"). É opcional.
   Os dados do imóvel (nome, andares, bairro, distâncias, metragem, cômodos, preço) vêm **da fala**: não pergunte o que ele não disse e não ponha na tela o que não foi dito.

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
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica.

O ritmo é de apresentação de lançamento: respiro de 0,2 a 0,4 s entre as frases. O `cortar.mjs` junta trechos com menos de 0,3 s entre eles (mantendo a pausa original) e corta o resto. Para apertar uma pausa, mexa no `ate` do trecho de antes e no `de` do de depois, deixando **pelo menos 0,31 s cortados** entre eles.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo** (`modelo.json` fixa a gravação vertical em 9:16; a pessoa fica sempre numa moldura). Refazendo o corte depois de já ter planejado, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo: a moldura acompanha quando a pessoa se mexe.

### 4b. Corrigir as palavras

Abra `src/plano.json` → `palavras` (o mesmo que `work/palavras.json`) e corrija o que a transcrição errou, **no lugar certo da lista**: números e preços (a transcrição escreve "18" ou "R$ 1,1 milhão" no lugar de "dezoito" e "um milhão e cem": troque pelo que foi dito, com os tempos de cada palavra), nomes do empreendimento, bairros e ruas; apague palavras inventadas no silêncio. Os andares, a rota, os cômodos e o preço entram nessas palavras.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto, com a cabeça inteira dentro da moldura; a linha rosa é o topo da moldura de baixo (y 984); a linha amarela é o centro da legenda; o retângulo verde é a área dos blocos no palco; nada importante fora das linhas vermelhas (interface do app e margens de 64 px). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Num vídeo de imóvel, procure:
- a **pergunta ou gancho** do começo → `abertura` com `destaque` (na ponte, por cima da cabeça);
- o **nome do empreendimento** e o **número que o descreve** (andares, torres, unidades) → `torre` (com `nome`, `categoria`, `local`);
- **onde fica** (bairro, minutos até o metrô, a escola, o parque, a praia) → `rota`;
- **por dentro** (metragem, quartos, suítes, varanda, vagas, quintal, piscina) → `planta`;
- o **preço** ("a partir de…") → `preco`;
- o **pedido** (chama no direct, link na bio, agende a visita) → `cta`.

Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura entra pelo menos uma vez**, e a conferência pede pelo menos dois efeitos próprios (`torre`, `rota`, `planta`, `preco`) em vídeos de mais de 20 s.

- **Casa, sala comercial, terreno:** `planta.forma` = `casa` (com garagem, quintal e piscina), `sala` (mesas, sala de reunião, diretoria, recepção, copa) ou `terreno` (o lote em quatro áreas com as cotas douradas). Casa térrea ou sobrado: `torre` com `valor: 2`, `rotulo: "andares"` não fica bem; prefira começar pela `rota` ou pela `planta`. Sala comercial em prédio: `torre` com `fachada: "comercial"` e `andarDestaque` no andar dito.
- **Sem dado do imóvel na fala**: não invente. Sem preço dito, sem etiqueta; sem metragem dita, a planta entra sem a contagem de m².
- **Um vídeo de outro assunto** (finanças, saúde, história): veja "A assinatura em qualquer assunto".

### 6c. A virada (opcional)

No exemplo, a roupa muda ao vivo quando a linha de luz desce pela moldura. O aluno pode fazer o mesmo sem ferramenta especial do modelo:

1. Gere, em qualquer IA de vídeo que edite um vídeo existente (troca de roupa ou de cenário a partir de uma imagem de referência), **a mesma gravação já cortada** (`public/base.mp4`) com a roupa nova. Mostre ao usuário uma imagem da roupa antes de gastar créditos.
2. Confira que a boca continua sincronizada e que o rosto ficou no mesmo lugar e do mesmo tamanho (a IA às vezes afasta a câmera). Se não ficou, não use.
3. Ponha o arquivo em `public/` (ex.: `public/virada.mp4`) e no plano: `"virada": { "em": <instante>, "video": "virada.mp4" }`. Depois da linha, a pessoa aparece com a roupa nova; a voz continua vindo do vídeo principal.

**Sem o vídeo trocado**, use `"virada": { "em": <instante> }`: a cidade fica apagada até a linha passar e acende de cima para baixo, e a moldura ganha o filete dourado. A pessoa não muda. O bom instante é a palavra que apresenta o assunto ("Esse é o…", "Olha isso").

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `virada`, `posicaoLegenda`, `momentos`, `semLegenda` e `correcoes`. Cada andar, minuto, cômodo e preço entra no `em` da palavra, tirado de `palavras`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: o **timing gate**. Cada `em` precisa cair a ±0,15 s do começo de uma palavra dita; corrija até sair **APROVADO**;
- `node scripts/legendas.mjs`: lista as linhas de legenda (que só aparecem nos momentos com `legenda: true`; no exemplo, todos têm).

**O fim do vídeo**: o vídeo termina ~0,3 s depois da última palavra: ponha em `duracao` (e no `ate` do último momento) o fim da última palavra + 0,3 s.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros **reduzidos à largura de um celular (~540 px)** e confira de verdade (peça também quadros nas trocas de bloco, 0,1 s depois de cada uma):
- o primeiro quadro já tem a cidade à noite atrás da moldura e o título entrando?
- a torre termina de subir na palavra certa e o contador mostra **o número dito** no fim?
- a rota chega ao destino na palavra do destino; os nomes de rua (se houver) foram ditos ou pedidos?
- os cômodos que acendem são os ditos, e o m² só aparece se foi dito?
- a etiqueta de preço mostra **o valor dito** e cabe inteira?
- nada da coluna da esquerda encosta no mundo 3D; nenhuma etiqueta cai em cima da legenda;
- legenda abaixo do queixo (ou na costura), sem juntar duas frases; nada encostado nas margens; nada importante abaixo de y 1700;
- a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-torre.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho) e o maior desvio do timing gate;
- o que é ilustrativo (o prédio, o mapa e a planta são **ilustrações**, não o imóvel real; o selo diz isso);
- o que o usuário deve conferir (o preço, a metragem, o nome do empreendimento, o tempo até o destino).

## Blocos deste modelo

Na ponte (começo), os blocos de texto ficam por cima da cabeça; no palco, na metade de cima, com o mundo 3D desfocado atrás (a câmera continua em órbita lenta).

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | a linha pequena ("Se eu fosse um") sobe, o `destaque` entra letra a letra em Sora 800 champanhe, grande, e o resto vem embaixo em caixa alta espaçada; sem `destaque`, a frase inteira em Sora 800 marfim, palavra por palavra. Sai com desfoque |
| lista | `topicos` | etiquetas de vidro-noite com borda champanhe (as mesmas dos cômodos), uma por item, com um losango dourado; a da vez fica cheia |
| passos | `passos` | o mapa: a rota dourada passa por paradas numeradas na ordem dita; a coluna da esquerda lista 01, 02, 03 e acende o passo da vez |
| número | `numero` | o número grande em serifa conta na coluna da esquerda, com o filete dourado e o rótulo em caixa alta; "• ilustrativo" quando for |
| comparação | `comparacao` | duas fichas de vidro lado a lado com um "×" (ou "→" em antes-depois) no meio; a vencedora ganha o filete dourado grosso e o selo ✓, a outra esmaece; em errado-certo o lado errado usa o coral |
| gráfico | `grafico` | `barras` = prédios com janelas acesas que sobem andar por andar até o valor; `linha` = a linha dourada com pontos; `pizza` = um anel em tons de champanhe; sem números ditos, um horizonte de prédios com a linha da tendência e "• ilustrativo" |
| destaque | `destaque` | a frase curta grande em Sora 800 (marfim; coral em `alerta`) com o filete que se desenha embaixo |
| definição | `definicao` | o termo grande em serifa, o filete dourado e o significado em Manrope |
| frase | `frase` | Sora 700 palavra por palavra com a aspa grande em serifa; `destaque` em champanhe; `risco` = o traço dourado que corta o trecho |
| pergunta | `pergunta` | a pergunta palavra por palavra com o filete; as `opcoes` viram etiquetas A, B, C |
| fechamento | `cta` | a etiqueta dourada (a mesma do preço) desce no fio com o ícone (salvar, seguir, comentar, link) e o pedido palavra por palavra |
| **assinatura** | `torre` | o prédio de lançamento sobe andar por andar na fala; o contador conta 01 → valor; o nome do empreendimento nasce grande e vira cabeçalho; `local` com o pino; `andarDestaque` acende um andar |
| assinatura | `rota` | a cidade baixa e vira mapa; o pino cai no prédio; a rota dourada sai da portaria e chega no destino (ícone: metrô, ônibus, escola, parque, mercado, praia, hospital, shopping ou pino); "4 min · a pé · do metrô" na coluna |
| assinatura | `planta` | mergulho no escuro → a planta humanizada: o traço se desenha, as paredes sobem enquanto a área conta, os móveis pousam, os cômodos ditos acendem com a etiqueta (nome + m² se dito); `forma`: apartamento, casa, sala, terreno |
| assinatura | `preco` | a etiqueta de preço dourada desce presa por um fio e o valor conta até cada pedaço dito; o palco escurece atrás |

## A assinatura em qualquer assunto

A torre é **"um número que se constrói"**: qualquer valor dito (um preço, uma meta, uma quantidade) vira andares que sobem até ele. A rota é **"o caminho até um lugar"** (as etapas até um resultado). A planta é **"o que tem dentro"** (as partes de um todo, cada uma acendendo). A etiqueta é **"quanto custa"** (ou qualquer valor que fecha o argumento).

1. **Finanças/cripto.** "O Bitcoin rompeu os oitenta e três mil dólares… Eu gravei uma aula para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos."
   `torre` com `valor: 83`, `sufixo: "mil"`, `rotulo: "dólares"`, `andares: 24`, `nome: "Bitcoin"`, `ilustrativo: true` e `selo: "ilustrativo"`: o prédio sobe enquanto o contador vai a 83. Depois `rota` com `titulo: "Aula gratuita"`, `paradas` "O mercado" e "Os riscos" e `destino` "A escolha dos ativos" (ícone `pino`): o caminho da aula no mapa.
2. **Saúde ou rotina.** "Eu baixei meu colesterol de duzentos e quarenta para cento e oitenta em quatro meses: caminhada todo dia, menos fritura e mais fibra."
   `grafico` com `barras` (240 → 180: os prédios baixam de altura), depois `rota` com `tempo: { valor: 4, unidade: "meses" }`, `paradas` "Caminhada", "Menos fritura" e `destino` "Mais fibra" (ícone `parque`).
3. **Algo bem distante (carreira, história pessoal).** "Em dez anos eu passei por quatro empresas. Dentro da minha rotina hoje tem: estudo, família e treino. E o preço disso foi um salário menor no começo."
   `torre` com `valor: 10`, `rotulo: "anos"` e `andarDestaque` no 4º andar ("4 empresas"); `planta` com `forma: "casa"` e `comodos` "Estudo" (`escritorio`), "Família" (`sala`) e "Treino" (`quintal`); `frase` com `risco` em "salário menor" (sem `preco`: nenhum valor foi dito).

Sem número, lugar nem partes na fala? Procure **o que se constrói** (algo que cresce, acumula, sobe) e use a `torre` em modo ilustrativo com o número de itens ditos (`valor: 3`, `rotulo: "passos"`), ou a `rota` com os passos ditos como paradas.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("a quatro minutos a pé do metrô" vira "4 min · a pé · do metrô").
- **Nunca mostre um número que não foi dito**: andares, minutos, m² (do imóvel ou de um cômodo) e preço só se foram ditos. A etiqueta conta até o valor (os números de passagem fazem parte da contagem).
- O prédio, o mapa e a planta são **ilustrações** do tipo de imóvel, não o imóvel real: deixe o `selo` ("imóvel ilustrativo") quando o corretor não mandar as imagens reais. Nome de rua só se foi dito ou o usuário pediu.
- **Nenhuma marca real na tela**: nada de logo de construtora, banco, aplicativo ou rede social. "Chama no WhatsApp" vira "Chama no direct" com o ícone genérico de conversa.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Se ele pedir "dois efeitos próprios", acrescente uma `rota` (onde fica, ou o caminho), uma `planta` (o que tem dentro) ou um `preco` (o valor dito). Não use `--forcar`.
- **Timing gate fora**: a palavra em `palavras` está errada (corrija no passo 4b) ou o `em` está noutra palavra.
- **O render ou os quadros param com "Error creating WebGL context"**: o computador não deu a placa de vídeo ao navegador do render. Confira se `modelo.json` ainda tem `"gl": "angle"` (não apague); no Linux sem GPU, troque por `"gl": "swangle"` (mais lento).
- **O rosto fica grande demais na moldura**: a gravação foi feita muito perto. O modelo já não aproxima; se ainda assim a cabeça encosta no topo, use `posicaoLegenda: "costura"` e peça uma gravação mais afastada da próxima vez.
- **O nome do empreendimento não cabe**: ele reduz sozinho até caber numa linha; encurte para o nome falado (sem "Residencial", que vai em `categoria`).
- **A rota cruza o rótulo do destino ou as paradas se embolam**: até 4 paradas; com mais, use `topicos`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
