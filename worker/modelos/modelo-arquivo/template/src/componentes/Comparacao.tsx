import { Datilo, entra as entraEasing, preciso, prog } from "../anim";
import { partesDaRegiao, type Regiao } from "../layout";
import { encaixar } from "../medida";
import type { Comparacao as TComparacao, Layout } from "../plano";
import { cor, rotulo, sans, sombraPapel } from "../tema";
import { Cabeca, medirCabeca } from "./Cabeca";
import { Deslizar } from "./Papel";

// Dois documentos lado a lado sobre a mesa, um selo vermelho entre eles (× ou →).
// O vencedor (ou o lado certo) ganha um círculo vermelho feito à mão; o outro leva um risco
// de caneta na diagonal e esmaece, como num dossiê conferido.
export const Comparacao: React.FC<{ m: TComparacao; t: number; fim: number; regiao: Regiao; layout: Layout }> = ({ m, t, fim, regiao, layout }) => {
  const larguraTitulo = layout === "canto" ? partesDaRegiao(layout, regiao, 0).cabeca.w : regiao.w;
  // no canto, o título enche o pedaço ao lado da foto
  const cab = layout === "canto" ? medirCabeca(m.titulo, larguraTitulo - 8, 96, 3) : medirCabeca(m.titulo, larguraTitulo - 8);
  const { cabeca, corpo } = partesDaRegiao(layout, regiao, cab.altura);
  const modo = m.modo ?? "contra";
  const VAO = 76;
  const w = (corpo.w - VAO) / 2;
  const hMax = Math.min(corpo.h - 16, 760);
  const xs = [corpo.x, corpo.x + w + VAO];
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const vencedorEm = m.vencedorEm ?? (vencedor !== undefined ? Math.max(...m.lados.map((l) => l.em)) + 0.9 : 0);
  const marca = vencedor !== undefined ? prog(t, vencedorEm, 0.6, preciso) : 0;
  const PAD = 30;
  const larguraTexto = w - 2 * PAD;
  // os dois textos no mesmo corpo (o maior que cabe nos dois)
  const maxCorpo = Math.min(86, Math.floor((hMax - 170) / 4.3));
  const corpoTexto = Math.min(...m.lados.map((l) => encaixar(l.texto, { largura: larguraTexto, max: maxCorpo, min: 38, linhas: 4, fonte: { peso: 800 } }).tamanho));
  // o documento tem a altura do que vai escrito (o lado com mais linhas), centrado na região
  const linhasMaior = Math.max(...m.lados.map((l) => encaixar(l.texto, { largura: larguraTexto, max: corpoTexto, min: corpoTexto, linhas: 4, fonte: { peso: 800 } }).linhas.length));
  const rotLinhas = Math.max(...m.lados.map((l) => encaixar(l.rotulo.toUpperCase(), { largura: larguraTexto - 32, max: 38, min: 30, linhas: 2, fonte: { mono: true, espacamento: 0.14 } }).linhas.length));
  const h = Math.min(hMax, Math.max(380, 10 + 26 + rotLinhas * 44 + 26 + 28 + linhasMaior * corpoTexto * 1.06 + 70));
  const y = corpo.y + 8 + Math.max(0, (hMax - h) / 2);
  const selo = prog(t, m.lados[1].em - 0.2, 0.3);
  const simbolo = modo === "contra" ? "×" : "→";
  return (
    <Deslizar t={t} de={m.de} fim={fim}>
      <Cabeca fit={cab.fit} x={cabeca.x} y={cabeca.y + (layout === "canto" ? 30 : 4)} em={m.de + 0.2} t={t} semente={400} />
      {m.lados.map((lado, i) => {
        const chega = prog(t, lado.em - 0.1, 0.45, entraEasing);
        const fit = encaixar(lado.texto, { largura: larguraTexto, max: corpoTexto, min: corpoTexto, linhas: 4, fonte: { peso: 800 } });
        const rot = encaixar(lado.rotulo.toUpperCase(), { largura: larguraTexto - 32, max: 38, min: 30, linhas: 2, fonte: { mono: true, espacamento: 0.14 } });
        const perdedor = vencedor !== undefined && vencedor !== i;
        const ganhador = vencedor === i;
        return (
          <div key={i}>
            {/* a lápis: o lugar do documento antes de o lado ser dito */}
            {chega < 1 ? (
              <div style={{ position: "absolute", left: xs[i], top: y, width: w, height: h, boxSizing: "border-box", border: `3px dashed ${cor.grafite}`, opacity: 0.3 * (1 - chega) }} />
            ) : null}
            {chega > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: xs[i],
                  top: y,
                  width: w,
                  height: h,
                  background: cor.cartao,
                  boxShadow: sombraPapel,
                  rotate: `${i === 0 ? -0.8 : 0.7}deg`,
                  translate: `0 ${(1 - chega) * 70}px`,
                  boxSizing: "border-box",
                  padding: `0 ${PAD}px`,
                  overflow: "hidden",
                }}
              >
                <div style={{ height: 10, margin: `0 -${PAD}px`, background: cor.vermelho }} />
                <div
                  style={{
                    ...rotulo,
                    fontSize: rot.tamanho,
                    lineHeight: 1.15,
                    letterSpacing: "0.14em",
                    color: cor.vermelho,
                    border: `3px solid ${cor.vermelho}`,
                    padding: "10px 14px 8px",
                    marginTop: 26,
                    display: "inline-block",
                  }}
                >
                  {rot.linhas.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>
                      <Datilo texto={l} em={lado.em + k * 0.2} t={t} semente={410 + i * 3 + k} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 28, fontFamily: sans, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.06, color: cor.tinta, opacity: perdedor ? 1 - 0.45 * marca : 1 }}>
                  {fit.linhas.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>
                      <Datilo texto={l} em={lado.em + 0.25 + k * 0.22} t={t} semente={420 + i * 5 + k} />
                    </div>
                  ))}
                </div>
                {/* risco de caneta na diagonal sobre o lado que perde */}
                {perdedor && marca > 0 ? (
                  <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
                    <line x1={24} y1={h - 40} x2={24 + (w - 48) * marca} y2={h - 40 - (h - 120) * marca} stroke={cor.vermelho} strokeWidth={7} strokeLinecap="round" />
                  </svg>
                ) : null}
              </div>
            ) : null}
            {/* círculo vermelho à mão em volta do lado que vence */}
            {ganhador && marca > 0 ? (
              <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                <ellipse
                  cx={xs[i] + w / 2}
                  cy={y + h / 2}
                  rx={w / 2 + 22}
                  ry={h / 2 + 26}
                  fill="none"
                  stroke={cor.vermelho}
                  strokeWidth={6}
                  pathLength={1}
                  strokeDasharray={`${marca * 1.04} 2`}
                  transform={`rotate(-4 ${xs[i] + w / 2} ${y + h / 2})`}
                />
              </svg>
            ) : null}
          </div>
        );
      })}
      {/* selo entre os dois lados */}
      <div
        style={{
          position: "absolute",
          left: corpo.x + w + VAO / 2 - 40,
          top: y + Math.min(h / 2, 220) - 40,
          width: 80,
          height: 80,
          borderRadius: 40,
          background: cor.vermelho,
          color: cor.cartao,
          fontFamily: sans,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: "80px",
          textAlign: "center",
          boxShadow: "0 4px 8px rgba(21,21,21,0.25)",
          scale: String(0.5 + 0.5 * selo),
          opacity: selo,
        }}
      >
        {simbolo}
      </div>
    </Deslizar>
  );
};
