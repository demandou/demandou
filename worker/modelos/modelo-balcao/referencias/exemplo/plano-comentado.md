# Exemplo do modelo balcao: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–1.52 s
Fala: “Aqui na confeitaria,”

```json
{"texto": "Aqui na confeitaria", "destaque": "confeitaria", "em": 0.3, "cena": {"expositor": "bolo", "itens": ["pote", "cafe", "pote"], "placa": "Aberto"}}
```

## 2. `abertura` (bloco universal): 1.52–3.86 s
Fala: “toda quinta é dia de bolo de pote.”

```json
{"texto": "Toda quinta é dia de bolo de pote", "destaque": "bolo de pote", "em": 1.6}
```

## 3. `vitrine` (assinatura): 3.86–8.42 s
Fala: “tem chocolate, ninho com morango e maracujá, a doze reais cada.”

```json
{"itens": [{"texto": "Chocolate", "em": 4.05, "imagem": {"id": "chocolate"}}, {"texto": "Ninho com morango", "em": 5.0, "imagem": {"id": "ninho-morango"}}, {"texto": "Maracujá", "em": 6.04, "imagem": {"id": "maracuja"}}], "preco": {"texto": "R$ 12", "em": 7.03, "detalhe": "cada", "detalheEm": 7.74}}
```

## 4. `combo` (assinatura): 8.45–10.04 s
Fala: “Leva três e paga trinta.”

```json
{"texto": "Leva 3", "em": 8.49, "valor": "paga 30", "valorEm": 9.23}
```

## 5. `mapa` (assinatura): 10.06–13.72 s
Fala: “A gente fica na Rua das Flores, 120, aberto até as oito.”

```json
{"rua": "Rua das Flores", "em": 10.78, "numero": "120", "numeroEm": 11.83, "horario": {"rotulo": "Aberto", "rotuloEm": 12.76, "texto": "até 20h", "em": 13.35}}
```

## 6. `cta` (bloco universal): 13.84–15.95 s
Fala: “Encomenda pelo WhatsApp do perfil.”

```json
{"texto": "Encomenda pelo perfil", "destaque": "Encomenda", "em": 13.9, "icone": "comentar", "pedido": true}
```
