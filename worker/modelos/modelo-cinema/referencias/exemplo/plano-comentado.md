# Exemplo do modelo cinema: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `letreiro` (assinatura): 0.00–2.83 s
Fala: “Todo dia, às seis da tarde,”

```json
{"rotulo": "Todo dia", "rotuloEm": -0.6, "titulo": "18:00", "tituloEm": 0.32, "contarDe": "17:52", "desenho": {"tipo": "sol", "em": -1.2}, "cabeca": "Todo dia · 18:00", "nivel": 3, "pousaEm": 2.21}
```

## 2. `letreiro` (assinatura): 2.86–7.45 s
Fala: “um senhor sentava no mesmo banco da praça com duas xícaras de café.”

```json
{"nivel": 2, "rotulo": "Um senhor", "rotuloEm": 2.91, "titulo": "O mesmo banco", "tituloEm": 4.07, "desenho": {"tipo": "banco", "em": 3.2, "passos": [{"em": 4.47}, {"em": 6.18}]}}
```

## 3. `cartela` (assinatura): 7.53–11.18 s
Fala: “bebia uma a outra esfriava”

```json
{"desenho": {"tipo": "xicaras", "em": 7.83, "passos": [{"em": 8.98}, {"em": 9.93}]}, "linhas": [{"em": 8.1, "texto": "Bebia uma."}, {"em": 9.44, "texto": "A outra esfriava."}], "cabeca": "Duas xícaras"}
```

## 4. `frase` (bloco universal): 11.30–14.87 s
Fala: “Durante anos, ninguém perguntou nada.”

```json
{"linhas": ["Durante anos,", "ninguém", "perguntou nada."], "enfase": "ninguém", "texto": "Durante anos, ninguém perguntou nada.", "destaque": "ninguém"}
```

## 5. `frase` (bloco universal): 14.91–18.45 s
Fala: “Até que uma menina sentou do lado e pegou a xícara.”

```json
{"texto": "Até que uma menina sentou do lado e pegou a xícara.", "destaque": "pegou a xícara."}
```

## 6. `fala` (bloco próprio do modelo): 22.91–25.93 s
Fala: “Minha esposa sentava aí, ele disse.”

```json
{"texto": "Minha esposa sentava aí", "quem": "ele disse", "quemEm": 24.77}
```

## 7. `frase` (bloco universal): 26.02–29.38 s
Fala: “Faz 10 anos que eu espero alguém tomar esse café.”

```json
{"linhas": ["Faz dez anos", "que eu espero alguém", "tomar esse café."], "enfase": "esse café.", "texto": "Faz dez anos que eu espero alguém tomar esse café.", "destaque": "esse café."}
```

## 8. `creditos` (bloco próprio do modelo): 29.92–32.12 s
Fala: “Segue para mais histórias como essa.”

```json
{"texto": "Segue pra mais histórias como essa.", "icone": "seguir", "nivel": 2}
```
