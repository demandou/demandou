// Bloco universal `topicos` (lista sem ordem): as observações do caderno. Cada item chega esboçado
// a lápis e é escrito à mão na sua fala, com uma setinha a tinta na frente; a seta do item que está
// sendo dito fica azul e os anteriores descansam um tom abaixo (uma ideia grande por vez).
import { caneta, limitar, prog } from "../anim";
import { ajustar } from "../medir";
import type { Topicos } from "../plano";
import { Seta } from "../tinta/Tinta";
import { cor, H, W } from "../tema";
import type { PropsFigura } from "./comum";
import { prepararTexto, TextoAMao } from "./texto";
import { cabecalhoDoBloco } from "./Topo";

export const Lista: React.FC<PropsFigura<Topicos>> = ({ m, t, areas, palavras, chegada, revela, opCabecalho, rotulo }) => {
  const cab = cabecalhoDoBloco({ areas, t, de: m.de, ate: m.ate, palavras, chegada, revela, rotulo, titulo: m.titulo, opacidade: opCabecalho });
  const a = cab.corpo;
  const itens = m.itens.slice(0, 5);
  const n = Math.max(1, itens.length);
  const recuo = 92;
  const larguraTexto = a.w - recuo - 10;
  const temDetalhe = itens.some((i) => i.detalhe);
  // um corpo só para todos os itens: o do item mais longo, entre 52 e (pelo número de itens) 104
  const inicio = chegada + 0.3;
  const montar = (teto: number, piso: number) => {
    const corpo = Math.min(...itens.map((i) => ajustar(i.texto, larguraTexto, teto, piso, 2).corpo));
    const corpoDetalhe = Math.max(34, Math.min(50, Math.round(corpo * 0.6)));
    const prontos = itens.map((i, k) => {
      const fimItem = itens[k + 1]?.em ?? m.ate;
      const texto = prepararTexto({ texto: i.texto, larguraMax: larguraTexto, max: corpo, min: Math.min(corpo, piso), linhas: 2, palavras, de: i.em - 0.05, ate: fimItem, inicio, em: i.em });
      const detalhe = i.detalhe
        ? prepararTexto({ texto: i.detalhe, larguraMax: larguraTexto, max: corpoDetalhe, min: Math.min(corpoDetalhe, 36), linhas: 2, palavras, de: i.em, ate: fimItem + 0.5, inicio: texto.fim + 0.15, cor: cor.tintaSuave })
        : null;
      return { texto, detalhe, altura: texto.altura + (detalhe ? detalhe.altura + 6 : 0) };
    });
    return { corpo, prontos, total: prontos.reduce((s, p) => s + p.altura, 0) };
  };
  // no quadro deitado a folha é mais baixa: se a pilha não cabe, o corpo encolhe até caber (nada vaza)
  const cabe = a.h - 24 * (n - 1) - 16;
  let teto = n <= 2 ? 104 : n === 3 ? 92 : n === 4 ? 80 : 70;
  let piso = 52;
  let r = montar(teto, piso);
  for (let k = 0; k < 4 && r.total > cabe; k++) {
    teto = Math.max(30, Math.floor(r.corpo * (cabe / r.total)) - 2);
    piso = Math.min(piso, teto);
    r = montar(teto, piso);
  }
  const { prontos, total } = r;
  const vao = Math.max(24, Math.min(temDetalhe ? 80 : n <= 2 ? 130 : 90, (a.h - total) / (n + 0.6)));
  let y = a.y + Math.max(vao * 0.5, (a.h - total - vao * (n - 1)) / 2 - 10);
  const blocos = prontos.map((p, k) => {
    const topo = y;
    y += p.altura + vao;
    return { ...p, topo, em: Math.max(itens[k].em, inicio) };
  });
  // o item atual: o último que já foi dito
  const atual = blocos.reduce((ac, b, k) => (t >= b.em - 0.05 ? k : ac), -1);
  return (
    <>
      {cab.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {blocos.map((b, k) => {
          const yS = b.topo + b.texto.corpo * 0.6;
          const ativo = k === atual;
          return (
            <g key={k}>
              {/* esboço a lápis da setinha, até ela ser passada a tinta */}
              <path d={`M ${a.x + 6} ${yS} L ${a.x + recuo - 26} ${yS}`} stroke={cor.lapis} strokeWidth={3} strokeDasharray="8 7" opacity={1 - prog(t, b.em - 0.2, 0.3)} />
              <Seta de={{ x: a.x + 6, y: yS }} ate={{ x: a.x + recuo - 26, y: yS }} p={prog(t, b.em - 0.2, 0.3, caneta)} curva={0.12} largura={5.5} ponta={18} cor={ativo ? cor.azul : cor.tinta} />
            </g>
          );
        })}
      </svg>
      {blocos.map((b, k) => {
        // os itens já ditos descansam um tom abaixo quando o seguinte começa
        const descansa = k < atual ? 0.42 * limitar(prog(t, blocos[k + 1].em, 0.35)) : 0;
        return (
          <div key={k} style={{ position: "absolute", left: a.x + recuo, top: b.topo, width: larguraTexto, opacity: 1 - descansa }}>
            <TextoAMao pronto={b.texto} t={t} />
            {b.detalhe ? (
              <div style={{ marginTop: 6 }}>
                <TextoAMao pronto={b.detalhe} t={t} />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
