# O plano do Narrador (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com rastro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `marca`, `momentos`, `correcoes`, `semLegenda` e, se quiser, `camera` e `sfx`.

Tempos em segundos, **na linha do tempo do vídeo já cortado**. Todo `em`/`…Em` é o início de uma palavra de `work/palavras.json`.

## Campos gerais

| Campo | O que é |
|---|---|
| `marca` | `{ "nome": "Tiago Lemos", "area": "Histórias curiosas" }`: tarja no alto à esquerda do começo até a primeira imagem (máx. 3,6 s). `nome: ""` = sem tarja |
| `sfx` | `true` (padrão): passagem tonal baixa quando a pessoa sai e uma imagem entra; `false` desliga |
| `camera` | opcional: `[{ "em": 5.2, "zoom": 1.12 }, { "em": 9, "aproximar": true }]`. Sem isto, alterna sozinha |
| `correcoes` | `{ "1889": "1889." }`: troca palavras na legenda e nos textos. Use para pontuar o fim de frase que o Whisper não pontuou (senão duas frases emendam na legenda) e para nomes |
| `semLegenda` | `[{ "de": 12, "ate": 13.5 }]` |

## Legenda

Até 2 linhas, abaixo do queixo, sempre na mesma altura. **Continua** em `cena`, `letreiro`, `numero`, `topicos`, `passos`, `comparacao`, `grafico`, `definicao`. **Some** em `abertura`, `destaque`, `frase`, `pergunta`, `cta`. `legenda: true|false` no momento manda por cima.

## Assinatura

```json
{ "tipo": "cena", "de": 2.59, "ate": 4.3, "imagem": { "id": "construcao" }, "rotulo": "A torre em construção, 1888", "rotuloEm": 2.83, "legenda": true }
{ "tipo": "letreiro", "de": 4.3, "ate": 7.0, "sub": "Exposição Universal", "subEm": 4.34, "texto": "Paris, 1889", "em": 4.96, "posicao": "alto", "legenda": true }
```

**cena**: `imagem` `{id, foco?, efeito?}` (efeito: `aproximar`, `panoramica`, `afastar`, `parado`; alterna sozinho), `em` (quando a coisa é dita), `rotulo` + `rotuloEm` (legenda de museu: descreve a imagem, curto), `transicao` (`dissolver` padrão | `corte` | `cortina`), `direcao` (`esquerda|direita|cima|baixo`, da panorâmica). Cenas coladas (≤ 0,12 s de vão) se dissolvem. Uma cena de ~1,5 a 3,5 s; nunca > 4 s.

**letreiro**: `texto` (data/lugar/capítulo, ≤ ~18 caracteres), `em`, `sub` (≤ ~28 caracteres, versalete) + `subEm`, `posicao` (`alto` sobre imagem ou pessoa; `baixo` sobre a pessoa, abaixo do queixo, nesse caso desligue a legenda).

## Blocos universais

Campos idênticos aos de todo modelo (`references/adaptar.md`): `abertura` (`texto`, `destaque`, `em`, `imagem?`), `topicos`/`passos` (`titulo?`, `itens[{texto, em, detalhe?}]`), `numero` (`valor`, `em`, `rotulo`, `prefixo`, `sufixo`, `casas`, `ilustrativo`, `titulo`), `comparacao` (`lados[2]`, `modo`, `vencedor`), `grafico` (`forma`, `dados` ou `tendencia`), `destaque` (`texto`, `em`, `nivel` `chave|alerta`, `detalhe`), `definicao` (`termo`, `significado`), `frase` (`texto`, `destaque`, `risco`), `pergunta` (`texto`, `opcoes`), `cta` (`texto`, `icone`). Pranchas (`numero`, `topicos`, `passos`, `comparacao`, `grafico`, `definicao`) aceitam `imagem` de fundo (escurecida e andando); sem ela usam a cena que estiver por baixo, ou a prancha escura lisa.

## Regras de tempo

- Imagem em tela cheia em 50% a 70% do tempo; pessoa em quadro cheio nas frases-chave.
- Nenhum trecho só com legenda além de ~3,5 s (o `conferir` reprova).
- Cada `em` cai numa palavra falada. `de`/`ate` de momentos de texto sobre a pessoa não se sobrepõem.
