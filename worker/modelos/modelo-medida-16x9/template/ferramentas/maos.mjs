// Opcional — leva um rastreio de mãos para o plano (`maos`), para o objeto nascer ENTRE as mãos da
// pessoa e acompanhá-las (no exemplo, a lata sai das mãos). Sem isso, o objeto nasce no "ponto de
// entrega": à altura do peito, no eixo do rosto, dentro do quadro. O motor não rastreia mãos.
//
// Uso (de dentro da pasta do projeto, depois do cortar.mjs):
//   node ferramentas/maos.mjs rastreio.json         grava plano.maos a partir do arquivo
//   node ferramentas/maos.mjs rastreio.csv          (CSV com as colunas t,x,y)
//   node ferramentas/maos.mjs --desligar            tira o rastreio (volta ao ponto de entrega)
//
// O rastreio tem que ser feito sobre public/base.mp4 (o vídeo de trabalho, já cortado), quadro a
// quadro. Formatos aceitos:
//   1. { "fps": 30, "quadros": [[x, y] | null, ...] }  — o meio entre as mãos em cada quadro
//   2. { "a": [[42 números] | null, ...], "b": [...] } — 21 pontos de cada mão por quadro (x0,y0,x1,y1…),
//      como saem do Apple Vision ou do MediaPipe Hands; usa o centro da palma das duas mãos
//   3. CSV t,x,y (segundos; um ponto por linha)
// Coordenadas em pixels do vídeo de trabalho (1920×1080 nesta versão deitada) ou em frações (0 a 1).
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const plano = JSON.parse(readFileSync("src/plano.json", "utf8"));
const arg = process.argv[2];
if (!arg) {
  console.error("Informe o arquivo do rastreio (JSON ou CSV) ou --desligar.");
  process.exit(1);
}
if (arg === "--desligar") {
  delete plano.maos;
  writeFileSync("src/plano.json", JSON.stringify(plano, null, 1));
  console.log("Rastreio das mãos retirado: o objeto nasce no ponto de entrega.");
  process.exit(0);
}
if (!existsSync(arg)) {
  console.error(`Não achei ${arg}.`);
  process.exit(1);
}

const fps = plano.fps ?? 30;
const n = Math.round(plano.duracao * fps);
const W = plano.largura ?? 1080;
const H = plano.videoAltura ?? plano.altura ?? 1920;
const fracao = (v, total) => (v > 1.5 ? v / total : v);
let pontos = new Array(n).fill(null);

if (arg.toLowerCase().endsWith(".csv")) {
  const linhas = readFileSync(arg, "utf8").trim().split(/\r?\n/);
  for (const l of linhas) {
    const [t, x, y] = l.split(/[,;]/).map(Number);
    if (![t, x, y].every(Number.isFinite)) continue;
    const i = Math.round(t * fps);
    if (i >= 0 && i < n) pontos[i] = [fracao(x, W), fracao(y, H)];
  }
} else {
  const dado = JSON.parse(readFileSync(arg, "utf8"));
  if (Array.isArray(dado.quadros)) {
    const passo = (dado.fps ?? fps) / fps;
    pontos = pontos.map((_, i) => {
      const q = dado.quadros[Math.round(i * passo)];
      return q ? [fracao(q[0], W), fracao(q[1], H)] : null;
    });
  } else if (Array.isArray(dado.a) && Array.isArray(dado.b)) {
    const palma = (f) => {
      if (!f || f.length < 42) return null;
      const ids = [0, 5, 9, 13, 17];
      return [ids.reduce((s, k) => s + f[2 * k], 0) / 5, ids.reduce((s, k) => s + f[2 * k + 1], 0) / 5];
    };
    pontos = pontos.map((_, i) => {
      const a = palma(dado.a[i]);
      const b = palma(dado.b[i]);
      const m = a && b ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] : a ?? b;
      return m ? [fracao(m[0], W), fracao(m[1], H)] : null;
    });
  } else {
    console.error("Formato não reconhecido (veja o começo deste arquivo).");
    process.exit(1);
  }
}

const r4 = (v) => Math.round(v * 10000) / 10000;
plano.maos = { passo: Number((1 / fps).toFixed(6)), x: pontos.map((p) => (p ? r4(p[0]) : null)), y: pontos.map((p) => (p ? r4(p[1]) : null)) };
writeFileSync("src/plano.json", JSON.stringify(plano, null, 1));
const ok = pontos.filter(Boolean).length;
console.log(`Mãos no plano: ${ok} de ${n} quadros (${Math.round((ok / Math.max(1, n)) * 100)}%). O objeto do momento "medida"/"objeto" nasce entre elas.`);
