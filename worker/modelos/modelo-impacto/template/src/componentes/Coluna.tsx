import { prog, saindo, useTempo } from "../anim";
import type { Contexto } from "./contexto";

// Onde um bloco "de lado" fica na coluna livre: centrado na altura do texto do modelo, sem sair da
// faixa entre o topo da tela e a assinatura. Sai com a borda da caixa (ou a cortina) e cresce 3%
// devagar enquanto está na tela (nada fica parado).
export const NaColuna: React.FC<{ ctx: Contexto; de: number; altura: number; children: React.ReactNode }> = ({
  ctx,
  de,
  altura,
  children,
}) => {
  const t = useTempo();
  const topo = Math.max(ctx.topo, Math.min(ctx.yc - altura / 2, ctx.base - altura));
  const s = saindo(t, ctx.saida, 0.12);
  const empurrao = 1 + 0.03 * prog(t, de, Math.max(1, ctx.fim - de), (x) => x);
  return (
    <div
      style={{
        position: "absolute",
        left: ctx.coluna.x,
        top: topo,
        width: ctx.coluna.w,
        height: altura,
        opacity: 1 - s,
        scale: String(empurrao),
        transformOrigin: ctx.vemDe === "direita" ? "left center" : "right center",
      }}
    >
      {children}
    </div>
  );
};
