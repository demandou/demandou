import { Easing } from "remotion";
import { indicesDoTrecho, limitar, prog, temposDoTexto } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Frase as TFrase } from "../plano";
import { cor, display } from "../tema";
import { F_TITULO, quebraManual, respiro, type PropsBloco } from "./comum";

// Frase de efeito: as palavras se encaixam na fala; o trecho `risco` é riscado quando termina de ser
// dito (ou em `riscoEm`); o trecho `destaque` acende na cor de ênfase e ganha uma barra de base que cresce
// embaixo. Com `texto`, o bloco mede e quebra sozinho; `linhas` = quebra manual.
export const Frase: React.FC<PropsBloco<TFrase>> = ({ b, t, w, h, util, pal, palavras, janela }) => {
  const pad = respiro(w, h);
  const interna = w - 2 * pad;
  const alto = Math.min(h, util);
  const disponivel = alto - 2 * pad;
  let linhas: string[];
  let tamanho: number;
  const manual = quebraManual(b);
  if (manual) {
    linhas = manual;
    const maior = Math.max(...linhas.map((l) => larguraTexto(l, 1, F_TITULO)));
    tamanho = Math.max(44, Math.floor(Math.min(132, interna / Math.max(maior, 0.01), disponivel / (linhas.length * 1.16))));
  } else {
    const e = encaixar(b.texto ?? "", { largura: interna, altura: disponivel, max: 132, min: 48, linhas: 5, fonte: F_TITULO, entrelinha: 1.16 });
    linhas = e.linhas;
    tamanho = e.tamanho;
  }
  const risca = b.risco ?? b.risca;
  const enfase = b.destaque ?? b.enfase;
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(todas.join(" "), palavras, b.em ?? janela.de, janela.ate);
  const riscadas = indicesDoTrecho(todas, risca);
  const destaque = indicesDoTrecho(todas, enfase);
  const listaRisca = [...riscadas].sort((a, c) => a - c);
  const listaEnfase = [...destaque].sort((a, c) => a - c);
  // o risco passa depois da última palavra riscada ser dita; a barra cresce com a primeira palavra da ênfase
  const tRisca = b.riscoEm ?? (listaRisca.length ? tempos[listaRisca[listaRisca.length - 1]] + 0.35 : 9999);
  const pRisca = prog(t, tRisca, 0.55, Easing.inOut(Easing.cubic));
  const tEnfase = listaEnfase.length ? tempos[listaEnfase[0]] : 9999;
  const pBase = prog(t, tEnfase + 0.1, 0.6);
  const altura = linhas.length * tamanho * 1.12;
  // risco em tomate (ou creme, se o bloco já for tomate)
  const corRisco = pal.fundo === cor.tomate ? cor.creme : cor.tomate;
  let cursor = 0;
  return (
    <div style={{ position: "absolute", left: pad, top: Math.max(pad, (alto - altura) / 2), width: interna }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const inicio = cursor;
        cursor += ws.length;
        return (
          <div key={li} style={{ whiteSpace: "nowrap", fontFamily: display, fontWeight: 700, fontSize: tamanho, lineHeight: 1.12, letterSpacing: "-0.025em" }}>
            {ws.map((w0, k) => {
              const i = inicio + k;
              const p = prog(t, tempos[i], 0.42);
              const riscada = riscadas.has(i);
              const emDestaque = destaque.has(i);
              const ordemRisca = listaRisca.indexOf(i);
              const pr = riscada ? limitar(pRisca * listaRisca.length - ordemRisca) : 0;
              const ordemEnf = listaEnfase.indexOf(i);
              const pb = emDestaque ? limitar(pBase * listaEnfase.length - ordemEnf) : 0;
              const ultima = k === ws.length - 1;
              // o risco e a barra atravessam o espaço até a próxima palavra do mesmo trecho
              const seguido = (conj: Set<number>) => conj.has(i + 1) && !ultima;
              return (
                <span key={k} style={{ position: "relative", display: "inline-block", marginRight: ultima ? 0 : "0.24em" }}>
                  <span
                    style={{
                      display: "inline-block",
                      clipPath: p < 0.999 ? `inset(-0.3em ${((1 - p) * 104).toFixed(2)}% -0.3em -0.1em)` : undefined,
                      translate: p < 0.999 ? `0 ${((1 - p) * 0.14).toFixed(3)}em` : undefined,
                      opacity: (p <= 0.001 ? 0 : 1) * (riscada ? 1 - 0.45 * pr : 1),
                      color: emDestaque ? pal.acento : pal.texto,
                    }}
                  >
                    {w0}
                  </span>
                  {riscada && pr > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.04em",
                        top: "0.5em",
                        height: "0.085em",
                        width: `calc(${pr} * (100% + ${seguido(riscadas) ? "0.32em" : "0.08em"}))`,
                        background: corRisco,
                        borderRadius: "0.04em",
                      }}
                    />
                  ) : null}
                  {emDestaque && pb > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "1.02em",
                        height: "0.13em",
                        width: `calc(${pb} * (100% + ${seguido(destaque) ? "0.24em" : "0em"}))`,
                        background: pal.acento,
                        borderRadius: "0.03em",
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
