# Exemplo do modelo torre na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Os quadros da folha são do vertical.** No quadro deitado (1920×1080) o mesmo plano fica assim, pela composição da aula 9: em cada momento, a pessoa na moldura da direita (x 1096 a 1824, y 96 a 880), com o rosto no meio, e o mundo 3D com o bloco no quadro da esquerda (o cabeçalho "Residencial Aurora", a coluna com o número grande, a torre, o mapa, a planta, a etiqueta), a legenda no terço de baixo. Os cinco momentos estão encostados, então o quadro fica aberto do começo ao fim; num vídeo completo, entre blocos separados por mais de ~1,6 s a pessoa volta à tela cheia. O `plano.json` é o mesmo do vertical, com o rosto em frações do quadro deitado.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–1.93 s (no 16:9, no meio do quadro da esquerda, e não por cima da cabeça)
Fala: “Se eu fosse um corretor de imóveis.”

```json
{"texto": "Se eu fosse um corretor de imóveis", "destaque": "corretor", "em": 0, "legenda": true}
```

## 2. `torre` (assinatura): 2.00–5.74 s
Fala: “Esse é o Residencial Aurora, dezoito andares subindo em Pinheiros.”

```json
{"valor": 18, "em": 3.46, "ateEm": 4.94, "rotulo": "andares", "rotuloEm": 3.86, "categoria": "Residencial", "categoriaEm": 2.28, "nome": "Aurora", "nomeEm": 2.88, "emblema": "sol", "local": "Pinheiros", "localEm": 4.94, "selo": "imóvel ilustrativo", "legenda": true}
```

## 3. `rota` (assinatura): 5.74–8.86 s
Fala: “Olha onde ele fica, a quatro minutos a pé do metrô,”

```json
{"em": 5.74, "pinoEm": 6.2, "tempo": {"valor": 4, "unidade": "min", "em": 7.02, "unidadeEm": 7.38}, "modo": "a pé", "modoEm": 8.06, "destino": {"texto": "do metrô", "em": 8.38, "rotulo": "Metrô", "icone": "metro"}, "ruas": ["R. Fradique Coutinho", "R. dos Pinheiros"], "legenda": true}
```

## 4. `planta` (assinatura): 8.86–14.67 s
Fala: “por dentro, setenta e dois metros quadrados, duas suítes e varanda gourmet.”

```json
{"em": 9.1, "rotulo": "por dentro", "forma": "apartamento", "area": {"valor": 72, "em": 9.847, "ateEm": 10.987, "unidade": "m²", "unidadeEm": 11.487}, "comodos": [{"texto": "Suíte", "comodo": "suite", "quantidade": 2, "em": 13.107}, {"texto": "Varanda gourmet", "comodo": "varanda", "em": 13.827}], "legenda": true}
```

## 5. `preco` (assinatura): 14.67–16.63 s
Fala: “E o preço, a partir de um milhão e cem.”

```json
{"valor": 1100000, "em": 14.847, "prefixo": "R$", "rotulo": "a partir de", "rotuloEm": 15.367, "partes": [{"valor": 1000000, "em": 15.907}, {"valor": 1100000, "em": 16.327}], "nota": "imóvel ilustrativo", "legenda": true}
```
