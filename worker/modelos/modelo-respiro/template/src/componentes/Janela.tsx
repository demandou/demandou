import { limitar } from "../anim";
import type { Janela as TipoJanela } from "../layout";
import { VideoNaCaixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { cor } from "../tema";

// A janela respira junto com a forma: cresce um pouco na inspiração e volta na expiração,
// a partir do centro. `ar` é o quanto o peito está cheio (0–1).
export const janelaQueRespira = (j: TipoJanela, arAgora: number, intensidade: number): TipoJanela => {
  const k = 1 + intensidade * 0.05 * (arAgora - 0.5);
  const w = j.w * k;
  const h = j.h * k;
  return { ...j, x: j.x - (w - j.w) / 2, y: j.y - (h - j.h) / 2, w, h, raioTopo: j.raioTopo * k, raioBase: j.raioBase * k };
};

// Contorno de um arco (cantos de cima com raio grande, de baixo com raio pequeno)
export const caminhoDoArco = (x: number, y: number, w: number, h: number, rt: number, rb: number) => {
  const R = Math.min(rt, w / 2, h);
  const r = Math.min(rb, w / 2, h - R);
  return [
    `M ${x} ${y + R}`,
    `A ${R} ${R} 0 0 1 ${x + R} ${y}`,
    `L ${x + w - R} ${y}`,
    `A ${R} ${R} 0 0 1 ${x + w} ${y + R}`,
    `L ${x + w} ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `L ${x + r} ${y + h}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    "Z",
  ].join(" ");
};

// A pessoa na janela em arco. Só reenquadra o vídeo (VideoNaCaixa): nunca recorta nem estica.
export const Janela: React.FC<{ janela: TipoJanela; plano: Plano }> = ({ janela, plano }) => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const R = Math.min(janela.raioTopo, janela.w / 2, janela.h);
  const r = Math.min(janela.raioBase, janela.w / 2);
  return (
    <VideoNaCaixa
      src={plano.video}
      caixa={{ x: janela.x, y: janela.y, w: janela.w, h: janela.h, zoom: janela.zoom, ancoraY: janela.ancoraY }}
      rosto={plano.rosto}
      videoAltura={videoAltura}
      filtro="saturate(0.96) contrast(1.02)"
      estilo={{ borderRadius: `${R}px ${R}px ${r}px ${r}px`, backgroundColor: cor.papelFundo }}
    />
  );
};

// Moldura a lápis: um segundo arco, afastado, que só aparece quando a janela já não é tela cheia
export const MolduraDaJanela: React.FC<{ janela: TipoJanela; t: number }> = ({ janela, t }) => {
  const forma = limitar(janela.raioTopo / Math.max(1, janela.w / 2));
  if (forma < 0.05) return null;
  const folga = 16;
  const d = caminhoDoArco(
    janela.x - folga,
    janela.y - folga,
    janela.w + 2 * folga,
    janela.h + 2 * folga,
    janela.raioTopo + folga,
    janela.raioBase + folga,
  );
  // o traço "anda" devagar ao longo do contorno: a moldura está viva, sem chamar atenção
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <path
        d={d}
        fill="none"
        stroke={cor.lapis}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray="2 12"
        strokeDashoffset={-t * 9}
        opacity={0.95 * forma}
      />
    </svg>
  );
};
