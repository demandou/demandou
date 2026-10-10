# Exemplo do modelo narrador: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.20–2.50 s
Fala: “A torre Eiffel era pra ter sido desmontada”

```json
{"texto": "A Torre Eiffel era pra ter sido desmontada", "destaque": "desmontada", "em": 0.26}
```

## 2. `cena` (assinatura): 2.59–4.30 s
Fala: “Ela foi construída para a Exposição”

```json
{"imagem": {"id": "construcao"}, "rotulo": "A torre em construção, 1888", "rotuloEm": 2.83, "legenda": true}
```

## 3. `cena` (assinatura): 4.30–7.12 s
Fala: “Universal de Paris, em 1889”

```json
{"imagem": {"id": "exposicao"}, "em": 4.34, "legenda": true, "transicao": "dissolver"}
```

## 4. `letreiro` (assinatura): 4.30–7.00 s
Fala: “Universal de Paris, em 1889”

```json
{"sub": "Exposição Universal", "subEm": 4.34, "texto": "Paris, 1889", "em": 4.96, "posicao": "alto", "legenda": true}
```

## 5. `cena` (assinatura): 7.12–9.52 s
Fala: “Muitos artistas da época odiavam a torre.”

```json
{"imagem": {"id": "artistas"}, "rotulo": "Gravura da torre, c. 1895", "rotuloEm": 7.41, "legenda": true}
```

## 6. `letreiro` (assinatura): 9.55–12.30 s
Fala: “Em 1909, ela deveria ser desmontada.”

```json
{"texto": "1909", "em": 9.57, "sub": "20 anos depois", "subEm": 9.57, "posicao": "baixo", "legenda": false}
```

## 7. `cena` (assinatura): 12.39–14.50 s
Fala: “e principalmente numa antena de rádio,”

```json
{"imagem": {"id": "radio"}, "rotulo": "Estação de rádio da torre", "rotuloEm": 13.59, "legenda": true}
```

## 8. `destaque` (bloco universal): 15.10–16.52 s
Fala: “ela ficou.”

```json
{"texto": "Ela ficou.", "em": 15.2, "nivel": "chave"}
```
