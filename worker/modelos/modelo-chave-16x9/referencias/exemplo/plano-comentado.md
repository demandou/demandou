# Exemplo do modelo chave na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. **Os quadros são do vertical**; o `plano.json` desta pasta é o mesmo plano, com as posições do quadro deitado (1920×1080: `rosto`, `zona`, `videoAltura`). No deitado, com a composição da aula 9:
- a `porta` abre com as duas folhas e o título é remontado numa etiqueta larga no peito (menos linhas, letra maior);
- os três `item` e o `vezes` põem a pessoa na porta da direita; o quadro de chaves fica no alto da parede da esquerda, com o painel do item embaixo dele, e o "3×" com as etiquetas fica na parede (o `lado` dos itens não muda nada);
- o `cta` volta à tela cheia: a régua com "Salva" e "Manda" à esquerda e a chamada com a placa do nome à direita, numa fileira abaixo do queixo.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `porta` (bloco próprio do modelo): 0.00–3.55 s
Fala: “Antes de alugar um apartamento, confere três coisas:”

```json
{"numero": "302", "linhas": ["Antes de alugar", "um apartamento,", "confere 3 coisas:"], "enfase": "3 coisas:", "etiquetas": {"n": 3, "em": 2.63}}
```

## 2. `item` (assinatura): 3.55–6.78 s
Fala: “o laudo de vistoria, com fotos de cada cômodo”

```json
{"etiqueta": "Vistoria", "titulo": "Laudo de vistoria", "painel": {"tipo": "prancheta", "subtitulo": "com fotos de cada cômodo", "comodos": [{"nome": "Sala", "desenho": "sala", "em": 5.3}, {"nome": "Cozinha", "desenho": "cozinha", "em": 5.6}, {"nome": "Quarto", "desenho": "quarto", "em": 5.86}, {"nome": "Banheiro", "desenho": "banheiro", "em": 6.12}]}, "lado": "esquerda"}
```

## 3. `item` (assinatura): 6.78–10.00 s
Fala: “o valor do condomínio e do IPTU, além do aluguel.”

```json
{"etiqueta": "Custos", "etiquetaEm": 6.92, "titulo": "Conta do mês", "painel": {"tipo": "conta", "linhas": [{"rotulo": "Condomínio", "valor": 680, "em": 7.37}, {"rotulo": "IPTU", "valor": 140, "em": 8.5}, {"rotulo": "Aluguel", "valor": 2500, "em": 9.46}], "prefixo": "R$", "total": "Total do mês", "nota": "valores de exemplo"}, "lado": "direita"}
```

## 4. `item` (assinatura): 10.00–14.31 s
Fala: “e o tipo de garantia fiador, calção ou seguro-fiança.”

```json
{"etiqueta": "Garantia", "etiquetaEm": 10.62, "titulo": "Tipo de garantia", "painel": {"tipo": "chaveiro", "chaves": [{"texto": "Fiador", "icone": "pessoa", "em": 11.69}, {"texto": "Caução", "icone": "dinheiro", "em": 12.16}, {"texto": "Seguro-fiança", "icone": "escudo", "em": 13.18}]}}
```

## 5. `vezes` (assinatura): 14.31–16.96 s
Fala: “A calção pode ser de até três meses de aluguel”

```json
{"rotulo": "Caução", "prefixo": "até", "n": 3, "numeroEm": 15.71, "unidade": "meses de aluguel", "etiquetas": [{"texto": "1º mês", "em": 15.78}, {"texto": "2º mês", "em": 16.05}, {"texto": "3º mês", "em": 16.32}], "fonte": "Lei do Inquilinato · nº 8.245/91"}
```

## 6. `cta` (bloco universal): 16.96–19.72 s
Fala: “Salva e manda para quem está procurando casa.”

```json
{"acoes": [{"texto": "Salva", "icone": "salvar", "em": 17.04}, {"texto": "Manda", "icone": "enviar", "em": 17.22}], "texto": "pra quem está procurando casa"}
```
