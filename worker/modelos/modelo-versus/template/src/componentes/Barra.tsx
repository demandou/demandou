import { cor } from "../tema";

// Barra de progresso no topo: enche com o vídeo (retenção: quem vê, sabe quanto falta).
export const Barra: React.FC<{ t: number; duracao: number }> = ({ t, duracao }) => {
  const p = Math.max(0, Math.min(1, t / Math.max(0.1, duracao - 0.2)));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 12, background: "rgba(255,255,255,0.24)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 12, width: 1080 * p, background: `linear-gradient(90deg, ${cor.a}, ${cor.b})`, borderRadius: "0 6px 6px 0" }} />
    </div>
  );
};
