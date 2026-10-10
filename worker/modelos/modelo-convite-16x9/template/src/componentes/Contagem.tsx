import { limitar, mistura, pena, pousa, prog, Traco } from "../anim";
import { E, largura } from "../medida";
import { cor, gravado, TAM } from "../tema";

// Um marco do mostrador: o que aparece no centro, o que vai embaixo e quando é dito.
export type MarcaDoMostrador = { numero: string; unidade?: string; numeroEm: number };

const emLinhas = (unidade?: string) =>
  (unidade ?? "")
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => <div key={`${w}-${i}`}>{w}</div>);

// O anel do mostrador: um fio a lápis que se desenha, as marcas (uma por unidade) e o arco de cera
// azul que mostra quanto já foi (ou quanto falta), com o pino na ponta.
const Anel: React.FC<{ r: number; caixa: number; pAnel: number; marcas: number; f: number; corArco?: string }> = ({
  r,
  caixa,
  pAnel,
  marcas,
  f,
  corArco = cor.cera,
}) => {
  const ang = (fr: number) => (fr * 360 - 90) * (Math.PI / 180);
  const angFim = ang(f);
  return (
    <svg width={caixa} height={caixa} viewBox={`${-caixa / 2} ${-caixa / 2} ${caixa} ${caixa}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <Traco d={`M0 ${-r} A${r} ${r} 0 1 1 -0.01 ${-r}`} p={pAnel} cor={cor.tinta} largura={2} opacity={0.42} />
      <Traco d={`M0 ${-(r - 22)} A${r - 22} ${r - 22} 0 1 1 -0.01 ${-(r - 22)}`} p={pAnel} cor={cor.tinta} largura={1} opacity={0.28} />
      {Array.from({ length: marcas }, (_, i) => {
        const a = ang(i / marcas);
        const longa = marcas <= 6 || i % 3 === 0;
        const r0 = r - (longa ? 17 : 12);
        return (
          <line
            key={i}
            x1={Math.cos(a) * r0}
            y1={Math.sin(a) * r0}
            x2={Math.cos(a) * (r - 4)}
            y2={Math.sin(a) * (r - 4)}
            stroke={cor.tinta}
            strokeWidth={longa ? 3 : 2}
            strokeLinecap="round"
            opacity={0.55 * prog(pAnel, i / marcas, 0.2)}
          />
        );
      })}
      {f > 0.002 ? (
        <circle r={r} fill="none" stroke={corArco} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.min(f, 0.9999)} 1`} transform="rotate(-90)" />
      ) : null}
      {f > 0.002 ? (
        <>
          <circle cx={Math.cos(angFim) * r} cy={Math.sin(angFim) * r} r={13} fill={cor.papel} stroke={corArco} strokeWidth={4} />
          <circle cx={Math.cos(angFim) * r} cy={Math.sin(angFim) * r} r={5} fill={corArco} />
        </>
      ) : null}
    </svg>
  );
};

// corpo do número no centro: o maior que cabe dentro do anel (138 px para até 2 algarismos)
const corpoNoAnel = (txt: string, r: number) => {
  const base = TAM.numeroContagem * ([...txt].length >= 3 ? 0.72 : 1);
  const w = largura(txt, 100, E.numero) / 100;
  return Math.max(48, Math.min(base, (2 * (r - 30)) / Math.max(0.01, w)));
};

// Contagem: o mostrador com um número que rola no centro a cada marco dito. Com números, o arco
// mostra a proporção (12 → 9 → 6…); com outros rótulos (I, II, III; "A"), avança um passo por marco.
// Embaixo, a unidade, uma palavra por linha ("MESES" / "ANTES").
export const Contagem: React.FC<{
  marcos: MarcaDoMostrador[];
  t: number;
  cx: number;
  cy: number;
  r: number;
  visivel: number;
  // número de marcas no anel (padrão: uma por unidade, quando os números são inteiros até 24)
  ticks?: number;
  // quanto do anel cada marco preenche (padrão: a proporção do número, ou um passo por marco)
  fracoes?: number[];
}> = ({ marcos, t, cx, cy, r, visivel, ticks, fracoes }) => {
  if (visivel <= 0.001 || marcos.length === 0) return null;
  const valores = marcos.map((m) => Number(String(m.numero).replace(",", ".")));
  const numericos = valores.every((v) => Number.isFinite(v) && v > 0);
  const maximo = numericos ? Math.max(...valores) : marcos.length;
  const fracao = (k: number) => (k < 0 ? 0 : fracoes ? (fracoes[k] ?? 1) : numericos ? valores[k] / maximo : (k + 1) / marcos.length);
  // marco atual: o último cujo número já foi dito
  let k = -1;
  marcos.forEach((m, i) => {
    if (t >= m.numeroEm - 0.12) k = i;
  });
  const pArco = k >= 0 ? prog(t, marcos[k].numeroEm - 0.1, 0.8) : 0;
  const f = k >= 0 ? mistura(k === 0 ? 0 : fracao(k - 1), fracao(k), pArco) : 0;
  const marcas = ticks ?? (numericos && Number.isInteger(maximo) && maximo <= 24 ? maximo : 0);
  const pAnel = prog(t, (marcos[0]?.numeroEm ?? 0) - 0.6, 0.7);

  // número que rola: o anterior sobe e some, o novo sobe de baixo
  const pNum = k >= 0 ? prog(t, marcos[k].numeroEm - 0.08, 0.5) : 0;
  const atual = k >= 0 ? marcos[k] : null;
  const antes = k > 0 ? marcos[k - 1] : null;
  const unidadeMuda = atual && antes ? (atual.unidade ?? "") !== (antes.unidade ?? "") : true;

  const tamanhoNumero = corpoNoAnel(String(atual?.numero ?? "12"), r);
  const caixa = r * 2 + 40;

  return (
    <div style={{ position: "absolute", left: cx - caixa / 2, top: cy - caixa / 2, width: caixa, height: caixa, opacity: visivel, scale: String(0.92 + 0.08 * visivel) }}>
      <Anel r={r} caixa={caixa} pAnel={pAnel} marcas={marcas} f={f} />

      {/* número */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: caixa / 2 - tamanhoNumero * 0.62,
          height: tamanhoNumero * 1.14,
          overflow: "hidden",
          fontFamily: gravado,
          fontWeight: 600,
          fontSize: tamanhoNumero,
          lineHeight: 1.14,
          color: cor.tinta,
          textAlign: "center",
        }}
      >
        {antes && pNum < 1 ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, fontSize: corpoNoAnel(antes.numero, r), translate: `0 ${-pNum * 70}%`, opacity: 1 - prog(pNum, 0, 0.32, (x) => x) }}>
            {antes.numero}
          </div>
        ) : null}
        {atual ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, translate: `0 ${(1 - pNum) * 70}%`, opacity: antes ? prog(pNum, 0.36, 0.4, (x) => x) : limitar(pNum * 1.4) }}>{atual.numero}</div>
        ) : null}
      </div>

      {/* unidade */}
      <div
        style={{
          position: "absolute",
          left: -60,
          right: -60,
          top: caixa / 2 + r + 22,
          textAlign: "center",
          fontFamily: gravado,
          fontWeight: 600,
          fontSize: TAM.unidade,
          lineHeight: 1.12,
          letterSpacing: "0.16em",
          color: cor.tintaSuave,
        }}
      >
        {antes && unidadeMuda && pNum < 1 ? (
          <div style={{ position: "absolute", left: 0, right: 0, opacity: 1 - pNum }}>{emLinhas(antes.unidade)}</div>
        ) : null}
        <div style={{ opacity: atual ? (unidadeMuda ? prog(pNum, 0.3, 0.7, pousa) : 1) : 0 }}>{emLinhas((atual ?? marcos[0]).unidade)}</div>
      </div>
    </div>
  );
};

// Mostrador de uma comparação: o anel se divide em duas metades, cada uma ganha tinta quando o seu
// lado é dito; o vencedor fica com o arco de cera. No centro, o sinal da comparação.
export const MostradorVersus: React.FC<{
  t: number;
  cx: number;
  cy: number;
  r: number;
  visivel: number;
  ems: [number, number];
  vencedor?: 0 | 1;
  vencedorEm?: number;
  modo?: "contra" | "antes-depois" | "errado-certo";
}> = ({ t, cx, cy, r, visivel, ems, vencedor, vencedorEm, modo = "contra" }) => {
  if (visivel <= 0.001) return null;
  const caixa = r * 2 + 40;
  const pAnel = prog(t, ems[0] - 0.6, 0.7);
  const p0 = prog(t, ems[0] - 0.05, 0.7, pena);
  const p1 = prog(t, ems[1] - 0.05, 0.7, pena);
  const pv = vencedor !== undefined ? prog(t, (vencedorEm ?? ems[vencedor] + 0.4) - 0.05, 0.6) : 0;
  // metade esquerda (lado 0) desce pela esquerda; metade direita (lado 1) desce pela direita
  const meia = (lado: 0 | 1, p: number, corDe: string, w: number) => {
    if (p <= 0.002) return null;
    const d = lado === 0 ? `M0 ${-r} A${r} ${r} 0 0 0 0 ${r}` : `M0 ${-r} A${r} ${r} 0 0 1 0 ${r}`;
    return <Traco d={d} p={p} cor={corDe} largura={w} />;
  };
  const pSinal = prog(t, ems[1] - 0.25, 0.6, pena);
  return (
    <div style={{ position: "absolute", left: cx - caixa / 2, top: cy - caixa / 2, width: caixa, height: caixa, opacity: visivel, scale: String(0.92 + 0.08 * visivel) }}>
      <svg width={caixa} height={caixa} viewBox={`${-caixa / 2} ${-caixa / 2} ${caixa} ${caixa}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Traco d={`M0 ${-r} A${r} ${r} 0 1 1 -0.01 ${-r}`} p={pAnel} cor={cor.tinta} largura={2} opacity={0.42} />
        <Traco d={`M0 ${-(r - 22)} A${r - 22} ${r - 22} 0 1 1 -0.01 ${-(r - 22)}`} p={pAnel} cor={cor.tinta} largura={1} opacity={0.28} />
        {/* o fio que divide o mostrador ao meio */}
        <Traco d={`M0 ${-r + 8} V${-58}`} p={pAnel} cor={cor.tinta} largura={1.6} opacity={0.5} />
        <Traco d={`M0 ${58} V${r - 8}`} p={pAnel} cor={cor.tinta} largura={1.6} opacity={0.5} />
        {meia(0, p0, cor.tinta, 7)}
        {meia(1, p1, cor.tinta, 7)}
        {vencedor !== undefined ? meia(vencedor, pv, cor.cera, 9) : null}
      </svg>
      <svg width={caixa} height={caixa} viewBox={`${-caixa / 2} ${-caixa / 2} ${caixa} ${caixa}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {modo === "antes-depois" ? (
          <>
            <Traco d="M-40 0 H38" p={pSinal} cor={cor.cera} largura={9} />
            <Traco d="M14 -24 L40 0 L14 24" p={prog(pSinal, 0.5, 0.5, (x) => x)} cor={cor.cera} largura={9} />
          </>
        ) : (
          <>
            <Traco d="M-32 -32 L32 32" p={pSinal} cor={cor.cera} largura={9} />
            <Traco d="M32 -32 L-32 32" p={prog(pSinal, 0.35, 0.65, (x) => x)} cor={cor.cera} largura={9} />
          </>
        )}
      </svg>
    </div>
  );
};

// Mostrador de um gráfico: com números ditos, o valor do dado da vez rola no centro e o arco mostra
// a proporção dele no maior; sem números (tendência), uma seta a pena desenha a direção.
export const MostradorGrafico: React.FC<{
  t: number;
  cx: number;
  cy: number;
  r: number;
  visivel: number;
  dados?: { valor: number; em: number; texto: string }[];
  tendencia?: "sobe" | "cai" | "oscila";
  tendenciaEm?: number;
  unidade?: string;
  ilustrativo?: boolean;
}> = ({ t, cx, cy, r, visivel, dados, tendencia, tendenciaEm = 0, unidade, ilustrativo }) => {
  if (visivel <= 0.001) return null;
  const caixa = r * 2 + 40;
  if (dados?.length) {
    const maximo = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
    return (
      <Contagem
        marcos={dados.map((d) => ({ numero: d.texto, unidade, numeroEm: d.em }))}
        fracoes={dados.map((d) => Math.abs(d.valor) / maximo)}
        t={t}
        cx={cx}
        cy={cy}
        r={r}
        visivel={visivel}
        ticks={dados.length}
      />
    );
  }
  // tendência: a seta se desenha no anel
  const pAnel = prog(t, tendenciaEm - 0.6, 0.7);
  const pSeta = prog(t, tendenciaEm, 0.9, pena);
  const s = r * 0.55;
  const caminho =
    tendencia === "cai"
      ? `M${-s} ${-s * 0.7} C${-s * 0.3} ${-s * 0.6} ${-s * 0.1} ${s * 0.1} ${s} ${s * 0.7}`
      : tendencia === "oscila"
        ? `M${-s} ${s * 0.1} C${-s * 0.6} ${-s * 0.7} ${-s * 0.3} ${-s * 0.7} 0 0 S${s * 0.6} ${s * 0.7} ${s} ${-s * 0.1}`
        : `M${-s} ${s * 0.7} C${-s * 0.3} ${s * 0.6} ${-s * 0.1} ${-s * 0.1} ${s} ${-s * 0.7}`;
  const ponta = tendencia === "cai" ? { x: s, y: s * 0.7, a: 35 } : tendencia === "oscila" ? { x: s, y: -s * 0.1, a: -40 } : { x: s, y: -s * 0.7, a: -35 };
  const pPonta = prog(t, tendenciaEm + 0.75, 0.3);
  return (
    <div style={{ position: "absolute", left: cx - caixa / 2, top: cy - caixa / 2, width: caixa, height: caixa, opacity: visivel, scale: String(0.92 + 0.08 * visivel) }}>
      <Anel r={r} caixa={caixa} pAnel={pAnel} marcas={0} f={0} />
      <svg width={caixa} height={caixa} viewBox={`${-caixa / 2} ${-caixa / 2} ${caixa} ${caixa}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Traco d={caminho} p={pSeta} cor={cor.cera} largura={9} />
        {pPonta > 0.01 ? (
          <g transform={`translate(${ponta.x} ${ponta.y}) rotate(${ponta.a})`} opacity={pPonta}>
            <path d="M-26 -16 L2 0 L-26 16" fill="none" stroke={cor.cera} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          left: -60,
          right: -60,
          top: caixa / 2 + r + 22,
          textAlign: "center",
          fontFamily: gravado,
          fontWeight: 600,
          fontSize: TAM.unidade,
          lineHeight: 1.12,
          letterSpacing: "0.16em",
          color: cor.tintaSuave,
          opacity: prog(t, tendenciaEm + 0.3, 0.5),
        }}
      >
        {emLinhas(unidade)}
        {ilustrativo ? <div style={{ fontSize: TAM.minRotulo + 2, marginTop: unidade ? 8 : 0 }}>ILUSTRATIVO</div> : null}
      </div>
    </div>
  );
};
