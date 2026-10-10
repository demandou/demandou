# Exemplo do modelo etiqueta: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.05–0.98 s
Fala: “Tênis de corrida de”

```json
{"texto": "Tênis de corrida", "destaque": "corrida", "em": 0.1}
```

## 2. `etiqueta` (assinatura): 0.98–14.84 s
Fala: “200, 600 e 1.500 reais. O de 200 tem amortecimento básico O de 600 tem espuma mais leve, O de 1500 tem placa de carbono, Para quem está começando, o do meio é o melhor custo-benefício.”

```json
{"titulo": "Barato, médio ou caro?", "tituloEm": 1.0, "unidade": "R$", "degraus": [{"rotulo": "Barato", "preco": 200, "em": 0.99, "texto": "Amortecimento básico", "textoEm": 5.15, "imagem": {"id": "tenis1"}, "vale": 0.4, "valeEm": 6.01}, {"rotulo": "Médio", "preco": 600, "em": 1.77, "texto": "Espuma mais leve", "textoEm": 7.49, "imagem": {"id": "tenis2"}, "vale": 0.82, "valeEm": 8.23}, {"rotulo": "Caro", "preco": 1500, "em": 2.53, "texto": "Placa de carbono", "textoEm": 10.06, "imagem": {"id": "tenis3"}, "vale": 0.3, "valeEm": 10.48}], "medidor": {"rotulo": "Vale a pena?"}, "selo": {"degrau": 1, "texto": "Melhor custo-benefício", "em": 13.45, "vale": 0.95, "valeEm": 12.67}}
```
