import React, { useMemo } from "react";
import { LETRA } from "./letra";
import { comAlfa, MARCA } from "./marca";
import { k, SAIDA } from "./tempo";

/**
 * OS GRÁFICOS DA AULA 6 ("adicione imagens e movimento com função": o
 * gráfico verde do rompimento, o card, os ícones que entram um por vez),
 * desenhados em código e SEMPRE nas cores da marca: a linha e a área no
 * destaque, o painel no fundo da marca, o texto no título.
 *
 * Regra que não se quebra (aula 6 e a casa): o gráfico é ILUSTRAÇÃO, não
 * série histórica. A forma da curva (`pontos`, de 0 a 1) é desenho; número só
 * aparece se foi dito, no rótulo ou no Contador, e o painel leva o aviso de
 * ilustração quando mostra uma curva.
 */

/** O painel do gráfico (cantos arredondados, borda fina, sombra), como o card do kit da aula 6. */
export const PainelDeDado: React.FC<{ x: number; y: number; largura: number; altura: number; visivel?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x,
  y,
  largura,
  altura,
  visivel = 1,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: largura,
      height: altura,
      borderRadius: 36,
      background: `linear-gradient(160deg, ${MARCA.painelClaro} 0%, ${MARCA.painel} 55%, ${MARCA.fundoProfundo} 100%)`,
      border: `2px solid ${MARCA.linha}`,
      boxShadow: `0 24px 60px ${MARCA.sombra}`,
      overflow: "hidden",
      opacity: visivel,
      translate: `0px ${(1 - visivel) * 40}px`,
      scale: 0.96 + 0.04 * visivel,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Uma curva suave pelos pontos (Catmull-Rom convertido em Bézier). */
function caminhoSuave(p: { x: number; y: number }[]): string {
  if (p.length < 2) return "";
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)];
    const b = p[i];
    const c = p[i + 1];
    const e = p[Math.min(p.length - 1, i + 2)];
    d += ` C ${b.x + (c.x - a.x) / 6} ${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6} ${c.y - (e.y - b.y) / 6} ${c.x} ${c.y}`;
  }
  return d;
}

/**
 * A LINHA QUE SE DESENHA (o gráfico do rompimento): `pontos` de 0 (baixo) a 1
 * (alto), `progresso` de 0 a 1 desenha da esquerda para a direita, a área por
 * baixo acompanha, e o ponto da ponta brilha. `nivel` é a linha tracejada de
 * um patamar (o "nível rompido") com a etiqueta. Medidas em px dentro do painel.
 */
export const GraficoDeLinha: React.FC<{
  largura: number;
  altura: number;
  pontos: number[];
  progresso: number;
  nivel?: { valor: number; rotulo?: string; progresso: number } | null;
  /** A etiqueta que sai da ponta da linha quando ela chega (texto da fala). */
  rotuloDaPonta?: string | null;
  grade?: boolean;
  suave?: boolean;
  margem?: number;
}> = ({ largura, altura, pontos, progresso, nivel = null, rotuloDaPonta = null, grade = true, suave = false, margem = 24 }) => {
  const id = useMemo(() => `g${Math.abs([...pontos.join(",")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7))}`, [pontos]);
  const W = largura - 2 * margem;
  const H = altura - 2 * margem;
  const xy = pontos.map((v, i) => ({ x: margem + (W * i) / Math.max(1, pontos.length - 1), y: margem + H * (1 - Math.min(1, Math.max(0, v))) }));
  const linha = suave ? caminhoSuave(xy) : `M ${xy.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
  const p = Math.min(1, Math.max(0, progresso));
  // a ponta: onde a linha está agora (interpolada no segmento)
  const pos = p * (xy.length - 1);
  const i = Math.min(xy.length - 2, Math.floor(pos));
  const f = pos - i;
  const ponta = xy.length > 1 ? { x: xy[i].x + (xy[i + 1].x - xy[i].x) * f, y: xy[i].y + (xy[i + 1].y - xy[i].y) * f } : xy[0];
  const yNivel = nivel ? margem + H * (1 - nivel.valor) : 0;
  return (
    <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={MARCA.destaque} stopOpacity={0.32} />
          <stop offset="1" stopColor={MARCA.destaque} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${id}-ate`}>
          <rect x={0} y={-50} width={ponta.x + 1} height={altura + 100} />
        </clipPath>
      </defs>
      {grade
        ? [0.25, 0.5, 0.75].map((g) => <line key={g} x1={margem} x2={largura - margem} y1={margem + H * g} y2={margem + H * g} stroke={MARCA.titulo} strokeOpacity={0.08} strokeWidth={2} />)
        : null}
      <g clipPath={`url(#${id}-ate)`}>
        <path d={`${linha} L ${xy[xy.length - 1].x} ${margem + H} L ${xy[0].x} ${margem + H} Z`} fill={`url(#${id}-area)`} />
        <path d={linha} fill="none" stroke={MARCA.destaque} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      </g>
      {nivel && nivel.progresso > 0 ? (
        <line x1={margem} x2={margem + W * nivel.progresso} y1={yNivel} y2={yNivel} stroke={MARCA.titulo} strokeOpacity={0.85} strokeWidth={4} strokeDasharray="16 14" />
      ) : null}
      {p > 0.01 ? (
        <>
          <circle cx={ponta.x} cy={ponta.y} r={22} fill={MARCA.destaque} opacity={0.22} />
          <circle cx={ponta.x} cy={ponta.y} r={10} fill={MARCA.destaque} />
        </>
      ) : null}
      {nivel?.rotulo && nivel.progresso > 0.3 ? (
        <foreignObject x={margem} y={yNivel - 70} width={W} height={60}>
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 10, background: MARCA.titulo, color: MARCA.fundo, fontFamily: LETRA.texto, fontWeight: 800, fontSize: 30, letterSpacing: "0.04em", opacity: k(nivel.progresso, 0.3, 0.7) }}>
            {nivel.rotulo}
          </div>
        </foreignObject>
      ) : null}
      {rotuloDaPonta && p > 0.97 ? (
        <foreignObject x={Math.max(0, ponta.x - 300)} y={Math.max(0, ponta.y - 86)} width={290} height={64}>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 10, background: MARCA.destaque, color: MARCA.fundo, fontFamily: LETRA.texto, fontWeight: 800, fontSize: 28 }}>{rotuloDaPonta}</span>
          </div>
        </foreignObject>
      ) : null}
    </svg>
  );
};

/** AS BARRAS QUE CRESCEM (uma por vez, cada uma na palavra dita): `valor` de 0 a 1 é desenho, o rótulo é a fala. */
export const GraficoDeBarras: React.FC<{
  largura: number;
  altura: number;
  barras: { rotulo: string; valor: number; inicio: number; destaque?: boolean }[];
  t: number;
  margem?: number;
}> = ({ largura, altura, barras, t, margem = 24 }) => {
  const n = Math.max(1, barras.length);
  const vao = 28;
  const lb = (largura - 2 * margem - vao * (n - 1)) / n;
  const base = altura - margem - 52;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: largura, height: altura }}>
      {barras.map((b, i) => {
        const p = k(t, b.inicio, b.inicio + 0.6, SAIDA);
        const h = Math.max(0, (base - margem) * Math.min(1, Math.max(0, b.valor)) * p);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: "absolute",
                left: margem + i * (lb + vao),
                top: base - h,
                width: lb,
                height: h,
                borderRadius: "14px 14px 4px 4px",
                background: b.destaque ? MARCA.destaque : comAlfa(MARCA.titulo, 0.28),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: margem + i * (lb + vao) - 20,
                width: lb + 40,
                top: base + 12,
                textAlign: "center",
                fontFamily: LETRA.texto,
                fontWeight: 800,
                fontSize: 28,
                color: b.destaque ? MARCA.destaque : MARCA.titulo,
                opacity: k(t, b.inicio, b.inicio + 0.4),
                whiteSpace: "nowrap",
              }}
            >
              {b.rotulo}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Formata um número como se escreve no Brasil (83.000; 1,5). */
export const formatarNumero = (n: number, casas = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

/**
 * O CONTADOR que sobe até o número DITO entre `inicio` e `fim` (segundos):
 * só para número que está na fala (a guarda de número confere o texto do
 * `ate`). Com `texto`, o que aparece no fim é o texto (ex.: "US$ 83 MIL").
 */
export const Contador: React.FC<{ t: number; ate: number; inicio: number; fim: number; casas?: number; prefixo?: string; sufixo?: string; texto?: string; style?: React.CSSProperties }> = ({
  t,
  ate,
  inicio,
  fim,
  casas = 0,
  prefixo = "",
  sufixo = "",
  texto,
  style,
}) => {
  const p = k(t, inicio, fim, SAIDA);
  const valor = ate * p;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", ...style }}>
      {p >= 1 && texto ? texto : `${prefixo}${formatarNumero(valor, casas)}${sufixo}`}
    </span>
  );
};

/** A etiqueta pequena (o "NÍVEL ROMPIDO" da aula 6, o aviso de ilustração). */
export const Etiqueta: React.FC<{ texto: string; cor?: "destaque" | "titulo" | "apoio"; tamanho?: number; style?: React.CSSProperties }> = ({ texto, cor = "destaque", tamanho = 28, style }) => (
  <span
    style={{
      display: "inline-block",
      padding: `${Math.round(tamanho * 0.22)}px ${Math.round(tamanho * 0.55)}px`,
      borderRadius: 10,
      background: cor === "destaque" ? MARCA.destaque : cor === "titulo" ? MARCA.titulo : "transparent",
      border: cor === "apoio" ? `2px solid ${MARCA.linhaForte}` : "none",
      color: cor === "apoio" ? MARCA.apoio : MARCA.fundo,
      fontFamily: LETRA.texto,
      fontWeight: 800,
      fontSize: tamanho,
      letterSpacing: "0.06em",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {texto}
  </span>
);
