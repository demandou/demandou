# Exemplo do modelo pulso: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `gancho` (bloco próprio do modelo): 0.00–1.92 s
Fala: “Quer correr mais sem se machucar?”

```json
{"texto": "Quer correr mais sem se machucar?", "alertaEm": 1.36}
```

## 2. `zonas` (assinatura): 1.92–3.94 s
Fala: “Usa zonas de frequência cardíaca”

```json
{"titulo": "Zonas de frequência cardíaca", "acendeEm": 2.42, "passo": 0.28, "escala": ["leve", "máximo"]}
```

## 3. `zona` (assinatura): 3.94–7.70 s
Fala: “A zona 2 é aquela em que você consegue conversar enquanto corre”

```json
{"zona": 2, "em": 4.53, "titulo": "Zona 2", "balao": {"texto": "dá pra conversar", "em": 6.24}, "leituras": [{"tipo": "bpm", "valor": "132"}, {"tipo": "pace", "valor": "6:20"}]}
```

## 4. `divisao` (assinatura): 7.70–13.41 s
Fala: “É nela que você deve fazer a maior parte dos treinos, uns 80%. os outros 20 mais fortes.”

```json
{"rotulo": "Seus treinos", "zona": {"numero": 2, "em": 8.1}, "casas": 10, "partes": [{"pct": 80, "texto": "maior parte", "zona": 2, "em": 10.63, "encheEm": 8.96}, {"pct": 20, "texto": "mais fortes", "zona": 4, "em": 12.01}], "unidade": "cada casa é um treino"}
```

## 5. `rota` (assinatura): 13.41–16.31 s
Fala: “Devagar no dia-a-dia Forte de vez em quando.”

```json
{"trechos": [{"texto": "Devagar no dia a dia", "zona": 2, "em": 13.7, "ate": 14.9, "pace": "6:20", "bpm": 128}, {"texto": "Forte de vez em quando", "zona": 4, "em": 15.24, "ate": 15.85, "pace": "4:40", "bpm": 165}]}
```

## 6. `cta` (bloco universal): 16.31–18.52 s
Fala: “Salva e testa na próxima corrida.”

```json
{"rotulo": "Próximo treino", "acaoEm": 16.47, "texto": "Testa na próxima corrida", "icone": "salvar"}
```
