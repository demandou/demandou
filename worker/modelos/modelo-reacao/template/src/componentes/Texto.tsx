// O texto dos cartões, palavra por palavra no lugar medido, com o marca-texto e o risco.
// O marca-texto é a peça central do Reação: ele anda na linha que a pessoa está lendo.
// Terminada a animação, tudo fica desenhado simples (sem camada de máscara por cima).
import { prog } from "../anim";
import type { TextoPosto } from "../medida";
import { cor, fonte } from "../tema";

// Um trecho marcado: palavras de `a` a `b` (índices no texto), cada uma acendendo no seu tempo.
export type Marca = { a: number; b: number; tempos: number[]; cor?: string; opacidade?: number };
export type Risco = { a: number; b: number; em: number };

// quanto tempo o marca-texto leva para atravessar cada palavra
const durPalavra = (tempos: number[], k: number) => Math.max(0.1, Math.min(0.3, (tempos[k + 1] ?? tempos[k] + 0.22) - tempos[k]));

// Tempos de um trecho que acende de uma vez (varrida de `dur` segundos, dividida pelas palavras).
export const varrida = (a: number, b: number, em: number, dur = 0.42) => {
  const n = b - a + 1;
  return Array.from({ length: n }, (_, k) => em + (dur * k) / n);
};

export const Texto: React.FC<{
  tp: TextoPosto;
  t: number;
  x?: number;
  y?: number;
  // largura da caixa (para centralizar)
  caixa?: number;
  centro?: boolean;
  corTexto?: string;
  // instante em que cada palavra aparece (null = todas já na tela)
  aparece?: number[] | null;
  marcas?: Marca[];
  risco?: Risco | null;
}> = ({ tp, t, x = 0, y = 0, caixa, centro, corTexto = cor.tinta, aparece, marcas = [], risco }) => {
  const peso = tp.fonte.peso ?? 700;
  const desloc = (li: number) => {
    if (!centro || !caixa) return 0;
    const l = tp.linhas[li];
    const u = l[l.length - 1];
    return (caixa - (u.x + u.largura)) / 2;
  };
  const retangulos: React.ReactNode[] = [];
  marcas.forEach((mc, mi) => {
    tp.linhas.forEach((linha, li) => {
      const dentro = linha.filter((p) => p.i >= mc.a && p.i <= mc.b);
      if (!dentro.length) return;
      let esquerda: number | null = null;
      let direita = 0;
      for (const p of dentro) {
        const k = p.i - mc.a;
        const t0 = mc.tempos[k] ?? mc.tempos[mc.tempos.length - 1];
        if (t < t0) break;
        const f = Math.min(1, (t - t0) / durPalavra(mc.tempos, k));
        if (esquerda === null) esquerda = p.x;
        direita = p.x + p.largura * f;
      }
      if (esquerda === null) return;
      const ox = desloc(li);
      const folga = tp.tamanho * 0.14;
      retangulos.push(
        <div
          key={`m${mi}-${li}`}
          style={{
            position: "absolute",
            left: x + ox + esquerda - folga,
            top: y + li * tp.lh + tp.lh * 0.15,
            width: direita - esquerda + folga * 2,
            height: tp.lh * 0.72,
            background: mc.cor ?? cor.marca,
            opacity: mc.opacidade ?? 1,
            borderRadius: `${tp.tamanho * 0.16}px ${tp.tamanho * 0.06}px ${tp.tamanho * 0.2}px ${tp.tamanho * 0.08}px`,
            transform: "skewX(-8deg)",
          }}
        />,
      );
    });
  });

  const riscos: React.ReactNode[] = [];
  if (risco && t >= risco.em) {
    // o risco atravessa linha por linha
    const linhas = tp.linhas.map((l) => l.filter((p) => p.i >= risco.a && p.i <= risco.b)).filter((l) => l.length);
    const total = linhas.reduce((s, l) => s + (l[l.length - 1].x + l[l.length - 1].largura - l[0].x), 0);
    let andado = prog(t, risco.em, 0.38) * total;
    linhas.forEach((l) => {
      const ini = l[0].x;
      const fim = l[l.length - 1].x + l[l.length - 1].largura;
      const w = Math.max(0, Math.min(fim - ini, andado));
      andado -= fim - ini;
      if (w <= 0) return;
      const li = l[0].linha;
      const esp = Math.max(5, tp.tamanho * 0.085);
      riscos.push(
        <div
          key={`r${li}`}
          style={{
            position: "absolute",
            left: x + desloc(li) + ini - 6,
            top: y + li * tp.lh + tp.lh * 0.56 - esp / 2,
            width: w + 12,
            height: esp,
            borderRadius: esp,
            background: cor.alerta,
          }}
        />,
      );
    });
  }

  return (
    <>
      {retangulos}
      {tp.palavras.map((p) => {
        const em = aparece ? aparece[p.i] : undefined;
        if (em !== undefined && t < em) return null;
        const entrando = em !== undefined && t < em + 0.14;
        const q = entrando ? prog(t, em, 0.14) : 1;
        // palavra já varrida pelo marca-texto: tinta escura (legível também em cartão escuro)
        const marcada = marcas.some((mc) => p.i >= mc.a && p.i <= mc.b && t >= (mc.tempos[p.i - mc.a] ?? mc.tempos[mc.tempos.length - 1]) && (mc.opacidade ?? 1) > 0.5);
        const apagada = risco && t >= risco.em + 0.38 && p.i >= risco.a && p.i <= risco.b;
        return (
          <span
            key={p.i}
            style={{
              position: "absolute",
              left: x + desloc(p.linha) + p.x,
              top: y + p.linha * tp.lh,
              fontFamily: fonte,
              fontWeight: peso,
              fontSize: tp.tamanho,
              lineHeight: `${tp.lh}px`,
              color: apagada ? cor.cinza : marcada ? cor.tinta : corTexto,
              whiteSpace: "nowrap",
              textTransform: tp.fonte.caixaAlta ? "uppercase" : undefined,
              ...(entrando ? { opacity: q, transform: `translateY(${(1 - q) * 10}px)` } : {}),
            }}
          >
            {p.w}
          </span>
        );
      })}
      {riscos}
    </>
  );
};

// A caixa (em coordenadas do texto) de um trecho: para a câmera aproximar.
export const caixaDoTrecho = (tp: TextoPosto, a: number, b: number) => {
  const ps = tp.palavras.filter((p) => p.i >= a && p.i <= b);
  if (!ps.length) return null;
  const x0 = Math.min(...ps.map((p) => p.x));
  const x1 = Math.max(...ps.map((p) => p.x + p.largura));
  const l0 = Math.min(...ps.map((p) => p.linha));
  const l1 = Math.max(...ps.map((p) => p.linha));
  return { x: x0, y: l0 * tp.lh, w: x1 - x0, h: (l1 - l0 + 1) * tp.lh };
};
