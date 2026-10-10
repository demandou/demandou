# Exemplo do modelo constelacao: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–1.67 s
Fala: “Sabe achar o Cruzeiro do Sul?”

```json
{"rotulo": "Céu noturno", "texto": "Sabe achar o Cruzeiro do Sul?", "destaque": "Cruzeiro do Sul?"}
```

## 2. `carta` (assinatura): 1.67–6.25 s
Fala: “Procura quatro estrelas brilhantes formando uma cruz pequena no céu do sul”

```json
{"legenda": true, "ocular": "topo-direita", "passos": [{"acao": "acender", "em": 2.03, "estrelas": ["gacrux", "mimosa", "acrux", "imai"], "ritmo": 0.5, "contador": "estrelas brilhantes"}, {"acao": "ligar", "em": 3.94, "linhas": [["gacrux", "acrux"], ["mimosa", "imai"]], "nome": "Cruzeiro do Sul", "nomeEm": 4.38}, {"acao": "afastar", "em": 4.71, "fator": 0.62}, {"acao": "rumo", "em": 5.45, "direcao": "S"}]}
```

## 3. `carta` (assinatura): 6.25–10.03 s
Fala: “O braço mais comprido aponta para a direção do Polo Sul Celeste”

```json
{"legenda": true, "ocular": "meio-direita", "enquadrar": ["gacrux", "mimosa", "acrux", "imai"], "passos": [{"acao": "destacar", "em": 6.33, "de": "gacrux", "ate": "acrux", "texto": "braço mais comprido"}, {"acao": "prolongar", "em": 7.78, "de": "gacrux", "ate": "acrux", "alvo": "polo-sul", "chegaEm": 8.85, "marca": {"texto": "Polo Sul Celeste", "em": 8.8, "rosa": true}}]}
```

## 4. `carta` (assinatura): 10.03–16.21 s
Fala: “Do lado, duas estrelas muito brilhantes Alfa e Beta Centauro. ajudam a confirmar.”

```json
{"legenda": true, "ocular": "topo-esquerda", "enquadrar": ["gacrux", "mimosa", "acrux", "imai", "alfa-centauro", "beta-centauro"], "passos": [{"acao": "acender", "em": 10.92, "estrelas": ["alfa-centauro", "beta-centauro"], "ritmo": 0.3, "contador": "estrelas muito brilhantes"}, {"acao": "brilhar", "em": 11.8, "estrelas": ["alfa-centauro", "beta-centauro"]}, {"acao": "nomear", "em": 13.23, "estrela": "alfa-centauro", "texto": "Alfa Centauro", "lado": "baixo"}, {"acao": "nomear", "em": 13.83, "estrela": "beta-centauro", "texto": "Beta Centauro", "lado": "cima"}, {"acao": "apontar", "em": 15.12, "de": "alfa-centauro", "por": "beta-centauro", "alvo": "gacrux", "texto": "confirmado", "textoEm": 15.5}]}
```

## 5. `cta` (bloco universal): 16.21–19.32 s
Fala: “Salva e testa na próxima noite sem nuvem.”

```json
{"texto": "Salva e testa", "icone": "salvar", "detalhe": "na próxima noite sem nuvem", "acaoEm": 16.26, "nuvemEm": 18.2}
```
