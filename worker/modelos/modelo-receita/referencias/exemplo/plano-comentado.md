# Exemplo do modelo receita: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.99 s
Fala: “Brigadeiro de colher cremoso em três passos”

```json
{"rotulo": "Receita", "destaque": "cremoso", "passos": {"em": 2.16, "total": 3}, "texto": "Brigadeiro de colher cremoso"}
```

## 2. `ingredientes` (assinatura): 2.99–8.08 s
Fala: “uma lata de leite condensado, 1 colher de manteiga e 3 colheres de chocolate em pó”

```json
{"pessoa": "sup-dir", "itens": [{"em": 3.08, "quantidade": "1", "unidade": "lata", "nome": "leite condensado", "icone": "lata"}, {"em": 4.9, "quantidade": "1", "unidade": "colher", "nome": "manteiga", "icone": "colher"}, {"em": 6.26, "quantidade": "3", "unidade": "colheres", "nome": "chocolate em pó", "icone": "pote"}]}
```

## 3. `passo` (assinatura): 8.08–12.09 s
Fala: “Primeiro. Tudo na panela, fogo baixo, mexendo sem parar.”

```json
{"pessoa": "sup-esq", "numero": 1, "numeroEm": 8.18, "titulo": ["Tudo na panela"], "itens": [{"em": 10.12, "texto": "fogo baixo", "acao": "fogo-baixo"}, {"em": 11.01, "texto": "mexendo sem parar", "acao": "mexer"}]}
```

## 4. `passo` (assinatura): 12.09–15.41 s
Fala: “Segundo, Quando der para ver o fundo da panela, desliga.”

```json
{"pessoa": "sup-dir", "numero": 2, "numeroEm": 12.2, "titulo": ["Quando der pra ver", "o fundo da panela"], "destaque": "o fundo", "itens": [{"em": 13.88, "acao": "fundo"}, {"em": 14.8, "texto": "desliga", "acao": "desligar"}]}
```

## 5. `passo` (assinatura): 15.41–18.68 s
Fala: “Terceiro, Passa para o pote ainda quente e deixa esfriar.”

```json
{"pessoa": "sup-esq", "numero": 3, "numeroEm": 15.51, "titulo": ["Passa pro pote"], "itens": [{"em": 16.38, "acao": "pote"}, {"em": 16.99, "texto": "ainda quente", "acao": "quente"}, {"em": 17.89, "texto": "deixa esfriar", "acao": "esfriar"}]}
```

## 6. `cta` (bloco universal): 18.68–21.36 s
Fala: “Salva essa receita e me marca quando fizer.”

```json
{"icone": "salvar", "em": 18.76, "texto": "Salva essa receita", "apoio": "e me marca quando fizer"}
```
