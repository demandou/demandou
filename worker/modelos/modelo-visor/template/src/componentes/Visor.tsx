// A interface fixa da câmera: leituras no alto (grade, ISO/velocidade/abertura/EV, contador de fotos),
// cantos de enquadramento que abraçam o que está em foco, e embaixo o seletor de modos, a miniatura
// da galeria, o obturador e o botão de virar a câmera.
import { Easing, Freeze, interpolate, interpolateColors, useVideoConfig } from "remotion";
import { Rolante, desliza, limitar, mistura, prog } from "../anim";
import { type Foto, contador, escreverEv, fotos, gradeLigadaEm, leituras, modoPadrao } from "../hud";
import { VideoNaCaixa } from "../motor/caixa";
import { estadoDepois, type Ret } from "../layout";
import type { Plano } from "../plano";
import { cor, mono, sans } from "../tema";
import { Cena } from "./Cena";
import { Icone } from "./Icones";

const sombraTexto = "0 1px 10px rgba(0,0,0,0.55)";
export const LINHA_MODOS = 1422;
export const LINHA_OBTURADOR = 1512;

// ---------- cantos de enquadramento ----------

export const Cantos: React.FC<{ r: Ret; t: number; pulso?: number; cor?: string }> = ({ r, t, pulso = 0, cor: corTraco = cor.branco }) => {
  // ligando: os cantos fecham de fora para dentro
  const liga = prog(t, 0, 0.6);
  const folga = (1 - liga) * 90 - pulso * 14;
  const x0 = r.x - folga;
  const y0 = r.y - folga;
  const x1 = r.x + r.w + folga;
  const y1 = r.y + r.h + folga;
  const a = 62;
  const d = [
    `M ${x0} ${y0 + a} L ${x0} ${y0} L ${x0 + a} ${y0}`,
    `M ${x1 - a} ${y0} L ${x1} ${y0} L ${x1} ${y0 + a}`,
    `M ${x1} ${y1 - a} L ${x1} ${y1} L ${x1 - a} ${y1}`,
    `M ${x0 + a} ${y1} L ${x0} ${y1} L ${x0} ${y1 - a}`,
  ].join(" ");
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: liga, filter: "drop-shadow(0 0 3px rgba(0,0,0,0.5))" }}>
      <path d={d} fill="none" stroke={corTraco} strokeWidth={4.5} strokeLinecap="square" />
    </svg>
  );
};

// ---------- alto: grade, leituras, contador ----------

const Alto: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const entra = prog(t, 0.05, 0.5);
  const l = leituras(plano, t);
  const gradeEm = gradeLigadaEm(plano);
  const liga = gradeEm === null ? 0 : prog(t, gradeEm, 0.3);
  const corGrade = interpolateColors(liga, [0, 1], [cor.lapis, cor.acento]);
  const { feitos, virada } = contador(plano, t);
  const fmt = (n: number) => String(n).padStart(2, "0");
  const item: React.CSSProperties = { fontFamily: mono, fontWeight: 500, fontSize: 37, color: cor.branco, letterSpacing: "0.02em", textShadow: sombraTexto };
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 84, height: 56, opacity: entra, translate: `0 ${(1 - entra) * -16}px` }}>
      {/* grade: desligada (a lápis) até ser ligada */}
      <div style={{ position: "absolute", left: 58, top: 2 }}>
        <Icone nome="grade" tamanho={52} cor={corGrade} espessura={3.2} />
        <div style={{ position: "absolute", left: 22, top: 60, width: 8, height: 8, borderRadius: 4, background: cor.acento, opacity: liga }} />
      </div>
      {/* leituras de exposição */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 4, display: "flex", justifyContent: "center", gap: 30, ...item }}>
        <span>ISO {l.iso}</span>
        <span>1/{l.vel}</span>
        <span>ƒ1,8</span>
        {l.ev !== null ? (
          <span style={{ color: cor.acento, opacity: l.evVisivel, width: l.evVisivel * 104, overflow: "hidden", whiteSpace: "nowrap" }}>{escreverEv(l.ev)}</span>
        ) : null}
      </div>
      {/* contador de fotos */}
      <div style={{ position: "absolute", right: 60, top: 0, display: "flex", alignItems: "center", gap: 10, ...item, fontSize: 40 }}>
        <Icone nome="quadro" tamanho={44} cor={cor.branco} espessura={3} style={{ filter: `drop-shadow(${sombraTexto})` }} />
        <Rolante de={fmt(Math.max(0, feitos - 1))} para={fmt(feitos)} p={feitos === 0 ? 1 : virada} />
      </div>
    </div>
  );
};

// ---------- embaixo: seletor de modos ----------

const SLOT = 252;

const Modos: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  if (ordem.length === 0) return null;
  const nomes = ordem.map(modoPadrao);
  // posição contínua: desliza para o modo do momento no começo de cada momento
  let pos = 0;
  ordem.forEach((m, i) => {
    if (i === 0) return;
    pos = mistura(pos, i, prog(t, m.de - 0.05, 0.5, desliza));
  });
  const entra = prog(t, 0.25, 0.5);
  const mascara = "linear-gradient(to right, transparent 0px, black 170px, black 910px, transparent 1080px)";
  return (
    <div style={{ position: "absolute", left: 0, top: LINHA_MODOS - 31, width: 1080, height: 62, opacity: entra, maskImage: mascara, WebkitMaskImage: mascara }}>
      {nomes.map((n, i) => {
        const d = Math.abs(i - pos);
        const ativo = limitar(1 - d * 1.6);
        return (
          <div
            key={`${n}-${i}`}
            style={{
              position: "absolute",
              left: 540 + (i - pos) * SLOT - SLOT / 2,
              width: SLOT,
              top: 8,
              textAlign: "center",
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: "0.11em",
              color: interpolateColors(ativo, [0, 1], ["rgba(243,244,241,0.5)", cor.acento]),
              textShadow: sombraTexto,
              whiteSpace: "nowrap",
            }}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
};

// ---------- embaixo: galeria, obturador, virar ----------

const Obturador: React.FC<{ plano: Plano; t: number; trocas: number[] }> = ({ plano, t, trocas }) => {
  const { fps } = useVideoConfig();
  const entra = prog(t, 0.2, 0.5);
  const lista = fotos(plano);
  // aperto do obturador: o miolo afunda e volta
  const aperto = Math.max(
    0,
    ...lista.map(({ em: d }) => (t < d - 0.08 ? 0 : t < d ? (t - d + 0.08) / 0.08 : Math.max(0, 1 - (t - d) / 0.28))),
  );
  const { feitos } = contador(plano, t);
  const ultima = [...lista].reverse().find((f) => t >= f.em + 0.1);
  const chega = ultima === undefined ? 0 : prog(t, ultima.em + 0.5, 0.3);
  // quando a foto chega, um anel se abre em volta da galeria
  const pulso = ultima === undefined ? 0 : prog(t, ultima.em + 0.55, 0.6, Easing.out(Easing.cubic));
  // virar: gira meia volta a cada troca de lugar (a câmera "troca de vista")
  const giro = trocas.reduce((acc, d) => acc + 180 * prog(t, d, 0.55, desliza), 0);
  const y = LINHA_OBTURADOR + (1 - entra) * 40;
  const G = 92;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entra }}>
      {/* galeria: a lápis até a primeira foto */}
      <div
        style={{
          position: "absolute",
          left: 104,
          top: y - G / 2,
          width: G,
          height: G,
          borderRadius: 18,
          overflow: "hidden",
          border: feitos === 0 ? `3px dashed ${cor.lapis}` : `3px solid ${cor.branco}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {feitos === 0 || chega === 0 || !ultima ? (
          // antes da primeira foto (ou enquanto a nova voa): a anterior, ou o ícone a lápis
          (() => {
            const anterior = [...lista].reverse().find((f) => ultima && f.em < ultima.em);
            if (!anterior) return <Icone nome="foto" tamanho={46} cor={cor.lapis} espessura={3} />;
            return <Miniatura plano={plano} t={t} foto={anterior} fps={fps} lado={G} />;
          })()
        ) : (
          <div style={{ position: "absolute", inset: 0, scale: String(mistura(1.4, 1, chega)), opacity: chega }}>
            <Miniatura plano={plano} t={t} foto={ultima} fps={fps} lado={G} />
          </div>
        )}
      </div>
      {pulso > 0 && pulso < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 104 + G / 2 - (G / 2 + 6 + 30 * pulso),
            top: y - (G / 2 + 6 + 30 * pulso),
            width: G + 12 + 60 * pulso,
            height: G + 12 + 60 * pulso,
            borderRadius: 24 + 20 * pulso,
            border: `4px solid ${cor.acento}`,
            opacity: 1 - pulso,
            boxSizing: "border-box",
          }}
        />
      ) : null}
      {/* obturador */}
      <div
        style={{
          position: "absolute",
          left: 540 - 56,
          top: y - 56,
          width: 112,
          height: 112,
          borderRadius: 56,
          border: `5px solid ${cor.branco}`,
          boxSizing: "border-box",
          boxShadow: "0 2px 14px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 9,
            borderRadius: 50,
            background: cor.branco,
            scale: String(1 - 0.16 * aperto),
          }}
        />
      </div>
      {/* virar câmera */}
      <div style={{ position: "absolute", left: 884, top: y - 34, width: 68, height: 68, borderRadius: 34, background: "rgba(243,244,241,0.14)" }}>
        <Icone nome="virar" tamanho={46} cor={cor.branco} espessura={3} style={{ position: "absolute", left: 11, top: 11, rotate: `${giro}deg` }} />
      </div>
    </div>
  );
};

// O conteúdo de uma foto pequena: a cena ajustada ou o retrato congelado da pessoa
export const Miniatura: React.FC<{ plano: Plano; t: number; foto: Foto; fps: number; lado: number; altura?: number }> = ({ plano, t, foto, fps, lado, altura }) => {
  const h = altura ?? lado;
  if (foto.tipo === "cena") return <Cena w={lado} h={h} e={estadoDepois(plano)} t={t} />;
  return (
    <Freeze frame={Math.round(foto.em * fps)}>
      <VideoNaCaixa
        src={plano.video}
        mudo
        caixa={{ x: 0, y: 0, w: lado, h, raio: 0, zoom: h > lado ? 1 : 1.9, ancoraY: h > lado ? plano.rosto.y : 0.45 }}
        rosto={plano.rosto}
        videoAltura={Math.min(1920, plano.videoAltura ?? 1920)}
      />
    </Freeze>
  );
};

export const Visor: React.FC<{ plano: Plano; t: number; trocas: number[]; cheia: number }> = ({ plano, t, trocas, cheia }) => (
  <>
    {/* degradês discretos para as leituras: no alto e embaixo */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 300,
        background: "linear-gradient(to bottom, rgba(6,7,8,0.55), rgba(6,7,8,0))",
        opacity: cheia,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1180,
        bottom: 0,
        background: "linear-gradient(to bottom, rgba(6,7,8,0), rgba(6,7,8,0.5) 32%, rgba(6,7,8,0.62))",
        opacity: cheia,
      }}
    />
    <Alto plano={plano} t={t} />
    <Modos plano={plano} t={t} />
    <Obturador plano={plano} t={t} trocas={trocas} />
    {/* ponto do modo ativo */}
    <div
      style={{
        position: "absolute",
        left: 536,
        top: LINHA_MODOS - 42,
        width: 8,
        height: 8,
        borderRadius: 4,
        background: cor.acento,
        opacity: interpolate(t, [0.3, 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }),
      }}
    />
  </>
);
