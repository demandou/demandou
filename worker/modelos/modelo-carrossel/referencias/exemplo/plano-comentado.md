# Exemplo do modelo carrossel: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `capa` (bloco próprio do modelo): 0.00–3.21 s
Fala: “Três trocas simples para comer melhor sem passar fome.”

```json
{"titulo": "3 trocas simples", "subtitulo": "pra comer melhor sem passar fome"}
```

## 2. `troca` (assinatura): 3.21–7.71 s
Fala: “Troca o suco de caixinha pela fruta inteira tem fibra e mata a fome.”

```json
{"sai": {"texto": "Suco de caixinha", "desenho": "suco-caixinha", "em": 3.54}, "riscaEm": 4.53, "entra": {"texto": "Fruta inteira", "desenho": "fruta", "em": 4.92}, "vantagens": [{"em": 6.06, "texto": "tem fibra"}, {"em": 6.86, "texto": "mata a fome"}]}
```

## 3. `troca` (assinatura): 7.71–10.85 s
Fala: “Troca o biscoito recheado por iogurte natural com banana”

```json
{"sai": {"texto": "Biscoito recheado", "desenho": "biscoito", "em": 8.02}, "riscaEm": 9.06, "entra": {"texto": "Iogurte natural", "desenho": "iogurte", "em": 9.26, "extra": {"texto": "com banana", "desenho": "banana", "em": 10.24}}}
```

## 4. `troca` (assinatura): 10.85–13.72 s
Fala: “e troca o refrigerante por água com gás e limão”

```json
{"sai": {"texto": "Refrigerante", "desenho": "refrigerante", "em": 11.24}, "riscaEm": 12.11, "entra": {"texto": "Água com gás", "desenho": "agua", "em": 12.32, "extra": {"texto": "e limão", "desenho": "limao", "em": 13.21}}}
```

## 5. `frase` (bloco universal): 13.72–15.52 s
Fala: “Não precisa cortar tudo de uma vez”

```json
{"texto": "Não precisa cortar tudo de uma vez", "risca": "tudo de uma vez"}
```

## 6. `calendario` (bloco próprio do modelo): 15.52–18.21 s
Fala: “Uma troca por semana já muda o mês inteiro.”

```json
{"titulo": "1 troca por semana", "destaque": "1 troca", "linhas": [{"em": 16.1, "rotulo": "Semana 1", "desenho": "fruta"}, {"em": 16.36, "rotulo": "Semana 2", "desenho": "iogurte"}, {"em": 16.62, "rotulo": "Semana 3", "desenho": "agua"}, {"em": 16.88, "rotulo": "Semana 4", "desenho": "mais"}], "fechamento": {"em": 16.96, "texto": "muda o mês inteiro"}}
```

## 7. `cta` (bloco universal): 18.21–20.52 s
Fala: “Me segue pra mais trocas assim.”

```json
{"texto": "Me segue", "detalhe": "pra mais trocas assim", "acao": "seguir", "toqueEm": 19.13}
```
