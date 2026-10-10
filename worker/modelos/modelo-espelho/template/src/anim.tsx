import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento de espelho: desliza decidido e assenta. Sem quique, sem giro, sem pulsar.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const desliza = Easing.bezier(0.65, 0, 0.35, 1);
const saida = Easing.in(Easing.cubic);

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

// Progresso da saída (0 = na tela, 1 = saiu).
export const saindo = (t: number, ate: number, dur = 0.3) => prog(t, ate - dur, dur, saida);

export const mistura = (a: number, b: number, p: number) => a + (b - a) * p;
export const limitar = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Traço que se desenha (p de 0 a 1 ao longo do caminho). Com `tracejado`, aparece por opacidade.
export const Traco: React.FC<
  { d: string; p?: number; cor: string; largura: number; tracejado?: string } & Omit<
    React.SVGProps<SVGPathElement>,
    "d" | "stroke" | "strokeWidth"
  >
> = ({ d, p = 1, cor: c, largura, tracejado, ...resto }) => {
  if (p <= 0.002) return null;
  const parcial = p < 0.999 && !tracejado;
  return (
    <path
      d={d}
      fill="none"
      stroke={c}
      strokeWidth={largura}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={parcial ? 1 : undefined}
      strokeDasharray={tracejado ?? (parcial ? `${p} 1` : undefined)}
      opacity={tracejado ? p : undefined}
      {...resto}
    />
  );
};

// ---------- texto falado ----------

const POR_EXTENSO: Record<string, string> = {
  um: "1", uma: "1", dois: "2", duas: "2", tres: "3", quatro: "4", cinco: "5", seis: "6", sete: "7",
  oito: "8", nove: "9", dez: "10", onze: "11", doze: "12", quinze: "15", dezoito: "18", vinte: "20", trinta: "30",
};
// forma de comparar palavras: sem acento, sem pontuação, número por extenso vira dígito
export const normalizar = (w: string) => {
  const n = w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return POR_EXTENSO[n] ?? n;
};

// Capa do vídeo: num momento que abre o vídeo, o que é dito nos primeiros 0,6 s já está inteiro no
// primeiro quadro (a capa do Reels não fica vazia nem com palavra pela metade)
export const capaDe = (de: number) => (x: number) => (de < 0.3 && x < 0.6 ? -0.5 : x);

// Símbolos desenhados (não falados): entram junto com a palavra seguinte, ou no tempo pedido.
export const SIMBOLOS = new Set(["≠", "=", "×", "+", "→"]);

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada (texto reescrito) entra logo depois da anterior, no mesmo ritmo.
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tokens = texto.split(/\s+/).filter(Boolean);
  const tempos: (number | null)[] = [];
  let cursor = 0;
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i];
    if (SIMBOLOS.has(w)) {
      tempos.push(null);
      continue;
    }
    const anterior = [...tempos].reverse().find((x): x is number => x !== null) ?? Math.max(0, inicio - 0.12);
    // duas palavras do texto podem ser uma só na fala ("por que" × "porque")
    const junta = i + 1 < tokens.length ? normalizar(w + tokens[i + 1]) : "";
    const achouJunta = junta ? faladas.findIndex((p, k) => k >= cursor && k - cursor <= 2 && normalizar(p.w) === junta) : -1;
    if (achouJunta >= 0) {
      const em = Math.max(anterior, faladas[achouJunta].em - 0.05);
      tempos.push(em, em + 0.08);
      cursor = achouJunta + 1;
      i++;
      continue;
    }
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && normalizar(p.w) === alvo) : -1;
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.05));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.12);
  }
  // símbolo: com a palavra seguinte (ou logo depois da anterior, se for o último)
  return tempos.map((x, i) => {
    if (x !== null) return x;
    const depois = tempos.slice(i + 1).find((y): y is number => y !== null);
    const antes = [...tempos.slice(0, i)].reverse().find((y): y is number => y !== null);
    return depois ?? (antes ?? inicio) + 0.2;
  });
};

// Uma palavra revelada pelo fio do espelho: um filete dourado atravessa a palavra da esquerda
// para a direita e ela aparece atrás dele. É a assinatura de movimento do modelo.
// Terminada a entrada, a palavra é desenhada como texto simples, sem a máscara (nenhum quadro
// capturado fica com a camada de entrada montada).
export const PalavraRevelada: React.FC<{
  w: string;
  p: number;
  style?: React.CSSProperties;
  margem?: string | number;
  semFio?: boolean;
  // risco por cima da palavra (0 a 1, cresce da esquerda para a direita) e a cor dele
  risco?: number;
  corRisco?: string;
}> = ({ w, p, style, margem = 0, semFio, risco, corRisco }) => {
  const q = limitar(p);
  const riscado =
    risco !== undefined && risco > 0.001 ? (
      <span
        style={{
          position: "absolute",
          left: "-0.04em",
          width: "calc(100% + 0.08em)",
          top: "0.56em",
          height: "0.07em",
          minHeight: 3,
          background: corRisco ?? cor.cafe,
          transform: `scaleX(${limitar(risco)})`,
          transformOrigin: "left center",
        }}
      />
    ) : null;
  if (q >= 0.999) {
    return (
      <span style={{ position: "relative", display: "inline-block", marginRight: margem, ...style }}>
        {w}
        {riscado}
      </span>
    );
  }
  return (
    <span style={{ position: "relative", display: "inline-block", marginRight: margem, ...style }}>
      <span
        style={{
          display: "inline-block",
          // antes de começar, nada da palavra aparece (nem a lasca que o deslocamento empurra para fora)
          visibility: q <= 0.001 ? "hidden" : "visible",
          clipPath: `inset(-0.35em calc(${(1 - q) * 100}% - ${0.35 * q}em) -0.35em -0.35em)`,
          translate: `${(1 - q) * -0.06}em 0`,
        }}
      >
        {w}
      </span>
      {!semFio && q > 0.01 && q < 0.99 ? (
        <span
          style={{
            position: "absolute",
            left: `${q * 100}%`,
            top: "0.06em",
            height: "1.02em",
            width: 2,
            marginLeft: 3,
            background: cor.ouro,
            opacity: Math.sin(Math.PI * q),
          }}
        />
      ) : null}
      {riscado}
    </span>
  );
};

// Índices das palavras de `texto` que formam o trecho `trecho` (a primeira ocorrência).
export const marcarTrecho = (palavras: string[], trecho?: string) => {
  const alvo = trecho ? trecho.split(/\s+/).filter(Boolean).map(normalizar) : [];
  const marcadas = new Set<number>();
  if (!alvo.length) return marcadas;
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => marcadas.add(i + k));
      break;
    }
  }
  return marcadas;
};

// Texto já quebrado em linhas (medida.ts), palavra por palavra na fala. Cada linha é uma fileira
// sem quebra automática. `marcas`: trechos com outro estilo (ênfase dourada, alerta); `risco`:
// trecho riscado a partir de `riscoEm`, palavra por palavra.
export const TextoEmLinhas: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  tamanho: number;
  entre?: number;
  alinhar?: "left" | "center" | "right";
  style?: React.CSSProperties;
  marcas?: { trecho?: string; style: React.CSSProperties }[];
  risco?: { trecho?: string; em?: number; cor: string };
  dur?: number;
  vao?: string;
}> = ({ linhas, tempos, t, tamanho, entre = 1.06, alinhar = "left", style, marcas = [], risco, dur = 0.42, vao = "0.24em" }) => {
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const estilos = new Map<number, React.CSSProperties>();
  for (const mk of marcas) for (const i of marcarTrecho(todas, mk.trecho)) estilos.set(i, { ...(estilos.get(i) ?? {}), ...mk.style });
  const riscadas = [...marcarTrecho(todas, risco?.trecho)].sort((a, b) => a - b);
  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start" }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        return (
          <div key={li} style={{ display: "flex", whiteSpace: "nowrap", height: tamanho * entre, alignItems: "center", fontSize: tamanho, lineHeight: entre, ...style }}>
            {ws.map((w, i) => {
              const idx = k++;
              const ultima = i === ws.length - 1;
              const pr = riscadas.indexOf(idx);
              const pRisco = pr >= 0 && risco?.em !== undefined ? prog(t, risco.em + (pr * 0.45) / Math.max(1, riscadas.length), 0.45 / Math.max(1, riscadas.length) + 0.12, (x) => x) : undefined;
              if (SIMBOLOS.has(w)) return <Simbolo key={idx} s={w} p={prog(t, tempos[idx] ?? 0, 0.6)} margem={ultima ? 0 : vao} />;
              return (
                <PalavraRevelada
                  key={idx}
                  w={w}
                  p={prog(t, tempos[idx] ?? 0, dur)}
                  margem={ultima ? 0 : vao}
                  style={estilos.get(idx)}
                  risco={pRisco}
                  corRisco={risco?.cor}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Texto que se monta palavra por palavra na fala. `enfase`: trecho exato em itálico dourado.
// Símbolos (≠ × → + =) são desenhados em ouro, com traço.
export const TextoFalado: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  enfase?: string;
  // índices das palavras em ênfase (quando a ênfase atravessa linhas, quem chama calcula)
  marcadasFora?: Set<number>;
  dur?: number;
}> = ({ texto, tempos, t, style, enfase, marcadasFora, dur = 0.42 }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const alvo = enfase && !marcadasFora ? enfase.split(/\s+/).filter(Boolean).map(normalizar) : [];
  const marcadas = marcadasFora ?? new Set<number>();
  if (alvo.length) {
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
        alvo.forEach((_, k) => marcadas.add(i + k));
        break;
      }
    }
  }
  return (
    <div style={{ textWrap: "balance", ...style }}>
      {palavras.map((w, i) => {
        const p = prog(t, tempos[i] ?? 0, dur);
        const ultima = i === palavras.length - 1;
        if (SIMBOLOS.has(w)) {
          return <Simbolo key={`${w}-${i}`} s={w} p={prog(t, tempos[i] ?? 0, 0.6)} margem={ultima ? 0 : "0.24em"} />;
        }
        return (
          <PalavraRevelada
            key={`${w}-${i}`}
            w={w}
            p={p}
            margem={ultima ? 0 : "0.24em"}
            style={marcadas.has(i) ? { fontStyle: "italic", color: cor.ouroTexto } : undefined}
          />
        );
      })}
    </div>
  );
};

// Símbolo desenhado com traço fino, do tamanho da letra
export const Simbolo: React.FC<{ s: string; p: number; margem?: string | number }> = ({ s, p, margem }) => {
  const a = prog(p, 0, 0.55, (x) => x);
  const b = prog(p, 0.4, 0.6, (x) => x);
  const linhas: { d: string; p: number }[] =
    s === "≠"
      ? [
          { d: "M 8 40 L 72 40", p: a },
          { d: "M 8 62 L 72 62", p: a },
          { d: "M 56 18 L 24 84", p: b },
        ]
      : s === "="
        ? [
            { d: "M 8 40 L 72 40", p: a },
            { d: "M 8 62 L 72 62", p: b },
          ]
        : s === "×"
          ? [
              { d: "M 16 28 L 64 76", p: a },
              { d: "M 64 28 L 16 76", p: b },
            ]
          : s === "+"
            ? [
                { d: "M 8 51 L 72 51", p: a },
                { d: "M 40 19 L 40 83", p: b },
              ]
            : [
                { d: "M 6 51 L 72 51", p: a },
                { d: "M 52 31 L 72 51 L 52 71", p: b },
              ];
  return (
    <span style={{ display: "inline-block", width: "0.8em", height: "1em", marginRight: margem, verticalAlign: "-0.1em" }}>
      <svg viewBox="0 0 80 100" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        {linhas.map((l, i) => (
          <Traco key={i} d={l.d} p={l.p} cor={cor.ouro} largura={5} />
        ))}
      </svg>
    </span>
  );
};
