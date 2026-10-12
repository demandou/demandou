// Yap — deixa os cortes justos nas pausas reais (rode depois do preparar e antes do cortar).
//
// Uso:  node ferramentas/justar.mjs              (ajusta work/cortes.json)
//       node ferramentas/justar.mjs --respiro 0.3 (respiro total em cada corte; padrão 0.3 s no 16:9)
//
// Por quê: o preparar acha as pausas pelo ÁUDIO (silencedetect), não pela transcrição — o Whisper
// estica o começo de algumas frases para dentro do silêncio, então nunca corte pelos tempos das
// palavras. Mas a proposta dele deixa ~0,26 s de folga em cada corte, e o cortar junta de volta
// (sem cortar) dois trechos vizinhos quando a folga entre eles é menor que 0,3 s: pausas de 0,4 a
// 0,5 s ficavam inteiras. Aqui cada pausa de 0,38 s ou mais vira um corte com ~0,1 a 0,2 s de
// respiro (0,06 s antes da fala, o resto depois). Pausas menores (vírgulas) ficam como estão.
// Pode rodar de novo: ele parte sempre dos tempos originais do preparar.
//
// Versão deitada (16:9, o vídeo completo): a regra da aula 9 do curso é cortar a pausa excessiva e
// manter a respiração natural ("não acelere o ritmo como se fosse um anúncio"). O cortar do 16:9 só
// corta pausas de 0,45 s ou mais (JUNTA_SE_PAUSA_MENOR); então aqui uma pausa menor que o respiro
// mais esse limite (~0,75 s) fica inteira, e as maiores viram corte com ~0,3 s de respiro.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const ANTES = 0.1; // folgas que o preparar põe (FOLGA_ANTES / FOLGA_DEPOIS)
const DEPOIS = 0.16;
const JUNTA = 0.455; // o cortar do 16:9 junta vizinhos com menos de 0,45 s entre eles

const arg = process.argv.indexOf("--respiro");
const respiro = Math.min(0.45, Math.max(0.08, arg > 0 ? Number(process.argv[arg + 1]) : 0.3));
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
  // pausa de respiração natural: fica inteira (o cortar junta os dois trechos sem cortar)
  if (pausa < 0.38 || pausa - respiro < JUNTA) continue;
  const total = respiro;
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
console.log(linhas.join("\n") || `  nenhuma pausa de ${(respiro + JUNTA).toFixed(2).replace(".", ",")} s ou mais entre trechos mantidos.`);
console.log("Agora: node scripts/cortar.mjs --rosto-x … --rosto-y … --queixo-y …");
