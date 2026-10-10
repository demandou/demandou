---
name: modelo-orbita
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Órbita: quando a fala entra no assunto, o fundo vira espaço profundo em 3D, a pessoa vai para uma moldura embaixo (fundo natural) e a câmera recua pela escala até mostrar dois corpos (o Sol e a Terra, ou o que a fala pedir); a luz viaja de um ao outro com o relógio contando o tempo dito, a origem apaga, acende ou explode na palavra, e no fim a câmera sobe para o céu com cada corpo e o seu valor. Abre com a virada \"E se eu fosse…\" e a linha de luz que troca a roupa. Serve para qualquer assunto (o exemplo é um professor de ciências, mas funciona com física, curiosidades, \"você sabia\", saúde, finanças e cripto, em que moedas viram corpos em órbita): a IA traduz a fala para os blocos do estilo. Use quando o usuário pedir \"modelo Órbita\", \"estilo Órbita\", \"edição com espaço\", \"astronomia\", \"e se eu fosse\" ou um Reel explicativo com 3D. Entrega um MP4 vertical 1080×1920."
---

# Modelo Órbita

O vídeo vira uma aula de ciências de documentário, curta e vertical. A pessoa fala em quadro cheio e, na virada ("E se eu fosse… PROFESSOR"), uma linha de luz desce e troca a roupa dela. Quando a fala entra no assunto, o fundo vira **espaço profundo em 3D**: a pessoa encolhe para uma **moldura embaixo, com o fundo natural**, e a câmera **recua pela escala** até mostrar a origem e o destino; a luz viaja, o relógio conta, o Sol **apaga na palavra** e a última frente de luz ainda chega. No fecho, a câmera **sobe para o céu** e cada corpo aparece com o seu valor. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, seguir o rosto, conferir, renderizar); você faz a parte de diretor: as tomadas, o mapa da fala e a conferência dos quadros.

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um professor de ciências, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a câmera 3D se move pela escala **na palavra**: recua (ou mergulha) quando o assunto entra e sobe como uma grua a cada bloco novo (o bloco que sai desce, o novo entra por cima, as estrelas passam). Dentro de cada bloco algo sempre anda: a luz flui no caminho, o fóton viaja, o relógio conta, os planetas giram e andam na órbita, a câmera empurra devagar. Os textos sobem saindo do desfoque, palavra por palavra. Na virada, a linha de luz desce em 0,6 s.
- **Organização e hierarquia:** a informação fica **em cima** (faixa de y 150 a 760) e a pessoa **embaixo**, na moldura (y 800 a 1856). Na cena de escala: a origem no alto à esquerda, o destino à direita acima da moldura, o caminho da luz entre eles, o relógio no alto à direita e a cota sobre o caminho. Uma ideia por vez; números grandes em mono; rótulos em caixa alta espaçada.
- **Tipografia:** **Sora** (500 a 800) para tudo que se lê, títulos com tracking −0,02em; **IBM Plex Mono** (500/600) para números, relógios e contadores. Nome da virada de 60 a 124 px; títulos de 54 a 92; números de 70 a 190; rótulos de 26 a 30, com espaçamento 0,14em. A legenda é Sora 800 de 66 px, **toda branca, com contorno preto e sombra leve**, em blocos de até 3 palavras.
- **Moldura da pessoa:** quadro cheio fora do espaço (rosto no eixo do meio, punch de 1,00/1,12 a cada corte). No espaço, moldura de cantos arredondados (44 px), borda fina clara e sombra suave, **sempre com o fundo natural da gravação**, seguindo o rosto. Opcional: com um vídeo da pessoa de fundo transparente (`plano.recorte`), ela aparece recortada na frente das estrelas.
- **Cores, textura e som:** espaço azul-noite quase preto (`#04050A` → `#0A0E1C`), estrelas com a faixa discreta da Via Láctea, **um** destaque quente, o laranja do Sol `#D97757` (claro `#F0A27F`, quente `#FFE6DA`), texto `#FFF8F2`, alerta em brasa `#FF6A4D`. Nada mexe na cor do vídeo da pessoa. Sons tonais e raros: o cristal da virada, o recuo, o Sol que apaga (ou acende), o céu, um tom por item. Música só se o usuário mandar (`trilha`, sem batida).

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (transcrição e navegador de render, baixados uma vez só). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio. O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte **uma vez**, numa mensagem só (sem resposta, siga sem):
   - **se o vídeo abre com uma virada** ("E se eu fosse…", "imagina que…") e se ele tem **o mesmo vídeo com a roupa trocada** por uma IA de vídeo (passo 5b). Sem ele, a virada muda o enquadramento;
   - se tem **música própria sem batida** para pôr baixinho;
   - se tem **o vídeo dele com fundo transparente** (`.webm`, feito em qualquer removedor de fundo de vídeo). Sem ele, a moldura com o fundo natural é o padrão (e o melhor resultado).

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela (já inclui o 3D).

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: costuma esconder repetições. Itens marcados `[sem transcrição: ouça antes de tirar]` podem ser fala que a transcrição perdeu: só tire se confirmar que não há fala.

**Duas versões completas com conteúdo diferente** não são tomada repetida: pergunte ao usuário qual fica. Sem poder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Pausas curtas (até ~0,5 s) são respiração e ficam. Só as pausas longas saem.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.48 --rosto-y 0.40 --queixo-y 0.50
```

O `modelo.json` fixa o vertical em 9:16 (a pessoa vai para a moldura, não precisa de espaço embaixo do queixo). No fim, o `cortar.mjs` segue o rosto pelo vídeo: o quadro cheio e a moldura acompanham quando a pessoa se mexe. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias: a elipse azul deve cair no rosto; o retângulo amarelo é a margem; o verde, a área da informação no espaço; o rosa, a moldura; as linhas branca e laranja, a legenda no quadro cheio e na moldura (abaixo do queixo); nada importante abaixo da linha vermelha. Se o rosto não estiver na elipse, refaça o passo 4 com as medidas corrigidas.

### 5b. A virada com a roupa trocada (opcional)

A virada funciona sem nada: a linha de luz desce e, acima dela, já é o enquadramento novo. Para a **roupa trocar ao vivo** (o efeito do exemplo):

1. Depois do passo 4, pegue `public/base.mp4` (o vídeo já cortado) e gere **o mesmo vídeo com a roupa (ou o cenário) da persona** numa IA de vídeo que edite um vídeo existente (troca de roupa por imagem de referência). A fala, o rosto e os gestos precisam ficar iguais; só a roupa muda.
   - Pode ser só um trecho (as IAs costumam aceitar de 5 a 15 s): comece um pouco antes da virada.
   - Confira a boca: se a IA mexer no rosto, a fala sai fora de sincronia. Nesse caso, use um trecho menor ou deixe sem.
2. Salve em `public/virada.mp4` e, no momento `virada`, ponha `"video": "virada.mp4"` e `"videoDe"`: o segundo do vídeo de trabalho em que cai o quadro 0 desse arquivo (0 se for o vídeo inteiro). `videoAte` (opcional) diz até quando ele vale; depois volta o original.
3. A voz continua vindo do vídeo original: o arquivo trocado entra mudo.

Quando o usuário não tiver o arquivo, explique isso como opcional, em uma frase, e siga sem.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Cada batida ganha uma forma (lista, número, comparação…) e um bloco **deste modelo**, segundo a tabela abaixo. A assinatura (`orbita` e `ceu`) entra pelo menos uma vez. Na Órbita a pergunta é: **o que viaja de onde para onde, em quanto tempo e a que distância? O que acontece na palavra forte (apaga, acende, explode)? Que coisas a fala enumera que podem virar corpos no céu?**

1. **Virada:** "E se eu fosse…", "imagina se…", "vou te contar como um…" vira `virada` (a pergunta em cima da cabeça e a linha de luz). Sem isso no vídeo, comece por `abertura`.
2. **Raio (opcional):** quando a fala diz que algo chega **até você** ("a luz que bate em você", "o sinal que chega no seu celular"), use `raio` antes de o espaço entrar.
3. **Órbita (a assinatura):** a frase que liga duas coisas por distância, tempo ou causa vira `orbita`: origem e destino como corpos, a viagem com o tempo dito, a cota com a distância dita e o **evento** na palavra que muda tudo ("apagasse", "nascesse", "explodisse", "caísse", "reacendeu").
4. **Céu (a assinatura):** a conclusão que enumera coisas ("olhar pro céu é olhar pro passado", "a Lua, o Sol e as estrelas") vira `ceu`: a câmera sobe e cada coisa vira um corpo com o nome e o valor.
5. **O resto da fala:** listas, números, comparações, definições e frases fortes viram os blocos universais, todos no mesmo espaço, em cima da moldura.
6. Respiros só com a pessoa e a legenda: no máximo ~3 s, numa transição.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, os corpos, os limites de texto e as regras de tempo) e preencha `src/plano.json`: `momentos`, `semLegenda`, `correcoes` e, se houver, `trilha` e `recorte`. O `references/estilo.md` explica o layout e o movimento, para conferir os quadros.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- se o plano tiver `maos` (rastreio das mãos), `node ferramentas/gesto.mjs`: grava o instante do gesto no evento;
- `node scripts/legendas.mjs`: confira as linhas de legenda.

Nomes e termos que a transcrição errou vão em `correcoes`. Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra cada imagem **reduzida a ~540 px de largura** e confira:
- a pessoa na moldura com a cabeça inteira e folga em cima; a legenda no peito, abaixo do queixo, nunca em cima da borda da moldura;
- o corpo certo aparece quando a palavra é dita; o relógio para no tempo dito; a cota mostra a distância dita;
- o evento (apaga, acende, explode) cai na palavra; a última frente de luz chega no destino na palavra seguinte;
- nada da informação desce para dentro da moldura (y > 780) nem encosta nas bordas; o texto cabe;
- nenhum quadro com dois blocos um sobre o outro na troca (`node scripts/stills.mjs 7.9 7.95 8.0`).

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-orbita.mp4"
```

Ele confere o plano de novo, renderiza em 1080×1920 e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e quais corpos);
- o que é ilustrativo (corpos e viagens sem número dito);
- o que o usuário deve conferir (um valor que ele precisa confirmar, a virada sem o vídeo trocado, uma palavra que a transcrição pode ter errado).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| **assinatura: a cena de escala** | `orbita` | o fundo vira espaço, a pessoa vai para a moldura e a câmera recua (ou mergulha) até a origem no alto à esquerda e o destino à direita; o fóton viaja com o relógio em mono contando o tempo dito; a cota mostra a distância; no evento a origem apaga em brasa (ou acende, ou explode) e a última frente de luz viaja até o destino, que continua aceso até ela chegar |
| **assinatura: o céu** | `ceu` | a câmera sobe como uma grua; até 4 corpos aparecem, cada um na sua palavra, com "Nome · valor"; no `grifoEm` os valores ganham o traço laranja |
| virada | `virada` | "E se eu fosse" pequeno, o ícone e o NOME grande no laranja, letra por letra, em cima da cabeça; a linha de luz desce e troca a roupa (ou o enquadramento) |
| raio | `raio` | um feixe quente entra do canto de cima e bate no lado do rosto |
| abertura | `abertura` | um pequeno sistema (Sol e planeta em órbita) em cima e o título palavra por palavra, com o destaque no laranja e o traço de luz embaixo |
| lista | `topicos` | corpos em órbita: cada item é um planeta (ou moeda, ou célula) que entra num grande arco de órbita na palavra, com o nome ao lado; a luz percorre o arco até o item da vez |
| passos | `passos` | a trajetória: a luz sai de um pequeno Sol e salta de parada numerada em parada até o planeta de chegada; o passo da vez aparece grande embaixo do caminho |
| número | `numero` | o relógio da Órbita: um corpo grande à esquerda e o número em mono contando à direita, com o rótulo espaçado em cima e a barra embaixo |
| comparação | `comparacao` | dois corpos lado a lado com a cota entre eles; no veredito o vencedor acende (calor em volta, nome no laranja) e o outro apaga |
| gráfico | `grafico` | barras como colunas de luz, linha como constelação desenhada ponto a ponto, pizza como um anel de órbita dividido; sem números, a curva da tendência com "ilustrativo" |
| destaque | `destaque` | um Sol acende em cima e a palavra bate grande, com o traço de luz; no alerta, uma estrela vermelha pulsa e a palavra fica em brasa |
| definição | `definicao` | o termo grande, a cota de medida embaixo dele e o significado linha a linha, na fala |
| frase | `frase` | a fala palavra por palavra sobre as estrelas, com o ícone de órbita girando em cima; `destaque` no laranja, `risco` riscado por uma linha de luz |
| pergunta | `pergunta` | o "?" no centro de uma órbita, a pergunta palavra por palavra e um corpo para cada opção |
| fechamento | `cta` | o ícone da ação (salvar, seguir, comentar, link) num disco laranja com um planeta girando em volta, e a chamada palavra por palavra |

## A assinatura em qualquer assunto

A `orbita` representa **"isto sai daqui e chega ali, e leva este tempo"**, com um evento que muda tudo no meio. O `ceu` representa **"cada uma destas coisas, com o seu valor"**. Os corpos são livres: estrelas e planetas, mas também átomo e célula (versão micro), galáxia, buraco negro e moeda. Sem número dito, fica ilustrativo: a barra anda sem relógio e o céu mostra só os nomes.

1. **Finanças/cripto.** "O Bitcoin reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas."
   `orbita` com `camera: "mergulho"`, `origem: { corpo: "sol", nome: "Bull market" }`, `destino: { corpo: "moeda", nome: "Criptomoedas" }` e `evento: { efeito: "acende", em: <reacendeu>, rotulo: "Ciclo de alta", chegaEm: <alta> }`, sem valor: a barra anda e a luz chega na moeda. Depois, "analiso o mercado, os riscos e os ativos" vira `ceu` com três corpos sem valor (planeta, rochoso, moeda).
2. **Saúde (versão micro).** "A glicose do pão chega no seu sangue em 15 minutos; se você corta o açúcar, o pico some."
   `orbita` com `origem: { corpo: "celula", nome: "Intestino" }`, `destino: { corpo: "celula", cor: "#E58A8A", nome: "Sangue" }`, `viagem: { valor: 15, unidade: "min", rotulo: "Tempo até o sangue" }` e `evento: { efeito: "apaga", em: <corta> }`.
3. **História pessoal.** "A decisão que eu tomei há 10 anos ainda chega em mim todo dia."
   `orbita` com `origem: { corpo: "estrela", nome: "A decisão" }`, `destino: { corpo: "terra", nome: "Hoje" }`, `viagem: { valor: 10, unidade: "anos", rotulo: "Faz" }` e `aviso: { texto: "Ainda", detalhe: "chega em mim" }`; fecha com `frase` na linha mais forte.

Outros nichos: física (som, luz, gravidade: a viagem com o tempo dito), "você sabia" (a distância e o tempo das coisas), química (átomos que se ligam: `topicos` com `corpo: "atomo"`), história (o céu com os anos de cada fato).

## Fidelidade

- Tudo na tela vem da fala.
- Não invente número, nome, distância nem tempo. O relógio, a cota e os valores do céu só com o que foi dito (ou com o valor exato do que foi dito, quando o usuário confirmar: "oito minutos" pode virar 08:20).
- Número ilustrativo só onde o bloco permite, e com a etiqueta visível. Os corpos são ilustração: escolha o que faz sentido com a fala, nunca uma marca ou logo real (moeda com símbolo genérico, nunca o logo de uma criptomoeda).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta) e escolha um bloco para ele. Não use `--forcar`.
- **O evento não cai no gesto**: sem rastreio das mãos, o evento cai na palavra (`em`); ajuste `em` para a palavra certa. Com `maos`, rode `node ferramentas/gesto.mjs` de novo.
- **A virada troca a roupa fora de sincronia**: o `videoDe` está errado (confira o quadro 0 do arquivo) ou a IA mexeu na boca; use um trecho menor ou tire o `video`.
- **A pessoa aparece cortada na moldura**: confira as guias (passo 5); com o rosto muito alto ou muito perto da câmera, refaça o passo 4 com as medidas certas.
- **O texto da informação desce para a moldura**: encurte o texto com as palavras da fala ou divida o momento em dois.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
