# Exemplo do modelo figurinha na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. **A folha foi feita no vertical (1080×1920)**: os blocos, os textos e os tempos são os mesmos na versão deitada, mas a composição muda pela aula 9 do curso. No quadro deitado (1920×1080) o `plano.json` deste exemplo é o mesmo, com o quadro, o vídeo e o rosto medidos em 1920×1080: a abertura e o fechamento são etiquetas no peito, no terço de baixo da tela cheia (o selo do número ao lado do título, as duas chamadas lado a lado); no álbum, a pessoa fica na figurinha especial da moldura da direita e, no quadro da esquerda, o cachorro espia por cima da figurinha da vez, grande e deitada, com a fileira embaixo; no especial, a figurinha da pessoa cresce para a esquerda e o conselho cola numa etiqueta ao lado dela. Este exemplo é um corte curto, coberto de ponta a ponta por blocos; no vídeo completo, entre as ideias a pessoa volta à tela cheia, com a legenda numa tira de papel embaixo (respiros de 2 a ~8 s).
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–4.34 s
Fala: “Três alimentos que parecem inofensivos e fazem mal para o seu cachorro”

```json
{"texto": "3 alimentos que parecem inofensivos e fazem mal pro seu cachorro", "destaque": "fazem mal", "caoEm": 3.74}
```

## 2. `album` (assinatura): 4.34–14.15 s
Fala: “Chocolate tem teobromina, que é tóxica para ele. uva e uva passa. podem causar problema nos rins Cebola e alho danificam as células do sangue.”

```json
{"carimbo": "nao", "itens": [{"em": 4.39, "nome": "Chocolate", "desenho": "chocolate", "motivo": "Tem teobromina, tóxica pra ele", "destaque": "tóxica", "carimboEm": 6.93}, {"em": 7.8, "nome": "Uva e uva-passa", "desenho": "uva", "motivo": "Podem causar problema nos rins", "destaque": "rins", "carimboEm": 10.71}, {"em": 11.07, "nome": "Cebola e alho", "desenho": "cebola-alho", "motivo": "Danificam as células do sangue", "destaque": "células do sangue", "carimboEm": 13.63}]}
```

## 3. `especial` (bloco próprio do modelo): 14.15–16.15 s
Fala: “Se ele comer, procure um veterinário”

```json
{"apoio": "Se ele comer,", "texto": "procure um veterinário", "destaque": "veterinário"}
```

## 4. `cta` (bloco universal): 16.15–18.28 s
Fala: “Salva e manda pra quem tem cachorro.”

```json
{"texto": "Salva", "icone": "salvar", "em": 16.18, "segunda": {"em": 16.36, "texto": "Manda pra quem tem cachorro", "icone": "enviar"}}
```
