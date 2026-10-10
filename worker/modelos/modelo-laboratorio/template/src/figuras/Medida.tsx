// Bloco universal `numero`: a medida do experimento. Uma proveta graduada, desenhada a tinta, enche
// de azul a lápis de cor enquanto a leitura (impressa, como num instrumento) conta até o valor dito;
// quando a conta termina, a leitura é sublinhada à mão. O nome do número vai à mão no cabeçalho.
import { Easing } from "remotion";
import { caneta, limitar, prog } from "../anim";
import { largura } from "../medir";
import type { Numero } from "../plano";
import { Definicoes, Esboco, Seta, Traco } from "../tinta/Tinta";
import { cor, formatar, H, mono, W } from "../tema";
import type { PropsFigura } from "./comum";
import { cabecalhoDoBloco } from "./Topo";

// Topo "redondo" da escala: 83.000 → 100.000; 7 → 10; 1,5 → 2
export const escalaDe = (valor: number, sufixo?: string) => {
  const v = Math.abs(valor);
  if (sufixo?.includes("%") && v <= 100) return 100;
  if (v <= 0) return 1;
  const base = 10 ** Math.floor(Math.log10(v));
  for (const k of [1, 2, 2.5, 5, 10]) if (base * k >= v * 1.08) return base * k;
  return base * 10;
};

// Número curto para as marcas da escala: 50000 → "50 mil"; 2500000 → "2,5 mi"
export const compacto = (n: number) => {
  const casas = (x: number) => (Number.isInteger(x) ? 0 : 1);
  if (Math.abs(n) >= 1e9) return `${formatar(n / 1e9, casas(n / 1e9))} bi`;
  if (Math.abs(n) >= 1e6) return `${formatar(n / 1e6, casas(n / 1e6))} mi`;
  if (Math.abs(n) >= 1e4) return `${formatar(n / 1e3, casas(n / 1e3))} mil`;
  return formatar(n, Number.isInteger(n) ? 0 : 1);
};

export const Carimbo: React.FC<{ x: number; y: number; texto?: string; opacidade?: number; alinhar?: "esquerda" | "direita" }> = ({ x, y, texto = "ilustrativo", opacidade = 1, alinhar = "esquerda" }) => (
  <div
    style={{
      position: "absolute",
      left: alinhar === "esquerda" ? x : undefined,
      right: alinhar === "direita" ? W - x : undefined,
      top: y,
      padding: "6px 14px 4px",
      border: `3px solid ${cor.vermelho}`,
      borderRadius: 6,
      fontFamily: mono,
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: cor.vermelho,
      opacity: 0.85 * opacidade,
      transform: "rotate(-4deg)",
      whiteSpace: "nowrap",
    }}
  >
    {texto}
  </div>
);

export const Medida: React.FC<PropsFigura<Numero>> = ({ m, t, areas, palavras, chegada, revela, opCabecalho, rotulo, id }) => {
  const cab = cabecalhoDoBloco({ areas, t, de: m.de, ate: m.ate, palavras, chegada, revela, rotulo, titulo: m.rotulo, em: m.rotuloEm, opacidade: opCabecalho });
  const a = cab.corpo;
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const escala = escalaDe(m.valor, m.sufixo);
  const alvo = limitar(m.valor / escala);
  const em = Math.max(m.em, chegada + 0.25);
  const conta = prog(t, em, 1.15, Easing.bezier(0.2, 0.7, 0.3, 1));
  const valorAgora = m.valor * conta;
  // a proveta: corpo de vidro, boca com aba, pé; a escala com 10 marcas
  const pw = Math.min(176, a.w * 0.19);
  const px = a.x + 34;
  const topo = a.y + 46;
  const pe = 26;
  const base = a.y + a.h - 40 - pe;
  const alturaUtil = base - topo - 60;
  const zero = base - 10;
  const yNivel = (f: number) => zero - f * alturaUtil;
  const pDesenho = prog(t, chegada + 0.15, 0.6, caneta);
  const pMarcas = prog(t, chegada + 0.45, 0.4);
  const contorno = `M ${px - 14} ${topo} L ${px} ${topo + 14} L ${px} ${base} Q ${px} ${base + 6} ${px + 8} ${base + 6} L ${px + pw - 8} ${base + 6} Q ${px + pw} ${base + 6} ${px + pw} ${base} L ${px + pw} ${topo + 14} L ${px + pw + 14} ${topo}`;
  const peD = `M ${px - 34} ${base + 6 + pe} L ${px + pw + 34} ${base + 6 + pe} M ${px + 10} ${base + 6} L ${px - 22} ${base + 6 + pe} M ${px + pw - 10} ${base + 6} L ${px + pw + 22} ${base + 6 + pe}`;
  const nivel = yNivel(alvo * conta);
  const liquido = `M ${px + 6} ${nivel} Q ${px + pw / 2} ${nivel + 12} ${px + pw - 6} ${nivel} L ${px + pw - 6} ${base} L ${px + 6} ${base} Z`;
  const marcas = Array.from({ length: 11 }, (_, i) => i / 10);
  // a leitura: prefixo menor, número grande, sufixo menor
  const xLeitura = px + pw + 175;
  const larguraLeitura = a.x + a.w - xLeitura;
  const final = formatar(m.valor, casas);
  const pre = m.prefixo ?? "";
  const suf = m.sufixo ?? "";
  const w100 = largura(final, 100, "mono", 700) + (pre ? largura(`${pre} `, 50, "mono", 700) : 0) + (suf ? largura(` ${suf}`, 50, "mono", 700) : 0);
  const corpo = Math.max(64, Math.min(170, Math.floor((larguraLeitura / Math.max(1, w100)) * 100)));
  const yAlvo = yNivel(alvo);
  // a leitura fica no meio da altura do corpo (o papel não fica vazio embaixo dela); a seta liga ao nível
  const yLeitura = Math.max(a.y + 30, Math.min(base - corpo * 1.9, a.y + a.h * 0.42 - corpo * 0.62));
  const pSub = prog(t, em + 1.15, 0.45, caneta);
  const aparece = prog(t, em - 0.1, 0.25);
  return (
    <>
      {cab.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        <Esboco d={contorno} opacidade={1 - pDesenho} />
        <Esboco d={peD} opacidade={1 - pDesenho} />
        {/* o líquido: azul a lápis de cor, com o menisco */}
        {conta > 0.001 ? (
          <>
            <path d={liquido} fill={cor.azul} opacity={0.82} />
            <path d={liquido} fill={`url(#${id}-lapis)`} />
          </>
        ) : null}
        <g filter={`url(#${id}-mao)`}>
          <Traco d={contorno} p={pDesenho} largura={5.5} />
          <Traco d={peD} p={pDesenho} largura={5.5} />
        </g>
        {/* as marcas da escala (a cada 10%, maiores no meio e no topo) */}
        {marcas.map((f, i) => {
          const y = yNivel(f);
          const longa = i % 5 === 0;
          return <path key={i} d={`M ${px + pw} ${y} L ${px + pw - (longa ? 46 : 24)} ${y}`} stroke={cor.tinta} strokeWidth={longa ? 4 : 3} strokeLinecap="round" opacity={pMarcas * (longa ? 0.95 : 0.6)} />;
        })}
        {/* a seta da leitura até o nível */}
        <Seta de={{ x: xLeitura - 20, y: yLeitura + corpo * 0.62 }} ate={{ x: px + pw + 22, y: yAlvo }} p={prog(t, em + 0.9, 0.35, caneta)} curva={0.18} cor={cor.azul} largura={5} />
        {/* o sublinhado da leitura, quando a conta termina */}
        <Traco d={`M ${xLeitura} ${yLeitura + corpo * 1.18} C ${xLeitura + 120} ${yLeitura + corpo * 1.1}, ${xLeitura + 260} ${yLeitura + corpo * 1.26}, ${xLeitura + Math.min(larguraLeitura, corpo * 0.62 * (final.length + 2))} ${yLeitura + corpo * 1.14}`} p={pSub} cor={cor.azul} largura={8} opacidade={0.9} />
      </svg>
      {/* os números da escala: 0, metade e topo */}
      {[0, 0.5, 1].map((f) => (
        <div key={f} style={{ position: "absolute", left: px + pw + 16, top: yNivel(f) - 20, fontFamily: mono, fontWeight: 700, fontSize: 30, color: cor.tintaSuave, whiteSpace: "nowrap", opacity: pMarcas }}>
          {compacto(escala * f)}
        </div>
      ))}
      {/* antes de ser dita, a leitura está esboçada a lápis (o caderno nunca tem lugar vazio esperando) */}
      {[0, 1].map((tinta) => (
        <div
          key={tinta}
          style={{
            position: "absolute",
            left: xLeitura,
            top: yLeitura,
            display: "flex",
            alignItems: "baseline",
            gap: corpo * 0.12,
            whiteSpace: "nowrap",
            opacity: tinta ? aparece : 0.55 * (1 - aparece) * prog(t, chegada, 0.3),
            color: tinta ? cor.tinta : cor.lapis,
            fontFamily: mono,
            fontWeight: 700,
          }}
        >
          {pre ? <span style={{ fontSize: corpo * 0.5, color: tinta ? cor.tintaSuave : cor.lapis }}>{pre}</span> : null}
          <span style={{ fontSize: corpo, letterSpacing: "-0.02em" }}>{tinta ? formatar(valorAgora, casas) : final}</span>
          {suf ? <span style={{ fontSize: corpo * 0.5, color: tinta ? cor.tintaSuave : cor.lapis }}>{suf}</span> : null}
        </div>
      ))}
      {m.ilustrativo ? <Carimbo x={xLeitura} y={yLeitura + corpo * 1.45} opacidade={prog(t, em + 1.1, 0.3)} /> : null}
    </>
  );
};
