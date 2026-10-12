import { prog, saindo, useTempo } from "../anim";
import type { Contexto } from "./contexto";

// Onde um bloco "de lado" fica no quadro de texto: centrado na altura do texto do modelo, sem sair
// da faixa entre a margem de cima e a assinatura. Sai com a borda da caixa (ou a cortina) e cresce 3%
// devagar enquanto está na tela (nada fica parado). No quadro deitado a faixa é baixa: um bloco que
// medir mais alto que ela encolhe por inteiro (na mesma proporção) até caber, nunca vaza.
export const encolherPara = (altura: number, ctx: { topo: number; base: number }) =>
  altura > 0 ? Math.min(1, (ctx.base - ctx.topo) / altura) : 1;
// topo de um bloco de `altura` px (já encolhido) centrado em `yc` dentro da faixa
export const topoNaFaixa = (altura: number, ctx: { topo: number; base: number; yc: number }) =>
  Math.max(ctx.topo, Math.min(ctx.yc - altura / 2, ctx.base - altura));
export const NaColuna: React.FC<{ ctx: Contexto; de: number; altura: number; children: React.ReactNode }> = ({
  ctx,
  de,
  altura,
  children,
}) => {
  const t = useTempo();
  const encolhe = encolherPara(altura, ctx);
  const topo = topoNaFaixa(altura * encolhe, ctx);
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
      {encolhe < 1 ? (
        <div style={{ width: ctx.coluna.w / encolhe, height: altura, scale: String(encolhe), transformOrigin: "left top" }}>{children}</div>
      ) : (
        children
      )}
    </div>
  );
};
