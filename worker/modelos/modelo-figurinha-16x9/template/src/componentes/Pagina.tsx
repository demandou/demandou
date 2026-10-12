// A página do álbum: papel creme com uma trama fina de pontos (aparece quando a pessoa vira figurinha).
// Cada página é uma folha opaca; quando uma página vem logo depois de outra, a nova desliza da
// direita por cima da velha, com sombra de papel na beirada (a página vira). Nunca uma página
// aparece através da outra.
import { AbsoluteFill } from "remotion";
import { limitar, prog, troca } from "../anim";
import type { Folha as FolhaT } from "../layout";
import { VIRA } from "../layout";
import { cor, W } from "../tema";

export const Pagina: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: cor.papel,
      backgroundImage: "radial-gradient(circle, rgba(181,168,147,0.38) 1.7px, transparent 2.1px)",
      backgroundSize: "36px 36px",
      backgroundPosition: "18px 18px",
    }}
  >
    {/* margem da página: linha fina de costura */}
    <div style={{ position: "absolute", inset: 26, borderRadius: 28, border: `2px dashed ${cor.lapisClaro}` }} />
  </AbsoluteFill>
);

// Uma folha: o papel + o que está colado nela. `children` recebe a opacidade do conteúdo
// (aparece vindo do quadro cheio, apaga indo para ele).
export const Folha: React.FC<{ folha: FolhaT; t: number; children: (conteudo: number) => React.ReactNode }> = ({ folha, t, children }) => {
  if (t < folha.entra - 0.001 || t > folha.sai) return null;
  const pVira = folha.vira ? prog(t, folha.entra, VIRA, troca) : 1;
  const x = (1 - pVira) * (W + 60);
  const aparece = folha.vira ? 1 : prog(t, folha.aparece, 0.28);
  const apaga = folha.apaga !== null ? 1 - prog(t, folha.apaga, 0.18) : 1;
  const conteudo = limitar(aparece * apaga);
  return (
    <AbsoluteFill style={{ translate: `${x}px 0`, boxShadow: pVira < 1 ? "-26px 0 40px rgba(58,40,24,0.28)" : undefined }}>
      <Pagina />
      {conteudo > 0.001 ? children(conteudo) : null}
    </AbsoluteFill>
  );
};
