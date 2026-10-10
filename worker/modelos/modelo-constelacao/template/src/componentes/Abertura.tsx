import { prog, temposDoTexto } from "../anim";
import type { Mundo } from "../ceu";
import type { Abertura as AberturaMomento, Palavra, Passo, Plano } from "../plano";
import { cor, sans, serifa } from "../tema";
import { FIGURAS, linhasDaConstelacao } from "./Blocos";
import { encaixarTrechos, segmentos, type Zona } from "./Fala";

type P = { x: number; y: number };
export type Mini = { pts: P[]; linhas: [number, number][]; mags?: number[] };

// A figura da miniatura: a primeira figura ligada de uma carta (céu real), ou a da primeira
// constelação de ideias do plano, ou uma cruz pequena.
export const figuraDaMiniatura = (plano: Plano, mundo: Mundo): Mini => {
  for (const m of plano.momentos) {
    if (m.tipo === "carta") {
      const ligar = m.passos.find((p): p is Extract<Passo, { acao: "ligar" }> => p.acao === "ligar");
      if (!ligar) continue;
      const ids = [...new Set(ligar.linhas.flat())].filter((id) => mundo.astros[id]);
      if (ids.length < 2) continue;
      return {
        pts: ids.map((id) => ({ x: mundo.astros[id].x, y: mundo.astros[id].y })),
        mags: ids.map((id) => mundo.astros[id].mag),
        linhas: ligar.linhas.filter(([a, b]) => ids.includes(a) && ids.includes(b)).map(([a, b]) => [ids.indexOf(a), ids.indexOf(b)] as [number, number]),
      };
    }
    if (m.tipo === "constelacao") {
      const fig = FIGURAS[Math.max(2, Math.min(6, m.estrelas.length))];
      return { pts: fig.pts.map(([x, y]) => ({ x, y })), linhas: linhasDaConstelacao(m) };
    }
  }
  const fig = FIGURAS[4];
  return { pts: fig.pts.map(([x, y]) => ({ x, y })), linhas: fig.linhas };
};

// Miniatura da figura: se acende junto com o título, como uma prévia do que vai ser procurado no céu.
// `medalha`: a figura num disco de carta escuro com anel graduado (fica legível sobre qualquer fundo,
// inclusive parede clara); sem medalha, as estrelas ficam soltas no céu do próprio vídeo (céu real).
const Miniatura: React.FC<{ fig: Mini; tempos: number[]; t: number; tamanho: number; medalha: boolean }> = ({ fig, tempos, t, tamanho: total, medalha }) => {
  const { pts, linhas } = fig;
  const tamanho = medalha ? total * 0.62 : total;
  const margem = (total - tamanho) / 2;
  const x0 = Math.min(...pts.map((p) => p.x));
  const x1 = Math.max(...pts.map((p) => p.x));
  const y0 = Math.min(...pts.map((p) => p.y));
  const y1 = Math.max(...pts.map((p) => p.y));
  const esc = (tamanho - 28) / Math.max(x1 - x0, y1 - y0, 1e-6);
  const ox = (tamanho - (x1 - x0) * esc) / 2;
  const oy = (tamanho - (y1 - y0) * esc) / 2;
  const Q = (i: number) => ({ x: ox + (pts[i].x - x0) * esc, y: oy + (pts[i].y - y0) * esc });
  // cada estrela acende numa palavra do título; as linhas no fim
  const n = tempos.length;
  const quando = (i: number) => tempos[Math.min(n - 1, Math.floor((i * n * 0.6) / Math.max(1, pts.length)))] ?? 0;
  const linhaEm = (k: number) => tempos[Math.min(n - 1, Math.floor(n * 0.6 + (k * n * 0.4) / Math.max(1, linhas.length)))] ?? 0;
  const c = total / 2;
  return (
    <svg width={total} height={total} style={{ overflow: "visible" }}>
      {medalha ? (
        <g>
          <circle cx={c} cy={c} r={c - 4} fill={cor.ceu} opacity={0.9} />
          <circle cx={c} cy={c} r={c - 4} fill="none" stroke={cor.ceuBorda} strokeWidth={2.5} />
          <g transform={`rotate(${t * 6} ${c} ${c})`} stroke={cor.textoSuave} strokeLinecap="round">
            {Array.from({ length: 48 }).map((_, i) => {
              const a = (i / 48) * 2 * Math.PI;
              const longo = i % 4 === 0;
              const r1 = c - 12;
              const r2 = r1 - (longo ? 12 : 6);
              return <line key={i} x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1} x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2} strokeWidth={longo ? 2.2 : 1.4} opacity={longo ? 0.85 : 0.55} />;
            })}
          </g>
        </g>
      ) : null}
      <g transform={`translate(${margem} ${margem})`}>
      {linhas.map(([a, b], k) => {
        const pa = Q(a);
        const pb = Q(b);
        const u = prog(t, linhaEm(k), 0.45);
        return (
          <g key={k}>
            <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={cor.lapis} strokeWidth={2.5} strokeDasharray="2 9" strokeLinecap="round" opacity={1 - u} />
            <line x1={pa.x} y1={pa.y} x2={pa.x + (pb.x - pa.x) * u} y2={pa.y + (pb.y - pa.y) * u} stroke={cor.linha} strokeWidth={4} strokeLinecap="round" opacity={0.95} />
          </g>
        );
      })}
      {pts.map((_, i) => {
        const q = Q(i);
        const a = prog(t, quando(i) - 0.03, 0.3);
        const r = fig.mags ? Math.max(4.5, 11 - 2 * fig.mags[i]) : 9.5 - 1.2 * (i % 3);
        return (
          <g key={i}>
            <circle cx={q.x} cy={q.y} r={r + 7} fill="none" stroke={cor.lapis} strokeWidth={1.6} strokeDasharray="2 4" opacity={1 - a} />
            <circle cx={q.x} cy={q.y} r={r * (0.5 + 0.5 * a)} fill={cor.estrela} opacity={0.35 + 0.65 * a} />
          </g>
        );
      })}
      </g>
    </svg>
  );
};

export const Abertura: React.FC<{
  m: AberturaMomento;
  palavras: Palavra[];
  figura: Mini;
  t: number;
  zona: Zona;
  // quando a íris começa a fechar (a abertura sai junto)
  saida: number;
  // centro e largura do rosto na tela (a miniatura vai para um canto do céu longe da cabeça)
  rosto: { x: number; y: number; largura: number };
  medalha: boolean;
}> = ({ m, palavras, figura, t, zona, saida, rosto, medalha }) => {
  const texto = m.texto?.trim() ? m.texto : (m.linhas ?? []).join(" ");
  const destaque = m.texto?.trim() ? m.destaque : m.linhas?.length ? m.linhas[m.enfase ?? m.linhas.length - 1] : undefined;
  const segs = segmentos(texto, destaque);
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(texto, palavras, Math.min(m.de, em), m.ate, em + 0.1);
  const largura = 1080 - zona.esquerda - zona.direita;
  const hRotulo = m.rotulo ? 66 : 0;
  const { encs } = encaixarTrechos(segs, {
    largura,
    altura: 1545 - zona.topo - 10 - hRotulo,
    base: 92,
    minimo: 62,
    escalaEnfase: 122 / 92,
    fonte: { peso: 500 },
    fonteEnfase: { italico: true, peso: 500 },
  });
  const entrada = prog(t, m.de - 0.05, 0.4);
  const sai = prog(t, saida, 0.35);
  // a miniatura fica num canto do céu longe da cabeça (se a cabeça ocupa os dois cantos, não entra)
  const cabeca = { x0: rosto.x - rosto.largura * 0.62, x1: rosto.x + rosto.largura * 0.62, y0: rosto.y - rosto.largura * 1.2, y1: rosto.y + rosto.largura };
  const cantos = [
    { x: 70, y: 170, w: 250, h: 250 },
    { x: 1080 - 130 - 250, y: 170, w: 250, h: 250 },
  ];
  const livre = (c: (typeof cantos)[number]) => c.x + c.w < cabeca.x0 || c.x > cabeca.x1 || c.y + c.h < cabeca.y0 || c.y > cabeca.y1;
  const preferido = rosto.x >= 540 ? [cantos[0], cantos[1]] : [cantos[1], cantos[0]];
  const canto = preferido.find(livre);
  return (
    <>
      {canto ? (
        <div style={{ position: "absolute", top: canto.y, left: canto.x, opacity: (1 - sai) * prog(t, m.de, 0.4) }}>
          <Miniatura fig={figura} tempos={tempos} t={t} tamanho={canto.w} medalha={medalha} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo + 10, display: "flex", flexDirection: "column", alignItems: "center", opacity: entrada * (1 - sai), translate: `0 ${-18 * sai}px` }}>
        {m.rotulo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, opacity: prog(t, m.de, 0.5) }}>
            <div style={{ width: 44, height: 2.5, background: cor.textoSuave }} />
            <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 32, letterSpacing: "0.24em", textTransform: "uppercase", color: cor.texto, opacity: 0.88 }}>{m.rotulo}</div>
            <div style={{ width: 44, height: 2.5, background: cor.textoSuave }} />
          </div>
        ) : null}
        {segs.map((s, i) => {
          let k = s.i0;
          return encs[i].linhas.map((linha, li) => {
            const ws = linha.split(/\s+/).filter(Boolean);
            const i0 = k;
            k += ws.length;
            return (
              <div key={`${i}-${li}`} style={{ display: "flex", justifyContent: "center", whiteSpace: "nowrap", fontFamily: serifa, fontWeight: 500, fontStyle: s.enfase ? "italic" : "normal", fontSize: encs[i].tamanho, lineHeight: 1.06 }}>
                {ws.map((w, j) => {
                  const p = prog(t, (tempos[i0 + j] ?? 0) - 0.02, 0.32);
                  return (
                    <span
                      key={j}
                      style={{
                        display: "inline-block",
                        marginRight: j < ws.length - 1 ? "0.25em" : 0,
                        color: cor.texto,
                        opacity: p >= 1 ? undefined : p,
                        translate: p >= 1 ? undefined : `0 ${(1 - p) * 0.12}em`,
                      }}
                    >
                      {w}
                    </span>
                  );
                })}
              </div>
            );
          });
        })}
      </div>
    </>
  );
};
