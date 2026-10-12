---
name: modelo-autoridade-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Autoridade. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Autoridade: sóbrio e editorial, como uma revista séria. A pessoa fica em quadro cheio, centralizada; um destaque por vez entra na altura do peito em serifada marfim que sobe de trás de uma máscara, com itálico e filetes de latão, e o cartão de papel com marca-texto (o documento que sustenta a fala). Azul-marinho, marfim e latão, quase nenhum som. Serve para qualquer assunto (o exemplo do modelo é direito do consumidor, mas funciona com finanças, cripto, saúde, receitas, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Autoridade\", \"estilo autoridade\", \"edição sóbria\", \"profissional\", \"séria\" ou \"elegante\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa em tela cheia como base; nos blocos de apoio, a pessoa numa moldura à direita e o bloco no quadro à esquerda)."
---

# Modelo Autoridade (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Autoridade no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: as mesmas fontes, cores, o papel com filete de latão, o marca-texto, a entrada por máscara palavra por palavra, os mesmos sons e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** A pessoa fala em quadro cheio, como foi gravada. Os blocos de destaque (`abertura`, `numero`, `destaque`, `frase`, `pergunta` sem opções, `cta` e o `gancho` do exemplo) entram na **altura do peito**, abaixo do queixo, como no vertical, com o degradê escuro subindo de baixo. A faixa do peito no quadro deitado é larga e baixa (cerca de 1400 × 250 a 370 px): os blocos se arrumam em **fileira** (o sinal de alerta e as aspas ao lado do texto, a assinatura do fechamento ao lado da chamada, as linhas curtas do gancho juntas) em vez de uma pilha alta.
- **A moldura à direita, o quadro à esquerda.** Quando o bloco pede apoio visual (`citacao`, `definicao`, `grafico`, `topicos`, `passos`, `comparacao`, `pergunta` com opções e os `lista` e `contraste` do exemplo), a pessoa encolhe para uma **moldura do lado direito** (576 × 776 px, com o filete de latão em cima, como o papel), com o rosto centralizado e acompanhado suavemente (o rastro do `cortar.mjs`, sem saltos), e o bloco ocupa o **quadro do lado esquerdo** (1072 × 776 px), sobre o fundo tinta. Terminada a ideia, a pessoa volta à tela cheia. Blocos de quadro seguidos mantêm a pessoa na moldura (sem vaivém); um bloco de peito curto (menos de ~1,6 s) entre dois de quadro também entra no quadro.
- **Você não escreve posição.** O template decide o lugar de cada bloco pelo tipo; o plano é o mesmo do vertical. Gravação com o queixo muito baixo (sem lugar no peito nem ao lado da pessoa): os blocos de destaque também vão para o quadro, e nada cobre a pessoa.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **Margens do YouTube:** 96 px nas laterais, a legenda na área segura de baixo (y 912), nada importante abaixo de y 984 (controles do player).

O vídeo vira uma página de revista séria em movimento: a pessoa fala em quadro cheio, com calma, e a edição só aparece quando tem algo a dizer. Cada ideia entra na altura do peito (ou, quando pede apoio visual, no quadro da esquerda, com a pessoa na moldura da direita), uma por vez, em serifada marfim que sobe de trás de uma máscara, com o latão marcando o que importa. Quando a fala se apoia num "documento" (uma lei, um estudo, uma receita, a ficha de uma aula), ele entra como um cartão de papel com marca-texto.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um advogado, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** o texto sobe de trás de uma máscara e assenta (sem quique, sem elástico, sem giro, sem brilho); títulos e frases se montam palavra por palavra na fala; itens entram cada um na sua palavra e os anteriores recuam; filetes de latão se desenham; o marca-texto passa como uma caneta; números contam até o valor dito; o papel sobe e cobre o cartão quando a opção é dita. Na saída, o bloco apaga subindo de leve antes do próximo entrar (nunca dois blocos ao mesmo tempo). O zoom da pessoa troca seco (1 ↔ 1,05) nos cortes e nas fronteiras dos momentos.
- **Organização e hierarquia:** **um destaque por vez**: na tela cheia, centralizado na altura do peito, abaixo do queixo, numa fileira larga; nos blocos de apoio, centralizado no quadro da esquerda, ao lado da moldura com a pessoa. Uma coisa grande (o número, o título, o termo) e o resto menor. Letreiro em caixa alta espaçada para o rótulo, serifada grande para o que se lê, filete fino para separar. Listas com travessão de latão (tópicos) ou numerais de latão ligados por um fio (passos); documentos e gráficos no cartão de papel com filete de latão em cima.
- **Tipografia:** Instrument Serif (títulos, números, listas, documentos; o itálico é a ênfase) e Inter (letreiros em caixa alta espaçada e a legenda). Títulos de 72 a 132 px, texto de corpo ≥ 44 px, letreiros ≥ 30 px. Todo texto é medido com a própria fonte e reduzido para caber, em até 2 ou 3 linhas; listas e fichas longas rolam em vez de encolher.
- **Moldura da pessoa:** dois lugares. **Quadro cheio**, como foi gravado, seguindo o rosto quando ela se mexe, com o degradê escuro subindo na metade de baixo só enquanto há texto para ler; ou a **moldura da direita**, um retrato com o filete de latão em cima e sombra suave, com o rosto no centro dela (o vídeo aproxima até o rosto ocupar ~36% da largura da moldura) e acompanhado com ajuste suave. A troca entre os dois é um movimento contínuo de ~0,5 s: o vídeo encolhe para a direita e revela o quadro (o bloco nunca passa por cima do rosto). Nada cobre o rosto.
- **Cores, textura e som:** tinta `#0E1726` (marinho quase preto), papel `#F2ECDF` (marfim), latão `#B9975B` (e `#D6B57C` para texto sobre o escuro) = a ênfase, uma coisa dourada por bloco. Lacre `#C8664E` (vermelho de cera de selo) só no alerta, no risco e no lado errado. Sem contorno nas letras, sem brilho atrás da pessoa. Som quase ausente e tonal: um tom grave no número, no alerta e no fechamento, um deslizar grave quando o papel entra, uma nota curta em cada item.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; o projeto, ~1 GB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Dra. Ana Lima — Direito de Família"): viram a assinatura do fechamento. Sem resposta, siga sem assinatura.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições. Itens marcados `[sem transcrição: ouça antes de tirar]` podem ser fala que a transcrição perdeu: só tire se confirmar que não há fala.

**Duas versões completas com conteúdo diferente** (dois finais com chamadas diferentes) não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, escolha pela lógica de onde o vídeo vai ser postado ("toque em Saiba Mais" só existe em anúncio; num Reel orgânico, "comenta" ou "segue") e, na dúvida, fique com a última. Diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam. Só as pausas longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.52 --rosto-y 0.34 --queixo-y 0.45
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O formato já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); a `zona` é a faixa do peito, do queixo (com folga) até a base. Gravação vertical vira uma faixa deitada em volta do rosto (para a melhor imagem, grave deitado). Não precisa passar `--recorte`. Leia os avisos que ele imprime.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo: o quadro acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a cruz deve cair no rosto; a caixa azul tracejada (a faixa do peito, onde entram os blocos da tela cheia) deve começar abaixo do queixo; as caixas laranja são o quadro da esquerda (blocos de apoio) e a moldura da direita (a pessoa); a amarela é a legenda; nada importante abaixo da linha vermelha (controles do player). Se a cruz não estiver no rosto, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida (2 a 5 s, uma ideia) ganha uma forma (lista, número, comparação, definição…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo" abaixo. A assinatura (`citacao`, o cartão-documento) entra **pelo menos uma vez**: veja "A assinatura em qualquer assunto".

Na gramática do Autoridade deitado, a tela cheia é a base (aula 9): o ritmo vem de um bloco por batida, cada um entrando na fala, do zoom que troca nas fronteiras e da ida da pessoa para a moldura quando a explicação pede apoio visual (documento, lista, gráfico, comparação). Alterne: um destaque no peito, um bloco de apoio no quadro, um respiro. Respiros só com a pessoa e a legenda são bem-vindos (no completo, de 1 a ~8 s).

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs`: lista as linhas de legenda com o tempo e marca linha com palavra sozinha ou terminando em "de", "e", "um"; corrija o que der (uma correção, uma faixa de `semLegenda`).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um logo depois. Olhe cada imagem a ~960 px de largura (o vídeo deitado é visto numa tela maior) e confira: o texto cabe e está inteiro, sem erro de digitação ou acento? Nada cobre o rosto? Na moldura da direita, o rosto está no centro e a cabeça inteira? Nada abaixo de y 984 (controles do player)? Um bloco por vez (nada sobreposto na troca)? A tela muda de verdade a cada 1,5 a 2,5 s? O cartão de papel nunca aparece em branco? A legenda some quando o bloco entra e volta quando ele sai, sem palavra faltando? Para um instante específico (o meio de uma troca): `node scripts/stills.mjs 12.4 18`.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-autoridade.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- o que é **ilustrativo** (gráfico sem números ditos);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma versão escolhida no lugar dele).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | (peito) Título serifado grande, centralizado no peito, montado palavra por palavra na fala; o `destaque` em itálico latão ganha um filete de latão que se desenha embaixo. Letreiro opcional (`rotulo`) entre dois filetes. |
| lista | `topicos` | (quadro) Linhas serifadas separadas por fios finos, cada uma com um travessão de latão; entra na sua palavra e as anteriores recuam. Com muitos itens, a lista rola. |
| passos | `passos` | (quadro) A mesma lista com numerais serifados de latão (1, 2, 3…) ligados por um fio que se desenha de um passo ao seguinte. |
| número | `numero` | (peito) Numeral serifado enorme em latão contando até o valor dito; prefixo (US$, R$) e sufixo (dias, %, mil) em marfim; o rótulo em letreiro ao lado ou em serifada embaixo; barrinhas que preenchem uma a uma (`marcadores`) em contagens pequenas. |
| comparação | `comparacao` | (quadro) Dois cartões de contorno fino lado a lado, com "×" ou "→" entre eles; cada lado se enche de papel quando é dito. O vencedor ganha o filete de latão e um visto; o outro devolve o papel e apaga (no modo errado-certo, com um × de lacre). |
| gráfico | `grafico` | (quadro) Recorte de jornal: o gráfico impresso em tinta no cartão de papel, com o dado principal em latão. Linha que avança ponto a ponto, barras que crescem na palavra, anel que se fecha fatia por fatia. Sem números ditos: a curva da tendência (sobe, cai, oscila) com a etiqueta "ilustrativo". |
| destaque | `destaque` | (peito) Uma palavra ou frase curta em serifada bem grande, montada na fala. `chave`: itálico latão com filete. `alerta`: marfim, com o sinal de alerta desenhado ao lado do texto e o traço em lacre. Detalhe opcional embaixo, em Inter. |
| definição | `definicao` | (quadro) Verbete no cartão de papel: o termo em serifada grande; quando o significado é dito, um filete de latão se desenha, o significado se escreve palavra por palavra e o marca-texto passa por baixo. |
| frase | `frase` | (peito) Citação de revista: aspas de latão desenhadas ao lado da frase e a frase em serifada marfim, palavra por palavra; `destaque` em itálico latão; `risco` riscado em lacre quando é dito (como a caneta do revisor). |
| pergunta | `pergunta` | (peito sem opções; quadro com opções) A pergunta se monta em serifada; as opções são cartões de contorno que se enchem de papel quando ditas (2 lado a lado, 3 em linha ou empilhadas, 4 em grade). Sem opções, um filete de latão fecha a pergunta. |
| fechamento | `cta` | (peito) O ícone do pedido se desenha (salvar, seguir, comentar, link), a chamada em serifada marfim na fala (o `destaque` em itálico latão) e, ao lado dela, depois de um fio vertical, a assinatura com nome e área. |
| **assinatura** | `citacao` | (quadro) O cartão-documento: papel marfim com filete de latão, a fonte em letreiro, o título serifado e um trecho com marca-texto que passa quando a ideia é dita (`texto` + `grifo`) **ou** uma ficha cujas linhas se escrevem uma a uma na fala (`itens`), já pautadas a lápis antes de serem ditas. |
| do exemplo | `gancho`, `lista`, `contraste` | Os blocos do vídeo de exemplo continuam funcionando (título em linhas no peito, com as linhas curtas juntas numa fileira; lista numerada com ícones e pergunta com duas saídas no quadro). Para vídeos novos, prefira os universais acima. |

(peito) = tela cheia, na altura do peito; (quadro) = no quadro da esquerda, com a pessoa na moldura da direita. Qualquer forma de informação tem um bloco aqui. Fala sem números usa `grafico` com `tendencia` (ilustrativo), `comparacao`, `topicos` ou o `citacao` em modo ficha.

## A assinatura em qualquer assunto

A assinatura do Autoridade é **"o documento que sustenta a fala"**: o cartão de papel em que a ideia fica registrada, como uma página citada numa revista séria. Não precisa ser uma lei: qualquer coisa que a pessoa apresenta como base, regra, lista, ficha ou plano vira um documento. Use `texto` + `grifo` quando há um trecho a sublinhar; use `itens` quando a fala enumera o conteúdo do documento.

1. **Finanças / cripto.** "Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro."
   - `citacao` com `titulo: "Aula gratuita"` e `itens`: "Como eu analiso o mercado" · "Os riscos" · "A escolha dos ativos" · "Sem promessa de lucro", cada linha no `em` da sua palavra; `grifo: "Sem promessa de lucro"` no fim. A ficha da aula se preenche enquanto ele fala.
2. **Saúde / rotina.** "A recomendação é simples: 150 minutos de atividade por semana, uns 20 minutos por dia."
   - `citacao` com `fonte: "A recomendação"`, `titulo: "150 minutos"`, `texto: "de atividade por semana, uns 20 minutos por dia"`, `grifo: "20 minutos por dia"` no `em` de "20".
3. **Algo bem distante (receita, relacionamento, história pessoal).**
   - Receita: "pro molho você precisa de dois tomates maduros, meia cebola e um fio de azeite" → `citacao` `fonte: "Ingredientes"`, `titulo: "Molho de tomate"`, `itens`: "2 tomates maduros" · "Meia cebola" · "Um fio de azeite". A ficha de receita se escreve na fala.
   - Relacionamento: "Combinamos três regras: ninguém dorme brigado, celular fora da mesa e um programa a dois por semana" → `citacao` `fonte: "O nosso combinado"`, `titulo: "Três regras"`, com as três regras como `itens`.

## Fidelidade

- Tudo na tela vem da fala. Pode resumir com as palavras dela ("compra por impulso" → "Impulso"), sem mudar o sentido.
- Não invente número, nome, preço, taxa, lei nem fato. Texto literal de lei, norma ou estudo só se o usuário forneceu o texto ou se você tem certeza dele; na dúvida, o `texto` do documento é um resumo fiel do que a pessoa disse.
- Gráfico sem números ditos só com `tendencia` e `ilustrativo: true`; a etiqueta "ilustrativo" aparece sozinha. Nenhum número inventado vai para a tela.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um bloco para ele (`references/adaptar.md`, passo A). Trecho longo num bloco só: divida em dois ou acrescente itens com `em`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome, termo ou número**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais**: o bloco reduz o texto para caber; passou do limite de `references/plano.md`. Encurte com as palavras da fala ou divida em dois blocos.
- **O papel aparece sozinho por um instante antes do título**: o `em` do título (ou do termo) está longe do `de`. Comece o momento perto da palavra.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o quadro deitado; o vídeo sai menos nítido. Avise o usuário.
- **A pessoa vai e volta da moldura o tempo todo**: blocos de quadro e de peito alternando a cada 1 ou 2 s. Junte as ideias de apoio seguidas (um documento e a lista que o explica) ou deixe um respiro com a legenda entre elas.
