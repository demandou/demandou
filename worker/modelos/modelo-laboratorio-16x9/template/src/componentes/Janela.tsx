// A janela de observação: a pessoa numa foto redonda colada no caderno com dois pedaços de fita,
// com borda de papel e sombra curta; quando a folha chega, um círculo a tinta é riscado em volta.
// Todas as cópias visíveis da pessoa são mudas: a voz vem da `Voz`, montada o vídeo inteiro.
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { limitar } from "../anim";
import { BORDA_FOTO, FOLGA_ANEL } from "../layout";
import { type Caixa, VideoNaCaixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { circulo, Traco } from "../tinta/Tinta";
import { cor, H, W } from "../tema";

export const Foto: React.FC<{ plano: Plano; caixa: Caixa; anel?: number }> = ({ plano, caixa, anel = 0 }) => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  // o quanto a pessoa saiu da tela cheia (liga borda, fita e sombra)
  const fora = limitar((W - caixa.w) / 260);
  const borda = BORDA_FOTO;
  const cx = caixa.x + caixa.w / 2;
  const cy = caixa.y + caixa.h / 2;
  const r = caixa.w / 2;
  const fita = (ang: number, giro: number, k: number) => {
    const a = (ang * Math.PI) / 180;
    const fx = cx + (r + borda) * Math.cos(a);
    const fy = cy + (r + borda) * Math.sin(a);
    return (
      <div
        key={k}
        style={{
          position: "absolute",
          left: fx - caixa.w * 0.17,
          top: fy - 22,
          width: caixa.w * 0.34,
          height: 44,
          background: cor.fita,
          transform: `rotate(${giro}deg)`,
          boxShadow: "0 1px 2px rgba(40,40,30,0.12)",
          opacity: fora,
          borderLeft: "2px dashed rgba(255,255,255,0.35)",
          borderRight: "2px dashed rgba(255,255,255,0.35)",
        }}
      />
    );
  };
  return (
    <>
      {/* borda de papel da foto, com sombra curta */}
      <div
        style={{
          position: "absolute",
          left: caixa.x - borda,
          top: caixa.y - borda,
          width: caixa.w + 2 * borda,
          height: caixa.h + 2 * borda,
          borderRadius: (caixa.raio ?? 0) + borda,
          background: cor.papelClaro,
          boxShadow: "0 12px 26px rgba(29,41,53,0.22), 0 2px 5px rgba(29,41,53,0.18)",
          opacity: fora,
        }}
      />
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(0.97)" mudo />
      {fora > 0.02 ? (
        <>
          {fita(-140, -38, 1)}
          {fita(40, -38, 2)}
        </>
      ) : null}
      {anel > 0 && fora > 0.98 ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }}>
          <Traco d={circulo(cx, cy, r + borda + FOLGA_ANEL, -120, 1.08)} p={anel} largura={4} cor={cor.tinta} opacidade={0.8} />
        </svg>
      ) : null}
    </>
  );
};

// A voz: o som do próprio vídeo da pessoa, montado do começo ao fim (as fotos são todas mudas,
// porque durante a troca de folha aparecem duas)
export const Voz: React.FC<{ plano: Plano }> = ({ plano }) => <Audio src={staticFile(plano.video)} />;
