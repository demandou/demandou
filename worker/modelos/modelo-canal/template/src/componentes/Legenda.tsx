// A legenda do Canal: desligada por padrão (no YouTube quem quer liga o CC); `plano.legendas: true`
// liga. Até 2 linhas embaixo, no centro, no estilo da legenda de um player: texto giz numa caixa de
// tinta translúcida por linha. A palavra que está sendo dita ganha um traço cobalto fino por baixo.
// Nunca junta duas frases numa linha (o motor quebra nas pontuações).
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar, larguraTexto } from "../medida";
import type { Momento, Plano } from "../plano";
import { BASE, COR, FONTE, W, prog } from "../tema";

// Momentos em que a legenda continua (salvo `legenda: false`); nos outros ela some.
const COM_LEGENDA = new Set(["cena", "capitulo", "destaque", "inscricao", "chamada"]);
export const legendaNoMomento = (m: Momento) => m.legenda ?? COM_LEGENDA.has(m.tipo);

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
const LARGURA = 1300;

export const Legenda: React.FC<{ plano: Plano }> = ({ plano }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!plano.legendas) return null;
  const t = frame / fps;
  const frase = frasesDo(plano).find((f) => t >= f.de && t < f.ate);
  if (!frase) return null;
  const palavras = frase.palavras.flatMap((p) => limpar(p.w).split(/\s+/).filter(Boolean).map((w) => ({ ...p, w })));
  const texto = palavras.map((p) => p.w).join(" ");
  const fit = encaixar(texto, { largura: LARGURA, max: 46, min: 36, linhas: 2, fonte: { peso: PESO } });
  const lh = Math.round(fit.tamanho * 1.36);
  const topo = BASE - lh * fit.linhas.length;
  const exata = { peso: PESO, exato: true } as const;
  const espaco = Math.max(larguraTexto(" ", fit.tamanho, exata), fit.tamanho * 0.3);
  const disp: { w: string; em: number; x: number; linha: number; largura: number }[] = [];
  const caixas: { x: number; w: number }[] = [];
  const padX = Math.round(fit.tamanho * 0.42);
  let k = 0;
  fit.linhas.forEach((linha, li) => {
    const ws = linha.split(" ");
    const total = ws.reduce((a, w) => a + larguraTexto(w, fit.tamanho, exata), 0) + espaco * (ws.length - 1);
    let x = (W - total) / 2;
    caixas.push({ x: x - padX, w: total + padX * 2 });
    for (const w of ws) {
      const largura = larguraTexto(w, fit.tamanho, exata);
      disp.push({ w, em: palavras[k]?.em ?? frase.de, x, linha: li, largura });
      x += largura + espaco;
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
        <div key={`c${i}`} style={{ position: "absolute", left: c.x, top: topo + i * lh + 2, width: c.w, height: lh - 4, borderRadius: 8, background: "rgba(17,19,24,0.80)" }} />
      ))}
      {disp.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: d.x, top: topo + d.linha * lh, height: lh, lineHeight: `${lh}px`, fontFamily: FONTE, fontWeight: PESO, fontSize: fit.tamanho, whiteSpace: "nowrap", color: COR.giz }}>
          {d.w}
        </div>
      ))}
      <div style={{ position: "absolute", left: traco.x, top: traco.y, width: traco.w, height: 5, borderRadius: 3, background: COR.cobalto }} />
    </div>
  );
};
