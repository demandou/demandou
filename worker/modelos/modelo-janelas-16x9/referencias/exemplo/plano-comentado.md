# Exemplo do modelo janelas: como cada fala virou um efeito

O vídeo é `exemplo.mp4` e a folha `quadros.jpg` mostra um quadro de cada momento abaixo, na mesma ordem.
**Use como referência de estilo, não de assunto:** o vídeo do usuário pode falar de qualquer coisa. Repare em quais blocos o exemplo usa, em que ordem, quanto tempo cada um dura e como a fala vira texto curto na tela, e faça o mesmo com a fala do usuário.

## 1. `abertura` (bloco universal): 0.00–2.90 s
Fala: “Três atalhos que vão te poupar horas no computador.”

```json
{"destaque": "horas", "resultado": "Atalhos de teclado", "contagem": "3", "enterEm": 2.6, "texto": "3 atalhos que vão te poupar horas no computador", "icone": "teclado"}
```

## 2. `navegador` (bloco próprio do modelo): 2.90–7.28 s
Fala: “Ctrl+Shift+T reabre a aba que você fechou sem querer.”

```json
{"numero": 1, "numeroEm": 3.2, "teclas": [{"tecla": "Ctrl", "em": 3.92}, {"tecla": "Shift", "em": 4.4}, {"tecla": "T", "em": 4.78}], "abas": [{"titulo": "E-mail", "icone": "email"}, {"titulo": "Planilha", "icone": "planilha"}, {"titulo": "Passagens", "icone": "aviao"}], "ativa": 2, "fechaEm": 3.72, "reabreEm": 5.14, "aviso": {"texto": "Reabre a aba que você fechou sem querer", "destaque": "fechou sem querer"}}
```

## 3. `lista` (bloco próprio do modelo): 7.28–11.81 s
Fala: “2. Windows V mostra tudo o que você copiou, não só o último.”

```json
{"numero": 2, "numeroEm": 7.43, "teclas": [{"tecla": "Win", "em": 8.26}, {"tecla": "V", "em": 8.8}], "titulo": "Área de transferência", "subtitulo": "Tudo o que você copiou", "itens": [{"texto": "Reunião às 15h na sala 2", "tipo": "texto", "em": 7.3}, {"texto": "Captura de tela.png", "tipo": "imagem", "em": 9.09}, {"texto": "Rua das Flores, 120", "tipo": "endereco", "em": 9.7}, {"texto": "R$ 1.250,00", "tipo": "dinheiro", "em": 10.09}], "primeiro": "último", "selo": {"texto": "não só o último", "em": 10.78}, "escolhe": 2, "escolheEm": 11.3, "escolheTexto": "Colado"}
```

## 4. `recorte` (assinatura): 11.81–16.40 s
Fala: “3 O Windows Shift + S tira a print de só um pedaço da tela.”

```json
{"numero": 3, "numeroEm": 12.02, "teclas": [{"tecla": "Win", "em": 12.78}, {"tecla": "Shift", "em": 13.32}, {"tecla": "S", "em": 13.76}], "selecionaEm": 14.3, "soltaEm": 15.25, "capturaEm": 15.95, "rotuloSelecao": "Print de só um pedaço da tela", "aviso": "Print copiado", "avisoDetalhe": "na área de transferência"}
```

## 5. `teclas` (assinatura): 16.40–18.64 s
Fala: “No Mac, é Command+Shift+4.”

```json
{"chip": {"texto": "No Mac", "em": 16.55}, "trocaEm": 16.85, "teclas": [{"tecla": "Cmd", "em": 17.48}, {"tecla": "Shift", "em": 17.98}, {"tecla": "4", "em": 18.32}]}
```

## 6. `cta` (bloco universal): 18.64–21.56 s
Fala: “Salva e manda para quem só usa o mouse.”

```json
{"salvarEm": 18.92, "enviarEm": 19.2, "para": "quem só usa o mouse", "enviadoEm": 21.05, "texto": "Salva e manda", "avatar": "mouse"}
```
