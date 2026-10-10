# Exemplo do modelo clinico: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem (feitos no vertical). Esta é a versão **deitada** (16:9, 1920×1080): o plano é o mesmo, campo por campo; o `plano.json` desta pasta já traz o quadro deitado (`largura` 1920, `altura` 1080, o rosto e a faixa de névoa medidos para ele). Em cada momento abaixo está onde ele aparece no quadro deitado, pela aula 9 do curso: a lupa na moldura da direita e o exame no quadro da esquerda.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `titulo` (bloco próprio do modelo): 0.00–2.63 s
Fala: “Você escova os dentes do jeito certo?”
No quadro deitado: tela cheia; o texto na faixa de névoa da base do quadro (reorganizado em 2 linhas largas) e o par ✓ / ✗ ao lado dele.

```json
{"linhas": ["Você escova", "os dentes do", "jeito certo?"], "enfase": "jeito certo?", "duvidaEm": 1.76}
```

## 2. `contagem` (bloco próprio do modelo): 2.63–5.27 s
Fala: “Quase todo mundo erra em três coisas:”
No quadro deitado: lupa grande à direita (`topo`); o título e os três círculos centralizados no quadro da esquerda.

```json
{"titulo": "Quase todo mundo erra em 3 coisas", "enfase": "3 coisas", "itens": [{"em": 4.29}, {"em": 4.43}, {"em": 4.57}], "marca": {"em": 4.73, "tipo": "errado"}}
```

## 3. `cronometro` (assinatura): 5.27–8.29 s
Fala: “Primeiro, escova por menos de dois minutos”
No quadro deitado: o mostrador em volta da lupa, à direita (`centro`); o "01" e o título no quadro da esquerda, na altura do mostrador.

```json
{"numero": "01", "titulo": "Escova por menos de 2 minutos", "enfase": "menos de 2 minutos", "meta": "2:00", "metaEm": 7.39, "inicio": 6.04, "para": {"em": 6.79, "fracao": 0.42}}
```

## 4. `anatomia` (assinatura): 8.29–12.12 s
Fala: “Aperta demais, e isso machuca a gengiva.”
No quadro deitado: lupa pequena no alto, à direita (`canto`), com o "02" e o título embaixo dela; o dente, o rótulo e o veredito no quadro inteiro da esquerda.

```json
{"numero": "02", "titulo": "Aperta demais", "enfase": "demais", "desenho": "dente", "acoes": [{"em": 8.61, "acao": "escova"}, {"em": 9.31, "acao": "pressao"}, {"em": 10.76, "acao": "inflama"}], "rotulos": [{"em": 10.98, "alvo": "gengiva", "texto": "gengiva", "erro": true}], "veredito": {"em": 10.79, "tipo": "errado", "texto": "Machuca a gengiva"}}
```

## 5. `anatomia` (assinatura): 12.12–16.54 s
Fala: “Terceiro, esquece o fio dental e a escova não chega entre os dentes”
No quadro deitado: lupa média à direita (`lado`); o "03" ao lado do título no alto do quadro da esquerda, os dentes, a lupa de detalhe e o veredito embaixo.

```json
{"layout": "lado", "numero": "03", "titulo": "Esquece o fio dental", "enfase": "fio dental", "desenho": "dentes", "acoes": [{"em": 13.02, "acao": "esquecido"}, {"em": 14.44, "acao": "varre"}, {"em": 15.19, "acao": "lacunas"}], "rotulos": [{"em": 15.61, "alvo": "entre", "texto": "entre os dentes", "erro": true}], "aproximar": {"em": 15.54, "alvo": "entre", "zoom": 2.2}, "veredito": {"em": 14.98, "tipo": "errado", "texto": "A escova não chega"}}
```

## 6. `checklist` (bloco próprio do modelo): 16.54–21.36 s
Fala: “O certo é dois minutos, movimento leve e fio dental todo dia.”
No quadro deitado: tela cheia; na faixa de névoa, o ✓ e "O certo" à esquerda e as três linhas ao lado.

```json
{"titulo": "O certo", "marcaEm": 16.93, "itens": [{"em": 17.19, "texto": "2 minutos", "icone": "cronometro"}, {"em": 18.46, "texto": "Movimento leve", "icone": "escova"}, {"em": 19.66, "texto": "Fio dental todo dia", "icone": "fio", "semanaEm": 20.62}]}
```

## 7. `cta` (bloco universal): 21.36–24.44 s
Fala: “Salva esse vídeo e manda para quem precisa ouvir isso.”
No quadro deitado: tela cheia; a chamada à esquerda da faixa de névoa, os dois botões e a assinatura à direita.

```json
{"texto": "Salva esse vídeo e manda para quem precisa ouvir isso", "enfase": "precisa ouvir isso", "botoes": [{"em": 21.4, "icone": "salvar"}, {"em": 22.24, "icone": "enviar"}], "assinaturaEm": 22.93}
```
