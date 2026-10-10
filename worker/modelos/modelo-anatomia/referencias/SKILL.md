---
name: modelo-anatomia
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Anatomia: ilustração médica premium e fácil de ler. A tela divide: em cima, uma prancha clínica onde um rosto em traço fino 2.5D gira, a pele revela os músculos e cada estrutura dita acende na palavra (retícula, fibras de luz, rótulo, função, rugas), mais o corte da pele em camadas, a linha do tempo do efeito e blocos em traço fino com um azul clínico; embaixo, a pessoa numa moldura com o fundo natural. Abre com \"E se eu fosse…\" e uma linha de luz que troca a roupa (vídeo de figurino feito numa IA de vídeo) ou o cenário. Serve para qualquer assunto (o exemplo é um médico explicando Botox; serve para dermatologia, estética, odontologia, fisioterapia, nutrição e, no modo esquema, para finanças, rotina, carreira). Use sempre que o usuário pedir para editar \"no modelo Anatomia\", \"estilo anatomia\", \"ilustração médica\", \"músculos acendendo\" ou \"e se eu fosse médico\", para Reels, TikTok ou Shorts. Entrega um MP4 vertical 1080×1920."
---

# Modelo Anatomia

O vídeo vira uma prancha de anatomia viva. A pessoa começa em quadro cheio; quando a explicação começa, a tela divide: em cima, o papel clínico com a ilustração em traço fino (o rosto que gira e mostra os músculos, o corte da pele, a linha do tempo, os blocos); embaixo, a pessoa numa moldura de cantos arredondados, com o fundo natural. Cada estrutura que ela nomeia acende na palavra. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, seguir o rosto, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em estruturas e blocos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um médico explicando Botox, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** a ilustração sai do vídeo (de um quadro de anatomia na parede, se houver) ou se desenha no lugar, gira de 3/4 para frente e respira; uma varredura azul revela os músculos por baixo da pele; quando a pessoa diz a região ("na testa"), a câmera da prancha viaja até ela (0,7 s) e a retícula se desenha; na palavra da estrutura, o músculo pulsa com fibras de luz e o rótulo entra; a função e as rugas entram nas palavras delas. Palavras sobem por máscara com leve desfoque; traços se desenham; nada quica. Algo muda a cada 1 a 2,5 s.
- **Organização e hierarquia:** a prancha ocupa o alto (y 0 a 840); a pessoa, a moldura larga de baixo (x 60, y 840, 960 × 1016). Um rótulo de prancha por vez (ponto na estrutura → linha-guia → nome sublinhado → função → número grande em azul, se dito). Cabeçalho do mito no alto da prancha. Uma informação principal por vez.
- **Tipografia:** Sora (variável, arquivo local): 700 nos títulos e números, 650 nos rótulos, 500 nas funções; legenda em Sora 800 toda branca com contorno preto e leve sombra. Tracking ≥ -0,04em só nos números grandes; nada condensado.
- **Moldura da pessoa:** quadro cheio antes da virada; moldura larga embaixo durante a prancha (cantos de 44 px, borda branca fina, sombra suave); moldura grande sobre o papel ("consultório") quando a virada não tem vídeo de figurino. O rosto fica no eixo central e é seguido quadro a quadro. A cor do vídeo nunca muda.
- **Cores, textura e som:** papel #F7FAFD com gelo #DCE9F7, tinta #13202F, UM azul clínico #2F6FE4 (ênfase, retícula, fibras de luz), vermelho-músculo só na ilustração, vermelho clínico #C2413A só no alerta. Sons tonais e raros: cristal na virada, um sopro quando a tela divide, um tom por estrutura, mergulho no corte, trava no bloqueio. Sem batida, sem sino.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (vão num crachá clínico embaixo à esquerda, nos primeiros 5 s). Sem resposta, siga sem nome. Pergunte também se ele quer a **virada com troca de roupa** (passo 5b, opcional).

## Fluxo

Rode tudo de dentro da pasta do projeto criada no passo 1.

### 1. Criar o projeto

Copie `assets/template/` desta skill para uma pasta nova, por exemplo `edicao-<nome-do-video>/`, e rode `npm install` dentro dela.

Crie essa pasta **fora de pastas sincronizadas com a nuvem** (iCloud em Documentos/Mesa, OneDrive, Dropbox, Google Drive). Elas esvaziam arquivos locais e o Node trava lendo `node_modules`. `~/Movies` no Mac ou `C:\Videos` no Windows funcionam bem.

### 2. Analisar

```bash
node scripts/preparar.mjs "/caminho/do/video.mp4"
```

Mede o vídeo, transcreve cada trecho de fala separadamente (com tempo por palavra) e grava a proposta em `work/cortes.json`: um item por trecho de fala, com as frases e o segundo em que cada uma começa. Opções: `--idioma es` (padrão `pt`), `--modelo small` para máquinas fracas.

### 3. Escolher as tomadas

Leia a lista como um editor. Em `work/cortes.json`, marque `"manter": false` em tentativas abandonadas e repetidas (fica a última completa), erros, tosses, "pera, vou de novo" e comentários depois do fim. Quando só parte de um item presta, divida-o pelo tempo das frases (`frases[].em`). Itens `[sem transcrição: ouça antes de tirar]` só saem se você confirmar que não há fala. Duas versões completas com conteúdo diferente: pergunte qual fica.

Neste modelo as pausas viram cortes secos; no quadro cheio, cada corte alterna o zoom (1,00 / 1,12), como um "punch" de câmera.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (grade de 0,05 em 0,05) e leia, em frações: o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x`, `--rosto-y`; a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.4 --queixo-y 0.5
```

O `modelo.json` já fixa o recorte vertical em 9:16. O script corta, enquadra, calcula `rosto` e segue o rosto pelo vídeo. Refazendo depois de planejar, use `--manter-plano`.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul cai no rosto; a linha amarela (legenda) fica abaixo do queixo e acima da vermelha (limite do app, y 1700). Se não estiver certo, refaça o passo 4.

### 5b. A virada com troca de roupa (opcional)

A abertura do estilo é a pergunta "E se eu fosse…" + a profissão, e uma **linha de luz** que desce pela tela na virada. Ela funciona de dois jeitos:

- **Sem vídeo de figurino (padrão):** a linha de luz troca o **layout**: acima dela, a pessoa já aparece na moldura do consultório, sobre o papel clínico. Nada a fazer.
- **Com vídeo de figurino:** a linha de luz troca a **roupa** ao vivo (jaleco, uniforme, terno). O usuário gera, numa IA de vídeo que edita um vídeo existente (troca de roupa/cenário com imagem de referência), a mesma gravação já cortada com a roupa nova:
  1. Exporte o trecho a partir da virada (ex.: do segundo 1,1 até o fim, sem som): `npx remotion ffmpeg -ss 1.1 -i public/base.mp4 -an -c:v libx264 -crf 16 work/virada-entrada.mp4`. Trechos de até ~10 s mantêm melhor a boca no tempo; termine o trecho ~1 s depois do último quadro necessário (algumas IAs arredondam a duração para baixo).
  2. Na IA, use como referência só a roupa (foto da peça sem pessoa) ou um quadro da própria gravação com a roupa trocada, com o rosto no mesmo lugar e do mesmo tamanho. Peça para não mudar o rosto.
  3. Confira: a boca acompanha a fala? O rosto ficou no mesmo lugar? Se a boca escorregar, use a virada sem vídeo.
  4. Salve como `public/virada.mp4` e, no momento `virada` do plano, ponha `"video": "virada.mp4"` e `"videoDe": 1.1` (o segundo do vídeo de trabalho em que ele começa, ≤ `trocaEm`). Ele entra mudo: a voz continua vindo do vídeo principal.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s e dê a cada uma uma forma e um bloco **deste modelo** (tabela abaixo). **A assinatura `anatomia` entra pelo menos uma vez**, e pelo menos mais um efeito próprio (`virada`, `mito`, `corte` ou `linhaDoTempo`).

Pense como um ilustrador médico: toda **parte do corpo, região ou estrutura** que a pessoa nomeia vira uma estrutura da `anatomia` (rosto: catálogo em `references/plano.md`; outras partes e outros assuntos: `parte: "esquema"`); **camadas** (pele, gordura, músculo, osso, dente, disco) e **mecanismos** (sinal que trava, substância que age) viram `corte`; **prazos** ("começa em 3 dias, dura 4 meses") viram `linhaDoTempo`; **"X não faz A, faz B"** vira `mito`; "e se eu fosse…" vira `virada`.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, o catálogo do rosto, limites de texto e regras de tempo) e `references/estilo.md`, e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada estrutura, região, função, marco e item entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node ferramentas/timing.mjs`: cada instante tem que cair na palavra (±0,15 s);
- `node scripts/legendas.mjs`: lista as linhas de legenda. Se duas frases saírem na mesma linha (a transcrição perdeu o ponto), corrija em `correcoes`.

### 8. Conferir os quadros

`node scripts/stills.mjs --momentos` → olhe os quadros reduzidos a ~540 px de largura e confira:
- cada estrutura acende na palavra que a nomeia, e a retícula marca a região certa do rosto;
- o rótulo cabe, se lê no celular e não cobre a estrutura; nada a menos de 64 px das laterais, nada acima de y 130 nem abaixo de y 1700;
- a cabeça da pessoa está inteira na moldura de baixo e a legenda não cobre o rosto;
- a virada: a pergunta some quando a linha de luz desce; com vídeo de figurino, a roupa troca sem pulo de enquadramento.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-anatomia.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e quais estruturas acenderam);
- o que é ilustrativo (a ilustração leva o selo "conteúdo ilustrativo");
- o que o usuário deve conferir (nomes técnicos, a virada).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | régua clínica que se desenha (com um ponto de leitura correndo), mira azul girando e o título palavra por palavra; `destaque` em azul com traço embaixo |
| lista | `topicos` | rótulos de prancha num eixo pontilhado: ponto → linha-guia → nome; a retícula azul anda até o item dito |
| passos | `passos` | nós numerados 01, 02… ligados por um nervo azul que se desenha; o pulso de luz corre até o passo dito |
| número | `numero` | mostrador clínico (arco com marcas) que enche enquanto o número conta (pt-BR); rótulo embaixo |
| comparação | `comparacao` | duas pranchas lado a lado; o lado certo ganha o anel azul com o visto; em `errado-certo`, o errado é riscado e ganha o X vermelho |
| gráfico | `grafico` | barras de traço fino com hachura, curva do efeito com área azul ou anel; sem números ditos, a curva da tendência com o selo "ilustrativo" |
| destaque | `destaque` | a frase grande no centro, marcada pela retícula (vermelho clínico no `alerta`) |
| definição | `definicao` | o termo grande com a lupa, a régua e o significado palavra por palavra |
| frase | `frase` | aspas de traço fino azul e a frase palavra por palavra; `destaque` em azul, `risco` riscado a tinta |
| pergunta | `pergunta` | o "?" numa retícula que gira; `opcoes` em caixinhas A, B, C de traço fino |
| fechamento | `cta` | o ícone (salvar, seguir, comentar, link) em traço fino num anel que pulsa; a chamada palavra por palavra |
| **assinatura** | `anatomia` | o rosto em ilustração médica 2.5D (catálogo de músculos e áreas) ou, com `parte: "esquema"`, um corpo em traço fino dividido em regiões; cada estrutura acende na palavra com retícula, fibras de luz, rótulo, função, número grande e rugas |
| virada | `virada` | "E se eu fosse" + NOME letra a letra acima da cabeça; a linha de luz troca a roupa (vídeo de figurino) ou o layout |
| mito | `mito` | cabeçalho "Sujeito ≠ [ERRADO]": o errado numa seringa ou etiqueta de traço fino, riscado; vira "Sujeito **certo** complemento" |
| corte | `corte` | bloco 3D de tecido em camadas (pele, gordura, músculo, osso, disco, esmalte, dentina, polpa…), aberto numa lente; opcional: nervo com pulsos, agulha com o agente que bloqueia, músculo que relaxa, pele que alisa |
| linha do tempo | `linhaDoTempo` | números-herói em cima (só os ditos) e a curva do efeito desenhada no ritmo da fala, com os marcos no eixo |

## A assinatura em qualquer assunto

A `anatomia` é **"dissecar uma coisa em partes nomeadas"**: cada parte que a pessoa cita acende, ganha nome e função. Com partes do rosto, use o catálogo; com qualquer outra coisa, `parte: "esquema"` (um corpo em traço fino com 2 a 6 regiões, cada uma com `material`).

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `anatomia` com `parte: "esquema"`, `titulo` "gente que perde" e três regiões: "Compra" (função "por impulso"), "Moeda" ("sem critério"), "Risco" ("que não entende"), cada uma no `em` da palavra. Depois, `corte` com três camadas `neutro` ("Mercado", "Riscos", "Ativos") para "como eu analiso o mercado, os riscos e a escolha dos ativos".
2. **Saúde fora do rosto (fisioterapia, odontologia, nutrição).** "A hérnia acontece quando o disco entre a L4 e a L5 sai do lugar e aperta o nervo."
   `anatomia` com `parte: "esquema"` e regiões "L4" (`material: "osso"`), "Disco" (`"disco"`, função "sai do lugar"), "L5" (`"osso"`), "Nervo" (`"nervo"`, função "fica apertado"). Ou `corte` com camadas `osso`, `disco`, `osso` e o `sinal` no nervo. Dente: `corte` com `esmalte`, `dentina`, `polpa`; músculo da mandíbula: `anatomia` do rosto com `masseter`.
3. **Carreira ou relacionamento.** "Uma rotina de foco tem três partes: o sono, a primeira hora do dia e o celular longe."
   `anatomia` com `parte: "esquema"`, `titulo` "rotina de foco" (só se for dito) e três regiões `neutro`: "Sono", "Primeira hora", "Celular longe". Com prazo dito ("em duas semanas você sente"), `linhaDoTempo` com a curva `sobe`.

Quando a fala não nomeia partes, a assinatura não força: use os blocos universais e guarde a `anatomia` para o trecho em que a pessoa explica **do que uma coisa é feita** ou **onde ela age**. Toda edição tem pelo menos uma `anatomia`.

## Fidelidade

- Tudo na tela vem da fala; os rótulos usam os nomes que a pessoa disse (o catálogo só diz **onde** desenhar).
- Não invente número, nome, prazo nem fato. Número grande (`grande`, `valor`, heróis da linha do tempo) só se foi dito.
- A ilustração é esquemática: o selo "conteúdo ilustrativo" fica ligado (só desligue com `ilustrativo: false` se o usuário pedir).
- Nada de logo ou marca real (nem de medicamento: escreva o que a pessoa disse, como "toxina", e confira com o usuário nomes comerciais).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele; numa explicação, quase sempre cabe mais uma estrutura na `anatomia` ou uma camada no `corte`. Não use `--forcar`.
- **"Só 1 efeito próprio"**: some um `mito` (quando a fala desmente algo), uma `linhaDoTempo` (prazo) ou um `corte` (camadas, mecanismo).
- **A estrutura citada não está no catálogo**: use a área mais próxima (ex.: "rugas da boca" → `labios`; "papada" → `queixo`) ou mude para `parte: "esquema"`.
- **O rótulo cobre a estrutura**: force o outro lado com `"lado": "esquerda"` ou `"direita"`.
- **`timing.mjs` acusou desvio**: use o `em` exato da palavra em `work/palavras.json`.
- **Estruturas a menos de 1,2 s uma da outra**: a câmera não dá tempo de leitura; junte numa só ou cite só a principal.
- **A virada com figurino ficou fora de sincronia**: tire o `video` da `virada` (ela troca o layout) ou encurte o trecho gerado.
- **Duas frases na mesma linha da legenda**: a transcrição perdeu o ponto; corrija em `correcoes`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano (ex.: `{ "corrugadô": "corrugador" }`).
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
