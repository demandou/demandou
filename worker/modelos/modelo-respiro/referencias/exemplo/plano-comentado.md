# Exemplo do modelo respiro: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–5.10 s
Fala: “Quando bater a ansiedade, tenta a respiração 478.”

```json
{"mao": "quando bater a ansiedade,", "texto": "tenta a respiração", "mapaEm": [3.46, 3.7, 4.5]}
```

## 2. `fase` (assinatura): 5.10–8.70 s
Fala: “inspira pelo nariz, contando até 4”

```json
{"fase": "inspira", "contagem": 4, "contaEm": 6.05, "chegaEm": 7.98, "nota": "inspira", "detalhe": "pelo nariz"}
```

## 3. `fase` (assinatura): 8.70–11.25 s
Fala: “segura o ar contando até 7”

```json
{"fase": "segura", "contagem": 7, "contaEm": 9.26, "chegaEm": 10.96, "nota": "segura", "detalhe": "o ar"}
```

## 4. `fase` (assinatura): 11.25–15.85 s
Fala: “7 Solta devagar pela boca, contando até oito”

```json
{"fase": "solta", "contagem": 8, "contaEm": 12.34, "chegaEm": 14.95, "nota": "solta", "detalhe": "devagar pela boca"}
```

## 5. `ciclos` (assinatura): 15.85–18.40 s
Fala: “repete quatro vezes”

```json
{"vezes": 4, "divideEm": 16.3, "nota": "repete", "detalhe": "4 vezes"}
```

## 6. `nota` (bloco próprio do modelo): 18.40–23.50 s
Fala: “Não substitui a terapia, mas ajuda o corpo a desacelerar na hora”

```json
{"mao": "não substitui a terapia,", "sublinhar": "a terapia", "sublinharEm": 19.6, "texto": "mas ajuda o corpo a desacelerar na hora", "grifo": "desacelerar", "grifoEm": 21.6, "ondaEm": 21.6}
```

## 7. `cta` (bloco universal): 23.50–25.32 s
Fala: “Salva para quando precisar.”

```json
{"texto": "salva pra quando precisar", "icone": "salvar", "iconeEm": 23.84, "assinaturaEm": 24.4}
```
