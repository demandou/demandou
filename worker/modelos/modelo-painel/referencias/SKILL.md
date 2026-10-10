---
name: modelo-painel
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Painel: um painel de dados calmo e preciso (grafite quase preto, menta e âmbar, números em fonte mono). Quando a fala explica algo, a pessoa encolhe para uma janela no canto e um painel abre com gráfico que se desenha na fala, barra que se divide, cartões de indicador e listas de status; entre um painel e outro ela volta à tela cheia com cartões na altura do peito. Serve para qualquer assunto (o exemplo do modelo é finanças, mas funciona com cripto, saúde, receita, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo e, sem números ditos, usa formas ilustrativas. Use sempre que o usuário pedir para editar \"no modelo Painel\", \"estilo painel\", \"estilo dashboard\", \"com gráficos e indicadores\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Painel

O vídeo vira um painel de dados ao vivo: a pessoa fala em tela cheia e, quando a fala organiza uma ideia (um número, uma lista, uma comparação, uma tendência), ela vai para uma janela no canto e a tela vira um painel grafite que monta a informação no ritmo da fala. Calmo, preciso, sem enfeite.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com finanças (juros compostos), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo entra como um dado sendo impresso: uma máscara abre da esquerda, números contam com aceleração e freio, linhas e barras se desenham na medida da fala, cada item acende na palavra dele. Uma moldura de seleção desliza até o item que está sendo dito; o último dado "respira" (um anel que se abre e some, como dado ao vivo). Sem quique, sem giro, sem brilho. Entre dois painéis, o corpo antigo desliza para fora enquanto o novo entra.
- **Organização e hierarquia:** a informação é organizada como um dashboard. Cabeçalho ao lado da janela (rótulo âmbar em caixa alta + o número grande, a seta da tendência ou o progresso "02/03"), corpo largo embaixo (gráfico, barra, cartões, lista) e nota de rodapé. Uma coisa grande por vez; o resto menor. Itens sempre numerados ou com status.
- **Tipografia:** Geist (textos, 500 e 600) e Geist Mono (todo número, rótulos em caixa alta). Dígitos de largura igual; "R$", "%" e unidades menores ao lado do número. Títulos de 54 a 84 px, textos de corpo ≥ 44 px, rótulos ≥ 30 px. Todo texto é medido e reduzido para caber, em até 2 ou 3 linhas.
- **Moldura da pessoa:** dois estados. Tela cheia (rosto no centro, aproximação lenta e contínua, cartão grafite na altura do peito) e janela (cabeça e ombros num canto de cima, borda fina e a etiqueta com o nome). A troca leva 0,6 s, na fronteira do momento, e nunca deixa a tela vazia: o painel já está montado embaixo e a pessoa encolhe revelando-o; na volta, ela cresce por cima do painel que sai. Painéis seguidos trocam a janela de canto. A janela segue o rosto. Nada recorta a pessoa do fundo.
- **Cores, textura e som:** fundo grafite puxado para o verde `#0A120F`, texto quase branco, **menta** `#5FDDA4` = o resultado/o positivo, **âmbar** `#F0B64E` = rótulos e marcações, cinza-esverdeado = a base, **vermelho suave** `#EE7766` só para perda, risco ou erro. Sons raros e tonais: um tom grave quando o painel abre, notas suaves quando um dado se revela, ✓ sobe, ✗ desce.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla Nunes — Nutricionista"): o nome vai na etiqueta da janela e na assinatura do fechamento; a área vira o rótulo da abertura. Sem resposta, siga sem nome.
4. **Números.** Todo número na tela vem da fala (ou de uma tabela que o usuário mandou). Fala sem números não é problema: os blocos do Painel têm um modo **ilustrativo** (a forma mostra a ideia, nenhum número aparece e a etiqueta "ilustrativo" fica visível).

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

Números falados costumam vir escritos de jeitos estranhos ("R$ 100,00" para "cem mil", "500,00" para "quinhentos reais"). Anote-os: vão virar `correcoes` no passo 7.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** são trechos de 0,7 s ou mais em que o Whisper não reconheceu palavras. Podem ser fala que a transcrição perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, escolha pela lógica de onde o vídeo vai ser postado ("toque em Saiba Mais" só existe em anúncio) e, na dúvida, fique com a última. Diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam. Só as pausas longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.48 --rosto-y 0.38 --queixo-y 0.47
```

O script corta, escolhe o recorte e calcula `rosto`, `zona` e os pontos de corte no plano. Vídeo horizontal (e vertical com o queixo muito baixo) vira recorte 3:4: a pessoa fica na parte de cima e a base vira o fundo grafite do painel, onde entram os cartões e a legenda; o modelo funciona igual. Leia os avisos que o script imprime.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. A janela dos painéis também usa esse rastreio para mostrar cabeça e ombros, esteja a pessoa perto ou longe da câmera.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto; a caixa azul (zona dos cartões em tela cheia) deve começar abaixo do queixo; as caixas amarelas (legenda) devem ficar acima da linha vermelha (interface do aplicativo); as caixas roxas mostram as duas janelas. Se não estiver certo, refaça o passo 4 com medidas corrigidas, ou force `--recorte 4:5` (ou `1:1`) se o queixo continuar em cima da zona.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, número, comparação, tendência…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`grafico`, `divisao` ou `painel`) entra **pelo menos uma vez**, de forma ilustrativa se a fala não tiver números.

Pense também na **gramática de layout**: os blocos de painel mandam a pessoa para a janela; os de tela cheia a trazem de volta. Alterne: não deixe a pessoa mais de ~15 s seguidos na janela, e não faça um trecho de tela cheia com menos de ~1,8 s entre dois painéis (emende os painéis).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Nos blocos de painel, use `"legenda": true` (a pessoa está pequena; a legenda ajuda a acompanhar).

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda e marca linha com palavra sozinha; corrija o que der.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem reduzida a ~540 px de largura e confira: o texto cabe e está inteiro? Os números batem com a fala? A janela mostra a cabeça inteira, sem cortar o rosto (se não, ajuste `retrato` no plano)? O rótulo encosta na janela? A tela muda de verdade a cada 1,5 a 2,5 s? Nada cobre o rosto em tela cheia? Para um instante específico (o meio de uma troca de canto): `node scripts/stills.mjs 12.7 18.4`.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-painel.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é **ilustrativo** (formas sem números) e de onde vieram os números (da fala ou de uma tabela do usuário);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma versão escolhida no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Tela cheia. Cartão grafite com o rótulo âmbar (a área da pessoa) e o título montado palavra por palavra; o `destaque` em menta. |
| abertura com número | `gancho` | Tela cheia. Título curto + o número-chave contando, com uma curva que se desenha ao lado. |
| lista | `topicos` | Painel. Quadro de status: cada item é uma linha numerada que acende na sua palavra, com um ponto de status; uma moldura de seleção desliza até o item dito; o cabeçalho conta "02/05". |
| passos | `passos` | Painel. Pipeline: nós numerados ligados por uma linha que avança de etapa em etapa, cada etapa num cartão; o cabeçalho mostra o progresso. |
| número | `numero` | Tela cheia. Cartão indicador: o rótulo, o número grande em mono menta contando e um ponto "ao vivo"; porcentagem ganha uma barra que enche. |
| comparação | `comparacao` | Tela cheia. Dois cartões lado a lado; com vencedor, ✓ e curva completa × ✗ e curva interrompida; sem vencedor, "×" ou "→" entre eles. |
| gráfico | `grafico` | Painel (assinatura). Linha que avança de um número dito ao outro, barras que crescem na palavra de cada uma, ou a barra que se divide (`pizza`). Sem números: a forma da tendência (sobe, cai, oscila), a seta no cabeçalho e a etiqueta "ilustrativo". |
| destaque | `destaque` | Tela cheia. Alerta do painel: selo de alerta (vermelho suave) ou de chave (menta), a frase grande na fala e o detalhe em mono. Com `eixo`, vira barras com uma faixa acesa (painel). |
| definição | `definicao` | Tela cheia. A dica de um gráfico: o termo em mono menta sublinhado e, quando o significado é dito, uma caixa de dica abre embaixo dele. |
| frase | `frase` | Tela cheia. A anotação do analista: um traço menta cresce ao lado enquanto a frase se monta; `risco` é riscado em vermelho suave. |
| pergunta | `pergunta` | Tela cheia. Campo de busca: selo "?" âmbar, a pergunta na fala, opções com anel ou um campo com o cursor piscando. |
| fechamento | `cta` | Tela cheia. Ícone de traço que se desenha, a chamada na fala (o `destaque` em menta), o apoio e a assinatura com nome e área. |
| **assinatura** | `grafico` | (acima) |
| **assinatura** | `divisao` | Painel. Um todo numa barra só, preenchida parte a parte, com a porcentagem e o valor de cada parte. Sem números, só a proporção (`peso`) e os nomes; o cabeçalho lê a parte que acabou de entrar. |
| **assinatura** | `painel` | Painel. Painel de indicadores: 2 a 4 cartões, cada um acende na sua palavra com um número que conta ou um estado em palavras ("baixo", "sem critério"), a cor do tom e a seta da tendência. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa do bloco (`tendencia`, `peso`, `texto` no lugar do valor).

## A assinatura em qualquer assunto

A assinatura do Painel é **"a fala vira um dashboard"**: a pessoa vai para a janela e a ideia aparece como um dado que se monta: uma linha que sobe ou cai, um todo que se divide, cartões de indicador que acendem. Funciona com números ditos e, sem eles, de forma ilustrativa.

1. **Finanças / cripto.** "O Bitcoin rompeu os 83 mil e reacendeu o bull market… tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   - `grafico` linha, `tendencia: "sobe"`, `ilustrativo: true`, título "Bitcoin", leitura "ciclo de alta", etiqueta "bull market" na palavra.
   - `painel` "Tem gente que perde": cartões Compra → "por impulso", Moeda → "sem critério", Risco → "que não entende", todos com `tom: "negativo"`.
2. **Saúde / rotina.** "Em três semanas de caminhada a minha ansiedade caiu, o sono melhorou e eu parei de beliscar à noite."
   - `grafico` barras, `tendencia: "cai"`, `tom: "positivo"` (cair é bom aqui), `eixo: ["Sem 1", "Sem 2", "Sem 3"]`, leitura "ansiedade caiu".
   - `painel` "Três semanas depois": Ansiedade → "caiu" (`tendencia: "cai"`, `tom: "positivo"`), Sono → "melhorou" (`tendencia: "sobe"`), Beliscar → "parei".
3. **Algo bem distante (receita, relacionamento).**
   - Receita: "uma lata de leite condensado, uma colher de manteiga e três colheres de chocolate" → `painel` "Ingredientes" com 1 lata · 1 colher · 3 colheres contando; "passa para o pote ainda quente e deixa esfriar" → `grafico` linha, `tendencia: "cai"`, `tom: "neutro"`, leitura "deixa esfriar", marca "ainda quente" no começo da linha.
   - Relacionamento: "a maior parte das brigas começa no cansaço, não no assunto" → `divisao` ilustrativa: "cansaço" (`peso` 3) × "o assunto" (`peso` 1), sem números.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Impulso"), sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato. Uma conta sua a partir de parâmetros que a pessoa disse (aporte, taxa, prazo) é uma **simulação**: mostre os parâmetros na `ficha` e a nota "Simulação ilustrativa" (detalhes em `references/plano.md`, seção 3).
- Forma sem números só nos campos ilustrativos (`tendencia`, `peso`, `ilustrativo: true`); a etiqueta "ilustrativo" aparece sozinha. Nenhum número inventado vai para a tela.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais**: o bloco reduz o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala.
- **A janela corta o cabelo ou mostra rosto demais**: ajuste `retrato` no plano (`zoom` menor mostra mais; `ancoraY` sobe ou desce o rosto).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
