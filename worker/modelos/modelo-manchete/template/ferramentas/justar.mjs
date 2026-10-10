// Yap — deixa os cortes justos nas pausas reais (rode depois do preparar e antes do cortar).
//
// Uso:  node ferramentas/justar.mjs              (ajusta work/cortes.json)
//       node ferramentas/justar.mjs --respiro 0.2 (respiro total em cada corte; padrão 0.16 s)
//
// Por quê: o preparar acha as pausas pelo ÁUDIO (silencedetect), não pela transcrição — o Whisper
// estica o começo de algumas frases para dentro do silêncio, então nunca corte pelos tempos das
// palavras. Mas a proposta dele deixa ~0,26 s de folga em cada corte, e o cortar junta de volta
// (sem cortar) dois trechos vizinhos quando a folga entre eles é menor que 0,3 s: pausas de 0,4 a
// 0,5 s ficavam inteiras. Aqui cada pausa de 0,38 s ou mais vira um corte com ~0,1 a 0,2 s de
// respiro (0,06 s antes da fala, o resto depois). Pausas menores (vírgulas) ficam como estão.
// Pode rodar de novo: ele parte sempre dos tempos originais do preparar.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ANTES = 0.1; // folgas que o preparar põe (FOLGA_ANTES / FOLGA_DEPOIS)
const DEPOIS = 0.16;
const JUNTA = 0.305; // o cortar junta vizinhos com menos de 0,3 s entre eles

const arg = process.argv.indexOf("--respiro");
const respiro = Math.min(0.3, Math.max(0.08, arg > 0 ? Number(process.argv[arg + 1]) : 0.16));
const arquivo = "work/cortes.json";
if (!existsSync(arquivo)) {
  console.error("Rode de dentro da pasta do projeto, depois do preparar (falta work/cortes.json).");
  process.exit(2);
}
const cortes = JSON.parse(readFileSync(arquivo, "utf8"));
// tempos originais (fala + folga do preparar)
for (const c of cortes) {
  c.de0 ??= c.de;
  c.ate0 ??= c.ate;
  c.de = c.de0;
  c.ate = c.ate0;
}
const r = (v) => Math.round(v * 1000) / 1000;
const linhas = [];
for (let i = 0; i + 1 < cortes.length; i++) {
  const a = cortes[i];
  const b = cortes[i + 1];
  if (a.manter === false || b.manter === false) continue;
  const fimFala = a.ate0 - DEPOIS;
  const inicioFala = b.de0 + ANTES;
  const pausa = inicioFala - fimFala;
  if (pausa < 0.38) continue;
  // folga total que sobra no corte: o respiro pedido, ou o que dá para o cortar não juntar
  const total = pausa - respiro >= JUNTA ? respiro : Math.max(0.06, pausa - JUNTA);
  const antes = Math.min(0.06, total * 0.4);
  a.ate = r(fimFala + (total - antes));
  b.de = r(inicioFala - antes);
  linhas.push(`  ${String(i + 1).padStart(2)}→${String(i + 2).padEnd(2)} pausa ${pausa.toFixed(2)} s → respiro ${total.toFixed(2)} s   "${(a.texto ?? "").slice(-28)}" | "${(b.texto ?? "").slice(0, 28)}"`);
}
// começo: 0,06 s antes da primeira fala
const primeiro = cortes.find((c) => c.manter !== false);
if (primeiro && primeiro.de0 > 0) primeiro.de = r(Math.max(0, primeiro.de0 + ANTES - 0.06));
writeFileSync(arquivo, JSON.stringify(cortes, null, 1));
console.log(`Cortes justos (respiro ${respiro.toFixed(2)} s):`);
console.log(linhas.join("\n") || "  nenhuma pausa de 0,38 s ou mais entre trechos mantidos.");
console.log("Agora: node scripts/cortar.mjs --rosto-x … --rosto-y … --queixo-y …");
