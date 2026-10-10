// O papel pontilhado. Os pontos estão presos ao papel: quando a câmera desliza, eles deslizam junto
// (é o que faz a viagem entre estações parecer um movimento de verdade sobre o mapa).
import { cor, GRADE, H, W } from "../tema";

export const Papel: React.FC<{ cx: number; cy: number; zoom: number }> = ({ cx, cy, zoom }) => {
  const passo = GRADE * zoom;
  // posição na tela do ponto (0,0) do papel, reduzida a um passo da grade
  const ox = ((((W / 2 - cx * zoom) % passo) + passo) % passo).toFixed(2);
  const oy = ((((H / 2 - cy * zoom) % passo) + passo) % passo).toFixed(2);
  const r = (2.6 * zoom).toFixed(2);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: cor.papel,
        backgroundImage: `radial-gradient(circle at ${r}px ${r}px, ${cor.ponto} ${r}px, transparent ${(Number(r) + 0.8).toFixed(2)}px)`,
        backgroundSize: `${passo.toFixed(3)}px ${passo.toFixed(3)}px`,
        backgroundPosition: `${ox}px ${oy}px`,
      }}
    />
  );
};
