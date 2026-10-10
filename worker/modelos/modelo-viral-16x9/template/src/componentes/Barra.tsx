import { QUADRO } from "../layout";
import { cor } from "../tema";

// Barra de progresso no topo: enche com o vídeo (retenção: quem vê, sabe quanto falta).
export const Barra: React.FC<{ t: number; duracao: number }> = ({ t, duracao }) => {
  const p = Math.max(0, Math.min(1, t / Math.max(0.1, duracao - 0.2)));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: QUADRO.w, height: 10, background: "rgba(255,255,255,0.24)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: QUADRO.w * p, background: cor.tarja, borderRadius: "0 5px 5px 0" }} />
    </div>
  );
};
