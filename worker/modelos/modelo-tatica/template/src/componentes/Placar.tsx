// O placar de dicas no canto de cima à esquerda, como o placar de uma transmissão:
// [DICA] [1/3] e três marcas que se preenchem. O número rola quando a dica muda.
import { prog, saindo } from "../anim";
import { dicaEmCurso, type Janela } from "../layout";
import { cor, fonte, larga, PLACAR, rotulo } from "../tema";

export const Placar: React.FC<{ t: number; janelas: Janela[]; fim: number }> = ({ t, janelas, fim }) => {
  if (janelas.length === 0) return null;
  const primeira = janelas[0];
  const pEntra = prog(t, primeira.dica.de, 0.4);
  if (pEntra <= 0.001) return null;
  const atual = dicaEmCurso(t, janelas) ?? primeira;
  const anterior = janelas[atual.numero - 2];
  const total = janelas.length;
  // o número rola de baixo para cima na troca
  const pRola = anterior ? prog(t, atual.dica.de, 0.42) : 1;
  const h = PLACAR.altura;
  const sai = saindo(t, fim, 0.3);

  const numero = (n: number, desloc: number) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", translate: `0 ${desloc * 100}%` }}>
      <span style={{ ...larga, fontSize: 54, color: cor.giz }}>{n}</span>
    </div>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: PLACAR.x,
        top: PLACAR.y,
        height: h,
        display: "flex",
        alignItems: "stretch",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 10px 26px rgba(0,0,0,0.30)",
        // entra deslizando inteiro (texto nunca cortado) e sai sumindo
        opacity: Math.min(1, pEntra * 1.4) * (1 - sai),
        translate: `${(1 - pEntra) * -70}px 0`,
      }}
    >
      <div style={{ background: cor.placar, display: "flex", alignItems: "center", padding: "0 22px" }}>
        <span style={{ ...rotulo, fontSize: 36, color: cor.tv }}>Dica</span>
      </div>
      <div style={{ background: cor.tv, display: "flex", alignItems: "center", padding: "0 22px 0 18px", gap: 4 }}>
        <div style={{ position: "relative", width: 50, height: h, overflow: "hidden" }}>
          {anterior && pRola < 1 ? numero(anterior.numero, -pRola) : null}
          {numero(atual.numero, 1 - pRola)}
        </div>
        <span style={{ ...larga, fontSize: 38, color: cor.tvTexto, fontFamily: fonte }}>/{total}</span>
        <div style={{ display: "flex", gap: 7, marginLeft: 18 }}>
          {janelas.map((j) => {
            const cheia = j.numero < atual.numero ? 1 : j.numero === atual.numero ? prog(t, j.dica.de + 0.1, 0.35) : 0;
            return (
              <div key={j.numero} style={{ position: "relative", width: 30, height: 12, borderRadius: 3, background: "rgba(243,246,239,0.22)", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${cheia * 100}%`, background: cor.placar }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
