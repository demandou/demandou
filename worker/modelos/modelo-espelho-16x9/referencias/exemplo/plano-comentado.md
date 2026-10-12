# Exemplo do modelo espelho: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. A folha é do **vertical**; neste modelo deitado (16:9) o mesmo plano vale igual: cada página fica no quadro da esquerda, a pessoa na moldura da direita (o rosto centralizado e acompanhado), com a linha do espelho de pé entre elas, e entre momentos com respiro a pessoa volta à tela cheia.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `manchete` (bloco próprio do modelo): 0.00–4.07 s
Fala: “Toxina botulínica e preenchimento não são a mesma coisa”

```json
{"linhas": ["Toxina botulínica", "≠ preenchimento"], "sub": "não são a mesma coisa", "simboloEm": 2.5}
```

## 2. `mapa` (assinatura): 4.07–9.37 s
Fala: “A toxina relaxa o músculo e suaviza as rugas de expressão, como as da testa,”

```json
{"lado": "esquerda", "rotulo": "Toxina botulínica", "titulo": "Relaxa o músculo", "nota": "suaviza as rugas de expressão", "efeito": {"tipo": "relaxar", "em": 6.33, "inicioEm": 5.26}, "areas": [{"area": "testa", "em": 8.91}]}
```

## 3. `mapa` (assinatura): 9.37–16.74 s
Fala: “O preenchimento com ácido hialurônico repõe volume. nos lábios, nas olheiras ou no contorno do rosto”

```json
{"lado": "direita", "rotulo": "Preenchimento", "titulo": "Repõe volume", "nota": "com ácido hialurônico", "efeito": {"tipo": "volume", "em": 12.42}, "areas": [{"area": "labios", "em": 13.41}, {"area": "olheiras", "em": 14.49}, {"area": "contorno", "em": 15.45}]}
```

## 4. `comparacao` (bloco universal): 16.74–23.89 s
Fala: “O efeito da toxina dura de 4 a 6 meses o do preenchimento em média de seis meses a um ano e meio”

```json
{"titulo": "Duração do efeito", "escala": {"ate": 18, "passo": 3}, "lados": [{"rotulo": "Toxina", "texto": "4 a 6 meses", "em": 17.44, "faixa": {"de": 4, "ate": 6, "em": 18.6, "emFim": 19.32}, "areas": ["testa"]}, {"rotulo": "Preenchimento", "texto": "6 meses", "em": 20.09, "faixa": {"de": 6, "ate": 18, "em": 21.95, "emFim": 23.38}, "textos": {"sobre": "em média", "fim": "1 ano e meio"}}]}
```

## 5. `manchete` (bloco próprio do modelo): 23.89–28.29 s
Fala: “Antes de qualquer procedimento, avaliação com um profissional habilitado”

```json
{"linhas": ["avaliação com um", "profissional habilitado"], "enfase": "profissional habilitado", "abre": "Antes de qualquer procedimento,", "seloEm": 27.78}
```

## 6. `cta` (bloco universal): 28.29–30.96 s
Fala: “Me segue para mais dicas de harmonização.”

```json
{"texto": "Siga para mais dicas", "icone": "seguir", "iconeEm": 29.29}
```
