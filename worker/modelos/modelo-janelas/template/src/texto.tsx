// Texto medido e falado: quebra em linhas pela medida real da fonte (medida.ts), cada palavra entra
// no instante em que é dita (sobe de trás de uma régua, ou é digitada letra a letra) e, terminada a
// animação, a palavra é desenhada simples, sem máscara nem deslocamento (o quadro capturado nunca
// mostra uma palavra "já acesa" pela metade).
import { limitar, prog } from "./anim";
import { type Encaixe, ESPACO, type Fonte } from "./medida";
import { mono, sans } from "./tema";

// `cor` = o traço; `corTexto` = a cor da palavra depois de riscada (padrão: a do traço)
export type Risco = { de: number; ate: number; em: number; cor: string; corTexto?: string };

export const TextoFalado: React.FC<{
  enc: Encaixe;
  // instante de cada palavra (sem `tempos`, o texto já está inteiro)
  tempos?: number[];
  t: number;
  cor: string;
  corDe?: (i: number) => string | undefined;
  // cor do esboço: a palavra espera "a lápis" nesta cor antes de ser dita
  esboco?: string;
  modo?: "sobe" | "digita";
  fonte?: Fonte;
  alinhar?: "left" | "center";
  alturaLinha?: number;
  risco?: Risco | null;
  // cursor de texto piscando depois da última letra digitada (modo "digita")
  cursor?: { cor: string; ate: number };
  style?: React.CSSProperties;
}> = ({ enc, tempos, t, cor, corDe, esboco, modo = "sobe", fonte = {}, alinhar = "left", alturaLinha = 1.12, risco, cursor, style }) => {
  const { tamanho, linhas, palavras } = enc;
  const familia = fonte.mono ? mono : sans;
  const prRisco = risco ? prog(t, risco.em, 0.5) : 0;
  const nRisco = risco ? risco.ate - risco.de + 1 : 0;
  // última palavra já começada (para o cursor de texto)
  const comecadas = tempos ? palavras.map((_, i) => t >= (tempos[i] ?? 0)) : palavras.map(() => true);
  const ultima = comecadas.lastIndexOf(true);
  const piscando = cursor && t < cursor.ate && (Math.floor(t * 2.4) % 2 === 0 || (tempos && t - (tempos[ultima] ?? 0) < 0.4));

  const palavra = (i: number, ultimaDaLinha: boolean) => {
    const w = palavras[i];
    const c = corDe?.(i) ?? cor;
    const margem = ultimaDaLinha ? 0 : `${ESPACO}em`;
    const riscada = risco && i >= risco.de && i <= risco.ate ? limitar(prRisco * nRisco - (i - risco.de)) : 0;
    const corFinal = riscada > 0.5 && risco ? (risco.corTexto ?? risco.cor) : c;
    const traco =
      riscada > 0 ? (
        <span
          style={{
            position: "absolute",
            left: -tamanho * 0.04,
            top: "54%",
            height: Math.max(5, tamanho * 0.085),
            width: `calc(${riscada * 100}% + ${tamanho * 0.08}px)`,
            background: risco?.cor,
            borderRadius: 4,
          }}
        />
      ) : null;
    const tempo = tempos?.[i];
    if (modo === "digita") {
      const n = tempo === undefined ? w.length : t < tempo ? 0 : Math.min(w.length, 1 + Math.floor((t - tempo) / 0.028));
      const comCursor = !!piscando && i === ultima;
      return (
        <span key={i} style={{ position: "relative", display: "inline-block", marginRight: margem, color: corFinal, whiteSpace: "pre" }}>
          {n >= w.length ? w : (
            <>
              <span>{w.slice(0, n)}</span>
              <span style={{ color: esboco ?? "transparent" }}>{w.slice(n)}</span>
            </>
          )}
          {comCursor ? (
            <span
              style={{
                position: "absolute",
                left: `${(n / Math.max(1, w.length)) * 100}%`,
                top: "8%",
                width: Math.max(4, tamanho * 0.07),
                height: "84%",
                marginLeft: 4,
                background: cursor?.cor,
                borderRadius: 3,
              }}
            />
          ) : null}
          {traco}
        </span>
      );
    }
    const p = tempo === undefined ? 1 : prog(t, tempo, 0.36);
    if (p >= 0.999) {
      // terminada a animação: texto simples
      return (
        <span key={i} style={{ position: "relative", display: "inline-block", marginRight: margem, color: corFinal }}>
          {w}
          {traco}
        </span>
      );
    }
    return (
      <span key={i} style={{ position: "relative", display: "inline-block", marginRight: margem, overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
        <span style={{ display: "inline-block", color: esboco ?? "transparent", opacity: esboco ? 1 - p : 0 }}>{w}</span>
        {p > 0.001 ? (
          <span style={{ position: "absolute", left: 0, top: 0, display: "inline-block", translate: `0 ${(1 - p) * 105}%`, color: c }}>{w}</span>
        ) : null}
      </span>
    );
  };

  return (
    <div
      style={{
        fontFamily: familia,
        fontWeight: fonte.peso ?? 800,
        fontSize: tamanho,
        lineHeight: alturaLinha,
        letterSpacing: fonte.espacamento ? `${fonte.espacamento}em` : undefined,
        textTransform: fonte.caixaAlta ? "uppercase" : undefined,
        ...style,
      }}
    >
      {linhas.map((linha, k) => (
        <div key={k} style={{ display: "flex", justifyContent: alinhar === "center" ? "center" : "flex-start", whiteSpace: "nowrap" }}>
          {linha.map((i, j) => palavra(i, j === linha.length - 1))}
        </div>
      ))}
    </div>
  );
};

// Altura de um texto encaixado
export const alturaDoTexto = (enc: Encaixe, alturaLinha = 1.12) => enc.linhas.length * enc.tamanho * alturaLinha;
