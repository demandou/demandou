# Exemplo do modelo extrato: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `conta` (assinatura): 0.00–3.13 s
Fala: “Aquele café de oito reais por dia parece nada.”

```json
{"quadro": "cheio", "legenda": true, "linhas": [{"tipo": "item", "em": 0.45, "texto": "Café", "icone": "xicara", "valor": 8, "valorEm": 0.94}, {"tipo": "nota", "em": 1.66, "texto": "1× por dia"}]}
```

## 2. `conta` (assinatura): 3.13–7.52 s
Fala: “Mas em 22 dias úteis são 176 reais por mês”

```json
{"linhas": [{"tipo": "vezes", "em": 3.16, "fator": "22", "texto": "Dias úteis", "fatorEm": 3.48}, {"tipo": "grade", "em": 3.26, "forma": "xicaras", "quantidade": 22, "colunas": 5, "rotulos": ["S", "T", "Q", "Q", "S"], "encheDe": 5.35, "encheAte": 6.25}, {"tipo": "total", "em": 5.02, "texto": "Por mês", "valor": 176, "passos": 22, "contaDe": 5.35, "contaAte": 6.25}]}
```

## 3. `conta` (assinatura): 7.52–10.13 s
Fala: “Em um ano, 2.112.”

```json
{"linhas": [{"tipo": "vezes", "em": 7.62, "fator": "12", "texto": "Meses"}, {"tipo": "grade", "em": 7.84, "forma": "degraus", "quantidade": 12, "rotulos": ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"], "encheDe": 8.51, "encheAte": 9.6}, {"tipo": "total", "em": 8.3, "texto": "Por ano", "valor": 2112, "passos": 12, "contaDe": 8.51, "contaAte": 9.6, "carimbo": {"texto": "Parece nada?", "em": 9.72}}]}
```

## 4. `conta` (assinatura): 10.13–13.64 s
Fala: “Não é pra cortar o café. é para saber para onde vai o seu dinheiro.”

```json
{"corte": {"riscaEm": 11.16}, "linhas": [{"tipo": "texto", "em": 10.23, "texto": "Não é pra cortar o café."}, {"tipo": "texto", "em": 11.46, "texto": "É pra saber pra onde vai o seu dinheiro.", "grifo": "saber"}]}
```

## 5. `fechamento` (bloco próprio do modelo): 13.64–17.88 s
Fala: “Anota seus gastos pequenos por uma semana e me conta o resultado.”

```json
{"linhas": [{"tipo": "texto", "em": 13.74, "texto": "Anota seus gastos pequenos"}, {"tipo": "campos", "em": 15.3, "ate": 15.85, "titulo": "Por 1 semana", "itens": ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]}, {"tipo": "texto", "em": 15.9, "texto": "E me conta o resultado.", "icone": "balao"}]}
```
