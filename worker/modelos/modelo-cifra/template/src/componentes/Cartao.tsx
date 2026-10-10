// O cartão de palco dos momentos em quadro cheio: um pedaço do palco escuro na altura do peito,
// abaixo do queixo, com a pestana de marfim no alto. As mãos continuam aparecendo embaixo dele.
import { prog } from "../anim";
import { cor } from "../tema";
import type { Area } from "./Cena";

// largura útil dentro do cartão (as áreas têm 960 de largura; 46 px de cada lado)
export const INTERNO = 868;

export const Cartao: React.FC<{ t: number; de: number; area: Area; children: React.ReactNode; padding?: string }> = ({
  t,
  de,
  area,
  children,
  padding = "38px 46px 40px",
}) => {
  const traco = prog(t, de + 0.12, 0.5);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: area.w, height: area.h, display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", width: "100%", borderRadius: 30, background: "rgba(20,17,15,0.92)", padding, overflow: "hidden" }}>
        {/* a pestana: traço de marfim que se desenha do centro para as pontas */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${50 - 50 * traco}%`,
            width: `${100 * traco}%`,
            height: 5,
            background: cor.marfim,
            opacity: 0.9,
          }}
        />
        {children}
      </div>
    </div>
  );
};
