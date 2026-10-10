# Exemplo do modelo torre: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–1.93 s
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
