# Exemplo do modelo ranking: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.20–2.80 s
Fala: “Meu ranking dos lanches de rua do Brasil.”

```json
{"texto": "Meu ranking dos lanches de rua do Brasil", "destaque": "lanches de rua", "em": 0.28}
```

## 2. `ranking` (assinatura): 2.80–15.20 s
Fala: “Em quinto, o pastel de feira, Em quarto, a tapioca. Em terceiro, a coxinha, Em segundo, o acarajé e, em primeiro lugar, o pão de queijo. Concorda? Comenta o seu número 1 aqui embaixo:”

```json
{"titulo": "Lanches de rua", "tituloEm": 2.85, "tela": 0.75, "itens": [{"posicao": 5, "em": 2.95, "texto": "Pastel de feira", "textoEm": 3.62, "imagem": {"id": "pastel"}}, {"posicao": 4, "em": 4.82, "texto": "Tapioca", "textoEm": 5.62, "imagem": {"id": "tapioca"}}, {"posicao": 3, "em": 6.4, "texto": "Coxinha", "textoEm": 7.23, "imagem": {"id": "coxinha"}}, {"posicao": 2, "em": 8.05, "texto": "Acarajé", "textoEm": 8.84, "imagem": {"id": "acaraje"}}, {"posicao": 1, "em": 10.8, "texto": "Pão de queijo", "textoEm": 11.3, "imagem": {"id": "paodequeijo"}}], "fecho": {"texto": "Comenta o seu número 1", "em": 12.95}}
```
