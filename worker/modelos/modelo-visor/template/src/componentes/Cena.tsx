// A cena ilustrada: uma xícara na mesa, com a luz de uma janela na parede. É a "foto" que melhora a
// cada ajuste. Desenhada em função do tamanho do cartão (serve em qualquer proporção).
import { useId } from "react";
import { Traco, limitar, mistura } from "../anim";
import { Icone } from "./Icones";
import type { EstadoCena } from "../layout";
import { cena as c, cor } from "../tema";

export type CamadasDaCena = {
  // 0→1: a grade dos terços se desenhando
  grade?: number;
  // 0→1: o ponto forte (cruzamento da linha) acende
  ponto?: number;
  // 0→1: o centro é riscado
  marca?: number;
  // 0→1: o colchete de "assunto" aparece em volta da xícara
  sujeito?: number;
  // para que lado o assunto vai (o ponto forte que acende)
  lado?: "esquerda" | "direita";
  // 0→1: o toque de foco no assunto (anel que se abre)
  toque?: number;
  // 0→1: a régua de nível acerta (horizonte)
  nivel?: number;
  // 0→1: o arrasto da régua de exposição (o sol sobe); ausente = sem régua
  exposicao?: number;
  // quadrado de foco no assunto: procura (0→1) e trava (0→1)
  alvo?: { procura: number; trava: number };
};

// Onde fica o ✕ do "não no centro": no centro do quadro, mas subindo o necessário para não
// encostar na boca da xícara (ele continua dentro da casa do meio da grade)
export const marcaDoCentro = (w: number, h: number) => {
  const { s, topo } = geometria(w, h, 0.5);
  const r = Math.max(28, s * 0.14);
  const disco = r * 1.3;
  return { x: w / 2, y: Math.max(h / 3 + disco, Math.min(h / 2, topo - 0.12 * s - disco - 6)), r, disco };
};

const geometria = (w: number, h: number, x: number) => {
  const s = Math.min(w * 0.305, h * 0.45);
  const cx = x * w;
  const mesa = h * (2 / 3);
  // a xícara fica na mesa, um pouco à frente da borda de trás (a linha de baixo da grade)
  const base = mesa + 0.3 * s;
  const topo = base - 0.82 * s;
  return { s, cx, base, topo, mesa };
};

const Desenho: React.FC<{ w: number; h: number; e: EstadoCena; t: number }> = ({ w, h, e, t }) => {
  const { s, cx, base, topo, mesa } = geometria(w, h, e.x);
  const meio = s / 2;
  const fundo = 0.36 * s;
  // corpo da xícara: boca larga, fundo mais estreito, curva suave
  const corpo = `M ${cx - meio} ${topo} C ${cx - meio} ${topo + 0.5 * s}, ${cx - fundo - 0.06 * s} ${base - 0.04 * s}, ${cx - fundo} ${base - 0.02 * s} L ${cx + fundo} ${base - 0.02 * s} C ${cx + fundo + 0.06 * s} ${base - 0.04 * s}, ${cx + meio} ${topo + 0.5 * s}, ${cx + meio} ${topo} Z`;
  const alca = `M ${cx + meio - 0.04 * s} ${topo + 0.16 * s} C ${cx + meio + 0.3 * s} ${topo + 0.1 * s}, ${cx + meio + 0.3 * s} ${topo + 0.56 * s}, ${cx + meio - 0.12 * s} ${topo + 0.58 * s}`;
  const vapor = (dx: number, fase: number) => {
    const y0 = topo - 0.1 * s;
    const amp = 0.06 * s;
    const k = Math.sin(t * 1.6 + fase);
    return `M ${cx + dx} ${y0} C ${cx + dx + amp * (1 + k)} ${y0 - 0.16 * s}, ${cx + dx - amp * (1 - k)} ${y0 - 0.28 * s}, ${cx + dx + amp * 0.6} ${y0 - 0.44 * s}`;
  };
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* parede, com a luz da janela */}
      <rect x={-w} y={-h} width={3 * w} height={h + mesa} fill={c.parede} />
      <polygon
        points={`${0.6 * w},${0.05 * h} ${0.97 * w},${0.05 * h} ${0.86 * w},${mesa - 0.02 * h} ${0.47 * w},${mesa - 0.02 * h}`}
        fill={c.luz}
      />
      {/* a cruz da janela, na mancha de luz */}
      <line x1={0.785 * w} y1={0.05 * h} x2={0.665 * w} y2={mesa - 0.02 * h} stroke={c.parede} strokeWidth={0.022 * w} />
      <line x1={0.555 * w} y1={0.33 * h} x2={0.93 * w} y2={0.33 * h} stroke={c.parede} strokeWidth={0.016 * h} />
      {/* mesa */}
      <rect x={-w} y={mesa} width={3 * w} height={2 * h} fill={c.mesa} />
      <rect x={-w} y={mesa} width={3 * w} height={0.012 * h + 2} fill={c.borda} opacity={0.55} />
      <rect x={-w} y={h * 0.93} width={3 * w} height={h} fill={c.mesaFrente} />
      {/* sombra da xícara (a luz vem da janela, à direita) */}
      <ellipse cx={cx - 0.42 * s} cy={base + 0.02 * s} rx={0.98 * s} ry={0.13 * s} fill={c.sombra} />
      {/* pires */}
      <ellipse cx={cx} cy={base + 0.02 * s} rx={0.8 * s} ry={0.16 * s} fill={c.piresSombra} />
      <ellipse cx={cx} cy={base - 0.01 * s} rx={0.78 * s} ry={0.14 * s} fill={c.pires} />
      {/* xícara */}
      <path d={alca} fill="none" stroke={c.xicaraSombra} strokeWidth={0.075 * s} strokeLinecap="round" />
      <path d={corpo} fill={c.xicara} />
      <path
        d={`M ${cx + 0.12 * s} ${topo + 0.06 * s} C ${cx + 0.4 * s} ${topo + 0.2 * s}, ${cx + 0.3 * s} ${base - 0.2 * s}, ${cx + 0.2 * s} ${base - 0.03 * s} L ${cx + fundo} ${base - 0.02 * s} C ${cx + fundo + 0.06 * s} ${base - 0.04 * s}, ${cx + meio} ${topo + 0.5 * s}, ${cx + meio} ${topo} Z`}
        fill={c.xicaraSombra}
        opacity={0.55}
      />
      <ellipse cx={cx} cy={topo} rx={meio} ry={0.1 * s} fill={c.xicara} stroke={c.xicaraSombra} strokeWidth={0.02 * s} />
      <ellipse cx={cx} cy={topo + 0.012 * s} rx={meio - 0.05 * s} ry={0.075 * s} fill={c.cafe} />
      {/* vapor */}
      {[-0.12, 0.1].map((dx, i) => (
        <path key={dx} d={vapor(dx * s, i * 2.1)} fill="none" stroke={c.vapor} strokeWidth={0.032 * s} strokeLinecap="round" opacity={0.75} />
      ))}
    </svg>
  );
};

// Digital e manchas de gordura na lente
const Gordura: React.FC<{ w: number; h: number; s: number; id: string }> = ({ w, h, s, id }) => {
  // a digital fica no alto, à esquerda da janelinha da pessoa (que às vezes ocupa o canto direito)
  const gx = 0.64 * w;
  const gy = 0.27 * h;
  const r = 0.34 * s;
  const arcos = Array.from({ length: 7 }, (_, i) => {
    const k = 0.25 + i * 0.13;
    const rx = r * k;
    const ry = r * k * 1.25;
    const corte = 0.35 + (i % 3) * 0.2;
    return `M ${gx - rx} ${gy + corte * ry * 0.3} A ${rx} ${ry} 0 1 1 ${gx + rx * 0.9} ${gy + ry * 0.4}`;
  });
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0.28 * w} cy={0.42 * h} rx={0.34 * w} ry={0.22 * h} fill={`url(#${id})`} />
      <ellipse cx={0.62 * w} cy={0.72 * h} rx={0.3 * w} ry={0.16 * h} fill={`url(#${id})`} />
      <ellipse cx={gx} cy={gy} rx={0.24 * w} ry={0.2 * h} fill={`url(#${id})`} opacity={0.7} />
      <g transform={`rotate(-18 ${gx} ${gy})`} opacity={0.7}>
        {arcos.map((d) => (
          <path key={d} d={d} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(2.5, 0.022 * s)} strokeLinecap="round" />
        ))}
      </g>
    </svg>
  );
};

// O tecido da camiseta que passa na lente: pano preto amassado, com dobras e a barra costurada
const Tecido: React.FC<{ w: number; h: number; p: number }> = ({ w, h, p }) => {
  const lw = Math.min(0.42 * w, 0.75 * h);
  const lh = lw * 1.2;
  const x = mistura(-0.6 * lw, w + 0.6 * lw, p);
  const y = h * 0.52 + Math.sin(p * Math.PI * 2) * 0.07 * h;
  const a = lw / 2;
  const b = lh / 2;
  const contorno = `M ${-0.92 * a} ${-0.8 * b} C ${-0.4 * a} ${-1.02 * b}, ${0.3 * a} ${-0.9 * b}, ${0.94 * a} ${-0.76 * b} C ${1.06 * a} ${-0.2 * b}, ${0.9 * a} ${0.4 * b}, ${0.98 * a} ${0.86 * b} C ${0.4 * a} ${1.02 * b}, ${-0.4 * a} ${0.94 * b}, ${-0.96 * a} ${0.84 * b} C ${-1.06 * a} ${0.2 * b}, ${-0.86 * a} ${-0.3 * b}, ${-0.92 * a} ${-0.8 * b} Z`;
  const dobras = [
    `M ${-0.5 * a} ${-0.86 * b} C ${-0.2 * a} ${-0.3 * b}, ${-0.62 * a} ${0.2 * b}, ${-0.34 * a} ${0.9 * b}`,
    `M ${0.1 * a} ${-0.9 * b} C ${0.36 * a} ${-0.4 * b}, ${-0.04 * a} ${0.3 * b}, ${0.22 * a} ${0.92 * b}`,
    `M ${0.62 * a} ${-0.8 * b} C ${0.8 * a} ${-0.2 * b}, ${0.5 * a} ${0.3 * b}, ${0.7 * a} ${0.88 * b}`,
  ];
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <g transform={`translate(${x} ${y}) rotate(${-12 + p * 9})`}>
        <path d={contorno} fill="rgba(0,0,0,0.25)" transform="translate(12 16)" />
        <path d={contorno} fill={c.tecido} />
        {dobras.map((d) => (
          <path key={d} d={d} fill="none" stroke={c.tecidoFio} strokeWidth={lw * 0.05} strokeLinecap="round" />
        ))}
        {dobras.map((d) => (
          <path key={`l-${d}`} d={d} fill="none" stroke="#45494D" strokeWidth={lw * 0.012} strokeLinecap="round" transform={`translate(${lw * 0.03} 0)`} />
        ))}
        {/* barra costurada da camiseta */}
        <path
          d={`M ${-0.86 * a} ${0.62 * b} C ${-0.3 * a} ${0.74 * b}, ${0.3 * a} ${0.7 * b}, ${0.88 * a} ${0.64 * b}`}
          fill="none"
          stroke="#55595E"
          strokeWidth={Math.max(3, lw * 0.012)}
          strokeDasharray={`${lw * 0.04} ${lw * 0.03}`}
        />
      </g>
    </svg>
  );
};

export const Cena: React.FC<{
  w: number;
  h: number;
  e: EstadoCena;
  t: number;
  camadas?: CamadasDaCena;
  // 0→1 enquanto o tecido passa (limpeza em andamento): o que ficou à esquerda dele já está limpo
  limpeza?: number;
}> = ({ w, h, e, t, camadas = {}, limpeza }) => {
  const id = useId().replace(/:/g, "");
  const { s, cx, base, topo, mesa } = geometria(w, h, e.x);
  const giro = -6 * e.torto;
  const brilho = 1 - 0.42 * e.escuro;
  const desfoque = e.desfoque * s * 0.05;
  const nevoaDesfoque = s * 0.032;
  // borda do que já foi limpo, em px (o tecido passa da esquerda para a direita)
  const lw = Math.min(0.42 * w, 0.75 * h);
  const borda = limpeza === undefined ? null : mistura(-0.6 * lw, w + 0.6 * lw, limpeza);
  const nevoa = limpeza === undefined ? e.nevoa : 1;
  const mascara =
    borda === null ? undefined : `linear-gradient(to right, transparent ${borda - 30}px, black ${borda + 50}px)`;

  const cena = (extra: string) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        rotate: `${giro}deg`,
        scale: String(1 + 0.12 * e.torto),
        filter: `brightness(${brilho}) ${desfoque > 0.1 ? `blur(${desfoque}px)` : ""} ${extra}`,
      }}
    >
      <Desenho w={w} h={h} e={e} t={t} />
    </div>
  );

  const g = camadas.grade ?? 0;
  const linhaX = camadas.lado === "direita" ? (2 * w) / 3 : w / 3;
  const traco = Math.max(2.5, w * 0.0028);
  const sombraLinha = `drop-shadow(0 0 2px ${cor.sombra})`;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: c.parede }}>
      {cena("")}
      {/* lente engordurada: cópia embaçada por cima, com digital e manchas; o tecido a remove */}
      {nevoa > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, opacity: nevoa, maskImage: mascara, WebkitMaskImage: mascara }}>
          {cena(`blur(${nevoaDesfoque}px) contrast(0.82) saturate(0.8)`)}
          <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${0.22 * (1 - 0.6 * e.escuro)})` }} />
          <Gordura w={w} h={h} s={s} id={`mancha-${id}`} />
        </div>
      ) : null}
      {limpeza !== undefined && limpeza > 0 && limpeza < 1 ? <Tecido w={w} h={h} p={limpeza} /> : null}

      {/* grade dos terços: cada linha cresce do meio para as pontas */}
      {g > 0 ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, filter: sombraLinha }}>
          {[1, 2].map((k, i) => {
            const p = limitar(g * 1.6 - i * 0.3);
            const x = (k * w) / 3;
            const ativa = Math.abs(x - linhaX) < 1 ? (camadas.ponto ?? 0) : 0;
            return (
              <line
                key={`v${k}`}
                x1={x}
                x2={x}
                y1={h / 2 - (p * h) / 2}
                y2={h / 2 + (p * h) / 2}
                stroke={ativa > 0.5 ? cor.acento : "rgba(255,255,255,0.92)"}
                strokeWidth={traco * (1 + ativa * 0.6)}
              />
            );
          })}
          {[1, 2].map((k, i) => {
            const p = limitar(g * 1.6 - 0.15 - i * 0.3);
            const y = (k * h) / 3;
            const ativa = k === 2 ? (camadas.ponto ?? 0) : 0;
            return (
              <line
                key={`h${k}`}
                y1={y}
                y2={y}
                x1={w / 2 - (p * w) / 2}
                x2={w / 2 + (p * w) / 2}
                stroke={ativa > 0.5 ? cor.acento : "rgba(255,255,255,0.92)"}
                strokeWidth={traco * (1 + ativa * 0.6)}
              />
            );
          })}
          {(camadas.ponto ?? 0) > 0 ? (
            <g opacity={camadas.ponto}>
              <circle cx={linhaX} cy={(2 * h) / 3} r={s * 0.07 + 6} fill="none" stroke={cor.acento} strokeWidth={traco * 1.6} />
              <circle cx={linhaX} cy={(2 * h) / 3} r={s * 0.032 + 3} fill={cor.acento} />
            </g>
          ) : null}
        </svg>
      ) : null}

      {/* o centro riscado */}
      {(camadas.marca ?? 0) > 0 ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, filter: `drop-shadow(0 1px 3px ${cor.sombra})` }}>
          {(() => {
            const { x: mx, y: my, r, disco } = marcaDoCentro(w, h);
            const m = camadas.marca ?? 0;
            return (
              <g>
                <circle cx={mx} cy={my} r={disco} fill="rgba(12,13,14,0.55)" opacity={limitar(m * 3)} />
                <Traco d={`M ${mx - r} ${my - r} L ${mx + r} ${my + r}`} p={limitar(m * 2)} cor={cor.branco} largura={traco * 2.2} />
                <Traco d={`M ${mx + r} ${my - r} L ${mx - r} ${my + r}`} p={limitar(m * 2 - 1)} cor={cor.branco} largura={traco * 2.2} />
              </g>
            );
          })()}
        </svg>
      ) : null}

      {/* colchete de "assunto" em volta da xícara */}
      {(camadas.sujeito ?? 0) > 0 ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, filter: `drop-shadow(0 0 2px ${cor.sombra})` }}>
          {(() => {
            const p = camadas.sujeito ?? 0;
            const folga = (1 - p) * s * 0.25;
            const x0 = cx - 0.86 * s - folga;
            const x1 = cx + 0.86 * s + folga;
            const y0 = topo - 0.2 * s - folga;
            const y1 = base + 0.24 * s + folga;
            const a = s * 0.2;
            const d = [
              `M ${x0} ${y0 + a} L ${x0} ${y0} L ${x0 + a} ${y0}`,
              `M ${x1 - a} ${y0} L ${x1} ${y0} L ${x1} ${y0 + a}`,
              `M ${x1} ${y1 - a} L ${x1} ${y1} L ${x1 - a} ${y1}`,
              `M ${x0 + a} ${y1} L ${x0} ${y1} L ${x0} ${y1 - a}`,
            ].join(" ");
            return <path d={d} fill="none" stroke={cor.acento} strokeWidth={traco * 1.6} opacity={p} strokeLinecap="round" />;
          })()}
        </svg>
      ) : null}

      {/* toque de foco no assunto */}
      {(camadas.toque ?? 0) > 0 && (camadas.toque ?? 0) < 1 ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle
            cx={cx}
            cy={(topo + base) / 2}
            r={s * (0.2 + 0.7 * (camadas.toque ?? 0))}
            fill="none"
            stroke={cor.branco}
            strokeWidth={traco * 1.4}
            opacity={1 - (camadas.toque ?? 0)}
          />
        </svg>
      ) : null}

      {/* nível do horizonte: a linha comprida acompanha a borda da mesa; as pontas ficam retas */}
      {camadas.nivel !== undefined ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, filter: `drop-shadow(0 0 2px ${cor.sombra})` }}>
          {(() => {
            const reto = (camadas.nivel ?? 0) > 0.98 && e.torto < 0.02;
            const corN = reto ? cor.acento : cor.branco;
            const y = mesa;
            const l = w * 0.3;
            const esp = traco * 1.8;
            return (
              <g>
                <line x1={w / 2 - l - 70} x2={w / 2 - l - 14} y1={y} y2={y} stroke={corN} strokeWidth={esp} />
                <line x1={w / 2 + l + 14} x2={w / 2 + l + 70} y1={y} y2={y} stroke={corN} strokeWidth={esp} />
                <g transform={`rotate(${giro} ${w / 2} ${h / 2})`}>
                  <line x1={w / 2 - l} x2={w / 2 + l} y1={y} y2={y} stroke={corN} strokeWidth={esp} />
                  <circle cx={w / 2} cy={y} r={esp * 2.2} fill="none" stroke={corN} strokeWidth={esp * 0.8} />
                </g>
              </g>
            );
          })()}
        </svg>
      ) : null}

      {/* régua de exposição ao lado do assunto: o sol sobe e a cena clareia */}
      {camadas.exposicao !== undefined
        ? (() => {
            const p = camadas.exposicao ?? 0;
            const rx = Math.min(w - 56, cx + 1.25 * s);
            const y0 = topo - 0.45 * s;
            const y1 = base + 0.1 * s;
            const sol = mistura(y1 - 0.25 * s, y0 + 0.15 * s, p);
            const tam = Math.max(72, Math.min(92, s * 0.36));
            return (
              <div style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 3px ${cor.sombra})` }}>
                <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
                  <line x1={rx} x2={rx} y1={y0} y2={sol - tam * 0.6} stroke={cor.branco} strokeWidth={traco * 1.6} />
                  <line x1={rx} x2={rx} y1={sol + tam * 0.6} y2={y1} stroke={p > 0.02 ? cor.acento : cor.branco} strokeWidth={traco * (p > 0.02 ? 2.4 : 1.6)} />
                </svg>
                <Icone
                  nome="sol"
                  tamanho={tam}
                  cor={p > 0.02 ? cor.acento : cor.branco}
                  p={0.35 + 0.65 * limitar(p * 1.2)}
                  espessura={4}
                  style={{ position: "absolute", left: rx - tam / 2, top: sol - tam / 2 }}
                />
              </div>
            );
          })()
        : null}

      {/* quadrado de foco no assunto: procura e trava */}
      {camadas.alvo
        ? (() => {
            const { procura, trava } = camadas.alvo;
            if (procura <= 0) return null;
            const passos = [1.35, 0.88, 1.12, 0.96, 1];
            const i = Math.min(passos.length - 1, Math.floor(procura * (passos.length - 1)));
            const f = procura * (passos.length - 1) - i;
            const k = mistura(passos[i], passos[Math.min(passos.length - 1, i + 1)], Math.min(1, f * 2.5));
            const lado = 1.55 * s * k;
            const x0 = cx - lado / 2;
            const y0 = topo + 0.36 * s - lado / 2;
            const a = s * 0.26;
            const d = [
              `M ${x0} ${y0 + a} L ${x0} ${y0} L ${x0 + a} ${y0}`,
              `M ${x0 + lado - a} ${y0} L ${x0 + lado} ${y0} L ${x0 + lado} ${y0 + a}`,
              `M ${x0 + lado} ${y0 + lado - a} L ${x0 + lado} ${y0 + lado} L ${x0 + lado - a} ${y0 + lado}`,
              `M ${x0 + a} ${y0 + lado} L ${x0} ${y0 + lado} L ${x0} ${y0 + lado - a}`,
            ].join(" ");
            return (
              <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, filter: `drop-shadow(0 0 2px ${cor.sombra})` }}>
                <path d={d} fill="none" stroke={trava > 0.5 ? cor.acento : cor.branco} strokeWidth={traco * (trava > 0.5 ? 2 : 1.5)} />
              </svg>
            );
          })()
        : null}
    </div>
  );
};
