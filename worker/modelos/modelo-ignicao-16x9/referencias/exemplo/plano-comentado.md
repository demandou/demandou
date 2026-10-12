# Exemplo do modelo ignicao: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `ignicao` (bloco próprio do modelo): 0.00–3.60 s
Fala: “Três luzes do painel que você nunca pode ignorar.”

```json
{"ignicaoEm": 0.32, "titulo": "3 luzes do painel", "apoio": "que você nunca pode ignorar"}
```

## 2. `luzes` (assinatura): 3.60–9.38 s
Fala: “a do óleo, que parece uma lamparina, a da temperatura, um termômetro, e a da bateria.”

```json
{"itens": [{"em": 3.8, "icone": "oleo", "nome": "Óleo", "detalhe": "Parece uma lamparina", "detalheEm": 5.31}, {"em": 6.24, "icone": "temperatura", "nome": "Temperatura", "detalhe": "Um termômetro", "detalheEm": 7.52}, {"em": 8.62, "icone": "bateria", "nome": "Bateria"}]}
```

## 3. `parada` (assinatura): 9.38–15.09 s
Fala: “Óleo ou temperatura acesos em vermelho encosta com segurança e desliga o motor.”

```json
{"icones": ["oleo", "temperatura"], "condicao": "Óleo ou temperatura acesos em vermelho", "passos": [{"em": 12.28, "texto": "Encosta com segurança", "acao": "encostar"}, {"em": 13.89, "texto": "Desliga o motor", "acao": "desligar"}]}
```

## 4. `rota` (assinatura): 15.09–18.04 s
Fala: “Bateria acesa vai direto para o mecânico”

```json
{"icone": "bateria", "condicao": "Bateria acesa", "instrucao": "Vai direto pro mecânico", "destino": "Mecânico", "rotaEm": 16.61, "chegadaEm": 17.4, "pino": "chave"}
```

## 5. `cta` (bloco universal): 18.04–20.36 s
Fala: “Salva e manda para quem dirige.”

```json
{"texto": "Salva e manda pra quem dirige"}
```
