# Exemplo do modelo kit: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.00 s
Fala: “Para gravar vídeo bom com o celular,”

```json
{"texto": "Para gravar vídeo bom com o celular", "destaque": "vídeo bom", "em": 0.09}
```

## 2. `kit` (assinatura): 2.00–14.40 s
Fala: “você só precisa de quatro coisas: um tripé para a imagem não tremer. Um microfone de lapela, porque o som importa mais que a imagem, uma luz de frente, e um controle remoto Bluetooth. Tudo junto custa menos que uma câmera.”

```json
{"lugaresEm": 2.45, "afastarEm": 12.45, "total": "Tudo junto custa menos que uma câmera", "totalEm": 13.0, "itens": [{"nome": "Tripé", "em": 4.29, "detalhe": "para a imagem não tremer", "detalheEm": 5.06, "imagem": {"id": "tripe"}}, {"nome": "Microfone de lapela", "em": 6.29, "detalhe": "o som importa mais que a imagem", "detalheEm": 7.83, "imagem": {"id": "microfone"}}, {"nome": "Luz de frente", "em": 9.81, "imagem": {"id": "luz"}}, {"nome": "Controle remoto", "em": 10.88, "detalhe": "Bluetooth", "detalheEm": 11.8, "imagem": {"id": "controle"}}]}
```

## 3. `cta` (bloco universal): 14.45–15.76 s
Fala: “Salva essa lista.”

```json
{"texto": "Salva essa lista", "icone": "salvar", "em": 14.47}
```
