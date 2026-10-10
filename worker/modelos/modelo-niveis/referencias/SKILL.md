---
name: modelo-niveis
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Níveis, o refrão \"ruim, bom, excelente\": a pessoa em plano único, um pouco mais baixa no quadro; acima da cabeça, por cima do fundo da própria cena, três cartões altos lado a lado entram em corte seco, cada um na palavra do nível, com rótulo branco em caixa-alta; a cada ~3 s os cartões trocam de tema; fecha com o cartão do perfil e a pílula COMENTA \"PALAVRA\". Sem legenda, sem transição. Serve para qualquer assunto (faixas de preço, planos, iniciante/intermediário/avançado, três versões de um criativo): a IA transforma a fala em ciclos de três níveis. Use quando o usuário pedir \"modelo Níveis\", \"ruim, bom, excelente\", \"três níveis\", \"barato, médio e caro\", ou quiser um Reel, TikTok ou Short de comparação nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Níveis

O vídeo vira um refrão: a pessoa fala para a câmera, sempre no mesmo plano, e a cada ~3 segundos um tema novo é comparado em três níveis. Em cima, acima da cabeça e sobre o fundo da própria cena, três cartões entram lado a lado, um em cada palavra ("ruim", "bom", "excelente"), cada um com seu rótulo branco embaixo; no corte seguinte a fileira se refaz com outro tema. No fim, o cartão do perfil com "Seguir" no topo e a pílula branca `COMENTA "PALAVRA"` no peito. É a edição de um Reel viral: sem legenda, sem transição, sem efeito. O ritmo e a grade fixa de três colunas são todo o estilo.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com tênis de três faixas de preço, mas o vídeo do usuário pode ser sobre qualquer coisa que tenha três níveis. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição sem ciclos de níveis é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** nenhuma. A dinâmica é o **ritmo**: um cartão novo a cada palavra de nível, em corte seco (1 quadro, sem deslizar, sem fade), e um tema novo a cada ~3 s. A câmera troca de escala só 3 a 5% nos cortes.
- **Organização e hierarquia:** o topo (~30% da altura) é só dos cartões, sobre o fundo da cena, sem faixa preta; a pessoa fica abaixo, com a cabeça logo embaixo dos rótulos; do queixo para baixo só a pessoa (os blocos universais usam essa faixa quando a fala pede um dado). Três colunas fixas (esquerda, centro, direita), as mesmas em todos os ciclos.
- **Tipografia:** Plus Jakarta Sans 800; rótulos brancos em caixa alta, sem caixa, 56 px (nunca abaixo de 52; por isso o rótulo tem 1 a 2 palavras curtas, até ~10 caracteres por linha); pílula do fechamento 54 px, texto preto sobre branco.
- **Moldura da pessoa:** quadro cheio o vídeo inteiro, câmera quase fixa, rosto com ~32% da largura e na mesma altura; ela desce um pouco e o alto do quadro é completado com o reflexo esticado do próprio fundo (só funciona com fundo liso ou desfocado). Segue o rosto quando ela se mexe.
- **Cores, textura e som:** cartões de cantos de 20 px, uma sombra suave escura só atrás dos rótulos, com fundo claro (cada nível pode ter uma cor para dar contraste), rótulos e pílula brancos. Sem sons de efeito (a música é do usuário, por cima).

## O DNA deste formato (regras para você, editor)

Estas regras vêm da decupagem corte a corte de um Reel com mais de 1.800 curtidas ("ruim, bom, excelente" sobre criativos). Repita-as; não "melhore".

1. **Refrão curto, de 3 palavras, começando em 0,0 s.** "Ruim, bom, excelente." A primeira palavra sai em até 0,1 s e o primeiro quadro já é o layout final: o primeiro cartão (já na tela) e a pessoa. Sem intro, sem logo, sem fade.
2. **Reserve o alto do quadro** (~30% da altura, acima da cabeça) para os cartões. O rosto fica abaixo dos cartões, nunca coberto. O template faz isso sozinho (guias no passo 5).
3. **Cada ciclo = 3 cartões iguais**, em 3 colunas fixas (~30% da largura cada, ocupando quase toda a largura; cartão alto, ~3:4), nas mesmas posições em todos os ciclos, **mesmo quando só o primeiro já entrou** (as outras colunas ficam vazias até a palavra delas). Um nível a mais ou a menos quebra a grade: com mais de três, divida em dois ciclos.
4. **O cartão entra em corte seco na palavra do nível** (de 0 a 0,2 s antes) e fica até o corte do ciclo seguinte. Nada de animação de entrada.
5. **O rótulo da palavra vai abaixo de cada cartão**: branco, bold, caixa alta, grande (≥ 52 px), sem caixa. É o único texto até o fechamento.
6. **Troque o tema cortando ~0,1 s antes da primeira palavra do ciclo.** O plano da pessoa não muda; só a fileira de cartões se refaz.
7. **A mão acompanha**: se a pessoa aponta com a mão para cada cartão (esquerda, centro, direita), o corte que o editor escolhe cai no gesto. Não dá para criar o gesto na edição: se a gravação não o tem, não force.
8. **Vários ciclos, cada um com um nicho diferente** (comida, esporte, bebida, evento). É a prova de versatilidade do refrão. Com um tema só (como no exemplo de tênis), os ciclos mostram o mesmo tema por ângulos diferentes: preço, o que muda, o que vale.
9. **A progressão visual sobe**: o nível 1 é o mais simples ou poluído, o nível 3 o mais elaborado ou impactante. Escolha as imagens para os três serem fáceis de distinguir em 1 s.
10. **Sem legenda.** Os rótulos são o único texto.
11. **Fechamento nos últimos ~30%** (pedir seguir e comentar a palavra-chave): o cartão do perfil com o botão "Seguir" entra no topo e, ~0,5 s depois, a pílula branca `COMENTA "PALAVRA"` entra no peito; os dois ficam até a última palavra. O alto só tem o cartão do perfil (os cartões de nível saem).
12. **Vídeo total ≤ 16 s, 4 cortes de tema, ~3 s por ciclo.** Mais longo que isso, é outro formato.

## Ritmo e cortes

- **Fala corrida:** toda pausa sai. O respiro entre trechos fica entre 0,2 e 0,4 s (`node ferramentas/justar.mjs --respiro 0.3`). "é…", respiração longa, tentativa repetida e comentário depois do fim saem sempre.
- **Corte pelas pausas reais**, não pelos tempos das palavras: o `preparar` mede as pausas no áudio. Para conferir um silêncio: `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`.
- **Corte para manter o refrão.** Cada ciclo tem ~3 s: fique com a frase que nomeia os três níveis e uma frase curta que descreve cada um. Frase que explica *por que* sai; frase que *nomeia e mostra* fica. O trecho do fechamento fica sempre.
- **Abertura curta:** a primeira frase tem até ~3 s e já é o primeiro ciclo.
- **O vídeo termina na última palavra** do fechamento (0,1 s de folga, nada além).

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; e a busca de imagens). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada.
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio. O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **o @ do perfil** (vai no cartão "Seguir" do fechamento) e, se tiver, a foto de perfil (quadrada, para `public/`);
   - **a palavra-chave do fechamento** ("comenta GPT") e **a promessa** ("o guia de imagens"). Sem resposta e sem chamada na fala, o vídeo termina na última palavra sem fechamento;
   - **se ele tem as imagens que vão nos cartões** (as três versões: o ruim, o bom, o excelente; os três produtos; os três antes/depois). Se tiver, peça para pôr na pasta `imagens/` do projeto, com o nome do nível (`ruim.png`). Elas passam na frente de qualquer busca.

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela. Crie também a pasta `imagens/` lá dentro (para as imagens do usuário).

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: **um item por trecho de fala**, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas.

### 3. Escolher as tomadas e justar os cortes

Leia a lista como um editor (veja **Ritmo e cortes**, abaixo). Em `work/cortes.json`, marque `"manter": false` em:

- **tentativas abandonadas e repetidas**: a mesma frase começada várias vezes. Fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, "é…" longos sozinhos, comentários depois do fim ("pronto, obrigado").

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições.

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala (meça o volume: `ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`; perto de −60 dB é silêncio, −30 dB ou mais é fala).

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Depois de escolher, deixe os cortes justos:

```bash
node ferramentas/justar.mjs --respiro 0.14
```

Ele transforma cada pausa de 0,38 s ou mais entre trechos mantidos num corte com ~0,14 s de respiro (o Níveis quer fala corrida: respiro entre 0,1 e 0,3 s, nunca mais). Pausas menores (vírgulas, respiração no meio da frase) ficam como estão.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.28 --queixo-y 0.37
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa 9:16 (quadro cheio) para gravação vertical e horizontal; numa gravação horizontal o quadro é um recorte em volta do rosto, então ela precisa de boa resolução (1080p no mínimo; 4K fica nítido). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a câmera acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha amarela de cima marca onde o vídeo da pessoa começa (acima é o reflexo esticado do fundo) e o retângulo tracejado é a grade dos três cartões; a linha azul de cima é o topo da cabeça no zoom mais fechado e **não pode encostar nos rótulos**; o reflexo no alto não pode mostrar cabelo nem objeto cortado (se mostrar, o fundo tem coisas demais no alto: use outro trecho); abaixo do queixo, a linha verde é onde os blocos de peito (listas, números…) começam; nada importante abaixo da linha vermelha (interface do app) nem na faixa vermelha da direita. Confira também se o enquadramento da pessoa está sem borda vazia nos lados.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida a fala em **ciclos de ~3 s**. Cada ciclo é um `niveis` (a assinatura): 3 cartões + 3 rótulos, cada um entrando na palavra do nível. Se a fala diz um nível por frase (como "o de 200 tem X, o de 600 tem Y…"), faça um `niveis` por trecho de vídeo, com os cartões já postos nos anteriores (veja `references/plano.md`). O fechamento é um `cta`. Os outros blocos universais (`numero`, `destaque`, `comparacao`…) entram quando a fala pede um dado que não é um nível (um número dito, uma conclusão); aparecem abaixo do queixo, na altura do peito.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, escreva `work/imagens.json`: um pedido por cartão (`id`, `em`, `palavra`, `busca` em inglês, **curta e concreta**, `tipo`, `arquivo` quando vier da pasta `imagens/`).
   - **Material real primeiro:** o ideal são as imagens do próprio usuário (os três criativos, os três produtos). Peça (`imagens/`).
   - Os três cartões do ciclo precisam **contrastar entre si** (cor e forma) e se ler em 1 s num cartão de ~320 × 440 px. PNG transparente (objeto) cabe inteiro no cartão; use `fundo` para dar uma cor a cada nível.
2. `node scripts/imagens.mjs`. Termos longos costumam voltar vazios: refaça com 2 ou 3 palavras (`--refazer <id> --busca "oil bottle"`).
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…) **uma vez**. Escolha a candidata que mostra o assunto inteiro, sem marca grande nem pessoa reconhecível; `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`. Nenhuma serve: `--refazer`, ou `--escolher <id> 0` (cartão de texto com a palavra: **melhor que imagem errada**). Depois `--limpar`.
4. Nos momentos, `imagem: { "id": "..." }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário.

### 7. Planejar os momentos

Leia `references/plano.md` e preencha `src/plano.json`: `perfil`, `momentos` e `camera`. O `marca` fica vazio e `semLegenda` cobre o vídeo todo (o Níveis não tem legenda).

- Os ciclos são **contínuos**: o `ate` de um é o `de` do seguinte (o corte seco). O primeiro começa em 0.
- O `cta` começa ~0,1 s antes da primeira palavra da chamada e vai até o fim do vídeo.
- Depois: `node scripts/conferir.mjs --mapa` até sair **APROVADO** (nunca `--forcar`). O aviso de "vários `niveis` seguidos" é esperado neste modelo.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros a ~540 px de largura e confira: rosto livre; os três cartões na grade, cada um com seu rótulo inteiro embaixo; a imagem certa em cada nível; nenhum quadro com dois ciclos sobrepostos nas trocas (`node scripts/stills.mjs 4.2 4.25 4.3`); o fechamento legível por 2 s ou mais.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-niveis.mp4"
```

Entregue: o caminho; a duração e o quanto foi cortado; o **mapa resumido** (ciclo, os três rótulos e as três imagens); de onde vieram as imagens e o `creditos.txt` quando houver CC BY; o que o usuário deve conferir (uma imagem que ele pode trocar pela real, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura** | `niveis` | até 3 cartões altos lado a lado no topo, sobre o fundo da cena (cantos de 20 px) e o rótulo branco embaixo de cada um; cada cartão entra em corte seco na palavra do nível; `depois` troca o rótulo no meio do ciclo |
| abertura | `abertura` | o gancho palavra por palavra, branco sobre o vídeo, abaixo do queixo (o gancho normal do Níveis é um `niveis` já no quadro 1) |
| lista | `topicos` | adesivo branco no peito, linhas pretas que entram na fala, marcadores quadrados pretos |
| passos | `passos` | o mesmo adesivo com marcadores numerados e um fio |
| número | `numero` | adesivo branco com o número contando em pt-BR e um traço preto que se completa |
| comparação | `comparacao` | dois adesivos lado a lado com o sinal entre eles; o vencedor ganha a faixa preta |
| gráfico | `grafico` | adesivo branco com barras/linha/rosca em preto e cinza |
| destaque | `destaque` | pílula branca de palavra-chave no peito (`alerta` = pílula preta) |
| definição | `definicao` | adesivo: o termo em 800, um traço preto, o significado |
| frase | `frase` | adesivo largo com a fala palavra por palavra |
| pergunta | `pergunta` | adesivo com a pergunta e as opções |
| fechamento | `cta` | cartão do perfil com "Seguir" no topo + pílula branca `COMENTA "PALAVRA"` no peito, 0,5 s depois |

## A assinatura em qualquer assunto

O `niveis` é **"o mesmo tema em três degraus"**: toda comparação falada vira três cartões na ordem em que os níveis são ditos. O rótulo é a palavra do nível (ruim, bom, excelente; R$ 200, R$ 600, R$ 1.500; mês 1, mês 3, mês 6); o cartão é a prova visual.

1. **Finanças/cripto.** "Quem começa, quem aprende e quem domina: o iniciante compra por impulso, o intermediário compara projetos, o avançado calcula o risco." Um ciclo com rótulos "INICIANTE", "MÉDIO", "AVANÇADO" e cartões de texto ("COMPRA POR IMPULSO", "COMPARA PROJETOS", "CALCULA O RISCO") com fundos diferentes; fechamento `Comenta "AULA"`.
2. **Saúde/rotina.** "Treino de 10 minutos, de 30 e de 60: o que muda no corpo." Rótulos "10 MIN", "30 MIN", "60 MIN"; cartões com a foto do tipo de treino. Se a fala diz o resultado de cada um, um segundo ciclo repete os cartões com o resultado no rótulo (`depois` ou outro `niveis`).
3. **Carreira/história pessoal.** "No primeiro emprego eu ganhava pouco, no segundo dobrei e no terceiro abri minha empresa." Rótulos "1º EMPREGO", "2º EMPREGO", "3º EMPREGO"; cartões com a foto do lugar ou do objeto de cada fase (ou o cartão de texto com o cargo).

Outros nichos: antes/durante/depois, versões 1/2/3 de um criativo ou de uma página, três cortes de carne, três planos de assinatura, três posições de um mesmo exercício.

## Fidelidade

- Tudo na tela vem da fala; o rótulo é a palavra do nível com as palavras dela.
- A imagem mostra **o que foi dito**; na dúvida, cartão de texto com a palavra.
- Não invente número, nome, preço nem fato. A promessa do fechamento é a que o usuário confirmou ou a que a pessoa disse.
- Sem marca e sem pessoa famosa nas buscas; print só o real que o usuário mandar.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho que ele aponta e escolha um ciclo ou bloco para ele. Não use `--forcar`.
- **O ciclo passou de ~4 s**: divida em dois `niveis` (o segundo já com os cartões do primeiro) ou corte a frase que explica.
- **A cabeça encosta nos rótulos**: a gravação tem a pessoa muito alta no quadro; confira as linhas das guias e regrave com a câmera mais baixa.
- **A busca de imagens volta vazia**: termo longo demais. Use 2 ou 3 palavras em inglês.
- **Um corte comeu o começo ou o fim de uma palavra**: aumente o respiro (`justar.mjs --respiro 0.4`) e refaça o `cortar --manter-plano`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
