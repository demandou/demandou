// Texto que se monta na fala, no palco (abertura, capitulo, frase, pergunta, cta): cada palavra
// sobe de trás de uma linha invisível quando é dita; o `destaque` fica azul-laranja; o `risco` é
// riscado quando é dito. Quando a entrada de uma palavra termina, ela fica como texto simples
// (uma camada só, sem máscara nem deslocamento).
import { encaixar, larguraTexto, temposDasPalavras, trechoNoTexto, type Peso } from "../medida";
import type { Palavra } from "../plano";
import { COR, FONTE, prog } from "../tema";

// espaçamento entre letras dos títulos (em): nunca mais apertado que -0,02
export const APERTO = -0.015;

export type TextoDisposto = {
  tamanho: number;
  lh: number;
  altura: number;
  largura: number;
  peso: Peso;
  palavras: { w: string; x: number; linha: number; largura: number; em: number }[];
  destaque: [number, number] | null;
  risco: [number, number] | null;
};

export const disporTexto = (
  texto: string,
  o: {
    largura: number;
    max: number;
    min: number;
    linhas: number;
    peso?: Peso;
    alinhar?: "centro" | "esq";
    fala: Palavra[];
    de: number;
    ate: number;
    destaque?: string;
    risco?: string;
    entrelinha?: number;
  },
): TextoDisposto => {
  const peso = o.peso ?? 800;
  const fonte = { peso, espacamento: APERTO };
  const fit = encaixar(texto, { largura: o.largura * 0.96, max: o.max, min: o.min, linhas: o.linhas, fonte });
  const lh = Math.round(fit.tamanho * (o.entrelinha ?? 1.12));
  const exata = { ...fonte, exato: true };
  const espaco = Math.max(larguraTexto(" ", fit.tamanho, exata), fit.tamanho * 0.26);
  const tempos = temposDasPalavras(fit.linhas.join(" "), o.fala, o.de, o.ate);
  const palavras: TextoDisposto["palavras"] = [];
  let k = 0;
  let maior = 0;
  fit.linhas.forEach((linha, li) => {
    const ws = linha.split(" ");
    const total = ws.reduce((a, w) => a + larguraTexto(w, fit.tamanho, exata), 0) + espaco * (ws.length - 1);
    maior = Math.max(maior, total);
    let x = o.alinhar === "centro" ? (o.largura - total) / 2 : 0;
    for (const w of ws) {
      const lw = larguraTexto(w, fit.tamanho, exata);
      palavras.push({ w, x, linha: li, largura: lw, em: tempos[k] ?? o.de });
      x += lw + espaco;
      k++;
    }
  });
  const junto = fit.linhas.join(" ");
  return {
    tamanho: fit.tamanho,
    lh,
    altura: lh * fit.linhas.length,
    largura: o.alinhar === "centro" ? o.largura : maior,
    peso,
    palavras,
    destaque: trechoNoTexto(junto, o.destaque),
    risco: trechoNoTexto(junto, o.risco),
  };
};

// faixas contínuas (por linha) de um trecho de palavras
const faixas = (d: TextoDisposto, [a, b]: [number, number]) => {
  const out: { linha: number; x: number; w: number }[] = [];
  for (let i = a; i <= b; i++) {
    const p = d.palavras[i];
    const f = out.find((o) => o.linha === p.linha);
    if (f) f.w = p.x + p.largura - f.x;
    else out.push({ linha: p.linha, x: p.x, w: p.largura });
  }
  return out;
};

export const TextoFalado: React.FC<{
  d: TextoDisposto;
  x: number;
  y: number;
  t: number;
  cor?: string;
  corDestaque?: string;
  riscoEm?: number;
  // true: todas as palavras já aparecem (sem esperar a fala)
  pronto?: boolean;
}> = ({ d, x, y, t, cor = COR.osso, corDestaque = COR.laranja, riscoEm, pronto }) => {
  const riscos = d.risco ? faixas(d, d.risco) : [];
  const quandoRisco = riscoEm ?? (d.risco ? d.palavras[d.risco[1]].em + 0.15 : 0);
  const pr = d.risco ? prog(t, quandoRisco, 0.3) : 0;
  const dentro = (i: number, r: [number, number] | null) => !!r && i >= r[0] && i <= r[1];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: d.largura, height: d.altura }}>
      {d.palavras.map((p, i) => {
        const e = pronto ? 1 : prog(t, p.em - 0.04, 0.22);
        if (e <= 0) return null;
        const riscada = dentro(i, d.risco) && pr > 0;
        const estilo: React.CSSProperties = {
          fontFamily: FONTE,
          fontWeight: d.peso,
          fontSize: d.tamanho,
          letterSpacing: `${APERTO}em`,
          whiteSpace: "nowrap",
          lineHeight: `${d.lh}px`,
          color: dentro(i, d.destaque) ? corDestaque : cor,
          opacity: riscada ? 1 - 0.5 * pr : 1,
        };
        if (e >= 1) {
          return (
            <div key={i} style={{ position: "absolute", left: p.x, top: p.linha * d.lh, height: d.lh, ...estilo }}>
              {p.w}
            </div>
          );
        }
        // entrada: a palavra sobe de trás da linha de base (máscara só durante a entrada)
        return (
          <div key={i} style={{ position: "absolute", left: p.x - 4, top: p.linha * d.lh, height: d.lh, width: p.largura + 8, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 4, top: 0, transform: `translateY(${(1 - e) * d.lh * 0.7}px)`, ...estilo }}>{p.w}</div>
          </div>
        );
      })}
      {riscos.map((f, i) => (
        <div
          key={`r${i}`}
          style={{
            position: "absolute",
            left: f.x - 4,
            top: f.linha * d.lh + d.lh * 0.53,
            width: (f.w + 8) * pr,
            height: Math.max(4, Math.round(d.tamanho * 0.075)),
            borderRadius: 3,
            background: COR.laranja,
          }}
        />
      ))}
    </div>
  );
};
