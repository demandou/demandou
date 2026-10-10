# Exemplo do modelo dossie: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.95 s
Fala: “Abri o dossiê do golpe da falsa central”

```json
{"texto": "Golpe da falsa central", "destaque": "falsa central", "em": 1.19, "abreEm": 0.31, "carimboEm": 1.02, "imagem": {"id": "central"}, "imagemEm": 2.24}
```

## 2. `quadro` (assinatura): 2.95–12.12 s
Fala: “Tudo começa com uma ligação do seu banco, Eles já sabem seu nome e seu CPF falam de um PIX suspeito e pedem outro PIX para proteger sua conta.”

```json
{"evidencias": [{"em": 3.89, "forma": "ligacao", "titulo": "Central de Segurança", "texto": "Seu banco", "textoEm": 4.78, "icone": "predio"}, {"em": 5.45, "forma": "ficha", "titulo": "Eles já sabem", "campos": [{"rotulo": "Nome", "tarja": true, "em": 6.71}, {"rotulo": "CPF", "tarja": true, "em": 7.57}]}, {"em": 8.5, "forma": "alerta", "titulo": "Central de Segurança", "texto": "Pix suspeito", "textoEm": 8.5}, {"em": 10.18, "forma": "mensagem", "titulo": "Central de Segurança", "icone": "predio", "texto": "Faça outro Pix pra proteger sua conta.", "destaque": "proteger sua conta", "destaqueEm": 11.17}]}
```

## 3. `destaque` (bloco universal): 12.12–14.70 s
Fala: “Banco nunca pede Pix por telefone.”

```json
{"texto": "Banco nunca pede Pix", "em": 12.34, "nivel": "alerta", "detalhe": "por telefone", "detalheEm": 13.67}
```

## 4. `cta` (bloco universal): 14.70–17.00 s
Fala: “Salva e manda para sua mãe!”

```json
{"texto": "Salva e manda pra sua mãe", "destaque": "sua mãe", "icone": "salvar", "em": 14.76, "carimboEm": 15.5, "imagem": {"id": "mae"}, "imagemEm": 16.11}
```
