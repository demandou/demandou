# O editor de vídeo da Demandou pelos modelos do curso (estado em 11/10/2026)

Documento de referência do editor. O histórico dia a dia está no HANDOFF.md; aqui fica o que vale hoje, as regras e o que falta.

## Regras do Bruno (não negociáveis)

1. **O estilo escolhido vale para TODAS as peças da campanha:** cortes, vídeo completo, artes dos posts (imagem, carrossel, infográfico) e capas. Nenhuma peça sai em outro estilo.
2. **Nunca trocar o estilo sozinho.** Se o estilo escolhido falhar, tenta de novo no mesmo estilo; se falhar de novo, a peça para como falha técnica com "Tentar de novo" e sem cobrança. Reserva automática para outro estilo é proibida.
3. **O estilo vem do modelo, a cor vem da marca.** A cor da marca vai nos detalhes, nunca tingindo foto.
4. **O assunto vem da fala.** O que aparece (objeto, cena, número) sai do que a pessoa diz; o estilo decide só como é desenhado.
5. **"Pronto" = teste de ponta a ponta aprovado** na produção, no projeto de teste "O essencial bem feito" (cmtmym5bo000004l80wwvpdd7), com corte, artes, capas e completo conferidos. Custo aprovado: US$ 3 a 6 por teste.
6. **Escopo menor só combinado com o Bruno.** Entrega parcial ou "jeitinho" é proibido.
7. Teto de IA: US$ 1 por minuto nos modelos do curso (US$ 2 por corte); nos estilos sob medida, ~US$ 1,50 a 2 por minuto no completo (aprovado em 11/10).
8. Planos: vídeo de até 7 min (Starter), 22 min (Pro), 2 h (Enterprise).
9. Texto sem travessão em qualquer lugar.

## Como funciona hoje (produção)

| Peça | Caminho | Arquivos |
|---|---|---|
| Corte (modelo do curso) | worker roda o fluxo do curso: trecho, preparar, cortar, plano (Opus pela rota do app), conferir, revisão do passo 8, render, trilha | worker/src/modelo/editar-no-modelo.mjs, lib/media/montagem-nos-cortes.ts, lib/media/editor-do-curso/* |
| Completo (modelo do curso) | mesmo fluxo em blocos de ~150 s, versão 16:9 do modelo para gravação deitada, edição leve da aula 9 (30% de cobertura, um momento a cada 25 s), passo das imagens por bloco | lib/media/montagem-do-completo.ts, worker/src/modelo/blocos-do-plano.mjs, render-em-partes.mjs |
| Artes dos posts | IA de imagem (Nano Banana Pro, depois Nano Banana 2, GPT Image pela Higgsfield) com o prompt de estilo do modelo; reserva = cena no estilo do modelo sem texto e frase em código | lib/media/editor-do-curso/arte-pela-ia*.ts, prompts-de-estilo.json, app/api/editor-do-curso/arte-pela-ia |
| Capas | quadro nítido da gravação (worker/src/quadro-nitido.mjs) e capa pelo modelo | lib/media/editor-do-curso/arte-pelo-modelo*.ts |
| Editor avançado (Maquete 3D, Recorte com letreiro, Gráficos) | só o corte hoje: a IA (Sonnet) escreve uma cena Remotion por corte; recorte pela GPU do RunPod | lib/media/editor-avancado/*, worker/src/avancado/*, app/api/editor-avancado/cena |

Chaves na Vercel (produção): EDITOR_DO_CURSO=1, COMPLETO_PELO_MODELO=1, ARTE_PELO_MODELO=1, EDITOR_AVANCADO=1. Todas comparadas com trim (11/10: uma delas foi gravada com quebra de linha e o caminho nunca ligou). Gravar variável sempre com `printf '1' | npx vercel env add NOME production`, nunca pelo pipe do PowerShell.

Railway (worker video-worker): RUNPOD_API_KEY e RUNPOD_ENDPOINT_RECORTE (endpoint b0ra73znwv21jy). O contêiner usa tini como processo 1 (o limite é de 1000 processos; sem o tini, os zumbis do Chrome derrubavam tudo com EAGAIN). O fetch longo do worker usa undici com headersTimeout de 20 min.

Versões: 77 modelos verticais rodam no corte; 19 têm versão 16:9 para o completo (lista em lib/media/editor-do-curso/versoes.json, gerada por `npm run modelos:versoes`). As outras ~58 versões 16:9 estão pela metade (workflows parados; pastas worker/modelos/*-16x9 fora do git são rascunho).

## O que está em andamento (ramos de agentes, não juntados)

Cada ramo tem na raiz um arquivo ESTADO-*.md com o ponto exato.

1. **Editor avançado inteiro** (ramo worktree-agent-a64c5db6ee08089fe, último 5799894, também em backup/editor-avancado-1010): rota da cena ASSÍNCRONA pronta e provada (escrita em ~3,5 min a ~US$ 0,29 com esforço baixo); completo sob medida PELA METADE (falta o 16:9, o orquestrador por bloco completo-avancado.mjs e a ligação em montagem-do-completo.ts). ATENÇÃO: até essa ligação entrar, o completo de projeto sob medida sai no modelo de reserva, contra a regra; é a primeira coisa a fechar.
2. **Artes e capas das opções sob medida e assunto vindo da fala** (ramo worktree-agent-a94b187ebaa5d01f1, último c6a99a1): artes prontas e testadas (112 testes); capas pela metade (capaPelaIa pronta, falta ligar em lib/media/capas-do-completo.ts e app/api/videos/[id]/capas/route.ts com lib/media/capa-do-corte.ts, e a prova).
3. **Teste de ponta a ponta** (ramo worktree-agent-a7ad27ed4c9a8b7a6, último 350bfb5): só o levantamento; o script scripts/testes-e2e/ponta-a-ponta.mts ainda não existe. Caminho do envio: app/api/videos/upload/route.ts (handleUpload, registrarGravacaoEmPartes, despacharPasso em lib/media/piloto-do-servidor.ts); estilo por escolherModeloDoCurso; limpeza por cancelarVideo.

## O que falta para "pronto" (na ordem)

1. Juntar os três ramos, publicar (deploy pela cópia limpa, worker só com /saude ocioso).
2. Rodar o teste de ponta a ponta na Maquete 3D, no Recorte e nos Gráficos; consertar e repetir até passar.
3. Rodar nos 8 modelos provados (Manifesto, Viral, Lousa, Painel, Torre, Anatomia, Medida, Órbita).
4. Só então chamar o Bruno para testar.
5. Depois: roteiro do completo em paralelo (velocidade), as versões 16:9 restantes, os outros modelos em blocos.

## Lições que custaram caro (não repetir)

- Testar peça isolada não prova a jornada; o teste de ponta a ponta é obrigatório.
- Agentes em paralelo precisam de uma definição única do que "escolher um estilo" significa; um dono por frente.
- Reserva automática para outro estilo esconde a falha e entrega errado.
- Variável da Vercel pelo PowerShell leva quebra de linha.
- Node como PID 1 no contêiner acumula zumbis; fetch do Node desiste em 5 min sem resposta; função da Vercel morre em 800 s.
