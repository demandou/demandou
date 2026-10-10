# Exemplo do modelo tela-viva: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (assinatura): 0.00–3.10 s
Fala: “Três atalhos que vão te poupar horas no computador.”

```json
{"texto": "Atalhos do Windows", "legenda": true}
```

## 2. `tela` (assinatura): 0.00–3.10 s
Fala: “Três atalhos que vão te poupar horas no computador.”

```json
{"legenda": true, "captura": "teclado", "proporcao": 1.597, "ini": {"x": 0.45, "y": 0.14, "zoom": 1.0}, "fim": {"x": 0.4, "y": 0.2, "zoom": 1.45}, "cursor": [{"x": 0.28, "y": 0.05, "em": 0.35}, {"x": 0.22, "y": 0.295, "em": 2.41}]}
```

## 3. `tela` (assinatura): 3.10–7.28 s
Fala: “Ctrl+Shift+T reabre a aba que você fechou sem querer.”

```json
{"legenda": true, "captura": "chrome", "proporcao": 1.597, "ini": {"x": 0.36, "y": 0.225, "zoom": 1.3}, "fim": {"x": 0.36, "y": 0.285, "zoom": 2.3}, "cursor": [{"x": 0.4, "y": 0.265, "em": 3.95}, {"x": 0.47, "y": 0.281, "em": 5.17, "clique": true}, {"x": 0.5, "y": 0.285, "em": 6.4}]}
```

## 4. `tela` (assinatura): 7.28–11.81 s
Fala: “2. Windows V mostra tudo o que você copiou, não só o último.”

```json
{"legenda": true, "captura": "area", "proporcao": 1.597, "ini": {"x": 0.42, "y": 0.345, "zoom": 1.3}, "fim": {"x": 0.45, "y": 0.4, "zoom": 2.1}, "cursor": [{"x": 0.3, "y": 0.381, "em": 8.2}, {"x": 0.66, "y": 0.401, "em": 8.55, "clique": true}, {"x": 0.55, "y": 0.4, "em": 10.1}]}
```

## 5. `tela` (assinatura): 11.81–16.40 s
Fala: “3 O Windows Shift + S tira a print de só um pedaço da tela.”

```json
{"legenda": true, "captura": "recorte", "proporcao": 1.597, "ini": {"x": 0.4, "y": 0.765, "zoom": 1.3}, "fim": {"x": 0.4, "y": 0.81, "zoom": 2.1}, "cursor": [{"x": 0.3, "y": 0.78, "em": 12.66}, {"x": 0.43, "y": 0.809, "em": 13.94, "clique": true}, {"x": 0.5, "y": 0.81, "em": 15.2}]}
```
