// Peças de desenho da carta celeste, usadas pelos blocos universais (as mesmas regras da Carta):
// estrela que nasce a lápis e acende com uma onda curta, linha de constelação com folga, localizador
// vermelho, cruz de alvo, reta vermelha tracejada que anda até o alvo, letreiro e textos que acendem
// palavra por palavra.
import { gira, mistura, prog, TextoAceso } from "../anim";
import type { Encaixe } from "../medida";
import { cor, sans, serifa, W } from "../tema";

export type P = { x: number; y: number };

export const dist = (a: P, b: P) => Math.hypot(b.x - a.x, b.y - a.y);
const unit = (a: P, b: P) => {
  const d = dist(a, b) || 1;
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
};

// Estrela: antes da palavra, um ponto apagado com um círculo tracejado (a lápis); na palavra, acende
// com uma onda curta e fica com um anel fino; `brilho` dá os raios de difração (estrela muito brilhante).
export const Estrela: React.FC<{ x: number; y: number; r: number; t: number; em: number; brilhoEm?: number; lapis?: number; apagar?: number }> = ({
  x,
  y,
  r,
  t,
  em,
  brilhoEm,
  lapis = 1,
  apagar = 0,
}) => {
  const aceso = prog(t, em - 0.04, 0.3) * (1 - 0.6 * apagar);
  const b = brilhoEm !== undefined ? prog(t, brilhoEm, 0.7) * (1 - apagar) : 0;
  const raio = r * (0.55 + 0.45 * aceso) * (1 + 0.38 * b);
  const onda = prog(t, em, 0.8);
  const respira = 1 + 0.06 * Math.sin(t * 3.1 + x * 0.05);
  const raioFino = (ang: number, comp: number, larg: number) => {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    return `M ${x + c * comp} ${y + s * comp} L ${x - s * larg} ${y + c * larg} L ${x - c * comp} ${y - s * comp} L ${x + s * larg} ${y - c * larg} Z`;
  };
  return (
    <g>
      {aceso < 1 && lapis > 0 ? <circle cx={x} cy={y} r={r + 13} fill="none" stroke={cor.lapis} strokeWidth={2} strokeDasharray="3 6" opacity={lapis * (1 - aceso)} /> : null}
      <circle cx={x} cy={y} r={raio} fill={aceso > 0 ? cor.estrela : "#C9CDE6"} opacity={0.42 + 0.58 * aceso} />
      {aceso > 0 && onda < 1 ? <circle cx={x} cy={y} r={raio + 6 + 34 * onda} fill="none" stroke={cor.estrela} strokeWidth={2.5} opacity={0.55 * (1 - onda)} /> : null}
      {aceso > 0 ? <circle cx={x} cy={y} r={raio + 6.5} fill="none" stroke={cor.estrela} strokeWidth={1.6} opacity={0.32 * aceso} /> : null}
      {b > 0 ? (
        <g fill={cor.estrela}>
          <path d={raioFino(0, raio * 6.5 * b * respira, 2.6)} opacity={0.85} />
          <path d={raioFino(Math.PI / 2, raio * 6.5 * b * respira, 2.6)} opacity={0.85} />
          <path d={raioFino(Math.PI / 4, raio * 3 * b * respira, 1.6)} opacity={0.5} />
          <path d={raioFino(-Math.PI / 4, raio * 3 * b * respira, 1.6)} opacity={0.5} />
        </g>
      ) : null}
    </g>
  );
};

// Linha de constelação entre duas estrelas, com folga em volta de cada uma. Antes de `em`, pontilhado
// a lápis; no `em`, o traço cheio corre de `a` até `b`.
export const Ligacao: React.FC<{ a: P; b: P; ra: number; rb: number; t: number; em: number; lapis?: number; cor?: string; largura?: number }> = ({
  a,
  b,
  ra,
  rb,
  t,
  em,
  lapis = 1,
  cor: corLinha = cor.linha,
  largura = 4.5,
}) => {
  const d = dist(a, b);
  const fa = ra + 9;
  const fb = rb + 9;
  if (d <= fa + fb) return null;
  const n = unit(a, b);
  const ini = { x: a.x + n.x * fa, y: a.y + n.y * fa };
  const fim = { x: b.x - n.x * fb, y: b.y - n.y * fb };
  const u = prog(t, em, 0.5, gira);
  return (
    <g>
      {u < 1 && lapis > 0 ? <line x1={ini.x} y1={ini.y} x2={fim.x} y2={fim.y} stroke={cor.lapis} strokeWidth={2.5} strokeDasharray="2 10" strokeLinecap="round" opacity={lapis} /> : null}
      {u > 0 ? <line x1={ini.x} y1={ini.y} x2={mistura(ini.x, fim.x, u)} y2={mistura(ini.y, fim.y, u)} stroke={corLinha} strokeWidth={largura} strokeLinecap="round" opacity={0.92} /> : null}
    </g>
  );
};

// Reta vermelha tracejada que anda de `a` até `b` entre `de` e `ate`, com marcas de medida e uma
// ponta que corre; antes, uma guia a lápis mostra para onde ela vai.
export const Tracejado: React.FC<{ a: P; b: P; t: number; de: number; ate: number; folgaA?: number; folgaB?: number; marcas?: number; seta?: boolean; lapis?: number }> = ({
  a,
  b,
  t,
  de,
  ate,
  folgaA = 20,
  folgaB = 22,
  marcas = 0,
  seta = false,
  lapis = 1,
}) => {
  const d = dist(a, b);
  if (d <= folgaA + folgaB) return null;
  const n = unit(a, b);
  const ini = { x: a.x + n.x * folgaA, y: a.y + n.y * folgaA };
  const fim = { x: b.x - n.x * folgaB, y: b.y - n.y * folgaB };
  const u = prog(t, de, Math.max(0.3, ate - de), gira);
  const ponta = { x: mistura(ini.x, fim.x, u), y: mistura(ini.y, fim.y, u) };
  const total = dist(ini, fim);
  const ang = (Math.atan2(n.y, n.x) * 180) / Math.PI;
  const tracos: React.ReactNode[] = [];
  if (marcas > 0) {
    for (let k = 1; k < marcas; k++) {
      const f = k / marcas;
      if (f > u) break;
      const c = { x: mistura(ini.x, fim.x, f), y: mistura(ini.y, fim.y, f) };
      tracos.push(<line key={k} x1={c.x - n.y * 14} y1={c.y + n.x * 14} x2={c.x + n.y * 14} y2={c.y - n.x * 14} stroke={cor.linha} strokeWidth={3} strokeLinecap="round" opacity={0.8} />);
    }
  }
  return (
    <g>
      {u < 1 && lapis > 0 ? <line x1={ini.x} y1={ini.y} x2={fim.x} y2={fim.y} stroke={cor.lapis} strokeWidth={2} strokeDasharray="2 14" strokeLinecap="round" opacity={0.7 * lapis} /> : null}
      {u > 0 ? <line x1={ini.x} y1={ini.y} x2={ponta.x} y2={ponta.y} stroke={cor.lanterna} strokeWidth={4.5} strokeDasharray="18 13" strokeLinecap="round" /> : null}
      {u > 0 && u < 1 ? <circle cx={ponta.x} cy={ponta.y} r={7} fill={cor.lanterna} /> : null}
      {tracos}
      {seta && u > 0.98 && total > 40 ? (
        <path d="M -18 -12 L 0 0 L -18 12" transform={`translate(${fim.x} ${fim.y}) rotate(${ang})`} fill="none" stroke={cor.lanterna} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </g>
  );
};

// Cruz vermelha de alvo (o "polo" de qualquer assunto)
export const Cruz: React.FC<{ x: number; y: number; t: number; em: number }> = ({ x, y, t, em }) => {
  const u = prog(t, em - 0.1, 0.45);
  if (u <= 0) return null;
  const tam = 30 * u;
  return (
    <g stroke={cor.lanterna} strokeWidth={4.5} strokeLinecap="round">
      <line x1={x - tam} y1={y} x2={x + tam} y2={y} />
      <line x1={x} y1={y - tam} x2={x} y2={y + tam} />
      <circle cx={x} cy={y} r={11} fill={cor.ceu} strokeWidth={3} opacity={u} />
    </g>
  );
};

// O localizador: círculo vermelho com quatro marcas, que vai sempre ao que está sendo dito.
export type Foco = { em: number; x: number; y: number; r: number };
export const localizar = (focos: Foco[], t: number) => {
  const ativos = focos.filter((f) => f.em <= t).sort((a, b) => a.em - b.em);
  if (!ativos.length) return null;
  let e = { x: ativos[0].x, y: ativos[0].y, r: ativos[0].r };
  for (let i = 1; i < ativos.length; i++) {
    const u = prog(t, ativos[i].em, 0.55, gira);
    e = { x: mistura(e.x, ativos[i].x, u), y: mistura(e.y, ativos[i].y, u), r: mistura(e.r, ativos[i].r, u) };
  }
  return { ...e, vis: prog(t, ativos[0].em - 0.1, 0.4) };
};

// Quando a primeira coisa demora a ser dita, o localizador já chega antes, "procurando" o lugar
// dela (a carta nunca fica parada esperando).
export const comChegada = (focos: Foco[], inicio: number): Foco[] => {
  const ordem = [...focos].sort((a, b) => a.em - b.em);
  const primeiro = ordem[0];
  if (!primeiro || primeiro.em - inicio < 1.6) return focos;
  return [{ ...primeiro, em: inicio + 0.8, r: primeiro.r + 26 }, ...focos];
};

export const Localizador: React.FC<{ focos: Foco[]; t: number; vida: number; inicio?: number }> = ({ focos, t, vida, inicio }) => {
  const l = localizar(inicio === undefined ? focos : comChegada(focos, inicio), t);
  if (!l || vida * l.vis <= 0) return null;
  const r = Math.max(36, l.r);
  return (
    <g opacity={vida * l.vis * 0.95} stroke={cor.lanterna} strokeLinecap="round" fill="none">
      <circle cx={l.x} cy={l.y} r={r} strokeWidth={3} />
      {[0, 90, 180, 270].map((g) => {
        const a = (g * Math.PI) / 180;
        return <line key={g} x1={l.x + Math.cos(a) * (r + 6)} y1={l.y + Math.sin(a) * (r + 6)} x2={l.x + Math.cos(a) * (r + 22)} y2={l.y + Math.sin(a) * (r + 22)} strokeWidth={3} />;
      })}
    </g>
  );
};

// Linhas de texto (de um `encaixar`) que acendem palavra por palavra; `tempos` vale para o texto todo.
export const LinhasAcesas: React.FC<{
  enc: Encaixe;
  tempos: number[];
  t: number;
  estilo: React.CSSProperties;
  cor?: string;
  rascunho?: number;
  alinhar?: "flex-start" | "center" | "flex-end";
  entrelinha?: number;
  // índices (no texto todo) das palavras com estilo próprio
  enfase?: Set<number>;
  estiloEnfase?: React.CSSProperties;
  offset?: number;
}> = ({ enc, tempos, t, estilo, cor: c = cor.texto, rascunho = 0.2, alinhar = "flex-start", entrelinha = 1.1, enfase, estiloEnfase, offset = 0 }) => {
  let k = offset;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar }}>
      {enc.linhas.map((l, i) => {
        const off = k;
        k += l.split(/\s+/).filter(Boolean).length;
        return (
          <TextoAceso
            key={i}
            texto={l}
            tempos={tempos}
            offset={off}
            t={t}
            cor={c}
            rascunho={rascunho}
            alinhar={alinhar}
            enfase={enfase}
            estiloEnfase={estiloEnfase}
            estilo={{ ...estilo, fontSize: enc.tamanho, lineHeight: entrelinha }}
          />
        );
      })}
    </div>
  );
};

// Letreiro em caixa alta espaçada (rótulos de carta)
export const estiloLetreiro = (tamanho: number): React.CSSProperties => ({
  fontFamily: sans,
  fontWeight: 700,
  fontSize: tamanho,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  lineHeight: 1.2,
});

export const estiloNome = (tamanho: number): React.CSSProperties => ({ fontFamily: serifa, fontStyle: "italic", fontWeight: 500, fontSize: tamanho, lineHeight: 1.1 });

// Etiqueta "ilustrativo": o desenho não vem de números ditos
export const Ilustrativo: React.FC<{ x: number; y: number; t: number; em: number; alinhar?: "esquerda" | "direita" }> = ({ x, y, t, em, alinhar = "direita" }) => (
  <div
    style={{
      position: "absolute",
      left: alinhar === "esquerda" ? x : undefined,
      right: alinhar === "direita" ? W - x : undefined,
      top: y,
      opacity: prog(t, em, 0.4),
      padding: "6px 16px 7px",
      border: `2px solid ${cor.textoSuave}`,
      borderRadius: 999,
      ...estiloLetreiro(30),
      color: cor.textoSuave,
      background: "rgba(10,11,31,0.7)",
    }}
  >
    ilustrativo
  </div>
);

// Estrela de quatro pontas (marcadores, selos)
export const QuatroPontas: React.FC<{ tamanho: number; cheia: number; cor?: string }> = ({ tamanho, cheia, cor: c = cor.estrela }) => {
  const r = tamanho / 2;
  const d = `M ${r} 0 Q ${r * 1.12} ${r * 0.88} ${tamanho} ${r} Q ${r * 1.12} ${r * 1.12} ${r} ${tamanho} Q ${r * 0.88} ${r * 1.12} 0 ${r} Q ${r * 0.88} ${r * 0.88} ${r} 0 Z`;
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ overflow: "visible", flex: "none" }}>
      <path d={d} fill="none" stroke={cor.lapis} strokeWidth={2} strokeDasharray="3 4" opacity={1 - cheia} />
      <path d={d} fill={c} opacity={cheia} transform={`translate(${r} ${r}) scale(${0.6 + 0.4 * cheia}) translate(${-r} ${-r})`} />
    </svg>
  );
};
