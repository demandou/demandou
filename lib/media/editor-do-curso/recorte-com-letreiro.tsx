import sharp from "sharp";
import { ImageResponse } from "@vercel/og";
import { destaqueDaFrase, encaixarFrase, fontesDaArte, fontesDoSatori } from "@/lib/media/arte-com-frase";
import { larguraEmCorpos } from "@/lib/media/metricas-de-fonte";
import { geometriaDoRecorte, type CoresDaPeca, type GeometriaDoRecorte } from "./arte-pela-ia";

/**
 * O RECORTE COM LETREIRO MONTADO EM CÓDIGO (11/10/2026, princípio da aula 8.2).
 *
 * No teste de ponta a ponta de 11/10 a IA de imagem recebia o quadro nítido da
 * gravação e REDESENHAVA a pessoa: em dois infográficos o Bruno virou um padre
 * e um homem de óculos. Agora cada camada tem um dono, como na capa composta
 * (lib/media/capa-composta.tsx):
 *
 *   1  o FUNDO e o LETREIRO gigante: a IA de imagem, sem pessoa nenhuma, com o
 *      palco vazio (arte-pela-ia.ts, promptDoFundoDoRecorte), conferido antes
 *      de colar qualquer coisa (a palavra exata, nenhuma outra, nenhuma gente);
 *   2  a PESSOA: o recorte real do quadro nítido (o PNG com alfa que o worker
 *      já faz no /melhor-quadro e no /recortar), colado aqui, com o alto da
 *      cabeça na metade de baixo da palavra (a palavra atrás da cabeça);
 *   3  a FRASE: código, exata, na zona calma, com a letra do estilo.
 *
 * Na reserva do mesmo estilo (a IA não acertou a palavra), a palavra também
 * entra em código, na mesma faixa.
 */

export type Caixa = { x0: number; y0: number; x1: number; y1: number };

/** A caixa dos pixels visíveis (alfa acima do limiar) de um canal alfa. Null sem pessoa. Puro. */
export function caixaDoAlfa(alfa: Uint8Array, w: number, h: number, limiar = 32): Caixa | null {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    const linha = y * w;
    for (let x = 0; x < w; x++) {
      if (alfa[linha + x] > limiar) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/**
 * A cabeça do recorte, pelo alfa: o alto da caixa, o centro e a largura das
 * linhas do topo (os primeiros 12% da altura, onde só cabe a cabeça). Em
 * pixels da imagem do recorte. Puro.
 */
export function cabecaDoRecorte(alfa: Uint8Array, w: number, caixa: Caixa, limiar = 32): { topo: number; centroX: number; largura: number } {
  const altura = caixa.y1 - caixa.y0;
  const ate = Math.min(caixa.y1, caixa.y0 + Math.max(2, Math.round(altura * 0.12)));
  let soma = 0;
  let n = 0;
  let largura = 0;
  for (let y = caixa.y0; y < ate; y++) {
    let a = -1;
    let b = -1;
    for (let x = caixa.x0; x < caixa.x1; x++) {
      if (alfa[y * w + x] > limiar) {
        if (a < 0) a = x;
        b = x;
        soma += x;
        n++;
      }
    }
    if (a >= 0) largura = Math.max(largura, b - a + 1);
  }
  return { topo: caixa.y0, centroX: n ? soma / n : (caixa.x0 + caixa.x1) / 2, largura: Math.max(1, largura) };
}

/**
 * A FAIXA DO LETREIRO que a IA desenhou (frações da altura), para a cabeça
 * cair na metade de baixo da palavra de verdade e não só na pedida: as linhas
 * do terço de cima com muita "tinta" (pixels longe do tom mediano da linha),
 * a sequência mais alta, tolerando falhas curtas. Null quando não acha. Puro.
 */
export function faixaDoLetreiro(cinza: Uint8Array, w: number, h: number, ate = 0.6): { topo: number; base: number } | null {
  const fim = Math.round(h * ate);
  const tinta: number[] = [];
  for (let y = 0; y < fim; y++) {
    const linha = Array.from(cinza.subarray(y * w, y * w + w)).sort((a, b) => a - b);
    const mediana = linha[Math.floor(w / 2)];
    let fora = 0;
    for (let x = 0; x < w; x++) if (Math.abs(cinza[y * w + x] - mediana) > 55) fora++;
    tinta.push(fora / w);
  }
  const folga = Math.max(1, Math.round(h * 0.02));
  let melhor: { topo: number; base: number } | null = null;
  let ini = -1;
  let ultimo = -1;
  const fechar = () => {
    if (ini >= 0 && (!melhor || ultimo + 1 - ini > melhor.base - melhor.topo)) melhor = { topo: ini, base: ultimo + 1 };
  };
  for (let y = 0; y < fim; y++) {
    if (tinta[y] >= 0.1) {
      if (ini < 0 || y - ultimo > folga) {
        fechar();
        ini = y;
      }
      ultimo = y;
    }
  }
  fechar();
  const achada = melhor as { topo: number; base: number } | null;
  if (!achada || achada.base - achada.topo < h * 0.05) return null;
  return { topo: achada.topo / h, base: achada.base / h };
}

/** Onde o alto da cabeça cai: na metade de baixo da faixa achada, ou no da geometria. Puro. */
export function topoDaCabecaNaFaixa(g: GeometriaDoRecorte, achada: { topo: number; base: number } | null): number {
  if (!achada) return g.topoDaCabeca;
  const t = achada.topo + 0.62 * (achada.base - achada.topo);
  return Math.min(0.5, Math.max(0.12, t));
}

/**
 * O LUGAR DA PESSOA na peça (pixels): a base do recorte na base da peça, o
 * alto da cabeça no alvo, a cabeça no centro pedido; sem passar da largura
 * máxima nem da cabeça máxima (a gravação de perto não vira só um rosto). Puro.
 */
export function lugarDaPessoa(
  o: { W: number; H: number; g: GeometriaDoRecorte; topoAlvo: number },
  caixa: Caixa,
  cabeca: { topo: number; centroX: number; largura: number }
): { escala: number; left: number; top: number; width: number; height: number } {
  const cw = caixa.x1 - caixa.x0;
  const ch = caixa.y1 - caixa.y0;
  const alvo = o.topoAlvo * o.H;
  const escala = Math.min((o.H - alvo) / ch, (o.g.larguraMaxima * o.W) / cw, (o.g.cabecaMaxima * o.W) / cabeca.largura);
  const width = Math.round(cw * escala);
  const height = Math.round(ch * escala);
  const top = o.H - height;
  const left = Math.round(o.g.centroX * o.W - (cabeca.centroX - caixa.x0) * escala);
  return { escala, left, top, width, height };
}

/** Hex em [r, g, b]. Puro. */
function rgbDe(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c.slice(0, 6);
  const n = parseInt(full, 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [0, 0, 0];
}
const distancia = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * COR POR LETRA NA PALAVRA GRANDE (11/10): a palavra é inteira numa cor (a da
 * letra) ou inteira na cor da marca; letras avulsas na cor da marca parecem
 * defeito. Mede, na faixa da palavra (sem o fim dela, onde mora o sublinhado),
 * a cor dominante de cada coluna: colunas na cor da letra E colunas na cor da
 * marca, ambas com mais de 3% da largura, reprovam. Devolve o motivo ou null.
 * `rgb` é a imagem em 3 canais. Puro.
 */
export function corPorLetra(
  rgb: Uint8Array,
  w: number,
  h: number,
  faixa: { topo: number; base: number },
  cores: Pick<CoresDaPeca, "fundo" | "titulo" | "destaque" | "destaqueNoTexto">
): string | null {
  const fundo = rgbDe(cores.fundo);
  const titulo = rgbDe(cores.titulo);
  const marcas = [cores.destaque, cores.destaqueNoTexto].filter((c): c is string => Boolean(c)).map(rgbDe);
  const y0 = Math.max(0, Math.round(faixa.topo * h));
  const y1 = Math.min(h, Math.round((faixa.topo + 0.85 * (faixa.base - faixa.topo)) * h));
  const linhas = Math.max(1, y1 - y0);
  let colunasDaLetra = 0;
  let colunasDaMarca = 0;
  for (let x = 0; x < w; x++) {
    let naLetra = 0;
    let naMarca = 0;
    for (let y = y0; y < y1; y++) {
      const i = (y * w + x) * 3;
      const px = [rgb[i], rgb[i + 1], rgb[i + 2]];
      if (distancia(px, fundo) < 70) continue;
      const dT = distancia(px, titulo);
      const dM = Math.min(...marcas.map((m) => distancia(px, m)));
      if (dM < dT && dM < 110) naMarca++;
      else if (dT <= dM && dT < 110) naLetra++;
    }
    const minimo = linhas * 0.03;
    if (naMarca >= minimo && naMarca > naLetra) colunasDaMarca++;
    else if (naLetra >= minimo) colunasDaLetra++;
  }
  if (colunasDaMarca >= w * 0.03 && colunasDaLetra >= w * 0.03) {
    return `a palavra grande tem letras avulsas na cor da marca (${Math.round((100 * colunasDaMarca) / (colunasDaMarca + colunasDaLetra))}% das letras); ela vai inteira numa cor só, e a marca só em filete ou sublinhado`;
  }
  return null;
}

/** A cor por letra na camada da IA (data URI), na faixa achada ou na da geometria. */
export async function corPorLetraNaPalavra(dataUri: string, cores: CoresDaPeca): Promise<string | null> {
  const bytes = Buffer.from(dataUri.slice(dataUri.indexOf(",") + 1), "base64");
  const meta = await sharp(bytes).metadata();
  const g = geometriaDoRecorte((meta.width ?? 1) / (meta.height ?? 1));
  const reduzida = sharp(bytes).resize({ width: 320 }).removeAlpha();
  const { data, info } = await reduzida.clone().raw().toBuffer({ resolveWithObject: true });
  const cinza = await reduzida.clone().grayscale().raw().toBuffer({ resolveWithObject: true });
  const achada = faixaDoLetreiro(new Uint8Array(cinza.data.buffer, cinza.data.byteOffset, cinza.info.width * cinza.info.height), cinza.info.width, cinza.info.height);
  return corPorLetra(new Uint8Array(data.buffer, data.byteOffset, info.width * info.height * 3), info.width, info.height, achada ?? g.faixa, cores);
}

/** Hex para rgba com a opacidade pedida. Puro. */
function rgba(hex: string, a: number): string {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c.slice(0, 6);
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(20,20,20,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const dataUrl = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;

/**
 * A pessoa pronta para colar: o recorte cortado na caixa, no tamanho do lugar,
 * só a parte que fica dentro da peça. Null sem pessoa visível.
 */
export async function pessoaNoLugar(recorte: Buffer, o: { W: number; H: number; g: GeometriaDoRecorte; topoAlvo: number }): Promise<{ png: Buffer; left: number; top: number; width: number; height: number } | null> {
  const { data, info } = await sharp(recorte).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alfa = new Uint8Array(info.width * info.height);
  for (let i = 0; i < alfa.length; i++) alfa[i] = data[i * info.channels + (info.channels - 1)];
  const caixa = caixaDoAlfa(alfa, info.width, info.height);
  if (!caixa) return null;
  const cabeca = cabecaDoRecorte(alfa, info.width, caixa);
  const lugar = lugarDaPessoa(o, caixa, cabeca);
  if (lugar.width < 2 || lugar.height < 2) return null;
  const inteira = await sharp(recorte)
    .ensureAlpha()
    .extract({ left: caixa.x0, top: caixa.y0, width: caixa.x1 - caixa.x0, height: caixa.y1 - caixa.y0 })
    .resize(lugar.width, lugar.height, { fit: "fill" })
    .png()
    .toBuffer();
  // Só o pedaço que cai dentro da peça (a sobra além da borda é cortada aqui).
  const x0 = Math.max(0, lugar.left);
  const y0 = Math.max(0, lugar.top);
  const x1 = Math.min(o.W, lugar.left + lugar.width);
  const y1 = Math.min(o.H, lugar.top + lugar.height);
  if (x1 - x0 < 2 || y1 - y0 < 2) return null;
  const png = await sharp(inteira)
    .extract({ left: x0 - lugar.left, top: y0 - lugar.top, width: x1 - x0, height: y1 - y0 })
    .png()
    .toBuffer();
  return { png, left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
}

/** A faixa do letreiro na imagem do fundo (em cinza reduzido, rápido). */
async function faixaNoFundo(fundo: Buffer): Promise<{ topo: number; base: number } | null> {
  try {
    const { data, info } = await sharp(fundo).resize({ width: 240 }).grayscale().raw().toBuffer({ resolveWithObject: true });
    return faixaDoLetreiro(new Uint8Array(data.buffer, data.byteOffset, info.width * info.height), info.width, info.height);
  } catch {
    return null;
  }
}

/**
 * Monta a peça do Recorte: o fundo da IA (no tamanho final), a palavra em
 * código quando é a reserva, a pessoa real por cima (a cabeça na frente da
 * palavra), a sombra da zona da frase e a frase exata. Devolve JPEG.
 */
export async function comporRecorteComLetreiro(p: {
  fundo: Buffer;
  /** O PNG com alfa da pessoa (o recorte real da gravação). Null: a peça sai sem pessoa. */
  recorte: Buffer | null;
  frase: string;
  /** A palavra gigante em código (a reserva do mesmo estilo); null quando a IA já a desenhou. */
  palavraEmCodigo?: string | null;
  cores: CoresDaPeca;
  largura?: number;
  altura?: number;
}): Promise<Buffer> {
  const meta = await sharp(p.fundo).metadata();
  const W = p.largura ?? meta.width ?? 1080;
  const H = p.altura ?? meta.height ?? 1350;
  const g = geometriaDoRecorte(W / H);
  const fundoPng = await sharp(p.fundo).resize(W, H, { fit: "cover" }).png().toBuffer();
  const achada = p.palavraEmCodigo ? g.faixa : await faixaNoFundo(fundoPng);
  const topoAlvo = topoDaCabecaNaFaixa(g, achada);
  const pessoa = p.recorte ? await pessoaNoLugar(p.recorte, { W, H, g, topoAlvo }).catch((e) => {
    console.warn(`[recorte-com-letreiro] o recorte da pessoa não entrou: ${e instanceof Error ? e.message : e}`);
    return null;
  }) : null;

  const f = await fontesDaArte();
  const curto = Math.min(W, H);
  const deitada = g.forma === "deitada";

  // A palavra gigante em código (reserva): Anton, a maior que cabe em 84% da largura e na faixa.
  const palavra = p.palavraEmCodigo?.trim() || null;
  const faixaPx = { topo: Math.round(g.faixa.topo * H), altura: Math.round((g.faixa.base - g.faixa.topo) * H) };
  const corpoDaPalavra = palavra ? Math.floor(Math.min((W * 0.84) / Math.max(0.5, larguraEmCorpos(palavra, "Anton")), faixaPx.altura * 1.15)) : 0;

  // A frase exata, na zona calma.
  const zona = { x: Math.round(g.frase.x * W), y: Math.round(g.frase.y * H), w: Math.round(g.frase.w * W), h: Math.round(g.frase.h * H) };
  const frase = p.frase.trim().replace(/[.!]+$/, "");
  const encaixe = encaixarFrase({ frase, fonte: "Liberation Sans", largura: zona.w, altura: zona.h - curto * 0.05, entrelinha: 1.18, corpoMaximo: Math.round(curto * (deitada ? 0.09 : 0.075)), folga: 0.3 });
  const s = encaixe.corpo;
  const destaque = destaqueDaFrase(frase);
  const corDoDestaque = p.cores.destaqueNoTexto ?? p.cores.destaque;
  const sombra = deitada
    ? { left: 0, top: Math.round(H * 0.42), width: Math.round(W * 0.62), height: H - Math.round(H * 0.42), fundo: `linear-gradient(90deg, ${rgba(p.cores.fundo, 0.93)} 0%, ${rgba(p.cores.fundo, 0.75)} 60%, ${rgba(p.cores.fundo, 0)} 100%)` }
    : { left: 0, top: Math.round(H * (g.frase.y - 0.16)), width: W, height: H - Math.round(H * (g.frase.y - 0.16)), fundo: `linear-gradient(180deg, ${rgba(p.cores.fundo, 0)} 0%, ${rgba(p.cores.fundo, 0.86)} 45%, ${rgba(p.cores.fundo, 0.95)} 100%)` };

  const resposta = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: p.cores.fundo, overflow: "hidden" }}>
        <img src={dataUrl(fundoPng)} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }} />
        {palavra && (
          <div style={{ position: "absolute", left: 0, top: faixaPx.topo, width: W, height: faixaPx.altura, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Anton", fontSize: corpoDaPalavra, lineHeight: 1, color: p.cores.titulo }}>{palavra}</span>
          </div>
        )}
        {pessoa && <img src={dataUrl(pessoa.png)} width={pessoa.width} height={pessoa.height} style={{ position: "absolute", left: pessoa.left, top: pessoa.top }} />}
        <div style={{ position: "absolute", left: sombra.left, top: sombra.top, width: sombra.width, height: sombra.height, display: "flex", backgroundImage: sombra.fundo }} />
        <div
          style={{
            position: "absolute",
            left: zona.x,
            top: zona.y,
            width: zona.w,
            height: zona.h,
            display: "flex",
            flexDirection: "column",
            justifyContent: g.frase.alinhar === "centro" ? "center" : "flex-end",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", width: s * 1.6, height: Math.max(6, Math.round(s * 0.08)), background: p.cores.destaque, marginBottom: s * 0.35 }} />
          {encaixe.linhas.map((l, li) => (
            <div key={li} style={{ display: "flex", fontFamily: "Sans", fontWeight: 700, fontSize: s, lineHeight: 1.14, color: p.cores.titulo, marginBottom: s * 0.04, textShadow: "0 3px 14px rgba(0,0,0,0.55)" }}>
              {l.split(" ").map((w, wi) => (
                <span key={wi} style={{ marginRight: s * 0.26, color: w === destaque ? corDoDestaque : p.cores.titulo }}>
                  {w}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fontesDoSatori(f) }
  );
  const png = Buffer.from(await resposta.arrayBuffer());
  return sharp(png).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}
