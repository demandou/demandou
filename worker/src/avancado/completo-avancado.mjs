import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { alinharAosQuadros } from "../modelo/blocos-do-plano.mjs";
import { extrairTrecho, fpsConstante } from "../modelo/editar-no-modelo.mjs";
import { blocosPelaPausa, continuidadeDoPrimeiro, fixarContinuidade, palavrasDoBloco, tetoDoBloco, USD_POR_MINUTO_DO_COMPLETO } from "./blocos-do-completo.mjs";
import { editarAvancado } from "./editar-avancado.mjs";
import { ESTIMATIVA_USD } from "./teto.mjs";

/**
 * O VÍDEO COMPLETO SOB MEDIDA (11/10/2026, pedido do Bruno): a Maquete 3D, o
 * Recorte com letreiro e os Gráficos valem também para o completo, no formato
 * da gravação (deitada sai em 16:9, em pé em 9:16).
 *
 *   fala      a fala limpa do vídeo inteiro (os pedaços mantidos, na grade de quadros)
 *   blocos    ~60 s cada, cortados na maior pausa perto dos 60 s (blocos-do-completo.mjs)
 *   editar    cada bloco é um corte do editor avançado (editarAvancado) com a técnica fixa,
 *             o quadro do formato, `bruto: true` (.mov com PCM) e o teto de US$ 2 por minuto
 *             na proporção do bloco. O primeiro bloco é escrito primeiro: o enquadramento em
 *             que ele termina e a faixa da legenda viram a base do vídeo; os outros são
 *             escritos EM PARALELO logo depois (a escrita é a parte lenta, ~3,5 min por bloco),
 *             e o worker fixa a emenda no roteiro de cada um (fixarContinuidade). O que pesa na
 *             máquina (trecho, rosto, portões, render) passa por uma fila comum.
 *   recorte   na 8.2, pela GPU do RunPod em cada bloco (o `publicar` e o destino de cada um)
 *   emenda    os .mov emendados sem recodificar (concat, -c copy), o -14 LUFS e o AAC uma vez
 *             só no vídeo inteiro, e a trilha do projeto por baixo
 *
 * Nunca troca o estilo: o bloco que falha tenta de novo UMA vez na mesma técnica (se o
 * teto do bloco ainda cobre a escrita); falhou de novo, o completo inteiro falha e o app
 * decide (tenta de novo no mesmo estilo e depois para com "Tentar de novo").
 */
const FFMPEG = process.env.FFMPEG_BIN ?? "ffmpeg";
const FPS = 30;

function sonda(args) {
  const r = spawnSync("ffprobe", ["-v", "error", ...args], { encoding: "utf8" });
  return String(r.stdout ?? "").trim();
}

const duracaoDe = (arquivo) => Number(sonda(["-show_entries", "format=duration", "-of", "csv=p=0", arquivo])) || 0;

function tamanhoDoVideo(arquivo) {
  const s = JSON.parse(sonda(["-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", arquivo]) || "{}").streams?.[0];
  return { largura: Number(s?.width) || 1920, altura: Number(s?.height) || 1080 };
}

function ffmpeg(args) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-nostdin", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg falhou: ${String(r.stderr).split("\n").slice(-8).join("\n")}`);
  return String(r.stderr ?? "");
}

/** Uma fila com `vagas` lugares: o que pesa na máquina roda um (ou poucos) de cada vez. Mede a espera. */
export function criarFila(vagas = 1) {
  let livres = Math.max(1, vagas);
  const esperando = [];
  const espera = { s: 0 };
  const entrar = () =>
    new Promise((ok) => {
      if (livres > 0) {
        livres -= 1;
        ok();
      } else esperando.push(ok);
    });
  const sair = () => {
    const proximo = esperando.shift();
    if (proximo) proximo();
    else livres += 1;
  };
  const rodar = async (fn) => {
    const t0 = Date.now();
    await entrar();
    espera.s += (Date.now() - t0) / 1000;
    try {
      return await fn();
    } finally {
      sair();
    }
  };
  return { rodar, espera };
}

/** O formato pela gravação: deitada (largura maior ou igual) sai em 16:9, em pé em 9:16. Puro. */
export function formatoDaGravacao({ largura, altura }) {
  return altura > largura ? "9:16" : "16:9";
}

/** Emenda os .mov dos blocos sem recodificar, confere som e imagem, e aplica o -14 LUFS (AAC só aqui). */
export function emendarBlocos(arquivos, pasta, saida) {
  const lista = join(pasta, "blocos.txt");
  writeFileSync(lista, arquivos.map((f) => `file '${resolve(f).replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
  const junto = join(pasta, "junto.mov");
  ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", lista, "-map", "0:v:0", "-map", "0:a:0", "-c", "copy", junto]);
  const durV = Number(sonda(["-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", junto]));
  const durA = Number(sonda(["-select_streams", "a:0", "-show_entries", "stream=duration", "-of", "csv=p=0", junto]));
  if (Number.isFinite(durV) && Number.isFinite(durA) && Math.abs(durV - durA) > 1.5 / FPS) {
    throw new Error(`a emenda saiu com som e imagem de durações diferentes (${durA.toFixed(3)} s e ${durV.toFixed(3)} s)`);
  }
  // -14 LUFS no vídeo inteiro, em duas passadas (o mesmo filtro do render do curso)
  const medida = ffmpeg(["-i", junto, "-af", "loudnorm=I=-14:TP=-2:LRA=11:print_format=json", "-f", "null", "-"]);
  const m = JSON.parse(medida.slice(medida.lastIndexOf("{"), medida.lastIndexOf("}") + 1));
  const filtro = `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
  ffmpeg(["-y", "-i", junto, "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida]);
  return { duracaoVideo: +durV.toFixed(3), duracaoAudio: +durA.toFixed(3), volume: `${m.input_i} LUFS -> -14 LUFS` };
}

export async function completoAvancado(
  pedido,
  pasta,
  {
    obterOriginal,
    pedirCena,
    aoPasso = () => {},
    obterTrilha = null,
    publicar = null,
    destinoDoRecorte = null,
    aoPublicar = () => {},
    recortar = undefined,
    editar = editarAvancado,
    paralelas = Number(process.env.COMPLETO_AVANCADO_PARALELAS) || 4,
    pesadosJuntos = Number(process.env.COMPLETO_AVANCADO_PESADOS) || 1,
  }
) {
  const t0 = Date.now();
  const tempos = {};
  let t = Date.now();
  const marcar = (nome) => {
    tempos[nome] = +((Date.now() - t) / 1000).toFixed(1);
    t = Date.now();
    aoPasso(nome);
  };
  const avisos = [];

  // 1. A FALA LIMPA do vídeo inteiro, na grade de quadros da gravação (como o completo no modelo)
  const original = await obterOriginal(pedido.sourceUrl);
  const fala = join(pasta, "fala.mp4");
  const alinhado = alinharAosQuadros(pedido.manter, pedido.palavras, fpsConstante(original), pedido.inicio ?? 0);
  await extrairTrecho(original, fala, pedido.inicio ?? 0, pedido.duracao, alinhado.manter, { fps: alinhado.fps });
  const duracao = Math.floor(duracaoDe(fala) * FPS) / FPS;
  if (!(duracao > 1)) throw new Error("a fala limpa do completo saiu vazia");
  const formato = formatoDaGravacao(tamanhoDoVideo(fala));
  const palavras = (alinhado.palavras ?? []).map((p) => ({ de: Number(p.em ?? p.de), ate: Number(p.ate), w: String(p.w) })).filter((p) => p.w.trim() && p.de < duracao);
  if (!palavras.length) throw new Error("o completo não tem fala");
  marcar("fala");

  // 2. OS BLOCOS, na maior pausa perto dos 60 s
  const blocos = blocosPelaPausa(palavras, duracao);
  const tetoUsd = +((duracao / 60) * USD_POR_MINUTO_DO_COMPLETO).toFixed(2);
  aoPasso(`${blocos.length} blocos (${blocos.map((b) => (b.ate - b.de).toFixed(1)).join(" + ")} s), formato ${formato}, teto US$ ${tetoUsd}`);

  // 3. CADA BLOCO pelo editor avançado: o primeiro antes, os outros em paralelo depois dele
  const fila = criarFila(pesadosJuntos);
  let cancelado = null;
  let base = null;
  let tecnica = ["maquete-3d", "recorte-letreiro", "graficos", "moldura-explicativa"].includes(pedido.tecnica) ? pedido.tecnica : null;
  let gastoTotal = 0;
  const resultados = new Array(blocos.length).fill(null);
  const relatorio = blocos.map((b) => ({ indice: b.indice, de: b.de, ate: b.ate, tentativas: 0, custoUsd: 0, erro: null }));

  const rodarBloco = async (k, aoEscritoDoBloco = null) => {
    const b = blocos[k];
    const tetoDoBlocoUsd = tetoDoBloco(b);
    let gastoDoBloco = 0;
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      if (cancelado) throw new Error(cancelado);
      const restante = +(tetoDoBlocoUsd - gastoDoBloco).toFixed(4);
      if (tentativa > 1 && restante < ESTIMATIVA_USD.escrever + ESTIMATIVA_USD["consertar-codigo"]) {
        throw new Error(`o bloco ${k + 1} falhou e o teto dele (US$ ${tetoDoBlocoUsd}) não cobre outra escrita`);
      }
      relatorio[k].tentativas = tentativa;
      const pastaDoBloco = join(pasta, `bloco-${String(k + 1).padStart(2, "0")}-${tentativa}`);
      mkdirSync(pastaDoBloco, { recursive: true });
      const pedidoDoBloco = {
        chave: `${pedido.chave ?? "completo"}#b${k + 1}`,
        sourceUrl: "fala-limpa",
        // um quarto de quadro antes da borda (como o trecho na grade): o quadro da borda entra
        // neste bloco e não no anterior, e a soma dos blocos é a fala inteira, quadro a quadro
        inicio: Math.max(0, b.de - 0.25 / FPS),
        duracao: b.quadros / FPS,
        manter: null,
        palavras: palavrasDoBloco(palavras, b),
        marca: pedido.marca ?? null,
        nicho: pedido.nicho ?? null,
        cores: pedido.cores ?? null,
        letra: pedido.letra,
        tecnica: tecnica ?? undefined,
        formato,
        bruto: true,
        tetoUsd: restante,
        revisar: pedido.revisar,
        bloco: { indice: k, total: blocos.length, inicioNoVideo: b.de, duracaoDoVideo: duracao },
        continuidade: k > 0 && base ? base : null,
      };
      try {
        const e = await editar(pedidoDoBloco, pastaDoBloco, {
          obterOriginal: async () => fala,
          pedirCena: async (corpo) => {
            if (cancelado) throw new Error(cancelado);
            return pedirCena({ ...corpo, bloco: k + 1 });
          },
          aoPasso: (p) => aoPasso(`b${k + 1}: ${p}`),
          publicar: publicar ? (arquivo) => publicar(arquivo, k + 1) : null,
          destinoDoRecorte: destinoDoRecorte ? () => destinoDoRecorte(k + 1) : null,
          aoPublicar,
          ...(recortar ? { recortar } : {}),
          pesado: (nome, fn) =>
            fila.rodar(async () => {
              if (cancelado) throw new Error(cancelado);
              return fn();
            }),
          // a emenda fixa: começo (fora o primeiro bloco), fim estável e a mesma legenda
          // (no primeiro bloco, antes da base existir, só o fim estável no enquadramento em que ele termina)
          ajustarRoteiro: (arquivos, x) => {
            let alvo = base;
            if (!alvo && k === 0) {
              try {
                alvo = { apresentador: continuidadeDoPrimeiro(arquivos, x.palavras, x.duracao).apresentador, legenda: null };
              } catch {
                return arquivos;
              }
            }
            return alvo ? fixarContinuidade(arquivos, { base: alvo.apresentador, legenda: alvo.legenda, fixarInicio: k > 0 }, x.palavras, x.duracao) : arquivos;
          },
          aoEscrito: aoEscritoDoBloco,
          aoGastar: (usd) => {
            gastoDoBloco += usd;
            gastoTotal += usd;
            relatorio[k].custoUsd = +gastoDoBloco.toFixed(4);
          },
        });
        if (!existsSync(e.arquivo)) throw new Error(`o bloco ${k + 1} não deixou o arquivo do render`);
        resultados[k] = e;
        return e;
      } catch (erro) {
        const msg = erro instanceof Error ? erro.message : String(erro);
        relatorio[k].erro = msg.slice(0, 400);
        if (cancelado) throw erro;
        aoPasso(`b${k + 1}: falhou na tentativa ${tentativa} (${msg.slice(0, 200)})`);
        if (tentativa === 2) throw new Error(`o bloco ${k + 1} falhou duas vezes na técnica ${tecnica ?? "do JEV"}: ${msg.slice(0, 300)}`);
        // a base do vídeo já existe (o primeiro bloco chegou a escrever): a nova tentativa segue nela
      }
    }
    throw new Error(`o bloco ${k + 1} não saiu`);
  };

  // o primeiro bloco: a base do vídeo sai da primeira versão dele que passa nos portões
  let liberar;
  const primeiroEscrito = new Promise((ok) => (liberar = ok));
  const primeiro = rodarBloco(0, ({ arquivos, tecnica: daCena, palavras: falaDoBloco, duracao: durDoBloco }) => {
    if (!base) {
      base = continuidadeDoPrimeiro(arquivos, falaDoBloco, durDoBloco);
      if (!tecnica) tecnica = daCena;
      aoPasso(`base do vídeo: ${JSON.stringify(base.apresentador).slice(0, 200)}`);
    }
    liberar();
  });
  primeiro.catch(() => liberar());
  await Promise.race([primeiroEscrito, primeiro.then(() => {}, () => {})]);
  if (!base) {
    // o primeiro bloco falhou antes de escrever (as duas tentativas): nada mais começa
    await primeiro;
  }
  marcar("primeira escrita");

  // os outros blocos, até `paralelas` ao mesmo tempo
  const resto = blocos.slice(1).map((b) => b.indice);
  const corredores = Array.from({ length: Math.min(paralelas, resto.length) }, async () => {
    while (resto.length) {
      const k = resto.shift();
      try {
        await rodarBloco(k);
      } catch (e) {
        if (!cancelado) cancelado = `outro bloco falhou (${e instanceof Error ? e.message.slice(0, 200) : e})`;
        throw e;
      }
    }
  });
  const todos = await Promise.allSettled([primeiro.catch((e) => {
    if (!cancelado) cancelado = `outro bloco falhou (${e instanceof Error ? e.message.slice(0, 200) : e})`;
    throw e;
  }), ...corredores]);
  const falha = todos.find((x) => x.status === "rejected");
  if (falha) throw falha.reason instanceof Error ? falha.reason : new Error(String(falha.reason));
  marcar("blocos");

  // 4. A EMENDA sem recodificar, o -14 LUFS uma vez só
  const editado = join(pasta, "completo-editado.mp4");
  const emenda = emendarBlocos(resultados.map((e) => e.arquivo), pasta, editado);
  if (Math.abs(emenda.duracaoVideo - duracao) > 0.5) avisos.push(`a emenda tem ${emenda.duracaoVideo} s e a fala ${duracao} s`);
  let arquivo = editado;
  marcar("emenda");

  // 5. A TRILHA do projeto por baixo, uma vez só no vídeo inteiro; falhou, sai sem ela
  if (pedido.trilha?.url && obterTrilha) {
    try {
      const ext = String(pedido.trilha.url).match(/\.[a-z0-9]{2,4}(?=\?|$)/i)?.[0] ?? ".mp3";
      const trilha = await obterTrilha(pedido.trilha.url, join(pasta, `trilha${ext}`));
      const { misturarAudio } = await import("../sons.mjs");
      arquivo = await misturarAudio(arquivo, { trilha: { arquivo: trilha, volume: pedido.trilha.volume, abaixar: pedido.trilha.abaixar } }, emenda.duracaoVideo, pasta, join(pasta, "completo-com-trilha.mp4"));
    } catch (e) {
      avisos.push(`a trilha não entrou: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
    marcar("trilha");
  }

  const porBloco = resultados.map((e, k) => ({
    ...relatorio[k],
    duracao: e.duracao,
    tempos: e.tempos,
    temposDaIa: e.temposDaIa,
    gastoPorFase: e.gastoPorFase,
    revisao: { rodadas: e.revisao?.rodadas ?? 0, reprovadas: (e.revisao?.reprovadas ?? []).length, consertadas: e.revisao?.consertadas ?? [], voltouAtras: e.revisao?.voltouAtras ?? [] },
    avisos: e.avisos,
    recorte: e.recorte,
    render: e.render,
    folhas: e.folhas,
    cenas: (e.roteiro?.cenas ?? []).map((c) => ({ arquivo: c.arquivo, oQue: c.oQue })),
  }));
  return {
    arquivo,
    tecnica,
    formato,
    duracao,
    custoUsd: +gastoTotal.toFixed(4),
    tetoUsd,
    tempos: { ...tempos, total: +((Date.now() - t0) / 1000).toFixed(1), esperaNaFila: +fila.espera.s.toFixed(1) },
    emenda,
    blocos: porBloco,
    avisos: [...avisos, ...porBloco.flatMap((b) => (b.avisos ?? []).map((a) => `bloco ${b.indice + 1}: ${a}`))],
    folhas: porBloco.flatMap((b) => b.folhas ?? []),
    base,
  };
}
