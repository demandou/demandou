// Texto que nasce a lápis e ganha tinta palavra por palavra, no instante em que cada uma é falada.
// As linhas vêm medidas (medida.ts): o texto cabe sempre. Terminada a entrada de uma palavra, ela é
// desenhada simples (uma camada só, sem o esboço por baixo), para nenhum quadro mostrar duas camadas.
import { prog } from "./anim";
import { type Encaixe, espaco } from "./medida";
import { cor, fonte } from "./tema";

export const ALTURA_LINHA = 1.08;

// uma palavra: esboço apagado → tinta, com uma subida curta
export const PalavraFalada: React.FC<{
  w: string;
  em: number;
  t: number;
  tamanho: number;
  cor: string;
  lapis?: string;
  peso?: number;
  espacamento?: number;
}> = ({ w, em, t, tamanho, cor: tinta, lapis = cor.lapisForte, peso = 800, espacamento = -0.02 }) => {
  const p = prog(t, em - 0.03, 0.3);
  const base: React.CSSProperties = {
    fontFamily: fonte,
    fontWeight: peso,
    fontSize: tamanho,
    lineHeight: 1,
    letterSpacing: `${espacamento}em`,
    whiteSpace: "nowrap",
  };
  if (p <= 0) return <div style={{ ...base, color: lapis }}>{w}</div>;
  if (p >= 1) return <div style={{ ...base, color: tinta }}>{w}</div>;
  return (
    <div style={{ position: "relative", ...base }}>
      <span style={{ color: lapis, opacity: 1 - p }}>{w}</span>
      <span style={{ position: "absolute", left: 0, top: 0, color: tinta, opacity: p, translate: `0 ${(1 - p) * 0.12 * tamanho}px` }}>{w}</span>
    </div>
  );
};

export const alturaDoTexto = (enc: Encaixe, alturaLinha = ALTURA_LINHA) => enc.linhas.length * enc.tamanho * alturaLinha;

// Um bloco de texto medido, palavra por palavra.
export const TextoFalado: React.FC<{
  enc: Encaixe;
  tempos: number[];
  t: number;
  cor: string;
  lapis?: string;
  peso?: number;
  espacamento?: number;
  alinhamento?: "left" | "center";
  alturaLinha?: number;
  // palavras na cor de ênfase
  destaque?: Set<number>;
  corDestaque?: string;
  // traço embaixo das palavras de destaque, desenhado depois que a última delas é dita
  sublinhar?: boolean;
  // palavras riscadas quando são ditas (o traço passa por cima e elas apagam)
  risco?: Set<number>;
  riscoEm?: number;
  corRisco?: string;
  corRiscada?: string;
}> = ({
  enc,
  tempos,
  t,
  cor: tinta,
  lapis,
  peso = 800,
  espacamento = -0.02,
  alinhamento = "left",
  alturaLinha = ALTURA_LINHA,
  destaque,
  corDestaque = cor.azul,
  sublinhar = false,
  risco,
  riscoEm,
  corRisco = cor.marfim,
  corRiscada = cor.lapisForte,
}) => {
  const { tamanho, palavras, linhas } = enc;
  const sp = espaco(tamanho, { peso, espacamento });
  const riscados = risco ? [...risco].sort((a, b) => a - b) : [];
  const inicioRisco = riscoEm ?? (riscados.length ? tempos[riscados[0]] : 0);
  const pRisco = riscados.length ? prog(t, inicioRisco + 0.05, 0.22 + 0.08 * riscados.length) : 0;
  const ultimoDestaque = destaque && destaque.size ? Math.max(...[...destaque].map((i) => tempos[i] ?? 0)) : 0;
  const pSublinhado = sublinhar ? prog(t, ultimoDestaque + 0.15, 0.4) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhamento === "center" ? "center" : "flex-start" }}>
      {linhas.map((linha, li) => (
        <div key={li} style={{ display: "flex", height: tamanho * alturaLinha, alignItems: "center" }}>
          {linha.map((i, k) => {
            const marcada = destaque?.has(i);
            const riscada = risco?.has(i);
            const ordem = riscados.indexOf(i);
            // cada palavra riscada recebe o seu pedaço do traço, em sequência
            const pTraco = riscada ? Math.min(1, Math.max(0, pRisco * riscados.length - ordem)) : 0;
            const proximaRiscada = riscada && risco?.has(linha[k + 1] ?? -1);
            const corPalavra = riscada && pTraco >= 1 ? corRiscada : marcada ? corDestaque : tinta;
            return (
              <div key={i} style={{ position: "relative", marginLeft: k ? sp : 0 }}>
                <PalavraFalada w={palavras[i]} em={tempos[i] ?? 0} t={t} tamanho={tamanho} cor={corPalavra} lapis={lapis} peso={peso} espacamento={espacamento} />
                {marcada && sublinhar && pSublinhado > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: -tamanho * 0.1,
                      height: Math.max(5, tamanho * 0.07),
                      borderRadius: 4,
                      background: corDestaque,
                      width: `calc(${100 * pSublinhado}% + ${destaque?.has(linha[k + 1] ?? -1) ? sp * pSublinhado : 0}px)`,
                    }}
                  />
                ) : null}
                {riscada && pTraco > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: -4,
                      top: tamanho * 0.52,
                      height: Math.max(5, tamanho * 0.075),
                      borderRadius: 4,
                      background: corRisco,
                      width: `calc(${100 * pTraco}% + ${(proximaRiscada ? sp : 8) * pTraco}px)`,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
