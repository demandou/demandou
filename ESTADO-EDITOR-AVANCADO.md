# Estado do editor avançado (11/10/2026)

Ramo: `worktree-agent-a64c5db6ee08089fe` (backup remoto: `backup/editor-avancado-1010`). O `backup-0210` foi juntado até 692abc0 antes das mudanças desta rodada.

## Feito e testado

- **Rota da cena assíncrona** (commits d368b43 e c9f3b3a). Estes commits ainda não foram publicados nem juntados.
  - `app/api/editor-avancado/cena/route.ts`: `{ fase }` responde 202 `{ id }` na hora; a fase roda em `after()`, numa invocação própria com o prazo dela, e grava o fim no Blob privado. `{ consultar: id }` devolve um destes estados: andando, pronto, falhou ou perdido.
  - `lib/media/editor-avancado/trabalho.ts`: o id é `<ms>-<uuid>`. Sem fim gravado depois de 840 s, o trabalho vira "perdido". O fim é lido por `head` (não pelo CDN) e apagado depois de lido.
  - `worker/src/avancado/pedir-cena.mjs`: o worker consulta a cada 8 s, com prazo de 16 min por pedido. A escrita que acabou só pensando é pedida de novo uma vez com esforço baixo, numa invocação nova, e os dois custos se somam. Também aceita o app antigo, que respondia 200.
  - `worker/src/index.mjs`: `pedirCena` usa esse cliente.
  - `lib/media/editor-avancado/escrever-cenas.ts`: escrita com esforço **baixo** e teto de 32 mil tokens; consertos com esforço médio e 20 mil. Cada chamada tem prazo de 9 min. Não há mais segunda tentativa dentro da mesma invocação.
  - Log por fase: no app, `[editor-avancado] <fase> ...: pronto em N s, US$ X, esforço Y`. No worker, `ia <fase>: N s, US$ X`, e `temposDaIa` vai no resultado.
  - Testes: `npx tsx --test scripts/testes/editor-avancado-1010.test.mts`, 30 de 30 passam.
- **Prova paga pela rota de verdade**, local: `next dev` na porta 3517 com o banco apontado para lugar nenhum. Trecho do teste do Bruno: vídeo cmv3tyr0u, 63,26 a 99,23 s, Maquete 3D.
  - Escrita com esforço médio: pensou os 32 mil tokens em **346 s** sem escrever nada (US$ 0,40). Foi isso que fez o esforço padrão passar a ser o baixo.
  - Escrita com esforço baixo: **213 s**, US$ 0,29.
  - Conserto de código: 5 s no app, US$ 0,03. Revisão: 30 s, US$ 0,004, sem nenhuma cena reprovada.
  - Portões: 175 s. Render local (i3, CPU): 373 s. Total: 1.172 s.
  - Custo da prova: **US$ 0,725**, dos quais US$ 0,40 foram a tentativa no médio. Com o baixo direto, a escrita fica em cerca de US$ 0,29 e 3,5 min.
  - Saída: `C:\Users\devan\AppData\Local\Temp\claude\c--\7d44153b-b916-4289-8e78-2c8f60583a30\scratchpad\editor-avancado\prova-rota-maquete\` (corte.mp4, folha-1.jpg, folha-2.jpg, resumo.json). Olhei a folha: a maquete monta na palavra dita, a moldura chanfrada fica no canto e a legenda nas cores da marca.
- **Render 3D na GPU** (commits 7254372 até 550e8b7): a rota `RENDER_3D_NA_GPU` existe, mas deve ficar **desligada**.
  - Medida no Torre, 7 s de vídeo: GPU no RunPod 33 s por segundo de vídeo; o mesmo host por CPU 21,6 s/s; Railway cerca de 20 s/s; i3 72 s/s.
  - O tempo está na decodificação do vídeo e na captura dos quadros, não no 3D. A GPU não compensa.
  - Endpoint do render: `s9g5hq4utdrje7` (0 workers mínimos, não custa parado).
- **Recorte na GPU**: endpoint `b0ra73znwv21jy`.
  - 2,92 s de processamento por segundo de vídeo, contra 21 a 51 s/s na CPU.
  - Cerca de US$ 0,04 por trecho de 30 s.
  - Já publicado pelo coordenador.
- Gasto total no RunPod nesta rodada: cerca de US$ 0,68.

## Pela metade: o completo sob medida (pedido em 11/10)

Pedido: Maquete 3D, Recorte ou Gráficos valem também para o vídeo completo; blocos de cerca de 60 s; teto de cerca de US$ 2 por minuto; prova com 2 a 3 min da gravação `prova-obs`, até US$ 6.

1. **Feito, ainda sem commit antes deste arquivo:** `worker/src/avancado/render-isolado.mjs` ganhou `pedido.bruto: true` na ação "final". O bloco sai em `.mov` com o áudio PCM, sem o -14 LUFS, para a emenda com `-c copy` e a normalização uma vez só no vídeo inteiro. Ninguém usa ainda.
2. **Falta: formato deitado no editor avançado.** O kit já usa `LARGURA` e `ALTURA` de `pedido.json`. O que ainda está fixo em 1080 × 1920:
   - `editarAvancado` em `worker/src/avancado/editar-avancado.mjs`, linha do `gravarDados`, que hoje fixa `largura: 1080, altura: 1920`. Precisa tomar `pedido.formato`.
   - `geometriaDoApresentador` em `worker/src/avancado/geometria.mjs`, com 1080/1920 e o 730 do rosto.
   - `conferirRoteiro` em `worker/src/avancado/portao.mjs`: a caixa até 1280 × 2120, a legenda com 1056 de largura e 1840 de altura. Precisa receber as dimensões em `opcoesDoPortao`.
   - `blocoDoCorte` em `lib/media/editor-avancado/escrever-cenas.ts`: o texto "o quadro é 1080 × 1920". Precisa de `contexto.quadro`.
   - `worker/avancado/kit-api.md`: uma seção para o 16:9.
   - `Cartao.tsx`: os padrões 1080 e 1920.
3. **Falta: o completo no worker.** Arquivo novo `worker/src/avancado/completo-avancado.mjs`:
   - extrai a fala limpa inteira (`extrairTrecho` com `manter`);
   - escolhe o formato pela gravação;
   - divide em blocos de cerca de 60 s na maior pausa perto de 60 s (função pura, com teste);
   - chama `editarAvancado` por bloco. O `obterOriginal` devolve o trecho inteiro, com `inicio` e `duracao` do bloco, sem trilha, `bruto: true` e a técnica fixa (a do projeto; no "sob-medida" genérico, o JEV decide no primeiro bloco e ela se mantém);
   - passa `contexto.continuidade`: o último quadro do apresentador e as cenas do bloco anterior, tirados do `roteiro.json` de `arquivosDaCena`;
   - divide o teto por bloco a partir de US$ 2 por minuto;
   - emenda os `.mov` com `-c copy`, como faz `render-em-partes.mjs` nas linhas 140 a 157, aplica o -14 LUFS e a trilha (`misturarAudio` de `../sons.mjs`);
   - o recorte pela GPU já vale em cada bloco, pelo `destinoDoRecorte` e `publicar` de `index.mjs`;
   - rota no worker: `/editar-avancado` com `completo: true`, ou uma rota nova, no mesmo molde da fila e do callback.
4. **Falta: a ligação no app.**
   - `lib/media/montagem-do-completo.ts`: `caminhoDoCompletoNoModelo` e `enviarCompletoAoModelo`, por volta das linhas 2219 a 2300. Com a escolha `sob-medida-*` do projeto (`escolhaDoEditorDoProjeto` em `lib/media/editor-do-curso/no-corte.ts`), enviar ao worker avançado com `completo: true`, `cenaUrl` e o callback de sempre (`/api/videos/<id>/montar-completo-callback`).
   - Hoje `modeloDoCursoDoProjeto` devolve a reserva para o sob-medida. Por isso, até isto ficar pronto, o completo de um projeto sob medida sai no modelo de reserva.
   - Cuidado: já existe um `sobMedida` diferente em `montagem-do-completo.ts`, que é o editor por comando. Não confundir os nomes.
   - Previsão honesta em `lib/media/linha-do-tempo.ts`, ao lado de `segundosNoModeloDoCurso`.
   - Não mexer em `lib/media/editor-do-curso/arte-pela-ia*`.

## Próximo passo exato

Fazer o item 2 (formato deitado). Depois o item 3, com teste puro da divisão em blocos e da continuidade. Depois a prova paga local, com 2 a 3 min de `scratchpad\prova-obs\original.mp4` em 16:9, Maquete 3D ou Gráficos, até US$ 6, olhando as folhas. Por último o item 4.

## Medidas de referência

| O que | Tempo | Custo |
|---|---|---|
| Escrita, esforço baixo, 36 s, Maquete 3D | 213 s | US$ 0,29 |
| Escrita, esforço médio (descartada) | 346 s, sem escrever nada | US$ 0,40 |
| Velocidade do Sonnet 5 | cerca de 92 tokens por segundo | |
| Render final da Maquete, i3 | cerca de 10 s por segundo de vídeo | |
| Revisão por rodada | cerca de 30 s | US$ 0,004 |
| Corte inteiro, Maquete 36 s | | cerca de US$ 0,35 com o baixo direto |
