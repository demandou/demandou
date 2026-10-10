---
name: modelo-criativo
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Criativo, o anúncio de performance para Meta Ads e TikTok Ads: gancho já montado no primeiro quadro, produto herói num cartão de vidro com profundidade, cada benefício na palavra com a prova visual literal, selos de oferta, botão de chamada abaixo da legenda e legenda sempre ligada, tudo dentro da zona segura do Ads. Gera VARIANTES DE GANCHO: grave 2 ou 3 ganchos e o corpo, e sai um MP4 por gancho para testar no gerenciador de anúncios. Serve para qualquer produto ou assunto (o exemplo é uma garrafa térmica, mas funciona com cursos, serviços, apps, finanças, saúde, lojas): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Criativo\", \"criativo para anúncio\", \"anúncio para Meta, Instagram ou TikTok Ads\", \"vídeo de tráfego pago\", \"testar ganchos\" ou \"variações de gancho\". Entrega MP4 vertical 1080×1920."
---

# Modelo Criativo

O vídeo vira um anúncio de performance: a pessoa em quadro cheio, como um vídeo de criador; a **legenda sempre ligada** logo abaixo do queixo; embaixo dela, na altura do peito, um **palco de vidro** onde entram o gancho (já montado no primeiro quadro), o **produto herói** num cartão de vidro com profundidade, a **prova de cada benefício** na palavra que o nomeia e os **selos** da oferta; no fim, o **botão de chamada** logo abaixo da legenda, com o toque do dedo. E o mesmo vídeo sai em **2 ou 3 versões, uma por gancho**, para testar no Ads. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, montar as variantes, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, preparar as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma garrafa térmica, mas o vídeo do usuário pode vender qualquer coisa (curso, consultoria, app, clínica, loja, imóvel) ou nem vender produto físico. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` e o `variantes.mjs` recusam.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** ritmo de anúncio. O **primeiro quadro já está montado** (legenda + gancho no palco): nada de tela que vai se construindo. Os cartões de vidro entram subindo de leve e endireitando a perspectiva (0,42 s, um leve passar do ponto), com um brilho que atravessa o vidro; o produto herói **aproxima devagar** (o produto mais rápido que o cartão, parece estar na frente) e balança 2°. Provas seguidas mantêm o mesmo cartão: a foto nova **passa por cima da anterior** com uma cortina e um fio de luz. O número da prova bate **já no valor dito**, na palavra, num selo redondo com o anel enchendo; o selo de oferta **carimba** e o anel dele gira devagar; o botão pulsa a cada 1,2 s e leva um toque de dedo. A câmera troca de escala em corte seco a cada tomada (100% ↔ 107%), aproxima 1,5% devagar e dá um soco de 4% nas palavras de impacto. Algo muda a cada 1,5–2,5 s.
- **Organização e hierarquia:** quatro lugares fixos, sempre os mesmos: a **pessoa** em quadro cheio (rosto no eixo do meio); a **legenda** logo abaixo do queixo; o **botão** logo abaixo da legenda (no fechamento); o **palco** do peito, da legenda até a base segura (y ~945 a 1632, x 64 a 1016), com um cartão por vez. Uma ideia por cartão: a foto (ou o produto) grande e a frase curta do benefício numa faixa embaixo. **Zona segura do Ads:** nada importante nos 10% de cima (192 px) nem nos 14% de baixo (a partir de 1651 px); margem lateral de 64 px.
- **Tipografia:** uma família só, **Sora** (Google Fonts), grande e limpa: 800 na legenda (58 px), manchete do gancho (50–88), faixa do benefício (40–60), números, botão (56) e títulos; 700 nas etiquetas; 600 em detalhes. Tracking −0,022em no 800. Nada condensado, nada com contorno.
- **Moldura da pessoa:** sempre quadro cheio, com o rosto onde foi gravado e seguido quadro a quadro (`VideoNaCaixa` com `rosto={plano.rosto}`). Os cartões ficam por cima do peito (nunca do rosto). Um cartão de perfil com nome (até 46 px) e área no canto de cima à esquerda, ao lado da cabeça, nos primeiros ~3 s (opcional). Nunca coluna lateral, nunca janela.
- **Cores, textura e som:** **vidro**: placas de vidro fumê (texto branco) e cartões de vidro claro com espessura (produto e fotos), com desfoque do fundo, borda clara e brilho no canto. **Um destaque**: laranja-sinal (#FF6A13) ou **a cor da marca do produto** (`plano.cor`), no botão, nos selos, nos ✓, nos números e nas palavras-chave; o texto em cima do destaque escolhe sozinho tinta ou branco pelo contraste. Coral (#FF4057) só no ✗. Não mexa na cor da pessoa: nada de brilho, halo ou luz atrás dela. Sons tonais, raros e baixos: um "pop" grave nos cartões, uma nota de marimba por prova, um toque no número, duas notas no selo, uma virada na foto que encolhe.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo e pergunte uma vez, numa mensagem só:
   - **quantos ganchos** ele gravou e em que ordem (veja "Como gravar", abaixo);
   - **fotos do produto**: uma foto do produto sozinho (de preferência com fundo liso, para recortar) e fotos dele **nas situações que a fala cita** (o produto em uso, o resultado, a tela do app, o certificado). Vão numa pasta `imagens/` dentro do projeto;
   - **a cor da marca** (hexadecimal, ex.: `#1E88FF`), se quiser que o destaque seja a cor do produto;
   - **nome e área** de quem fala (ex.: "Rafael Duarte" / "Corredor"), para a tarja pequena do começo. Sem resposta, siga sem tarja e com o laranja-sinal.

### Como gravar (ensine isto ao usuário quando ele ainda vai gravar)

- **Grave 2 ou 3 ganchos diferentes, um depois do outro, e depois o corpo uma vez só.** Ex.: "Para de comprar garrafa que não segura o gelo." / "Deixei essa garrafa no carro fechado, no sol, o dia inteiro." / "Essa é a garrafa que vai comigo em todo treino." / e o corpo: os benefícios + a chamada ("clica em saiba mais…").
- Cada gancho é **uma frase completa de 2 a 4 s** que funciona sozinha emendada no corpo. Ganchos de tipos diferentes testam melhor: um de **problema** ("Para de…"), um de **prova/história** ("Deixei… o dia inteiro"), um de **identidade/desejo** ("Essa é a que vai comigo…").
- O corpo começa com uma frase que serve depois de qualquer gancho ("Ela mantém…", "Ele faz…"), cita **cada benefício com a situação** ("não vaza na mochila") e termina na chamada com a oferta ("frete grátis", "desconto", "garantia").
- Pode ser um arquivo só ou vários; com vários, junte na ordem antes de começar (`ffmpeg -f concat`) ou peça para o usuário juntar.
- **Por que 3 ganchos:** os primeiros 2–3 s decidem se a pessoa fica. O vídeo sai em um MP4 por gancho (mesmo corpo), e ele sobe os 3 no mesmo conjunto de anúncios para o Ads mostrar qual segura mais gente (taxa de retenção de 3 s, CTR, custo por resultado). Depois de uns dias, fica o vencedor e grava ganchos novos contra ele.

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-anuncio>/`, e rode `npm install` dentro dela.

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

**Os ganchos não são tomadas repetidas:** são frases diferentes de propósito. Mantenha todos, na ordem, e o corpo depois deles. Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas do mesmo corpo** (com conteúdo diferente): pergunte ao usuário qual fica.

Anúncio é seco: as pausas viram cortes (mantenha a proposta do `preparar`), e cada corte ganha um salto de escala.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo** (`modelo.json` fixa a gravação vertical em 9:16; a pessoa fica em quadro cheio). Refazendo o corte depois de já ter planejado, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo.

Abra `src/plano.json` → `palavras` e corrija o que a transcrição errou (nome do produto, números, a chamada: "Clique" quando ele disse "Clica"). Para nomes na legenda, use `correcoes`.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto; a linha amarela (centro da legenda) logo abaixo do queixo; a rosa é o centro do botão; o retângulo verde é o palco (do peito até a base segura); as linhas vermelhas são a zona segura do Ads (10% de cima, 14% de baixo) e as margens de 64 px. Se o queixo ficou em cima da legenda, refaça o passo 4 com o queixo certo.

### 6. Mapa editorial (gancho por gancho, e o corpo)

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`:

- **Onde está cada gancho e o corpo** no vídeo cortado (o `de` e o `ate` de cada um, na pausa entre as frases). Isso vai em `variantes` no plano.
- **Cada gancho** ganha um bloco que já está **montado no primeiro quadro** daquele gancho: `gancho` (manchete na placa de vidro, com ou sem foto, foto em tela cheia que encolhe) ou `heroi` (o produto). Um tipo diferente por gancho mostra melhor a diferença no teste.
- **O corpo**: cada benefício vira uma `prova` na palavra que o nomeia (a foto do produto naquela situação + a faixa ✓ com o benefício + o número, se foi dito); a oferta ("frete grátis", "garantia de 7 dias", "20% de desconto") vira um `selo`; a chamada vira o `cta` (botão com o que foi dito: "Saiba mais", "Compre agora", "Chama no direct").
- Trechos sem produto nem prova (contexto, problema, explicação) usam os blocos universais na tabela abaixo.

**A assinatura (`heroi` ou `prova`) entra pelo menos uma vez** — normalmente as duas.

### 6b. Imagens

Leia `references/imagens.md`. Neste modelo a imagem é **a prova**: ela mostra literalmente o que a pessoa diz, com **o mesmo produto** em todas.

1. **Fotos do usuário primeiro** (pasta `imagens/`): o produto sozinho e o produto em cada situação citada. São as melhores provas (é o produto de verdade).
2. **Sem fotos e com um gerador de imagens** (Magnific, Nano Banana, outro): gere primeiro o produto sozinho num fundo liso, **sem texto e sem logo**; depois, **usando essa primeira imagem como referência**, gere as situações (de preferência numa imagem só em grade 2×2, com fotos **deitadas** 4:3, o produto inteiro e no centro de cada uma) e recorte cada quadro. Recorte o fundo do produto sozinho (PNG transparente) para o `heroi`. **Nunca** gere a pessoa nem uma marca real.
3. **Sem fotos e sem gerador**: o `imagens.mjs` busca fotos livres da situação (Wikimedia/Openverse), ou use o **modo ilustrativo** (`icone` no lugar de `imagem`: um bloco de vidro 3D com o ícone). Foto de banco que "mais ou menos" combina não serve: melhor o ícone.
4. Registre cada imagem em `plano.imagens` (o `imagens.mjs --escolher` faz isso; para um arquivo já pronto em `public/img/`, à mão: `"garrafa": { "arquivo": "img/garrafa.png", "largura": 412, "altura": 1100, "transparente": true }`, `"gelo": { "arquivo": "img/gelo.jpg", "largura": 1185, "altura": 881, "foco": { "x": 0.4, "y": 0.5 } }`). O cartão da prova é deitado (~924×650): use fotos deitadas, ou marque o `foco` no produto.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, as variantes, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `cor`, `variantes`, `momentos`, `semLegenda` e `correcoes`. Cada foto, faixa, número, selo e o botão entram no `em` da palavra que os nomeia.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele. O aviso "três `prova` seguidos" é normal quando a fala lista benefícios em sequência;
- `node ferramentas/timing.mjs`: o **timing gate** (±0,15 s de cada palavra). Corrija até sair **APROVADO**; "confira no quadro" = o texto da tela não é a palavra dita, olhe o quadro no passo 8;
- `node scripts-modelo/variantes.mjs --conferir`: monta um plano por gancho (`out/variantes/plano-A.json`…) e confere cada um. Todos precisam sair **APROVADO**;
- `node scripts/legendas.mjs`: as linhas de legenda (ela fica sempre ligada).

### 8. Conferir os quadros

Os quadros que importam são os das variantes (é o que vai para o Ads):

```bash
node scripts-modelo/variantes.mjs --stills A 0 1.5 4 8
node scripts-modelo/variantes.mjs --stills B 0
node scripts-modelo/variantes.mjs --stills C 0
```

Abra os quadros (em `out/variantes/stills/`) **reduzidos à largura de um celular (~540 px)** e confira de verdade:
- o **quadro 0 de cada variante** já mostra o gancho montado (legenda + cartão), sem tela vazia?
- cada foto mostra **o que está sendo dito naquele instante**, com o mesmo produto, sem texto, logo ou marca? A faixa do benefício cabe e se lê em 1 s?
- o número aparece **só se foi dito**, e já no valor dito na palavra?
- a manchete do gancho é a ideia-chave curta (não repete a legenda palavra por palavra)? Nenhum cartão aparece vazio esperando o texto?
- a legenda está abaixo do queixo e nunca em cima da borda de um cartão; o botão logo abaixo dela, sem cobrir o rosto?
- nada importante acima de y 192 nem abaixo de y 1651, nada a menos de 64 px das laterais?
- nas trocas de cartão (gere quadros a cada 0,04 s em volta), nenhum quadro com dois cartões embolados nem texto sobre texto?
- a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo (no máximo 2 rodadas de 8 quadros).

### 9. Renderizar e entregar

```bash
node scripts-modelo/variantes.mjs --nome "<produto>"
```

Ele confere de novo, renderiza **um MP4 por gancho** (`out/<produto> - gancho A.mp4`, `… B`, `… C`) e normaliza o áudio a −14 LUFS. Cada variante termina ~0,3 s depois da última palavra. (`node scripts/render.mjs` renderiza o plano principal, com todos os ganchos seguidos: serve só para conferência.)

Entregue:
- os caminhos dos MP4 e a duração de cada um;
- o **mapa resumido** (que bloco entrou em cada trecho) e o maior desvio do timing gate;
- as **imagens usadas** e de onde vieram;
- **como testar no Ads**: os 3 MP4 no mesmo conjunto de anúncios, mesma copy e mesmo público; depois de alguns dias, comparar retenção de 3 s, CTR e custo por resultado e ficar com o gancho vencedor;
- o que é ilustrativo e o que o usuário deve conferir (o preço, a oferta, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

Tudo acontece **no palco** (o peito, abaixo da legenda), em vidro; a pessoa fica em quadro cheio o tempo todo e a legenda nunca some.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `gancho`) | a manchete numa placa de vidro fumê no peito, já montada no 1º quadro; as palavras acendem na fala e o `destaque` vira a cor da marca com um traço embaixo |
| lista | `topicos` | placa fumê com uma linha por item, cada uma com o ✓ na cor da marca, entrando no seu `em` (lista de benefícios) |
| passos | `passos` | a mesma placa com discos numerados ligados por um traço que desce até o passo da vez (como funciona, como comprar) |
| número | `numero` | o número enorme na cor da marca numa placa fumê (conta rápido, 0,45 s, a partir da palavra), o rótulo assentando embaixo; com `imagem`, a foto em cima |
| comparação | `comparacao` | dois cartões de vidro claro lado a lado ("comum × este", "antes × depois"); o vencedor ganha a borda da marca e o ✓, o outro fica cinza |
| gráfico | `grafico` | cartão claro com barras, linha ou rosca na cor da marca; sem números ditos, a curva da tendência com "ilustrativo" |
| destaque | `destaque` | um adesivo grande na cor da marca, levemente inclinado, que carimba (`chave`), ou placa fumê com ⚠ coral (`alerta`) |
| definição | `definicao` | cartão claro: o termo grande com o traço da marca, o significado subindo na fala |
| frase | `frase` | a placa da manchete, palavra por palavra; `risco` riscado em coral |
| pergunta | `pergunta` | placa fumê com a pergunta; as `opcoes` entram como pílulas claras, a da vez na cor da marca |
| fechamento | `cta` | o **botão** (pílula na cor da marca, "Saiba mais ↓" ou o que foi dito) logo abaixo da legenda, pulsando, com o toque do dedo; no palco, o cartão final com o produto e o título |
| **assinatura** | `heroi` | o produto recortado num cartão de vidro claro com espessura, inclinado em perspectiva, passando da borda de cima e aproximando devagar; título ao lado, etiquetas embaixo; sem foto, um bloco de vidro 3D com o ícone |
| **assinatura** | `prova` | a foto do produto na situação dita num cartão de vidro, a faixa ✓ com o benefício, o selo redondo do número; provas seguidas trocam só a foto (cortina); `telaCheia` começa cobrindo a tela e encolhe para o cartão |
| próprio | `gancho` | a manchete do gancho no 1º quadro da variante, com foto opcional (no cartão ou em tela cheia que encolhe) e um adesivo de ícone na palavra |
| próprio | `selo` | o adesivo redondo da oferta ("Frete grátis", "7 dias de garantia") que carimba no canto do cartão da vez e gira devagar |

## A assinatura em qualquer assunto

O `heroi` é **"isto é o que eu estou oferecendo"** (o objeto, o curso, o serviço, o app, o resultado) e a `prova` é **"isto é verdade, olha"** (cada promessa com a imagem que a demonstra). Toda venda tem as duas, mesmo sem produto físico: o herói pode ser a capa do curso, a tela do app, o consultório; a prova pode ser o print do resultado, o antes e depois, o certificado, o ícone no modo ilustrativo.

1. **Finanças/cripto (aula gratuita).** "Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Toca aqui em Saiba Mais."
   `heroi` com `icone: "play"` (modo ilustrativo) ou a capa da aula, `titulo: "Aula gratuita"`, `destaque: "gratuita"`, `etiquetas` "o mercado", "os riscos", "a escolha dos ativos" nas palavras; `selo` "Sem promessa de lucro" com `icone: "garantia"`; antes, `prova` com `nivel: "contra"` e `icone: "cifrao"` para "mercado subindo não significa dinheiro no bolso". `cta` "Saiba mais" com `titulo: "Assiste essa aula agora"`. Nenhum número de lucro.
2. **Saúde (clínica de fisioterapia).** "Dor nas costas de quem trabalha sentado? Em quatro sessões você já sente diferença. Primeira avaliação grátis, agenda pelo link."
   `gancho` "Dor nas costas de quem trabalha sentado?" com a foto de alguém na cadeira de escritório (do usuário); `prova` com a foto da sessão e `numero` 4 (`sufixo: "sessões"`); `selo` "Avaliação grátis"; `cta` "Agenda pelo link" com a foto da clínica.
3. **Algo bem distante (fotógrafo de casamento).** "Seu casamento merece mais que fotos no celular. Eu entrego o álbum em trinta dias, com todas as fotos tratadas. Chama no direct."
   `heroi` com a foto do álbum aberto, `titulo: "Álbum em 30 dias"`; `prova` com uma foto tratada do portfólio dele ("todas as fotos tratadas"); `comparacao` "foto de celular × foto tratada" se ele contrastar; `cta` "Chama no direct" com `icone: "comentar"`.

Sem produto nenhum na fala (só opinião, só história)? O herói é **o que a pessoa oferece no fim** (o perfil, a aula, a lista, o próximo vídeo) e a prova é **o exemplo concreto** que ela cita; quando não há imagem, `icone` (modo ilustrativo). Toda edição tem um `heroi` ou uma `prova`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("mantém a água gelada por vinte e quatro horas" vira "Mantém a água gelada" + o selo "24 horas").
- **Nunca mostre um número, preço, prazo ou oferta que não foi dito**: nada de "−50%", "só hoje", estrelas de avaliação ou contador de estoque inventados. Anúncio com promessa falsa é reprovado pela plataforma.
- A prova mostra **o produto do usuário** (ou uma imagem gerada claramente do mesmo produto, sem marca); nunca a marca de outra empresa, pessoa real, print falso ou depoimento inventado.
- Número ilustrativo só onde o bloco permite (`ilustrativo: true`), com a etiqueta visível.

## Quando algo dá errado

- **`conferir.mjs` ou `variantes.mjs --conferir` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Uma variante curta (< 15 s) não precisa da assinatura, mas o plano principal precisa. Não use `--forcar`.
- **A variante começa com silêncio ou com o fim de outro gancho**: o `de`/`ate` do gancho em `variantes` está fora da pausa entre as frases. Ajuste e rode `variantes.mjs --conferir` de novo (ele começa ~0,1 s antes da primeira palavra do gancho).
- **Timing gate fora**: a palavra em `palavras` está errada (o Whisper às vezes marca uma palavra com consoante surda ~0,15 s cedo: meça no áudio) ou o `em` está noutra palavra.
- **O produto ficou cortado no cartão da prova**: a foto é em pé e o cartão é deitado. Use uma foto deitada, mude o `foco` para o produto, ou use `telaCheia` (a foto em pé cobre a tela e encolhe).
- **A faixa do benefício ficou pequena**: o texto passou de ~32 caracteres; encurte com as palavras da fala.
- **O recorte do produto tem borda ou sombra do fundo**: refaça a remoção de fundo ou use a foto inteira no `heroi` (sem `transparente`).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
