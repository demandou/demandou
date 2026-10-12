# Exemplo do modelo demo: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (assinatura): 0.00–3.31 s
Fala: “Três erros que fazem o cliente sair do seu site”

```json
{"texto": "Venda mais com o seu site", "legenda": true}
```

## 2. `imagem` (assinatura): 0.00–3.31 s
Fala: “Três erros que fazem o cliente sair do seu site”

```json
{"imagem": {"id": "saida"}, "efeito": "aproximar", "legenda": true}
```

## 3. `tela` (assinatura): 3.31–5.18 s
Fala: “Texto demais na primeira tela.”

```json
{"layout": "split", "captura": "pao", "proporcao": 3.281, "legenda": true, "ini": {"x": 0.5, "y": 0.075, "zoom": 1.35}, "fim": {"x": 0.5, "y": 0.105, "zoom": 1.35}, "cursor": [{"x": 0.5, "y": 0.09, "em": 3.5}, {"x": 0.42, "y": 0.12, "em": 4.6}]}
```

## 4. `tela` (assinatura): 5.18–6.94 s
Fala: “Botão de compra escondido.”

```json
{"layout": "cheio", "captura": "loja", "proporcao": 1.016, "legenda": true, "ini": {"x": 0.4, "y": 0.3, "zoom": 1.9}, "fim": {"x": 0.4, "y": 0.72, "zoom": 1.9}, "cursor": [{"x": 0.62, "y": 0.45, "em": 5.5}, {"x": 0.6, "y": 0.62, "em": 6.2}]}
```

## 5. `tela` (assinatura): 6.94–9.00 s
Fala: “Coloca a promessa em uma frase: o”

```json
{"layout": "split", "captura": "exemplo", "proporcao": 2.031, "legenda": true, "ini": {"x": 0.47, "y": 0.13, "zoom": 1.15}, "fim": {"x": 0.45, "y": 0.14, "zoom": 1.3}, "cursor": [{"x": 0.3, "y": 0.14, "em": 7.5}, {"x": 0.6, "y": 0.14, "em": 8.4}]}
```

## 6. `tela` (assinatura): 9.00–11.75 s
Fala: “o botão logo abaixo e Contraste Forte.”

```json
{"layout": "split", "captura": "exemplo", "proporcao": 2.031, "legenda": true, "ini": {"x": 0.45, "y": 0.14, "zoom": 1.3}, "fim": {"x": 0.3, "y": 0.2, "zoom": 1.6}, "cursor": [{"x": 0.5, "y": 0.17, "em": 9.0}, {"x": 0.16, "y": 0.214, "em": 9.9, "clique": true}, {"x": 0.2, "y": 0.2, "em": 11.0}]}
```

## 7. `cta` (bloco universal): 11.75–14.40 s
Fala: “Salva e revisa a sua página hoje.”

```json
{"texto": "Salva e revisa a sua página hoje", "icone": "salvar", "legenda": true}
```
