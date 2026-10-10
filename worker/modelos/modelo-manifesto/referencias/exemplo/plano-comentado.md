# Exemplo do modelo manifesto: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `cartaz` (assinatura): 0.08–2.04 s
Fala: “Ninguém vai fazer por você.”

```json
{"topo": [{"em": 0.3, "texto": "NINGUÉM", "tamanho": 150}, {"em": 0.68, "texto": "VAI FAZER POR", "tamanho": 72}], "janela": {"em": 1.63, "linhas": ["VO", "CÊ"]}}
```

## 2. `cartaz` (assinatura): 2.04–7.62 s
Fala: “Não é o momento perfeito, não é a ferramenta certa, Não é o curso que falta.”

```json
{"janela": {"em": 2.13, "linhas": ["NÃO"], "batidas": [4.0, 5.98]}, "negacoes": [{"em": 2.45, "antes": "O MOMENTO", "palavra": "PERFEITO", "riscoEm": 3.9}, {"em": 4.47, "antes": "A FERRAMENTA", "palavra": "CERTA", "riscoEm": 5.68}, {"em": 6.36, "antes": "O CURSO QUE", "palavra": "FALTA", "riscoEm": 7.3}]}
```

## 3. `escalada` (assinatura): 10.42–14.50 s
Fala: “Começa pequeno. Começa torto. mas começa.”

```json
{"degraus": [{"em": 10.52, "texto": "COMEÇA", "nota": "PEQUENO.", "notaEm": 10.94}, {"em": 11.94, "texto": "COMEÇA", "nota": "TORTO.", "notaEm": 12.51, "torto": true}], "final": {"em": 13.61, "antes": "MAS", "antesEm": 13.43, "linhas": ["CO", "ME", "ÇA"]}}
```

## 4. `selo` (bloco próprio do modelo): 14.90–18.83 s
Fala: “a um ano você vai agradecer a pessoa que decidiu agora.”

```json
{"itens": [{"em": 15.04, "rotulo": "DAQUI A", "texto": "1 ANO"}, {"em": 18.4, "texto": "AGORA.", "acento": true}], "marcas": {"de": 15.3, "ate": 18.2, "quantas": 12}}
```

## 5. `cartaz` (assinatura): 18.83–21.60 s
Fala: “Comenta. Eu começo hoje.”

```json
{"fecho": {"icone": "comentar"}, "topo": [{"em": 18.93, "texto": "COMENTA:", "tamanho": 84}], "janela": {"em": 19.65, "linhas": ["EU"]}, "base": [{"em": 19.73, "texto": "COMEÇO", "tamanho": 170}, {"em": 20.71, "texto": "HOJE.", "tamanho": 230, "acento": true}]}
```
