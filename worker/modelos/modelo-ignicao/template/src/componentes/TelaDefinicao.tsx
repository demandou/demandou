// Bloco "definicao" (modo retrovisor da direita, como a parada): o termo acende grande no painel ao
// lado do retrovisor (o mesmo vidro do painel da condição, com a fileira de luzes no alto); quando o
// significado começa a ser dito, um traço desce do painel até a tela central e o significado acende
// lá, palavra por palavra — como o manual de bordo explicando uma luz.
import { Acende, prog, saindo, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { Definicao, Palavra } from "../plano";
import { cor, rotulo, texto } from "../tema";
import { Vidro, type Parte } from "./Painel";
import { CONDICAO } from "./TelaParada";

const TELA = { x: 60, y: 800, w: 960, h: 352 };

export const TelaDefinicao: React.FC<{ m: Definicao; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  if (parte === "fora") {
    const termo = diagramar(m.termo, { largura: CONDICAO.w - 56, maximo: 84, minimo: 48, linhas: 3, altura: 300, entrelinha: 1.02, peso: 700 });
    const tTermo = temposDoTexto(m.termo, palavras, m.de, m.significadoEm, m.em - 0.05);
    const desce = prog(t, m.significadoEm - 0.15, 0.35);
    const xTraco = CONDICAO.x + CONDICAO.w / 2;
    return (
      <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
        <Vidro r={CONDICAO} raio={26}>
          <div style={{ position: "absolute", left: 28, top: 186, width: CONDICAO.w - 56, height: CONDICAO.h - 212, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={rotulo(32, { color: t >= m.em - 0.05 ? cor.aco : cor.apagado, marginBottom: 16 })}>Termo</div>
            <Acende linhas={termo.linhas} tempos={tTermo} t={t} entrelinha={1.02} style={texto(700, termo.tam, { textTransform: "uppercase" })} />
          </div>
        </Vidro>
        {/* o traço do painel até a tela central, com a ponta de seta */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={xTraco} y1={CONDICAO.y + CONDICAO.h + 8} x2={xTraco} y2={TELA.y - 4} stroke={cor.apagado} strokeWidth={5} strokeDasharray="8 8" />
          {desce > 0.002 ? (
            <line x1={xTraco} y1={CONDICAO.y + CONDICAO.h + 8} x2={xTraco} y2={CONDICAO.y + CONDICAO.h + 8 + (TELA.y - 12 - CONDICAO.y - CONDICAO.h) * desce} stroke={cor.marfim} strokeWidth={6} strokeLinecap="round" />
          ) : null}
        </svg>
      </div>
    );
  }
  const sig = diagramar(m.significado, { largura: TELA.w - 100, maximo: 84, minimo: 44, linhas: 3, altura: TELA.h - 116, entrelinha: 1.04, peso: 700 });
  const tSig = temposDoTexto(m.significado, palavras, m.significadoEm - 0.3, m.ate, m.significadoEm - 0.05);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      <div style={{ position: "absolute", left: TELA.x + 50, top: TELA.y + 36, width: TELA.w - 100, height: TELA.h - 72, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={rotulo(32, { color: t >= m.significadoEm - 0.05 ? cor.aco : cor.apagado, marginBottom: 16 })}>Significa</div>
        <Acende linhas={sig.linhas} tempos={tSig} t={t} entrelinha={1.04} style={texto(700, sig.tam, { textTransform: "uppercase" })} />
      </div>
    </div>
  );
};
