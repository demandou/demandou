// A lupa: uma lente redonda que amplia de verdade a impressão do rótulo embaixo dela,
// com aro de tinta, cabo, o número do campo e a linha-guia que desce até a ficha.
import type { Camera, EstadoDaLupa } from "../layout";
import type { Medidor } from "../medida";
import type { Plano } from "../plano";
import { cor, display, LUPA } from "../tema";
import { ImpressaoDoRotulo } from "./Rotulo";

export const Lupa: React.FC<{
  estado: EstadoDaLupa;
  // a câmera sobre o rótulo: a lupa está no rótulo e anda junto com ele
  camera: Camera;
  plano: Plano;
  medir: Medidor;
  // o cabo é desenhado por baixo da ficha (entra "debaixo do papel"); a lente, por cima de tudo
  parte: "cabo" | "lente";
  numero?: number;
  // 0→1: a linha-guia até a ficha
  guia: number;
  fichaTopo: number;
}> = ({ estado, camera, plano, medir, parte, numero, guia, fichaTopo }) => {
  const { ampliacao: m, presenca } = estado;
  // tudo em coordenadas da tela
  const x = estado.x * camera.s + camera.tx;
  const y = estado.y * camera.s + camera.ty;
  const R = estado.raio * camera.s;
  if (presenca <= 0.001) return null;
  // o cabo aponta para fora do camafeu: para baixo e à esquerda nos cartuchos da esquerda,
  // para baixo e à direita no resto (e entra por baixo da ficha)
  const angulo = LUPA.angulo + 93 * Math.min(1, Math.max(0, (420 - estado.x) / 120));
  const a = (angulo * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  // pontos do cabo: anel (virola) logo depois do aro, depois o cabo
  const p0 = { x: x + ux * (R + 2), y: y + uy * (R + 2) };
  const p1 = { x: x + ux * (R + 34), y: y + uy * (R + 34) };
  const p2 = { x: x + ux * (R + 34 + LUPA.cabo), y: y + uy * (R + 34 + LUPA.cabo) };
  const badge = { x: x + Math.cos((-135 * Math.PI) / 180) * R, y: y + Math.sin((-135 * Math.PI) / 180) * R };
  const guiaTopo = y + R + 4;
  const banda = estado.faixa * camera.s * m + 10;
  const veu = "rgba(244,238,227,0.82)";
  const veu0 = "rgba(244,238,227,0)";
  const guiaFim = guiaTopo + (fichaTopo - guiaTopo) * guia;

  if (parte === "cabo") {
    return (
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, presenca * 1.6) }}>
        <line x1={p1.x + 4} y1={p1.y + 14} x2={p2.x + 4} y2={p2.y + 14} stroke="rgba(33,27,24,0.16)" strokeWidth={34} strokeLinecap="round" />
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={cor.tinta} strokeWidth={34} strokeLinecap="round" />
        <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={cor.vinho} strokeWidth={26} />
      </svg>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, presenca * 1.6) }}>
      {/* linha-guia até a ficha */}
      {guia > 0 && fichaTopo - guiaTopo > 6 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={x} x2={x} y1={guiaTopo} y2={guiaFim} stroke={cor.vinho} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
          {guia > 0.98 ? <circle cx={x} cy={fichaTopo} r={7} fill={cor.vinho} /> : null}
        </svg>
      ) : null}

      {/* sombra macia do objeto sobre o papel */}
      <div
        style={{
          position: "absolute",
          left: x - R,
          top: y - R,
          width: R * 2,
          height: R * 2,
          borderRadius: "50%",
          boxShadow: "0 18px 34px rgba(33,27,24,0.28)",
        }}
      />
      {/* o que a lente mostra: a impressão do rótulo ampliada em volta do centro */}
      <div style={{ position: "absolute", inset: 0, clipPath: `circle(${R}px at ${x}px ${y}px)` }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${x}px ${y}px`, scale: String(m) }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.s})` }}>
            <ImpressaoDoRotulo plano={plano} medir={medir} />
          </div>
        </div>
        {/* foco: a linha examinada fica nítida; o resto do que a lente mostra fica velado */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${veu} ${y - banda - 18}px, ${veu0} ${y - banda}px, ${veu0} ${y + banda}px, ${veu} ${y + banda + 18}px)`,
          }}
        />
        {/* a borda da lente escurece um pouco: é vidro, não brilho */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle ${R}px at ${x}px ${y}px, rgba(33,27,24,0) 72%, rgba(33,27,24,0.16) 100%)`,
          }}
        />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* reflexo discreto do vidro */}
        <path
          d={`M ${x - R * 0.62} ${y - R * 0.38} A ${R * 0.74} ${R * 0.74} 0 0 1 ${x - R * 0.2} ${y - R * 0.7}`}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <circle cx={x} cy={y} r={R} fill="none" stroke={cor.tinta} strokeWidth={9} />
        <circle cx={x} cy={y} r={R - 8} fill="none" stroke={cor.vinho} strokeWidth={2.5} />
        {numero ? (
          <g>
            <circle cx={badge.x} cy={badge.y} r={27} fill={cor.vinho} stroke={cor.papel} strokeWidth={4} />
            <text
              x={badge.x}
              y={badge.y + 12}
              textAnchor="middle"
              fontFamily={display}
              fontSize={36}
              fill={cor.papel}
              style={{ fontVariantNumeric: "lining-nums" }}
            >
              {numero}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
};
