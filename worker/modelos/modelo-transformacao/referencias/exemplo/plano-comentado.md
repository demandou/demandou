# Exemplo do modelo transformacao: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.76 s
Fala: “Esse closet levou duas horas pra ficar assim.”

```json
{"texto": "Esse closet levou duas horas pra ficar assim", "destaque": "duas horas", "em": 0.32}
```

## 2. `antesdepois` (assinatura): 2.80–12.96 s
Fala: “tira tudo e separa em três pilhas. Cabide igual para tudo, muda a cara na hora organiza por cor, do claro para o escuro Olho antes e o depois.”

```json
{"antes": {"id": "antes"}, "depois": {"id": "depois"}, "marcadores": [{"texto": "Tira tudo e separa em três pilhas", "em": 2.89, "foco": {"x": 0.42, "y": 0.72}, "zoom": 2.0, "ponto": {"x": 0.3, "y": 0.69}}, {"texto": "Cabide igual para tudo", "em": 5.01, "foco": {"x": 0.5, "y": 0.38}, "zoom": 1.9, "ponto": {"x": 0.5, "y": 0.37}, "detalhe": "muda a cara na hora", "detalheEm": 7.39}, {"texto": "Organiza por cor, do claro para o escuro", "em": 8.62, "foco": {"x": 0.45, "y": 0.52}, "zoom": 1.7, "ponto": {"x": 0.3, "y": 0.5}}], "alca": [{"em": 11.1, "pos": 0.0}, {"em": 12.2, "pos": 1}], "janelaEm": 11.09}
```

## 3. `cta` (bloco universal): 13.00–15.04 s
Fala: “Salva pra fazer no fim de semana.”

```json
{"texto": "Salva pra fazer no fim de semana", "icone": "salvar", "destaque": "Salva", "em": 13.12}
```
