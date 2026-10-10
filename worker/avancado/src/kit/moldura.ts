/**
 * A GEOMETRIA DAS MOLDURAS (aulas 7, 8.1 e 8.2). Uma caixa e quatro cantos,
 * cada canto com raio ou chanfro; as formas das aulas são combinações:
 *
 *   reta         os quatro cantos retos (tela cheia)
 *   arredondada  os quatro com raio (aula 7: "cantos arredondados, borda fina e sombra suave")
 *   assimetrica  canto de cima à esquerda com raio grande, o oposto chanfrado,
 *                os outros com raio pequeno (aula 8.2: "moldura editorial assimétrica")
 *   chanfrada    os quatro chanfrados (aula 8.1: "janela de prancha arquitetônica")
 *
 * Tudo é número, então uma forma vira a outra por interpolação (a moldura que
 * se transforma na transição, sem corte seco).
 */
export type Caixa = { x: number; y: number; l: number; a: number };
export type Canto = { raio: number; chanfro: number };
/** Cantos na ordem: superior esquerdo, superior direito, inferior direito, inferior esquerdo. */
export type Cantos = [Canto, Canto, Canto, Canto];
export type Forma = "reta" | "arredondada" | "assimetrica" | "chanfrada";

const c = (raio: number, chanfro = 0): Canto => ({ raio, chanfro });

/** Os cantos de cada forma, para uma caixa de tamanho dado (encolhem em caixa pequena). */
export function cantosDaForma(forma: Forma, caixa: Pick<Caixa, "l" | "a">): Cantos {
  const lado = Math.min(caixa.l, caixa.a);
  const prop = (v: number) => Math.min(v, lado * 0.22);
  switch (forma) {
    case "arredondada":
      return [c(prop(40)), c(prop(40)), c(prop(40)), c(prop(40))];
    case "assimetrica":
      return [c(prop(150)), c(prop(22)), c(0, prop(120)), c(prop(22))];
    case "chanfrada":
      return [c(0, prop(46)), c(0, prop(46)), c(0, prop(46)), c(0, prop(46))];
    default:
      return [c(0), c(0), c(0), c(0)];
  }
}

export function misturarCantos(a: Cantos, b: Cantos, p: number): Cantos {
  return a.map((x, i) => ({ raio: x.raio + (b[i].raio - x.raio) * p, chanfro: x.chanfro + (b[i].chanfro - x.chanfro) * p })) as Cantos;
}

/** O caminho SVG (d) da caixa com os cantos dados. Serve para clip-path: path("...") e para <path d>. */
export function caminhoDaMoldura(cx: Caixa, cantos: Cantos): string {
  const { x, y, l, a } = cx;
  const lim = Math.max(0, Math.min(l, a) / 2);
  const t = cantos.map((k) => ({ raio: Math.max(0, Math.min(k.raio, lim)), chanfro: Math.max(0, Math.min(k.chanfro, lim)) }));
  const p: string[] = [];
  // começa no lado de cima, depois do canto superior esquerdo
  const se = t[0];
  const sd = t[1];
  const id = t[2];
  const ie = t[3];
  const tam = (k: { raio: number; chanfro: number }) => Math.max(k.raio, k.chanfro);
  p.push(`M ${x + tam(se)} ${y}`);
  p.push(`L ${x + l - tam(sd)} ${y}`);
  if (sd.chanfro > 0) p.push(`L ${x + l} ${y + sd.chanfro}`);
  else if (sd.raio > 0) p.push(`A ${sd.raio} ${sd.raio} 0 0 1 ${x + l} ${y + sd.raio}`);
  p.push(`L ${x + l} ${y + a - tam(id)}`);
  if (id.chanfro > 0) p.push(`L ${x + l - id.chanfro} ${y + a}`);
  else if (id.raio > 0) p.push(`A ${id.raio} ${id.raio} 0 0 1 ${x + l - id.raio} ${y + a}`);
  p.push(`L ${x + tam(ie)} ${y + a}`);
  if (ie.chanfro > 0) p.push(`L ${x} ${y + a - ie.chanfro}`);
  else if (ie.raio > 0) p.push(`A ${ie.raio} ${ie.raio} 0 0 1 ${x} ${y + a - ie.raio}`);
  p.push(`L ${x} ${y + tam(se)}`);
  if (se.chanfro > 0) p.push(`L ${x + se.chanfro} ${y}`);
  else if (se.raio > 0) p.push(`A ${se.raio} ${se.raio} 0 0 1 ${x + se.raio} ${y}`);
  p.push("Z");
  return p.join(" ");
}

/** A mesma moldura recuada `d` px para dentro (o chanfro de 45° encolhe d·(2 − √2)). */
export function recuarMoldura(cx: Caixa, cantos: Cantos, d: number): { caixa: Caixa; cantos: Cantos } {
  return {
    caixa: { x: cx.x + d, y: cx.y + d, l: Math.max(0, cx.l - 2 * d), a: Math.max(0, cx.a - 2 * d) },
    cantos: cantos.map((k) => ({ raio: Math.max(0, k.raio - d), chanfro: Math.max(0, k.chanfro - d * (2 - Math.SQRT2)) })) as Cantos,
  };
}

export const misturarCaixa = (a: Caixa, b: Caixa, p: number): Caixa => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  l: a.l + (b.l - a.l) * p,
  a: a.a + (b.a - a.a) * p,
});

/** Duas caixas se cruzam? (para conferir se um elemento cobre o rosto). */
export const cruzam = (a: Caixa, b: Caixa) => a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.a && b.y < a.y + a.a;
