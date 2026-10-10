// O quadro de investigação na tela: a cortiça, as peças presas, o fio vermelho e os pinos, vistos pela
// câmera que viaja (mundo.ts). Tudo dentro da janela de cima (y 0 a QUADRO_H).
import { staticFile, useVideoConfig } from "remotion";
import { limitar, prog, viaja } from "../anim";
import { borrao, cameraEm, curvaDoFio, pedacoDoFio, tremor, type Roteiro } from "../mundo";
import { COR, FOCO, QUADRO_H } from "../tema";
import { Pino } from "./Pecas";

export const Quadro: React.FC<{ r: Roteiro; t: number }> = ({ r, t }) => {
  const { fps } = useVideoConfig();
  const cam = cameraEm(r, t);
  const ty = tremor(r, t);
  // desfoque de movimento só nas viagens (direcional: mais na direção em que a câmera anda)
  const v = borrao(r, t, fps);
  const bx = Math.min(7, v.x * 0.16);
  const by = Math.min(7, v.y * 0.16);
  const borrando = bx > 0.6 || by > 0.6;
  // o fio tem ~7,5 px na tela com a câmera perto e ~5 px no quadro inteiro; o pino cresce um pouco
  // quando a câmera recua (continua visível)
  const fioTela = 5 + 2.6 * limitar((cam.z - 0.34) / 0.42);
  const fioMundo = fioTela / cam.z;
  const pinoMundo = 36 * Math.min(1.9, Math.max(1, Math.pow(0.75 / cam.z, 0.6)));
  // o que a câmera vê (coordenadas do mundo), com folga para peças giradas e etiquetas
  const folga = 260;
  const vx0 = cam.x - FOCO.x / cam.z - folga;
  const vx1 = cam.x + (1080 - FOCO.x) / cam.z + folga;
  const vy0 = cam.y - FOCO.y / cam.z - folga;
  const vy1 = cam.y + (QUADRO_H - FOCO.y) / cam.z + folga;
  const L = r.limites;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: QUADRO_H, overflow: "hidden", background: "#2A2018" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="borrao-quadro" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
        </filter>
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: QUADRO_H, filter: borrando ? "url(#borrao-quadro)" : undefined }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: `translate(${FOCO.x}px, ${FOCO.y + ty}px) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)` }}>
          {/* a cortiça */}
          <div
            style={{
              position: "absolute",
              left: L.x0,
              top: L.y0,
              width: L.x1 - L.x0,
              height: L.y1 - L.y0,
              backgroundImage: `url(${staticFile("textura/cortica.jpg")})`,
              backgroundSize: "768px 768px",
              backgroundPosition: `${-L.x0}px ${-L.y0}px`,
            }}
          />
          {/* as peças */}
          {r.estacoes.map((e) => {
            if (t < e.chegada - 0.15) return null;
            if (e.some !== undefined && t >= e.some) return null;
            const meia = Math.max(e.peca.w, e.peca.h) / 2;
            if (e.x + meia < vx0 || e.x - meia > vx1 || e.y + meia < vy0 || e.y - meia > vy1) return null;
            const p = e.assenta ? prog(t, e.chegada - 0.15, 0.4) : 1;
            const aparece = e.assenta ? limitar((t - e.chegada + 0.15) / 0.09) : 1;
            return (
              <div
                key={e.chave}
                style={{
                  position: "absolute",
                  left: e.x - e.peca.w / 2,
                  top: e.y - e.peca.h / 2,
                  width: e.peca.w,
                  height: e.peca.h,
                  opacity: aparece,
                  transform: `translateY(${(1 - p) * -34}px) rotate(${e.rot + (1 - p) * 2.5}deg) scale(${1 + 0.08 * (1 - p)})`,
                }}
              >
                {e.peca.desenhar(t)}
              </div>
            );
          })}
          {/* o fio vermelho: sombra na cortiça, o barbante e o brilho torcido da linha */}
          <svg style={{ position: "absolute", left: L.x0, top: L.y0, width: L.x1 - L.x0, height: L.y1 - L.y0, overflow: "visible", pointerEvents: "none" }} viewBox={`${L.x0} ${L.y0} ${L.x1 - L.x0} ${L.y1 - L.y0}`}>
            {r.fios.map((f, i) => {
              if (t < f.de) return null;
              const s = viaja(limitar((t - f.de) / Math.max(0.05, f.ate - f.de)));
              const d = pedacoDoFio(curvaDoFio(f.a, f.b, s), s);
              const w = fioMundo * (f.fino ? 0.86 : 1);
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={w * 1.5} strokeLinecap="round" transform={`translate(${(5 / cam.z).toFixed(1)} ${(8 / cam.z).toFixed(1)})`} />
                  <path d={d} fill="none" stroke={COR.fio} strokeWidth={w} strokeLinecap="round" />
                  <path d={d} fill="none" stroke={COR.fioLuz} strokeWidth={w * 0.34} strokeLinecap="round" strokeDasharray={`${(9 / cam.z).toFixed(1)} ${(11 / cam.z).toFixed(1)}`} opacity={0.85} />
                </g>
              );
            })}
          </svg>
          {/* os pinos ficam por cima do fio (o fio dá a volta no pino) */}
          {r.pinos.map((p, i) => (t >= p.em - 0.02 ? <Pino key={i} x={p.x} y={p.y} p={prog(t, p.em - 0.02, 0.2)} tamanho={pinoMundo} /> : null))}
        </div>
      </div>
      {/* luz de luminária: centro mais claro, bordas e topo mais escuros (só no quadro, nunca na pessoa) */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 78% 66% at 50% 55%, rgba(255,226,170,0.07) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.42) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 170, background: "linear-gradient(180deg, rgba(0,0,0,0.38), rgba(0,0,0,0))" }} />
    </div>
  );
};

// O trilho de madeira escura que fecha o quadro embaixo.
export const Trilho: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: QUADRO_H - 4, width: 1080, height: 18, background: `linear-gradient(180deg, #3A2C20 0%, ${COR.trilho} 70%)`, boxShadow: "0 6px 14px rgba(0,0,0,0.6)" }} />
);
