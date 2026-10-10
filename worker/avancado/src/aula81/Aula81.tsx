import React from "react";
import { Audio, Video } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { k, MEIO, mix } from "../anim";
import fala from "../dados/fala-aula81.json";
import rosto from "../dados/rosto-aula81.json";
import { Legenda } from "../Legenda";
import { LETRA, MARCA } from "../marca";
import { caminhoChanfrado } from "../moldura";
import { Letreiro } from "../aula82/Letreiro";
import { ALTURA_BEIRAL, ALTURA_CUMEEIRA, AFASTA_ESTACA, elevacao, estado, PROFUNDIDADE, projetar } from "./roteiro";
import { Maquete } from "./Tenda";

/**
 * AULA 8.1: MAQUETE 3D QUE EXPLICA A IDEIA. O apresentador começa em tela
 * cheia e passa para uma moldura vertical de cantos chanfrados no lado
 * inferior esquerdo (contorno duplo fino, sombra, inclinação discreta), com o
 * rosto centrado pelo rastro do Face Landmarker; a parte de cima e a direita
 * ficam para a maquete. Sem recorte de fundo (a aula não pede).
 */
const AREA_L = 1080;
const AREA_A = 1120; // a maquete ocupa o alto do quadro
const ESCALA_CHEIA = 1920 / 1080;
const ESCALA_MOLDURA = 0.64;
const MOLDURA = { x: 50, y: 1150, l: 500, a: 640, chanfro: 46 };

const Rotulo: React.FC<{ texto: string; ancora: { x: number; y: number }; y: number; ativo: number; visivel: number; lado?: "direita" | "centro" }> = ({
  texto,
  ancora,
  y,
  ativo,
  visivel,
  lado = "direita",
}) => {
  if (visivel <= 0.01) return null;
  const largura = texto.length * 22 + 48;
  const x = lado === "direita" ? AREA_L - 36 - largura : ancora.x - largura / 2;
  const yy = lado === "direita" ? y : ancora.y - 96;
  const cor = ativo > 0.5 ? MARCA.destaque : MARCA.titulo;
  const pontaX = lado === "direita" ? x : ancora.x;
  const pontaY = lado === "direita" ? yy + 26 : yy + 52;
  return (
    <>
      <svg width={AREA_L} height={AREA_A} style={{ position: "absolute", inset: 0, opacity: visivel }}>
        <line x1={pontaX} y1={pontaY} x2={ancora.x} y2={ancora.y} stroke={cor} strokeWidth={2.5} strokeOpacity={0.9} />
        <circle cx={ancora.x} cy={ancora.y} r={7} fill={cor} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: yy,
          width: largura,
          height: 52,
          lineHeight: "52px",
          textAlign: "center",
          borderRadius: 10,
          border: `2px solid ${cor}`,
          backgroundColor: "rgba(20, 21, 23, 0.86)",
          color: cor,
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: "0.1em",
          opacity: visivel,
          scale: mix(0.9, 1, visivel) * mix(1, 1.06, ativo),
        }}
      >
        {texto}
      </div>
    </>
  );
};

export const Aula81: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const e = estado(t);
  const el = elevacao(e);
  const W = e.largura;
  const D = PROFUNDIDADE;
  const sobra = mix(0.42, 0.06, e.finca);

  // pontos onde os rótulos se prendem, no mesmo espaço da maquete
  const pCordas = projetar(t, [0, (ALTURA_BEIRAL * e.ergue + sobra) / 2 + el.cordas, D / 2 + AFASTA_ESTACA * 0.5], AREA_L, AREA_A);
  const pCortina = projetar(t, [W * 0.24, ((ALTURA_CUMEEIRA + ALTURA_BEIRAL) / 2) * e.ergue + el.cortina, D / 4 + 0.05], AREA_L, AREA_A);
  const pEstacas = projetar(t, [(W / 2) * 1.08, sobra, D / 2 + AFASTA_ESTACA], AREA_L, AREA_A);
  const pCasa = projetar(t, [0, 0.05, D / 2 + 0.75], AREA_L, AREA_A);

  // o apresentador: tela cheia → moldura chanfrada ("se prepara", 0,35 a 1,25 s)
  const p = k(t, 0.35, 1.25, MEIO);
  const r = rosto.rosto[Math.min(rosto.rosto.length - 1, f)];
  const caixa = { x: mix(0, MOLDURA.x, p), y: mix(0, MOLDURA.y, p), l: mix(1080, MOLDURA.l, p), a: mix(1920, MOLDURA.a, p) };
  const escala = mix(ESCALA_CHEIA, ESCALA_MOLDURA, p);
  const ax = mix(540, caixa.l / 2, p);
  const ay = mix(r.y * ESCALA_CHEIA, caixa.a * 0.36, p);
  const esquerda = Math.min(0, Math.max(caixa.l - 1920 * escala, ax - r.x * escala));
  const topo = Math.min(0, Math.max(caixa.a - 1080 * escala, ay - r.y * escala));
  const chanfro = mix(0, MOLDURA.chanfro, p);
  const recorte = caminhoChanfrado({ x: 0, y: 0, l: caixa.l, a: caixa.a }, chanfro);
  const contornoFora = caminhoChanfrado({ x: -12, y: -12, l: caixa.l + 24, a: caixa.a + 24 }, chanfro + 5);

  const maquete = k(t, 0.3, 0.9);
  const titulo = k(t, 9.85, 10.2);

  return (
    <AbsoluteFill style={{ backgroundColor: MARCA.fundoProfundo, fontFamily: LETRA }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 45% at 50% 30%, ${MARCA.painelClaro} 0%, ${MARCA.fundo} 50%, ${MARCA.fundoProfundo} 100%)` }} />

      {/* A MAQUETE: Three.js de verdade, no GL do servidor (swangle) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: AREA_L, height: AREA_A, opacity: maquete }}>
        <ThreeCanvas width={AREA_L} height={AREA_A} shadows gl={{ antialias: true, alpha: true }} camera={{ fov: 40, near: 0.1, far: 60, position: [0, 10, 2] }}>
          <Maquete t={t} e={e} />
        </ThreeCanvas>
        <Rotulo texto="CORDAS" ancora={pCordas} y={Math.max(150, Math.min(900, pCordas.y - 26))} ativo={e.foco.cordas} visivel={e.rotulos} />
        <Rotulo texto="CORTINA" ancora={pCortina} y={Math.max(230, Math.min(960, pCortina.y - 26))} ativo={e.foco.cortina} visivel={e.rotulos} />
        <Rotulo texto="ESTACAS" ancora={pEstacas} y={Math.max(310, Math.min(1030, pEstacas.y + 20))} ativo={e.foco.estacas} visivel={e.rotulos} />
        <Rotulo texto="CASA" ancora={pCasa} y={0} ativo={1} visivel={e.casa} lado="centro" />
      </div>

      {/* "faça o essencial bem feito": o letreiro se constrói com a tenda reunida */}
      {titulo > 0 ? (
        <div style={{ position: "absolute", top: 96, left: 0, width: 1080, textAlign: "center", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em" }}>
          <div style={{ fontSize: 92 }}>
            <Letreiro texto="O ESSENCIAL" cor={MARCA.titulo} t={t} inicio={9.85} atraso={0.04} />
          </div>
          <div style={{ fontSize: 122 }}>
            <Letreiro texto="BEM FEITO" cor={MARCA.destaque} t={t} inicio={10.75} atraso={0.05} />
          </div>
        </div>
      ) : null}

      {/* O APRESENTADOR: tela cheia que vira a moldura chanfrada, com inclinação discreta */}
      <div
        style={{
          position: "absolute",
          left: caixa.x,
          top: caixa.y,
          width: caixa.l,
          height: caixa.a,
          transform: `perspective(1600px) rotateY(${mix(0, 7, p)}deg)`,
          transformOrigin: "left center",
          filter: p > 0.02 ? `drop-shadow(0 22px 34px rgba(0,0,0,${0.6 * p}))` : undefined,
        }}
      >
        <div style={{ position: "absolute", inset: 0, clipPath: `path("${recorte}")`, overflow: "hidden", backgroundColor: MARCA.fundo }}>
          <Video src={staticFile("aula81-trecho.mp4")} muted style={{ position: "absolute", left: esquerda, top: topo, width: 1920 * escala, height: 1080 * escala }} />
        </div>
        <svg width={caixa.l + 40} height={caixa.a + 40} style={{ position: "absolute", left: -20, top: -20, overflow: "visible", opacity: p }}>
          <g transform="translate(20 20)">
            <path d={recorte} fill="none" stroke={MARCA.titulo} strokeWidth={2.5} />
            <path d={contornoFora} fill="none" stroke={MARCA.titulo} strokeOpacity={0.45} strokeWidth={1.5} />
            <path d={`M ${caixa.l - chanfro - 30} -12 L ${caixa.l - chanfro + 5} -12 L ${caixa.l + 12} ${chanfro - 5} L ${caixa.l + 12} ${chanfro + 30}`} fill="none" stroke={MARCA.destaque} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      <Legenda palavras={fala.palavras} maxLetras={16} topo={1236} esquerda={604} largura={440} tamanho={46} alinhar="left" />
      <Audio src={staticFile("aula81-voz.wav")} />
    </AbsoluteFill>
  );
};
