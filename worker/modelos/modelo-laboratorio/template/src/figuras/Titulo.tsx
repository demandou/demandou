// Abertura: a página do caderno com a linha impressa (experimento / assunto) e a pergunta escrita
// à mão palavra por palavra; o destaque ganha um sublinhado a lápis de cor.
import { emCascata, prog, temposDoTexto } from "../anim";
import { Impresso } from "../componentes/Cabecalho";
import { ajustar } from "../medir";
import type { Abertura, Titulo as TituloT } from "../plano";
import { comDestaque, corDe, LinhaAMao } from "../tinta/Escrita";
import { Traco } from "../tinta/Tinta";
import { cor, H, W } from "../tema";
import type { PropsFigura } from "./comum";

export const Titulo: React.FC<PropsFigura<TituloT | Abertura>> = ({ m, t, areas, palavras, chegada, revela, rotulo, marca }) => {
  const a = areas.corpo;
  // `abertura` (bloco universal): um texto só, que quebra sozinho em até 3 linhas
  const dadas = m.tipo === "abertura" ? ajustar(m.texto, a.w, 150, 84, 3).linhas : m.linhas.filter(Boolean).slice(0, 3);
  const em = m.tipo === "abertura" ? m.em : undefined;
  // enquanto a pessoa sai da tela cheia, o texto espera o papel aparecer embaixo dela
  const tempos = emCascata(temposDoTexto(dadas.join(" "), palavras, em ?? m.de, m.ate, Math.max(em ?? 0, chegada + 0.2)), revela);
  const papel = prog(t, revela - 0.25, 0.3);
  // o maior corpo em que a linha mais larga cabe (nunca vaza: abaixo de 84 só se uma palavra não couber)
  const linhas = dadas;
  const corpo = Math.min(...linhas.map((l) => ajustar(l, a.w, linhas.length > 2 ? 120 : 150, 84, 1).corpo));
  const corDestaque = corDe(m.corDestaque ?? "azul");
  let k = 0;
  const porLinha = linhas.map((l) => {
    const n = l.split(/\s+/).filter(Boolean).length;
    const ts = tempos.slice(k, k + n);
    k += n;
    return comDestaque(l, ts, m.destaque, corDestaque);
  });
  const esquerda = m.rotulo ?? rotulo ?? "";
  const direita = m.assunto ?? (m.tipo === "abertura" ? (marca?.area ?? "") : "");
  const alturaLinha = corpo * 1.12;
  // o bloco do título fica centrado no espaço abaixo da linha impressa
  const topoTexto = a.y + 66 + Math.max(24, (a.h - 66 - alturaLinha * linhas.length - 30) / 2);
  const ySub = topoTexto + alturaLinha * linhas.length + 6;
  const sub = m.sublinharEm ?? tempos[tempos.length - 1] + 0.35;
  // sublinhado ondulado à mão, embaixo da última linha
  const largSub = Math.min(a.w * 0.62, corpo * 3.4);
  const x0 = W / 2 - largSub / 2;
  const d = `M ${x0} ${ySub} C ${x0 + largSub * 0.3} ${ySub - 14}, ${x0 + largSub * 0.6} ${ySub + 12}, ${x0 + largSub} ${ySub - 6}`;
  return (
    <>
      <div style={{ position: "absolute", left: a.x, top: a.y, width: a.w, display: "flex", justifyContent: "space-between", opacity: papel }}>
        <Impresso texto={esquerda} larguraMax={a.w * 0.6} />
        <Impresso texto={direita} larguraMax={a.w * 0.38} />
      </div>
      <div style={{ position: "absolute", left: a.x, top: a.y + 52, width: a.w, height: 3, background: cor.tinta, opacity: 0.55 * papel }} />
      <div style={{ position: "absolute", left: a.x, top: topoTexto, width: a.w, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {porLinha.map((ps, i) => (
          <div key={i} style={{ height: alturaLinha }}>
            <LinhaAMao palavras={ps} t={t} corpo={corpo} alinhar="center" esboco={papel} />
          </div>
        ))}
      </div>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Traco d={d} p={prog(t, sub, 0.45)} cor={corDestaque} largura={9} opacidade={0.9} />
      </svg>
    </>
  );
};
