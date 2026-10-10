# Exemplo do modelo arquivo: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `credito` (bloco próprio do modelo): 0.00–4.31 s
Fala: “Rio de Janeiro 12 de outubro de 1931”

```json
{"rotulo": "Local e data", "lugar": {"em": 0.1, "texto": "Rio de Janeiro"}, "data": [{"em": 1.33, "texto": "12"}, {"em": 2.05, "texto": "10"}, {"em": 2.94, "texto": "1931"}]}
```

## 2. `ficha` (assinatura): 4.31–9.45 s
Fala: “Depois de anos de obra, o Cristo Redentor é inaugurado no Alto do Corcovado”

```json
{"legenda": true, "cabecalho": "Ficha de registro", "titulo": {"em": 6.08, "texto": "Cristo Redentor", "rotulo": "Objeto"}, "campos": [{"em": 4.9, "rotulo": "Obra · engenheiro", "valor": "Heitor da Silva Costa"}], "carimbo": {"em": 7.26, "texto": "Inaugurado", "detalhe": "12.10.1931"}, "coordenadas": {"em": 8.15, "local": "Alto do Corcovado", "lat": "22°57'05\"S", "lon": "43°12'38\"W"}, "layout": "esquerda"}
```

## 3. `escala` (bloco próprio do modelo): 9.45–13.22 s
Fala: “São 30 metros de estátua. 38 com o pedestal”

```json
{"rotulo": "Altura", "unidade": "m", "desenho": "estatua", "partes": [{"em": 11.59, "valor": 8, "rotulo": "pedestal"}, {"em": 9.61, "valor": 30, "rotulo": "estátua"}]}
```

## 4. `camadas` (bloco próprio do modelo): 13.22–20.28 s
Fala: “por dentro, concreto armado Por fora, milhares de pequenos triângulos de pedra-sabão. colocados à mão.”

```json
{"dentro": {"em": 13.26, "titulo": "Por dentro", "material": "concreto", "nome": "Concreto armado", "nomeEm": 14.11}, "fora": {"em": 15.23, "titulo": "Por fora", "material": "mosaico", "nome": "Pedra-sabão", "nomeEm": 18.16, "cobreAte": 18.9}, "destaque": {"em": 19.17, "texto": "Colocados à mão"}}
```

## 5. `pessoas` (assinatura): 20.28–25.66 s
Fala: “O rosto foi esculpido por um artista romeno, a partir do projeto de um escultor francês”

```json
{"legenda": true, "titulo": "O rosto e o projeto", "pessoas": [{"em": 20.93, "papel": "Rosto", "nome": "Gheorghe Leonida", "nomeEm": 22.01, "detalhe": "Escultor · Romênia", "detalheEm": 22.48}, {"em": 23.65, "papel": "Projeto", "nome": "Paul Landowski", "nomeEm": 24.39, "detalhe": "Escultor · França", "detalheEm": 25.05}], "ligacao": {"em": 23.27}, "layout": "direita"}
```

## 6. `linha` (assinatura): 25.66–29.72 s
Fala: “Em 2007, virou uma das sete maravilhas do mundo moderno.”

```json
{"marcos": [{"em": 25.66, "ano": 1931, "texto": "Inauguração"}, {"em": 25.72, "ano": 2007, "texto": "Sete maravilhas"}], "manchete": "Uma das sete maravilhas do mundo moderno", "enfase": "sete maravilhas", "carimbo": {"em": 27.61, "texto": "Eleito", "detalhe": "07.07.2007"}}
```

## 7. `cta` (bloco universal): 29.72–31.68 s
Fala: “Segue para a próxima história.”

```json
{"texto": "Segue para a próxima história", "icone": "seguir"}
```
