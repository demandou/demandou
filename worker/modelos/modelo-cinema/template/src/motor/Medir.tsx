// Parte do motor: desenha uma grade em porcentagem sobre um quadro da gravação original,
// para medir o rosto e o queixo antes do corte. Não entra no vídeo final.
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";

// `pontos` (opcional): marcas em frações da imagem — o rastreador usa para mostrar onde achou o rosto
export type PontoMedir = { x: number; y: number; rotulo?: string; cor?: string };

export const Medir: React.FC<{ imagem: string; largura: number; altura: number; pontos?: PontoMedir[] }> = ({ imagem, pontos }) => {
  const { width, height } = useVideoConfig();
  const marcas = Array.from({ length: 19 }, (_, i) => (i + 1) * 5);
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontWeight: 700,
    fontSize: Math.round(height / 42),
    color: "#00E5FF",
    background: "rgba(0,0,0,0.65)",
    padding: "1px 6px",
    lineHeight: 1.1,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img src={staticFile(imagem)} style={{ width, height }} />
      {marcas.map((m) => {
        const forte = m % 10 === 0;
        const linha = forte ? "rgba(0,229,255,0.85)" : "rgba(0,229,255,0.35)";
        return (
          <div key={m}>
            <div style={{ position: "absolute", left: `${m}%`, top: 0, bottom: 0, width: forte ? 2 : 1, background: linha }} />
            <div style={{ position: "absolute", top: `${m}%`, left: 0, right: 0, height: forte ? 2 : 1, background: linha }} />
            {forte ? (
              <>
                <div style={{ ...etiqueta, left: `calc(${m}% + 4px)`, top: 4 }}>{m / 100}</div>
                <div style={{ ...etiqueta, top: `calc(${m}% + 4px)`, left: 4 }}>{m / 100}</div>
              </>
            ) : null}
          </div>
        );
      })}
      {(pontos ?? []).map((p, i) => {
        const cor = p.cor ?? "#7CFC00";
        const r = Math.round(height / 40);
        return (
          <div key={`p${i}`}>
            <div style={{ position: "absolute", left: `calc(${p.x * 100}% - ${r}px)`, top: `calc(${p.y * 100}% - ${r}px)`, width: 2 * r, height: 2 * r, borderRadius: "50%", border: `3px solid ${cor}` }} />
            <div style={{ position: "absolute", left: `calc(${p.x * 100}% - ${2 * r}px)`, top: `calc(${p.y * 100}% - 1px)`, width: 4 * r, height: 2, background: cor }} />
            <div style={{ position: "absolute", left: `calc(${p.x * 100}% - 1px)`, top: `calc(${p.y * 100}% - ${2 * r}px)`, width: 2, height: 4 * r, background: cor }} />
            {p.rotulo ? <div style={{ ...etiqueta, color: cor, left: `calc(${p.x * 100}% + ${r + 6}px)`, top: `calc(${p.y * 100}% - ${r + 4}px)` }}>{p.rotulo}</div> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
