// Peças comuns da página de revista: o cartão de papel, o rótulo em caixa alta, o texto falado
// palavra por palavra (a lápis → tinta), o glifo grande da coluna e o pino.
import { mix, prog } from "../anim";
import { cor, rotulo as estiloRotulo, sans, serifa } from "../tema";

// Cartão de papel claro com sombra suave (sem cantos arredondados)
export const folha: React.CSSProperties = {
  position: "absolute",
  background: cor.folha,
  boxSizing: "border-box",
  boxShadow: "0 22px 48px rgba(30,24,16,0.20), 0 2px 6px rgba(30,24,16,0.10)",
};

// Rótulo em caixa alta espaçada: cinza "a lápis" antes, grafite (ou a cor dada) depois
export const Rotulo: React.FC<{ texto: string; p?: number; cor?: string; tamanho?: number; style?: React.CSSProperties }> = ({
  texto,
  p = 1,
  cor: c = cor.grafite,
  tamanho = 32,
  style,
}) => <div style={{ ...estiloRotulo, fontSize: tamanho, color: p > 0.5 ? c : cor.lapis, ...style }}>{texto}</div>;

const limpa = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9%$]/g, "");

// Índices das palavras de `palavras` que formam o trecho (primeira ocorrência, em sequência)
export const marcarTrecho = (palavras: string[], trecho?: string): Set<number> => {
  const s = new Set<number>();
  if (!trecho) return s;
  const alvo = trecho.split(/\s+/).filter(Boolean).map(limpa);
  if (!alvo.length) return s;
  const ws = palavras.map(limpa);
  for (let i = 0; i + alvo.length <= ws.length; i++) {
    if (alvo.every((a, k) => ws[i + k] === a)) {
      for (let k = 0; k < alvo.length; k++) s.add(i + k);
      return s;
    }
  }
  return s;
};

// Texto falado já quebrado em linhas: cada palavra fica "a lápis" e ganha tinta quando é dita
// (sobe um pouco e assenta). Destaque = itálico índigo com sublinhado que se desenha;
// risco = um traço vinho que atravessa a palavra quando ela é dita (ou em `riscoEm`).
export const Falado: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  tamanho: number;
  entrelinha?: number;
  italico?: boolean;
  alinhamento?: "left" | "center";
  destaque?: Set<number>;
  risco?: Set<number>;
  riscoEm?: number;
  corTinta?: string;
  corLapis?: string;
  // o texto inteiro já aparece a lápis (true) ou cada palavra só surge quando é dita (false)
  aLapis?: boolean;
}> = ({ linhas, tempos, t, tamanho, entrelinha = 1.12, italico, alinhamento = "left", destaque, risco, riscoEm, corTinta = cor.tinta, corLapis = cor.lapisClaro, aLapis = true }) => {
  let k = 0;
  return (
    <div style={{ fontFamily: serifa, fontStyle: italico ? "italic" : "normal", fontSize: tamanho, lineHeight: entrelinha }}>
      {linhas.map((linha, i) => {
        const ws = linha.split(" ");
        return (
          <div key={i} style={{ display: "flex", justifyContent: alinhamento === "center" ? "center" : "flex-start", whiteSpace: "nowrap" }}>
            {ws.map((w, j) => {
              const idx = k++;
              const em = tempos[idx] ?? 0;
              const p = prog(t, em - 0.05, 0.36);
              const dest = destaque?.has(idx);
              const risc = risco?.has(idx);
              // o sublinhado continua por baixo do espaço quando a palavra seguinte também é destaque
              const emenda = dest && j < ws.length - 1 && destaque?.has(idx + 1);
              const tr = dest ? prog(t, em + 0.15, 0.45) : 0;
              const rk = risc ? prog(t, Math.max(riscoEm ?? em, em) + 0.1, 0.4) : 0;
              const visivel = aLapis ? 1 : prog(t, em - 0.05, 0.2);
              return (
                <span key={j} style={{ position: "relative", marginRight: j < ws.length - 1 ? "0.24em" : 0, opacity: visivel }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontStyle: dest ? "italic" : undefined,
                      color: p > 0.35 ? (dest ? cor.indigo : risc && rk > 0.5 ? cor.grafite : corTinta) : corLapis,
                      translate: p >= 1 ? undefined : `0 ${mix(0.07, 0, p)}em`,
                    }}
                  >
                    {w}
                  </span>
                  {dest ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        bottom: "0.02em",
                        height: Math.max(3, tamanho * 0.05),
                        width: `calc(${tr * 100}% + ${emenda ? tr * 0.24 : 0}em)`,
                        background: cor.indigo,
                      }}
                    />
                  ) : null}
                  {risc ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.04em",
                        top: "54%",
                        height: Math.max(4, tamanho * 0.07),
                        width: `calc(${rk * 100}% + ${rk * (risco?.has(idx + 1) && j < ws.length - 1 ? 0.32 : 0.08)}em)`,
                        background: cor.vinho,
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

// Glifo grande na coluna de papel (aspas de citação, interrogação, exclamação): o "numeral"
// das páginas que não são de item. Sobe de trás da máscara quando a página abre.
export const Glifo: React.FC<{ texto: string; p: number; tamanho?: number; cor?: string; italico?: boolean }> = ({ texto, p, tamanho = 300, cor: c = cor.indigo, italico }) => (
  <div style={{ height: tamanho * 0.78, overflow: "hidden" }}>
    <div
      style={{
        fontFamily: serifa,
        fontStyle: italico ? "italic" : "normal",
        fontSize: tamanho,
        lineHeight: 1,
        color: c,
        translate: p >= 1 ? undefined : `0 ${(1 - p) * 100}%`,
      }}
    >
      {texto}
    </div>
  </div>
);

// Texto de apoio em sans (detalhe, opção)
export const Apoio: React.FC<{ texto: string; tamanho?: number; p?: number; style?: React.CSSProperties }> = ({ texto, tamanho = 44, p = 1, style }) => (
  <div style={{ fontFamily: sans, fontWeight: 400, fontSize: tamanho, lineHeight: 1.22, color: cor.grafite, opacity: p, translate: p >= 1 ? undefined : `0 ${(1 - p) * 14}px`, ...style }}>{texto}</div>
);

// Instante em que um item pode aparecer: na palavra dele, mas nunca antes de a página abrir
export const quando = (em: number, de: number) => Math.max(em, de + 0.3);
