# Exemplo do modelo medida na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Nesta versão deitada (1920×1080)** os momentos, os tempos e os textos são os mesmos; o `plano.json` daqui já está nas posições do quadro deitado (rosto, rastro, mãos e zona). A folha `quadros.jpg` é a do vertical: no quadro deitado, a `virada` fica em tela cheia com o "E se eu fosse / NUTRICIONISTA" na coluna livre ao lado da cabeça e a legenda na área segura de baixo; na `medida`, a pessoa vai para a moldura da direita, com o rosto centralizado, e o palco (lata, copo, sachês, linha da OMS, rótulos) ocupa o papel da esquerda.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `virada` (bloco próprio do modelo): 0.00–1.26 s
Fala: “Nutricionista, uma”

```json
{"legenda": true, "texto": "E se eu fosse", "nome": "NUTRICIONISTA", "em": 0.03, "nomeEm": 0.107, "trocaEm": 1.0667}
```

## 2. `medida` (assinatura): 1.26–11.73 s
Fala: “lata de refrigerante tem trinta e cinco gramas de açúcar, sete sachês. O ideal, segundo a OMS, é menos de vinte e cinco o dia inteiro. Uma lata, você já ultrapassou esse limite.”

```json
{"legenda": true, "objeto": {"forma": "lata", "rotulo": "Refrigerante", "cor": "#24503C", "icone": "limao", "em": 1.36, "rotuloEm": 1.72}, "palcoEm": 2.6, "quantidade": {"valor": 35, "em": 2.84, "sufixo": "g", "sufixoEm": 3.56, "rotulo": "de açúcar", "rotuloEm": 3.94}, "unidades": {"forma": "sache", "numero": 7, "em": 4.78, "rotulo": "sachês", "rotuloEm": 5.12, "detalhe": "de 5 g cada", "etiqueta": {"topo": "sachê", "meio": "açúcar", "base": "5 g"}, "contador": true}, "referencia": {"valor": 25, "em": 5.82, "rotulo": "ideal do dia", "fonte": "OMS", "fonteEm": 6.72, "prefixo": "<", "prefixoEm": 7.427, "valorEm": 7.867}, "passou": {"em": 10.467, "despejarEm": 9.447}, "selo": "conteúdo ilustrativo"}
```
