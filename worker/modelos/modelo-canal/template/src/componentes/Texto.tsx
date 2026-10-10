// Texto que se monta na fala (abertura, frase, pergunta, cta): cada palavra entra quando é dita;
// o `destaque` ganha o marcador cobalto por trás, que cresce junto com as palavras; o `risco` é
// riscado em coral quando é dito. Quando a entrada de uma palavra termina, ela fica como texto
// simples (uma camada só, sem máscara nem deslocamento).
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
  o: { largura: number; max: number; min: number; linhas: number; peso?: Peso; alinhar?: "centro" | "esq"; fala: Palavra[]; de: number; ate: number; destaque?: string; risco?: string; espacamento?: number },
): TextoDisposto => {
  const peso = o.peso ?? 700;
  const espacamento = o.espacamento ?? 0;
  // mede um pouco mais estreito: o espaço entre palavras na tela é mais largo que o da fonte
  const fit = encaixar(texto, { largura: o.largura * 0.95, max: o.max, min: o.min, linhas: o.linhas, fonte: { peso, espacamento } });
  const lh = Math.round(fit.tamanho * 1.18);
  const exata = { peso, exato: true, espacamento };
  const espaco = Math.max(larguraTexto(" ", fit.tamanho, exata), fit.tamanho * 0.28);
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
const faixas = (d: TextoDisposto, [a, b]: [number, number]) => {
  const out: { linha: number; x: number; w: number; primeiro: number }[] = [];
  for (let i = a; i <= b; i++) {
    const p = d.palavras[i];
    const f = out.find((o) => o.linha === p.linha);
    if (f) f.w = p.x + p.largura - f.x;
    else out.push({ linha: p.linha, x: p.x, w: p.largura, primeiro: i });
  }
  return out;
};

export const TextoFalado: React.FC<{
  d: TextoDisposto;
  x: number;
  y: number;
  t: number;
  // "video": com sombra, direto sobre o vídeo; "painel": sobre o vidro
  sobre: "video" | "painel";
  peso?: Peso;
  riscoEm?: number;
}> = ({ d, x, y, t, sobre, peso = 700, riscoEm }) => {
  const traco = Math.max(5, Math.round(d.tamanho * 0.08));
  const marca = d.destaque ? faixas(d, d.destaque) : [];
  const riscos = d.risco ? faixas(d, d.risco) : [];
  const quandoRisco = riscoEm ?? (d.risco ? d.palavras[d.risco[1]].em + 0.15 : 0);
  const pr = d.risco ? prog(t, quandoRisco, 0.3) : 0;
  const dentro = (i: number, r: [number, number] | null) => !!r && i >= r[0] && i <= r[1];
  // o marcador cobalto do destaque cresce por trás das palavras, junto com a fala
  const marcadores = marca.map((f, i) => {
    const ditas = d.palavras.slice(f.primeiro, d.destaque ? d.destaque[1] + 1 : 0).filter((q) => q.linha === f.linha && t >= q.em - 0.03);
    if (!ditas.length) return null;
    const ultima = ditas[ditas.length - 1];
    const p = prog(t, ultima.em - 0.03, 0.22);
    const anterior = ditas.length > 1 ? ditas[ditas.length - 2] : null;
    const fimAntes = anterior ? anterior.x + anterior.largura : f.x;
    const fimAgora = ultima.x + ultima.largura;
    const folga = Math.round(d.tamanho * 0.14);
    const largura = fimAntes - f.x + (fimAgora - fimAntes) * p + folga * 2 * (anterior ? 1 : p);
    return (
      <div
        key={`m${i}`}
        style={{
          position: "absolute",
          left: f.x - folga,
          top: f.linha * d.lh + d.lh * 0.1,
          width: largura,
          height: d.lh * 0.84,
          borderRadius: Math.round(d.tamanho * 0.12),
          background: COR.cobalto,
        }}
      />
    );
  });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: d.largura, height: d.altura }}>
      {marcadores}
      {d.palavras.map((p, i) => {
        const e = prog(t, p.em - 0.03, 0.16);
        if (e <= 0) return null;
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
              fontFamily: FONTE,
              fontWeight: peso,
              fontSize: d.tamanho,
              letterSpacing: d.espacamento ? `${d.espacamento}em` : undefined,
              whiteSpace: "nowrap",
              color: COR.giz,
              opacity: (pronta ? 1 : e) * (riscada ? 1 - 0.5 * pr : 1),
              transform: pronta ? undefined : `translateY(${(1 - e) * 10}px)`,
              textShadow: sobre === "video" ? "0 2px 12px rgba(0,0,0,0.55)" : "none",
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
            background: COR.coral,
          }}
        />
      ))}
    </div>
  );
};
