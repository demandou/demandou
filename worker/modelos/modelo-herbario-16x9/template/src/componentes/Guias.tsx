import { CABECALHO, FUNDO_CONTEUDO, type Layout } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { LEGENDA_Y, LIMITE_APP, PRANCHA, QUADRO, sans } from "../tema";

// px da camada da prancha → px da tela
const naTela = (r: { x: number; y: number; w: number; h: number }) => ({
  x: PRANCHA.x + r.x * PRANCHA.escala,
  y: PRANCHA.y + r.y * PRANCHA.escala,
  w: r.w * PRANCHA.escala,
  h: r.h * PRANCHA.escala,
});
// o quadro do desenho (a camada de x 40 a 1040, do alto do desenho ao fundo do conteúdo)
const QUADRO_DO_DESENHO = naTela({ x: 40, y: 556, w: 1000, h: FUNDO_CONTEUDO + 30 - 556 });

// Guias de conferência (só nos quadros de teste, nunca no vídeo final): o rosto, a linha do centro,
// o oval da pessoa, o cabeçalho (coluna da direita) e o quadro do desenho (esquerda), a faixa dos
// cartões de tela cheia, a legenda e o limite de baixo (controles do player).
export const Guias: React.FC<{
  plano: Plano;
  zona: { esquerda: number; direita: number; topo: number; altura: number };
  caixa: Caixa;
  layout: Layout;
}> = ({ plano, zona, caixa, layout }) => {
  const x = plano.rosto.x * QUADRO.w;
  const y = plano.rosto.y * QUADRO.h;
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: sans,
    fontWeight: 700,
    fontSize: 24,
    color: "#00B8D4",
    background: "rgba(0,0,0,0.65)",
    padding: "2px 10px",
  };
  const cheio = caixa.w > QUADRO.w - 10;
  const cab = layout === "canto" || layout === "lado" ? naTela(CABECALHO[layout]) : null;
  return (
    <>
      {cheio ? (
        <>
          <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
          <div style={{ position: "absolute", left: QUADRO.w / 2 - 1, top: 0, width: 1.5, height: QUADRO.h, background: "rgba(0,229,255,0.5)" }} />
          <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
          <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, height: zona.altura, border: "3px dashed #00E5FF" }} />
          <div style={{ ...etiqueta, left: zona.esquerda, top: zona.topo - 38 }}>cartão em tela cheia · topo {zona.topo}</div>
        </>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: caixa.x,
          top: caixa.y,
          width: caixa.w,
          height: caixa.h,
          borderRadius: cheio ? 0 : "50%",
          border: "3px solid #7CFC00",
        }}
      />
      <div style={{ ...etiqueta, color: "#7CFC00", left: caixa.x + caixa.w / 2 - 50, top: caixa.y + 12 }}>pessoa</div>
      {cab ? (
        <>
          <div style={{ position: "absolute", left: cab.x, top: cab.y, width: cab.w, height: cab.h, border: "3px dashed #FF8C00" }} />
          <div style={{ ...etiqueta, color: "#FF8C00", left: cab.x + 6, top: cab.y + cab.h - 38 }}>cabeçalho</div>
          <div
            style={{
              position: "absolute",
              left: QUADRO_DO_DESENHO.x,
              top: QUADRO_DO_DESENHO.y,
              width: QUADRO_DO_DESENHO.w,
              height: QUADRO_DO_DESENHO.h,
              border: "3px dashed #E040FB",
            }}
          />
          <div style={{ ...etiqueta, color: "#E040FB", left: QUADRO_DO_DESENHO.x + 10, top: QUADRO_DO_DESENHO.y + QUADRO_DO_DESENHO.h - 40 }}>desenho</div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: 300, right: 300, top: LEGENDA_Y, height: 74, border: "3px dashed #FFD400" }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: 300, top: LEGENDA_Y - 36 }}>legenda</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 60, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
