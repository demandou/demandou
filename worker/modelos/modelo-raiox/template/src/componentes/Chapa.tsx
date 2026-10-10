// A chapa de raio-x: negativo azulado, mais escuro nas bordas, com grão de filme e uma faixa de
// identificação embaixo (marcador de chumbo "D", recorte e número), como um filme de verdade.
import { cor, marcacao } from "../tema";

export const FAIXA = 58;

export const Chapa: React.FC<{
  largura: number;
  altura: number;
  id: string;
  // texto da faixa de identificação ("PERFIL · CERVICAL")
  identificacao?: string;
  // número da chapa ("01")
  numero?: string;
  // sem faixa (miniaturas)
  semFaixa?: boolean;
  children?: React.ReactNode;
  estilo?: React.CSSProperties;
}> = ({ largura, altura, id, identificacao, numero, semFaixa, children, estilo }) => {
  const faixa = semFaixa ? 0 : FAIXA;
  return (
    <div
      style={{
        position: "absolute",
        width: largura,
        height: altura,
        borderRadius: 6,
        overflow: "hidden",
        background: `radial-gradient(ellipse 75% 70% at 50% 45%, ${cor.chapaCentro} 0%, ${cor.chapa} 58%, ${cor.chapaBorda} 100%)`,
        boxShadow: "0 0 0 1px rgba(5,12,19,0.9)",
        ...estilo,
      }}
    >
      {/* grão do filme (fixo) */}
      <svg width={largura} height={altura} style={{ position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "screen" }}>
        <filter id={`grao-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={0.55} />
          </feComponentTransfer>
        </filter>
        <rect width={largura} height={altura} filter={`url(#grao-${id})`} />
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: largura, height: altura - faixa }}>{children}</div>
      {semFaixa ? null : (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: faixa,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "0 26px",
            background: "rgba(3,8,13,0.72)",
            borderTop: "1px solid rgba(228,244,251,0.12)",
          }}
        >
          <div
            style={{
              ...marcacao,
              fontSize: 32,
              fontWeight: 700,
              color: cor.osso,
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${cor.osso}`,
              borderRadius: 4,
              letterSpacing: 0,
              opacity: 0.85,
            }}
          >
            D
          </div>
          <div style={{ ...marcacao, fontSize: 32, color: cor.textoSuave, flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>{identificacao}</div>
          {numero ? <div style={{ ...marcacao, fontSize: 32, color: cor.textoSuave, marginRight: 50 }}>{numero}</div> : null}
        </div>
      )}
    </div>
  );
};

// Presilha do negatoscópio segurando a chapa pela borda de cima
export const Presilha: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div
    style={{
      position: "absolute",
      left: x - 34,
      top: y - 13,
      width: 68,
      height: 24,
      borderRadius: 6,
      background: "linear-gradient(to bottom, #2A3946, #141E28)",
      boxShadow: "0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
    }}
  />
);
