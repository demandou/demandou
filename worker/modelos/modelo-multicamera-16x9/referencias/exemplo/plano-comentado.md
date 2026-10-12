# Exemplo do modelo multicamera: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.38 s
Fala: “Três erros que derrubam qualquer entrevista de emprego”

```json
{"texto": "Três erros que derrubam qualquer entrevista de emprego", "destaque": "Três erros", "em": 0.31}
```

## 2. `capitulo` (assinatura): 3.38–5.45 s
Fala: “O primeiro é não pesquisar a empresa”

```json
{"texto": "Pesquise a empresa"}
```

## 3. `cena` (assinatura): 5.59–7.40 s
Fala: “Se o recrutador pergunta o que você”

```json
{"em": 5.65, "imagem": {"id": "entrevista", "efeito": "aproximar", "foco": {"x": 0.74, "y": 0.5}}, "rotulo": "O recrutador", "forma": "cheia"}
```

## 4. `destaque` (bloco universal): 8.86–9.98 s
Fala: “trava, acabou.”

```json
{"texto": "Trava, acabou.", "em": 8.9, "nivel": "alerta"}
```

## 5. `capitulo` (assinatura): 9.98–11.60 s
Fala: “O segundo é falar mal do emprego”

```json
{"texto": "Não fale mal do emprego anterior"}
```

## 6. `cena` (assinatura): 11.60–12.26 s
Fala: “anterior.”

```json
{"em": 11.6, "imagem": {"id": "caixa"}}
```

## 7. `comparacao` (bloco universal): 13.15–14.84 s
Fala: “ruim, fala do que você aprendeu.”

```json
{"modo": "antes-depois", "lados": [{"rotulo": "O emprego", "texto": "foi ruim", "em": 13.27}, {"rotulo": "Você fala", "texto": "do que aprendeu", "em": 13.8}], "vencedor": 1, "vencedorEm": 14.2}
```
