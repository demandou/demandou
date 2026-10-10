# Exemplo do modelo case: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `case` (assinatura): 0.00–12.74 s
Fala: “Esse cliente gastava 5 mil reais por mês em anúncio E quase não vendia Mudamos três coisas: o criativo a página e a oferta. Em 60 dias, o custo por venda caiu pela metade.”

```json
{"antes": {"em": 0.3, "titulo": "Cliente", "icone": "pessoa", "tituloEm": 0, "carimboEm": 0.47, "metricas": [{"rotulo": "Gasto em anúncio", "em": 0.86, "valor": "R$ 5 mil", "valorEm": 1.14, "detalhe": "por mês", "detalheEm": 1.99, "icone": "anuncio", "iconeEm": 2.62}, {"rotulo": "Vendas", "em": 3.47, "valor": "quase não vendia", "valorEm": 3.47, "icone": "carrinho", "sinal": "plano"}]}, "mudancas": {"em": 4.83, "titulo": "Mudamos 3 coisas", "destaque": "3", "itens": [{"texto": "O criativo", "em": 6.48, "icone": "criativo"}, {"texto": "A página", "em": 7.72, "icone": "pagina"}, {"texto": "A oferta", "em": 8.57, "icone": "oferta"}]}, "prazo": {"texto": "60 dias", "em": 9.44, "fimEm": 10.55}, "resultado": {"rotulo": "Custo por venda", "em": 10.76, "direcao": "cai", "fator": 0.5, "depoisEm": 11.25, "movimentoEm": 11.64, "relacao": "pela metade", "relacaoEm": 11.96}}
```

## 2. `depoimento` (bloco próprio do modelo): 12.74–14.20 s
Fala: “Olha a mensagem que ele mandou.”

```json
{"etiqueta": "Mensagem do cliente", "em": 12.97, "palavra": "Olha", "textoEm": 13.22, "texto": "Mudou o jogo aqui! Vendendo mais e gastando menos.", "nome": "Cliente", "estrelas": 5, "estrelasEm": 13.66}
```

## 3. `pergunta` (bloco universal): 14.20–15.60 s
Fala: “Quer esse diagnóstico?”

```json
{"texto": "Quer esse diagnóstico?", "destaque": "diagnóstico", "em": 14.34}
```

## 4. `cta` (bloco universal): 15.60–16.84 s
Fala: “Comenta CASE.”

```json
{"texto": "Comenta CASE", "icone": "comentar", "destaque": "CASE", "em": 15.63, "destaqueEm": 15.95}
```
