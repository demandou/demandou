import { saindo, temposDasPalavras, useTempo, usePalavras } from "../anim";
import type { Fala as FalaT } from "../plano";
import { cor, serif, sombra } from "../tema";
import { RotuloDeCredito } from "./Cartela";
import { LinhasEmFoco, quebrarEmLinhas } from "./Foco";

// Fala de personagem, como diálogo de romance brasileiro: travessão, itálico, e quem disse num
// crédito âmbar logo abaixo. Fica parada no meio da barra de baixo, no lugar da narração.
export const Fala: React.FC<{ m: FalaT; centro: number }> = ({ m, centro }) => {
  const t = useTempo();
  const palavras = usePalavras();
  const textos = m.texto.split(/\s+/).filter(Boolean);
  const tempos = temposDasPalavras(palavras, m.de, textos, m.quemEm ?? m.ate);
  const temQuem = !!m.quem && m.quemEm !== undefined;
  // os travessões são "palavras" também: o de abertura entra com a fala, o de fechamento com o "ele disse"
  const sequencia = [
    { w: "—", em: m.de - 0.05 },
    ...textos.map((w, i) => ({ w, em: tempos[i] })),
    ...(temQuem ? [{ w: "—", em: (m.quemEm as number) - 0.1 }] : []),
  ];
  const tamanho = Math.min(84, Math.floor(940 / (Math.min(30, sequencia.map((p) => p.w).join(" ").length) * 0.42)));
  const linhas = quebrarEmLinhas(sequencia, tamanho, 940);
  const sai = saindo(t, m.ate, 0.35);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: centro,
        translate: "0 -50%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        opacity: 1 - sai,
        filter: sai > 0.02 ? `blur(${(sai * 6).toFixed(2)}px)` : undefined,
      }}
    >
      <LinhasEmFoco
        linhas={linhas}
        entrada={m.de}
        estilo={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: tamanho, lineHeight: 1.16, color: cor.marfim, textShadow: sombra }}
        estiloPalavra={(w) => (w === "—" ? { color: cor.ambar, fontStyle: "normal" } : undefined)}
      />
      {temQuem ? <RotuloDeCredito texto={m.quem as string} em={(m.quemEm as number) - 0.05} tamanho={34} /> : null}
    </div>
  );
};
