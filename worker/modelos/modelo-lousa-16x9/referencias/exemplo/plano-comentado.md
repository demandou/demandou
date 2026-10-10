# Exemplo do modelo lousa na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**A folha foi feita no vertical.** No quadro deitado (1920×1080) os mesmos momentos saem com a composição da aula 9: a pessoa numa moldura à direita, com o rosto centralizado, e a lousa à esquerda. A janela grande (o `alto`) leva a abertura e o fechamento, com o conteúdo centrado na lousa; a janela retrato leva a conta, com o título (o `passo` e o `titulo`) no topo da lousa e a conta embaixo. O giz, os gestos, as cores e os sons são os mesmos. O `plano.json` é o mesmo plano, com o quadro do 16:9 (`largura` 1920, `altura` 1080, `rosto.quadro`).
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.
**Este exemplo é curto e tem as páginas coladas.** No vídeo completo, a tela cheia é a base: entre as ideias, a pessoa volta ao quadro cheio, com legenda, por 1 a ~8 s.

## 1. `titulo` (bloco próprio do modelo): 0.45–3.50 s
Fala: “15% de cabeça? Olha que fácil.”
No 16:9: sai da tela cheia para a janela grande à direita; "15%" (amarelo) e "de cabeça?" centrados na lousa à esquerda.

```json
{"legenda": true, "rotulo": "Cálculo mental", "linhas": ["15%", "de cabeça?"], "destaque": "15%", "sublinharEm": 2.95}
```

## 2. `virgula` (assinatura): 3.50–8.15 s
Fala: “Pega R$ 80,00 10% é só andar a vírgula. Oito.”
No 16:9: a janela vira a retrato; "Passo 1 / 10%" no topo da lousa, ao lado dela; a vírgula anda e o "= 8" é circulado embaixo.

```json
{"legenda": true, "passo": "Passo 1", "titulo": "10%", "tituloEm": 5.21, "prefixo": "R$", "numero": "80", "numeroEm": 4.12, "casas": 1, "moverEm": 6.38, "resultado": "8", "resultadoEm": 7.6}
```

## 3. `fracao` (assinatura): 8.15–10.70 s
Fala: “Metade disso é 5%. 4”
No 16:9: a janela retrato fica; o apagador limpa e o título novo é escrito no mesmo cabeçalho.

```json
{"legenda": true, "passo": "Passo 2", "titulo": "5%", "tituloEm": 9.4, "numerador": "8", "nota": "metade", "notaEm": 8.2, "tracoEm": 8.5, "denominador": "2", "denominadorEm": 8.72, "resultado": "4", "resultadoEm": 10.2}
```

## 4. `coluna` (assinatura): 10.70–12.51 s
Fala: “Soma os dois DOSI”
No 16:9: janela retrato; a conta armada (8 + 4 = 12) centrada na lousa, o 12 circulado.

```json
{"legenda": true, "passo": "Passo 3", "titulo": "soma", "tituloEm": 10.76, "operador": "+", "operadorEm": 11.0, "itens": [{"valor": "8", "rotulo": "10%"}, {"valor": "4", "rotulo": "5%"}], "tracoEm": 11.5, "total": {"valor": "12", "rotulo": "15%", "em": 11.95}}
```

## 5. `resultado` (assinatura): 12.51–15.18 s
Fala: “15% de 80 é R$ 12,00.”
No 16:9: janela retrato; "15% de 80" no topo da lousa, o 12 da coluna desliza até "= R$ 12", sublinhado duas vezes.

```json
{"rotulo": "Resposta", "conta": "15% de 80", "contaEm": 12.6, "destaque": "15%", "valor": "R$ 12", "valorEm": 14.37}
```

## 6. `cta` (bloco universal): 15.18–19.92 s
Fala: “Funciona com qualquer valor Salva e testa na próxima conta do restaurante”
No 16:9: a janela volta a ser a grande; na lousa, a regra emoldurada em cima, o ícone e a chamada no meio e a assinatura embaixo.

```json
{"regra": {"rotulo": "Funciona com qualquer valor", "linhas": [{"texto": "15% = 10% + metade", "em": 15.28, "destaque": "15%"}], "molduraEm": 17.05}, "texto": "Salva e testa na próxima conta", "icone": "salvar"}
```
