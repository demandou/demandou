// A escrita da página: texto que aparece palavra por palavra na fala (tinta que surge, sem salto),
// a palavra-chave que ACENDE (vira oliva, ganha a luz creme por trás e um fio de luz embaixo), o
// risco de tinta, o texto "a lápis" do que ainda vai ser dito, a capitular, o versalete e o ornamento.
// O texto é medido antes (medida.ts): cabe sempre no lugar, sem depender do navegador.
import { interpolateColors } from "remotion";
import { limitar, prog, respira, semente, suave, tinta } from "../anim";
import { type Encaixe, espacoDe, type Fonte, larguraPalavra, VERSALETE } from "../medida";
import { cor, sans, serif } from "../tema";

// fonte de CSS a partir da Fonte de medida
export const estiloDaFonte = (f: Fonte, tamanho: number): React.CSSProperties => ({
  fontFamily: f.familia === "sans" ? sans : serif,
  fontWeight: f.peso ?? (f.familia === "sans" ? 700 : 400),
  fontStyle: f.italico ? "italic" : "normal",
  fontSize: tamanho,
  letterSpacing: f.espacamento ? `${f.espacamento}em` : f.familia === "sans" ? "-0.01em" : "0",
  fontVariantNumeric: "lining-nums",
});

// métricas da EB Garamond (frações do corpo)
export const ASCENDENTE = 1.007;
export const DESCENDENTE = 0.298;
export const ALTURA_MAIUSCULA = 0.65;
// linha de base de uma linha de altura `L` com corpo `s` (a caixa de conteúdo fica centrada)
export const linhaDeBase = (L: number, s: number) => (L - (ASCENDENTE + DESCENDENTE) * s) / 2 + ASCENDENTE * s;

// A capitular (primeira letra grande, ocupando 2 linhas): corpo e largura
export const capitularDe = (letra: string, s: number, entrelinha: number, f: Fonte) => {
  const L = s * entrelinha;
  const corpo = (L + ALTURA_MAIUSCULA * s) / ALTURA_MAIUSCULA;
  return { corpo, largura: larguraPalavra(letra, corpo, { ...f, peso: 500, italico: false }) + 0.2 * s };
};

export type Luz = { trecho: [number, number]; em: number; cor?: string };

// A luz que acende uma palavra: luz creme por trás (respirando), fio de luz embaixo, palavra oliva.
const LuzDaPalavra: React.FC<{ t: number; em: number; ordem: number; total: number; tamanho: number; continua: boolean }> = ({ t, em, ordem, total, tamanho, continua }) => {
  const p = prog(t, em + ordem * 0.06, 0.6, suave);
  if (p <= 0) return null;
  const r = 1 + 0.05 * respira(t, 3.2, ordem * 0.3);
  const fio = prog(t, em + 0.12 + (ordem / Math.max(1, total)) * 0.35, 0.45, suave);
  return (
    <>
      <span
        style={{
          position: "absolute",
          left: -0.55 * tamanho,
          right: (continua ? -0.45 : -0.55) * tamanho,
          top: -0.12 * tamanho,
          bottom: -0.22 * tamanho,
          borderRadius: tamanho,
          background: "radial-gradient(ellipse 58% 60% at 50% 52%, rgba(255,255,255,0.98) 0%, rgba(255,253,246,0.88) 36%, rgba(255,251,239,0) 74%)",
          opacity: p,
          transform: `scale(${(0.7 + 0.3 * p) * r})`,
          zIndex: -1,
        }}
      />
      <span
        style={{
          position: "absolute",
          left: 0,
          right: continua ? -espacoDe({}) * tamanho : 0,
          bottom: -0.02 * tamanho,
          height: Math.max(2, 0.035 * tamanho),
          borderRadius: 2,
          background: cor.oliva,
          opacity: 0.75,
          transformOrigin: "left center",
          transform: `scaleX(${fio})`,
        }}
      />
    </>
  );
};

// Poeira que sobe de uma palavra quando ela acende (poucos pontos, devagar)
export const PoeiraDaLuz: React.FC<{ t: number; em: number; largura: number; tamanho: number; n?: number; chave?: number }> = ({ t, em, largura, tamanho, n = 7, chave = 1 }) => {
  if (t < em) return null;
  const d = t - em;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const s1 = semente(chave * 31 + i);
        const s2 = semente(chave * 57 + i * 3);
        const vida = 2.2 + s2 * 1.4;
        const fase = (d - s1 * 0.6) / vida;
        if (fase < 0 || fase > 1) return null;
        const x = s1 * largura;
        const y = -fase * tamanho * (1.2 + s2) + tamanho * 0.2;
        const a = Math.sin(fase * Math.PI) * (0.55 + 0.4 * s2);
        const r = 3 + s2 * 4;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: x + Math.sin(fase * 5 + i) * 8 - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              background: `radial-gradient(circle, ${cor.poeira} 0%, rgba(255,253,246,0.6) 45%, rgba(255,253,246,0) 70%)`,
              opacity: a,
            }}
          />
        );
      })}
    </>
  );
};

export const Escrita: React.FC<{
  t: number;
  encaixe: Encaixe;
  tempos: number[];
  x: number;
  y: number;
  largura: number;
  fonte?: Fonte;
  cor?: string;
  alinhar?: "center" | "left";
  entrelinha?: number;
  luz?: Luz | null;
  risco?: { trecho: [number, number]; em: number } | null;
  lapis?: boolean;
  // a primeira letra vira capitular (só com alinhar "left"): a letra tirada do texto
  capitular?: string;
  dur?: number;
  sobe?: number;
}> = ({ t, encaixe, tempos, x, y, largura, fonte = {}, cor: c = cor.tinta, alinhar = "center", entrelinha = 1.2, luz, risco, lapis, capitular, dur = 0.42, sobe = 10 }) => {
  const s = encaixe.tamanho;
  const L = s * entrelinha;
  const esp = espacoDe(fonte) * s;
  const cap = capitular ? capitularDe(capitular, s, entrelinha, fonte) : null;
  const dentro = (tr: [number, number] | null | undefined, k: number) => !!tr && k >= tr[0] && k <= tr[1];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: largura }}>
      {cap && capitular ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: L + linhaDeBase(L, s) - linhaDeBase(cap.corpo, cap.corpo),
            height: cap.corpo,
            lineHeight: `${cap.corpo}px`,
            ...estiloDaFonte({ ...fonte, peso: 500, italico: false }, cap.corpo),
            color: cor.oliva,
            ...(lapis && t < (tempos[0] ?? 0) ? { opacity: 1, color: cor.lapis } : tinta(t, tempos[0] ?? 0, dur * 1.4, sobe)),
          }}
        >
          {capitular}
        </div>
      ) : null}
      {encaixe.linhas.map((linha, i) => (
        <div
          key={i}
          style={{
            height: L,
            lineHeight: `${L}px`,
            display: "flex",
            justifyContent: alinhar === "center" ? "center" : "flex-start",
            paddingLeft: cap && i < 2 ? cap.largura : 0,
            whiteSpace: "nowrap",
          }}
        >
          {linha.map((k, j) => {
            const w = encaixe.palavras[k];
            const em = tempos[k] ?? 0;
            const ultima = j === linha.length - 1;
            const acesa = luz && dentro(luz.trecho, k) ? prog(t, luz.em, 0.6, suave) : 0;
            const corPalavra = acesa > 0 ? interpolateColors(acesa, [0, 1], [c, luz?.cor ?? cor.oliva]) : c;
            const riscada = risco && dentro(risco.trecho, k) ? prog(t, risco.em + (k - risco.trecho[0]) * 0.08, 0.35, suave) : 0;
            const visivel = t >= em;
            // a lápis: a palavra já está lá, clarinha, e a tinta "molha" quando ela é dita
            const estilo: React.CSSProperties = lapis ? {} : visivel ? tinta(t, em, dur, sobe) : { opacity: 0 };
            const corFinal = lapis ? interpolateColors(prog(t, em, dur * 1.2, suave), [0, 1], [cor.lapis, corPalavra]) : corPalavra;
            return (
              <span
                key={k}
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginRight: ultima ? 0 : esp,
                  ...estiloDaFonte(fonte, s),
                  color: lapis ? corFinal : corPalavra,
                  ...estilo,
                  zIndex: 0,
                }}
              >
                {luz && visivel && dentro(luz.trecho, k) ? (
                  <LuzDaPalavra t={t} em={luz.em} ordem={k - luz.trecho[0]} total={luz.trecho[1] - luz.trecho[0] + 1} tamanho={s} continua={k < luz.trecho[1] && !ultima} />
                ) : null}
                {w}
                {riscada > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      left: -0.04 * s,
                      right: k < (risco?.trecho[1] ?? 0) && !ultima ? -esp : -0.04 * s,
                      top: L / 2 - 0.02 * s,
                      height: Math.max(3, 0.06 * s),
                      borderRadius: 3,
                      background: cor.alerta,
                      transformOrigin: "left center",
                      transform: `scaleX(${riscada}) rotate(-1.2deg)`,
                    }}
                  />
                ) : null}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Altura de um texto encaixado
export const alturaDe = (e: Encaixe, entrelinha = 1.2) => e.linhas.length * e.tamanho * entrelinha;

// Versalete: maiúsculas e minúsculas viram capitais (as minúsculas, menores), bem espaçadas.
export const Versalete: React.FC<{ texto: string; tamanho: number; cor?: string; peso?: number; espacamento?: number; estilo?: React.CSSProperties }> = ({
  texto,
  tamanho,
  cor: c = cor.oliva,
  peso = 500,
  espacamento = 0.08,
  estilo,
}) => {
  const partes: { txt: string; menor: boolean }[] = [];
  for (const ch of texto) {
    const menor = ch !== ch.toLocaleUpperCase("pt-BR");
    const ultimo = partes[partes.length - 1];
    if (ultimo && ultimo.menor === menor) ultimo.txt += ch;
    else partes.push({ txt: ch, menor });
  }
  return (
    <span style={{ fontFamily: serif, fontWeight: peso, fontSize: tamanho, letterSpacing: `${espacamento}em`, color: c, whiteSpace: "nowrap", fontVariantNumeric: "lining-nums", ...estilo }}>
      {partes.map((p, i) => (
        <span key={i} style={p.menor ? { fontSize: tamanho * VERSALETE } : undefined}>
          {p.menor ? p.txt.toLocaleUpperCase("pt-BR") : p.txt}
        </span>
      ))}
    </span>
  );
};

// Largura de um versalete (para centrar e caber)
export const larguraVersalete = (texto: string, tamanho: number, peso = 500, espacamento = 0.08) => {
  const ws = texto.trim().split(/\s+/).filter(Boolean);
  return ws.reduce((soma, w) => soma + larguraPalavra(w, tamanho, { versalete: true, peso, espacamento }), 0) + (ws.length - 1) * (0.2 + 2 * espacamento) * tamanho;
};

// O ornamento da página: dois fios que se abrem do centro e um raminho oliva no meio.
export const Ornamento: React.FC<{ t: number; em: number; cx: number; y: number; largura?: number; cor?: string }> = ({ t, em, cx, y, largura = 360, cor: c = cor.oliva }) => {
  const p = prog(t, em, 0.8, suave);
  if (p <= 0) return null;
  const meio = 34;
  const fio = (largura / 2 - meio) * p;
  const folha = limitar((p - 0.15) / 0.6);
  return (
    <svg width={largura} height={40} viewBox={`${-largura / 2} -20 ${largura} 40`} style={{ position: "absolute", left: cx - largura / 2, top: y - 20, overflow: "visible" }}>
      <line x1={-meio} y1={0} x2={-meio - fio} y2={0} stroke={c} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
      <line x1={meio} y1={0} x2={meio + fio} y2={0} stroke={c} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
      <g opacity={folha} transform={`scale(${0.6 + 0.4 * folha})`}>
        <path d="M-4 0 C-10 -12 -24 -12 -30 -2 C-22 6 -10 6 -4 0 Z" fill={c} />
        <path d="M4 0 C10 -12 24 -12 30 -2 C22 6 10 6 4 0 Z" fill={c} />
        <circle cx={0} cy={0} r={4.5} fill={c} />
      </g>
    </svg>
  );
};
