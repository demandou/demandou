# Exemplo do modelo visor: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.02 s
Fala: “Três ajustes para fotos melhores no celular.”

```json
{"texto": "3 ajustes pra fotos melhores no celular", "linhas": ["3 ajustes", "pra fotos melhores", "no celular"], "destaque": "3"}
```

## 2. `cena` (assinatura): 3.02–7.00 s
Fala: “Primeiro. Limpa a lente com a camiseta. Ela vive engordurada.”

```json
{"numero": 1, "numeroEm": 3.07, "titulo": "Limpa a lente", "detalhe": "com a camiseta", "acao": "limpar", "acaoEm": 3.86, "acaoAte": 5.5, "nota": {"texto": "vive engordurada", "em": 5.83, "icone": "digital"}}
```

## 3. `cena` (assinatura): 7.00–11.88 s
Fala: “Segundo, Liga a grade e coloca o assunto numa das linhas, não no centro.”

```json
{"numero": 2, "numeroEm": 7.06, "titulo": "Liga a grade", "detalhe": "assunto numa das linhas", "acao": "tercos", "gradeEm": 8.17, "acaoEm": 8.66, "acaoAte": 10.32, "marcaEm": 10.99, "nota": {"texto": "não no centro", "em": 10.99}}
```

## 4. `foco` (assinatura): 11.88–15.80 s
Fala: “Terceiro: Toca na tela para focar e arrasta para ajustar a luz.”

```json
{"numero": 3, "numeroEm": 11.93, "titulo": "Toca pra focar", "detalhe": "e arrasta pra ajustar a luz", "toqueEm": 12.56, "travaEm": 13.58, "luzEm": 14.16, "luzAte": 15.63, "ev": "+0,7"}
```

## 5. `comparar` (assinatura): 15.80–18.55 s
Fala: “Fotografa de novo a mesma cena e compara.”

```json
{"disparoEm": 16.2, "antesEm": 16.62, "compararEm": 17.85, "legenda": true}
```

## 6. `cta` (bloco universal): 18.55–20.44 s
Fala: “Me segue para mais dicas.”

```json
{"texto": "Me segue", "detalhe": "pra mais dicas", "botaoEm": 18.96, "acao": "seguir", "fotoEm": 19.5}
```
