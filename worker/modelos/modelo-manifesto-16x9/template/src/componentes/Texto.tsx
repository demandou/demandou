import { prog } from "../anim";
import type { Caixa } from "../fileira";
import { APERTO, caixaAlta, display, MAIUSCULA, TOPO_DA_MAIUSCULA } from "../tema";

// Uma linha do pôster: centralizada (ou, no quadro deitado, encostada na janela dentro da coluna
// dela: `caixa`), cada palavra sobe de trás de uma máscara quando é falada.
// O espaço entre as palavras é uma margem fixa (não o caractere de espaço), para nunca colar.
// Com `lapis`, a linha já está desenhada apagada ("a lápis") desde o começo, e cada palavra
// ganha tinta por cima do próprio esboço quando é dita (a tinta corre da esquerda para a direita).
export const LinhaDeTexto: React.FC<{
  t: number;
  texto: string;
  tempos: number[];
  y: number;
  tamanho: number;
  cor: string;
  peso?: 500 | 700 | 900;
  // o que vem antes das palavras na mesma linha (ícone)
  antes?: React.ReactNode;
  // risco que passa por cima da linha inteira (0→1) e a cor dele
  risco?: number;
  corRisco?: string;
  corRiscada?: string;
  // cor do esboço (sem isso, a linha só aparece quando é falada)
  lapis?: string;
  estilo?: React.CSSProperties;
  // a coluna da linha (sem ela, a linha ocupa a largura do quadro, centralizada)
  caixa?: Caixa;
}> = ({ t, texto, tempos, y, tamanho, cor, peso = 900, antes, risco = 0, corRisco, corRiscada, lapis, estilo, caixa }) => {
  const palavras = caixaAlta(texto).trim().split(/\s+/);
  const primeira = tempos[0] ?? 0;
  return (
    <div
      style={{
        position: "absolute",
        ...(caixa ? { left: caixa.x, width: caixa.largura } : { left: 0, right: 0 }),
        top: y,
        height: tamanho,
        display: "flex",
        justifyContent: caixa?.alinhar === "esquerda" ? "flex-start" : caixa?.alinhar === "direita" ? "flex-end" : "center",
        alignItems: "flex-start",
        fontFamily: display,
        fontWeight: peso,
        fontSize: tamanho,
        lineHeight: 1,
        letterSpacing: `${APERTO}em`,
        color: risco > 0 && corRiscada ? corRiscada : cor,
        whiteSpace: "nowrap",
        ...estilo,
      }}
    >
      {antes ? (
        <div style={{ position: "relative", marginRight: "0.32em" }}>
          {lapis ? <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>{antes}</div> : null}
          <div style={{ opacity: prog(t, primeira - 0.04, 0.2), translate: `0 ${(1 - prog(t, primeira - 0.04, 0.3)) * 0.3}em` }}>{antes}</div>
        </div>
      ) : null}
      <div style={{ position: "relative", display: "flex", gap: "0 0.3em" }}>
        {palavras.map((w, k) => {
          const em = tempos[k] ?? tempos[tempos.length - 1] ?? 0;
          const p = prog(t, em - 0.03, 0.32);
          // terminada a entrada, a palavra é texto simples (sem máscara nem deslocamento por cima)
          if (p >= 1) return <div key={`${w}-${k}`}>{w}</div>;
          return (
            // a máscara tem folga em cima (acento) e embaixo (cedilha, vírgula); a palavra começa
            // inteira abaixo dela (inclusive da folga de baixo) e sobe até o lugar
            <div key={`${w}-${k}`} style={{ position: "relative", overflow: "hidden", padding: "0.3em 0.04em", margin: "-0.3em -0.04em" }}>
              {lapis && p < 1 ? <div style={{ position: "absolute", left: "0.04em", top: "0.3em", color: lapis }}>{w}</div> : null}
              {/* sem esboço, a palavra sobe de trás da máscara; com esboço, a tinta corre por cima dele
                  da esquerda para a direita (subindo, ela passaria por baixo do esboço e pareceria dobrada) */}
              <div
                style={{
                  position: "relative",
                  opacity: t >= em - 0.04 ? 1 : 0,
                  ...(lapis
                    ? { clipPath: `inset(-0.4em ${(1 - p) * 100}% -0.4em -0.1em)` }
                    : { translate: `0 calc(${1 - p} * (100% + 0.36em))` }),
                }}
              >
                {w}
              </div>
            </div>
          );
        })}
        {risco > 0 ? (
          <div
            style={{
              position: "absolute",
              left: "-0.06em",
              top: `${TOPO_DA_MAIUSCULA + MAIUSCULA * 0.52 - 0.06}em`,
              height: "0.12em",
              width: `calc(${risco} * (100% + 0.12em))`,
              background: corRisco,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};
