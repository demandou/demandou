# Exemplo do modelo roteiro: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `embarque` (bloco próprio do modelo): 0.00–2.36 s
Fala: “Um dia em Lisboa, sem pressa.”

```json
{"titulo": "Um dia em Lisboa", "destaque": "Lisboa", "subtitulo": "sem pressa", "codigo": "LIS", "duracao": "1 dia"}
```

## 2. `parada` (assinatura): 2.36–6.01 s
Fala: “De manhã, Torre de Belém e o Pastel de Belém, pertinho dali.”

```json
{"periodo": {"em": 2.46, "indice": 0}, "lugares": [{"em": 3.2, "nome": "Torre de Belém", "desenho": "torre", "x": 0.158, "y": 0.672}, {"em": 4.05, "nome": "Pastel de Belém", "desenho": "doce", "x": 0.205, "y": 0.615, "ligacao": {"em": 5.23, "texto": "pertinho dali"}}], "carimboEm": 5.72}
```

## 3. `parada` (assinatura): 6.01–9.61 s
Fala: “À tarde, pega o elétrico 28 e desce na Alfama.”

```json
{"periodo": {"em": 6.11, "indice": 1}, "trajeto": {"em": 6.98, "transporte": "bonde", "rotulo": "Elétrico", "numero": "28", "numeroEm": 7.68, "via": [{"x": 0.3, "y": 0.648}, {"x": 0.45, "y": 0.642}], "embarque": {"x": 0.6, "y": 0.618}}, "lugares": [{"em": 9.0, "nome": "Alfama", "desenho": "casario", "x": 0.705, "y": 0.585}], "carimboEm": 9.3}
```

## 4. `parada` (assinatura): 9.61–13.00 s
Fala: “No fim do dia, pôr do sol no miradouro da Senhora do Monte.”

```json
{"periodo": {"em": 9.71, "indice": 2}, "lugares": [{"em": 11.33, "nome": "Miradouro da Senhora do Monte", "desenho": "por-do-sol", "x": 0.668, "y": 0.468}], "carimboEm": 12.5}
```

## 5. `dica` (bloco próprio do modelo): 13.00–14.98 s
Fala: “Dá pra fazer tudo de transporte público”

```json
{"titulo": "Dá pra fazer tudo de transporte público", "destaque": "transporte público", "icones": [{"em": 13.71, "desenho": "bonde", "rotulo": "elétrico"}, {"em": 13.92, "desenho": "trem", "rotulo": "trem"}, {"em": 14.56, "desenho": "onibus", "rotulo": "ônibus"}]}
```

## 6. `cta` (bloco universal): 14.98–18.28 s
Fala: “Salva para sua viagem e me segue para mais roteiros.”

```json
{"acaoEm": 15.07, "detalhe": "Me segue pra mais roteiros", "detalheEm": 16.28, "proximoEm": 17.09, "texto": "Salva pra sua viagem", "icone": "salvar"}
```
