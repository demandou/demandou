# Exemplo do modelo mapa: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `mapa` (assinatura): 0.00–2.29 s
Fala: “estuda muito e esquece tudo”

```json
{"centro": "conteúdo", "ramos": [{"texto": "Português", "em": 0.62}, {"texto": "Direito", "em": 0.8}, {"texto": "Lógica", "em": 0.98}, {"texto": "Informática", "em": 1.16}], "titulo": "Estuda muito e esquece tudo?", "apagado": "esquece tudo?", "esqueceEm": 1.4}
```

## 2. `titulo` (bloco próprio do modelo): 2.29–3.88 s
Fala: “usa a revisão espaçada.”

```json
{"rotulo": "o método", "origem": "conteúdo", "apoio": "Usa a", "texto": "revisão espaçada", "destaque": "espaçada", "intervalos": [0, 1, 7, 30], "zero": "hoje"}
```

## 3. `curva` (assinatura): 3.88–8.93 s
Fala: “Estudou hoje, revisa amanhã, depois em sete dias, depois em trinta.”

```json
{"rotulo": "curva do esquecimento", "titulo": "Estudou hoje?", "estudoEm": 3.97, "revisoes": [{"dia": 1, "em": 5.31}, {"dia": 7, "em": 6.66}, {"dia": 30, "em": 8.06}], "eixo": "memória", "unidade": "dia", "unidades": "dias", "inicio": "hoje", "sem": "sem revisão", "com": "com revisão"}
```

## 4. `contador` (bloco próprio do modelo): 8.93–11.05 s
Fala: “Cada revisão leva poucos minutos”

```json
{"rotulo": "minutos por revisão", "texto": "Cada revisão leva poucos minutos", "destaque": "poucos minutos", "valor": 5, "unidade": "min", "em": 10.13}
```

## 5. `barras` (bloco próprio do modelo): 11.05–13.37 s
Fala: “e fixa o conteúdo por muito mais tempo.”

```json
{"texto": "fixa o conteúdo por muito mais tempo", "destaque": "muito mais tempo", "no": "conteúdo", "fixaEm": 11.6, "barras": [{"texto": "sem revisão", "valor": 0.32, "em": 12.07}, {"texto": "com revisão", "valor": 1.12, "em": 12.3, "forte": true}], "eixo": "tempo na memória"}
```

## 6. `cartoes` (bloco próprio do modelo): 13.37–16.94 s
Fala: “Junta isso com questões e você para de recomeçar do zero”

```json
{"rotulo": "questões", "texto": "Junta isso com questões", "cartoes": [{"pergunta": "Quando revisar?", "resposta": "Amanhã, 7 e 30 dias", "em": 14.25}, {"pergunta": "Quanto tempo leva?", "resposta": "Poucos minutos", "em": 15.06}, {"pergunta": "Como fixar?", "resposta": "Revisão + questões", "em": 15.83}], "rodape": "Você para de recomeçar do zero", "riscado": "recomeçar do zero", "riscaEm": 16.6}
```

## 7. `cta` (bloco universal): 16.94–18.96 s
Fala: “Salva e começa hoje!”

```json
{"texto": "Salva e começa hoje", "destaque": "hoje", "salvaEm": 17.1, "icone": "salvar"}
```
