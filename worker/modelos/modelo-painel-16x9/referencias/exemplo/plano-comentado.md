# Exemplo do modelo painel: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. A folha é a do Painel vertical: o plano é o mesmo e, no quadro deitado (16:9), muda só a diagramação. Os momentos de painel (`grafico`, `divisao`, `destaque` com `eixo`) mandam a pessoa para a moldura da direita e o painel ocupa o lado esquerdo; os de tela cheia (`gancho`, `comparacao`, `cta`) entram como cartão na coluna livre ao lado da pessoa, e o vídeo desliza um pouco para o outro lado quando ela está no meio da gravação.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `gancho` (bloco próprio do modelo): 0.00–3.27 s
Fala: “R$ 500,00 por mês podem virar R$ 100,00”

```json
{"rotulo": "Planejamento financeiro", "linhas": [{"em": 0.34, "texto": "R$ 500 por mês"}, {"em": 1.96, "texto": "podem virar"}], "numero": {"em": 2.37, "de": 500, "para": 100000, "prefixo": "R$ "}}
```

## 2. `grafico` (assinatura): 3.27–8.74 s
Fala: “Investindo a 10% ao ano, em 10 anos você coloca 60 mil do seu bolso.”

```json
{"legenda": true, "forma": "linha", "tendencia": "sobe", "tendenciaEm": 6.45, "ilustrativo": true, "rotulo": "Juros compostos", "ficha": [{"em": 3.65, "rotulo": "Aporte", "valor": "R$ 500/mês"}, {"em": 4.21, "rotulo": "Taxa", "valor": "10% a.a."}, {"em": 5.67, "rotulo": "Prazo", "valor": "10 anos"}], "nota": "Simulação ilustrativa", "eixo": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], "eixoNome": "anos", "prefixo": "R$ ", "series": [{"nome": "Seu dinheiro", "valores": [0, 6000, 12000, 18000, 24000, 30000, 36000, 42000, 48000, 54000, 60000]}, {"nome": "Juros", "valores": [0, 270, 1168, 2755, 5100, 8281, 12379, 17487, 23706, 31147, 39932]}], "desenho": {"de": 4.05, "ate": 6.45}, "total": "saldo no ano {x}", "itens": [{"em": 7.39, "texto": "do seu bolso", "serie": 0}]}
```

## 3. `divisao` (assinatura): 8.74–11.63 s
Fala: “Os outros 40 mil vêm dos juros sobre juros”

```json
{"legenda": true, "rotulo": "De onde vem o saldo", "prefixo": "R$ ", "total": "total em 10 anos", "itens": [{"em": 8.81, "valor": 60000, "texto": "do seu bolso"}, {"em": 9.35, "valor": 39932, "texto": "juros sobre juros"}], "fatias": [270, 898, 1587, 2345, 3181, 4098, 5108, 6219, 7441, 8785], "grifoEm": 10.47, "nota": "Simulação ilustrativa"}
```

## 4. `destaque` (bloco universal): 11.63–16.75 s
Fala: “E o detalhe? Mais da metade desses juros aparece só nos últimos três anos,”

```json
{"legenda": true, "texto": "nos últimos 3 anos", "em": 15.26, "rotulo": "Juros ganhos em cada ano", "nota": "Simulação ilustrativa", "prefixo": "R$ ", "eixo": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], "valores": [270, 898, 1587, 2345, 3181, 4098, 5108, 6219, 7441, 8785], "faixa": {"de": 7, "ate": 9}, "numero": {"em": 13.01, "de": 0, "para": 56, "sufixo": "%", "texto": "dos juros"}}
```

## 5. `comparacao` (bloco universal): 16.75–20.95 s
Fala: “Quem começa cedo ganha. Quem para no meio perde a melhor parte.”

```json
{"lados": [{"rotulo": "Começa cedo", "texto": "ganha", "em": 16.88, "vereditoEm": 17.85}, {"rotulo": "Para no meio", "texto": "perde a melhor parte", "em": 18.63, "vereditoEm": 19.72}], "vencedor": 0}
```

## 6. `cta` (bloco universal): 20.95–23.40 s
Fala: “Me segue para fazer a conta com o seu valor.”

```json
{"texto": "Me segue", "apoio": "pra fazer a conta com o seu valor", "icone": "seguir", "campo": {"em": 21.87, "rotulo": "Seu aporte", "valores": ["R$ 1.000"]}}
```
