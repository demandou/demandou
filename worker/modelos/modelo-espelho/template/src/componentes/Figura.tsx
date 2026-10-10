// Uma figura da biblioteca (figuras.ts) desenhada como o rosto: traço café fino, metade e reflexo
// juntos, do centro para fora. Sobre ela, o mapeamento (círculos vazados nas vagas que vão acender,
// ligados por um tracejado dourado) e os pontos numerados: cada um acende no seu tempo com o véu
// dourado pontilhado (revelado em círculo a partir do ponto) e o círculo se enche com o número.
import { useMemo } from "react";
import { entra, mistura, prog, Traco } from "../anim";
import type { DefFigura } from "../figuras";
import { cor, sans } from "../tema";
import { espelhar, ROSTO_H, ROSTO_W } from "./Rosto";

export type PontoAceso = { vaga: number; em: number; numero: number };

// raio do círculo numerado (no desenho de 400 × 540)
const RAIO = 26;

export const DesenhoFigura: React.FC<{
  def: DefFigura;
  t: number;
  desenhoEm: number;
  pontos: PontoAceso[];
  mapeamentoEm?: number;
  escala: number;
  peso?: number;
  // nome da figura (só para os ids do SVG não se repetirem entre figuras)
  nome?: string;
}> = ({ def, t, desenhoEm, pontos, mapeamentoEm, escala, peso = 1, nome = "fig" }) => {
  const larguras = { contorno: 3.4 * peso, detalhe: 2.6 * peso, fino: 2 * peso };
  const id = useMemo(() => `${nome}${Math.round(desenhoEm * 1000)}-${Math.round(escala * 100)}`, [nome, desenhoEm, escala]);
  const acesos = pontos.filter((p) => t >= p.em - 0.02);
  const foco = acesos[acesos.length - 1];
  const mapa = mapeamentoEm !== undefined ? prog(t, mapeamentoEm, 0.8) : 0;

  return (
    <svg
      width={ROSTO_W * escala}
      height={ROSTO_H * escala}
      viewBox={`0 0 ${ROSTO_W} ${ROSTO_H}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      <defs>
        <pattern id={`${id}-pont`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r={1.25 * Math.min(1.6, peso)} fill={cor.ouro} />
        </pattern>
      </defs>

      {/* vagas acesas: véu dourado + pontilhado + contorno tracejado, revelados em círculo */}
      {acesos.map((a) => {
        const vaga = def.vagas[a.vaga];
        const p = prog(t, a.em, 0.7);
        const clip = `${id}-c-${a.vaga}`;
        return (
          <g key={`v${a.vaga}`} opacity={a === foco ? 1 : 0.62}>
            <clipPath id={clip}>
              <circle cx={vaga.ponto[0]} cy={vaga.ponto[1]} r={mistura(4, 160, p)} />
            </clipPath>
            <g clipPath={`url(#${clip})`}>
              <path d={vaga.forma} fill={cor.ouroVeu} />
              <path d={vaga.forma} fill={`url(#${id}-pont)`} />
              <path d={vaga.forma} fill="none" stroke={cor.ouro} strokeWidth={larguras.fino} strokeDasharray="5 5" />
            </g>
          </g>
        );
      })}

      {/* os traços, metade e reflexo juntos */}
      {def.partes.map((parte, i) => {
        const p = prog(t, desenhoEm + parte.ordem * 0.9, parte.dur, entra);
        const larg = larguras[parte.peso];
        const c = parte.ouro ? cor.ouro : cor.cafe;
        return (
          <g key={i} opacity={parte.opacidade ?? 1}>
            <Traco d={parte.d} p={p} cor={c} largura={larg} tracejado={parte.tracejado} />
            {parte.espelho === false ? null : <Traco d={espelhar(parte.d)} p={p} cor={c} largura={larg} tracejado={parte.tracejado} />}
          </g>
        );
      })}

      {/* mapeamento: as vagas que vão acender, ligadas por um tracejado dourado, cada uma com o seu
          círculo vazado (o esboço do número) */}
      {mapa > 0 ? (
        <g opacity={mapa}>
          {pontos.slice(1).map((p, i) => {
            const [x1, y1] = def.vagas[pontos[i].vaga].ponto;
            const [x2, y2] = def.vagas[p.vaga].ponto;
            return (
              <Traco
                key={`l${i}`}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                p={prog(t, (mapeamentoEm ?? 0) + i * 0.08, 0.5)}
                cor={cor.ouro}
                largura={2.1 * peso}
                tracejado="4 7"
                opacity={acesos.length ? mistura(1, 0.55, prog(t, acesos[0].em, 0.5)) : 1}
              />
            );
          })}
          {pontos.map((p) => {
            const [x, y] = def.vagas[p.vaga].ponto;
            return <circle key={`p${p.vaga}`} cx={x} cy={y} r={RAIO} fill={cor.champanhe} stroke={cor.ouro} strokeWidth={2.2} />;
          })}
        </g>
      ) : null}

      {/* cada ponto aceso: o círculo dourado se enche com o número, em cima do véu */}
      {acesos.map((a) => {
        const [px, py] = def.vagas[a.vaga].ponto;
        const pm = prog(t, a.em, 0.45);
        return (
          <g key={`m${a.vaga}`} opacity={a === foco ? 1 : 0.75} transform={`translate(${px} ${py})`}>
            <circle r={RAIO} fill={cor.champanhe} stroke={cor.ouro} strokeWidth={2.2} />
            <circle r={RAIO * pm} fill={cor.ouro} />
            <text textAnchor="middle" dominantBaseline="central" y={1} opacity={prog(t, a.em + 0.15, 0.3)} style={{ fontFamily: sans, fontWeight: 500, fontSize: 31, fill: cor.champanhe }}>
              {a.numero}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
