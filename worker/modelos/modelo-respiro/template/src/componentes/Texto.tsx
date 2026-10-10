import { indicesDoTrecho, limitar, prog } from "../anim";
import { type Encaixe, encaixar, type Fonte, quebrar } from "../medida";
import { cor, mao, serif } from "../tema";

// Texto falado, palavra por palavra. O texto é medido (medida.ts) e quebrado em linhas aqui mesmo:
// cabe sempre no lugar, sem depender do navegador.
type Comum = {
  texto: string;
  // instante em que cada palavra é dita (ver temposDoTexto)
  tempos: number[];
  t: number;
  // largura disponível (px). Com `tamanho`, o corpo é fixo e o texto só quebra; sem ele, o corpo
  // encolhe de `max` até `min` para caber em `linhas` linhas.
  largura?: number;
  tamanho?: number;
  max?: number;
  min?: number;
  linhas?: number;
  // encaixe já calculado (quando o componente precisa da altura antes de desenhar)
  encaixe?: Encaixe;
  cor?: string;
  peso?: number;
  alinhar?: "left" | "center";
  estilo?: React.CSSProperties;
  // trecho com grifo de marca-texto, e quando ele passa
  grifo?: string;
  grifoEm?: number;
  // trecho com sublinhado à mão, e quando ele se desenha
  sublinhar?: string;
  sublinharEm?: number;
  // cor do sublinhado (padrão: damasco)
  corSublinhado?: string;
  // trecho riscado à mão (um traço de tinta que passa por cima), e quando
  risco?: string;
  riscoEm?: number;
  italico?: boolean;
  // altura da linha
  linha?: number;
};

export const FONTE_MAO = (peso = 600): Fonte => ({ familia: "mao", peso });
export const FONTE_SERIF = (peso = 400): Fonte => ({ familia: "serif", peso });

// O encaixe que um texto vai ter (o mesmo cálculo que o componente faz ao desenhar)
export const encaixeDe = (
  texto: string,
  fonte: Fonte,
  o: { largura: number; tamanho?: number; max?: number; min?: number; linhas?: number },
): Encaixe =>
  o.tamanho !== undefined
    ? { tamanho: o.tamanho, linhas: quebrar(texto, o.largura, o.tamanho, fonte) }
    : encaixar(texto, { largura: o.largura, max: o.max ?? 96, min: o.min ?? 56, linhas: o.linhas ?? 2, fonte });

const Faixa: React.FC<{ p: number; continua: boolean; estilo: React.CSSProperties }> = ({ p, continua, estilo }) =>
  p > 0.01 ? (
    <span
      style={{
        position: "absolute",
        transformOrigin: "left center",
        scale: `${limitar(p)} 1`,
        ...estilo,
        right: continua ? "-0.3em" : estilo.right,
      }}
    />
  ) : null;

// Uma palavra com os enfeites que ela pode ganhar (grifo por trás, sublinhado, risco).
// O espaço entre palavras é margem fixa: nunca depende do caractere de espaço.
const Palavra: React.FC<{
  w: string;
  ultima: boolean;
  revelar: React.CSSProperties;
  grifo: number;
  grifoContinua: boolean;
  sublinhado: number;
  sublinhadoContinua: boolean;
  corSublinhado: string;
  risco: number;
  riscoContinua: boolean;
}> = ({ w, ultima, revelar, grifo, grifoContinua, sublinhado, sublinhadoContinua, corSublinhado, risco, riscoContinua }) => (
  <span style={{ position: "relative", display: "inline-block", marginRight: ultima ? 0 : "0.27em", verticalAlign: "top", whiteSpace: "nowrap" }}>
    <Faixa
      p={grifo}
      continua={grifoContinua}
      estilo={{ left: "-0.1em", right: "-0.1em", top: "0.42em", height: "0.56em", background: cor.grifo, borderRadius: "0.18em 0.32em 0.22em 0.36em", opacity: 0.9 }}
    />
    <Faixa
      p={sublinhado}
      continua={sublinhadoContinua}
      estilo={{ left: "-0.04em", right: "-0.04em", bottom: "0.02em", height: "0.085em", borderRadius: "0.05em", background: corSublinhado, rotate: "-0.6deg" }}
    />
    <span style={{ position: "relative", display: "inline-block", ...revelar }}>{w}</span>
    <Faixa
      p={risco}
      continua={riscoContinua}
      estilo={{ left: "-0.08em", right: "-0.08em", top: "0.56em", height: "0.075em", borderRadius: "0.05em", background: cor.tinta, rotate: "-1.4deg" }}
    />
  </span>
);

// Animação de um trecho: cada palavra do trecho começa um passo depois da anterior
const trechoNoTempo = (indices: Set<number>, em: number | undefined, total: number) => {
  const ordem = [...indices];
  const passo = total / Math.max(1, ordem.length);
  return (i: number, t: number) => {
    const k = ordem.indexOf(i);
    if (k < 0 || em === undefined) return 0;
    return prog(t, em + k * passo, passo + 0.07);
  };
};

const montar = (
  props: Comum,
  encaixe: Encaixe,
  revelar: (p: number) => React.CSSProperties,
  durDe: (w: string) => number,
  alinhar: "left" | "center",
) => {
  const { tempos, t, grifo, grifoEm, sublinhar, sublinharEm, risco, riscoEm, corSublinhado = cor.damasco } = props;
  const palavras = encaixe.linhas.flat();
  const comGrifo = indicesDoTrecho(palavras, grifo);
  const comSub = indicesDoTrecho(palavras, sublinhar);
  const comRisco = indicesDoTrecho(palavras, risco);
  const pG = trechoNoTempo(comGrifo, grifoEm, 0.32);
  const pS = trechoNoTempo(comSub, sublinharEm, 0.4);
  const pR = trechoNoTempo(comRisco, riscoEm, 0.45);
  let i = 0;
  return encaixe.linhas.map((linha, k) => (
    <div key={k} style={{ display: "flex", justifyContent: alinhar === "center" ? "center" : "flex-start", whiteSpace: "nowrap" }}>
      {linha.map((w, j) => {
        const idx = i++;
        const fimDaLinha = j === linha.length - 1;
        const p = prog(t, tempos[idx] ?? 0, durDe(w));
        return (
          <Palavra
            key={`${w}-${idx}`}
            w={w}
            ultima={fimDaLinha}
            revelar={revelar(p)}
            grifo={pG(idx, t)}
            grifoContinua={comGrifo.has(idx) && comGrifo.has(idx + 1) && !fimDaLinha}
            sublinhado={pS(idx, t)}
            sublinhadoContinua={comSub.has(idx) && comSub.has(idx + 1) && !fimDaLinha}
            corSublinhado={corSublinhado}
            risco={pR(idx, t)}
            riscoContinua={comRisco.has(idx) && comRisco.has(idx + 1) && !fimDaLinha}
          />
        );
      })}
    </div>
  ));
};

const encaixeDasProps = (props: Comum, fonte: Fonte) =>
  props.encaixe ??
  encaixeDe(props.texto, fonte, { largura: props.largura ?? 900, tamanho: props.tamanho, max: props.max, min: props.min, linhas: props.linhas });

// Escrita à mão: cada palavra aparece da esquerda para a direita, como a caneta passando.
// Terminada a palavra, ela fica como texto simples (sem a máscara da entrada).
export const Escrita: React.FC<Comum> = (props) => {
  const { peso = 600, alinhar = "left", estilo, linha = 1.08 } = props;
  const encaixe = encaixeDasProps(props, FONTE_MAO(peso));
  return (
    <div style={{ fontFamily: mao, fontWeight: peso, fontSize: encaixe.tamanho, lineHeight: linha, color: props.cor ?? cor.tinta, textAlign: alinhar, ...estilo }}>
      {montar(
        props,
        encaixe,
        (p) =>
          p >= 0.999
            ? {}
            : {
                clipPath: `inset(-40% ${((1 - p) * 124 - 20).toFixed(2)}% -40% -15%)`,
                opacity: p > 0 ? 0.55 + 0.45 * p : 0,
              },
        (w) => Math.min(0.62, Math.max(0.26, w.length * 0.055)),
        alinhar,
      )}
    </div>
  );
};

// Serifada: cada palavra sobe devagar e ganha foco, como quem inspira.
export const Serifa: React.FC<Comum> = (props) => {
  const { peso = 400, alinhar = "left", estilo, italico, linha = 1.12 } = props;
  const encaixe = encaixeDasProps(props, FONTE_SERIF(peso));
  return (
    <div
      style={{
        fontFamily: serif,
        fontWeight: peso,
        fontStyle: italico ? "italic" : "normal",
        fontSize: encaixe.tamanho,
        lineHeight: linha,
        color: props.cor ?? cor.tinta,
        textAlign: alinhar,
        letterSpacing: "-0.005em",
        ...estilo,
      }}
    >
      {montar(
        props,
        encaixe,
        (p) =>
          p >= 0.999
            ? {}
            : {
                opacity: p,
                translate: `0 ${((1 - p) * 0.32).toFixed(3)}em`,
                filter: `blur(${((1 - p) * 7).toFixed(2)}px)`,
              },
        () => 0.55,
        alinhar,
      )}
    </div>
  );
};
