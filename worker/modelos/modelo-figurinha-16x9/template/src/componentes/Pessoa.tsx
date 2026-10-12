// A pessoa: o vídeo dentro da caixa do motor (rosto sempre enquadrado) e, quando ela vira
// figurinha, a moldura especial: recorte branco, borda índigo com um brilho que passa SÓ na borda,
// selo de estrela no canto e a faixa de nome sobre o peito. Nada brilha atrás dela.
import { type Caixa, VideoNaCaixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { BORDA_ESPECIAL, cor, rotulo, titulo } from "../tema";

const retangulo = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + rr} ${y} H${x + w - rr} A${rr} ${rr} 0 0 1 ${x + w} ${y + rr} V${y + h - rr} A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h} H${x + rr} A${rr} ${rr} 0 0 1 ${x} ${y + h - rr} V${y + rr} A${rr} ${rr} 0 0 1 ${x + rr} ${y} Z`;
};

const Estrela: React.FC<{ r: number }> = ({ r }) => {
  const pontos = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const raio = i % 2 === 0 ? r : r * 0.45;
    return `${(Math.cos(a) * raio).toFixed(2)},${(Math.sin(a) * raio).toFixed(2)}`;
  }).join(" ");
  return <polygon points={pontos} fill={cor.cartela} strokeLinejoin="round" stroke={cor.cartela} strokeWidth={r * 0.12} />;
};

export const Pessoa: React.FC<{
  plano: Plano;
  caixa: Caixa;
  videoAltura: number;
  inclinacao: number;
  // 0 = quadro cheio (sem moldura), 1 = figurinha
  figurinha: number;
  t: number;
}> = ({ plano, caixa, videoAltura, inclinacao, figurinha, t }) => {
  const B = BORDA_ESPECIAL;
  const W2 = caixa.w + 2 * B;
  const H2 = caixa.h + 2 * B;
  const r = caixa.raio ?? 0;
  const cx = caixa.x + caixa.w / 2;
  const cy = caixa.y + caixa.h / 2;
  // o brilho atravessa a borda a cada 3,2 s, levando 1,1 s
  const ciclo = (t % 3.2) / 1.1;
  const brilhoX = -0.35 * W2 + ciclo * 1.7 * W2;
  const temNome = !!plano.marca?.nome;
  const faixa = Math.round(Math.min(112, Math.max(92, caixa.h * 0.17)));
  return (
    <div style={{ position: "absolute", inset: 0, rotate: `${inclinacao}deg`, transformOrigin: `${cx}px ${cy}px` }}>
      {figurinha > 0.01 ? (
        // o papel branco da figurinha (por baixo do vídeo), com sombra curta de papel colado
        <div
          style={{
            position: "absolute",
            left: caixa.x - B,
            top: caixa.y - B,
            width: W2,
            height: H2,
            borderRadius: r + B,
            background: cor.branco,
            opacity: figurinha,
            boxShadow: `0 ${4 + 6 * figurinha}px ${10 + 8 * figurinha}px rgba(58,40,24,${0.2 * figurinha})`,
          }}
        />
      ) : null}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.04)" />
      {figurinha > 0.01 ? (
        <>
          {temNome ? (
            <div
              style={{
                position: "absolute",
                left: caixa.x,
                top: caixa.y + caixa.h - faixa,
                width: caixa.w,
                height: faixa,
                opacity: figurinha,
                background: cor.foil,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                borderBottomLeftRadius: r,
                borderBottomRightRadius: r,
              }}
            >
              <div style={{ ...titulo(Math.min(46, Math.floor((caixa.w - 40) / (plano.marca.nome.length * 0.6)))), color: cor.cartela, whiteSpace: "nowrap" }}>
                {plano.marca.nome}
              </div>
              {plano.marca.area ? <div style={{ ...rotulo(32), color: "#F6DE9C", whiteSpace: "nowrap" }}>{plano.marca.area}</div> : null}
            </div>
          ) : null}
          <svg
            width={W2}
            height={H2}
            viewBox={`0 0 ${W2} ${H2}`}
            style={{ position: "absolute", left: caixa.x - B, top: caixa.y - B, opacity: figurinha, overflow: "visible" }}
          >
            <defs>
              <linearGradient
                id="brilho-especial"
                gradientUnits="userSpaceOnUse"
                x1={brilhoX - 70}
                y1={0}
                x2={brilhoX + 70}
                y2={0}
                gradientTransform={`rotate(24 ${W2 / 2} ${H2 / 2})`}
              >
                <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
                <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.62} />
                <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* borda índigo (o "foil"), por cima da beirada do vídeo */}
            <path d={`${retangulo(7, 7, W2 - 14, H2 - 14, r + B - 7)} ${retangulo(B + 2, B + 2, caixa.w - 4, caixa.h - 4, r - 2)}`} fillRule="evenodd" fill={cor.foil} />
            <path d={`${retangulo(7, 7, W2 - 14, H2 - 14, r + B - 7)} ${retangulo(B + 2, B + 2, caixa.w - 4, caixa.h - 4, r - 2)}`} fillRule="evenodd" fill="url(#brilho-especial)" />
            <path d={retangulo(B + 2, B + 2, caixa.w - 4, caixa.h - 4, r - 2)} fill="none" stroke={cor.cartela} strokeWidth={2.5} opacity={0.85} />
            {/* selo de estrela: a figurinha especial do álbum */}
            <g transform={`translate(${B + 26} ${B + 26}) rotate(-12)`}>
              <circle r={40} fill={cor.branco} />
              <circle r={33} fill={cor.carimbo} />
              <Estrela r={19} />
            </g>
          </svg>
        </>
      ) : null}
    </div>
  );
};
