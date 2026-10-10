import { prog, temposDasPalavras, usePalavras, useTempo } from "../anim";
import { trechoNoTexto } from "../medida";
import { cor } from "../tema";

export type Medida = { tamanho: number; linhas: string[] };

// Texto que se monta palavra por palavra na fala, já quebrado em linhas que cabem (medida.ts).
// `destaque` = trecho na cor de ênfase; `risco` = trecho riscado quando é dito (`riscoEm`).
// Espaço entre palavras é margem fixa (não o caractere de espaço dentro de spans animados).
export const TituloNaFala: React.FC<{
  texto: string;
  medida: Medida;
  em: number;
  limite?: number;
  peso?: 500 | 600;
  fonte: string;
  corTexto?: string;
  destaque?: string;
  corDestaque?: string;
  risco?: string;
  riscoEm?: number;
  entrelinha?: number;
  espacamento?: string;
  alinhar?: "flex-start" | "center";
  // as linhas de baixo só ocupam espaço quando a primeira palavra delas é dita (o cartão cresce)
  crescer?: boolean;
  // estilo extra por palavra (ex.: dígitos em mono)
  estiloPalavra?: (palavra: string) => React.CSSProperties | undefined;
}> = ({
  texto,
  medida,
  em,
  limite,
  peso = 600,
  fonte,
  corTexto = cor.texto,
  destaque,
  corDestaque = cor.positivo,
  risco,
  riscoEm,
  entrelinha = 1.1,
  espacamento = "-0.015em",
  alinhar = "flex-start",
  crescer = false,
  estiloPalavra,
}) => {
  const t = useTempo();
  const palavras = usePalavras();
  const total = medida.linhas.reduce((n, l) => n + l.split(" ").length, 0);
  const tempos = temposDasPalavras(palavras, em, total, limite);
  const faixaDestaque = trechoNoTexto(texto, destaque);
  const faixaRisco = trechoNoTexto(texto, risco);
  const pRisco = faixaRisco ? prog(t, riscoEm ?? tempos[faixaRisco[1]] + 0.3, 0.45) : 0;
  const gap = "0.26em";

  let k = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar }}>
      {medida.linhas.map((linha, li) => {
        const ws = linha.split(" ").map((w) => ({ w, i: k++ }));
        // grupos: palavras soltas e o trecho riscado (junto, para a linha do risco atravessar o grupo)
        const grupos: { riscado: boolean; ws: typeof ws }[] = [];
        for (const item of ws) {
          const riscado = !!faixaRisco && item.i >= faixaRisco[0] && item.i <= faixaRisco[1];
          const ultimo = grupos[grupos.length - 1];
          if (ultimo && ultimo.riscado && riscado) ultimo.ws.push(item);
          else grupos.push({ riscado, ws: [item] });
        }
        const palavra = ({ w, i }: { w: string; i: number }) => {
          const p = prog(t, tempos[i] - 0.04, 0.24);
          const emDestaque = !!faixaDestaque && i >= faixaDestaque[0] && i <= faixaDestaque[1];
          const riscada = !!faixaRisco && i >= faixaRisco[0] && i <= faixaRisco[1];
          const entrada = p >= 1 ? {} : { opacity: p, translate: `0 ${(1 - p) * 14}px` };
          return (
            <span
              key={`${w}-${i}`}
              style={{
                display: "inline-block",
                color: riscada && pRisco > 0.5 ? cor.apagado : emDestaque ? corDestaque : corTexto,
                ...entrada,
                ...estiloPalavra?.(w),
              }}
            >
              {w}
            </span>
          );
        };
        const pLinha = crescer && li > 0 ? prog(t, tempos[ws[0].i] - 0.14, 0.3) : 1;
        return (
          <div
            key={`${linha}-${li}`}
            style={{
              height: pLinha < 1 ? medida.tamanho * entrelinha * pLinha : undefined,
              display: "flex",
              gap: `0 ${gap}`,
              whiteSpace: "nowrap",
              fontFamily: fonte,
              fontWeight: peso,
              fontSize: medida.tamanho,
              lineHeight: entrelinha,
              letterSpacing: espacamento,
            }}
          >
            {grupos.map((g, gi) =>
              g.riscado ? (
                <span key={`g${gi}`} style={{ position: "relative", display: "inline-flex", gap: `0 ${gap}` }}>
                  {g.ws.map(palavra)}
                  {pRisco > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: -4,
                        top: "54%",
                        height: Math.max(4, medida.tamanho * 0.08),
                        width: `calc(${pRisco * 100}% + 8px)`,
                        borderRadius: 3,
                        background: cor.negativo,
                      }}
                    />
                  ) : null}
                </span>
              ) : (
                g.ws.map(palavra)
              ),
            )}
          </div>
        );
      })}
    </div>
  );
};
