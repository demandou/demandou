// Anotações à mão: cada linha nasce esboçada a lápis e é escrita palavra por palavra quando é dita,
// com uma setinha a tinta na frente; a última linha pode ganhar uma caixa a tinta (a conclusão).
import { caneta, prog, temposDoTexto } from "../anim";
import { Cabecalho } from "../componentes/Cabecalho";
import { quebrar } from "../medir";
import type { Anotacoes as AnotacoesT } from "../plano";
import { comDestaque, corDe, LinhaAMao } from "../tinta/Escrita";
import { Seta, Traco } from "../tinta/Tinta";
import { H, W } from "../tema";
import type { PropsFigura } from "./comum";

export const Anotacoes: React.FC<PropsFigura<AnotacoesT>> = ({ m, t, areas, palavras, chegada, id, opCabecalho }) => {
  const a = areas.corpo;
  const linhas = m.linhas.slice(0, 4);
  const recuo = 92;
  const larguraTexto = a.w - recuo - 10;
  // um corpo só para todas as linhas (o da linha mais longa), entre 56 e 92; no quadro deitado a
  // folha é mais baixa: se as anotações não cabem na altura, o corpo encolhe até caber (nada vaza)
  const medir = (max: number, min: number) => {
    const quebras = linhas.map((l) => quebrar(l.texto, larguraTexto, max, min, 2));
    const corpo = Math.min(...quebras.map((q) => q.corpo));
    const alturas = quebras.map((q) => q.linhas.length * corpo * 1.12);
    return { quebras, corpo, alturas, total: alturas.reduce((s, h) => s + h, 0) };
  };
  const cabe = a.h - 30 * (linhas.length + 0.1);
  let medida = medir(92, 56);
  for (let k = 0; k < 4 && medida.total > cabe; k++) {
    const teto = Math.max(30, Math.floor(medida.corpo * (cabe / medida.total)) - 2);
    medida = medir(teto, Math.min(56, teto));
  }
  const { quebras, corpo, alturas } = medida;
  const vao = Math.max(30, Math.min(90, (a.h - alturas.reduce((s, h) => s + h, 0)) / Math.max(1, linhas.length + 0.5)));
  let y = a.y + vao * 0.6;
  const blocos = linhas.map((l, i) => {
    const topo = y;
    y += alturas[i] + vao;
    const texto = quebras[i].linhas.join(" ");
    const tempos = temposDoTexto(texto, palavras, l.em - 0.05, m.ate, Math.max(l.em, chegada + 0.3));
    let k = 0;
    const sub = quebras[i].linhas.map((s) => {
      const n = s.split(/\s+/).filter(Boolean).length;
      const ts = tempos.slice(k, k + n);
      k += n;
      return comDestaque(s, ts, l.destaque, corDe(l.cor ?? "azul"));
    });
    return { l, topo, altura: alturas[i], sub, inicio: tempos[0] ?? l.em, fim: tempos[tempos.length - 1] ?? l.em };
  });
  const ultimo = blocos[blocos.length - 1];
  const caixaEm = m.caixaEm;
  const caixa = ultimo
    ? (() => {
        const x0 = a.x + recuo - 26;
        const y0 = ultimo.topo - 18;
        const x1 = a.x + a.w;
        const y1 = ultimo.topo + ultimo.altura + 14;
        return `M ${x0} ${y0} L ${x1} ${y0 - 4} L ${x1 + 4} ${y1} L ${x0 - 3} ${y1 + 3} Z`;
      })()
    : "";
  return (
    <>
      {areas.cabecalho ? (
        <Cabecalho regiao={areas.cabecalho} t={t} de={m.de} ate={m.ate} palavras={palavras} rotulo={m.rotulo} titulo={m.titulo} destaque={m.destaque} corDestaque={m.corDestaque} chegada={chegada} opacidade={opCabecalho} />
      ) : null}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id={`${id}-mao`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={W + 400} height={H + 400}>
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="ruido" />
            <feDisplacementMap in="SourceGraphic" in2="ruido" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {blocos.map((b, i) => (
          <Seta
            key={i}
            de={{ x: a.x + 6, y: b.topo + corpo * 0.62 }}
            ate={{ x: a.x + recuo - 26, y: b.topo + corpo * 0.62 }}
            p={prog(t, b.inicio - 0.2, 0.3, caneta)}
            curva={0.12}
            largura={5}
            ponta={18}
          />
        ))}
        {caixaEm !== undefined && caixa ? (
          <g filter={`url(#${id}-mao)`}>
            <Traco d={caixa} p={prog(t, caixaEm, 0.6, caneta)} largura={5} />
          </g>
        ) : null}
      </svg>
      {blocos.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: a.x + recuo, top: b.topo, width: larguraTexto }}>
          {b.sub.map((ps, k) => (
            <div key={k} style={{ height: corpo * 1.12 }}>
              <LinhaAMao palavras={ps} t={t} corpo={corpo} />
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
