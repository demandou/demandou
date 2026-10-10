# Exemplo do modelo guia: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `mapa` (assinatura): 0.00–3.90 s
Fala: “Guia rápido do ChatGPT para iniciantes, em três etapas:”

```json
{"pessoa": "canto"}
```

## 2. `mapa` (assinatura): 3.90–4.90 s
Fala: “Estapa 1. Entra no”

```json
{"foco": 0, "pessoa": "dir"}
```

## 3. `print` (assinatura): 4.90–6.29 s
Fala: “chatgpt.com.”

```json
{"pessoa": "centro", "imagem": {"id": "etapa1"}, "endereco": "chatgpt.com"}
```

## 4. `print` (assinatura): 6.29–7.29 s
Fala: “Dá pra usar de graça.”

```json
{"pessoa": "centro", "imagem": {"id": "gratis"}, "endereco": "chatgpt.com", "setas": [{"em": 6.78, "x": 0.7, "y": 0.64, "vem": "baixo", "texto": "de graça"}]}
```

## 5. `mapa` (assinatura): 7.29–8.23 s
Fala: “Etapa 2 Clica”

```json
{"foco": 1, "pessoa": "esq"}
```

## 6. `print` (assinatura): 8.23–9.90 s
Fala: “aqui em cima e escolhe o modelo.”

```json
{"pessoa": "centro", "imagem": {"id": "etapa2"}, "setas": [{"em": 8.23, "x": 0.22, "y": 0.62, "vem": "baixo", "texto": "escolhe o modelo", "textoEm": 8.94}]}
```

## 7. `mapa` (assinatura): 9.90–10.94 s
Fala: “Etapa 3:”

```json
{"foco": 2, "pessoa": "dir"}
```

## 8. `print` (assinatura): 10.94–13.73 s
Fala: “Escreve o pedido com o contexto, não só uma palavra.”

```json
{"pessoa": "centro", "imagem": {"id": "etapa3"}, "setas": [{"em": 10.94, "x": 0.5, "y": 0.985, "vem": "baixo", "texto": "com contexto", "textoEm": 12.03}]}
```

## 9. `cta` (bloco universal): 13.73–16.88 s
Fala: “Comenta a guia que eu te mando o passo a passo completo.”

```json
{"texto": "Comenta GUIA", "destaque": "GUIA", "pessoa": "dir"}
```
