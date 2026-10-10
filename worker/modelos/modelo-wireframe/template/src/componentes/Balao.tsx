import { prog } from "../anim";
import type { Frase } from "../motor/frases";
import { BALAO, cor, sans } from "../tema";

// O balão do comentário, logo abaixo da pessoa no canvas: o nome e a fala em curso (a legenda),
// cada palavra acende quando é dita. Entre uma fala e outra, a última continua (nunca fica vazio).
export const Balao: React.FC<{ t: number; frases: Frase[]; marca: { nome: string; area: string }; presenca: number }> = ({ t, frases, marca, presenca }) => {
  const entrada = prog(presenca, 0.62, 0.38);
  if (entrada <= 0) return null;
  let atual: Frase | undefined;
  for (const f of frases) if (t >= f.de - 0.05) atual = f;
  const trocaEm = atual ? atual.de - 0.05 : 0;
  const troca = prog(t, trocaEm, 0.18);
  const letras = atual ? atual.palavras.map((p) => p.w).join(" ").length : 0;
  // a fala longa reduz o corpo (até 36) para caber sempre no balão
  const tamanho = letras > 64 ? 36 : letras > 44 ? 40 : 44;

  return (
    <div
      style={{
        position: "absolute",
        left: BALAO.x,
        top: BALAO.y,
        width: BALAO.w,
        height: BALAO.h,
        borderRadius: "10px 30px 30px 30px",
        background: cor.papel,
        boxShadow: "0 22px 50px rgba(0,0,0,0.35)",
        padding: "22px 28px",
        boxSizing: "border-box",
        opacity: entrada,
        translate: `0 ${(1 - entrada) * 40}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, height: 44 }}>
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: cor.tinta, whiteSpace: "nowrap" }}>{marca.nome || "Comentário"}</div>
        {marca.area ? <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 30, color: cor.tintaSuave, whiteSpace: "nowrap" }}>{marca.area}</div> : null}
        <div style={{ marginLeft: "auto", fontFamily: sans, fontWeight: 500, fontSize: 30, color: "#8C9098" }}>agora</div>
      </div>
      <div style={{ height: 2, background: "#E2E3E6", margin: "10px 0 12px" }} />
      {atual ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            fontFamily: sans,
            fontWeight: 700,
            fontSize: tamanho,
            lineHeight: 1.16,
            color: cor.tinta,
            opacity: troca,
            translate: `0 ${(1 - troca) * 10}px`,
          }}
        >
          {atual.palavras.map((p, i) => (
            <span key={`${p.w}-${i}`} style={{ marginRight: "0.26em", opacity: 0.28 + 0.72 * prog(t, p.em - 0.04, 0.16) }}>
              {p.w}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};
