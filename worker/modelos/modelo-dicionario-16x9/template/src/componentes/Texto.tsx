// Peças de texto comuns aos blocos: linhas medidas que se imprimem palavra por palavra na fala,
// o grifo (marca-texto ameixa) e o risco ameixa. Cada palavra entra no instante em que é dita;
// antes disso, fica como um traço a lápis do tamanho dela (o lugar nunca fica vazio).
import { normalizar, prog } from "../anim";
import { type Fonte, larguraTexto } from "../medida";
import { cor, sans, serif } from "../tema";

export const familiaCss = (f: Fonte): React.CSSProperties => ({
  fontFamily: f.familia === "sans" ? sans : serif,
  fontStyle: f.familia === "italico" ? "italic" : "normal",
  fontWeight: f.peso ?? 400,
  ...(f.caixaAlta ? { textTransform: "uppercase" as const } : {}),
  ...(f.espacamento ? { letterSpacing: `${f.espacamento}em` } : {}),
});

// As palavras de um texto, sem as marcas de quebra (" / ")
export const palavrasDoTexto = (texto: string) => texto.split(/\s+/).filter((w) => w && w !== "/");

// Índices das palavras de `texto` que formam o trecho exato `trecho` (primeira ocorrência)
export const indicesDoTrecho = (palavras: string[], trecho?: string) => {
  const alvo = trecho ? palavrasDoTexto(trecho).map(normalizar) : [];
  const achadas = new Set<number>();
  if (!alvo.length) return achadas;
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((a, k) => normalizar(palavras[i + k]) === a)) {
      alvo.forEach((_, k) => achadas.add(i + k));
      break;
    }
  }
  return achadas;
};

// Risco ameixa que se desenha da esquerda para a direita por cima de uma palavra (p de 0 a 1)
export const TracoDeRisco: React.FC<{ p: number }> = ({ p }) =>
  p > 0 ? (
    <span
      style={{
        position: "absolute",
        left: "-3%",
        top: "52%",
        width: `${106 * p}%`,
        height: "0.085em",
        minHeight: 6,
        borderRadius: 6,
        background: cor.ameixa,
        transform: "rotate(-2.5deg)",
        transformOrigin: "0% 50%",
      }}
    />
  ) : null;

export type LinhasProps = {
  // as linhas já quebradas (encaixar) — as palavras delas, na ordem, são as do texto
  linhas: string[];
  corpo: number;
  entrelinha?: number;
  fonte: Fonte;
  // instante de cada palavra (uma por palavra, na ordem); sem tempos, tudo já impresso
  tempos?: number[];
  t: number;
  cor?: string;
  alinhar?: "left" | "center" | "right";
  // índices das palavras com outro estilo (destaque)
  marcadas?: Set<number>;
  estiloMarcadas?: React.CSSProperties;
  // índices das palavras riscadas, e quando o risco começa
  riscadas?: Set<number>;
  riscoEm?: number;
  // marca-texto por baixo das linhas: começa em `em`, some a partir de `ate` (opcional)
  grifo?: { em: number; ate?: number; cor?: string };
  // antes de ser dita, a palavra é um traço a lápis do tamanho dela (padrão) ou nada
  esboco?: "barra" | "nada";
};

// Linhas medidas que se imprimem palavra por palavra. A altura total é linhas × corpo × entrelinha.
export const LinhasFaladas: React.FC<LinhasProps> = ({
  linhas,
  corpo,
  entrelinha = 1.12,
  fonte,
  tempos,
  t,
  cor: corTexto = cor.tinta,
  alinhar = "left",
  marcadas,
  estiloMarcadas,
  riscadas,
  riscoEm,
  grifo,
  esboco = "barra",
}) => {
  const espaco = larguraTexto(" ", corpo, fonte) / 1.03;
  const alturaLinha = corpo * entrelinha;
  const nRisco = riscadas?.size ?? 0;
  const ordemRisco = riscadas ? [...riscadas].sort((a, b) => a - b) : [];
  const pRisco = riscoEm === undefined ? 0 : prog(t, riscoEm, 0.18 + 0.12 * nRisco);
  const pGrifo = grifo ? prog(t, grifo.em, 0.4) * (grifo.ate === undefined ? 1 : 1 - prog(t, grifo.ate, 0.3)) : 0;
  let k = 0;
  return (
    <div style={{ ...familiaCss(fonte), fontSize: corpo, lineHeight: `${alturaLinha}px`, color: corTexto }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(" ").filter(Boolean);
        const larguraLinha = larguraTexto(linha, corpo, fonte) / 1.03;
        const inicio = k;
        k += ws.length;
        return (
          <div
            key={li}
            style={{
              position: "relative",
              height: alturaLinha,
              display: "flex",
              justifyContent: alinhar === "center" ? "center" : alinhar === "right" ? "flex-end" : "flex-start",
              whiteSpace: "nowrap",
            }}
          >
            {pGrifo > 0 ? (
              <div
                style={{
                  position: "absolute",
                  top: alturaLinha * 0.5 - corpo * 0.06,
                  height: corpo * 0.42,
                  left: alinhar === "center" ? `calc(50% - ${larguraLinha / 2 + corpo * 0.06}px)` : alinhar === "right" ? undefined : -corpo * 0.06,
                  right: alinhar === "right" ? -corpo * 0.06 : undefined,
                  width: (larguraLinha + corpo * 0.12) * pGrifo,
                  background: grifo?.cor ?? cor.ameixaVeu,
                  borderRadius: 4,
                }}
              />
            ) : null}
            {ws.map((w, j) => {
              const i = inicio + j;
              const em = tempos?.[i] ?? -1;
              const p = tempos ? prog(t, em - 0.02, 0.22) : 1;
              const estilo: React.CSSProperties = {
                position: "relative",
                display: "inline-block",
                marginRight: j < ws.length - 1 ? espaco : 0,
                ...(marcadas?.has(i) ? estiloMarcadas : {}),
              };
              const r = riscadas?.has(i) ? Math.min(1, Math.max(0, pRisco * nRisco - ordemRisco.indexOf(i))) : 0;
              if (p >= 1)
                return (
                  <span key={j} style={estilo}>
                    {w}
                    <TracoDeRisco p={r} />
                  </span>
                );
              return (
                <span key={j} style={estilo}>
                  {esboco === "barra" ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: alturaLinha * 0.5 - corpo * 0.02,
                        height: Math.max(8, corpo * 0.16),
                        borderRadius: 6,
                        background: cor.lapis,
                        opacity: 0.5 * (1 - p),
                      }}
                    />
                  ) : null}
                  <span style={{ display: "inline-block", opacity: p, translate: `0 ${(1 - p) * 12}px` }}>{w}</span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Rótulo pequeno em caixa-alta espaçada (letreiro de seção do dicionário)
export const Letreiro: React.FC<{ texto: string; cor?: string; corpo?: number; style?: React.CSSProperties }> = ({
  texto,
  cor: c = cor.cinza,
  corpo = 32,
  style,
}) => (
  <div style={{ fontFamily: sans, fontWeight: 700, fontSize: corpo, letterSpacing: "0.15em", textTransform: "uppercase", lineHeight: 1.1, color: c, ...style }}>
    {texto}
  </div>
);

// Etiqueta "ILUSTRATIVO" (sem números ditos): contorno fino, caixa-alta espaçada
export const Ilustrativo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: sans,
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      lineHeight: 1,
      color: cor.cinza,
      border: `2.5px solid ${cor.cinza}`,
      borderRadius: 8,
      padding: "8px 12px 6px",
      ...style,
    }}
  >
    Ilustrativo
  </span>
);

// Lugar a lápis: um traço tracejado do tamanho do que ainda vai ser dito
export const LinhaALapis: React.FC<{ largura: number; corpo: number; opacidade?: number }> = ({ largura, corpo, opacidade = 1 }) => (
  <div style={{ height: corpo * 1.12, display: "flex", alignItems: "flex-end", opacity: opacidade }}>
    <div style={{ width: largura, borderBottom: `4px dashed ${cor.lapis}`, marginBottom: corpo * 0.22 }} />
  </div>
);

export { serif };
