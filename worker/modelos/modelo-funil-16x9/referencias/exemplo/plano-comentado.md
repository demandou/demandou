# Exemplo do modelo funil: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `gancho` (bloco próprio do modelo): 0.00–2.10 s
Fala: “Por que seu anúncio não vende?”

```json
{"texto": "Por que seu anúncio não vende?", "destaque": "não vende?"}
```

## 2. `funil` (assinatura): 2.10–8.75 s
Fala: “Olha este exemplo: Mil pessoas veem o anúncio, cem clicam. 10 chegam ao checkout Uma compra. O problema”

```json
{"rotulo": "Exemplo", "etapas": [{"em": 3.25, "valor": 1000, "texto": "veem o anúncio"}, {"em": 5.1, "valor": 100, "texto": "clicam", "passo": "clique"}, {"em": 6.24, "valor": 10, "texto": "chegam ao checkout", "passo": "página"}, {"em": 7.97, "valor": 1, "texto": "compra", "plural": "compras", "passo": "checkout"}]}
```

## 3. `frase` (bloco universal): 8.75–10.70 s
Fala: “O problema quase nunca é o anúncio”

```json
{"texto": "O problema quase nunca é o anúncio", "destaque": "O problema", "risco": "anúncio"}
```

## 4. `conserto` (assinatura): 10.70–16.36 s
Fala: “É o caminho entre o clique e a compra Melhora a página e o checkout antes de gastar mais com tráfego.”

```json
{"caminho": {"de": 1, "ate": 3, "em": 10.83, "ateEm": 12.44, "texto": "o caminho"}, "alertas": [{"etapa": 2, "em": 11.81}, {"etapa": 3, "em": 12.44}], "consertos": [{"etapa": 2, "em": 13.29, "taxa": 20}, {"etapa": 3, "em": 13.87, "taxa": 20}], "depois": {"texto": "+ R$ em tráfego", "em": 14.84, "carimbo": "depois", "carimboEm": 15.56}}
```

## 5. `cta` (bloco universal): 16.36–18.84 s
Fala: “Salva e revisa o seu funil hoje.”

```json
{"texto": "Salva e revisa o seu funil hoje", "icone": "salvar", "destaque": "funil"}
```
