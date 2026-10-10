import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Palavra } from "./plano";
import { cor } from "./tema";

// Movimento de arquivo: papel que desliza decidido e assenta; carimbo que bate seco.
export const entra = Easing.bezier(0.16, 1, 0.3, 1);
export const preciso = Easing.bezier(0.65, 0, 0.35, 1);
// saída: começa a andar logo (o documento que sai não pode ficar parado em cima do que entra)
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

// Número pseudoaleatório estável (mesmo valor em todo quadro) a partir de um inteiro.
export const acaso = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- texto falado ----------

export const normalizar = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Quando cada palavra de um texto é dita: procura, em ordem, entre as palavras faladas no trecho.
// Palavra não achada entra logo depois da anterior (texto reescrito continua no ritmo).
export const temposDoTexto = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) => {
  const faladas = palavras.filter((p) => p.em >= de - 0.35 && p.em < ate + 0.1);
  const tempos: number[] = [];
  let cursor = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const alvo = normalizar(w);
    const achou = alvo ? faladas.findIndex((p, k) => k >= cursor && normalizar(p.w) === alvo) : -1;
    const anterior = tempos[tempos.length - 1] ?? Math.max(0, inicio - 0.12);
    if (achou >= 0 && achou - cursor <= 6) {
      tempos.push(Math.max(anterior, faladas[achou].em - 0.04));
      cursor = achou + 1;
    } else tempos.push(anterior + 0.14);
  }
  return tempos;
};

// Duração da datilografia de um texto: rápida (máquina elétrica), nunca lenta demais.
export const duracaoDatilo = (texto: string) => Math.min(1.1, Math.max(0.22, texto.length * 0.042));

// Máquina de escrever: cada letra bate no seu instante, com a leve irregularidade da tinta
// (opacidade e linha de base variam um tiquinho). O texto inteiro ocupa o lugar desde o começo,
// então nada "pula" enquanto é escrito. O cursor vermelho acompanha e pisca um instante no fim.
export const Datilo: React.FC<{
  texto: string;
  em: number;
  t: number;
  dur?: number;
  style?: React.CSSProperties;
  cursor?: boolean;
  corCursor?: string;
  semente?: number;
}> = ({ texto, em, t, dur, style, cursor = true, corCursor = cor.vermelho, semente = 0 }) => {
  const d = dur ?? duracaoDatilo(texto);
  // terminada a datilografia (e o cursor), o texto vira uma camada só, simples: nada de letras
  // soltas montadas por cima umas das outras nos quadros seguintes
  if (t >= em + d + 0.5) return <span style={{ whiteSpace: "pre-wrap", opacity: 0.94, ...style }}>{texto}</span>;
  const letras = Array.from(texto);
  const p = limitar((t - em) / d);
  const visiveis = t < em ? 0 : Math.ceil(p * letras.length);
  const escrevendo = t >= em && t < em + d + 0.45;
  const piscaLigado = t < em + d || Math.floor((t - em - d) / 0.15) % 2 === 0;
  return (
    <span style={{ whiteSpace: "pre-wrap", ...style }}>
      {letras.map((c, i) => {
        const r = acaso(i + semente * 97 + 3);
        const mostra = i < visiveis;
        return (
          <span
            key={i}
            style={{
              opacity: mostra ? 0.86 + 0.14 * r : 0,
              position: "relative",
              top: mostra ? (acaso(i * 7 + semente) - 0.5) * 1.6 : 0,
            }}
          >
            {c}
            {cursor && escrevendo && piscaLigado && i === Math.max(0, visiveis - 1) && visiveis > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: "100%",
                  top: "0.08em",
                  width: "0.52em",
                  height: "0.95em",
                  marginLeft: "0.05em",
                  background: corCursor,
                }}
              />
            ) : null}
          </span>
        );
      })}
    </span>
  );
};

// Texto falado datilografado palavra por palavra: cada palavra bate quando é dita.
export const DatiloFalado: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  enfase?: string;
  corEnfase?: string;
  // true = a ênfase vira uma tarja vermelha com texto claro (para texto sobre vídeo escuro)
  tarja?: boolean;
  // linhas já quebradas (medida.ts): cada uma vira uma linha de verdade, sem depender do navegador
  linhas?: string[];
  // palavras [de, até] (índices) rasuradas por um traço vermelho a partir de `riscoEm`
  risco?: [number, number] | null;
  riscoEm?: number;
}> = ({ texto, tempos, t, style, enfase, corEnfase = cor.vermelho, tarja = false, linhas, risco, riscoEm = 0 }) => {
  if (linhas && linhas.length) {
    // cada linha é um bloco; os índices das palavras continuam contando de uma linha para a outra
    let inicio = 0;
    const blocos = linhas.map((linha) => {
      const n = linha.split(/\s+/).filter(Boolean).length;
      const b = { linha, inicio };
      inicio += n;
      return b;
    });
    const todas = texto.split(/\s+/).filter(Boolean);
    return (
      <div style={style}>
        {blocos.map(({ linha, inicio: i0 }, k) => (
          <div key={k} style={{ whiteSpace: "nowrap" }}>
            <PalavrasFaladas
              palavras={linha.split(/\s+/).filter(Boolean)}
              todas={todas}
              desde={i0}
              tempos={tempos}
              t={t}
              enfase={enfase}
              corEnfase={corEnfase}
              tarja={tarja}
              risco={risco}
              riscoEm={riscoEm}
            />
          </div>
        ))}
      </div>
    );
  }
  const palavras = texto.split(/\s+/).filter(Boolean);
  const alvo = enfase ? enfase.split(/\s+/).filter(Boolean).map(normalizar) : [];
  const marcadas = new Set<number>();
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
        const marcada = marcadas.has(i);
        const ultima = i === palavras.length - 1;
        const emTarja = tarja && marcada;
        const seguidaDeTarja = emTarja && marcadas.has(i + 1);
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: "inline-block",
              marginRight: ultima || seguidaDeTarja ? 0 : "0.26em",
              color: marcada && !tarja ? corEnfase : undefined,
              ...(emTarja
                ? {
                    background: corEnfase,
                    padding: `0 ${seguidaDeTarja ? "0.38em" : "0.12em"} 0.04em 0.12em`,
                    marginLeft: marcadas.has(i - 1) ? 0 : "-0.04em",
                    opacity: prog(t, (tempos[i] ?? 0) - 0.02, 0.1),
                  }
                : {}),
            }}
          >
            <Datilo texto={w} em={tempos[i] ?? 0} t={t} dur={Math.min(0.3, w.length * 0.04)} cursor={ultima} semente={i} />
          </span>
        );
      })}
    </div>
  );
};

// As palavras de uma linha de um texto falado (índices globais a partir de `desde`).
const PalavrasFaladas: React.FC<{
  palavras: string[];
  todas: string[];
  desde: number;
  tempos: number[];
  t: number;
  enfase?: string;
  corEnfase: string;
  tarja: boolean;
  risco?: [number, number] | null;
  riscoEm: number;
}> = ({ palavras, todas, desde, tempos, t, enfase, corEnfase, tarja, risco, riscoEm }) => {
  const alvo = enfase ? enfase.split(/\s+/).filter(Boolean).map(normalizar) : [];
  const marcadas = new Set<number>();
  if (alvo.length) {
    for (let i = 0; i + alvo.length <= todas.length; i++) {
      if (alvo.every((a, k) => normalizar(todas[i + k]) === a)) {
        alvo.forEach((_, k) => marcadas.add(i + k));
        break;
      }
    }
  }
  // o traço da rasura corre pelas palavras do trecho, uma depois da outra (~0,12 s cada)
  const nRisco = risco ? risco[1] - risco[0] + 1 : 0;
  const pRisco = risco ? limitar((t - riscoEm) / Math.max(0.3, nRisco * 0.12)) * nRisco : 0;
  return (
    <>
      {palavras.map((w, j) => {
        const i = desde + j;
        const marcada = marcadas.has(i);
        const ultima = j === palavras.length - 1;
        const emTarja = tarja && marcada;
        const seguidaDeTarja = emTarja && marcadas.has(i + 1) && !ultima;
        const riscada = risco && i >= risco[0] && i <= risco[1];
        const r = riscada ? limitar(pRisco - (i - risco[0])) : 0;
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: "inline-block",
              position: "relative",
              marginRight: ultima || seguidaDeTarja ? 0 : "0.26em",
              color: marcada && !tarja ? corEnfase : undefined,
              ...(emTarja
                ? {
                    background: corEnfase,
                    padding: `0 ${seguidaDeTarja ? "0.38em" : "0.12em"} 0.04em 0.12em`,
                    marginLeft: marcadas.has(i - 1) && j > 0 ? 0 : "-0.04em",
                    opacity: prog(t, (tempos[i] ?? 0) - 0.02, 0.1),
                  }
                : {}),
            }}
          >
            <Datilo texto={w} em={tempos[i] ?? 0} t={t} dur={Math.min(0.3, w.length * 0.04)} cursor={i === todas.length - 1} semente={i} />
            {riscada && r > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: "-0.06em",
                  top: "50%",
                  height: "0.11em",
                  width: `calc(${r * 100}% + ${r * (j === palavras.length - 1 || i === risco[1] ? 0.12 : 0.38)}em)`,
                  background: cor.vermelho,
                  rotate: "-1.5deg",
                }}
              />
            ) : null}
          </span>
        );
      })}
    </>
  );
};

// Quando o texto só pode aparecer depois de `inicio` (o super esperou a foto crescer), as palavras
// já ditas entram em sequência rápida a partir dali, uma depois da outra. Também separa palavras
// que a transcrição marcou quase no mesmo instante: nunca duas sendo datilografadas juntas.
export const aPartirDe = (tempos: number[], inicio: number, passo = 0.09) => {
  const saida: number[] = [];
  let empurrada = false;
  tempos.forEach((x, i) => {
    let y = Math.max(x, inicio);
    if (i > 0) y = Math.max(y, saida[i - 1] + (empurrada ? passo : 0.08));
    empurrada = y > x + 1e-6;
    saida.push(y);
  });
  return saida;
};
