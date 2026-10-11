# Estado do teste de ponta a ponta (11/10/2026)

Trabalho interrompido a pedido (o Bruno segue numa conversa nova). Nenhum teste rodou, nada foi publicado, nenhum gasto de IA.

## O que está feito

- Ramo `worktree-agent-a7ad27ed4c9a8b7a6` alinhado ao `backup-0210` por fast-forward (base 466f7ca).
- Levantamento inicial dos pontos de entrada do app (abaixo).
- Nenhum código do teste escrito ainda: `scripts/testes-e2e/` não existe.

## Como o envio é feito na plataforma (o que o teste deve chamar, sem reimplementar)

1. Estilo: `escolherModeloDoCurso(projectId, modelo)` em `lib/media/editor-do-curso/no-corte.ts` (linha 153). A tela chama pela rota `app/api/projects/[id]/modelo-do-curso/route.ts` (PUT), que também usa `modeloPodeSerEscolhido`, `ehSobMedida` e `OPCOES_SOB_MEDIDA` (`lib/media/editor-avancado/no-corte.ts`) e, depois, `levarModeloParaAsPecas`. Conferir no PUT a ordem exata e repetir no script (sob medida pode ter caminho próprio).
2. Subida do vídeo: o cliente usa `@vercel/blob/client` contra `app/api/videos/upload/route.ts` (`handleUpload`). No `onUploadCompleted` a rota chama `registrarGravacaoEmPartes` (`lib/media/partes-servidor.ts`) e `despacharPasso` (`lib/media/piloto-do-servidor.ts`). O `POST` de `app/api/videos/route.ts` também usa `registrarGravacao` / `descartarGravacaoRecusada` (`lib/limites-do-plano`) e `validarPartes` (`lib/media/partes-da-gravacao.ts`). Falta ler as duas rotas inteiras para decidir: subir com `put` privado do `@vercel/blob` (mesmo prefixo de caminho que a rota gera) e chamar a mesma função de registro + `despacharPasso`.
3. Aprovação do roteiro: ainda não verificado se a esteira tem aprovação de roteiro; procurar em `lib/media/piloto-do-servidor.ts` e nas rotas de `app/api/videos/[id]/`.
4. Limpeza: `cancelarVideo(id, userId)` em `lib/media/cancelar-video.ts` (deps padrão do banco).
5. Previsão de tempos: `lib/media/linha-do-tempo.ts`.

## O que falta (arquivo e função)

- `scripts/testes-e2e/ponta-a-ponta.mts`:
  - argumentos: `--estilo <modelo|sob-medida-3d|sob-medida-recorte|sob-medida-graficos>`, `--video <arquivo>` (padrão: trecho de 60 a 90 s de `scratchpad\prova-obs\original.mp4` cortado com ffmpeg; aceitar vertical), `--prazo <min>`, `--simular`, `--limpar <videoJobId>`.
  - trava: só o projeto `cmtmym5bo000004l80wwvpdd7` (O essencial bem feito), recusar qualquer outro id.
  - etapa estilo: `escolherModeloDoCurso`.
  - etapa envio: blob privado + registro + `despacharPasso` (item 2).
  - etapa roteiro: aprovar pela mesma função da rota, se existir.
  - acompanhamento: `video_jobs.clips[i].montagem`, montagem do completo, `posts` e `campaign_cards` do run, worker `/saude`; tempo por etapa.
  - conferências (reprovar com motivo): corte com `curso.modelo` igual ao escolhido, sem desistência nem reserva, url editada diferente do corte cru; completo no estilo; arte de post (image, carousel, infographic) com `metadata.arteNoModelo` pela IA no estilo; capas presentes; nenhum post "esperando você" com mídia crua durante a edição; tempos contra `linha-do-tempo.ts`.
  - folha de contato (ffmpeg tile) com quadros do corte, do completo, das artes e das capas.
  - relatório json e md em `scratchpad\e2e\<data-estilo>\` com veredito, tempos, custo de IA (tabela de uso de IA por runId/videoJobId, só SELECT) e caminhos das imagens.
  - `--simular`: valida estilo, projeto, funções importáveis, worker `/saude`, ffmpeg e o trecho, sem subir vídeo.
  - `--limpar`: `cancelarVideo` no vídeo de teste.
- Regras: sem SET pela DATABASE_URL; nunca tocar projeto de cliente; custo aprovado US$ 3 a 6 por teste; sem travessão nos textos.

## Comando previsto

```
npx tsx scripts/testes-e2e/ponta-a-ponta.mts --estilo modelo-manifesto --simular
npx tsx scripts/testes-e2e/ponta-a-ponta.mts --estilo modelo-manifesto
npx tsx scripts/testes-e2e/ponta-a-ponta.mts --limpar <videoJobId>
```

(Conferir como os outros scripts do repo carregam o `.env` e os aliases `@/`; ajustar o comando a isso.)
