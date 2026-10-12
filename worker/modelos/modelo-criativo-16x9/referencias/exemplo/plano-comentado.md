# Exemplo do modelo criativo na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem (a variante do gancho A).
**A folha foi feita no vertical; o `plano.json` é o mesmo plano no quadro deitado (1920×1080).** Os campos e os tempos não mudam; muda onde cada coisa fica, pela aula 9 do curso: o `gancho` sem foto vira uma placa no peito, com a pessoa em quadro cheio e a legenda na área segura de baixo; as `prova`, o `heroi` e o cartão final do `cta` ficam no quadro da esquerda, com a pessoa na moldura de vidro da direita (o rosto centralizado); o botão fica embaixo do cartão final e o `selo` no canto de cima dele.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `gancho` (bloco próprio do modelo): 0.00–2.65 s
Fala: “Para de comprar garrafa que não segura o gelo.”

```json
{"texto": "Não segura o gelo?", "destaque": "gelo", "em": 1.41, "icone": "gelo", "iconeEm": 2.18}
```

## 2. `prova` (assinatura): 2.65–5.41 s
Fala: “Ela mantém a água gelada por 24 horas,”

```json
{"imagem": {"id": "gelo"}, "em": 2.75, "palavra": "Ela", "texto": "Mantém a água gelada", "textoEm": 2.78, "numero": {"valor": 24, "em": 4.46, "sufixo": "horas"}}
```

## 3. `prova` (assinatura): 5.41–6.81 s
Fala: “não vaza na mochila”

```json
{"imagem": {"id": "mochila"}, "em": 6.13, "palavra": "mochila", "texto": "Não vaza na mochila", "textoEm": 5.41}
```

## 4. `prova` (assinatura): 6.81–8.54 s
Fala: “e cabe no porta-copo do carro,”

```json
{"imagem": {"id": "porta-copo"}, "em": 7.22, "palavra": "porta-copo", "texto": "Cabe no porta-copo do carro", "textoEm": 7.03}
```

## 5. `cta` (bloco universal): 8.54–11.85 s
Fala: “Clique em Saiba Mais e garante a sua com frete grátis.”

```json
{"texto": "Saiba mais", "em": 8.82, "toqueEm": 8.95, "icone": "link", "imagem": {"id": "garrafa"}, "titulo": "Garante a sua", "tituloEm": 9.59}
```

## 6. `selo` (bloco próprio do modelo): 10.64–11.85 s
Fala: “frete grátis.”

```json
{"texto": "Frete grátis", "em": 10.64, "icone": "frete"}
```
