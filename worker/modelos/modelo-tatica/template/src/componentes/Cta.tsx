// Fechamento: tarja de nome (como a de um entrevistado na TV) e, embaixo, a faixa amarela com a
// chamada falada, palavra por palavra, e o "+" que gira para virar um visto quando a frase termina.
import { conteudoDaTarja, indicesDoTrecho, Linhas, prog, saidaDaTarja, saindo, temposDoTexto, Traco, varredura } from "../anim";
import type { Cta as CtaT, Palavra, Plano } from "../plano";
import { diagramar, medir } from "../medidas";
import { cor, larga, rotulo } from "../tema";

const L = 960;

export const Cta: React.FC<{ m: CtaT; marca: Plano["marca"]; palavras: Palavra[]; t: number; topo: number; fim: number }> = ({
  m,
  marca,
  palavras,
  t,
  topo,
  fim,
}) => {
  const pNome = prog(t, m.de, 0.36);
  const pFaixa = prog(t, m.de + 0.12, 0.36);
  const s = saindo(t, fim, 0.28);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de + 0.05);
  const destaque = indicesDoTrecho(m.texto.toUpperCase(), m.destaque);
  // a chamada em até 2 linhas, ao lado do "+"
  const larguraChamada = L - 28 - 36 - 76 - 26;
  const { linhas, tam: tamChamada } = diagramar(m.texto.toUpperCase(), { largura: larguraChamada, maximo: 72, minimo: 48, linhas: 2, linhasMax: 3 });
  const tamNome = Math.max(60, Math.min(104, Math.floor(((L - 120) / Math.max(1, medir(marca.nome, 100))) * 100)));
  // o "+" vira visto depois da última palavra
  const fimFala = (tempos[tempos.length - 1] ?? m.de) + 0.45;
  const pVisto = prog(t, fimFala, 0.4);
  const temNome = !!marca.nome;
  return (
    <div style={{ position: "absolute", left: 60, top: topo + 14, width: L, ...saidaDaTarja(s) }}>
      {temNome ? (
        <div style={{ position: "relative", padding: "34px 48px 36px 60px" }}>
          <div style={{ position: "absolute", inset: 0, clipPath: varredura(pNome), filter: "drop-shadow(0 22px 40px rgba(0,0,0,0.34))" }}>
            <div style={{ position: "absolute", inset: 0, background: cor.tv, borderRadius: 12 }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: cor.placar, borderRadius: "12px 0 0 12px" }} />
          </div>
          <div style={{ position: "relative", ...conteudoDaTarja(pNome) }}>
            <div style={{ ...larga, fontSize: tamNome, color: cor.giz }}>{marca.nome}</div>
            {marca.area ? <div style={{ ...rotulo, fontSize: 40, color: cor.placar, marginTop: 18 }}>{marca.area}</div> : null}
          </div>
        </div>
      ) : null}
      <div style={{ position: "relative", marginTop: temNome ? 18 : 0, minHeight: 124, display: "flex", alignItems: "center", padding: "26px 36px 26px 28px", gap: 26 }}>
        <div style={{ position: "absolute", inset: 0, background: cor.placar, borderRadius: 12, clipPath: varredura(pFaixa) }} />
        <div style={{ position: "relative", width: 76, height: 76, borderRadius: 38, background: cor.tv, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", ...conteudoDaTarja(pFaixa) }}>
          <svg width={76} height={76} viewBox="0 0 76 76">
            {m.icone === "salvar" ? (
              <>
                <path d="M 22 14 H 54 V 62 L 38 50 L 22 62 Z" fill="none" stroke={cor.placar} strokeWidth={7} strokeLinejoin="round" opacity={1 - pVisto} />
                <path d="M 22 14 H 54 V 62 L 38 50 L 22 62 Z" fill={cor.placar} opacity={pVisto} />
              </>
            ) : m.icone === "comentar" ? (
              <>
                <path d="M 14 16 H 62 V 50 H 40 L 26 62 V 50 H 14 Z" fill="none" stroke={cor.placar} strokeWidth={7} strokeLinejoin="round" opacity={1 - pVisto} />
                <path d="M 14 16 H 62 V 50 H 40 L 26 62 V 50 H 14 Z" fill={cor.placar} opacity={pVisto} />
                {[28, 38, 48].map((x) => (
                  <circle key={x} cx={x} cy={33} r={4} fill={pVisto > 0.5 ? cor.tv : cor.placar} />
                ))}
              </>
            ) : m.icone === "link" ? (
              <g transform="rotate(-40 38 38)" fill="none" strokeWidth={8} strokeLinecap="round">
                <rect x={10} y={27} width={34} height={22} rx={11} stroke={cor.placar} />
                <rect x={32} y={27} width={34} height={22} rx={11} stroke={cor.placar} strokeDasharray={pVisto > 0.5 ? undefined : "0.1 14"} />
              </g>
            ) : (
              <>
                <g transform={`rotate(${90 * pVisto} 38 38)`} opacity={1 - pVisto}>
                  <path d="M 38 20 L 38 56 M 20 38 L 56 38" stroke={cor.placar} strokeWidth={8} strokeLinecap="round" />
                </g>
                <Traco d="M 22 40 L 33 51 L 55 26" p={pVisto} cor={cor.placar} largura={8} />
              </>
            )}
          </svg>
        </div>
        <div style={{ position: "relative", ...conteudoDaTarja(pFaixa) }}>
          <Linhas linhas={linhas} tempos={tempos} t={t} fantasma={0.2} corDe={(i) => (destaque.has(i) ? "#7A5A00" : undefined)} style={{ ...larga, fontSize: tamChamada, color: cor.tv, gap: tamChamada * 0.06 }} />
        </div>
      </div>
    </div>
  );
};
