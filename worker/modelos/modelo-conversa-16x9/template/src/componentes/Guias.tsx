import type { Caixa } from "../motor/caixa";
import { ladoDoBalao, TOPO_DA_LEGENDA } from "../peito";
import type { Plano } from "../plano";
import { BASE_CONVERSA, BOLHA, CAMPO, COLUNA, CONVERSA_TOPO, emUnidades, fonte, LIMITE_APP, PILULA, QUADRO, W } from "../tema";

// Guias de conferência (só nos quadros de teste, nunca no vídeo final), no quadro deitado e em
// unidades da tela virtual (desenhadas dentro da camada reduzida a 0,8):
// rosto e linha do centro, a pílula do topo, as colunas dos balões do quadro cheio (as suas à
// direita da pessoa, as do outro lado à esquerda) com a linha do queixo, o campo da legenda, o quadro
// da conversa e a moldura da bolha (as telas do app), a caixa da pessoa naquele instante e a linha
// dos controles do player.
export const Guias: React.FC<{ plano: Plano; caixa: Caixa }> = ({ plano, caixa }) => {
  const x = emUnidades(plano.rosto.x * QUADRO.w);
  const y = emUnidades(plano.rosto.y * QUADRO.h);
  const eu = ladoDoBalao(plano, "eu", 0, plano.duracao);
  const outro = ladoDoBalao(plano, "cliente", 0, plano.duracao);
  const etiqueta: React.CSSProperties = {
    position: "absolute",
    fontFamily: fonte,
    fontWeight: 600,
    fontSize: 30,
    color: "#00E5FF",
    background: "rgba(0,0,0,0.6)",
    padding: "2px 10px",
    whiteSpace: "nowrap",
  };
  const bolhaX = emUnidades(BOLHA.cx - BOLHA.d / 2);
  const bolhaY = emUnidades(BOLHA.cy - BOLHA.d / 2);
  const bolhaD = emUnidades(BOLHA.d);
  return (
    <>
      <div style={{ position: "absolute", left: x - 60, top: y, width: 120, height: 3, background: "#00E5FF" }} />
      <div style={{ position: "absolute", left: x, top: y - 60, width: 3, height: 120, background: "#00E5FF" }} />
      <div style={{ ...etiqueta, left: x + 70, top: y - 18 }}>rosto</div>
      <div style={{ position: "absolute", left: W / 2 - 1, top: 0, bottom: 0, width: 2, background: "rgba(0,229,255,0.35)" }} />
      <div style={{ position: "absolute", left: (W - 1500) / 2, width: 1500, top: PILULA.topo, height: PILULA.altura, border: "3px dashed #FF9F1C", borderRadius: 50 }} />
      <div style={{ ...etiqueta, color: "#FF9F1C", left: (W - 1500) / 2 + 14, top: PILULA.topo + PILULA.altura + 6 }}>pílula do topo</div>
      {[
        { l: eu, nome: "balão seu (quadro cheio)" },
        { l: outro, nome: "balão do outro lado" },
      ].map(({ l, nome }) => (
        <div key={nome}>
          <div style={{ position: "absolute", left: l.x, width: l.w, top: l.topoMin, height: l.fim - l.topoMin, border: "3px dashed #00E5FF" }} />
          <div style={{ position: "absolute", left: l.x, width: l.w, top: l.yCentro, height: 3, background: "rgba(0,229,255,0.7)" }} />
          <div style={{ ...etiqueta, left: l.x + 10, top: l.topoMin + 8 }}>{nome}</div>
        </div>
      ))}
      <div style={{ ...etiqueta, left: eu.x + 10, top: eu.yCentro + 8 }}>linha do queixo</div>
      <div style={{ position: "absolute", left: (W - CAMPO.largura) / 2, width: CAMPO.largura, top: TOPO_DA_LEGENDA, height: CAMPO.base - TOPO_DA_LEGENDA, border: "3px dashed #FFD400", borderRadius: 54 }} />
      <div style={{ ...etiqueta, color: "#FFD400", left: (W - CAMPO.largura) / 2 + 14, top: TOPO_DA_LEGENDA - 44 }}>legenda (campo de texto)</div>
      <div style={{ position: "absolute", left: COLUNA.x, width: COLUNA.w, top: CONVERSA_TOPO, height: BASE_CONVERSA - CONVERSA_TOPO, border: "3px dotted #7CFF6B" }} />
      <div style={{ ...etiqueta, color: "#7CFF6B", left: COLUNA.x + 10, top: BASE_CONVERSA - 46 }}>quadro da conversa (tela do app)</div>
      <div style={{ position: "absolute", left: bolhaX, top: bolhaY, width: bolhaD, height: bolhaD, border: "3px dotted #7CFF6B", borderRadius: bolhaD }} />
      <div style={{ ...etiqueta, color: "#7CFF6B", left: bolhaX + 20, top: bolhaY + bolhaD + 10 }}>moldura (bolha)</div>
      <div
        style={{
          position: "absolute",
          left: emUnidades(caixa.x),
          top: emUnidades(caixa.y),
          width: emUnidades(caixa.w),
          height: emUnidades(caixa.h),
          border: "3px dashed #B78CFF",
          borderRadius: emUnidades(caixa.raio ?? 0),
        }}
      />
      <div style={{ ...etiqueta, color: "#B78CFF", left: emUnidades(caixa.x) + 20, top: emUnidades(caixa.y) + 20 }}>pessoa</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: LIMITE_APP, height: 3, background: "#FF3B6B" }} />
      <div style={{ ...etiqueta, color: "#FF3B6B", right: 20, top: LIMITE_APP + 8 }}>abaixo daqui: controles do player</div>
    </>
  );
};
