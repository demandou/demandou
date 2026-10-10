import { limitar, mistura, prog, remonta } from "../anim";
import { encaixar } from "../medida";
import type { Definicao as TDefinicao } from "../plano";
import { display, paleta, RAIO, REJUNTE } from "../tema";
import { F_NUMERO, F_TITULO, lapis, respiro, TextoFalado, type PropsBloco } from "./comum";

// Definição: dois ladrilhos do mosaico. O termo, grande, num ladrilho escuro; o significado num ladrilho
// creme que nasce a lápis e se preenche a partir do rejunte quando é dito, com uma peça redonda "=" pousada
// no rejunte entre os dois. Bloco baixo e largo: os dois ficam lado a lado.
export const Definicao: React.FC<PropsBloco<TDefinicao>> = ({ b, t, w, h, util, palavras, janela }) => {
  const alto = Math.min(h, util);
  const G = REJUNTE;
  const ladoALado = h < 560 && w > 800;
  const palT = paleta.tinta;
  const palS = paleta.creme;

  // termo: até 2 linhas, o maior corpo; ocupa ~40% (empilhado) ou ~45% (lado a lado)
  const W0 = ladoALado ? (w - G) * 0.45 : w;
  const padT = respiro(W0, ladoALado ? h : alto * 0.42);
  const termo = encaixar(b.termo, { largura: W0 - 2 * padT, altura: (ladoALado ? alto : alto * 0.42) - 2 * padT, max: 170, min: 56, linhas: 2, fonte: F_NUMERO, entrelinha: 1.0 });
  const H0 = ladoALado ? h : Math.min(alto * 0.48, Math.max(termo.altura + 2 * padT + 10, alto * 0.4));
  // significado
  const x1 = ladoALado ? W0 + G : 0;
  const y1 = ladoALado ? 0 : H0 + G;
  const W1 = ladoALado ? w - W0 - G : w;
  const H1 = ladoALado ? h : h - H0 - G;
  const util1 = ladoALado ? alto : alto - H0 - G;
  const padS = respiro(W1, util1);
  const sig = encaixar(b.significado, { largura: W1 - 2 * padS, altura: util1 - 2 * padS, max: 112, min: 44, linhas: 4, fonte: F_TITULO, entrelinha: 1.08 });

  const p = prog(t, b.significadoEm - 0.12, 0.55, remonta);
  const resto = `${((1 - p) * 100).toFixed(2)}%`;
  const recorte = ladoALado ? `inset(0 ${resto} 0 0)` : `inset(0 0 ${resto} 0)`;
  const pPeca = prog(t, b.significadoEm - 0.05, 0.45);
  const raio = 52;
  const px = ladoALado ? W0 + G / 2 : w / 2;
  const py = ladoALado ? alto / 2 : H0 + G / 2;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* o termo */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W0, height: H0, borderRadius: RAIO, background: palT.fundo }}>
        <div style={{ position: "absolute", left: padT, top: Math.max(padT, (Math.min(H0, alto) - termo.altura) / 2), width: W0 - 2 * padT }}>
          <TextoFalado
            linhas={termo.linhas}
            t={t}
            palavras={palavras}
            janela={janela}
            inicio={b.em - 0.05}
            tamanho={termo.tamanho}
            cor={palT.acento}
            entrelinha={1.0}
            estilo={{ fontFamily: display, fontWeight: 800, letterSpacing: "-0.035em" }}
          />
        </div>
      </div>
      {/* o significado: a lápis até ser dito */}
      <div style={{ position: "absolute", left: x1, top: y1, width: W1, height: H1, borderRadius: RAIO }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, outline: `3px dashed ${lapis(paleta.pagina)}`, outlineOffset: -3, opacity: 1 - p }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: palS.fundo, clipPath: p < 0.999 ? recorte : undefined, opacity: p > 0.001 ? 1 : 0 }} />
        <div style={{ position: "absolute", left: padS, top: Math.max(padS + (ladoALado ? 0 : 20), (util1 - sig.altura) / 2), width: W1 - 2 * padS }}>
          <TextoFalado
            linhas={sig.linhas}
            t={t}
            palavras={palavras}
            janela={janela}
            inicio={b.significadoEm - 0.05}
            tamanho={sig.tamanho}
            cor={palS.texto}
            entrelinha={1.08}
            estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em" }}
          />
        </div>
      </div>
      {/* a peça "=" no rejunte */}
      {pPeca > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: px - raio,
            top: py - raio,
            width: raio * 2,
            height: raio * 2,
            borderRadius: raio,
            background: paleta.gema.fundo,
            boxShadow: `0 0 0 ${G * 0.6}px ${paleta.pagina.fundo}`,
            scale: String(mistura(0.4, 1, pPeca)),
            opacity: limitar(pPeca * 2),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={raio * 1.2} height={raio * 1.2} viewBox="0 0 100 100">
            <path d="M28 40 L72 40 M28 62 L72 62" fill="none" stroke={paleta.gema.texto} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={pPeca < 0.999 ? `${pPeca} 1` : undefined} />
          </svg>
        </div>
      ) : null}
    </div>
  );
};
