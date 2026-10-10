import { prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Regiao } from "../layout";
import { encaixarTitulo, trechoNoTexto } from "../medida";
import type { Frase as FraseT, Palavra } from "../plano";
import { cor } from "../tema";
import { TextoFalado } from "./Texto";

// Frase de efeito em tela cheia, na névoa: uma marca de anotação (o anel com ponto, como nos rótulos de
// atlas) e a frase grande palavra por palavra; o `destaque` em azul; o `risco` é riscado em vermelho
// quando é dito, palavra por palavra, e fica apagado.
export const Frase: React.FC<{ m: FraseT; t: number; fim: number; area: Regiao; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim, 0.28);
  if (sai >= 1) return null;
  const disponivel = 1530 - area.y - 70;
  const e = encaixarTitulo(m.texto, { largura: area.w, max: 112, min: 56, linhas: 4, peso: 800, espacamento: -0.02, altura: disponivel, entrelinha: 1.04 });
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate, Math.max(m.de + 0.05, inicio), inicio - 0.15);
  const marca = prog(t, Math.max(m.de, inicio) - 0.05, 0.45);
  return (
    <div style={{ position: "absolute", left: area.x, top: area.y - 10, width: area.w, opacity: 1 - sai, translate: `0 ${14 * sai}px` }}>
      <svg width={120} height={46} style={{ display: "block", overflow: "visible", marginBottom: 18 }}>
        <circle cx={18} cy={23} r={14} fill="none" stroke={cor.azul} strokeWidth={4} opacity={marca} />
        <circle cx={18} cy={23} r={5.5 * marca} fill={cor.azul} />
        <Traco d="M 40 23 L 112 23" p={prog(t, Math.max(m.de, inicio) + 0.1, 0.45)} cor={cor.azul} largura={4} />
      </svg>
      <TextoFalado
        linhas={e.linhas}
        tamanho={e.tamanho}
        peso={800}
        tempos={tempos}
        t={t}
        destaque={trechoNoTexto(m.texto, m.destaque)}
        risco={trechoNoTexto(m.texto, m.risco)}
        riscoEm={m.riscoEm}
        entrelinha={1.04}
        espacamento={-0.02}
      />
    </div>
  );
};
