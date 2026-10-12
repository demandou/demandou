# Exemplo do modelo agenda na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**A folha `quadros.jpg` é do exemplo editado no vertical (1080×1920).** O `plano.json` ao lado já está no quadro deitado (1920×1080): os momentos, os campos e os tempos são os mesmos nos dois formatos, e quem decide onde cada coisa fica é o template. Em cada momento abaixo, a linha "No 16:9" diz como ele sai no quadro deitado, pela aula 9 do curso: a pessoa em tela cheia com o cartão ao lado do peito, ou numa moldura à direita da folha com o conteúdo no quadro à esquerda.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `gancho` (bloco próprio do modelo): 0.00–3.20 s
Fala: “Não consegue focar Testa técnica Pomodoro”

No 16:9: a pessoa em tela cheia; a pergunta se monta num cartão branco ao lado do peito (à esquerda dela), os avisos se amontoam embaixo do cartão e são varridos para fora quando a resposta é dita.

```json
{"pergunta": "Não consegue focar?", "distracoes": [{"texto": "E-mail novo", "icone": "email", "em": 0.42}, {"texto": "12 mensagens", "icone": "mensagem", "em": 0.68}, {"texto": "Vídeo curto", "icone": "video", "em": 0.95}, {"texto": "Notícias", "icone": "noticia", "em": 1.18}], "resposta": "Técnica Pomodoro", "respostaRotulo": "Testa a", "varreEm": 1.43}
```

## 2. `blocos` (assinatura): 3.20–6.50 s
Fala: “25 minutos de foco total sem celular.”

No 16:9: a pessoa vai para a moldura larga, à direita; o bloco de 25 minutos ocupa o quadro à esquerda, com a régua (09:00, 09:25) e o anel do cronômetro dentro dele, e "Celular" é riscado dentro do bloco.

```json
{"blocos": [{"categoria": "foco", "minutos": 25, "em": 3.55, "titulo": "Foco total"}], "cronometro": {"em": 4.64, "ate": 6.3}, "sem": {"texto": "Celular", "icone": "celular", "em": 5.38, "riscaEm": 5.78}}
```

## 3. `blocos` (assinatura): 6.50–8.73 s
Fala: “Depois, cinco minutos de pausa.”

No 16:9: a pessoa troca para a moldura em pé, mais baixa, e o anel conta a pausa embaixo dela; a pausa cai embaixo do foco no quadro à esquerda e o próximo ciclo já espera a lápis.

```json
{"blocos": [{"categoria": "pausa", "minutos": 5, "em": 6.98, "titulo": "Pausa"}], "cronometro": {"em": 7.47, "ate": 8.6}}
```

## 4. `ciclos` (assinatura): 8.73–13.22 s
Fala: “A cada quatro ciclos, uma pausa longa, de 15 a 30 minutos.”

No 16:9: a pessoa vai para a moldura pequena do canto, com o contador de ciclos embaixo dela; os quatro ciclos e a pausa longa ocupam o quadro à esquerda, com os horários na régua.

```json
{"itens": [{"em": 9.06}, {"em": 9.3}, {"em": 9.52}, {"em": 9.74}], "rotulo": "ciclos", "rotuloEm": 9.58, "final": {"categoria": "longa", "titulo": "Pausa longa", "em": 10.5, "minutos": 15, "minutosEm": 11.51, "maxMinutos": 30, "maxEm": 11.95}}
```

## 5. `frase` (bloco universal): 13.22–16.55 s
Fala: “Parece simples, e é exatamente por isso que funciona.”

No 16:9: a pessoa na moldura maior, à direita; a agenda inteira vira a linha do dia no alto do quadro à esquerda, a marcação a conclui bloco a bloco e a frase se monta embaixo dela.

```json
{"texto": "Parece simples. É exatamente por isso que funciona.", "destaque": "funciona"}
```

## 6. `cta` (bloco universal): 16.55–19.32 s
Fala: “Salva e testa hoje no seu trabalho.”

No 16:9: a pessoa volta para a tela cheia; o cartão de lembrete fica ao lado do peito, com o botão, o dia em miniatura e as etiquetas.

```json
{"texto": "Testa hoje no seu trabalho", "rotulo": "Lembrete", "icone": "salvar", "acaoEm": 16.7, "etiquetas": [{"texto": "Hoje", "icone": "calendario", "em": 17.29}, {"texto": "No trabalho", "icone": "maleta", "em": 17.97}]}
```
