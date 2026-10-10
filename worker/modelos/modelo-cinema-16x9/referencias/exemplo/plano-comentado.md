# Exemplo do modelo cinema (versão deitada, 16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

**No quadro deitado (16:9, 1920×1080).** O plano é o mesmo (os mesmos momentos, campos e tempos); o template recompõe a tela pela aula 9 do curso. A folha `quadros.jpg` mostra o exemplo no vertical: no 16:9, os letreiros e os créditos levam a pessoa para a moldura da direita, com o rosto centralizado, e o texto para o quadro preto da esquerda; a cartela vira uma fileira (o desenho ao lado das frases); as frases-chave e a fala ficam em tela cheia, na barra de baixo (ou sobre a imagem escurecida, abaixo do queixo). Entre 18,45 s e 22,91 s a pessoa fica em tela cheia com a narração, o respiro que a aula 9 pede.

## 1. `letreiro` (assinatura): 0.00–2.83 s
Fala: “Todo dia, às seis da tarde,”

```json
{"rotulo": "Todo dia", "rotuloEm": -0.6, "titulo": "18:00", "tituloEm": 0.32, "contarDe": "17:52", "desenho": {"tipo": "sol", "em": -1.2}, "cabeca": "Todo dia · 18:00", "nivel": 3, "pousaEm": 2.21}
```
No 16:9: a pessoa abre o vídeo já na moldura da direita, em close; no quadro da esquerda, o sol se pondo, o crédito TODO DIA e o 17:52 parado, que rola até 18:00 (a capa do vídeo).


## 2. `letreiro` (assinatura): 2.86–7.45 s
Fala: “um senhor sentava no mesmo banco da praça com duas xícaras de café.”

```json
{"nivel": 2, "rotulo": "Um senhor", "rotuloEm": 2.91, "titulo": "O mesmo banco", "tituloEm": 4.07, "desenho": {"tipo": "banco", "em": 3.2, "passos": [{"em": 4.47}, {"em": 6.18}]}}
```
No 16:9: com `nivel: 2`, a moldura larga (o rosto um pouco menor); no quadro, o banco com o poste, UM SENHOR e o título "O mesmo banco".


## 3. `cartela` (assinatura): 7.53–11.18 s
Fala: “bebia uma a outra esfriava”

```json
{"desenho": {"tipo": "xicaras", "em": 7.83, "passos": [{"em": 8.98}, {"em": 9.93}]}, "linhas": [{"em": 8.1, "texto": "Bebia uma."}, {"em": 9.44, "texto": "A outra esfriava."}], "cabeca": "Duas xícaras"}
```
No 16:9: a tela fecha no preto numa fileira: as duas xícaras à esquerda (sem título, o desenho vem primeiro) e as duas frases à direita, a primeira recuando quando a segunda entra.


## 4. `frase` (bloco universal): 11.30–14.87 s
Fala: “Durante anos, ninguém perguntou nada.”

```json
{"linhas": ["Durante anos,", "ninguém", "perguntou nada."], "enfase": "ninguém", "texto": "Durante anos, ninguém perguntou nada.", "destaque": "ninguém"}
```
No 16:9: a forma antiga (`linhas`) vira um texto só, quebrado de novo para o quadro largo; com a curva no nível 1, a frase fica sobre a imagem escurecida, abaixo do queixo.


## 5. `frase` (bloco universal): 14.91–18.45 s
Fala: “Até que uma menina sentou do lado e pegou a xícara.”

```json
{"texto": "Até que uma menina sentou do lado e pegou a xícara.", "destaque": "pegou a xícara."}
```
No 16:9: a curva sobe para 2 em 14,82 s e a frase cresce na barra de baixo, em tela cheia (frase longa: a letra diminui para caber; no 16:9, prefira até ~40 caracteres).


## 6. `fala` (bloco próprio do modelo): 22.91–25.93 s
Fala: “Minha esposa sentava aí, ele disse.”

```json
{"texto": "Minha esposa sentava aí", "quem": "ele disse", "quemEm": 24.77}
```
No 16:9: a curva está em 3 desde 22,38 s; a fala fica no lugar da narração, numa linha larga, com o crédito ELE DISSE embaixo.


## 7. `frase` (bloco universal): 26.02–29.38 s
Fala: “Faz 10 anos que eu espero alguém tomar esse café.”

```json
{"linhas": ["Faz dez anos", "que eu espero alguém", "tomar esse café."], "enfase": "esse café.", "texto": "Faz dez anos que eu espero alguém tomar esse café.", "destaque": "esse café."}
```
No 16:9: na barra de baixo alta do nível 3, em duas linhas grandes.


## 8. `creditos` (bloco próprio do modelo): 29.92–32.12 s
Fala: “Segue para mais histórias como essa.”

```json
{"texto": "Segue pra mais histórias como essa.", "icone": "seguir", "nivel": 2}
```
No 16:9: a pessoa na moldura larga; no quadro da esquerda, HISTÓRIAS e o nome em cima, a chamada e o ícone de seguir embaixo.

