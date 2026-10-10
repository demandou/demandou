import { Palavras, prog, saindo, temposDoTexto } from "../anim";
import type { Regiao } from "../layout";
import type { Palavra, Titulo as TituloT } from "../plano";
import { caber, cor, sans } from "../tema";
import { pSelo, Selo } from "./Selo";

// Abertura em tela cheia: o título se monta palavra por palavra na névoa branca, abaixo do queixo.
// Com `duvidaEm`, o par ✓ / ✗ aparece embaixo (a pergunta que o vídeo vai responder).
export const Titulo: React.FC<{ m: TituloT; t: number; fim: number; area: Regiao; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim, 0.28);
  if (sai >= 1) return null;
  const texto = m.linhas.join(" ");
  const tamanho = Math.min(...m.linhas.map((l) => caber(l, area.w, 112, 76)));
  const tempos = temposDoTexto(texto, palavras, m.de, m.ate, m.de + 0.1);
  const quebras: number[] = [];
  let n = 0;
  for (const l of m.linhas) {
    quebras.push(n);
    n += l.split(/\s+/).filter(Boolean).length;
  }
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
      <Palavras
        texto={texto}
        tempos={tempos}
        t={t}
        enfase={m.enfase}
        corEnfase={cor.azul}
        quebras={quebras}
        style={{ fontFamily: sans, fontWeight: 800, fontSize: tamanho, lineHeight: 1.02, letterSpacing: "-0.02em", color: cor.tinta, textWrap: "nowrap" }}
      />
      {m.duvidaEm !== undefined ? (
        <svg width={300} height={120} style={{ overflow: "visible", marginTop: 10 }}>
          <Selo cx={56} cy={60} r={54} tipo="certo" p={pSelo(t, m.duvidaEm)} vazado />
          <Selo cx={186} cy={60} r={54} tipo="errado" p={pSelo(t, m.duvidaEm + 0.2)} vazado />
        </svg>
      ) : null}
    </div>
  );
};
