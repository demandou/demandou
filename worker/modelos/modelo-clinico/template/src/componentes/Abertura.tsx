import { prog, saindo, temposDoTexto } from "../anim";
import type { Regiao } from "../layout";
import { encaixarTitulo, trechoNoTexto } from "../medida";
import type { Abertura as AberturaT, Palavra } from "../plano";
import { cor, sans } from "../tema";
import { TextoFalado } from "./Texto";

// Abertura em tela cheia: o título se monta palavra por palavra na névoa branca, abaixo do queixo,
// alinhado à esquerda, grande. O texto é medido e quebrado em até 3 linhas (4 se for muito longo).
export const Abertura: React.FC<{ m: AberturaT; t: number; fim: number; area: Regiao; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim, 0.28);
  if (sai >= 1) return null;
  const altura = 1500 - area.y - (m.rotulo ? 70 : 0);
  // o maior corpo que cabe na largura e na altura da névoa
  const e = encaixarTitulo(m.texto, { largura: area.w, max: 112, min: 56, linhas: 4, peso: 800, espacamento: -0.02, altura, entrelinha: 1.03 });
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate, Math.max(m.de, inicio) + 0.05, inicio - 0.15);
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y,
        width: area.w,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        opacity: 1 - sai,
        translate: `0 ${18 * sai}px`,
      }}
    >
      {m.rotulo ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: sans,
            fontWeight: 600,
            fontSize: 42,
            color: cor.azul,
            opacity: prog(t, m.de, 0.4),
            translate: `${(1 - prog(t, m.de, 0.5)) * -20}px 0`,
          }}
        >
          <svg width={26} height={26}>
            <circle cx={13} cy={13} r={10} fill="none" stroke={cor.azul} strokeWidth={3.5} />
            <circle cx={13} cy={13} r={3.5} fill={cor.azul} />
          </svg>
          {m.rotulo}
        </div>
      ) : null}
      <TextoFalado
        linhas={e.linhas}
        tamanho={e.tamanho}
        peso={800}
        tempos={tempos}
        t={t}
        destaque={trechoNoTexto(m.texto, m.destaque)}
        entrelinha={1.02}
        espacamento={-0.02}
      />
    </div>
  );
};
