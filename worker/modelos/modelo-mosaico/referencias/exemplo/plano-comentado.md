# Exemplo do modelo mosaico: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.11–3.57 s
Fala: “Montar um prato equilibrado é mais simples do que parece.”

```json
{"grade": "capa", "area": "t", "cor": "folha", "texto": "Montar um prato equilibrado", "quebra": ["Montar um prato", "equilibrado"], "blocos": [{"tipo": "prato", "id": "prato", "area": "a", "talheresEm": 2.23, "partes": [{"fracao": 0.5, "cor": "folha", "em": 3.6, "rotulo": "vegetais"}, {"fracao": 0.25, "cor": "tomate", "em": 6.62, "rotulo": "proteína"}, {"fracao": 0.25, "cor": "gema", "em": 11.67, "rotulo": "carboidrato"}], "azeite": {"em": 16.7}, "rotulosEm": 18.94, "cor": "creme"}, {"tipo": "titulo", "area": "b", "cor": "gema", "enfase": "simples", "quebra": ["é mais", "simples", "do que", "parece."]}]}
```

## 2. `grupo` (assinatura): 3.58–6.58 s
Fala: “metade do prato, vegetais e legumes,”

```json
{"grade": "metade", "area": "a", "cor": "folha", "fracao": "1/2", "titulo": "Vegetais e legumes", "itens": [{"em": 4.98, "icone": "brocolis"}, {"em": 5.26, "icone": "cenoura"}, {"em": 5.77, "icone": "folha"}, {"em": 6.04, "icone": "tomate"}], "blocos": [{"id": "prato", "area": "b"}]}
```

## 3. `grupo` (assinatura): 6.58–11.60 s
Fala: “1/4 proteína, como frango, peixe, ovo ou feijão,”

```json
{"grade": "L", "area": "b", "cor": "tomate", "fracao": "1/4", "titulo": "Proteína", "itens": [{"em": 8.87, "icone": "frango", "texto": "frango"}, {"em": 9.51, "icone": "peixe", "texto": "peixe"}, {"em": 10.23, "icone": "ovo", "texto": "ovo"}, {"em": 10.8, "icone": "feijao", "texto": "feijão"}], "blocos": [{"id": "prato", "area": "a"}]}
```

## 4. `grupo` (assinatura): 11.60–16.44 s
Fala: “O outro quarto, carboidrato como arroz, batata ou mandioca”

```json
{"grade": "destaque", "area": "a", "cor": "gema", "fracao": "1/4", "titulo": "Carboidrato", "itens": [{"em": 14.35, "icone": "arroz", "texto": "arroz"}, {"em": 14.83, "icone": "batata", "texto": "batata"}, {"em": 15.63, "icone": "mandioca", "texto": "mandioca"}], "blocos": [{"id": "prato", "area": "b"}]}
```

## 5. `selo` (bloco próprio do modelo): 16.44–17.70 s
Fala: “e um fio de azeite.”

```json
{"grade": ["aa", "bp"], "linhas": [1.3, 1], "area": "b", "cor": "gema", "icone": "azeite", "titulo": "Um fio de azeite", "blocos": [{"id": "prato", "area": "a"}]}
```

## 6. `selo` (bloco próprio do modelo): 17.70–22.03 s
Fala: “Esse é o método do prato, usado em várias diretrizes de alimentação”

```json
{"grade": ["sp", "kk"], "linhas": [600, 1240], "area": "s", "cor": "folha", "icone": "documento", "titulo": "Método do prato", "texto": "usado em várias diretrizes de alimentação", "blocos": [{"id": "prato", "area": "k"}]}
```

## 7. `frase` (bloco universal): 22.03–24.18 s
Fala: “Não é dieta da moda, é base.”

```json
{"grade": ["pf", "kf"], "linhas": [1.1, 1], "area": "f", "cor": "tinta", "texto": "Não é dieta da moda, é base.", "risco": "dieta da moda", "destaque": "base", "quebra": ["Não é", "dieta", "da moda,", "é base."], "blocos": [{"id": "prato", "area": "k"}]}
```

## 8. `cta` (bloco universal): 24.18–27.04 s
Fala: “Salva e usa no seu próximo almoço.”

```json
{"grade": ["pp", "ak"], "linhas": [1.25, 1], "colunas": [2, 1], "area": "a", "cor": "gema", "icone": "salvar", "texto": "Salva e usa no seu próximo almoço.", "em": 24.25, "quebra": ["Salva e usa", "no seu próximo", "almoço."], "blocos": [{"id": "prato", "area": "k"}]}
```
