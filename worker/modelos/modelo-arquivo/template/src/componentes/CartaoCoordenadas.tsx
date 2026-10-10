import { Datilo, preciso, prog } from "../anim";
import type { Coordenadas } from "../plano";
import { caber, cor, mono, rotulo, sans } from "../tema";

// Mira de coordenadas: círculos e cruz que se desenham e fecham no alvo
const Mira: React.FC<{ t: number; em: number; tamanho: number }> = ({ t, em, tamanho }) => {
  const p = prog(t, em + 0.1, 0.8, preciso);
  const trava = prog(t, em + 0.8, 0.35);
  const r = tamanho / 2 - 4;
  const circ = 2 * Math.PI * r;
  const traco = (x1: number, y1: number, x2: number, y2: number, k: number) => {
    const comprimento = Math.hypot(x2 - x1, y2 - y1);
    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={cor.claro}
        strokeOpacity={0.55}
        strokeWidth={2.5}
        strokeDasharray={`${comprimento * prog(t, em + 0.05 * k, 0.6, preciso)} ${comprimento}`}
      />
    );
  };
  const c = tamanho / 2;
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ overflow: "visible", flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={cor.claro} strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray={`${circ * p} ${circ}`} transform={`rotate(-90 ${c} ${c})`} />
      <circle cx={c} cy={c} r={r * 0.55} fill="none" stroke={cor.claro} strokeOpacity={0.3} strokeWidth={2} strokeDasharray={`${circ * 0.55 * p} ${circ}`} />
      {traco(c, 0, c, tamanho, 0)}
      {traco(0, c, tamanho, c, 1)}
      {/* o anel vermelho fecha no alvo */}
      <circle cx={c} cy={c} r={r * (1 - 0.8 * trava)} fill="none" stroke={cor.vermelho} strokeWidth={4} opacity={trava > 0 ? 1 : 0} />
      <circle cx={c} cy={c} r={7} fill={cor.vermelho} opacity={trava} />
    </svg>
  );
};

// Cartão preto de coordenadas: nome do lugar, latitude e longitude datilografadas, mira que trava.
export const CartaoCoordenadas: React.FC<{
  c: Coordenadas;
  t: number;
  largura: number;
  rotuloTopo?: string;
  grande?: boolean;
}> = ({ c, t, largura, rotuloTopo = "Coordenadas", grande = false }) => {
  const mira = grande ? 230 : 140;
  const larguraTexto = largura - 64 - mira - 28;
  const local = c.local.toUpperCase();
  const tamLocal = caber(local, larguraTexto, grande ? 60 : 52, 0.68, 44);
  const tamCoord = caber(c.lat, larguraTexto, grande ? 64 : 56, 0.6, 44);
  return (
    <div style={{ width: largura, background: cor.tinta, padding: "28px 32px 30px", display: "flex", flexDirection: "column", gap: grande ? 22 : 16 }}>
      <div style={{ ...rotulo, color: cor.vermelho, display: "flex", justifyContent: "space-between" }}>
        <span>{rotuloTopo}</span>
        <span style={{ color: cor.claro, opacity: 0.45 }}>LAT · LON</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: grande ? 14 : 10, width: larguraTexto }}>
          <div style={{ fontFamily: sans, fontWeight: 700, fontSize: tamLocal, lineHeight: 1.05, color: cor.claro, letterSpacing: "0.02em" }}>
            <Datilo texto={local} em={c.em + 0.1} t={t} semente={21} />
          </div>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: tamCoord, lineHeight: 1.1, color: cor.claro }}>
            <Datilo texto={c.lat} em={c.em + 0.35} t={t} semente={22} />
          </div>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: tamCoord, lineHeight: 1.1, color: cor.claro }}>
            <Datilo texto={c.lon} em={c.em + 0.62} t={t} semente={23} />
          </div>
        </div>
        <Mira t={t} em={c.em} tamanho={mira} />
      </div>
    </div>
  );
};
