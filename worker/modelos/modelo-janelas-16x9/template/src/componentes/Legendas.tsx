// Legenda "ao vivo" da chamada: uma linha numa faixa escura dentro da janela da pessoa,
// como a legenda automática de uma videochamada. A palavra da vez fica em violeta-claro.
import { limitar, prog, saindo, useTempo } from "../anim";
import type { CaixaJanela } from "../geometria";
import type { Frase } from "../motor/frases";
import { H, sans, W } from "../tema";

const VIOLETA_CLARO = "#C8BCFF";

export const Legendas: React.FC<{ frases: Frase[]; j: CaixaJanela }> = ({ frases, j }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual || j.w < 600) return null;
  const cheia = limitar((j.w - (W - 120)) / 120);
  // em tela cheia, na área segura de baixo (acima da etiqueta do nome e dos controles do player);
  // na moldura, no pé do vídeo. A faixa cresce para cima: duas linhas nunca passam da borda.
  const fundo = cheia > 0.5 ? H - 214 : j.y + j.h - 26;
  const entra = prog(t, atual.de - 0.05, 0.18);
  const sai = saindo(t, atual.ate, 0.12);
  return (
    <div style={{ position: "absolute", left: j.x, width: j.w, top: 0, height: fundo, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.26em",
          maxWidth: Math.min(cheia > 0.5 ? 1500 : 940, j.w - 60),
          padding: "10px 26px 13px",
          borderRadius: 18,
          background: "rgba(23,20,31,0.78)",
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.15,
          color: "#FFFFFF",
          opacity: Math.min(entra, 1 - sai),
          translate: `0 ${(1 - entra) * 10}px`,
        }}
      >
        {atual.palavras.map((p, i) => {
          const falada = prog(t, p.em - 0.04, 0.14);
          const proxima = atual.palavras[i + 1];
          const daVez = t >= p.em - 0.04 && (!proxima || t < proxima.em - 0.04);
          return (
            <span key={`${p.w}-${i}`} style={{ opacity: 0.4 + 0.6 * falada, color: daVez ? VIOLETA_CLARO : undefined }}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

