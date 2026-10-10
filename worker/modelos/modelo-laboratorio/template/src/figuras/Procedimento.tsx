// Bloco universal `passos` (sequência em ordem): o procedimento do experimento. Números em círculos
// a tinta, ligados por um traço que desce de um passo para o outro na fala; o passo da vez é pintado
// de azul a lápis de cor. Tudo chega esboçado a lápis.
import { caneta, prog } from "../anim";
import { ajustar } from "../medir";
import type { Passos } from "../plano";
import { circulo, Definicoes, Esboco, Traco } from "../tinta/Tinta";
import { cor, H, mono, W } from "../tema";
import type { PropsFigura } from "./comum";
import { prepararTexto, TextoAMao } from "./texto";
import { cabecalhoDoBloco } from "./Topo";

export const Procedimento: React.FC<PropsFigura<Passos>> = ({ m, t, areas, palavras, chegada, revela, opCabecalho, rotulo, id }) => {
  const cab = cabecalhoDoBloco({ areas, t, de: m.de, ate: m.ate, palavras, chegada, revela, rotulo, titulo: m.titulo, opacidade: opCabecalho });
  const a = cab.corpo;
  const itens = m.itens.slice(0, 5);
  const n = Math.max(1, itens.length);
  const r = n <= 3 ? 42 : 36;
  const cx = a.x + r + 8;
  const recuo = 2 * r + 46;
  const larguraTexto = a.w - recuo - 10;
  const teto = n <= 2 ? 104 : n === 3 ? 92 : n === 4 ? 78 : 68;
  const corpo = Math.min(...itens.map((i) => ajustar(i.texto, larguraTexto, teto, 52, 2).corpo));
  const corpoDetalhe = Math.max(40, Math.min(50, Math.round(corpo * 0.6)));
  const inicio = chegada + 0.3;
  const prontos = itens.map((i, k) => {
    const fimItem = itens[k + 1]?.em ?? m.ate;
    const texto = prepararTexto({ texto: i.texto, larguraMax: larguraTexto, max: corpo, min: Math.min(corpo, 52), linhas: 2, palavras, de: i.em - 0.05, ate: fimItem, inicio, em: i.em });
    const detalhe = i.detalhe
      ? prepararTexto({ texto: i.detalhe, larguraMax: larguraTexto, max: corpoDetalhe, min: 36, linhas: 2, palavras, de: i.em, ate: fimItem + 0.5, inicio: texto.fim + 0.15, cor: cor.tintaSuave })
      : null;
    return { texto, detalhe, altura: Math.max(2 * r, texto.altura + (detalhe ? detalhe.altura + 6 : 0)) };
  });
  const total = prontos.reduce((s, p) => s + p.altura, 0);
  const vao = Math.max(30, Math.min(96, (a.h - total) / (n + 0.4)));
  let y = a.y + Math.max(vao * 0.4, (a.h - total - vao * (n - 1)) / 2 - 10);
  const blocos = prontos.map((p, k) => {
    const topo = y;
    y += p.altura + vao;
    const em = Math.max(itens[k].em, inicio);
    // o centro do círculo fica na altura da primeira linha do texto
    const cy = topo + Math.max(r, p.texto.corpo * 0.6);
    return { ...p, topo, em, cy };
  });
  const atual = blocos.reduce((ac, b, k) => (t >= b.em - 0.05 ? k : ac), -1);
  return (
    <>
      {cab.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        {blocos.map((b, k) => {
          const prox = blocos[k + 1];
          if (!prox) return null;
          // o traço desce até o próximo passo enquanto ele é dito
          const d = `M ${cx} ${b.cy + r + 8} L ${cx} ${prox.cy - r - 8}`;
          const p = prog(t, Math.max(b.em + 0.3, prox.em - 0.45), 0.45, caneta);
          return (
            <g key={`l${k}`}>
              <Esboco d={d} opacidade={1 - p} />
              <g filter={`url(#${id}-mao)`}>
                <Traco d={d} p={p} largura={5} />
              </g>
            </g>
          );
        })}
        {blocos.map((b, k) => {
          const p = prog(t, b.em - 0.15, 0.4, caneta);
          const ativo = k === atual;
          const pinta = ativo ? prog(t, b.em + 0.1, 0.3) : 0;
          return (
            <g key={k}>
              <Esboco d={circulo(cx, b.cy, r)} opacidade={1 - p} />
              <circle cx={cx} cy={b.cy} r={r - 2} fill={cor.azul} opacity={0.92 * pinta} />
              <circle cx={cx} cy={b.cy} r={r - 2} fill={`url(#${id}-lapis)`} opacity={pinta} />
              <g filter={`url(#${id}-mao)`}>
                <Traco d={circulo(cx, b.cy, r, -110)} p={p} largura={5} />
              </g>
            </g>
          );
        })}
      </svg>
      {blocos.map((b, k) => {
        const p = prog(t, b.em - 0.15, 0.3);
        const ativo = k === atual && t >= b.em + 0.1;
        return (
          <div
            key={`n${k}`}
            style={{
              position: "absolute",
              left: cx - r,
              top: b.cy - r,
              width: 2 * r,
              height: 2 * r,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: mono,
              fontWeight: 700,
              fontSize: Math.round(r * 1.05),
              color: ativo ? "#FFFFFF" : p > 0.5 ? cor.tinta : cor.lapis,
            }}
          >
            {k + 1}
          </div>
        );
      })}
      {blocos.map((b, k) => (
        <div key={k} style={{ position: "absolute", left: a.x + recuo, top: b.cy - b.texto.corpo * 0.6, width: larguraTexto }}>
          <TextoAMao pronto={b.texto} t={t} />
          {b.detalhe ? (
            <div style={{ marginTop: 6 }}>
              <TextoAMao pronto={b.detalhe} t={t} />
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
};
