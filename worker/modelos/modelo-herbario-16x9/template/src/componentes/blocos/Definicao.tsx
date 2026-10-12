// `definicao`: a determinação de um espécime. O termo é o título da prancha, em itálico verde-musgo,
// como um nome científico; no corpo, um raminho prensado preso por fitas de linho e, ao lado, a
// etiqueta de herbário (filete duplo) com o significado, que se escreve na fala. Uma linha-guia
// numerada liga o raminho à etiqueta quando o significado começa a ser dito.
import { limitar, prog, temposDoTexto, Traco } from "../../anim";
import { Fita, naCurva, ramoPrensado, Ramo } from "../../desenhos/Ramo";
import { encaixar } from "../../medida";
import type { Definicao as DefinicaoT } from "../../plano";
import { cor, traco, versalete } from "../../tema";
import { CabecalhoDoBloco, type PropsDoBloco } from "../Bloco";
import { TextoNaFala } from "../Pecas";

const RAMO_X = 196;
const BASE = 1490;
const ALTURA = 760;
const CARTAO = { x: 400, w: 610 };

export const Definicao: React.FC<PropsDoBloco & { m: DefinicaoT }> = ({ m, t, palavras, chegada, layout, numeroFig }) => {
  const lapis = 1;
  const tinta = prog(t, m.em - 0.1, 1.3, (v) => v);
  const ramo = ramoPrensado(RAMO_X, BASE, ALTURA, 6, (i) => limitar(tinta * 1.8 - i * 0.12), { curva: 52, tamanho: 1.05 });
  const fitas = prog(t, m.em + 0.7, 0.4);
  const p0 = { x: RAMO_X, y: BASE };
  const ponto = naCurva(p0, { x: RAMO_X + 52 * 0.2, y: BASE - ALTURA * 0.35 }, { x: RAMO_X + 52, y: BASE - ALTURA * 0.7 }, { x: RAMO_X + 52 * 0.6, y: BASE - ALTURA }, 0.5);

  const e = encaixar(m.significado, { largura: CARTAO.w - 76, max: 84, min: 50, linhas: 4, fonte: "serif" });
  const tempos = temposDoTexto(e.linhas.join(" "), palavras, m.significadoEm, Math.max(m.ate, m.significadoEm + 1.5), m.significadoEm);
  const alturaCartao = 40 + 44 + 30 + e.linhas.length * e.tamanho * 1.04 + 56;
  const topoCartao = Math.max(760, Math.min(1500 - alturaCartao, ponto.y - alturaCartao / 2 + 40));
  const borda = prog(t, m.significadoEm - 0.25, 0.4);
  const fio = prog(t, m.significadoEm - 0.15, 0.4);
  const yFio = Math.min(topoCartao + alturaCartao - 30, Math.max(topoCartao + 30, ponto.y));

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Ramo caule={ramo.caule} pCaule={limitar(tinta * 1.5)} folhas={ramo.folhas} lapis={lapis} />
        <Fita x={RAMO_X + 6} y={BASE - ALTURA * 0.16} ang={-24} p={fitas} w={110} />
        <Fita x={RAMO_X + 46} y={BASE - ALTURA * 0.66} ang={18} p={fitas} w={110} />
        {/* linha-guia do raminho à etiqueta */}
        <line x1={ponto.x + 12} y1={ponto.y} x2={CARTAO.x} y2={yFio} stroke={cor.grafiteClaro} strokeWidth={traco.cabelo} strokeDasharray="3 7" opacity={lapis * (1 - fio)} />
        <Traco d={`M ${ponto.x + 12} ${ponto.y} L ${CARTAO.x - 26} ${yFio} L ${CARTAO.x} ${yFio}`} p={fio} cor={cor.tinta} largura={traco.fino} />
        <circle cx={ponto.x} cy={ponto.y} r={12} fill={cor.etiqueta} fillOpacity={0.7} stroke={fio > 0.1 ? cor.musgo : cor.grafite} strokeWidth={traco.medio} />
        <circle cx={ponto.x} cy={ponto.y} r={5} fill={fio > 0.1 ? cor.musgo : cor.grafite} />
      </svg>
      {/* a etiqueta de herbário: filete duplo, "significado" em versalete, o texto que se escreve */}
      <div
        style={{
          position: "absolute",
          left: CARTAO.x,
          top: topoCartao,
          width: CARTAO.w,
          height: alturaCartao,
          boxSizing: "border-box",
          background: borda > 0 ? cor.etiqueta : "rgba(244,244,236,0.55)",
          border: `2.5px solid ${borda > 0.5 ? cor.tinta : cor.grafiteClaro}`,
          boxShadow: borda > 0.5 ? "0 6px 14px rgba(20,28,22,0.10)" : "none",
        }}
      >
        <div style={{ position: "absolute", inset: 10, border: `1.2px solid ${borda > 0.5 ? cor.tinta : cor.grafiteClaro}`, opacity: 0.6 }} />
        <div style={{ position: "absolute", left: 34, right: 34, top: 34 }}>
          <div
            style={{
              fontFamily: versalete,
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: borda > 0.5 ? cor.musgo : cor.grafite,
              lineHeight: 1.2,
            }}
          >
            Significado
          </div>
          <div style={{ height: 2, background: borda > 0.5 ? cor.tinta : cor.grafiteClaro, opacity: 0.7, margin: "10px 0 22px" }} />
          <TextoNaFala linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} lapis={lapis} entrelinha={1.04} />
        </div>
      </div>
      <CabecalhoDoBloco
        t={t}
        palavras={palavras}
        chegada={chegada}
        layout={layout}
        numeroFig={numeroFig}
        de={m.de}
        ate={m.ate}
        rotulo={m.rotulo ?? "Definição"}
        titulo={m.termo}
        tituloEm={m.em}
        italico
      />
    </>
  );
};
