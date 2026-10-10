# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `dia`, `mapa`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `postal`).

Os exemplos de cada parte abaixo vêm do mesmo vídeo (o do exemplo completo, na seção 10), com os mesmos tempos.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim).

## Sumário

1. Campos gerais
2. A gramática do Roteiro
3. O mapa (`mapa`, opcional)
4. Os componentes da assinatura (`momentos`)
4b. Os blocos universais
5. Os desenhos
6. Como dividir a fala
7. Regras de tempo
8. Legenda e correções
9. Sons
10. Exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Tiago", "area": "Viagens" },
  "dia": ["Manhã", "Tarde", "Fim do dia"],
  "sfx": true,
  "correcoes": { "miradouro": "Miradouro", "para mais": "pra mais" }
}
```

- `marca`: `nome` vai no cartão de embarque (passageiro), no rodapé do postal da pessoa e no topo da página de passaporte; `area` vai no rodapé do postal (em caixa alta) e no passaporte. Nome curto (até ~10 caracteres), área até ~12 (ela divide o rodapé do postal com o nome; no postal menor da dica, nome + área até ~16).
- `dia`: os rótulos da barra do dia, da esquerda para a direita (2 a 4, até ~10 caracteres cada). Padrão: Manhã, Tarde, Fim do dia. Para um roteiro de vários dias, use `["Dia 1", "Dia 2", "Dia 3"]`. No último rótulo o sol se põe atrás do casario.
- `sfx`: `false` desliga os sons.
- `postal` (opcional): `{ "zoom": 2.15, "ancoraY": 0.42 }` — o enquadramento da pessoa dentro do postal. Aumente o zoom se o rosto ficar pequeno (gravação aberta), diminua se ficar cortado; `ancoraY` sobe (menor) ou desce (maior) o rosto.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores.

## 2. A gramática do Roteiro

É a assinatura do modelo. O vídeo tem dois layouts, e o tipo do momento decide qual:

| Layout | Componentes | A pessoa | A tela |
|---|---|---|---|
| **Tela cheia** | `abertura` (`embarque`), `numero`, `destaque`, `definicao`, `frase`, `pergunta`, `cta` e trechos sem momento | em tela cheia, rosto no centro | um cartão de papel na altura do peito (bilhete de embarque, página de passaporte) ou a legenda |
| **Mapa** | `parada`, `dica`, `topicos`, `passos`, `comparacao`, `grafico` | num **cartão-postal** (moldura de papel, selo, assinatura) que viaja junto com a rota | mapa ilustrado em tela cheia, barra do dia no alto, cartões das paradas embaixo |

Regras que o template já cumpre sozinho (não precisa escrever nada):

- **Momentos de mapa colados formam um bloco só**: a pessoa encolhe para o postal no começo do bloco e volta para a tela cheia no fim, sempre em 0,75 s, começando no `de` do primeiro momento de mapa (que deve cair num corte) e no `ate` do último.
- **Tudo nasce a lápis e ganha tinta quando é dito**: a rota inteira aparece tracejada a lápis no começo do bloco, os pinos futuros são contornos tracejados com o número, os cartões da parada entram com o desenho e o nome em cinza, os títulos já estão escritos em cinza. Cada coisa passa a azulejo (ou ganha cor e papel) no `em` em que é dita. Nunca há caixa vazia.
- **A rota anda com a fala**: o pontilhado sai do último lugar da parada anterior e chega ao primeiro lugar da nova parada exatamente no `em` dele, com o veículo (ou um ponto, sem transporte) na ponta. O mapa anda por baixo: a câmera acompanha a viagem, se afasta no meio das viagens longas e aproxima na chegada.
- **O postal vem atrás da rota**: viajando para a direita, o postal fica à esquerda e o pino à direita; viajando para a esquerda, o contrário. Ao mudar de lado, ele atravessa a tela durante a viagem.
- **Barra do dia**: o sol fica no rótulo do `periodo` de cada parada e anda até o próximo quando o novo período é dito, e a etiqueta azul desliza para o rótulo novo; o mapa esquenta de leve do primeiro ao último rótulo; no último, o sol se põe.
- **Carimbo**: no `carimboEm` da parada, um carimbo "visitado" com o período bate nos cartões e os pinos da parada ganham um visto.
- **Dica**: a câmera se afasta e mostra a rota inteira, todos os pinos visitados; o postal encolhe para o canto de cima.
- **Fechamento**: a página de passaporte mostra um carimbo por parada que teve `carimboEm` (com o período) e uma vaga a lápis de "próximo roteiro" que ganha tinta no fim.

Dois cuidados seus:

- **Fronteiras nos cortes**: o `de` de cada momento é o valor de `cortesEm` entre as duas frases (ou, sem corte, o `em` da primeira palavra menos 0,1). É no corte que a pessoa muda de layout e que a rota parte — o movimento esconde o pulo.
- **Momentos encostados**: o `ate` de um momento = o `de` do próximo. Um buraco de mais de 1,5 s entre dois momentos de mapa separa o mapa em dois blocos (a pessoa volta à tela cheia com legenda no meio) — ótimo se for intencional, estranho se for por descuido.

## 3. O mapa (`mapa`)

Sem `mapa`, o template desenha um mapa genérico (orla, bairros, morros e parques) e as paradas sem posição seguem uma trilha por ele: é o que se usa quando o assunto não é um lugar. Com lugares reais, o mapa é **desenhado por você** a partir da geografia real da cidade, em coordenadas de 0 a 1 (x para a direita = leste, y para baixo = sul; norte para cima). É abstrato: mostra onde os lugares ficam uns em relação aos outros (beira-rio, no alto do morro, do outro lado do centro), não as ruas. Não use mapa da internet, imagem de satélite nem tiles.

Como montar:

1. **Liste os lugares do vídeo** e localize-os de memória (ou pergunte ao usuário) na cidade real: quem fica a oeste, quem fica na beira da água, quem fica no alto.
2. **Escolha o enquadramento**: os lugares devem ficar entre ~0,15 e ~0,85 nas duas direções. Pode encurtar distâncias longas (Belém fica a ~6 km do centro de Lisboa; no mapa, a meio mapa de distância) — o que importa é a ordem e a vizinhança. Dois lugares "pertinho" ficam a ~0,05 um do outro; lugares do mesmo bairro, a 0,03–0,08.
3. **Desenhe a água**, se a cidade tem rio, mar ou lago perto dos lugares.
4. **Espalhe os bairros** (12 a 20 manchas, só 3 a 5 com nome — os do vídeo e um de referência como o centro), os morros e os parques conhecidos. Tudo que não tem nome é textura: garante que o mapa nunca fica vazio quando a câmera anda.
5. **Ponha cada lugar** (`lugares[].x/y`, seção 4) no lugar certo do desenho: o lugar de beira-rio exatamente sobre a `margem`, o mirante no centro do morro.

```json
"mapa": {
  "agua": {
    "lado": "sul",
    "margem": [ { "x": 0.0, "y": 0.705 }, { "x": 0.16, "y": 0.68 }, { "x": 0.33, "y": 0.666 }, { "x": 0.5, "y": 0.653 },
                { "x": 0.65, "y": 0.628 }, { "x": 0.78, "y": 0.592 }, { "x": 0.9, "y": 0.494 }, { "x": 1.0, "y": 0.40 } ],
    "outraMargem": [ { "x": 0.0, "y": 0.80 }, { "x": 0.27, "y": 0.752 }, { "x": 0.36, "y": 0.73 }, { "x": 0.58, "y": 0.79 }, { "x": 1.0, "y": 0.88 } ],
    "nome": "Rio Tejo", "nomeEm": { "x": 0.52, "y": 0.722 }
  },
  "bairros": [ { "x": 0.235, "y": 0.648, "nome": "Belém", "tamanho": 0.045 }, { "x": 0.33, "y": 0.62, "tamanho": 0.04 },
               { "x": 0.605, "y": 0.6, "nome": "Baixa", "tamanho": 0.03 }, { "x": 0.735, "y": 0.567, "nome": "Alfama", "tamanho": 0.035 } ],
  "morros": [ { "x": 0.70, "y": 0.54, "r": 0.05 }, { "x": 0.668, "y": 0.468, "r": 0.035 } ],
  "parques": [ { "x": 0.29, "y": 0.45, "r": 0.075 } ],
  "pontes": [ { "de": { "x": 0.356, "y": 0.664 }, "ate": { "x": 0.368, "y": 0.733 } } ]
}
```

- `agua` (opcional): `margem` é a linha da costa ou do rio, **em ordem** (de oeste para leste quando a água está ao `sul` ou ao `norte`; de norte para sul quando está a `leste` ou `oeste`), com 5 a 15 pontos. A água fica do `lado` indicado e continua até fora do mapa. Num rio estreito o bastante para a outra margem aparecer, `outraMargem` fecha a água do outro lado (na mesma ordem). `nome` (até ~16 caracteres) aparece em itálico na água, em `nomeEm` — escolha um ponto da água entre os lugares, para o nome aparecer nas paradas (ele some quando cai atrás dos cartões).
- `bairros`: centro e `tamanho` (raio, padrão 0,045). Viram manchas de quarteirões ligadas por ruas claras (o template liga os bairros vizinhos sozinho, sem atravessar a água). Com `nome` (até ~10 caracteres), ganham rótulo em caixa alta; o rótulo se afasta sozinho quando um pino cai em cima dele, mas não ponha o centro de um bairro com nome exatamente sobre um lugar.
- `morros`: centro e raio (0,03–0,1); viram curvas de nível. Ponha um morro sob cada mirante ou bairro alto.
- `parques`: centro e raio; manchas pontilhadas de árvores.
- `pontes`: de uma margem à outra; uma rota que atravessa a água deve passar por uma ponte (com `via`) ou ir de `barco`.
- Cidade sem água: deixe `agua` de fora. Cidade de praia: `lado` do mar e só `margem`.

## 4. Os quatro componentes

Os limites de texto existem porque o componente encolhe o texto para caber: passou do limite, fica pequeno demais para ler no celular. Títulos e nomes ganham tinta **no instante em que são ditos** (o template procura cada palavra na fala) — use as palavras que a pessoa diz, na ordem em que diz. Números em algarismo ("1", "28") casam com a palavra falada ("um", "vinte e oito" vira "28" na transcrição).

### `embarque` — abertura, tela cheia

Um cartão de embarque na altura do peito: o título escrito a lápis já no primeiro quadro (a capa do post) e passado a tinta palavra por palavra; o aviãozinho cruza do passageiro até o destino no canhoto enquanto a frase acontece. Sai descendo quando a pessoa encolhe para o mapa.

```json
{ "tipo": "embarque", "de": 0, "ate": 2.36,
  "titulo": "Um dia em Lisboa", "destaque": "Lisboa", "subtitulo": "sem pressa", "codigo": "LIS", "duracao": "1 dia" }
```

- `titulo`: até ~20 caracteres (2 linhas grandes). `destaque`: trecho exato do título em itálico azulejo (o destino).
- `subtitulo` (opcional): até ~20 caracteres, em itálico, falado.
- `codigo` (opcional): o código de 3 letras do aeroporto do destino, se existir e você tiver certeza (LIS, GIG, GRU, CDG…). Sem ele, o canhoto mostra o `destaque`.
- `duracao` (opcional): o que a pessoa disse sobre a duração ("1 dia", "fim de semana"). Não invente.
- `rotulo` (opcional): o letreiro do topo (padrão "Cartão de embarque").

### `parada` — mapa: rota, pino e cartão-postal

O coração do modelo. Cada parada é um trecho da fala sobre um lugar (ou dois lugares vizinhos).

```json
{ "tipo": "parada", "de": 2.36, "ate": 6.01,
  "periodo": { "em": 2.46, "indice": 0 },
  "lugares": [
    { "em": 3.2, "nome": "Torre de Belém", "desenho": "torre", "x": 0.158, "y": 0.672 },
    { "em": 4.05, "nome": "Pastel de Belém", "desenho": "doce", "x": 0.205, "y": 0.615,
      "ligacao": { "em": 5.23, "texto": "pertinho dali" } } ],
  "carimboEm": 5.72 }
```

```json
{ "tipo": "parada", "de": 6.01, "ate": 9.61,
  "periodo": { "em": 6.11, "indice": 1 },
  "trajeto": { "em": 6.98, "transporte": "bonde", "rotulo": "Elétrico", "numero": "28", "numeroEm": 7.68,
               "via": [ { "x": 0.30, "y": 0.648 }, { "x": 0.45, "y": 0.642 } ], "embarque": { "x": 0.60, "y": 0.618 } },
  "lugares": [ { "em": 9.0, "nome": "Alfama", "desenho": "casario", "x": 0.705, "y": 0.585 } ],
  "carimboEm": 9.3 }
```

- `lugares`: 1 ou 2. `em` = a primeira palavra do nome do lugar (o pino cai e o cartão ganha tinta). `nome`: até ~30 caracteres (com 2 lugares, até ~18 cada — dois cartões lado a lado). `x`, `y`: posição no mapa (seção 3). `desenho`: um nome da seção 5.
- `ligacao` (opcional, no segundo lugar): como ele se liga ao primeiro, **só se foi dito** ("pertinho dali", "do lado", "na mesma rua"), até ~16 caracteres. O trecho curto se desenha e o chip aparece no `em` dele.
- `periodo` (opcional): `indice` = posição do rótulo em `dia` (0 = primeiro); `em` = a palavra do período ("manhã", "tarde", "noite"). Sem `periodo`, o sol fica onde estava.
- `trajeto` (opcional; não existe na primeira parada): o caminho desde a parada anterior.
  - `em`: quando o transporte é dito ("pega o **metrô**") — a rota parte nesse instante e chega no `em` do primeiro lugar.
  - `transporte`: `bonde` (elétrico, VLT), `trem`, `metro`, `onibus`, `barco`, `aviao`, `a-pe`, `bike`, `carro`. Com transporte (menos `a-pe`), o veículo anda na ponta da rota e um **bilhete** entra nos cartões, ao lado do lugar de destino. Sem `trajeto`, a rota parte 0,2 s depois do `de` com um ponto na ponta e sem bilhete.
  - `rotulo` (até ~10 caracteres): o nome no bilhete como a pessoa diz ("Elétrico", "Metrô", "Balsa"); padrão, o nome do transporte. `numero` (até 3 caracteres) e `numeroEm`: a linha, **só se foi dita**, e quando.
  - `via`: pontos de passagem para a rota seguir a orla, contornar o rio ou cruzar uma ponte.
  - `embarque`: onde o transporte realmente sai, quando não sai da parada anterior. Exemplo real: o elétrico 28 passa pela Baixa e pela Alfama, não por Belém — então a rota anda sem veículo de Belém até a Baixa desde o começo da parada, espera ali e o elétrico segue até a Alfama no `em`. **Confira o fato antes**: se não tiver certeza de onde sai, use `embarque` no ponto mais próximo do destino que você conhece, ou não ponha transporte.
- `carimboEm` (opcional): a última palavra da frase da parada. O carimbo bate nos cartões e os pinos ganham um visto.
- Até 2 cartões por parada: bilhete + 1 lugar, ou 2 lugares. Com transporte e 2 lugares, divida em duas paradas (a segunda sem trajeto) ou tire o transporte.

### `dica` — mapa inteiro com uma dica

Para a frase de conselho que vale para o roteiro todo ("dá pra fazer tudo a pé", "compra o passe de 24 h", "vai cedo"). A câmera se afasta e mostra a rota completa com todos os pinos; um cartão entra embaixo com o título a lápis passando a tinta e até 4 ícones que entram na fala.

```json
{ "tipo": "dica", "de": 13.0, "ate": 14.98,
  "titulo": "Dá pra fazer tudo de transporte público", "destaque": "transporte público",
  "icones": [ { "em": 13.71, "desenho": "bonde", "rotulo": "elétrico" }, { "em": 13.92, "desenho": "trem", "rotulo": "trem" },
              { "em": 14.56, "desenho": "onibus", "rotulo": "ônibus" } ] }
```

- `titulo`: até ~45 caracteres (2 linhas). `destaque`: trecho exato em itálico azulejo.
- `icones` (opcional): até 4 (com rótulo, até 3), `rotulo` até ~9 caracteres. Os ícones precisam ser verdade para aquele destino (em Lisboa, elétrico, trem e ônibus atendem Belém). `em`: as palavras da frase, em sequência, a cada ~0,2–0,6 s.
- `rotulo` (opcional): o letreiro (padrão "Dica").
- Só faz sentido depois de pelo menos uma parada (é a rota inteira que aparece).

### `cta` — fechamento, tela cheia

Uma página de passaporte na altura do peito: a chamada a lápis passando a tinta, o marcador que se preenche, os carimbos das paradas batendo um a um e a vaga a lápis do "próximo roteiro" que ganha tinta no fim.

```json
{ "tipo": "cta", "de": 14.98, "ate": 18.28,
  "titulo": "Salva pra sua viagem", "acao": "salvar", "acaoEm": 15.07,
  "detalhe": "Me segue pra mais roteiros", "detalheEm": 16.28, "proximoEm": 17.09 }
```

- `titulo`: até ~24 caracteres (1 linha). `acao`: `salvar` (marcador de salvar) ou `seguir` (botão "+" que vira visto). `acaoEm`: a palavra da ação ("salva", "segue").
- `detalhe` (opcional): até ~30 caracteres (1 linha, em azulejo). `detalheEm`: a primeira palavra dele.
- `proximoEm`: quando o selo "próximo roteiro" ganha tinta — a última palavra da chamada.
- Os carimbos vêm sozinhos das paradas com `carimboEm` (até 4).
- Se o fechamento vem logo depois de um momento de mapa, o cartão espera a pessoa voltar para a tela cheia (~0,45 s) antes de subir.

## 4b. Os blocos universais (qualquer assunto)

Os 11 blocos universais existem em todos os modelos do pack, com os mesmos campos. Aqui eles aparecem como papéis de viagem (tela cheia) ou como blocos de mapa (a pessoa vira o postal). `embarque` continua valendo: `abertura` é o mesmo cartão, com os campos `texto` (= `titulo`) e `em`. `cta` também aceita os nomes antigos.

Em todos: `de`, `ate` e `legenda?` (a legenda some durante o momento). Todo `em` é o instante de uma palavra dita. Texto cabe sempre: o corpo diminui até um mínimo legível (nunca vaza); mesmo assim, prefira o limite abaixo.

### Tela cheia (papel na altura do peito, abaixo do queixo)

| Tipo | Campos | Como aparece | Limite de texto |
|---|---|---|---|
| `abertura` | `texto`, `destaque?`, `em?`, `subtitulo?`, `rotulo?`, `codigo?`, `duracao?` | cartão de embarque; o texto ganha tinta palavra por palavra; `codigo` (3 letras) e `duracao` só se existirem na fala | texto ~36 caracteres |
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | etiqueta de bagagem; o número conta de 0 até `valor` em pt-BR e o marcador anda na escala do mapa | rótulo ~30 caracteres |
| `destaque` | `texto`, `em`, `nivel?` (`alerta` telha, `chave` azulejo), `detalhe?`, `detalheEm?` | texto grande no papel + carimbo redondo que bate no `em` | texto ~40 caracteres, detalhe ~45 |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | placa de rua de azulejo com o termo; a rota desce até o significado | termo ~16, significado ~60 |
| `frase` | `texto`, `destaque?`, `risco?`, `riscoEm?`, `em?` | verso de cartão-postal (selo, nome e área); `risco` é riscado em telha no `riscoEm` | ~70 caracteres |
| `pergunta` | `texto`, `opcoes?` (2 a 4 com `texto` e `em`), `em?` | formulário de desembarque; cada opção tem uma caixinha que ganha o visto | texto ~80, opção ~30 |
| `cta` | `texto`, `icone?` (`salvar`, `seguir`, `comentar`, `link`), `destaque?`, `em?`, `acaoEm?`, `detalhe?`, `detalheEm?`, `proximoEm?` | página de passaporte (veja `cta` acima); `destaque` fica sublinhado | texto ~24 (1 linha), detalhe ~30 |

### Mapa (a pessoa vira o postal; o mapa genérico é desenhado sozinho quando o plano não traz `mapa`)

| Tipo | Campos | Como aparece | Limites |
|---|---|---|---|
| `topicos` | `titulo?`, `itens` (2 a 5: `texto`, `em`, `detalhe?`) | um pino cai no mapa por item e o guia de papel embaixo ganha uma linha com marcador de azulejo | item 2 a 6 palavras; `detalhe` só aparece com até 3 itens |
| `passos` | `titulo?`, `itens` (2 a 5) | a rota anda de pino numerado em pino numerado e o itinerário embaixo se preenche, ligado por um traço | idem |
| `comparacao` | `titulo?`, `modo?` (`contra`, `antes-depois`, `errado-certo`), `lados` (2: `rotulo`, `texto`, `em`), `vencedor?` (0 ou 1), `vencedorEm?` | a rota se divide em dois caminhos e dois cartões-postais; o vencedor ganha o carimbo ("Melhor", "Certo", "Agora") e o pino com visto | rótulo ~14, texto ~40 |
| `grafico` | `titulo?`, `forma` (`barras`, `linha`, `pizza`), `dados?` (2 a 6: `rotulo`, `valor`, `em`), `tendencia?` (`sobe`, `cai`, `oscila`), `tendenciaEm?`, `unidade?`, `ilustrativo?` | com `dados`: quarteirões que crescem, rota com pinos nos valores ou carimbo redondo dividido; sem `dados`: o perfil de um caminho que sobe, cai ou oscila, com a etiqueta "ilustrativo" | `rotulo` ~10; `unidade` "%", "mil", "R$" |

Regras:

- **Sem números ditos, sem números na tela.** `grafico` sem `dados` exige `tendencia` e `ilustrativo: true`.
- **O título do bloco** (`titulo`) aparece numa cartela de papel no alto da tela. Se o bloco tem barra do dia (alguma `parada` com `periodo`), vai no cartão de baixo.
- **Posição no mapa**: `topicos`, `passos`, `comparacao` e `grafico` não levam `x` e `y`. O template põe cada bloco um passo à frente no mapa; a rota sai do último pino do bloco anterior.
- **Blocos de mapa colados formam um bloco só** (a pessoa encolhe uma vez e volta no fim), como em `parada` e `dica`.
- **Depois de um bloco de mapa**, um papel de tela cheia espera ~0,45 s (os cartões de baixo saem antes). Entre dois papéis de tela cheia, o primeiro sai inteiro antes do seguinte entrar.
- **Nunca o mesmo bloco três vezes seguidas.**

### A parada em qualquer assunto

`parada` aceita lugares sem mapa: `nome` livre ("Impulso", "Mercado"), sem `x`, `y` e `desenho`. O template põe o pino no mapa genérico e o cartão mostra um pedaço de mapa com o pino. `periodo` e `trajeto` são opcionais. `carimbo: { texto?, alerta? }` troca o "VISITADO" por outra palavra ("Evite", "Feito"); `alerta: true` carimba em telha (só para o problema).

## 5. Os desenhos

Traço em azul de azulejo, cantos redondos, cor chapada por baixo (papel, céu, areia, sol) — parecem do mesmo ilustrador em todos os cartões. Use o nome exato:

| Grupo | Nomes |
|---|---|
| Lugares | `torre` (torre ou fortaleza com ameias), `igreja`, `museu` (fachada de colunas), `casario` (casinhas num morro, bairro antigo), `por-do-sol` (mirante com balaustrada, pinheiro e sol no horizonte), `praia`, `ponte`, `parque`, `montanha`, `mercado` |
| Comida | `doce` (pastel/torta), `prato`, `cafe` |
| Transporte | `bonde`, `trem`, `metro`, `onibus`, `barco`, `aviao`, `a-pe` (tênis), `bike`, `carro` |
| Outros | `foto` (câmera) |

Escolha o desenho pelo que o lugar **é**. Mirante, terraço, "ver o pôr do sol" → `por-do-sol`; bairro antigo, centro histórico → `casario`; castelo, forte, torre → `torre`; feira, mercado municipal → `mercado`. Se nada combina, deixe sem desenho: o cartão mostra um pedaço de mapa com o pino e o nome. Desenho novo: veja `references/estilo.md`.

## 6. Como dividir a fala

Leia a transcrição inteira antes de marcar qualquer coisa e pergunte, frase a frase: *se isto fosse um roteiro no papel, esta frase seria qual linha?*

| A fala traz… | Componente |
|---|---|
| a abertura (o destino, a promessa: "um dia em…", "3 lugares em…") | `embarque` |
| um lugar ("de manhã, a Torre de Belém") ou dois vizinhos | `parada` (um ou dois `lugares`) |
| como ir ("pega o metrô e desce na…") | `trajeto` da parada de destino |
| a hora ("de manhã", "à tarde", "no fim do dia") | `periodo` da parada |
| um conselho para o roteiro inteiro | `dica` |
| a chamada final | `cta` |

- 2 a 5 paradas num vídeo de 15–60 s. Cada parada entre ~2,5 e ~6 s; menos que 2 s ninguém acompanha a rota.
- Abertura e fechamento são da pessoa em tela cheia; o meio inteiro pode ser um bloco só de mapa (a pessoa continua visível no postal).
- Não force: um vídeo sem lugares não pede este modelo.

## 7. Regras de tempo

- **Fronteiras nos cortes**: o `de` de um momento = o `ate` do anterior = o valor de `cortesEm` entre as duas frases. O primeiro momento começa em 0; o último termina em `duracao`.
- Sub-passos (`periodo.em`, `trajeto.em`, `numeroEm`, `lugares[].em`, `ligacao.em`, `carimboEm`, `icones[].em`, `acaoEm`, `detalheEm`, `proximoEm`): o `em` da palavra, tirado de `work/palavras.json`. O template já adianta o movimento o suficiente para ele estar acontecendo quando a palavra soa.
- A rota precisa de tempo: entre o `trajeto.em` (ou o `de` da parada, sem trajeto) e o `em` do primeiro lugar, deixe pelo menos ~0,8 s. Com `embarque`, o trecho a pé começa no `de` da parada e precisa de ~0,5 s antes do `trajeto.em`.
- Nada fica parado mais de ~2,5 s: numa parada longa sem sub-passo, acrescente a `ligacao`, o `numero` ou o `carimboEm` que a fala tiver; senão, encurte a parada.

## 8. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma linha por vez, numa etiqueta de papel, com cada palavra ganhando tinta quando é falada. Ela **some durante um momento** (os cartões e o mapa já mostram o que é dito) e aparece nos trechos sem momento — na tela cheia, acima da interface do app; num trecho de mapa, logo acima dos cartões. Dois ajustes:

- `"legenda": true` no momento: a legenda continua durante ele.
- `semLegenda`: faixas extras sem legenda: `"semLegenda": [ { "de": 2.9, "ate": 5.4 } ]`.

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "miradouro": "Miradouro", "para mais": "pra mais", "né": "" }`. A chave pode ter várias palavras seguidas e `""` apaga. Só corrija o que você tem certeza. Não edite `palavras` à mão — o `cortar.mjs` reescreve esse campo.

Para ver todas as linhas de legenda antes de renderizar: `node scripts/legendas.mjs`.

## 9. Sons

Automáticos, poucos e tonais: um acorde suave na abertura, uma nota por pino que cai (subindo de parada em parada), um "tum" grave a cada carimbo, uma nota quando a dica entra e outra no marcador do fechamento. Nunca dois sons a menos de 0,45 s. `"sfx": false` desliga.

## 10. Exemplo completo

Roteiro: "Um dia em Lisboa, sem pressa. De manhã, Torre de Belém e o pastel de Belém, pertinho dali. À tarde, pega o elétrico 28 e desce na Alfama. No fim do dia, pôr do sol no Miradouro da Senhora do Monte. Dá pra fazer tudo de transporte público. Salva pra sua viagem e me segue pra mais roteiros."

Cortes em 2,36 · 6,01 · 9,61 · 13,00 · 14,98 (as pausas entre as frases). Um bloco de mapa do primeiro ao último corte, com três paradas e uma dica:

```json
{
  "marca": { "nome": "Tiago", "area": "Viagens" },
  "dia": ["Manhã", "Tarde", "Fim do dia"],
  "correcoes": { "Pastel": "pastel", "miradouro": "Miradouro", "para sua": "pra sua", "para mais": "pra mais" },
  "mapa": { "…": "o mapa da seção 3 (no template, `src/plano.json` traz o mapa completo de Lisboa)" },
  "momentos": [
    { "tipo": "embarque", "de": 0, "ate": 2.36, "titulo": "Um dia em Lisboa", "destaque": "Lisboa",
      "subtitulo": "sem pressa", "codigo": "LIS", "duracao": "1 dia" },
    { "tipo": "parada", "de": 2.36, "ate": 6.01, "periodo": { "em": 2.46, "indice": 0 },
      "lugares": [ { "em": 3.2, "nome": "Torre de Belém", "desenho": "torre", "x": 0.158, "y": 0.672 },
                   { "em": 4.05, "nome": "Pastel de Belém", "desenho": "doce", "x": 0.205, "y": 0.615,
                     "ligacao": { "em": 5.23, "texto": "pertinho dali" } } ],
      "carimboEm": 5.72 },
    { "tipo": "parada", "de": 6.01, "ate": 9.61, "periodo": { "em": 6.11, "indice": 1 },
      "trajeto": { "em": 6.98, "transporte": "bonde", "rotulo": "Elétrico", "numero": "28", "numeroEm": 7.68,
                   "via": [ { "x": 0.30, "y": 0.648 }, { "x": 0.45, "y": 0.642 } ], "embarque": { "x": 0.60, "y": 0.618 } },
      "lugares": [ { "em": 9.0, "nome": "Alfama", "desenho": "casario", "x": 0.705, "y": 0.585 } ],
      "carimboEm": 9.3 },
    { "tipo": "parada", "de": 9.61, "ate": 13.0, "periodo": { "em": 9.71, "indice": 2 },
      "lugares": [ { "em": 11.33, "nome": "Miradouro da Senhora do Monte", "desenho": "por-do-sol", "x": 0.668, "y": 0.468 } ],
      "carimboEm": 12.5 },
    { "tipo": "dica", "de": 13.0, "ate": 14.98, "titulo": "Dá pra fazer tudo de transporte público", "destaque": "transporte público",
      "icones": [ { "em": 13.71, "desenho": "bonde", "rotulo": "elétrico" }, { "em": 13.92, "desenho": "trem", "rotulo": "trem" },
                  { "em": 14.56, "desenho": "onibus", "rotulo": "ônibus" } ] },
    { "tipo": "cta", "de": 14.98, "ate": 18.28, "titulo": "Salva pra sua viagem", "acao": "salvar", "acaoEm": 15.07,
      "detalhe": "Me segue pra mais roteiros", "detalheEm": 16.28, "proximoEm": 17.09 }
  ]
}
```

Com esse plano: o bilhete abre com "Um dia em Lisboa" passando a tinta e o avião chegando em LIS; no corte, a pessoa encolhe para o postal e a câmera desce sobre Belém; o sol nasce em "Manhã", o pino 1 cai na margem do Tejo com o postal da torre, o pino 2 com o do pastel, o "pertinho dali" liga os dois e o carimbo bate. À tarde, a rota segue a orla até a Baixa, o elétrico 28 embarca ali e sobe até a Alfama, com bilhete e carimbo; no fim do dia o postal da pessoa troca de lado, a rota sobe o morro até o mirante e o sol se põe. Na dica a câmera mostra a rota inteira; no fechamento a pessoa volta para a tela cheia com o passaporte carimbado. Nenhum trecho fica sem momento, então esse vídeo não tem legenda — os cartões e o mapa já dizem tudo.
