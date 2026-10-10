# Exemplo do modelo anatomia na versão deitada (16:9): como cada fala virou um efeito

A folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem, **na edição vertical** (a prancha em cima, a pessoa embaixo). O `plano.json` é o mesmo plano levado para o quadro deitado (1920×1080): os momentos, os tempos e os textos são os mesmos; mudam só as posições (o rosto no meio do quadro, a origem da ilustração no quadro de anatomia da parede). No quadro deitado, com a composição da aula 9:
- a `virada` acontece em tela cheia: "E se eu fosse / MÉDICO" fica ao lado da cabeça (não sobra altura acima dela) e a linha de luz troca a roupa;
- o `mito` entra no alto da tela, sobre uma faixa de papel; quando a `anatomia` abre, ele sobe para o alto da prancha;
- na `anatomia`, a pessoa vai para a moldura em pé da direita, com o rosto centralizado, e a prancha com o rosto em ilustração ocupa o quadro da esquerda; a legenda fica na faixa de baixo.

**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `virada` (bloco próprio do modelo): 0.00–1.75 s
Fala: “E se eu fosse médico? Botox”

```json
{"texto": "E se eu fosse", "nome": "MÉDICO", "em": 0, "nomeEm": 0.66, "trocaEm": 1.1333, "video": "virada/base.mp4", "videoDe": 0}
```

## 2. `mito` (bloco próprio do modelo): 1.04–5.90 s
Fala: “Botox não preenche ruga, ele relaxa o músculo que faz a ruga. Na testa,”

```json
{"sujeito": "Botox", "sujeitoEm": 1.24, "naoEm": 1.96, "errado": "preenche", "erradoEm": 2.16, "riscoEm": 2.6, "certo": "relaxa", "certoEm": 3.32, "complemento": "o músculo", "complementoEm": 3.94, "objeto": "seringa"}
```

## 3. `anatomia` (assinatura): 3.12–13.50 s
Fala: “ele relaxa o músculo que faz a ruga. Na testa, o frontal faz as linhas horizontais. Entre as sobrancelhas, o corrugador faz o famoso onze.”

```json
{"origem": {"x": 0.6235, "y": 0.2448, "tamanho": 0.0533}, "musculosEm": 3.94, "contraiEm": 5.107, "estruturas": [{"id": "frontal", "rotulo": "Frontal", "regiaoEm": 5.827, "em": 6.727, "funcao": "linhas horizontais", "funcaoEm": 7.767}, {"id": "corrugador", "rotulo": "Corrugador", "regiaoEm": 9.667, "em": 10.8, "funcao": "o famoso", "funcaoEm": 12.08, "grande": "11", "grandeEm": 12.66}]}
```
