// A comparação na linguagem da conversa: duas faixas do app, uma embaixo da outra. Cada faixa nasce
// a lápis (tracejada) e acende quando o rótulo é dito; o balão dela chega na palavra. Entre as duas,
// um × (contra) ou uma seta (antes-depois, errado-certo). O lado que perde ESFRIA (o balão fica
// cinza, ✕) e o que ganha ACENDE (borda no acento, ✓) — as mesmas cores do resto do modelo.
import { limitar, prog, rola } from "../anim";
import type { Msg } from "../blocos";
import { FAIXA, type GeoComparacao, geoComparacao, larguraDoBalaoDaFaixa } from "../comparacao";
import { medidas } from "../fio";
import type { Comparacao, Palavra } from "../plano";
import { COLUNA, cor, fonte } from "../tema";
import { Balao } from "./Balao";
import { Icone } from "./Icones";

const LARGURA = FAIXA.largura;
const PAD = FAIXA.pad;
const GAP = FAIXA.gap;

// quem ganha e quando (no errado-certo, o certo ganha quando é dito)
const veredito = (m: Comparacao): { vencedor: 0 | 1; em: number } | null => {
  if (m.vencedor !== undefined) return { vencedor: m.vencedor, em: m.vencedorEm ?? m.lados[m.vencedor].em + 0.4 };
  if (m.modo === "errado-certo") return { vencedor: 1, em: m.vencedorEm ?? m.lados[1].em + 0.3 };
  return null;
};

const FaixaLado: React.FC<{
  m: Comparacao;
  i: 0 | 1;
  t: number;
  geo: GeoComparacao;
  palavras: Palavra[];
  hora: string;
}> = ({ m, i, t, geo, palavras, hora }) => {
  const lado = m.lados[i];
  const p = prog(t, lado.em - 0.2, 0.4);
  const pm = prog(t, lado.em - 0.05, 0.4, rola);
  const v = veredito(m);
  const pv = v ? prog(t, v.em, 0.4) : 0;
  const ganha = v?.vencedor === i;
  const perde = v && v.vencedor !== i;
  // antes-depois sem veredito: o "antes" fica no balão do outro lado (ardósia), o "depois" no seu
  const deQuem: "eu" | "cliente" = m.modo === "antes-depois" && !v && i === 0 ? "cliente" : "eu";
  const msg: Msg = { de: deQuem, em: lado.em, texto: lado.texto, esfriaEm: perde ? v.em : undefined };
  const med = medidas(msg, geo.corpo, larguraDoBalaoDaFaixa(), true);
  const borda = ganha && pv > 0 ? cor.acento : p > 0 ? cor.linha : "rgba(242,238,231,0.16)";
  return (
    <div
      style={{
        position: "relative",
        width: LARGURA,
        height: geo.alturas[i],
        borderRadius: 42,
        boxSizing: "border-box",
        background: p > 0 ? cor.barra : "transparent",
        border: `${ganha && pv > 0 ? 4 : 3}px ${p > 0 ? "solid" : "dashed"} ${borda}`,
        fontFamily: fonte,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: PAD - 6,
          fontSize: geo.rotulo,
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: perde && pv > 0.5 ? cor.porcelanaSuave : cor.porcelana,
          opacity: 0.3 + 0.7 * p,
          whiteSpace: "nowrap",
        }}
      >
        {lado.rotulo}
      </div>
      {/* o veredito: ✓ no acento para quem ganha, ✕ cinza para quem perde */}
      {v ? (
        <div
          style={{
            position: "absolute",
            right: PAD - 4,
            top: PAD - 10,
            width: 70,
            height: 70,
            borderRadius: 70,
            background: pv > 0 ? (ganha ? cor.acento : "#59606C") : "transparent",
            border: pv > 0 ? "none" : "3px dashed rgba(242,238,231,0.16)",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.5 + 0.5 * pv,
            scale: String(0.85 + 0.15 * pv),
          }}
        >
          {pv > 0 ? <Icone nome={ganha ? "check" : "x"} tamanho={40} cor={ganha ? cor.tinta : cor.porcelana} traco={6} p={limitar(pv * 1.3)} /> : null}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: PAD - 6,
          top: PAD + Math.round(geo.rotulo * 1.2) + 18,
          opacity: pm,
          translate: pm < 1 ? `0 ${(1 - pm) * 24}px` : undefined,
        }}
      >
        <Balao m={msg} med={med} t={t} hora={hora} palavras={palavras} semMeta />
      </div>
    </div>
  );
};

export const ComparacaoTela: React.FC<{ m: Comparacao; t: number; altura: number; palavras: Palavra[]; hora: string; topo?: number }> = ({
  m,
  t,
  altura,
  palavras,
  hora,
  topo = 20,
}) => {
  const geo = geoComparacao(m, altura - topo - 10);
  const pSinal = prog(t, m.lados[1].em - 0.3, 0.35);
  const seta = m.modo === "antes-depois" || m.modo === "errado-certo";
  // sobrando espaço (no quadro deitado a coluna é alta), as faixas ficam no meio da área
  const y0 = topo + Math.max(0, (altura - topo - 10 - geo.total) / 2);
  const ySinal = y0 + geo.alturas[0] + GAP / 2;
  return (
    <>
      <div style={{ position: "absolute", left: COLUNA.x, top: y0, display: "flex", flexDirection: "column", gap: GAP }}>
        <FaixaLado m={m} i={0} t={t} geo={geo} palavras={palavras} hora={hora} />
        <FaixaLado m={m} i={1} t={t} geo={geo} palavras={palavras} hora={hora} />
      </div>
      {/* o sinal entre as faixas */}
      <div
        style={{
          position: "absolute",
          left: COLUNA.x + COLUNA.w / 2 - 40,
          top: ySinal - 40,
          width: 80,
          height: 80,
          borderRadius: 80,
          background: cor.noite,
          border: `3px solid ${pSinal > 0 ? cor.linha : "rgba(242,238,231,0.16)"}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icone nome={seta ? "baixo" : "x"} tamanho={40} cor={pSinal > 0 ? cor.porcelana : "rgba(242,238,231,0.3)"} traco={6} />
      </div>
    </>
  );
};
