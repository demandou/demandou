// Órbita — o gesto que dispara o evento, para quem tem o rastreio das mãos.
//
// Uso:  node ferramentas/gesto.mjs            (de dentro da pasta do projeto)
//
// Lê `plano.maos` (centro da palma de cada mão a cada `passo` s, em frações do quadro; -1 quando a
// mão não aparece) e, para cada evento da órbita com `gesto` ("maos-descem" ou "maos-sobem"),
// procura a partir da palavra do evento (`em`, até 0,8 s depois) o primeiro instante em que uma das
// mãos desce (ou sobe) rápido: mais de 3,6% da altura do quadro em 0,1 s. Grava esse instante em
// `gestoEm` (o Sol apaga quando as mãos caem). Sem rastreio, ou sem gesto achado, vale a palavra.
//
// Para gerar `plano.maos`: qualquer rastreador de mãos (MediaPipe Hands, Apple Vision…) que dê o
// centro da palma por quadro do vídeo de trabalho (public/base.mp4); converta para frações.
import { existsSync } from "node:fs";
import { gravarJson, lerJson } from "../scripts/comum.mjs";

if (!existsSync("src/plano.json")) {
  console.error("Rode de dentro da pasta do projeto.");
  process.exit(2);
}
const plano = lerJson("src/plano.json");
const M = plano.maos;
const LIMIAR = 70 / 1920;
const s = (t) => t.toFixed(2).replace(".", ",");
let mudou = 0;
for (const m of plano.momentos) {
  if (m.tipo !== "orbita" || !m.evento?.gesto) continue;
  const ev = m.evento;
  if (!M) {
    console.log(`Evento em ${s(ev.em)} s pede "${ev.gesto}", mas o plano não tem "maos": vale a palavra.`);
    delete ev.gestoEm;
    continue;
  }
  const passo = M.passo;
  const k3 = Math.max(1, Math.round(0.1 / passo));
  const y = (mao, i) => (i >= 0 && i < mao.y.length && mao.y[i] >= 0 ? mao.y[i] : null);
  let achou = null;
  for (let i = Math.round(ev.em / passo); i <= Math.round((ev.em + 0.8) / passo) && achou === null; i++) {
    for (const mao of [M.a, M.b]) {
      const a = y(mao, i);
      const b = y(mao, i - k3);
      if (a === null || b === null) continue;
      const d = ev.gesto === "maos-sobem" ? b - a : a - b;
      if (d > LIMIAR) {
        achou = i * passo - 0.1;
        break;
      }
    }
  }
  if (achou === null) {
    console.log(`Evento em ${s(ev.em)} s: nenhum gesto "${ev.gesto}" até ${s(ev.em + 0.8)} s; vale a palavra.`);
    delete ev.gestoEm;
  } else {
    ev.gestoEm = Number(achou.toFixed(3));
    console.log(`Evento em ${s(ev.em)} s: as mãos ${ev.gesto === "maos-sobem" ? "sobem" : "descem"} em ${s(ev.gestoEm)} s → gestoEm.`);
  }
  mudou++;
}
if (mudou) gravarJson("src/plano.json", plano);
else console.log("Nenhum evento com gesto no plano.");
