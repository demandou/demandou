# Exemplo do modelo lousa: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `titulo` (bloco próprio do modelo): 0.45–3.50 s
Fala: “15% de cabeça? Olha que fácil.”

```json
{"legenda": true, "rotulo": "Cálculo mental", "linhas": ["15%", "de cabeça?"], "destaque": "15%", "sublinharEm": 2.95}
```

## 2. `virgula` (assinatura): 3.50–8.15 s
Fala: “Pega R$ 80,00 10% é só andar a vírgula. Oito.”

```json
{"legenda": true, "passo": "Passo 1", "titulo": "10%", "tituloEm": 5.21, "prefixo": "R$", "numero": "80", "numeroEm": 4.12, "casas": 1, "moverEm": 6.38, "resultado": "8", "resultadoEm": 7.6}
```

## 3. `fracao` (assinatura): 8.15–10.70 s
Fala: “Metade disso é 5%. 4”

```json
{"legenda": true, "passo": "Passo 2", "titulo": "5%", "tituloEm": 9.4, "numerador": "8", "nota": "metade", "notaEm": 8.2, "tracoEm": 8.5, "denominador": "2", "denominadorEm": 8.72, "resultado": "4", "resultadoEm": 10.2}
```

## 4. `coluna` (assinatura): 10.70–12.51 s
Fala: “Soma os dois DOSI”

```json
{"legenda": true, "passo": "Passo 3", "titulo": "soma", "tituloEm": 10.76, "operador": "+", "operadorEm": 11.0, "itens": [{"valor": "8", "rotulo": "10%"}, {"valor": "4", "rotulo": "5%"}], "tracoEm": 11.5, "total": {"valor": "12", "rotulo": "15%", "em": 11.95}}
```

## 5. `resultado` (assinatura): 12.51–15.18 s
Fala: “15% de 80 é R$ 12,00.”

```json
{"rotulo": "Resposta", "conta": "15% de 80", "contaEm": 12.6, "destaque": "15%", "valor": "R$ 12", "valorEm": 14.37}
```

## 6. `cta` (bloco universal): 15.18–19.92 s
Fala: “Funciona com qualquer valor Salva e testa na próxima conta do restaurante”

```json
{"regra": {"rotulo": "Funciona com qualquer valor", "linhas": [{"texto": "15% = 10% + metade", "em": 15.28, "destaque": "15%"}], "molduraEm": 17.05}, "texto": "Salva e testa na próxima conta", "icone": "salvar"}
```
