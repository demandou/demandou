// O cartaz do Impacto para qualquer texto: palavras enormes em caixa alta, cada linha ocupando a
// largura da coluna, cada palavra batendo no instante em que é dita. Trechos podem vir no acento
// (destaque) ou ser riscados por uma barra no acento (risco).
import { batida, prog } from "../anim";
import type { Palavra } from "../plano";
import { cor, larguraEm, sora, TRACKING } from "../tema";
import { ALTURA_LINHA, alinhar, type LinhaCartaz, montarCartaz, palavrasDoTrecho, VAO } from "../texto";
import { ESPACO } from "./Pilha";

const ESPACO_EM = 0.19;

export type Preparado = {
  linhas: LinhaCartaz[];
  altura: number;
  tempos: number[];
  destaque: Set<number>;
  risco: Set<number>;
};

// Monta o cartaz de um texto e acha o tempo de cada palavra na fala.
export const prepararCartaz = (
  texto: string,
  largura: number,
  palavras: Palavra[],
  inicio: number,
  limite: number,
  opcoes: { maximo?: number; alturaMax?: number; maxLinhas?: number; destaque?: string; risco?: string } = {},
): Preparado => {
  const { linhas, altura } = montarCartaz(texto, largura, opcoes);
  return {
    linhas,
    altura,
    tempos: alinhar(texto, palavras, inicio, limite),
    destaque: palavrasDoTrecho(texto, opcoes.destaque),
    risco: palavrasDoTrecho(texto, opcoes.risco),
  };
};

// posição (em "em") do começo de cada palavra da linha, e a largura de cada uma
const medidas = (palavras: string[]) => {
  let x = 0;
  return palavras.map((w) => {
    const l = larguraEm(w, 800, TRACKING);
    const r = { x, l };
    x += l + ESPACO_EM;
    return r;
  });
};

export const Cartaz: React.FC<{
  t: number;
  p: Preparado;
  // cor de uma palavra que não está em destaque
  corTexto?: string;
  corDestaque?: string;
  // instante do risco (as palavras do risco esmaecem e uma barra no acento as atravessa)
  riscoEm?: number;
  // atraso mínimo para as palavras (ex.: só depois que algo saiu do caminho)
  depoisDe?: number;
}> = ({ t, p, corTexto = cor.papel, corDestaque = cor.volt, riscoEm, depoisDe = -Infinity }) => {
  const pRisco = riscoEm !== undefined ? prog(t, riscoEm - 0.04, 0.18) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      {p.linhas.map((l, i) => {
        const m = medidas(l.palavras);
        const riscadas = l.indices.map((ix, k) => (p.risco.has(ix) ? k : -1)).filter((k) => k >= 0);
        const temRisco = riscoEm !== undefined && riscadas.length > 0;
        const a = temRisco ? m[riscadas[0]].x : 0;
        const b = temRisco ? m[riscadas[riscadas.length - 1]].x + m[riscadas[riscadas.length - 1]].l : 0;
        const espessura = Math.max(10, l.tamanho * 0.09);
        return (
          <div
            key={`${l.palavras.join("-")}-${i}`}
            style={{
              position: "relative",
              fontFamily: sora,
              fontWeight: 800,
              fontSize: l.tamanho,
              lineHeight: ALTURA_LINHA,
              height: l.tamanho * ALTURA_LINHA,
              marginTop: i > 0 ? l.tamanho * VAO : 0,
              letterSpacing: `${TRACKING}em`,
              whiteSpace: "nowrap",
            }}
          >
            {l.palavras.map((w, k) => {
              const ix = l.indices[k];
              const riscada = p.risco.has(ix) && riscoEm !== undefined;
              return (
                <span
                  key={`${w}-${k}`}
                  style={{
                    display: "inline-block",
                    marginRight: k < l.palavras.length - 1 ? ESPACO : 0,
                    color: p.destaque.has(ix) ? corDestaque : corTexto,
                    opacity: riscada ? 1 - 0.6 * pRisco : undefined,
                    ...batida(t, Math.max(depoisDe, p.tempos[ix] ?? p.tempos[0] ?? 0)),
                  }}
                >
                  {w}
                </span>
              );
            })}
            {temRisco ? (
              <div
                style={{
                  position: "absolute",
                  left: a * l.tamanho - 8,
                  top: "50%",
                  height: espessura,
                  marginTop: -espessura / 2 - l.tamanho * 0.04,
                  width: ((b - a) * l.tamanho + 16) * prog(t, (riscoEm as number) - 0.04 + i * 0.05, 0.16),
                  background: cor.volt,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// Instante da palavra mais longa de um conjunto (onde cai a pancada grave).
export const palavraForte = (p: Preparado, conjunto?: Set<number>) => {
  const todas = p.linhas.flatMap((l) => l.indices.map((ix, k) => ({ ix, w: l.palavras[k] })));
  const alvo = conjunto && conjunto.size ? todas.filter((x) => conjunto.has(x.ix)) : todas;
  if (!alvo.length) return undefined;
  const maior = alvo.reduce((a, b) => (b.w.length > a.w.length ? b : a));
  return p.tempos[maior.ix];
};
