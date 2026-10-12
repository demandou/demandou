import { Easing, staticFile } from "remotion";
import { acaso, prog } from "../anim";
import { cor, mono, sans } from "../tema";

// Carimbo de borracha: desce rápido, bate seco (sem quicar) e fica com a tinta falhada.
export const Carimbo: React.FC<{
  texto: string;
  // texto já quebrado em linhas (medida.ts); sem isto, o texto fica numa linha só
  linhas?: string[];
  // corpo do texto principal (padrão 58 × tamanho)
  corpo?: number;
  detalhe?: string;
  em: number;
  t: number;
  rot?: number;
  tamanho?: number;
  sobreVideo?: boolean;
  semente?: number;
  style?: React.CSSProperties;
}> = ({ texto, linhas, corpo, detalhe, em, t, rot = -7, tamanho = 1, sobreVideo = false, semente = 1, style }) => {
  if (t < em - 0.12) return null;
  // desce acelerando até a folha (0,12 s) e para
  const desce = prog(t, em - 0.12, 0.12, Easing.in(Easing.quad));
  const escala = 1.32 - 0.32 * desce;
  const mascara = `url(${staticFile("textura/tinta.png")})`;
  const px = Math.round(acaso(semente) * 300);
  const py = Math.round(acaso(semente + 9) * 300);
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6 * tamanho,
        padding: `${16 * tamanho}px ${26 * tamanho}px ${14 * tamanho}px`,
        border: `${5 * tamanho}px solid ${cor.vermelho}`,
        // segunda linha, fina, por dentro da borda (carimbo de filete duplo)
        outline: `${2.5 * tamanho}px solid ${cor.vermelho}`,
        outlineOffset: -12.5 * tamanho,
        color: cor.vermelho,
        rotate: `${rot}deg`,
        scale: String(escala),
        opacity: desce < 0.98 ? desce * 0.5 : sobreVideo ? 0.95 : 0.9,
        mixBlendMode: sobreVideo ? "normal" : "multiply",
        WebkitMaskImage: mascara,
        maskImage: mascara,
        WebkitMaskSize: "360px 360px",
        maskSize: "360px 360px",
        WebkitMaskPosition: `${px}px ${py}px`,
        maskPosition: `${px}px ${py}px`,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: sans,
          fontWeight: 800,
          fontSize: corpo ?? 58 * tamanho,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          lineHeight: linhas ? 1.04 : 1,
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {linhas ? linhas.map((l, i) => <div key={i}>{l}</div>) : texto}
      </div>
      {detalhe ? (
        <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 34 * tamanho, letterSpacing: "0.16em", lineHeight: 1, whiteSpace: "nowrap" }}>
          {detalhe}
        </div>
      ) : null}
    </div>
  );
};
