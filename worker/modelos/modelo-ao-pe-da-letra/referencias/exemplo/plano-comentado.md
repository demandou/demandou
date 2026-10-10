# Exemplo do modelo ao-pe-da-letra: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.62 s
Fala: “Se você traduzir e chutar o balde ao pé da letra,”

```json
{"em": 0.84, "rotulo": "expressões", "texto": "Chutar o balde ao pé da letra", "destaque": "ao pé da letra"}
```

## 2. `literal` (assinatura): 2.70–8.62 s
Fala: “kick the bucket, Só que em inglês isso é bater as botas, morrer. O certo Throw in the towel Jogar a toalha.”

```json
{"legenda": true, "expressao": "chutar o balde", "expressaoEm": 2.72, "ao": {"texto": "kick the bucket", "em": 2.85, "imagem": {"id": "balde"}}, "carimboEm": 3.73, "quer": [{"texto": "bater as botas", "em": 4.81, "detalhe": "morrer", "detalheEm": 5.66, "imagem": {"id": "botas"}}, {"texto": "throw in the towel", "em": 6.92, "rotulo": "o certo em inglês", "detalhe": "jogar a toalha", "detalheEm": 8.07, "certo": true, "imagem": {"id": "toalha"}}]}
```

## 3. `literal` (assinatura): 8.68–12.40 s
Fala: “E pagar mico, não é. Pay the monkey. E... Embarrassem-se.”

```json
{"legenda": true, "expressao": "pagar mico", "expressaoEm": 8.82, "ao": {"texto": "pay the monkey", "em": 9.8, "imagem": {"id": "mico"}}, "carimboEm": 11.01, "quer": [{"texto": "embarrass yourself", "em": 11.48, "certo": true, "imagem": {"id": "vergonha"}}]}
```

## 4. `frase` (bloco universal): 12.50–14.45 s
Fala: “Ao pé da letra, o inglês fica engraçado.”

```json
{"em": 12.5, "texto": "Ao pé da letra, o inglês fica engraçado.", "destaque": "engraçado."}
```

## 5. `cta` (bloco universal): 14.55–16.85 s
Fala: “Comenta uma expressão para eu traduzir.”

```json
{"em": 14.62, "texto": "Comenta uma expressão para eu traduzir.", "icone": "comentar", "destaque": "expressão"}
```
