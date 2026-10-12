# Exemplo do modelo manchete: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `manchete` (bloco próprio do modelo): 0.00–3.40 s
Fala: “O Google mostrou um óculos que traduz conversas na hora”

```json
{"em": 0.06, "imagem": {"id": "oculos", "efeito": "aproximar"}, "tarja": "Fim do intérprete?", "tarjaAte": 5.79, "angulos": [{"em": 1.83, "zoom": 1.3, "foco": {"x": 0.33, "y": 0.5}, "efeito": "aproximar"}], "credito": "Foto: Xuthoria · CC BY-SA 4.0"}
```

## 2. `insercao` (assinatura): 3.40–5.79 s
Fala: “Você fala em português e a outra pessoa lê a”

```json
{"em": 3.54, "imagem": {"id": "conversa", "efeito": "aproximar"}, "angulos": [{"em": 4.76, "zoom": 1.3, "foco": {"x": 0.68, "y": 0.42}, "efeito": "aproximar"}], "credito": "imagem ilustrativa"}
```

## 3. `insercao` (assinatura): 5.79–8.43 s
Fala: “tradução em inglês, direto na lente. Imagina”

```json
{"em": 5.79, "imagem": {"id": "lente", "efeito": "aproximar"}, "angulos": [{"em": 7.74, "zoom": 1.35, "foco": {"x": 0.8, "y": 0.6}, "efeito": "aproximar"}], "credito": "imagem ilustrativa"}
```

## 4. `insercao` (assinatura): 8.43–11.77 s
Fala: “viajar sem precisar de intérprete. Será que isso chega rápido ao”

```json
{"em": 8.43, "imagem": {"id": "aeroporto", "efeito": "aproximar"}, "angulos": [{"em": 9.76, "zoom": 1.35, "foco": {"x": 0.72, "y": 0.55}, "efeito": "aproximar"}], "credito": "imagem ilustrativa"}
```

## 5. `insercao` (assinatura): 11.77–15.12 s
Fala: “Brasil? Comenta o que você acha, e dá dois toques.”

```json
{"em": 11.77, "imagem": {"id": "brasil", "efeito": "aproximar"}, "angulos": [{"em": 13.03, "zoom": 1.3, "foco": {"x": 0.75, "y": 0.3}, "efeito": "afastar"}], "credito": "Foto: Otávio Nogueira · CC BY 2.0"}
```
