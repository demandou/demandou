---
name: modelo-rotulo
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Rótulo: o vídeo vira a leitura de uma ficha técnica impressa. A pessoa encolhe até virar o camafeu oval de um rótulo fictício, uma lupa de verdade lê cada campo quando ele é dito e uma ficha de papel explica com linhas-guia, números que contam, medidor, carimbo e traços que passam de lápis a tinta. Papel creme, tinta, um vinho de destaque e Libre Caslon. Serve para qualquer assunto (o exemplo é um sommelier lendo um vinho, mas funciona com cripto, finanças, saúde, rotina, vendas, aulas e histórias): a IA monta o rótulo do que a pessoa explica e traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Rótulo\", \"estilo rótulo\", \"ficha técnica\", \"anatomia do rótulo\" ou \"com lupa\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Rótulo

O vídeo vira a leitura de uma ficha técnica impressa. A pessoa abre em quadro cheio com uma ficha de papel na altura do peito; quando a explicação começa, o vídeo encolhe até virar o **camafeu** (o emblema oval) de um rótulo fictício que ocupa a tela. Uma **lupa** de verdade lê cada campo do rótulo no instante em que ele é dito, a câmera aproxima o campo, e a **ficha** embaixo explica com o desenho daquele bloco (lista com linhas-guia, número que conta, medidor, carimbo, gráfico a traço). Cada campo lido ganha um número no rótulo, como uma prancha de anatomia. No fechamento, o camafeu cresce de volta e um lacre carimba a ficha.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um sommelier lendo o rótulo de um vinho, mas o vídeo do usuário pode ser sobre qualquer coisa: o rótulo vira a ficha técnica do que a pessoa explica (um ativo, um hábito, um produto, uma lembrança). Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** tudo já está escrito "a lápis" (cinza claro, tracejado) e ganha tinta na palavra em que é dito, abrindo da esquerda para a direita. A lupa desliza com curva firme de um campo a outro (e sai do papel quando o caminho passaria pelo rosto); a câmera aproxima 6 a 12% cada campo lido. Números contam, medidores enchem, ponteiros giram, linhas-guia pontilhadas se desenham, o carimbo bate e assenta. Entra decidido e assenta devagar; nada de quique. A ficha que sai cruza com a que entra.
- **Organização e hierarquia:** em cima, o rótulo (o resumo do vídeo: nome grande, uma linha larga em caixa alta e até 4 campos em volta do camafeu); embaixo, a ficha (cabeçalho com o número do campo e o título em caixa alta; o corpo com uma ideia grande por vez). O que está sendo lido fica grande e nítido dentro da lente; o resto fica no papel.
- **Tipografia:** Libre Caslon Display para o nome do rótulo e os números grandes; Libre Caslon Text para todo o resto, num peso só, com itálico de verdade para destaques e notas; caixa alta espaçada nos cabeçalhos e rótulos dos campos. Títulos de ficha de 84 a 96 px, corpo de 44 a 60 px, nada abaixo de 30 px. Nada de fonte condensada.
- **Moldura da pessoa:** quadro cheio com o rosto no centro (abertura, perguntas, fechamento e o que tiver `"pessoa": "cheia"`) ou o camafeu oval de 400×500 px no alto do rótulo, com o rosto inteiro, seguindo o rosto quando a pessoa se mexe. A troca é o vídeo encolhendo até a elipse (0,8 s) e começa 0,16 s antes do corte, para esconder o pulo. A pessoa nunca é recortada do fundo nem coberta.
- **Cores, textura e som:** papel creme `#F4EEE3`, tinta `#211B18`, um único destaque vinho `#701C2E` (grifos, números dos campos, medidor, carimbo, lacre), lápis `#C9BFB1` para o que ainda não foi dito, vidro escuro `#0D1310` em volta do rótulo. Sons raros e tonais: um "vum" grave quando a pessoa vira camafeu, uma nota que sobe a cada campo lido, um tom grave quando o carimbo ou o lacre batem.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez; navegador de render; fontes do Google Fonts). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Ana" / "Nutrição"): vão nas letras miúdas do pé do rótulo, no cabeçalho do fechamento e no lacre (as iniciais). Sem resposta, siga sem nome.

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

- **tentativas abandonadas e repetidas** (a mesma frase começada várias vezes): fica a última tentativa completa;
- **erros, tosses, "pera, vou de novo"**, e o "pronto, obrigado" do fim da gravação.

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala (costuma esconder repetições). Trecho marcado `[sem transcrição: ouça antes de tirar]`: se for fala, deixe.

**Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre frases viram cortes, e é nos cortes que o layout troca** (a pessoa vira camafeu ou volta ao quadro cheio): o movimento esconde o pulo. Mantenha a proposta do `preparar`; pausas curtas (até ~0,3 s) o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.49 --rosto-y 0.31 --queixo-y 0.41
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte (`cortesEm`) no plano. **O recorte já vem decidido pelo modelo**: o `modelo.json` fixa gravação vertical em 9:16 (a pessoa ocupa o quadro inteiro nos momentos de quadro cheio, e o camafeu precisa de imagem em volta do rosto); gravação horizontal vira 3:4. A ficha fica logo abaixo do queixo. O aviso "o queixo ficou muito perto da zona" pode ser ignorado neste modelo (a ficha cobre o peito de propósito). Refazendo o corte depois de já ter planejado, use `--manter-plano`.

No fim, o `cortar.mjs` segue o rosto pelo vídeo: o camafeu acompanha quando a pessoa se mexe e o tamanho do rosto dentro dele é ajustado sozinho. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias. Sem momentos no plano, a pessoa aparece em quadro cheio: a cruz azul tem que cair no rosto e a linha vertical fina mostra o centro do quadro (o rosto deve estar nela); a caixa laranja é a ficha (começa abaixo do queixo); a caixa amarela é a legenda; a oval roxa é o camafeu; todo texto fica acima da linha vermelha (interface do aplicativo). Se a cruz não cair no rosto, refaça o passo 4.

Depois de planejar, `node scripts/stills.mjs --guias <segundos dentro de um momento do rótulo>` mostra o camafeu: o rosto tem que estar inteiro dentro da oval, com testa e queixo. Se não estiver, ajuste `camafeu.zoom` e `camafeu.ancoraY` no plano (ver `references/plano.md`).

### 6. Mapa editorial e o rótulo

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: cada batida ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela "Blocos deste modelo". A assinatura (`campo` ou `medidor`) entra pelo menos uma vez.

Antes dos momentos, monte o **rótulo**: a ficha técnica do que o vídeo explica, **só com palavras e dados da fala**.
- `nome`: o tema em 1 a 3 palavras ("Bitcoin", "Sono", "O relojoeiro").
- `linha`: a linha larga em caixa alta, de preferência 2 a 4 itens separados por " · " que a fala enumera ("Mercado · Riscos · Ativos"). A lupa anda por ela nos `passos` e `topicos`.
- `campos`: até 4 pares nome e valor curtos ("Preço" US$ 83 mil; "Ciclo" Alta; "Risco" Alto). O 3º sai em itálico vinho e o 4º em caixa alta.
- Nunca use marca, empresa ou produto real que a pessoa não citou.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `rotulo`, `momentos`, `semLegenda` e `correcoes`. Em cada momento do rótulo, diga em `alvo` qual campo a lupa lê (o nome do campo, "nome" ou um trecho da linha larga); cada campo lido ganha um número, e o ideal é que, no fim, todos os campos do rótulo tenham sido lidos.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node scripts/legendas.mjs` (num vídeo todo coberto por momentos, ele mostra 0 linhas: está certo).

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro antes, no meio, um logo depois de cada sub-passo (todo campo `em` ou terminado em `Em`) e um depois do fim. Olhe cada imagem **reduzida a ~540 px de largura** e confira: o texto cabe e se lê? Cada palavra ganha tinta quando é dita? A lupa para em cima do campo certo, e o número dela é o mesmo do cabeçalho da ficha? O rosto está inteiro no camafeu e nada cobre o rosto? O rótulo tem algum campo cortado ou longo demais? Confira também o meio de duas ou três trocas (`node scripts/stills.mjs 3.1 7.2`): o que sai cruza com o que entra, sem quadro vazio. Corrija o plano e repita.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-rotulo.mp4"
```

Ele confere o plano de novo antes de renderizar e normaliza o áudio. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e o que o rótulo diz);
- o que é ilustrativo (formas de gráfico e níveis de medidor que a fala não deu em número);
- o que o usuário deve conferir (uma tomada em dúvida, um nome que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | quadro cheio; a ficha no peito com caixa alta em cima ("Ficha técnica" ou o que você escrever) e o título que ganha tinta palavra por palavra; `selo` opcional: mostrador redondo com o número e marcas que se acendem |
| lista | `topicos` | no rótulo; a lupa lê o campo; na ficha, um losango vinho por item e uma linha-guia pontilhada até a margem (como numa ficha técnica), cada item na sua palavra; o da vez fica com a linha vinho |
| passos | `passos` | números em círculo vinho ligados por um traço que chega quando o passo é dito; se os passos estão na linha larga do rótulo, a lupa anda por ela |
| número | `numero` | o número conta até o valor (pt-BR, com prefixo e sufixo em vinho) e uma régua de medida enche junto; o rótulo do número em itálico |
| comparação | `comparacao` | duas colunas separadas por filete duplo com losango (× contra, → antes e depois); o vencedor ganha o grifo vinho, o outro esmaece (riscado em `errado-certo`) |
| gráfico | `grafico` | barras, linha ou pizza a traço com os números ditos; sem números, a curva da tendência se desenha sobre pautas, com a etiqueta "ilustrativo" |
| destaque | `destaque` | um carimbo de borda dupla em caixa alta que bate na ficha (vinho em `alerta`, tinta em `chave`) e o detalhe em itálico embaixo |
| definição | `definicao` | o verbete: o termo grande, uma linha-guia pontilhada que leva ao significado em itálico |
| frase | `frase` | a citação com aspas vinho grandes, palavra por palavra; o trecho do `risco` é riscado em vinho quando é dito |
| pergunta | `pergunta` | quadro cheio; a pergunta se escreve e o selo do "?" acende uma marca a cada palavra; `opcoes` viram caixinhas de marcar |
| fechamento | `cta` | quadro cheio; a chamada com o grifo, o ícone (fita de salvar, "+" que vira visto, balão ou etiqueta de "saiba mais") e o lacre de cera com as iniciais carimbando na última palavra |
| **assinatura** | `campo` | a lupa lê um campo do rótulo; a ficha mostra o valor grande, uma linha-guia até o número do campo e até 2 frases da fala |
| **assinatura** | `medidor` | qualquer escala (risco, intensidade, dificuldade, saudade): o valor se escreve, a barra com as duas pontas enche e o ponteiro do mostrador gira junto ("ilustrativo" quando o nível não foi dito) |
| tipos do exemplo | `origem`, `variedade`, `ano`, `teor` | os do vídeo do sommelier: mapinha do país com o ponto da região (serve para qualquer lugar), desenho a traço com exemplos, régua de anos (serve para qualquer ano), teor com taça |

Por padrão, `abertura`, `pergunta` e `cta` ficam em quadro cheio e todos os outros no rótulo. Qualquer momento aceita `"pessoa": "cheia"` ou `"pessoa": "camafeu"`: alterne para a pessoa mudar de lugar a cada 2 ou 3 momentos (uma frase forte ou um carimbo em quadro cheio no meio do rótulo).

## A assinatura em qualquer assunto

A assinatura é **ler uma coisa como se lê um rótulo**: o assunto vira uma ficha técnica com nome, uma linha e campos, e a lupa examina cada campo quando a pessoa fala dele. O `medidor` é a escala impressa no rótulo, para qualquer grandeza.

1. **Cripto.** Fala: "O Bitcoin rompeu os 83 mil dólares… tem gente que perde porque compra por impulso… sem promessa de lucro." Rótulo: nome "Bitcoin", linha "Mercado · Riscos · Ativos", campos Preço US$ 83 mil, Ciclo Alta, Lucro "Sem promessa", Aula Gratuita. Um `campo` lê o Preço enquanto ele diz "reacendeu a conversa"; um `medidor` "Dinheiro no bolso" quase vazio em "para a maioria das pessoas" (ilustrativo); os `passos` fazem a lupa andar por Mercado → Riscos → Ativos.
2. **Saúde e rotina.** Fala: "Dormir menos de 6 horas derruba sua concentração; o ideal é de 7 a 9." Rótulo: nome "Sono", linha "Horário · Escuro · Silêncio", campos Mínimo 7 h, Ideal 7 a 9 h, Risco Concentração. Um `numero` conta 6 horas; um `medidor` "Concentração" cai de alto para baixo; um `campo` lê "Ideal: 7 a 9 h".
3. **Uma história pessoal.** Fala: "Meu avô consertava relógios. Todo domingo ele abria um na mesa da cozinha e me deixava segurar a lupa. Ele dizia: o tempo não para, mas dá pra cuidar dele." Rótulo de uma lembrança: nome "O relojoeiro", linha "Domingo · Mesa da cozinha", campos Quem "Meu avô", Ofício "Relógios", Eu "Segurava a lupa". Um `campo` lê "Quem: Meu avô"; um `passos` faz a lupa andar de "Domingo" para "Mesa da cozinha"; a `frase` "o tempo não para" fecha com o trecho em itálico vinho; um `medidor` "Saudade" (ilustrativo) enche na última palavra.

Se a fala não tem dado nenhum, o rótulo continua existindo: os campos são as palavras-chave da história (quem, onde, quando, o quê) e o `medidor` mostra uma intensidade com a etiqueta "ilustrativo".

## Fidelidade

- Tudo na tela vem da fala: o rótulo inclusive (nome, linha e campos são palavras ou dados ditos, ou um resumo fiel deles).
- Não invente número, nome, preço, taxa nem fato.
- Número ilustrativo só onde o bloco permite (`grafico` com `tendencia`, `medidor`, `numero` com `ilustrativo`), e com a etiqueta visível.
- Nunca use marca, empresa ou produto real que a pessoa não citou. O rótulo é fictício.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele (tabela acima). Trecho longo de lista vira `topicos` com um item por palavra; trecho sem dado vira `frase`, `destaque` ou `campo`. Não use `--forcar`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Uma fala sumiu do vídeo**: o trecho dela foi marcado para sair em `work/cortes.json`. Marque `"manter": true` e rode o `cortar.mjs` de novo com `--manter-plano`.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Texto pequeno demais na ficha**: o texto passou do limite do bloco e encolheu; encurte (fiel à fala) conforme `references/plano.md`.
- **Um campo do rótulo ficou espremido**: valor longo demais. Use até ~14 caracteres por campo e até ~40 na linha larga (ela quebra em duas linhas se precisar).
- **A lupa parou no campo errado**: escreva o `alvo` igual ao nome do campo (ou ao trecho da linha larga, sem diferença de acento).
- **Pulo visível na troca de layout**: a fronteira do momento ficou longe de um corte. Mova o `de` do momento para o valor de `cortesEm` mais próximo.
- **Rosto pequeno ou cortado no camafeu**: `"camafeu": { "zoom": 2.8 }` aproxima, `1.6` afasta; `"ancoraY"` (padrão 0,62) sobe (menor) ou desce (maior) o rosto dentro da oval.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
