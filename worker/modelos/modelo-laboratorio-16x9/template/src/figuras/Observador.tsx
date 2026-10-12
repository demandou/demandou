// Fig. "observador": a pessoa (na janela, em pé no horizonte) é quem olha. Linhas de visada saem
// dela para vários pontos do céu; depois a cor volta de todas as direções e o céu se pinta.
import { caneta, prog, temposDoTexto, vaiVem } from "../anim";
import { HORIZONTE, JANELAS } from "../layout";
import type { Observador as ObservadorT } from "../plano";
import { comDestaque, corDe, FraseAMao, LinhaAMao } from "../tinta/Escrita";
import { ajustar } from "../medir";
import { Definicoes, Molecula, Seta, Tracejado } from "../tinta/Tinta";
import { CEU, cor, estiloImpresso, H, W } from "../tema";
import type { PropsFigura } from "./comum";
import { Espalhar } from "./Particulas";

// No quadro deitado o céu é largo e baixo: os pontos olhados abrem para os lados num arco raso,
// abaixo do título do céu. Deslocamentos (px) a partir do centro da janela (y negativo = para cima).
const DIRECOES: Record<number, [number, number][]> = {
  3: [
    [-560, -200],
    [0, -300],
    [560, -200],
  ],
  4: [
    [-660, -150],
    [-240, -290],
    [240, -290],
    [660, -150],
  ],
  5: [
    [-700, -100],
    [-440, -260],
    [0, -300],
    [440, -260],
    [700, -100],
  ],
};

export const Observador: React.FC<PropsFigura<ObservadorT>> = ({ m, t, areas, palavras, chegada, id }) => {
  const a = areas.corpo;
  const j = JANELAS.baixo;
  const n = Math.max(3, Math.min(5, m.direcoes ?? 5));
  const c = corDe(m.cor ?? "azul");
  const alvos = DIRECOES[n].map(([dx, dy]) => ({ x: j.cx + dx, y: j.cy + dy, ang: Math.atan2(-dy, dx) }));
  const borda = (ang: number, folga = 18) => ({ x: j.cx + (j.d / 2 + folga) * Math.cos(ang), y: j.cy - (j.d / 2 + folga) * Math.sin(ang) });
  const pCeu = prog(t, m.chegaEm - 0.05, 0.75, vaiVem);
  const tituloTexto = m.titulo ?? "";
  // o título no céu cabe sempre: uma linha, de 116 a 64 px (acima dos pontos olhados)
  const q = ajustar(tituloTexto || " ", a.w - 60, 116, 64, 1);
  const tempos = temposDoTexto(q.linhas.join(" "), palavras, m.de, m.ate, m.chegaEm);
  const porLinha = (() => {
    let k = 0;
    return q.linhas.map((l) => {
      const n = l.split(/\s+/).filter(Boolean).length;
      const ts = tempos.slice(k, k + n);
      k += n;
      return comDestaque(l, ts);
    });
  })();
  // o nome do que se olha (opcional): à mão no alto, com seta até um dos pontos; sai quando o título entra
  const alvoEm = m.alvoEm ?? m.olharEm + 0.6;
  const qAlvo = m.alvo ? ajustar(m.alvo, a.w - 80, 72, 44, 1) : null;
  const saiAlvo = tituloTexto ? prog(t, m.chegaEm - 0.15, 0.3) : 0;
  const ceu = m.cor === "vermelho" ? CEU.tarde : CEU.dia;
  const raio = 26;
  const chao = `M ${a.x} ${HORIZONTE} L ${a.x + a.w} ${HORIZONTE}`;
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        <defs>
          <linearGradient id={`${id}-ceu`} x1="0" y1={a.y} x2="0" y2={HORIZONTE} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={ceu[0]} />
            <stop offset="0.6" stopColor={ceu[1]} />
            <stop offset="1" stopColor={ceu[2]} />
          </linearGradient>
          {/* a pintura desce com a borda macia, como lápis de cor passado em faixas */}
          <linearGradient id={`${id}-borda`} x1="0" y1={a.y + (HORIZONTE - a.y + 140) * pCeu - 140} x2="0" y2={a.y + (HORIZONTE - a.y + 140) * pCeu} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id={`${id}-pinta`} maskUnits="userSpaceOnUse" x={a.x - 10} y={a.y - 10} width={a.w + 20} height={HORIZONTE - a.y + 20}>
            <rect x={a.x - 10} y={a.y - 10} width={a.w + 20} height={HORIZONTE - a.y + 20} fill={`url(#${id}-borda)`} />
          </mask>
        </defs>
        {/* o céu, pintado a lápis de cor de cima para baixo */}
        <g mask={`url(#${id}-pinta)`}>
          <rect x={a.x} y={a.y} width={a.w} height={HORIZONTE - a.y} rx={raio} fill={`url(#${id}-ceu)`} />
          <rect x={a.x} y={a.y} width={a.w} height={HORIZONTE - a.y} rx={raio} fill={`url(#${id}-lapis)`} />
        </g>
        {/* chão: hachura embaixo do horizonte */}
        <rect x={a.x} y={HORIZONTE} width={a.w} height={150} fill={`url(#${id}-hachura)`} />
        <g filter={`url(#${id}-mao)`}>
          <rect x={a.x} y={a.y} width={a.w} height={HORIZONTE - a.y + 150} rx={raio} fill="none" stroke={cor.tinta} strokeWidth={5} />
          <path d={chao} stroke={cor.tinta} strokeWidth={5} />
        </g>
        {/* linhas de visada: saem da pessoa, uma a uma */}
        {alvos.map((q, i) => {
          const de = borda(q.ang);
          const em = m.olharEm + i * 0.28;
          return (
            <g key={i}>
              <Tracejado id={`${id}-v${i}`} d={`M ${de.x} ${de.y} L ${q.x} ${q.y}`} p={prog(t, em, 0.32, caneta)} largura={4} tracos="12 12" />
              <Molecula x={q.x} y={q.y} p={1} esboco />
              <Molecula x={q.x} y={q.y} p={prog(t, em + 0.28, 0.25)} r={16} angulo={i * 40} acesa={t > m.chegaEm + i * 0.07 ? cor.azulClaro : undefined} />
            </g>
          );
        })}
        {m.alvo ? (
          <g opacity={1 - saiAlvo}>
            <Seta de={{ x: j.cx - 140, y: a.y + 186 }} ate={{ x: alvos[Math.min(1, alvos.length - 1)].x + 16, y: alvos[Math.min(1, alvos.length - 1)].y - 30 }} p={prog(t, alvoEm + 0.35, 0.35, caneta)} curva={0.2} />
          </g>
        ) : null}
        {/* a cor volta de todos os lados até a pessoa */}
        {alvos.map((q, i) => {
          const fim = borda(q.ang, 34);
          const ini = { x: q.x + (fim.x - q.x) * 0.12, y: q.y + (fim.y - q.y) * 0.12 };
          return (
            <g key={`v${i}`}>
              <Espalhar x={q.x} y={q.y} t={t} em={m.chegaEm + i * 0.07} n={8} alcance={62} cor={c} semente={30 + i} />
              <Seta de={ini} ate={fim} p={prog(t, m.chegaEm + 0.1 + i * 0.07, 0.4, caneta)} curva={0.04} cor={c} largura={7} ponta={26} />
            </g>
          );
        })}
      </svg>
      {m.rotulo ? <div style={{ ...estiloImpresso, position: "absolute", left: a.x + 30, top: a.y + 26 }}>{m.rotulo}</div> : null}
      {tituloTexto ? (
        <div style={{ position: "absolute", left: a.x, top: a.y + 92, width: a.w }}>
          {porLinha.map((ps, i) => (
            <div key={i} style={{ height: q.corpo * 1.08 }}>
              <LinhaAMao palavras={ps} t={t} corpo={q.corpo} alinhar="center" esboco={m.alvo ? saiAlvo : 1} />
            </div>
          ))}
        </div>
      ) : null}
      {qAlvo ? (
        <div style={{ position: "absolute", left: a.x, top: a.y + 100, width: a.w, opacity: 1 - saiAlvo }}>
          <FraseAMao texto={qAlvo.linhas.join(" ")} em={alvoEm} ate={m.chegaEm} palavras={palavras} t={t} corpo={qAlvo.corpo} alinhar="center" />
        </div>
      ) : null}
    </>
  );
};
