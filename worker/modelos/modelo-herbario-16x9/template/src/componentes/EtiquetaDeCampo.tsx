// `destaque`: a etiqueta de campo do coletor, presa por um barbante que vem da borda esquerda.
// Com a pessoa em tela cheia, a etiqueta entra pela esquerda, gira de leve e assenta na altura do
// peito; a palavra nasce a lápis e ganha tinta na fala.
// - alerta: o texto em garança e um selo ✗ desenhado a pena;
// - chave: o texto em itálico verde-musgo, com a aguada clara por trás.
// `detalhe` entra embaixo, em itálico, no `detalheEm`.
// No quadro deitado a etiqueta é larga e baixa, na faixa de baixo (do queixo até o limite de baixo):
// o texto encolhe até ela caber ali.
import { mistura, prog, saindo, temposDoTexto } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Destaque, Palavra } from "../plano";
import { cor, LIMITE_APP, QUADRO, serif } from "../tema";
import { LinhaATinta, Selo, TextoNaFala } from "./Pecas";

const LIMITE = LIMITE_APP;
// a etiqueta mais larga no quadro deitado
const LARGURA_MAX = 1500;

export const EtiquetaDeCampo: React.FC<{ m: Destaque; t: number; fim: number; palavras: Palavra[]; topo: number; entrada: number }> = ({
  m,
  t,
  fim,
  palavras,
  topo,
  entrada,
}) => {
  const chega = prog(t, entrada, 0.75);
  const sai = saindo(t, fim, 0.3);
  if (chega <= 0.001 || sai >= 1) return null;
  const alerta = m.nivel === "alerta";
  const chave = m.nivel === "chave";
  const espacoSelo = alerta ? 110 : 0;
  const larguraMax = LARGURA_MAX - 20 - 140 - espacoSelo;
  // o maior corpo em que a etiqueta cabe entre o topo da faixa e o limite de baixo
  const medir = (max: number) => {
    const e = encaixar(m.texto, { largura: larguraMax, max, min: Math.min(72, max), linhas: 2, fonte: chave ? "italico" : "serif" });
    const d = m.detalhe ? encaixar(m.detalhe, { largura: larguraMax, max: Math.min(54, Math.round(max * 0.45)), min: 38, linhas: 2, fonte: "italico" }) : null;
    const H = 46 + e.linhas.length * e.tamanho * 1.02 + (d ? 18 + d.linhas.length * d.tamanho * 1.1 : 0) + 46;
    return { e, d, H };
  };
  let medida = medir(124);
  for (const max of [112, 100, 90, 80, 72, 64]) {
    if (topo + medida.H <= LIMITE + 4) break;
    medida = medir(max);
  }
  const { e, d, H } = medida;
  const larguraConteudo = Math.max(
    ...e.linhas.map((l) => larguraTexto(l, e.tamanho, chave ? "italico" : "serif")),
    ...(d ? d.linhas.map((l) => larguraTexto(l, d.tamanho, "italico", { espaco: 0.16 })) : [0]),
  );
  const W = Math.max(600, Math.min(LARGURA_MAX, larguraConteudo + 140 + espacoSelo + 20));
  const x = (QUADRO.w - W) / 2 + 14;
  const y = Math.min(topo, LIMITE - H);
  const furo = { x: 52, y: H / 2 };
  const corte = Math.min(46, H * 0.28);
  const contorno = `M ${corte} 0 L ${W} 0 L ${W} ${H} L ${corte} ${H} L 0 ${H - corte} L 0 ${corte} Z`;
  const em = m.em;
  const tempos = temposDoTexto(e.linhas.join(" "), palavras, Math.min(em, m.de + 0.05), m.ate, em);
  const lapis = prog(t, entrada, 0.3);
  // entra pela esquerda presa ao barbante, gira e assenta
  const dx = mistura(-W - 260, 0, chega);
  const giro = mistura(-7, -1.4, chega);
  const fimTexto = tempos[tempos.length - 1] ?? em;
  const selo = alerta ? prog(t, fimTexto + 0.1, 0.6) : 0;
  const tempoDetalhe = m.detalheEm ?? fimTexto + 0.4;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: W,
        height: H,
        translate: `${dx}px ${sai * 30}px`,
        rotate: `${giro}deg`,
        transformOrigin: `${furo.x}px ${furo.y}px`,
        opacity: 1 - sai,
      }}
    >
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* o barbante, da borda esquerda da tela até o furo */}
        <path
          d={`M ${furo.x} ${furo.y} C ${furo.x - 120} ${furo.y - 30} ${-x - 140} ${furo.y - 40} ${-x - 60} ${furo.y - 110}`}
          fill="none"
          stroke="#B9AC86"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path d={contorno} fill={cor.etiqueta} stroke={cor.tinta} strokeWidth={2.5} style={{ filter: "drop-shadow(0 14px 22px rgba(20,28,22,0.26))" }} />
        <path d={contorno} transform={`translate(10 10) scale(${(W - 20) / W} ${(H - 20) / H})`} fill="none" stroke={cor.tinta} strokeWidth={1.2} opacity={0.55} />
        {/* o furo reforçado */}
        <circle cx={furo.x} cy={furo.y} r={22} fill="none" stroke={alerta ? cor.garanca : cor.musgo} strokeWidth={5} />
        <circle cx={furo.x} cy={furo.y} r={11} fill={cor.papel} stroke={cor.tinta} strokeWidth={1.5} />
        {alerta ? <Selo x={W - 70} y={H / 2} r={40} tipo="x" p={selo} /> : null}
      </svg>
      <div style={{ position: "absolute", left: 104, top: 46, width: W - 104 - 40 - espacoSelo }}>
        <TextoNaFala
          linhas={e.linhas}
          tempos={tempos}
          t={t}
          tamanho={e.tamanho}
          italico={chave}
          corTinta={alerta ? cor.garanca : chave ? cor.musgo : cor.tinta}
          destaque={chave ? m.texto : undefined}
          lapis={lapis}
          entrelinha={1.02}
        />
        {d ? (
          <div style={{ marginTop: 18, fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: d.tamanho, lineHeight: 1.1 }}>
            {d.linhas.map((l, i) => (
              <LinhaATinta key={i} texto={l} q={prog(t, tempoDetalhe + i * 0.35, 0.5, (v) => v)} corTinta={cor.musgo} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
