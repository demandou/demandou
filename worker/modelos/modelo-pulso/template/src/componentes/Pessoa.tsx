// A pessoa: tela cheia no começo e no fim; no meio, o visor redondo do relógio, o card do treino ou
// o avatar do mapa. É a única cópia do vídeo com som e fica montada o vídeo inteiro.
import { limitar } from "../anim";
import { type Caixa, VideoNaCaixa } from "../motor/caixa";
import { cor, mostrador, sans, sombraCartao, W, ZONAS } from "../tema";
import { Icone } from "./Icones";

export const Pessoa: React.FC<{
  caixa: Caixa;
  video: string;
  rosto: { x: number; y: number };
  videoAltura: number;
  // 0–1: anel branco de avatar (no mapa)
  anelBranco: number;
  // 0–1: o relógio está em volta (sem sombra própria: a sombra é do relógio)
  noRelogio: number;
}> = ({ caixa, video, rosto, videoAltura, anelBranco, noRelogio }) => {
  // 0 = tela cheia, 1 = dentro do app
  const noApp = limitar((W - caixa.w) / 90);
  const raio = caixa.raio ?? 0;
  const sombra = noApp * (1 - noRelogio);
  return (
    <>
      {sombra > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x,
            top: caixa.y,
            width: caixa.w,
            height: caixa.h,
            borderRadius: raio,
            boxShadow: sombraCartao,
            opacity: sombra,
          }}
        />
      ) : null}
      <VideoNaCaixa src={video} caixa={caixa} rosto={rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.04)" />
      {anelBranco > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x - 8,
            top: caixa.y - 8,
            width: caixa.w + 16,
            height: caixa.h + 16,
            borderRadius: raio + 8,
            border: "8px solid #FFFFFF",
            opacity: anelBranco,
          }}
        />
      ) : null}
    </>
  );
};

// Assinatura no alto, à esquerda: um coração azul (a zona 2 é a cor da marca), o nome e a área.
// Fica no mesmo lugar o vídeo inteiro (em cima do vídeo ou do app).
export const Assinatura: React.FC<{ nome: string; area: string; opacidade: number }> = ({ nome, area, opacidade }) => {
  if (!(nome || area) || opacidade < 0.02) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 136,
        height: 76,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 30px 0 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 8px 22px rgba(16,20,18,0.14)",
        whiteSpace: "nowrap",
        opacity: opacidade,
      }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 999, background: ZONAS[1].cor, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icone nome="coracaoCheio" tamanho={30} cor="#FFFFFF" peso={3} />
      </div>
      {nome ? <span style={{ fontFamily: mostrador, fontSize: 40, fontWeight: 700, color: cor.tinta }}>{nome}</span> : null}
      {area ? <span style={{ fontFamily: sans, fontSize: 36, fontWeight: 600, color: cor.tintaSuave }}>{nome ? `· ${area}` : area}</span> : null}
    </div>
  );
};
