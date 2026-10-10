# Exemplo do modelo canal: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–3.76 s
Fala: “Eu testei os três microfones mais vendidos até 500 reais.”

```json
{"texto": "Testei os 3 microfones mais vendidos até R$ 500", "destaque": "até R$ 500", "em": 0.06}
```

## 2. `reframe` (assinatura): 3.79–8.78 s
Fala: “O primeiro é de lapela, o segundo é USB e o terceiro é sem fio. o resultado me”

```json
{"titulo": "Os 3 microfones", "itens": [{"texto": "Lapela", "em": 4.68, "imagem": {"id": "mic-lapela"}}, {"texto": "USB", "em": 6.29, "imagem": {"id": "mic-usb"}}, {"texto": "Sem fio", "em": 7.56, "imagem": {"id": "mic-sem-fio"}}]}
```

## 3. `destaque` (bloco universal): 9.60–11.25 s
Fala: “O mais barato ganhou no som.”

```json
{"texto": "O mais barato", "em": 9.86, "detalhe": "ganhou no som", "detalheEm": 10.39}
```

## 4. `chamada` (bloco próprio do modelo): 11.62–12.75 s
Fala: “o final que eu mostro o”

```json
{"texto": "No final: teste com barulho", "em": 11.67}
```

## 5. `cena` (bloco próprio do modelo): 12.75–13.99 s
Fala: “teste com barulho de rua”

```json
{"em": 12.75, "imagem": {"id": "rua", "efeito": "aproximar"}}
```

## 6. `capitulo` (bloco próprio do modelo): 12.75–13.99 s
Fala: “teste com barulho de rua”

```json
{"texto": "Teste com barulho de rua", "em": 12.75}
```

## 7. `inscricao` (bloco próprio do modelo): 14.05–15.56 s
Fala: “E se inscreve no canal.”

```json
{"texto": "Se inscreve no canal", "em": 14.09, "cliqueEm": 14.55}
```
