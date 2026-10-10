// Bloco universal `comparacao`: duas amostras lado a lado no caderno. Cada caixa chega esboçada a
// lápis e é passada a tinta na fala do lado dela, com o nome impresso em cima e o texto à mão; entre
// as duas, um "×" (contra) ou uma seta (antes → depois); no errado × certo, um ✗ vermelhão e um ✓
// azul desenhados à mão. Com `vencedor`, a amostra vencedora ganha um círculo a tinta azul.
import { caneta, limitar, prog } from "../anim";
import { Impresso } from "../componentes/Cabecalho";
import { ajustar } from "../medir";
import type { Comparacao } from "../plano";
import { Definicoes, Esboco, Seta, Traco } from "../tinta/Tinta";
import { cor, H, W } from "../tema";
import type { PropsFigura } from "./comum";
import { prepararTexto, TextoAMao } from "./texto";
import { cabecalhoDoBloco } from "./Topo";

const retangulo = (x: number, y: number, w: number, h: number) => `M ${x + 4} ${y} L ${x + w} ${y + 3} L ${x + w - 3} ${y + h} L ${x} ${y + h - 2} Z`;

// o contorno de uma oval à mão em volta de uma caixa
const oval = (cx: number, cy: number, rx: number, ry: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 52; i++) {
    const ang = ((-100 + (370 * i) / 52) * Math.PI) / 180;
    const k = 1 + 0.015 * Math.sin(i * 0.8);
    pts.push(`${i === 0 ? "M" : "L"} ${(cx + rx * k * Math.cos(ang)).toFixed(1)} ${(cy + ry * k * Math.sin(ang)).toFixed(1)}`);
  }
  return pts.join(" ");
};

export const Amostras: React.FC<PropsFigura<Comparacao>> = ({ m, t, areas, palavras, chegada, revela, opCabecalho, rotulo, id }) => {
  const cab = cabecalhoDoBloco({ areas, t, de: m.de, ate: m.ate, palavras, chegada, revela, rotulo, titulo: m.titulo, opacidade: opCabecalho });
  const a = cab.corpo;
  const modo = m.modo ?? "contra";
  const vao = 104;
  const w = (a.w - vao) / 2;
  const inicio = chegada + 0.3;
  const lados = m.lados.slice(0, 2);
  // um corpo só para os dois textos (o do mais longo)
  const corpo = Math.min(...lados.map((l) => ajustar(l.texto, w - 56, 96, 50, 3).corpo));
  const maisLinhas = Math.max(...lados.map((l) => ajustar(l.texto, w - 56, corpo, Math.min(corpo, 50), 3).linhas.length));
  // a caixa tem a altura do conteúdo (com folga), dentro da área
  const h = Math.max(380, Math.min(a.h - 70, 92 + maisLinhas * corpo * 1.12 + 190));
  const y0 = a.y + Math.max(24, (a.h - h) / 2);
  const caixas = lados.map((l, i) => {
    const x = a.x + i * (w + vao);
    const em = Math.max(l.em, inicio);
    const texto = prepararTexto({ texto: l.texto, larguraMax: w - 56, max: corpo, min: Math.min(corpo, 50), linhas: 3, palavras, de: l.em - 0.3, ate: lados[i + 1]?.em ?? m.ate, inicio: em, em: l.em });
    return { x, em, texto, p: prog(t, em - 0.25, 0.5, caneta), l };
  });
  const segundo = caixas[1]?.em ?? m.ate;
  const temVencedor = m.vencedor === 0 || m.vencedor === 1;
  const vencedorEm = Math.max(m.vencedorEm ?? segundo + 0.7, inicio);
  const pVence = temVencedor ? prog(t, vencedorEm, 0.6, caneta) : 0;
  const meioX = a.x + w + vao / 2;
  const meioY = y0 + h / 2;
  const pSinal = prog(t, segundo + 0.1, 0.4, caneta);
  return (
    <>
      {cab.elemento}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        {caixas.map((c, i) => (
          <g key={i}>
            <Esboco d={retangulo(c.x, y0, w, h)} opacidade={1 - c.p} />
            <g filter={`url(#${id}-mao)`}>
              <Traco d={retangulo(c.x, y0, w, h)} p={c.p} largura={5} />
              {/* a régua embaixo do nome impresso */}
              <Traco d={`M ${c.x + 24} ${y0 + 92} L ${c.x + w - 24} ${y0 + 92}`} p={prog(t, c.em, 0.4)} largura={3} opacidade={0.55} />
            </g>
          </g>
        ))}
        {/* o sinal entre as amostras */}
        {modo === "contra" ? (
          <g filter={`url(#${id}-mao)`}>
            <Traco d={`M ${meioX - 32} ${meioY - 32} L ${meioX + 32} ${meioY + 32}`} p={limitar(pSinal * 2)} largura={9} />
            <Traco d={`M ${meioX + 32} ${meioY - 32} L ${meioX - 32} ${meioY + 32}`} p={limitar(pSinal * 2 - 1)} largura={9} />
          </g>
        ) : null}
        {modo === "antes-depois" ? <Seta de={{ x: meioX - 34, y: meioY }} ate={{ x: meioX + 34, y: meioY }} p={pSinal} curva={0.08} largura={7} ponta={22} /> : null}
        {modo === "errado-certo"
          ? caixas.map((c, i) => {
              const p = prog(t, c.em + 0.35, 0.4, caneta);
              const x = c.x + w - 58;
              const y = y0 + 40;
              return i === 0 ? (
                <g key={`s${i}`}>
                  <Traco d={`M ${x - 22} ${y - 22} L ${x + 22} ${y + 22}`} p={limitar(p * 2)} cor={cor.vermelho} largura={8} />
                  <Traco d={`M ${x + 22} ${y - 22} L ${x - 22} ${y + 22}`} p={limitar(p * 2 - 1)} cor={cor.vermelho} largura={8} />
                </g>
              ) : (
                <Traco key={`s${i}`} d={`M ${x - 24} ${y} L ${x - 6} ${y + 20} L ${x + 26} ${y - 24}`} p={p} cor={cor.azul} largura={8} />
              );
            })
          : null}
        {/* a vencedora: círculo a tinta azul em volta da caixa */}
        {temVencedor && pVence > 0 && m.vencedor !== undefined ? (
          <Traco d={oval(caixas[m.vencedor].x + w / 2, y0 + h / 2, w / 2 + 30, h / 2 + 34)} p={pVence} cor={cor.azul} largura={6} opacidade={0.9} />
        ) : null}
      </svg>
      {caixas.map((c, i) => {
        const perde = temVencedor && m.vencedor !== i ? 0.45 * pVence : 0;
        const nomeP = prog(t, c.em - 0.1, 0.3);
        return (
          <div key={i} style={{ position: "absolute", left: c.x, top: y0, width: w, height: h, opacity: 1 - perde }}>
            <div style={{ position: "absolute", left: 24, right: modo === "errado-certo" ? 96 : 24, top: 38, display: "flex", justifyContent: modo === "errado-certo" ? "flex-start" : "center", opacity: 0.35 + 0.65 * nomeP }}>
              <Impresso texto={c.l.rotulo} larguraMax={w - (modo === "errado-certo" ? 120 : 48)} estilo={{ color: i === 1 && modo !== "contra" ? cor.azul : cor.tintaSuave }} />
            </div>
            <div style={{ position: "absolute", left: 28, top: 92 + (h - 92 - c.texto.altura) / 2, width: w - 56 }}>
              <TextoAMao pronto={c.texto} t={t} alinhar="center" />
            </div>
          </div>
        );
      })}
    </>
  );
};
