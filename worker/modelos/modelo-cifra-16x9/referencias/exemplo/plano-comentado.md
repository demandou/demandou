# Exemplo do modelo cifra na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. **A folha e o vídeo são do Cifra vertical**; o `plano.json` é o mesmo plano, já no quadro deitado (1920×1080, `zona` e `rosto` do 16:9), e vale sem mudar nenhum momento: os blocos e os campos são os mesmos. No deitado, cada momento fica assim:

- `abertura`, `cta`: a pessoa em tela cheia e o cartão de palco no peito, largo e baixo; na abertura, o numeral "4" numa coluna à esquerda e "acordes" com a linha de cifra ao lado dele.
- `acordes`: a moldura larga em cima, à direita; os quatro diagramas (2 × 2) no quadro à esquerda.
- `compasso`: a moldura estreita no canto de cima, à direita; o metrônomo na coluna ao lado dela; a linha de compassos no quadro à esquerda (os diagramas viajam da grade de `acordes` para os compassos).
- `batida`: a moldura no meio da altura, à direita; título, setas e cordas no quadro à esquerda.
- `cifra`: a moldura embaixo, à direita; a folha na estante no quadro à esquerda, com a semana em cima.

O exemplo tem 23,6 s e é denso como um corte vertical. No vídeo completo, a mesma linguagem entra com mais respiro: tela cheia com legenda entre as ideias e um bloco onde a fala pede apoio visual.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.42 s
Fala: “Com quatro acordes você toca centenas de músicas”

```json
{"apoio": "você toca centenas de músicas", "destaque": "centenas", "cifras": ["G", "D", "Em", "C"], "texto": "4 acordes"}
```

## 2. `acordes` (assinatura): 3.42–6.84 s
Fala: “Sol HÉ? Mi menor i dot.”

```json
{"acordes": [{"cifra": "G", "nome": "Sol", "forma": "320003", "dedos": "210003", "em": 3.79}, {"cifra": "D", "nome": "Ré", "forma": "xx0232", "dedos": "xx0132", "em": 4.68}, {"cifra": "Em", "nome": "Mi menor", "forma": "022000", "dedos": "023000", "em": 5.48}, {"cifra": "C", "nome": "Dó", "forma": "x32010", "dedos": "x32010", "em": 6.41}]}
```

## 3. `compasso` (assinatura): 6.84–12.20 s
Fala: “Treina a troca entre eles devagar, um por compasso. Quando ficar natural, acelera e coloca”

```json
{"legenda": true, "compassos": ["G", "D", "Em", "C"], "trocaEm": 7.2, "tocarEm": 9.01, "andamentos": [{"em": 8.14, "texto": "devagar", "periodo": 1.05}, {"em": 11.28, "texto": "acelera", "periodo": 0.5}]}
```

## 4. `batida` (assinatura): 12.20–18.25 s
Fala: “uma batida simples Baixo. baixo sim cima, Baixo.”

```json
{"titulo": "Batida simples", "setas": [{"dir": "baixo", "em": 13.92}, {"dir": "baixo", "em": 14.85}, {"dir": "cima", "em": 15.81}, {"dir": "cima", "em": 16.76}, {"dir": "baixo", "em": 17.75}]}
```

## 5. `cifra` (assinatura): 18.25–21.05 s
Fala: “Em uma semana você já acompanha as suas músicas favoritas”

```json
{"titulo": "Suas músicas favoritas", "tituloEm": 20.12, "tom": "G", "semana": {"em": 18.45, "rotulo": "1 semana de treino"}, "linhas": [[{"cifra": "G", "em": 18.89}, {"cifra": "D", "em": 19.4}], [{"cifra": "Em", "em": 19.99}, {"cifra": "C", "em": 20.38}]]}
```

## 6. `cta` (bloco universal): 21.05–23.56 s
Fala: “Me segue para mais aulas de violão.”

```json
{"texto": "Mais aulas de violão", "botao": "Seguir", "botaoEm": 21.58}
```
