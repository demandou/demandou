import type { Plano } from "../plano";
import { AVATAR } from "../paginas";
import { cor, fonte } from "../tema";

// Cabeçalho das páginas de conteúdo, como o de um post: avatar (a pessoa ao vivo, dentro do
// círculo — o vídeo é desenhado por baixo, na camada da pessoa), nome e área.
export const Cabecalho: React.FC<{ marca: Plano["marca"] }> = ({ marca }) => {
  const r = AVATAR.lado / 2;
  return (
    <>
      {/* anel do avatar: um filete coral separado da foto por um respiro creme */}
      <div
        style={{
          position: "absolute",
          left: AVATAR.x - 9,
          top: AVATAR.y - 9,
          width: AVATAR.lado + 18,
          height: AVATAR.lado + 18,
          borderRadius: r + 9,
          boxShadow: `inset 0 0 0 4px ${cor.coral}, inset 0 0 0 9px ${cor.creme}`,
        }}
      />
      {marca.nome ? (
        <div
          style={{
            position: "absolute",
            left: AVATAR.x + AVATAR.lado + 32,
            top: AVATAR.y,
            height: AVATAR.lado,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <div style={{ fontFamily: fonte, fontWeight: 700, fontSize: 46, lineHeight: 1.05, color: cor.petroleo }}>{marca.nome}</div>
          {marca.area ? (
            <div style={{ fontFamily: fonte, fontWeight: 500, fontSize: 37, lineHeight: 1.1, color: cor.petroleoSuave }}>{marca.area}</div>
          ) : null}
        </div>
      ) : null}
    </>
  );
};
