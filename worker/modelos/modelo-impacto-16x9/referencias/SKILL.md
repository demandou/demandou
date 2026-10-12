---
name: modelo-impacto
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Impacto: edição rápida e enérgica em que a pessoa pula de um lado para o outro da tela e palavras enormes em caixa alta batem no lado livre no tempo exato da fala; números em mono contam e travam, listas viram a ficha numerada em tela cheia (a pessoa vira janela) com ✓ em cada item, e \"não é X, é Y\" ganha um risco no acento. Preto, branco-gelo e um verde-limão elétrico. Serve para qualquer assunto (o exemplo do modelo é treino, mas funciona com cripto, finanças, saúde, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Impacto\", \"estilo impacto\", \"edição dinâmica\", \"enérgica\", \"agressiva\", \"com palavras grandes\" ou \"de academia\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Impacto

O vídeo vira um cartaz esportivo que se monta no ritmo da fala: a pessoa abre espaço deslizando para um lado, as palavras batem enormes no outro, ela pula para o lado oposto e a próxima ideia bate. Quando a fala vira lista, sequência ou gráfico, a tela inteira vira a ficha e a pessoa vira uma janela no canto. Energia com ordem: nada treme, nada quica.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um personal trainer, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** cada palavra grande bate no instante em que é dita: entra 8% maior, a poucos pixels do lugar, e assenta em ~6 quadros. A caixa da pessoa anda em 0,3 s, com aceleração e freio, sem passar do ponto; a borda dela (um filete verde-limão) é a cortina que revela o que entra e cobre o que sai. Dentro de cada bloco algo muda a cada ~1 s: o número conta e trava, um marcador desce até o item da vez, o risco atravessa, o ✓ se desenha, a pilha cresce 3% devagar. Nada de digitação letra a letra, palavra voando, tremida ou flash.
- **Organização e hierarquia:** uma ideia por vez, enorme. As palavras empilham em colunas justificadas (cada linha ocupa a largura toda; as curtas ficam gigantes, as longas menores), em caixa alta. Rótulos pequenos e espaçados em cima (o assunto), o grande no meio, o detalhe menor embaixo. Listas são fichas numeradas (01, 02, 03): o item da vez aceso, os que passaram apagados com ✓. Na base da coluna, sempre a assinatura (nome e área).
- **Tipografia:** Sora ExtraBold (800) em caixa alta nas palavras grandes (títulos ≥ 64 px, a maioria entre 90 e 230 px), Sora Bold (700) na legenda e nos textos de apoio (≥ 44 px), Sora SemiBold espaçada nos rótulos (30 a 40 px) e Azeret Mono nos números (dígitos de largura igual, como um cronômetro). Todo texto é medido com as larguras reais da fonte e reduzido para caber; nunca vaza.
- **Moldura da pessoa:** três lugares. Quadro cheio (rosto no centro, legenda abaixo do queixo) entre os momentos; **coluna inteira de um lado** (45% da largura) nos blocos de texto, alternando direita e esquerda a cada momento; **janela no canto de cima** nos blocos em tela cheia (ficha, passos, gráfico). A caixa segue o rosto. Em gravação de selfie, perto da câmera, a coluna alarga sozinha (até 580 px) e a janela aproxima menos, para o rosto caber inteiro.
- **Cores, textura e som:** quase preto `#0B0B0B` (fundo), branco-gelo `#F3F2EC` (texto) e **um** acento elétrico, verde-limão `#C8FF2E` (o destaque, o número travado, o risco, o filete, os ícones, as tarjas de alerta, o selo). Texto sobre o acento é sempre quase preto. Sem degradê, sem contorno, sem brilho. Sons raros e tonais: pancada grave no número que trava, no risco e no alerta; subida curta quando uma tela abre e na chamada; bipe baixo, cada vez mais agudo, em cada item de lista.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla Nunes — Nutricionista esportiva"): eles viram a assinatura na base da coluna, em todo bloco de lado. Sem resposta, siga sem assinatura.

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
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Trecho marcado "sem transcrição"**: ouça antes de tirar; se for fala, deixe. Pessoas enérgicas falam em rajadas ("Agachamento. Flexão. Prancha.") e uma palavra dita sozinha pode vir sem texto. Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, escolha pela lógica de onde o vídeo vai ser postado e, na dúvida, fique com a última. Diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam. Só as longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.42
```

O script corta e enquadra em 9:16 (este modelo reposiciona a pessoa e não precisa de faixa embaixo do queixo) e calcula `rosto`, `zona` e os pontos de corte no plano. Leia os avisos que ele imprime: em gravação de selfie ele avisa que o topo da cabeça fica um pouco cortado em quadro cheio, o que é normal.

No fim, o `cortar.mjs` segue o rosto pelo vídeo (alguns segundos): a caixa da pessoa acompanha quando ela se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. É também esse rastreio que diz ao modelo o tamanho do rosto: com a pessoa perto da câmera, a coluna alarga e a janela mostra cabeça e ombros inteiros. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros da pessoa em quadro cheio com guias: a cruz deve cair no rosto e o rosto na linha do centro; a faixa amarela (legenda) deve ficar abaixo do queixo e acima da linha vermelha (interface do aplicativo). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: uma linha por batida (2 a 5 s, uma ideia), com o tempo, o trecho falado, a forma (lista, número, comparação…), o bloco **deste modelo** (tabela "Blocos deste modelo" abaixo) e o que aparece na tela. A assinatura (`circuito` ou `virada`) entra **pelo menos uma vez**, como metáfora se o assunto for outro (veja "A assinatura em qualquer assunto").

Pense também no **pulo de lado**: os blocos de texto alternam a pessoa entre direita e esquerda; os de tela cheia (`passos`, `grafico`, `circuito`) a mandam para a janela. Deixe o vídeo respirar com trechos curtos de quadro cheio e legenda (até ~3 s, nas frases de ligação), e não repita o mesmo bloco três vezes seguidas.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. As palavras na tela são as da fala: pode resumir e abreviar número ("uma hora" vira "1 hora"), nunca inventar.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`); quando ele apontar um trecho vazio, escolha um bloco para aquele trecho;
- `node scripts/legendas.mjs`: lista as linhas de legenda e marca linha com palavra sozinha ou terminando em "de", "e", "um"; corrija o que der.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem reduzida a ~540 px de largura e confira:
- as palavras grandes cabem, estão inteiras e na ordem certa? Alguma linha ficou bem menor que as outras (texto longo demais)?
- o rosto está inteiro na coluna e na janela?
- a tela muda de verdade a cada 1,5 a 2,5 s? Algum bloco fica só com o rótulo por mais de ~1 s (comece o momento mais perto da primeira palavra)?
- tem erro de digitação ou acento? A legenda volta quando a pessoa volta ao quadro cheio, sem palavra faltando?

Para ver as trocas, peça instantes no meio delas: `node scripts/stills.mjs 3.1 3.2 3.3`. Na troca, a página que sai nunca aparece junto com a que entra (a borda da caixa ou o filete da cortina separam as duas). Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-impacto.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é **ilustrativo** (gráfico de tendência sem números, número marcado `ilustrativo`);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um trecho "sem transcrição" mantido, uma versão escolhida no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Pessoa de lado. O título em palavras enormes empilhadas, cada uma batendo na fala; o `destaque` no verde-limão, com a pancada grave na palavra mais longa dele. |
| abertura com quebra escolhida | `gancho` | Igual, mas você escreve as linhas (1 ou 2 palavras cada) e a linha em destaque. |
| lista | `topicos` | Pessoa de lado. Rótulo espaçado em cima e os itens empilhados na coluna, cada um entrando na sua palavra; o item da vez aceso com uma barra no acento ao lado, os anteriores esmaecem. As vagas já aparecem marcadas por linhas finas. |
| passos | `passos` | Tela cheia, pessoa na janela. A ficha numerada: 01, 02, 03 já marcados, cada etapa entra palavra por palavra, a da vez acesa, as que passaram ganham ✓. Bipe que sobe a cada etapa. |
| número | `numero` | Pessoa de lado. O número gigante em mono conta de zero e trava no acento quando é dito; moeda pequena em cima; "mil", "kg" e o rótulo em palavras enormes embaixo; marcadores enchem junto com a contagem. |
| comparação | `comparacao` | Pessoa de lado. Os dois lados empilhados na coluna, cada um com seu rótulo, separados por "VS", "↓" ou "×"; quem perde é riscado no acento e quem ganha fica verde-limão. |
| gráfico | `grafico` | Tela cheia, pessoa na janela. Barras grossas, linha com quadrados ou anel (pizza), cada número contando na sua palavra, a peça da vez no acento. Sem números: a tendência (sobe, cai, oscila) se desenha com uma caneta quadrada e a etiqueta "ilustrativo". |
| destaque | `destaque` | Pessoa de lado. Chave: filete no acento e as palavras em verde-limão. Alerta: tarjas verde-limão que crescem palavra por palavra, texto quase preto. Detalhe menor embaixo. |
| definição | `definicao` | Pessoa de lado. O termo bate grande, encolhe para cima no acento, um "=" em mono bate e o significado entra palavra por palavra. |
| frase | `frase` | Pessoa de lado. A frase em cartaz, palavra por palavra; `destaque` no acento; `risco` atravessado por uma barra verde-limão quando é dito. |
| pergunta | `pergunta` | Pessoa de lado. Um "?" enorme no acento, a pergunta em cartaz e as opções numa ficha curta (A, B, C, D), cada uma na sua palavra. |
| fechamento | `cta` | Pessoa de lado. O ícone se desenha em traço verde-limão (avião, salvar, seguir, comentar, link) e a chamada bate palavra por palavra; a assinatura fica na base. |
| **assinatura** | `circuito` | Tela cheia. A ficha completa: título (com o número grande se começar com um), itens numerados com ✓, o **anel** que gira uma volta por item quando há dois tempos ditos (trabalho e pausa, foco e descanso), o selo no acento ("4 voltas", "30 dias") e o ✓ final que fecha tudo. |
| **assinatura** | `virada` | Pessoa de lado. "Não é X, é Y": X aparece, é riscado no acento no instante da virada, encolhe para cima e Y entra no lugar, com um selo opcional. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa `grafico` com `tendencia` (ilustrativo), `topicos`, `passos`, `comparacao` ou `virada`; nunca um número inventado.

## A assinatura em qualquer assunto

A assinatura do Impacto tem duas peças, e cada uma serve para qualquer assunto:
- **`circuito`, a ficha que se cumpre:** qualquer lista dita em sequência (método, rotina, critérios, etapas, ingredientes, sinais, fatos) vira uma ficha em tela cheia em que cada item acende na sua palavra e ganha ✓ quando passa. O anel só entra quando a pessoa diz dois tempos.
- **`virada`, "não é X, é Y":** qualquer frase que troca uma ideia por outra ("o problema não é X", "X não significa Y", "esquece X, faz Y").

1. **Finanças / cripto.** "O mercado subindo não significa dinheiro no bolso, para a maioria das pessoas… Eu gravei uma aula para explicar como eu analiso o mercado, os riscos e a escolha dos ativos."
   - `virada`: `rotulo` "Mercado subindo", `nao` { `prefixo` "não significa", `linhas` ["dinheiro", "no bolso"] }, `grifoEm` em "literalmente", `sim` ["para a", "maioria" (destaque)], `selo` "das pessoas".
   - `circuito`: `titulo` "Aula gratuita", itens "O mercado" · "Os riscos" · "A escolha dos ativos", cada um na sua palavra.
2. **Saúde / rotina.** "Pomodoro: vinte e cinco minutos de foco, cinco de pausa. Escolhe a tarefa, desliga o celular, começa. Quatro rodadas e você para."
   - `circuito`: `titulo` "Pomodoro", `intervalo` { `trabalho` 25, `descanso` 5, `unidade` "min", `nomes` ["foco", "pausa"] }, itens "Escolhe a tarefa" · "Desliga o celular" · "Começa", `voltas` { `valor` "4", `texto` "rodadas" }, `fimEm` em "para".
   - `virada`: "O problema não é falta de tempo, é falta de rotina" → `nao` { `prefixo` "não é", `linhas` ["falta de", "tempo"] }, `sim` ["falta de", "rotina" (destaque)].
3. **Algo bem distante (história, relacionamento).**
   - História: "Por dentro, concreto armado. Por fora, milhares de triângulos de pedra-sabão, colocados à mão." → `circuito` `titulo` "Cristo Redentor", itens "Concreto armado" (detalhe "por dentro") · "Milhares de triângulos de pedra-sabão" (detalhe "por fora") · "Colocados à mão", `fimEm` em "mão": tudo ganha ✓.
   - Relacionamento: "A gente não brigava por dinheiro. Brigava por não conversar." → `virada` `nao` { `prefixo` "não brigava", `linhas` ["por", "dinheiro"] }, `sim` ["por não", "conversar" (destaque)].

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Impulso") e abreviar número ("83 mil dólares" → US$ 83 mil), sem mudar o sentido.
- Não invente número, nome, preço, prazo, dose nem resultado.
- Forma sem números só no gráfico de tendência (`tendencia` + `ilustrativo: true`); a etiqueta "ilustrativo" aparece sozinha. Um número marcado `ilustrativo` também ganha a etiqueta.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Momento parado tempo demais: divida em dois ou acrescente itens com `em`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Uma palavra sumiu da legenda**: o `em` dela caiu dentro de um momento (em trechos curtos a transcrição às vezes marca uma palavra um pouco antes da anterior). Termine o momento antes desse `em` (veja "Regras de tempo" em `references/plano.md`).
- **Palavra grande fora do tempo**: o texto não bate com o que foi dito. O modelo procura cada palavra escrita na fala, na ordem; palavras trocadas por sinônimos ficam entre as vizinhas. Use as palavras da fala.
- **Texto pequeno demais**: o bloco reduz o texto para caber; ele passou do limite de `references/plano.md`. Encurte com as palavras da fala ou divida em dois blocos.
- **Rosto cortado na coluna**: a medida do passo 4 está errada ou o rastreio falhou; refaça o corte e confira as guias.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
