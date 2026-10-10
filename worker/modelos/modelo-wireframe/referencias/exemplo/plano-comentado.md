# Exemplo do modelo wireframe: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.31 s
Fala: “Três erros que fazem o cliente sair do seu site”

```json
{"texto": "3 erros que fazem o cliente sair do seu site", "titulo": "3 erros que fazem o cliente sair do seu site", "destaque": "3"}
```

## 2. `revisao` (assinatura): 3.31–9.20 s
Fala: “Texto demais na primeira tela. Botão de compra escondido. e letra clara em fundo claro”

```json
{"erros": [{"em": 3.62, "tipo": "texto", "rotulo": "Texto demais", "medeEm": 4.25}, {"em": 5.27, "tipo": "botao", "rotulo": "Botão escondido"}, {"em": 7.04, "tipo": "contraste", "rotulo": "Pouco contraste", "medeEm": 8.17}], "legenda": true}
```

## 3. `conserto` (assinatura): 9.20–13.97 s
Fala: “Coloca a promessa em uma frase: o botão logo abaixo e Contraste Forte.”

```json
{"passos": [{"em": 9.3, "tipo": "promessa"}, {"em": 11.19, "tipo": "botao"}, {"em": 12.63, "tipo": "contraste"}], "legenda": true}
```

## 4. `resultado` (assinatura): 13.97–16.20 s
Fala: “Em segundos, a página vende mais.”

```json
{"rotulo": "Pedidos", "itens": [{"em": 14.1, "texto": "Novo pedido", "detalhe": "Assinatura · agora"}, {"em": 14.91, "texto": "Novo pedido", "detalhe": "Assinatura · agora"}, {"em": 15.46, "texto": "Novo pedido", "detalhe": "Assinatura · agora"}], "legenda": true}
```

## 5. `cta` (bloco universal): 16.20–18.96 s
Fala: “Salva e revisa a sua página hoje.”

```json
{"texto": "Salva e revisa a sua página hoje.", "icone": "salvar"}
```
