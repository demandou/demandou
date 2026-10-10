# Exemplo do modelo terco: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.50 s
Fala: “Como gastar menos no mercado sem cortar o que você gosta Nunca”

```json
{"texto": "Como gastar menos no mercado", "destaque": "gastar menos", "em": 0.3, "legenda": false}
```

## 2. `capitulo` (assinatura): 3.45–7.00 s
Fala: “Nunca vá com fome Parece bobo, mas a fome faz você encher”

```json
{"numero": "1", "total": 3, "texto": "Nunca vá com fome", "destaque": "fome", "em": 3.48, "icone": "alerta", "iconeEm": 5.4, "legenda": true}
```

## 3. `insercao` (assinatura): 7.00–8.45 s
Fala: “o carrinho de besteira.”

```json
{"em": 7.28, "imagem": {"id": "carrinho"}, "rotulo": "Carrinho de besteira", "rotuloEm": 7.4, "legenda": true}
```

## 4. `capitulo` (assinatura): 8.40–10.20 s
Fala: “Segundo, Olha a prateleira de baixo.”

```json
{"numero": "2", "total": 3, "texto": "Olhe a prateleira de baixo", "destaque": "de baixo", "em": 8.93, "icone": "lupa", "iconeEm": 9.3, "legenda": true}
```

## 5. `insercao` (assinatura): 10.20–11.75 s
Fala: “Os produtos mais caros ficam”

```json
{"em": 10.34, "imagem": {"id": "prateleira"}, "rotulo": "Prateleira de baixo", "rotuloEm": 10.4, "etiqueta": "2", "legenda": true}
```

## 6. `destaque` (bloco universal): 11.70–12.88 s
Fala: “na altura dos olhos.”

```json
{"texto": "Os mais caros ficam na altura dos olhos", "em": 11.8, "nivel": "alerta", "icone": "alerta", "legenda": true}
```

## 7. `cta` (bloco universal): 12.85–14.72 s
Fala: “Salva para a sua próxima compra.”

```json
{"texto": "Salva para a sua próxima compra", "destaque": "Salva", "icone": "salvar", "em": 12.92, "legenda": false}
```
