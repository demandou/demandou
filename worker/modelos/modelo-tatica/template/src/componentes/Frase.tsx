// Frase: tarja de TV na altura do peito com uma frase falada (regra, virada, dado), etiqueta opcional.
import { conteudoDaTarja, indicesDoTrecho, Linhas, prog, saidaDaTarja, saindo, temposDoTexto, varredura } from "../anim";
import type { Frase as FraseT, Palavra } from "../plano";
import { diagramar } from "../medidas";
import { cor, larga, rotulo } from "../tema";

const L = 960;

export const Frase: React.FC<{ m: FraseT; palavras: Palavra[]; t: number; topo: number; fim: number }> = ({ m, palavras, t, topo, fim }) => {
  const pTarja = prog(t, m.de, 0.36);
  const s = saindo(t, fim, 0.28);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de + 0.05);
  const { linhas, tam } = diagramar(m.texto.toUpperCase(), { largura: L - 116, maximo: 84, minimo: 52, linhas: 3, linhasMax: 4, altura: 340, entrelinha: 1.06 });
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const risco = indicesDoTrecho(m.texto, m.risco);
  const pRisco = m.riscoEm !== undefined ? prog(t, m.riscoEm - 0.05, 0.4) : 0;
  return (
    <div style={{ position: "absolute", left: 60, top: topo + 14, width: L, ...saidaDaTarja(s) }}>
      {m.rotulo ? (
        <div style={{ position: "relative", display: "inline-flex", padding: "14px 26px" }}>
          <div style={{ position: "absolute", inset: 0, background: cor.placar, borderRadius: "8px 8px 0 0", clipPath: varredura(pTarja, 8) }} />
          <span style={{ ...rotulo, fontSize: 36, color: cor.tv, position: "relative", ...conteudoDaTarja(pTarja) }}>{m.rotulo}</span>
        </div>
      ) : null}
      <div style={{ position: "relative", padding: "44px 56px 48px 60px" }}>
        <div style={{ position: "absolute", inset: 0, clipPath: varredura(pTarja), filter: "drop-shadow(0 22px 40px rgba(0,0,0,0.34))" }}>
          <div style={{ position: "absolute", inset: 0, background: cor.tv, borderRadius: m.rotulo ? "0 12px 12px 12px" : 12 }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: cor.placar, borderRadius: m.rotulo ? "0 0 0 12px" : "12px 0 0 12px" }} />
        </div>
        <div style={{ position: "relative", ...conteudoDaTarja(pTarja) }}>
          <Linhas linhas={linhas} tempos={tempos} t={t} fantasma={0.16} corDe={(i) => (risco.has(i) && pRisco > 0 ? cor.gizSuave : destaque.has(i) ? cor.placar : undefined)} riscadas={risco} pRisco={pRisco} corRisco={cor.placar} style={{ ...larga, fontSize: tam, color: cor.giz, gap: tam * 0.07 }} />
        </div>
      </div>
    </div>
  );
};
