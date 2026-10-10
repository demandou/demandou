// Ferramenta do modelo Brilho — refaz o rastro do rosto com a LARGURA DO ROSTO medida (e, se
// precisar, uma referência exata). O rastreador é o do motor (scripts/rastrear.mjs), o mesmo que o
// cortar.mjs já roda sozinho; aqui ele roda de novo com a largura certa, que também fica em
// `rostoLargura` no plano (é ela que dá o tamanho das anotações no rosto).
//
// Uso (depois do cortar.mjs, de dentro da pasta do projeto):
//   node ferramentas/rastrear-rosto.mjs --largura 0.42
//   node ferramentas/rastrear-rosto.mjs --largura 0.42 --em 6.5 --x 0.49 --y 0.25   (referência medida num quadro)
//
// O caminho vai para `rosto.rastro` no src/plano.json: as anotações (triângulo do corretivo,
// diagonal do blush, pontos de iluminador…) e a caixa da pessoa acompanham o rosto quando ela mexe
// a cabeça enquanto fala.
import { argumentos, exigirProjeto, gravarJson, lerJson } from "../scripts/comum.mjs";
import { rastrearNoPlano } from "../scripts/rastrear.mjs";

exigirProjeto();
const { opcoes } = argumentos();
const plano = lerJson("src/plano.json");
const largura = Number(opcoes.largura ?? plano.rostoLargura ?? NaN);
if (opcoes.largura !== undefined && !(largura > 0.08 && largura < 0.95)) {
  throw new Error("--largura é a largura do rosto em fração da largura do quadro (ex.: 0.42).");
}
if (opcoes.em !== undefined && (opcoes.x === undefined || opcoes.y === undefined)) {
  throw new Error("Com --em, informe também --x e --y (o centro do rosto naquele quadro, em frações).");
}
if (Number.isFinite(largura)) plano.rostoLargura = largura;
// rastro do formato antigo (fora de `rosto`): o novo substitui
delete plano.rastro;
gravarJson("src/plano.json", plano);

const rastro = await rastrearNoPlano({ largura: Number.isFinite(largura) ? largura : undefined, em: opcoes.em, x: opcoes.x, y: opcoes.y });
if (!Number.isFinite(largura)) console.log("Sem --largura: usei a largura estimada pelo queixo. Meça a largura (passo 5) e rode de novo com --largura.");
if (rastro) console.log("Confira: node scripts/stills.mjs --guias 2 6 10 14 18  (o contorno e os pontos devem cair no rosto)");
