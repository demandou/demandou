import { Escrita, indicesDoTrecho, prog, saindo, temposDoTexto } from "../anim";
import type { Cta, Dica, Palavra, Plano } from "../plano";
import { encaixar, encaixarLinhas } from "../medida";
import { cor, destaque, fonte, LIMITE_APP, rotulo, TAM, texto, X0, X1 } from "../tema";

// ---------- dica: a ficha no peito com uma frase ----------

export const CartaoDica: React.FC<{
  m: Dica;
  fichaY: number;
  t: number;
  palavras: Palavra[];
  entra: number;
  sai: number;
  // false quando a ficha seguinte sobe por cima desta (ela fica inteira até ser coberta)
  someNaSaida?: boolean;
}> = ({ m, fichaY, t, palavras, entra, sai, someNaSaida = true }) => {
  const s = someNaSaida ? saindo(t, sai + 0.25, 0.25) : 0;
  const e = prog(t, entra + 0.1, 0.35);
  if (s >= 1 || e <= 0) return null;
  // o texto medido: até 3 linhas na largura da ficha, de 96 px até 72 px (e menos, se a ficha estiver baixa)
  const H = LIMITE_APP - 20 - fichaY - 48;
  let max = TAM.dica;
  const medir = () =>
    m.linhas?.length
      ? encaixarLinhas(m.linhas.slice(0, 3), { largura: X1 - X0, max, min: Math.min(TAM.dicaMinimo, max), linhas: 3 })
      : encaixar(m.texto ?? "", { largura: X1 - X0, max, min: Math.min(TAM.dicaMinimo, max), linhas: 3 });
  let fit = medir();
  while (TAM.rotulo + 18 + fit.linhas.length * fit.corpo * 1.04 > H && max > 64) {
    max -= 6;
    fit = medir();
  }
  const linhas = fit.linhas;
  const corpo = fit.corpo;
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const inicio = m.em ?? m.de + 0.2;
  const tempos = temposDoTexto(linhas.join(" "), palavras, Math.min(m.de, inicio - 0.3), m.ate, inicio);
  const grifo = indicesDoTrecho(todas, m.destaque);
  // o bloco fica no meio da parte visível da ficha (do topo dela até a interface do app)
  const altura = TAM.rotulo + 18 + linhas.length * corpo * 1.04;
  const topo = fichaY + Math.max(48, (LIMITE_APP - 20 - fichaY - altura) / 2);
  return (
    <div style={{ position: "absolute", left: X0, top: topo, opacity: Math.min(e, 1 - s), fontFamily: texto, color: cor.cacau }}>
      <div style={{ ...rotulo, marginBottom: 18 }}>{m.rotulo ?? "Dica"}</div>
      <Escrita
        linhas={linhas}
        tempos={tempos}
        t={t}
        esboco={cor.lapis}
        style={{ fontFamily: fonte, fontSize: corpo, lineHeight: 1.04 }}
        estiloDe={(i) => (grifo.has(i) ? destaque : undefined)}
      />
    </div>
  );
};

// ---------- fechamento: a ficha volta ao peito; uma fita marca a receita como salva ----------

export const Fechamento: React.FC<{ m: Cta; fichaY: number; t: number; palavras: Palavra[]; marca: Plano["marca"]; entra: number }> = ({
  m,
  fichaY,
  t,
  palavras,
  marca,
  entra,
}) => {
  const e = prog(t, entra, 0.3);
  if (e <= 0) return null;
  // a chamada (grande) e o apoio (itálico, menor). `texto` + `apoio`; ou, no formato antigo,
  // `linhas` (a última vira o apoio quando há mais de uma).
  const antigas = m.linhas?.length ? m.linhas.slice(0, 3) : null;
  const textoPrincipal = antigas ? (antigas.length > 1 ? antigas.slice(0, -1) : antigas) : [m.texto ?? ""];
  const apoioTexto = m.apoio ?? (antigas && antigas.length > 1 ? antigas[antigas.length - 1] : null);
  // à direita fica o pote pronto (ou a panela): o texto usa a coluna da esquerda
  const largura = X1 - 330 - X0;
  const fonteApoio = { familia: "texto" as const, italico: true };
  // tudo precisa caber entre o topo da ficha e a interface do app; a assinatura sai se não couber
  const H = LIMITE_APP - 16 - (fichaY + 54);
  let max = TAM.fechamento;
  const medir = () => {
    const p = antigas
      ? encaixarLinhas(textoPrincipal, { largura, max, min: Math.min(TAM.fechamentoMinimo, max), linhas: 3 })
      : encaixar(textoPrincipal[0], { largura, max, min: Math.min(TAM.fechamentoMinimo, max), linhas: 3 });
    const a = apoioTexto ? encaixar(apoioTexto, { largura, max: Math.min(TAM.apoio, Math.round(max * 0.78)), min: 46, linhas: 2, fonte: fonteApoio }) : null;
    return { p, a, altura: p.linhas.length * p.corpo * 1.0 + (a ? 16 + a.linhas.length * a.corpo * 1.06 : 0) };
  };
  let fit = medir();
  while (fit.altura > H && max > 64) {
    max -= 6;
    fit = medir();
  }
  const principais = fit.p.linhas;
  const corpo = fit.p.corpo;
  const apoio = fit.a?.linhas ?? [];
  const corpoApoio = fit.a?.corpo ?? TAM.apoio;
  const todas = principais.join(" ").split(/\s+/).filter(Boolean);
  const inicio = m.em ?? m.de + 0.15;
  const tempos = temposDoTexto([...principais, ...apoio].join(" "), palavras, Math.min(m.de, inicio - 0.3), m.ate, inicio);
  const grifo = indicesDoTrecho(todas, m.destaque);
  const em = m.em ?? tempos[0] ?? m.de;
  const icone = m.icone ?? "salvar";
  const fita = prog(t, em, 0.55);
  const nome = [marca.nome, marca.area].filter(Boolean).join(" · ");
  // a assinatura vai abaixo do texto (e do pote), se couber acima da interface do app
  const yAssinatura = Math.max(fichaY + 486, fichaY + 54 + fit.altura + 34);
  const comAssinatura = !!nome && yAssinatura + TAM.assinatura <= LIMITE_APP - 6;
  // a fita fica na borda direita da ficha, ao lado do pote
  const xFita = X1 - 28;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: texto, color: cor.cacau, opacity: e }}>
      <div style={{ position: "absolute", left: X0, top: fichaY + 54 }}>
        <Escrita
          linhas={principais}
          tempos={tempos}
          t={t}
          esboco={cor.lapis}
          style={{ fontFamily: fonte, fontSize: corpo, lineHeight: 1.0 }}
          estiloDe={(i) => (grifo.has(i) ? destaque : undefined)}
        />
        {apoio.length ? (
          <Escrita
            linhas={apoio}
            tempos={tempos.slice(todas.length)}
            t={t}
            esboco={cor.lapis}
            style={{ fontSize: corpoApoio, fontStyle: "italic", marginTop: 16, lineHeight: 1.06 }}
          />
        ) : null}
      </div>
      {/* a assinatura vai embaixo, na largura toda (abaixo do pote) */}
      {comAssinatura ? (
        <div
          style={{
            position: "absolute",
            left: X0,
            top: yAssinatura,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: TAM.assinatura,
            fontStyle: "italic",
            color: cor.cacauSuave,
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}
        >
          <div style={{ width: 44, height: 4, background: cor.pistache }} />
          {nome}
        </div>
      ) : null}

      {icone === "salvar" ? (
        // a fita de marcador desce da borda da ficha quando "salva" é dito
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {(() => {
            const w = 74;
            const h = 30 + 180 * fita;
            const x = xFita - w / 2;
            const y = fichaY - 2;
            const d = `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x + w / 2} ${y + h - 28 * fita} L${x} ${y + h} Z`;
            return (
              <>
                <path d={d} fill={fita > 0.02 ? cor.pistache : "none"} stroke={fita > 0.02 ? cor.cacau : cor.lapis} strokeWidth={4} strokeLinejoin="round" strokeDasharray={fita > 0.02 ? undefined : "8 8"} />
                <path d={`M${x + 15} ${y + 18} L${x + 15} ${y + h - 32 * fita}`} stroke="rgba(255,255,255,0.45)" strokeWidth={4} strokeLinecap="round" opacity={fita} />
              </>
            );
          })()}
        </svg>
      ) : (
        <div
          style={{
            position: "absolute",
            left: xFita - 64,
            top: fichaY + 40,
            width: 104,
            height: 104,
            borderRadius: 52,
            border: `4px solid ${cor.cacau}`,
            boxSizing: "border-box",
            background: fita > 0.5 ? cor.pistache : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: String(0.8 + 0.2 * fita),
          }}
        >
          <svg viewBox="0 0 40 40" width={56} height={56}>
            {icone === "link" ? (
              // dois elos de corrente: o link
              <g fill="none" stroke={cor.cacau} strokeWidth={3.6} strokeLinecap="round">
                <path d="M17 23 L12 28 Q8 32 12 36 Q16 40 20 36 L25 31" transform="translate(-1 -6)" />
                <path d="M23 17 L28 12 Q32 8 36 12 Q40 16 36 20 L31 25" transform="translate(-6 -1)" />
                <path d="M16 24 L24 16" />
              </g>
            ) : icone === "seguir" ? (
              fita > 0.5 ? (
                <path d="M10 21 L17 28 L30 13" fill="none" stroke={cor.cacau} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M20 9 L20 31 M9 20 L31 20" fill="none" stroke={cor.cacau} strokeWidth={4.5} strokeLinecap="round" />
              )
            ) : (
              <path d="M8 10 Q8 6 12 6 L28 6 Q32 6 32 10 L32 24 Q32 28 28 28 L18 28 L11 34 L12 28 Q8 28 8 24 Z" fill="none" stroke={cor.cacau} strokeWidth={3.5} strokeLinejoin="round" />
            )}
          </svg>
        </div>
      )}
    </div>
  );
};
