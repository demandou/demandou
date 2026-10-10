---
name: modelo-balcao
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Balcão, a fachada de uma loja de bairro: toldo listrado com letreiro no alto, uma vitrine de vidro onde os produtos entram na prateleira com adesivo de preço, o combo carimbado, o cartão de mapa ilustrado com pino no endereço, a placa de horário e o balão de pedido; a pessoa fica embaixo do balcão, numa moldura larga. Feito para comércio local (restaurante, hamburgueria, confeitaria, loja, salão, academia, pet shop), mas serve para qualquer assunto (finanças, saúde, serviços, aulas, histórias): a IA traduz a fala para os blocos do estilo, com modo ilustrativo para serviço sem produto. Use quando o usuário pedir \"modelo Balcão\", \"estilo vitrine\", \"vídeo da minha loja\", \"promoção do restaurante\", \"divulgar meu negócio\" ou quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Balcão

O vídeo vira a fachada de uma loja de bairro. No alto, o **toldo listrado** com o **letreiro** que desce na palavra dita; embaixo dele, a **vitrine** de vidro com moldura de madeira, onde tudo acontece; depois o **balcão** de madeira e a pessoa numa moldura larga embaixo. Cada produto é **posto na prateleira** na palavra que o nomeia, com a etiqueta do nome e o **adesivo de preço** colado com uma batida; o **combo** amarra os produtos com uma fita kraft e o **carimbo** bate o valor; o **mapa ilustrado** sobe na vitrine e o **pino** cai no número dito; a **placa de horário** desce do toldo; o fechamento é um **balão de pedido** (conversa genérica, sem marca de aplicativo). Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, buscar imagens, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher as imagens, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com uma confeitaria ("toda quinta é dia de bolo de pote"), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Gancho:** o primeiro quadro já é a fachada com conteúdo no vidro: a `abertura` com `cena` mostra o interior ilustrado da loja (prateleira, expositor, plaquinha balançando) e a frase entra palavra por palavra.
- **Dinâmica do motion:** as coisas são **postas** na vitrine: descem 90 px e assentam com um leve passar do ponto (0,42 s), com a sombra crescendo no tampo da prateleira. O adesivo de preço **bate** (150% → 100%, girando 16°, em 0,2 s). O carimbo **bate uma vez** (170% → 100%) e a tinta assenta. A placa **cai do toldo e balança** no gancho até parar. O letreiro desce do toldo e o nome se pinta da esquerda para a direita. O texto entra palavra por palavra, na fala. O vidro nunca fica parado: um reflexo diagonal atravessa devagar e a saia do toldo ondula com o vento. Trocas: o bloco que sai sobe 24 px e some em 0,16 s; o mapa sobe por cima como um cartão. Nada de giro solto, tremida, flash ou neon.
- **Organização e hierarquia:** a tela é sempre a fachada: toldo (y 0 a ~230), vitrine (x 64 a 1016, y 262 a 952), balcão (y 952 a 1008) e a pessoa embaixo (a partir de y 1008). Na vitrine: letreiro pintado no alto do vidro, produtos em pé na prateleira (1 a 4 colunas), etiquetas do nome na beira da prateleira, adesivos no canto de cima de cada produto. Uma ideia por vez dentro do vidro.
- **Tipografia:** **Plus Jakarta Sans** em todo texto de leitura (800 para títulos, preços e nomes; 700 para etiquetas; 600 para detalhes), tracking −0,02em no 800 (nunca mais apertado que −0,025em). **Fraunces itálica** só no letreiro do toldo (rótulo curto). Nada condensado.
- **Moldura da pessoa:** sempre embaixo do balcão, numa moldura larga de madeira (x 30 a 1050, cantos de 40 px, os de baixo fora do quadro), com a cabeça inteira e ~56 px de folga acima do cabelo, o rosto no eixo central e seguido quadro a quadro. Troca de escala em corte seco (100% ↔ 106%) e soco de 4% quando o carimbo bate e quando o pino cai. O cartão de apresentação (nome ≥ 34 px) fica no canto de cima à esquerda da moldura da pessoa, na folga acima da cabeça, nos primeiros ~3,6 s.
- **Cores, textura e som:** parede creme-manteiga (#F3E1C1) com tábuas, **toldo tomate (#D8432A) e creme**, madeira-mel (#C17E43), vidro creme quase branco, tinta café (#3B2416, nunca preto), adesivo mostarda (#F4B731), carimbo e pino em tomate, sálvia (#8FA66E) no mapa. Não é giz (a Lousa já é giz) nem preto com dourado. Sons tonais, raros e baixos: nota de madeira por produto posto (subindo), um "tic" no adesivo, duas notas na fita, batida grave no carimbo, o pino que cai, dois toques de madeira na placa, o balão que abre. Nada de sino nem de caixa registradora.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar as imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo e pergunte uma vez:
   - **nome e área** de quem fala (ex.: "Bruno Siqueira" / "Confeiteiro"): vão no cartão de apresentação do começo. Sem resposta, siga sem cartão;
   - o **nome do negócio** para o letreiro do toldo (ex.: "Confeitaria", "Burguer do Zé"). O letreiro desce na palavra em que o nome é dito; se o nome não for dito, ele desce na primeira palavra. Sem nome, o toldo fica só com as listras;
   - se ele tem **fotos dos produtos** (de preferência com fundo liso): elas vão numa pasta `imagens/` dentro do projeto e passam na frente das buscadas.

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`). **Duas versões completas com conteúdo diferente** não são uma tomada repetida: pergunte ao usuário qual fica.

O ritmo de vídeo de loja é corrido: respiro de 0,2 a 0,4 s entre as frases. O `cortar.mjs` junta trechos com menos de 0,3 s entre eles (mantendo a pausa original) e corta o resto. Para apertar uma pausa, mexa no `ate` do trecho de antes e no `de` do de depois, deixando **pelo menos 0,31 s cortados** entre eles.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (com uma grade de 0,05 em 0,05) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.42
```

O script corta, enquadra e calcula `rosto` e os pontos de corte no plano. **O recorte já vem decidido pelo modelo** (`modelo.json` fixa a gravação vertical em 9:16; a pessoa fica sempre na moldura de baixo). Refazendo o corte depois de já ter planejado, use `--manter-plano`. No fim, o `cortar.mjs` segue o rosto pelo vídeo: a moldura acompanha quando a pessoa se mexe.

### 4b. Corrigir as palavras

Abra `src/plano.json` → `palavras` (o mesmo que `work/palavras.json`) e corrija o que a transcrição errou, **no lugar certo da lista**:
- preços e números: a transcrição escreve "R$ 12,00" ou "3" no lugar de "doze reais" e "três". Troque pelo que foi dito (`"doze"`, `"reais"`, `"três"`), com os tempos de cada palavra;
- nomes de produtos, ruas e do negócio;
- apague palavras inventadas no silêncio.

O Whisper costuma marcar o começo de palavras com consoante forte ("cada", "paga", "três", "bolo") ~0,1 a 0,2 s **atrasado** ou adiantado. Os preços e o combo entram nessas palavras: se o timing gate (passo 7) passar perto do limite, meça o volume no trecho (`ffmpeg -ss <de> -t 0.6 -i public/base.mp4 -af astats=metadata=1:reset=1,ametadata=print -f null -`) ou confira o quadro, e corrija o `em` da palavra.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul deve cair no rosto, com a cabeça inteira logo abaixo da linha rosa (a moldura, y 1008); a linha amarela é o centro da legenda (abaixo do queixo); o retângulo verde é a área útil do vidro; nada importante fora das linhas vermelhas (interface do app e margens de 64 px). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`. Ache:
- o **negócio** e onde o nome é dito (letreiro do toldo);
- os **produtos ou serviços** ditos (cada um vira um item da `vitrine`, na palavra do nome) e os **preços ditos** (adesivo de cada item ou um preço único "cada");
- a **condição** (combo, "leva 3 paga 30", "frete grátis", "2ª unidade pela metade", "só hoje"): `combo`;
- o **endereço** e o **horário**: `mapa` com `horario`;
- o **pedido** (encomenda, reserva, "chama no direct", "link na bio"): `cta`.

Escolha o bloco **deste modelo** na tabela "Blocos deste modelo". **A assinatura (`vitrine`) entra pelo menos uma vez**, e a conferência pede pelo menos dois efeitos próprios (`vitrine`, `combo`, `mapa`) em vídeos de mais de 20 s: normalmente `vitrine` + `combo` ou `vitrine` + `mapa`.

- **Serviço sem produto** (salão, academia, consultoria, aula): os serviços vão para a vitrine em **modo ilustrativo**: `ilustracao` (tesoura, haltere, pata, presente…) ou, sem ilustração, um cartão em pé com o nome grande.
- **Sem preço dito**: a vitrine fica sem adesivo. **Nunca invente preço.**
- **Sem endereço**: não use `mapa`; o horário ou o aviso curto ("toda segunda", "vagas abertas") vira a `placa` da `abertura`.
- **Um vídeo de outro assunto** (finanças, saúde, história): veja "A assinatura em qualquer assunto".

### 6b. Imagens

Leia `references/imagens.md`. Os produtos da vitrine ficam melhores como **foto recortada** (PNG transparente, em pé na prateleira):

1. Liste os produtos ditos. Escreva `work/imagens.json`: `id`, `em` (instante do nome), `palavra`, `busca` (inglês, concreto: "chocolate cake in a glass jar"), `tipo` (`objeto` = PNG transparente) e `arquivo` quando vier da pasta `imagens/`.
   - Os itens ficam lado a lado: prefira imagens **do mesmo tipo e da mesma luz** (todas fotos recortadas, ou todas ilustrações).
   - Se o usuário tem um gerador de imagens, gere os produtos **numa imagem só**, lado a lado (mesmo pote/prato, mesma luz, fundo liso, **sem texto e sem logo**), remova o fundo e recorte cada um em PNG transparente em `imagens/`. Foi assim no exemplo.
2. `node scripts/imagens.mjs --lado 1000`. Leia os avisos.
3. Abra `work/imagens.jpg`. Escolha a candidata que mostra o produto inteiro, reconhecível em 1 s, sem gente, logo ou texto.
4. `node scripts/imagens.mjs --escolher <id> <n>`. Nenhuma serve: `--refazer <id> --busca "outro termo"`, ou use `ilustracao` no item.
5. `node scripts/imagens.mjs --folha`; depois `--limpar`.
6. Nos itens, `imagem: { "id": "chocolate" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `fachada`, `momentos`, `semLegenda` e `correcoes`. Cada produto, preço, combo, rua, número, horário e pedido entra no `em` da palavra, tirado de `palavras`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node ferramentas/timing.mjs`: o **timing gate**. Cada entrada precisa cair a ±0,15 s da palavra que a nomeia (produto, preço, "cada", combo, carimbo, rua, número, horário); corrija até sair **APROVADO**. "Confira no quadro" = o texto da tela não é a palavra dita (resumo): olhe o quadro daquele instante no passo 8;
- `node scripts/legendas.mjs`: lista as linhas de legenda (que só aparecem nos momentos com `legenda: true`).

**O fim do vídeo**: o vídeo termina ~0,3 s depois da última palavra: ponha em `duracao` (e no `ate` do último momento) o fim da última palavra + 0,3 s.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Abra os quadros **reduzidos à largura de um celular (~540 px)** e confira de verdade (peça também quadros nas trocas de bloco, 0,1 s depois de cada uma):
- o primeiro quadro já é a fachada completa, com conteúdo no vidro (o interior da loja da `abertura` com `cena`)?
- cada produto entra **na palavra do nome**, inteiro, em pé na prateleira, sem texto nem logo?
- o adesivo mostra **só o preço dito** e cabe no círculo? A etiqueta do nome cabe na beira da prateleira?
- o carimbo do combo bate na palavra e não cobre o que importa?
- o mapa é ilustrado (nunca print de aplicativo), o pino cai no número e o endereço aparece completo?
- a placa de horário não cobre o pino nem o endereço?
- nas trocas, o bloco que sai some antes de o próximo crescer (nenhum quadro embolado)?
- o balão de pedido não tem logo de aplicativo nem nome de marca? O fechamento fica legível por pelo menos 1,2 s?
- legenda (quando houver) abaixo do queixo, sem juntar duas frases; nada encostado nas margens, nada importante abaixo de y 1700;
- a palavra "Remotion" e marcas reais nunca aparecem.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-balcao.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho) e o maior desvio do timing gate;
- as **imagens usadas** e de onde vieram (e o texto do `creditos.txt` quando houver CC BY);
- o que é ilustrativo;
- o que o usuário deve conferir (um preço, o número da rua, o horário, uma imagem que só ele pode trocar).

## Blocos deste modelo

Todos os blocos acontecem **dentro do vidro da vitrine**; a pessoa fica embaixo do balcão o tempo todo.

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | letras pintadas no vidro, grandes, palavra por palavra, o `destaque` em tomate; `cena` (opcional, ótima no gancho) = o interior ilustrado da loja atrás das letras (prateleira, expositor com cúpula, plaquinha na parede); `placa` (opcional) pendurada no toldo. Seguida de uma vitrine sem título, o título encolhe e vira o letreiro dela |
| lista | `topicos` | linhas pintadas no vidro, cada uma com um adesivo mostarda ✓ que bate no `em`; a da vez ganha o traço tomate |
| passos | `passos` | as mesmas linhas com adesivos numerados, ligados por um tracejado tomate que desce até o passo da vez |
| número | `numero` | um adesivo de preço gigante com o número contando dentro; o rótulo numa etiqueta de prateleira embaixo; "ILUSTRATIVO" quando for |
| comparação | `comparacao` | a vitrine dividida em duas folhas por um montante de madeira; rótulo numa pílula café, texto pintado; o `vencedor` ganha o adesivo ✓ e o outro esmaece; `errado-certo` usa adesivos ✗ (tomate) e ✓ |
| gráfico | `grafico` | `barras` = potes de vidro na prateleira que enchem até o valor, com o valor no adesivo; `linha` = linha tomate pintada no vidro com adesivos nos pontos; `pizza` = uma torta fatiada; sem números ditos, a curva pintada com "ILUSTRATIVO" |
| destaque | `destaque` | o carimbo grande (café para `chave`, tomate para `alerta`) com um adesivo ✓ ou "!" |
| definição | `definicao` | a linha do cardápio: o termo grande, a linha pontilhada que corre e a explicação embaixo, num cartão creme de borda dupla |
| frase | `frase` | letras pintadas no vidro com as aspas num adesivo tomate; `destaque` em tomate, `risco` riscado |
| pergunta | `pergunta` | o adesivo "?" balançando e a pergunta pintada; as `opcoes` viram etiquetas na prateleira |
| fechamento | `cta` | o balão de pedido (conversa genérica, sem marca): o texto se escreve palavra por palavra, os pontinhos "digitando" e o botão (enviar, salvar, seguir ou link) que pulsa; `pedido: true` põe os produtos da vitrine pequenos dentro do balão |
| **assinatura** | `vitrine` | os produtos postos na prateleira na palavra, com etiqueta do nome e adesivo de preço; `preco` único ("R$ 12 cada") cola em todos |
| próprio | `combo` | a fita kraft amarra os produtos da vitrine; a etiqueta do combo fica deitada na frente da prateleira, abaixo dos produtos (nunca por cima deles), com a condição à esquerda e o carimbo do valor à direita |
| próprio | `mapa` | o cartão de mapa ilustrado sobe; a rua dita ganha o tracejado, o pino cai no número, o endereço se escreve embaixo; `horario` = a placa pendurada no toldo |

## A assinatura em qualquer assunto

A vitrine é **"o que eu tenho para te oferecer, posto à vista, com o preço de cada um"**: qualquer fala que apresenta opções, itens, erros, benefícios ou serviços pode ir para a prateleira. O combo é **a condição** (a regra, a oferta, o aviso que se carimba); o mapa é **onde e quando**.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende… sem promessa de lucro."
   `vitrine` com `titulo: "Mesmo na alta, tem gente que perde"` e três itens em modo ilustrativo (`"Compra por impulso"` com `ilustracao: "sacola"`, `"Moeda sem critério"` com `"moeda"`, `"Risco que não entende"` com `"grafico"`), cada um na palavra; depois `combo` com `texto: "Sem promessa de lucro"` (a etiqueta kraft, sem carimbo de valor). Nenhum preço: nada foi dito.
2. **Saúde ou academia (serviço sem produto).** "Aqui na academia tem musculação, funcional e pilates. Plano anual sai cento e vinte por mês. A gente fica na Avenida Brasil, 900, abre às seis."
   `fachada.nome: "Academia"`; `vitrine` com `"Musculação"` (`ilustracao: "haltere"`), `"Funcional"` e `"Pilates"` (cartões com o nome); `combo` com `texto: "Plano anual"` e `valor: "R$ 120/mês"`; `mapa` com `rua: "Avenida Brasil"`, `numero: "900"` e `horario: { "rotulo": "Abre", "texto": "às 6h" }`.
3. **Algo bem distante (história pessoal, carreira).** "Eu já vendi três coisas antes de dar certo: brigadeiro na escola, capinha de celular e curso de violão. O que mudou foi um combo: aula mais material."
   `vitrine` com os três itens (`ilustracao`: `"bolo"`, `"sacola"`, `"estrela"`), sem preço; `combo` com `texto: "Aula"` e `valor: "mais material"`; depois uma `frase` com a lição.

Sem produto, sem preço e sem endereço no vídeo? Procure as **opções** ditas (o que ela oferece, recomenda, compara ou critica) e ponha na vitrine em modo ilustrativo. Toda edição tem uma `vitrine`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido ("a doze reais cada" vira o adesivo "R$ 12 · cada").
- **Nunca mostre um preço, número ou horário que não foi dito.** Horário dito "até as oito" pode virar "até 20h" (é o mesmo número).
- O mapa é ilustrativo: ele não mostra a rua real, só que o endereço dito existe. Nunca use print de aplicativo de mapa.
- **Nenhuma marca real na tela**: nada de logo de aplicativo de mensagem, de entrega, de banco ou de rede social. "Pelo WhatsApp do perfil" vira o balão genérico "Encomenda pelo perfil".
- A imagem mostra o produto dito; nada de marca, pessoa real ou embalagem com rótulo.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele. Se ele pedir "dois efeitos próprios", acrescente um `combo` (a condição dita) ou um `mapa` (onde e quando). Não use `--forcar`.
- **Timing gate fora**: a palavra em `palavras` está errada (corrija no passo 4b) ou o `em` está noutra palavra. O preço único entra no número dito ("doze"); o detalhe, na palavra dele ("cada").
- **O nome do produto não cabe**: a etiqueta reduz até 22 px e quebra em 2 linhas; encurte com as palavras da fala (até ~22 caracteres).
- **Mais de 4 produtos**: a prateleira mostra 4. Divida em duas vitrines (a segunda com `titulo`) ou use `topicos`.
- **A foto tem fundo, texto ou marca d'água**: prefira `tipo: "objeto"` (PNG transparente), outra candidata ou uma `ilustracao`.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A busca de imagens disse "limite do dia"**: o Openverse tem 200 buscas por dia; o script segue com o Wikimedia e o cache.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; avise o usuário.
