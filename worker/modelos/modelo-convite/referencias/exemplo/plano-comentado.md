# Exemplo do modelo convite: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `convite` (bloco próprio do modelo): 0.00–2.60 s
Fala: “Vai casar? Anota aí esse cronograma.”

```json
{"titulo": "Vai casar?", "subtitulo": "Anota esse cronograma", "seloEm": 1.95}
```

## 2. `marco` (assinatura): 2.60–6.58 s
Fala: “Doze meses antes. Data, local e orçamento.”

```json
{"numero": "12", "unidade": "meses antes", "extenso": "Doze meses antes", "numeroEm": 2.68, "itens": [{"em": 4.21, "texto": "Data", "icone": "calendario"}, {"em": 4.58, "texto": "Local", "icone": "local"}, {"em": 5.24, "texto": "Orçamento", "icone": "orcamento"}]}
```

## 3. `marco` (assinatura): 6.58–9.33 s
Fala: “Nove meses. fotógrafo e buffet”

```json
{"numero": "9", "unidade": "meses", "extenso": "Nove meses", "numeroEm": 6.7, "itens": [{"em": 7.89, "texto": "Fotógrafo", "icone": "camera"}, {"em": 8.77, "texto": "Buffet", "icone": "buffet"}]}
```

## 4. `marco` (assinatura): 9.33–11.98 s
Fala: “Seis meses. Convites e traje.”

```json
{"numero": "6", "unidade": "meses", "extenso": "Seis meses", "numeroEm": 9.43, "itens": [{"em": 10.63, "texto": "Convites", "icone": "convite"}, {"em": 11.41, "texto": "Traje", "icone": "traje"}]}
```

## 5. `marco` (assinatura): 11.98–14.48 s
Fala: “3 meses Envio dos convites.”

```json
{"numero": "3", "unidade": "meses", "extenso": "Três meses", "numeroEm": 12.09, "itens": [{"em": 13.21, "texto": "Envio dos convites", "icone": "envio"}]}
```

## 6. `marco` (assinatura): 14.48–17.88 s
Fala: “Um mês. prova final e confirmação dos convidados.”

```json
{"numero": "1", "unidade": "mês", "extenso": "Um mês", "numeroEm": 14.56, "itens": [{"em": 15.27, "texto": "Prova final", "icone": "prova"}, {"em": 16.16, "texto": "Confirmação dos convidados", "icone": "confirmacao"}]}
```

## 7. `cta` (bloco universal): 17.88–20.32 s
Fala: “Salva e manda para o seu amor.”

```json
{"texto": "Salva", "complemento": "e manda pro seu amor", "destaque": "seu amor", "seloEm": 18.1}
```
