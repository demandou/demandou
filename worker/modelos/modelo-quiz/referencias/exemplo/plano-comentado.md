# Exemplo do modelo quiz: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–1.55 s
Fala: “Pouca gente acerta essa”

```json
{"em": 0.08, "texto": "Pouca gente acerta essa", "destaque": "acerta"}
```

## 2. `quiz` (assinatura): 1.55–12.72 s
Fala: “Qual é o maior órgão do corpo humano? A, fígado, B, cérebro. C, pele. D, intestino. Três… dois… um… É a pele!”

```json
{"em": 1.58, "texto": "Qual é o maior órgão do corpo humano?", "opcoes": [{"texto": "Fígado", "em": 3.82, "textoEm": 4.13, "imagem": {"id": "figado"}}, {"texto": "Cérebro", "em": 4.95, "textoEm": 5.4, "imagem": {"id": "cerebro"}}, {"texto": "Pele", "em": 6.23, "textoEm": 6.73, "imagem": {"id": "pele"}}, {"texto": "Intestino", "em": 7.33, "textoEm": 7.8, "imagem": {"id": "intestino"}}], "contagem": [{"numero": 3, "em": 8.76}, {"numero": 2, "em": 9.85}, {"numero": 1, "em": 11.09}], "certa": 2, "revelaEm": 12.22}
```

## 3. `fato` (bloco próprio do modelo): 12.72–15.15 s
Fala: “Ela cobre quase dois metros quadrados”

```json
{"em": 12.74, "texto": "Ela cobre quase 2 m²", "destaque": "2 m²", "destaqueEm": 13.62}
```

## 4. `cta` (bloco universal): 15.15–16.64 s
Fala: “Comenta se você acertou.”

```json
{"em": 15.21, "texto": "Comenta se você acertou", "icone": "comentar"}
```
