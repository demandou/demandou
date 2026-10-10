# Exemplo do modelo raiox: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–4.22 s
Fala: “Home Office acabando com as suas costas Ajusta três coisas.”

```json
{"texto": "Home office acabando com as suas costas?", "destaque": "costas?", "tensaoEm": 2.04, "chamada": {"texto": "Ajusta 3 coisas", "em": 2.86, "itens": [{"em": 3.22}, {"em": 3.42}, {"em": 3.62}]}}
```

## 2. `ajuste` (assinatura): 4.22–7.23 s
Fala: “a tela na altura dos olhos, para não curvar o pescoço,”

```json
{"titulo": "Tela na altura dos olhos", "apoio": "pra não curvar o pescoço", "vista": "tela", "passos": [{"tipo": "tensao", "alvo": "pescoco", "rotulo": "Pescoço", "em": 4.55, "apagaEm": 6.95}, {"tipo": "destaque", "alvo": "tela", "rotulo": "Tela", "em": 4.32}, {"tipo": "linha", "linha": "olhos", "em": 4.75}, {"tipo": "corrige", "parte": "tela", "em": 4.85, "dur": 0.95}, {"tipo": "corrige", "parte": "pescoco", "em": 5.6, "dur": 1.2}, {"tipo": "corrige", "parte": "tronco", "em": 5.75, "dur": 1.1}, {"tipo": "linha", "linha": "prumo", "em": 6.5}]}
```

## 3. `ajuste` (assinatura): 7.23–10.59 s
Fala: “os pés apoiados no chão com os joelhos em 90 graus,”

```json
{"titulo": "Pés apoiados no chão", "apoio": "com os joelhos em 90°", "vista": "pernas", "passos": [{"tipo": "tensao", "alvo": "lombar", "rotulo": "Lombar", "em": 7.6, "apagaEm": 8.55}, {"tipo": "destaque", "alvo": "pes", "rotulo": "Pés", "em": 7.32}, {"tipo": "corrige", "parte": "pernas", "em": 7.62, "dur": 0.9}, {"tipo": "apoio", "alvo": "pes", "em": 8.33}, {"tipo": "destaque", "alvo": "joelho", "em": 9.12}, {"tipo": "angulo", "alvo": "joelho", "em": 9.55}]}
```

## 4. `ajuste` (assinatura): 10.59–13.21 s
Fala: “e os cotovelos apoiados perto do corpo”

```json
{"titulo": "Cotovelos apoiados", "apoio": "perto do corpo", "vista": "bracos", "passos": [{"tipo": "tensao", "alvo": "ombro", "rotulo": "Ombro", "em": 10.9, "apagaEm": 12.85}, {"tipo": "destaque", "alvo": "cotovelo", "rotulo": "Cotovelo", "em": 10.73}, {"tipo": "corrige", "parte": "antebraco", "em": 11.47, "dur": 0.7}, {"tipo": "apoio", "alvo": "antebraco", "rotulo": "Apoio", "em": 11.7}, {"tipo": "distancia", "alvo": "cotovelo", "em": 12.1}, {"tipo": "corrige", "parte": "cotovelo", "em": 12.36, "dur": 0.7}]}
```

## 5. `pausa` (bloco próprio do modelo): 13.21–16.25 s
Fala: “A cada hora, levanta e caminha dois minutos.”

```json
{"titulo": "A cada hora, levanta e caminha 2 minutos", "relogio": {"texto": "1 h", "em": 13.31, "ate": 14.25}, "levantaEm": 14.27, "caminhaEm": 14.94, "tempo": {"texto": "2 min", "em": 15.4}}
```

## 6. `cta` (bloco universal): 16.25–18.52 s
Fala: “Salva e ajusta agora.”

```json
{"texto": "Salva e ajusta agora.", "icone": "salvar"}
```
