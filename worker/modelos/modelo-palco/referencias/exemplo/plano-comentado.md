# Exemplo do modelo palco: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.06–1.86 s
Fala: “Quer fotos de comida que dão fome?”

```json
{"texto": "Quer fotos de comida que dão fome?", "destaque": "dão fome?", "em": 0.06}
```

## 2. `destaque` (bloco universal): 2.00–3.10 s
Fala: “truques com o celular.”

```json
{"texto": "3 truques", "em": 2.03, "nivel": "chave"}
```

## 3. `palco` (assinatura): 3.30–5.46 s
Fala: “luz de janela, de lado.”

```json
{"imagem": {"id": "janela", "foco": {"x": 0.5, "y": 0.5}}, "em": 3.3, "titulo": "Luz de janela, de lado", "etiqueta": "1", "tituloEm": 3.45, "anotacoes": [{"tipo": "circulo", "em": 4.24, "x": 0.5, "y": 0.33, "tamanho": 0.34, "texto": "luz natural"}, {"tipo": "seta", "em": 5.08, "x": 0.37, "y": 0.36, "vem": "esq", "texto": "de lado", "tamanho": 0.42}]}
```

## 4. `palco` (assinatura): 5.64–7.97 s
Fala: “Pizza e mesa posta ficam melhores de cima.”

```json
{"imagem": {"id": "pizza"}, "em": 5.64, "titulo": "Melhor de cima", "etiqueta": "2", "tituloEm": 5.7, "anotacoes": [{"tipo": "circulo", "em": 5.66, "x": 0.5, "y": 0.5, "tamanho": 0.34, "texto": "pizza"}], "segunda": {"imagem": {"id": "mesa", "foco": {"x": 0.55, "y": 0.5}}, "em": 6.01, "anotacoes": [{"tipo": "circulo", "em": 6.2, "x": 0.58, "y": 0.5, "tamanho": 0.4}]}}
```

## 5. `palco` (assinatura): 9.50–12.20 s
Fala: “e deixa só um guardanapo ou um talher para dar contexto.”

```json
{"imagem": {"id": "simples", "foco": {"x": 0.55, "y": 0.62}}, "em": 9.5, "titulo": "Menos é mais", "etiqueta": "3", "tituloEm": 9.6, "anotacoes": [{"tipo": "circulo", "em": 10.3, "x": 0.88, "y": 0.8, "tamanho": 0.3, "texto": "guardanapo"}, {"tipo": "seta", "em": 11.2, "x": 0.93, "y": 0.63, "vem": "cima", "texto": "talher", "tamanho": 0.3}]}
```

## 6. `cta` (bloco universal): 12.55–14.20 s
Fala: “no seu próximo almoço.”

```json
{"texto": "Testa no seu próximo almoço.", "em": 12.49, "icone": "salvar", "destaque": "próximo almoço"}
```
