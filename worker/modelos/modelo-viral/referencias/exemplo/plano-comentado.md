# Exemplo do modelo viral: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.08 s
Fala: “O mel é um dos poucos alimentos”

```json
{"texto": "O mel praticamente não estraga", "destaque": "não estraga", "em": 0}
```

## 2. `corte` (assinatura): 2.12–3.32 s
Fala: “que praticamente não”

```json
{"imagem": {"id": "escorrendo", "efeito": "aproximar"}}
```

## 3. `pop` (assinatura): 4.70–5.70 s
Fala: “potes de mel em”

```json
{"imagem": {"id": "potes"}}
```

## 4. `corte` (assinatura): 5.70–6.80 s
Fala: “tumbas do Egito com mais”

```json
{"imagem": {"id": "piramides", "efeito": "aproximar"}, "zoom": 1.4}
```

## 5. `numero` (bloco universal): 6.80–8.36 s
Fala: “mais de 3 mil anos”

```json
{"valor": 3000, "em": 7.34, "prefixo": "+", "rotulo": "anos", "rotuloEm": 7.9}
```

## 6. `destaque` (bloco universal): 8.36–9.44 s
Fala: “e ainda dava para comer.”

```json
{"texto": "ainda dava para comer", "em": 8.42, "nivel": "chave"}
```

## 7. `comparacao` (bloco universal): 9.47–13.03 s
Fala: “O segredo é simples: quase nenhuma água e muito açúcar.”

```json
{"titulo": "O segredo é simples", "modo": "contra", "lados": [{"rotulo": "Água", "texto": "quase nenhuma", "em": 10.82, "imagem": {"id": "agua"}}, {"rotulo": "Açúcar", "texto": "muito", "em": 12, "imagem": {"id": "acucar"}}]}
```

## 8. `corte` (assinatura): 13.05–14.22 s
Fala: “Bactéria nenhuma sobrevive”

```json
{"imagem": {"id": "bacteria", "efeito": "aproximar"}}
```

## 9. `pop` (assinatura): 15.42–16.30 s
Fala: “mel cristalizou,”

```json
{"imagem": {"id": "cristalizado"}}
```

## 10. `destaque` (bloco universal): 16.45–17.46 s
Fala: “não joga fora.”

```json
{"texto": "não joga fora", "em": 16.48, "nivel": "alerta"}
```

## 11. `pop` (assinatura): 17.50–18.85 s
Fala: “É só aquecer em banho-maria.”

```json
{"imagem": {"id": "banhomaria"}}
```

## 12. `cta` (bloco universal): 18.88–20.68 s
Fala: “Manda pra quem joga mel fora.”

```json
{"texto": "Manda pra quem joga mel fora", "destaque": "joga mel fora", "em": 18.95}
```
