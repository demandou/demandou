---
name: modelo-figurinha-16x9
description: "Versão DEITADA (16:9, 1920×1080, vídeo completo do YouTube) do modelo Figurinha. Edita qualquer vídeo de uma pessoa falando para a câmera no estilo Figurinha: a edição vira um álbum de figurinhas montado na fala. Cada ideia é uma figurinha ilustrada ou uma etiqueta de papel que cola, descola e leva carimbo, sempre com esboço a lápis antes da tinta; a pessoa vira a figurinha especial do álbum (moldura índigo com brilho só na borda) e um vira-lata caramelo ilustrado reage a tudo. Papel creme, tinta índigo, framboesa e caramelo, fonte arredondada robusta. Serve para qualquer assunto (o exemplo do modelo é veterinário, mas funciona com cripto, finanças, impostos, saúde, vendas, aulas, histórias): a IA traduz a fala para os blocos do estilo e usa o álbum como a coleção de itens da fala. Use sempre que o usuário pedir para editar \"no modelo Figurinha\", \"estilo álbum de figurinhas\", \"com figurinhas\" ou \"com o cachorrinho\", e quando quiser o vídeo longo do YouTube nesse visual. Entrega um MP4 horizontal 1920×1080, com a composição da aula 9 do curso (a pessoa em tela cheia como base; nos blocos, a pessoa na figurinha especial à direita e o álbum à esquerda)."
---

# Modelo Figurinha (versão deitada, 16:9)

## A versão deitada (16:9, 1920×1080): o vídeo completo do YouTube

Este é o Figurinha no quadro deitado, para o vídeo longo (o "completo"), com o mesmo estilo do vertical: a mesma fonte, as mesmas cores, o papel creme, as figurinhas que colam e descolam, o esboço a lápis, o carimbo, a página que vira, o cachorro caramelo e os mesmos blocos e campos do plano. O que muda é a composição, que segue a **aula 9 do curso (editar uma aula horizontal)**:

- **Tela cheia é a base.** Nos trechos sem momento, a pessoa fala em tela cheia, como foi gravada (o vídeo deitado inteiro), com a legenda numa tira de papel no terço de baixo. As etiquetas de quadro cheio (abertura, número, destaque, frase, pergunta, fechamento) também são tela cheia: colam no peito, no terço de baixo, centradas no rosto e terminando acima dos controles do player. O bloco de página abre **só quando acrescenta clareza** à fala e a pessoa volta à tela cheia quando a ideia termina. É uma aula: dê tempo de leitura e não acelere como se fosse um anúncio.
- **A moldura à direita, o quadro à esquerda.** Quando entra uma página, o álbum ou o especial, a pessoa vira a **figurinha especial** numa moldura do lado **direito** (borda índigo, brilho só na borda, faixa de nome), com o rosto centralizado e acompanhado suavemente quando ela se mexe. O bloco ocupa o lado **esquerdo** (o quadro): na página, o título no alto e o conteúdo colado embaixo; no álbum, o cachorro, a figurinha da vez e a fileira; no especial, a etiqueta do conselho ao lado da figurinha grande da pessoa.
- **A pessoa não troca de lado.** No vertical a figurinha da pessoa alternava de lado a cada página e a cada item do álbum; no deitado ela fica sempre à direita (o campo `lados` do álbum não muda nada aqui) e o movimento vem das figurinhas que chegam, descolam e voam para a fileira, do carimbo e da página que vira.
- **Fileiras e colunas, não pilha.** O que no vertical era empilhado vira fileira: o selo do número ao lado do título, o número grande ao lado do rótulo, o carimbo ao lado do detalhe, as opções da pergunta numa fileira, as chamadas do fechamento lado a lado, as duas figurinhas da comparação lado a lado, listas de 4 ou 5 itens em duas colunas.
- **Respiro e ritmo da aula** (o `conferir.mjs` deste modelo cobra assim, pelo `modelo.json`): pelo menos 50% do vídeo com momento na tela, nenhum trecho de mais de ~8 s só com a pessoa e a legenda, um momento a cada ~10 s, nada parado mais de ~6 s.
- **Margens do YouTube:** 96 px nas laterais, nada importante abaixo de y 984 (controles do player).

## O que é o modelo

O vídeo vira um álbum de figurinhas caprichado sendo montado enquanto a pessoa fala. Ela abre em tela cheia com uma etiqueta de papel colada no peito; quando a fala traz uma lista, um processo, uma comparação ou um gráfico, ela vira a **figurinha especial** na moldura da direita e o conteúdo é colado no quadro da esquerda, figurinha por figurinha, cada uma na palavra que a nomeia. A assinatura é o **álbum**: cada item chega numa cartela, descola pelo canto, leva um carimbo de borracha e vai para a sua casa numerada na fileira. Um vira-lata caramelo ilustrado acompanha e reage. Os scripts fazem a parte mecânica (medir, transcrever, cortar, enquadrar, conferir, renderizar); você faz a parte de editor (escolher as tomadas, traduzir a fala em blocos, escolher os desenhos, conferir os quadros).

**Este modelo é um estilo, não um assunto.** O exemplo foi feito com um veterinário (alimentos que fazem mal ao cachorro), mas o vídeo do usuário pode ser sobre qualquer coisa. Siga `references/adaptar.md` para traduzir a fala em blocos deste estilo. Uma edição só com legenda, abertura e fechamento é um erro: o `render.mjs` recusa.

## O estilo (o que define este modelo, com qualquer conteúdo)

- **Dinâmica do motion:** física de papel. Etiquetas e figurinhas colam chegando um pouco maiores e inclinadas e assentam, sem quique; saem puxadas para baixo. Tudo o que vai ser colado já aparece **a lápis** (traço cinza claro, tracejado) e ganha tinta na palavra dita: nunca há caixa vazia. Palavras passam do lápis à tinta uma a uma, no ritmo da fala. O carimbo cai seco na palavra que fecha a ideia. Entre duas páginas, a página **vira**: a nova desliza da direita por cima da velha, com sombra de papel. A pessoa muda de tamanho e de lugar nas fronteiras (tela cheia ↔ figurinha na moldura da direita), e o conteúdo novo entra junto com essa troca.
- **Organização e hierarquia:** uma ideia por tela. Na página, a figurinha da pessoa fica na moldura da direita; no quadro da esquerda, o título se escreve no alto (com o cachorro espiando na ponta da linha) e o conteúdo é colado embaixo, de margem a margem do quadro: casas numeradas (duas colunas a partir de 4 itens), trilha de selos, duas figurinhas lado a lado com selo VS, papel quadriculado, figurinha que vira. No álbum, o cachorro no alto, uma figurinha grande e deitada por vez (nome e porquê à esquerda, desenho do lado da pessoa) e a fileira do álbum embaixo, guardando cada item. Nome grande, porquê menor, rótulos em caixa-alta espaçada.
- **Tipografia:** uma fonte só, Recursive no eixo casual (Google Fonts): 900 em títulos e nomes, 720–800 em textos, 860 em rótulos de caixa-alta. Títulos de 56 a 104 px, textos de apoio ≥ 40 px, rótulos ≥ 30 px. Todo texto é medido e encolhe até um mínimo legível para caber; nunca vaza.
- **Moldura da pessoa:** três lugares. Tela cheia, como foi gravada, com as etiquetas no terço de baixo; figurinha especial na moldura da direita (556×820, a mesma nas páginas e no álbum), com borda índigo, recorte branco, selo de estrela e um brilho que passa **só na borda**, além da faixa com nome e área sobre o peito; figurinha especial grande (800×660, a moldura cresce para a esquerda) no conselho principal. O rosto é seguido quadro a quadro e fica centralizado na moldura; o template mede o rosto pelo rastro e ajusta o zoom para ele ocupar ~42% da largura da figurinha.
- **Cores, textura e som:** papel creme com trama de pontos, tinta índigo `#262347` (contornos e texto), framboesa `#D2385B` (destaques, carimbo de "não", alerta, selos), verde `#2F7D62` (carimbo de "pode", o certo), caramelo do cachorro, fundos chapados claros nas figurinhas (rosa, manteiga, menta, céu, lavanda, pêssego). Ilustração a traço com cor chapada. Sons tonais e raros: um toque grave quando um papel cola, uma nota curta subindo quando a figurinha descola ou a página vira, o baque do carimbo, duas notas na figurinha especial.

## Antes de começar

1. **Ambiente.**
   - Este modelo roda **no computador** do usuário: Claude Code, o app do Claude com acesso ao terminal, ou o Codex (no app do ChatGPT ou no terminal).
   - Ele precisa de Node 18+, de uns 3,5 GB livres e de internet na primeira vez (Whisper e modelo de transcrição, 1,6 GB, baixados uma vez só; navegador de render, 100 MB). No Mac, a transcrição compila o Whisper com as ferramentas do Xcode (`xcode-select --install`).
   - Se você não consegue rodar comandos no computador do usuário (ChatGPT ou Claude no navegador, sem terminal), **pare e explique isso**. Não entregue uma versão simplificada (só legenda, cortes feitos por outro caminho).
2. **Carregue a skill do Remotion** (`remotion-best-practices`). Se ela não estiver instalada, peça ao usuário para rodar `npx skills add remotion-dev/skills`. O projeto já vem pronto: não precisa do `remotion-create` nem do Studio (os quadros do `stills.mjs` são a prévia). O pedido de edição já é o pedido para renderizar.
3. Confirme o caminho do vídeo. Pergunte uma vez **nome e área** de quem fala (ex.: "Dra. Ana Lima" / "Nutrição"): vão na faixa da figurinha especial e na assinatura do fechamento. Sem resposta, siga sem nome (a figurinha fica sem faixa).

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

Quando só parte de um item presta, divida-o em dois usando o tempo de início das frases (`frases[].em`): o primeiro termina 0,05 s antes da frase que sai, o segundo começa nela, e marque o que sai. Um aviso `[conferir: pouca fala para a duração]` indica trecho longo com pouca fala: ouça com atenção, costuma esconder repetições. Itens `[sem transcrição: ouça antes de tirar]` podem ser fala que o Whisper perdeu: só saem se você confirmar que não há fala.

**Duas versões completas com conteúdo diferente** (por exemplo, dois finais com chamadas diferentes) não são uma tomada repetida: pergunte ao usuário qual fica. Se não puder perguntar, fique com a última e diga na entrega qual ficou e por quê.

Neste modelo **as pausas entre as frases viram cortes, e é nelas que a pessoa muda de lugar** (vira a figurinha da moldura, cresce no especial, volta à tela cheia): o movimento esconde o pulo do corte. Mantenha a proposta do `preparar`; pausas curtas dentro de uma frase o próprio `cortar` junta.

### 4. Medir o rosto e cortar

Abra `work/medir-1.jpg`, `-2` e `-3` (começo, meio e fim da gravação, com uma grade de 0,05 em 0,05 por cima) e leia, em frações (0 = esquerda/topo, 1 = direita/base):

- o **centro do rosto** (entre os olhos e a ponta do nariz) → `--rosto-x` e `--rosto-y`;
- a **ponta do queixo** → `--queixo-y`.

Use a posição mais comum; se a pessoa se mexe muito, fique no meio do movimento. Então:

```bash
node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.4 --queixo-y 0.56
```

O script corta, enquadra e calcula `rosto`, `zona` e os pontos de corte no plano. **O formato já vem decidido pelo modelo**: o `modelo.json` pede `"formato": "16:9"`, e a gravação deitada entra inteira (1920×1080, sem recorte vertical); o rosto continua medido para a figurinha da moldura e a `zona` (abaixo do queixo) diz até onde as etiquetas do peito podem subir. Gravação vertical vira uma faixa deitada em volta do rosto (grave deitado). Não precisa passar `--recorte`. Refazendo o corte depois de já ter planejado, use `--manter-plano`: os momentos, a marca e as correções continuam.

No fim, o `cortar.mjs` também segue o rosto pelo vídeo (alguns segundos): a figurinha da pessoa acompanha quando ela se mexe (o rosto fica no centro da moldura) e mede a largura do rosto, que o template usa para o zoom da figurinha. Se nas guias o rosto sair do lugar em algum trecho, rode `node scripts/rastrear.mjs --conferir <segundos>` e siga o que ele indicar.

### 5. Conferir o enquadramento

```bash
node scripts/stills.mjs --guias
```

Gera três quadros com guias, com a pessoa em tela cheia: a cruz deve cair no rosto; a caixa azul tracejada (a `zona`) deve começar abaixo do queixo; a caixa verde é a faixa das etiquetas do peito (do topo dela até a base útil, nunca sobre o queixo); a caixa amarela é a legenda; nada importante abaixo da linha vermelha (controles do player). Se não estiver certo, refaça o passo 4 com as medidas corrigidas.

### 6. Mapa editorial

Leia `references/adaptar.md` e faça o mapa da fala em `work/mapa.md`: divida em batidas de 2 a 5 s, dê a cada uma uma forma (lista, número, comparação, passos…) e escolha o bloco **deste modelo** na tabela "Blocos deste modelo", abaixo. **A assinatura (`album`) entra pelo menos uma vez**, seja qual for o assunto: veja "A assinatura em qualquer assunto".

Alterne os lugares da pessoa: depois de uma ou duas páginas, uma etiqueta em tela cheia, e vice-versa. Abra e feche em tela cheia. Pense também no ritmo da aula: a tela cheia é a base, e a página entra onde ajuda a entender, não em toda frase; deixe respiros de 2 a ~8 s com a pessoa e a legenda. O `especial` (a figurinha da pessoa grande) é para o conselho principal, no máximo um por vídeo, de preferência logo depois do álbum.

### 7. Planejar os momentos

Leia `references/plano.md` (os campos de cada bloco, a lista de desenhos, limites de texto e regras de tempo) e preencha `src/plano.json`: `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `mascote` e `figurinhaDaPessoa`). Cada item, lado, dado ou carimbo entra no `em` da palavra que o nomeia, tirado de `work/palavras.json`.

Depois:
- `node scripts/conferir.mjs --mapa`: corrija até sair **APROVADO** (nunca use `--forcar`). Quando ele reprovar, leia o trecho falado que ele aponta e escolha um bloco para ele;
- `node scripts/legendas.mjs`: lista as linhas de legenda (só existem nos trechos sem momento).

Nomes e termos que a transcrição errou vão em `correcoes` (ex.: `{ "uva passa": "uva-passa" }`). Só corrija o que você tem certeza.

### 8. Conferir os quadros

```bash
node scripts/stills.mjs --momentos
```

Gera, para cada momento, um quadro logo antes, um no meio, um logo depois de cada sub-passo (cada `em`) e um logo depois do fim. Abra cada imagem **a ~960 px de largura** (o vídeo deitado é visto numa tela maior) e confira de verdade:
- o desenho de cada figurinha é o item certo e não confunde com outro? Na dúvida, use `"texto"` (uma palavra, sigla ou número) ou deixe sem desenho (vai o número do item);
- o texto cabe (nada cortado, nada embaixo do carimbo ou da figurinha da pessoa)?
- o carimbo cai na palavra certa e não cobre o nome?
- o rosto aparece inteiro e centralizado na figurinha da moldura da direita, sem a faixa de nome em cima do queixo (se não, ajuste `figurinhaDaPessoa`)? Nada cobre o rosto na tela cheia (a etiqueta fica no terço de baixo, o cachorro espia do lado oposto ao rosto, nunca na frente)?
- nada parado mais de ~2,5 s, nenhum quadro vazio e nenhum texto sobre outro no meio das trocas? Gere quadros a cada 0,05–0,1 s em volta de cada `de` e `ate` (`node scripts/stills.mjs 8.5 8.55 8.6 8.65 8.7`);
- nada importante abaixo de y 984 (controles do player) nem colado nas laterais (96 px)?

Corrija o plano (texto mais curto, outro desenho, outro bloco, outro `em`) e repita até estar limpo.

### 9. Renderizar e entregar

```bash
node scripts/render.mjs "out/<nome-do-video>-figurinha.mp4"
```

Ele confere o plano de novo, renderiza e normaliza o áudio a −14 LUFS. Entregue:
- o caminho do arquivo (horizontal 1920×1080);
- a duração e o quanto foi cortado;
- o **mapa resumido** (que bloco entrou em cada trecho, que desenho cada figurinha levou);
- o que é ilustrativo (curva de tendência sem números, número marcado `ilustrativo`);
- o que o usuário deve conferir (uma tomada em dúvida, uma palavra que a transcrição pode ter errado, um item em que nenhum desenho servia).

## Blocos deste modelo

| Forma da informação | `tipo` no plano | Como aparece neste estilo |
|---|---|---|
| abertura | `abertura` | tela cheia: etiqueta de papel no peito (terço de baixo), o título passa do lápis à tinta palavra por palavra; um número no começo ("3 erros…") vira um selo redondo framboesa ao lado do título; o cachorro espia por cima da etiqueta, do lado oposto ao rosto |
| lista | `topicos` | página: casas do álbum a lápis, uma por item (duas colunas a partir de 4 itens); cada item cola como uma figurinha colorida na sua palavra, com o número (ou um desenho pequeno) e o texto; o cachorro espia na ponta da linha do título |
| passos | `passos` | página: trilha de selos numerados que se desenha de um passo ao outro; em cada passo, o selo framboesa cola e uma tira de papel com o texto (e um desenho, se houver) cola ao lado; 4 ou 5 passos viram duas colunas (a trilha desce a primeira e recomeça no alto da segunda, sem desenho na tira) |
| número | `numero` | tela cheia: etiqueta no peito, o número conta grande (pt-BR) de um lado, com prefixo e sufixo em framboesa, e o rótulo se escreve do outro; etiqueta "ilustrativo" embaixo do número quando for o caso |
| comparação | `comparacao` | página: duas figurinhas lado a lado, cada uma com o rótulo num chip índigo e o texto grande; selo VS (`contra`) ou seta (`antes-depois`, `errado-certo`) na emenda; carimbo ✗ no errado e ✓ no certo ou no vencedor, no canto de baixo |
| gráfico | `grafico` | página: figurinha de papel quadriculado com o gráfico a tinta: colunas coloridas que crescem (`barras`), traço que passa de selo em selo (`linha`), fatias que colam (`pizza`); sem números ditos, a curva da tendência se desenha com a etiqueta ILUSTRATIVO |
| destaque | `destaque` | tela cheia: `alerta` = carimbo framboesa com "!" batido numa etiqueta, com o `detalhe` ao lado (o cachorro leva susto); `chave` = figurinha brilhante índigo, com o brilho passando |
| definição | `definicao` | página: o termo cola na frente de uma figurinha grande; no significado ela vira e o verso (papel pautado) mostra o que é |
| frase | `frase` | tela cheia: etiqueta com a frase; `destaque` em framboesa; `risco` riscado à mão em framboesa quando é dito; `desenho` cola uma figurinha pequena no canto mais longe do rosto |
| pergunta | `pergunta` | tela cheia: selo "?" ao lado da pergunta na etiqueta; as `opcoes` colam embaixo numa fileira de figurinhas coloridas, cada uma na sua palavra |
| fechamento | `cta` | tela cheia: figurinha de chamada com o ícone num círculo framboesa e a chamada (`destaque` em framboesa), uma segunda chamada opcional ao lado e a assinatura (nome e área) embaixo |
| **assinatura** | `album` | página do álbum: a pessoa na figurinha especial da moldura da direita; no quadro da esquerda, o cachorro no alto e cada item numa figurinha grande que chega na cartela, descola, assenta, leva o carimbo (✗, ✓ ou nenhum, com o texto que você quiser) e voa para a sua casa numerada na fileira de baixo, que guardava o esboço a lápis |
| **assinatura** | `especial` | a figurinha da pessoa cresce para a esquerda e o conselho principal cola numa etiqueta ao lado dela, por cima da beirada; logo depois do álbum, a fileira completa continua embaixo |

## A assinatura em qualquer assunto

O álbum é **uma coleção que se completa**: 2 a 5 itens que a fala enumera (motivos, erros, despesas, hábitos, ferramentas, sinais) viram figurinhas que chegam uma a uma e vão para a fileira. O carimbo é o **veredito** de cada item, com o texto que a fala pedir: ✗ (`"nao"`) para o que é erro ou risco, ✓ (`"pode"`) para o que vale, `"nenhum"` para uma lista neutra; `textoCarimbo` troca o "NÃO PODE"/"PODE" por palavras da fala ("ERRO", "SEM LIMITE", "ATÉ 12%"). O desenho vem da biblioteca (comida, dinheiro, documentos, relógio, alvo, raio, dado, livro, casa…); quando nenhum serve, use `"texto"` com uma palavra, sigla ou número ("PGBL", "3x", "12%"), ou deixe sem desenho (a figurinha leva o número do item). O cachorro caramelo é o mascote do álbum em qualquer assunto: ele reage (curioso quando o item chega, susto no ✗, feliz no ✓). Se o usuário não quiser, `"mascote": "nenhum"`.

Três exemplos fora do nicho do demo:

1. **Cripto.** "Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende."
   `album` com `"carimbo": "nao"` e `"textoCarimbo": "ERRO"`: "Compra por impulso" (desenho `raio`, `em` em "compra", carimbo em "impulso") → "Escolhe moeda sem critério" (`dado`, carimbo em "critério") → "Assume risco que não entende" (`alerta`, carimbo em "entende"). Antes, um `destaque` alerta "Para a maioria"; depois, a `pergunta` "Como avaliar os projetos?".
2. **Saúde (sono).** "Três coisas que atrapalham o seu sono: café depois das quatro, celular na cama e dormir cada dia num horário. O que resolve é acordar sempre na mesma hora."
   `album` com o carimbo padrão (✗ NÃO PODE): "Café depois das 4" (`cafe`, carimbo em "quatro") → "Celular na cama" (`celular`, carimbo em "cama") → "Horário diferente" (`relogio`, carimbo em "horário"). Depois o `especial` "Acorde sempre na mesma hora", com a fileira dos três ✗ embaixo.
3. **Relacionamento (bem distante).** "Tem três frases que acabam com qualquer discussão: 'você sempre faz isso', 'tanto faz' e 'calma'. Troca por 'eu me senti assim'."
   `album` com o carimbo padrão e `"desenho": "balao"` nas três falas (cada uma no `em` da primeira palavra, o carimbo na última). A troca vira uma `comparacao` `errado-certo` ("Você sempre faz isso" × "Eu me senti assim") ou um `especial` com a frase nova.

Também em finanças sem erro nenhum: em impostos, "Saúde · Educação · Previdência" vira um álbum com `"carimbo": "pode"` e carimbos ✓ "SEM LIMITE", "LIMITE ANUAL", "ATÉ 12%" (desenhos `coracao`, `livro`, `cofre`).

Outros usos: ferramentas de um ofício (`maleta`, `calculadora`, `celular`), hábitos de uma rotina (`relogio`, `calendario`, `coracao`), passos de uma receita contados como coleção, os "três sinais" de qualquer coisa. Se a fala não tem lista nenhuma, o álbum ainda serve com 2 itens: os dois lados de uma ideia, a causa e o efeito, o problema e a saída.

## Fidelidade

- Tudo na tela vem da fala; os textos podem ser resumidos com as palavras dela, sem mudar o sentido.
- Não invente número, nome, preço, dose, sintoma nem fato. O texto do carimbo é um veredito curto com palavras da fala ou os padrões "NÃO PODE"/"PODE".
- Número ilustrativo só onde o bloco permite (`numero` com `ilustrativo`, gráfico com `tendencia`), sempre com a etiqueta ILUSTRATIVO visível.

## Quando algo dá errado

- **`conferir.mjs` reprovou**: leia o trecho falado que ele aponta (o vão, o momento parado, o tipo que falta, a assinatura que não apareceu) e escolha um bloco para ele. Não use `--forcar`.
- **"O álbum não cabe no assunto"**: ele é o estilo. Procure a lista na fala (quase todo vídeo tem: motivos, erros, passos, opções) e use desenhos neutros, `"texto"` ou o número do item.
- **Comandos travam sem mensagem**: o projeto provavelmente está numa pasta sincronizada com a nuvem. Mova e rode `npm install` de novo.
- **A transcrição errou um nome ou termo**: use `correcoes` no plano.
- **Falha ao compilar o Whisper no Mac**: faltam as ferramentas do Xcode (`xcode-select --install`).
- **Rosto cortado ou pequeno demais na figurinha especial**: ajuste `figurinhaDaPessoa` (`zoom` entre 1 e 2; `rostoNaCaixa` entre 0,3 e 0,45). Sem ajuste, o modelo mede o rosto pelo rastro e aproxima até ele ocupar ~42% da largura da figurinha (zoom de 1 a 1,6; sem rastro, 1,4).
- **Texto pequeno demais**: o texto passou do limite do bloco e encolheu para caber (veja `references/plano.md`); encurte com as palavras da fala ou use menos itens.
- **Carimbo fora do tempo ou sobre o nome**: confira o `carimboEm` em `work/palavras.json`; texto de carimbo comprido quebra em duas linhas e fica sobre o desenho, então prefira 1 a 3 palavras.
- **Perguntas com muitas opções longas**: as opções ficam numa fileira (até 4) e encolhem para caber na faixa do peito, acima dos controles do player; se ainda ficar apertado, encurte as opções.
- **Etiqueta subindo perto do queixo**: a etiqueta do peito cresce para cima a partir da base útil; texto longo encolhe até o mínimo e, no limite, sobe. Encurte o texto com as palavras da fala.
- **Aviso de ampliação no cortar**: a gravação tem pouca resolução para o recorte; o vídeo sai menos nítido. Avise o usuário.
