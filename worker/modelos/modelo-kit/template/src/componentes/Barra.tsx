import { cor } from "../tema";

// Barra de progresso no topo: uma fita de cobalto que enche com o vídeo.
export const Barra: React.FC<{ t: number; duracao: number }> = ({ t, duracao }) => {
  const p = Math.max(0, Math.min(1, t / Math.max(0.1, duracao - 0.2)));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 12, background: "rgba(255,253,247,0.45)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: 12, width: 1080 * p, background: cor.cobalto, borderRadius: "0 6px 6px 0" }} />
    </div>
  );
};
