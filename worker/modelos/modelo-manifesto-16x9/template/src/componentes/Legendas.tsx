import { prog, useTempo } from "../anim";
import type { Frase } from "../motor/frases";
import type { Palavra } from "../plano";
import { APERTO, caixaAlta, cor, display, MARGEM } from "../tema";

// Legenda do quadro cheio: caixa-alta grande, na mesma fonte dos pôsteres, em pedaços curtos
// (uma linha, 2 a 4 palavras). Cada palavra entra quando é falada e a palavra da vez fica sobre
// uma tarja de cobalto (sem cantos arredondados).
const TAMANHO = 56;
// caracteres por pedaço: no quadro deitado a linha tem ~1500 px; a 56 px cabem uns 30 caracteres
// largos (o pedaço continua numa linha só, para dar tempo de leitura sem cobrir a pessoa)
const POR_PEDACO = 28;

const pedacos = (palavras: Palavra[]) => {
  const saida: Palavra[][] = [];
  let atual: Palavra[] = [];
  let n = 0;
  palavras.forEach((p, i) => {
    if (atual.length && n + 1 + p.w.length > POR_PEDACO) {
      saida.push(atual);
      atual = [];
      n = 0;
    }
    atual.push(p);
    n += (n ? 1 : 0) + p.w.length;
    // pontuação fecha o pedaço quando ele já tem corpo
    const prox = palavras[i + 1];
    if (prox && /[.,;:!?…]$/.test(p.w) && n >= 6) {
      saida.push(atual);
      atual = [];
      n = 0;
    }
  });
  if (atual.length) saida.push(atual);
  return saida;
};

export const Legendas: React.FC<{ frases: Frase[]; y: number; visivel?: number }> = ({ frases, y, visivel = 1 }) => {
  const t = useTempo();
  const frase = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!frase || visivel <= 0) return null;
  const partes = pedacos(frase.palavras);
  const atual = [...partes].reverse().find((p) => t >= p[0].em - 0.05) ?? partes[0];
  const ativa = [...atual].reverse().find((p) => t >= p.em - 0.04);
  const fim = prog(t, frase.ate - 0.08, 0.08);

  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        right: MARGEM,
        top: y,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "10px 0.3em",
        fontFamily: display,
        fontWeight: 700,
        fontSize: TAMANHO,
        lineHeight: 1.12,
        letterSpacing: `${APERTO}em`,
        color: cor.gelo,
        textShadow: "0 2px 16px rgba(0,0,0,0.55)",
        opacity: visivel * (1 - fim),
      }}
    >
      {atual.map((p, i) => {
        const aqui = t >= p.em - 0.04;
        const vez = p === ativa;
        return (
          <span
            key={`${p.w}-${p.em}-${i}`}
            style={{
              position: "relative",
              opacity: aqui ? 1 : 0,
              translate: `0 ${(1 - prog(t, p.em - 0.04, 0.2)) * 16}px`,
            }}
          >
            {vez ? (
              <span style={{ position: "absolute", left: "-0.14em", right: "-0.14em", top: "0.02em", bottom: "0.02em", background: cor.cobalto }} />
            ) : null}
            <span style={{ position: "relative", textShadow: vez ? "none" : undefined }}>{caixaAlta(p.w)}</span>
          </span>
        );
      })}
    </div>
  );
};
