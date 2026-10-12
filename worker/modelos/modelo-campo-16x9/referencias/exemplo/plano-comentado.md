# Exemplo do modelo campo: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `talhao` (assinatura): 0.00–2.32 s
Fala: “Produtor, olha isso. A”

```json
{"texto": "Produtor, olha isso.", "em": 0.27, "destaque": "olha isso.", "imagem": {"id": "estufas"}, "areas": [{"x": 0.086, "y": 0.1, "w": 0.195, "h": 0.185}, {"x": 0.296, "y": 0.1, "w": 0.2, "h": 0.185}, {"x": 0.523, "y": 0.1, "w": 0.181, "h": 0.185}, {"x": 0.721, "y": 0.1, "w": 0.187, "h": 0.185}, {"x": 0.086, "y": 0.301, "w": 0.195, "h": 0.188}, {"x": 0.296, "y": 0.301, "w": 0.2, "h": 0.188}, {"x": 0.084, "y": 0.511, "w": 0.195, "h": 0.187}, {"x": 0.293, "y": 0.511, "w": 0.203, "h": 0.187}, {"x": 0.084, "y": 0.714, "w": 0.195, "h": 0.19}, {"x": 0.292, "y": 0.714, "w": 0.202, "h": 0.19}], "contornoEm": 0.27, "marcar": [{"area": 5, "em": 1.45}]}
```

## 2. `cotacao` (bloco próprio do modelo): 2.32–5.62 s
Fala: “caixa do tomate subiu 30% no mês. Quem irrigou por”

```json
{"rotulo": "Caixa do tomate", "em": 2.33, "direcao": "sobe", "sobeEm": 3.12, "valor": 30, "valorEm": 3.6, "sufixo": "%", "periodo": "no mês", "periodoEm": 4.55, "imagem": {"id": "caixas"}}
```

## 3. `medidor` (bloco próprio do modelo): 5.62–7.88 s
Fala: “gotejamento gastou metade da água”

```json
{"titulo": "Gotejamento", "em": 5.67, "fracao": 0.5, "mudaEm": 6.37, "fracaoEm": 7.02, "texto": "Gastou metade da água", "imagem": {"id": "gotejamento"}, "textoEm": 6.37, "destaque": "metade"}
```

## 4. `grafico` (bloco universal): 7.88–9.30 s
Fala: “e colheu mais por hectare.”

```json
{"titulo": "Colheu mais por hectare", "forma": "barras", "tendencia": "sobe", "tendenciaEm": 8.03, "ilustrativo": true, "rotulos": ["Sem gotejamento", "Com gotejamento"]}
```

## 5. `previsao` (bloco próprio do modelo): 9.30–11.25 s
Fala: “E a chuva volta na semana que vem. Quer”

```json
{"texto": "A chuva volta na semana que vem", "em": 9.45, "destaque": "semana que vem", "agora": "sol", "chegada": "chuva", "chegaEm": 9.54, "quando": "semana que vem", "quandoEm": 10.29}
```

## 6. `cta` (bloco universal): 11.25–14.28 s
Fala: “a planilha de custo da estufa? Comenta tomate.”

```json
{"texto": "Comenta TOMATE", "destaque": "TOMATE", "icone": "comentar", "em": 12.95, "material": {"texto": "Planilha de custo da estufa", "em": 11.3, "linhas": ["Mudas", "Irrigação", "Adubo", "Mão de obra", "Total"]}}
```
