# Exemplo do modelo curriculo: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.44 s
Fala: “Três erros que derrubam o seu currículo.”

```json
{"rotulo": "Revisão de currículo", "linhas": ["Três erros que", "derrubam o seu", "currículo"], "circulo": "Três", "sublinhado": "derrubam", "texto": "Três erros que derrubam o seu currículo"}
```

## 2. `paginas` (bloco próprio do modelo): 2.44–4.00 s
Fala: “Mais de duas páginas”

```json
{"erro": 1, "resumo": "2 páginas", "total": 3, "ideal": 2, "xEm": 2.87, "nota": {"texto": "máx. 2 páginas", "em": 3.3}}
```

## 3. `riscar` (assinatura): 4.00–7.85 s
Fala: “Um objetivo genérico, tipo "busco crescer na empresa".”

```json
{"erro": 2, "resumo": "Objetivo", "secao": "Objetivo", "frase": "Busco crescer na empresa.", "riscoEm": 7.25, "nota": {"texto": "genérico", "em": 4.6}}
```

## 4. `marcar` (assinatura): 7.85–10.46 s
Fala: “e listar tarefas em vez de resultados.”

```json
{"erro": 3, "resumo": "Resultados", "secao": "Experiência", "subtitulo": "Vendedor · 2021 a 2024", "linhas": [{"texto": "Responsável pelas vendas", "em": 7.95}, {"texto": "Atendimento ao cliente", "em": 8.08}, {"texto": "Emissão de relatórios", "em": 8.21}], "nota": {"texto": "tarefas", "em": 8.25}, "pergunta": {"texto": "resultados?", "em": 9.3}}
```

## 5. `reescrever` (assinatura): 10.46–15.70 s
Fala: “Troca responsável pelas vendas por aumentei as vendas em 20%.”

```json
{"antes": "Responsável pelas vendas", "depois": "Aumentei as vendas em 20%", "destaque": "20%", "aceitaEm": 15.25}
```

## 6. `cronometro` (bloco próprio do modelo): 15.70–18.30 s
Fala: “Recrutador lê em segundos. Facilita.”

```json
{"frase": "Recrutador lê em segundos", "voltaEm": 17.3, "fim": {"texto": "Facilita.", "em": 17.56}}
```

## 7. `cta` (bloco universal): 18.30–20.76 s
Fala: “Salva e revisa o seu hoje.”

```json
{"texto": "Salva e revisa o seu hoje.", "icone": "salvar"}
```
