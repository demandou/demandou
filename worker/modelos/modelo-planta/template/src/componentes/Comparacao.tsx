import { limitar, Palavras, preciso, prog, temposDoTexto, Traco } from "../anim";
import { circ, lin, misturarCor, poli, ret } from "../desenho/geometria";
import type { Regiao } from "../layout";
import type { Comparacao as TComparacao, Layout, Palavra } from "../plano";
import { cor, mono, sans, traco } from "../tema";
import { encaixar, larguraTexto } from "../texto";
import { Folha } from "./Folha";
import { IconeTraco } from "./Icones";

// Comparação como duas vistas da mesma prancha: cada lado é uma folha com o nome do lado em caixa alta
// técnica e o texto grande; a vista se desenha (moldura e régua) quando o lado é dito. Entre as duas,
// × (contra) ou a seta da circulação (antes → depois). O lado que perde é riscado em terracota e recua
// para o cinza; o que ganha acende a moldura em terracota. Em errado × certo: × no errado, ✓ no certo.
export const Comparacao: React.FC<{ m: TComparacao; t: number; regiao: Regiao; layout: Layout; palavras: Palavra[] }> = ({
  m,
  t,
  regiao,
  layout,
  palavras,
}) => (
  <Folha t={t} de={m.de} ate={m.ate} palavras={palavras} layout={layout} regiao={regiao} titulo={m.titulo}>
    {(corpo) => <Vistas m={m} t={t} corpo={corpo} palavras={palavras} />}
  </Folha>
);

const Vistas: React.FC<{ m: TComparacao; t: number; corpo: Regiao; palavras: Palavra[] }> = ({ m, t, corpo, palavras }) => {
  const modo = m.modo ?? "contra";
  const gap = 84;
  const pad = 30;
  // prancha alta (cheia): as duas vistas uma sobre a outra, largas; senão, lado a lado
  const empilhar = corpo.h > corpo.w * 0.78;
  const w = empilhar ? corpo.w : (corpo.w - gap) / 2;
  const interna = w - 2 * pad;
  // vencedor: o dado, ou o certo (errado-certo), ou nenhum
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const vencedorEm = m.vencedorEm ?? (vencedor !== undefined ? m.lados[1].em : undefined);
  const pVence = vencedorEm !== undefined ? prog(t, vencedorEm, 0.5, preciso) : 0;
  const antesDepois = modo === "antes-depois";
  // antes → depois: o antes recua quando o depois é dito
  const pRecuo = antesDepois && vencedor === undefined ? prog(t, m.lados[1].em, 0.5) : 0;

  // o mesmo corpo de texto nos dois lados (o maior que cabe nos dois); a vista tem a altura do conteúdo
  const extraMarca = modo === "errado-certo" ? 100 : 0;
  const fixo = pad + 46 + 34 + pad + 20 + extraMarca;
  const alturaLivre = empilhar ? (corpo.h - gap) / 2 - 10 : corpo.h - 10;
  const medir = (max: number) => m.lados.map((l) => encaixar(l.texto, { largura: interna, max, min: 44, linhas: empilhar ? 2 : 4, fonte: { peso: 300 } }));
  let max = empilhar ? 104 : 88;
  let textos = medir(max);
  while (max > 44 && textos.some((x) => fixo + x.linhas.length * x.tamanho * 1.12 > alturaLivre)) {
    max -= 4;
    textos = medir(max);
  }
  const tam = Math.min(...textos.map((x) => x.tamanho));
  const quebras = m.lados.map((l) => encaixar(l.texto, { largura: interna, max: tam, min: tam, linhas: 4, fonte: { peso: 300 } }).linhas);
  const maisLinhas = Math.max(...quebras.map((q) => q.length));
  const h = Math.min(alturaLivre, Math.max(fixo + maisLinhas * tam * 1.12 + 30, Math.min(alturaLivre, empilhar ? 300 : 340)));
  const alturaTotal = empilhar ? 2 * h + gap : h;
  const y = corpo.y + Math.max(0, (corpo.h - alturaTotal) * 0.4);
  // canto de cada vista
  const canto = (i: number) => (empilhar ? { x: corpo.x, y: y + i * (h + gap) } : { x: corpo.x + i * (w + gap), y });
  const pLapis = prog(t, m.de - 0.2, 0.25);

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {m.lados.map((l, i) => {
          const { x, y } = canto(i);
          const pMoldura = prog(t, l.em - 0.1, 0.7, preciso);
          const ganhou = vencedor === i ? pVence : 0;
          const corMoldura = misturarCor(cor.grafite, cor.acento, ganhou);
          return (
            <g key={i}>
              <path d={ret(x, y, w, h)} fill="none" stroke={cor.cinzaClaro} strokeWidth={traco.fino} strokeDasharray="8 8" opacity={pLapis * (1 - pMoldura)} />
              {pMoldura > 0 ? <rect x={x} y={y} width={w} height={h} fill={cor.papel} opacity={limitar(pMoldura * 3)} /> : null}
              <Traco d={ret(x, y, w, h)} p={pMoldura} cor={corMoldura} largura={ganhou > 0.5 ? traco.medio : traco.fino + 0.6} />
              <Traco d={lin(x + pad, y + pad + 46, x + w - pad, y + pad + 46)} p={prog(t, l.em + 0.1, 0.6, preciso)} cor={corMoldura} largura={traco.fino} />
            </g>
          );
        })}
        {/* entre as vistas: × (contra) ou a seta da circulação (antes → depois) */}
        {(() => {
          const cx = empilhar ? corpo.x + corpo.w / 2 : corpo.x + w + gap / 2;
          const cy = empilhar ? y + h + gap / 2 : y + h / 2;
          const p = prog(t, m.lados[1].em - 0.15, 0.5, preciso);
          if (modo === "contra") {
            return (
              <g>
                <circle cx={cx} cy={cy} r={30} fill={cor.papel} opacity={limitar(p * 3)} />
                <Traco d={circ(cx, cy, 30)} p={p} cor={cor.grafite} largura={traco.medio} />
                <Traco d={lin(cx - 11, cy - 11, cx + 11, cy + 11)} p={limitar(p * 2 - 0.6)} cor={cor.grafite} largura={traco.medio} />
                <Traco d={lin(cx + 11, cy - 11, cx - 11, cy + 11)} p={limitar(p * 2 - 0.9)} cor={cor.grafite} largura={traco.medio} />
              </g>
            );
          }
          if (modo === "antes-depois") {
            // a seta da circulação: para a direita (lado a lado) ou para baixo (empilhadas)
            if (empilhar) {
              const y0 = cy - 30;
              const yf = y0 + 60 * p;
              return (
                <g>
                  {p > 0 ? <path d={lin(cx, y0, cx, yf)} stroke={cor.acento} strokeWidth={5.5} strokeDasharray="14 9" /> : null}
                  {p > 0.3 ? <path d={poli([[cx - 14, yf - 18], [cx, yf], [cx + 14, yf - 18]])} fill="none" stroke={cor.acento} strokeWidth={6} /> : null}
                </g>
              );
            }
            const x0 = cx - 34;
            const xf = x0 + 68 * p;
            return (
              <g>
                {p > 0 ? <path d={lin(x0, cy, xf, cy)} stroke={cor.acento} strokeWidth={5.5} strokeDasharray="14 9" /> : null}
                {p > 0.3 ? <path d={poli([[xf - 18, cy - 14], [xf, cy], [xf - 18, cy + 14]])} fill="none" stroke={cor.acento} strokeWidth={6} /> : null}
              </g>
            );
          }
          return null;
        })()}
      </svg>
      {m.lados.map((l, i) => {
        const { x, y } = canto(i);
        const recua = i === 0 ? pRecuo : 0;
        const ganhou = vencedor === i ? pVence : 0;
        const rotulo = l.rotulo.toUpperCase();
        const tamRotulo = Math.max(28, Math.min(34, Math.floor((interna / Math.max(1, larguraTexto(rotulo, 1, { mono: true, espacamento: 0.1 }))) * 1)));
        const marca = modo === "errado-certo" ? (i === 0 ? "x" : "check") : null;
        return (
          <div key={i} style={{ position: "absolute", left: x + pad, top: y + pad, width: interna }}>
            <div
              style={{
                fontFamily: mono,
                fontWeight: 500,
                fontSize: tamRotulo,
                letterSpacing: "0.1em",
                lineHeight: 1.1,
                height: 46,
                color: ganhou > 0.5 ? cor.acento : cor.grafite,
                opacity: prog(t, l.em - 0.1, 0.35),
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {rotulo}
            </div>
            <div style={{ height: 34 }} />
            {/* o texto do lado se monta palavra por palavra na fala; o lado que perde é riscado */}
            <Palavras
              texto={l.texto}
              tempos={temposDoTexto(l.texto, palavras, l.em - 0.3, i === 0 ? m.lados[1].em : m.ate, l.em)}
              t={t}
              risco={vencedor !== undefined && vencedor !== i && vencedorEm !== undefined ? { trecho: l.texto, em: vencedorEm, cor: cor.acento, corDepois: cor.cinza } : undefined}
              style={{ width: interna, fontFamily: sans, fontWeight: 300, fontSize: tam, lineHeight: 1.12, color: recua > 0 ? misturarCor(cor.grafite, cor.cinza, recua) : cor.grafite }}
            />
            {marca ? (
              <div style={{ marginTop: 28, opacity: prog(t, l.em + 0.2, 0.3) }}>
                <IconeTraco nome={marca === "x" ? "erro" : "check"} p={prog(t, l.em + 0.2, 0.6, preciso)} tamanho={72} cor={cor.grafite} />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
