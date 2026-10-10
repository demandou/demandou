import { prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Regiao } from "../layout";
import type { Palavra } from "../plano";
import { encaixarTitulo, trechoNoTexto } from "../medida";
import { cor, sans } from "../tema";
import { TextoFalado } from "./Texto";

// Cabeçalho dos momentos de lupa: número num anel (01, 02…) e o título, que se monta na fala.
export const Cabecalho: React.FC<{
  area: Regiao;
  numero?: string;
  titulo: string;
  enfase?: string;
  palavras: Palavra[];
  de: number;
  ate: number;
  t: number;
  fim: number;
  alinhar?: "esquerda" | "centro";
  maxLinhas?: number;
  maximo?: number;
}> = ({ area, numero, titulo, enfase, palavras, de, ate, t, fim, alinhar = "esquerda", maxLinhas = 3, maximo = 88 }) => {
  const s = saindo(t, fim, 0.28);
  if (s >= 1) return null;
  // medido com a fonte de verdade: linhas equilibradas, até `maxLinhas`, cabendo na altura do cabeçalho
  const alturaTexto = area.h - (numero ? 130 : 0);
  const e = encaixarTitulo(titulo, {
    largura: area.w,
    max: maximo,
    min: 60,
    linhas: maxLinhas,
    peso: 700,
    espacamento: -0.015,
    altura: alturaTexto,
    entrelinha: 1.04,
    // ao lado da lupa (coluna estreita), o título fica grande mesmo que quebre em mais linhas
    menosLinhas: alinhar === "centro",
  });
  const tempos = temposDoTexto(titulo, palavras, de, ate, de + 0.15);
  // o número entra com a primeira deixa falada: o ordinal ("Primeiro", "Terceiro") ou a primeira palavra
  // do título, o que vier antes — nunca sozinho, antes de qualquer fala
  const ordinal = palavras.find(
    (p) => p.em >= de - 0.9 && p.em <= de + 1.2 && /^(primeir|segund|terceir|quart|quint|sext|s[eé]tim|oitav|non[oa]|d[eé]cim)/i.test(p.w),
  );
  const entradaNumero = Math.max(de, Math.min(tempos[0] ?? de, ordinal?.em ?? Infinity));
  const anel = prog(t, entradaNumero - 0.08, 0.5);
  const centro = alinhar === "centro";
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y,
        width: area.w,
        height: area.h,
        display: "flex",
        flexDirection: "column",
        justifyContent: centro ? "center" : "flex-start",
        alignItems: centro ? "center" : "flex-start",
        gap: 22,
        opacity: 1 - s,
        translate: `0 ${-16 * s}px`,
      }}
    >
      {numero ? (
        <div style={{ position: "relative", width: 108, height: 108, flexShrink: 0 }}>
          <svg width={108} height={108} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <Traco d="M 54 3 A 51 51 0 1 1 53.99 3" p={anel} cor={cor.azul} largura={4.5} />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 46,
              color: cor.azul,
              letterSpacing: "0.02em",
              opacity: prog(t, entradaNumero + 0.08, 0.3),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {numero}
          </div>
        </div>
      ) : null}
      <TextoFalado
        linhas={e.linhas}
        tamanho={e.tamanho}
        peso={700}
        tempos={tempos}
        t={t}
        destaque={trechoNoTexto(titulo, enfase)}
        alinhar={centro ? "centro" : "esquerda"}
        entrelinha={1.04}
        espacamento={-0.015}
        lapis
      />
    </div>
  );
};
