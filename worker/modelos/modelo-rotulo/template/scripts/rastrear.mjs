// Parte do motor — segue o rosto no vídeo de trabalho (public/base.mp4) e grava o caminho dele em
// `rosto.rastro` no src/plano.json. Roda sozinho no fim do cortar.mjs; o VideoNaCaixa usa o rastro
// para a caixa da pessoa acompanhar o rosto quando ela se mexe (quadro cheio, janela, círculo…).
//
// Uso (só para refazer; o cortar.mjs já roda):
//   node scripts/rastrear.mjs
//   node scripts/rastrear.mjs --largura 0.42                  (largura do rosto, bochecha a bochecha, em fração do quadro)
//   node scripts/rastrear.mjs --conferir 2 6 10               (quadros com a grade e o rosto achado marcado, em out/rastro)
//   node scripts/rastrear.mjs --em 6.5 --x 0.49 --y 0.25      (referência exata medida num quadro do --conferir)
//   node scripts/rastrear.mjs --desligar                      (tira o rastro: a pessoa volta a ficar parada)
//
// Como funciona: recorta olhos e nariz num quadro de referência e procura esse recorte quadro a
// quadro (correlação normalizada, em três escalas, para a pessoa que chega perto ou se afasta), com
// busca larga logo depois de cada corte e quando perde o rosto. Sem internet e sem biblioteca extra:
// usa o ffmpeg do Remotion. Quando a correspondência fica fraca demais, aquele trecho fica parado
// (o rosto fixo de antes) — nunca segue um palpite ruim.
//
// O plano ganha, dentro de `rosto`:
//   rastro.passo        segundos entre amostras (1 quadro)
//   rastro.x / .y       centro do rosto em cada quadro (frações do quadro 1080×1920, como `rosto`)
//   rastro.cx / .cy     o caminho da "câmera": o mesmo centro sem os balanços pequenos (zona morta)
//                       e com as mudanças suavizadas. É o que a caixa da pessoa segue.
//   rastro.largura      largura do rosto (fração da largura do quadro)
//   rastro.ref          o `rosto` fixo de quando o rastro foi feito (a posição mais comum)
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { argumentos, exigirProjeto, ffmpeg, gravarJson, lerJson, lerQuadros, mmss } from "./comum.mjs";

// ---------- ajustes ----------
const LARGURA_ALVO = 64; // largura do rosto (px) na escala reduzida em que o rastreio acontece
const RAIO_LOCAL = 4; // busca quadro a quadro (px na escala reduzida)
const BOA = 0.55; // correlação a partir da qual o quadro é confiável
const ACEITA = 0.45; // abaixo disto o rosto é dado como perdido naquele quadro
const PASSO_ESCALA = 1.04;
const ESCALAS = 6; // de 1.04^-5 (0,82) a 1.04^5 (1,22) do tamanho de referência (chegar perto ou se afastar)
const ZONA_MORTA = 0.1; // em larguras de rosto: balanços menores que isso não mexem a câmera
const QUANTOS_AMOSTRAS = 12;

// ---------- utilidades numéricas ----------
const mediana = (v) => {
  if (!v.length) return NaN;
  const o = Float64Array.from(v).sort();
  const m = o.length >> 1;
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};
const percentil = (v, p) => {
  if (!v.length) return 0;
  const o = Float64Array.from(v).sort();
  return o[Math.min(o.length - 1, Math.max(0, Math.round((o.length - 1) * p)))];
};
// gaussiana que não atravessa as bordas do trecho (renormaliza o núcleo cortado)
const gaussiana = (v, sigma) => {
  if (sigma <= 0.01) return Float64Array.from(v);
  const r = Math.ceil(sigma * 3);
  const nucleo = Array.from({ length: 2 * r + 1 }, (_, k) => Math.exp(-((k - r) ** 2) / (2 * sigma * sigma)));
  const s = new Float64Array(v.length);
  for (let i = 0; i < v.length; i++) {
    let a = 0;
    let p = 0;
    for (let k = -r; k <= r; k++) {
      const j = i + k;
      if (j < 0 || j >= v.length) continue;
      a += v[j] * nucleo[k + r];
      p += nucleo[k + r];
    }
    s[i] = a / p;
  }
  return s;
};
// mediana corrida: tira balanços rápidos (menores que a janela) e mantém degraus no lugar
const medianaCorrida = (v, meia) => {
  const s = new Float64Array(v.length);
  for (let i = 0; i < v.length; i++) {
    const a = Math.max(0, i - meia);
    const b = Math.min(v.length, i + meia + 1);
    s[i] = mediana(v.subarray ? v.subarray(a, b) : v.slice(a, b));
  }
  return s;
};

// ---------- imagem ----------
const integrais = (img, L, A, soma, soma2) => {
  const L1 = L + 1;
  for (let y = 0; y < A; y++) {
    let s = 0;
    let s2 = 0;
    const linha = y * L;
    const o = (y + 1) * L1;
    const ant = y * L1;
    for (let x = 0; x < L; x++) {
      const v = img[linha + x];
      s += v;
      s2 += v * v;
      soma[o + x + 1] = soma[ant + x + 1] + s;
      soma2[o + x + 1] = soma2[ant + x + 1] + s2;
    }
  }
};
const amostra = (img, L, A, x, y) => {
  const xx = Math.min(L - 1.001, Math.max(0, x));
  const yy = Math.min(A - 1.001, Math.max(0, y));
  const x0 = Math.floor(xx);
  const y0 = Math.floor(yy);
  const fx = xx - x0;
  const fy = yy - y0;
  const i = y0 * L + x0;
  return (img[i] * (1 - fx) + img[i + 1] * fx) * (1 - fy) + (img[i + L] * (1 - fx) + img[i + L + 1] * fx) * fy;
};

// Gabarito (recorte de olhos e nariz) centrado no rosto em (cx, cy), no tamanho `fator`
const gabarito = (img, L, A, cx, cy, Wt, fator) => {
  const W = Wt * fator;
  const w = Math.max(9, Math.round(W * 0.8));
  const h = Math.max(7, Math.round(W * 0.6));
  const hx = w >> 1;
  // o recorte sobe um pouco: fica entre sobrancelhas e nariz, longe da boca (que mexe ao falar)
  const oy = Math.round(W * 0.1) + (h >> 1);
  const d = new Float32Array(w * h);
  let media = 0;
  for (let v = 0; v < h; v++)
    for (let u = 0; u < w; u++) {
      const val = amostra(img, L, A, cx - hx + u, cy - oy + v);
      d[v * w + u] = val;
      media += val;
    }
  media /= d.length;
  let norma = 0;
  for (let k = 0; k < d.length; k++) {
    d[k] -= media;
    norma += d[k] * d[k];
  }
  return { w, h, hx, oy, d, norma: Math.sqrt(norma) || 1, n: w * h };
};

// Correlação normalizada do gabarito com o quadro, com o centro do rosto no pixel (px, py)
const ncc = (q, g, px, py) => {
  const { img, L, A, soma, soma2 } = q;
  const x0 = px - g.hx;
  const y0 = py - g.oy;
  if (x0 < 0 || y0 < 0 || x0 + g.w > L || y0 + g.h > A) return -1;
  let cruz = 0;
  const d = g.d;
  for (let v = 0; v < g.h; v++) {
    const linha = (y0 + v) * L + x0;
    const base = v * g.w;
    for (let u = 0; u < g.w; u++) cruz += img[linha + u] * d[base + u];
  }
  const L1 = L + 1;
  const a = y0 * L1 + x0;
  const b = (y0 + g.h) * L1 + x0;
  const s = soma[b + g.w] - soma[b] - soma[a + g.w] + soma[a];
  const s2 = soma2[b + g.w] - soma2[b] - soma2[a + g.w] + soma2[a];
  const variancia = s2 - (s * s) / g.n;
  // região lisa (parede, fundo estourado): não é rosto
  if (variancia < g.n * 9) return -1;
  return cruz / (Math.sqrt(variancia) * g.norma);
};

// ---------- o centro de verdade (simetria) ----------
// O rosto de frente é espelhado: em volta do centro de verdade, o lado esquerdo é o reflexo do
// direito. Num quadro só isso engana (luz de um lado, cabeça virada, cada lente dos óculos também
// é simétrica), então o perfil de simetria é somado ao longo do vídeo, em posições relativas ao
// recorte que o rastreio segue, e o centro é achado pela "trinca": o pico do centro e os dois picos
// dos olhos (cada olho é simétrico em volta de si mesmo), a ~0,23 largura de rosto para cada lado.
const PERFIL_DE = -0.6;
const PERFIL_PASSO = 0.025;
const PERFIL_N = 49; // de -0,6 a +0,6 larguras de rosto
const novoPerfil = () => ({ soma: new Float64Array(PERFIL_N), cont: new Float64Array(PERFIL_N), n: 0 });
const somarPerfil = (perfil, img, L, A, cx, cy, W) => {
  // recorte local com passa-alta (tira o sombreado e deixa olhos, sobrancelhas, óculos, nariz)
  const raio = Math.max(2, Math.round(W * 0.08));
  // (perto da borda do quadro, só os eixos que cabem contam)
  const x0 = Math.max(0, Math.round(cx - 1.05 * W) - raio);
  const x1 = Math.min(L - 1, Math.round(cx + 1.05 * W) + raio);
  const y0 = Math.max(0, Math.round(cy - 0.5 * W) - raio);
  const y1 = Math.min(A - 1, Math.round(cy + 0.25 * W) + raio);
  if (x1 - x0 < W || y1 - y0 < 0.4 * W) return;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const ii = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = 0; x < w; x++) {
      s += img[(y0 + y) * L + x0 + x];
      ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1] + s;
    }
  }
  const pa = new Float32Array(w * h);
  for (let y = raio; y < h - raio; y++)
    for (let x = raio; x < w - raio; x++) {
      const a = (y - raio) * (w + 1) + (x - raio);
      const b = (y + raio + 1) * (w + 1) + (x - raio);
      const m = (ii[b + 2 * raio + 1] - ii[b] - ii[a + 2 * raio + 1] + ii[a]) / ((2 * raio + 1) ** 2);
      pa[y * w + x] = img[(y0 + y) * L + x0 + x] - m;
    }
  const ccx = cx - x0;
  const yA = raio;
  const yB = h - raio - 1;
  const nota = (eixo, hw) => {
    const a2 = Math.round(2 * eixo);
    const xl0 = a2 % 2 === 0 ? a2 / 2 - 1 : (a2 - 1) / 2;
    const xr0 = a2 % 2 === 0 ? a2 / 2 + 1 : (a2 + 1) / 2;
    if (xl0 - hw + 1 < raio || xr0 + hw - 1 >= w - raio) return null;
    let sl = 0;
    let sr = 0;
    let sll = 0;
    let srr = 0;
    let slr = 0;
    let n = 0;
    for (let y = yA; y <= yB; y++) {
      const linha = y * w;
      for (let j = 0; j < hw; j++) {
        const l = pa[linha + xl0 - j];
        const r = pa[linha + xr0 + j];
        sl += l;
        sr += r;
        sll += l * l;
        srr += r * r;
        slr += l * r;
        n++;
      }
    }
    const vl = sll - (sl * sl) / n;
    const vr = srr - (sr * sr) / n;
    return vl > n && vr > n ? (slr - (sl * sr) / n) / Math.sqrt(vl * vr) : 0;
  };
  for (let k = 0; k < PERFIL_N; k++) {
    const eixo = ccx + (PERFIL_DE + k * PERFIL_PASSO) * W;
    const notas = [0.2, 0.3, 0.4].map((h) => nota(eixo, Math.round(h * W)));
    if (notas.some((v) => v === null)) continue;
    perfil.soma[k] += (notas[0] + notas[1] + notas[2]) / 3;
    perfil.cont[k]++;
  }
  perfil.n++;
};
// Devolve o deslocamento do centro de verdade em relação ao recorte seguido (em larguras de rosto)
const centroDoPerfil = (perfil) => {
  if (perfil.n < 10) return null;
  // eixo sem amostras suficientes (fora do quadro) não conta a favor
  const p = Array.from(perfil.soma, (v, k) => (perfil.cont[k] >= perfil.n * 0.3 ? v / perfil.cont[k] : 0));
  const P = (d) => {
    const x = (d - PERFIL_DE) / PERFIL_PASSO;
    const i = Math.floor(x);
    if (i < 0 || i >= PERFIL_N - 1) return 0;
    return p[i] + (p[i + 1] - p[i]) * (x - i);
  };
  let melhor = { c: 0, v: -Infinity };
  for (let c = -0.35; c <= 0.3501; c += 0.0125) {
    let olhos = -Infinity;
    for (let e = 0.18; e <= 0.2801; e += 0.0125) olhos = Math.max(olhos, Math.min(P(c - e), P(c + e)));
    const v = P(c) + 2 * olhos;
    if (v > melhor.v) melhor = { c, v };
  }
  if (melhor.v < 0.45) return null;
  // o centro também precisa ser o pico de simetria mais forte da vizinhança (um padrão de três picos
  // montado com o cabelo, a armação ou o fundo não passa)
  let pico = { d: melhor.c, v: -Infinity };
  for (let d = melhor.c - 0.3; d <= melhor.c + 0.3001; d += 0.0125) if (P(d) > pico.v) pico = { d, v: P(d) };
  return pico.v >= 0.35 && Math.abs(pico.d - melhor.c) <= 0.075 ? melhor : null;
};

const buscar = (q, g, cx, cy, raio, passo) => {
  let melhor = { x: Math.round(cx), y: Math.round(cy), v: -2 };
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  for (let dy = -raio; dy <= raio; dy += passo)
    for (let dx = -raio; dx <= raio; dx += passo) {
      const v = ncc(q, g, x0 + dx, y0 + dy);
      if (v > melhor.v) melhor = { x: x0 + dx, y: y0 + dy, v };
    }
  return melhor;
};

// refinamento abaixo do pixel: parábola pelos vizinhos
const refinar = (q, g, m) => {
  const c = m.v;
  const e = ncc(q, g, m.x - 1, m.y);
  const d = ncc(q, g, m.x + 1, m.y);
  const s = ncc(q, g, m.x, m.y - 1);
  const b = ncc(q, g, m.x, m.y + 1);
  const ox = e > -1 && d > -1 && e + d - 2 * c < 0 ? (e - d) / (2 * (e + d - 2 * c)) : 0;
  const oy = s > -1 && b > -1 && s + b - 2 * c < 0 ? (s - b) / (2 * (s + b - 2 * c)) : 0;
  return { x: m.x + Math.max(-0.5, Math.min(0.5, ox)), y: m.y + Math.max(-0.5, Math.min(0.5, oy)), v: c };
};

// ---------- o caminho da câmera ----------
// Dentro de cada trecho (entre cortes) a câmera fica parada enquanto o rosto balança dentro da zona
// morta. Quando ele sai dela e fica fora (a pessoa se inclinou, mudou de lugar), a câmera faz um
// reenquadramento suave até onde a pessoa vai ficar e para de novo — como um operador de câmera,
// sem ficar "nadando" atrás de cada movimento. Em cada corte a câmera recomeça já no lugar certo.
const suaveSeno = (p) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, p)));
const caminhoDaCamera = (xs, ys, fps, W) => {
  const n = xs.length;
  const cx = new Float64Array(n);
  const cy = new Float64Array(n);
  // mediana corrida longa (~2,5 s, centrada): balanços e gestos somem; uma mudança de lugar que
  // dura aparece no instante certo em que aconteceu
  const meia = Math.max(2, Math.round(fps * 1.25));
  const mx = medianaCorrida(xs, meia);
  const my = medianaCorrida(ys, meia);
  const trecho = (de, ate) => ({ x: mediana(mx.subarray(de, ate)), y: mediana(my.subarray(de, ate)) });
  if (n < Math.round(fps * 1.5)) {
    const m = { x: mediana(xs), y: mediana(ys) };
    return { cx: cx.fill(m.x), cy: cy.fill(m.y) };
  }
  // zona morta: elipse um pouco mais larga que alta (balançar para os lados é o mais comum)
  const zx = ZONA_MORTA * W;
  const zy = ZONA_MORTA * 0.8 * W;
  const fora = (i, h) => Math.hypot((mx[i] - h.x) / zx, (my[i] - h.y) / zy) > 1;
  const insiste = Math.round(fps * 0.4); // tempo fora da zona antes de reenquadrar
  const olhar = Math.round(fps * 1.0); // para onde a pessoa foi: mediana do próximo segundo
  let h = trecho(0, Math.min(n, Math.round(fps)));
  let i = 0;
  let foraHa = 0;
  while (i < n) {
    cx[i] = h.x;
    cy[i] = h.y;
    foraHa = fora(i, h) ? foraHa + 1 : 0;
    if (foraHa >= insiste && i < n - 2) {
      // começa do instante em que a pessoa saiu da zona (sem atraso de "reação")
      const inicio = Math.max(0, i - foraHa + 1);
      const alvo = trecho(i, Math.min(n, i + olhar));
      const dist = Math.hypot(alvo.x - h.x, alvo.y - h.y);
      const dur = Math.max(1, Math.round(fps * Math.min(1.2, Math.max(0.6, 0.45 + dist / (2 * W)))));
      for (let j = 1; j <= dur && inicio + j < n; j++) {
        const p = suaveSeno(j / dur);
        cx[inicio + j] = h.x + (alvo.x - h.x) * p;
        cy[inicio + j] = h.y + (alvo.y - h.y) * p;
      }
      h = alvo;
      i = inicio + dur + 1;
      foraHa = 0;
      continue;
    }
    i++;
  }
  return { cx, cy };
};

// ---------- rastreio ----------
// Devolve { rastro, relatorio } ou { rastro: null, relatorio } quando não dá para confiar.
export const rastrearRosto = async (plano, opcoes = {}) => {
  const fps = plano.fps;
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const arquivo = path.join("public", plano.video ?? "base.mp4");
  if (!existsSync(arquivo)) throw new Error(`Não achei ${arquivo}. Rode o cortar.mjs antes.`);
  const rostoFixo = { x: plano.rosto.x, y: plano.rosto.y };

  // largura do rosto em fração da largura do quadro: medida > rastro anterior > estimada pelo queixo
  let largura = Number(opcoes.largura ?? plano.rostoLargura ?? plano.rosto.rastro?.largura ?? opcoes.larguraEstimada ?? NaN);
  if (!Number.isFinite(largura) && plano.zona?.topo) {
    const queixo = plano.zona.topo - 170;
    largura = (queixo - plano.rosto.y * 1920) / 0.66 / 1080;
  }
  if (!Number.isFinite(largura)) largura = 0.36;
  largura = Math.min(0.75, Math.max(0.14, largura));

  // escala reduzida: o rosto fica com ~64 px de largura
  const L = Math.round(Math.min(400, Math.max(110, (1080 * LARGURA_ALVO) / (largura * 1080))));
  const A = Math.round((L * H0) / 1080);
  const f = 1080 / L; // px do quadro 1080 por px da escala reduzida
  const Wt = (largura * 1080) / f;
  const filtro = ["-an", "-vf", `scale=${L}:${A}:flags=area,format=gray`];
  const bytes = L * A;
  const novoQuadro = () => ({ img: new Uint8Array(bytes), L, A, soma: new Float64Array((L + 1) * (A + 1)), soma2: new Float64Array((L + 1) * (A + 1)) });
  const preparar = (q) => integrais(q.img, L, A, q.soma, q.soma2);
  // rosto (frações do plano) ↔ px na escala reduzida
  const paraPx = (r) => ({ x: (r.x * 1080) / f, y: (r.y * 1920) / f });
  const paraFracao = (p) => ({ x: (p.x * f) / 1080, y: (p.y * f) / 1920 });

  // 1. Referência: entre alguns quadros espalhados, o recorte em volta de `rosto` que mais se
  // parece com os outros (a aparência mais comum do rosto). Com --em/--x/--y, o quadro medido.
  const duracao = plano.duracao;
  const tempos =
    opcoes.em !== undefined
      ? [Number(opcoes.em)]
      : Array.from({ length: QUANTOS_AMOSTRAS }, (_, k) => Math.min(duracao - 0.1, 0.25 + ((duracao - 0.5) * (k + 0.5)) / QUANTOS_AMOSTRAS));
  const amostras = [];
  for (const t of tempos) {
    const q = novoQuadro();
    await lerQuadros(["-ss", t.toFixed(3), "-i", arquivo, "-frames:v", "1", ...filtro], bytes, (b) => q.img.set(b));
    preparar(q);
    amostras.push({ t, q });
  }
  // --x/--y são frações da imagem do vídeo de trabalho (a grade do --conferir); `rosto.y` é fração de 1920
  const refRosto = opcoes.em !== undefined ? { x: Number(opcoes.x ?? rostoFixo.x), y: opcoes.y !== undefined ? (Number(opcoes.y) * H0) / 1920 : rostoFixo.y } : rostoFixo;
  const pRef = paraPx(refRosto);
  // 2. Cortes: o quadro exato de cada corte é o de maior diferença perto do tempo anotado
  const cortesNominais = (plano.cortesEm ?? []).map((c) => Math.round(c * fps));
  const pertoDeCorte = new Set(cortesNominais.flatMap((c) => [c - 2, c - 1, c, c + 1, c + 2]));

  const K0 = ESCALAS - 1;
  const kMin = 0;
  const kMax = 2 * ESCALAS - 2;

  // 3. Segue o rosto quadro a quadro, a partir do recorte de referência em volta de p0
  const passada = async (p0) => {
    let escolhida = amostras[0];
    if (amostras.length > 1) {
      let melhor = -Infinity;
      for (const a of amostras) {
        const g = gabarito(a.q.img, L, A, p0.x, p0.y, Wt, 1);
        const notas = amostras.filter((b) => b !== a).map((b) => buscar(b.q, g, p0.x, p0.y, Math.round(Wt * 0.35), 1).v);
        const nota = mediana(notas);
        if (nota > melhor) {
          melhor = nota;
          escolhida = a;
        }
      }
    }
    const banco = Array.from({ length: 2 * ESCALAS - 1 }, (_, k) => gabarito(escolhida.q.img, L, A, p0.x, p0.y, Wt, PASSO_ESCALA ** (k - K0)));

    // 3. Segue o rosto quadro a quadro
    const X = [];
    const Y = [];
    const C = [];
    const S = [];
    const diferenca = [];
    let pos = { ...p0 };
    let k = K0;
    let perdido = 0;
    let anterior = null;
    let ultimoBom = null;
    const q = novoQuadro();
    const sub = new Uint8Array(bytes);
    const perfil = novoPerfil();

    const buscaLarga = (centros, raio, ks) => {
      let m = { v: -2 };
      for (const c of centros)
        for (const kk of ks) {
          const g = banco[kk];
          const r = buscar(q, g, c.x, c.y, raio, 2);
          if (r.v > m.v) m = { ...r, k: kk };
        }
      if (m.v > -2) {
        const r = buscar(q, banco[m.k], m.x, m.y, 2, 1);
        if (r.v >= m.v) m = { ...r, k: m.k };
      }
      return m;
    };
    const buscaGlobal = () => {
      let m = { v: -2 };
      for (const kk of [k - 3, k, k + 3].filter((x) => x >= kMin && x <= kMax)) {
        const g = banco[kk];
        for (let y = g.oy; y < A - (g.h - g.oy); y += 3)
          for (let x = g.hx; x < L - (g.w - g.hx); x += 3) {
            const v = ncc(q, g, x, y);
            if (v > m.v) m = { x, y, v, k: kk };
          }
      }
      if (m.v > -2) {
        const r = buscar(q, banco[m.k], m.x, m.y, 3, 1);
        if (r.v >= m.v) m = { ...r, k: m.k };
      }
      return m;
    };

    const total = await lerQuadros(["-i", arquivo, ...filtro], bytes, (b, i) => {
      q.img.set(b);
      preparar(q);
      // diferença média com o quadro anterior (acha o quadro exato dos cortes)
      if (anterior) {
        let d = 0;
        for (let j = 0; j < bytes; j += 3) d += Math.abs(q.img[j] - anterior[j]);
        diferenca.push(d / (bytes / 3));
      } else diferenca.push(0);
      sub.set(q.img);
      anterior = sub;

      const reacha = i === 0 || pertoDeCorte.has(i);
      let m = { v: -2 };
      if (!reacha) {
        // busca local na escala atual e confere as vizinhas no melhor ponto
        const r = buscar(q, banco[k], pos.x, pos.y, RAIO_LOCAL, 1);
        m = { ...r, k };
        for (const kk of [k - 1, k + 1]) {
          if (kk < kMin || kk > kMax) continue;
          const r2 = buscar(q, banco[kk], r.x, r.y, 1, 1);
          // o tamanho do rosto muda devagar: só troca de escala com ganho claro
          if (r2.v > m.v + 0.01) m = { ...r2, k: kk };
        }
      }
      if (reacha || m.v < BOA) {
        const centros = [pos, p0];
        const ks = [k - 2, k - 1, k, k + 1, k + 2].filter((x) => x >= kMin && x <= kMax);
        const r = buscaLarga(centros, Math.round(Wt * 0.6), ks);
        if (r.v > m.v) m = r;
      }
      if (m.v < ACEITA && (reacha || perdido % 6 === 0)) {
        const r = buscaGlobal();
        if (r.v > m.v) m = r;
      }
      // dentro de um trecho o rosto não teletransporta: um "achado" longe demais do último lugar
      // bom (um reflexo, a luz do espelho, outra cara) é recusado, a não ser que seja muito forte
      if (m.v >= ACEITA && !reacha && ultimoBom) {
        const Wk = Wt * PASSO_ESCALA ** (k - K0);
        const parado = (i - ultimoBom.i) / fps;
        const limite = Wk * (0.3 + 0.8 * parado);
        const longe = Math.hypot(m.x - ultimoBom.x, m.y - ultimoBom.y) > limite;
        // perdido há muito tempo (a pessoa saiu e voltou): só aceita um achado forte
        const forte = m.v >= 0.8 || (parado > 1.5 && m.v >= 0.7);
        if (longe && !forte) m = { ...m, v: Math.min(m.v, ACEITA - 0.01) };
      }
      if (m.v >= ACEITA) {
        const r = refinar(q, banco[m.k], m);
        pos = { x: r.x, y: r.y };
        k = m.k;
        perdido = 0;
        if (m.v >= BOA) ultimoBom = { x: pos.x, y: pos.y, i };
      } else perdido++;
      X.push(pos.x);
      Y.push(pos.y);
      C.push(Math.max(-1, m.v));
      S.push(k);
      // de vez em quando, soma o perfil de simetria em volta do recorte seguido (dá o centro de verdade)
      if (m.v >= 0.65 && i % Math.max(1, Math.round(fps / 5)) === 0) somarPerfil(perfil, q.img, L, A, pos.x, pos.y, Wt * PASSO_ESCALA ** (k - K0));
    });
    return { X, Y, C, S, perfil, diferenca, total, escolhida };
  };
  // primeira passada em volta do rosto medido; se a simetria mostra que a medida errou o centro,
  // uma segunda passada com o recorte já centrado no rosto (o rastreio fica mais firme)
  // (a segunda passada precisa confirmar o centro; se não confirmar, vale a medida do aluno)
  let resultado = await passada(pRef);
  let centro = null;
  if (opcoes.em === undefined) {
    const c1 = centroDoPerfil(resultado.perfil);
    if (c1 && Math.abs(c1.c) <= 0.08) centro = c1;
    else if (c1) {
      const segunda = await passada({ x: pRef.x + c1.c * Wt, y: pRef.y });
      const c2 = centroDoPerfil(segunda.perfil);
      if (c2 && Math.abs(c2.c) <= 0.05) {
        resultado = segunda;
        centro = c2;
      }
    }
  }
  const { X, Y, C, S, perfil, diferenca, total, escolhida } = resultado;
  if (total === 0) throw new Error("Não consegui ler os quadros do vídeo.");

  // 4. Trechos entre cortes (no quadro exato do corte)
  const cortes = cortesNominais
    .map((c) => {
      let melhor = c;
      for (let j = c - 2; j <= c + 2; j++) if (j > 0 && j < total && diferenca[j] > (diferenca[melhor] ?? -1)) melhor = j;
      return melhor;
    })
    .filter((c) => c > 0 && c < total);
  const limites = [0, ...new Set(cortes), total].sort((a, b) => a - b);
  const trechos = [];
  for (let j = 0; j < limites.length - 1; j++) if (limites[j + 1] > limites[j]) trechos.push({ de: limites[j], ate: limites[j + 1] });

  // 5. Quadros fracos: some do caminho (interpolado entre os vizinhos bons do mesmo trecho).
  // Trecho com pouca coisa confiável fica parado.
  const bom = C.map((c) => c >= ACEITA + 0.05);
  const fx = new Float64Array(total);
  const fy = new Float64Array(total);
  for (let i = 0; i < total; i++) {
    const p = paraFracao({ x: X[i], y: Y[i] });
    fx[i] = p.x;
    fy[i] = p.y;
  }
  // escapadas curtas (o rastreio pulou para outra coisa e voltou): longe da mediana corrida de
  // ~1 s do próprio trecho, saem do caminho
  for (const t of trechos) {
    const idx = [];
    for (let i = t.de; i < t.ate; i++) if (bom[i]) idx.push(i);
    if (idx.length < 5) continue;
    const xs = Float64Array.from(idx, (i) => X[i]);
    const ys = Float64Array.from(idx, (i) => Y[i]);
    const meia = Math.max(2, Math.round(fps * 0.5));
    const mx = medianaCorrida(xs, meia);
    const my = medianaCorrida(ys, meia);
    idx.forEach((i, j) => {
      if (Math.hypot(xs[j] - mx[j], ys[j] - my[j]) > Wt * PASSO_ESCALA ** (S[i] - K0) * 0.3) bom[i] = false;
    });
    // quem fala para a câmera quase não sobe nem desce mais que ~meio rosto: um trecho do caminho
    // muito acima ou abaixo do resto do trecho é engano (cabelo, objeto, outra coisa)
    const meioY = mediana(ys);
    idx.forEach((i, j) => {
      if (Math.abs(ys[j] - meioY) > Wt * 0.7) bom[i] = false;
    });
  }
  const validos = [];
  for (const t of trechos) {
    const idx = [];
    for (let i = t.de; i < t.ate; i++) if (bom[i]) idx.push(i);
    t.confiavel = idx.length >= (t.ate - t.de) * 0.6 && idx.length >= 3;
    if (!t.confiavel) continue;
    validos.push(...idx);
    let ultimo = -1;
    for (let i = t.de; i < t.ate; i++) {
      if (bom[i]) {
        if (ultimo >= 0 && i - ultimo > 1)
          for (let j = ultimo + 1; j < i; j++) {
            const a = (j - ultimo) / (i - ultimo);
            fx[j] = fx[ultimo] + (fx[i] - fx[ultimo]) * a;
            fy[j] = fy[ultimo] + (fy[i] - fy[ultimo]) * a;
          }
        else if (ultimo < 0) for (let j = t.de; j < i; j++) ((fx[j] = fx[i]), (fy[j] = fy[i]));
        ultimo = i;
      }
    }
    for (let j = ultimo + 1; j < t.ate; j++) ((fx[j] = fx[ultimo]), (fy[j] = fy[ultimo]));
  }

  const confiaveis = validos.length / total;
  if (process.env.RASTRO_DEPURAR) gravarJson("work/rastro-depurar.json", { L, A, f, Wt, X, Y, C, S, perfil: Array.from(perfil.soma, (v, k) => (perfil.cont[k] ? v / perfil.cont[k] : 0)), cortes, referencia: escolhida.t });
  const relatorio = {
    quadros: total,
    confiaveis,
    trechos: trechos.length,
    trechosParados: trechos.filter((t) => !t.confiavel).map((t) => [t.de / fps, t.ate / fps]),
    largura,
    escalaReferencia: escolhida.t,
  };
  if (confiaveis < 0.6) return { rastro: null, relatorio };

  // 6. Posição absoluta. O recorte de referência foi tirado em volta do `rosto` medido, que pode
  // ter errado um pouco. Na horizontal, o eixo de simetria do rosto dá o centro de verdade; na
  // vertical (e sem simetria confiável), a posição mais comum do caminho é o `rosto` medido.
  // Com --em/--x/--y, vale o ponto medido naquele quadro.
  let dx;
  let dy;
  relatorio.simetria = { amostras: perfil.n, nota: centro?.v ?? null };
  // o deslocamento é do recorte seguido, no tamanho mais comum do rosto
  const escalaComum = mediana(validos.map((i) => PASSO_ESCALA ** (S[i] - K0)));
  const deslocamento = centro ? (centro.c * Wt * escalaComum * f) / 1080 : 0;
  if (opcoes.em !== undefined) {
    const iRef = Math.min(total - 1, Math.max(0, Math.round(Number(opcoes.em) * fps)));
    dx = refRosto.x - fx[iRef];
    dy = refRosto.y - fy[iRef];
  } else {
    dy = rostoFixo.y - mediana(validos.map((i) => fy[i]));
    if (centro) {
      for (let i = 0; i < total; i++) fx[i] += deslocamento;
      dx = 0;
    } else dx = rostoFixo.x - mediana(validos.map((i) => fx[i]));
  }
  relatorio.centroX = mediana(validos.map((i) => fx[i] + dx));
  relatorio.centroPorSimetria = !!centro;

  // 7. Caminho fino (para o que fica em cima do rosto) e caminho da câmera (para a caixa)
  const ox = new Float64Array(total);
  const oy = new Float64Array(total);
  const cx = new Float64Array(total);
  const cy = new Float64Array(total);
  const larguraPx = largura * 1080;
  for (const t of trechos) {
    const n = t.ate - t.de;
    if (!t.confiavel) {
      for (let i = t.de; i < t.ate; i++) ((ox[i] = cx[i] = rostoFixo.x), (oy[i] = cy[i] = rostoFixo.y));
      continue;
    }
    // em px do quadro 1080×1920 (as duas direções na mesma medida)
    const px = new Float64Array(n);
    const py = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      px[j] = (fx[t.de + j] + dx) * 1080;
      py[j] = (fy[t.de + j] + dy) * 1920;
    }
    const fino = { x: gaussiana(medianaCorrida(px, 2), fps * 0.05), y: gaussiana(medianaCorrida(py, 2), fps * 0.05) };
    const cam = caminhoDaCamera(fino.x, fino.y, fps, larguraPx);
    for (let j = 0; j < n; j++) {
      ox[t.de + j] = fino.x[j] / 1080;
      oy[t.de + j] = fino.y[j] / 1920;
      cx[t.de + j] = cam.cx[j] / 1080;
      cy[t.de + j] = cam.cy[j] / 1920;
    }
  }

  const r4 = (v) => Number(v.toFixed(4));
  const lista = (v) => Array.from(v, r4);
  const rastro = {
    passo: Number((1 / fps).toFixed(6)),
    largura: Number(largura.toFixed(3)),
    ref: { ...rostoFixo },
    x: lista(ox),
    y: lista(oy),
    cx: lista(cx),
    cy: lista(cy),
  };
  // quanto a pessoa e a câmera andam em volta da posição mais comum (para o relatório)
  const comumX = mediana(ox);
  const comumY = mediana(oy);
  relatorio.movimento = {
    x: percentil(Array.from(cx, (v) => Math.abs(v - comumX) * 1080), 0.98),
    y: percentil(Array.from(cy, (v) => Math.abs(v - comumY) * 1920), 0.98),
    rostoX: percentil(Array.from(ox, (v) => Math.abs(v - comumX) * 1080), 0.98),
    rostoY: percentil(Array.from(oy, (v) => Math.abs(v - comumY) * 1920), 0.98),
  };
  relatorio.confianca = { mediana: mediana(C), p10: percentil(C, 0.1) };
  return { rastro, relatorio };
};

// Dentro do cortar: o centro de verdade (medido pela simetria do rosto) passa a ser o `rosto` do plano
export const ajustarCentro = (relatorio) => {
  const plano = lerJson("src/plano.json");
  if (!relatorio?.centroPorSimetria || !plano.rosto?.rastro || Math.abs(relatorio.centroX - plano.rosto.x) <= 0.01) return;
  const novo = Number(relatorio.centroX.toFixed(3));
  console.log(`Centro do rosto no quadro conferido pela simetria: x ${plano.rosto.x} → ${novo}.`);
  plano.rosto.x = novo;
  plano.rosto.rastro.ref.x = novo;
  gravarJson("src/plano.json", plano);
};

// Roda o rastreio e grava no plano. Nunca derruba quem chamou: se der errado, o rosto fica fixo.
export const rastrearNoPlano = async (opcoes = {}) => {
  const plano = lerJson("src/plano.json");
  const semRastro = () => {
    const { rastro, ...resto } = plano.rosto ?? {};
    return resto;
  };
  if (opcoes.desligar) {
    plano.rosto = semRastro();
    gravarJson("src/plano.json", plano);
    console.log("Rastro do rosto desligado: a pessoa fica parada no enquadramento (como o rosto fixo do plano).");
    return null;
  }
  const inicio = Date.now();
  let resultado;
  try {
    resultado = await rastrearRosto(plano, opcoes);
  } catch (e) {
    plano.rosto = semRastro();
    gravarJson("src/plano.json", plano);
    console.log(`Aviso: não consegui seguir o rosto (${e.message.split("\n")[0]}). A pessoa fica no enquadramento fixo.`);
    return null;
  }
  const { rastro, relatorio: r } = resultado;
  r.rostoAntes = plano.rosto.x;
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  if (!rastro) {
    plano.rosto = semRastro();
    gravarJson("src/plano.json", plano);
    console.log(
      `Rosto: só ${Math.round(r.confiaveis * 100)}% dos quadros com o rosto bem encontrado — mantive o enquadramento fixo (a caixa não segue o rosto).`,
    );
    console.log("Se o rosto está visível e de frente, meça o centro num quadro de guias e rode: node scripts/rastrear.mjs --em <s> --x <fração> --y <fração>");
    return null;
  }
  plano.rosto = { ...semRastro(), rastro };
  gravarJson("src/plano.json", plano);
  // o centro de verdade (simetria do rosto) passa a ser o `rosto` do plano (o cortar decide antes
  // se vale refazer o recorte, por isso pede para não ajustar aqui)
  if (opcoes.ajustarCentro !== false) ajustarCentro(r);
  const m = r.movimento;
  console.log(
    `Rosto seguido em ${r.quadros} quadros (${segundos} s): ${Math.round(r.confiaveis * 100)}% confiáveis · a pessoa se mexe até ~${Math.round(m.rostoX)} px na horizontal e ~${Math.round(m.rostoY)} px na vertical; a caixa da pessoa acompanha.`,
  );
  if (r.trechosParados.length) {
    console.log(
      `Aviso: trecho(s) sem rosto confiável ficam com o enquadramento fixo: ${r.trechosParados.map(([a, b]) => `${mmss(a)}–${mmss(b)}`).join(", ")}.`,
    );
  }
  if (opcoes.ajustarCentro !== false && r.centroPorSimetria && Math.abs(r.centroX - (r.rostoAntes ?? r.centroX)) > 0.03) {
    console.log("Para o recorte também centralizar o rosto, rode o cortar.mjs de novo (com --manter-plano): ele refaz o corte com o centro certo.");
  }
  return { rastro, relatorio: r };
};

// Quadros do vídeo de trabalho com a grade (a mesma do medir-*.jpg) e o rosto achado pelo rastreio
// marcado: confere o rastro e serve para medir uma referência exata (--em/--x/--y).
const conferir = async (tempos) => {
  const plano = lerJson("src/plano.json");
  const H0 = Math.min(1920, plano.videoAltura ?? 1920);
  const r = plano.rosto.rastro;
  const { bundle } = await import("@remotion/bundler");
  const { renderStill, selectComposition } = await import("@remotion/renderer");
  const altura = 960;
  const largura = Math.round(((1080 / H0) * altura) / 2) * 2;
  const lista = tempos.length ? tempos : [0.1, 0.3, 0.5, 0.7, 0.9].map((f) => plano.duracao * f);
  mkdirSync("public/medir", { recursive: true });
  mkdirSync("out/rastro", { recursive: true });
  lista.forEach((t, i) =>
    ffmpeg(["-y", "-ss", t.toFixed(3), "-i", path.join("public", plano.video ?? "base.mp4"), "-frames:v", "1", "-vf", `scale=${largura}:${altura}`, `public/medir/rastro-${i}.jpg`]),
  );
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
  try {
    for (const [i, t] of lista.entries()) {
      const pos = (v) => {
        const p = Math.max(0, Math.min(v.length - 1, t / r.passo));
        const a = Math.floor(p);
        const b = Math.min(v.length - 1, a + 1);
        return v[a] + (v[b] - v[a]) * (p - a);
      };
      const pontos = [{ x: plano.rosto.x, y: (plano.rosto.y * 1920) / H0, rotulo: "fixo", cor: "#FF3BD4" }];
      if (r) pontos.push({ x: pos(r.x), y: (pos(r.y) * 1920) / H0, rotulo: "rastro", cor: "#7CFC00" });
      const inputProps = { imagem: `medir/rastro-${i}.jpg`, largura, altura, pontos };
      const composition = await selectComposition({ serveUrl, id: "Medir", inputProps });
      const saida = `out/rastro/rastro-t${t.toFixed(2).padStart(6, "0")}.jpg`;
      await renderStill({ composition, serveUrl, frame: 0, output: saida, inputProps, imageFormat: "jpeg", logLevel: "error" });
      console.log(saida);
    }
  } finally {
    rmSync(serveUrl, { recursive: true, force: true });
    rmSync("public/medir", { recursive: true, force: true });
  }
  console.log(
    r
      ? "A cruz verde (rastro) deve cair entre os olhos e a ponta do nariz. Se errou, meça o centro do rosto num desses quadros (a grade é a do vídeo de trabalho) e rode: node scripts/rastrear.mjs --em <segundos> --x <fração> --y <fração>"
      : "Sem rastro no plano: a pessoa fica no enquadramento fixo (cruz rosa).",
  );
};

// Chamado direto: node scripts/rastrear.mjs [--largura 0.4] [--em 6.5 --x 0.49 --y 0.25] [--desligar] [--conferir 2 6 10]
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  exigirProjeto();
  const { opcoes, posicionais } = argumentos();
  if (opcoes.conferir) {
    await conferir(posicionais.map(Number).filter((n) => Number.isFinite(n)));
    process.exit(0);
  }
  if (opcoes.largura !== undefined && !(Number(opcoes.largura) > 0.08 && Number(opcoes.largura) < 0.95)) {
    throw new Error("--largura é a largura do rosto em fração da largura do quadro (ex.: 0.42).");
  }
  if (opcoes.em !== undefined && (opcoes.x === undefined || opcoes.y === undefined)) {
    throw new Error("Com --em, informe também --x e --y (o centro do rosto naquele quadro, em frações).");
  }
  await rastrearNoPlano({ largura: opcoes.largura, em: opcoes.em, x: opcoes.x, y: opcoes.y, desligar: opcoes.desligar === true });
}
