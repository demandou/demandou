# O plano de edição (`src/plano.json`)

O template renderiza o vídeo a partir deste arquivo. O `cortar.mjs` preenche a parte mecânica (`video`, `fps`, `duracao`, `videoAltura`, `rosto`, `zona`, `cortesEm`, `palavras`) e o `imagens.mjs` preenche `imagens`. Você preenche `marca`, `momentos`, `semLegenda` e `correcoes`.

Todos os tempos são em segundos, na linha do tempo do vídeo **já cortado**, tirados de `work/palavras.json`. Todo campo `em` ou `…Em` é o `em` de uma palavra dita.

## Gramática
| Lugar | Blocos | A pessoa |
|---|---|---|
| Quadro cheio | `abertura`, `numero`, `destaque`, `frase`, `cta` | inteira; texto num cartão claro abaixo do queixo |
| Painel | `topicos`, `passos`, `comparacao`, `grafico`, `definicao`, `pergunta`, `antesdepois` | moldura larga embaixo (y ≥ 1160) |
| Janela | `antesdepois` depois do `janelaEm` | janela 420×440 embaixo, no centro |

Momentos seguidos: o `ate` de um = o `de` do próximo (de preferência numa pausa). Alterne os lugares; abra com `abertura` (ou com a foto) e feche com `cta`. Textos do peito depois de um painel esperam a pessoa voltar ao quadro cheio.

## A assinatura: `antesdepois`
```json
{ "tipo": "antesdepois", "de": 2.8, "ate": 12.96,
  "antes": { "id": "antes" }, "depois": { "id": "depois" },
  "rotulos": ["Antes", "Depois"],
  "marcadores": [
    { "texto": "Tira tudo e separa em três pilhas", "em": 2.89, "foco": { "x": 0.42, "y": 0.72 }, "zoom": 2, "ponto": { "x": 0.3, "y": 0.69 } },
    { "texto": "Cabide igual para tudo", "em": 5.01, "foco": { "x": 0.5, "y": 0.38 }, "detalhe": "muda a cara na hora", "detalheEm": 7.39 }
  ],
  "alca": [ { "em": 11.1, "pos": 0 }, { "em": 12.2, "pos": 1 } ],
  "janelaEm": 11.09 }
```
- `antes` / `depois`: `{ id }` de pedidos do `work/imagens.json` (as fotos do aluno, mesma câmera). Sem imagem, vira cartão com o rótulo.
- `rotulos` (opcional): nomes dos lados (padrão ANTES e DEPOIS; ex.: `["Janeiro", "Junho"]`), até ~12 caracteres.
- `marcadores` (2 a 5): `texto` (até ~45 caracteres, 2 linhas, com as palavras da fala), `em`, `foco` (área que a câmera aproxima, frações da foto), `zoom` (1,3–3; padrão 2), `ponto` (onde fica o pino; padrão o foco), `detalhe` / `detalheEm` (até ~40 caracteres, verde, uma linha). Dê 1,5 s ou mais a cada marcador.
- `alca` (opcional): onde a alça fica em instantes específicos (0 = só o antes, 1 = só o depois, 0,5 = meio a meio). Sem isso, ela varre sozinha durante cada dica; use para a revelação final.
- `janelaEm`: a partir daqui a foto toma a tela inteira e a pessoa vai para a janela (a revelação). Use nas últimas 1–2 s do momento. A janela cobre o chão da foto: não ponha pinos embaixo no centro.
- Duração: 6 a 12 s. Dê `legenda: true` se quiser a legenda durante o momento (por padrão ela some, o cartão da dica já mostra o texto).

## Blocos de quadro cheio
Texto num cartão claro, Outfit 800, palavra por palavra na fala a partir do `em`; `destaque` = trecho exato de `texto`, em verde com grifo.
- `abertura`: `{ "tipo": "abertura", "de": 0, "ate": 2.76, "texto": "...", "destaque": "...", "em": 0.3 }`. 3 a 8 palavras (até ~45 caracteres), 1,5 a 3 s.
- `numero`: `valor`, `em`, `rotulo` (até ~30), `rotuloEm`, `prefixo`, `sufixo`, `casas`, `ilustrativo`. Conta de 0 até `valor` em 0,9 s (pt-BR).
- `destaque`: `texto` (1 a 5 palavras), `em`, `nivel` (`chave` verde ou `alerta` argila), `detalhe` (até ~60), `detalheEm`.
- `frase`: `texto` (até ~70 caracteres), `destaque`, `risco`, `riscoEm`.
- `cta`: `texto` (até ~50), `icone` (`salvar`, `seguir`, `comentar`, `link`), `destaque`, `em`. Fica até o último quadro.

## Blocos do painel (conteúdo entre y 150 e 1100)
- `topicos` / `passos`: `titulo` (opcional, até ~40), `itens` (2 a 5) `{ texto (até ~45), em, detalhe? }`. `passos` leva discos numerados.
- `comparacao`: `titulo?`, `modo` (`contra`, `antes-depois`, `errado-certo`), `lados` (dois `{ rotulo, texto (até ~60), em }`), `vencedor` (0 ou 1), `vencedorEm`.
- `grafico`: `titulo?`, `forma` (`barras`, `linha`, `pizza`), `dados` `[{ rotulo, valor, em }]` (só números ditos) ou `tendencia` (`sobe`, `cai`, `oscila`) + `tendenciaEm` com `ilustrativo: true`, `unidade`.
- `definicao`: `termo`, `em`, `significado` (até ~110), `significadoEm`.
- `pergunta`: `texto` (até ~80), `em`, `opcoes` `[{ texto (até ~35), em }]`.

## Regras de tempo
- Cada item, marcador ou lado entra no `em` da palavra que o nomeia.
- Nenhum trecho de mais de 3,5 s só com legenda; nenhum momento mais de 4,5 s sem novidade na tela (marcadores e itens contam).
- Pelo menos um momento a cada 8 s; cobertura mínima de 70% do vídeo.

## Legenda, correções e sons
- A legenda (cartão claro, até 4 palavras, a palavra falada em verde) fica abaixo do queixo e some durante momentos sem `legenda: true`. `semLegenda: [{ de, ate }]` apaga em trechos extras.
- `correcoes`: `{ "Olho": "Olha" }` corrige a transcrição. `sfx: false` desliga os sons.
