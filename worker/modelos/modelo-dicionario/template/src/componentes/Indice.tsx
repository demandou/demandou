import { prog } from "../anim";
import { cor, serif } from "../tema";

// Índice de dedo (as abas cortadas na borda do dicionário): uma aba por palavra do vídeo.
// Entram uma a uma na abertura e a aba da página atual sai para fora e ganha a cor da capa.
export type Aba = { texto: string; de: number; ate: number };

const TOPO_ABAS = 300;
const LARGURA = 56;

export const Indice: React.FC<{ abas: Aba[]; t: number; entraEm: number }> = ({ abas, t, entraEm }) => {
  if (abas.length === 0) return null;
  const altura = Math.min(132, Math.floor(860 / abas.length) - 14);
  return (
    <>
      {abas.map((a, i) => {
        const entra = prog(t, entraEm + i * 0.12, 0.4);
        const ativa = prog(t, a.de, 0.3) * (1 - prog(t, a.ate, 0.3));
        const fora = 12 * ativa;
        const x = 1080 - (LARGURA + fora) * entra;
        return (
          <div
            key={`${a.texto}-${i}`}
            style={{
              position: "absolute",
              left: x,
              top: TOPO_ABAS + i * (altura + 14),
              width: LARGURA + 30,
              height: altura,
              borderRadius: "14px 0 0 14px",
              background: ativa > 0.5 ? cor.ameixa : cor.ameixaClara,
              boxShadow: "0 2px 6px rgba(27,26,31,0.18)",
              display: "flex",
              alignItems: "center",
              paddingLeft: 8,
            }}
          >
            <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 32, lineHeight: 1, color: ativa > 0.5 ? cor.claro : cor.ameixa }}>{a.texto}</span>
          </div>
        );
      })}
    </>
  );
};
