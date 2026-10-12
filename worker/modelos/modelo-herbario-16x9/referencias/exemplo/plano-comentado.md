# Exemplo do modelo herbario: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `capa` (bloco próprio do modelo): 0.00–2.27 s
Fala: “3 erros que matam a sua planta”

```json
{"linhas": ["3 erros que", "matam a sua", "planta"], "destaque": "planta", "indice": 3}
```

## 2. `figura` (assinatura): 2.27–4.85 s
Fala: “regar demais, que apodrece a raiz,”

```json
{"vista": "vaso", "numero": 1, "rotulo": "Erro nº 1", "titulo": ["Regar", "demais"], "acoes": [{"em": 2.39, "acao": "regar"}, {"em": 2.75, "acao": "encharcar"}, {"em": 3.6, "acao": "apodrecer"}], "etiquetas": [{"em": 3.62, "alvo": "raiz", "texto": "apodrece a raiz", "erro": true}]}
```

## 3. `figura` (assinatura): 4.85–6.40 s
Fala: “deixar longe da luz”

```json
{"vista": "janela", "numero": 2, "rotulo": "Erro nº 2", "titulo": ["Longe", "da luz"], "acoes": [{"em": 5.32, "acao": "afastar"}, {"em": 5.96, "acao": "amarelar"}], "etiquetas": [{"em": 5.84, "alvo": "regua", "texto": "longe"}]}
```

## 4. `figura` (assinatura): 6.40–9.32 s
Fala: “e usar vaso sem furo, que acumula água no fundo.”

```json
{"vista": "vaso", "numero": 3, "rotulo": "Erro nº 3", "titulo": ["Vaso", "sem furo"], "acoes": [{"em": 7.1, "acao": "semFuro"}, {"em": 8.05, "acao": "acumular"}, {"em": 8.95, "acao": "furo"}], "etiquetas": [{"em": 7.12, "alvo": "furo", "texto": "sem furo", "erro": true}, {"em": 8.3, "alvo": "agua", "texto": "água no fundo", "erro": true}]}
```

## 5. `figura` (assinatura): 9.32–14.43 s
Fala: “Antes de regar, enfia o dedo na terra. Se ainda estiver úmida, espera mais um dia”

```json
{"vista": "terra", "rotulo": "Antes de regar", "titulo": ["Enfia o dedo", "na terra"], "acoes": [{"em": 10.44, "acao": "dedo"}, {"em": 12.14, "acao": "umida"}, {"em": 13.42, "acao": "esperar", "texto": "+1 dia"}], "etiquetas": [{"em": 12.85, "alvo": "umida", "texto": "úmida"}]}
```

## 6. `cta` (bloco universal): 14.43–16.96 s
Fala: “Salva e me segue para mais dicas de plantas.”

```json
{"texto": "Salva e me segue pra mais dicas de plantas", "linhas": ["Salva e", "me segue", "pra mais dicas de plantas"], "icones": [{"em": 14.48, "icone": "salvar"}, {"em": 14.77, "icone": "seguir"}]}
```
