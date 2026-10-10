// O cursor de célula: borda framboesa com a alça de preencher no canto. Pula de célula em célula
// no ritmo da fala; no "preencher" vira uma seleção que desce pela coluna.
import { Easing } from "remotion";
import { limitar, mistura, prog } from "../anim";
import type { Ret } from "../grade";
import type { Alvo } from "../roteiro";
import { cor } from "../tema";

export const alvoNoTempo = (t: number, alvos: Alvo[]) => {
  let k = -1;
  for (let i = 0; i < alvos.length; i++) if (alvos[i].t <= t) k = i;
  if (k < 0) return null;
  const a = alvos[k];
  const antes = alvos[k - 1] ?? a;
  const p = prog(t, a.t, 0.2);
  let ret: Ret = {
    x: mistura(antes.ret.x, a.ret.x, p),
    y: mistura(antes.ret.y, a.ret.y, p),
    w: mistura(antes.ret.w, a.ret.w, p),
    h: mistura(antes.ret.h, a.ret.h, p),
  };
  let faixa = 0;
  if (a.faixa) {
    // a seleção começa na primeira célula e desce, uma linha a cada 0,2 s
    const alturaInicial = a.ret.h / a.faixa;
    const g = prog(t, a.t, a.faixa * 0.2, Easing.linear);
    ret = { x: a.ret.x, y: a.ret.y, w: a.ret.w, h: mistura(alturaInicial, a.ret.h, g) };
    faixa = 1;
  }
  return { ret, nome: p > 0.3 ? a.nome : antes.nome, faixa };
};

export const CursorDeCelula: React.FC<{ ret: Ret; faixa: number; opacidade: number }> = ({ ret, faixa, opacidade }) => {
  if (opacidade <= 0.01) return null;
  const borda = 5;
  return (
    <div style={{ position: "absolute", left: ret.x - 2, top: ret.y - 2, width: ret.w + 4, height: ret.h + 4, opacity: limitar(opacidade), pointerEvents: "none" }}>
      {faixa > 0 ? <div style={{ position: "absolute", inset: 2, background: `rgba(${cor.acentoRgb},0.10)` }} /> : null}
      <div style={{ position: "absolute", inset: 0, border: `${borda}px solid ${cor.acento}`, borderRadius: 3 }} />
      {/* alça de preencher */}
      <div style={{ position: "absolute", right: -9, bottom: -9, width: 18, height: 18, background: cor.acento, border: "3px solid #FFFFFF", boxSizing: "border-box" }} />
    </div>
  );
};
