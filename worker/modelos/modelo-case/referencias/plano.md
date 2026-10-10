# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica: `video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm` e `palavras`. Você preenche `marca`, `relatorio`, `momentos`, `semLegenda`, `correcoes` e corrige `palavras` quando a transcrição errou um número, um nome ou o começo de uma palavra (SKILL.md, passo 4b).

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**. Cada palavra de `palavras` tem `em` (início) e `ate` (fim). Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Sumário

1. Campos gerais
2. A gramática: a folha que vira páginas
3. A assinatura: `case`
4. Os efeitos próprios: `ficha` e `depoimento`
5. Os blocos universais
6. Mini-ilustrações (`icone`)
7. Regras de tempo
8. Legenda, correções e sons
9. O exemplo completo

## 1. Campos gerais

```json
{
  "marca": { "nome": "Rafael Moura", "area": "Gestor de tráfego" },
  "relatorio": "Relatório de case",
  "sfx": true,
  "correcoes": {},
  "semLegenda": []
}
```

- `marca`: `nome` (40 px, nunca menos de 34) e `area` (mono, 22 px) vão na tarja presa entre a folha e a moldura, à esquerda, de 0,2 s a ~3,6 s. `nome` vazio = sem tarja.
- `relatorio`: o título do cabeçalho da folha, em mono caixa alta de 32 px (padrão "Relatório"). Curto: até ~20 caracteres.
- `sfx`: `false` desliga os sons.
- `duracao`: termine ~0,3 s depois do fim da última palavra.

## 2. A gramática

- A **folha** fica em cima (papel claro sobre a mesa cinza) com o **cabeçalho fixo**: o quadradinho coral, o título do relatório, a etiqueta da página atual e um ponto por página.
- Cada momento vira **uma página** (a altura da janela, ~760 px; o `case` vira até três). As páginas ficam empilhadas na folha, separadas por um filete tracejado.
- A câmera **chega a cada página 0,15 s antes da primeira palavra dela** (o `em` da primeira peça) e desce em 0,42 s. As páginas anteriores continuam lá em cima: o relatório se acumula.
- **Nada de molde:** cada peça só aparece quando é dita, já com conteúdo e com movimento. O conjunto da página fica centrado na área livre e sobe suave quando uma peça nova entra embaixo (a página nunca mostra linha cinza, caixa vazia ou campo tracejado esperando).
- **Gancho no quadro 0:** o primeiro `case` (ou `ficha`) leva um `titulo` com `tituloEm: 0` (ver abaixo): o quadro 0 já mostra a ficha com conteúdo.
- A **pessoa** fica embaixo o tempo todo, numa moldura larga.
- Consequência: cada página precisa de **pelo menos ~1 s parada** depois da última peça antes da próxima chegar. Fala corrida demais? Junte (ver "Regras de tempo").

## 3. A assinatura: `case`

```json
{
  "tipo": "case", "de": 0, "ate": 12.74,
  "antes": { "etiqueta": "Antes", "em": 0.30, "titulo": "Cliente", "icone": "pessoa", "tituloEm": 0, "carimboEm": 0.47, "metricas": [
    { "rotulo": "Gasto em anúncio", "em": 0.86, "valor": "R$ 5 mil", "valorEm": 1.14,
      "detalhe": "por mês", "detalheEm": 1.99, "icone": "anuncio", "iconeEm": 2.62 },
    { "rotulo": "Vendas", "em": 3.47, "valor": "quase não vendia", "valorEm": 3.47, "icone": "carrinho", "sinal": "plano" } ] },
  "mudancas": { "etiqueta": "O que fizemos", "em": 4.83, "titulo": "Mudamos 3 coisas", "destaque": "3", "itens": [
    { "texto": "O criativo", "em": 6.48, "icone": "criativo" },
    { "texto": "A página", "em": 7.72, "icone": "pagina" },
    { "texto": "A oferta", "em": 8.57, "icone": "oferta" } ] },
  "prazo": { "texto": "60 dias", "em": 9.44, "fimEm": 10.55 },
  "resultado": { "rotulo": "Custo por venda", "em": 10.76, "direcao": "cai", "fator": 0.5,
    "depoisEm": 11.25, "movimentoEm": 11.64, "relacao": "pela metade", "relacaoEm": 11.96 }
}
```

Todas as partes são opcionais (pelo menos uma). Cada parte vira uma página, nesta ordem; `prazo` e `resultado` dividem a página DEPOIS. Vários `case` no mesmo vídeo continuam o mesmo relatório (ex.: `antes` no começo, uma `frase` no meio, `mudancas` + `resultado` depois).

**`antes`** (a ficha): `etiqueta` (o texto do carimbo, padrão "Antes"), `em` (o começo do trecho), `metricas` (1 a 3), e a cabeça da ficha:
- `titulo` (opcional, curto: quem é o case — "Cliente", "A loja", "Eu", "O consultório") com o quadrinho `icone` (padrão `pessoa`); entra em `tituloEm` (padrão `em`). `tituloEm: 0` = já no quadro 0, o gancho (o timing gate não confere).
- o **carimbo** coral com a `etiqueta` bate em `carimboEm` (padrão `em`; use a palavra do título: "cliente"). Sem `titulo`, só o carimbo abre a ficha.

As métricas:
- `rotulo`: curto, vira etiqueta mono em caixa alta (até ~26 caracteres). Entra em `em`.
- `valor`: **o que foi dito**, em Inter 800 de até 116 px (reduz até 52 e quebra em 2 linhas; até ~22 caracteres). É datilografado palavra por palavra a partir de `valorEm`, cada palavra no instante em que é dita.
- `detalhe` (opcional): a unidade ou o complemento ("por mês", "por dia"), menor e cinza, ao lado do valor se couber, senão embaixo. Entra em `detalheEm`.
- `icone` (opcional): mini-ilustração no quadrinho da esquerda, desenhada em `iconeEm` (padrão `em`) — use a palavra que nomeia a coisa ("anúncio"). Sem ícone em nenhuma métrica, o texto ocupa a largura toda.
- `sinal` (opcional): um traço coral pequeno à direita do rótulo: `"plano"` (parado), `"cai"`, `"sobe"`. Desenha logo depois do valor.

**`mudancas`** (O QUE FIZEMOS): `etiqueta` (padrão "O que fizemos"), `em`, `titulo` (opcional, até 2 linhas, palavra por palavra; `destaque` = trecho em coral, ex. o número dito), `itens` (2 a 5): `texto` (até ~28 caracteres), `em` (a palavra da mudança: a caixa enche de coral, o ✓ se desenha, a ilustração se desenha, o texto entra), `icone` (opcional), `detalhe` (opcional, uma linha cinza).

**`prazo`**: `texto` ("60 dias", "3 meses", "uma semana"), `em` (palavra por palavra; o número em coral, ou `destaque`), `fimEm` (a barra enche de `em` até aqui; padrão `em` + 1,2 s; a bandeira coral aparece no fim), `inicio` (rótulo da ponta esquerda, padrão "início").

**`resultado`**: o gráfico ANTES × DEPOIS.
- `rotulo` (o que foi medido: "Custo por venda", até ~30 caracteres) entra em `em` com a barra ANTES (tinta).
- `depoisEm`: a barra DEPOIS (coral) aparece na mesma altura; `movimentoEm`: ela **cai** (`direcao: "cai"`) ou **sobe** (`"sobe"`) até `fator` × ANTES. Use o verbo dito ("caiu", "subiu", "dobrou").
- `fator`: **só da relação dita** ("metade" = 0,5; "um terço" = 0,33; "dobro" = 2; "triplicou" = 3) ou de dois números ditos (de 80 para 40 = 0,5). Sem isso: `ilustrativo: true` (a barra se move ~45%, com a etiqueta "ILUSTRATIVO").
- `relacao` (opcional): a relação dita, em coral, ao lado do colchete ("pela metade", "o dobro", "3x mais"); entra em `relacaoEm` (a primeira palavra dela) com um soco de câmera na pessoa.
- `antes`/`depois`: rótulos das barras (padrão "antes"/"depois"; ex.: "janeiro"/"março").
- `valorAntes`/`valorDepois`: só números ditos ("R$ 80", "R$ 40"), em cima das barras.

## 4. Os efeitos próprios

### `ficha`: a ficha sozinha

```json
{ "tipo": "ficha", "de": 0, "ate": 8.6, "etiqueta": "O mercado", "titulo": "Bitcoin", "icone": "moeda", "tituloEm": 0, "carimboEm": 0.10, "metricas": [
  { "rotulo": "Bitcoin", "em": 0.10, "valor": "US$ 83 mil", "valorEm": 1.34, "icone": "moeda", "sinal": "sobe" } ] }
```

A mesma página do `antes` (com `titulo`, `icone`, `tituloEm` e `carimboEm`), para qualquer dado dito fora de uma virada (o raio-x de hoje, o perfil de um produto, os números de um mercado). `etiqueta` padrão "Ficha"; 1 a 3 métricas com os campos acima.

### `depoimento`: o print da mensagem

```json
{ "tipo": "depoimento", "de": 12.74, "ate": 14.2, "etiqueta": "Mensagem do cliente", "em": 12.97, "palavra": "Olha",
  "textoEm": 13.18, "texto": "Mudou o jogo aqui! Vendendo mais e gastando menos.", "nome": "Cliente", "estrelas": 5, "estrelasEm": 13.66 }
```

- A página mostra uma conversa **genérica** (sem logo de app, sem hora): a barra do contato (avatar neutro, `nome`, padrão "Cliente"), o "digitando…" a partir de `em` (a palavra que anuncia: "olha", "mensagem", "depoimento", "print"; diga qual em `palavra`, para o timing gate) e o balão em `textoEm`.
- `texto`: **a mensagem real** (até ~110 caracteres; reduz até 32 px e quebra em até 4 linhas). Texto de exemplo só com autorização do usuário.
- `estrelas` (1–5, opcional): só se a avaliação existir. Entram já cheias, uma a uma (0,05 s), a partir de `estrelasEm` (nenhuma estrela vazia na tela).
- `arquivo` (opcional): o print de verdade, copiado para `public/` (ex.: `"imagens/print.png"`): entra no lugar do balão, recortado para caber (preenche, sem faixa preta).
- A câmera chega a esta página 0,12 s antes do balão (`textoEm`), não no "digitando…": dá mais tempo para a página anterior (o resultado) ficar à vista.

## 5. Os blocos universais

Mesmos campos em todos os modelos do pack. Todos aceitam `etiqueta` (o rótulo da página; cada um tem um padrão).

| `tipo` | Campos | Neste estilo | Etiqueta padrão |
|---|---|---|---|
| `abertura` | `texto`, `destaque?`, `em?` | traço coral + título grande palavra por palavra, marca-texto no destaque (até ~60 caracteres) | Tema |
| `topicos` | `titulo?`, `itens[{texto, em, detalhe?, icone?}]` (2–5) | lista com marcador quadrado que acende em coral e faixa da vez | Pontos |
| `passos` | `titulo?`, `itens[...]` (2–5) | lista com caixas que se marcam, ligadas por um traço | Passo a passo |
| `numero` | `valor`, `em`, `rotulo`, `rotuloEm?`, `prefixo?`, `sufixo?`, `casas?`, `ilustrativo?` | número enorme contando + régua coral + rótulo | Em números |
| `comparacao` | `titulo?`, `modo?`, `lados[2]{rotulo, texto, em}`, `vencedor?`, `vencedorEm?` | duas colunas; a vencedora ganha borda e selo coral | Comparação / Antes × depois / Errado × certo |
| `grafico` | `titulo?`, `forma`, `dados?[{rotulo, valor, em}]` (2–6), `tendencia?`, `tendenciaEm?`, `unidade?`, `ilustrativo?` | barras de tinta (a última coral), linha, rosca; sem dados, a curva ilustrativa | Gráfico |
| `destaque` | `texto`, `em`, `nivel?`, `detalhe?`, `detalheEm?` | frase grande com filete coral; `alerta` = coral | Ponto-chave / Atenção |
| `definicao` | `termo`, `em`, `significado`, `significadoEm` | termo enorme sublinhado + significado datilografado | Definição |
| `frase` | `texto`, `destaque?`, `risco?`, `riscoEm?`, `em?` | aspas coral + texto palavra por palavra (até ~90 caracteres) | Frase |
| `pergunta` | `texto`, `destaque?`, `opcoes?[{texto, em}]`, `em?` | pergunta grande com marca-texto; opções como lista | Pergunta |
| `cta` | `texto`, `icone?`, `destaque?`, `destaqueEm?`, `em?` | chamada grande + caixa de comentário (a palavra `destaque` é digitada em `destaqueEm` e o enviar é tocado); `salvar`/`seguir`/`link` = botão que acende em `destaqueEm` | Próximo passo |

- Uma `pergunta` **sem opções** cujo `ate` encosta (≤ 0,3 s) no `de` de um `cta` divide a mesma página: a pergunta chega no meio da página e, quando a chamada é dita, sobe; a chamada e a caixa de comentário entram embaixo, já preenchidas.
- `cta` com `icone: "comentar"` (padrão): `destaque` = a palavra-chave exatamente como deve ser comentada ("CASE").

## 6. Mini-ilustrações (`icone`)

Desenhos em traço de tinta com acento coral, que se desenham na palavra. Use a que mostra **a coisa dita**; nenhuma serve? Deixe sem `icone`.

`anuncio` (megafone com ondas), `criativo` (post com imagem e play), `pagina` (página/site com botão), `oferta` (etiqueta de preço com %), `carrinho`, `dinheiro` (cédula), `moeda` (moedas), `grafico` (barras subindo), `alvo`, `funil`, `mensagem` (balões), `email`, `video`, `telefone` (celular), `calendario`, `relogio`, `pessoa`, `equipe`, `ferramenta`, `ideia` (lâmpada), `documento`, `escudo` (proteção/segurança), `coracao` (saúde), `casa`.

## 7. Regras de tempo

- Toda peça entra **na palavra que a nomeia** (±0,15 s): `node ferramentas/timing.mjs` confere e lista os desvios.
- O `de` de cada momento pode ficar antes da primeira palavra (a câmera desce no respiro); o `ate` encosta no `de` do próximo.
- A câmera chega à página 0,15 s antes da primeira peça. Deixe **≥ 0,8 s** entre a última peça de uma página e a primeira da seguinte, ou a página anterior some cedo demais. Fala corrida? Junte: `prazo` + `resultado` na mesma página, `pergunta` + `cta` na mesma página, ou um `case` com menos partes.
- Nada fica parado: dentro de uma página, algo novo a cada ~1,5–2,5 s (a conferência reprova mais de 4,5 s).
- Ordem dentro do `case`: `antes` → `mudancas` → `prazo` → `resultado`, cada um depois do anterior.

## 8. Legenda, correções e sons

- A legenda some durante os momentos (o relatório mostra a fala). `legenda: true` num momento a mantém (etiqueta de papel abaixo do queixo, até 4 palavras, a palavra dita sublinhada em coral). Trechos sem momento mostram a legenda.
- `correcoes`: troca palavras na legenda (`{"chat GPT": "ChatGPT"}`); para os tempos e para o que as peças procuram, corrija direto em `palavras`.
- Sons (automáticos): nota de marimba por item marcado, deslize na queda/subida da barra, duas notas na relação, toque duplo no balão, brilho nas estrelas, "pop" no enviar.

## 9. O exemplo completo (case de tráfego, 16,8 s)

Veja `references/exemplo/plano-comentado.md` (cada fala → cada página) e `references/exemplo/quadros.jpg`.
