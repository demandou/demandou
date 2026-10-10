# Exemplo do modelo versus: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `versus` (assinatura): 0.00–2.22 s
Fala: “É fryer ou forno elétrico?”

```json
{"titulo": "Airfryer ou forno elétrico?", "tituloEm": 0.07, "lados": [{"nome": "Airfryer", "em": 0.12, "imagem": {"id": "airfryer"}}, {"nome": "Forno elétrico", "em": 0.76, "imagem": {"id": "forno"}}]}
```

## 2. `rodada` (assinatura): 2.22–8.09 s
Fala: “Tempo. A air fryer esquenta em 2, 3 minutos O forno leva uns 10 Ponto para Airfryer”

```json
{"titulo": "Tempo", "icone": "tempo", "em": 2.22, "a": {"texto": "2 a 3 min", "em": 4.13, "forca": 0.92}, "b": {"texto": "10 min", "em": 6.48, "forca": 0.38}, "vencedor": 0, "vencedorEm": 7.53}
```

## 3. `rodada` (assinatura): 8.09–11.87 s
Fala: “Espaço No forno cabe uma lasanha inteira Ponto para o forno.”

```json
{"titulo": "Espaço", "icone": "espaco", "em": 8.09, "a": {"texto": "cesto pequeno", "em": 10.17, "forca": 0.3}, "b": {"texto": "lasanha inteira", "em": 9.87, "forca": 0.92}, "imagem": {"id": "lasanha"}, "imagemEm": 9.87, "imagemLado": 1, "vencedor": 1, "vencedorEm": 11.49}
```

## 4. `veredito` (assinatura): 11.87–15.80 s
Fala: “Mora sozinho ou há dois? Air Fryer Família grande. Forno.”

```json
{"placarEm": 11.91, "perfis": [{"texto": "Mora sozinho ou a dois", "em": 12.06, "lado": 0, "ladoEm": 13.46}, {"texto": "Família grande", "em": 14.1, "lado": 1, "ladoEm": 14.3}], "legenda": true}
```
