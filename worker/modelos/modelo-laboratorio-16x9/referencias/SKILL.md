---
name: modelo-laboratorio
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Laboratório: a tela vira um caderno de laboratório em papel milimetrado, a pessoa vira uma foto redonda colada com fita que muda de lugar a cada folha, e cada ideia é desenhada a tinta no instante em que é dita (figuras de experimento, proveta que enche, amostras lado a lado, gráfico à mão, procedimento numerado, anotações com setas). Serve para qualquer assunto (o exemplo do modelo é divulgação científica, mas funciona com finanças, cripto, saúde, moda, vendas, histórias, aulas…): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Laboratório\", \"estilo caderno\", \"estilo caderno de ciência\", \"papel milimetrado\" ou \"com desenhos à mão\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Laboratório

O vídeo vira o caderno de quem fez o experimento: papel milimetrado, tinta azul-preta e dois lápis de cor. A pessoa sai da tela cheia e vira uma foto redonda colada com fita; cada ideia da fala é uma folha nova que sobe por cima da anterior, já esboçada a lápis, e cada parte é passada a tinta no instante em que é dita.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com divulgação científica (por que o céu é azul), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo nasce esboçado a lápis (cinza, tracejado) e é passado a tinta, da esquerda para a direita, na palavra que o diz: letras à mão, traços de caneta, lápis de cor que pinta. A caneta corre decidida e assenta, sem quique. Entre uma ideia e outra, a folha nova sobe de baixo por cima da anterior (~0,7 s) e a foto da pessoa troca de lugar junto. Números contam como a leitura de um instrumento; ondas, feixes e pontinhos espalhados continuam se mexendo: o desenho nunca congela.
- **Organização e hierarquia:** cada folha é uma figura ou nota numerada do caderno. No alto, a linha impressa ("FIG. 2 · BITCOIN", "NOTA 1 · DEFINIÇÃO") com uma régua; ao lado da foto, o título à mão, grande; embaixo, na largura toda, o desenho ou a lista. Uma coisa grande por vez: o item da vez fica em tinta cheia e os anteriores descansam um tom abaixo.
- **Tipografia:** três vozes, todas do Google Fonts, nenhuma condensada. Edu SA Hand (letra escolar legível) para tudo que é escrito à mão: títulos de 64 a 150 px, itens de 52 a 96 px, rótulos ≥ 40 px. Space Mono para o que vem impresso (linha da folha, escalas, leituras de número, carimbo "ilustrativo"), ≥ 30 px. Lexend para a legenda (54 px, mínimo 46). Todo texto é medido e diminui ou quebra em até 2 ou 3 linhas para caber; nunca vaza.
- **Moldura da pessoa:** quadro cheio só no começo e em respiros. Nas folhas, a pessoa é uma foto redonda com borda de papel, dois pedaços de fita e um círculo a tinta riscado em volta quando a folha assenta. Quatro lugares: **topo** (foto grande no alto, texto embaixo), **direita** e **esquerda** (foto no canto, título ao lado, desenho embaixo) e **baixo** (a pessoa no horizonte, olhando o céu da figura). Folhas seguidas alternam o lado sozinhas. A foto segue o rosto e se ajusta à gravação (selfie ou plano aberto); nunca recorta a pessoa do fundo.
- **Cores, textura e som:** papel `#F2F2EA` com grade verde-sálvia, tinta `#1D2935`, **azul** `#2361CF` para o que é chave, o certo, o resultado; **vermelhão** `#DD5228` para alerta, risco, o errado; âmbar só na fonte de luz; as cores do espectro só no feixe que se abre. Tremor de mão leve nos traços, hachura de lápis de cor. Som raro e tonal: um tom grave a cada folha nova, duas notas quando algo se abre ou uma leitura termina, um acorde grave no alerta, um acorde no fechamento.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB; as fontes do Google na hora do render). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Ana Lima — Química"): vão na assinatura do fechamento, e a área na linha impressa da abertura. Sem resposta, siga sem nome.

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
- **erros, tosses, "pera, vou de novo"**, e comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Trecho marcado `[sem transcrição: ouça antes de tirar]` pode ser fala que o Whisper perdeu: sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`); perto de −60 dB é silêncio e sai, perto de −20 dB é fala e fica.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas são respiração; o corte as encurta sozinho.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.50 --rosto-y 0.29 --queixo-y 0.41
```

O script corta, recorta e calcula `rosto` e os pontos de corte. Este modelo fixa o vertical em 9:16 (`modelo.json`): a pessoa muda de lugar no caderno e não precisa de espaço abaixo do queixo. Vídeo horizontal vira 3:4 e funciona do mesmo jeito. No fim, ele segue o rosto pelo vídeo: a foto redonda acompanha quando a pessoa se mexe e ajusta o zoom ao tamanho do rosto (selfie bem perto ou plano aberto). Leia os avisos que ele imprime; o aviso de "topo da cabeça cortado" em gravação de selfie é normal aqui (a foto redonda mostra a cabeça).

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz azul cai no rosto (só em tela cheia); o contorno verde é a foto da pessoa; a caixa laranja, o cabeçalho da folha; a rosa, a área do desenho; a amarela, a legenda, acima da linha vermelha (interface do aplicativo). Se a cruz não cair no rosto, refaça o passo 4. Se o rosto ficar grande, pequeno ou cortado dentro da foto redonda, ajuste `caixas` no plano (`references/plano.md`, seção 1).

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, número, comparação, tendência…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (uma figura de experimento: `espectro`, `particulas`, `ondas`, `observador` ou `trajeto`) entra **pelo menos uma vez**, como metáfora se o assunto for outro (veja "A assinatura em qualquer assunto").

Pense também na **gramática das folhas**: cada momento é uma folha; folhas seguidas trocam a foto de lugar (o modelo alterna os lados sozinho). Folha com menos de ~2 s fica apertada (a troca leva 0,7 s): junte com a vizinha.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto, regras de tempo e exemplos completos) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Nas folhas com desenho ou lista, use `"legenda": true`; nas folhas de texto (abertura, destaque, frase, pergunta, fechamento) o caderno já escreve a fala.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda e marca linha com palavra sozinha; corrija com `semLegenda` (seção 7 de `references/plano.md`).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem reduzida a ~540 px de largura: o texto cabe e está inteiro? Algum rótulo encosta em outro, na foto ou sai da tela? O desenho diz o que a fala diz? A foto mostra o rosto inteiro? A tela muda a cada 1,5 a 2,5 s? Peça também quadros no meio das trocas de folha (`de` + 0,3 s e + 0,6 s): `node scripts/stills.mjs 8.35 8.65`.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-laboratorio.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é **ilustrativo** (gráfico sem números ditos, com o carimbo);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma versão escolhida no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` (ou `titulo`) | Foto grande no topo. Linha impressa ("EXPERIMENTO" · área) e o texto escrito à mão, grande, palavra por palavra; o `destaque` em azul ganha um sublinhado ondulado. |
| lista | `topicos` | Foto no canto, título ao lado. Observações à mão, cada uma com uma setinha a tinta, no seu `em`; a seta do item da vez fica azul e os anteriores descansam um tom abaixo. |
| passos | `passos` | Foto no canto. O procedimento: números em círculos a tinta, ligados por um traço que desce de um passo ao outro na fala; o passo da vez é pintado de azul. |
| número | `numero` | Foto no canto, o nome do número à mão ao lado. Uma proveta graduada enche de azul enquanto a leitura impressa conta até o valor (pt-BR, com prefixo e sufixo); a leitura é sublinhada quando termina. |
| comparação | `comparacao` | Foto no canto. Duas amostras em caixas a tinta, nome impresso em cima e texto à mão; "×" (contra), seta (antes → depois) ou ✗ vermelhão × ✓ azul (errado → certo); a vencedora ganha um círculo azul. |
| gráfico | `grafico` | Foto no canto. Gráfico à mão no papel milimetrado: barras hachuradas que crescem, linha de ponto em ponto ou pizza fatiada, cada dado na sua palavra. Sem números ditos: a curva da tendência (sobe, cai, oscila) e o carimbo "ilustrativo". |
| destaque | `destaque` | Foto grande no topo. Um triângulo de alerta (vermelhão) ou um asterisco (azul) desenhado, a frase grande à mão e uma caixa a tinta riscada em volta. |
| definição | `definicao` | Foto grande no topo. O termo à mão, sublinhado em azul; uma seta desce e o significado é escrito embaixo, em azul. |
| frase | `frase` | Foto grande no topo. A frase entre aspas desenhadas; `risco` é riscado a vermelhão quando é dito. |
| pergunta | `pergunta` | Foto no canto, um "?" grande à mão ao lado. A pergunta e as opções com caixinhas de marcar desenhadas, cada uma na sua palavra. |
| fechamento | `cta` | Foto grande no topo. A chamada à mão, o ícone desenhado a tinta que se pinta de azul (seguir, salvar, comentar, link) e a assinatura impressa. |
| **assinatura** | `espectro` | Uma fonte de luz solta um feixe que entra num prisma e se abre: em 7 cores (luz) ou, em qualquer assunto, em **2 a 5 partes com nome**, cada uma no seu `em`. "Um todo feito de partes", "as causas de um resultado". |
| **assinatura** | `particulas` | Algo entra numa camada, bate em partículas e se espalha em pontinhos. "Entra e se perde", "espalha", "difunde". |
| **assinatura** | `ondas` | Duas ou três ondas lado a lado, cada uma com rótulo e medida; uma agitada (curta) e uma calma (longa). "Ritmo rápido × lento", "frequência". |
| **assinatura** | `observador` | A foto desce para o horizonte; linhas de visada saem da pessoa para pontos do céu (`alvo` dá nome a eles) e a cor volta de todos os lados; o céu se pinta com o título. "De onde você olhar", "tudo chega até você". |
| **assinatura** | `trajeto` | Um caminho curto e um longo pela mesma camada (o Sol que desce, o céu que muda). "O caminho mais longo muda o resultado". |
| nota livre | `anotacoes` | Até 4 linhas à mão com setas e a conclusão numa caixa. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a forma qualitativa (`grafico` com `tendencia`, as figuras de experimento) e nada de número inventado.

## A assinatura em qualquer assunto

A assinatura do Laboratório é **"a ideia vira uma figura de experimento"**: o que a pessoa explica aparece como o desenho de um fenômeno, feito à mão no caderno e passado a tinta na fala. As figuras são metáforas visuais; os rótulos são livres.

1. **Finanças / cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   - `espectro` com `partes`: a fonte de luz é "alta" (`fonte: "alta"`), o feixe entra no prisma e se abre em três partes: "compra por impulso", "moeda sem critério", "risco que não entende", cada uma na sua palavra. Título ao lado: "tem gente que perde".
   - "Como avaliar os projetos e pensar no seu posicionamento?" → `observador`: linhas de visada até os pontos (`alvo: "os projetos"`), o céu se pinta com "seu posicionamento".
2. **Saúde / rotina.** "O estresse do dia entra no seu corpo e se espalha: no sono, na fome, no humor."
   - `particulas`: camada "seu corpo" (`camada`), o feixe entra (`entraEm` em "entra"), bate (`particulas: "o dia a dia"`) e espalha (`efeito: "se espalha"`).
   - "Treino curto e intenso cansa mais rápido que caminhada longa" → `ondas`: "treino intenso" (`ciclos` 6, vermelho) × "caminhada" (`ciclos` 2, azul), medidas "curto" e "longo".
3. **Algo bem distante (moda, relacionamento, história pessoal).**
   - Moda: "Um look bem montado tem três partes: a peça-chave, a cor de apoio e o acessório" → `espectro` com `partes` "peça-chave", "cor de apoio", "acessório"; fonte "o look".
   - Relacionamento: "Quando você está bem, isso chega em todo mundo à sua volta" → `observador` com `alvo: "todo mundo"` e título "chega em todos".
   - História pessoal: "O caminho mais longo foi o que me ensinou" → `trajeto` com `curto: "atalho"`, `medida: "caminho longo"`, `sobra: "o que ficou"`.

## Fidelidade

- Tudo no caderno vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "por impulso"), sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Número na tela só se foi dito (ou veio de uma tabela do usuário).
- Gráfico sem números ditos usa `tendencia` e mostra o carimbo "ilustrativo" sozinho. As figuras de experimento são metáforas desenhadas: não levam números.
- Em vídeo de ciência, confira o fato principal antes de escrever; se a pessoa disse algo errado, avise o usuário em vez de "consertar" o caderno em silêncio.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Momento longo parado: divida em dois ou acrescente itens com `em`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Quadros com letra genérica ou render parado esperando**: sem internet as fontes do Google não carregam. Conecte e rode de novo.
- **Uma fala sumiu do vídeo**: o trecho foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Uma palavra foi escrita antes ou depois da fala**: o texto não está na ordem em que foi falado, ou tem uma palavra que a pessoa não disse (ela entra logo depois da anterior). Reescreva com as palavras ditas, na ordem.
- **Texto pequeno demais**: o bloco reduziu o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala.
- **Rosto grande ou cortado na foto redonda**: ajuste `caixas` no plano (`zoom` maior aproxima; `ancoraY` sobe ou desce o rosto).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
