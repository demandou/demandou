import { pena, prog, Tinta } from "../anim";
import { type Encaixe, type Pedaco } from "../medida";

// Texto medido (ver medida.ts) desenhado linha a linha: cada palavra ganha tinta no seu instante,
// como a pena no papel. Com `esboco`, o texto já está escrito a lápis antes. A margem entre palavras
// é fixa (nunca o espaço dentro de um span animado). `risco` passa um traço de tinta vermelha sobre
// um trecho, palavra a palavra, quando ele é dito.
export const TextoEscrito: React.FC<{
  ps: Pedaco[];
  enc: Encaixe;
  tempos: number[];
  t: number;
  cor: string;
  corDe?: (i: number) => string | undefined;
  esboco?: string;
  dur?: number;
  gap?: number;
  alinhar?: "center" | "flex-start";
  risco?: { indices: Set<number>; p: number; cor: string };
  style?: React.CSSProperties;
}> = ({ ps, enc, tempos, t, cor, corDe, esboco, dur = 0.34, gap = 0.26, alinhar = "center", risco, style }) => {
  const riscadas = risco ? [...risco.indices].sort((a, b) => a - b) : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "center" ? "center" : "flex-start", ...style }}>
      {enc.linhas.map((linha, li) => (
        <div key={li} style={{ display: "flex", alignItems: "baseline", justifyContent: alinhar, columnGap: gap * enc.tamanho, whiteSpace: "nowrap" }}>
          {linha.map((i, pos) => {
            const p = ps[i];
            const corpo = enc.tamanho * (p.e.escala ?? 1);
            const estilo: React.CSSProperties = {
              fontFamily: p.e.familia,
              fontWeight: p.e.peso,
              fontStyle: p.e.italico ? "italic" : "normal",
              fontSize: corpo,
              lineHeight: p.e.entrelinha ?? 1.15,
              letterSpacing: p.e.espacamento ? `${p.e.espacamento}em` : undefined,
              color: corDe?.(i) ?? cor,
            };
            const palavra = p.e.caixaAlta ? p.w.toUpperCase() : p.w;
            const escrita = (
              <Tinta p={prog(t, tempos[i] ?? 0, dur, pena)} esboco={esboco} style={estilo}>
                {palavra}
              </Tinta>
            );
            const k = riscadas.indexOf(i);
            if (!risco || k < 0) return <span key={`${p.w}-${i}`}>{escrita}</span>;
            const K = riscadas.length;
            const pr = prog(risco.p, k / K, 1 / K, (x) => x);
            // o traço passa por cima do vão até a próxima palavra riscada da mesma linha
            const proxima = linha[pos + 1];
            const continua = proxima !== undefined && risco.indices.has(proxima);
            return (
              <span key={`${p.w}-${i}`} style={{ position: "relative", display: "inline-block" }}>
                {escrita}
                {pr > 0.001 ? (
                  <span
                    style={{
                      position: "absolute",
                      left: -corpo * 0.05,
                      right: continua ? -gap * enc.tamanho : -corpo * 0.05,
                      top: "54%",
                      height: Math.max(4, corpo * 0.075),
                      borderRadius: 3,
                      background: risco.cor,
                      transform: pr < 0.999 ? `scaleX(${pr})` : undefined,
                      transformOrigin: "left center",
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
