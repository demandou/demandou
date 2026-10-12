// `comparacao`: dois espécimes lado a lado, Fig. A e Fig. B, separados por um fio de pena com um
// medalhão no meio (× para `contra`, → para `antes-depois` e `errado-certo`).
// - contra: duas folhas diferentes (ovada × estreita), as duas viçosas;
// - antes-depois: um broto × a planta crescida;
// - errado-certo: um ramo murcho e pálido com selo ✗ em garança × um ramo viçoso com selo ✓.
// Cada lado está a lápis até ser dito; na palavra, o espécime ganha tinta e aquarela e o texto se escreve.
// `vencedor`: no `vencedorEm`, o lado que vence ganha o selo ✓ e o outro empalidece.
import { romano } from "../Cabecalho";
import { limitar, prog, temposDoTexto, Traco } from "../../anim";
import { ramoPrensado, Ramo } from "../../desenhos/Ramo";
import { encaixar, larguraTexto } from "../../medida";
import type { Comparacao as ComparacaoT } from "../../plano";
import { cor, traco, versalete } from "../../tema";
import { CabecalhoDoBloco, type PropsDoBloco } from "../Bloco";
import { Medalhao, Selo, TextoNaFala } from "../Pecas";
import { Estagio } from "./Passos";

const COLUNAS = [
  { x0: 70, x1: 500 },
  { x0: 580, x1: 1010 },
];
const BASE_ESPECIME = 1110;
const ALTURA_ESPECIME = 380;
const TOPO_TEXTO = 1170;

export const Comparacao: React.FC<PropsDoBloco & { m: ComparacaoT }> = ({ m, t, palavras, chegada, layout, numeroFig }) => {
  const modo = m.modo ?? "contra";
  const lapis = 1;
  const fio = prog(t, Math.max(chegada + 0.2, m.de - 0.2), 0.6);
  const veredito = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? m.lados[1].em + 0.8, 0.5) : 0;

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* fio de pena entre os dois lados */}
        <line x1={540} y1={720} x2={540} y2={1500} stroke={cor.grafite} strokeWidth={traco.fino} opacity={lapis * (1 - fio)} />
        <Traco d="M 540 720 L 540 1500" p={fio} cor={cor.tinta} largura={traco.fino} />
        {m.lados.map((lado, i) => {
          const col = COLUNAS[i];
          const cx = (col.x0 + col.x1) / 2;
          const p = prog(t, lado.em - 0.1, 0.9, (v) => v);
          const perde = m.vencedor !== undefined && m.vencedor !== i ? veredito : 0;
          const murcho = modo === "errado-certo" && i === 0;
          let desenho: React.ReactNode;
          if (modo === "antes-depois" && i === 0) {
            desenho = <Estagio k={1} x={cx} chao={BASE_ESPECIME} h={ALTURA_ESPECIME * 0.9} p={p} lapis={lapis} />;
          } else {
            const r = ramoPrensado(cx - 24, BASE_ESPECIME, ALTURA_ESPECIME, 5, (k) => limitar(p * 1.8 - k * 0.15), {
              curva: murcho ? -60 : 40,
              tamanho: 0.95,
              palido: murcho ? 0.9 : perde * 0.85,
              estreita: modo === "contra" && i === 1,
              queda: murcho ? 0.55 : perde * 0.55,
            });
            desenho = (
              <g opacity={1 - perde * 0.35}>
                <Ramo caule={r.caule} pCaule={limitar(p * 1.6)} folhas={r.folhas} lapis={lapis} />
              </g>
            );
          }
          const selo = modo === "errado-certo" ? prog(t, lado.em + 0.45, 0.5) : m.vencedor === i ? veredito : 0;
          return (
            <g key={i}>
              {desenho}
              {/* chão do espécime */}
              <line x1={cx - 120} y1={BASE_ESPECIME + 4} x2={cx + 120} y2={BASE_ESPECIME + 4} stroke={p > 0.05 ? cor.tinta : cor.grafite} strokeWidth={traco.fino} opacity={0.5 + 0.5 * Math.max(lapis, p)} />
              {selo > 0 ? <Selo x={col.x1 - 46} y={BASE_ESPECIME - ALTURA_ESPECIME + 40} r={34} tipo={modo === "errado-certo" && i === 0 ? "x" : "v"} p={selo} /> : null}
            </g>
          );
        })}
        <Medalhao x={540} y={920} r={42} texto={modo === "contra" ? "×" : "→"} p={fio} tamanho={46} />
      </svg>
      {m.lados.map((lado, i) => {
        const col = COLUNAS[i];
        const largura = col.x1 - col.x0 - (i === 0 ? 24 : 0);
        const e = encaixar(lado.texto, { largura, max: 76, min: 46, linhas: 3, fonte: "serif" });
        const tempos = temposDoTexto(e.linhas.join(" "), palavras, lado.em, Math.max(lado.em + 1.6, m.lados[1].em, m.ate), lado.em);
        const perde = m.vencedor !== undefined && m.vencedor !== i ? veredito : 0;
        const errado = modo === "errado-certo" && i === 0;
        const corRotulo = errado ? cor.garanca : cor.musgo;
        const pRotulo = prog(t, lado.em - 0.1, 0.35);
        let tamRotulo = 34;
        while (tamRotulo > 30 && larguraTexto(lado.rotulo, tamRotulo, "versalete", { espaco: 0.3, espacamento: 0.1, caixaAlta: true }) > largura - 70) tamRotulo -= 1;
        return (
          <div key={i} style={{ position: "absolute", left: col.x0, top: TOPO_TEXTO, width: largura, opacity: 1 - perde * 0.45 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, height: 52 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  border: `2.5px solid ${pRotulo > 0.5 ? corRotulo : cor.grafite}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: versalete,
                  fontWeight: 700,
                  fontSize: 30,
                  color: pRotulo > 0.5 ? corRotulo : cor.grafite,
                  lineHeight: 1,
                  paddingBottom: 3,
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
              >
                {i === 0 ? "A" : "B"}
              </div>
              <div
                style={{
                  fontFamily: versalete,
                  fontWeight: 700,
                  fontSize: tamRotulo,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  color: pRotulo > 0.5 ? corRotulo : cor.grafite,
                }}
              >
                {lado.rotulo}
              </div>
            </div>
            <div style={{ height: 2.5, background: pRotulo > 0.5 ? cor.tinta : cor.grafiteClaro, margin: "12px 0 18px", transformOrigin: "left", scale: `${0.25 + 0.75 * pRotulo} 1` }} />
            <TextoNaFala linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} lapis={lapis} corTinta={errado ? cor.garanca : cor.tinta} />
          </div>
        );
      })}
      <CabecalhoDoBloco
        t={t}
        palavras={palavras}
        chegada={chegada}
        layout={layout}
        numeroFig={numeroFig}
        de={m.de}
        ate={m.ate}
        rotulo={m.titulo || !m.rotulo ? (m.rotulo ?? `Fig. ${romano(numeroFig)}`) : `Fig. ${romano(numeroFig)}`}
        titulo={m.titulo ?? m.rotulo}
        indice={m.titulo || m.rotulo ? undefined : { total: 2, atual: m.lados.reduce((k, l, i) => (t >= l.em - 0.05 ? i + 1 : k), 0) }}
      />
    </>
  );
};
