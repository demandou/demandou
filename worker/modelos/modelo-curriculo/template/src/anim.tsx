import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { ESPACO_PALAVRA, larguraTexto } from "./medida";
import { cor, mao } from "./tema";

// Movimento de revisão: a folha desliza decidida e assenta; a caneta corre num gesto só.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const preciso = Easing.bezier(0.65, 0, 0.35, 1);
// a caneta acelera no começo do traço e freia no fim
export const gesto = Easing.bezier(0.45, 0.05, 0.25, 1);
const saida = Easing.bezier(0.45, 0, 0.8, 0.4);

export const useTempo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Progresso 0→1 a partir de `inicio`, durando `dur` segundos.
export const prog = (t: number, inicio: number, dur: number, easing = entra) =>
  interpolate(t, [inicio, inicio + Math.max(dur, 0.001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Progresso da saída (0 = na tela, 1 = saiu), começando em `ate`.
export const saindo = (t: number, ate: number, dur = 0.35) => prog(t, ate, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Número pseudoaleatório estável (mesmo valor em todo quadro) a partir de um número.
export const acaso = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
// `passo` = intervalo entre palavras não achadas (texto reescrito continua no ritmo).
export const temposComAchados = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de, passo = 0.16) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  let achados = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && normalizar(p.w) === alvo) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.03));
      cursor = achou + 1;
      achados++;
    } else tempos.push(anterior + passo);
  }
  return { tempos, achados };
};

export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) =>
  temposComAchados(texto, palavras, de, ate, inicio).tempos;

// Tempos de um texto que começa a ser dito em `em` (nada antes de `em`), até `ate`.
export const temposDesde = (texto: string, palavras: Palavra[], em: number, ate: number, passo = 0.16) =>
  temposComAchados(texto, palavras, em - 0.05, Math.max(ate, em + 0.5), em, passo).tempos.map((x) => Math.max(x, em - 0.05));

// Fim da fala de um texto (o `ate` da última palavra achada), para encaixar o que vem depois.
export const fimDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number) => {
  const tempos = temposDoTexto(texto, palavras, de, ate);
  const ultimo = tempos[tempos.length - 1] ?? de;
  const p = palavras.find((x) => Math.abs(x.em - 0.03 - ultimo) < 0.02 || Math.abs(x.em - ultimo) < 0.02);
  return p ? Math.min(p.ate, ultimo + 0.9) : ultimo + 0.3;
};

// Duração da escrita à mão de uma palavra: rápida, proporcional ao tamanho.
export const duracaoMao = (w: string) => Math.min(0.42, 0.08 + w.length * 0.034);

// ---------- caneta ----------

// Traço que se desenha (caminho SVG com comprimento normalizado). `p` = quanto já foi desenhado.
export const Traco: React.FC<{
  d: string;
  p: number;
  largura?: number;
  cor?: string;
  opacidade?: number;
}> = ({ d, p, largura = 5, cor: c = cor.vermelho, opacidade = 1 }) =>
  p <= 0.001 ? null : (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={c}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="1 1"
      strokeDashoffset={1 - limitar(p)}
      opacity={opacidade}
    />
  );

const pontos = (lista: [number, number][]) =>
  lista.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

// Elipse feita à mão em volta de uma caixa (passa um pouco do ponto de partida, como caneta de verdade)
export const caminhoCirculo = (w: number, h: number, semente = 1, folga = 0.16) => {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 + Math.max(14, w * folga);
  const ry = h / 2 + Math.max(10, h * folga * 0.9);
  const lista: [number, number][] = [];
  const n = 54;
  const a0 = Math.PI * (1.08 + 0.1 * acaso(semente));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * (Math.PI * 2 + 0.55);
    const r = 1 + 0.035 * Math.sin(a * 3 + semente) + (i / n) * 0.07;
    lista.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r * (1 - 0.04 * (i / n))]);
  }
  return pontos(lista);
};

// Risco quase reto, levemente inclinado, com um pequeno tremor
export const caminhoRisco = (x0: number, x1: number, y: number, semente = 1) => {
  const n = 10;
  const lista: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    lista.push([x0 + (x1 - x0) * f, y + (acaso(semente + i) - 0.5) * 3 - f * 4]);
  }
  return pontos(lista);
};

// Sublinhado em curva leve
export const caminhoSublinhado = (w: number, y: number, semente = 1) =>
  `M -6 ${y + 2} Q ${w * 0.45} ${y + 10 + 4 * acaso(semente)} ${w + 10} ${y - 4}`;

// X em dois gestos (o primeiro desce, o segundo sobe)
export const caminhosX = (w: number, h: number) => [
  `M ${w * 0.08} ${h * 0.1} Q ${w * 0.5} ${h * 0.46} ${w * 0.93} ${h * 0.9}`,
  `M ${w * 0.9} ${h * 0.08} Q ${w * 0.46} ${h * 0.52} ${w * 0.1} ${h * 0.92}`,
];

// Chave "{" de altura h, com a ponta para a esquerda
export const caminhoChave = (h: number, largura = 26) => {
  const m = h / 2;
  return `M ${largura} 0 C ${largura * 0.35} 0 ${largura * 0.55} ${m * 0.55} ${largura * 0.45} ${m - 10} C ${largura * 0.4} ${m - 2} ${largura * 0.1} ${m} 0 ${m} C ${largura * 0.1} ${m} ${largura * 0.4} ${m + 2} ${largura * 0.45} ${m + 10} C ${largura * 0.55} ${h - m * 0.55} ${largura * 0.35} ${h} ${largura} ${h}`;
};

// Seta curta para a direita
export const caminhoSeta = (w: number, y: number) => [
  `M 0 ${y} Q ${w * 0.5} ${y - 6} ${w} ${y}`,
  `M ${w - 16} ${y - 13} L ${w} ${y} L ${w - 15} ${y + 13}`,
];

// Circunflexo de inserção (^)
export const caminhoInsercao = (w: number, h: number) => `M 0 ${h} L ${w / 2} 0 L ${w} ${h}`;

// Visto (✓)
export const caminhoVisto = (w: number, h: number) => `M 0 ${h * 0.55} L ${w * 0.36} ${h} L ${w} 0`;

// ---------- escrita à mão ----------

// Uma palavra escrita à mão: a tinta aparece da esquerda para a direita, na velocidade da caneta.
export const PalavraAMao: React.FC<{
  w: string;
  em: number;
  t: number;
  dur?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ w, em, t, dur, style, children }) => {
  const p = prog(t, em, dur ?? duracaoMao(w), gesto);
  return (
    <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap", ...style }}>
      {/* terminada a escrita, o texto fica simples (sem a máscara da entrada) */}
      {p >= 1 ? w : <span style={{ clipPath: `inset(-20% ${(1 - p) * 100}% -30% -4%)`, display: "inline-block" }}>{w}</span>}
      {children}
    </span>
  );
};

// Texto escrito à mão palavra por palavra, cada uma no seu tempo (margem fixa entre palavras).
export const TextoAMao: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  // trecho exato que recebe um círculo de caneta, e quando
  circulo?: { trecho: string; em: number };
  // corpo da letra em px (para o círculo)
  tamanho?: number;
  // true = quebra em duas linhas equilibradas (sem palavra órfã)
  duasLinhas?: boolean;
}> = ({ texto, tempos, t, style, circulo, tamanho = 48, duasLinhas = false }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  // onde quebrar: o ponto que deixa as duas linhas com o tamanho mais parecido
  let quebra = -1;
  if (duasLinhas && palavras.length > 1) {
    const total = palavras.join(" ").length;
    let melhor = Infinity;
    for (let k = 1; k < palavras.length; k++) {
      const a = palavras.slice(0, k).join(" ").length;
      const d = Math.abs(a - (total - a - 1));
      if (d < melhor) {
        melhor = d;
        quebra = k;
      }
    }
  }
  const alvo = circulo ? circulo.trecho.split(/\s+/).map(normalizar) : [];
  let inicio = -1;
  if (alvo.length) {
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
        inicio = i;
        break;
      }
    }
  }
  return (
    <div style={{ fontFamily: mao, fontWeight: 600, color: cor.vermelho, display: "flex", flexWrap: "wrap", ...style }}>
      {palavras.map((w, i) => {
        const circulada = circulo && i === inicio && alvo.length === 1;
        return [
          i === quebra ? <div key={`q${i}`} style={{ flexBasis: "100%", height: 0 }} /> : null,
          <PalavraAMao key={`${w}-${i}`} w={w} em={tempos[i] ?? 0} t={t} style={{ marginRight: i === palavras.length - 1 ? 0 : "0.3em" }}>
            {circulada ? (
              <CirculoSobre em={circulo.em} t={t} semente={i + 3} w={w.length * 0.56 * tamanho} h={tamanho * 0.8} largura={Math.max(4, tamanho * 0.075)} />
            ) : null}
          </PalavraAMao>,
        ];
      })}
    </div>
  );
};

// Círculo de caneta em volta do elemento pai (position: relative), do tamanho estimado `w`×`h` (px)
export const CirculoSobre: React.FC<{ em: number; t: number; w: number; h: number; semente?: number; largura?: number; dur?: number; folga?: number; dy?: number }> = ({
  em,
  t,
  w,
  h,
  semente = 1,
  largura = 5,
  dur = 0.42,
  folga: abertura = 0.06,
  dy = 0,
}) => {
  const p = prog(t, em, dur, gesto);
  if (p <= 0) return null;
  const folga = 40 + w * abertura;
  return (
    <svg
      width={w + 2 * folga}
      height={h + 2 * folga}
      viewBox={`${-folga} ${-folga} ${w + 2 * folga} ${h + 2 * folga}`}
      style={{ position: "absolute", left: "50%", top: `calc(50% + ${dy}px)`, translate: "-50% -50%", overflow: "visible", pointerEvents: "none" }}
    >
      <Traco d={caminhoCirculo(w, h, semente, abertura)} p={p} largura={largura} />
    </svg>
  );
};

// Risco sobre o elemento pai, de ponta a ponta. `alturaPx` = altura do pai em px (o traço não deforma).
export const RiscoSobre: React.FC<{ p: number; alturaPx: number; largura?: number; semente?: number; altura?: number }> = ({
  p,
  alturaPx,
  largura = 5,
  semente = 1,
  altura = 0.55,
}) => {
  if (p <= 0) return null;
  return (
    <svg
      viewBox={`0 0 100 ${alturaPx}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", left: "-3%", top: 0, width: "106%", height: alturaPx, overflow: "visible", pointerEvents: "none" }}
    >
      <Traco d={caminhoRisco(0, 100, alturaPx * altura, semente)} p={p} largura={largura} />
    </svg>
  );
};

// Sublinhado de caneta sob o elemento pai
export const SublinhadoSob: React.FC<{ p: number; largura?: number; semente?: number }> = ({ p, largura = 5, semente = 2 }) => {
  if (p <= 0) return null;
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      style={{ position: "absolute", left: 0, bottom: -16, width: "100%", height: 24, overflow: "visible", pointerEvents: "none" }}
    >
      <Traco d={caminhoSublinhado(100, 10, semente)} p={p} largura={largura} />
    </svg>
  );
};

// Sublinhado de caneta sob uma palavra; `estender` (px) leva o traço por baixo do espaço até a
// palavra seguinte (trecho de várias palavras vira um traço contínuo).
export const SublinhadoPalavra: React.FC<{ p: number; estender?: number; largura?: number; semente?: number; abaixo?: number }> = ({
  p,
  estender = 0,
  largura = 5,
  semente = 2,
  abaixo = 0.14,
}) => {
  if (p <= 0) return null;
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: 0,
        bottom: `${-abaixo}em`,
        width: `calc(100% + ${estender}px)`,
        height: 24,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <Traco d={caminhoSublinhado(100, 10, semente)} p={p} largura={largura} />
    </svg>
  );
};

// Linhas escritas à mão (já quebradas): cada palavra no seu tempo, margem fixa entre palavras.
// `circulo`/`sublinhado`: índices (na lista de todas as palavras) do trecho marcado e quando.
export const LinhasAMao: React.FC<{
  linhas: string[][];
  tempos: number[];
  t: number;
  tamanho: number;
  peso?: number;
  cor?: string;
  alinhar?: "left" | "center";
  alturaLinha?: number;
  circulo?: { de: number; ate: number; em: number } | null;
  sublinhado?: { de: number; ate: number; em: number } | null;
  style?: React.CSSProperties;
}> = ({ linhas, tempos, t, tamanho, peso = 600, cor: c = cor.vermelho, alinhar = "left", alturaLinha = 1.2, circulo, sublinhado, style }) => {
  let k = 0;
  return (
    <div style={{ fontFamily: mao, fontWeight: peso, fontSize: tamanho, lineHeight: alturaLinha, color: c, ...style }}>
      {linhas.map((linha, li) => (
        <div key={li} style={{ display: "flex", justifyContent: alinhar === "center" ? "center" : "flex-start", whiteSpace: "nowrap" }}>
          {linha.map((w, wi) => {
            const i = k++;
            const ultima = wi === linha.length - 1;
            const gap = ESPACO_PALAVRA * tamanho;
            const noCirculo = circulo && i >= circulo.de && i <= circulo.ate;
            const noSub = sublinhado && i >= sublinhado.de && i <= sublinhado.ate;
            return (
              <PalavraAMao key={`${w}-${i}`} w={w} em={tempos[i] ?? 0} t={t} style={{ marginRight: ultima ? 0 : gap }}>
                {noCirculo && circulo.de === circulo.ate ? (
                  <CirculoSobre em={circulo.em} t={t} semente={i + 3} w={larguraTexto(w, tamanho, "mao", peso)} h={tamanho * 0.8} largura={Math.max(4, tamanho * 0.075)} />
                ) : null}
                {noSub || (noCirculo && circulo.de !== circulo.ate) ? (
                  <SublinhadoPalavra
                    p={prog(t, (noSub ? sublinhado.em : circulo!.em) + (i - (noSub ? sublinhado.de : circulo!.de)) * 0.08, 0.2, gesto)}
                    estender={!ultima && i < (noSub ? sublinhado.ate : circulo!.ate) ? gap : 0}
                    largura={Math.max(4, tamanho * 0.07)}
                    semente={i + 2}
                  />
                ) : null}
              </PalavraAMao>
            );
          })}
        </div>
      ))}
    </div>
  );
};
