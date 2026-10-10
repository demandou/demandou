import { Video } from "@remotion/media";
import { staticFile } from "remotion";
import type { EstadoOcular } from "../ceu";
import { ANEL, cor, H, sans, W } from "../tema";

// A pessoa na ocular: o MESMO vídeo do começo ao fim (é dele que sai a voz). Em tela cheia o círculo
// é maior que o quadro; na carta ele se fecha como uma íris em volta do rosto e vira uma janela redonda
// escura, com anel graduado que gira um pouco a cada troca (como focar um telescópio).
export const PessoaNaOcular: React.FC<{
  video: string;
  estado: EstadoOcular;
  rosto: { x: number; y: number };
  videoAltura: number;
  assinatura: string;
  // a camada de tela cheia (degradê e textos no peito): fica dentro da íris, então o próprio círculo a
  // apaga quando a ocular fecha e a revela quando ela abre
  children?: React.ReactNode;
}> = ({ video, estado, rosto, videoAltura, assinatura, children }) => {
  const { cx, cy, R, z, rx, ry, janela, giro } = estado;
  const vw = W * z;
  const vh = videoAltura * z;
  const left = rx - rosto.x * vw;
  const top = ry - ((rosto.y * H) / videoAltura) * vh;
  const recorte = `circle(${R}px at ${cx}px ${cy}px)`;
  const rTexto = R + ANEL + 24;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, clipPath: recorte, overflow: "hidden" }}>
        <Video
          src={staticFile(video)}
          objectFit="fill"
          style={{ position: "absolute", left, top, width: vw, height: vh, filter: `saturate(${1 - 0.06 * janela}) contrast(1.03)` }}
        />
        {children}
        {/* borda escura de ocular, por dentro do círculo */}
        {janela > 0 ? (
          <div
            style={{
              position: "absolute",
              left: cx - R,
              top: cy - R,
              width: 2 * R,
              height: 2 * R,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(4,5,14,0) 72%, rgba(4,5,14,0.55) 100%)",
              opacity: janela,
            }}
          />
        ) : null}
      </div>
      {janela > 0 ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: janela, overflow: "visible" }}>
          <defs>
            <path id="arco-assinatura" d={`M ${cx - rTexto} ${cy} A ${rTexto} ${rTexto} 0 0 1 ${cx + rTexto} ${cy}`} />
          </defs>
          {/* sombra curta do tubo (escura, para baixo — não é brilho) */}
          <circle cx={cx} cy={cy + 8} r={R + ANEL} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={10} />
          <circle cx={cx} cy={cy} r={R + ANEL / 2} fill="none" stroke={cor.ceuAlto} strokeWidth={ANEL} />
          <circle cx={cx} cy={cy} r={R + 1} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={R + ANEL} fill="none" stroke={cor.ceuBorda} strokeWidth={2} />
          <g transform={`rotate(${giro} ${cx} ${cy})`} stroke={cor.textoSuave} strokeLinecap="round">
            {Array.from({ length: 72 }).map((_, i) => {
              const a = (i * 5 * Math.PI) / 180;
              const longo = i % 6 === 0;
              const r1 = R + ANEL - 4;
              const r2 = r1 - (longo ? 13 : 7);
              return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2} strokeWidth={longo ? 2.4 : 1.4} opacity={longo ? 0.9 : 0.6} />;
            })}
          </g>
          {/* marca vermelha fixa embaixo do anel (o índice do focalizador) */}
          <path d={`M ${cx - 9} ${cy + R + ANEL + 4} L ${cx + 9} ${cy + R + ANEL + 4} L ${cx} ${cy + R + ANEL - 10} Z`} fill={cor.lanterna} />
          {assinatura ? (
            <text fontFamily={sans} fontWeight={700} fontSize={30} letterSpacing="0.2em" fill={cor.textoSuave}>
              <textPath href="#arco-assinatura" startOffset="50%" textAnchor="middle">
                {assinatura.toUpperCase()}
              </textPath>
            </text>
          ) : null}
        </svg>
      ) : null}
    </>
  );
};
