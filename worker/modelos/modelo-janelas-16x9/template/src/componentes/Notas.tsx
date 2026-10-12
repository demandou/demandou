// Definição e frase: janelas de texto do desktop.
// Definição = o termo grande numa janela de dicionário, sublinhado tracejado como um link; no
// significado, o mouse passa por cima e um balão de ajuda abre com o significado dito.
// Frase = uma nota onde a frase é digitada no ritmo da fala, com o cursor de texto; o `destaque`
// fica violeta; o `risco` é selecionado pelo mouse e riscado quando é dito.
import { janelaAberta, limitar, prog, temposDoTexto } from "../anim";
import { geoDefinicao, geoFrase } from "../blocos";
import { ICONES_DOCK, iconeDoTipo, posDock } from "../geometria";
import { trechoNoTexto } from "../medida";
import type { Definicao, Frase, Palavra, Plano } from "../plano";
import { TextoFalado } from "../texto";
import { BARRA_JANELA, cor } from "../tema";
import { Janela } from "./Janela";

const origemDe = (tipo: "definicao" | "frase") => posDock(Math.max(0, ICONES_DOCK.indexOf(iconeDoTipo[tipo] ?? "nota")));

export const BlocoDefinicao: React.FC<{ m: Definicao; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const g = geoDefinicao(plano, m);
  const aberta = janelaAberta(t, m.de, fim);
  const tTermo = temposDoTexto(m.termo, palavras, m.em - 0.3, m.ate, m.em);
  const tSig = temposDoTexto(m.significado, palavras, m.significadoEm - 0.3, m.ate + 0.3, m.significadoEm);
  const pSub = prog(t, (tTermo[tTermo.length - 1] ?? m.em) + 0.2, 0.4);
  const pBalao = prog(t, m.significadoEm - 0.12, 0.3);
  const ox = g.janela.x;
  const oy = g.janela.y + BARRA_JANELA;
  const setaX = Math.min(g.termoX + Math.min(g.termoW, 420) / 2, g.balao.x + g.balao.w - 80) - ox;
  return (
    <Janela x={g.janela.x} y={g.janela.y} w={g.janela.w} h={g.janela.h} titulo="Dicionário" icone="livro" aberta={aberta} origem={origemDe("definicao")}>
      <div style={{ position: "absolute", left: g.termoX - ox, top: g.termoY - oy }}>
        <TextoFalado enc={g.termo} tempos={tTermo} t={t} cor={cor.tinta} esboco={cor.esbocoClaro} alturaLinha={1.04} />
        {/* sublinhado tracejado: o termo é "clicável" */}
        <div style={{ height: 7, marginTop: 6, width: g.termoW * pSub, backgroundImage: `repeating-linear-gradient(90deg, ${cor.violeta} 0 18px, transparent 18px 30px)`, borderRadius: 4 }} />
      </div>
      {/* balão de ajuda: espera a lápis, abre no significado */}
      <div
        style={{
          position: "absolute",
          left: g.balao.x - ox,
          top: g.balao.y - oy,
          width: g.balao.w,
          height: g.balao.h,
          borderRadius: 26,
          border: `3px dashed ${cor.esbocoClaro}`,
          opacity: (1 - pBalao) * prog(t, m.de + 0.5, 0.3),
        }}
      />
      {pBalao > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: g.balao.x - ox,
            top: g.balao.y - oy,
            width: g.balao.w,
            height: g.balao.h,
            borderRadius: 26,
            background: cor.tinta,
            boxShadow: "0 18px 40px rgba(20,14,40,0.28)",
            opacity: limitar(pBalao * 1.6),
            translate: `0 ${(1 - pBalao) * 18}px`,
            transformOrigin: `${setaX}px 0`,
            scale: String(0.94 + 0.06 * pBalao),
          }}
        >
          {/* a ponta do balão aponta para o termo */}
          <div style={{ position: "absolute", left: setaX - 18, top: -16, width: 36, height: 36, background: cor.tinta, rotate: "45deg", borderRadius: 6 }} />
          <div style={{ position: "absolute", left: 40, right: 40, top: 22 }}>
            <TextoFalado enc={g.significado} tempos={tSig} t={t} cor="#FFFFFF" esboco="rgba(255,255,255,0.28)" fonte={{ peso: 700 }} alturaLinha={1.14} />
          </div>
        </div>
      ) : null}
    </Janela>
  );
};

export const BlocoFrase: React.FC<{ m: Frase; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const g = geoFrase(plano, m);
  const aberta = janelaAberta(t, m.de, fim);
  const inicio = m.em ?? m.de + 0.35;
  const tempos = temposDoTexto(m.texto, palavras, inicio - 0.3, m.ate, inicio);
  const destaque = trechoNoTexto(m.texto, m.destaque);
  const riscoEm = m.riscoEm ?? (g.risco ? tempos[g.risco[0]] + 0.2 : 0);
  // a seleção do mouse corre pelas palavras do risco logo antes dele ser riscado
  const pSel = g.risco ? prog(t, riscoEm - 0.45, 0.4) * (1 - prog(t, riscoEm + 0.5, 0.25)) : 0;
  const ox = g.janela.x;
  const oy = g.janela.y + BARRA_JANELA;
  const ultimaLetra = (tempos[tempos.length - 1] ?? inicio) + 0.4;
  return (
    <Janela x={g.janela.x} y={g.janela.y} w={g.janela.w} h={g.janela.h} titulo="Notas" icone="nota" aberta={aberta} origem={origemDe("frase")}>
      {/* seleção: fundo violeta-claro atrás das palavras do risco */}
      {g.risco && pSel > 0.001
        ? (() => {
            const [a, b] = g.risco;
            const n = b - a + 1;
            return g.caixas.slice(a, b + 1).map((c, k) => {
              const parte = limitar(pSel * n - k);
              if (parte <= 0) return null;
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: c.x - ox - 6,
                    top: c.y - oy + c.h * 0.06,
                    width: (c.w + 12) * parte,
                    height: c.h * 0.88,
                    background: cor.violetaFundo2,
                    borderRadius: 8,
                  }}
                />
              );
            });
          })()
        : null}
      <div style={{ position: "absolute", left: g.x0 - ox, top: g.y0 - oy }}>
        <TextoFalado
          enc={g.texto}
          tempos={tempos}
          t={t}
          modo="digita"
          cor={cor.tinta}
          corDe={(i) => (destaque && i >= destaque[0] && i <= destaque[1] ? cor.violeta : undefined)}
          alturaLinha={g.lh}
          risco={g.risco ? { de: g.risco[0], ate: g.risco[1], em: riscoEm, cor: cor.violeta, corTexto: cor.tintaSuave } : null}
          cursor={{ cor: cor.violeta, ate: ultimaLetra }}
        />
      </div>
    </Janela>
  );
};
