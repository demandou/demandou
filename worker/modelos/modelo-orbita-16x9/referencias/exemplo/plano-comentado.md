# Exemplo do modelo orbita na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. O exemplo foi gravado e editado no vertical; o `plano.json` desta pasta é o mesmo plano, com as posições da gravação (rosto, rastro, mãos e zona) passadas para o quadro deitado (1920×1080). Os momentos e os tempos não mudam: no 16:9, a virada fica numa coluna ao lado da cabeça, o raio atravessa o quadro deitado até o rosto e, na órbita e no céu, a cena fica no quadro da esquerda com a pessoa na moldura da direita (a legenda vai para o peito dela, dentro da moldura).
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `virada` (bloco próprio do modelo): 0.00–2.30 s
Fala: “E se eu fosse professor de ciências? A luz”

```json
{"legenda": true, "texto": "E se eu fosse", "em": 0.007, "nome": "professor", "nomeEm": 0.587, "complemento": "de ciências", "complementoEm": 1.027, "icone": "orbita", "trocaEm": 1.8333, "video": "virada.mp4"}
```

## 2. `raio` (bloco próprio do modelo): 1.96–4.49 s
Fala: “A luz do sol que tá batendo em você agora,”

```json
{"legenda": true, "em": 2.1, "fonteEm": 2.6, "bateEm": 3.26}
```

## 3. `orbita` (assinatura): 4.49–11.54 s
Fala: “saiu de lá há oito minutos atrás. E se ela apagasse agora, você ainda ia ver ele brilhando por oito minutos.”

```json
{"legenda": true, "camera": "recuo", "origem": {"corpo": "sol"}, "destino": {"corpo": "terra"}, "distancia": {"texto": "150 milhões de km", "em": 5.24}, "viagem": {"em": 4.74, "chegaEm": 6.08, "rotulo": "Tempo da luz", "valor": 500, "unidade": "s"}, "evento": {"efeito": "apaga", "em": 7.52, "gesto": "maos-descem", "gestoEm": 7.833, "rotulo": "Sol apagado há", "chegaEm": 11.08}, "aviso": {"texto": "Terra", "detalhe": "ainda iluminada", "em": 9.02}}
```

## 4. `ceu` (assinatura): 11.54–14.43 s
Fala: “Ou seja, olhar pro céu é olhar pro passado.”

```json
{"legenda": true, "itens": [{"corpo": "lua", "nome": "Lua", "valor": "1,3 s", "em": 12.347}, {"corpo": "sol", "nome": "Sol", "valor": "8 min 20 s", "em": 12.947}, {"corpo": "estrela", "nome": "Sirius", "valor": "8,6 anos", "em": 13.467}], "grifoEm": 13.847}
```
