import { mistura, Traco } from "../anim";
import type { RetMapa } from "../layout";
import type { Etapa } from "../respiro";
import { cor, mao, serif } from "../tema";

const NOMES = { sobe: "inspira", plano: "segura", desce: "solta" } as const;

// O mapa do respiro: a linha sobe (inspira), anda no alto (segura) e desce (solta), cada etapa
// do tamanho da sua contagem. Começa a lápis; cada etapa ganha tinta quando o número é dito,
// e um ponto de damasco anda por ela. Grande na abertura, pequeno ao lado das notas nas fases.
export const Mapa: React.FC<{
  ret: RetMapa;
  etapas: Etapa[];
  faixas: { de: number; ate: number }[];
  tinta: number[];
  ponto: number;
  ativa: number;
  opacidade: number;
  opacidadePonto?: number;
}> = ({ ret, etapas, faixas, tinta, ponto, ativa, opacidade, opacidadePonto = 1 }) => {
  if (opacidade <= 0.01 || ret.w < 20 || !etapas.length) return null;
  const { x, y, w, h, grande } = ret;
  // nível de cada vértice: 0 = embaixo, 1 = no alto
  const niveis = [0];
  etapas.forEach((e) => niveis.push(e.forma === "sobe" ? 1 : e.forma === "desce" ? 0 : niveis[niveis.length - 1]));
  const pt = (frac: number, nivel: number): [number, number] => [x + frac * w, y + h - nivel * h];
  const vertices = [pt(0, niveis[0]), ...faixas.map((f, i) => pt(f.ate, niveis[i + 1]))];
  const lapis = `M ${vertices.map((v) => v.join(" ")).join(" L ")}`;
  const segmento = (i: number) => `M ${vertices[i].join(" ")} L ${vertices[i + 1].join(" ")}`;

  // ponto no caminho
  let i = faixas.findIndex((f) => ponto <= f.ate + 1e-6);
  if (i < 0) i = faixas.length - 1;
  const local = (ponto - faixas[i].de) / Math.max(1e-6, faixas[i].ate - faixas[i].de);
  const px = mistura(vertices[i][0], vertices[i + 1][0], local);
  const py = mistura(vertices[i][1], vertices[i + 1][1], local);

  const tamNumero = mistura(64, 104, grande);
  const tamNome = 64;
  const largTraco = mistura(5.5, 6.5, grande);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: opacidade }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={lapis} fill="none" stroke={cor.lapis} strokeWidth={3.5} strokeDasharray="3 13" strokeLinecap="round" strokeLinejoin="round" />
        {/* linha de base, a lápis, para a altura ter referência */}
        <line x1={x} y1={y + h} x2={x + w} y2={y + h} stroke={cor.lapis} strokeWidth={2} opacity={0.6} />
        {etapas.map((_, k) => (
          <Traco
            key={k}
            d={segmento(k)}
            p={tinta[k]}
            cor={k === ativa ? cor.tinta : cor.tinta}
            largura={k === ativa ? largTraco + 2 : largTraco}
            opacity={ativa >= 0 && k !== ativa ? 0.42 : 1}
          />
        ))}
        {tinta[0] > 0.01 || ativa >= 0 ? (
          <g opacity={opacidadePonto}>
            <circle cx={px} cy={py} r={mistura(18, 23, grande)} fill={cor.damasco} />
            <circle cx={px} cy={py} r={mistura(18, 23, grande)} fill="none" stroke={cor.tinta} strokeWidth={3.5} />
          </g>
        ) : null}
      </svg>
      {etapas.map((e, k) => {
        const meio = x + ((faixas[k].de + faixas[k].ate) / 2) * w;
        const acesa = Math.max(tinta[k], 0);
        const destaque = ativa < 0 || k === ativa;
        const topoNumero = mistura(y + h + 16, y - tamNumero * 1.12, grande);
        return (
          <div key={k}>
            <div
              style={{
                position: "absolute",
                left: meio - 120,
                width: 240,
                top: topoNumero,
                textAlign: "center",
                fontFamily: serif,
                fontWeight: 500,
                fontSize: tamNumero,
                lineHeight: 1,
                color: acesa > 0.05 && destaque ? cor.tinta : cor.lapis,
                opacity: destaque ? 1 : 0.55,
              }}
            >
              {e.n}
            </div>
            {grande > 0.75 ? (
              <div
                style={{
                  position: "absolute",
                  left: meio - 170,
                  width: 340,
                  top: y + h + 10,
                  textAlign: "center",
                  fontFamily: mao,
                  fontWeight: 600,
                  fontSize: tamNome,
                  lineHeight: 1,
                  color: cor.tintaSuave,
                  // os nomes só cabem no mapa grande: somem logo que ele começa a encolher
                  opacity: ((grande - 0.75) / 0.25) * (0.35 + 0.65 * acesa),
                }}
              >
                {e.nome ?? NOMES[e.forma]}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
