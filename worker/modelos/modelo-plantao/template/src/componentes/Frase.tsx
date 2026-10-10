// Frase (bloco universal) no painel do estúdio: a citação do telejornal. As aspas em azul elétrico
// abrem o painel; o texto em caixa-alta branca acende palavra por palavra na fala. O `destaque` ganha
// a tarja branca (letra azul profundo) quando é dito; o `risco` é riscado por um traço branco no
// `riscoEm` e apaga.
import { indicesDoDestaque, limitar, prog, temposDoTexto } from "../anim";
import type { Area } from "../layout";
import { caberNaAltura } from "../medidas";
import type { Frase as F, Palavra } from "../plano";
import { cor, manchete, MARGEM, W } from "../tema";

export const Frase: React.FC<{ m: F; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  if (t < entra) return null;
  const xTexto = MARGEM + 118;
  const largura = W - MARGEM - xTexto - 10;
  const { linhas, tam } = caberNaAltura(m.texto, {
    largura,
    maximo: 84,
    minimo: 46,
    linhas: 4,
    corte: { peso: 900, alta: true, espacamento: -0.01 },
    alturaMax: area.h - 70,
    entrelinha: 1.14,
  });
  const inicio = Math.max(m.de + 0.1, m.em ?? 0, entra + 0.1);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, inicio);
  const destaque = indicesDoDestaque(m.texto, m.destaque);
  const risco = indicesDoDestaque(m.texto, m.risco);
  const riscoEm = m.riscoEm ?? (risco.size ? (tempos[Math.max(...risco)] ?? m.de) + 0.35 : 0);
  const pRisco = risco.size ? prog(t, riscoEm - 0.04, 0.25 + 0.12 * risco.size) : 0;
  const ordemRisco = [...risco].sort((a, b) => a - b);
  // o traço corre pelas palavras riscadas, uma depois da outra
  const riscoDa = (i: number) => limitar(pRisco * ordemRisco.length - ordemRisco.indexOf(i));
  const pAspas = prog(t, entra + 0.05, 0.4);
  const altura = linhas.length * tam * 1.14;
  const y0 = area.y + Math.max(34, (area.h - altura) / 2 - 6);
  let k = 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: MARGEM - 4, top: y0 - 18, ...manchete, fontSize: 170, lineHeight: 1, color: cor.eletrico, opacity: pAspas, translate: `0 ${(1 - pAspas) * 16}px` }}>“</div>
      <div style={{ position: "absolute", left: xTexto, top: y0, display: "flex", flexDirection: "column", gap: Math.round(tam * 0.14) }}>
        {linhas.map((linha, li) => {
          const ws = linha.split(/\s+/).filter(Boolean);
          return (
            <div key={li} style={{ display: "flex", ...manchete, fontSize: tam }}>
              {ws.map((w, wi) => {
                const i = k++;
                const p = prog(t, tempos[i] ?? inicio, 0.34);
                const ehDestaque = destaque.has(i);
                const ehRisco = risco.has(i);
                const proximoTambem = (ehDestaque && destaque.has(i + 1) && wi < ws.length - 1) || (ehRisco && risco.has(i + 1) && wi < ws.length - 1);
                const margem = wi < ws.length - 1 ? "0.26em" : 0;
                const pr = ehRisco ? riscoDa(i) : 0;
                const corTexto = ehDestaque && p > 0.3 ? cor.tinta : ehRisco ? `rgba(255,255,255,${1 - 0.55 * pr})` : cor.branco;
                return (
                  <span key={wi} style={{ position: "relative", display: "inline-block", marginRight: margem, whiteSpace: "pre" }}>
                    {ehDestaque ? (
                      <span
                        style={{
                          position: "absolute",
                          left: "-0.12em",
                          right: proximoTambem ? "-0.28em" : "-0.12em",
                          top: "-0.06em",
                          bottom: "-0.08em",
                          background: cor.papel,
                          clipPath: `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`,
                        }}
                      />
                    ) : null}
                    {p >= 1 ? (
                      <span style={{ position: "relative", color: corTexto }}>{w}</span>
                    ) : (
                      <>
                        <span style={{ position: "relative", color: cor.apagadoNoAzul }}>{w}</span>
                        <span style={{ position: "absolute", left: 0, top: 0, color: corTexto, clipPath: `inset(-0.3em ${((1 - p) * 100).toFixed(2)}% -0.3em -0.1em)` }}>{w}</span>
                      </>
                    )}
                    {ehRisco && pr > 0 ? (
                      <span
                        style={{
                          position: "absolute",
                          left: "-0.06em",
                          top: "46%",
                          height: Math.max(8, Math.round(tam * 0.1)),
                          width: `calc(${pr * 100}% + ${(proximoTambem ? 0.32 : 0.1) * pr}em)`,
                          background: cor.papel,
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
    </div>
  );
};
