# Exemplo do modelo prompt: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `vago` (bloco próprio do modelo): 0.00–3.50 s
Fala: “Seu resultado com IA é ruim porque o seu pedido é vago”

```json
{"pedido": "me faz um cardápio", "enviaEm": 0.95, "rotuloResposta": {"texto": "resultado ruim", "em": 1.56}, "rotuloPedido": {"texto": "pedido vago", "em": 3.23}}
```

## 2. `montagem` (assinatura): 3.50–16.11 s
Fala: “Monta o prompt em quatro peças. papel haja como um nutricionista. tarefa Monte um cardápio da semana. Com o texto. Sou vegetariano e treino de manhã. Formato. em tabela com as calorias.”

```json
{"titulo": "Monta o prompt em 4 peças", "destaque": "4 peças", "itens": [{"em": 5.58, "nome": "Papel", "texto": "Aja como um nutricionista."}, {"em": 8.09, "nome": "Tarefa", "texto": "Monte um cardápio da semana."}, {"em": 10.69, "nome": "Contexto", "texto": "Sou vegetariano e treino de manhã."}, {"em": 13.82, "nome": "Formato", "texto": "Em tabela, com as calorias."}]}
```

## 3. `resposta` (bloco próprio do modelo): 16.11–19.57 s
Fala: “Com essas quatro peças, a resposta muda completamente.”

```json
{"enviaEm": 17.06, "viraEm": 17.74, "papel": "nutricionista", "titulo": "Cardápio da semana", "etiquetas": [{"texto": "vegetariano", "peca": 2}, {"texto": "treino de manhã", "peca": 2}], "colunas": ["Dia", "Almoço", "kcal"], "destaqueColuna": 2, "corDestaque": 3, "nota": {"texto": "Pré-treino: banana e aveia", "valor": "280", "peca": 2}, "linhas": [["Seg", "Grão-de-bico ao curry", "620"], ["Ter", "Lentilha com arroz", "580"], ["Qua", "Tofu com legumes", "540"], ["Qui", "Omelete de espinafre", "490"], ["Sex", "Quinoa com feijão", "610"]]}
```

## 4. `cta` (bloco universal): 19.57–21.60 s
Fala: “Salva e testa agora.”

```json
{"salvarEm": 19.88, "testarEm": 20.3, "texto": "Salva e testa agora"}
```
