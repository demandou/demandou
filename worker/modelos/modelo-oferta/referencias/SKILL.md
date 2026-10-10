---
name: modelo-oferta
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Oferta, a página de uma oferta premium que se monta na fala: cada entrega cai como um cartão com o objeto e encaixa na pilha de valor, na ordem da fala, o valor âncora bate na palavra, um risco vermelho o atravessa, ele encolhe para o canto e o preço real cai e bate grande em verde, o selo de garantia carimba, a régua da semana corre até o prazo e o botão leva um toque de dedo. A pessoa fica embaixo numa moldura larga; papel marfim, tinta verde profunda, vermelho só no risco. Serve para qualquer assunto (o exemplo é o lançamento de um curso, mas funciona com serviços, lojas, finanças, saúde, eventos, aulas gratuitas): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Oferta\", \"vídeo de venda\", \"anúncio de lançamento\", \"preço riscado\", \"de/por\", \"pilha de valor\", \"oferta com garantia\" ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Oferta

O vídeo vira a **página de uma oferta** impressa em papel marfim: em cima, a página se monta na fala; embaixo, a pessoa numa moldura larga. Cada entrega dita **cai como um cartão** com o objeto e encaixa embaixo da anterior, na ordem da fala; o valor de referência bate na palavra; no "hoje sai por", um **risco vermelho** atravessa a âncora, ela encolhe para o canto e o preço real **cai e bate grande** em verde, de uma vez; o **selo de garantia carimba**; a **régua da semana** corre até o último dia; o **botão** leva um toque de dedo. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com o lançamento de um curso ("valeria 997, hoje sai por 297"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** o que é entrega **cai** (aparece na palavra, cai 150 px acelerando, pousa 0,2 s depois com um quique curto, e os cartões de cima assentam 4 px); o resto entra macio e assenta; o preço **bate** (soco de 12%, a pilha pula, a câmera da pessoa aproxima 4%); o selo **carimba** (desce grande e inclinado, bate, deixa um anel de tinta). Nada fica parado: a etiqueta da abertura balança no fio, a gravura do fundo gira devagar, o preço respira, o selo balança 1°, o botão pulsa.
- **Organização e hierarquia:** a página em cima (y 132 a 966), a pessoa embaixo (a partir de y 1000). A pilha desce do alto na ordem da fala (a primeira entrega em cima) e usa a página inteira até o valor ser dito; aí ela se compacta e o cartão do preço sobe embaixo dela. Depois, o preço sobe para o alto (a "doca") e garantia, prazo e botão se montam embaixo dele: o fim do vídeo é um resumo da oferta. O preço é sempre a coisa maior da tela.
- **Tipografia:** uma família só, **Plus Jakarta Sans**: 800 nos títulos, nomes das entregas e preços (o "R$" pequeno e alto, algarismos tabulares), 700 nos rótulos ("Tudo isso valeria"), 600 nos detalhes; tracking −0,022em no 800 (nunca mais apertado que −0,035em nos números grandes). Etiquetas curtas em caixa alta com +0,1em.
- **Moldura da pessoa:** sempre a moldura larga embaixo (x 30 a 1050, cantos de 44 px), com a cabeça inteira e folga acima do cabelo, o rosto no eixo central e seguido quadro a quadro. Troca de escala (100% ↔ 106%) em corte seco; soco de 4% quando o preço bate e quando o selo carimba. A tarja de nome fica na costura, à esquerda, só nos primeiros segundos.
- **Cores, textura e som:** papel marfim (#F3EDE1) com uma gravura fina de certificado (linhas onduladas que se cruzam e deslizam devagar); cartões #FFFCF6; tinta e destaque **verde profundo** (#13573F / #0F3328); sálvia (#9DB9A8) no traço sob o preço; **vermelho (#C8372D) só no risco** da âncora (e no alerta). Nada de preto + dourado, néon, luz piscando, "BLACK FRIDAY", moedas, roleta ou cara de cassino. Sons tonais, raros e baixos: um "toc" de papel grosso quando a entrega pousa e quando a âncora bate, um deslize curto no risco, um acorde macio quando o preço bate, um "tum" grave no carimbo, um clique macio no toque.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Lucas Andrade" / "Mentor de Reels"): vão na tarja do começo. Sem resposta, siga sem tarja. Pergunte também se ele tem **fotos próprias** do produto ou das entregas (capa do curso, produto, ambiente): elas vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas. **Preço, valor de referência, prazo e garantia saem só da fala**: se a pessoa não disse um número, ele não aparece.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas com conteúdo diferente** (dois preços, dois prazos) não são uma tomada repetida: pergunte ao usuário qual fica. Deixe a pausa natural antes do preço ("hoje sai por… 297"): é o suspense da queda.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.49 --rosto-y 0.29 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo** (`modelo.json` fixa a gravação vertical em 9:16; a pessoa fica sempre na moldura de baixo). Refazendo o corte depois de já ter planejado, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo: a moldura acompanha quando a pessoa se mexe.

### 4b. Corrigir as palavras

Abra `src/plano.json` → `palavras` e corrija o que a transcrição errou **nos números, preços e nomes**, no lugar certo da lista: `"997,00"` → `"997."`, `"método"` → `"Método"` (nome de produto), `"7"` ↔ `"sete"`. O timing gate (passo 7) compara cada entrada com estas palavras. Apague palavras inventadas no silêncio.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto, com a cabeça inteira logo abaixo da linha rosa (a moldura, y 1000); o retângulo verde é a página; nada importante fora das linhas vermelhas (interface do app e margens de 64 px). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Numa fala de venda, ache:
- **a abertura**: o que abriu, lançou, chegou (e a palavra do produto, para a imagem da etiqueta);
- **as entregas**: cada coisa que a pessoa leva (módulos, bônus, sessões, itens, benefícios), com o instante da palavra que nomeia cada uma;
- **o valor de referência** ("valeria", "custava", "de", "normalmente") e **o preço** ("hoje sai por", "por", "só"), com os instantes do rótulo e do número;
- **a garantia** ("sete dias de garantia", "risco zero", "seu dinheiro de volta");
- **o prazo** ("só até domingo", "só hoje", "últimas vagas") e o dia, se for dito;
- **o fechamento** ("link na bio", "clica em saiba mais", "comenta EU QUERO").

Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`oferta`) entra pelo menos uma vez**, e a conferência pede pelo menos dois efeitos próprios (`oferta`, `garantia`, `prazo`): normalmente `oferta` + `garantia` ou `oferta` + `prazo`. Garantia, prazo e `cta` que começam logo depois da oferta (≤ 0,3 s) **continuam a página** (o preço sobe para o alto e eles se montam embaixo dele): planeje-os colados.

- **Sem preço falado** (aula gratuita, consultoria, "vagas abertas"): `oferta` com `preco.texto` ("Gratuita", "Vagas abertas", "Bônus") e sem `ancora`; o texto bate grande em verde.
- **Sem valor de referência**: só `preco` (o preço bate, sem risco nem queda).
- **Valor de referência sem número** ("o que eu gastei em 3 anos"): `ancora.texto` riscado; ele encolhe para o canto e o preço bate (modo ilustrativo).
- **Sem entregas listadas**: `oferta` com `itens` vazio vira só o drama do preço; ou use os benefícios ditos como entregas.
- **Vídeo que não vende nada**: a pilha é "o que você leva" de qualquer coisa (o que uma aula ensina, o que um hábito dá, o que uma viagem incluiu) e o "preço" é o custo dito (tempo, esforço, "de graça"). Veja "A assinatura em qualquer assunto".

### 6b. Imagens

Leia `references/imagens.md`. Cada entrega fica melhor com **o objeto dela** (a capa do curso num notebook, a pasta de roteiros, o fone da mentoria, o produto, a caixa do kit). Sem imagem boa, use `icone` (lista em `references/plano.md`) ou nada (o selo com o número do item).

1. Liste as entregas que são coisas e a imagem da abertura (o produto). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "open laptop video lesson"), `tipo` (`foto` ou `objeto`) e `arquivo` quando vier da pasta `imagens/`.
   - Nada de pessoa, logo, marca ou texto na imagem. As entregas ficam lado a lado na pilha: prefira imagens **do mesmo estilo** (todas fotos de produto em fundo claro, ou todas objetos 3D).
   - Se o usuário tem um gerador de imagens, pode gerar as entregas **numa imagem só em grade 2×2** (mesmo estilo, fundo creme liso, tons de creme e verde, **sem texto, sem logo e sem pessoas**) e recortar cada quadrado em `imagens/`. Foi assim que o exemplo foi feito.
2. `node scripts/imagens.mjs --lado 1000`. Leia os avisos.
3. Abra `work/imagens.jpg`. Escolha a candidata que mostra a coisa inteira, reconhecível em 1 s, sem gente, logo ou texto.
4. `node scripts/imagens.mjs --escolher <id> <n>`. Nenhuma serve: `--refazer <id> --busca "outro termo"`, ou use `icone`.
5. `node scripts/imagens.mjs --folha`; depois `--limpar`.
6. Nas entregas, `imagem: { "id": "curso" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada entrega, rótulo, número, carimbo, dia e toque entra no `em` da palavra, tirado de `palavras`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: o **timing gate**. Cada entrada precisa cair a ±0,15 s da palavra que a nomeia (entrega, rótulo, número, carimbo, dia, toque); corrija até sair **APROVADO**. "Confira no quadro" = o texto da tela não é a palavra dita (resumo): olhe o quadro daquele instante no passo 8;
- `node scripts/legendas.mjs`: lista as linhas de legenda (que só aparecem nos momentos com `legenda: true`).

**O fim do vídeo**: o vídeo deve terminar ~0,3 s depois da última palavra: ponha em `duracao` (e no `ate` do último momento) o fim da última palavra + 0,3 s. O toque do botão precisa acontecer pelo menos 0,4 s antes do fim.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros **reduzidos à largura de um celular (~540 px)** e confira de verdade (peça também quadros 0,3 s depois de cada entrega, no risco, no meio da queda, 0,3 s depois do preço, no carimbo e no toque):
- cada entrega cai **na palavra dela**, com a imagem certa, e o nome cabe em até 2 linhas?
- o valor e o preço são **exatamente os ditos**? O risco atravessa a âncora antes da queda? O preço é a coisa maior da tela?
- o selo mostra só o que foi dito ("7 dias"; sem número dito, o escudo)?
- o dia que acende é o dito? O botão tem o texto dito e o dedo não cobre o texto?
- legenda (quando houver) abaixo do queixo; nada encostado nas margens de 64 px, nada importante abaixo de y 1700;
- a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-oferta.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho) e o maior desvio do timing gate;
- as **imagens usadas** e de onde vieram (e o texto do `creditos.txt` quando houver CC BY);
- o que é ilustrativo;
- o que o usuário deve conferir (o preço e o valor de referência, o prazo, o texto do botão).

## Blocos deste modelo

Todos os blocos acontecem **na página** (em cima); a pessoa fica embaixo o tempo todo.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | a **etiqueta de produto** pendurada por um fio: cai do alto, balança em volta do furo e fica oscilando de leve; dentro, a imagem do produto (opcional, na palavra dela) e o título que se monta na fala, o `destaque` em verde |
| lista | `topicos` | a **pilha**: cada item cai como um cartão de entrega (objeto ou ícone à esquerda, nome à direita; sem os dois, um ✓) e encaixa embaixo do anterior, na ordem da fala; o título vira a etiqueta do alto |
| passos | `passos` | os mesmos cartões caindo em ordem, com o número do passo no selo |
| número | `numero` | o **cartão de preço**: número enorme em verde contando (o "R$"/"US$" pequeno e alto), traço sálvia embaixo, rótulo montando na fala |
| comparação | `comparacao` | duas etiquetas lado a lado; o `vencedor` ganha a borda verde e o ✓, o outro é **riscado em vermelho** e apaga |
| gráfico | `grafico` | num cartão de papel: barras verde profundo/sálvia que sobem, linha que se desenha ou rosca; sem números ditos, a curva da tendência com a etiqueta "ilustrativo" |
| destaque | `destaque` | a frase grande num cartão com borda verde e selo de estrela (`chave`), ou borda e texto vermelhos com "!" (`alerta`) |
| definição | `definicao` | o termo enorme com um traço verde que se desenha embaixo; o significado num cartão, palavra por palavra |
| frase | `frase` | a frase num cartão com o selo de aspas, palavra por palavra; `destaque` em verde, `risco` **riscado em vermelho** (como a âncora) |
| pergunta | `pergunta` | com `opcoes`: a pergunta no alto e as opções caindo como cartões com letra; sem opções: a pergunta sob um "?" num anel que gira |
| fechamento | `cta` | o **botão**: pílula verde com o ícone num círculo marfim, o texto dito e uma seta; o dedo chega e **toca** a seta no `toqueEm`, o botão afunda e uma onda se espalha |
| **assinatura** | `oferta` | a pilha de entregas (na ordem da fala) + o cartão do preço: âncora que bate na palavra, risco vermelho, âncora pequena no canto, preço que cai e bate em verde (sem números intermediários) |
| próprio | `garantia` | o **selo** recortado verde que carimba (texto em volta, "7 DIAS" no centro ou o escudo); na doca, voa para o canto do cartão do preço e fica só com o centro ("7 DIAS" grande) |
| próprio | `prazo` | o cartão do prazo: a frase dita + a **régua da semana** que corre até o dia dito (que acende); sem dia, uma barra de tempo que esvazia com um relógio |

## A assinatura em qualquer assunto

A oferta é **"tudo isto vale muito; o que você paga é bem menos"**: qualquer fala que soma o que alguém ganha e compara com o custo vira a pilha + o preço. O "preço" pode ser dinheiro, tempo, esforço ou "de graça"; a âncora é sempre a referência que a pessoa disse.

1. **Finanças/cripto.** "Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro."
   `oferta` com `itens` "O mercado", "Os riscos", "A escolha dos ativos" (ícones `grafico`, `escudo`, `moeda`, cada um na palavra dele) e `preco: { "texto": "Gratuita", "rotulo": "Uma aula", "em": <"gratuita"> }`, sem âncora; logo depois, `garantia` com `texto: "sem promessa de lucro"` (o escudo no centro, sem número). Nenhum número de lucro aparece.
2. **Saúde ou rotina.** "Com 20 minutos por dia você ganha mais disposição, sono melhor e menos dor nas costas. Uma academia cobraria 150 por mês; isso é de graça."
   `oferta` com as três entregas (ícones `estrela`, `calendario`, `check`), `ancora: { "valor": 150, "prefixo": "R$", "sufixo": "/mês", "rotulo": "Uma academia cobraria" }` e `preco: { "texto": "De graça" }`: a âncora riscada cai e "De graça" bate em verde. "20 minutos por dia" pode virar um `numero` antes.
3. **Algo bem distante (carreira, relacionamento, história pessoal).** "Eu saí do emprego e ganhei tempo com meus filhos, saúde e paz. O preço foi um ano de aperto."
   `oferta` com as entregas "Tempo com meus filhos", "Saúde", "Paz" (ícones `comunidade`, `estrela`, `check`) e `preco: { "texto": "Um ano de aperto", "rotulo": "O preço foi" }`. Sem número dito, sem `ancora`. Se ela disser "só até eu decidir de novo", vira `prazo` sem dia.

Sem oferta no vídeo? Procure o "você leva", o "inclui", o "de graça", o "custa só", o "valeu cada centavo", o "eu paguei X e ganhei Y"; toda fala que lista ganhos cabe na pilha. Toda edição tem uma `oferta`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela ("o curso completo" vira "Curso completo"; "trinta roteiros prontos" vira "30 roteiros prontos").
- **Nunca mostre um preço, desconto, porcentagem, valor por item, número de vagas ou prazo que não foi dito**, nem números de passagem (contagem de 997 até 297). Nada de "−70%", "economize", contador de horas inventado ou "últimas 3 vagas". Preço por item (`preco` da entrega) só se for falado.
- A âncora é a referência que a pessoa disse ("valeria", "custava", "de"); se ela não disse, não há âncora nem risco.
- A garantia mostra só o que foi dito ("7 dias"); sem número dito, o escudo.
- A imagem ilustra o que foi dito; nada de marca, logo de plataforma de pagamento, pessoa real ou print que a fala não citou.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Se ele pedir "dois efeitos próprios", acrescente a `garantia` ou o `prazo` que a fala tiver (ou uma garantia/prazo sem número: "sem risco", "só hoje"). Não use `--forcar`.
- **Timing gate fora**: a palavra em `palavras` está errada (corrija no passo 4b) ou o `em` está noutra palavra. Entrega = a palavra que a nomeia; preço = a palavra do número; risco = o começo do rótulo do preço.
- **O nome da entrega não cabe**: o cartão reduz o corpo até 28 px e quebra em 2 linhas; se ficar apertado, encurte com as palavras da fala (até ~28 caracteres).
- **Mais de 5 entregas**: a pilha mostra 5. Junte as menores ("3 bônus") ou divida em duas ofertas.
- **O preço ficou pequeno**: número longo ("R$ 1.997,90") reduz até caber; prefira o que foi dito sem centavos.
- **A imagem tem fundo, texto ou marca d'água**: outra candidata, um `icone` ou nenhuma imagem (o selo com o número).
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
