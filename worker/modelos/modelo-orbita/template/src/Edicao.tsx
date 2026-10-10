// O modelo Órbita: a pessoa fala em quadro cheio; na virada, a pergunta "E se eu fosse…" e a linha de
// luz que troca a roupa; quando a fala entra na ciência, o fundo vira espaço profundo, a pessoa vai
// para a moldura embaixo e a câmera 3D recua pela escala (a órbita), depois sobe para o céu. Os blocos
// universais acontecem no mesmo espaço, em cima da moldura. Legenda branca com contorno preto.
import React, { useEffect, useMemo, useState } from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases } from "./motor/frases";
import { rostoNaTela } from "./motor/caixa";
import type { Momento, Plano, Raio as RaioM, Virada as ViradaM } from "./plano";
import { COR, AREA, LEGENDA_Y, LEGENDA_Y_MOLDURA, MOLDURA, SORA, fontesCarregadas } from "./tema";
import { caixaDaPessoa, legendaY, noEspaco } from "./layout";
import { GRUA_ANTES, TIPOS_ESPACO, janelasDo, type Estacao } from "./espaco/camera";
import { deslocamento } from "./espaco/deslocamento";
import { Espaco3D } from "./espaco/Espaco3D";
import { Pessoa } from "./Pessoa";
import { Legenda } from "./Legenda";
import { BLOCOS, type Som } from "./blocos/registro";
import { ViradaTitulo } from "./blocos/Virada";
import { Raio } from "./blocos/Raio";

// a assinatura não repete a fala na tela: a legenda continua nela (salvo `legenda: false`)
const COM_LEGENDA = new Set(["orbita", "ceu", "virada", "raio"]);
const comLegenda = (plano: Plano): Plano => ({
  ...plano,
  momentos: plano.momentos.map((m) => (COM_LEGENDA.has(m.tipo) && m.legenda === undefined ? { ...m, legenda: true } : m)),
});

const sonsDo = (plano: Plano): Som[] => {
  if (plano.sfx === false) return [];
  const s: Som[] = [];
  for (const m of plano.momentos) {
    if (m.tipo === "virada") s.push({ t: m.trocaEm - 0.25, src: "sfx/virada.wav", vol: 0.35 });
    const b = BLOCOS[m.tipo];
    if (b?.sons) s.push(...b.sons(m));
  }
  // a grua entre dois momentos do espaço
  for (const j of janelasDo(plano))
    for (const e of j.estacoes) if (e.k > 0 && e.m.tipo !== "ceu" && e.m.tipo !== "orbita") s.push({ t: e.de - GRUA_ANTES, src: "sfx/passa.wav", vol: 0.16 });
  return s.filter((x) => x.t >= 0 && x.t < plano.duracao).sort((a, b) => a.t - b.t);
};

const FundoDoEspaco: React.FC = () => <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COR.espacoAlto} 0%, ${COR.espacoMeio} 45%, ${COR.espaco} 100%)` }} />;

// Guias de conferência (stills com --guias): margem, área da informação, moldura, rosto e legenda.
const Guias: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { caixa } = caixaDaPessoa(plano, t);
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? 1920, t);
  const rot = (txt: string, x: number, y: number, c: string) => <span style={{ position: "absolute", left: x, top: y, fontFamily: SORA, fontSize: 26, fontWeight: 700, color: c }}>{txt}</span>;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 64, top: 120, width: 952, height: 1580, border: "3px dashed #FFD84B", boxSizing: "border-box" }} />
      {rot("margem (nada importante fora)", 72, 126, "#FFD84B")}
      <div style={{ position: "absolute", left: AREA.x, top: AREA.y, width: AREA.w, height: AREA.base - AREA.y, border: "3px dashed #7CFF8A", boxSizing: "border-box" }} />
      {rot("área da informação (no espaço)", AREA.x + 8, AREA.y + 6, "#7CFF8A")}
      <div style={{ position: "absolute", left: MOLDURA.x, top: MOLDURA.y, width: MOLDURA.w, height: MOLDURA.h, border: "3px dashed #FF9BD2", borderRadius: MOLDURA.raio, boxSizing: "border-box" }} />
      {rot("moldura (no espaço)", MOLDURA.x + 12, MOLDURA.y + 8, "#FF9BD2")}
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.62, width: r.largura, height: r.largura * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: 0, top: LEGENDA_Y, width: 1080, borderTop: "3px dashed #FFFFFF" }} />
      {rot("legenda (quadro cheio)", 72, LEGENDA_Y + 6, "#FFFFFF")}
      <div style={{ position: "absolute", left: 0, top: LEGENDA_Y_MOLDURA, width: 1080, borderTop: "3px dashed #FFB36B" }} />
      {rot("legenda (moldura)", 72, LEGENDA_Y_MOLDURA + 6, "#FFB36B")}
      <div style={{ position: "absolute", left: 0, top: 1700, width: 1080, borderTop: "3px dashed #FF6B6B" }} />
      {rot("nada importante abaixo (interface do app)", 72, 1706, "#FF6B6B")}
    </AbsoluteFill>
  );
};

const universal = (m: Momento) => TIPOS_ESPACO.has(m.tipo) && m.tipo !== "orbita" && m.tipo !== "ceu";

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const [espera] = useState(() => delayRender("fontes"));
  useEffect(() => {
    fontesCarregadas.then(() => continueRender(espera)).catch(() => continueRender(espera));
  }, [espera]);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const frases = useMemo(() => montarFrases(comLegenda(plano)), [plano]);
  const sons = useMemo(() => sonsDo(plano), [plano]);
  const { p, janela } = noEspaco(plano, t);
  const corpos = useMemo(() => (janela ? janela.estacoes.map((e) => BLOCOS[e.m.tipo]?.corpos?.(plano, e) ?? []) : []), [janela, plano]);
  const ativas: Estacao[] = janela ? janela.estacoes.filter((e) => t >= e.de - GRUA_ANTES - 0.15 && t <= e.fim) : [];
  const proxEm = (e: Estacao) => {
    const n = janela?.estacoes[e.k + 1];
    return n ? n.de - GRUA_ANTES : null;
  };
  const viradas = plano.momentos.filter((m): m is ViradaM => m.tipo === "virada");
  const raios = plano.momentos.filter((m): m is RaioM => m.tipo === "raio");

  const camada = (qual: "Fundo" | "Atras" | "Frente") =>
    ativas.map((e) => {
      const B = BLOCOS[e.m.tipo]?.[qual];
      if (!B) return null;
      const el = <B key={`${qual}${e.de}`} plano={plano} e={e} t={t} proxEm={proxEm(e)} />;
      if (!universal(e.m)) return el;
      const d = deslocamento(plano, e, t);
      return (
        <div key={`${qual}${e.de}`} style={{ position: "absolute", inset: 0, transform: `translate(${d.dx.toFixed(2)}px, ${d.dy.toFixed(2)}px)` }}>
          {el}
        </div>
      );
    });

  return (
    <AbsoluteFill style={{ background: COR.espaco }}>
      {janela && p > 0 ? (
        <>
          <FundoDoEspaco />
          {camada("Fundo")}
          <Espaco3D plano={plano} janela={janela} t={t} alfa={1} corpos={corpos} />
          {camada("Atras")}
        </>
      ) : null}
      <Pessoa plano={plano} t={t} />
      {janela && p > 0 ? camada("Frente") : null}
      {raios.map((m, i) => (
        <Raio key={i} plano={plano} m={m} t={t} />
      ))}
      {viradas.map((m, i) => (
        <ViradaTitulo key={i} m={m} t={t} />
      ))}
      <Legenda frases={frases} t={t} y={legendaY(plano, t)} />
      {plano.trilha ? <Audio src={staticFile(plano.trilha)} volume={plano.trilhaVolume ?? 0.12} loop /> : null}
      {sons.map((s, i) => (
        <Sequence key={i} from={Math.round(s.t * fps)} durationInFrames={Math.round(4 * fps)} layout="none">
          <Audio src={staticFile(s.src)} volume={s.vol} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
