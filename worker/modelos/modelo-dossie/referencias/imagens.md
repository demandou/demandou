# Motor de imagens: fotos e objetos no ritmo da fala

A pessoa fala "mel" e o pote de mel aparece. Esta peça do motor acha a imagem, deixa a IA escolher olhando uma folha numerada e entrega para o template um arquivo pronto, com o ponto de foco e o crédito.

Ela é comum a todos os modelos com imagem (Viral, Iceberg, Ranking, Kit, Versus, Etiqueta, Pronúncia, Ao Pé da Letra, Reação, Transformação…). Cada modelo decide **como** a imagem entra; o motor cuida de **qual** imagem, do enquadramento, do movimento lento e do tempo.

## Arquivos

| No motor | Vai para o template como | O que faz |
|---|---|---|
| `scripts/imagens.mjs` | `scripts/imagens.mjs` | busca, baixa, normaliza, monta a folha, grava a escolha, os créditos e o plano |
| `src/imagem.tsx` | `src/motor/imagem.tsx` | `<Foto>`, `<Recorte>`, `<SemImagem>` e as funções de enquadramento |
| `src/FolhaImagens.tsx` | `src/motor/FolhaImagens.tsx` | a folha de conferência e o conversor de WebP/AVIF/SVG; tem a própria raiz e só o `imagens.mjs` usa |

Sem dependência nova: `fetch` do Node 18+, o ffmpeg que vem com o Remotion e o navegador do Remotion.

## O passo no fluxo da skill

Entra depois do mapa editorial e antes de planejar os momentos:

1. **Listar os momentos de imagem** a partir da fala (`work/palavras.json`): cada coisa concreta que a pessoa nomeia e que vale mostrar. Escrever `work/imagens.json`.
2. **Rodar** `node scripts/imagens.mjs`.
3. **Olhar a folha** (`work/imagens.jpg`, e `imagens-2.jpg`, `imagens-3.jpg`… quando há mais de 4 pedidos).
4. **Escolher e marcar o foco** de cada pedido: `node scripts/imagens.mjs --escolher <id> <n> --foco x,y`.
5. **Planejar**: o momento que mostra a imagem ganha `imagem: { id, efeito }`. O `plano.imagens` já foi preenchido pelo script.
6. Conferir nos stills de sempre (`stills.mjs --momentos`) que o assunto não ficou cortado.

### `work/imagens.json`

Uma lista. Cada pedido:

```json
[
  { "id": "mel", "em": 3.2, "palavra": "mel", "busca": "honey jar", "tipo": "foto" },
  { "id": "microfone", "em": 11.0, "palavra": "microfone de lapela", "busca": "microphone", "tipo": "objeto" },
  { "id": "antes", "em": 2.0, "palavra": "antes", "tipo": "foto", "arquivo": "closet-antes.jpg" },
  { "id": "post", "em": 0.8, "palavra": "o post", "tipo": "print", "arquivo": "print-post.png" }
]
```

- `id`: curto, sem acento (vira o nome do arquivo: `public/img/mel.jpg`).
- `em`: o instante em que a palavra é dita (segundos, no vídeo cortado).
- `palavra`: como foi dita, em português (é o que o cartão mostra quando não há imagem).
- `busca`: o termo **em inglês**, concreto, como alguém descreveria a foto. É o que mais muda o resultado:
  - `"camera tripod"`, não `"tripod"` (que traz caldeirões e bacias de bronze);
  - para bicho e planta, o **nome científico** acha foto de verdade (`"paradoxurus hermaphroditus"` trouxe a civeta viva; `"asian palm civet"` trouxe atropelada);
  - comida regional: nome + lugar (`"acaraje bahia"`, não só `"acaraje"`);
  - nada de pessoa famosa nem marca (veja as regras).
- `tipo`:
  - `"foto"`: foto comum (vai em cartão, tela cheia, máscara);
  - `"objeto"`: coisa isolada que pode virar adesivo. Vêm primeiro os objetos 3D com fundo transparente (Fluent Emoji), depois fotos;
  - `"print"`: print de post, comentário, notícia. **Só vem da pasta do aluno**; nunca é buscado nem inventado.
- `arquivo` (opcional): nome do arquivo na pasta `imagens/` do aluno. Mesmo sem `arquivo`, um nome parecido com o `id` ou a `palavra` (`mel-2.jpg`, `produto-final.webp`) é achado e entra já escolhido.

### Comandos

```
node scripts/imagens.mjs                                  busca o que falta e monta a folha
node scripts/imagens.mjs --escolher mel 2 --foco 0.5,0.35  escolhe a 2 e marca o foco
node scripts/imagens.mjs --escolher mel 0                  sem imagem: o modelo desenha o cartão
node scripts/imagens.mjs --escolher mel --foco 0.4,0.3     só muda o foco
node scripts/imagens.mjs --refazer mel --busca "honey pot" busca de novo com outro termo ("todos" refaz tudo)
node scripts/imagens.mjs --folha                           remonta a folha (escolhida em verde, foco num círculo)
node scripts/imagens.mjs --limpar                          apaga as candidatas depois de escolher tudo
  --offline     não usa a internet (pasta imagens/, cache e cartões)
  --lado 2400   lado maior das imagens normalizadas (padrão 1600)
```

Rodar de novo é barato: buscas e downloads ficam no cache. O script só refaz o pedido que mudou (`busca`, `tipo` ou `arquivo`), o que ainda não tem candidatas e o que ficou sem imagem por falta de internet. Se o aluno puser um arquivo em `imagens/` depois, ele passa na frente na rodada seguinte.

### A folha (`work/imagens.jpg`)

O ffmpeg do Remotion não tem `drawtext` (nem `overlay`, `pad` ou `hstack`), então a folha é um still do Remotion (`FolhaImagens.tsx`, empacotado à parte, como o `Medir`). Quatro pedidos por folha, até 6 candidatas por linha:

- **número amarelo** = a candidata (é o `n` do `--escolher`);
- a imagem aparece **inteira** (sem corte), com linhas finas em 0,25 / 0,5 / 0,75 da largura e da altura: o foco se lê direto nelas;
- embaixo: licença (verde = sem obrigação de crédito; laranja = CC BY, vai para `creditos.txt`), tamanho real, "transparente", "pequena" (lado maior < 1000 px), e a fonte;
- PNG transparente aparece sobre xadrez;
- na coluna da esquerda, os avisos do pedido (marca bloqueada, sem objeto 3D, só 2 candidatas…);
- depois da escolha, `--folha` mostra a escolhida com borda verde e o foco num círculo: é a conferência do foco.

Para um foco exato, abra a candidata: `public/img/candidatas/<id>-<n>.jpg` (ou `.png`).

**Como escolher:** o assunto inteiro e reconhecível em 1 segundo; fundo limpo; foto de verdade (não pintura, não ilustração) quando o tipo é foto; retrato (em pé) quando vai para tela cheia; nada de gente reconhecível, logo, texto grande ou marca d'água. Nenhuma presta? `--refazer` com outro termo, ou `0` (cartão). Cartão é melhor que imagem errada.

**O foco** é o ponto do assunto (o rosto do bicho, o pote, a pirâmide maior), em frações da imagem inteira: `0,0` é o canto de cima à esquerda, `1,1` o de baixo à direita. Aceita `0.5,0.35` e também `0,5,0,35`. Sem `--foco`, fica no centro.

### O que o script grava

- `public/img/candidatas/<id>-<n>.<jpg|png>`: as candidatas normalizadas (lado maior até 1600 px; JPG para foto, PNG só quando há transparência de verdade).
- `public/img/<id>.<jpg|png>`: a escolhida.
- `work/imagens.json`: em cada pedido, `candidatas` (fonte, autor, licença, link, tamanho) e `escolha` (`n`, `arquivo`, `foco`, fonte, autor, licença, link) ou `{ "sem": true }`.
- `src/plano.json` → `imagens`: o resumo que o template lê (abaixo). É refeito a cada escolha; o `cortar.mjs --manter-plano` preserva. Se o plano for recriado do zero, rode `node scripts/imagens.mjs --folha` (ele sincroniza de novo).
- `creditos.txt` (na raiz do projeto): as imagens CC BY no formato para colar na legenda do post, e, separadas, as que não exigem crédito.

```json
"imagens": {
  "mel":      { "arquivo": "img/mel.jpg", "largura": 960, "altura": 1440, "foco": { "x": 0.5, "y": 0.45 }, "transparente": false, "palavra": "mel" },
  "moeda":    { "arquivo": "img/moeda.png", "largura": 256, "altura": 256, "foco": { "x": 0.5, "y": 0.5 }, "transparente": true, "palavra": "moeda" },
  "tenis":    { "sem": true, "palavra": "tênis de corrida" }
}
```

## No template

### Tipos

Em `src/plano.ts`:

```ts
import type { ImagemNoMomento, ImagensDoPlano } from "./motor/imagem";

export type Plano = {
  // …campos comuns…
  imagens?: ImagensDoPlano;
};

// no momento que mostra imagem (o nome do campo é sugestão do plano do lote 7):
export type Destaque = { tipo: "destaque"; de: number; ate: number; texto: string; em: number; imagem?: ImagemNoMomento };
// ImagemNoMomento = { id: string; foco?: { x, y }; efeito?: "aproximar" | "afastar" | "panoramica" | "parado" }
```

`imagem.foco` no momento vale por cima do foco escolhido (para a mesma foto aparecer com dois enquadramentos).

### `imagemDoPlano(plano, ref)`

```tsx
const img = imagemDoPlano(plano, momento.imagem); // ou imagemDoPlano(plano, "mel")
// → { arquivo, largura, altura, foco, transparente, palavra, id } | { sem: true, palavra, id } | null
```

`temImagem(img)` diz se há arquivo. Um `id` que não está no plano devolve `null` (a escolha ainda não foi feita).

### `<Foto>`

Enquadra pelo foco (o foco fica o mais perto possível do centro sem deixar borda vazia), anda devagar e entra no tempo. O visual (borda, sombra, cantos, posição) vem por `style`.

| Prop | Padrão | O que é |
|---|---|---|
| `imagem` ou `src` | | a imagem do plano, ou um caminho em `public/` |
| `de`, `ate` | `0`, — | quando entra e sai (segundos, no relógio do componente: dentro de `<Sequence>`, o da Sequence; ou passe `t`) |
| `largura`, `altura` | 100% do pai | tamanho da caixa em px. **Passe os dois** para o foco ficar centrado de verdade; sem eles, a foto preenche o pai e o foco só fica garantido na tela |
| `efeito` | `"aproximar"` | `"aproximar"`, `"afastar"`, `"panoramica"`, `"parado"` |
| `intensidade` | `0.1` | quanto anda no tempo da foto (0,1 = 10% de zoom) |
| `direcao` | `"direita"` | panorâmica: `"esquerda"`, `"direita"`, `"cima"`, `"baixo"` |
| `entrada` | `"corte"` | `"corte"`, `"fade"`, `"subir"`, `"escala"`, `"revelar"` (cortina da esquerda) |
| `saida` | `"corte"` | `"corte"`, `"fade"`, `"escala"` |
| `durEntrada`, `durSaida` | `0.35`, `0.25` | segundos |
| `style`, `estiloDaImagem` | | moldura do modelo; filtro de cor na imagem |
| `semImagem`, `cartao` | cartão padrão | o que mostrar quando não há imagem; ou só as cores/fonte do cartão padrão |
| `antes` | `0.5` | segundos antes de `de` em que a imagem já carrega, invisível (sem piscar) |

O zoom é ancorado no foco (o assunto não sai da tela) e a panorâmica nunca mostra a borda da imagem.

### `<Recorte>`

PNG transparente como adesivo (objeto 3D, produto recortado pelo aluno). A altura segue a proporção.

| Prop | Padrão | O que é |
|---|---|---|
| `imagem` ou `src`, `de`, `ate` | | como na `<Foto>` |
| `largura` | `360` | px do adesivo |
| `entrada` | `"escala"` | `"escala"` (sem quicar), `"salto"` (mola com leve passar do ponto), `"cair"`, `"subir"`, `"corte"` |
| `flutuar` | `true` | balanço lento enquanto está na tela (nunca fica parado) |
| `giro` | `0` | inclinação de repouso, em graus |
| `sombra` | sombra suave | CSS `drop-shadow(...)`, ou `false` |
| `semImagem` | nada | o que mostrar se não houver arquivo |

### `<SemImagem>`

O cartão tipográfico: a palavra dita, no maior corpo que cabe (até 3 linhas, sem deixar "de" sozinho numa linha), crescendo de leve enquanto está na tela. `fundo`, `cor`, `fonte`, `peso` e `rotulo` ("imagine:") são do modelo. `aviso` põe a etiqueta laranja "sem imagem · id": só nas guias, nunca no vídeo final.

### Exemplos de entrada (cada modelo escolhe a sua)

```tsx
// corte seco para tela cheia, aproximando (Viral)
<Sequence from={Math.round(m.de * fps)} durationInFrames={Math.round((m.ate - m.de) * fps)}>
  <Foto imagem={imagemDoPlano(plano, m.imagem)} de={0} ate={m.ate - m.de} largura={1080} altura={1920} intensidade={0.12} />
</Sequence>

// cartão flutuante acima da cabeça, com a pessoa embaixo
<Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={960} altura={760} entrada="escala" saida="fade"
  style={{ position: "absolute", left: 60, top: 110, borderRadius: 36, border: "6px solid #F4F1EA", boxShadow: "0 30px 60px rgba(0,0,0,.5)" }} />

// máscara redonda, afastando
<Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={620} altura={620} efeito="afastar" entrada="fade"
  style={{ position: "absolute", left: 230, top: 140, borderRadius: "50%" }} />

// zoom num detalhe: foco no detalhe + intensidade alta
<Foto imagem={img} foco={{ x: 0.72, y: 0.31 }} de={m.de} ate={m.ate} t={t} largura={1080} altura={1080} intensidade={0.6} />

// objeto 3D como adesivo
<Recorte imagem={imagemDoPlano(plano, "microfone")} de={item.em} ate={m.ate} t={t} largura={300} entrada="salto" giro={-8}
  style={{ position: "absolute", left: 760, top: 650 }} />

// duas imagens lado a lado: duas <Foto> de 520×700 com o mesmo `de`
```

Para molduras próprias (polaroide caindo, tela de celular, cortina de antes e depois), use as funções puras: `enquadrarFoto(W, H, iw, ih, foco)` (retângulo da imagem e onde o foco caiu), `kenBurns(...)` (zoom e deslocamento no tempo) e `entradaSaida(...)` (opacidade e transform da entrada e da saída).

Teste pronto: `testes/imagens-teste/src/TesteImagens.tsx` (composição `TesteImagens`) mostra as cinco formas acima com as imagens do teste.

## Regras de conteúdo (o script aplica; a skill repete)

- **Pessoa famosa e marca não são buscadas.** O script bloqueia o pedido e pede a imagem ao aluno quando:
  - o termo tem uma marca conhecida (lista no script: "nike", "iphone", "coca cola"…) ou as palavras logo/marca/brand;
  - o termo pede pessoa famosa (celebrity, singer, actor…);
  - o termo inteiro é um verbete do Wikidata descrito como pessoa ("American businessman (born 1971)") ou empresa/marca ("athletic equipment company", "line of smartphones…").
- Nas candidatas, também saem: título com nome e sobrenome de gente ("Katy Perry DNC…", "Sarah Vaughan…"), anúncio, logo, marca no título, animal morto/atropelado e, para `foto`, pintura e ilustração. No Commons, arquivos marcados como "personality" ou "trademarked".
- `print` só vem da pasta do aluno. Nada de inventar print de notícia ou post.
- Profissionais de saúde seguem o conselho deles (CFM, CFO) no antes e depois.
- O filtro é uma rede, não uma garantia: a escolha na folha é obrigatória (gente reconhecível no fundo, marca d'água, logo na embalagem).

## Fontes, licenças e qualidade real

Ordem: pasta do aluno → Openverse → Wikimedia Commons → Pexels (com chave) → Fluent Emoji 3D (só `objeto`, vem primeiro na fila por ser transparente) → cartão. Nas fotos, a palavra buscada **no título** vem antes da que só está nas tags, e CC0/domínio público antes de CC BY. CC BY-SA, NC e ND ficam de fora (exigiriam licenciar o vídeo igual, proíbem uso comercial ou edição).

| Fonte | Licenças aceitas | Tamanho real | Como sai |
|---|---|---|---|
| Pasta do aluno | do aluno | o que ele mandou (até 1600) | a melhor; WebP, AVIF e SVG convertem pelo navegador; HEIC só no Mac (sips) |
| Openverse / Flickr | CC0, domínio público, CC BY | **1024 px** no lado maior (a API só dá esse) | relevância média; muita foto amadora; serve para cartão, fica mole em tela cheia |
| Openverse / StockSnap, rawpixel | CC0 | 960–1024 px | as mais "de banco" do grátis; rawpixel tem muito acervo antigo/vintage; as duas repetem a mesma foto (o script tira a repetida) |
| Openverse / iNaturalist | CC0, CC BY | 1200–1600 px | foto de campo: muito bicho atropelado ou de longe; vai para o fim da fila |
| Wikimedia Commons | CC0, domínio público, CC BY | 1600 (miniatura de 1920) | a melhor resolução grátis; ótima para comida típica, bicho (nome científico), lugar, objeto de museu (MET, fundo neutro); muita coisa é CC BY-SA e fica de fora |
| Pexels (`PEXELS_API_KEY`) | Licença Pexels (sem crédito) | até 1880 px | não testado aqui (sem chave). É o salto de qualidade para foto de produto e cotidiano |
| Fluent Emoji 3D | MIT | **256×256** | bonito e consistente, já recortado; nítido até ~300 px na tela, aceitável até ~500 px (fica macio), não serve grande |

Resultado do teste (10 pedidos, sem Pexels):

| Pedido | Escolhida | Nota |
|---|---|---|
| mel (`honey jar`) | StockSnap CC0, 960×1440 | boa; 4 de 6 úteis |
| pirâmides (`egypt pyramids`) | Commons CC0, 1600×1200 (pôr do sol) | 1 foto moderna boa; o resto é vintage, gravura ou satélite |
| pão de queijo (`brazilian cheese bread`) | Commons CC BY 2.0, 1600×1600 | 4 de 5 boas, quase todas pedem crédito |
| acarajé (`acaraje` → `acaraje bahia`) | Commons CC BY 2.0, 1290×968 | com "acaraje" vieram batuqueiros e o akara nigeriano; com "bahia", 5 boas |
| civeta (`asian palm civet` → `paradoxurus hermaphroditus`) | Commons domínio público, 1600×1514 | com o nome comum: pinturas e animais atropelados; com o científico, 5 fotos vivas |
| airfryer (`air fryer`) | Commons CC BY 4.0, 1512×1600 (fundo branco) | 2 fotos do aparelho; o resto é comida feita nele |
| microfone (`microphone`, objeto) | Fluent 3D 256 px | 3D ótimo; nas fotos, os filtros tiraram Katy Perry e Sarah Vaughan |
| tripé (`tripod` → `camera tripod`) | StockSnap CC0, 960×1440 | sem 3D; "tripod" sozinho traz bacias e caldeirões |
| moeda (`coin`, objeto) | Fluent 3D 256 px | 3D bom; fotos de moedas antigas de museu |
| poltrona (`armchair`) | Commons CC0, 1600×1600 (MET) | poltronas de museu em fundo neutro: boas para cartão, nada de sala moderna |

Em resumo: para **cartão e máscara** o grátis serve na maioria dos termos, com 1 ou 2 refinamentos de busca. Para **tela cheia vertical** quase tudo fica mole: uma foto deitada de 1600×1200 precisa de 1,6× de ampliação para cobrir 1080×1920, e as do Flickr (1024) de 2,8×. Prefira as em pé (StockSnap, Commons) para tela cheia, ou `--lado 2400` com fotos do Commons. Produto moderno (airfryer, celular, tênis) é o ponto fraco: aí entram a pasta do aluno ou a chave do Pexels.

## Cache, internet e limites

- Cache em `~/.cache/modelos-edicao/imagens/`: `buscas/` (respostas das APIs, 14 dias; Wikidata 90), `arquivos/` (downloads), `normalizadas/` (já convertidas) e `fluent/indice.json` (60 dias). O teste (10 pedidos, com as buscas refeitas várias vezes) deixou ~90 MB; o índice do Fluent guarda também a árvore do repositório (7 MB) em `buscas/`.
- Sem internet: avisa uma vez e segue com a pasta do aluno, o cache e os cartões. Os pedidos que ficaram sem imagem por isso são refeitos sozinhos quando a rede volta.
- API fora do ar ou com erro: aquela fonte sai da rodada, as outras seguem.
- Limites das APIs sem conta:
  - **Openverse: 20 buscas por minuto e 200 por dia** (1 busca por pedido). O script segura o ritmo antes de estourar o minuto; no limite do dia, avisa e segue com Commons e cache.
  - Wikimedia Commons e Wikidata: sem limite prático para esse uso (o script se identifica, como pedem).
  - GitHub: 60 consultas por hora; o índice do Fluent é 1 consulta a cada 60 dias.
  - Pexels: 200 por hora, 20 mil por mês.
- Tempo: ~50 s para 10 pedidos na primeira vez (busca, download, conversão, folha); ~15 s refazendo tudo com o cache; `--folha` ~3 s; `--escolher` é instantâneo (não empacota nada).

## Para juntar ao motor (Tiago)

1. Copiar:
   - `motor-imagens/scripts/imagens.mjs` → `motor/scripts/imagens.mjs`
   - `motor-imagens/src/imagem.tsx` → `motor/src/imagem.tsx`
   - `motor-imagens/src/FolhaImagens.tsx` → `motor/src/FolhaImagens.tsx`
   - este arquivo → `motor/IMAGENS.md` (e, nos modelos com imagem, para `references/imagens.md` da skill: dá para acrescentar ao `montar.py` como o `adaptar.md`).
2. Nada muda no `montar.py` para os arquivos de código: ele já copia tudo de `motor/scripts` e `motor/src`. Os dois `.tsx` compilam com o `tsconfig` dos templates (testado com `npx tsc --noEmit` no Autoridade); nenhum template precisa importar nada se não usar imagem.
3. Opcional, em `motor/scripts/comum.mjs`: acrescentar `"folha", "limpar", "offline"` ao `SEM_VALOR` (hoje funcionam porque vêm sem nada depois; com isso ficam à prova de ordem de argumentos).
4. `CONTRATO.md`: uma seção curta "Imagens" apontando para `IMAGENS.md` (campo `plano.imagens`, `imagem: { id, foco?, efeito? }` nos momentos, `<Foto>`/`<Recorte>`/`<SemImagem>`, regra de nunca deixar buraco).
5. `SKILL-MOLDE.md`: o passo abaixo, entre "6. Mapa editorial" e "7. Planejar os momentos", nos modelos com imagem.
6. `.gitignore` dos templates (se houver): `public/img/candidatas/` e `creditos.txt` não vão para o template entregue.

### Bloco para o SKILL.md dos modelos com imagem

```markdown
### 6b. Imagens

Leia `references/imagens.md`.

1. A partir do mapa e de `work/palavras.json`, liste cada coisa concreta que a pessoa nomeia e que vale mostrar (um a cada 2 a 4 s nos trechos de imagem; nunca duas na mesma frase). Escreva `work/imagens.json`: `id`, `em` (instante da palavra), `palavra`, `busca` (inglês, concreto: "camera tripod"; bicho e planta pelo nome científico), `tipo` (`foto`, `objeto` ou `print`) e `arquivo` quando vier da pasta `imagens/` do usuário.
   - Nada de pessoa famosa nem marca na busca: peça a imagem ao usuário (`imagens/`). Print, só o real que ele mandar.
2. `node scripts/imagens.mjs`. Leia os avisos.
3. Abra `work/imagens.jpg` (e `imagens-2.jpg`…). Para cada pedido, escolha a candidata que mostra o assunto inteiro, reconhecível em 1 s, sem gente reconhecível, logo ou texto; foto de verdade quando é foto; em pé quando vai para tela cheia.
4. `node scripts/imagens.mjs --escolher <id> <n> --foco x,y` (foco = o assunto, em frações da imagem inteira; as linhas da folha marcam 0,25 / 0,5 / 0,75). Nenhuma serve: `--refazer <id> --busca "outro termo"`; ainda não: `--escolher <id> 0` (vira cartão com a palavra).
5. `node scripts/imagens.mjs --folha` e confira o círculo verde do foco. Depois `--limpar`.
6. Nos momentos, `imagem: { "id": "mel", "efeito": "aproximar" }`. Se `creditos.txt` listar imagens CC BY, entregue o texto ao usuário para a legenda do post.
```
