# Estado: artes e capas na edição sob medida (11/10/2026, fim da rodada)

Ramo: worktree-agent-a94b187ebaa5d01f1 (com o backup-0210 juntado). Nada publicado.

## Feito e testado

### Artes (já estavam prontas, mantidas)
- Artes do projeto com modelo do curso pela IA de imagem com o prompt de estilo de cada modelo (prompts-de-estilo.json, 79 modelos).
- Edição sob medida escolhida manda nas artes: PROMPTS_SOB_MEDIDA em lib/media/editor-do-curso/arte-pela-ia.ts
  (sob-medida-3d, sob-medida-recorte, sob-medida-graficos e agora a genérica "sob-medida", que não é mais oferecida
  na biblioteca mas não pode cair na reserva). O assunto vem da fala (trechoDaFala); o recorte desenha com o quadro nítido.

### Capas sob medida (ligadas nesta rodada)
- lib/media/capa-pela-ia.ts (novo): capasDoCompletoPelaIa (16:9, uma por frase, JPEG 1280x720 por normalizarCapaParaYouTube,
  guardada no store) e capaDoCortePelaIa (9:16, guardada como capa-arte-<i>.jpg). Gerador, conferência e onde guardar
  entram por parâmetro (teste e prova).
- lib/media/capas-do-completo.ts, gerarCapasDoCompleto: sob medida não vai ao worker (caminhoDaCapa devolve "ia") e sai
  por capasNoEstiloPelaIa. Modelo do curso: template no worker; recusado, a segunda tentativa no mesmo estilo pela IA.
  A opção `semModelo` (que forçava o caminho antigo) saiu; no lugar, `segundaTentativa`.
- app/api/videos/[id]/capas/route.ts: sob medida não chama pedirCapasDosCortesNoModelo; capasDosCortesNoEstilo
  (lib/media/capa-do-corte.ts) roda depois da resposta. Body `{ indices: [i], soCapa: true }` é o "Tentar de novo"
  da capa de um corte (só a capa, mesmo estilo).
- lib/media/refazer.ts, refazerCapa (o ajuste da capa pelo chat): com estilo, sai no mesmo estilo com o ajuste no prompt.

### Nunca trocar o estilo sozinho (artes e capas)
- noMesmoEstilo e TENTATIVAS_NO_ESTILO = 2 em arte-pela-ia-servidor.ts: tenta de novo no mesmo estilo; sem saldo lança na hora.
- Reserva permitida só no MESMO estilo: a cena do estilo sem texto com a frase em código (cenaComFraseEmCodigo), agora
  com a letra do estilo (tipografiaDoEstilo), a pessoa da foto no Recorte e a área livre à esquerda na thumb 16:9.
- Artes (arte-pelo-modelo-servidor.ts): o caminho antigo (arteDoDia, direcaoDaPeca, infográfico genérico) foi removido.
  desenharPeloCaminhoDeHoje virou desenharNoMesmoEstilo (lote recusado, callback que faltou, vigia, IA que falhou):
  pela IA no estilo gravado no post, 2 tentativas quando a IA é o caminho, 1 quando o template já foi a primeira;
  sem sair, marcarFalha com MOTIVO_DA_ARTE_QUE_PAROU (o quadro mostra "Tentar de novo" e "Nada foi cobrado").
- "Tentar de novo" do quadro (POST /api/projects/[id]/modelos-de-arte -> artes-aguardando-identidade.ts): o post com
  arteNoModelo.modelo volta ao mesmo estilo (redesenharNoEstilo), sem depender da identidade, sem cobrar; o refazer que
  parou (`cobrarAoSair`) cobra a arte quando ela sai.
- refazerArteNoModelo: devolve null só quando a peça não tem estilo; com estilo, a falha volta em `falhou` e o
  refazer-peca cobra só o texto (`arteParou`).
- regraDaArtePeloModelo: sob medida sempre pela IA (estiloVaiPelaIa), mesmo com ARTE_PELO_MODELO_IA=0, e nunca a reserva
  gravada junto (estiloDasArtesDoProjeto não recebe mais a reserva). Modelo do curso pela IA vale mesmo quando o modelo
  pede material ou entradas de fora (o prompt de estilo não depende delas).
- Capas: a falha técnica é `capas.falha` (completo, com "Tentar de novo" no card, components/video/capa-do-completo.tsx)
  e `clips[i].midia.capaFalhou` (corte, com o aviso components/video/aviso-da-capa.tsx acima do quadro, chave
  "capa-falhou" descartável). O intermediário do template que falhou chama `templateFalhou` (não "reserva").

### Campos que o teste de ponta a ponta confere (alinhado com o coordenador)
- Arte: posts com metadata.arteNoModelo.modelo = estilo (inclusive "sob-medida-*"), pendente false, imageUrl, sem
  reserva/reservaFalhou/arteFalhou (o fecharArte apaga a chave pedida como null).
- Capa do corte: clips[i].midia.capaArte.url e midia.capaNoModelo = { modelo: estilo, pendente: false, caminho: "ia" ou
  "template", feitoEm }, sem reserva nem templateFalhou.
- Capas do completo: capas.opcoes e capas.noModelo = { modelo: estilo, pendente: false, caminho, feitoEm }, sem reserva.

### Testes
- scripts/testes/capas-sob-medida-1110.test.mts (11, novo), arte-pela-ia-1110 (17), arte-pelo-modelo-1010 (26),
  pecas-no-modelo-1010 (4), estilo-mestre-0810 (19), estilo-por-post-0810 (23), capa-nitida-1010 (23): 123 de 123.
  descartar-avisos-0710: 95 de 95. npx tsc --noEmit limpo.

## Prova paga das capas (scratchpad C:\Users\devan\AppData\Local\Temp\claude\c--\0d23129a-eff3-41f9-b14d-68a5bd521df1\scratchpad\prova-capas)
- Script scripts/tmp/prova-capas-1110.mts (ignorado pelo git; dados por SELECT em dados-prova-capas-1110.mjs). Custo total US$ 1,31.
- 3d-thumb.jpg (Maquete 3D, 16:9): maquete isométrica de uma agência de agentes de IA, frase "SEU GÊMEO TRABALHA, VOCÊ VENDE"
  certa, laranja só em detalhes, logo da marca. Aprovada de primeira.
- 3d-vertical.jpg (Maquete 3D, 9:16, corte 0): player de vídeo em 3D soltando várias telas ("Um vídeo vira a semana inteira").
  A primeira saiu com rótulos a mais, a conferência reprovou e a segunda passou.
- graficos-thumb.jpg (Gráficos, 16:9): card escuro com a barra pequena e a grande; nas tentativas com texto desenhado o
  modelo insiste em escrever "10" junto de "dez", então saiu pela cena sem texto com a frase em código (mesmo estilo).
  graficos-thumb-rodada1.jpg é a rodada antes do conserto (frase em serifa por cima da cena); consertado com a letra do
  estilo e a área livre à esquerda.

## Pendências
- Gráficos com número escrito por extenso: a IA ainda desenha o algarismo; a reserva no mesmo estilo cobre, mas custa
  mais 4 imagens. Vale olhar no teste de ponta a ponta.
- Não mexi em lib/media/editor-avancado, worker/src/avancado nem lib/media/montagem-do-completo.ts.

## Rodada 11/10 (tarde): defeitos do teste de ponta a ponta na Maquete 3D

- Pendente para sempre (cmv422x5f, cmv42307k, cmv4231bz): as artes SAÍRAM pela IA (não foram ao worker); a
  correção da Vera (lib/media/correcao-do-dia-do-video.ts, corrigirDiaDoVideo) leu o post antes da arte, reescreveu
  a legenda e gravou o metadata velho por cima (16:48:00 e 16:48:15, igual ao card da Vera). Agora grava por
  metadataComMudancas (arte-pelo-modelo.ts) sobre o metadata lido na hora; a frase apontada pela Vera redesenha no
  MESMO estilo (arteNoEstiloComFrase), não mais pelo arteDoDia. `aguardandoIdentidade` ali era a marca do
  "fazendo" (marcarGerando), não espera de identidade.
- Vigia: lote pela IA não pergunta ao worker, prazo de 25 min (PRAZO_DA_ARTE_PELA_IA_MS), no máximo 2 voltas
  (VOLTAS_DO_VIGIA) e depois falha técnica com Tentar de novo; post com arte e lote pendente é fechado.
  enviarLoteAoWorker recusa opção sob medida antes de qualquer rede.
- Números: arte só com número da fala ou do material (lastroDaArte, infograficoSoComAFala em lastro-do-video.ts),
  na semana, no refazer e como última trava em desenharPelaIa; a extração recebe os números permitidos.
- Infográfico no estilo: linguagemDoInfografico (elemento visual do estilo desenha o visual e os módulos).
- Frase: mancheteCurta não corta mais por palavra (volta ao redator até 3 vezes); pareceTruncada pega fim em
  artigo, preposição e "o que você"; trechoRepetido pega "tarefa boa atrás de tarefa boa".
- Destaque: destaqueLegivel (papeis-da-paleta.ts) dá à letra em destaque o mesmo matiz com contraste 4,5.
- Teste: scripts/testes/artes-do-e2e-1110.test.mts (17). Nada pago, nada publicado.

## Rodada 11/10 (noite): Recorte com letreiro com a pessoa REAL (ramo sob-medida-recorte-pessoa-real)

- Defeitos do teste de ponta a ponta (vídeo cmv44o9nj00013stt5readmt5): a IA recebia o quadro nítido e redesenhava
  a pessoa (padre e homem de óculos nos infográficos), uma arte saiu com "DING" e o carrossel cmv44tzn0 parou com
  reservaFalhou "texto além do permitido: girar" (a cena "sem texto" do Recorte pedia o letreiro gigante e a foto).
- Regra (aula 8.2): a IA de imagem NUNCA desenha gente. No Recorte (post, carrossel, capas 16:9 e 9:16) a IA faz só o
  fundo e a palavra gigante (palavraDoLetreiro), com o palco vazio (promptDoFundoDoRecorte e layoutDoFundoDoRecorte,
  a mesma geometriaDoRecorte do código); a camada é conferida SOZINHA (só a palavra, permitirPessoas falso). A pessoa
  é o recorte real (PNG com alfa do /melhor-quadro ou do /recortar do worker, sem rota nova), colado em código em
  recorte-com-letreiro.tsx com a cabeça na metade de baixo da palavra; a frase entra em código.
- Reserva no MESMO estilo: a palavra pela IA reprovada nas 3 tentativas, o fundo sai sem texto e a palavra entra em
  código; nem isso passou, lança (noMesmoEstilo, Tentar de novo).
- Infográfico do Recorte: elementoNoInfografico sem palco e sem gente; reprovado por gente ou texto inventado agora
  lança (infograficoReprovadoGrave), antes saía mesmo reprovado.
- Removidos gerarComFotoNoGoogle, GeradorComFoto, inj.gerarComFoto e fotoDaPessoa (agora recorteDaPessoa).
- Testes: recorte-pessoa-real-1110 (11, novo), arte-pela-ia-1110 (17), capas-sob-medida-1110 (11),
  artes-do-e2e-1110 (19), arte-pelo-modelo-1010 (26), capa-nitida-1010 (23), pecas-no-modelo-1010 (4). tsc limpo.
- Prova paga (scratchpad recorte-real, US$ 1,23, nada gravado no banco): post-instagram.jpg (Bruno real, EXCELÊNCIA
  atrás da cabeça; a palavra pela IA reprovou por cartão cortado na borda e saiu pela reserva com a palavra em código)
  e thumb-16x9.jpg (Bruno real, PRODUTIVIDADE pela IA atrás da cabeça, frase em código). Depois da prova os cartões
  passaram a ficar a 10% da borda e o pedido encurtou para caber nos 5000 caracteres do GPT Image (ainda sem prova paga).
