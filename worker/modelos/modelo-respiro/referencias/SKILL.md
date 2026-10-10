---
name: modelo-respiro
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Respiro: calma de diário em papel pêssego, a pessoa numa janela em arco que respira junto e troca de lugar devagar, uma forma macia de damasco que enche, fica cheia e esvazia no ritmo da fala (com anel de contagem ou palavras marcadas), notas escritas à mão, listas com bolinhas que respiram, números que contam dentro da forma, trocas lentas e líquidas. Serve para qualquer assunto (o exemplo do modelo é uma respiração 4-7-8 de psicólogo, mas funciona com finanças e cripto, mecânica, carreira, saúde, vendas, histórias, aulas…): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar 'no modelo Respiro', 'estilo calmo', 'estilo diário', e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920 feito com Remotion."
---

# Modelo Respiro

Transforma uma gravação bruta (uma pessoa falando para a câmera) num vídeo vertical editado no estilo Respiro: a tela vira a página de um diário em papel pêssego e a pessoa fica numa **janela em arco** que cresce e encolhe devagar, como quem respira. Quando ela ensina uma respiração, uma **forma macia** de damasco enche na inspiração, fica cheia na pausa e esvazia na expiração, com a contagem 1, 2, 3… marcada no ritmo da fala; a janela troca de lugar a cada fase, devagar, e as notas aparecem escritas à mão. A calma vem do ritmo, não da imobilidade: alguma coisa sempre se move. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, renderizar); você faz a parte de editor (escolher as tomadas, decidir o que vira forma, contagem ou nota, marcar cada coisa no tempo da fala, conferir o resultado).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma respiração guiada, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo entra devagar e assenta, como um expirar. A janela da pessoa e a forma crescem e encolhem como um peito; o texto se escreve palavra por palavra na fala; as trocas de lugar levam ~1,1 s e são líquidas (o que sai cruza com o que entra). Sem quique, sem flash. A calma vem do ritmo: algo sempre se move, nada fica parado mais de ~2,5 s.
- **Organização e hierarquia:** uma página de diário. Um título em serifada e o resto em escrita à mão, menor; listas são linhas com bolinhas de damasco que enchem quando o item é dito; passos são estações numeradas ligadas por uma linha a lápis; o que ainda vai ser dito já aparece a lápis. A ideia principal fica dentro ou ao lado da forma.
- **Tipografia:** Newsreader (serifada macia) para títulos, números e legenda; Caveat (à mão, legível) para notas e itens. Nada condensado. Textos são medidos e encolhem até um mínimo legível.
- **Moldura da pessoa:** sempre numa janela em arco com moldura a lápis, que muda de tamanho e de lugar a cada bloco (grande em cima, com o texto no papel embaixo; à esquerda ou à direita com a forma grande; embaixo; no centro). Nunca numa coluna estreita; o rosto sempre inteiro.
- **Cores, textura e som:** papel pêssego `#F4E4D6`, forma em três tons chapados de damasco, tinta de cacau `#3C2A2B`, grifo `#F0B997`, lápis `#C2A595`. Sem brilho nem degradê. Som raro e tonal: sobe quando enche, desce quando esvazia.

## Antes de começar

1. **Carregue a skill do Remotion** (`remotion-best-practices`). Este modelo é um projeto Remotion e as regras dela valem aqui. Se não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. Três ressalvas, porque aqui o projeto já vem pronto: não precisa carregar `remotion-create` nem abrir o Studio (os quadros do `stills.mjs` são a prévia), e o pedido de edição já é o pedido para renderizar.
2. Confirme o caminho do vídeo. Se o usuário não disse o **nome e a área** de quem aparece (ex.: "Ana Ribeiro" / "Psicóloga"), pergunte uma vez: isso vira a assinatura do fechamento. Sem resposta, siga sem assinatura.
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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Trecho marcado `[sem transcrição: ouça antes de tirar]` pode ser fala que o Whisper perdeu: ouça antes de tirar. **Duas versões completas com conteúdo diferente** (dois finais, por exemplo) não são tomada repetida: pergunte ao usuário qual fica; sem resposta, fique com a última e diga na entrega.

**Neste modelo, as pausas de respiração ficam.** Quem fala de calma fala devagar, e é nas pausas entre as frases que a janela muda de lugar e a forma termina de encher ou esvaziar. Por padrão o `cortar` tira o silêncio entre os trechos; para manter uma pausa de até ~1 s entre dois trechos que ficam, estique o `ate` do primeiro até o `de` do seguinte (trechos com menos de 0,3 s de intervalo viram um só, sem corte). Pausas maiores que ~1,2 s, deixe o `cortar` tirar. Comece o primeiro trecho ~0,1 s antes da primeira palavra.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.495 --rosto-y 0.30 --queixo-y 0.40
```

O modelo fixa o recorte em 9:16 (`modelo.json`): a pessoa sempre aparece numa janela, então não precisa de espaço abaixo do queixo. O script corta, calcula `rosto` e os pontos de corte e escreve o esqueleto de `src/plano.json`. Leia os avisos que ele imprime.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a caixa verde é a janela da pessoa (o rosto inteiro precisa caber no arco, com o alto da cabeça abaixo da curva); o círculo roxo tracejado é o anel da contagem; a caixa laranja é a área das notas; a azul, o mapa do respiro; a amarela, a legenda; a linha vermelha, o limite da interface do aplicativo. No primeiro quadro (tela cheia) a cruz deve cair no rosto. Se o rosto ficar cortado ou pequeno nas janelas menores, ajuste `janela.zoom` / `janela.ancoraY` no plano (veja `references/plano.md`).

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: cada batida ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo". A assinatura (`fase` e/ou `ciclos`) entra pelo menos uma vez, mesmo que o assunto não seja respiração.

### 6b. Planejar os momentos

Leia `references/plano.md` (campos de cada bloco, limites de texto, regras de tempo) e preencha em `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`.

Tudo na tela vem da fala: não invente número, tempo, nome nem fato. Conteúdo de saúde pede cuidado redobrado: nada de diagnóstico nem de "cura".

**Contagens e palavras marcadas têm que cair na palavra dita.** Em cada `fase`, `contaEm` e `chegaEm` são os instantes da primeira e da última marca (ou, com `marcas`, o `em` de cada palavra). O Whisper às vezes junta números numa palavra só ("478"); confira com:

```bash
node scripts/legendas.mjs
node utilitarios/ouvir.mjs 7.6 8.8
```

O `ouvir.mjs` mostra a fala do trecho em linhas de 20 ms: cada sílaba é um morro na coluna "voz"; o número começa no primeiro morro dele.

Depois de preencher:
- `node scripts/conferir.mjs --mapa`: corrija até **APROVADO** (sem `--forcar`); se reprovar, leia o trecho que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: linhas de legenda dos trechos sem momento. Nomes errados da transcrição vão em `correcoes`.

### 7. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um depois de cada instante marcado e um logo depois do fim. Peça também quadros **no meio das trocas de lugar** (≈0,5 s depois do `de` de cada momento que muda o layout) e perto das últimas marcas da contagem: `node scripts/stills.mjs 5.6 8.4 11.8`. Abra cada imagem e confira de verdade: o rosto está inteiro no arco? A nota cabe na coluna? O número da contagem bate com a fala? A forma e o anel não encostam na janela? Algo fica parado mais de ~2,5 s? Corrija o plano e repita até estar limpo.

### 8. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-respiro.mp4"
```

Renderiza e normaliza o áudio. Entregue o caminho do arquivo e um resumo curto: duração final, quanto foi cortado (e quais pausas ficaram), quais momentos entraram e o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um instante de contagem que você ajustou pelo `ouvir.mjs`).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | janela grande em arco; uma linha à mão e o título em serifada, palavra por palavra, com grifo; com `mapaEm`, o mapa do respiro se desenha embaixo |
| lista | `topicos` | título em serifada e itens à mão com bolinha de damasco que enche e respira quando o item é dito; `detalhe` em linha menor |
| passos | `passos` | estações numeradas numa linha a lápis; um ponto de damasco anda de uma para a outra e a linha ganha tinta |
| número | `numero` | a pessoa ao lado, o rótulo à mão na coluna e o número contando dentro da forma, que enche junto |
| comparação | `comparacao` | duas formas lado a lado com o texto de cada lado; a que vence enche, a outra esvazia e fica a lápis |
| gráfico | `grafico` | barras macias que enchem, linha de tinta com ponto na ponta ou pizza em anel; sem números, a curva da `tendencia` e "(ilustrativo)" à mão |
| destaque | `destaque` | a frase curta dentro da forma grande; `chave` enche a forma e grifa, `alerta` esvazia a forma e sublinha de tinta |
| definição | `definicao` | termo em serifada sublinhado; um traço desce e o significado se escreve à mão |
| frase | `frase` | aspas de damasco e a frase em itálico, palavra por palavra; `risco` riscado à mão quando dito |
| pergunta | `pergunta` | a pergunta em serifada; as opções à mão com bolinha que enche (ou uma interrogação que pulsa) |
| fechamento | `cta` | janela estreita; ícone a lápis (salvar, seguir, comentar, link) que ganha tinta, chamada à mão e assinatura |
| **assinatura** | `fase` | a forma enche, fica cheia ou esvazia dentro de um anel marcado por números (`contagem`), por palavras (`marcas`) ou contínuo |
| **assinatura** | `ciclos` | a forma se divide em N formas que respiram uma de cada vez, com `itens` escritos na coluna |
| próprio | `nota` | uma linha à mão com sublinhado e uma frase em serifada com grifo; com `ondaEm`, uma onda que desacelera |

## A assinatura em qualquer assunto

A assinatura é **a forma que enche e esvazia**: tudo que cresce, se mantém ou se esgota. Use `fase` com `fase: "enche" | "fica" | "esvazia"` (sinônimos de inspira, segura, solta) e `marcas` (palavras ditas que entram no centro da forma) quando não há números. `ciclos` serve para "repete", "a cada", "uma de cada vez". O mapa do respiro só aparece quando as fases têm `contagem`.

1. **Finanças e cripto:** "o novo bull market, um ciclo de alta" → `fase` `enche`, nota "ciclo de alta", `marcas` [{"Bull market"}, {"ciclo de alta"}]: o anel marca duas palavras e a forma enche. "Mercado sobe, bolso vazio" → `comparacao` em que a forma do bolso esvazia.
2. **Mecânica:** "bateria acesa vai direto para o mecânico" → `fase` `esvazia`, marcas "Bateria" e "mecânico": a forma murcha como a carga. As três luzes do painel são `topicos` com `detalhe`.
3. **Relacionamento ou carreira:** "três conversas que esfriam um casal: elogio, atenção, escuta" → `fase` `esvazia` com `marcas` nas três palavras; ou `ciclos` com `itens`, uma forma que respira para cada hábito.

## Fidelidade

- Tudo na tela vem da fala; não invente número, tempo, nome nem fato.
- Gráfico sem números ditos usa `tendencia` e mostra "(ilustrativo)".

## Limites deste modelo

- A saída é sempre vertical 1080×1920.
- Fala muito rápida e sem pausas briga com o estilo: as trocas de lugar levam ~1,1 s. Avise o usuário.
- Sem trilha musical e sem b-roll: o modelo não inventa imagens.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco da tabela para ele. Não use `--forcar`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano` (momentos, marca e correções continuam).
- **A contagem não bate com a fala**: confira `contaEm` e `chegaEm` com `node utilitarios/ouvir.mjs <de> <ate>`; a última marca cai exatamente em `chegaEm`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Rosto cortado ou pequeno nas janelas menores**: ajuste `janela.zoom` (padrão 1,25) e `janela.ancoraY` (padrão 0,42) no plano.
- **Texto pequeno demais**: o componente diminui a letra para caber; passou do limite de `references/plano.md`. Encurte com palavras da fala.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
