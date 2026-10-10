// Comparação = dois cartões de entrevista lado a lado embaixo do quadro (como duas faixas da mesa).
// Cada lado nasce a lápis, com o rótulo em mono; o texto acende palavra por palavra quando é dito.
// No meio, um selo: × (contra) ou → (antes-depois, errado-certo). O vencedor ganha o contorno rosa e
// um visto; o outro apaga (no errado-certo, o errado ganha um ×).
import { Linhas, prog, temposDoTexto } from "../anim";
import { abaixoDoQuadro } from "../layout";
import { caber } from "../medidas";
import { ritmoDoCartao } from "./comum";
import type { Comparacao as ComparacaoT, Palavra } from "../plano";
import { cor, FUNDO, H, MARGEM, rotulo, titulo, W } from "../tema";

const LARGURA = W - 2 * MARGEM;
const VAO = 20;
const PAD = 34;

const Selo: React.FC<{ modo: ComparacaoT["modo"]; p: number }> = ({ modo, p }) => (
  <div
    style={{
      width: 76,
      height: 76,
      borderRadius: 38,
      background: cor.fundo,
      boxShadow: `inset 0 0 0 3px ${p > 0.5 ? cor.acento : cor.apagadoForte}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      scale: String(0.85 + 0.15 * p),
    }}
  >
    <svg width={34} height={34} viewBox="0 0 34 34">
      {modo === "contra" || !modo ? (
        <path d="M8 8 L26 26 M26 8 L8 26" stroke={p > 0.5 ? cor.acento : cor.apagadoForte} strokeWidth={4} strokeLinecap="round" />
      ) : (
        <path d="M5 17 H27 M19 9 L27 17 L19 25" fill="none" stroke={p > 0.5 ? cor.acento : cor.apagadoForte} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  </div>
);

const Marca: React.FC<{ tipo: "certo" | "errado"; p: number }> = ({ tipo, p }) => (
  <div style={{ width: 44, height: 44, borderRadius: 22, background: tipo === "certo" ? cor.acento : "transparent", boxShadow: tipo === "errado" ? `inset 0 0 0 3px ${cor.textoSuave}` : "none", display: "flex", alignItems: "center", justifyContent: "center", opacity: p, scale: String(0.7 + 0.3 * p) }}>
    <svg width={22} height={22} viewBox="0 0 22 22">
      {tipo === "certo" ? (
        <path d="M4 11.5 L9 16.5 L18 6" fill="none" stroke={cor.sobreAcento} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M5 5 L17 17 M17 5 L5 17" stroke={cor.textoSuave} strokeWidth={3.2} strokeLinecap="round" />
      )}
    </svg>
  </div>
);

export const Comparacao: React.FC<{ m: ComparacaoT; palavras: Palavra[]; t: number; fim: number; antes?: boolean; depois?: boolean }> = ({
  m,
  palavras,
  t,
  fim,
  antes = false,
  depois = false,
}) => {
  const topo = abaixoDoQuadro("entrevista");
  const altura = FUNDO - topo;
  const w = (LARGURA - VAO) / 2;
  const interna = w - 2 * PAD;
  // os dois cartões sobem juntos (opacos, cobrindo o que estava ali) e descem no fim
  const { sobe: p, desce: s, texto } = ritmoDoCartao(t, m.de, fim, antes, depois);
  const fora = H - topo;
  const vencedor = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
  const vencedorEm = m.vencedorEm ?? (vencedor !== undefined ? Math.max(m.lados[0].em, m.lados[1].em) + 0.5 : Infinity);
  const pVence = vencedor !== undefined ? prog(t, vencedorEm, 0.3) : 0;
  // um corpo só para os dois lados (o maior em que os dois cabem)
  const livre = altura - 2 * PAD - 40 - 22;
  const medidas = m.lados.map((l) => caber(l.texto, { largura: interna, maximo: 100, minimo: 52, linhas: 4, altura: livre, entrelinha: 1.06, piso: 38 }));
  const tam = Math.min(...medidas.map((d) => d.tam));
  const linhasDe = (i: number) => caber(m.lados[i].texto, { largura: interna, maximo: tam, minimo: tam, linhas: 5, altura: livre, entrelinha: 1.06, piso: Math.min(tam, 38) }).linhas;
  const pSelo = prog(t, m.lados[1].em - 0.05, 0.3);

  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        top: topo,
        width: LARGURA,
        height: altura,
        translate: `0 ${(1 - p) * fora + s * fora}px`,
        visibility: p <= 0 || s >= 1 ? "hidden" : "visible",
      }}
    >
      {m.lados.map((lado, i) => {
        const proximo = i === 0 ? m.lados[1].em : m.ate;
        const tempos = temposDoTexto(lado.texto, palavras, lado.em - 0.1, Math.max(proximo, lado.em + 0.5), lado.em);
        const aceso = prog(t, lado.em - 0.04, 0.2);
        const ganha = vencedor === i;
        const perde = vencedor !== undefined && vencedor !== i;
        const ls = linhasDe(i);
        // rótulo + texto no meio do cartão (a altura do bloco mais alto dos dois, para alinharem)
        const maisLinhas = Math.max(...[0, 1].map((k) => linhasDe(k).length));
        const bloco = 44 + 22 + maisLinhas * tam * 1.06;
        const yBloco = Math.max(PAD, (altura - bloco) / 2);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * (w + VAO),
              top: 0,
              width: w,
              height: altura,
              borderRadius: 28,
              background: cor.painel,
              boxShadow: `inset 0 0 0 ${ganha && pVence > 0.5 ? 3 : 1.5}px ${ganha && pVence > 0.5 ? cor.acento : cor.borda}`,
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", left: PAD, top: yBloco, width: interna, opacity: (perde ? 1 - 0.5 * pVence : 1) * texto }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, height: 44 }}>
                <span style={{ ...rotulo, fontSize: 32, color: aceso > 0.5 ? (ganha && pVence > 0.5 ? cor.acento : cor.textoSuave) : cor.apagado, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                  {lado.rotulo}
                </span>
                {ganha ? <Marca tipo="certo" p={pVence} /> : null}
                {perde && m.modo === "errado-certo" ? <Marca tipo="errado" p={pVence} /> : null}
              </div>
              <div style={{ height: 22 }} />
              <Linhas linhas={ls} tempos={tempos} t={t} tam={tam} modo="acende" entrelinha={1.06} estilo={{ ...titulo, fontSize: tam }} />
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: w + VAO / 2 - 38, top: altura / 2 - 38, opacity: texto }}>
        <Selo modo={m.modo} p={pSelo} />
      </div>
    </div>
  );
};
