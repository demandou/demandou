# Exemplo do modelo niveis: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `niveis` (assinatura): 0.00–4.25 s
Fala: “Tênis de corrida de 200, 600 e 1.500 reais.”

```json
{"itens": [{"rotulo": "R$ 200", "em": 0.02, "imagem": {"id": "tenis1"}, "fundo": "#DCE3EE"}, {"rotulo": "R$ 600", "em": 1.67, "imagem": {"id": "tenis2"}, "fundo": "#D3EAE4"}, {"rotulo": "R$ 1.500", "em": 2.43, "imagem": {"id": "tenis3"}, "fundo": "#F7D9D1"}]}
```

## 2. `niveis` (assinatura): 4.25–6.48 s
Fala: “O de 200 tem amortecimento básico”

```json
{"itens": [{"rotulo": "R$ 200", "em": 4.3, "imagem": {"id": "tenis1"}, "fundo": "#DCE3EE", "depois": {"rotulo": "Básico", "em": 5.15}}]}
```

## 3. `niveis` (assinatura): 6.48–8.73 s
Fala: “O de 600 tem espuma mais leve,”

```json
{"itens": [{"rotulo": "Básico", "em": 6.48, "imagem": {"id": "tenis1"}, "fundo": "#DCE3EE"}, {"rotulo": "R$ 600", "em": 6.5, "imagem": {"id": "tenis2"}, "fundo": "#D3EAE4", "depois": {"rotulo": "Espuma", "em": 7.49}}]}
```

## 4. `niveis` (assinatura): 8.73–11.29 s
Fala: “O de 1500 tem placa de carbono,”

```json
{"itens": [{"rotulo": "Básico", "em": 8.73, "imagem": {"id": "tenis1"}, "fundo": "#DCE3EE"}, {"rotulo": "Espuma", "em": 8.73, "imagem": {"id": "tenis2"}, "fundo": "#D3EAE4"}, {"rotulo": "R$ 1.500", "em": 8.78, "imagem": {"id": "tenis3"}, "fundo": "#F7D9D1", "depois": {"rotulo": "Carbono", "em": 10.06}}]}
```

## 5. `niveis` (assinatura): 11.29–14.84 s
Fala: “Para quem está começando, o do meio é o melhor custo-benefício.”

```json
{"itens": [{"rotulo": "R$ 200", "em": 11.33, "imagem": {"id": "tenis1"}, "fundo": "#DCE3EE", "ate": 12.9}, {"rotulo": "R$ 600", "em": 11.33, "imagem": {"id": "tenis2"}, "fundo": "#D3EAE4"}, {"rotulo": "R$ 1.500", "em": 11.33, "imagem": {"id": "tenis3"}, "fundo": "#F7D9D1", "ate": 12.9}]}
```

## 6. `destaque` (bloco universal): 12.50–14.84 s
Fala: “o do meio é o melhor custo-benefício.”

```json
{"texto": "Melhor custo-benefício", "em": 13.11, "nivel": "chave"}
```
