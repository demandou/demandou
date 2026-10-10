# Exemplo do modelo planta: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `titulo` (bloco próprio do modelo): 0.00–3.50 s
Fala: “o erro que deixa qualquer sala parecendo menor.”

```json
{"rotulo": "Layout de sala", "linhas": ["O erro que deixa", "qualquer sala", "parecendo menor"], "enfase": "menor", "cota": {"texto": "sala", "em": 3.07, "efeito": "encolhe"}}
```

## 2. `planta` (assinatura): 3.50–9.49 s
Fala: “móvel e encostado em todas as paredes Parece que ganha espaço, mas trava a circulação.”

```json
{"legenda": true, "escala": "1:50", "titulo": "Móvel encostado em todas as paredes", "ambiente": {"largura": 480, "profundidade": 360, "portas": [{"parede": "baixo", "pos": 30, "largura": 80}], "janelas": [{"parede": "cima", "pos": 150, "largura": 180}]}, "objetos": [{"tipo": "sofa", "em": 3.63, "x": 135, "y": 0, "frente": "baixo", "rotulo": "sofá"}, {"tipo": "poltrona", "em": 3.97, "x": 0, "y": 110, "frente": "direita"}, {"tipo": "estante", "em": 5, "x": 445, "y": 90, "w": 35, "h": 160, "frente": "esquerda"}, {"tipo": "rack", "em": 5.55, "x": 150, "y": 315, "w": 180, "h": 45, "frente": "cima"}], "areas": [{"em": 6.75, "x": 110, "y": 120, "w": 300, "h": 170, "texto": "espaço"}], "circulacao": {"em": 8.19, "pontos": [[70, 350], [70, 250], [240, 250], [240, 102]], "bloqueada": true, "dur": 1}}
```

## 3. `medida` (bloco próprio do modelo): 10.40–14.28 s
Fala: “Primeiro, Afasta o sofá uns 20 centímetros da parede”

```json
{"numero": "01", "rotulo": "Afaste o sofá da parede", "valor": 20, "unidade": "cm", "em": 11.46, "emFim": 12.72, "desde": "parede", "objeto": "sofa", "mover": true}
```

## 4. `planta` (assinatura): 14.28–19.47 s
Fala: “Segundo, Tapete grande, que pegue pelo menos os pés da frente dos móveis.”

```json
{"layout": "cheia", "numero": "02", "titulo": "Tapete grande", "subtitulo": "pelo menos os pés da frente", "escala": "1:50", "ambiente": {"largura": 480, "profundidade": 360, "portas": [{"parede": "baixo", "pos": 30, "largura": 80}], "janelas": [{"parede": "cima", "pos": 150, "largura": 180}]}, "paredesEm": 14.43, "objetos": [{"tipo": "tapete", "em": 15.25, "x": 175, "y": 130, "w": 130, "h": 95, "muda": {"em": 15.71, "x": 95, "y": 75, "w": 290, "h": 225, "dur": 0.9}}, {"tipo": "sofa", "em": 14.68, "x": 135, "y": 20, "frente": "baixo", "rotulo": "sofá", "pes": 17.89, "cota": {"lado": "cima", "em": 14.83}}, {"tipo": "mesaCentro", "em": 14.83, "x": 190, "y": 165, "w": 100, "h": 55}, {"tipo": "poltrona", "em": 14.93, "x": 125, "y": 255, "frente": "cima", "pes": 17.89}, {"tipo": "poltrona", "em": 15.03, "x": 275, "y": 255, "frente": "cima", "pes": 17.89}, {"tipo": "estante", "em": 15.13, "x": …
```

## 5. `planta` (assinatura): 19.47–22.21 s
Fala: “Terceiro. Cortina do teto até o chão.”

```json
{"layout": "lateral", "vista": "elevacao", "numero": "03", "titulo": "Cortina", "subtitulo": "do teto até o chão", "ambiente": {"largura": 125, "altura": 270}, "objetos": [{"tipo": "janela", "em": 19.87, "x": 48, "y": 90, "w": 72, "h": 140}, {"tipo": "cortina", "em": 20.15, "x": 10, "y": 80, "w": 50, "h": 160, "tetoEm": 20.51, "chaoEm": 21.38, "cota": {"lado": "esquerda", "numero": false}}], "niveis": [{"em": 20.57, "y": 270, "texto": "teto"}, {"em": 21.41, "y": 0, "texto": "chão"}]}
```

## 6. `antesDepois` (bloco próprio do modelo): 22.21–26.20 s
Fala: “Três ajustes, zero reforma e a sala parece outra.”

```json
{"layout": "cheia", "legenda": true, "ambiente": {"largura": 480, "profundidade": 360, "portas": [{"parede": "baixo", "pos": 30, "largura": 80}], "janelas": [{"parede": "cima", "pos": 150, "largura": 180}]}, "antes": {"rotulo": "Antes", "objetos": [{"tipo": "sofa", "em": 22.26, "x": 135, "y": 0, "frente": "baixo", "rotulo": "sofá"}, {"tipo": "poltrona", "em": 22.29, "x": 0, "y": 110, "frente": "direita"}, {"tipo": "estante", "em": 22.32, "x": 445, "y": 90, "w": 35, "h": 160, "frente": "esquerda"}, {"tipo": "rack", "em": 22.35, "x": 150, "y": 315, "w": 180, "h": 45, "frente": "cima"}], "circulacao": {"em": 22.36, "pontos": [[70, 350], [70, 250], [240, 250], [240, 102]], "bloqueada": true, "dur": 0.5}}, "depois": {"rotulo": "Depois", "em": 22.54, "objetos": [{"tipo": "tapete", "em": 22.81, "x": 95, "y": 75, "w": 290, "h": 225, "marca": {"n": 2, "em": 22.86, "lado": "baixo"}}, {"tipo": "sof …
```

## 7. `cta` (bloco universal): 26.18–29.20 s
Fala: “Me segue para mais projetos sem quebra-quebra.”

```json
{"texto": "Siga para mais projetos", "detalhe": "sem quebra-quebra", "icone": "seguir"}
```
