import React from "react";
import { comoTitulo, dito, ditoAte, ENTRADA, k, LETRA, Letreiro, MARCA, MEIO, mix, useTempo, type CenaProps } from "../kit";

/**
 * O CERTO / COM O QUE VOCÊ TEM (aula 8.2, cenas 4 e 5): o título entra por
 * máscara horizontal, letra a letra; o sublinhado acompanha a fala de "o
 * certo" até "tem"; o apoio começa com as letras espaçadas e se organiza numa
 * linha coesa. No alto, à frente do fundo e longe do rosto; sai por uma
 * máscara de baixo para cima antes da próxima ideia.
 */
export const Frente: React.FC<CenaProps> = ({ ate }) => {
  const { t } = useTempo();
  const sai = k(t, ate - 0.6, ate, ENTRADA);
  const comOQue = dito("com o que");
  return (
    <div style={{ position: "absolute", inset: 0, clipPath: `inset(0px 0px ${Math.round(sai * 100)}% 0px)` }}>
      <div style={{ position: "absolute", left: 80, top: 228, fontFamily: LETRA.titulo, fontWeight: 900, fontSize: 172, lineHeight: 1, letterSpacing: "-0.02em", translate: `0px ${-sai * 60}px` }}>
        <Letreiro texto={comoTitulo("o certo")} tamanho={172} largura={920} cor={MARCA.titulo} t={t} inicio={dito("o certo")} atraso={0.045} mascaraHorizontal />
        <div style={{ height: 12, marginTop: 10, width: Math.round(k(t, dito("o certo"), ditoAte("você tem"), (x) => x) * 640), backgroundColor: MARCA.destaque, borderRadius: 6 }} />
        <div
          style={{
            marginTop: 22,
            fontFamily: LETRA.texto,
            fontWeight: 800,
            fontSize: 50,
            color: MARCA.titulo,
            letterSpacing: `${mix(0.62, 0.05, k(t, comOQue - 0.08, comOQue + 0.92, MEIO))}em`,
            opacity: k(t, comOQue - 0.08, comOQue + 0.32),
            whiteSpace: "nowrap",
          }}
        >
          {comoTitulo("com o que você tem")}
        </div>
      </div>
    </div>
  );
};
