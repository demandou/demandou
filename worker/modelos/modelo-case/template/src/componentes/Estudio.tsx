// A mesa (fundo cinza atrás da folha e da moldura), o fundo da moldura da pessoa e a tarja de quem
// fala, presa entre a folha e a moldura como a assinatura do relatório. Nada disso toca na pessoa:
// a cor do vídeo não muda.
import { prog, saindo } from "../anim";
import type { Plano } from "../plano";
import { COSTURA, cor, fonte, MOLDURA, mono } from "../tema";
import { caber, larguraRotulo } from "./Pecas";

export const Mesa: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${cor.mesa} 0%, ${cor.mesaEscura} 100%)` }} />
);

// fundo de tinta atrás do vídeo (só aparece se o vídeo não cobrir a moldura) + sombra suave fora dela
export const FundoDaMoldura: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: MOLDURA.x,
      top: MOLDURA.y,
      width: MOLDURA.w,
      height: MOLDURA.h,
      borderRadius: MOLDURA.raio,
      boxShadow: "0 -8px 26px rgba(18,23,34,0.14)",
      background: cor.tinta,
    }}
  />
);

// A tarja: cartão branco com o filete coral, o nome (≥ 38 px) e a área em mono, na costura, à esquerda.
export const Tarja: React.FC<{ t: number; plano: Plano; de: number; ate: number }> = ({ t, plano, de, ate }) => {
  const nome = plano.marca?.nome?.trim();
  if (!nome || t < de || t > ate + 0.3) return null;
  const area = plano.marca?.area?.trim();
  const p = prog(t, de, 0.4);
  const s = saindo(t, ate, 0.3);
  const fN = caber(nome, 560, 40, 34, 1, 800);
  let tamA = 22;
  while (area && tamA > 18 && larguraRotulo(area, tamA) > 560) tamA -= 1;
  const altura = area ? 108 : 80;
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: COSTURA - 10 - altura / 2,
        height: altura,
        display: "flex",
        alignItems: "stretch",
        borderRadius: 12,
        background: cor.cartao,
        boxShadow: "0 12px 28px rgba(18,23,34,0.22)",
        overflow: "hidden",
        opacity: p * (1 - s),
        transform: `translateX(${(1 - p) * -40 + s * -40}px)`,
      }}
    >
      <div style={{ width: 10, background: cor.acento }} />
      <div style={{ padding: "0 30px 0 22px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: fN.tamanho, color: cor.tinta, lineHeight: 1.1, letterSpacing: "-0.015em", whiteSpace: "nowrap" }}>{nome}</div>
        {area ? (
          <div style={{ fontFamily: mono, fontSize: tamA, color: cor.tintaSuave, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 6, whiteSpace: "nowrap" }}>{area}</div>
        ) : null}
      </div>
    </div>
  );
};
