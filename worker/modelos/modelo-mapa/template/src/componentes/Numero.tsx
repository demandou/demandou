// Número: o rótulo se escreve ao lado do cartão da pessoa; no meio da estação, o número conta até o
// valor (pt-BR) e, quando para, a caneta o circula e o marca-texto passa por baixo — como quem anota
// um número importante no caderno. Uma fileira de pontos do papel é riscada enquanto ele conta.
import { caneta, casasDe, Escrita, formatarNumero, prog, temposDoTexto, Traco } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Numero as TNumero, Palavra } from "../plano";
import { CARTAO, cor, MARGEM, selo, serifa, titulo as estiloTitulo } from "../tema";

const CENTRO = { x: 510, y: 1090 };
const LARGURA_MAX = 700;

const tamanhoDoSufixo = (s: string) => (/^\s*[%x×]/.test(s) ? 0.6 : 0.36);

export const geometriaDoNumero = (m: TNumero) => {
  const casas = m.casas ?? casasDe(m.valor);
  const final = formatarNumero(m.valor, casas);
  const prefixo = m.prefixo?.trim() ?? "";
  const sufixo = m.sufixo?.trim() ?? "";
  const largura = (S: number) =>
    (prefixo ? medir(prefixo, S * 0.36, "serifa700") + S * 0.08 : 0) +
    medir(final, S, "titulo") +
    (sufixo ? S * 0.06 + medir(sufixo, S * tamanhoDoSufixo(sufixo), "serifa700") : 0);
  let S = 280;
  while (S > 110 && largura(S) > LARGURA_MAX) S -= 6;
  const w = largura(S);
  // folga para o primeiro e o último algarismo não encostarem na curva da elipse
  const rx = w / 2 + Math.max(80, S * 0.42);
  const ry = S * 0.46 + 56;
  const larguraRotulo = CARTAO.numero.x - MARGEM - 44;
  const d = diagramar(m.rotulo, { equilibrar: true, largura: larguraRotulo, maximo: 84, minimo: 50, linhas: 4, altura: 430, entrelinha: 1.04 });
  return { casas, final, prefixo, sufixo, S, w, rx, ry, d, larguraRotulo, chegada: { x: CENTRO.x, y: CENTRO.y - ry } };
};

export const Numero: React.FC<{ m: TNumero; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDoNumero(m);
  const tempos = temposDoTexto(m.rotulo, palavras, m.de, m.ate, m.rotuloEm ?? m.de);
  const p = prog(t, m.em, 0.9, (s) => 1 - (1 - s) * (1 - s));
  const pCirculo = prog(t, m.em + 0.85, 0.55, caneta);
  const pMarca = prog(t, m.em + 0.8, 0.35, caneta);
  const valor = formatarNumero(m.valor * p, g.casas);
  const { S, rx, ry } = g;
  const { x: cx, y: cy } = CENTRO;
  // elipse levemente torta, desenhada à mão a partir da esquerda (dá um pouco mais que uma volta)
  const giro = (-3 * Math.PI) / 180;
  const elipse = Array.from({ length: 73 }, (_, i) => {
    const a = Math.PI + (i / 72) * 2.08 * Math.PI;
    const ex = rx * Math.cos(a) * (1 + 0.03 * Math.sin(a * 0.5));
    const ey = ry * Math.sin(a);
    return `${i ? "L" : "M"} ${(cx + ex * Math.cos(giro) - ey * Math.sin(giro)).toFixed(1)} ${(cy + ex * Math.sin(giro) + ey * Math.cos(giro)).toFixed(1)}`;
  }).join(" ");
  const yPontos = Math.min(1440, cy + ry + 100);
  const contando = t >= m.em;
  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: 178, width: g.larguraRotulo }}>
        <Escrita linhas={g.d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={g.d.tamanho} entrelinha={1.04} />
        {m.ilustrativo ? <div style={{ ...selo, marginTop: 26 }}>ilustrativo</div> : null}
      </div>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(-3 ${cx} ${cy})`} fill={cor.cartao} opacity={0.75} />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(-3 ${cx} ${cy})`} fill="none" stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="3 13" strokeLinecap="round" opacity={1 - pCirculo} />
        {/* o marca-texto passa por baixo do número quando ele para */}
        {pMarca > 0 ? <rect x={cx - g.w / 2 - 16} y={cy + S * 0.02} width={(g.w + 32) * pMarca} height={S * 0.33} rx={10} fill={cor.marca} transform={`skewX(-4)`} style={{ transformOrigin: `${cx}px ${cy}px` }} /> : null}
        <Traco d={elipse} p={pCirculo} cor={cor.tinta} largura={7} />
        {/* pontos do papel riscados enquanto o número conta */}
        {Array.from({ length: 19 }, (_, k) => {
          const u = k / 18;
          const feito = contando && p >= u - 1e-6;
          return <circle key={k} cx={130 + u * 760} cy={yPontos} r={feito ? 7 : 5} fill={feito ? cor.tinta : cor.lapisClaro} />;
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 1020,
          // algarismos da Bitter: a altura deles vai de 0,145 a 0,835 do corpo; o meio fica em cy
          top: cy - S * 0.49,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: S * 0.07,
          fontFamily: serifa,
          color: contando ? cor.tinta : cor.lapisClaro,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {g.prefixo ? <span style={{ fontWeight: 700, fontSize: S * 0.36 }}>{g.prefixo}</span> : null}
        <span style={{ fontWeight: 800, fontSize: S, fontVariantNumeric: "tabular-nums" }}>{valor}</span>
        {g.sufixo ? <span style={{ fontWeight: 700, fontSize: S * tamanhoDoSufixo(g.sufixo) }}>{g.sufixo}</span> : null}
      </div>
    </>
  );
};
