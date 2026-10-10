import { limitar, prog } from "../anim";
import { ESPACO, type Peso } from "../medida";
import { cor, sans } from "../tema";

// Texto falado já quebrado em linhas medidas (medida.ts): cada palavra sobe de trás de uma régua
// invisível no seu tempo e, quando termina de entrar, fica como texto simples (sem máscara).
// `destaque` = índices [de, até] das palavras em azul; `risco` = índices riscados em vermelho em `riscoEm`.
export const TextoFalado: React.FC<{
  linhas: string[];
  tamanho: number;
  peso?: Peso;
  tempos: number[];
  t: number;
  cor?: string;
  destaque?: [number, number] | null;
  corDestaque?: string;
  risco?: [number, number] | null;
  riscoEm?: number;
  alinhar?: "esquerda" | "centro";
  entrelinha?: number;
  espacamento?: number;
  // palavras ainda não ditas aparecem como um traço cinza ("a lápis") em vez de invisíveis
  lapis?: boolean;
}> = ({
  linhas,
  tamanho,
  peso = 800,
  tempos,
  t,
  cor: corTexto = cor.tinta,
  destaque,
  corDestaque = cor.azul,
  risco,
  riscoEm,
  alinhar = "esquerda",
  entrelinha = 1.06,
  espacamento = -0.015,
  lapis,
}) => {
  let k = 0;
  const nRisco = risco ? risco[1] - risco[0] + 1 : 0;
  const pRisco = risco && riscoEm !== undefined ? prog(t, riscoEm, 0.32 + 0.12 * nRisco) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "centro" ? "center" : "flex-start" }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        return (
          <div
            key={li}
            style={{
              display: "flex",
              whiteSpace: "nowrap",
              fontFamily: sans,
              fontWeight: peso,
              fontSize: tamanho,
              lineHeight: entrelinha,
              letterSpacing: `${espacamento}em`,
              color: corTexto,
            }}
          >
            {ws.map((w, wi) => {
              const i = k++;
              const p = prog(t, tempos[i] ?? 0, 0.42);
              const pronta = p >= 1;
              const emDestaque = !!destaque && i >= destaque[0] && i <= destaque[1];
              const riscada = !!risco && i >= risco[0] && i <= risco[1];
              // o risco anda palavra por palavra, da esquerda para a direita
              const pr = riscada ? limitar(pRisco * nRisco - (i - (risco as [number, number])[0])) : 0;
              const ultimaDoRisco = riscada && (i === (risco as [number, number])[1] || wi === ws.length - 1);
              const corPalavra = riscada && pr > 0 ? misturar(emDestaque ? corDestaque : corTexto, cor.cinza, pr) : emDestaque ? corDestaque : undefined;
              const vazia = lapis && p <= 0;
              return (
                <span
                  key={wi}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    overflow: pronta ? "visible" : "hidden",
                    paddingBottom: "0.16em",
                    marginBottom: "-0.16em",
                    paddingTop: "0.04em",
                    marginRight: wi < ws.length - 1 ? `${ESPACO}em` : 0,
                    verticalAlign: "top",
                  }}
                >
                  {vazia ? (
                    // a lápis: só o traço do lugar da palavra, sem dar para ler antes de ser dita
                    <span style={{ position: "relative", display: "inline-block", color: "transparent" }}>
                      {w}
                      <span style={{ position: "absolute", left: "0.02em", right: "0.02em", top: "0.4em", height: "0.16em", minHeight: 6, borderRadius: 999, background: cor.lapis }} />
                    </span>
                  ) : (
                    <span
                      style={
                        pronta
                          ? { display: "inline-block", color: corPalavra }
                          : { display: "inline-block", translate: `0 ${(1 - p) * 104}%`, opacity: 0.2 + 0.8 * p, color: corPalavra }
                      }
                    >
                      {w}
                    </span>
                  )}
                  {pr > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.04em",
                        right: ultimaDoRisco ? "-0.04em" : `-${ESPACO + 0.02}em`,
                        top: "0.56em",
                        height: Math.max(5, tamanho * 0.075),
                        borderRadius: 4,
                        background: cor.vermelho,
                        transform: `scaleX(${pr})`,
                        transformOrigin: "left center",
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

const misturar = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * limitar(p)).toString(16).padStart(2, "0")).join("")}`;
};
