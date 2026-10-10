import { prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Areas } from "../layout";
import { encaixar, larguraTexto } from "../medida";
import type { Definicao as DefinicaoT, Palavra } from "../plano";
import { cor, QUADRO, sans } from "../tema";
import { TextoFalado } from "./Texto";

// Definição como um verbete de atlas: o termo entra grande, sublinhado por um traço azul; quando o
// significado é dito, um ponto acende no traço e uma linha-guia desce até o significado, em azul.
export const Definicao: React.FC<{ m: DefinicaoT; t: number; fim: number; areas: Areas; palavras: Palavra[] }> = ({ m, t, fim, areas, palavras }) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  // No quadro deitado, o verbete inteiro (termo, linha-guia e significado) fica centralizado no quadro
  // da esquerda, qualquer que seja o lugar da lupa: a coluna da direita é da pessoa.
  const quadro = areas.quadro;
  const cab = { x: quadro.x, y: quadro.y, w: quadro.w, h: 200 };
  const corpo = quadro;
  const centro = true;
  const anelNum = m.numero ? 96 : 0;
  const termo = encaixar(m.termo, { largura: cab.w - (anelNum ? anelNum + 28 : 0) * (centro ? 2 : 1), max: 120, min: 64, linhas: 2, peso: 800, espacamento: -0.02 });
  const alturaTermo = termo.linhas.length * termo.tamanho * 1.04;
  const significado = encaixar(m.significado, { largura: corpo.w - (centro ? 40 : 60), max: 84, min: 46, linhas: 3, peso: 700, espacamento: -0.01 });
  const alturaSig = significado.linhas.length * significado.tamanho * 1.08;

  const temposTermo = temposDoTexto(m.termo, palavras, m.em, m.ate, Math.max(m.de + 0.06, m.em), m.em - 0.2);
  const temposSig = temposDoTexto(m.significado, palavras, m.significadoEm, m.ate, m.significadoEm, m.significadoEm - 0.2);

  // o termo fica centralizado na altura do cabeçalho; o traço logo abaixo dele
  // embaixo da lupa grande, o verbete inteiro (termo, linha-guia e significado) fica no meio do espaço livre
  const blocoH = alturaTermo + 14 + 110 + alturaSig;
  const livre = corpo.y + corpo.h - cab.y;
  const yTermo = centro ? cab.y + Math.max(0, (livre - blocoH) * 0.42) : cab.y + Math.max(0, (cab.h - alturaTermo) / 2);
  const yTraco = yTermo + alturaTermo + 14;
  const larguraTermo = Math.min(cab.w, Math.max(...termo.linhas.map((l) => larguraTexto(l, termo.tamanho, 800, -0.02))));
  const x0 = centro ? cab.x + (cab.w - larguraTermo) / 2 + (anelNum ? (anelNum + 28) / 2 : 0) : cab.x + (anelNum ? anelNum + 28 : 0);
  const xPonto = centro ? x0 + larguraTermo / 2 : x0 + 24;
  const sublinha = prog(t, m.em + 0.25, 0.5);
  const ponto = prog(t, m.significadoEm - 0.1, 0.25);
  const guia = prog(t, m.significadoEm - 0.05, 0.35);
  const ySig = centro ? yTraco + 110 : Math.max(corpo.y + 40, yTraco + 110);
  const yGuia = ySig - 22;

  return (
    <>
      {m.numero ? (
        <svg width={anelNum + 8} height={anelNum + 8} style={{ position: "absolute", left: x0 - anelNum - 30, top: yTermo + termo.tamanho * 0.55 - anelNum / 2 - 4, overflow: "visible", opacity: 1 - sai }}>
          <Traco d={`M ${anelNum / 2 + 4} 6 A ${anelNum / 2 - 2} ${anelNum / 2 - 2} 0 1 1 ${anelNum / 2 + 3.99} 6`} p={prog(t, m.de, 0.5)} cor={cor.azul} largura={4.5} />
          <text x={anelNum / 2 + 4} y={anelNum / 2 + 5} textAnchor="middle" dominantBaseline="central" opacity={prog(t, m.de + 0.15, 0.3)} style={{ fontFamily: sans, fontWeight: 700, fontSize: 42, fill: cor.azul, fontVariantNumeric: "tabular-nums" }}>
            {m.numero}
          </text>
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: centro ? cab.x + (anelNum ? (anelNum + 28) / 2 : 0) : x0, top: yTermo, width: centro ? cab.w : cab.x + cab.w - x0, opacity: 1 - sai }}>
        <TextoFalado linhas={termo.linhas} tamanho={termo.tamanho} peso={800} tempos={temposTermo} t={t} alinhar={centro ? "centro" : "esquerda"} entrelinha={1.04} espacamento={-0.02} lapis />
      </div>
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
        <Traco d={`M ${x0} ${yTraco} L ${x0 + larguraTermo} ${yTraco}`} p={sublinha} cor={cor.azul} largura={5} />
        <Traco d={centro ? `M ${xPonto} ${yTraco} L ${xPonto} ${yGuia}` : `M ${xPonto} ${yTraco} L ${xPonto} ${yGuia} L ${xPonto + 36} ${yGuia}`} p={guia} cor={cor.azul} largura={3.5} />
        <circle cx={xPonto} cy={yTraco} r={14 * ponto} fill={cor.branco} />
        <circle cx={xPonto} cy={yTraco} r={9 * ponto} fill={cor.azul} />
        {/* a lápis: onde o significado vai entrar */}
        <circle cx={xPonto} cy={yTraco} r={10} fill="none" stroke={cor.cinzaLinha} strokeWidth={3} opacity={prog(t, m.em + 0.5, 0.3) * (1 - ponto)} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: centro ? corpo.x + 20 : xPonto + 50,
          top: ySig,
          width: centro ? corpo.w - 40 : corpo.x + corpo.w - xPonto - 50,
          height: alturaSig,
          opacity: 1 - sai,
        }}
      >
        <TextoFalado
          linhas={significado.linhas}
          tamanho={significado.tamanho}
          peso={700}
          tempos={temposSig}
          t={t}
          cor={cor.azul}
          alinhar={centro ? "centro" : "esquerda"}
          entrelinha={1.08}
          espacamento={-0.01}
          lapis
        />
      </div>
    </>
  );
};
