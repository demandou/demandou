# O plano do Níveis (`src/plano.json`)

O `cortar.mjs` escreve o esqueleto (vídeo, medidas, `rosto` com o rastro, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você escreve `perfil`, `momentos` e, se quiser, `camera`. Deixe `marca` como `{ "nome": "", "area": "" }`, `sfx: false` e `semLegenda: [{ "de": 0, "ate": <duracao> }]`.

## Campos do plano que você preenche

| Campo | O que é |
|---|---|
| `perfil` | `{ "usuario": "tiagolemosx", "foto": "perfil.jpg" }`. O cartão "Seguir" do fechamento. `foto` é opcional (quadrada, em `public/`); sem ela entra a inicial do nome |
| `momentos` | os ciclos (`niveis`), o fechamento (`cta`) e, só quando a fala pede, os blocos universais |
| `camera` | opcional, veja abaixo |

## A assinatura: `niveis` (um ciclo)

```json
{ "tipo": "niveis", "de": 0, "ate": 4.25, "itens": [
  { "rotulo": "R$ 200",   "em": 0.02, "imagem": { "id": "tenis1" }, "fundo": "#DCE3EE" },
  { "rotulo": "R$ 600",   "em": 1.67, "imagem": { "id": "tenis2" }, "fundo": "#D3EAE4" },
  { "rotulo": "R$ 1.500", "em": 2.43, "imagem": { "id": "tenis3" }, "fundo": "#F7D9D1" }
] }
```

| Campo | Obrigatório | O que é |
|---|---|---|
| `de`, `ate` | sim | o ciclo inteiro. `de` = o corte para o tema novo (~0,1 s antes da primeira palavra; o primeiro ciclo começa em 0); `ate` = o próximo corte. Ciclos consecutivos: o `ate` de um é o `de` do seguinte. ~3 s cada |
| `itens` | sim | de 1 a 3 cartões (um por nível), na ordem da grade (esquerda, centro, direita) |
| `itens[].rotulo` | sim | a palavra do nível, curta ("RUIM", "R$ 200", "1º MÊS"). Vira caixa alta, branca, 56 px, embaixo do cartão. Máximo ~10 caracteres por linha (nunca abaixo de 52 px): passou disso, quebra em duas linhas; escolha a palavra-chave ("BÁSICO", "CARBONO"), não a frase |
| `itens[].em` | sim | quando o cartão e o rótulo entram: de 0 a 0,2 s antes da palavra do nível (o primeiro cartão do primeiro ciclo entra em ~0,02) |
| `itens[].imagem` | não | `{ "id": "tenis1" }` (de `work/imagens.json`; `foco` opcional). PNG transparente aparece inteiro; foto preenche o cartão |
| `itens[].texto` | não | sem imagem: o texto do cartão (grande, preto). Sem `texto`, usa a palavra pedida ou o rótulo |
| `itens[].fundo` | não | cor do cartão (padrão papel `#F3F0E8`). Dê uma cor para cada nível, em tons claros |
| `itens[].posicao` | não | 0, 1 ou 2: a coluna. Padrão: a ordem do item. Use para deixar só o cartão do meio (`posicao: 1`) |
| `itens[].ate` | não | o cartão some antes do fim do ciclo (para "deixar só o do meio") |
| `itens[].depois` | não | `{ "rotulo": "BÁSICO", "em": 5.15 }`: troca o rótulo no meio do ciclo (o preço vira "o que ele tem") |

Regras:
- Cada cartão entra em corte seco, no instante exato (`em`), e fica até o `ate` do ciclo (ou do item).
- **Quando a fala traz um nível por frase** ("o de 200 tem X, o de 600 tem Y, o de 1.500 tem Z"), faça um `niveis` por trecho de vídeo (cada corte do `cortesEm`): o segundo repete os itens do primeiro com `em` igual ao `de` do ciclo (aparecem no corte) e acrescenta o novo; o terceiro repete os dois e acrescenta o terceiro. Veja o demo do modelo.
- Nunca mais de 3 cartões por ciclo. Com 4 níveis ditos, são dois ciclos.
- Se nada serve de imagem, `texto` com a palavra: melhor que imagem errada.

## O fechamento: `cta`

```json
{ "tipo": "cta", "de": 11.0, "ate": 15.7, "texto": "Comenta \"GPT\"", "em": 11.1 }
```

- Cartão do perfil (de `perfil`) no topo em `de` e, 0,5 s depois, a pílula branca no peito: `texto` com a forma `Comenta "PALAVRA"` vira duas linhas (COMENTA / “PALAVRA”). Alternativa: `texto: "Comenta"` e `destaque: "GPT"`.
- O ciclo `niveis` anterior termina no `de` do `cta` (o alto fica só com o cartão do perfil).
- Começa ~0,1 s antes da primeira palavra da chamada e vai até o último quadro (2 a 5 s).
- `icone` é ignorado neste modelo. Sem chamada na fala, sem `cta`: o vídeo termina na última palavra.

## Os blocos universais

`abertura`, `topicos`, `passos`, `numero`, `comparacao`, `grafico`, `destaque`, `definicao`, `frase` e `pergunta` têm os campos de sempre (veja `references/adaptar.md`) e aparecem **abaixo do queixo**, na altura do peito, em adesivos brancos com texto preto. Use-os só quando a fala traz um dado que não é um nível (um número dito, um antes/depois, uma pergunta). Cada um segue os limites de texto do modelo base: títulos até ~60 caracteres, itens até ~28, `numero` com `rotulo` até ~30.

## Câmera

Sem nada no plano, a câmera troca o zoom em cada corte (`cortesEm`), alternando 1,0 / 1,03 / 1,05 sem repetir (sobre o zoom que deixa o rosto com ~30% da largura). Para uma troca sem corte de vídeo:

`"camera": [{ "em": 1.38, "zoom": 1.03 }, { "em": 12.67, "zoom": 1.05 }]`

- `em` = o `de` do ciclo; `zoom` diferente do trecho anterior (só 1,0 a 1,05).
- Não use zoom maior, nem `aproximar`: o Reel não tem punch-in.

## Regras de tempo

- Cobertura de momentos: 100% (os ciclos são contínuos).
- Pelo menos 1 momento a cada 4 s de vídeo; nenhum ciclo ~parado: um cartão novo ou uma troca de rótulo a cada ~2,5 s.
- A assinatura (`niveis`) é a maioria dos momentos; o `cta` fecha.
