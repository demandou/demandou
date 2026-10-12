# Exemplo do modelo impacto: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `gancho` (bloco próprio do modelo): 0.00–3.00 s
Fala: “Você não precisa de uma hora de academia.”

```json
{"itens": [{"em": 0.31, "texto": "Você não"}, {"em": 0.74, "texto": "precisa de"}, {"em": 1.45, "texto": "1 hora de", "destaque": true}, {"em": 2.17, "texto": "academia"}]}
```

## 2. `numero` (bloco universal): 3.00–5.50 s
Fala: “precisa de 20 minutos bem feitos.”

```json
{"valor": 20, "em": 3.62, "rotulo": "min", "complemento": {"em": 4.54, "texto": "bem feitos"}}
```

## 3. `circuito` (assinatura): 6.60–16.16 s
Fala: “4 exercícios, 40 segundos cada, 20 de descanso. agachamento, flexão, Prensha Polichinelo. Repete quatro voltas e acabou.”

```json
{"rotulo": "Treino de 20 min", "titulo": {"em": 6.69, "texto": "4 exercícios"}, "intervalo": {"trabalho": 40, "descanso": 20, "em": 7.94, "descansoEm": 9.07}, "itens": [{"em": 10.62, "texto": "Agachamento"}, {"em": 11.7, "texto": "Flexão"}, {"em": 12.68, "texto": "Prancha"}, {"em": 13.53, "texto": "Polichinelo"}], "voltas": {"em": 14.54, "valor": "4", "texto": "voltas"}, "fimEm": 15.64}
```

## 4. `virada` (assinatura): 16.16–21.32 s
Fala: “O segredo não é o treino perfeito. É o treino que você consegue repetir três vezes por semana.”

```json
{"rotulo": "O segredo", "nao": {"em": 16.61, "prefixo": "não é o", "linhas": ["treino", "perfeito"]}, "grifoEm": 18.32, "sim": [{"em": 18.37, "texto": "o treino"}, {"em": 18.67, "texto": "que você"}, {"em": 19.53, "texto": "repete", "destaque": true}], "selo": {"em": 20.06, "texto": "3x por semana"}}
```

## 5. `cta` (bloco universal): 21.32–24.24 s
Fala: “Manda esse vídeo para quem vive dizendo que não tem tempo.”

```json
{"texto": "Manda pra quem não tem tempo", "destaque": "tempo", "itens": [{"em": 21.42, "texto": "Manda"}, {"em": 21.92, "texto": "pra quem"}, {"em": 23.05, "texto": "não tem"}, {"em": 23.29, "texto": "tempo", "destaque": true}]}
```
