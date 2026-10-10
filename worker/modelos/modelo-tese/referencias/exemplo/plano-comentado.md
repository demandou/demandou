# Exemplo do modelo tese: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–1.99 s
Fala: “Por que o céu é azul? A luz do”

```json
{"texto": "Por que o céu é azul?", "destaque": "azul?", "em": 0.32, "legenda": true}
```

## 2. `cena` (assinatura): 1.99–4.73 s
Fala: “Sol tem todas as cores Quando ela entra na”

```json
{"em": 1.99, "imagem": {"id": "prisma", "efeito": "aproximar"}}
```

## 3. `cena` (assinatura): 4.73–8.13 s
Fala: “atmosfera, bate nas moléculas do ar e se espalha A luz”

```json
{"em": 4.73, "imagem": {"id": "atmosfera", "efeito": "aproximar"}}
```

## 4. `comparacao` (bloco universal): 8.13–12.12 s
Fala: “azul tem onda mais curta e se espalha muito mais que a vermelha”

```json
{"modo": "contra", "lados": [{"rotulo": "luz azul", "texto": "onda curta, espalha muito", "em": 8.13}, {"rotulo": "luz vermelha", "texto": "onda longa, espalha pouco", "em": 11.56}], "vencedor": 0, "vencedorEm": 11.56}
```

## 5. `fechado` (assinatura): 12.12–14.80 s
Fala: “Por isso, de qualquer lugar que você olhe, chega”

```json
{}
```

## 6. `cena` (assinatura): 14.80–15.24 s
Fala: “azul”

```json
{"em": 14.8, "imagem": {"id": "horizonte", "efeito": "aproximar"}}
```
