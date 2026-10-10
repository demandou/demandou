// A chapa-cartão das artes de quadro cheio (abertura, laudo, fechamento): um filme escuro com a
// borda de luz fria acesa em volta, na altura do peito. Entra subindo e acende; sai descendo.
import { acender, prog, saindo } from "../anim";
import { cor, MARGEM, W } from "../tema";

export const CARTAO = { x: MARGEM, largura: W - 2 * MARGEM, borda: 5, padding: 34 };

export const Cartao: React.FC<{
  t: number;
  de: number;
  fim: number;
  topo: number;
  altura: number;
  children: React.ReactNode;
}> = ({ t, de, fim, topo, altura, children }) => {
  // a arte que abre o vídeo já está na tela no primeiro quadro (é a capa do post)
  const entrada = de < 0.1 ? 1 : prog(t, de, 0.45);
  const saida = saindo(t, fim, 0.28);
  if (entrada <= 0 || saida >= 1) return null;
  const luz = acender(t, de);
  return (
    <div
      style={{
        position: "absolute",
        left: CARTAO.x,
        top: topo,
        width: CARTAO.largura,
        height: altura,
        opacity: Math.min(1, entrada * 1.6) * (1 - saida),
        translate: `0 ${((1 - entrada) * 36 + saida * 24).toFixed(1)}px`,
      }}
    >
      {/* borda de luz */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          background: "#16212B",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ position: "absolute", inset: 0, borderRadius: 16, opacity: luz, background: `linear-gradient(180deg, #F2F9FC, ${cor.luz} 60%, #B7CCD6)` }} />
      </div>
      {/* o filme */}
      <div
        style={{
          position: "absolute",
          inset: CARTAO.borda,
          borderRadius: 12,
          overflow: "hidden",
          background: `radial-gradient(ellipse 80% 90% at 40% 40%, ${cor.chapaCentro} 0%, ${cor.chapa} 60%, ${cor.chapaBorda} 100%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
