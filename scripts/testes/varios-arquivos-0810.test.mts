// A GRAVAÇÃO EM PARTES (08/10/2026): o cliente envia 2, 3 arquivos da mesma
// gravação, confirma a ordem (1, 2, 3) e o worker junta antes da transcrição.
// As regras puras, a prova no código de que cada caminho pergunta a elas e,
// quando há ffmpeg na máquina, uma junção de verdade de três partes pequenas
// (a prova completa, com sincronia e volume, é worker/prova-juntar-partes.mjs
// no ffmpeg 5.1 do contêiner). Nada aqui toca banco, storage ou worker.
// Rodar: npx tsx --test scripts/testes/varios-arquivos-0810.test.mts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  MAX_PARTES,
  datasInformativas,
  listaCompletaNoAviso,
  lerPedidoDaParte,
  moverParte,
  nomeDaGravacaoEmPartes,
  partesPorJuntar,
  registroDasPartes,
  resumoDasPartes,
  somaDosBytes,
  sugerirOrdem,
  urlDaParteValida,
  validarPartes,
  type PartesDaGravacao,
} from "@/lib/media/partes-da-gravacao";
import { etapaDeRetomada, proximaAcao, prazoDaEtapa, MORTE, NOME_DA_ETAPA, TRABALHANDO, estaTrabalhando } from "@/lib/media/video-state";
import { decidirFalhaExplicita, PASSO_DA_ETAPA, type FalhaParaDecidir } from "@/lib/media/falha-explicita-do-video";
import { CODIGO_DA_ETAPA, NOME_DA_ETAPA_NO_AVISO } from "@/lib/notificacoes/tipos";
import { chavesCandidatasDoVideo } from "@/lib/avisos/chaves";
import { lerLinhaDoTempo, type EntradaDaLinha } from "@/lib/media/linha-do-tempo";
import { podeCancelarGravacao, avisoDoQueTerminaSozinho } from "@/lib/media/cancelamento";
import {
  argumentosDaParte,
  argumentosDaEmenda,
  conferirJuncao,
  filtroDeAudio,
  filtroDeVideo,
  juntarArquivos,
  lerSondagem,
  planoDaJuncao,
  toleranciaDaJuncao,
} from "../../worker/src/juntar-partes.mjs";

// Sem o CR do checkout do Windows: os testes procuram trechos com LF.
const ler = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const TRAVESSAO = new RegExp(String.fromCharCode(0x2014));
const PROJETO = "cmprojeto1";
const url = (n: string) => `https://abc.private.blob.vercel-storage.com/videos/${PROJETO}/${n}-XyZ.mp4`;

// ─── a ordem sugerida e a confirmada ───

test("a ordem sugerida vem da data de gravação quando ela informa", () => {
  const partes = [
    { nome: "IMG_0031.MOV", modificadoEm: Date.UTC(2026, 9, 8, 10, 20) },
    { nome: "IMG_0029.MOV", modificadoEm: Date.UTC(2026, 9, 8, 10, 0) },
    { nome: "IMG_0030.MOV", modificadoEm: Date.UTC(2026, 9, 8, 10, 10) },
  ];
  const s = sugerirOrdem(partes);
  assert.equal(s.criterio, "data");
  assert.deepEqual(s.ordem.map((i) => partes[i].nome), ["IMG_0029.MOV", "IMG_0030.MOV", "IMG_0031.MOV"]);
});

test("sem data que informe (a hora da escolha no celular), a ordem é pelo nome, como gente lê", () => {
  const agora = Date.now();
  const partes = [
    { nome: "parte 10.mp4", modificadoEm: agora + 3 },
    { nome: "Parte 2.mp4", modificadoEm: agora + 1 },
    { nome: "parte 1.mp4", modificadoEm: agora + 2 },
  ];
  assert.equal(datasInformativas(partes), false, "milissegundos de diferença é a hora do clique");
  const s = sugerirOrdem(partes);
  assert.equal(s.criterio, "nome");
  assert.deepEqual(s.ordem.map((i) => partes[i].nome), ["parte 1.mp4", "Parte 2.mp4", "parte 10.mp4"]);
  assert.equal(sugerirOrdem([{ nome: "b.mp4" }, { nome: "a.mp4" }]).criterio, "nome", "sem data nenhuma");
  assert.equal(datasInformativas([{ nome: "a", modificadoEm: 0 }, { nome: "b", modificadoEm: 5000 }]), false);
});

test("as setas sobem e descem uma parte sem perder nenhuma, e fora da lista não fazem nada", () => {
  const l = ["a", "b", "c"];
  assert.deepEqual(moverParte(l, 2, 1), ["a", "c", "b"]);
  assert.deepEqual(moverParte(l, 0, 1), ["b", "a", "c"]);
  assert.equal(moverParte(l, 0, -1), l);
  assert.equal(moverParte(l, 2, 3), l);
  assert.deepEqual(l, ["a", "b", "c"], "a lista original não muda");
});

test("a tela pergunta a ordem com todas as letras e só envia depois de confirmada", () => {
  const lista = ler("components/video/partes-da-gravacao.tsx");
  assert.ok(lista.includes("Em que ordem estes trechos entram no vídeo?"));
  assert.ok(lista.includes("Confirmar esta ordem"));
  assert.ok(/aria-label=\{`Subir a parte/.test(lista) && /aria-label=\{`Descer a parte/.test(lista), "setas acessíveis");
  const envio = ler("components/video/video-upload.tsx");
  assert.ok(envio.includes("disabled={!v?.ok || enviando || (emPartes && !confirmada)}"), "o botão espera a confirmação");
  assert.ok(/if \(emPartes \? !vereditoDasPartes\?\.ok \|\| !confirmada/.test(envio), "e o envio confere de novo");
  // Mexer (subir, descer, tirar, acrescentar) pede a confirmação de novo.
  const mexer = envio.slice(envio.indexOf("onMover={"), envio.indexOf("onConfirmar={"));
  assert.equal((mexer.match(/setConfirmada\(false\)/g) ?? []).length, 2, "mover e tirar desconfirmam");
  assert.ok(/async function escolher[\s\S]*?setConfirmada\(false\)/.test(envio), "acrescentar desconfirma");
  assert.ok(envio.includes("multiple"), "o seletor aceita vários arquivos");
});

// ─── um arquivo só segue igual ───

test("um arquivo só: o mesmo envio, o mesmo registro e a mesma transcrição de antes", () => {
  const envio = ler("components/video/video-upload.tsx");
  assert.ok(envio.includes("clientPayload: JSON.stringify({ projectId }),"), "o token do arquivo único não leva parte");
  assert.ok(/blobUrl: blob\.url,\s*originalName: arquivo\.file\.name,\s*sizeBytes: arquivo\.file\.size,/.test(envio), "registro de sempre");
  const upload = ler("app/api/videos/upload/route.ts");
  assert.ok(upload.includes('if (video.status === "uploaded") await despacharPasso(video.id, "transcrever");'), "o aviso do arquivo único transcreve");
  // Sem partes, nada muda nas regras.
  assert.equal(etapaDeRetomada({ temTranscricao: false, temTrechos: false }), "transcribe");
  assert.deepEqual(proximaAcao({ status: "uploaded", temTranscricao: false, temTrechos: false, attempts: 0 }), { rotulo: "Transcrever", rota: "transcribe" });
  assert.equal(partesPorJuntar(null), false);
  assert.equal(resumoDasPartes(null), null);
  const linha = lerLinhaDoTempo(entrada({ status: "uploaded" }));
  assert.ok(!linha.passos.some((p) => p.chave === "partes"), "sem partes, a linha não ganha passo");
  assert.equal(linha.passos.find((p) => p.chave === "ouvindo")?.estado, "agora");
});

// ─── as partes guardadas na ordem ───

test("o registro guarda as partes na ordem que a pessoa confirmou, nunca reordena", () => {
  const brutas = [
    { url: url("c"), nome: "c.mp4", bytes: 300, duracaoSeg: 30 },
    { url: url("a"), nome: "a.mp4", bytes: 100, duracaoSeg: 10.5 },
    { url: url("b"), nome: "b.mp4", bytes: 200, duracaoSeg: null },
  ];
  const r = validarPartes(brutas, PROJETO);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.itens.map((p) => p.nome), ["c.mp4", "a.mp4", "b.mp4"]);
  const reg = registroDasPartes(r.itens, "data", new Date("2026-10-08T12:00:00Z"));
  assert.equal(reg.versao, 1);
  assert.equal(reg.criterio, "data");
  assert.equal(reg.juntado, null);
  assert.equal(registroDasPartes(r.itens, "qualquer").criterio, "manual");
  assert.equal(somaDosBytes(r.itens), 600);
  assert.equal(nomeDaGravacaoEmPartes(r.itens.map((p) => p.nome)), "c, em 3 partes");
  // As duas portas (o navegador e o aviso do storage) registram pelo mesmo
  // caminho: a PRIMEIRA parte como chave e a lista inteira na transação.
  assert.ok(ler("app/api/videos/route.ts").includes("registrarGravacaoEmPartes({ userId, projectId, itens, criterio })"));
  assert.ok(ler("app/api/videos/upload/route.ts").includes("registrarGravacaoEmPartes({ userId, projectId, itens, criterio: pedido.criterio })"));
  const servidor = ler("lib/media/partes-servidor.ts");
  assert.ok(servidor.includes("blobUrl: itens[0].url,") && servidor.includes("partes: registroDasPartes(itens, args.criterio),"));
  assert.ok(ler("lib/limites-do-plano.ts").includes("if (args.partes) await tx.$executeRaw`UPDATE video_jobs SET partes ="), "na mesma transação da criação");
  // Registro repetido depois da junção (o blobUrl já é o juntado) acha o mesmo vídeo pela primeira parte.
  assert.ok(servidor.includes("partes -> 'itens' -> 0 ->> 'url' = ${itens[0].url}"));
  // E o worker recebe exatamente a lista guardada, na mesma ordem.
  assert.ok(servidor.includes("partes: partes.itens.map((p) => ({ url: p.url, nome: p.nome })),"));
});

test("a lista do navegador é conferida: só gravação deste projeto, sem repetir, até o teto", () => {
  assert.equal(urlDaParteValida(url("a"), PROJETO), true);
  assert.equal(urlDaParteValida(url("a").replace(PROJETO, "outro"), PROJETO), false, "gravação de outro projeto");
  assert.equal(urlDaParteValida("https://exemplo.com/videos/cmprojeto1/a.mp4", PROJETO), false, "fora do nosso storage");
  assert.equal(validarPartes([{ url: url("a") }], PROJETO).ok, false, "uma parte só não é gravação em partes");
  assert.equal(validarPartes([{ url: url("a") }, { url: url("a") }], PROJETO).ok, false, "repetida");
  const demais = Array.from({ length: MAX_PARTES + 1 }, (_, i) => ({ url: url(`p${i}`) }));
  assert.equal(validarPartes(demais, PROJETO).ok, false);
});

test("o aviso do storage só registra quando chega a última parte que faltava", () => {
  const pedido = lerPedidoDaParte(
    { indice: 1, criterio: "nome", partes: [{ url: url("a"), nome: "a.mp4", bytes: 1, duracaoSeg: 2 }, { url: null, nome: "b.mp4", bytes: 1, duracaoSeg: 3 }, { url: null, nome: "c.mp4", bytes: 1 }] },
    PROJETO
  );
  assert.ok(pedido);
  assert.equal(listaCompletaNoAviso(pedido!, url("b")), null, "a parte 3 ainda não subiu");
  const ultimo = lerPedidoDaParte(
    { indice: 2, criterio: "nome", partes: [{ url: url("a"), nome: "a.mp4", bytes: 1 }, { url: url("b"), nome: "b.mp4", bytes: 1 }, { url: null, nome: "c.mp4", bytes: 1 }] },
    PROJETO
  );
  assert.deepEqual(listaCompletaNoAviso(ultimo!, url("c"))!.map((p) => p.url), [url("a"), url("b"), url("c")], "na ordem confirmada");
  assert.equal(lerPedidoDaParte({ indice: 0, partes: [{ url: null }, { url: "https://evil.com/x.mp4" }] }, PROJETO), null, "URL alheia recusa o token");
  const rota = ler("app/api/videos/upload/route.ts");
  assert.ok(rota.includes('if (registro.video.status === "uploaded") await despacharPasso(registro.video.id, "juntar");'), "o vídeo em partes começa juntando");
});

// ─── o passo juntar, só com mais de uma parte ───

const partesDe = (n: number, juntado = false): PartesDaGravacao => ({
  versao: 1,
  itens: Array.from({ length: n }, (_, i) => ({ url: url(`p${i}`), nome: `p${i}.mp4`, bytes: 10, duracaoSeg: 5 })),
  criterio: "nome",
  confirmadaEm: "2026-10-08T12:00:00Z",
  juntado: juntado ? { url: url("j"), bytes: 1, duracaoSeg: 10, somaSeg: 10, diferencaSeg: 0, largura: 1920, altura: 1080, orientacao: "horizontal", em: "x" } : null,
});

test("juntar só existe com mais de uma parte e enquanto não juntou", () => {
  assert.equal(partesPorJuntar(partesDe(1)), false);
  assert.equal(partesPorJuntar(partesDe(2)), true);
  assert.equal(partesPorJuntar(partesDe(3, true)), false, "depois de juntado, a esteira é a de sempre");
  assert.deepEqual(resumoDasPartes(partesDe(3)), { quantas: 3, juntadas: false });
  assert.equal(etapaDeRetomada({ temTranscricao: false, temTrechos: false, partesPorJuntar: true }), "juntar");
  assert.equal(etapaDeRetomada({ temTranscricao: true, temTrechos: false, partesPorJuntar: true }), "select", "com transcrição, a junção já passou");
  assert.deepEqual(proximaAcao({ status: "uploaded", temTranscricao: false, temTrechos: false, partesPorJuntar: true, attempts: 0 }), { rotulo: "Juntar as partes", rota: "juntar" });
  assert.deepEqual(proximaAcao({ status: "failed", temTranscricao: false, temTrechos: false, partesPorJuntar: true, attempts: 1 }), { rotulo: "Tentar de novo", rota: "juntar" });
  assert.throws(() => planoDaJuncao([info(1920, 1080, 3)]), /pelo menos duas/);
  const worker = ler("worker/src/index.mjs");
  assert.ok(worker.includes("const temFonte = ehJuntar ? Array.isArray(trabalho.partes) && trabalho.partes.length > 1 : Boolean(trabalho.sourceUrl);"));
  const transcrever = ler("app/api/videos/[id]/transcribe/route.ts");
  assert.ok(transcrever.includes("porJuntar = await idsComPartesPorJuntar([id], { estrito: true });"), "a transcrição manda o vídeo em partes para a junção");
  assert.ok(transcrever.includes("if (porJuntar.has(id)) {") && transcrever.includes("status: 503"), "e, na dúvida, não ouve só a primeira parte");
});

test("a junção é um passo como os outros: estado de trabalho, prazo, vigia, piloto, código e nova tentativa", () => {
  assert.ok((TRABALHANDO as readonly string[]).includes("juntando-partes"));
  assert.equal(estaTrabalhando("juntando-partes"), true);
  assert.ok(MORTE["juntando-partes"] && NOME_DA_ETAPA["juntando-partes"]);
  assert.ok(prazoDaEtapa({ id: "v", status: "juntando-partes", startedAt: new Date(), sizeBytes: 4 * 1073741824 }) > prazoDaEtapa({ id: "v", status: "juntando-partes", startedAt: new Date(), sizeBytes: 0 }), "prazo cresce com o tamanho");
  assert.equal(CODIGO_DA_ETAPA.juntar, "VID-JUN");
  assert.ok(NOME_DA_ETAPA_NO_AVISO.juntar);
  assert.equal(PASSO_DA_ETAPA.juntar, "juntar");
  const falha: FalhaParaDecidir = {
    status: "failed", attempts: 1, error: "Não consegui juntar as partes da sua gravação desta vez.", updatedAt: new Date(Date.now() - 5 * 60_000),
    temTranscricao: false, temTrechos: false, temCortes: false, roteiroPendente: false, partesPorJuntar: true, tratada: null,
  };
  const d = decidirFalhaExplicita(falha);
  assert.equal(d.acao, "retomar");
  if (d.acao === "retomar") assert.equal(d.passo, "juntar", "a primeira falha é repetida pelo servidor, pela junção");
  // A chave do descarte da faixa leva a etapa da junção (a mesma conta do sino).
  const k = chavesCandidatasDoVideo({ id: "v1", criadoEm: "2026-10-08T12:00:00.000Z", attempts: 1, temTranscricao: false, temTrechos: false, partesPorJuntar: true });
  assert.ok(k.falhou.includes(":juntar:"));
  const vigia = ler("lib/media/vigia-das-etapas.ts");
  assert.ok(vigia.includes('"juntando-partes": { volta: () => "uploaded", passo: "juntar", devolveTentativa: true },'));
  assert.ok(vigia.includes("partesPorJuntar: porJuntar.has(v.id),"));
  assert.ok(ler("app/api/videos/[id]/piloto/route.ts").includes('await chamarRota(videoId, "juntar"'));
  const retorno = ler("app/api/videos/[id]/juntar-callback/route.ts");
  assert.ok(retorno.includes("corpoAssinadoConfere(corpoCru, req.headers.get(CABECALHO_ASSINATURA))"), "retorno assinado");
  assert.ok(retorno.includes('linha.status === "juntando-partes" && mesmaRodada ? await retomarEtapa(linha, "reiniciado")'), "reinício do worker retoma, só a rodada dele");
  assert.ok(retorno.includes('await despacharPasso(id, "transcrever");'), "depois de juntar, ouvir");
  // Só o aviso da rodada que pediu decide (o vigia pode ter relançado uma junção lenta).
  assert.ok(ler("lib/media/partes-servidor.ts").includes("retorno: { inicio: inicio.toISOString() },"));
  assert.ok(ler("worker/src/juntar-partes.mjs").includes("retorno: trabalho.retorno ?? null,"));
  assert.ok(retorno.includes('AND (${inicio}::text IS NULL OR "startedAt" = ${inicio}::timestamp)'));
  assert.ok(retorno.includes("...(inicio ? { startedAt: new Date(inicio) } : {})"));
  assert.ok(retorno.includes("lerPartesDe(id, { estrito: true })"));
  assert.ok(ler("lib/notificacoes/observador.ts").includes("partesPorJuntar: v.partesPorJuntar"), "o sino conta igual");
  assert.equal(podeCancelarGravacao({ status: "juntando-partes", finishedAt: null, edicaoAndando: false }).pode, true);
  assert.match(avisoDoQueTerminaSozinho({ status: "juntando-partes", edicaoAndando: false }) ?? "", /junção/);
});

test("a linha do tempo mostra 'Juntar as partes' antes de ouvir, só no vídeo em partes", () => {
  const pendente = lerLinhaDoTempo(entrada({ status: "juntando-partes", partes: { quantas: 3, juntadas: false } }));
  const passo = pendente.passos.find((p) => p.chave === "partes");
  assert.equal(passo?.estado, "agora");
  assert.equal(passo?.nota, "3 partes");
  assert.equal(pendente.passos.find((p) => p.chave === "ouvindo")?.estado, "falta");
  assert.match(pendente.agora, /3 partes na ordem que você escolheu/);
  const falhou = lerLinhaDoTempo(entrada({ status: "failed", partes: { quantas: 2, juntadas: false } }));
  assert.equal(falhou.passos.find((p) => p.chave === "partes")?.estado, "falhou");
  assert.equal(falhou.passos.find((p) => p.chave === "ouvindo")?.estado, "falta");
  const juntada = lerLinhaDoTempo(entrada({ status: "transcribing", partes: { quantas: 2, juntadas: true } }));
  assert.equal(juntada.passos.find((p) => p.chave === "partes")?.estado, "feito");
  assert.equal(juntada.passos.find((p) => p.chave === "ouvindo")?.estado, "agora");
});

// ─── a normalização e a duração ───

function info(largura: number, altura: number, duracaoSeg: number, extra: Record<string, unknown> = {}) {
  return { indiceDoVideo: 0, indiceDoAudio: 1, largura, altura, rotacao: 0, fps: 30, duracaoSeg, duracaoVideoSeg: duracaoSeg, duracaoAudioSeg: duracaoSeg, temAudio: true, bytes: 1, ...extra };
}

test("orientações diferentes: o quadro é o da maior parte, e a outra entra inteira com faixa", () => {
  const plano = planoDaJuncao([info(1280, 720, 10), info(1080, 1920, 5), info(1920, 1080, 4)]);
  // Empate de área (1080x1920 e 1920x1080): vence a mais longa.
  assert.equal(plano.maior, 1);
  assert.equal(plano.orientacao, "vertical");
  assert.deepEqual([plano.largura, plano.altura], [1080, 1920]);
  assert.deepEqual(plano.partes.map((p: { preenche: boolean }) => p.preenche), [true, false, true]);
  const v = filtroDeVideo(plano, 0);
  assert.ok(v.includes("force_original_aspect_ratio=decrease"), "cabe sem esticar");
  assert.ok(v.includes("pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black"), "preenche o resto");
  assert.ok(v.startsWith("fps=30:start_time=0"), "30 quadros na grade a partir do zero");
  assert.ok(/trim=end_frame=300,setpts=N\/\(30\*TB\)/.test(v), "quadros exatos");
  const a = filtroDeAudio(plano, 0);
  assert.ok(a.includes("aresample=48000:async=1:first_pts=0"));
  assert.ok(a.includes("loudnorm=I=-16"));
  assert.ok(a.includes("channel_layouts=stereo"));
  assert.ok(a.includes("atrim=end_sample=480000"), "10 s a 48 kHz, nem uma amostra a mais");
  // Rotação do celular: a sondagem devolve o quadro em pé.
  const s = lerSondagem({
    format: { duration: "3.5", size: "100" },
    streams: [
      { index: 0, codec_type: "video", codec_name: "mjpeg", width: 100, height: 100, disposition: { attached_pic: 1 } },
      { index: 1, codec_type: "video", codec_name: "h264", width: 1920, height: 1080, avg_frame_rate: "25/1", duration: "3.52", side_data_list: [{ rotation: -90 }] },
      { index: 2, codec_type: "audio", codec_name: "none" },
      { index: 3, codec_type: "audio", codec_name: "aac", duration: "3.5" },
    ],
  });
  assert.deepEqual([s.largura, s.altura, s.indiceDoVideo, s.indiceDoAudio, s.fps], [1080, 1920, 1, 3, 25]);
  // Parte sem som: o silêncio entra como entrada (e não como fonte dentro do grafo).
  const mudo = planoDaJuncao([info(1920, 1080, 2), info(1920, 1080, 2, { temAudio: false, indiceDoAudio: null })]);
  const args = argumentosDaParte(mudo, 1, "e.mp4", "s.mov");
  assert.ok(args.includes("anullsrc=r=48000:cl=stereo"));
  assert.ok(args.join(" ").includes("[1:a:0]"));
  assert.ok(args.includes("pcm_s16le"), "intermediário sem o quadro do AAC");
  assert.deepEqual(argumentosDaEmenda("l.txt", "o.mp4").slice(0, 6), ["-f", "concat", "-safe", "0", "-i", "l.txt"]);
});

test("a duração final é a soma das partes, e a conferência recusa o que não bate", () => {
  const plano = planoDaJuncao([info(1920, 1080, 4.0), info(1080, 1920, 3.52), info(1280, 720, 3.0)]);
  assert.equal(plano.quadros, 120 + 106 + 90);
  assert.ok(Math.abs(plano.somaSeg - 316 / 30) < 1e-9);
  const certo = { duracaoSeg: plano.somaSeg, duracaoVideoSeg: plano.somaSeg + 0.001, duracaoAudioSeg: plano.somaSeg, temAudio: true, largura: 1920, altura: 1080 };
  assert.equal(conferirJuncao(certo, plano).ok, true);
  const curto = { ...certo, duracaoVideoSeg: plano.somaSeg - 1, duracaoAudioSeg: plano.somaSeg - 1 };
  assert.match(conferirJuncao(curto, plano).motivos.join(), /não bate com a soma/);
  const fora = { ...certo, duracaoAudioSeg: plano.somaSeg - 0.5 };
  assert.match(conferirJuncao(fora, plano).motivos.join(), /áudio .* e vídeo .* durações diferentes/);
  assert.equal(conferirJuncao({ ...certo, temAudio: false }, plano).ok, false);
  assert.ok(toleranciaDaJuncao(3) < 0.3);
});

const temFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0 && spawnSync("ffprobe", ["-version"]).status === 0;

test("de verdade, no ffmpeg da máquina: três partes diferentes juntam na soma das durações", { skip: !temFfmpeg && "sem ffmpeg" }, async () => {
  const pasta = mkdtempSync(join(tmpdir(), "varios-arquivos-"));
  try {
    const gerar = (args: string[]) => {
      const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
      assert.equal(r.status, 0, String(r.stderr));
    };
    const a = join(pasta, "a.mp4");
    const b = join(pasta, "b.mp4");
    const c = join(pasta, "c.mp4");
    gerar(["-f", "lavfi", "-i", "color=c=red:s=320x180:r=30:d=1.5", "-f", "lavfi", "-i", "sine=f=440:sample_rate=48000:d=1.5", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", a]);
    gerar(["-f", "lavfi", "-i", "color=c=green:s=180x320:r=25:d=1.2", "-f", "lavfi", "-i", "sine=f=660:sample_rate=44100:d=1.2", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ac", "1", "-shortest", b]);
    gerar(["-f", "lavfi", "-i", "color=c=blue:s=160x90:r=60:d=1", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", c]);
    const r = await juntarArquivos([a, b, c], pasta);
    assert.equal(r.conferencia.ok, true, r.conferencia.motivos.join("; "));
    assert.deepEqual([r.final.largura, r.final.altura], [320, 180], "o quadro da maior parte");
    assert.deepEqual(r.plano.partes.map((p: { preenche: boolean; temAudio: boolean }) => [p.preenche, p.temAudio]), [[false, true], [true, true], [false, false]], "a 160x90 tem a proporção da saída: só cresce, sem faixa");
    assert.ok(Math.abs(r.final.duracaoVideoSeg - (1.5 + 1.2 + 1.0)) < 0.1, `vídeo ${r.final.duracaoVideoSeg}`);
    assert.ok(Math.abs(r.final.duracaoAudioSeg - r.final.duracaoVideoSeg) < 0.05, `áudio ${r.final.duracaoAudioSeg}`);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

// ─── a régua do texto ───

test("nenhum texto novo usa travessão", () => {
  for (const p of [
    "lib/media/partes-da-gravacao.ts",
    "lib/media/partes-servidor.ts",
    "components/video/partes-da-gravacao.tsx",
    "app/api/videos/[id]/juntar/route.ts",
    "app/api/videos/[id]/juntar-callback/route.ts",
    "worker/src/juntar-partes.mjs",
    "worker/prova-juntar-partes.mjs",
    "prisma/migrations/20261008120000_partes_da_gravacao/migration.sql",
  ]) {
    assert.equal(TRAVESSAO.test(ler(p)), false, p);
  }
});

function entrada(x: Partial<EntradaDaLinha> & { status: string }): EntradaDaLinha {
  return {
    durationSec: null,
    trechosEscolhidos: 0,
    cortesProntos: 0,
    temTranscricao: false,
    temTrechos: false,
    temCortes: false,
    temTrechosComPosts: false,
    temCompleto: false,
    ...x,
  };
}
