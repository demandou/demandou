# Exemplo do modelo manifesto na versão deitada (16:9): como cada fala virou um efeito

A folha `quadros.jpg` mostra um quadro de 12 momentos abaixo, na mesma ordem, no estado montado. O `plano.json` é o plano inteiro aprovado (26 momentos em 152,27 s de vídeo já cortado, um a cada 5,9 s): use-o como régua de densidade e de variedade para o vídeo deitado.
**Este exemplo foi editado no quadro deitado (1920×1080)**, com a composição da aula 9: o texto no quadro à esquerda e a palavra-janela, com a pessoa dentro das letras, na moldura à direita. O rosto fica dentro da primeira linha da janela, menor que a letra. Entre os pôsteres a pessoa volta ao quadro cheio, com legenda, e as placas (destaque, número, selo) entram na altura do peito.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `cartaz` (assinatura): 0,00 a 3,68 s
Fala: “porém, eu estou trazendo aqui o termo bem feito,”

```json
{"topo":[{"em":1.12,"texto":"ESTOU TRAZENDO","tamanho":96},{"em":1.92,"texto":"O TERMO","tamanho":150}],"janela":{"em":2.4,"linhas":["BEM"]},"base":[{"em":2.64,"texto":"FEITO","tamanho":230,"acento":true}]}
```

## 2. `definicao` (bloco universal): 3,68 a 9,87 s
Fala: “porque o bem feito ele remete a você fazer o certo com o que você tem.”

```json
{"termo":"Bem feito","em":4.24,"significado":"Fazer o certo com o que você tem","significadoEm":6.24,"janela":"FEI/TO"}
```

## 3. `cartaz` (assinatura): 12,20 a 18,85 s
Fala: “que a excelência é o produto mais caro, é o computador mais caro, é o celular mais caro.”

```json
{"topo":[{"em":12.43,"texto":"A EXCELÊNCIA É","tamanho":72},{"em":13.95,"texto":"O PRODUTO MAIS","tamanho":72}],"janela":{"em":14.82,"linhas":["CA","RO"]},"negacoes":[{"em":15.95,"antes":"O COMPUTADOR MAIS","palavra":"CARO","riscoEm":17.39},{"em":17.46,"antes":"O CELULAR MAIS","palavra":"CARO","riscoEm":18.34}]}
```

## 4. `frase` (bloco universal): 18,85 a 24,30 s
Fala: “Mas, o que Deus nos pede é pra fazer bem feito com o que nós temos,”

```json
{"texto":"O que Deus nos pede é fazer bem feito com o que nós temos","destaque":"bem feito","janela":"DEUS","em":20.18}
```

## 5. `destaque` (bloco universal): 24,30 a 30,04 s
Fala: “Então, o essencial bem feito é a gente falar de excelência e produtividade.”

```json
{"texto":"Essencial bem feito","em":25.17,"nivel":"chave","detalhe":"Excelência e produtividade","detalheEm":28.29}
```

## 6. `escalada` (assinatura): 39,00 a 45,91 s
Fala: “produtividade remete trabalhar mais, ter que fazer mais, ter que entregar mais, e nem sempre é isso, não é essa a mensagem,”

```json
{"degraus":[{"em":40.07,"texto":"TRABALHAR","nota":"MAIS,","notaEm":40.55},{"em":41.19,"texto":"FAZER","nota":"MAIS,","notaEm":41.35},{"em":42.08,"texto":"ENTREGAR","nota":"MAIS.","notaEm":42.39,"torto":true}],"final":{"em":44.23,"antes":"NEM SEMPRE É","antesEm":43.51,"linhas":["IS","SO"]}}
```

## 7. `comparacao` (bloco universal): 62,45 a 68,24 s
Fala: “Jesus com Marta e Maria? nos pés de Jesus, Marta querendo fazer monte de coisa,”

```json
{"titulo":"Jesus, Marta e Maria","modo":"contra","lados":[{"rotulo":"Maria","texto":"Nos pés de Jesus","em":63.71},{"rotulo":"Marta","texto":"Monte de coisa","em":65.92}]}
```

## 8. `topicos` (bloco universal): 106,10 a 113,30 s
Fala: “quais são os nãos que você precisa dizer pra algumas coisas, pra algumas pessoas, pra alguns projetos, pra alguns convites.”

```json
{"titulo":"Quais são os nãos","itens":[{"texto":"Algumas coisas","em":108.76},{"texto":"Algumas pessoas","em":109.71},{"texto":"Alguns projetos","em":110.83},{"texto":"Alguns convites","em":111.95}]}
```

## 9. `selo` (bloco próprio do modelo): 116,10 a 120,55 s
Fala: “Deus, o nosso relacionamento com Deus ele é muito mais de não do que de sim,”

```json
{"itens":[{"em":118.02,"rotulo":"COM","texto":"DEUS"},{"em":119.3,"rotulo":"MUITO MAIS DE","texto":"NÃO.","acento":true}]}
```

## 10. `pergunta` (bloco universal): 120,55 a 123,60 s
Fala: “Quantas orações Deus não respondeu?”

```json
{"texto":"Quantas orações Deus não respondeu?","janela":"DEUS","em":120.66}
```

## 11. `passos` (bloco universal): 146,11 a 150,00 s
Fala: “O que é o importante, o relevante, o essencial?”

```json
{"titulo":"O que é","itens":[{"texto":"O importante","em":146.81},{"texto":"O relevante","em":147.85},{"texto":"O essencial","em":148.73}]}
```

## 12. `cartaz` (assinatura): 150,00 a 152,27 s
Fala: “Então eu vou fazer o essencial bem feito.”

```json
{"topo":[{"em":150.17,"texto":"EU VOU FAZER","tamanho":72},{"em":150.65,"texto":"O ESSENCIAL","tamanho":96},{"em":151.21,"texto":"BEM","tamanho":150,"acento":true}],"janela":{"em":151.45,"linhas":["FEI","TO."]}}
```
