# Exemplo do modelo oferta: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.45 s
Fala: “A turma nova do Método Reels abriu.”

```json
{"em": 0.28, "texto": "A turma nova do Método Reels abriu.", "destaque": "Método Reels", "imagem": {"id": "celular"}, "imagemEm": 1.56}
```

## 2. `oferta` (assinatura): 2.45–12.60 s
Fala: “Você leva o curso completo, 30 roteiros prontos e a mentoria ao vivo. Tudo isso valeria R$ 997. Hoje sai por 297.”

```json
{"em": 2.5, "titulo": "Você leva", "itens": [{"texto": "Curso completo", "em": 2.9, "imagem": {"id": "curso"}}, {"texto": "30 roteiros prontos", "em": 3.8, "imagem": {"id": "roteiros"}}, {"texto": "Mentoria ao vivo", "em": 5.62, "imagem": {"id": "mentoria"}}], "ancora": {"valor": 997, "prefixo": "R$", "em": 8.87, "rotulo": "Tudo isso valeria", "rotuloEm": 7.08}, "preco": {"valor": 297, "prefixo": "R$", "em": 11.45, "rotulo": "Hoje sai por", "rotuloEm": 10.31, "riscoEm": 10.31}}
```

## 3. `garantia` (bloco próprio do modelo): 12.60–14.18 s
Fala: “Garantia de sete dias e”

```json
{"texto": "garantia", "valor": "7", "unidade": "dias", "em": 12.64, "valorEm": 13.25}
```

## 4. `prazo` (bloco próprio do modelo): 14.18–15.45 s
Fala: “só até domingo.”

```json
{"texto": "Só até domingo", "em": 14.22, "dia": "domingo", "diaEm": 14.58}
```

## 5. `cta` (bloco universal): 15.45–16.52 s
Fala: “Link na bio.”

```json
{"texto": "Link na bio", "icone": "link", "em": 15.5, "toqueEm": 15.8}
```
