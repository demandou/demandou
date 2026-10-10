// A moldura da caixa de transmissão (por cima do vídeo da pessoa quando ela está no canto):
// fio claro em volta e a tarja de nome na base, como a câmera de um comentarista.
import type { Caixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { medir } from "../medidas";
import { cor, rotulo } from "../tema";

export const CaixaTv: React.FC<{ caixa: Caixa; presenca: number; marca: Plano["marca"] }> = ({ caixa, presenca, marca }) => {
  if (presenca <= 0.01) return null;
  const tarja = marca.area ? 112 : 70;
  // nome e área cabem na largura da caixa (sem descer de 30 px)
  const util = caixa.w - 52;
  const cabe = (texto: string, max: number) => Math.max(30, Math.min(max, Math.floor((util / Math.max(1, medir(texto, 100, "rotulo", 0.07))) * 100)));
  return (
    <div
      style={{
        position: "absolute",
        left: caixa.x,
        top: caixa.y,
        width: caixa.w,
        height: caixa.h,
        borderRadius: caixa.raio ?? 0,
        overflow: "hidden",
        opacity: presenca,
        boxShadow: `inset 0 0 0 4px rgba(243,246,239,0.9)`,
      }}
    >
      {marca.nome ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: tarja,
            background: cor.tv,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 8,
            padding: "0 22px 0 30px",
            translate: `0 ${(1 - Math.max(0, (presenca - 0.6) / 0.4)) * 100}%`,
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: cor.placar }} />
          <span style={{ ...rotulo, fontSize: cabe(marca.nome, 36), color: cor.giz, whiteSpace: "nowrap" }}>{marca.nome}</span>
          {marca.area ? <span style={{ ...rotulo, fontSize: cabe(marca.area, 32), color: cor.placar, whiteSpace: "nowrap" }}>{marca.area}</span> : null}
        </div>
      ) : null}
    </div>
  );
};
