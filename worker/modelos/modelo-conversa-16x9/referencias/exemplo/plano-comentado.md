# Exemplo do modelo conversa na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. **A folha foi feita no vertical (1080×1920)**: os blocos, os textos, os tempos e o jeito de animar são os mesmos no quadro deitado; muda só a diagramação. O `plano.json` deste exemplo já está no quadro deitado (1920×1080: `videoAltura` 1080, `rosto` com `quadro` 1920×1080 e a `zona` do peito do 16:9).
**No quadro deitado (1920×1080)**, com a composição da aula 9: nos momentos de quadro cheio (`balao`, `cta`) a pessoa fica inteira, como foi gravada, e o balão vai ao lado do rosto, na altura do peito (as suas mensagens à direita da pessoa, as do outro lado à esquerda); nas telas do app (`conversa`, `contraste`) a pessoa vai para a bolha na moldura da direita e a conversa, ou as duas faixas do contraste, ocupam o quadro da esquerda.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `balao` (bloco próprio do modelo): 0.00–3.10 s
Fala: “Seu cliente pergunta o preço no Direct e some.”

```json
{"legenda": true, "mensagem": {"de": "outro", "em": 1.28, "digitando": 0.95, "texto": "Oi! Quanto custa?"}, "offlineEm": 2.46}
```

## 2. `conversa` (assinatura): 3.10–4.86 s
Fala: “Para de responder só com o valor.”

```json
{"nova": true, "fixada": {"rotulo": "Errado", "tom": "errado", "texto": "Responder só com o valor"}, "mensagens": [{"de": "eu", "em": 4.08, "digitando": 0.62, "texto": "R$ 197.", "vistoEm": 4.5, "esfriaEm": 4.62}, {"de": "outro", "tipo": "digitando", "em": 4.42, "ate": 4.84}]}
```

## 3. `conversa` (assinatura): 4.86–6.83 s
Fala: “Primeiro pergunta o que ele precisa.”

```json
{"nova": true, "fixada": {"rotulo": "1/3", "tom": "certo", "texto": "Pergunta o que ele precisa"}, "mensagens": [{"de": "outro", "em": 4.86, "digitando": 0, "texto": "Oi! Quanto custa?"}, {"de": "eu", "em": 5.36, "digitando": 0.4, "texto": "Me conta: o que você precisa?"}, {"de": "outro", "em": 6.45, "digitando": 0.5, "texto": "É pra presente."}]}
```

## 4. `balao` (bloco próprio do modelo): 6.83–9.93 s
Fala: “Depois, mostra como o seu produto resolve isso.”

```json
{"legenda": false, "fixada": {"rotulo": "2/3", "tom": "certo", "texto": "Mostra como o seu produto resolve isso"}, "mensagem": {"de": "eu", "tipo": "cartao", "em": 7.59, "digitando": 0.5, "desenho": "presente", "titulo": "Seu produto", "linha": "Resolve isso", "linhaEm": 8.98}}
```

## 5. `conversa` (assinatura): 9.93–11.95 s
Fala: “Só então fala o preço.”

```json
{"fixada": {"rotulo": "3/3", "tom": "certo", "texto": "Só então fala o preço"}, "mensagens": [{"de": "eu", "tipo": "preco", "em": 11.17, "digitando": 0.7, "valor": "R$ 197", "condicao": {"em": 12.21, "texto": "Pagando hoje, frete grátis", "desenho": "frete"}}]}
```

## 6. `conversa` (assinatura): 11.95–15.75 s
Fala: “com uma condição. Pagando hoje, o frete é grátis. Resposta”

```json
{"fixada": {"rotulo": "3/3", "tom": "certo", "texto": "Com uma condição"}, "mensagens": [{"de": "outro", "em": 14.8, "digitando": 0.4, "texto": "Fechado!", "reacao": {"em": 15.08, "icone": "check"}}, {"de": "eu", "tipo": "confirmacao", "em": 15.36, "digitando": 0, "valor": "R$ 197,00", "texto": "Pagamento recebido"}]}
```

## 7. `contraste` (assinatura): 15.75–18.45 s
Fala: “seca vira vácuo. conversa vira venda.”

```json
{"esquerdaEm": 15.8, "direitaEm": 17.17, "esquerda": {"titulo": "Resposta seca", "mensagens": [{"de": "eu", "em": 15.4, "texto": "R$ 197.", "esfriaEm": 15.0, "vistoEm": 15.0}], "resultado": {"em": 16.53, "texto": "vácuo", "tipo": "ruim"}, "viraEm": 16.19}, "direita": {"titulo": "Conversa", "mensagens": [{"de": "outro", "em": 17.2, "texto": "Fechado!"}], "resultado": {"em": 17.96, "texto": "venda", "tipo": "bom", "valor": "R$ 197", "rotulo": "Pago"}, "viraEm": 17.63}}
```

## 8. `cta` (bloco universal): 18.45–20.52 s
Fala: “Salva e testa hoje.”

```json
{"texto": "Salva e testa hoje.", "toqueEm": 18.95, "reacao": {"em": 19.85, "icone": "coracao"}, "icone": "salvar"}
```
