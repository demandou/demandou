// A legenda mínima do Multicâmera: até 2 linhas pequenas, presas embaixo (acima da interface do
// app), no estilo da legenda de um player: texto branco numa caixa grafite translúcida por linha
// (legível sobre qualquer roupa ou fundo). A palavra que está sendo dita ganha um traço vermelho
// fino por baixo, que desliza de palavra em palavra. Continua por cima das cenas.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar, larguraTexto } from "../medida";
import type { Momento, Plano } from "../plano";
import { COR, FONTE, LEG_BASE, prog } from "../tema";

// Momentos em que a legenda continua (salvo `legenda: false`); nos outros ela some.
const COM_LEGENDA = new Set(["cena", "capitulo", "numero", "destaque"]);
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

// pontuação de fim some da tela (fica a de pergunta e exclamação)
const limpar = (w: string) => w.replace(/^["“”']+/, "").replace(/["“”']+$/, "").replace(/[.,;:]+$/, "");

const PESO = 700 as const;
const LARGURA = 880;

export const Legenda: React.FC<{ plano: Plano }> = ({ plano }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const frase = frasesDo(plano).find((f) => t >= f.de && t < f.ate);
  if (!frase) return null;

  // uma palavra por item (correções podem juntar duas: "R$ 500"); vazias (aspas soltas) saem
  const palavras = frase.palavras.flatMap((p) => limpar(p.w).split(/\s+/).filter(Boolean).map((w) => ({ ...p, w })));
  const texto = palavras.map((p) => p.w).join(" ");
  const fit = encaixar(texto, { largura: LARGURA, max: 46, min: 36, linhas: 2, fonte: { peso: PESO } });
  const lh = Math.round(fit.tamanho * 1.34);
  const topo = LEG_BASE - lh * fit.linhas.length;
  const exata = { peso: PESO, exato: true } as const;
  const espaco = Math.max(larguraTexto(" ", fit.tamanho, exata), fit.tamanho * 0.3);
  const disp: { w: string; em: number; x: number; linha: number; largura: number }[] = [];
  const caixas: { x: number; w: number }[] = [];
  const padX = Math.round(fit.tamanho * 0.42);
  let k = 0;
  fit.linhas.forEach((linha, li) => {
    const ws = linha.split(" ");
    const total = ws.reduce((a, w) => a + larguraTexto(w, fit.tamanho, exata), 0) + espaco * (ws.length - 1);
    let x = (1080 - total) / 2;
    caixas.push({ x: x - padX, w: total + padX * 2 });
    for (const w of ws) {
      const largura = larguraTexto(w, fit.tamanho, exata);
      disp.push({ w, em: palavras[k]?.em ?? frase.de, x, linha: li, largura });
      x += largura + espaco;
      k++;
    }
  });

  // palavra atual e a anterior (o traço desliza entre as duas na mesma linha)
  let atual = 0;
  disp.forEach((d, i) => {
    if (t >= d.em - 0.02) atual = i;
  });
  const a = disp[Math.max(0, atual - 1)];
  const b = disp[atual];
  const p = atual === 0 || a.linha !== b.linha ? 1 : prog(t, b.em - 0.02, 0.12);
  const traco = {
    x: a.x + (b.x - a.x) * p,
    y: topo + b.linha * lh + lh * 0.84,
    w: a.largura + (b.largura - a.largura) * p,
  };
  const entrada = prog(t, frase.de - 0.02, 0.12);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada }}>
      {caixas.map((c, i) => (
        <div key={`c${i}`} style={{ position: "absolute", left: c.x, top: topo + i * lh + 2, width: c.w, height: lh - 4, borderRadius: 8, background: "rgba(22,24,29,0.78)" }} />
      ))}
      {disp.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: topo + d.linha * lh,
            height: lh,
            lineHeight: `${lh}px`,
            fontFamily: FONTE,
            fontWeight: PESO,
            fontSize: fit.tamanho,
            whiteSpace: "nowrap",
            color: COR.branco,
          }}
        >
          {d.w}
        </div>
      ))}
      <div style={{ position: "absolute", left: traco.x, top: traco.y, width: traco.w, height: 5, borderRadius: 3, background: COR.tally, boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
    </div>
  );
};
