// Legenda de corte de podcast: a linha inteira a lápis, cada palavra acende quando é dita e a palavra
// que está sendo dita fica no acento. No 16:9 fica na área segura de baixo, ancorada pela base (duas
// linhas crescem para cima), acima dos controles do player.
import { prog, saindo } from "../anim";
import { diagramar, ESPACO } from "../medidas";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

export const Legendas: React.FC<{ frases: Frase[]; t: number; x: number; largura: number; base: number; visivel: number }> = ({
  frases,
  t,
  x,
  largura: total,
  base,
  visivel,
}) => {
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual || visivel <= 0.01) return null;
  const texto = atual.palavras.map((p) => p.w).join(" ");
  const largura = total - 40;
  const { linhas, tam } = diagramar(texto, { largura, maximo: 56, minimo: 46, linhas: 2, peso: 700 });
  const y = base - linhas.length * tam * 1.18;
  const entra = prog(t, atual.de - 0.06, 0.16);
  const sai = saindo(t, atual.ate, 0.1);
  let k = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x + 20,
        width: largura,
        top: y,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: sans,
        fontWeight: 700,
        fontSize: tam,
        lineHeight: 1.18,
        opacity: entra * (1 - sai) * visivel,
        translate: `0 ${(1 - entra) * 12}px`,
      }}
    >
      {linhas.map((l, li) => {
        const ws = l.split(/\s+/).filter(Boolean);
        const inicio = k;
        k += ws.length;
        return (
          <div key={`${l}-${li}`} style={{ display: "flex", whiteSpace: "nowrap" }}>
            {ws.map((w, j) => {
              const p = atual.palavras[inicio + j];
              const dita = t >= p.em - 0.04;
              const agora = dita && t < p.ate + 0.04;
              return (
                <span key={`${w}-${j}`} style={{ marginRight: j < ws.length - 1 ? tam * ESPACO : 0, color: agora ? cor.acento : dita ? cor.texto : cor.apagadoForte }}>
                  {w}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
