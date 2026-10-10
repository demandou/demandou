// A pessoa num cartão-postal: moldura de papel em volta do vídeo, selo no canto e a assinatura
// embaixo. Em tela cheia a moldura some (borda zero); nas telas de mapa o postal viaja com a rota.
// O vídeo nunca desmonta (é ele que carrega a voz).
import { limitar } from "../anim";
import { type Caixa, VideoNaCaixa } from "../motor/caixa";
import { cor, display, sans, sombraPapel } from "../tema";

// selo postal com a borda picotada e um azulejo de quatro pétalas
export const Selo: React.FC<{ largura: number }> = ({ largura }) => {
  const w = largura;
  const h = largura * 1.2;
  const furos = (n: number, comprimento: number) => Array.from({ length: n }, (_, i) => ((i + 0.5) * comprimento) / n);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <rect x={0} y={0} width={w} height={h} fill={cor.papel} />
      {furos(6, w).map((x) => (
        <g key={`x${x}`}>
          <circle cx={x} cy={0} r={3.6} fill={cor.areia} />
          <circle cx={x} cy={h} r={3.6} fill={cor.areia} />
        </g>
      ))}
      {furos(7, h).map((y) => (
        <g key={`y${y}`}>
          <circle cx={0} cy={y} r={3.6} fill={cor.areia} />
          <circle cx={w} cy={y} r={3.6} fill={cor.areia} />
        </g>
      ))}
      <rect x={7} y={7} width={w - 14} height={h - 14} fill={cor.azulejoVeu} stroke={cor.azulejo} strokeWidth={2} />
      <g transform={`translate(${w / 2} ${h / 2})`}>
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d="M0 0 C 6 -6, 6 -16, 0 -20 C -6 -16, -6 -6, 0 0 Z" fill={cor.azulejo} transform={`rotate(${a})`} />
        ))}
        {[45, 135, 225, 315].map((a) => (
          <circle key={a} cx={0} cy={-15} r={2.6} fill={cor.sol} transform={`rotate(${a})`} />
        ))}
        <circle r={3.4} fill={cor.sol} />
      </g>
    </svg>
  );
};

export const PessoaNoPostal: React.FC<{
  video: string;
  // a caixa do vídeo (já misturada entre tela cheia e postal)
  caixa: Caixa;
  rosto: { x: number; y: number };
  videoAltura: number;
  // 0 = tela cheia, 1 = postal
  f: number;
  giro: number;
  borda: number;
  rodape: number;
  marca: { nome: string; area: string };
}> = ({ video, caixa, rosto, videoAltura, f, giro, borda, rodape, marca }) => {
  const b = borda * f;
  const rp = rodape * f;
  const moldura = { x: caixa.x - b, y: caixa.y - b, w: caixa.w + 2 * b, h: caixa.h + 2 * b + rp };
  const centro = { x: moldura.x + moldura.w / 2, y: moldura.y + moldura.h / 2 };
  const legenda = limitar((f - 0.72) / 0.28);
  const pequeno = moldura.w < 460;
  return (
    <div style={{ position: "absolute", inset: 0, rotate: `${giro * f}deg`, transformOrigin: `${centro.x}px ${centro.y}px` }}>
      {f > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: moldura.x,
            top: moldura.y,
            width: moldura.w,
            height: moldura.h,
            background: cor.papel,
            borderRadius: 6 * f,
            boxShadow: sombraPapel(f),
          }}
        />
      ) : null}
      <VideoNaCaixa src={video} caixa={caixa} rosto={rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.02)" />
      {f > 0.6 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: moldura.x + b + 4,
              width: moldura.w - 2 * b - 8,
              top: caixa.y + caixa.h + 4,
              height: rp - 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: legenda,
            }}
          >
            <div style={{ fontFamily: display, fontStyle: "italic", fontWeight: 600, fontSize: pequeno ? 42 : 48, color: cor.tinta, whiteSpace: "nowrap" }}>{marca.nome}</div>
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: pequeno ? 31 : 34, letterSpacing: "0.12em", textTransform: "uppercase", color: cor.azulejo, whiteSpace: "nowrap" }}>
              {marca.area}
            </div>
          </div>
          <div style={{ position: "absolute", left: caixa.x + caixa.w - (pequeno ? 50 : 62), top: caixa.y - (pequeno ? 14 : 18), opacity: legenda, rotate: "5deg" }}>
            <Selo largura={pequeno ? 58 : 70} />
          </div>
        </>
      ) : null}
    </div>
  );
};
