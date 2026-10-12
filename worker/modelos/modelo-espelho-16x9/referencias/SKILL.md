---
name: modelo-espelho-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Espelho. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Espelho: luxo discreto de revista (champanhe, café e dourado, Bodoni Moda e Jost), a tela dividida por um fio dourado de pé que anda conforme a fala, a pessoa numa moldura à direita e, à esquerda, a informação desenhada a traço fino, cada palavra revelada pelo fio quando é dita; a assinatura é uma figura simétrica (rosto, espelho, moeda, microfone, planta…) com pontos numerados que acendem. Serve para qualquer assunto (o exemplo é harmonização facial, mas funciona com finanças, cripto, saúde, carreira, podcast, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Espelho\", \"estilo espelho\", \"edição de luxo\" ou \"estilo revista\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa moldura à direita, a explicação à esquerda)."
---

# Modelo Espelho (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Espelho no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, fios dourados, a revelação palavra por palavra, os desenhos em reflexo, os sons e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala no quadro deitado inteiro (a gravação 16:9 inteira, sem recorte vertical), com a legenda no terço de baixo. Os blocos entram **só quando acrescentam clareza** à fala e a tela volta para a pessoa quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A linha do espelho fica de pé.** Num bloco, a pessoa desliza para uma **moldura do lado direito** (da linha até a borda, de alto a baixo, de 760 a 880 px de largura), com o rosto centralizado nela e acompanhado com ajuste suave (o rastro do rosto); a borda esquerda da moldura é o fio dourado do espelho, agora vertical. O bloco ocupa o **quadro champanhe do lado esquerdo**: a mesma página do vertical (900 px de largura útil), centrada na largura do quadro e na altura da tela. Página curta (capa) deixa a linha mais à esquerda (x ~1040) e a moldura larga; página alta (matéria, mapa) empurra a linha para a direita (até x ~1160). Entre duas ideias a linha desliza para o lado e a pessoa vai junto.
- **Sem blocos de tela cheia.** No Espelho todo bloco é página ao lado da pessoa; o mapa e a comparação com régua ganham uma base própria na página (um fio dourado que se abre do centro), no lugar da linha horizontal do vertical.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s. Bloco com menos de ~2,5 s não dá tempo de ler.
- **Margens do YouTube:** nada importante abaixo de y 984 (controles do player); a página nunca passa da linha do espelho.

O vídeo vira uma página de revista de luxo que se monta enquanto a pessoa fala. Um fio dourado fino divide a tela **de pé**, como a linha de um espelho, e anda para um lado ou para o outro a cada ideia: à direita, a pessoa numa moldura de alto a baixo; à esquerda, o título de capa, o número, a lista, a comparação ou a figura desenhada a traço, tudo em Bodoni sobre champanhe. Entre as ideias, a pessoa volta para a tela cheia. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com harmonização facial, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** o fio do espelho revela tudo. Cada palavra aparece atrás de um filete dourado que a atravessa, no instante em que é dita; os desenhos se fazem como um reflexo (a metade esquerda e a direita juntas, do centro para fora); os fios se abrem do centro; números contam com um losango correndo numa régua; pontos acendem com um véu dourado pontilhado. Entre duas ideias a linha desliza (~0,7 s) e a pessoa vai junto; se a linha não muda de lugar, a página corre de lado como uma porta de correr (a nova sai de trás da moldura); se muda, um fio dourado atravessa o quadro da esquerda e troca a página atrás dele. Desliza e assenta: nunca quica, gira ou pulsa.
- **Organização e hierarquia:** uma ideia por vez, na página do quadro da esquerda. Texto de impacto (abertura, frase, pergunta, destaque, definição, número) fica centrado, como capa de revista, numa página só da altura que ele pede, e a linha fica mais à esquerda. Informação com partes (lista, passos, comparação, gráfico, mapa) ocupa a página inteira, alinhada à esquerda, e a linha anda para a direita. Um item grande por vez: o da vez fica inteiro, os já ditos apagam um pouco. Rótulos em caixa alta pequenos, títulos grandes, notas em itálico.
- **Tipografia:** Bodoni Moda (didone de revista) para títulos, itens, números e itálicos de ênfase; Jost em caixa alta espaçada para rótulos, unidades e botões. Títulos de 72 a 112 px, itens de 44 a 80 px, nada abaixo de 30 px. O texto é medido com a largura real da fonte: diminui e quebra em até 2 ou 3 linhas, nunca vaza.
- **Moldura da pessoa:** num bloco, sempre à direita, de alto a baixo, da linha do espelho até a borda do quadro, com o rosto centralizado na horizontal. A moldura acompanha o rosto quadro a quadro, com ajuste suave (sem saltos nem cortes no rosto). Pessoa longe da câmera (cabeça pequena): a moldura aproxima até 1,3×. Entre momentos com respiro, a pessoa volta à tela cheia (a base da aula).
- **Cores, textura e som:** champanhe (fundo), café (traço e texto), um dourado sóbrio (o fio, os pontos, a ênfase) e um bordô queimado só para o alerta e o que é riscado. Sem degradê, sem brilho, sem sombra. Sons raros e tonais: um tom grave na abertura e no fechamento, um deslizar grave quando a linha muda, uma nota curta quando um ponto acende.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Ana Lima" / "Finanças pessoais"): viram a assinatura do fechamento. Sem resposta, siga sem nome.

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1. O `modelo.json` deste template pede `"formato": "16:9"`: o `cortar.mjs` entrega o quadro 1920×1080 (uma gravação deitada entra inteira; uma vertical vira uma faixa deitada em volta do rosto, então grave deitado).

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Trecho marcado `[sem transcrição: ouça antes de tirar]`: se for fala, deixe.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam; só as longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.43
```

O script corta, escolhe o recorte e calcula `rosto`, `zona` e os pontos de corte no plano. Leia os avisos que ele imprime e anote o "queixo em N px": este modelo usa o rosto e o queixo para enquadrar a cabeça na moldura da direita (e para aproximar quando a pessoa está longe). No fim ele também segue o rosto pelo vídeo: a moldura acompanha quando a pessoa se mexe. Refazendo o corte depois de já ter planejado, use `--manter-plano` (momentos, marca e correções continuam).

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Nas guias: a caixa verde é a moldura da pessoa (na tela cheia, o quadro inteiro; num momento, a moldura da direita, e a borda esquerda dela é a **linha do espelho**); a cruz azul cai no rosto, e os dois traços azuis marcam o **alto da cabeça** e o **queixo** que o modelo estimou; a caixa laranja tracejada é a página do momento no quadro da esquerda; a linha amarela é onde a legenda termina e a vermelha, o começo dos controles do player (y 984). Confira: a cruz no rosto, a cabeça inteira dentro da caixa verde e o rosto no meio dela. Se a cruz não cair no rosto, refaça o passo 4 com medidas corrigidas (ou ajuste `caixas.pessoa.queixo`, ver `references/plano.md`). Depois de preencher o plano (passo 7), repita com tempos de cada momento: `node scripts/stills.mjs --guias 2 9 15`.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`mapa`) entra pelo menos uma vez**, mesmo que o assunto não tenha nada de rosto: veja "A assinatura em qualquer assunto".

Alterne os blocos: depois de um ou dois blocos de painel (lista, passos, comparação, gráfico, mapa), um bloco de texto centrado (frase, destaque, pergunta, número), e vice-versa. É a linha andando de um lado para o outro (e a pessoa indo junto) que dá o ritmo do Espelho. No vídeo completo a tela cheia é a base (aula 9): o bloco entra onde ajuda a entender, não em toda frase; entre eles, a pessoa em tela cheia com a legenda (1 a ~8 s).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada momento começa na primeira palavra da batida (`de`) e cada item, ponto, lado ou opção entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "bitcoim": "Bitcoin" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o texto cabe (nada cortado, nenhuma palavra encostando na linha do espelho nem passando por baixo da moldura)?
- cada coisa aparece quando é dita? O ponto certo acende no mapa, com o número certo na legenda?
- o rosto está centralizado na moldura da direita, com a cabeça inteira, e nada cobre a pessoa?
- nada parado mais de ~6 s, nada importante abaixo de y 984 (controles do player)?
- as trocas: gere quadros a cada 0,1 s em volta de cada `de` (`node scripts/stills.mjs 8.6 8.7 8.8 8.9 9.0 9.1`). Nenhum quadro com o quadro da esquerda vazio por mais de um instante e nunca dois textos um sobre o outro (de um lado do fio dourado que atravessa, a página nova; do outro, a velha)?

Corrija o plano (texto mais curto, outro bloco, outro `em`, `de` na primeira palavra) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-espelho.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é ilustrativo (curva de tendência sem números, número marcado como ilustrativo);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo (quadro deitado) |
|---|---|---|
| abertura | `abertura` (ou `manchete`) | capa de revista: o título centrado em Bodoni no quadro da esquerda, palavra por palavra, com o `destaque` em itálico dourado; a linha do espelho mais à esquerda e a moldura da pessoa larga. No começo do vídeo, o primeiro quadro já mostra as primeiras palavras (capa) |
| lista | `topicos` | página inteira: título com filete dourado; cada item com um losango (o mesmo da linha) que nasce vazado e se enche de ouro quando o item é dito; fios finos entre os itens, abertos do centro |
| passos | `passos` | página inteira: círculos numerados ligados por um fio dourado que desce até o passo da vez |
| número | `numero` | centrado: o número em Bodoni grande contando em pt-BR, prefixo e sufixo menores em dourado, um losango correndo numa régua fina; o rótulo em itálico embaixo |
| comparação | `comparacao` | o reflexo: o primeiro lado em cima, à esquerda; o segundo embaixo, à direita; entre eles um fio dourado com × (contra) ou ↓ (antes e depois, errado e certo); o vencedor ganha o selo, o lado errado é riscado em bordô |
| gráfico | `grafico` | barras = trilhos nude com a faixa dourada crescendo; linha = losangos ligados por um fio dourado; pizza = anel fino com a fatia da vez em número grande; sem números = curva dourada com o véu pontilhado e a etiqueta ILUSTRATIVO |
| destaque | `destaque` | a frase grande entre dois fios que se abrem do centro, com o losango embaixo; `alerta` em bordô, `chave` em itálico dourado |
| definição | `definicao` | o termo em cima de um fio dourado; o significado aparece embaixo, em itálico, como o reflexo do termo |
| frase | `frase` | aspas douradas e a frase em itálico, palavra por palavra; `destaque` em dourado; `risco` riscado em bordô quando é dito |
| pergunta | `pergunta` | um "?" dourado grande e a pergunta; as `opcoes` entram com letras (A, B…) em círculos dourados |
| fechamento | `cta` | a assinatura (nome e área), um filete, a chamada em itálico e o botão desenhado a traço (seguir, salvar, comentar, link) |
| **assinatura** | `mapa` | uma figura simétrica desenhada a traço de um lado da página, de pé na base dela (rosto, espelho, pessoa, moeda, microfone, coração, lâmpada, ampulheta, casa, planta, livro), com linhas de mapeamento; cada ponto acende no seu `em` com o véu dourado e um número, e entra na legenda do outro lado |
| título com extras | `manchete` | a capa com `rotulo`, `abre`, `sub`, símbolos desenhados (≠ × → + =) e o selo |
| comparação com régua | `comparacao` com `escala` | a base da página (um fio dourado de borda a borda do quadro da esquerda) vira uma régua; cada lado ganha um trilho e uma faixa dourada que cresce, com o número em Bodoni grande (prazos, durações, quantidades na mesma escala) |

## A assinatura em qualquer assunto

O `mapa` é o "mapeamento" do Espelho: **uma coisa desenhada como num atlas, com as partes que importam numeradas**. Ele serve sempre que a fala tem 2 a 5 partes de um mesmo todo: motivos de um problema, peças de um método, etapas de um crescimento, pontos de atenção. Escolha a figura pelo assunto (ou pela metáfora) e ponha cada parte como um `ponto`, no `em` da palavra que a nomeia. Sem nenhuma figura que combine, use `espelho` (o nome do modelo: "o reflexo" de qualquer coisa).

| Figura | Bom para |
|---|---|
| `rosto` | estética, pele, expressão (com `areas` anatômicas e os efeitos `relaxar` e `volume`) |
| `espelho` | autoimagem, reflexão, qualquer assunto |
| `pessoa` | saúde, corpo, carreira, comportamento |
| `moeda` | dinheiro, finanças, cripto, preço, valor |
| `microfone` | podcast, voz, comunicação, conteúdo |
| `coracao` | relacionamento, afeto, emoção |
| `lampada` | ideia, aprendizado, criatividade |
| `ampulheta` | tempo, prazo, paciência, rotina |
| `casa` | lar, família, imóveis |
| `planta` | crescimento, hábito, cuidado (numera do vaso para o broto) |
| `livro` | estudo, história, conhecimento |

Três exemplos fora da estética:

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `mapa` com `figura: "moeda"`, `titulo: "Por que perde"` e três `pontos`: "Compra por impulso" (em "compra"), "Moeda sem critério" (em "escolhe"), "Risco que não entende" (em "assume"). A moeda se desenha do centro para fora e cada motivo acende num lugar dela, numerado, enquanto entra na legenda.
2. **Saúde e rotina.** "Para dormir melhor: desligue a tela uma hora antes, deixe o quarto escuro e acorde sempre no mesmo horário."
   `mapa` com `figura: "ampulheta"`, `titulo: "Dormir melhor"` e os três hábitos como `pontos` (de cima para baixo, como a areia). Com `figura: "pessoa"`, o mesmo vira um mapa do corpo.
3. **História pessoal / carreira.** "Comecei escrevendo dez minutos por dia. Um ano depois eram trezentos textos e o primeiro cliente."
   `mapa` com `figura: "planta"`, `titulo: "Um ano depois"` e `pontos` "300 textos" e "O primeiro cliente": a planta cresce e os números sobem do vaso até o broto. Num relato de relacionamento ("o que mantém um casal junto: conversa, respeito e tempo"), `figura: "coracao"` com três pontos.

O mapa sem `pontos` também existe (a figura, o título e a nota), mas é com os pontos acendendo que ele vira a assinatura: prefira sempre pôr as partes como pontos. Com 4 ou 5 pontos, deixe a `nota` de fora e use nomes curtos.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, taxa nem fato.
- Número ilustrativo só onde o bloco permite (`grafico` com `tendencia`, `numero` com `ilustrativo: true`), sempre com a etiqueta ILUSTRATIVO visível.
- Em saúde e estética, nada de antes e depois de paciente, promessa de resultado, preço ou promoção na tela (regras dos conselhos profissionais). O rosto desenhado é genérico e anatômico, nunca "resultado". Se a fala tiver algo assim, deixe fora da tela e avise o usuário.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **"A assinatura não aparece"**: ponha um `mapa` no trecho que tem partes de um todo (motivos, peças, etapas), com a figura do assunto ou `espelho`. Veja "A assinatura em qualquer assunto".
- **O quadro da esquerda fica vazio no começo de um momento**: o `de` está antes da primeira palavra da batida. Puxe o `de` para a primeira palavra (ou estique o momento anterior até ela).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **O rosto não fica no meio da moldura ou a cabeça sai cortada quando ela aproxima**: a medida do rosto ou a estimativa da cabeça errou (cabelo alto, coque, chapéu, ou o queixo medido errado). Refaça o passo 4 com as medidas certas, ou dê o queixo certo em `caixas.pessoa.queixo` (px, o número que o `cortar.mjs` imprimiu) e, se precisar de mais folga em cima, aumente `caixas.pessoa.margem` (padrão 60).
- **A imagem da pessoa ficou estreita, uma faixa em volta do rosto**: a gravação é vertical e o quadro é deitado. O modelo usa a faixa deitada em volta do rosto; para a melhor imagem, grave deitado.
- **A pessoa ficou pequena demais na moldura**: gravação muito aberta. O modelo já aproxima até 1,3×; para mais, use `caixas.pessoa.zoom` (ex.: 1.4).
- **Texto pequeno demais ou quebrado em muitas linhas**: passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **A figura do mapa ficou pequena**: título longo, nota e nomes longos disputam a coluna. Encurte o título (até ~20 caracteres), tire a `nota` ou use menos pontos.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
