import { useCurrentFrame } from "remotion";

// Grão de filme: ruído fino por cima da imagem (só dentro da janela; as barras ficam num preto
// limpo, que também deixa o arquivo final bem mais leve). Desenhado em meia resolução e ampliado,
// fica do tamanho do grão de uma película; muda a cada dois quadros, como película projetada.
// No quadro deitado (16:9) a janela pode estar na moldura da direita: `esq`/`largura` a localizam.
export const Grao: React.FC<{ esq: number; topo: number; largura: number; altura: number; intensidade?: number }> = ({ esq, topo, largura, altura, intensidade = 1 }) => {
  const frame = useCurrentFrame();
  if (altura < 2 || largura < 2) return null;
  return (
    <div style={{ position: "absolute", left: esq, top: topo, width: largura, height: altura, overflow: "hidden", pointerEvents: "none" }}>
      <svg
        width={960}
        height={540}
        viewBox="0 0 960 540"
        style={{ position: "absolute", left: -esq, top: -topo, width: 1920, height: 1080, opacity: 0.07 * intensidade }}
      >
        <filter id="grao" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves={1} seed={Math.floor(frame / 2) % 97} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={960} height={540} filter="url(#grao)" />
      </svg>
    </div>
  );
};
