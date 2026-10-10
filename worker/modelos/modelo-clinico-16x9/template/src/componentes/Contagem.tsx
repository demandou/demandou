import { prog, saindo, Traco } from "../anim";
import type { Areas } from "../layout";
import type { Contagem as ContagemT, Palavra } from "../plano";
import { caber, cor, QUADRO, sans } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { pSelo, Selo } from "./Selo";

// Contagem: círculos numerados (pequenas lupas) que se desenham quando a contagem é dita.
export const Contagem: React.FC<{ m: ContagemT; t: number; fim: number; areas: Areas; palavras: Palavra[] }> = ({ m, t, fim, areas, palavras }) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const { corpo } = areas;
  const n = m.itens.length;
  const d = Math.min(260, (corpo.w - (n - 1) * 44) / n);
  const temTexto = m.itens.some((i) => i.texto);
  const cy = corpo.y + (corpo.h - (temTexto ? 70 : 0)) / 2;
  const passo = d + 44;
  // o nome embaixo de cada círculo cabe na largura dele
  const textoTam = Math.min(44, ...m.itens.map((i) => (i.texto ? caber(i.texto, passo - 10, 44, 30, 700) : 44)));
  // os círculos ficam centrados no corpo (no quadro deitado, o quadro da esquerda)
  const x0 = corpo.x + corpo.w / 2 - ((n - 1) * passo) / 2;
  return (
    <>
      <Cabecalho
        area={areas.cabecalho}
        titulo={m.titulo}
        enfase={m.enfase}
        palavras={palavras}
        de={m.de}
        ate={m.ate}
        t={t}
        fim={fim}
        alinhar="centro"
        maxLinhas={2}
        maximo={80}
      />
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
        {m.itens.map((it, i) => {
          const cx = x0 + i * passo;
          const r = d / 2;
          const anel = prog(t, it.em, 0.6);
          const num = prog(t, it.em + 0.12, 0.45);
          // antes da contagem, os lugares já estão marcados (tracejados), para o corpo nunca ficar vazio
          const lugar = prog(t, m.de + i * 0.08, 0.35);
          if (lugar <= 0) return null;
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={r * (0.9 + 0.1 * lugar)}
                fill="none"
                stroke={cor.azul}
                strokeOpacity={0.45}
                strokeWidth={3.5}
                strokeDasharray="2 14"
                strokeLinecap="round"
                opacity={lugar * (1 - anel)}
                transform={`rotate(${t * 12} ${cx} ${cy})`}
              />
              <circle cx={cx} cy={cy} r={r} fill={cor.branco} opacity={anel} />
              <Traco d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`} p={anel} cor={cor.azul} largura={4.5} />
              <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke={cor.azul} strokeOpacity={0.18 * anel} strokeWidth={2} />
              <text
                x={cx}
                y={cy + (1 - num) * 30}
                textAnchor="middle"
                dominantBaseline="central"
                opacity={num}
                style={{ fontFamily: sans, fontWeight: 800, fontSize: d * 0.46, fill: cor.tinta, letterSpacing: "-0.02em" }}
              >
                {i + 1}
              </text>
              {it.texto ? (
                <text
                  x={cx}
                  y={cy + r + 56}
                  textAnchor="middle"
                  opacity={prog(t, it.em + 0.25, 0.4)}
                  style={{ fontFamily: sans, fontWeight: 700, fontSize: textoTam, fill: cor.tinta }}
                >
                  {it.texto}
                </text>
              ) : null}
              {m.marca ? (
                <Selo cx={cx + r * 0.72} cy={cy - r * 0.72} r={38} tipo={m.marca.tipo} p={pSelo(t, m.marca.em + i * 0.12)} />
              ) : null}
            </g>
          );
        })}
      </svg>
    </>
  );
};
