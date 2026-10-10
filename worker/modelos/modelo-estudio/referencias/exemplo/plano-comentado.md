# Exemplo do modelo estudio: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.48 s
Fala: “A pergunta que mais mudou a minha carreira foi simples:”

```json
{"capitulo": "A pergunta", "texto": "A pergunta que mais mudou a minha carreira", "destaque": "mudou a minha carreira"}
```

## 2. `pergunta` (bloco universal): 3.48–6.24 s
Fala: “O que você faria se ninguém estivesse olhando?”

```json
{"texto": "O que você faria se ninguém estivesse olhando?", "destaque": "ninguém estivesse olhando?"}
```

## 3. `resposta` (assinatura): 6.24–9.43 s
Fala: “Eu respondi: escreveria todos os dias”

```json
{"capitulo": "A resposta", "texto": "Escreveria todos os dias.", "destaque": "todos os dias.", "rotuloEm": 6.35, "fileira": {"itens": ["D", "S", "T", "Q", "Q", "S", "S"], "em": 8.4}}
```

## 4. `trilha` (assinatura): 9.43–15.19 s
Fala: “Comecei com 10 minutos. Um ano depois, eram 300 textos e o primeiro cliente,”

```json
{"legenda": true, "capitulo": "Um ano depois", "inicio": {"em": 10.07, "valor": 10, "unidade": "minutos por dia", "rotulo": "Dia 1", "relogio": true}, "contagem": {"em": 11.14, "ate": 13.29, "valor": 300, "unidade": "textos", "rotulo": "1 ano"}, "marco": {"em": 13.96, "texto": "1º cliente"}}
```

## 5. `citacao` (bloco próprio do modelo): 15.19–18.33 s
Fala: “Consistência não é talento É agenda.”

```json
{"capitulo": "A lição", "texto": "Consistência não é talento, é agenda.", "risca": "talento,", "destaque": "é agenda."}
```

## 6. `player` (bloco próprio do modelo): 18.33–22.36 s
Fala: “Esse é o corte do episódio de hoje Segue para ouvir o resto.”

```json
{"capitulo": "O episódio", "rotulo": "O corte do episódio de hoje", "titulo": "Consistência é agenda", "chamada": "Segue pra ouvir o resto", "seguirEm": 20.79, "restoEm": 21.44}
```
