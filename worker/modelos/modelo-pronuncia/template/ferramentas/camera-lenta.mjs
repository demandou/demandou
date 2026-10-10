// Prepara a repetição em câmera lenta de cada ficha `pronuncia` que tem `lenta`:
// - acha na voz o começo e o fim exatos da palavra (perto do `de`/`ate` que o plano deu);
// - acha a pausa em volta dela: a repetição começa quando a frase anterior termina e acaba quando
//   a próxima começa, e a velocidade é a que faz a palavra preencher essa pausa (0,45 a 0,85);
// - recorta a palavra do áudio do vídeo de trabalho e a deixa mais lenta sem mudar o tom
//   (filtro atempo do ffmpeg que vem com o Remotion) → public/lenta/<palavra>.wav;
// - mede a onda da voz e os limites das sílabas (pelos vales da onda) para a tela.
// Grava tudo em `lenta` no próprio momento do src/plano.json.
//
// Uso:  node ferramentas/camera-lenta.mjs            (depois do cortar e de escrever as fichas)
//       node ferramentas/camera-lenta.mjs --ritmo 0.6 (força a mesma velocidade em todas)
// Rode de novo sempre que refizer o corte ou mudar o `de`/`ate` de uma `lenta`.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { argumentos, exigirProjeto, ffmpeg, gravarJson, lerJson } from "../scripts/comum.mjs";

exigirProjeto();
const { opcoes } = argumentos();
const plano = lerJson("src/plano.json");
const video = `public/${plano.video ?? "base.mp4"}`;
if (!existsSync(video)) throw new Error(`Não achei ${video}. Rode o cortar antes.`);
const fichas = (plano.momentos ?? []).filter((m) => m.tipo === "pronuncia" && m.lenta);
if (!fichas.length) {
  console.log('Nenhuma ficha "pronuncia" com "lenta" no plano. Nada a fazer.');
  process.exit(0);
}

// ——— a voz do vídeo inteiro, em janelas de 10 ms ———
const TAXA = 16000;
const PASSO = 0.01;
mkdirSync("work", { recursive: true });
ffmpeg(["-y", "-i", video, "-map", "0:a:0", "-ac", "1", "-ar", String(TAXA), "-c:a", "pcm_s16le", "work/lenta-voz.wav"]);
const lerPcm = (arquivo) => {
  const wav = readFileSync(arquivo);
  return wav.subarray(wav.indexOf("data", 12, "ascii") + 8);
};
const pcm = lerPcm("work/lenta-voz.wav");
rmSync("work/lenta-voz.wav", { force: true });
const J = TAXA * PASSO;
const db = [];
for (let k = 0; (k + 2) * J * 2 <= pcm.length; k++) {
  let soma = 0;
  for (let i = k * J; i < (k + 2) * J; i++) {
    const v = pcm.readInt16LE(i * 2) / 32768;
    soma += v * v;
  }
  db.push(10 * Math.log10(soma / (2 * J) + 1e-12));
}
const ordem = [...db].sort((a, b) => a - b);
const pico = ordem[Math.floor(ordem.length * 0.98)] ?? -12;
const limiar = pico - 30;
const idx = (t) => Math.max(0, Math.min(db.length - 1, Math.round(t / PASSO)));
const fala = (k, n = 3) => {
  for (let i = 0; i < n; i++) if ((db[k + i] ?? -120) <= limiar) return false;
  return true;
};

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "palavra";
const r2 = (v) => Math.round(v * 1000) / 1000;
const entre = (v, a, b) => Math.min(b, Math.max(a, v));

mkdirSync("public/lenta", { recursive: true });
const usados = new Set();
for (const m of fichas) {
  const l = m.lenta;
  // 1. começo e fim da palavra na voz. Começo: a fala que sai de um silêncio perto do `de` (a
  //    transcrição erra uns décimos); fim: a última fala antes de uma pausa de 0,12 s ou mais.
  const silencioAntes = (k) => [1, 2, 3].every((d) => (db[k - d] ?? -120) <= limiar);
  let ini = -1;
  for (let k = idx(l.de - 0.25); k <= idx(l.de + 0.45) && ini < 0; k++) if (fala(k, 2) && silencioAntes(k)) ini = k;
  if (ini < 0) {
    ini = idx(l.de - 0.1);
    while (ini < idx(l.de + 0.45) && !fala(ini, 2)) ini++;
  }
  let fim = ini;
  for (let k = ini; k < Math.min(db.length - 1, idx(Math.max(l.ate, l.de + 0.3) + 0.8)); k++) {
    if (fala(k, 1)) fim = k;
    else if (k - fim >= 12) break;
  }
  const a = Math.max(0, ini * PASSO - 0.04);
  const b = fim * PASSO + 0.07;
  // 2. a pausa em volta: a frase anterior termina, a próxima começa
  let antes = ini - 4;
  while (antes > ini - 70 && !fala(antes - 2, 3)) antes--;
  let depois = fim + 12;
  while (depois < fim + 200 && depois < db.length - 3 && !fala(depois, 3)) depois++;
  const em = l.emPedido ?? r2(Math.max(antes * PASSO + 0.03, a - 0.6));
  const volta = l.fimPedido ?? r2(depois * PASSO - 0.03);
  // 3. a velocidade que faz a palavra preencher a pausa
  const pedido = Number(opcoes.ritmo ?? l.ritmoPedido ?? NaN);
  const natural = (b - a) / Math.max(0.05, volta - em);
  const ritmo = Number.isFinite(pedido) ? entre(pedido, 0.4, 1) : entre(natural, 0.45, 0.85);
  // 4. sílabas: os vales mais fundos da onda dentro da palavra (quantas a leitura tiver)
  const faladas = (m.silabas ?? []).filter((s) => !s.muda).length || (m.leitura ?? "").split(/[-·.\s]+/).filter(Boolean).length || 1;
  const suave = (k) => ((db[k - 1] ?? -120) + (db[k] ?? -120) + (db[k + 1] ?? -120)) / 3;
  const vales = [];
  for (let k = ini + 6; k < fim - 6; k++) {
    if (suave(k) < suave(k - 1) && suave(k) <= suave(k + 1)) {
      const prof = Math.min(Math.max(...[1, 2, 3, 4, 5, 6].map((d) => suave(k - d))), Math.max(...[1, 2, 3, 4, 5, 6].map((d) => suave(k + d)))) - suave(k);
      vales.push({ k, prof });
    }
  }
  const escolhidos = [];
  for (const v of vales.sort((x, y) => y.prof - x.prof)) {
    if (escolhidos.length >= faladas - 1) break;
    if (escolhidos.every((e) => Math.abs(e.k - v.k) >= 8)) escolhidos.push(v);
  }
  const silabas = escolhidos.length === faladas - 1 ? escolhidos.map((v) => r2(v.k * PASSO)).sort((x, y) => x - y) : undefined;
  // 5. a onda (0 a 1) da palavra, 100 valores por segundo
  const onda = [];
  for (let k = idx(a); k <= idx(b); k++) onda.push(Number(Math.pow(entre(((db[k] ?? -120) - (pico - 42)) / 42, 0, 1), 1.3).toFixed(2)));
  // 6. o áudio lento: recorte + atempo (o atempo vai de 0,5 a 2; abaixo disso, dois em cadeia)
  let nome = slug(m.palavra ?? "palavra");
  while (usados.has(nome)) nome += "-2";
  usados.add(nome);
  const filtro = ritmo >= 0.5 ? `atempo=${ritmo.toFixed(4)}` : `atempo=${Math.sqrt(ritmo).toFixed(4)},atempo=${Math.sqrt(ritmo).toFixed(4)}`;
  const saida = `public/lenta/${nome}.wav`;
  ffmpeg(["-y", "-ss", a.toFixed(3), "-t", (b - a).toFixed(3), "-i", video, "-map", "0:a:0", "-af", filtro, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", saida]);
  // entrada e saída suaves (sem estalo), feitas aqui: o ffmpeg do Remotion não tem afade
  const arq = readFileSync(saida);
  const ini16 = arq.indexOf("data", 12, "ascii") + 8;
  const quadros = Math.floor((arq.length - ini16) / 4);
  const rampa = Math.round(48000 * 0.025);
  for (let q = 0; q < quadros; q++) {
    const g = Math.min(1, q / rampa, (quadros - 1 - q) / rampa);
    if (g >= 1) continue;
    for (const c of [0, 2]) {
      const p = ini16 + q * 4 + c;
      arq.writeInt16LE(Math.round(arq.readInt16LE(p) * g), p);
    }
  }
  writeFileSync(saida, arq);

  m.lenta = { de: l.de, ate: l.ate, em, fim: r2(em + (b - a) / ritmo), ritmo: r2(ritmo), origem: [r2(a), r2(b)], ...(silabas ? { silabas } : {}), arquivo: `lenta/${nome}.wav`, onda };
  for (const k of ["ritmoPedido", "emPedido", "fimPedido"]) if (l[k] !== undefined) m.lenta[k] = l[k];
  const curto = m.ate < m.lenta.fim - 0.05 ? `  ← o momento termina em ${m.ate} s, antes da voz voltar: ponha "ate": ${m.lenta.fim} (e o momento seguinte começando aí).` : "";
  const aviso =
    natural > 0.85 && !Number.isFinite(pedido)
      ? `  ← pouca pausa depois da palavra: a câmera lenta vai cobrir ${((b - a) / ritmo - (volta - em)).toFixed(2)} s do começo da frase seguinte (a voz normal fica abaixada). Deixe mais pausa no cortes.json.`
      : "";
  console.log(
    `${m.palavra}: palavra ${a.toFixed(2)}–${b.toFixed(2)} s · repete de ${em.toFixed(2)} a ${m.lenta.fim.toFixed(2)} s · ${String(ritmo.toFixed(2)).replace(".", ",")}× · ${silabas ? `${faladas} sílabas medidas na voz` : `${faladas} sílaba(s) divididas por tamanho`} → ${saida}${aviso}${curto}`,
  );
}
gravarJson("src/plano.json", plano);
console.log("src/plano.json atualizado (campo `lenta` de cada ficha).");
