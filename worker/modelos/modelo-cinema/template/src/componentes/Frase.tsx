import { foco, prog, saindo, temposDasPalavras, useTempo, usePalavras } from "../anim";
import type { LugarDaFrase } from "../layout";
import { encaixar, indicesDoTrecho, nucleo, type Fonte } from "../medida";
import type { Frase as FraseT } from "../plano";
import { cor, serif, sombra } from "../tema";

export const TAMANHO_MAX = 128;
const LARGURA = 930;

// As linhas da frase-chave: as do plano (forma antiga) ou o `texto` quebrado em 2–3 linhas
// equilibradas, medidas com a fonte de verdade.
export const linhasDaFrase = (m: FraseT, altura = Infinity): { linhas: string[][]; tamanho: number } => {
  if (m.linhas?.length) {
    const linhas = m.linhas.map((l) => l.split(/\s+/).filter(Boolean));
    const enfase = indicesDoTrecho(linhas.flat(), m.enfase ?? m.destaque);
    let i = 0;
    const fontes: Fonte[] = linhas.flat().map(() => (enfase.has(i++) ? "italico500" : "serif"));
    // o maior corpo em que cada linha cabe inteira na largura (e todas juntas na altura)
    let tamanho = TAMANHO_MAX;
    for (; tamanho > 48; tamanho -= 2) {
      let k = 0;
      const cabe = linhas.every((l) => {
        const enc = encaixar(l, { largura: LARGURA, max: tamanho, min: tamanho, linhas: 1, fonteDe: (j) => fontes[k + j] });
        k += l.length;
        return enc.linhas.length === 1 && enc.tamanho === tamanho;
      });
      if (cabe && linhas.length * tamanho * 1.08 <= altura) break;
    }
    return { linhas, tamanho };
  }
  const textos = (m.texto ?? "").split(/\s+/).filter(Boolean);
  const destacadas = indicesDoTrecho(textos, m.destaque);
  const enc = encaixar(textos, {
    largura: LARGURA,
    max: TAMANHO_MAX,
    min: 60,
    linhas: 3,
    altura: Number.isFinite(altura) ? altura : undefined,
    entrelinha: 1.08,
    fonteDe: (i) => (destacadas.has(i) ? "italico500" : "serif"),
  });
  return { linhas: enc.linhas.map((l) => l.map((i) => textos[i])), tamanho: enc.tamanho };
};

// Frase-chave: a imagem escurece (no Edicao) e a frase cresce em tipografia grande abaixo do
// queixo, cada palavra entrando em foco quando é dita. O bloco cresce devagar enquanto dura.
// `risco`: o trecho é riscado por um traço âmbar quando é dito e depois esfria (cinza frio).
export const Frase: React.FC<{ m: FraseT; lugar: LugarDaFrase }> = ({ m, lugar }) => {
  const t = useTempo();
  const palavras = usePalavras();
  const { linhas, tamanho } = linhasDaFrase(m, lugar.altura);
  const todas = linhas.flat();
  const inicio = m.em ?? m.de;
  const tempos = temposDasPalavras(palavras, inicio, todas, m.ate + 0.5);

  // palavras em ênfase: a sequência exata de `enfase` (ou `destaque`) dentro do texto
  const alvo = (m.enfase ?? m.destaque ?? "").split(/\s+/).filter(Boolean).map(nucleo);
  const destacadas = new Set<number>();
  if (alvo.length) {
    for (let i = 0; i + alvo.length <= todas.length; i++) {
      if (alvo.every((w, k) => nucleo(todas[i + k]) === w)) alvo.forEach((_, k) => destacadas.add(i + k));
    }
  }
  const riscadas = [...indicesDoTrecho(todas, m.risco)].sort((a, b) => a - b);
  const riscoEm = m.riscoEm ?? (riscadas.length ? tempos[riscadas[0]] + 0.3 : Infinity);

  const sai = saindo(t, m.ate, 0.4);
  const cresce = 0.965 + 0.06 * prog(t, m.de, Math.max(1, m.ate - m.de), (x) => x);
  let indice = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: lugar.topo,
        height: lugar.altura,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: 1 - sai,
        filter: sai > 0.02 ? `blur(${(sai * 8).toFixed(2)}px)` : undefined,
      }}
    >
      <div style={{ scale: String(cresce), display: "flex", flexDirection: "column", alignItems: "center" }}>
        {linhas.map((ws, li) => (
          <div
            key={li}
            style={{
              display: "flex",
              justifyContent: "center",
              fontFamily: serif,
              fontWeight: 600,
              fontSize: tamanho,
              lineHeight: 1.04,
              color: cor.marfim,
              textShadow: sombra,
              whiteSpace: "nowrap",
              fontVariantNumeric: "lining-nums",
            }}
          >
            {ws.map((w, k) => {
              const i = indice++;
              const destaque = destacadas.has(i);
              const r = riscadas.indexOf(i);
              const traco = r >= 0 ? prog(t, riscoEm + r * 0.12, 0.45) : 0;
              const esfria = r >= 0 ? prog(t, riscoEm + 0.4, 0.6) : 0;
              const proxima = r >= 0 ? riscadas[r + 1] : undefined;
              const continua = proxima !== undefined && ws.length > k + 1 && proxima === i + 1;
              return (
                <span
                  key={k}
                  style={{
                    display: "inline-block",
                    position: "relative",
                    marginRight: k < ws.length - 1 ? "0.24em" : 0,
                    ...(destaque ? { fontStyle: "italic", color: cor.ambarClaro, fontWeight: 500 } : {}),
                    ...(esfria > 0 ? { color: cor.frio } : {}),
                    ...foco(prog(t, tempos[i] - 0.06, 0.55), 12, 14),
                  }}
                >
                  {w}
                  {traco > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "56%",
                        height: Math.max(4, Math.round(tamanho * 0.055)),
                        width: continua ? "calc(100% + 0.24em)" : "100%",
                        background: cor.ambar,
                        transformOrigin: "left center",
                        scale: traco >= 0.999 ? undefined : `${traco.toFixed(3)} 1`,
                        borderRadius: 2,
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
