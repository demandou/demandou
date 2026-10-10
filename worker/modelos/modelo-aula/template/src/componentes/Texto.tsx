// Texto que se monta na fala (títulos, frases, chamadas): cada palavra entra quando é dita; o
// `destaque` ganha o marca-texto violeta por trás, que cresce junto com as palavras (como uma
// caneta passando); o `risco` é riscado quando é dito. Quando a entrada de uma palavra termina, ela
// fica como texto simples (uma camada só, sem máscara nem deslocamento).
import { encaixar, larguraTexto, temposDasPalavras, trechoNoTexto, type Peso } from "../medida";
import type { Palavra } from "../plano";
import { COR, FONTE, prog } from "../tema";

export type TextoDisposto = {
  tamanho: number;
  lh: number;
  altura: number;
  largura: number;
  palavras: { w: string; x: number; linha: number; largura: number; em: number }[];
  destaque: [number, number] | null;
  risco: [number, number] | null;
  espacamento: number;
};

export const disporTexto = (
  texto: string,
  o: { largura: number; max: number; min: number; linhas: number; peso?: Peso; alinhar?: "centro" | "esq"; fala: Palavra[]; de: number; ate: number; destaque?: string; risco?: string; espacamento?: number; entrelinha?: number },
): TextoDisposto => {
  const peso = o.peso ?? 800;
  const espacamento = o.espacamento ?? 0;
  // mede um pouco mais estreito: o espaço entre palavras na tela é mais largo que o da fonte
  const fit = encaixar(texto, { largura: o.largura * 0.95, max: o.max, min: o.min, linhas: o.linhas, fonte: { peso, espacamento } });
  const lh = Math.round(fit.tamanho * (o.entrelinha ?? 1.16));
  const exata = { peso, exato: true, espacamento };
  const espaco = Math.max(larguraTexto(" ", fit.tamanho, exata), fit.tamanho * 0.27);
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
    palavras,
    destaque: trechoNoTexto(junto, o.destaque),
    risco: trechoNoTexto(junto, o.risco),
    espacamento,
  };
};

// faixas contínuas (por linha) de um trecho de palavras
export const faixas = (d: TextoDisposto, [a, b]: [number, number]) => {
  const out: { linha: number; x: number; w: number; primeiro: number; ultimo: number }[] = [];
  for (let i = a; i <= b; i++) {
    const p = d.palavras[i];
    const f = out.find((o) => o.linha === p.linha);
    if (f) {
      f.w = p.x + p.largura - f.x;
      f.ultimo = i;
    } else out.push({ linha: p.linha, x: p.x, w: p.largura, primeiro: i, ultimo: i });
  }
  return out;
};

export const TextoFalado: React.FC<{
  d: TextoDisposto;
  x: number;
  y: number;
  t: number;
  peso?: Peso;
  cor?: string;
  riscoEm?: number;
  // instante em que o marca-texto do destaque passa (padrão: junto com as palavras)
  marcaEm?: number;
  // termos que acendem de novo (marca-texto) quando são ditos depois
  acender?: { texto: string; em: number }[];
}> = ({ d, x, y, t, peso = 800, cor = COR.tinta, riscoEm, marcaEm, acender }) => {
  const traco = Math.max(5, Math.round(d.tamanho * 0.08));
  const marca = d.destaque ? faixas(d, d.destaque) : [];
  const riscos = d.risco ? faixas(d, d.risco) : [];
  const quandoRisco = riscoEm ?? (d.risco ? d.palavras[d.risco[1]].em + 0.15 : 0);
  const pr = d.risco ? prog(t, quandoRisco, 0.3) : 0;
  const dentro = (i: number, r: [number, number] | null) => !!r && i >= r[0] && i <= r[1];
  // o marca-texto passa por trás do destaque, da esquerda para a direita, palavra por palavra
  const folga = Math.round(d.tamanho * 0.12);
  const marcadores = marca.map((f, i) => {
    const inicio = marcaEm ?? d.palavras[f.primeiro].em;
    const fim = marcaEm !== undefined ? marcaEm + 0.35 : d.palavras[f.ultimo].em + 0.25;
    const p = prog(t, inicio, Math.max(0.2, fim - inicio));
    if (p <= 0) return null;
    return (
      <div
        key={`m${i}`}
        style={{
          position: "absolute",
          left: f.x - folga,
          top: f.linha * d.lh + d.lh * 0.5,
          width: (f.w + folga * 2) * p,
          height: d.lh * 0.42,
          borderRadius: Math.round(d.tamanho * 0.08),
          background: COR.marcaTexto,
        }}
      />
    );
  });
  const junto = d.palavras.map((p) => p.w).join(" ");
  const acesos = (acender ?? []).flatMap((a, k) => {
    const tr = trechoNoTexto(junto, a.texto);
    if (!tr) return [];
    const p = prog(t, a.em - 0.03, 0.4);
    if (p <= 0) return [];
    return faixas(d, tr).map((f, i) => (
      <div
        key={`a${k}-${i}`}
        style={{ position: "absolute", left: f.x - folga, top: f.linha * d.lh + d.lh * 0.5, width: (f.w + folga * 2) * p, height: d.lh * 0.42, borderRadius: Math.round(d.tamanho * 0.08), background: COR.marcaTexto }}
      />
    ));
  });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: d.largura, height: d.altura }}>
      {marcadores}
      {acesos}
      {d.palavras.map((p, i) => {
        const e = prog(t, p.em - 0.03, 0.18);
        if (e <= 0) return null;
        const riscada = dentro(i, d.risco) && pr > 0;
        const noDestaque = dentro(i, d.destaque);
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
              fontFamily: FONTE,
              fontWeight: peso,
              fontSize: d.tamanho,
              letterSpacing: d.espacamento ? `${d.espacamento}em` : undefined,
              whiteSpace: "nowrap",
              color: noDestaque ? COR.violetaEscuro : riscada ? COR.apoio : cor,
              opacity: pronta ? 1 : e,
              transform: pronta ? undefined : `translateY(${(1 - e) * 10}px)`,
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
            top: f.linha * d.lh + d.lh * 0.52,
            width: (f.w + 8) * pr,
            height: traco,
            borderRadius: traco / 2,
            background: COR.alerta,
          }}
        />
      ))}
    </div>
  );
};
