# Exemplo do modelo reacao: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `comentario` (assinatura): 0.33–4.18 s
Fala: “Respondendo Marcos A IA vai acabar com o editor de vídeo.”

```json
{"autor": "marcos", "texto": "A IA vai acabar com o editor de vídeo?", "em": 1.85, "legenda": false}
```

## 2. `foto` (bloco próprio do modelo): 4.27–6.40 s
Fala: “Olha, quando a câmera digital chegou,”

```json
{"imagem": {"id": "camera", "efeito": "aproximar"}, "rotulo": "Câmera digital", "rotuloEm": 5.2}
```

## 3. `print` (assinatura): 6.40–9.05 s
Fala: “falaram que o fotógrafo ia acabar Não acabou.”

```json
{"forma": "manchete", "fonte": "Manchete", "texto": "Câmera digital: o fotógrafo vai acabar?", "grifos": [{"trecho": "fotógrafo vai acabar", "em": 7.15}], "risco": {"trecho": "vai acabar?", "em": 8.49}, "legenda": true}
```

## 4. `destaque` (bloco universal): 9.05–12.02 s
Fala: “com a IA é igual. Quem sabe pedir o que quer entrega”

```json
{"texto": "Com a IA é igual", "em": 9.06, "nivel": "chave", "detalhe": "Quem sabe pedir o que quer", "detalheEm": 10.28}
```

## 5. `numero` (bloco universal): 12.02–13.33 s
Fala: “10 vezes mais.”

```json
{"valor": 10, "em": 12.17, "rotulo": "vezes mais", "rotuloEm": 12.62, "sufixo": "×", "legenda": true}
```

## 6. `cta` (bloco universal): 13.37–15.20 s
Fala: “Deixe a sua pergunta aqui embaixo.”

```json
{"texto": "Deixe a sua pergunta aqui embaixo", "icone": "comentar", "em": 13.37}
```
