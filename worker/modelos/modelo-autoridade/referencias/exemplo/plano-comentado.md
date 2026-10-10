# Exemplo do modelo autoridade: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `gancho` (bloco próprio do modelo): 0.00–2.60 s
Fala: “Comprou pela internet e se arrependeu?”

```json
{"rotulo": "Direito do consumidor", "linhas": ["Comprou pela", "internet e", "se arrependeu?"], "enfase": 2}
```

## 2. `numero` (bloco universal): 2.60–6.63 s
Fala: “você tem sete dias para devolver. e não precisa explicar o motivo.”

```json
{"valor": 7, "em": 3.08, "sufixo": "dias", "rotulo": "para devolver", "rotuloEm": 3.76, "marcadores": 7, "legenda": true}
```

## 3. `citacao` (assinatura): 6.63–10.22 s
Fala: “Está no artigo 49 do Código de Defesa do Consumidor”

```json
{"fonte": "Lei nº 8.078/1990 · CDC", "titulo": "Art. 49", "texto": "O consumidor pode desistir do contrato, no prazo de 7 dias a contar de sua assinatura ou do ato de recebimento do produto ou serviço…", "grifo": "no prazo de 7 dias", "grifoEm": 8.7}
```

## 4. `lista` (bloco próprio do modelo): 10.98–22.26 s
Fala: “O prazo conta a partir do dia em que o produto chega 2. A loja devolve tudo, inclusive o frete 3. peça sempre por escrito e guarde o protocolo.”

```json
{"rotulo": "Funciona assim", "itens": [{"em": 11.25, "texto": "O prazo conta a partir da chegada do produto", "icone": "caixa"}, {"em": 15.1, "texto": "A loja devolve tudo, inclusive o frete", "icone": "retorno"}, {"em": 18.98, "texto": "Peça por escrito e guarde o protocolo", "icone": "documento"}]}
```

## 5. `contraste` (bloco próprio do modelo): 22.25–26.18 s
Fala: “A loja se recusou Aí já é caso de PROCON, ou de advogado”

```json
{"pergunta": "A loja se recusou?", "conector": "ou", "opcoes": [{"em": 24.4, "texto": "Procon"}, {"em": 25.55, "texto": "Advogado"}], "legenda": true}
```

## 6. `cta` (bloco universal): 26.09–29.40 s
Fala: “Salva esse vídeo, porque um dia você vai precisar.”

```json
{"texto": "Salve este vídeo", "legenda": true, "icone": "salvar"}
```
