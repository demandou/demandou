import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extrairTrecho, folhasDosQuadros, limitesDoRender } from "../modelo/editar-no-modelo.mjs";
import { geometriaDoApresentador } from "./geometria.mjs";
import { cenasNoInstante, conferirArquivos, instantesDaConferencia, nomeDeArquivoValido, segundosDaAncora, TECNICAS } from "./portao.mjs";
import { portaoDoTsc, rodarIsolado } from "./processo.mjs";
import { gravarCenas, gravarDados, montarProjeto, referenciaDoKit } from "./projeto.mjs";
import { caixaDoRecorte, rastroDoRosto, recortarApresentador } from "./recorte.mjs";
import { cabeNoTeto, tetoPadraoUsd } from "./teto.mjs";

/**
 * O EDITOR AVANÇADO (10/10/2026): as aulas 7, 8.1 e 8.2 do curso "Máquina de
 * Edição IA" feitas pela plataforma em cada corte. Onde o curso tem o aluno e
 * o Claude no computador dele escrevendo um projeto Remotion sob medida, aqui:
 *
 *   trecho      a fala limpa do corte na gravação original (extrairTrecho)
 *   rosto       o rastro do rosto quadro a quadro (Face Landmarker)
 *   tecnica     o JEV decide pela fala: maquete 3D (8.1), recorte com letreiro
 *               atrás da pessoa (8.2) ou moldura com motion explicativo (7)
 *   recorte     só na 8.2: o RVM (motor trocável: CPU agora, RunPod depois)
 *   escrever    o app escreve o roteiro e as cenas (Claude Sonnet 5, com o kit
 *               e as regras das aulas): "Claude só escreve"
 *   portoes     nome de arquivo, imports, lint, roteiro, tempo, número dito,
 *               tsc, bundle e um render de conferência; reprovado, o Claude
 *               conserta só o apontado (até 2 vezes)
 *   revisao     os quadros de cada cena: o Gemini descreve, o JEV decide se a
 *               cena tem defeito; o Claude reescreve SÓ a cena com defeito
 *               (até 2 rodadas); conserto que quebra volta atrás
 *   render      o corte inteiro a -14 LUFS, e a trilha por baixo
 *
 * O código escrito pela IA nunca roda no processo do worker: o tsc e o render
 * vão para um processo filho com o ambiente limpo (processo.mjs), na pasta do
 * trabalho, depois do portão estático (portao.mjs). A IA mora no app
 * (`pedirCena`), onde a conta de custo vive num lugar só.
 */
const AQUI = dirname(fileURLToPath(import.meta.url));
const RENDER = join(AQUI, "render-isolado.mjs");
const FFMPEG = process.env.FFMPEG_BIN ?? "ffmpeg";
const FPS = 30;

class SemTeto extends Error {}

function duracaoDe(arquivo) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo], { encoding: "utf8" });
  return Number(String(r.stdout).trim()) || 0;
}

function tamanhoDoVideo(arquivo) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", arquivo], { encoding: "utf8" });
  const s = JSON.parse(r.stdout || "{}").streams?.[0];
  return { largura: s?.width ?? 1920, altura: s?.height ?? 1080 };
}

/** O arquivo de cena que aparece num erro de render (para o conserto saber onde mexer). */
export function arquivoDoErro(erro) {
  const m = String(erro).match(/cena-\d{2}(?:\.tsx)?/);
  if (m) return m[0].endsWith(".tsx") ? m[0] : `${m[0]}.tsx`;
  if (/comum(\.tsx)?/.test(String(erro))) return "comum.tsx";
  if (/roteiro/.test(String(erro))) return "roteiro.json";
  return "*";
}

/** O roteiro sem uma cena (a que quebra o render mesmo depois dos consertos): o corte sai sem ela. */
export function roteiroSemCena(arquivos, nome) {
  const roteiro = JSON.parse(arquivos["roteiro.json"]);
  roteiro.cenas = roteiro.cenas.filter((c) => c.arquivo !== nome);
  const saida = { ...arquivos, "roteiro.json": JSON.stringify(roteiro, null, 1) };
  delete saida[nome];
  return saida;
}

export async function editarAvancado(pedido, pasta, { obterOriginal, pedirCena, aoPasso = () => {}, obterTrilha = null, publicar = null, recortar = recortarApresentador }) {
  const tempos = {};
  let t = Date.now();
  const marcar = (nome) => {
    tempos[nome] = +((tempos[nome] ?? 0) + (Date.now() - t) / 1000).toFixed(1);
    t = Date.now();
    aoPasso(nome);
  };
  const avisos = [];
  const historico = [];
  let gasto = 0;
  const gastoPorFase = {};
  const teto = Number(pedido.tetoUsd) > 0 ? Number(pedido.tetoUsd) : tetoPadraoUsd(pedido.duracao);
  const pedir = async (fase, corpo) => {
    if (!cabeNoTeto(gasto, teto, fase)) throw new SemTeto(`o teto de US$ ${teto.toFixed(2)} não cabe mais a fase ${fase} (gasto US$ ${gasto.toFixed(3)})`);
    const r = await pedirCena({ fase, ...corpo, tetoRestanteUsd: +(teto - gasto).toFixed(4) });
    const c = Number(r?.custoUsd) || 0;
    gasto += c;
    gastoPorFase[fase] = +((gastoPorFase[fase] ?? 0) + c).toFixed(4);
    return r;
  };

  // 1. O TRECHO: a fala limpa na gravação original, e a voz separada
  const original = await obterOriginal(pedido.sourceUrl);
  const trecho = join(pasta, "trecho.mp4");
  await extrairTrecho(original, trecho, pedido.inicio ?? 0, pedido.duracao, pedido.manter);
  const duracao = Math.floor(duracaoDe(trecho) * FPS) / FPS;
  if (!(duracao > 1)) throw new Error("o trecho do corte saiu vazio");
  const quadros = Math.round(duracao * FPS);
  const gravacao = tamanhoDoVideo(trecho);
  const palavras = (pedido.palavras ?? [])
    .map((p) => ({ de: +Number(p.em ?? p.de).toFixed(3), ate: +Number(p.ate).toFixed(3), w: String(p.w) }))
    .filter((p) => p.w.trim() && p.de < duracao);
  if (!palavras.length) throw new Error("o corte não tem fala");
  const projeto = montarProjeto(pasta);
  cpSync(trecho, join(projeto, "public", "trecho.mp4"));
  const voz = spawnSync(FFMPEG, ["-v", "error", "-y", "-i", trecho, "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", join(projeto, "public", "voz.wav")]);
  if (voz.status !== 0) throw new Error("não consegui separar a voz do trecho");
  marcar("trecho");

  // 2. O ROSTO quadro a quadro (sem rosto achado, o centro da gravação: o corte não para)
  let rosto = [];
  try {
    rosto = (await rastroDoRosto({ trecho, duracao, saida: join(pasta, "rosto.json") })).rosto ?? [];
  } catch (e) {
    avisos.push(`sem rastro do rosto: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
  }
  if (!rosto.length) rosto = [{ x: gravacao.largura / 2, y: gravacao.altura * 0.4, queixo: gravacao.altura * 0.55 }];
  while (rosto.length < quadros) rosto.push(rosto[rosto.length - 1]);
  rosto = rosto.slice(0, quadros);
  marcar("rosto");

  // 3. A TÉCNICA: o JEV decide pela fala (o pedido pode fixar uma)
  let tecnica = TECNICAS.includes(pedido.tecnica) ? pedido.tecnica : null;
  let decisao = null;
  if (!tecnica) {
    decisao = await pedir("tecnica", { fala: palavras, duracao, nicho: pedido.nicho ?? null });
    tecnica = TECNICAS.includes(decisao?.tecnica) ? decisao.tecnica : "recorte-letreiro";
  }
  marcar("tecnica");

  // 4. O RECORTE, só na 8.2. Falhou: a moldura com o fundo, sem fingir recorte (aula 8.2).
  let recorte = null;
  let medidaDoRecorte = null;
  if (tecnica === "recorte-letreiro") {
    try {
      const r = await recortar({ trecho, duracao, caixa: caixaDoRecorte(rosto, gravacao.largura, gravacao.altura), pasta, publicar });
      cpSync(r.alfa, join(projeto, "public", "alfa.webm"));
      recorte = { caixa: r.rastro.caixa, cabeca: (r.rastro.cabeca ?? []).slice(0, quadros) };
      while (recorte.cabeca.length < quadros) recorte.cabeca.push(recorte.cabeca[recorte.cabeca.length - 1] ?? null);
      medidaDoRecorte = { backend: r.backend, segundos: r.segundos, ...r.medida };
    } catch (e) {
      avisos.push(`o recorte falhou e o corte saiu com o apresentador na moldura: ${e instanceof Error ? e.message.slice(0, 200) : e}`);
      tecnica = "moldura-explicativa";
    }
    marcar("recorte");
  }

  // 5. OS DADOS do corte para o kit, e o que vai para quem escreve
  const cores = pedido.cores?.destaque ? pedido.cores : { fundo: "#1e1f22", titulo: "#dbdee1", destaque: "#f97316" };
  const letra = ["impacto", "moderna", "classica", "amigavel"].includes(pedido.letra) ? pedido.letra : "moderna";
  gravarDados(projeto, { fps: FPS, largura: 1080, altura: 1920, duracao, quadros, cores, letra, palavras, gravacao, rosto, recorte, tecnica });
  const kit = referenciaDoKit();
  const contexto = {
    tecnica,
    duracao,
    marca: pedido.marca ?? null,
    nicho: pedido.nicho ?? null,
    cores,
    letra,
    temRecorte: Boolean(recorte),
    geometria: geometriaDoApresentador({ rosto, gravacao, recorte }),
  };
  const fala = palavras;
  const opcoesDoPortao = { palavras, duracao, temRecorte: Boolean(recorte) };

  // 6. OS PORTÕES de uma versão do código: estático, tsc, bundle e render de conferência
  let rodadaDosQuadros = 0;
  const portoes = async (arquivos, numerosSemLastro, { instantes = null } = {}) => {
    const { problemas, roteiro } = conferirArquivos(arquivos, opcoesDoPortao);
    for (const n of numerosSemLastro ?? []) problemas.push({ arquivo: "*", linha: 1, motivo: `número na tela que não foi dito na fala: ${n} (tire ou troque pelas palavras ditas)` });
    if (problemas.length) return { problemas, roteiro, etapa: "estatico" };
    gravarCenas(projeto, arquivos, roteiro);
    const tsc = await portaoDoTsc(projeto);
    if (tsc.pulado) avisos.push(`portão do tsc pulado: ${tsc.pulado}`);
    if (tsc.problemas.length) return { problemas: tsc.problemas, roteiro, etapa: "tsc" };
    const lista = instantes ?? instantesDaConferencia(roteiro, palavras, duracao);
    const transicao = (roteiro.apresentador ?? []).map((q) => segundosDaAncora(q.em, palavras, duracao)).filter((s) => s !== null && s > 0)[0];
    const deAmostra = Math.max(0, Math.round(((transicao ?? segundosDaAncora(roteiro.cenas?.[0]?.de, palavras, duracao) ?? 0) - 0.3) * FPS));
    rodadaDosQuadros += 1;
    const pastaDosQuadros = join(projeto, "quadros", `volta-${rodadaDosQuadros}`);
    const pedidoDoRender = {
      acao: "conferir",
      quadros: lista.map((s) => Math.round(s * FPS)),
      escala: 0.375,
      pasta: pastaDosQuadros,
      amostra: rodadaDosQuadros === 1 ? { de: deAmostra, ate: deAmostra + 3 * FPS, saida: join(projeto, "out", "amostra.mp4") } : null,
      limites: limitesDoRender(),
      gl: process.env.GL_DOS_MODELOS || "swangle",
    };
    const arquivoDoPedido = join(projeto, "pedido-render.json");
    writeFileSync(arquivoDoPedido, JSON.stringify(pedidoDoRender));
    const r = await rodarIsolado(RENDER, [projeto, arquivoDoPedido], { cwd: projeto, prazoMs: Math.max(8, lista.length * 0.6) * 60_000, memoriaMb: 3072 });
    if (!r.json?.ok) {
      const erro = r.estourou ? "o render de conferência passou do prazo" : (r.json?.erro ?? r.saida.slice(-1500));
      return { problemas: [{ arquivo: arquivoDoErro(erro), linha: 1, motivo: `erro ao renderizar: ${erro}` }], roteiro, etapa: "render" };
    }
    return { problemas: [], roteiro, etapa: "ok", conferencia: r.json };
  };

  // 7. A ESCRITA (Sonnet 5 no app) e os consertos de código
  const escrito = await pedir("escrever", { kit, fala, contexto });
  if (!escrito?.arquivos || typeof escrito.arquivos !== "object") throw new Error("o app não devolveu os arquivos da cena");
  let atual = { ...escrito.arquivos };
  marcar("escrever");
  let res = await portoes(atual, escrito.numerosSemLastro);
  marcar("portoes");
  for (let volta = 1; res.problemas.length && volta <= 2 && cabeNoTeto(gasto, teto, "consertar-codigo"); volta++) {
    historico.push({ volta: `codigo-${volta}`, etapa: res.etapa, problemas: res.problemas.slice(0, 25) });
    const c = await pedir("consertar-codigo", { kit, fala, contexto, arquivos: atual, problemas: res.problemas.slice(0, 40) });
    atual = { ...atual, ...Object.fromEntries(Object.entries(c.arquivos ?? {}).filter(([n]) => nomeDeArquivoValido(n))) };
    marcar("consertos");
    res = await portoes(atual, c.numerosSemLastro);
    marcar("portoes");
  }
  // Ainda quebra o render numa cena só: o corte sai sem ela (avisado), em vez de não sair.
  for (let i = 0; res.problemas.length && res.etapa === "render" && i < 3; i++) {
    const nome = res.problemas[0].arquivo;
    const roteiro = JSON.parse(atual["roteiro.json"]);
    if (!/^cena-\d{2}\.tsx$/.test(nome) || roteiro.cenas.length <= 1) break;
    avisos.push(`a cena ${nome} quebrava o render e saiu do corte`);
    atual = roteiroSemCena(atual, nome);
    res = await portoes(atual, []);
    marcar("portoes");
  }
  if (res.problemas.length) {
    historico.push({ volta: "final", etapa: res.etapa, problemas: res.problemas.slice(0, 25) });
    throw new Error(`o código da cena não passou nos portões (${res.etapa}): ${res.problemas.slice(0, 4).map((p) => `${p.arquivo}: ${p.motivo}`).join(" | ").slice(0, 600)}`);
  }
  let roteiro = res.roteiro;
  let conferencia = res.conferencia;
  const amostra = conferencia.amostra ?? null;
  const todosOsQuadros = new Map(conferencia.quadros.map((q) => [q.t, q.arquivo]));

  // 8. A REVISÃO (passo 8 das aulas): o Gemini descreve, o JEV decide; o Claude conserta só a cena
  const revisao = { rodadas: 0, reprovadas: [], consertadas: [], voltouAtras: [], erro: null };
  const falaPerto = (s) => palavras.filter((p) => p.ate > s - 1.5 && p.de < s + 1.5).map((p) => p.w).join(" ");
  let paraOlhar = conferencia.quadros;
  for (let rodada = 1; rodada <= 2 && pedido.revisar !== false; rodada++) {
    if (!cabeNoTeto(gasto, teto, "revisar")) break;
    let rv;
    try {
      rv = await pedir("revisar", {
        contexto: { tecnica, duracao },
        roteiro: { cenas: roteiro.cenas.map((c) => ({ arquivo: c.arquivo, oQue: c.oQue, de: segundosDaAncora(c.de, palavras, duracao), ate: segundosDaAncora(c.ate, palavras, duracao, duracao) })) },
        quadros: paraOlhar.map((q) => ({
          t: q.t,
          base64: readFileSync(q.arquivo).toString("base64"),
          cenas: cenasNoInstante(roteiro, q.t, palavras, duracao).map((c) => c.arquivo),
          fala: falaPerto(q.t),
        })),
      });
    } catch (e) {
      revisao.erro = e instanceof Error ? e.message.slice(0, 300) : String(e);
      break;
    }
    revisao.rodadas = rodada;
    const reprovadas = (rv.reprovadas ?? []).filter((x) => x && (nomeDeArquivoValido(x.arquivo) || x.arquivo === "roteiro.json"));
    historico.push({ volta: `revisao-${rodada}`, reprovadas, quadros: paraOlhar.length, descritos: rv.descritos ?? null });
    revisao.reprovadas.push(...reprovadas.map((x) => ({ rodada, ...x })));
    marcar("revisao");
    if (!reprovadas.length || !cabeNoTeto(gasto, teto, "consertar")) break;
    const alvo = [...new Set(reprovadas.map((x) => x.arquivo))];
    const c = await pedir("consertar", { kit, fala, contexto, arquivos: atual, alvo, defeitos: reprovadas });
    const novos = Object.fromEntries(Object.entries(c.arquivos ?? {}).filter(([n]) => alvo.includes(n)));
    marcar("consertos");
    if (!Object.keys(novos).length) break;
    const tentativa = { ...atual, ...novos };
    // os quadros de novo, só dentro das cenas consertadas (o roteiro mexido pede todos)
    let instantes = null;
    if (!alvo.includes("roteiro.json")) {
      const roteiroNovo = JSON.parse(tentativa["roteiro.json"]);
      instantes = instantesDaConferencia(roteiroNovo, palavras, duracao).filter((s) => cenasNoInstante(roteiroNovo, s, palavras, duracao).some((x) => alvo.includes(x.arquivo)));
    }
    let r2 = await portoes(tentativa, c.numerosSemLastro, { instantes });
    marcar("portoes");
    if (r2.problemas.length && cabeNoTeto(gasto, teto, "consertar-codigo")) {
      const c2 = await pedir("consertar-codigo", { kit, fala, contexto, arquivos: tentativa, problemas: r2.problemas.slice(0, 40) });
      Object.assign(tentativa, Object.fromEntries(Object.entries(c2.arquivos ?? {}).filter(([n]) => alvo.includes(n))));
      marcar("consertos");
      r2 = await portoes(tentativa, c2.numerosSemLastro, { instantes });
      marcar("portoes");
    }
    if (r2.problemas.length) {
      // o conserto quebrou: volta para a versão que passou
      revisao.voltouAtras.push(...alvo);
      gravarCenas(projeto, atual, roteiro);
      avisos.push(`o conserto da revisão em ${alvo.join(", ")} não passou nos portões e voltou atrás`);
      break;
    }
    atual = tentativa;
    roteiro = r2.roteiro;
    revisao.consertadas.push(...alvo);
    for (const q of r2.conferencia.quadros) todosOsQuadros.set(q.t, q.arquivo);
    paraOlhar = r2.conferencia.quadros;
    conferencia = r2.conferencia;
  }

  // As folhas de conferência (os últimos quadros de cada instante), para o relatório e a prova
  mkdirSync(join(projeto, "work"), { recursive: true });
  const folhas = await folhasDosQuadros(projeto, [...todosOsQuadros.values()].filter((a) => existsSync(a))).catch(() => []);
  const arquivosDasFolhas = folhas.map((_, i) => join(projeto, "work", `folha-${i + 1}.jpg`));

  // 9. O RENDER FINAL, isolado, a -14 LUFS
  const saida = join(projeto, "out", "corte.mp4");
  const arquivoDoPedido = join(projeto, "pedido-render.json");
  writeFileSync(arquivoDoPedido, JSON.stringify({ acao: "final", saida, limites: limitesDoRender(), gl: process.env.GL_DOS_MODELOS || "swangle" }));
  const fim = await rodarIsolado(RENDER, [projeto, arquivoDoPedido], { cwd: projeto, prazoMs: Math.max(30, Math.ceil(duracao / 60) * 40) * 60_000, memoriaMb: 4096, aoLinha: (l) => l.startsWith("progresso") && aoPasso(`render ${l.slice(10)}`) });
  if (!fim.json?.ok) throw new Error(`o render final falhou: ${(fim.estourou ? "passou do prazo" : (fim.json?.erro ?? fim.saida.slice(-800))).slice(0, 800)}`);
  let arquivo = saida;
  marcar("render");

  // 10. A TRILHA do projeto por baixo (como no editor do curso); falhou, sai sem ela
  if (pedido.trilha?.url && obterTrilha) {
    try {
      const ext = String(pedido.trilha.url).match(/\.[a-z0-9]{2,4}(?=\?|$)/i)?.[0] ?? ".mp3";
      const trilha = await obterTrilha(pedido.trilha.url, join(pasta, `trilha${ext}`));
      const { misturarAudio } = await import("../sons.mjs");
      arquivo = await misturarAudio(arquivo, { trilha: { arquivo: trilha, volume: pedido.trilha.volume, abaixar: pedido.trilha.abaixar } }, duracao, pasta, join(pasta, "corte-com-trilha.mp4"));
    } catch (e) {
      avisos.push(`a trilha não entrou: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
    marcar("trilha");
  }

  return {
    arquivo,
    tecnica,
    decisao,
    duracao,
    custoUsd: +gasto.toFixed(4),
    gastoPorFase,
    tetoUsd: teto,
    tempos,
    historico,
    revisao,
    avisos,
    recorte: medidaDoRecorte,
    render: fim.json,
    amostra,
    folhas: arquivosDasFolhas,
    projeto,
    arquivosDaCena: atual,
  };
}

export { SemTeto };
