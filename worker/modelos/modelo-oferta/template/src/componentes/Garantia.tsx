// O selo de garantia: um carimbo redondo de borda recortada, verde profundo, com o texto correndo em
// volta e o valor no centro ("7" + "DIAS"). Ele CARIMBA na palavra: desce grande e inclinado, bate,
// deixa um anel de tinta que se espalha e assenta torto (−8°). Na doca, quando o próximo item entra,
// ele encolhe e voa até o canto do cartão do preço, onde fica como um carimbo pequeno só com o centro
// ("7 DIAS" grande; sem número, o escudo).
import { Easing, interpolate } from "remotion";
import { prog, saindo, salto, soco, suave } from "../anim";
import { larguraTexto } from "../medida";
import type { Garantia as TGarantia } from "../plano";
import { cor, fonte, PAINEL } from "../tema";
import { AREA_DOCA, type Doca, SELO_NA_DOCA } from "./Oferta";
import { Icone } from "./Pecas";

// o desenho do selo (diâmetro d), com o texto em volta e o centro
// `compacto` (0 → 1): o carimbo pequeno da doca. O texto em volta some e o centro ("7 DIAS") cresce
// até ocupar o selo: no tamanho pequeno, só o que se lê fica.
export const DesenhoDoSelo: React.FC<{ t: number; d: number; texto: string; valor?: string; unidade?: string; valorEm?: number; id: string; compacto?: number }> = ({ t, d, texto, valor, unidade, valorEm, id, compacto = 0 }) => {
  const R = d / 2;
  const n = 30;
  const rArco = R * 0.79;
  const TXT = texto.toLocaleUpperCase("pt-BR");
  // o texto em volta: cabe no arco de cima (~200°); longo demais, dá a volta inteira
  let tam = R * 0.14;
  const esp = 0.14;
  const arcoCima = rArco * Math.PI * 0.92;
  while (tam > R * 0.085 && larguraTexto(TXT, tam, { peso: 800, espacamento: esp }) > arcoCima) tam -= 1;
  const voltaInteira = larguraTexto(TXT, tam, { peso: 800, espacamento: esp }) > arcoCima;
  if (voltaInteira) while (tam > R * 0.07 && larguraTexto(TXT, tam, { peso: 800, espacamento: esp }) > rArco * Math.PI * 1.85) tam -= 1;
  const rTexto = rArco - tam * 0.34;
  // caminho do texto: arco de cima, da esquerda para a direita (ou o círculo inteiro)
  const caminho = voltaInteira
    ? `M ${R} ${R + rTexto} A ${rTexto} ${rTexto} 0 1 1 ${R - 0.01} ${R + rTexto}`
    : `M ${R - rTexto} ${R} A ${rTexto} ${rTexto} 0 1 1 ${R + rTexto} ${R}`;
  const pV = valorEm !== undefined ? prog(t, valorEm, 0.36, salto) : 1;
  const golpeV = valorEm !== undefined ? soco(t, valorEm + 0.05, 0.3) : 0;
  const tamValor = valor ? Math.min(R * (0.78 + 0.22 * compacto), (R * (1.0 + 0.3 * compacto)) / Math.max(1, larguraTexto(valor, 1, { peso: 800 }))) : 0;
  const tamUnid = R * (0.17 + 0.09 * compacto);
  return (
    <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <path id={`arco-${id}`} d={caminho} />
      </defs>
      {/* a borda recortada: um disco + bolinhas em volta */}
      <circle cx={R} cy={R} r={R * 0.93} fill={cor.acento} />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return <circle key={i} cx={R + Math.cos(a) * R * 0.92} cy={R + Math.sin(a) * R * 0.92} r={R * 0.085} fill={cor.acento} />;
      })}
      <circle cx={R} cy={R} r={R * 0.875} fill="none" stroke={cor.cartao} strokeOpacity={0.55} strokeWidth={Math.max(1.5, R * 0.012)} strokeDasharray={`${R * 0.02} ${R * 0.035}`} />
      <circle cx={R} cy={R} r={R * (0.6 + 0.2 * compacto)} fill="none" stroke={cor.cartao} strokeOpacity={0.8} strokeWidth={Math.max(2, R * 0.016)} />
      <text fill={cor.cartao} opacity={1 - compacto} style={{ fontFamily: fonte, fontWeight: 800, fontSize: tam, letterSpacing: `${esp}em` }}>
        <textPath href={`#arco-${id}`} startOffset="50%" textAnchor="middle">
          {TXT}
        </textPath>
      </text>
      {!voltaInteira && compacto < 1 ? (
        // três estrelinhas embaixo, onde o texto não chega
        [-1, 0, 1].map((k) => {
          const a = Math.PI / 2 + k * 0.32;
          const x = R + Math.cos(a) * rArco * 0.98;
          const y = R + Math.sin(a) * rArco * 0.98;
          const s = R * 0.05 * (k === 0 ? 1.25 : 1);
          return <path key={k} opacity={1 - compacto} d={`M ${x} ${y - s} L ${x + s * 0.3} ${y - s * 0.3} L ${x + s} ${y} L ${x + s * 0.3} ${y + s * 0.3} L ${x} ${y + s} L ${x - s * 0.3} ${y + s * 0.3} L ${x - s} ${y} L ${x - s * 0.3} ${y - s * 0.3} Z`} fill={cor.cartao} />;
        })
      ) : null}
      {valor ? (
        <g transform={`translate(${R} ${R}) scale(${pV * (1 + 0.08 * golpeV)})`} opacity={Math.min(1, pV * 1.5)}>
          <text x={0} y={unidade ? -R * (0.02 - 0.04 * compacto) : tamValor * 0.36} textAnchor="middle" fill={cor.cartao} style={{ fontFamily: fonte, fontWeight: 800, fontSize: tamValor, letterSpacing: "-0.04em" }}>
            {valor}
          </text>
          {unidade ? (
            <text x={0} y={R * (0.36 + 0.1 * compacto)} textAnchor="middle" fill={cor.cartao} style={{ fontFamily: fonte, fontWeight: 800, fontSize: tamUnid, letterSpacing: "0.08em" }}>
              {unidade.toLocaleUpperCase("pt-BR")}
            </text>
          ) : null}
        </g>
      ) : (
        <g transform={`translate(${R - R * 0.42} ${R - R * 0.42})`}>
          <foreignObject width={R * 0.84} height={R * 0.84}>
            <Icone nome="escudo" tamanho={R * 0.84} cor={cor.cartao} traco={1.6} />
          </foreignObject>
        </g>
      )}
    </svg>
  );
};

// A batida do carimbo: desce grande e inclinado e bate em `em` + 0,16 s.
const carimbo = (t: number, em: number) => {
  const bate = em + 0.16;
  if (t < em - 0.02) return { opacity: 0, escala: 1.7, giro: -20, anel: 0 };
  if (t < bate) {
    const k = Easing.in(Easing.quad)((t - em + 0.02) / 0.18);
    return { opacity: Math.min(1, k * 2.5), escala: 1.7 - 0.7 * k, giro: -20 + 12 * k, anel: 0 };
  }
  const d = t - bate;
  const assenta = d < 0.14 ? 1 - 0.05 * Math.sin((Math.PI * d) / 0.14) : 1;
  return { opacity: 1, escala: assenta, giro: -8, anel: d };
};

export const Garantia: React.FC<{ t: number; m: TGarantia; fim: number; doca: Doca | null; proximoDe: number | null }> = ({ t, m, fim, doca, proximoDe }) => {
  const fimTotal = doca ? doca.fim : fim;
  if (t < m.em - 0.1 || t > fimTotal + 0.3) return null;
  const sai = saindo(t, fimTotal, 0.22);
  const c = carimbo(t, m.em);
  // posição grande: no centro da área livre (embaixo da doca) ou no centro da página
  const area = doca ? AREA_DOCA : { y: PAINEL.y, base: PAINEL.base };
  const dGrande = Math.min(420, area.base - area.y - 40);
  const grande = { cx: 540, cy: (area.y + area.base) / 2, d: dGrande };
  // na doca, quando o próximo item entra, o selo voa para o canto do cartão do preço
  const pVoa = doca && proximoDe !== null ? prog(t, proximoDe - 0.16, 0.38, suave) : 0;
  const cx = interpolate(pVoa, [0, 1], [grande.cx, SELO_NA_DOCA.cx]);
  const cy = interpolate(pVoa, [0, 1], [grande.cy, SELO_NA_DOCA.cy]);
  const d = interpolate(pVoa, [0, 1], [grande.d, SELO_NA_DOCA.d]);
  const balanca = pVoa >= 1 ? Math.sin((t - (proximoDe ?? 0)) * 1.6) * 1.2 : Math.sin(Math.max(0, t - m.em - 0.3) * 1.3) * 0.8;
  const pAnel = c.anel > 0 ? Math.min(1, c.anel / 0.55) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {/* o anel de tinta que se espalha na batida */}
      {pAnel > 0 && pAnel < 1 ? (
        <div
          style={{
            position: "absolute",
            left: grande.cx - grande.d / 2,
            top: grande.cy - grande.d / 2,
            width: grande.d,
            height: grande.d,
            borderRadius: grande.d / 2,
            border: `${10 * (1 - pAnel)}px solid ${cor.acento}`,
            opacity: 0.35 * (1 - pAnel),
            transform: `scale(${1 + 0.35 * Easing.out(Easing.cubic)(pAnel)})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: cx - d / 2,
          top: cy - d / 2,
          width: d,
          height: d,
          opacity: c.opacity,
          transform: `rotate(${c.giro + balanca}deg) scale(${c.escala})`,
          filter: `drop-shadow(0 ${8 + 10 * (c.escala - 1)}px ${14 + 20 * (c.escala - 1)}px rgba(15,51,40,0.25))`,
        }}
      >
        <DesenhoDoSelo t={t} d={d} texto={m.texto} valor={m.valor} unidade={m.unidade} valorEm={m.valorEm} id={`g${Math.round(m.em * 100)}`} compacto={pVoa} />
      </div>
    </div>
  );
};
