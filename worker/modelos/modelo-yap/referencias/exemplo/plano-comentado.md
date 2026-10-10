# Exemplo do modelo yap: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.02 s
Fala: “Três coisas que eu parei de comprar e economizei mais de”

```json
{"texto": "Três coisas que parei de comprar", "destaque": "parei de comprar", "em": 0.07}
```

## 2. `numero` (bloco universal): 3.02–4.63 s
Fala: “500 reais por mês.”

```json
{"valor": 500, "em": 3.18, "prefixo": "R$ ", "rotulo": "por mês", "rotuloEm": 4.12, "titulo": "economizei mais de"}
```

## 3. `insercao` (assinatura): 5.10–6.25 s
Fala: “"Café na rua todo”

```json
{"em": 5.12, "forma": "tela", "imagem": {"id": "cafe"}, "rotulo": "Café na rua", "etiqueta": "1"}
```

## 4. `insercao` (assinatura): 7.12–8.62 s
Fala: “prensa francesa e faço em”

```json
{"em": 7.24, "imagem": {"id": "prensa"}, "rotulo": "Prensa francesa", "lado": "esq"}
```

## 5. `destaque` (bloco universal): 8.62–9.93 s
Fala: “em casa em dois minutos.”

```json
{"texto": "Em casa", "em": 8.73, "detalhe": "em 2 minutos", "detalheEm": 9.18, "lado": "dir"}
```

## 6. `insercao` (assinatura): 10.88–12.55 s
Fala: “de streaming que eu nem abria”

```json
{"em": 10.96, "imagem": {"id": "streaming"}, "rotulo": "Streaming", "etiqueta": "2", "lado": "dir"}
```

## 7. `comparacao` (bloco universal): 12.60–14.48 s
Fala: “Eu tinha quatro e usava uma”

```json
{"modo": "antes-depois", "lados": [{"rotulo": "Tinha", "texto": "4", "em": 13.09}, {"rotulo": "Usava", "texto": "1", "em": 14.23}]}
```

## 8. `destaque` (bloco universal): 14.48–15.49 s
Fala: “Cancelei três.”

```json
{"texto": "Cancelei 3", "em": 14.53, "nivel": "alerta"}
```

## 9. `insercao` (assinatura): 16.05–18.30 s
Fala: “Comida por aplicativo no meio da semana.”

```json
{"em": 16.11, "imagem": {"id": "delivery"}, "rotulo": "Comida por aplicativo", "etiqueta": "3", "lado": "esq"}
```

## 10. `insercao` (assinatura): 18.55–20.77 s
Fala: “cozinho no domingo e congelo em potes.”

```json
{"em": 18.6, "imagem": {"id": "potes"}, "rotulo": "Congelo em potes", "rotuloEm": 19.62, "lado": "dir"}
```

## 11. `frase` (bloco universal): 20.83–24.59 s
Fala: “Não é sobre se privar, É sobre parar de pagar pelo que você nem percebe.”

```json
{"texto": "Não é sobre se privar. É sobre parar de pagar pelo que você nem percebe.", "risco": "se privar", "riscoEm": 21.64, "destaque": "nem percebe", "em": 20.83}
```

## 12. `pergunta` (bloco universal): 24.62–26.76 s
Fala: “Qual dessas você ainda paga?”

```json
{"texto": "Qual dessas você ainda paga?", "em": 24.67, "opcoes": [{"texto": "Café na rua", "em": 24.71, "imagem": "cafe"}, {"texto": "Streaming", "em": 25.06, "imagem": "streaming"}, {"texto": "Comida por aplicativo", "em": 25.33, "imagem": "delivery"}]}
```
