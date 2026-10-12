# Exemplo do modelo lookbook: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `capa` (bloco próprio do modelo): 0.00–2.83 s
Fala: “Três peças para se vestir melhor sem esforço.”

```json
{"linhas": ["3 peças", "pra se vestir melhor", "sem esforço"], "enfase": "sem esforço"}
```

## 2. `peca` (assinatura): 2.83–6.43 s
Fala: “Uma. Tchau. camisa branca de algodão bem ajustada no ombro.”

```json
{"numero": 1, "layout": "direita", "rotulo": "peça", "nome": "Camisa", "nomeEm": 3.53, "complemento": "branca", "complementoEm": 3.75, "ponto": "peito", "amostra": {"cor": "branco", "tecido": "algodao", "em": 4.31}, "atributos": [{"rotulo": "Tecido", "valor": "algodão", "em": 4.31}, {"rotulo": "Caimento", "valor": "bem ajustada", "em": 5.07}], "medida": {"de": "pescoco", "ate": "ombroEsq", "em": 5.79, "texto": "no ombro"}}
```

## 3. `peca` (assinatura): 6.43–9.87 s
Fala: “Duas. Jaquet tem tom neutro, que combina com tudo”

```json
{"numero": 2, "layout": "esquerda", "rotulo": "peça", "nome": "Jaqueta", "nomeEm": 7.22, "complemento": "tom neutro", "complementoEm": 7.88, "ponto": "jaquetaDir", "amostra": {"cor": "pedra", "tecido": "sarja", "em": 7.88}, "combina": {"rotulo": "Combina com", "em": 8.92, "ate": 9.7, "cores": ["branco", "preto", "marinho", "oliva", "jeans"]}}
```

## 4. `peca` (assinatura): 9.87–13.50 s
Fala: “3. Relógio simples, tipo cera de couro ou metal”

```json
{"numero": 3, "layout": "topo", "rotulo": "peça", "nome": "Relógio", "nomeEm": 10.69, "ponto": "pulsoDir", "detalhe": {"ponto": "pulsoDir", "em": 10.69, "zoom": 2.1, "rotulo": "detalhe · pulso"}, "atributos": [{"rotulo": "Estilo", "valor": "simples", "em": 11.01}], "variantes": {"rotulo": "Pulseira", "em": 11.96, "itens": [{"nome": "couro", "cor": "couro", "tecido": "couro", "em": 12.35}, {"nome": "metal", "cor": "metal", "tecido": "metal", "em": 12.83}]}}
```

## 5. `colagem` (assinatura): 13.50–16.38 s
Fala: “Com essas três, qualquer calça jeans vira um look.”

```json
{"itens": [{"peca": 1, "em": 13.62}, {"peca": 2, "em": 13.8}, {"peca": 3, "em": 13.98}, {"nome": "calça jeans", "cor": "jeans", "tecido": "jeans", "em": 14.91}], "titulo": "vira um look.", "enfase": "look.", "subtitulo": "Com essas três,", "folio": "o look"}
```

## 6. `cta` (bloco universal): 16.38–18.84 s
Fala: “Salva e me segue para mais dicas de estilo.”

```json
{"texto": "Salve e siga", "textoEm": 16.43, "detalhe": "mais dicas de estilo", "detalheEm": 17.35, "assinaturaEm": 17.83, "icone": "salvar"}
```
