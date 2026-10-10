import { useCurrentFrame } from "remotion";

// Grão de filme: ruído fino por cima da imagem (só dentro da janela — as barras ficam num preto
// limpo, que também deixa o arquivo final bem mais leve). Desenhado em meia resolução e ampliado,
// fica do tamanho do grão de uma película; muda a cada dois quadros, como película projetada.
export const Grao: React.FC<{ topo: number; altura: number; intensidade?: number }> = ({ topo, altura, intensidade = 1 }) => {
  const frame = useCurrentFrame();
  if (altura < 2) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: topo, width: 1080, height: altura, overflow: "hidden", pointerEvents: "none" }}>
      <svg
        width={540}
        height={960}
        viewBox="0 0 540 960"
        style={{ position: "absolute", left: 0, top: -topo, width: 1080, height: 1920, opacity: 0.07 * intensidade }}
      >
        <filter id="grao" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves={1} seed={Math.floor(frame / 2) % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={540} height={960} filter="url(#grao)" />
      </svg>
    </div>
  );
};
