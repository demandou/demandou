# Exemplo do modelo devocional: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–4.26 s
Fala: “Tem dias em que a gente acorda sem força nenhuma. E tudo bem.”

```json
{"em": 0.09, "texto": "Tem dias em que a gente acorda sem força nenhuma. E tudo bem.", "destaque": "tudo bem", "desenho": "amanhecer", "desenhoEm": 1.35}
```

## 2. `versiculo` (assinatura): 4.26–14.17 s
Fala: “Está escrito. Vinde a mim todos os que estais cansados e oprimidos, e eu vos aliviarei. Mateus, capítulo 11, versículo 28.”

```json
{"chamada": "Está escrito", "chamadaEm": 4.58, "em": 5.73, "texto": "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", "destaque": "aliviarei", "referencia": "Mateus 11:28", "referenciaPartes": [{"texto": "Mateus", "em": 11.28}, {"texto": "11", "em": 12.12}, {"texto": ":28", "em": 13.29}]}
```

## 3. `luz` (bloco próprio do modelo): 14.17–16.85 s
Fala: “Descansar também é fé.”

```json
{"em": 14.52, "texto": "Descansar também é fé.", "palavra": "fé", "palavraEm": 15.91}
```

## 4. `cta` (bloco universal): 16.85–19.90 s
Fala: “Manda esse vídeo pra alguém que precisa ouvir isso hoje.”

```json
{"em": 17.05, "texto": "Manda esse vídeo pra alguém que precisa ouvir isso hoje.", "destaque": "alguém"}
```
