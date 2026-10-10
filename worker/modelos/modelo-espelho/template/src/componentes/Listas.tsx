// Tópicos e passos na faixa de cima: o título no alto, à esquerda, com um filete dourado, e os
// itens descendo até a linha do espelho, separados por fios finos que se abrem do centro.
// Tópicos (sem ordem): cada item tem um losango, o mesmo que corre na linha do espelho; ele nasce
// vazado (esboço) e se enche de ouro quando o item é dito. Passos (em ordem): círculos numerados
// ligados por um fio dourado que desce até o passo da vez. O item da vez fica inteiro; os já ditos
// apagam um pouco (hierarquia: uma ideia grande por vez).
import { prog, saindo, temposDoTexto, TextoEmLinhas, Traco } from "../anim";
import { geometriaDaLista } from "../blocos";
import type { Palavra, Passos, Topicos } from "../plano";
import { cor, LIMITE_DIREITO, MARGEM_ESQUERDA, sans, serif, TOPO_SEGURO } from "../tema";

const titulo: React.CSSProperties = { fontFamily: serif, fontWeight: 500, color: cor.cafe, letterSpacing: "-0.012em" };
const italico: React.CSSProperties = { fontFamily: serif, fontStyle: "italic", fontWeight: 400, color: cor.cafe };

export const BlocoLista: React.FC<{ m: Topicos | Passos; t: number; fim: number; linhaMaxima: number; palavras: Palavra[] }> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDaLista(m, linhaMaxima);
  const sai = saindo(t, fim, 0.3);
  const passos = m.tipo === "passos";
  const temposTitulo = g.titulo ? temposDoTexto(g.titulo.linhas.join(" "), palavras, m.de, m.ate, m.de + 0.1) : [];
  const fimTitulo = temposTitulo.length ? Math.max(...temposTitulo) : m.de;
  const yFilete = g.titulo ? TOPO_SEGURO + g.titulo.linhas.length * g.titulo.tamanho * 1.04 + 22 : 0;
  // esboço: marcadores e fios aparecem logo no começo, apagados
  const esbocoEm = m.de + 0.15;
  const ditos = g.itens.filter((it) => t >= it.em - 0.05);
  const atual = ditos[ditos.length - 1];
  const xTexto = MARGEM_ESQUERDA + g.coluna;
  // centro do marcador de cada item: na altura da primeira linha do texto
  const centros = g.posicoes.map((y, i) => y + (g.medidos[i].texto.tamanho * 1.06) / 2);
  const xMarca = MARGEM_ESQUERDA + (passos ? 27 : 14);
  // o fio dos passos desce até o círculo do passo da vez
  const yFio = (() => {
    if (!passos || !centros.length) return 0;
    let y = centros[0];
    g.itens.forEach((it, i) => {
      if (i === 0) return;
      const p = prog(t, it.em - 0.35, 0.45);
      y += (centros[i] - centros[i - 1]) * p;
    });
    return y;
  })();

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {g.titulo ? (
        <div style={{ position: "absolute", left: MARGEM_ESQUERDA, top: TOPO_SEGURO }}>
          <TextoEmLinhas linhas={g.titulo.linhas} tempos={temposTitulo} t={t} tamanho={g.titulo.tamanho} entre={1.04} style={titulo} />
        </div>
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {g.titulo ? <Traco d={`M ${MARGEM_ESQUERDA} ${yFilete} L ${MARGEM_ESQUERDA + 64} ${yFilete}`} p={prog(t, fimTitulo + 0.2, 0.5)} cor={cor.ouro} largura={2.4} /> : null}
        {/* fios entre os itens, do centro para fora */}
        {g.posicoes.slice(1).map((y, i) => {
          const yy = y - g.vao / 2;
          const meio = (xTexto + LIMITE_DIREITO) / 2;
          const p = prog(t, esbocoEm + 0.1 + i * 0.07, 0.6);
          return (
            <g key={`f${i}`}>
              <Traco d={`M ${meio} ${yy} L ${xTexto} ${yy}`} p={p} cor={cor.cafeLinha} largura={1.6} />
              <Traco d={`M ${meio} ${yy} L ${LIMITE_DIREITO} ${yy}`} p={p} cor={cor.cafeLinha} largura={1.6} />
            </g>
          );
        })}
        {/* passos: trilho tracejado (esboço) e o fio dourado que desce */}
        {passos && centros.length > 1 ? (
          <>
            <Traco d={`M ${xMarca} ${centros[0]} L ${xMarca} ${centros[centros.length - 1]}`} p={prog(t, esbocoEm, 0.6)} cor={cor.cafeLinha} largura={2} tracejado="4 8" />
            {t >= g.itens[0].em - 0.05 ? <line x1={xMarca} x2={xMarca} y1={centros[0]} y2={yFio} stroke={cor.ouro} strokeWidth={3} /> : null}
          </>
        ) : null}
        {/* marcadores */}
        {g.itens.map((it, i) => {
          const pEsboco = prog(t, esbocoEm + i * 0.08, 0.4);
          const pDito = prog(t, it.em - 0.05, 0.35);
          const y = centros[i];
          const apagado = atual && it !== atual && t >= it.em ? 0.55 : 1;
          if (passos) {
            return (
              <g key={`m${i}`} opacity={pEsboco * apagado}>
                <circle cx={xMarca} cy={y} r={26} fill={cor.champanhe} stroke={pDito > 0 ? cor.ouro : cor.cafeLinha} strokeWidth={2.2} />
                {pDito > 0 ? <circle cx={xMarca} cy={y} r={26 * pDito} fill={cor.ouro} /> : null}
                <text
                  x={xMarca}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ fontFamily: sans, fontWeight: 500, fontSize: 30, fill: pDito > 0.5 ? cor.champanhe : cor.cafeSuave }}
                >
                  {i + 1}
                </text>
              </g>
            );
          }
          return (
            <g key={`m${i}`} opacity={pEsboco * apagado} transform={`rotate(45 ${xMarca} ${y})`}>
              <rect x={xMarca - 10} y={y - 10} width={20} height={20} fill="none" stroke={pDito > 0 ? cor.ouro : cor.cafeSuave} strokeWidth={2} />
              {pDito > 0 ? <rect x={xMarca - 10 * pDito} y={y - 10 * pDito} width={20 * pDito} height={20 * pDito} fill={cor.ouro} /> : null}
            </g>
          );
        })}
      </svg>
      {g.itens.map((it, i) => {
        const medido = g.medidos[i];
        const proximo = g.itens[i + 1]?.em ?? m.ate;
        const tempos = temposDoTexto(medido.texto.linhas.join(" "), palavras, it.em, proximo, it.em);
        const fimTexto = tempos.length ? Math.max(...tempos) : it.em;
        const temposDetalhe = medido.detalhe ? temposDoTexto(medido.detalhe.linhas.join(" "), palavras, fimTexto + 0.1, m.ate, fimTexto + 0.25) : [];
        const apagado = atual && it !== atual && t >= it.em ? 0.55 : 1;
        return (
          <div key={i} style={{ position: "absolute", left: xTexto, top: g.posicoes[i], opacity: apagado }}>
            <TextoEmLinhas linhas={medido.texto.linhas} tempos={tempos} t={t} tamanho={medido.texto.tamanho} entre={1.06} style={titulo} />
            {medido.detalhe ? (
              <div style={{ marginTop: 6 }}>
                <TextoEmLinhas linhas={medido.detalhe.linhas} tempos={temposDetalhe} t={t} tamanho={medido.detalhe.tamanho} entre={1.12} style={{ ...italico, color: cor.ouroTexto }} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
