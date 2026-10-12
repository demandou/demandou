// Fechamento: a última página do caderno. Rótulo impresso, a chamada à mão palavra por palavra,
// um ícone desenhado a tinta que se pinta de azul, e a assinatura impressa.
import { caneta, prog, temposDoTexto } from "../anim";
import { Impresso } from "../componentes/Cabecalho";
import { ajustar, caberImpresso } from "../medir";
import type { Cta as CtaT, Plano } from "../plano";
import { comDestaque, LinhaAMao } from "../tinta/Escrita";
import { circulo, Traco } from "../tinta/Tinta";
import { cor, H, mono, W } from "../tema";
import type { PropsFigura } from "./comum";

const ICONES: Record<NonNullable<CtaT["icone"]>, (cx: number, cy: number) => string[]> = {
  // um "+" (seguir)
  seguir: (cx, cy) => [`M ${cx - 24} ${cy} L ${cx + 24} ${cy}`, `M ${cx} ${cy - 24} L ${cx} ${cy + 24}`],
  // marcador de página (salvar)
  salvar: (cx, cy) => [`M ${cx - 18} ${cy - 26} L ${cx + 18} ${cy - 26} L ${cx + 18} ${cy + 28} L ${cx} ${cy + 14} L ${cx - 18} ${cy + 28} Z`],
  // balão de conversa (comentar)
  comentar: (cx, cy) => [`M ${cx - 28} ${cy - 20} L ${cx + 28} ${cy - 20} L ${cx + 28} ${cy + 14} L ${cx - 4} ${cy + 14} L ${cx - 18} ${cy + 28} L ${cx - 16} ${cy + 14} L ${cx - 28} ${cy + 14} Z`],
  // corrente de dois elos (link)
  link: (cx, cy) => [
    `M ${cx - 4} ${cy + 10} L ${cx - 14} ${cy + 20} Q ${cx - 26} ${cy + 30} ${cx - 34} ${cy + 20} Q ${cx - 40} ${cy + 10} ${cx - 30} ${cy} L ${cx - 18} ${cy - 12} Q ${cx - 8} ${cy - 20} ${cx} ${cy - 12}`,
    `M ${cx + 4} ${cy - 10} L ${cx + 14} ${cy - 20} Q ${cx + 26} ${cy - 30} ${cx + 34} ${cy - 20} Q ${cx + 40} ${cy - 10} ${cx + 30} ${cy} L ${cx + 18} ${cy + 12} Q ${cx + 8} ${cy + 20} ${cx} ${cy + 12}`,
    `M ${cx - 12} ${cy + 12} L ${cx + 12} ${cy - 12}`,
  ],
  // seta saindo (compartilhar)
  compartilhar: (cx, cy) => [`M ${cx - 24} ${cy + 22} Q ${cx - 20} ${cy - 14} ${cx + 22} ${cy - 14}`, `M ${cx + 8} ${cy - 28} L ${cx + 24} ${cy - 14} L ${cx + 8} ${cy}`],
};

export const Cta: React.FC<PropsFigura<CtaT> & { marca: Plano["marca"] }> = ({ m, t, areas, palavras, chegada, marca, rotulo }) => {
  const cab = areas.cabecalho;
  // com a foto num canto (pedido do plano), a chamada vai no corpo e o rótulo no cabeçalho
  const area = cab ? { ...areas.corpo, y: areas.corpo.y + 40, h: areas.corpo.h - 40 } : areas.corpo;
  const q = ajustar(m.texto, area.w, 136, 84, 2);
  // no quadro deitado a coluna ao lado da foto é alta: o bloco (rótulo, chamada, ícone) fica no
  // meio da altura dela, nunca colado no alto com o papel vazio embaixo
  const alturaBloco = 108 + q.corpo * 1.1 * q.linhas.length + 86 + 56;
  const a = { ...area, y: area.y + Math.max(0, (area.h - alturaBloco) / 2) };
  const tempos = temposDoTexto(q.linhas.join(" "), palavras, m.em ?? m.de, m.ate + 1, Math.max(m.em ?? 0, chegada + 0.2));
  let k = 0;
  const porLinha = q.linhas.map((l) => {
    const n = l.split(/\s+/).filter(Boolean).length;
    const ts = tempos.slice(k, k + n);
    k += n;
    return comDestaque(l, ts, m.destaque, cor.azul);
  });
  const iconeEm = m.iconeEm ?? tempos[tempos.length - 1] + 0.3;
  const alturaLinha = q.corpo * 1.1;
  const yIcone = a.y + 108 + alturaLinha * q.linhas.length + 86;
  const cx = a.x + a.w / 2 - (marca.nome ? 190 : 0);
  const pIcone = prog(t, iconeEm, 0.45, caneta);
  const pPinta = prog(t, iconeEm + 0.3, 0.35);
  const tracos = ICONES[m.icone ?? "seguir"](cx, yIcone);
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  return (
    <>
      <div style={{ position: "absolute", left: a.x, top: a.y, width: a.w, display: "flex", justifyContent: "center" }}>
        <Impresso texto={m.rotulo ?? rotulo ?? ""} larguraMax={a.w} />
      </div>
      <div style={{ position: "absolute", left: a.x, top: a.y + 52, width: a.w, height: 3, background: cor.tinta, opacity: 0.55 }} />
      <div style={{ position: "absolute", left: a.x, top: a.y + 100, width: a.w, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {porLinha.map((ps, i) => (
          <div key={i} style={{ height: alturaLinha }}>
            <LinhaAMao palavras={ps} t={t} corpo={q.corpo} alinhar="center" />
          </div>
        ))}
      </div>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={cx} cy={yIcone} r={56} fill={cor.azul} opacity={pPinta} />
        <Traco d={circulo(cx, yIcone, 56)} p={pIcone} largura={5} />
        {tracos.map((d, i) => (
          <Traco key={i} d={d} p={prog(t, iconeEm + 0.2 + i * 0.1, 0.25)} largura={7} cor={pPinta > 0.5 ? "#FFFFFF" : cor.tinta} />
        ))}
      </svg>
      {assinatura ? (
        <div
          style={{
            position: "absolute",
            left: cx + 84,
            top: yIcone - 22,
            fontFamily: mono,
            fontWeight: 700,
            fontSize: caberImpresso(assinatura, a.x + a.w - (cx + 84), 36, 30, 0.08),
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: cor.tinta,
            whiteSpace: "nowrap",
            opacity: prog(t, iconeEm + 0.2, 0.35),
            translate: `${(1 - prog(t, iconeEm + 0.2, 0.35)) * -16}px 0`,
          }}
        >
          {assinatura}
        </div>
      ) : null}
    </>
  );
};
