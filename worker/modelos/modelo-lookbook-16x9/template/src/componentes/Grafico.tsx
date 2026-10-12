// Gráfico na linguagem do catálogo:
// - barras: tiras de tecido que se estendem da esquerda para a direita, como um corte de pano,
//   cada uma na palavra do seu número (a maior em jeans índigo);
// - linha: um traço fino de tinta com um pino em cada ponto;
// - pizza: uma amostra redonda cortada em fatias de tecido;
// - sem números ditos (`tendencia`): o traço fino desenha a tendência e um pino corre na ponta,
//   com a etiqueta "ilustrativo" (ou tiras que crescem, na forma de barras).
import { prog, saida, Sobe } from "../anim";
import { largura, numeroPtBr, umaLinha } from "../medida";
import type { Area } from "../pessoa";
import type { Grafico } from "../plano";
import { CARTELA, cor, rotulo, serifa, PAGINA } from "../tema";
import { Amostra } from "./Amostra";
import { Pino } from "./Chamada";
import { quando } from "./comum";
import { alturaTitulo, Titulo } from "./Lista";

const JEANS = { cor: "#34496F", tecido: "jeans" as const };

const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Math.abs(v * 10 - Math.round(v * 10)) < 1e-6 ? 1 : 2);
export const valorComUnidade = (v: number, unidade?: string) => {
  const n = numeroPtBr(v, casasDe(v));
  if (!unidade) return n;
  if (unidade === "%") return `${n}%`;
  if (/^(R\$|US\$|€|\$)$/.test(unidade)) return `${unidade} ${n}`;
  return `${n} ${unidade}`;
};

const Etiqueta: React.FC<{ texto: string; x: number; y: number; w: number; alinhar?: "left" | "right" | "center"; p?: number; cor?: string; tamanho?: number }> = ({ texto, x, y, w, alinhar = "left", p = 1, cor: c = cor.grafite, tamanho = 30 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, textAlign: alinhar, ...rotulo, fontSize: tamanho, letterSpacing: "0.12em", color: p > 0.5 ? c : cor.lapis, whiteSpace: "nowrap", overflow: "hidden" }}>{texto}</div>
);

// curva da tendência (0..1 em x → 0..1 em y, 0 = embaixo)
const curva = (tipo: "sobe" | "cai" | "oscila", x: number) => {
  if (tipo === "oscila") return 0.5 + 0.28 * Math.sin(x * Math.PI * 3.2) + 0.04 * Math.sin(x * 23);
  const base = 0.12 + 0.72 * Math.pow(x, 1.25) + 0.07 * Math.sin(x * 11) * (1 - x * 0.6);
  return tipo === "sobe" ? base : 1 - base;
};

export const GraficoDeCatalogo: React.FC<{ m: Grafico; t: number; fim: number; area: Area; id: string }> = ({ m, t, fim, area, id }) => {
  const fora = saida(t, fim);
  const th = alturaTitulo(m.titulo, area.w - (m.ilustrativo ? 220 : 0));
  const y0 = area.y + th + (th ? 26 : 0);
  const h = area.y + area.h - y0;
  const dados = m.dados ?? [];
  const entra = prog(t, m.de + 0.1, 0.55);

  let corpo: React.ReactNode = null;

  if (dados.length >= 2 && m.forma === "barras") {
    const max = Math.max(...dados.map((d) => Math.abs(d.valor))) || 1;
    const textos = dados.map((d) => valorComUnidade(d.valor, m.unidade));
    // cada linha: rótulo em caixa alta + tira de tecido + valor; as tiras crescem para ocupar a área
    const linhaH = Math.min(230, h / dados.length);
    const bh = Math.max(40, Math.min(124, linhaH - 34 - 14 - 26));
    const tv = umaLinha(textos.reduce((a, b) => (a.length > b.length ? a : b)), 340, Math.min(80, Math.round(bh * 0.85)), 40, { estilo: "serifa" });
    const wValor = Math.max(...textos.map((x) => largura(x, tv, "serifa"))) + 28;
    const y00 = y0 + Math.max(0, (h - linhaH * dados.length) / 2);
    const maior = dados.findIndex((d) => Math.abs(d.valor) === max);
    corpo = dados.map((d, i) => {
      const em = quando(d.em, m.de);
      const p = prog(t, em - 0.04, 0.7);
      const w = Math.max(30, ((area.w - wValor) * Math.abs(d.valor)) / max);
      const y = y00 + i * linhaH;
      const a = i === maior ? JEANS : CARTELA[i % CARTELA.length];
      return (
        <div key={i}>
          <Etiqueta texto={d.rotulo} x={area.x} y={y} w={area.w} p={prog(t, em - 0.04, 0.3)} tamanho={34} />
          <div style={{ position: "absolute", left: area.x, top: y + 48 }}>
            <Amostra id={`${id}-b${i}`} w={w} h={bh} base={a.cor} tecido={a.tecido} p={p} />
          </div>
          <div style={{ position: "absolute", left: area.x + w * Math.min(1, p) + 20, top: y + 48 + (bh - tv * 1.1) / 2, fontFamily: serifa, fontSize: tv, lineHeight: 1.1, color: i === maior ? cor.indigo : cor.tinta, whiteSpace: "nowrap" }}>
            <Sobe p={prog(t, em + 0.2, 0.4)}>{textos[i]}</Sobe>
          </div>
        </div>
      );
    });
  } else if (dados.length >= 2 && m.forma === "pizza") {
    const total = dados.reduce((a, d) => a + Math.abs(d.valor), 0) || 1;
    const D = Math.min(h - 10, area.w * 0.46);
    const cx = area.x + D / 2;
    const cy = y0 + D / 2;
    let a0 = -Math.PI / 2;
    const fatias = dados.map((d, i) => {
      const ang = (Math.abs(d.valor) / total) * Math.PI * 2;
      const f = { a0, a1: a0 + ang, i };
      a0 += ang;
      return f;
    });
    const maior = dados.reduce((k, d, i) => (Math.abs(d.valor) > Math.abs(dados[k].valor) ? i : k), 0);
    const corDa = (i: number) => (i === maior ? JEANS : CARTELA[i % CARTELA.length]);
    const lx = area.x + D + 48;
    const lw = area.x + area.w - lx;
    const passo = Math.min(120, D / dados.length);
    corpo = (
      <>
        <svg width={PAGINA.w} height={PAGINA.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <pattern id={`${id}-trama`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
              <rect width="9" height="3.4" fill="rgba(255,255,255,0.14)" />
            </pattern>
          </defs>
          <circle cx={cx} cy={cy} r={D / 2} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="10 9" />
          {fatias.map((f) => {
            const em = quando(dados[f.i].em, m.de);
            const p = prog(t, em - 0.04, 0.6);
            if (p <= 0) return null;
            const a1 = f.a0 + (f.a1 - f.a0) * p;
            const r = D / 2;
            const grande = a1 - f.a0 > Math.PI ? 1 : 0;
            const d =
              a1 - f.a0 >= Math.PI * 2 - 1e-3
                ? `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
                : `M${cx} ${cy} L${cx + r * Math.cos(f.a0)} ${cy + r * Math.sin(f.a0)} A${r} ${r} 0 ${grande} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
            return (
              <g key={f.i}>
                <path d={d} fill={corDa(f.i).cor} stroke={cor.folha} strokeWidth={4} />
                <path d={d} fill={`url(#${id}-trama)`} />
              </g>
            );
          })}
        </svg>
        {dados.map((d, i) => {
          const em = quando(d.em, m.de);
          const y = y0 + i * passo;
          const a = corDa(i);
          return (
            <div key={i} style={{ position: "absolute", left: lx, top: y, width: lw, opacity: prog(t, em - 0.1, 0.3) * 0.7 + 0.3 }}>
              <div style={{ position: "absolute", left: 0, top: 6 }}>
                <Amostra id={`${id}-l${i}`} w={40} h={40} base={a.cor} tecido={a.tecido} p={prog(t, em - 0.04, 0.5)} />
              </div>
              <Etiqueta texto={d.rotulo} x={56} y={0} w={lw - 56} p={prog(t, em - 0.04, 0.3)} />
              <div style={{ position: "absolute", left: 56, top: 38, fontFamily: serifa, fontSize: 48, lineHeight: 1.1, color: i === maior ? cor.indigo : cor.tinta }}>
                <Sobe p={prog(t, em + 0.1, 0.4)}>{valorComUnidade(d.valor, m.unidade)}</Sobe>
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (dados.length >= 2) {
    // linha: traço fino com pinos
    const max = Math.max(...dados.map((d) => d.valor));
    const min = Math.min(0, ...dados.map((d) => d.valor));
    const topo = y0 + 76;
    const base = y0 + h - 64;
    const xs = dados.map((_, i) => area.x + 50 + ((area.w - 100) * i) / (dados.length - 1));
    const ys = dados.map((d) => base - ((d.valor - min) / (max - min || 1)) * (base - topo));
    const ems = dados.map((d) => quando(d.em, m.de));
    const segs = dados.slice(1).map((_, i) => prog(t, ems[i + 1] - 0.25, 0.45));
    const colW = Math.min(260, (area.w - 40) / dados.length);
    corpo = (
      <>
        <svg width={PAGINA.w} height={PAGINA.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={area.x} x2={area.x + area.w} y1={base} y2={base} stroke={cor.tinta} strokeWidth={2.5} opacity={entra} />
          {segs.map((p, i) =>
            p > 0 ? <line key={i} x1={xs[i]} y1={ys[i]} x2={xs[i] + (xs[i + 1] - xs[i]) * p} y2={ys[i] + (ys[i + 1] - ys[i]) * p} stroke={cor.tinta} strokeWidth={4} strokeLinecap="round" /> : null,
          )}
          {dados.map((_, i) => (
            <line key={`g${i}`} x1={xs[i]} x2={xs[i]} y1={base} y2={ys[i] + 30} stroke={cor.lapis} strokeWidth={2} strokeDasharray="6 7" opacity={prog(t, ems[i], 0.4)} />
          ))}
          {dados.map((_, i) => (
            <Pino key={`p${i}`} x={xs[i]} y={ys[i]} p={prog(t, ems[i] - 0.06, 0.6)} />
          ))}
        </svg>
        {dados.map((d, i) => (
          <div key={i}>
            <div style={{ position: "absolute", left: xs[i] - colW / 2, width: colW, top: ys[i] - 92, textAlign: "center", fontFamily: serifa, fontSize: 46, lineHeight: 1.1, color: i === dados.length - 1 ? cor.indigo : cor.tinta }}>
              <Sobe p={prog(t, ems[i] + 0.05, 0.4)}>{valorComUnidade(d.valor, m.unidade)}</Sobe>
            </div>
            <Etiqueta texto={d.rotulo} x={xs[i] - colW / 2} y={base + 16} w={colW} alinhar="center" p={prog(t, ems[i] - 0.04, 0.3)} />
          </div>
        ))}
      </>
    );
  } else {
    // sem números ditos: a tendência, ilustrativa
    const tipo = m.tendencia ?? "sobe";
    const tEm = m.tendenciaEm !== undefined ? quando(m.tendenciaEm, m.de) : m.de + 0.35;
    const p = prog(t, tEm - 0.05, 1.6);
    const topo = y0 + 40;
    const base = y0 + h - 30;
    const W = area.w - 40;
    if (m.forma === "barras") {
      const n = 5;
      const bw = (W - (n - 1) * 26) / n;
      corpo = (
        <>
          <svg width={PAGINA.w} height={PAGINA.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line x1={area.x} x2={area.x + area.w} y1={base} y2={base} stroke={cor.tinta} strokeWidth={2.5} opacity={entra} />
          </svg>
          {Array.from({ length: n }, (_, i) => {
            const alvo = 0.18 + 0.8 * curva(tipo, (i + 0.5) / n);
            const hi = (base - topo) * alvo;
            // as tiras crescem em sequência, todas dentro do momento
            const passo = Math.max(0.08, Math.min(0.22, (fim - tEm - 0.7) / n));
            const pi = prog(t, tEm - 0.05 + i * passo, 0.55);
            const a = i === n - 1 && tipo === "sobe" ? JEANS : i === 0 && tipo === "cai" ? JEANS : CARTELA[i % CARTELA.length];
            return (
              <div key={i} style={{ position: "absolute", left: area.x + 20 + i * (bw + 26), top: base - hi * pi, width: bw, height: hi * pi, overflow: "hidden" }}>
                <Amostra id={`${id}-tb${i}`} w={bw} h={hi} base={a.cor} tecido={a.tecido} p={1} />
              </div>
            );
          })}
        </>
      );
    } else {
      const pts = Array.from({ length: 61 }, (_, i) => {
        const x = i / 60;
        return { x: area.x + 20 + W * x, y: base - (base - topo) * curva(tipo, x) };
      });
      const n = Math.max(1, Math.round(p * 60));
      const visiveis = pts.slice(0, n + 1);
      const d = visiveis.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
      const area2 = `${d} L${visiveis[visiveis.length - 1].x.toFixed(1)} ${base} L${pts[0].x} ${base} Z`;
      const ponta = visiveis[visiveis.length - 1];
      corpo = (
        <svg width={PAGINA.w} height={PAGINA.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <pattern id={`${id}-linho`} width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="1.6" fill="rgba(40,32,24,0.06)" />
              <rect width="1.4" height="6" fill="rgba(40,32,24,0.05)" />
            </pattern>
          </defs>
          <line x1={area.x} x2={area.x + area.w} y1={base} y2={base} stroke={cor.tinta} strokeWidth={2.5} opacity={entra} />
          <path d={pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ")} fill="none" stroke={cor.lapisClaro} strokeWidth={3} strokeDasharray="10 10" opacity={entra * (1 - p)} />
          {p > 0 ? (
            <>
              <path d={area2} fill="#E2D8C7" opacity={0.85} />
              <path d={area2} fill={`url(#${id}-linho)`} />
              <path d={d} fill="none" stroke={cor.tinta} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              <Pino x={ponta.x} y={ponta.y} p={prog(t, tEm, 0.5)} />
            </>
          ) : null}
        </svg>
      );
    }
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PAGINA.w, height: PAGINA.h, opacity: (1 - fora) * Math.min(1, entra * 1.5), translate: `0 ${(1 - entra) * 40 + fora * 30}px` }}>
      {m.titulo ? (
        <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w - (m.ilustrativo ? 220 : 0) }}>
          <Titulo texto={m.titulo} p={prog(t, m.de + 0.3, 0.45)} largura={area.w - (m.ilustrativo ? 220 : 0)} />
        </div>
      ) : null}
      {m.ilustrativo || !dados.length ? (
        <div style={{ position: "absolute", left: area.x + area.w - 260, width: 260, top: area.y + 10, textAlign: "right", ...rotulo, fontSize: 30, color: cor.grafite }}>ilustrativo</div>
      ) : null}
      {corpo}
    </div>
  );
};
