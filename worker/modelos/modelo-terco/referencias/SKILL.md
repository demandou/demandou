---
name: modelo-terco
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Terço: tela dividida na horizontal, com o terço de cima como um palco sempre ocupado (imagem do que é citado aproximando devagar, título de cada parte, listas, números e destaques entrando por cortina ou deslize) e a pessoa embaixo numa moldura larga que segue o rosto, com legenda abaixo do queixo. Sóbrio: grafite e osso com um único azul, sem mexer na cor do vídeo. Serve para qualquer assunto (finanças, saúde, culinária, vendas, viagens, aulas): a IA lista o que a pessoa cita, busca ou pede as imagens e traduz a fala para os blocos do estilo. Use quando o usuário pedir para editar \"no modelo Terço\", \"tela dividida\", \"imagem em cima e eu embaixo\", ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Terço

O vídeo vira uma aula em tela dividida: em cima, um palco de 640 px que nunca fica vazio e mostra, no momento certo, o que a pessoa está dizendo (a imagem da coisa citada, o número e o título de cada parte, a lista, o número, o destaque); embaixo, a pessoa numa moldura larga, com a cabeça inteira e folga, seguindo o rosto, com a legenda logo abaixo do queixo. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (as tomadas, o ritmo dos cortes, o que vira imagem, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com economia doméstica ("Como gastar menos no mercado"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** o palco troca de conteúdo a cada ~2 a 4 s. O que entra é opaco e cobre o que estava lá: imagem entra por **cortina** (da esquerda, com um fio azul na borda), texto entra **deslizando de baixo** e o anterior recua um pouco; `entrada: "lateral"` empurra da direita. Troca em 0,5 s, sem quique. A imagem aproxima devagar (no máximo ~6%); título e listas se montam palavra por palavra na fala. Embaixo, cada pausa vira um corte com 0,1 a 0,2 s de respiro e o enquadramento troca entre 1,0, ~1,1 e ~1,2 (nunca o mesmo duas vezes), sempre seguindo o rosto. Nada treme, gira, pisca ou troca de cor.
- **Organização e hierarquia:** a tela tem três faixas fixas. Palco (0 a 640 px), divisória fina com a linha de progresso do vídeo, pessoa e legenda. Cada momento ocupa o palco inteiro, com uma ideia só. O número (01, 02…) é grande, o título é o texto principal, o chapéu (`chapeu`) é a linha pequena em caixa-alta no alto.
- **Tipografia:** Manrope. Títulos e números em 800, texto em 600 a 700, chapéu em 700 em caixa-alta. Nada abaixo de 24 px no palco. O texto é medido com as larguras reais da fonte e diminui para caber, nunca vaza.
- **Moldura da pessoa:** os dois terços de baixo, de borda a borda, o tempo todo (ela nunca vira janela nem coluna lateral). O topo da cabeça fica sempre na mesma linha, 48 px abaixo da divisória, em qualquer zoom: aproximar só desce o queixo. A moldura segue o rosto quando a pessoa se mexe.
- **Cores, textura e som:** palco grafite `#11151B`, texto osso `#F2EFE9`, apoio cinza `#8A919B` e **um** destaque azul-cobalto `#5B84FF` (número, traço, sublinhado da palavra dita, progresso). O alerta inverte o palco para osso. **Nunca** filtro, LUT, vinheta, brilho ou desfoque sobre a pessoa. Som: um "vum" tonal baixo quando uma imagem entra no palco (`"sfx": false` desliga); mais nada.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB; e a busca de imagens). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só:
   - **nome e área** de quem fala (vão no chapéu da abertura, ou numa tarja discreta sobre a pessoa; sem resposta, siga sem nome);
   - **se ele tem imagens próprias** para entrar no vídeo (o produto, o lugar, prints, antes e depois, fotos dele). Se tiver, peça para pôr na pasta `imagens/` do projeto (criada no passo 1), com nomes que digam o que são (`prensa.jpg`, `print-comentario.png`). Elas passam na frente de qualquer busca.

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
node ferramentas/justar.mjs
```

Ele transforma cada pausa de 0,38 s ou mais entre trechos mantidos num corte com ~0,16 s de respiro (`--respiro 0.2` para uma fala mais calma). Pausas menores (vírgulas, respiração no meio da frase) ficam como estão.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.31 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa 9:16 (quadro cheio) para gravação vertical e horizontal; numa gravação horizontal o quadro é um recorte em volta do rosto, então ela precisa de boa resolução (1080p no mínimo; 4K fica nítido). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: momentos, marca, imagens e correções continuam.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: a câmera acompanha quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a linha branca é a divisória (palco acima); a verde é o topo da cabeça, igual em qualquer zoom; a azul é o queixo no zoom mais fechado; a amarela é onde a legenda começa; nada importante abaixo da linha vermelha (interface do aplicativo) nem na faixa vermelha da direita (botões). Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s e dê a cada uma uma forma e um bloco **deste modelo** (tabela "Blocos deste modelo", abaixo). No Terço o palco nunca fica sem nada, então toda batida ganha um bloco. A pergunta de cada uma é: **a pessoa citou algo que dá para mostrar?** Se sim, é uma `insercao` (a assinatura). Se ela abriu uma parte nova ("primeiro…", "segundo…", "o erro é…"), é um `capitulo` (o outro bloco da assinatura). Senão: `destaque`, `numero`, `comparacao`, lista, definição…

Meta: uma imagem a cada ~4 a 6 s nos trechos concretos, nunca duas na mesma frase; e um bloco novo no palco a cada ~2 a 4 s. Um capítulo seguido da imagem do que ele cita é o par típico. Abra com `abertura` (o gancho) e feche com `pergunta` ou `cta` quando a fala pedir.

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (objeto, comida, lugar, ferramenta, situação, tipo de pessoa; uma a cada ~4 a 6 s; nunca duas na mesma frase). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "takeaway coffee cup", "french press coffee", "meal prep containers"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - **Antes de buscar, confira a resposta do usuário sobre imagens próprias** (passo 3 de "Antes de começar"). Produto dele, o lugar dele, prints, antes e depois: só ele tem. Liste o que você acha que deveria vir dele e, se a pasta ainda estiver vazia, pergunte de novo uma vez, dizendo o nome sugerido de cada arquivo.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo, marca ou texto grande; foto de verdade quando é foto; **deitada (paisagem) é o ideal**: o palco é largo, e a foto em pé perde o topo e a base no recorte, então ponha o foco no assunto.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira; as linhas da folha marcam 0,25 / 0,5 / 0,75). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (o cartão mostra a palavra: **cartão é melhor que imagem errada**).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "prensa" }` (o efeito padrão é aproximar devagar). Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda`, `correcoes` e, se quiser mandar na câmera, `camera`. O momento fica no palco até o próximo começar: não deixe `ate` passar do `de` do seguinte.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "500 reais": "R$ 500" }`). Frase sem ponto no fim que emenda com a próxima na legenda: corrija com as duas últimas palavras (`{ "nem abria": "nem abria." }`); nunca uma palavra comum sozinha (`"uma"` mudaria todas). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida à largura de um celular (~540 px)** e confira de verdade:
- **a cabeça está inteira**, com folga abaixo da divisória, em todos os zoom, e a legenda fica abaixo do queixo, sem encostar nele;
- o palco está sempre ocupado e o texto cabe nele (nada cortado, nada colado na divisória);
- a imagem certa aparece quando a palavra é dita, com o assunto inteiro (o foco certo);
- a tarja da legenda está na palavra que está sendo dita; nenhuma frase emenda com a seguinte;
- o texto cabe (nada cortado), nada abaixo da linha da interface nem na faixa dos botões;
- nenhum quadro com dois textos um sobre o outro nas trocas do palco (a troca dura 0,5 s). Gere quadros em volta de cada entrada (`node scripts/stills.mjs 7.0 7.1 7.2 7.3 7.4`).
- nada importante abaixo da linha da interface nem na faixa dos botões.

Corrija o plano (texto mais curto, outro lado, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-terco.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado (quantas pausas viraram corte);
- o **mapa resumido** (que bloco e que imagem entrou em cada trecho);
- de onde vieram as imagens (pasta do usuário ou busca) e o texto de `creditos.txt` quando houver CC BY;
- o que é ilustrativo;
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que ele pode trocar por uma própria).

## Ritmo e cortes (cortar como editor)

- **Corte pelas pausas reais, nunca pelos tempos das palavras.** O Whisper estica o começo de algumas frases para dentro do silêncio; o `preparar` acha as pausas pelo áudio e o `justar` parte delas. Se precisar ajustar à mão, meça o silêncio com `ffmpeg -i video.mp4 -af silencedetect=noise=-40dB:d=0.1 -f null -`.
- **Respiro de 0,1 a 0,2 s em cada corte** (0,06 s antes da fala, o resto depois). Menos que isso a fala fica robótica e come consoantes; mais que isso parece pausa.
- **O que sai:** silêncio, "é…"/"hã…" longos sozinhos, tomada repetida (fica a última completa), frase abandonada no meio, comentário fora do vídeo. **O que fica:** pausa curta de vírgula (o `justar` deixa), uma pausa dramática antes de um número ou de uma revelação (marque à mão um respiro maior nesse corte), risada curta que faz parte da fala.
- **Cada corte troca o enquadramento** (o template faz sozinho: 1,0 → ~1,1 → ~1,2, nunca repete). É isso que esconde o pulo do corte.
- **Ênfase:** num trecho importante sem corte, use `camera` com `aproximar: true` (aproximação lenta) ou, uma ou duas vezes no vídeo, um "soco" de câmera na palavra (`{ "em": 3.18, "zoom": 1.12 }`). Mais que isso cansa.
- **Ritmo do palco:** um bloco a cada ~2 a 4 s; uma imagem a cada ~4 a 6 s quando a fala é concreta. A imagem fica 1,5 a 3 s; texto e número, o tempo da frase. Alterne a forma (imagem, título, número, lista) para o palco não ficar monótono.

## Blocos deste modelo

Todo bloco ocupa o palco inteiro (0 a 640 px) e fica nele até o próximo entrar. Fundo grafite, texto osso, um azul.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura (1)** | `insercao` | a imagem do que é citado, de borda a borda do palco, aproximando devagar; entra por cortina com fio azul; etiqueta pequena no canto de baixo com o nome (`rotulo`) e marcador azul (`etiqueta` "1", "2"…) quando é item de lista. Objeto 3D transparente vira adesivo sobre o grafite; sem imagem, um cartão tipográfico com a palavra |
| **assinatura (2)** | `capitulo` | o número grande em azul (`01`, `02`…), o título em 800 montado palavra por palavra na fala (`destaque` em azul), pontos de progresso (`total`) e, opcional, um ícone de traço que se desenha (`icone`) |
| abertura | `abertura` | o gancho em tipo grande, palavra por palavra; o `destaque` em azul com sublinhado que cresce; nome e área no chapéu |
| lista | `topicos` | título pequeno e linhas que entram na fala, com marcador azul na da vez; cada item pode ter miniatura (`imagem`) |
| passos | `passos` | a mesma lista com números e um fio que desce até o passo da vez |
| número | `numero` | o número contando em pt-BR, enorme, com o `rotulo` embaixo e o `titulo` pequeno em cima |
| comparação | `comparacao` | duas metades do palco, cada uma entrando no seu `em`; símbolo entre elas (→, ×, ≠); o vencedor fica, o outro apaga |
| gráfico | `grafico` | barras, linha ou rosca desenhadas na fala, em osso com o item da vez em azul; sem números ditos, uma curva com a etiqueta "ilustrativo" |
| destaque | `destaque` | a palavra-chave grande com ícone de traço; `nivel: "alerta"` inverte o palco para osso; `detalhe` numa linha menor |
| definição | `definicao` | o termo em 800 e o significado linha a linha |
| frase | `frase` | a frase em tipo grande, palavra por palavra; `destaque` em azul, `risco` riscado quando é dito |
| pergunta | `pergunta` | a pergunta e as `opcoes` em linhas, com miniatura (`imagem`) ou letra |
| fechamento | `cta` | pílula com o ícone (seguir, salvar, comentar, link) e a chamada palavra por palavra |

## A assinatura em qualquer assunto

O Terço tem duas assinaturas que andam juntas: o **capítulo** ("cada parte da fala ganha um número e um título") e a **inserção** ("o que a pessoa está dizendo, mostrado"). Quando a fala é abstrata, procure o exemplo dentro dela e, quando nem isso existe, use o cartão com a palavra (nunca uma imagem que não é aquilo).

1. **Finanças/cripto.** "Primeiro, ninguém sabe o topo. Segundo, quem comprou por impulso vendeu no pânico."
   `capitulo` 1 "Ninguém sabe o topo"; `capitulo` 2 "Compra por impulso"; `insercao` com uma moeda (`tipo: "objeto"`, vira adesivo) em "Bitcoin"; `destaque` `alerta` "vendeu no pânico". Sem números ditos, nada de gráfico com valores: se quiser a curva, `grafico` com `tendencia: "oscila"` e `ilustrativo: true`.
2. **Saúde (sono).** "Tirei o celular do quarto, comprei uma cortina blackout e passei a dormir às onze."
   `insercao` celular na mesa de cabeceira, `insercao` cortina (`busca: "blackout curtain bedroom"`), `numero` 11 com `sufixo: "h"` e `rotulo: "da noite"` em "onze".
3. **História pessoal / relacionamento.** "No primeiro encontro a gente foi numa feira de rua, choveu e dividimos um guarda-chuva."
   `insercao` feira de rua, `insercao` guarda-chuva (`tipo: "objeto"`); se o usuário tiver uma foto do dia, ela entra no lugar da busca (`arquivo` em `imagens/`). Fecha com `frase` com a linha mais bonita da fala.

Outros nichos: receita (cada ingrediente citado vira uma inserção; a quantidade, um `numero`), vendas (o produto do usuário vem de `imagens/`; o preço dito, um `numero`), viagem (o lugar de borda a borda; dicas em `topicos`), aula (cada tópico um `capitulo`; os termos em `definicao`).

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- A imagem mostra **o que foi dito**, não uma interpretação. Na dúvida, cartão com a palavra.
- Não invente número, nome, preço nem fato. Número ilustrativo só onde o bloco permite, e com a etiqueta visível.
- Sem marca e sem pessoa famosa nas buscas; print, só o real que o usuário mandar.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **A fala ainda tem pausas longas no vídeo**: o `justar` não rodou, ou rodou antes de você marcar as tomadas; rode de novo e refaça o `cortar` com `--manter-plano`.
- **Um corte comeu o começo ou o fim de uma palavra**: aumente o respiro (`node ferramentas/justar.mjs --respiro 0.22`) ou, só naquele corte, afaste `de`/`ate` em `work/cortes.json` 0,05 s; depois `cortar --manter-plano`.
- **A tarja da legenda está uma palavra atrasada**: o tempo daquela palavra no Whisper está esticado; confira em `work/palavras.json` e corrija o `em` dela no `src/plano.json` (em `palavras`).
- **A imagem ficou mole no palco**: era pequena; troque (`--refazer`, `--lado 2400` com fotos do Commons). O palco é largo (1080×640): foto deitada funciona melhor que em pé.
- **O texto do palco ficou pequeno ou em muitas linhas**: encurte o texto (as palavras da fala bastam); o corpo diminui para caber e abaixo de 24 px o bloco merece ser outro.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
