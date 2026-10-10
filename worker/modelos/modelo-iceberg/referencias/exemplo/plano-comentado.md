# Exemplo do modelo iceberg: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–1.76 s
Fala: “O iceberg do café.”

```json
{"texto": "O iceberg do café", "destaque": "café", "em": 0.28}
```

## 2. `iceberg` (assinatura): 1.76–15.20 s
Fala: “Na superfície, o expresso. um pouco mais fundo, o Cold Brew. Descendo mais, o Café do Jacu, feito com os grãos que um pássaro come e devolve inteiros, e lá no fundo o Kopiluvak, da Indonésia.”

```json
{"unidade": "m", "niveis": [{"nome": "Expresso", "em": 2.87, "rotulo": "Na superfície", "imagem": {"id": "expresso"}}, {"nome": "Cold Brew", "em": 4.6, "rotulo": "Um pouco mais fundo", "imagem": {"id": "coldbrew"}, "desceEm": 3.85}, {"nome": "Café do Jacu", "em": 6.92, "rotulo": "Descendo mais", "imagem": {"id": "jacu"}, "inset": {"imagem": {"id": "graos"}, "em": 8.59}, "detalhes": [{"texto": "Grãos que um pássaro come", "em": 9.3}, {"texto": "e devolve inteiros", "em": 10.3, "destaque": true}], "desceEm": 6.2}, {"nome": "Kopi Luwak", "em": 13.08, "rotulo": "Lá no fundo", "desceEm": 11.6, "imagem": {"id": "civeta"}, "detalhes": [{"texto": "Indonésia", "em": 14.47, "destaque": true}]}]}
```

## 3. `cta` (bloco universal): 15.20–16.80 s
Fala: “Até onde você desce.”

```json
{"texto": "Até onde você desce?", "icone": "comentar", "em": 15.28}
```
