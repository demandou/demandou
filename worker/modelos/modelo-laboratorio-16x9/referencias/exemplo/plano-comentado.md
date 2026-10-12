# Exemplo do modelo laboratorio: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `titulo` (bloco próprio do modelo): 0.15–1.57 s
Fala: “Por que o céu é azul?”

```json
{"rotulo": "Experimento nº 07", "assunto": "Óptica", "linhas": ["Por que o céu", "é azul?"], "destaque": "azul?", "corDestaque": "azul", "sublinharEm": 1.3}
```

## 2. `espectro` (assinatura): 1.57–3.79 s
Fala: “A luz do Sol tem todas as cores”

```json
{"legenda": true, "rotulo": "Fig. 1 · Luz branca", "titulo": ["a luz do Sol"], "fonte": "Sol", "fonteEm": 2.0, "feixe": "luz branca", "feixeEm": 2.3, "abreEm": 2.62, "pontas": ["vermelho", "violeta"], "nota": {"texto": "todas as cores", "em": 2.62}}
```

## 3. `particulas` (assinatura): 3.79–8.04 s
Fala: “Quando ela entra na atmosfera, bate nas moléculas do ar e se espalha”

```json
{"legenda": true, "rotulo": "Fig. 2 · Atmosfera", "titulo": ["entra na", "atmosfera"], "entraEm": 4.33, "camadaEm": 4.85, "bateEm": 5.67, "particulas": "moléculas do ar", "particulasEm": 6.08, "espalhaEm": 7.36, "efeito": "se espalha", "cor": "azul"}
```

## 4. `ondas` (assinatura): 8.04–12.32 s
Fala: “A luz azul tem onda mais curta e se espalha muito mais que a vermelha”

```json
{"legenda": true, "rotulo": "Fig. 3 · Rayleigh", "titulo": ["onda mais", "curta"], "ondas": [{"rotulo": "luz azul", "cor": "azul", "ciclos": 5.5, "em": 8.28, "medida": "onda curta", "espalha": 1, "espalhaEm": 10.4}, {"rotulo": "luz vermelha", "cor": "vermelho", "ciclos": 2, "em": 9.3, "medida": "onda longa", "espalha": 0.18, "espalhaEm": 11.74}], "medirEm": 9.7, "nota": {"texto": "muito mais!", "em": 10.86, "cor": "azul"}}
```

## 5. `observador` (assinatura): 12.32–15.36 s
Fala: “Por isso, de qualquer lugar que você olhe, chega azul”

```json
{"legenda": true, "rotulo": "Fig. 4 · O céu daqui", "olharEm": 12.9, "direcoes": 5, "chegaEm": 14.67, "titulo": "chega azul", "cor": "azul"}
```

## 6. `trajeto` (assinatura): 15.36–19.16 s
Fala: “No pôr do sol, a luz atravessa mais ar e sobra o vermelho.”

```json
{"legenda": true, "rotulo": "Fig. 5 · Pôr do sol", "titulo": ["No pôr", "do sol"], "desceEm": 15.95, "atravessaEm": 16.75, "medida": "mais ar", "medidaEm": 17.35, "sobraEm": 18.14, "sobra": "sobra o vermelho", "horas": ["12h", "18h"], "curto": "pouco ar", "observador": "você"}
```

## 7. `cta` (bloco universal): 19.16–20.92 s
Fala: “Segue para mais ciência.”

```json
{"rotulo": "Próximo experimento", "texto": "Segue pra mais ciência", "destaque": "ciência", "icone": "seguir"}
```
