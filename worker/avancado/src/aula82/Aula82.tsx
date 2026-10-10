import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ENTRADA, k, MEIO, mix, suavizar } from "../anim";
import fala from "../dados/fala-aula82.json";
import rastro from "../dados/rastro-aula82.json";
import { Legenda } from "../Legenda";
import { LETRA, MARCA } from "../marca";
import { caminhoAssimetrico, recuar, type Caixa } from "../moldura";
import { Cartao } from "./Cartao";
import { Estudio } from "./Estudio";
import { Letreiro } from "./Letreiro";

/**
 * AULA 8.2: RECORTE DE FUNDO E LETTERING EM CAMADAS, na fala real do Bruno
 * (64,45 s a 79,45 s de "o essencial bem feito"):
 *
 *   "o bem feito ele remete a você fazer o certo com o que você tem. E muita
 *    das vezes a gente acha que a excelência é o produto mais caro, é o
 *    computador mais caro, é o celular mais caro."
 *
 * Cenas pela fala (instantes relativos ao trecho, da transcrição):
 *   0,29 "bem feito"      BEM FEITO grande atrás da cabeça; o recorte esconde parte das letras
 *   1,0  "ele remete"     a moldura assimétrica se desenha e sobe, o corpo passa para dentro dela
 *   3,44 "o certo"        O CERTO por máscara horizontal, letra a letra; sublinhado segue a fala
 *   4,08 "com o que você tem"  letras espaçadas que se organizam numa linha coesa
 *   8,63 "a excelência"   EXCELÊNCIA legível atrás da cabeça, depois se afasta em profundidade
 *   10,15 / 12,15 / 13,67 "produto / computador / celular mais caro"
 *                         três cartões à frente (o terceiro passa diante da borda de baixo):
 *                         o congestionamento proposital da aula, só no fim
 *
 * Camadas, de trás para frente: estúdio, palavras, painel e borda da moldura,
 * apresentador dentro (máscara da forma recuada), apresentador fora (o
 * complemento acima da borda de cima), cartões e legenda. A paralaxe move cada
 * camada por um fator da mesma câmera; moldura e apresentador andam juntos.
 */

const S = 1.15; // px da gravação → px do quadro vertical
const [CX, CY, CL, CA] = rastro.caixa as [number, number, number, number];
const cabeca = (() => {
  let ultimo = { topo: 242, x: 590 };
  return (rastro.cabeca as ({ topo: number; x: number } | null)[]).map((c) => (ultimo = c ?? ultimo));
})();
const XS = suavizar(cabeca.map((c) => c.x + CX), 24);
const X_MEDIO = XS.reduce((a, b) => a + b, 0) / XS.length;
const TOPO = [...cabeca.map((c) => c.topo + CY)].sort((a, b) => a - b)[Math.floor(cabeca.length / 2)];
const Y0 = Math.round(560 - TOPO * S); // topo da cabeça perto de y = 560
const FUNDO_DA_GRAVACAO = Math.round(Y0 + 1080 * S);
const MOLDURA_X = 70;
const MOLDURA_L = 940;
const MOLDURA_BASE = FUNDO_DA_GRAVACAO - 2;
const MOLDURA_TOPO = Math.round(Y0 + (TOPO + 375) * S); // linha do ombro: cabeça e ombros passam por fora
const RAIO = 150;
const CHANFRO = 120;
const RAIO_PEQUENO = 22;
const RECUO = 8;

/** Paralaxe: uma câmera lenta, o mesmo deslocamento para todos, multiplicado pela profundidade. */
const camera = (t: number) => ({ x: mix(-1, 1, k(t, 0, 15, MEIO)) * 20, y: Math.sin((t / 15) * Math.PI) * -12 });

export const Aula82: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const cam = camera(t);
  const desl = (fator: number) => `${Math.round(cam.x * fator)}px ${Math.round(cam.y * fator)}px`;

  // O apresentador acompanha a cabeça com metade do movimento (a câmera segue, sem empurrar).
  const xCabeca = XS[Math.min(XS.length - 1, f)];
  const X0 = Math.round(540 - (X_MEDIO + 0.45 * (xCabeca - X_MEDIO)) * S);
  const video: React.CSSProperties = { position: "absolute", left: X0 + CX * S, top: Y0 + CY * S, width: CL * S, height: CA * S };

  // A moldura sobe do pé enquanto a borda se desenha ("ele remete a você fazer": 1,0 a 2,6 s).
  const sobe = k(t, 1.0, 2.55, MEIO);
  const topo = Math.round(mix(MOLDURA_BASE, MOLDURA_TOPO, sobe));
  const caixa: Caixa = { x: MOLDURA_X, y: topo, l: MOLDURA_L, a: MOLDURA_BASE - topo };
  const temMoldura = caixa.a > 4;
  const dentro = recuar(caixa, RAIO, CHANFRO, RAIO_PEQUENO, RECUO);
  const caminho = caminhoAssimetrico(caixa, RAIO, CHANFRO, RAIO_PEQUENO);
  const caminhoDentro = caminhoAssimetrico(dentro.caixa, dentro.raioGrande, dentro.chanfro, dentro.raioPequeno);
  const corte = temMoldura ? dentro.caixa.y + 1 : 1920; // 1 px de sobreposição: sem fresta na emenda
  const desenho = k(t, 0.95, 2.4, MEIO);

  // Palavras atrás do apresentador.
  // A altura das palavras sai do rastro da cabeça (topo entre 551 e 566 px nestes trechos):
  // a base das letras fica uns 60 px abaixo do topo do cabelo, então a cabeça cobre de verdade
  // o pé das letras do meio e a palavra continua legível (prova de 10/10: com 25 px não se via).
  const bemFeitoEntra = k(t, 0.12, 0.7);
  const bemFeitoAfasta = k(t, 1.75, 2.75, MEIO);
  const bemFeitoSai = k(t, 2.75, 3.35, ENTRADA);
  const excelenciaEntra = k(t, 8.35, 8.95);
  const excelenciaAfasta = k(t, 10.4, 13.9, MEIO);
  const certoSai = k(t, 6.55, 7.15, ENTRADA);

  return (
    <AbsoluteFill style={{ backgroundColor: MARCA.fundoProfundo, fontFamily: LETRA }}>
      <AbsoluteFill style={{ translate: desl(0.35) }}>
        <Estudio t={t} />
      </AbsoluteFill>

      {/* PALAVRAS ATRÁS (o recorte as cobre) */}
      <AbsoluteFill style={{ translate: desl(0.7) }}>
        {bemFeitoSai < 1 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: 1080,
              top: 330,
              textAlign: "center",
              fontWeight: 900,
              fontSize: 206,
              lineHeight: 0.82,
              letterSpacing: "-0.02em",
              scale: mix(1, 0.8, bemFeitoAfasta),
              translate: `0px ${mix(0, -60, bemFeitoAfasta)}px`,
              opacity: mix(1, 0.2, bemFeitoAfasta) * (1 - bemFeitoSai),
              filter: `blur(${bemFeitoAfasta * 2}px)`,
            }}
          >
            <Letreiro texto="BEM" cor={MARCA.titulo} t={t} inicio={0.1} atraso={0.05} />
            <br />
            <Letreiro texto="FEITO" cor={MARCA.destaque} t={t} inicio={0.3} atraso={0.05} />
          </div>
        ) : null}

        {excelenciaEntra > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: 1080,
              top: 494,
              textAlign: "center",
              fontWeight: 900,
              fontSize: 146,
              lineHeight: 1,
              letterSpacing: `${mix(-0.03, 0.08, excelenciaAfasta)}em`,
              color: MARCA.titulo,
              opacity: mix(1, 0.3, excelenciaAfasta),
              scale: mix(1.1, 1, excelenciaEntra) * mix(1, 0.58, excelenciaAfasta),
              translate: `0px ${mix(0, -190, excelenciaAfasta)}px`,
              filter: `blur(${excelenciaAfasta * 2.4}px)`,
            }}
          >
            <Letreiro texto="EXCELÊNCIA" cor={MARCA.titulo} t={t} inicio={8.35} atraso={0.035} />
          </div>
        ) : null}
      </AbsoluteFill>

      {/* MOLDURA E APRESENTADOR (andam juntos) */}
      <AbsoluteFill style={{ translate: desl(0.2) }}>
        {temMoldura ? (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="painel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={MARCA.painelClaro} />
                <stop offset="1" stopColor={MARCA.fundo} />
              </linearGradient>
              <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000" floodOpacity="0.55" />
              </filter>
            </defs>
            <path d={caminho} fill="url(#painel)" opacity={k(t, 0.95, 1.6)} filter="url(#sombra)" />
            <path d={caminho} fill="none" stroke={MARCA.titulo} strokeWidth={3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - desenho} />
          </svg>
        ) : null}

        {/* dentro da moldura: a forma recuada */}
        {temMoldura ? (
          <AbsoluteFill style={{ clipPath: `path("${caminhoDentro}")` }}>
            <OffthreadVideo src={staticFile("aula82-alfa.webm")} transparent muted style={video} />
          </AbsoluteFill>
        ) : null}

        {/* fora da moldura: só acima da borda de cima (cabeça e ombros); no começo, a silhueta toda */}
        <AbsoluteFill
          style={{
            clipPath: `polygon(-3000px -3000px, 4080px -3000px, 4080px ${corte}px, -3000px ${corte}px)`,
            WebkitMaskImage: `linear-gradient(to bottom, #000 0px, #000 ${FUNDO_DA_GRAVACAO - 260}px, transparent ${FUNDO_DA_GRAVACAO - 10}px)`,
            maskImage: `linear-gradient(to bottom, #000 0px, #000 ${FUNDO_DA_GRAVACAO - 260}px, transparent ${FUNDO_DA_GRAVACAO - 10}px)`,
          }}
        >
          <OffthreadVideo src={staticFile("aula82-alfa.webm")} transparent muted style={video} />
        </AbsoluteFill>

        {/* acabamento à frente: o chanfro em destaque e as marcas de canto, desenhados com a borda */}
        {temMoldura ? (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <path
              d={`M ${caixa.x + caixa.l} ${MOLDURA_BASE - CHANFRO - 40} L ${caixa.x + caixa.l} ${MOLDURA_BASE - CHANFRO} L ${caixa.x + caixa.l - CHANFRO} ${MOLDURA_BASE} L ${caixa.x + caixa.l - CHANFRO - 40} ${MOLDURA_BASE}`}
              fill="none"
              stroke={MARCA.destaque}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - k(t, 2.1, 2.7)}
            />
            {[
              [caixa.x - 22, MOLDURA_BASE + 22, 1, -1],
              [caixa.x + caixa.l + 22, caixa.y - 22, -1, 1],
            ].map(([x, y, sx, sy], i) => (
              <path
                key={i}
                d={`M ${x} ${y + sy * 34} L ${x} ${y} L ${x + sx * 34} ${y}`}
                fill="none"
                stroke={MARCA.linhaForte}
                strokeWidth={2}
                opacity={k(t, 2.2 + i * 0.12, 2.6 + i * 0.12)}
              />
            ))}
          </svg>
        ) : null}
      </AbsoluteFill>

      {/* O CERTO / COM O QUE VOCÊ TEM: no alto, à frente do fundo e longe do rosto */}
      {t > 3.2 && certoSai < 1 ? (
        <AbsoluteFill style={{ translate: desl(0.9), clipPath: `inset(0px 0px ${Math.round(certoSai * 100)}% 0px)` }}>
          <div style={{ position: "absolute", left: 80, top: 228, fontWeight: 900, fontSize: 172, lineHeight: 1, letterSpacing: "-0.02em", translate: `0px ${-certoSai * 60}px` }}>
            <Letreiro texto="O CERTO" cor={MARCA.titulo} t={t} inicio={3.3} atraso={0.045} mascaraHorizontal />
            {/* o sublinhado acompanha a fala de "o certo" até "tem" */}
            <div style={{ height: 12, marginTop: 10, width: Math.round(k(t, 3.44, 5.6, (x) => x) * 640), backgroundColor: MARCA.destaque, borderRadius: 6 }} />
            <div
              style={{
                marginTop: 22,
                fontWeight: 800,
                fontSize: 50,
                color: MARCA.titulo,
                letterSpacing: `${mix(0.62, 0.05, k(t, 4.0, 5.0, MEIO))}em`,
                opacity: k(t, 4.0, 4.4),
                whiteSpace: "nowrap",
              }}
            >
              COM O QUE VOCÊ TEM
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* À FRENTE: os três "mais caro", na hora em que ele fala cada um */}
      <AbsoluteFill style={{ translate: desl(1.3) }}>
        <Cartao t={t} inicio={10.0} titulo="PRODUTO" icone="caixa" x={40} y={650} lado={-1} />
        <Cartao t={t} inicio={12.0} titulo="COMPUTADOR" icone="notebook" direita={40} y={790} lado={1} />
        <Cartao t={t} inicio={13.52} titulo="CELULAR" icone="celular" x={300} y={1452} lado={-1} />
      </AbsoluteFill>

      <Legenda palavras={fala.palavras} maxLetras={27} topo={1622} esquerda={70} largura={940} tamanho={50} />
      <Audio src={staticFile("aula82-voz.wav")} />
    </AbsoluteFill>
  );
};
