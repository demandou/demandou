// Resumo: tarja na altura do peito com o título falado e os itens que se marcam um a um (o número no
// quadrado amarelo, o visto que se desenha). Com `resultado`, a tarja vira um placar "? × ?" cujos
// números giram antes de parar — "me conta o resultado".
import { conteudoDaTarja, Linhas, prog, saidaDaTarja, saindo, temposDoTexto, Traco, varredura } from "../anim";
import type { Palavra, Resumo as ResumoT } from "../plano";
import { diagramar, medir } from "../medidas";
import { cor, larga, normal } from "../tema";

const L = 960;

export const Resumo: React.FC<{ m: ResumoT; palavras: Palavra[]; t: number; topo: number; fim: number }> = ({ m, palavras, t, topo, fim }) => {
  const pTarja = prog(t, m.de, 0.36);
  const s = saindo(t, fim, 0.28);
  const tTitulo = temposDoTexto(m.titulo, palavras, m.de, m.resultado?.em ?? m.ate, m.de + 0.05);
  const { linhas: linhasTitulo, tam: tamTitulo } = diagramar(m.titulo.toUpperCase(), { largura: L - 108, maximo: 74, minimo: 50, linhas: 2 });

  // troca para o placar do resultado
  // a parte 1 sai antes de a parte 2 entrar (as duas no mesmo lugar não se misturam)
  const pSai1 = m.resultado ? prog(t, m.resultado.em - 0.26, 0.22) : 0;
  const pRes = m.resultado ? prog(t, m.resultado.em - 0.1, 0.34) : 0;
  const tRes = m.resultado ? temposDoTexto(m.resultado.texto, palavras, m.resultado.em - 0.3, m.ate, m.resultado.em - 0.05) : [];
  const res = m.resultado ? diagramar(m.resultado.texto.toUpperCase(), { largura: L - 108, maximo: 68, minimo: 48, linhas: 2 }) : { linhas: [], tam: 64 };
  const linhasRes = res.linhas;
  const tamRes = res.tam;

  // itens: o maior corpo (até 58) em que o item mais longo cabe ao lado do número e do visto
  const larguraItem = L - 108 - 78 - 28 - 76;
  const tamItem = Math.max(44, Math.min(58, ...m.itens.map((i) => Math.floor((larguraItem / Math.max(1, medir(i.texto, 100, "normal700"))) * 100))));
  const altura = 46 + linhasTitulo.length * tamTitulo * 1.04 + 30 + m.itens.length * 96 + 34;

  // os números do placar giram (0–9) e param em "?"
  const giro = (k: number) => {
    if (!m.resultado) return "?";
    const ini = m.resultado.em + 0.12 + k * 0.06;
    const fimGiro = m.resultado.em + 0.62 + k * 0.14;
    if (t < ini || t >= fimGiro) return "?";
    // gira de 1 a 9 (o zero da fonte larga tem um traço no meio e lembra um θ)
    return String((Math.floor((t - ini) * 22 + k * 3) % 9) + 1);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: topo + 14,
        width: L,
        height: altura,
        ...saidaDaTarja(s),
      }}
    >
      {/* fundo (só ele varre na entrada; o texto aparece inteiro quando ele já abriu) */}
      <div style={{ position: "absolute", inset: 0, clipPath: varredura(pTarja), filter: "drop-shadow(0 22px 40px rgba(0,0,0,0.34))" }}>
        <div style={{ position: "absolute", inset: 0, background: cor.tv, borderRadius: 12 }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: cor.placar, borderRadius: "12px 0 0 12px" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, ...conteudoDaTarja(pTarja) }}>
      {/* parte 1: título + itens */}
      <div style={{ position: "absolute", inset: 0, padding: "44px 48px 0 60px", opacity: 1 - pSai1, translate: `0 ${-40 * pSai1}px` }}>
        <Linhas linhas={linhasTitulo} tempos={tTitulo} t={t} fantasma={0.16} style={{ ...larga, fontSize: tamTitulo, color: cor.giz, gap: tamTitulo * 0.06 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 30 }}>
          {m.itens.map((item, i) => {
            const p = prog(t, item.em, 0.4);
            const pVisto = prog(t, item.em + 0.18, 0.35);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", height: 78, opacity: 0.25 + 0.75 * p }}>
                <div
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 8,
                    background: p > 0.02 ? cor.placar : "transparent",
                    border: p > 0.02 ? "none" : `3px dashed ${cor.gizApagado}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ ...larga, fontSize: 46, color: p > 0.02 ? cor.tv : cor.gizApagado }}>{i + 1}</span>
                </div>
                <div style={{ marginLeft: 28, flex: 1 }}>
                  <div style={{ ...normal, fontWeight: 700, fontSize: tamItem, color: cor.giz, translate: `${(1 - p) * -24}px 0`, whiteSpace: "nowrap" }}>{item.texto}</div>
                </div>
                <svg width={72} height={72} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
                  <Traco d="M 12 34 L 26 48 L 54 16" p={pVisto} cor={cor.placar} largura={9} />
                </svg>
              </div>
            );
          })}
        </div>
      </div>
      {/* parte 2: placar do resultado */}
      {m.resultado && pRes > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "0 48px 0 60px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 40,
            opacity: pRes,
            translate: `0 ${40 * (1 - pRes)}px`,
          }}
        >
          <Linhas linhas={linhasRes} tempos={tRes} t={t} fantasma={0.16} style={{ ...larga, fontSize: tamRes, color: cor.giz, gap: tamRes * 0.06 }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
            {[0, 1].map((k) => (
              <div key={k} style={{ display: "contents" }}>
                {k === 1 ? <span style={{ ...larga, fontSize: 96, color: cor.tvTexto }}>×</span> : null}
                <div
                  style={{
                    width: 210,
                    height: 210,
                    borderRadius: 12,
                    background: cor.placar,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <span style={{ ...larga, fontSize: 160, color: cor.tv, lineHeight: 1 }}>{giro(k)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
};
