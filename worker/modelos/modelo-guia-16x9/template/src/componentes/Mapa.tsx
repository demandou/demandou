// A assinatura 1: o infográfico-estrada, na versão deitada. Título e subtítulo no alto, uma estrada
// que atravessa o quadro da esquerda para a direita (ondulando de leve) com as placas numeradas em
// fileira, alternando acima e abaixo dela, em ordem da esquerda para a direita. A estrada entra pela
// borda da esquerda e segue por trás da pessoa (sai pela direita). O zoom é um crop de ~2,5x no bloco
// da placa citada (corte seco, com uma aproximação lenta por dentro para a tela nunca ficar parada);
// no zoom, a estrada e as outras placas somem.
// Tudo em px LÓGICOS (a camada das telas: 1080 de largura, conteúdo entre y 96 e ~910; ver tema.ts).
import { encaixar } from "../medida";
import type { MapaDoPlano, Mapa as MapaMomento } from "../plano";
import { COR, FONTE, FONTE_SCRIPT, LOGICO, MARGEM } from "../tema";
import { Estrela } from "./Estrela";

const W = LOGICO.w;
// a faixa útil das placas (entre as margens)
const X0 = MARGEM;
const X1 = W - MARGEM;
// a estrada: centro, largura do asfalto e quanto ela ondula em cada placa
const ESTRADA_Y = 620;
const ASFALTO = 96;
const ONDA = 20;
// os blocos das placas: acima da estrada terminam em BASE_CIMA; abaixo começam em TOPO_BAIXO
const BASE_CIMA = 528;
const TOPO_BAIXO = 732;
const ALT = 206;
const VAO_BLOCOS = 40;
// o disco numerado na beira da estrada e o poste até o bloco
const DISCO = 56;

// A largura do bloco: cabe na fileira (o vizinho da mesma fileira fica a duas placas de distância).
export const larguraDoBloco = (n: number) => {
  if (n <= 1) return 320;
  const util = X1 - X0;
  return Math.floor(Math.min(320, (2 * util / (n - 1) - VAO_BLOCOS) / (1 + 2 / (n - 1))));
};

// x do bloco, centro do disco e onde a estrada passa em cada placa
export const posicoes = (n: number) => {
  const B = larguraDoBloco(n);
  const passo = n <= 1 ? 0 : (X1 - X0 - B) / (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const cima = i % 2 === 0;
    const x = n <= 1 ? (W - B) / 2 : X0 + i * passo;
    const cx = x + B / 2;
    // a estrada se afasta um pouco do bloco (desce sob a placa de cima, sobe sob a de baixo)
    const ey = ESTRADA_Y + (cima ? ONDA : -ONDA);
    const discoY = cima ? ey - ASFALTO / 2 - 4 : ey + ASFALTO / 2 + 4;
    const y = cima ? BASE_CIMA - ALT : TOPO_BAIXO;
    return { x, y, cx, ey, discoY, cima, B };
  });
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
  const B = larguraDoBloco(n);
  const larguraTitulo = X1 - X0 - 170;
  const rotaTitulo = encaixar(mapa.titulo, { largura: larguraTitulo, max: 64, min: 44, linhas: 2, fonte: { peso: 800, espacamento: -0.02 } });
  // a estrada: entra pela borda da esquerda, passa entre as fileiras e segue por trás da pessoa
  const pts = [{ x: -160, y: ESTRADA_Y }, ...pos.map((p) => ({ x: p.cx, y: p.ey })), { x: X1 + 140, y: ESTRADA_Y }, { x: 1900, y: ESTRADA_Y }];
  const d = caminho(pts);
  const geral = foco === undefined ? 1 : 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1000 }}>
      <svg width={W} height={1000} style={{ position: "absolute", left: 0, top: 0, opacity: geral, overflow: "visible" }}>
        <path d={d} stroke={COR.estrada} strokeWidth={ASFALTO} fill="none" strokeLinecap="butt" />
        <path d={d} stroke="#FFFFFF" strokeWidth={5} fill="none" strokeDasharray="30 24" />
      </svg>
      {/* título */}
      <div style={{ position: "absolute", left: X0, top: 96, width: larguraTitulo, opacity: geral }}>
        <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: rotaTitulo.tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: COR.tinta }}>
          {rotaTitulo.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        {mapa.subtitulo ? (
          <div style={{ fontFamily: FONTE_SCRIPT, fontWeight: 700, fontSize: 60, lineHeight: 1.05, color: COR.laranja, marginTop: 4, transform: "rotate(-2deg)", transformOrigin: "left center" }}>{mapa.subtitulo}</div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: X1 - 130, top: 92, opacity: geral }}>
        <Estrela tamanho={130} />
      </div>
      {/* placas: disco numerado na beira da estrada, poste até o bloco (número, estrela, título, detalhe) */}
      {mapa.placas.map((p, i) => {
        const { x, y, cx, discoY, cima } = pos[i];
        const num = String(i + 1).padStart(2, "0");
        const tt = encaixar(p.titulo, { largura: B, max: 36, min: 26, linhas: 2, fonte: { peso: 800 } });
        const dd = p.detalhe ? encaixar(p.detalhe, { largura: B, max: 24, min: 20, linhas: 2, fonte: { peso: 600 } }) : null;
        // o poste liga o disco ao bloco
        const posteTopo = cima ? BASE_CIMA : discoY;
        const posteBase = cima ? discoY : TOPO_BAIXO;
        return (
          <div key={i}>
            <div style={{ opacity: geral }}>
              <div style={{ position: "absolute", left: cx - 4, top: posteTopo, width: 8, height: Math.max(0, posteBase - posteTopo), background: COR.tinta, borderRadius: 4 }} />
              <div style={{ position: "absolute", left: cx - DISCO / 2, top: discoY - DISCO / 2, width: DISCO, height: DISCO, borderRadius: DISCO / 2, background: COR.tinta, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 30, boxShadow: "0 0 0 5px #FFFFFF" }}>{i + 1}</div>
            </div>
            <div style={{ position: "absolute", left: x, top: y, width: B, height: ALT, display: "flex", flexDirection: "column", justifyContent: cima ? "flex-end" : "flex-start", opacity: foco === undefined || foco === i ? 1 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: 56, color: COR.cinzaClaro, letterSpacing: "-0.04em", lineHeight: 1 }}>{num}</div>
                <Estrela tamanho={46} />
              </div>
              <div style={{ marginTop: 6, fontFamily: FONTE, fontWeight: 800, fontSize: tt.tamanho, lineHeight: 1.08, color: COR.tinta, letterSpacing: "-0.015em" }}>
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
  const lento = Math.min(1, Math.max(0, (t - m.de) / dur)); // 0 → 1 durante o momento
  if (m.foco === undefined) {
    // visão geral: aproximação quase imperceptível
    const z = 1 + 0.02 * lento;
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1000, transform: `scale(${z})`, transformOrigin: "40% 55%" }}>
        <Infografico mapa={mapa} />
      </div>
    );
  }
  const n = mapa.placas.length;
  const i = Math.min(n - 1, Math.max(0, m.foco));
  const { x, y } = posicoes(n)[i];
  const B = larguraDoBloco(n);
  // corte de ~2,5x: o bloco da placa (número, estrela, título, detalhe) fica grande no meio do quadro,
  // com folga nas margens (largura ≤ 760 px lógicos, altura ≤ 560)
  const cx = x + B / 2;
  const cy = y + ALT / 2;
  const Z0 = Math.min(3.1, 760 / B, 560 / ALT);
  const Z = Z0 * (1 + 0.04 * lento);
  const alvoX = W / 2;
  const alvoY = 500;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1000 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1000, transformOrigin: `${cx}px ${cy}px`, transform: `translate(${alvoX - cx}px, ${alvoY - cy}px) scale(${Z})` }}>
        <Infografico mapa={mapa} foco={i} />
      </div>
    </div>
  );
};
