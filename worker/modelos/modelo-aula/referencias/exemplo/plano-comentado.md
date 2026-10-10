# Exemplo do modelo aula: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `capitulo` (bloco próprio do modelo): 0.00–3.13 s
Fala: “Nesta aula, você vai entender juros compostos,”

```json
{"numero": "Aula 3", "numeroEm": 0.58, "texto": "Juros compostos", "em": 1.94}
```

## 2. `grafico` (bloco universal): 3.13–9.21 s
Fala: “No Juro Simples, você ganha sempre sob o valor inicial. No composto, você ganha sobre o valor que já cresceu”

```json
{"titulo": "Juro simples × juro composto", "forma": "linha", "tendencia": "sobe", "ilustrativo": true, "eixos": {"x": "tempo", "y": "valor"}, "series": [{"rotulo": "Juro simples", "em": 3.46, "forma": "reta", "nota": "sempre sobre o valor inicial", "notaEm": 4.64}, {"rotulo": "Juro composto", "em": 7.66, "forma": "curva", "nota": "sobre o valor que já cresceu", "notaEm": 7.66, "destaque": true}], "base": {"rotulo": "valor inicial", "em": 5.4}, "diferencaEm": 8.62}
```

## 3. `destaque` (bloco universal): 6.25–7.42 s
Fala: “No composto, você ganha”

```json
{"texto": "Juro composto", "em": 6.34}
```

## 4. `numero` (bloco universal): 9.21–13.85 s
Fala: “R$ 1.000,00 a 1% ao mês viram R$ 1.127,00 em um ano”

```json
{"titulo": "Exemplo", "valor": 1127, "em": 12.0, "rotulo": "em 1 ano", "rotuloEm": 13.28, "prefixo": "R$ ", "desde": 1000, "desdeEm": 9.3, "via": "1% ao mês", "viaEm": 10.12}
```

## 5. `slide` (assinatura): 13.85–20.66 s
Fala: “Anota a fórmula: m igual a c vezes 1 mais i elevado a t.”

```json
{"titulo": "Anote a fórmula", "em": 13.98, "destaque": "fórmula", "resumo": {"em": 14.32, "itens": ["Simples: sobre o valor inicial", "Composto: sobre o valor que já cresceu", "R$ 1.000 → R$ 1.127 em 1 ano"]}, "formula": [{"texto": "M", "em": 15.0}, {"texto": "=", "em": 15.5}, {"texto": "C", "em": 15.98}, {"texto": "·", "em": 16.64}, {"texto": "(1", "em": 17.5}, {"texto": "+", "em": 17.92}, {"texto": "i)", "em": 18.56}, {"texto": "t", "em": 19.16, "sup": true}]}
```
