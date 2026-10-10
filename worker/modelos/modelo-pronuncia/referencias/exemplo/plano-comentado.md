# Exemplo do modelo pronuncia: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.77 s
Fala: “Três palavras em inglês que quase todo brasileiro fala errado.”

```json
{"em": 0.11, "rotulo": "pronúncia em inglês", "texto": "Três palavras em inglês que quase todo brasileiro fala errado.", "destaque": "fala errado."}
```

## 2. `pronuncia` (assinatura): 3.77–8.30 s
Fala: “Comfortabullo Não é confortable, é assim. Comfortabullo. Só três sílabas,”

```json
{"palavra": "comfortable", "em": 3.87, "silabas": [{"texto": "comf", "forte": true}, {"texto": "or", "muda": true}, {"texto": "ta"}, {"texto": "ble"}], "mudaEm": 7.79, "fonetica": "/ˈkʌmf.tɚ.bəl/", "errado": "con-for-TEI-bou", "erradoEm": 5.06, "leitura": "KÂMF-ter-bou", "leituraEm": 5.98, "nota": "só 3 sílabas", "notaEm": 7.74, "imagem": {"id": "poltrona", "efeito": "aproximar"}, "lenta": {"de": 6.55, "ate": 7.29, "em": 6.41, "fim": 7.75, "ritmo": 0.694, "origem": [6.54, 7.47], "silabas": [6.79, 6.94], "arquivo": "lenta/comfortable.wav", "onda": [0, 0, 0, 0, 0.25, 0.44, 0.46, 0.8, 0.99, 1, 1, 0.99, 0.98, 0.95, 0.88, 0.86, 0.91, 0.94, 0.89, 0.7, 0.42, 0.43, 0.47, 0.46, 0.41, 0.37, 0.33, 0.82, 0.96, 1, 1, 0.97, 0.9, 0.67, 0.62, 0.61, 0.6, 0.51, 0.39, 0.28, 0.28, 0.3, 0.51, 0.91, 1, 1, 0.96, 0.82, 0.75, 0.73, 0.71, 0.7, 0.67, 0.65, 0.6, 0.59, 0.69, 0.73, 0.76, 0.79, 0.78, 0.76, 0.77, 0.78, …
```

## 3. `pronuncia` (assinatura): 8.30–12.55 s
Fala: “segunda. Vegetable o E do meio some. Vegetable E a terceira:”

```json
{"palavra": "vegetable", "em": 9.11, "silabas": [{"texto": "veg", "forte": true}, {"texto": "e", "muda": true}, {"texto": "ta"}, {"texto": "ble"}], "mudaEm": 10.61, "fonetica": "/ˈvɛdʒ.tə.bəl/", "leitura": "VÉDJ-ta-bou", "leituraEm": 10.01, "nota": "o e do meio some", "notaEm": 10.04, "imagem": {"id": "legumes", "efeito": "aproximar"}, "lenta": {"de": 11.11, "ate": 12, "em": 11.07, "fim": 12.55, "ritmo": 0.574, "origem": [11.24, 12.09], "silabas": [11.59, 11.72], "arquivo": "lenta/vegetable.wav", "onda": [0, 0, 0, 0.15, 0.46, 0.55, 0.54, 0.5, 0.47, 0.47, 0.45, 0.56, 0.76, 0.89, 0.94, 1, 1, 1, 0.98, 0.93, 0.87, 0.79, 0.61, 0.55, 0.48, 0.46, 0.52, 0.61, 0.64, 0.61, 0.6, 0.63, 0.6, 0.4, 0.14, 0.1, 0.05, 0.31, 0.48, 0.77, 0.86, 0.88, 0.81, 0.68, 0.69, 0.68, 0.67, 0.62, 0.56, 0.61, 0.75, 0.81, 0.87, 0.89, 0.9, 0.9, 0.89, 0.9, 0.91, 0.93, 0.94, 0.94, 0.92, 0.85, 0.83, 0.83, 0.82, 0.81, 0.78, 0 …
```

## 4. `pronuncia` (assinatura): 12.55–16.26 s
Fala: “Chocolate. Duas sílabas só Chocolate. Agora repete”

```json
{"palavra": "chocolate", "em": 13.3, "silabas": [{"texto": "choc", "forte": true}, {"texto": "o", "muda": true}, {"texto": "late"}], "mudaEm": 14.05, "fonetica": "/ˈtʃɑːk.lət/", "leitura": "TCHÓK-lit", "leituraEm": 13.65, "nota": "só 2 sílabas", "notaEm": 14.05, "imagem": {"id": "chocolate", "efeito": "aproximar"}, "lenta": {"de": 15.26, "ate": 15.56, "em": 15.26, "fim": 16.26, "ritmo": 0.46, "origem": [15.47, 15.93], "silabas": [15.7], "arquivo": "lenta/chocolate.wav", "onda": [0, 0, 0, 0.14, 0.32, 0.51, 0.54, 0.46, 0.38, 0.3, 0.84, 0.95, 0.96, 0.92, 0.87, 0.85, 0.85, 0.77, 0.52, 0.34, 0.29, 0.29, 0.26, 0.24, 0.28, 0.26, 0.26, 0.62, 0.72, 0.72, 0.68, 0.69, 0.72, 0.71, 0.71, 0.66, 0.52, 0.45, 0.35, 0.26, 0.19, 0.09, 0.1, 0.12, 0.1, 0.08, 0.07]}}
```

## 5. `repita` (bloco próprio do modelo): 16.26–19.28 s
Fala: “repete comigo: Comfortable? Vegetable? Chocolate?”

```json
{"texto": "Agora repete comigo", "em": 16.04, "itens": [{"texto": "comfortable", "em": 17.54}, {"texto": "vegetable", "em": 18.28}, {"texto": "chocolate", "em": 18.78}]}
```

## 6. `cta` (bloco universal): 19.28–21.12 s
Fala: “Salva e treina hoje.”

```json
{"texto": "Salva e treina hoje.", "icone": "salvar", "em": 19.33, "destaque": "treina hoje."}
```
