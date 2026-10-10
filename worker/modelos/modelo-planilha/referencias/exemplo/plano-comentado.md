# Exemplo do modelo planilha: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–4.45 s
Fala: “3 despesas que podem diminuir o seu imposto de renda na declaração completa”

```json
{"texto": "3 despesas que podem diminuir o seu imposto de renda", "destaque": "imposto de renda", "selo": {"texto": "na declaração completa", "confirmaEm": 4.0}, "aba": {"nome": "Completa", "em": 4.0}}
```

## 2. `linha` (assinatura): 4.45–9.55 s
Fala: “Saúde! consultas, exames e plano de saúde, sem limite de valor.”

```json
{"item": {"texto": "Saúde", "em": 4.57}, "exemplos": [{"texto": "Consultas", "em": 5.5}, {"texto": "Exames", "em": 6.4}, {"texto": "Plano de saúde", "em": 7.14}], "marca": {"em": 7.95}, "detalhe": {"texto": "sem limite", "em": 8.4}, "destaque": {"tipo": "infinito", "rotulo": "Saúde", "icone": "saude", "texto": "sem limite de valor", "em": 8.5}}
```

## 3. `linha` (assinatura): 9.55–13.88 s
Fala: “Educação. escola e faculdade com limite anual por pessoa.”

```json
{"item": {"texto": "Educação", "em": 9.63}, "exemplos": [{"texto": "Escola", "em": 10.66}, {"texto": "Faculdade", "em": 11.09}], "marca": {"em": 11.8}, "detalhe": {"texto": "anual por pessoa", "em": 12.5}, "destaque": {"tipo": "regras", "rotulo": "Educação", "icone": "educacao", "linhas": [{"texto": "limite anual", "icone": "calendario", "em": 12.26}, {"texto": "por pessoa", "icone": "pessoa", "em": 12.85}]}}
```

## 4. `linha` (assinatura): 13.88–19.17 s
Fala: “Previdência Privada do tipo PGBL até 12% da sua renda tributável.”

```json
{"item": {"texto": "Previdência", "em": 13.97, "etiqueta": "privada · PGBL"}, "marca": {"em": 16.5}, "formula": {"texto": "=12% × RENDA_TRIBUTÁVEL", "em": 16.85, "enterEm": 18.75}, "detalhe": {"texto": "até 12% da renda", "em": 18.75}, "destaque": {"tipo": "pizza", "rotulo": "Previdência privada", "icone": "previdencia", "pct": 12, "em": 16.89, "texto": "da renda tributável", "textoEm": 17.86}}
```

## 5. `preencher` (assinatura): 19.17–21.25 s
Fala: “Guarda todos os comprovantes.”

```json
{"texto": "Guarda todos os comprovantes", "icone": "comprovante", "marca": "clipe", "em": 19.5}
```

## 6. `cta` (bloco universal): 21.25–23.24 s
Fala: “Salva para a próxima declaração.”

```json
{"texto": "Salva pra próxima declaração", "destaque": "Salva", "icone": "salvar", "iconeEm": 21.45, "aba": {"nome": "Próxima declaração", "em": 21.7}}
```
