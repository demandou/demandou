import { interpolate } from "remotion";
import { cor, sans } from "../tema";

// Cabeçalho de capítulo na barra de cima (como o título corrente de um livro): aparece quando as
// barras apertam, com as letras se aproximando, fica uns 3 s e some.
// `entrada`: 0→1 quando ele aparece depois de um aperto das barras, 1→0 quando some (~3 s depois).
// No quadro deitado (16:9) a barra de cima é fina: ele aparece nos níveis 2 e 3 (barra de 80 px ou
// mais), menor, e nunca com a pessoa na moldura (`esqJanela` > 0).
export const Cabeca: React.FC<{ texto: string; topoJanela: number; alturaJanela: number; esqJanela: number; entrada: number }> = ({
  texto,
  topoJanela,
  alturaJanela,
  esqJanela,
  entrada,
}) => {
  // só com a barra de cima grossa; some quando a tela fecha até o preto (a janela quase sem altura)
  const p =
    entrada *
    interpolate(topoJanela, [56, 76], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(alturaJanela, [160, 400], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(esqJanela, [0, 60], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (!texto || p <= 0) return null;
  const espaco = 0.34 + 0.4 * (1 - p);
  // no meio da barra de cima
  const y = topoJanela / 2;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        translate: "0 -50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        opacity: p * 0.9,
      }}
    >
      <div style={{ height: 2, width: 64 * p, background: cor.ambar, opacity: 0.6 }} />
      <div
        style={{
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 28,
          letterSpacing: `${espaco.toFixed(3)}em`,
          marginRight: `-${espaco.toFixed(3)}em`,
          textTransform: "uppercase",
          color: cor.ambar,
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </div>
      <div style={{ height: 2, width: 64 * p, background: cor.ambar, opacity: 0.6 }} />
    </div>
  );
};
