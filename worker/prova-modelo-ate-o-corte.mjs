// Prova local, sem custo: passos 1 a 4 do curso (projeto, preparar, justar, medir o rosto,
// cortar) com o módulo de produção. Uso:
//   node worker/prova-modelo-ate-o-corte.mjs <modelo> <video.mp4> <palavras.json> <pasta>
import { readFileSync } from "node:fs";
import { criarProjeto, preparar, justar, medirRosto, cortar, esqueletoParaEscrever } from "./src/modelo/editar-no-modelo.mjs";

const [modelo, video, arquivoPalavras, pasta] = process.argv.slice(2);
const palavras = JSON.parse(readFileSync(arquivoPalavras, "utf8"));
const t0 = Date.now();
const marca = (rotulo) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)} s] ${rotulo}`);

const projeto = criarProjeto(modelo, pasta);
marca(`projeto: ${projeto}`);
const p = await preparar(projeto, video, palavras);
marca(`preparar: ${p.cortes.length} trecho(s), ${p.cortes.filter((c) => c.manter).length} mantido(s)`);
console.log(p.saida.split("\n").slice(-25).join("\n"));
const j = await justar(projeto);
if (j) marca(`justar: ${j.trim().split("\n").slice(-2).join(" | ")}`);
const analise = JSON.parse(readFileSync(`${projeto}/work/analise.json`, "utf8"));
const medida = await medirRosto(projeto, video, analise.duracao);
marca(`rosto: x ${medida.rostoX} y ${medida.rostoY} queixo ${medida.queixoY} largura ${medida.largura} (${medida.quadros} quadros)`);
const c = await cortar(projeto, medida);
marca("cortar");
console.log(c.saida.split("\n").filter((l) => !/^\d\d:\d\d/.test(l)).join("\n"));
const e = esqueletoParaEscrever(c.plano);
console.log(JSON.stringify({ duracao: e.duracao, videoAltura: e.videoAltura, rosto: e.rosto, zona: e.zona, cortesEm: e.cortesEm, palavras: e.palavras.length }, null, 1));
