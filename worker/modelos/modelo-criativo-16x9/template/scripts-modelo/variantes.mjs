// Variantes de gancho do Criativo: o mesmo anúncio com 2 ou 3 ganchos diferentes, um MP4 por gancho,
// para testar no gerenciador de anúncios qual segura mais gente nos primeiros segundos.
//
// O aluno grava os ganchos um depois do outro e, em seguida, o corpo (pode ser num arquivo só).
// O plano principal (src/plano.json) tem o vídeo inteiro — todos os ganchos seguidos e o corpo —,
// com os momentos de cada trecho, e diz onde cada um está em `variantes`:
//   "variantes": { "ganchos": [ { "nome": "A", "de": 0, "ate": 2.86 }, … ], "corpo": { "de": 9.3, "ate": 18.52 } }
// Este script monta um plano por gancho (gancho X + o mesmo corpo, emendados em corte seco; os
// tempos de tudo são refeitos), confere cada um como o render.mjs confere e renderiza.
//
// Uso (de dentro da pasta do projeto):
//   node scripts-modelo/variantes.mjs                       confere e renderiza todas as variantes
//   node scripts-modelo/variantes.mjs --conferir            só monta e confere (não renderiza)
//   node scripts-modelo/variantes.mjs --so B                só a variante B
//   node scripts-modelo/variantes.mjs --stills A 0 1.4 3    quadros de conferência de uma variante (out/variantes/stills)
//   node scripts-modelo/variantes.mjs --nome "garrafa"      nome dos arquivos: out/garrafa - gancho A.mp4
//   node scripts-modelo/variantes.mjs --saida "/pasta"      onde gravar os MP4 (padrão: out/)
// Os planos montados ficam em out/variantes/plano-<gancho>.json (para conferir à mão).
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { argumentos, exigirProjeto, ffmpeg, lerJson, medirVolume } from "../scripts/comum.mjs";
import { conferirPlano, tiposDoModelo } from "../scripts/conferir.mjs";

exigirProjeto();
const { opcoes, posicionais } = argumentos();
const plano = lerJson("src/plano.json");
const modelo = existsSync("modelo.json") ? lerJson("modelo.json") : {};
const v = plano.variantes;
if (!v?.ganchos?.length || !v.corpo) {
  console.error('O plano não tem "variantes". Diga onde estão os ganchos e o corpo (veja references/plano.md, "Variantes de gancho").');
  process.exit(1);
}

const r3 = (x) => Math.round(x * 1000) / 1000;
const palavrasEm = (de, ate) => plano.palavras.filter((p) => p.em >= de - 0.02 && p.em < ate - 0.02);
// campos que são instantes na linha do tempo
const ehTempo = (k) => k === "de" || k === "ate" || k === "em" || /Em$/.test(k) || k === "telaCheia";

// Monta o plano de um gancho: os dois trechos do vídeo cortado e os tempos refeitos.
export const montarVariante = (g) => {
  const pg = palavrasEm(g.de, g.ate);
  const pc = palavrasEm(v.corpo.de, v.corpo.ate);
  if (!pg.length) throw new Error(`O gancho ${g.nome} (${g.de}–${g.ate} s) não tem fala.`);
  if (!pc.length) throw new Error(`O corpo (${v.corpo.de}–${v.corpo.ate} s) não tem fala.`);
  // o gancho começa logo antes da 1ª palavra (o anúncio não pode ter silêncio no começo)
  const s0 = r3(Math.max(g.de, pg[0].em - 0.1));
  const s1 = r3(Math.min(g.ate, pg[pg.length - 1].ate + 0.12));
  const b0 = r3(Math.max(v.corpo.de, pc[0].em - 0.1));
  // o anúncio termina ~0,3 s depois da última palavra
  const b1 = r3(Math.min(v.corpo.ate, pc[pc.length - 1].ate + 0.3, plano.duracao));
  const dG = s1 - s0;
  const dur = r3(dG + (b1 - b0));
  const noGancho = (t) => r3(Math.min(Math.max(t - s0, 0), dG));
  const noCorpo = (t) => r3(dG + Math.min(Math.max(t - b0, 0), b1 - b0));
  const refazer = (obj, mapa) => {
    if (Array.isArray(obj)) return obj.map((x) => refazer(x, mapa));
    if (obj && typeof obj === "object") {
      const novo = {};
      for (const [k, x] of Object.entries(obj)) novo[k] = typeof x === "number" && ehTempo(k) ? mapa(x) : x && typeof x === "object" ? refazer(x, mapa) : x;
      return novo;
    }
    return obj;
  };
  const momentos = [];
  for (const m of plano.momentos) {
    if (m.de >= g.de - 0.02 && m.de < g.ate - 0.02) momentos.push(refazer(m, noGancho));
    else if (m.de >= v.corpo.de - 0.05) momentos.push(refazer(m, noCorpo));
  }
  // o último momento vai até o fim do anúncio
  for (const m of momentos) if (m.ate > dur - 0.05 || m.ate >= r3(dG + (v.corpo.ate - b0)) - 0.05) m.ate = dur;
  const palavras = [
    ...pg.filter((p) => p.em >= s0 - 0.02).map((p) => ({ ...p, em: noGancho(p.em), ate: noGancho(p.ate) })),
    ...pc.filter((p) => p.em < b1).map((p) => ({ ...p, em: noCorpo(p.em), ate: noCorpo(p.ate) })),
  ];
  const cortesEm = (plano.cortesEm ?? [])
    .flatMap((c) => (c > s0 + 0.05 && c < s1 - 0.05 ? [noGancho(c)] : c > b0 + 0.05 && c < b1 - 0.05 ? [noCorpo(c)] : []))
    .sort((a, b) => a - b);
  const semLegenda = (plano.semLegenda ?? []).flatMap((f) =>
    f.ate > s0 && f.de < s1 ? [{ de: noGancho(f.de), ate: noGancho(f.ate) }] : f.ate > b0 && f.de < b1 ? [{ de: noCorpo(f.de), ate: noCorpo(f.ate) }] : [],
  );
  const { variantes: _fora, ...resto } = plano;
  return { ...resto, duracao: dur, cortesEm, semLegenda, momentos, palavras, trechos: [{ de: s0, ate: s1 }, { de: b0, ate: b1 }], variante: g.nome };
};

const escolhidos = v.ganchos.filter((g) => !opcoes.so || String(opcoes.so).toUpperCase() === String(g.nome).toUpperCase());
const alvoStills = typeof opcoes.stills === "string" ? opcoes.stills.toUpperCase() : null;
const lista = alvoStills ? v.ganchos.filter((g) => String(g.nome).toUpperCase() === alvoStills) : escolhidos;
if (!lista.length) {
  console.error(`Nenhum gancho com esse nome. Os ganchos do plano: ${v.ganchos.map((g) => g.nome).join(", ")}.`);
  process.exit(1);
}

// 1. monta e confere cada variante
mkdirSync("out/variantes", { recursive: true });
const tipos = tiposDoModelo();
const planos = [];
let reprovadas = 0;
for (const g of lista) {
  const vp = montarVariante(g);
  writeFileSync(`out/variantes/plano-${g.nome}.json`, JSON.stringify(vp, null, 1));
  const r = conferirPlano(vp, modelo, tipos);
  const fala = vp.palavras.slice(0, 8).map((p) => p.w).join(" ");
  console.log(`Gancho ${g.nome}: ${vp.duracao.toFixed(2).replace(".", ",")} s · ${vp.momentos.length} momentos · cobertura ${Math.round(r.cobertura * 100)}% · "${fala}…"  ${r.ok ? "APROVADO" : "REPROVADO"}`);
  r.avisos.forEach((a) => console.log(`   aviso: ${a}`));
  r.erros.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
  if (!r.ok) reprovadas++;
  planos.push({ g, vp });
}
if (reprovadas && !opcoes.forcar) {
  console.error("\nCorrija o plano principal (src/plano.json) e rode de novo. Não entregue variante reprovada.");
  process.exit(1);
}
if (opcoes.conferir) process.exit(0);

// 2. renderiza (um bundle só para todas)
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
try {
  if (alvoStills) {
    const { vp } = planos[0];
    const tempos = posicionais.map(Number).filter((n) => Number.isFinite(n));
    const inputProps = { plano: vp };
    const composition = await selectComposition({ serveUrl, id: "Edicao", inputProps });
    mkdirSync("out/variantes/stills", { recursive: true });
    for (const t of tempos.length ? tempos : [0, 0.6, 1.5]) {
      const frame = Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps)));
      const output = `out/variantes/stills/${vp.variante}-t${t.toFixed(2).padStart(6, "0")}.jpg`;
      await renderStill({ composition, serveUrl, frame, output, inputProps, imageFormat: "jpeg", jpegQuality: 88, scale: 0.5, logLevel: "error" });
      console.log(output);
    }
  } else {
    const pasta = opcoes.saida ? path.resolve(String(opcoes.saida)) : path.resolve("out");
    const nome = typeof opcoes.nome === "string" ? opcoes.nome : "anuncio";
    mkdirSync(pasta, { recursive: true });
    for (const { g, vp } of planos) {
      const inputProps = { plano: vp };
      const composition = await selectComposition({ serveUrl, id: "Edicao", inputProps });
      const bruto = path.join(pasta, `.variante-${g.nome}.mov`);
      const saida = path.join(pasta, `${nome} - gancho ${g.nome}.mp4`);
      let ultimo = -1;
      // mesmas opções do render.mjs: áudio sem compressão no bruto, AAC só no fim (sem atraso)
      await renderMedia({
        composition,
        serveUrl,
        inputProps,
        codec: "h264",
        crf: 17,
        audioCodec: "pcm-16",
        imageFormat: "jpeg",
        jpegQuality: 92,
        pixelFormat: "yuv420p",
        colorSpace: "bt709",
        outputLocation: bruto,
        logLevel: "error",
        onProgress: ({ progress }) => {
          const pct = Math.floor(progress * 10) * 10;
          if (pct !== ultimo) {
            ultimo = pct;
            console.log(`gancho ${g.nome}: render ${pct}%`);
          }
        },
      });
      const m = medirVolume(bruto);
      const filtro = `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
      ffmpeg(["-y", "-i", bruto, "-c:v", "copy", "-af", filtro, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", saida]);
      rmSync(bruto, { force: true });
      console.log(`Pronto: ${saida}  (${vp.duracao.toFixed(2).replace(".", ",")} s, áudio ${m.input_i} → -14 LUFS)`);
    }
  }
} finally {
  rmSync(serveUrl, { recursive: true, force: true });
}
