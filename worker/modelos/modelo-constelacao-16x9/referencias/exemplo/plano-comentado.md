# Exemplo do modelo constelacao na versão deitada (16:9): como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem. **A folha foi feita no vertical**; o `plano.json` deste exemplo já está no quadro deitado (1920×1080), com o mesmo conteúdo. No 16:9 o estilo é o mesmo e a composição segue a aula 9 do curso: a tela cheia é a base (a abertura e o fechamento, com o texto no peito numa faixa larga e baixa); na carta, a pessoa vai para a ocular, na moldura da direita, com o rosto centralizado nela, e a carta se desenha no quadro da esquerda. A ocular sobe e desce na coluna da direita a cada momento (`topo-direita`, `meio-direita`, `baixo-direita`) e o contador fica na coluna dela, embaixo ou em cima.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário. No vídeo completo, deixe também respiros em tela cheia, só com a pessoa e a legenda, entre as ideias.

## 1. `abertura` (bloco universal): 0.00–1.67 s
Fala: “Sabe achar o Cruzeiro do Sul?”

```json
{"rotulo": "Céu noturno", "texto": "Sabe achar o Cruzeiro do Sul?", "destaque": "Cruzeiro do Sul?"}
```

Tela cheia: o letreiro e o título no peito, abaixo do queixo; a miniatura do Cruzeiro num canto de cima, longe da cabeça.

## 2. `carta` (assinatura): 1.67–6.25 s
Fala: “Procura quatro estrelas brilhantes formando uma cruz pequena no céu do sul”

```json
{"legenda": true, "ocular": "topo-direita", "passos": [{"acao": "acender", "em": 2.03, "estrelas": ["gacrux", "mimosa", "acrux", "imai"], "ritmo": 0.5, "contador": "estrelas brilhantes"}, {"acao": "ligar", "em": 3.94, "linhas": [["gacrux", "acrux"], ["mimosa", "imai"]], "nome": "Cruzeiro do Sul", "nomeEm": 4.38}, {"acao": "afastar", "em": 4.71, "fator": 0.62}, {"acao": "rumo", "em": 5.45, "direcao": "S"}]}
```

A ocular no alto da coluna da direita; o contador "4 estrelas brilhantes" embaixo dela; a cruz se forma no quadro da esquerda.

## 3. `carta` (assinatura): 6.25–10.03 s
Fala: “O braço mais comprido aponta para a direção do Polo Sul Celeste”

```json
{"legenda": true, "ocular": "meio-direita", "enquadrar": ["gacrux", "mimosa", "acrux", "imai"], "passos": [{"acao": "destacar", "em": 6.33, "de": "gacrux", "ate": "acrux", "texto": "braço mais comprido"}, {"acao": "prolongar", "em": 7.78, "de": "gacrux", "ate": "acrux", "alvo": "polo-sul", "chegaEm": 8.85, "marca": {"texto": "Polo Sul Celeste", "em": 8.8, "rosa": true}}]}
```

A ocular desce para o meio da coluna (maior); a reta desce no quadro da esquerda até a rosa e o nome do polo.

## 4. `carta` (assinatura): 10.03–16.21 s
Fala: “Do lado, duas estrelas muito brilhantes Alfa e Beta Centauro. ajudam a confirmar.”

```json
{"legenda": true, "ocular": "baixo-direita", "enquadrar": ["gacrux", "mimosa", "acrux", "imai", "alfa-centauro", "beta-centauro"], "passos": [{"acao": "acender", "em": 10.92, "estrelas": ["alfa-centauro", "beta-centauro"], "ritmo": 0.3, "contador": "estrelas muito brilhantes"}, {"acao": "brilhar", "em": 11.8, "estrelas": ["alfa-centauro", "beta-centauro"]}, {"acao": "nomear", "em": 13.23, "estrela": "alfa-centauro", "texto": "Alfa Centauro", "lado": "baixo"}, {"acao": "nomear", "em": 13.83, "estrela": "beta-centauro", "texto": "Beta Centauro", "lado": "cima"}, {"acao": "apontar", "em": 15.12, "de": "alfa-centauro", "por": "beta-centauro", "alvo": "gacrux", "texto": "confirmado", "textoEm": 15.5}]}
```

No vertical esta carta usava `topo-esquerda`; no quadro deitado a ocular fica sempre à direita e aqui desce para `baixo-direita`, com o contador em cima dela.

## 5. `cta` (bloco universal): 16.21–19.32 s
Fala: “Salva e testa na próxima noite sem nuvem.”

```json
{"texto": "Salva e testa", "icone": "salvar", "detalhe": "na próxima noite sem nuvem", "acaoEm": 16.26, "nuvemEm": 18.2}
```

Tela cheia de novo: o ícone ao lado da chamada, o detalhe com a nuvem que vira estrela e a assinatura, tudo na faixa do peito.
