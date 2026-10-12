# Exemplo do modelo etapas na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. **A folha e o vídeo são da edição vertical**; o `plano.json` é o mesmo plano, já no quadro deitado (1920×1080): os campos de cada momento não mudam, só onde cada coisa fica. No deitado, com a composição da aula 9 do curso: a `abertura` mostra a pessoa em tela cheia com o cabeçalho numa coluna ao lado do rosto; nas `etapa` e na `grade` a pessoa vai para a moldura da direita (rosto centralizado e acompanhado) e a gravação de tela ocupa o quadro da esquerda, com a pílula na borda de baixo dela; o `cta` volta à tela cheia. No vídeo completo, que é mais longo, a tela cheia é a base: entre as ideias a pessoa fica sem momento por alguns segundos, e cada bloco continua entrando na palavra dita.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.09 s
Fala: “Monta o prompt em quatro peças.”

```json
{"texto": "Prompt perfeito", "sub": "Em 4 peças", "etapas": 4, "icone": "comentar"}
```

## 2. `etapa` (assinatura): 2.09–4.60 s
Fala: “papel haja como um nutricionista.”

```json
{"rotulo": "Papel", "telas": [{"imagem": {"id": "nutricionista"}, "em": 2.09, "rolar": [0, 0.12]}, {"imagem": {"id": "nutricionista"}, "em": 2.55, "rolar": [0.3, 0.4]}, {"imagem": {"id": "nutricionista"}, "em": 3.1, "rolar": [0.55, 0.7]}, {"imagem": {"id": "ia"}, "em": 3.65, "rolar": [0.05, 0.2]}]}
```

## 3. `etapa` (assinatura): 4.60–7.20 s
Fala: “tarefa Monte um cardápio da semana.”

```json
{"rotulo": "Tarefa", "telas": [{"imagem": {"id": "cardapio"}, "em": 4.6, "rolar": [0, 0.1]}, {"imagem": {"id": "cardapio"}, "em": 5.15, "rolar": [0.3, 0.42]}, {"imagem": {"id": "cardapio"}, "em": 5.75, "rolar": [0.55, 0.68]}, {"imagem": {"id": "cardapio"}, "em": 6.4, "rolar": [0.75, 0.9]}]}
```

## 4. `etapa` (assinatura): 7.20–10.33 s
Fala: “Com o texto. Sou vegetariano e treino de manhã.”

```json
{"rotulo": "Contexto", "telas": [{"imagem": {"id": "vegetarianismo"}, "em": 7.2, "rolar": [0, 0.1]}, {"imagem": {"id": "vegetarianismo"}, "em": 7.75, "rolar": [0.3, 0.4]}, {"imagem": {"id": "vegetarianismo"}, "em": 8.3, "rolar": [0.55, 0.7]}, {"imagem": {"id": "musculacao"}, "em": 9.2, "rolar": [0, 0.1]}, {"imagem": {"id": "musculacao"}, "em": 9.7, "rolar": [0.35, 0.5]}]}
```

## 5. `etapa` (assinatura): 10.33–12.72 s
Fala: “Formato. em tabela com as calorias.”

```json
{"rotulo": "Formato", "telas": [{"imagem": {"id": "tabela"}, "em": 10.33, "rolar": [0, 0.1]}, {"imagem": {"id": "tabela"}, "em": 10.85, "rolar": [0.1, 0.25]}, {"imagem": {"id": "caloria"}, "em": 11.45, "rolar": [0.1, 0.2]}, {"imagem": {"id": "caloria"}, "em": 12, "rolar": [0.4, 0.55]}]}
```

## 6. `grade` (assinatura): 12.72–16.16 s
Fala: “Com essas quatro peças, a resposta muda completamente.”

```json
{"telas": [{"imagem": {"id": "nutricionista"}, "rolar": [0.05, 0.05]}, {"imagem": {"id": "cardapio"}, "rolar": [0.3, 0.3]}, {"imagem": {"id": "vegetarianismo"}, "rolar": [0.4, 0.4]}, {"imagem": {"id": "tabela"}, "rolar": [0.1, 0.1]}]}
```

## 7. `cta` (bloco universal): 16.16–18.04 s
Fala: “Salva e testa agora.”

```json
{"texto": "Salva e testa agora", "icone": "salvar"}
```
