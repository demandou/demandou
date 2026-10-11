# Estado: artes e capas na edição sob medida (11/10/2026)

Ramo: worktree-agent-a94b187ebaa5d01f1 (alinhado ao backup-0210 em 692abc0 antes desta rodada). Nada publicado.

## Feito e testado

- Artes do projeto com modelo do curso pela IA de imagem (Nano Banana Pro, GPT Image na reescrita) com o prompt de estilo de cada modelo
  (lib/media/editor-do-curso/prompts-de-estilo.json, 79 modelos, gerado por scripts/prompts-de-estilo-dos-modelos.mjs).
- Rótulos e setas só com palavras da frase; reserva no estilo do modelo (cena sem texto e frase em código) antes do caminho antigo.
- Edição sob medida escolhida manda nas artes (não a reserva): PROMPTS_SOB_MEDIDA em lib/media/editor-do-curso/arte-pela-ia.ts
  (sob-medida-3d, sob-medida-recorte com a pessoa do quadro nítido, sob-medida-graficos), ligado em regraDaArtePeloModelo
  (lib/media/editor-do-curso/arte-pelo-modelo-servidor.ts).
- O assunto da arte vem da fala: trechoDaFala (arte-pela-ia.ts) escolhe a janela da transcrição que casa com a frase; o prompt
  separa SUBJECT (do trecho) e HOW TO DRAW IT (o estilo). A transcrição e o quadro nítido vêm de falaEFotoDoVideo
  (arte-pelo-modelo-servidor.ts), na semana e no refazer.
- Recorte com a foto: gerarComFotoNoGoogle (lib/media/editor-do-curso/arte-pela-ia-servidor.ts) manda o quadro nítido ao Nano Banana Pro.
- Nenhum logo de rede ou de app na arte.
- Testes: scripts/testes/arte-pela-ia-1110.test.mts (17), mais arte-pelo-modelo-1010, pecas-no-modelo-1010, estilo-mestre-0810,
  estilo-por-post-0810 e capa-nitida-1010: 112 de 112. npx tsc --noEmit limpo.

## Pela metade: as CAPAS na edição sob medida

- Pronto, mas ainda não chamado: capaPelaIa e comLogoDaMarca em lib/media/editor-do-curso/arte-pela-ia-servidor.ts
  (thumb 16:9 e capa 9:16 no estilo da opção, assunto da fala, quadro nítido quando a opção pede a pessoa, logo e cores da marca).
  Os tipos "thumb" e "capa-vertical" já existem em TipoDaArte (arte-pela-ia.ts).
- Falta ligar:
  1. lib/media/capas-do-completo.ts, gerarCapasDoCompleto: quando regraDaCapaPeloModelo devolve um modelo de PROMPTS_SOB_MEDIDA,
     não ir ao worker (caminhoDaCapa com temRegra falso) e, no lugar de comporCapa, chamar capaPelaIa (formato "16:9", frase da capa,
     contexto = título e resumo do radar, fala = transcript.text do vídeo, fotoDaPessoa = o quadro de fotoDaCapa em data URI) e seguir
     com o mesmo normalizarCapaParaYouTube e put; comporCapa só se capaPelaIa lançar.
  2. app/api/videos/[id]/capas/route.ts: com modelo sob medida, não chamar pedirCapasDosCortesNoModelo; em lib/media/capa-do-corte.ts,
     comporCapaDoCorte aceitar o modelo sob medida e chamar capaPelaIa (formato "9:16", trecho = texto do corte) antes do comporCapa.
  3. Teste para os dois caminhos (gerador falso) no mesmo arquivo de teste.
- Não mexer em lib/media/editor-avancado nem worker/src/avancado (o completo e o corte sob medida são de outro agente).

## Próximo passo exato

Fazer o item 1 acima em lib/media/capas-do-completo.ts, depois o 2, rodar tsc e os testes, e fazer a prova das capas
(1 thumb 16:9 e 1 capa 9:16 na Maquete 3D do run cmv3tyw9f, vídeo cmv3tyr0u000006jtaaqb1doa), olhando as imagens.

## Provas feitas (scratchpad C:\Users\devan\AppData\Local\Temp\claude\c--\7d44153b-b916-4289-8e78-2c8f60583a30\scratchpad)

- artes-ia\ : Torre e Manifesto (primeira rodada), folha-de-contato.jpg. Custo: cerca de US$ 1,48 em imagens, mais US$ 0,75 em prompts.
- artes-ia-anatomia\ : capa e lâmina do Anatomia e a reserva (cena sem texto). Custo: cerca de US$ 0,91 (com US$ 0,24 de prompts).
- artes-ia-fala\ : run cmv3tyw9f, 3 na Maquete 3D (3d-1-imagem, 3d-2-capa, 3d-3-lamina) e 2 no Anatomia com o assunto da fala
  (anatomia-fala-1-imagem, anatomia-fala-2-lamina); custos em custos-rodada-1.json e custos.json. Custo: cerca de US$ 1,28.
  Visto: a Maquete 3D saiu com o assunto da fala (mesa de edição, vídeo virando peças); a 3d-3-lamina trouxe logos de redes
  (corrigido depois no prompt, sem prova nova); a anatomia-fala-1-imagem ainda saiu abstrata (lente em corte).
- O script da prova é scripts/tmp/prova-arte-pela-ia-1110.mts (ignorado pelo git); a fala do vídeo está em artes-ia-fala\fala.txt.
