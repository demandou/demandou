# Estado do teste de ponta a ponta (11/10/2026, fim da manhã)

Script pronto e provado sem gasto (--simular nos dois estilos, --conferir num vídeo antigo do projeto de teste, travas). O teste PAGO ainda não rodou: roda depois que o coordenador juntar os ramos e publicar. Nada publicado, nenhuma IA gasta, nenhuma escrita no banco.

## Como rodar (na raiz do repo ou do worktree)

```
npx tsx scripts/testes-e2e/ponta-a-ponta.mts --estilo modelo-manifesto --simular
npx tsx scripts/testes-e2e/ponta-a-ponta.mts --estilo sob-medida-3d            # o teste pago (US$ 3 a 6)
npx tsx scripts/testes-e2e/ponta-a-ponta.mts --acompanhar <videoJobId>         # retoma a vigília se o processo cair
npx tsx scripts/testes-e2e/ponta-a-ponta.mts --conferir <videoJobId>           # só leitura: conferências, custo e folhas
npx tsx scripts/testes-e2e/ponta-a-ponta.mts --limpar <videoJobId>             # cancelarVideo, só no projeto de teste
```

Opções: `--video <arquivo>` (padrão: 120 s, de 60 a 180 s do original.mp4 do scratchpad prova-obs, cortado com ffmpeg e guardado em scratchpad\e2e\trechos), `--prazo <min>` (padrão 150), `--cortes N` (padrão: o que montarTela pré-seleciona, teto de 2 pela nota).

O .env vem do .env.local da pasta principal (como scripts/dev/com-env-dev.mjs); os aliases `@/` saem do tsconfig.json pelo tsx.

## O que o script chama (as mesmas funções do app)

1. Estilo: `escolherModeloDoCurso`. No modelo do curso, também `levarModeloParaAsPecas` (podeConfirmar) e `registrarNota`, porque a tela chama sozinha o POST `{acao:"pecas"}` logo depois da escolha (components/video/pecas-no-estilo-do-modelo.tsx). No sob medida a tela não chama (emUso nulo em modelos-do-curso.tsx); se o projeto não tiver modelo do curso antes, o script escolhe o modelo-manifesto (com as peças) e só depois a opção, para a reserva existir.
2. Envio: portas do token (`conferirGravacao`, `conferirArmazenamento`, `limitesDoEnvio`), `put` privado em `videos/<projeto>/<nome>` com sufixo aleatório e multipart, `registrarGravacao` e `despacharPasso("transcrever")`.
3. Roteiro: a esteira para em "roteiro"; `montarTela` dá os pré-selecionados; `aprovarRoteiro` e `despacharPasso("cortar")`. Recusa 409 (plano de efeitos preparando) tenta de novo a cada 20 s por 10 min; se em 8 min o roteiro não tiver plano da jornada, desliga EDITOR_JORNADA no processo (registrado no relatório).
4. Vigília de 20 s: só SELECT pelo Prisma (video_jobs, pipeline_runs por config.videoJobId, posts, campaign_cards) e /saude do worker a cada 5 min. Progresso gravado em relatorio.json e relatorio.md a cada evento.
5. Fim: tempos, conferências, custo (ai_usage por projectId na janela mais o runId), folhas de quadros (ffmpeg tile; fonte arial por arquivo, o ffmpeg do Windows não tem fontconfig).

Chaves ligadas só no processo local (para a escolha e a aprovação): EDITOR_DO_CURSO, COMPLETO_PELO_MODELO, ARTE_PELO_MODELO, EDITOR_AVANCADO, EDITOR_JORNADA, MONTAGEM_NA_EDICAO, MONTAGEM_DO_COMPLETO, HIGGSFIELD_NA_EDICAO (todas 1). A verdade da produção é conferida pelo resultado no banco.

## Conferências (cada uma reprova com motivo)

- estilo gravado no projeto (project_memories editor/modelo-do-curso) igual ao pedido.
- cada corte: `montagem.estado` pronto; `montagem.curso.modelo` igual ao estilo; sem `curso.desistiu`, `curso.avancadoDesistiu`, `sobMedida.desistiu`; não saiu na reserva; `montadoUrl` existe e é diferente de `midia.verticalOriginal.url` (o cru); `midia.vertical.url` é a editada; chave com `/curso-` (modelo) ou `/avancado-` (sob medida).
- completo: `completoMontagem.estado` pronto; `completoMontagem.curso.modelo` igual ao estilo (no sob medida, nunca a reserva); sem `curso.desistiu`; `completoUrl` = `montadoUrl`; diferente de `completoOriginal.url`; no sob medida, arquivo fora de `completo-editado-curso`.
- artes (posts image, carousel, infographic do run): nasceram; cada uma com `metadata.arteNoModelo.modelo` igual ao estilo, `pendente` falso, sem `reserva`, sem `reservaFalhou`/`arteFalhou`, com `imageUrl`.
- capas dos cortes: `midia.capaArte.url` e `midia.capaNoModelo.modelo` igual ao estilo, sem pendente nem reserva.
- capas do completo: `video_jobs.capas.opcoes` e `capas.noModelo.modelo` igual ao estilo, sem pendente nem reserva.
- nenhuma peça em falha (vídeo failed, sem-montagem, arteFalhou, post failed, card com falha).
- nenhuma mídia crua como "esperando você" durante a edição (card video_clip fora do `cardEmProducao`, post com o vídeo cru, enquanto a montagem não terminou), olhado a cada leitura.
- a esteira terminou dentro do prazo.
- tempos contra a promessa (`segundosDaEtapa` e `segundosNoModeloDoCurso`): roteiro, cortes crus, montagem de cada corte, completo, capas, tudo.

## Dependem de campo que ainda não existe na base (nome mais provável, marcado no relatório)

- Completo sob medida: `completoMontagem.curso.modelo = "sob-medida-*"` (hoje sai a reserva; o ramo worktree-agent-a64c5db6ee08089fe liga o completo-avancado). Até lá, o sob medida REPROVA no completo, que é o certo pela regra.
- Artes sob medida: `arteNoModelo.modelo = "sob-medida-*"` (ramo worktree-agent-a94b187ebaa5d01f1, regraDaArtePeloModelo). Na base de hoje sai o modelo de reserva e reprova.
- Capas sob medida: `midia.capaNoModelo.modelo` e `capas.noModelo.modelo = "sob-medida-*"` (capaPelaIa ainda não ligada; se o outro dono gravar em campo novo, ajustar `conferir` no script).

## Custo

ai_usage não tem videoJobId: projectId na janela do teste mais o runId. Higgsfield grava em ai_usage (somada). RunPod NÃO grava em lugar nenhum: fica fora da soma (referência ~US$ 0,04 por trecho de 30 s no recorte). O custo que o worker relata em `curso.custoUsd` sai à parte, só de referência.

## Provas feitas sem gasto

- `--simular` modelo-manifesto e sob-medida-3d: tudo ok (relatórios em scratchpad\e2e\2026-10-11-1128-modelo-manifesto-simulado e 2026-10-11-1129-sob-medida-3d-simulado).
- Travas: `--projeto` de outro id, `--limpar` e `--acompanhar` de um vídeo de outro projeto (cmv3tyr0u) recusados.
- `--conferir cmuyanr0v0000qwtt7qcishm5` (vídeo antigo do projeto de teste, editor de antes): reprova tudo pelo motivo certo ("sem montagem.curso", "sem arteNoModelo", "sem capaNoModelo"); folhas de cortes, completo, artes e capas geradas e olhadas.

## Atenção

- O projeto de teste tem hoje nenhum estilo escolhido e um vídeo parado em "roteiro" (cmuyglw0w000204l5pqqmtknl, de 07/10). Não rodar `--acompanhar` nele (aprovaria e gastaria).
- O teste pago só depois de juntar os três ramos e publicar (worker com /saude ocioso). Ordem: sob-medida-3d, sob-medida-recorte, sob-medida-graficos, depois os 8 modelos provados.
