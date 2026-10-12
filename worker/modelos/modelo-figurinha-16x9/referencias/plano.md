# O plano de edição (`src/plano.json`)

Versão deitada (16:9, 1920×1080, o vídeo completo do YouTube): os campos são **os mesmos do vertical**, e um plano vale nas duas versões. O que muda é como o template compõe a tela, pela aula 9 do curso: a pessoa em tela cheia é a base; nas páginas, no álbum e no especial, ela vira a figurinha especial numa moldura do lado direito e o bloco é colado no quadro do lado esquerdo.

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes` (e, se precisar, `mascote` e `figurinhaDaPessoa`).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Pegue-os em `work/palavras.json`: cada palavra tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o instante de uma palavra dita.

## Sumário

1. A gramática do modelo
2. Campos gerais
3. Os blocos de quadro cheio (`abertura`, `numero`, `destaque`, `frase`, `pergunta`, `cta`)
4. Os blocos de página (`topicos`, `passos`, `comparacao`, `grafico`, `definicao`)
5. A assinatura (`album`, `especial`)
6. Os desenhos das figurinhas
7. Regras de tempo e de texto
8. Legenda e correções
9. Exemplos completos

## 1. A gramática do modelo

O vídeo alterna quatro "cenas", e a troca entre elas é um movimento da própria pessoa:

| Cena | Blocos | O que aparece |
|---|---|---|
| **tela cheia** | `abertura`, `numero`, `destaque`, `frase`, `pergunta`, `cta` (e trechos sem momento) | a pessoa em tela cheia, como foi gravada; etiquetas de papel coladas no peito, no terço de baixo, centradas no rosto e terminando acima dos controles do player (y 954); nos trechos sem momento, a legenda numa tira de papel |
| **página do álbum** | `topicos`, `passos`, `comparacao`, `grafico`, `definicao` | a pessoa vira a figurinha especial na moldura da direita (556×820); no quadro da esquerda (x 96 a 1220), o título se escreve no alto, com o cachorro espiando na ponta da linha, e o conteúdo é colado embaixo (y 310 a 954) |
| **álbum** (a assinatura) | `album` | a figurinha especial da pessoa na moldura da direita; no quadro da esquerda, o cachorro no alto, a figurinha da vez grande e deitada no meio (1124×478) e a fileira do álbum embaixo; a pessoa não troca de lado |
| **figurinha especial grande** | `especial` | a figurinha da pessoa cresce para a esquerda (800×660) e o conselho cola numa etiqueta ao lado dela, por cima da beirada; logo depois de um álbum, a fileira dele continua embaixo |

As trocas começam ~0,15 s antes da fronteira do momento (o corte que costuma estar ali cai no meio do movimento). Duas páginas seguidas: a página **vira** (a nova desliza por cima da velha). Da página para a tela cheia: a pessoa cresce por cima da página e a etiqueta entra logo depois (~0,3 s), para nunca haver texto sobre texto.

Um vídeo típico: `abertura` → (uma ou duas páginas) → etiqueta → `album` → `especial` ou etiqueta → `cta`. Nunca dois momentos ao mesmo tempo. Não repita o mesmo bloco três vezes seguidas.

## 2. Campos gerais

```json
{
  "marca": { "nome": "Dra. Ana Lima", "area": "Nutrição" },
  "mascote": "cachorro",
  "sfx": true,
  "correcoes": { "uva passa": "uva-passa" }
}
```

- `marca`: vai na faixa da figurinha especial (sobre o peito) e na assinatura do fechamento. `nome` vazio = sem faixa e sem assinatura. O nome encolhe para caber; até ~30 caracteres.
- `mascote`: `"cachorro"` (padrão: o vira-lata caramelo, mascote do álbum em qualquer assunto) ou `"nenhum"`. Sem mascote, a figurinha da pessoa continua na moldura da direita, o título da página usa a linha inteira e as etiquetas não têm o cachorro espiando.
- `figurinhaDaPessoa` (opcional): `{ "zoom": 1.4, "rostoNaCaixa": 0.36 }`. Enquadramento da pessoa dentro das figurinhas: `zoom` maior aproxima (1 a 2); `rostoNaCaixa` é a altura do rosto na caixa (0 = topo, 1 = base; 0,3 a 0,45). Sem ajuste, o template mede o rosto pelo rastro e aproxima até ele ocupar ~42% da largura da figurinha (zoom de 1 a 1,6; sem rastro, 1,4). Use se o rosto sair cortado, pequeno, ou se a faixa de nome encostar no queixo.
- `sfx`: `false` desliga os sons.
- `rosto`, `zona`, `videoAltura`: calculados pelo `cortar.mjs`. Não mexa à mão; se as guias mostrarem um problema, refaça o corte com medidas melhores.

## 3. Os blocos de quadro cheio

Em todos os textos, **cada palavra entra quando é dita**: antes disso ela já aparece a lápis (cinza claro) e ganha tinta na fala. Por isso os textos usam as palavras que a pessoa diz, na ordem em que diz (pode enxugar: palavra que não foi dita entra logo depois da anterior; "pra/pro" casa com "para", "3" casa com "três").

`em` (opcional) em `abertura`, `frase`, `pergunta` e `cta`: o instante em que o **texto** começa a ser dito (padrão: `de`). Use quando o momento começa antes da primeira palavra do texto ("Segundo, quando…" com o texto "Quando…").

### `abertura`: etiqueta-título

```json
{ "tipo": "abertura", "de": 0, "ate": 4.52, "texto": "3 despesas que podem diminuir o seu imposto de renda",
  "destaque": "imposto de renda", "caoEm": 3.15 }
```

- `texto`: até ~64 caracteres (3 linhas). Se começar com um número em algarismos ("3 despesas…"), o número vira um **selo redondo** framboesa no canto, colado quando é dito. (`titulo` também vale, nos planos antigos.)
- `destaque` (opcional): trecho exato do texto em framboesa.
- `caoEm` (opcional): quando o cachorro espia por cima da etiqueta (padrão: na última palavra). Use uma palavra depois do título, para a tela mudar de novo.

### `numero`: número que conta

```json
{ "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 }
```

- `valor` conta de 0 até ele a partir de `em` (a palavra do número), em pt-BR (83.000; 1,5). `casas`: casas decimais (padrão: 0 para inteiro, 1 para fracionário).
- `rotulo`: o que é o número, com palavras da fala, até ~50 caracteres (2 linhas). `rotuloEm` (opcional): quando o rótulo começa a ser dito.
- `prefixo` / `sufixo` (opcionais, curtos): "US$", "R$", "%", "mil", "litros". Aparecem menores, em framboesa.
- `ilustrativo: true`: mostra a etiqueta "ilustrativo". Só use para um número que a fala não afirma como fato.

### `destaque`: palavra que bate forte

```json
{ "tipo": "destaque", "de": 12.86, "ate": 17.2, "texto": "Para a maioria", "em": 13.46, "nivel": "alerta",
  "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 14.93 }
```

- `nivel: "alerta"`: um carimbo framboesa com "!" bate na etiqueta no `em` (antes disso o carimbo aparece a lápis); o cachorro leva susto. Para risco, erro, aviso.
- `nivel: "chave"` (padrão): a figurinha brilhante (índigo, texto creme, um brilho que passa). Para a palavra-chave positiva.
- `texto`: 1 a 4 palavras, até ~24 caracteres (no alerta vira caixa-alta e pode quebrar em 2 linhas).
- `detalhe` (opcional, até ~50 caracteres) e `detalheEm`: uma linha menor embaixo, que se escreve na fala.

### `frase`: etiqueta com uma frase

```json
{ "tipo": "frase", "de": 33.8, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.75 }
```

- `texto`: até ~60 caracteres, fiel ao que foi dito. `destaque` (opcional): trecho exato em framboesa.
- `risco` (opcional): trecho exato que é riscado à mão, em framboesa; `riscoEm`: quando o traço passa (padrão: logo depois da última palavra riscada).
- `desenho` (opcional): uma figurinha pequena cola no canto da etiqueta (seção 6).

### `pergunta`: pergunta para quem assiste

```json
{ "tipo": "pergunta", "de": 35.2, "ate": 40.02, "texto": "Você quer…", "em": 35.23,
  "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] }
```

- `texto`: até ~60 caracteres; um selo "?" cola no canto.
- `opcoes` (opcional, **2 a 4**): cada uma cola como figurinha colorida no seu `em`, até ~30 caracteres, numa fileira embaixo da pergunta (a etiqueta da pergunta fica de margem a margem). Sem opções, o cachorro espia no fim.

### `cta`: fechamento

```json
{ "tipo": "cta", "de": 40.02, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
```

- `texto`: a chamada, até ~45 caracteres (2 linhas). `destaque` (opcional): trecho em framboesa.
- `icone`: `salvar`, `seguir`, `comentar` ou `link` (padrão: `salvar`).
- `segunda` (opcional): uma segunda figurinha de chamada, menor: `{ "texto": "Manda pra quem tem cachorro", "em": 16.36, "icone": "enviar" }` (aqui vale também `enviar`).
- Depois da última chamada, a assinatura (nome e área). Se for o último momento, fica até o fim do vídeo.

## 4. Os blocos de página

A pessoa vira a figurinha especial na moldura da direita; no quadro da esquerda, o `titulo` (opcional, até ~40 caracteres, 1 ou 2 linhas largas) se escreve no alto, com as palavras da fala; o cachorro espia na ponta da linha do título (cabeça e peito), apoiado na beirada do conteúdo. Listas de 4 ou 5 itens (`topicos`, `passos`) viram duas colunas; a `comparacao` põe as duas figurinhas lado a lado. Tudo o que vai ser colado já está a lápis desde a entrada da página.

### `topicos`: lista sem ordem (2 a 5)

```json
{ "tipo": "topicos", "de": 20.4, "ate": 26.0, "titulo": "Sinais de que falta descanso",
  "itens": [ { "texto": "Cansaço", "em": 20.8 }, { "texto": "Sono ruim", "em": 22.1, "detalhe": "acorda várias vezes" },
             { "texto": "Irritação", "em": 23.6, "desenho": "raio" } ] }
```

- Cada item é uma casa do álbum (a lápis) que recebe uma figurinha colorida no `em` da palavra que o nomeia.
- `texto`: 1 a 6 palavras, até ~32 caracteres. `detalhe` (opcional): até ~30 caracteres, menor, embaixo.
- `desenho` (opcional, seção 6): uma ilustração pequena à esquerda; sem ela, o número do item. Use desenho em todos ou em nenhum.
- Com 4 ou 5 itens as figurinhas ficam mais baixas e o texto menor: prefira textos curtos.

### `passos`: sequência em ordem (2 a 5)

```json
{ "tipo": "passos", "de": 28.0, "ate": 33.8, "titulo": "Aula gratuita: como eu analiso",
  "itens": [ { "texto": "O mercado", "em": 30.86, "desenho": "grafico-sobe" }, { "texto": "Os riscos", "em": 31.47, "desenho": "alerta" },
             { "texto": "A escolha dos ativos", "em": 32.21, "desenho": "lupa" } ] }
```

- Uma trilha a lápis liga os selos numerados; em cada `em`, a tinta avança até o passo, o selo framboesa cola e a tira de papel com o texto cola ao lado.
- Mesmos campos e limites do `topicos`.

### `comparacao`: dois lados

```json
{ "tipo": "comparacao", "de": 8.65, "ate": 12.86, "titulo": "Mercado × bolso", "modo": "contra",
  "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] }
```

- `lados`: exatamente 2. `rotulo` (1 a 3 palavras, num chip índigo em caixa-alta) e `texto` (até ~40 caracteres, grande). Cada figurinha cola no seu `em`.
- `modo`: `"contra"` (selo VS, padrão), `"antes-depois"` (seta) ou `"errado-certo"` (seta, carimbo ✗ no primeiro lado e ✓ no segundo; o errado desbota).
- `vencedor` (0 ou 1) e `vencedorEm` (opcionais): o vencedor leva o carimbo ✓ e o outro desbota.

### `grafico`: papel quadriculado

```json
{ "tipo": "grafico", "de": 4.6, "ate": 8.6, "titulo": "Vendas por mês", "forma": "barras", "unidade": "mil",
  "dados": [ { "rotulo": "Janeiro", "valor": 12, "em": 5.0 }, { "rotulo": "Fevereiro", "valor": 18.5, "em": 5.8 } ] }
```

- `forma`: `"barras"` (colunas coloridas que crescem), `"linha"` (o traço passa de selo em selo) ou `"pizza"` (fatias que colam, com legenda e a porcentagem de cada uma).
- `dados`: **2 a 6** números **ditos**, cada um com `rotulo` (até ~16 caracteres), `valor` e `em`.
- `unidade` (opcional): `"%"`, `"R$"`/`"US$"` (vira prefixo), uma palavra curta ("mil", "kg") como sufixo, ou uma palavra longa que vira um chip no canto ("pessoas").
- **Sem números ditos:** deixe `dados` de fora e use `"tendencia": "sobe" | "cai" | "oscila"` com `"ilustrativo": true` (e `tendenciaEm`, a palavra que fala da subida ou queda). Com `forma: "linha"` a curva se desenha e um selo com a seta cola no fim; com `"barras"`, colunas sem números crescem uma a uma. A etiqueta ILUSTRATIVO aparece sozinha.

### `definicao`: o termo e o significado

```json
{ "tipo": "definicao", "de": 2.89, "ate": 8.65, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 }
```

- `termo` (até ~24 caracteres) cola na frente de uma figurinha lavanda no `em`; perto do `significadoEm` ela vira e o verso mostra o termo pequeno e o `significado` (até ~60 caracteres) se escrevendo.

## 5. A assinatura

### `album`: a lista ilustrada (2 a 5 itens)

```json
{ "tipo": "album", "de": 17.2, "ate": 24.15, "carimbo": "nao", "textoCarimbo": "ERRO",
  "itens": [
    { "em": 17.73, "nome": "Compra por impulso", "desenho": "raio", "carimboEm": 18.45 },
    { "em": 19.21, "nome": "Escolhe moeda sem critério", "desenho": "dado", "carimboEm": 20.43 },
    { "em": 21.25, "nome": "Assume risco que não entende", "desenho": "alerta", "carimboEm": 22.86 } ] }
```

Para cada item, a figurinha grande: chega numa cartela (deslizando da direita), o canto descola, ela sobe e assenta; o nome e o porquê se escrevem no ritmo da fala; o carimbo bate no `carimboEm` (o desenho desbota um pouco para o carimbo ler por cima) e o cachorro reage; quando o próximo item começa, ela voa para a sua casa na fileira, que até então mostrava o esboço a lápis.

- `de`: o `em` da primeira palavra do primeiro item, menos 0,05. `ate`: o `em` da primeira palavra depois do último item.
- `itens[].em`: o `em` da primeira palavra do item. Cada item precisa de pelo menos ~2,5 s (chegada + texto + carimbo).
- `nome` (ou `texto`): como foi dito, até ~30 caracteres. Curto fica grande; comprido quebra em 2 ou 3 linhas e o desenho encolhe um pouco para dar lugar.
- `desenho` (opcional): da seção 6. Escolha o que **mais se parece** com o item, ou uma metáfora clara (impulso → `raio`, sorte/sem critério → `dado`, risco → `alerta`, dinheiro guardado → `cofre`). Sem `desenho`, a figurinha leva o número do item, grande. `"desenho": "texto"` + `simbolo` (até 6 caracteres: "12%", "PGBL", "3x") mostra uma palavra ou número grande.
- `fundo` (opcional): `rosa`, `manteiga`, `menta`, `ceu`, `lavanda`, `pessego`. Sem ele, cada desenho vem com o seu (e sem desenho, as cores alternam). Evite dois itens seguidos com o mesmo fundo.
- `motivo` (opcional): o porquê, fiel à fala, até ~40 caracteres (até três linhas). `destaque`: trecho exato do motivo em framboesa.
- `carimboEm`: o `em` da palavra que fecha o item ("impulso", "rins", "limite"). Sem ele, o item fica sem carimbo.
- `carimbo` (do álbum ou de um item): `"nao"` (✗ NÃO PODE, framboesa — padrão), `"pode"` (✓ PODE, verde) ou `"nenhum"`.
- `textoCarimbo` (do álbum ou de um item): outro texto no carimbo, 1 a 3 palavras com palavras da fala ou um veredito curto ("ERRO", "RISCO", "SEM LIMITE", "ATÉ 12%"). Texto comprido quebra em duas linhas sobre o desenho.
- `reacao` (opcional): reação do cachorro quando a figurinha chega: `atento`, `curioso` (padrão), `querendo` (língua de fora; padrão do primeiro item), `susto`, `feliz`, `preocupado`. No carimbo ele reage sozinho (`susto` no ✗, `feliz` no ✓).
- `lados` (opcional): lado da figurinha da pessoa em cada item no vertical. No quadro deitado a pessoa fica sempre na moldura da direita e este campo não muda nada (fica para o plano valer nas duas versões).

### `especial`: o conselho principal

```json
{ "tipo": "especial", "de": 19.2, "ate": 21.3, "texto": "Guarda todos os comprovantes", "destaque": "comprovantes" }
```

- A figurinha da pessoa cresce para a esquerda e uma etiqueta com o conselho cola ao lado dela, por cima da beirada; o cachorro espia preocupado e se alivia na última palavra.
- `apoio` (opcional): a linha pequena de cima, falada, até ~30 caracteres. `texto`: a frase principal, até ~36 caracteres. `destaque`: trecho em framboesa. `em`: quando o texto começa a ser dito. `alivioEm`: quando o cachorro se alivia.
- Funciona melhor logo depois de um `album` (a fileira completa continua embaixo). No máximo um por vídeo.

## 6. Os desenhos das figurinhas

Ilustrações a traço (tinta índigo) com cor chapada, no estilo do cachorro. Cada uma já vem com um fundo e com a versão a lápis (o esboço da casa vazia).

| `desenho` | O que é | Serve de metáfora para |
|---|---|---|
| `moeda` | moedas douradas com cifrão | dinheiro, preço, cripto, custo |
| `dinheiro` | notas | salário, pagamento, renda |
| `cofre` | cofrinho de porquinho com moeda | poupança, reserva, previdência, investir |
| `grafico-sobe` / `grafico-cai` | quadrinho com barras e seta | alta, crescimento / queda, prejuízo |
| `alerta` | triângulo de atenção | risco, perigo, erro, cuidado |
| `lupa` | lupa | analisar, pesquisar, critério, detalhe |
| `relogio` | despertador | tempo, prazo, rotina, horário |
| `calendario` | calendário | data, frequência, ano, paciência |
| `lampada` | lâmpada | ideia, dica, solução |
| `livro` | livro | estudo, educação, curso, aprendizado |
| `documento` | folha com carimbo | contrato, comprovante, nota, papelada |
| `calculadora` | calculadora | conta, imposto, cálculo, orçamento |
| `casa` | casa | moradia, imóvel, família, lar |
| `alvo` | alvo com dardo | meta, objetivo, foco, acerto |
| `cadeado` | cadeado | segurança, senha, proteção |
| `raio` | raio | impulso, energia, rapidez, susto |
| `dado` | dados | sorte, aposta, sem critério, acaso |
| `celular` | celular | redes sociais, app, tela, mensagem |
| `balao` | balão de fala | frase dita, conversa, comentário |
| `estrela` | estrela | destaque, favorito, avaliação |
| `trofeu` | troféu | conquista, resultado, vitória |
| `pessoa` | busto de pessoa | cliente, paciente, aluno, alguém |
| `maleta` | maleta | trabalho, carreira, negócio |
| `carrinho` | carrinho de compras | compra, consumo, mercado |
| `check` / `xis` | círculo verde com ✓ / framboesa com ✗ | o certo / o errado |
| `coracao` | coração | saúde, amor, cuidado |
| `telefone` | telefone tocando | ligar, emergência, contato |
| `remedio` | cápsula e comprimido | remédio, tratamento |
| `vacina` | seringa | vacina, injeção, exame |
| `chocolate`, `uva`, `cebola-alho`, `cebola`, `alho`, `abacate`, `cafe`, `osso`, `tigela`, `pata` | comidas e coisas de pet (o demo) | comida, hábito, pet |
| `texto` | sem desenho: uma palavra, sigla ou número grande (campo `simbolo`) | qualquer coisa sem desenho próprio |

Se nenhum desenho é o item nem uma metáfora clara dele, use `texto` ou deixe sem desenho (o número). Nunca um desenho "parecido" que confunda (uva-passa não é grão de café).

## 7. Regras de tempo e de texto

- `de`: o `em` da primeira palavra que o momento cobre, menos 0,05 (nunca menor que 0 nem antes do `ate` do momento anterior).
- `ate`: o `em` da **primeira palavra que o momento não cobre**, ou o fim do vídeo. O último momento, se termina a menos de 0,3 s do fim, fica até o último quadro.
- Momentos colados um no outro trocam de cena sem passar pela tela cheia. Um intervalo de até 1,5 s entre momentos fica com a cena anterior.
- Sub-passos (`itens[].em`, `carimboEm`, `lados[].em`, `dados[].em`, `opcoes[].em`, `significadoEm`, `riscoEm`, `detalheEm`, `caoEm`, `alivioEm`): o `em` da palavra que eles ilustram. Nada aparece em tinta antes de ser dito.
- Nada fica parado mais de ~2,5 s: momento com mais de ~4 s precisa de itens entrando por dentro dele. No vídeo completo (16:9) o `conferir.mjs` segue os limites da aula no `modelo.json`: reprova menos de 50% do vídeo com momento, trecho de mais de ~8 s só com a pessoa e a legenda, menos de um momento a cada ~10 s e momento parado mais de ~6 s.
- Texto de tela curto e com as palavras da fala. Todo texto é medido e encolhe até um mínimo legível (títulos ~56 px, textos ~40 px) para caber; se ficar pequeno demais, encurte.

## 8. Legenda e correções

A legenda é montada sozinha a partir de `palavras`: uma tira de papel creme por linha, no terço de baixo da tela cheia, acima dos controles do player. Ela **some durante os momentos**, porque as etiquetas e figurinhas já mostram o que é dito. `"legenda": true` num momento mantém a legenda durante ele; `semLegenda` esconde faixas extras:

```json
"semLegenda": [ { "de": 20.1, "ate": 21.3 } ]
```

Palavras que a transcrição errou vão em `correcoes`, sem pontuação: `{ "uva passa": "uva-passa", "né": "" }`. A chave pode ter várias palavras seguidas (viram uma só) e `""` apaga a palavra. Só corrija o que você tem certeza. Não edite `palavras` à mão: o `cortar.mjs` reescreve esse campo.

## 9. Exemplos completos

### O demo (veterinário, 18 s)

Fala: "Três alimentos que parecem inofensivos e fazem mal pro seu cachorro. Chocolate: tem teobromina, que é tóxica pra ele. Uva e uva-passa: podem causar problema nos rins. Cebola e alho: danificam as células do sangue. Se ele comer, procure um veterinário. Salva e manda pra quem tem cachorro."

```json
{
  "marca": { "nome": "Dr. Tiago Moura", "area": "Veterinário" },
  "momentos": [
    { "tipo": "abertura", "de": 0, "ate": 4.34, "texto": "3 alimentos que parecem inofensivos e fazem mal pro seu cachorro",
      "destaque": "fazem mal", "caoEm": 3.74 },
    { "tipo": "album", "de": 4.34, "ate": 14.15, "carimbo": "nao", "itens": [
      { "em": 4.39, "nome": "Chocolate", "desenho": "chocolate", "motivo": "Tem teobromina, tóxica pra ele", "destaque": "tóxica", "carimboEm": 6.93 },
      { "em": 7.8, "nome": "Uva e uva-passa", "desenho": "uva", "motivo": "Podem causar problema nos rins", "destaque": "rins", "carimboEm": 10.71 },
      { "em": 11.07, "nome": "Cebola e alho", "desenho": "cebola-alho", "motivo": "Danificam as células do sangue", "destaque": "células do sangue", "carimboEm": 13.63 } ] },
    { "tipo": "especial", "de": 14.15, "ate": 16.15, "apoio": "Se ele comer,", "texto": "procure um veterinário", "destaque": "veterinário" },
    { "tipo": "cta", "de": 16.15, "ate": 18.28, "texto": "Salva", "icone": "salvar", "em": 16.18,
      "segunda": { "em": 16.36, "texto": "Manda pra quem tem cachorro", "icone": "enviar" } }
  ],
  "semLegenda": [],
  "correcoes": { "uva passa": "uva-passa" }
}
```

### Um vídeo de outro assunto (cripto, 43 s)

Fala: "O Bitcoin rompeu os 83 mil dólares e reacendeu a conversa sobre o novo bull market, um ciclo de alta das criptomoedas. Mas o mercado subindo não significa dinheiro no bolso, literalmente para a maioria das pessoas. Mesmo na alta, tem gente que perde porque compra por impulso, escolhe moeda sem critério e assume risco que não entende. Agora, como avaliar os projetos e pensar no seu posicionamento? Eu gravei uma aula gratuita para te explicar como eu analiso o mercado, os riscos e a escolha dos ativos, sem promessa de lucro. Você quer entender antes de decidir e correr o risco de perder o seu patrimônio? Toca aqui em Saiba Mais e assiste essa aula agora."

```json
"momentos": [
  { "tipo": "numero", "de": 0, "ate": 2.89, "valor": 83000, "em": 1.34, "prefixo": "US$", "rotulo": "Bitcoin rompeu", "rotuloEm": 0.1 },
  { "tipo": "definicao", "de": 2.89, "ate": 8.65, "termo": "Bull market", "em": 5.3, "significado": "Ciclo de alta das criptomoedas", "significadoEm": 6.15 },
  { "tipo": "comparacao", "de": 8.65, "ate": 12.86, "titulo": "Mercado × bolso", "modo": "contra",
    "lados": [ { "rotulo": "Mercado", "texto": "Subindo", "em": 8.77 }, { "rotulo": "No bolso", "texto": "Não significa dinheiro", "em": 9.87 } ] },
  { "tipo": "destaque", "de": 12.86, "ate": 17.2, "texto": "Para a maioria", "em": 13.46, "nivel": "alerta",
    "detalhe": "Mesmo na alta, tem gente que perde", "detalheEm": 14.93 },
  { "tipo": "album", "de": 17.2, "ate": 24.15, "carimbo": "nao", "textoCarimbo": "ERRO", "itens": [
    { "em": 17.73, "nome": "Compra por impulso", "desenho": "raio", "carimboEm": 18.45 },
    { "em": 19.21, "nome": "Escolhe moeda sem critério", "desenho": "dado", "carimboEm": 20.43 },
    { "em": 21.25, "nome": "Assume risco que não entende", "desenho": "alerta", "carimboEm": 22.86 } ] },
  { "tipo": "pergunta", "de": 24.15, "ate": 28.0, "texto": "Como avaliar os projetos e pensar no seu posicionamento?", "em": 24.58 },
  { "tipo": "passos", "de": 28.0, "ate": 33.8, "titulo": "Aula gratuita: como eu analiso", "itens": [
    { "texto": "O mercado", "em": 30.86, "desenho": "grafico-sobe" }, { "texto": "Os riscos", "em": 31.47, "desenho": "alerta" },
    { "texto": "A escolha dos ativos", "em": 32.21, "desenho": "lupa" } ] },
  { "tipo": "frase", "de": 33.8, "ate": 35.2, "texto": "Sem promessa de lucro", "risco": "promessa de lucro", "riscoEm": 34.75, "em": 33.83 },
  { "tipo": "pergunta", "de": 35.2, "ate": 40.02, "texto": "Você quer…", "em": 35.23,
    "opcoes": [ { "texto": "Entender antes de decidir", "em": 35.93 }, { "texto": "Correr o risco de perder", "em": 37.98 } ] },
  { "tipo": "cta", "de": 40.02, "ate": 43.07, "texto": "Toca em Saiba Mais e assiste essa aula", "destaque": "Saiba Mais", "icone": "link", "em": 40.05 }
]
```

Com esse plano: o número conta no peito; a pessoa vira figurinha e "Bull market" vira a figurinha do verbete; a página vira para "Mercado × bolso"; o carimbo "PARA A MAIORIA" bate numa etiqueta; os três erros entram no álbum com o ✗ "ERRO"; a pergunta se escreve; a trilha da aula passa de selo em selo; "promessa de lucro" é riscada; as opções colam; o fechamento traz o link e a assinatura.
