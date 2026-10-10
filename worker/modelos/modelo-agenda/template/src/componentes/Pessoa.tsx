// A pessoa é o compromisso de vídeo da agenda: em tela cheia no começo e no fim, e um bloco da
// folha no meio (com a faixa de categoria à esquerda e a etiqueta do evento). É a única cópia do
// vídeo com som e fica montada o vídeo inteiro.
import { limitar } from "../anim";
import { type Caixa, VideoNaCaixa } from "../motor/caixa";
import { cor, sans, sombraBloco, W } from "../tema";
import { rostoNaCaixa } from "./Guias";
import { Icone } from "./Icones";

export const Pessoa: React.FC<{
  caixa: Caixa;
  video: string;
  rosto: { x: number; y: number };
  videoAltura: number;
  nome: string;
  area: string;
  // esconde a etiqueta (quando há legenda dentro da caixa)
  semEtiqueta?: boolean;
}> = ({ caixa, video, rosto, videoAltura, nome, area, semEtiqueta }) => {
  // 0 = tela cheia, 1 = bloco da agenda
  const moldura = limitar((W - caixa.w) / 90);
  const raio = caixa.raio ?? 0;
  const larga = caixa.w > 560;
  const etiqueta = nome || area;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: caixa.x,
          top: caixa.y,
          width: caixa.w,
          height: caixa.h,
          borderRadius: raio,
          boxShadow: moldura > 0.01 ? sombraBloco : undefined,
          opacity: 1,
        }}
      />
      <VideoNaCaixa src={video} caixa={caixa} rosto={rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.02)" />
      {/* um fio de borda: o vídeo vira um bloco da agenda */}
      <div
        style={{
          position: "absolute",
          left: caixa.x,
          top: caixa.y,
          width: caixa.w,
          height: caixa.h,
          borderRadius: raio,
          overflow: "hidden",
          opacity: moldura,
          boxShadow: "inset 0 0 0 2px rgba(20,22,28,0.10)",
        }}
      >
      </div>
      {etiqueta && !semEtiqueta ? (
        <>
          {/* no bloco: etiqueta do evento embaixo, à esquerda */}
          <Etiqueta
            maximo={caixa.w - 60}
            x={caixa.x + 30}
            y={caixa.y + caixa.h - 24 - 74}
            nome={nome}
            area={larga ? area : ""}
            // só aparece quando a caixa já está quase no lugar (não cruza com o cartão do peito que sai)
            opacidade={limitar((W - caixa.w - 90) / 38)}
          />
          {/* em tela cheia: a mesma etiqueta no alto, à esquerda */}
          <Etiqueta maximo={W - 112} x={56} y={214} nome={nome} area={area} opacidade={1 - limitar((W - caixa.w) / 40)} />
        </>
      ) : null}
    </>
  );
};

const Etiqueta: React.FC<{ x: number; y: number; nome: string; area: string; opacidade: number; maximo: number }> = ({ x, y, nome, area, opacidade, maximo }) => {
  if (opacidade < 0.02) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        height: 74,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 26px 0 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.94)",
        boxShadow: "0 6px 18px rgba(20,26,40,0.16)",
        fontFamily: sans,
        whiteSpace: "nowrap",
        maxWidth: maximo,
        overflow: "hidden",
        boxSizing: "border-box",
        opacity: opacidade,
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 999, background: cor.tinta, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icone nome="camera" tamanho={32} cor="#FFFFFF" peso={4} />
      </div>
      {nome ? <span style={{ fontSize: 38, fontWeight: 700, color: cor.tinta, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{nome}</span> : null}
      {area ? <span style={{ fontSize: 36, fontWeight: 500, color: cor.tintaSuave, overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flexShrink: 1 }}>{nome ? `· ${area}` : area}</span> : null}
    </div>
  );
};

// Cartões "no peito" (gancho, fechamento) presos ao vídeo da pessoa: em tela cheia ficam onde estão;
// quando a caixa encolhe ou cresce, eles encolhem e andam junto com o peito e são recortados pela
// caixa — nunca ficam soltos por cima da agenda.
export const NoPeito: React.FC<{
  caixa: Caixa;
  cheia: Caixa;
  rosto: { x: number; y: number };
  videoAltura: number;
  children: React.ReactNode;
}> = ({ caixa, cheia, rosto, videoAltura, children }) => {
  if (caixa.w >= W - 1) return <>{children}</>;
  const escala = (c: Caixa) => Math.max(c.w / 1080, c.h / videoAltura) * (c.zoom ?? 1);
  const k = escala(caixa) / escala(cheia);
  const a = rostoNaCaixa(caixa, rosto, videoAltura);
  const b = rostoNaCaixa(cheia, rosto, videoAltura);
  const raio = caixa.raio ?? 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        clipPath: `inset(${caixa.y}px ${W - caixa.x - caixa.w}px ${1920 - caixa.y - caixa.h}px ${caixa.x}px round ${raio}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: 1920,
          transformOrigin: "0 0",
          transform: `translate(${a.x - b.x * k}px, ${a.y - b.y * k}px) scale(${k})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
