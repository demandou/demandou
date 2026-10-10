// Escrita de giz: uma linha que mistura palavras (letra manuscrita) e algarismos/sinais desenhados
// a traço, revelada no ritmo de uma mão escrevendo; e os traços soltos (círculo, seta, sublinhado,
// moldura) que ligam os passos da conta.
import { cor as paleta, mao, TRACO } from "../tema";
import { comprimento, GLIFOS, temGlifo, transformar } from "./glifos";
import { corpoParaAltura, larguraMao, PESO_MAO } from "./medir";

// ---------- montagem da linha ----------

export type Trecho =
  | { tipo: "glifo"; c: string; x: number; largura: number; tinta: number; tracos: { d: string; tinta: number }[] }
  | { tipo: "texto"; s: string; x: number; largura: number; tinta: number }
  | { tipo: "espaco"; x: number; largura: number; tinta: number };

export type Linha = { texto: string; tamanho: number; trechos: Trecho[]; largura: number; tinta: number };

// letra manuscrita: mesma altura de maiúscula que os algarismos (um pouco menor, como na mão)
const ALTURA_LETRA = 0.92;

// letras que têm traço próprio só valem como sinal dentro de "R$" e "US$"
const ehSinal = (letras: string[], i: number) => {
  const c = letras[i];
  if (c === "R") return letras[i + 1] === "$";
  if (c === "S") return letras[i + 1] === "$";
  if (c === "U") return letras[i + 1] === "S" && letras[i + 2] === "$";
  return true;
};

export const montarLinha = (texto: string, tamanho: number): Linha => {
  const s = tamanho / 100;
  const trechos: Trecho[] = [];
  let x = 0;
  let palavra = "";
  const corpo = corpoParaAltura(tamanho * ALTURA_LETRA);
  const fecharPalavra = () => {
    if (!palavra) return;
    const largura = larguraMao(palavra, corpo);
    trechos.push({ tipo: "texto", s: palavra, x, largura, tinta: largura * 2.1 });
    x += largura;
    palavra = "";
  };
  const letras = [...texto];
  letras.forEach((c, i) => {
    if (c === " ") {
      fecharPalavra();
      const largura = GLIFOS[" "].a * s;
      trechos.push({ tipo: "espaco", x, largura, tinta: largura * 0.6 });
      x += largura;
    } else if (temGlifo(c) && ehSinal(letras, i)) {
      // algarismos e sinais são traços de giz; "R", "U" e "S" só nas moedas (R$, US$)
      fecharPalavra();
      const g = GLIFOS[c];
      const tracos = g.t.map((d) => {
        const dd = transformar(d, s, x, -tamanho);
        return { d: dd, tinta: comprimento(dd) };
      });
      const largura = g.a * s;
      trechos.push({ tipo: "glifo", c, x, largura, tracos, tinta: tracos.reduce((n, t) => n + t.tinta, 0) });
      x += largura;
    } else palavra += c;
  });
  fecharPalavra();
  return { texto, tamanho, trechos, largura: x, tinta: trechos.reduce((n, t) => n + t.tinta, 0) };
};

// tempo para escrever uma linha (giz rápido, mas visível)
export const duracaoDaEscrita = (linha: Linha, maximo = 1.1) => Math.min(maximo, Math.max(0.22, linha.tinta / 3000));

// ---------- desenho ----------

export const LinhaDeGiz: React.FC<{
  linha: Linha;
  x: number;
  // linha de base
  y: number;
  // 0 → 1: quanto da linha já foi escrito
  p: number;
  cor?: string;
  opacidade?: number;
  id: string;
}> = ({ linha, x, y, p, cor = paleta.giz, opacidade = 1, id }) => {
  if (p <= 0.001 || opacidade <= 0.001) return null;
  const alvo = p * linha.tinta;
  const largura = Math.max(3, linha.tamanho * TRACO);
  const corpo = corpoParaAltura(linha.tamanho * ALTURA_LETRA);
  let acum = 0;
  return (
    <g opacity={opacidade}>
      {linha.trechos.map((t, i) => {
        const inicio = acum;
        acum += t.tinta;
        const local = Math.min(1, Math.max(0, (alvo - inicio) / Math.max(1e-6, t.tinta)));
        if (local <= 0 || t.tipo === "espaco") return null;
        if (t.tipo === "texto") {
          const clip = `${id}-c${i}`;
          return (
            <g key={i}>
              {local < 1 ? (
                <clipPath id={clip}>
                  <rect x={x + t.x - 4} y={y - linha.tamanho * 1.7} width={(t.largura + 8) * local} height={linha.tamanho * 2.6} />
                </clipPath>
              ) : null}
              <text
                x={x + t.x}
                y={y}
                fontFamily={mao}
                fontWeight={PESO_MAO}
                fontSize={corpo}
                fill={cor}
                clipPath={local < 1 ? `url(#${clip})` : undefined}
              >
                {t.s}
              </text>
            </g>
          );
        }
        // glifo: os traços na ordem da mão
        let feito = 0;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            {t.tracos.map((tr, k) => {
              const q = Math.min(1, Math.max(0, (local * t.tinta - feito) / Math.max(1e-6, tr.tinta)));
              feito += tr.tinta;
              if (q <= 0) return null;
              return (
                <path
                  key={k}
                  d={tr.d}
                  fill="none"
                  stroke={cor}
                  strokeWidth={largura}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={q < 1 ? 1 : undefined}
                  strokeDasharray={q < 1 ? `${q} 1` : undefined}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// Traço solto de giz que se desenha (p de 0 a 1)
export const Traco: React.FC<{ d: string; p: number; cor?: string; largura: number; opacidade?: number }> = ({
  d,
  p,
  cor = paleta.giz,
  largura,
  opacidade = 1,
}) => {
  if (p <= 0.001 || opacidade <= 0.001) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={cor}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacidade}
      pathLength={p < 0.999 ? 1 : undefined}
      strokeDasharray={p < 0.999 ? `${p} 1` : undefined}
    />
  );
};

// ---------- formas à mão (determinísticas) ----------

const aleatorio = (semente: number) => {
  let a = Math.floor(semente * 9973) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const polilinha = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

// círculo de giz em volta de algo: começa em cima à direita, dá a volta e passa um pouco do início
export const circuloDeGiz = (cx: number, cy: number, rx: number, ry: number, semente = 1) => {
  const r = aleatorio(semente);
  const ini = -Math.PI * 0.62 + (r() - 0.5) * 0.3;
  const voltas = 1.12;
  const pts: [number, number][] = [];
  const n = 64;
  const a1 = r() * 0.06;
  const a2 = r() * 0.05;
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const a = ini - f * Math.PI * 2 * voltas;
    // o raio abre um pouco no fim (a mão não fecha exatamente no mesmo lugar)
    const abre = 1 + f * 0.07 + Math.sin(f * Math.PI * 3 + a1 * 40) * a2;
    pts.push([cx + Math.cos(a) * rx * abre, cy + Math.sin(a) * ry * abre]);
  }
  return polilinha(pts);
};

// sublinhado levemente torto
export const sublinhadoDeGiz = (x1: number, x2: number, y: number, semente = 1) => {
  const r = aleatorio(semente);
  const pts: [number, number][] = [];
  const n = 18;
  const curva = (r() - 0.5) * 10;
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    pts.push([x1 + (x2 - x1) * f, y + Math.sin(f * Math.PI) * curva + (f - 0.5) * 6]);
  }
  return polilinha(pts);
};

// seta em arco de (x1,y1) para (x2,y2), bojo para cima (altura negativa = para baixo)
export const setaEmArco = (x1: number, y1: number, x2: number, y2: number, altura: number) => {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - altura;
  const arco = `M ${x1} ${y1} C ${x1 + (mx - x1) * 0.15} ${my}, ${x2 - (x2 - mx) * 0.15} ${my}, ${x2} ${y2}`;
  // ponta: dois riscos curtos na direção da chegada
  const ang = Math.atan2(y2 - my, x2 - (x2 - (x2 - mx) * 0.15));
  const tam = Math.max(22, Math.abs(x2 - x1) * 0.22);
  const p1: [number, number] = [x2 - Math.cos(ang - 0.5) * tam, y2 - Math.sin(ang - 0.5) * tam];
  const p2: [number, number] = [x2 - Math.cos(ang + 0.5) * tam, y2 - Math.sin(ang + 0.5) * tam];
  const ponta = `M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L ${x2} ${y2} L ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  return { arco, ponta };
};

// seta reta (com leve curva) de um ponto a outro
export const setaReta = (x1: number, y1: number, x2: number, y2: number, semente = 1) => {
  const r = aleatorio(semente);
  const mx = (x1 + x2) / 2 + (r() - 0.5) * 16;
  const my = (y1 + y2) / 2 + (r() - 0.5) * 16;
  const linha = `M ${x1} ${y1} C ${mx} ${my}, ${mx} ${my}, ${x2} ${y2}`;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const tam = 30;
  const p1: [number, number] = [x2 - Math.cos(ang - 0.5) * tam, y2 - Math.sin(ang - 0.5) * tam];
  const p2: [number, number] = [x2 - Math.cos(ang + 0.5) * tam, y2 - Math.sin(ang + 0.5) * tam];
  return { linha, ponta: `M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L ${x2} ${y2} L ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}` };
};

// moldura de giz: retângulo à mão, com os cantos passando um pouco
export const molduraDeGiz = (x: number, y: number, w: number, h: number, semente = 1) => {
  const r = aleatorio(semente);
  const j = () => (r() - 0.5) * 8;
  const passa = 14;
  return [
    `M ${x - passa} ${y + j()} L ${x + w + passa * 0.6} ${y + j()}`,
    `M ${x + w + j()} ${y - passa * 0.6} L ${x + w + j()} ${y + h + passa}`,
    `M ${x + w + passa} ${y + h + j()} L ${x - passa * 0.6} ${y + h + j()}`,
    `M ${x + j()} ${y + h + passa * 0.6} L ${x + j()} ${y - passa}`,
  ];
};

// ---------- filtro de giz ----------

// Textura de giz aplicada a tudo que é escrito na lousa: borda levemente irregular e grão
// (pequenas falhas no traço). O ruído é fixo: o giz não "ferve" de um quadro para o outro.
export const FiltroDeGiz: React.FC<{ id?: string }> = ({ id = "giz" }) => (
  <filter id={id} x="0" y="0" width="1080" height="1920" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="onda" />
    <feDisplacementMap in="SourceGraphic" in2="onda" scale="4" xChannelSelector="R" yChannelSelector="G" result="torto" />
    <feGaussianBlur in="torto" stdDeviation="0.5" result="macio" />
    <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="3" seed="9" result="grao" />
    <feColorMatrix in="grao" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -7 0 0 0 4.55" result="furos" />
    <feComposite in="macio" in2="furos" operator="in" />
  </filter>
);
