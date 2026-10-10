---
name: modelo-chave-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Chave. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Chave: o hall de um apartamento bem cuidado. A porta se abre e revela a pessoa, o batente de madeira vira a moldura dela, e cada ideia vira um objeto na parede de cimento queimado: etiquetas de papel que balançam no gancho, um quadro de chaves, chaveiros, a prancheta, um recibo que soma, placas aparafusadas. Serve para qualquer assunto (o exemplo do modelo é imóveis, mas funciona com finanças, cripto, saúde, psicologia, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Chave\", \"estilo Chave\", \"estilo porta e chaveiro\" ou \"com etiquetas e quadro de chaves\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa numa porta à direita, a explicação na parede à esquerda)."
---

# Modelo Chave (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Chave no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, etiquetas, placas, o quadro de chaves, os sons, a dinâmica dos objetos e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em tela cheia, como foi gravada (a tela é o vão da porta, com o batente em volta), com a legenda no terço de baixo ou com uma arte no peito. O objeto da parede abre **só quando acrescenta clareza** à fala e a pessoa volta à tela cheia quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Nos blocos de parede, nos itens e no "N×", a pessoa vai para a **porta da direita** (a moldura: 560 px de largura, do alto até o piso), com o rosto no meio dela e acompanhado com ajuste suave, sem saltos (o rastro do rosto). O objeto ocupa a **parede da esquerda** (o quadro: ~1120 × 890 px), com o quadro de chaves no alto dela nos itens.
- **As artes do peito viram fileiras.** No quadro deitado a faixa abaixo do queixo é baixa e larga (~300 px de altura, até ~1240 px de largura): a definição põe o termo e o significado lado a lado, a pergunta põe as opções numa fileira embaixo dela, o fechamento põe a régua com as etiquetas de ação à esquerda e a chamada com a placa à direita. Gravação com o rosto baixo no quadro: a arte vai para o lado livre do rosto.
- **A abertura** é a porta de duas folhas: o vão é a tela inteira, então as duas folhas destravam juntas e se abrem para dentro.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

O vídeo vira uma visita bem apresentada: a porta do apartamento destrava e se abre, a pessoa aparece no vão e o batente de madeira fica como moldura dela até o fim. Quando a fala organiza uma ideia, a câmera recua para o hall: a pessoa vai para a porta da direita, apoiada no piso, e a parede de cimento queimado, à esquerda, ganha o objeto certo, pendurado ou aparafusado, que se completa no ritmo da fala. Sóbrio, físico e calmo.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um corretor de imóveis, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo se comporta como objeto de verdade. Etiquetas caem no gancho ou no prego e balançam como pêndulo amortecido (assentam em ~1 s, sem elástico); placas sobem e assentam nos parafusos; números contam; traços a lápis ganham tinta; o visto verde carimba. Tudo já está desenhado a lápis (cinza, tracejado) e ganha papel, tinta ou cor no instante em que é dito. Nas trocas, a pessoa muda de porta e os objetos da parede deslizam juntos, como a câmera passando pelo hall: o que sai e o que entra andam para o mesmo lado e nunca se sobrepõem.
- **Organização e hierarquia:** uma ideia por vez, num objeto só. Itens numerados em etiquetas (1, 2, 3); a da vez fica verde, as anteriores voltam ao papel com o visto. Título em serifa grande no alto do objeto, itens em grotesca, detalhes menores em cinza. As partes grandes do vídeo (os "itens") ganham um quadro de chaves no alto da parede da esquerda, com uma etiqueta por parte.
- **Tipografia:** Young Serif (títulos, números, frases no peito) e Familjen Grotesk 500 a 700 (itens, rótulos em caixa alta espaçada, valores). Nenhuma condensada. Todo texto é medido e reduzido para caber, em até 2 ou 3 linhas; títulos de 60 a 92 px, itens ≥ 40 px, nada abaixo de 30 px.
- **Moldura da pessoa:** sempre o vídeo inteiro reenquadrado dentro de uma porta, com batente de madeira. No quadro deitado, dois lugares: **tela cheia** (a tela é o vão da porta, a pessoa como foi gravada, arte no peito ou legenda) e **porta da direita** (a moldura da aula 9: apoiada no piso, do alto até o chão, o rosto no meio dela e a cabeça inteira; a parede da esquerda recebe o objeto). A pessoa troca de lugar nas fronteiras das batidas e a porta segue o rosto com ajuste suave. Gravação de longe aproxima mais dentro da porta; de perto, nada.
- **Cores, textura e som:** cimento queimado (parede), madeira clara (batente, réguas), preto fosco (ferragens, placas), papel (etiquetas, prancheta, recibo), latão (só metal) e **um verde** `#1E6B53` só para o que está acontecendo agora. **Terracota** `#A8452C` só para problema (alerta, risco, o lado que perde). Sombras curtas, sem brilho. Sons raros e tonais: duas notas graves na porta, toques de madeira nos ganchos, toques curtos nas chaves, nota grave no número, acorde no fechamento e a chave girando na fechadura.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Carla Dias" / "Psicóloga"): eles vão na placa preta do fechamento, onde a chave gira. Sem resposta, siga sem nome (o fechamento fica sem placa).

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

Números falados costumam vir escritos de jeitos estranhos ("478" para "4-7-8", "R$ 100,00" para "cem mil"). Anote-os: vão virar `correcoes` no passo 7.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" depois do fim.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala. Sem como ouvir, meça o volume (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio e sai; perto de −20 dB é fala e fica.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo, **as pausas entre as ideias viram cortes, e é nelas que a pessoa troca de porta** (o movimento esconde o pulo do corte). Mantenha a proposta do `preparar`: cada trecho de fala separado.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.43
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical). Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não passe `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a porta da direita acompanha quando a pessoa se mexe, com ajuste suave. Ele também mede o tamanho do rosto, e o modelo usa isso para aproximar o vídeo dentro da porta (o rosto ocupa ~40% da largura dela, com a cabeça inteira e folga em cima). Os avisos de "gravação bem perto da câmera" e de "queixo perto da zona" são normais: o modelo se ajusta, siga em frente.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Três quadros com guias: a cruz deve cair no rosto e a linha vertical fina mostra o centro do quadro; a caixa azul tracejada (artes no peito) deve começar abaixo do queixo; a verde é a **parede da esquerda** (blocos de parede e painéis); a laranja é a faixa do quadro de chaves; a lilás é a **porta da direita** (a moldura da pessoa); a amarela é a legenda; tudo acima da linha vermelha (controles do player). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, passos, número, comparação, tendência…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`item` com o quadro de chaves, ou `vezes`) entra **pelo menos uma vez**: veja "A assinatura em qualquer assunto".

Pense também na **gramática de layout** da aula 9: a tela cheia é a base. Blocos de peito (abertura, frase, destaque, definição, pergunta, fechamento) e os respiros com legenda deixam a pessoa em tela cheia; blocos de parede (lista, passos, número, comparação, gráfico), o "N×" e os itens a levam para a porta da direita, com o objeto na parede da esquerda. Abra a parede quando ela ajuda a entender e volte à tela cheia quando a ideia termina. Evite mais de ~15 s seguidos na parede.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO**. Nunca use `--forcar`: se ele reprovar, a edição está pobre; leia o trecho que ele aponta e dê um bloco a esse trecho;
- `node scripts/legendas.mjs` (as linhas de legenda só existem nos trechos sem momento).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Para cada momento: um quadro antes, um no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira: o texto cabe e está inteiro? Cada coisa entrou na palavra certa? A cabeça aparece inteira na porta da direita (se não, `pessoa.ancoraY`, em `references/plano.md`)? Algo cobre o rosto? A arte do peito fica abaixo do queixo e acima de y 984? A tela muda a cada 2 a 4 s nos blocos (tempo de leitura)? Confira também o **meio das trocas** (por exemplo `node scripts/stills.mjs 12.7 12.8 12.9`, em volta de cada `de`): o que sai e o que entra não aparecem um por cima do outro, e nenhum quadro mostra a pessoa solta numa parede vazia.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-chave.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é **ilustrativo** (gráfico sem números, conta sem valores);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | Tela cheia. A porta de duas folhas destrava e se abre (quando é o primeiro momento); o título se monta palavra por palavra numa etiqueta de papel deitada, larga, no peito; o `destaque` em verde. |
| lista | `topicos` | Porta da direita; na parede da esquerda, um quadro de chaves vertical: régua de madeira com pinos; cada item é uma etiqueta numerada que cai no pino e balança (verde na vez dele, papel com visto depois) e uma tira de papel com o texto, que ganha tinta palavra por palavra. |
| passos | `passos` | Porta da direita; na parede, a prancheta preta com prendedor de latão: cada passo tem um círculo numerado (tracejado → verde → preto com visto) e o traço verde desce de um passo ao outro, na ordem. |
| número | `numero` | Porta da direita; na parede, uma etiqueta de preço grande, pendurada num prego por um cordão: o rótulo em verde, o número contando em serifa, o traço verde que sublinha quando ele assenta. |
| comparação | `comparacao` | Porta da direita; na parede, duas etiquetas grandes num trilho de madeira; entre elas "×" (contra) ou a seta de latão (antes → depois, errado → certo). O vencedor fica verde com o visto; o outro leva o xis terracota. |
| gráfico | `grafico` | Porta da direita; na parede, um recibo de papel (serrilha embaixo, faixa verde em cima): barras de madeira que crescem (a última dita em verde), linha que avança ponto a ponto, rosca com legenda. Sem números: a curva a lápis inteira e a tinta verde correndo por ela, com a seta e o selo "ilustrativo". |
| destaque | `destaque` | Tela cheia. Uma placa larga aparafusada no peito: preta com filete e chave de latão (`chave`) ou terracota com o triângulo (`alerta`); o detalhe numa tira de papel embaixo. |
| definição | `definicao` | Tela cheia. A etiqueta do termo (em verde, sublinhado) e, presa nela por um cordão, ao lado, a etiqueta do significado, que cai e balança quando ele é dito. |
| frase | `frase` | Tela cheia. A etiqueta deitada, larga, no peito, palavra por palavra; `destaque` em verde, `risco` riscado em terracota quando é dito. |
| pergunta | `pergunta` | Tela cheia. A etiqueta com o selo "?" de latão; as opções em etiquetas menores penduradas embaixo, numa fileira, cada uma caindo na sua palavra (a da vez em verde). |
| fechamento | `cta` | Tela cheia. Uma régua sob o queixo com a etiqueta de ação balançando (ícone salvar, seguir, comentar ou link) e, ao lado dela, a chamada numa etiqueta deitada com a placa preta do nome embaixo, onde a chave entra na fechadura e gira. Faixa curta demais: a etiqueta de ação vira um selo dentro da chamada. |
| **assinatura** | `item` | A pessoa vai para a porta da direita e o quadro de chaves desce no alto da parede da esquerda, com uma etiqueta por parte do vídeo ("1 Perde", "2 Aula"); a da vez acende e balança. Embaixo dele, o painel da parte: `prancheta` (lista com vistos, ou miniaturas de cômodos), `conta` (linhas que somam num total; sem valores, num resultado) ou `chaveiro` (chaveiros que caem nos pregos, com ícone, número ou marca no couro). |
| **assinatura** | `vezes` | "N×": o número grande em serifa e N etiquetas que acendem uma a uma (repetições, parcelas, meses, dias), na parede da esquerda; a pessoa vai para a porta da direita. |
| abertura do demo | `porta` | Igual à `abertura`, com as linhas já quebradas e as etiquetinhas "1 2 3" na borda. |
| frase do demo | `placa` | Igual à `frase`, com rótulo em caixa alta. |

Qualquer forma de informação tem um bloco aqui. Fala sem números usa a versão ilustrativa (`grafico` com `tendencia`, `conta` sem valores).

## A assinatura em qualquer assunto

A assinatura do Chave é **"as partes do assunto viram chaves penduradas"**: o vídeo tem 1 a 4 partes grandes (os motivos, as fases, o problema e a solução), e cada uma vira uma etiqueta no quadro de chaves, com o seu painel embaixo. A `conta` serve para tudo que "soma num resultado"; o `chaveiro`, para opções ou "as chaves" de alguma coisa; a `prancheta`, para checagens. E o `vezes`, para qualquer contagem repetida.

1. **Finanças / cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende… Gravei uma aula gratuita explicando como eu analiso o mercado, os riscos e a escolha dos ativos."
   - `item` 1, etiqueta "Perde", título "Tem gente que perde", `conta` **sem valores**: Compra por impulso + Moeda sem critério + Risco que não entende, cada linha com o visto e o seu pedaço da barra; `total` "Perde, mesmo na alta" (a nota "ilustrativo" aparece sozinha).
   - `item` 2, etiqueta "Aula", título "Aula gratuita", `chaveiro`: O mercado (ícone `grafico`) · Os riscos (`alerta`) · A escolha dos ativos (`lupa`). O quadro mostra "1 Perde ✓ · 2 Aula": a estrutura do vídeo.
2. **Saúde / psicologia.** "Tenta a respiração 4-7-8: inspira contando até 4, segura contando até 7, solta contando até 8. Repete quatro vezes."
   - `vezes`: rótulo "Repete", `n` 4, unidade "vezes"; as quatro etiquetas acendem uma a uma.
   - Ou três `item` (etiquetas "Inspira", "Segura", "Solta"), cada um com um `chaveiro` de um chaveiro só, com `marca` "4", "7" e "8" no couro, caindo na palavra do número.
3. **Algo bem distante (relacionamento, história pessoal).** "O que segurou a gente foram três coisas: conversar antes de dormir, dividir as contas e um dia só nosso por semana."
   - `item` com `prancheta` sem desenho, título "O que segurou a gente": três linhas que ganham o visto. Ou `conta` sem valores com `total` "Um casal que dura".
   - "Eu pedi demissão três vezes antes de conseguir sair" → `vezes` com rótulo "Pedi demissão", `n` 3, etiquetas "1ª", "2ª", "3ª" nas palavras delas.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Impulso"), sem mudar o sentido.
- Não invente número, nome, preço, prazo, regra nem fato. Gráfico sem números ditos usa `tendencia` com `ilustrativo: true`; conta sem valores ditos fica sem `valor` (a nota "ilustrativo" aparece sozinha).
- Valores de exemplo (quando a pessoa diz "por exemplo") ganham `nota: "valores de exemplo"` na conta.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`. Faltou a assinatura: veja "A assinatura em qualquer assunto".
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano (ex.: `{ "478": "4-7-8" }`).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Cabeça cortada na porta da direita**: `"pessoa": { "ancoraY": 0.45 }` desce o rosto dentro da porta (o padrão é calculado pelo tamanho do rosto); `"zoom": 1.1` aproxima, `0.9` afasta.
- **Texto pequeno demais**: o bloco reduz o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o quadro 1920×1080 (ou é vertical); o vídeo sai menos nítido. Avise o usuário.
