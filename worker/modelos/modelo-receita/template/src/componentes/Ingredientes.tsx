import { Escrita, prog, saindo, temposDoTexto } from "../anim";
import { caiEmDe, DURACAO_QUEDA, linhasDosIngredientes } from "../cena";
import type { Rect } from "../layout";
import type { Ingredientes as TipoIngredientes, Palavra } from "../plano";
import { cor, fonte, rotulo, texto } from "../tema";
import { IconeDesenhado } from "./Icones";

// Os ingredientes, um por linha: cada um nasce a lápis (ícone tracejado, quantidade e nome claros)
// e ganha tinta quando é dito; logo depois o conteúdo cai na panela (sai de baixo da pilha) e a
// linha ganha um visto pistache.
export const Ingredientes: React.FC<{
  m: TipoIngredientes;
  corpo: Rect;
  t: number;
  palavras: Palavra[];
  sai: number;
  semAbertura: boolean;
  // false na troca em que a ficha inteira sai levando tudo junto (nada some antes da hora)
  someNaSaida?: boolean;
}> = ({ m, corpo, t, palavras, sai, semAbertura, someNaSaida = true }) => {
  const s = someNaSaida ? saindo(t, sai + 0.22, 0.22) : 0;
  if (s >= 1) return null;
  const linhas = linhasDosIngredientes(m, corpo);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s, translate: `0 ${-26 * s}px`, fontFamily: texto, color: cor.cacau }}>
      {/* sem abertura e sem título próprio, o rótulo já está no cabeçalho: não repete */}
      {m.titulo || !semAbertura ? <div style={{ ...rotulo, position: "absolute", left: corpo.x, top: corpo.y }}>{m.rotulo ?? "Ingredientes"}</div> : null}
      {m.itens.slice(0, linhas.length).map((it, i) => {
        const l = linhas[i];
        const proximo = m.itens[i + 1]?.em ?? m.ate;
        const tinta = prog(t, it.em - 0.05, 0.3);
        const caiEm = caiEmDe(m, i);
        const pousou = prog(t, caiEm + DURACAO_QUEDA * 0.9, 0.3);
        // o ícone inclina para "despejar" na hora da queda e volta
        const inclina = prog(t, caiEm - 0.12, 0.22) * (1 - prog(t, caiEm + 0.32, 0.35));
        const unidade = l.texto.unidade.join(" ");
        const nome = l.texto.nome.join(" ");
        const tUnidade = unidade ? temposDoTexto(unidade, palavras, it.em - 0.1, proximo, it.em + 0.08) : [];
        const tNome = temposDoTexto(nome, palavras, it.em - (unidade ? 0 : 0.1), proximo, it.em + (unidade ? 0.2 : 0.04));
        const c = l.texto.corpo;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: l.ret.x,
              top: l.ret.y,
              width: l.ret.w,
              height: l.ret.h,
              borderRadius: 32,
              // a linha a lápis também é papel: esconde o começo do que cai por trás dela
              background: tinta > 0.01 ? `rgba(237,227,211,${(0.35 + 0.65 * tinta).toFixed(3)})` : cor.creme,
              border: `3px dashed rgba(201,185,166,${(1 - tinta).toFixed(3)})`,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: l.icone.cx - l.ret.x - l.icone.tamanho / 2,
                top: (l.ret.h - l.icone.tamanho) / 2,
                rotate: `${(-22 * inclina).toFixed(2)}deg`,
                transformOrigin: "50% 70%",
              }}
            >
              <IconeDesenhado icone={it.icone ?? "tigela"} t={t} em={it.em} tamanho={l.icone.tamanho} usado={pousou * 0.6} />
            </div>
            {it.quantidade?.trim() ? (
            <div style={{ position: "absolute", left: l.numero.x - l.ret.x, top: 0, height: l.ret.h, display: "flex", alignItems: "center" }}>
              <Escrita
                linhas={[it.quantidade.trim()]}
                tempos={[it.em - 0.05]}
                t={t}
                esboco={cor.lapis}
                style={{ fontFamily: fonte, fontSize: l.numero.corpo, lineHeight: 0.9, translate: "0 0.04em" }}
              />
            </div>
            ) : null}
            <div
              style={{
                position: "absolute",
                left: l.texto.x - l.ret.x,
                top: 0,
                height: l.ret.h,
                display: "flex",
                flexDirection: l.texto.duasLinhas ? "column" : "row",
                justifyContent: "center",
                alignItems: l.texto.duasLinhas ? "flex-start" : "center",
                columnGap: Math.round(c * 0.28),
              }}
            >
              {unidade ? (
                <Escrita linhas={l.texto.unidade} tempos={tUnidade} t={t} esboco={cor.lapis} style={{ fontSize: c, fontStyle: "italic", lineHeight: 1.04 }} />
              ) : null}
              <Escrita linhas={l.texto.nome} tempos={tNome} t={t} esboco={cor.lapis} style={{ fontSize: c, lineHeight: 1.04 }} />
            </div>
            {/* visto pistache sobre o ícone: o ingrediente já está na panela */}
            <div
              style={{
                position: "absolute",
                left: l.icone.cx - l.ret.x + l.icone.tamanho / 2 - 34,
                top: Math.max(4, (l.ret.h - l.icone.tamanho) / 2 - 8),
                width: 52,
                height: 52,
                borderRadius: 26,
                border: `3px solid ${cor.creme}`,
                boxSizing: "border-box",
                background: cor.pistache,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: pousou,
                scale: String(0.6 + 0.4 * pousou),
              }}
            >
              <svg viewBox="0 0 40 40" width={34} height={34}>
                <path d="M10 21 L17 28 L30 13" fill="none" stroke={cor.cacau} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};
