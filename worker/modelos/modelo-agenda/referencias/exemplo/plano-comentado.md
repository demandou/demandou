# Exemplo do modelo agenda: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `gancho` (bloco próprio do modelo): 0.00–3.20 s
Fala: “Não consegue focar Testa técnica Pomodoro”

```json
{"pergunta": "Não consegue focar?", "distracoes": [{"texto": "E-mail novo", "icone": "email", "em": 0.42}, {"texto": "12 mensagens", "icone": "mensagem", "em": 0.68}, {"texto": "Vídeo curto", "icone": "video", "em": 0.95}, {"texto": "Notícias", "icone": "noticia", "em": 1.18}], "resposta": "Técnica Pomodoro", "respostaRotulo": "Testa a", "varreEm": 1.43}
```

## 2. `blocos` (assinatura): 3.20–6.50 s
Fala: “25 minutos de foco total sem celular.”

```json
{"blocos": [{"categoria": "foco", "minutos": 25, "em": 3.55, "titulo": "Foco total"}], "cronometro": {"em": 4.64, "ate": 6.3}, "sem": {"texto": "Celular", "icone": "celular", "em": 5.38, "riscaEm": 5.78}}
```

## 3. `blocos` (assinatura): 6.50–8.73 s
Fala: “Depois, cinco minutos de pausa.”

```json
{"blocos": [{"categoria": "pausa", "minutos": 5, "em": 6.98, "titulo": "Pausa"}], "cronometro": {"em": 7.47, "ate": 8.6}}
```

## 4. `ciclos` (assinatura): 8.73–13.22 s
Fala: “A cada quatro ciclos, uma pausa longa, de 15 a 30 minutos.”

```json
{"itens": [{"em": 9.06}, {"em": 9.3}, {"em": 9.52}, {"em": 9.74}], "rotulo": "ciclos", "rotuloEm": 9.58, "final": {"categoria": "longa", "titulo": "Pausa longa", "em": 10.5, "minutos": 15, "minutosEm": 11.51, "maxMinutos": 30, "maxEm": 11.95}}
```

## 5. `frase` (bloco universal): 13.22–16.55 s
Fala: “Parece simples, e é exatamente por isso que funciona.”

```json
{"texto": "Parece simples. É exatamente por isso que funciona.", "destaque": "funciona"}
```

## 6. `cta` (bloco universal): 16.55–19.32 s
Fala: “Salva e testa hoje no seu trabalho.”

```json
{"texto": "Testa hoje no seu trabalho", "rotulo": "Lembrete", "icone": "salvar", "acaoEm": 16.7, "etiquetas": [{"texto": "Hoje", "icone": "calendario", "em": 17.29}, {"texto": "No trabalho", "icone": "maleta", "em": 17.97}]}
```
