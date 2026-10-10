// A pessoa: tela cheia no começo e nos respiros; no resto, uma janela presa na lousa,
// com uma moldura riscada a giz que acompanha a janela quando ela muda de lugar.
import { limitar, prog } from "../anim";
import { molduraDeGiz, Traco } from "../giz/Escrita";
import { comprimento } from "../giz/glifos";
import { type Caixa, VideoNaCaixa } from "../motor/caixa";
import type { Plano } from "../plano";
import { cor, H, W } from "../tema";

export const Janela: React.FC<{ plano: Plano; caixa: Caixa; t: number; desenhaEm: number | null }> = ({ plano, caixa, t, desenhaEm }) => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  // o quanto a pessoa saiu da tela cheia (liga a moldura)
  const fora = limitar((W - caixa.w) / 80);
  const folga = 14;
  const tracos = molduraDeGiz(caixa.x - folga, caixa.y - folga, caixa.w + 2 * folga, caixa.h + 2 * folga, 21);
  const total = tracos.reduce((n, d) => n + comprimento(d), 0);
  const feito = desenhaEm === null ? 0 : prog(t, desenhaEm, 0.5) * total;
  let acum = 0;
  return (
    <>
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(0.96)" />
      {fora > 0.01 && feito > 0 ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <g filter="url(#gizJanela)" opacity={fora}>
            <defs>
              <filter id="gizJanela" x="0" y="0" width={W} height={H} filterUnits="userSpaceOnUse">
                <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="3" seed="5" result="grao" />
                <feColorMatrix in="grao" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -7 0 0 0 4.75" result="furos" />
                <feComposite in="SourceGraphic" in2="furos" operator="in" />
              </filter>
            </defs>
            {tracos.map((d, i) => {
              const c = comprimento(d);
              const q = Math.min(1, Math.max(0, (feito - acum) / c));
              acum += c;
              return <Traco key={i} d={d} p={q} cor={cor.giz} largura={6} opacidade={0.9} />;
            })}
          </g>
        </svg>
      ) : null}
    </>
  );
};
