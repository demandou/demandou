---
name: modelo-campo
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Campo, o caderno de campo do agro: a vista de cima (foto de drone ou mapa de lavoura desenhado) com os talhões contornados em amarelo de sinalização na fala, o cartão de cotação com mini-gráfico, o medidor que esvazia até a fração dita, a faixa de previsão do tempo e a planilha do fechamento, sobre palha com curvas de nível e números em mono. A pessoa fica embaixo, numa moldura larga. Serve para qualquer assunto (o exemplo é tomate em estufa, mas funciona com pecuária, máquinas, cooperativas, finanças, saúde, histórias): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Campo\", \"edição agro\", \"vídeo de lavoura, pecuária ou safra\", \"estilo caderno de campo\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Campo

O vídeo vira o caderno de campo de um agrônomo: a pessoa embaixo, numa moldura larga, e em cima o **painel de campo** sobre um chão de palha com curvas de nível que derivam devagar. A assinatura é o **talhão**: a vista de cima (foto de drone/satélite, ou um mapa de lavoura desenhado) em que os talhões se contornam em amarelo de sinalização enquanto a pessoa fala, e a câmera de drone voa até o talhão da vez, que acende com a mira de levantamento. Junto vêm os instrumentos do painel: a **cotação** (indicador com mini-gráfico), o **medidor** (reservatório que vai até a fração dita) e a **previsão** (faixa do tempo com o que está chegando). Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com "a caixa do tomate subiu 30%", mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a câmera de drone que pousa. Cada cartão entra descendo sobre o painel (escala 1,05 → 1 em 0,36 s, sem passar do ponto) e continua vivo por dentro: a foto se aproxima devagar, o contorno amarelo corre em volta de cada talhão, a água do medidor ondula e uma gota cai do gotejador, a chuva cai, o braço do pivô gira, as curvas de nível do fundo derivam. A mira de levantamento (quatro cantos que chegam de fora e travam) marca o que acabou de ser dito. Trocas: o bloco que sai some em 0,14 s enquanto o próximo pousa. Nada de giro, tremida, flash ou brilho atrás da pessoa.
- **Organização e hierarquia:** a tela é sempre dividida: o **painel** em cima (x 64 a 1016, y 132 a 976) e a **moldura da pessoa** embaixo (a partir de y 1012). Nos instrumentos com foto, a foto ocupa a faixa de cima do painel (372 px) e o cartão do instrumento fica embaixo dela. Títulos curtos no alto, alinhados à esquerda com a fita amarela; nos títulos de frase (talhão, previsão), centrados, com a quebra antes do trecho grifado. Um bloco por vez.
- **Tipografia:** **Plus Jakarta Sans** 800 para títulos e chamadas (40–108 px, tracking −0,02em), 700 para itens e texto corrido (28–56 px); **Fira Mono** 700 para todo número, rótulo de instrumento e etiqueta (caixa alta curta: "CAIXA DO TOMATE", "SEMANA QUE VEM", "ILUSTRATIVO"). Nada condensado.
- **Moldura da pessoa:** sempre embaixo, larga (x 36 a 1044, cantos de 40 px, os de baixo fora do quadro), com borda creme, a cabeça inteira e ~60 px de folga acima do cabelo, o rosto no eixo central e seguido quadro a quadro. Troca de escala em corte seco (100% ↔ 106%) só quando o trecho anterior durou mais de 1 s; soco de 4% quando um número bate. A tarja (nome e área) fica no terço de baixo da moldura, à esquerda, de 0,25 s a ~2,6 s.
- **Cores, textura e som:** palha (#EFE9DA) com curvas de nível, cartões creme (#FFFDF7) com cabeçalho **verde-lavoura** (#1F5A2A / #2F7A3A), **terra** (#9A5B2E) para o solo, o que cai e o lado ruim, **céu** (#3D8FCC) para água e chuva, e **um amarelo de sinalização** (#F4BE1B) só para contorno de talhão, mira, grifo e palavra-chave. Sons tonais, raros e baixos: um "toc" de madeira quando os talhões se contornam, notas de kalimba nos itens, duas notas subindo quando um número bate, uma gota no nível do medidor.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Lucas Ferraz" / "Engenheiro agrônomo"): vão na tarja do começo. Sem resposta, siga sem tarja. Pergunte também se ele tem **imagens próprias** (foto de drone da fazenda, do rebanho, da máquina, do produto): vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas. Pergunte a **palavra-chave e a promessa do fechamento** se a fala tiver um "comenta X".

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

### 3. Escolher as tomadas (ritmo e cortes)

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica.

O ritmo do Campo é de fala corrida: a primeira palavra sai em ≤ 0,1–0,3 s, o respiro entre frases fica entre 0,2 e 0,4 s (o `cortar.mjs` já faz isso) e o vídeo termina na última palavra. Só corte seco.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.43
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo** (`modelo.json` fixa a gravação vertical em 9:16; a pessoa fica sempre na moldura de baixo). Refazendo o corte depois de já ter planejado, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo: a moldura acompanha quando a pessoa se mexe.

### 4b. Corrigir as palavras

Abra `src/plano.json` → `palavras` e corrija o que a transcrição errou, **no lugar certo da lista** (o `work/palavras.json` é a cópia original):
- troque o texto errado ("que é a planilha" → "Quer a planilha"; apague a palavra que sobrou);
- números ditos por extenso ficam como foram transcritos ("30%"); o timing gate aceita "trinta" e "30";
- **confira o começo das palavras que vão ganhar inserção** (o número, a coisa nomeada, o clima, a palavra-chave). O Whisper costuma marcar palavras depois de uma consoante surda ou no fim de frase com 0,1–0,4 s de erro. Meça o volume do trecho (`ffmpeg -ss <de> -t 1 -i public/base.mp4 -af volumedetect -f null -`, ou olhe a forma de onda): o "t" de "trinta" é um silêncio curto seguido de um estalo, o "ch" de "chuva" é um chiado. Ponha o `em` no começo real da palavra.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto, com a cabeça inteira logo abaixo da linha rosa (a moldura, y 1012); a linha roxa é o topo da tarja e a amarela o centro da legenda (as duas abaixo do queixo); o retângulo verde é o painel; nada importante fora das linhas vermelhas (interface do app e margens de 64 px). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida ganha uma forma e um bloco **deste modelo** (tabela "Blocos deste modelo"). Procure, nesta ordem:

- **um lugar, um conjunto ou "olha isso"** → `talhao` (a assinatura entra pelo menos uma vez; num vídeo de mais de 20 s, a conferência pede pelo menos dois efeitos próprios: `talhao` + `cotacao`, `medidor` ou `previsao`);
- **um preço, índice, cotação ou valor que subiu/caiu** → `cotacao`;
- **uma fração ou proporção dita** ("metade", "um terço", "o dobro") → `medidor`;
- **algo que está chegando** (chuva, frente fria, safra, alta, crise, prazo) → `previsao`;
- **uma oferta de material** ("quer a planilha / o guia / a lista?") → `cta` com `material`; pergunte ao usuário os itens que o material tem (vão em `linhas`, sem números) ou use o arquivo sem `linhas`;
- **uma comparação sem números** ("colheu mais", "rende mais") → `grafico` de barras com `rotulos` dos dois lados e `ilustrativo`;
- o resto com os blocos universais.

### 6b. Imagens

Leia `references/imagens.md`. No Campo, imagem é para **a coisa dita**: a vista de cima do lugar (fazenda, estufa, pasto, cidade, bairro), o produto ou objeto da cotação (caixa de tomate, saca de café, boi, moeda), o contexto do medidor (gotejamento, cocho, tanque). Sem imagem boa, o bloco funciona sem ela (o talhão vira o mapa desenhado, com "ilustrativo"; a cotação e o medidor ocupam o painel inteiro).

1. Liste as coisas que merecem foto e escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "aerial view greenhouses", "wooden crates tomatoes", "drip irrigation tomato plant"; bicho e planta pelo nome científico), `tipo: "foto"` e `arquivo` quando vier da pasta `imagens/`.
   - Nada de pessoa famosa, marca, logotipo ou texto. Foto aérea: de cima, sem rótulos de mapa.
   - Se o usuário tem um gerador de imagens, pode gerar as fotos (sem texto e sem logo) e pôr em `imagens/`.
2. `node scripts/imagens.mjs --lado 1600`. Leia os avisos.
3. Abra `work/imagens.jpg`. Escolha a candidata que mostra a coisa inteira, reconhecível em 1 s, sem gente, logo ou texto.
4. `node scripts/imagens.mjs --escolher <id> <n>`. Nenhuma serve: `--refazer <id> --busca "outro termo"`, ou fique sem imagem.
5. `node scripts/imagens.mjs --folha`; depois `--limpar`.
6. **Talhões da foto aérea:** abra a foto com uma grade (a `work/imagens.jpg` ou um quadro de `stills.mjs`) e marque cada talhão como retângulo em frações da imagem (`x`, `y` = canto de cima à esquerda; `w`, `h`), de 2 a 12 talhões, seguindo as divisas que se veem (estradas, cercas, carreadores). Sem `areas`, a foto aparece só com a mira, sem contornos.
7. Nos momentos, `imagem: { "id": "estufas" }` (e `foco` se a coisa não estiver no meio). Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada contorno, talhão marcado, número, nível, clima e palavra-chave entra no `em` da palavra, tirado de `palavras`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: o **timing gate**. Cada entrada precisa cair a ±0,15 s da palavra que a nomeia; corrija até sair **APROVADO**. "Confira no quadro" = o texto da tela não é a palavra dita (resumo, metáfora): olhe o quadro daquele instante no passo 8;
- `node scripts/legendas.mjs`: lista as linhas de legenda (que só aparecem nos momentos com `legenda: true`).

**O fim do vídeo**: o vídeo termina ~0,3 s depois da última palavra: ponha em `duracao` (e no `ate` do último momento) o fim da última palavra + 0,3 s.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros **reduzidos à largura de um celular (~540 px)** e confira de verdade (peça também quadros 0,3 s depois de cada contorno, número, nível e chegada):
- o quadro 0 já mostra o layout final (mapa ou cartão no lugar, primeira palavra na tela)?
- os contornos amarelos caem **nas divisas reais** da foto? O talhão marcado é o certo e a mira trava nele?
- a cotação mostra **só o número dito** e o mini-gráfico anda na direção dita? O medidor para na fração dita?
- a previsão não tem dia, data, temperatura nem milímetro inventado?
- a foto é a coisa dita, sem texto, marca ou pessoa?
- o fechamento (palavra-chave) fica legível até o fim; nada encosta nas margens; nada importante abaixo de y 1700; nenhum quadro de troca fica embolado.
- a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-campo.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho) e o maior desvio do timing gate;
- as **imagens usadas** e de onde vieram (e o texto do `creditos.txt` quando houver CC BY);
- o que é ilustrativo (mapa desenhado, gráfico sem números);
- o que o usuário deve conferir (uma palavra que a transcrição errou, um talhão que só ele sabe onde fica).

## Blocos deste modelo

Todos os blocos acontecem **no painel** (em cima); a pessoa fica embaixo o tempo todo.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | a estaca amarela, o título grande que se monta (o `destaque` com grifo amarelo) e os sulcos da lavoura se abrindo embaixo, com a semeadeira andando |
| lista | `topicos` | talhões em fila: cartões creme com a faixa lateral verde/terra e o broto, cada um pousando no seu `em`; o da vez com borda amarela |
| passos | `passos` | os mesmos cartões com estacas, ligados por uma estrada de terra tracejada que avança até o passo da vez |
| número | `numero` | a leitura de instrumento: número em mono contando num cartão, com a régua de campo enchendo e o cursor amarelo; o rótulo embaixo |
| comparação | `comparacao` | dois talhões lado a lado com cabeçalho em mono (verde ou terra; ✗ e ✓ no `errado-certo`); o vencedor ganha a mira e o selo ✓, o outro apaga |
| gráfico | `grafico` | colunas que brotam de uma faixa de terra (com o valor em mono), linha de campo de ponto em ponto, ou o **pivô central** (pizza vista de cima, com o braço girando); sem números ditos, colunas sem valor com "ilustrativo": com `rotulos` ("Sem gotejamento" × "Com gotejamento"), a última em verde cresce na palavra |
| destaque | `destaque` | a placa de campo: amarela com parafusos (`chave`) ou vermelho-terra com faixas de perigo (`alerta`) |
| definição | `definicao` | a ficha técnica: o termo no cabeçalho verde, a estaca amarela, o significado se montando embaixo |
| frase | `frase` | o cartão do caderno com as aspas verdes, palavra por palavra; `destaque` grifado, `risco` riscado |
| pergunta | `pergunta` | a estaca "?" e a pergunta grande; com `opcoes`, talhões coloridos em grade |
| fechamento | `cta` | com `material` e `linhas`: a planilha de verdade (itens escritos e a coluna de ✓ marcando linha a linha, "Total" em amarelo, sem números); com `material` sem `linhas`: o arquivo com a seta de baixar; embaixo, o ícone num círculo verde com a chamada e a palavra-chave grifada |
| **assinatura** | `talhao` | a vista de cima (foto ou mapa desenhado) com os talhões se contornando em amarelo na fala; a câmera de drone voa até o talhão da vez, que acende com a mira e a estaca do rótulo |
| próprio | `cotacao` | a foto da coisa ocupa o painel com o rótulo se escrevendo; na palavra do movimento ("subiu") ela recolhe para cima e o indicador pousa já andando: seta, mini-gráfico do nível de antes (tracejado) até o de agora, a variação em mono contando no número dito, o período numa etiqueta amarela |
| próprio | `medidor` | a foto do contexto ocupa o painel; quando o nível vai mudar, ela recolhe e pousa o reservatório de vidro com o gotejador em cima: o nível vai do cheio até a fração dita e a marca amarela trava nele; o texto se monta ao lado |
| próprio | `previsao` | o céu sobre a lavoura em perspectiva: o tempo de agora, a frente que chega da direita (chuva caindo) e a faixa de quadros sem rótulo virando, com a chave do "quando" |

## A assinatura em qualquer assunto

O talhão é **"um território dividido em partes, e a fala aponta uma delas"**: qualquer fala que mostra um lugar, um conjunto ou "olha isso" vira a vista de cima. As partes podem ser talhões de verdade (foto aérea com `areas`) ou ideias num mapa desenhado (modo ilustrativo, com a etiqueta "ilustrativo"). Os rótulos são sempre palavras ditas.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `talhao` sem imagem (mapa desenhado), `texto: "Mesmo na alta, tem gente que perde"`, `destaque: "perde"`, `contornoEm` em "tem", `marcar`: talhão 0 com `texto: "Compra por impulso"` em "compra", talhão 4 com "Moeda sem critério" em "moeda", talhão 2 com "Risco que não entende" em "risco". Depois, "o Bitcoin rompeu os 83 mil dólares" vira `cotacao` com `valor: 83`, `prefixo: "US$ "`, `sufixo: " mil"`.
2. **Pecuária ou saúde/rotina.** "Dividi o pasto em seis piquetes e o gado roda um por semana." → `talhao` com a foto aérea do pasto e as `areas` dos piquetes, `marcar` em "seis" (sem rótulo) e depois um por vez se ela nomear. Na saúde: "seu dia tem três blocos: sono, trabalho e treino" → mapa desenhado com três talhões marcados ("Sono", "Trabalho", "Treino"); "você dorme metade do que precisa" → `medidor` com `fracao: 0.5`, `cor: "verde"`.
3. **Algo bem distante (carreira, história pessoal, máquinas).** "Quando eu cheguei na cooperativa, só um setor dava lucro." → `talhao` desenhado com `marcar` num talhão e `texto: "Só um setor dava lucro"`. "A colheitadeira fez o talhão em metade do tempo" → `medidor` com `fracao: 0.5`, `cor: "terra"`. "Vem aí a safra mais difícil" → `previsao` com `chegada: "tempestade"` e `quando` só se ela disser quando.

Sem lugar nem conjunto na fala? Use o talhão desenhado na abertura com o título da fala ("Olha o que aconteceu com…") e um talhão marcado na palavra-chave. Toda edição tem um `talhao`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- **Nunca mostre um número que não foi dito**: nem eixo com valores, nem dia da semana, data, temperatura, milímetro de chuva, preço, hectare ou "talhão 3". O gráfico sem números mostra só a forma, com "ilustrativo".
- O rótulo de um talhão, o período da cotação e o "quando" da previsão são **palavras ditas**.
- A foto ilustra o que foi dito; nada de marca, pessoa real, logotipo de máquina ou print que a fala não citou.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Se ele pedir "dois efeitos próprios", acrescente uma `cotacao` num valor que subiu ou caiu, um `medidor` numa fração ou uma `previsao` em algo que está chegando. Não use `--forcar`.
- **Timing gate fora**: a palavra em `palavras` está errada (corrija no passo 4b) ou o `em` está noutra palavra.
- **Os contornos não batem com a foto**: refaça as `areas` olhando a foto com grade; prefira menos talhões, bem marcados. Sem como marcar, deixe sem `areas` (só a mira) ou use o mapa desenhado.
- **O texto não cabe**: o bloco reduz o corpo até o mínimo e quebra em 2 ou 3 linhas; se ficar apertado, encurte com as palavras da fala (rótulo de talhão até ~24 caracteres; rótulo de cotação até ~28).
- **A imagem tem texto, marca ou pessoa**: outra candidata, outra busca ou nenhuma imagem.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
