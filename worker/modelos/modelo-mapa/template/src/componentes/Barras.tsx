// Barras: a frase falada no alto; no meio, duas barras de duração que crescem no tempo da fala (a
// fraca a lápis, curta; a forte em marca-texto, que passa da borda da tela); embaixo, ao lado do
// cartão da pessoa, um cartão de anotação com o nó ("conteúdo") que recebe um alfinete.
import { caneta, Escrita, indicesDoTrecho, prog, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { Barras as TBarras, Palavra } from "../plano";
import { cor, MARGEM, sans, serifa, titulo as estiloTitulo, W } from "../tema";

export const NOTA = { x: 566, y: 1060, w: 394, h: 360 };
const LARGURA_TODA = 900;

export const Barras: React.FC<{ m: TBarras; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const d = diagramar(m.texto, { largura: 960, maximo: 96, minimo: 60, linhas: 3, altura: 262 });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const pNota = prog(t, m.de - 0.3, 0.4);
  const pPino = m.fixaEm !== undefined ? prog(t, m.fixaEm, 0.32, caneta) : 1;
  const passo = m.barras.length > 2 ? 128 : 170;
  // as barras começam logo abaixo da frase (que tem de 1 a 3 linhas)
  const Y_BARRAS = 176 + d.linhas.length * d.tamanho * 1.04 + 44;
  // o nome do nó cabe no cartão de anotação (até 2 linhas, de 64 a 40 px)
  const dNo = m.no ? diagramar(m.no, { largura: NOTA.w - 72, maximo: 64, minimo: 40, linhas: 2 }) : null;

  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: 176 }}>
        <Escrita linhas={d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={d.tamanho} destaque={destaque} entrelinha={1.04} />
      </div>
      {m.barras.map((b, i) => {
        const y = Y_BARRAS + i * passo;
        const p = prog(t, b.em, b.forte ? 0.95 : 0.5, caneta);
        const larguraFinal = Math.min(W + 40 - MARGEM, b.valor * LARGURA_TODA);
        const passa = b.valor * LARGURA_TODA > W - MARGEM - 60;
        const visto = t >= b.em - 0.05;
        return (
          <div key={`b-${i}`}>
            <div style={{ position: "absolute", left: MARGEM, top: y, fontFamily: sans, fontWeight: b.forte ? 700 : 600, fontSize: 40, color: visto ? (b.forte ? cor.tinta : cor.tintaSuave) : cor.lapis }}>{b.texto}</div>
            {/* trilho a lápis: onde a barra vai crescer */}
            <div style={{ position: "absolute", left: MARGEM, top: y + 62, width: W - MARGEM, height: 60, borderRadius: 14, border: `4px dashed ${cor.lapis}`, borderRight: "none", opacity: 0.75 }} />
            <div
              style={{
                position: "absolute",
                left: MARGEM,
                top: y + 62,
                width: Math.max(0, larguraFinal * p),
                height: 60,
                borderRadius: 14,
                background: b.forte ? cor.marca : cor.lapisClaro,
                border: `${b.forte ? 5 : 4}px solid ${b.forte ? cor.tinta : cor.lapis}`,
                borderRight: passa && p > 0.9 ? "none" : undefined,
                opacity: p > 0 ? 1 : 0,
              }}
            />
            {passa && p > 0.85 ? (
              <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
                {[0, 1].map((k) => (
                  <path
                    key={k}
                    d={`M ${W - 120 + k * 34} ${y + 74} L ${W - 98 + k * 34} ${y + 92} L ${W - 120 + k * 34} ${y + 110}`}
                    fill="none"
                    stroke={cor.tinta}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={prog(t, b.em + 0.75 + k * 0.08, 0.2)}
                  />
                ))}
              </svg>
            ) : null}
          </div>
        );
      })}
      {/* eixo do tempo: um ponto por dia */}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        {Array.from({ length: 22 }, (_, k) => (
          <circle key={k} cx={MARGEM + 10 + k * 44} cy={Y_BARRAS + m.barras.length * passo + 4} r={4} fill={cor.lapis} />
        ))}
      </svg>
      {m.eixo ? <div style={{ position: "absolute", left: MARGEM, top: Y_BARRAS + m.barras.length * passo + 24, fontFamily: sans, fontWeight: 600, fontSize: 34, color: cor.lapis }}>{m.eixo} →</div> : null}

      {m.no ? (
        <>
          {/* cartão de anotação com o alfinete */}
          <div
            style={{
              position: "absolute",
              left: NOTA.x,
              top: NOTA.y,
              width: NOTA.w,
              height: NOTA.h,
              borderRadius: 22,
              background: cor.cartao,
              boxShadow: cor.sombra,
              opacity: 0.3 + 0.7 * pNota,
              rotate: `${(-3 * (1 - pPino)).toFixed(2)}deg`,
              padding: "64px 36px 0",
            }}
          >
            <div style={{ fontFamily: serifa, fontWeight: 800, fontSize: dNo?.tamanho ?? 64, color: cor.tinta, lineHeight: 1.05 }}>
              {dNo?.linhas.map((l) => <div key={l}>{l}</div>)}
            </div>
            {[0, 1, 2, 3].map((k) => (
              <div key={k} style={{ height: 6, borderRadius: 3, background: k < 3 ? cor.lapisClaro : "transparent", marginTop: k === 0 ? 40 : 34, width: `${[92, 78, 86, 0][k]}%` }} />
            ))}
          </div>
          <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
            <g transform={`translate(0 ${(-70 * (1 - pPino)).toFixed(1)})`} opacity={pPino}>
              <line x1={NOTA.x + NOTA.w / 2} y1={NOTA.y - 10} x2={NOTA.x + NOTA.w / 2 + 6} y2={NOTA.y + 26} stroke={cor.tinta} strokeWidth={6} strokeLinecap="round" />
              <circle cx={NOTA.x + NOTA.w / 2} cy={NOTA.y - 22} r={28} fill={cor.marca} stroke={cor.tinta} strokeWidth={6} />
            </g>
          </svg>
        </>
      ) : null}
    </>
  );
};
