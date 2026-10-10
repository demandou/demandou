# Exemplo do modelo plantao: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `vinheta` (assinatura): 0.00–2.25 s
Fala: “Entenda em 30 segundos.”

```json
{"titulo": "Entenda", "subtitulo": "em 30 segundos"}
```

## 2. `manchete` (assinatura): 2.25–3.45 s
Fala: “O que é inflação?”

```json
{"chapeu": "O que é", "titulo": "Inflação?"}
```

## 3. `grafico` (bloco universal): 3.45–7.55 s
Fala: “é quando os preços sobem de forma geral e o seu dinheiro compra menos.”

```json
{"forma": "linha", "tendencia": "sobe", "tendenciaEm": 4.06, "ilustrativo": true, "titulo": "Inflação é quando", "destaque": "Inflação", "series": [{"rotulo": "Preços sobem", "em": 4.06, "sentido": "sobe", "detalhe": {"texto": "de forma geral", "em": 4.9, "feixe": true}}, {"rotulo": "Seu dinheiro compra menos", "em": 5.93, "sentido": "desce"}]}
```

## 4. `etiqueta` (assinatura): 7.55–13.19 s
Fala: “Se a inflação do ano foi de 5%, o que custava R$100 passou a custar R$105.”

```json
{"taxa": {"rotulo": "Inflação do ano", "valor": "5%", "em": 9.16}, "antes": {"rotulo": "Custava", "valor": "R$ 100", "em": 10.43}, "depois": {"rotulo": "Passou a custar", "valor": "R$ 105", "em": 12.02}, "diferenca": "+R$ 5", "quadro": "lateral"}
```

## 5. `nota` (assinatura): 13.19–16.96 s
Fala: “Por isso, guardar dinheiro parado faz você perder poder de compra.”

```json
{"valor": "R$ 100", "rotulo": "Guardar dinheiro parado", "notaEm": 14.12, "paradoEm": 14.64, "perda": {"texto": "Perde poder de compra", "em": 15.64}}
```

## 6. `cta` (bloco universal): 16.96–19.88 s
Fala: “Segue para entender a economia sem complicação.”

```json
{"texto": "Segue pra entender a economia sem complicação", "destaque": "sem complicação", "icone": "seguir"}
```
