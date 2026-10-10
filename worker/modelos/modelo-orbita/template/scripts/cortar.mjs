// Passo 3 — aplica os cortes de work/cortes.json, enquadra e gera o vídeo de trabalho
// (public/base.mp4) mais o esqueleto do plano (src/plano.json), com as palavras já na
// linha do tempo cortada e o rosto/zona calculados.
//
// Uso:  node scripts/cortar.mjs --rosto-x 0.5 --rosto-y 0.32 --queixo-y 0.42 [--recorte 4:5] [--manter-plano]
//   --rosto-x / --rosto-y  centro do rosto no vídeo ORIGINAL, em frações (0 = esquerda/topo, 1 = direita/base).
//                          Meça em work/medir-*.jpg, que já vêm com a grade.
//   --queixo-y             altura do queixo no original, em fração. Com ela o script decide o recorte e
//                          põe os componentes logo abaixo do queixo.
//   --recorte              força 9:16 (quadro cheio), 3:4, 4:5 ou 1:1. Sem ela: horizontal vira 3:4; vertical
//                          fica 9:16, a não ser que o queixo esteja baixo demais (aí vira 3:4 e sobe a pessoa).
//                          Fora do 9:16 o vídeo ocupa a parte de cima e a base vira fundo escuro.
//                          (Só nos modelos verticais. Um modelo 16:9 — modelo.json { "formato": "16:9" } —
//                          entrega sempre o quadro 1920×1080: um original deitado entra inteiro.)
//   --manter-plano         refaz os cortes sem apagar momentos, marca e correções já escritos no plano
//   --sem-ajuste           usa o --rosto-x exatamente como medido (sem acertar o centro pela simetria do rosto)
//   --sem-rastro           não segue o rosto (a pessoa fica parada no enquadramento)
//
// No fim, o script segue o rosto pelo vídeo inteiro (scripts/rastrear.mjs) e grava o caminho em
// `rosto.rastro`: a caixa da pessoa acompanha o rosto quando ela se mexe. O rastreio também mede o
// centro de verdade do rosto (pela simetria); se o --rosto-x lido na grade errou, o corte é refeito
// uma vez com o rosto no centro.
import { existsSync, mkdirSync } from "node:fs";
import { argumentos, exigirProjeto, ffmpeg, ffprobe, gravarJson, lerJson, mmss } from "./comum.mjs";
import { ajustarCentro, rastrearNoPlano } from "./rastrear.mjs";

exigirProjeto();
const { opcoes } = argumentos();
const analise = lerJson("work/analise.json");
const { largura: L, altura: A } = analise;
const horizontal = L > A;
// O formato do vídeo final vem do modelo.json do template: vertical (padrão, quadro 1080×1920) ou
// { "formato": "16:9" } (quadro 1920×1080, para YouTube e aulas).
const configModelo = existsSync("modelo.json") ? lerJson("modelo.json") : {};
if (configModelo.formato !== undefined && !["9:16", "16:9"].includes(configModelo.formato)) {
  throw new Error('modelo.json: "formato" aceita "9:16" (padrão) ou "16:9".');
}
const deitado = configModelo.formato === "16:9";
const LARGURA = deitado ? 1920 : 1080;
const ALTURA = deitado ? 1080 : 1920;
const rx = Number(opcoes["rosto-x"] ?? 0.5);
const ry = Number(opcoes["rosto-y"] ?? (horizontal ? 0.4 : 0.3));
const qy = Number(opcoes["queixo-y"] ?? ry + (horizontal ? 0.16 : 0.1));
if (![rx, ry, qy].every((v) => v >= 0 && v <= 1)) throw new Error("--rosto-x, --rosto-y e --queixo-y são frações entre 0 e 1.");

// Trechos mantidos. Vizinhos com pausa natural entre eles viram um trecho só (sem corte).
const JUNTA_SE_PAUSA_MENOR = 0.3;
const segmentos = [];
lerJson("work/cortes.json").forEach((c, i) => {
  if (c.manter === false || c.ate - c.de <= 0.08) return;
  const ultimo = segmentos[segmentos.length - 1];
  const vizinho = ultimo && ultimo.indice === i - 1 && c.de - ultimo.ate < JUNTA_SE_PAUSA_MENOR;
  if (vizinho) {
    ultimo.ate = c.ate;
    ultimo.indice = i;
  } else segmentos.push({ de: c.de, ate: c.ate, indice: i });
});
if (segmentos.length === 0) throw new Error("Nenhum trecho marcado para manter em work/cortes.json.");

// Recorte: escolhe o formato e a janela do original em volta do rosto
const FORMATOS = {
  "9:16": { alvo: 9 / 16, altura: 1920 },
  "3:4": { alvo: 3 / 4, altura: 1440 },
  "4:5": { alvo: 4 / 5, altura: 1350 },
  "1:1": { alvo: 1, altura: 1080 },
};
const QUEIXO_IDEAL = 800; // px no quadro final: deixa a altura do peito livre para os componentes
// topo da cabeça estimado no original (fração): acima do centro do rosto cabe ~1,3× a distância até o queixo
const topoCabeca = Math.max(0, ry - (qy - ry) * 1.3);
// O modelo pode fixar o recorte em modelo.json (na raiz do projeto), por exemplo
// { "recorte": { "vertical": "9:16" } } em modelos que reposicionam a pessoa e não
// precisam de espaço abaixo do queixo. Sem isso: em 9:16 cheio, queixo abaixo de ~47%
// da altura empurraria os componentes para a interface do app, então vira 3:4.
const doModelo = configModelo.recorte ?? {};
const automatico = horizontal ? (doModelo.horizontal ?? "3:4") : (doModelo.vertical ?? (qy > 0.47 ? "3:4" : "9:16"));
if (deitado && opcoes.recorte && opcoes.recorte !== "16:9") console.log(`Aviso: este modelo entrega 16:9 (1920×1080); o --recorte ${opcoes.recorte} foi ignorado.`);
const escolhido = deitado ? "16:9" : (opcoes.recorte ?? automatico);
if (!deitado && !FORMATOS[escolhido]) throw new Error("--recorte aceita 9:16, 3:4, 4:5 ou 1:1.");
const { alvo, altura: videoAltura } = deitado ? { alvo: 16 / 9, altura: 1080 } : FORMATOS[escolhido];
const fps = analise.fps >= 49 ? Math.round(analise.fps / 2) : Math.round(analise.fps);

// A janela do original com o rosto em `rx` no centro (o quanto der), o vídeo de trabalho e onde o
// rosto e o queixo caem no quadro final 1080×1920.
const recortar = (rx) => {
  const larguraMaxima = Math.min(L, A * alvo);
  // a janela mais larga que ainda deixa o rosto no centro…
  let w = Math.min(2 * Math.min(rx * L, (1 - rx) * L), larguraMaxima);
  // …mas sem aproximar demais só para centralizar (perde definição)
  w = Math.floor(Math.max(w, 0.78 * larguraMaxima) / 2) * 2;
  const h = Math.min(A, Math.floor(w / alvo / 2) * 2);
  const x0 = Math.round(Math.min(L - w, Math.max(0, rx * L - w / 2)));
  // Gravação muito perto da câmera: com o queixo no lugar ideal, o topo da cabeça sairia do quadro.
  // Desce o queixo até 120 px para salvar a cabeça; mais que isso invadiria a área dos componentes,
  // e aí o corte da testa fica (o normal num vídeo de selfie; as janelas do modelo mostram a cabeça).
  const cabecaNoQuadro = ((qy - topoCabeca) * A / h) * videoAltura;
  const queixoAlvo = Math.min(Math.max(QUEIXO_IDEAL, cabecaNoQuadro + 40), QUEIXO_IDEAL + 120);
  const y0 = Math.round(Math.min(A - h, Math.max(0, qy * A - (queixoAlvo / videoAltura) * h)));
  const rosto = {
    x: Number(((rx * L - x0) / w).toFixed(3)),
    y: Number((((ry * A - y0) / h) * videoAltura / 1920).toFixed(3)),
  };
  const queixoFinal = ((qy * A - y0) / h) * videoAltura;
  const topo = Math.round(Math.min(1100, Math.max(900, queixoFinal + 170)));
  const testaCortada = cabecaNoQuadro + 40 > queixoFinal + 1;
  return { w, h, x0, y0, rosto, queixoFinal, testaCortada, zona: { topo, altura: Math.min(465, 1508 - topo) }, ampliacao: videoAltura / h };
};

// 16:9: a maior janela deitada do original (num vídeo deitado, ele inteiro), com o rosto o mais
// perto do centro que der e com respiro em cima da cabeça (rosto a ~38% da altura). O modelo faz
// os próprios enquadramentos (aproximações, pessoa de lado) com a VideoNaCaixa. A `zona` aqui é a
// faixa do terço de baixo: do queixo (com folga) até a margem de baixo.
const recortarDeitado = (rx) => {
  const w = Math.floor(Math.min(L, A * alvo) / 2) * 2;
  const h = Math.min(A, Math.floor(w / alvo / 2) * 2);
  const x0 = Math.round(Math.min(L - w, Math.max(0, rx * L - w / 2)));
  const y0 = Math.round(Math.min(A - h, Math.max(0, ry * A - 0.38 * h)));
  const rosto = {
    x: Number(((rx * L - x0) / w).toFixed(3)),
    y: Number(((ry * A - y0) / h).toFixed(3)),
  };
  const queixoFinal = ((qy * A - y0) / h) * videoAltura;
  const topo = Math.round(Math.min(860, Math.max(640, queixoFinal + 60)));
  const testaCortada = topoCabeca * A < y0 - 2;
  return { w, h, x0, y0, rosto, queixoFinal, testaCortada, zona: { topo, altura: ALTURA - 72 - topo }, ampliacao: videoAltura / h };
};
const recortarNoFormato = deitado ? recortarDeitado : recortar;

// Cada trecho entra como uma leitura separada do mesmo arquivo; o concat junta tudo.
const codificarBase = (c) => {
  const entradas = segmentos.flatMap((s) => ["-ss", String(s.de), "-t", String((s.ate - s.de).toFixed(3)), "-i", analise.origem]);
  const pares = segmentos.map((_, i) => `[${i}:v:0][${i}:a:0]`).join("");
  const montar = (tonemap) =>
    `${pares}concat=n=${segmentos.length}:v=1:a=1[v][a];[v]crop=${c.w}:${c.h}:${c.x0}:${c.y0},${tonemap}scale=${LARGURA}:${videoAltura},format=yuv420p[vo]`;
  const codificar = (grafo) => [
    "-y",
    ...entradas,
    "-filter_complex",
    grafo,
    "-map",
    "[vo]",
    "-map",
    "[a]",
    "-r",
    String(fps),
    "-c:v",
    "libx264",
    "-crf",
    "17",
    "-preset",
    "veryfast",
    "-g",
    String(fps),
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-colorspace",
    "bt709",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    "public/base.mp4",
  ];
  mkdirSync("public", { recursive: true });
  const HDR_PARA_SDR = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,";
  if (analise.hdr) {
    const r = ffmpeg(codificar(montar(HDR_PARA_SDR)), { tolerarErro: true });
    if (!r.ok) {
      console.log("Aviso: não consegui converter o HDR; as cores podem sair lavadas. Se sair, grave sem HDR.");
      ffmpeg(codificar(montar("")));
    }
  } else ffmpeg(codificar(montar("")));
};

let corte = recortarNoFormato(rx);
console.log(`Cortando ${segmentos.length} trecho(s)…`);
codificarBase(corte);

// Palavras na linha do tempo cortada
const palavras = [];
const cortesEm = [];
let deslocamento = 0;
for (const s of segmentos) {
  if (deslocamento > 0) cortesEm.push(Number(deslocamento.toFixed(2)));
  for (const p of analise.palavras) {
    const meio = (p.em + p.ate) / 2;
    if (meio < s.de || meio > s.ate) continue;
    const em = Math.max(s.de, p.em) - s.de + deslocamento;
    const ate = Math.min(s.ate, p.ate) - s.de + deslocamento;
    palavras.push({ em: Number(em.toFixed(2)), ate: Number(Math.max(ate, em + 0.06).toFixed(2)), w: p.w });
  }
  deslocamento += s.ate - s.de;
}
// palavra que encosta num trecho mantido mas ficou de fora (tempo do Whisper suspeito): avisa
const perdidas = analise.palavras.filter((p) => {
  const meio = (p.em + p.ate) / 2;
  if (segmentos.some((s) => meio >= s.de && meio <= s.ate)) return false;
  return segmentos.some((s) => Math.min(s.ate, p.ate) - Math.max(s.de, p.em) >= 0.05);
});
if (perdidas.length) {
  console.log(`Aviso: ${perdidas.length} palavra(s) na borda de um trecho mantido ficaram de fora: ${perdidas.map((p) => `"${p.w}" (${p.em.toFixed(2)} s)`).join(", ")}.`);
  console.log("Se foram ditas no trecho mantido, confira o tempo delas em work/analise.json.");
}
// a duração que vale é a do vídeo (o áudio pode sobrar alguns centésimos)
const medida = JSON.parse(ffprobe(["-v", "error", "-print_format", "json", "-show_streams", "-show_format", "public/base.mp4"]));
const faixaDeVideo = medida.streams.find((x) => x.codec_type === "video");
const duracao = Number(faixaDeVideo.duration ?? medida.format.duration);

const anterior = opcoes["manter-plano"] && existsSync("src/plano.json") ? lerJson("src/plano.json") : {};
const gravarPlano = (c) =>
  gravarJson("src/plano.json", {
    // campos próprios do modelo (zonas, largura do rosto…) passam adiante; os de baixo são recalculados
    ...anterior,
    video: "base.mp4",
    fps,
    largura: LARGURA,
    altura: ALTURA,
    duracao: Number((Math.floor(duracao * fps) / fps).toFixed(3)),
    videoAltura,
    // no 16:9 o `rosto` diz em que quadro foi medido (a VideoNaCaixa usa)
    rosto: deitado ? { ...c.rosto, quadro: { largura: LARGURA, altura: ALTURA } } : c.rosto,
    zona: c.zona,
    marca: anterior.marca ?? { nome: "", area: "" },
    sfx: anterior.sfx ?? true,
    cortesEm,
    ...(anterior.enquadramentos?.length ? { enquadramentos: anterior.enquadramentos } : {}),
    momentos: anterior.momentos ?? [],
    semLegenda: anterior.semLegenda ?? [],
    correcoes: anterior.correcoes ?? {},
    palavras,
  });
gravarPlano(corte);
gravarJson("work/palavras.json", palavras);

// Segue o rosto pelo vídeo inteiro: a caixa da pessoa acompanha quando ela se mexe.
// Se não der para confiar no rastreio, o plano fica com o rosto fixo.
if (!opcoes["sem-rastro"]) {
  console.log("\nSeguindo o rosto pelo vídeo…");
  const seguir = (c) => rastrearNoPlano({ larguraEstimada: (c.queixoFinal - c.rosto.y * ALTURA) / 0.66 / LARGURA, ajustarCentro: false });
  let r = await seguir(corte);
  // o --rosto-x lido na grade errou o centro do rosto: refaz o corte uma vez, com ele no centro
  const medido = r?.relatorio;
  if (!opcoes["sem-ajuste"] && medido?.centroPorSimetria && Math.abs(medido.centroX - corte.rosto.x) > 0.025) {
    const rxReal = Number(((corte.x0 + medido.centroX * corte.w) / L).toFixed(3));
    const novo = recortarNoFormato(rxReal);
    if (Math.abs(novo.x0 - corte.x0) >= 0.01 * corte.w || Math.abs(novo.w - corte.w) >= 0.01 * corte.w) {
      console.log(`O centro do rosto está em x ${rxReal} do original (a grade dizia ${rx}). Refazendo o corte com o rosto no centro…`);
      corte = novo;
      codificarBase(corte);
      gravarPlano(corte);
      r = await seguir(corte);
    }
  }
  // o que sobrar de diferença (o recorte não tinha para onde ir) fica acertado no plano
  if (!opcoes["sem-ajuste"]) ajustarCentro(r?.relatorio);
}
const rostoFinal = lerJson("src/plano.json").rosto;
const { queixoFinal, zona, ampliacao } = corte;

console.log(`\nVídeo de trabalho: public/base.mp4 — ${LARGURA}×${videoAltura} (recorte ${escolhido}), ${fps} fps, ${duracao.toFixed(2)} s`);
if (deitado && !horizontal) {
  console.log("Aviso: o original é vertical e este modelo entrega 16:9: o vídeo de trabalho é uma faixa deitada do original, em volta do rosto. Para a melhor imagem, grave deitado.");
}
if (ampliacao > 1.5) {
  console.log(`Aviso: o original foi ampliado ${ampliacao.toFixed(1)}× para caber; pode ficar menos nítido.`);
}
console.log(
  `Rosto no quadro: x ${rostoFinal.x}, y ${rostoFinal.y}${rostoFinal.rastro ? " (seguido quadro a quadro)" : " (fixo)"} · queixo em ${Math.round(queixoFinal)} px · zona a partir de ${zona.topo} px`,
);
if (corte.testaCortada && deitado) {
  console.log("Aviso: o topo da cabeça fica um pouco cortado no quadro 16:9 (a câmera estava baixa ou perto). As aproximações do modelo funcionam igual.");
} else if (corte.testaCortada) {
  console.log("Aviso: a gravação está bem perto da câmera; em quadro cheio o topo da cabeça fica um pouco cortado (normal em vídeo de selfie). Nas janelas e molduras do modelo a cabeça aparece inteira.");
}
if (!deitado && queixoFinal + 60 > zona.topo) {
  console.log("Aviso: o queixo ficou muito perto da zona. Tente --recorte 4:5 (ou 1:1) para subir e afastar a pessoa.");
}
console.log(`Cortes em: ${cortesEm.map(mmss).join(", ") || "nenhum"}`);
console.log("\nFala (tempo no vídeo cortado):");
let frase = [];
palavras.forEach((p, i) => {
  frase.push(p);
  const prox = palavras[i + 1];
  if (!prox || /[.?!]$/.test(p.w) || prox.em - p.ate > 0.6) {
    console.log(`${mmss(frase[0].em)} → ${mmss(p.ate)}  ${frase.map((x) => x.w).join(" ")}`);
    frase = [];
  }
});
console.log("\nO tempo exato de cada palavra está em work/palavras.json.");
console.log("Próximo passo: node scripts/stills.mjs --guias   (confere rosto, zona e legenda por cima do vídeo)");
