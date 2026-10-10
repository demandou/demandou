// Texto que se monta na fala (abertura, frase, pergunta, cta, letreiro): cada palavra entra quando
// é dita, subindo de leve; o `destaque` ganha a cor vermelhão; o `risco` é riscado quando é dito.
// Quando a entrada de uma palavra termina, ela fica como texto simples (uma camada só, sem máscara).
import { encaixar, larguraTexto, temposDasPalavras, trechoNoTexto, type Fonte } from "../medida";
import type { Palavra } from "../plano";
import { COR, FONTE, SERIFA, SOMBRA_TEXTO, prog } from "../tema";

export type TextoDisposto = {
  tamanho: number;
  lh: number;
  altura: number;
  largura: number;
  fonte: Fonte;
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
    fonte?: Fonte;
    alinhar?: "centro" | "esq";
    entrelinha?: number;
    fala: Palavra[];
    de: number;
    ate: number;
    destaque?: string;
    risco?: string;
  },
): TextoDisposto => {
  const fonte: Fonte = { serifa: true, peso: 600, ...o.fonte };
  // mede um pouco mais estreito: o espaço entre palavras na tela é mais largo que o da fonte
  const fit = encaixar(texto, { largura: o.largura * 0.95, max: o.max, min: o.min, linhas: o.linhas, fonte });
  const lh = Math.round(fit.tamanho * (o.entrelinha ?? 1.16));
  const exata = { ...fonte, exato: true };
  const espaco = Math.max(larguraTexto(" ", fit.tamanho, exata), fit.tamanho * 0.27);
  const tempos = temposDasPalavras(fit.linhas.join(" "), o.fala, o.de, o.ate);
  const palavras: TextoDisposto["palavras"] = [];
  let k = 0;
  let maior = 0;
  fit.linhas.forEach((linha, li) => {
    const ws = linha.split(" ");
    const total = ws.reduce((a, w) => a + larguraTexto(w, fit.tamanho, exata), 0) + espaco * (ws.length - 1);
    maior = Math.max(maior, total);
    let x = o.alinhar === "esq" ? 0 : (o.largura - total) / 2;
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
    largura: o.alinhar === "esq" ? maior : o.largura,
    fonte,
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
  // "video": com sombra (sobre a pessoa ou a imagem); "prancha": sem sombra, sobre a noite
  sobre?: "video" | "prancha";
  cor?: string;
  riscoEm?: number;
  // todas as palavras já entram juntas neste instante (sem montar na fala)
  todasEm?: number;
}> = ({ d, x, y, t, sobre = "video", cor = COR.marfim, riscoEm, todasEm }) => {
  const riscos = d.risco ? faixas(d, d.risco) : [];
  const quandoRisco = riscoEm ?? (d.risco ? d.palavras[d.risco[1]].em + 0.15 : 0);
  const pr = d.risco ? prog(t, quandoRisco, 0.32) : 0;
  const dentro = (i: number, r: [number, number] | null) => !!r && i >= r[0] && i <= r[1];
  const familia = d.fonte.serifa ? SERIFA : FONTE;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: d.largura, height: d.altura }}>
      {d.palavras.map((p, i) => {
        const quando = todasEm ?? p.em;
        const e = prog(t, quando - 0.03, 0.22);
        if (e <= 0) return null;
        const naMarca = dentro(i, d.destaque);
        const riscada = dentro(i, d.risco) && pr > 0;
        const pronta = e >= 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.linha * d.lh,
              height: d.lh,
              lineHeight: `${d.lh}px`,
              fontFamily: familia,
              fontWeight: d.fonte.peso ?? 600,
              fontStyle: d.fonte.italico ? "italic" : "normal",
              fontSize: d.tamanho,
              whiteSpace: "nowrap",
              color: naMarca ? COR.vermelhao : cor,
              opacity: (pronta ? 1 : e) * (riscada ? 1 - 0.5 * pr : 1),
              transform: pronta ? undefined : `translateY(${(1 - e) * 12}px)`,
              textShadow: sobre === "video" ? SOMBRA_TEXTO : "none",
            }}
          >
            {p.w}
          </div>
        );
      })}
      {riscos.map((f, i) => (
        <div
          key={`r${i}`}
          style={{
            position: "absolute",
            left: f.x - 4,
            top: f.linha * d.lh + d.lh * 0.55,
            width: (f.w + 8) * pr,
            height: Math.max(4, Math.round(d.tamanho * 0.07)),
            borderRadius: 3,
            background: COR.vermelhao,
          }}
        />
      ))}
    </div>
  );
};
