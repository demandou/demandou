---
name: modelo-transformacao
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Transformação: uma foto grande com uma cortina ANTES | DEPOIS cuja alça anda com a fala, marcadores numerados que aproximam a área de cada dica, a revelação final em tela cheia e a pessoa numa moldura larga embaixo ou numa janela, em linho claro, verde-mar e Outfit redonda. Serve para qualquer assunto com um antes e um depois (o exemplo do modelo é a organização de um closet, mas funciona com reforma, decoração, limpeza, jardim, edição de foto, design, rotina, finanças, carreira…): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Transformação\", \"estilo antes e depois\", \"com cortina antes e depois\" ou \"vídeo de transformação\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Transformação

O vídeo vira uma revista de casa em movimento: uma foto grande ocupa a metade de cima, com uma cortina que mostra o ANTES de um lado e o DEPOIS do outro. A cada dica falada, a câmera aproxima a área da foto, um marcador numerado aparece e a alça varre do antes para o depois enquanto a pessoa explica. No fim, a foto toma a tela inteira, a pessoa vai para uma janela e a alça revela o resultado. Os scripts fazem a parte mecânica; você faz a parte de editor.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um closet, mas o vídeo do usuário pode ser sobre qualquer coisa que tenha um antes e um depois. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** calma e precisa, nunca "pulando". A câmera desliza até a área da dica em ~0,75 s; a alça varre em ritmo de fala; os marcadores e cartões entram com um leve passar do ponto (0,3 s); o texto se monta palavra por palavra. A foto nunca fica parada: há uma aproximação lenta o tempo todo. Nas trocas, o painel desce junto com a emenda (sem buracos).
- **Organização e hierarquia:** três lugares para a pessoa. **Quadro cheio** (texto num cartão claro na altura do peito); **painel** (a foto, a lista ou a comparação em cima, a pessoa numa moldura larga embaixo, a partir de y 1160); **janela** (a foto em tela cheia, a pessoa numa janela arredondada embaixo, no centro). Nunca coluna estreita ao lado. O cartão da dica fica embaixo da foto: número, texto grande, detalhe menor em verde.
- **Tipografia:** uma família só, **Outfit** (Google Fonts), larga e redonda: 800 nos textos principais, 700 em definições, 500 em detalhes. Nada condensado, nada com contorno. Dicas 42–64 px; abertura 52–88; título do painel 40–62; rótulos ANTES/DEPOIS em caixa alta com tracking.
- **Moldura da pessoa:** quadro cheio com o rosto na linha do centro; ou a moldura larga embaixo (rosto um pouco acima do meio, enquadramento troca de leve a cada corte do vídeo); ou a janela da revelação (420×440, raio 34, borda clara). O rosto é seguido quadro a quadro.
- **Cores, textura e som:** linho (#EFE9DF) e cartões de papel (#F8F4ED); tinta verde-escura (#1D2B27); **verde-mar** (#137A6A) para o DEPOIS, os marcadores e a palavra falada; cinza-pedra (#8A7E73) para o ANTES; argila (#C8552E) só para alerta. Sombras suaves, sem brilho. Sons tonais e raros, bem abaixo da voz: um toque curto por dica, um grave redondo na revelação, três notas subindo no fechamento.

## Atenção: saúde e estética

Se o aluno é da área da saúde (médico, dentista, nutricionista, fisioterapeuta, esteticista, psicólogo…), **antes de montar um antes e depois de pacientes**, avise-o: os conselhos profissionais (CFM, CFO, CFN, CREFITO, CFP e outros) restringem ou proíbem divulgar "antes e depois", e exigem consentimento por escrito, sem promessa de resultado e sem sensacionalismo. Diga isso na entrega, sugira conferir o código de ética do conselho dele e use, de preferência, imagens ilustrativas, o próprio corpo do aluno com autorização ou conteúdo educativo (rotina, hábitos, ambiente). Para organização, reforma, decoração, jardim, design e afins, não há essa restrição.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **se ele tem o par de fotos antes e depois** (o mesmo lugar, mesmo ângulo): elas vão numa pasta `imagens/` dentro do projeto, com os nomes `antes` e `depois` (ex.: `antes.jpg`, `depois.jpg`). **Sem as fotos do aluno o modelo não funciona bem**: banco grátis não tem um par do mesmo ambiente. Se ele não tiver, peça para fotografar do mesmo ponto (celular apoiado) ou gerar o par com a ferramenta de imagem dele, com a mesma câmera nas duas. Nome e área são opcionais.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições.

**Números curtos ditos sozinhos** ("Mil.", "Cem.") às vezes voltam como `[sem fala, sai]`. Antes de aceitar um item desses no meio do vídeo, meça o volume dele (`ffmpeg -ss <de> -t <duração> -i video.mp4 -af volumedetect -f null -`): perto de −60 dB é silêncio; −30 dB ou mais alto é fala. Se for fala, marque `"manter": true` e acrescente a palavra em `work/analise.json` (em `palavras`, na ordem do tempo: `{ "em": 3.18, "ate": 3.4, "w": "Mil" }`).

**Itens marcados `[sem transcrição: ouça antes de tirar]`** podem ser fala que o Whisper perdeu: eles vêm com `"manter": true` e só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas viram cortes secos**, e cada corte troca o enquadramento de leve (100% e 106%). Mantenha a proposta do `preparar`.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa a gravação vertical em 9:16 (a pessoa muda de lugar entre o quadro cheio, a moldura de baixo e a janela); gravação horizontal vira 3:4. Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca, as imagens e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a moldura de baixo e a janela acompanham quando a pessoa se mexe e, se o centro lido na grade errou, ele refaz o corte com o rosto no centro. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; a caixa verde tracejada (a zona do peito, onde ficam os textos de quadro cheio) deve começar abaixo do queixo; as linhas amarelas são a faixa da legenda; a rosa é a emenda (onde a pessoa começa quando desce); nada importante fora das linhas vermelhas (interface do aplicativo, e a coluna de botões à direita). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas, dê a cada uma uma forma (lista, passos, número, comparação, destaque…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`antesdepois`) entra pelo menos uma vez**, e cada dica da fala que tem um "onde" vira um marcador numerado. Abra com a `abertura` ou com a própria foto e feche com o `cta`.

### 6b. Imagens (as fotos do aluno)

Leia `references/imagens.md`. Neste modelo **as duas fotos vêm do aluno** (o par antes/depois, mesma câmera):

1. Escreva `work/imagens.json` com dois pedidos: `{ "id": "antes", "em": <instante>, "palavra": "antes", "tipo": "foto", "arquivo": "antes.jpg" }` e o mesmo para `depois`.
2. `node scripts/imagens.mjs --offline` (as fotos da pasta `imagens/` entram já escolhidas e o `plano.imagens` é preenchido). Confira em `work/imagens.jpg` que as duas estão alinhadas (mesmo enquadramento): a cortina só funciona com o mesmo ângulo.
3. Cada marcador usa `foco` (frações da foto, 0,0 = canto de cima à esquerda) para a área da dica: olhe a foto e anote onde fica cada coisa. Evite aproximar áreas com logo, rosto de terceiros ou texto pequeno.
4. Sem as fotos do aluno, não busque banco grátis para este modelo: peça o par ou use os cartões de rótulo (a cortina funciona com dois cartões coloridos, para antes/depois de ideias: "impulso" × "critério").

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada dica, item, lado ou dado entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "Olho": "Olha" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros reduzidos a ~540 px de largura e confira de verdade:
- cada marcador numerado cai na coisa que a dica diz, e o `foco` mostra a área inteira (nada cortado, sem logo ou texto pequeno)?
- a alça varre do antes para o depois enquanto a dica é dita, e o cartão da dica está inteiro, sem passar das bordas?
- a pessoa aparece numa moldura larga embaixo (ou na janela da revelação), com o rosto inteiro?
- o texto cabe, o título da abertura aparece quando a palavra é dita, a legenda fica abaixo do queixo e some quando um cartão já mostra o mesmo texto?
- nas trocas, nenhum quadro com buraco e nenhum texto sobre outro (`node scripts/stills.mjs 4.7 4.75 4.8 4.85 4.9`)?

Corrija o plano e repita até estar limpo (no máximo duas rodadas).

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-transformacao.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho);
- as **fotos usadas** (as do aluno) e, se for da área da saúde, o lembrete do conselho profissional (veja "Atenção: saúde e estética");
- o que é ilustrativo (curvas de tendência, números marcados `ilustrativo`);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, uma imagem que só ele pode trocar por uma melhor).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | quadro cheio: o gancho num cartão claro na altura do peito, palavra por palavra; o `destaque` em verde com grifo claro |
| lista | `topicos` | painel de linho: título com barra verde; cartões claros com marca verde que entram da esquerda no `em` de cada item |
| passos | `passos` | painel: cartões com disco numerado verde, um por passo, no `em` de cada um |
| número | `numero` | quadro cheio: o número conta num cartão claro grande, o rótulo assenta embaixo |
| comparação | `comparacao` | painel: dois cartões lado a lado com etiqueta (cinza/argila × verde); o vencedor ganha anel verde e o outro apaga |
| gráfico | `grafico` | painel: barras (a última em verde), linha que se desenha ou pizza num cartão claro; sem números ditos, tendência ilustrativa com a etiqueta |
| destaque | `destaque` | quadro cheio: a palavra num cartão carimbado, verde (`chave`) ou argila (`alerta`), com `detalhe` menor |
| definição | `definicao` | painel: cartão grande com "O QUE É", o termo enorme, um traço verde que se desenha e o significado que sobe na fala |
| frase | `frase` | quadro cheio: a frase num cartão claro, palavra por palavra; `destaque` verde, `risco` riscado em argila |
| pergunta | `pergunta` | painel: a pergunta num cartão verde-escuro; as `opcoes` entram como cartões com letra |
| fechamento | `cta` | quadro cheio: a chamada num cartão claro, ícone num círculo verde (`salvar`, `seguir`, `comentar`, `link`); fica até o último quadro |
| **assinatura** | `antesdepois` | a foto grande com a cortina ANTES | DEPOIS; a alça varre com a fala; cada `marcadores[]` aproxima uma área e põe um pino numerado; `janelaEm` leva a foto à tela cheia e a pessoa à janela (a revelação) |

## A assinatura em qualquer assunto

O `antesdepois` é **"de onde eu parti e onde cheguei, dica por dica"**: um antes, um depois e uma lista de coisas que explicam a diferença, cada uma com um lugar. Com fotos de verdade (mesmo ângulo) a cortina mostra a diferença real; sem fotos, dois cartões de rótulo (`rotulos`) carregam a ideia.

1. **Finanças/cripto.** "Mesmo na alta tem gente que perde: compra por impulso, escolhe moeda sem critério, assume risco que não entende."
   `antesdepois` com `rotulos: ["Impulso", "Critério"]` e sem imagem (cartões coloridos); três marcadores, um por erro, cada um no `em` da palavra dita (`"Compra por impulso"`, `"Escolhe moeda sem critério"`, `"Assume risco que não entende"`).
2. **Saúde ou rotina (sono).** "Antes eu dormia com o celular na cama. Agora ele carrega na sala, o quarto fica escuro e eu apago o despertador de tela."
   Par de fotos do quarto (antes com a luz do celular, depois escuro); marcadores: "celular na sala" (foco na mesa de cabeceira), "quarto escuro" (foco na janela). `rotulos: ["Antes", "Agora"]`. Se for conteúdo de saúde com pessoas, veja o aviso dos conselhos.
3. **Carreira ou história pessoal.** "Meu primeiro currículo tinha duas páginas e nenhum resultado. Hoje ele tem uma página, três números e um link."
   Par de prints do currículo (da pasta `imagens/`), `rotulos: ["Currículo 1", "Hoje"]`; marcadores: "uma página" (foco no topo), "três números" (foco no meio), "um link" (foco no rodapé); `janelaEm` na frase final para revelar o resultado.

Sem nada que tenha antes e depois num trecho, use `topicos`, `passos` ou `comparacao` (`modo: "antes-depois"`); mas toda edição tem pelo menos um `antesdepois`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço nem fato. As fotos são as do aluno: não troque por imagem de banco que finja ser o resultado dele.
- Número ilustrativo só onde o bloco permite (`ilustrativo: true`), sempre com a etiqueta visível.
- Não prometa resultado: o que a foto mostra é o que a pessoa disse que aconteceu.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **As fotos não alinham**: a cortina assume a mesma câmera nas duas. Peça outro par ou recorte as duas com o mesmo enquadramento antes de pôr em `imagens/`.
- **O marcador caiu no lugar errado**: ajuste `foco` (a área que a câmera aproxima) e `ponto` (onde fica o pino), em frações da foto.
- **Só uma foto**: use `--escolher <id> 0` na que falta (vira cartão de rótulo) ou mude para `topicos`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais ou quebrado**: passou do limite do bloco (veja `references/plano.md`); encurte com as palavras da fala.
- **O texto do peito entrou um pouco depois da palavra**: logo depois de um painel ele espera a pessoa voltar ao quadro cheio. Se a palavra é importante, termine o momento anterior um pouco antes.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
