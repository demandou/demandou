// Texto que se monta na fala (abertura, frase, pergunta, cta, títulos): cada palavra entra quando
// é dita; o `destaque` ganha o sublinhado azul que se desenha junto com as palavras; o `risco` é
// riscado quando é dito. Quando a entrada de uma palavra termina, ela fica como texto simples
// (uma camada só, sem máscara).
import { encaixar, larguraTexto, temposDasPalavras, trechoNoTexto, type Peso } from "../medida";
import type { Palavra } from "../plano";
import { COR, FONTE, SOMBRA_TEXTO, prog } from "../tema";

export type TextoDisposto = {
  tamanho: number;
  lh: number;
  altura: number;
  largura: number;
  palavras: { w: string; x: number; linha: number; largura: number; em: number }[];
  destaque: [number, number] | null;
  risco: [number, number] | null;
};

export const disporTexto = (
  texto: string,
  o: { largura: number; max: number; min: number; linhas: number; peso?: Peso; alinhar?: "centro" | "esq"; fala: Palavra[]; de: number; ate: number; destaque?: string; risco?: string },
): TextoDisposto => {
  const peso = o.peso ?? 800;
  // mede um pouco mais estreito: o espaço entre palavras na tela é mais largo que o da fonte
  const fit = encaixar(texto, { largura: o.largura * 0.94, max: o.max, min: o.min, linhas: o.linhas, fonte: { peso } });
  const lh = Math.round(fit.tamanho * 1.2);
  const exata = { peso, exato: true };
  const espaco = Math.max(larguraTexto(" ", fit.tamanho, exata), fit.tamanho * 0.28);
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
    palavras,
    destaque: trechoNoTexto(junto, o.destaque),
    risco: trechoNoTexto(junto, o.risco),
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
  // "video": com sombra, direto sobre a pessoa; "painel": sobre o fundo escuro do Palco
  sobre: "video" | "painel";
  peso?: Peso;
  riscoEm?: number;
  cor?: string;
}> = ({ d, x, y, t, sobre, peso = 800, riscoEm, cor = COR.texto }) => {
  const sub = d.destaque ? faixas(d, d.destaque) : [];
  const riscos = d.risco ? faixas(d, d.risco) : [];
  const quandoRisco = riscoEm ?? (d.risco ? d.palavras[d.risco[1]].em + 0.15 : 0);
  const pr = d.risco ? prog(t, quandoRisco, 0.3) : 0;
  const dentro = (i: number, r: [number, number] | null) => !!r && i >= r[0] && i <= r[1];
  const espessura = Math.max(6, Math.round(d.tamanho * 0.11));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: d.largura, height: d.altura }}>
      {sub.map((f, i) => {
        // o sublinhado se desenha junto com as palavras do trecho que já foram ditas
        const ditas = d.palavras.slice(f.primeiro, d.destaque ? d.destaque[1] + 1 : 0).filter((q) => q.linha === f.linha && t >= q.em - 0.03);
        if (!ditas.length) return null;
        const ultima = ditas[ditas.length - 1];
        const p = prog(t, ultima.em - 0.03, 0.22);
        const anterior = ditas.length > 1 ? ditas[ditas.length - 2] : null;
        const fimAntes = anterior ? anterior.x + anterior.largura : f.x;
        const fimAgora = ultima.x + ultima.largura;
        const largura = fimAntes - f.x + (fimAgora - fimAntes) * p;
        return (
          <div
            key={`s${i}`}
            style={{
              position: "absolute",
              left: f.x,
              top: f.linha * d.lh + d.lh * 0.9 - espessura / 2,
              width: largura,
              height: espessura,
              borderRadius: espessura / 2,
              background: COR.azul,
              boxShadow: sobre === "video" ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
            }}
          />
        );
      })}
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
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              color: cor,
              opacity: (pronta ? 1 : e) * (riscada ? 1 - 0.55 * pr : 1),
              transform: pronta ? undefined : `translateY(${(1 - e) * 10}px)`,
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
            top: f.linha * d.lh + d.lh * 0.52,
            width: (f.w + 8) * pr,
            height: Math.max(4, Math.round(d.tamanho * 0.08)),
            borderRadius: 4,
            background: COR.azul,
          }}
        />
      ))}
    </div>
  );
};
