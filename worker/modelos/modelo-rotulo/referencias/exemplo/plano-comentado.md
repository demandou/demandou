# Exemplo do modelo rotulo: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.98 s
Fala: “Como ler o rótulo de um vinho em 10 segundos?”

```json
{"texto": "Como ler o rótulo de um vinho em 10 segundos", "rotulo": "Anatomia do rótulo", "linhas": ["Como ler o rótulo", "de um vinho", "em 10 segundos"], "destaque": "10 segundos", "selo": {"em": 1.92, "valor": "10"}}
```

## 2. `origem` (assinatura): 2.98–7.07 s
Fala: “Primeiro, o país e a região. Eles dizem muito sobre o estilo.”

```json
{"pais": {"em": 3.86, "texto": "Argentina", "mapa": "argentina"}, "regiao": {"em": 4.43, "texto": "Mendoza", "lat": -32.9, "lon": -68.8}, "nota": {"em": 5.43, "texto": "dizem muito sobre o estilo", "destaque": "estilo"}}
```

## 3. `variedade` (assinatura): 7.07–10.88 s
Fala: “Depois, a uva. como Cabernet Sauvignon ou Malbec”

```json
{"em": 8.09, "desenho": "cacho", "itens": [{"em": 8.78, "texto": "Cabernet Sauvignon"}, {"em": 10.21, "texto": "Malbec"}], "conector": "ou"}
```

## 4. `ano` (assinatura): 10.88–13.09 s
Fala: “e a safra, que é o ano da colheita.”

```json
{"em": 11.06, "nota": {"em": 12.21, "texto": "o ano da colheita", "destaque": "colheita"}}
```

## 5. `teor` (assinatura): 13.09–16.82 s
Fala: “Teor alcoólico mais alto costuma indicar um vinho mais encorpado”

```json
{"em": 13.19, "valor": 14, "subida": {"em": 14.03, "texto": "mais alto"}, "medidor": {"em": 15.02, "de": "leve", "ate": "encorpado", "nivel": 0.86, "cheioEm": 16.25}, "taca": {"em": 15.54, "liquido": "tinto"}}
```

## 6. `cta` (bloco universal): 16.82–18.92 s
Fala: “Salva para a sua próxima compra.”

```json
{"texto": "Salva pra sua próxima compra", "linhas": ["Salva pra sua", "próxima compra"], "destaque": "próxima compra", "icone": "salvar"}
```
