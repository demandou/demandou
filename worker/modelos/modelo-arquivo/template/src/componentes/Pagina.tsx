import { staticFile } from "remotion";
import { preciso, prog } from "../anim";
import { CABECALHO_Y, cor, MARGEM, mono } from "../tema";

// A folha do dossiê: papel com fibra, cabeçalho de arquivo e o número da folha (que rola a cada momento).
export const Pagina: React.FC<{
  t: number;
  visivel: number;
  assunto?: string;
  folhas: { de: number }[];
}> = ({ t, visivel, assunto, folhas }) => {
  const total = folhas.length;
  let atual = 0;
  folhas.forEach((f, i) => {
    if (t >= f.de - 0.05) atual = i;
  });
  const troca = folhas[atual] ? prog(t, folhas[atual].de, 0.45, preciso) : 1;
  const numero = (n: number) => String(n + 1).padStart(2, "0");
  const estilo: React.CSSProperties = { fontFamily: mono, fontSize: 28, letterSpacing: "0.12em", color: cor.tinta, lineHeight: "34px" };
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: cor.papel }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${staticFile("textura/papel.png")})`,
          backgroundSize: "512px 512px",
          mixBlendMode: "multiply",
          opacity: 0.09,
        }}
      />
      {/* luz de mesa: as bordas da folha um pouco mais escuras */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 70% at 50% 42%, rgba(21,21,21,0) 60%, rgba(60,48,30,0.10) 100%)" }} />
      {total > 0 ? (
        <div style={{ opacity: visivel }}>
          <div style={{ position: "absolute", left: MARGEM, top: CABECALHO_Y, display: "flex", alignItems: "center", gap: 14, ...estilo }}>
            <div style={{ width: 14, height: 14, background: cor.vermelho }} />
            <span style={{ fontWeight: 700 }}>ARQUIVO</span>
            {assunto ? (
              <span style={{ color: cor.grafite, textTransform: "uppercase", maxWidth: 560, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                · {assunto}
              </span>
            ) : null}
          </div>
          <div style={{ position: "absolute", right: MARGEM, top: CABECALHO_Y, display: "flex", ...estilo, color: cor.grafite }}>
            <span>FL.&nbsp;</span>
            <span style={{ display: "inline-block", height: 34, overflow: "hidden" }}>
              <span style={{ display: "block", translate: `0 ${-(troca * 34)}px` }}>
                <span style={{ display: "block", fontWeight: 700, color: cor.tinta }}>{numero(Math.max(0, atual - 1))}</span>
                <span style={{ display: "block", fontWeight: 700, color: cor.tinta }}>{numero(atual)}</span>
              </span>
            </span>
            <span>/{String(total).padStart(2, "0")}</span>
          </div>
          <div style={{ position: "absolute", left: MARGEM, right: MARGEM, top: CABECALHO_Y + 46, height: 2, background: cor.tinta, opacity: 0.8 }} />
        </div>
      ) : null}
    </>
  );
};
