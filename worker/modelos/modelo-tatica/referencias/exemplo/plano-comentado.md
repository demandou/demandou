# Exemplo do modelo tatica: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.69 s
Fala: “3 dicas para fazer mais gol na pelada”

```json
{"destaque": "mais gol", "texto": "3 dicas pra fazer mais gol na pelada"}
```

## 2. `dica` (assinatura): 2.69–6.04 s
Fala: “1. Antes de a bola chegar, olha onde está o goleiro.”

```json
{"pranchetaEm": 3.25, "titulo": "Olha o goleiro", "apoio": "Antes de a bola chegar,", "campo": {"jogadores": [{"id": "9", "time": "nosso", "numero": "9", "x": 0.5, "y": 17.5}, {"id": "7", "time": "nosso", "numero": "7", "x": 9, "y": 19.2}, {"id": "4", "time": "adversario", "numero": "4", "x": -4, "y": 9}, {"id": "5", "time": "adversario", "numero": "5", "x": 7.5, "y": 10.5}, {"id": "gk", "time": "goleiro", "numero": "1", "x": 1.5, "y": 0.9}], "bola": "7", "acoes": [{"tipo": "corrida", "quem": "7", "para": {"x": 8.5, "y": 18.4}, "em": 3.4, "ate": 3.75}, {"tipo": "corrida", "quem": "9", "para": {"x": 3.5, "y": 12}, "em": 3.5, "ate": 4.3}, {"tipo": "corrida", "quem": "4", "para": {"x": -2.5, "y": 9.5}, "em": 3.6, "ate": 4.3}, {"tipo": "corrida", "quem": "5", "para": {"x": 6.8, "y": 9.4}, "em": 3.7, "ate": 4.4}, {"tipo": "passe", "de": "7", "para": "9", "em": 3.69}, {"tipo": "olhar", "quem": …
```

## 3. `dica` (assinatura): 6.04–9.87 s
Fala: “2. chuta cruzado, no canto oposto de onde a bola veio.”

```json
{"pranchetaEm": 6.8, "titulo": "Chuta cruzado", "campo": {"jogadores": [{"id": "9", "time": "nosso", "numero": "9", "x": 3.5, "y": 12}, {"id": "7", "time": "nosso", "numero": "7", "x": 8.5, "y": 18.4}, {"id": "4", "time": "adversario", "numero": "4", "x": -2.5, "y": 9.5}, {"id": "5", "time": "adversario", "numero": "5", "x": 6.8, "y": 9.4}, {"id": "gk", "time": "goleiro", "numero": "1", "x": 1.5, "y": 0.9}], "bola": "7", "acoes": [{"tipo": "passe", "de": "7", "para": "9", "em": 5.0}, {"tipo": "chute", "de": "9", "alvo": "esquerda", "em": 7.0}]}, "gol": {"em": 7.85, "goleiro": 0.3, "bola": "esquerda-baixo", "atacante": "9", "acoes": [{"tipo": "zona", "zonas": ["esquerda-alto", "esquerda-baixo"], "rotulo": "Canto oposto", "em": 8.41}, {"tipo": "origem", "lado": "direita", "rotulo": "A bola veio daqui", "em": 8.95}]}}
```

## 4. `dica` (assinatura): 9.87–13.64 s
Fala: “3 rasteiro, que bola baixa é mais difícil de defender.”

```json
{"pranchetaEm": 10.6, "titulo": "Rasteiro", "apoio": "Bola baixa é mais difícil de defender", "gol": {"em": 10.6, "goleiro": 0, "atacante": "9", "acoes": [{"tipo": "zona", "zonas": ["esquerda-baixo", "centro-baixo", "direita-baixo"], "em": 11.0}, {"tipo": "chute", "alvo": "esquerda-baixo", "em": 11.75}, {"tipo": "defesa", "lado": "esquerda", "em": 12.2}, {"tipo": "zona", "zonas": ["esquerda-baixo"], "rotulo": "Difícil de defender", "em": 12.62}]}}
```

## 5. `resumo` (bloco próprio do modelo): 13.64–16.13 s
Fala: “Treina isso no próximo jogo e me conta o resultado.”

```json
{"titulo": "Treina isso no próximo jogo", "itens": [{"texto": "Olha o goleiro", "em": 13.95}, {"texto": "Chuta no canto oposto", "em": 14.22}, {"texto": "Rasteiro", "em": 14.5}], "resultado": {"texto": "Me conta o resultado", "em": 14.99}}
```

## 6. `cta` (bloco universal): 16.13–17.80 s
Fala: “Me segue para mais dicas.”

```json
{"texto": "Me segue pra mais dicas", "icone": "seguir"}
```
