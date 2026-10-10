// Comparação: dois cartões de anotação, um embaixo do outro, ligados por um disco com × (contra) ou
// com uma seta (antes → depois, errado → certo). Cada cartão já está esboçado a lápis e ganha tinta
// na sua palavra. O vencedor ganha marca-texto e um visto; o perdedor esmaece a lápis — e, no modo
// errado-certo, o errado é riscado quando o certo é dito.
import { caneta, Escrita, prog, temposDoTexto, Traco } from "../anim";
import { diagramar } from "../medidas";
import type { Comparacao as TComparacao, Palavra } from "../plano";
import { CARTAO, cor, DIREITA_BAIXO, MARGEM, rotulo as estiloRotulo, titulo as estiloTitulo } from "../tema";

const X = MARGEM;
const L = DIREITA_BAIXO - MARGEM;
const PAD = { cima: 40, baixo: 38, lado: 48 };
const ROTULO = 32;
const VAO = 116;
const TOPO = 700;

export const geometriaDaComparacao = (m: TComparacao) => {
  const C = CARTAO.comparacao;
  const xCol = C.x + C.w + 60;
  const larguraCol = 1020 - xCol;
  const titulo = m.titulo ? diagramar(m.titulo, { equilibrar: true, largura: larguraCol, maximo: 72, minimo: 48, linhas: 4, altura: 440, entrelinha: 1.04 }) : null;
  let y = TOPO;
  const lados = m.lados.map((l) => {
    const d = diagramar(l.texto, { equilibrar: true, largura: L - 2 * PAD.lado, maximo: 96, minimo: 52, linhas: 2, altura: 210, entrelinha: 1.04 });
    const h = PAD.cima + ROTULO + 18 + d.linhas.length * d.tamanho * 1.04 + PAD.baixo;
    const r = { ...l, d, y, h };
    y += h + VAO;
    return r;
  });
  const disco = { x: X + L / 2, y: lados[0].y + lados[0].h + VAO / 2 };
  return { titulo, xCol, larguraCol, lados, disco, chegada: { x: C.x + 200, y: TOPO } };
};

export const Comparacao: React.FC<{ m: TComparacao; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDaComparacao(m);
  const modo = m.modo ?? "contra";
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const vencedorEm = vencedor === undefined ? Infinity : (m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.45);
  const pV = Number.isFinite(vencedorEm) ? prog(t, vencedorEm, 0.4, caneta) : 0;
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate) : [];
  const pDisco = prog(t, m.lados[1].em - 0.25, 0.4, caneta);
  const { disco } = g;
  const glifo =
    modo === "contra"
      ? [`M ${disco.x - 15} ${disco.y - 15} L ${disco.x + 15} ${disco.y + 15}`, `M ${disco.x + 15} ${disco.y - 15} L ${disco.x - 15} ${disco.y + 15}`]
      : [`M ${disco.x} ${disco.y - 20} L ${disco.x} ${disco.y + 18}`, `M ${disco.x - 14} ${disco.y + 4} L ${disco.x} ${disco.y + 19} L ${disco.x + 14} ${disco.y + 4}`];
  return (
    <>
      {g.titulo ? (
        <div style={{ position: "absolute", left: g.xCol, top: 182 }}>
          <Escrita linhas={g.titulo.linhas} tempos={temposTitulo} t={t} estilo={estiloTitulo} tamanho={g.titulo.tamanho} entrelinha={1.04} />
        </div>
      ) : null}
      {g.lados.map((l, k) => {
        const p = prog(t, l.em - 0.1, 0.35);
        const tempos = temposDoTexto(l.texto, palavras, m.de, m.ate, l.em);
        const ganha = vencedor === k;
        const perde = vencedor !== undefined && vencedor !== k;
        const riscar = perde && modo === "errado-certo";
        return (
          <div key={`l-${k}`}>
            <div
              style={{
                position: "absolute",
                left: X,
                top: l.y,
                width: L,
                height: l.h,
                borderRadius: 24,
                background: cor.cartao,
                border: `${p > 0.5 ? (ganha && pV > 0.5 ? 6 : 4) : 4}px ${p > 0.5 ? "solid" : "dashed"} ${p > 0.5 ? cor.tinta : cor.lapis}`,
                boxShadow: p > 0.5 ? cor.sombra : undefined,
                overflow: "hidden",
              }}
            >
              {ganha && pV > 0 ? <div style={{ position: "absolute", inset: 0, background: cor.marca, transformOrigin: "left center", transform: `scaleX(${pV.toFixed(4)})` }} /> : null}
            </div>
            <div style={{ position: "absolute", left: X + PAD.lado, top: l.y + PAD.cima, opacity: perde ? 1 - 0.45 * pV : 1 }}>
              <div style={{ ...estiloRotulo, color: p > 0.5 ? cor.tintaSuave : cor.lapis, height: ROTULO, marginBottom: 18 }}>{l.rotulo}</div>
              <Escrita
                linhas={l.d.linhas}
                tempos={tempos}
                t={t}
                estilo={estiloTitulo}
                tamanho={l.d.tamanho}
                riscado={riscar ? new Set(tempos.map((_, i) => i)) : undefined}
                riscaEm={riscar ? vencedorEm : undefined}
                entrelinha={1.04}
              />
            </div>
          </div>
        );
      })}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        {/* o disco que liga os dois lados */}
        <circle cx={disco.x} cy={disco.y} r={42} fill={cor.cartao} stroke={pDisco > 0.3 ? cor.tinta : cor.lapis} strokeWidth={5} strokeDasharray={pDisco > 0.3 ? undefined : "4 8"} />
        {glifo.map((d, i) => (
          <Traco key={i} d={d} p={prog(pDisco, 0.2 + i * 0.3, 0.5)} cor={cor.tinta} largura={7} />
        ))}
        {/* o visto do vencedor, no canto do cartão */}
        {vencedor !== undefined && pV > 0
          ? (() => {
              const l = g.lados[vencedor];
              const cx = X + L - 30;
              const cy = l.y + 30;
              return (
                <g opacity={Math.min(1, pV * 2)}>
                  <circle cx={cx} cy={cy} r={40} fill={cor.tinta} />
                  <Traco d={`M ${cx - 17} ${cy + 1} L ${cx - 5} ${cy + 14} L ${cx + 18} ${cy - 12}`} p={prog(pV, 0.3, 0.7)} cor={cor.cartao} largura={8} />
                </g>
              );
            })()
          : null}
        {/* sem título, a coluna ao lado do cartão mostra o sinal grande da comparação */}
        {!g.titulo
          ? (() => {
              const cx = g.xCol + g.larguraCol / 2;
              const cy = 410;
              const ds =
                modo === "contra"
                  ? [`M ${cx - 90} ${cy - 90} L ${cx + 90} ${cy + 90}`, `M ${cx + 90} ${cy - 90} L ${cx - 90} ${cy + 90}`]
                  : [`M ${cx} ${cy - 120} L ${cx} ${cy + 110}`, `M ${cx - 70} ${cy + 40} L ${cx} ${cy + 112} L ${cx + 70} ${cy + 40}`];
              return ds.map((d, i) => (
                <g key={`s-${i}`}>
                  <path d={d} fill="none" stroke={cor.lapisClaro} strokeWidth={10} strokeDasharray="3 16" strokeLinecap="round" />
                  <Traco d={d} p={prog(t, m.lados[i].em, 0.45, caneta)} cor={cor.tinta} largura={16} />
                </g>
              ));
            })()
          : null}
      </svg>
    </>
  );
};
