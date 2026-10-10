import { batida, prog, saindo, useTempo } from "../anim";
import type { Gancho as TGancho } from "../plano";
import { caixaAlta, cor, rotulo } from "../tema";
import { encaixar } from "../texto";
import type { Contexto } from "./contexto";
import { medirPilha, Pilha } from "./Pilha";

// Palavras que batem: a frase de abertura (ou uma frase de efeito) empilhada no lado livre,
// cada palavra no instante em que é dita; a linha em destaque vem no acento.
export const Gancho: React.FC<{ m: TGancho; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const { coluna, yc, vemDe, palavras, fim } = ctx;
  const { linhas, altura } = medirPilha(m.itens, coluna.w, 230, palavras, m.ate);
  const encRotulo = m.rotulo ? encaixar(caixaAlta(m.rotulo), { largura: coluna.w, max: 40, min: 30, maxLinhas: 2, peso: 700, espacamento: 0.16 }) : null;
  const alturaRotulo = encRotulo ? Math.max(70, encRotulo.linhas.length * encRotulo.tamanho * 1.2 + 22) : 0;
  const topo = Math.max(ctx.topo, Math.min(yc - (altura + alturaRotulo) / 2, ctx.base - altura - alturaRotulo));
  const s = saindo(t, ctx.saida, 0.12);
  // empurrão lento: a pilha cresce 3% ao longo do momento (nada fica parado)
  const empurrao = 1 + 0.03 * prog(t, m.de, Math.max(1, fim - m.de), (x) => x);

  return (
    <div
      style={{
        position: "absolute",
        left: coluna.x,
        top: topo,
        width: coluna.w,
        opacity: 1 - s,
        scale: String(empurrao),
        transformOrigin: vemDe === "direita" ? "left center" : "right center",
      }}
    >
      {m.rotulo ? (
        <div style={{ ...rotulo, fontSize: encRotulo?.tamanho ?? 40, lineHeight: 1.2, color: cor.volt, height: alturaRotulo, ...batida(t, m.de + 0.05) }}>
          {encRotulo?.linhas.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      ) : null}
      <Pilha t={t} linhas={linhas} />
    </div>
  );
};
