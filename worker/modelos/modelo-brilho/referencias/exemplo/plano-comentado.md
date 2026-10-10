# Exemplo do modelo brilho: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–4.59 s
Fala: “Três truques de maquiagem para parecer mais descansada em cinco minutos.”

```json
{"texto": "3 truques de maquiagem pra parecer mais descansada", "destaque": "descansada", "linhas": ["3 truques", "de maquiagem", "pra parecer mais", "descansada"], "pontos": [{"onde": "olheira", "em": 0.28, "lado": "esquerda"}, {"onde": "macaAlta", "em": 0.48}, {"onde": "cupido", "em": 0.68}], "tempo": {"valor": "5", "unidade": "min", "em": 3.5}}
```

## 2. `truque` (assinatura): 4.59–9.00 s
Fala: “Um. E aí corretivo em triângulo embaixo dos olhos, puxando para cima.”

```json
{"numero": 1, "rotulo": "Truque", "produto": "Corretivo", "cor": "corretivo", "produtoEm": 5.48, "dicas": [{"em": 5.9, "texto": "em triângulo embaixo dos olhos", "icone": "pincel"}, {"em": 7.97, "texto": "puxando pra cima", "icone": "cima"}], "marcas": [{"forma": "triangulo", "em": 6.04, "setaEm": 8.03, "rotulo": {"texto": "triângulo", "em": 6.43}, "altura": 0.175}]}
```

## 3. `truque` (assinatura): 9.00–14.30 s
Fala: “2. Blush um pouco mais alto, na direção da têmpora, levanta o rosto.”

```json
{"layout": "lado", "numero": 2, "rotulo": "Truque", "produto": "Blush", "cor": "blush", "produtoEm": 9.92, "dicas": [{"em": 10.19, "texto": "um pouco mais alto", "icone": "cima", "liga": 0}, {"em": 11.71, "texto": "na direção da têmpora", "icone": "diagonal", "liga": 0}, {"em": 13.16, "texto": "levanta o rosto", "icone": "check"}], "marcas": [{"forma": "esfumado", "em": 10.13, "sobeEm": 10.93, "setaEm": 11.83, "levantaEm": 13.18}]}
```

## 4. `truque` (assinatura): 14.30–18.73 s
Fala: “Três. Iluminador só no ponto alto da maçã e no arco do cupido.”

```json
{"layout": "lado", "numero": 3, "rotulo": "Truque", "produto": "Iluminador", "cor": "iluminador", "produtoEm": 15.27, "dicas": [{"em": 15.82, "texto": "só no ponto alto da maçã", "icone": "brilho", "liga": 0}, {"em": 17.61, "texto": "e no arco do cupido", "icone": "brilho", "liga": 1}], "marcas": [{"forma": "brilho", "onde": "macaAlta", "em": 16.58}, {"forma": "brilho", "onde": "cupido", "em": 17.88}]}
```

## 5. `resultado` (bloco próprio do modelo): 18.73–21.56 s
Fala: “Pronto. E aí Cara de quem dormiu oito horas. Salva para”

```json
{"marcasEm": 18.83, "texto": ["Pronto,", "cara de quem dormiu"], "numero": {"valor": 8, "unidade": "horas", "em": 20.63, "emFim": 21.15, "icone": "lua"}}
```

## 6. `cta` (bloco universal): 21.56–23.04 s
Fala: “testar amanhã.”

```json
{"texto": "Salva pra testar amanhã", "icone": "salvar"}
```
