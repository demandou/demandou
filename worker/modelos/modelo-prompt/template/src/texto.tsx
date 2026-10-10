// Texto falado em linhas já medidas (medida.ts → encaixar): cada palavra entra no seu tempo.
// Três jeitos de entrar, todos do estilo Prompt:
// - "digita": as letras entram uma a uma (≈0,03 s por letra), com cursor — a voz de quem escreve;
// - "foco": a palavra chega borrada e cinza e entra em foco — a voz do assistente;
// - "sobe": a palavra sobe de leve e assenta — títulos.
// Terminada a animação de uma palavra, ela é desenhada como texto simples (sem filtro nem deslocamento).
import { Cursor, prog } from "./anim";
import { PARTE, partida, VAO } from "./medida";
import { cor } from "./tema";

export type Modo = "digita" | "foco" | "sobe";

export const TextoFalado: React.FC<{
  linhas: string[][];
  tempos: number[];
  t: number;
  tamanho: number;
  modo: Modo;
  estilo?: React.CSSProperties;
  entrelinha?: number;
  alinhar?: "flex-start" | "center" | "flex-end";
  corDe?: (i: number) => string | undefined;
  // palavras riscadas (índices), riscadas a partir de `riscoEm`
  riscadas?: Set<number>;
  riscoEm?: number;
  corRisco?: string;
  // cursor (só no modo "digita"): cor e até quando aparece
  cursor?: { cor: string; ate: number };
}> = ({ linhas, tempos, t, tamanho, modo, estilo, entrelinha = 1.1, alinhar = "flex-start", corDe, riscadas, riscoEm, corRisco, cursor }) => {
  // índice de cada pedaço na lista de palavras do texto (o pedaço de uma palavra partida conta junto)
  const todas = linhas.flat();
  const indice: number[] = [];
  todas.forEach((w, j) => indice.push(j === 0 ? 0 : partida(w) ? indice[j - 1] : indice[j - 1] + 1));
  // digitando, uma palavra só começa quando a anterior terminou de ser digitada
  const comeco: number[] = [];
  todas.forEach((w, j) => {
    const proprio = tempos[indice[j]] ?? Infinity;
    if (modo !== "digita" || j === 0) comeco.push(proprio);
    else comeco.push(Math.max(proprio, comeco[j - 1] + todas[j - 1].replace(PARTE, "").length * 0.03 + 0.03));
  });
  let ultima = -1;
  todas.forEach((_, j) => {
    if (t >= comeco[j]) ultima = j;
  });
  const fimDaUltima = ultima >= 0 ? comeco[ultima] + todas[ultima].length * 0.03 : 0;
  const nRiscadas = riscadas?.size ?? 0;
  const ordemRisco = riscadas ? [...riscadas].sort((a, b) => a - b) : [];
  let k = 0;
  return (
    <div style={{ fontSize: tamanho, lineHeight: entrelinha, ...estilo }}>
      {linhas.map((linha, li) => (
        <div key={`l-${li}`} style={{ display: "flex", justifyContent: alinhar, whiteSpace: "pre" }}>
          {linha.map((wBruta, wi) => {
            const j = k++;
            const i = indice[j];
            const w = wBruta.replace(PARTE, "");
            const inicio = modo === "digita" ? comeco[j] : (tempos[i] ?? Infinity);
            const ultimaDaLinha = wi === linha.length - 1;
            const corPalavra = corDe?.(i);
            // risco: cada palavra riscada é cortada da esquerda para a direita, uma depois da outra
            let risco = 0;
            if (riscadas?.has(i) && riscoEm !== undefined) {
              const pos = ordemRisco.indexOf(i);
              risco = prog(t, riscoEm + (pos * 0.32) / Math.max(1, nRiscadas), 0.32 / Math.max(1, nRiscadas) + 0.05);
            }
            const corFinal = risco > 0.5 ? cor.borrado : corPalavra;
            const linhaRisco =
              risco > 0 ? (
                <span
                  style={{
                    position: "absolute",
                    left: "-0.04em",
                    top: "0.54em",
                    height: "0.09em",
                    width: `calc(${(risco * 100).toFixed(1)}% + 0.08em)`,
                    borderRadius: "0.05em",
                    background: corRisco ?? cor.tinta,
                  }}
                />
              ) : null;
            const margem = ultimaDaLinha ? 0 : `${VAO}em`;
            if (modo === "digita") {
              const n = t < inicio ? 0 : Math.min(w.length, Math.floor((t - inicio) / 0.03) + 1);
              const mostra = cursor && t < cursor.ate && j === ultima;
              return (
                <span key={`w-${j}`} style={{ position: "relative", marginRight: margem, color: corFinal }}>
                  {n >= w.length ? w : <span>{w.slice(0, n)}</span>}
                  {mostra && cursor ? <Cursor cor={cursor.cor} t={t} piscando={t > fimDaUltima + 0.15} /> : null}
                  {n < w.length ? <span style={{ opacity: 0 }}>{w.slice(n)}</span> : null}
                  {linhaRisco}
                </span>
              );
            }
            const p = prog(t, inicio, modo === "foco" ? 0.36 : 0.3);
            if (p >= 1) {
              return (
                <span key={`w-${j}`} style={{ position: "relative", marginRight: margem, color: corFinal }}>
                  {w}
                  {linhaRisco}
                </span>
              );
            }
            return (
              <span
                key={`w-${j}`}
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginRight: margem,
                  opacity: modo === "foco" ? (p > 0 ? 0.3 + 0.7 * p : 0) : p,
                  filter: modo === "foco" && p > 0 ? `blur(${(9 * (1 - p)).toFixed(2)}px)` : undefined,
                  translate: modo === "sobe" ? `0 ${((1 - p) * 0.3).toFixed(3)}em` : undefined,
                  color: modo === "foco" && p < 0.6 ? cor.borrado : corFinal,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
