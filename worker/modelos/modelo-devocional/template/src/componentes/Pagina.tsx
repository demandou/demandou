// O fundo gráfico: a página de pergaminho (textura feita por código, com deriva lenta), a sombra da
// lombada, a luz de janela que passeia devagar e a poeira de luz. A luz e a poeira ficam SÓ na
// página, acima da pessoa: nunca passam por cima dela. E a folha que vira entre os blocos.
import { AbsoluteFill, Img, staticFile } from "remotion";
import { limitar, respira, semente, suave } from "../anim";
import type { Caixa } from "../motor/caixa";
import { cor } from "../tema";
import { Easing, interpolate } from "remotion";

// A folha: papel + lombada (à esquerda) + o conteúdo do bloco por cima
export const Folha: React.FC<{ t: number; children?: React.ReactNode }> = ({ t, children }) => (
  <AbsoluteFill style={{ backgroundColor: cor.papel, overflow: "hidden" }}>
    <Img
      src={staticFile("devocional/papel.jpg")}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transform: `scale(${1.045 + 0.02 * respira(t, 26)}) translate(${8 * respira(t, 33, 0.5)}px, ${10 * respira(t, 29)}px)`,
      }}
    />
    {/* lombada: a sombra do miolo do livro, à esquerda */}
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 92, background: "linear-gradient(90deg, rgba(92,72,40,0.20) 0%, rgba(92,72,40,0.07) 45%, rgba(92,72,40,0) 100%)" }} />
    {/* luz de janela: um facho largo e macio que passeia devagar, por baixo do texto, e some antes da moldura */}
    <div style={{ position: "absolute", inset: 0, WebkitMaskImage: "linear-gradient(to bottom, #000 0px, #000 720px, transparent 1040px)", maskImage: "linear-gradient(to bottom, #000 0px, #000 720px, transparent 1040px)" }}>
      <div
        style={{
          position: "absolute",
          left: -400 + 120 * respira(t, 17),
          top: -200,
          width: 1900,
          height: 2400,
          background: "linear-gradient(112deg, rgba(255,252,242,0) 36%, rgba(255,252,242,0.72) 46%, rgba(255,252,242,0.3) 54%, rgba(255,252,242,0) 63%)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 30% at 88% 3%, rgba(255,250,236,0.78) 0%, rgba(255,250,236,0) 72%)" }} />
    </div>
    {/* borda das folhas de baixo, à direita (o volume do livro) */}
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 10, background: "repeating-linear-gradient(90deg, rgba(92,72,40,0.10) 0 1px, rgba(255,250,236,0.5) 1px 3px)" }} />
    {children}
  </AbsoluteFill>
);

// A folha que vira: gira em volta da lombada (à esquerda), levantando na direção de quem vê.
// `p` = 0 (deitada) → 1 (em pé, sumiu). A sombra dela cai na folha de baixo.
const P = 2600;
export const bordaDaFolha = (theta: number) => 540 + (1080 * Math.cos(theta) - 540) * (P / (P - 1080 * Math.sin(theta)));

export const Virando: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => {
  const k = suave(limitar(p));
  const theta = (k * Math.PI) / 2;
  const borda = bordaDaFolha(theta);
  const sombra = Math.sin(Math.PI * limitar(p)) * 0.26;
  return (
    <>
      {/* sombra na folha de baixo, logo depois da borda da folha que levanta */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: Math.max(-200, borda - 4),
          width: 220,
          background: `linear-gradient(90deg, rgba(40,30,15,${sombra}) 0%, rgba(40,30,15,0) 100%)`,
        }}
      />
      <AbsoluteFill style={{ perspective: P, perspectiveOrigin: "540px 960px" }}>
        <AbsoluteFill style={{ transformOrigin: "0px 960px", transform: `rotateY(${(-k * 90).toFixed(3)}deg)`, backfaceVisibility: "hidden" }}>
          {children}
          {/* a folha escurece e ganha um brilho de dobra conforme levanta */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(90deg, rgba(30,41,69,${0.04 + 0.1 * k}) 0%, rgba(30,41,69,${0.02 * k}) 35%, rgba(255,251,239,${0.18 * k}) 80%, rgba(30,41,69,${0.16 * k}) 100%)`,
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </>
  );
};

// A poeira de luz: por cima das folhas e por baixo da pessoa (o vídeo cobre tudo o que passa atrás
// dela), e sem chegar perto da moldura.
export const Ar: React.FC<{ t: number; caixa: Caixa }> = ({ t, caixa }) => {
  const topo = caixa.y;
  const passeio = respira(t, 17);
  const n = 72;
  const motas = [];
  for (let i = 0; i < n; i++) {
    const s1 = semente(i + 1);
    const s2 = semente(i + 101);
    const s3 = semente(i + 201);
    const s4 = semente(i + 301);
    const grande = i % 9 === 0;
    const r = grande ? 11 + s3 * 9 : 3.6 + s3 * 4.8;
    const vy = -(5 + s2 * 12);
    const H = 1980;
    const y = (((s1 * 2000 + vy * t) % H) + H) % H - 30;
    const x = s4 * 1080 + Math.sin(t / (4 + s2 * 4) + i) * (10 + s3 * 22);
    // fica acima da pessoa e fora da caixa dela (com folga)
    const dentroDaCaixa = x > caixa.x - 20 && x < caixa.x + caixa.w + 20 && y > caixa.y - 20;
    if (y > topo - 16 && dentroDaCaixa) continue;
    if (y > 1900) continue;
    const brilho = (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * (1.2 + s1 * 1.6) + i * 1.7))) * (grande ? 0.5 : 1);
    // um pouco mais forte dentro do facho de luz
    const facho = Math.exp(-Math.pow((x - (700 + 120 * passeio) + y * 0.42) / 260, 2));
    motas.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          background: `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,253,244,0.85) 34%, rgba(255,249,232,0.35) 58%, rgba(255,249,232,0) 74%)`,
          opacity: limitar(brilho * (0.7 + 0.5 * facho)),
        }}
      />,
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {motas}
    </div>
  );
};

// Progresso da virada (0→1) a partir de `de`
export const virada = (t: number, de: number, dur: number) =>
  interpolate(t, [de, de + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.linear });
