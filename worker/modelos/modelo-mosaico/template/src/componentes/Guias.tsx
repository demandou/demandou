import type { Ret } from "../grade";
import type { Plano } from "../plano";
import { LIMITE_APP, sans } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o rosto (em tela cheia),
// cada bloco da grade com a letra dele, o bloco da pessoa e o limite da interface do app.
export const Guias: React.FC<{ plano: Plano; pessoa: Ret; cheio: number; blocos: { letra: string; ret: Ret }[] }> = ({ plano, pessoa, cheio, blocos }) => {
  const x = plano.rosto.x * 1080;
  const y = plano.rosto.y * 1920;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 700,
    fontSize: 26,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  return (
    <>
      {cheio > 0.9 ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
        </>
      ) : null}
      {blocos.map((b) => (
        <div key={b.letra}>
          <div style={{ position: "absolute", left: b.ret.x, top: b.ret.y, width: b.ret.w, height: b.ret.h, border: "3px dashed #FF8C00" }} />
          <div style={{ ...etiqueta, color: "#FF8C00", left: b.ret.x + 10, top: b.ret.y + 10 }}>{b.letra}</div>
        </div>
      ))}
      <div style={{ position: "absolute", left: pessoa.x, top: pessoa.y, width: pessoa.w, height: pessoa.h, border: "3px solid #7CFC00" }} />
      <div style={{ ...etiqueta, color: "#7CFC00", left: pessoa.x + 10, top: pessoa.y + 10 }}>p · pessoa</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: interface do app</div>
    </>
  );
};
