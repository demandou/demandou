// A legenda da Aula: desligada por padrão (o slide já escreve o essencial da fala; texto igual à
// narração em cima de um gráfico atrapalha o aprendizado). `plano.legendas: true` liga: até 2
// linhas discretas, tinta sobre uma faixa de papel, embaixo do slide (modo slide) ou embaixo, no
// centro (modo professor). A palavra dita ganha um traço violeta fino por baixo. Nunca junta duas
// frases numa linha (o motor quebra nas pontuações).
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar, larguraTexto } from "../medida";
import { trechoEm } from "../modo";
import { doProfessor, type Momento, type Plano } from "../plano";
import { BASE, COR, FONTE, SLIDE_W, W, prog, slideX } from "../tema";

// Momentos em que a legenda continua (salvo `legenda: false`): os cartões que não repetem a fala.
const COM_LEGENDA = new Set(["capitulo", "destaque"]);
export const legendaNoMomento = (m: Momento) => m.legenda ?? (COM_LEGENDA.has(m.tipo) || !doProfessor(m));

const guardadas = new WeakMap<object, Frase[]>();
const frasesDo = (plano: Plano) => {
  let f = guardadas.get(plano);
  if (!f) {
    f = montarFrases({ ...plano, momentos: plano.momentos.map((m) => ({ ...m, legenda: legendaNoMomento(m) })) });
    guardadas.set(plano, f);
  }
  return f;
};

const limpar = (w: string) => w.replace(/^["“”']+/, "").replace(/["“”']+$/, "").replace(/[.,;:]+$/, "");
const PESO = 600 as const;

export const Legenda: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  if (!plano.legendas) return null;
  const frase = frasesDo(plano).find((f) => t >= f.de && t < f.ate);
  if (!frase) return null;
  const slide = trechoEm(plano, t).modo === "slide";
  const largura = slide ? SLIDE_W - 80 : 1300;
  const centro = slide ? slideX(plano) + SLIDE_W / 2 : W / 2;
  const palavras = frase.palavras.flatMap((p) => limpar(p.w).split(/\s+/).filter(Boolean).map((w) => ({ ...p, w })));
  const texto = palavras.map((p) => p.w).join(" ");
  const fit = encaixar(texto, { largura, max: 36, min: 28, linhas: 2, fonte: { peso: PESO } });
  const lh = Math.round(fit.tamanho * 1.4);
  const topo = BASE - lh * fit.linhas.length + (slide ? 0 : -8);
  const exata = { peso: PESO, exato: true } as const;
  const espaco = Math.max(larguraTexto(" ", fit.tamanho, exata), fit.tamanho * 0.3);
  const disp: { w: string; em: number; x: number; linha: number; largura: number }[] = [];
  const caixas: { x: number; w: number }[] = [];
  const padX = Math.round(fit.tamanho * 0.45);
  let k = 0;
  fit.linhas.forEach((linha, li) => {
    const ws = linha.split(" ");
    const total = ws.reduce((a, w) => a + larguraTexto(w, fit.tamanho, exata), 0) + espaco * (ws.length - 1);
    let x = centro - total / 2;
    caixas.push({ x: x - padX, w: total + padX * 2 });
    for (const w of ws) {
      const larg = larguraTexto(w, fit.tamanho, exata);
      disp.push({ w, em: palavras[k]?.em ?? frase.de, x, linha: li, largura: larg });
      x += larg + espaco;
      k++;
    }
  });
  let atual = 0;
  disp.forEach((d, i) => {
    if (t >= d.em - 0.02) atual = i;
  });
  const a = disp[Math.max(0, atual - 1)];
  const b = disp[atual];
  const p = atual === 0 || a.linha !== b.linha ? 1 : prog(t, b.em - 0.02, 0.12);
  const traco = { x: a.x + (b.x - a.x) * p, y: topo + b.linha * lh + lh * 0.84, w: a.largura + (b.largura - a.largura) * p };
  const entrada = prog(t, frase.de - 0.02, 0.12);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada }}>
      {caixas.map((c, i) => (
        <div key={`c${i}`} style={{ position: "absolute", left: c.x, top: topo + i * lh + 2, width: c.w, height: lh - 4, borderRadius: 10, background: "rgba(255,255,255,0.94)" }} />
      ))}
      {disp.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x, top: topo + d.linha * lh, height: lh, lineHeight: `${lh}px`, fontFamily: FONTE, fontWeight: PESO, fontSize: fit.tamanho, whiteSpace: "nowrap", color: COR.tinta }}>
          {d.w}
        </div>
      ))}
      <div style={{ position: "absolute", left: traco.x, top: traco.y, width: traco.w, height: 4, borderRadius: 2, background: COR.violeta }} />
    </div>
  );
};
