// A assinatura 1: o infográfico-estrada. Título e subtítulo no alto, uma estrada que serpenteia pela
// tela com placas numeradas. O zoom é um crop de ~2x na placa citada (corte seco, com uma aproximação
// lenta por dentro para a tela nunca ficar parada).
import { encaixar } from "../medida";
import type { MapaDoPlano, Mapa as MapaMomento } from "../plano";
import { COR, FONTE, FONTE_SCRIPT, MARGEM, prog } from "../tema";
import { Estrela } from "./Estrela";

const W = 1080;
const TOPO_PLACAS = 520;
const BASE_PLACAS = 1330;
const BLOCO = 270; // largura do bloco de texto de cada placa
const ALT = 190; // altura do bloco

// y de cada placa; as placas se alternam entre a esquerda e a direita da estrada
export const posicoes = (n: number) => {
  const passo = (BASE_PLACAS - TOPO_PLACAS - ALT) / Math.max(1, n - 1);
  return Array.from({ length: n }, (_, i) => ({ y: TOPO_PLACAS + (n === 1 ? 0 : i * Math.min(passo, 300)), passo, esq: i % 2 === 0, x: i % 2 === 0 ? 70 : 740 }));
};

// Caminho suave (Catmull-Rom → Bézier) pela estrada
const caminho = (pts: { x: number; y: number }[]) => {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
};

export const Infografico: React.FC<{ mapa: MapaDoPlano; foco?: number }> = ({ mapa, foco }) => {
  const n = mapa.placas.length;
  const pos = posicoes(n);
  const rotaTitulo = encaixar(mapa.titulo, { largura: W - 2 * MARGEM - 170, max: 80, min: 52, linhas: 3, fonte: { peso: 800, espacamento: -0.02 } });
  // a estrada: entra por cima, passa entre as placas (que ficam nas duas margens), sai por baixo
  const pts = [{ x: 540, y: 500 }, ...pos.map((p) => ({ x: p.esq ? 470 : 610, y: p.y + ALT / 2 })), { x: 540, y: 1780 }];
  const d = caminho(pts);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1920, background: COR.papel }}>
      <svg width={W} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: foco === undefined ? 1 : 0 }}>
        <path d={d} stroke={COR.estrada} strokeWidth={150} fill="none" strokeLinecap="butt" />
        <path d={d} stroke="#FFFFFF" strokeWidth={6} fill="none" strokeDasharray="34 28" />
      </svg>
      {/* título */}
      <div style={{ position: "absolute", left: MARGEM, top: 110, width: W - 2 * MARGEM - 170, opacity: foco === undefined ? 1 : 0 }}>
        <div style={{ position: "absolute", right: -120, top: -10 }}>
          <Estrela tamanho={150} />
        </div>
        <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: rotaTitulo.tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: COR.tinta }}>
          {rotaTitulo.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        {mapa.subtitulo ? (
          <div style={{ fontFamily: FONTE_SCRIPT, fontWeight: 700, fontSize: 74, color: COR.laranja, marginTop: 8, transform: "rotate(-2deg)", transformOrigin: "left center" }}>{mapa.subtitulo}</div>
        ) : null}
      </div>
      {/* placas: poste e disco numerado na beira da estrada, bloco empilhado (número, estrela, título, detalhe) */}
      {mapa.placas.map((p, i) => {
        const { y, esq, x } = pos[i];
        const num = String(i + 1).padStart(2, "0");
        const tt = encaixar(p.titulo, { largura: BLOCO, max: 38, min: 28, linhas: 2, fonte: { peso: 800 } });
        const dd = p.detalhe ? encaixar(p.detalhe, { largura: BLOCO, max: 25, min: 21, linhas: 2, fonte: { peso: 600 } }) : null;
        const roadX = pts[i + 1].x;
        const discoX = esq ? roadX - 75 - 18 : roadX + 75 + 18;
        return (
          <div key={i}>
            <div style={{ opacity: foco === undefined ? 1 : 0 }}>
            <div style={{ position: "absolute", left: discoX - 4, top: y + ALT / 2 + 10, width: 8, height: 100, background: COR.tinta, borderRadius: 4 }} />
            <div style={{ position: "absolute", left: discoX - 34, top: y + ALT / 2 - 50, width: 68, height: 68, borderRadius: 34, background: COR.tinta, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 34 }}>{i + 1}</div>
            </div>
            <div style={{ position: "absolute", left: x, top: y, width: BLOCO, height: ALT, opacity: foco === undefined || foco === i ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: 72, color: COR.cinzaClaro, letterSpacing: "-0.04em", lineHeight: 1 }}>{num}</div>
                <Estrela tamanho={52} />
              </div>
              <div style={{ marginTop: 8, fontFamily: FONTE, fontWeight: 800, fontSize: tt.tamanho, lineHeight: 1.08, color: COR.tinta, letterSpacing: "-0.015em" }}>
                {tt.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
              {dd ? (
                <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: dd.tamanho, lineHeight: 1.2, color: COR.cinza, marginTop: 4 }}>
                  {dd.linhas.map((l, k) => (
                    <div key={k}>{l}</div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const TelaMapa: React.FC<{ mapa: MapaDoPlano; m: MapaMomento; t: number }> = ({ mapa, m, t }) => {
  const dur = Math.max(0.01, m.ate - m.de);
  const lento = (t - m.de) / dur; // 0 → 1 durante o momento
  if (m.foco === undefined) {
    // visão geral: aproximação quase imperceptível
    const z = 1 + 0.02 * lento;
    return <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: "50% 40%" }}><Infografico mapa={mapa} /></div>;
  }
  const n = mapa.placas.length;
  const i = Math.min(n - 1, Math.max(0, m.foco));
  const { y, x, esq } = posicoes(n)[i];
  // corte de ~3,5x: o bloco da placa (número, estrela, título, detalhe) enche a largura e a estrada fica ao lado
  const cx = x + BLOCO / 2;
  const cy = y + ALT / 2 - 8;
  // 3,0 a 3,1x: o bloco (270 px) fica com ≥ 120 px de folga em cada lado (margem segura de 64 px)
  const Z = 3.0 + 0.1 * lento;
  // o bloco fica junto à margem do lado dele (≥ 64 px) e a beira da estrada aparece do outro lado
  const alvoX = esq ? 84 + (BLOCO / 2) * Z : 996 - (BLOCO / 2) * Z;
  const alvoY = 520;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1920, transformOrigin: `${cx}px ${cy}px`, transform: `translate(${alvoX - cx}px, ${alvoY - cy}px) scale(${Z})` }}>
        <Infografico mapa={mapa} foco={i} />
      </div>
    </div>
  );
};
