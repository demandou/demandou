// A pessoa como chapa iluminada: aro escuro e uma borda de luz fria em volta do vídeo (a luz fica
// na moldura, nunca atrás da pessoa), e a faixa de identificação na base com nome e área.
import type { Caixa } from "../motor/caixa";
import { ARO, cor, LUZ, marcacao } from "../tema";

export const MolduraAtras: React.FC<{ caixa: Caixa; presenca: number; luz: number }> = ({ caixa, presenca, luz }) => {
  if (presenca < 0.02) return null;
  const r = (caixa.raio ?? 0) + LUZ;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: caixa.x - LUZ - ARO,
          top: caixa.y - LUZ - ARO,
          width: caixa.w + 2 * (LUZ + ARO),
          height: caixa.h + 2 * (LUZ + ARO),
          borderRadius: r + ARO,
          background: `linear-gradient(160deg, ${cor.aroClaro} 0%, ${cor.aro} 40%, #0C141C 100%)`,
          boxShadow: "0 14px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
          opacity: presenca,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: caixa.x - LUZ,
          top: caixa.y - LUZ,
          width: caixa.w + 2 * LUZ,
          height: caixa.h + 2 * LUZ,
          borderRadius: r,
          background: "#16212B",
          opacity: presenca,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: r,
            opacity: luz,
            background: `linear-gradient(180deg, #F2F9FC 0%, ${cor.luz} 60%, #B7CCD6 100%)`,
          }}
        />
      </div>
    </>
  );
};

export const MolduraFrente: React.FC<{ caixa: Caixa; presenca: number; marca: { nome: string; area: string } }> = ({ caixa, presenca, marca }) => {
  if (presenca < 0.02 || (!marca.nome && !marca.area)) return null;
  const altura = marca.nome && marca.area ? 96 : 62;
  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x,
        top: caixa.y + caixa.h - altura,
        width: caixa.w,
        height: altura,
        borderBottomLeftRadius: caixa.raio ?? 0,
        borderBottomRightRadius: caixa.raio ?? 0,
        background: "linear-gradient(to bottom, rgba(3,8,13,0.55), rgba(3,8,13,0.9))",
        borderTop: "1px solid rgba(228,244,251,0.18)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 6,
        padding: "0 16px",
        opacity: Math.max(0, (presenca - 0.55) / 0.45),
        overflow: "hidden",
      }}
    >
      {marca.nome ? (
        <div style={{ ...marcacao, fontSize: 32, fontWeight: 700, color: cor.texto, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{marca.nome}</div>
      ) : null}
      {marca.area ? (
        <div style={{ ...marcacao, fontSize: 32, fontWeight: 500, color: cor.ciano, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{marca.area}</div>
      ) : null}
    </div>
  );
};
