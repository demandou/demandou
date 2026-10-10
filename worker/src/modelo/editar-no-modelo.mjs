import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { opcaoDeFiltro, rodar } from "../ffmpeg.mjs";
import { fatiaAtual } from "../capacidade.mjs";

/**
 * O EDITOR DOS MODELOS DO CURSO (09/10/2026).
 *
 * Decisão do Bruno depois de comparar os vídeos do curso "Máquina de Edição IA"
 * com os do editor próprio: "a distância é gigantesca". Os 79 modelos do curso
 * viram o editor da Demandou, cada um com o treinamento da própria skill, e o
 * editor antigo (Vox, impacto, sóbrio) fica de reserva.
 *
 * A regra deste arquivo é FIDELIDADE: o vídeo sai pelos MESMOS scripts do curso
 * (worker/modelos/<id>/template/scripts), na MESMA ordem do SKILL.md, num
 * projeto novo por trabalho (a cópia do template, como o passo 1 manda). O que
 * muda é só quem faz os passos que no curso são de uma pessoa olhando:
 *
 *   curso                                   aqui
 *   1  copiar o template, npm install       cópia + node_modules do worker por link
 *   2  preparar.mjs (Whisper)               preparar.mjs --palavras (a Deepgram que o
 *                                           app já fez; o resto do script é o mesmo)
 *   3  escolher tomadas em cortes.json      a proposta do preparar (os trechos sem fala
 *                                           já saem); justar.mjs quando o modelo tem
 *   4  ler medir-1..3.jpg e medir o rosto   medir-rosto.py (Face Landmarker do MediaPipe)
 *      cortar.mjs --rosto-x/-y --queixo-y   cortar.mjs com as três medidas
 *   6/7 mapa editorial e plano.json         o app escreve (o Claude, com a skill inteira)
 *      conferir.mjs --mapa até APROVADO     conferir.mjs, que decide; nunca --forcar
 *      gate de tempo (ferramentas)          timing.mjs / conferir-tempos.mjs quando há
 *   9  render.mjs (-14 LUFS)                render.mjs
 *
 * Este módulo não chama IA: a escrita do plano mora no app, onde a conta de
 * custo de IA vive num lugar só (como o enquadramento e o diretor de sempre).
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
export const PASTA_DOS_MODELOS = process.env.PASTA_DOS_MODELOS ?? join(AQUI, "..", "..", "modelos");
/** Os pacotes do Remotion que os templates usam vêm do worker (mesma versão para todos). */
const NODE_MODULES = join(AQUI, "..", "..", "node_modules");
const PYTHON = process.env.PYTHON_DO_RECORTE ?? "python3";
const MODELO_ROSTO = process.env.MODELO_ROSTO ?? "/app/modelos/face_landmarker.task";
const FFMPEG = process.env.FFMPEG_BIN ?? "ffmpeg";

/** O índice gerado pelo importar.mjs: assinatura, 3D, ferramentas e imagens de cada modelo. */
export function indiceDosModelos() {
  return JSON.parse(readFileSync(join(PASTA_DOS_MODELOS, "indice.json"), "utf8"));
}

export function modeloExiste(id) {
  return typeof id === "string" && /^modelo-[a-z0-9-]+$/.test(id) && existsSync(join(PASTA_DOS_MODELOS, id, "template", "src", "plano.ts"));
}

/**
 * O treinamento do modelo, como o app precisa para escrever o plano: a skill,
 * o formato (plano.md e os tipos de src/plano.ts), como adaptar, o estilo e o
 * exemplo comentado. O plano do exemplo vai sem `palavras` e sem o rastro do
 * rosto, que são dados da gravação do exemplo e só ocupariam contexto.
 */
export function referenciasDoModelo(id) {
  if (!modeloExiste(id)) throw new Error(`modelo desconhecido: ${id}`);
  const r = join(PASTA_DOS_MODELOS, id, "referencias");
  const t = join(PASTA_DOS_MODELOS, id, "template");
  const ler = (...partes) => (existsSync(join(...partes)) ? readFileSync(join(...partes), "utf8") : null);
  let exemploPlano = null;
  const bruto = ler(r, "exemplo", "plano.json");
  if (bruto) {
    try {
      const p = JSON.parse(bruto);
      delete p.palavras;
      if (p.rosto?.rastro) delete p.rosto.rastro;
      exemploPlano = JSON.stringify(p, null, 1);
    } catch {
      exemploPlano = bruto;
    }
  }
  const conhecidos = new Set(["SKILL.md", "plano.md", "adaptar.md", "estilo.md", "imagens.md"]);
  const outros = readdirSync(r)
    .filter((n) => n.endsWith(".md") && !conhecidos.has(n))
    .map((n) => ({ nome: n, texto: readFileSync(join(r, n), "utf8") }));
  // A folha de quadros do exemplo (um quadro de cada momento), em base64: o
  // adaptar.md do curso manda olhar antes do mapa.
  const arquivoDosQuadros = join(r, "exemplo", "quadros.jpg");
  const quadros = existsSync(arquivoDosQuadros) ? readFileSync(arquivoDosQuadros).toString("base64") : null;
  return {
    id,
    quadros,
    skill: ler(r, "SKILL.md"),
    plano: ler(r, "plano.md"),
    adaptar: ler(r, "adaptar.md"),
    estilo: ler(r, "estilo.md"),
    imagens: ler(r, "imagens.md"),
    exemploComentado: ler(r, "exemplo", "plano-comentado.md"),
    exemploPlano,
    tipos: ler(t, "src", "plano.ts"),
    modelo: existsSync(join(t, "modelo.json")) ? JSON.parse(readFileSync(join(t, "modelo.json"), "utf8")) : {},
    outros,
  };
}

/** Roda um script do projeto com o Node do worker, no diretório do projeto (os scripts exigem). */
export function rodarNoProjeto(projeto, args, { prazoMs = 20 * 60_000, env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, args, { cwd: projeto, env: { ...process.env, ...env } });
    let saida = "";
    p.stdout.on("data", (d) => (saida += d));
    p.stderr.on("data", (d) => (saida += d));
    let estourou = false;
    const t = setTimeout(() => {
      estourou = true;
      p.kill("SIGKILL");
    }, prazoMs);
    p.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    p.on("close", (codigo) => {
      clearTimeout(t);
      resolve({ codigo: estourou ? -1 : codigo, saida: estourou ? `${saida}\n[passou de ${Math.round(prazoMs / 60_000)} min e foi parado]` : saida });
    });
  });
}

function rodarProcesso(bin, args, prazoMs = 5 * 60_000) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args);
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => p.kill("SIGKILL"), prazoMs);
    p.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    p.on("close", (codigo) => {
      clearTimeout(t);
      resolve({ codigo, out, err });
    });
  });
}

/** Falha de um passo do curso: a mensagem leva o fim da saída do script, que é onde o curso explica o erro. */
function falhou(passo, r) {
  const fim = String(r.saida ?? r.err ?? "").trim().split("\n").slice(-15).join("\n");
  return new Error(`${passo} falhou (código ${r.codigo}):\n${fim}`);
}

/**
 * O trecho de um corte como o curso espera a gravação: os pedaços mantidos da
 * fala limpa (relativos a `inicio`, os mesmos da edição gravada no app),
 * emendados na resolução e no enquadramento ORIGINAIS. Sem o punch-in
 * alternado do corte simples (ffmpeg.mjs, prepararTrecho): o enquadramento
 * agora é do cortar.mjs do curso, que mede o rosto e segue a pessoa.
 */
export async function extrairTrecho(original, saida, inicio, duracao, manter) {
  const pedacos = (manter ?? []).filter((m) => m.ate - m.de > 0.05);
  if (pedacos.length <= 1) {
    const de = pedacos[0]?.de ?? 0;
    const ate = pedacos[0]?.ate ?? duracao;
    await rodar([
      "-ss", String(inicio + de), "-i", original, "-t", String(ate - de),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", saida,
    ]);
    return { pedacos: 1 };
  }
  const partes = [];
  const mapa = [];
  pedacos.forEach((m, i) => {
    partes.push(
      `[0:v]trim=start=${m.de.toFixed(3)}:end=${m.ate.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`,
      `[0:a]atrim=start=${m.de.toFixed(3)}:end=${m.ate.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`
    );
    mapa.push(`[v${i}][a${i}]`);
  });
  const grafo = `${partes.join(";")};${mapa.join("")}concat=n=${pedacos.length}:v=1:a=1[v][a]`;
  const pasta = dirname(saida);
  const arquivo = join(pasta, `filtro-${basename(saida)}.txt`);
  await writeFile(arquivo, grafo, "utf8");
  await rodar(
    [
      "-ss", String(inicio), "-i", original, "-t", String(duracao),
      opcaoDeFiltro(), basename(arquivo),
      "-map", "[v]", "-map", "[a]",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", saida,
    ],
    { cwd: pasta }
  );
  return { pedacos: pedacos.length };
}

/** Passo 1: o projeto do trabalho, cópia do template com os pacotes do worker. */
export function criarProjeto(id, pasta) {
  if (!modeloExiste(id)) throw new Error(`modelo desconhecido: ${id}`);
  const projeto = join(pasta, "projeto");
  cpSync(join(PASTA_DOS_MODELOS, id, "template"), projeto, { recursive: true });
  // "junction" no Windows (sem privilégio de administrador); no Linux o tipo é ignorado.
  symlinkSync(NODE_MODULES, join(projeto, "node_modules"), "junction");
  for (const d of ["work", "out", "public"]) mkdirSync(join(projeto, d), { recursive: true });
  return projeto;
}

/** Passo 2: análise do vídeo bruto com a transcrição que o app já tem. */
export async function preparar(projeto, video, palavras) {
  const arquivo = join(projeto, "work", "palavras-externas.json");
  writeFileSync(arquivo, JSON.stringify(palavras));
  const r = await rodarNoProjeto(projeto, ["scripts/preparar.mjs", video, "--palavras", arquivo], { prazoMs: 30 * 60_000 });
  if (r.codigo !== 0) throw falhou("preparar.mjs", r);
  return { saida: r.saida, cortes: JSON.parse(readFileSync(join(projeto, "work", "cortes.json"), "utf8")) };
}

/**
 * Passo 3: as tomadas. O curso marca "[sem transcrição: ouça antes de tirar]"
 * nos trechos com volume de voz e nenhuma palavra, e pede para uma pessoa ouvir.
 * Aqui a transcrição é a da Deepgram, que já ouviu a gravação inteira: trecho
 * sem palavra DEPOIS da última fala (o fim da gravação, depois da chamada) sai;
 * no meio do vídeo fica, porque tirar uma palavra curta que a transcrição perdeu
 * é pior que deixar um respiro. Repetição de tomada não é tratada aqui.
 */
export function escolherTomadas(projeto) {
  const arquivo = join(projeto, "work", "cortes.json");
  const cortes = JSON.parse(readFileSync(arquivo, "utf8"));
  let ultimaFala = -1;
  cortes.forEach((c, i) => {
    if (c.texto?.trim()) ultimaFala = i;
  });
  const tirados = [];
  cortes.forEach((c, i) => {
    if (i > ultimaFala && c.manter !== false && !c.texto?.trim()) {
      c.manter = false;
      tirados.push({ de: c.de, ate: c.ate });
    }
  });
  writeFileSync(arquivo, `${JSON.stringify(cortes, null, 2)}\n`);
  return { tirados, mantidos: cortes.filter((c) => c.manter !== false).length };
}

/** Passo 3b: cortes justos nas pausas reais, nos modelos de corte seco que trazem a ferramenta. */
export async function justar(projeto, respiro) {
  if (!existsSync(join(projeto, "ferramentas", "justar.mjs"))) return null;
  const r = await rodarNoProjeto(projeto, ["ferramentas/justar.mjs", ...(respiro ? ["--respiro", String(respiro)] : [])], { prazoMs: 5 * 60_000 });
  if (r.codigo !== 0) throw falhou("justar.mjs", r);
  return r.saida;
}

/**
 * Passo 4a: rosto e queixo no vídeo ORIGINAL, em frações, nos mesmos três
 * instantes do preparar (15%, 50% e 85%). Os quadros saem sem a grade (a grade
 * é para olho humano e só atrapalharia o detector).
 */
export async function medirRosto(projeto, video, duracao) {
  const quadros = [];
  for (const [i, f] of [0.15, 0.5, 0.85].entries()) {
    const saida = join(projeto, "work", `rosto-${i + 1}.jpg`);
    const r = await rodarProcesso(FFMPEG, ["-y", "-v", "error", "-ss", (duracao * f).toFixed(3), "-i", video, "-frames:v", "1", "-q:v", "2", saida]);
    if (r.codigo === 0 && existsSync(saida)) quadros.push(saida);
  }
  if (!quadros.length) throw new Error("não consegui tirar os quadros de medida do vídeo");
  const r = await rodarProcesso(PYTHON, [join(AQUI, "medir-rosto.py"), JSON.stringify({ quadros, modelo_rosto: MODELO_ROSTO })], 3 * 60_000);
  if (r.codigo !== 0) throw new Error(`medir-rosto.py falhou: ${r.err.trim().split("\n").slice(-5).join("\n")}`);
  const medida = JSON.parse(r.out.trim().split("\n").pop());
  if (medida.erro) throw new Error(medida.erro);
  return medida;
}

/** Passo 4b: aplica os cortes, enquadra, segue o rosto e grava o esqueleto do plano. */
export async function cortar(projeto, medida, { recorte } = {}) {
  const args = ["scripts/cortar.mjs", "--rosto-x", String(medida.rostoX), "--rosto-y", String(medida.rostoY), "--queixo-y", String(medida.queixoY)];
  if (recorte) args.push("--recorte", recorte);
  const r = await rodarNoProjeto(projeto, args, { prazoMs: 30 * 60_000 });
  if (r.codigo !== 0) throw falhou("cortar.mjs", r);
  return { saida: r.saida, plano: lerPlano(projeto) };
}

export function lerPlano(projeto) {
  return JSON.parse(readFileSync(join(projeto, "src", "plano.json"), "utf8"));
}

/** O que o curso diz para nunca editar à mão: vem do cortar e não do plano escrito. */
const CAMPOS_DO_MOTOR = ["video", "fps", "largura", "altura", "duracao", "videoAltura", "rosto", "zona", "cortesEm", "palavras", "enquadramentos", "imagens"];

/**
 * Junta o que o app escreveu (marca, momentos, semLegenda, correções e os
 * campos próprios do modelo) ao esqueleto do cortar. Campo do motor nunca é
 * trocado pelo que veio escrito.
 */
export function gravarPlano(projeto, escrito) {
  const base = lerPlano(projeto);
  const plano = { ...base };
  for (const [k, v] of Object.entries(escrito ?? {})) {
    if (CAMPOS_DO_MOTOR.includes(k)) continue;
    plano[k] = v;
  }
  writeFileSync(join(projeto, "src", "plano.json"), `${JSON.stringify(plano, null, 2)}\n`);
  return plano;
}

/** O resumo do esqueleto que vai ao app: tudo menos o rastro do rosto (milhares de números). */
export function esqueletoParaEscrever(plano) {
  const { rosto, ...resto } = plano;
  return { ...resto, rosto: rosto ? { x: rosto.x, y: rosto.y } : null };
}

/** Passo 7: a conferência do curso. Aprovado só com código 0 e a palavra APROVADO. */
export async function conferir(projeto) {
  const r = await rodarNoProjeto(projeto, ["scripts/conferir.mjs", "--mapa"], { prazoMs: 2 * 60_000 });
  return { aprovado: r.codigo === 0 && /APROVADO\./.test(r.saida), saida: r.saida };
}

/**
 * O gate de tempo dos modelos que trazem um (±0,15 s entre o que entra na tela
 * e a palavra que o nomeia). Modelo sem ferramenta de tempo passa direto.
 */
export async function gateDeTempo(projeto) {
  const resultados = [];
  for (const f of ["timing.mjs", "conferir-tempos.mjs", "conferir-tempo.mjs"]) {
    if (!existsSync(join(projeto, "ferramentas", f))) continue;
    const r = await rodarNoProjeto(projeto, [`ferramentas/${f}`], { prazoMs: 2 * 60_000 });
    resultados.push({ ferramenta: f, ok: r.codigo === 0, saida: r.saida });
  }
  return { ok: resultados.every((x) => x.ok), resultados };
}

/** As linhas de legenda, para o relatório (quebra ruim e palavra solta). */
export async function legendas(projeto) {
  const r = await rodarNoProjeto(projeto, ["scripts/legendas.mjs"], { prazoMs: 2 * 60_000 });
  return r.saida;
}

/** Passo 8: quadros de conferência de cada momento (metade do tamanho), em out/stills. */
export async function stills(projeto, args = ["--momentos"]) {
  const r = await rodarNoProjeto(projeto, ["scripts/stills.mjs", ...args], { prazoMs: 20 * 60_000 });
  if (r.codigo !== 0) throw falhou("stills.mjs", r);
  return r.saida
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.endsWith(".jpg"))
    .map((l) => join(projeto, l));
}

/**
 * O FLUXO INTEIRO de um corte num modelo do curso, na ordem do SKILL.md.
 *
 * `pedido`: { modelo, sourceUrl, inicio, duracao, manter, palavras ([{em, ate, w}]
 * no tempo do corte, a fala limpa), marca {nome, area}, nicho, tetoUsd, voltas }.
 * `pedirPlano(corpo)` chama o app (a IA mora lá) e devolve { mapa, plano,
 * custoUsd, numerosSemLastro }. Volta reprovada leva ao app a saída do
 * conferir.mjs, como o curso manda; o teto de gasto para antes de passar.
 */
export async function editarNoModelo(pedido, pasta, { obterOriginal, pedirPlano, aoPasso = () => {}, obterTrilha = null }) {
  const tempos = {};
  let t = Date.now();
  const marcar = (nome) => {
    tempos[nome] = +((Date.now() - t) / 1000).toFixed(1);
    t = Date.now();
    aoPasso(nome);
  };
  const original = await obterOriginal(pedido.sourceUrl);
  const trecho = join(pasta, "trecho.mp4");
  await extrairTrecho(original, trecho, pedido.inicio ?? 0, pedido.duracao, pedido.manter);
  marcar("trecho");
  const projeto = criarProjeto(pedido.modelo, pasta);
  await preparar(projeto, trecho, pedido.palavras);
  const tomadas = escolherTomadas(projeto);
  await justar(projeto);
  marcar("preparar");
  const analise = JSON.parse(readFileSync(join(projeto, "work", "analise.json"), "utf8"));
  const medida = await medirRosto(projeto, trecho, analise.duracao);
  const corte = await cortar(projeto, medida);
  const avisos = corte.saida.split("\n").filter((l) => /^Aviso/.test(l));
  marcar("cortar");

  const referencias = referenciasDoModelo(pedido.modelo);
  const maxVoltas = Math.max(1, Math.min(4, Number(pedido.voltas) || 3));
  const teto = Number(pedido.tetoUsd) > 0 ? Number(pedido.tetoUsd) : 1;
  let gasto = 0;
  const somar = (r) => {
    gasto += Number(r?.custoUsd) || 0;
    return r;
  };
  const comum = { modelo: pedido.modelo, referencias, nicho: pedido.nicho ?? null };

  // PASSO 6b, nos modelos com imagem (references/imagens.md): mapa, pedidos,
  // busca, folha numerada, escolha olhando a folha.
  let mapaDasImagens = null;
  let creditos = null;
  if (referencias.imagens) {
    const r = await passoDasImagens(projeto, { ...comum, esqueleto: esqueletoParaEscrever(lerPlano(projeto)) }, (c) => pedirPlano(c).then(somar));
    mapaDasImagens = r.mapa;
    creditos = r.creditos;
    marcar("imagens");
  }

  // PASSO 7: o plano, até o conferir.mjs, o gate de tempo e a guarda de número aprovarem.
  const esqueleto = esqueletoParaEscrever(lerPlano(projeto));
  const escrever = (anterior) => pedirPlano({ ...comum, esqueleto, marca: pedido.marca, anterior, mapa: mapaDasImagens }).then(somar);
  const conferirTudo = async (escrito) => {
    const conf = await conferir(projeto);
    const tempo = await gateDeTempo(projeto);
    const semLastro = escrito.numerosSemLastro ?? [];
    return {
      aprovado: conf.aprovado && tempo.ok && semLastro.length === 0,
      registro: { conferir: conf.aprovado, tempo: tempo.ok, semLastro },
      anterior: { plano: escrito.plano, saidas: [conf.saida, ...tempo.resultados.filter((g) => !g.ok).map((g) => `${g.ferramenta}:\n${g.saida}`)], numerosSemLastro: semLastro },
    };
  };
  let anterior = null;
  let mapa = mapaDasImagens ?? "";
  let aprovado = false;
  let planoAprovado = null;
  let volta = 0;
  const historico = [];
  for (; volta < maxVoltas && !aprovado; volta++) {
    if (gasto >= teto) throw new Error(`o teto de US$ ${teto.toFixed(2)} da edição foi atingido antes da volta ${volta + 1} do plano`);
    const escrito = await escrever(anterior);
    mapa = escrito.mapa || mapa;
    writeFileSync(join(projeto, "work", "mapa.md"), mapa);
    gravarPlano(projeto, escrito.plano);
    const c = await conferirTudo(escrito);
    aprovado = c.aprovado;
    historico.push({ volta: volta + 1, ...c.registro });
    if (aprovado) planoAprovado = escrito.plano;
    else anterior = c.anterior;
  }
  marcar("plano");
  if (!aprovado) {
    const ultima = anterior?.saidas?.[0]?.trim().split("\n").slice(-6).join(" ") ?? "";
    throw new Error(`o plano não passou na conferência do curso em ${maxVoltas} voltas: ${ultima.slice(0, 400)}`);
  }

  // PASSO 8: olhar os quadros de cada momento (texto inteiro, número batendo
  // com a fala, rosto livre, janela com a cabeça, a tela mudando) e corrigir
  // SÓ o momento com defeito (skill bônus de revisão: por intervalo, sem
  // refazer tudo). Uma rodada de olhar e até duas de consertar: o conserto
  // reprovado volta ao Claude com a saída do conferir.mjs, como o curso manda
  // ("até APROVADO"). Na prova do Viral (09/10) uma tentativa só reprovou e os
  // nove defeitos vistos ficaram no vídeo. Se as duas reprovarem, vale o plano
  // aprovado. Falha da revisão não segura o vídeo.
  const revisao = { rodadas: 0, problemas: [], aplicada: false, tentativas: 0 };
  if (pedido.revisar !== false && gasto < teto) {
    try {
      const quadros = await stills(projeto);
      const folhas = await folhasDosQuadros(projeto, quadros);
      if (folhas.length) {
        const rev = await pedirPlano({ ...comum, fase: "revisar", plano: planoAprovado, folhas: folhas.map((f) => f.base64), legendas: folhas.map((f) => f.legenda) }).then(somar);
        revisao.rodadas = 1;
        revisao.problemas = rev.problemas ?? [];
        if (revisao.problemas.length && gasto < teto) {
          const texto = revisao.problemas.map((p, i) => `${i + 1}. ${p.em != null ? `em ${Number(p.em).toFixed(1)} s` : ""} (${p.momento ?? "?"}): ${p.problema}${p.mudanca ? `. Mudança: ${p.mudanca}` : ""}`).join("\n");
          const pedidoDaRevisao = `REVISÃO DOS QUADROS (passo 8 do SKILL.md, olhando cada momento renderizado). Conserte SÓ estes momentos e mantenha todo o resto exatamente como está:\n${texto}`;
          let paraConsertar = { plano: planoAprovado, saidas: [pedidoDaRevisao], numerosSemLastro: [] };
          for (let tentativa = 1; tentativa <= 2 && !revisao.aplicada && gasto < teto; tentativa++) {
            revisao.tentativas = tentativa;
            const escrito = await escrever(paraConsertar);
            gravarPlano(projeto, escrito.plano);
            const c = await conferirTudo(escrito);
            historico.push({ volta: `revisao-${tentativa}`, ...c.registro, saida: c.aprovado ? undefined : c.anterior.saidas.join("\n").slice(-1500) });
            if (c.aprovado) {
              revisao.aplicada = true;
              mapa = escrito.mapa || mapa;
            } else {
              paraConsertar = {
                plano: escrito.plano,
                saidas: [pedidoDaRevisao, "O CONSERTO ACIMA FOI CONFERIDO E REPROVOU. Mantenha os consertos da revisão e corrija só o que a conferência apontou:", ...c.anterior.saidas],
                numerosSemLastro: c.anterior.numerosSemLastro,
              };
            }
          }
          if (!revisao.aplicada) gravarPlano(projeto, planoAprovado);
        }
      }
    } catch (e) {
      gravarPlano(projeto, planoAprovado);
      revisao.erro = e instanceof Error ? e.message.slice(0, 300) : String(e);
    }
    marcar("revisao");
  }

  let arquivo = await renderizar(projeto, `${pedido.modelo}.mp4`, { prazoMs: Math.max(30, Math.ceil((analise.duracao || 60) / 60) * 25) * 60_000 });
  marcar("render");

  // A TRILHA DO PROJETO (10/10, Bruno: "sumiu a parte de escolher a música"): o
  // modelo renderiza a voz e os sons dele; a música escolhida entra por baixo,
  // do mesmo jeito do editor de antes (sons.mjs, misturarAudio: no volume do
  // estilo, abaixando sob a voz, com fade, em laço). Falhou, o vídeo sai sem
  // ela, nunca deixa de sair.
  if (pedido.trilha?.url && obterTrilha) {
    try {
      const ext = String(pedido.trilha.url).match(/\.[a-z0-9]{2,4}(?=\?|$)/i)?.[0] ?? ".mp3";
      const trilha = await obterTrilha(pedido.trilha.url, join(pasta, `trilha${ext}`));
      const { misturarAudio } = await import("../sons.mjs");
      const duracao = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo], { encoding: "utf8" }).stdout.trim());
      if (duracao > 0) {
        arquivo = await misturarAudio(arquivo, { trilha: { arquivo: trilha, volume: pedido.trilha.volume, abaixar: pedido.trilha.abaixar } }, duracao, pasta, join(pasta, `${pedido.modelo}-com-trilha.mp4`));
      }
    } catch (e) {
      avisos.push(`a trilha não entrou: ${e instanceof Error ? e.message.slice(0, 160) : e}`);
    }
    marcar("trilha");
  }
  return { arquivo, mapa, voltas: volta, historico, revisao, creditos, custoUsd: +gasto.toFixed(4), tomadas, avisos, tempos };
}

/**
 * As folhas de conferência do passo 8: os quadros do stills.mjs --momentos,
 * 6 por linha e 3 linhas por folha, com a lista dos instantes na ordem (a
 * folha não tem texto: o instante de cada quadro vai na legenda). No máximo 4
 * folhas (72 quadros); acima disso, um quadro sim, um não.
 */
export async function folhasDosQuadros(projeto, quadros) {
  let lista = [...quadros].sort();
  while (lista.length > 72) lista = lista.filter((_, i) => i % 2 === 0);
  const folhas = [];
  for (let i = 0; i < lista.length; i += 18) {
    const grupo = lista.slice(i, i + 18);
    const arquivoLista = join(projeto, "work", `folha-${folhas.length + 1}.txt`);
    writeFileSync(arquivoLista, grupo.map((q) => `file '${q.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
    const saida = join(projeto, "work", `folha-${folhas.length + 1}.jpg`);
    const r = await rodarProcesso(FFMPEG, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", arquivoLista, "-vf", "scale=270:-2,tile=6x3:padding=4:color=white", "-frames:v", "1", "-q:v", "4", saida]);
    if (r.codigo !== 0 || !existsSync(saida)) continue;
    const instantes = grupo.map((q) => (basename(q).match(/t(\d+\.\d+)/)?.[1] ?? "?").replace(/^0+(?=\d)/, ""));
    folhas.push({ base64: readFileSync(saida).toString("base64"), legenda: `Folha ${folhas.length + 1}: ${grupo.length} quadros, da esquerda para a direita e de cima para baixo, nos instantes (s) ${instantes.join(", ")}` });
  }
  return folhas;
}

/**
 * PASSO 6b (references/imagens.md): o app faz o mapa e os pedidos, o
 * scripts/imagens.mjs do curso busca e monta a folha, o app escolhe olhando a
 * folha (uma nova busca permitida por pedido) e o script grava a escolha, o
 * foco, o crédito e o resumo em plano.imagens. Sem nenhum pedido, segue sem imagem.
 */
async function passoDasImagens(projeto, corpo, pedir) {
  const r = await pedir({ ...corpo, fase: "imagens" });
  const pedidos = Array.isArray(r.imagens) ? r.imagens : [];
  if (!pedidos.length) return { mapa: r.mapa ?? null, creditos: null };
  const arquivo = join(projeto, "work", "imagens.json");
  writeFileSync(arquivo, JSON.stringify(pedidos, null, 2));
  const rodarImagens = async (args = []) => {
    const x = await rodarNoProjeto(projeto, ["scripts/imagens.mjs", ...args], { prazoMs: 12 * 60_000 });
    if (x.codigo !== 0) throw falhou(`imagens.mjs ${args.join(" ")}`, x);
    return x.saida;
  };
  await rodarImagens();
  const escolhidos = new Set();
  for (let rodada = 0; rodada < 2; rodada++) {
    const folhas = readdirSync(join(projeto, "work"))
      .filter((n) => /^imagens(-\d+)?\.jpg$/.test(n))
      .sort((a, b) => (Number(a.match(/-(\d+)/)?.[1] ?? 1) - Number(b.match(/-(\d+)/)?.[1] ?? 1)))
      .map((n) => readFileSync(join(projeto, "work", n)).toString("base64"));
    const estado = JSON.parse(readFileSync(arquivo, "utf8")).filter((p) => !escolhidos.has(p.id));
    if (!estado.length || !folhas.length) break;
    const e = await pedir({ ...corpo, fase: "escolher", pedidos: estado, folhas });
    const refazer = [];
    for (const x of e.escolhas ?? []) {
      if (!estado.some((p) => p.id === x.id)) continue;
      if (x.refazer && rodada === 0) {
        refazer.push(x);
        continue;
      }
      const n = x.refazer ? 0 : Number(x.n) || 0;
      await rodarImagens(["--escolher", x.id, String(n), ...(n && Array.isArray(x.foco) ? ["--foco", `${x.foco[0]},${x.foco[1]}`] : [])]);
      escolhidos.add(x.id);
    }
    if (!refazer.length) break;
    for (const x of refazer) await rodarImagens(["--refazer", x.id, "--busca", x.refazer]);
    await rodarImagens();
  }
  // Pedido que ficou sem resposta vira o cartão com a palavra (o curso: "cartão é melhor que imagem errada").
  for (const p of JSON.parse(readFileSync(arquivo, "utf8"))) {
    if (!escolhidos.has(p.id) && !p.escolha) await rodarImagens(["--escolher", p.id, "0"]);
  }
  await rodarImagens(["--limpar"]).catch(() => {});
  const creditos = existsSync(join(projeto, "creditos.txt")) ? readFileSync(join(projeto, "creditos.txt"), "utf8").trim() : null;
  return { mapa: r.mapa ?? null, creditos: creditos || null };
}

/** Passo 9: o render do curso, que recusa plano reprovado e normaliza o áudio a -14 LUFS. */
/**
 * Os limites do servidor para o render.mjs do curso (10/10): o primeiro corte
 * em produção morreu duas vezes em "render 0%" (EPIPE) com uma aba do Chrome
 * por núcleo. Os mesmos números do editor de antes (montagem.mjs,
 * opcoesDoRender), da fatia deste trabalho na fila (capacidade.mjs). Ver
 * worker/modelos/limites-do-servidor.mjs.
 */
export function limitesDoRender() {
  return {
    concurrency: fatiaAtual().remotion,
    offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
    offthreadVideoThreads: 2,
    chromiumOptions: process.platform === "linux" ? { enableMultiProcessOnLinux: true } : {},
    timeoutInMilliseconds: 120_000,
  };
}

export async function renderizar(projeto, nome = "video-editado.mp4", { prazoMs = 90 * 60_000 } = {}) {
  const saida = join("out", nome);
  const r = await rodarNoProjeto(projeto, ["scripts/render.mjs", saida], { prazoMs, env: { RENDER_DO_SERVIDOR: JSON.stringify(limitesDoRender()) } });
  if (r.codigo !== 0) throw falhou("render.mjs", r);
  return join(projeto, saida);
}
