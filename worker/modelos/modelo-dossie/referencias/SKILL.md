---
name: modelo-dossie
description: "Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Dossiê: em cima, um quadro de investigação de cortiça escura onde cada ideia vira uma prova presa com pino (pasta manila, ficha datilografada, polaroide, print, recorte, post-it, memorando com carimbo vermelho), a câmera viaja de pino em pino quando a prova é dita e um fio vermelho liga a prova nova à anterior; embaixo, a pessoa numa moldura larga. Títulos em Sora, máquina de escrever só nos rótulos curtos. Serve para qualquer assunto (o exemplo do modelo é um golpe da falsa central, mas funciona com finanças, saúde, história, bastidores de empresas, mistérios, true crime, aulas): a IA traduz a fala para os blocos do estilo. Use sempre que o usuário pedir para editar \"no modelo Dossiê\", \"estilo dossiê\", \"quadro de investigação\", \"fio vermelho\", \"estilo caso/investigação\" ou \"desvendando um golpe\", e quando quiser uma edição pronta para Reels, TikTok ou Shorts nesse visual. Entrega um MP4 vertical 1080×1920."
---

# Modelo Dossiê

O vídeo vira uma investigação: em cima, um quadro de cortiça escura onde o caso é montado prova por prova; embaixo, a pessoa numa moldura larga, contando. Cada ideia é uma peça presa com pino; quando a pessoa a nomeia, a câmera do quadro viaja até ela (afasta um pouco no caminho e mostra o fio vermelho esticando) e a peça assenta na palavra. O carimbo vermelho bate no que é decisivo e, no fim, a pasta fecha. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em provas, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um golpe da falsa central, mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** um só quadro, e a câmera viaja por ele. Cada peça nova assenta na palavra (cai 30 px e encosta, sem quicar); a câmera sai da peça anterior e chega na nova em no máximo 0,35 s, com um leve desfoque de movimento, enquanto o fio vermelho estica de pino em pino. Parada numa peça, a câmera aproxima 4,5% devagar. No `destaque` (o veredito, no centro do quadro), a câmera recua e revela o quadro inteiro, os fios de todas as provas convergem para ele, o carimbo bate e a câmera aproxima devagar. Dentro da peça: o título se escreve palavra por palavra, a tarja de censura corre, o número conta, o carimbo bate seco (o quadro treme de leve), o celular vibra. Algo muda a cada 1 a 2,5 s.
- **Organização e hierarquia:** o quadro ocupa o alto (y 0 a 1040, 54% da tela); as peças ficam em anel em volta de um centro (que fica para o veredito) e se acumulam: o fio forma a teia do caso. A câmera enquadra a peça atual a ~80% da área segura (x 64 a 1016, y 130 a 1006), com as vizinhas e o fio aparecendo cortados nas bordas. Título grande em Sora, rótulo pequeno datilografado, ênfase numa tarja de tinta. A pessoa nunca sai da moldura de baixo.
- **Tipografia:** **Sora** (Google Fonts) em tudo que se lê: 800 nos títulos, carimbos e números; 700 em itens e legenda; 600 em apoio. **Special Elite** (máquina de escrever) só em rótulos curtos (FICHA, NOME, PROVA A, POR TELEFONE). **Permanent Marker** só no "?" do post-it. Tracking ≥ -0,025em; nada condensado.
- **Moldura da pessoa:** larga, embaixo (x 30, largura 1020, de y 1064 até passar da borda), cantos de 34 px, cabeça inteira com folga; o rosto fica no eixo central e é seguido quadro a quadro. Uma etiqueta manila com o nome (Sora, ≥ 34 px) e a área aparece dentro da moldura nos primeiros 5 s, longe da borda e da cabeça. A legenda fica abaixo do queixo, dentro da moldura.
- **Cores, textura e som:** cortiça escura (textura com luz de luminária no centro), papel manila (#CDAA6C), papel de relatório (#F1EBDD), tinta (#1C1915) e um único **vermelho-sangue (#A3141C) só no fio e no carimbo**. Pinos de metal. Nada de brilho, halo ou luz na pessoa; a cor do vídeo dela não muda. Sons tonais e raros: uma corda dedilhada quando o fio chega, uma batida grave no carimbo, duas notas quando a pasta abre, três notas de marimba no fim.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB) e para buscar imagens. No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (vão na etiqueta manila dentro da moldura, nos primeiros 5 s). Sem resposta, siga sem nome. Pergunte também se ele tem **imagens próprias** (foto, print real): vão numa pasta `imagens/` dentro do projeto e viram polaroides.

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

Neste modelo as pausas viram cortes secos; a pessoa fica sempre na mesma moldura e o quadro continua andando.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (grade de 0,05 em 0,05) e leia, em frações: o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x`, `--rosto-y`; a **ponta do queixo** → `--queixo-y`.

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.3 --queixo-y 0.41
```

O `modelo.json` já fixa o recorte vertical em 9:16. O script corta, enquadra, calcula `rosto` e segue o rosto pelo vídeo. Refazendo depois de planejar, use `--manter-plano`.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

A elipse azul cai no rosto, com a cabeça inteira abaixo da linha rosa (base do quadro); a linha amarela (legenda) fica abaixo do queixo e acima da vermelha (limite do app, y 1700). Se não estiver certo, refaça o passo 4.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s e dê a cada uma uma forma e um bloco **deste modelo** (tabela abaixo). **A assinatura `quadro` entra pelo menos uma vez**: é onde as provas são presas uma a uma (veja "A assinatura em qualquer assunto"). Abra com a `abertura` (a pasta que abre) sempre que der; feche com o `cta` (a câmera volta para a pasta e ela fecha).

Pense como investigador: o que a pessoa **apresenta como fato, pista, número, mensagem, objeto ou pessoa** vira prova (`quadro`); o que é **conclusão ou alerta** vira `destaque` (carimbo); a lista vira fichas (`topicos`/`passos`).

### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar como polaroide (`forma: "foto"` numa prova, ou `imagem` na abertura e no cta). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "camera tripod"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo ou texto. A polaroide é quadrada: prefira o assunto no centro.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`. Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (a polaroide vira um cartão com a palavra).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "mesa" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.

Sem imagem boa, use outra forma de prova (ficha, print, alerta): ela é desenhada e nunca erra o assunto.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes`. Cada prova, item, campo e carimbo entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`);
- `node ferramentas/timing.mjs`: cada instante tem que cair na palavra (±0,15 s);
- `node scripts/legendas.mjs`: lista as linhas de legenda. Se duas frases saírem na mesma linha (a transcrição perdeu o ponto), corrija em `correcoes` (ex.: `{ "banco,": "banco." }`).

### 8. Conferir os quadros

`node scripts/stills.mjs --momentos` → olhe os quadros reduzidos a ~540 px de largura e confira:
- cada peça assenta na palavra que a nomeia e mostra literalmente o que é dito;
- o texto cabe na peça e se lê no celular; nada a menos de 64 px das laterais, nada acima de y 130 nem abaixo de y 1700;
- o fio corre pela cortiça e chega no pino (não atravessa o texto de outra peça);
- o carimbo bate depois que a peça está parada; a cabeça da pessoa está inteira na moldura e a legenda fica abaixo do queixo;
- nas viagens (gere quadros a cada 0,1 s em volta de uma troca: `node scripts/stills.mjs 4.0 4.1 4.2 4.3`), a peça nova não aparece antes da palavra.

Corrija o plano e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-dossie.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo;
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho e quais foram as provas);
- as imagens usadas e de onde vieram;
- o que é ilustrativo;
- o que o usuário deve conferir.

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | pasta manila fechada no quadro desde o quadro 0; a capa abre em `abreEm`, o relatório se escreve palavra por palavra, o carimbo (padrão CONFIDENCIAL) bate e uma polaroide opcional entra presa com clipe |
| lista | `topicos` | fichas presas em sequência, cada uma com seu pino, entrando no seu `em`; título opcional numa fita de etiquetadora |
| passos | `passos` | as mesmas fichas, numeradas 01, 02…, ligadas pelo fio vermelho na ordem |
| número | `numero` | etiqueta de prova "PROVA Nº" presa pelo furo, com o número contando (pt-BR) e o rótulo embaixo; `ilustrativo` mostra o selo ILUSTRATIVO |
| comparação | `comparacao` | duas fichas de suspeito lado a lado, ligadas pelo fio; o vencedor ganha o carimbo CONFIRMADO (em `errado-certo`, o lado errado ganha FALSO) |
| gráfico | `grafico` | gráfico impresso preso com fita: barras hachuradas, linha a tinta ou pizza; sem números ditos, a curva da tendência com o selo ILUSTRATIVO |
| destaque | `destaque` | memorando grande com o carimbo vermelho (o `texto` é o carimbo) e o `detalhe` datilografado; vai para o centro do quadro (depois de 3 peças): a câmera revela o quadro inteiro e os fios de todas as provas convergem para ele |
| definição | `definicao` | verbete datilografado: o termo grande, um traço e o significado palavra por palavra |
| frase | `frase` | recorte de jornal com borda rasgada e aspas; `destaque` na tarja de tinta, `risco` riscado a tinta |
| pergunta | `pergunta` | post-it amarelo com o "?" circulado a caneta vermelha; `opcoes` com quadradinhos A, B, C |
| fechamento | `cta` | a câmera volta para a pasta da abertura e a capa fecha; a chamada se escreve na capa, o carimbo (SALVE ESTE CASO, SIGA O CASO, COMENTE, LINK NA BIO) bate com o ícone e uma polaroide opcional entra |
| **assinatura** | `quadro` | as provas presas uma a uma: a câmera viaja até cada uma no `em` e o fio estica da anterior; formas `foto` (polaroide), `ficha` (campos datilografados ou tarjados), `ligacao` (celular tocando), `mensagem` (print de conversa) e `alerta` (print de notificação), cada uma com a etiqueta PROVA A, B, C… |

## A assinatura em qualquer assunto

O `quadro` é **"as peças do caso, uma a uma, ligadas"**: tudo que a pessoa apresenta como evidência de uma ideia (fatos, números, mensagens, objetos, sintomas, decisões, datas) vira uma prova presa, e o fio mostra que uma leva à outra. Serve para desvendar golpes, explicar uma crise, contar uma história, investigar um hábito.

1. **Finanças/cripto.** "Mesmo na alta, tem gente que perde: compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `quadro` com quatro provas: `ficha` "Perde mesmo na alta" → `alerta` (titulo "Compra", texto "Por impulso") → `ficha` "Moeda sem critério" com o campo "Critério" tarjado → `mensagem` (titulo "Você", texto "Assumi um risco que não entendo.", destaque "não entendo"). Depois, `destaque` "Sem promessa de lucro".
2. **Saúde ou rotina.** "Você dorme mal? Café depois das 16h, celular na cama e quarto claro. A cafeína fica umas seis horas no corpo."
   `pergunta` "Você dorme mal?" → `quadro`: `foto` de uma xícara (titulo "Café depois das 16h"), `foto` de um celular na cama, `ficha` "Quarto claro" → `numero` 6 (sufixo " h", rótulo "de cafeína no corpo").
3. **História pessoal ou carreira.** "Fui demitido em 2019. Três meses depois, mandei 40 currículos. Uma mensagem mudou tudo."
   `abertura` "Fui demitido" (carimbo "ARQUIVADO") → `quadro`: `ficha` com campos "Ano: 2019", "Currículos: 40" → `mensagem` (titulo "Recrutadora", o texto que ela mandou) → `cta` `seguir`.

Quando a fala não tem uma pista concreta, a prova vira uma `ficha` com o título da ideia (as palavras dela). Toda edição tem pelo menos um `quadro`.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço nem fato. Campo que a pessoa não disse (nome, CPF, valor) entra **tarjado** (`tarja: true`), nunca com um dado inventado.
- Número ilustrativo só onde o bloco permite (`numero` com `ilustrativo`, a curva do `grafico`), com o selo ILUSTRATIVO visível.
- Nada de logo ou marca real (bancos, Pix, apps, redes): os ícones são genéricos (prédio, pessoa, alerta, balão).

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta e escolha um bloco para ele; num vão, quase sempre cabe mais uma prova no `quadro`. Não use `--forcar`.
- **A assinatura "não cabe" no assunto**: a pessoa sempre apresenta peças de uma ideia; escreva cada peça como `ficha` com as palavras dela.
- **`timing.mjs` acusou desvio**: use o `em` exato da palavra em `work/palavras.json`.
- **A peça fica pouco tempo na tela**: provas a menos de 1,2 s uma da outra não dão tempo de leitura; junte duas numa ficha com campos.
- **Texto pequeno demais**: passou do limite do bloco (`references/plano.md`); encurte com as palavras da fala.
- **Duas frases na mesma linha da legenda**: a transcrição perdeu o ponto; corrija em `correcoes`.
- **Comandos travam sem mensagem**: o projeto está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
